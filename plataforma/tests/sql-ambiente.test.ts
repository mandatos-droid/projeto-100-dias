// Prova que o ambiente PGlite reproduz o RLS do schema inicial (ADM-02: papéis lidos do banco).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { criaBanco, como, comoDono, semente, IDS } from './sql-ambiente.ts';
import type { Banco } from './sql-ambiente.ts';

let banco: Banco;

before(async () => {
  banco = await criaBanco();
  await semente(banco);
  await comoDono(banco);
  await banco.query(
    `insert into public.eventos (mandato_id, missao, exercicio, texto) values ($1, 1, 'm1.persona', 'texto A'), ($2, 1, 'm1.persona', 'texto B')`,
    [IDS.mandatoA, IDS.mandatoB],
  );
});
after(async () => { await banco.close(); });

const ids = async (sql: string) => (await banco.query<{ id: string }>(sql)).rows.map((r) => r.id).sort();

test('a semente tem 2 mandatos, 1 admin, 1 leitura e 1 membro de gabinete', async () => {
  await comoDono(banco);
  const n = async (t: string) => Number((await banco.query<{ c: string }>(`select count(*) c from public.${t}`)).rows[0].c);
  assert.equal(await n('mandatos'), 2);
  assert.equal(await n('membros'), 1);
  assert.equal((await banco.query(`select 1 from public.equipe_legisla where papel = 'admin'`)).rows.length, 1);
  assert.equal((await banco.query(`select 1 from public.equipe_legisla where papel = 'leitura'`)).rows.length, 1);
});

test('auth.uid() devolve o usuário escolhido por como() e nulo para anônimo', async () => {
  await como(banco, IDS.membro);
  assert.equal((await banco.query<{ u: string }>('select auth.uid() u')).rows[0].u, IDS.membro);
  await como(banco, null);
  assert.equal((await banco.query<{ u: string | null }>('select auth.uid() u')).rows[0].u, null);
});

test('membro do gabinete vê só o próprio mandato', async () => {
  await como(banco, IDS.membro);
  assert.deepEqual(await ids('select id from public.mandatos'), [IDS.mandatoA]);
});

test('membro do gabinete vê só os eventos do próprio mandato', async () => {
  await como(banco, IDS.membro);
  const r = await banco.query<{ texto: string }>('select texto from public.eventos');
  assert.deepEqual(r.rows.map((x) => x.texto), ['texto A']);
});

test('anônimo não lê nada: mandatos, eventos e equipe recusam por permissão', async () => {
  await como(banco, null);
  for (const t of ['mandatos', 'eventos', 'equipe_legisla']) {
    await assert.rejects(banco.query(`select * from public.${t}`), /permission denied/, t);
  }
});

test('conta fora da equipe e sem mandato recebe 0 mandatos', async () => {
  await como(banco, IDS.fora);
  assert.deepEqual(await ids('select id from public.mandatos'), []);
});

test('admin da equipe lê todos os mandatos', async () => {
  await como(banco, IDS.admin);
  assert.deepEqual(await ids('select id from public.mandatos'), [IDS.mandatoA, IDS.mandatoB].sort());
});

test('leitura da equipe também lê todos os mandatos, mas não os edita', async () => {
  await como(banco, IDS.leitura);
  assert.deepEqual(await ids('select id from public.mandatos'), [IDS.mandatoA, IDS.mandatoB].sort());
  const r = await banco.query(`update public.mandatos set cargo = 'x' where id = $1`, [IDS.mandatoB]);
  assert.equal(r.affectedRows, 0);
});

test('troca de papel vale na chamada seguinte (o RLS lê equipe_legisla a cada consulta)', async () => {
  await como(banco, IDS.fora);
  assert.deepEqual(await ids('select id from public.mandatos'), []);
  await comoDono(banco);
  await banco.query(`insert into public.equipe_legisla (user_id, papel) values ($1, 'leitura')`, [IDS.fora]);
  await como(banco, IDS.fora);
  assert.equal((await ids('select id from public.mandatos')).length, 2);
  await comoDono(banco);
  await banco.query(`delete from public.equipe_legisla where user_id = $1`, [IDS.fora]);
  await como(banco, IDS.fora);
  assert.deepEqual(await ids('select id from public.mandatos'), []);
});
