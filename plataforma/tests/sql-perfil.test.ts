// Primeiro acesso: tabela perfis, perfil_salvar e private.tem_perfil (PAG-02, PAG-03), no PGlite.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { criaBanco, como, comoDono, semente, IDS } from './sql-ambiente.ts';
import type { Banco } from './sql-ambiente.ts';

// Mandato A: IDS.membro (coordenação) e ASSESSORIA. IDS.fora não está em mandato nenhum.
const ASSESSORIA = '00000000-0000-4000-8000-0000000000c1';
const NEGADO = /permission denied/;

let banco: Banco;
before(async () => { banco = await criaBanco(); });
after(async () => { await banco.close(); });

beforeEach(async () => {
  await comoDono(banco);
  await banco.exec('drop trigger if exists falha_consentimento on public.consentimentos');
  await banco.exec('truncate public.eventos, public.membros, public.equipe_legisla, public.mandatos, auth.users cascade');
  await semente(banco);
  await banco.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, 'assessoria@gabinete.leg.br', '{"name":"Alice Assessoria"}')`, [ASSESSORIA]);
  await banco.query(`insert into public.membros (mandato_id, user_id, nome, papel) values ($1, $2, 'Alice Assessoria', 'assessoria')`, [IDS.mandatoA, ASSESSORIA]);
});

const q = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) => (await banco.query<T>(sql, args)).rows;

interface Dados {
  nome: string | null; nascimento: string | null; genero: string | null; raca: string | null;
  telefone: string | null; atua: boolean | null; tempo: string | null;
}
const VALIDO: Dados = {
  nome: 'Carlos Lima', nascimento: '1990-05-17', genero: 'homem_cis', raca: 'parda', telefone: '11987654321', atua: true, tempo: '3_5',
};
// chama como a sessão atual (como/comoDono decidem quem)
const salvar = async (d: Partial<Dados> = {}) => {
  const v = { ...VALIDO, ...d };
  return (await q<{ r: Record<string, unknown> }>('select public.perfil_salvar($1, $2, $3, $4, $5, $6, $7) r',
    [v.nome, v.nascimento, v.genero, v.raca, v.telefone, v.atua, v.tempo]))[0].r;
};
const salvarComo = async (quem: string, d: Partial<Dados> = {}) => {
  await como(banco, quem);
  return salvar(d);
};
const perfilDe = async (id: string) => {
  await comoDono(banco);
  return q('select nome, nascimento::text nascimento, genero, raca, telefone, atua, tempo from public.perfis where user_id = $1', [id]);
};
const consentimentosDe = async (id: string) => {
  await comoDono(banco);
  return (await q<{ versao: string }>('select versao from public.consentimentos where user_id = $1 order by id', [id])).map((x) => x.versao);
};
// nada gravado: nem perfil nem consentimento
const semNada = async (id: string) => {
  assert.deepEqual(await perfilDe(id), [], 'perfil gravado');
  assert.deepEqual(await consentimentosDe(id), [], 'consentimento gravado');
};
const contaNova = async () => {
  await comoDono(banco);
  return (await q<{ id: string }>(`insert into auth.users (email) values ('nova@exemplo.com') returning id`))[0].id;
};
const insereDireto = (id: string) => banco.query(
  `insert into public.perfis (user_id, nome, nascimento, genero, raca, telefone, atua, tempo)
   values ($1, 'Pessoa Teste', '1985-01-01', 'outra', 'branca', '21987654321', false, null)`, [id]);
const lidosPor = async (quem: string, onde = '') => {
  await como(banco, quem);
  return (await q<{ user_id: string }>(`select user_id from public.perfis ${onde} order by user_id`)).map((x) => x.user_id);
};
const temPerfil = async (quem: string) => {
  await como(banco, quem);
  return (await q<{ t: boolean }>('select private.tem_perfil() t'))[0].t;
};
const recusa = (erro: string) => ({ ok: false, erro });

// ---------- tabela e permissões ----------

test('perfis guarda uma linha por pessoa e authenticated só tem select, sem insert, update nem delete; anon não tem nada (PAG-03.1)', async () => {
  await comoDono(banco);
  const privilegios = await q<{ r: string; p: string; tem: boolean }>(
    `select r, p, has_table_privilege(r, 'public.perfis', p) tem
       from unnest(array['authenticated', 'anon']) r, unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) p`);
  assert.deepEqual(privilegios.filter((x) => x.tem).map((x) => `${x.r}:${x.p}`), ['authenticated:SELECT']);
  // user_id único: a segunda linha da mesma pessoa não entra nem pelo dono
  await insereDireto(IDS.fora);
  await assert.rejects(insereDireto(IDS.fora), /duplicate key/);
});

test('ninguém grava perfil direto pela API: insert do próprio ou de outra pessoa, update e delete dão erro de permissão (PAG-03.2, PAG-03.3)', async () => {
  await comoDono(banco);
  await insereDireto(IDS.membro);
  const antes = await perfilDe(IDS.membro);
  for (const quem of [IDS.fora, IDS.membro, IDS.admin]) {
    await como(banco, quem);
    await assert.rejects(insereDireto(quem), NEGADO, `${quem} grava o próprio`);
    await assert.rejects(insereDireto(ASSESSORIA), NEGADO, `${quem} grava o de outra pessoa`);
    await assert.rejects(banco.query(`update public.perfis set nome = 'Nome Trocado'`), NEGADO, `${quem} update`);
    await assert.rejects(banco.query('delete from public.perfis'), NEGADO, `${quem} delete`);
  }
  assert.deepEqual(await perfilDe(IDS.membro), antes);
  assert.deepEqual(await perfilDe(ASSESSORIA), []);
  assert.deepEqual(await perfilDe(IDS.fora), []);
});

// ---------- perfil_salvar ----------

test('perfil_salvar devolve {ok:true} e grava o perfil com o user_id da sessão, sem tocar em outra pessoa (PAG-02.12, PAG-03.2)', async () => {
  assert.deepEqual(await salvarComo(IDS.fora), { ok: true });
  assert.deepEqual(await perfilDe(IDS.fora), [{
    nome: 'Carlos Lima', nascimento: '1990-05-17', genero: 'homem_cis', raca: 'parda', telefone: '11987654321', atua: true, tempo: '3_5',
  }]);
  await comoDono(banco);
  assert.deepEqual((await q<{ user_id: string }>('select user_id from public.perfis')).map((x) => x.user_id), [IDS.fora]);
});

test('perfil_salvar grava o consentimento da versão 2026-11 junto com o perfil (PAG-02.12)', async () => {
  await salvarComo(IDS.fora);
  assert.deepEqual(await consentimentosDe(IDS.fora), ['2026-11']);
});

test('se gravar o consentimento falhar, o perfil é desfeito na mesma transação (PAG-02.12)', async () => {
  await comoDono(banco);
  await banco.exec(`
    create or replace function public.teste_falha_consentimento() returns trigger language plpgsql as $$
    begin raise exception 'consentimento indisponível'; end $$;
    create trigger falha_consentimento before insert on public.consentimentos
      for each row execute function public.teste_falha_consentimento();`);
  await como(banco, IDS.fora);
  await assert.rejects(salvar(), /consentimento indisponível/);
  await semNada(IDS.fora);
});

test('a segunda chamada de quem já tem perfil devolve {ok:true}, mantém uma única linha com os dados da primeira e não grava outro consentimento (PAG-02.14)', async () => {
  assert.deepEqual(await salvarComo(IDS.fora), { ok: true });
  assert.deepEqual(await salvarComo(IDS.fora, { nome: 'Carlos Souza Lima', genero: 'outra', atua: false, tempo: null }), { ok: true });
  const perfil = await perfilDe(IDS.fora);
  assert.equal(perfil.length, 1);
  assert.equal(perfil[0].nome, 'Carlos Lima');
  assert.equal(perfil[0].genero, 'homem_cis');
  assert.deepEqual(await consentimentosDe(IDS.fora), ['2026-11']);
});

test('nome com uma palavra, vazio ou fora de 2 a 120 caracteres devolve {ok:false, erro:"nome"} e nada é gravado (PAG-02.9, PAG-03.7)', async () => {
  const longo = `Ana ${'x'.repeat(117)}`; // 121 caracteres, duas palavras
  for (const nome of ['Carlos', 'A', '', '   ', null, longo]) {
    assert.deepEqual(await salvarComo(IDS.fora, { nome }), recusa('nome'), String(nome));
  }
  await semNada(IDS.fora);
  // 120 caracteres com duas palavras é aceito
  assert.deepEqual(await salvarComo(IDS.fora, { nome: `Ana ${'x'.repeat(116)}` }), { ok: true });
});

test('data inexistente, fora do formato, futura ou anterior a 1900-01-01 devolve {ok:false, erro:"nascimento"} e nada é gravado (PAG-02.10, PAG-03.7)', async () => {
  await comoDono(banco);
  const [{ hoje, amanha }] = await q<{ hoje: string; amanha: string }>(
    `select (now() at time zone 'America/Sao_Paulo')::date::text hoje, ((now() at time zone 'America/Sao_Paulo')::date + 1)::text amanha`);
  for (const nascimento of ['2023-02-30', '2023-13-01', '17/05/1990', '', null, '1899-12-31', amanha]) {
    assert.deepEqual(await salvarComo(IDS.fora, { nascimento }), recusa('nascimento'), String(nascimento));
  }
  await semNada(IDS.fora);
  // limites aceitos: 1900-01-01 e hoje
  assert.deepEqual(await salvarComo(IDS.fora, { nascimento: '1900-01-01' }), { ok: true });
  assert.deepEqual(await salvarComo(ASSESSORIA, { nascimento: hoje }), { ok: true });
  assert.equal((await perfilDe(IDS.fora))[0].nascimento, '1900-01-01');
  assert.equal((await perfilDe(ASSESSORIA))[0].nascimento, hoje);
});

test('telefone sem DDD de 11 a 99 mais 8 ou 9 dígitos devolve {ok:false, erro:"telefone"} e nada é gravado (PAG-02.11, PAG-03.7)', async () => {
  for (const telefone of ['10987654321', '0987654321', '119876543', '119876543210', '(11) 98765-4321', '', null]) {
    assert.deepEqual(await salvarComo(IDS.fora, { telefone }), recusa('telefone'), String(telefone));
  }
  await semNada(IDS.fora);
  // DDD 11 com 8 dígitos e DDD 99 com 9 dígitos, guardados só com dígitos
  assert.deepEqual(await salvarComo(IDS.fora, { telefone: '1133334444' }), { ok: true });
  assert.deepEqual(await salvarComo(ASSESSORIA, { telefone: '99987654321' }), { ok: true });
  assert.equal((await perfilDe(IDS.fora))[0].telefone, '1133334444');
  assert.equal((await perfilDe(ASSESSORIA))[0].telefone, '99987654321');
});

test('gênero e raça fora da lista ou vazios devolvem {ok:false, erro:"genero"} e {ok:false, erro:"raca"} (PAG-03.7)', async () => {
  for (const genero of ['feminino', 'Mulher cisgênero', '', null]) {
    assert.deepEqual(await salvarComo(IDS.fora, { genero }), recusa('genero'), String(genero));
  }
  for (const raca of ['negra', 'Parda', '', null]) {
    assert.deepEqual(await salvarComo(IDS.fora, { raca }), recusa('raca'), String(raca));
  }
  await semNada(IDS.fora);
});

test('as 8 opções de gênero e as 6 de raça da spec são aceitas (PAG-02.6)', async () => {
  const generos = ['mulher_cis', 'homem_cis', 'mulher_trans', 'homem_trans', 'travesti', 'nao_binaria', 'outra', 'nao_informar'];
  const racas = ['branca', 'preta', 'parda', 'amarela', 'indigena', 'nao_informar'];
  for (const genero of generos) {
    const id = await contaNova();
    assert.deepEqual(await salvarComo(id, { genero }), { ok: true }, genero);
    assert.equal((await perfilDe(id))[0].genero, genero);
  }
  for (const raca of racas) {
    const id = await contaNova();
    assert.deepEqual(await salvarComo(id, { raca }), { ok: true }, raca);
    assert.equal((await perfilDe(id))[0].raca, raca);
  }
});

test('"Não" grava atua=false sem tempo; "Sim" grava cada uma das 5 faixas de tempo (PAG-02.4, PAG-02.5)', async () => {
  assert.deepEqual(await salvarComo(IDS.fora, { atua: false, tempo: null }), { ok: true });
  const [p] = await perfilDe(IDS.fora);
  assert.equal(p.atua, false);
  assert.equal(p.tempo, null);
  for (const tempo of ['menos_1', '1_2', '3_5', '6_10', 'mais_10']) {
    const id = await contaNova();
    assert.deepEqual(await salvarComo(id, { atua: true, tempo }), { ok: true }, tempo);
    const [x] = await perfilDe(id);
    assert.deepEqual([x.atua, x.tempo], [true, tempo]);
  }
});

test('"Não" com tempo, "Sim" sem tempo ou com tempo fora da lista devolvem {ok:false, erro:"tempo"}; atuação vazia devolve erro "atua" (PAG-03.8, PAG-03.7)', async () => {
  assert.deepEqual(await salvarComo(IDS.fora, { atua: false, tempo: '1_2' }), recusa('tempo'));
  assert.deepEqual(await salvarComo(IDS.fora, { atua: true, tempo: null }), recusa('tempo'));
  assert.deepEqual(await salvarComo(IDS.fora, { atua: true, tempo: '2_3' }), recusa('tempo'));
  assert.deepEqual(await salvarComo(IDS.fora, { atua: true, tempo: 'nao_atua' }), recusa('tempo'));
  assert.deepEqual(await salvarComo(IDS.fora, { atua: null, tempo: null }), recusa('atua'));
  await semNada(IDS.fora);
});

// ---------- leitura ----------

async function tresPerfis() {
  await salvarComo(IDS.fora);
  await salvarComo(IDS.membro);
  await salvarComo(ASSESSORIA);
}

test('a pessoa lê só o próprio perfil (PAG-03.6)', async () => {
  await tresPerfis();
  assert.deepEqual(await lidosPor(IDS.fora), [IDS.fora]);
  assert.deepEqual(await lidosPor(IDS.fora, `where user_id = '${IDS.membro}'`), []);
});

test('membro de mandato lê zero linhas do perfil de outra pessoa, mesmo do mesmo mandato (PAG-03.5)', async () => {
  await tresPerfis();
  assert.deepEqual(await lidosPor(IDS.membro, `where user_id = '${ASSESSORIA}'`), []);
  assert.deepEqual(await lidosPor(ASSESSORIA, `where user_id = '${IDS.membro}'`), []);
  assert.deepEqual(await lidosPor(IDS.membro), [IDS.membro]);
  assert.deepEqual(await lidosPor(ASSESSORIA), [ASSESSORIA]);
});

test('a equipe Legisla, em qualquer papel, lê todos os perfis (PAG-03.4)', async () => {
  await tresPerfis();
  const todos = [IDS.membro, IDS.fora, ASSESSORIA].sort();
  assert.deepEqual(await lidosPor(IDS.admin), todos);
  assert.deepEqual(await lidosPor(IDS.leitura), todos);
});

// ---------- private.tem_perfil ----------

test('private.tem_perfil() é verdadeiro para a equipe Legisla sem perfil e para quem tem perfil, e falso para os demais (PAG-02.15, PAG-02.16)', async () => {
  assert.equal(await temPerfil(IDS.admin), true);
  assert.equal(await temPerfil(IDS.leitura), true);
  assert.equal(await temPerfil(IDS.fora), false);
  assert.equal(await temPerfil(IDS.membro), false);
  await salvarComo(IDS.fora);
  assert.equal(await temPerfil(IDS.fora), true);
  assert.equal(await temPerfil(IDS.membro), false);
});

test('anon não executa perfil_salvar nem private.tem_perfil', async () => {
  await como(banco, null);
  await assert.rejects(salvar(), NEGADO);
  await assert.rejects(banco.query('select private.tem_perfil()'), NEGADO);
  await comoDono(banco);
  assert.deepEqual(await q(
    `select has_function_privilege('anon', 'public.perfil_salvar(text, text, text, text, text, boolean, text)', 'execute') salvar,
            has_function_privilege('anon', 'private.tem_perfil()', 'execute') tem`),
  [{ salvar: false, tem: false }]);
  await semNada(IDS.fora);
});
