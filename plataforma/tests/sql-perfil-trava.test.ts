// Primeiro acesso: o banco barra as duas portas de entrada em um mandato para quem não tem perfil
// (convite_aceitar e a política mandatos_criar) e apaga o perfil com os dados da pessoa (PAG-02, PAG-03), no PGlite.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { criaBanco, como, comoDono, semente, IDS } from './sql-ambiente.ts';
import type { Banco } from './sql-ambiente.ts';

// Carlos: conta nova, fora de mandato e da equipe Legisla. Mandato A: IDS.membro (coordenação).
const CARLOS = '00000000-0000-4000-8000-0000000000d1';
const RLS = { code: '42501', message: /row-level security/ };

let banco: Banco;
before(async () => { banco = await criaBanco(); });
after(async () => { await banco.close(); });

beforeEach(async () => {
  await comoDono(banco);
  await banco.query("select set_config('request.headers', '', false)");
  await banco.exec(`truncate public.eventos, public.membros, public.equipe_legisla, public.mandatos, auth.users,
                    public.convites, public.convite_tentativas, public.convite_bloqueios cascade`);
  await semente(banco);
  await banco.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, 'carlos@exemplo.com', '{"name":"Carlos Lima"}')`, [CARLOS]);
});

const q = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) => (await banco.query<T>(sql, args)).rows;

const consente = async (id: string) => {
  await comoDono(banco);
  await banco.query(`insert into public.consentimentos (user_id, versao) values ($1, '2026-10')`, [id]);
};
// convite de assessoria para o mandato A, criado pela coordenação
const convite = async (token: string, email: string | null = null) => {
  await comoDono(banco);
  await banco.query(
    `insert into public.convites (mandato_id, token_hash, nome, email, papel, criado_por, criado_por_nome, expira_em)
     values ($1, sha256(convert_to($2, 'UTF8')), 'Carlos Lima', $3, 'assessoria', $4, 'Mario Membro', now() + interval '7 days')`,
    [IDS.mandatoA, token, email, IDS.membro]);
};
const aceitar = async (token: string) =>
  (await q<{ r: Record<string, unknown> }>('select public.convite_aceitar($1, null) r', [token]))[0].r;
const salvarPerfil = async () =>
  (await q<{ r: Record<string, unknown> }>(
    `select public.perfil_salvar('Carlos Lima', '1990-05-17', 'homem_cis', 'parda', '11987654321', true, '3_5') r`))[0].r;
const membrosA = async () => {
  await comoDono(banco);
  return Object.fromEntries((await q<{ user_id: string; papel: string }>(
    'select user_id, papel from public.membros where mandato_id = $1', [IDS.mandatoA])).map((x) => [x.user_id, x.papel]));
};
const usado = async (token: string) => {
  await comoDono(banco);
  return (await q<{ usado: boolean }>(
    `select usado_em is not null usado from public.convites where token_hash = sha256(convert_to($1, 'UTF8'))`, [token]))[0].usado;
};
const historico = async () => {
  await comoDono(banco);
  return (await q<{ tipo: string }>('select tipo from public.eventos_equipe order by id')).map((x) => x.tipo);
};
const criaMandato = (codigo: string, criadoPor: string) => q<{ id: string }>(
  `insert into public.mandatos (codigo, nome_parlamentar, cargo, uf, criado_por) values ($1, 'Parlamentar Novo', 'Vereadora', 'RJ', $2)
   returning id`, [codigo, criadoPor]);
const mandatosComCodigo = async (codigo: string) => {
  await comoDono(banco);
  return (await q<{ n: number }>('select count(*)::int n from public.mandatos where codigo = $1', [codigo]))[0].n;
};
const perfisDe = async (...ids: string[]) => {
  await comoDono(banco);
  return (await q<{ user_id: string }>('select user_id from public.perfis where user_id = any($1::uuid[]) order by user_id', [ids]))
    .map((x) => x.user_id);
};
const MEMBROS_A = { [IDS.membro]: 'coordenacao' };

// ---------- convite_aceitar ----------

test('sem perfil e fora da equipe Legisla, o aceite devolve {ok:false, erro:"perfil"}: ninguém entra, o convite segue válido e nada vai ao histórico (PAG-02.2)', async () => {
  await consente(CARLOS);
  await convite('para-carlos');
  await como(banco, CARLOS);
  assert.deepEqual(await aceitar('para-carlos'), { ok: false, erro: 'perfil' });
  assert.deepEqual(await membrosA(), MEMBROS_A);
  assert.equal(await usado('para-carlos'), false);
  assert.deepEqual(await historico(), []);
});

test('a checagem de perfil vem logo depois da de consentimento: já membro, e-mail diferente e falta de consentimento respondem antes (PAG-02.2)', async () => {
  await convite('com-email', 'outra.pessoa@exemplo.com');
  await convite('sem-email');
  await como(banco, CARLOS);
  assert.deepEqual(await aceitar('com-email'), { ok: false, erro: 'email' });
  await como(banco, CARLOS);
  assert.deepEqual(await aceitar('sem-email'), { ok: false, erro: 'consentimento' });
  // quem já é membro e não tem perfil continua recebendo ja_membro, sem consumir o convite
  await como(banco, IDS.membro);
  assert.deepEqual(await aceitar('sem-email'), { ok: true, mandato_id: IDS.mandatoA, ja_membro: true });
  assert.equal(await usado('sem-email'), false);
  assert.equal(await usado('com-email'), false);
});

test('gravado o perfil por perfil_salvar, o mesmo convite é aceito: o consentimento 2026-11 do perfil vale para o aceite (PAG-02.12, PAG-04.8)', async () => {
  await convite('para-carlos');
  await como(banco, CARLOS);
  assert.deepEqual(await aceitar('para-carlos'), { ok: false, erro: 'consentimento' });
  await como(banco, CARLOS);
  assert.deepEqual(await salvarPerfil(), { ok: true });
  await como(banco, CARLOS);
  assert.deepEqual(await aceitar('para-carlos'), { ok: true, mandato_id: IDS.mandatoA, ja_membro: false });
  assert.deepEqual(await membrosA(), { ...MEMBROS_A, [CARLOS]: 'assessoria' });
  assert.equal(await usado('para-carlos'), true);
  assert.deepEqual(await historico(), ['convite_aceito']);
});

test('quem está na equipe Legisla aceita o convite sem perfil (PAG-02.16)', async () => {
  await consente(IDS.leitura);
  await convite('para-lia');
  await como(banco, IDS.leitura);
  assert.deepEqual(await aceitar('para-lia'), { ok: true, mandato_id: IDS.mandatoA, ja_membro: false });
  assert.deepEqual(await membrosA(), { ...MEMBROS_A, [IDS.leitura]: 'assessoria' });
  assert.deepEqual(await perfisDe(IDS.leitura), []);
});

// ---------- política mandatos_criar ----------

test('sem perfil e fora da equipe Legisla, criar mandato dá erro de permissão e nada é gravado (PAG-02.2)', async () => {
  await como(banco, IDS.fora);
  await assert.rejects(criaMandato('CCC333', IDS.fora), RLS);
  assert.equal(await mandatosComCodigo('CCC333'), 0);
});

test('com perfil, a pessoa cria o mandato e entra como coordenação, como o Guia faz (PAG-02.2, PAG-04.7)', async () => {
  await como(banco, IDS.fora);
  assert.deepEqual(await salvarPerfil(), { ok: true });
  await como(banco, IDS.fora);
  const [{ id }] = await criaMandato('CCC333', IDS.fora);
  await banco.query(`insert into public.membros (mandato_id, user_id, papel, nome) values ($1, $2, 'coordenacao', 'Fabio Fora')`, [id, IDS.fora]);
  assert.deepEqual(await q('select private.papel_no_mandato($1) p', [id]), [{ p: 'coordenacao' }]);
});

test('com perfil, criar mandato em nome de outra pessoa continua recusado: a política exige perfil além de criado_por igual à sessão (PAG-02.2)', async () => {
  await como(banco, IDS.fora);
  await salvarPerfil();
  await como(banco, IDS.fora);
  await assert.rejects(criaMandato('CCC333', IDS.membro), RLS);
  assert.equal(await mandatosComCodigo('CCC333'), 0);
});

test('quem está na equipe Legisla cria mandato sem perfil (PAG-02.16)', async () => {
  await como(banco, IDS.admin);
  await criaMandato('DDD444', IDS.admin);
  assert.equal(await mandatosComCodigo('DDD444'), 1);
});

// ---------- exclusão ----------

test('excluir_meus_dados apaga o perfil de quem chama e não o de outra pessoa (PAG-03.10)', async () => {
  for (const quem of [IDS.fora, CARLOS]) {
    await como(banco, quem);
    await salvarPerfil();
  }
  await como(banco, IDS.fora);
  await banco.query('select public.excluir_meus_dados()');
  assert.deepEqual(await perfisDe(IDS.fora, CARLOS), [CARLOS]);
  await como(banco, IDS.fora);
  assert.deepEqual(await q('select private.tem_perfil() t'), [{ t: false }]);
});

test('excluir_meus_dados mantém o que já fazia: autoria dos eventos vira "usuário removido", sai de membros, apaga consentimentos e zera papel_ao_sair (PAG-03.10)', async () => {
  await comoDono(banco);
  await banco.query(`insert into public.eventos (mandato_id, user_id, autor, texto) values ($1, $2, 'Mario Membro', 'anotação')`, [IDS.mandatoA, IDS.membro]);
  await banco.query(
    `insert into public.convites (mandato_id, token_hash, nome, papel, criado_por, criado_por_nome, expira_em, papel_ao_sair)
     values ($1, sha256(convert_to('de-mario', 'UTF8')), 'Reserva', 'leitura', $2, 'Mario Membro', now() + interval '7 days', 'coordenacao')`,
    [IDS.mandatoA, IDS.membro]);
  await como(banco, IDS.membro);
  await salvarPerfil();
  await como(banco, IDS.membro);
  await banco.query('select public.excluir_meus_dados()');
  await comoDono(banco);
  assert.deepEqual(await q('select user_id, autor from public.eventos'), [{ user_id: null, autor: 'usuário removido' }]);
  assert.deepEqual(await q('select papel_ao_sair from public.convites'), [{ papel_ao_sair: null }]);
  assert.deepEqual(await q('select 1 from public.membros where user_id = $1', [IDS.membro]), []);
  assert.deepEqual(await q('select 1 from public.consentimentos where user_id = $1', [IDS.membro]), []);
  assert.deepEqual(await perfisDe(IDS.membro), []);
});

test('excluir a conta apaga o perfil em cascata (PAG-03.9)', async () => {
  for (const quem of [IDS.fora, CARLOS]) {
    await como(banco, quem);
    await salvarPerfil();
  }
  await comoDono(banco);
  await banco.query('delete from auth.users where id = $1', [IDS.fora]);
  assert.deepEqual(await perfisDe(IDS.fora, CARLOS), [CARLOS]);
});
