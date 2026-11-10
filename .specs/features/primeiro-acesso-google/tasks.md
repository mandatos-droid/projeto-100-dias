# Primeiro Acesso e Login só com Google Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/primeiro-acesso-google/design.md`
**Spec**: `.specs/features/primeiro-acesso-google/spec.md`
**Status**: In progress (Execute)
**Branch**: `feat/primeiro-acesso-google` (criada a partir de `feat/acesso-convites`)

Regras que valem para todas as tasks:

- Todos os comandos rodam dentro de `plataforma/`.
- Commits só com caminhos explícitos (`git add <arquivo>`), nunca `git add -A` ou `git add .`. A árvore tem alterações não commitadas de outras frentes (`ilhas/`, `public/data/`, `public/legacy/ilhas.css`, `graphify-out/`); não as inclua.
- Antes de escrever código Next.js, ler o guia correspondente em `node_modules/next/dist/docs/` (regra do `plataforma/AGENTS.md`).
- Imports em `lib/` e `tests/` são relativos e terminam em `.ts` (AD-004).
- `public/legacy/nucleo.js`, `app.js` e os demais arquivos extraídos não se editam à mão (AD-003); o Guia muda só por `public/legacy/acesso.js` e `lib/legacyBody.ts`.
- Esta feature não faz `git push`, não aplica migration no Supabase e não faz deploy. A migration só é aplicada pelo workflow ao subir para a `main`, e isso exige go-ahead explícito.
- Todas as mensagens de erro e textos de tela seguem literalmente a spec. Os rótulos de gênero, raça e faixa de tempo seguem a spec e o `design.md`.
- Texto do consentimento de dados sensíveis é provisório (revisão jurídica da Legisla pendente): marque no código com o comentário `// TEXTO PROVISÓRIO: revisão jurídica pendente`.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `plataforma/AGENTS.md` (ler a documentação do Next 16 antes de codar), `plataforma/package.json` (scripts `test` e `test:e2e`), `plataforma/playwright.config.*`, e as tasks da feature `acesso-equipe-convites` (mesmo padrão de teste).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Migration SQL e funções do banco (`supabase/migrations/*.sql`) | integration (PGlite, migrations reais) | Todos os ramos; 1:1 com os critérios PAG-03 e as recusas de PAG-02; cada mensagem de erro e cada recusa de permissão da spec | `plataforma/tests/sql-perfil*.test.ts` | `npm test` |
| Lógica pura (`lib/perfil/*.ts`, `lib/admin/perfil.ts`) | unit | Todos os ramos; 1:1 com os critérios; cada caso de borda e cada texto de erro | `plataforma/tests/perfil-*.test.ts` | `npm test` |
| Camada de dados (`lib/perfil/api.ts`) | unit (api falsa) | Um teste por função: nome da `rpc`, nomes dos argumentos `p_*`, tradução do retorno e do erro | `plataforma/tests/perfil-api.test.ts` | `npm test` |
| Páginas e componentes Next.js (`app/primeiro-acesso/`, `app/convite/`, `app/mandato/`, `app/admin/`) | e2e (Playwright, Supabase interceptado) | Todas as rotas da task: caminho feliz, cada borda e cada erro listado na spec; nenhuma chamada sem mapa | `plataforma/e2e/primeiro-acesso*.spec.ts` e specs existentes ajustados | `npx playwright test <spec>` |
| Ajustes no Guia legado (`public/legacy/acesso.js`, `lib/legacyBody.ts`) | unit (vm, padrão `legado-*.test.ts`) + e2e | Cada ajuste provado no arquivo e na tela; nenhum texto do Guia fora do escopo muda | `plataforma/tests/legado-acesso.test.ts`, `plataforma/e2e/guia-acesso.spec.ts` | `npm test` e `npx playwright test e2e/guia-acesso.spec.ts` |
| Documentação (`.specs/STATE.md`) | none | - (gate de build apenas) | - | gate de build apenas |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks com teste de unidade ou de SQL | `npm test` |
| Full | Tasks com e2e | `npm test` e `npx playwright test <specs da task>` |
| Build | Última task de cada fase e tasks sem teste | `npx tsc --noEmit`, `npm test` e `npx playwright test e2e/convite-*.spec.ts e2e/mandato-*.spec.ts e2e/guia-acesso.spec.ts e2e/primeiro-acesso*.spec.ts e2e/admin-*.spec.ts` (os specs que já existirem) |

`npm run build` não entra no gate: falha por `SecurityFatalError` do Next 16.4 (advisory conhecido, registrado em `STATE.md`).

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Banco do perfil

```
T1 → T2 → T3
```

### Phase 2: Lógica pura

```
T3 → T4 → T5 → T6
```

### Phase 3: Páginas do primeiro acesso

```
T6 → T7 → T8 → T9 → T10
```

### Phase 4: Login só com Google

```
T10 → T11 → T12 → T13
```

### Phase 5: Analytics do perfil e documentação

```
T13 → T14 → T15 → T16
```

---

## Task Breakdown

### T1: Tabela do perfil e função de gravação

**What**: Criar a migration `perfis` com a tabela, a RLS de leitura, `perfil_salvar` e `private.tem_perfil`.
**Where**: `plataforma/supabase/migrations/20261109120000_perfis.sql` (new)
**Depends on**: none
**Reuses**: `private.eh_legisla`; molde de função `jsonb` com erro como dado de `20261106150000_convites_de_quem_sai.sql`; `sql-ambiente.ts`
**Requirement**: PAG-02, PAG-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] A tabela `perfis` segue o modelo do `design.md`; `authenticated` só tem `select`, sem `insert`, `update` nem `delete` (PAG-03.1). Sem a coluna `uf`: a spec (Assumptions, "sem UF (decidido em 2026-11-09)", e PAG-02.3) fixa os campos sem UF
- [x] Pessoa lê só o próprio perfil; a equipe Legisla (qualquer papel) lê todos; membro de mandato lê zero linhas de outra pessoa, mesmo do mesmo mandato (PAG-03.4, 03.5, 03.6)
- [x] `perfil_salvar` grava só com o `user_id` da sessão e é a única porta de escrita; insert direto de `authenticated` é recusado (PAG-03.2, 03.3)
- [x] `perfil_salvar` grava `perfis` e `consentimentos` (versão `2026-11`) na mesma transação; se o consentimento falhar (gatilho de teste que levanta exceção) o perfil é desfeito (PAG-02.12)
- [x] Segunda chamada com perfil existente devolve `{ok:true}` e mantém uma única linha (PAG-02.14)
- [x] `perfil_salvar` devolve `{ok:false, erro:<campo>}` para nome fora de 2 a 120 caracteres ou com uma palavra, data inexistente, futura ou anterior a 1900-01-01, telefone sem DDD de 11 a 99 mais 8 ou 9 dígitos, gênero, raça, atuação ou tempo fora da lista, e tempo com `atua = false` ou ausente com `atua = true` (PAG-02.9, 02.10, 02.11, PAG-03.7, 03.8). Sem `p_uf` (spec sem UF); `p_nascimento` é texto, para data inexistente voltar como `{ok:false, erro:'nascimento'}` e não como exceção
- [x] `private.tem_perfil()` devolve `true` para quem está em `equipe_legisla` ou tem perfil e `false` nos demais casos (PAG-02.15, 02.16)
- [x] `anon` não executa as funções
- [x] Gate check passes: `npm test` (999 testes, 0 falhas)
- [x] Test count: 18 testes novos em `tests/sql-perfil.test.ts`, nenhum removido (981 → 999)

**Tests**: integration
**Gate**: quick

**Commit**: `feat(perfil): add profile table and save function`

**Status**: ✅ Done

---

### T2: Trava do banco nas portas de entrada e exclusão de dados

**What**: Exigir perfil em `convite_aceitar` e em `mandatos_criar`, e apagar `perfis` em `excluir_meus_dados`, na mesma migration.
**Where**: `plataforma/supabase/migrations/20261109120000_perfis.sql` (modify) e `plataforma/tests/sql-ambiente.ts` (modify)
**Depends on**: T1
**Reuses**: versão atual de `convite_aceitar` e `excluir_meus_dados` em `20261106150000_convites_de_quem_sai.sql`; política `mandatos_criar` de `20261016120000_schema_inicial.sql`
**Requirement**: PAG-02, PAG-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `convite_aceitar` copia a versão de `20261106150000` sem mudar mais nada e devolve `{ok:false, erro:'perfil'}` logo depois da checagem de consentimento para quem não tem perfil nem está na equipe Legisla; o convite não é consumido (PAG-02.2). No banco a função se chama `public.convite_aceitar`; o `diff` com a versão de `20261106150000` mostra só as 3 linhas da checagem
- [x] A política `mandatos_criar` exige `private.tem_perfil()` além de `criado_por = auth.uid()`; quem não tem perfil recebe erro de permissão ao criar mandato (PAG-02.2)
- [x] `excluir_meus_dados` copia a versão de `20261106150000` e acrescenta a exclusão da linha de `perfis` da pessoa (PAG-03.10)
- [x] Excluir a conta (`delete` em `auth.users`) apaga o perfil em cascata (PAG-03.9)
- [x] `sql-ambiente.ts` ganha o helper `comPerfil(banco, userId)` e os testes de SQL existentes que criam mandato ou aceitam convite com conta sem perfil passam a usá-lo, sem remover nem enfraquecer nenhum teste (só a preparação mudou: `contas()` e `consentem()` em `sql-convites.test.ts`, e 3 testes de cadastro de mandato em `sql-convites.test.ts` e `sql-membros.test.ts`)
- [x] Gate check passes: `npm test` (1010 testes, 0 falhas)
- [x] Test count: 11 testes novos em `tests/sql-perfil-trava.test.ts`, nenhum removido (999 → 1010); todos os testes de SQL antigos continuam passando

**Tests**: integration
**Gate**: quick

**Commit**: `feat(perfil): require profile to join a mandate`

**Status**: ✅ Done

---

### T3: Função de resumo para o Analytics

**What**: Criar `admin_perfil_resumo()` com contagens por mês, gênero, raça, faixa etária e atuação.
**Where**: `plataforma/supabase/migrations/20261109130000_perfil_resumo.sql` (new)
**Depends on**: T2
**Reuses**: `private.eh_legisla`; molde de função de leitura de `20261105130000_admin_leitura.sql`
**Requirement**: PAG-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] A função devolve `{total, por_mes, genero, raca, faixa, atuacao}` só com contagens, sem nome, e-mail, telefone nem data de nascimento (PAG-06.6, 06.7). Sem `uf`: a spec decidiu o perfil sem UF e PAG-06.3 não lista UF. Gênero, raça e atuação vêm pelas chaves internas; a faixa vem com o rótulo da spec; `por_mes` é `[{mes:'YYYY-MM', qtd}]`, como o `statusMensal` do Analytics
- [x] A soma das categorias de cada distribuição é igual a `total` (PAG-06.12)
- [x] As faixas etárias são `Até 24`, `25 a 34`, `35 a 44`, `45 a 54`, `55 a 64` e `65 ou mais`, calculadas a partir de `nascimento` em `America/Sao_Paulo`, com os limites testados em 24/25, 34/35, 44/45, 54/55, 64/65 anos (PAG-06.5)
- [x] `atuacao` traz `nao_atua` e as 5 faixas de tempo; `nao_informar` aparece como categoria própria em gênero e raça (PAG-06.3, 06.4)
- [x] `por_mes` vai do mês do primeiro perfil ao atual, no máximo 12 meses (PAG-06.2), com o mês contado em `America/Sao_Paulo`
- [x] Quem não está em `equipe_legisla` recebe erro de permissão; `admin` e `leitura` da Legisla executam (PAG-06.8, 06.1)
- [x] Sem nenhum perfil devolve `total = 0` e distribuições vazias
- [x] `anon` não executa a função
- [x] Gate check passes: `npm test` (1023 testes, 0 falhas); gate de build da fase 1: `npx tsc --noEmit` sem erro e 275 e2e de `convite-`, `mandato-`, `guia-acesso` e `admin-` passando (servidor na porta 3100)
- [x] Test count: 13 testes novos em `tests/sql-perfil-resumo.test.ts`, nenhum removido (1010 → 1023)

**Tests**: integration
**Gate**: quick

**Commit**: `feat(perfil): add admin profile summary function`

**Status**: ✅ Done

---

### T4: Opções e validação do perfil

**What**: Criar as listas de opções e a função `validaPerfil` com os textos literais da spec.
**Where**: `plataforma/lib/perfil/opcoes.ts` (new) e `plataforma/lib/perfil/validacao.ts` (new)
**Depends on**: T3
**Reuses**: `plataforma/lib/convites/validacao.ts` (padrão de função pura com mensagem)
**Requirement**: PAG-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `opcoes.ts` exporta gênero (8), raça (6), atuação (6) com chave interna e rótulo exatamente como a spec (PAG-02.4, 02.5, 02.6), e `TEMPOS` (as 5 faixas oferecidas a quem responde "Sim"). Sem UF: a spec decidiu o perfil sem UF
- [x] `validaPerfil` recusa campo vazio com "Preencha todos os campos e aceite o tratamento dos dados para continuar." e consentimento desmarcado com a mesma mensagem (PAG-02.8). As duas caixas do design (geral e dados sensíveis) contam; o campo destacado é o primeiro vazio na ordem do formulário; gênero, raça ou tempo fora da lista contam como vazios
- [x] Recusa nome com menos de duas palavras ou fora de 2 a 120 caracteres com "Informe seu nome completo." (PAG-02.9)
- [x] Recusa data inexistente, futura ou anterior a 1900-01-01 com "Informe uma data de nascimento válida." (PAG-02.10), com "hoje" no fuso de Brasília
- [x] Recusa telefone sem DDD de 11 a 99 mais 8 ou 9 dígitos com "Informe um telefone com DDD." e aceita parênteses, espaço e hífen, devolvendo só dígitos (PAG-02.11)
- [x] "Sim" exige tempo; "Não" grava `nao_atua` e ignora o tempo (PAG-02.4, 02.5): o dado pronto leva `atua: false, tempo: null`, que é como `perfis` guarda "Não atuo na política"
- [x] Gate check passes: `npm test` (1049 testes, 0 falhas) e `npx tsc --noEmit` sem erro
- [x] Test count: 26 testes novos em `tests/perfil-validacao.test.ts`, nenhum removido (1023 → 1049)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(perfil): add profile options and validation`

**Status**: ✅ Done

---

### T5: Fluxo e link colado

**What**: Criar `proximoPasso` e `tokenDoLinkColado`.
**Where**: `plataforma/lib/perfil/fluxo.ts` (new) e `plataforma/lib/perfil/link.ts` (new)
**Depends on**: T4
**Reuses**: `plataforma/lib/convites/link.ts` (`tokenDoHash`)
**Requirement**: PAG-02, PAG-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `proximoPasso` devolve `seguir` para quem está na equipe Legisla, qualquer que seja o resto (PAG-02.16)
- [x] Devolve `perfil` para quem não tem perfil e não é da Legisla (PAG-02.1, 02.2)
- [x] Com perfil e mandato devolve `seguir`; com perfil, sem mandato e sem convite devolve `pergunta`, ou `cadastroMandato` se a marca `semEquipe` está presente; com convite devolve `seguir` (PAG-04.1, 04.8, 04.9)
- [x] `tokenDoLinkColado` aceita o link inteiro e só o token e devolve `null` para qualquer outro texto (PAG-04.4, 04.5). "Link inteiro" é o que termina em `/convite#<token>`; link de outra página com token no fragmento devolve `null`
- [x] Gate check passes: `npm test` (1063 testes, 0 falhas)
- [x] Test count: 14 testes novos em `tests/perfil-fluxo.test.ts`, nenhum removido (1049 → 1063)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(perfil): add first access flow rules`

**Status**: ✅ Done

---

### T6: Camada de dados do perfil

**What**: Criar `meuPerfil`, `ehEquipeLegisla` e `perfilSalvar` sobre o cliente REST.
**Where**: `plataforma/lib/perfil/api.ts` (new)
**Depends on**: T5
**Reuses**: `plataforma/lib/convites/api.ts` (padrão de rpc com retorno como dado); `plataforma/lib/admin/api.ts`
**Requirement**: PAG-02, PAG-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `perfilSalvar` chama a rpc `perfil_salvar` com os argumentos `p_nome`, `p_nascimento`, `p_genero`, `p_raca`, `p_telefone`, `p_atua`, `p_tempo` e traduz `{ok:false, erro}` na mensagem da spec (PAG-02.12). Sem `p_uf` (spec sem UF). `nome`, `nascimento` e `telefone` viram as mensagens de PAG-02.9 a 02.11; `genero`, `raca`, `atua` e `tempo` viram a de campo vazio (PAG-02.8), com o campo
- [x] Falha de rede ou 5xx vira "Não foi possível salvar. Tente de novo." (PAG-02.13); 401 segue como `ErroApi`, para a sessão renovar
- [x] `meuPerfil` consulta `perfis?select=user_id&user_id=eq.<id>` e devolve `true` ou `false`; erro de consulta propaga e nunca vira `false` (PAG-02.15)
- [x] `ehEquipeLegisla` consulta `equipe_legisla?select=user_id&user_id=eq.<id>` (PAG-02.16)
- [x] Gate check passes: `npm test` (1077 testes, 0 falhas); gate de build da fase 2: `npx tsc --noEmit` sem erro e 275 e2e de `convite-`, `mandato-`, `guia-acesso` e `admin-` passando (a primeira rodada teve 1 falha de tempo em `admin-menu-guia.spec.ts:23`, que passou sozinha e na segunda rodada completa)
- [x] Test count: 14 testes novos em `tests/perfil-api.test.ts`, nenhum removido (1063 → 1077)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(perfil): add profile data layer`

**Status**: ✅ Done

---

### T7: Página `/primeiro-acesso`: perfil

**What**: Criar a página com os estados `carregando`, `entrada`, `perfil` e `erro` e o formulário completo.
**Where**: `plataforma/app/primeiro-acesso/page.tsx` (new), `plataforma/app/primeiro-acesso/PrimeiroAcesso.tsx` (new), `plataforma/app/primeiro-acesso/primeiro-acesso.css` (new), `plataforma/e2e/primeiro-acesso-api.ts` (new)
**Depends on**: T6
**Reuses**: `app/convite/page.tsx` e `app/convite/convite.css` (casca e estilo); `AvisoConsentimento` e `CaixaConsentimento` de `app/convite/FormularioConta.tsx`; `lib/admin/sessao.ts`
**Requirement**: PAG-01, PAG-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Sem sessão a página mostra só "Entrar com Google"; na volta do Google segue o fluxo de `proximoPasso` (PAG-01.1, 01.3)
- [x] Erro ou cancelamento do Google mostra "Não foi possível entrar com o Google. Tente de novo." e mantém o botão (PAG-01.4)
- [x] O formulário traz os 7 campos da spec com as listas de `opcoes.ts`, o nome do Google preenchido e editável, o tempo só quando "Sim", o aviso geral da LGPD, a caixa geral e a caixa específica dos dados sensíveis com o comentário `// TEXTO PROVISÓRIO` (PAG-02.3 a 02.7)
- [x] Cada recusa de PAG-02.8 a 02.11 aparece com o texto literal, campo destacado e dados mantidos; falha ao salvar mostra "Não foi possível salvar. Tente de novo." sem perder o que foi digitado (PAG-02.13)
- [x] Duplo clique em enviar grava um único perfil (botão desabilitado durante o envio) (PAG-02.14)
- [x] Quem já tem perfil ou está na equipe Legisla não vê o formulário (PAG-02.15, 02.16)
- [x] Layout legível em 400 px de largura, sem rolagem horizontal
- [x] `perfilSalvar` lança `ErroApi` para 401 e para os demais 4xx (só rede e 5xx viram "Não foi possível salvar. Tente de novo."): a página renova a sessão no 401 e mostra "Não foi possível salvar. Tente de novo." nos outros 4xx
- [x] Gate check passes: `npm test` e `npx playwright test e2e/primeiro-acesso.spec.ts`
- [x] Test count: ao menos 12 testes e2e novos em `e2e/primeiro-acesso.spec.ts` (mock em `e2e/primeiro-acesso-api.ts`), nenhum removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(primeiro-acesso): add profile form page`

**Status**: ✅ Done

---

### T8: Pergunta sobre a equipe e instruções do link

**What**: Acrescentar à página os estados `pergunta` e `instrucoes` e a volta ao ponto de partida.
**Where**: `plataforma/app/primeiro-acesso/PrimeiroAcesso.tsx` (modify), `plataforma/app/primeiro-acesso/primeiro-acesso.css` (modify), `plataforma/e2e/primeiro-acesso-api.ts` (modify)
**Depends on**: T7
**Reuses**: `lib/perfil/fluxo.ts`, `lib/perfil/link.ts`, `lib/convites/pendente.ts`
**Requirement**: PAG-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Depois do perfil, sem convite e sem mandato, a página pergunta "A equipe do seu mandato já criou uma conta?" com "Sim, já criou" e "Ainda não" (PAG-04.1)
- [x] "Sim, já criou" abre as instruções em 3 passos (Área do mandato, Equipe e convites, Gerar link de convite) com campo para colar o link e botão para voltar à pergunta (PAG-04.2, 04.3, 04.10)
- [x] Link válido colado abre `/convite#<token>`; texto que não é link mostra "Este não parece um link de convite. Peça a quem convidou para enviar de novo." (PAG-04.4, 04.5)
- [x] "Ainda não" grava `legisla.semEquipe=1` em `sessionStorage` e abre `/guia` (PAG-04.6)
- [x] Com `volta=convite` e token pendente, depois do perfil abre `/convite#<token>` sem mostrar a pergunta (PAG-04.8)
- [x] Com `volta=guia` ou `volta=mandato` e a pessoa já em algum mandato, não mostra a pergunta e volta ao ponto de partida (PAG-04.9)
- [x] Gate check passes: `npm test` e `npx playwright test e2e/primeiro-acesso.spec.ts`
- [x] Test count: ao menos 10 testes e2e novos em `e2e/primeiro-acesso.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(primeiro-acesso): add team question and invite instructions`

**Status**: ✅ Done

---

### T9: Entradas `/convite` e `/mandato` mandam ao perfil

**What**: Tratar `erro:'perfil'` no aceite do convite e checar perfil na casca de `/mandato`.
**Where**: `plataforma/app/convite/Convite.tsx` (modify), `plataforma/lib/convites/api.ts` (modify), `plataforma/app/mandato/Casca.tsx` (modify), `plataforma/e2e/convite-api.ts` (modify), `plataforma/e2e/mandato-api.ts` (modify)
**Depends on**: T8
**Reuses**: `lib/perfil/api.ts`, `lib/convites/pendente.ts`
**Requirement**: PAG-01, PAG-02, PAG-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `aceitaConvite` traduz `erro:'perfil'` em um tipo próprio, sem mensagem para a pessoa
- [x] `Convite.tsx` guarda o token pendente e abre `/primeiro-acesso?volta=convite` quando o aceite devolve `perfil`; na volta do perfil, o aceite conclui e abre o Guia (PAG-02.1, 04.8)
- [x] `Casca.tsx` de `/mandato` abre `/primeiro-acesso?volta=mandato` para quem não tem perfil e não é da Legisla; quem tem perfil ou é da Legisla segue sem mudança (PAG-02.1, 02.2, 02.16)
- [x] Falha na consulta de perfil mostra o erro existente de `/mandato` e nunca manda ao formulário (design: Error Handling)
- [x] Os specs `e2e/convite-*.spec.ts` e `e2e/mandato-*.spec.ts` existentes continuam passando com o mock ajustado, sem enfraquecer teste
- [x] Gate check passes: `npm test` e `npx playwright test e2e/convite-*.spec.ts e2e/mandato-*.spec.ts`
- [x] Test count: ao menos 6 testes e2e novos (convite e mandato), nenhum removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(primeiro-acesso): send people without a profile to the form`

**Status**: ✅ Done

---

### T10: Guia legado manda ao perfil e à pergunta

**What**: Sobrescrever `App.entrou` no Guia para checar perfil e usar a marca `semEquipe` no primeiro acesso.
**Where**: `plataforma/public/legacy/acesso.js` (modify), `plataforma/tests/legado-acesso.test.ts` (modify), `plataforma/e2e/guia-acesso.spec.ts` (modify)
**Depends on**: T9
**Reuses**: padrão de override de `acesso.js`; `Nuvem.rest`; harness de `legado-acesso.test.ts`
**Requirement**: PAG-02, PAG-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Antes de `meusMandatos`, o Guia consulta `equipe_legisla` e `perfis`; sem perfil e fora da Legisla, `location.replace('/primeiro-acesso?volta=guia')` (PAG-02.1, 02.2)
- [x] Quem é da Legisla ou tem perfil abre o Guia como hoje (PAG-02.15, 02.16)
- [x] Falha na consulta de perfil não manda ao formulário: o Guia mostra o erro que já mostra (design: Error Handling)
- [x] Sem mandato: com `legisla.semEquipe` presente abre `Telas.primeiroAcesso()` (cadastro do mandato); sem a marca, `location.replace('/primeiro-acesso')` (PAG-04.6, 04.1)
- [x] Quem conclui o cadastro de mandato vira `coordenacao` e abre o Guia (PAG-04.7)
- [x] `app.js` e `nucleo.js` seguem sem edição
- [x] Gate check passes: `npm test` e `npx playwright test e2e/guia-acesso.spec.ts`
- [x] Test count: ao menos 8 testes novos entre `tests/legado-acesso.test.ts` e `e2e/guia-acesso.spec.ts`, nenhum removido

**Tests**: unit
**Gate**: full

**Commit**: `feat(primeiro-acesso): gate the Guia on the profile`

**Status**: ✅ Done

---

### T11: Convite só com Google

**What**: Reduzir `FormularioConta` ao botão do Google e remover cadastro e login por senha do convite.
**Where**: `plataforma/app/convite/FormularioConta.tsx` (modify), `plataforma/app/convite/Convite.tsx` (modify), `plataforma/lib/convites/erros.ts` (modify), `plataforma/e2e/convite-api.ts` (modify), `plataforma/e2e/convite-conta.spec.ts` (modify), `plataforma/tests/convites-erros.test.ts` (modify)
**Depends on**: T10
**Reuses**: `urlGoogle` e `guardaPendente`
**Requirement**: PAG-01, PAG-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A página do convite sem sessão mostra só "Entrar com Google"; sem campos de nome, e-mail e senha, sem "Criar conta" e sem abas (PAG-01.1, 01.2)
- [ ] Antes de sair para o Google o token é guardado; na volta o aceite conclui sem pedir o link de novo (PAG-01.5)
- [ ] `criaConta`, `entrar`, `CONFIRME_EMAIL` e o tratamento de `email_not_confirmed` saem do app (PAG-05.1, 05.2)
- [ ] `AvisoConsentimento` e `CaixaConsentimento` continuam exportados; a etapa `consentimento` do `Convite.tsx` continua funcionando para contas Google sem consentimento
- [ ] Os mocks `/auth/v1/signup` e `grant_type=password` saem de `e2e/convite-api.ts`; nenhum teste afirma o comportamento removido
- [ ] Gate check passes: `npm test` e `npx playwright test e2e/convite-*.spec.ts`
- [ ] Test count: testes de formulário substituídos por ao menos 6 testes e2e do fluxo só com Google; nenhum teste de outra área removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(convite): sign in with Google only`

---

### T12: `/admin` só com Google

**What**: Remover o formulário de senha de `/admin` e a função `entraComSenha`.
**Where**: `plataforma/app/admin/_componentes/Sessao.tsx` (modify), `plataforma/lib/admin/sessao.ts` (modify), `plataforma/tests/admin-sessao.test.ts` (modify), `plataforma/e2e/admin-acesso.spec.ts` (modify), `plataforma/e2e/admin-api.ts` (modify)
**Depends on**: T11
**Reuses**: `urlGoogle`
**Requirement**: PAG-01, PAG-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `/admin` sem sessão mostra só "Entrar com Google", sem campo de senha (PAG-01.1, 01.2)
- [ ] `entraComSenha` e o `grant_type=password` saem de `lib/admin/sessao.ts`; a renovação por `refresh_token` continua (PAG-05.1, 05.3)
- [ ] Erro do Google aparece na entrada como hoje (PAG-01.4)
- [ ] Os testes de senha de `admin-sessao.test.ts` e `admin-acesso.spec.ts` saem e dão lugar aos do Google; nenhum teste de outra área é enfraquecido
- [ ] Gate check passes: `npm test` e `npx playwright test e2e/admin-acesso.spec.ts`
- [ ] Test count: ao menos 4 testes novos do fluxo só com Google, nenhum de outra área removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(admin): sign in with Google only`

---

### T13: Guia só com Google

**What**: Sobrescrever no Guia a entrada por senha e esconder os campos de e-mail e senha.
**Where**: `plataforma/public/legacy/acesso.js` (modify), `plataforma/lib/legacyBody.ts` (modify), `plataforma/tests/legado-acesso.test.ts` (modify), `plataforma/e2e/guia-acesso.spec.ts` (modify)
**Depends on**: T12
**Reuses**: padrão de override de `acesso.js`
**Requirement**: PAG-01, PAG-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A tela de entrada do Guia mostra só "Entrar com Google" e o aviso de LGPD, sem campos de e-mail, senha e nome, sem abas e sem "Criar conta" (PAG-01.1, 01.2)
- [ ] `Store.criarConta` e `Store.entrar` lançam `Error('Entre com o Google.')` sem chamada de rede (PAG-05.1)
- [ ] A mensagem "Confirme o e-mail enviado e faça login" não aparece em nenhuma tela do Guia (PAG-05.2)
- [ ] A renovação por `refresh_token` do Guia continua (PAG-05.3)
- [ ] Uma busca por `signup` e `grant_type=password` em `app/`, `lib/` e `public/legacy/acesso.js` não acha uso (PAG-05.1)
- [ ] `app.js` e `nucleo.js` seguem sem edição
- [ ] Gate check passes: `npm test` e `npx playwright test e2e/guia-acesso.spec.ts`
- [ ] Test count: ao menos 6 testes novos entre `tests/legado-acesso.test.ts` e `e2e/guia-acesso.spec.ts`, nenhum removido

**Tests**: unit
**Gate**: full

**Commit**: `feat(guia): sign in with Google only`

---

### T14: Lógica da seção de perfil do Analytics

**What**: Criar `lib/admin/perfil.ts` que transforma o resumo em categorias com número e porcentagem inteira.
**Where**: `plataforma/lib/admin/perfil.ts` (new)
**Depends on**: T13
**Reuses**: `plataforma/lib/admin/analytics.ts` (padrão de função pura); `lib/perfil/opcoes.ts` (rótulos)
**Requirement**: PAG-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Cada distribuição vira categorias com rótulo da spec, quantidade e porcentagem inteira (arredondada), na ordem da spec (PAG-06.3)
- [ ] `Prefiro não informar` é categoria própria em gênero e raça (PAG-06.4)
- [ ] As faixas etárias saem na ordem `Até 24` a `65 ou mais` (PAG-06.5)
- [ ] A soma das quantidades de cada distribuição é igual a `total` (PAG-06.12)
- [ ] `total = 0` devolve o estado vazio "Ainda não há perfis cadastrados." (PAG-06.9)
- [ ] `por_mes` vira rótulos `Mês/aa` como `rotuloMes` do Analytics (PAG-06.2)
- [ ] Gate check passes: `npm test`
- [ ] Test count: ao menos 12 testes novos em `tests/admin-perfil.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick

**Commit**: `feat(admin): add profile summary view model`

---

### T15: Seção "Perfil de quem usa a plataforma" no Analytics

**What**: Montar a seção na tela Analytics com a rpc `admin_perfil_resumo` e os gráficos.
**Where**: `plataforma/app/admin/analytics/SecaoPerfil.tsx` (new), `plataforma/app/admin/analytics/page.tsx` (modify), `plataforma/e2e/admin-analytics-perfil.spec.ts` (new), `plataforma/e2e/admin-api.ts` (modify)
**Depends on**: T14
**Reuses**: `app/admin/_componentes/Grafico.tsx`; `useAdmin`
**Requirement**: PAG-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A seção aparece na tela Analytics para `admin` e `leitura` e mostra o total e o gráfico de cadastros por mês (PAG-06.1, 06.2)
- [ ] Mostra gênero, raça, faixa etária e atuação com número e porcentagem; cada gráfico tem título que diz o que mede e categorias em texto (PAG-06.3, 06.11)
- [ ] Nenhum nome, e-mail, telefone nem data de nascimento aparece na tela nem nas chamadas de rede (PAG-06.6)
- [ ] Sem perfis mostra "Ainda não há perfis cadastrados." e nenhum gráfico vazio (PAG-06.9)
- [ ] Falha da rpc mostra "Não foi possível carregar o perfil. Tente de novo." sem afetar o restante do Analytics (PAG-06.10)
- [ ] Layout legível em 400 px, sem rolagem horizontal; os specs `e2e/admin-analytics*.spec.ts` existentes continuam passando
- [ ] Gate check passes: `npm test` e `npx playwright test e2e/admin-analytics-perfil.spec.ts e2e/admin-analytics.spec.ts`
- [ ] Test count: ao menos 8 testes e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(admin): add profile section to analytics`

---

### T16: Registrar a feature no STATE.md

**What**: Registrar as decisões da feature e as pendências de publicação no `STATE.md`.
**Where**: `.specs/STATE.md` (modify)
**Depends on**: T15
**Reuses**: formato dos AD existentes
**Requirement**: PAG-01, PAG-02, PAG-03, PAG-04, PAG-05, PAG-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Decisão `AD-013` registra: login só com Google, perfil de 7 campos, consentimento da versão `2026-11`, `/primeiro-acesso` como página única e trava do banco nas duas portas
- [ ] Pendências listadas: revisão jurídica do texto do consentimento, conferir no banco que não há contas com senha, `/painel` (`painel.html`) ainda tem login próprio, `/primeiro-acesso` e `/convite` nas Redirect URLs do Supabase, sessão por `sessionStorage` perde o token se a pessoa trocar de aba, tela de lista e exportação de perfis fora do escopo
- [ ] A seção Handoff aponta a branch, a última task e o próximo passo
- [ ] Gate check passes: `npx tsc --noEmit` e `npm test`
- [ ] Test count: sem teste novo; nenhum removido

**Tests**: none
**Gate**: build

**Commit**: `docs(primeiro-acesso): record decisions and open items`
