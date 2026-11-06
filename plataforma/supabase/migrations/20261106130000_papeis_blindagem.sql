-- =====================================================================
-- ACESSO, EQUIPE E CONVITES · blindagem dos papéis
--
-- mandatos.criado_por deixa de valer como credencial (correções do Verifier, sondas S-1 a S-3):
--   1. criado_por não muda pela API (gatilho no molde de mandatos_trava_arquivo).
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
