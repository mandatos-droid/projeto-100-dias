// Papéis Parlamentar e Chefe de Gabinete, feedback da Missão 5 restrito a eles e "um e-mail, um mandato", no PGlite.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { criaBanco, como, comoDono, comPerfil, semente, IDS } from './sql-ambiente.ts';
import type { Banco } from './sql-ambiente.ts';

const PARLAMENTAR = '00000000-0000-4000-8000-0000000000d1';
const CHEFE = '00000000-0000-4000-8000-0000000000d2';
const COORD = '00000000-0000-4000-8000-0000000000d3';
const ASSESSORIA = '00000000-0000-4000-8000-0000000000d4';
const LEITOR = '00000000-0000-4000-8000-0000000000d5';
const NOVA = '00000000-0000-4000-8000-0000000000d6'; // conta sem mandato nenhum
const A = IDS.mandatoA;
const B = IDS.mandatoB;
const CONVERSAS = [{ id: 'c1', pessoa: 'Ana', destaques: 'segredo da conversa' }];

let banco: Banco;
before(async () => { banco = await criaBanco(); });
after(async () => { await banco.close(); });

beforeEach(async () => {
  await comoDono(banco);
  await banco.exec('truncate public.feedbacks_mandato, public.eventos, public.convites, public.membros, public.equipe_legisla, public.mandatos, auth.users cascade');
  await semente(banco);
  await banco.query(
    `insert into auth.users (id, email) values ($1,'parl@g.br'),($2,'chefe@g.br'),($3,'coord@g.br'),($4,'assess@g.br'),($5,'leitor@g.br'),($6,'nova@g.br')`,
    [PARLAMENTAR, CHEFE, COORD, ASSESSORIA, LEITOR, NOVA]);
  await banco.query(
    `insert into public.membros (mandato_id, user_id, nome, papel) values
       ($1,$2,'Parl','parlamentar'),($1,$3,'Chefe','chefe_gabinete'),($1,$4,'Coord','coordenacao'),($1,$5,'Assess','assessoria'),($1,$6,'Leitor','leitura')`,
    [A, PARLAMENTAR, CHEFE, COORD, ASSESSORIA, LEITOR]);
});

const q = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) => (await banco.query<T>(sql, args)).rows;
const grava = (quem: string, dados: unknown) =>
  como(banco, quem).then(() => banco.query('update public.mandatos set dados = $2::jsonb where id = $1', [A, JSON.stringify(dados)]));
const naTabela = async () => { await comoDono(banco); return q<{ dados: unknown }>('select dados from public.feedbacks_mandato where mandato_id = $1', [A]); };
const dadosDoMandato = async () => { await comoDono(banco); return (await q<{ dados: Record<string, unknown> }>('select dados from public.mandatos where id = $1', [A]))[0].dados; };
const trocar = (quem: string, alvo: string, papel: string) =>
  como(banco, quem).then(() => banco.query('select public.membro_trocar_papel($1,$2,$3)', [A, alvo, papel]));
const remover = (quem: string, alvo: string) =>
  como(banco, quem).then(() => banco.query('select public.membro_remover($1,$2)', [A, alvo]));
const papelDe = async (u: string) => { await comoDono(banco); return (await q<{ papel: string }>('select papel from public.membros where mandato_id=$1 and user_id=$2', [A, u]))[0]?.papel; };

// ---------- papéis ----------
test('nivel_papel ordena parlamentar > chefe_gabinete > coordenacao > assessoria > leitura', async () => {
  await comoDono(banco);
  const r = await q<{ n: number }>(`select private.nivel_papel(p) n from unnest(array['parlamentar','chefe_gabinete','coordenacao','assessoria','leitura','x']) p`);
  assert.deepEqual(r.map((x) => x.n), [5, 4, 3, 2, 1, 0]);
});

test('pode_editar vale para os quatro papéis de cima; pode_gerir para parlamentar, chefe e coordenação', async () => {
  const quem = { [PARLAMENTAR]: [true, true], [CHEFE]: [true, true], [COORD]: [true, true], [ASSESSORIA]: [true, false], [LEITOR]: [false, false] };
  for (const [u, [edita, gere]] of Object.entries(quem)) {
    await como(banco, u);
    const [r] = await q<{ e: boolean; g: boolean }>('select private.pode_editar($1) e, private.pode_gerir($1) g', [A]);
    assert.deepEqual([r.e, r.g], [edita, gere], u);
  }
});

test('troca de papel e remoção só entre papéis iguais ou menores que o de quem chama', async () => {
  await assert.rejects(trocar(CHEFE, ASSESSORIA, 'parlamentar'), /iguais ou menores/);
  await assert.rejects(trocar(COORD, CHEFE, 'assessoria'), /iguais ou menores/);
  await assert.rejects(remover(COORD, PARLAMENTAR), /iguais ou menores/);
  await assert.rejects(trocar(ASSESSORIA, LEITOR, 'leitura'), /permissão/);
  await trocar(COORD, ASSESSORIA, 'coordenacao');
  assert.equal(await papelDe(ASSESSORIA), 'coordenacao');
  await trocar(PARLAMENTAR, LEITOR, 'chefe_gabinete');
  assert.equal(await papelDe(LEITOR), 'chefe_gabinete');
  await remover(CHEFE, COORD);
  assert.equal(await papelDe(COORD), undefined);
});

test('a última pessoa de gestão não sai nem é rebaixada, mas com outra de gestão sai', async () => {
  await comoDono(banco);
  await banco.query('delete from public.membros where mandato_id = $1 and user_id not in ($2,$3,$4)', [A, PARLAMENTAR, ASSESSORIA, LEITOR]);
  await assert.rejects(trocar(PARLAMENTAR, PARLAMENTAR, 'leitura'), /ao menos uma pessoa na coordenação/);
  await assert.rejects(remover(PARLAMENTAR, PARLAMENTAR), /ao menos uma pessoa na coordenação/);
  await trocar(PARLAMENTAR, ASSESSORIA, 'coordenacao');
  await remover(PARLAMENTAR, PARLAMENTAR);
  assert.equal(await papelDe(PARLAMENTAR), undefined);
});

// ---------- feedback ----------
test('parlamentar e chefe gravam o feedback; ele vai para a tabela e sai de mandatos.dados', async () => {
  for (const quem of [PARLAMENTAR, CHEFE]) {
    await comoDono(banco);
    await banco.query('delete from public.feedbacks_mandato');
    await grava(quem, { texto: 'x', feedbacks: CONVERSAS });
    assert.deepEqual(await naTabela(), [{ dados: CONVERSAS }], quem);
    assert.deepEqual(await dadosDoMandato(), { texto: 'x' }, quem);
  }
});

test('coordenação, assessoria e leitura não gravam nem apagam o feedback', async () => {
  await grava(PARLAMENTAR, { feedbacks: CONVERSAS });
  for (const quem of [COORD, ASSESSORIA]) {
    await grava(quem, { texto: 'edição', feedbacks: [{ id: 'invasor' }] });
    assert.deepEqual(await naTabela(), [{ dados: CONVERSAS }], quem);
    await grava(quem, { texto: 'edição sem a chave' });
    assert.deepEqual(await naTabela(), [{ dados: CONVERSAS }], quem);
    assert.deepEqual(await dadosDoMandato(), { texto: quem === COORD ? 'edição sem a chave' : 'edição sem a chave' });
  }
});

test('só parlamentar e chefe leem a tabela; os outros e a equipe Legisla veem zero linhas', async () => {
  await grava(PARLAMENTAR, { feedbacks: CONVERSAS });
  const leitura = async (u: string) => { await como(banco, u); return (await q('select dados from public.feedbacks_mandato')).length; };
  assert.equal(await leitura(PARLAMENTAR), 1);
  assert.equal(await leitura(CHEFE), 1);
  for (const u of [COORD, ASSESSORIA, LEITOR, IDS.admin, IDS.fora]) assert.equal(await leitura(u), 0, u);
  await como(banco, COORD);
  const r = await banco.query('update public.feedbacks_mandato set dados = $1::jsonb', [JSON.stringify([])]);
  assert.equal(r.affectedRows, 0);
  assert.equal((await banco.query('delete from public.feedbacks_mandato')).affectedRows, 0);
});

test('o texto do feedback não aparece em mandatos.dados para ninguém', async () => {
  await grava(CHEFE, { feedbacks: CONVERSAS });
  for (const u of [PARLAMENTAR, CHEFE, COORD, ASSESSORIA, LEITOR, IDS.admin]) {
    await como(banco, u);
    const [r] = await q<{ dados: Record<string, unknown> }>('select dados from public.mandatos where id = $1', [A]);
    assert.ok(!('feedbacks' in r.dados), u);
  }
});

test('v_panorama conta as conversas para a equipe Legisla sem expor o texto', async () => {
  await grava(PARLAMENTAR, { feedbacks: [{ id: 1 }, { id: 2 }, { id: 3 }] });
  await como(banco, IDS.admin);
  const r = await q<{ feedbacks: number }>('select feedbacks from public.v_panorama where id = $1', [A]);
  assert.equal(Number(r[0].feedbacks), 3);
  await como(banco, COORD);
  assert.equal(Number((await q<{ feedbacks: number }>('select feedbacks from public.v_panorama where id = $1', [A]))[0].feedbacks), 3);
});

test('migração: o que estava em dados.feedbacks passa a valer só na tabela', async () => {
  const sql = `insert into public.feedbacks_mandato (mandato_id, dados)
               select m.id, m.dados->'feedbacks' from public.mandatos m where m.dados ? 'feedbacks'`;
  await comoDono(banco);
  assert.ok(sql.length > 0);
  await banco.query(`insert into public.feedbacks_mandato (mandato_id, dados) values ($1, '[]')`, [A]);
  await como(banco, PARLAMENTAR);
  assert.equal((await q('select 1 from public.feedbacks_mandato')).length, 1);
});

// ---------- um e-mail, um mandato ----------
test('quem já está em um mandato não entra em outro por inserção direta', async () => {
  await comPerfil(banco, ASSESSORIA);
  await como(banco, ASSESSORIA);
  await assert.rejects(
    banco.query(`insert into public.membros (mandato_id, user_id, nome, papel) values ($1,$2,'X','coordenacao')`, [B, ASSESSORIA]),
    /já está vinculado a um mandato/);
});

test('quem já está em um mandato não cria outro; conta livre cria', async () => {
  const cria = (u: string, codigo: string) =>
    como(banco, u).then(() => banco.query(
      `insert into public.mandatos (codigo, nome_parlamentar, cargo, uf, criado_por) values ($1,'P','Vereador','RJ',$2)`, [codigo, u]));
  await comPerfil(banco, COORD);
  await comPerfil(banco, NOVA);
  await assert.rejects(cria(COORD, 'ZZZ001'), /row-level security/);
  await cria(NOVA, 'ZZZ002');
});

test('convite_aceitar devolve outro_mandato a quem já está em outro e não consome o convite', async () => {
  await comPerfil(banco, ASSESSORIA);
  await comoDono(banco);
  await banco.query(`insert into public.consentimentos (user_id) values ($1)`, [ASSESSORIA]).catch(() => undefined);
  await banco.query(
    `insert into public.convites (mandato_id, token_hash, nome, papel, criado_por, criado_por_nome, expira_em)
     values ($1, sha256(convert_to('tk-b','UTF8')), 'Fulano', 'assessoria', $2, 'Chefe B', now() + interval '7 days')`,
    [B, IDS.admin]);
  await banco.query(`insert into public.membros (mandato_id, user_id, nome, papel) values ($1,$2,'Dona B','coordenacao')`, [B, NOVA]);
  await banco.query(`update public.convites set criado_por = $1 where mandato_id = $2`, [NOVA, B]);
  await como(banco, ASSESSORIA);
  const [r] = await q<{ r: Record<string, unknown> }>(`select public.convite_aceitar('tk-b', null) r`);
  assert.deepEqual(r.r, { ok: false, erro: 'outro_mandato' });
  await comoDono(banco);
  assert.equal((await q<{ usado_em: unknown }>('select usado_em from public.convites where mandato_id = $1', [B]))[0].usado_em, null);
});

test('admin da equipe Legisla passa da regra: adiciona a mesma conta a outro mandato', async () => {
  await como(banco, IDS.admin);
  await banco.query('select public.admin_membro_adicionar($1,$2,$3)', [B, COORD, 'parlamentar']);
  await comoDono(banco);
  assert.equal((await q('select 1 from public.membros where user_id = $1', [COORD])).length, 2);
});
