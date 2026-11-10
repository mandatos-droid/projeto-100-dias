// Primeiro acesso: resumo agregado do perfil para o Analytics do /admin (PAG-06), no PGlite.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { criaBanco, como, comoDono, semente, IDS } from './sql-ambiente.ts';
import type { Banco } from './sql-ambiente.ts';

const NEGADO = /permission denied/;
const SEM_PERMISSAO = { code: '42501', message: /^Você não tem permissão para esta ação\.$/ };
const VAZIO = { total: 0, por_mes: [], genero: {}, raca: {}, faixa: {}, atuacao: {} };

let banco: Banco;
before(async () => { banco = await criaBanco(); });
after(async () => { await banco.close(); });

beforeEach(async () => {
  await comoDono(banco);
  await banco.exec('truncate public.eventos, public.membros, public.equipe_legisla, public.mandatos, auth.users cascade');
  await semente(banco);
});

const q = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) => (await banco.query<T>(sql, args)).rows;
// valor calculado pelo banco, no fuso da spec
const valor = async (expr: string) => {
  await comoDono(banco);
  return (await q<{ v: string }>(`select (${expr})::text v`))[0].v;
};
const MES_SP = "date_trunc('month', now() at time zone 'America/Sao_Paulo')";
const mesAtras = (n: number) => valor(`to_char(${MES_SP} - interval '${n} months', 'YYYY-MM')`);
// meio do mês, n meses atrás, como timestamptz
const meioDoMesAtras = (n: number) => `(${MES_SP} - interval '${n} months' + interval '14 days 12 hours') at time zone 'America/Sao_Paulo'`;
// faz `anos` anos hoje (ou amanhã, com maisDias = 1)
const nascidoHa = (anos: number, maisDias = 0) =>
  valor(`((now() at time zone 'America/Sao_Paulo')::date - interval '${anos} years' + interval '${maisDias} days')::date`);

interface P { nascimento: string; genero: string; raca: string; atua: boolean; tempo: string | null; criado: string }
const PADRAO: P = { nascimento: '1990-05-17', genero: 'homem_cis', raca: 'parda', atua: true, tempo: '3_5', criado: 'now()' };
// conta nova com perfil gravado direto pelo dono; `criado` é expressão SQL
async function perfil(p: Partial<P> = {}): Promise<string> {
  const v = { ...PADRAO, ...p };
  await comoDono(banco);
  const [{ id }] = await q<{ id: string }>(`insert into auth.users (email) values ('pessoa@exemplo.com') returning id`);
  await banco.query(
    `insert into public.perfis (user_id, nome, nascimento, genero, raca, telefone, atua, tempo, criado_em)
     values ($1, 'Pessoa Sigilosa', $2, $3, $4, '21912345678', $5, $6, ${v.criado})`,
    [id, v.nascimento, v.genero, v.raca, v.atua, v.tempo]);
  return id;
}
const resumo = async (quem: string = IDS.admin) => {
  await como(banco, quem);
  return (await q<{ r: Record<string, any> }>('select public.admin_perfil_resumo() r'))[0].r;
};
const soma = (o: Record<string, number>) => Object.values(o).reduce((s, n) => s + n, 0);

// 6 perfis: gêneros, raças e atuações variados, todos criados agora
async function seisPerfis() {
  await perfil({ genero: 'mulher_cis', raca: 'parda', atua: false, tempo: null });
  await perfil({ genero: 'mulher_cis', raca: 'parda', tempo: 'menos_1' });
  await perfil({ genero: 'nao_binaria', raca: 'preta', tempo: '1_2' });
  await perfil({ genero: 'nao_informar', raca: 'nao_informar', tempo: '3_5' });
  await perfil({ genero: 'homem_trans', raca: 'branca', tempo: '6_10' });
  await perfil({ genero: 'homem_cis', raca: 'indigena', tempo: 'mais_10' });
}

test('o resumo traz só total, por_mes, genero, raca, faixa e atuacao, com contagens e sem nome, e-mail, telefone, data de nascimento nem id (PAG-06.6, PAG-06.7)', async () => {
  const id = await perfil({ nascimento: '1987-03-21' });
  const r = await resumo();
  assert.deepEqual(Object.keys(r).sort(), ['atuacao', 'faixa', 'genero', 'por_mes', 'raca', 'total']);
  const texto = JSON.stringify(r);
  for (const individual of ['Pessoa Sigilosa', 'pessoa@exemplo.com', '21912345678', '1987-03-21', id]) {
    assert.ok(!texto.includes(individual), `vazou ${individual}`);
  }
  for (const k of ['genero', 'raca', 'faixa', 'atuacao']) {
    assert.ok(Object.values(r[k]).every((n) => typeof n === 'number'), k);
  }
});

test('gênero conta cada categoria, com "nao_informar" como categoria própria (PAG-06.3, PAG-06.4)', async () => {
  await seisPerfis();
  assert.deepEqual((await resumo()).genero, { mulher_cis: 2, nao_binaria: 1, nao_informar: 1, homem_trans: 1, homem_cis: 1 });
});

test('raça conta cada categoria, com "nao_informar" como categoria própria (PAG-06.3, PAG-06.4)', async () => {
  await seisPerfis();
  assert.deepEqual((await resumo()).raca, { parda: 2, preta: 1, nao_informar: 1, branca: 1, indigena: 1 });
});

test('atuação traz "nao_atua" para quem não atua e as 5 faixas de tempo (PAG-06.3)', async () => {
  await seisPerfis();
  assert.deepEqual((await resumo()).atuacao, { nao_atua: 1, menos_1: 1, '1_2': 1, '3_5': 1, '6_10': 1, mais_10: 1 });
});

test('a faixa etária usa os rótulos da spec e os limites 24/25, 34/35, 44/45, 54/55 e 64/65 anos, contados da data de hoje (PAG-06.5)', async () => {
  const limites: [number, string, string][] = [
    [25, 'Até 24', '25 a 34'], [35, '25 a 34', '35 a 44'], [45, '35 a 44', '45 a 54'], [55, '45 a 54', '55 a 64'], [65, '55 a 64', '65 ou mais'],
  ];
  for (const [anos, antes, depois] of limites) {
    await comoDono(banco);
    await banco.exec('truncate public.perfis');
    await perfil({ nascimento: await nascidoHa(anos, 1) }); // faz `anos` amanhã: ainda tem anos - 1
    await perfil({ nascimento: await nascidoHa(anos) }); // faz `anos` hoje
    assert.deepEqual((await resumo()).faixa, { [antes]: 1, [depois]: 1 }, `${anos - 1}/${anos} anos`);
  }
});

test('a soma das categorias de gênero, raça, faixa etária e atuação é igual ao total (PAG-06.12)', async () => {
  await seisPerfis();
  await perfil({ nascimento: await nascidoHa(70), atua: false, tempo: null });
  const r = await resumo();
  assert.equal(r.total, 7);
  for (const k of ['genero', 'raca', 'faixa', 'atuacao']) assert.equal(soma(r[k]), 7, k);
});

test('por_mes vai do mês do primeiro perfil ao atual, com os meses sem cadastro em zero (PAG-06.2)', async () => {
  await perfil({ criado: meioDoMesAtras(2) });
  await perfil();
  await perfil();
  assert.deepEqual((await resumo()).por_mes, [
    { mes: await mesAtras(2), qtd: 1 }, { mes: await mesAtras(1), qtd: 0 }, { mes: await mesAtras(0), qtd: 2 },
  ]);
});

test('por_mes mostra no máximo 12 meses, terminando no atual; o total conta também os perfis mais antigos (PAG-06.2)', async () => {
  await perfil({ criado: meioDoMesAtras(14) });
  await perfil({ criado: meioDoMesAtras(11) });
  await perfil();
  const r = await resumo();
  assert.equal(r.total, 3);
  assert.equal(r.por_mes.length, 12);
  assert.deepEqual(r.por_mes[0], { mes: await mesAtras(11), qtd: 1 });
  assert.deepEqual(r.por_mes[11], { mes: await mesAtras(0), qtd: 1 });
  assert.equal(r.por_mes.reduce((s: number, m: { qtd: number }) => s + m.qtd, 0), 2);
});

test('por_mes conta o mês no fuso America/Sao_Paulo: 23h30 do último dia do mês passado ainda é o mês passado', async () => {
  // 23h30 em Brasília do último dia do mês passado = 02h30 UTC do dia 1 do mês atual
  await perfil({ criado: `(${MES_SP} - interval '30 minutes') at time zone 'America/Sao_Paulo'` });
  await perfil({ criado: `(${MES_SP} + interval '30 minutes') at time zone 'America/Sao_Paulo'` });
  assert.deepEqual((await resumo()).por_mes, [{ mes: await mesAtras(1), qtd: 1 }, { mes: await mesAtras(0), qtd: 1 }]);
});

test('sem nenhum perfil o resumo devolve total 0 e distribuições vazias', async () => {
  assert.deepEqual(await resumo(), VAZIO);
});

test('admin e leitura da equipe Legisla executam o resumo e veem os mesmos números (PAG-06.1)', async () => {
  await seisPerfis();
  const doAdmin = await resumo(IDS.admin);
  assert.equal(doAdmin.total, 6);
  assert.deepEqual(await resumo(IDS.leitura), doAdmin);
});

test('quem não está na equipe Legisla recebe erro de permissão, mesmo com perfil ou em mandato (PAG-06.8)', async () => {
  await seisPerfis();
  await comoDono(banco);
  await banco.query(
    `insert into public.perfis (user_id, nome, nascimento, genero, raca, telefone, atua, tempo)
     values ($1, 'Fabio Fora', '1980-01-01', 'homem_cis', 'branca', '11987654321', false, null)`, [IDS.fora]);
  for (const quem of [IDS.fora, IDS.membro]) {
    await assert.rejects(resumo(quem), SEM_PERMISSAO, quem);
  }
});

test('anon não executa admin_perfil_resumo', async () => {
  await como(banco, null);
  await assert.rejects(banco.query('select public.admin_perfil_resumo()'), NEGADO);
  await comoDono(banco);
  assert.deepEqual(await q(`select has_function_privilege('anon', 'public.admin_perfil_resumo()', 'execute') a`), [{ a: false }]);
});
