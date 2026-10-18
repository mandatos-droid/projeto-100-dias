-- =====================================================================
-- PLATAFORMA DOS 100 DIAS · LEGISLA BRASIL
-- Schema inicial (Supabase / Postgres 17)
--
-- Parte de contexto inicial/banco.sql, com estes ajustes de segurança e
-- de compatibilidade com o fluxo real do app (public/legacy/nucleo.js):
--   1. mandatos_ler passa a incluir criado_por: o app faz
--      POST mandatos com Prefer: return=representation ANTES de inserir o
--      membro, e sem isso o INSERT falhava por RLS.
--   2. membros_criar só permite o criador inserir a si mesmo como membro;
--      quem entra por convite usa a função entrar_com_codigo.
--   3. Funções auxiliares ficam no schema private (não viram endpoints
--      da API) e perdem o EXECUTE de anon/public.
--   4. Views com security_invoker, para de fato herdarem o RLS.
--   5. Todas as policies com "to authenticated" e grants explícitos.
--
-- Os dados das ilhas (D.tse, D.relacoes, D.pleitos, D.eleitorado, D.social,
-- D.conj2, equipe etc.) ficam dentro de mandatos.dados (jsonb): não há
-- tabela própria para eles.
-- =====================================================================

-- ---------- TABELAS ----------

create table if not exists public.mandatos (
  id                uuid primary key default gen_random_uuid(),
  codigo            text unique not null,
  nome_civil        text,
  nome_parlamentar  text,
  cargo             text,
  uf                text,
  municipio         text,
  casa              text,
  partido           text,
  data_posse        date,
  resp_nome         text,
  resp_cargo        text,
  resp_telefone     text,
  permite_pesquisa  boolean not null default false,
  dados             jsonb   not null default '{}'::jsonb,
  criado_por        uuid references auth.users on delete set null,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);

comment on column public.mandatos.permite_pesquisa is
 'Autorização explícita do mandato para que a equipe da Legisla leia o conteúdo escrito, e não apenas os números agregados.';

create table if not exists public.membros (
  mandato_id  uuid not null references public.mandatos on delete cascade,
  user_id     uuid not null references auth.users on delete cascade,
  nome        text,
  papel       text not null default 'assessoria',
  criado_em   timestamptz not null default now(),
  primary key (mandato_id, user_id)
);

create table if not exists public.eventos (
  id          bigserial primary key,
  mandato_id  uuid not null references public.mandatos on delete cascade,
  user_id     uuid references auth.users on delete set null,
  autor       text,
  missao      int,
  exercicio   text,
  texto       text not null,
  criado_em   timestamptz not null default now()
);

create table if not exists public.consentimentos (
  id          bigserial primary key,
  user_id     uuid not null references auth.users on delete cascade,
  versao      text not null,
  aceito_em   timestamptz not null default now()
);

-- Equipe da Legisla: acesso de leitura que atravessa todos os mandatos.
-- papel: admin (lê e gerencia a equipe), analista (lê tudo), leitura.
create table if not exists public.equipe_legisla (
  user_id   uuid primary key references auth.users on delete cascade,
  nome      text,
  papel     text not null default 'leitura' check (papel in ('admin', 'analista', 'leitura')),
  criado_em timestamptz not null default now()
);

create index if not exists eventos_mandato_idx      on public.eventos (mandato_id, criado_em desc);
create index if not exists membros_user_idx         on public.membros (user_id);
create index if not exists consentimentos_user_idx  on public.consentimentos (user_id, aceito_em desc);
create index if not exists mandatos_criado_por_idx  on public.mandatos (criado_por);

-- ---------- FUNÇÕES AUXILIARES (schema private, fora da API) ----------
-- security definer evita recursão infinita nas políticas de RLS.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.eh_membro(p_mandato uuid)
returns boolean language sql security definer set search_path = '' stable as $$
  select exists (select 1 from public.membros
                 where mandato_id = p_mandato and user_id = (select auth.uid()));
$$;

create or replace function private.eh_legisla()
returns boolean language sql security definer set search_path = '' stable as $$
  select exists (select 1 from public.equipe_legisla where user_id = (select auth.uid()));
$$;

create or replace function private.eh_legisla_admin()
returns boolean language sql security definer set search_path = '' stable as $$
  select exists (select 1 from public.equipe_legisla
                 where user_id = (select auth.uid()) and papel = 'admin');
$$;

revoke execute on function private.eh_membro(uuid), private.eh_legisla(), private.eh_legisla_admin()
  from public, anon;
grant  execute on function private.eh_membro(uuid), private.eh_legisla(), private.eh_legisla_admin()
  to authenticated;

-- ---------- RLS ----------

alter table public.mandatos       enable row level security;
alter table public.membros        enable row level security;
alter table public.eventos        enable row level security;
alter table public.consentimentos enable row level security;
alter table public.equipe_legisla enable row level security;

-- mandatos: membros, quem criou (necessário no INSERT ... RETURNING) ou equipe Legisla
drop policy if exists mandatos_ler on public.mandatos;
create policy mandatos_ler on public.mandatos
  for select to authenticated
  using (private.eh_membro(id) or criado_por = (select auth.uid()) or private.eh_legisla());

drop policy if exists mandatos_criar on public.mandatos;
create policy mandatos_criar on public.mandatos
  for insert to authenticated
  with check (criado_por = (select auth.uid()));

-- escrita restrita a quem é do mandato: a Legisla lê, não edita
drop policy if exists mandatos_editar on public.mandatos;
create policy mandatos_editar on public.mandatos
  for update to authenticated
  using (private.eh_membro(id)) with check (private.eh_membro(id));

drop policy if exists membros_ler on public.membros;
create policy membros_ler on public.membros
  for select to authenticated
  using (private.eh_membro(mandato_id) or private.eh_legisla());

-- só o criador do mandato se insere direto; os demais entram por entrar_com_codigo()
drop policy if exists membros_criar on public.membros;
create policy membros_criar on public.membros
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.mandatos m
                where m.id = mandato_id and m.criado_por = (select auth.uid()))
  );

drop policy if exists membros_sair on public.membros;
create policy membros_sair on public.membros
  for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists eventos_ler on public.eventos;
create policy eventos_ler on public.eventos
  for select to authenticated
  using (private.eh_membro(mandato_id) or private.eh_legisla());

drop policy if exists eventos_criar on public.eventos;
create policy eventos_criar on public.eventos
  for insert to authenticated
  with check (private.eh_membro(mandato_id) and user_id = (select auth.uid()));

-- consentimento: cada pessoa só enxerga o próprio
drop policy if exists consent_ler on public.consentimentos;
create policy consent_ler on public.consentimentos
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists consent_criar on public.consentimentos;
create policy consent_criar on public.consentimentos
  for insert to authenticated with check (user_id = (select auth.uid()));

-- equipe: a própria pessoa vê seu registro; só admin inclui ou remove
drop policy if exists equipe_ler on public.equipe_legisla;
create policy equipe_ler on public.equipe_legisla
  for select to authenticated
  using (user_id = (select auth.uid()) or private.eh_legisla_admin());

drop policy if exists equipe_gerir on public.equipe_legisla;
create policy equipe_gerir on public.equipe_legisla
  for all to authenticated
  using (private.eh_legisla_admin()) with check (private.eh_legisla_admin());

-- ---------- GRANTS (anon não acessa nada) ----------

revoke all on public.mandatos, public.membros, public.eventos,
              public.consentimentos, public.equipe_legisla from anon;
grant select, insert, update on public.mandatos       to authenticated;
grant select, insert, delete on public.membros        to authenticated;
grant select, insert         on public.eventos        to authenticated;
grant select, insert         on public.consentimentos to authenticated;
grant select, insert, update, delete on public.equipe_legisla to authenticated;
grant usage, select on sequence public.eventos_id_seq, public.consentimentos_id_seq to authenticated;

-- ---------- ENTRAR COM CÓDIGO DE CONVITE ----------

create or replace function public.entrar_com_codigo(p_codigo text, p_nome text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Não autenticado.'; end if;
  select id into v_id from public.mandatos where codigo = upper(trim(p_codigo));
  if v_id is null then raise exception 'Código não encontrado.'; end if;
  insert into public.membros (mandato_id, user_id, nome, papel)
  values (v_id, (select auth.uid()), coalesce(p_nome, ''), 'assessoria')
  on conflict (mandato_id, user_id) do nothing;
  return v_id;
end;
$$;
revoke execute on function public.entrar_com_codigo(text, text) from public, anon;
grant  execute on function public.entrar_com_codigo(text, text) to authenticated;

-- ---------- EXCLUSÃO DE CONTA (revogação do consentimento) ----------
-- Os registros do mandato permanecem, pois pertencem ao mandato e não
-- à pessoa; a autoria nos eventos passa a nulo.

create or replace function public.excluir_meus_dados()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'Não autenticado.'; end if;
  update public.eventos set user_id = null, autor = 'usuário removido' where user_id = (select auth.uid());
  delete from public.membros        where user_id = (select auth.uid());
  delete from public.consentimentos where user_id = (select auth.uid());
end;
$$;
revoke execute on function public.excluir_meus_dados() from public, anon;
grant  execute on function public.excluir_meus_dados() to authenticated;

-- ---------- CARIMBO DE ATUALIZAÇÃO ----------

create or replace function public.toca_atualizado_em()
returns trigger language plpgsql set search_path = '' as $$
begin new.atualizado_em = now(); return new; end;
$$;

drop trigger if exists mandatos_touch on public.mandatos;
create trigger mandatos_touch before update on public.mandatos
  for each row execute function public.toca_atualizado_em();

-- =====================================================================
-- VIEWS ANALÍTICAS
-- Achatam o JSONB em tabelas para consulta e exportação em CSV.
-- security_invoker: herdam o RLS de mandatos (membros e equipe Legisla).
-- =====================================================================

-- panorama: uma linha por mandato, só contagens
create or replace view public.v_panorama with (security_invoker = true) as
select
  m.id, m.nome_parlamentar, m.cargo, m.uf, m.municipio, m.casa, m.partido,
  m.data_posse,
  case when m.data_posse is null then null
       else (current_date - m.data_posse) + 1 end                      as dia_do_mandato,
  m.permite_pesquisa,
  coalesce(jsonb_array_length(m.dados->'metas'), 0)                    as metas,
  coalesce(jsonb_array_length(m.dados->'acoes'), 0)                    as acoes,
  coalesce(jsonb_array_length(m.dados->'comissoes'), 0)                as comissoes_mapeadas,
  coalesce(jsonb_array_length(m.dados->'feedbacks'), 0)                as feedbacks,
  coalesce(jsonb_array_length(m.dados->'preditores'), 0)               as preditores_escolhidos,
  (select count(*) from jsonb_each(coalesce(m.dados->'feitos','{}'::jsonb)) f
    where f.value = 'true'::jsonb)                                     as exercicios_concluidos,
  m.resp_nome, m.resp_cargo, m.atualizado_em
from public.mandatos m;

create or replace view public.v_metas with (security_invoker = true) as
select
  m.id as mandato_id, m.nome_parlamentar, m.uf, m.cargo, m.partido,
  meta->>'pred'  as preditor,
  meta->>'texto' as meta,
  meta->>'resp'  as responsavel,
  meta->>'apoio' as apoio,
  (coalesce(meta->>'resp','') <> '') as tem_responsavel
from public.mandatos m,
     lateral jsonb_array_elements(coalesce(m.dados->'metas','[]'::jsonb)) as meta;

create or replace view public.v_preditores with (security_invoker = true) as
select m.id as mandato_id, m.nome_parlamentar, m.uf, m.cargo, m.partido,
       p #>> '{}' as preditor
from public.mandatos m,
     lateral jsonb_array_elements(coalesce(m.dados->'preditores','[]'::jsonb)) as p;

create or replace view public.v_acoes with (security_invoker = true) as
select m.id as mandato_id, m.nome_parlamentar, m.uf, m.cargo,
       a->>'bingo'  as frente,
       a->>'titulo' as acao,
       a->>'resp'   as responsavel,
       a->>'prazo'  as prazo
from public.mandatos m,
     lateral jsonb_array_elements(coalesce(m.dados->'acoes','[]'::jsonb)) as a;

create or replace view public.v_fragilidades with (security_invoker = true) as
select m.id as mandato_id, m.nome_parlamentar, m.uf, m.cargo,
       f->>'t'  as fragilidade,
       f->>'mp' as classificacao   -- M = equipe do mandato, P = parlamentar
from public.mandatos m,
     lateral jsonb_array_elements(coalesce(m.dados->'frags','[]'::jsonb)) as f
where coalesce(f->>'mp','') <> '';

create or replace view public.v_bandeiras with (security_invoker = true) as
select m.id as mandato_id, m.nome_parlamentar, m.uf, m.cargo, m.partido,
       lower(btrim(b.valor)) as bandeira
from public.mandatos m,
     lateral (values (m.dados->'campos'->>'m3.b1'),
                     (m.dados->'campos'->>'m3.b2'),
                     (m.dados->'campos'->>'m3.b3')) as b(valor)
where coalesce(btrim(b.valor),'') <> '';

revoke all on public.v_panorama, public.v_metas, public.v_preditores,
              public.v_acoes, public.v_fragilidades, public.v_bandeiras from anon;
grant select on public.v_panorama, public.v_metas, public.v_preditores,
                public.v_acoes, public.v_fragilidades, public.v_bandeiras
      to authenticated;

-- =====================================================================
-- COMO INCLUIR ALGUÉM NA EQUIPE LEGISLA
-- A pessoa precisa ter criado conta na plataforma antes. Depois, rode no
-- SQL Editor (como postgres):
--
--   insert into public.equipe_legisla (user_id, nome, papel)
--   select id, 'Nome da pessoa', 'analista'
--   from auth.users where email = 'pessoa@legislabrasil.org';
--
-- Papéis: admin (gerencia a equipe), analista, leitura.
-- A equipe Legisla LÊ os mandatos, mas não edita o conteúdo deles.
-- =====================================================================
