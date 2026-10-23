import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplica, ativas, coordDe, liderDe, SEM_AREA } from '../lib/cadeiras.ts';

type C = Record<string, string>;

test('sem m2.on, mandato antigo ativa a Chefia e toda cadeira com nome ou ficha (MEQ-24, T-21)', () => {
  const c: C = { 'm2.f3': 'Ana', 'm2.p5.escopo': 'Elaborar propostas legislativas: x', 'm2.f4': '   ' };
  assert.deepEqual(ativas(c), [0, 2, 4]);
});

test('mandato novo, sem dados, só tem a Chefia de gabinete (MEQ-24)', () => {
  assert.deepEqual(ativas({}), [0]);
});

test('com m2.on a lista gravada vale e a Chefia entra mesmo se faltar (MEQ-24)', () => {
  assert.deepEqual(ativas({ 'm2.on': '20|1|0' }), [0, 1, 20]);
  assert.deepEqual(ativas({ 'm2.on': '1|2' }), [0, 1, 2]);
});

test('ler as cadeiras nunca altera as chaves, nem m2.areas (MEQ-24, T-22)', () => {
  const c: C = { 'm2.areas': 'saude|educacao', 'm2.areas_aplicadas': 'saude', 'm2.f2': 'Bia' };
  const antes = JSON.stringify(c);
  ativas(c); coordDe(c, 1); liderDe(c, 1);
  assert.equal(JSON.stringify(c), antes);
});

test('coordenação e liderança vêm do padrão quando nada foi gravado (MEQ-06, T-07)', () => {
  assert.equal(coordDe({}, 1), 'Legislativo');
  assert.equal(liderDe({}, 1), 0);
  assert.equal(coordDe({}, 7), 'Comunicação');
  assert.equal(liderDe({ 'm2.on': '0|7|8' }, 8), 7);
});

test('valor gravado vale mais que o padrão (MEQ-06)', () => {
  const c: C = { 'm2.on': '0|1|5', 'm2.p2.coord': 'Comunicação', 'm2.p2.lider': '5' };
  assert.equal(coordDe(c, 1), 'Comunicação');
  assert.equal(liderDe(c, 1), 5);
});

test('lider "-" significa topo e devolve null (MEQ-06)', () => {
  assert.equal(liderDe({ 'm2.p2.lider': '-' }, 1), null);
  assert.equal(liderDe({}, 0), null);
});

test('liderança padrão sobe até a cadeira ativa mais próxima (MEQ-06)', () => {
  // cadeira 2 tem líder padrão 1 (Coord. Legislativo); sem a 1 ativa, sobe à Chefia
  assert.equal(liderDe({ 'm2.on': '0|2' }, 2), 0);
});

test('cadeira acrescentada sem área gravada fica em Sem área (MEQ-06)', () => {
  assert.equal(coordDe({}, 20), SEM_AREA);
  assert.equal(liderDe({}, 20), null);
});

test('aplica grava as chaves e apaga as vazias (MEQ-06)', () => {
  const c: C = { a: '1', b: '2' };
  aplica(c, { a: '', b: '3', d: '4' });
  assert.deepEqual(c, { b: '3', d: '4' });
});
