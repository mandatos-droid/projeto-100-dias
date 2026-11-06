-- =====================================================================
-- PAINEL ADMIN · migration 2: leitura de mandatos e analytics
--
-- Views v_admin_* só com números e metadados (nunca dados, eventos.texto,
-- nome_civil nem resp_telefone), todas security_invoker e filtradas por
-- private.eh_legisla(). Catálogo exercicios_guia com os 16 exercícios do Guia.
--
-- Escrita idempotente (pode ser reaplicada sem erro).
-- =====================================================================

alter table public.mandatos add column if not exists arquivado_em timestamptz;

-- ---------- CATÁLOGO DE EXERCÍCIOS ----------
-- Espelha MISSOES de public/painel.html (ids de public/legacy/conteudo.js). Exercício novo no
-- Guia exige nova migration aqui; tests/admin-catalogo.test.ts confere os ids.

create table if not exists public.exercicios_guia (
  id      text primary key,
  missao  int  not null check (missao between 1 and 5),
  ordem   int  not null,
  titulo  text not null,
  unique (missao, ordem)
);

insert into public.exercicios_guia (id, missao, ordem, titulo) values
  ('m1.persona', 1, 1, 'A persona'),
  ('m1.conjuntura', 1, 2, 'A conjuntura'),
  ('m1.oportunidades', 1, 3, 'As oportunidades e ameaças'),
  ('m1.frag', 1, 4, 'As fragilidades'),
  ('m2.funcoes', 2, 1, 'A escalação do time'),
  ('m2.gestao', 2, 2, 'Organograma e rotinas'),
  ('m3.bandeiras', 3, 1, 'As bandeiras do mandato'),
  ('m3.legado', 3, 2, 'O Legado do mandato'),
  ('m3.preditores', 3, 3, 'Os preditores de sucesso'),
  ('m3.metas', 3, 4, 'As metas dos primeiros 100 dias'),
  ('m4.comissoes', 4, 1, 'A escolha das Comissões Permanentes'),
  ('m4.acoes', 4, 2, 'As ações dos 100 dias'),
  ('m4.metricas', 4, 3, 'O acompanhamento da comunicação'),
  ('m5.monit', 5, 1, 'O monitoramento do avanço das metas'),
  ('m5.feedback', 5, 2, 'O primeiro ciclo de feedback estruturado'),
  ('m5.imersao', 5, 3, 'Calibragem e replanejamento')
on conflict (id) do update set missao = excluded.missao, ordem = excluded.ordem, titulo = excluded.titulo;

alter table public.exercicios_guia enable row level security;
drop policy if exists exercicios_guia_ler on public.exercicios_guia;
create policy exercicios_guia_ler on public.exercicios_guia
  for select to authenticated
  using (private.eh_legisla());

revoke all on public.exercicios_guia from anon, authenticated;
grant select on public.exercicios_guia to authenticated;

-- ---------- AUXILIAR: JSON PREENCHIDO ----------
-- Verdadeiro para objeto ou lista não vazios e para texto não vazio. Usada para provar, pelos
-- campos de mandatos.dados, que uma funcionalidade do Guia foi usada. Sem dado, sem acesso a tabelas.

create or replace function private.cheio(j jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select case jsonb_typeof(j)
    when 'object' then j <> '{}'::jsonb
    when 'array'  then j <> '[]'::jsonb
    when 'string' then btrim(j #>> '{}') <> ''
    else false
  end
$$;
revoke execute on function private.cheio(jsonb) from public, anon;
grant  execute on function private.cheio(jsonb) to authenticated;

-- ---------- VIEWS (security_invoker: herdam o RLS; where eh_legisla() fecha para quem não é da equipe) ----------

-- uma linha por mandato; ultima_atividade = maior entre atualizado_em e o último evento
create or replace view public.v_admin_mandatos with (security_invoker = true) as
select
  m.id, m.codigo, m.nome_parlamentar, m.cargo, m.casa, m.uf, m.partido, m.data_posse,
  m.resp_nome, m.resp_cargo, m.criado_em, m.arquivado_em,
  (select count(*) from public.membros b where b.mandato_id = m.id)::int as membros,
  greatest(m.atualizado_em, (select max(e.criado_em) from public.eventos e where e.mandato_id = m.id)) as ultima_atividade,
  (select count(*) from public.exercicios_guia x where m.dados->'feitos'->>x.id = 'true')::int as exercicios_concluidos
from public.mandatos m
where private.eh_legisla();

-- mandato x exercício, só o booleano; mandatos arquivados ficam de fora
create or replace view public.v_admin_exercicios with (security_invoker = true) as
select m.id as mandato_id, m.uf, x.id as exercicio, x.missao, x.ordem,
       coalesce(m.dados->'feitos'->>x.id, '') = 'true' as ok
from public.mandatos m
cross join public.exercicios_guia x
where private.eh_legisla() and m.arquivado_em is null;

-- eventos por mandato e mês (fuso de Brasília)
create or replace view public.v_admin_eventos_mes with (security_invoker = true) as
select e.mandato_id,
       date_trunc('month', e.criado_em at time zone 'America/Sao_Paulo')::date as mes,
       count(*)::int as qtd
from public.eventos e
where private.eh_legisla()
group by e.mandato_id, date_trunc('month', e.criado_em at time zone 'America/Sao_Paulo');

-- diário de atividade sem o texto
create or replace view public.v_admin_atividade with (security_invoker = true) as
select e.criado_em, e.missao, e.exercicio, m.codigo
from public.eventos e
join public.mandatos m on m.id = e.mandato_id
where private.eh_legisla();

-- funcionalidades usadas, provadas pelos campos preenchidos de dados (mandatos não arquivados)
-- Mapa conferido contra ilhas/*.tsx e lib/types.ts:
--   persona    = D.tse, D.relacoes ou D.pleitos preenchidos (Persona.tsx grava tse; ponte.tsx, relacoes e pleitos)
--   conjuntura = D.conj2 com algo além do vazio inicial (Conjuntura.tsx cria conj2 vazio ao abrir)
--   municipio  = D.munSel escolhido (Municipio.tsx grava ao clicar no mapa)
--   eleitorado = D.eleitorado.itens não vazio (Eleitorado.tsx cria a lista vazia ao abrir)
--   social     = D.social.itens não vazio (Social.tsx cria a lista vazia ao abrir)
--   cadeiras   = campos 'm2.on' ou alguma 'm2.f{n}' com texto (lib/cadeiras.ts e lib/equipe.ts)
create or replace view public.v_admin_uso_campos with (security_invoker = true) as
select
  m.id as mandato_id, m.uf,
  (private.cheio(m.dados->'tse') or private.cheio(m.dados->'relacoes') or private.cheio(m.dados->'pleitos')) as persona,
  (private.cheio(m.dados->'conj2'->'muns') or private.cheio(m.dados->'conj2'->'posicao')
    or private.cheio(m.dados->'conj2'->'prefExtra') or private.cheio(m.dados->'conj2'->'relacao')
    or private.cheio(m.dados->'conj2'->'relacaoPq') or private.cheio(m.dados->'conj2'->'desafios')
    or private.cheio(m.dados->'conj2'->'oportunidades')) as conjuntura,
  private.cheio(m.dados->'munSel') as municipio,
  private.cheio(m.dados->'eleitorado'->'itens') as eleitorado,
  private.cheio(m.dados->'social'->'itens') as social,
  (case when jsonb_typeof(m.dados->'campos') = 'object' then exists (
     select 1 from jsonb_each_text(m.dados->'campos') c(k, v)
     where (c.k = 'm2.on' or c.k ~ '^m2\.f[0-9]+$') and btrim(c.v) <> ''
   ) else false end) as cadeiras
from public.mandatos m
where private.eh_legisla() and m.arquivado_em is null;

revoke all on public.v_admin_mandatos, public.v_admin_exercicios, public.v_admin_eventos_mes,
              public.v_admin_atividade, public.v_admin_uso_campos from anon, authenticated;
grant select on public.v_admin_mandatos, public.v_admin_exercicios, public.v_admin_eventos_mes,
                public.v_admin_atividade, public.v_admin_uso_campos to authenticated;
