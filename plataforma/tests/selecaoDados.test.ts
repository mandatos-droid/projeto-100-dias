import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proximo, mensagem, estadoInicial, dadosFinais, AVISO_REPETIDO, type Par } from '../lib/selecaoDados.ts';

const A = { id: 'filiados', nome: 'Filiados do partido', valor: '10' };
const B = { id: 'vereadores', nome: 'Vereadores do partido', valor: '20' };
const C = { id: 'mun:1:pct', nome: '% em X', valor: '5%' };
const vazio: Par = [null, null];

test('iniciar abre a captura pedindo o 1º dado (AC1)', () => {
  const e = proximo(estadoInicial(), { tipo: 'iniciar', atuais: vazio });
  assert.equal(e.fase, 'capturando');
  assert.match(mensagem(e), /1º/);
});

test('o 1º clique não grava e pede o 2º; o 2º conclui com os dois em ordem (AC1, AC2)', () => {
  let e = proximo(estadoInicial(), { tipo: 'iniciar', atuais: vazio });
  e = proximo(e, { tipo: 'capturar', dado: A });
  assert.equal(e.fase, 'capturando');
  assert.match(mensagem(e), /2º/);
  assert.deepEqual(e.atuais, vazio); // nada gravado pela metade
  e = proximo(e, { tipo: 'capturar', dado: B });
  assert.equal(e.fase, 'concluida');
  assert.deepEqual(dadosFinais(e), [A, B]);
});

test('clicar o mesmo dado de novo é ignorado e avisa (AC4)', () => {
  let e = proximo(estadoInicial(), { tipo: 'iniciar', atuais: vazio });
  e = proximo(e, { tipo: 'capturar', dado: A });
  e = proximo(e, { tipo: 'capturar', dado: A });
  assert.equal(e.fase, 'capturando');
  assert.deepEqual(e.novos, [A]);
  assert.ok(mensagem(e).includes(AVISO_REPETIDO));
  e = proximo(e, { tipo: 'capturar', dado: B }); // o aviso some ao capturar um dado válido
  assert.equal(mensagem(e), '');
  assert.equal(e.fase, 'concluida');
});

test('cancelar no meio descarta o 1º clique e não grava nada (AC5)', () => {
  let e = proximo(estadoInicial(), { tipo: 'iniciar', atuais: vazio });
  e = proximo(e, { tipo: 'capturar', dado: A });
  e = proximo(e, { tipo: 'cancelar' });
  assert.equal(e.fase, 'ociosa');
  assert.deepEqual(dadosFinais(e), vazio);
  assert.equal(mensagem(e), '');
});

test('remover um chip limpa só aquele e permite reabrir pedindo só a vaga livre (AC3)', () => {
  let e = proximo(estadoInicial([A, B]), { tipo: 'remover', i: 0 });
  assert.deepEqual(e.atuais, [null, B]);
  assert.equal(e.fase, 'ociosa');
  e = proximo(e, { tipo: 'iniciar', atuais: e.atuais });
  assert.match(mensagem(e), /1º/);
  e = proximo(e, { tipo: 'capturar', dado: B }); // o dado que já está no outro chip também é repetido
  assert.equal(e.fase, 'capturando');
  e = proximo(e, { tipo: 'capturar', dado: C });
  assert.equal(e.fase, 'concluida');
  assert.deepEqual(dadosFinais(e), [C, B]);
});

test('remover o 2º chip pede o 2º dado e conclui com um só clique', () => {
  let e = proximo(estadoInicial([A, B]), { tipo: 'remover', i: 1 });
  e = proximo(e, { tipo: 'iniciar', atuais: e.atuais });
  assert.match(mensagem(e), /2º/);
  e = proximo(e, { tipo: 'capturar', dado: C });
  assert.deepEqual(dadosFinais(e), [A, C]);
});

test('sem vaga livre não inicia; clique fora da captura é ignorado', () => {
  const cheio = proximo(estadoInicial([A, B]), { tipo: 'iniciar', atuais: [A, B] });
  assert.equal(cheio.fase, 'ociosa');
  const ocioso = estadoInicial();
  assert.equal(proximo(ocioso, { tipo: 'capturar', dado: A }), ocioso);
});
