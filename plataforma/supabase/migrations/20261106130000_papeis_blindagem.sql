-- =====================================================================
-- ACESSO, EQUIPE E CONVITES · blindagem dos papéis
--
-- mandatos.criado_por deixa de valer como credencial (correções do Verifier, sondas S-1 a S-3):
--   1. criado_por não muda pela API (gatilho no molde de mandatos_trava_arquivo);
--   2. quem criou o mandato entra direto em membros só como a primeira pessoa, na coordenação;
--      depois disso, só por convite. Ler o mandato por criado_por vale só nesse intervalo.
--
-- Escrita idempotente (pode ser reaplicada sem erro).
-- =====================================================================

-- ---------- 1. criado_por imutável pela API ----------
-- mandatos_editar deixa coordenação e assessoria gravarem qualquer coluna. Sem uid na sessão
-- (postgres, service_role, migrations) não há API envolvida e a mudança passa.
create or replace function public.mandatos_trava_criador()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.criado_por is distinct from old.criado_por and (select auth.uid()) is not null then
    raise exception 'Você não tem permissão para esta ação.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists mandatos_trava_criador on public.mandatos;
create trigger mandatos_trava_criador before update on public.mandatos
  for each row execute function public.mandatos_trava_criador();

revoke execute on function public.mandatos_trava_criador() from public, anon, authenticated;

-- ---------- 2. Entrada direta só na primeira linha do mandato ----------
-- Verdadeiro enquanto o mandato não tem ninguém em membros. security definer: quem chama
-- não enxerga as linhas de membros de um mandato do qual não faz parte.
create or replace function private.mandato_sem_membros(p_mandato uuid)
returns boolean language sql security definer set search_path = '' stable as $$
  select not exists (select 1 from public.membros b where b.mandato_id = p_mandato)
$$;

revoke execute on function private.mandato_sem_membros(uuid) from public, anon;
grant  execute on function private.mandato_sem_membros(uuid) to authenticated;

-- O cadastro do Guia (nucleo.js, criarMandato) grava o mandato e logo a própria pessoa como
-- coordenacao. Quem sai ou é removido não volta por aqui: só por convite.
drop policy if exists membros_criar on public.membros;
create policy membros_criar on public.membros
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and papel = 'coordenacao'
    and exists (select 1 from public.mandatos m
                where m.id = mandato_id and m.criado_por = (select auth.uid()))
    and private.mandato_sem_membros(mandato_id)
  );

-- Quem criou lê o mandato só enquanto ele não tem membros (o INSERT ... RETURNING do cadastro e
-- a inclusão logo depois). Removido ou fora do mandato, deixa de ver.
drop policy if exists mandatos_ler on public.mandatos;
create policy mandatos_ler on public.mandatos
  for select to authenticated
  using (private.eh_membro(id)
         or (criado_por = (select auth.uid()) and private.mandato_sem_membros(id))
         or private.eh_legisla());
