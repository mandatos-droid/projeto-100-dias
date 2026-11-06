-- =====================================================================
-- ACESSO, EQUIPE E CONVITES
--
-- Papéis do mandato (coordenacao > assessoria > leitura) aplicados no banco.
-- Toda escrita de acesso passa por função security definer que lê o papel
-- da tabela a cada chamada.
--
-- Escrita idempotente (pode ser reaplicada sem erro).
-- =====================================================================

-- ---------- PAPÉIS DO MANDATO ----------

alter table public.membros drop constraint if exists membros_papel_check;
alter table public.membros
  add constraint membros_papel_check check (papel in ('coordenacao', 'assessoria', 'leitura'));

-- Ordem dos papéis: quem convida só concede papel de nível igual ou menor que o seu.
create or replace function private.nivel_papel(p text)
returns int language sql immutable set search_path = '' as $$
  select case p when 'coordenacao' then 3 when 'assessoria' then 2 when 'leitura' then 1 else 0 end
$$;

-- Papel de quem chama no mandato (nulo se não for membro), lido da tabela a cada chamada.
create or replace function private.papel_no_mandato(p_mandato uuid)
returns text language sql security definer set search_path = '' stable as $$
  select b.papel from public.membros b
  where b.mandato_id = p_mandato and b.user_id = (select auth.uid())
$$;

-- coordenacao e assessoria editam o conteúdo do mandato; leitura só consulta.
create or replace function private.pode_editar(p_mandato uuid)
returns boolean language sql security definer set search_path = '' stable as $$
  select coalesce(private.papel_no_mandato(p_mandato) in ('coordenacao', 'assessoria'), false)
$$;

revoke execute on function private.nivel_papel(text), private.papel_no_mandato(uuid), private.pode_editar(uuid)
  from public, anon;
grant execute on function private.nivel_papel(text), private.papel_no_mandato(uuid), private.pode_editar(uuid)
  to authenticated;

-- ---------- LEITURA SÓ CONSULTA ----------
-- Antes qualquer membro gravava; agora só quem pode_editar. A equipe Legisla segue sem escrita.

drop policy if exists mandatos_editar on public.mandatos;
create policy mandatos_editar on public.mandatos
  for update to authenticated
  using (private.pode_editar(id)) with check (private.pode_editar(id));

drop policy if exists eventos_criar on public.eventos;
create policy eventos_criar on public.eventos
  for insert to authenticated
  with check (private.pode_editar(mandato_id) and user_id = (select auth.uid()));

-- ---------- HISTÓRICO DA EQUIPE ----------
-- Tabela própria: eventos mede atividade do mandato no painel-admin e não recebe linhas de acesso.
-- Nomes e papel são cópias, para o histórico sobreviver à saída da pessoa.

create table if not exists public.eventos_equipe (
  id          bigserial primary key,
  mandato_id  uuid not null references public.mandatos on delete cascade,
  criado_em   timestamptz not null default now(),
  ator_id     uuid references auth.users on delete set null,
  ator_nome   text,
  tipo        text not null check (tipo in
    ('convite_criado', 'convite_aceito', 'convite_cancelado', 'papel_trocado', 'membro_removido', 'membro_saiu')),
  alvo_nome   text,
  alvo_id     uuid,
  papel       text
);

create index if not exists eventos_equipe_idx on public.eventos_equipe (mandato_id, criado_em desc);

alter table public.eventos_equipe enable row level security;

drop policy if exists eventos_equipe_ler on public.eventos_equipe;
create policy eventos_equipe_ler on public.eventos_equipe
  for select to authenticated
  using (private.eh_membro(mandato_id));

-- só leitura pela API, para membros; quem grava são as funções de equipe e de convite
revoke all on public.eventos_equipe from anon, authenticated;
grant select on public.eventos_equipe to authenticated;
revoke all on sequence public.eventos_equipe_id_seq from anon, authenticated;
