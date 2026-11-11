import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cincoMais } from '../lib/maisVotados.ts';

const nomes = new Map([['1', 'Alfa'], ['2', 'Beta'], ['3', 'Gama'], ['4', 'Delta'], ['5', 'Épsilon'], ['6', 'Zeta'], ['7', 'Eta']]);

test('7 municípios: devolve só 5, em ordem decrescente de votos, com posição 1 a 5 (PER-03)', () => {
  const r = cincoMais({
    '1': [100, 1000], '2': [700, 2000], '3': [300, 1000], '4': [900, 3000],
    '5': [50, 500], '6': [500, 1000], '7': [200, 400],
  }, nomes);
  assert.deepEqual(r.map((x) => [x.pos, x.nome, x.votos]),
    [[1, 'Delta', 900], [2, 'Beta', 700], [3, 'Zeta', 500], [4, 'Gama', 300], [5, 'Eta', 200]]);
});

test('pct = votos / válidos × 100 (PER-03)', () => {
  const r = cincoMais({ '2': [700, 2000], '3': [300, 1000] }, nomes);
  assert.equal(r[0].pct, 35);
  assert.equal(r[1].pct, 30);
});

test('empate de votos desempata por nome (PER-03)', () => {
  const r = cincoMais({ '3': [400, 1000], '1': [400, 1000], '2': [400, 1000] }, nomes);
  assert.deepEqual(r.map((x) => x.nome), ['Alfa', 'Beta', 'Gama']);
});

test('município com votos válidos 0 fica fora (PER-03)', () => {
  const r = cincoMais({ '1': [10, 0], '2': [5, 100] }, nomes);
  assert.deepEqual(r.map((x) => x.cdi), ['2']);
});

test('entrada vazia devolve lista vazia (PER-05)', () => {
  assert.deepEqual(cincoMais({}, nomes), []);
});

test('menos de 5 municípios devolve todos', () => {
  assert.equal(cincoMais({ '1': [1, 10], '2': [2, 10] }, nomes).length, 2);
});
