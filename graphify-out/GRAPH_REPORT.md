# Graph Report - Projeto 100 dias  (2026-10-18)

## Corpus Check
- 317 files · ~406,703 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 11, .css 2)

## Summary
- 661 nodes · 1275 edges · 37 communities (29 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Equipe e Ficha
- Scripts de Dados Python
- Regimento e Metodo PLL6
- Nucleo Legado (nucleo.js)
- Calor e Resumos
- Assentos e Hemiciclo
- Guia Legado (guia.js)
- App Legado (app.js)
- Guia 100 Dias - Missoes
- Tipos e Carga de Dados
- Cadastro Legado
- Persona e Pleito
- Guia - Missoes e Progresso
- Municipio e Formatacao
- Config TypeScript
- Novos Legado
- Painel de Mandatos
- Rotas API e Layout
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
1. `Assentos()` - 26 edges
2. `useLegado()` - 26 edges
3. `useCarga()` - 22 edges
4. `Municipio()` - 20 edges
5. `CalorV2()` - 18 edges
6. `Persona()` - 18 edges
7. `SocialIlha()` - 18 edges
8. `carregaGeo()` - 18 edges
9. `corPartido()` - 17 edges
10. `Calor()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `mandatos.permite_pesquisa (regra de privacidade)` --semantically_similar_to--> `Protecao de dados e LGPD`  [INFERRED] [semantically similar]
  plataforma/CLAUDE.md → graphify-out/converted/Regimento Externo 2.0 - GUIA DOS 100 DIAS_8e027305.md
- `Ilhas React da Missao 1 (persona, hemiciclo, calor, municipio, cadastro)` --implements--> `Mapa Politico (8 perguntas-chave)`  [INFERRED]
  plataforma/README.md → graphify-out/converted/Regimento Externo 2.0 - GUIA DOS 100 DIAS_8e027305.md
- `Assentos()` --indirect_call--> `carregaMapaBR()`  [INFERRED]
  plataforma/ilhas/Assentos.tsx → plataforma/lib/dados.ts
- `AssentosResumo()` --indirect_call--> `carregaEleitos()`  [INFERRED]
  plataforma/ilhas/Resumos.tsx → plataforma/lib/dados.ts
- `plataforma/CLAUDE.md (guia do repositorio)` --references--> `Guia rapido: API de resultados do TSE`  [EXTRACTED]
  plataforma/CLAUDE.md → contexto inicial/API_TSE_GUIA.md

## Import Cycles
- 3-file cycle: `plataforma/ilhas/Social.tsx -> plataforma/ilhas/pecas.tsx -> plataforma/ilhas/ponte.tsx -> plataforma/ilhas/Social.tsx`
- 3-file cycle: `plataforma/ilhas/Resumos.tsx -> plataforma/ilhas/pecas.tsx -> plataforma/ilhas/ponte.tsx -> plataforma/ilhas/Resumos.tsx`
- 3-file cycle: `plataforma/ilhas/Calor.tsx -> plataforma/ilhas/ponte.tsx -> plataforma/ilhas/Resumos.tsx -> plataforma/ilhas/Calor.tsx`
- 4-file cycle: `plataforma/ilhas/MapaConjuntura.tsx -> plataforma/ilhas/pecas.tsx -> plataforma/ilhas/ponte.tsx -> plataforma/ilhas/Social.tsx -> plataforma/ilhas/MapaConjuntura.tsx`
- 4-file cycle: `plataforma/ilhas/Calor.tsx -> plataforma/ilhas/pecas.tsx -> plataforma/ilhas/ponte.tsx -> plataforma/ilhas/Resumos.tsx -> plataforma/ilhas/Calor.tsx`

## Hyperedges (group relationships)
- **Cinco Missoes do Guia dos 100 Dias** — graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_missao_1, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_missao_2, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_missao_3, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_missao_4, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_missao_5 [EXTRACTED 1.00]
- **Pipeline de planejamento estrategico (bandeiras, legado, preditores, metas)** — graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_bandeiras, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_legado, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_preditores_gip, graphify_out_converted_regimento_externo_2_0_guia_dos_100_dias_8e027305_metas_smart [EXTRACTED 1.00]
- **Fluxo legado + ponte + ilhas React** — plataforma_claude_app_page, plataforma_claude_ilhas_ponte, plataforma_claude_estado_legado_D, plataforma_scripts_extrair_legado [EXTRACTED 1.00]
- **Five missions of the 100-day guide** — contexto_inicial_guia_dos_100_dias_plataforma_dos_mandatos_copy_missao_1, contexto_inicial_guia_dos_100_dias_plataforma_dos_mandatos_copy_missao_2, contexto_inicial_guia_dos_100_dias_plataforma_dos_mandatos_copy_missao_3, contexto_inicial_guia_dos_100_dias_plataforma_dos_mandatos_copy_missao_4, contexto_inicial_guia_dos_100_dias_plataforma_dos_mandatos_copy_missao_5 [EXTRACTED 1.00]
- **Seven missions of the first 100 days** — contexto_inicial_index_6_missao_chegada, contexto_inicial_index_6_missao_equipe, contexto_inicial_index_6_missao_planejamento, contexto_inicial_index_6_missao_comissoes, contexto_inicial_index_6_missao_capital_politico, contexto_inicial_index_6_missao_projeto_politico, contexto_inicial_index_6_missao_imersao [EXTRACTED 1.00]
- **Fontes de dados do painel** — contexto_inicial_painel_supabase_mandatos, contexto_inicial_painel_exportacao_json, contexto_inicial_painel_demo [EXTRACTED 1.00]
- **Fontes de dados do painel (nuvem, arquivos JSON, navegador)** — plataforma_public_painel_fonte, plataforma_public_painel_supabase_mandatos, plataforma_public_painel_base [INFERRED 0.85]

## Communities (37 total, 8 thin omitted)

### Community 0 - "Equipe e Ficha"
Cohesion: 0.06
Nodes (49): Cargo, cargos(), Chips(), DadoNo, Ficha(), ORDEM, Organograma(), Rotinas (+41 more)

### Community 1 - "Scripts de Dados Python"
Cohesion: 0.07
Nodes (20): lib/dados.ts (loaders com cache), baixa(), cargo_uf(), coleta_2024(), coleta_2026(), fnum(), json_tse(), main() (+12 more)

### Community 2 - "Regimento e Metodo PLL6"
Cohesion: 0.06
Nodes (42): Guia rapido: API de resultados do TSE, Codigo TSE diferente de codigo IBGE (cdi), coleta_municipal.py (coletor de votos municipais), Dados abertos TSE (CSV), API nao oficial resultados.tse.jus.br, PLL6 - Programacao e Metodo (Edicao 100 Dias), Convocatoria dos inscritos selecionados, Formacao dos Sherpas (mentores) (+34 more)

### Community 3 - "Nucleo Legado (nucleo.js)"
Cohesion: 0.07
Nodes (27): aviso(), codigo(), criarConta(), criarMandato(), dataPrazo(), dBR(), dBRc(), diaAtual() (+19 more)

### Community 4 - "Calor e Resumos"
Cohesion: 0.14
Nodes (34): Calor(), Cargo, CARGOS, NIVEIS, ANOS_MAPA, CalorV2(), CargoMapa, CARGOS_MAPA (+26 more)

### Community 5 - "Assentos e Hemiciclo"
Cohesion: 0.09
Nodes (31): Assentos(), cargoDe(), CASA_K, Ck(), COR_GEN, COR_MAND, COR_RACA, Faceta (+23 more)

### Community 6 - "Guia Legado (guia.js)"
Cohesion: 0.07
Nodes (9): abrir(), alternarModo(), bloco(), concluir(), ir(), montar(), reabrir(), render() (+1 more)

### Community 7 - "App Legado (app.js)"
Cohesion: 0.12
Nodes (20): autoCasa(), colher(), config(), entrou(), formMandato(), iniciar(), lateral(), marcar() (+12 more)

### Community 8 - "Guia 100 Dias - Missoes"
Cohesion: 0.08
Nodes (26): AMBIENTES (dev/prod config), Guia dos 100 Dias - plataforma dos mandatos (single-file app), Biblioteca (BIBLIOTECA reference articles), BINGOS (checklist bingo cards), Caixa de ferramentas (FERRAMENTAS, editable templates), Canal de acolhimento, CARGOS_EQUIPE / GRUPOS_EQUIPE (team roles), Equipe e convites (invite code, team roles) (+18 more)

### Community 9 - "Tipos e Carga de Dados"
Cohesion: 0.11
Nodes (22): cache, carrega(), carregaHist(), carregaMapaBR(), carregaUFs(), Hist, Bloco, Casa (+14 more)

### Community 10 - "Cadastro Legado"
Cohesion: 0.12
Nodes (15): attr(), cargoObj(), carregar(), casaDe(), chipPartido(), cor(), enviar(), fmt() (+7 more)

### Community 11 - "Persona e Pleito"
Cohesion: 0.14
Nodes (19): Chip(), CARGOS, Cartao(), CASAS, FormPleito(), envia(), local(), PARTIDOS (+11 more)

### Community 12 - "Guia - Missoes e Progresso"
Cohesion: 0.11
Nodes (20): Guia dos 100 Dias (Legisla Brasil) single-file app, BIBLIOTECA (resource library), BINGOS and CAMPOS_MONIT (monitoring), CANAL_ACOLHIMENTO (support channel), CARGOS_EQUIPE / GRUPOS_EQUIPE (team roles), FERRAMENTAS (tools catalog), FORMULA_META / METAS_EXEMPLARES / OBJ_ESPECIFICOS (goal setting), Missao: Capital politico, articulacao e mobilizacao (+12 more)

### Community 13 - "Municipio e Formatacao"
Cohesion: 0.16
Nodes (18): Ator, buscaMeusVotos(), Camada, CAMADAS, Cargo, CLARO, grad(), Linha (+10 more)

### Community 14 - "Config TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 15 - "Novos Legado"
Cohesion: 0.19
Nodes (12): atualizar(), chips(), citadas(), escolherMun(), fmt(), limpa(), norm(), pinta() (+4 more)

### Community 16 - "Painel de Mandatos"
Cohesion: 0.15
Nodes (16): Bandeiras prioritárias (Missão 3), Demo (gerador de 24 mandatos fictícios), Tabela equipe_legisla (controle de acesso), Arquivos JSON exportados pelos mandatos (Baixar dados), Filtros (UF, cargo, partido) e ordenação, Fonte (carregamento de dados: nuvem, arquivos, demo), Fragilidades (mandato M vs liderança parlamentar P), Frentes de articulação (Missão 4) (+8 more)

### Community 17 - "Rotas API e Layout"
Cohesion: 0.14
Nodes (11): calcula(), CARGO, dynamic, emCurso, GET(), maxDuration, municipio(), PASTA (+3 more)

### Community 18 - "Agendas e Indicadores"
Cohesion: 0.15
Nodes (15): Agenda, AGENDA_DO_ODS, AGENDAS, cache, carrega(), carregaCatalogo(), carregaIndicador(), carregaPerfil() (+7 more)

### Community 19 - "Ponte Guia-Calor"
Cohesion: 0.24
Nodes (13): CalorSwitch(), aviso(), dadosGuia(), ILHAS, L(), Legado, mandato(), marca() (+5 more)

### Community 20 - "Social"
Cohesion: 0.21
Nodes (14): agendaDe(), Camada, NIVEIS, novoId(), plural(), porNome(), ROT_NIVEL, SocialIlha() (+6 more)

### Community 21 - "Mapa de Votos"
Cohesion: 0.20
Nodes (10): AZUL, buscaVotos(), CLARO, Linha, MapaVotos(), mix(), Modo, VINHO (+2 more)

### Community 22 - "Eleitorado"
Cohesion: 0.25
Nodes (10): EleitoradoIlha(), EleitoradoResumo(), GRUPOS, novoId(), plural(), porNome(), TIPOS, Eleitorado (+2 more)

### Community 23 - "Mapa de Conjuntura"
Cohesion: 0.22
Nodes (9): bbox(), Caixa, Celula, MapaConjuntura(), Marcas, Municipios, Vista, COR_REL (+1 more)

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
- **58 isolated node(s):** `@types/node`, `@types/react`, `@types/react-dom`, `typescript`, `Graphify usage rules` (+53 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 271 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Persona e Pleito` to `Equipe e Ficha`, `Calor e Resumos`, `Assentos e Hemiciclo`, `Municipio e Formatacao`, `Ponte Guia-Calor`, `Social`, `Mapa de Votos`, `Eleitorado`, `Mapa de Conjuntura`, `Pagina Guia e Ilhas`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Assentos()` (e.g. with `vazio()` and `carregaEleitos()`) actually correct?**
  _`Assentos()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/node`, `@types/react`, `@types/react-dom` to the rest of the system?**
  _58 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Equipe e Ficha` be split into smaller, more focused modules?**
  _Cohesion score 0.05587808417997097 - nodes in this community are weakly interconnected._
- **Why does `next` connect `Rotas API e Layout` to `Equipe e Ficha`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Should `Scripts de Dados Python` be split into smaller, more focused modules?**
  _Cohesion score 0.0746606334841629 - nodes in this community are weakly interconnected._
- **Why does `API nao oficial resultados.tse.jus.br` connect `Regimento e Metodo PLL6` to `Rotas API e Layout`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._