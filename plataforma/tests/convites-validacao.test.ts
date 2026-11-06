import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validaConvite, ERRO_NOME, ERRO_EMAIL } from '../lib/convites/validacao.ts';

const email254 = 'a'.repeat(254 - '@b.co'.length) + '@b.co';

test('textos de erro são os literais da spec', () => {
  assert.equal(ERRO_NOME, 'Informe um nome de até 80 caracteres.');
  assert.equal(ERRO_EMAIL, 'E-mail inválido.');
});

test('nome vazio ou só com espaços recusa (ACE-01.7)', () => {
  assert.deepEqual(validaConvite({ nome: '', email: '' }), { ok: false, erro: 'Informe um nome de até 80 caracteres.' });
  assert.deepEqual(validaConvite({ nome: '   ', email: '' }), { ok: false, erro: 'Informe um nome de até 80 caracteres.' });
});

test('nome com 81 caracteres recusa e com 80 passa (ACE-01.7)', () => {
  assert.deepEqual(validaConvite({ nome: 'n'.repeat(81), email: '' }), { ok: false, erro: 'Informe um nome de até 80 caracteres.' });
  assert.deepEqual(validaConvite({ nome: 'n'.repeat(80), email: '' }), { ok: true, nome: 'n'.repeat(80), email: '' });
});

test('o limite de 80 vale depois de aparar os espaços', () => {
  assert.deepEqual(validaConvite({ nome: ` ${'n'.repeat(80)} `, email: '' }), { ok: true, nome: 'n'.repeat(80), email: '' });
});

test('e-mail vazio ou só espaços passa e volta vazio (ACE-01.8)', () => {
  assert.deepEqual(validaConvite({ nome: 'Carlos', email: '' }), { ok: true, nome: 'Carlos', email: '' });
  assert.deepEqual(validaConvite({ nome: 'Carlos', email: '   ' }), { ok: true, nome: 'Carlos', email: '' });
});

test('e-mail sem @, com espaço interno, sem ponto no domínio ou com dois @ recusa (ACE-01.8)', () => {
  for (const e of ['carlos.exemplo.com', 'car los@x.com', 'carlos@x', 'a@b@c.com', '@x.com', 'carlos@.com', 'carlos@']) {
    assert.deepEqual(validaConvite({ nome: 'Carlos', email: e }), { ok: false, erro: 'E-mail inválido.' }, e);
  }
});

test('e-mail de 254 caracteres passa e de 255 recusa (ACE-01.8)', () => {
  assert.equal(email254.length, 254);
  assert.deepEqual(validaConvite({ nome: 'Carlos', email: email254 }), { ok: true, nome: 'Carlos', email: email254 });
  const email255 = 'a' + email254;
  assert.equal(email255.length, 255);
  assert.deepEqual(validaConvite({ nome: 'Carlos', email: email255 }), { ok: false, erro: 'E-mail inválido.' });
});

test('devolve nome e e-mail normalizados: aparados, e-mail em minúsculas (ACE-01.5)', () => {
  assert.deepEqual(validaConvite({ nome: '  Carlos Lima ', email: '  Carlos@Exemplo.COM ' }), {
    ok: true,
    nome: 'Carlos Lima',
    email: 'carlos@exemplo.com',
  });
});

test('nome inválido tem prioridade quando os dois campos estão errados', () => {
  assert.deepEqual(validaConvite({ nome: '', email: 'x' }), { ok: false, erro: 'Informe um nome de até 80 caracteres.' });
});

test('campos ausentes (undefined) contam como vazios', () => {
  assert.deepEqual(validaConvite({ nome: undefined, email: undefined }), { ok: false, erro: 'Informe um nome de até 80 caracteres.' });
  assert.deepEqual(validaConvite({ nome: 'Ana' }), { ok: true, nome: 'Ana', email: '' });
});
