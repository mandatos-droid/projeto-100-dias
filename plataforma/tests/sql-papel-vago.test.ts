// Papel vago: quem edita convida para Parlamentar ou Chefe de Gabinete enquanto ninguém do mandato tem o papel
// (assim quem monta o mandato como coordenação ou assessoria traz o parlamentar), no PGlite.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { criaBanco, como, comoDono, semente, IDS } from './sql-ambiente.ts';
import type { Banco } from './sql-ambiente.ts';

const NOVO = '00000000-0000-4000-8000-0000000000e1';
let banco: Banco;
before(async () => { banco = await criaBanco(); });
after(async () => { await banco.close(); });
beforeEach(async () => {
  await comoDono(banco);
  await banco.query("select set_config('request.headers', '', false)");
  await banco.exec(`truncate public.eventos, public.membros, public.equipe_legisla, public.mandatos, auth.users,
                    public.convites, public.convite_tentativas, public.convite_bloqueios cascade`);
  await semente(banco);
});

const convida = (papel: string) => banco.query(`select public.convite_criar($1, 'Fulana', null, $2)`, [IDS.mandatoA, papel]);
const pendentes = async () => (await banco.query<{ papel: string }>('select papel from public.convites_pendentes($1)', [IDS.mandatoA])).rows.map((r) => r.papel);
const ponhaMembro = async (papel: string) => {
  await comoDono(banco);
  await banco.query(`insert into auth.users (id, email) values ($1, 'novo@exemplo.com') on conflict do nothing`, [NOVO]);
  await banco.query(`insert into public.membros (mandato_id, user_id, nome, papel) values ($1, $2, 'Novo', $3)`, [IDS.mandatoA, NOVO, papel]);
};

test('coordenação convida Parlamentar e Chefe de Gabinete enquanto os papéis estão vagos', async () => {
  await como(banco, IDS.membro);
  await convida('parlamentar');
  await convida('chefe_gabinete');
  assert.deepEqual((await pendentes()).sort(), ['chefe_gabinete', 'parlamentar']);
});

test('com o papel ocupado o banco barra o convite, e o convite que já existia deixa de valer', async () => {
  await como(banco, IDS.membro);
  await convida('parlamentar');
  await ponhaMembro('parlamentar');
  await como(banco, IDS.membro);
  await assert.rejects(convida('parlamentar'), /igual ou menor/);
  assert.deepEqual(await pendentes(), []);
});

test('quem só lê não convida para papel acima do seu', async () => {
  await ponhaMembro('leitura');
  await como(banco, NOVO);
  await assert.rejects(convida('parlamentar'), /igual ou menor/);
});
