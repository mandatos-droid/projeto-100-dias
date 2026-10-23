# Missão 3 · Defina o Rumo (Planejamento Estratégico) Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/missao3-rumo/spec.md`
**Design**: `.specs/features/missao3-rumo/design.md`
**Status**: Draft (aguarda aprovação do usuário)

Todos os caminhos abaixo são relativos a `plataforma/`, salvo indicação. A árvore de trabalho tem mudanças do usuário não commitadas em arquivos que estas tarefas tocam (`ilhas/ponte.tsx`, `public/legacy/novos.js`, `public/legacy/guia.js`, `ilhas/Equipe.tsx`, `lib/types.ts`, `public/legacy/cadastro.js`). Regras de segurança:

1. Cada commit usa `git add` com os arquivos nomeados da tarefa; nunca `git add -A`.
2. Antes de editar `ponte.tsx` ou `app/guia/page.tsx` pela primeira vez, rodar `git diff` no arquivo e preservar a mudança do usuário.
3. `conteudo.js`, `guia.js`, `app.js`, `nucleo.js`, `resumo.js`, `novos.js` e `m2.js` não são editados (AD-003); os ganchos ficam em `public/legacy/m3.js`.
4. Antes de escrever a rota de teste da T10 e qualquer rota nova, ler o guia de rotas em `node_modules/next/dist/docs/` (regra de `AGENTS.md`).
5. Textos do Guia da Missão 3 são intocáveis: o teste da T11 falha se qualquer `t`, `d`, `intro`, `passos`, `fim` ou exemplo mudar.
6. Depois de modificar código, rodar `graphify update .` (regra de `CLAUDE.md`; AST apenas) antes do commit final de cada fase.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `plataforma/CLAUDE.md` (comandos `npm test`, `npx tsc --noEmit`; imports relativos com `.ts` nos testes), `plataforma/AGENTS.md` (docs do Next 16), `.specs/STATE.md` (AD-003, AD-004), `tests/*.test.ts` e `e2e/*.spec.ts` da Missão 2 (estilo e local).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Lógica pura (`lib/rumo.ts`, `criterios.ts`, `manchete.ts`, `smart.ts`, `plano.ts`, `atingimento.ts`, `pessoas.ts`, `espacos.ts`) | unit | Todos os ramos; 1:1 com os critérios RUM; cada edge case da spec tem teste | `tests/*.test.ts` | `npm test` |
| Script de dados (`scripts/build_comissoes.py`) e JSON gerado | unit (validação do JSON no Node) | Esquema do arquivo, contagem mínima, sem campos pessoais | `tests/comissoes.test.ts` | `npm test` |
| Ilhas React (`ilhas/rumo/*.tsx`) | e2e | Cada tela que a tarefa cria: caminho feliz + cada edge case e erro que a spec lista para ela | `e2e/rumo-*.spec.ts` | `npm run test:e2e` |
| Ganchos do legado (`public/legacy/m3.js`) | unit (`node:vm` com globais simuladas) | Cada override: entrada antiga e nova; hash dos textos da Missão 3 | `tests/legado-m3.test.ts` | `npm test` |
| Hook `useRumo.ts`, `ponte.tsx`, `app/guia/page.tsx`, CSS | none | - (build gate; exercitados pelos testes e2e das ilhas) | - | `npx tsc --noEmit` |
| Rota de teste (`app/teste-rumo/*`), config | e2e (fumaça) | A rota monta a ilha pedida | `e2e/rumo-harness.spec.ts` | `npm run test:e2e` |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tarefas só com testes unitários (`lib/`, `m3.js`, JSON) | `npm test` |
| Full | Tarefas de ilha, que têm teste e2e | `npm test && npx tsc --noEmit && npm run test:e2e` |
| Build | Fim de fase, tarefas de config e tarefas com `Tests: none` | `npx tsc --noEmit && npm test && npm run test:e2e && npm run build` |

Observação: o `npm run build` oscilou com `SecurityFatalError` do Next 16.4. Se falhar só por isso, o gate Build vale como `npx tsc --noEmit && npm test && npm run test:e2e` mais `next dev` respondendo 200 em `/guia`, e a falha fica registrada na tarefa.

---

## Execution Plan

Phases run in order; tasks run in order inside a phase. A seta que abre cada fase (por exemplo `T9 → T10`) marca a dependência da última tarefa da fase anterior.

### Phase 1: Lógica pura (`lib/`) e dados

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9
```

### Phase 2: Infra de tela e ganchos do legado

```
T9 → T10 → T11 → T12
```

### Phase 3: Bandeiras e espaços

```
T12 → T13 → T14
```

### Phase 4: Legado e primeira página

```
T14 → T15 → T16 → T17
```

### Phase 5: Preditores e metas

```
T17 → T18 → T19
```

### Phase 6: Aba Planejamento Estratégico e Painel

```
T19 → T20 → T21 → T22
```

### Phase 7: Fechamento e extras (P3)

```
T22 → T23 → T24
```

---

## Task Breakdown

### T1: Tipos, normalização e migração do estado da Missão 3 ✅

**What**: Criar `lib/rumo.ts` com os tipos `Rumo`, `BandeiraRumo`, `LegadoRumo`, `Meta`, `StatusMeta`, `lerRumo` (normaliza e migra sem mutar), `aplicaRumo` e `espelho` (texto legível para `m3.*`).
**Where**: `lib/rumo.ts`, `tests/rumo.test.ts`
**Depends on**: None
**Reuses**: `lib/bandeiras.ts` (`bandeiraDoRotulo`)
**Requirement**: RUM-02, RUM-70

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `lerRumo` sem `D.rumo` cria bandeiras reconhecidas de `m3.mural` e `m3.b1..b3` e mantém rótulos não reconhecidos como "outras" (RUM-02.9)
- [x] `lerRumo` não altera o objeto recebido e descarta só o campo inválido de `D.rumo`/`D.metas` corrompido, sem apagar texto (RUM-70)
- [x] `espelho` devolve `m3.mural`, `m3.argumentos`, `m3.criterios`, `m3.b1..b3`, `m3.legado`, `m3.cargo` e ida e volta (`lerRumo(espelho(r))`) preserva bandeiras e prioritárias (RUM-02.10)
- [x] Meta sem `status` lê como `nao_concluida`
- [x] Gate: `npm test`; testes novos em `tests/rumo.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(rumo): estado da Missão 3 com normalização e migração`

---

### T2: Critérios, notas e ranking das bandeiras ✅

**What**: Criar `lib/criterios.ts` com `CRITERIOS_GUIA`, `total`, `ranking`, `alternaPrioritaria`, `adicionaCriterio`, `removeCriterio`.
**Where**: `lib/criterios.ts`, `tests/criterios.test.ts`
**Depends on**: T1
**Reuses**: tipos de `lib/rumo.ts`
**Requirement**: RUM-01, RUM-02, RUM-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `total` soma notas inteiras de 0 a 5 e recusa nota fora da faixa ou não inteira (RUM-01.4)
- [x] `ranking` ordena por total desc, desempata pela ordem de entrada e só marca `sugerida` com 2 ou mais bandeiras com nota (RUM-01.5)
- [x] `alternaPrioritaria` recusa a quarta com mensagem que cita a prioritária a desmarcar e preserva a ordem de confirmação (RUM-02.6, RUM-02.7)
- [x] `adicionaCriterio` para em 8 critérios; `removeCriterio` remove também as notas daquele critério (RUM-01.3)
- [x] Gate: `npm test`; testes novos em `tests/criterios.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(rumo): critérios, notas e ranking de bandeiras`

---

### T3: Composição da manchete, modelos e cargos postuláveis ✅

**What**: Criar `lib/manchete.ts` com `cargosPostulaveis`, `compoe`, `MODELOS`, `aplicaModelo`, `mencionaCargo`, `avisos`, `dataEdicao`.
**Where**: `lib/manchete.ts`, `tests/manchete.test.ts`
**Depends on**: T2
**Reuses**: tipos de `lib/rumo.ts`; os 4 exemplos do Guia como base dos modelos
**Requirement**: RUM-10, RUM-11, RUM-52

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `cargosPostulaveis('Deputado(a) Estadual')` devolve as opções da tabela do design, com reeleição primeiro; cargo vazio devolve a lista completa (RUM-11.2, edge case)
- [x] `compoe` inclui nome, entrega, resultado e o cargo na frase; elemento vazio não deixa "undefined" nem espaços duplos (RUM-10.3)
- [x] `mencionaCargo` reconhece "Governo do Estado", "Governador(a)" e "Senado" para os cargos correspondentes, ignorando acento e caixa (RUM-11.7)
- [x] `avisos` devolve o aviso de cargo ausente e o de mais de 280 caracteres (RUM-11.7, edge case)
- [x] `aplicaModelo` devolve os 4 modelos pré-preenchidos com nome e bandeiras e todos rotulados `sugestao: true` (RUM-52.1, RUM-52.2)
- [x] `dataEdicao('2027-02-01')` = "dezembro de 2030"; sem data = "ao fim da legislatura"
- [x] Gate: `npm test`; testes novos em `tests/manchete.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(rumo): composição da manchete, modelos e cargos postuláveis`

---

### T4: Retorno SMART das metas ✅

**What**: Criar `lib/smart.ts` com `avaliaMeta`: letras S, M, A, R, T com dica, alerta de tarefa rotineira e pontos.
**Where**: `lib/smart.ts`, `tests/smart.test.ts`
**Depends on**: T3
**Reuses**: `FORMULA_META` (exemplo do Guia como caso de teste)
**Requirement**: RUM-31

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] O exemplo de `FORMULA_META.exemplo` avaliado com `pred` e `alcancavel: true` dá 5 letras atendidas (RUM-31.3)
- [x] "Aprovar 2 projetos de lei sobre educação até dezembro de 2027" atende S, M e T; "Melhorar a educação" não atende S, M nem T e a dica da primeira letra que falta é a de S (RUM-31.4 a 6)
- [x] R só atende com `pred`; A só atende com `alcancavel === true` (RUM-31.7, RUM-31.8)
- [x] "Enviar e-mail semanal aos assessores" dispara o alerta "Meta não é tarefa diária"; texto sem esse padrão não dispara (RUM-31.9)
- [x] Texto vazio ou só espaços devolve nenhuma letra atendida e 0 pontos, sem exceção
- [x] Gate: `npm test`; testes novos em `tests/smart.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(rumo): retorno SMART determinístico para metas`

---

### T5: Objetivos, árvore e regras das metas

**What**: Criar `lib/plano.ts` com `objetivos`, `arvore`, `podeAcrescentarMeta`, `contagemMetas`, `desmarcaPreditor`, `normalizaMeta`, `alternaPreditor` (limite de 3).
**Where**: `lib/plano.ts`, `tests/plano.test.ts`
**Depends on**: T4
**Reuses**: `lib/rumo.ts`; `PREDITORES` e `OBJ_ESPECIFICOS` copiados como constantes com teste de paridade contra `public/legacy/conteudo.js`
**Requirement**: RUM-20, RUM-21, RUM-30

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `objetivos` devolve um por preditor escolhido, com o texto de `m3.obj.{pid}` ou o nome do preditor quando vazio (RUM-20.2)
- [ ] `alternaPreditor` recusa o quarto com mensagem que cita qual desmarcar (RUM-20.3)
- [ ] `desmarcaPreditor` informa quantas metas serão afetadas e devolve patch que limpa `pred` delas sem apagá-las (RUM-21.4)
- [ ] `podeAcrescentarMeta` nega sem preditor (motivo aponta a etapa de preditores) e nega a quinta meta do mesmo objetivo (RUM-30.2, RUM-30.15)
- [ ] `contagemMetas` devolve `abaixo` com 9, `ok` com 10 e 16, `acima` com 17 (RUM-30.14)
- [ ] `arvore` coloca metas sem `pred` em `semObjetivo`
- [ ] `PREDITORES`/`OBJ_ESPECIFICOS` do TS são idênticos aos de `conteudo.js` (teste de paridade)
- [ ] Gate: `npm test`; testes novos em `tests/plano.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(rumo): objetivos, árvore e regras das metas`

---

### T6: Status e atingimento

**What**: Criar `lib/atingimento.ts` com `STATUS`, `pctMeta`, `pctObjetivo`, `pctTotal`.
**Where**: `lib/atingimento.ts`, `tests/atingimento.test.ts`
**Depends on**: T5
**Reuses**: tipos de `lib/rumo.ts`
**Requirement**: RUM-41

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `pctMeta` devolve 100, 70, 0 e `null` para concluída, concluída 70%, não concluída e congelada (RUM-41.4)
- [ ] `pctObjetivo([100, 70, 0, congelada])` = 57 (média de 100, 70 e 0 arredondada), e `null` quando só há congeladas ou nenhuma meta (RUM-41.5, RUM-41.7)
- [ ] `pctTotal` faz a média só dos objetivos não nulos e devolve `null` se todos forem nulos; dois objetivos 57 e 100 dão 79 (RUM-41.6)
- [ ] Meta sem `status` conta como 0
- [ ] Gate: `npm test`; testes novos em `tests/atingimento.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(rumo): status das metas e cálculo de atingimento`

---

### T7: Pessoas da Missão 2 como responsável e apoio

**What**: Criar `lib/pessoas.ts` com `pessoas`, `resolve`, `validaApoio`.
**Where**: `lib/pessoas.ts`, `tests/pessoas.test.ts`
**Depends on**: T6
**Reuses**: `lib/cadeiras.ts` (`ativas`, `nomeLimpo`), `lib/equipe.ts` (`chaveFicha`)
**Requirement**: RUM-32, RUM-70

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `pessoas` lista só cadeiras ativas com nome, sem o asterisco, com cargo e área (RUM-32.10)
- [ ] `resolve` mostra o nome atual da cadeira quando ele muda e o nome gravado com `foraDaEquipe: true` quando a cadeira some (edge cases)
- [ ] `validaApoio` recusa apoio igual ao responsável e mais de 3 apoios, com mensagem; aceita 0 (RUM-32.11, RUM-32.12)
- [ ] Sem cadeiras nomeadas, `pessoas` devolve lista vazia e `resolve` mantém o texto livre antigo (RUM-32.13)
- [ ] Gate: `npm test`; testes novos em `tests/pessoas.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(rumo): pessoas da Missão 2 como responsável e apoio`

---

### T8: Sugestões e alertas dos espaços

**What**: Criar `lib/espacos.ts` com `TIPOS_ESPACO`, `TEMAS_POR_BANDEIRA`, `sugestoes`, `alerta`, `faltaBandeira1`.
**Where**: `lib/espacos.ts`, `tests/espacos.test.ts`
**Depends on**: T7
**Reuses**: `lib/bandeiras.ts`
**Requirement**: RUM-50, RUM-51

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `sugestoes` com cargo Federal e catálogo devolve as comissões do catálogo, com as da bandeira prioritária destacadas (RUM-50.2, RUM-50.5)
- [ ] `sugestoes` com cargo Estadual sem catálogo devolve nomes genéricos por bandeira (RUM-50.4); com catálogo da UF devolve os dele (RUM-50.3)
- [ ] `TEMAS_POR_BANDEIRA` tem entrada para as 19 bandeiras de `BANDEIRAS`
- [ ] `alerta` devolve o texto "Este espaço não conversa com as bandeiras prioritárias" quando a bandeira do espaço não está entre as prioritárias, e `null` quando está (RUM-51.7)
- [ ] `faltaBandeira1` é verdadeiro enquanto nenhum espaço aponta a bandeira prioritária 1 (RUM-51.8)
- [ ] Gate: `npm test`; testes novos em `tests/espacos.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(rumo): sugestões e alertas de espaços do mandato`

---

### T9: Catálogo de comissões da Câmara dos Deputados

**What**: Criar `scripts/build_comissoes.py` e gerar `public/data/comissoes/br.json`. Primeiro passo: conferir na documentação oficial de dados abertos da Câmara o endpoint e o formato (a spec registra que não foram verificados); só então escrever o parser.
**Where**: `scripts/build_comissoes.py`, `public/data/comissoes/br.json`, `tests/comissoes.test.ts`, `CLAUDE.md` (linha na tabela de scripts)
**Depends on**: T8
**Reuses**: padrão dos outros `build_*.py` (biblioteca padrão, cache em `scripts/.cache`)
**Requirement**: RUM-50

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O formato real da fonte foi conferido e a URL consultada fica comentada no topo do script
- [ ] `br.json` tem `{ gerado: ISO, fonte: URL, comissoes: [{ nome, sigla }] }` com ao menos 20 comissões permanentes (RUM-50.2)
- [ ] O script falha com mensagem clara e não grava arquivo se a fonte não responder ou vier sem comissões
- [ ] O JSON não contém nome de pessoa, CPF ou contato
- [ ] `public/data/comissoes/` aceita um `{uf}.json` do mesmo formato (documentado em `CLAUDE.md`), sem nenhum criado agora (RUM-50.3)
- [ ] Gate: `npm test`; testes novos em `tests/comissoes.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(rumo): catálogo de comissões da Câmara dos Deputados`

---

### T10: Hook `useRumo`, registro das ilhas e rota de teste

**What**: Criar `ilhas/rumo/useRumo.ts`, esqueleto das 7 ilhas novas registradas em `ILHAS` de `ponte.tsx`, `app/teste-rumo/` (rota só de teste, modelada em `app/teste-equipe/`) e `e2e/rumo-harness.spec.ts` + `e2e/semente-rumo.ts` (mandato de teste com `D`, `Store` e Missão 2 semeados).
**Where**: `ilhas/rumo/useRumo.ts`, `ilhas/rumo/*.tsx` (esqueletos), `ilhas/rumo/rumo.css`, `ilhas/ponte.tsx`, `app/teste-rumo/page.tsx`, `app/teste-rumo/Harness.tsx`, `e2e/rumo-harness.spec.ts`, `e2e/semente-rumo.ts`
**Depends on**: T9
**Reuses**: `app/teste-equipe/*`, `e2e/semente.ts`, `useLegado`
**Requirement**: RUM-70

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `git diff ilhas/ponte.tsx` foi lido antes da edição e a mudança do usuário permanece
- [ ] `/teste-rumo?ilha=rumo-bandeiras` (e as outras 6) monta o esqueleto da ilha pedida (teste de fumaça por ilha)
- [ ] Em produção a rota de teste devolve 404 (mesmo comportamento da Missão 2)
- [ ] `useRumo` escreve sempre via `aplicaRumo`/`normalizaMeta` e termina em `bump()`; `npx tsc --noEmit` passa
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; fumaça nova em `e2e/rumo-harness.spec.ts`, nenhum teste removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(rumo): hook, ilhas registradas e rota de teste da Missão 3`

---

### T11: Gancho `m3.js`: exercícios da Missão 3 sem tocar nos textos

**What**: Criar `public/legacy/m3.js` com os overrides de `Comp.campos` (corpo de `m3.bandeiras` e `m3.legado`), `Comp.preditores` e `Comp.metas`, cada um devolvendo `<div class="ilha" data-ilha="...">`; carregar o arquivo em `app/guia/page.tsx` depois de `m2.js`. Criar o teste de regressão de textos.
**Where**: `public/legacy/m3.js`, `app/guia/page.tsx`, `tests/legado-m3.test.ts`
**Depends on**: T10
**Reuses**: padrão de `public/legacy/m2.js` e do teste `tests/legado-m2.test.ts`; `CX` e `Comp.campos` de `novos.js`
**Requirement**: RUM-12, RUM-21, RUM-30, RUM-70

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `git diff app/guia/page.tsx` foi lido antes da edição e a mudança do usuário permanece
- [ ] O hash de `t`, `d`, `intro`, `passos`, `fim`, `agenda`, `entrega`, `momento`, `lidera`, `resumo` e `fecho` dos exercícios e da missão 3, calculado com `conteudo.js` em `node:vm`, é igual ao gravado no teste (gravado nesta tarefa, antes de qualquer outra mudança) (RUM-12.11)
- [ ] `Comp.campos` devolve a ilha para `m3.bandeiras` e `m3.legado` e delega ao original para qualquer outro exercício (entrada antiga e nova)
- [ ] `Comp.preditores()` e `Comp.metas()` devolvem os contêineres das ilhas `rumo-preditores` e `rumo-metas`
- [ ] `#blocoMetasRef` continua no `intro` das metas (verificado pelo hash)
- [ ] Gate: `npm test && npx tsc --noEmit`; testes novos em `tests/legado-m3.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(rumo): ganchos da Missão 3 com regressão dos textos do Guia`

---

### T12: Conclusão dos exercícios da Missão 3 pelo novo estado

**What**: No `m3.js`, ajustar a checagem de exercício feito para `m3.bandeiras` (ao menos 1 prioritária), `m3.legado` (manchete fechada ou texto preenchido) e manter `preditores`/`metas` como estão; sem tocar em `nucleo.js`.
**Where**: `public/legacy/m3.js`, `tests/legado-m3.test.ts`
**Depends on**: T11
**Reuses**: `estadoEx`/`feito` do legado (ler `nucleo.js:230-245` antes)
**Requirement**: RUM-02, RUM-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Mandato antigo com texto em `m3.legado` continua contando como exercício feito (RUM-70)
- [ ] Mandato novo com a edição fechada conta como feito; sem texto e sem edição fechada, não conta (RUM-11.8)
- [ ] Mandato com `m3.b1` preenchido ou `D.rumo` com uma prioritária conta `m3.bandeiras` como feito
- [ ] Gate: `npm test && npx tsc --noEmit`; testes novos em `tests/legado-m3.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(rumo): conclusão dos exercícios da Missão 3 pelo estado novo`

---

### T13: Ilha de bandeiras: mural, argumentos, critérios e ranking

**What**: Implementar `ilhas/rumo/Bandeiras.tsx`: chips das 19 agendas e "Outra bandeira"; selecionar abre o card com argumentos e notas 0 a 5 por critério; critérios próprios; ranking com estrela de prioritária; resumo da Missão 1.
**Where**: `ilhas/rumo/Bandeiras.tsx`, `ilhas/rumo/rumo.css`, `e2e/rumo-bandeiras.spec.ts`
**Depends on**: T12
**Reuses**: `lib/criterios.ts`, `lib/bandeiras.ts`, bloco `recap` de `novos.js` (lendo os mesmos campos `m1.*`)
**Requirement**: RUM-01, RUM-02, RUM-03

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [ ] Selecionar "Educação" adiciona o chip ativo e abre o card com "Argumentos" e as 4 notas na mesma interação (RUM-01.1)
- [ ] Digitar argumento e dar notas atualiza o total do card e `m3.argumentos` na hora (RUM-01.2, RUM-02.10)
- [ ] Com 2 bandeiras com nota, o ranking ordena e marca as 3 primeiras como sugeridas (RUM-01.5)
- [ ] Confirmar a quarta prioritária mostra a recusa e não grava (RUM-02.7); confirmar as três grava `m3.b1..b3` na ordem (RUM-02.6)
- [ ] Remover bandeira com notas pede confirmação e a tira das prioritárias (RUM-01.8)
- [ ] Critério próprio entra até o 8º; o 9º é recusado (RUM-01.3)
- [ ] Mandato antigo com `m3.mural` abre com os chips marcados e o texto antigo intacto (RUM-02.9)
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; testes novos em `e2e/rumo-bandeiras.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(rumo): bandeiras com argumentos, critérios e ranking`

---

### T14: Ilha de espaços que o mandato pretende compor

**What**: Implementar `ilhas/rumo/Espacos.tsx` e ligá-la ao corpo do exercício de bandeiras, no lugar do `listaExtra` (hook no `m3.js` que troca a lista genérica pela ilha `rumo-espacos`, mantendo o texto "No futuro").
**Where**: `ilhas/rumo/Espacos.tsx`, `public/legacy/m3.js`, `e2e/rumo-espacos.spec.ts`, `tests/legado-m3.test.ts`
**Depends on**: T13
**Reuses**: `lib/espacos.ts`, `public/data/comissoes/br.json`, leitura de `comissoesDesejadas`
**Requirement**: RUM-50, RUM-51

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [ ] Mandato Federal com Educação prioritária mostra "Comissão de Educação" destacada e registra como titular em `D.comissoesDesejadas` (RUM-50.2, RUM-50.5, RUM-51.6)
- [ ] Mandato Estadual sem `{uf}.json` mostra nomes genéricos por bandeira e aceita nome livre (RUM-50.4)
- [ ] Espaço sem bandeira prioritária mostra o alerta e grava mesmo assim (RUM-51.7)
- [ ] Enquanto a bandeira 1 não tem espaço, a dica do Guia aparece (RUM-51.8)
- [ ] Registros antigos de `comissoesDesejadas` (sem `papel`) aparecem sem erro e o texto "No futuro" segue idêntico (RUM-51.9; hash da T11 continua verde)
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; testes novos em `e2e/rumo-espacos.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(rumo): espaços pretendidos com sugestões por cargo e bandeira`

---

### T15: Primeira página de jornal (componente visual)

**What**: Implementar `ilhas/rumo/Jornal.tsx` conforme o contrato do design. Direção estética definida com a skill `frontend-design` (jornal impresso brasileiro: serif de contraste, filete duplo, papel quente, carimbo), sem imagens externas, com versão de impressão e versão compacta para celular.
**Where**: `ilhas/rumo/Jornal.tsx`, `ilhas/rumo/rumo.css`, `e2e/rumo-jornal.spec.ts`
**Depends on**: T14
**Reuses**: `dataEdicao`, `ilhas.css` (tokens)
**Requirement**: RUM-12

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [ ] O componente mostra nome do jornal, data de edição, manchete, linha de apoio com bandeiras e cargo, e o selo "Edição fechada" só quando `fechado` (RUM-12.10)
- [ ] Manchete de 280 caracteres não estoura o layout em 375 px nem em 1280 px (captura de tela conferida)
- [ ] Texto com `<script>` aparece como texto (edge case)
- [ ] Colunas decorativas têm `aria-hidden`; a manchete é um `h2` com nome acessível
- [ ] `@media print` mostra só a primeira página
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; testes novos em `e2e/rumo-jornal.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(rumo): primeira página de jornal para o Legado`

---

### T16: Legado guiado em 4 passos com cargo postulado

**What**: Implementar `ilhas/rumo/Legado.tsx`: marcador de edição (Protagonista, Entrega, Resultado, Cargo), seletor de cargo por cargo atual, manchete composta com "Recompor", aviso de cargo ausente, texto final editável à mão, "Fechar a edição", jornal ao vivo ao lado.
**Where**: `ilhas/rumo/Legado.tsx`, `ilhas/rumo/rumo.css`, `e2e/rumo-legado.spec.ts`
**Depends on**: T15
**Reuses**: `lib/manchete.ts`, `Jornal.tsx`, `useRumo`
**Requirement**: RUM-10, RUM-11, RUM-12

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [ ] A etapa abre no passo 1 com marcador de progresso; completar um passo "acende" o item e libera o próximo (RUM-10.1)
- [ ] Escolher o cargo no passo 4 grava `m3.cargo` e a manchete composta contém o cargo (RUM-11.2, RUM-10.3)
- [ ] Editar um elemento atualiza o jornal em menos de 300 ms (RUM-10.4)
- [ ] Editar o texto final à mão passa a usar o texto manual; "Recompor" volta à composição (RUM-11.6)
- [ ] Manchete que não cita o cargo mostra o aviso e grava mesmo assim (RUM-11.7)
- [ ] "Fechar a edição" grava `m3.legado`, mostra o selo e conta o exercício como feito (RUM-11.8)
- [ ] Mandato com `Store.mandato.cargo` vazio mostra a lista completa de cargos e não bloqueia (edge case)
- [ ] Mandato antigo com `m3.legado` abre mostrando a manchete antiga como texto manual (RUM-70)
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; testes novos em `e2e/rumo-legado.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(rumo): legado guiado com cargo postulado e jornal ao vivo`

---

### T17: Modelos de manchete e rascunhos dos grupos (P2)

**What**: Acrescentar a `Legado.tsx` o carrossel dos 4 modelos "sugestão da plataforma" e a gaveta "Manchetes dos grupos" com "Usar como base" e unificação de elementos.
**Where**: `ilhas/rumo/Legado.tsx`, `ilhas/rumo/rumo.css`, `e2e/rumo-legado.spec.ts`
**Depends on**: T16
**Reuses**: `MODELOS`, `aplicaModelo`
**Requirement**: RUM-11, RUM-52

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [ ] Escolher "reeleição" pré-preenche os 4 passos com nome e bandeiras e cada lacuna segue editável (RUM-52.2)
- [ ] Os 4 cartões mostram o selo "sugestão da plataforma" (RUM-52.1)
- [ ] Salvar rascunho de grupo guarda grupo, manchete e cargo; "Usar como base" o carrega nos passos (RUM-52.3, RUM-52.4)
- [ ] Unificar elementos de dois rascunhos monta os passos com o elemento escolhido de cada um (RUM-11.9)
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; testes novos em `e2e/rumo-legado.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(rumo): modelos de manchete e rascunhos dos grupos`

---

### T18: Preditores com objetivo específico e árvore ao vivo

**What**: Implementar `ilhas/rumo/Preditores.tsx` e `ilhas/rumo/ArvorePlano.tsx` (modo `previa`): cartões dos 5 preditores, campo do objetivo que abre ao selecionar com o exemplo do Guia, tabela de exemplos preservada, árvore ao lado.
**Where**: `ilhas/rumo/Preditores.tsx`, `ilhas/rumo/ArvorePlano.tsx`, `ilhas/rumo/rumo.css`, `e2e/rumo-preditores.spec.ts`
**Depends on**: T17
**Reuses**: `lib/plano.ts`, `OBJ_ESPECIFICOS`
**Requirement**: RUM-20, RUM-21

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [ ] Selecionar um preditor abre o campo do objetivo e acrescenta o nó na árvore (RUM-20.1)
- [ ] Objetivo vazio mostra o nome do preditor na árvore (RUM-20.2)
- [ ] O quarto preditor é recusado com mensagem (RUM-20.3)
- [ ] Desmarcar preditor com metas pede confirmação com a contagem e deixa as metas "sem objetivo" (RUM-21.4)
- [ ] A árvore tem `role="tree"`, nós focáveis e setas/Enter/Espaço funcionam (RUM-42.14, primeira parte)
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; testes novos em `e2e/rumo-preditores.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(rumo): preditores com objetivo específico e árvore`

---

### T19: Metas com retorno SMART, responsável e apoio

**What**: Implementar `ilhas/rumo/Metas.tsx` e `ilhas/rumo/CartaoMeta.tsx`: metas agrupadas por objetivo, retorno SMART ao vivo, confirmação de "alcançável", seletor de responsável e apoios (chips das pessoas da Missão 2 + texto livre), contador 10 a 16, limite de 4 por objetivo. `CartaoMeta` aceita `comStatus` (usado na aba, T21).
**Where**: `ilhas/rumo/Metas.tsx`, `ilhas/rumo/CartaoMeta.tsx`, `ilhas/rumo/rumo.css`, `e2e/rumo-metas.spec.ts`
**Depends on**: T18
**Reuses**: `lib/smart.ts`, `lib/plano.ts`, `lib/pessoas.ts`
**Requirement**: RUM-30, RUM-31, RUM-32

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [ ] Sem preditor, "Acrescentar meta" está desabilitado e aponta para a etapa de preditores (RUM-30.2)
- [ ] Acrescentar meta exige escolher o objetivo; o quinto do mesmo objetivo é bloqueado com a mensagem do limite (RUM-30.1, RUM-30.15)
- [ ] Digitar a meta de exemplo do Guia mostra S, M, T atendidas e R atendida pelo vínculo; confirmar "Cabe na capacidade da equipe" acende A (RUM-31.3, RUM-31.7, RUM-31.8)
- [ ] "Enviar e-mail semanal" mostra o alerta "Meta não é tarefa diária" (RUM-31.9)
- [ ] Responsável vem das cadeiras nomeadas da Missão 2, aceita texto livre, e apoio igual ao responsável é recusado (RUM-32.10, RUM-32.12)
- [ ] Sem cadeiras nomeadas, texto livre funciona e o aviso aponta para a Missão 2 (RUM-32.13)
- [ ] Contador verde de 10 a 16 e em aviso fora disso, sem bloquear (RUM-30.14)
- [ ] Metas antigas (só `pred`, `texto`, `resp`, `apoio`) abrem sem erro e sem perder texto (RUM-70)
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; testes novos em `e2e/rumo-metas.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(rumo): metas SMART com retorno, responsável e apoio`

---

### T20: Aba Planejamento Estratégico: árvore, status e atingimento

**What**: Implementar `ilhas/rumo/Plano.tsx` e o modo `plano` de `ArvorePlano.tsx`: anel de atingimento total, árvore Legado → objetivos → metas, seletor de status por meta, barra e contagem por status por objetivo, estado vazio com atalho à Missão 3.
**Where**: `ilhas/rumo/Plano.tsx`, `ilhas/rumo/ArvorePlano.tsx`, `ilhas/rumo/rumo.css`, `e2e/rumo-plano.spec.ts`
**Depends on**: T19
**Reuses**: `lib/atingimento.ts`, `lib/plano.ts`, `CartaoMeta`
**Requirement**: RUM-40, RUM-41

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [ ] Com 2 objetivos e 4 metas, a árvore mostra Legado, objetivos com preditor e metas, e o total no topo (RUM-40.1)
- [ ] Mudar o status de uma meta recalcula objetivo e total em menos de 300 ms, conforme a conta: metas 100, 70, 0 e uma congelada dão objetivo 57 (RUM-41.3, RUM-41.5)
- [ ] Objetivo só com metas congeladas mostra "—" e fica fora do total (RUM-41.7)
- [ ] Sem preditor com meta, aparece o estado vazio com botão para a Missão 3 (RUM-40.2)
- [ ] Metas "sem objetivo" aparecem em bloco próprio com aviso (RUM-21.4)
- [ ] Cada objetivo mostra a barra e a contagem de metas por status (RUM-41.12)
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; testes novos em `e2e/rumo-plano.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(rumo): aba do planejamento com status e atingimento`

---

### T21: Edição pela aba: acrescentar, editar, remover, filtrar por pessoa

**What**: No `Plano.tsx`, permitir acrescentar meta por objetivo, editar texto, objetivo, responsável, apoios e status com o mesmo `CartaoMeta`, remover com confirmação, filtrar por pessoa e imprimir.
**Where**: `ilhas/rumo/Plano.tsx`, `ilhas/rumo/CartaoMeta.tsx`, `ilhas/rumo/rumo.css`, `e2e/rumo-plano.spec.ts`
**Depends on**: T20
**Reuses**: `CartaoMeta` com `comStatus`, `lib/pessoas.ts`
**Requirement**: RUM-40, RUM-42

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [ ] Acrescentar meta na aba aplica o vínculo obrigatório e o limite de 4 por objetivo (RUM-40.9)
- [ ] Editar texto, objetivo, responsável e apoio na aba reflete no exercício da Missão 3 e vice-versa (mesmos dados) (RUM-40.8)
- [ ] Remover meta pede confirmação (RUM-40.10)
- [ ] Filtrar por pessoa destaca as metas dela como responsável ou apoio e esmaece as demais (RUM-42.11)
- [ ] "Imprimir" abre a impressão com a árvore em página limpa (`@media print` verificado por captura) (RUM-42.13)
- [ ] Setas/Enter/Espaço navegam e editam a árvore; cada nó tem rótulo acessível (RUM-42.14)
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; testes novos em `e2e/rumo-plano.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(rumo): edição do planejamento pela aba e filtro por pessoa`

---

### T22: Rota `#/plano`, item de menu e resumo no Painel

**What**: No `m3.js`, acrescentar `Telas.plano`, envolver `App.rotear` para `#/plano`, `App.lateral` com o item "Planejamento Estratégico" e `Telas.painel` trocando "Últimos registros" pela ilha `plano-resumo`. Implementar `ilhas/rumo/PlanoResumo.tsx`.
**Where**: `public/legacy/m3.js`, `ilhas/rumo/PlanoResumo.tsx`, `ilhas/rumo/rumo.css`, `tests/legado-m3.test.ts`, `e2e/rumo-painel.spec.ts`
**Depends on**: T21
**Reuses**: padrão de override de `App.lateral` em `novos.js`; `Telas.painel` de `app.js:151-195`
**Requirement**: RUM-43

**Tools**:

- MCP: NONE
- Skill: `frontend-design`

**Done when**:

- [ ] `#/plano` renderiza a ilha `plano` e marca o item do menu como ativo (RUM-43.4)
- [ ] O Painel com plano mostra manchete, atingimento total e barra por objetivo no lugar do bloco "Últimos registros" (RUM-43.1)
- [ ] O Painel sem plano mostra o convite com botão para a Missão 3 (RUM-43.2)
- [ ] "Abrir o planejamento" leva a `#/plano` (RUM-43.3)
- [ ] `Store.eventos` continua sendo gravado (nenhuma alteração em `Store.registrar`/`eventos`) (RUM-43.5)
- [ ] O Painel com e sem `Store.eventos` não mostra mais "Últimos registros" e o botão "Ver tudo o que foi preenchido" permanece
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; testes novos em `tests/legado-m3.test.ts` e `e2e/rumo-painel.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(rumo): rota do planejamento, menu e resumo no Painel`

---

### T23: Migração ponta a ponta e verificação em tela

**What**: Teste e2e que abre um mandato com dados da Missão 3 no formato antigo (texto em `m3.*`, `D.metas` só com `pred/texto/resp/apoio`, `D.preditores`) e percorre exercício, aba e Painel sem perda; capturas de tela de cada ilha em 375 px e 1280 px conferidas; `graphify update .`.
**Where**: `e2e/rumo-migracao.spec.ts`, `e2e/semente-rumo.ts`
**Depends on**: T22
**Reuses**: semente da T10
**Requirement**: RUM-70

**Tools**:

- MCP: NONE
- Skill: `run`

**Done when**:

- [ ] Nenhum texto de `m3.*`, nenhuma meta e nenhum preditor do mandato antigo some após abrir e editar uma meta (critério de sucesso 3)
- [ ] Metas antigas aparecem na aba como "Não concluída" e contam 0 até alguém mudar o status (edge case)
- [ ] Capturas de tela das 7 ilhas em 375 px e 1280 px não têm rolagem horizontal da página
- [ ] Resumo (`#/resumo`) continua mostrando bandeiras, legado, preditores e metas
- [ ] Gate: `npx tsc --noEmit && npm test && npm run test:e2e && npm run build`; testes novos em `e2e/rumo-migracao.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: build
**Commit**: `test(rumo): migração e verificação em tela da Missão 3`

---

### T24: Imagem da primeira página e ordenação por atingimento (P3, opcional)

**What**: Botão "Baixar imagem" na primeira página (PNG) e "Ordenar por atingimento" na aba. Verificar a biblioteca de captura (`html-to-image`) antes de adotar; se não cumprir o gate, usar a impressão e registrar.
**Where**: `ilhas/rumo/Jornal.tsx`, `ilhas/rumo/Plano.tsx`, `package.json`, `e2e/rumo-extras.spec.ts`
**Depends on**: T23
**Reuses**: `Jornal.tsx`, `pctObjetivo`
**Requirement**: RUM-60

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] "Baixar imagem" gera um PNG com a manchete atual (download verificado no e2e) (RUM-60.1)
- [ ] "Ordenar por atingimento" reordena os objetivos do menor para o maior, com "—" ao final (RUM-60.2)
- [ ] A biblioteca escolhida e a versão foram conferidas na documentação antes de entrar em `package.json`
- [ ] Gate: `npx tsc --noEmit && npm test && npm run test:e2e && npm run build`; testes novos em `e2e/rumo-extras.spec.ts`, nenhum removido

**Tests**: e2e
**Gate**: build
**Commit**: `feat(rumo): imagem da primeira página e ordenação por atingimento`

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1-T8 | `lib/*.ts` | unit | unit | ✅ OK |
| T9 | script de dados + JSON | unit (validação do JSON) | unit | ✅ OK |
| T10 | hook, ponte, rota de teste | e2e (fumaça) | e2e | ✅ OK |
| T11-T12 | `m3.js` | unit (`node:vm`) | unit | ✅ OK |
| T13-T14, T18-T22 | ilhas React | e2e | e2e | ✅ OK |
| T15-T17 | ilha e componente visual | e2e | e2e | ✅ OK |
| T23-T24 | e2e de migração e extras | e2e | e2e | ✅ OK |

## Requirement Coverage

RUM-01 T2, T13 · RUM-02 T1, T2, T12, T13 · RUM-03 T2, T13 · RUM-10 T3, T16 · RUM-11 T3, T12, T16, T17 · RUM-12 T11, T15, T16 · RUM-20 T5, T18 · RUM-21 T5, T11, T18, T20 · RUM-30 T5, T11, T19 · RUM-31 T4, T19 · RUM-32 T7, T19 · RUM-40 T20, T21 · RUM-41 T6, T20 · RUM-42 T18, T21 · RUM-43 T22 · RUM-50 T8, T9, T14 · RUM-51 T8, T14 · RUM-52 T3, T17 · RUM-60 T24 · RUM-70 T1, T7, T10, T11, T12, T16, T19, T23.
