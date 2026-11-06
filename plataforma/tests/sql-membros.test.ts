// Acesso, equipe e convites: funções de equipe do mandato (ACE-03, ACE-04, ACE-06), no PGlite.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { criaBanco, como, comoDono, semente, IDS } from './sql-ambiente.ts';
import type { Banco } from './sql-ambiente.ts';

// Mandato A: IDS.membro (coordenação), ASSESSORIA e LEITOR. Mandato B: COORD_B.
const ASSESSORIA = '00000000-0000-4000-8000-0000000000c1';
const LEITOR = '00000000-0000-4000-8000-0000000000c2';
const COORD_B = '00000000-0000-4000-8000-0000000000c3';
const SEM_PERMISSAO = { code: '42501', message: /Você não tem permissão para esta ação\./ };
const ULTIMA_COORDENACAO = { message: /^O mandato precisa ter ao menos uma pessoa na coordenação\.$/ };

let banco: Banco;
before(async () => { banco = await criaBanco(); });
after(async () => { await banco.close(); });

beforeEach(async () => {
  await comoDono(banco);
  await banco.exec('drop trigger if exists falha_historico on public.eventos_equipe');
  await banco.exec('truncate public.eventos, public.membros, public.equipe_legisla, public.mandatos, auth.users cascade');
  await semente(banco);
  await banco.query(
    `insert into auth.users (id, email, raw_user_meta_data) values
       ($1, 'assessoria@gabinete.leg.br', '{"name":"Alice Assessoria"}'),
       ($2, 'leitor@gabinete.leg.br',     '{"name":"Leo Leitor"}'),
       ($3, 'coord@outro.leg.br',         '{"name":"Bia Coord"}')`,
    [ASSESSORIA, LEITOR, COORD_B],
  );
  await banco.query(`update public.membros set criado_em = '2026-01-01T12:00:00Z' where user_id = $1`, [IDS.membro]);
  await banco.query(
    `insert into public.membros (mandato_id, user_id, nome, papel, criado_em) values
       ($1, $3, 'Alice Assessoria', 'assessoria',  '2026-01-02T12:00:00Z'),
       ($1, $4, 'Leo Leitor',       'leitura',     '2026-01-03T12:00:00Z'),
       ($2, $5, 'Bia Coord',        'coordenacao', '2026-01-01T12:00:00Z')`,
    [IDS.mandatoA, IDS.mandatoB, ASSESSORIA, LEITOR, COORD_B],
  );
});

const q = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) => (await banco.query<T>(sql, args)).rows;
// estado de membros do mandato A como o dono vê
const papeisA = async () => {
  await comoDono(banco);
  return Object.fromEntries((await q<{ user_id: string; papel: string }>(
    'select user_id, papel from public.membros where mandato_id = $1', [IDS.mandatoA])).map((x) => [x.user_id, x.papel]));
};
const historico = async () => {
  await comoDono(banco);
  return q<Record<string, unknown>>(
    'select mandato_id, ator_id, ator_nome, tipo, alvo_id, alvo_nome, papel from public.eventos_equipe order by id');
};
const totais = async () => {
  await comoDono(banco);
  return (await q<{ eventos: number; legisla: number }>(
    'select (select count(*)::int from public.eventos) eventos, (select count(*)::int from public.equipe_legisla) legisla'))[0];
};
const trocar = (user: string, papel: string, mandato: string = IDS.mandatoA) =>
  banco.query('select public.membro_trocar_papel($1, $2, $3)', [mandato, user, papel]);
const quebraHistorico = async () => {
  await comoDono(banco);
  await banco.exec(`
    create or replace function public.quebra_historico() returns trigger language plpgsql as $$ begin raise exception 'histórico indisponível'; end; $$;
    create trigger falha_historico before insert on public.eventos_equipe for each row execute function public.quebra_historico();
  `);
};
const ESTADO_INICIAL = { [IDS.membro]: 'coordenacao', [ASSESSORIA]: 'assessoria', [LEITOR]: 'leitura' };

// ---------- T3: membro_trocar_papel ----------

test('coordenação troca o papel de outro membro e a mudança vale na chamada seguinte (ACE-03.4)', async () => {
  await como(banco, IDS.membro);
  await trocar(LEITOR, 'assessoria');
  assert.equal((await papeisA())[LEITOR], 'assessoria');
  // promovido de leitura para assessoria: já grava no mandato na chamada seguinte
  await como(banco, LEITOR);
  assert.equal((await banco.query(`update public.mandatos set nome_parlamentar = 'Editado' where id = $1`, [IDS.mandatoA])).affectedRows, 1);
  // promovida à coordenação: já troca papéis na chamada seguinte
  await como(banco, IDS.membro);
  await trocar(ASSESSORIA, 'coordenacao');
  await como(banco, ASSESSORIA);
  await trocar(LEITOR, 'leitura');
  assert.deepEqual(await papeisA(), { [IDS.membro]: 'coordenacao', [ASSESSORIA]: 'coordenacao', [LEITOR]: 'leitura' });
});

test('assessoria e leitura recebem erro de permissão ao trocar papel, inclusive o próprio, e nada muda (ACE-03.6)', async () => {
  for (const quem of [ASSESSORIA, LEITOR]) {
    await como(banco, quem);
    await assert.rejects(trocar(quem, 'coordenacao'), SEM_PERMISSAO, quem);
    await assert.rejects(trocar(IDS.membro, 'leitura'), SEM_PERMISSAO, quem);
  }
  assert.deepEqual(await papeisA(), ESTADO_INICIAL);
  assert.deepEqual(await historico(), []);
});

test('coordenação de outro mandato, equipe Legisla e conta de fora recebem erro de permissão e nada muda (ACE-03.6, ACE-03.10)', async () => {
  for (const quem of [COORD_B, IDS.admin, IDS.fora]) {
    await como(banco, quem);
    await assert.rejects(trocar(LEITOR, 'coordenacao'), SEM_PERMISSAO, quem);
  }
  assert.deepEqual(await papeisA(), ESTADO_INICIAL);
  assert.deepEqual(await historico(), []);
  assert.deepEqual(await totais(), { eventos: 0, legisla: 2 });
});

test('rebaixar a última coordenação recusa com a mensagem da spec e nada muda (ACE-03.7)', async () => {
  await como(banco, IDS.membro);
  for (const papel of ['assessoria', 'leitura']) {
    await assert.rejects(trocar(IDS.membro, papel), ULTIMA_COORDENACAO, papel);
  }
  assert.deepEqual(await papeisA(), ESTADO_INICIAL);
  assert.deepEqual(await historico(), []);
});

test('duas coordenações em sequência: a primeira ação passa e a segunda é recusada pela regra da coordenação (ACE-03.8)', async () => {
  await comoDono(banco);
  await banco.query(`update public.membros set papel = 'coordenacao' where user_id = $1`, [ASSESSORIA]);
  // cada uma rebaixa a si mesma: a segunda seria a última coordenação
  await como(banco, IDS.membro);
  await trocar(IDS.membro, 'assessoria');
  await como(banco, ASSESSORIA);
  await assert.rejects(trocar(ASSESSORIA, 'assessoria'), ULTIMA_COORDENACAO);
  assert.deepEqual(await papeisA(), { [IDS.membro]: 'assessoria', [ASSESSORIA]: 'coordenacao', [LEITOR]: 'leitura' });
  // cada uma rebaixa a outra: a segunda já não é coordenação quando chega
  await comoDono(banco);
  await banco.query(`update public.membros set papel = 'coordenacao' where user_id = $1`, [IDS.membro]);
  await como(banco, IDS.membro);
  await trocar(ASSESSORIA, 'assessoria');
  await como(banco, ASSESSORIA);
  await assert.rejects(trocar(IDS.membro, 'assessoria'), SEM_PERMISSAO);
  assert.deepEqual(await papeisA(), ESTADO_INICIAL);
});

test('membro_trocar_papel trava as linhas de membros do mandato com for update antes de contar coordenações (ACE-03.8)', async () => {
  await comoDono(banco);
  const [{ src }] = await q<{ src: string }>(`select prosrc src from pg_proc where proname = 'membro_trocar_papel'`);
  const trava = src.search(/from public\.membros b where b\.mandato_id = p_mandato for update/);
  assert.ok(trava >= 0, 'sem for update nas linhas do mandato');
  assert.ok(trava < src.indexOf('papel_no_mandato'), 'a trava precisa vir antes de ler o papel');
  assert.ok(trava < src.indexOf("b.papel = 'coordenacao'"), 'a trava precisa vir antes de contar coordenações');
});

test('a troca grava papel_trocado com ator, alvo e papel, e nenhuma linha em eventos (ACE-06.2, ACE-06.5)', async () => {
  await como(banco, IDS.membro);
  await trocar(LEITOR, 'assessoria');
  await como(banco, IDS.membro);
  await assert.rejects(trocar(IDS.fora, 'leitura'), /Pessoa não encontrada\./);
  assert.deepEqual(await historico(), [{
    mandato_id: IDS.mandatoA, ator_id: IDS.membro, ator_nome: 'Mario Membro', tipo: 'papel_trocado',
    alvo_id: LEITOR, alvo_nome: 'Leo Leitor', papel: 'assessoria',
  }]);
  assert.equal((await totais()).eventos, 0);
});

test('se a gravação do histórico falhar, a troca de papel é desfeita (ACE-06.3)', async () => {
  await quebraHistorico();
  await como(banco, IDS.membro);
  await assert.rejects(trocar(LEITOR, 'assessoria'), /histórico indisponível/);
  assert.deepEqual(await papeisA(), ESTADO_INICIAL);
});

test('anon não executa membro_trocar_papel', async () => {
  await como(banco, null);
  await assert.rejects(trocar(LEITOR, 'coordenacao'), /permission denied/);
  assert.deepEqual(await papeisA(), ESTADO_INICIAL);
});

// ---------- T4: membro_remover ----------

const remover = (user: string, mandato: string = IDS.mandatoA) =>
  banco.query('select public.membro_remover($1, $2)', [mandato, user]);

test('coordenação remove outro membro: ele sai do mandato e a conta em auth.users permanece (ACE-03.5)', async () => {
  await comoDono(banco);
  await banco.query(`insert into public.eventos (mandato_id, user_id, autor, texto) values ($1, $2, 'Leo Leitor', 'escrito pelo Leo')`, [IDS.mandatoA, LEITOR]);
  await como(banco, IDS.membro);
  await remover(LEITOR);
  assert.deepEqual(await papeisA(), { [IDS.membro]: 'coordenacao', [ASSESSORIA]: 'assessoria' });
  await comoDono(banco);
  assert.deepEqual(await q('select email from auth.users where id = $1', [LEITOR]), [{ email: 'leitor@gabinete.leg.br' }]);
  assert.deepEqual(await q('select user_id, texto from public.eventos'), [{ user_id: LEITOR, texto: 'escrito pelo Leo' }]);
  // fora do mandato, a pessoa deixa de ver o mandato
  await como(banco, LEITOR);
  assert.deepEqual(await q('select id from public.mandatos'), []);
});

test('assessoria e leitura recebem erro de permissão ao remover, e nada muda (ACE-03.6)', async () => {
  await como(banco, ASSESSORIA);
  await assert.rejects(remover(LEITOR), SEM_PERMISSAO);
  await assert.rejects(remover(IDS.membro), SEM_PERMISSAO);
  await como(banco, LEITOR);
  await assert.rejects(remover(ASSESSORIA), SEM_PERMISSAO);
  assert.deepEqual(await papeisA(), ESTADO_INICIAL);
  assert.deepEqual(await historico(), []);
});

test('coordenação de outro mandato, equipe Legisla e conta de fora recebem erro de permissão ao remover, e nada muda (ACE-03.6, ACE-03.10)', async () => {
  for (const quem of [COORD_B, IDS.admin, IDS.fora]) {
    await como(banco, quem);
    await assert.rejects(remover(LEITOR), SEM_PERMISSAO, quem);
  }
  assert.deepEqual(await papeisA(), ESTADO_INICIAL);
  assert.deepEqual(await historico(), []);
  assert.deepEqual(await totais(), { eventos: 0, legisla: 2 });
});

test('remover a última coordenação recusa com a mensagem da spec e nada muda (ACE-03.7)', async () => {
  await como(banco, IDS.membro);
  await assert.rejects(remover(IDS.membro), ULTIMA_COORDENACAO);
  assert.deepEqual(await papeisA(), ESTADO_INICIAL);
  assert.deepEqual(await historico(), []);
});

test('duas coordenações que se removem em sequência: a primeira passa, a segunda já não tem permissão (ACE-03.8)', async () => {
  await comoDono(banco);
  await banco.query(`update public.membros set papel = 'coordenacao' where user_id = $1`, [ASSESSORIA]);
  await como(banco, IDS.membro);
  await remover(ASSESSORIA);
  await como(banco, ASSESSORIA);
  await assert.rejects(remover(IDS.membro), SEM_PERMISSAO);
  assert.deepEqual(await papeisA(), { [IDS.membro]: 'coordenacao', [LEITOR]: 'leitura' });
  await comoDono(banco);
  const [{ src }] = await q<{ src: string }>(`select prosrc src from pg_proc where proname = 'membro_remover'`);
  const trava = src.search(/from public\.membros b where b\.mandato_id = p_mandato for update/);
  assert.ok(trava >= 0 && trava < src.indexOf('papel_no_mandato') && trava < src.indexOf("b.papel = 'coordenacao'"), 'trava antes de ler papel e contar');
});

test('a remoção grava membro_removido com ator, alvo e papel, e nenhuma linha em eventos (ACE-06.2, ACE-06.5)', async () => {
  await como(banco, IDS.membro);
  await remover(ASSESSORIA);
  await como(banco, IDS.membro);
  await assert.rejects(remover(IDS.fora), /Pessoa não encontrada\./);
  assert.deepEqual(await historico(), [{
    mandato_id: IDS.mandatoA, ator_id: IDS.membro, ator_nome: 'Mario Membro', tipo: 'membro_removido',
    alvo_id: ASSESSORIA, alvo_nome: 'Alice Assessoria', papel: 'assessoria',
  }]);
  assert.equal((await totais()).eventos, 0);
});

test('se a gravação do histórico falhar, a remoção é desfeita (ACE-06.3)', async () => {
  await quebraHistorico();
  await como(banco, IDS.membro);
  await assert.rejects(remover(LEITOR), /histórico indisponível/);
  assert.deepEqual(await papeisA(), ESTADO_INICIAL);
});

test('anon não executa membro_remover', async () => {
  await como(banco, null);
  await assert.rejects(remover(LEITOR), /permission denied/);
  assert.deepEqual(await papeisA(), ESTADO_INICIAL);
});

// ---------- T5: membro_sair e fim da exclusão direta ----------

const sair = (mandato: string = IDS.mandatoA) => banco.query('select public.membro_sair($1)', [mandato]);

test('membro sai por conta própria e deixa membros; coordenação sai quando há outra coordenação (ACE-03.9)', async () => {
  await como(banco, ASSESSORIA);
  await sair();
  assert.deepEqual(await papeisA(), { [IDS.membro]: 'coordenacao', [LEITOR]: 'leitura' });
  await como(banco, ASSESSORIA);
  assert.deepEqual(await q('select id from public.mandatos'), []);
  await comoDono(banco);
  await banco.query(`update public.membros set papel = 'coordenacao' where user_id = $1`, [LEITOR]);
  await como(banco, IDS.membro);
  await sair();
  assert.deepEqual(await papeisA(), { [LEITOR]: 'coordenacao' });
});

test('a última coordenação que tenta sair recebe a recusa da spec e continua no mandato (ACE-03.7, borda)', async () => {
  await como(banco, IDS.membro);
  await assert.rejects(sair(), ULTIMA_COORDENACAO);
  assert.deepEqual(await papeisA(), ESTADO_INICIAL);
  assert.deepEqual(await historico(), []);
});

test('delete direto em membros falha por falta de permissão, inclusive da própria linha (ACE-03.7)', async () => {
  for (const quem of [ASSESSORIA, IDS.membro]) {
    await como(banco, quem);
    await assert.rejects(banco.query('delete from public.membros where user_id = $1', [quem]), /permission denied/, quem);
  }
  await como(banco, IDS.membro);
  await assert.rejects(banco.query('delete from public.membros where user_id = $1', [LEITOR]), /permission denied/);
  assert.deepEqual(await papeisA(), ESTADO_INICIAL);
});

test('excluir_meus_dados() ainda tira a pessoa de membros (regressão)', async () => {
  await como(banco, LEITOR);
  await banco.query('select public.excluir_meus_dados()');
  assert.deepEqual(await papeisA(), { [IDS.membro]: 'coordenacao', [ASSESSORIA]: 'assessoria' });
});

test('sair grava membro_saiu com a própria pessoa como ator e alvo, e nenhuma linha em eventos (ACE-06.2, ACE-06.5)', async () => {
  await como(banco, ASSESSORIA);
  await sair();
  await como(banco, IDS.fora);
  await assert.rejects(sair(), SEM_PERMISSAO);
  assert.deepEqual(await historico(), [{
    mandato_id: IDS.mandatoA, ator_id: ASSESSORIA, ator_nome: 'Alice Assessoria', tipo: 'membro_saiu',
    alvo_id: ASSESSORIA, alvo_nome: 'Alice Assessoria', papel: 'assessoria',
  }]);
  assert.equal((await totais()).eventos, 0);
});

test('se a gravação do histórico falhar, a saída é desfeita (ACE-06.2, ACE-06.3)', async () => {
  await quebraHistorico();
  await como(banco, ASSESSORIA);
  await assert.rejects(sair(), /histórico indisponível/);
  assert.deepEqual(await papeisA(), ESTADO_INICIAL);
});

test('membro_sair trava as linhas do mandato antes de contar coordenações, e anon não executa (ACE-03.8)', async () => {
  await comoDono(banco);
  const [{ src }] = await q<{ src: string }>(`select prosrc src from pg_proc where proname = 'membro_sair'`);
  const trava = src.search(/from public\.membros b where b\.mandato_id = p_mandato for update/);
  assert.ok(trava >= 0 && trava < src.indexOf('papel_no_mandato') && trava < src.indexOf("b.papel = 'coordenacao'"), 'trava antes de ler papel e contar');
  await como(banco, null);
  await assert.rejects(sair(), /permission denied/);
  assert.deepEqual(await papeisA(), ESTADO_INICIAL);
});

// ---------- T6: equipe_do_mandato ----------

const equipeDo = (mandato: string = IDS.mandatoA) => banco.query('select * from public.equipe_do_mandato($1)', [mandato]);

test('membro, em qualquer papel, recebe as pessoas do mandato com nome, e-mail e papel, da entrada mais antiga para a mais recente (ACE-04.6)', async () => {
  await comoDono(banco);
  // a ordem de entrada não é a ordem de inserção: o leitor entrou primeiro
  await banco.query(`update public.membros set criado_em = '2025-12-31T12:00:00Z' where user_id = $1`, [LEITOR]);
  for (const quem of [IDS.membro, ASSESSORIA, LEITOR]) {
    await como(banco, quem);
    const r = (await equipeDo()).rows as { user_id: string; nome: string; email: string; papel: string; criado_em: Date }[];
    assert.deepEqual(r.map((x) => [x.user_id, x.nome, x.email, x.papel, x.criado_em.toISOString()]), [
      [LEITOR, 'Leo Leitor', 'leitor@gabinete.leg.br', 'leitura', '2025-12-31T12:00:00.000Z'],
      [IDS.membro, 'Mario Membro', 'membro@gabinete.leg.br', 'coordenacao', '2026-01-01T12:00:00.000Z'],
      [ASSESSORIA, 'Alice Assessoria', 'assessoria@gabinete.leg.br', 'assessoria', '2026-01-02T12:00:00.000Z'],
    ], quem);
  }
});

test('quem não é membro do mandato recebe erro de permissão e nenhum e-mail (ACE-04.6)', async () => {
  for (const quem of [COORD_B, IDS.admin, IDS.fora]) {
    await como(banco, quem);
    await assert.rejects(equipeDo(), SEM_PERMISSAO, quem);
  }
});

test('anon não executa equipe_do_mandato', async () => {
  await como(banco, null);
  await assert.rejects(equipeDo(), /permission denied/);
});

test('equipe_do_mandato devolve só as cinco colunas do design', async () => {
  await como(banco, LEITOR);
  const r = await equipeDo();
  assert.deepEqual(r.fields.map((f) => f.name), ['user_id', 'nome', 'email', 'papel', 'criado_em']);
  assert.deepEqual(Object.keys(r.rows[0] as object), ['user_id', 'nome', 'email', 'papel', 'criado_em']);
});
