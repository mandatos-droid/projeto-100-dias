-- =====================================================================
-- PAINEL ADMIN · aba Usuários (só leitura)
--
-- 1. private.sem_acento: minúsculas e sem acento, com translate (o PGlite dos testes não tem
--    a extensão unaccent). Cobre as vogais acentuadas e o ç.
-- 2. public.admin_usuarios: lista paginada de toda conta de auth.users, com busca e filtros no
--    servidor. Devolve {total, linhas:[{id, nome, email, criado_em, ultimo_acesso, sem_perfil,
--    equipe_papel, mandatos:[{id, nome, papel, arquivado}]}]}. Nunca devolve gênero, raça,
--    nascimento nem telefone.
-- 3. public.admin_usuario_detalhe: uma pessoa, com perfil completo, consentimento mais recente e
--    mandatos. Só aqui aparecem os dados sensíveis do perfil.
--
-- Padrão do painel: security definer, search_path vazio, checagem de equipe_legisla a cada
-- chamada (erro 42501), sem execute para anon. Funções stable: não gravam nada.
-- Escrita idempotente (pode ser reaplicada sem erro).
-- =====================================================================

-- ---------- texto sem acento ----------
-- Troca as acentuadas (maiúsculas e minúsculas) antes do lower: o lower do Postgres só cobre
-- ASCII em alguns locales.
create or replace function private.sem_acento(p_texto text)
returns text language sql immutable set search_path = '' as $$
  select lower(translate(p_texto,
    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucaaaaaeeeeiiiiooooouuuuc'))
$$;
-- só as funções security definer abaixo usam: ninguém da API executa
revoke execute on function private.sem_acento(text) from public, anon, authenticated;

-- ---------- lista de usuários ----------
-- p_papel: coordenacao, assessoria ou leitura (papel em algum mandato; com p_mandato, nesse
-- mandato) ou legisla (está em equipe_legisla). Outro valor não filtra.
-- Limite fora de 1 a 100 vira 25. Busca cortada em 100 caracteres, por nome ou e-mail.
-- Ordem: último login mais recente primeiro, quem nunca entrou por último, desempate pelo e-mail.
create or replace function public.admin_usuarios(
  p_busca text default null, p_papel text default null, p_mandato uuid default null,
  p_sem_perfil boolean default false, p_limite int default 25, p_offset int default 0)
returns jsonb language plpgsql security definer set search_path = '' stable as $$
declare
  v_busca   text := nullif(private.sem_acento(left(btrim(coalesce(p_busca, '')), 100)), '');
  v_papel   text := case when p_papel in ('coordenacao', 'assessoria', 'leitura') then p_papel end;
  v_legisla boolean := coalesce(p_papel = 'legisla', false);
  v_limite  int := case when p_limite between 1 and 100 then p_limite else 25 end;
  v_offset  int := greatest(coalesce(p_offset, 0), 0);
  v_r       jsonb;
begin
  if not private.eh_legisla() then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;

  with pessoas as (
    select u.id, u.email::text as email, u.created_at, u.last_sign_in_at,
           -- nome do perfil; sem perfil, o do cadastro da conta; sem nenhum, o e-mail
           coalesce(nullif(p.nome, ''), nullif(u.raw_user_meta_data->>'nome', ''),
                    nullif(u.raw_user_meta_data->>'full_name', ''), nullif(u.raw_user_meta_data->>'name', ''),
                    u.email)::text as nome,
           e.papel as equipe_papel,
           (p.user_id is null and e.user_id is null) as sem_perfil
    from auth.users u
    left join public.perfis p on p.user_id = u.id
    left join public.equipe_legisla e on e.user_id = u.id
  ),
  filtradas as (
    select x.* from pessoas x
    where (v_busca is null
           or strpos(private.sem_acento(coalesce(x.nome, '')), v_busca) > 0
           or strpos(private.sem_acento(coalesce(x.email, '')), v_busca) > 0)
      and (not coalesce(p_sem_perfil, false) or x.sem_perfil)
      and (not v_legisla or x.equipe_papel is not null)
      and ((p_mandato is null and v_papel is null) or exists (
            select 1 from public.membros b
            where b.user_id = x.id
              and (p_mandato is null or b.mandato_id = p_mandato)
              and (v_papel is null or b.papel = v_papel)))
  ),
  pagina as (
    select f.* from filtradas f
    order by f.last_sign_in_at desc nulls last, f.email asc nulls last, f.id asc
    limit v_limite offset v_offset
  )
  select jsonb_build_object(
    'total', (select count(*) from filtradas),
    'linhas', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', g.id, 'nome', g.nome, 'email', g.email,
               'criado_em', g.created_at, 'ultimo_acesso', g.last_sign_in_at,
               'sem_perfil', g.sem_perfil, 'equipe_papel', g.equipe_papel,
               'mandatos', coalesce((
                 select jsonb_agg(jsonb_build_object('id', m.id, 'nome', m.nome_parlamentar, 'papel', b.papel,
                                                     'arquivado', m.arquivado_em is not null)
                                  order by m.nome_parlamentar, m.id)
                 from public.membros b join public.mandatos m on m.id = b.mandato_id
                 where b.user_id = g.id), '[]'::jsonb))
             order by g.last_sign_in_at desc nulls last, g.email asc nulls last, g.id asc)
      from pagina g), '[]'::jsonb)
  ) into v_r;
  return v_r;
end;
$$;

revoke execute on function public.admin_usuarios(text, text, uuid, boolean, int, int) from public, anon;
grant  execute on function public.admin_usuarios(text, text, uuid, boolean, int, int) to authenticated;

-- ---------- detalhe da pessoa ----------
-- {id, nome, email, criado_em, ultimo_acesso, equipe_papel,
--  perfil: {nome, nascimento, genero, raca, telefone, atua, tempo} | null (valores internos),
--  consentimento: {versao, aceito_em} | null (o mais recente),
--  mandatos: [{id, nome, cargo, uf, papel, arquivado}]}
-- Id inexistente devolve null (dado, não exceção).
create or replace function public.admin_usuario_detalhe(p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' stable as $$
declare
  v_r jsonb;
begin
  if not private.eh_legisla() then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'id', u.id,
    'nome', coalesce(nullif(p.nome, ''), nullif(u.raw_user_meta_data->>'nome', ''),
                     nullif(u.raw_user_meta_data->>'full_name', ''), nullif(u.raw_user_meta_data->>'name', ''),
                     u.email)::text,
    'email', u.email::text,
    'criado_em', u.created_at,
    'ultimo_acesso', u.last_sign_in_at,
    'equipe_papel', e.papel,
    'perfil', case when p.user_id is null then null else jsonb_build_object(
      'nome', p.nome, 'nascimento', p.nascimento, 'genero', p.genero, 'raca', p.raca,
      'telefone', p.telefone, 'atua', p.atua, 'tempo', p.tempo) end,
    'consentimento', (
      select jsonb_build_object('versao', k.versao, 'aceito_em', k.aceito_em)
      from public.consentimentos k where k.user_id = u.id
      order by k.aceito_em desc, k.id desc limit 1),
    'mandatos', coalesce((
      select jsonb_agg(jsonb_build_object('id', m.id, 'nome', m.nome_parlamentar, 'cargo', m.cargo, 'uf', m.uf,
                                          'papel', b.papel, 'arquivado', m.arquivado_em is not null)
                       order by m.nome_parlamentar, m.id)
      from public.membros b join public.mandatos m on m.id = b.mandato_id
      where b.user_id = u.id), '[]'::jsonb)
  ) into v_r
  from auth.users u
  left join public.perfis p on p.user_id = u.id
  left join public.equipe_legisla e on e.user_id = u.id
  where u.id = p_user;
  return v_r;
end;
$$;

revoke execute on function public.admin_usuario_detalhe(uuid) from public, anon;
grant  execute on function public.admin_usuario_detalhe(uuid) to authenticated;
