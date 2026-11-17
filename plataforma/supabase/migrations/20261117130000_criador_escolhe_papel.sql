-- Quem cria o mandato escolhe o próprio papel no cadastro: parlamentar, chefe de gabinete ou coordenação
-- (os três que gerem a equipe; assim o mandato nunca nasce sem alguém que possa administrá-lo).
-- Repete membros_criar de 20261109120000_perfis.sql e só troca a regra do papel.
drop policy if exists membros_criar on public.membros;
create policy membros_criar on public.membros
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and papel in ('parlamentar', 'chefe_gabinete', 'coordenacao', 'assessoria')
    and exists (select 1 from public.mandatos m
                where m.id = mandato_id and m.criado_por = (select auth.uid()))
    and private.mandato_sem_membros(mandato_id)
    and private.tem_perfil()
  );

-- Papel vago: quem edita (assessoria para cima) pode convidar para Parlamentar ou Chefe de Gabinete
-- enquanto ninguém do mandato tem esse papel. Assim quem monta o mandato, em qualquer papel, traz o parlamentar.
-- Quando alguém assume o papel, os outros convites para ele deixam de valer (convite_autorizado é dinâmica).
create or replace function private.convite_autorizado(p_mandato uuid, p_criado_por uuid, p_papel text, p_papel_ao_sair text)
returns boolean language sql security definer set search_path = '' stable as $$
  select p_criado_por is not null and (
    case
      when exists (select 1 from public.membros b where b.mandato_id = p_mandato and b.user_id = p_criado_por)
        then exists (select 1 from public.membros b
                     where b.mandato_id = p_mandato and b.user_id = p_criado_por
                       and private.nivel_papel(b.papel) >= private.nivel_papel(p_papel))
      else private.nivel_papel(p_papel_ao_sair) >= private.nivel_papel(p_papel)
    end
    or (p_papel in ('parlamentar', 'chefe_gabinete')
        and not exists (select 1 from public.membros b where b.mandato_id = p_mandato and b.papel = p_papel)
        and (exists (select 1 from public.membros b
                     where b.mandato_id = p_mandato and b.user_id = p_criado_por and private.nivel_papel(b.papel) >= 2)
             or (not exists (select 1 from public.membros b where b.mandato_id = p_mandato and b.user_id = p_criado_por)
                 and private.nivel_papel(p_papel_ao_sair) >= 2))))
$$;

revoke execute on function private.convite_autorizado(uuid, uuid, text, text) from public, anon, authenticated;

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
  if private.nivel_papel(p_papel) > private.nivel_papel(v_meu)
     and not (private.nivel_papel(v_meu) >= 2 and p_papel in ('parlamentar', 'chefe_gabinete')
              and not exists (select 1 from public.membros b where b.mandato_id = p_mandato and b.papel = p_papel)) then
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
