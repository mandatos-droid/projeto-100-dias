-- =====================================================================
-- SUGESTÕES E CORREÇÕES
-- Qualquer pessoa logada envia um texto (e, se quiser, um print colado);
-- só a equipe Legisla lê, marca como resolvida e (admin) apaga.
-- O print é reduzido no navegador (JPEG, ~200 KB) e guardado como data URL
-- em texto: evita Storage e URLs assinadas para um volume pequeno.
-- =====================================================================

create table if not exists public.sugestoes (
  id          bigserial primary key,
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  autor       text,
  email       text,
  mandato_id  uuid references public.mandatos on delete set null,
  pagina      text,
  texto       text not null check (length(texto) between 1 and 5000),
  imagem      text check (imagem is null or length(imagem) <= 3000000),
  tem_imagem  boolean generated always as (imagem is not null) stored,
  resolvida   boolean not null default false,
  criado_em   timestamptz not null default now()
);

create index if not exists sugestoes_criado_idx on public.sugestoes (criado_em desc);
create index if not exists sugestoes_user_idx   on public.sugestoes (user_id);
create index if not exists sugestoes_mandato_idx on public.sugestoes (mandato_id);

alter table public.sugestoes enable row level security;

drop policy if exists sugestoes_criar on public.sugestoes;
create policy sugestoes_criar on public.sugestoes
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists sugestoes_ler on public.sugestoes;
create policy sugestoes_ler on public.sugestoes
  for select to authenticated
  using (private.eh_legisla());

drop policy if exists sugestoes_editar on public.sugestoes;
create policy sugestoes_editar on public.sugestoes
  for update to authenticated
  using (private.eh_legisla()) with check (private.eh_legisla());

drop policy if exists sugestoes_apagar on public.sugestoes;
create policy sugestoes_apagar on public.sugestoes
  for delete to authenticated
  using (private.eh_legisla_admin());

revoke all on public.sugestoes from anon;
grant select, insert, update, delete on public.sugestoes to authenticated;
grant usage, select on sequence public.sugestoes_id_seq to authenticated;
