// Migration 3 do painel admin: membros, arquivar e excluir mandato (ADM-07, ADM-08), no PGlite.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { criaBanco, como, comoDono, semente, IDS } from './sql-ambiente.ts';
import type { Banco } from './sql-ambiente.ts';

const SEM_PERMISSAO = /Você não tem permissão para esta ação\./;
const ULTIMA_COORD = /O mandato precisa de ao menos uma pessoa na coordenação\./;
const A = IDS.mandatoA; // única coordenação: IDS.membro
const B = IDS.mandatoB;

let banco: Banco;
before(async () => { banco = await criaBanco(); });
after(async () => { await banco.close(); });

beforeEach(async () => {
  await comoDono(banco);
  await banco.exec('drop trigger if exists falha_auditoria on public.auditoria_admin');
  await banco.exec('truncate public.auditoria_admin, public.sugestoes, public.eventos, public.membros, public.equipe_legisla, public.mandatos, auth.users cascade');
  await semente(banco);
});

const chama = (sql: string, args: unknown[] = []) => banco.query(sql, args);
const dono = async <T = any>(sql: string, args: unknown[] = []) => { await comoDono(banco); return (await banco.query<T>(sql, args)).rows; };
const membrosDe = async (m: string) => (await dono<{ user_id: string; papel: string }>(
  'select user_id, papel from public.membros where mandato_id = $1 order by user_id', [m]));
const auditoria = () => dono<{ acao: string; alvo_tipo: string; alvo_id: string; autor: string; user_id: string; detalhe: any }>(
  'select acao, alvo_tipo, alvo_id, autor, user_id, detalhe from public.auditoria_admin order by id');
const addMembro = (m: string, u: string, papel: string) =>
  dono(`insert into public.membros (mandato_id, user_id, nome, papel) values ($1, $2, 'x', $3)`, [m, u, papel]);

test('admin e leitura listam os membros com nome, e-mail e papel; gabinete, fora e anônimo são recusados (ADM-07.3, ADM-02.8)', async () => {
  for (const quem of [IDS.admin, IDS.leitura]) {
    await como(banco, quem);
    const r = await chama('select nome, email, papel from public.admin_membros($1)', [A]);
    assert.deepEqual(r.rows, [{ nome: 'Mario Membro', email: 'membro@gabinete.leg.br', papel: 'coordenacao' }]);
  }
  for (const quem of [IDS.membro, IDS.fora]) {
    await como(banco, quem);
    await assert.rejects(chama('select * from public.admin_membros($1)', [A]), SEM_PERMISSAO);
  }
  await como(banco, null);
  await assert.rejects(chama('select * from public.admin_membros($1)', [A]), /permission denied/);
});

test('admin adiciona uma conta existente ao mandato e a auditoria guarda quem, alvo e detalhe (ADM-07.4, ADM-04.1)', async () => {
  await como(banco, IDS.admin);
  await chama('select public.admin_membro_adicionar($1, $2, $3)', [A, IDS.fora, 'assessoria']);
  assert.deepEqual((await membrosDe(A)).find((x) => x.user_id === IDS.fora), { user_id: IDS.fora, papel: 'assessoria' });
  const [linha] = await auditoria();
  assert.equal(linha.acao, 'membro.adicionar');
  assert.equal(linha.alvo_tipo, 'mandato');
  assert.equal(linha.alvo_id, A);
  assert.equal(linha.user_id, IDS.admin);
  assert.deepEqual(linha.detalhe, { codigo: 'AAA111', user_id: IDS.fora, nome: 'Fabio Fora', email: 'fora@exemplo.com', papel: 'assessoria' });
});

test('adicionar recusa duplicado, pessoa e mandato ausentes e papel fora de coordenacao/assessoria, sem mudar nada (ADM-07.6)', async () => {
  await como(banco, IDS.admin);
  await assert.rejects(chama('select public.admin_membro_adicionar($1, $2, $3)', [A, IDS.membro, 'assessoria']), /Esta pessoa já é membro deste mandato\./);
  await assert.rejects(chama('select public.admin_membro_adicionar($1, $2, $3)', [A, '00000000-0000-4000-8000-00000000ffff', 'assessoria']), /Pessoa não encontrada\./);
  await assert.rejects(chama('select public.admin_membro_adicionar($1, $2, $3)', ['00000000-0000-4000-8000-00000000fffe', IDS.fora, 'assessoria']), /Mandato não encontrado\./);
  await assert.rejects(chama('select public.admin_membro_adicionar($1, $2, $3)', [A, IDS.fora, 'parlamentar']), /Papel inválido\./);
  assert.deepEqual((await membrosDe(A)).map((x) => x.user_id), [IDS.membro]);
  assert.equal((await auditoria()).length, 0);
});

test('troca o papel de um membro e audita de/para (ADM-07.7)', async () => {
  await addMembro(A, IDS.fora, 'assessoria');
  await como(banco, IDS.admin);
  await chama('select public.admin_membro_papel($1, $2, $3)', [A, IDS.fora, 'coordenacao']);
  assert.equal((await membrosDe(A)).find((x) => x.user_id === IDS.fora)!.papel, 'coordenacao');
  const [linha] = await auditoria();
  assert.equal(linha.acao, 'membro.papel');
  assert.deepEqual(linha.detalhe, { codigo: 'AAA111', user_id: IDS.fora, nome: 'x', de: 'assessoria', para: 'coordenacao' });
});

test('rebaixar a última coordenação é recusado; com outra pessoa na coordenação, passa (ADM-07.9)', async () => {
  await como(banco, IDS.admin);
  await assert.rejects(chama('select public.admin_membro_papel($1, $2, $3)', [A, IDS.membro, 'assessoria']), ULTIMA_COORD);
  assert.equal((await membrosDe(A))[0].papel, 'coordenacao');
  assert.equal((await auditoria()).length, 0);
  await addMembro(A, IDS.fora, 'coordenacao');
  await como(banco, IDS.admin);
  await chama('select public.admin_membro_papel($1, $2, $3)', [A, IDS.membro, 'assessoria']);
  assert.equal((await membrosDe(A)).find((x) => x.user_id === IDS.membro)!.papel, 'assessoria');
});

test('remover tira só a linha de membro: a conta e os eventos escritos pela pessoa ficam (ADM-07.8)', async () => {
  await addMembro(A, IDS.fora, 'assessoria');
  await dono(`insert into public.eventos (mandato_id, user_id, texto) values ($1, $2, 'escrito por fora')`, [A, IDS.fora]);
  await como(banco, IDS.admin);
  await chama('select public.admin_membro_remover($1, $2)', [A, IDS.fora]);
  assert.deepEqual((await membrosDe(A)).map((x) => x.user_id), [IDS.membro]);
  assert.equal((await dono('select 1 from auth.users where id = $1', [IDS.fora])).length, 1);
  assert.equal((await dono('select 1 from public.eventos where user_id = $1', [IDS.fora])).length, 1);
  const [linha] = await auditoria();
  assert.equal(linha.acao, 'membro.remover');
  assert.deepEqual(linha.detalhe, { codigo: 'AAA111', user_id: IDS.fora, nome: 'x', papel: 'assessoria' });
});

test('remover a última coordenação é recusado; pessoa que não é membro responde "Pessoa não encontrada." (ADM-07.9)', async () => {
  await como(banco, IDS.admin);
  await assert.rejects(chama('select public.admin_membro_remover($1, $2)', [A, IDS.membro]), ULTIMA_COORD);
  await assert.rejects(chama('select public.admin_membro_remover($1, $2)', [A, IDS.fora]), /Pessoa não encontrada\./);
  await assert.rejects(chama('select public.admin_membro_papel($1, $2, $3)', [A, IDS.fora, 'coordenacao']), /Pessoa não encontrada\./);
  assert.deepEqual((await membrosDe(A)).map((x) => x.user_id), [IDS.membro]);
  assert.equal((await auditoria()).length, 0);
});

test('arquivar grava arquivado_em, audita e os membros seguem acessando o mandato; desarquivar limpa (ADM-08.1, ADM-08.2)', async () => {
  await como(banco, IDS.admin);
  await chama('select public.admin_mandato_arquivar($1, true)', [A]);
  assert.ok((await dono<{ arquivado_em: string | null }>('select arquivado_em from public.mandatos where id = $1', [A]))[0].arquivado_em);
  await como(banco, IDS.membro);
  assert.deepEqual((await chama('select id from public.mandatos')).rows, [{ id: A }]);
  await como(banco, IDS.admin);
  await chama('select public.admin_mandato_arquivar($1, false)', [A]);
  assert.equal((await dono<{ arquivado_em: string | null }>('select arquivado_em from public.mandatos where id = $1', [A]))[0].arquivado_em, null);
  const linhas = await auditoria();
  assert.deepEqual(linhas.map((l) => [l.acao, l.alvo_tipo, l.alvo_id, l.detalhe]), [
    ['mandato.arquivar', 'mandato', A, { codigo: 'AAA111' }],
    ['mandato.desarquivar', 'mandato', A, { codigo: 'AAA111' }],
  ]);
});

test('arquivar e desarquivar não contam como atividade: atualizado_em fica como estava (ADM-05.8)', async () => {
  await comoDono(banco);
  await banco.exec('alter table public.mandatos disable trigger mandatos_touch');
  await banco.query(`update public.mandatos set atualizado_em = '2026-01-10T12:00:00Z' where id = $1`, [A]);
  await banco.exec('alter table public.mandatos enable trigger mandatos_touch');
  await como(banco, IDS.admin);
  await chama('select public.admin_mandato_arquivar($1, true)', [A]);
  await chama('select public.admin_mandato_arquivar($1, false)', [A]);
  const r = await dono<{ d: string }>(`select to_char(atualizado_em at time zone 'UTC', 'YYYY-MM-DD') d from public.mandatos where id = $1`, [A]);
  assert.equal(r[0].d, '2026-01-10');
});

test('excluir com código diferente é recusado e nada muda; arquivar mandato ausente também (ADM-08.3, ADM-08.4)', async () => {
  await como(banco, IDS.admin);
  await assert.rejects(chama('select public.admin_mandato_excluir($1, $2)', [A, 'aaa111']), /O código digitado não confere com o do mandato\./);
  await assert.rejects(chama('select public.admin_mandato_excluir($1, $2)', [A, null]), /O código digitado não confere/);
  await assert.rejects(chama('select public.admin_mandato_excluir($1, $2)', ['00000000-0000-4000-8000-00000000fffe', 'X']), /Mandato não encontrado\./);
  await assert.rejects(chama('select public.admin_mandato_arquivar($1, true)', ['00000000-0000-4000-8000-00000000fffe']), /Mandato não encontrado\./);
  assert.equal((await dono('select 1 from public.mandatos')).length, 2);
  assert.equal((await auditoria()).length, 0);
});

test('excluir com o código exato apaga em cascata, deixa sugestoes.mandato_id nulo e audita código e nome parlamentar (ADM-08.4, ADM-04.4)', async () => {
  await dono(`insert into public.eventos (mandato_id, texto) values ($1, 'e1')`, [A]);
  await dono(`insert into public.sugestoes (user_id, mandato_id, texto) values ($1, $2, 'sugestão do gabinete')`, [IDS.membro, A]);
  await como(banco, IDS.admin);
  await chama('select public.admin_mandato_excluir($1, $2)', [A, 'AAA111']);
  assert.deepEqual((await dono<{ id: string }>('select id from public.mandatos')).map((x) => x.id), [B]);
  assert.equal((await membrosDe(A)).length, 0);
  assert.equal((await dono('select 1 from public.eventos where mandato_id = $1', [A])).length, 0);
  assert.deepEqual(await dono('select mandato_id, texto from public.sugestoes'), [{ mandato_id: null, texto: 'sugestão do gabinete' }]);
  const [linha] = await auditoria();
  assert.equal(linha.acao, 'mandato.excluir');
  assert.equal(linha.alvo_id, A);
  assert.deepEqual(linha.detalhe, { codigo: 'AAA111', nome_parlamentar: 'Parlamentar Um' });
});

test('leitura, gabinete e conta de fora são recusados em todas as funções de escrita, e nada muda (ADM-02.7, ADM-08.5)', async () => {
  const chamadas: [string, unknown[]][] = [
    ['select public.admin_membro_adicionar($1, $2, $3)', [A, IDS.fora, 'assessoria']],
    ['select public.admin_membro_papel($1, $2, $3)', [A, IDS.membro, 'assessoria']],
    ['select public.admin_membro_remover($1, $2)', [A, IDS.membro]],
    ['select public.admin_mandato_arquivar($1, true)', [A]],
    ['select public.admin_mandato_excluir($1, $2)', [A, 'AAA111']],
  ];
  for (const quem of [IDS.leitura, IDS.membro, IDS.fora]) {
    await como(banco, quem);
    for (const [sql, args] of chamadas) await assert.rejects(chama(sql, args), SEM_PERMISSAO, `${quem} ${sql}`);
  }
  await como(banco, null);
  for (const [sql, args] of chamadas) await assert.rejects(chama(sql, args), /permission denied/);
  assert.equal((await dono('select 1 from public.mandatos where arquivado_em is null')).length, 2);
  assert.deepEqual((await membrosDe(A)).map((x) => x.user_id), [IDS.membro]);
  assert.equal((await auditoria()).length, 0);
});

test('gatilho: membro do gabinete não muda arquivado_em pela API, mas segue editando as outras colunas (ADM-08.1, risco do design)', async () => {
  await como(banco, IDS.membro);
  await assert.rejects(chama(`update public.mandatos set arquivado_em = now() where id = $1`, [A]), SEM_PERMISSAO);
  const ok = await chama(`update public.mandatos set cargo = 'Novo cargo' where id = $1`, [A]);
  assert.equal(ok.affectedRows, 1);
  await dono(`update public.mandatos set arquivado_em = now() where id = $1`, [A]);
  await como(banco, IDS.membro);
  await assert.rejects(chama(`update public.mandatos set arquivado_em = null where id = $1`, [A]), SEM_PERMISSAO);
  assert.ok((await dono<{ arquivado_em: string | null }>('select arquivado_em from public.mandatos where id = $1', [A]))[0].arquivado_em);
});

test('gatilho: admin da Legisla que também é membro pode arquivar direto; sem ser membro, o update direto não alcança linha alguma (ADM-08.5)', async () => {
  await como(banco, IDS.admin);
  const direto = await chama(`update public.mandatos set arquivado_em = now() where id = $1`, [A]);
  assert.equal(direto.affectedRows, 0);
  await addMembro(A, IDS.admin, 'assessoria');
  await como(banco, IDS.admin);
  const membro = await chama(`update public.mandatos set arquivado_em = now() where id = $1`, [A]);
  assert.equal(membro.affectedRows, 1);
});

test('falha ao gravar a auditoria desfaz cada ação: membros, arquivar e excluir (ADM-04.2)', async () => {
  await addMembro(A, IDS.fora, 'assessoria');
  await comoDono(banco);
  await banco.exec(`
    create function public.quebra_auditoria() returns trigger language plpgsql as $$ begin raise exception 'auditoria indisponível'; end; $$;
    create trigger falha_auditoria before insert on public.auditoria_admin for each row execute function public.quebra_auditoria();
  `);
  try {
    await como(banco, IDS.admin);
    for (const [sql, args] of [
      ['select public.admin_membro_adicionar($1, $2, $3)', [A, IDS.leitura, 'assessoria']],
      ['select public.admin_membro_papel($1, $2, $3)', [A, IDS.fora, 'coordenacao']],
      ['select public.admin_membro_remover($1, $2)', [A, IDS.fora]],
      ['select public.admin_mandato_arquivar($1, true)', [A]],
      ['select public.admin_mandato_excluir($1, $2)', [A, 'AAA111']],
    ] as [string, unknown[]][]) await assert.rejects(chama(sql, args), /auditoria indisponível/, sql);
    assert.deepEqual(await membrosDe(A), [{ user_id: IDS.membro, papel: 'coordenacao' }, { user_id: IDS.fora, papel: 'assessoria' }].sort((a, b) => (a.user_id < b.user_id ? -1 : 1)));
    assert.equal((await dono('select 1 from public.mandatos where arquivado_em is null')).length, 2);
  } finally {
    await comoDono(banco);
    await banco.exec('drop trigger falha_auditoria on public.auditoria_admin; drop function public.quebra_auditoria()');
  }
});
