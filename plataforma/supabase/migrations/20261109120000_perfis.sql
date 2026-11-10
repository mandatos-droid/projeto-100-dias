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
