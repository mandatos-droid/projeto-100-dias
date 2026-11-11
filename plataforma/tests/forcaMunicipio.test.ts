import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pctMun, pctEstado, numerosMun } from '../lib/forcaMunicipio.ts';
import type { FiliadosUF, Mun, MunUF } from '../lib/types.ts';

/* PAR-05 e PAR-06: vereadores do município e do partido, filiados e as duas % de votos do partido (município e estado). */
const A: Mun = {
  nm: 'Alfa',
  estadual: { v: 1000, p: [['PSOL', 250], ['PT', 400]] },
  senador: { v: 800, p: [['PSOL', 80]] },
  m24: { pref: { v: 900, p: [], cands: [] }, ver: { v: 900, p: [], eleitos: [], el: { PSOL: 2, PT: 3, PL: 4 } } },
};
const B: Mun = { nm: 'Beta', estadual: { v: 3000, p: [['PSOL', 150]] } };
const C: Mun = { nm: 'Gama' }; // sem votação do cargo
const munUF: MunUF = { atualizado: null, mun: { 1: A, 2: B, 3: C } };
const fil = { ref: '', geracao: '', uf: {}, mun: { 1: { PSOL: [340, [], [], []] } } } as unknown as FiliadosUF;

test('% do partido no município: votos do partido / válidos do cargo × 100 (PAR-06)', () => {
  assert.equal(pctMun(A, 'estadual', 'PSOL'), 25);
  assert.equal(pctMun(A, 'senado', 'PSOL'), 10); // senado lê o bloco "senador"
  assert.equal(pctMun(B, 'estadual', 'PSOL'), 5);
});

test('partido sem votos no município com votação: 0%; sem votação do cargo, casa ou município: null (PAR-06)', () => {
  assert.equal(pctMun(A, 'estadual', 'NOVO'), 0);
  assert.equal(pctMun(C, 'estadual', 'PSOL'), null);
  assert.equal(pctMun(A, null, 'PSOL'), null);
  assert.equal(pctMun(undefined, 'estadual', 'PSOL'), null);
  assert.equal(pctMun(A, 'federal', 'PSOL'), null);
});

test('% do partido no estado: soma dos votos do partido / soma dos válidos, só dos municípios com votação (PAR-06)', () => {
  assert.equal(pctEstado(munUF.mun, 'estadual', 'PSOL'), 10); // (250 + 150) / (1000 + 3000)
  assert.equal(pctEstado(munUF.mun, 'senado', 'PSOL'), 10); // 80 / 800
  assert.equal(pctEstado(munUF.mun, 'estadual', 'NOVO'), 0);
});

test('% do partido no estado: sem votação em nenhum município, sem casa ou sem dados: null (PAR-06)', () => {
  assert.equal(pctEstado(munUF.mun, 'federal', 'PSOL'), null);
  assert.equal(pctEstado(munUF.mun, null, 'PSOL'), null);
  assert.equal(pctEstado(undefined, 'estadual', 'PSOL'), null);
  assert.equal(pctEstado({}, 'estadual', 'PSOL'), null);
});

test('números do município: vereadores do município (soma) e do partido, filiados, % e nome do arquivo (PAR-05)', () => {
  const n = numerosMun({ cdi: '1', nome: 'x' }, munUF, fil, 'estadual', 'PSOL');
  assert.deepEqual(n, { cdi: '1', nome: 'Alfa', vereadoresPartido: 2, vereadoresTotal: 9, filiados: 340, pct: 25 });
});

test('números do município: sem dados de 2024, sem filiados ou sem o município viram 0 e o nome cai no do cartão (PAR-05)', () => {
  assert.deepEqual(numerosMun({ cdi: '2', nome: 'x' }, munUF, undefined, 'estadual', 'PSOL'),
    { cdi: '2', nome: 'Beta', vereadoresPartido: 0, vereadoresTotal: 0, filiados: 0, pct: 5 });
  assert.deepEqual(numerosMun({ cdi: '9', nome: 'Domicílio' }, munUF, fil, 'estadual', 'PSOL'),
    { cdi: '9', nome: 'Domicílio', vereadoresPartido: 0, vereadoresTotal: 0, filiados: 0, pct: null });
});
