# Missões 2 e 3 · Reestruturação Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path.

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/missao2-3-reestruturacao/spec.md`
**Design**: `.specs/features/missao2-3-reestruturacao/design.md`
**Status**: Draft (aguarda "PODE EXECUTAR"); execução proposta com sub-agentes em lotes de ~7 tarefas

Caminhos relativos a `plataforma/`. A árvore de trabalho tem mudanças do usuário não commitadas. Regras:

1. Cada commit usa `git add` com os arquivos nomeados da tarefa; nunca `git add -A`.
2. Antes de editar `ilhas/ponte.tsx`, `ilhas/equipe/Organograma.tsx`, `lib/types.ts` ou qualquer `public/legacy/*.js`, rodar `git diff` no arquivo e preservar a mudança do usuário.
3. `conteudo.js`, `guia.js`, `app.js`, `nucleo.js`, `resumo.js` e `novos.js` não são editados (AD-003); ganchos novos ficam em `public/legacy/m2.js`, `m3.js` e `m5.js`.
4. Antes de criar rota nova de teste, ler o guia de rotas em `node_modules/next/dist/docs/` (regra de `plataforma/AGENTS.md`). Seguir o padrão da rota `app/teste-rumo/*`.
5. **A árvore do planejamento e as metas da M3 não mudam.** Qualquer tarefa que altere `arvore()`, `podeAcrescentarMeta`, `contagemMetas`, `lib/atingimento.ts` ou `CartaoMeta.tsx` além de texto visível está errada.
6. `git push` e deploy exigem go-ahead explícito; não fazem parte destas tarefas.
7. Rodar o Python do projeto por `C:\Users\brand\AppData\Roaming\uv\tools\graphifyy\Scripts\python.exe` (o `python3` não existe nesta máquina).
8. Dados novos só em `D.campos` (chaves `m2.*`, `m3.*`); nenhuma chave nova de topo em `D` (design).

---

## Test Coverage Matrix

> Gerada de `plataforma/CLAUDE.md`, `plataforma/AGENTS.md`, `package.json` e dos testes existentes (`tests/*.test.ts`, `e2e/*.spec.ts`), com o padrão das features `missao3-rumo` e `missao5-avanco`. Guidelines found: `plataforma/CLAUDE.md` (comandos `npm test`, `npx tsc --noEmit`, `npm run test:e2e`; imports relativos terminando em `.ts` em `lib/` e `tests/`), `plataforma/AGENTS.md` (ler o guia do Next antes de rota nova). Sem lint configurado.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Lógica pura (`lib/tabelaEquipe.ts`, `lib/quadroRotinas.ts`, `lib/estrategia.ts`, `lib/termos.ts`, `lib/plano.ts`, `lib/exporta.ts`, `lib/layoutOrg.ts`, `lib/entrega.ts`, `lib/smart.ts`) | unit | Todos os ramos; 1:1 com os critérios da spec; cada edge case tem teste | `tests/*.test.ts` | `npm test` |
| Ilhas React (`ilhas/equipe/*.tsx`, `ilhas/rumo/*.tsx`) | e2e | Caminho feliz de cada tela que a tarefa cria ou muda + cada edge case que a spec lista para ela | `e2e/m23-*.spec.ts` | `npm run test:e2e` |
| Ganchos do legado (`public/legacy/m2.js`, `m3.js`) | unit (`node:vm` com globais simuladas) | Cada override: entrada antiga e nova; texto do Guia comparado com o esperado | `tests/legado-m2.test.ts`, `tests/legado-m3.test.ts` | `npm test` |
| `ponte.tsx`, CSS, remoção de arquivos | none | - (exercitados pelos e2e das ilhas) | - | `npx tsc --noEmit` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tarefas só com testes unitários | `npm test` |
| Full | Tarefas de ilha, que têm teste e2e | `npm test && npx tsc --noEmit && npm run test:e2e` |
| Build | Fim de fase e tarefas com `Tests: none` | `npx tsc --noEmit && npm test && npm run test:e2e && npm run build` |

Observação: o `npm run build` oscila com `SecurityFatalError` do Next 16.4 (advisory conhecido). Se falhar só por isso, o gate Build vale como `npx tsc --noEmit && npm test && npm run test:e2e`, e a falha fica registrada na tarefa.

---

## Execution Plan

Fases em ordem; tarefas em ordem dentro da fase. A seta que abre cada fase marca a dependência da última tarefa da fase anterior.

### Phase 1: Terminologia "Objetivo Estratégico"

```
T1 → T2 → T3 → T4
```

### Phase 2: M3 · Preditores, justificativas e estratégia

```
T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11
```

### Phase 3: M2 · Tabela de equipe e organograma gerado

```
T11 → T12 → T13 → T14 → T15 → T16 → T17 → T18 → T19
```

### Phase 4: M2 · Rotinas, PDF e Planejamento

```
T19 → T20 → T21 → T22 → T23 → T24 → T25 → T26
```

### Phase 5: Fechamento

```
T26 → T27 → T28 → T29
```

---

## Task Breakdown

### T1: Função de troca de nomenclatura ✅

**What**: Criar `lib/termos.ts` com `paraEstrategico(texto)`, que troca "objetivo(s) específico(s)" e "objetivo(s) específica(s)" por "estratégico(s)", preservando maiúsculas, plural e acentos.
**Where**: `lib/termos.ts` (+ `tests/termos.test.ts`)
**Depends on**: None
**Reuses**: nenhum
**Requirement**: RM3-40

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] "Objetivo específico" → "Objetivo estratégico"; "objetivos específicos" → "objetivos estratégicos"; "OBJETIVO ESPECÍFICO" → "OBJETIVO ESTRATÉGICO" (RM3-41)
- [x] Texto sem o termo volta idêntico, byte a byte (RM3-41)
- [x] "Objetivos Específicos" com iniciais maiúsculas vira "Objetivos Estratégicos"
- [x] HTML (tags e entidades) passa intacto
- [x] Gate: `npm test`; testes novos em `tests/termos.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m3): função de troca para Objetivo Estratégico`

---

### T2: Textos do Guia trocados por override ✅

**What**: Em `public/legacy/m3.js`, aplicar a troca de T1 a todas as strings de `MISSOES` (incluindo a Missão 5 e o `resumo` da Missão 3) na carga, e trocar a frase de `Telas.plano`. Atualizar `tests/legado-m3.test.ts` para o texto esperado.
**Where**: `public/legacy/m3.js` (+ `tests/legado-m3.test.ts`)
**Depends on**: T1
**Reuses**: `lib/termos.ts` (reimplementação equivalente em JS no gancho, mesma regra)
**Requirement**: RM3-42

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Nenhuma string de `MISSOES` contém "objetivo específico" depois da carga (RM3-42, RM3-44)
- [x] Todo o restante do texto da Missão 3 e da 5 permanece igual (comparação por hash do texto com a troca aplicada)
- [x] `Telas.plano` mostra "objetivos estratégicos"
- [x] `conteudo.js` não foi editado (`git diff` vazio nele)
- [x] Gate: `npm test`; testes de `tests/legado-m3.test.ts` ajustados, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m3): textos do Guia com Objetivo Estratégico por override`

---

### T3: Textos das ilhas da Missão 3 ✅

**What**: Trocar "objetivo específico" por "objetivo estratégico" nos textos visíveis de `ArvorePlano`, `CartaoMeta`, `EditorPlano` e `Metas` (rótulos, avisos e comentários), sem mudar lógica. Ajustar os e2e que citam o texto antigo.
**Where**: `ilhas/rumo/*.tsx` (varredura de texto, exceto `Preditores.tsx`, refeito em T7)
**Depends on**: T2
**Reuses**: padrão de rótulos atual
**Requirement**: RM3-40

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Rótulos e avisos dessas ilhas dizem "objetivo estratégico" (RM3-40)
- [x] Diff só de strings e comentários: nenhuma linha de lógica alterada (regra 5)
- [x] e2e `rumo-metas`, `rumo-plano` e `m5-ciclos` ajustados ao novo texto e passando
- [x] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; nenhum teste removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m3): rótulos das ilhas com Objetivo Estratégico`

---

### T4: Textos de lib e varredura final ✅

**What**: Trocar o texto de `lib/smart.ts` (letra R) e acrescentar um teste de varredura que falha se qualquer arquivo de UI ou lib, fora de `conteudo.js`/`guia.js` (legados, cobertos pelo override), contiver "objetivo específico".
**Where**: `lib/smart.ts` (+ `tests/varredura-termos.test.ts`, `tests/smart.test.ts`)
**Depends on**: T3
**Reuses**: `tests/smart.test.ts`
**Requirement**: RM3-40, RM3-44

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Dica do R diz "objetivo estratégico" (RM3-40)
- [x] A varredura lista arquivos infratores e passa (ignora `public/legacy/conteudo.js`, `public/legacy/guia.js`, `Preditores.tsx`, `lib/plano.ts` até T6/T7, listados em constante com data de saída) (RM3-44)
- [x] Gate: `npm test`; testes novos nos dois arquivos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m3): dica SMART e varredura de terminologia`

---

### T5: Lógica da estratégia e das justificativas

**What**: Criar `lib/estrategia.ts` com `lerEstrategia`, `defineEstrategia`, `textoObjetivo`, `OBJETIVOS_LEGISLA`, `lerJustificativa`, `defineJustificativa`, `faltamJustificativas` e `passoPreditoresConcluido`.
**Where**: `lib/estrategia.ts` (+ `tests/estrategia.test.ts`)
**Depends on**: T4
**Reuses**: `PREDITORES` de `lib/plano.ts`
**Requirement**: RM3-10, RM3-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A: `textoObjetivo` devolve o nome do preditor mesmo com `m3.obj.{pid}` preenchido (RM3-12)
- [ ] B: devolve a frase de `m3.obj.{pid}`, ou o nome se vazia (RM3-13)
- [ ] C: devolve o nome do preditor; `OBJETIVOS_LEGISLA` traz as 3 frases do documento (RM3-14)
- [ ] `defineEstrategia` não apaga `m3.obj.*` ao trocar (RM3-17)
- [ ] `lerEstrategia` sem `m3.est`: `'b'` se há `m3.obj.*` preenchido, `'a'` se há preditores e nenhum texto, `null` sem preditores; valor inválido vira `null` (RMX-01)
- [ ] Justificativas por preditor preservadas ao desmarcar e remarcar (RM3-05)
- [ ] `faltamJustificativas` conta as 5; `passoPreditoresConcluido` exige 3 escolhidos, estratégia, 3 frases se B e 5 justificativas (RM3-06)
- [ ] Gate: `npm test`; testes novos em `tests/estrategia.test.ts`, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m3): lógica da estratégia A/B/C e das justificativas`

---

### T6: Objetivos pela estratégia, árvore intacta

**What**: Fazer `objetivos(d)` em `lib/plano.ts` usar `textoObjetivo` da estratégia vigente; trocar o texto da mensagem de `podeAcrescentarMeta`. Nada mais muda.
**Where**: `lib/plano.ts` (+ `tests/plano.test.ts`)
**Depends on**: T5
**Reuses**: `lib/estrategia.ts`
**Requirement**: RM3-16

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Com os mesmos preditores e metas, `arvore(d)` tem os mesmos `pid`, a mesma ordem e as mesmas metas por nó nas estratégias A, B e C; só `texto` difere (RM3-16)
- [ ] Trocar a estratégia não altera `D.metas` nem `D.preditores` (RM3-16)
- [ ] `podeAcrescentarMeta`, `contagemMetas`, `alternaPreditor` e `desmarcaPreditor` seguem passando sem alteração nos testes existentes
- [ ] Mensagem diz "objetivo estratégico"
- [ ] Gate: `npm test`; testes novos, nenhum removido nem enfraquecido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m3): objetivos lidos pela estratégia, árvore inalterada`

---

### T7: Preditores com justificativa

**What**: Em `Preditores.tsx`, manter os cartões clicáveis e acrescentar a caixa "Este preditor foi escolhido pois…" (marcados) e "não foi escolhido pois…" (os 2 restantes, quando há 3), o contador "faltam N justificativas" e o aviso "Atenção! Sua escolha deve considerar o que precisa acontecer logo nos primeiros dias do mandato". Retirar o campo de frase por preditor (vai para T8) e a tabela de exemplos antiga.
**Where**: `ilhas/rumo/Preditores.tsx` (+ `e2e/m23-preditores.spec.ts`, ajuste de `e2e/rumo-preditores.spec.ts`)
**Depends on**: T6
**Reuses**: `useRumo`, `alternaPreditor`, `desmarcaPreditor`, `lib/estrategia.ts`
**Requirement**: RM3-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Preditor marcado abre "foi escolhido pois…" (RM3-02)
- [ ] Com 3 marcados, os 2 restantes abrem "não foi escolhido pois…" (RM3-03)
- [ ] Quarto preditor recusado com o aviso atual (RM3-04)
- [ ] Trocar a seleção preserva justificativas e troca o rótulo (RM3-05)
- [ ] "faltam N justificativas" some com as 5 preenchidas e nunca bloqueia (RM3-06)
- [ ] Texto do Guia do exercício continua (RM3-07)
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; nenhum teste removido, `rumo-preditores` ajustado

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m3): justificativa de cada preditor`

---

### T8: Ilha da estratégia A/B/C

**What**: Criar `Estrategia.tsx`: explicação de Objetivo Estratégico, 5 exemplos do documento, as 3 opções (uma só), campo de frase por preditor na B, nota de referência com as 3 frases da Legisla na C, confirmação ao trocar e prévia da árvore ao lado.
**Where**: `ilhas/rumo/Estrategia.tsx` (+ `e2e/m23-estrategia.spec.ts`)
**Depends on**: T7
**Reuses**: `useRumo`, `ArvorePlano` (prévia), `lib/estrategia.ts`
**Requirement**: RM3-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] As 3 opções com o texto do documento e uma única ativa (RM3-11)
- [ ] A fecha o passo sem campo; C mostra as 3 frases da Legisla como referência (RM3-12, RM3-14)
- [ ] B abre uma frase por preditor escolhido com o nome visível e a árvore mostra as frases (RM3-13)
- [ ] Trocar pede confirmação e guarda o texto anterior (RM3-17)
- [ ] A árvore tem os mesmos nós nas três opções e nenhuma meta se move (RM3-16)
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; nenhum teste removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m3): ilha da estratégia A/B/C`

---

### T9: Gancho do exercício dos preditores

**What**: Em `m3.js`, fazer `Comp.preditores` devolver as ilhas `rumo-preditores` e `rumo-estrategia`, e `temConteudo` de `m3.preditores` usar a conclusão da estratégia. Registrar `rumo-estrategia` na ponte.
**Where**: `public/legacy/m3.js` (+ `ilhas/ponte.tsx` registro, `tests/legado-m3.test.ts`)
**Depends on**: T8
**Reuses**: padrão `Comp.metas`/`ilha(n)` de `m3.js`
**Requirement**: RM3-10, RM3-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O exercício mostra preditores e, abaixo, a estratégia (RM3-10)
- [ ] `temConteudo('m3.preditores')`: falso sem estratégia, verdadeiro com 3 preditores e estratégia fechada (RM3-06)
- [ ] Mandato antigo (só `D.preditores`) segue contando como preenchido (RMX-01)
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; nenhum teste removido

**Tests**: unit
**Gate**: full
**Commit**: `feat(m3): exercício dos preditores com estratégia`

---

### T10: Planejamento mostra estratégia e justificativas

**What**: Em `Plano.tsx`, acima da árvore, mostrar "Estratégia dos objetivos: A/B/C" (com as 3 frases da Legisla como nota na C) e as justificativas dos preditores em bloco recolhível. A árvore e as metas não mudam.
**Where**: `ilhas/rumo/Plano.tsx` (+ `e2e/m23-plano.spec.ts`)
**Depends on**: T9
**Reuses**: `lib/estrategia.ts`, `useRumo`
**Requirement**: RM3-18

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A aba mostra a estratégia escolhida e as 5 justificativas (RM3-18)
- [ ] Na C, a nota lista as 3 frases e nenhum nó novo aparece (RM3-14)
- [ ] Planejamento arquivado (M5) segue somente leitura e sem erro (edge case)
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; nenhum teste removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m3): estratégia e justificativas no Planejamento`

---

### T11: Resumo com estratégia e justificativas

**What**: Em `m3.js`, sobrescrever `Resumo.ex` do exercício `m3.preditores` para listar a estratégia, o texto de cada objetivo e as justificativas.
**Where**: `public/legacy/m3.js` (+ `tests/legado-m3.test.ts`)
**Depends on**: T10
**Reuses**: padrão `Resumo.ex` de `m2.js`
**Requirement**: RM3-18

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O Resumo mostra "Estratégia: A/B/C", os objetivos estratégicos e as justificativas (RM3-18)
- [ ] Sem estratégia, mostra o estado antigo sem erro
- [ ] Gate: `npm test`; testes novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m3): Resumo com estratégia e justificativas`

---

### T12: Colunas, linhas e travamento da tabela

**What**: Criar `lib/tabelaEquipe.ts` com `COLUNAS`, `CATEGORIAS`, `linhas(c)`, `colunaLiberada` e `completa`.
**Where**: `lib/tabelaEquipe.ts` (+ `tests/tabelaEquipe.test.ts`)
**Depends on**: T11
**Reuses**: `ativas`, `coordDe`, `nomeDe`, `AREAS`, `SEM_AREA` de `lib/cadeiras.ts`
**Requirement**: RM2-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Ordem: escopo → competências → cargo → pessoa → categoria → área (RM2-05)
- [ ] `colunaLiberada` só libera a coluna N com a N-1 preenchida e devolve o nome da que falta (RM2-05)
- [ ] Esvaziar uma coluna anterior trava as seguintes sem apagar valores (RM2-06)
- [ ] `*` na pessoa conta como preenchida e marca processo seletivo (RM2-07)
- [ ] `completa` só com as 6 colunas preenchidas; contagem "X de N" certa (RM2-09)
- [ ] Gate: `npm test`; testes novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m2): lógica das colunas e linhas da tabela de equipe`

---

### T13: Quantidade de pessoas

**What**: Em `lib/tabelaEquipe.ts`, acrescentar `defineN(c, n)`: valida 1 a 40, cria linhas vazias com índices 20+ (nunca reativa o modelo), e ao diminuir remove só linhas vazias e devolve `confirma` para as preenchidas.
**Where**: `lib/tabelaEquipe.ts` (+ `tests/tabelaEquipe.test.ts`)
**Depends on**: T12
**Reuses**: `acrescenta`, `remove` de `lib/cadeiras.ts`
**Requirement**: RM2-03, RM2-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] N inválido (0, 41, decimal, texto) devolve erro e nenhum patch (RM2-03)
- [ ] N conta a Chefia (cadeira 0); N=1 mantém só ela (design)
- [ ] Aumentar cria linhas só com índices 20+ e sem `coord`/`lider` herdados de `PADRAO` (RM2-04)
- [ ] Diminuir remove só vazias; se faltar vazias, devolve `confirma` com os nomes (RM2-04)
- [ ] `m2.n` gravado com o valor aceito
- [ ] Gate: `npm test`; testes novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m2): quantidade de pessoas define as linhas`

---

### T14: Edição de célula e liderança derivada

**What**: Em `lib/tabelaEquipe.ts`, acrescentar `editaCelula`, `recalculaLideres` (regra D8) e `avisosOrg`.
**Where**: `lib/tabelaEquipe.ts` (+ `tests/tabelaEquipe.test.ts`)
**Depends on**: T13
**Reuses**: `chaveFicha`, `chaveNome`, `liderDe`
**Requirement**: RM2-30

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Chefia grava `lider='-'`; Coordenação aponta para a Chefia; Especialista e Executora apontam para a Coordenação da própria área (RM2-31)
- [ ] Área sem Coordenação: liga à Chefia e `avisosOrg` traz "Área sem coordenação" (RM2-32)
- [ ] Sem Chefia: `avisosOrg` traz "Defina a chefia"; com 2 ou mais, o aviso de mais de uma (RM2-33, RM2-34)
- [ ] Editar a categoria ou a área de uma linha recalcula a liderança de todas as dependentes no mesmo patch (RM2-35)
- [ ] `liderDe` lê o valor gravado, então o Feedback da M5 recebe a mesma liderança (RM2-38)
- [ ] Linha sem categoria ou área não ganha `lider` novo
- [ ] Gate: `npm test`; testes novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m2): liderança derivada de categoria e área`

---

### T15: Migração do formato antigo

**What**: Em `lib/tabelaEquipe.ts`, acrescentar `escopoTexto`, `competenciasTexto`, `categoriaPadrao` e `migrada`, para ler a equipe do modelo de 20 cadeiras na tabela nova sem reescrever dados.
**Where**: `lib/tabelaEquipe.ts` (+ `tests/tabelaEquipe.test.ts`)
**Depends on**: T14
**Reuses**: `ativas`, `liderDe`, `chaveFicha`
**Requirement**: RMX-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `escopoTexto` devolve `esc` quando há; senão junta os chips de `escopo` com `espec` (RMX-02)
- [ ] `categoriaPadrao`: cadeira 0 = Chefia; quem lidera alguém = Coordenação; o resto = Executora (RMX-02)
- [ ] `migrada` verdadeiro com `m2.n` ausente e dados antigos; falso para mandato novo vazio
- [ ] Nada de `hab_*`, `rep_*`, `ritmo`, `rel`, `entrega` ou `fb_*` é apagado (RMX-03)
- [ ] Gate: `npm test`; testes novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m2): leitura da equipe antiga na tabela nova`

---

### T16: Ilha da tabela de equipe

**What**: Criar `TabelaEquipe.tsx`: pergunta N, mostra as linhas, desabilita colunas travadas com a legenda "Preencha antes: …", aviso de processo seletivo, "X de N linhas completas", linhas como cartões no celular. Registrar a ilha na ponte.
**Where**: `ilhas/equipe/TabelaEquipe.tsx` (+ `ilhas/ponte.tsx` registro, `e2e/m23-tabela.spec.ts`)
**Depends on**: T15
**Reuses**: `useEquipe`, `lib/tabelaEquipe.ts`, `equipe.css`
**Requirement**: RM2-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Tabela vazia pede N antes de qualquer linha (RM2-03)
- [ ] Informar 4 cria 4 linhas e "0 de 4 linhas completas" (RM2-04)
- [ ] Coluna travada desabilitada com a legenda; destrava ao preencher a anterior (RM2-05)
- [ ] `*` mostra o incentivo à diversidade do Guia (RM2-07)
- [ ] Categoria e área só aparecem com a pessoa preenchida (RM2-08)
- [ ] Autosave sem botão salvar (RM2-10)
- [ ] Viewport de celular: linhas como cartões na mesma ordem (RM2-11)
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; nenhum teste removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m2): ilha da tabela de equipe em ordem`

---

### T17: Layout do organograma sem arestas entre áreas

**What**: Em `lib/layoutOrg.ts`, remover as arestas `entre` (e a dependência de `rotinasEntreAreas`); manter nós e hierarquia.
**Where**: `lib/layoutOrg.ts` (+ `tests/layoutOrg.test.ts`)
**Depends on**: T16
**Reuses**: `layoutOrg` atual
**Requirement**: RM2-30

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `layoutOrg` devolve só arestas de hierarquia (RM2-37)
- [ ] Nós e posições de uma equipe de exemplo continuam iguais
- [ ] `exporta.ts` segue gerando o SVG sem aresta pontilhada
- [ ] Gate: `npm test`; testes ajustados (os de aresta `entre` removidos com justificativa no commit), demais intactos

**Tests**: unit
**Gate**: quick
**Commit**: `refactor(m2): organograma sem arestas entre áreas`

---

### T18: Organograma gerado e reduzido

**What**: Reduzir `Organograma.tsx`: sem painel, anel e "Acrescentar cadeira"; mostrar `avisosOrg`; caixa mostra pessoa, cargo e área; clicar leva à linha da tabela.
**Where**: `ilhas/equipe/Organograma.tsx` (+ `e2e/m23-organograma.spec.ts`)
**Depends on**: T17
**Reuses**: `layoutOrg`, `avisosOrg`, estilos `es-no`
**Requirement**: RM2-30

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Chefia, Coordenação e Executoras formam 3 níveis (RM2-31)
- [ ] Remover a Coordenação mostra "Área sem coordenação" e liga à Chefia (RM2-32)
- [ ] Editar a tabela atualiza o organograma na hora (RM2-36)
- [ ] Caixa sem painel profundo; clicar foca a linha da tabela (RM2-37)
- [ ] Exportar PNG continua disponível (RM2-38)
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; nenhum teste removido (e2e do painel removido só em T27)

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m2): organograma gerado da tabela`

---

### T19: Gancho da Mão na massa 1

**What**: Em `m2.js`, fazer `Comp.funcoes` devolver `equipe-tabela` seguida de `organograma`, trocar o texto do exercício pelo do documento (passo a passo, checagem do mapa político, incentivo ao processo seletivo) e adaptar `situacao()`, `temConteudo` e `Resumo.ex` para contar linhas completas.
**Where**: `public/legacy/m2.js` (+ `tests/legado-m2.test.ts`)
**Depends on**: T18
**Reuses**: overrides existentes de `m2.js`
**Requirement**: RM2-01, RM2-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O exercício mostra o texto do documento e a tabela com o organograma abaixo (RM2-01)
- [ ] O passo "clareza sobre entregas e agendas" aparece marcado quando a Missão 1 está preenchida e com link quando não (RM2-02)
- [ ] `temConteudo` e o Resumo contam "X de N linhas completas" (RM2-09)
- [ ] Mandato antigo continua contando como preenchido (RMX-02)
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; nenhum teste removido

**Tests**: unit
**Gate**: full
**Commit**: `feat(m2): Mão na massa 1 com tabela e organograma`

---

### T20: Lógica do quadro de rotinas

**What**: Criar `lib/quadroRotinas.ts` com `MODELO` das 5 rotinas, `lerQuadro`, `editaRotina`, `agendadas`, `concluida`, `dataPassada` e `areasDoMandato`.
**Where**: `lib/quadroRotinas.ts` (+ `tests/quadroRotinas.test.ts`)
**Depends on**: T19
**Reuses**: `ativas`, `coordDe` de `lib/cadeiras.ts`
**Requirement**: RM2-50

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `MODELO` traz as 5 rotinas com frequência, participantes e duração do documento (RM2-51)
- [ ] `editaRotina` altera frequência, quem e duração e liga/desliga cada rotina sem tocar nas outras (RM2-53)
- [ ] `agendadas` conta só rotinas ligadas com data e hora; `concluida` exige todas (RM2-52, RM2-57)
- [ ] `dataPassada` é só informação, nunca bloqueia (RM2-54)
- [ ] JSON inválido em `m2.rq` cai no modelo sem erro
- [ ] `areasDoMandato` lista as áreas das linhas (RM2-56)
- [ ] Gate: `npm test`; testes novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m2): lógica do quadro de rotinas`

---

### T21: Ilha do quadro de rotinas

**What**: Criar `QuadroRotinas.tsx`: tabela das 5 rotinas com a linha "Quando o mandato iniciará a rotina?", edição de frequência, participantes e duração, liga/desliga e data e hora; "X de N agendadas".
**Where**: `ilhas/equipe/QuadroRotinas.tsx` (+ `e2e/m23-rotinas.spec.ts`)
**Depends on**: T20
**Reuses**: `useEquipe`, `lib/quadroRotinas.ts`, `equipe.css`
**Requirement**: RM2-50

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O quadro mostra as 5 rotinas do documento (RM2-51)
- [ ] Preencher data e hora das 5 mostra "5 de 5 agendadas" (RM2-52)
- [ ] Editar a duração da 1ª e reabrir mantém a edição (RM2-53)
- [ ] Data anterior a hoje avisa sem bloquear (RM2-54)
- [ ] Desligar uma rotina tira a exigência de data dela (RM2-57)
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; nenhum teste removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m2): ilha do quadro de rotinas`

---

### T22: HTML do quadro de rotinas para impressão

**What**: Em `lib/exporta.ts`, acrescentar `quadroRotinasHtml(rotinas)`: tabela escapada com rotina, frequência, participantes, duração e início.
**Where**: `lib/exporta.ts` (+ `tests/exporta.test.ts`)
**Depends on**: T21
**Reuses**: `esc` e padrão de `organogramaSvg`
**Requirement**: RM2-60

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A tabela traz as rotinas ligadas e o início "dd/mm/aaaa às hh:mm" ou "início ainda não definido" (RM2-62)
- [ ] Texto digitado com `<`, `&` e aspas sai escapado (segurança)
- [ ] Rotina desligada não aparece
- [ ] Gate: `npm test`; testes novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m2): HTML das rotinas para PDF`

---

### T23: Botão "Gerar PDF do organograma e rotinas"

**What**: Criar `PdfOrgRotinas.tsx`: monta o bloco imprimível (SVG do organograma + tabela de rotinas), marca `body.imprimindo-org`, chama `window.print()`; CSS `@media print` esconde o resto. Sem organograma, imprime só as rotinas e avisa.
**Where**: `ilhas/equipe/PdfOrgRotinas.tsx` (+ `e2e/m23-pdf.spec.ts`)
**Depends on**: T22
**Reuses**: `organogramaSvg`, `quadroRotinasHtml`, `aviso` da ponte
**Requirement**: RM2-60

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Em mídia `print`, só o organograma (página 1) e o quadro de rotinas ficam visíveis (RM2-61)
- [ ] Sem linhas na tabela, só as rotinas aparecem e o aviso é mostrado (RM2-63)
- [ ] O botão chama `window.print` (espionado no teste) e limpa `imprimindo-org` depois
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; nenhum teste removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m2): PDF do organograma e rotinas`

---

### T24: Checklist da Missão 2 pelo novo desenho

**What**: Em `lib/entrega.ts`, adaptar `sugestaoChecklist`: c1 = todas as linhas com escopo; c2 = organograma gerado sem aviso crítico; c3 = rotinas ligadas todas agendadas.
**Where**: `lib/entrega.ts` (+ `tests/entrega.test.ts`)
**Depends on**: T23
**Reuses**: `lib/tabelaEquipe.ts`, `lib/quadroRotinas.ts`
**Requirement**: RM2-57

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] c1 verdadeiro só com `esc` ou escopo antigo em todas as linhas ativas (RM2-57)
- [ ] c2 verdadeiro com organograma sem "Defina a chefia"
- [ ] c3 verdadeiro com `concluida` (RM2-57)
- [ ] A sugestão só marca; quem confirma é o usuário (comportamento atual)
- [ ] Gate: `npm test`; testes ajustados e novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m2): checklist sugerido pelo novo desenho`

---

### T25: Gancho da Mão na massa 2

**What**: Em `m2.js`, fazer o exercício `m2.gestao` mostrar objetivo, importância e exercício do documento, o `quadro-rotinas` e o botão do PDF, sem as ilhas `rotinas` e `entrega` antigas. Registrar `quadro-rotinas` e `pdf-org-rotinas` na ponte.
**Where**: `public/legacy/m2.js` (+ `ilhas/ponte.tsx` registro, `tests/legado-m2.test.ts`)
**Depends on**: T24
**Reuses**: overrides de `m2.gestao` existentes
**Requirement**: RM2-50

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] O exercício mostra "Objetivo", "Importância", o quadro e, abaixo, o botão do PDF (RM2-51, RM2-58)
- [ ] O texto "A Legisla sugere…" e as duas instruções (concordar/alterar) estão presentes
- [ ] As ilhas antigas `rotinas` e `entrega` não são mais emitidas
- [ ] Mandato antigo abre sem erro; dados de rotinas antigas ficam guardados (RMX-04)
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; nenhum teste removido

**Tests**: unit
**Gate**: full
**Commit**: `feat(m2): Mão na massa 2 com quadro de rotinas e PDF`

---

### T26: Seção "Rotinas do mandato" no Planejamento

**What**: Em `Plano.tsx`, acrescentar no fim da aba a seção "Rotinas do mandato" (rotinas ligadas, frequência, participantes, duração, início), o botão do PDF e o estado "início ainda não definido" com link para a Missão 2.
**Where**: `ilhas/rumo/Plano.tsx` (+ `e2e/m23-plano.spec.ts`)
**Depends on**: T25
**Reuses**: `lib/quadroRotinas.ts`, `PdfOrgRotinas`
**Requirement**: RM2-60

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A seção aparece no fim da aba com as rotinas ligadas (RM2-60)
- [ ] O botão gera o PDF do organograma e rotinas (RM2-61)
- [ ] Sem início definido mostra o estado e o link (RM2-62)
- [ ] A seção entra também na impressão do planejamento completo (RM2-64)
- [ ] Planejamento arquivado continua somente leitura
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; nenhum teste removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m2): rotinas do mandato no Planejamento`

---

### T27: Remoção das telas substituídas

**What**: Remover `Escalacao`, `EtapaAreas`, `EtapaCadeiras`, `EtapaNomes`, `MiniOrg`, `PainelCadeira`, `Rotinas`, `EntreAreas`, `Entrega`, `Chips` e `foco` de `ilhas/equipe/`, as entradas deles em `ponte.tsx`, e os testes que só cobrem essas telas; manter `lib/cadeiras.ts` e `lib/rotinas.ts` só no que ainda é usado.
**Where**: `ilhas/equipe/` (remoção de arquivos substituídos)
**Depends on**: T26
**Reuses**: nenhum
**Requirement**: RM2-30

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `grep` por cada componente removido não encontra import vivo em `ilhas/`, `app/` ou `public/legacy/m2.js`
- [ ] Cada teste removido está listado no commit com o motivo (tela substituída por T16/T18/T21)
- [ ] `lib/rotinas.ts` e `tests/rotinas.test.ts` reduzidos só se nada mais os importa
- [ ] Gate: `npx tsc --noEmit && npm test && npm run test:e2e && npm run build` (falha só por `SecurityFatalError` do Next vale como passou, registrada)

**Tests**: none
**Gate**: build
**Commit**: `refactor(m2): remover telas substituídas pela tabela e pelo quadro`

---

### T28: Compatibilidade de mandato antigo e da Missão 5

**What**: Criar e2e que abre M2 e M3 com um mandato do modelo antigo (20 cadeiras, `m3.obj.*`, metas, sucessos e feedbacks) e confirma que nada some; e que o Feedback da M5 usa a nova liderança derivada.
**Where**: `e2e/m23-migracao.spec.ts` (+ `e2e/semente-rumo.ts` ajuste da semente)
**Depends on**: T27
**Reuses**: `e2e/semente-rumo.ts`, `e2e/m5-feedback.spec.ts`
**Requirement**: RMX-01, RMX-02, RMX-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Mandato antigo mostra todas as pessoas e escopos na tabela, com categoria derivada (RMX-02)
- [ ] Nenhuma chave de `D.campos` do modelo antigo foi apagada (RMX-03)
- [ ] M3 com `m3.obj.*` abre na estratégia B e as metas ficam idênticas (RMX-01, RMX-04)
- [ ] No Feedback da M5 a liderança direta é a Coordenação da área (RM2-38)
- [ ] Planejamento arquivado antigo abre somente leitura
- [ ] Gate: `npm test && npx tsc --noEmit && npm run test:e2e`; nenhum teste removido

**Tests**: e2e
**Gate**: full
**Commit**: `test(m23): mandato antigo e Feedback da Missão 5 com a nova equipe`

---

### T29: Decisão de projeto, rastreabilidade e grafo

**What**: Registrar AD-006 em `.specs/STATE.md`, ajustar o spec (chaves de dados em `D.campos`, tabela de rastreabilidade com status) e rodar `graphify update .`.
**Where**: `.specs/STATE.md` (+ `.specs/features/missao2-3-reestruturacao/spec.md`)
**Depends on**: T28
**Reuses**: formato dos AD-001 a AD-005
**Requirement**: RM2-30, RM3-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] AD-006 descreve "tela nova sobre o modelo de cadeiras; liderança derivada e gravada"
- [ ] A spec cita `D.campos` no lugar de `D.estrategia`/`D.justificativas`/`D.rotinasQuadro`
- [ ] Cada ID `RM*` do spec aponta para as tarefas e para o status
- [ ] `graphify update .` rodou sem erro
- [ ] Gate: `npx tsc --noEmit && npm test && npm run test:e2e && npm run build` (mesma ressalva do Next)

**Tests**: none
**Gate**: build
**Commit**: `docs(m23): AD-006 e rastreabilidade da reestruturação`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Phase 1:  T1 → T2 → T3 → T4
Phase 2:  T5 → T6 → T7 → T8 → T9 → T10 → T11
Phase 3:  T12 → T13 → T14 → T15 → T16 → T17 → T18 → T19
Phase 4:  T20 → T21 → T22 → T23 → T24 → T25 → T26
Phase 5:  T27 → T28 → T29
```

Execução estritamente sequencial. Com 29 tarefas, proposta de 4 lotes (fases inteiras): **Lote 1** = Fases 1 e 2 (11 tarefas, lote grande mas coeso na M3), **Lote 2** = Fase 3 (8), **Lote 3** = Fase 4 (7), **Lote 4** = Fase 5 (3) mais o Verifier.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1, T5, T12 a T15, T20, T22, T24 | 1 arquivo de lib | ✅ Granular |
| T2, T9, T11, T19, T25 | 1 arquivo legado (+ teste e registro) | ✅ Granular |
| T7, T8, T10, T16, T18, T21, T23, T26 | 1 componente | ✅ Granular |
| T3 | Varredura de texto em 4 ilhas, sem lógica | ⚠️ Coeso (só strings) |
| T27 | Remoção de arquivos substituídos | ⚠️ Coeso (uma remoção) |

## Diagram-Definition Cross-Check

Cada tarefa depende só da anterior na mesma fase; a primeira de cada fase depende da última da anterior. Diagrama e campos `Depends on` conferem (verificado por `validate_tasks.py`).

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| ---- | ---------- | --------------- | --------- | ------ |
| T1, T5, T6, T12-T15, T17, T20, T22, T24 | lib pura | unit | unit | ✅ OK |
| T2, T9, T11, T19, T25 | ganchos do legado | unit | unit | ✅ OK |
| T3, T7, T8, T10, T16, T18, T21, T23, T26, T28 | ilhas | e2e | e2e | ✅ OK |
| T4 | lib (`smart.ts`) + varredura | unit | unit | ✅ OK |
| T27, T29 | remoção, docs | none | none | ✅ OK |
