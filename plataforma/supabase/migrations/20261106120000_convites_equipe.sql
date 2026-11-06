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
