import test from 'node:test';
import assert from 'node:assert/strict';
import { casaDe } from '../lib/espacos.ts';

test('casaDe leva o cargo à Casa do catálogo de comissões', () => {
  assert.equal(casaDe('Deputado(a) Federal'), 'federal');
  assert.equal(casaDe('Deputado(a) Estadual'), 'estadual');
  assert.equal(casaDe('Deputado(a) Distrital'), 'estadual');
  assert.equal(casaDe('Senador(a)'), 'senado');
  assert.equal(casaDe('Vereador(a)'), 'municipal');
  assert.equal(casaDe(''), null);
});
