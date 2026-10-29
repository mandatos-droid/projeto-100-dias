import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/* m3.js é o arquivo de ganchos da Missão 3 sobre o Guia legado. Aqui ele roda numa "janela" com globais simuladas,
   e o conteudo.js real é lido para provar que os textos do Guia não mudam (RUM-12.11, RUM-70). */
const CODIGO = readFileSync(new URL('../public/legacy/m3.js', import.meta.url), 'utf8');
const CONTEUDO = readFileSync(new URL('../public/legacy/conteudo.js', import.meta.url), 'utf8');

/* Hash do JSON inteiro da Missão 3 (itens, listaExtra, ct, prazo e todos os exercícios), calculado sobre o conteudo.js de antes da feature. */
const HASH_TEXTOS = '318f86b99e245a6d6fe61b809729b61e407d632d32819216dbff2cb7f170dee3';

type Ex = Record<string, unknown> & { id: string; intro: string; fim?: string; listaExtra?: { titulo: string; chave: string } };
type Missao = Record<string, unknown> & { n: number; exercicios: Ex[] };

function guia(extra: Record<string, unknown> = {}) {
  const ctx: Record<string, unknown> = { ...extra };
  vm.createContext(ctx);
  vm.runInContext(`${CONTEUDO};this.MISSOES=MISSOES;`, ctx);
  return ctx as { MISSOES: Missao[] } & Record<string, unknown>;
}
function hashDosTextos(missoes: Missao[]) {
  const m = missoes.find((x) => x.n === 3)!;
  return createHash('sha256').update(JSON.stringify(m)).digest('hex');
}
const ex3 = (w: { MISSOES: Missao[] }, id: string) => w.MISSOES.find((m) => m.n === 3)!.exercicios.find((e) => e.id === id)!;

/* ---------- textos intocáveis (RUM-12.11) ---------- */
test('os textos da Missão 3 do conteudo.js batem com o hash gravado antes dos ganchos (RUM-12.11)', () => {
  assert.equal(hashDosTextos(guia().MISSOES), HASH_TEXTOS);
});

test('carregar o m3.js não muda nenhum texto da Missão 3 (RUM-12.11, RUM-70)', () => {
  const w = guia({ Comp: { campos: () => '', lista: () => '' }, esc: (s: string) => s });
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  assert.equal(hashDosTextos(w.MISSOES), HASH_TEXTOS);
});

test('o bloco de referência das metas e o texto "No futuro" continuam nos textos do Guia (RUM-21, RUM-30, RUM-50)', () => {
  const w = guia();
  assert.ok(ex3(w, 'm3.metas').intro.includes('<div id="blocoMetasRef"></div>'));
  assert.ok(ex3(w, 'm3.bandeiras').fim!.includes('No futuro'));
  assert.ok(ex3(w, 'm3.legado').intro.includes('Exemplos de manchetes'));
});

/* ---------- ganchos ---------- */
const ORIGINAL = (ex: { id: string }) => `original:${ex.id}`;
function janela() {
  const ctx = {
    Guia: { montar: (ex: { id: string }) => [{ k: `original:${ex.id}` }] },
    Comp: { campos: ORIGINAL, preditores: () => 'antigo', metas: () => 'antigo', lista: (l: { chave: string }, dono: string) => `<lista ${l.chave} ${dono}>` },
    esc: (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'),
  };
  const w = guia(ctx);
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  return w as unknown as { MISSOES: Missao[]; Comp: { campos(ex: unknown): string; preditores(): string; metas(): string; lista(ex: unknown, dono: string): string }; Guia: { montar(ex: unknown): { k: string }[] } };
}

test('Comp.campos devolve a ilha de bandeiras para m3.bandeiras, sem os campos m3.* de texto (RUM-01, RUM-12)', () => {
  const w = janela();
  const html = w.Comp.campos(ex3(w, 'm3.bandeiras'));
  assert.ok(html.startsWith('<div class="ilha" data-ilha="rumo-bandeiras"></div>'));
  assert.equal(html.includes('data-k="m3.'), false);
  assert.equal(html.includes('<lista'), false); // a lista de comissões é um passo próprio (Guia.montar)
});

test('Comp.campos devolve só a ilha do Legado para m3.legado (RUM-10)', () => {
  const w = janela();
  assert.equal(w.Comp.campos(ex3(w, 'm3.legado')), '<div class="ilha" data-ilha="rumo-legado"></div>');
});

test('qualquer outro exercício passa direto para o Comp.campos anterior, entrada antiga e nova', () => {
  const w = janela();
  assert.equal(w.Comp.campos({ id: 'm1.q1' }), 'original:m1.q1');
  assert.equal(w.Comp.campos({ id: 'm2.funcoes' }), 'original:m2.funcoes');
  assert.equal(w.Comp.campos({ id: 'm3.outro' }), 'original:m3.outro');
});

test('Comp.preditores e Comp.metas devolvem os contêineres das ilhas (RUM-21, RUM-30)', () => {
  const w = janela();
  assert.equal(w.Comp.preditores(), '<div class="ilha" data-ilha="rumo-preditores"></div>');
  assert.equal(w.Comp.metas(), '<div class="ilha" data-ilha="rumo-metas"></div>');
});

/* ---------- passos do modo guiado: a ilha entra em um passo só, entre a introdução e o fecho ---------- */
const ks = (ps: { k: string }[]) => [...ps.map((p) => p.k)]; // cópia no realm do teste (o array do vm tem outro protótipo)

test('m3.bandeiras no modo guiado: introdução, a ilha, a lista de comissões e o fecho "No futuro", nesta ordem (RUM-01, RUM-51.9)', () => {
  const w = janela();
  assert.deepEqual(ks(w.Guia.montar(ex3(w, 'm3.bandeiras'))), ['intro', 'componente', 'listaExtra', 'fim']);
});

test('m3.legado no modo guiado: introdução, a ilha e o fecho, sem passos de campo solto (RUM-10, RUM-12.11)', () => {
  const w = janela();
  assert.deepEqual(ks(w.Guia.montar(ex3(w, 'm3.legado'))), ['intro', 'componente', 'fim']);
});

test('os passos de qualquer outro exercício vêm do Guia.montar anterior', () => {
  const w = janela();
  assert.deepEqual(w.Guia.montar({ id: 'm3.metas' }), [{ k: 'original:m3.metas' }]);
  assert.deepEqual(w.Guia.montar({ id: 'm1.q1' }), [{ k: 'original:m1.q1' }]);
});

/* ---------- espaços pretendidos (RUM-50, RUM-51.9) ---------- */
test('a lista de comissões do Guia vira a ilha de espaços; qualquer outra lista passa direto (RUM-50)', () => {
  const w = janela();
  const ex = ex3(w, 'm3.bandeiras').listaExtra!;
  assert.equal(ex.chave, 'comissoesDesejadas');
  assert.equal(w.Comp.lista(ex, 'm3.bandeiras'), '<div class="ilha" data-ilha="rumo-espacos"></div>');
  assert.equal(w.Comp.lista({ chave: 'outraLista' }, 'x'), '<lista outraLista x>');
});

test('o texto "No futuro" segue no fecho, que é um passo próprio depois dos espaços (RUM-51.9)', () => {
  const w = janela();
  const passos = [...w.Guia.montar(ex3(w, 'm3.bandeiras'))].map((p) => p.k);
  assert.ok(passos.indexOf('listaExtra') < passos.indexOf('fim'));
  assert.ok(ex3(w, 'm3.bandeiras').fim!.includes('No futuro'));
});

/* ---------- conclusão dos exercícios pelo estado novo (RUM-02, RUM-11, RUM-70) ---------- */
function comEstado(D: Record<string, unknown>) {
  const ctx = {
    D,
    Guia: { montar: () => [] },
    Comp: { campos: ORIGINAL, preditores: () => '', metas: () => '', lista: () => '' },
    esc: (s: string) => s,
    temConteudo: (ex: { tipo: string }) => ex.tipo === 'perguntas',
  };
  const w = guia(ctx);
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  return w as unknown as { temConteudo(ex: { id?: string; tipo: string }): boolean };
}
const BAND = { id: 'm3.bandeiras', tipo: 'campos' };
const LEG = { id: 'm3.legado', tipo: 'campos' };
const bandeira = (prioridade: number | null) => ({ id: 'educacao', rot: 'Educação', argumentos: '', notas: {}, prioridade });

test('mandato antigo com texto em m3.legado continua contando como exercício feito (RUM-70)', () => {
  assert.equal(comEstado({ campos: { 'm3.legado': 'Joaquim José: a educação no centro' } }).temConteudo(LEG), true);
});

test('mandato novo com a edição fechada conta como feito; sem texto e sem edição fechada, não conta (RUM-11.8)', () => {
  assert.equal(comEstado({ campos: {}, rumo: { legado: { fechado: true } } }).temConteudo(LEG), true);
  assert.equal(comEstado({ campos: {}, rumo: { legado: { fechado: false } } }).temConteudo(LEG), false);
  assert.equal(comEstado({ campos: {} }).temConteudo(LEG), false);
  assert.equal(comEstado({ campos: { 'm3.legado': '   ', 'm3.cargo': 'Senador(a)' } }).temConteudo(LEG), false, 'só o cargo escolhido ainda não é Legado');
});

test('m3.bandeiras conta com m3.b1 preenchido ou com uma prioritária em D.rumo (RUM-02)', () => {
  assert.equal(comEstado({ campos: { 'm3.b1': 'Educação' } }).temConteudo(BAND), true);
  assert.equal(comEstado({ campos: {}, rumo: { bandeiras: [bandeira(null), bandeira(2)] } }).temConteudo(BAND), true);
});

test('m3.bandeiras sem nenhuma prioritária não conta, mesmo com mural e argumentos (RUM-02)', () => {
  assert.equal(comEstado({ campos: { 'm3.mural': 'Educação', 'm3.argumentos': 'Educação: muita demanda' } }).temConteudo(BAND), false);
  assert.equal(comEstado({ campos: {}, rumo: { bandeiras: [bandeira(null)] } }).temConteudo(BAND), false);
  assert.equal(comEstado({ campos: {}, rumo: 'corrompido' }).temConteudo(BAND), false);
});

test('a checagem dos outros exercícios é a do Guia (preditores e metas ficam como estão)', () => {
  const w = comEstado({ campos: {} });
  assert.equal(w.temConteudo({ id: 'm1.q1', tipo: 'perguntas' }), true);
  assert.equal(w.temConteudo({ id: 'm3.metas', tipo: 'metas' }), false);
});

/* ---------- rota #/plano, menu e Painel (RUM-43) ---------- */
function janelaPlano(hash: string) {
  const chamadas: string[] = [];
  const tela = { innerHTML: '', className: '' };
  const ctx: Record<string, unknown> = {
    location: { hash },
    window: { scrollTo: () => chamadas.push('scrollTo'), Ilhas: { ligar: () => chamadas.push('ligar') } },
    document: { getElementById: (id: string) => (id === 'tela' ? tela : null) },
    Telas: { painel: () => chamadas.push('painel') },
    App: {
      ultima: '', menu: () => chamadas.push('menu'), marcar: () => chamadas.push('marcar'), lateral: () => chamadas.push('lateral'),
      rotear() { chamadas.push('original'); },
    },
  };
  vm.createContext(ctx);
  vm.runInContext(CONTEUDO + ';this.MISSOES=MISSOES;', ctx);
  vm.runInContext(CODIGO, ctx);
  return { ctx: ctx as { App: { rotear(): void; ultima: string }; Telas: { plano(): void } }, chamadas, tela };
}

test('#/plano renderiza a ilha "plano" com os passos finais do rotear e não chama o roteador original (RUM-43.4)', () => {
  const { ctx, chamadas, tela } = janelaPlano('#/plano');
  ctx.App.rotear();
  assert.ok(tela.innerHTML.includes('<div class="ilha" data-ilha="plano"></div>'));
  assert.ok(tela.innerHTML.includes('Planejamento Estratégico'));
  assert.equal(tela.className, 'tela largo');
  assert.equal(chamadas.includes('original'), false);
  assert.ok(chamadas.includes('ligar'));
  assert.deepEqual(chamadas.filter((c) => c === 'marcar' || c === 'lateral'), ['marcar', 'lateral']);
  assert.equal(ctx.App.ultima, '#/plano');
});

test('qualquer outra rota segue para o roteador original (#/, #/resumo, #/m/3)', () => {
  for (const h of ['#/', '', '#/resumo', '#/m/3/m3.metas', '#/planos']) {
    const { ctx, chamadas } = janelaPlano(h);
    ctx.App.rotear();
    assert.deepEqual(chamadas, ['original'], `hash "${h}"`);
  }
});

test('carregar o m3.js sem Telas ou App (outras janelas de teste) não falha (RUM-70)', () => {
  const w = guia({ Comp: { campos: () => '', lista: () => '' } });
  assert.doesNotThrow(() => vm.runInContext(CODIGO, w as unknown as vm.Context));
});
