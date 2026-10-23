import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplica } from '../lib/cadeiras.ts';
import { desliga, gerarRotinas, religa, rotinasDesligadas } from '../lib/rotinas.ts';

type C = Record<string, string>;
const ids = (c: C) => gerarRotinas(c).map((r) => r.id);

test('com 1 cadeira com nome saem as 3 rotinas coletivas, com a frequência e a duração do Guia (MEQ-17, T-11)', () => {
  const rs = gerarRotinas({ 'm2.f1': 'Ana' });
  assert.deepEqual(rs.map((r) => [r.id, r.freq, r.duracao]), [
    ['plan', 'Quadrimestralmente', '2 períodos de 6h'],
    ['mensal', 'Mensalmente', '1h'],
    ['semanal', 'Semanalmente', '1h'],
  ]);
  assert.deepEqual(rs[0].participantes, [0]);
  assert.equal(rs[0].convoca, 0);
});

test('sem nenhuma cadeira com nome não há rotina a gerar (MEQ-17)', () => {
  assert.deepEqual(gerarRotinas({}), []);
  assert.deepEqual(gerarRotinas({ 'm2.f1': '*' }), []);
});

test('área com 3 cadeiras gera 1 reunião semanal de 45 min com as 3, convocada pela cadeira de topo da área (MEQ-17, T-12)', () => {
  const rs = gerarRotinas({ 'm2.f1': 'Ana', 'm2.on': '0|7|8|9' });
  const r = rs.find((x) => x.id === 'area:Comunicação')!;
  assert.equal(r.freq, 'Semanalmente');
  assert.equal(r.duracao, '45 min');
  assert.deepEqual(r.participantes, [7, 8, 9]);
  assert.equal(r.convoca, 7);
  assert.equal(r.area, 'Comunicação');
});

test('área com 1 cadeira não gera reunião de área (MEQ-17, T-13)', () => {
  assert.equal(ids({ 'm2.f1': 'Ana', 'm2.on': '0|7' }).some((i) => i.startsWith('area:')), false);
});

test('cada par líder/liderado gera um feedback de 30 min, agrupado no líder (MEQ-17, T-14)', () => {
  const rs = gerarRotinas({ 'm2.f1': 'Ana', 'm2.on': '0|1|2|3' });
  const fb = rs.filter((r) => r.tipo === 'feedback' && r.grupo === 1);
  assert.deepEqual(fb.map((r) => r.id), ['fb:1>2', 'fb:1>3']);
  assert.ok(fb.every((r) => r.duracao === '30 min' && r.freq === 'Semestralmente' && r.convoca === 1));
  assert.deepEqual(fb[0].participantes, [1, 2]);
  assert.ok(rs.some((r) => r.id === 'fb:0>1'));
});

test('cadeira sem nome entra nos participantes e fica fora dos confirmados (MEQ-17, T-15)', () => {
  const rs = gerarRotinas({ 'm2.f1': 'Ana', 'm2.f8': 'Bia', 'm2.f9': '*', 'm2.on': '0|7|8|9' });
  const r = rs.find((x) => x.id === 'area:Comunicação')!;
  assert.deepEqual(r.participantes, [7, 8, 9]);
  assert.equal(r.confirmados, 1);
  assert.equal(rs.find((x) => x.id === 'semanal')!.confirmados, 2);
});

test('gerar duas vezes dá o mesmo resultado, sem ids repetidos (MEQ-17, T-16)', () => {
  const c: C = { 'm2.f1': 'Ana', 'm2.on': '0|1|2|7|8' };
  assert.deepEqual(gerarRotinas(c), gerarRotinas(c));
  const lista = ids(c);
  assert.equal(new Set(lista).size, lista.length);
});

test('rotina desligada sai da lista, aparece em desligadas e volta ao religar (MEQ-17)', () => {
  const c: C = { 'm2.f1': 'Ana', 'm2.on': '0|7|8' };
  aplica(c, desliga(c, 'area:Comunicação'));
  assert.equal(ids(c).includes('area:Comunicação'), false);
  assert.deepEqual(rotinasDesligadas(c).map((r) => r.id), ['area:Comunicação']);
  aplica(c, religa(c, 'area:Comunicação'));
  assert.equal(ids(c).includes('area:Comunicação'), true);
  assert.equal(c['m2.rotoff'], undefined);
});

/* ---------- T6: cadeia ---------- */
import { cadeia, cadeirasDoElo, rotinasDaCadeira } from '../lib/rotinas.ts';
const equipe: C = { 'm2.f1': 'Ana', 'm2.on': '0|1|2|7|8' };

test('a cadeia segue planejamento, monitoramento, alinhamento, reunião de área, feedback (MEQ-18, T-17)', () => {
  const elos = cadeia(gerarRotinas(equipe));
  assert.deepEqual(elos.map((e) => e.tipo), ['plan', 'mensal', 'semanal', 'area', 'feedback']);
  assert.deepEqual(elos.map((e) => e.ordem), [1, 2, 3, 4, 5]);
});

test('cada elo agrupa as rotinas do tipo e conta as cadeiras envolvidas, sem repetir (MEQ-18)', () => {
  const elos = cadeia(gerarRotinas(equipe));
  const area = elos.find((e) => e.tipo === 'area')!;
  assert.deepEqual([...area.ids].sort(), ['area:Comunicação', 'area:Legislativo']);
  assert.equal(area.cadeiras.length, 4);
  assert.equal(elos[0].cadeiras.length, 5);
  const fb = elos.find((e) => e.tipo === 'feedback')!;
  assert.equal(fb.ids.length, 4);
  assert.equal(fb.freq, 'Semestralmente');
});

test('elo sem rotina não aparece na cadeia (MEQ-18)', () => {
  const elos = cadeia(gerarRotinas({ 'm2.f1': 'Ana' }));
  assert.deepEqual(elos.map((e) => e.tipo), ['plan', 'mensal', 'semanal']);
});

test('as cadeiras do elo "reunião da área Comunicação" são só as de Comunicação (MEQ-19, T-18)', () => {
  assert.deepEqual(cadeirasDoElo(gerarRotinas(equipe), 'area:Comunicação'), [7, 8]);
  assert.deepEqual(cadeirasDoElo(gerarRotinas(equipe), 'inexistente'), []);
});

test('rotinasDaCadeira lista as rotinas de que a cadeira participa (MEQ-19)', () => {
  const rs = gerarRotinas(equipe);
  assert.deepEqual(rotinasDaCadeira(rs, 8).map((r) => r.id), ['plan', 'mensal', 'semanal', 'area:Comunicação', 'fb:7>8']);
  assert.deepEqual(rotinasDaCadeira(rs, 99), []);
});

/* ---------- T7: rotinas entre áreas ---------- */
import { alternaArea } from '../lib/cadeiras.ts';
import { criaEntreAreas, entreAreasArquivadas, removeEntreAreas, rotinasEntreAreas, sugestoesEntreAreas } from '../lib/rotinas.ts';

const duasAreas = (): C => {
  const c: C = { 'm2.f1': 'Ana' };
  aplica(c, alternaArea(c, 'Legislativo', true).patch);
  aplica(c, alternaArea(c, 'Comunicação', true).patch);
  return c;
};
const par = { de: 'Legislativo', para: 'Comunicação', finalidade: 'Pauta da semana', freq: 'Semanalmente' as const, canal: 'Grupo da área' };

test('origem igual ao destino é recusada e nada é gravado (MEQ-20, T-19)', () => {
  const c = duasAreas();
  const r = criaEntreAreas(c, { ...par, para: 'Legislativo' });
  assert.match(r.erro ?? '', /mesma área/i);
  assert.deepEqual(r.patch, {});
});

test('criar um par grava a rotina com finalidade, frequência e canal, e convoca a cadeira de topo de cada área (MEQ-20)', () => {
  const c = duasAreas();
  aplica(c, criaEntreAreas(c, par).patch);
  const [r] = rotinasEntreAreas(c);
  assert.equal(r.tipo, 'entre');
  assert.deepEqual([r.de, r.para, r.finalidade, r.freq, r.canal], ['Legislativo', 'Comunicação', 'Pauta da semana', 'Semanalmente', 'Grupo da área']);
  assert.deepEqual(r.participantes, [1, 7]);
  assert.equal(r.convoca, 1);
});

test('área fora da lista ou frequência inválida é recusada (MEQ-20)', () => {
  const c = duasAreas();
  assert.ok(criaEntreAreas(c, { ...par, de: 'Inventada' }).erro);
  assert.ok(criaEntreAreas(c, { ...par, freq: 'Diariamente' as never }).erro);
});

test('desmarcar uma das áreas esconde a rotina e remarcar a devolve idêntica (MEQ-22, T-20)', () => {
  const c = duasAreas();
  aplica(c, criaEntreAreas(c, par).patch);
  const antes = rotinasEntreAreas(c);
  aplica(c, alternaArea(c, 'Comunicação', false).patch);
  assert.deepEqual(rotinasEntreAreas(c), []);
  assert.equal(entreAreasArquivadas(c).length, 1);
  aplica(c, alternaArea(c, 'Comunicação', true).patch);
  assert.deepEqual(rotinasEntreAreas(c), antes);
  assert.equal(entreAreasArquivadas(c).length, 0);
});

test('as sugestões só aparecem com as duas áreas ativas e somem depois de aceitas (MEQ-20)', () => {
  const c: C = { 'm2.f1': 'Ana' };
  assert.deepEqual(sugestoesEntreAreas(c), []);
  aplica(c, alternaArea(c, 'Legislativo', true).patch);
  aplica(c, alternaArea(c, 'Comunicação', true).patch);
  assert.deepEqual(sugestoesEntreAreas(c).map((s) => `${s.de}>${s.para}`), ['Legislativo>Comunicação']);
  aplica(c, criaEntreAreas(c, par).patch);
  assert.deepEqual(sugestoesEntreAreas(c), []);
});

test('com todas as áreas o Guia oferece as 4 sugestões (MEQ-20)', () => {
  const c: C = { 'm2.f1': 'Ana', 'm2.coords': 'Comunicação|Mobilização de pessoas|Legislativo|Articulação de aliados|Secretariado|Logística' };
  assert.deepEqual(sugestoesEntreAreas(c).map((s) => `${s.de}>${s.para}`), [
    'Legislativo>Comunicação', 'Articulação de aliados>Legislativo', 'Mobilização de pessoas>Comunicação', 'Secretariado>Chefia de área',
  ]);
});

test('JSON inválido em m2.x devolve lista vazia sem lançar erro (MEQ-20)', () => {
  assert.deepEqual(rotinasEntreAreas({ 'm2.f1': 'Ana', 'm2.x': '{quebrado' }), []);
  assert.deepEqual(rotinasEntreAreas({ 'm2.f1': 'Ana', 'm2.x': '{"a":1}' }), []);
});

test('remover uma rotina entre áreas a tira da lista (MEQ-20)', () => {
  const c = duasAreas();
  aplica(c, criaEntreAreas(c, par).patch);
  const [r] = rotinasEntreAreas(c);
  aplica(c, removeEntreAreas(c, r.id));
  assert.deepEqual(rotinasEntreAreas(c), []);
  assert.equal(entreAreasArquivadas(c).length, 0);
});
