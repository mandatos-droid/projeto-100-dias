import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montaLink, tokenDoHash } from '../lib/convites/link.ts';

const TOKEN = 'AbC-_123456789012345xy'; // 22 caracteres
const LONGO = TOKEN + 'z';

test('montaLink junta origem, /convite e token no fragmento (ACE-01.1)', () => {
  assert.equal(montaLink('https://100dias.exemplo', 'abc'), 'https://100dias.exemplo/convite#abc');
});

test('o token fica depois do # e nunca no caminho nem na query (AD-009)', () => {
  const link = montaLink('https://100dias.exemplo', TOKEN);
  assert.equal(link, `https://100dias.exemplo/convite#${TOKEN}`);
  assert.equal(new URL(link).pathname, '/convite');
  assert.equal(new URL(link).search, '');
});

test('tokenDoHash devolve o token de # + 22 caracteres válidos (ACE-02.1)', () => {
  assert.equal(TOKEN.length, 22);
  assert.equal(tokenDoHash(`#${TOKEN}`), TOKEN);
});

test('tokenDoHash devolve null para hash vazio ou só #', () => {
  assert.equal(tokenDoHash(''), null);
  assert.equal(tokenDoHash('#'), null);
});

test('tokenDoHash devolve null para token curto (21) e longo (23)', () => {
  assert.equal(tokenDoHash(`#${TOKEN.slice(0, 21)}`), null);
  assert.equal(tokenDoHash(`#${LONGO}`), null);
});

test('tokenDoHash devolve null para caractere fora de A-Za-z0-9_-', () => {
  assert.equal(tokenDoHash(`#${TOKEN.slice(0, 21)}=`), null);
  assert.equal(tokenDoHash(`#${TOKEN.slice(0, 21)}.`), null);
  assert.equal(tokenDoHash(`#${TOKEN.slice(0, 21)} `), null);
  assert.equal(tokenDoHash(`#${TOKEN.slice(0, 21)}é`), null);
});

test('tokenDoHash devolve null para o retorno do Google (#access_token=...)', () => {
  assert.equal(tokenDoHash('#access_token=abc&type=bearer'), null);
});

test('tokenDoHash aceita o link completo colado e devolve o token', () => {
  assert.equal(tokenDoHash(`https://100dias.exemplo/convite#${TOKEN}`), TOKEN);
  assert.equal(tokenDoHash(`  https://100dias.exemplo/convite#${TOKEN}\n`), TOKEN);
});

test('tokenDoHash rejeita link completo com token inválido e texto sem #', () => {
  assert.equal(tokenDoHash(`https://100dias.exemplo/convite#${TOKEN.slice(0, 10)}`), null);
  assert.equal(tokenDoHash('https://100dias.exemplo/convite'), null);
  assert.equal(tokenDoHash(TOKEN), null);
});

test('montaLink e tokenDoHash fecham o ciclo', () => {
  assert.equal(tokenDoHash(montaLink('https://x.y', TOKEN)), TOKEN);
});
