import { test } from 'node:test';
import assert from 'node:assert/strict';
import { busca, historico, normaliza, resumo } from '../lib/demo.ts';
import type { PleitoTSE } from '../lib/dados.ts';
import type { Eleito } from '../lib/types.ts';

const el = (o: Partial<Eleito> = {}): Eleito => ({
  s: '1', u: 'FULANO', c: 'FULANO DE TAL', p: 'PT', uf: 'GO', k: 'f', v: 1000, x: 1, g: 'M', r: '', m: 'n', a: 2026, ...o,
});

test('normaliza tira acentos, caixa e espaços das pontas', () => {
  assert.equal(normaliza('  JOÃO Çá '), 'joao ca');
});

test('busca ignora acentos e maiúsculas (Demo AC 1)', () => {
  const r = busca([el({ s: '1', u: 'JOÃO SILVA' }), el({ s: '2', u: 'MARIA' })], 'joao');
  assert.deepEqual(r.map((x) => x.s), ['1']);
});

test('busca casa pelo nome civil quando o de urna não casa (Demo AC 1)', () => {
  const r = busca([el({ s: '1', u: 'DOUTORA ANA', c: 'ANA PAULA RIBEIRO' })], 'ribeiro');
  assert.deepEqual(r.map((x) => x.s), ['1']);
});

test('termo com 1 caractere ou só espaços não lista nada (Demo AC 2, edge)', () => {
  const todos = [el({ u: 'ANA' }), el({ s: '2', u: 'ANDRE' })];
  assert.deepEqual(busca(todos, 'a'), []);
  assert.deepEqual(busca(todos, '   '), []);
  assert.deepEqual(busca(todos, ''), []);
});

test('mais de 8 casamentos: devolve os 8 mais votados em ordem decrescente (edge)', () => {
  const todos = Array.from({ length: 12 }, (_, i) => el({ s: String(i), u: `SILVA ${i}`, v: i * 10 }));
  const r = busca(todos, 'silva');
  assert.equal(r.length, 8);
  assert.deepEqual(r.map((x) => x.v), [110, 100, 90, 80, 70, 60, 50, 40]);
});

test('nenhum casamento devolve lista vazia (Demo AC 8)', () => {
  assert.deepEqual(busca([el()], 'zzzz'), []);
});

test('posição por votos entre a mesma Casa e UF, empate pela ordem de entrada (Demo AC 4)', () => {
  const todos = [
    el({ s: 'a', v: 500 }),
    el({ s: 'b', v: 900 }),
    el({ s: 'c', v: 500 }),
    el({ s: 'x', v: 9999, uf: 'SP' }), // outra UF: não conta
    el({ s: 'y', v: 9999, k: 'e' }), // outra Casa: não conta
  ];
  assert.deepEqual(resumo(todos[1], todos).posicao, { n: 1, de: 3 });
  assert.deepEqual(resumo(todos[0], todos).posicao, { n: 2, de: 3 });
  assert.deepEqual(resumo(todos[2], todos).posicao, { n: 3, de: 3 });
});

test('cadeiras do partido contam só a mesma Casa e UF (Demo AC 5)', () => {
  const todos = [
    el({ s: 'a', p: 'PT' }),
    el({ s: 'b', p: 'PT' }),
    el({ s: 'c', p: 'PL' }),
    el({ s: 'd', p: 'PT', uf: 'SP' }),
    el({ s: 'e', p: 'PT', k: 'e' }),
  ];
  assert.equal(resumo(todos[0], todos).cadeirasPartido, 2);
});

test('trajetória: r, o, n viram rótulos e ? vira null (Demo AC 6)', () => {
  const t = (m: Eleito['m']) => resumo(el({ m }), []).trajetoria;
  assert.equal(t('r'), 'reeleito');
  assert.equal(t('o'), 'veio de outro cargo');
  assert.equal(t('n'), 'primeiro mandato');
  assert.equal(t('?'), null);
});

test('senador eleito em 2022 não tem posição por votos (Demo AC 12)', () => {
  const s22 = el({ s: 's', k: 's', a: 2022, v: 0, x: 0, m: '?' });
  const s26 = el({ s: 't', k: 's', a: 2026, v: 700 });
  assert.equal(resumo(s22, [s22, s26]).posicao, null);
  assert.deepEqual(resumo(s26, [s22, s26]).posicao, { n: 1, de: 1 });
});

test('rótulo do cargo respeita Casa, DF e gênero (Demo AC 3)', () => {
  const c = (o: Partial<Eleito>) => resumo(el(o), []).cargo;
  assert.equal(c({ k: 'f', g: 'M' }), 'Deputado Federal');
  assert.equal(c({ k: 'f', g: 'F' }), 'Deputada Federal');
  assert.equal(c({ k: 'e', g: 'M', uf: 'GO' }), 'Deputado Estadual');
  assert.equal(c({ k: 'e', g: 'F', uf: 'DF' }), 'Deputada Distrital');
  assert.equal(c({ k: 's', g: 'M' }), 'Senador');
  assert.equal(c({ k: 's', g: 'F' }), 'Senadora');
});

const pl = (ano: number, cargo = 'Deputado Estadual'): PleitoTSE => [ano, cargo, 'go', 'Goiânia', 'PT', '13123', 5000 + ano, 1.2, 'Eleito'];

test('histórico ordena do pleito mais recente ao mais antigo (Demo AC 7)', () => {
  const r = historico([pl(2014), pl(2022), pl(2018)]);
  assert.deepEqual(r.map((l) => l.ano), [2022, 2018, 2014]);
});

test('histórico devolve no máximo 6 pleitos (Demo AC 7)', () => {
  const todos = [2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020].map((a) => pl(a));
  const r = historico(todos);
  assert.equal(r.length, 6);
  assert.equal(r[0].ano, 2020);
  assert.equal(r[5].ano, 2010);
});

test('histórico traz ano, cargo, partido, votos e situação (Demo AC 7)', () => {
  assert.deepEqual(historico([pl(2022, 'Vereador')])[0], {
    ano: 2022, cargo: 'Vereador', municipio: 'Goiânia', partido: 'PT', votos: 7022, situacao: 'Eleito',
  });
});

test('sem pleitos: undefined e lista vazia devolvem [] (edge)', () => {
  assert.deepEqual(historico(undefined), []);
  assert.deepEqual(historico([]), []);
});

test('as linhas do histórico não carregam título, CPF nem nascimento (Demo AC 13)', () => {
  const chaves = Object.keys(historico([pl(2022)])[0]).sort();
  assert.deepEqual(chaves, ['ano', 'cargo', 'municipio', 'partido', 'situacao', 'votos']);
});
