import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrevia, fotoUrl, inicial, legendaPos, legendaVagas, numeros, type EntradaRetrato } from '../lib/resumoRetrato.ts';

/* Retrato do mandato no cabeçalho do Resumo (RES-06): foto, inicial, formatos e só os números que têm fonte. */

/* ---------- foto do TSE (RES-06.2, 06.3) ---------- */
test('fotoUrl usa ele2026/6259 para deputado, com a UF em minúsculas e o sq como arquivo .jpeg (RES-06.2)', () => {
  assert.equal(fotoUrl({ sq: '250002000123', uf: 'SP', cargo: 'Deputado(a) Estadual' }),
    'https://resultados.tse.jus.br/oficial/ele2026/6259/fotos/sp/250002000123.jpeg');
  assert.equal(fotoUrl({ sq: 7, uf: 'DF', cargo: 'Senador(a)' }), 'https://resultados.tse.jus.br/oficial/ele2026/6259/fotos/df/7.jpeg');
});

test('fotoUrl usa ele2024/619 para vereador e prefeito (RES-06.2)', () => {
  assert.equal(fotoUrl({ sq: '1', uf: 'RJ', cargo: 'Vereador(a)' }), 'https://resultados.tse.jus.br/oficial/ele2024/619/fotos/rj/1.jpeg');
  assert.equal(fotoUrl({ sq: '2', uf: 'MG', cargo: 'Prefeito(a)' }), 'https://resultados.tse.jus.br/oficial/ele2024/619/fotos/mg/2.jpeg');
});

test('fotoUrl sem sq devolve null (RES-06.3)', () => {
  for (const sq of [undefined, null, '', '  ']) assert.equal(fotoUrl({ sq, uf: 'SP', cargo: 'Deputado(a) Federal' }), null, String(sq));
});

/* ---------- inicial (RES-06.3, edge case) ---------- */
test('inicial devolve a primeira letra em maiúscula, com acento ("Ângela" → "Â") (RES-06.3)', () => {
  assert.equal(inicial('Ângela'), 'Â');
  assert.equal(inicial('ana souza'), 'A');
  assert.equal(inicial('Ângela'), 'Â'); // acento combinado (NFD)
});

test('inicial de nome vazio devolve "?" (RES-06.3)', () => {
  for (const n of ['', '   ', undefined, null]) assert.equal(inicial(n), '?', String(n));
});

test('inicial pula espaço e emoji no início e devolve a primeira letra visível, sem erro (edge case)', () => {
  assert.equal(inicial('  bia'), 'B');
  assert.equal(inicial('😀 Zélia'), 'Z');
  assert.equal(inicial('🇧🇷 érica'), 'É');
  assert.equal(inicial('😀'), '?');
});

/* ---------- formatos (RES-06.4, 06.6) ---------- */
test('abrevia(97335) devolve o valor exato da votação em pt-BR, "97.335" (RES-06.4)', () => {
  assert.equal(abrevia(97335), '97.335');
  assert.equal(abrevia(1234567), '1.234.567');
});

test('a abreviação dos filiados vale a partir de 10.000: "112 mil+", "10 mil+", e "9.800" abaixo disso (RES-06.6)', () => {
  assert.equal(abrevia(112340, true), '112 mil+');
  assert.equal(abrevia(10000, true), '10 mil+');
  assert.equal(abrevia(9800, true), '9.800');
  assert.equal(abrevia(9999, true), '9.999');
});

test('legendaPos devolve "57º mais votado(a) · SP · TSE"; sem posição, sem legenda (RES-06.4)', () => {
  assert.equal(legendaPos(57, 'SP'), '57º mais votado(a) · SP · TSE');
  assert.equal(legendaPos(undefined, 'SP'), '');
  assert.equal(legendaPos(null, 'SP'), '');
});

test('legendaVagas: singular com 1, plural com mais, vazio com 0 (RES-06.7)', () => {
  assert.equal(legendaVagas(1), '1 processo seletivo a abrir');
  assert.equal(legendaVagas(3), '3 processos seletivos a abrir');
  assert.equal(legendaVagas(0), '');
});

/* ---------- números com fonte (RES-06.4 a 06.8) ---------- */
const COMPLETA: EntradaRetrato = {
  tse: { votos: 97335, pos: 57, uf: 'SP' }, partido: 'PSB', uf: 'SP', casa: 'Assembleia Legislativa de SP',
  cadeiras: 2, filiados: 112340, equipe: { comNome: 11, ativas: 20, vagas: 3 },
};

test('com todas as fontes, numeros devolve votos, cadeiras, filiados e equipe, nessa ordem, com rótulos e legendas da spec (RES-06.4 a 06.7)', () => {
  assert.deepEqual(numeros(COMPLETA), [
    { id: 'votos', valor: '97.335', rotulo: 'Votos válidos', legenda: '57º mais votado(a) · SP · TSE' },
    { id: 'cadeiras', valor: '2', rotulo: 'Cadeiras do PSB na Assembleia Legislativa de SP', legenda: '' },
    { id: 'filiados', valor: '112 mil+', rotulo: 'Filiados do PSB em SP', legenda: '' },
    { id: 'equipe', valor: '11/20', rotulo: 'Cargos da equipe com nome', legenda: '3 processos seletivos a abrir' },
  ]);
});

test('votação sem posição sai sem legenda (RES-06.4)', () => {
  assert.deepEqual(numeros({ tse: { votos: 4210 } }), [{ id: 'votos', valor: '4.210', rotulo: 'Votos válidos', legenda: '' }]);
});

test('numeros omite cada número cuja fonte falta: sem TSE, sem partido, sem a Casa, carga que falhou, tabela vazia (RES-06.8)', () => {
  const ids = (e: EntradaRetrato) => numeros({ ...COMPLETA, ...e }).map((n) => n.id);
  assert.deepEqual(ids({ tse: null }), ['cadeiras', 'filiados', 'equipe']);
  assert.deepEqual(ids({ tse: { pos: 57 } }), ['cadeiras', 'filiados', 'equipe']);
  assert.deepEqual(ids({ partido: '' }), ['votos', 'equipe']);
  assert.deepEqual(ids({ casa: null }), ['votos', 'filiados', 'equipe']);
  assert.deepEqual(ids({ cadeiras: undefined }), ['votos', 'filiados', 'equipe']);
  assert.deepEqual(ids({ filiados: undefined }), ['votos', 'cadeiras', 'equipe']);
  assert.deepEqual(ids({ equipe: { comNome: 0, ativas: 0, vagas: 0 } }), ['votos', 'cadeiras', 'filiados']);
  assert.deepEqual(ids({ equipe: null }), ['votos', 'cadeiras', 'filiados']);
});

test('sem nenhuma fonte, numeros devolve lista vazia (RES-06.8)', () => {
  assert.deepEqual(numeros({}), []);
  assert.deepEqual(numeros({ tse: null, partido: null, uf: null, casa: null, cadeiras: null, filiados: null, equipe: null }), []);
});

test('equipe sem processos a abrir mostra X/Y sem legenda (RES-06.7)', () => {
  assert.deepEqual(numeros({ equipe: { comNome: 4, ativas: 4, vagas: 0 } }), [{ id: 'equipe', valor: '4/4', rotulo: 'Cargos da equipe com nome', legenda: '' }]);
});
