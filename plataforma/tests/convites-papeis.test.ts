import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PAPEIS, rotuloPapel, papeisPermitidos, papeisConvidaveis, podeGerirEquipe, podeEditar, podeVerFeedback } from '../lib/convites/papeis.ts';

test('PAPEIS lista os cinco papéis do maior para o menor', () => {
  assert.deepEqual([...PAPEIS], ['parlamentar', 'chefe_gabinete', 'coordenacao', 'assessoria', 'leitura']);
});

test('rotuloPapel devolve os rótulos da tela', () => {
  assert.equal(rotuloPapel('parlamentar'), 'Parlamentar');
  assert.equal(rotuloPapel('chefe_gabinete'), 'Chefe de Gabinete');
  assert.equal(rotuloPapel('coordenacao'), 'Coordenação');
  assert.equal(rotuloPapel('assessoria'), 'Assessoria');
  assert.equal(rotuloPapel('leitura'), 'Somente leitura');
});

test('papeisPermitidos devolve o próprio papel e os menores', () => {
  assert.deepEqual(papeisPermitidos('parlamentar'), ['parlamentar', 'chefe_gabinete', 'coordenacao', 'assessoria', 'leitura']);
  assert.deepEqual(papeisPermitidos('chefe_gabinete'), ['chefe_gabinete', 'coordenacao', 'assessoria', 'leitura']);
  assert.deepEqual(papeisPermitidos('coordenacao'), ['coordenacao', 'assessoria', 'leitura']);
  assert.deepEqual(papeisPermitidos('assessoria'), ['assessoria', 'leitura']);
  assert.deepEqual(papeisPermitidos('leitura'), ['leitura']);
});

test('papeisPermitidos devolve cópia: alterar o resultado não muda a próxima chamada', () => {
  papeisPermitidos('coordenacao').pop();
  assert.deepEqual(papeisPermitidos('coordenacao'), ['coordenacao', 'assessoria', 'leitura']);
});

test('podeGerirEquipe vale para parlamentar, chefe e coordenação', () => {
  assert.deepEqual(PAPEIS.map(podeGerirEquipe), [true, true, true, false, false]);
});

test('podeEditar vale para todos menos leitura', () => {
  assert.deepEqual(PAPEIS.map(podeEditar), [true, true, true, true, false]);
});

test('podeVerFeedback vale só para parlamentar e chefe de gabinete', () => {
  assert.deepEqual(PAPEIS.map(podeVerFeedback), [true, true, false, false, false]);
});

test('papel ausente ou desconhecido não ganha permissão nenhuma', () => {
  assert.deepEqual(papeisPermitidos(null), []);
  assert.deepEqual(papeisPermitidos('titular'), []);
  assert.equal(podeGerirEquipe(undefined), false);
  assert.equal(podeEditar('titular'), false);
  assert.equal(podeVerFeedback(null), false);
});

test('papeisConvidaveis soma Parlamentar e Chefe vagos para quem edita; leitura não ganha nada', () => {
  assert.deepEqual(papeisConvidaveis('assessoria', ['assessoria']), ['parlamentar', 'chefe_gabinete', 'assessoria', 'leitura']);
  assert.deepEqual(papeisConvidaveis('coordenacao', ['coordenacao', 'chefe_gabinete']), ['parlamentar', 'coordenacao', 'assessoria', 'leitura']);
  assert.deepEqual(papeisConvidaveis('coordenacao', ['parlamentar', 'chefe_gabinete']), ['coordenacao', 'assessoria', 'leitura']);
  assert.deepEqual(papeisConvidaveis('chefe_gabinete', []), ['parlamentar', 'chefe_gabinete', 'coordenacao', 'assessoria', 'leitura']);
  assert.deepEqual(papeisConvidaveis('leitura', []), ['leitura']);
});
