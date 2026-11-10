-- =====================================================================
-- PRIMEIRO ACESSO · resumo do perfil para o Analytics do /admin (PAG-06)
--
-- public.admin_perfil_resumo() devolve só contagens, nunca linha individual:
--   {total, por_mes:[{mes:'YYYY-MM', qtd}], genero:{chave:qtd}, raca:{chave:qtd},
--    faixa:{rotulo:qtd}, atuacao:{chave:qtd}}
-- Gênero, raça e atuação vêm pelas chaves internas (os rótulos ficam no app); a faixa etária vem
-- com o rótulo da spec. Categoria sem ninguém não aparece. Sem UF: a spec decidiu o perfil sem UF.
-- Exige equipe Legisla (admin ou leitura). Datas no fuso America/Sao_Paulo.
-- Escrita idempotente (pode ser reaplicada sem erro).
-- =====================================================================

create or replace function public.admin_perfil_resumo()
returns jsonb language plpgsql security definer set search_path = '' stable as $$
declare
  v_hoje  date := (now() at time zone 'America/Sao_Paulo')::date;
  v_atual date := date_trunc('month', now() at time zone 'America/Sao_Paulo')::date;
  v_r     jsonb;
begin
  if not private.eh_legisla() then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;

  with p as (
    select x.genero, x.raca,
           case when x.atua then x.tempo else 'nao_atua' end as atuacao,
           case
             when date_part('year', age(v_hoje, x.nascimento)) <= 24 then 'Até 24'
             when date_part('year', age(v_hoje, x.nascimento)) <= 34 then '25 a 34'
             when date_part('year', age(v_hoje, x.nascimento)) <= 44 then '35 a 44'
             when date_part('year', age(v_hoje, x.nascimento)) <= 54 then '45 a 54'
             when date_part('year', age(v_hoje, x.nascimento)) <= 64 then '55 a 64'
             else '65 ou mais'
           end as faixa,
           date_trunc('month', x.criado_em at time zone 'America/Sao_Paulo')::date as mes
    from public.perfis x
  ),
  -- do mês do primeiro perfil ao atual, no máximo 12 meses; nenhum mês se não há perfil
  meses as (
    select g.m::date as m
    from generate_series(
           greatest((select min(p.mes) from p), (v_atual - interval '11 months')::date),
           v_atual, interval '1 month') as g(m)
    where exists (select 1 from p)
  )
  select jsonb_build_object(
    'total',   (select count(*) from p),
    'por_mes', coalesce((select jsonb_agg(jsonb_build_object('mes', to_char(meses.m, 'YYYY-MM'),
                                                             'qtd', (select count(*) from p where p.mes = meses.m))
                                          order by meses.m) from meses), '[]'::jsonb),
    'genero',  coalesce((select jsonb_object_agg(c.k, c.n) from (select p.genero k, count(*) n from p group by 1) c), '{}'::jsonb),
    'raca',    coalesce((select jsonb_object_agg(c.k, c.n) from (select p.raca k, count(*) n from p group by 1) c), '{}'::jsonb),
    'faixa',   coalesce((select jsonb_object_agg(c.k, c.n) from (select p.faixa k, count(*) n from p group by 1) c), '{}'::jsonb),
    'atuacao', coalesce((select jsonb_object_agg(c.k, c.n) from (select p.atuacao k, count(*) n from p group by 1) c), '{}'::jsonb)
  ) into v_r;
  return v_r;
end;
$$;

revoke execute on function public.admin_perfil_resumo() from public, anon;
grant  execute on function public.admin_perfil_resumo() to authenticated;
