// Migration 4 do painel admin: uso_funcionalidades e v_admin_uso (ADM-14.2, 14.6, ADM-15), no PGlite.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { criaBanco, como, comoDono, semente, IDS } from './sql-ambiente.ts';
import type { Banco } from './sql-ambiente.ts';

let banco: Banco;
before(async () => { banco = await criaBanco(); });
after(async () => { await banco.close(); });

beforeEach(async () => {
  await comoDono(banco);
  await banco.exec('truncate public.uso_funcionalidades, public.eventos, public.membros, public.equipe_legisla, public.mandatos, auth.users cascade');
  await semente(banco);
});

const q = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) => (await banco.query<T>(sql, args)).rows;
const ins = (mandato: string, f = 'Persona') =>
  q('insert into public.uso_funcionalidades (mandato_id, funcionalidade) values ($1, $2)', [mandato, f]);

test('a tabela só tem mandato_id, funcionalidade e criado_em (mais o id) (ADM-14.2)', async () => {
  const cols = await q<{ column_name: string }>(
    `select column_name from information_schema.columns where table_schema = 'public' and table_name = 'uso_funcionalidades'`);
  assert.deepEqual(cols.map((c) => c.column_name).sort(), ['criado_em', 'funcionalidade', 'id', 'mandato_id']);
});

test('membro do mandato insere uma linha de uso (ADM-14.6)', async () => {
  await como(banco, IDS.membro);
  await ins(IDS.mandatoA);
  await comoDono(banco);
  assert.equal((await q('select * from public.uso_funcionalidades')).length, 1);
});

test('membro não insere em outro mandato; conta de fora também é recusada (ADM-14.6)', async () => {
  await como(banco, IDS.membro);
  await assert.rejects(ins(IDS.mandatoB), /row-level security/);
  await como(banco, IDS.fora);
  await assert.rejects(ins(IDS.mandatoA), /row-level security/);
});

test('anônimo não insere nem lê (ADM-14.6)', async () => {
  await como(banco, null);
  await assert.rejects(ins(IDS.mandatoA), /permission denied/);
  await assert.rejects(q('select * from public.uso_funcionalidades'), /permission denied/);
  await assert.rejects(q('select * from public.v_admin_uso'), /permission denied/);
});

test('a equipe lê a tabela; gabinete (mesmo o membro que gravou) não lê (ADM-14.6)', async () => {
  await comoDono(banco);
  await ins(IDS.mandatoA);
  for (const quem of [IDS.admin, IDS.leitura]) {
    await como(banco, quem);
    assert.equal((await q('select * from public.uso_funcionalidades')).length, 1, quem);
  }
  for (const quem of [IDS.membro, IDS.fora]) {
    await como(banco, quem);
    assert.equal((await q('select * from public.uso_funcionalidades')).length, 0, quem);
    assert.equal((await q('select * from public.v_admin_uso')).length, 0, quem);
  }
});

test('ninguém atualiza nem apaga pela API, nem a equipe nem o membro (ADM-14.6)', async () => {
  await comoDono(banco);
  await ins(IDS.mandatoA);
  for (const quem of [IDS.admin, IDS.membro]) {
    await como(banco, quem);
    await assert.rejects(q(`update public.uso_funcionalidades set funcionalidade = 'x'`), /permission denied/, quem);
    await assert.rejects(q('delete from public.uso_funcionalidades'), /permission denied/, quem);
  }
});

test('v_admin_uso agrega por dia no fuso de Brasília e exclui mandato arquivado (ADM-15.7)', async () => {
  await comoDono(banco);
  // 02:30Z de 11/03 ainda é 10/03 em Brasília (UTC-3); 03:00Z de 11/03 já é 11/03
  await banco.query(
    `insert into public.uso_funcionalidades (mandato_id, funcionalidade, criado_em) values
       ($1, 'Persona', '2026-03-11T02:30:00Z'), ($1, 'Persona', '2026-03-10T15:00:00Z'),
       ($1, 'Persona', '2026-03-11T03:00:00Z'), ($1, 'Social', '2026-03-11T12:00:00Z'),
       ($2, 'Persona', '2026-03-11T12:00:00Z')`,
    [IDS.mandatoA, IDS.mandatoB]);
  await banco.query(`update public.mandatos set arquivado_em = now() where id = $1`, [IDS.mandatoB]);
  await como(banco, IDS.admin);
  const r = await q<any>(`select to_char(dia, 'YYYY-MM-DD') dia, mandato_id, uf, funcionalidade, qtd from public.v_admin_uso order by dia, funcionalidade`);
  assert.deepEqual(r, [
    { dia: '2026-03-10', mandato_id: IDS.mandatoA, uf: 'SP', funcionalidade: 'Persona', qtd: 2 },
    { dia: '2026-03-11', mandato_id: IDS.mandatoA, uf: 'SP', funcionalidade: 'Persona', qtd: 1 },
    { dia: '2026-03-11', mandato_id: IDS.mandatoA, uf: 'SP', funcionalidade: 'Social', qtd: 1 },
  ]);
});

test('apagar o mandato apaga o uso dele (on delete cascade)', async () => {
  await comoDono(banco);
  await ins(IDS.mandatoA);
  await banco.query('delete from public.mandatos where id = $1', [IDS.mandatoA]);
  assert.equal((await q('select * from public.uso_funcionalidades')).length, 0);
});
