// Ambiente de teste de SQL: Postgres embutido (PGlite) com o mínimo do Supabase simulado.
// Aplica as migrations reais em ordem e troca de "usuário" como o PostgREST faz.
import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Banco = PGlite;

// Ids fixos: os testes de SQL conversam por eles.
export const IDS = {
  admin: '00000000-0000-4000-8000-0000000000a1',
  leitura: '00000000-0000-4000-8000-0000000000a2',
  membro: '00000000-0000-4000-8000-0000000000a3', // coordenação do mandato A
  fora: '00000000-0000-4000-8000-0000000000a4', // conta existente, sem equipe nem mandato
  mandatoA: '00000000-0000-4000-8000-0000000000b1',
  mandatoB: '00000000-0000-4000-8000-0000000000b2',
} as const;

const PASTA = join(import.meta.dirname, '..', 'supabase', 'migrations');

// Simulação do que o Supabase entrega pronto. Não replica extensões nem o GoTrue:
// só o que as migrations tocam (auth.users, auth.uid(), roles, privilégios padrão).
const SIMULA_SUPABASE = `
  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );
  create role anon nologin;
  create role authenticated nologin;
  -- o Supabase real lê o "sub" do JWT que o PostgREST grava na sessão
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  -- no Supabase, objetos novos em public já nascem com grants para anon e authenticated:
  -- reproduzir isso obriga cada migration a revogar o que não deve existir
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`;

export async function criaBanco(): Promise<Banco> {
  const banco = new PGlite();
  await banco.exec(SIMULA_SUPABASE);
  const arquivos = readdirSync(PASTA).filter((f) => f.endsWith('.sql')).sort();
  for (const arq of arquivos) {
    try {
      await banco.exec(readFileSync(join(PASTA, arq), 'utf8'));
    } catch (e) {
      throw new Error(`migration ${arq} falhou no PGlite: ${(e as Error).message}`);
    }
  }
  return banco;
}

// Troca a identidade da sessão: uuid = authenticated, null = anon. Sempre parte do superusuário.
export async function como(banco: Banco, uuid: string | null): Promise<void> {
  await banco.exec('reset role');
  await banco.query("select set_config('request.jwt.claim.sub', $1, false)", [uuid ?? '']);
  await banco.exec(uuid ? 'set role authenticated' : 'set role anon');
}

// Volta ao superusuário (dono das tabelas): para preparar e conferir dados sem RLS.
export async function comoDono(banco: Banco): Promise<void> {
  await banco.exec('reset role');
  await banco.query("select set_config('request.jwt.claim.sub', '', false)");
}

// 2 mandatos, 1 admin, 1 leitura, 1 membro de gabinete (coordenação do mandato A) e 1 conta de fora.
export async function semente(banco: Banco): Promise<typeof IDS> {
  await comoDono(banco);
  await banco.query(
    `insert into auth.users (id, email, raw_user_meta_data) values
       ($1, 'admin@legislabrasil.org',   '{"name":"Ana Admin"}'),
       ($2, 'leitura@legislabrasil.org', '{"name":"Lia Leitura"}'),
       ($3, 'membro@gabinete.leg.br',    '{"name":"Mario Membro"}'),
       ($4, 'fora@exemplo.com',          '{"name":"Fabio Fora"}')`,
    [IDS.admin, IDS.leitura, IDS.membro, IDS.fora],
  );
  await banco.query(
    `insert into public.mandatos (id, codigo, nome_civil, nome_parlamentar, cargo, uf, casa, partido, resp_nome, resp_cargo, resp_telefone, dados, criado_por)
     values
       ($1, 'AAA111', 'Civil Um',   'Parlamentar Um',   'Deputada Federal', 'SP', 'Câmara dos Deputados', 'PX', 'Resp Um',   'Chefe de gabinete', '11999990001', '{"texto":"segredo A"}', $3),
       ($2, 'BBB222', 'Civil Dois', 'Parlamentar Dois', 'Deputado Estadual', 'MG', 'Assembleia',           'PY', 'Resp Dois', 'Assessor',          '31999990002', '{"texto":"segredo B"}', null)`,
    [IDS.mandatoA, IDS.mandatoB, IDS.membro],
  );
  await banco.query(
    `insert into public.membros (mandato_id, user_id, nome, papel) values ($1, $2, 'Mario Membro', 'coordenacao')`,
    [IDS.mandatoA, IDS.membro],
  );
  await banco.query(
    `insert into public.equipe_legisla (user_id, nome, papel) values ($1, 'Ana Admin', 'admin'), ($2, 'Lia Leitura', 'leitura')`,
    [IDS.admin, IDS.leitura],
  );
  return IDS;
}
