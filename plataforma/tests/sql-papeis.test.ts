// Acesso, equipe e convites: papéis do mandato e "leitura" aplicada nas políticas (ACE-03), no PGlite.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { criaBanco, como, comoDono, semente, IDS } from './sql-ambiente.ts';
import type { Banco } from './sql-ambiente.ts';

// Além da semente: assessoria e leitura no mandato A, coordenação no mandato B.
const ASSESSORIA = '00000000-0000-4000-8000-0000000000c1';
const LEITOR = '00000000-0000-4000-8000-0000000000c2';
const COORD_B = '00000000-0000-4000-8000-0000000000c3';
const RLS = /row-level security/;

let banco: Banco;
before(async () => { banco = await criaBanco(); });
after(async () => { await banco.close(); });

beforeEach(async () => {
  await comoDono(banco);
  await banco.exec('truncate public.eventos, public.membros, public.equipe_legisla, public.mandatos, auth.users cascade');
  await semente(banco);
  await banco.query(
    `insert into auth.users (id, email, raw_user_meta_data) values
       ($1, 'assessoria@gabinete.leg.br', '{"name":"Alice Assessoria"}'),
       ($2, 'leitor@gabinete.leg.br',     '{"name":"Leo Leitor"}'),
       ($3, 'coord@outro.leg.br',         '{"name":"Bia Coord"}')`,
    [ASSESSORIA, LEITOR, COORD_B],
  );
  await banco.query(
    `insert into public.membros (mandato_id, user_id, nome, papel) values
       ($1, $3, 'Alice Assessoria', 'assessoria'), ($1, $4, 'Leo Leitor', 'leitura'), ($2, $5, 'Bia Coord', 'coordenacao')`,
    [IDS.mandatoA, IDS.mandatoB, ASSESSORIA, LEITOR, COORD_B],
  );
});

const q = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) => (await banco.query<T>(sql, args)).rows;
const nomeDoMandato = async (id: string) => {
  await comoDono(banco);
  return (await q<{ nome_parlamentar: string }>('select nome_parlamentar from public.mandatos where id = $1', [id]))[0].nome_parlamentar;
};
const totalEventos = async () => {
  await comoDono(banco);
  return (await q<{ n: number }>('select count(*)::int n from public.eventos'))[0].n;
};
const editaNome = (id: string, nome: string) =>
  banco.query('update public.mandatos set nome_parlamentar = $2 where id = $1', [id, nome]);
const criaEvento = (mandato: string, autor: string) =>
  banco.query(`insert into public.eventos (mandato_id, user_id, texto) values ($1, $2, 'escrito')`, [mandato, autor]);

test('membros.papel aceita só coordenacao, assessoria e leitura (ACE-03.1)', async () => {
  await comoDono(banco);
  for (const papel of ['titular', 'admin', 'Coordenacao', 'analista', '']) {
    await assert.rejects(
      banco.query('insert into public.membros (mandato_id, user_id, nome, papel) values ($1, $2, $3, $4)', [IDS.mandatoB, IDS.fora, 'Fabio', papel]),
      /membros_papel_check/, papel,
    );
  }
  await assert.rejects(
    banco.query(`update public.membros set papel = 'titular' where user_id = $1`, [LEITOR]),
    /membros_papel_check/,
  );
  await banco.query(`insert into public.membros (mandato_id, user_id, nome, papel) values ($1, $2, 'Fabio', 'leitura')`, [IDS.mandatoB, IDS.fora]);
  const papeis = await q<{ papel: string }>('select distinct papel from public.membros order by papel');
  assert.deepEqual(papeis.map((x) => x.papel), ['assessoria', 'coordenacao', 'leitura']);
});

test('membro leitura consulta o mandato, os membros e os eventos, mas o update em mandatos não muda nenhuma linha (ACE-03.2)', async () => {
  await comoDono(banco);
  await banco.query(`insert into public.eventos (mandato_id, texto) values ($1, 'registro A')`, [IDS.mandatoA]);
  await como(banco, LEITOR);
  assert.deepEqual((await q<{ nome_parlamentar: string }>('select nome_parlamentar from public.mandatos')).map((x) => x.nome_parlamentar), ['Parlamentar Um']);
  assert.equal((await q('select * from public.membros')).length, 3);
  assert.deepEqual((await q<{ texto: string }>('select texto from public.eventos')).map((x) => x.texto), ['registro A']);
  const r = await banco.query(`update public.mandatos set nome_parlamentar = 'Alterado', dados = '{}'::jsonb where id = $1`, [IDS.mandatoA]);
  assert.equal(r.affectedRows, 0);
  assert.equal(await nomeDoMandato(IDS.mandatoA), 'Parlamentar Um');
  assert.deepEqual((await q<{ dados: unknown }>('select dados from public.mandatos where id = $1', [IDS.mandatoA]))[0].dados, { texto: 'segredo A' });
});

test('membro leitura não insere em eventos do próprio mandato (ACE-03.2)', async () => {
  await como(banco, LEITOR);
  await assert.rejects(criaEvento(IDS.mandatoA, LEITOR), RLS);
  assert.equal(await totalEventos(), 0);
});

test('coordenação e assessoria continuam gravando em mandatos e em eventos (ACE-03.2)', async () => {
  for (const [quem, nome] of [[IDS.membro, 'Pela coordenação'], [ASSESSORIA, 'Pela assessoria']] as const) {
    await como(banco, quem);
    assert.equal((await editaNome(IDS.mandatoA, nome)).affectedRows, 1, quem);
    assert.equal(await nomeDoMandato(IDS.mandatoA), nome);
    await como(banco, quem);
    await criaEvento(IDS.mandatoA, quem);
  }
  assert.equal(await totalEventos(), 2);
});

test('membro de outro mandato não altera mandatos nem insere eventos no mandato alheio', async () => {
  await como(banco, COORD_B);
  assert.equal((await editaNome(IDS.mandatoA, 'Invasão')).affectedRows, 0);
  await assert.rejects(criaEvento(IDS.mandatoA, COORD_B), RLS);
  await como(banco, IDS.membro);
  assert.equal((await editaNome(IDS.mandatoB, 'Invasão')).affectedRows, 0);
  await assert.rejects(criaEvento(IDS.mandatoB, IDS.membro), RLS);
  assert.equal(await nomeDoMandato(IDS.mandatoA), 'Parlamentar Um');
  assert.equal(await nomeDoMandato(IDS.mandatoB), 'Parlamentar Dois');
  assert.equal(await totalEventos(), 0);
});

test('private.pode_editar: verdadeiro para coordenação e assessoria; falso para leitura, outro mandato, equipe Legisla e quem não é membro', async () => {
  const pode = async (quem: string) => {
    await como(banco, quem);
    return (await q<{ v: boolean }>('select private.pode_editar($1) v', [IDS.mandatoA]))[0].v;
  };
  assert.equal(await pode(IDS.membro), true);
  assert.equal(await pode(ASSESSORIA), true);
  assert.equal(await pode(LEITOR), false);
  assert.equal(await pode(COORD_B), false);
  assert.equal(await pode(IDS.admin), false);
  assert.equal(await pode(IDS.fora), false);
});

test('private.papel_no_mandato devolve o papel lido da tabela e nulo para quem não é membro; anon não executa as auxiliares', async () => {
  const papel = async (quem: string) => {
    await como(banco, quem);
    return (await q<{ p: string | null }>('select private.papel_no_mandato($1) p', [IDS.mandatoA]))[0].p;
  };
  assert.equal(await papel(IDS.membro), 'coordenacao');
  assert.equal(await papel(ASSESSORIA), 'assessoria');
  assert.equal(await papel(LEITOR), 'leitura');
  assert.equal(await papel(IDS.fora), null);
  // a troca na tabela vale na chamada seguinte: não há papel guardado em sessão
  await comoDono(banco);
  await banco.query(`update public.membros set papel = 'leitura' where user_id = $1`, [ASSESSORIA]);
  assert.equal(await papel(ASSESSORIA), 'leitura');
  await como(banco, ASSESSORIA);
  assert.equal((await editaNome(IDS.mandatoA, 'Depois do rebaixamento')).affectedRows, 0);
  await como(banco, null);
  for (const f of ['private.pode_editar($1)', 'private.papel_no_mandato($1)']) {
    await assert.rejects(banco.query(`select ${f}`, [IDS.mandatoA]), /permission denied/, f);
  }
  await assert.rejects(banco.query(`select private.nivel_papel('leitura')`), /permission denied/);
});

test('private.nivel_papel ordena coordenacao > assessoria > leitura, e papel desconhecido fica abaixo de todos (ACE-01.6)', async () => {
  await como(banco, IDS.membro);
  const r = await q<{ c: number; a: number; l: number; x: number }>(
    `select private.nivel_papel('coordenacao') c, private.nivel_papel('assessoria') a,
            private.nivel_papel('leitura') l, private.nivel_papel('titular') x`);
  const { c, a, l, x } = r[0];
  assert.ok(c > a && a > l && l > x, JSON.stringify(r[0]));
});

test('a migration de convites vem depois das migrations do painel-admin e roda no PGlite sem erro', async () => {
  const pasta = join(import.meta.dirname, '..', 'supabase', 'migrations');
  const arquivos = readdirSync(pasta).filter((f) => f.endsWith('.sql')).sort();
  const nossa = arquivos.indexOf('20261106120000_convites_equipe.sql');
  assert.ok(nossa > arquivos.indexOf('20261105150000_uso_funcionalidades.sql'), arquivos.join(','));
  assert.ok(arquivos.indexOf('20261105150000_uso_funcionalidades.sql') > arquivos.indexOf('20261105140000_admin_mandatos_gestao.sql'));
  // criaBanco (before) aplicou todas em ordem; o que esta migration cria está no banco
  await comoDono(banco);
  const r = await q<{ f: string | null; c: string | null }>(
    `select to_regprocedure('private.pode_editar(uuid)')::text f,
            (select conname::text from pg_constraint where conname = 'membros_papel_check') c`);
  assert.deepEqual(r[0], { f: 'private.pode_editar(uuid)', c: 'membros_papel_check' });
});
