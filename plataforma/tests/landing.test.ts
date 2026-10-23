import { test } from 'node:test';
import assert from 'node:assert/strict';
import { destinoAuth } from '../lib/landing.ts';

test('retorno do login com token vai para /guia preservando o hash (Chegar AC 5)', () => {
  assert.equal(destinoAuth('#access_token=x&type=y'), '/guia#access_token=x&type=y');
});

test('retorno do login com erro vai para /guia preservando o hash (Chegar AC 5)', () => {
  assert.equal(destinoAuth('#error_description=a+b'), '/guia#error_description=a+b');
});

test('hash vazio ou comum não redireciona (Chegar AC 5, caso negativo)', () => {
  assert.equal(destinoAuth(''), null);
  assert.equal(destinoAuth('#missoes'), null);
  assert.equal(destinoAuth('#xaccess_token=1'), null);
});
