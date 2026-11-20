import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STATUS, opcoesStatus, pctMeta, pctObjetivo, pctPlano, pctTotal, statusPorAtingimento } from '../lib/atingimento.ts';

test('STATUS tem os 4 status pedidos, com rótulo e porcentagem', () => {
  assert.deepEqual(STATUS.map((s) => s.pct), [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0, null], 'passos de 10% (SUG-43)');
  assert.equal(STATUS[0].id, 'concluida');
  assert.equal(STATUS.at(-1)?.id, 'congelada');
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

/* Missão 5 · a meta com sucessos mensais vale a MÉDIA do atingimento de cada mês (cada sucesso pelo seu próprio status); sem sucessos, o status da meta */
const suc = (...st: string[]) => st.map((status, i) => ({ id: `s${i}`, mes: 1, texto: `s${i}`, status }));

test('meta com sucessos vale a média do atingimento de cada um: 70% e 50% dão 60% (relato do Pedro)', () => {
  assert.equal(pctMeta('concluida80', suc('concluida70', 'concluida50')), 60, 'o status próprio (80%) não conta quando há sucessos');
  assert.equal(pctMeta('nao_concluida', suc('concluida70', 'concluida50')), 60);
  assert.equal(pctMeta('concluida', suc('concluida70', 'concluida50')), 60);
});

test('sucesso concluído vale 100, não concluído vale 0 e os passos de 10% valem o que dizem', () => {
  assert.equal(pctMeta('nao_concluida', suc('concluida', 'nao_concluida')), 50);
  assert.equal(pctMeta('nao_concluida', suc('concluida', 'concluida', 'nao_concluida')), 67, 'arredonda');
  assert.equal(pctMeta('nao_concluida', suc('concluida')), 100);
  assert.equal(pctMeta('concluida', suc('nao_concluida')), 0);
  assert.equal(pctMeta('nao_concluida', suc('concluida10')), 10);
  assert.equal(pctMeta('nao_concluida', suc('concluida90', 'concluida10')), 50);
});

test('arredondamento da média: 0,5 sobe (65 e 70 dão 68; 10 e 15 não existem, mas 10, 10 e 20 dão 13)', () => {
  assert.equal(pctMeta('nao_concluida', suc('concluida60', 'concluida70')), 65);
  assert.equal(pctMeta('nao_concluida', suc('concluida10', 'concluida10', 'concluida20')), 13);
  assert.equal(pctMeta('nao_concluida', suc('concluida', 'concluida', 'concluida90')), 97);
});

test('meta sem sucessos mantém o cálculo pelo status (M5-02.6)', () => {
  assert.equal(pctMeta('concluida70', []), 70);
  assert.equal(pctMeta('concluida70', undefined), 70);
  assert.equal(pctMeta('congelada', []), null);
  assert.equal(pctMeta('concluida70', 'lixo'), 70);
});

test('meta congelada com sucessos continua fora da conta; sucesso congelado não entra na média', () => {
  assert.equal(pctMeta('congelada', suc('concluida')), null);
  assert.equal(pctMeta('nao_concluida', suc('concluida', 'congelada')), 100);
  assert.equal(pctMeta('nao_concluida', suc('concluida70', 'congelada', 'concluida50')), 60);
  assert.equal(pctMeta('nao_concluida', suc('congelada', 'congelada')), null, 'só sucessos congelados: fora da conta');
});

test('pctObjetivo e pctTotal usam o atingimento novo das metas com sucessos (M5-02.5)', () => {
  const metas = [
    { status: 'nao_concluida', sucessos: suc('concluida70', 'concluida50') }, // 60
    { status: 'concluida' },                                                   // 100, sem sucessos
  ];
  assert.equal(pctObjetivo(metas), 80);
  assert.equal(pctTotal([pctObjetivo(metas), 100]), 90);
  assert.equal(pctObjetivo([{ status: 'concluida', sucessos: suc('congelada') }]), null);
});

test('o caso do print: objetivo com meta de meses 70% e 50% mostra 60%, e não 0%', () => {
  const metas = [{ status: 'concluida80', sucessos: [{ id: 'a', mes: 1, texto: 'a', status: 'concluida70' }, { id: 'b', mes: 2, texto: 'b', status: 'concluida50' }] }];
  assert.equal(pctObjetivo(metas), 60);
  assert.equal(pctPlano([{ metas }]), 60);
});

test('statusPorAtingimento acompanha a média dos sucessos; congelada e sem sucessos ficam', () => {
  assert.equal(statusPorAtingimento('nao_concluida', suc('concluida', 'concluida')), 'concluida');
  assert.equal(statusPorAtingimento('nao_concluida', suc('concluida', 'concluida', 'concluida', 'nao_concluida')), 'concluida70');
  assert.equal(statusPorAtingimento('concluida', suc('concluida', 'nao_concluida')), 'concluida50');
  assert.equal(statusPorAtingimento('concluida80', suc('concluida70', 'concluida50')), 'concluida60', 'o status passa a ser derivado da média');
  assert.equal(statusPorAtingimento('congelada', suc('concluida')), 'congelada');
  assert.equal(statusPorAtingimento('concluida70', []), 'concluida70');
  assert.equal(statusPorAtingimento('concluida70', suc('congelada')), 'concluida70', 'sem sucesso ativo mantém');
});

test('pctPlano pesa as metas, não os objetivos (SUG-45)', () => {
  const objs = [{ metas: [{ status: 'concluida' }] }, { metas: [{ status: 'nao_concluida' }, { status: 'nao_concluida' }, { status: 'nao_concluida' }, { status: 'nao_concluida' }] }];
  assert.equal(pctPlano(objs), 20, 'uma meta batida em cinco = 20%, e não 50%');
  assert.equal(pctTotal(objs.map((o) => pctObjetivo(o.metas))), 50);
  assert.equal(pctPlano([{ metas: [{ status: 'congelada' }] }]), null);
  assert.equal(pctPlano([]), null);
});

test('statusPorAtingimento cai no passo de 10% logo abaixo (SUG-43)', () => {
  const suc = (n: number, de: number) => Array.from({ length: de }, (_, i) => ({ id: String(i), mes: 1, texto: 'x', status: i < n ? 'concluida' : 'nao_concluida' }));
  assert.equal(statusPorAtingimento('nao_concluida', suc(2, 3)), 'concluida60');
  assert.equal(statusPorAtingimento('nao_concluida', suc(1, 10)), 'concluida10');
});

test('opcoesStatus: sem sucessos a lista inteira; com sucessos só o status calculado e congelar/descongelar', () => {
  assert.equal(opcoesStatus('concluida60', false).length, 12);
  assert.deepEqual(opcoesStatus('concluida60', true).map((o) => o.id), ['concluida60', 'congelada']);
  assert.deepEqual(opcoesStatus('congelada', true).map((o) => o.id), ['congelada', 'nao_concluida']);
  assert.deepEqual(opcoesStatus(undefined, true).map((o) => o.id), ['nao_concluida', 'congelada']);
});
