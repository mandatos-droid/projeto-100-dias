import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mensagemDe, mensagemDoLogin } from '../lib/convites/erros.ts';

const INVALIDO = 'Este convite não vale mais. Peça um novo para quem convidou você.';
const DESCONHECIDO = 'Não foi possível concluir. Tente de novo.';

test('código invalido devolve a mensagem do convite que não vale mais (ACE-02.10, ACE-02.11)', () => {
  assert.equal(mensagemDe('invalido'), INVALIDO);
  assert.equal(mensagemDe({ ok: false, erro: 'invalido' }), INVALIDO);
});

test('código email devolve a mensagem de outro e-mail (ACE-02.9)', () => {
  assert.equal(
    mensagemDe({ ok: false, erro: 'email' }),
    'Este convite é para outro e-mail. Entre com a conta indicada ou peça um novo convite.',
  );
});

test('código limite devolve a mensagem de muitas tentativas (ACE-02.14)', () => {
  assert.equal(mensagemDe('limite'), 'Muitas tentativas. Tente de novo em alguns minutos.');
  assert.equal(mensagemDe({ ok: false, erro: 'limite' }), 'Muitas tentativas. Tente de novo em alguns minutos.');
});

test('exceção de papel maior devolve o texto da spec (ACE-01.6)', () => {
  assert.equal(
    mensagemDe({ status: 400, mensagem: 'Você só pode convidar com papel igual ou menor que o seu.' }),
    'Você só pode convidar com papel igual ou menor que o seu.',
  );
});

test('exceção de 20 pendentes devolve o texto da spec (ACE-01.9)', () => {
  assert.equal(
    mensagemDe({ status: 400, mensagem: 'Este mandato já tem 20 convites pendentes. Cancele algum para criar outro.' }),
    'Este mandato já tem 20 convites pendentes. Cancele algum para criar outro.',
  );
});

test('exceção de última coordenação devolve o texto da spec (ACE-03.7)', () => {
  assert.equal(
    mensagemDe({ status: 400, mensagem: 'O mandato precisa ter ao menos uma pessoa na coordenação.' }),
    'O mandato precisa ter ao menos uma pessoa na coordenação.',
  );
});

test('exceções de nome e e-mail inválidos devolvem os textos da spec (ACE-01.7, ACE-01.8)', () => {
  assert.equal(mensagemDe({ status: 400, mensagem: 'Informe um nome de até 80 caracteres.' }), 'Informe um nome de até 80 caracteres.');
  assert.equal(mensagemDe({ status: 400, mensagem: 'E-mail inválido.' }), 'E-mail inválido.');
});

test('recusa de permissão (403) devolve o texto de permissão do banco', () => {
  assert.equal(mensagemDe({ status: 403, mensagem: 'permission denied for function convite_cancelar' }), 'Você não tem permissão para esta ação.');
  assert.equal(mensagemDe({ status: 400, mensagem: 'Você não tem permissão para esta ação.' }), 'Você não tem permissão para esta ação.');
});

test('erro desconhecido devolve "Não foi possível concluir. Tente de novo."', () => {
  assert.equal(mensagemDe(new Error('boom')), DESCONHECIDO);
  assert.equal(mensagemDe({ status: 0, mensagem: '' }), DESCONHECIDO);
  assert.equal(mensagemDe({ status: 500, mensagem: 'internal' }), DESCONHECIDO);
  assert.equal(mensagemDe({ status: 400, mensagem: 'texto qualquer do banco' }), DESCONHECIDO);
  assert.equal(mensagemDe('codigo-novo'), DESCONHECIDO);
  assert.equal(mensagemDe(null), DESCONHECIDO);
  assert.equal(mensagemDe(undefined), DESCONHECIDO);
});

// ---- mensagemDoLogin: recusas do Supabase Auth (GoTrue) na página do convite, em português (ACE-02.15) ----
// O GoTrue responde em inglês, com `error_code` + `msg` (versões novas) ou `error_description` (antigas);
// sessao.ts repassa só o texto num Error. A spec pede "mostrar o motivo" sem fixar o texto.

test('mensagemDoLogin: e-mail já usado mostra o motivo em português (ACE-02.15)', () => {
  const JA_TEM_CONTA = 'Este e-mail já tem conta. Entre com ele para aceitar o convite.';
  assert.equal(mensagemDoLogin({ code: 422, error_code: 'user_already_exists', msg: 'User already registered' }), JA_TEM_CONTA);
  assert.equal(mensagemDoLogin({ error_code: 'email_exists', msg: 'Email address already registered by another user' }), JA_TEM_CONTA);
  assert.equal(mensagemDoLogin(new Error('User already registered')), JA_TEM_CONTA);
});

test('mensagemDoLogin: senha fraca mostra o motivo em português (ACE-02.15)', () => {
  const FRACA = 'Senha fraca. Escolha uma senha mais longa, com letras e números.';
  assert.equal(mensagemDoLogin({ error_code: 'weak_password', msg: 'Password should be at least 6 characters.' }), FRACA);
  assert.equal(mensagemDoLogin(new Error('Password should be at least 6 characters.')), FRACA);
});

test('mensagemDoLogin: confirmação de e-mail pendente pede para confirmar e entrar', () => {
  assert.equal(mensagemDoLogin(new Error('Email not confirmed')), 'Confirme o e-mail enviado e faça login.');
  assert.equal(mensagemDoLogin({ error_code: 'email_not_confirmed', msg: 'Email not confirmed' }), 'Confirme o e-mail enviado e faça login.');
});

test('mensagemDoLogin: e-mail ou senha errados, e-mail mal formado e limite de envio', () => {
  assert.equal(mensagemDoLogin(new Error('Invalid login credentials')), 'E-mail ou senha incorretos.');
  assert.equal(mensagemDoLogin({ error: 'invalid_grant', error_description: 'Invalid login credentials' }), 'E-mail ou senha incorretos.');
  assert.equal(mensagemDoLogin({ error_code: 'email_address_invalid', msg: 'Email address "x@y" is invalid' }), 'E-mail inválido.');
  assert.equal(mensagemDoLogin(new Error('Unable to validate email address: invalid format')), 'E-mail inválido.');
  assert.equal(mensagemDoLogin({ error_code: 'over_email_send_rate_limit', msg: 'email rate limit exceeded' }), 'Muitas tentativas. Tente de novo em alguns minutos.');
});

test('mensagemDoLogin: texto desconhecido, falha de rede e vazio devolvem "Não foi possível concluir. Tente de novo."', () => {
  assert.equal(mensagemDoLogin(new Error('Database error saving new user')), DESCONHECIDO);
  assert.equal(mensagemDoLogin(new TypeError('Failed to fetch')), DESCONHECIDO);
  assert.equal(mensagemDoLogin({}), DESCONHECIDO);
  assert.equal(mensagemDoLogin(null), DESCONHECIDO);
});
