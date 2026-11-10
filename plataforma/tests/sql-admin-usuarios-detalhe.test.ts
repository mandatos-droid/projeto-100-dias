// Aba Usuários: função do detalhe da pessoa (admin_usuario_detalhe), no PGlite com as migrations reais.
// Spec: .specs/features/admin-usuarios/spec.md (USR-02, USR-03).
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { criaBanco, como, comoDono, semente, IDS } from './sql-ambiente.ts';
import type { Banco } from './sql-ambiente.ts';

const NEGADO = /permission denied/;
const SEM_PERMISSAO = { code: '42501', message: /^Você não tem permissão para esta ação\.$/ };
const INEXISTENTE = '00000000-0000-4000-8000-0000000000ff';

interface Detalhe {
  id: string; nome: string | null; email: string | null; criado_em: string; ultimo_acesso: string | null
  equipe_papel: string | null
  perfil: { nome: string; nascimento: string; genero: string; raca: string; telefone: string; atua: boolean; tempo: string | null } | null
  consentimento: { versao: string; aceito_em: string } | null
  mandatos: { id: string; nome: string | null; cargo: string | null; uf: string | null; papel: string; arquivado: boolean }[]
}

let banco: Banco;
before(async () => { banco = await criaBanco(); });
after(async () => { await banco.close(); });

beforeEach(async () => {
  await comoDono(banco);
  await banco.exec('truncate public.eventos, public.membros, public.equipe_legisla, public.mandatos, auth.users cascade');
  await semente(banco);
});

const q = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) => (await banco.query<T>(sql, args)).rows;

interface Conta { email?: string | null; meta?: Record<string, unknown>; ultimo?: string | null; criado?: string | null }
async function conta(c: Conta = {}): Promise<string> {
  await comoDono(banco);
  const [{ id }] = await q<{ id: string }>(
    `insert into auth.users (email, raw_user_meta_data, last_sign_in_at, created_at)
     values ($1, $2::text::jsonb, $3::timestamptz, coalesce($4::timestamptz, now())) returning id`,
    [c.email === undefined ? 'pessoa@exemplo.com' : c.email, JSON.stringify(c.meta ?? {}), c.ultimo ?? null, c.criado ?? null]);
  return id;
}
interface Perfil { nome: string; nascimento: string; genero: string; raca: string; telefone: string; atua: boolean; tempo: string | null }
const PERFIL: Perfil = { nome: 'Joana Perfil Souza', nascimento: '1987-03-21', genero: 'mulher_trans', raca: 'preta', telefone: '21912345678', atua: true, tempo: '6_10' };
async function perfil(userId: string, p: Partial<Perfil> = {}) {
  const v = { ...PERFIL, ...p };
  await comoDono(banco);
  await banco.query(
    `insert into public.perfis (user_id, nome, nascimento, genero, raca, telefone, atua, tempo) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [userId, v.nome, v.nascimento, v.genero, v.raca, v.telefone, v.atua, v.tempo]);
}
async function consentimento(userId: string, versao: string, aceito: string) {
  await comoDono(banco);
  await banco.query(`insert into public.consentimentos (user_id, versao, aceito_em) values ($1, $2, $3::timestamptz)`, [userId, versao, aceito]);
}
async function membro(mandato: string, userId: string, papel: string) {
  await comoDono(banco);
  await banco.query(`insert into public.membros (mandato_id, user_id, nome, papel) values ($1, $2, 'Membro', $3)`, [mandato, userId, papel]);
}
async function detalhe(id: string, quem: string = IDS.admin): Promise<Detalhe | null> {
  await como(banco, quem);
  return (await q<{ r: Detalhe | null }>('select public.admin_usuario_detalhe($1::uuid) r', [id]))[0].r;
}
async function detalheOk(id: string, quem: string = IDS.admin): Promise<Detalhe> {
  const d = await detalhe(id, quem);
  assert.ok(d, `detalhe de ${id} veio nulo`);
  return d;
}

// pessoa completa: perfil, consentimento, dois mandatos (B arquivado)
async function completa() {
  const id = await conta({ email: 'joana@exemplo.com', meta: { name: 'Joana Conta', provider_token: 'token-secreto-123' },
    criado: '2026-01-02T03:04:05Z', ultimo: '2026-11-09T13:45:00Z' });
  await perfil(id);
  await consentimento(id, '2026-11', '2026-11-09T13:50:00Z');
  await membro(IDS.mandatoA, id, 'assessoria');
  await membro(IDS.mandatoB, id, 'leitura');
  await comoDono(banco);
  await banco.query('update public.mandatos set arquivado_em = now() where id = $1', [IDS.mandatoB]);
  return id;
}

// ---------- forma e cabeçalho (USR-02.2, USR-03.4) ----------

test('devolve só id, nome, email, criado_em, ultimo_acesso, equipe_papel, perfil, consentimento e mandatos, com os campos internos da spec (USR-02.2, USR-03.4)', async () => {
  const d = await detalheOk(await completa());
  assert.deepEqual(Object.keys(d).sort(), ['consentimento', 'criado_em', 'email', 'equipe_papel', 'id', 'mandatos', 'nome', 'perfil', 'ultimo_acesso']);
  assert.deepEqual(Object.keys(d.perfil!).sort(), ['atua', 'genero', 'nascimento', 'nome', 'raca', 'telefone', 'tempo']);
  assert.deepEqual(Object.keys(d.consentimento!).sort(), ['aceito_em', 'versao']);
  assert.equal(d.mandatos.length, 2);
  for (const m of d.mandatos) assert.deepEqual(Object.keys(m).sort(), ['arquivado', 'cargo', 'id', 'nome', 'papel', 'uf']);
});

test('não devolve metadados brutos da conta nem tokens (USR-03.4)', async () => {
  const texto = JSON.stringify(await detalheOk(await completa()));
  for (const vazado of ['token-secreto-123', 'provider_token', 'raw_user_meta_data', 'Joana Conta']) {
    assert.ok(!texto.includes(vazado), `vazou ${vazado}`);
  }
});

test('o cabeçalho traz id, nome do perfil, e-mail, data de cadastro e último login (USR-02.2)', async () => {
  const id = await completa();
  const d = await detalheOk(id);
  assert.equal(d.id, id);
  assert.equal(d.nome, 'Joana Perfil Souza');
  assert.equal(d.email, 'joana@exemplo.com');
  assert.equal(Date.parse(d.criado_em), Date.parse('2026-01-02T03:04:05Z'));
  assert.equal(Date.parse(d.ultimo_acesso!), Date.parse('2026-11-09T13:45:00Z'));
  assert.equal(d.equipe_papel, null);
});

test('equipe_papel traz o papel na equipe Legisla (admin ou leitura) (USR-02.2)', async () => {
  assert.equal((await detalheOk(IDS.admin)).equipe_papel, 'admin');
  assert.equal((await detalheOk(IDS.leitura)).equipe_papel, 'leitura');
});

test('sem login registrado, ultimo_acesso é nulo; conta sem e-mail devolve email nulo (USR-02.2, Edge Cases)', async () => {
  const id = await conta({ email: null, meta: { name: 'Sem Email' }, ultimo: null });
  const d = await detalheOk(id);
  assert.equal(d.ultimo_acesso, null);
  assert.equal(d.email, null);
  assert.equal(d.nome, 'Sem Email');
});

// ---------- perfil (USR-02.3, 02.4) ----------

test('com perfil traz nome completo, nascimento, gênero, raça, telefone, atua e tempo com os valores internos (USR-02.3)', async () => {
  const d = await detalheOk(await completa());
  assert.deepEqual(d.perfil, {
    nome: 'Joana Perfil Souza', nascimento: '1987-03-21', genero: 'mulher_trans', raca: 'preta',
    telefone: '21912345678', atua: true, tempo: '6_10',
  });
});

test('quem não atua na política tem atua falso e tempo nulo (USR-02.3)', async () => {
  const id = await conta();
  await perfil(id, { atua: false, tempo: null, genero: 'nao_informar', raca: 'nao_informar', telefone: '1133334444' });
  const d = await detalheOk(id);
  assert.equal(d.perfil?.atua, false);
  assert.equal(d.perfil?.tempo, null);
  assert.equal(d.perfil?.telefone, '1133334444');
});

test('sem perfil, perfil é nulo e o nome sai do cadastro da conta (USR-02.4)', async () => {
  const d = await detalheOk(IDS.fora);
  assert.equal(d.perfil, null);
  assert.equal(d.nome, 'Fabio Fora');
});

// ---------- consentimento (USR-02.5) ----------

test('consentimento traz a versão e a data do mais recente (USR-02.5)', async () => {
  const id = await conta();
  await consentimento(id, '2026-10', '2026-10-01T12:00:00Z');
  await consentimento(id, '2026-11', '2026-11-05T15:30:00Z');
  await consentimento(id, '2026-09', '2026-09-01T12:00:00Z');
  const d = await detalheOk(id);
  assert.equal(d.consentimento?.versao, '2026-11');
  assert.equal(Date.parse(d.consentimento!.aceito_em), Date.parse('2026-11-05T15:30:00Z'));
});

test('sem consentimento, consentimento é nulo (USR-02.5)', async () => {
  assert.equal((await detalheOk(IDS.fora)).consentimento, null);
});

// ---------- mandatos (USR-02.6, 02.7) ----------

test('mandatos traz id, nome do parlamentar, cargo, UF, papel e arquivado de cada mandato (USR-02.6)', async () => {
  const d = await detalheOk(await completa());
  assert.deepEqual([...d.mandatos].sort((x, y) => x.id.localeCompare(y.id)), [
    { id: IDS.mandatoA, nome: 'Parlamentar Um', cargo: 'Deputada Federal', uf: 'SP', papel: 'assessoria', arquivado: false },
    { id: IDS.mandatoB, nome: 'Parlamentar Dois', cargo: 'Deputado Estadual', uf: 'MG', papel: 'leitura', arquivado: true },
  ]);
});

test('quem não está em nenhum mandato tem a lista de mandatos vazia (USR-02.7)', async () => {
  assert.deepEqual((await detalheOk(IDS.fora)).mandatos, []);
});

// ---------- id inexistente (USR-02.10) ----------

test('id inexistente devolve null, sem erro (USR-02.10)', async () => {
  assert.equal(await detalhe(INEXISTENTE), null);
});

// ---------- permissão e leitura (USR-03.1, 03.2, 03.3, 03.5) ----------

test('leitura da equipe Legisla lê o detalhe igual ao admin (USR-03.1)', async () => {
  const id = await completa();
  assert.deepEqual(await detalheOk(id, IDS.leitura), await detalheOk(id, IDS.admin));
});

test('quem não está em equipe_legisla recebe "Você não tem permissão para esta ação." com erro 42501, até sobre si mesmo (USR-03.2)', async () => {
  await perfil(IDS.fora);
  for (const quem of [IDS.fora, IDS.membro]) {
    await assert.rejects(detalhe(IDS.fora, quem), SEM_PERMISSAO, quem);
    await assert.rejects(detalhe(INEXISTENTE, quem), SEM_PERMISSAO, `${quem}, id inexistente`);
  }
});

test('a função lê equipe_legisla a cada chamada: quem sai da equipe deixa de ler na hora (USR-03.1)', async () => {
  assert.equal((await detalheOk(IDS.fora, IDS.leitura)).id, IDS.fora);
  await comoDono(banco);
  await banco.query('delete from public.equipe_legisla where user_id = $1', [IDS.leitura]);
  await assert.rejects(detalhe(IDS.fora, IDS.leitura), SEM_PERMISSAO);
});

test('anon não executa admin_usuario_detalhe (USR-03.3)', async () => {
  await como(banco, null);
  await assert.rejects(banco.query('select public.admin_usuario_detalhe($1::uuid)', [IDS.fora]), NEGADO);
  await comoDono(banco);
  assert.deepEqual(await q(`select has_function_privilege('anon', 'public.admin_usuario_detalhe(uuid)', 'execute') a`), [{ a: false }]);
});

test('admin_usuario_detalhe é stable, então não grava nada (USR-03.5)', async () => {
  await comoDono(banco);
  assert.deepEqual(await q(`select p.provolatile v from pg_proc p where p.oid = 'public.admin_usuario_detalhe(uuid)'::regprocedure`), [{ v: 's' }]);
});
