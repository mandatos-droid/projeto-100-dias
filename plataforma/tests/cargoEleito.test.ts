import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargoEleito } from '../lib/cargoEleito.ts';

/* PAR-01: o cargo concorda com o gênero da pessoa eleita. */
test('mulher: Deputada Estadual, Federal e Distrital, e Senadora', () => {
  assert.equal(cargoEleito({ k: 'e', uf: 'SP', g: 'F' }), 'Deputada Estadual');
  assert.equal(cargoEleito({ k: 'f', uf: 'SP', g: 'F' }), 'Deputada Federal');
  assert.equal(cargoEleito({ k: 'e', uf: 'DF', g: 'F' }), 'Deputada Distrital');
  assert.equal(cargoEleito({ k: 's', uf: 'SP', g: 'F' }), 'Senadora');
});

test('homem: Deputado Estadual, Federal e Distrital, e Senador', () => {
  assert.equal(cargoEleito({ k: 'e', uf: 'SP', g: 'M' }), 'Deputado Estadual');
  assert.equal(cargoEleito({ k: 'f', uf: 'SP', g: 'M' }), 'Deputado Federal');
  assert.equal(cargoEleito({ k: 'e', uf: 'DF', g: 'M' }), 'Deputado Distrital');
  assert.equal(cargoEleito({ k: 's', uf: 'SP', g: 'M' }), 'Senador');
});

test('Câmara dos Deputados e Senado não viram "Distrital" por estar no DF', () => {
  assert.equal(cargoEleito({ k: 'f', uf: 'DF', g: 'F' }), 'Deputada Federal');
  assert.equal(cargoEleito({ k: 's', uf: 'DF', g: 'M' }), 'Senador');
});

test('gênero ausente, vazio ou desconhecido cai no masculino', () => {
  assert.equal(cargoEleito({ k: 'e', uf: 'SP' }), 'Deputado Estadual');
  assert.equal(cargoEleito({ k: 'e', uf: 'SP', g: null }), 'Deputado Estadual');
  assert.equal(cargoEleito({ k: 's', uf: 'SP', g: '' }), 'Senador');
  assert.equal(cargoEleito({ k: 'f', uf: 'SP', g: 'X' }), 'Deputado Federal');
});
