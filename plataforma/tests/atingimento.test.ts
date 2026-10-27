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

/* Missão 5 · meta com sucessos mensais usa atingidos/total; sem sucessos, o status (M5-02) */
const suc = (...st: string[]) => st.map((status, i) => ({ id: `s${i}`, mes: 1, texto: `s${i}`, status }));

test('meta com 2 sucessos, 1 atingido, tem atingimento 50%, qualquer que seja o status da meta (M5-02.5)', () => {
  assert.equal(pctMeta('nao_concluida', suc('concluida', 'nao_concluida')), 50);
  assert.equal(pctMeta('concluida', suc('concluida', 'nao_concluida')), 50);
  assert.equal(pctMeta('nao_concluida', suc('concluida', 'concluida', 'nao_concluida')), 67);
  assert.equal(pctMeta('nao_concluida', suc('concluida')), 100);
  assert.equal(pctMeta('concluida', suc('nao_concluida')), 0);
});

test('meta sem sucessos mantém o cálculo pelo status (M5-02.6)', () => {
  assert.equal(pctMeta('concluida70', []), 70);
  assert.equal(pctMeta('concluida70', undefined), 70);
  assert.equal(pctMeta('congelada', []), null);
  assert.equal(pctMeta('concluida70', 'lixo'), 70);
});

test('meta congelada com sucessos continua fora da conta; sucesso congelado não conta no total', () => {
  assert.equal(pctMeta('congelada', suc('concluida')), null);
  assert.equal(pctMeta('nao_concluida', suc('concluida', 'congelada')), 100);
  assert.equal(pctMeta('nao_concluida', suc('congelada', 'congelada')), null, 'só sucessos congelados: fora da conta');
});

test('pctObjetivo e pctTotal usam o atingimento novo das metas com sucessos (M5-02.5)', () => {
  const metas = [
    { status: 'nao_concluida', sucessos: suc('concluida', 'nao_concluida') }, // 50
    { status: 'concluida' },                                                   // 100, sem sucessos
  ];
  assert.equal(pctObjetivo(metas), 75);
  assert.equal(pctTotal([pctObjetivo(metas), 100]), 88);
  assert.equal(pctObjetivo([{ status: 'concluida', sucessos: suc('congelada') }]), null);
});
