-- =====================================================================
-- EXCLUIR CADASTRO (mandato)
-- Só quem criou o mandato ou a coordenação apaga. Os membros e os eventos
-- saem em cascata; sugestões enviadas ficam, com mandato_id nulo.
-- =====================================================================

create or replace function public.excluir_mandato(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'Não autenticado.'; end if;
  if not exists (
    select 1 from public.mandatos m
    where m.id = p_id
      and (m.criado_por = (select auth.uid())
           or exists (select 1 from public.membros b
                      where b.mandato_id = m.id and b.user_id = (select auth.uid())
                        and b.papel = 'coordenacao'))
  ) then
    raise exception 'Só a coordenação do mandato pode excluir o cadastro.';
  end if;
  delete from public.mandatos where id = p_id;
end;
$$;
revoke execute on function public.excluir_mandato(uuid) from public, anon;
grant  execute on function public.excluir_mandato(uuid) to authenticated;
