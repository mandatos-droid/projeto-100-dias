-- =====================================================================
-- PAINEL ADMIN · aba Usuários: escrita (editar perfil, trocar e-mail, excluir conta)
--
-- 1. public.admin_usuario_perfil_salvar: o admin corrige o perfil de outra pessoa. Mesmas regras de
--    perfil_salvar. Só edita perfil que já existe: criar perfil é ato da própria pessoa, porque grava o
--    consentimento. Erro de campo volta como dado {ok:false, erro:<campo>}.
-- 2. public.admin_usuario_email: troca o e-mail da conta em auth.users.
-- 3. public.admin_usuario_excluir: exclusão total da conta, confirmada pelo e-mail digitado.
--
-- Mandatos e papel na Equipe Legisla seguem pelas funções que já existem (admin_membro_*, admin_equipe_*).
--
-- Padrão do painel: security definer, search_path vazio, só admin (private.eh_legisla_admin, erro 42501),
-- auditoria na mesma transação, sem execute para anon. Escrita idempotente.
-- A auditoria nunca guarda gênero, raça, nascimento nem telefone: só o nome dos campos que mudaram.
-- =====================================================================

-- ---------- criado_por: aceita o set null de quem deixou de existir ----------
-- Repete mandatos_trava_criador (20261106130000_papeis_blindagem.sql). Excluir uma conta dispara o
-- on delete set null de mandatos.criado_por com uid na sessão (o do admin), e o gatilho barrava. Agora
-- passa só quando o criador antigo já não existe em auth.users; qualquer outra troca pela API segue barrada.
-- security definer: a leitura de auth.users não é do papel de quem chama; o uid vem da sessão e não muda.
create or replace function public.mandatos_trava_criador()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.criado_por is distinct from old.criado_por and (select auth.uid()) is not null
     and not (new.criado_por is null and old.criado_por is not null
              and not exists (select 1 from auth.users u where u.id = old.criado_por)) then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function public.mandatos_trava_criador() from public, anon, authenticated;

-- ---------- editar perfil de outra pessoa ----------
create or replace function public.admin_usuario_perfil_salvar(
  p_user uuid, p_nome text, p_nascimento text, p_genero text, p_raca text, p_telefone text, p_atua boolean, p_tempo text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_nome  text := btrim(coalesce(p_nome, ''));
  v_nasc  date;
  v_atual public.perfis%rowtype;
  v_campos text[] := '{}';
begin
  if not private.eh_legisla_admin() then
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

  select * into v_atual from public.perfis where user_id = p_user for update;
  if not found then
    return jsonb_build_object('ok', false, 'erro', 'sem_perfil');
  end if;

  if v_atual.nome is distinct from v_nome then v_campos := array_append(v_campos, 'nome'); end if;
  if v_atual.nascimento is distinct from v_nasc then v_campos := array_append(v_campos, 'nascimento'); end if;
  if v_atual.genero is distinct from p_genero then v_campos := array_append(v_campos, 'genero'); end if;
  if v_atual.raca is distinct from p_raca then v_campos := array_append(v_campos, 'raca'); end if;
  if v_atual.telefone is distinct from p_telefone then v_campos := array_append(v_campos, 'telefone'); end if;
  if v_atual.atua is distinct from p_atua then v_campos := array_append(v_campos, 'atua'); end if;
  if v_atual.tempo is distinct from p_tempo then v_campos := array_append(v_campos, 'tempo'); end if;

  -- nada mudou: não grava nem audita (duplo envio)
  if cardinality(v_campos) = 0 then
    return jsonb_build_object('ok', true);
  end if;

  perform private.audita('usuario.perfil', 'usuario', p_user::text, jsonb_build_object('campos', to_jsonb(v_campos)));
  update public.perfis
     set nome = v_nome, nascimento = v_nasc, genero = p_genero, raca = p_raca,
         telefone = p_telefone, atua = p_atua, tempo = p_tempo
   where user_id = p_user;
  return jsonb_build_object('ok', true);
end;
$$;

-- ---------- trocar o e-mail da conta ----------
-- Sem caixa e sem espaços nas pontas, como admin_buscar_usuario compara. Recusa e-mail já usado por
-- outra conta. Não mexe em identidades de login (Google): só o e-mail da conta.
create or replace function public.admin_usuario_email(p_user uuid, p_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_novo  text := lower(btrim(coalesce(p_email, '')));
  v_antigo text;
begin
  if not private.eh_legisla_admin() then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  if v_novo !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or char_length(v_novo) > 254 then
    raise exception 'Digite um e-mail válido.';
  end if;
  select u.email into v_antigo from auth.users u where u.id = p_user for update;
  if not found then raise exception 'Pessoa não encontrada.'; end if;
  if lower(btrim(coalesce(v_antigo, ''))) = v_novo then return; end if;
  if exists (select 1 from auth.users u where lower(btrim(u.email)) = v_novo and u.id <> p_user) then
    raise exception 'Já existe uma conta com este e-mail.';
  end if;

  perform private.audita('usuario.email', 'usuario', p_user::text,
    jsonb_build_object('de', v_antigo, 'para', v_novo));
  update auth.users set email = v_novo, updated_at = now() where id = p_user;
end;
$$;

-- ---------- excluir a conta ----------
-- Confirmação: o e-mail digitado precisa ser o da conta. Travas: não exclui a si mesmo, o último admin
-- da equipe nem quem é a única coordenação de algum mandato. Em cascata saem perfil, consentimento,
-- membros, sugestões e comentários da pessoa e a linha da equipe; eventos ficam como "usuário removido".
create or replace function public.admin_usuario_excluir(p_user uuid, p_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := (select auth.uid());
  v_email text;
  v_nome  text;
  v_papel text;
  v_unico text;
begin
  if not private.eh_legisla_admin() then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  if p_user is not distinct from v_uid then
    raise exception 'Você não pode excluir a própria conta por aqui.';
  end if;
  -- trava os admins para que duas exclusões simultâneas não esvaziem a equipe
  perform 1 from public.equipe_legisla e where e.papel = 'admin' for update;
  select u.email,
         coalesce(nullif(p.nome, ''), nullif(u.raw_user_meta_data->>'nome', ''),
                  nullif(u.raw_user_meta_data->>'full_name', ''), nullif(u.raw_user_meta_data->>'name', ''), u.email)
    into v_email, v_nome
  from auth.users u left join public.perfis p on p.user_id = u.id
  where u.id = p_user for update of u;
  if not found then raise exception 'Pessoa não encontrada.'; end if;
  if lower(btrim(coalesce(p_email, ''))) is distinct from lower(btrim(coalesce(v_email, ''))) then
    raise exception 'O e-mail digitado não confere com o da conta.';
  end if;

  select e.papel into v_papel from public.equipe_legisla e where e.user_id = p_user;
  if v_papel = 'admin'
     and not exists (select 1 from public.equipe_legisla e where e.papel = 'admin' and e.user_id <> p_user) then
    raise exception 'A equipe precisa ter ao menos um admin.';
  end if;

  select m.nome_parlamentar into v_unico
  from public.membros b join public.mandatos m on m.id = b.mandato_id
  where b.user_id = p_user and b.papel = 'coordenacao'
    and not exists (select 1 from public.membros o
                    where o.mandato_id = b.mandato_id and o.papel = 'coordenacao' and o.user_id <> p_user)
  order by m.nome_parlamentar, m.id limit 1;
  if found then
    raise exception 'Esta pessoa é a única coordenação de "%". Passe a coordenação a outra pessoa antes de excluir.', coalesce(v_unico, 'um mandato');
  end if;

  perform private.audita('usuario.excluir', 'usuario', p_user::text,
    jsonb_build_object('nome', v_nome, 'email', v_email, 'equipe_papel', v_papel));
  update public.eventos set user_id = null, autor = 'usuário removido' where user_id = p_user;
  update public.convites set papel_ao_sair = null where criado_por = p_user;
  delete from auth.users where id = p_user; -- perfis, consentimentos, membros, sugestões e equipe saem em cascata
end;
$$;

revoke execute on function
  public.admin_usuario_perfil_salvar(uuid, text, text, text, text, text, boolean, text),
  public.admin_usuario_email(uuid, text), public.admin_usuario_excluir(uuid, text)
  from public, anon;
grant execute on function
  public.admin_usuario_perfil_salvar(uuid, text, text, text, text, text, boolean, text),
  public.admin_usuario_email(uuid, text), public.admin_usuario_excluir(uuid, text)
  to authenticated;
