import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mensagemConvite, urlWhatsApp } from '../lib/convites/mensagem.ts';

const dados = {
  parlamentar: 'Ana Souza',
  convidadoPor: 'Mariana Alves',
  link: 'https://100dias.exemplo/convite#AbC-_123456789012345xy',
};

test('a mensagem traz nome parlamentar, quem convida, link e "vale por 7 dias" (ACE-01.1)', () => {
  const m = mensagemConvite(dados);
  assert.ok(m.includes('Ana Souza'), 'nome parlamentar');
  assert.ok(m.includes('Mariana Alves'), 'quem convida');
  assert.ok(m.includes(dados.link), 'link');
  assert.ok(m.includes('vale por 7 dias'), 'validade');
});

test('a validade é 7 dias por padrão e aceita outro número', () => {
  assert.ok(mensagemConvite({ ...dados, validade: 3 }).includes('vale por 3 dias'));
  assert.ok(!mensagemConvite({ ...dados, validade: 3 }).includes('7 dias'));
});

test('o link fica em linha própria, sem texto colado depois dele', () => {
  const linhas = mensagemConvite(dados).split('\n');
  assert.ok(linhas.includes(dados.link));
});

test('urlWhatsApp usa wa.me e encodeURIComponent, com acento, quebra de linha e #', () => {
  const texto = 'Olá, Ação\nlink#abc';
  assert.equal(urlWhatsApp(texto), `https://wa.me/?text=${encodeURIComponent(texto)}`);
  assert.equal(urlWhatsApp(texto), 'https://wa.me/?text=Ol%C3%A1%2C%20A%C3%A7%C3%A3o%0Alink%23abc');
});

test('urlWhatsApp da mensagem pronta preserva o link no texto codificado', () => {
  const url = urlWhatsApp(mensagemConvite(dados));
  assert.equal(decodeURIComponent(url.slice('https://wa.me/?text='.length)), mensagemConvite(dados));
  assert.ok(url.includes('%23AbC-_123456789012345xy'));
});
