import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplica, alternaArea } from '../lib/cadeiras.ts';
import { criaEntreAreas } from '../lib/rotinas.ts';
import { layoutOrg } from '../lib/layoutOrg.ts';

type C = Record<string, string>;
const monta = (areas: string[], extra: C = {}): C => {
  const c: C = { 'm2.f1': 'Ana', ...extra };
  areas.forEach((a) => aplica(c, alternaArea(c, a, true).patch));
  return c;
};

test('cada cadeira ativa vira um nó com posição e a Chefia fica acima das coordenações (MEQ-11)', () => {
  const l = layoutOrg(monta(['Legislativo']));
  assert.deepEqual(l.nos.map((n) => n.i), [0, 1, 2, 3, 4, 5, 6]);
  const y = (i: number) => l.nos.find((n) => n.i === i)!.y;
  assert.ok(y(0) < y(1) && y(1) < y(2));
  assert.ok(l.nos.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y) && n.w > 0 && n.h > 0));
});

test('o nó traz área, nome limpo e estado de vaga ou processo seletivo (MEQ-11)', () => {
  const l = layoutOrg(monta(['Comunicação'], { 'm2.f8': 'Bia', 'm2.f9': '*' }));
  const n = (i: number) => l.nos.find((x) => x.i === i)!;
  assert.deepEqual([n(7).coord, n(7).nome, n(7).vaga, n(7).aberto], ['Comunicação', 'Bia', false, false]);
  assert.deepEqual([n(8).nome, n(8).vaga, n(8).aberto], ['', true, true]);
  assert.deepEqual([n(9).vaga, n(9).aberto], [true, false]);
});

test('as arestas de hierarquia vão do líder ao liderado (MEQ-11)', () => {
  const l = layoutOrg(monta(['Legislativo']));
  const h = l.arestas.filter((a) => a.tipo === 'hierarquia').map((a) => `${a.de}>${a.para}`);
  assert.deepEqual(h, ['0>1', '1>2', '1>3', '1>4', '1>5', '1>6']);
});

test('com "só preenchidas", a cadeira cujo líder some sobe até o líder visível mais próximo (MEQ-11, T-24)', () => {
  // 0 Chefia (Ana), 1 Coord. Legislativo (sem nome), 2 Assessor (Caio): Caio passa a ligar na Chefia
  const c = monta(['Legislativo'], { 'm2.f3': 'Caio' });
  const l = layoutOrg(c, { soPreenchidas: true });
  assert.deepEqual(l.nos.map((n) => n.i), [0, 2]);
  assert.deepEqual(l.arestas.map((a) => `${a.de}>${a.para}`), ['0>2']);
});

test('cada rotina entre áreas ativa vira uma aresta tipo "entre" rotulada, sem mexer na hierarquia (MEQ-21, T-24)', () => {
  const c = monta(['Legislativo', 'Comunicação']);
  const sem = layoutOrg(c).arestas.filter((a) => a.tipo === 'hierarquia');
  aplica(c, criaEntreAreas(c, { de: 'Legislativo', para: 'Comunicação', finalidade: 'Pauta da semana', freq: 'Semanalmente', canal: 'x' }).patch);
  const l = layoutOrg(c);
  const entre = l.arestas.filter((a) => a.tipo === 'entre');
  assert.equal(entre.length, 1);
  assert.deepEqual([entre[0].de, entre[0].para], [1, 7]);
  assert.match(entre[0].rotulo ?? '', /Semanalmente/);
  assert.deepEqual(l.arestas.filter((a) => a.tipo === 'hierarquia'), sem);
});

test('aresta entre áreas some se uma das pontas não está visível (MEQ-21)', () => {
  const c = monta(['Legislativo', 'Comunicação']);
  aplica(c, criaEntreAreas(c, { de: 'Legislativo', para: 'Comunicação', finalidade: 'x', freq: 'Mensalmente', canal: 'x' }).patch);
  assert.equal(layoutOrg(c, { soPreenchidas: true }).arestas.filter((a) => a.tipo === 'entre').length, 0);
});

test('"só preenchidas" remove da lista as cadeiras sem nome (MEQ-11)', () => {
  const c = monta(['Comunicação'], { 'm2.f8': 'Bia' });
  assert.deepEqual(layoutOrg(c, { soPreenchidas: true }).nos.map((n) => n.i), [0, 7]);
});

test('areas lista, em ordem, só as áreas presentes nos nós visíveis (MEQ-11)', () => {
  const l = layoutOrg(monta(['Legislativo', 'Comunicação']));
  assert.deepEqual(l.areas, ['Comunicação', 'Legislativo']);
});
