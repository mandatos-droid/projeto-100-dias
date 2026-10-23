import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplica } from '../lib/cadeiras.ts';
import { desliga, gerarRotinas, religa, rotinasDesligadas } from '../lib/rotinas.ts';

type C = Record<string, string>;
const ids = (c: C) => gerarRotinas(c).map((r) => r.id);

test('com 1 cadeira com nome saem as 3 rotinas coletivas, com a frequência e a duração do Guia (MEQ-17, T-11)', () => {
  const rs = gerarRotinas({ 'm2.f1': 'Ana' });
  assert.deepEqual(rs.map((r) => [r.id, r.freq, r.duracao]), [
    ['plan', 'Quadrimestralmente', '2 períodos de 6h'],
    ['mensal', 'Mensalmente', '1h'],
    ['semanal', 'Semanalmente', '1h'],
  ]);
  assert.deepEqual(rs[0].participantes, [0]);
  assert.equal(rs[0].convoca, 0);
});

test('sem nenhuma cadeira com nome não há rotina a gerar (MEQ-17)', () => {
  assert.deepEqual(gerarRotinas({}), []);
  assert.deepEqual(gerarRotinas({ 'm2.f1': '*' }), []);
});

test('área com 3 cadeiras gera 1 reunião semanal de 45 min com as 3, convocada pela cadeira de topo da área (MEQ-17, T-12)', () => {
  const rs = gerarRotinas({ 'm2.f1': 'Ana', 'm2.on': '0|7|8|9' });
  const r = rs.find((x) => x.id === 'area:Comunicação')!;
  assert.equal(r.freq, 'Semanalmente');
  assert.equal(r.duracao, '45 min');
  assert.deepEqual(r.participantes, [7, 8, 9]);
  assert.equal(r.convoca, 7);
  assert.equal(r.area, 'Comunicação');
});

test('área com 1 cadeira não gera reunião de área (MEQ-17, T-13)', () => {
  assert.equal(ids({ 'm2.f1': 'Ana', 'm2.on': '0|7' }).some((i) => i.startsWith('area:')), false);
});

test('cada par líder/liderado gera um feedback de 30 min, agrupado no líder (MEQ-17, T-14)', () => {
  const rs = gerarRotinas({ 'm2.f1': 'Ana', 'm2.on': '0|1|2|3' });
  const fb = rs.filter((r) => r.tipo === 'feedback' && r.grupo === 1);
  assert.deepEqual(fb.map((r) => r.id), ['fb:1>2', 'fb:1>3']);
  assert.ok(fb.every((r) => r.duracao === '30 min' && r.freq === 'Semestralmente' && r.convoca === 1));
  assert.deepEqual(fb[0].participantes, [1, 2]);
  assert.ok(rs.some((r) => r.id === 'fb:0>1'));
});

test('cadeira sem nome entra nos participantes e fica fora dos confirmados (MEQ-17, T-15)', () => {
  const rs = gerarRotinas({ 'm2.f1': 'Ana', 'm2.f8': 'Bia', 'm2.f9': '*', 'm2.on': '0|7|8|9' });
  const r = rs.find((x) => x.id === 'area:Comunicação')!;
  assert.deepEqual(r.participantes, [7, 8, 9]);
  assert.equal(r.confirmados, 1);
  assert.equal(rs.find((x) => x.id === 'semanal')!.confirmados, 2);
});

test('gerar duas vezes dá o mesmo resultado, sem ids repetidos (MEQ-17, T-16)', () => {
  const c: C = { 'm2.f1': 'Ana', 'm2.on': '0|1|2|7|8' };
  assert.deepEqual(gerarRotinas(c), gerarRotinas(c));
  const lista = ids(c);
  assert.equal(new Set(lista).size, lista.length);
});

test('rotina desligada sai da lista, aparece em desligadas e volta ao religar (MEQ-17)', () => {
  const c: C = { 'm2.f1': 'Ana', 'm2.on': '0|7|8' };
  aplica(c, desliga(c, 'area:Comunicação'));
  assert.equal(ids(c).includes('area:Comunicação'), false);
  assert.deepEqual(rotinasDesligadas(c).map((r) => r.id), ['area:Comunicação']);
  aplica(c, religa(c, 'area:Comunicação'));
  assert.equal(ids(c).includes('area:Comunicação'), true);
  assert.equal(c['m2.rotoff'], undefined);
});
