-- =====================================================================
-- PAINEL ADMIN · migration 4: registro de uso das funcionalidades (P3)
--
-- Uma linha por abertura de funcionalidade no Guia, só com mandato, id da
-- funcionalidade e instante: sem texto, nome, e-mail nem user_id (minimização).
-- Insere quem é membro do próprio mandato; lê só a equipe Legisla; ninguém
-- altera nem apaga pela API. A view v_admin_uso agrega por dia (Brasília).
--
-- Escrita idempotente (pode ser reaplicada sem erro).
-- =====================================================================

create table if not exists public.uso_funcionalidades (
  id             bigserial primary key,
  mandato_id     uuid not null references public.mandatos on delete cascade,
  funcionalidade text not null check (length(funcionalidade) between 1 and 60),
  criado_em      timestamptz not null default now()
);

create index if not exists uso_funcionalidades_idx
  on public.uso_funcionalidades (mandato_id, funcionalidade, criado_em);

alter table public.uso_funcionalidades enable row level security;

drop policy if exists uso_func_criar on public.uso_funcionalidades;
create policy uso_func_criar on public.uso_funcionalidades
  for insert to authenticated
  with check (private.eh_membro(mandato_id));

drop policy if exists uso_func_ler on public.uso_funcionalidades;
create policy uso_func_ler on public.uso_funcionalidades
  for select to authenticated
  using (private.eh_legisla());

-- o Supabase concede tudo a anon e authenticated por padrão: revogar e devolver só o necessário
revoke all on public.uso_funcionalidades from anon, authenticated;
grant select, insert on public.uso_funcionalidades to authenticated;
revoke all on sequence public.uso_funcionalidades_id_seq from anon, authenticated;
grant usage on sequence public.uso_funcionalidades_id_seq to authenticated;

-- aberturas por dia, mandato e funcionalidade; mandatos arquivados ficam de fora
create or replace view public.v_admin_uso with (security_invoker = true) as
select
  (u.criado_em at time zone 'America/Sao_Paulo')::date as dia,
  u.mandato_id,
  m.uf,
  u.funcionalidade,
  count(*)::int as qtd
from public.uso_funcionalidades u
join public.mandatos m on m.id = u.mandato_id
where private.eh_legisla() and m.arquivado_em is null
group by (u.criado_em at time zone 'America/Sao_Paulo')::date, u.mandato_id, m.uf, u.funcionalidade;

revoke all on public.v_admin_uso from anon, authenticated;
grant select on public.v_admin_uso to authenticated;
