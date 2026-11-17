-- Quem cria o mandato escolhe o próprio papel no cadastro: parlamentar, chefe de gabinete ou coordenação
-- (os três que gerem a equipe; assim o mandato nunca nasce sem alguém que possa administrá-lo).
-- Repete membros_criar de 20261109120000_perfis.sql e só troca a regra do papel.
drop policy if exists membros_criar on public.membros;
create policy membros_criar on public.membros
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and papel in ('parlamentar', 'chefe_gabinete', 'coordenacao')
    and exists (select 1 from public.mandatos m
                where m.id = mandato_id and m.criado_por = (select auth.uid()))
    and private.mandato_sem_membros(mandato_id)
    and private.tem_perfil()
  );
