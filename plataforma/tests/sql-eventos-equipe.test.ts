// Acesso, equipe e convites: histórico da equipe em eventos_equipe (ACE-06), no PGlite.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { criaBanco, como, comoDono, semente, IDS } from './sql-ambiente.ts';
import type { Banco } from './sql-ambiente.ts';

const LEITOR = '00000000-0000-4000-8000-0000000000c2'; // leitura no mandato A
const COORD_B = '00000000-0000-4000-8000-0000000000c3'; // coordenação do mandato B
const TIPOS = ['convite_criado', 'convite_aceito', 'convite_cancelado', 'papel_trocado', 'membro_removido', 'membro_saiu'];
const SEM_PERMISSAO = /permission denied/;

let banco: Banco;
before(async () => { banco = await criaBanco(); });
after(async () => { await banco.close(); });

beforeEach(async () => {
  await comoDono(banco);
  await banco.exec('truncate public.eventos, public.membros, public.equipe_legisla, public.mandatos, auth.users cascade');
  await semente(banco);
  await banco.query(
    `insert into auth.users (id, email, raw_user_meta_data) values
       ($1, 'leitor@gabinete.leg.br', '{"name":"Leo Leitor"}'), ($2, 'coord@outro.leg.br', '{"name":"Bia Coord"}')`,
    [LEITOR, COORD_B],
  );
  await banco.query(
    `insert into public.membros (mandato_id, user_id, nome, papel) values ($1, $3, 'Leo Leitor', 'leitura'), ($2, $4, 'Bia Coord', 'coordenacao')`,
    [IDS.mandatoA, IDS.mandatoB, LEITOR, COORD_B],
  );
  await banco.query(
    `insert into public.eventos_equipe (mandato_id, ator_id, ator_nome, tipo, alvo_nome, papel) values
       ($1, $3, 'Mario Membro', 'convite_criado', 'Carlos Lima', 'assessoria'),
       ($1, $3, 'Mario Membro', 'papel_trocado', 'Leo Leitor', 'leitura'),
       ($2, $4, 'Bia Coord', 'convite_criado', 'Dora Dias', 'leitura')`,
    [IDS.mandatoA, IDS.mandatoB, IDS.membro, COORD_B],
  );
});

const q = async <T = Record<string, unknown>>(sql: string, args: unknown[] = []) => (await banco.query<T>(sql, args)).rows;
const comoDonoLinhas = async () => {
  await comoDono(banco);
  return q<{ mandato_id: string; tipo: string; alvo_nome: string }>('select mandato_id, tipo, alvo_nome from public.eventos_equipe order by id');
};

test('membro (coordenação ou leitura) lê as linhas do próprio mandato e só delas (ACE-06.6)', async () => {
  for (const quem of [IDS.membro, LEITOR]) {
    await como(banco, quem);
    const r = await q<{ mandato_id: string; tipo: string; alvo_nome: string }>('select mandato_id, tipo, alvo_nome from public.eventos_equipe order by id');
    assert.deepEqual(r, [
      { mandato_id: IDS.mandatoA, tipo: 'convite_criado', alvo_nome: 'Carlos Lima' },
      { mandato_id: IDS.mandatoA, tipo: 'papel_trocado', alvo_nome: 'Leo Leitor' },
    ], quem);
  }
});

test('quem não é membro do mandato recebe zero linhas dele: conta de fora, equipe Legisla e coordenação de outro mandato (ACE-06.6)', async () => {
  for (const quem of [IDS.fora, IDS.admin, IDS.leitura]) {
    await como(banco, quem);
    assert.equal((await q('select * from public.eventos_equipe')).length, 0, quem);
  }
  await como(banco, COORD_B);
  assert.equal((await q('select * from public.eventos_equipe where mandato_id = $1', [IDS.mandatoA])).length, 0);
  assert.deepEqual((await q<{ alvo_nome: string }>('select alvo_nome from public.eventos_equipe')).map((x) => x.alvo_nome), ['Dora Dias']);
});

test('anônimo não lê eventos_equipe (ACE-06.6)', async () => {
  await como(banco, null);
  await assert.rejects(q('select * from public.eventos_equipe'), SEM_PERMISSAO);
});

test('insert direto em eventos_equipe é recusado para membro e para a equipe admin do Legisla (ACE-06.4)', async () => {
  for (const quem of [IDS.membro, IDS.admin]) {
    await como(banco, quem);
    await assert.rejects(
      banco.query(`insert into public.eventos_equipe (mandato_id, ator_id, tipo) values ($1, $2, 'membro_saiu')`, [IDS.mandatoA, quem]),
      SEM_PERMISSAO, quem,
    );
  }
  assert.equal((await comoDonoLinhas()).length, 3);
});

test('update e delete diretos em eventos_equipe são recusados para membro e equipe admin, e nada muda (ACE-06.4)', async () => {
  const antes = await comoDonoLinhas();
  for (const quem of [IDS.membro, IDS.admin]) {
    await como(banco, quem);
    await assert.rejects(banco.query(`update public.eventos_equipe set alvo_nome = 'Outro'`), SEM_PERMISSAO, quem);
    await assert.rejects(banco.query('delete from public.eventos_equipe'), SEM_PERMISSAO, quem);
  }
  assert.deepEqual(await comoDonoLinhas(), antes);
});

test('tipo aceita só os 6 valores do design', async () => {
  await comoDono(banco);
  for (const tipo of TIPOS) {
    await banco.query('insert into public.eventos_equipe (mandato_id, tipo) values ($1, $2)', [IDS.mandatoB, tipo]);
  }
  for (const tipo of ['outro', 'convite_usado', 'Membro_saiu', '']) {
    await assert.rejects(
      banco.query('insert into public.eventos_equipe (mandato_id, tipo) values ($1, $2)', [IDS.mandatoB, tipo]),
      /eventos_equipe_tipo_check/, tipo,
    );
  }
  const tipos = await q<{ tipo: string }>('select distinct tipo from public.eventos_equipe where mandato_id = $1 order by tipo', [IDS.mandatoB]);
  assert.deepEqual(tipos.map((x) => x.tipo), [...TIPOS].sort());
});
