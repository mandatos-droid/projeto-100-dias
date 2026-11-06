// Migration 2 do painel admin: views v_admin_* e catálogo exercicios_guia (ADM-05, 06, 09 a 13), no PGlite.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { criaBanco, como, comoDono, semente, IDS } from './sql-ambiente.ts';
import type { Banco } from './sql-ambiente.ts';

const VIEWS = ['v_admin_mandatos', 'v_admin_exercicios', 'v_admin_eventos_mes', 'v_admin_atividade', 'v_admin_uso_campos'];
const PROIBIDAS = ['dados', 'texto', 'nome_civil', 'resp_telefone'];
const MANDATO_C = '00000000-0000-4000-8000-0000000000b3';

let banco: Banco;
before(async () => { banco = await criaBanco(); });
after(async () => { await banco.close(); });

beforeEach(async () => {
  await comoDono(banco);
  await banco.exec('truncate public.eventos, public.membros, public.equipe_legisla, public.mandatos, auth.users cascade');
  await semente(banco);
});

const q = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) => (await banco.query<T>(sql, args)).rows;
// altera dados como dono sem o carimbo automático de atualizado_em
async function dono(sql: string, args: unknown[] = []) {
  await comoDono(banco);
  await banco.exec('alter table public.mandatos disable trigger mandatos_touch');
  try { await banco.query(sql, args); } finally { await banco.exec('alter table public.mandatos enable trigger mandatos_touch'); }
}

test('gabinete fora da equipe recebe 0 linhas de cada view e o anônimo é recusado (ADM-02.8)', async () => {
  await comoDono(banco);
  await banco.query(`insert into public.eventos (mandato_id, missao, exercicio, texto) values ($1, 1, 'm1.persona', 'x')`, [IDS.mandatoA]);
  for (const quem of [IDS.membro, IDS.fora]) {
    await como(banco, quem);
    for (const v of VIEWS) assert.equal((await q(`select * from public.${v}`)).length, 0, `${quem} ${v}`);
    assert.equal((await q('select * from public.exercicios_guia')).length, 0);
  }
  await como(banco, null);
  for (const v of [...VIEWS, 'exercicios_guia']) await assert.rejects(q(`select * from public.${v}`), /permission denied/, v);
});

test('admin e leitura recebem as linhas esperadas de v_admin_mandatos (ADM-05.1, ADM-06.1)', async () => {
  for (const quem of [IDS.admin, IDS.leitura]) {
    await como(banco, quem);
    const r = await q<any>('select codigo, nome_parlamentar, cargo, casa, uf, partido, resp_nome, resp_cargo, membros, arquivado_em from public.v_admin_mandatos order by codigo');
    assert.deepEqual(r, [
      { codigo: 'AAA111', nome_parlamentar: 'Parlamentar Um', cargo: 'Deputada Federal', casa: 'Câmara dos Deputados', uf: 'SP', partido: 'PX', resp_nome: 'Resp Um', resp_cargo: 'Chefe de gabinete', membros: 1, arquivado_em: null },
      { codigo: 'BBB222', nome_parlamentar: 'Parlamentar Dois', cargo: 'Deputado Estadual', casa: 'Assembleia', uf: 'MG', partido: 'PY', resp_nome: 'Resp Dois', resp_cargo: 'Assessor', membros: 0, arquivado_em: null },
    ]);
  }
});

test('nenhuma view v_admin_* tem as colunas dados, texto, nome_civil nem resp_telefone (ADM-05.2, ADM-06.2, ADM-13.3)', async () => {
  const cols = await q<{ table_name: string; column_name: string }>(
    `select table_name, column_name from information_schema.columns where table_schema = 'public' and table_name like 'v\\_admin\\_%'`);
  assert.deepEqual([...new Set(cols.map((c) => c.table_name))].sort(), [...VIEWS].sort());
  assert.deepEqual(cols.filter((c) => PROIBIDAS.includes(c.column_name)), []);
});

test('ultima_atividade é o maior entre atualizado_em e o último evento, e sem evento vale atualizado_em (ADM-05.8, edge case)', async () => {
  await dono(`update public.mandatos set atualizado_em = '2026-01-10T12:00:00Z' where id = $1`, [IDS.mandatoA]);
  await dono(`update public.mandatos set atualizado_em = '2026-02-01T12:00:00Z' where id = $1`, [IDS.mandatoB]);
  await comoDono(banco);
  await banco.query(
    `insert into public.mandatos (id, codigo, atualizado_em) values ($1, 'CCC333', '2026-05-01T12:00:00Z')`, [MANDATO_C]);
  await banco.query(
    `insert into public.eventos (mandato_id, texto, criado_em) values
       ($1, 'novo',  '2026-03-05T12:00:00Z'), ($1, 'velho', '2026-01-20T12:00:00Z'), ($2, 'antes', '2026-04-01T12:00:00Z')`,
    [IDS.mandatoA, MANDATO_C]);
  await como(banco, IDS.admin);
  const r = await q<{ codigo: string; u: string }>(`select codigo, to_char(ultima_atividade at time zone 'UTC', 'YYYY-MM-DD') u from public.v_admin_mandatos order by codigo`);
  assert.deepEqual(r, [
    { codigo: 'AAA111', u: '2026-03-05' }, // evento mais novo que atualizado_em
    { codigo: 'BBB222', u: '2026-02-01' }, // sem evento: atualizado_em
    { codigo: 'CCC333', u: '2026-05-01' }, // evento mais velho que atualizado_em
  ]);
});

test('exercicios_concluidos conta só exercícios do catálogo com feitos = true (ADM-06.1)', async () => {
  await dono(`update public.mandatos set dados = $2::jsonb where id = $1`,
    [IDS.mandatoA, JSON.stringify({ feitos: { 'm1.persona': true, 'm1.frag': true, 'm1.conjuntura': false, 'm9.fantasma': true } })]);
  await como(banco, IDS.leitura);
  const r = await q<{ codigo: string; n: number }>('select codigo, exercicios_concluidos n from public.v_admin_mandatos order by codigo');
  assert.deepEqual(r, [{ codigo: 'AAA111', n: 2 }, { codigo: 'BBB222', n: 0 }]);
});

test('exercicios_guia tem 16 exercícios (4, 2, 4, 3 e 3 por missão) com título acentuado e só a equipe lê (ADM-09.1)', async () => {
  await como(banco, IDS.admin);
  const r = await q<{ missao: number; n: number }>('select missao, count(*)::int n from public.exercicios_guia group by missao order by missao');
  assert.deepEqual(r.map((x) => x.n), [4, 2, 4, 3, 3]);
  const t = await q<{ titulo: string }>(`select titulo from public.exercicios_guia where id in ('m2.funcoes', 'm4.comissoes', 'm5.monit') order by id`);
  assert.deepEqual(t.map((x) => x.titulo), ['A escalação do time', 'A escolha das Comissões Permanentes', 'O monitoramento do avanço das metas']);
});

test('v_admin_exercicios traz mandato x exercício com ok booleano e esconde mandato arquivado (ADM-05.1, ADM-09.1)', async () => {
  await dono(`update public.mandatos set dados = '{"feitos":{"m1.persona":true,"m5.imersao":true}}' where id = $1`, [IDS.mandatoA]);
  await dono(`update public.mandatos set arquivado_em = now() where id = $1`, [IDS.mandatoB]);
  await como(banco, IDS.admin);
  const r = await q<{ mandato_id: string; uf: string; exercicio: string; missao: number; ordem: number; ok: boolean }>('select * from public.v_admin_exercicios');
  assert.equal(r.length, 16);
  assert.ok(r.every((x) => x.mandato_id === IDS.mandatoA && x.uf === 'SP'));
  assert.deepEqual(r.filter((x) => x.ok).map((x) => x.exercicio).sort(), ['m1.persona', 'm5.imersao']);
  assert.deepEqual(r.find((x) => x.exercicio === 'm3.metas'), { mandato_id: IDS.mandatoA, uf: 'SP', exercicio: 'm3.metas', missao: 3, ordem: 4, ok: false });
  assert.deepEqual((await q('select codigo from public.v_admin_mandatos where arquivado_em is not null')).length, 1);
});

test('v_admin_eventos_mes agrupa por mês no fuso de Brasília: 01h UTC do dia 1º ainda é o mês anterior (ADM-10.5)', async () => {
  await comoDono(banco);
  await banco.query(
    `insert into public.eventos (mandato_id, texto, criado_em) values
       ($1, 'a', '2026-03-01T01:00:00Z'), ($1, 'b', '2026-02-10T15:00:00Z'), ($1, 'c', '2026-03-01T03:00:00Z'), ($2, 'd', '2026-03-15T12:00:00Z')`,
    [IDS.mandatoA, IDS.mandatoB]);
  await como(banco, IDS.admin);
  const r = await q<{ mandato_id: string; mes: string; qtd: number }>('select mandato_id, mes::text, qtd from public.v_admin_eventos_mes order by mandato_id, mes');
  assert.deepEqual(r, [
    { mandato_id: IDS.mandatoA, mes: '2026-02-01', qtd: 2 },
    { mandato_id: IDS.mandatoA, mes: '2026-03-01', qtd: 1 },
    { mandato_id: IDS.mandatoB, mes: '2026-03-01', qtd: 1 },
  ]);
});

test('v_admin_atividade mostra data, missão, exercício e código, com missão nula quando não há (ADM-13.1, ADM-13.2, ADM-13.3)', async () => {
  await comoDono(banco);
  await banco.query(
    `insert into public.eventos (mandato_id, missao, exercicio, texto, criado_em) values
       ($1, 2, 'm2.funcoes', 'TEXTO SECRETO', '2026-03-05T12:00:00Z'), ($2, null, 'feedback', 'outro', '2026-03-06T12:00:00Z')`,
    [IDS.mandatoA, IDS.mandatoB]);
  await como(banco, IDS.leitura);
  const r = await q<any>(`select to_char(criado_em at time zone 'UTC', 'YYYY-MM-DD') dia, missao, exercicio, codigo from public.v_admin_atividade order by criado_em`);
  assert.deepEqual(r, [
    { dia: '2026-03-05', missao: 2, exercicio: 'm2.funcoes', codigo: 'AAA111' },
    { dia: '2026-03-06', missao: null, exercicio: 'feedback', codigo: 'BBB222' },
  ]);
  assert.ok(!JSON.stringify(r).includes('SECRETO'));
});

test('v_admin_uso_campos marca só os campos realmente preenchidos e ignora o vazio inicial das ilhas (ADM-12.11)', async () => {
  const cheio = {
    tse: { sq: '123' }, munSel: '3550308',
    conj2: { muns: {}, posicao: {}, relacao: 'boa', relacaoPq: '', desafios: [], oportunidades: [] },
    eleitorado: { itens: [{ id: 'a' }] }, social: { itens: [{ id: 'b' }] },
    campos: { 'm2.on': '0|1', 'm2.f3': 'Fulana' },
  };
  const vazio = {
    tse: {}, relacoes: {}, pleitos: [], munSel: null,
    conj2: { muns: {}, posicao: {}, relacao: '', relacaoPq: '', desafios: [], oportunidades: [] },
    eleitorado: { itens: [] }, social: { itens: [] }, campos: { 'm2.on': '', 'm2.f1': '  ', 'm1.q1': 'texto' },
  };
  await dono('update public.mandatos set dados = $2::jsonb where id = $1', [IDS.mandatoA, JSON.stringify(cheio)]);
  await dono('update public.mandatos set dados = $2::jsonb where id = $1', [IDS.mandatoB, JSON.stringify(vazio)]);
  await como(banco, IDS.admin);
  const r = await q<any>('select * from public.v_admin_uso_campos order by uf');
  assert.deepEqual(r, [
    { mandato_id: IDS.mandatoB, uf: 'MG', persona: false, conjuntura: false, municipio: false, eleitorado: false, social: false, cadeiras: false },
    { mandato_id: IDS.mandatoA, uf: 'SP', persona: true, conjuntura: true, municipio: true, eleitorado: true, social: true, cadeiras: true },
  ]);
});

test('persona vale com relacoes ou pleitos preenchidos; cadeiras vale só com m2.f{n} com texto; arquivado sai de v_admin_uso_campos (ADM-12.11)', async () => {
  await dono('update public.mandatos set dados = $2::jsonb where id = $1', [IDS.mandatoA, JSON.stringify({ relacoes: { x: { status: 'aliado' } }, campos: { 'm2.f12': 'Beltrano' } })]);
  await dono('update public.mandatos set dados = $2::jsonb, arquivado_em = now() where id = $1', [IDS.mandatoB, JSON.stringify({ pleitos: [{ ano: 2020 }] })]);
  await como(banco, IDS.admin);
  const r = await q<any>('select uf, persona, cadeiras from public.v_admin_uso_campos');
  assert.deepEqual(r, [{ uf: 'SP', persona: true, cadeiras: true }]);
  await comoDono(banco);
  await banco.query(`update public.mandatos set dados = '{"pleitos":[{"ano":2020}]}', arquivado_em = null where id = $1`, [IDS.mandatoB]);
  await como(banco, IDS.admin);
  assert.deepEqual((await q<any>(`select persona from public.v_admin_uso_campos where uf = 'MG'`)), [{ persona: true }]);
});

test('dados com formato inesperado (campos como lista, tse como texto) não derrubam a view (ADM-12.11)', async () => {
  await dono('update public.mandatos set dados = $2::jsonb where id = $1', [IDS.mandatoA, JSON.stringify({ campos: [1, 2], tse: 'lixo', conj2: 'x', social: 5 })]);
  await como(banco, IDS.admin);
  const r = await q<any>(`select persona, conjuntura, social, cadeiras from public.v_admin_uso_campos where uf = 'SP'`);
  assert.deepEqual(r, [{ persona: true, conjuntura: false, social: false, cadeiras: false }]);
});
