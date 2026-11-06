import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mensagemDe } from '../lib/convites/erros.ts';

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
