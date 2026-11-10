# Resumo do Preenchimento Reestruturado Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/resumo-reestruturado/design.md`
**Spec**: `.specs/features/resumo-reestruturado/spec.md`
**Referência visual**: `.specs/features/resumo-reestruturado/proposta.html`
**Status**: Draft
**Branch**: `feat/resumo-reestruturado`, num worktree próprio, a partir de `origin/main`

Regras que valem para todas as tasks:

- **Worktree isolado (obrigatório).** A pasta `Projeto 100 dias` é compartilhada com outras sessões; nunca trabalhar nela. O orquestrador cria o worktree antes do primeiro batch: `git worktree add "../Projeto 100 dias - resumo" -b feat/resumo-reestruturado origin/main`, copia para ele a pasta `.specs/features/resumo-reestruturado/` (spec, design, tasks e `proposta.html`), roda `npm ci` em `plataforma/` e faz o commit `docs(resumo): add spec, design and tasks`. Todo worker trabalha **só** nesse worktree.
- Comandos rodam dentro de `plataforma/` do worktree. Porta 3000 é de outra sessão: e2e na 3100 com `playwright.isolado.config.ts` (não versionado, nunca commitar), servidor subido fora do Playwright com `npx next dev -p 3100`; receita em `plataforma/CLAUDE.md`, "Em worktree isolado".
- Commits só com caminhos explícitos (`git add <arquivo>`), nunca `git add -A` nem `git add .`. Mensagens em Conventional Commits em inglês, como o histórico (`feat(resumo): ...`), com o rodapé de coautoria do ambiente.
- Antes de escrever código Next.js, ler o guia correspondente em `node_modules/next/dist/docs/` (regra do `plataforma/AGENTS.md`).
- Não editar arquivos gerados: `public/legacy/app.js`, `resumo.js`, `legacy.css`, `conteudo.js`, `lib/legacyBody.ts`. A mudança entra por `resumo-tela.js` (novo), `ilhas.css`, ilhas React e `lib/`.
- Imports em `lib/` e `tests/` são relativos e terminam em `.ts` (padrão do projeto); nas ilhas vale o alias `@/`.
- Textos de tela seguem literalmente a spec (português do Brasil, sentença com inicial maiúscula).
- Esta feature **não faz `git push`, não faz deploy e não mexe em migrations**. Publicar é outro passo, com go-ahead explícito do usuário.
- Antes de cada task, ler o trecho do mock em `proposta.html` que ela cita; o CSS do mock é o ponto de partida.
- Workers não rodam `graphify update .` por task; o orquestrador regenera o grafo uma vez, no fim.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `plataforma/CLAUDE.md` (comandos, padrão `vm` do legado, e2e do Guia, armadilhas), `plataforma/AGENTS.md` (ler a doc do Next antes de codar), `plataforma/package.json` (`test`), `plataforma/playwright.config.*`, e as features vizinhas (`missao3-rumo`, `primeiro-acesso-google`) como padrão de teste.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Lógica pura (`lib/resumoRetrato.ts`, `lib/resumoEquipe.ts`, `lib/resumoSocial.ts`) | unit | Todos os ramos; 1:1 com os critérios da spec; cada caso de borda listado | `plataforma/tests/resumo-*.test.ts` | `npm test` |
| Script do legado (`public/legacy/resumo-tela.js`) | unit (vm, padrão `legado-*.test.ts`) | Funções puras (`html`, `previa`, regras de abertura, contador, cartões, selos) 1:1 com os critérios; HTML de `Resumo.ex`/`Resumo.missao` inalterado | `plataforma/tests/legado-resumo.test.ts` | `npm test` |
| Comportamento da tela no navegador (clique, rolagem, filtro, impressão, mobile) | e2e (Playwright, Guia real em modo local) | Todo critério de interação da spec: caminho feliz, cada borda e cada erro listado | `plataforma/e2e/resumo-*.spec.ts` | `npx playwright test -c playwright.isolado.config.ts e2e/resumo-` |
| Ilhas React (`ilhas/ResumoRetrato.tsx`, `ilhas/ResumoEquipe.tsx`, `ilhas/Social.tsx`) | e2e | Cada estado visível da spec (com dado, sem dado, falha de carga) | `plataforma/e2e/resumo-*.spec.ts` | idem |
| CSS (`public/legacy/ilhas.css`) | e2e (layout: sticky, 375 px, impressão) | Os critérios de layout da spec | `plataforma/e2e/resumo-layout.spec.ts` | idem |
| Registro em `app/guia/page.tsx` e `ilhas/ponte.tsx` | e2e (a tela aparece) | Coberto pelos e2e da task que registra | `plataforma/e2e/resumo-*.spec.ts` | idem |
| Documentação (`plataforma/CLAUDE.md`, `.specs/STATE.md`) | none | - (gate de build apenas) | - | gate de build apenas |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks com teste de unidade | `npm test` |
| Full | Tasks com e2e | `npm test` e `npx playwright test -c playwright.isolado.config.ts e2e/resumo-` |
| Build | Última task de cada fase e tasks sem teste | `npx tsc --noEmit`, `npm test` e `npx playwright test -c playwright.isolado.config.ts e2e/resumo- e2e/rumo-painel.spec.ts e2e/m1- e2e/m23-` |

`npm run build` não entra no gate: falha por `SecurityFatalError` do Next 16.4 (advisory conhecido, registrado em `STATE.md`). `npm test` e `npx tsc --noEmit` rodam dentro de `plataforma/`.

---

## Plano de execução com sub-agents

13 tasks em 4 fases. Empacotamento (orçamento ~7 tasks por worker, fases inteiras):

| Batch | Fases | Tasks | Worker | Modelo sugerido |
| ----- | ----- | ----- | ------ | --------------- |
| 1 | Fase 1 (estrutura) + Fase 2 (retrato e equipe) | T1 a T7 | Worker 1 | Alto raciocínio: T1 e T2 definem a arquitetura da tela |
| 2 | Fase 3 (cartões, território, selos) + Fase 4 (fechamento) | T8 a T13 | Worker 2 | Médio: tasks mais mecânicas, sobre a base do batch 1 |
| - | Verifier (automático, após T13) | - | Verifier | Médio a alto: faz mutação |

Regras de orquestração:

1. O orquestrador (sessão principal) oferece o plano ao usuário e **só despacha depois de um "sim" explícito**.
2. Cria o worktree e o commit de docs (ver Regras acima) **antes** do batch 1.
3. Batches são sequenciais: o batch 2 só começa depois de o resumo do batch 1 mostrar T1 a T7 concluídas e `npm test` verde no worktree.
4. Cada worker recebe: as definições de tasks do seu batch, a Test Coverage Matrix e os Gate Check Commands deste arquivo, `references/coding-principles.md` da skill, `spec.md`, `design.md` e o caminho do `proposta.html`. Executa implement → gate → commit atômico por task, na ordem, sem criar sub-agents, e devolve o resumo compacto (tasks concluídas com hash, testes passando, desvios).
5. O orquestrador marca cada task como concluída aqui (e a rastreabilidade na spec) **antes** do commit da task, no mesmo commit.
6. Em `Tests: e2e`, o worker sobe `npx next dev -p 3100` fora do Playwright e o derruba no fim.
7. Depois de T13, o Verifier roda sozinho e escreve `validation.md`. Falhas viram tasks de correção (máx. 3 rodadas).
8. Instrução obrigatória do projeto no prompt de todo worker: **antes de explorar código, rodar `graphify query "<pergunta>"`** (regra do `CLAUDE.md` da raiz); depois ler só as linhas que o grafo apontou.

---

## Execution Plan

### Phase 1: Estrutura da tela

```
T1 → T2 → T3
```

### Phase 2: Retrato e equipe

```
T3 → T4 → T5 → T6 → T7
```

### Phase 3: Cartões, território e selos

```
T7 → T8 → T9 → T10 → T11
```

### Phase 4: Fechamento

```
T11 → T12 → T13
```

---

## Task Breakdown

### T1: Montar a tela dos blocos recolhíveis

**What**: Criar `resumo-tela.js` com `ResumoTela.html()` (cabeçalho com o ponto de montagem do retrato, barra e ferramentas só como marcação, 5 missões e seus exercícios em `<details>`, regra de abertura, prévia, caixa de exercício vazio e link "Continuar/Começar este exercício →") e registrá-lo em `SCRIPTS` de `app/guia/page.tsx`, depois de `m1` e antes de `sugestoes`.
**Where**: `plataforma/public/legacy/resumo-tela.js` (new)
**Depends on**: none
**Reuses**: `estadoEx`, `progMissao`, `progGeral`, `Telas.estadoTxt`, `Resumo.ex`, `Resumo.sem`, `linkPasso`/`rotulo` de `novos.js` (só como referência de URL); marcação do mock em `proposta.html` (`.missao`, `.ex`); padrão de teste de `tests/legado-m4.test.ts`
**Requirement**: RES-01, RES-10, RES-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `ResumoTela.html()` devolve as 5 missões como `<details class="missao">` com "Missão {n}", título curto, `prazoTxt` e "{feitos}/{total}", e um `<details class="ex">` por exercício com título linkado a `#/m/{n}/{id}`, selo de `estadoEx` e texto de `Telas.estadoTxt` (RES-01.1, 01.2)
- [x] Missão aberta só se algum exercício tem estado diferente de "nao"; exercício "nao" cujo `Resumo.ex` não mostra resposta fica fechado com a caixa "Nenhuma resposta registrada ainda." e o link "Começar este exercício →"; os demais (inclusive "nao" com resposta visível em `Resumo.ex`) abertos com o corpo `Resumo.ex(ex)` (RES-01.3, 01.4)
- [x] Exercício "andamento" termina com "Continuar este exercício →" para `#/m/{n}/{id}` (RES-10)
- [x] `previa()` devolve texto puro, sem tags, de até 160 caracteres, ou "não preenchido" sem resposta; texto longo sem espaços não vaza HTML (edge cases)
- [x] O corpo do exercício de tipo `funcoes` é o ponto de montagem `<div class="ilha" data-ilha="resumo-equipe">` e a tela traz `<div class="ilha" data-ilha="resumo-retrato">` no cabeçalho (design)
- [x] `Resumo.ex` e `Resumo.missao` devolvem o mesmo HTML de antes para os mesmos dados (RES-12.1): teste compara a saída com a de um `vm` que não carrega `resumo-tela.js`
- [x] `resumo-tela.js` carrega no Guia (entrada em `SCRIPTS` na posição do design) sem erro de console
- [x] Gate check passes: `npm test`
- [x] Test count: ≥ 12 testes novos em `tests/legado-resumo.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick

**Commit**: `feat(resumo): build the collapsible mission and exercise tree`

**Status**: ✅ Done

---

### T2: Ligar a tela: barra, ferramentas, rolagem e impressão

**What**: Em `resumo-tela.js`, sobrepor `Telas.resumo` (com `Resumo.vivo` em `try/finally`, `Ilhas.ligar`, `tela.className = 'tela largo'`), desenhar a barra (percentual de `progGeral`, "N de {total} exercícios concluídos", 5 segmentos `<button>` com nome acessível, botão único "Baixar resumo completo (HTML)" → `Baixar.tudo()`), as ferramentas (Expandir tudo, Recolher tudo, "Mostrar só o que falta preencher", contador com `aria-live`) e `ligar()` (clique no segmento, scroll-spy por `getBoundingClientRect` com 160 px, `beforeprint`/`afterprint`, ouvintes removidos a cada nova chamada).
**Where**: `plataforma/public/legacy/resumo-tela.js` (modify)
**Depends on**: T1
**Reuses**: `progGeral`, `progMissao`, `Baixar.tudo`, `Telas.resumo` de `novos.js` (como modelo do `vivo` e do `Ilhas.ligar`); marcação `.barra`, `.segs`, `.ferr` do mock
**Requirement**: RES-02, RES-03, RES-04, RES-05, RES-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Barra mostra "38%" e "6 de 16 exercícios concluídos" com 6 de 16 feitos; "0%" e "0 de 16" sem respostas; "100%" e a frase "Todos os exercícios estão concluídos." com tudo feito (RES-02.1, edge cases)
- [x] Cada segmento mostra "M{n} · {curto}", "{feitos}/{total}" e a barra em `feitos/total`; é `<button>` com nome "Ir para a Missão {n}: {título curto}" (RES-02.2, RES-13.3)
- [x] Clique no segmento abre a missão, rola até ela e **não** altera `location.hash` (RES-02.3)
- [x] Rolagem marca `aria-current="true"` no segmento da última missão com topo ≤ 160 px (a 1ª se nenhuma) e `"false"` nos demais (RES-02.4)
- [x] A tela tem exatamente um botão de ação, "Baixar resumo completo (HTML)", que chama `Baixar.tudo()`; não existem "Gerar PDF" nem "Baixar dados (JSON)" (RES-03)
- [x] Expandir tudo e Recolher tudo abrem e fecham todos os blocos; "só o que falta" oculta exercícios concluídos e missões totalmente concluídas e restaura o estado ao desmarcar; contador com `aria-live="polite"` e as frases da spec, inclusive "1 exercício ainda sem conclusão" e "Nenhum exercício pendente." (RES-04)
- [x] `beforeprint` abre tudo e `afterprint` restaura o estado anterior de cada bloco (RES-05.1)
- [x] Voltar a `#/resumo` não duplica ouvintes de `scroll`, `beforeprint` e `afterprint` (um teste conta as chamadas)
- [x] Gate check passes: `npm test` e `npx playwright test -c playwright.isolado.config.ts e2e/resumo-estrutura.spec.ts`
- [x] Test count: ≥ 8 testes unitários novos e ≥ 8 e2e em `e2e/resumo-estrutura.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(resumo): add fixed progress bar, tools and print handling`

**Status**: ✅ Done

---

### T3: Estilizar a tela (barra fixa, blocos, impressão, celular)

**What**: Acrescentar a `ilhas.css` o bloco `/* ===== Resumo reestruturado ===== */` sob `#tela .res2` com os estilos do mock: barra `sticky` (com `top` igual a `--topo-movel` em ≤61,25rem), segmentos, blocos `<details>` das missões e dos exercícios, selos, caixa de vazio, ferramentas, botão fixo no rodapé em ≤61,25rem com `env(safe-area-inset-bottom)`, `scroll-margin-top`, foco visível, `@media print` (oculta barra, ferramentas e setas) e `prefers-reduced-motion`; a raiz da tela ganha a classe `res2` em `resumo-tela.js`.
**Where**: `plataforma/public/legacy/ilhas.css` (modify)
**Depends on**: T2
**Reuses**: CSS do mock (`proposta.html`, blocos `Barra fixa`, `Missão`, `Exercício`, `Impressão`); tokens de `legacy.css`
**Requirement**: RES-02, RES-03, RES-05, RES-13

**Tools**:

- MCP: NONE
- Skill: `frontend-design` (só para conferir contraste e hierarquia contra o mock; não redesenhar)

**Done when**:

- [x] A barra permanece visível no topo depois de rolar 1.500 px (posição `top` ≈ 0 no desktop e abaixo do `.topo-movel` no celular) (RES-02.4)
- [x] Depois de clicar em um segmento, o título da missão fica visível abaixo da barra (`top` do título ≥ altura da barra) (RES-02.5)
- [x] A 800 px de largura o botão de download fica fixo no rodapé, na largura toda; a 1.280 px fica na barra (RES-03, RES-01.8)
- [x] A 375 px `document.documentElement.scrollWidth <= clientWidth` e os segmentos rolam na horizontal dentro da barra (RES-13.5)
- [x] Com `emulateMedia({ media: 'print' })` a barra e as ferramentas não são visíveis e, após `beforeprint`, todos os `<details>` estão abertos (RES-05.2)
- [x] Com `reducedMotion: 'reduce'` o `scroll-behavior` calculado é `auto` (RES-13.4)
- [x] Todo botão e `<summary>` mostra anel de foco ao receber Tab (RES-13.3)
- [x] Gate check passes: `npx playwright test -c playwright.isolado.config.ts e2e/resumo-layout.spec.ts` e `npx tsc --noEmit`
- [x] Test count: ≥ 7 e2e novos em `e2e/resumo-layout.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: build

**Commit**: `feat(resumo): style the restructured summary screen`

**Status**: ✅ Done (gate build: as 11 falhas de `m1-etapas`, `m23-*` e `rumo-painel` já falham sem a feature, conferido com `resumo-tela` fora de `SCRIPTS`; `m1-persona.spec.ts:29` passa com RES-01.4 refinado)

---

### T4: Lógica pura do retrato

**What**: Criar `lib/resumoRetrato.ts` com `fotoUrl`, `inicial`, `abrevia`, `legendaPos`, `legendaVagas` e `numeros(entrada)` que devolve só os números com fonte.
**Where**: `plataforma/lib/resumoRetrato.ts` (new)
**Depends on**: T3
**Reuses**: URL e regra de ano de `ResumoIlhas.foto` (`public/legacy/novos.js:156-162`); `fmt`/`Intl.NumberFormat('pt-BR')`
**Requirement**: RES-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `fotoUrl` usa `ele2024/619` para prefeito e vereador e `ele2026/6259` nos demais, com `uf` em minúsculas e o `sq` como arquivo `.jpeg`; sem `sq` devolve `null` (RES-06.2, 06.3)
- [ ] `inicial('Ângela')` devolve "Â"; nome vazio devolve "?"; emoji ou espaço inicial não quebra (RES-06.3, edge cases)
- [ ] `abrevia(97335)` devolve "97.335" para o valor exato da votação e a abreviação de filiados devolve "112 mil+" para 112.340, "9.800" para 9.800 e "10 mil+" para 10.000 (RES-06.4, 06.6)
- [ ] `legendaPos(57,'SP')` devolve "57º mais votado(a) · SP · TSE"; sem `pos`, sem legenda (RES-06.4)
- [ ] `legendaVagas(1)` devolve "1 processo seletivo a abrir"; `legendaVagas(3)` devolve "3 processos seletivos a abrir"; 0 devolve vazio (RES-06.7)
- [ ] `numeros()` omite cada número cuja fonte falta; com todas faltando devolve lista vazia (RES-06.8)
- [ ] Gate check passes: `npm test`
- [ ] Test count: ≥ 14 testes novos em `tests/resumo-retrato.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick

**Commit**: `feat(resumo): add pure helpers for the portrait header`

---

### T5: Ilha do retrato com foto e números

**What**: Criar `ilhas/ResumoRetrato.tsx` (cartão vinho com foto ou inicial, nome, "cargo · UF", partido; números de votos, cadeiras do partido, filiados e cargos da equipe) e registrá-la em `ilhas/ponte.tsx` como `'resumo-retrato'`; o CSS do cartão e dos números vai para `ilhas.css`.
**Where**: `plataforma/ilhas/ResumoRetrato.tsx` (new)
**Depends on**: T4
**Reuses**: `lib/resumoRetrato.ts`, `useLegado`, `useCarga`, `carregaUF`, `carregaFiliadosUF`, `linhas`, `vistaDaTabela`; a escolha de Casa de `ilhas/Resumos.tsx:18-90`; CSS `.parl`, `.stat`, `.retrato` do mock
**Requirement**: RES-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Com `D.tse` completo, o cabeçalho mostra o cartão e o número de votos em pt-BR com a legenda da posição (RES-06.1, 06.4)
- [ ] Com `D.tse.sq`, a imagem aponta para a URL do TSE; com a foto bloqueada (rota abortada), aparece a inicial (RES-06.2, 06.3)
- [ ] Cadeiras do partido e filiados aparecem quando as fontes carregam, com os rótulos "Cadeiras do {partido} na {Casa}" e "Filiados do {partido} em {UF}"; sem partido, os dois somem (RES-06.5, 06.6, 06.8)
- [ ] "Cargos da equipe com nome" mostra "X/Y" e a legenda de vagas; sem linhas ativas, o número some (RES-06.7)
- [ ] Sem nenhuma fonte, só o cartão da parlamentar aparece, sem traço nem caixa vazia (RES-06.8)
- [ ] Falha de carga (`carregaUF` rejeitada por rota 500) omite o número e a tela segue funcionando (RES-06.9)
- [ ] A 600 px o cartão fica acima dos números, em faixa horizontal (RES-06.10)
- [ ] Gate check passes: `npx playwright test -c playwright.isolado.config.ts e2e/resumo-retrato.spec.ts` e `npm test`
- [ ] Test count: ≥ 8 e2e novos em `e2e/resumo-retrato.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(resumo): add portrait header island with key numbers`

---

### T6: Lógica pura do organograma

**What**: Criar `lib/resumoEquipe.ts` com `arvore(c)`: chefia, ramos por área na ordem de `COORDENACOES`, cartões ordenados por categoria e linha, estado `ok | vaga | aberto`.
**Where**: `plataforma/lib/resumoEquipe.ts` (new)
**Depends on**: T5
**Reuses**: `linhas`, `vistaDaTabela` (`lib/tabelaEquipe.ts`), `COORDENACOES`, `COR_COORD` (`lib/equipe.ts`), `CATEGORIAS`; fixtures de `tests/tabelaEquipe.test.ts`
**Requirement**: RES-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A linha da área "Chefia de área" vira `chefia`; as demais viram ramos na ordem de `COORDENACOES`, só os ramos com linhas (RES-09.1)
- [ ] Dentro do ramo a ordem é Chefia, Coordenação, Especialista, Executora e, em empate, a ordem das linhas (RES-09.2)
- [ ] Pessoa com `*` vira `estado:'vaga'`; pessoa vazia vira `'aberto'`; demais `'ok'` (RES-09.3)
- [ ] Mandato no formato antigo (sem `m2.n`) usa a vista derivada e produz os mesmos ramos que a tabela (RES-09.5)
- [ ] Sem linhas ativas devolve `chefia: null` e `ramos: []` (RES-09.7)
- [ ] Gate check passes: `npm test`
- [ ] Test count: ≥ 10 testes novos em `tests/resumo-equipe.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick

**Commit**: `feat(resumo): add pure tree model for the team chart`

---

### T7: Ilha do organograma da equipe

**What**: Criar `ilhas/ResumoEquipe.tsx` que desenha a árvore de `arvore()` (chefia no topo, ramos em grade com linhas de ligação, cartões nos três estados, legenda) e registrá-la em `ilhas/ponte.tsx` como `'resumo-equipe'`; o CSS vai para `ilhas.css`.
**Where**: `plataforma/ilhas/ResumoEquipe.tsx` (new)
**Depends on**: T6
**Reuses**: `lib/resumoEquipe.ts`, `useLegado`, `COR_COORD`; CSS `.org`, `.car`, `.ram` e a legenda do mock
**Requirement**: RES-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Com 1 chefia, 2 pessoas, 1 linha com `*` e 1 vazia, a tela mostra 2 cartões comuns, 1 tracejado "Processo seletivo a abrir" e 1 apagado "Sem nome" (RES-09.3)
- [ ] A legenda mostra os três estados (RES-09.4)
- [ ] A 600 px os ramos ficam em coluna única e as linhas de ligação não aparecem (RES-09.6)
- [ ] Sem linhas ativas, o corpo mostra "não preenchido" (RES-09.7)
- [ ] Mandato em formato antigo mostra o mesmo organograma que a tabela da Missão 2 (RES-09.5)
- [ ] Gate check passes: `npx playwright test -c playwright.isolado.config.ts e2e/resumo-equipe.spec.ts`, `npm test` e `npx tsc --noEmit`
- [ ] Test count: ≥ 6 e2e novos em `e2e/resumo-equipe.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: build

**Commit**: `feat(resumo): add team org chart island with open seats marked`

---

### T8: Cartões de aliados, opositores e potenciais

**What**: Em `resumo-tela.js`, sobrepor `ResumoIlhas.lista` para, com `Resumo.vivo`, devolver três grupos (Aliados, Opositores, Potenciais, com contagem) de cartões com foto ou inicial, nome, partido, cargo, município (relação local) e votos; sem `Resumo.vivo` devolve a lista de texto original; CSS dos cartões em `ilhas.css`.
**Where**: `plataforma/public/legacy/resumo-tela.js` (modify)
**Depends on**: T7
**Reuses**: `ResumoIlhas.rel`, `ResumoIlhas.foto`, `ResumoIlhas.lista` original (guardada em variável), `titulo`, `fmt`; CSS `.cards`, `.pessoa`, `.grp` do mock
**Requirement**: RES-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Com 3 aliados, 2 opositores e 1 potencial, aparecem três grupos com contagens 3, 2 e 1 e um cartão por pessoa (RES-07.1)
- [ ] Cada cartão tem foto ou inicial, nome, partido, cargo, município (só relação local) e "{votos} votos" em pt-BR quando `votos` existe (RES-07.2)
- [ ] O anel da foto é verde, coral ou roxo conforme o grupo (RES-07.3)
- [ ] Grupo vazio não aparece; sem nenhuma relação, o Resumo mantém "não preenchido" (RES-07.4, 07.5)
- [ ] Sem `Resumo.vivo` (download), a lista de texto original sai idêntica à de antes (RES-07.6, RES-12.3)
- [ ] Gate check passes: `npm test` e `npx playwright test -c playwright.isolado.config.ts e2e/resumo-cartoes.spec.ts`
- [ ] Test count: ≥ 6 testes unitários e ≥ 4 e2e novos, nenhum removido

**Tests**: e2e
**Gate**: full

**Commit**: `feat(resumo): show allies, opponents and potentials as cards`

---

### T9: Lógica pura do território

**What**: Criar `lib/resumoSocial.ts` com `porTerritorio(itens)`.
**Where**: `plataforma/lib/resumoSocial.ts` (new)
**Depends on**: T8
**Reuses**: tipos `ItemSoc`, `NivelSoc` de `lib/types.ts`; `localeCompare('pt-BR')`
**Requirement**: RES-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Nível `BR` vira o território "Brasil"; `UF` e `MUN` viram uma linha por nome de `nomes`, com município como "{nome} ({uf})" (RES-08.2)
- [ ] Um item com `nomes: ['São Paulo','Rio de Janeiro']` aparece em duas linhas (RES-08.2)
- [ ] Ordem: Brasil, UFs, municípios, e alfabética pt-BR dentro de UFs e de municípios, com acento ("Ceará" antes de "Distrito Federal") (RES-08.3)
- [ ] Cada linha separa `problemas` e `potencialidades` por `tipo` (RES-08.4)
- [ ] Lista vazia devolve `[]` (RES-08.6)
- [ ] Gate check passes: `npm test`
- [ ] Test count: ≥ 8 testes novos em `tests/resumo-social.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick

**Commit**: `feat(resumo): add pure grouping of social items by territory`

---

### T10: Tabela de problemas e potencialidades por território

**What**: Trocar o corpo de `SocialResumo` (`ilhas/Social.tsx`) por uma tabela "Território | Problemas | Potencialidades" com etiquetas vermelhas e verdes (nome da agenda) seguidas do `texto` em letra menor, "—" em célula sem itens, quadro com rolagem horizontal própria em telas estreitas; CSS em `ilhas.css`. Antes de editar, `grep` por `SocialResumo` e por textos da lista antiga nos testes e e2e e ajustar o que depender dela.
**Where**: `plataforma/ilhas/Social.tsx` (modify)
**Depends on**: T9
**Reuses**: `lib/resumoSocial.ts`, `agendaDe`, `ROT_NIVEL`, `TIPOS`; CSS `.terr`, `.tag.prob`, `.tag.pot`, `.leg` do mock
**Requirement**: RES-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Com um problema em SP e RJ e uma potencialidade em SP, a tabela tem 2 linhas: SP com os dois tipos e RJ com "—" em Potencialidades (RES-08.1, 08.5)
- [ ] A etiqueta de problema usa o estilo vermelho e a de potencialidade o verde, ambas com o nome da agenda e o texto abaixo (RES-08.4)
- [ ] Lista vazia mostra "Nada registrado ainda." (RES-08.6)
- [ ] A 375 px a tabela rola dentro do quadro e a página não ganha rolagem horizontal (RES-08.7)
- [ ] Nenhum teste existente que dependia do texto antigo continua falhando; os ajustados mantêm a intenção (nenhum teste removido)
- [ ] Gate check passes: `npx playwright test -c playwright.isolado.config.ts e2e/resumo-territorio.spec.ts`, `npm test` e `npx tsc --noEmit`
- [ ] Test count: ≥ 6 e2e novos em `e2e/resumo-territorio.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: build

**Commit**: `feat(resumo): show social items as a territory table`

---

### T11: Selos M e P nas fragilidades

**What**: Em `resumo-tela.js`, sobrepor a saída de `Resumo.ex` apenas para o tipo `frag`, apenas com `Resumo.vivo`, para mostrar cada item como selo M (verde) ou P (vinho) mais o texto; sem item classificado, "não preenchido"; CSS em `ilhas.css`.
**Where**: `plataforma/public/legacy/resumo-tela.js` (modify)
**Depends on**: T10
**Reuses**: `D.frags` (`f.mp`, `f.t`), `esc`; CSS `.frag` do mock
**Requirement**: RES-11, RES-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Com 3 itens M e 2 P, aparecem 5 linhas com o selo certo e o texto escapado (RES-11.1)
- [ ] Sem item classificado, o corpo mostra "não preenchido" (RES-11.2)
- [ ] Sem `Resumo.vivo`, `Resumo.ex` do tipo `frag` devolve o mesmo HTML de antes (RES-12.1, 12.3)
- [ ] Gate check passes: `npm test` e `npx playwright test -c playwright.isolado.config.ts e2e/resumo-estrutura.spec.ts`
- [ ] Test count: ≥ 4 testes unitários novos, nenhum removido

**Tests**: unit
**Gate**: full

**Commit**: `feat(resumo): highlight mandate and parliamentarian weaknesses`

---

### T12: Regressão e acessibilidade ponta a ponta

**What**: Escrever `e2e/resumo-regressao.spec.ts` cobrindo o que não pode mudar e a acessibilidade: download do resumo (sem barra, segmentos e cartões; mesmos títulos e respostas), Painel "Ver o que foi preenchido", teclado nos `<summary>` e nos segmentos, nomes acessíveis, números em pt-BR, retorno à tela sem duplicar ouvintes, tela sem nenhum dado, 100% concluído e a 375 px.
**Where**: `plataforma/e2e/resumo-regressao.spec.ts` (new)
**Depends on**: T11
**Reuses**: `abreGuia`, `semente.ts`, `e2e/rumo-painel.spec.ts` (fixtures do Painel)
**Requirement**: RES-12, RES-13, RES-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O arquivo baixado por "Baixar resumo completo (HTML)" tem os títulos das missões e as respostas e não contém a barra, os segmentos nem os cartões (RES-12.3)
- [ ] "Ver o que foi preenchido" no Painel mostra o mesmo conteúdo de antes (RES-12.2)
- [ ] Enter e Espaço abrem e fecham um `<summary>`; Tab chega aos segmentos e Enter leva à missão (RES-01.6, RES-13.3)
- [ ] Mandato vazio mostra "0%", "0 de 16 exercícios concluídos" e todas as missões fechadas; mandato 100% mostra "100%" e a frase de conclusão (edge cases)
- [ ] Sair e voltar a `#/resumo` mantém um único conjunto de ouvintes e redesenha com os dados atuais (edge cases)
- [ ] A 375 px não há rolagem horizontal (RES-13.5) e os números usam pt-BR (RES-13.6)
- [ ] Todos os testes existentes de Painel, Guia e Missões continuam passando (RES-12.2, 12.4)
- [ ] Gate check passes: `npx tsc --noEmit`, `npm test` e `npx playwright test -c playwright.isolado.config.ts e2e/resumo- e2e/rumo-painel.spec.ts e2e/m1- e2e/m23-`
- [ ] Test count: ≥ 9 e2e novos em `e2e/resumo-regressao.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: build

**Commit**: `test(resumo): cover regressions and accessibility of the summary screen`

---

### T13: Documentação

**What**: Documentar a nova tela em `plataforma/CLAUDE.md` (seção do Guia/ilhas: `resumo-tela.js`, as ilhas `resumo-retrato` e `resumo-equipe`, a regra de que `Resumo.ex`/`Resumo.missao` não mudam) e registrar as decisões AD-R1 a AD-R8 em `.specs/STATE.md`; marcar a spec e as tasks como concluídas e a rastreabilidade como Implementing.
**Where**: `plataforma/CLAUDE.md` (modify)
**Depends on**: T12
**Reuses**: formato dos registros AD de `.specs/STATE.md`
**Requirement**: RES-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `plataforma/CLAUDE.md` descreve `public/legacy/resumo-tela.js`, as ilhas novas e a regra de não alterar `Resumo.ex`/`Resumo.missao` (RES-12)
- [ ] `.specs/STATE.md` ganha AD-R1 a AD-R8 com data e motivo, e o Handoff aponta para o `validation.md` a gerar
- [ ] Gate check passes: `npx tsc --noEmit` e `npm test`
- [ ] Test count: todos os testes existentes passam, nenhum removido

**Tests**: none
**Gate**: build

**Commit**: `docs(resumo): document the restructured summary screen`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 ------→ T2 ------→ T3
Phase 2:  T4 ------→ T5 ------→ T6 ------→ T7
Phase 3:  T8 ------→ T9 ------→ T10 -----→ T11
Phase 4:  T12 -----→ T13
```

Execução estritamente sequencial; o empacotamento em workers está em "Plano de execução com sub-agents".

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Montar a tela dos blocos | 1 arquivo novo, 1 função de montagem (+ 1 linha em `SCRIPTS`) | ✅ Granular |
| T2: Ligar a tela | 1 arquivo, comportamento de uma tela | ⚠️ Coeso (barra, ferramentas e impressão compartilham o `ligar`) |
| T3: Estilizar a tela | 1 arquivo CSS | ✅ Granular |
| T4: Lógica do retrato | 1 arquivo lib | ✅ Granular |
| T5: Ilha do retrato | 1 componente (+ 1 linha na ponte) | ✅ Granular |
| T6: Lógica do organograma | 1 arquivo lib | ✅ Granular |
| T7: Ilha do organograma | 1 componente (+ 1 linha na ponte) | ✅ Granular |
| T8: Cartões de pessoas | 1 função sobreposta | ✅ Granular |
| T9: Lógica do território | 1 arquivo lib | ✅ Granular |
| T10: Tabela de território | 1 componente alterado | ✅ Granular |
| T11: Selos M e P | 1 função sobreposta | ✅ Granular |
| T12: Regressão e acessibilidade | 1 spec | ✅ Granular |
| T13: Documentação | 1 arquivo de doc principal (+ STATE) | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | none | início da Fase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Montar a tela | Script do legado | unit (vm) | unit | ✅ OK |
| T2: Ligar a tela | Script do legado + comportamento no navegador | e2e (maior exigência) | e2e | ✅ OK |
| T3: Estilizar | CSS | e2e (layout) | e2e | ✅ OK |
| T4: Lógica do retrato | Lógica pura | unit | unit | ✅ OK |
| T5: Ilha do retrato | Ilha React | e2e | e2e | ✅ OK |
| T6: Lógica do organograma | Lógica pura | unit | unit | ✅ OK |
| T7: Ilha do organograma | Ilha React | e2e | e2e | ✅ OK |
| T8: Cartões | Script do legado + CSS | e2e (maior exigência) | e2e | ✅ OK |
| T9: Lógica do território | Lógica pura | unit | unit | ✅ OK |
| T10: Tabela de território | Ilha React | e2e | e2e | ✅ OK |
| T11: Selos | Script do legado | unit (vm) | unit | ✅ OK |
| T12: Regressão | e2e | e2e | e2e | ✅ OK |
| T13: Documentação | Documentação | none | none | ✅ OK |
