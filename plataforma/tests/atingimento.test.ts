import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STATUS, pctMeta, pctObjetivo, pctTotal } from '../lib/atingimento.ts';

test('STATUS tem os 4 status pedidos, com rótulo e porcentagem', () => {
  assert.deepEqual(STATUS.map((s) => s.id), ['concluida', 'concluida70', 'nao_concluida', 'congelada']);
  assert.deepEqual(STATUS.map((s) => s.pct), [100, 70, 0, null]);
  assert.ok(STATUS.every((s) => s.rot.length > 3));
});

test('pctMeta: 100, 70, 0 e null para concluída, concluída 70%, não concluída e congelada (RUM-41.4)', () => {
  assert.equal(pctMeta('concluida'), 100);
  assert.equal(pctMeta('concluida70'), 70);
  assert.equal(pctMeta('nao_concluida'), 0);
  assert.equal(pctMeta('congelada'), null);
});

test('meta sem status, ou com status desconhecido, conta como 0 (edge case)', () => {
  assert.equal(pctMeta(undefined), 0);
  assert.equal(pctMeta('qualquer'), 0);
});

test('pctObjetivo: média das metas não congeladas, arredondada (RUM-41.5)', () => {
  const metas = [{ status: 'concluida' }, { status: 'concluida70' }, { status: 'nao_concluida' }, { status: 'congelada' }];
  assert.equal(pctObjetivo(metas), 57);
  assert.equal(pctObjetivo([{ status: 'concluida' }, { status: 'concluida70' }]), 85);
  assert.equal(pctObjetivo([{ status: 'concluida70' }, { status: 'nao_concluida' }]), 35);
});

test('pctObjetivo: meta sem status entra como 0 na média', () => {
  assert.equal(pctObjetivo([{ status: 'concluida' }, {}]), 50);
});

test('pctObjetivo é null com só congeladas ou sem metas (RUM-41.7)', () => {
  assert.equal(pctObjetivo([{ status: 'congelada' }, { status: 'congelada' }]), null);
  assert.equal(pctObjetivo([]), null);
});

test('pctTotal: média só dos objetivos não nulos (RUM-41.6)', () => {
  assert.equal(pctTotal([57, 100]), 79);
  assert.equal(pctTotal([57, null, 100]), 79, 'objetivo sem meta ativa fica fora');
  assert.equal(pctTotal([0, 100]), 50);
  assert.equal(pctTotal([0]), 0);
});

test('pctTotal é null se todos os objetivos forem nulos ou não houver objetivos (RUM-41.7)', () => {
  assert.equal(pctTotal([null, null]), null);
  assert.equal(pctTotal([]), null);
});
