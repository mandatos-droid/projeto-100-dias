import { test } from 'node:test';
import assert from 'node:assert/strict';
import { porTerritorio } from '../lib/resumoSocial.ts';
import type { ItemSoc, NivelSoc, TipoSoc } from '../lib/types.ts';

/* Problemas e potencialidades por território no Resumo (RES-08.2 a 08.6). */
let n = 0;
const item = (nivel: NivelSoc, tipo: TipoSoc, nomes: string[], uf = '', agenda = 'saude'): ItemSoc =>
  ({ id: `i${++n}`, nivel, tipo, agenda, texto: `texto ${n}`, uf, alvos: [], nomes });
const nomesDe = (itens: ItemSoc[]) => porTerritorio(itens).map((l) => l.territorio);

test('lista vazia devolve [] (RES-08.6)', () => {
  assert.deepEqual(porTerritorio([]), []);
});

test('o nível BR vira o território "Brasil", mesmo sem nomes (RES-08.2)', () => {
  const l = porTerritorio([item('BR', 'problema', [])]);
  assert.equal(l.length, 1);
  assert.equal(l[0].territorio, 'Brasil');
});

test('o nível UF vira uma linha por nome de nomes (RES-08.2)', () => {
  assert.deepEqual(nomesDe([item('UF', 'problema', ['São Paulo'], 'SP')]), ['São Paulo']);
});

test('o nível MUN vira "{nome} ({uf})" (RES-08.2)', () => {
  assert.deepEqual(nomesDe([item('MUN', 'potencialidade', ['Campinas'], 'SP')]), ['Campinas (SP)']);
});

test('um item com nomes ["São Paulo", "Rio de Janeiro"] aparece em duas linhas (RES-08.2)', () => {
  const it = item('UF', 'problema', ['São Paulo', 'Rio de Janeiro'], 'SP');
  const l = porTerritorio([it]);
  assert.deepEqual(l.map((x) => x.territorio), ['Rio de Janeiro', 'São Paulo']);
  assert.ok(l.every((x) => x.problemas.length === 1 && x.problemas[0] === it));
});

test('a ordem é Brasil, UFs, municípios, qualquer que seja a ordem de entrada (RES-08.3)', () => {
  const ordem = nomesDe([
    item('MUN', 'problema', ['Campinas'], 'SP'), item('UF', 'problema', ['Acre'], 'AC'), item('BR', 'potencialidade', []),
  ]);
  assert.deepEqual(ordem, ['Brasil', 'Acre', 'Campinas (SP)']);
});

test('dentro de UFs e de municípios a ordem é alfabética pt-BR, com acento ("Ceará" antes de "Distrito Federal") (RES-08.3)', () => {
  const ufs = nomesDe([item('UF', 'problema', ['Distrito Federal']), item('UF', 'problema', ['Ceará']), item('UF', 'problema', ['Amapá']), item('UF', 'problema', ['Bahia'])]);
  assert.deepEqual(ufs, ['Amapá', 'Bahia', 'Ceará', 'Distrito Federal']);
  const muns = nomesDe([item('MUN', 'problema', ['Óbidos'], 'PA'), item('MUN', 'problema', ['Osasco'], 'SP'), item('MUN', 'problema', ['Ágata'], 'MG'), item('MUN', 'problema', ['Belém'], 'PA')]);
  assert.deepEqual(muns, ['Ágata (MG)', 'Belém (PA)', 'Óbidos (PA)', 'Osasco (SP)']);
});

test('cada linha separa problemas e potencialidades por tipo (RES-08.4)', () => {
  const p = item('UF', 'problema', ['São Paulo'], 'SP'), q = item('UF', 'potencialidade', ['São Paulo'], 'SP');
  const l = porTerritorio([p, q]);
  assert.equal(l.length, 1);
  assert.deepEqual(l[0].problemas, [p]);
  assert.deepEqual(l[0].potencialidades, [q]);
});

test('um problema em SP e RJ e uma potencialidade em SP: SP com os dois tipos e RJ só com problema (RES-08.1, RES-08.5)', () => {
  const p = item('UF', 'problema', ['São Paulo', 'Rio de Janeiro'], 'SP'), q = item('UF', 'potencialidade', ['São Paulo'], 'SP');
  const l = porTerritorio([p, q]);
  assert.deepEqual(l.map((x) => x.territorio), ['Rio de Janeiro', 'São Paulo']);
  assert.deepEqual([l[0].problemas.length, l[0].potencialidades.length], [1, 0]);
  assert.deepEqual([l[1].problemas.length, l[1].potencialidades.length], [1, 1]);
});

test('itens do mesmo território, em itens distintos, vão para a mesma linha, na ordem de entrada (RES-08.1)', () => {
  const a = item('UF', 'problema', ['Bahia']), b = item('UF', 'problema', ['Bahia']);
  const l = porTerritorio([a, b]);
  assert.equal(l.length, 1);
  assert.deepEqual(l[0].problemas, [a, b]);
});

test('um município e uma UF de mesmo nome são territórios distintos; nome repetido no mesmo item não duplica a linha', () => {
  assert.deepEqual(nomesDe([item('UF', 'problema', ['Rio de Janeiro'], 'RJ'), item('MUN', 'problema', ['Rio de Janeiro'], 'RJ')]),
    ['Rio de Janeiro', 'Rio de Janeiro (RJ)']);
  assert.deepEqual(nomesDe([item('UF', 'problema', ['Bahia', 'Bahia'])]), ['Bahia']);
});
