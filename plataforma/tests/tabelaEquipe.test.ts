import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLUNAS, CATEGORIAS, linhas, colunaLiberada, completa, contagemCompletas } from '../lib/tabelaEquipe.ts';

type C = Record<string, string>;
/** mandato novo com a Chefia (0) e duas linhas acrescentadas (índices 20 e 21) */
const base = (extra: C = {}): C => ({ 'm2.on': '0|20|21', ...extra });
const cheia = (n: number, extra: C = {}): C => ({
  [`m2.p${n + 1}.esc`]: 'Coordenar a equipe', [`m2.p${n + 1}.comp`]: 'Liderança',
  [`m2.p${n + 1}.nome_cargo`]: 'Chefe de gabinete', [`m2.f${n + 1}`]: 'Ana',
  [`m2.p${n + 1}.cat`]: 'Chefia', [`m2.p${n + 1}.coord`]: 'Legislativo', ...extra,
});

test('a ordem das colunas é escopo, competências, cargo, pessoa, categoria, área (RM2-05)', () => {
  assert.deepEqual(COLUNAS.map((x) => x.id), ['esc', 'comp', 'cargo', 'pessoa', 'cat', 'area']);
  assert.ok(COLUNAS.every((x) => x.rotulo.length > 0));
});

test('as categorias são Chefia, Coordenação, Especialista e Executora (D4)', () => {
  assert.deepEqual([...CATEGORIAS], ['Chefia', 'Coordenação', 'Especialista', 'Executora']);
});

test('linhas devolve uma por cadeira ativa, na ordem, com os seis valores lidos das chaves m2.* (RM2-01)', () => {
  const l = linhas(base(cheia(20)));
  assert.deepEqual(l.map((x) => x.i), [0, 20, 21]);
  const x = l.find((r) => r.i === 20)!;
  assert.deepEqual([x.esc, x.comp, x.cargo, x.pessoa, x.cat, x.area],
    ['Coordenar a equipe', 'Liderança', 'Chefe de gabinete', 'Ana', 'Chefia', 'Legislativo']);
});

test('linha nova (índice 20+) nasce com todas as colunas vazias, sem área nem liderança herdadas (design, Risks)', () => {
  const x = linhas(base()).find((r) => r.i === 20)!;
  assert.deepEqual([x.esc, x.comp, x.cargo, x.pessoa, x.cat, x.area], ['', '', '', '', '', '']);
  assert.equal(x.completa, false);
});

test('a primeira coluna está sempre liberada (RM2-05)', () => {
  const x = linhas(base()).find((r) => r.i === 20)!;
  assert.deepEqual(colunaLiberada(x, 'esc'), { ok: true });
});

test('a coluna N só libera com a N-1 preenchida e devolve o rótulo da que falta (RM2-05)', () => {
  const x = linhas(base()).find((r) => r.i === 20)!;
  assert.deepEqual(colunaLiberada(x, 'comp'), { ok: false, falta: 'Escopo' });
  const y = linhas(base({ 'm2.p21.esc': 'Escopo x' })).find((r) => r.i === 20)!;
  assert.deepEqual(colunaLiberada(y, 'comp'), { ok: true });
  assert.deepEqual(colunaLiberada(y, 'cargo'), { ok: false, falta: 'Competências comportamentais' });
});

test('categoria só libera com a pessoa preenchida e a área só com a categoria (RM2-08)', () => {
  const c = base({ 'm2.p21.esc': 'a', 'm2.p21.comp': 'b', 'm2.p21.nome_cargo': 'c' });
  const sem = linhas(c).find((r) => r.i === 20)!;
  assert.deepEqual(colunaLiberada(sem, 'cat'), { ok: false, falta: 'Nome da pessoa' });
  const com = linhas({ ...c, 'm2.f21': 'Bia' }).find((r) => r.i === 20)!;
  assert.deepEqual(colunaLiberada(com, 'cat'), { ok: true });
  assert.deepEqual(colunaLiberada(com, 'area'), { ok: false, falta: 'Categoria' });
});

test('esvaziar uma coluna anterior trava as seguintes e não apaga os valores (RM2-06)', () => {
  const c = base(cheia(20, { 'm2.p21.esc': '' }));
  const antes = JSON.stringify(c);
  const x = linhas(c).find((r) => r.i === 20)!;
  assert.deepEqual(colunaLiberada(x, 'area'), { ok: false, falta: 'Escopo' });
  assert.deepEqual(colunaLiberada(x, 'cargo'), { ok: false, falta: 'Escopo' });
  assert.equal(x.comp, 'Liderança');
  assert.equal(x.area, 'Legislativo');
  assert.equal(JSON.stringify(c), antes);
});

test('espaços em branco não contam como preenchido (RM2-05)', () => {
  const x = linhas(base({ 'm2.p21.esc': '   ' })).find((r) => r.i === 20)!;
  assert.equal(colunaLiberada(x, 'comp').ok, false);
});

test('"*" no nome da pessoa conta como preenchida e marca processo seletivo (RM2-07)', () => {
  const c = base({ 'm2.p21.esc': 'a', 'm2.p21.comp': 'b', 'm2.p21.nome_cargo': 'c', 'm2.f21': '*' });
  const x = linhas(c).find((r) => r.i === 20)!;
  assert.equal(x.processoSeletivo, true);
  assert.deepEqual(colunaLiberada(x, 'cat'), { ok: true });
  const y = linhas({ ...c, 'm2.f21': 'Bia' }).find((r) => r.i === 20)!;
  assert.equal(y.processoSeletivo, false);
});

test('completa só com as 6 colunas preenchidas (RM2-09)', () => {
  const l = linhas(base(cheia(20)));
  assert.equal(l.find((r) => r.i === 20)!.completa, true);
  assert.equal(completa(l.find((r) => r.i === 20)!), true);
  const falta = linhas(base(cheia(20, { 'm2.p21.coord': '' }))).find((r) => r.i === 20)!;
  assert.equal(falta.completa, false);
  assert.equal(completa(falta), false);
});

test('contagem "X de N linhas completas" (RM2-09)', () => {
  assert.deepEqual(contagemCompletas(base()), { completas: 0, total: 3 });
  assert.deepEqual(contagemCompletas(base(cheia(20))), { completas: 1, total: 3 });
  assert.deepEqual(contagemCompletas(base({ ...cheia(20), ...cheia(21), ...cheia(0) })), { completas: 3, total: 3 });
});

test('ler a tabela nunca altera os dados (RM2-06)', () => {
  const c = base(cheia(20));
  const antes = JSON.stringify(c);
  linhas(c); contagemCompletas(c);
  assert.equal(JSON.stringify(c), antes);
});
