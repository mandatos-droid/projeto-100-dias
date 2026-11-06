import { test } from 'node:test';
import assert from 'node:assert/strict';
import { funil, travas } from '../lib/admin/funil.ts';
import type { LinhaExercicio } from '../lib/admin/funil.ts';

// Catálogo real de exercicios_guia (migration 20261105130000): 16 exercícios, ordem reiniciada em cada missão.
const CAT: [string, number, number][] = [
  ['m1.persona', 1, 1], ['m1.conjuntura', 1, 2], ['m1.oportunidades', 1, 3], ['m1.frag', 1, 4],
  ['m2.funcoes', 2, 1], ['m2.gestao', 2, 2],
  ['m3.bandeiras', 3, 1], ['m3.legado', 3, 2], ['m3.preditores', 3, 3], ['m3.metas', 3, 4],
  ['m4.comissoes', 4, 1], ['m4.acoes', 4, 2], ['m4.metricas', 4, 3],
  ['m5.monit', 5, 1], ['m5.feedback', 5, 2], ['m5.imersao', 5, 3],
];
const IDS = CAT.map((c) => c[0]);

// Linhas de um mandato como a view devolve: uma por exercício, com `ok`.
function mandato(id: string, feitos: string[], uf = 'SP'): LinhaExercicio[] {
  return CAT.map(([exercicio, missao, ordem]) => ({ mandato_id: id, uf, exercicio, missao, ordem, ok: feitos.includes(exercicio) }));
}
const primeiros = (n: number) => IDS.slice(0, n);
const porId = (r: ReturnType<typeof travas>, id: string) => r.find((x) => x.exercicio === id);

// ---------- funil ----------

test('missão concluída = todos os seus exercícios em ok; devolve as 5 missões em ordem (ADM-11.7)', () => {
  const r = funil([...mandato('a', primeiros(4)), ...mandato('b', [])]);
  assert.deepEqual(r.map((x) => x.missao), [1, 2, 3, 4, 5]);
  assert.deepEqual(r[0], { missao: 1, concluiram: 1, pct: 50 });
  assert.deepEqual(r[1], { missao: 2, concluiram: 0, pct: 0 });
});

test('missão incompleta por 1 exercício não conta como concluída', () => {
  const r = funil(mandato('a', ['m1.persona', 'm1.conjuntura', 'm1.oportunidades'])); // falta m1.frag
  assert.equal(r[0].concluiram, 0);
  assert.equal(funil(mandato('a', primeiros(4)))[0].concluiram, 1);
});

test('conclusão da missão não depende da ordem em que os exercícios foram feitos', () => {
  const r = funil(mandato('a', ['m1.frag', 'm1.persona', 'm1.oportunidades', 'm1.conjuntura']));
  assert.equal(r[0].concluiram, 1);
});

test('mandato com tudo feito conclui as 5 missões (100%)', () => {
  const r = funil(mandato('a', IDS));
  assert.deepEqual(r.map((x) => [x.concluiram, x.pct]), [[1, 100], [1, 100], [1, 100], [1, 100], [1, 100]]);
});

test('a porcentagem é inteira e arredonda: 1 de 3 = 33, 2 de 3 = 67, 1 de 8 = 13', () => {
  const tres = [...mandato('a', primeiros(4)), ...mandato('b', primeiros(4)), ...mandato('c', [])];
  assert.equal(funil(tres)[0].pct, 67);
  assert.equal(funil([...mandato('a', primeiros(4)), ...mandato('b', []), ...mandato('c', [])])[0].pct, 33);
  const oito = [...mandato('a', primeiros(4)), ...['b', 'c', 'd', 'e', 'f', 'g', 'h'].flatMap((i) => mandato(i, []))];
  assert.equal(funil(oito)[0].pct, 13); // 12,5 arredonda para cima
});

test('sem linhas não há missões nem divisão por zero', () => {
  assert.deepEqual(funil([]), []);
});

test('a ordem das linhas recebidas não muda o resultado', () => {
  const linhas = [...mandato('a', primeiros(4)), ...mandato('b', [])].reverse();
  assert.deepEqual(funil(linhas)[0], { missao: 1, concluiram: 1, pct: 50 });
});

// ---------- travas ----------

test('no primeiro exercício todos os mandatos alcançaram (ADM-11.8)', () => {
  const r = travas([...mandato('a', []), ...mandato('b', ['m1.persona']), ...mandato('c', [])]);
  assert.deepEqual(porId(r, 'm1.persona'), { exercicio: 'm1.persona', alcancaram: 3, concluiram: 1, abandono: 67 });
});

test('alcançaram o exercício k = concluíram o anterior na ordem do Guia, e concluíram só conta entre eles', () => {
  const r = travas([...mandato('a', []), ...mandato('b', ['m1.persona']), ...mandato('c', ['m1.persona', 'm1.conjuntura'])]);
  assert.deepEqual(porId(r, 'm1.conjuntura'), { exercicio: 'm1.conjuntura', alcancaram: 2, concluiram: 1, abandono: 50 });
  assert.deepEqual(porId(r, 'm1.oportunidades'), { exercicio: 'm1.oportunidades', alcancaram: 1, concluiram: 0, abandono: 100 });
});

test('exercício feito fora de ordem não conta como concluído de quem não alcançou', () => {
  // "b" fez a conjuntura sem fazer a persona: não alcançou a conjuntura, então não entra em nenhum dos dois números
  const r = travas([...mandato('a', ['m1.persona', 'm1.conjuntura']), ...mandato('b', ['m1.conjuntura'])]);
  assert.deepEqual(porId(r, 'm1.conjuntura'), { exercicio: 'm1.conjuntura', alcancaram: 1, concluiram: 1, abandono: 0 });
  assert.deepEqual(porId(r, 'm1.persona'), { exercicio: 'm1.persona', alcancaram: 2, concluiram: 1, abandono: 50 });
});

test('a ordem do Guia atravessa as missões: quem terminou a missão 1 alcançou o primeiro exercício da 2', () => {
  const r = travas([...mandato('a', primeiros(4)), ...mandato('b', primeiros(3))]);
  assert.deepEqual(porId(r, 'm2.funcoes'), { exercicio: 'm2.funcoes', alcancaram: 1, concluiram: 0, abandono: 100 });
});

test('a ordem vem de missão e ordem juntas: as linhas embaralhadas dão o mesmo resultado', () => {
  const linhas = [...mandato('a', ['m1.persona']), ...mandato('b', [])];
  const embaralhado = [...linhas].sort((x, y) => (x.exercicio < y.exercicio ? 1 : -1));
  assert.deepEqual(travas(embaralhado), travas(linhas));
});

test('abandono arredonda a metade para cima: 1 de 8 = 13 (ADM-11.8)', () => {
  const l = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].flatMap((i) => mandato(i, ['m1.persona'])).concat(mandato('h', []));
  assert.deepEqual(porId(travas(l), 'm1.persona'), { exercicio: 'm1.persona', alcancaram: 8, concluiram: 7, abandono: 13 });
});

test('omite exercícios que ninguém alcançou (ADM-11.9)', () => {
  const r = travas([...mandato('a', []), ...mandato('b', [])]);
  assert.deepEqual(r.map((x) => x.exercicio), ['m1.persona']);
  assert.equal(porId(r, 'm1.conjuntura'), undefined);
});

test('ordem decrescente de abandono; empate fica na ordem do Guia', () => {
  // persona: 4 alcançaram, 2 concluíram (50); conjuntura: 2 alcançaram, 1 concluiu (50); oportunidades: 1 alcançou, 0 concluiu (100)
  const l = [...mandato('a', []), ...mandato('b', []), ...mandato('c', ['m1.persona']), ...mandato('d', ['m1.persona', 'm1.conjuntura'])];
  assert.deepEqual(travas(l).map((x) => [x.exercicio, x.abandono]), [['m1.oportunidades', 100], ['m1.persona', 50], ['m1.conjuntura', 50]]);
});

test('devolve no máximo 10 linhas, as de maior abandono (ADM-11.8)', () => {
  // o mandato k fez os k primeiros exercícios: o exercício i foi alcançado por 17-i mandatos e concluído por 16-i
  const l = Array.from({ length: 17 }, (_, k) => mandato('m' + k, primeiros(k))).flat();
  const r = travas(l);
  assert.equal(r.length, 10);
  assert.equal(r[0].exercicio, 'm5.imersao');
  assert.deepEqual(r[0], { exercicio: 'm5.imersao', alcancaram: 2, concluiram: 1, abandono: 50 });
  assert.equal(r[9].exercicio, IDS[6]);
});

test('sem linhas devolve lista vazia', () => {
  assert.deepEqual(travas([]), []);
});
