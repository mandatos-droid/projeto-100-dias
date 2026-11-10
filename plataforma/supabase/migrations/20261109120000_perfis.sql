-- =====================================================================
-- PRIMEIRO ACESSO · perfil de quem usa a plataforma
--
-- 1. public.perfis: uma linha por pessoa. Só a própria pessoa e a equipe Legisla (qualquer papel)
--    leem; ninguém escreve direto pela API.
-- 2. public.perfil_salvar: única porta de escrita. Valida o mesmo que a spec (PAG-02.9 a 02.11,
--    PAG-03.7, 03.8), grava o perfil e o consentimento (versão 2026-11) na mesma transação e é
--    idempotente. Erro de campo volta como dado {ok:false, erro:<campo>} (AD-008).
-- 3. private.tem_perfil: verdadeiro para quem está na equipe Legisla (dispensada) ou tem perfil.
--
-- Sem UF: a spec decidiu os campos sem UF em 2026-11-09.
-- Escrita idempotente (pode ser reaplicada sem erro).
-- =====================================================================

create table if not exists public.perfis (
  user_id     uuid primary key references auth.users on delete cascade,
  nome        text not null check (char_length(nome) between 2 and 120 and nome ~ '\S+\s+\S+'),
  nascimento  date not null check (nascimento >= date '1900-01-01'),
  genero      text not null check (genero in ('mulher_cis','homem_cis','mulher_trans','homem_trans','travesti','nao_binaria','outra','nao_informar')),
  raca        text not null check (raca in ('branca','preta','parda','amarela','indigena','nao_informar')),
  telefone    text not null check (telefone ~ '^(1[1-9]|[2-9][0-9])[0-9]{8,9}$'),
  atua        boolean not null,
  tempo       text check (tempo in ('menos_1','1_2','3_5','6_10','mais_10')),
  criado_em   timestamptz not null default now(),
  check ((atua and tempo is not null) or (not atua and tempo is null))
);

alter table public.perfis enable row level security;

-- a própria pessoa (o app sabe se o cadastro está feito) ou a equipe Legisla; membro de mandato não
-- lê o perfil de ninguém, nem do mesmo mandato
drop policy if exists perfis_ler on public.perfis;
create policy perfis_ler on public.perfis
  for select to authenticated
  using (user_id = (select auth.uid()) or private.eh_legisla());

-- sem política de escrita e sem grant de insert, update e delete: só perfil_salvar grava
revoke all on public.perfis from anon, authenticated;
grant select on public.perfis to authenticated;

-- ---------- quem já pode entrar em um mandato ----------
-- Usada pela política mandatos_criar e por convite_aceitar: authenticated precisa executar.
create or replace function private.tem_perfil()
returns boolean language sql security definer set search_path = '' stable as $$
  select exists (select 1 from public.equipe_legisla where user_id = (select auth.uid()))
      or exists (select 1 from public.perfis where user_id = (select auth.uid()))
$$;

revoke execute on function private.tem_perfil() from public, anon;
grant  execute on function private.tem_perfil() to authenticated;

-- ---------- gravação do perfil ----------
-- A data chega como texto: data inexistente vira {ok:false, erro:'nascimento'}, não exceção.
-- Quem já tem perfil recebe {ok:true} e nada muda (duplo envio). Se o consentimento falhar, a
-- exceção desfaz o perfil junto.
create or replace function public.perfil_salvar(
  p_nome text, p_nascimento text, p_genero text, p_raca text, p_telefone text, p_atua boolean, p_tempo text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid  uuid := (select auth.uid());
  v_nome text := btrim(coalesce(p_nome, ''));
  v_nasc date;
  v_novo uuid;
begin
  if v_uid is null then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;

  if char_length(v_nome) not between 2 and 120 or v_nome !~ '\S+\s+\S+' then
    return jsonb_build_object('ok', false, 'erro', 'nome');
  end if;
  if coalesce(p_nascimento, '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    return jsonb_build_object('ok', false, 'erro', 'nascimento');
  end if;
  begin
    v_nasc := p_nascimento::date;
  exception when others then
    return jsonb_build_object('ok', false, 'erro', 'nascimento');
  end;
  if v_nasc < date '1900-01-01' or v_nasc > (now() at time zone 'America/Sao_Paulo')::date then
    return jsonb_build_object('ok', false, 'erro', 'nascimento');
  end if;
  if p_genero is null or p_genero not in ('mulher_cis','homem_cis','mulher_trans','homem_trans','travesti','nao_binaria','outra','nao_informar') then
    return jsonb_build_object('ok', false, 'erro', 'genero');
  end if;
  if p_raca is null or p_raca not in ('branca','preta','parda','amarela','indigena','nao_informar') then
    return jsonb_build_object('ok', false, 'erro', 'raca');
  end if;
  if coalesce(p_telefone, '') !~ '^(1[1-9]|[2-9][0-9])[0-9]{8,9}$' then
    return jsonb_build_object('ok', false, 'erro', 'telefone');
  end if;
  if p_atua is null then
    return jsonb_build_object('ok', false, 'erro', 'atua');
  end if;
  if (p_atua and (p_tempo is null or p_tempo not in ('menos_1','1_2','3_5','6_10','mais_10')))
     or (not p_atua and p_tempo is not null) then
    return jsonb_build_object('ok', false, 'erro', 'tempo');
  end if;

  insert into public.perfis (user_id, nome, nascimento, genero, raca, telefone, atua, tempo)
  values (v_uid, v_nome, v_nasc, p_genero, p_raca, p_telefone, p_atua, p_tempo)
  on conflict (user_id) do nothing
  returning user_id into v_novo;

  if v_novo is not null then
    insert into public.consentimentos (user_id, versao) values (v_uid, '2026-11');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.perfil_salvar(text, text, text, text, text, boolean, text) from public, anon;
grant  execute on function public.perfil_salvar(text, text, text, text, text, boolean, text) to authenticated;

-- =====================================================================
-- Trava nas portas de entrada em um mandato (PAG-02.2): aceitar convite, criar mandato e a
-- entrada direta da primeira pessoa em membros. A tela manda ao perfil; quem pular a tela
-- encontra a recusa aqui.
-- =====================================================================

-- ---------- criar mandato: só quem tem perfil (ou é da equipe Legisla) ----------
-- Repete a de 20261016120000_schema_inicial.sql e acrescenta private.tem_perfil().
drop policy if exists mandatos_criar on public.mandatos;
create policy mandatos_criar on public.mandatos
  for insert to authenticated
  with check (criado_por = (select auth.uid()) and private.tem_perfil());

-- ---------- entrada direta em membros: também exige perfil ----------
-- Repete a de 20261106130000_papeis_blindagem.sql e acrescenta private.tem_perfil(). Sem isso,
-- quem criou um mandato e usou excluir_meus_dados (que apaga o perfil e a linha em membros)
-- voltava sozinha como coordenacao, sem perfil.
drop policy if exists membros_criar on public.membros;
create policy membros_criar on public.membros
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and papel = 'coordenacao'
    and exists (select 1 from public.mandatos m
                where m.id = mandato_id and m.criado_por = (select auth.uid()))
    and private.mandato_sem_membros(mandato_id)
    and private.tem_perfil()
  );

-- ---------- convite_aceitar: sem perfil devolve {ok:false, erro:'perfil'} ----------
-- Repete a de 20261106150000_convites_de_quem_sai.sql; só acrescenta a checagem de perfil logo
-- antes da de consentimento: quem não tem perfil vai ao formulário, que grava o consentimento
-- junto, sem ver a etapa de consentimento do convite. O convite não é consumido.
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
  if not private.tem_perfil() then
    return jsonb_build_object('ok', false, 'erro', 'perfil');
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

-- ---------- excluir_meus_dados: apaga também o perfil ----------
-- Repete a de 20261106150000_convites_de_quem_sai.sql e acrescenta a linha de perfis.
create or replace function public.excluir_meus_dados()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'Não autenticado.'; end if;
  update public.eventos set user_id = null, autor = 'usuário removido' where user_id = (select auth.uid());
  update public.convites set papel_ao_sair = null where criado_por = (select auth.uid());
  delete from public.membros        where user_id = (select auth.uid());
  delete from public.consentimentos where user_id = (select auth.uid());
  delete from public.perfis         where user_id = (select auth.uid());
end;
$$;

revoke execute on function public.excluir_meus_dados() from public, anon;
grant  execute on function public.excluir_meus_dados() to authenticated;
