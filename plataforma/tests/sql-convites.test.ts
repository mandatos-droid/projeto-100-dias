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

// ---------- T9: convites_pendentes ----------

interface Pendente { id: string; nome: string; papel: string; convidado_por_nome: string; expira_em: Date }
const pendentes = (mandato: string = IDS.mandatoA) => banco.query<Pendente>('select * from public.convites_pendentes($1)', [mandato]);
const porNome = (r: Pendente[]) => [...r].sort((a, b) => a.nome.localeCompare(b.nome))
  .map((x) => ({ ...x, expira_em: x.expira_em.toISOString() }));
// os cinco estados do convite no mandato A e um pendente no mandato B
async function cenarioPendentes() {
  const ids = {
    p1: await insereConvite({ nome: 'Pendente Um', papel: 'leitura', por: LEITOR, porNome: 'Leo Leitor', expira: '2 days' }),
    p2: await insereConvite({ nome: 'Pendente Dois', papel: 'coordenacao', expira: '7 days' }),
  };
  await insereConvite({ nome: 'Vencido', criado: '-7 days', expira: '-1 second' });
  await insereConvite({ nome: 'Cancelado', cancelado: '-1 minute' });
  await insereConvite({ nome: 'Usado', usado: '-1 minute', usadoPor: IDS.fora });
  await insereConvite({ nome: 'De outro mandato', mandato: IDS.mandatoB, por: COORD_B, porNome: 'Bia Coord' });
  await comoDono(banco);
  const exp = Object.fromEntries((await q<{ nome: string; e: Date }>('select nome, expira_em e from public.convites')).map((x) => [x.nome, x.e.toISOString()]));
  return { ids, exp };
}

test('convites_pendentes lista só os não vencidos, não cancelados e não usados do mandato, com nome, papel, quem convidou e validade (ACE-04.2)', async () => {
  const { ids, exp } = await cenarioPendentes();
  await como(banco, IDS.membro);
  assert.deepEqual(porNome((await pendentes()).rows), [
    { id: ids.p2, nome: 'Pendente Dois', papel: 'coordenacao', convidado_por_nome: 'Mario Membro', expira_em: exp['Pendente Dois'] },
    { id: ids.p1, nome: 'Pendente Um', papel: 'leitura', convidado_por_nome: 'Leo Leitor', expira_em: exp['Pendente Um'] },
  ]);
});

test('assessoria e leitura do mandato recebem a mesma lista de pendentes (ACE-04.2)', async () => {
  await cenarioPendentes();
  await como(banco, IDS.membro);
  const daCoordenacao = porNome((await pendentes()).rows);
  assert.equal(daCoordenacao.length, 2);
  for (const quem of [ASSESSORIA, LEITOR]) {
    await como(banco, quem);
    assert.deepEqual(porNome((await pendentes()).rows), daCoordenacao, quem);
  }
});

test('um convite recém-criado aparece nos pendentes com quem convidou e a validade devolvida na criação (ACE-04.2)', async () => {
  await como(banco, ASSESSORIA);
  const c = await criar('Carlos Lima', 'leitura');
  await como(banco, LEITOR);
  assert.deepEqual(porNome((await pendentes()).rows), [
    { id: c.id, nome: 'Carlos Lima', papel: 'leitura', convidado_por_nome: 'Alice Assessoria', expira_em: new Date(c.expira_em).toISOString() },
  ]);
});

test('o retorno de convites_pendentes não tem hash, token nem e-mail: só as cinco colunas (ACE-01.3)', async () => {
  await como(banco, IDS.membro);
  const { token } = await criar('Carlos Lima', 'leitura', 'carlos.lima@exemplo.com');
  await como(banco, IDS.membro);
  const r = await pendentes();
  assert.deepEqual(r.fields.map((f) => f.name), ['id', 'nome', 'papel', 'convidado_por_nome', 'expira_em']);
  assert.equal(r.rows.length, 1);
  const texto = JSON.stringify(r.rows);
  assert.ok(!texto.includes(token), 'token na listagem');
  assert.ok(!texto.includes('carlos.lima@exemplo.com'), 'e-mail na listagem');
});

test('quem não é membro do mandato recebe erro de permissão em convites_pendentes', async () => {
  await cenarioPendentes();
  for (const quem of [IDS.fora, COORD_B, IDS.admin]) {
    await como(banco, quem);
    await assert.rejects(pendentes(), SEM_PERMISSAO, quem);
  }
});

test('anon não executa convites_pendentes', async () => {
  await cenarioPendentes();
  await como(banco, null);
  await assert.rejects(pendentes(), NEGADO);
});

// ---------- T10: convite_cancelar ----------

const cancelar = (id: string) => banco.query('select public.convite_cancelar($1)', [id]);
const nomesPendentes = async () => {
  await comoDono(banco);
  return (await q<{ nome: string }>(
    `select nome from public.convites where usado_em is null and cancelado_em is null and expira_em > now() order by nome`)).map((x) => x.nome);
};

test('quem criou o convite (assessoria ou leitura) cancela o próprio e ele some dos pendentes (ACE-04.3, ACE-04.4)', async () => {
  for (const quem of [ASSESSORIA, LEITOR]) {
    await como(banco, quem);
    const { id } = await criar(`Convite de ${quem}`, 'leitura');
    await como(banco, quem);
    await cancelar(id);
    await como(banco, quem);
    assert.deepEqual((await pendentes()).rows, [], quem);
    await comoDono(banco);
    assert.deepEqual(await q('select cancelado_em is not null cancelado, cancelado_por from public.convites where id = $1', [id]),
      [{ cancelado: true, cancelado_por: quem }]);
  }
});

test('a coordenação cancela convite criado por outra pessoa (ACE-04.4)', async () => {
  await como(banco, LEITOR);
  const { id } = await criar('Carlos Lima', 'leitura');
  await como(banco, IDS.membro);
  await cancelar(id);
  assert.deepEqual(await nomesPendentes(), []);
  assert.deepEqual(await q('select cancelado_por from public.convites where id = $1', [id]), [{ cancelado_por: IDS.membro }]);
});

test('assessoria ou leitura que não criou o convite recebe erro de permissão e o convite continua pendente (ACE-04.5)', async () => {
  await como(banco, IDS.membro);
  const daCoordenacao = (await criar('Da coordenação', 'assessoria')).id;
  await como(banco, LEITOR);
  const doLeitor = (await criar('Do leitor', 'leitura')).id;
  await como(banco, ASSESSORIA);
  await assert.rejects(cancelar(daCoordenacao), SEM_PERMISSAO);
  await assert.rejects(cancelar(doLeitor), SEM_PERMISSAO);
  await como(banco, LEITOR);
  await assert.rejects(cancelar(daCoordenacao), SEM_PERMISSAO);
  assert.deepEqual(await nomesPendentes(), ['Da coordenação', 'Do leitor']);
});

test('quem não é membro do mandato e convite inexistente dão erro de permissão; anon não executa; nada é cancelado', async () => {
  await como(banco, IDS.membro);
  const { id } = await criar('Carlos Lima', 'leitura');
  for (const quem of [IDS.fora, COORD_B, IDS.admin]) {
    await como(banco, quem);
    await assert.rejects(cancelar(id), SEM_PERMISSAO, quem);
  }
  await como(banco, IDS.membro);
  await assert.rejects(cancelar('00000000-0000-4000-8000-00000000ffff'), SEM_PERMISSAO);
  await como(banco, null);
  await assert.rejects(cancelar(id), NEGADO);
  assert.deepEqual(await nomesPendentes(), ['Carlos Lima']);
});

test('cancelar grava convite_cancelado com ator, alvo e papel, e nenhuma linha em eventos (ACE-06.1, ACE-06.5)', async () => {
  const id = await insereConvite({ nome: 'Carlos Lima', papel: 'assessoria', por: LEITOR, porNome: 'Leo Leitor' });
  await como(banco, IDS.membro);
  await cancelar(id);
  assert.deepEqual(await historico(), [{
    mandato_id: IDS.mandatoA, ator_id: IDS.membro, ator_nome: 'Mario Membro', tipo: 'convite_cancelado',
    alvo_id: null, alvo_nome: 'Carlos Lima', papel: 'assessoria',
  }]);
  assert.equal(await totalEventos(), 0);
});

test('se a gravação do histórico falhar, o cancelamento é desfeito e o convite continua pendente (ACE-06.1, ACE-06.3)', async () => {
  const id = await insereConvite({ nome: 'Carlos Lima' });
  await quebraHistorico();
  await como(banco, IDS.membro);
  await assert.rejects(cancelar(id), /histórico indisponível/);
  assert.deepEqual(await nomesPendentes(), ['Carlos Lima']);
});

test('convite já usado continua usado: cancelar não reverte o estado final nem grava histórico', async () => {
  const id = await insereConvite({ nome: 'Carlos Lima', usado: '-1 hour', usadoPor: IDS.fora });
  await como(banco, IDS.membro);
  await cancelar(id);
  await comoDono(banco);
  assert.deepEqual(await q('select usado_por, cancelado_em from public.convites where id = $1', [id]), [{ usado_por: IDS.fora, cancelado_em: null }]);
  assert.deepEqual(await historico(), []);
});

// ---------- T11: convite_previa e limite de tentativas ----------

const INVALIDO = { ok: false, erro: 'invalido' };
const LIMITE = { ok: false, erro: 'limite' };
const previa = async (token: string | null) => (await q<{ r: Record<string, unknown> }>('select public.convite_previa($1) r', [token]))[0].r;
// simula o cabeçalho que o PostgREST repassa; vale para a sessão, em qualquer papel
const cabecalhos = (valor: string) => banco.query("select set_config('request.headers', $1, false)", [valor]);
const vindoDe = (xff: string) => cabecalhos(JSON.stringify({ 'x-forwarded-for': xff }));
const tentativas = async () => {
  await comoDono(banco);
  return (await q<{ origem: string }>('select origem from public.convite_tentativas order by em')).map((x) => x.origem);
};
// o relógio anda: tentativas e bloqueios ficam mais antigos
const passam = async (intervalo: string) => {
  await comoDono(banco);
  await banco.query('update public.convite_tentativas set em = em - $1::interval', [intervalo]);
  await banco.query('update public.convite_bloqueios set ate = ate - $1::interval', [intervalo]);
};
const falhas = async (n: number) => {
  const r = [];
  for (let i = 0; i < n; i++) r.push(await previa(`token-que-nao-existe-${i}`));
  return r;
};

test('convite válido devolve nome, papel, quem convidou, mandato e exige_email, e abrir não consome (ACE-02.1)', async () => {
  await insereConvite({ token: 'token-sem-email', nome: 'Carlos Lima', papel: 'assessoria' });
  await insereConvite({ token: 'token-com-email', nome: 'Dora Dias', papel: 'leitura', email: 'dora@exemplo.com', por: LEITOR, porNome: 'Leo Leitor' });
  await como(banco, null);
  const mandato = { nome_parlamentar: 'Parlamentar Um', cargo: 'Deputada Federal', uf: 'SP' };
  for (let vez = 0; vez < 2; vez++) {
    assert.deepEqual(await previa('token-sem-email'),
      { ok: true, nome: 'Carlos Lima', papel: 'assessoria', convidado_por: 'Mario Membro', mandato, exige_email: false });
    assert.deepEqual(await previa('token-com-email'),
      { ok: true, nome: 'Dora Dias', papel: 'leitura', convidado_por: 'Leo Leitor', mandato, exige_email: true });
  }
  assert.deepEqual(await nomesPendentes(), ['Carlos Lima', 'Dora Dias']);
  assert.deepEqual(await q('select count(*)::int n from public.convites where usado_em is not null or usado_por is not null'), [{ n: 0 }]);
});

test('token inexistente, vencido, cancelado ou usado devolve exatamente {ok:false, erro:"invalido"}, o mesmo nos quatro casos (ACE-02.10, ACE-02.11)', async () => {
  await insereConvite({ token: 'token-vencido', criado: '-8 days', expira: '-1 second' });
  await insereConvite({ token: 'token-cancelado', cancelado: '-1 minute' });
  await insereConvite({ token: 'token-usado', usado: '-1 minute', usadoPor: IDS.fora });
  await como(banco, null);
  const r = [await previa('token-que-nunca-existiu'), await previa('token-vencido'), await previa('token-cancelado'), await previa('token-usado')];
  for (const x of r) assert.deepEqual(x, INVALIDO);
  assert.equal(new Set(r.map((x) => JSON.stringify(x))).size, 1);
});

test('convite cancelado por convite_cancelar deixa de valer na prévia (ACE-02.11, T10)', async () => {
  await como(banco, IDS.membro);
  const { id, token } = await criar('Carlos Lima', 'leitura');
  await como(banco, null);
  assert.equal((await previa(token)).ok, true);
  await como(banco, IDS.membro);
  await cancelar(id);
  await como(banco, null);
  assert.deepEqual(await previa(token), INVALIDO);
});

test('cada falha grava uma linha em convite_tentativas com o primeiro IP de x-forwarded-for: a função devolve dados, não exceção (ACE-02.14)', async () => {
  await insereConvite({ token: 'token-bom' });
  await vindoDe('1.2.3.4, 10.0.0.1');
  await como(banco, null);
  assert.deepEqual(await falhas(3), [INVALIDO, INVALIDO, INVALIDO]);
  await como(banco, null);
  assert.equal((await previa('token-bom')).ok, true);
  assert.deepEqual(await tentativas(), ['1.2.3.4', '1.2.3.4', '1.2.3.4']);
});

test('a 11ª falha em 10 minutos devolve limite, e as chamadas seguintes da origem também, mesmo com token válido; outra origem segue normal (ACE-02.14)', async () => {
  await insereConvite({ token: 'token-bom' });
  await vindoDe('1.2.3.4');
  await como(banco, null);
  assert.deepEqual(await falhas(10), Array(10).fill(INVALIDO));
  assert.deepEqual(await previa('mais-um-token-errado'), LIMITE);
  assert.deepEqual(await previa('token-bom'), LIMITE);
  assert.deepEqual(await previa('outro-token-errado'), LIMITE);
  await vindoDe('5.6.7.8');
  await como(banco, null);
  assert.deepEqual(await previa('token-errado-de-outra-origem'), INVALIDO);
  assert.equal((await previa('token-bom')).ok, true);
});

test('o bloqueio dura 15 minutos: aos 14 ainda recusa, depois dos 15 volta a responder (ACE-02.14)', async () => {
  await insereConvite({ token: 'token-bom' });
  await vindoDe('1.2.3.4');
  await como(banco, null);
  await falhas(11);
  await passam('14 minutes');
  await como(banco, null);
  assert.deepEqual(await previa('token-bom'), LIMITE);
  await passam('61 seconds');
  await como(banco, null);
  assert.equal((await previa('token-bom')).ok, true);
  assert.deepEqual(await previa('token-errado-depois'), INVALIDO);
});

test('falhas com mais de 10 minutos não contam para o limite (ACE-02.14)', async () => {
  await vindoDe('1.2.3.4');
  await como(banco, null);
  await falhas(10);
  await passam('11 minutes');
  await como(banco, null);
  assert.deepEqual(await falhas(10), Array(10).fill(INVALIDO));
  assert.deepEqual(await previa('a-décima-primeira-recente'), LIMITE);
});

test('sem x-forwarded-for (ausente, vazio, sem a chave ou JSON inválido) o limite não se aplica e a função responde normalmente', async () => {
  await insereConvite({ token: 'token-bom' });
  for (const valor of ['', '{}', 'isto não é json', '{"x-forwarded-for":""}']) {
    await cabecalhos(valor);
    await como(banco, null);
    assert.deepEqual(await falhas(12), Array(12).fill(INVALIDO), valor);
    assert.equal((await previa('token-bom')).ok, true, valor);
  }
  assert.deepEqual(await tentativas(), []);
});

test('anon e authenticated executam convite_previa', async () => {
  await insereConvite({ token: 'token-bom' });
  for (const quem of [null, IDS.fora, LEITOR]) {
    await como(banco, quem);
    assert.equal((await previa('token-bom')).ok, true, String(quem));
  }
});

test('nenhuma outra função desta feature é liberada a anon: fora de gatilhos, só convite_previa', async () => {
  await comoDono(banco);
  const r = await q<{ f: string }>(
    `select n.nspname || '.' || p.proname f from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname in ('public', 'private') and p.prorettype <> 'trigger'::regtype
        and has_function_privilege('anon', p.oid, 'execute') order by 1`);
  assert.deepEqual(r.map((x) => x.f), ['public.convite_previa']);
});

// ---------- T12: convite_aceitar ----------

// Contas novas, fora de qualquer mandato: Carlos e Dora (com consentimento, salvo pedido).
const CARLOS = '00000000-0000-4000-8000-0000000000d1';
const DORA = '00000000-0000-4000-8000-0000000000d2';
async function contas(opc: { semConsentimento?: string[]; emailCarlos?: string } = {}) {
  await comoDono(banco);
  await banco.query(
    `insert into auth.users (id, email, raw_user_meta_data) values
       ($1, $3, '{"name":"Carlos Lima"}'), ($2, 'dora@exemplo.com', '{"name":"Dora Dias"}')`,
    [CARLOS, DORA, opc.emailCarlos ?? 'carlos.lima@exemplo.com'],
  );
  for (const id of [CARLOS, DORA]) {
    if (!opc.semConsentimento?.includes(id)) await banco.query(`insert into public.consentimentos (user_id, versao) values ($1, '2026-10')`, [id]);
  }
}
const aceitar = async (token: string | null, nome: string | null = null) =>
  (await q<{ r: Record<string, unknown> }>('select public.convite_aceitar($1, $2) r', [token, nome]))[0].r;
const membrosDe = async (mandato: string = IDS.mandatoA) => {
  await comoDono(banco);
  return Object.fromEntries((await q<{ user_id: string; nome: string; papel: string }>(
    'select user_id, nome, papel from public.membros where mandato_id = $1', [mandato])).map((x) => [x.user_id, `${x.nome}/${x.papel}`]));
};
const estadoDo = async (token: string) => {
  await comoDono(banco);
  return (await q<{ usado: boolean; usado_por: string | null; cancelado: boolean }>(
    `select usado_em is not null usado, usado_por, cancelado_em is not null cancelado
       from public.convites where token_hash = sha256(convert_to($1, 'UTF8'))`, [token]))[0];
};
const MEMBROS_A = {
  [IDS.membro]: 'Mario Membro/coordenacao', [ASSESSORIA]: 'Alice Assessoria/assessoria', [LEITOR]: 'Leo Leitor/leitura',
};
const NAO_USADO = { usado: false, usado_por: null, cancelado: false };

test('aceite válido inclui a pessoa com o papel do convite, marca usado_em e usado_por e devolve {ok:true, mandato_id, ja_membro:false} (ACE-02.3, ACE-02.4)', async () => {
  await contas();
  await insereConvite({ token: 'para-carlos', papel: 'leitura' });
  await insereConvite({ token: 'para-dora', papel: 'coordenacao' });
  await como(banco, CARLOS);
  assert.deepEqual(await aceitar('para-carlos', 'Carlos Lima'), { ok: true, mandato_id: IDS.mandatoA, ja_membro: false });
  // com sessão não há campo de nome: o nome vem da conta
  await como(banco, DORA);
  assert.deepEqual(await aceitar('para-dora', null), { ok: true, mandato_id: IDS.mandatoA, ja_membro: false });
  assert.deepEqual(await membrosDe(), { ...MEMBROS_A, [CARLOS]: 'Carlos Lima/leitura', [DORA]: 'Dora Dias/coordenacao' });
  assert.deepEqual(await estadoDo('para-carlos'), { usado: true, usado_por: CARLOS, cancelado: false });
  assert.deepEqual(await estadoDo('para-dora'), { usado: true, usado_por: DORA, cancelado: false });
  // já dentro do mandato: lê os dados dele
  await como(banco, CARLOS);
  assert.deepEqual(await q('select id from public.mandatos'), [{ id: IDS.mandatoA }]);
});

test('sem linha em consentimentos devolve {ok:false, erro:"consentimento"}, ninguém entra e o convite segue válido (ACE-02.8)', async () => {
  await contas({ semConsentimento: [CARLOS] });
  await insereConvite({ token: 'para-carlos', papel: 'leitura' });
  await como(banco, CARLOS);
  assert.deepEqual(await aceitar('para-carlos', 'Carlos Lima'), { ok: false, erro: 'consentimento' });
  assert.deepEqual(await membrosDe(), MEMBROS_A);
  assert.deepEqual(await estadoDo('para-carlos'), NAO_USADO);
  assert.deepEqual(await historico(), []);
  // gravado o consentimento, o mesmo convite é aceito
  await comoDono(banco);
  await banco.query(`insert into public.consentimentos (user_id, versao) values ($1, '2026-10')`, [CARLOS]);
  await como(banco, CARLOS);
  assert.deepEqual(await aceitar('para-carlos', 'Carlos Lima'), { ok: true, mandato_id: IDS.mandatoA, ja_membro: false });
});

test('convite com e-mail e conta com outro e-mail devolve {ok:false, erro:"email"} sem consumir, e não conta como token inválido (ACE-02.9, ACE-02.14)', async () => {
  await contas();
  await insereConvite({ token: 'para-carlos', email: 'carlos.lima@exemplo.com' });
  await vindoDe('1.2.3.4');
  await como(banco, DORA);
  for (let i = 0; i < 12; i++) assert.deepEqual(await aceitar('para-carlos'), { ok: false, erro: 'email' }, `tentativa ${i + 1}`);
  assert.deepEqual(await membrosDe(), MEMBROS_A);
  assert.deepEqual(await estadoDo('para-carlos'), NAO_USADO);
  assert.deepEqual(await tentativas(), []);
  await como(banco, null);
  assert.equal((await previa('para-carlos')).ok, true);
});

test('a comparação de e-mail ignora maiúsculas e espaços nas pontas (ACE-02.9)', async () => {
  await contas({ emailCarlos: '  CARLOS.Lima@Exemplo.COM ' });
  await como(banco, IDS.membro);
  const { token } = await criar('Carlos Lima', 'assessoria', ' carlos.lima@EXEMPLO.com  ');
  await como(banco, CARLOS);
  assert.deepEqual(await aceitar(token), { ok: true, mandato_id: IDS.mandatoA, ja_membro: false });
  assert.equal((await membrosDe())[CARLOS], 'Carlos Lima/assessoria');
});

test('o segundo aceite do mesmo convite devolve {ok:false, erro:"invalido"} e a segunda pessoa não entra (ACE-02.12)', async () => {
  await contas();
  await insereConvite({ token: 'um-convite', papel: 'assessoria' });
  await como(banco, CARLOS);
  assert.equal((await aceitar('um-convite')).ok, true);
  await como(banco, DORA);
  assert.deepEqual(await aceitar('um-convite'), INVALIDO);
  assert.deepEqual(await membrosDe(), { ...MEMBROS_A, [CARLOS]: 'Carlos Lima/assessoria' });
  assert.deepEqual(await estadoDo('um-convite'), { usado: true, usado_por: CARLOS, cancelado: false });
});

test('convite_aceitar trava a linha do convite com select ... for update antes de incluir a pessoa (ACE-02.12)', async () => {
  await comoDono(banco);
  const [{ src }] = await q<{ src: string }>(`select prosrc src from pg_proc where proname = 'convite_aceitar'`);
  const trava = src.search(/from public\.convites c\s+where c\.token_hash = [^;]*for update;/);
  assert.ok(trava >= 0, 'sem for update na linha do convite');
  assert.ok(trava < src.indexOf('insert into public.membros'), 'a trava precisa vir antes de incluir a pessoa');
  assert.ok(trava < src.indexOf('update public.convites set usado_em'), 'a trava precisa vir antes de marcar o uso');
});

test('quem já é membro recebe {ok:true, ja_membro:true}, mantém o papel atual (maior ou menor que o do convite) e não consome (ACE-02.13)', async () => {
  await insereConvite({ token: 'convite-leitura', papel: 'leitura' });
  await insereConvite({ token: 'convite-coordenacao', papel: 'coordenacao' });
  await como(banco, IDS.membro);
  assert.deepEqual(await aceitar('convite-leitura'), { ok: true, mandato_id: IDS.mandatoA, ja_membro: true });
  await como(banco, LEITOR);
  assert.deepEqual(await aceitar('convite-coordenacao'), { ok: true, mandato_id: IDS.mandatoA, ja_membro: true });
  assert.deepEqual(await membrosDe(), MEMBROS_A);
  assert.deepEqual(await estadoDo('convite-leitura'), NAO_USADO);
  assert.deepEqual(await estadoDo('convite-coordenacao'), NAO_USADO);
  assert.deepEqual(await historico(), []);
});

test('token inexistente, vencido, cancelado (inclusive por convite_cancelar) ou usado devolve invalido e grava a tentativa (ACE-02.11, ACE-02.14, T10)', async () => {
  await contas();
  await insereConvite({ token: 'token-vencido', criado: '-8 days', expira: '-1 second' });
  await insereConvite({ token: 'token-usado', usado: '-1 minute', usadoPor: IDS.fora });
  await como(banco, IDS.membro);
  const { id, token } = await criar('Carlos Lima', 'leitura');
  await como(banco, IDS.membro);
  await cancelar(id);
  await vindoDe('1.2.3.4');
  await como(banco, CARLOS);
  for (const t of ['token-que-nunca-existiu', 'token-vencido', token, 'token-usado']) assert.deepEqual(await aceitar(t), INVALIDO, t);
  assert.deepEqual(await tentativas(), ['1.2.3.4', '1.2.3.4', '1.2.3.4', '1.2.3.4']);
  assert.deepEqual(await membrosDe(), MEMBROS_A);
});

test('o aceite respeita o limite: a 11ª falha devolve limite e a origem bloqueada não aceita nem token válido; outra origem aceita (ACE-02.14)', async () => {
  await contas();
  await insereConvite({ token: 'token-bom', papel: 'leitura' });
  await vindoDe('1.2.3.4');
  await como(banco, CARLOS);
  for (let i = 0; i < 10; i++) assert.deepEqual(await aceitar(`errado-${i}`), INVALIDO);
  assert.deepEqual(await aceitar('errado-11'), LIMITE);
  assert.deepEqual(await aceitar('token-bom'), LIMITE);
  assert.deepEqual(await estadoDo('token-bom'), NAO_USADO);
  await vindoDe('5.6.7.8');
  await como(banco, CARLOS);
  assert.deepEqual(await aceitar('token-bom'), { ok: true, mandato_id: IDS.mandatoA, ja_membro: false });
});

test('o aceite grava convite_aceito com a pessoa como ator e alvo e o papel do convite, e nenhuma linha em eventos (ACE-06.1, ACE-06.5)', async () => {
  await contas();
  await insereConvite({ token: 'para-carlos', papel: 'leitura' });
  await como(banco, CARLOS);
  await aceitar('para-carlos', 'Carlos Lima');
  assert.deepEqual(await historico(), [{
    mandato_id: IDS.mandatoA, ator_id: CARLOS, ator_nome: 'Carlos Lima', tipo: 'convite_aceito',
    alvo_id: CARLOS, alvo_nome: 'Carlos Lima', papel: 'leitura',
  }]);
  assert.equal(await totalEventos(), 0);
});

test('se a gravação do histórico falhar, o aceite é desfeito: ninguém entra e o convite segue válido (ACE-06.1, ACE-06.3)', async () => {
  await contas();
  await insereConvite({ token: 'para-carlos', papel: 'leitura' });
  await quebraHistorico();
  await como(banco, CARLOS);
  await assert.rejects(aceitar('para-carlos', 'Carlos Lima'), /histórico indisponível/);
  assert.deepEqual(await membrosDe(), MEMBROS_A);
  assert.deepEqual(await estadoDo('para-carlos'), NAO_USADO);
});

test('aceite sem sessão (anon) é recusado e nada muda', async () => {
  await insereConvite({ token: 'token-bom', papel: 'leitura' });
  await como(banco, null);
  await assert.rejects(aceitar('token-bom'), NEGADO);
  assert.deepEqual(await membrosDe(), MEMBROS_A);
  assert.deepEqual(await estadoDo('token-bom'), NAO_USADO);
});

// ---------- Correção do Verifier: o convite vale só com a autoridade atual de quem o criou (sondas V-1, V-1b, V-1c) ----------

const trocarPapel = (user: string, papel: string) =>
  banco.query('select public.membro_trocar_papel($1, $2, $3)', [IDS.mandatoA, user, papel]);
const removerMembro = (user: string) => banco.query('select public.membro_remover($1, $2)', [IDS.mandatoA, user]);
const sairDoMandato = () => banco.query('select public.membro_sair($1)', [IDS.mandatoA]);
const nomesListados = async (quem: string) => {
  await como(banco, quem);
  return (await pendentes()).rows.map((x) => x.nome).sort();
};
const tiposNoHistorico = async () => (await historico()).map((x) => x.tipo);
// quem entrou pelo cadastro do Guia já gravou o consentimento
const consentem = async (...ids: string[]) => {
  await comoDono(banco);
  for (const id of ids) await banco.query(`insert into public.consentimentos (user_id, versao) values ($1, '2026-10')`, [id]);
};

test('sonda V-1: a coordenação rebaixada a leitura não volta à coordenação pelo convite que ela mesma criou, nem antes nem depois de sair, e não remove quem a rebaixou (ACE-02.16, ACE-03.6, ACE-03.12)', async () => {
  await consentem(IDS.membro, ASSESSORIA);
  await como(banco, IDS.membro);
  const { token } = await criar('Reserva', 'coordenacao');
  await como(banco, IDS.membro);
  await trocarPapel(ASSESSORIA, 'coordenacao');
  await como(banco, ASSESSORIA);
  await trocarPapel(IDS.membro, 'leitura');
  await como(banco, IDS.membro);
  assert.deepEqual(await aceitar(token), INVALIDO);
  await como(banco, IDS.membro);
  await sairDoMandato();
  await como(banco, IDS.membro);
  assert.deepEqual(await aceitar(token), INVALIDO);
  await como(banco, IDS.membro);
  await assert.rejects(removerMembro(ASSESSORIA), SEM_PERMISSAO);
  assert.deepEqual(await membrosDe(), { [ASSESSORIA]: 'Alice Assessoria/coordenacao', [LEITOR]: 'Leo Leitor/leitura' });
  assert.deepEqual(await estadoDo(token), NAO_USADO);
  assert.deepEqual(await tiposNoHistorico(), ['convite_criado', 'papel_trocado', 'papel_trocado', 'membro_saiu']);
});

test('sonda V-1b: quem foi removido não volta pelo convite que criou antes; prévia e aceite respondem como token inválido, gravam a tentativa, e o convite sai dos pendentes (ACE-02.16, ACE-03.5, ACE-03.12)', async () => {
  await consentem(IDS.membro);
  await como(banco, IDS.membro);
  const { token } = await criar('Reserva', 'coordenacao');
  await como(banco, IDS.membro);
  await trocarPapel(ASSESSORIA, 'coordenacao');
  assert.deepEqual(await nomesListados(ASSESSORIA), ['Reserva']);
  await como(banco, ASSESSORIA);
  await removerMembro(IDS.membro);
  await vindoDe('1.2.3.4');
  await como(banco, null);
  assert.deepEqual(await previa(token), INVALIDO);
  await como(banco, IDS.membro);
  assert.deepEqual(await aceitar(token), INVALIDO);
  assert.deepEqual(await tentativas(), ['1.2.3.4', '1.2.3.4']);
  assert.deepEqual(await membrosDe(), { [ASSESSORIA]: 'Alice Assessoria/coordenacao', [LEITOR]: 'Leo Leitor/leitura' });
  assert.deepEqual(await estadoDo(token), NAO_USADO);
  assert.deepEqual(await nomesListados(ASSESSORIA), []);
  assert.ok(!(await tiposNoHistorico()).includes('convite_aceito'));
});

test('sonda V-1c: a assessoria rebaixada a leitura não recupera a escrita pelo próprio convite de assessoria, nem com outra conta nem saindo e aceitando (ACE-02.16, ACE-03.2, ACE-03.12)', async () => {
  await contas();
  await consentem(ASSESSORIA);
  await como(banco, ASSESSORIA);
  const { token } = await criar('Reserva', 'assessoria');
  await como(banco, IDS.membro);
  await trocarPapel(ASSESSORIA, 'leitura');
  // outra conta da mesma pessoa
  await como(banco, CARLOS);
  assert.deepEqual(await aceitar(token), INVALIDO);
  await como(banco, ASSESSORIA);
  await sairDoMandato();
  await como(banco, ASSESSORIA);
  assert.deepEqual(await aceitar(token), INVALIDO);
  await como(banco, ASSESSORIA);
  assert.equal((await banco.query(`update public.mandatos set nome_parlamentar = 'Escrito' where id = $1`, [IDS.mandatoA])).affectedRows, 0);
  assert.deepEqual(await membrosDe(), { [IDS.membro]: 'Mario Membro/coordenacao', [LEITOR]: 'Leo Leitor/leitura' });
  assert.deepEqual(await estadoDo(token), NAO_USADO);
});

test('a coordenação que segue na coordenação convida como coordenação e outra pessoa aceita, mesmo com a equipe mudando em volta (ACE-02.4, ACE-02.16)', async () => {
  await contas();
  await como(banco, IDS.membro);
  const { token } = await criar('Dora Dias', 'coordenacao');
  await como(banco, IDS.membro);
  await trocarPapel(ASSESSORIA, 'coordenacao');
  await como(banco, ASSESSORIA);
  await removerMembro(LEITOR);
  assert.deepEqual(await nomesListados(ASSESSORIA), ['Dora Dias']);
  await como(banco, null);
  assert.equal((await previa(token)).ok, true);
  await como(banco, DORA);
  assert.deepEqual(await aceitar(token), { ok: true, mandato_id: IDS.mandatoA, ja_membro: false });
  assert.deepEqual(await membrosDe(), {
    [IDS.membro]: 'Mario Membro/coordenacao', [ASSESSORIA]: 'Alice Assessoria/coordenacao', [DORA]: 'Dora Dias/coordenacao',
  });
});

test('rebaixada a assessoria, a coordenação mantém os convites de assessoria e leitura e perde só o de coordenação, que volta a valer se ela voltar à coordenação (ACE-02.16, ACE-03.12)', async () => {
  await contas();
  await como(banco, IDS.membro);
  const leitura = await criar('Convite Leitura', 'leitura');
  await como(banco, IDS.membro);
  const assessoria = await criar('Convite Assessoria', 'assessoria');
  await como(banco, IDS.membro);
  const coordenacao = await criar('Convite Coordenação', 'coordenacao');
  await como(banco, IDS.membro);
  await trocarPapel(ASSESSORIA, 'coordenacao');
  await como(banco, ASSESSORIA);
  await trocarPapel(IDS.membro, 'assessoria');
  assert.deepEqual(await nomesListados(ASSESSORIA), ['Convite Assessoria', 'Convite Leitura']);
  await como(banco, null);
  assert.equal((await previa(assessoria.token)).ok, true);
  assert.deepEqual(await previa(coordenacao.token), INVALIDO);
  await como(banco, CARLOS);
  assert.deepEqual(await aceitar(leitura.token), { ok: true, mandato_id: IDS.mandatoA, ja_membro: false });
  await como(banco, DORA);
  assert.deepEqual(await aceitar(coordenacao.token), INVALIDO);
  assert.deepEqual(await estadoDo(coordenacao.token), NAO_USADO);
  // o papel é lido a cada chamada: de volta à coordenação, o convite de coordenação volta a valer
  await como(banco, ASSESSORIA);
  await trocarPapel(IDS.membro, 'coordenacao');
  await como(banco, DORA);
  assert.deepEqual(await aceitar(coordenacao.token), { ok: true, mandato_id: IDS.mandatoA, ja_membro: false });
  assert.deepEqual(await membrosDe(), {
    [IDS.membro]: 'Mario Membro/coordenacao', [ASSESSORIA]: 'Alice Assessoria/coordenacao', [LEITOR]: 'Leo Leitor/leitura',
    [CARLOS]: 'Carlos Lima/leitura', [DORA]: 'Dora Dias/coordenacao',
  });
});

test('convites de quem perdeu o papel ou teve a conta apagada não aparecem nos pendentes nem contam no limite de 20 (ACE-01.9, ACE-04.2, ACE-03.12)', async () => {
  // criados pela assessoria antes de ser rebaixada a leitura, e por uma conta que já não existe
  for (let i = 1; i <= 10; i++) {
    await insereConvite({ token: `rebaixada-${i}`, nome: `Rebaixada ${i}`, papel: 'assessoria', por: LEITOR, porNome: 'Leo Leitor' });
    await insereConvite({ token: `apagada-${i}`, nome: `Conta apagada ${i}`, papel: 'leitura', por: null, porNome: 'Ex Membro' });
  }
  assert.deepEqual(await nomesListados(IDS.membro), []);
  await como(banco, IDS.membro);
  await criar('Carlos Lima', 'leitura');
  assert.deepEqual(await nomesListados(IDS.membro), ['Carlos Lima']);
  await como(banco, null);
  assert.deepEqual([await previa('rebaixada-1'), await previa('apagada-1')], [INVALIDO, INVALIDO]);
});

// ---------- Correção do Verifier, iteração 3: cada condição das guardas com teste próprio (mutantes A01, R-X01, A07) ----------

test('a autoridade de quem convidou é lida no mandato do convite: ser coordenação de outro mandato não faz valer, na prévia, no aceite nem nos pendentes, o convite de quem foi rebaixada ou saiu (ACE-02.16, ACE-03.12)', async () => {
  // quem cria o convite no mandato A é também coordenação do mandato B
  await comoDono(banco);
  await banco.query(`insert into public.membros (mandato_id, user_id, nome, papel) values ($1, $2, 'Mario Membro', 'coordenacao')`,
    [IDS.mandatoB, IDS.membro]);
  await consentem(IDS.membro);
  await como(banco, IDS.membro);
  const { token } = await criar('Reserva', 'coordenacao');
  await como(banco, null);
  assert.equal((await previa(token)).ok, true);
  await como(banco, IDS.membro);
  await trocarPapel(ASSESSORIA, 'coordenacao');
  await como(banco, ASSESSORIA);
  await trocarPapel(IDS.membro, 'leitura');
  // rebaixada a leitura no A, segue membro do A
  await como(banco, null);
  assert.deepEqual(await previa(token), INVALIDO);
  await como(banco, IDS.membro);
  assert.deepEqual(await aceitar(token), INVALIDO);
  assert.deepEqual(await nomesListados(ASSESSORIA), []);
  // fora do A, ainda coordenação do B
  await como(banco, IDS.membro);
  await sairDoMandato();
  await como(banco, null);
  assert.deepEqual(await previa(token), INVALIDO);
  await como(banco, IDS.membro);
  assert.deepEqual(await aceitar(token), INVALIDO);
  assert.deepEqual(await nomesListados(ASSESSORIA), []);
  assert.deepEqual(await membrosDe(), { [ASSESSORIA]: 'Alice Assessoria/coordenacao', [LEITOR]: 'Leo Leitor/leitura' });
  assert.deepEqual(await membrosDe(IDS.mandatoB), { [COORD_B]: 'Bia Coord/coordenacao', [IDS.membro]: 'Mario Membro/coordenacao' });
  assert.deepEqual(await estadoDo(token), NAO_USADO);
  assert.deepEqual(await tiposNoHistorico(), ['convite_criado', 'papel_trocado', 'papel_trocado', 'membro_saiu']);
});

test('quem foi removida ou saiu do mandato não cancela o convite que criou: erro de permissão, o convite segue pendente e nada entra no histórico (ACE-04.4)', async () => {
  await como(banco, LEITOR);
  const doLeitor = (await criar('Do leitor', 'leitura')).id;
  await como(banco, ASSESSORIA);
  const daAssessoria = (await criar('Da assessoria', 'assessoria')).id;
  await como(banco, IDS.membro);
  await removerMembro(LEITOR);
  await como(banco, ASSESSORIA);
  await sairDoMandato();
  await como(banco, LEITOR);
  await assert.rejects(cancelar(doLeitor), SEM_PERMISSAO);
  await como(banco, ASSESSORIA);
  await assert.rejects(cancelar(daAssessoria), SEM_PERMISSAO);
  await comoDono(banco);
  assert.deepEqual(await q('select nome, cancelado_em, cancelado_por from public.convites order by nome'), [
    { nome: 'Da assessoria', cancelado_em: null, cancelado_por: null },
    { nome: 'Do leitor', cancelado_em: null, cancelado_por: null },
  ]);
  assert.deepEqual(await nomesPendentes(), ['Da assessoria', 'Do leitor']);
  assert.deepEqual(await tiposNoHistorico(), ['convite_criado', 'convite_criado', 'membro_removido', 'membro_saiu']);
});

test('o limite de 20 conta só convites com autoridade: 20 de coordenação de quem foi rebaixada e segue no mandato não impedem a nova coordenação, e 20 válidos impedem o 21º (ACE-01.9, AD-011)', async () => {
  for (let i = 1; i <= 20; i++) {
    await como(banco, IDS.membro);
    await criar(`Antigo ${i}`, 'coordenacao');
  }
  await como(banco, IDS.membro);
  await trocarPapel(ASSESSORIA, 'coordenacao');
  await como(banco, ASSESSORIA);
  await trocarPapel(IDS.membro, 'leitura');
  assert.deepEqual(await nomesListados(ASSESSORIA), []);
  for (let i = 1; i <= 20; i++) {
    await como(banco, ASSESSORIA);
    await criar(`Novo ${i}`, 'leitura');
  }
  await como(banco, ASSESSORIA);
  await assert.rejects(criar('Novo 21', 'leitura'), VINTE_PENDENTES);
  assert.equal((await nomesListados(ASSESSORIA)).length, 20);
  await comoDono(banco);
  assert.deepEqual(await q(
    `select count(*)::int n from public.convites
      where mandato_id = $1 and usado_em is null and cancelado_em is null and expira_em > now()`, [IDS.mandatoA]), [{ n: 40 }]);
  assert.equal((await q(`select 1 from public.convites where nome = 'Novo 21'`)).length, 0);
  assert.deepEqual(await membrosDe(), {
    [IDS.membro]: 'Mario Membro/leitura', [ASSESSORIA]: 'Alice Assessoria/coordenacao', [LEITOR]: 'Leo Leitor/leitura',
  });
});

// ---------- T13: código de convite antigo aposentado ----------

test('entrar_com_codigo com código válido falha por falta de permissão para authenticated e anon, e ninguém entra (ACE-07.1)', async () => {
  for (const quem of [IDS.fora, COORD_B, null]) {
    await como(banco, quem);
    await assert.rejects(banco.query(`select public.entrar_com_codigo('AAA111', 'Quem tentou')`), NEGADO, String(quem));
  }
  assert.deepEqual(await membrosDe(), MEMBROS_A);
  await comoDono(banco);
  assert.deepEqual(await q(
    `select has_function_privilege('anon', 'public.entrar_com_codigo(text, text)', 'execute') anon,
            has_function_privilege('authenticated', 'public.entrar_com_codigo(text, text)', 'execute') authenticated`),
  [{ anon: false, authenticated: false }]);
});

test('cadastrar mandato novo, como o Guia faz, continua incluindo a pessoa como coordenação (ACE-07.3)', async () => {
  // nucleo.js criarMandato: POST mandatos com criado_por e return=representation, depois POST membros como coordenacao
  await como(banco, IDS.fora);
  const [{ id }] = await q<{ id: string }>(
    `insert into public.mandatos (codigo, nome_parlamentar, cargo, uf, criado_por) values ('CCC333', 'Parlamentar Três', 'Vereadora', 'RJ', $1)
     returning id`, [IDS.fora]);
  await banco.query(`insert into public.membros (mandato_id, user_id, papel, nome) values ($1, $2, 'coordenacao', 'Fabio Fora')`, [id, IDS.fora]);
  assert.deepEqual(await membrosDe(id), { [IDS.fora]: 'Fabio Fora/coordenacao' });
  await como(banco, IDS.fora);
  assert.deepEqual(await q('select private.papel_no_mandato($1) p', [id]), [{ p: 'coordenacao' }]);
});

test('a coluna mandatos.codigo continua existindo e legível pelas views do painel-admin (ACE-07.5)', async () => {
  await comoDono(banco);
  assert.deepEqual(await q(
    `select column_name from information_schema.columns where table_schema = 'public' and table_name = 'mandatos' and column_name = 'codigo'`),
  [{ column_name: 'codigo' }]);
  for (const quem of [IDS.admin, IDS.leitura]) {
    await como(banco, quem);
    assert.deepEqual((await q<{ codigo: string }>('select codigo from public.v_admin_mandatos order by codigo')).map((x) => x.codigo),
      ['AAA111', 'BBB222'], quem);
  }
});

test('todas as migrations rodam em sequência no PGlite e deixam no banco as funções e tabelas de convite', async () => {
  // criaBanco (before) aplicou todas as migrations em ordem; aqui se confere o que a de convites criou
  await comoDono(banco);
  const funcoes = ['public.convite_criar(uuid,text,text,text)', 'public.convites_pendentes(uuid)', 'public.convite_cancelar(uuid)',
    'public.convite_previa(text)', 'public.convite_aceitar(text,text)', 'public.catalogo_exercicios()', 'private.token_aleatorio()',
    'private.convite_origem()', 'private.convite_limite(text)', 'private.convite_falha(text)', 'public.entrar_com_codigo(text,text)'];
  const r = await q<{ f: string; existe: boolean }>('select f, to_regprocedure(f) is not null existe from unnest($1::text[]) f', [funcoes]);
  assert.deepEqual(r.filter((x) => !x.existe).map((x) => x.f), []);
  assert.equal(r.length, funcoes.length);
  const t = await q<{ t: string | null }>(
    `select to_regclass(t)::text t from unnest(array['public.convites', 'public.convite_tentativas', 'public.convite_bloqueios']) t`);
  assert.deepEqual(t.map((x) => x.t), ['convites', 'convite_tentativas', 'convite_bloqueios']);
});
