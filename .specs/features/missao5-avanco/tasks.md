# Missão 5 · Garanta o avanço Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path.

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/missao5-avanco/spec.md`
**Design**: `.specs/features/missao5-avanco/design.md`
**Status**: Aprovado pelo usuário ("PODE EXECUTAR"); execução com sub-agentes em lotes de ~7 tarefas

Caminhos relativos a `plataforma/`. A árvore de trabalho tem mudanças do usuário não commitadas (`ilhas/Equipe.tsx`, `ilhas/equipe/Organograma.tsx`, `lib/types.ts`, `public/legacy/novos.js`, `public/legacy/guia.js`, `public/legacy/cadastro.js`, entre outras). Regras:

1. Cada commit usa `git add` com os arquivos nomeados da tarefa; nunca `git add -A`.
2. Antes de editar `ilhas/ponte.tsx` ou `lib/types.ts`, rodar `git diff` no arquivo e preservar a mudança do usuário.
3. `conteudo.js`, `guia.js`, `app.js`, `nucleo.js`, `resumo.js`, `novos.js` e `m2.js` não são editados (AD-003); ganchos novos ficam em `public/legacy/m5.js`.
4. Antes de criar rota nova de teste, ler o guia de rotas em `node_modules/next/dist/docs/` (regra de `plataforma/AGENTS.md`). Seguir o padrão da rota `app/teste-rumo/*`.
5. Textos da Missão 5 do `conteudo.js` são intocáveis: o teste da T6 compara o hash.
6. `git push` e deploy exigem go-ahead explícito; não fazem parte destas tarefas.
7. Rodar o Python do projeto pelo caminho `C:\Users\brand\AppData\Roaming\uv\tools\graphifyy\Scripts\python.exe` (o `python3` não existe nesta máquina).

---

## Test Coverage Matrix

> Baseada em `plataforma/CLAUDE.md` e no padrão da feature `missao3-rumo`: comandos `npm test`, `npx tsc --noEmit`, `npm run test:e2e`; imports relativos terminando em `.ts` nos testes.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Lógica pura (`lib/sucessos.ts`, `lib/feedback.ts`, `lib/ciclos.ts`, `lib/atingimento.ts`) | unit | Todos os ramos; 1:1 com os critérios M5; cada edge case tem teste | `tests/*.test.ts` | `npm test` |
| Ilhas React (`ilhas/rumo/*.tsx`) | e2e | Caminho feliz de cada tela que a tarefa cria + cada edge case que a spec lista para ela | `e2e/m5-*.spec.ts` | `npm run test:e2e` |
| Ganchos do legado (`public/legacy/m5.js`) | unit (`node:vm` com globais simuladas) | Cada override: entrada antiga e nova; hash dos textos da Missão 5 | `tests/legado-m5.test.ts` | `npm test` |
| Hook, `ponte.tsx`, CSS | none | - (exercitados pelos e2e das ilhas) | - | `npx tsc --noEmit` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tarefas só com testes unitários | `npm test` |
| Full | Tarefas de ilha, que têm teste e2e | `npm test && npx tsc --noEmit && npm run test:e2e` |
| Build | Fim de fase e tarefas com `Tests: none` | `npx tsc --noEmit && npm test && npm run test:e2e && npm run build` |

Observação: o `npm run build` oscila com `SecurityFatalError` do Next 16.4 (advisory conhecido). Se falhar só por isso, o gate Build vale como `npx tsc --noEmit && npm test && npm run test:e2e`, e a falha fica registrada na tarefa. O `tests/rumo.test.ts` do usuário tinha falha prévia por regex em `lib/rumo.ts`; se ainda falhar, registrar e não tocar.

---

## Execution Plan

Fases em ordem; tarefas em ordem dentro da fase. A seta que abre cada fase marca a dependência da última tarefa da fase anterior.

### Phase 1: Sucesso mensal

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: Monitoramento

```
T5 → T6
```

### Phase 3: Feedback

```
T6 → T7 → T8 → T9 → T10 → T11
```

### Phase 4: Novos planejamentos

```
T11 → T12 → T13 → T14 → T15 → T16
```

### Phase 5: Fechamento

```
T16 → T17 → T18
```

---

## Task Breakdown

### T1: Lógica dos sucessos mensais ✅

**What**: Criar `lib/sucessos.ts` com `lerSucessos` (normaliza sem mutar), `adicionaSucesso`, `editaSucesso`, `removeSucesso`, `porMes` e `atingidos`.
**Where**: `lib/sucessos.ts` (+ `tests/sucessos.test.ts`)
**Depends on**: None
**Reuses**: `StatusMeta` de `lib/rumo.ts`
**Requirement**: M5-01, M5-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `adicionaSucesso` cria sucesso com mês 1 a 4, texto e status `nao_concluida` (M5-01.1)
- [x] `editaSucesso` troca texto, mês ou status e não altera os outros (M5-01.2)
- [x] `removeSucesso` remove só o escolhido (M5-01.3)
- [x] `lerSucessos` de meta sem `sucessos` devolve lista vazia, sem mutar o objeto (M5-02.7)
- [x] `porMes` agrupa por mês na ordem 1 a 4
- [x] Gate: `npm test`; testes novos em `tests/sucessos.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m5): lógica dos sucessos mensais`

---

### T2: Atingimento calculado pelos sucessos ✅

**What**: Ajustar `lib/atingimento.ts` para que meta com sucessos use atingidos/total e meta sem sucessos use o status, como antes.
**Where**: `lib/atingimento.ts` (+ `tests/atingimento.test.ts`)
**Depends on**: T1
**Reuses**: `lib/sucessos.ts`
**Requirement**: M5-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Meta com 2 sucessos, 1 atingido, tem atingimento 50% (M5-02.5)
- [x] Meta sem sucessos mantém o cálculo atual pelo status (M5-02.6)
- [x] O atingimento do objetivo e o total usam o valor novo da meta
- [x] Gate: `npm test`; testes existentes de atingimento seguem passando

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m5): atingimento da meta pelos sucessos mensais`

---

### T3: Bloco de sucessos no cartão da meta ✅

**What**: Acrescentar ao cartão da meta, na Missão 3, o bloco "Sucessos mensais" com adicionar, editar (mês, texto, status) e remover.
**Where**: `ilhas/rumo/CartaoMeta.tsx` (+ `e2e/m5-sucessos.spec.ts`)
**Depends on**: T2
**Reuses**: `lib/sucessos.ts`, `ilhas/rumo/useRumo.ts`
**Requirement**: M5-01

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] "Adicionar sucesso" cria uma linha com mês e texto e grava na hora (M5-01.1)
- [x] Editar mês, texto ou status grava na hora (M5-01.2)
- [x] Remover tira só aquela linha (M5-01.3)
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; `e2e/m5-sucessos.spec.ts` criado

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m5): sucessos mensais no cartão da meta`

---

### T4: Sucessos na árvore do Planejamento ✅

**What**: Acrescentar na árvore da aba Planejamento o nível de sucessos por mês, com status editável e o novo atingimento.
**Where**: `ilhas/rumo/ArvorePlano.tsx` (+ `e2e/m5-sucessos.spec.ts`)
**Depends on**: T3
**Reuses**: `lib/sucessos.ts`, `lib/atingimento.ts`
**Requirement**: M5-02

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] Os sucessos aparecem dentro da meta, agrupados por mês, com status (M5-02.4)
- [x] Marcar 1 de 2 sucessos como atingido mostra 50% na meta (M5-02.5)
- [x] Meta antiga sem sucessos continua mostrando o status dela (M5-02.6)
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m5): sucessos por mês na árvore do planejamento`


**Registro**: Gate full: tsc ok, npm test 271/271, e2e 243 (3 testes de timing falharam uma vez sob carga na suíte inteira e passaram isolados: rumo-metas:199, rumo-migracao:206, rumo-plano:39).
---

### T5: Verificação da fase Sucesso mensal ✅

**What**: Rodar o gate Build da fase e registrar o resultado; sem código novo além de ajustes mínimos pedidos pelo gate.
**Where**: `.specs/features/missao5-avanco/tasks.md`
**Depends on**: T4
**Reuses**: gates da fase
**Requirement**: M5-01, M5-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `npx tsc --noEmit`, `npm test` e `npm run test:e2e` passam
- [x] Resultado do `npm run build` registrado (ou falha só por `SecurityFatalError`)
- [x] `graphify update .` executado

**Tests**: none
**Gate**: build
**Commit**: `chore(m5): fecha a fase de sucesso mensal`


**Registro**: tsc sem erros; npm test 271/271; e2e 243 (ver T4); npm run build falhou só pelo aviso de segurança do Next 16.4 (SecurityFatalError, advisory conhecido), sem erro de código. graphify update executado; graphify-out/ fora do commit.
---

### T6: Monitoramento com link para o Planejamento ✅

**What**: Criar `public/legacy/m5.js` com o gancho que acrescenta o botão "Abrir Planejamento Estratégico" na tarefa de monitoramento, sem alterar os textos.
**Where**: `public/legacy/m5.js` (+ `tests/legado-m5.test.ts`)
**Depends on**: T5
**Reuses**: padrão de `public/legacy/m3.js`
**Requirement**: M5-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] A tarefa mostra o botão que navega para `#/plano` (M5-10.2)
- [x] O hash dos textos da Missão 5 no `conteudo.js` é igual ao de antes (M5-10.1)
- [x] `m5.js` é carregado depois de `m3.js` na página do Guia
- [x] Gate: `npm test`; testes novos em `tests/legado-m5.test.ts`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m5): link do monitoramento para o planejamento`

---

### T7: Lógica do mapa de feedback ✅

**What**: Criar `lib/feedback.ts` com `mapaFeedback` (liderança → liderados), `contagens`, `registra`, `edita`, `apaga` e `migraAntigo`.
**Where**: `lib/feedback.ts` (+ `tests/feedback.test.ts`)
**Depends on**: T6
**Reuses**: `lib/cadeiras.ts`
**Requirement**: M5-20, M5-21

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `mapaFeedback` devolve cada liderança com seus liderados e o total N (M5-20.1)
- [x] `contagens` devolve feitas X de N e marca cada pessoa como feita ou pendente (M5-20.2)
- [x] `registra`, `edita` e `apaga` atualizam `D.feedbacks` e as contagens (M5-21.4, M5-21.5)
- [x] `migraAntigo` converte `pessoa/lider/data/pontos/encam` sem perder texto (M5-21.7)
- [x] Conversa de pessoa que saiu da Missão 2 é mantida como "pessoa removida"
- [x] Gate: `npm test`; testes novos em `tests/feedback.test.ts`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m5): lógica do mapa de feedback`

---

### T8: Mapa de feedback (nível 1) ✅

**What**: Criar a ilha `rumo-feedback` com o mapa do organograma: cada liderança com "dá feedback a N pessoas" e "feitas X de N".
**Where**: `ilhas/rumo/Feedback.tsx` (+ `e2e/m5-feedback.spec.ts`)
**Depends on**: T7
**Reuses**: `lib/feedback.ts`, desenho de `ilhas/equipe/Organograma.tsx`
**Requirement**: M5-20

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] O mapa mostra cada liderança com o texto "dá feedback a N pessoas" e "feitas X de N" (M5-20.1)
- [x] A ilha é registrada em `ilhas/ponte.tsx` e usada na tarefa de feedback via `m5.js`
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m5): mapa do organograma no feedback`

---

### T9: Lista de pessoas e registro da conversa ✅

**What**: Ao clicar na liderança, listar as pessoas (feita/pendente); ao clicar na pessoa, abrir o formulário da conversa; salvar, editar e apagar.
**Where**: `ilhas/rumo/Feedback.tsx` (+ `e2e/m5-feedback.spec.ts`)
**Depends on**: T8
**Reuses**: `lib/feedback.ts`
**Requirement**: M5-20, M5-21

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] Clicar na liderança lista as pessoas marcadas "feita" ou "pendente" (M5-20.2)
- [x] O formulário tem data, destaques, ajustes e plano de ação (M5-21.3)
- [x] Salvar marca a pessoa como feita e atualiza a contagem (M5-21.4)
- [x] Editar e apagar atualizam as contagens (M5-21.5)
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m5): registro das conversas de feedback`

---

### T10: Estado vazio e versão celular do feedback ✅

**What**: Mostrar o aviso com link para a Missão 2 quando não há cadeiras ativas e a lista vertical em tela estreita.
**Where**: `ilhas/rumo/Feedback.tsx` (+ `e2e/m5-feedback.spec.ts`)
**Depends on**: T9
**Reuses**: `lib/cadeiras.ts`
**Requirement**: M5-20

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] Sem cadeiras ativas aparece o aviso com link para a Missão 2 (M5-20.6)
- [x] Em largura de celular o mapa vira lista vertical (M5-20.8)
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m5): feedback sem equipe e no celular`

---

### T11: Verificação da fase Feedback ✅

**What**: Rodar o gate Build da fase, conferir o fluxo completo e registrar o resultado.
**Where**: `.specs/features/missao5-avanco/tasks.md`
**Depends on**: T10
**Reuses**: gates da fase
**Requirement**: M5-20, M5-21

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `npx tsc --noEmit`, `npm test` e `npm run test:e2e` passam
- [x] Resultado do `npm run build` registrado
- [x] `graphify update .` executado

**Tests**: none
**Gate**: build
**Commit**: `chore(m5): fecha a fase de feedback`

**Registro**: tsc sem erros; npm test 301/301; e2e 276 passados (varios testes de timing oscilaram sob carga e passaram na repeticao); npm run build falhou so por SecurityFatalError do Next 16.4 (advisory conhecido), sem erro de codigo. graphify update executado; graphify-out/ fora do commit.

---

### T12: Lógica dos ciclos de planejamento ✅

**What**: Criar `lib/ciclos.ts` com `arquivarEIniciar` (guarda o plano atual em `D.planos`, mantém Legado/bandeiras/objetivos/preditores, copia as metas escolhidas sem sucessos), `listaCiclos` e `abrirCiclo`.
**Where**: `lib/ciclos.ts` (+ `tests/ciclos.test.ts`)
**Depends on**: T11
**Reuses**: `lib/rumo.ts`, `lib/sucessos.ts`
**Requirement**: M5-30

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `arquivarEIniciar` guarda uma cópia congelada do plano atual em `D.planos` (M5-30.4)
- [x] O novo plano mantém Legado, bandeiras, objetivos e preditores (M5-30.4)
- [x] Só as metas escolhidas são copiadas, sem sucessos (M5-30.4)
- [x] Criar o 2º e o 3º plano não altera nenhum plano anterior (M5-30, M5-31.7)
- [x] Cancelar não altera nada (edge case da spec)
- [x] Gate: `npm test`; testes novos em `tests/ciclos.test.ts`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m5): lógica de ciclos de planejamento`

---

### T13: Botão e confirmação de novo planejamento ✅

**What**: Criar a ilha `NovoCiclo` com o botão "Criar novo planejamento", a confirmação e a escolha de metas a copiar.
**Where**: `ilhas/rumo/NovoCiclo.tsx` (+ `e2e/m5-ciclos.spec.ts`)
**Depends on**: T12
**Reuses**: `lib/ciclos.ts`
**Requirement**: M5-30

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] O botão pede confirmação e lista as metas para copiar (M5-30.3)
- [x] Confirmar cria o novo planejamento com as metas escolhidas (M5-30.4)
- [x] Cancelar não altera nada
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m5): botão de criar novo planejamento`

---

### T14: Botão na Calibragem e na aba Planejamento ✅

**What**: Colocar o botão no fim da tarefa "Calibragem e replanejamento" (via `m5.js`) e na aba Planejamento, sem remover nenhum texto ou checklist.
**Where**: `public/legacy/m5.js` (+ `tests/legado-m5.test.ts`)
**Depends on**: T13
**Reuses**: ilha `NovoCiclo`
**Requirement**: M5-31

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] A tarefa mostra os textos e o checklist atuais e, ao final, o botão (M5-31.1)
- [x] A aba Planejamento mostra o botão (M5-31.2)
- [x] O hash dos textos da Missão 5 segue igual
- [x] Gate: `npm test`; testes novos em `tests/legado-m5.test.ts`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m5): botão de novo planejamento na calibragem e no plano`

---

### T15: Seletor de planejamentos e leitura dos arquivados ⬜

**What**: Acrescentar o seletor "Planejamento 1, 2, 3…" na aba Planejamento e abrir os arquivados somente para leitura.
**Where**: `ilhas/rumo/Plano.tsx` (+ `e2e/m5-ciclos.spec.ts`)
**Depends on**: T14
**Reuses**: `lib/ciclos.ts`, `ilhas/rumo/ArvorePlano.tsx`
**Requirement**: M5-31

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [ ] Com mais de um planejamento aparece o seletor com o atual marcado (M5-31.5)
- [ ] O arquivado abre sem campos editáveis (M5-31.6)
- [ ] Sem metas aparece o estado vazio sem erro
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m5): seletor de planejamentos e leitura dos arquivados`

---

### T16: Fluxo de vários planejamentos de ponta a ponta ⬜

**What**: Teste e2e que cria o 2º e o 3º planejamento e confere que o 1º não mudou.
**Where**: `e2e/m5-ciclos.spec.ts`
**Depends on**: T15
**Reuses**: rota de teste das ilhas
**Requirement**: M5-30, M5-31

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Criar 2 novos planejamentos deixa os anteriores idênticos e somente leitura (M5-31.7)
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e && npm run build` (com a ressalva do `SecurityFatalError`)

**Tests**: e2e
**Gate**: build
**Commit**: `test(m5): fluxo de vários planejamentos`

---

### T17: Rastreabilidade e atualização do grafo ⬜

**What**: Atualizar a tabela de rastreabilidade da spec (7 de 7 mapeados) e rodar `graphify update .`.
**Where**: `.specs/features/missao5-avanco/spec.md`
**Depends on**: T16
**Reuses**: nenhum
**Requirement**: M5-01, M5-02, M5-10, M5-20, M5-21, M5-30, M5-31

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Cada M5-xx aparece com status "Done" e a tarefa que o cobre
- [ ] `graphify update .` executado sem erro

**Tests**: none
**Gate**: build
**Commit**: `docs(m5): rastreabilidade da spec`

---

### T18: Estado e handoff ⬜

**What**: Registrar no `.specs/STATE.md` a decisão de dados (AD-005: planos arquivados em `D.planos`) e atualizar o Handoff.
**Where**: `.specs/STATE.md`
**Depends on**: T17
**Reuses**: formato dos AD existentes
**Requirement**: M5-30

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] AD-005 escrito em `## Decisions` sem apagar os anteriores
- [ ] Só o corpo de `## Handoff` foi substituído

**Tests**: none
**Gate**: build
**Commit**: `docs(m5): decisão AD-005 e handoff`
