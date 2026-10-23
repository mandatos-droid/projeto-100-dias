# Landing Page Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/landing/spec.md` (sem `design.md`: as decisões de arquitetura estão em `.specs/STATE.md`, AD-001 e AD-002)
**Status**: Approved (usuário pediu a implementação da v1)

Todos os caminhos abaixo são relativos a `plataforma/`. A árvore de trabalho tem mudanças do usuário não commitadas: cada commit usa `git add` com os arquivos da task, nunca `git add -A`.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `plataforma/AGENTS.md` (regra do Next 16: ler `node_modules/next/dist/docs/` antes de escrever código de rota), `plataforma/CLAUDE.md` ("não há lint nem testes configurados; o tsc é a única checagem automática"). Sem testes existentes: runner novo, `node --test` (Node 25 executa `.ts` direto).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Lógica pura (`lib/demo.ts`, `lib/landing.ts`) | unit | Todos os ramos; 1:1 com as ACs; cada edge case listado tem teste | `tests/*.test.ts` | `npm test` |
| Componentes React e páginas (`app/**`) | none | Sem runner de componente no repo; conferidos por `tsc`, build e fumaça no navegador/SSR na verificação final | - | `npx tsc --noEmit` |
| Config e CSS (`package.json`, `tsconfig.json`, `landing.css`) | none | - (build gate only) | - | build gate only |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks só com testes unitários | `npm test` |
| Full | Tasks de lógica que também tocam tipos usados pela UI | `npm test && npx tsc --noEmit` |
| Build | Tasks de UI, config, rota e fim de fase | `npx tsc --noEmit && npm test && npm run build` |

Observação: o `npm run build` oscila com `SecurityFatalError` do Next 16.4 (advisory conhecido, upgrade fora de escopo por decisão do usuário). Se falhar só por isso, o gate Build vale como `npx tsc --noEmit && npm test` mais `next dev` respondendo 200 nas rotas tocadas, e a falha fica registrada na task.

---

## Execution Plan

### Phase 1: Rotas

```
T1 → T2 → T3 → T4
```

### Phase 2: Lógica da demonstração

```
T5 → T6 → T7 → T8 → T9 → T10
```

### Phase 3: Interface da demonstração

```
T11 → T12 → T13 → T14
```

### Phase 4: Seções da página

```
T15 → T16 → T17 → T18 → T19 → T20 → T21
```

### Phase 5: Integração

```
T22
```

---

## Task Breakdown

### T1: Criar o layout do Guia com o CSS legado

**What**: Layout de `/guia` que carrega `legacy.css` e `ilhas.css` por `<link>`.
**Where**: `app/guia/layout.tsx`
**Depends on**: None
**Reuses**: os mesmos `<link>` de `app/layout.tsx`
**Requirement**: LAND-01, LAND-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Arquivo exporta um layout que renderiza os dois `<link rel="stylesheet">` e `children`
- [x] O layout define `metadata.title` "Guia dos 100 Dias · Legisla Brasil"
- [x] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `feat(landing): add guia layout with legacy css`

---

### T2: Mover o Guia para `/guia`

**What**: `git mv app/page.tsx app/guia/page.tsx`, sem alterar o conteúdo.
**Where**: `app/guia/page.tsx`
**Depends on**: T1
**Reuses**: o `page.tsx` atual, intacto
**Requirement**: LAND-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `app/page.tsx` não existe mais e `app/guia/page.tsx` tem o conteúdo anterior
- [x] `next dev` responde 200 em `/guia`
- [x] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `refactor(landing): move guia to /guia`

---

### T3: Tirar o CSS legado do layout raiz

**What**: Remover os dois `<link>` de `app/layout.tsx` e ajustar `metadata` para o título da landing.
**Where**: `app/layout.tsx` (modify)
**Depends on**: T2
**Reuses**: `app/guia/layout.tsx` (T1) já carrega o CSS
**Requirement**: LAND-01, LAND-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `app/layout.tsx` não contém `legacy.css` nem `ilhas.css`
- [x] `<html lang="pt-BR">` mantido
- [x] `/guia` continua estilizado (conferido no HTML servido: os dois `<link>` presentes)
- [x] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `refactor(landing): scope legacy css to guia route`

---

### T4: Criar a página inicial provisória

**What**: `app/page.tsx` com título da landing e o link "Começar meu Mapa Político" para `/guia`.
**Where**: `app/page.tsx`
**Depends on**: T3
**Reuses**: nada
**Requirement**: LAND-01, LAND-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `/` responde 200 com o `<h1>` "Os primeiros 100 dias moldam o resto do mandato"
- [x] O link usa `<a href="/guia">` comum (funciona sem JavaScript)
- [x] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `feat(landing): add placeholder home page`

---

### T5: Configurar o runner de testes

**What**: Adicionar o script `test` ao `package.json`: `node --test "tests/**/*.test.ts"`.
**Where**: `package.json` (modify)
**Depends on**: None
**Reuses**: nada
**Requirement**: LAND-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `npm test` executa e sai com código 0 mesmo sem arquivos de teste ainda, ou com um teste de fumaça mínimo que o T7 substitui
- [x] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `build(landing): add node test runner script`

---

### T6: Permitir imports `.ts` nos testes

**What**: Ligar `allowImportingTsExtensions` no `tsconfig.json` para os testes importarem `../lib/demo.ts`.
**Where**: `tsconfig.json` (modify)
**Depends on**: T5
**Reuses**: nada
**Requirement**: LAND-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `compilerOptions.allowImportingTsExtensions` é `true`
- [x] `npx tsc --noEmit` continua com o mesmo resultado de antes da mudança
- [x] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `build(landing): allow ts extension imports for tests`

---

### T7: Busca de eleitos

**What**: `normaliza(s)` (minúsculas, sem acentos, espaços aparados) e `busca(eleitos, termo)` que devolve até 8 eleitos cujo `u` ou `c` contém o termo, de maior `v`, e `[]` com termo de menos de 2 caracteres.
**Where**: `lib/demo.ts` (create), testes em `tests/demo.test.ts`
**Depends on**: T6
**Reuses**: tipo `Eleito` de `lib/types.ts` (via `import type`)
**Requirement**: LAND-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Teste: "joao" encontra "JOÃO" (acentos e caixa ignorados) (Demo AC 1)
- [x] Teste: termo de 1 caractere e termo só de espaços devolvem `[]` (Demo AC 2, edge)
- [x] Teste: casa por nome civil quando o nome de urna não casa (Demo AC 1)
- [x] Teste: com mais de 8 casamentos devolve exatamente 8, ordenados por votos decrescentes (edge)
- [x] Teste: nenhum casamento devolve `[]` (Demo AC 8, lógica)
- [x] Gate quick passa; contagem de testes registrada

**Tests**: unit
**Gate**: quick

**Commit**: `feat(landing): add elected search with accent-insensitive matching`

---

### T8: Resumo do eleito

**What**: `resumo(eleito, todos)` devolve `{ cargo, posicao: {n, de} | null, cadeirasPartido, trajetoria }`: cargo por `k` e `uf` ("Deputado(a) Federal", "Deputado(a) Estadual", "Deputado(a) Distrital" para DF, "Senador(a)", com o gênero `g`), posição por votos entre os eleitos de mesma `k` e `uf`, cadeiras do partido na mesma `k` e `uf`, e trajetória a partir de `m` ("reeleito", "veio de outro cargo", "primeiro mandato", `null` para `?`).
**Where**: `lib/demo.ts` (modify), testes em `tests/demo.test.ts`
**Depends on**: T7
**Reuses**: tipo `Eleito`
**Requirement**: LAND-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Teste: posição "n de de" calculada entre mesma `k` e `uf`, com empate de votos resolvido pela ordem de entrada (Demo AC 4)
- [x] Teste: cadeiras do partido contam só a mesma `k` e `uf` (Demo AC 5)
- [x] Teste: `m` = 'r', 'o', 'n' viram os três rótulos e '?' vira `null` (Demo AC 6)
- [x] Teste: senador com `a` = 2022 devolve `posicao: null` (Demo AC 12)
- [x] Teste: rótulo do cargo respeita `k`, DF e gênero (Demo AC 3)
- [x] Gate quick passa; contagem de testes registrada

**Tests**: unit
**Gate**: quick

**Commit**: `feat(landing): add elected summary with rank and party seats`

---

### T9: Histórico de pleitos

**What**: `historico(pleitos)` recebe `PleitoTSE[] | undefined` e devolve até 6 linhas `{ano, cargo, partido, votos, situacao}` do mais recente ao mais antigo; `undefined` ou vazio devolve `[]`.
**Where**: `lib/demo.ts` (modify), testes em `tests/demo.test.ts`
**Depends on**: T8
**Reuses**: tipo `PleitoTSE` de `lib/dados.ts` (via `import type`)
**Requirement**: LAND-04, LAND-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Teste: ordena por ano decrescente (Demo AC 7)
- [x] Teste: com 8 pleitos devolve 6 (Demo AC 7)
- [x] Teste: `undefined` e `[]` devolvem `[]`, base da mensagem "Sem pleitos anteriores no TSE" (edge)
- [x] Teste: as linhas não têm campos de título, CPF ou nascimento (Demo AC 13)
- [x] Gate quick passa; contagem de testes registrada

**Tests**: unit
**Gate**: quick

**Commit**: `feat(landing): add election history formatter`

---

### T10: Destino do retorno de login

**What**: `destinoAuth(hash)` devolve `/guia` + hash quando o hash contém `access_token=` ou `error_description=`, senão `null`.
**Where**: `lib/landing.ts` (create), testes em `tests/landing.test.ts`
**Depends on**: T9
**Reuses**: nada
**Requirement**: LAND-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Teste: `#access_token=x&type=y` devolve `/guia#access_token=x&type=y` (Chegar AC 5)
- [x] Teste: `#error_description=a+b` devolve `/guia#error_description=a+b` (Chegar AC 5)
- [x] Teste: `''` e `#missoes` devolvem `null` (Chegar AC 5, caso negativo)
- [x] Gate quick passa; contagem de testes registrada

**Tests**: unit
**Gate**: quick

**Commit**: `feat(landing): add auth hash redirect resolver`

---

### T11: Estilo base da landing

**What**: `landing.css` com os tokens da Legisla (`--vinho`, `--papel`, `--tinta`, `--linha`), tipografia, layout, botões `.ld-bt`, grades responsivas e as classes das seções (`ld-hero`, `ld-sec`, `ld-demo`, `ld-card`, `ld-miss`, `ld-feat`, `ld-faq`, `ld-foot`), tudo sob o escopo `.ld`.
**Where**: `app/landing.css`
**Depends on**: None
**Reuses**: paleta e botões de `public/legacy/legacy.css` (valores, sem importar o arquivo)
**Requirement**: LAND-01, LAND-08

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] Nenhum seletor fora de `.ld` (conferido por busca no arquivo)
- [x] `.ld` define `overflow-x: hidden` apenas no contêiner, e grades colapsam para 1 coluna abaixo de 640 px
- [x] Contraste do botão primário (texto branco sobre `#571730`) e do texto (`#17110F` sobre `#FBF6EE`) acima de 4,5:1
- [x] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `feat(landing): add scoped landing stylesheet`

---

### T12: Campo de busca acessível

**What**: Componente cliente `BuscaEleito` com `<label>`, `<input role="combobox">`, lista `role="listbox"`, destaque por setas, Enter para escolher, Esc para fechar; recebe `sugestoes` e `onEscolhe`.
**Where**: `app/_landing/BuscaEleito.tsx`
**Depends on**: T11
**Reuses**: classes de T11; `busca` de `lib/demo.ts` é chamada pelo pai, não aqui
**Requirement**: LAND-03, LAND-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Input tem rótulo associado e `aria-expanded`, `aria-controls`, `aria-activedescendant`
- [x] Setas movem o destaque e Enter chama `onEscolhe` com a sugestão destacada (Qualidade AC 3)
- [x] Lista tem `role="listbox"` e cada item `role="option"` (Qualidade AC 2)
- [x] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `feat(landing): add accessible elected search box`

---

### T13: Cartão do eleito

**What**: Componente `CartaoEleito` que mostra foto (com inicial de reserva), nome de urna, partido, cargo, UF, votos, percentual, posição, cadeiras, trajetória, histórico, estados "Histórico indisponível agora" e "Sem pleitos anteriores no TSE", e o botão "Salvar meu mapa" para `/guia`.
**Where**: `app/_landing/CartaoEleito.tsx`
**Depends on**: T12
**Reuses**: `urlFoto` da regra de `ilhas/pecas.tsx` (mesma URL do TSE, reescrita local para não importar a ponte do Guia); `resumo` e `historico` de `lib/demo.ts`; `format.ts`
**Requirement**: LAND-04, LAND-05, LAND-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Percentual e posição somem quando `resumo.posicao` é `null` (Demo AC 12)
- [x] `onError` da foto troca para a inicial do nome (Demo AC 10)
- [x] Os três estados do histórico (linhas, vazio, falha) têm o texto exato da spec (Demo AC 9, edge)
- [x] Nenhum campo de título, CPF ou nascimento é renderizado (Demo AC 13)
- [x] O botão "Salvar meu mapa" é um `<a href="/guia">` (Demo AC 11)
- [x] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `feat(landing): add elected profile card`

---

### T14: Demonstração integrada

**What**: Componente cliente `Demo` que carrega `eleitos.json`, liga `BuscaEleito` a `busca`, carrega `pleitos/{uf}.json` ao escolher e renderiza `CartaoEleito`, com a mensagem de nenhum resultado e a de falha da base.
**Where**: `app/_landing/Demo.tsx`
**Depends on**: T13
**Reuses**: `carregaEleitos` e `carregaPleitos` de `lib/dados.ts`; `busca`, `resumo`, `historico` (T7 a T9)
**Requirement**: LAND-03, LAND-04, LAND-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Sem resultado: exibe a mensagem exata da spec (Demo AC 8)
- [x] Falha em `eleitos.json`: exibe "Não foi possível carregar a base do TSE agora" e o CTA continua visível (edge)
- [x] Falha em `pleitos`: o cartão fica e mostra "Histórico indisponível agora" (Demo AC 9)
- [x] `pleitos/{uf}.json` só é pedido depois da escolha do eleito
- [x] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `feat(landing): add live TSE demo section`

---

### T15: Cabeçalho, abertura e dor

**What**: Seção `Hero` com barra superior (marca + CTA), título, subtítulo, CTA "Começar meu Mapa Político", ilustração em CSS/SVG e as três frases de dor.
**Where**: `app/_landing/Hero.tsx`
**Depends on**: None
**Reuses**: `public/legacy/logo-1.png`; classes de T11
**Requirement**: LAND-01

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] `<h1>` com o texto exato da spec e CTA `<a href="/guia">` com o texto exato
- [x] CTA também na barra superior (Chegar AC 7)
- [x] CTA e título aparecem na primeira dobra em 1280×720 (conferido na fumaça final)
- [x] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `feat(landing): add hero section`

---

### T16: Missões em linha do tempo

**What**: Seção `Missoes` com as 5 missões: título, dia ideal (15, 30, 45, "desde o 1º dia", 100) e o que entrega, a partir do Guia.
**Where**: `app/_landing/Missoes.tsx`
**Depends on**: T15
**Reuses**: texto do Guia em `graphify-out/converted/Regimento Externo 2.0 - GUIA DOS 100 DIAS_8e027305.md`
**Requirement**: LAND-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] 5 itens, na ordem das missões, com os dias da spec
- [x] Textos batem com o Guia (sem inventar entregas)
- [x] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `feat(landing): add missions timeline section`

---

### T17: Funcionalidades

**What**: Seção `Funcionalidades` com 4 blocos (mapas, hemiciclo, equipe recomendada por bandeiras e tamanho, resumo e painel), cada um com ilustração em CSS/SVG.
**Where**: `app/_landing/Funcionalidades.tsx`
**Depends on**: T16
**Reuses**: `plataforma/README.md` (tabela de módulos), memória `recomendacao-cargos-m2`
**Requirement**: LAND-07

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [x] 4 blocos com os títulos da spec
- [x] A equipe recomendada diz "sugestão da plataforma" onde o Guia não define a regra (honestidade já adotada no produto)
- [x] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `feat(landing): add features section`

---

### T18: Privacidade, fontes e autoria

**What**: Seção `Confianca` com a faixa de privacidade, as fontes (TSE, IDSC-BR) e a identificação da Legisla Brasil como autora do Guia.
**Where**: `app/_landing/Confianca.tsx`
**Depends on**: T17
**Reuses**: regra `mandatos.permite_pesquisa` descrita em `plataforma/CLAUDE.md`
**Requirement**: LAND-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Texto afirma que os dados do mandato ficam com o mandato e que a demonstração usa só dados públicos do TSE
- [ ] Cita TSE e IDSC-BR e a Legisla Brasil
- [ ] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `feat(landing): add trust and privacy section`

---

### T19: Perguntas frequentes

**What**: Seção `Faq` com `<details>`/`<summary>` para tempo de uso, quem pode usar, "e se os 100 dias já passaram?" e "é gratuito?".
**Where**: `app/_landing/Faq.tsx`
**Depends on**: T18
**Reuses**: nota do Guia sobre adaptar quando o momento ideal já passou
**Requirement**: LAND-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] 4 perguntas, funcionando sem JavaScript
- [ ] A resposta sobre os 100 dias reproduz a orientação do Guia: adaptar à realidade do mandato e passar por todas as missões
- [ ] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `feat(landing): add faq section`

---

### T20: Fechamento e rodapé

**What**: Seção `Fechamento` com o CTA final "Começar meu Mapa Político" e o rodapé da Legisla Brasil.
**Where**: `app/_landing/Fechamento.tsx`
**Depends on**: T19
**Reuses**: `public/legacy/logo-2.png`
**Requirement**: LAND-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] CTA `<a href="/guia">` com o texto exato (Chegar AC 7)
- [ ] Rodapé identifica a Legisla Brasil
- [ ] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `feat(landing): add closing call to action and footer`

---

### T21: Repasse do retorno de login

**What**: Componente cliente `RedirecionaAuth` que, ao montar, lê `location.hash`, chama `destinoAuth` e faz `location.replace` quando houver destino.
**Where**: `app/_landing/RedirecionaAuth.tsx`
**Depends on**: T20
**Reuses**: `destinoAuth` de `lib/landing.ts` (T10)
**Requirement**: LAND-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Usa `location.replace` (não deixa `/` no histórico)
- [ ] Não renderiza nada na tela
- [ ] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `feat(landing): add login return redirect`

---

### T22: Montar a página e os metadados

**What**: `app/page.tsx` final: importa `landing.css`, monta `Hero`, `Demo`, CTA pós-demonstração, `Missoes`, `Funcionalidades`, `Confianca`, `Faq`, `Fechamento` e `RedirecionaAuth`, e define `metadata` (título, descrição, Open Graph) diferentes do Guia.
**Where**: `app/page.tsx` (modify)
**Depends on**: None
**Reuses**: todos os componentes de T12 a T21
**Requirement**: LAND-01, LAND-02, LAND-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O HTML servido de `/` contém o título, o `<title>` da landing e 3 links "Começar meu Mapa Político" para `/guia` (topo, após a demonstração, fechamento)
- [ ] O HTML de `/` não contém `legacy.css` nem `ilhas.css`; o de `/guia` contém os dois
- [ ] `/painel` responde 200
- [ ] `lang="pt-BR"` presente
- [ ] Gate Build passa

**Tests**: none
**Gate**: build

**Commit**: `feat(landing): assemble landing page and metadata`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Phase 1:  T1 → T2 → T3 → T4
Phase 2:  T5 → T6 → T7 → T8 → T9 → T10
Phase 3:  T11 → T12 → T13 → T14
Phase 4:  T15 → T16 → T17 → T18 → T19 → T20 → T21
Phase 5:  T22
```

Execução sequencial. Ao final de T22, o Verifier independente roda sobre a spec (ver Execute, passo 9).

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | início da fase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | None | início da fase 2 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | None | início da fase 3 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |
| T14 | T13 | T13 → T14 | ✅ Match |
| T15 | None | início da fase 4 | ✅ Match |
| T16 | T15 | T15 → T16 | ✅ Match |
| T17 | T16 | T16 → T17 | ✅ Match |
| T18 | T17 | T17 → T18 | ✅ Match |
| T19 | T18 | T18 → T19 | ✅ Match |
| T20 | T19 | T19 → T20 | ✅ Match |
| T21 | T20 | T20 → T21 | ✅ Match |
| T22 | None | fase 5 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 a T4 | Componentes e páginas | none | none | ✅ OK |
| T5, T6 | Config | none | none | ✅ OK |
| T7, T8, T9 | Lógica pura | unit | unit | ✅ OK |
| T10 | Lógica pura | unit | unit | ✅ OK |
| T11 | CSS | none | none | ✅ OK |
| T12 a T14 | Componentes React | none | none | ✅ OK |
| T15 a T22 | Componentes e páginas | none | none | ✅ OK |

## Cobertura de requisitos

| Requisito | Tasks |
| --------- | ----- |
| LAND-01 | T1, T3, T4, T11, T15, T20, T22 |
| LAND-02 | T1, T2, T4, T10, T21, T22 |
| LAND-03 | T5, T6, T7, T12, T14 |
| LAND-04 | T8, T9, T13, T14 |
| LAND-05 | T9, T13, T14 |
| LAND-06 | T13 |
| LAND-07 | T16, T17, T18, T19 |
| LAND-08 | T3, T11, T12, T22 |
