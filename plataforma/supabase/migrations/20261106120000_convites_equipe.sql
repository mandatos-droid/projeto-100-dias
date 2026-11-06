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

-- ---------- CATÁLOGO DE EXERCÍCIOS PARA MEMBROS ----------
-- exercicios_guia segue fechada (só a equipe Legisla lê direto). Membros de qualquer mandato
-- recebem o catálogo por esta função, para o status das missões na Área do mandato.

create or replace function public.catalogo_exercicios()
returns table (id text, missao int, ordem int, titulo text)
language plpgsql security definer set search_path = '' stable as $$
begin
  if not (private.eh_legisla()
          or exists (select 1 from public.membros b where b.user_id = (select auth.uid()))) then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  return query
    select x.id, x.missao, x.ordem, x.titulo from public.exercicios_guia x order by x.missao, x.ordem;
end;
$$;

revoke execute on function public.catalogo_exercicios() from public, anon;
grant  execute on function public.catalogo_exercicios() to authenticated;

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

-- Nome de uma pessoa no mandato: o de membros, senão o da conta, senão o e-mail.
create or replace function private.nome_pessoa(p_mandato uuid, p_user uuid)
returns text language sql security definer set search_path = '' stable as $$
  select coalesce(
    (select nullif(b.nome, '') from public.membros b where b.mandato_id = p_mandato and b.user_id = p_user),
    (select coalesce(nullif(u.raw_user_meta_data->>'nome', ''), nullif(u.raw_user_meta_data->>'full_name', ''),
                     nullif(u.raw_user_meta_data->>'name', ''), u.email)
     from auth.users u where u.id = p_user))
$$;

-- Grava uma linha do histórico em nome de quem chamou, na transação da ação. Só as funções
-- security definer a usam: sem grant a authenticated, ninguém forja linha pela API.
create or replace function private.evento_equipe(p_mandato uuid, p_tipo text, p_alvo_id uuid, p_alvo_nome text, p_papel text)
returns void language sql security definer set search_path = '' as $$
  insert into public.eventos_equipe (mandato_id, ator_id, ator_nome, tipo, alvo_id, alvo_nome, papel)
  values (p_mandato, (select auth.uid()), private.nome_pessoa(p_mandato, (select auth.uid())),
          p_tipo, p_alvo_id, p_alvo_nome, p_papel)
$$;

revoke execute on function private.nome_pessoa(uuid, uuid), private.evento_equipe(uuid, text, uuid, text, text)
  from public, anon, authenticated;

-- ---------- FUNÇÕES DE EQUIPE ----------
-- Padrão: security definer, search_path vazio, sem execute para anon, execute para authenticated.
-- O papel de quem chama é lido de membros a cada chamada. Antes de ler papéis e contar
-- coordenações, a função trava as linhas de membros do mandato (for update): chamadas
-- simultâneas ficam em fila e a segunda já vê o resultado da primeira.

create or replace function public.membro_trocar_papel(p_mandato uuid, p_user uuid, p_papel text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_antigo text;
begin
  perform 1 from public.membros b where b.mandato_id = p_mandato for update;
  if private.papel_no_mandato(p_mandato) is distinct from 'coordenacao' then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  select b.papel into v_antigo from public.membros b where b.mandato_id = p_mandato and b.user_id = p_user;
  if not found then raise exception 'Pessoa não encontrada.'; end if;
  if v_antigo = 'coordenacao' and p_papel is distinct from 'coordenacao'
     and not exists (select 1 from public.membros b
                     where b.mandato_id = p_mandato and b.papel = 'coordenacao' and b.user_id <> p_user) then
    raise exception 'O mandato precisa ter ao menos uma pessoa na coordenação.';
  end if;

  update public.membros set papel = p_papel where mandato_id = p_mandato and user_id = p_user;
  perform private.evento_equipe(p_mandato, 'papel_trocado', p_user, private.nome_pessoa(p_mandato, p_user), p_papel);
end;
$$;

revoke execute on function public.membro_trocar_papel(uuid, uuid, text) from public, anon;
grant  execute on function public.membro_trocar_papel(uuid, uuid, text) to authenticated;

-- Só a linha de membros sai: a conta na plataforma e os eventos que a pessoa escreveu ficam.
create or replace function public.membro_remover(p_mandato uuid, p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_papel text;
begin
  perform 1 from public.membros b where b.mandato_id = p_mandato for update;
  if private.papel_no_mandato(p_mandato) is distinct from 'coordenacao' then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  select b.papel into v_papel from public.membros b where b.mandato_id = p_mandato and b.user_id = p_user;
  if not found then raise exception 'Pessoa não encontrada.'; end if;
  if v_papel = 'coordenacao'
     and not exists (select 1 from public.membros b
                     where b.mandato_id = p_mandato and b.papel = 'coordenacao' and b.user_id <> p_user) then
    raise exception 'O mandato precisa ter ao menos uma pessoa na coordenação.';
  end if;

  -- o histórico vem antes de apagar, enquanto os nomes ainda estão em membros
  perform private.evento_equipe(p_mandato, 'membro_removido', p_user, private.nome_pessoa(p_mandato, p_user), v_papel);
  delete from public.membros where mandato_id = p_mandato and user_id = p_user;
end;
$$;

revoke execute on function public.membro_remover(uuid, uuid) from public, anon;
grant  execute on function public.membro_remover(uuid, uuid) to authenticated;

-- A própria pessoa sai do mandato, desde que não seja a última coordenação.
create or replace function public.membro_sair(p_mandato uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_papel text;
begin
  perform 1 from public.membros b where b.mandato_id = p_mandato for update;
  v_papel := private.papel_no_mandato(p_mandato);
  if v_papel is null then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  if v_papel = 'coordenacao'
     and not exists (select 1 from public.membros b
                     where b.mandato_id = p_mandato and b.papel = 'coordenacao' and b.user_id <> v_uid) then
    raise exception 'O mandato precisa ter ao menos uma pessoa na coordenação.';
  end if;

  perform private.evento_equipe(p_mandato, 'membro_saiu', v_uid, private.nome_pessoa(p_mandato, v_uid), v_papel);
  delete from public.membros where mandato_id = p_mandato and user_id = v_uid;
end;
$$;

revoke execute on function public.membro_sair(uuid) from public, anon;
grant  execute on function public.membro_sair(uuid) to authenticated;

-- Sem exclusão direta em membros: sair passa por membro_sair, que respeita a regra da coordenação.
-- excluir_meus_dados() segue apagando por ser security definer.
drop policy if exists membros_sair on public.membros;
revoke delete on public.membros from authenticated;

-- Pessoas do mandato com e-mail (que vem de auth.users): só para membros, em qualquer papel.
create or replace function public.equipe_do_mandato(p_mandato uuid)
returns table (user_id uuid, nome text, email text, papel text, criado_em timestamptz)
language plpgsql security definer set search_path = '' stable as $$
begin
  if not private.eh_membro(p_mandato) then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  return query
    select b.user_id, b.nome, u.email::text, b.papel, b.criado_em
    from public.membros b
    left join auth.users u on u.id = b.user_id
    where b.mandato_id = p_mandato
    order by b.criado_em asc, b.user_id asc;
end;
$$;

revoke execute on function public.equipe_do_mandato(uuid) from public, anon;
grant  execute on function public.equipe_do_mandato(uuid) to authenticated;
