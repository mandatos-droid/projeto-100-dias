import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CRITERIOS_GUIA, total, defineNota, ranking, alternaPrioritaria, adicionaCriterio, removeCriterio, MAX_CRITERIOS } from '../lib/criterios.ts';
import type { BandeiraRumo, Rumo } from '../lib/rumo.ts';

const band = (id: string, notas: Record<string, number> = {}, prioridade: number | null = null): BandeiraRumo => ({ id, rot: id.toUpperCase(), argumentos: '', notas, prioridade });
const rumo = (bandeiras: BandeiraRumo[], criterios = CRITERIOS_GUIA): Rumo => ({
  v: 1, criterios: criterios.map((c) => ({ ...c })), bandeiras,
  legado: { el: { protagonista: '', entrega: '', resultado: '', cargo: '' }, manchete: '', manual: false, jornal: 'A Gazeta do Mandato', fechado: false, rascunhos: [] },
});

test('o Guia oferece 4 critérios (RUM-01.3)', () => {
  assert.equal(CRITERIOS_GUIA.length, 4);
  assert.ok(CRITERIOS_GUIA.every((c) => c.guia));
});

test('total soma as notas inteiras de 0 a 5 dos critérios existentes (RUM-01.4)', () => {
  const [a, b, c, d] = CRITERIOS_GUIA.map((x) => x.id);
  assert.equal(total(band('x', { [a]: 5, [b]: 3, [c]: 0, [d]: 1 }), CRITERIOS_GUIA), 9);
  assert.equal(total(band('x'), CRITERIOS_GUIA), 0);
  assert.equal(total(band('x', { [a]: 4, fora: 5 }), CRITERIOS_GUIA), 4, 'nota de critério que não existe não conta');
});

test('nota fora da faixa ou não inteira não conta no total (RUM-01.4)', () => {
  const [a, b, c, d] = CRITERIOS_GUIA.map((x) => x.id);
  assert.equal(total(band('x', { [a]: 6, [b]: -1, [c]: 2.5, [d]: 2 }), CRITERIOS_GUIA), 2);
});

test('defineNota recusa nota fora da faixa ou não inteira e não altera nada (RUM-01.4)', () => {
  const r = rumo([band('educacao')]);
  const id = CRITERIOS_GUIA[0].id;
  for (const n of [6, -1, 2.5, Number.NaN]) {
    const x = defineNota(r, 'educacao', id, n);
    assert.ok(x.erro, `nota ${n}`);
    assert.deepEqual(x.rumo.bandeiras[0].notas, {});
  }
  const ok = defineNota(r, 'educacao', id, 4);
  assert.equal(ok.erro, undefined);
  assert.deepEqual(ok.rumo.bandeiras[0].notas, { [id]: 4 });
  assert.deepEqual(r.bandeiras[0].notas, {}, 'não altera o rumo recebido');
});

test('ranking ordena por total desc e desempata pela ordem de entrada (RUM-01.5)', () => {
  const id = CRITERIOS_GUIA[0].id;
  const r = ranking([band('a', { [id]: 2 }), band('b', { [id]: 5 }), band('c', { [id]: 2 })], CRITERIOS_GUIA);
  assert.deepEqual(r.map((x) => x.id), ['b', 'a', 'c']);
  assert.deepEqual(r.map((x) => x.total), [5, 2, 2]);
});

test('ranking só marca sugeridas com 2 ou mais bandeiras com nota e no máximo 3 (RUM-01.5)', () => {
  const id = CRITERIOS_GUIA[0].id;
  const uma = ranking([band('a', { [id]: 5 }), band('b')], CRITERIOS_GUIA);
  assert.ok(uma.every((x) => !x.sugerida));
  const duas = ranking([band('a', { [id]: 5 }), band('b', { [id]: 1 }), band('c')], CRITERIOS_GUIA);
  assert.deepEqual(duas.map((x) => [x.id, x.sugerida]), [['a', true], ['b', true], ['c', false]]);
  const cinco = ranking(['a', 'b', 'c', 'd', 'e'].map((k, i) => band(k, { [id]: 5 - i })), CRITERIOS_GUIA);
  assert.deepEqual(cinco.filter((x) => x.sugerida).map((x) => x.id), ['a', 'b', 'c']);
});

test('alternaPrioritaria marca na ordem de confirmação (RUM-02.6)', () => {
  let r = rumo([band('a'), band('b'), band('c')]);
  r = alternaPrioritaria(r, 'c').rumo;
  r = alternaPrioritaria(r, 'a').rumo;
  assert.deepEqual(r.bandeiras.map((b) => [b.id, b.prioridade]), [['a', 2], ['b', null], ['c', 1]]);
});

test('alternaPrioritaria recusa a quarta e cita as que podem ser desmarcadas (RUM-02.7)', () => {
  const r = rumo([band('alfa', {}, 1), band('beta', {}, 2), band('gama', {}, 3), band('delta')]);
  const x = alternaPrioritaria(r, 'delta');
  assert.match(x.erro!, /ALFA/);
  assert.match(x.erro!, /BETA/);
  assert.match(x.erro!, /GAMA/);
  assert.match(x.erro!, /desmarque/i);
  assert.equal(x.rumo, r, 'devolve o mesmo rumo, sem gravar');
});

test('desmarcar uma prioritária preserva a ordem das outras (RUM-02.6)', () => {
  const r = rumo([band('a', {}, 1), band('b', {}, 2), band('c', {}, 3)]);
  const x = alternaPrioritaria(r, 'a');
  assert.equal(x.erro, undefined);
  assert.deepEqual(x.rumo.bandeiras.map((b) => [b.id, b.prioridade]), [['a', null], ['b', 1], ['c', 2]]);
  assert.equal(r.bandeiras[0].prioridade, 1, 'não altera o rumo recebido');
});

test('alternaPrioritaria com id desconhecido não altera nada', () => {
  const r = rumo([band('a')]);
  const x = alternaPrioritaria(r, 'zzz');
  assert.ok(x.erro);
  assert.equal(x.rumo, r);
});

test('adicionaCriterio acrescenta e para em 8 critérios (RUM-01.3)', () => {
  let r = rumo([]);
  for (let i = 0; i < MAX_CRITERIOS - 4; i++) {
    const x = adicionaCriterio(r, `Critério próprio ${i}`);
    assert.equal(x.erro, undefined);
    r = x.rumo;
  }
  assert.equal(r.criterios.length, 8);
  assert.equal(r.criterios.filter((c) => !c.guia).length, 4);
  const nono = adicionaCriterio(r, 'Mais um');
  assert.ok(nono.erro);
  assert.equal(nono.rumo.criterios.length, 8);
  assert.equal(new Set(r.criterios.map((c) => c.id)).size, 8, 'ids únicos');
});

test('adicionaCriterio recusa nome vazio (RUM-01.3)', () => {
  assert.ok(adicionaCriterio(rumo([]), '   ').erro);
});

test('removeCriterio tira o critério e as notas dele, de qualquer um dos 4 (RUM-01.3)', () => {
  const [a, b] = CRITERIOS_GUIA.map((x) => x.id);
  const r = rumo([band('x', { [a]: 5, [b]: 2 }), band('y', { [a]: 1 })]);
  const x = removeCriterio(r, a);
  assert.equal(x.rumo.criterios.some((c) => c.id === a), false);
  assert.deepEqual(x.rumo.bandeiras.map((bd) => bd.notas), [{ [b]: 2 }, {}]);
  assert.equal(r.criterios.length, 4, 'não altera o rumo recebido');
  assert.deepEqual(r.bandeiras[0].notas, { [a]: 5, [b]: 2 });
});
