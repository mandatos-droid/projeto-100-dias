# Missão 5 · Monitoramento e Feedback conforme a Alana — Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path.

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: [spec.md](spec.md) · **Design**: [design.md](design.md)
**Status**: Aprovado pelo usuário ("pode executar"). Worktree: `Dev Apps/m5-monitoramento-wt`, branch `feat/m5-monitoramento-alana`, sobre o `origin/main`.

Caminhos relativos a `plataforma/`. Regras:

1. Cada commit usa `git add` com os arquivos nomeados da tarefa; nunca `git add -A`.
2. `conteudo.js`, `guia.js`, `app.js`, `nucleo.js`, `resumo.js`, `novos.js` e `m2.js` não são editados; ganchos novos ficam em `public/legacy/m5.js`.
3. Antes de criar rota nova de teste, ler o guia de rotas em `node_modules/next/dist/docs/` (regra de `plataforma/AGENTS.md`).
4. `git push` e deploy não fazem parte destas tarefas e exigem go-ahead explícito.
5. Os testes de `tests/legado-m5.test.ts` que descrevem o monitoramento antigo (M5-10.2 e "corpo original continua inteiro") passam a descrever o novo comportamento pedido pela Alana: são atualizados na T3, com o motivo no commit.
6. Python do projeto: `C:\Users\brand\AppData\Roaming\uv\tools\graphifyy\Scripts\python.exe`.

---

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Pattern |
| ---------- | ------------------ | -------------------- | ------- |
| `lib/*.ts` (funções puras) | unit | Uma asserção por AC, valor igual ao da spec | `tests/feedback.test.ts` |
| `public/legacy/m5.js` (ganchos) | unit em `vm` | Saída HTML e efeitos sobre globais simuladas | `tests/legado-m5.test.ts` |
| `ilhas/rumo/*.tsx` | e2e | Caminho feliz + borda por rota | `e2e/*.spec.ts` |

---

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Só testes unitários | `npm test` |
| Full | Tarefas de ilha, com e2e | `npm test && npx tsc --noEmit && npm run test:e2e` |
| Build | Fim de fase e tarefas sem testes | `npx tsc --noEmit && npm test && npm run test:e2e && npm run build` |

Observação: o `npm run build` oscila com `SecurityFatalError` do Next 16.4 (advisory conhecido). Se falhar só por isso, o Build vale como `npx tsc --noEmit && npm test && npm run test:e2e`, e a falha fica registrada na tarefa.

---

## Execution Plan

### Phase 1: Base

```
T1 → T2
```

### Phase 2: Monitoramento

```
T2 → T3 → T4
```

### Phase 3: Feedback

```
T4 → T5 → T6
```

### Phase 4: Fechamento

```
T6 → T7 → T8
```

---

## Task Breakdown

### T1: Verificar as premissas do design ✅

**What**: Confirmar no código que (1) `resumo.js` e `guia.js` leem `CAMPOS_MONIT` na hora de desenhar; (2) `Campos.ligar` grava `[data-k]` em `D.campos` com `Store.salvar()`; (3) o percentual de uma meta com sucessos é atingidos/total (`lib/sucessos.ts`, `atingidos`).
**Where**: `design.md` (seção Riscos)
**Depends on**: None
**Requirement**: MON-03, MON-04

**Done when**:

- [x] (1) confirmado: `resumo.js:68` e `guia.js:434,445,449` leem `CAMPOS_MONIT` dentro das funções de desenho
- [x] (2) confirmado: `guia.js:154-166`
- [x] (3) confirmado: `lib/sucessos.ts:49`; sucesso congelado fica fora da conta
- [x] Achado: os testes M5-10.2 e "corpo original" de `tests/legado-m5.test.ts` descrevem o comportamento antigo (regra 5)

**Tests**: none
**Gate**: build
**Commit**: `docs(m5): registrar as premissas verificadas do monitoramento`

---

### T2: Textos da Alana ✅

**What**: Criar `ilhas/rumo/textosAlana.ts` com os textos das sugestões #128, #129, #130 e #131, copiados como a Alana escreveu (sem a linha "Pedro Salvar orientação…").
**Where**: `ilhas/rumo/textosAlana.ts` (+ `tests/textosAlana.test.ts`)
**Depends on**: T1
**Requirement**: MON-01, FBK-01

**Done when**:

- [x] Exporta `MONIT_INTRO` (#129), `MONIT_ROTULO` e `MONIT_PERGUNTAS` (#128), `FEEDBACK_ORIENTACAO` (#130), `BOTAO_MONIT` (#131)
- [x] `FEEDBACK_ORIENTACAO` não contém "Pedro Salvar" e contém "Chefia de Gabinete" e "liderança parlamentar" (Q7, Q9)
- [x] `MONIT_INTRO` contém "o percentual corresponde ao todo, e não ao mês" (#129)
- [x] Testes novos em `tests/textosAlana.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m5): textos da Alana para monitoramento e feedback`

---

### T3: Monitoramento no m5.js

**What**: Reescrever `CAMPOS_MONIT` com o campo único `det`; substituir `Comp.monit` (texto #129, passo a passo, botão "Abrir Planejamento Estratégico", cartão por meta com percentual só leitura e link "alterar", três meses em sanfona com a ajuda da #128 acima de cada caixa); tratar `window.MonitFoco`.
**Where**: `public/legacy/m5.js`, `tests/legado-m5.test.ts`
**Depends on**: T2
**Reuses**: `Campos.ligar` (`data-k`), classes `din`, `idx`, `campo`, `rot`, `aj`, `rm-st`
**Requirement**: MON-01, MON-03, MON-04

**Done when**:

- [ ] Depois do `m5.js`, `CAMPOS_MONIT` tem 1 campo, chave `det` (MON-04, AD-2)
- [ ] O HTML do monitoramento contém o texto #129, o botão "Abrir Planejamento Estratégico" com `href="#/plano"` e não contém a tabela original (MON-01.1, MON-01.2)
- [ ] Para cada meta há 3 caixas com `data-k="mon.<idMeta>.<mes>.det"`, mes 1 a 3, e a ajuda #128 visível antes de cada uma (MON-03.1)
- [ ] O cartão mostra o percentual da meta (status em passos de 10%, ou atingidos/total com sucessos) e o link "alterar" para `#/plano` (MON-03.3)
- [ ] Sem metas, mostra o aviso atual de que as metas aparecem ali (MON-03.4)
- [ ] Com `window.MonitFoco` = id de uma meta existente, o cartão dela sai aberto e marcado para rolar; id inexistente é ignorado (MON-02.2)
- [ ] O hash do `conteudo.js` segue igual (AD-1)
- [ ] Testes M5-10.2 e "corpo original" atualizados para o comportamento novo (regra 5); nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m5): monitoramento com uma caixa por meta e por mês`

---

### T4: Botão e links no Planejamento

**What**: Botão "Registrar detalhes sobre o atingimento das metas no Monitoramento" no topo do Planejamento; link "Detalhar no Monitoramento" em cada meta; ambos escondidos no plano arquivado; grava `window.MonitFoco` antes de ir para `#/m/5/m5.monit`.
**Where**: `ilhas/rumo/Plano.tsx`, `ilhas/rumo/ArvorePlano.tsx` (se preciso), `e2e/` (spec novo)
**Depends on**: T3
**Requirement**: MON-02

**Done when**:

- [ ] O botão aparece junto do atingimento total e leva a `#/m/5/m5.monit` (MON-02.1, MON-02.2)
- [ ] O link de uma meta leva ao Monitoramento já na meta dela (MON-02.2)
- [ ] Sem foco, o Monitoramento abre no topo (MON-02.2)
- [ ] No planejamento arquivado nem o botão nem os links aparecem (MON-02.3)
- [ ] E2E novo cobre os quatro casos acima

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m5): botão para o monitoramento na aba Planejamento`

---

### T5: Modelo da conversa de Feedback

**What**: `Conversa` ganha `d1`, `d2`, `a1`, `a2` opcionais; `registra`, `edita`, `migraAntigo` e `paraGuia` ajustados; `destaques` e `ajustes` derivados dos novos.
**Where**: `lib/feedback.ts`, `tests/feedback.test.ts`
**Depends on**: T4
**Requirement**: FBK-01

**Done when**:

- [ ] `registra` com `d1`, `d2`, `a1`, `a2` grava os quatro e deriva `destaques = "d1\nd2"` e `ajustes = "a1\na2"`, ignorando os vazios (FBK-01.2, FBK-01.5)
- [ ] `edita` de um dos quatro campos atualiza também o derivado
- [ ] Conversa antiga (só `destaques`/`ajustes`) lê com `d1`/`a1` iguais a esses valores (risco do design)
- [ ] `paraGuia` continua devolvendo `pontos` e `encam` com o texto dos campos novos (FBK-01.5)
- [ ] Todos os campos são opcionais: registrar com tudo vazio não lança erro (Q13)
- [ ] Testes novos em `tests/feedback.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m5): campos de destaque e ajuste separados na conversa de feedback`

---

### T6: Tela de Feedback

**What**: Orientação (#130) e aviso de acesso restrito antes do mapa; formulário com os 6 campos opcionais e a ajuda da Alana em cada um; edição de conversa antiga usa `destaques`/`ajustes` como `d1`/`a1`.
**Where**: `ilhas/rumo/Feedback.tsx`, `ilhas/rumo/feedback.css`, `e2e/` (spec novo ou existente de feedback)
**Depends on**: T5
**Requirement**: FBK-01

**Done when**:

- [ ] A orientação (#130) e o aviso de acesso restrito aparecem antes do mapa do organograma (FBK-01.1, FBK-01.4)
- [ ] O formulário tem data, destaque 1, destaque 2, ajuste 1, ajuste 2 e resumo do plano, e salva com qualquer um vazio (FBK-01.2, Q13)
- [ ] Salvar, editar e apagar atualizam "feitas X de Y" e feita/pendente (FBK-01.3)
- [ ] Nada é bloqueado: o formulário abre para qualquer usuário com acesso (FBK-01.4, Q6, Q7)
- [ ] E2E cobre os quatro casos acima; testes de e2e antigos de feedback seguem passando

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m5): orientação da Alana e seis campos no feedback`

---

### T7: Resumo reflete o texto novo

**What**: Conferir que o Resumo do Preenchimento lista o "Detalhamento do mês" por meta e por mês e o Feedback com os campos novos (efeito da AD-2 e do `paraGuia`); só mexer em código se a conferência falhar.
**Where**: `tests/legado-m5.test.ts` (teste de integração em `vm` com `resumo.js`)
**Depends on**: T6
**Requirement**: MON-04

**Done when**:

- [ ] Com `m5.js` e `resumo.js` carregados e `D.campos["mon.<id>.2.det"]` preenchido, o HTML do Resumo contém "Detalhamento do mês" e o texto, sob a meta certa (MON-04.1)
- [ ] O Resumo de uma conversa nova mostra os destaques e ajustes digitados

**Tests**: unit
**Gate**: quick
**Commit**: `test(m5): resumo do preenchimento mostra o monitoramento e o feedback novos`

---

### T8: Fechamento: rastreabilidade, grafo e validação

**What**: Marcar o status em `spec.md` (tabela de rastreabilidade) e `tasks.md`; rodar `graphify update .`; deixar para o Pedro a revisão das três telas (validation.md é escrito pelo Verifier).
**Where**: `spec.md`, `tasks.md`
**Depends on**: T7
**Requirement**: MON-01, MON-02, MON-03, MON-04, FBK-01

**Done when**:

- [ ] Todas as linhas da rastreabilidade em `Done`
- [ ] `npx tsc --noEmit && npm test && npm run test:e2e` passam
- [ ] `graphify update .` rodou

**Tests**: none
**Gate**: build
**Commit**: `docs(m5): fechar rastreabilidade do monitoramento conforme a Alana`
