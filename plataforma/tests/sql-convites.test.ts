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

// ---------- T8: convite_criar ----------

const SEM_PERMISSAO = { code: '42501', message: /^Você não tem permissão para esta ação\.$/ };
const PAPEL_MAIOR = { message: /^Você só pode convidar com papel igual ou menor que o seu\.$/ };
const NOME_INVALIDO = { message: /^Informe um nome de até 80 caracteres\.$/ };
const EMAIL_INVALIDO = { message: /^E-mail inválido\.$/ };
const VINTE_PENDENTES = { message: /^Este mandato já tem 20 convites pendentes\. Cancele algum para criar outro\.$/ };

interface Criado { id: string; token: string; expira_em: string }
const criar = async (nome: string | null, papel: string, email: string | null = null, mandato: string = IDS.mandatoA) =>
  (await q<{ r: Criado }>('select public.convite_criar($1, $2, $3, $4) r', [mandato, nome, email, papel]))[0].r;
const convitesDoBanco = async () => {
  await comoDono(banco);
  return q<{ id: string; mandato_id: string; nome: string; email: string | null; papel: string; criado_por: string; criado_por_nome: string }>(
    'select id, mandato_id, nome, email, papel, criado_por, criado_por_nome from public.convites order by criado_em, nome');
};
const historico = async () => {
  await comoDono(banco);
  return q('select mandato_id, ator_id, ator_nome, tipo, alvo_id, alvo_nome, papel from public.eventos_equipe order by id');
};
const totalEventos = async () => {
  await comoDono(banco);
  return (await q<{ n: number }>('select count(*)::int n from public.eventos'))[0].n;
};
const quebraHistorico = async () => {
  await comoDono(banco);
  await banco.exec(`
    create or replace function public.quebra_historico() returns trigger language plpgsql as $$ begin raise exception 'histórico indisponível'; end; $$;
    create trigger falha_historico before insert on public.eventos_equipe for each row execute function public.quebra_historico();
  `);
};

test('convite_criar devolve id, token de 22 caracteres e expira_em 7 dias depois da criação (ACE-01.1, ACE-01.4)', async () => {
  await como(banco, IDS.membro);
  const r = await criar('Carlos Lima', 'assessoria');
  assert.deepEqual(Object.keys(r).sort(), ['expira_em', 'id', 'token']);
  assert.match(r.token, /^[A-Za-z0-9_-]{22}$/);
  await comoDono(banco);
  const [linha] = await q<{ id: string; mandato_id: string; nome: string; papel: string; criado_por: string; criado_por_nome: string;
    expira_em: Date; sete_dias: boolean; agora: boolean }>(
    `select id, mandato_id, nome, papel, criado_por, criado_por_nome, expira_em,
            expira_em - criado_em = interval '7 days' sete_dias, abs(extract(epoch from now() - criado_em)) < 60 agora
       from public.convites`);
  assert.deepEqual(
    { ...linha, expira_em: linha.expira_em.toISOString() },
    { id: r.id, mandato_id: IDS.mandatoA, nome: 'Carlos Lima', papel: 'assessoria', criado_por: IDS.membro, criado_por_nome: 'Mario Membro',
      expira_em: new Date(r.expira_em).toISOString(), sete_dias: true, agora: true });
});

test('a linha guarda só o sha256 do token e nenhuma coluna de nenhuma tabela contém o token em texto (ACE-01.2)', async () => {
  await como(banco, ASSESSORIA);
  const { token } = await criar('Carlos Lima', 'leitura', 'carlos@exemplo.com');
  await comoDono(banco);
  assert.deepEqual(await q(`select token_hash = sha256(convert_to($1, 'UTF8')) confere from public.convites`, [token]), [{ confere: true }]);
  const tabelas = await q<{ s: string; t: string }>(
    `select table_schema s, table_name t from information_schema.tables
      where table_schema in ('public', 'private', 'auth') and table_type = 'BASE TABLE' order by 1, 2`);
  assert.ok(tabelas.some((x) => x.t === 'convites') && tabelas.some((x) => x.t === 'eventos_equipe'), 'varredura sem as tabelas de convite');
  const comToken: string[] = [];
  for (const { s, t } of tabelas) {
    const [{ n }] = await q<{ n: number }>(`select count(*)::int n from "${s}"."${t}" x where strpos(x::text, $1) > 0`, [token]);
    if (n > 0) comToken.push(`${s}.${t}`);
  }
  assert.deepEqual(comToken, []);
});

test('e-mail preenchido é guardado em minúsculas e sem espaços nas pontas; vazio ou ausente fica nulo (ACE-01.5)', async () => {
  await como(banco, IDS.membro);
  await criar('Um', 'leitura', '  Carlos.Lima@Exemplo.COM ');
  await criar('Dois', 'leitura', null);
  await criar('Tres', 'leitura', '   ');
  assert.deepEqual(Object.fromEntries((await convitesDoBanco()).map((x) => [x.nome, x.email])),
    { Um: 'carlos.lima@exemplo.com', Dois: null, Tres: null });
});

test('papel maior que o de quem convida recusa com a mensagem da spec e não cria linha (ACE-01.6)', async () => {
  await como(banco, ASSESSORIA);
  await assert.rejects(criar('Carlos Lima', 'coordenacao'), PAPEL_MAIOR);
  await como(banco, LEITOR);
  for (const papel of ['assessoria', 'coordenacao']) await assert.rejects(criar('Carlos Lima', papel), PAPEL_MAIOR, papel);
  assert.deepEqual(await convitesDoBanco(), []);
  assert.deepEqual(await historico(), []);
});

test('cada papel convida com papel igual ou menor que o seu: coordenação os três, assessoria dois, leitura só leitura (ACE-01.6, ACE-04.9)', async () => {
  const permitidos: [string, string[]][] = [
    [IDS.membro, ['coordenacao', 'assessoria', 'leitura']], [ASSESSORIA, ['assessoria', 'leitura']], [LEITOR, ['leitura']],
  ];
  for (const [quem, papeis] of permitidos) {
    await como(banco, quem);
    for (const papel of papeis) await criar(`Convidado ${papel}`, papel);
  }
  const r = await convitesDoBanco();
  assert.deepEqual(r.map((x) => [x.criado_por, x.papel]), [
    [IDS.membro, 'coordenacao'], [IDS.membro, 'assessoria'], [IDS.membro, 'leitura'],
    [ASSESSORIA, 'assessoria'], [ASSESSORIA, 'leitura'], [LEITOR, 'leitura'],
  ]);
});

test('nome vazio, só com espaços, ausente ou com 81 caracteres recusa com a mensagem da spec; 80 caracteres passa (ACE-01.7)', async () => {
  await como(banco, IDS.membro);
  for (const nome of ['', '   ', null, 'x'.repeat(81)]) await assert.rejects(criar(nome, 'leitura'), NOME_INVALIDO, String(nome));
  assert.deepEqual(await convitesDoBanco(), []);
  await como(banco, IDS.membro);
  await criar('x'.repeat(80), 'leitura');
  assert.equal((await convitesDoBanco()).length, 1);
});

test('e-mail sem @, com espaço interno, com dois @ ou com 255 caracteres recusa com "E-mail inválido."; 254 passa (ACE-01.8)', async () => {
  const email254 = `${'a'.repeat(242)}@exemplo.com`;
  await como(banco, IDS.membro);
  for (const email of ['carlos', 'carlos lima@exemplo.com', 'carlos@@exemplo.com', `a${email254}`]) {
    await assert.rejects(criar('Carlos Lima', 'leitura', email), EMAIL_INVALIDO, email);
  }
  assert.deepEqual(await convitesDoBanco(), []);
  await como(banco, IDS.membro);
  await criar('Carlos Lima', 'leitura', email254);
  assert.deepEqual((await convitesDoBanco()).map((x) => x.email), [email254]);
});

test('o 20º convite pendente passa e o 21º recusa; vencidos, cancelados, usados e de outro mandato não contam (ACE-01.9)', async () => {
  for (let i = 1; i <= 19; i++) await insereConvite({ nome: `Pendente ${i}` });
  await insereConvite({ nome: 'Vencido', criado: '-8 days', expira: '-1 day' });
  await insereConvite({ nome: 'Cancelado', cancelado: '-1 hour' });
  await insereConvite({ nome: 'Usado', usado: '-1 hour', usadoPor: IDS.fora });
  await insereConvite({ nome: 'Outro mandato', mandato: IDS.mandatoB, por: COORD_B });
  await como(banco, IDS.membro);
  await criar('Vigésimo', 'leitura');
  await como(banco, IDS.membro);
  await assert.rejects(criar('Vigésimo primeiro', 'leitura'), VINTE_PENDENTES);
  await comoDono(banco);
  const [{ n }] = await q<{ n: number }>(
    `select count(*)::int n from public.convites
      where mandato_id = $1 and usado_em is null and cancelado_em is null and expira_em > now()`, [IDS.mandatoA]);
  assert.equal(n, 20);
  assert.equal((await q(`select 1 from public.convites where nome = 'Vigésimo primeiro'`)).length, 0);
});

test('quem não é membro do mandato recebe erro de permissão e nada é criado; anon não executa (ACE-01.10)', async () => {
  for (const quem of [IDS.fora, COORD_B, IDS.admin]) {
    await como(banco, quem);
    await assert.rejects(criar('Carlos Lima', 'leitura'), SEM_PERMISSAO, quem);
  }
  await como(banco, null);
  await assert.rejects(criar('Carlos Lima', 'leitura'), NEGADO);
  assert.deepEqual(await convitesDoBanco(), []);
  assert.deepEqual(await historico(), []);
});

test('criar apaga, no mesmo mandato, vencidos ou cancelados há mais de 30 dias; os de 29 dias, os usados e os de outro mandato ficam (ACE-01.11)', async () => {
  await insereConvite({ nome: 'Vencido 31', criado: '-38 days', expira: '-31 days' });
  await insereConvite({ nome: 'Cancelado 31', criado: '-35 days', expira: '-28 days', cancelado: '-31 days' });
  await insereConvite({ nome: 'Vencido 29', criado: '-36 days', expira: '-29 days' });
  await insereConvite({ nome: 'Cancelado 29', criado: '-30 days', expira: '-23 days', cancelado: '-29 days' });
  await insereConvite({ nome: 'Usado antigo', criado: '-60 days', expira: '-53 days', usado: '-58 days', usadoPor: IDS.fora });
  await insereConvite({ nome: 'Pendente', criado: '-1 day', expira: '6 days' });
  await insereConvite({ nome: 'B vencido 31', mandato: IDS.mandatoB, por: COORD_B, criado: '-38 days', expira: '-31 days' });
  await insereConvite({ nome: 'B cancelado 31', mandato: IDS.mandatoB, por: COORD_B, criado: '-35 days', expira: '-28 days', cancelado: '-31 days' });
  await como(banco, ASSESSORIA);
  await criar('Novo', 'leitura');
  const r = await convitesDoBanco();
  assert.deepEqual(r.filter((x) => x.mandato_id === IDS.mandatoA).map((x) => x.nome).sort(),
    ['Cancelado 29', 'Novo', 'Pendente', 'Usado antigo', 'Vencido 29']);
  assert.deepEqual(r.filter((x) => x.mandato_id === IDS.mandatoB).map((x) => x.nome).sort(), ['B cancelado 31', 'B vencido 31']);
});

test('criar grava convite_criado com ator, alvo e papel, e nenhuma linha em eventos (ACE-06.1, ACE-06.5)', async () => {
  await como(banco, ASSESSORIA);
  await criar('Carlos Lima', 'leitura', 'carlos@exemplo.com');
  assert.deepEqual(await historico(), [{
    mandato_id: IDS.mandatoA, ator_id: ASSESSORIA, ator_nome: 'Alice Assessoria', tipo: 'convite_criado',
    alvo_id: null, alvo_nome: 'Carlos Lima', papel: 'leitura',
  }]);
  assert.equal(await totalEventos(), 0);
});

test('se a gravação do histórico falhar, nenhum convite é criado e a limpeza é desfeita (ACE-06.1, ACE-06.3)', async () => {
  await insereConvite({ nome: 'Vencido 31', criado: '-38 days', expira: '-31 days' });
  await quebraHistorico();
  await como(banco, IDS.membro);
  await assert.rejects(criar('Carlos Lima', 'leitura'), /histórico indisponível/);
  assert.deepEqual((await convitesDoBanco()).map((x) => x.nome), ['Vencido 31']);
});
