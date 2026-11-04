import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/* m2.js é o arquivo de ganchos da Missão 2 sobre o Guia legado. Aqui ele roda numa "janela" com globais simuladas. */
const CODIGO = readFileSync(new URL('../public/legacy/m2.js', import.meta.url), 'utf8');

type Ex = { id: string; t: string; d: string; tipo: string; intro: string; itens?: { k: string; t: string }[] };
const ITENS = [{ k: 'm2.c1', t: 'Escopo de trabalho de cada cargo definido' }, { k: 'm2.c2', t: 'Organograma do mandato projetado visualmente' }, { k: 'm2.c3', t: 'Fluxos de trabalho e rotinas de comunicação estabelecidos' }];

function janela(extra: Record<string, unknown> = {}) {
  const ctx: Record<string, unknown> = {
    Comp: { funcoes: () => '<input data-k="m2.f1">' },
    MISSOES: [
      { n: 1, exercicios: [{ id: 'm1.q1', tipo: 'perguntas', intro: 'm1' }] },
      { n: 2, exercicios: [
        { id: 'm2.funcoes', t: 'A escalação do time', d: 'antigo', tipo: 'funcoes', intro: 'antigo, fale das bandeiras' },
        { id: 'm2.gestao', t: 'Organograma e rotinas', d: 'antigo', tipo: 'checklist', intro: 'antigo', itens: ITENS.map((i) => ({ ...i })) },
      ] },
    ],
    ...extra,
  };
  vm.createContext(ctx);
  vm.runInContext(CODIGO, ctx);
  return ctx as { Comp: { funcoes(): string }; MISSOES: { n: number; exercicios: Ex[] }[] } & Record<string, unknown>;
}
const ex = (w: ReturnType<typeof janela>, id: string) => w.MISSOES[1].exercicios.find((e) => e.id === id)!;

/* ---------- Mão na massa 1 (RM2-01, RM2-02) ---------- */
test('Comp.funcoes devolve a tabela de equipe e, abaixo, o organograma, sem campos m2.f (RM2-01)', () => {
  const w = janela();
  const h = w.Comp.funcoes();
  const a = h.indexOf('<div class="ilha" data-ilha="equipe-tabela"></div>'), b = h.indexOf('<div class="ilha" data-ilha="organograma"></div>');
  assert.ok(a >= 0 && b > a, `ordem das ilhas: ${a}, ${b}`);
  assert.equal(h.includes('data-k="m2.f'), false);
  assert.equal(h.includes('equipe-escalacao'), false);
});

test('o exercício 1 traz o texto do documento: abertura, passo a passo numerado e incentivo ao processo seletivo (RM2-01, RM2-07)', () => {
  const w = janela();
  const f = ex(w, 'm2.funcoes');
  assert.ok(f.intro.includes('Ao invés de encaixar pessoas em cargos, nossa recomendação é que seja feito o exercício contrário.'));
  assert.ok(f.intro.includes('encaixe de perfis específicos com cargos coerentes'));
  assert.equal(/bandeira/i.test(f.intro + f.d), false);
  const h = w.Comp.funcoes();
  assert.equal(h.match(/<ol class="passos-m2">/g)?.length, 1);
  assert.equal((h.match(/<li[ >]/g) ?? []).length, 8);
  const ordem = ['entregas objetivadas', 'quantidade de pessoas', 'escopo de trabalho', 'competências comportamentais', 'nome do cargo', 'nome da pessoa', 'categoria', 'área do mandato'].map((t) => h.indexOf(t));
  assert.ok(ordem.every((p, k) => p > 0 && (k === 0 || p > ordem[k - 1])), `ordem dos passos: ${ordem}`);
  assert.ok(h.includes('Caso não haja pessoas que se encaixem nos requisitos, encorajamos o mandato a abrir processo seletivo e aumentar a diversidade e a representatividade dentro da equipe!'));
});

test('o passo "clareza sobre as entregas e agendas" aparece marcado com a Missão 1 preenchida e só com link quando não (RM2-02)', () => {
  const feito = janela({ estadoEx: () => 'ok' }).Comp.funcoes();
  assert.ok(feito.includes('<li class="passo-feito">'));
  assert.ok(feito.includes('href="#/m/1"'));
  for (const estado of ['nao', 'andamento']) {
    // um exercício da Missão 1 sem conteúdo basta para não marcar; o link continua, sem bloquear
    const w = janela({
      MISSOES: [{ n: 1, exercicios: [{ id: 'm1.a' }, { id: 'm1.b' }] }, { n: 2, exercicios: [] }],
      estadoEx: (e: { id: string }) => (e.id === 'm1.a' ? 'ok' : estado),
    });
    const h = w.Comp.funcoes();
    assert.equal(h.includes('passo-feito'), estado === 'andamento', estado);
    assert.ok(h.includes('href="#/m/1"'), estado);
  }
  assert.equal(janela().Comp.funcoes().includes('passo-feito'), false); // sem estadoEx no legado, não marca
});

test('o texto de m2.gestao traz organograma, rotinas e entrega nesta ordem (MEQ-01, MEQ-06)', () => {
  const w = janela();
  const g = ex(w, 'm2.gestao');
  const a = g.intro.indexOf('data-ilha="organograma"'), b = g.intro.indexOf('data-ilha="rotinas"'), c = g.intro.indexOf('data-ilha="entrega"');
  assert.ok(a > 0 && b > a && c > b, `ordem das ilhas: ${a}, ${b}, ${c}`);
  assert.equal(g.intro.includes('data-ilha="recomenda-cargos"'), false);
});

test('o checklist m2.c1..c3 e os tipos dos exercícios continuam como no Guia original (MEQ-01, T-27)', () => {
  const w = janela();
  assert.equal(ex(w, 'm2.funcoes').tipo, 'funcoes');
  assert.equal(ex(w, 'm2.gestao').tipo, 'checklist');
  assert.deepEqual(ex(w, 'm2.gestao').itens, ITENS);
  assert.equal(w.MISSOES[0].exercicios[0].intro, 'm1'); // outras missões intactas
});

/* ---------- contadores do Guia e Resumo: linhas completas da tabela (RM2-09, RMX-02) ---------- */
const CARGOS = Array.from({ length: 20 }, (_, i) => [`Cargo ${i + 1}`, '', '']);
function comDados(campos: Record<string, unknown>) {
  const w = janela({
    D: { campos },
    CARGOS_EQUIPE: CARGOS,
    esc: (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    temConteudo: () => false,
    Telas: { estadoTxt: () => 'Em andamento · 0 de 20 cargos' },
    Resumo: { sem: '<span class="sem">não preenchido</span>', ex: () => 'original' },
  });
  return w as unknown as {
    temConteudo(ex: { tipo: string }): boolean;
    Telas: { estadoTxt(ex: { tipo: string }, e: string): string };
    Resumo: { ex(ex: { tipo: string }): string; sem: string };
  };
}
const FUNCOES = { tipo: 'funcoes' };
const nomes20 = () => Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`m2.f${i + 1}`, `Pessoa ${i + 1}`]));
/** linha da tabela nova (cadeira i) com as seis colunas */
const completa = (i: number, pessoa: string, cargo = 'Assessor') => ({
  [`m2.p${i + 1}.esc`]: 'Escopo', [`m2.p${i + 1}.comp`]: 'Competências', [`m2.p${i + 1}.nome_cargo`]: cargo,
  [`m2.f${i + 1}`]: pessoa, [`m2.p${i + 1}.cat`]: 'Executora', [`m2.p${i + 1}.coord`]: 'Legislativo',
});

test('mandato novo com m2.n mostra "X de N linhas completas": só conta a linha com as seis colunas (RM2-09)', () => {
  const c = { 'm2.n': '3', 'm2.on': '0|20|21', ...completa(0, 'Ana', 'Chefe'), ...completa(20, 'Bia'), 'm2.p22.esc': 'Só escopo', 'm2.f22': 'Caio' };
  assert.equal(comDados(c).Telas.estadoTxt(FUNCOES, 'andamento'), 'Em andamento · 2 de 3 linhas completas');
  assert.equal(comDados({ ...c, 'm2.p21.coord': '' }).Telas.estadoTxt(FUNCOES, 'andamento'), 'Em andamento · 1 de 3 linhas completas');
});

test('sem nada escolhido nem escrito não há linhas: "0 de 0 linhas completas" (RM2-03, RM2-09)', () => {
  assert.equal(comDados({}).Telas.estadoTxt(FUNCOES, 'nao'), 'Em andamento · 0 de 0 linhas completas');
});

test('mandato antigo continua contando como preenchido e conta as linhas completas pelo formato antigo (RMX-02)', () => {
  const w = comDados(nomes20());
  assert.equal(w.temConteudo(FUNCOES), true);
  assert.equal(w.Telas.estadoTxt(FUNCOES, 'andamento'), 'Em andamento · 0 de 20 linhas completas'); // nomes sem escopo nem competências
  const extras = Array.from({ length: 20 }, (_, i) => [[`m2.p${i + 1}.escopo`, 'Elaborar propostas'], [`m2.p${i + 1}.hab_dest`, 'Organização|Empatia']]).flat();
  const cheio = { ...nomes20(), ...Object.fromEntries(extras) };
  assert.equal(comDados(cheio).Telas.estadoTxt(FUNCOES, 'andamento'), 'Em andamento · 20 de 20 linhas completas');
  assert.equal(comDados({ ...cheio, 'm2.p3.escopo': '', 'm2.p3.espec': 'Só texto livre' }).Telas.estadoTxt(FUNCOES, 'andamento'), 'Em andamento · 20 de 20 linhas completas');
  assert.equal(comDados({ ...cheio, 'm2.p3.hab_dest': '' }).Telas.estadoTxt(FUNCOES, 'andamento'), 'Em andamento · 19 de 20 linhas completas');
});

test('outros exercícios não são alterados pelos contadores (MEQ-24)', () => {
  const w = comDados({ 'm2.f1': 'A' });
  assert.equal(w.Telas.estadoTxt({ tipo: 'metas' }, 'ok'), 'Em andamento · 0 de 20 cargos');
  assert.equal(w.Resumo.ex({ tipo: 'metas' }), 'original');
  assert.equal(w.temConteudo({ tipo: 'metas' }), false);
});

test('temConteudo da tabela é verdadeiro com N, nome, qualquer coluna nova ou áreas escolhidas, falso sem nada (RM2-09, RMX-02)', () => {
  assert.equal(comDados({}).temConteudo(FUNCOES), false);
  assert.equal(comDados({ 'm2.f3': 'Ana' }).temConteudo(FUNCOES), true);
  assert.equal(comDados({ 'm2.coords': 'Legislativo' }).temConteudo(FUNCOES), true);
  assert.equal(comDados({ 'm2.on': '0|20', 'm2.f21': 'Extra' }).temConteudo(FUNCOES), true);
  assert.equal(comDados({ 'm2.n': '4', 'm2.on': '0|20|21|22' }).temConteudo(FUNCOES), true);
  assert.equal(comDados({ 'm2.n': '2', 'm2.on': '0|20', 'm2.p21.esc': 'Só escopo' }).temConteudo(FUNCOES), true);
});

test('o Resumo lista só as linhas completas, com cargo, pessoa, categoria e área, e marca o * como processo seletivo (RM2-09)', () => {
  const w = comDados({
    'm2.n': '4', 'm2.on': '0|20|21|22', ...completa(0, 'Ana', 'Chefe'), 'm2.p1.cat': 'Chefia', 'm2.p1.coord': 'Chefia de área',
    ...completa(20, '*', 'Assessor especial'), 'm2.p22.esc': 'Incompleta', 'm2.f22': 'Caio', 'm2.f5': 'Fora da lista',
  });
  const h = w.Resumo.ex(FUNCOES);
  assert.ok(h.includes('Linhas completas (2 de 4)'));
  assert.ok(h.includes('Chefe: <strong>Ana</strong> · Chefia · Chefia de gabinete'));
  assert.ok(h.includes('Assessor especial: <strong>*</strong> <em>(processo seletivo a abrir)</em> · Executora · Legislativo'));
  assert.equal(h.includes('Caio'), false);
  assert.equal(h.includes('Fora da lista'), false);
});

test('o Resumo do mandato antigo usa o cargo do modelo e não inventa categoria nem área (RMX-02)', () => {
  const w = comDados({ 'm2.on': '0', 'm2.f1': 'Ana', 'm2.p1.escopo': 'Coordenar', 'm2.p1.hab_dest': 'Liderança' });
  const h = w.Resumo.ex(FUNCOES);
  assert.ok(h.includes('Linhas completas (1 de 1)'));
  assert.ok(h.includes('<li>Cargo 1: <strong>Ana</strong></li>'));
});

test('sem nenhuma linha completa o Resumo mostra "não preenchido" (RM2-09)', () => {
  assert.ok(comDados({}).Resumo.ex(FUNCOES).includes('não preenchido'));
  assert.ok(comDados({ 'm2.n': '2', 'm2.on': '0|20', 'm2.f1': 'Ana' }).Resumo.ex(FUNCOES).includes('não preenchido'));
});

test('o Resumo escapa o cargo e a pessoa (segurança)', () => {
  const w = comDados({ 'm2.n': '1', 'm2.on': '0', ...completa(0, 'Ana <b>&</b>', '<i>Chefe</i>') });
  const h = w.Resumo.ex(FUNCOES);
  assert.ok(h.includes('&lt;i&gt;Chefe&lt;/i&gt;: <strong>Ana &lt;b&gt;&amp;&lt;/b&gt;</strong>'));
  assert.equal(h.includes('<i>'), false);
});
