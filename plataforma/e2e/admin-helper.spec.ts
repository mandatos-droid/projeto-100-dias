import { test, expect } from '@playwright/test';
import { chavesProibidasEm, pedidoCitaChaves } from './admin-api';

/* Autoteste do ajudante `vazou()` dos e2e do /admin: sem página, só chamando as funções com respostas sintéticas.
   Sem isto o ajudante podia estar cego (mutantes E8 e E10 do Verifier) sem ninguém notar. */
test.describe('chavesProibidasEm (varredura de resposta)', () => {
  test('acha chave proibida na raiz', () => {
    expect(chavesProibidasEm({ id: 1, dados: {} })).toEqual(['dados']);
    expect(chavesProibidasEm({ texto: 'x', nome_civil: 'y', resp_telefone: 'z' })).toEqual(['texto', 'nome_civil', 'resp_telefone']);
  });

  test('acha chave proibida aninhada em objeto', () => {
    expect(chavesProibidasEm({ mandato: { id: 1, extra: { resp_telefone: '1' } } })).toEqual(['resp_telefone']);
  });

  test('acha chave proibida dentro de array, inclusive array de arrays', () => {
    expect(chavesProibidasEm([{ id: 1 }, { id: 2, texto: 'segredo' }])).toEqual(['texto']);
    expect(chavesProibidasEm({ linhas: [[{ nome_civil: 'a' }]] })).toEqual(['nome_civil']);
  });

  test('acha chave com caixa diferente', () => {
    expect(chavesProibidasEm({ Dados: {}, TEXTO: 'x' })).toEqual(['Dados', 'TEXTO']);
  });

  test('resposta limpa, vazia ou de tipo simples não acusa nada', () => {
    expect(chavesProibidasEm([{ id: 1, codigo: 'ABC', membros: 2 }])).toEqual([]);
    expect(chavesProibidasEm({ dados_extra: 1, textos: [], nome: 'a' })).toEqual([]); // nome parecido não é a chave
    expect(chavesProibidasEm(null)).toEqual([]);
    expect(chavesProibidasEm('dados')).toEqual([]);
    expect(chavesProibidasEm(undefined)).toEqual([]);
  });

  test('limite conhecido: o mesmo conteúdo sob outro nome não é detectado por nome (a proteção é o pedido e o SQL)', () => {
    expect(chavesProibidasEm({ id: 1, conteudo: { notas: 'segredo' } })).toEqual([]);
  });
});

test.describe('pedidoCitaChaves (regex do pedido)', () => {
  test('acha a coluna citada no select, no order e com caixa diferente', () => {
    expect(pedidoCitaChaves('?select=id,dados')).toEqual(['dados']);
    expect(pedidoCitaChaves('?select=id&order=nome_civil.asc')).toEqual(['nome_civil']);
    expect(pedidoCitaChaves('?select=id,DADOS')).toEqual(['dados']);
    expect(pedidoCitaChaves('?select=id%2Ctexto')).toEqual(['texto']);
  });

  test('pedido só com metadados não acusa nada', () => {
    expect(pedidoCitaChaves('?select=id,codigo,nome_parlamentar&order=ultima_atividade.desc,id&limit=1000&offset=0')).toEqual([]);
    expect(pedidoCitaChaves('')).toEqual([]);
  });
});
