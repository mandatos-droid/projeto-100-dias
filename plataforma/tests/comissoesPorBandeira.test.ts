import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BANDEIRA_COMISSAO } from '../lib/comissoesPorBandeira.ts';
import { BANDEIRAS } from '../lib/bandeiras.ts';

/* CAP-01: a tabela nossa liga cada bandeira às comissões da Câmara; toda sigla precisa existir no catálogo br.json. */
const br = JSON.parse(readFileSync(new URL('../public/data/comissoes/br.json', import.meta.url), 'utf8')) as { comissoes: { nome: string; sigla: string }[] };
const siglasDoCatalogo = new Set(br.comissoes.map((c) => c.sigla));

test('toda bandeira da taxonomia tem ao menos uma sigla de comissão (CAP-01)', () => {
  assert.equal(BANDEIRAS.length, 19);
  BANDEIRAS.forEach((b) => {
    const siglas = BANDEIRA_COMISSAO[b.id];
    assert.ok(Array.isArray(siglas) && siglas.length >= 1, `${b.id} sem sigla`);
  });
});

test('a tabela só tem ids de bandeira que existem na taxonomia (CAP-01)', () => {
  const ids = new Set(BANDEIRAS.map((b) => b.id));
  Object.keys(BANDEIRA_COMISSAO).forEach((id) => assert.ok(ids.has(id), `${id} não é bandeira`));
});

test('toda sigla da tabela existe no public/data/comissoes/br.json (CAP-01)', () => {
  assert.ok(siglasDoCatalogo.size > 0);
  Object.entries(BANDEIRA_COMISSAO).forEach(([id, siglas]) =>
    siglas.forEach((s) => assert.ok(siglasDoCatalogo.has(s), `${id}: a sigla ${s} não existe no br.json`)));
});

test('as bandeiras de tema óbvio apontam para a comissão esperada (CAP-01, Independent Test: Saúde → CSAUDE)', () => {
  assert.deepEqual(BANDEIRA_COMISSAO['saude'], ['CSAUDE']);
  assert.deepEqual(BANDEIRA_COMISSAO['educacao'], ['CE']);
  assert.deepEqual(BANDEIRA_COMISSAO['mulheres'], ['CMULHER']);
});
