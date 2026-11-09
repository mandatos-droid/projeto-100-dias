-- =====================================================================
-- ACESSO, EQUIPE E CONVITES · convites de quem sai por conta própria
--
-- Decisão do usuário (AD-012, supera em parte o AD-011): quem sai do mandato por conta própria
-- (membro_sair) não faz os convites que criou deixarem de valer. Cada convite guarda o papel que a
-- pessoa tinha ao sair (papel_ao_sair) e, enquanto ela estiver fora, vale até esse papel. A brecha
-- V-1 segue fechada:
--   1. quem é rebaixado e depois sai grava o papel novo, menor;
--   2. remoção (pela coordenação ou pelo /admin) não grava papel_ao_sair: os convites não valem;
--   3. quem entra de novo no mandato, por qualquer caminho, tem papel_ao_sair zerado (gatilho em
--      membros): vale o papel atual e, se depois for removido, nenhum convite antigo volta a valer;
--   4. conta apagada (criado_por nulo) ou excluir_meus_dados(): o convite não vale.
--
-- As quatro funções de convite repetem as de 20261106140000_convites_autoridade.sql; só muda a
-- chamada de private.convite_autorizado, que passa a receber papel_ao_sair.
-- Escrita idempotente (pode ser reaplicada sem erro).
-- =====================================================================

-- só membro_sair grava (com o papel lido de membros); a reentrada e excluir_meus_dados zeram
alter table public.convites add column if not exists papel_ao_sair text;

-- ---------- autoridade de quem convidou ----------
-- Conta apagada: falso. Membro do mandato: vale o papel atual. Fora do mandato: vale o papel
-- gravado na última saída por conta própria (nulo tem nível 0 e não vale).
drop function if exists private.convite_autorizado(uuid, uuid, text);

create or replace function private.convite_autorizado(p_mandato uuid, p_criado_por uuid, p_papel text, p_papel_ao_sair text)
returns boolean language sql security definer set search_path = '' stable as $$
  select case
    when p_criado_por is null then false
    when exists (select 1 from public.membros b where b.mandato_id = p_mandato and b.user_id = p_criado_por)
      then exists (select 1 from public.membros b
                   where b.mandato_id = p_mandato and b.user_id = p_criado_por
                     and private.nivel_papel(b.papel) >= private.nivel_papel(p_papel))
    else private.nivel_papel(p_papel_ao_sair) >= private.nivel_papel(p_papel)
  end
$$;

revoke execute on function private.convite_autorizado(uuid, uuid, text, text) from public, anon, authenticated;

-- ---------- reentrada: o papel da saída anterior deixa de valer ----------
-- Vale para convite_aceitar, admin_membro_adicionar e o cadastro do Guia. Só zera: nunca faz um
-- convite valer mais.
create or replace function private.convites_reentrada()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.convites set papel_ao_sair = null
  where mandato_id = new.mandato_id and criado_por = new.user_id;
  return null;
end;
$$;

revoke execute on function private.convites_reentrada() from public, anon, authenticated;

drop trigger if exists membros_reentrada on public.membros;
create trigger membros_reentrada after insert on public.membros
  for each row execute function private.convites_reentrada();

-- ---------- membro_sair: grava o papel de quem sai nos convites dela ----------
-- Repete a de 20261106120000_convites_equipe.sql. Cada saída sobrescreve o papel da anterior.
-- Usado e cancelado não voltam, então gravar neles não muda nada.
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

  update public.convites set papel_ao_sair = v_papel where mandato_id = p_mandato and criado_por = v_uid;
  perform private.evento_equipe(p_mandato, 'membro_saiu', v_uid, private.nome_pessoa(p_mandato, v_uid), v_papel);
  delete from public.membros where mandato_id = p_mandato and user_id = v_uid;
end;
$$;

revoke execute on function public.membro_sair(uuid) from public, anon;
grant  execute on function public.membro_sair(uuid) to authenticated;

-- ---------- excluir_meus_dados: nenhum convite da pessoa segue valendo ----------
-- Repete a de 20261016120000_schema_inicial.sql e zera papel_ao_sair em todos os mandatos.
create or replace function public.excluir_meus_dados()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'Não autenticado.'; end if;
  update public.eventos set user_id = null, autor = 'usuário removido' where user_id = (select auth.uid());
  update public.convites set papel_ao_sair = null where criado_por = (select auth.uid());
  delete from public.membros        where user_id = (select auth.uid());
  delete from public.consentimentos where user_id = (select auth.uid());
end;
$$;

revoke execute on function public.excluir_meus_dados() from public, anon;
grant  execute on function public.excluir_meus_dados() to authenticated;

-- ---------- convite_criar: o limite de 20 conta os convites que ainda valem ----------
create or replace function public.convite_criar(p_mandato uuid, p_nome text, p_email text, p_papel text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid    uuid := (select auth.uid());
  v_meu    text := private.papel_no_mandato(p_mandato);
  v_nome   text := btrim(coalesce(p_nome, ''));
  v_email  text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_token  text;
  v_id     uuid;
  v_expira timestamptz;
begin
  if v_meu is null then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  if char_length(v_nome) not between 1 and 80 then
    raise exception 'Informe um nome de até 80 caracteres.';
  end if;
  if v_email is not null
     and (char_length(v_email) > 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
    raise exception 'E-mail inválido.';
  end if;
  if private.nivel_papel(p_papel) > private.nivel_papel(v_meu) then
    raise exception 'Você só pode convidar com papel igual ou menor que o seu.';
  end if;
  if (select count(*) from public.convites c
      where c.mandato_id = p_mandato and c.usado_em is null and c.cancelado_em is null and c.expira_em > now()
        and private.convite_autorizado(c.mandato_id, c.criado_por, c.papel, c.papel_ao_sair)) >= 20 then
    raise exception 'Este mandato já tem 20 convites pendentes. Cancele algum para criar outro.';
  end if;

  -- retenção: some o nome e o e-mail de quem nunca entrou (vencidos ou cancelados há mais de 30 dias)
  delete from public.convites c
  where c.mandato_id = p_mandato and c.usado_em is null
    and (c.expira_em < now() - interval '30 days' or c.cancelado_em < now() - interval '30 days');

  v_token := private.token_aleatorio();
  insert into public.convites (mandato_id, token_hash, nome, email, papel, criado_por, criado_por_nome, expira_em)
  values (p_mandato, sha256(convert_to(v_token, 'UTF8')), v_nome, v_email, p_papel, v_uid,
          private.nome_pessoa(p_mandato, v_uid), now() + interval '7 days')
  returning id, expira_em into v_id, v_expira;

  perform private.evento_equipe(p_mandato, 'convite_criado', null, v_nome, p_papel);
  return jsonb_build_object('id', v_id, 'token', v_token, 'expira_em', v_expira);
end;
$$;

revoke execute on function public.convite_criar(uuid, text, text, text) from public, anon;
grant  execute on function public.convite_criar(uuid, text, text, text) to authenticated;

-- ---------- convites_pendentes: só os que ainda valem ----------
create or replace function public.convites_pendentes(p_mandato uuid)
returns table (id uuid, nome text, papel text, convidado_por_nome text, expira_em timestamptz)
language plpgsql security definer set search_path = '' stable as $$
begin
  if not private.eh_membro(p_mandato) then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  return query
    select c.id, c.nome, c.papel, c.criado_por_nome, c.expira_em
    from public.convites c
    where c.mandato_id = p_mandato and c.usado_em is null and c.cancelado_em is null and c.expira_em > now()
      and private.convite_autorizado(c.mandato_id, c.criado_por, c.papel, c.papel_ao_sair)
    order by c.criado_em desc, c.id;
end;
$$;

revoke execute on function public.convites_pendentes(uuid) from public, anon;
grant  execute on function public.convites_pendentes(uuid) to authenticated;

-- ---------- convite_previa: convite sem autoridade responde como inexistente ----------
create or replace function public.convite_previa(p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_origem text := private.convite_origem();
  v_c      record;
begin
  if private.convite_limite(v_origem) then
    return jsonb_build_object('ok', false, 'erro', 'limite');
  end if;
  select c.nome, c.papel, c.criado_por_nome, c.email, m.nome_parlamentar, m.cargo, m.uf into v_c
  from public.convites c join public.mandatos m on m.id = c.mandato_id
  where c.token_hash = sha256(convert_to(coalesce(p_token, ''), 'UTF8'))
    and c.usado_em is null and c.cancelado_em is null and c.expira_em > now()
    and private.convite_autorizado(c.mandato_id, c.criado_por, c.papel, c.papel_ao_sair);
  if not found then
    return private.convite_falha(v_origem);
  end if;
  return jsonb_build_object(
    'ok', true, 'nome', v_c.nome, 'papel', v_c.papel, 'convidado_por', v_c.criado_por_nome,
    'mandato', jsonb_build_object('nome_parlamentar', v_c.nome_parlamentar, 'cargo', v_c.cargo, 'uf', v_c.uf),
    'exige_email', v_c.email is not null);
end;
$$;

revoke execute on function public.convite_previa(text) from public;
grant  execute on function public.convite_previa(text) to anon, authenticated;

-- ---------- convite_aceitar: convite sem autoridade responde como inexistente ----------
-- A conferência vem antes de "já é membro": quem foi rebaixado e ainda está no mandato também
-- recebe a resposta de convite inválido.
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
  if not exists (select 1 from public.consentimentos k where k.user_id = v_uid) then
    return jsonb_build_object('ok', false, 'erro', 'consentimento');
  end if;

  -- sem nome no aceite (quem já tem sessão), vale o nome da conta
  insert into public.membros (mandato_id, user_id, nome, papel)
  values (v_c.mandato_id, v_uid, coalesce(nullif(btrim(p_nome), ''), private.nome_pessoa(v_c.mandato_id, v_uid)), v_c.papel);
  update public.convites set usado_em = now(), usado_por = v_uid where id = v_c.id;
  perform private.evento_equipe(v_c.mandato_id, 'convite_aceito', v_uid, private.nome_pessoa(v_c.mandato_id, v_uid), v_c.papel);
  return jsonb_build_object('ok', true, 'mandato_id', v_c.mandato_id, 'ja_membro', false);
end;
$$;

revoke execute on function public.convite_aceitar(text, text) from public, anon;
grant  execute on function public.convite_aceitar(text, text) to authenticated;
