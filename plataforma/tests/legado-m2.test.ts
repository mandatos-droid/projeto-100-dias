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

test('Comp.funcoes devolve só o contêiner da escalação, sem campos m2.f (MEQ-01, T-27)', () => {
  const w = janela();
  assert.equal(w.Comp.funcoes(), '<div class="ilha" data-ilha="equipe-escalacao"></div>');
  assert.equal(w.Comp.funcoes().includes('data-k="m2.f'), false);
});

test('o texto da escalação não fala de bandeira nem de escopo; o de m2.gestao traz organograma, rotinas e entrega nesta ordem (MEQ-01, MEQ-06, T-27)', () => {
  const w = janela();
  const f = ex(w, 'm2.funcoes'), g = ex(w, 'm2.gestao');
  assert.equal(/bandeira|escopo/i.test(f.intro + f.d), false);
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

/* ---------- contadores do Guia e Resumo (MEQ-24, T-28) ---------- */
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

test('mandato antigo com 20 nomes mostra "20 de 20 cargos", como antes (MEQ-24, T-28)', () => {
  const w = comDados(nomes20());
  assert.equal(w.Telas.estadoTxt(FUNCOES, 'ok'), 'Em andamento · 20 de 20 cargos');
});

test('mandato novo com m2.on de 12 cadeiras e 5 nomes mostra "5 de 12 cargos" (MEQ-24, T-28)', () => {
  const on = [0, 1, 2, 7, 8, 9, 10, 11, 12, 17, 18, 19].join('|');
  const w = comDados({ 'm2.on': on, 'm2.f1': 'A', 'm2.f2': 'B', 'm2.f3': 'C', 'm2.f8': 'D', 'm2.f9': '*' });
  assert.equal(w.Telas.estadoTxt(FUNCOES, 'andamento'), 'Em andamento · 5 de 12 cargos');
});

test('sem nada escolhido nem escrito o total segue o do modelo, 20 (MEQ-24, T-28)', () => {
  assert.equal(comDados({}).Telas.estadoTxt(FUNCOES, 'nao'), 'Em andamento · 0 de 20 cargos');
});

test('outros exercícios não são alterados pelos contadores (MEQ-24)', () => {
  const w = comDados({ 'm2.f1': 'A' });
  assert.equal(w.Telas.estadoTxt({ tipo: 'metas' }, 'ok'), 'Em andamento · 0 de 20 cargos');
  assert.equal(w.Resumo.ex({ tipo: 'metas' }), 'original');
  assert.equal(w.temConteudo({ tipo: 'metas' }), false);
});

test('temConteudo da escalação é verdadeiro com nome ou com áreas escolhidas, falso sem nada (MEQ-24)', () => {
  assert.equal(comDados({}).temConteudo(FUNCOES), false);
  assert.equal(comDados({ 'm2.f3': 'Ana' }).temConteudo(FUNCOES), true);
  assert.equal(comDados({ 'm2.coords': 'Legislativo' }).temConteudo(FUNCOES), true);
  assert.equal(comDados({ 'm2.on': '0|20', 'm2.f21': 'Extra' }).temConteudo(FUNCOES), true);
});

test('o Resumo lista só as cadeiras ativas com nome e marca o * como processo seletivo (MEQ-24, T-28)', () => {
  const w = comDados({ 'm2.on': '0|7|20', 'm2.f1': 'Ana', 'm2.f8': '*', 'm2.f21': 'Extra', 'm2.p21.nome_cargo': 'Assessor especial', 'm2.f5': 'Fora da lista' });
  const h = w.Resumo.ex(FUNCOES);
  assert.ok(h.includes('Cargos preenchidos (3 de 3)'));
  assert.ok(h.includes('Cargo 1: <strong>Ana</strong>'));
  assert.ok(h.includes('Cargo 8: <strong>*</strong> <em>(processo seletivo a abrir)</em>'));
  assert.ok(h.includes('Assessor especial: <strong>Extra</strong>'));
  assert.equal(h.includes('Fora da lista'), false);
});

test('sem ninguém com nome o Resumo mostra "não preenchido" (MEQ-24)', () => {
  assert.ok(comDados({}).Resumo.ex(FUNCOES).includes('não preenchido'));
});

test('o Resumo escapa o nome do cargo e o da pessoa (MEQ-24)', () => {
  const w = comDados({ 'm2.on': '0', 'm2.f1': 'Ana <b>&</b>', 'm2.p1.nome_cargo': '<i>Chefe</i>' });
  const h = w.Resumo.ex(FUNCOES);
  assert.ok(h.includes('&lt;i&gt;Chefe&lt;/i&gt;: <strong>Ana &lt;b&gt;&amp;&lt;/b&gt;</strong>'));
  assert.equal(h.includes('<i>'), false);
});
