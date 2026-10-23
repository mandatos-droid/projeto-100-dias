import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { PREDITORES, OBJ_ESPECIFICOS, objetivos, arvore, podeAcrescentarMeta, contagemMetas, desmarcaPreditor, normalizaMeta, alternaPreditor, MAX_PREDITORES, MAX_METAS_POR_OBJETIVO } from '../lib/plano.ts';

type D = { campos?: Record<string, string>; preditores?: unknown; metas?: unknown; rumo?: unknown };

test('PREDITORES e OBJ_ESPECIFICOS do TS são idênticos aos de conteudo.js (paridade)', () => {
  const ctx: Record<string, unknown> = {};
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL('../public/legacy/conteudo.js', import.meta.url), 'utf8') + ';this.P = PREDITORES; this.O = OBJ_ESPECIFICOS;', ctx);
  const viaJson = (v: unknown) => JSON.parse(JSON.stringify(v));
  assert.deepEqual(viaJson(PREDITORES), viaJson(ctx.P));
  assert.deepEqual(viaJson(OBJ_ESPECIFICOS), viaJson(ctx.O));
  assert.equal(PREDITORES.length, 5);
});

test('objetivos: um por preditor escolhido, com o texto de m3.obj.{pid} ou o nome do preditor (RUM-20.2)', () => {
  const d: D = { preditores: ['p2', 'p1'], campos: { 'm3.obj.p2': 'Ser referência nacional na defesa do fim do trabalho infantil', 'm3.obj.p1': '   ' } };
  const o = objetivos(d);
  assert.deepEqual(o.map((x) => x.pid), ['p2', 'p1'], 'na ordem escolhida');
  assert.equal(o[0].texto, 'Ser referência nacional na defesa do fim do trabalho infantil');
  assert.equal(o[1].texto, 'Priorizar a agenda', 'vazio vale o nome do preditor');
  assert.equal(o[1].nome, 'Priorizar a agenda');
});

test('objetivos ignora preditor desconhecido e repetido, e D.preditores inválido (RUM-70)', () => {
  assert.deepEqual(objetivos({ preditores: ['p1', 'zz', 'p1', 7, null] }).map((x) => x.pid), ['p1']);
  assert.deepEqual(objetivos({ preditores: 'lixo' }), []);
  assert.deepEqual(objetivos({}), []);
});

test('alternaPreditor marca, desmarca e recusa o quarto citando quais desmarcar (RUM-20.3)', () => {
  const d: D = { preditores: ['p1', 'p2'] };
  assert.deepEqual(alternaPreditor(d, 'p3').preditores, ['p1', 'p2', 'p3']);
  assert.deepEqual(alternaPreditor(d, 'p1').preditores, ['p2']);
  const cheio: D = { preditores: ['p1', 'p2', 'p3'] };
  const x = alternaPreditor(cheio, 'p4');
  assert.ok(x.erro);
  assert.deepEqual(x.preditores, ['p1', 'p2', 'p3'], 'não grava o quarto');
  PREDITORES.slice(0, 3).forEach((p) => assert.match(x.erro!, new RegExp(p.n)));
  assert.match(x.erro!, /desmarque/i);
  assert.equal(MAX_PREDITORES, 3);
  assert.deepEqual(cheio.preditores, ['p1', 'p2', 'p3'], 'não altera o recebido');
});

test('desmarcaPreditor informa quantas metas serão afetadas e limpa pred delas sem apagá-las (RUM-21.4)', () => {
  const d: D = { preditores: ['p1', 'p2'], metas: [
    { pred: 'p1', texto: 'A', resp: 'Ana', apoio: 'Bia' }, { pred: 'p2', texto: 'B' }, { pred: 'p1', texto: 'C' },
  ] };
  const r = desmarcaPreditor(d, 'p1');
  assert.equal(r.afetadas, 2);
  assert.deepEqual(r.patch.preditores, ['p2']);
  assert.equal(r.patch.metas.length, 3, 'nenhuma meta some');
  assert.deepEqual(r.patch.metas.map((m) => m.texto), ['A', 'B', 'C']);
  assert.ok(!r.patch.metas[0].pred && !r.patch.metas[2].pred);
  assert.equal(r.patch.metas[1].pred, 'p2');
  assert.equal(r.patch.metas[0].resp, 'Ana');
  assert.equal((d.metas as { pred: string }[])[0].pred, 'p1', 'não altera o recebido');
  assert.equal(desmarcaPreditor(d, 'p2').afetadas, 1);
  assert.equal(desmarcaPreditor({ preditores: ['p3'] }, 'p3').afetadas, 0);
});

test('podeAcrescentarMeta nega sem preditor e aponta a etapa de preditores (RUM-30.2)', () => {
  const r = podeAcrescentarMeta({ preditores: [] }, 'p1');
  assert.equal(r.ok, false);
  assert.match(r.motivo!, /preditores/i);
});

test('podeAcrescentarMeta exige escolher um objetivo da lista (RUM-30.1)', () => {
  const d: D = { preditores: ['p1'] };
  assert.equal(podeAcrescentarMeta(d, '').ok, false);
  assert.equal(podeAcrescentarMeta(d, 'p2').ok, false);
  assert.equal(podeAcrescentarMeta(d, 'p1').ok, true);
});

test('podeAcrescentarMeta nega a quinta meta do mesmo objetivo e libera outro objetivo (RUM-30.15)', () => {
  const quatro = (pred: string) => Array.from({ length: 4 }, (_, i) => ({ pred, texto: `m${i}` }));
  const d: D = { preditores: ['p1', 'p2'], metas: quatro('p1') };
  const x = podeAcrescentarMeta(d, 'p1');
  assert.equal(x.ok, false);
  assert.match(x.motivo!, /4/);
  assert.equal(MAX_METAS_POR_OBJETIVO, 4);
  assert.equal(podeAcrescentarMeta(d, 'p2').ok, true);
  assert.equal(podeAcrescentarMeta({ preditores: ['p1'], metas: quatro('p1').slice(0, 3) }, 'p1').ok, true);
});

test('contagemMetas: abaixo com 9, ok com 10 e 16, acima com 17 (RUM-30.14)', () => {
  const n = (k: number): D => ({ metas: Array.from({ length: k }, () => ({ texto: 'x' })) });
  assert.deepEqual(contagemMetas(n(0)), { n: 0, faixa: 'abaixo' });
  assert.deepEqual(contagemMetas(n(9)), { n: 9, faixa: 'abaixo' });
  assert.equal(contagemMetas(n(10)).faixa, 'ok');
  assert.equal(contagemMetas(n(16)).faixa, 'ok');
  assert.deepEqual(contagemMetas(n(17)), { n: 17, faixa: 'acima' });
  assert.deepEqual(contagemMetas({ metas: 'lixo' }), { n: 0, faixa: 'abaixo' });
});

test('arvore agrupa as metas por objetivo e põe as sem pred em semObjetivo', () => {
  const d: D = {
    preditores: ['p1', 'p2'], campos: { 'm3.legado': 'Marta se reelege', 'm3.b1': 'Educação', 'm3.mural': 'Educação' },
    metas: [{ pred: 'p2', texto: 'B' }, { pred: 'p1', texto: 'A' }, { texto: 'sem' }, { pred: 'p9', texto: 'preditor que sumiu' }, { pred: 'p1', texto: 'C', status: 'concluida' }],
  };
  const a = arvore(d);
  assert.equal(a.legado, 'Marta se reelege');
  assert.deepEqual(a.bandeiras, ['Educação']);
  assert.deepEqual(a.objetivos.map((o) => [o.pid, o.metas.map((m) => m.texto)]), [['p1', ['A', 'C']], ['p2', ['B']]]);
  assert.deepEqual(a.semObjetivo.map((m) => m.texto), ['sem', 'preditor que sumiu']);
  assert.deepEqual(a.objetivos[0].metas.map((m) => m.idx), [1, 4], 'idx é a posição em D.metas');
  assert.deepEqual(a.objetivos[1].metas.map((m) => m.idx), [0]);
  assert.equal(a.objetivos[0].metas[0].status, 'nao_concluida');
});

test('arvore sem nada devolve estrutura vazia, sem exceção', () => {
  const a = arvore({});
  assert.deepEqual([a.legado, a.bandeiras, a.objetivos, a.semObjetivo], ['', [], [], []]);
});

test('normalizaMeta aplica o status padrão e mantém o texto (RUM-70)', () => {
  const m = normalizaMeta({ pred: 'p1', texto: 'Aprovar', resp: 'Ana', apoio: 'Bia' });
  assert.equal(m.status, 'nao_concluida');
  assert.equal(m.texto, 'Aprovar');
});
