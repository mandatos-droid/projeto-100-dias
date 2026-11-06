# Painel do Administrador Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/painel-admin/design.md`
**Spec**: `.specs/features/painel-admin/spec.md`
**Status**: Draft

Caminhos relativos a `plataforma/`. A árvore tem mudanças do usuário não commitadas (`graphify-out/`, entre outras): cada commit usa `git add` com os arquivos da task, nunca `git add -A`. As fases 1 a 5 entregam P1 e P2 da spec; a fase 6 entrega o registro de uso (P3), com migration própria. **Nenhuma migration vai para produção sem go-ahead:** o push na `main` aplica `supabase/migrations/**` pelo workflow `migrations.yml`.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `plataforma/AGENTS.md` (ler `node_modules/next/dist/docs/` antes de escrever rota ou layout), `plataforma/CLAUDE.md` (testes em `tests/` com `node --test`, imports relativos terminando em `.ts`; e2e em Playwright), `playwright.config.ts`, `.github/workflows/migrations.yml`. Amostras de teste existentes: `tests/*.test.ts` (unit) e `e2e/*.spec.ts` (e2e); o repo não tinha teste de SQL; o ambiente PGlite (T1 e T2) é novo, por decisão do usuário em 2026-11-05. A fidelidade ao Supabase real não é total (extensões e `auth.users` são simulados).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Migration SQL | integration | Cada AC de banco tem um caso: papel certo, papel errado (leitura), anônimo, borda e falha da auditoria; roda no PGlite com `auth` simulado | `tests/sql-*.test.ts` | `npm test` |
| Lógica pura (`lib/admin/*.ts`, `lib/uso.ts`) | unit | Todos os ramos; 1:1 com as ACs; cada edge case listado tem teste | `tests/admin-*.test.ts`, `tests/uso.test.ts` | `npm test` |
| Páginas e e2e (`app/admin/**`, `ilhas/ponte.tsx`) | e2e | Cada tela: caminho feliz, bordas listadas e erros; chamadas ao Supabase interceptadas | `e2e/admin-*.spec.ts` | `npx playwright test e2e/admin-` |
| Componentes compartilhados, layout, CSS, docs | none | Cobertos pelos e2e das telas que os usam; gate de build | - | `npx tsc --noEmit` |
| Helper de e2e | none | Código de apoio dos e2e; exercitado por eles | - | `npx tsc --noEmit` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks só com testes unitários ou de SQL (PGlite) | `npm test` |
| Full | Tasks de e2e e de tela com e2e | `npm test && npx tsc --noEmit && npx playwright test e2e/admin-` |
| Build | Tasks de componente, layout, CSS, docs e fim de fase | `npx tsc --noEmit && npm test && npm run build` |

Observação: o `npm run build` oscila com `SecurityFatalError` do Next 16.4 (advisory conhecido, registrado no Handoff do `STATE.md`). Se falhar só por isso, o gate Build vale como `npx tsc --noEmit && npm test` mais `next dev` respondendo 200 nas rotas tocadas, e a falha fica registrada na task.

---

## Execution Plan

Fases em ordem; cada fase termina antes da próxima; tarefas em ordem dentro da fase.

### Phase 1: Banco de dados

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: Lógica pura e acesso ao banco

```
T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13 → T14
```

### Phase 3: Acesso, casca e lista de mandatos

```
T15 → T16 → T17 → T18 → T19 → T20 → T21
```

### Phase 4: Equipe e detalhe do mandato

```
T22 → T23 → T24 → T25 → T26
```

### Phase 5: Analytics e logs

```
T27 → T28 → T29 → T30
```

### Phase 6: Registro de uso (P3)

```
T31 → T32 → T33 → T34 → T35
```

### Phase 7: Fechamento

```
T36 → T37
```

---

## Task Breakdown

### T1: Dependência do Postgres embutido

**What**: Adicionar o PGlite (Postgres em WebAssembly) como devDependency para os testes de SQL.
**Where**: `package.json`
**Depends on**: None
**Reuses**: devDependencies existentes
**Requirement**: ADM-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `@electric-sql/pglite` instalado como devDependency com versão fixada (sem `^`), e `package-lock.json` atualizado no mesmo commit
- [x] `npx tsc --noEmit` e `npm test` seguem passando com a mesma contagem de testes de antes

**Tests**: none
**Gate**: build

**Commit**: `build(admin): add pglite for sql tests`

---

### T2: Ambiente de teste de SQL

**What**: Helper que sobe o PGlite, simula `auth` e os roles do Supabase, aplica as migrations em ordem e troca de usuário, com o teste do próprio ambiente.
**Where**: `tests/sql-ambiente.ts`
**Depends on**: T1
**Reuses**: `supabase/migrations/*.sql`; `private.eh_*` do schema inicial
**Requirement**: ADM-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Exporta `criaBanco()` (aplica todas as migrations de `supabase/migrations/` em ordem), `como(banco, uuid | null)` (define `request.jwt.claim.sub` e o role `authenticated` ou `anon`) e `semente(banco)` com 2 mandatos, 1 admin, 1 leitura e 1 membro de gabinete
- [x] Simula `auth.users`, `auth.uid()` e os roles `anon` e `authenticated`; qualquer extensão do Supabase que alguma migration use e não rode no PGlite é simulada, ou o motivo é registrado nesta task
- [x] `tests/sql-ambiente.test.ts` prova que o ambiente reproduz o RLS atual: membro do gabinete vê só o próprio mandato; anônimo não lê nada; admin da equipe lê todos; ≥ 5 casos passam
- [x] Se o PGlite não aplicar alguma migration existente, parar e levar o problema ao usuário; as migrations antigas não são alteradas

**Tests**: integration
**Gate**: quick

**Commit**: `test(admin): add pglite sql test environment`

---

### T3: Migration de equipe, papéis e auditoria

**What**: Migration 1 do design: papéis `admin`/`leitura`, `auditoria_admin`, `private.audita` e as funções de gestão da equipe, com o teste de SQL.
**Where**: `supabase/migrations/20261105120000_admin_equipe.sql`
**Depends on**: T2
**Reuses**: molde de `20261020130000_excluir_mandato.sql`; `private.eh_legisla*`
**Requirement**: ADM-02, ADM-03, ADM-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Os testes usam o ambiente da T2 (PGlite); nada roda em produção
- [x] `papel` aceita só `admin` e `leitura`; linhas `analista` viram `leitura`
- [x] `equipe_ler` usa `private.eh_legisla()`; política `equipe_gerir` e grants de escrita a `authenticated` removidos
- [x] `auditoria_admin` só aceita inclusão (sem grant nem política de update/delete) e só `eh_legisla()` lê
- [x] `admin_equipe`, `admin_buscar_usuario` (e-mail exato, 1 linha, só admin), `admin_equipe_incluir`, `admin_equipe_papel`, `admin_equipe_remover` gravam a auditoria na mesma transação e recusam último admin ("A equipe precisa ter ao menos um admin."), duplicado ("Esta pessoa já está na equipe.") e alvo ausente ("Pessoa não encontrada.")
- [x] Teste `tests/sql-admin-equipe.test.ts` (PGlite) cobre: admin e leitura leem a equipe; leitura recusado em cada função; anônimo sem dados; update e delete em `auditoria_admin` falham; falha na auditoria desfaz a ação; ≥ 12 casos passam

**Tests**: integration
**Gate**: quick

**Commit**: `feat(admin): add equipe migration with roles and audit`

---

### T4: Migration de leitura de mandatos e analytics

**What**: Migration 2 do design: `arquivado_em`, catálogo `exercicios_guia` com os 16 exercícios e as views `v_admin_*`, com o teste de SQL e o teste do catálogo.
**Where**: `supabase/migrations/20261105130000_admin_leitura.sql`
**Depends on**: T3
**Reuses**: molde de `v_panorama` (`schema_inicial.sql:256`); `MISSOES` de `public/painel.html:351`
**Requirement**: ADM-05, ADM-06, ADM-09, ADM-10, ADM-11, ADM-12, ADM-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `mandatos.arquivado_em` criada; `exercicios_guia` semeada com 16 linhas (missões 4, 2, 4, 3 e 3) e títulos em UTF-8 correto
- [x] `v_admin_mandatos`, `v_admin_exercicios`, `v_admin_eventos_mes`, `v_admin_atividade` e `v_admin_uso_campos` criadas com `security_invoker = true` e `where private.eh_legisla()`; `anon` sem acesso
- [x] Nenhuma view tem as colunas `dados`, `texto`, `nome_civil` nem `resp_telefone` (o teste consulta `information_schema.columns`)
- [x] `ultima_atividade` = maior entre `atualizado_em` e o último `eventos.criado_em`; `mes` no fuso `America/Sao_Paulo`
- [x] Mapa de campos de `v_admin_uso_campos` conferido contra o código das ilhas e registrado nesta task
- [x] `tests/admin-catalogo.test.ts` compara os ids do seed com os de `MISSOES` em `painel.html` (unit, ≥ 3 casos) e passa
- [x] Teste `tests/sql-admin-leitura.test.ts` (PGlite): gabinete fora da equipe recebe 0 linhas; admin e leitura recebem as linhas esperadas; mandato arquivado some de `v_admin_exercicios`; ≥ 8 casos passam

**Tests**: integration
**Gate**: quick

**Commit**: `feat(admin): add read views and exercise catalog`

**Mapa de `v_admin_uso_campos` (conferido contra `ilhas/*.tsx` e `lib/types.ts`)**: persona = `tse`, `relacoes` ou `pleitos` preenchidos; conjuntura = `conj2` com algo além do vazio inicial (muns, posicao, prefExtra, relacao, relacaoPq, desafios ou oportunidades); município = `munSel` escolhido; eleitorado = `eleitorado.itens` não vazio; social = `social.itens` não vazio; cadeiras = `campos` com `m2.on` ou `m2.f{n}` com texto. Conjuntura, Eleitorado e Social criam a estrutura vazia ao abrir a ilha, por isso a presença da chave não prova uso.

---

### T5: Migration de gestão de mandatos e membros

**What**: Migration 3 do design: funções de membros, arquivar e excluir, gatilho de `arquivado_em`, com o teste de SQL.
**Where**: `supabase/migrations/20261105140000_admin_mandatos_gestao.sql`
**Depends on**: T4
**Reuses**: molde de `excluir_mandato`; `private.audita` da T3
**Requirement**: ADM-07, ADM-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `admin_membros`, `admin_membro_adicionar`, `admin_membro_papel`, `admin_membro_remover` só para admin, com auditoria; recusam duplicado ("Esta pessoa já é membro deste mandato.") e última coordenação ("O mandato precisa de ao menos uma pessoa na coordenação.")
- [x] `admin_mandato_arquivar(p_id, p_arquivar)` grava ou limpa `arquivado_em` e audita; os membros seguem acessando o mandato
- [x] `admin_mandato_excluir(p_id, p_codigo)` recusa código diferente, apaga em cascata e deixa `sugestoes.mandato_id` nulo; a auditoria guarda código e nome parlamentar
- [x] Gatilho em `mandatos` recusa mudança de `arquivado_em` a quem não é admin da Legisla (membro do gabinete é recusado)
- [x] Teste `tests/sql-admin-mandatos.test.ts` (PGlite): leitura recusado em todas as funções; trava de coordenação; código errado; cascata; gatilho; ≥ 12 casos passam

**Tests**: integration
**Gate**: quick

**Commit**: `feat(admin): add mandate management functions`

---

### T6: Escala de dias

**What**: Constante da escala 7/15/30/45 e cálculo de dias parado.
**Where**: `lib/admin/escala.ts`
**Depends on**: None
**Reuses**: padrão de `lib/*.ts` puro (AD-004)
**Requirement**: ADM-05, ADM-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `ESCALA_DIAS` = 7, 15, 30, 45; `diasParado(ultima, agora)` devolve dias inteiros no fuso de Brasília
- [x] `tests/admin-escala.test.ts` cobre 0 dia, fronteira de 45 dias, data futura e virada de mês; ≥ 5 casos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(admin): add day scale helpers`

---

### T7: Mensagens e validação de e-mail

**What**: Mapa de erro do banco para mensagem em português e `emailValido`.
**Where**: `lib/admin/mensagens.ts`
**Depends on**: T6
**Reuses**: textos da spec
**Requirement**: ADM-03, ADM-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `mensagemDe` devolve a mensagem do banco quando existe, "Você não tem permissão para esta ação." em 403 e "Não foi possível carregar." em 5xx ou rede
- [x] `emailValido` recusa vazio, sem arroba e sem domínio; constantes `SEM_CONTA` e `EMAIL_INVALIDO` com o texto da spec
- [x] `tests/admin-mensagens.test.ts` ≥ 6 casos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(admin): add error messages and email check`

---

### T8: Leitura da configuração do banco

**What**: `lerConfig` extrai URL e chave de `nucleo.js` e `carregaConfig` a busca em `/legacy/nucleo.js`.
**Where**: `lib/admin/config.ts`
**Depends on**: T7
**Reuses**: expressão de `public/painel.html:837`
**Requirement**: ADM-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `lerConfig` devolve `{url, key}` do bloco `prod`; erro claro se o formato faltar
- [x] `tests/admin-config.test.ts` roda `lerConfig` contra o `public/legacy/nucleo.js` real e contra texto sem o bloco; ≥ 3 casos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(admin): read supabase config from nucleo`

---

### T9: Sessão: ler, gravar e renovar

**What**: Funções de sessão sobre `legisla.tok`, retorno do Google e login por senha.
**Where**: `lib/admin/sessao.ts`
**Depends on**: T8
**Reuses**: fluxo de `public/painel.html:831-896`
**Requirement**: ADM-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `lerSessao`/`gravaSessao` recebem o `storage` por parâmetro e usam a chave `legisla.tok` no mesmo formato do Guia
- [x] `lerRetornoGoogle(hash)` aceita `access_token` e `error_description`; `renova` usa o `refresh_token`
- [x] `tests/admin-sessao.test.ts` com `storage` falso e `fetch` falso; ≥ 6 casos passam (sessão ausente, JSON inválido, retorno do Google, erro do Google, renovação ok e falha)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(admin): add session helpers`

---

### T10: Cliente da API

**What**: `criaApi` com `ler` e `rpc` sobre `fetch`, com `ErroApi`.
**Where**: `lib/admin/api.ts`
**Depends on**: T9
**Reuses**: `Nuvem.rest` de `nucleo.js:46`
**Requirement**: ADM-01, ADM-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Envia `apikey` e `Authorization: Bearer <token>`; `rpc` faz POST em `/rest/v1/rpc/<nome>`
- [x] Lança `ErroApi {status, mensagem}` com a mensagem do corpo (`message`) quando existe
- [x] `tests/admin-api.test.ts` com `fetch` falso; ≥ 6 casos passam (cabeçalhos, corpo vazio 204, 401, 403, 500, rede)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(admin): add supabase api client`

---

### T11: Filtros e páginas de mandatos

**What**: Busca sem acento, filtros combinados, parado há N e paginação.
**Where**: `lib/admin/mandatos.ts`
**Depends on**: T10
**Reuses**: `escala.ts`
**Requirement**: ADM-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `filtraMandatos` combina busca (código ou nome, sem acento e sem maiúsculas), UF, casa, situação e "Parado há"
- [x] `paginaDe` fatia 25 por página e não cria página extra com exatamente 25
- [x] `tests/admin-mandatos.test.ts` ≥ 10 casos passam (acento, UF+casa, arquivados, parado, lista vazia, 25 itens, 26 itens)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(admin): add mandate filters and paging`

---

### T12: Indicadores e status mensal

**What**: Indicadores do topo e o gráfico de status por mês.
**Where**: `lib/admin/analytics.ts`
**Depends on**: T11
**Reuses**: `escala.ts`
**Requirement**: ADM-09, ADM-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `indicadores` devolve cadastrados, ativos no período, média de exercícios concluídos (sobre 16) e parados; ignora arquivados e respeita a UF
- [x] `statusMensal` classifica Ativo/Parado por mês no fuso `America/Sao_Paulo`, do mês do primeiro cadastro ao atual, no máximo 12 meses; sem mandatos devolve lista vazia
- [x] `tests/admin-analytics.test.ts` ≥ 10 casos passam (virada de mês e de fuso, mandato criado no meio do mês, 13 meses, arquivado, UF)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(admin): add indicators and monthly status`

---

### T13: Funil e travas

**What**: Funil das 5 missões e tabela de travas por exercício.
**Where**: `lib/admin/funil.ts`
**Depends on**: T12
**Reuses**: regra de `public/painel.html:784-795`
**Requirement**: ADM-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `funil` conta como concluída a missão com todos os seus exercícios em `ok`
- [x] `travas` usa "alcançaram" = concluíram o anterior na ordem do Guia (primeiro: todos); abandono = (alcançaram − concluíram) ÷ alcançaram arredondado; ordem decrescente; até 10; omite alcançaram = 0
- [x] `tests/admin-funil.test.ts` ≥ 10 casos passam (missão incompleta por 1 exercício, arredondamento .5, exercício fora de ordem, 0 alcançaram, empate)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(admin): add mission funnel and bottlenecks`

---

### T14: Uso por funcionalidade (campos)

**What**: Tabela de "mandatos que usaram" pelos campos já preenchidos.
**Where**: `lib/admin/usoFuncionalidades.ts`
**Depends on**: T13
**Reuses**: `v_admin_uso_campos` da T4
**Requirement**: ADM-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `usoPorFuncionalidade(campos)` devolve as 6 linhas da Fase 1 com mandatos que usaram; `aberturas` e `tendencia` ficam `null` sem registro de uso
- [x] `tests/admin-uso-funcionalidades.test.ts` ≥ 5 casos passam (zero mandatos, todos, um só, arquivado fora)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(admin): add feature usage from filled fields`

---

### T15: Estilo do painel

**What**: CSS escopado sob `.adm` com a paleta da Legisla e layout do wireframe, incluindo 360 px.
**Where**: `app/admin/admin.css`
**Depends on**: None
**Reuses**: `app/landing.css` sob `.ld`; `--vinho` e `--papel` de `legacy.css`
**Requirement**: ADM-16

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Todas as regras sob `.adm`; menu lateral vira faixa superior abaixo de 620 px; tabelas rolam dentro de `.adm .rolagem`; alvos de toque com no mínimo 40 px
- [x] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `feat(admin): add scoped admin styles`

---

### T16: Layout do `/admin`

**What**: Layout que importa `admin.css`, define o título e envolve as telas em `.adm`.
**Where**: `app/admin/layout.tsx`
**Depends on**: T15
**Reuses**: `app/guia/layout.tsx`
**Requirement**: ADM-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Antes de escrever, ler `node_modules/next/dist/docs/` sobre layouts e CSS (regra do `AGENTS.md`)
- [x] `metadata.title` "Admin · Legisla Brasil"; renderiza `<div class="adm">` com `children`
- [x] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `feat(admin): add admin layout`

---

### T17: Sessão e papel na interface

**What**: Componente que entrega token, papel e estados: entrada, "Sem acesso" e volta à entrada em 401.
**Where**: `app/admin/_componentes/Sessao.tsx`
**Depends on**: T16
**Reuses**: `lib/admin/sessao.ts`, `config.ts`, `api.ts`
**Requirement**: ADM-01, ADM-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Sem sessão: formulário de entrada (Google e e-mail e senha) e nenhuma consulta de mandatos
- [x] Com sessão sem linha em `equipe_legisla`: "Sem acesso" e nenhuma consulta a views de mandatos
- [x] Aproveita `legisla.tok`; renova token vencido; qualquer 401 volta à entrada
- [x] Contexto expõe `{ api, papel, sair }`; lê o papel de `equipe_legisla` a cada abertura
- [x] Gate Build passa (cobertura nos e2e da T21)

**Tests**: none
**Gate**: build

**Commit**: `feat(admin): add session provider and access states`

---

### T18: Casca com menu

**What**: Cabeçalho com nome e papel, menu Equipe, Mandatos, Analytics e Logs e link para `/painel`.
**Where**: `app/admin/_componentes/Casca.tsx`
**Depends on**: T17
**Reuses**: wireframe `wireframes/painel-admin.html`
**Requirement**: ADM-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Menu destaca a tela atual; link "Painel de métricas (/painel)" presente
- [x] Mostra o papel da pessoa; botão Sair
- [x] Gate Build passa (cobertura nos e2e da T21)

**Tests**: none
**Gate**: build

**Commit**: `feat(admin): add shell with menu`

---

### T19: Helper de e2e do `/admin`

**What**: Semear sessão, interceptar `/rest/v1`, `/auth/v1` e registrar o que trafega.
**Where**: `e2e/admin-api.ts`
**Depends on**: T18
**Reuses**: `e2e/semente.ts`, `e2e/guia-real.ts`
**Requirement**: ADM-01, ADM-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Exporta `semeiaSessao(page, papel)`, `moca(page, estado)` e `vazou(): string[]` (chaves `dados`, `texto`, `nome_civil`, `resp_telefone` em qualquer resposta)
- [x] Carrega o `nucleo.js` real; as chamadas ao Supabase nunca saem da máquina
- [x] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `test(admin): add e2e supabase mock helper`

---

### T20: Tela Mandatos

**What**: Lista de mandatos com busca, filtros (UF, casa, situação, "Parado há"), destaque de parado e paginação, com o e2e `e2e/admin-mandatos.spec.ts`.
**Where**: `app/admin/page.tsx`
**Depends on**: T19
**Reuses**: `lib/admin/mandatos.ts`, `escala.ts`, `Casca`
**Requirement**: ADM-05, ADM-16

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Antes de escrever, ler `node_modules/next/dist/docs/` sobre páginas client (regra do `AGENTS.md`)
- [x] Lê só `v_admin_mandatos`; 25 por página; "X dias parado" em destaque; estado vazio com "Limpar filtros"; botão Ver leva a `/admin/mandatos/[id]`
- [x] Erro de rede mostra "Tentar de novo"
- [x] Spec `e2e/admin-mandatos.spec.ts` criado nesta task
- [x] Cobre: 25 por página e exatamente 25; busca sem acento; combinação de filtros; escala 7/15/30/45 muda a lista; destaque de parado; vazio com limpar filtros; `vazou()` vazio
- [x] ≥ 8 testes passam

**Tests**: e2e
**Gate**: full

**Commit**: `feat(admin): add mandates list page`

---

### T21: e2e de acesso e papéis

**What**: Testes de tela do acesso, dos papéis e da sessão.
**Where**: `e2e/admin-acesso.spec.ts`
**Depends on**: T20
**Reuses**: `e2e/admin-api.ts`
**Requirement**: ADM-01, ADM-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Cobre (adiado e coberto na T23 em `e2e/admin-equipe.spec.ts`: "escrita recusada com 403 mostra o aviso" e seletores de papel desabilitados para leitura; "escrita de leitura recusada com 403 mostra o aviso" e os seletores de papel desabilitados só podem ser exercidos quando houver botão de escrita e seletor de papel, nas telas das T23 e T26; aqui há asserção de que nenhum botão de alteração nem seletor de papel habilitado existe para leitura): sem sessão (entrada, nenhuma chamada de mandatos); conta fora da equipe ("Sem acesso"); leitura (nenhum botão de alteração, seletores desabilitados); admin; abre em Mandatos; 401 volta à entrada; token vencido é renovado; escrita de leitura recusada com 403 mostra o aviso
- [x] ≥ 8 testes passam

**Tests**: e2e
**Gate**: full

**Commit**: `test(admin): add access and roles e2e`

---

### T22: Diálogo reutilizável

**What**: Diálogo modal e de confirmação com botão desabilitado durante o envio.
**Where**: `app/admin/_componentes/Dialogo.tsx`
**Depends on**: None
**Reuses**: `Casca`
**Requirement**: ADM-03, ADM-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Foco preso e fecha com Esc; `confirmar` desabilita o botão enquanto a chamada está em curso (evita duplo clique)
- [x] Gate Build passa (cobertura nos e2e das T23 e T26) (`npm run build` falhou só por `SecurityFatalError` do Next 16.4; valeu `tsc` + `npm test` e `/admin` respondendo 200)

**Tests**: none
**Gate**: build

**Commit**: `feat(admin): add dialog component`

---

### T23: Tela Equipe

**What**: Lista da equipe, incluir por e-mail, trocar papel e remover, com o e2e `e2e/admin-equipe.spec.ts`.
**Where**: `app/admin/equipe/page.tsx`
**Depends on**: T22
**Reuses**: `lib/admin/mensagens.ts`, `Dialogo`, funções da T3
**Requirement**: ADM-03, ADM-16

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Lista nome, e-mail, papel e entrada em ordem crescente, para admin e leitura
- [x] Admin: incluir (busca por e-mail, mensagens de sem conta, já na equipe e e-mail inválido), trocar papel e remover com confirmação; leitura vê a lista sem botões
- [x] Mensagens "A equipe precisa ter ao menos um admin." e "Pessoa não encontrada." exibidas como vêm do banco
- [x] Spec `e2e/admin-equipe.spec.ts` criado nesta task
- [x] Cobre: incluir ok; e-mail sem conta; já na equipe; e-mail inválido sem chamada ao banco; trocar papel; remover com confirmação; último admin recusado; duplo clique envia uma vez; leitura sem botões
- [x] ≥ 9 testes passam

**Tests**: e2e
**Gate**: full

**Commit**: `feat(admin): add team page`

---

### T24: Membros do mandato

**What**: Tabela de membros com adicionar, editar papel e remover.
**Where**: `app/admin/_componentes/Membros.tsx`
**Depends on**: T23
**Reuses**: `Dialogo`, funções da T5
**Requirement**: ADM-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Lista nome, e-mail, papel (`coordenacao` ou `assessoria`) e entrada
- [x] Admin: adicionar por e-mail, trocar papel, remover com confirmação; mensagens de sem conta, já é membro e última coordenação
- [x] Gate Build passa (cobertura no e2e da T26) (`npm run build` falhou só por `SecurityFatalError` do Next 16.4; valeu `tsc` + `npm test`)

**Tests**: none
**Gate**: build

**Commit**: `feat(admin): add mandate members component`

---

### T25: Zona de risco

**What**: Arquivar, desarquivar e excluir definitivamente com confirmação pelo código.
**Where**: `app/admin/_componentes/ZonaRisco.tsx`
**Depends on**: T24
**Reuses**: `Dialogo`, funções da T5
**Requirement**: ADM-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Botão "Excluir definitivamente" desabilitado enquanto o texto difere do código do mandato
- [x] Arquivar e desarquivar chamam `admin_mandato_arquivar`; excluir chama `admin_mandato_excluir` e volta à lista
- [x] Gate Build passa (cobertura no e2e da T26) (`npm run build` compila e gera as rotas, mas falha no fim só por `SecurityFatalError` do Next 16.4; valeu `tsc` + `npm test`)

**Tests**: none
**Gate**: build

**Commit**: `feat(admin): add archive and delete controls`

---

### T26: Tela Detalhe do mandato

**What**: Cadastro, andamento, aviso de privacidade, membros e zona de risco, com o e2e `e2e/admin-detalhe.spec.ts`.
**Where**: `app/admin/mandatos/[id]/page.tsx`
**Depends on**: T25
**Reuses**: `useParams`, `Membros`, `ZonaRisco`, `v_admin_mandatos`
**Requirement**: ADM-06, ADM-07, ADM-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Antes de escrever, reler `use-params.md` e `dynamic-routes.md` do Next 16 (regra do `AGENTS.md`)
- [x] Cadastro, missões concluídas de 5, exercícios feitos de 16 e última atividade; nunca exibe `dados`, `eventos.texto`, `nome_civil` nem `resp_telefone`
- [x] Spec `e2e/admin-detalhe.spec.ts` criado nesta task
- [x] Cobre: nenhum texto de gabinete na tela; adicionar, editar e remover membro; última coordenação recusada; membro duplicado; arquivar e desarquivar; excluir só com o código exato; leitura sem botões; `vazou()` vazio
- [x] ≥ 10 testes passam

**Tests**: e2e
**Gate**: full

**Commit**: `feat(admin): add mandate detail page`

---

### T27: Gráficos

**What**: Colunas empilhadas, colunas simples e barras horizontais com título, unidade, eixo e legenda.
**Where**: `app/admin/_componentes/Grafico.tsx`
**Depends on**: None
**Reuses**: estilos de gráfico do wireframe
**Requirement**: ADM-10, ADM-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Todo gráfico recebe `titulo` e `unidade` obrigatórios e mostra legenda quando há mais de uma série
- [x] Eixo com valores; contagem dentro de cada segmento; estado vazio com texto próprio
- [x] Gate Build passa (cobertura no e2e da T28). `npm run build` falhou só por SecurityFatalError (advisory conhecido do Next 16.4, depois de compilar); valeu tsc + npm test (694 passam)

**Tests**: none
**Gate**: build

**Commit**: `feat(admin): add chart component`

---

### T28: Tela Analytics

**What**: Filtros de período e UF, indicadores, status mensal, funil, travas e uso por funcionalidade, com o e2e `e2e/admin-analytics.spec.ts`.
**Where**: `app/admin/analytics/page.tsx`
**Depends on**: T27
**Reuses**: `lib/admin/analytics.ts`, `funil.ts`, `usoFuncionalidades.ts`, `Grafico`
**Requirement**: ADM-09, ADM-10, ADM-11, ADM-12, ADM-16

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Período 7/15/30/45 (padrão 30) e "Parado há" (padrão 45); UF recalcula tudo; período só afeta "ativos" e uso; funil e travas não dependem do período
- [x] Mostra "Ainda não há mandatos cadastrados." sem mandatos; "—" em Aberturas e Tendência e "Sem registro de uso ainda" no gráfico de uso enquanto não há registro
- [x] Spec `e2e/admin-analytics.spec.ts` criado nesta task
- [x] Cobre: números batem com a fixture calculada à mão; troca de período e de UF; títulos e legenda de cada gráfico; estado vazio; "—" sem registro de uso; `vazou()` vazio
- [x] ≥ 8 testes passam (14 e2e). Leitura paginada `lerTudo` em `lib/admin/api.ts` (blocos de 1.000) em todas as leituras; `npm run build` não rodado, valeu tsc + npm test (694) + e2e

**Tests**: e2e
**Gate**: full

**Commit**: `feat(admin): add analytics page`

---

### T29: Tela Logs

**What**: Três abas: atividade dos gabinetes, ações da equipe e sistema, com o e2e `e2e/admin-logs.spec.ts`.
**Where**: `app/admin/logs/page.tsx`
**Depends on**: T28
**Reuses**: `v_admin_atividade`, `auditoria_admin`
**Requirement**: ADM-04, ADM-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Atividade: 50 por página, mais recente primeiro, "texto oculto" e "—" sem missão; lê só `v_admin_atividade`
- [x] Ações da equipe: 50 por página, data e hora no fuso de Brasília, quem fez e descrição
- [x] Sistema: links "Abrir logs na Vercel" e "Abrir logs no Supabase" com `target="_blank"` e `rel="noopener noreferrer"`; os dois endereços conferidos e registrados nesta task. Vercel: `https://vercel.com/legisla/projeto-100-dias/logs` (padrão `/[team]/[project]/logs` na documentação oficial, vercel.com/docs/logs/runtime). Supabase: a documentação oficial linka `/dashboard/project/<ref>/logs`, e `/logs/explorer` não aparece lá, então a tela usa `https://supabase.com/dashboard/project/fldmekrexvzchynnmeuq/logs`
- [x] Spec `e2e/admin-logs.spec.ts` criado nesta task
- [x] Cobre: ordem e paginação de 50; "texto oculto"; evento sem missão; fuso de Brasília; links externos com `rel`; leitura enxerga as três abas; `vazou()` vazio
- [x] ≥ 7 testes passam (12 e2e)

**Tests**: e2e
**Gate**: full

**Commit**: `feat(admin): add logs page`

---

### T30: e2e transversal: celular e privacidade

**What**: Todas as telas em 360 px e varredura de rede.
**Where**: `e2e/admin-transversal.spec.ts`
**Depends on**: T29
**Reuses**: `e2e/admin-api.ts`
**Requirement**: ADM-16, ADM-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Em 360 px, nenhuma das 5 telas tem rolagem horizontal da página e todo botão e campo tem pelo menos 40 px de altura
- [ ] Em todas as telas, `vazou()` devolve vazio; `/painel` continua abrindo
- [ ] ≥ 7 testes passam

**Tests**: e2e
**Gate**: full

**Commit**: `test(admin): add mobile and privacy e2e`

---

### T31: Migration de uso das funcionalidades

**What**: Migration 4 do design: tabela `uso_funcionalidades` e view `v_admin_uso`, com teste de SQL.
**Where**: `supabase/migrations/20261105150000_uso_funcionalidades.sql`
**Depends on**: None
**Reuses**: molde de `20261103120000_sugestoes_comentarios.sql`
**Requirement**: ADM-14, ADM-15

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Tabela só com `mandato_id`, `funcionalidade`, `criado_em` (sem texto, nome, e-mail nem `user_id`); insert só de membros do mandato; select só da equipe
- [ ] `v_admin_uso(dia, mandato_id, uf, funcionalidade, qtd)` gated por `eh_legisla()`
- [ ] Teste `tests/sql-uso-funcionalidades.test.ts` (PGlite): membro insere, não-membro e anônimo são recusados, leitura só da equipe; ≥ 6 casos passam

**Tests**: integration
**Gate**: quick

**Commit**: `feat(admin): add feature usage table`

---

### T32: Registrador de uso

**What**: Mapa ilha para funcionalidade e janela de 60 s.
**Where**: `lib/uso.ts`
**Depends on**: T31
**Reuses**: nomes de `data-ilha` em `ilhas/ponte.tsx`
**Requirement**: ADM-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `funcionalidadeDe(ilha)` devolve id estável ou `null`; `criaRegistrador(janelaMs = 60000)` grava a primeira abertura e ignora repetições do mesmo mandato e funcionalidade dentro de 60 s
- [ ] `tests/uso.test.ts` ≥ 6 casos passam (59 s, 60 s, outro mandato, outra funcionalidade, ilha desconhecida, sem mandato)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(uso): add usage recorder`

---

### T33: Gancho de uso no Guia

**What**: Registrar a abertura de funcionalidade em `Ilhas.ligar`; sem nuvem não grava e erro é ignorado, com o e2e `e2e/admin-uso-registro.spec.ts`.
**Where**: `ilhas/ponte.tsx`
**Depends on**: T32
**Reuses**: `ligar` em `ilhas/ponte.tsx:131`
**Requirement**: ADM-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O `insert` leva só `mandato_id`, `funcionalidade` e `criado_em`; com `NUVEM=false` não faz chamada; falha de rede ou 4xx/5xx é ignorada, sem aviso e sem nova tentativa
- [ ] Gancho dentro de `try/catch`, sem estado novo; os e2e existentes do Guia continuam passando
- [ ] Spec `e2e/admin-uso-registro.spec.ts` criado nesta task
- [ ] Cobre: abrir funcionalidade grava 1 linha só com os 3 campos; repetir em 60 s não duplica; sem nuvem não grava; erro do banco não aparece para a pessoa
- [ ] ≥ 4 testes passam

**Tests**: e2e
**Gate**: full

**Commit**: `feat(uso): record feature usage from guia`

---

### T34: Aberturas e tendência

**What**: Calcular aberturas do período, tendência de 5 semanas e uso por dia (14 dias).
**Where**: `lib/admin/usoFuncionalidades.ts`
**Depends on**: T33
**Reuses**: `usoPorFuncionalidade` da T14
**Requirement**: ADM-15

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `usoPorFuncionalidade(campos, uso)` devolve aberturas e tendência; `usoPorDia(uso, agora)` devolve 14 dias; sem `uso` mantém o comportamento da T14
- [ ] `tests/admin-uso-funcionalidades.test.ts` cresce em ≥ 5 casos e todos passam

**Tests**: unit
**Gate**: quick

**Commit**: `feat(admin): add usage totals and trend`

---

### T35: Analytics mostra o uso

**What**: Preencher Aberturas, Tendência e o gráfico "Uso das funcionalidades por dia", com o e2e `e2e/admin-analytics-uso.spec.ts`.
**Where**: `app/admin/analytics/page.tsx`
**Depends on**: T34
**Reuses**: `v_admin_uso`, `Grafico`
**Requirement**: ADM-15

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Com registro de uso a tabela mostra aberturas e tendência e o gráfico mostra 14 dias; sem registro mantém os "—"
- [ ] Spec `e2e/admin-analytics-uso.spec.ts` criado nesta task
- [ ] Cobre: números batem com a fixture; período troca as aberturas; gráfico de 14 dias; sem registro mostra "—"
- [ ] ≥ 4 testes passam

**Tests**: e2e
**Gate**: full

**Commit**: `feat(admin): show feature usage in analytics`

---

### T36: Documentar o `/admin`

**What**: Registrar no `CLAUDE.md` da plataforma a rota, o catálogo duplicado e o padrão AD-007.
**Where**: `CLAUDE.md`
**Depends on**: None
**Reuses**: seção "Dados e backend" do próprio arquivo
**Requirement**: ADM-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Descreve `/admin`, as 4 migrations, `lib/admin/` e o aviso de que um exercício novo exige nova migration do `exercicios_guia`
- [ ] Roda `graphify update .` na raiz depois do código (regra do `CLAUDE.md` do projeto)

**Tests**: none
**Gate**: build

**Commit**: `docs(admin): document admin panel`

---

### T37: Criar a spec da Fase 2 do painel

**What**: Ao fim da feature, abrir a spec da Fase 2 pelo fluxo de Specify, a partir do que ficou fora: tabela "Out of Scope" da spec e riscos do design.
**Where**: `.specs/features/painel-admin-fase2/spec.md`
**Depends on**: T36
**Reuses**: `.specs/features/painel-admin/spec.md` (Out of Scope) e `design.md` (Risks & Concerns)
**Requirement**: ADM-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Só começa depois do Verifier da feature dar PASS; não implementa nada
- [ ] Parte destes candidatos, a confirmar com o usuário: leitura do texto dos gabinetes pela equipe, atualizar o aviso de privacidade do cadastro para citar a equipe Legisla, migrar o `/painel` para as views `v_admin_*`, convidar por e-mail quem não tem conta, logs de sistema dentro do painel, exportação em CSV, aviso de mandatos parados, catálogo de exercícios sem duplicação
- [ ] Escopo, prioridades e perguntas decididos com o usuário, no fluxo de Specify (com a varredura das dimensões implícitas)
- [ ] `python3 <skill-dir>/scripts/validate_spec.py painel-admin-fase2` sai com 0 erros, e a spec é apresentada para confirmação
- [ ] `.specs/STATE.md` (Handoff) aponta para a spec nova

**Tests**: none
**Gate**: build

**Commit**: `docs(admin): add phase 2 spec`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7

Phase 1:  T1 ----→ T2 ----→ T3 ----→ T4 ----→ T5
Phase 2:  T6 ----→ T7 ----→ T8 ----→ T9 ----→ T10 ----→ T11 ----→ T12 ----→ T13 ----→ T14
Phase 3:  T15 ----→ T16 ----→ T17 ----→ T18 ----→ T19 ----→ T20 ----→ T21
Phase 4:  T22 ----→ T23 ----→ T24 ----→ T25 ----→ T26
Phase 5:  T27 ----→ T28 ----→ T29 ----→ T30
Phase 6:  T31 ----→ T32 ----→ T33 ----→ T34 ----→ T35
Phase 7:  T36 ----→ T37
```

Execução estritamente sequencial. São 37 tasks: ao executar, oferecer sub-agentes em lotes de cerca de 7 tasks, por fases inteiras (a fase 2 das tasks, de lógica pura, sozinha tem 9).

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | none (início da fase) | ✅ Match |
| T2 | T1 | T1 | ✅ Match |
| T3 | T2 | T2 | ✅ Match |
| T4 | T3 | T3 | ✅ Match |
| T5 | T4 | T4 | ✅ Match |
| T6 | None | none (início da fase) | ✅ Match |
| T7 | T6 | T6 | ✅ Match |
| T8 | T7 | T7 | ✅ Match |
| T9 | T8 | T8 | ✅ Match |
| T10 | T9 | T9 | ✅ Match |
| T11 | T10 | T10 | ✅ Match |
| T12 | T11 | T11 | ✅ Match |
| T13 | T12 | T12 | ✅ Match |
| T14 | T13 | T13 | ✅ Match |
| T15 | None | none (início da fase) | ✅ Match |
| T16 | T15 | T15 | ✅ Match |
| T17 | T16 | T16 | ✅ Match |
| T18 | T17 | T17 | ✅ Match |
| T19 | T18 | T18 | ✅ Match |
| T20 | T19 | T19 | ✅ Match |
| T21 | T20 | T20 | ✅ Match |
| T22 | None | none (início da fase) | ✅ Match |
| T23 | T22 | T22 | ✅ Match |
| T24 | T23 | T23 | ✅ Match |
| T25 | T24 | T24 | ✅ Match |
| T26 | T25 | T25 | ✅ Match |
| T27 | None | none (início da fase) | ✅ Match |
| T28 | T27 | T27 | ✅ Match |
| T29 | T28 | T28 | ✅ Match |
| T30 | T29 | T29 | ✅ Match |
| T31 | None | none (início da fase) | ✅ Match |
| T32 | T31 | T31 | ✅ Match |
| T33 | T32 | T32 | ✅ Match |
| T34 | T33 | T33 | ✅ Match |
| T35 | T34 | T34 | ✅ Match |
| T36 | None | none (início da fase) | ✅ Match |
| T37 | T36 | T36 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Dependência do Postgres embutido | Componentes compartilhados, layout, CSS, docs | none | none | ✅ OK |
| T2: Ambiente de teste de SQL | Migration SQL | integration | integration | ✅ OK |
| T3: Migration de equipe, papéis e auditoria | Migration SQL | integration | integration | ✅ OK |
| T4: Migration de leitura de mandatos e analytics | Migration SQL | integration | integration | ✅ OK |
| T5: Migration de gestão de mandatos e membros | Migration SQL | integration | integration | ✅ OK |
| T6: Escala de dias | Lógica pura (`lib/admin/*.ts`, `lib/uso.ts`) | unit | unit | ✅ OK |
| T7: Mensagens e validação de e-mail | Lógica pura (`lib/admin/*.ts`, `lib/uso.ts`) | unit | unit | ✅ OK |
| T8: Leitura da configuração do banco | Lógica pura (`lib/admin/*.ts`, `lib/uso.ts`) | unit | unit | ✅ OK |
| T9: Sessão: ler, gravar e renovar | Lógica pura (`lib/admin/*.ts`, `lib/uso.ts`) | unit | unit | ✅ OK |
| T10: Cliente da API | Lógica pura (`lib/admin/*.ts`, `lib/uso.ts`) | unit | unit | ✅ OK |
| T11: Filtros e páginas de mandatos | Lógica pura (`lib/admin/*.ts`, `lib/uso.ts`) | unit | unit | ✅ OK |
| T12: Indicadores e status mensal | Lógica pura (`lib/admin/*.ts`, `lib/uso.ts`) | unit | unit | ✅ OK |
| T13: Funil e travas | Lógica pura (`lib/admin/*.ts`, `lib/uso.ts`) | unit | unit | ✅ OK |
| T14: Uso por funcionalidade (campos) | Lógica pura (`lib/admin/*.ts`, `lib/uso.ts`) | unit | unit | ✅ OK |
| T15: Estilo do painel | Componentes compartilhados, layout, CSS, docs | none | none | ✅ OK |
| T16: Layout do `/admin` | Componentes compartilhados, layout, CSS, docs | none | none | ✅ OK |
| T17: Sessão e papel na interface | Componentes compartilhados, layout, CSS, docs | none | none | ✅ OK |
| T18: Casca com menu | Componentes compartilhados, layout, CSS, docs | none | none | ✅ OK |
| T19: Helper de e2e do `/admin` | Helper de e2e | none | none | ✅ OK |
| T20: Tela Mandatos | Páginas e e2e (`app/admin/**`, `ilhas/ponte.tsx`) | e2e | e2e | ✅ OK |
| T21: e2e de acesso e papéis | Páginas e e2e (`app/admin/**`, `ilhas/ponte.tsx`) | e2e | e2e | ✅ OK |
| T22: Diálogo reutilizável | Componentes compartilhados, layout, CSS, docs | none | none | ✅ OK |
| T23: Tela Equipe | Páginas e e2e (`app/admin/**`, `ilhas/ponte.tsx`) | e2e | e2e | ✅ OK |
| T24: Membros do mandato | Componentes compartilhados, layout, CSS, docs | none | none | ✅ OK |
| T25: Zona de risco | Componentes compartilhados, layout, CSS, docs | none | none | ✅ OK |
| T26: Tela Detalhe do mandato | Páginas e e2e (`app/admin/**`, `ilhas/ponte.tsx`) | e2e | e2e | ✅ OK |
| T27: Gráficos | Componentes compartilhados, layout, CSS, docs | none | none | ✅ OK |
| T28: Tela Analytics | Páginas e e2e (`app/admin/**`, `ilhas/ponte.tsx`) | e2e | e2e | ✅ OK |
| T29: Tela Logs | Páginas e e2e (`app/admin/**`, `ilhas/ponte.tsx`) | e2e | e2e | ✅ OK |
| T30: e2e transversal: celular e privacidade | Páginas e e2e (`app/admin/**`, `ilhas/ponte.tsx`) | e2e | e2e | ✅ OK |
| T31: Migration de uso das funcionalidades | Migration SQL | integration | integration | ✅ OK |
| T32: Registrador de uso | Lógica pura (`lib/admin/*.ts`, `lib/uso.ts`) | unit | unit | ✅ OK |
| T33: Gancho de uso no Guia | Páginas e e2e (`app/admin/**`, `ilhas/ponte.tsx`) | e2e | e2e | ✅ OK |
| T34: Aberturas e tendência | Lógica pura (`lib/admin/*.ts`, `lib/uso.ts`) | unit | unit | ✅ OK |
| T35: Analytics mostra o uso | Páginas e e2e (`app/admin/**`, `ilhas/ponte.tsx`) | e2e | e2e | ✅ OK |
| T36: Documentar o `/admin` | Componentes compartilhados, layout, CSS, docs | none | none | ✅ OK |
| T37: Criar a spec da Fase 2 do painel | Componentes compartilhados, layout, CSS, docs | none | none | ✅ OK |
