import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  argumentosPerfil, camposDoPerfil, confereEmail, ERRO_SALVAR_PERFIL, ERRO_SEM_PERFIL, mandatosDisponiveis,
  mensagemPerfil, opcoesPapelMandato,
} from '../lib/admin/usuariosEdicao.ts';
import { validaPerfil } from '../lib/perfil/validacao.ts';

const PERFIL = { nome: 'Joana Souza', nascimento: '1987-03-21T00:00:00', genero: 'preta', raca: 'x', telefone: '21912345678', atua: true, tempo: '6_10' };

test('camposDoPerfil: corta a data, traduz atua e dispensa as caixas de consentimento', () => {
  const c = camposDoPerfil({ ...PERFIL, genero: 'mulher_trans', raca: 'preta' });
  assert.equal(c.nascimento, '1987-03-21');
  assert.equal(c.atua, 'sim');
  assert.equal(camposDoPerfil({ ...PERFIL, atua: false, tempo: null }).atua, 'nao');
  assert.equal(c.consentimento, true);
  assert.equal(c.sensiveis, true);
});

test('perfil gravado passa direto no validaPerfil e vira os argumentos da RPC', () => {
  const r = validaPerfil(camposDoPerfil({ ...PERFIL, genero: 'mulher_trans', raca: 'preta' }));
  assert.ok(r.ok);
  assert.deepEqual(argumentosPerfil('u1', r.dados), {
    p_user: 'u1', p_nome: 'Joana Souza', p_nascimento: '1987-03-21', p_genero: 'mulher_trans', p_raca: 'preta',
    p_telefone: '21912345678', p_atua: true, p_tempo: '6_10',
  });
});

test('mensagemPerfil: campo conhecido, sem_perfil e desconhecido', () => {
  assert.match(mensagemPerfil('nome'), /nome completo/);
  assert.match(mensagemPerfil('telefone'), /telefone com DDD/);
  assert.equal(mensagemPerfil('sem_perfil'), ERRO_SEM_PERFIL);
  assert.equal(mensagemPerfil('xx'), ERRO_SALVAR_PERFIL);
  assert.equal(mensagemPerfil(undefined), ERRO_SALVAR_PERFIL);
});

test('confereEmail: ignora caixa e espaços; vazio só confere com conta sem e-mail', () => {
  assert.equal(confereEmail('  Ana@Exemplo.com ', 'ana@exemplo.com'), true);
  assert.equal(confereEmail('ana@exemplo.co', 'ana@exemplo.com'), false);
  assert.equal(confereEmail('', 'ana@exemplo.com'), false);
  assert.equal(confereEmail('', null), true);
});

test('opcoesPapelMandato: mantém o papel atual mesmo fora da lista que o banco aceita', () => {
  assert.deepEqual(opcoesPapelMandato('coordenacao'), ['assessoria', 'coordenacao']);
  assert.deepEqual(opcoesPapelMandato('leitura'), ['leitura', 'assessoria', 'coordenacao']);
});

test('mandatosDisponiveis: tira os mandatos em que a pessoa já está', () => {
  const todos = [{ id: 'a', nome_parlamentar: 'A', arquivado_em: null }, { id: 'b', nome_parlamentar: 'B', arquivado_em: null }];
  assert.deepEqual(mandatosDisponiveis(todos, [{ id: 'a' }]).map((m) => m.id), ['b']);
  assert.equal(mandatosDisponiveis(todos, []).length, 2);
});
