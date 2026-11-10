# Área do Mandato Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/area-do-mandato/spec.md` (mini spec; sem design formal, a abordagem está abaixo)
**Status**: Draft
**Branch**: `feat/area-do-mandato` (criada a partir de `origin/main` d7521a7), no worktree `C:/Users/brand/Desktop/Dev Apps/area-mandato-wt`

## Abordagem (substitui o design.md)

- A "Área do mandato" é a tela `#/config` do Guia. O Guia roteia por hash em `App.rotear` (`public/legacy/app.js`, extraído, não se edita); o override entra em `public/legacy/acesso.js` (escrito à mão): `Telas.config` passa a desenhar a casca com as abas (`#/config`, `#/config/dados`, `#/config/equipe`, `#/config/conta`) e o rótulo do menu muda para "Área do mandato" por override de `App.lateral`.
- As abas Visão geral, Equipe e Minha conta são ilhas React (`ilhas/`, registradas em `ILHAS` de `ilhas/ponte.tsx`, emitidas como `<div class="ilha" data-ilha="...">`). Elas reaproveitam os componentes de `app/mandato/` (`Atividade`, `ResumoEquipe`, `equipe/*`), que leem `useMandato()`. Um provedor novo (`app/mandato/ProvedorLegado.tsx`) entrega esse contexto a partir do estado do Guia (`Store.mandato`, `Store.membros`, `Store.usuario`, sessão `legisla.tok`), sem a casca antiga.
- A aba Dados é o formulário legado `Cad.abrir('editar')` (`public/legacy/cadastro.js`, escrito à mão), desenhado dentro do contêiner da aba em vez de em `#tela`, com a "Zona de risco" (Excluir cadastro) em bloco separado no fim.
- `/mandato` e `/mandato/equipe` viram redirects em `next.config.mjs`. A volta do login Google do Guia perde o hash hoje (`Nuvem.google` usa `origin + pathname`): o override guarda o hash em `sessionStorage` e o restaura na volta.

Regras que valem para todas as tasks:

- Trabalhe SOMENTE no worktree `C:/Users/brand/Desktop/Dev Apps/area-mandato-wt` (branch `feat/area-do-mandato`). A pasta principal `Projeto 100 dias` é compartilhada com outras sessões: não a toque. Rode `npm ci` em `plataforma/` do worktree na primeira task.
- Todos os comandos de teste rodam dentro de `plataforma/` do worktree. Playwright em porta própria (3100): crie um `playwright.isolado.config.ts` (não versionado, nunca commitar; apague no fim) com `baseURL: 'http://localhost:3100'` e `webServer.reuseExistingServer: true`, suba `npx next dev -p 3100` fora do Playwright (o Next 16 pode interromper o primeiro start com um aviso: suba de novo) e pare o servidor no fim.
- Commits só com caminhos explícitos (`git add <arquivo>`), nunca `git add -A` ou `git add .`.
- Antes de escrever código Next.js, ler o guia correspondente em `node_modules/next/dist/docs/` (regra de `plataforma/AGENTS.md`).
- Imports em `lib/` e `tests/` são relativos e terminam em `.ts` (AD-004).
- `public/legacy/nucleo.js`, `app.js`, `guia.js`, `conteudo.js`, `resumo.js` e `lib/legacyBody.ts` NÃO se editam à mão (AD-003). Mudanças no Guia entram em `public/legacy/acesso.js`, `cadastro.js`, `novos.js` (escritos à mão) ou nas ilhas.
- Esta feature não faz `git push`, não aplica migration e não faz deploy. Não há migration nova. Publicar exige go-ahead explícito.
- Todas as mensagens e textos de tela seguem literalmente a spec.
- Nenhuma permissão muda: o que o banco já recusa continua recusado; a tela só reorganiza.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `plataforma/AGENTS.md`, `plataforma/CLAUDE.md` (seção Testes do admin e worktree isolado), `plataforma/package.json`, `plataforma/playwright.config.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Lógica pura (`lib/mandato/*.ts`) | unit | Todos os ramos; 1:1 com os critérios; cada caso de borda | `plataforma/tests/mandato-*.test.ts` | `npm test` |
| Ajustes no Guia legado (`public/legacy/acesso.js`, `cadastro.js`) | unit (vm, padrão `legado-*.test.ts`) + e2e | Cada ajuste provado no arquivo e na tela; nenhum texto do Guia fora do escopo muda | `plataforma/tests/legado-acesso.test.ts`, `plataforma/e2e/area-*.spec.ts` | `npm test` e `npx playwright test -c playwright.isolado.config.ts e2e/area-` |
| Ilhas e componentes React (`ilhas/`, `app/mandato/`) | e2e (Playwright, Supabase interceptado) | Todas as rotas da task: caminho feliz, cada borda e cada erro da spec; nenhuma chamada sem mapa | `plataforma/e2e/area-*.spec.ts` | `npx playwright test -c playwright.isolado.config.ts e2e/area-` |
| Redirects (`next.config.mjs`) | e2e | Cada redirect com destino e status | `plataforma/e2e/area-*.spec.ts` | idem |
| Documentação (`.specs/STATE.md`) | none | - (gate de build apenas) | - | gate de build apenas |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks com teste de unidade | `npm test` |
| Full | Tasks com e2e | `npm test` e `npx playwright test -c playwright.isolado.config.ts <specs da task>` |
| Build | Última task de cada fase e tasks sem teste | `npx tsc --noEmit`, `npm test` e `npx playwright test -c playwright.isolado.config.ts e2e/area-* e2e/mandato-* e2e/convite-* e2e/guia-acesso* e2e/primeiro-acesso* e2e/admin-*` (os specs que já existirem) |

`npm test` pode abortar arquivos `sql-*` do PGlite por falta de memória com a máquina carregada (`Fatal process out of memory`): repita esses arquivos sozinhos antes de investigar.

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Casca com abas e contexto

```
T1 → T2
```

### Phase 2: Conteúdo das abas

```
T2 → T3 → T4 → T5 → T6
```

### Phase 3: Endereços antigos, limpeza e documentação

```
T6 → T7 → T8 → T9
```

---

## Task Breakdown

### T1: Casca da Área do mandato com abas e rota

**What**: Fazer `#/config` desenhar a casca com as 4 abas, rotear `#/config/<aba>`, renomear o item do menu e dar a navegação por teclado.
**Where**: `plataforma/public/legacy/acesso.js` (modify)
**Depends on**: none
**Reuses**: override de `Telas.config` em `cadastro.js:695`; padrão de override e de testes `tests/legado-acesso.test.ts`
**Requirement**: AMA-01, AMA-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O item do menu "Configurações" vira "Área do mandato", no mesmo grupo Mandato, e fica marcado como ativo em todas as abas (AMA-01.1, 01.7)
- [x] `#/config` mostra a casca com as abas `Visão geral`, `Dados do mandato`, `Equipe e convites` e `Minha conta`, com a Visão geral ativa; `#/config/dados`, `#/config/equipe` e `#/config/conta` abrem a aba correspondente; aba desconhecida abre a Visão geral (AMA-01.2, 01.3, 01.6)
- [x] Clicar em uma aba troca o conteúdo sem recarregar e atualiza o hash; o Voltar do navegador volta à aba anterior (AMA-01.4, 01.5)
- [x] A casca usa `tablist`, `tab` e `tabpanel`, `aria-selected` na aba ativa, setas esquerda e direita movem o foco e ativam a vizinha, Home e End vão à primeira e à última (AMA-04.1, 04.2)
- [x] A lista de abas rola dentro do próprio contêiner em 400 px, sem rolagem horizontal da página (AMA-04.3)
- [x] Cada aba tem um contêiner próprio vazio (`#areaVisao`, `#areaDados`, `#areaEquipe`, `#areaConta`) para as tasks seguintes; o texto "Equipe e convites (N)" já usa `Store.membros.length` (AMA-02.7)
- [x] `app.js`, `nucleo.js` e `lib/legacyBody.ts` seguem sem edição
- [x] Gate check passes: `npm test` e `npx playwright test -c playwright.isolado.config.ts e2e/area-mandato.spec.ts`
- [x] Test count: ao menos 10 testes novos entre `tests/legado-acesso.test.ts` (vm) e `e2e/area-mandato.spec.ts`, nenhum removido; os testes existentes que citam "Configurações" são atualizados só no texto do rótulo

**Tests**: unit
**Gate**: full

**Commit**: `feat(area-mandato): add tabbed shell to the Guia config screen`

**Status**: ✅ Done

---

### T2: Provedor do mandato para as ilhas

**What**: Criar o provedor que entrega o contexto de `useMandato()` a partir do estado do Guia, mais a função pura que converte o mandato do Guia.
**Where**: `plataforma/lib/mandato/legado.ts` (new), `plataforma/app/mandato/ProvedorLegado.tsx` (new)
**Depends on**: T1
**Reuses**: `app/mandato/contexto.ts` (`ContextoMandato`), `app/mandato/sessaoApi.ts` (`criaAutenticada`), `lib/admin/sessao.ts`, `lib/admin/config.ts`; `ilhas/ponte.tsx` (`useLegado`, `mandato()`)
**Requirement**: AMA-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `lib/mandato/legado.ts` converte `Store.mandato` e `Store.membros` do Guia em `MandatoDaPessoa` com o papel da própria pessoa, e devolve erro tratável quando falta mandato, membros ou usuário (AMA-02.10)
- [x] `ProvedorLegado` monta `ContextoMandato` com `api` autenticada que renova a sessão no 401, `usuario` do Guia e o mandato ativo do Guia; `escolhe` não faz nada (o seletor de mandato é do Guia)
- [x] Ao trocar o mandato no Guia a ilha remonta e recarrega os dados do novo mandato, sem restos do anterior (Edge Case: troca de mandato)
- [x] Falha ao montar o contexto mostra "Não foi possível carregar. Tente de novo." com botão "Tentar de novo" e nunca libera botão de edição
- [x] Gate check passes: `npm test`
- [x] Test count: ao menos 8 testes novos em `tests/mandato-legado.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick

**Commit**: `feat(area-mandato): add legacy-backed mandate context provider`

**Status**: ✅ Done

---

### T3: Aba Visão geral

**What**: Criar a ilha `area-visao` com o cartão do mandato, o papel, o resumo da equipe e a atividade, sem missões, mais o aviso de data de posse.
**Where**: `plataforma/ilhas/AreaVisao.tsx` (new), `plataforma/ilhas/ponte.tsx` (modify), `plataforma/public/legacy/acesso.js` (modify), `plataforma/e2e/area-mandato.spec.ts` (modify), `plataforma/e2e/area-api.ts` (new)
**Depends on**: T2
**Reuses**: `app/mandato/AreaMandato.tsx` (cartão e foto), `app/mandato/ResumoEquipe.tsx`, `app/mandato/Atividade.tsx`, `lib/convites/*`
**Requirement**: AMA-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] A aba mostra o cartão do mandato (nome, cargo, UF, partido, posse, foto do TSE com iniciais de reserva), o papel da pessoa, o resumo da equipe e a atividade recente (AMA-02.1)
- [x] A aba NÃO mostra o andamento dos 100 dias nem as missões (AMA-02.1)
- [x] O botão "Convidar pessoa" do resumo abre a aba Equipe pelo hash `#/config/equipe` (sem recarregar)
- [x] Sem data de posse aparece "Informe a data de posse para acompanhar os prazos." com o link "Informar agora" para `#/config/dados` (AMA-02.2)
- [x] Falha da leitura mostra o erro da aba com "Tentar de novo" sem derrubar as outras abas (AMA-02.10)
- [x] O mock `e2e/area-api.ts` serve o Guia com nuvem em memória e os endpoints usados pelas abas; nenhuma chamada sem mapa (`naoMapeadas()`)
- [x] Gate check passes: `npm test` e `npx playwright test -c playwright.isolado.config.ts e2e/area-mandato.spec.ts`
- [x] Test count: ao menos 8 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(area-mandato): add overview tab`

**Status**: ✅ Done

---

### T4: Aba Equipe e convites

**What**: Criar a ilha `area-equipe` com a tela Equipe e convites completa.
**Where**: `plataforma/ilhas/AreaEquipe.tsx` (new), `plataforma/ilhas/ponte.tsx` (modify), `plataforma/public/legacy/acesso.js` (modify), `plataforma/e2e/area-equipe.spec.ts` (new)
**Depends on**: T3
**Reuses**: `app/mandato/equipe/Equipe.tsx` e filhos (`FormularioConvite`, `ListaConvites`, `ListaPessoas`, `SairDoMandato`), `e2e/area-api.ts`
**Requirement**: AMA-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] A aba mostra o formulário de convite, os pendentes, as pessoas e o "Sair do mandato", com as mesmas regras, mensagens e permissões de hoje (AMA-02.6)
- [x] Depois de "Sair do mandato", o Guia abre outro mandato da pessoa ou o primeiro acesso, como hoje (Edge Case)
- [x] O rótulo da aba mostra o total de pessoas e se atualiza quando alguém entra, sai ou é removido (AMA-02.7)
- [x] Para `leitura` a aba não mostra botão que altera (AMA-02.11)
- [x] Falha da leitura mostra o erro da aba com "Tentar de novo" (AMA-02.10)
- [x] Gate check passes: `npm test` e `npx playwright test -c playwright.isolado.config.ts e2e/area-equipe.spec.ts e2e/area-mandato.spec.ts`
- [x] Test count: ao menos 12 testes e2e novos cobrindo convidar, cancelar, trocar papel, remover, sair do mandato e o papel `leitura`, nenhum removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(area-mandato): add team and invites tab`

**Status**: ✅ Done

---

### T5: Aba Dados do mandato e Zona de risco

**What**: Desenhar o formulário legado de edição dentro da aba Dados e mover o "Excluir cadastro" para uma Zona de risco no fim.
**Where**: `plataforma/public/legacy/cadastro.js` (modify)
**Depends on**: T4
**Reuses**: `Cad.abrir('editar')`, `Cad.excluir`, `Store.excluirMandato`; trava de `leitura` de `acesso.js`
**Requirement**: AMA-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `Cad.abrir` aceita um contêiner de destino (padrão `#tela`, sem mudar nenhum outro uso) e a aba Dados desenha o formulário de edição em `#areaDados` com as mesmas regras e o botão "Salvar alterações" (AMA-02.3)
- [x] O "Excluir cadastro" aparece só para `coordenacao`, em bloco separado "Zona de risco" no fim da aba, com a confirmação de hoje; `assessoria` e `leitura` não veem o bloco (AMA-02.4, 02.5)
- [x] O bloco "Equipe e convites" e o texto "Seus dados" saem do formulário legado (agora são abas); nenhuma regra do formulário muda
- [x] Para `leitura` o formulário fica só para leitura (AMA-02.11)
- [x] O primeiro acesso (`#/` sem mandato) e "Cadastrar outro mandato" (`#/novo`) seguem iguais
- [x] Gate check passes: `npm test` e `npx playwright test -c playwright.isolado.config.ts e2e/area-mandato.spec.ts e2e/guia-acesso.spec.ts`
- [x] Test count: ao menos 10 testes novos entre unitário (vm) e e2e, nenhum removido; os testes legados do formulário seguem passando

**Tests**: unit
**Gate**: full

**Commit**: `feat(area-mandato): move mandate data form into its tab`

**Status**: ✅ Done

---

### T6: Aba Minha conta

**What**: Criar a ilha `area-conta` com o e-mail e o perfil da própria pessoa só para leitura.
**Where**: `plataforma/ilhas/AreaConta.tsx` (new), `plataforma/lib/mandato/conta.ts` (new), `plataforma/ilhas/ponte.tsx` (modify), `plataforma/e2e/area-conta.spec.ts` (new)
**Depends on**: T5
**Reuses**: `lib/perfil/opcoes.ts` (rótulos), `lib/perfil/api.ts` (`meuPerfil`), `lib/admin/api.ts`
**Requirement**: AMA-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `lib/mandato/conta.ts` formata o perfil para exibição (data `DD/MM/AAAA` sem passar por fuso, telefone `(11) 98765-4321`, rótulos de gênero, raça, UF e atuação) e é testada em `tests/mandato-conta.test.ts` (sem UF: `perfis` não tem UF; SPEC_DEVIATION em `lib/mandato/conta.ts`)
- [x] A aba mostra e-mail, nome, data de nascimento, gênero, raça, UF, telefone e atuação política em texto, sem campo editável, e "Para corrigir seus dados, escreva para contato@legislabrasil.org" (AMA-02.8) (sem UF, pelo mesmo motivo)
- [x] Quem não tem perfil (equipe Legisla) vê só o e-mail (AMA-02.9)
- [x] A consulta lê só `perfis` da própria pessoa (`user_id=eq.<id>`), sem pedir telefone nem nascimento de outros
- [x] Falha da leitura mostra o erro da aba com "Tentar de novo" (AMA-02.10)
- [x] Gate check passes: `npm test` e `npx playwright test -c playwright.isolado.config.ts e2e/area-conta.spec.ts`
- [x] Test count: ao menos 6 testes unitários e 6 e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(area-mandato): add account tab with read-only profile`

**Status**: ✅ Done

---

### T7: Endereços antigos e volta do login

**What**: Redirecionar `/mandato` e `/mandato/equipe`, ajustar os links e manter a aba pedida depois do login Google.
**Where**: `plataforma/next.config.mjs` (modify), `plataforma/app/primeiro-acesso/PrimeiroAcesso.tsx` (modify), `plataforma/public/legacy/acesso.js` (modify), `plataforma/e2e/area-redirects.spec.ts` (new)
**Depends on**: T6
**Reuses**: `lib/admin/sessao.ts`; `Nuvem.google` em `nucleo.js` (leitura; o override fica em `acesso.js`)
**Requirement**: AMA-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `/mandato` redireciona para `/guia#/config` e `/mandato/equipe` para `/guia#/config/equipe`, com redirect permanente do Next (AMA-03.1, 03.2)
- [x] O primeiro acesso com `volta=mandato` abre `/guia#/config` (AMA-03.3)
- [x] O Guia não tem mais link para `/mandato` nem `/mandato/equipe` (o botão "Abrir Equipe e convites" de `acesso.js` e qualquer outro) (AMA-03.4)
- [x] Sem sessão, o endereço antigo mostra a entrada com Google; o override guarda o hash em `sessionStorage` antes de sair para o Google e o restaura na volta, abrindo a aba pedida (AMA-03.5)
- [x] Gate check passes: `npm test` e `npx playwright test -c playwright.isolado.config.ts e2e/area-redirects.spec.ts e2e/primeiro-acesso.spec.ts e2e/guia-acesso.spec.ts`
- [x] Test count: ao menos 8 testes novos (e2e e vm), nenhum removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(area-mandato): redirect old mandate addresses to the Guia`

**Status**: ✅ Done

---

### T8: Migrar os testes e remover o código antigo

**What**: Mover os casos de `e2e/mandato-*.spec.ts` para a Área do mandato e remover as páginas e a casca antigas.
**Where**: `plataforma/app/mandato/` (modify), `plataforma/e2e/` (modify)
**Depends on**: T7
**Reuses**: `e2e/mandato-api.ts`, `e2e/mandato-area.spec.ts`, `e2e/mandato-casca.spec.ts`, `e2e/mandato-equipe.spec.ts`, `e2e/mandato-perfil.spec.ts`, `e2e/area-*.spec.ts`
**Requirement**: AMA-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Cada caso de `mandato-area`, `mandato-casca`, `mandato-equipe` e `mandato-perfil` que ainda vale está coberto por um teste em `e2e/area-*.spec.ts`; o que testava só a casca ou a tela antiga e deixou de existir sai, com a razão em cada commit (AMA-05.2)
- [x] Saem `app/mandato/page.tsx`, `app/mandato/equipe/page.tsx`, `app/mandato/Casca.tsx` e `app/mandato/layout.tsx`; ficam só os componentes e os arquivos que as abas reaproveitam (AMA-05.1)
- [x] A busca por `Casca` e pelas páginas antigas não acha uso; o redirect de T7 continua cobrindo os endereços
- [x] A cobertura dos casos migrados é conferida caso a caso em uma lista no corpo do commit (nenhum caso some sem justificativa)
- [x] Gate check passes: `npx tsc --noEmit`, `npm test` e todos os e2e do gate Build
- [x] Test count: contagem final registrada; nenhum caso de teste que ainda vale removido

**Tests**: e2e
**Gate**: build

**Commit**: `refactor(area-mandato): remove the old mandate pages and move their tests`

**Status**: ✅ Done

---

### T9: Registrar a feature no STATE.md

**What**: Registrar a decisão e as pendências no `STATE.md`.
**Where**: `.specs/STATE.md` (modify)
**Depends on**: T8
**Reuses**: formato dos AD existentes
**Requirement**: AMA-01, AMA-02, AMA-03, AMA-04, AMA-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Decisão `AD-015` registra: Área do mandato como tela única em `#/config` com 4 abas, ilhas reaproveitando os componentes de `app/mandato/`, redirects dos endereços antigos e hash guardado na volta do Google
- [x] Pendências listadas: editar o perfil pessoal, contador de convites pendentes na aba, seletor de mandato dentro da área
- [x] O Handoff aponta a branch, a última task e o próximo passo (Verifier independente)
- [x] Gate check passes: `npx tsc --noEmit` e `npm test`
- [x] Test count: sem teste novo; nenhum removido

**Tests**: none
**Gate**: build

**Commit**: `docs(area-mandato): record decisions and open items`

**Status**: ✅ Done

---

## Phase 4: Correções do Verifier (rodada 1)

Fix tasks dos gaps de `validation.md` (rodada 1). Decisões do usuário: GAP-1 opção B (a aba Equipe mantém as regras de hoje; spec corrigida, sem mudar o código) e GAP-4 desvio aceito (UF fora da Minha conta, sem migration).

```
T9 → T10 → T11 → T12
```

### T10: Aba Dados sem papel conhecido e aba Equipe sem mandato (GAP-2, GAP-3)

**What**: Na aba Dados, quando a leitura do papel falha (nuvem, sem a linha da própria pessoa em `Store.membros`), mostrar o erro da aba com "Tentar de novo" e nunca o formulário; cobrir com teste o Edge Case de abrir `#/config...` sem mandato ativo.
**Where**: `plataforma/public/legacy/acesso.js` (modify), `plataforma/tests/legado-acesso.test.ts`, `plataforma/e2e/area-mandato.spec.ts`, `plataforma/e2e/guia-acesso.spec.ts` (modify)
**Depends on**: T9
**Reuses**: `semLiaNosMembros` de `e2e/area-api.ts`, `abre` de `e2e/guia-acesso.spec.ts`
**Requirement**: AMA-02.10, AMA-02.11, Edge Cases (papel; sem mandato)

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Sem a linha da própria pessoa em membros (nuvem), `#/config/dados` mostra "Não foi possível carregar. Tente de novo." e o botão "Tentar de novo"; não há campo, "Salvar alterações" nem Zona de risco
- [x] "Tentar de novo" relê o mandato (`Store.abrir`) e, com o papel de volta, abre o formulário
- [x] Teste vm e e2e da aba Dados falham sem a correção; e2e abre `#/config/equipe` sem mandato e vai para `/primeiro-acesso`, sem `tablist` (GAP-3)
- [x] `validation.md`, `LESSONS.md` e `lessons.json` do Verifier entram neste commit
- [x] Gate check passes: `npx tsc --noEmit`, `npm test` e e2e `area-mandato`, `guia-acesso`
- [x] Test count: +2 e2e; unit sem mudança de contagem (1 reescrito)

**Tests**: unit, e2e
**Gate**: full

**Commit**: `fix(area-mandato): show the tab error when the role read fails on the Dados tab`

**Status**: ✅ Done

---

### T11: Spec: Equipe para leitura, UF e texto de erro (GAP-1, GAP-4, SP-1)

**What**: Corrigir a spec (AMA-02.11, AMA-02.8, AMA-02.10), cobrir com e2e o que quem é leitura vê na aba Equipe com convites pendentes e alinhar o texto de erro de leitura das abas.
**Where**: `.specs/features/area-do-mandato/spec.md`, `plataforma/app/mandato/*.tsx`, `plataforma/app/mandato/equipe/Equipe.tsx`, `plataforma/e2e/area-*.spec.ts` (modify)
**Depends on**: T10
**Reuses**: `e2e/area-equipe.spec.ts`
**Requirement**: AMA-02.8, AMA-02.10, AMA-02.11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] AMA-02.11 diz que a aba Equipe é exceção explícita: quem é leitura mantém as regras de AMA-02.6 (o banco recusa o que não pode); a premissa "Quem só lê" é corrigida
- [x] AMA-02.8 e a premissa "Minha conta" saem da UF, registradas como desvio aceito (`perfis` não tem UF; sem migration)
- [x] AMA-02.10 define um único texto, "Não foi possível carregar. Tente de novo.", com "Tentar de novo"; código e testes de leitura das abas o usam
- [x] e2e: papel leitura, convites pendentes (de outra pessoa): botão "Cancelar" visível, o banco recusa e a tela mostra o erro
- [x] Gate check passes: `npx tsc --noEmit`, `npm test` e e2e `area-`
- [x] Test count: +1 e2e (leitura com convite pendente); unit sem mudança

**Tests**: e2e
**Gate**: full

**Commit**: `docs(area-mandato): align the spec with the Equipe tab for readers, the UF deviation and the read error text`

**Status**: ✅ Done

---

### T12: Código morto e estabilidade dos e2e (Q-1, Q-2)

**What**: Remover `Telas.equipeHtml` (override em `acesso.js`) e seus testes se nada o usa; dar timeout explícito às esperas de ida para `/primeiro-acesso` e do diálogo da Zona de risco sob carga.
**Where**: `plataforma/public/legacy/acesso.js`, `plataforma/tests/legado-acesso.test.ts`, `plataforma/e2e/area-*.spec.ts` (modify)
**Depends on**: T11
**Reuses**: nenhum
**Requirement**: AMA-03.4, AMA-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Busca confirma que nada chama `Telas.equipeHtml`; o override de `acesso.js` e os 2 testes saem (o original de `cadastro.js`, anterior à feature e também sem uso, fica) (a varredura de AMA-03.4 dos scripts fica)
- [x] Os oito e2e de Q-2 usam timeout maior no `expect`, sem enfraquecer a asserção
- [x] Gate check passes: `npx tsc --noEmit`, `npm test` e todos os e2e do gate Build
- [x] Test count: unit 1158 -> 1157 (o teste de `equipeHtml` do modo local sai; o da varredura de AMA-03.4 fica sem a parte de `equipeHtml`)

**Tests**: unit, e2e
**Gate**: build

**Commit**: `refactor(area-mandato): remove the dead equipeHtml override and steady the navigation waits`

**Status**: ✅ Done
