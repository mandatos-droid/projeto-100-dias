// Aba Usuários: função da lista (admin_usuarios), no PGlite com as migrations reais.
// Spec: .specs/features/admin-usuarios/spec.md (USR-01, USR-03, USR-04 e Edge Cases).
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { criaBanco, como, comoDono, semente, IDS } from './sql-ambiente.ts';
import type { Banco } from './sql-ambiente.ts';

const NEGADO = /permission denied/;
const SEM_PERMISSAO = { code: '42501', message: /^Você não tem permissão para esta ação\.$/ };

interface Mandato { id: string; nome: string | null; papel: string; arquivado: boolean }
interface Linha {
  id: string; nome: string | null; email: string | null; criado_em: string; ultimo_acesso: string | null
  sem_perfil: boolean; equipe_papel: string | null; mandatos: Mandato[]
}
interface Resultado { total: number; linhas: Linha[] }

let banco: Banco;
before(async () => { banco = await criaBanco(); });
after(async () => { await banco.close(); });

beforeEach(async () => {
  await comoDono(banco);
  await banco.exec('truncate public.eventos, public.membros, public.equipe_legisla, public.mandatos, auth.users cascade');
  await semente(banco);
});

const q = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) => (await banco.query<T>(sql, args)).rows;

let seq = 0;
interface Conta { email?: string | null; meta?: Record<string, unknown>; ultimo?: string | null; criado?: string | null }
// conta nova em auth.users, gravada pelo dono; sem `email` recebe um e-mail único
async function conta(c: Conta = {}): Promise<string> {
  await comoDono(banco);
  const email = c.email === undefined ? `pessoa${++seq}@exemplo.com` : c.email;
  const [{ id }] = await q<{ id: string }>(
    `insert into auth.users (email, raw_user_meta_data, last_sign_in_at, created_at)
     values ($1, $2::text::jsonb, $3::timestamptz, coalesce($4::timestamptz, now())) returning id`,
    [email, JSON.stringify(c.meta ?? {}), c.ultimo ?? null, c.criado ?? null]);
  return id;
}
async function perfil(userId: string, nome = 'Pessoa Com Perfil', extra: { telefone?: string; nascimento?: string; genero?: string; raca?: string } = {}) {
  await comoDono(banco);
  await banco.query(
    `insert into public.perfis (user_id, nome, nascimento, genero, raca, telefone, atua, tempo)
     values ($1, $2, $3, $4, $5, $6, true, 'mais_10')`,
    [userId, nome, extra.nascimento ?? '1990-01-01', extra.genero ?? 'nao_informar', extra.raca ?? 'nao_informar', extra.telefone ?? '11987654321']);
}
async function membro(mandato: string, userId: string, papel: string) {
  await comoDono(banco);
  await banco.query(`insert into public.membros (mandato_id, user_id, nome, papel) values ($1, $2, 'Membro', $3)`, [mandato, userId, papel]);
}

interface Args { busca?: string | null; papel?: string | null; mandato?: string | null; semPerfil?: boolean | null; limite?: number | null; offset?: number | null }
// limite padrão dos testes: 100 (todas as contas); `limite: null` testa o padrão da função
async function lista(a: Args = {}, quem: string = IDS.admin): Promise<Resultado> {
  await como(banco, quem);
  return (await q<{ r: Resultado }>(
    `select public.admin_usuarios(p_busca => $1, p_papel => $2, p_mandato => $3::uuid, p_sem_perfil => $4,
                                  p_limite => $5::int, p_offset => $6::int) r`,
    [a.busca ?? null, a.papel ?? null, a.mandato ?? null, a.semPerfil ?? false, a.limite === undefined ? 100 : a.limite, a.offset ?? 0],
  ))[0].r;
}
const ids = (r: Resultado) => r.linhas.map((l) => l.id).sort();
const linha = (r: Resultado, id: string) => {
  const l = r.linhas.find((x) => x.id === id);
  assert.ok(l, `linha ${id} ausente`);
  return l;
};

// Cenário de papéis e mandatos (USR-04.2 a 04.5):
//   membro (semente): coordenacao em A
//   ana: assessoria em A e coordenacao em B
//   beto: leitura em B
//   admin (semente, equipe admin): assessoria em B
//   leitura (semente, equipe leitura): nenhum mandato
//   fora (semente): nada
async function cenario() {
  const ana = await conta({ email: 'ana.assessora@exemplo.com', meta: { name: 'Ana Assessora' } });
  const beto = await conta({ email: 'beto@exemplo.com', meta: { name: 'Beto Leitor' } });
  await membro(IDS.mandatoA, ana, 'assessoria');
  await membro(IDS.mandatoB, ana, 'coordenacao');
  await membro(IDS.mandatoB, beto, 'leitura');
  await membro(IDS.mandatoB, IDS.admin, 'assessoria');
  return { ana, beto };
}

// ---------- forma do retorno (USR-01.2, USR-03.4) ----------

test('devolve só total e linhas, e cada linha só id, nome, email, criado_em, ultimo_acesso, sem_perfil, equipe_papel e mandatos com id, nome, papel e arquivado (USR-01.2, USR-03.4)', async () => {
  await cenario();
  const r = await lista();
  assert.deepEqual(Object.keys(r).sort(), ['linhas', 'total']);
  assert.equal(typeof r.total, 'number');
  for (const l of r.linhas) {
    assert.deepEqual(Object.keys(l).sort(), ['criado_em', 'email', 'equipe_papel', 'id', 'mandatos', 'nome', 'sem_perfil', 'ultimo_acesso']);
    for (const m of l.mandatos) assert.deepEqual(Object.keys(m).sort(), ['arquivado', 'id', 'nome', 'papel']);
  }
  assert.ok(r.linhas.some((l) => l.mandatos.length > 0), 'o cenário tem mandatos');
});

test('a lista nunca traz gênero, raça, nascimento, telefone nem metadados brutos da conta (USR-01.10, USR-03.4)', async () => {
  const id = await conta({ email: 'sigilo@exemplo.com', meta: { name: 'Conta Sigilo', provider_token: 'token-secreto-123' } });
  await perfil(id, 'Pessoa Sigilosa', { telefone: '21912345678', nascimento: '1987-03-21', genero: 'travesti', raca: 'indigena' });
  const texto = JSON.stringify(await lista());
  for (const vazado of ['21912345678', '1987-03-21', 'travesti', 'indigena', 'mais_10', 'token-secreto-123', 'provider_token', 'telefone', 'genero', 'raca', 'nascimento']) {
    assert.ok(!texto.includes(vazado), `vazou ${vazado}`);
  }
  assert.ok(texto.includes('Pessoa Sigilosa'), 'a pessoa está na lista');
});

// ---------- quem aparece e as marcas (USR-01.3 a 01.5) ----------

test('inclui toda conta de auth.users: a equipe Legisla, quem está em mandato e quem não tem perfil (USR-01.3)', async () => {
  const comPerfil = await conta();
  await perfil(comPerfil);
  const r = await lista();
  assert.equal(r.total, 5);
  assert.deepEqual(ids(r), [IDS.admin, IDS.leitura, IDS.membro, IDS.fora, comPerfil].sort());
});

test('sem_perfil é verdadeiro só para quem não tem perfil e não está na equipe Legisla (USR-01.4)', async () => {
  const comPerfil = await conta();
  await perfil(comPerfil);
  await perfil(IDS.admin); // equipe com perfil
  const r = await lista();
  assert.equal(linha(r, IDS.fora).sem_perfil, true);
  assert.equal(linha(r, IDS.membro).sem_perfil, true);
  assert.equal(linha(r, comPerfil).sem_perfil, false);
  assert.equal(linha(r, IDS.admin).sem_perfil, false);
  assert.equal(linha(r, IDS.leitura).sem_perfil, false, 'equipe sem perfil não leva a marca');
});

test('equipe_papel traz o papel na equipe Legisla (admin ou leitura) e é nulo para quem não é da equipe (USR-01.5)', async () => {
  const r = await lista();
  assert.equal(linha(r, IDS.admin).equipe_papel, 'admin');
  assert.equal(linha(r, IDS.leitura).equipe_papel, 'leitura');
  assert.equal(linha(r, IDS.membro).equipe_papel, null);
  assert.equal(linha(r, IDS.fora).equipe_papel, null);
});

test('quem está na equipe Legisla e em um mandato aparece com o papel da equipe e o mandato (Edge Cases)', async () => {
  await membro(IDS.mandatoA, IDS.leitura, 'assessoria');
  const l = linha(await lista(), IDS.leitura);
  assert.equal(l.equipe_papel, 'leitura');
  assert.deepEqual(l.mandatos, [{ id: IDS.mandatoA, nome: 'Parlamentar Um', papel: 'assessoria', arquivado: false }]);
});

// ---------- nome e e-mail (USR-01.6, Edge Cases) ----------

test('o nome sai do perfil antes do nome do cadastro da conta (USR-01.6)', async () => {
  const id = await conta({ meta: { nome: 'Nome Da Conta', full_name: 'Completo Da Conta', name: 'Name Da Conta' } });
  await perfil(id, 'Maria do Perfil');
  assert.equal(linha(await lista(), id).nome, 'Maria do Perfil');
});

test('sem perfil o nome sai do cadastro da conta, nesta ordem: nome, full_name, name; sem nenhum, o e-mail (USR-01.6)', async () => {
  const c1 = await conta({ meta: { nome: 'Nome Um', full_name: 'Completo Um', name: 'Name Um' } });
  const c2 = await conta({ meta: { full_name: 'Completo Dois', name: 'Name Dois' } });
  const c3 = await conta({ meta: { name: 'Name Tres' } });
  const c4 = await conta({ email: 'vazio@exemplo.com', meta: { nome: '', full_name: '', name: '' } });
  const c5 = await conta({ email: 'sem.nome@exemplo.com' });
  const r = await lista();
  assert.equal(linha(r, c1).nome, 'Nome Um');
  assert.equal(linha(r, c2).nome, 'Completo Dois');
  assert.equal(linha(r, c3).nome, 'Name Tres');
  assert.equal(linha(r, c4).nome, 'vazio@exemplo.com');
  assert.equal(linha(r, c5).nome, 'sem.nome@exemplo.com');
});

test('conta sem e-mail devolve email nulo e o nome do cadastro (Edge Cases)', async () => {
  const id = await conta({ email: null, meta: { name: 'Sem Email Nenhum' } });
  const l = linha(await lista(), id);
  assert.equal(l.email, null);
  assert.equal(l.nome, 'Sem Email Nenhum');
});

test('dois usuários com o mesmo nome aparecem em linhas próprias, cada um com o seu e-mail (Edge Cases)', async () => {
  const a = await conta({ email: 'jose.um@exemplo.com', meta: { name: 'José Silva' } });
  const b = await conta({ email: 'jose.dois@exemplo.com', meta: { name: 'José Silva' } });
  const r = await lista();
  assert.deepEqual([linha(r, a).email, linha(r, b).email], ['jose.um@exemplo.com', 'jose.dois@exemplo.com']);
  assert.equal(r.linhas.filter((l) => l.nome === 'José Silva').length, 2);
});

test('criado_em é a data de cadastro da conta e ultimo_acesso o último login; sem login, ultimo_acesso é nulo (USR-01.2, USR-01.7)', async () => {
  const entrou = await conta({ criado: '2026-01-02T03:04:05Z', ultimo: '2026-11-09T13:45:00Z' });
  const nunca = await conta({ criado: '2026-02-03T10:00:00Z', ultimo: null });
  const r = await lista();
  assert.equal(Date.parse(linha(r, entrou).criado_em), Date.parse('2026-01-02T03:04:05Z'));
  assert.equal(Date.parse(linha(r, entrou).ultimo_acesso!), Date.parse('2026-11-09T13:45:00Z'));
  assert.equal(Date.parse(linha(r, nunca).criado_em), Date.parse('2026-02-03T10:00:00Z'));
  assert.equal(linha(r, nunca).ultimo_acesso, null);
});

// ---------- ordem, limite e total (USR-01.8, 01.9, USR-03.6, 03.7) ----------

test('ordena do último login mais recente ao mais antigo, quem nunca entrou por último, desempate pelo e-mail (USR-01.8)', async () => {
  await conta({ email: 'caio@exemplo.com', ultimo: '2026-11-09T10:00:00Z' });
  await conta({ email: 'bia@exemplo.com', ultimo: '2026-11-10T08:00:00Z' });
  await conta({ email: 'dora@exemplo.com', ultimo: null });
  await conta({ email: 'ana@exemplo.com', ultimo: '2026-11-09T10:00:00Z' });
  const r = await lista();
  assert.deepEqual(r.linhas.map((l) => l.email), [
    'bia@exemplo.com', 'ana@exemplo.com', 'caio@exemplo.com',
    'admin@legislabrasil.org', 'dora@exemplo.com', 'fora@exemplo.com', 'leitura@legislabrasil.org', 'membro@gabinete.leg.br',
  ]);
});

test('limite fora de 1 a 100 (0, -1, 101, nulo) vira 25; dentro do intervalo vale o pedido (USR-03.7, USR-01.9)', async () => {
  for (let i = 0; i < 30; i++) await conta();
  for (const limite of [0, -1, 101, null]) {
    const r = await lista({ limite });
    assert.equal(r.linhas.length, 25, `limite ${limite}`);
    assert.equal(r.total, 34, `limite ${limite}`);
  }
  assert.equal((await lista({ limite: 1 })).linhas.length, 1);
  assert.equal((await lista({ limite: 100 })).linhas.length, 34);
});

test('a posição pula as primeiras pessoas da ordem: duas páginas de 25 cobrem todas, sem repetir (USR-03.6, USR-01.9)', async () => {
  for (let i = 0; i < 30; i++) await conta({ ultimo: `2026-10-${String(i + 1).padStart(2, '0')}T12:00:00Z` });
  const todas = (await lista({ limite: 100 })).linhas.map((l) => l.id);
  const p1 = await lista({ limite: 25, offset: 0 });
  const p2 = await lista({ limite: 25, offset: 25 });
  assert.equal(p2.linhas.length, 9);
  assert.deepEqual([...p1.linhas, ...p2.linhas].map((l) => l.id), todas);
  assert.equal(p2.total, 34);
});

test('total conta todas as pessoas que atendem aos filtros, não só as da página (USR-03.6, USR-01.9)', async () => {
  for (let i = 0; i < 30; i++) await conta();
  const r = await lista({ semPerfil: true, limite: 5 });
  assert.equal(r.linhas.length, 5);
  assert.equal(r.total, 32, '30 contas novas + fora + membro');
});

test('sem ninguém que atenda à busca devolve total 0 e nenhuma linha (USR-04.7)', async () => {
  assert.deepEqual(await lista({ busca: 'ninguém tem este nome' }), { total: 0, linhas: [] });
});

// ---------- busca (USR-04.1, Edge Cases) ----------

test('a busca acha pelo nome do perfil sem diferenciar maiúsculas e acentos (USR-04.1)', async () => {
  const id = await conta({ email: 'jc@exemplo.com' });
  await perfil(id, 'José da Conceição');
  for (const termo of ['jose', 'JOSÉ', 'conceicao', 'Conceição', 'da conc']) {
    assert.deepEqual(ids(await lista({ busca: termo })), [id], termo);
  }
  assert.equal((await lista({ busca: 'joão' })).total, 0);
});

test('a busca acha pelo nome do cadastro da conta, com maiúsculas acentuadas, quando não há perfil (USR-04.1)', async () => {
  const id = await conta({ email: 'es@exemplo.com', meta: { name: 'ÉRICA ÇANTOS' } });
  assert.deepEqual(ids(await lista({ busca: 'erica cantos' })), [id]);
});

test('a busca acha por parte do e-mail sem diferenciar maiúsculas (USR-04.1)', async () => {
  assert.deepEqual(ids(await lista({ busca: 'GABINETE.LEG' })), [IDS.membro]);
  assert.deepEqual(ids(await lista({ busca: 'legislabrasil' })), [IDS.admin, IDS.leitura].sort());
});

test('a busca olha só nome e e-mail: telefone e nascimento do perfil não acham ninguém (USR-04.1, USR-01.10)', async () => {
  const id = await conta();
  await perfil(id, 'Pessoa Discreta', { telefone: '21912345678', nascimento: '1987-03-21' });
  assert.equal((await lista({ busca: '21912345678' })).total, 0);
  assert.equal((await lista({ busca: '1987-03-21' })).total, 0);
});

test('busca com mais de 100 caracteres é cortada em 100, sem erro (Edge Cases)', async () => {
  const cem = 'a'.repeat(98) + ' b'; // 100 caracteres
  const id = await conta({ meta: { name: cem } });
  const r = await lista({ busca: cem + 'z'.repeat(50) });
  assert.deepEqual(ids(r), [id]);
});

// ---------- filtros (USR-04.2 a 04.5) ----------

test('filtro de papel: coordenacao, assessoria e leitura acham quem tem o papel em algum mandato; legisla acha a equipe (USR-04.2)', async () => {
  const { ana, beto } = await cenario();
  assert.deepEqual(ids(await lista({ papel: 'coordenacao' })), [IDS.membro, ana].sort());
  assert.deepEqual(ids(await lista({ papel: 'assessoria' })), [IDS.admin, ana].sort());
  assert.deepEqual(ids(await lista({ papel: 'leitura' })), [beto]);
  assert.deepEqual(ids(await lista({ papel: 'legisla' })), [IDS.admin, IDS.leitura].sort());
});

test('filtro de mandato acha quem está nele com qualquer papel; quem está em dois mandatos aparece nos dois (USR-04.3, Assumptions)', async () => {
  const { ana, beto } = await cenario();
  assert.deepEqual(ids(await lista({ mandato: IDS.mandatoA })), [IDS.membro, ana].sort());
  assert.deepEqual(ids(await lista({ mandato: IDS.mandatoB })), [IDS.admin, ana, beto].sort());
});

test('filtro "sem perfil" acha só quem não tem perfil e não é da equipe Legisla (USR-04.4)', async () => {
  const { ana, beto } = await cenario();
  await perfil(beto);
  assert.deepEqual(ids(await lista({ semPerfil: true })), [IDS.membro, IDS.fora, ana].sort());
});

test('busca, papel e mandato valem juntos (USR-04.5)', async () => {
  const { ana } = await cenario();
  // "ana" acha Ana Admin e Ana Assessora; as duas têm assessoria; só a Ana Assessora está no mandato A
  assert.deepEqual(ids(await lista({ busca: 'ana', papel: 'assessoria' })), [IDS.admin, ana].sort());
  assert.deepEqual(ids(await lista({ busca: 'ana', papel: 'assessoria', mandato: IDS.mandatoA })), [ana]);
});

test('papel e mandato juntos acham quem tem aquele papel naquele mandato (USR-04.5)', async () => {
  const { ana } = await cenario();
  // ana é assessoria em A e coordenacao em B
  assert.deepEqual(ids(await lista({ papel: 'assessoria', mandato: IDS.mandatoB })), [IDS.admin]);
  assert.deepEqual(ids(await lista({ papel: 'coordenacao', mandato: IDS.mandatoB })), [ana]);
  assert.deepEqual(ids(await lista({ papel: 'legisla', mandato: IDS.mandatoB })), [IDS.admin]);
});

test('"sem perfil" e mandato valem juntos (USR-04.5)', async () => {
  const { ana, beto } = await cenario();
  await perfil(beto);
  assert.deepEqual(ids(await lista({ semPerfil: true, mandato: IDS.mandatoB })), [ana]);
});

// ---------- mandatos da linha (Edge Cases, Assumptions) ----------

test('quem está em dois mandatos aparece com os dois, cada um com o seu papel (Assumptions)', async () => {
  const { ana } = await cenario();
  const m = linha(await lista(), ana).mandatos;
  assert.deepEqual([...m].sort((x, y) => x.id.localeCompare(y.id)), [
    { id: IDS.mandatoA, nome: 'Parlamentar Um', papel: 'assessoria', arquivado: false },
    { id: IDS.mandatoB, nome: 'Parlamentar Dois', papel: 'coordenacao', arquivado: false },
  ]);
});

test('mandato arquivado aparece com arquivado verdadeiro (Edge Cases)', async () => {
  const { ana } = await cenario();
  await comoDono(banco);
  await banco.query('update public.mandatos set arquivado_em = now() where id = $1', [IDS.mandatoB]);
  const m = linha(await lista(), ana).mandatos;
  assert.equal(m.find((x) => x.id === IDS.mandatoB)?.arquivado, true);
  assert.equal(m.find((x) => x.id === IDS.mandatoA)?.arquivado, false);
});

// ---------- permissão e leitura (USR-03.1, 03.2, 03.3, 03.5) ----------

test('leitura da equipe Legisla lista e vê o mesmo que admin (USR-03.1)', async () => {
  await cenario();
  const doAdmin = await lista({}, IDS.admin);
  assert.equal(doAdmin.total, 6);
  assert.deepEqual(await lista({}, IDS.leitura), doAdmin);
});

test('quem não está em equipe_legisla recebe "Você não tem permissão para esta ação." com erro 42501, mesmo com perfil ou em mandato (USR-03.2)', async () => {
  await perfil(IDS.fora);
  for (const quem of [IDS.fora, IDS.membro]) {
    await assert.rejects(lista({}, quem), SEM_PERMISSAO, quem);
  }
});

test('a função lê equipe_legisla a cada chamada: quem sai da equipe deixa de listar na hora (USR-03.1)', async () => {
  assert.equal((await lista({}, IDS.leitura)).total, 4);
  await comoDono(banco);
  await banco.query('delete from public.equipe_legisla where user_id = $1', [IDS.leitura]);
  await assert.rejects(lista({}, IDS.leitura), SEM_PERMISSAO);
});

test('anon não executa admin_usuarios (USR-03.3)', async () => {
  await como(banco, null);
  await assert.rejects(banco.query('select public.admin_usuarios()'), NEGADO);
  await comoDono(banco);
  assert.deepEqual(
    await q(`select has_function_privilege('anon', 'public.admin_usuarios(text, text, uuid, boolean, int, int)', 'execute') a`),
    [{ a: false }]);
});

test('admin_usuarios é stable, então não grava nada (USR-03.5)', async () => {
  await comoDono(banco);
  assert.deepEqual(await q(`select p.provolatile v from pg_proc p where p.oid = 'public.admin_usuarios(text, text, uuid, boolean, int, int)'::regprocedure`), [{ v: 's' }]);
});
