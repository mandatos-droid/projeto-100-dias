// Aba Usuários: escrita (admin_usuario_perfil_salvar, admin_usuario_email, admin_usuario_excluir),
// no PGlite com as migrations reais.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { criaBanco, como, comoDono, semente, comPerfil, IDS } from './sql-ambiente.ts';
import type { Banco } from './sql-ambiente.ts';

const SEM_PERMISSAO = { code: '42501', message: /^Você não tem permissão para esta ação\.$/ };

let banco: Banco;
before(async () => { banco = await criaBanco(); });
after(async () => { await banco.close(); });

beforeEach(async () => {
  await comoDono(banco);
  await banco.exec('truncate public.eventos, public.membros, public.perfis, public.consentimentos, public.convites, public.auditoria_admin, public.equipe_legisla, public.mandatos, auth.users cascade');
  await semente(banco);
});

const q = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) => (await banco.query<T>(sql, args)).rows;

const PERFIL = ['Joana Perfil Souza', '1987-03-21', 'mulher_trans', 'preta', '21912345678', true, '6_10'] as const;
async function salva(user: string, quem: string = IDS.admin, v: readonly unknown[] = PERFIL) {
  await como(banco, quem);
  return (await q<{ r: { ok: boolean; erro?: string } }>(
    'select public.admin_usuario_perfil_salvar($1::uuid, $2, $3, $4, $5, $6, $7::boolean, $8) r', [user, ...v]))[0].r;
}
async function auditoria() {
  await comoDono(banco);
  return q<{ acao: string; alvo_id: string; detalhe: Record<string, unknown> }>('select acao, alvo_id, detalhe from public.auditoria_admin order by id');
}

// ---------- perfil ----------

test('perfil: admin altera o perfil de outra pessoa e a auditoria guarda só os nomes dos campos', async () => {
  await comPerfil(banco, IDS.fora);
  assert.deepEqual(await salva(IDS.fora), { ok: true });
  await comoDono(banco);
  const [p] = await q<{ nome: string; telefone: string; tempo: string }>('select nome, telefone, tempo from public.perfis where user_id = $1', [IDS.fora]);
  assert.equal(p.nome, 'Joana Perfil Souza');
  assert.equal(p.telefone, '21912345678');
  const [a] = await auditoria();
  assert.equal(a.acao, 'usuario.perfil');
  assert.equal(a.alvo_id, IDS.fora);
  assert.deepEqual((a.detalhe.campos as string[]).sort(), ['atua', 'genero', 'nascimento', 'nome', 'raca', 'telefone', 'tempo']);
  assert.doesNotMatch(JSON.stringify(a.detalhe), /21912345678|1987|preta|mulher_trans/);
});

test('perfil: sem mudança não grava nem audita', async () => {
  await comPerfil(banco, IDS.fora);
  await salva(IDS.fora);
  assert.deepEqual(await salva(IDS.fora), { ok: true });
  assert.equal((await auditoria()).length, 1);
});

test('perfil: quem não tem perfil recebe sem_perfil e nada é criado', async () => {
  assert.deepEqual(await salva(IDS.fora), { ok: false, erro: 'sem_perfil' });
  await comoDono(banco);
  assert.equal((await q('select 1 from public.perfis where user_id = $1', [IDS.fora])).length, 0);
});

test('perfil: campo inválido volta como dado, sem gravar', async () => {
  await comPerfil(banco, IDS.fora);
  const ruins: [string, readonly unknown[]][] = [
    ['nome', ['Joana', ...PERFIL.slice(1)]],
    ['nascimento', [PERFIL[0], '2030-01-01', ...PERFIL.slice(2)]],
    ['nascimento', [PERFIL[0], '1987-02-31', ...PERFIL.slice(2)]],
    ['genero', [PERFIL[0], PERFIL[1], 'xx', ...PERFIL.slice(3)]],
    ['raca', [PERFIL[0], PERFIL[1], PERFIL[2], 'xx', ...PERFIL.slice(4)]],
    ['telefone', [PERFIL[0], PERFIL[1], PERFIL[2], PERFIL[3], '123', PERFIL[5], PERFIL[6]]],
    ['tempo', [PERFIL[0], PERFIL[1], PERFIL[2], PERFIL[3], PERFIL[4], true, null]],
    ['tempo', [PERFIL[0], PERFIL[1], PERFIL[2], PERFIL[3], PERFIL[4], false, '6_10']],
  ];
  for (const [campo, args] of ruins) assert.deepEqual(await salva(IDS.fora, IDS.admin, args), { ok: false, erro: campo });
  assert.equal((await auditoria()).length, 0);
});

test('perfil: leitura, gabinete e anon são recusados', async () => {
  await comPerfil(banco, IDS.fora);
  await assert.rejects(salva(IDS.fora, IDS.leitura), SEM_PERMISSAO);
  await assert.rejects(salva(IDS.fora, IDS.membro), SEM_PERMISSAO);
  await como(banco, null);
  await assert.rejects(q('select public.admin_usuario_perfil_salvar($1::uuid, $2, $3, $4, $5, $6, $7::boolean, $8)', [IDS.fora, ...PERFIL]), /permission denied/);
});

// ---------- e-mail ----------

async function email(user: string, novo: string, quem: string = IDS.admin) {
  await como(banco, quem);
  await q('select public.admin_usuario_email($1::uuid, $2)', [user, novo]);
}

test('e-mail: admin troca, o e-mail vai sem caixa nem espaços e a auditoria registra de/para', async () => {
  await email(IDS.fora, '  Novo@Exemplo.COM ');
  await comoDono(banco);
  const [u] = await q<{ email: string; updated_at: string | null }>('select email, updated_at from auth.users where id = $1', [IDS.fora]);
  assert.equal(u.email, 'novo@exemplo.com');
  assert.ok(u.updated_at);
  const [a] = await auditoria();
  assert.equal(a.acao, 'usuario.email');
  assert.deepEqual(a.detalhe, { de: 'fora@exemplo.com', para: 'novo@exemplo.com' });
});

test('e-mail: inválido, repetido e pessoa inexistente são recusados', async () => {
  await assert.rejects(email(IDS.fora, 'sem-arroba'), /Digite um e-mail válido\./);
  await assert.rejects(email(IDS.fora, 'ADMIN@legislabrasil.org'), /Já existe uma conta com este e-mail\./);
  await assert.rejects(email('00000000-0000-4000-8000-0000000000ff', 'x@y.com'), /Pessoa não encontrada\./);
  assert.equal((await auditoria()).length, 0);
});

test('e-mail: o mesmo e-mail é no-op e quem não é admin é recusado', async () => {
  await email(IDS.fora, 'FORA@exemplo.com');
  assert.equal((await auditoria()).length, 0);
  await assert.rejects(email(IDS.fora, 'x@y.com', IDS.leitura), SEM_PERMISSAO);
  await assert.rejects(email(IDS.fora, 'x@y.com', IDS.membro), SEM_PERMISSAO);
});

// ---------- excluir ----------

async function exclui(user: string, confirma: string, quem: string = IDS.admin) {
  await como(banco, quem);
  await q('select public.admin_usuario_excluir($1::uuid, $2)', [user, confirma]);
}
const existe = async (id: string) => { await comoDono(banco); return (await q('select 1 from auth.users where id = $1', [id])).length === 1; };

test('excluir: apaga a conta e o que depende dela, e audita antes', async () => {
  await comPerfil(banco, IDS.fora);
  await comoDono(banco);
  await banco.query(`insert into public.consentimentos (user_id, versao) values ($1, '2026-11')`, [IDS.fora]);
  await banco.query(`insert into public.membros (mandato_id, user_id, nome, papel) values ($1, $2, 'Fabio', 'assessoria')`, [IDS.mandatoA, IDS.fora]);
  await exclui(IDS.fora, ' FORA@exemplo.com ');
  assert.equal(await existe(IDS.fora), false);
  assert.equal((await q('select 1 from public.perfis where user_id = $1', [IDS.fora])).length, 0);
  assert.equal((await q('select 1 from public.consentimentos where user_id = $1', [IDS.fora])).length, 0);
  assert.equal((await q('select 1 from public.membros where user_id = $1', [IDS.fora])).length, 0);
  const [a] = await auditoria();
  assert.equal(a.acao, 'usuario.excluir');
  assert.equal(a.alvo_id, IDS.fora);
  assert.equal(a.detalhe.email, 'fora@exemplo.com');
});

test('excluir: e-mail que não confere não apaga nada', async () => {
  await assert.rejects(exclui(IDS.fora, 'outro@exemplo.com'), /O e-mail digitado não confere com o da conta\./);
  await assert.rejects(exclui(IDS.fora, ''), /não confere/);
  assert.equal(await existe(IDS.fora), true);
  assert.equal((await auditoria()).length, 0);
});

test('excluir: não exclui a si mesmo; admin pode excluir outro admin e a equipe nunca fica sem admin', async () => {
  await assert.rejects(exclui(IDS.admin, 'admin@legislabrasil.org'), /própria conta/);
  await comoDono(banco);
  await banco.query(`update public.equipe_legisla set papel = 'admin' where user_id = $1`, [IDS.leitura]);
  await exclui(IDS.leitura, 'leitura@legislabrasil.org'); // quem exclui continua admin
  assert.equal(await existe(IDS.leitura), false);
  assert.equal(await existe(IDS.admin), true);
});

test('excluir: barra quem é a única coordenação de um mandato', async () => {
  await assert.rejects(exclui(IDS.membro, 'membro@gabinete.leg.br'), /única coordenação de "Parlamentar Um"/);
  assert.equal(await existe(IDS.membro), true);
  // com outra coordenação no mandato, passa
  await comoDono(banco);
  await banco.query(`insert into public.membros (mandato_id, user_id, nome, papel) values ($1, $2, 'Fabio', 'coordenacao')`, [IDS.mandatoA, IDS.fora]);
  await exclui(IDS.membro, 'membro@gabinete.leg.br');
  assert.equal(await existe(IDS.membro), false);
});

test('excluir: eventos da pessoa ficam anônimos e o mandato que ela criou continua', async () => {
  await comoDono(banco);
  await banco.query(`insert into public.membros (mandato_id, user_id, nome, papel) values ($1, $2, 'Fabio', 'coordenacao')`, [IDS.mandatoA, IDS.fora]);
  await banco.query(`insert into public.eventos (mandato_id, user_id, autor, texto) values ($1, $2, 'Mario Membro', 'fez algo')`, [IDS.mandatoA, IDS.membro]);
  await exclui(IDS.membro, 'membro@gabinete.leg.br');
  await comoDono(banco);
  const [e] = await q<{ user_id: string | null; autor: string }>('select user_id, autor from public.eventos where mandato_id = $1', [IDS.mandatoA]);
  assert.equal(e.user_id, null);
  assert.equal(e.autor, 'usuário removido');
  const [m] = await q<{ criado_por: string | null }>('select criado_por from public.mandatos where id = $1', [IDS.mandatoA]);
  assert.equal(m.criado_por, null);
});

test('excluir: leitura, gabinete e anon são recusados', async () => {
  await assert.rejects(exclui(IDS.fora, 'fora@exemplo.com', IDS.leitura), SEM_PERMISSAO);
  await assert.rejects(exclui(IDS.fora, 'fora@exemplo.com', IDS.membro), SEM_PERMISSAO);
  await como(banco, null);
  await assert.rejects(q('select public.admin_usuario_excluir($1::uuid, $2)', [IDS.fora, 'fora@exemplo.com']), /permission denied/);
  assert.equal(await existe(IDS.fora), true);
});
