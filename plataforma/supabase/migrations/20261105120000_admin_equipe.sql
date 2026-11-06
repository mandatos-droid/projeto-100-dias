-- =====================================================================
-- PAINEL ADMIN · migration 1: equipe, papéis e auditoria
--
-- 1. equipe_legisla.papel passa a aceitar só admin e leitura (analista vira leitura).
-- 2. A equipe inteira (admin e leitura) lê a equipe; toda escrita passa a ser
--    por função, que checa o papel e grava a auditoria na mesma transação.
-- 3. auditoria_admin só aceita inclusão: ninguém edita nem apaga pela API.
--
-- Escrita idempotente (pode ser reaplicada sem erro).
-- =====================================================================

-- ---------- PAPÉIS ----------

update public.equipe_legisla set papel = 'leitura' where papel = 'analista';

alter table public.equipe_legisla drop constraint if exists equipe_legisla_papel_check;
alter table public.equipe_legisla
  add constraint equipe_legisla_papel_check check (papel in ('admin', 'leitura'));

-- ---------- RLS E GRANTS DA EQUIPE ----------

-- qualquer pessoa da equipe lê a lista; quem não está nela não vê linha alguma
drop policy if exists equipe_ler on public.equipe_legisla;
create policy equipe_ler on public.equipe_legisla
  for select to authenticated
  using (private.eh_legisla());

-- sem escrita direta: inclusão, troca de papel e remoção só pelas funções admin_equipe_*
drop policy if exists equipe_gerir on public.equipe_legisla;
revoke insert, update, delete on public.equipe_legisla from authenticated;

-- ---------- AUDITORIA ----------

create table if not exists public.auditoria_admin (
  id         bigint generated always as identity primary key,
  criado_em  timestamptz not null default now(),
  user_id    uuid references auth.users on delete set null,
  autor      text,                         -- nome no momento da ação
  acao       text not null,
  alvo_tipo  text not null,
  alvo_id    text not null,
  detalhe    jsonb not null default '{}'::jsonb
);

create index if not exists auditoria_admin_criado_idx on public.auditoria_admin (criado_em desc);

alter table public.auditoria_admin enable row level security;

drop policy if exists auditoria_ler on public.auditoria_admin;
create policy auditoria_ler on public.auditoria_admin
  for select to authenticated
  using (private.eh_legisla());

-- só leitura para a equipe; sem grant de insert/update/delete a ninguém (a gravação é de private.audita)
revoke all on public.auditoria_admin from anon, authenticated;
grant select on public.auditoria_admin to authenticated;

-- Grava uma linha de auditoria em nome de quem chamou. Só outras funções security definer a
-- usam: sem grant a authenticated, ninguém forja linha pela API.
create or replace function private.audita(p_acao text, p_alvo_tipo text, p_alvo_id text, p_detalhe jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_autor text;
begin
  select coalesce(nullif(e.nome, ''), u.email) into v_autor
  from public.equipe_legisla e left join auth.users u on u.id = e.user_id
  where e.user_id = v_uid;
  insert into public.auditoria_admin (user_id, autor, acao, alvo_tipo, alvo_id, detalhe)
  values (v_uid, v_autor, p_acao, p_alvo_tipo, p_alvo_id, coalesce(p_detalhe, '{}'::jsonb));
end;
$$;
revoke execute on function private.audita(text, text, text, jsonb) from public, anon, authenticated;

-- ---------- FUNÇÕES DA EQUIPE ----------
-- Padrão: security definer, search_path vazio, sem execute para anon, execute para authenticated.
-- A checagem de papel é feita dentro, lendo equipe_legisla a cada chamada.

-- Lista a equipe com e-mail (que vem de auth.users): admin e leitura.
create or replace function public.admin_equipe()
returns table (user_id uuid, nome text, email text, papel text, criado_em timestamptz)
language plpgsql security definer set search_path = '' stable as $$
begin
  if not private.eh_legisla() then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  return query
    select e.user_id, e.nome, u.email::text, e.papel, e.criado_em
    from public.equipe_legisla e
    left join auth.users u on u.id = e.user_id
    order by e.criado_em asc, e.user_id asc;
end;
$$;

-- Acha uma conta pelo e-mail exato (sem caixa e sem espaços nas pontas): no máximo uma, só admin.
create or replace function public.admin_buscar_usuario(p_email text)
returns table (user_id uuid, nome text, email text)
language plpgsql security definer set search_path = '' stable as $$
begin
  if not private.eh_legisla_admin() then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  return query
    select u.id,
           coalesce(nullif(u.raw_user_meta_data->>'nome', ''), nullif(u.raw_user_meta_data->>'full_name', ''),
                    nullif(u.raw_user_meta_data->>'name', ''), u.email)::text,
           u.email::text
    from auth.users u
    where lower(btrim(u.email)) = lower(btrim(p_email))
    limit 1;
end;
$$;

create or replace function public.admin_equipe_incluir(p_user uuid, p_papel text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_email text;
  v_nome text;
  v_linhas int;
begin
  if not private.eh_legisla_admin() then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  if coalesce(p_papel, '') not in ('admin', 'leitura') then
    raise exception 'Papel inválido.';
  end if;
  select u.email,
         coalesce(nullif(u.raw_user_meta_data->>'nome', ''), nullif(u.raw_user_meta_data->>'full_name', ''),
                  nullif(u.raw_user_meta_data->>'name', ''), u.email)
    into v_email, v_nome
  from auth.users u where u.id = p_user;
  if not found then raise exception 'Pessoa não encontrada.'; end if;

  insert into public.equipe_legisla (user_id, nome, papel) values (p_user, v_nome, p_papel)
  on conflict (user_id) do nothing;
  get diagnostics v_linhas = row_count;
  if v_linhas = 0 then raise exception 'Esta pessoa já está na equipe.'; end if;

  perform private.audita('equipe.incluir', 'equipe', p_user::text,
    jsonb_build_object('papel', p_papel, 'nome', v_nome, 'email', v_email));
end;
$$;

create or replace function public.admin_equipe_papel(p_user uuid, p_papel text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_antigo text;
  v_nome text;
begin
  if not private.eh_legisla_admin() then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  if coalesce(p_papel, '') not in ('admin', 'leitura') then
    raise exception 'Papel inválido.';
  end if;
  -- trava os admins para que dois rebaixamentos simultâneos não esvaziem a equipe
  perform 1 from public.equipe_legisla e where e.papel = 'admin' for update;
  select e.papel, e.nome into v_antigo, v_nome from public.equipe_legisla e where e.user_id = p_user;
  if not found then raise exception 'Pessoa não encontrada.'; end if;
  if v_antigo = 'admin' and p_papel <> 'admin'
     and not exists (select 1 from public.equipe_legisla e where e.papel = 'admin' and e.user_id <> p_user) then
    raise exception 'A equipe precisa ter ao menos um admin.';
  end if;

  perform private.audita('equipe.papel', 'equipe', p_user::text,
    jsonb_build_object('nome', v_nome, 'de', v_antigo, 'para', p_papel));
  update public.equipe_legisla set papel = p_papel where user_id = p_user;
end;
$$;

create or replace function public.admin_equipe_remover(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_papel text;
  v_nome text;
begin
  if not private.eh_legisla_admin() then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  perform 1 from public.equipe_legisla e where e.papel = 'admin' for update;
  select e.papel, e.nome into v_papel, v_nome from public.equipe_legisla e where e.user_id = p_user;
  if not found then raise exception 'Pessoa não encontrada.'; end if;
  if v_papel = 'admin'
     and not exists (select 1 from public.equipe_legisla e where e.papel = 'admin' and e.user_id <> p_user) then
    raise exception 'A equipe precisa ter ao menos um admin.';
  end if;

  -- audita antes de apagar: se for a própria pessoa, o nome do autor ainda existe
  perform private.audita('equipe.remover', 'equipe', p_user::text,
    jsonb_build_object('nome', v_nome, 'papel', v_papel));
  delete from public.equipe_legisla where user_id = p_user;
end;
$$;

revoke execute on function
  public.admin_equipe(), public.admin_buscar_usuario(text), public.admin_equipe_incluir(uuid, text),
  public.admin_equipe_papel(uuid, text), public.admin_equipe_remover(uuid)
  from public, anon;
grant execute on function
  public.admin_equipe(), public.admin_buscar_usuario(text), public.admin_equipe_incluir(uuid, text),
  public.admin_equipe_papel(uuid, text), public.admin_equipe_remover(uuid)
  to authenticated;
