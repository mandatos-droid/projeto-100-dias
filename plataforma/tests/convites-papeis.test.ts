import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PAPEIS, rotuloPapel, papeisPermitidos, podeGerirEquipe, podeEditar } from '../lib/convites/papeis.ts';

test('PAPEIS lista os três papéis do maior para o menor', () => {
  assert.deepEqual([...PAPEIS], ['coordenacao', 'assessoria', 'leitura']);
});

test('rotuloPapel devolve os rótulos da tela', () => {
  assert.equal(rotuloPapel('coordenacao'), 'Coordenação');
  assert.equal(rotuloPapel('assessoria'), 'Assessoria');
  assert.equal(rotuloPapel('leitura'), 'Somente leitura');
});

test('papeisPermitidos de coordenação devolve os três (ACE-01.6)', () => {
  assert.deepEqual(papeisPermitidos('coordenacao'), ['coordenacao', 'assessoria', 'leitura']);
});

test('papeisPermitidos de assessoria devolve assessoria e leitura (ACE-04.9)', () => {
  assert.deepEqual(papeisPermitidos('assessoria'), ['assessoria', 'leitura']);
});

test('papeisPermitidos de leitura devolve só leitura (ACE-04.9)', () => {
  assert.deepEqual(papeisPermitidos('leitura'), ['leitura']);
});

test('papeisPermitidos devolve cópia: alterar o resultado não muda a próxima chamada', () => {
  papeisPermitidos('coordenacao').pop();
  assert.deepEqual(papeisPermitidos('coordenacao'), ['coordenacao', 'assessoria', 'leitura']);
});

test('podeGerirEquipe é verdadeiro só para coordenação (ACE-04.7, ACE-04.8)', () => {
  assert.equal(podeGerirEquipe('coordenacao'), true);
  assert.equal(podeGerirEquipe('assessoria'), false);
  assert.equal(podeGerirEquipe('leitura'), false);
});

test('podeEditar é verdadeiro para coordenação e assessoria, falso para leitura (ACE-03.3)', () => {
  assert.equal(podeEditar('coordenacao'), true);
  assert.equal(podeEditar('assessoria'), true);
  assert.equal(podeEditar('leitura'), false);
});

test('papel ausente ou desconhecido não ganha permissão nenhuma', () => {
  assert.deepEqual(papeisPermitidos(null), []);
  assert.deepEqual(papeisPermitidos('titular'), []);
  assert.equal(podeGerirEquipe(undefined), false);
  assert.equal(podeEditar('titular'), false);
});
