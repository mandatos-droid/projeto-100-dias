-- =====================================================================
-- PAPÉIS DO MANDATO · Parlamentar e Chefe de Gabinete · feedback da Missão 5 restrito
-- · um e-mail, um mandato
--
-- Decisões do usuário:
--   1. Cinco papéis, do maior para o menor: parlamentar > chefe_gabinete > coordenacao >
--      assessoria > leitura. Quem já é membro mantém o papel; os novos são dados por convite
--      ou por troca de papel.
--   2. Parlamentar, chefe_gabinete e coordenacao gerem a equipe (convidar, trocar papel,
--      remover) e editam. Cada um só concede, e só mexe em quem tem, papel igual ou menor.
--   3. O feedback da Missão 5 (texto das conversas) só é lido e gravado por parlamentar e
--      chefe_gabinete. Fica numa tabela própria com RLS, fora de mandatos.dados, para o texto
--      nem chegar ao navegador de quem não tem permissão.
--   4. Cada e-mail só cria ou integra um mandato. Só admin da equipe Legisla passa disso.
--
-- Escrita idempotente (pode ser reaplicada sem erro).
-- =====================================================================

-- ---------- 1. PAPÉIS ----------
alter table public.membros drop constraint if exists membros_papel_check;
alter table public.membros
  add constraint membros_papel_check
  check (papel in ('parlamentar', 'chefe_gabinete', 'coordenacao', 'assessoria', 'leitura'));

alter table public.convites drop constraint if exists convites_papel_check;
alter table public.convites
  add constraint convites_papel_check
  check (papel in ('parlamentar', 'chefe_gabinete', 'coordenacao', 'assessoria', 'leitura'));

create or replace function private.nivel_papel(p text)
returns int language sql immutable set search_path = '' as $$
  select case p when 'parlamentar' then 5 when 'chefe_gabinete' then 4 when 'coordenacao' then 3
                when 'assessoria' then 2 when 'leitura' then 1 else 0 end
$$;

-- todos os papéis, menos leitura, editam o conteúdo do mandato
create or replace function private.pode_editar(p_mandato uuid)
returns boolean language sql security definer set search_path = '' stable as $$
  select coalesce(private.nivel_papel(private.papel_no_mandato(p_mandato)) >= 2, false)
$$;

-- gerem a equipe: parlamentar, chefe_gabinete e coordenacao
create or replace function private.pode_gerir(p_mandato uuid)
returns boolean language sql security definer set search_path = '' stable as $$
  select coalesce(private.nivel_papel(private.papel_no_mandato(p_mandato)) >= 3, false)
$$;

-- veem e editam o feedback da Missão 5: só parlamentar e chefe_gabinete
create or replace function private.pode_ver_feedback(p_mandato uuid)
returns boolean language sql security definer set search_path = '' stable as $$
  select coalesce(private.papel_no_mandato(p_mandato) in ('parlamentar', 'chefe_gabinete'), false)
$$;

revoke execute on function private.pode_gerir(uuid), private.pode_ver_feedback(uuid) from public, anon;
grant  execute on function private.pode_gerir(uuid), private.pode_ver_feedback(uuid) to authenticated;

-- ---------- equipe: gestão por nível ----------
-- Repetem as de 20261106120000_convites_equipe.sql. A trava de linhas (for update) segue igual:
-- chamadas simultâneas ficam em fila. "Ao menos uma pessoa na coordenação" passa a contar
-- qualquer papel de gestão (parlamentar, chefe_gabinete ou coordenacao).
create or replace function public.membro_trocar_papel(p_mandato uuid, p_user uuid, p_papel text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_meu    text;
  v_antigo text;
begin
  perform 1 from public.membros b where b.mandato_id = p_mandato for update;
  v_meu := private.papel_no_mandato(p_mandato);
  if private.nivel_papel(v_meu) < 3 then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  if private.nivel_papel(p_papel) = 0 then
    raise exception 'Papel inválido.';
  end if;
  select b.papel into v_antigo from public.membros b where b.mandato_id = p_mandato and b.user_id = p_user;
  if not found then raise exception 'Pessoa não encontrada.'; end if;
  if private.nivel_papel(p_papel) > private.nivel_papel(v_meu)
     or private.nivel_papel(v_antigo) > private.nivel_papel(v_meu) then
    raise exception 'Você só pode mexer em papéis iguais ou menores que o seu.' using errcode = '42501';
  end if;
  if private.nivel_papel(v_antigo) >= 3 and private.nivel_papel(p_papel) < 3
     and not exists (select 1 from public.membros b
                     where b.mandato_id = p_mandato and private.nivel_papel(b.papel) >= 3 and b.user_id <> p_user) then
    raise exception 'O mandato precisa ter ao menos uma pessoa na coordenação.';
  end if;

  update public.membros set papel = p_papel where mandato_id = p_mandato and user_id = p_user;
  perform private.evento_equipe(p_mandato, 'papel_trocado', p_user, private.nome_pessoa(p_mandato, p_user), p_papel);
end;
$$;

revoke execute on function public.membro_trocar_papel(uuid, uuid, text) from public, anon;
grant  execute on function public.membro_trocar_papel(uuid, uuid, text) to authenticated;

create or replace function public.membro_remover(p_mandato uuid, p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_meu   text;
  v_papel text;
begin
  perform 1 from public.membros b where b.mandato_id = p_mandato for update;
  v_meu := private.papel_no_mandato(p_mandato);
  if private.nivel_papel(v_meu) < 3 then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  select b.papel into v_papel from public.membros b where b.mandato_id = p_mandato and b.user_id = p_user;
  if not found then raise exception 'Pessoa não encontrada.'; end if;
  if private.nivel_papel(v_papel) > private.nivel_papel(v_meu) then
    raise exception 'Você só pode mexer em papéis iguais ou menores que o seu.' using errcode = '42501';
  end if;
  if private.nivel_papel(v_papel) >= 3
     and not exists (select 1 from public.membros b
                     where b.mandato_id = p_mandato and private.nivel_papel(b.papel) >= 3 and b.user_id <> p_user) then
    raise exception 'O mandato precisa ter ao menos uma pessoa na coordenação.';
  end if;

  perform private.evento_equipe(p_mandato, 'membro_removido', p_user, private.nome_pessoa(p_mandato, p_user), v_papel);
  delete from public.membros where mandato_id = p_mandato and user_id = p_user;
end;
$$;

revoke execute on function public.membro_remover(uuid, uuid) from public, anon;
grant  execute on function public.membro_remover(uuid, uuid) to authenticated;

-- Repete a de 20261106150000_convites_de_quem_sai.sql (papel_ao_sair) com a trava por nível.
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
  if private.nivel_papel(v_papel) >= 3
     and not exists (select 1 from public.membros b
                     where b.mandato_id = p_mandato and private.nivel_papel(b.papel) >= 3 and b.user_id <> v_uid) then
    raise exception 'O mandato precisa ter ao menos uma pessoa na coordenação.';
  end if;

  update public.convites set papel_ao_sair = v_papel where mandato_id = p_mandato and criado_por = v_uid;
  perform private.evento_equipe(p_mandato, 'membro_saiu', v_uid, private.nome_pessoa(p_mandato, v_uid), v_papel);
  delete from public.membros where mandato_id = p_mandato and user_id = v_uid;
end;
$$;

revoke execute on function public.membro_sair(uuid) from public, anon;
grant  execute on function public.membro_sair(uuid) to authenticated;

-- Repete a de 20261106120000_convites_equipe.sql: quem gere o mandato cancela qualquer convite.
create or replace function public.convite_cancelar(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := (select auth.uid());
  v_c     public.convites%rowtype;
  v_papel text;
begin
  select * into v_c from public.convites c where c.id = p_id for update;
  v_papel := private.papel_no_mandato(v_c.mandato_id);
  if v_papel is null or (private.nivel_papel(v_papel) < 3 and v_c.criado_por is distinct from v_uid) then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  if v_c.usado_em is not null or v_c.cancelado_em is not null or v_c.expira_em <= now() then
    return;
  end if;

  update public.convites set cancelado_em = now(), cancelado_por = v_uid where id = p_id;
  perform private.evento_equipe(v_c.mandato_id, 'convite_cancelado', null, v_c.nome, v_c.papel);
end;
$$;

revoke execute on function public.convite_cancelar(uuid) from public, anon;
grant  execute on function public.convite_cancelar(uuid) to authenticated;

-- Repete a de 20261106130000_papeis_blindagem.sql: quem gere o mandato exclui o cadastro.
create or replace function public.excluir_mandato(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'Não autenticado.'; end if;
  if not private.pode_gerir(p_id) then
    raise exception 'Só a coordenação do mandato pode excluir o cadastro.' using errcode = '42501';
  end if;
  delete from public.mandatos where id = p_id;
end;
$$;

revoke execute on function public.excluir_mandato(uuid) from public, anon;
grant  execute on function public.excluir_mandato(uuid) to authenticated;

-- ---------- admin da equipe Legisla: os cinco papéis ----------
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
  if private.nivel_papel(p_papel) < 2 then
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
  if private.nivel_papel(p_papel) < 2 then
    raise exception 'Papel inválido.';
  end if;
  select m.codigo into v_codigo from public.mandatos m where m.id = p_mandato;
  if not found then raise exception 'Mandato não encontrado.'; end if;
  perform 1 from public.membros b where b.mandato_id = p_mandato for update;
  select b.papel, b.nome into v_antigo, v_nome
  from public.membros b where b.mandato_id = p_mandato and b.user_id = p_user;
  if not found then raise exception 'Pessoa não encontrada.'; end if;
  if private.nivel_papel(v_antigo) >= 3 and private.nivel_papel(p_papel) < 3
     and not exists (select 1 from public.membros b
                     where b.mandato_id = p_mandato and private.nivel_papel(b.papel) >= 3 and b.user_id <> p_user) then
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
  perform 1 from public.membros b where b.mandato_id = p_mandato for update;
  select b.papel, b.nome into v_papel, v_nome
  from public.membros b where b.mandato_id = p_mandato and b.user_id = p_user;
  if not found then raise exception 'Pessoa não encontrada.'; end if;
  if private.nivel_papel(v_papel) >= 3
     and not exists (select 1 from public.membros b
                     where b.mandato_id = p_mandato and private.nivel_papel(b.papel) >= 3 and b.user_id <> p_user) then
    raise exception 'O mandato precisa de ao menos uma pessoa na coordenação.';
  end if;

  perform private.audita('membro.remover', 'mandato', p_mandato::text,
    jsonb_build_object('codigo', v_codigo, 'user_id', p_user, 'nome', v_nome, 'papel', v_papel));
  delete from public.membros where mandato_id = p_mandato and user_id = p_user;
end;
$$;

-- ---------- 2. FEEDBACK DA MISSÃO 5 EM TABELA PRÓPRIA ----------
-- RLS: só parlamentar e chefe_gabinete do mandato leem e gravam. A equipe Legisla não lê o texto.
create table if not exists public.feedbacks_mandato (
  mandato_id    uuid primary key references public.mandatos on delete cascade,
  dados         jsonb not null,
  atualizado_em timestamptz not null default now()
);

alter table public.feedbacks_mandato enable row level security;

drop policy if exists feedbacks_ler on public.feedbacks_mandato;
create policy feedbacks_ler on public.feedbacks_mandato
  for select to authenticated using (private.pode_ver_feedback(mandato_id));

drop policy if exists feedbacks_criar on public.feedbacks_mandato;
create policy feedbacks_criar on public.feedbacks_mandato
  for insert to authenticated with check (private.pode_ver_feedback(mandato_id));

drop policy if exists feedbacks_editar on public.feedbacks_mandato;
create policy feedbacks_editar on public.feedbacks_mandato
  for update to authenticated
  using (private.pode_ver_feedback(mandato_id)) with check (private.pode_ver_feedback(mandato_id));

revoke all on public.feedbacks_mandato from public, anon;
grant select, insert, update on public.feedbacks_mandato to authenticated;

-- migra o que já existe e tira a chave de mandatos.dados
insert into public.feedbacks_mandato (mandato_id, dados)
select m.id, m.dados->'feedbacks' from public.mandatos m
where m.dados ? 'feedbacks' and jsonb_typeof(m.dados->'feedbacks') <> 'null'
on conflict (mandato_id) do nothing;

update public.mandatos set dados = dados - 'feedbacks' where dados ? 'feedbacks';

-- Rede de segurança: o Guia grava mandatos.dados inteiro. Se vier a chave "feedbacks", ela sai de
-- dados e, se quem grava pode ver o feedback, vai para a tabela; senão é descartada. Assim um
-- cliente sem permissão (ou antigo) nunca grava nem apaga o feedback. Sem sessão (migrations,
-- service_role) também grava na tabela.
create or replace function public.mandatos_separa_feedbacks()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_lista jsonb;
begin
  if new.dados is null or not (new.dados ? 'feedbacks') then
    return new;
  end if;
  v_lista := new.dados->'feedbacks';
  new.dados := new.dados - 'feedbacks';
  if tg_op = 'UPDATE' and jsonb_typeof(v_lista) <> 'null'
     and ((select auth.uid()) is null or private.pode_ver_feedback(new.id)) then
    insert into public.feedbacks_mandato (mandato_id, dados) values (new.id, v_lista)
    on conflict (mandato_id) do update set dados = excluded.dados, atualizado_em = now();
  end if;
  return new;
end;
$$;

revoke execute on function public.mandatos_separa_feedbacks() from public, anon, authenticated;

drop trigger if exists mandatos_separa_feedbacks on public.mandatos;
create trigger mandatos_separa_feedbacks before insert or update on public.mandatos
  for each row execute function public.mandatos_separa_feedbacks();

-- o painel da equipe só precisa da contagem, nunca do texto
create or replace function private.feedbacks_contagem(p_mandato uuid)
returns int language sql security definer set search_path = '' stable as $$
  select case when private.eh_membro(p_mandato) or private.eh_legisla()
    then coalesce((select case when jsonb_typeof(f.dados) = 'array' then jsonb_array_length(f.dados) end
                   from public.feedbacks_mandato f where f.mandato_id = p_mandato), 0)
    else 0 end
$$;

revoke execute on function private.feedbacks_contagem(uuid) from public, anon;
grant  execute on function private.feedbacks_contagem(uuid) to authenticated;

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
  private.feedbacks_contagem(m.id)                                     as feedbacks,
  coalesce(jsonb_array_length(m.dados->'preditores'), 0)               as preditores_escolhidos,
  (select count(*) from jsonb_each(coalesce(m.dados->'feitos','{}'::jsonb)) f
    where f.value = 'true'::jsonb)                                     as exercicios_concluidos,
  m.resp_nome, m.resp_cargo, m.atualizado_em
from public.mandatos m;

-- ---------- 3. UM E-MAIL, UM MANDATO ----------
-- Só admin da equipe Legisla (e rotinas sem sessão, como migrations) passa de um mandato.
-- Quem já está em mais de um continua como está: a regra vale para novas entradas.
create or replace function private.ja_em_outro_mandato(p_user uuid, p_mandato uuid)
returns boolean language sql security definer set search_path = '' stable as $$
  select exists (select 1 from public.membros b where b.user_id = p_user and b.mandato_id is distinct from p_mandato)
$$;

revoke execute on function private.ja_em_outro_mandato(uuid, uuid) from public, anon;
grant  execute on function private.ja_em_outro_mandato(uuid, uuid) to authenticated;

create or replace function public.membros_um_mandato()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null and not private.eh_legisla_admin()
     and private.ja_em_outro_mandato(new.user_id, new.mandato_id) then
    raise exception 'Este e-mail já está vinculado a um mandato. Cada e-mail só pode integrar um mandato.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.membros_um_mandato() from public, anon, authenticated;

drop trigger if exists membros_um_mandato on public.membros;
create trigger membros_um_mandato before insert on public.membros
  for each row execute function public.membros_um_mandato();

-- criar mandato: quem já está em um mandato não cria outro
-- Repete a de 20261109120000_perfis.sql e acrescenta a regra.
drop policy if exists mandatos_criar on public.mandatos;
create policy mandatos_criar on public.mandatos
  for insert to authenticated
  with check (
    criado_por = (select auth.uid()) and private.tem_perfil()
    and (private.eh_legisla_admin() or not private.ja_em_outro_mandato((select auth.uid()), null))
  );

-- convite_aceitar: quem já está em outro mandato recebe {ok:false, erro:'outro_mandato'} e o
-- convite não é consumido. Repete a de 20261109120000_perfis.sql.
create or replace function public.convite_aceitar(p_token text, p_nome text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid    uuid := (select auth.uid());
  v_origem text := private.convite_origem();
  v_c      public.convites%rowtype;
begin
  if v_uid is null then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  if private.convite_limite(v_origem) then
    return jsonb_build_object('ok', false, 'erro', 'limite');
  end if;
  select * into v_c from public.convites c
  where c.token_hash = sha256(convert_to(coalesce(p_token, ''), 'UTF8')) for update;
  if not found or v_c.usado_em is not null or v_c.cancelado_em is not null or v_c.expira_em <= now()
     or not private.convite_autorizado(v_c.mandato_id, v_c.criado_por, v_c.papel, v_c.papel_ao_sair) then
    return private.convite_falha(v_origem);
  end if;

  if exists (select 1 from public.membros b where b.mandato_id = v_c.mandato_id and b.user_id = v_uid) then
    return jsonb_build_object('ok', true, 'mandato_id', v_c.mandato_id, 'ja_membro', true);
  end if;
  if v_c.email is not null
     and v_c.email is distinct from (select lower(btrim(u.email)) from auth.users u where u.id = v_uid) then
    return jsonb_build_object('ok', false, 'erro', 'email');
  end if;
  if not private.eh_legisla_admin() and private.ja_em_outro_mandato(v_uid, v_c.mandato_id) then
    return jsonb_build_object('ok', false, 'erro', 'outro_mandato');
  end if;
  if not private.tem_perfil() then
    return jsonb_build_object('ok', false, 'erro', 'perfil');
  end if;
  if not exists (select 1 from public.consentimentos k where k.user_id = v_uid) then
    return jsonb_build_object('ok', false, 'erro', 'consentimento');
  end if;

  insert into public.membros (mandato_id, user_id, nome, papel)
  values (v_c.mandato_id, v_uid, coalesce(nullif(btrim(p_nome), ''), private.nome_pessoa(v_c.mandato_id, v_uid)), v_c.papel);
  update public.convites set usado_em = now(), usado_por = v_uid where id = v_c.id;
  perform private.evento_equipe(v_c.mandato_id, 'convite_aceito', v_uid, private.nome_pessoa(v_c.mandato_id, v_uid), v_c.papel);
  return jsonb_build_object('ok', true, 'mandato_id', v_c.mandato_id, 'ja_membro', false);
end;
$$;

revoke execute on function public.convite_aceitar(text, text) from public, anon;
grant  execute on function public.convite_aceitar(text, text) to authenticated;
