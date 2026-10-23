import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/* m3.js é o arquivo de ganchos da Missão 3 sobre o Guia legado. Aqui ele roda numa "janela" com globais simuladas,
   e o conteudo.js real é lido para provar que os textos do Guia não mudam (RUM-12.11, RUM-70). */
const CODIGO = readFileSync(new URL('../public/legacy/m3.js', import.meta.url), 'utf8');
const CONTEUDO = readFileSync(new URL('../public/legacy/conteudo.js', import.meta.url), 'utf8');

/* Hash gravado na T11, antes de qualquer mudança, sobre os textos da Missão 3 e dos 4 exercícios. */
const HASH_TEXTOS = '87baff53f9594c8c189a2a90d20944af90b724c601ac7386cabd5e36d3449ffc';
const CAMPOS_MISSAO = ['titulo', 'curto', 'abre', 'agenda', 'resumo', 'entrega', 'momento', 'lidera', 'fecho'];
const CAMPOS_EX = ['id', 't', 'd', 'intro', 'passos', 'fim'];

type Ex = Record<string, unknown> & { id: string; intro: string; fim?: string; listaExtra?: { titulo: string } };
type Missao = Record<string, unknown> & { n: number; exercicios: Ex[] };

function guia(extra: Record<string, unknown> = {}) {
  const ctx: Record<string, unknown> = { ...extra };
  vm.createContext(ctx);
  vm.runInContext(`${CONTEUDO};this.MISSOES=MISSOES;`, ctx);
  return ctx as { MISSOES: Missao[] } & Record<string, unknown>;
}
const pega = (obj: Record<string, unknown>, campos: string[]) => Object.fromEntries(campos.map((k) => [k, obj[k]]));
function hashDosTextos(missoes: Missao[]) {
  const m = missoes.find((x) => x.n === 3)!;
  const o = { missao: pega(m, CAMPOS_MISSAO), ex: m.exercicios.map((e) => pega(e, CAMPOS_EX)) };
  return createHash('sha256').update(JSON.stringify(o)).digest('hex');
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
    Comp: { campos: ORIGINAL, preditores: () => 'antigo', metas: () => 'antigo', lista: (l: { chave: string }, dono: string) => `<lista ${l.chave} ${dono}>` },
    esc: (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'),
  };
  const w = guia(ctx);
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  return w as unknown as { MISSOES: Missao[]; Comp: { campos(ex: unknown): string; preditores(): string; metas(): string } };
}

test('Comp.campos devolve a ilha de bandeiras para m3.bandeiras, sem os campos m3.* de texto (RUM-01, RUM-12)', () => {
  const w = janela();
  const html = w.Comp.campos(ex3(w, 'm3.bandeiras'));
  assert.ok(html.startsWith('<div class="ilha" data-ilha="rumo-bandeiras"></div>'));
  assert.equal(html.includes('data-k="m3.'), false);
});

test('m3.bandeiras mantém o título e a lista de comissões do Guia até a ilha de espaços (RUM-51.9)', () => {
  const w = janela();
  const html = w.Comp.campos(ex3(w, 'm3.bandeiras'));
  assert.ok(html.includes('<h4>Comissões e espaços que o mandato pretende compor</h4>'));
  assert.ok(html.includes('<lista comissoesDesejadas m3.bandeiras>'));
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
