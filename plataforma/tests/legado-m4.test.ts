import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/* m4.js é o arquivo de ganchos da Missão 4 sobre o Guia legado. Aqui ele roda numa "janela" com globais simuladas,
   e o conteudo.js real é lido para provar que os textos do Guia não mudam (CAP-21.9, CAP-40). */
const CODIGO = readFileSync(new URL('../public/legacy/m4.js', import.meta.url), 'utf8');
const CONTEUDO = readFileSync(new URL('../public/legacy/conteudo.js', import.meta.url), 'utf8');

/* Hashes do conteudo.js de antes da feature: o JSON inteiro da Missão 4 (t, d, intro, fim, entrega, itens, campos...) e o BINGOS (frentes e ações). */
const HASH_MISSAO4 = 'd852535b0589a45fffc49b8e4a822aec61a6f6df42d838789c2fd7533de0412c';
const HASH_BINGOS = '970fc89d9dc694913ad47b3d3a7d867152d3181be54eec13605a165aac54cbd7';

type Ex = Record<string, unknown> & { id: string; t: string; d: string; intro?: string; fim?: string; tipo: string };
type Missao = Record<string, unknown> & { n: number; entrega: string[]; exercicios: Ex[] };
type Janela = { MISSOES: Missao[]; BINGOS: Record<string, unknown> } & Record<string, unknown>;

function guia(extra: Record<string, unknown> = {}) {
  const ctx: Record<string, unknown> = { ...extra };
  vm.createContext(ctx);
  vm.runInContext(`${CONTEUDO};this.MISSOES=MISSOES;this.BINGOS=BINGOS;`, ctx);
  return ctx as Janela;
}
const sha = (o: unknown) => createHash('sha256').update(JSON.stringify(o)).digest('hex');
const hashMissao4 = (w: Janela) => sha(w.MISSOES.find((x) => x.n === 4));
const ex4 = (w: Janela, id: string) => w.MISSOES.find((m) => m.n === 4)!.exercicios.find((e) => e.id === id)!;

/* ---------- textos intocáveis (CAP-21.9, CAP-40) ---------- */
test('os textos da Missão 4 do conteudo.js batem com o hash gravado antes dos ganchos (CAP-21.9)', () => {
  assert.equal(hashMissao4(guia()), HASH_MISSAO4);
});

test('os bingos (frentes e ações recomendadas) batem com o hash gravado (CAP-10, CAP-40)', () => {
  assert.equal(sha(guia().BINGOS), HASH_BINGOS);
});

test('alterar um caractere de qualquer texto da Missão 4 muda o hash e o teste falharia (CAP-21.9)', () => {
  const w = guia();
  const m = w.MISSOES.find((x) => x.n === 4)!;
  const alvos: [string, () => string, (v: string) => void][] = [
    ['titulo do exercício t', () => m.exercicios[0].t, (v) => { m.exercicios[0].t = v; }],
    ['d', () => m.exercicios[1].d, (v) => { m.exercicios[1].d = v; }],
    ['intro', () => m.exercicios[0].intro!, (v) => { m.exercicios[0].intro = v; }],
    ['fim', () => m.exercicios[0].fim!, (v) => { m.exercicios[0].fim = v; }],
    ['entrega', () => m.entrega[0], (v) => { m.entrega[0] = v; }],
  ];
  for (const [nome, ler, gravar] of alvos) {
    const original = ler();
    gravar(original + '.');
    assert.notEqual(hashMissao4(w), HASH_MISSAO4, nome);
    gravar(original);
    assert.equal(hashMissao4(w), HASH_MISSAO4, `${nome} restaurado`);
  }
  const b = guia();
  (b.BINGOS.articulacao as { itens: string[] }).itens[0] += '.';
  assert.notEqual(sha(b.BINGOS), HASH_BINGOS, 'bingos');
});

test('carregar o m4.js não muda nenhum texto da Missão 4 nem os bingos (CAP-21.9, CAP-40)', () => {
  const w = guia({ Comp: { lista: () => '', bingo: () => '', checklist: () => '' } });
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  assert.equal(hashMissao4(w), HASH_MISSAO4);
  assert.equal(sha(w.BINGOS), HASH_BINGOS);
});

/* ---------- ganchos: um por exercício, o resto passa direto (CAP-40) ---------- */
function janela() {
  const ctx = { Comp: { lista: (l: { chave: string }) => `original:lista:${l.chave}`, bingo: () => 'original:bingo', checklist: (e: { id: string }) => `original:checklist:${e.id}` } };
  const w = guia(ctx);
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  return w as Janela & { Comp: { lista(e: unknown, dono?: string): string; bingo(e: unknown): string; checklist(e: unknown): string } };
}

test('m4.comissoes abre a ilha capital-comissoes; outras listas do Guia passam direto', () => {
  const w = janela();
  const ex = ex4(w, 'm4.comissoes') as Ex & { chave: string };
  assert.equal(ex.tipo, 'lista');
  assert.equal(w.Comp.lista(ex), '<div class="ilha" data-ilha="capital-comissoes"></div>');
  assert.equal(w.Comp.lista({ chave: 'comissoesDesejadas' }, 'm3.bandeiras'), 'original:lista:comissoesDesejadas');
});

test('m4.acoes abre a ilha capital-acoes', () => {
  const w = janela();
  const ex = ex4(w, 'm4.acoes');
  assert.equal(ex.tipo, 'bingo');
  assert.equal(w.Comp.bingo(ex), '<div class="ilha" data-ilha="capital-acoes"></div>');
});

test('m4.metricas abre a ilha capital-comunicacao; outros checklists passam direto', () => {
  const w = janela();
  const ex = ex4(w, 'm4.metricas');
  assert.equal(ex.tipo, 'checklist');
  assert.equal(w.Comp.checklist(ex), '<div class="ilha" data-ilha="capital-comunicacao"></div>');
  assert.equal(w.Comp.checklist({ id: 'm2.outro' }), 'original:checklist:m2.outro');
});

test('carregar o m4.js sem Comp (outras janelas de teste) não falha', () => {
  const w = guia();
  assert.doesNotThrow(() => vm.runInContext(CODIGO, w as unknown as vm.Context));
});
