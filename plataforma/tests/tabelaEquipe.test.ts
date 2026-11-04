import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplica, ativas, coordDe, liderDe } from '../lib/cadeiras.ts';
import { COLUNAS, CATEGORIAS, linhas, colunaLiberada, completa, contagemCompletas, defineN } from '../lib/tabelaEquipe.ts';

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

/* ---------- T13 · quantidade de pessoas ---------- */
const aplicado = (c: C, r: { patch: Record<string, string> }): C => { const x = { ...c }; aplica(x, r.patch); return x; };

test('N inválido (0, 41, decimal, texto, vazio) devolve erro e nenhum patch (RM2-03)', () => {
  for (const n of [0, 41, 2.5, -1, NaN, 'abc', '', '3.5', '0', '41']) {
    const r = defineN({}, n as number | string);
    assert.deepEqual(r.patch, {}, `n=${String(n)}`);
    assert.equal(typeof r.erro, 'string', `n=${String(n)}`);
  }
});

test('N válido de 1 a 40, número ou texto, é aceito e grava m2.n (RM2-03)', () => {
  assert.equal(defineN({}, 1).erro, undefined);
  assert.equal(defineN({}, 40).patch['m2.n'], '40');
  assert.equal(defineN({}, '4').patch['m2.n'], '4');
});

test('N conta a Chefia: mandato novo com N=4 passa a ter 4 linhas, a primeira é a cadeira 0 (RM2-04)', () => {
  const c = aplicado({}, defineN({}, 4));
  assert.deepEqual(ativas(c), [0, 20, 21, 22]);
  assert.equal(c['m2.n'], '4');
  assert.equal(linhas(c).length, 4);
});

test('N=1 mantém só a Chefia (design)', () => {
  const c = aplicado({}, defineN({}, 1));
  assert.deepEqual(ativas(c), [0]);
});

test('aumentar cria linhas só com índices 20+, nunca reativa as do modelo, sem coord nem lider herdados de PADRAO (RM2-04)', () => {
  const c0: C = { 'm2.on': '0|1|2' };
  const c = aplicado(c0, defineN(c0, 6));
  assert.deepEqual(ativas(c), [0, 1, 2, 20, 21, 22]);
  [20, 21, 22].forEach((i) => {
    assert.equal(c[`m2.p${i + 1}.coord`], undefined);
    assert.equal(c[`m2.p${i + 1}.lider`], undefined);
    assert.equal(coordDe(c, i), 'Sem área');
    assert.equal(liderDe(c, i), null);
  });
  linhas(c).filter((l) => l.i >= 20).forEach((l) => assert.deepEqual([l.esc, l.pessoa, l.cat, l.area], ['', '', '', '']));
});

test('aumentar reaproveita o primeiro índice 20+ livre (RM2-04)', () => {
  const c0: C = { 'm2.on': '0|20|22' };
  assert.deepEqual(ativas(aplicado(c0, defineN(c0, 4))), [0, 20, 21, 22]);
});

test('diminuir remove só linhas vazias, sem pedir confirmação, e grava m2.n (RM2-04)', () => {
  const c0 = base({ ...cheia(0), ...cheia(20), 'm2.n': '3' });
  const r = defineN(c0, 2);
  assert.equal(r.confirma, undefined);
  const c = aplicado(c0, r);
  assert.deepEqual(ativas(c), [0, 20]);
  assert.equal(c['m2.n'], '2');
  assert.equal(c['m2.f21'], 'Ana');
});

test('diminuir tira as vazias antes das preenchidas, mesmo as de índice menor (RM2-04)', () => {
  const c0: C = { 'm2.on': '0|20|21|22', 'm2.f22': 'Bia' }; // m2.f22 é a cadeira 21; 20 e 22 vazias
  const r = defineN(c0, 2);
  assert.equal(r.confirma, undefined);
  assert.deepEqual(ativas(aplicado(c0, r)), [0, 21]);
});

test('se faltar linha vazia, devolve confirma com os nomes das preenchidas que sairiam (RM2-04)', () => {
  const c0 = base({ ...cheia(0), ...cheia(20, { 'm2.f21': 'Bia' }), ...cheia(21, { 'm2.f22': 'Caio' }) });
  const r = defineN(c0, 1);
  assert.deepEqual([...(r.confirma ?? [])].sort(), ['Bia', 'Caio']);
  assert.deepEqual(r.remove?.slice().sort((a, b) => a - b), [20, 21]);
  assert.deepEqual(ativas(aplicado(c0, r)), [0]);
});

test('só as preenchidas necessárias entram em confirma; as vazias saem antes (RM2-04)', () => {
  const c0 = base({ ...cheia(0), ...cheia(20, { 'm2.f21': 'Bia' }) }); // a 21 está vazia
  const r = defineN(c0, 2);
  assert.equal(r.confirma, undefined);
  assert.deepEqual(r.remove, [21]);
  const r2 = defineN(c0, 1);
  assert.deepEqual(r2.confirma, ['Bia']);
  assert.deepEqual(r2.remove?.slice().sort((a, b) => a - b), [20, 21]);
});

test('a Chefia nunca é removida, nem preenchida (RM2-04)', () => {
  const c0 = base({ ...cheia(0) });
  assert.ok(ativas(aplicado(c0, defineN(c0, 1))).includes(0));
  assert.equal(aplicado(c0, defineN(c0, 1))['m2.f1'], 'Ana');
});

test('remover linha preenchida limpa escopo, competências e categoria para não voltarem numa linha nova (RM2-04)', () => {
  const c0 = base({ ...cheia(20) });
  const c1 = aplicado(c0, defineN(c0, 1));
  assert.equal(c1['m2.p21.esc'], undefined);
  assert.equal(c1['m2.p21.comp'], undefined);
  assert.equal(c1['m2.p21.cat'], undefined);
  assert.equal(c1['m2.f21'], undefined);
  const c2 = aplicado(c1, defineN(c1, 2));
  const nova = linhas(c2).find((l) => l.i === 20)!;
  assert.deepEqual([nova.esc, nova.comp, nova.cat, nova.pessoa, nova.completa], ['', '', '', '', false]);
});

test('N igual ao atual só grava m2.n (RM2-04)', () => {
  assert.deepEqual(defineN(base(), 3).patch, { 'm2.n': '3' });
});

test('defineN não altera os campos recebidos (RM2-04)', () => {
  const c0 = base(cheia(20));
  const antes = JSON.stringify(c0);
  defineN(c0, 1); defineN(c0, 9);
  assert.equal(JSON.stringify(c0), antes);
});
