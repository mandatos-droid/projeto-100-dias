# Acesso, Equipe e Convites Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/acesso-equipe-convites/design.md`
**Spec**: `.specs/features/acesso-equipe-convites/spec.md`
**Status**: Draft (aguardando aprovação; nada foi executado)
**Branch**: `feat/acesso-convites` (criada a partir de `feat/painel-admin`)

Regras que valem para todas as tasks:

- Todos os comandos rodam dentro de `plataforma/`.
- Commits só com caminhos explícitos (`git add <arquivo>`), nunca `git add -A` ou `git add .`. A árvore tem alterações não commitadas de outras frentes (`public/legacy/app.js`, `public/legacy/cadastro.js`, `lib/admin/api.ts`, `ilhas/`, `e2e/admin-api.ts`, `graphify-out/`). **Não editar `app.js` nem `cadastro.js`**: os ajustes do Guia entram em `public/legacy/acesso.js` (arquivo novo, escrito à mão, AD-003).
- Antes de escrever código Next.js, ler o guia correspondente em `node_modules/next/dist/docs/` (regra do `plataforma/AGENTS.md`).
- Imports em `lib/` e `tests/` são relativos e terminam em `.ts` (AD-004).
- Esta feature não faz `git push`, não aplica migration no Supabase e não faz deploy. A migration só é aplicada pelo workflow ao subir para a `main`, e isso exige go-ahead explícito.
- Todas as mensagens de erro e textos de tela seguem literalmente a spec.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `plataforma/AGENTS.md` (ler a documentação do Next 16 antes de codar), `plataforma/package.json` (scripts `test` e `test:e2e`), `plataforma/playwright.config.ts`, decisão AD-004 em `.specs/STATE.md`; não há `CONTRIBUTING.md` nem limiar de cobertura. Strong defaults aplicados onde não há diretriz.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Migration SQL e funções do banco (`supabase/migrations/*.sql`) | integration (PGlite, migrations reais) | Todos os ramos; 1:1 com os critérios ACE-01, 02, 03, 06 e 07; cada mensagem de erro e cada recusa de permissão da spec; caminho de falha com desfazer | `plataforma/tests/sql-*.test.ts` | `npm test` |
| Lógica pura (`lib/convites/*.ts`, `lib/landing.ts`) | unit | Todos os ramos; 1:1 com os critérios; cada caso de borda e cada texto de erro | `plataforma/tests/convites-*.test.ts`, `plataforma/tests/landing.test.ts` | `npm test` |
| Camada de dados (`lib/convites/api.ts`) | unit (api falsa) | Um teste por função: nome da `rpc`, nomes dos argumentos `p_*`, tradução do retorno e do erro | `plataforma/tests/convites-api.test.ts` | `npm test` |
| Páginas e componentes Next.js (`app/convite/`, `app/mandato/`) | e2e (Playwright, Supabase interceptado) | Todas as rotas da task: caminho feliz, cada borda e cada erro listado na spec; nenhuma chamada sem mapa | `plataforma/e2e/convite-*.spec.ts`, `plataforma/e2e/mandato-*.spec.ts` | `npx playwright test <arquivos da task>` |
| Configuração (`next.config.mjs`) | e2e | Cabeçalhos presentes na resposta de `/convite` | `plataforma/e2e/convite-*.spec.ts` | `npx playwright test e2e/convite-cabecalhos.spec.ts` |
| Ajustes no Guia legado (`public/legacy/acesso.js`, `app/guia/page.tsx`, `lib/legacyBody.ts`) | unit (vm, padrão `legado-*.test.ts`) + e2e | Cada ajuste provado no arquivo e na tela; nenhum texto do Guia fora do escopo muda | `plataforma/tests/legado-acesso.test.ts`, `plataforma/e2e/guia-acesso.spec.ts` | `npm test`; `npx playwright test e2e/guia-acesso.spec.ts` |
| Documentação (`.specs/STATE.md`) | none | - (gate de build apenas) | - | gate de build apenas |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks com teste de unidade ou de SQL | `npm test` |
| Full | Tasks com e2e | `npm test` e `npx playwright test <specs da task>` |
| Build | Última task de cada fase e tasks sem teste | `npx tsc --noEmit`, `npm test` e `npx playwright test e2e/convite-*.spec.ts e2e/mandato-*.spec.ts e2e/guia-acesso.spec.ts` (os specs que já existirem) |

`npm run build` não entra no gate: falha por `SecurityFatalError` do Next 16.4 (advisory conhecido, registrado em `STATE.md`).

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Banco, papéis e equipe

```
T1 → T2 → T3 → T4 → T5 → T6
```

### Phase 2: Banco, convites

```
T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13
```

### Phase 3: Lógica pura

```
T13 → T14 → T15 → T16 → T17 → T18 → T19 → T20 → T21 → T22
```

### Phase 4: Página do convite

```
T22 → T23 → T24 → T25 → T26
```

### Phase 5: Área do mandato e Equipe

```
T26 → T27 → T28 → T29 → T30 → T31 → T32 → T33
```

### Phase 6: Guia legado e fechamento

```
T33 → T34 → T35 → T36 → T37
```

---

## Task Breakdown

### T1: Papéis do mandato e `leitura` aplicada nas políticas

**What**: Criar a migration com a restrição de `membros.papel`, as funções `private.nivel_papel`, `private.papel_no_mandato` e `private.pode_editar`, a troca de `mandatos_editar` e `eventos_criar` para exigir `pode_editar`, e a leitura de `exercicios_guia` para membros.
**Where**: `plataforma/supabase/migrations/20261106120000_convites_equipe.sql`
**Depends on**: None
**Reuses**: `private.eh_membro` (`20261016120000_schema_inicial.sql:96`), políticas `mandatos_editar` e `eventos_criar` (`:138`, `:168`), `exercicios_guia_ler` (`20261105130000_admin_leitura.sql:45`), `tests/sql-ambiente.ts`
**Requirement**: ACE-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `membros.papel` rejeita qualquer valor fora de `coordenacao`, `assessoria`, `leitura` (ACE-03.1)
- [x] Membro `leitura` não altera `mandatos` (nenhuma linha muda) e não insere em `eventos`; `coordenacao` e `assessoria` continuam gravando (ACE-03.2)
- [x] Membro de outro mandato continua sem escrita; `private.pode_editar` devolve falso para quem não é membro
- [x] Complemento da T1 (executado no início do lote 2): função `public.catalogo_exercicios()` devolve `id, missao, ordem, titulo` de `exercicios_guia` a qualquer membro de algum mandato e a quem é da equipe Legisla; `anon` e quem não é membro recebem erro de permissão. A tabela `exercicios_guia` continua sem leitura direta para membros, e `tests/sql-admin-leitura.test.ts` não muda (decisão: o catálogo sai por função, não por política da tabela)
- [x] Migration roda após as migrations de `painel-admin` no ambiente PGlite sem erro
- [x] Gate check passes: `npm test`
- [x] Test count: ao menos 8 testes novos em `tests/sql-papeis.test.ts` e nenhum teste existente removido

**Tests**: integration
**Gate**: quick

**Commit**: `feat(convites): add member roles and read-only enforcement`

---

### T2: Histórico da equipe (`eventos_equipe`)

**What**: Acrescentar a tabela `eventos_equipe` com índice, RLS de leitura para membros e grants só de `select`.
**Where**: `plataforma/supabase/migrations/20261106120000_convites_equipe.sql` (modify)
**Depends on**: T1
**Reuses**: modelo de dados do `design.md`; `private.eh_membro`
**Requirement**: ACE-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Membro do mandato lê as linhas do próprio mandato; quem não é membro recebe zero linhas (ACE-06.6)
- [x] `authenticated` não consegue `insert`, `update` nem `delete` direto em `eventos_equipe`, nem a equipe `admin` do Legisla (ACE-06.4)
- [x] `tipo` só aceita os 6 valores do design
- [x] Nenhuma função desta task grava em `eventos` (ACE-06.5, conferido por contagem de `eventos` antes e depois nas tasks seguintes)
- [x] Gate check passes: `npm test`
- [x] Test count: ao menos 6 testes novos em `tests/sql-eventos-equipe.test.ts`, nenhum removido

**Tests**: integration
**Gate**: quick

**Commit**: `feat(convites): add team events history table`

---

### T3: Trocar o papel de um membro

**What**: Criar `membro_trocar_papel(p_mandato, p_user, p_papel)` com regra de coordenação, trava da última coordenação e linha em `eventos_equipe`.
**Where**: `plataforma/supabase/migrations/20261106120000_convites_equipe.sql` (modify)
**Depends on**: T2
**Reuses**: molde de função de `20261020130000_excluir_mandato.sql`; `private.papel_no_mandato`
**Requirement**: ACE-03, ACE-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Coordenação troca o papel de outro membro e a mudança vale na chamada seguinte (ACE-03.4)
- [x] `assessoria` e `leitura` recebem erro de permissão e nada muda (ACE-03.6)
- [x] Rebaixar a última coordenação recusa com "O mandato precisa ter ao menos uma pessoa na coordenação." (ACE-03.7)
- [x] A função trava as linhas de `membros` do mandato com `for update` antes de contar coordenações (ACE-03.8; a simultaneidade real não é reproduzível no PGlite de conexão única, marcar como lacuna de precisão e cobrir a ordem das duas chamadas em sequência)
- [x] Linha `papel_trocado` gravada com ator, alvo e papel na mesma transação; se a gravação do evento falhar (gatilho de teste que levanta exceção) a troca é desfeita (ACE-06.2, ACE-06.3)
- [x] `anon` não executa a função
- [x] Gate check passes: `npm test`
- [x] Test count: ao menos 7 testes novos em `tests/sql-membros.test.ts`, nenhum removido

**Tests**: integration
**Gate**: quick

**Commit**: `feat(convites): add change member role function`

---

### T4: Remover um membro

**What**: Criar `membro_remover(p_mandato, p_user)` com as mesmas regras de permissão, trava e histórico.
**Where**: `plataforma/supabase/migrations/20261106120000_convites_equipe.sql` (modify)
**Depends on**: T3
**Reuses**: guarda e trava de `membro_trocar_papel`
**Requirement**: ACE-03, ACE-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Coordenação remove outro membro; a conta em `auth.users` permanece (ACE-03.5)
- [x] Quem não é coordenação recebe erro de permissão e nada muda (ACE-03.6)
- [x] Remover a última coordenação recusa com a mensagem da spec (ACE-03.7)
- [x] Linha `membro_removido` gravada na mesma transação; falha do evento desfaz a remoção (ACE-06.2, ACE-06.3)
- [x] Gate check passes: `npm test`
- [x] Test count: ao menos 5 testes novos em `tests/sql-membros.test.ts`, nenhum removido

**Tests**: integration
**Gate**: quick

**Commit**: `feat(convites): add remove member function`

---

### T5: Sair do mandato e fim da exclusão direta em `membros`

**What**: Criar `membro_sair(p_mandato)`, remover a política `membros_sair` e o `grant delete` de `membros` para `authenticated`.
**Where**: `plataforma/supabase/migrations/20261106120000_convites_equipe.sql` (modify)
**Depends on**: T4
**Reuses**: `membros_sair` (`20261016120000_schema_inicial.sql:158`); `excluir_meus_dados` continua funcionando por ser `security definer`
**Requirement**: ACE-03, ACE-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Membro sai por conta própria e vai embora de `membros` (ACE-03.9)
- [x] A última coordenação que tenta sair recebe a recusa da spec e continua no mandato (ACE-03.7, borda "último coordenador sai")
- [x] `delete from membros` direto por `authenticated` falha por falta de permissão (ACE-03.7, risco do design)
- [x] `excluir_meus_dados()` ainda remove a pessoa (teste de regressão)
- [x] Linha `membro_saiu` gravada na mesma transação (ACE-06.2)
- [x] Gate check passes: `npm test`
- [x] Test count: ao menos 5 testes novos em `tests/sql-membros.test.ts`, nenhum removido

**Tests**: integration
**Gate**: quick

**Commit**: `feat(convites): add leave mandate function and block direct member delete`

---

### T6: Lista da equipe com e-mail

**What**: Criar `equipe_do_mandato(p_mandato)` devolvendo `user_id, nome, email, papel, criado_em` com o e-mail lido de `auth.users`, só para membros.
**Where**: `plataforma/supabase/migrations/20261106120000_convites_equipe.sql` (modify)
**Depends on**: T5
**Reuses**: `auth.users` no ambiente PGlite (`tests/sql-ambiente.ts`)
**Requirement**: ACE-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Membro recebe todas as pessoas do mandato com nome, e-mail e papel, da entrada mais antiga para a mais recente (ACE-04.6)
- [x] Quem não é membro recebe erro de permissão e nenhum e-mail (ACE-04.6)
- [x] `anon` não executa a função
- [x] Nenhuma coluna além das cinco do design é devolvida
- [x] Gate check passes (Build, última task da fase): `npx tsc --noEmit`, `npm test`
- [x] Test count: ao menos 4 testes novos em `tests/sql-membros.test.ts`, nenhum removido

**Tests**: integration
**Gate**: build

**Commit**: `feat(convites): add team list function with member emails`

---

### T7: Tabelas de convite e gerador de token

**What**: Criar `convites`, `convite_tentativas` e `convite_bloqueios` sem nenhum grant para `anon` e `authenticated`, e a função `private.token_aleatorio()`.
**Where**: `plataforma/supabase/migrations/20261106120000_convites_equipe.sql` (modify)
**Depends on**: T6
**Reuses**: modelo de dados e "Tech Decisions" do `design.md`
**Requirement**: ACE-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `authenticated` e `anon` não conseguem `select`, `insert`, `update` nem `delete` em nenhuma das três tabelas
- [x] `private.token_aleatorio()` devolve 22 caracteres do conjunto `A-Za-z0-9_-`, e 1000 chamadas não repetem valor
- [x] Restrições do design valem: nome de 1 a 80, papel dentro dos três valores, `usado_em` e `cancelado_em` nunca juntos, `token_hash` único (ACE-01.7)
- [x] Gate check passes: `npm test`
- [x] Test count: ao menos 6 testes novos em `tests/sql-convites.test.ts`, nenhum removido

**Tests**: integration
**Gate**: quick

**Commit**: `feat(convites): add invite tables and token generator`

---

### T8: Criar convite

**What**: Criar `convite_criar(p_mandato, p_nome, p_email, p_papel)` com validações, hierarquia de papéis, limite de 20 pendentes, limpeza de convites antigos e evento.
**Where**: `plataforma/supabase/migrations/20261106120000_convites_equipe.sql` (modify)
**Depends on**: T7
**Reuses**: `private.token_aleatorio`, `private.nivel_papel`, `sha256()` nativo
**Requirement**: ACE-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Devolve `{id, token, expira_em}` com token de 22 caracteres e validade de 7 dias a partir da criação (ACE-01.1, ACE-01.4)
- [x] A linha guardada contém só `sha256` do token; nenhuma coluna de nenhuma tabela contém o token em texto (ACE-01.2)
- [x] E-mail preenchido é guardado em minúsculas e sem espaços nas pontas; sem e-mail fica nulo (ACE-01.5)
- [x] Papel maior que o de quem convida recusa com "Você só pode convidar com papel igual ou menor que o seu." e não cria linha (ACE-01.6)
- [x] Nome vazio ou com 81 caracteres recusa com "Informe um nome de até 80 caracteres."; e-mail inválido ou com 255 caracteres recusa com "E-mail inválido." (ACE-01.7, ACE-01.8)
- [x] O 21º convite pendente recusa com a mensagem da spec; o 20º passa (ACE-01.9)
- [x] Quem não é membro recebe erro de permissão (ACE-01.10)
- [x] Convites vencidos ou cancelados há mais de 30 dias do mesmo mandato são apagados; os de 29 dias e os de outro mandato ficam (ACE-01.11)
- [x] Linha `convite_criado` gravada na mesma transação (ACE-06.1)
- [x] Gate check passes: `npm test`
- [x] Test count: ao menos 12 testes novos em `tests/sql-convites.test.ts`, nenhum removido

**Tests**: integration
**Gate**: quick

**Commit**: `feat(convites): add create invite function`

---

### T9: Listar convites pendentes

**What**: Criar `convites_pendentes(p_mandato)` devolvendo só `id, nome, papel, convidado_por_nome, expira_em`.
**Where**: `plataforma/supabase/migrations/20261106120000_convites_equipe.sql` (modify)
**Depends on**: T8
**Reuses**: `private.eh_membro`
**Requirement**: ACE-01, ACE-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Lista só convites não vencidos, não cancelados e não usados (ACE-04.2)
- [x] O retorno não tem coluna de hash, token nem e-mail (ACE-01.3)
- [x] Quem não é membro recebe erro de permissão
- [x] `anon` não executa a função
- [x] Gate check passes: `npm test`
- [x] Test count: ao menos 5 testes novos em `tests/sql-convites.test.ts`, nenhum removido

**Tests**: integration
**Gate**: quick

**Commit**: `feat(convites): add pending invites list function`

---

### T10: Cancelar convite

**What**: Criar `convite_cancelar(p_id)` aceitando quem criou o convite ou um `coordenacao` do mandato.
**Where**: `plataforma/supabase/migrations/20261106120000_convites_equipe.sql` (modify)
**Depends on**: T9
**Reuses**: `private.papel_no_mandato`
**Requirement**: ACE-04, ACE-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O criador cancela o próprio convite e ele some de `convites_pendentes` (ACE-04.3, ACE-04.4)
- [x] Um `coordenacao` cancela convite criado por outra pessoa (ACE-04.4)
- [x] `assessoria` ou `leitura` que não criou o convite recebe erro de permissão e o convite continua pendente (ACE-04.5)
- [x] Um convite cancelado deixa de valer na prévia e no aceite (verificado em T11 e T12)
- [x] Linha `convite_cancelado` gravada na mesma transação (ACE-06.1)
- [x] Gate check passes: `npm test`
- [x] Test count: ao menos 6 testes novos em `tests/sql-convites.test.ts`, nenhum removido

**Tests**: integration
**Gate**: quick

**Commit**: `feat(convites): add cancel invite function`

---

### T11: Prévia pública do convite e limite de tentativas

**What**: Criar `convite_previa(p_token)` liberada a `anon`, com registro de falhas, bloqueio por origem e retorno em dados.
**Where**: `plataforma/supabase/migrations/20261106120000_convites_equipe.sql` (modify)
**Depends on**: T10
**Reuses**: `convite_tentativas`, `convite_bloqueios`, `current_setting('request.headers', true)`
**Requirement**: ACE-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Convite válido devolve `{ok:true, nome, papel, convidado_por, mandato:{nome_parlamentar, cargo, uf}, exige_email}` e não altera `usado_em` (ACE-02.1)
- [x] Token inexistente, vencido, cancelado ou usado devolve exatamente `{ok:false, erro:'invalido'}`, o mesmo valor nos quatro casos (ACE-02.10, ACE-02.11)
- [x] Cada falha grava uma linha em `convite_tentativas`, o que prova que a função devolve dados e não exceção (ACE-02.14)
- [x] A 11ª falha em 10 minutos pela mesma origem devolve `{ok:false, erro:'limite'}` e as chamadas seguintes por 15 minutos também; outra origem não é afetada; após 15 minutos volta a responder (ACE-02.14)
- [x] Sem o cabeçalho `x-forwarded-for` o limite não se aplica e a função responde normalmente
- [x] `anon` e `authenticated` executam a função; nenhuma outra função desta feature é liberada a `anon`
- [x] Gate check passes: `npm test`
- [x] Test count: ao menos 9 testes novos em `tests/sql-convites.test.ts`, nenhum removido

**Tests**: integration
**Gate**: quick

**Commit**: `feat(convites): add public invite preview with attempt limit`

---

### T12: Aceitar convite

**What**: Criar `convite_aceitar(p_token, p_nome)` atômica, com checagem de e-mail, consentimento, membro já existente e evento.
**Where**: `plataforma/supabase/migrations/20261106120000_convites_equipe.sql` (modify)
**Depends on**: T11
**Reuses**: `consentimentos`; limite e falhas de `convite_previa`
**Requirement**: ACE-02, ACE-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Aceite válido insere a pessoa em `membros` com o papel do convite, marca `usado_em` e `usado_por`, e devolve `{ok:true, mandato_id, ja_membro:false}` (ACE-02.3, ACE-02.4)
- [x] Sem linha em `consentimentos` da pessoa devolve `{ok:false, erro:'consentimento'}` e o convite continua válido (ACE-02.8)
- [x] Convite com e-mail e conta com e-mail diferente devolve `{ok:false, erro:'email'}` sem consumir; a comparação ignora maiúsculas e espaços nas pontas (ACE-02.9)
- [x] Segundo aceite do mesmo convite devolve `{ok:false, erro:'invalido'}`; o código usa `select ... for update` (ACE-02.12; simultaneidade real não reproduzível no PGlite, registrar como lacuna de precisão)
- [x] Quem já é membro devolve `{ok:true, ja_membro:true}`, mantém o papel atual (inclusive maior que o do convite) e não consome (ACE-02.13)
- [x] Token inválido devolve `{ok:false, erro:'invalido'}` e grava a tentativa; respeita o bloqueio de `limite` (ACE-02.11, ACE-02.14)
- [x] Linha `convite_aceito` gravada na mesma transação (ACE-06.1)
- [x] Aceite sem sessão (`anon`) é recusado
- [x] Gate check passes: `npm test`
- [x] Test count: ao menos 12 testes novos em `tests/sql-convites.test.ts`, nenhum removido

**Tests**: integration
**Gate**: quick

**Commit**: `feat(convites): add accept invite function`

---

### T13: Aposentar o código de convite antigo no banco

**What**: Revogar a execução de `entrar_com_codigo` para `anon` e `authenticated`.
**Where**: `plataforma/supabase/migrations/20261106120000_convites_equipe.sql` (modify)
**Depends on**: T12
**Reuses**: `entrar_com_codigo` (`20261016120000_schema_inicial.sql:206`)
**Requirement**: ACE-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Chamar `entrar_com_codigo` com código válido como `authenticated` falha por falta de permissão e ninguém entra no mandato (ACE-07.1)
- [x] Cadastrar mandato novo continua inserindo a pessoa como `coordenacao` (ACE-07.3)
- [x] A coluna `mandatos.codigo` continua existindo e legível pelas views do `painel-admin` (ACE-07.5)
- [x] Todas as migrations rodam em sequência no PGlite sem erro
- [x] Gate check passes (Build, última task da fase): `npx tsc --noEmit`, `npm test`
- [x] Test count: ao menos 3 testes novos em `tests/sql-convites.test.ts`, nenhum removido

**Tests**: integration
**Gate**: build

**Commit**: `feat(convites): revoke legacy invite code function`

---

### T14: Regras de papéis

**What**: Criar o módulo de papéis com rótulos e permissões.
**Where**: `plataforma/lib/convites/papeis.ts`
**Depends on**: T13
**Reuses**: padrão de `lib/*.ts` puros (AD-004)
**Requirement**: ACE-01, ACE-03, ACE-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `rotuloPapel` devolve "Coordenação", "Assessoria" e "Somente leitura"
- [ ] `papeisPermitidos('coordenacao')` devolve os três; `('assessoria')` devolve assessoria e leitura; `('leitura')` devolve só leitura (ACE-01.6, ACE-04.9)
- [ ] `podeGerirEquipe` é verdadeiro só para coordenação; `podeEditar` é verdadeiro para coordenação e assessoria (ACE-03.3, ACE-04.7, ACE-04.8)
- [ ] Gate check passes: `npm test`
- [ ] Test count: ao menos 8 testes em `tests/convites-papeis.test.ts`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(convites): add role rules module`

---

### T15: Link do convite

**What**: Criar `montaLink` e `tokenDoHash`.
**Where**: `plataforma/lib/convites/link.ts`
**Depends on**: T14
**Reuses**: formato do token do `design.md`
**Requirement**: ACE-01, ACE-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `montaLink('https://100dias.exemplo', 'abc')` devolve `https://100dias.exemplo/convite#abc` (ACE-01.1)
- [ ] `tokenDoHash` devolve o token de `#` + 22 caracteres válidos e devolve `null` para hash vazio, curto, longo, com caractere fora de `A-Za-z0-9_-` e para `#access_token=...` (ACE-02.1)
- [ ] `tokenDoHash` aceita link completo colado (`https://.../convite#token`) e devolve o token
- [ ] Gate check passes: `npm test`
- [ ] Test count: ao menos 8 testes em `tests/convites-link.test.ts`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(convites): add invite link helpers`

---

### T16: Mensagem pronta e link do WhatsApp

**What**: Criar `mensagemConvite` e `urlWhatsApp`.
**Where**: `plataforma/lib/convites/mensagem.ts`
**Depends on**: T15
**Reuses**: textos do wireframe
**Requirement**: ACE-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A mensagem contém o nome parlamentar, quem convida, o link e "vale por 7 dias" (ACE-01.1)
- [ ] `urlWhatsApp(texto)` devolve `https://wa.me/?text=` seguido do texto com `encodeURIComponent`, inclusive acentos, quebra de linha e `#`
- [ ] Gate check passes: `npm test`
- [ ] Test count: ao menos 4 testes em `tests/convites-mensagem.test.ts`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(convites): add invite message and whatsapp url`

---

### T17: Validação do formulário de convite

**What**: Criar `validaConvite({nome, email})` com os limites da spec.
**Where**: `plataforma/lib/convites/validacao.ts`
**Depends on**: T16
**Reuses**: textos de erro da spec
**Requirement**: ACE-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Nome vazio ou só com espaços e nome com 81 caracteres devolvem "Informe um nome de até 80 caracteres."; 80 caracteres passa (ACE-01.7)
- [ ] E-mail vazio passa; e-mail sem `@`, com espaço interno ou com 255 caracteres devolve "E-mail inválido."; e-mail válido de 254 caracteres passa (ACE-01.8)
- [ ] Devolve nome e e-mail normalizados (aparados; e-mail em minúsculas)
- [ ] Gate check passes: `npm test`
- [ ] Test count: ao menos 9 testes em `tests/convites-validacao.test.ts`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(convites): add invite form validation`

---

### T18: Mensagens de erro

**What**: Criar `mensagemDe(erro)` traduzindo as exceções do banco e os códigos `{ok:false}` para os textos da spec.
**Where**: `plataforma/lib/convites/erros.ts`
**Depends on**: T17
**Reuses**: `lib/admin/mensagens.ts` como modelo
**Requirement**: ACE-01, ACE-02, ACE-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `invalido` devolve "Este convite não vale mais. Peça um novo para quem convidou você." (ACE-02.10, ACE-02.11)
- [ ] `email` devolve "Este convite é para outro e-mail. Entre com a conta indicada ou peça um novo convite." (ACE-02.9)
- [ ] `limite` devolve "Muitas tentativas. Tente de novo em alguns minutos." (ACE-02.14)
- [ ] As exceções de papel maior, 20 pendentes e última coordenação devolvem os textos exatos da spec (ACE-01.6, ACE-01.9, ACE-03.7)
- [ ] Erro desconhecido devolve "Não foi possível concluir. Tente de novo."
- [ ] Gate check passes: `npm test`
- [ ] Test count: ao menos 9 testes em `tests/convites-erros.test.ts`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(convites): add error message mapping`

---

### T19: Dia X de 100

**What**: Criar `diaDoMandato(posse, agora)` no fuso `America/Sao_Paulo`.
**Where**: `plataforma/lib/convites/dias.ts`
**Depends on**: T18
**Reuses**: nenhuma
**Requirement**: ACE-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Na data da posse devolve `{estado:'em-curso', dia:1}`; 99 dias depois, `dia:100` (ACE-05.2)
- [ ] Um dia antes da posse devolve `{estado:'antes'}`; 100 dias depois da posse devolve `{estado:'concluido'}` (ACE-05.2)
- [ ] Uma hora às 23:30 de Brasília que já é o dia seguinte em UTC conta como o dia de Brasília
- [ ] Posse ausente devolve `{estado:'sem-posse'}`
- [ ] Gate check passes: `npm test`
- [ ] Test count: ao menos 7 testes em `tests/convites-dias.test.ts`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(convites): add mandate day counter`

---

### T20: Status das missões

**What**: Criar `statusMissoes(feitos, catalogo)`.
**Where**: `plataforma/lib/convites/missoes.ts`
**Depends on**: T19
**Reuses**: regra de missão concluída de `lib/admin/funil.ts`
**Requirement**: ACE-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Todos os exercícios da missão em `feitos` devolvem "Concluída"; ao menos um e não todos, "Em andamento"; nenhum, "A fazer" (ACE-05.3)
- [ ] Devolve as 5 missões na ordem do catálogo, mesmo com `feitos` vazio ou nulo
- [ ] `feitos` com exercício de valor falso ou ausente não conta
- [ ] Gate check passes: `npm test`
- [ ] Test count: ao menos 6 testes em `tests/convites-missoes.test.ts`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(convites): add mission status calculation`

---

### T21: Convite pendente no navegador

**What**: Criar `guardaPendente`, `lePendente` e `limpaPendente` sobre `sessionStorage['legisla.convite']`.
**Where**: `plataforma/lib/convites/pendente.ts`
**Depends on**: T20
**Reuses**: `tokenDoHash` (T15)
**Requirement**: ACE-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Guardar e ler devolve o mesmo token; limpar faz a leitura devolver `null` (ACE-02.5)
- [ ] Valor guardado fora do formato de 22 caracteres lê como `null`
- [ ] Armazenamento que lança exceção não derruba as três funções
- [ ] Gate check passes: `npm test`
- [ ] Test count: ao menos 5 testes em `tests/convites-pendente.test.ts`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(convites): add pending invite storage helpers`

---

### T22: Devolver o retorno do Google à página do convite

**What**: Estender `destinoAuth(hash, conviteGuardado)` para devolver `/convite#...` quando há convite pendente.
**Where**: `plataforma/lib/landing.ts`
**Depends on**: T21
**Reuses**: `destinoAuth` (`lib/landing.ts:2`) e `RedirecionaAuth.tsx`
**Requirement**: ACE-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Com `access_token` no hash e convite pendente devolve `/convite${hash}` (ACE-02.5)
- [ ] Sem convite pendente continua devolvendo `/guia${hash}` (regressão do AD-001)
- [ ] Sem `access_token` nem `error_description` devolve `null` nos dois casos
- [ ] `RedirecionaAuth.tsx` lê o convite pendente com `lePendente` e passa o valor; teste do módulo prova o contrato
- [ ] Gate check passes (Build, última task da fase): `npx tsc --noEmit`, `npm test`
- [ ] Test count: ao menos 4 testes novos em `tests/landing.test.ts`, nenhum removido

**Tests**: unit
**Gate**: build

**Commit**: `feat(convites): route google return back to invite page`

---

### T23: Camada de dados do convite

**What**: Criar uma função por chamada ao banco, sobre o cliente de `lib/admin/api.ts`.
**Where**: `plataforma/lib/convites/api.ts`
**Depends on**: T22
**Reuses**: `criaApi`, `ErroApi` de `lib/admin/api.ts`
**Requirement**: ACE-01, ACE-02, ACE-03, ACE-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `criaConvite`, `previaConvite`, `aceitaConvite`, `cancelaConvite`, `convitesPendentes`, `equipeDoMandato`, `trocaPapel`, `removeMembro`, `saiDoMandato`, `catalogoExercicios` chamam a `rpc` certa com os argumentos `p_mandato`, `p_nome`, `p_email`, `p_papel`, `p_token`, `p_id`, `p_user`
- [ ] `previaConvite` e `aceitaConvite` devolvem o objeto `{ok, ...}` sem lançar quando `ok` é falso; erros HTTP viram `ErroApi`
- [ ] `lerEventosEquipe(mandato)` lê `eventos_equipe` ordenado do mais recente, com limite de 10 (ACE-05.5)
- [ ] Gate check passes: `npm test`
- [ ] Test count: ao menos 12 testes em `tests/convites-api.test.ts`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(convites): add invite data layer`

---

### T24: Página do convite: prévia e aceite com sessão

**What**: Criar `/convite` (componente cliente) com campo de link colado, prévia do convite, aceite, mensagens de erro e abertura do Guia no mandato; a área de conta (sem sessão) fica como espaço reservado preenchido na T25.
**Where**: `plataforma/app/convite/page.tsx`
**Depends on**: T23
**Reuses**: `lib/convites/*`, `lib/admin/sessao.ts`, tokens de `app/landing.css`, wireframe aprovado (aba 3), helper de interceptação no padrão de `e2e/admin-api.ts`
**Requirement**: ACE-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Ler `node_modules/next/dist/docs/` sobre páginas cliente antes de escrever (AGENTS.md)
- [ ] Link com token válido mostra quem convidou, nome parlamentar, cargo, UF e papel, sem chamar o aceite (ACE-02.1)
- [ ] Com sessão, "Aceitar convite" chama o aceite, grava `legisla.mandatoAtual` e vai para `/guia` (ACE-02.4, ACE-02.6)
- [ ] Token inexistente, vencido, cancelado ou usado mostra a mesma mensagem da spec (ACE-02.10, ACE-02.11)
- [ ] Resposta `limite` mostra "Muitas tentativas. Tente de novo em alguns minutos." (ACE-02.14)
- [ ] Resposta `ja_membro` mostra "Você já está neste mandato" e abre o Guia (ACE-02.13)
- [ ] Sem token no hash mostra o campo "Cole o link do convite" e extrai o token do link colado
- [ ] Resposta `email` mostra a mensagem da spec e o convite continua disponível (ACE-02.9)
- [ ] Layout sem rolagem horizontal em 400 px
- [ ] Toda requisição ao Supabase é interceptada; nenhuma sai sem mapa
- [ ] Gate check passes: `npm test` e `npx playwright test e2e/convite-aceite.spec.ts`
- [ ] Test count: ao menos 9 testes em `e2e/convite-aceite.spec.ts`

**Tests**: e2e
**Gate**: full

**Commit**: `feat(convites): add invite page with preview and accept`

---

### T25: Página do convite: criar conta, entrar e Google

**What**: Criar o formulário de conta (criar conta, entrar, entrar com Google) com aviso de consentimento, ligado à página do convite.
**Where**: `plataforma/app/convite/FormularioConta.tsx`
**Depends on**: T24
**Reuses**: `entraComSenha`, `urlGoogle`, `gravaSessao` de `lib/admin/sessao.ts`; `guardaPendente` (T21); aviso e versão `2026-10` de `Store.consentimento` (`nucleo.js:129`); `app/convite/page.tsx`
**Requirement**: ACE-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Sem sessão a página mostra criar conta (nome, e-mail, senha), entrar e entrar com Google (ACE-02.2)
- [ ] Criar conta com dados válidos cria a conta, grava o consentimento, aceita o convite e abre o Guia (ACE-02.3, ACE-02.8)
- [ ] A sessão é gravada em `legisla.tok` no formato do Guia (ACE-02.7, conferido lendo o valor gravado)
- [ ] O aviso de consentimento aparece antes de concluir e o registro é enviado a `consentimentos` antes da chamada de aceite (ACE-02.8)
- [ ] E-mail já usado ou senha fraca mostra o motivo e o convite não é consumido (ACE-02.15)
- [ ] Entrar com Google guarda o token pendente em `sessionStorage` e pede `redirect_to` para `/convite`; na volta com `access_token` no hash a página grava `legisla.tok`, lê o pendente e conclui o aceite sem pedir o link (ACE-02.5)
- [ ] Sessão vencida (401) durante o aceite pede novo login e retoma o mesmo convite (borda da spec)
- [ ] Gate check passes: `npm test` e `npx playwright test e2e/convite-aceite.spec.ts e2e/convite-conta.spec.ts`
- [ ] Test count: ao menos 9 testes novos em `e2e/convite-conta.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(convites): add account form to invite page`

---

### T26: Cabeçalhos de privacidade da página do convite

**What**: Acrescentar `Referrer-Policy: no-referrer` e `X-Robots-Tag: noindex` à rota `/convite`.
**Where**: `plataforma/next.config.mjs`
**Depends on**: T25
**Reuses**: bloco `rewrites` existente como modelo de configuração
**Requirement**: ACE-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A resposta de `/convite` traz `referrer-policy: no-referrer` e `x-robots-tag: noindex`
- [ ] A resposta de `/guia` e de `/` não recebe os dois cabeçalhos
- [ ] Gate check passes (Build, última task da fase): `npx tsc --noEmit`, `npm test`, `npx playwright test e2e/convite-*.spec.ts`
- [ ] Test count: ao menos 3 testes em `e2e/convite-cabecalhos.spec.ts`

**Tests**: e2e
**Gate**: build

**Commit**: `feat(convites): add privacy headers to invite route`

---

### T27: Casca da Área do mandato: sessão, mandato ativo e seletor

**What**: Criar o layout de `/mandato` (sessão, lista de mandatos, papel ativo, seletor com 2 ou mais mandatos) e uma página inicial mínima.
**Where**: `plataforma/app/mandato/layout.tsx`
**Depends on**: T26
**Reuses**: `lib/admin/sessao.ts`, `lib/convites/api.ts`; barra e cores do wireframe; `mandato.css` criado aqui
**Requirement**: ACE-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Sem sessão mostra "Entre para continuar" com botão para `/guia`
- [ ] Com 2 ou mais mandatos mostra o seletor no topo e trocar o mandato troca a página (ACE-05.7)
- [ ] Com 1 mandato não mostra o seletor (ACE-05.8)
- [ ] Com nenhum mandato mostra "Você ainda não está em nenhum mandato" com "Cadastrar um mandato" (abre `/guia`) e "Tenho um link de convite" (abre `/convite`) (ACE-05.9)
- [ ] O papel do mandato ativo fica disponível aos filhos
- [ ] Toda requisição ao Supabase interceptada; layout sem rolagem horizontal em 400 px
- [ ] Gate check passes: `npm test` e `npx playwright test e2e/mandato-casca.spec.ts`
- [ ] Test count: ao menos 7 testes em `e2e/mandato-casca.spec.ts`

**Tests**: e2e
**Gate**: full

**Commit**: `feat(mandato): add mandate area shell with session and selector`

---

### T28: Cartão do mandato, andamento e missões

**What**: Criar `AreaMandato.tsx` com o cartão do mandato, "Dia X de 100", as 5 missões e "Editar dados", ligado a `/mandato`.
**Where**: `plataforma/app/mandato/AreaMandato.tsx`
**Depends on**: T27
**Reuses**: `diaDoMandato` (T19), `statusMissoes` (T20), `catalogo_exercicios()` (T1), wireframe aba 1
**Requirement**: ACE-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Mostra foto, nome parlamentar, cargo, UF, partido e data de posse (ACE-05.1)
- [ ] Mostra "Dia 12 de 100" na data certa, "Posse em DD/MM/AAAA" antes e "100 dias concluídos" depois (ACE-05.2)
- [ ] Mostra as 5 missões com "Concluída", "Em andamento" ou "A fazer" conforme `dados.feitos` (ACE-05.3)
- [ ] "Editar dados" abre a edição do mandato no Guia (ACE-05.6)
- [ ] Papel `leitura` não vê "Editar dados" (ACE-05.10)
- [ ] Gate check passes: `npm test` e `npx playwright test e2e/mandato-area.spec.ts`
- [ ] Test count: ao menos 8 testes em `e2e/mandato-area.spec.ts`

**Tests**: e2e
**Gate**: full

**Commit**: `feat(mandato): add mandate card, day counter and missions`

---

### T29: Resumo da equipe na Área do mandato

**What**: Criar `ResumoEquipe.tsx` com até 3 avatares, total de pessoas, convites pendentes e "Convidar pessoa".
**Where**: `plataforma/app/mandato/ResumoEquipe.tsx`
**Depends on**: T28
**Reuses**: `equipeDoMandato`, `convitesPendentes` (T23); `AreaMandato.tsx`
**Requirement**: ACE-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Mostra no máximo 3 avatares com iniciais e o total real de pessoas (ACE-05.4)
- [ ] Mostra "N convites pendentes" com a contagem real, inclusive zero (ACE-05.4)
- [ ] "Convidar pessoa" abre `/mandato/equipe` (ACE-05.4)
- [ ] Gate check passes: `npm test` e `npx playwright test e2e/mandato-area.spec.ts`
- [ ] Test count: ao menos 4 testes novos em `e2e/mandato-area.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(mandato): add team summary to mandate area`

---

### T30: Atividade recente

**What**: Criar `Atividade.tsx` com os 10 eventos mais recentes de `eventos_equipe`.
**Where**: `plataforma/app/mandato/Atividade.tsx`
**Depends on**: T29
**Reuses**: `lerEventosEquipe` (T23); `AreaMandato.tsx`
**Requirement**: ACE-05, ACE-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Lista no máximo 10 eventos, do mais recente para o mais antigo, com quem fez, o que fez e quando no fuso de Brasília (ACE-05.5)
- [ ] Cada um dos 6 tipos de evento tem texto próprio ("Mariana convidou Carlos Lima como Assessoria" e equivalentes)
- [ ] Sem eventos mostra "Nenhuma atividade ainda."
- [ ] Gate check passes: `npm test` e `npx playwright test e2e/mandato-area.spec.ts`
- [ ] Test count: ao menos 5 testes novos em `e2e/mandato-area.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(mandato): add recent team activity`

---

### T31: Tela Equipe: formulário de convite e link pronto

**What**: Criar `/mandato/equipe` com o formulário "Convidar uma pessoa", o link gerado e os botões copiar link, copiar mensagem e WhatsApp.
**Where**: `plataforma/app/mandato/equipe/FormularioConvite.tsx`
**Depends on**: T30
**Reuses**: `validaConvite` (T17), `papeisPermitidos` (T14), `montaLink` (T15), `mensagemConvite` e `urlWhatsApp` (T16), `mensagemDe` (T18), `criaConvite` (T23); wireframe aba 2; página `equipe/page.tsx` mínima criada aqui
**Requirement**: ACE-01, ACE-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Gerar com nome e papel mostra o link completo, "Vale por 7 dias e só pode ser usado uma vez." e os três botões (ACE-01.1)
- [ ] O seletor de papel oferece só os papéis permitidos: coordenação vê os três, assessoria vê dois, leitura vê só "Somente leitura" (ACE-04.9)
- [ ] Nome inválido, e-mail inválido, papel maior (resposta do banco) e 20 pendentes mostram a mensagem exata da spec e nenhum link (ACE-01.6, ACE-01.7, ACE-01.8, ACE-01.9)
- [ ] "Copiar link" copia o link exato mostrado; "Abrir no WhatsApp" aponta para `https://wa.me/?text=` com a mensagem
- [ ] O link só aparece logo após gerar e some ao recarregar a tela (ACE-01.3)
- [ ] Gate check passes: `npm test` e `npx playwright test e2e/mandato-equipe.spec.ts`
- [ ] Test count: ao menos 9 testes em `e2e/mandato-equipe.spec.ts`

**Tests**: e2e
**Gate**: full

**Commit**: `feat(mandato): add invite form to team page`

---

### T32: Tela Equipe: convites pendentes

**What**: Criar `ListaConvites.tsx` com a lista de pendentes e o botão "Cancelar".
**Where**: `plataforma/app/mandato/equipe/ListaConvites.tsx`
**Depends on**: T31
**Reuses**: `convitesPendentes`, `cancelaConvite` (T23); `equipe/page.tsx`
**Requirement**: ACE-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Mostra nome, papel, quem convidou e "expira em N dias" de cada pendente (ACE-04.2)
- [ ] "Cancelar" remove o convite da lista sem recarregar a página (ACE-04.3, ACE-04.10)
- [ ] Recusa de permissão do banco mostra mensagem e o convite continua na lista (ACE-04.5)
- [ ] Lista vazia mostra "Nenhum convite pendente." (ACE-04.11)
- [ ] Um convite gerado em T31 aparece na lista sem recarregar
- [ ] Gate check passes: `npm test` e `npx playwright test e2e/mandato-equipe.spec.ts`
- [ ] Test count: ao menos 6 testes novos em `e2e/mandato-equipe.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(mandato): add pending invites list`

---

### T33: Tela Equipe: pessoas do mandato

**What**: Criar `ListaPessoas.tsx` com a lista de pessoas, marca "você", seletor de papel, "Remover" e a linha sobre a equipe da Legisla.
**Where**: `plataforma/app/mandato/equipe/ListaPessoas.tsx`
**Depends on**: T32
**Reuses**: `equipeDoMandato`, `trocaPapel`, `removeMembro` (T23); `podeGerirEquipe` (T14); `equipe/page.tsx`
**Requirement**: ACE-03, ACE-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Mostra nome, e-mail e papel de cada pessoa e "você" na própria linha (ACE-04.6)
- [ ] Coordenação vê seletor e "Remover" nas linhas das outras pessoas; assessoria e leitura veem o papel como texto (ACE-04.7, ACE-04.8)
- [ ] Trocar papel e remover atualizam a lista sem recarregar, e remover pede confirmação na própria tela (ACE-04.10)
- [ ] A recusa "O mandato precisa ter ao menos uma pessoa na coordenação." aparece e a lista não muda (ACE-03.7)
- [ ] Mostra "A equipe da Legisla acompanha este mandato, conforme o cadastro." (ACE-04.12)
- [ ] Ordem da tela: formulário, convites pendentes, pessoas (ACE-04.1)
- [ ] Sem rolagem horizontal em 400 px (ACE-04.13)
- [ ] Gate check passes (Build, última task da fase): `npx tsc --noEmit`, `npm test`, `npx playwright test e2e/convite-*.spec.ts e2e/mandato-*.spec.ts`
- [ ] Test count: ao menos 8 testes novos em `e2e/mandato-equipe.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: build

**Commit**: `feat(mandato): add team members list with role controls`

---

### T34: Guia: tirar o código de convite e apontar para a nova Equipe

**What**: Criar `acesso.js` (escrito à mão), registrá-lo em `SCRIPTS` depois de `cadastro`, remover do Guia o campo e a mensagem de código de convite e trocar a tela "Equipe e convites" por um cartão com link para `/mandato/equipe`.
**Where**: `plataforma/public/legacy/acesso.js`
**Depends on**: T33
**Reuses**: `Telas.equipeHtml` e `<details class="cad-codigo">` de `cadastro.js:124` e `:703` (sobrescritos, sem editar o arquivo), `SCRIPTS` de `app/guia/page.tsx`, padrão `legado-*.test.ts`
**Requirement**: ACE-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Nenhuma tela do Guia (entrada sem mandato, Equipe e convites, Configurações) mostra o campo, o botão ou a mensagem de código de convite (ACE-07.2)
- [ ] A tela Equipe e convites do Guia mostra um cartão com link para `/mandato/equipe`
- [ ] `Store.entrarPorCodigo` não é mais chamado por nenhuma tela
- [ ] Cadastrar mandato novo continua criando a pessoa como `coordenacao` (ACE-07.3)
- [ ] `app.js` e `cadastro.js` não aparecem no `git diff` desta task
- [ ] `acesso.js` carrega depois de `cadastro.js` em `app/guia/page.tsx`
- [ ] Se a remoção sem editar `cadastro.js` e `app.js` se mostrar inviável, parar e reportar (o dono do repositório precisa commitar as edições pendentes primeiro)
- [ ] Gate check passes: `npm test` e `npx playwright test e2e/guia-acesso.spec.ts`
- [ ] Test count: ao menos 6 testes em `tests/legado-acesso.test.ts` e `e2e/guia-acesso.spec.ts`

**Tests**: unit
**Gate**: full

**Commit**: `feat(convites): remove invite code from guide and link to team page`

---

### T35: Guia: modo somente leitura

**What**: Acrescentar a `acesso.js` o modo `so-leitura`: classe no `body`, aviso, bloqueio de `Store.salvar` e `Store.atualizar` e CSS que desabilita os controles de gravação.
**Where**: `plataforma/public/legacy/acesso.js` (modify)
**Depends on**: T34
**Reuses**: `Store.abrir`, `Store.salvar` e `Store.atualizar` (`nucleo.js:189`, `:198`, `:206`)
**Requirement**: ACE-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Ao abrir um mandato com papel `leitura` o `body` ganha `so-leitura` e aparece "Você está com acesso somente leitura" (ACE-03.3)
- [ ] `input`, `textarea`, `select` e botões de gravação ficam desabilitados com o papel `leitura`; com `assessoria` e `coordenacao` ficam como hoje (ACE-03.3)
- [ ] Nenhuma requisição de gravação sai do Guia aberto como `leitura` ao digitar ou clicar, e nenhum "Não foi possível salvar" aparece (ACE-03.2)
- [ ] Gate check passes: `npm test` e `npx playwright test e2e/guia-acesso.spec.ts`
- [ ] Test count: ao menos 6 testes novos em `tests/legado-acesso.test.ts` e `e2e/guia-acesso.spec.ts`, nenhum removido

**Tests**: unit
**Gate**: full

**Commit**: `feat(convites): add read-only mode to guide`

---

### T36: Aviso de consentimento sem "código de convite"

**What**: Trocar "código de convite" por "link de convite" no aviso de consentimento, sem mudar mais nenhuma palavra.
**Where**: `plataforma/lib/legacyBody.ts`
**Depends on**: T35
**Reuses**: texto atual do aviso em `legacyBody.ts`
**Requirement**: ACE-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O aviso contém "link de convite" e não contém "código de convite" (ACE-07.4)
- [ ] O restante do texto do aviso é idêntico ao de antes (comparação com o texto original no teste)
- [ ] Gate check passes: `npm test`
- [ ] Test count: ao menos 3 testes novos em `tests/legado-acesso.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick

**Commit**: `fix(convites): replace invite code wording in consent notice`

---

### T37: Registrar decisões e pendências

**What**: Acrescentar AD-008 e AD-009 em `.specs/STATE.md` e registrar as pendências manuais e as dependências com `painel-admin`.
**Where**: `.specs/STATE.md`
**Depends on**: T36
**Reuses**: formato das decisões AD-001 a AD-007
**Requirement**: ACE-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] AD-008 (convite e equipe só por funções `security definer`, falha devolvida como dado quando a tentativa precisa persistir) e AD-009 (segredo de link no fragmento da URL) estão em `## Decisions`
- [ ] O `## Handoff` lista as pendências manuais: conferir "Confirmar e-mail" no Supabase, conferir o cabeçalho `x-forwarded-for` em produção, incluir `/convite` nas Redirect URLs, aplicar a migration só com go-ahead e a tela de membros do `/admin` aceitar `leitura`
- [ ] `excluir_meus_dados()` sem checagem de coordenação está registrada como acompanhamento
- [ ] Gate check passes (Build): `npx tsc --noEmit`, `npm test`, `npx playwright test e2e/convite-*.spec.ts e2e/mandato-*.spec.ts e2e/guia-acesso.spec.ts`
- [ ] A seção `## Decisions` anterior continua intacta

**Tests**: none
**Gate**: build

**Commit**: `docs(convites): record decisions and pending items`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

Phase 1:  T1 ------→ T2 ------→ T3 ------→ T4 ------→ T5 ------→ T6
Phase 2:  T7 ------→ T8 ------→ T9 ------→ T10 -----→ T11 -----→ T12 -----→ T13
Phase 3:  T14 -----→ T15 -----→ T16 -----→ T17 -----→ T18 -----→ T19 -----→ T20 -----→ T21 -----→ T22
Phase 4:  T23 -----→ T24 -----→ T25 -----→ T26
Phase 5:  T27 -----→ T28 -----→ T29 -----→ T30 -----→ T31 -----→ T32 -----→ T33
Phase 6:  T34 -----→ T35 -----→ T36 -----→ T37
```

37 tasks, 6 fases. Empacotamento em lotes de cerca de 7 tarefas, com fases inteiras: lote 1 = fase 1 (6), lote 2 = fase 2 (7), lote 3 = fase 3 (9), lote 4 = fase 4 (4), lote 5 = fase 5 (7), lote 6 = fase 6 (4). Execução estritamente sequencial; o Verifier roda sozinho depois da T37.

Sugestão de nível de modelo por lote (só se o ambiente permitir escolher): lotes 1, 2, 4 e 6 em raciocínio alto (segurança do banco, sessão, Guia legado); lotes 3 e 5 em nível mais rápido (lógica pura e telas sobre padrão já definido); Verifier em nível médio-alto.

---

## Pendências manuais (fora das tasks, dependem de você)

1. Conferir no painel do Supabase se "Confirmar e-mail" (Authentication, Providers, Email) está ligado. Se estiver, pessoas de fora não conseguem criar conta pelo convite com o e-mail embutido.
2. Incluir a URL de `/convite` nas Redirect URLs do Supabase (o retorno do Google funciona mesmo sem isso, pelo repasse da raiz).
3. Depois do primeiro uso em produção, conferir se o cabeçalho `x-forwarded-for` chega à função do banco (limite de tentativas).
4. A migration só vai ao banco ao subir para a `main`, com go-ahead explícito.
5. A tela de membros do `/admin` precisa aceitar o papel `leitura` (spec `painel-admin`).

---

## Diagram-Definition Cross-Check

Cada fase é uma cadeia linear: toda task depende da anterior da própria fase, e a primeira de cada fase depende da última da fase anterior (dependência para trás, permitida).

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | início da fase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | fase anterior | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |
| T14 | T13 | fase anterior | ✅ Match |
| T15 | T14 | T14 → T15 | ✅ Match |
| T16 | T15 | T15 → T16 | ✅ Match |
| T17 | T16 | T16 → T17 | ✅ Match |
| T18 | T17 | T17 → T18 | ✅ Match |
| T19 | T18 | T18 → T19 | ✅ Match |
| T20 | T19 | T19 → T20 | ✅ Match |
| T21 | T20 | T20 → T21 | ✅ Match |
| T22 | T21 | T21 → T22 | ✅ Match |
| T23 | T22 | fase anterior | ✅ Match |
| T24 | T23 | T23 → T24 | ✅ Match |
| T25 | T24 | T24 → T25 | ✅ Match |
| T26 | T25 | T25 → T26 | ✅ Match |
| T27 | T26 | fase anterior | ✅ Match |
| T28 | T27 | T27 → T28 | ✅ Match |
| T29 | T28 | T28 → T29 | ✅ Match |
| T30 | T29 | T29 → T30 | ✅ Match |
| T31 | T30 | T30 → T31 | ✅ Match |
| T32 | T31 | T31 → T32 | ✅ Match |
| T33 | T32 | T32 → T33 | ✅ Match |
| T34 | T33 | fase anterior | ✅ Match |
| T35 | T34 | T34 → T35 | ✅ Match |
| T36 | T35 | T35 → T36 | ✅ Match |
| T37 | T36 | T36 → T37 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 a T13 | Migration SQL e funções | integration | integration | ✅ OK |
| T14 a T22 | Lógica pura | unit | unit | ✅ OK |
| T23 | Camada de dados | unit | unit | ✅ OK |
| T24, T25 | Páginas Next.js | e2e | e2e | ✅ OK |
| T26 | Configuração | e2e | e2e | ✅ OK |
| T27 a T33 | Páginas e componentes Next.js | e2e | e2e | ✅ OK |
| T34, T35 | Guia legado (`acesso.js`) | unit + e2e | unit (com e2e no gate) | ✅ OK |
| T36 | Guia legado (`legacyBody.ts`) | unit | unit | ✅ OK |
| T37 | Documentação | none | none | ✅ OK |

Cobertura de requisitos: ACE-01 a ACE-07 estão cobertos por ao menos uma task; ACE-06 pelas tasks T2 a T5, T8, T10, T12, T30.
