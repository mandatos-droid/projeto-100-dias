import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pessoas, resolve, validaApoio, MAX_APOIOS } from '../lib/pessoas.ts';

type C = Record<string, string>;
// cadeiras: 0 Chefia (Ana*), 1 Coord. Legislativo (Bia), 2 sem nome, 3 (Caio), 7 Comunicação (Dani)
const equipe = (): C => ({
  'm2.on': '0|1|2|3|7',
  'm2.f1': 'Ana*', 'm2.f2': 'Bia', 'm2.f4': 'Caio', 'm2.f8': 'Dani', 'm2.f6': 'Eva (cadeira desativada)',
  'm2.p2.nome_cargo': 'Coordenadora Legislativa', 'm2.p8.coord': 'Comunicação',
});

test('pessoas lista só cadeiras ativas com nome, sem asterisco, com cargo e área (RUM-32.10)', () => {
  const p = pessoas(equipe(), ['Chefia de gabinete', 'Coord. Legislativo']);
  assert.deepEqual(p.map((x) => x.cad), [0, 1, 3, 7]);
  assert.deepEqual(p.map((x) => x.nome), ['Ana', 'Bia', 'Caio', 'Dani']);
  assert.equal(p[0].cargo, 'Chefia de gabinete', 'sem nome_cargo, vale o nome do modelo');
  assert.equal(p[1].cargo, 'Coordenadora Legislativa', 'nome_cargo gravado vale mais');
  assert.equal(p[1].area, 'Legislativo');
  assert.equal(p[3].area, 'Comunicação');
  assert.ok(!p.some((x) => x.nome.includes('*') || x.nome.includes('Eva')));
});

test('pessoas sem o nome do modelo deixa o cargo vazio em vez de inventar', () => {
  assert.equal(pessoas(equipe())[2].cargo, '');
});

test('sem cadeiras nomeadas, pessoas devolve lista vazia (RUM-32.13)', () => {
  assert.deepEqual(pessoas({}), []);
  assert.deepEqual(pessoas({ 'm2.on': '0|1' }), []);
});

test('resolve mostra o nome atual da cadeira quando ele muda (edge case)', () => {
  const c = equipe();
  const meta = { status: 'nao_concluida' as const, respCad: 1, resp: 'Bianca (nome antigo)', apoioCad: [3], apoio: 'Carlos (antigo)' };
  const r = resolve(c, meta);
  assert.equal(r.resp, 'Bia');
  assert.deepEqual(r.apoios, ['Caio']);
  assert.equal(r.foraDaEquipe, false);
});

test('resolve mantém o nome gravado e marca "fora da equipe" quando a cadeira some (edge case)', () => {
  const c = equipe();
  c['m2.on'] = '0|1|2|7'; // a cadeira 3 saiu
  delete c['m2.f4'];
  const r = resolve(c, { status: 'nao_concluida', respCad: 3, resp: 'Caio', apoioCad: [1], apoio: 'Bia' });
  assert.equal(r.resp, 'Caio');
  assert.equal(r.foraDaEquipe, true);
  assert.deepEqual(r.apoios, ['Bia']);
  // o responsável sumiu, o apoio não: só o responsável conta como fora
  assert.deepEqual(r.fora, ['Caio']);
});

test('resolve com apoio que sumiu mantém o nome gravado dele', () => {
  const c = equipe();
  c['m2.on'] = '0|1|2'; // saíram 3 e 7
  const r = resolve(c, { status: 'nao_concluida', respCad: 1, resp: 'Bia', apoioCad: [3, 7], apoio: 'Caio; Dani' });
  assert.deepEqual(r.apoios, ['Caio', 'Dani']);
  assert.equal(r.foraDaEquipe, true);
  assert.deepEqual(r.fora, ['Caio', 'Dani']);
});

test('resolve mantém o texto livre antigo quando não há vínculo com cadeira (RUM-32.13, RUM-70)', () => {
  const r = resolve({}, { status: 'nao_concluida', resp: 'Maria da Silva', apoio: 'João e Paula' });
  assert.equal(r.resp, 'Maria da Silva');
  assert.deepEqual(r.apoios, ['João e Paula']);
  assert.equal(r.foraDaEquipe, false);
  assert.deepEqual(resolve({}, { status: 'nao_concluida' }), { resp: '', apoios: [], foraDaEquipe: false, fora: [] });
});

test('resolve junta os apoios das cadeiras com o texto livre que veio depois (RUM-32.10)', () => {
  const r = resolve(equipe(), { status: 'nao_concluida', respCad: 1, resp: 'Bia', apoioCad: [3], apoio: 'Caio; Fulano de fora' });
  assert.deepEqual(r.apoios, ['Caio', 'Fulano de fora']);
  assert.equal(r.foraDaEquipe, false);
});

test('validaApoio recusa apoio igual ao responsável, por cadeira ou por nome (RUM-32.12)', () => {
  assert.match(validaApoio({ cad: 1, nome: 'Bia' }, [{ cad: 1, nome: 'Bia' }])!, /respons/i);
  assert.match(validaApoio({ cad: null, nome: 'Maria  da Silva' }, [{ nome: 'maria da silva' }])!, /respons/i);
  assert.match(validaApoio({ nome: 'José' }, [{ nome: 'Jose' }])!, /respons/i);
  assert.equal(validaApoio({ cad: 1, nome: 'Bia' }, [{ cad: 3, nome: 'Caio' }]), null);
});

test('validaApoio recusa mais de 3 apoios e aceita 0 (RUM-32.11)', () => {
  const quatro = [1, 2, 3, 4].map((n) => ({ cad: n, nome: `P${n}` }));
  assert.equal(MAX_APOIOS, 3);
  assert.match(validaApoio({ nome: 'X' }, quatro)!, /3/);
  assert.equal(validaApoio({ nome: 'X' }, quatro.slice(0, 3)), null);
  assert.equal(validaApoio({ nome: 'X' }, []), null);
  assert.equal(validaApoio({ nome: '' }, [{ nome: '' }]), null, 'sem responsável não há o que comparar');
});
