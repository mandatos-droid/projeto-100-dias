import { test } from 'node:test';
import assert from 'node:assert/strict';
import { indicadores, statusMensal } from '../lib/admin/analytics.ts';
import type { LinhaEventoMes } from '../lib/admin/analytics.ts';
import type { LinhaMandato } from '../lib/admin/mandatos.ts';

const AGORA = new Date('2026-11-05T15:00:00Z');

function m(id: string, o: Partial<LinhaMandato> = {}): LinhaMandato {
  return {
    id, codigo: id.toUpperCase(), nome_parlamentar: null, cargo: null, casa: null, uf: 'SP', partido: null, data_posse: null,
    resp_nome: null, resp_cargo: null, criado_em: '2026-01-01T12:00:00Z', arquivado_em: null, membros: 1,
    ultima_atividade: '2026-11-04T12:00:00Z', exercicios_concluidos: 0, ...o,
  };
}
const ev = (mandato_id: string, mes: string, qtd = 1): LinhaEventoMes => ({ mandato_id, mes, qtd });

// ---------- indicadores ----------

test('cadastrados conta só os não arquivados (ADM-09.1)', () => {
  const l = [m('a'), m('b'), m('c', { arquivado_em: '2026-10-01T12:00:00Z' })];
  assert.equal(indicadores(l, AGORA, 30, 45).cadastrados, 2);
});

test('lista vazia zera todos os indicadores, sem divisão por zero', () => {
  assert.deepEqual(indicadores([], AGORA, 30, 45), { cadastrados: 0, ativos: 0, mediaConcluidos: 0, parados: 0 });
});

test('ativos no período: última atividade dentro de N dias, e o período muda o resultado (ADM-09.2)', () => {
  const l = [
    m('a', { ultima_atividade: '2026-11-04T12:00:00Z' }), // 1 dia
    m('b', { ultima_atividade: '2026-10-20T12:00:00Z' }), // 16 dias
    m('c', { ultima_atividade: '2026-09-01T12:00:00Z' }), // 65 dias
  ];
  assert.equal(indicadores(l, AGORA, 7, 45).ativos, 1);
  assert.equal(indicadores(l, AGORA, 30, 45).ativos, 2);
  assert.equal(indicadores(l, AGORA, 45, 45).ativos, 2);
});

test('fronteira do período: exatamente N dias ainda é ativo; N+1 não', () => {
  const l = [m('a', { ultima_atividade: '2026-10-06T15:00:00Z' }), m('b', { ultima_atividade: '2026-10-05T15:00:00Z' })]; // 30 e 31 dias
  assert.equal(indicadores(l, AGORA, 30, 45).ativos, 1);
});

test('parados: mais de N dias sem atividade; exatamente N não conta (ADM-09.1)', () => {
  const l = [
    m('a', { ultima_atividade: '2026-09-21T15:00:00Z' }), // 45 dias: não
    m('b', { ultima_atividade: '2026-09-20T15:00:00Z' }), // 46 dias: sim
    m('c', { ultima_atividade: '2026-11-05T10:00:00Z' }), // hoje: não
  ];
  assert.equal(indicadores(l, AGORA, 30, 45).parados, 1);
  assert.equal(indicadores(l, AGORA, 30, 7).parados, 2);
});

test('média de exercícios concluídos é a média simples entre os não arquivados', () => {
  const l = [m('a', { exercicios_concluidos: 4 }), m('b', { exercicios_concluidos: 8 }), m('c', { exercicios_concluidos: 0 })];
  assert.equal(indicadores(l, AGORA, 30, 45).mediaConcluidos, 4);
  assert.equal(indicadores([m('a', { exercicios_concluidos: 1 }), m('b', { exercicios_concluidos: 2 })], AGORA, 30, 45).mediaConcluidos, 1.5);
});

test('arquivados ficam fora de todos os indicadores, inclusive da média e dos parados', () => {
  const l = [
    m('a', { exercicios_concluidos: 2 }),
    m('x', { exercicios_concluidos: 16, ultima_atividade: '2026-01-01T12:00:00Z', arquivado_em: '2026-10-01T12:00:00Z' }),
  ];
  assert.deepEqual(indicadores(l, AGORA, 30, 45), { cadastrados: 1, ativos: 1, mediaConcluidos: 2, parados: 0 });
});

test('a UF vale para todos os indicadores (ADM-09.3)', () => {
  const l = [
    m('a', { uf: 'SP', exercicios_concluidos: 6 }),
    m('b', { uf: 'RJ', exercicios_concluidos: 2, ultima_atividade: '2026-01-01T12:00:00Z' }),
    m('c', { uf: 'RJ', exercicios_concluidos: 4 }),
  ];
  assert.deepEqual(indicadores(l, AGORA, 30, 45, 'RJ'), { cadastrados: 2, ativos: 1, mediaConcluidos: 3, parados: 1 });
  assert.equal(indicadores(l, AGORA, 30, 45, 'MG').cadastrados, 0);
  assert.equal(indicadores(l, AGORA, 30, 45, null).cadastrados, 3);
});

// ---------- statusMensal ----------

test('sem mandatos devolve lista vazia (ADM-10.6)', () => {
  assert.deepEqual(statusMensal([], [], AGORA), []);
});

test('só mandatos arquivados também devolve lista vazia', () => {
  assert.deepEqual(statusMensal([m('x', { arquivado_em: '2026-10-01T12:00:00Z' })], [], AGORA), []);
});

test('vai do mês do primeiro cadastro ao mês atual; sem eventos, todo mês é Parado (ADM-10.4, 10.5)', () => {
  const r = statusMensal([m('a', { criado_em: '2026-09-15T12:00:00Z' })], [], AGORA);
  assert.deepEqual(r, [
    { mes: '2026-09', ativos: 0, parados: 1 },
    { mes: '2026-10', ativos: 0, parados: 1 },
    { mes: '2026-11', ativos: 0, parados: 1 },
  ]);
});

test('ao menos 1 linha de evento no mês torna o mandato Ativo naquele mês; os outros meses ficam Parado', () => {
  const r = statusMensal([m('a', { criado_em: '2026-09-15T12:00:00Z' })], [ev('a', '2026-10-01', 3)], AGORA);
  assert.deepEqual(r.map((x) => [x.mes, x.ativos, x.parados]), [['2026-09', 0, 1], ['2026-10', 1, 0], ['2026-11', 0, 1]]);
});

test('mandato criado no meio do mês, sem evento nele, é Parado naquele mês; com evento, Ativo', () => {
  const sem = statusMensal([m('a', { criado_em: '2026-10-20T12:00:00Z' })], [], AGORA);
  assert.deepEqual(sem[0], { mes: '2026-10', ativos: 0, parados: 1 });
  const com = statusMensal([m('a', { criado_em: '2026-10-20T12:00:00Z' })], [ev('a', '2026-10-01')], AGORA);
  assert.deepEqual(com[0], { mes: '2026-10', ativos: 1, parados: 0 });
});

test('mandato criado depois do fim do mês não conta como Parado nesse mês', () => {
  const r = statusMensal([m('a', { criado_em: '2026-09-05T12:00:00Z' }), m('b', { criado_em: '2026-10-20T12:00:00Z' })], [], AGORA);
  assert.deepEqual(r.map((x) => [x.mes, x.ativos, x.parados]), [['2026-09', 0, 1], ['2026-10', 0, 2], ['2026-11', 0, 2]]);
});

test('virada de fuso no cadastro: 02:30Z de 01/11 ainda é 31/10 em Brasília, então o gráfico começa em outubro', () => {
  const r = statusMensal([m('a', { criado_em: '2026-11-01T02:30:00Z' })], [], new Date('2026-11-05T15:00:00Z'));
  assert.deepEqual(r.map((x) => x.mes), ['2026-10', '2026-11']);
  assert.equal(r[0].parados, 1);
});

test('virada de fuso no cadastro: 03:00Z de 01/11 já é novembro em Brasília', () => {
  const r = statusMensal([m('a', { criado_em: '2026-11-01T03:00:00Z' })], [], new Date('2026-11-05T15:00:00Z'));
  assert.deepEqual(r.map((x) => x.mes), ['2026-11']);
});

test('virada de fuso no "agora": 02:30Z de 01/11 ainda é outubro em Brasília, então o mês atual é outubro', () => {
  const r = statusMensal([m('a', { criado_em: '2026-09-10T12:00:00Z' })], [], new Date('2026-11-01T02:30:00Z'));
  assert.deepEqual(r.map((x) => x.mes), ['2026-09', '2026-10']);
});

test('cadastro antigo: no máximo 12 meses, terminando no mês atual (13 meses ou mais viram 12)', () => {
  const r13 = statusMensal([m('a', { criado_em: '2025-11-10T12:00:00Z' })], [], AGORA); // 13 meses: 2025-11 a 2026-11
  assert.equal(r13.length, 12);
  assert.equal(r13[0].mes, '2025-12');
  assert.equal(r13[11].mes, '2026-11');
  const r12 = statusMensal([m('a', { criado_em: '2025-12-10T12:00:00Z' })], [], AGORA);
  assert.equal(r12.length, 12);
  assert.equal(r12[0].mes, '2025-12');
  const r2y = statusMensal([m('a', { criado_em: '2024-01-10T12:00:00Z' })], [], AGORA);
  assert.equal(r2y.length, 12);
});

test('o primeiro cadastro é o do mandato mais antigo entre os não arquivados', () => {
  const l = [m('a', { criado_em: '2026-10-10T12:00:00Z' }), m('x', { criado_em: '2026-01-10T12:00:00Z', arquivado_em: '2026-10-01T12:00:00Z' })];
  assert.equal(statusMensal(l, [], AGORA)[0].mes, '2026-10');
});

test('mandatos arquivados e seus eventos não entram na contagem (ADM-10.5)', () => {
  const l = [m('a', { criado_em: '2026-10-10T12:00:00Z' }), m('x', { criado_em: '2026-10-10T12:00:00Z', arquivado_em: '2026-10-20T12:00:00Z' })];
  const r = statusMensal(l, [ev('x', '2026-10-01'), ev('x', '2026-11-01')], AGORA);
  assert.deepEqual(r, [{ mes: '2026-10', ativos: 0, parados: 1 }, { mes: '2026-11', ativos: 0, parados: 1 }]);
});

test('a UF filtra mandatos e eventos do gráfico (ADM-09.3)', () => {
  const l = [m('a', { uf: 'SP', criado_em: '2026-10-10T12:00:00Z' }), m('b', { uf: 'RJ', criado_em: '2026-10-10T12:00:00Z' })];
  const eventos = [ev('a', '2026-10-01')];
  assert.deepEqual(statusMensal(l, eventos, AGORA, 'SP')[0], { mes: '2026-10', ativos: 1, parados: 0 });
  assert.deepEqual(statusMensal(l, eventos, AGORA, 'RJ')[0], { mes: '2026-10', ativos: 0, parados: 1 });
  assert.deepEqual(statusMensal(l, eventos, AGORA, 'MG'), []);
});

test('vários eventos do mesmo mandato no mês contam o mandato uma vez só', () => {
  const r = statusMensal([m('a', { criado_em: '2026-11-02T12:00:00Z' })], [ev('a', '2026-11-01', 5), ev('a', '2026-11-01', 2)], AGORA);
  assert.deepEqual(r, [{ mes: '2026-11', ativos: 1, parados: 0 }]);
});
