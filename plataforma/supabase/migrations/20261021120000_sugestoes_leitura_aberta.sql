-- =====================================================================
-- SUGESTÕES: leitura aberta a qualquer pessoa logada
-- Decisão do produto: todos os usuários veem as sugestões (inclui nome, e-mail,
-- mandato de origem e print). Marcar como resolvida e apagar seguem só com a equipe.
-- =====================================================================
drop policy if exists sugestoes_ler on public.sugestoes;
create policy sugestoes_ler on public.sugestoes
  for select to authenticated
  using (true);
