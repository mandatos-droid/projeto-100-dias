import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criaRegistrador, funcionalidadeDe } from '../lib/uso.ts';

// relógio controlado: avança em milissegundos
function relogio() {
  let t = 1_000_000;
  return { agora: () => t, avanca: (ms: number) => { t += ms; } };
}

test('a primeira abertura grava (ADM-14.1)', () => {
  const r = relogio();
  assert.equal(criaRegistrador(60000, r.agora)('m1', 'persona'), true);
});

test('repetição em 59 s é ignorada (ADM-14.5)', () => {
  const r = relogio();
  const d = criaRegistrador(60000, r.agora);
  d('m1', 'persona');
  r.avanca(59000);
  assert.equal(d('m1', 'persona'), false);
});

test('com 60 s grava de novo e a janela recomeça dali (ADM-14.5)', () => {
  const r = relogio();
  const d = criaRegistrador(60000, r.agora);
  d('m1', 'persona');
  r.avanca(60000);
  assert.equal(d('m1', 'persona'), true);
  r.avanca(59000);
  assert.equal(d('m1', 'persona'), false);
});

test('ignorar uma repetição não estende a janela', () => {
  const r = relogio();
  const d = criaRegistrador(60000, r.agora);
  d('m1', 'persona');
  r.avanca(30000);
  d('m1', 'persona');
  r.avanca(30000);
  assert.equal(d('m1', 'persona'), true);
});

test('outro mandato e outra funcionalidade têm janela própria (ADM-14.5)', () => {
  const r = relogio();
  const d = criaRegistrador(60000, r.agora);
  d('m1', 'persona');
  assert.equal(d('m2', 'persona'), true);
  assert.equal(d('m1', 'social'), true);
});

test('sem mandato ou sem funcionalidade não grava (ADM-14.1)', () => {
  const d = criaRegistrador();
  assert.equal(d(null, 'persona'), false);
  assert.equal(d('', 'persona'), false);
  assert.equal(d(undefined, 'persona'), false);
  assert.equal(d('m1', null), false);
});

test('a janela padrão é de 60 s', () => {
  const r = relogio();
  // sem passar a janela: usa o padrão com o relógio injetado como 2º argumento
  const d = criaRegistrador(undefined, r.agora);
  d('m1', 'persona');
  r.avanca(59999);
  assert.equal(d('m1', 'persona'), false);
  r.avanca(1);
  assert.equal(d('m1', 'persona'), true);
});

test('funcionalidadeDe devolve o id estável das ilhas medidas e null para as demais', () => {
  assert.equal(funcionalidadeDe('persona-tse'), 'persona');
  assert.equal(funcionalidadeDe('calor'), 'conjuntura');
  assert.equal(funcionalidadeDe('municipio'), 'municipio');
  assert.equal(funcionalidadeDe('eleitorado'), 'eleitorado');
  assert.equal(funcionalidadeDe('social'), 'social');
  assert.equal(funcionalidadeDe('equipe-tabela'), 'cadeiras');
  assert.equal(funcionalidadeDe('ficha-3'), 'cadeiras');
  assert.equal(funcionalidadeDe('organograma'), 'organograma');
  assert.equal(funcionalidadeDe('quadro-rotinas'), 'organograma');
});

test('ilha desconhecida, resumo e nomes herdados do Object dão null', () => {
  for (const n of ['', 'nao-existe', 'calor-resumo', 'plano', 'ficha-x', 'constructor', 'toString', '__proto__']) {
    assert.equal(funcionalidadeDe(n), null, n);
  }
});
