-- Criar mandato é uma operação só: o mandato e a primeira linha de membros nascem na mesma transação.
-- Antes o Guia fazia dois POSTs (mandatos, depois membros); se o segundo falhava, sobrava um mandato sem
-- ninguém, que o cliente não consegue apagar (mandatos não tem grant de delete).
create or replace function public.mandato_criar(p_dados jsonb, p_papel text, p_nome text default null)
returns public.mandatos language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_m   public.mandatos;
begin
  if v_uid is null then
    raise exception 'Entre na sua conta para criar o mandato.' using errcode = '42501';
  end if;
  if p_papel is null or p_papel not in ('parlamentar', 'chefe_gabinete', 'coordenacao', 'assessoria') then
    raise exception 'Papel inválido para quem cria o mandato.' using errcode = '23514';
  end if;
  if not private.tem_perfil() then
    raise exception 'Complete seu perfil antes de criar o mandato.' using errcode = '42501';
  end if;
  if not private.eh_legisla_admin() and private.ja_em_outro_mandato(v_uid, null) then
    raise exception 'Este e-mail já está vinculado a um mandato. Cada e-mail só pode integrar um mandato.'
      using errcode = '23514';
  end if;

  v_m := jsonb_populate_record(null::public.mandatos, coalesce(p_dados, '{}'::jsonb));
  v_m.id := gen_random_uuid();
  v_m.criado_por := v_uid;
  v_m.criado_em := now();
  v_m.atualizado_em := now();
  v_m.arquivado_em := null;
  v_m.dados := coalesce(v_m.dados, '{}'::jsonb);
  v_m.permite_pesquisa := coalesce(v_m.permite_pesquisa, false);
  insert into public.mandatos select v_m.*;

  insert into public.membros (mandato_id, user_id, papel, nome)
  values (v_m.id, v_uid, p_papel, p_nome);
  return v_m;
end;
$$;

revoke execute on function public.mandato_criar(jsonb, text, text) from public, anon;
grant  execute on function public.mandato_criar(jsonb, text, text) to authenticated;
