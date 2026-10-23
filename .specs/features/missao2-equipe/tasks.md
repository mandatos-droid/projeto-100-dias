# Missão 2 · Equipe, Organograma e Rotinas Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/missao2-equipe/spec.md`
**Design**: `.specs/features/missao2-equipe/design.md`
**Status**: Draft (aguarda aprovação do usuário)

Todos os caminhos abaixo são relativos a `plataforma/`, salvo indicação. A árvore de trabalho tem mudanças do usuário não commitadas em arquivos que estas tarefas tocam (`ilhas/Equipe.tsx`, `ilhas/ponte.tsx`, `public/legacy/novos.js`, `public/legacy/guia.js`, `ilhas/Recomenda.tsx`, `lib/recomenda.ts`, `lib/bandeiras.ts`). Regras de segurança:

1. Cada commit usa `git add` com os arquivos nomeados da tarefa; nunca `git add -A`.
2. Antes de editar `ponte.tsx` ou `novos.js` pela primeira vez, rodar `git diff` no arquivo e preservar a mudança do usuário.
3. `Recomenda.tsx`, `recomenda.ts` e `bandeiras.ts` não são apagados nem editados; só deixam de ser montados na Missão 2.
4. Antes de escrever a rota da T12, ler o guia de rotas em `node_modules/next/dist/docs/` (regra de `AGENTS.md`).

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `plataforma/CLAUDE.md` (comandos `npm test`, `npx tsc --noEmit`; imports relativos com `.ts` nos testes), `plataforma/AGENTS.md` (docs do Next 16), `.specs/STATE.md` (AD-003, AD-004), `tests/demo.test.ts` e `tests/landing.test.ts` (estilo e local dos testes existentes: `node --test`).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Lógica pura (`lib/cadeiras.ts`, `rotinas.ts`, `layoutOrg.ts`, `entrega.ts`, `exporta.ts`, `foco.ts`) | unit | Todos os ramos; 1:1 com os critérios MEQ; cada edge case listado tem teste | `tests/*.test.ts` | `npm test` |
| Ilhas React (`ilhas/equipe/*.tsx`) | e2e | Cada tela que a tarefa cria: caminho feliz + cada edge case e erro que a spec lista para ela | `e2e/*.spec.ts` | `npm run test:e2e` |
| Ganchos do legado (`public/legacy/m2.js`) | unit (`node:vm` com globais simuladas) | Cada override: entrada antiga e entrada nova, 1:1 com os critérios | `tests/legado-m2.test.ts` | `npm test` |
| Hook de ligação (`ilhas/equipe/useEquipe.ts`), `ponte.tsx`, `novos.js`, `app/guia/page.tsx`, `painel.html` | none | - (build gate; exercitados pelos testes e2e das ilhas; `painel.html` não tem runner e é conferido na verificação final) | - | `npx tsc --noEmit` |
| Rota de teste (`app/teste-equipe/page.tsx`), config (`package.json`, `playwright.config.ts`) | e2e (fumaça) | A rota monta a ilha pedida; a config roda um teste | `e2e/harness.spec.ts` | `npm run test:e2e` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tarefas só com testes unitários (`lib/`, `m2.js`) | `npm test` |
| Full | Tarefas de ilha, que têm teste e2e | `npm test && npx tsc --noEmit && npm run test:e2e` |
| Build | Fim de fase, tarefas de config e tarefas com `Tests: none` | `npx tsc --noEmit && npm test && npm run test:e2e && npm run build` |

Observação: o `npm run build` oscilou com `SecurityFatalError` do Next 16.4 na feature `landing`. Se falhar só por isso, o gate Build vale como `npx tsc --noEmit && npm test && npm run test:e2e` mais `next dev` respondendo 200 em `/guia`, e a falha fica registrada na tarefa.

---

## Execution Plan

Phases run in order; tasks run in order inside a phase. A seta que abre cada fase (por exemplo `T10 → T11`) marca a dependência da última tarefa da fase anterior.

### Phase 1: Lógica pura (`lib/`)

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10
```

### Phase 2: Infra de testes de tela

```
T10 → T11 → T12
```

### Phase 3: Tarefa 1, escalação em 3 etapas

```
T12 → T13 → T14 → T15 → T16 → T17 → T18
```

### Phase 4: Tarefa 2, organograma e painel

```
T18 → T19 → T20 → T21 → T22 → T23
```

### Phase 5: Rotinas, cadeia e entrega

```
T23 → T24 → T25 → T26 → T27 → T28 → T29 → T30
```

### Phase 6: Integração com o Guia legado

```
T30 → T31 → T32 → T33 → T34 → T35 → T36
```

### Phase 7: Controles avançados (P3, opcional)

```
T36 → T37 → T38 → T39 → T40 → T41
```

---

## Task Breakdown

### T1: Leitura do estado das cadeiras e migração do formato antigo ✅

**What**: Criar `lib/cadeiras.ts` com tipos `Patch`, chaves `m2.*`, `aplica`, `ativas` (deriva do formato antigo sem `m2.on`), `coordDe`, `liderDe`, `nomeDe`.
**Where**: `lib/cadeiras.ts`
**Depends on**: None
**Reuses**: `lib/equipe.ts` (`PADRAO`, `chaveNome`, `chaveFicha`, `lista`, `SEP`)
**Requirement**: MEQ-06, MEQ-24

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `ativas` sem `m2.on` devolve a cadeira 0 e toda cadeira com nome ou com qualquer campo `m2.p{n}.*` preenchido (T-21)
- [x] `m2.areas` e `m2.areas_aplicadas` nunca são tocadas (T-22)
- [x] `coordDe` e `liderDe` devolvem o padrão de `PADRAO` quando não há valor gravado, e o valor gravado quando há (T-07)
- [x] `lider = '-'` significa topo e devolve `null`
- [x] Gate: `npm test`; 3 testes novos em `tests/cadeiras.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(equipe): leitura das cadeiras ativas com migração do formato antigo`

---

### T2: Cadeiras por área e modelo completo ✅

**What**: Acrescentar a `lib/cadeiras.ts` `sugeridasDaArea`, `alternaArea` (com `confirma` quando há nomes) e `modeloCompleto`; `SEM_AREA`.
**Where**: `lib/cadeiras.ts`
**Depends on**: T1
**Reuses**: `PADRAO`, `COORDENACOES`
**Requirement**: MEQ-02, MEQ-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Área Legislativo marcada gera Chefia + 6 cadeiras = 7 ativas (T-01)
- [x] `modeloCompleto` marca as 6 áreas e totaliza 20 cadeiras, na ordem de `CARGOS_EQUIPE` (T-02)
- [x] Desmarcar área sem nomes remove as cadeiras sem confirmação (T-05)
- [x] Desmarcar área com nome devolve `confirma` com os nomes e, ao confirmar, move as cadeiras para `SEM_AREA` sem apagá-las (T-06)
- [x] Gate: `npm test`; 4 testes novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(equipe): cadeiras sugeridas por área e modelo completo`

---

### T3: Acrescentar e remover cadeira com limites e repasse ✅

**What**: Acrescentar a `lib/cadeiras.ts` `acrescenta` (limite 40, índice 20+ para cadeira nova, ou reativa cadeira do modelo) e `remove` (recusa a cadeira 0, repassa a liderança, guarda cópia em `m2.arq.{n}`).
**Where**: `lib/cadeiras.ts`
**Depends on**: T2
**Reuses**: `ativas`, `liderDe`
**Requirement**: MEQ-03, MEQ-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Acrescentar com 40 cadeiras devolve `erro` e o total continua 40 (T-03)
- [x] Remover a cadeira 0 devolve `erro` (T-04)
- [x] Remover B em A→B→C deixa C liderada por A (T-10)
- [x] Remover cadeira com nome ou ficha devolve `confirma`; a cópia fica em `m2.arq.{n}` como JSON `{nome, ficha}`
- [x] Gate: `npm test`; 4 testes novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(equipe): acrescentar e remover cadeira com limites e repasse de liderança`

---

### T4: Liderança sem ciclo ✅

**What**: Acrescentar a `lib/cadeiras.ts` `defineLider`, que recusa ciclo direto ou indireto e devolve a cadeia que o formaria.
**Where**: `lib/cadeiras.ts`
**Depends on**: T3
**Reuses**: `liderDe`
**Requirement**: MEQ-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] A lidera B e definir B como líder de A devolve `ciclo` (T-08)
- [x] A→B→C e definir C como líder de A devolve `ciclo = [A, B, C]` (T-09)
- [x] Liderança sem ciclo devolve `patch` e não devolve `ciclo`
- [x] Gate: `npm test`; 3 testes novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(equipe): recusar ciclo na liderança imediata`

---

### T5: Geração das rotinas ✅

**What**: Criar `lib/rotinas.ts` com `gerarRotinas`: planejamento, monitoramento e alinhamento (todas as cadeiras), reunião de área (2 ou mais cadeiras), feedback por par líder/liderado, honrando `m2.rotoff`.
**Where**: `lib/rotinas.ts`
**Depends on**: T4
**Reuses**: `ativas`, `coordDe`, `liderDe`; textos das rotinas em `public/legacy/conteudo.js:43-49`
**Requirement**: MEQ-17

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] 1 cadeira com nome gera as 3 rotinas coletivas (T-11)
- [x] Área com 3 cadeiras gera 1 reunião de 45 min com 3 participantes e convocador = cadeira de topo da área (T-12)
- [x] Área com 1 cadeira não gera reunião (T-13)
- [x] 2 liderados de um líder geram 2 feedbacks de 30 min, com `grupo` = líder (T-14)
- [x] Cadeira sem nome entra em `participantes` e fica fora de `confirmados` (T-15)
- [x] Gerar duas vezes devolve o mesmo resultado, sem duplicados (T-16)
- [x] Gate: `npm test`; 6 testes novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(equipe): gerar rotinas a partir das cadeiras`

---

### T6: Cadeia de rotinas e cadeiras por elo ✅

**What**: Acrescentar a `lib/rotinas.ts` `cadeia`, `cadeirasDoElo` e `rotinasDaCadeira`.
**Where**: `lib/rotinas.ts`
**Depends on**: T5
**Reuses**: `gerarRotinas`
**Requirement**: MEQ-18, MEQ-19

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] A ordem dos elos é planejamento, monitoramento, alinhamento, reunião de área, feedback (T-17)
- [x] `cadeirasDoElo('area:Comunicação')` devolve só as cadeiras de Comunicação (T-18)
- [x] `rotinasDaCadeira` lista todas as rotinas de que a cadeira participa
- [x] Gate: `npm test`; 3 testes novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(equipe): cadeia de rotinas e cadeiras de cada elo`

---

### T7: Rotinas entre áreas ✅

**What**: Acrescentar a `lib/rotinas.ts` `sugestoesEntreAreas`, `criaEntreAreas` (recusa origem = destino) e a leitura de `m2.x` com arquivamento quando a área é desmarcada.
**Where**: `lib/rotinas.ts`
**Depends on**: T6
**Reuses**: `alternaArea`
**Requirement**: MEQ-20, MEQ-22

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Origem igual ao destino devolve `erro` (T-19)
- [x] Desmarcar uma das áreas esconde as rotinas que a envolvem e remarcar as devolve idênticas (T-20)
- [x] As 4 sugestões só aparecem quando as duas áreas estão ativas
- [x] JSON inválido em `m2.x` devolve lista vazia sem lançar erro
- [x] Gate: `npm test`; 4 testes novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(equipe): rotinas de comunicação entre áreas`

---

### T8: Layout do organograma ✅

**What**: Criar `lib/layoutOrg.ts` com `layoutOrg` (posições por dagre, arestas de hierarquia subindo até o líder visível, arestas pontilhadas entre áreas), extraindo a lógica de `ilhas/Equipe.tsx:142-172`.
**Where**: `lib/layoutOrg.ts`
**Depends on**: T7
**Reuses**: `ilhas/Equipe.tsx:142-172`, `@dagrejs/dagre`
**Requirement**: MEQ-11, MEQ-21

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O import de `@dagrejs/dagre` roda sob `node --test` (se não rodar, registrar e ajustar o import antes de seguir)
- [x] Cadeira com líder escondido sobe até o líder visível mais próximo (T-24)
- [x] Cada rotina entre áreas ativa gera uma aresta `tipo: 'entre'` rotulada, sem alterar as arestas de hierarquia (T-24)
- [x] O filtro "só preenchidas" remove da lista as cadeiras sem nome
- [x] Gate: `npm test`; 4 testes novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(equipe): layout puro do organograma`

---

### T9: Sugestão do checklist ✅

**What**: Criar `lib/entrega.ts` com `sugestaoChecklist` (c1 escopo completo, c2 hierarquia ligada à Chefia, c3 rotina ativa de cada tipo).
**Where**: `lib/entrega.ts`
**Depends on**: T8
**Reuses**: `ativas`, `gerarRotinas`
**Requirement**: MEQ-23

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Escopo preenchido em todas as cadeiras com nome sugere `c1` (T-23)
- [x] Uma cadeira sem escopo mantém `c1` falso
- [x] A função nunca grava `m2.c1..c3` (só sugere)
- [x] Gate: `npm test`; 3 testes novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(equipe): sugestão automática do checklist da Missão 2`

---

### T10: Exportação do organograma em SVG ✅

**What**: Criar `lib/exporta.ts` com `organogramaSvg(c)`: SVG completo com caixas, linhas, cores por área e legenda.
**Where**: `lib/exporta.ts`
**Depends on**: T9
**Reuses**: `layoutOrg`, `COR_COORD`
**Requirement**: MEQ-23

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O SVG contém o nome de cada pessoa, o cargo e o nome da área (T-25)
- [x] O SVG contém a legenda com as áreas ativas e nenhuma inativa (T-25)
- [x] Nomes com `&`, `<` e aspas saem escapados e o SVG continua bem formado (T-25)
- [x] Gate: `npm test`; 3 testes novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(equipe): exportar organograma em SVG`

---

### T11: Playwright e script de testes de tela ✅

**What**: Instalar `@playwright/test` (devDependency), criar `playwright.config.ts` (Chromium, `webServer: npm run dev`, `baseURL` local) e o script `test:e2e` no `package.json`; instalar o Chromium.
**Where**: `playwright.config.ts`
**Depends on**: T10
**Reuses**: `package.json` (scripts)
**Requirement**: MEQ-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `npm run test:e2e` executa um teste de exemplo e sai com código 0 (cria `e2e/harness.spec.ts` com 1 teste que abre `/`)
- [x] `.gitignore` ignora `test-results/` e `playwright-report/`
- [x] Gate: `npm run test:e2e`; 1 teste e2e passa

**Tests**: e2e
**Gate**: full
**Commit**: `build(equipe): adicionar Playwright e script test:e2e`

---

### T12: Rota de teste que monta as ilhas sem login ✅

**What**: Criar `app/teste-equipe/page.tsx`: monta as ilhas pedidas em `?ilha=a,b` pela mesma `ILHAS` da ponte, com `D`, `Store`, `aviso` simulados, `conteudo.js` carregado para trazer `CARGOS_EQUIPE`, e semente opcional em `window.__semente`; `notFound()` em produção.
**Where**: `app/teste-equipe/page.tsx`
**Depends on**: T11
**Reuses**: `ilhas/ponte.tsx` (`instalaIlhas`, `useLegado`), `public/legacy/conteudo.js`
**Requirement**: MEQ-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] A rota lê o guia de rotas do Next 16 em `node_modules/next/dist/docs/` antes de ser escrita (regra de `AGENTS.md`)
- [x] `/teste-equipe?ilha=organograma` renderiza a ilha com `D.campos` vazio
- [ ] Com `NODE_ENV=production` a rota responde 404 (não verificado: `npm run build` bloqueado pelo `SecurityFatalError` do Next 16.4; a rota chama `notFound()` quando `NODE_ENV === 'production'`)
- [x] `window.__semente = {campos}` antes do carregamento preenche `D.campos`
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 2 testes e2e novos em `e2e/harness.spec.ts`

**Tests**: e2e
**Gate**: full
**Commit**: `test(equipe): rota de teste para montar ilhas sem login`

---

### T13: Hook de ligação `useEquipe` ✅

**What**: Criar `ilhas/equipe/useEquipe.ts`: `useLegado` + `agir(resultado)` que aplica o patch, mostra `aviso` em caso de `erro` e chama `bump`.
**Where**: `ilhas/equipe/useEquipe.ts`
**Depends on**: T12
**Reuses**: `ilhas/ponte.tsx` (`useLegado`, `aviso`), `lib/cadeiras.ts` (`aplica`)
**Requirement**: MEQ-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `agir({patch})` grava as chaves e dispara `guia:mudou` uma vez
- [x] `agir({erro})` mostra o texto do erro e não grava nada
- [x] `npx tsc --noEmit` sem erro

**Tests**: none
**Gate**: build
**Commit**: `feat(equipe): hook de ligação das ilhas da Missão 2`

---

### T14: Escalação, casca com as 3 etapas ✅

**What**: Criar `ilhas/equipe/Escalacao.tsx` com stepper "Etapa X de 3", voltar sem perder dados, etapa 3 bloqueada sem área, persistência em `m2.etapa`, foco no primeiro campo da etapa; registrar `equipe-escalacao` em `ponte.tsx`.
**Where**: `ilhas/equipe/Escalacao.tsx`
**Depends on**: T13
**Reuses**: `ilhas/ponte.tsx` (`ILHAS`), classes `eq-*` de `ilhas.css`
**Requirement**: MEQ-01, MEQ-05

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] Ao abrir sem dados mostra "Etapa 1 de 3" e a etapa "Nomes" bloqueada com o motivo (E-01)
- [x] Voltar de uma etapa mantém tudo o que foi digitado; recarregar mantém `m2.etapa` (E-06)
- [x] O foco vai ao primeiro campo da etapa ao trocar de etapa
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 2 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): casca da escalação com etapas`

---

### T15: Etapa 1, áreas do mandato ✅

**What**: Criar `ilhas/equipe/EtapaAreas.tsx`: as 6 áreas desmarcadas, Chefia de gabinete fixa, contador de cadeiras, "Usar o modelo completo", confirmação ao desmarcar área com nomes; plugar na casca.
**Where**: `ilhas/equipe/EtapaAreas.tsx`
**Depends on**: T14
**Reuses**: `alternaArea`, `modeloCompleto`, `COR_COORD`
**Requirement**: MEQ-02, MEQ-04

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] Marcar Legislativo e Comunicação mostra 11 cadeiras (E-02)
- [x] "Usar o modelo completo" mostra 20 cadeiras
- [x] Desmarcar área com nome abre confirmação listando os nomes; cancelar mantém tudo
- [x] Desmarcar área sem nomes remove sem perguntar
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 4 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): etapa de áreas do mandato`

---

### T16: Etapa 2, ajustar as cadeiras ✅

**What**: Criar `ilhas/equipe/EtapaCadeiras.tsx`: cadeiras agrupadas por área, acrescentar (do modelo ou em branco), remover, contagem de 1 a 40, mensagens de limite, etiqueta "Temático" nos especialistas temáticos sem bandeira.
**Where**: `ilhas/equipe/EtapaCadeiras.tsx`
**Depends on**: T15
**Reuses**: `acrescenta`, `remove`
**Requirement**: MEQ-02, MEQ-03

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] Remover e acrescentar mudam a contagem; com 40 cadeiras o botão de acrescentar fica desabilitado com o motivo
- [x] A Chefia de gabinete não tem botão de remover
- [x] Os especialistas temáticos aparecem como "Especialista temático(a) N" com a etiqueta "Temático" e nenhuma pergunta de bandeira
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 3 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): etapa de ajuste das cadeiras`

---

### T17: Etapa 3, nomes, coordenação e liderança ✅

**What**: Criar `ilhas/equipe/EtapaNomes.tsx`: por cadeira, nome (com `*`), nome do cargo, coordenação e liderança imediata já pré-preenchidas, erro de ciclo inline, aviso "mesma pessoa em 2 cadeiras"; sem campos de escopo, perfil nem repertório.
**Where**: `ilhas/equipe/EtapaNomes.tsx`
**Depends on**: T16
**Reuses**: `defineLider`, `coordDe`, `liderDe`
**Requirement**: MEQ-05, MEQ-06, MEQ-07

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] A etapa mostra só nome, cargo, coordenação e liderança por cadeira (E-03)
- [x] Escolher liderança em ciclo mostra "A → B → C voltaria para A" e mantém o valor anterior (E-05)
- [x] Digitar `*` marca "processo seletivo de ampla concorrência"
- [x] Digitar o nome e recarregar mantém o nome (E-06)
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 4 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): etapa de nomes, coordenação e liderança`

---

### T18: Mini-organograma ao vivo ✅

**What**: Criar `ilhas/equipe/MiniOrg.tsx`: prévia do organograma ao lado da etapa "Nomes", atualizada a cada edição, sem painel.
**Where**: `ilhas/equipe/MiniOrg.tsx`
**Depends on**: T17
**Reuses**: `layoutOrg`, `@xyflow/react`
**Requirement**: MEQ-05, MEQ-06

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] Trocar a liderança de uma cadeira move a caixa no mini-organograma em menos de 300 ms (E-04)
- [x] O mini-organograma não abre painel nem edita nada
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 2 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): mini-organograma ao vivo na etapa de nomes`

---

### T19: Destaque transitório entre ilhas ✅

**What**: Criar `ilhas/equipe/foco.ts`: pub-sub mínimo (`definirFoco`, `limparFoco`, `assinar`) para o destaque de cadeiras compartilhado entre as ilhas.
**Where**: `ilhas/equipe/foco.ts`
**Depends on**: T18
**Reuses**: padrão de evento de `ilhas/ponte.tsx` (`guia:mudou`)
**Requirement**: MEQ-19

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `assinar` recebe o foco atual e cada mudança; cancelar a assinatura para as notificações (T-26)
- [x] `limparFoco` notifica com lista vazia (T-26)
- [x] Gate: `npm test`; 2 testes novos em `tests/foco.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(equipe): destaque transitório compartilhado entre ilhas`

---

### T20: Organograma, canvas e caixa ✅

**What**: Criar `ilhas/equipe/Organograma.tsx`: canvas React Flow com a caixa nova (pessoa, cargo, área com cor e rótulo, anel de progresso, selo "escopo pendente", vaga tracejada), filtro por área esmaecendo, "Só preenchidas", "Ajustar layout", contador "X/Y cadeiras com escopo"; registrar `organograma` em `ponte.tsx` no lugar do organograma antigo.
**Where**: `ilhas/equipe/Organograma.tsx`
**Depends on**: T19
**Reuses**: `layoutOrg`, `ilhas/Equipe.tsx:120-133` (caixa antiga), classes `eq-*`
**Requirement**: MEQ-09, MEQ-11, MEQ-15

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] A caixa mostra só pessoa, cargo, área e anel; cadeira sem escopo mostra o selo
- [x] O filtro por área esmaece as outras áreas sem escondê-las
- [x] O contador "X/Y" muda quando o escopo de uma cadeira muda
- [x] "Ajustar layout" reorganiza e enquadra tudo
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 4 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): organograma com caixa de progresso e filtros`

---

### T21: Painel da cadeira ✅

**What**: Criar `ilhas/equipe/PainelCadeira.tsx`: nome do cargo, pessoa, coordenação, liderança, escopo (chips), especificidades, habilidades, repertório; painel lateral em 900 px ou mais e gaveta inferior abaixo; ligar ao clique da caixa em `Organograma.tsx`.
**Where**: `ilhas/equipe/PainelCadeira.tsx`
**Depends on**: T20
**Reuses**: `Chips` e campos de `ilhas/Equipe.tsx:39-114`, `defineLider`
**Requirement**: MEQ-09, MEQ-10

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] Clicar na caixa abre o painel com os campos; marcar 2 itens de escopo sobe o anel e o contador (E-07)
- [x] Trocar a coordenação de uma cadeira muda a cor da caixa e o nome da área (E-08); a parte "rotina da área na mesma tela" é testada na T24, quando a ilha de rotinas nova existe
- [x] Em 360 px o painel é gaveta inferior e a página não rola na horizontal (E-13)
- [x] Esc fecha o painel e devolve o foco à caixa
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 4 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): painel de edição da cadeira no organograma`

---

### T22: Acrescentar e remover cadeira no organograma ✅

**What**: Em `Organograma.tsx`, botão "Acrescentar cadeira" (subordinada à caixa selecionada, abre o painel) e remoção pelo painel com confirmação e repasse de liderança.
**Where**: `ilhas/equipe/Organograma.tsx`
**Depends on**: T21
**Reuses**: `acrescenta`, `remove`
**Requirement**: MEQ-08, MEQ-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Com uma caixa selecionada, "Acrescentar cadeira" cria a cadeira subordinada e abre o painel
- [x] Remover um líder pede confirmação e reatribui os liderados ao líder do removido (E-09)
- [x] A cadeira 0 não oferece remover
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 3 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): acrescentar e remover cadeiras pelo organograma`

---

### T23: Teclado e leitor de tela no organograma ✅

**What**: Em `Organograma.tsx`, caixas focáveis por Tab com `ariaLabel`, Enter abre o painel, foco vai ao primeiro campo, controles da barra alcançáveis por teclado.
**Where**: `ilhas/equipe/Organograma.tsx`
**Depends on**: T22
**Reuses**: opções `nodesFocusable` e `ariaLabel` do React Flow (conferir na versão instalada)
**Requirement**: MEQ-16

**Tools**:

- MCP: NONE
- Skill: `web-design-guidelines`

**Done when**:

- [x] Tab chega a uma caixa, Enter abre o painel e o foco cai no primeiro campo (E-12)
- [x] Cada caixa expõe `aria-label` com pessoa, cargo, área e estado do escopo
- [x] Todas as ações da barra funcionam só com teclado
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 2 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): organograma navegável por teclado`

---

### T24: Rotinas, abas e visão por área ✅

**What**: Criar `ilhas/equipe/Rotinas.tsx` com as abas "Por área", "Cadeia" e "Entre áreas" (só a primeira pronta), mostrando por área: quem coordena, quem participa, escopo de cada pessoa, vagas, e o desligar de rotina; registrar `rotinas` em `ponte.tsx` no lugar da antiga.
**Where**: `ilhas/equipe/Rotinas.tsx`
**Depends on**: T23
**Reuses**: `gerarRotinas`, `desliga`; `ilhas/Equipe.tsx:215-281`
**Requirement**: MEQ-17

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] Uma área de 3 cadeiras mostra a reunião semanal com 3 participantes e 45 min
- [x] Cadeira sem nome aparece como "vaga" e fora da contagem de confirmados
- [x] Desligar uma rotina a tira da lista e do checklist
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 3 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): rotinas geradas por área`

---

### T25: Aba Cadeia ✅

**What**: Em `Rotinas.tsx`, aba "Cadeia": elos em ordem com frequência, duração, quantidade de cadeiras, número e ícone; selecionar um elo publica o foco; "Mostrar todos" limpa.
**Where**: `ilhas/equipe/Rotinas.tsx`
**Depends on**: T24
**Reuses**: `cadeia`, `cadeirasDoElo`, `foco.ts`
**Requirement**: MEQ-18, MEQ-19

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] Os 5 elos aparecem na ordem da spec, cada um com número e ícone além da cor
- [x] Selecionar um elo publica as cadeiras envolvidas no `foco`
- [x] "Mostrar todos" limpa o foco
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 3 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): aba da cadeia de rotinas`

---

### T26: Organograma reage ao destaque ✅

**What**: Em `Organograma.tsx`, assinar `foco.ts`: cadeiras do foco em destaque, demais esmaecidas. (Decisão na execução: clicar numa caixa não publica foco, porque esmaeceria o resto do organograma toda vez que o painel abrisse; a spec só exige o destaque vindo da cadeia.)
**Where**: `ilhas/equipe/Organograma.tsx`
**Depends on**: T25
**Reuses**: `foco.ts`
**Requirement**: MEQ-19

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Selecionar "Reunião da área Comunicação" na cadeia deixa só as cadeiras de Comunicação em destaque (E-10)
- [x] "Mostrar todos" devolve todas as caixas ao normal
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 2 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): organograma destaca as cadeiras do elo escolhido`

---

### T27: Rotinas da cadeira no painel ✅

**What**: Em `PainelCadeira.tsx`, listar as rotinas de que a cadeira participa, com atalho para destacá-las.
**Where**: `ilhas/equipe/PainelCadeira.tsx`
**Depends on**: T26
**Reuses**: `rotinasDaCadeira`
**Requirement**: MEQ-19

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O painel de uma cadeira com nome lista as rotinas em que ela participa, com frequência e duração
- [x] O painel de uma cadeira sozinha numa área não lista reunião de área
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 2 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): rotinas da cadeira no painel`

---

### T28: Aba Entre áreas ✅

**What**: Em `Rotinas.tsx`, aba "Entre áreas": 4 sugestões condicionais, formulário (origem, destino, finalidade, frequência, canal), recusa de par igual, arquivar e restaurar.
**Where**: `ilhas/equipe/Rotinas.tsx`
**Depends on**: T27
**Reuses**: `sugestoesEntreAreas`, `criaEntreAreas`
**Requirement**: MEQ-20, MEQ-22

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] Aceitar a sugestão Legislativo→Comunicação grava a rotina com frequência e canal escolhidos (E-11)
- [x] Escolher a mesma área em origem e destino mostra o erro e não grava
- [x] Desmarcar a área na escalação arquiva a rotina; remarcar a restaura
- [x] Estado vazio mostra "Nenhuma rotina entre áreas ainda"
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 4 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): aba de rotinas de comunicação entre áreas`

---

### T29: Linhas pontilhadas entre áreas no organograma ✅

**What**: Em `Organograma.tsx`, desenhar as arestas `entre` de `layoutOrg` como linhas pontilhadas rotuladas, sem mudar a hierarquia; selecionar uma rotina destaca as cadeiras de convocação das duas áreas.
**Where**: `ilhas/equipe/Organograma.tsx`
**Depends on**: T28
**Reuses**: `layoutOrg` (arestas `entre`), `foco.ts`
**Requirement**: MEQ-21

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Criar Legislativo→Comunicação desenha uma linha pontilhada rotulada entre as duas áreas (E-11)
- [x] As arestas de hierarquia não mudam
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 2 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): linhas entre áreas no organograma`

---

### T30: Entrega e exportação ✅

**What**: Criar `ilhas/equipe/Entrega.tsx`: 4 blocos (cadeiras, escopo por cargo, organograma, rotinas), sugestões de `m2.c1..c3` com "Marcar como pronto", "Exportar organograma" (SVG → PNG) e "Imprimir ou salvar em PDF" com CSS de impressão; registrar `entrega` em `ponte.tsx`.
**Where**: `ilhas/equipe/Entrega.tsx`
**Depends on**: T29
**Reuses**: `sugestaoChecklist`, `organogramaSvg`
**Requirement**: MEQ-23

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] "Exportar organograma" baixa um `.png` não vazio (E-14)
- [x] Completar o escopo de todas as cadeiras com nome mostra a sugestão de `c1`; só "Marcar como pronto" grava
- [x] A visão de impressão mostra os 4 blocos em layout de papel
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 4 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): entrega com exportação e sugestões do checklist`

---

### T31: Carregar o arquivo de ganchos da Missão 2 ✅

**What**: Em `app/guia/page.tsx`, acrescentar `m2` à sequência de scripts, depois de `novos`.
**Where**: `app/guia/page.tsx`
**Depends on**: T30
**Reuses**: lista de scripts existente em `app/guia/page.tsx`
**Requirement**: MEQ-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `m2.js` é carregado logo depois de `novos.js`, e a ordem dos demais scripts não muda
- [x] `CLAUDE.md` do projeto cita `m2.js` na lista de scripts do legado
- [x] `npx tsc --noEmit` e `npm run build` sem erro novo

**Tests**: none
**Gate**: build
**Commit**: `build(equipe): carregar m2.js depois de novos.js no Guia`

---

### T32: Ganchos da Missão 2, escalação e textos ✅

**What**: Criar `public/legacy/m2.js`: substituir `Comp.funcoes` por um contêiner de `equipe-escalacao`, reescrever em `MISSOES` os textos das duas tarefas (intro da escalação sem lista de nomes; intro de `m2.gestao` com organograma, rotinas e entrega).
**Where**: `public/legacy/m2.js`
**Depends on**: T31
**Reuses**: `public/legacy/novos.js:387-391` (padrão de override), `conteudo.js:223-249` (textos atuais)
**Requirement**: MEQ-01, MEQ-06

**Tools**:

- MCP: NONE
- Skill: `ux-copy`

**Done when**:

- [x] `Comp.funcoes()` devolve só `<div class="ilha" data-ilha="equipe-escalacao">` e nenhum `<input data-k="m2.f…">` (T-27)
- [x] O texto da escalação não menciona bandeira nem escopo; o de `m2.gestao` inclui os contêineres `organograma`, `rotinas` e `entrega` nesta ordem (T-27)
- [x] O checklist `m2.c1..c3` continua em `m2.gestao.itens` (T-27)
- [x] Gate: `npm test`; 3 testes novos em `tests/legado-m2.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(equipe): ganchos do Guia para a escalação e os textos da Missão 2`

---

### T33: Desligar o seletor de bandeiras da Missão 2 ✅

**What**: Em `public/legacy/novos.js`, remover o gancho de `recomenda-cargos` (linhas 387-391) e, em `ilhas/ponte.tsx`, o registro e o import de `Recomenda`; os arquivos `Recomenda.tsx`, `recomenda.ts` e `bandeiras.ts` ficam no disco. (Execução: esse gancho e o registro na ponte nunca foram commitados, então a remoção ficou só na árvore de trabalho; o registro saiu da `ponte.tsx` já na T14. Este commit só fecha o status. O resto do `novos.js` não commitado é trabalho do usuário e não foi tocado.)
**Where**: `public/legacy/novos.js`
**Depends on**: T32
**Reuses**: `git diff` do arquivo antes de editar (preservar mudança do usuário)
**Requirement**: MEQ-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `grep recomenda-cargos` em `public/legacy` e `ilhas/ponte.tsx` não encontra mais nada
- [x] `Recomenda.tsx`, `recomenda.ts` e `bandeiras.ts` seguem intactos
- [x] A Missão 2 abre sem o seletor (E-01 continua passando)
- [x] `npx tsc --noEmit` e `npm test` sem erro novo

**Tests**: none
**Gate**: build
**Commit**: `refactor(equipe): tirar o seletor de bandeiras da Missão 2`

---

### T34: Contadores de cargos no Guia ✅

**What**: Em `public/legacy/m2.js`, substituir `temConteudo` (caso `funcoes`) e `App.estadoTxt` para contar cadeiras ativas e nomes; trocar o bloco `funcoes` do Resumo por uma lista das cadeiras ativas com nome.
**Where**: `public/legacy/m2.js`
**Depends on**: T33
**Reuses**: `nucleo.js:238`, `app.js:250`, `resumo.js:29` (comportamento atual); `lib/cadeiras.ts` (mesma regra, em JS puro)
**Requirement**: MEQ-24

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Mandato antigo com 20 `m2.f` mostra "N de 20 cargos" como antes (T-28)
- [x] Mandato novo com `m2.on` de 12 cadeiras mostra "N de 12 cargos" (T-28)
- [x] O Resumo lista só as cadeiras ativas com nome e marca `*` como processo seletivo (T-28)
- [x] Gate: `npm test`; 3 testes novos em `tests/legado-m2.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(equipe): contadores do Guia contam as cadeiras ativas`

---

### T35: Contagem no painel da Legisla ✅

**What**: Em `public/painel.html`, contar cadeiras com nome entre todas as chaves `m2.f{n}` e usar `m2.on` (ou 20, sem `m2.on`) como total.
**Where**: `public/painel.html`
**Depends on**: T34
**Reuses**: `painel.html:807-808, 1149`
**Requirement**: MEQ-24

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `cargosPreenchidos` e `cargosAbertos` contam também cadeiras de índice 20 ou mais
- [x] O total mostrado é o de `m2.on`, ou 20 quando a chave não existe
- [x] O painel continua mostrando só contagens, nunca texto escrito pelos gabinetes
- [x] `npm run build` sem erro novo e conferência manual de `/painel` com a demonstração

**Tests**: none
**Gate**: build
**Commit**: `fix(painel): contar cadeiras ativas da Missão 2`

---

### T36: Teste de ponta a ponta com mandato antigo

**What**: Criar `e2e/migracao.spec.ts`: semear um mandato da versão antiga e conferir que nada se perde na escalação, no organograma, nas rotinas e nas contagens.
**Where**: `e2e/migracao.spec.ts`
**Depends on**: T35
**Reuses**: `app/teste-equipe/page.tsx` (`window.__semente`)
**Requirement**: MEQ-24

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Mandato com 20 `m2.f`, fichas e `m2.areas` abre com as 20 cadeiras ativas e nomes intactos (E-15)
- [ ] `m2.areas` continua gravada e não aparece na tela
- [ ] A contagem do Resumo e a do painel mostram o mesmo número que a tela
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 3 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `test(equipe): mandato da versão antiga abre sem perda de dados`

---

### T37: Arrastar caixa para definir a liderança (P3)

**What**: Em `Organograma.tsx`, arrastar uma caixa sobre outra mostra contorno no destino e, ao soltar, chama `defineLider`.
**Where**: `ilhas/equipe/Organograma.tsx`
**Depends on**: T36
**Reuses**: `defineLider`
**Requirement**: MEQ-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Soltar a caixa A sobre B define B como liderança de A e o painel mostra B (E-16)
- [ ] Soltar em ciclo mostra o erro e volta a caixa ao lugar
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 2 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): arrastar caixa para definir liderança`

---

### T38: Mover só a cadeira, sem a equipe (P3)

**What**: Em `Organograma.tsx`, com Ctrl pressionado ao soltar, mover só a cadeira e deixar as lideradas com a liderança anterior (repasse de `remove`, sem apagar).
**Where**: `ilhas/equipe/Organograma.tsx`
**Depends on**: T37
**Reuses**: `defineLider`, `liderDe`
**Requirement**: MEQ-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Ctrl + soltar move só a cadeira; as lideradas passam ao líder anterior (E-17)
- [ ] Sem Ctrl, as lideradas vão junto
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 2 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): mover cadeira sem a equipe com Ctrl`

---

### T39: Recolher subárvore (P3)

**What**: Em `Organograma.tsx`, botão "Recolher" em caixa com subordinados: esconde a subárvore, mostra o contador de escondidos, `aria-expanded` atualizado, fora da ordem de Tab.
**Where**: `ilhas/equipe/Organograma.tsx`
**Depends on**: T38
**Reuses**: `layoutOrg` (opção de cadeiras escondidas)
**Requirement**: MEQ-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Recolher esconde a subárvore e mostra "+N"; expandir devolve
- [ ] `aria-expanded` muda com o estado; Enter na caixa focada alterna
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 2 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): recolher e expandir subárvore do organograma`

---

### T40: Desfazer remoção (P3)

**What**: Acrescentar a `lib/cadeiras.ts` `restaura` (lê `m2.arq.{n}`) e, em `Organograma.tsx`, o aviso "Cadeira removida. Desfazer" por 10 s.
**Where**: `lib/cadeiras.ts`
**Depends on**: T39
**Reuses**: `remove`, `m2.arq.{n}`
**Requirement**: MEQ-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `restaura` devolve a cadeira com nome e ficha idênticos e as lideradas voltam à liderança anterior (teste unitário novo)
- [ ] Desfazer em até 10 s restaura a cadeira na tela (E-18)
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 2 testes unitários e 1 e2e novos, nenhum removido

**Tests**: unit
**Gate**: full
**Commit**: `feat(equipe): desfazer remoção de cadeira por 10 segundos`

---

### T41: Visão por área (P3)

**What**: Em `Organograma.tsx`, botão "Visão por área" que mostra só as cadeiras da área escolhida e a chefia de ligação.
**Where**: `ilhas/equipe/Organograma.tsx`
**Depends on**: T40
**Reuses**: `layoutOrg` (opção `soArea`)
**Requirement**: MEQ-15

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Escolher Comunicação mostra só as cadeiras de Comunicação e a Chefia de gabinete como ligação (E-19)
- [ ] "Mostrar todas" volta ao organograma completo
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; 2 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(equipe): visão do organograma por área`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7

Phase 1:  T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10
Phase 2:  T11 → T12
Phase 3:  T13 → T14 → T15 → T16 → T17 → T18
Phase 4:  T19 → T20 → T21 → T22 → T23
Phase 5:  T24 → T25 → T26 → T27 → T28 → T29 → T30
Phase 6:  T31 → T32 → T33 → T34 → T35 → T36
Phase 7:  T37 → T38 → T39 → T40 → T41
```

Execução estritamente sequencial. Os requisitos P1 e P2 terminam na T36; a Fase 7 é P3 e pode ser adiada.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1-T4 | 1 arquivo (`lib/cadeiras.ts`), 1 grupo de funções coesas cada | ✅ Granular |
| T5-T7 | 1 arquivo (`lib/rotinas.ts`), 1 grupo cada | ✅ Granular |
| T8-T10 | 1 arquivo de lib cada | ✅ Granular |
| T11-T12 | 1 config e 1 rota | ✅ Granular |
| T13 | 1 hook | ✅ Granular |
| T14-T18 | 1 componente cada (T14 acrescenta 1 linha de registro em `ponte.tsx`) | ✅ Granular |
| T19 | 1 módulo | ✅ Granular |
| T20-T23 | 1 componente ou 1 mudança coesa no mesmo componente | ✅ Granular |
| T24-T30 | 1 aba ou 1 componente cada | ✅ Granular |
| T31-T36 | 1 arquivo cada | ✅ Granular |
| T37-T41 | 1 comportamento no mesmo componente cada | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T2-T10 | tarefa anterior da fase | seta da anterior | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T12 (fase anterior) | início da fase 3 | ✅ Match |
| T14-T18 | tarefa anterior | seta da anterior | ✅ Match |
| T19 | T18 (fase anterior) | início da fase 4 | ✅ Match |
| T20-T23 | tarefa anterior | seta da anterior | ✅ Match |
| T24 | T23 (fase anterior) | início da fase 5 | ✅ Match |
| T25-T30 | tarefa anterior | seta da anterior | ✅ Match |
| T31 | T30 (fase anterior) | início da fase 6 | ✅ Match |
| T32-T36 | tarefa anterior | seta da anterior | ✅ Match |
| T37 | T36 (fase anterior) | início da fase 7 | ✅ Match |
| T38-T41 | tarefa anterior | seta da anterior | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1-T10 | `lib/*.ts` | unit | unit | ✅ OK |
| T11-T12 | config e rota de teste | e2e (fumaça) | e2e | ✅ OK |
| T13 | hook de ligação | none | none | ✅ OK |
| T14-T18 | `ilhas/equipe/*.tsx` | e2e | e2e | ✅ OK |
| T19 | `foco.ts` | unit | unit | ✅ OK |
| T20-T30 | `ilhas/equipe/*.tsx` | e2e | e2e | ✅ OK |
| T31, T33, T35 | `page.tsx`, `novos.js`/`ponte.tsx`, `painel.html` | none | none | ✅ OK |
| T32, T34 | `public/legacy/m2.js` | unit (vm) | unit | ✅ OK |
| T36 | e2e de migração | e2e | e2e | ✅ OK |
| T37-T39, T41 | `Organograma.tsx` | e2e | e2e | ✅ OK |
| T40 | `lib/cadeiras.ts` + UI | unit (maior: e2e) | unit, gate full com e2e | ✅ OK |
