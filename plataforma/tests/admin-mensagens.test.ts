import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mensagemDe, emailValido, SEM_CONTA, EMAIL_INVALIDO, SEM_PERMISSAO, FALHA_CARGA } from '../lib/admin/mensagens.ts';

test('mensagem do banco é devolvida como veio (ADM-03.8, ADM-07.9)', () => {
  assert.equal(mensagemDe({ status: 400, mensagem: 'A equipe precisa ter ao menos um admin.' }), 'A equipe precisa ter ao menos um admin.');
  assert.equal(mensagemDe({ status: 409, mensagem: 'Esta pessoa já é membro deste mandato.' }), 'Esta pessoa já é membro deste mandato.');
});

test('403 vira "Você não tem permissão para esta ação.", mesmo com texto técnico em inglês (ADM-02.7)', () => {
  assert.equal(mensagemDe({ status: 403, mensagem: 'permission denied for table equipe_legisla' }), 'Você não tem permissão para esta ação.');
  assert.equal(mensagemDe({ status: 403, mensagem: '' }), SEM_PERMISSAO);
});

test('5xx vira "Não foi possível carregar.", ignorando o corpo', () => {
  assert.equal(mensagemDe({ status: 500, mensagem: 'internal' }), 'Não foi possível carregar.');
  assert.equal(mensagemDe({ status: 503, mensagem: '' }), FALHA_CARGA);
});

test('falha de rede (sem status, status 0 ou TypeError) vira "Não foi possível carregar."', () => {
  assert.equal(mensagemDe(new TypeError('Failed to fetch')), FALHA_CARGA);
  assert.equal(mensagemDe({ status: 0, mensagem: '' }), FALHA_CARGA);
  assert.equal(mensagemDe(null), FALHA_CARGA);
  assert.equal(mensagemDe(undefined), FALHA_CARGA);
});

test('4xx sem mensagem cai na mensagem genérica de carga', () => {
  assert.equal(mensagemDe({ status: 400, mensagem: '' }), FALHA_CARGA);
  assert.equal(mensagemDe({ status: 404 }), FALHA_CARGA);
});

test('os textos fixos são os da spec (ADM-03.4 e Edge Cases)', () => {
  assert.equal(SEM_CONTA, 'Nenhuma conta com este e-mail. A pessoa precisa entrar na plataforma uma vez.');
  assert.equal(EMAIL_INVALIDO, 'Digite um e-mail válido.');
});

test('emailValido recusa vazio, só espaços, sem arroba e sem domínio', () => {
  assert.equal(emailValido(''), false);
  assert.equal(emailValido('   '), false);
  assert.equal(emailValido('pessoa.legisla.org'), false);
  assert.equal(emailValido('pessoa@'), false);
  assert.equal(emailValido('@legisla.org'), false);
  assert.equal(emailValido('pessoa@legisla'), false);
  assert.equal(emailValido('a b@legisla.org'), false);
  assert.equal(emailValido('a@@legisla.org'), false);
});

test('emailValido aceita endereço comum e ignora espaços nas pontas (ADM-03.3)', () => {
  assert.equal(emailValido('pessoa@legislabrasil.org'), true);
  assert.equal(emailValido('  Pessoa.Nome+x@sub.legisla.org  '), true);
});
