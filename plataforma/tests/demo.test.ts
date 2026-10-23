import { test } from 'node:test';
import assert from 'node:assert/strict';
import { busca, normaliza } from '../lib/demo.ts';
import type { Eleito } from '../lib/types.ts';

const el = (o: Partial<Eleito> = {}): Eleito => ({
  s: '1', u: 'FULANO', c: 'FULANO DE TAL', p: 'PT', uf: 'GO', k: 'f', v: 1000, x: 1, g: 'M', r: '', m: 'n', a: 2026, ...o,
});

test('normaliza tira acentos, caixa e espaços das pontas', () => {
  assert.equal(normaliza('  JOÃO Çá '), 'joao ca');
});

test('busca ignora acentos e maiúsculas (Demo AC 1)', () => {
  const r = busca([el({ s: '1', u: 'JOÃO SILVA' }), el({ s: '2', u: 'MARIA' })], 'joao');
  assert.deepEqual(r.map((x) => x.s), ['1']);
});

test('busca casa pelo nome civil quando o de urna não casa (Demo AC 1)', () => {
  const r = busca([el({ s: '1', u: 'DOUTORA ANA', c: 'ANA PAULA RIBEIRO' })], 'ribeiro');
  assert.deepEqual(r.map((x) => x.s), ['1']);
});

test('termo com 1 caractere ou só espaços não lista nada (Demo AC 2, edge)', () => {
  const todos = [el({ u: 'ANA' }), el({ s: '2', u: 'ANDRE' })];
  assert.deepEqual(busca(todos, 'a'), []);
  assert.deepEqual(busca(todos, '   '), []);
  assert.deepEqual(busca(todos, ''), []);
});

test('mais de 8 casamentos: devolve os 8 mais votados em ordem decrescente (edge)', () => {
  const todos = Array.from({ length: 12 }, (_, i) => el({ s: String(i), u: `SILVA ${i}`, v: i * 10 }));
  const r = busca(todos, 'silva');
  assert.equal(r.length, 8);
  assert.deepEqual(r.map((x) => x.v), [110, 100, 90, 80, 70, 60, 50, 40]);
});

test('nenhum casamento devolve lista vazia (Demo AC 8)', () => {
  assert.deepEqual(busca([el()], 'zzzz'), []);
});
