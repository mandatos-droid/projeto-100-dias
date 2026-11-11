# Reestruturação da Missão 1 Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/m1-reestruturacao/design.md`
**Spec**: `.specs/features/m1-reestruturacao/spec.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines and spec - confirm before Execute. Guidelines found: `plataforma/CLAUDE.md` (comandos, convenções, AD-004), `plataforma/AGENTS.md` (aviso sobre o Next.js), `plataforma/playwright.config.ts`. Sem limiar de cobertura configurado: valem os padrões fortes.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Regra pura em `lib/` | unit | Todos os ramos; 1:1 com os critérios da spec; todo caso de borda listado | `tests/*.test.ts` | `npm test` |
| Ganchos do legado (`public/legacy/m1.js`, `novos.js`, `resumo.js`) | unit (VM) | Textos, ordem e caixas dos critérios da spec; Missões 2 a 5 inalteradas | `tests/legado-m1.test.ts` | `npm test` |
| Ilha React (`ilhas/*.tsx`) | e2e ao fim da fase + `tsc` por tarefa | Caminho feliz, bordas e erros dos critérios da fase | `e2e/m1-*.spec.ts` | `npx playwright test e2e/m1-` |
| Tipos e SQL | none | Só o gate de tipos | - | `npx tsc --noEmit` |

## Gate Check Commands

> Generated from `package.json` - confirm before Execute. Os e2e rodam sobre `npm run dev`; em worktree isolado use o `playwright.isolado.config.ts` descrito em `plataforma/CLAUDE.md`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tarefas com teste de unidade | `npm test` |
| Full | Tarefas com e2e | `npx tsc --noEmit && npm test && npx playwright test e2e/m1-` |
| Build | Fim de fase ou tarefa só de tipos/ilha | `npx tsc --noEmit && npm test` (o `npm run build` oscila com `SecurityFatalError`; só vale se passar) |

Skills por tarefa: `tlc-spec-driven` conduz todas (protocolo de Execute). As demais estão no campo Tools de cada tarefa. Nenhum MCP é usado: Supabase não muda (sem migration) e Vercel/deploy está fora do escopo. Ao fim da Phase 7 vale rodar `/code-review` no diff inteiro. `graphify update .` roda só no T43. Commits seguem Conventional Commits e terminam com a linha `Co-Authored-By` pedida pelo projeto. Nada de `git push` nem deploy sem go-ahead.

---

## Execution Plan

Fases em ordem; tarefas em ordem dentro de cada fase.

### Phase 1: Regras puras em `lib/`

Todas independentes de tela; cada uma com teste de unidade.

```
T1 → T2 → T3 → T4 → T5 → T6 → T7
```

### Phase 2: Página única, textos e caixas (`m1.js`)

Tudo no arquivo de ganchos à mão (AD-003), em tarefas pequenas.

```
T8 → T9 → T10 → T11 → T12 → T13 → T14
```

### Phase 3: Persona

Sem mapa, ranking em lista, 5 cartões.

```
T15 → T16 → T17 → T18
```

### Phase 4: Conjuntura, relações com os parlamentares

5 categorias, carrossel de classificados, legislatura sem mapa do Brasil.

```
T19 → T20 → T21 → T22 → T23 → T24 → T25
```

### Phase 5: Conjuntura, partido

Sem mapa, cartões de município, reação a 2 dados.

```
T26 → T27 → T28 → T29 → T30
```

### Phase 6: Oportunidades e ameaças

3 colunas sem mapa, cartões por agenda, 3 agendas prioritárias.

```
T31 → T32 → T33 → T34 → T35 → T36 → T37
```

### Phase 7: Fechamento, resumo e verificação

HTML do Mapa Político, resumo, varredura e decisão registrada.

```
T38 → T39 → T40 → T41 → T42 → T43
```

---

## Task Breakdown

<!-- Phase 1: Regras puras em `lib/` -->

### T1: Tipos das categorias, reações e agendas prioritárias

**What**: Estender `Status` com `aliado_concorrente` e `oponente_concorrente`, criar o tipo `Reacao` e `Conj2.reacoes?`.
**Where**: `plataforma/lib/types.ts`
**Depends on**: None
**Reuses**: `lib/types.ts:37-38,85-93`
**Requirement**: LEG-03, PAR-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `Status` aceita as 5 chaves mais `neutro`
- [x] `Conj2.reacoes?: Reacao[]` existe e `vazio()` de `Conjuntura.tsx` continua válido
- [x] `npx tsc --noEmit` passa sem novos erros

**Tests**: none
**Gate**: build
**Commit**: `feat(m1): tipos das 5 categorias de relação e das reações`


**Status**: ✅ Done

---

### T2: Categorias de relação como função pura

**What**: Criar `CATEGORIAS`, `rotulo`, `contagem` e `resumoTexto`.
**Where**: `plataforma/lib/relacoes.ts`
**Depends on**: T1
**Reuses**: `ilhas/pecas.tsx:94-103` (rótulos de hoje)
**Requirement**: LEG-03, LEG-11, LEG-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Ordem e rótulos exatos: Aliado, Aliado, mas concorrente, Oponente, Oponente e concorrente, Indefinida
- [x] `concorrente` mostra "Oponente" e `potencial` mostra "Indefinida" (LEG-11)
- [x] `resumoTexto` devolve "Você tem 20 Aliados; 5 Aliados, mas concorrentes" só com categorias de contagem ≥ 1 e string vazia sem classificação
- [x] Teste novo `tests/relacoes.test.ts` cobre os 3 itens e passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m1): categorias de relação e resumo em texto`


**Status**: ✅ Done

---

### T3: Registro de eleitorado como função pura

**What**: Criar `COLUNAS`, `GRUPOS`, `adiciona` e `remove`.
**Where**: `plataforma/lib/eleitorado.ts`
**Depends on**: T2
**Reuses**: `ilhas/Eleitorado.tsx:14-19,73-83`
**Requirement**: ELE-04, ELE-05, ELE-07, ELE-08, ELE-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `adiciona` apara o texto, grava `muns: []` e devolve `erro: 'vazio'` para texto em branco
- [x] Repetido (sem acento, sem maiúscula, mesmo tipo) devolve `erro: 'repetido'`; o mesmo texto em outro tipo entra
- [x] `GRUPOS` tem as 16 tags na ordem da tela de hoje
- [x] Teste novo `tests/eleitorado.test.ts` passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m1): regras puras do registro de eleitorado`


**Status**: ✅ Done

---

### T4: Cinco municípios mais votados

**What**: Criar `cincoMais` a partir de `{cdi: [votos, válidos]}` e do mapa de nomes.
**Where**: `plataforma/lib/maisVotados.ts`
**Depends on**: T3
**Reuses**: formato de `MapaVotos.tsx` (`mun: {cdi: [v, vv]}`)
**Requirement**: PER-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Devolve no máximo 5, em ordem decrescente de votos, desempate por nome
- [x] `pct` = votos / válidos × 100; município com válidos 0 fica fora
- [x] Teste novo `tests/maisVotados.test.ts` cobre 7 municípios, empate e entrada vazia

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m1): lógica dos 5 municípios mais votados`


**Status**: ✅ Done

---

### T5: Indicadores sociais por agenda

**What**: Criar `linhasDaAgenda`, `filtraFaixa` e `emSlides`.
**Where**: `plataforma/lib/indicadoresSociais.ts`
**Depends on**: T4
**Reuses**: `lib/agendas.ts:17-71` (AGENDAS, faixaDe, opcoesIndicador)
**Requirement**: SOC-03, SOC-04, SOC-05, SOC-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `linhasDaAgenda` usa `dados.uf[UF]`, inclui notas de ODS e indicadores da agenda (ods e extras) e omite indicador sem dado
- [x] `filtraFaixa` respeita 39,9 → Muito baixo, 40 → Baixo, 59,9 → Médio, 60 → Alto, 80 → Muito alto
- [x] `emSlides` divide em grupos de 4 e o último grupo pode ser menor
- [x] Teste novo `tests/indicadoresSociais.test.ts` passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m1): cartões de indicador por agenda e faixa`


**Status**: ✅ Done

---

### T6: Escolha das 3 agendas prioritárias

**What**: Criar `alterna` e `faltam`.
**Where**: `plataforma/lib/agendasPrio.ts`
**Depends on**: T5
**Reuses**: `lib/agendas.ts` (ids das 13 agendas)
**Requirement**: AGE-02, AGE-03, AGE-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] 4ª marcação não entra e devolve `erro: 'cheio'`
- [x] Desmarcar remove; id fora das 13 agendas é ignorado
- [x] `faltam` devolve 3 − tamanho da lista
- [x] Teste novo `tests/agendasPrio.test.ts` passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m1): regra das 3 agendas prioritárias`


**Status**: ✅ Done

---

### T7: Dados selecionáveis do partido e frase

**What**: Criar `dadosSelecionaveis`, `frase` e `defineReacao`.
**Where**: `plataforma/lib/dadosPartido.ts`
**Depends on**: T6
**Reuses**: `ilhas/Conjuntura.tsx:19-20,44-52` (soma, POSICOES, sugere)
**Requirement**: PAR-10, PAR-11, PAR-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `dadosSelecionaveis` lista parlamentares, vereadores, prefeituras, filiados, posição nos Executivos e, por município, vereadores do partido, filiados e % de votos, cada um com valor formatado
- [x] `frase` devolve "Considerando {nome}: {valor}, o mandato deve"
- [x] `defineReacao` grava no máximo 2 linhas e ignora índice 2
- [x] Teste novo `tests/dadosPartido.test.ts` passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m1): dados escolhíveis do partido e frase de reação`


**Status**: ✅ Done

---

<!-- Phase 2: Página única, textos e caixas (`m1.js`) -->

### T8: Página única por etapa

**What**: Forçar o modo `tudo` na Missão 1, esconder o botão de alternar modo e ignorar o número do passo da URL.
**Where**: `plataforma/public/legacy/m1.js`
**Depends on**: None
**Reuses**: `public/legacy/guia.js:3,42-70`; molde `tests/legado-m1.test.ts:1-50`
**Requirement**: PAG-01, PAG-03, PAG-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `m1.persona`, `m1.conjuntura`, `m1.oportunidades` e `m1.frag` renderizam todos os passos de uma vez
- [x] Não há botão "Anterior"/"Avançar" entre perguntas nem "Ver tudo de uma vez" na Missão 1; as Missões 2 a 5 não mudam
- [x] `#/m/1/m1.conjuntura/1` abre a página única da etapa
- [x] Casos novos em `tests/legado-m1.test.ts` passam

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m1): cada etapa abre numa página só`

**Status**: ✅ Done

---

### T9: Persona: textos e caixas novas

**What**: Trocar a caixa de conquistas por 3 (`m1.q3c1..c3`), mostrar a "Resposta anterior" de `m1.q3`, manter `m1.q3b` com "Não sei / não desejo registrar" e pôr o texto de 1.2 antes da caixa de análise.
**Where**: `plataforma/public/legacy/m1.js`
**Depends on**: T8
**Reuses**: `public/legacy/m1.js:17-27` (caixas da Persona)
**Requirement**: PER-06, PER-07, PER-08, PER-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] 3 caixas com os rótulos "Conquista/Grande Entrega almejada 1/2/3" e o texto "Registre até 3:"
- [x] Com `D.campos['m1.q3']` preenchido aparece "Resposta anterior" e o valor segue gravado
- [x] O select de cargo traz a opção "Não sei / não desejo registrar"
- [x] O texto "Seu papel agora é registrar a história política…" fica logo abaixo dos dados de 1.2
- [x] Casos novos em `tests/legado-m1.test.ts` passam

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m1): persona com 3 conquistas e cargo opcional`

**Status**: ✅ Done

---

### T10: Conjuntura: textos, sem "pontes" e texto final

**What**: Ajustar os textos de 2.1 e 2.2, remover a caixa `m1.q4b`, pôr o texto "Registre quais são os principais atores…" com a caixa `m1.q6` no fim da página e tirar a pergunta e a ilha de 2.3.
**Where**: `plataforma/public/legacy/m1.js`
**Depends on**: T9
**Reuses**: `public/legacy/m1.js:29-47`
**Requirement**: LEG-04, LEG-05, PAR-01, PAR-09, PAR-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] 2.1 mostra o texto "Analise qual é o tipo de relação…", as 2 orientações e as 5 definições
- [x] `m1.q4b` não é renderizada e o valor salvo permanece
- [x] 2.2 mostra o contexto, e depois dos dados os dois textos de PAR-09
- [x] O fim da página traz o texto de PAR-13 e a caixa `m1.q6`; a pergunta "Qual é a conjuntura política do seu estado ou município de origem?" não aparece
- [x] Casos novos em `tests/legado-m1.test.ts` passam

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m1): textos da conjuntura sem pontes nem mapa municipal`

**Status**: ✅ Done

---

### T11: Oportunidades: textos e passo das agendas

**What**: Escrever os textos de 3.1, 3.2 e 3.3 e criar a pergunta `m1.q9` (agendas prioritárias).
**Where**: `plataforma/public/legacy/m1.js`
**Depends on**: T10
**Reuses**: `public/legacy/m1.js:38-47`
**Requirement**: SOC-01, SOC-02, SOC-07, AGE-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] 3.1 e 3.2 mostram os textos exatos da spec; 3.2 traz a caixa `m1.q8a` depois dos dados
- [x] 3.3 mostra o texto "Considerando os dados acima e as promessas de campanha, selecione quais são as 3 Agendas…"
- [x] Casos novos em `tests/legado-m1.test.ts` passam

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m1): textos das oportunidades e pergunta das agendas prioritárias`

**Status**: ✅ Done

---

### T12: Fragilidades: textos

**What**: Ajustar o título, a instrução M/P, "Sistemas" no plural e o fechamento da etapa; garantir "liderança parlamentar" nos textos novos.
**Where**: `plataforma/public/legacy/m1.js`
**Depends on**: T11
**Reuses**: `public/legacy/m1.js:84-108`
**Requirement**: FRA-01, FRA-02, FRA-03, GER-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O título e a instrução "Coloque um M … e um P …" batem com a spec
- [x] O item da lista é "Uso dos Sistemas da Casa Legislativa"
- [x] Nenhum texto novo de `m1.js` usa "o parlamentar" ou "a parlamentar" para a pessoa do mandato (teste de varredura no arquivo)
- [x] Casos novos em `tests/legado-m1.test.ts` passam

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m1): textos de fragilidades e linguagem de liderança parlamentar`

**Status**: ✅ Done

---

### T13: Resumo e contagem de andamento

**What**: Acrescentar as chaves novas ao Resumo e à contagem "em andamento".
**Where**: `plataforma/public/legacy/m1.js`
**Depends on**: T12
**Reuses**: `public/legacy/m1.js:134-150`; `nucleo.js` `temConteudo` (só lido, não editado)
**Requirement**: GER-02, GER-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O Resumo lista `m1.q3c1..c3`, `m1.q3b`, `m1.q6` e `m1.q8a`
- [x] Responder só em `D.eleitorado`, `D.agendasPrio` ou `D.conj2.reacoes` marca a etapa como "em andamento"
- [x] Casos novos em `tests/legado-m1.test.ts` passam

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m1): resumo e andamento com os campos novos`

**Status**: ✅ Done

---

### T14: e2e da página única

**What**: Teste de tela da página única, da faixa e dos endereços antigos.
**Where**: `plataforma/e2e/m1-pagina-unica.spec.ts`
**Depends on**: T13
**Reuses**: `e2e/m1-etapas.spec.ts`, `e2e/guia-real.ts`
**Requirement**: PAG-01, PAG-02, PAG-03, PAG-04

**Tools**:

- MCP: NONE
- Skill: `run` (abrir o Guia de verdade e ver a tela antes de fechar o e2e)

**Done when**:

- [x] Cada uma das 4 etapas abre numa página só e a faixa marca a atual
- [x] `#/m/1/m1.oportunidades/1` abre a página única da etapa
- [x] Passa: `npx playwright test e2e/m1-pagina-unica e2e/m1-etapas`

**Tests**: e2e
**Gate**: full
**Commit**: `test(m1): e2e da página única por etapa`

**Status**: ✅ Done

---

<!-- Phase 3: Persona -->

### T15: Cartões dos 5 municípios mais votados

**What**: Criar `MaisVotados` e o hook `useVotosMun` (extraído da coleta de `MapaVotos`).
**Where**: `plataforma/ilhas/MaisVotados.tsx`
**Depends on**: None
**Builds on (earlier phases)**: T4
**Reuses**: `ilhas/MapaVotos.tsx` (consulta a `/api/votos-mun`), `ilhas/pecas.tsx` (`useCarga`)
**Requirement**: PER-03, PER-04, PER-05, PAR-08

**Tools**:

- MCP: NONE
- Skill: `frontend-design` (usar o visual que o Guia já tem, sem criar identidade nova), depois `web-design-guidelines`

**Done when**:

- [x] Mostra 5 cartões com posição, município, votos e % dos válidos
- [x] Não renderiza para liderança sem candidatura 2026
- [x] Com falha da consulta mostra "Não foi possível carregar os municípios mais votados agora."
- [x] `npx tsc --noEmit` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(m1): cartões dos municípios mais votados`

**Status**: ✅ Done

---

### T16: Persona sem mapa e com ranking em lista

**What**: Tirar `MapaVotos`, trocar as barras do ranking por lista com partido ao lado e montar `MaisVotados` abaixo.
**Where**: `plataforma/ilhas/Persona.tsx`
**Depends on**: T15
**Reuses**: `ilhas/Persona.tsx:278-293`; `Chip` de `pecas.tsx`
**Requirement**: PER-01, PER-02, PER-04

**Tools**:

- MCP: NONE
- Skill: `web-design-guidelines` (revisar a tela depois da edição)

**Done when**:

- [x] Não há mapa "Onde estão os votos" na pergunta 1.2
- [x] O ranking mostra posição, nome e `Chip` do partido, sem barras
- [x] Os pleitos anteriores a 2026 não mostram cartões de município
- [x] `npx tsc --noEmit` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(m1): persona sem mapa de votos`

**Status**: ✅ Done

---

### T17: Remover o mapa de votos sem uso

**What**: Apagar `MapaVotos.tsx` depois de conferir que nenhum import resta.
**Where**: `plataforma/ilhas/MapaVotos.tsx`
**Depends on**: T16
**Reuses**: busca por `MapaVotos` no repositório
**Requirement**: PER-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Nenhuma referência a `MapaVotos` resta fora do histórico do git
- [x] `npx tsc --noEmit` e `npm test` passam

**Tests**: none
**Gate**: build
**Commit**: `refactor(m1): remove o mapa de votos da persona`

**Status**: ✅ Done

---

### T18: e2e da Persona

**What**: Atualizar o e2e da Persona para a lista, os 5 cartões, as 3 conquistas e o cargo opcional.
**Where**: `plataforma/e2e/m1-persona.spec.ts`
**Depends on**: T17
**Reuses**: `e2e/m1-persona.spec.ts`
**Requirement**: PER-01, PER-02, PER-03, PER-05, PER-07, PER-08, PER-09

**Tools**:

- MCP: NONE
- Skill: `run` (abrir o Guia de verdade e ver a tela antes de fechar o e2e)

**Done when**:

- [x] Sem mapa; ranking com partido; 5 cartões com a consulta interceptada
- [x] Com a consulta falhando aparece a mensagem de PER-05
- [x] Passa: `npx playwright test e2e/m1-persona`

**Tests**: e2e
**Gate**: full
**Commit**: `test(m1): e2e da persona reestruturada`

**Status**: ✅ Done

---

<!-- Phase 4: Conjuntura, relações com os parlamentares -->

### T19: Peças de relação com 5 categorias

**What**: Fazer `StatusBotoes`, `Marca`, `AJUDA_REL` e `ROT_REL*` lerem `lib/relacoes.ts`.
**Where**: `plataforma/ilhas/pecas.tsx`
**Depends on**: None
**Builds on (earlier phases)**: T2
**Reuses**: `ilhas/pecas.tsx:85-115`
**Requirement**: LEG-03, LEG-04, LEG-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `StatusBotoes` mostra as 5 categorias na ordem da Alana
- [x] `Marca` tem forma própria para `aliado_concorrente` e `oponente_concorrente`
- [x] O balão de ajuda traz as 5 definições
- [x] `npx tsc --noEmit` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(m1): peças de relação com as 5 categorias`

**Status**: ✅ Done

---

### T20: Carrossel genérico

**What**: Criar `Slides` com Anterior/Próximo e "Slide X de Y".
**Where**: `plataforma/ilhas/Slides.tsx`
**Depends on**: T19
**Reuses**: `lib/indicadoresSociais.ts#emSlides`
**Requirement**: SOC-06, LEG-08

**Tools**:

- MCP: NONE
- Skill: `frontend-design`, depois `web-design-guidelines` (carrossel, filtros e botões precisam de teclado e leitor de tela)

**Done when**:

- [x] Mostra `tam` itens por slide e desabilita as pontas
- [x] Anterior e Próximo são botões com nome acessível e o indicador "Slide X de Y" fica em `aria-live`
- [x] `npx tsc --noEmit` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(m1): componente de carrossel`

**Status**: ✅ Done

---

### T21: Carrossel dos classificados

**What**: Criar `Classificados` com filtros por categoria e cartões reclassificáveis.
**Where**: `plataforma/ilhas/Classificados.tsx`
**Depends on**: T20
**Reuses**: `ilhas/pecas.tsx` (`Foto`, `Chip`, `StatusBotoes`)
**Requirement**: LEG-08, LEG-09, LEG-10

**Tools**:

- MCP: NONE
- Skill: `frontend-design`, depois `web-design-guidelines` (carrossel, filtros e botões precisam de teclado e leitor de tela)

**Done when**:

- [x] Um cartão por parlamentar classificado, com foto, nome, partido, Casa/UF e categoria
- [x] Filtro "Todas" + 5 categorias com contagem; escolher uma mostra só os cartões dela
- [x] Reclassificar ou remover atualiza cartão e contagens na hora
- [x] `npx tsc --noEmit` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(m1): carrossel dos parlamentares classificados`

**Status**: ✅ Done

---

### T22: Legislatura sem mapa do Brasil

**What**: Trocar o cartograma por seletor de escopo, renomear a aba da Câmara, subir os KPIs e perfis, tirar a classificação da linha da própria liderança e montar `Classificados`.
**Where**: `plataforma/ilhas/Assentos.tsx`
**Depends on**: T21
**Reuses**: `ilhas/Assentos.tsx` (cartograma, `RELACAO`, `POR_PAGINA = 15`)
**Requirement**: LEG-01, LEG-02, LEG-06, LEG-07

**Tools**:

- MCP: NONE
- Skill: `web-design-guidelines` (revisar a tela depois da edição)

**Done when**:

- [x] Não há cartograma de UFs; o `<select>` de escopo grava `D.escopoSel`
- [x] As abas são "Câmara Legislativa" (DF) ou "Assembleia Legislativa", "Câmara dos Deputados" e "Senado"
- [x] Grandes números e perfis ficam logo abaixo dos filtros
- [x] A linha da própria liderança tem o selo "Esta liderança" e nenhum botão de classificação
- [x] A paginação de 15 linhas continua
- [x] `npx tsc --noEmit` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(m1): legislatura sem mapa e com classificados em carrossel`

**Status**: ✅ Done

---

### T23: Resumo em React dos eleitos

**What**: Fazer `AssentosResumo` mostrar o resumo de LEG-12 e as 5 categorias.
**Where**: `plataforma/ilhas/Resumos.tsx`
**Depends on**: T22
**Reuses**: `ilhas/Resumos.tsx:150-189`
**Requirement**: LEG-12, LEG-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Mostra "Você tem 20 Aliados; …" no formato da spec
- [x] Os KPIs de aliados/opositores/potenciais viram as 5 categorias
- [x] `npx tsc --noEmit` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(m1): resumo dos eleitos com as 5 categorias`

**Status**: ✅ Done

---

### T24: Resumo do preenchimento em texto

**What**: Trocar as listas de aliados/opositores/potenciais de `ResumoIlhas.html` pelo resumo de LEG-12 e as 5 categorias.
**Where**: `plataforma/public/legacy/novos.js`
**Depends on**: T23
**Reuses**: `public/legacy/novos.js:183-210`
**Requirement**: LEG-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O Resumo mostra o texto de contagem e, abaixo, as listas por categoria
- [x] Sem classificação mostra "Nada classificado ainda."
- [x] Caso novo em `tests/legado-m1.test.ts` passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m1): resumo do preenchimento com as 5 categorias`

**Status**: ✅ Done

---

### T25: e2e da Conjuntura: relações

**What**: Atualizar o e2e para as 5 categorias, o carrossel, as abas e o resumo.
**Where**: `plataforma/e2e/m1-conjuntura.spec.ts`
**Depends on**: T24
**Reuses**: `e2e/m1-conjuntura.spec.ts`
**Requirement**: LEG-01, LEG-02, LEG-03, LEG-07, LEG-08, LEG-09, LEG-10, LEG-12

**Tools**:

- MCP: NONE
- Skill: `run` (abrir o Guia de verdade e ver a tela antes de fechar o e2e)

**Done when**:

- [x] Sem cartograma; abas com os nomes novos; 5 botões de categoria
- [x] Classificar 3 parlamentares, filtrar o carrossel e ver o resumo na aba Resumo
- [x] Passa: `npx playwright test e2e/m1-conjuntura`

**Tests**: e2e
**Gate**: full
**Commit**: `test(m1): e2e das relações com 5 categorias`

**Status**: ✅ Done

---

<!-- Phase 5: Conjuntura, partido -->

### T26: Conjuntura sem mapa e com placar em cartões

**What**: Remover a seção do mapa e do painel de marcações; pôr borda nos cartões do placar.
**Where**: `plataforma/ilhas/Conjuntura.tsx`
**Depends on**: None
**Builds on (earlier phases)**: T25
**Reuses**: `ilhas/Conjuntura.tsx:419-565`
**Requirement**: PAR-02, PAR-03, PAR-14

**Tools**:

- MCP: NONE
- Skill: `web-design-guidelines` (revisar a tela depois da edição)

**Done when**:

- [x] Não há mapa coroplético, camadas nem painel lateral na pergunta 2.2
- [x] Os cartões do Placar do partido têm borda; as seções Executivo e Filiados continuam
- [x] `D.conj2.muns`, `relacao`, `relacaoPq`, `desafios` e `oportunidades` seguem gravados
- [x] `npx tsc --noEmit` passa; o e2e `m1-conjuntura` segue verde

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m1): conjuntura do partido sem mapa`

**Status**: ✅ Done

---

### T27: Cartões de município do partido

**What**: Criar `CartoesMunicipio` com os blocos Placar, Força e Executivo.
**Where**: `plataforma/ilhas/CartoesMunicipio.tsx`
**Depends on**: T26
**Reuses**: `ilhas/CasaMunicipal.tsx`; `ilhas/Conjuntura.tsx:44-52` (POSICOES, sugere)
**Requirement**: PAR-04, PAR-05, PAR-06, PAR-07, PAR-08

**Tools**:

- MCP: NONE
- Skill: `frontend-design` (usar o visual que o Guia já tem, sem criar identidade nova), depois `web-design-guidelines`

**Done when**:

- [x] Cada cartão mostra vereadores do município, vereadores do partido, foto e nome do prefeito, posição do partido, e filiados do partido
- [x] O bloco Força mostra a % de votos do partido no município e no estado
- [x] O bloco Executivo oferece as 4 posições e grava em `D.conj2`
- [x] Sem votação 2026 por município mostra só o município de domicílio ou a mensagem de PAR-08
- [x] `npx tsc --noEmit` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(m1): cartões de município do partido`

**Status**: ✅ Done

---

### T28: Reações a 2 dados

**What**: Criar `Reacoes` com as 2 linhas "Considerando [dado] o mandato deve…".
**Where**: `plataforma/ilhas/Reacoes.tsx`
**Depends on**: T27
**Reuses**: `lib/dadosPartido.ts`
**Requirement**: PAR-10, PAR-11, PAR-12

**Tools**:

- MCP: NONE
- Skill: `frontend-design` (usar o visual que o Guia já tem, sem criar identidade nova), depois `web-design-guidelines`

**Done when**:

- [x] O seletor lista os dados de `dadosSelecionaveis` com valor ao lado
- [x] Escolher o dado preenche a frase e abre a caixa de texto
- [x] Grava em `D.conj2.reacoes` e não oferece 3ª linha
- [x] `npx tsc --noEmit` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(m1): reação do mandato a 2 dados do partido`

**Status**: ✅ Done

---

### T29: Montar cartões e reações na Conjuntura

**What**: Calcular `DadoPartido[]` com os números já carregados e montar `CartoesMunicipio` e `Reacoes` depois dos dados.
**Where**: `plataforma/ilhas/Conjuntura.tsx`
**Depends on**: T28
**Reuses**: `ilhas/Conjuntura.tsx:108-140`
**Requirement**: PAR-04, PAR-09, PAR-10

**Tools**:

- MCP: NONE
- Skill: `web-design-guidelines` (revisar a tela depois da edição)

**Done when**:

- [x] Os 5 cartões e as 2 linhas de reação aparecem depois dos dados da 2.2
- [x] Os dados do seletor batem com os números mostrados no Placar
- [x] `npx tsc --noEmit` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(m1): conjuntura monta cartões de município e reações`

**Status**: ✅ Done

---

### T30: e2e da Conjuntura: partido

**What**: Novo e2e: sem mapa, 5 cartões com os 3 blocos, 2 reações e texto final com `m1.q6`.
**Where**: `plataforma/e2e/m1-conjuntura-partido.spec.ts`
**Depends on**: T29
**Reuses**: `e2e/m1-conjuntura.spec.ts`
**Requirement**: PAR-01, PAR-02, PAR-03, PAR-04, PAR-05, PAR-09, PAR-11, PAR-12, PAR-13, PAR-14

**Tools**:

- MCP: NONE
- Skill: `run` (abrir o Guia de verdade e ver a tela antes de fechar o e2e)

**Done when**:

- [x] Sem mapa nem painel; 5 cartões com Placar, Força e Executivo
- [x] Escolher 2 dados completa as frases e grava; uma 3ª linha não existe
- [x] O texto final e a caixa `m1.q6` aparecem no fim da página
- [x] Passa: `npx playwright test e2e/m1-conjuntura-partido`

**Tests**: e2e
**Gate**: full
**Commit**: `test(m1): e2e do partido em cartões`

---

<!-- Phase 6: Oportunidades e ameaças -->

### T31: Eleitorado em 3 colunas

**What**: Reescrever `EleitoradoIlha` com 3 colunas, botão "+", formulário e tags; sem mapa nem município.
**Where**: `plataforma/ilhas/Eleitorado.tsx`
**Depends on**: None
**Builds on (earlier phases)**: T3
**Reuses**: `ilhas/Eleitorado.tsx:14-19,151-162`; `lib/eleitorado.ts`
**Requirement**: ELE-01, ELE-02, ELE-03, ELE-04, ELE-05, ELE-06, ELE-07, ELE-08, ELE-09, ELE-10

**Tools**:

- MCP: NONE
- Skill: `frontend-design` (usar o visual que o Guia já tem, sem criar identidade nova), depois `web-design-guidelines`

**Done when**:

- [x] 3 colunas na ordem da spec, cada uma com título, contagem e "+"
- [x] O "+" abre o formulário com rótulo, exemplo e botão "Adicionar" de cada tipo; as tags aparecem só nos dois tipos de grupo
- [x] Adicionar, tag, vazio, repetido e "×" seguem as regras de `lib/eleitorado.ts`
- [x] Itens antigos com `muns` aparecem sem município e `muns` segue gravado
- [x] Não há `MapaConjuntura`, busca nem seleção de município
- [x] `npx tsc --noEmit` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(m1): expectativas do eleitorado em 3 colunas sem mapa`

---

### T32: Resumo do eleitorado

**What**: Fazer `EleitoradoResumo` listar as 3 colunas sem município.
**Where**: `plataforma/ilhas/Eleitorado.tsx`
**Depends on**: T31
**Reuses**: `ilhas/Eleitorado.tsx:208-231`
**Requirement**: ELE-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O Resumo mostra as 3 colunas com os itens, sem nome de município e sem "estado inteiro"
- [x] `npx tsc --noEmit` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(m1): resumo do eleitorado sem município`

---

### T33: Cartões sociais por agenda

**What**: Criar `AgendasSociais` com seletor de faixa, mini tabela e slides de 4.
**Where**: `plataforma/ilhas/AgendasSociais.tsx`
**Depends on**: T32
**Reuses**: `lib/indicadoresSociais.ts`; `ilhas/Slides.tsx`; `lib/agendas.ts`
**Requirement**: SOC-02, SOC-03, SOC-04, SOC-05, SOC-06, SOC-08, SOC-09

**Tools**:

- MCP: NONE
- Skill: `frontend-design`, depois `web-design-guidelines` (carrossel, filtros e botões precisam de teclado e leitor de tela)

**Done when**:

- [x] 13 cartões em slides de 4, cada um com seletor "Todas/Muito baixo/…/Muito alto" e tabela indicador × ODS × nota da UF
- [x] Sem catálogo ou sem arquivo da UF mostra "Não foi possível carregar os indicadores do seu estado agora."
- [x] `D.social` não é lido nem alterado
- [x] `npx tsc --noEmit` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(m1): cartões de indicadores sociais por agenda`

---

### T34: Agendas prioritárias

**What**: Criar `Prioritarias` com 13 botões, contador e mensagem de limite.
**Where**: `plataforma/ilhas/Prioritarias.tsx`
**Depends on**: T33
**Reuses**: `lib/agendasPrio.ts`
**Requirement**: AGE-01, AGE-02, AGE-03, AGE-04

**Tools**:

- MCP: NONE
- Skill: `frontend-design`, depois `web-design-guidelines` (carrossel, filtros e botões precisam de teclado e leitor de tela)

**Done when**:

- [x] 13 botões `aria-pressed` com os rótulos de `AGENDAS` e o contador "faltam N"
- [x] A 4ª marcação não entra e mostra "Você já escolheu 3 agendas. Desmarque uma para trocar."
- [x] `npx tsc --noEmit` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(m1): escolha das 3 agendas prioritárias`

---

### T35: Registrar as ilhas novas e o campo

**What**: Registrar `agendas-sociais` e `prioritarias` em `ILHAS` e tipar `D.agendasPrio` em `Legado`.
**Where**: `plataforma/ilhas/ponte.tsx`
**Depends on**: T34
**Reuses**: `ilhas/ponte.tsx:48-70,104-132`
**Requirement**: SOC-03, AGE-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `window.Ilhas.ligar` monta `agendas-sociais` e `prioritarias`
- [x] `D.agendasPrio?: string[]` tipado
- [x] `npx tsc --noEmit` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(m1): registra as ilhas de agendas na ponte`

---

### T36: Ligar as ilhas de oportunidades no Guia

**What**: Em `m1.js`, 3.1 usa a ilha `eleitorado`, 3.2 a ilha `agendas-sociais` e 3.3 a `prioritarias`; a ilha `social` sai da Missão 1.
**Where**: `plataforma/public/legacy/m1.js`
**Depends on**: T35
**Reuses**: `public/legacy/m1.js`
**Requirement**: ELE-01, SOC-02, AGE-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] A página `m1.oportunidades` emite as 3 ilhas nessa ordem e não emite `social`
- [x] Caso novo em `tests/legado-m1.test.ts` passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m1): oportunidades usam as ilhas novas`

---

### T37: e2e das Oportunidades

**What**: Novo e2e: 3 colunas com "+", tags, repetido, remover, cartões em slides com filtro e 3 agendas.
**Where**: `plataforma/e2e/m1-oportunidades.spec.ts`
**Depends on**: T36
**Reuses**: `e2e/m1-etapas.spec.ts`
**Requirement**: ELE-01, ELE-02, ELE-03, ELE-04, ELE-05, ELE-06, ELE-07, ELE-08, ELE-09, SOC-05, SOC-06, AGE-02, AGE-03

**Tools**:

- MCP: NONE
- Skill: `run` (abrir o Guia de verdade e ver a tela antes de fechar o e2e)

**Done when**:

- [x] Sem mapa; 3 colunas; adicionar por texto e por tag; repetido barrado; remover
- [x] Slide 1 de 4 cartões, avançar e filtrar por "Baixo"
- [x] Marcar 3 agendas e barrar a 4ª
- [x] Passa: `npx playwright test e2e/m1-oportunidades`

**Tests**: e2e
**Gate**: full
**Commit**: `test(m1): e2e das oportunidades e ameaças`

---

<!-- Phase 7: Fechamento, resumo e verificação -->

### T38: HTML do Mapa Político com carrosséis

**What**: Criar `Baixar.mapaPolitico` que gera o HTML da missão com carrosséis e filtros funcionando por script inline.
**Where**: `plataforma/public/legacy/resumo.js`
**Depends on**: None
**Builds on (earlier phases)**: T37
**Reuses**: `public/legacy/resumo.js` (`Baixar.missao`)
**Requirement**: FEC-02, FEC-03, FEC-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O HTML traz as respostas da Missão 1 na ordem do Resumo, os cartões de relação com filtro e os cartões de agenda em slides
- [x] Perguntas sem resposta aparecem como "Não respondida"
- [x] Abrir o HTML num DOM isolado e clicar "Próximo" muda o slide, sem rede
- [x] Caso novo em `tests/legado-m1.test.ts` passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m1): html do mapa político com carrosséis`

---

### T39: Resumo do preenchimento: eleitorado, agendas e reações

**What**: Acrescentar a `ResumoIlhas.html` os casos de eleitorado em 3 colunas, agendas prioritárias e reações a 2 dados.
**Where**: `plataforma/public/legacy/novos.js`
**Depends on**: T38
**Reuses**: `public/legacy/novos.js:183-210`
**Requirement**: ELE-11, GER-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O Resumo lista as 3 colunas, as 3 agendas prioritárias e as 2 reações com a frase
- [x] Sem dado mostra "Nada registrado ainda."
- [x] Caso novo em `tests/legado-m1.test.ts` passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m1): resumo com eleitorado, agendas e reações`

---

### T40: Fechamento: Pronto, botão e compilado

**What**: No fim da etapa 4 mostrar "Pronto!", o botão "Gerar HTML do Mapa Político" e o compilado das respostas.
**Where**: `plataforma/public/legacy/m1.js`
**Depends on**: T39
**Reuses**: `public/legacy/m1.js:84-108`
**Requirement**: FEC-01, FEC-02, FEC-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O texto "Parabéns! Com base neste amplo estudo…" e o botão aparecem depois de `m1.frag`
- [ ] O botão chama `Baixar.mapaPolitico`
- [ ] O compilado usa o mesmo HTML do Resumo
- [ ] Caso novo em `tests/legado-m1.test.ts` passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m1): fechamento da missão com html do mapa político`

---

### T41: Varredura de rótulos antigos

**What**: Teste que falha se "Opositor", "Potencial relacionamento" ou "Câmara" solta aparecer nos rótulos de `ilhas/` e `m1.js`.
**Where**: `plataforma/tests/rotulos-m1.test.ts`
**Depends on**: T40
**Reuses**: `tests/legado-m1.test.ts`
**Requirement**: LEG-02, LEG-11, GER-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Falha se um rótulo antigo ressurgir
- [ ] `npm test` passa

**Tests**: unit
**Gate**: quick
**Commit**: `test(m1): varredura de rótulos antigos`

---

### T42: e2e do fechamento e do resumo

**What**: Novo e2e: botão de HTML, arquivo gerado, Resumo com tudo e andamento.
**Where**: `plataforma/e2e/m1-fechamento.spec.ts`
**Depends on**: T41
**Reuses**: `e2e/guia-real.ts`
**Requirement**: FEC-01, FEC-02, FEC-04, FEC-05, GER-02, GER-03

**Tools**:

- MCP: NONE
- Skill: `run` (abrir o Guia de verdade e ver a tela antes de fechar o e2e)

**Done when**:

- [ ] O botão baixa o HTML e o arquivo traz as respostas
- [ ] Respondendo só nos cartões a etapa vira "em andamento"
- [ ] Passa: `npx playwright test e2e/m1-fechamento`

**Tests**: e2e
**Gate**: full
**Commit**: `test(m1): e2e do fechamento da missão`

---

### T43: Registrar a decisão AD-014

**What**: Acrescentar AD-014 ao `.specs/STATE.md`: página única e municípios só em cartões dos 5 mais votados.
**Where**: `.specs/STATE.md`
**Depends on**: T42
**Reuses**: `.specs/STATE.md` (AD-001 a AD-013)
**Requirement**: PAG-01

**Tools**:

- MCP: NONE
- Skill: `graphify` (rodar `graphify update .` ao final)

**Done when**:

- [ ] AD-014 escrito com data e motivo
- [ ] Nenhum código muda nesta tarefa

**Tests**: none
**Gate**: build
**Commit**: `docs(m1): registra a decisão de página única e cartões`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7

Phase 1:  T1 → T2 → T3 → T4 → T5 → T6 → T7
Phase 2:  T8 → T9 → T10 → T11 → T12 → T13 → T14
Phase 3:  T15 → T16 → T17 → T18
Phase 4:  T19 → T20 → T21 → T22 → T23 → T24 → T25
Phase 5:  T26 → T27 → T28 → T29 → T30
Phase 6:  T31 → T32 → T33 → T34 → T35 → T36 → T37
Phase 7:  T38 → T39 → T40 → T41 → T42 → T43
```

Execução estritamente sequencial. Com 43 tarefas o skill oferece workers em lotes de ~7 tarefas (fases inteiras): Phase 1 e 2 (14 tarefas) em 2 lotes, e assim por diante; nunca divide uma fase.

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | None (início da fase) | ✅ Match |
| T2 | T1 | T1 | ✅ Match |
| T3 | T2 | T2 | ✅ Match |
| T4 | T3 | T3 | ✅ Match |
| T5 | T4 | T4 | ✅ Match |
| T6 | T5 | T5 | ✅ Match |
| T7 | T6 | T6 | ✅ Match |
| T8 | None | None (início da fase) | ✅ Match |
| T9 | T8 | T8 | ✅ Match |
| T10 | T9 | T9 | ✅ Match |
| T11 | T10 | T10 | ✅ Match |
| T12 | T11 | T11 | ✅ Match |
| T13 | T12 | T12 | ✅ Match |
| T14 | T13 | T13 | ✅ Match |
| T15 | None | None (início da fase) | ✅ Match |
| T16 | T15 | T15 | ✅ Match |
| T17 | T16 | T16 | ✅ Match |
| T18 | T17 | T17 | ✅ Match |
| T19 | None | None (início da fase) | ✅ Match |
| T20 | T19 | T19 | ✅ Match |
| T21 | T20 | T20 | ✅ Match |
| T22 | T21 | T21 | ✅ Match |
| T23 | T22 | T22 | ✅ Match |
| T24 | T23 | T23 | ✅ Match |
| T25 | T24 | T24 | ✅ Match |
| T26 | None | None (início da fase) | ✅ Match |
| T27 | T26 | T26 | ✅ Match |
| T28 | T27 | T27 | ✅ Match |
| T29 | T28 | T28 | ✅ Match |
| T30 | T29 | T29 | ✅ Match |
| T31 | None | None (início da fase) | ✅ Match |
| T32 | T31 | T31 | ✅ Match |
| T33 | T32 | T32 | ✅ Match |
| T34 | T33 | T33 | ✅ Match |
| T35 | T34 | T34 | ✅ Match |
| T36 | T35 | T35 | ✅ Match |
| T37 | T36 | T36 | ✅ Match |
| T38 | None | None (início da fase) | ✅ Match |
| T39 | T38 | T38 | ✅ Match |
| T40 | T39 | T39 | ✅ Match |
| T41 | T40 | T40 | ✅ Match |
| T42 | T41 | T41 | ✅ Match |
| T43 | T42 | T42 | ✅ Match |

## Test Co-location Validation

| Task | Camada | Tests (corpo) | Matriz exige | Status |
| ---- | ------ | ------------- | ------------ | ------ |
| T1 | lib | none | none | ✅ |
| T2 | lib | unit | unit | ✅ |
| T3 | lib | unit | unit | ✅ |
| T4 | lib | unit | unit | ✅ |
| T5 | lib | unit | unit | ✅ |
| T6 | lib | unit | unit | ✅ |
| T7 | lib | unit | unit | ✅ |
| T8 | legado | unit | unit | ✅ |
| T9 | legado | unit | unit | ✅ |
| T10 | legado | unit | unit | ✅ |
| T11 | legado | unit | unit | ✅ |
| T12 | legado | unit | unit | ✅ |
| T13 | legado | unit | unit | ✅ |
| T14 | e2e | e2e | e2e | ✅ |
| T15 | ilha | none | tsc (+ e2e da fase) | ✅ |
| T16 | ilha | none | tsc (+ e2e da fase) | ✅ |
| T17 | ilha | none | tsc (+ e2e da fase) | ✅ |
| T18 | e2e | e2e | e2e | ✅ |
| T19 | ilha | none | tsc (+ e2e da fase) | ✅ |
| T20 | ilha | none | tsc (+ e2e da fase) | ✅ |
| T21 | ilha | none | tsc (+ e2e da fase) | ✅ |
| T22 | ilha | none | tsc (+ e2e da fase) | ✅ |
| T23 | ilha | none | tsc (+ e2e da fase) | ✅ |
| T24 | legado | unit | unit | ✅ |
| T25 | e2e | e2e | e2e | ✅ |
| T26 | ilha | e2e | tsc (+ e2e da fase) | ✅ |
| T27 | ilha | none | tsc (+ e2e da fase) | ✅ |
| T28 | ilha | none | tsc (+ e2e da fase) | ✅ |
| T29 | ilha | none | tsc (+ e2e da fase) | ✅ |
| T30 | e2e | e2e | e2e | ✅ |
| T31 | ilha | none | tsc (+ e2e da fase) | ✅ |
| T32 | ilha | none | tsc (+ e2e da fase) | ✅ |
| T33 | ilha | none | tsc (+ e2e da fase) | ✅ |
| T34 | ilha | none | tsc (+ e2e da fase) | ✅ |
| T35 | ilha | none | tsc (+ e2e da fase) | ✅ |
| T36 | legado | unit | unit | ✅ |
| T37 | e2e | e2e | e2e | ✅ |
| T38 | legado | unit | unit | ✅ |
| T39 | legado | unit | unit | ✅ |
| T40 | legado | unit | unit | ✅ |
| T41 | tests | unit | unit | ✅ |
| T42 | e2e | e2e | e2e | ✅ |
| T43 | doc | none | none | ✅ |
