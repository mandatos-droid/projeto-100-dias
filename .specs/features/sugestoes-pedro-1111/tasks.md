# Sugestões do Pedro (11/11/2026) Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/sugestoes-pedro-1111/design.md`
**Status**: Draft

Trabalhar no worktree `../p100-sug-1111` (branch `feat/sugestoes-pedro-1111`, base `origin/main`). Todo deploy termina em push no `main` e conferência com `git cherry` (memória do projeto).

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `plataforma/CLAUDE.md`, `plataforma/AGENTS.md`, scripts do `package.json`, `.specs/features/sugestoes-pedro-0411/spec.md` (camada mínima anterior).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| `lib/*.ts` (regra pura) | unit | Todos os ramos; 1:1 com os ACs; cada borda listada | `plataforma/tests/*.test.ts` | `cd plataforma && npm test` |
| `ilhas/*.tsx` (UI) | e2e | Caminho feliz + bordas + erro dos ACs da tela | `plataforma/e2e/m1-*.spec.ts` | `cd plataforma && npx playwright test e2e/m1-` |
| `public/legacy/ilhas.css`, `novos.js`, `m1.js` | e2e (estilo computado/comportamento); unit para texto | Um assert por AC | `plataforma/e2e/m1-*.spec.ts`, `plataforma/tests/legado-m1.test.ts` | idem |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks só com unit | `cd plataforma && npx tsc --noEmit && npm test` |
| Full | Tasks com e2e | `cd plataforma && npx tsc --noEmit && npm test && npx playwright test e2e/m1-` |
| Build | Fim de fase | `cd plataforma && npm run build && npx tsc --noEmit && npm test && npx playwright test e2e/m1-` |

---

## Execution Plan

Phases são sequenciais; as tasks de cada fase rodam em ordem. A cadeia dentro da fase é ordem de execução (as tasks editam os mesmos arquivos), não dependência de código.

### Phase 1: Correções rápidas e gênero

```
T1 → T2 → T3 → T4
```

### Phase 2: Parlamentares

```
T5 → T6
```

### Phase 3: Conjuntura: municípios

```
T7 → T8
```

### Phase 4: Oportunidades (cartões de agenda)

```
T9 → T10 → T11 → T12 → T13
```

### Phase 5: Seleção visual de dados

```
T14 → T15 → T16 → T17 → T18
```

### Phase 6: Contador de dias

```
T19
```

---

## Task Breakdown

### T1: Tirar a barra de rolagem vertical das abas

**What**: Adicionar `overflow-y:hidden` a `.abas` dentro das ilhas.
**Where**: `plataforma/public/legacy/ilhas.css`
**Depends on**: None
**Reuses**: `legacy.css:319` (origem do `overflow-x:auto`)
**Requirement**: UI-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Computed `overflow-y` das `.abas` da Conjuntura e de Oportunidades é `hidden`
- [x] e2e novo em `e2e/m1-conjuntura.spec.ts` confere o estilo computado e que `scrollHeight <= clientHeight`
- [x] Gate full passa
- [x] Contagem de testes não diminui

**Tests**: e2e
**Gate**: full

**Commit**: `fix(m1): hide the vertical scrollbar on tab strips`

---

### T2: Tirar a promessa do botão “i” do texto das categorias

**What**: Remover “(o botão “i” também explica cada uma)” do texto da Conjuntura 2.1.
**Where**: `plataforma/public/legacy/m1.js`
**Depends on**: T1
**Reuses**: `tests/legado-m1.test.ts` (confere textos do legado)
**Requirement**: CJ-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O título fica “Categorias de classificação:”
- [x] `tests/legado-m1.test.ts` afirma que a frase antiga não existe mais
- [x] Gate quick passa
- [x] Contagem de testes não diminui

**Tests**: unit
**Gate**: quick

**Commit**: `fix(m1): drop the reference to a non-existent info button`

---

### T3: Cargo no feminino por gênero

**What**: Criar `cargoEleito` pura: Deputada/Deputado Estadual, Federal, Distrital; Senadora/Senador.
**Where**: `plataforma/lib/cargoEleito.ts`
**Depends on**: T2
**Reuses**: `cargoDe` em `ilhas/Assentos.tsx:19`
**Requirement**: PAR-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Teste unitário cobre F e M nos 4 cargos, DF e gênero ausente (cai no masculino)
- [ ] `npm test` passa
- [ ] Gate quick passa
- [ ] Contagem de testes não diminui

**Tests**: unit
**Gate**: quick

**Commit**: `feat(lib): add gendered office title helper`

---

### T4: Usar o cargo por gênero nos cartões de parlamentar

**What**: Trocar `cargoDe` de `Assentos.tsx` por `cargoEleito`.
**Where**: `plataforma/ilhas/Assentos.tsx`
**Depends on**: T3
**Reuses**: `lib/cargoEleito.ts`
**Requirement**: PAR-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Marli Ribeiro e Delegada Sheila aparecem como “Deputada Estadual” no e2e
- [ ] Cartão masculino continua “Deputado Estadual”
- [ ] Gate full passa
- [ ] Contagem de testes não diminui

**Tests**: e2e
**Gate**: full

**Commit**: `fix(m1): write the office title in the gender of the person`

---

### T5: Cartão de parlamentar com relação única e troca compacta

**What**: Mostrar a relação atual uma vez e trocar por `select` nativo; manter “Remover classificação”.
**Where**: `plataforma/ilhas/Assentos.tsx`
**Depends on**: None
**Reuses**: `CATEGORIAS` de `lib/relacoes.ts`
**Requirement**: PAR-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Cartão não renderiza mais 5 botões de relação
- [ ] `select` lista as 5 categorias e grava no mesmo campo de hoje
- [ ] Contagens por categoria no filtro seguem corretas
- [ ] e2e atualizado em `e2e/m1-conjuntura.spec.ts`
- [ ] Gate full passa
- [ ] Contagem de testes não diminui

**Tests**: e2e
**Gate**: full

**Commit**: `refactor(m1): compact relation picker on parliamentarian cards`

---

### T6: Reproduzir e corrigir sobreposição do botão e caixa cortada

**What**: Reproduzir #139.1 em 1280px e 390px; corrigir o padding/posição causador. Sem repro, registrar e devolver ao Pedro.
**Where**: `plataforma/public/legacy/ilhas.css`
**Depends on**: T5
**Reuses**: `.ilha-corpo.ass>.abas` (`ilhas.css:423`)
**Requirement**: PAR-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Repro documentada (viewport + seletor culpado) no corpo do commit
- [ ] Botão de navegação não intersecta o texto do cabeçalho em 1280px e 390px (e2e com `boundingBox`)
- [ ] Último bloco fica inteiro ao fim da rolagem (PAR-04)
- [ ] Gate full passa
- [ ] Contagem de testes não diminui

**Tests**: e2e
**Gate**: full

**Commit**: `fix(m1): stop the nav button overlapping the parliamentarian header`

---

### T7: Remover a linha “Prefeitura” do Placar

**What**: Tirar o item `Prefeitura` da lista do Placar e do dado capturável correspondente.
**Where**: `plataforma/ilhas/Conjuntura.tsx`
**Depends on**: None
**Reuses**: `Conjuntura.tsx:372`
**Requirement**: CJ-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Placar não mostra “Prefeitura”
- [ ] Resumo da Missão 1 não quebra (e2e `m1-fechamento`)
- [ ] Gate full passa
- [ ] Contagem de testes não diminui

**Tests**: e2e
**Gate**: full

**Commit**: `fix(m1): remove the prefecture row from the party scoreboard`

---

### T8: Juntar os 5 municípios mais votados ao tópico de municípios

**What**: Remover “Adicionar município/Adicionar todos…” e renderizar os cartões no lugar de “Prefeituras que a liderança acompanha”; `prefExtra` salvo é preservado.
**Where**: `plataforma/ilhas/Conjuntura.tsx`
**Depends on**: T7
**Reuses**: `ilhas/CartoesMunicipio.tsx`; `prefExtra` (`Conjuntura.tsx:204`)
**Requirement**: CJ-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Os dois botões de adicionar não existem mais
- [ ] 5 cartões aparecem dentro do tópico, com classificação do Executivo
- [ ] Dado antigo em `D.conj2.prefExtra` não é apagado
- [ ] e2e atualizado em `e2e/m1-conjuntura-partido.spec.ts`
- [ ] Gate full passa
- [ ] Contagem de testes não diminui

**Tests**: e2e
**Gate**: full

**Commit**: `feat(m1): classify the five most-voted municipalities in the municipalities topic`

---

### T9: Altura máxima e rolagem interna nos cartões de agenda

**What**: Cartão com `max-height:420px`; só a lista rola; título e filtro fixos (`position:sticky`).
**Where**: `plataforma/public/legacy/ilhas.css`
**Depends on**: None
**Reuses**: `ilhas/AgendasSociais.tsx` (estrutura do cartão)
**Requirement**: OP-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Cartão com mais indicadores que 420px rola só a lista
- [ ] Título e filtro permanecem visíveis durante a rolagem (e2e em `e2e/m1-oportunidades.spec.ts`)
- [ ] Gate full passa
- [ ] Contagem de testes não diminui

**Tests**: e2e
**Gate**: full

**Commit**: `feat(m1): cap agenda card height with inner scroll`

---

### T10: Selos de faixa com alto contraste

**What**: Selos preenchidos e em negrito por faixa (cores de `FAIXAS`), contraste ≥ 4,5:1.
**Where**: `plataforma/ilhas/AgendasSociais.tsx`
**Depends on**: T9
**Reuses**: `FAIXAS`, `faixaDe` de `lib/agendas.ts`
**Requirement**: OP-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Cada faixa tem cor própria, com texto claro ou escuro conforme o contraste
- [ ] Teste unitário em `tests/` calcula a razão de contraste de cada par (≥ 4,5)
- [ ] Gate quick passa
- [ ] Contagem de testes não diminui

**Tests**: unit
**Gate**: quick

**Commit**: `feat(m1): high-contrast classification badges on agenda cards`

---

### T11: Cabeçalho do cartão com faixa colorida

**What**: Faixa superior na cor da agenda separando título do corpo.
**Where**: `plataforma/public/legacy/ilhas.css`
**Depends on**: T10
**Reuses**: `Agenda.cor` de `lib/agendas.ts`
**Requirement**: OP-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Cabeçalho de cada cartão tem faixa ou fundo suave (e2e confere `border-top`/`background`)
- [ ] Gate full passa
- [ ] Contagem de testes não diminui

**Tests**: e2e
**Gate**: full

**Commit**: `feat(m1): colored header band on agenda cards`

---

### T12: Texto do tooltip do indicador

**What**: Criar `descreveIndicador(i: IndInfo)` pura: fonte, ano e sentido.
**Where**: `plataforma/lib/indicadoresSociais.ts`
**Depends on**: T11
**Reuses**: `IndInfo` de `lib/agendas.ts:39`
**Requirement**: OP-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Teste unitário: com tudo, sem ano, sem fonte, sentido desconhecido
- [ ] Nenhuma saída contém “undefined” ou “null”
- [ ] Gate quick passa
- [ ] Contagem de testes não diminui

**Tests**: unit
**Gate**: quick

**Commit**: `feat(lib): describe social indicators for tooltips`

---

### T13: ⓘ com tooltip em cada indicador

**What**: Botão ⓘ ao lado do nome, tooltip por hover e foco com `aria-describedby`.
**Where**: `plataforma/ilhas/AgendasSociais.tsx`
**Depends on**: T12
**Reuses**: `descreveIndicador`
**Requirement**: OP-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Hover e foco mostram o tooltip; Esc fecha
- [ ] e2e confere o texto do tooltip de um indicador (ex.: IDEB anos finais)
- [ ] Gate full passa
- [ ] Contagem de testes não diminui

**Tests**: e2e
**Gate**: full

**Commit**: `feat(m1): info tooltip on each social indicator`

---

### T14: Máquina de estados da seleção de dados

**What**: Criar `proximo` e `mensagem` puros para iniciar, capturar 1º/2º, cancelar, remover chip e ignorar repetido.
**Where**: `plataforma/lib/selecaoDados.ts`
**Depends on**: None
**Reuses**: `lib/dadosPartido.ts` (`DadoPartido`)
**Requirement**: SEL-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Teste unitário cobre cada transição, cancelar no meio, repetido e remover chip
- [ ] `npm test` passa
- [ ] Gate quick passa
- [ ] Contagem de testes não diminui

**Tests**: unit
**Gate**: quick

**Commit**: `feat(lib): selection state machine for click-to-select data`

---

### T15: Marcar os cartões de município como capturáveis

**What**: Adicionar `.capturable-data` e `data-dado-*` aos valores dos cartões.
**Where**: `plataforma/ilhas/CartoesMunicipio.tsx`
**Depends on**: T14
**Reuses**: ids `mun:*` já usados em `Reacoes.tsx`
**Requirement**: SEL-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Cada valor capturável tem id igual ao de `DadoPartido`
- [ ] e2e confere atributos nos 5 cartões
- [ ] Gate full passa
- [ ] Contagem de testes não diminui

**Tests**: e2e
**Gate**: full

**Commit**: `feat(m1): make municipality card values capturable`

---

### T16: Marcar placar e grandes números como capturáveis

**What**: Mesmo contrato do T15 nos números do Placar e dos grandes números.
**Where**: `plataforma/ilhas/Conjuntura.tsx`
**Depends on**: T15
**Reuses**: `DadoPartido` montado na Conjuntura
**Requirement**: SEL-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Todo `DadoPartido` oferecido hoje no `<select>` tem um elemento capturável na página
- [ ] e2e compara a lista de ids
- [ ] Gate full passa
- [ ] Contagem de testes não diminui

**Tests**: e2e
**Gate**: full

**Commit**: `feat(m1): make scoreboard figures capturable`

---

### T17: Modo de captura no lugar dos selects

**What**: Substituir os `<select>` por botão único, banner fixo com [Cancelar], tags 1️⃣/2️⃣, scroll suave e chips com ✕.
**Where**: `plataforma/ilhas/Reacoes.tsx`
**Depends on**: T16
**Reuses**: `selecaoDados`, `defineReacao`, `useLegado`
**Requirement**: SEL-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Fluxo completo: botão → 1º clique → 2º clique → banner fecha → chips no formulário (e2e)
- [ ] Remover chip limpa só aquele dado e permite reabrir (SEL-01b)
- [ ] `D.conj2.reacoes` e o Resumo continuam iguais
- [ ] `Esc` cancela sem gravar pela metade
- [ ] Gate full passa
- [ ] Contagem de testes não diminui

**Tests**: e2e
**Gate**: full

**Commit**: `feat(m1): click-to-select data on the party conjuncture`

---

### T18: Estilo do modo de captura

**What**: Banner fixo, cursor pointer, outline roxo, tooltip e tags 1️⃣/2️⃣.
**Where**: `plataforma/public/legacy/ilhas.css`
**Depends on**: T17
**Reuses**: tokens de cor do `ilhas.css`
**Requirement**: SEL-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Elementos `.capturable-data` só ganham destaque com o modo ativo (e2e confere `outline`)
- [ ] Banner não cobre o botão de navegação em 390px
- [ ] Gate full passa
- [ ] Contagem de testes não diminui

**Tests**: e2e
**Gate**: full

**Commit**: `feat(m1): capture mode styling`

---

### T19: Contador de dias não passa de 100 (após confirmar a leitura do #141)

**What**: Override do contador em `novos.js` (sem tocar `app.js`): acima de 100, mostrar “100+” e “100 dias concluídos”.
**Where**: `plataforma/public/legacy/novos.js`
**Depends on**: None
**Reuses**: `app.js:93`, `diaAtual()` em `nucleo.js:226`
**Requirement**: CFG-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Posse há 283 dias mostra “100+” e não “283”
- [ ] Posse há 30 dias continua mostrando 30
- [ ] e2e cobre os dois casos
- [ ] Gate full passa
- [ ] Contagem de testes não diminui

**Tests**: e2e
**Gate**: full

**Commit**: `fix(guia): cap the 100-day counter once the period is over`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

Phase 1:  T1 ------→ T2 ------→ T3 ------→ T4
Phase 2:  T5 ------→ T6
Phase 3:  T7 ------→ T8
Phase 4:  T9 ------→ T10 ------→ T11 ------→ T12 ------→ T13
Phase 5:  T14 ------→ T15 ------→ T16 ------→ T17 ------→ T18
Phase 6:  T19
```
