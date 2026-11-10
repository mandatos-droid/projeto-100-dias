# Aba Usuários no Painel Admin Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/admin-usuarios/design.md`
**Spec**: `.specs/features/admin-usuarios/spec.md`
**Status**: Draft
**Branch**: `feat/admin-usuarios` (worktree `Dev Apps/admin-usuarios-wt`, criada a partir de `origin/main`)

Regras que valem para todas as tasks:

- Trabalhe só no worktree `C:/Users/brand/Desktop/Dev Apps/admin-usuarios-wt`; todos os comandos rodam dentro de `plataforma/` dele. Não toque a pasta principal nem outros worktrees.
- Commits só com caminhos explícitos (`git add <arquivo>`), nunca `git add -A` ou `git add .`.
- Antes de escrever código Next.js, ler o guia correspondente em `node_modules/next/dist/docs/` (regra do `plataforma/AGENTS.md`).
- Imports em `lib/` e `tests/` são relativos e terminam em `.ts` (AD-004).
- Esta feature não faz `git push`, não aplica migration no Supabase e não faz deploy; isso exige go-ahead explícito.
- Todas as mensagens de erro e textos de tela seguem literalmente a spec.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `plataforma/AGENTS.md`, `plataforma/package.json` (scripts `test` e `test:e2e`), `plataforma/playwright.config.*`, e as tasks de `painel-admin`, `acesso-equipe-convites` e `primeiro-acesso-google` (mesmo padrão).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Migration SQL e funções do banco (`supabase/migrations/*.sql`) | integration (PGlite, migrations reais) | Todos os ramos; 1:1 com USR-03 e as regras de dado de USR-01 e USR-04; cada recusa de permissão | `plataforma/tests/sql-admin-usuarios*.test.ts` | `npm test` |
| Lógica pura (`lib/admin/usuarios.ts`) | unit | Todos os ramos; cada texto e cada caso de borda | `plataforma/tests/admin-usuarios.test.ts` | `npm test` |
| Páginas e componentes Next.js (`app/admin/usuarios/`, `Casca.tsx`) | e2e (Playwright, Supabase interceptado) | Todas as rotas: caminho feliz, cada borda e cada erro da spec; nenhuma chamada sem mapa | `plataforma/e2e/admin-usuarios*.spec.ts` | `npx playwright test e2e/admin-usuarios` |
| Documentação (`.specs/STATE.md`) | none | - (gate de build apenas) | - | gate de build apenas |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks com teste de unidade ou de SQL | `npm test` |
| Full | Tasks com e2e | `npm test` e `npx playwright test <specs da task>` (servidor próprio na porta 3100 com `playwright.isolado.config.ts` temporário, não versionado) |
| Build | Última task de cada fase e tasks sem teste | `npx tsc --noEmit`, `npm test` e `npx playwright test e2e/admin-` |

---

## Execution Plan

### Phase 1: Banco

```
T1 → T2
```

### Phase 2: Lógica pura

```
T2 → T3
```

### Phase 3: Telas

```
T3 → T4 → T5 → T6
```

### Phase 4: Documentação

```
T6 → T7
```

---

## Task Breakdown

### T1: Função da lista de usuários

**What**: Criar a migration com `private.sem_acento` e `admin_usuarios` (busca, filtros, total, ordem, limite) e acrescentar `last_sign_in_at` à simulação de `auth.users` dos testes.
**Where**: `plataforma/supabase/migrations/20261110120000_admin_usuarios.sql` (new) e `plataforma/tests/sql-ambiente.ts` (modify)
**Depends on**: none
**Reuses**: `private.eh_legisla`; molde de `admin_equipe` em `20261105120000_admin_equipe.sql`; `v_admin_mandatos`
**Requirement**: USR-01, USR-03, USR-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `admin_usuarios` devolve `{ total, linhas }` com `id, nome, email, criado_em, ultimo_acesso, sem_perfil, equipe_papel, mandatos[{id,nome,papel,arquivado}]` e só esses campos (USR-01.2, USR-03.4)
- [x] Inclui toda conta de `auth.users`, a equipe Legisla e quem não tem perfil; `sem_perfil` é verdadeiro só para quem não tem perfil e não é da equipe (USR-01.3, 01.4, 01.5)
- [x] O nome sai do perfil, depois do cadastro da conta (`nome`, `full_name`, `name`) e por fim do e-mail; conta sem e-mail devolve `email` nulo (USR-01.6, Edge Cases)
- [x] Ordem por `last_sign_in_at` decrescente com nulos por último e desempate por e-mail (USR-01.8)
- [x] Limite fora de 1 a 100 vira 25; `total` conta as pessoas que atendem aos filtros, não só a página (USR-03.6, 03.7, USR-01.9)
- [x] Busca por nome ou e-mail sem diferenciar maiúsculas e acentos, cortada em 100 caracteres (USR-04.1, Edge Cases)
- [x] Filtros `p_papel` (`coordenacao`, `assessoria`, `leitura`, `legisla`), `p_mandato` e `p_sem_perfil`, aplicados juntos (USR-04.2 a 04.5)
- [x] Mandato arquivado aparece com `arquivado = true`; pessoa em dois mandatos aparece com os dois e o filtro por mandato a acha em qualquer um (Edge Cases, Assumptions)
- [x] Quem não está em `equipe_legisla` recebe "Você não tem permissão para esta ação." com erro 42501; `anon` não executa; a função é `stable` e não grava nada (USR-03.1, 03.2, 03.3, 03.5)
- [x] Gate check passes: `npm test`
- [x] Test count: ao menos 20 testes novos em `tests/sql-admin-usuarios.test.ts`, nenhum removido; os testes de SQL existentes continuam passando

**Tests**: integration
**Gate**: quick

**Commit**: `feat(admin): add users list function`

**Status**: ✅ Done

---

### T2: Função do detalhe da pessoa

**What**: Acrescentar `admin_usuario_detalhe` à mesma migration.
**Where**: `plataforma/supabase/migrations/20261110120000_admin_usuarios.sql` (modify)
**Depends on**: T1
**Reuses**: tabelas `perfis`, `consentimentos`, `membros`, `mandatos`, `equipe_legisla`
**Requirement**: USR-02, USR-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Devolve `{ id, nome, email, criado_em, ultimo_acesso, equipe_papel, perfil, consentimento, mandatos }` e só esses campos (USR-02.2, USR-03.4)
- [x] `perfil` traz nome completo, nascimento, gênero, raça, telefone, atua e tempo com os valores internos; é nulo sem perfil (USR-02.3, 02.4)
- [x] `consentimento` traz a versão e a data do mais recente; nulo sem consentimento (USR-02.5)
- [x] `mandatos` traz id, nome do parlamentar, cargo, UF, papel e `arquivado` (USR-02.6, 02.7)
- [x] Id inexistente devolve `null` (USR-02.10)
- [x] Quem não está em `equipe_legisla` recebe "Você não tem permissão para esta ação." com erro 42501; `anon` não executa; não grava nada (USR-03.1, 03.2, 03.3, 03.5)
- [x] Gate check passes: `npm test`
- [x] Test count: ao menos 12 testes novos em `tests/sql-admin-usuarios-detalhe.test.ts`, nenhum removido

**Tests**: integration
**Gate**: quick

**Commit**: `feat(admin): add user detail function`

**Status**: ✅ Done

---

### T3: Lógica pura da aba

**What**: Criar `lib/admin/usuarios.ts` com consulta na URL, rótulos e paginação.
**Where**: `plataforma/lib/admin/usuarios.ts` (new)
**Depends on**: T2
**Reuses**: `lib/admin/mandatos.ts` (`semAcento`), `lib/admin/escala.ts` (`partesBrasilia`), `lib/perfil/opcoes.ts`
**Requirement**: USR-01, USR-02, USR-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `lerConsulta` e `montaConsulta` fazem o caminho de ida e volta; `pagina` inválida vira 1, `papel` desconhecido vira "todos", busca é cortada em 100 caracteres (USR-04.6, Error Handling)
- [ ] `rotuloUltimoAcesso` devolve `dd/mm/aaaa hh:mm` em Brasília e "Nunca" para nulo (USR-01.7)
- [ ] `rotuloMandato` devolve nome, papel e "(arquivado)" quando for o caso (Edge Cases)
- [ ] `marcaPessoa` devolve "Sem perfil", o papel na equipe Legisla ou nada (USR-01.4, 01.5)
- [ ] `rotulosPerfil` devolve gênero, raça e atuação em texto, nascimento em `dd/mm/aaaa` e telefone formatado `(DD) NNNNN-NNNN` ou `(DD) NNNN-NNNN` (USR-02.3)
- [ ] `paginas(total, pagina)` calcula o intervalo mostrado e o número de páginas de 25 (USR-01.9)
- [ ] Gate check passes: `npm test`
- [ ] Test count: ao menos 18 testes novos em `tests/admin-usuarios.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick

**Commit**: `feat(admin): add users view helpers`

---

### T4: Menu e lista de usuários

**What**: Acrescentar o item "Usuários" ao menu e criar a página da lista com tabela, paginação e os estados vazio, erro e carregando.
**Where**: `plataforma/app/admin/usuarios/page.tsx` (new), `plataforma/app/admin/_componentes/Casca.tsx` (modify), `plataforma/e2e/admin-api.ts` (modify), `plataforma/e2e/admin-usuarios.spec.ts` (new)
**Depends on**: T3
**Reuses**: `app/admin/page.tsx` (padrão de lista); `Casca`; `Sessao`; mock `mocka` de `e2e/admin-api.ts`
**Requirement**: USR-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O menu mostra "Usuários" entre "Mandatos" e "Analytics" e abre `/admin/usuarios` (USR-01.1)
- [ ] A lista mostra nome, e-mail, mandatos com o papel, data de cadastro e último acesso, as marcas "Sem perfil" e o papel da equipe, e nunca gênero, raça, nascimento nem telefone (USR-01.2 a 01.7, 01.10)
- [ ] A ordem, a paginação de 25 e o total vêm da função; a página lê `pagina` da URL (USR-01.8, 01.9)
- [ ] Sem contas mostra "Nenhuma pessoa cadastrada." e nenhuma tabela; falha mostra a mensagem padrão e "Tentar de novo" sem afetar o menu (USR-01.11, 01.12)
- [ ] Clique em uma linha abre `/admin/usuarios/<id>` levando a consulta da lista em `de=` (USR-02.1)
- [ ] Layout legível em 400 px, sem rolagem horizontal
- [ ] Os specs `e2e/admin-*.spec.ts` existentes continuam passando com o mock ajustado
- [ ] Gate check passes: `npm test` e `npx playwright test e2e/admin-usuarios.spec.ts e2e/admin-`
- [ ] Test count: ao menos 10 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(admin): add users tab with list`

---

### T5: Busca e filtros

**What**: Acrescentar à lista a busca, os filtros de papel, mandato e "sem perfil", "Limpar filtros" e o estado sem resultado.
**Where**: `plataforma/app/admin/usuarios/page.tsx` (modify), `plataforma/e2e/admin-usuarios.spec.ts` (modify), `plataforma/e2e/admin-api.ts` (modify)
**Depends on**: T4
**Reuses**: `lib/admin/usuarios.ts`; `v_admin_mandatos` para as opções de mandato
**Requirement**: USR-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A busca filtra por nome ou e-mail, volta à primeira página e a consulta fica na URL (USR-04.1, 04.6)
- [ ] O filtro de papel tem `Todos`, `Coordenação`, `Assessoria`, `Somente leitura` e `Equipe Legisla`; o de mandato lista os não arquivados em ordem alfabética; o de "Só quem ainda não preencheu o perfil" existe (USR-04.2 a 04.4)
- [ ] Mais de um filtro vale junto e trocar de página mantém busca e filtros (USR-04.5, 04.6)
- [ ] Sem resultado mostra "Nenhuma pessoa encontrada com esses filtros."; com filtros ativos aparece "Limpar filtros" e ele volta ao padrão (USR-04.7, 04.8)
- [ ] Busca com mais de 100 caracteres é cortada sem erro (Edge Cases)
- [ ] Gate check passes: `npm test` e `npx playwright test e2e/admin-usuarios.spec.ts`
- [ ] Test count: ao menos 10 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(admin): add users search and filters`

---

### T6: Detalhe da pessoa

**What**: Criar a página do detalhe com perfil, consentimento, mandatos e o link para voltar.
**Where**: `plataforma/app/admin/usuarios/[id]/page.tsx` (new), `plataforma/e2e/admin-usuarios-detalhe.spec.ts` (new), `plataforma/e2e/admin-api.ts` (modify)
**Depends on**: T5
**Reuses**: `app/admin/mandatos/[id]/page.tsx` (padrão de detalhe); `lib/admin/usuarios.ts`
**Requirement**: USR-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O detalhe mostra nome, e-mail, cadastro, último acesso e o papel na equipe Legisla, quando houver (USR-02.2)
- [ ] Com perfil mostra nome completo, nascimento `dd/mm/aaaa`, gênero, raça, telefone, se atua e o tempo, em texto; sem perfil mostra "Esta pessoa ainda não preencheu o perfil." (USR-02.3, 02.4)
- [ ] Mostra a versão e a data do consentimento ou "Sem consentimento registrado" (USR-02.5)
- [ ] Lista os mandatos com parlamentar, cargo, UF e papel, cada um com link para `/admin/mandatos/<id>`; sem mandato mostra "Esta pessoa não está em nenhum mandato." (USR-02.6, 02.7)
- [ ] "← Voltar para Usuários" reconstrói a lista com a busca, os filtros e a página de `de=` (USR-02.8)
- [ ] Nenhum botão altera dado e não há exportação (USR-02.9)
- [ ] Id inexistente mostra "Pessoa não encontrada." com o link para voltar; falha mostra a mensagem padrão e "Tentar de novo" (USR-02.10, 02.11)
- [ ] Layout legível em 400 px; nenhuma chamada de rede fora de `admin_usuario_detalhe`
- [ ] Gate check passes: `npm test` e `npx playwright test e2e/admin-usuarios-detalhe.spec.ts e2e/admin-usuarios.spec.ts`
- [ ] Test count: ao menos 10 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(admin): add user detail page`

---

### T7: Registrar a feature no STATE.md

**What**: Registrar a decisão e as pendências da aba Usuários no `STATE.md`.
**Where**: `.specs/STATE.md` (modify)
**Depends on**: T6
**Reuses**: formato dos AD existentes
**Requirement**: USR-01, USR-02, USR-03, USR-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Decisão `AD-014` registra: aba só leitura, dados sensíveis só no detalhe, último acesso é o último login, funções de leitura no banco e estado da lista na URL
- [ ] Pendências: registrar no histórico quem abriu o detalhe de uma pessoa (LGPD), exportação e a revisão jurídica do texto de consentimento seguem abertas
- [ ] O Handoff aponta a branch, a última task e o próximo passo (Verifier independente)
- [ ] Gate check passes: `npx tsc --noEmit` e `npm test`
- [ ] Test count: sem teste novo; nenhum removido

**Tests**: none
**Gate**: build

**Commit**: `docs(admin): record users tab decisions and open items`
