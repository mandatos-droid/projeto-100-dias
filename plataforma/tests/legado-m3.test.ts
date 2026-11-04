import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { passoPreditoresConcluido } from '../lib/estrategia.ts';

/* m3.js é o arquivo de ganchos da Missão 3 sobre o Guia legado. Aqui ele roda numa "janela" com globais simuladas,
   e o conteudo.js real é lido para provar que os textos do Guia não mudam (RUM-12.11, RUM-70). */
const CODIGO = readFileSync(new URL('../public/legacy/m3.js', import.meta.url), 'utf8');
const CONTEUDO = readFileSync(new URL('../public/legacy/conteudo.js', import.meta.url), 'utf8');

/* Hash do JSON inteiro da Missão 3 (itens, listaExtra, ct, prazo e todos os exercícios), calculado sobre o conteudo.js de antes da feature. */
const HASH_TEXTOS = '318f86b99e245a6d6fe61b809729b61e407d632d32819216dbff2cb7f170dee3';
/* Hashes dos mesmos JSONs depois da troca "objetivo(s) específico(s)" por "objetivo(s) estratégico(s)" (RM3-42): só o termo muda, o resto do texto fica igual. */
const HASH_M3_ESTRATEGICO = 'd55cfbc009ac90590c8352226920158437bf3ae32646e0656654f0322114f988'; // atualizado: m3.js também troca "Lembre-se que" por "Lembre-se de que" (sugestão 32)
const HASH_M5_ESTRATEGICO = '1a032f6a51a9571199bf3341dd0c02d2d3fdf8ca89fba5bf07b0b8e191ced93b';

type Ex = Record<string, unknown> & { id: string; intro: string; fim?: string; listaExtra?: { titulo: string; chave: string } };
type Missao = Record<string, unknown> & { n: number; exercicios: Ex[] };

function guia(extra: Record<string, unknown> = {}) {
  const ctx: Record<string, unknown> = { ...extra };
  vm.createContext(ctx);
  vm.runInContext(`${CONTEUDO};this.MISSOES=MISSOES;`, ctx);
  return ctx as { MISSOES: Missao[] } & Record<string, unknown>;
}
function hashDosTextos(missoes: Missao[], n = 3) {
  const m = missoes.find((x) => x.n === n)!;
  return createHash('sha256').update(JSON.stringify(m)).digest('hex');
}
const ex3 = (w: { MISSOES: Missao[] }, id: string) => w.MISSOES.find((m) => m.n === 3)!.exercicios.find((e) => e.id === id)!;

/* ---------- textos intocáveis (RUM-12.11) ---------- */
test('os textos da Missão 3 do conteudo.js batem com o hash gravado antes dos ganchos (RUM-12.11)', () => {
  assert.equal(hashDosTextos(guia().MISSOES), HASH_TEXTOS);
});

/* Ajustado em m23-T2: o hash antigo (HASH_TEXTOS) passou a valer só para o conteudo.js cru, porque o m3.js agora troca a nomenclatura (RM3-42). */
test('carregar o m3.js só troca "objetivo específico" por "objetivo estratégico" na Missão 3: o resto do texto fica igual (RM3-42, RUM-70)', () => {
  const w = guia({ Comp: { campos: () => '', lista: () => '' }, esc: (s: string) => s });
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  assert.equal(hashDosTextos(w.MISSOES), HASH_M3_ESTRATEGICO);
});

test('carregar o m3.js só troca o termo também na Missão 5 (RM3-42)', () => {
  const w = guia({ Comp: { campos: () => '', lista: () => '' }, esc: (s: string) => s });
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  assert.equal(hashDosTextos(w.MISSOES, 5), HASH_M5_ESTRATEGICO);
});

test('nenhuma string de MISSOES contém "objetivo específico" depois da carga (RM3-42, RM3-44)', () => {
  const w = guia({ Comp: { campos: () => '', lista: () => '' }, esc: (s: string) => s });
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  assert.match(JSON.stringify(guia().MISSOES), /objetivos?\s+espec/i, 'o conteudo.js cru ainda tem o termo antigo');
  assert.doesNotMatch(JSON.stringify(w.MISSOES), /objetivos?\s+espec/i);
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

test('Comp.preditores devolve as ilhas dos preditores e, abaixo, a da estratégia; Comp.metas devolve a das metas (RUM-21, RUM-30, RM3-10)', () => {
  const w = janela();
  assert.equal(w.Comp.preditores(), '<div class="ilha" data-ilha="rumo-preditores"></div><div class="ilha" data-ilha="rumo-estrategia"></div>');
  assert.equal(w.Comp.metas(), '<div class="ilha" data-ilha="rumo-metas"></div>');
});

/* ---------- passos do modo guiado: a ilha entra em um passo só, entre a introdução e o fecho ---------- */
const ks = (ps: { k: string }[]) => [...ps.map((p) => p.k)]; // cópia no realm do teste (o array do vm tem outro protótipo)

test('m3.bandeiras no modo guiado: introdução, a ilha, o fecho "No futuro" e a lista de comissões, nesta ordem (RUM-01, RUM-51.9)', () => {
  const w = janela();
  assert.deepEqual(ks(w.Guia.montar(ex3(w, 'm3.bandeiras'))), ['intro', 'componente', 'fim', 'listaExtra']);
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

test('o texto "No futuro" segue no fecho, que é um passo próprio antes dos espaços (sugestão #11 da Alana)', () => {
  const w = janela();
  const passos = [...w.Guia.montar(ex3(w, 'm3.bandeiras'))].map((p) => p.k);
  assert.ok(passos.indexOf('fim') < passos.indexOf('listaExtra'));
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
  assert.ok(tela.innerHTML.includes('os objetivos estratégicos'));
  assert.equal(tela.innerHTML.includes('específic'), false);
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

/* ---------- apresentação sobre o Guia (sugestões #3, #8 e #10 da Alana): o texto não muda, só aparece em mais lugares ---------- */
function janelaComBloco() {
  const ctx = {
    Guia: {
      m: { cor: '#123' },
      ex: null as unknown,
      montar: () => [],
      bloco(p: { k: string }) {
        const ex = this.ex as { t: string; intro: string };
        if (p.k === 'intro') return `<div class="texto">${ex.intro}</div>`;
        return '<h1>t</h1><div class="texto"></div><div class="ilha" data-ilha="rumo-bandeiras"></div>';
      },
    },
    Comp: { campos: ORIGINAL, preditores: () => '', metas: () => '', lista: () => '' },
    esc: (s: string) => String(s),
  };
  const w = guia(ctx);
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  const Guia = (w as unknown as { Guia: { ex: unknown; bloco(p: { k: string }, n: number): string } }).Guia;
  return { w: w as unknown as { MISSOES: Missao[] }, Guia };
}

test('os exemplos de agendas viram quadradinhos separados na introdução, sem perder nenhum item (sugestão #3)', () => {
  const { w, Guia } = janelaComBloco();
  Guia.ex = ex3(w, 'm3.bandeiras');
  const html = Guia.bloco({ k: 'intro' }, 0);
  assert.ok(html.includes('<ul class="ex-chips">'));
  assert.equal((html.match(/<li>/g) ?? []).length, 19);
  assert.ok(html.includes('<li>população lgbtqiap+</li>'));
});

test('o passo da ilha mostra "Como conduzir" com os três passos do Guia, antes do mural (sugestões #8 e #10)', () => {
  const { w, Guia } = janelaComBloco();
  const ex = ex3(w, 'm3.bandeiras');
  Guia.ex = ex;
  const html = Guia.bloco({ k: 'componente' }, 1);
  assert.ok(html.indexOf('Como conduzir') < html.indexOf('data-ilha="rumo-bandeiras"'));
  assert.ok(html.includes('Primeiro passo:') && html.includes('Segundo passo:') && html.includes('Terceiro passo:'));
  assert.ok(html.includes((ex.passos as string[])[2]));
});

test('outros exercícios não recebem o bloco de passos nem os quadradinhos', () => {
  const { w, Guia } = janelaComBloco();
  Guia.ex = ex3(w, 'm3.legado');
  assert.equal(Guia.bloco({ k: 'componente' }, 1).includes('Como conduzir'), false);
});

/* ---------- m3.preditores: conclusão pela estratégia (RM3-06, RMX-01) ---------- */
const PRED = { id: 'm3.preditores', tipo: 'preditores' };
const CINCO = { 'm3.just.p1': 'a', 'm3.just.p2': 'b', 'm3.just.p3': 'c', 'm3.just.p4': 'd', 'm3.just.p5': 'e' };
function comPreditores(preditores: unknown, campos: Record<string, string>) {
  const ctx = {
    D: { campos, preditores },
    Guia: { montar: () => [] },
    Comp: { campos: ORIGINAL, preditores: () => '', metas: () => '', lista: () => '' },
    esc: (s: string) => s,
    temConteudo: (ex: { tipo: string }) => (ex.tipo === 'preditores' ? (preditores as unknown[]).length > 0 : false), // o do Guia
  };
  const w = guia(ctx);
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  return (w as unknown as { temConteudo(ex: unknown): boolean }).temConteudo(PRED);
}

test('m3.preditores: sem estratégia e com justificativas começadas, não conta; com 3 preditores, estratégia e 5 justificativas, conta (RM3-06)', () => {
  assert.equal(comPreditores(['p1', 'p2'], { 'm3.est': 'a', ...CINCO }), false, 'só 2 preditores');
  assert.equal(comPreditores(['p1', 'p2', 'p3'], { 'm3.est': 'x', 'm3.just.p1': 'a' }), false, 'estratégia inválida');
  assert.equal(comPreditores([], { 'm3.just.p1': 'a' }), false, 'sem preditores nem estratégia');
  assert.equal(comPreditores(['p1', 'p2', 'p3'], { 'm3.est': 'a', ...CINCO }), true);
  assert.equal(comPreditores(['p1', 'p2', 'p3'], { 'm3.est': 'c', ...CINCO }), true);
  assert.equal(comPreditores(['p1', 'p2', 'p3'], { 'm3.est': 'a', ...CINCO, 'm3.just.p5': '  ' }), false, 'falta uma justificativa');
});

test('m3.preditores na opção B exige a frase dos 3 preditores escolhidos (RM3-13)', () => {
  const b = { 'm3.est': 'b', ...CINCO, 'm3.obj.p1': 'f1', 'm3.obj.p2': 'f2' };
  assert.equal(comPreditores(['p1', 'p2', 'p3'], b), false);
  assert.equal(comPreditores(['p1', 'p2', 'p3'], { ...b, 'm3.obj.p3': 'f3' }), true);
});

test('mandato antigo, só com D.preditores (e m3.obj), segue contando como preenchido (RMX-01)', () => {
  assert.equal(comPreditores(['p1'], {}), true);
  assert.equal(comPreditores(['p1', 'p2', 'p3'], { 'm3.obj.p1': 'Priorizar a educação' }), true);
  assert.equal(comPreditores([], {}), false);
});

test('a regra de m3.js para o fluxo novo é a mesma de passoPreditoresConcluido em lib/estrategia.ts', () => {
  const ids = [['p1', 'p2', 'p3'], ['p1', 'p2'], ['p2', 'p4', 'p5']];
  const campos: Record<string, string>[] = [
    { 'm3.est': 'a', ...CINCO }, { 'm3.est': 'b', ...CINCO }, { 'm3.est': 'b', ...CINCO, 'm3.obj.p1': 'x', 'm3.obj.p2': 'y', 'm3.obj.p3': 'z' },
    { 'm3.est': 'c', ...CINCO, 'm3.just.p4': '' }, { 'm3.est': 'q', ...CINCO }, { ...CINCO }, { ...CINCO, 'm3.obj.p2': 'y' },
    { 'm3.est': 'b', ...CINCO, 'm3.obj.p2': 'y', 'm3.obj.p4': 'w', 'm3.obj.p5': 'v' },
  ];
  for (const p of ids) for (const c of campos) assert.equal(comPreditores(p, c), passoPreditoresConcluido(c, p), JSON.stringify([p, c]));
});

/* ---------- Resumo do exercício dos preditores (RM3-18) ---------- */
function resumoDe(preditores: unknown, campos: Record<string, string>, tipo = 'preditores') {
  const ctx = {
    D: { campos, preditores },
    Guia: { montar: () => [] },
    Comp: { campos: ORIGINAL, preditores: () => '', metas: () => '', lista: () => '' },
    esc: (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    temConteudo: () => false,
    Resumo: { sem: '<span class="sem">não preenchido</span>', ex: () => 'original' },
  };
  const w = guia(ctx);
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  return (w as unknown as { Resumo: { ex(ex: unknown): string } }).Resumo.ex({ id: 'm3.preditores', tipo });
}

test('Resumo com a estratégia A: "Estratégia: A", o nome de cada preditor como objetivo estratégico e as 5 justificativas (RM3-18)', () => {
  const h = resumoDe(['p1', 'p2', 'p3'], { 'm3.est': 'a', ...CINCO, 'm3.obj.p1': 'frase que a A ignora' });
  assert.ok(h.includes('Estratégia: <strong>A</strong>'));
  assert.ok(h.includes('<dt>Priorizar a agenda</dt><dd>Priorizar a agenda</dd>'));
  assert.equal(h.includes('frase que a A ignora'), false);
  assert.ok(h.includes('<strong>Construir o partido</strong> (escolhido): c'));
  assert.ok(h.includes('<strong>Protagonizar espaços de decisão</strong> (não escolhido): d'));
  assert.equal(h.match(/<li><strong>/g)!.length, 5);
});

test('Resumo com a B mostra a frase de cada preditor, ou o nome se a frase estiver vazia (RM3-13, RM3-18)', () => {
  const h = resumoDe(['p1', 'p2', 'p3'], { 'm3.est': 'b', ...CINCO, 'm3.obj.p1': 'Foco em três temas', 'm3.obj.p2': '  ' });
  assert.ok(h.includes('Estratégia: <strong>B</strong>'));
  assert.ok(h.includes('<dt>Priorizar a agenda</dt><dd>Foco em três temas</dd>'));
  assert.ok(h.includes('<dt>Pautar os debates</dt><dd>Pautar os debates</dd>'));
});

test('Resumo com a C lista as 3 frases da Legisla como referência e mantém o nome de cada preditor (RM3-14, RM3-18)', () => {
  const h = resumoDe(['p1', 'p2', 'p3'], { 'm3.est': 'c' });
  assert.ok(h.includes('Estratégia: <strong>C</strong>'));
  assert.ok(h.includes('<li>Avanço Legislativo</li><li>Expansão de Capital Político e Influência</li><li>Governança Estratégica</li>'));
  assert.ok(h.includes('<dt>Construir o partido</dt><dd>Construir o partido</dd>'));
  assert.ok(h.includes('(não escolhido): <span class="sem">não preenchido</span>'), 'justificativa vazia aparece como não preenchida');
});

test('Resumo escapa o texto digitado nas justificativas e nas frases (segurança)', () => {
  const h = resumoDe(['p1', 'p2', 'p3'], { 'm3.est': 'b', 'm3.obj.p1': '<img src=x>', 'm3.just.p1': '<script>1</script>\nsegunda linha' });
  assert.equal(h.includes('<img'), false);
  assert.equal(h.includes('<script>'), false);
  assert.ok(h.includes('&lt;script&gt;1&lt;/script&gt;<br>segunda linha'));
});

test('Resumo sem estratégia nem preditores mostra o estado antigo, sem erro (RMX-01)', () => {
  assert.equal(resumoDe([], {}), 'original');
  assert.equal(resumoDe([], { 'm3.est': 'zzz' }), 'original');
  assert.equal(resumoDe('lixo', {}), 'original');
});

test('Resumo de mandato antigo (D.preditores e m3.obj, sem m3.est) assume a B e mostra a frase gravada (RMX-01)', () => {
  const h = resumoDe(['p1'], { 'm3.obj.p1': 'Priorizar a educação' });
  assert.ok(h.includes('Estratégia: <strong>B</strong>'));
  assert.ok(h.includes('<dt>Priorizar a agenda</dt><dd>Priorizar a educação</dd>'));
});

test('Resumo de outro tipo de exercício passa para o do Guia', () => {
  assert.equal(resumoDe(['p1'], { 'm3.est': 'a' }, 'metas'), 'original');
});
