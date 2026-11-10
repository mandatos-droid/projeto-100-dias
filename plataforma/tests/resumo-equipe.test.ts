import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arvore } from '../lib/resumoEquipe.ts';
import { linhas, vistaDaTabela } from '../lib/tabelaEquipe.ts';
import { COR_COORD } from '../lib/equipe.ts';

/* Organograma da equipe no Resumo (RES-09): chefia no topo, ramos por área na ordem de COORDENACOES, cartões por categoria. */
type C = Record<string, string>;
/** tabela nova (m2.n gravado): cada linha [cargo, pessoa, categoria, área] vira as chaves m2.* da cadeira i */
function tabela(ls: [string, string, string, string][]): C {
  const c: C = { 'm2.on': ls.map((_, i) => i).join('|'), 'm2.n': String(ls.length) };
  ls.forEach(([cargo, pessoa, cat, area], i) => {
    c[`m2.f${i + 1}`] = pessoa; c[`m2.p${i + 1}.nome_cargo`] = cargo; c[`m2.p${i + 1}.cat`] = cat; c[`m2.p${i + 1}.coord`] = area;
  });
  return c;
}
const BASE = tabela([
  ['Chefe de gabinete', 'Paulo Ribeiro', 'Chefia', 'Chefia de área'],
  ['Motorista', 'Rui', 'Executora', 'Logística'],
  ['Assessor legislativo', 'Lucas', 'Executora', 'Legislativo'],
  ['Social-media', '*', 'Executora', 'Comunicação'],
  ['Coord. Legislativo', 'Ana Furtado', 'Coordenação', 'Legislativo'],
  ['Especialista temático', '', 'Especialista', 'Legislativo'],
  ['Coord. Comunicação', 'Dani', 'Coordenação', 'Comunicação'],
]);
const nomes = (cs: { cargo: string }[]) => cs.map((x) => x.cargo);

test('a linha da área "Chefia de área" vira a chefia, no topo (RES-09.1)', () => {
  assert.deepEqual(arvore(BASE).chefia, { i: 0, cargo: 'Chefe de gabinete', pessoa: 'Paulo Ribeiro', estado: 'ok' });
});

test('as demais linhas viram um ramo por área presente, na ordem de COORDENACOES, com a cor da área (RES-09.1)', () => {
  const r = arvore(BASE).ramos;
  assert.deepEqual(r.map((x) => x.area), ['Comunicação', 'Legislativo', 'Logística']);
  assert.deepEqual(r.map((x) => x.cor), [COR_COORD.Comunicação, COR_COORD.Legislativo, COR_COORD.Logística]);
  assert.equal(r.flatMap((x) => x.cartoes).length, 6);
});

test('dentro do ramo a ordem é Chefia, Coordenação, Especialista, Executora (RES-09.2)', () => {
  const leg = arvore(BASE).ramos.find((x) => x.area === 'Legislativo')!;
  assert.deepEqual(nomes(leg.cartoes), ['Coord. Legislativo', 'Especialista temático', 'Assessor legislativo']);
  const c = tabela([
    ['Exec', 'a', 'Executora', 'Secretariado'], ['Esp', 'b', 'Especialista', 'Secretariado'],
    ['Coord', 'c', 'Coordenação', 'Secretariado'], ['Chefe da área', 'd', 'Chefia', 'Secretariado'],
  ]);
  assert.deepEqual(nomes(arvore(c).ramos[0].cartoes), ['Chefe da área', 'Coord', 'Esp', 'Exec']);
});

test('no empate de categoria vale a ordem das linhas (RES-09.2)', () => {
  const c = tabela([
    ['Chefe', 'p', 'Chefia', 'Chefia de área'],
    ['B', 'x', 'Executora', 'Logística'], ['A', 'y', 'Executora', 'Logística'], ['C', 'z', 'Executora', 'Logística'],
  ]);
  assert.deepEqual(nomes(arvore(c).ramos[0].cartoes), ['B', 'A', 'C']);
});

test('linha sem categoria vai para o fim do ramo (RES-09.2)', () => {
  const c = tabela([['Chefe', 'p', 'Chefia', 'Chefia de área'], ['Sem cat', 'x', '', 'Logística'], ['Exec', 'y', 'Executora', 'Logística']]);
  assert.deepEqual(nomes(arvore(c).ramos[0].cartoes), ['Exec', 'Sem cat']);
});

test('pessoa com "*" vira estado "vaga", pessoa vazia "aberto" e as demais "ok" (RES-09.3)', () => {
  const cs = arvore(BASE).ramos.flatMap((x) => x.cartoes);
  const por = (cargo: string) => cs.find((x) => x.cargo === cargo)!;
  assert.equal(por('Social-media').estado, 'vaga');
  assert.equal(por('Especialista temático').estado, 'aberto');
  assert.equal(por('Coord. Comunicação').estado, 'ok');
  const c = tabela([['Chefe', 'p', 'Chefia', 'Chefia de área'], ['X', 'Joana *', 'Executora', 'Logística']]);
  assert.deepEqual(arvore(c).ramos[0].cartoes, [{ i: 1, cargo: 'X', pessoa: 'Joana *', estado: 'vaga' }]);
});

test('mandato no formato antigo (sem m2.n) usa a vista derivada e tem os mesmos ramos que a tabela (RES-09.5)', () => {
  const antigo: C = { 'm2.f1': 'Paulo', 'm2.f2': 'Ana', 'm2.f8': 'Dani', 'm2.f12': '*', 'm2.f20': 'Rui' };
  const vista = vistaDaTabela(antigo, (i) => `Cargo ${i}`);
  const t = arvore(vista);
  assert.deepEqual(t.chefia, { i: 0, cargo: 'Cargo 0', pessoa: 'Paulo', estado: 'ok' });
  const daTabela = [...new Set(linhas(vista).filter((l) => l.i !== 0).map((l) => l.area))];
  assert.deepEqual(new Set(t.ramos.map((x) => x.area)), new Set(daTabela));
  assert.deepEqual(t.ramos.map((x) => x.area), ['Comunicação', 'Legislativo', 'Articulação de aliados', 'Logística']);
  assert.equal(t.ramos.find((x) => x.area === 'Articulação de aliados')!.cartoes[0].estado, 'vaga');
});

test('sem linhas ativas devolve chefia null e nenhum ramo (RES-09.7)', () => {
  assert.deepEqual(arvore({}), { chefia: null, ramos: [] });
  assert.deepEqual(arvore({ 'm2.on': '0' }), { chefia: null, ramos: [] });
});

test('sem linha da Chefia de área, a chefia é null e os ramos continuam (RES-09.1)', () => {
  const c = tabela([['Motorista', 'Rui', 'Executora', 'Logística']]);
  const t = arvore(c);
  assert.equal(t.chefia, null);
  assert.deepEqual(t.ramos.map((x) => x.area), ['Logística']);
});

test('outra linha da Chefia de área entra no ramo "Chefia de área", na posição de COORDENACOES (RES-09.1)', () => {
  const c = tabela([
    ['Chefe', 'p', 'Chefia', 'Chefia de área'], ['Assessor da chefia', 'q', 'Executora', 'Chefia de área'],
    ['Social-media', 'r', 'Executora', 'Comunicação'], ['Motorista', 's', 'Executora', 'Logística'],
  ]);
  const t = arvore(c);
  assert.equal(t.chefia!.cargo, 'Chefe');
  assert.deepEqual(t.ramos.map((x) => x.area), ['Comunicação', 'Chefia de área', 'Logística']);
  assert.deepEqual(nomes(t.ramos[1].cartoes), ['Assessor da chefia']);
});

test('linha sem área fica num ramo "Sem área", depois das áreas de COORDENACOES (RES-09.1)', () => {
  const c = tabela([['Chefe', 'p', 'Chefia', 'Chefia de área'], ['Avulso', 'x', 'Executora', ''], ['Social-media', 'r', 'Executora', 'Comunicação']]);
  assert.deepEqual(arvore(c).ramos.map((x) => [x.area, nomes(x.cartoes)]), [['Comunicação', ['Social-media']], ['Sem área', ['Avulso']]]);
});
