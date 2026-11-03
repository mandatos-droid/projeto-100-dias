# Graph Report - Projeto 100 dias  (2026-10-27)

## Corpus Check
- 561 files · ~1,005,608 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .css 7, (none) 5)

## Summary
- 2060 nodes · 4709 edges · 116 communities (102 shown, 14 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 337 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `69fe8f23`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- espacos.ts
- Regimento Externo 2.0 - Guia / PLL6 - Programacao e Metodo 
- Conjuntura.tsx / Resumos.tsx
- ponte.tsx / useLegado
- Assentos.tsx / pecas.tsx
- alternaArea
- rotinas.ts / EntreAreas.tsx
- Persona.tsx / MapaVotos.tsx
- ArvorePlano.tsx / Task Breakdown
- Legado.tsx / manchete.ts
- plano.ts / useRumo
- rumo.ts / lerRumo
- types.ts / dados.ts
- guia.js / render
- Social.tsx / SocialIlha
- cadastro.js / carregar
- PainelCadeira.tsx
- app.js / entrou
- MISSOES (five missions data  / Guia dos 100 Dias - platafor
- Bandeiras.tsx / criterios.ts
- Task Breakdown / layoutOrg
- Feedback.tsx
- capital-comunicacao.spec.ts
- Missão 5 · Garanta o avanço  / Missão 5 Avanço Design
- app/page.tsx / Landing
- capital.ts
- Demo.tsx
- Organograma.tsx / Organograma
- nucleo.js / uid
- Missao 3 Defina o Rumo (Plan / Components
- Equipe.tsx / equipe.ts
- @playwright/test / semente.ts
- rumo-migracao.spec.ts / guia-real.ts
- Missão 2 · Equipe, Organogra / Cobertura por AC
- MISSOES (7 missions data mod / Render views (home, mission,
- novos.js / chips
- compilerOptions / tsconfig.json
- Missão 3 · Defina o Rumo (Pl / User Stories
- json / build_comissoes.py
- Painel (montagem do painel a / Fonte (carregamento de dados
- semente-rumo.ts / rumo-harness.spec.ts
- smart.ts
- Missão 2 · Equipe, Organograma e Rotinas Tasks
- build_data.py / cargo_uf
- comunicacao.ts
- Task Breakdown / Eleito
- legado-m3.test.ts
- Landing Validation / Spec-Anchored Acceptance Cri
- build_eleitos.py / csv
- rumo-legado.spec.ts / completa
- useEquipe / EtapaCadeiras.tsx
- Missao 2 Equipe, Organograma / Landing Page do Guia
- Landing Page Tasks / Execution Plan
- Execution Plan / Missão 3 · Defina o Rumo (Pl
- dadoDe
- ativas
- Landing Page do Guia dos 100 / User Stories
- Missão 2 · Equipe, Organograma e Rotinas Specification
- rumo-metas.spec.ts
- Comissoes.tsx
- build_executivo.py / main
- build_pleitos.py / pleitos_do_ano
- route.ts
- rumo-plano.spec.ts / metasDe
- capital-comissoes.spec.ts
- Recomenda.tsx
- build_social.py / collections
- ref_node_fs
- resumo.js / arq
- Missão 4 · Capital Político  / 4. Parte C — Comunicação
- Missão 4 · Capital Político  / Parte A — Comissões permanen
- Candidates (under observatio / LESSONS - auto-maintained by
- Task Breakdown
- rumo-bandeiras.spec.ts / abre
- temConteudo / Impacto técnico (resumo; o d
- package.json
- legado-m4.test.ts
- m3.js / bandeirasFeito
- sugestoes.js / checarEquipe
- build_filiados.py / main
- Spec-Anchored Acceptance Criteria
- Missão 2 · Equipe, Organograma e Rotinas Validation
- Funcionalidades / Funcionalidades.tsx
- rumo-preditores.spec.ts / itens
- legado-m2.test.ts
- legado-m5.test.ts
- User Stories
- Decisions / Project State
- Missão 3 · Defina o Rumo Validation
- capital-acoes.spec.ts
- Guia rapido: API de resultad / API nao oficial resultados.t
- Rodada 1 (histórico)
- estadoEx / progMissao
- Seções do painel (progresso, / BINGOS (frentes de articulaç
- Missão 2 · Equipe, Organograma e Rotinas Design
- Task Breakdown
- next.config.mjs / next
- Legisla Brasil logo (wordmar / Burgundy split-shape emblem 
- graphify knowledge graph (gr / Graphify usage rules
- migrations.yml / supabase db push on main
- Agendas Reynolds (clima, edu / Triade do desafio PLL6 (entr
- vercel.json / regions
- Alterador do sistema
- como-montar-mapas.md (arquiv
- Legacy logo variant 2 (white
- diaDe
- uid
- Missão 3 · Defina o Rumo (Planejamento Estratégico) Specification
- Missão 5 · Garanta o avanço Validation
- RedirecionaAuth
- Components
- Architecture Overview

## God Nodes (most connected - your core abstractions)
1. `react` - 44 edges
2. `useLegado()` - 43 edges
3. `Task Breakdown` - 42 edges
4. `ativas()` - 39 edges
5. `chaveFicha()` - 36 edges
6. `useRumo()` - 34 edges
7. `coordDe()` - 30 edges
8. `liderDe()` - 30 edges
9. `aviso()` - 28 edges
10. `alternaArea()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `T18: Privacidade, fontes e autoria` --references--> `Confianca()`  [INFERRED]
  .specs/features/landing/tasks.md → plataforma/app/_landing/Confianca.tsx
- `T19: Perguntas frequentes` --references--> `Faq()`  [INFERRED]
  .specs/features/landing/tasks.md → plataforma/app/_landing/Faq.tsx
- `T20: Fechamento e rodapé` --references--> `Fechamento()`  [INFERRED]
  .specs/features/landing/tasks.md → plataforma/app/_landing/Fechamento.tsx
- `Lógica (`node --test`)` --references--> `Missoes`  [INFERRED]
  .specs/features/missao2-equipe/spec.md → plataforma/app/_landing/Missoes.tsx
- `T33: Desligar o seletor de bandeiras da Missão 2 ✅` --references--> `Recomenda()`  [INFERRED]
  .specs/features/missao2-equipe/tasks.md → plataforma/ilhas/Recomenda.tsx

## Import Cycles
- 3-file cycle: `plataforma/ilhas/ponte.tsx -> plataforma/ilhas/rumo/PlanoResumo.tsx -> plataforma/ilhas/rumo/useRumo.ts -> plataforma/ilhas/ponte.tsx`
- 3-file cycle: `plataforma/ilhas/ponte.tsx -> plataforma/ilhas/rumo/Metas.tsx -> plataforma/ilhas/rumo/CartaoMeta.tsx -> plataforma/ilhas/ponte.tsx`
- 3-file cycle: `plataforma/ilhas/ponte.tsx -> plataforma/ilhas/rumo/Metas.tsx -> plataforma/ilhas/rumo/useRumo.ts -> plataforma/ilhas/ponte.tsx`
- 3-file cycle: `plataforma/ilhas/ponte.tsx -> plataforma/ilhas/rumo/Espacos.tsx -> plataforma/ilhas/rumo/useRumo.ts -> plataforma/ilhas/ponte.tsx`
- 3-file cycle: `plataforma/ilhas/equipe/Rotinas.tsx -> plataforma/ilhas/equipe/useEquipe.ts -> plataforma/ilhas/ponte.tsx -> plataforma/ilhas/equipe/Rotinas.tsx`
- 3-file cycle: `plataforma/ilhas/ponte.tsx -> plataforma/ilhas/rumo/NovoCiclo.tsx -> plataforma/ilhas/rumo/useRumo.ts -> plataforma/ilhas/ponte.tsx`
- 3-file cycle: `plataforma/ilhas/equipe/Organograma.tsx -> plataforma/ilhas/equipe/useEquipe.ts -> plataforma/ilhas/ponte.tsx -> plataforma/ilhas/equipe/Organograma.tsx`
- 3-file cycle: `plataforma/ilhas/Conjuntura.tsx -> plataforma/ilhas/ponte.tsx -> plataforma/ilhas/Resumos.tsx -> plataforma/ilhas/Conjuntura.tsx`
- 3-file cycle: `plataforma/ilhas/Resumos.tsx -> plataforma/ilhas/pecas.tsx -> plataforma/ilhas/ponte.tsx -> plataforma/ilhas/Resumos.tsx`
- 3-file cycle: `plataforma/ilhas/Social.tsx -> plataforma/ilhas/pecas.tsx -> plataforma/ilhas/ponte.tsx -> plataforma/ilhas/Social.tsx`
- 3-file cycle: `plataforma/ilhas/capital/LinhaAcao.tsx -> plataforma/ilhas/ponte.tsx -> plataforma/ilhas/capital/Matriz.tsx -> plataforma/ilhas/capital/LinhaAcao.tsx`
- 3-file cycle: `plataforma/ilhas/capital/Matriz.tsx -> plataforma/ilhas/rumo/useRumo.ts -> plataforma/ilhas/ponte.tsx -> plataforma/ilhas/capital/Matriz.tsx`
- 3-file cycle: `plataforma/ilhas/equipe/Escalacao.tsx -> plataforma/ilhas/equipe/useEquipe.ts -> plataforma/ilhas/ponte.tsx -> plataforma/ilhas/equipe/Escalacao.tsx`
- 3-file cycle: `plataforma/ilhas/ponte.tsx -> plataforma/ilhas/rumo/Bandeiras.tsx -> plataforma/ilhas/rumo/useRumo.ts -> plataforma/ilhas/ponte.tsx`
- 3-file cycle: `plataforma/ilhas/ponte.tsx -> plataforma/ilhas/rumo/Legado.tsx -> plataforma/ilhas/rumo/Jornal.tsx -> plataforma/ilhas/ponte.tsx`
- 3-file cycle: `plataforma/ilhas/ponte.tsx -> plataforma/ilhas/rumo/Legado.tsx -> plataforma/ilhas/rumo/useRumo.ts -> plataforma/ilhas/ponte.tsx`
- 3-file cycle: `plataforma/ilhas/ponte.tsx -> plataforma/ilhas/rumo/Plano.tsx -> plataforma/ilhas/rumo/CartaoMeta.tsx -> plataforma/ilhas/ponte.tsx`
- 3-file cycle: `plataforma/ilhas/ponte.tsx -> plataforma/ilhas/rumo/Plano.tsx -> plataforma/ilhas/rumo/useRumo.ts -> plataforma/ilhas/ponte.tsx`
- 3-file cycle: `plataforma/ilhas/ponte.tsx -> plataforma/ilhas/rumo/Preditores.tsx -> plataforma/ilhas/rumo/useRumo.ts -> plataforma/ilhas/ponte.tsx`
- 4-file cycle: `plataforma/ilhas/ponte.tsx -> plataforma/ilhas/rumo/PlanoResumo.tsx -> plataforma/ilhas/rumo/Plano.tsx -> plataforma/ilhas/rumo/CartaoMeta.tsx -> plataforma/ilhas/ponte.tsx`

## Hyperedges (group relationships)
- **Cinco Missoes do Guia dos 100 Dias** — graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_missao_1, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_missao_2, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_missao_3, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_missao_4, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_missao_5 [EXTRACTED 1.00]
- **Five missions of the 100-day guide** — contexto_inicial_guia_dos_100_dias_plataforma_dos_mandatos_copy_missao_1, contexto_inicial_guia_dos_100_dias_plataforma_dos_mandatos_copy_missao_2, contexto_inicial_guia_dos_100_dias_plataforma_dos_mandatos_copy_missao_3, contexto_inicial_guia_dos_100_dias_plataforma_dos_mandatos_copy_missao_4, contexto_inicial_guia_dos_100_dias_plataforma_dos_mandatos_copy_missao_5 [EXTRACTED 1.00]
- **Seven missions of the first 100 days** — contexto_inicial_index_6_missao_chegada, contexto_inicial_index_6_missao_equipe, contexto_inicial_index_6_missao_planejamento, contexto_inicial_index_6_missao_comissoes, contexto_inicial_index_6_missao_capital_politico, contexto_inicial_index_6_missao_projeto_politico, contexto_inicial_index_6_missao_imersao [EXTRACTED 1.00]
- **Fontes de dados do painel** — contexto_inicial_painel_supabase_mandatos, contexto_inicial_painel_exportacao_json, contexto_inicial_painel_demo [EXTRACTED 1.00]
- **Pipeline de planejamento estrategico (bandeiras, legado, preditores, metas)** — graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_bandeiras, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_legado, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_preditores_gip, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_metas_smart [EXTRACTED 1.00]
- **Missao 3 pure lib modules** — specs_features_missao3_rumo_design_lib_rumo_ts, specs_features_missao3_rumo_design_lib_smart_ts, specs_features_missao3_rumo_design_lib_plano_ts, specs_features_missao3_rumo_design_lib_atingimento_ts [INFERRED 0.75]

## Communities (116 total, 14 thin omitted)

### Community 0 - "espacos.ts"
Cohesion: 0.17
Nodes (24): casaDe(), Espacos(), norm(), PAPEL_DO_TIPO, ROTULO_CASA, uid(), alerta(), ALERTA_ESPACO (+16 more)

### Community 1 - "Regimento Externo 2.0 - Guia / PLL6 - Programacao e Metodo "
Cohesion: 0.05
Nodes (48): PLL6 - Programacao e Metodo (Edicao 100 Dias), Convocatoria dos inscritos selecionados, Formacao dos Sherpas (mentores), Imersao presencial PLL6 (10 e 11 dezembro, Sao Paulo), Quatro mentorias tematicas (pessoas; articulacao; fluxos e legado; quadri), Plantao online do 90o dia (planejamento do quadrimestre), Sistema de Monitoramento do PLL6, Regimento Externo 2.0 - Guia dos 100 Dias (+40 more)

### Community 2 - "Conjuntura.tsx / Resumos.tsx"
Cohesion: 0.09
Nodes (45): Cargo, CARGOS, NIVEIS, CasaMunicipal(), soma(), ANOS_MAPA, CargoMapa, CARGOS_MAPA (+37 more)

### Community 3 - "ponte.tsx / useLegado"
Cohesion: 0.09
Nodes (45): EleitoradoIlha(), EleitoradoResumo(), GRUPOS, novoId(), plural(), porNome(), TIPOS, bbox() (+37 more)

### Community 4 - "Assentos.tsx / pecas.tsx"
Cohesion: 0.09
Nodes (37): Assentos(), cargoDe(), CASA_K, Ck(), COR_GEN, COR_MAND, COR_RACA, Faceta (+29 more)

### Community 5 - "alternaArea"
Cohesion: 0.10
Nodes (34): EtapaAreas(), alternaArea(), aplica(), AREAS, CHAVE_COORDS, CHAVE_ON, chaveArq(), CHEFIA (+26 more)

### Community 6 - "rotinas.ts / EntreAreas.tsx"
Cohesion: 0.11
Nodes (33): EntreAreas(), FREQS, nomeArea(), ativaArea(), cadeirasDoElo(), CHAVE_ENTRE, CHAVE_ROTOFF, comoRotina() (+25 more)

### Community 7 - "Persona.tsx / MapaVotos.tsx"
Cohesion: 0.08
Nodes (32): AZUL, buscaVotos(), CLARO, Linha, MapaVotos(), mix(), Modo, VINHO (+24 more)

### Community 8 - "ArvorePlano.tsx / Task Breakdown"
Cohesion: 0.16
Nodes (26): ArvoreNos(), ArvorePlano(), curto(), No, noMeta(), nosPlano(), nosPrevia(), nosSucessos() (+18 more)

### Community 9 - "Legado.tsx / manchete.ts"
Cohesion: 0.05
Nodes (55): metadata, carrega(), Guia(), SCRIPTS, metadata, Harness(), Janela, Page() (+47 more)

### Community 10 - "plano.ts / useRumo"
Cohesion: 0.10
Nodes (44): aviso(), Metas(), NovoCiclo(), txt(), EXEMPLO, Preditores(), modelo(), useRumo() (+36 more)

### Community 11 - "rumo.ts / lerRumo"
Cohesion: 0.13
Nodes (26): aplicaRumo(), Criterio, CRITERIOS_GUIA, dobra(), ehObj(), espelho(), idOutra(), JORNAL_PADRAO (+18 more)

### Community 12 - "types.ts / dados.ts"
Cohesion: 0.09
Nodes (28): cache, Hist, HistBloco, bloco22(), Cargo22, CARGOS_22, pctPartidos(), Variacao (+20 more)

### Community 13 - "guia.js / render"
Cohesion: 0.07
Nodes (16): abrir(), alternarModo(), bloco(), concluir(), diagFrag(), ir(), lista(), monit() (+8 more)

### Community 14 - "Social.tsx / SocialIlha"
Cohesion: 0.11
Nodes (30): agendaDe(), Camada, NIVEIS, novoId(), plural(), porNome(), ROT_NIVEL, SocialIlha() (+22 more)

### Community 15 - "cadastro.js / carregar"
Cohesion: 0.10
Nodes (21): attr(), cargoObj(), carregar(), casaDe(), chipPartido(), cor(), enviar(), fmt() (+13 more)

### Community 16 - "PainelCadeira.tsx"
Cohesion: 0.22
Nodes (24): Cargo, cargoNome(), modelo(), modeloEscopo(), modeloFuncao(), modeloNome(), Chips(), EtapaNomes() (+16 more)

### Community 17 - "app.js / entrou"
Cohesion: 0.12
Nodes (22): aba(), autoCasa(), colher(), comEmail(), config(), entrou(), formMandato(), iniciar() (+14 more)

### Community 18 - "MISSOES (five missions data  / Guia dos 100 Dias - platafor"
Cohesion: 0.08
Nodes (26): AMBIENTES (dev/prod config), Guia dos 100 Dias - plataforma dos mandatos (single-file app), Biblioteca (BIBLIOTECA reference articles), BINGOS (checklist bingo cards), Caixa de ferramentas (FERRAMENTAS, editable templates), Canal de acolhimento, CARGOS_EQUIPE / GRUPOS_EQUIPE (team roles), Equipe e convites (invite code, team roles) (+18 more)

### Community 19 - "Bandeiras.tsx / criterios.ts"
Cohesion: 0.18
Nodes (22): Bandeiras(), Card(), limpa(), NOTAS, RECAP, ResumoMissao1(), adicionaCriterio(), alternaPrioritaria() (+14 more)

### Community 20 - "Task Breakdown / layoutOrg"
Cohesion: 0.11
Nodes (25): cor(), corte(), esc(), organogramaSvg(), layoutOrg(), T10: Exportação do organograma em SVG ✅, T11: Playwright e script de testes de tela ✅, T13: Hook de ligação `useEquipe` ✅ (+17 more)

### Community 21 - "Feedback.tsx"
Cohesion: 0.19
Nodes (21): Feedback(), rotData(), VAZIO, apaga(), contagens(), Conversa, edita(), ehObj() (+13 more)

### Community 22 - "capital-comunicacao.spec.ts"
Cohesion: 0.19
Nodes (11): abreSecao(), comunicacao(), Dados, duasSemanas(), registra(), secao(), semana(), semanas() (+3 more)

### Community 23 - "Missão 5 · Garanta o avanço  / Missão 5 Avanço Design"
Cohesion: 0.08
Nodes (25): Missão 5 Avanço Design, Código novo (`plataforma/`), Dados (tudo em `D`, sem tabela nova), Missão 5 · Garanta o avanço — Design, Riscos, Telas, Missão 5 Avanço Spec, A. Sucesso mensal (Missão 3 + Planejamento) (+17 more)

### Community 24 - "app/page.tsx / Landing"
Cohesion: 0.13
Nodes (17): Confianca(), Faq(), PERGUNTAS, Fechamento(), cadeiras(), CORES, Hero(), LINHAS (+9 more)

### Community 25 - "capital.ts"
Cohesion: 0.14
Nodes (30): Campo, PERGUNTAS, RegistroComissao, Acao, LinhaAcao(), longo, Texto, Bingo (+22 more)

### Community 26 - "Demo.tsx"
Cohesion: 0.16
Nodes (23): BuscaEleito(), escolhe(), tecla(), Props, CartaoEleito(), EstadoPleitos, Foto(), Historico() (+15 more)

### Community 27 - "Organograma.tsx / Organograma"
Cohesion: 0.12
Nodes (23): assinar(), atual, definirFoco(), Foco, focoAtual(), limparFoco(), Ouvinte, ouvintes (+15 more)

### Community 28 - "nucleo.js / uid"
Cohesion: 0.09
Nodes (18): aviso(), dataPrazo(), dBR(), dBRc(), diaAtual(), diffDias(), esc(), gravar() (+10 more)

### Community 29 - "Missao 3 Defina o Rumo (Plan / Components"
Cohesion: 0.15
Nodes (14): Components, D.rumo single source of truth, ilhas/rumo/Espacos.tsx (`rumo-espacos`), ilhas/rumo/Legado.tsx (`rumo-legado`) e Jornal.tsx, ilhas/rumo/Metas.tsx (`rumo-metas`) e CartaoMeta.tsx, ilhas/rumo/Preditores.tsx (`rumo-preditores`) e ArvorePlano.tsx, lib/atingimento.ts, lib/espacos.ts (+6 more)

### Community 30 - "Equipe.tsx / equipe.ts"
Cohesion: 0.17
Nodes (19): Cargo, DadoNo, Ficha(), ORDEM, tiposNo, cargos(), Chips(), Organograma() (+11 more)

### Community 31 - "@playwright/test / semente.ts"
Cohesion: 0.19
Nodes (10): equipe, ate39, todas, confere(), legado, base, base, abre() (+2 more)

### Community 32 - "rumo-migracao.spec.ts / guia-real.ts"
Cohesion: 0.13
Nodes (13): abreGuia(), MANDATO_REAL, MandatoReal, salvoDe(), ANTIGO, campos(), CAMPOS_ANTIGOS, ILHAS (+5 more)

### Community 33 - "Missão 2 · Equipe, Organogra / Cobertura por AC"
Cohesion: 0.18
Nodes (11): Cobertura por AC, Edge cases, Lacunas de precisão da spec, P1: Escolher as áreas e ajustar as cadeiras (MEQ-01..04), P1: Nomear e posicionar a equipe (MEQ-05..07), P1: Organograma interativo com painel (MEQ-08..11, 15, 16), P1: Rotinas geradas (MEQ-17), P2: Cadeia de rotinas (MEQ-18, 19) (+3 more)

### Community 34 - "MISSOES (7 missions data mod / Render views (home, mission,"
Cohesion: 0.11
Nodes (20): Guia dos 100 Dias (Legisla Brasil) single-file app, BIBLIOTECA (resource library), BINGOS and CAMPOS_MONIT (monitoring), CANAL_ACOLHIMENTO (support channel), CARGOS_EQUIPE / GRUPOS_EQUIPE (team roles), FERRAMENTAS (tools catalog), FORMULA_META / METAS_EXEMPLARES / OBJ_ESPECIFICOS (goal setting), Missao: Capital politico, articulacao e mobilizacao (+12 more)

### Community 35 - "novos.js / chips"
Cohesion: 0.16
Nodes (14): atualizar(), chips(), citadas(), escolherMun(), fmt(), limpa(), norm(), pinta() (+6 more)

### Community 36 - "compilerOptions / tsconfig.json"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 37 - "Missão 3 · Defina o Rumo (Pl / User Stories"
Cohesion: 0.20
Nodes (10): P1: Aba Planejamento Estratégico com atingimento ⭐ MVP, P1: Bandeiras com argumentos e critérios ⭐ MVP, P1: Legado guiado com primeira página de jornal ⭐ MVP, P1: Metas SMART com retorno, responsável e apoio ⭐ MVP, P1: Preditores e objetivos específicos como primeira camada do plano ⭐ MVP, P1: Resumo do plano no Painel do mandato ⭐ MVP, P2: Espaços que o mandato pretende compor, P2: Modelos de manchete e rascunhos dos grupos (+2 more)

### Community 38 - "json / build_comissoes.py"
Cohesion: 0.19
Nodes (4): baixa(), main(), todas(), troca()

### Community 39 - "Painel (montagem do painel a / Fonte (carregamento de dados"
Cohesion: 0.15
Nodes (16): Bandeiras prioritárias (Missão 3), Demo (gerador de 24 mandatos fictícios), Tabela equipe_legisla (controle de acesso), Arquivos JSON exportados pelos mandatos (Baixar dados), Filtros (UF, cargo, partido) e ordenação, Fonte (carregamento de dados: nuvem, arquivos, demo), Fragilidades (mandato M vs liderança parlamentar P), Frentes de articulação (Missão 4) (+8 more)

### Community 40 - "semente-rumo.ts / rumo-harness.spec.ts"
Cohesion: 0.09
Nodes (20): escolheSaude(), Conv, IRMAS, ALMG, EDUCACAO, Espaco, FEDERAL, MINAS (+12 more)

### Community 41 - "smart.ts"
Cohesion: 0.17
Nodes (13): ALERTA_ROTINA, avaliaMeta(), DICAS, Letra, LETRAS, NAO_VERBOS, PRAZO, Retorno (+5 more)

### Community 42 - "Missão 2 · Equipe, Organograma e Rotinas Tasks"
Cohesion: 0.12
Nodes (17): Diagram-Definition Cross-Check, missao2-equipe tasks.md, Execution Plan, Execution Protocol (MANDATORY -- do not skip), Gate Check Commands, Missão 2 · Equipe, Organograma e Rotinas Tasks, Phase 1: Lógica pura (`lib/`), Phase 2: Infra de testes de tela (+9 more)

### Community 43 - "build_data.py / cargo_uf"
Cohesion: 0.23
Nodes (10): lib/dados.ts (loaders com cache), baixa(), cargo_uf(), coleta_2024(), coleta_2026(), fnum(), json_tse(), main() (+2 more)

### Community 44 - "comunicacao.ts"
Cohesion: 0.11
Nodes (34): Comunicacao(), Barras(), Grafico(), GraficoProps, ItemBarra, Linha(), Marca(), MARCAS (+26 more)

### Community 45 - "Task Breakdown / Eleito"
Cohesion: 0.12
Nodes (18): PleitoTSE, Eleito, T10: Destino do retorno de login, T11: Estilo base da landing, T16: Missões em linha do tempo, T18: Privacidade, fontes e autoria, T19: Perguntas frequentes, T1: Criar o layout do Guia com o CSS legado (+10 more)

### Community 46 - "legado-m3.test.ts"
Cohesion: 0.17
Nodes (10): BAND, CODIGO, comEstado(), CONTEUDO, Ex, guia(), janela(), LEG (+2 more)

### Community 47 - "Landing Validation / Spec-Anchored Acceptance Cri"
Cohesion: 0.13
Nodes (15): Code Quality, Discrimination Sensor, Edge Cases, Gate Check, Lacunas ranqueadas, Landing Validation, P1: Chegar na landing e entrar no Guia, P1: Demonstração com dados do TSE (+7 more)

### Community 48 - "build_eleitos.py / csv"
Cohesion: 0.25
Nodes (8): linhas(), main(), norm(), zip_ano(), linhas(), le(), main(), num()

### Community 49 - "rumo-legado.spec.ts / completa"
Cohesion: 0.17
Nodes (10): abreGaveta(), BANDEIRAS, completa(), continuar(), guarda(), Legado, legadoDe(), protagonista() (+2 more)

### Community 50 - "useEquipe / EtapaCadeiras.tsx"
Cohesion: 0.16
Nodes (17): TEMATICOS, Escalacao(), ETAPAS, EtapaCadeiras(), Dado, MiniOrg(), tipos, Resultado (+9 more)

### Community 51 - "Missao 2 Equipe, Organograma / Landing Page do Guia"
Cohesion: 0.18
Nodes (9): landing spec.md, Landing Page do Guia, landing tasks.md, landing validation.md, missao2-equipe design.md, ponte.tsx ILHAS bridge, missao2-equipe spec.md, Missao 2 Equipe, Organograma e Rotinas (+1 more)

### Community 52 - "Landing Page Tasks / Execution Plan"
Cohesion: 0.14
Nodes (14): Cobertura de requisitos, Diagram-Definition Cross-Check, Execution Plan, Execution Protocol (MANDATORY -- do not skip), Gate Check Commands, Landing Page Tasks, Phase 1: Rotas, Phase 2: Lógica da demonstração (+6 more)

### Community 53 - "Execution Plan / Missão 3 · Defina o Rumo (Pl"
Cohesion: 0.13
Nodes (15): missao3-rumo tasks.md, Execution Plan, Execution Protocol (MANDATORY -- do not skip), Gate Check Commands, Missão 3 · Defina o Rumo (Planejamento Estratégico) Tasks, Phase 1: Lógica pura (`lib/`) e dados, Phase 2: Infra de tela e ganchos do legado, Phase 3: Bandeiras e espaços (+7 more)

### Community 54 - "dadoDe"
Cohesion: 0.14
Nodes (11): M, metasDe(), P, PLANO, planosDe(), linhas(), M, meta() (+3 more)

### Community 55 - "ativas"
Cohesion: 0.12
Nodes (34): baixa(), Entrega(), ITENS, Aba, ABAS, ICONES, Participantes(), pessoa() (+26 more)

### Community 56 - "Landing Page do Guia dos 100 / User Stories"
Cohesion: 0.15
Nodes (13): Assumptions & Open Questions, Edge Cases, Goals, Landing Page do Guia dos 100 Dias Specification, Out of Scope, P1: Chegar na landing e entrar no Guia ⭐ MVP, P1: Demonstração com dados do TSE ⭐ MVP, P2: Entender o caminho completo (+5 more)

### Community 57 - "Missão 2 · Equipe, Organograma e Rotinas Specification"
Cohesion: 0.14
Nodes (14): Assumptions & Open Questions, Edge Cases, Goals, Implicit-Requirement Dimensions, Jornada do usuário, Jornada (Playwright), Lógica (`node --test`), Missão 2 · Equipe, Organograma e Rotinas Specification (+6 more)

### Community 58 - "rumo-metas.spec.ts"
Cohesion: 0.21
Nodes (13): apoio(), COM_PREDITOR, letra(), M, meta(), metasDe(), resp(), texto() (+5 more)

### Community 59 - "Comissoes.tsx"
Cohesion: 0.18
Nodes (12): CartaoComissao(), Comissoes(), Linha, norm(), Registro, uid(), BANDEIRAS, BANDEIRA_COMISSAO (+4 more)

### Community 60 - "build_executivo.py / main"
Cohesion: 0.33
Nodes (6): coligacao(), escolhe(), main(), reg(), sigla(), zip_ano()

### Community 61 - "build_pleitos.py / pleitos_do_ano"
Cohesion: 0.32
Nodes (8): alvos(), linhas(), main(), norm_sit(), num(), pleitos_do_ano(), titulo(), zip_()

### Community 62 - "route.ts"
Cohesion: 0.16
Nodes (10): calcula(), CARGO, dynamic, emCurso, GET(), maxDuration, municipio(), Resp (+2 more)

### Community 63 - "rumo-plano.spec.ts / metasDe"
Cohesion: 0.20
Nodes (6): EQUIPE4, M, metasDe(), no(), pctObj(), PLANO

### Community 64 - "capital-comissoes.spec.ts"
Cohesion: 0.20
Nodes (7): botao(), DA_M3, FEDERAL, pergunta(), Registro, registros(), SAUDE

### Community 66 - "Recomenda.tsx"
Cohesion: 0.16
Nodes (23): Rotinas, cargos(), daMissao3(), GRUPOS, Recomenda(), Bandeira, bandeiraDe(), bandeiraDoRotulo() (+15 more)

### Community 67 - "build_social.py / collections"
Cohesion: 0.12
Nodes (11): num(), serie(), Como executar (obrigatório), Fase 1 — Base, Fase 2 — Comissões (Parte A), Fase 3 — Matriz de ações (Parte B), Fase 4 — Comunicação (Parte C), Fase 5 — Clipping (Parte C, tópico 5) (+3 more)

### Community 69 - "resumo.js / arq"
Cohesion: 0.40
Nodes (8): arq(), base(), ex(), json(), lista(), missao(), pagina(), tudo()

### Community 70 - "Missão 4 · Capital Político  / 4. Parte C — Comunicação"
Cohesion: 0.13
Nodes (16): Missão 4 Capital Político Design, 1. O que reaproveitamos (já existe), 2. Parte A — Comissões, 4. Parte C — Comunicação, 5. Arquivos novos, 6. Suposições assumidas (peço seu OK), BANDEIRA_COMISSAO table (flag to committee), Clipping (notícias) (+8 more)

### Community 71 - "Missão 4 · Capital Político  / Parte A — Comissões permanen"
Cohesion: 0.20
Nodes (10): Clipping de imprensa (dentro do tópico 5), Critérios (formato: QUANDO … ENTÃO …), Decisões que preciso que você confirme, Fora do escopo (v1), Missão 4 · Capital Político — Spec, Objetivos, Parte A — Comissões permanentes, Parte C — Acompanhamento da comunicação (+2 more)

### Community 72 - "Candidates (under observatio / LESSONS - auto-maintained by"
Cohesion: 0.20
Nodes (10): Candidates (under observation - do NOT load as guidance yet), Confirmed (load these at Specify/Design), L-001 - Cover each data-source branch wired in a UI island (such as a per-region catalog fetch) with an e2e test that stubs the request, not only the pure function that consumes the data, L-002 - Cover each data-source branch wired in a UI island (such as a per-region catalog fetch) with an e2e test that stubs the request, not only the pure function that consumes the data, L-003 - List every alternative of a keyword regex in the test table, one case per alternative, so removing one is detected, L-004 - Give each normalization step for corrupted input (such as dedupe by id) its own test case, L-005 - Before verifying, confirm committed code does not import untracked files by running tests in a clean worktree of HEAD, L-006 - When a spec assumption names word variants (diário, diariamente), assert the full outcome of each variant, not only the one in the example (+2 more)

### Community 73 - "Task Breakdown"
Cohesion: 0.17
Nodes (23): OpcoesPlano, CartaoMeta(), CartaoMetaProps, ROT_LETRA, semHtml(), Pessoa, Ref, ItemMeta (+15 more)

### Community 74 - "rumo-bandeiras.spec.ts / abre"
Cohesion: 0.36
Nodes (6): card(), chip(), comNotas(), CRIT, nota(), rumoDe()

### Community 75 - "temConteudo / Impacto técnico (resumo; o d"
Cohesion: 0.29
Nodes (7): estadoTxt(), funcoes(), temConteudo(), Integration Points, Impacto técnico (resumo; o design vem depois da validação), T34: Contadores de cargos no Guia ✅, Achados em código (ilhas e integração)

### Community 76 - "package.json"
Cohesion: 0.06
Nodes (30): dependencies, @dagrejs/dagre, html-to-image, next, react, react-dom, @xyflow/react, devDependencies (+22 more)

### Community 77 - "legado-m4.test.ts"
Cohesion: 0.22
Nodes (8): CODIGO, CONTEUDO, Ex, guia(), hashMissao4(), Janela, Missao, sha()

### Community 78 - "m3.js / bandeirasFeito"
Cohesion: 0.44
Nodes (6): bandeirasFeito(), campos(), ehObj(), legadoFeito(), preenchido(), rumo()

### Community 79 - "sugestoes.js / checarEquipe"
Cohesion: 0.32
Nodes (3): checarEquipe(), contar(), tela()

### Community 80 - "build_filiados.py / main"
Cohesion: 0.39
Nodes (5): baixa(), main(), novo(), soma(), tse_para_ibge()

### Community 81 - "Spec-Anchored Acceptance Criteria"
Cohesion: 0.18
Nodes (11): ok(), Aba Planejamento (RUM-40, 41, 42) e Painel (RUM-43), Bandeiras (RUM-01, 02, 03), Edge cases e migração (RUM-70), Espaços (RUM-50, 51), Extras P3 (RUM-60), Legado (RUM-10, 11, 12) e modelos (RUM-52), Metas (RUM-30, 31, 32) (+3 more)

### Community 82 - "Missão 2 · Equipe, Organograma e Rotinas Validation"
Cohesion: 0.22
Nodes (9): Code Quality, Diff range, Fora do escopo (Fase 7), Missão 2 · Equipe, Organograma e Rotinas Validation, Requirement Traceability Update (sugestão, spec.md não foi editada), Resultado dos gates (contagens, iteração 1), Summary, validate_state.py (+1 more)

### Community 83 - "Funcionalidades / Funcionalidades.tsx"
Cohesion: 0.48
Nodes (6): Equipe(), Funcionalidades(), Hemi(), Mapa(), Resumo(), T17: Funcionalidades

### Community 84 - "rumo-preditores.spec.ts / itens"
Cohesion: 0.43
Nodes (6): arvore(), card(), itens(), marca(), objetivo(), Fix Plans (lacunas ranqueadas)

### Community 85 - "legado-m2.test.ts"
Cohesion: 0.25
Nodes (7): CARGOS, CODIGO, comDados(), Ex, FUNCOES, ITENS, janela()

### Community 86 - "legado-m5.test.ts"
Cohesion: 0.21
Nodes (8): CODIGO, CONTEUDO, guia(), janela(), janelaCiclo(), janelaLista(), Missao, PAGINA

### Community 87 - "User Stories"
Cohesion: 0.22
Nodes (9): P1: Escolher as áreas e ajustar as cadeiras ⭐ MVP, P1: Nomear e posicionar a equipe ⭐ MVP, P1: Organograma interativo com painel por cadeira ⭐ MVP, P1: Rotinas geradas pelas cadeiras ⭐ MVP, P2: Cadeia de rotinas com cadeiras destacadas, P2: Comunicação entre áreas, P2: Entrega e compartilhamento, P3: Controles avançados do organograma (+1 more)

### Community 88 - "Decisions / Project State"
Cohesion: 0.29
Nodes (7): AD-001: A landing vive em `/` e o Guia passa a `/guia` (2026-10-23), AD-002: Demonstração usa os dados do TSE já publicados em `public/data` (2026-10-23), AD-003: Ganchos novos do legado entram só em arquivos escritos à mão (2026-10-23), AD-004: Regra de negócio das ilhas vive em `lib/` como função pura (2026-10-23), Decisions, Handoff, Project State

### Community 89 - "Missão 3 · Defina o Rumo Validation"
Cohesion: 0.22
Nodes (9): Missão 3 Rumo Validation Report, Fix Plans (lacunas ranqueadas, rodada 2), Gap G1: bandeiras.ts untracked blocks delivery, Gate Check (rodada 2, árvore real, `plataforma/`), Missão 3 · Defina o Rumo Validation, Requirement Traceability Update, Saída do `validate_state.py`, Summary (rodada 2) (+1 more)

### Community 90 - "capital-acoes.spec.ts"
Cohesion: 0.20
Nodes (7): Acao, AcaoCad, acoes(), comPosse(), iso(), linha(), marca()

### Community 91 - "Guia rapido: API de resultad / API nao oficial resultados.t"
Cohesion: 0.50
Nodes (5): Guia rapido: API de resultados do TSE, Codigo TSE diferente de codigo IBGE (cdi), coleta_municipal.py (coletor de votos municipais), Dados abertos TSE (CSV), API nao oficial resultados.tse.jus.br

### Community 92 - "Rodada 1 (histórico)"
Cohesion: 0.25
Nodes (8): Code Quality, Discrimination Sensor, Gate Check, Requirement Traceability Update, Rodada 1 (histórico), Rodada 1: veredito, Summary, Task Completion

### Community 93 - "estadoEx / progMissao"
Cohesion: 0.40
Nodes (5): estadoEx(), progGeral(), progMissao(), proximoExercicio(), public/legacy/m3.js (gancho, escrito à mão)

### Community 94 - "Seções do painel (progresso, / BINGOS (frentes de articulaç"
Cohesion: 0.40
Nodes (4): BINGOS (frentes de articulação, Missão 4), FRAGILIDADES, PREDITORES, Seções do painel (progresso, preditores, frentes, fragilidades, bandeiras, sinais, tabela)

### Community 95 - "Missão 2 · Equipe, Organograma e Rotinas Design"
Cohesion: 0.20
Nodes (10): NoCargo(), Abordagens avaliadas (recomendação primeiro), Architecture Overview, Code Reuse Analysis, Error Handling Strategy, Existing Components to Leverage, Missão 2 · Equipe, Organograma e Rotinas Design, Risks & Concerns (+2 more)

### Community 96 - "Task Breakdown"
Cohesion: 0.15
Nodes (13): T10: Hook `useRumo`, registro das ilhas e rota de teste ✅, T14: Ilha de espaços que o mandato pretende compor ✅, T15: Primeira página de jornal (componente visual) ✅, T16: Legado guiado em 4 passos com cargo postulado ✅, T17: Modelos de manchete e rascunhos dos grupos (P2) ✅, T18: Preditores com objetivo específico e árvore ao vivo ✅, T20: Aba Planejamento Estratégico: árvore, status e atingimento ✅, T21: Edição pela aba: acrescentar, editar, remover, filtrar por pessoa ✅ (+5 more)

### Community 98 - "Legisla Brasil logo (wordmar / Burgundy split-shape emblem "
Cohesion: 0.67
Nodes (3): Legisla Brasil logo (wordmark with BRASIL subtitle), Burgundy split-shape emblem (abstract bird/book/wing mark), Legisla Brasil brand identity

### Community 109 - "uid"
Cohesion: 0.29
Nodes (7): codigo(), criarConta(), criarMandato(), entrar(), nomeDe(), sessao(), uid()

### Community 110 - "Missão 3 · Defina o Rumo (Planejamento Estratégico) Specification"
Cohesion: 0.12
Nodes (17): pred(), missao3-rumo design.md, lib/plano.ts, Missão 3 · Defina o Rumo (Planejamento Estratégico) Design, Risks & Concerns, Tech Decisions, Assumptions & Open Questions, missao3-rumo spec.md (+9 more)

### Community 111 - "Missão 5 · Garanta o avanço Validation"
Cohesion: 0.29
Nodes (6): Gates, Lacunas ranqueadas (nenhuma bloqueia o PASS), Missão 5 · Garanta o avanço Validation, Spec-Anchored Acceptance Criteria, Validation: Missão 5 - PASS, Verificações adicionais

### Community 112 - "RedirecionaAuth"
Cohesion: 0.60
Nodes (3): RedirecionaAuth(), destinoAuth(), T21: Repasse do retorno de login

### Community 113 - "Components"
Cohesion: 0.50
Nodes (4): Components, ilhas/equipe/ (React), lib/layoutOrg.ts, lib/entrega.ts, lib/exporta.ts (puros), lib/rotinas.ts (puro)

### Community 118 - "Architecture Overview"
Cohesion: 0.50
Nodes (4): bandeira(), Abordagens avaliadas (recomendação primeiro), Architecture Overview, Preservação dos textos (regra do usuário)

## Knowledge Gaps
- **66 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `typescript`, `Estudo: Trajetoria de Assessores Negros no Congresso` (+61 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 774 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Conjuntura.tsx / Resumos.tsx` to `espacos.ts`, `ponte.tsx / useLegado`, `Assentos.tsx / pecas.tsx`, `rotinas.ts / EntreAreas.tsx`, `Persona.tsx / MapaVotos.tsx`, `ArvorePlano.tsx / Task Breakdown`, `Legado.tsx / manchete.ts`, `plano.ts / useRumo`, `Social.tsx / SocialIlha`, `PainelCadeira.tsx`, `Bandeiras.tsx / criterios.ts`, `Feedback.tsx`, `capital.ts`, `Demo.tsx`, `Organograma.tsx / Organograma`, `Equipe.tsx / equipe.ts`, `comunicacao.ts`, `useEquipe / EtapaCadeiras.tsx`, `ativas`, `Comissoes.tsx`, `Recomenda.tsx`, `Task Breakdown`, `package.json`, `RedirecionaAuth`?**
  _High betweenness centrality (0.170) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `useLegado()` (e.g. with `Existing Components to Leverage` and `ilhas/equipe/ (React)`) actually correct?**
  _`useLegado()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _66 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Regimento Externo 2.0 - Guia / PLL6 - Programacao e Metodo ` be split into smaller, more focused modules?**
  _Cohesion score 0.05052790346907994 - nodes in this community are weakly interconnected._
- **Why does `Missão 4 Capital Político Design` connect `Missão 4 · Capital Político  / 4. Parte C — Comunicação` to `Recomenda.tsx`, `json / build_comissoes.py`, `Missão 5 · Garanta o avanço  / Missão 5 Avanço Design`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `chaveFicha()` (e.g. with `Existing Components to Leverage` and `lib/cadeiras.ts (puro)`) actually correct?**
  _`chaveFicha()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `Conjuntura.tsx / Resumos.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08941176470588236 - nodes in this community are weakly interconnected._