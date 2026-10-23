import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AREAS, alternaArea, aplica, ativas, coordDe, coordsDe, liderDe, modeloCompleto, sugeridasDaArea, SEM_AREA } from '../lib/cadeiras.ts';

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

/* ---------- T2: áreas e cadeiras sugeridas ---------- */
const liga = (c: C, area: string) => { aplica(c, alternaArea(c, area, true).patch); return c; };

test('marcar Legislativo acrescenta as 6 cadeiras da área: Chefia + 6 = 7 (MEQ-02, T-01)', () => {
  assert.deepEqual(sugeridasDaArea('Legislativo'), [1, 2, 3, 4, 5, 6]);
  const c = liga({}, 'Legislativo');
  assert.deepEqual(ativas(c), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(coordsDe(c), ['Legislativo']);
});

test('Legislativo + Comunicação dão 11 cadeiras (MEQ-02, E-02)', () => {
  const c = liga(liga({}, 'Legislativo'), 'Comunicação');
  assert.equal(ativas(c).length, 11);
});

test('o modelo completo marca as 6 áreas e totaliza 20 cadeiras, na ordem do modelo (MEQ-02, T-02)', () => {
  const c: C = {};
  aplica(c, modeloCompleto(c));
  assert.deepEqual(ativas(c), Array.from({ length: 20 }, (_, i) => i));
  assert.deepEqual(coordsDe(c), [...AREAS]);
  assert.equal(AREAS.length, 6);
});

test('desmarcar área sem nomes remove as cadeiras sem pedir confirmação (MEQ-04, T-05)', () => {
  const c = liga(liga({}, 'Legislativo'), 'Comunicação');
  const r = alternaArea(c, 'Legislativo', false);
  assert.equal(r.confirma, undefined);
  aplica(c, r.patch);
  assert.deepEqual(ativas(c), [0, 7, 8, 9, 10]);
  assert.deepEqual(coordsDe(c), ['Comunicação']);
});

test('desmarcar área com nome pede confirmação e, ao confirmar, move a cadeira para Sem área sem apagá-la (MEQ-04, T-06)', () => {
  const c = liga({ 'm2.f3': 'Ana' }, 'Legislativo');
  const r = alternaArea(c, 'Legislativo', false);
  assert.deepEqual(r.confirma, ['Ana']);
  aplica(c, r.patch);
  assert.deepEqual(ativas(c), [0, 2]);
  assert.equal(coordDe(c, 2), SEM_AREA);
  assert.equal(c['m2.f3'], 'Ana');
  assert.deepEqual(coordsDe(c), []);
});

test('mandato antigo ao marcar nova área mantém as cadeiras que já tinha (MEQ-24)', () => {
  const c: C = { 'm2.f2': 'Bia' };
  liga(c, 'Comunicação');
  assert.deepEqual(ativas(c), [0, 1, 7, 8, 9, 10]);
  assert.equal(c['m2.f2'], 'Bia');
});

test('cadeira sem nome mas com escopo fica guardada ao desmarcar a área, sem perda (MEQ-04)', () => {
  const c = liga({}, 'Comunicação');
  c['m2.p9.escopo'] = 'Criar vídeos institucionais e peças gráficas (posts, infográficos, banners)';
  aplica(c, alternaArea(c, 'Comunicação', false).patch);
  assert.deepEqual(ativas(c), [0]);
  assert.equal(c['m2.p9.escopo'], undefined);
  assert.match(c['m2.arq.9'], /Criar vídeos institucionais/);
});
