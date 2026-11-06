// Acesso, equipe e convites: convites por link pessoal (ACE-01, ACE-02, ACE-04, ACE-06, ACE-07), no PGlite.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { criaBanco, como, comoDono, semente, IDS } from './sql-ambiente.ts';
import type { Banco } from './sql-ambiente.ts';

// Mandato A: IDS.membro (coordenação), ASSESSORIA e LEITOR. Mandato B: COORD_B.
const ASSESSORIA = '00000000-0000-4000-8000-0000000000c1';
const LEITOR = '00000000-0000-4000-8000-0000000000c2';
const COORD_B = '00000000-0000-4000-8000-0000000000c3';
const NEGADO = /permission denied/;
const TABELAS = ['convites', 'convite_tentativas', 'convite_bloqueios'] as const;

let banco: Banco;
before(async () => { banco = await criaBanco(); });
after(async () => { await banco.close(); });

beforeEach(async () => {
  await comoDono(banco);
  await banco.exec('drop trigger if exists falha_historico on public.eventos_equipe');
  await banco.query("select set_config('request.headers', '', false)");
  await banco.exec(`truncate public.eventos, public.membros, public.equipe_legisla, public.mandatos, auth.users,
                    public.convites, public.convite_tentativas, public.convite_bloqueios cascade`);
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

// Convite gravado direto pelo dono. Datas são deslocamentos a partir de agora ('-31 days'); nulo = sem data.
interface ConviteTeste {
  mandato: string; token: string; nome: string; email: string | null; papel: string; por: string | null; porNome: string | null;
  criado: string; expira: string; usado: string | null; usadoPor: string | null; cancelado: string | null;
}
let seq = 0;
async function insereConvite(c: Partial<ConviteTeste> = {}): Promise<string> {
  const v: ConviteTeste = {
    mandato: IDS.mandatoA, token: `token-de-teste-${++seq}`, nome: 'Carlos Lima', email: null, papel: 'assessoria',
    por: IDS.membro, porNome: 'Mario Membro', criado: '0', expira: '7 days', usado: null, usadoPor: null, cancelado: null, ...c,
  };
  await comoDono(banco);
  const r = await q<{ id: string }>(
    `insert into public.convites (mandato_id, token_hash, nome, email, papel, criado_por, criado_por_nome,
                                  criado_em, expira_em, usado_em, usado_por, cancelado_em)
     values ($1, sha256(convert_to($2, 'UTF8')), $3, $4, $5, $6, $7,
             now() + $8::interval, now() + $9::interval, now() + $10::interval, $11, now() + $12::interval)
     returning id`,
    [v.mandato, v.token, v.nome, v.email, v.papel, v.por, v.porNome, v.criado, v.expira, v.usado, v.usadoPor, v.cancelado],
  );
  return r[0].id;
}

// ---------- T7: tabelas de convite e gerador de token ----------

// Uma linha em cada tabela, para provar que tentativas negadas não mudam nada.
async function linhaEmCada() {
  await insereConvite({ token: 'existente' });
  await banco.exec(`insert into public.convite_tentativas (origem) values ('9.9.9.9');
                    insert into public.convite_bloqueios (origem, ate) values ('9.9.9.9', now() + interval '15 minutes');`);
}
const estadoDasTabelas = async () => {
  await comoDono(banco);
  return q(`select (select string_agg(nome || papel, ',') from public.convites) c,
                   (select string_agg(origem, ',') from public.convite_tentativas) t,
                   (select string_agg(origem, ',') from public.convite_bloqueios) b`);
};
const ESCRITAS: Record<(typeof TABELAS)[number], string[]> = {
  convites: [
    `insert into public.convites (mandato_id, token_hash, nome, papel, expira_em) values ('${IDS.mandatoA}', '\\x00', 'Intruso', 'coordenacao', now() + interval '7 days')`,
    `update public.convites set papel = 'coordenacao'`,
    'delete from public.convites',
  ],
  convite_tentativas: [
    `insert into public.convite_tentativas (origem) values ('1.2.3.4')`,
    `update public.convite_tentativas set origem = 'outra'`,
    'delete from public.convite_tentativas',
  ],
  convite_bloqueios: [
    `insert into public.convite_bloqueios (origem, ate) values ('1.2.3.4', now())`,
    `update public.convite_bloqueios set ate = now()`,
    'delete from public.convite_bloqueios',
  ],
};

async function provaSemAcesso(quem: string | null) {
  await como(banco, quem);
  for (const t of TABELAS) {
    await assert.rejects(banco.query(`select * from public.${t}`), NEGADO, `${quem} select ${t}`);
    for (const sql of ESCRITAS[t]) await assert.rejects(banco.query(sql), NEGADO, `${quem}: ${sql}`);
  }
}

test('anon não faz select, insert, update nem delete em convites, convite_tentativas e convite_bloqueios', async () => {
  await linhaEmCada();
  const antes = await estadoDasTabelas();
  await provaSemAcesso(null);
  assert.deepEqual(await estadoDasTabelas(), antes);
});

test('authenticated (coordenação, assessoria, leitura e equipe admin do Legisla) não faz select, insert, update nem delete nas três tabelas', async () => {
  await linhaEmCada();
  const antes = await estadoDasTabelas();
  for (const quem of [IDS.membro, ASSESSORIA, LEITOR, IDS.admin]) await provaSemAcesso(quem);
  assert.deepEqual(await estadoDasTabelas(), antes);
});

const milTokens = async () => {
  await comoDono(banco);
  return (await q<{ t: string }>('select private.token_aleatorio() t from generate_series(1, 1000)')).map((x) => x.t);
};

test('private.token_aleatorio devolve 22 caracteres de A-Za-z0-9_- e 1000 chamadas não repetem valor (ACE-01.2)', async () => {
  const tokens = await milTokens();
  assert.equal(tokens.length, 1000);
  for (const t of tokens) assert.match(t, /^[A-Za-z0-9_-]{22}$/);
  assert.equal(new Set(tokens).size, 1000);
});

test('private.token_aleatorio carrega 128 bits plenos: decodifica em 16 bytes e nenhum dos 128 bits fica fixo em 1000 tokens (ACE-01.2)', async () => {
  const bytes = (await milTokens()).map((t) => {
    const b = Buffer.from(t, 'base64url');
    assert.equal(b.length, 16, t);
    assert.equal(b.toString('base64url'), t, `${t} não é base64url canônico`);
    return b;
  });
  // os bits fixos de versão e variante de um UUID v4 apareceriam aqui como bits constantes
  const fixos: number[] = [];
  for (let bit = 0; bit < 128; bit++) {
    const valores = new Set(bytes.map((b) => (b[bit >> 3] >> (7 - (bit & 7))) & 1));
    if (valores.size < 2) fixos.push(bit);
  }
  assert.deepEqual(fixos, []);
});

test('convites.nome aceita de 1 a 80 caracteres e recusa vazio e 81 (ACE-01.7)', async () => {
  for (const nome of ['', 'x'.repeat(81)]) {
    await assert.rejects(insereConvite({ nome }), /convites_nome_check/, `${nome.length}`);
  }
  await insereConvite({ nome: 'x' });
  await insereConvite({ nome: 'x'.repeat(80) });
  assert.deepEqual((await q<{ n: number }>('select char_length(nome) n from public.convites order by 1')).map((x) => x.n), [1, 80]);
});

test('convites.papel aceita só coordenacao, assessoria e leitura', async () => {
  for (const papel of ['titular', 'admin', 'Coordenacao', '']) {
    await assert.rejects(insereConvite({ papel }), /convites_papel_check/, papel);
  }
  for (const papel of ['coordenacao', 'assessoria', 'leitura']) await insereConvite({ papel });
  assert.deepEqual((await q<{ papel: string }>('select papel from public.convites order by papel')).map((x) => x.papel),
    ['assessoria', 'coordenacao', 'leitura']);
});

test('convites.email é opcional e aceita até 254 caracteres (ACE-01.8)', async () => {
  const email254 = `${'a'.repeat(242)}@exemplo.com`;
  assert.equal(email254.length, 254);
  await assert.rejects(insereConvite({ email: `a${email254}` }), /convites_email_check/);
  await insereConvite({ email: email254 });
  await insereConvite({ email: null });
  assert.equal((await q('select * from public.convites')).length, 2);
});

test('convites: usado_em e cancelado_em nunca juntos, nem na inserção nem depois', async () => {
  await assert.rejects(insereConvite({ usado: '0', usadoPor: LEITOR, cancelado: '0' }), /convites_usado_ou_cancelado/);
  const usado = await insereConvite({ usado: '0', usadoPor: LEITOR });
  const cancelado = await insereConvite({ cancelado: '0' });
  await assert.rejects(banco.query('update public.convites set cancelado_em = now() where id = $1', [usado]), /convites_usado_ou_cancelado/);
  await assert.rejects(banco.query('update public.convites set usado_em = now() where id = $1', [cancelado]), /convites_usado_ou_cancelado/);
  const r = await q<{ id: string; u: boolean; c: boolean }>(
    'select id, usado_em is not null u, cancelado_em is not null c from public.convites');
  assert.deepEqual(Object.fromEntries(r.map((x) => [x.id, [x.u, x.c]])), { [usado]: [true, false], [cancelado]: [false, true] });
});

test('convites.token_hash é único', async () => {
  await insereConvite({ token: 'mesmo-token' });
  await assert.rejects(insereConvite({ token: 'mesmo-token', mandato: IDS.mandatoB }), /convites_token_hash_key/);
  assert.equal((await q('select * from public.convites')).length, 1);
});
