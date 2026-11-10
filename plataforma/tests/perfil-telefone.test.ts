// Primeiro acesso: máscara do telefone (PAG-02.17).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formataTelefone, soDigitosTelefone } from '../lib/perfil/telefone.ts';

test('vazio ou sem dígitos resulta em texto vazio', () => {
  assert.equal(formataTelefone(''), '');
  assert.equal(formataTelefone('abc'), '');
  assert.equal(formataTelefone('()- '), '');
  assert.equal(soDigitosTelefone(''), '');
});

test('11 dígitos viram celular (11) 99999-9999', () => {
  assert.equal(formataTelefone('11999999999'), '(11) 99999-9999');
});

test('10 dígitos viram fixo (11) 9999-9999', () => {
  assert.equal(formataTelefone('1199999999'), '(11) 9999-9999');
});

test('digitar dígito a dígito mostra a máscara parcial', () => {
  const passos = ['1', '11', '119', '11999', '119999', '1199999', '119999999', '1199999999', '11999999999'];
  assert.deepEqual(passos.map(formataTelefone), [
    '(1', '(11', '(11) 9', '(11) 999', '(11) 9999', '(11) 9999-9', '(11) 9999-999', '(11) 9999-9999', '(11) 99999-9999',
  ]);
});

test('apagar devolve a máscara parcial do que sobrou', () => {
  assert.equal(formataTelefone('(11) 99999-999'), '(11) 9999-9999');
  assert.equal(formataTelefone('(11) 9'), '(11) 9');
  assert.equal(formataTelefone('(11'), '(11');
  assert.equal(formataTelefone('(1'), '(1');
});

test('colar número já com máscara mantém os mesmos dígitos', () => {
  assert.equal(formataTelefone('(11) 99999-9999'), '(11) 99999-9999');
  assert.equal(formataTelefone('+55 (11) 99999-9999'.slice(3)), '(11) 99999-9999');
});

test('colar vários números mantém só os 11 primeiros dígitos', () => {
  assert.equal(formataTelefone('11999999999 11888888888'), '(11) 99999-9999');
  assert.equal(soDigitosTelefone('11999999999 11888888888'), '11999999999');
});

test('letras e símbolos são descartados', () => {
  assert.equal(formataTelefone('1a1b9c9d9e9f9g9h9i9j9k'), '(11) 99999-9999');
  assert.equal(soDigitosTelefone('tel: 11-9999.9999'), '1199999999');
});

test('mais de 11 dígitos são cortados em 11', () => {
  assert.equal(soDigitosTelefone('1199999999912345').length, 11);
  assert.equal(formataTelefone('1199999999912345'), '(11) 99999-9999');
});
