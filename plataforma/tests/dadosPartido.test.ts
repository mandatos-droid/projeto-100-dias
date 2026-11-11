import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dadosSelecionaveis, frase, defineReacao } from '../lib/dadosPartido.ts';
import type { MunPartido, PlacarPartido } from '../lib/dadosPartido.ts';

const placar: PlacarPartido = {
  parlamentares: { uf: 3, br: 1200 }, vereadores: { uf: 45, br: 6000 }, prefeituras: { uf: 7, br: 800 },
  filiados: { uf: 12000, br: 1500000 }, executivos: 'Base aliada',
};
const muns: MunPartido[] = [
  { cdi: '5208707', nome: 'Goiânia', vereadoresPartido: 4, filiados: 2300, pct: 12.5 },
  { cdi: '5201405', nome: 'Aparecida', vereadoresPartido: 1, filiados: 90, pct: 3 },
];

test('dadosSelecionaveis lista placar e, por município, vereadores, filiados e % de votos, com valor formatado (PAR-10)', () => {
  const r = dadosSelecionaveis(placar, muns);
  assert.deepEqual(r.map((d) => d.nome), [
    'Parlamentares do partido', 'Vereadores do partido', 'Prefeituras do partido', 'Filiados do partido',
    'Posição do partido nos Executivos',
    'Vereadores do partido em Goiânia', 'Filiados do partido em Goiânia', '% de votos do partido em Goiânia',
    'Vereadores do partido em Aparecida', 'Filiados do partido em Aparecida', '% de votos do partido em Aparecida',
  ]);
  const por = Object.fromEntries(r.map((d) => [d.id, d.valor]));
  assert.equal(por.parlamentares, '3 no estado, 1.200 no Brasil');
  assert.equal(por.filiados, '12.000 no estado, 1.500.000 no Brasil');
  assert.equal(por.executivos, 'Base aliada');
  assert.equal(por['mun:5208707:vereadores'], '4');
  assert.equal(por['mun:5208707:filiados'], '2.300');
  assert.equal(por['mun:5208707:pct'], '12,50%');
});

test('os ids dos dados são únicos (PAR-10)', () => {
  const ids = dadosSelecionaveis(placar, muns).map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('sem municípios, só os dados do Placar (PAR-08)', () => {
  assert.equal(dadosSelecionaveis(placar, []).length, 5);
});

test('frase devolve "Considerando {nome}: {valor}, o mandato deve" (PAR-11)', () => {
  assert.equal(frase({ id: 'x', nome: 'Filiados do partido', valor: '12.000 no estado, 1.500.000 no Brasil' }),
    'Considerando Filiados do partido: 12.000 no estado, 1.500.000 no Brasil, o mandato deve');
});

const d1 = { id: 'filiados', nome: 'Filiados do partido', valor: '10' };
const d2 = { id: 'executivos', nome: 'Posição do partido nos Executivos', valor: 'Oposição' };
const d3 = { id: 'vereadores', nome: 'Vereadores do partido', valor: '5' };

test('defineReacao grava dado, valor e texto na linha escolhida (PAR-12)', () => {
  const r = defineReacao([], 0, d1, 'fortalecer a base');
  assert.deepEqual(r, [{ dado: 'filiados', valor: '10', texto: 'fortalecer a base' }]);
  const r2 = defineReacao(r, 1, d2, 'fazer oposição');
  assert.deepEqual(r2, [r[0], { dado: 'executivos', valor: 'Oposição', texto: 'fazer oposição' }]);
});

test('defineReacao ignora o índice 2 e nunca passa de 2 linhas (PAR-12)', () => {
  const dois = defineReacao(defineReacao([], 0, d1, 'a'), 1, d2, 'b');
  const r = defineReacao(dois, 2, d3, 'c');
  assert.deepEqual(r, dois);
  assert.equal(r.length, 2);
});

test('defineReacao troca o dado e o texto de uma linha já preenchida sem mexer na outra (PAR-12)', () => {
  const dois = defineReacao(defineReacao([], 0, d1, 'a'), 1, d2, 'b');
  const r = defineReacao(dois, 0, d3, 'novo');
  assert.deepEqual(r[0], { dado: 'vereadores', valor: '5', texto: 'novo' });
  assert.deepEqual(r[1], dois[1]);
});

test('defineReacao não altera a lista recebida', () => {
  const antes = [{ dado: 'filiados', valor: '10', texto: 'a' }];
  defineReacao(antes, 0, d2, 'z');
  assert.deepEqual(antes, [{ dado: 'filiados', valor: '10', texto: 'a' }]);
});

test('defineReacao com dado nulo limpa a linha (PAR-12)', () => {
  const dois = defineReacao(defineReacao([], 0, d1, 'a'), 1, d2, 'b');
  assert.deepEqual(defineReacao(dois, 1, null, ''), [dois[0]]);
  assert.deepEqual(defineReacao(dois, 0, null, ''), [{ dado: '', valor: '', texto: '' }, dois[1]]);
});
