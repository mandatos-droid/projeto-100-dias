-- =====================================================================
-- COMENTÁRIOS NAS SUGESTÕES
-- Comentários da equipe Legisla sobre uma sugestão inteira ou sobre um
-- trecho do texto dela (trecho + posição inicio/fim no texto original).
-- Qualquer pessoa logada lê (como as sugestões); só a equipe escreve;
-- apaga quem escreveu ou um admin.
-- =====================================================================
create table if not exists public.sugestoes_comentarios (
  id          bigserial primary key,
  sugestao_id bigint not null references public.sugestoes on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  autor       text,
  trecho      text check (trecho is null or length(trecho) <= 1000),
  inicio      integer check (inicio >= 0),
  fim         integer,
  texto       text not null check (length(texto) between 1 and 2000),
  criado_em   timestamptz not null default now(),
  check ((inicio is null) = (fim is null)),
  check (fim is null or fim > inicio)
);

create index if not exists sugestoes_comentarios_sug_idx on public.sugestoes_comentarios (sugestao_id, criado_em);

alter table public.sugestoes_comentarios enable row level security;

drop policy if exists sug_com_ler on public.sugestoes_comentarios;
create policy sug_com_ler on public.sugestoes_comentarios
  for select to authenticated
  using (true);

drop policy if exists sug_com_criar on public.sugestoes_comentarios;
create policy sug_com_criar on public.sugestoes_comentarios
  for insert to authenticated
  with check (private.eh_legisla() and user_id = (select auth.uid()));

drop policy if exists sug_com_apagar on public.sugestoes_comentarios;
create policy sug_com_apagar on public.sugestoes_comentarios
  for delete to authenticated
  using (user_id = (select auth.uid()) or private.eh_legisla_admin());

revoke all on public.sugestoes_comentarios from anon;
grant select, insert, delete on public.sugestoes_comentarios to authenticated;
grant usage, select on sequence public.sugestoes_comentarios_id_seq to authenticated;
