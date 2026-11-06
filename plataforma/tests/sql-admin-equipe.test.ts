// Migration 1 do painel admin: papéis, auditoria e gestão da equipe (ADM-02, ADM-03, ADM-04), no PGlite.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { criaBanco, como, comoDono, semente, IDS } from './sql-ambiente.ts';
import type { Banco } from './sql-ambiente.ts';

const MIGRATION = join(import.meta.dirname, '..', 'supabase', 'migrations', '20261105120000_admin_equipe.sql');
const SEM_PERMISSAO = /Você não tem permissão para esta ação\./;
const ULTIMO_ADMIN = /A equipe precisa ter ao menos um admin\./;

let banco: Banco;

before(async () => { banco = await criaBanco(); });
after(async () => { await banco.close(); });

// Cada teste parte da mesma semente: limpa o que os testes anteriores criaram.
beforeEach(async () => {
  await comoDono(banco);
  await banco.exec('drop trigger if exists falha_auditoria on public.auditoria_admin');
  await banco.exec('truncate public.auditoria_admin, public.membros, public.eventos, public.equipe_legisla, public.mandatos, auth.users cascade');
  await semente(banco);
});

const chama = (sql: string, args: unknown[] = []) => banco.query(sql, args);
const equipe = async () => {
  await comoDono(banco);
  return (await banco.query<{ user_id: string; papel: string }>('select user_id, papel from public.equipe_legisla order by user_id')).rows;
};
const auditoria = async () => {
  await comoDono(banco);
  return (await banco.query<{ acao: string; alvo_tipo: string; alvo_id: string; autor: string; user_id: string; detalhe: Record<string, unknown> }>(
    'select acao, alvo_tipo, alvo_id, autor, user_id, detalhe from public.auditoria_admin order by id')).rows;
};

test('a migration converte linhas analista em leitura e a constraint recusa valores fora de admin/leitura (ADM-02.9)', async () => {
  await comoDono(banco);
  // reaplica a migration real sobre um estado antigo (constraint antiga e uma linha analista)
  await banco.exec('alter table public.equipe_legisla drop constraint equipe_legisla_papel_check');
  await banco.query(`insert into public.equipe_legisla (user_id, nome, papel) values ($1, 'Antiga', 'analista')`, [IDS.fora]);
  await banco.exec(readFileSync(MIGRATION, 'utf8'));
  assert.equal((await banco.query<{ papel: string }>('select papel from public.equipe_legisla where user_id = $1', [IDS.fora])).rows[0].papel, 'leitura');
  await assert.rejects(
    banco.query(`update public.equipe_legisla set papel = 'analista' where user_id = $1`, [IDS.fora]),
    /equipe_legisla_papel_check/,
  );
});

test('admin e leitura leem a equipe em ordem crescente de entrada, com nome, e-mail e papel (ADM-03.1)', async () => {
  await comoDono(banco);
  await banco.query(`update public.equipe_legisla set criado_em = '2026-01-01' where user_id = $1`, [IDS.leitura]);
  await banco.query(`update public.equipe_legisla set criado_em = '2026-02-01' where user_id = $1`, [IDS.admin]);
  for (const quem of [IDS.admin, IDS.leitura]) {
    await como(banco, quem);
    const r = await chama('select * from public.admin_equipe()');
    assert.deepEqual(r.rows.map((x: any) => [x.nome, x.email, x.papel]), [
      ['Lia Leitura', 'leitura@legislabrasil.org', 'leitura'],
      ['Ana Admin', 'admin@legislabrasil.org', 'admin'],
    ]);
  }
});

test('equipe_legisla é legível por toda a equipe e invisível para quem não é dela (ADM-02.8)', async () => {
  await como(banco, IDS.leitura);
  assert.equal((await chama('select * from public.equipe_legisla')).rows.length, 2);
  await como(banco, IDS.membro);
  assert.equal((await chama('select * from public.equipe_legisla')).rows.length, 0);
  await como(banco, IDS.fora);
  assert.equal((await chama('select * from public.equipe_legisla')).rows.length, 0);
});

test('conta fora da equipe e anônimo não leem a equipe nem a auditoria pelas funções e tabelas (ADM-02.8)', async () => {
  await como(banco, IDS.fora);
  await assert.rejects(chama('select * from public.admin_equipe()'), SEM_PERMISSAO);
  await como(banco, null);
  await assert.rejects(chama('select * from public.admin_equipe()'), /permission denied/);
  await assert.rejects(chama('select * from public.equipe_legisla'), /permission denied/);
  await assert.rejects(chama('select * from public.auditoria_admin'), /permission denied/);
});

test('buscar usuário: e-mail exato sem caixa nem espaços devolve uma pessoa; sem conta devolve 0 linhas (ADM-03.3)', async () => {
  await como(banco, IDS.admin);
  const r = await chama('select * from public.admin_buscar_usuario($1)', ['  FORA@Exemplo.com ']);
  assert.equal(r.rows.length, 1);
  assert.deepEqual(r.rows[0], { user_id: IDS.fora, nome: 'Fabio Fora', email: 'fora@exemplo.com' });
  assert.equal((await chama('select * from public.admin_buscar_usuario($1)', ['fora@exemplo'])).rows.length, 0);
  assert.equal((await chama('select * from public.admin_buscar_usuario($1)', ['ninguem@exemplo.com'])).rows.length, 0);
});

test('buscar usuário responde só a admin: leitura, gabinete e anônimo são recusados (ADM-03.3)', async () => {
  for (const quem of [IDS.leitura, IDS.membro]) {
    await como(banco, quem);
    await assert.rejects(chama('select * from public.admin_buscar_usuario($1)', ['fora@exemplo.com']), SEM_PERMISSAO);
  }
  await como(banco, null);
  await assert.rejects(chama('select * from public.admin_buscar_usuario($1)', ['fora@exemplo.com']), /permission denied/);
});

test('admin inclui uma conta existente com o papel escolhido e a auditoria registra quem, ação, alvo e detalhe (ADM-03.2, ADM-04.1)', async () => {
  await como(banco, IDS.admin);
  await chama('select public.admin_equipe_incluir($1, $2)', [IDS.fora, 'leitura']);
  assert.deepEqual((await equipe()).find((x) => x.user_id === IDS.fora), { user_id: IDS.fora, papel: 'leitura' });
  const [linha] = await auditoria();
  assert.equal(linha.acao, 'equipe.incluir');
  assert.equal(linha.alvo_tipo, 'equipe');
  assert.equal(linha.alvo_id, IDS.fora);
  assert.equal(linha.user_id, IDS.admin);
  assert.equal(linha.autor, 'Ana Admin');
  assert.deepEqual(linha.detalhe, { papel: 'leitura', nome: 'Fabio Fora', email: 'fora@exemplo.com' });
});

test('incluir recusa duplicado e alvo ausente com as mensagens da spec, sem mudar nada nem auditar (ADM-03.5)', async () => {
  await como(banco, IDS.admin);
  await assert.rejects(chama('select public.admin_equipe_incluir($1, $2)', [IDS.leitura, 'admin']), /Esta pessoa já está na equipe\./);
  await assert.rejects(chama('select public.admin_equipe_incluir($1, $2)', ['00000000-0000-4000-8000-00000000ffff', 'leitura']), /Pessoa não encontrada\./);
  await assert.rejects(chama('select public.admin_equipe_incluir($1, $2)', [IDS.fora, 'analista']), /Papel inválido\./);
  assert.equal((await equipe()).length, 2);
  assert.equal((await auditoria()).length, 0);
});

test('troca de papel grava o novo papel e audita de/para (ADM-03.6)', async () => {
  await como(banco, IDS.admin);
  await chama('select public.admin_equipe_papel($1, $2)', [IDS.leitura, 'admin']);
  assert.equal((await equipe()).find((x) => x.user_id === IDS.leitura)!.papel, 'admin');
  const [linha] = await auditoria();
  assert.equal(linha.acao, 'equipe.papel');
  assert.deepEqual(linha.detalhe, { nome: 'Lia Leitura', de: 'leitura', para: 'admin' });
});

test('rebaixar o último admin é recusado; com outro admin, o rebaixamento (inclusive de si mesmo) passa (ADM-03.8, edge case)', async () => {
  await como(banco, IDS.admin);
  await assert.rejects(chama('select public.admin_equipe_papel($1, $2)', [IDS.admin, 'leitura']), ULTIMO_ADMIN);
  assert.equal((await equipe()).find((x) => x.user_id === IDS.admin)!.papel, 'admin');
  assert.equal((await auditoria()).length, 0);
  await comoDono(banco);
  await banco.query(`update public.equipe_legisla set papel = 'admin' where user_id = $1`, [IDS.leitura]);
  await como(banco, IDS.admin);
  await chama('select public.admin_equipe_papel($1, $2)', [IDS.admin, 'leitura']);
  assert.equal((await equipe()).find((x) => x.user_id === IDS.admin)!.papel, 'leitura');
});

test('remover tira da equipe sem apagar a conta e audita nome e papel (ADM-03.7, ADM-04.1)', async () => {
  await como(banco, IDS.admin);
  await chama('select public.admin_equipe_remover($1)', [IDS.leitura]);
  assert.deepEqual((await equipe()).map((x) => x.user_id), [IDS.admin]);
  await comoDono(banco);
  assert.equal((await banco.query('select 1 from auth.users where id = $1', [IDS.leitura])).rows.length, 1);
  const [linha] = await auditoria();
  assert.equal(linha.acao, 'equipe.remover');
  assert.equal(linha.alvo_id, IDS.leitura);
  assert.deepEqual(linha.detalhe, { nome: 'Lia Leitura', papel: 'leitura' });
});

test('remover o último admin é recusado; remover quem não está na equipe responde "Pessoa não encontrada." (ADM-03.8, edge case)', async () => {
  await como(banco, IDS.admin);
  await assert.rejects(chama('select public.admin_equipe_remover($1)', [IDS.admin]), ULTIMO_ADMIN);
  await assert.rejects(chama('select public.admin_equipe_remover($1)', [IDS.fora]), /Pessoa não encontrada\./);
  await assert.rejects(chama('select public.admin_equipe_papel($1, $2)', [IDS.fora, 'admin']), /Pessoa não encontrada\./);
  assert.equal((await equipe()).length, 2);
  assert.equal((await auditoria()).length, 0);
});

test('leitura, gabinete e anônimo são recusados em incluir, trocar papel e remover, sem mudar nada (ADM-02.7)', async () => {
  const chamadas: [string, unknown[]][] = [
    ['select public.admin_equipe_incluir($1, $2)', [IDS.fora, 'leitura']],
    ['select public.admin_equipe_papel($1, $2)', [IDS.leitura, 'admin']],
    ['select public.admin_equipe_remover($1)', [IDS.leitura]],
  ];
  for (const quem of [IDS.leitura, IDS.membro, IDS.fora]) {
    await como(banco, quem);
    for (const [sql, args] of chamadas) await assert.rejects(chama(sql, args), SEM_PERMISSAO, `${quem} ${sql}`);
  }
  await como(banco, null);
  for (const [sql, args] of chamadas) await assert.rejects(chama(sql, args), /permission denied/);
  assert.deepEqual((await equipe()).map((x) => x.papel).sort(), ['admin', 'leitura']);
  assert.equal((await auditoria()).length, 0);
});

test('escrita direta em equipe_legisla é recusada até para admin: só as funções gravam (ADM-02)', async () => {
  await como(banco, IDS.admin);
  await assert.rejects(chama(`insert into public.equipe_legisla (user_id, papel) values ($1, 'admin')`, [IDS.fora]), /permission denied/);
  await assert.rejects(chama(`update public.equipe_legisla set papel = 'leitura' where user_id = $1`, [IDS.admin]), /permission denied/);
  await assert.rejects(chama('delete from public.equipe_legisla where user_id = $1', [IDS.leitura]), /permission denied/);
});

test('auditoria_admin: update, delete e insert direto falham para admin; só a equipe lê (ADM-04.3)', async () => {
  await como(banco, IDS.admin);
  await chama('select public.admin_equipe_incluir($1, $2)', [IDS.fora, 'leitura']);
  await assert.rejects(chama(`update public.auditoria_admin set acao = 'x'`), /permission denied/);
  await assert.rejects(chama('delete from public.auditoria_admin'), /permission denied/);
  await assert.rejects(chama(`insert into public.auditoria_admin (acao, alvo_tipo, alvo_id) values ('x', 'y', 'z')`), /permission denied/);
  await assert.rejects(chama(`select private.audita('x', 'y', 'z', '{}'::jsonb)`), /permission denied/);
  assert.equal((await chama('select * from public.auditoria_admin')).rows.length, 1);
  await como(banco, IDS.leitura);
  assert.equal((await chama('select * from public.auditoria_admin')).rows.length, 1);
  await como(banco, IDS.membro);
  assert.equal((await chama('select * from public.auditoria_admin')).rows.length, 0);
});

test('falha ao gravar a auditoria desfaz a ação inteira (ADM-04.2)', async () => {
  await comoDono(banco);
  await banco.exec(`
    create function public.quebra_auditoria() returns trigger language plpgsql as $$ begin raise exception 'auditoria indisponível'; end; $$;
    create trigger falha_auditoria before insert on public.auditoria_admin for each row execute function public.quebra_auditoria();
  `);
  await como(banco, IDS.admin);
  await assert.rejects(chama('select public.admin_equipe_incluir($1, $2)', [IDS.fora, 'leitura']), /auditoria indisponível/);
  await assert.rejects(chama('select public.admin_equipe_papel($1, $2)', [IDS.leitura, 'admin']), /auditoria indisponível/);
  await assert.rejects(chama('select public.admin_equipe_remover($1)', [IDS.leitura]), /auditoria indisponível/);
  assert.deepEqual(await equipe(), [
    { user_id: IDS.admin, papel: 'admin' }, { user_id: IDS.leitura, papel: 'leitura' },
  ].sort((a, b) => (a.user_id < b.user_id ? -1 : 1)));
  await comoDono(banco);
  await banco.exec('drop trigger falha_auditoria on public.auditoria_admin; drop function public.quebra_auditoria()');
});
