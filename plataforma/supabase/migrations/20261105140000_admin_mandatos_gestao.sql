-- =====================================================================
-- PAINEL ADMIN · migration 3: gestão de mandatos e membros
--
-- Funções security definer (papel admin, auditoria na mesma transação) para
-- membros, arquivar e excluir mandato, e um gatilho que impede o gabinete de
-- mexer em mandatos.arquivado_em pela API.
--
-- Escrita idempotente (pode ser reaplicada sem erro).
-- =====================================================================

-- ---------- GATILHO: arquivado_em é só da equipe admin ----------
-- mandatos_editar deixa qualquer membro gravar qualquer coluna; sem isto um gabinete
-- arquivaria ou desarquivaria o próprio mandato por API. Sem uid na sessão (postgres,
-- service_role, migrations) não há API envolvida e a mudança passa.
-- Arquivar não é atividade do gabinete: devolve atualizado_em (o carimbo mandatos_touch
-- dispara antes, pela ordem alfabética dos nomes, e este gatilho vem depois).
create or replace function public.mandatos_trava_arquivo()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.arquivado_em is distinct from old.arquivado_em then
    if (select auth.uid()) is not null and not private.eh_legisla_admin() then
      raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
    end if;
    new.atualizado_em := old.atualizado_em;
  end if;
  return new;
end;
$$;

drop trigger if exists mandatos_trava_arquivo on public.mandatos;
create trigger mandatos_trava_arquivo before update on public.mandatos
  for each row execute function public.mandatos_trava_arquivo();

-- ---------- MEMBROS ----------

-- Lista os membros de um mandato com e-mail (de auth.users): admin e leitura leem.
-- SPEC_DEVIATION: tasks.md (T5) diz "só para admin" para admin_membros; a spec (ADM-02.6, ADM-07.3) manda
-- a equipe de leitura ver o detalhe do mandato, com a lista de membros, só sem botões de alteração.
-- Reason: a leitura precisa desta função para ver nome e e-mail; as funções de escrita seguem só admin.
create or replace function public.admin_membros(p_mandato uuid)
returns table (user_id uuid, nome text, email text, papel text, criado_em timestamptz)
language plpgsql security definer set search_path = '' stable as $$
begin
  if not private.eh_legisla() then
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

create or replace function public.admin_membro_adicionar(p_mandato uuid, p_user uuid, p_papel text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_codigo text;
  v_email text;
  v_nome text;
  v_linhas int;
begin
  if not private.eh_legisla_admin() then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  if coalesce(p_papel, '') not in ('coordenacao', 'assessoria') then
    raise exception 'Papel inválido.';
  end if;
  select m.codigo into v_codigo from public.mandatos m where m.id = p_mandato;
  if not found then raise exception 'Mandato não encontrado.'; end if;
  select u.email,
         coalesce(nullif(u.raw_user_meta_data->>'nome', ''), nullif(u.raw_user_meta_data->>'full_name', ''),
                  nullif(u.raw_user_meta_data->>'name', ''), u.email)
    into v_email, v_nome
  from auth.users u where u.id = p_user;
  if not found then raise exception 'Pessoa não encontrada.'; end if;

  insert into public.membros (mandato_id, user_id, nome, papel) values (p_mandato, p_user, v_nome, p_papel)
  on conflict (mandato_id, user_id) do nothing;
  get diagnostics v_linhas = row_count;
  if v_linhas = 0 then raise exception 'Esta pessoa já é membro deste mandato.'; end if;

  perform private.audita('membro.adicionar', 'mandato', p_mandato::text,
    jsonb_build_object('codigo', v_codigo, 'user_id', p_user, 'nome', v_nome, 'email', v_email, 'papel', p_papel));
end;
$$;

create or replace function public.admin_membro_papel(p_mandato uuid, p_user uuid, p_papel text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_codigo text;
  v_antigo text;
  v_nome text;
begin
  if not private.eh_legisla_admin() then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  if coalesce(p_papel, '') not in ('coordenacao', 'assessoria') then
    raise exception 'Papel inválido.';
  end if;
  select m.codigo into v_codigo from public.mandatos m where m.id = p_mandato;
  if not found then raise exception 'Mandato não encontrado.'; end if;
  -- trava a coordenação para que dois rebaixamentos simultâneos não a esvaziem
  perform 1 from public.membros b where b.mandato_id = p_mandato and b.papel = 'coordenacao' for update;
  select b.papel, b.nome into v_antigo, v_nome
  from public.membros b where b.mandato_id = p_mandato and b.user_id = p_user;
  if not found then raise exception 'Pessoa não encontrada.'; end if;
  if v_antigo = 'coordenacao' and p_papel <> 'coordenacao'
     and not exists (select 1 from public.membros b
                     where b.mandato_id = p_mandato and b.papel = 'coordenacao' and b.user_id <> p_user) then
    raise exception 'O mandato precisa de ao menos uma pessoa na coordenação.';
  end if;

  perform private.audita('membro.papel', 'mandato', p_mandato::text,
    jsonb_build_object('codigo', v_codigo, 'user_id', p_user, 'nome', v_nome, 'de', v_antigo, 'para', p_papel));
  update public.membros set papel = p_papel where mandato_id = p_mandato and user_id = p_user;
end;
$$;

create or replace function public.admin_membro_remover(p_mandato uuid, p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_codigo text;
  v_papel text;
  v_nome text;
begin
  if not private.eh_legisla_admin() then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  select m.codigo into v_codigo from public.mandatos m where m.id = p_mandato;
  if not found then raise exception 'Mandato não encontrado.'; end if;
  perform 1 from public.membros b where b.mandato_id = p_mandato and b.papel = 'coordenacao' for update;
  select b.papel, b.nome into v_papel, v_nome
  from public.membros b where b.mandato_id = p_mandato and b.user_id = p_user;
  if not found then raise exception 'Pessoa não encontrada.'; end if;
  if v_papel = 'coordenacao'
     and not exists (select 1 from public.membros b
                     where b.mandato_id = p_mandato and b.papel = 'coordenacao' and b.user_id <> p_user) then
    raise exception 'O mandato precisa de ao menos uma pessoa na coordenação.';
  end if;

  -- só a linha de membros sai: a conta e os eventos que a pessoa escreveu ficam
  perform private.audita('membro.remover', 'mandato', p_mandato::text,
    jsonb_build_object('codigo', v_codigo, 'user_id', p_user, 'nome', v_nome, 'papel', v_papel));
  delete from public.membros where mandato_id = p_mandato and user_id = p_user;
end;
$$;

-- ---------- ARQUIVAR E EXCLUIR ----------

create or replace function public.admin_mandato_arquivar(p_id uuid, p_arquivar boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_codigo text;
begin
  if not private.eh_legisla_admin() then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  if p_arquivar is null then raise exception 'Informe se é para arquivar ou desarquivar.'; end if;
  select m.codigo into v_codigo from public.mandatos m where m.id = p_id for update;
  if not found then raise exception 'Mandato não encontrado.'; end if;

  perform private.audita(case when p_arquivar then 'mandato.arquivar' else 'mandato.desarquivar' end,
    'mandato', p_id::text, jsonb_build_object('codigo', v_codigo));
  update public.mandatos set arquivado_em = case when p_arquivar then coalesce(arquivado_em, now()) else null end
  where id = p_id;
end;
$$;

-- Exclusão definitiva: o código digitado precisa ser igual ao do mandato. Membros e eventos saem
-- em cascata; sugestoes.mandato_id fica nulo (on delete set null). A auditoria guarda código e nome.
create or replace function public.admin_mandato_excluir(p_id uuid, p_codigo text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_codigo text;
  v_nome text;
begin
  if not private.eh_legisla_admin() then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  select m.codigo, m.nome_parlamentar into v_codigo, v_nome from public.mandatos m where m.id = p_id for update;
  if not found then raise exception 'Mandato não encontrado.'; end if;
  if p_codigo is distinct from v_codigo then raise exception 'O código digitado não confere com o do mandato.'; end if;

  perform private.audita('mandato.excluir', 'mandato', p_id::text,
    jsonb_build_object('codigo', v_codigo, 'nome_parlamentar', v_nome));
  delete from public.mandatos where id = p_id;
end;
$$;

revoke execute on function
  public.admin_membros(uuid), public.admin_membro_adicionar(uuid, uuid, text),
  public.admin_membro_papel(uuid, uuid, text), public.admin_membro_remover(uuid, uuid),
  public.admin_mandato_arquivar(uuid, boolean), public.admin_mandato_excluir(uuid, text)
  from public, anon;
grant execute on function
  public.admin_membros(uuid), public.admin_membro_adicionar(uuid, uuid, text),
  public.admin_membro_papel(uuid, uuid, text), public.admin_membro_remover(uuid, uuid),
  public.admin_mandato_arquivar(uuid, boolean), public.admin_mandato_excluir(uuid, text)
  to authenticated;

-- o gatilho roda para quem atualiza mandatos; não é endpoint da API
revoke execute on function public.mandatos_trava_arquivo() from public, anon, authenticated;
