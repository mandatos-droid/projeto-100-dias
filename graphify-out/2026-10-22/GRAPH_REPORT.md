# Graph Report - Projeto 100 dias  (2026-10-22)

## Corpus Check
- 403 files · ~850,655 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .css 2)

## Summary
- 737 nodes · 1421 edges · 37 communities (27 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `887046dc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Equipe e Ficha
- Scripts de Dados Python
- Regimento e Metodo PLL6
- Nucleo Legado (nucleo.js)
- pecas.tsx
- Assentos e Hemiciclo
- Guia Legado (guia.js)
- App Legado (app.js)
- Guia 100 Dias - Missoes
- Tipos e Carga de Dados
- Cadastro Legado
- Persona e Pleito
- Guia - Missoes e Progresso
- Eleitorado.tsx
- Config TypeScript
- Novos Legado
- Painel de Mandatos
- Equipe.tsx
- Agendas e Indicadores
- Ponte Guia-Calor
- Social
- Mapa de Votos
- Eleitorado
- Mapa de Conjuntura
- Resumo Legado
- Fonte de Dados do Painel
- Pagina Guia e Ilhas
- Secoes do Painel
- Config Next.js
- Identidade Legisla Brasil
- Regras Graphify
- Agendas Reynolds e Triade
- Mapas (arquivo vazio)
- Logo Variante 2
- diaDe

## God Nodes (most connected - your core abstractions)
1. `Assentos()` - 27 edges
2. `Conjuntura()` - 26 edges
3. `useLegado()` - 24 edges
4. `useCarga()` - 20 edges
5. `Persona()` - 19 edges
6. `Municipio()` - 18 edges
7. `SocialIlha()` - 18 edges
8. `compilerOptions` - 16 edges
9. `carregaGeo()` - 15 edges
10. `carrega()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `mandatos.permite_pesquisa (regra de privacidade)` --semantically_similar_to--> `Protecao de dados e LGPD`  [INFERRED] [semantically similar]
  plataforma/CLAUDE.md → graphify-out/converted/Regimento Externo 2.0 - GUIA DOS 100 DIAS_8e027305.md
- `Ilhas React da Missao 1 (persona, hemiciclo, calor, municipio, cadastro)` --implements--> `Mapa Politico (8 perguntas-chave)`  [INFERRED]
  plataforma/README.md → graphify-out/converted/Regimento Externo 2.0 - GUIA DOS 100 DIAS_8e027305.md
- `Assentos()` --indirect_call--> `carregaEleitos()`  [INFERRED]
  plataforma/ilhas/Assentos.tsx → plataforma/lib/dados.ts
- `Assentos()` --indirect_call--> `carregaMapaBR()`  [INFERRED]
  plataforma/ilhas/Assentos.tsx → plataforma/lib/dados.ts
- `AssentosResumo()` --indirect_call--> `carregaEleitos()`  [INFERRED]
  plataforma/ilhas/Resumos.tsx → plataforma/lib/dados.ts

## Import Cycles
- 3-file cycle: `plataforma/ilhas/Conjuntura.tsx -> plataforma/ilhas/ponte.tsx -> plataforma/ilhas/Resumos.tsx -> plataforma/ilhas/Conjuntura.tsx`
- 3-file cycle: `plataforma/ilhas/Resumos.tsx -> plataforma/ilhas/pecas.tsx -> plataforma/ilhas/ponte.tsx -> plataforma/ilhas/Resumos.tsx`
- 3-file cycle: `plataforma/ilhas/Social.tsx -> plataforma/ilhas/pecas.tsx -> plataforma/ilhas/ponte.tsx -> plataforma/ilhas/Social.tsx`
- 4-file cycle: `plataforma/ilhas/Conjuntura.tsx -> plataforma/ilhas/pecas.tsx -> plataforma/ilhas/ponte.tsx -> plataforma/ilhas/Resumos.tsx -> plataforma/ilhas/Conjuntura.tsx`
- 4-file cycle: `plataforma/ilhas/MapaConjuntura.tsx -> plataforma/ilhas/pecas.tsx -> plataforma/ilhas/ponte.tsx -> plataforma/ilhas/Social.tsx -> plataforma/ilhas/MapaConjuntura.tsx`

## Hyperedges (group relationships)
- **Cinco Missoes do Guia dos 100 Dias** — graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_missao_1, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_missao_2, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_missao_3, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_missao_4, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_missao_5 [EXTRACTED 1.00]
- **Five missions of the 100-day guide** — contexto_inicial_guia_dos_100_dias_plataforma_dos_mandatos_copy_missao_1, contexto_inicial_guia_dos_100_dias_plataforma_dos_mandatos_copy_missao_2, contexto_inicial_guia_dos_100_dias_plataforma_dos_mandatos_copy_missao_3, contexto_inicial_guia_dos_100_dias_plataforma_dos_mandatos_copy_missao_4, contexto_inicial_guia_dos_100_dias_plataforma_dos_mandatos_copy_missao_5 [EXTRACTED 1.00]
- **Seven missions of the first 100 days** — contexto_inicial_index_6_missao_chegada, contexto_inicial_index_6_missao_equipe, contexto_inicial_index_6_missao_planejamento, contexto_inicial_index_6_missao_comissoes, contexto_inicial_index_6_missao_capital_politico, contexto_inicial_index_6_missao_projeto_politico, contexto_inicial_index_6_missao_imersao [EXTRACTED 1.00]
- **Fontes de dados do painel** — contexto_inicial_painel_supabase_mandatos, contexto_inicial_painel_exportacao_json, contexto_inicial_painel_demo [EXTRACTED 1.00]
- **Pipeline de planejamento estrategico (bandeiras, legado, preditores, metas)** — graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_bandeiras, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_legado, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_preditores_gip, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_metas_smart [EXTRACTED 1.00]
- **Fluxo legado + ponte + ilhas React** — plataforma_claude_app_page, plataforma_claude_ilhas_ponte, plataforma_claude_estado_legado_D, plataforma_scripts_extrair_legado [EXTRACTED 1.00]
- **Fontes de dados do painel (nuvem, arquivos JSON, navegador)** — plataforma_public_painel_fonte, plataforma_public_painel_supabase_mandatos, plataforma_public_painel_base [INFERRED 0.85]

## Communities (37 total, 10 thin omitted)

### Community 0 - "Equipe e Ficha"
Cohesion: 0.05
Nodes (36): calcula(), CARGO, dynamic, emCurso, GET(), maxDuration, municipio(), Resp (+28 more)

### Community 1 - "Scripts de Dados Python"
Cohesion: 0.06
Nodes (40): lib/dados.ts (loaders com cache), baixa(), cargo_uf(), coleta_2024(), coleta_2026(), fnum(), json_tse(), main() (+32 more)

### Community 2 - "Regimento e Metodo PLL6"
Cohesion: 0.06
Nodes (42): Guia rapido: API de resultados do TSE, Codigo TSE diferente de codigo IBGE (cdi), coleta_municipal.py (coletor de votos municipais), Dados abertos TSE (CSV), API nao oficial resultados.tse.jus.br, PLL6 - Programacao e Metodo (Edicao 100 Dias), Convocatoria dos inscritos selecionados, Formacao dos Sherpas (mentores) (+34 more)

### Community 3 - "Nucleo Legado (nucleo.js)"
Cohesion: 0.07
Nodes (29): aviso(), codigo(), criarConta(), criarMandato(), dataPrazo(), dBR(), dBRc(), diaAtual() (+21 more)

### Community 4 - "pecas.tsx"
Cohesion: 0.14
Nodes (26): Camada, CAMADAS, CLARO, grad(), Linha, mix(), Municipio(), Pessoa (+18 more)

### Community 5 - "Assentos e Hemiciclo"
Cohesion: 0.10
Nodes (24): Assentos(), cargoDe(), CASA_K, Ck(), COR_GEN, COR_MAND, COR_RACA, Faceta (+16 more)

### Community 6 - "Guia Legado (guia.js)"
Cohesion: 0.07
Nodes (11): abrir(), alternarModo(), bloco(), concluir(), diagFrag(), ir(), lista(), montar() (+3 more)

### Community 7 - "App Legado (app.js)"
Cohesion: 0.11
Nodes (22): aba(), autoCasa(), colher(), comEmail(), config(), entrou(), formMandato(), iniciar() (+14 more)

### Community 8 - "Guia 100 Dias - Missoes"
Cohesion: 0.08
Nodes (26): AMBIENTES (dev/prod config), Guia dos 100 Dias - plataforma dos mandatos (single-file app), Biblioteca (BIBLIOTECA reference articles), BINGOS (checklist bingo cards), Caixa de ferramentas (FERRAMENTAS, editable templates), Canal de acolhimento, CARGOS_EQUIPE / GRUPOS_EQUIPE (team roles), Equipe e convites (invite code, team roles) (+18 more)

### Community 9 - "Tipos e Carga de Dados"
Cohesion: 0.06
Nodes (61): Cargo, CARGOS, NIVEIS, ANOS_MAPA, CargoMapa, CARGOS_MAPA, Conjuntura(), COR_TAG (+53 more)

### Community 10 - "Cadastro Legado"
Cohesion: 0.11
Nodes (15): attr(), cargoObj(), carregar(), casaDe(), chipPartido(), cor(), enviar(), fmt() (+7 more)

### Community 11 - "Persona e Pleito"
Cohesion: 0.14
Nodes (19): Chip(), CARGOS, Cartao(), CASAS, FormPleito(), envia(), local(), PARTIDOS (+11 more)

### Community 12 - "Guia - Missoes e Progresso"
Cohesion: 0.11
Nodes (20): Guia dos 100 Dias (Legisla Brasil) single-file app, BIBLIOTECA (resource library), BINGOS and CAMPOS_MONIT (monitoring), CANAL_ACOLHIMENTO (support channel), CARGOS_EQUIPE / GRUPOS_EQUIPE (team roles), FERRAMENTAS (tools catalog), FORMULA_META / METAS_EXEMPLARES / OBJ_ESPECIFICOS (goal setting), Missao: Capital politico, articulacao e mobilizacao (+12 more)

### Community 13 - "Eleitorado.tsx"
Cohesion: 0.31
Nodes (13): EleitoradoIlha(), EleitoradoResumo(), GRUPOS, novoId(), plural(), porNome(), TIPOS, useCarga() (+5 more)

### Community 14 - "Config TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 15 - "Novos Legado"
Cohesion: 0.19
Nodes (12): atualizar(), chips(), citadas(), escolherMun(), fmt(), limpa(), norm(), pinta() (+4 more)

### Community 16 - "Painel de Mandatos"
Cohesion: 0.15
Nodes (16): Bandeiras prioritárias (Missão 3), Demo (gerador de 24 mandatos fictícios), Tabela equipe_legisla (controle de acesso), Arquivos JSON exportados pelos mandatos (Baixar dados), Filtros (UF, cargo, partido) e ordenação, Fonte (carregamento de dados: nuvem, arquivos, demo), Fragilidades (mandato M vs liderança parlamentar P), Frentes de articulação (Missão 4) (+8 more)

### Community 17 - "Equipe.tsx"
Cohesion: 0.15
Nodes (23): Cargo, cargos(), Chips(), DadoNo, Ficha(), ORDEM, Organograma(), Rotinas (+15 more)

### Community 18 - "Agendas e Indicadores"
Cohesion: 0.06
Nodes (52): bbox(), Caixa, Celula, MapaConjuntura(), Marcas, Municipios, Vista, COR_REL (+44 more)

### Community 19 - "Ponte Guia-Calor"
Cohesion: 0.24
Nodes (10): aviso(), ILHAS, L(), Legado, mandato(), raizes, salva(), Eleitorado (+2 more)

### Community 20 - "Social"
Cohesion: 0.32
Nodes (3): checarEquipe(), contar(), tela()

### Community 21 - "Mapa de Votos"
Cohesion: 0.16
Nodes (13): AZUL, buscaVotos(), CLARO, Linha, MapaVotos(), mix(), Modo, VINHO (+5 more)

### Community 24 - "Resumo Legado"
Cohesion: 0.40
Nodes (8): arq(), base(), ex(), json(), lista(), missao(), pagina(), tudo()

### Community 25 - "Fonte de Dados do Painel"
Cohesion: 0.22
Nodes (9): painel.html (Painel de Mandatos), BASE (mandatos carregados), CARGOS_EQUIPE, filtrados, FILTRO (uf, cargo, partido), Fonte (nuvem, arquivos, local), lerMandato, MISSOES (missões e exercícios do Guia) (+1 more)

### Community 26 - "Pagina Guia e Ilhas"
Cohesion: 0.47
Nodes (4): carrega(), Guia(), SCRIPTS, instalaIlhas()

### Community 27 - "Secoes do Painel"
Cohesion: 0.40
Nodes (4): BINGOS (frentes de articulação, Missão 4), FRAGILIDADES, PREDITORES, Seções do painel (progresso, preditores, frentes, fragilidades, bandeiras, sinais, tabela)

### Community 29 - "Identidade Legisla Brasil"
Cohesion: 0.67
Nodes (3): Legisla Brasil logo (wordmark with BRASIL subtitle), Burgundy split-shape emblem (abstract bird/book/wing mark), Legisla Brasil brand identity

## Knowledge Gaps
- **58 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `typescript`, `Estudo: Trajetoria de Assessores Negros no Congresso` (+53 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 290 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Mapa de Votos` to `Equipe e Ficha`, `pecas.tsx`, `Assentos e Hemiciclo`, `Tipos e Carga de Dados`, `Persona e Pleito`, `Eleitorado.tsx`, `Equipe.tsx`, `Agendas e Indicadores`, `Ponte Guia-Calor`, `Pagina Guia e Ilhas`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Assentos()` (e.g. with `vazio()` and `carregaEleitos()`) actually correct?**
  _`Assentos()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _58 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Equipe e Ficha` be split into smaller, more focused modules?**
  _Cohesion score 0.048726467331118496 - nodes in this community are weakly interconnected._
- **Why does `API nao oficial resultados.tse.jus.br` connect `Regimento e Metodo PLL6` to `Equipe e Ficha`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **Should `Scripts de Dados Python` be split into smaller, more focused modules?**
  _Cohesion score 0.05524537173082574 - nodes in this community are weakly interconnected._
- **Should `Regimento e Metodo PLL6` be split into smaller, more focused modules?**
  _Cohesion score 0.06262626262626263 - nodes in this community are weakly interconnected._