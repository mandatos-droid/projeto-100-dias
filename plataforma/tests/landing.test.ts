import { test } from 'node:test';
import assert from 'node:assert/strict';
import { destinoAuth } from '../lib/landing.ts';
import { lePendente } from '../lib/convites/pendente.ts';

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

const PENDENTE = 'AbC-_123456789012345xy';

test('retorno do login com token e convite pendente vai para /convite preservando o hash (ACE-02.5)', () => {
  assert.equal(destinoAuth('#access_token=x&type=y', PENDENTE), '/convite#access_token=x&type=y');
});

test('retorno do login com erro e convite pendente também vai para /convite (ACE-02.5)', () => {
  assert.equal(destinoAuth('#error_description=a+b', PENDENTE), '/convite#error_description=a+b');
});

test('sem convite pendente continua indo para /guia (regressão do AD-001)', () => {
  assert.equal(destinoAuth('#access_token=x', null), '/guia#access_token=x');
  assert.equal(destinoAuth('#access_token=x', undefined), '/guia#access_token=x');
  assert.equal(destinoAuth('#access_token=x', ''), '/guia#access_token=x');
});

test('sem access_token nem error_description devolve null com e sem convite pendente', () => {
  assert.equal(destinoAuth('', PENDENTE), null);
  assert.equal(destinoAuth('#missoes', PENDENTE), null);
  assert.equal(destinoAuth('#xaccess_token=1', PENDENTE), null);
  assert.equal(destinoAuth('#missoes', null), null);
});

test('contrato do RedirecionaAuth: o valor de lePendente(sessionStorage) decide o destino (ACE-02.5)', () => {
  const guardado = new Map<string, string>([['legisla.convite', PENDENTE]]);
  const storage = { getItem: (k: string) => guardado.get(k) ?? null, setItem() {}, removeItem() {} };
  assert.equal(destinoAuth('#access_token=x', lePendente(storage)), '/convite#access_token=x');
  guardado.set('legisla.convite', 'lixo');
  assert.equal(destinoAuth('#access_token=x', lePendente(storage)), '/guia#access_token=x');
  guardado.clear();
  assert.equal(destinoAuth('#access_token=x', lePendente(storage)), '/guia#access_token=x');
});
