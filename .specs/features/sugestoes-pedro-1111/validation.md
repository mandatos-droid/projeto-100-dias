# Sugestões do Pedro (11/11/2026): relatório do Verifier

## Validation (iteração 2): sugestoes-pedro-1111, só T1 a T18 — PASS ✅ (Verifier, HEAD f8b4bc1)

**Data**: 2026-11-11
**Spec**: `.specs/features/sugestoes-pedro-1111/spec.md`
**Diff range**: `8a987b7..f8b4bc1` (branch `feat/sugestoes-pedro-1111`; `8a987b7` é o commit de docs, exclusivo; o código parte de `origin/main` `8f40943`). São 19 commits: 18 de código (`692491e..fa6fede`) e 1 só de teste (`f8b4bc1`). `git diff --name-only` dá 20 arquivos: 19 de código e teste, mais o `tasks.md`. A iteração 1 registrou 22 arquivos; a recontagem dá 20, e o escopo não muda.
**Verifier**: sub-agente independente (autor ≠ verificador), iteração 2 de no máximo 3. Nenhum código ou teste do worktree real foi alterado; este arquivo é a única mudança e não foi commitado.

**Escopo do veredito**: o PASS vale **só para T1 a T18**. Não cobre T19 (CFG-01, contador de dias), que está pausada aguardando o dono do produto, nem o critério PAR-04 (caixa cortada no rodapé), que não foi reproduzido e voltou ao Pedro. Os dois estão em "Pendente por decisão", no fim deste arquivo, junto com as perguntas de precisão da spec (F4). Nenhum deles pesa no veredito.

**Veredito**: aprovado para T1 a T18. A iteração 1 (HEAD `fa6fede`) reprovou porque dois mutantes sobreviveram (E6 e E7), cada um numa parte de critério sem asserção. O commit `f8b4bc1` (`fa6fede..f8b4bc1`: só `plataforma/e2e/m1-conjuntura-partido.spec.ts` e `plataforma/e2e/m1-oportunidades.spec.ts`, 13 inserções, 0 remoções, nenhum arquivo de código) acrescentou as asserções que faltavam. Reinjetei E6 e E7 num worktree temporário e os dois agora morrem, cada um exatamente na asserção nova. Os gates passaram inteiros no worktree real.

**Spec-anchored check**: os 16 critérios entregues (CJ-01, CJ-02, CJ-03, UI-01, PAR-01, PAR-02, PAR-03, OP-01 a OP-04 e os 5 de SEL-01) têm evidência `arquivo:linha` com o valor da spec. Ficam 5 lacunas de precisão da spec (⚠️), que são perguntas ao Pedro e não bloqueiam.
**Gate**: `npx tsc --noEmit` exit 0; `npm test` 1459 passaram e 0 falharam; e2e `m1-` 88 passaram e 0 falharam.
**Sensor**: 22 mutantes distintos (8 unit, 14 e2e) e 24 injeções no total (22 na iteração 1, mais E6 e E7 de novo na iteração 2). Em `f8b4bc1` os 22 estão mortos e não há sobrevivente.

---

## Lacunas da iteração 1: como fecharam

| Lacuna | Critério | Evidência em `f8b4bc1` (`arquivo:linha` + asserção) | Prova de discriminação | Estado |
| --- | --- | --- | --- | --- |
| F1 | SEL-01.2: "rolar suavemente ao formulário" | `plataforma/e2e/m1-conjuntura-partido.spec.ts:187` `await expect(page.locator('section.rea')).toBeInViewport()`, logo depois do 2º clique (`:183`), do banner fechado (`:184`) e dos 2 chips (`:186`) | Em HEAD passa. Com E6 (sem o `scrollIntoView` de `plataforma/ilhas/Reacoes.tsx:70`) falha **nessa linha**: `Received: viewport ratio 0`. Os outros 8 testes da describe passaram com E6, então a morte vem só da asserção nova. A razão 0 mostra que o formulário começa fora da tela, e a asserção não passa à toa | ✅ Fechada |
| F2 | OP-02: contraste ≥ 4,5:1 **na tela** | `plataforma/e2e/m1-oportunidades.spec.ts:199-205` calcula o contraste WCAG de **todo** `[data-ilha="agendas-sociais"] .as-fx` a partir de `getComputedStyle(x).color` e `.backgroundColor`, com a fórmula escrita no próprio teste (sem usar a `lib`); `:206` `expect(razoes.length).toBeGreaterThan(0)` impede passar com lista vazia; `:207` `for (const z of razoes) expect(z).toBeGreaterThanOrEqual(4.5)` | Em HEAD passa. Com E7 (sem `--ft` em `plataforma/ilhas/AgendasSociais.tsx:108`, e o texto cai no `#fff` de `plataforma/public/legacy/ilhas.css:1131`) falha **nessa linha**: `Expected: >= 4.5, Received: 2.5250937246786007`, o mesmo 2,53:1 da sonda da iteração 1. Os outros 15 testes do arquivo passaram com E7 | ✅ Fechada |
| F3 | Payload de `D.conj2.reacoes[1]` (menor e opcional) | `plataforma/e2e/m1-conjuntura-partido.spec.ts:198` `expect(r[1].valor).toBeTruthy()`; `:199` `expect(r[1].valor).toMatch(/^\d/)` | Confere que o valor não está vazio e começa com dígito, mas não confere o valor exato do Placar nem o formato `X no estado, Y no Brasil`. A sonda E16 (abaixo) sobrevive | ⚠️ Fechada em parte (Minor, não bloqueia) |

---

## Tarefas

| Task | Status | Notas |
| ---- | ------ | ----- |
| T1 | ✅ Done | `.abas{overflow-y:hidden}` global (`plataforma/public/legacy/ilhas.css:25`) |
| T2 | ✅ Done | `plataforma/public/legacy/m1.js:51` |
| T3 | ✅ Done | `plataforma/lib/cargoEleito.ts` |
| T4 | ✅ Done | `plataforma/ilhas/Assentos.tsx:173,309` |
| T5 | ✅ Done | O `select` entrou em `plataforma/ilhas/Classificados.tsx:50` (cartões do carrossel, montados por `Assentos.tsx:324`) |
| T6 | ⚠️ Partial | PAR-03 entregue (`ilhas.css:399`, repro no corpo do commit `5e7fc6e`). PAR-04 está **pendente por decisão** |
| T7 | ✅ Done | Esfera `pref` saiu de `esferas` em `plataforma/ilhas/Conjuntura.tsx` |
| T8 | ✅ Done | Cartões no tópico (`Conjuntura.tsx:388-391`); `prefExtra` antigo preservado |
| T9 | ✅ Done | `ilhas.css:1120-1123` |
| T10 | ✅ Done | `plataforma/lib/agendas.ts` (`razaoContraste`, `textoSobre`); a ligação na tela agora é medida (`m1-oportunidades.spec.ts:199-207`) |
| T11 | ✅ Done | `.as-topo` (`ilhas.css:1118`) |
| T12 | ✅ Done | `descreveIndicador` em `plataforma/lib/indicadoresSociais.ts` |
| T13 | ✅ Done | `InfoIndicador` em `plataforma/ilhas/AgendasSociais.tsx:35` |
| T14 | ✅ Done | `plataforma/lib/selecaoDados.ts` |
| T15 | ✅ Done | `plataforma/ilhas/CartoesMunicipio.tsx:90,93,118` |
| T16 | ✅ Done | `Conjuntura.tsx:298,306` |
| T17 | ✅ Done | Fluxo em `plataforma/ilhas/Reacoes.tsx`; a rolagem ao formulário (`Reacoes.tsx:70`) agora tem asserção (`m1-conjuntura-partido.spec.ts:187`) |
| T18 | ✅ Done | `ilhas.css:1140-1159` |
| T19 | ⏸ Pendente por decisão | CFG-01, aguardando a confirmação da leitura do #141. Fora do veredito |

---

## Spec-Anchored Acceptance Criteria

A spec numera os critérios dentro de cada história e não traz o ID neles. O mapa para CJ-01 a CFG-01 segue o campo **Requirement** de cada task em `tasks.md` (P1, abaixo). As linhas de `m1-conjuntura-partido.spec.ts` depois de `:186` andaram +1 e, depois de `:197`, +3; as de `m1-oportunidades.spec.ts` depois de `:197` andaram +10. As citações abaixo são de `f8b4bc1`.

### P1: Corrigir o que está quebrado ou enganoso

| Critério (WHEN X THEN Y) | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| CJ-01: Conjuntura 2.1 exibida → título sem "o botão “i” também explica cada uma" | `<strong>Categorias de classificação:</strong>` e nenhuma das duas partes da frase antiga | `plataforma/tests/legado-m1.test.ts:144` `assert.ok(h.includes('<strong>Categorias de classificação:</strong>'))`; `:145` `assert.equal(h.includes('o botão'), false)`; `:146` `assert.equal(h.includes('também explica cada uma'), false)` | ✅ PASS |
| UI-01: qualquer `.abas` → sem rolagem vertical | `overflow-y` computado `hidden` e nada escondido na vertical | `plataforma/e2e/m1-conjuntura.spec.ts:261` `expect(d.overflowY).toBe('hidden')`; `:263` `expect(d.sobra).toBeLessThanOrEqual(1)`, em todas as `#tela .abas` da Conjuntura | ✅ PASS (⚠️ P4) |
| PAR-01: cartão de parlamentar mulher → cargo no feminino | "Deputada Estadual/Federal/Distrital", "Senadora"; sem gênero → masculino | `plataforma/tests/cargoEleito.test.ts:7-10` `assert.equal(cargoEleito({ k: 'e', uf: 'SP', g: 'F' }), 'Deputada Estadual')` e as outras 3; `:14-17` masculino; `:21-22` DF; `:26-29` sem gênero → masculino. Tela: `plataforma/e2e/m1-conjuntura.spec.ts:293` `toContainText('Deputada Estadual · MG')`; `:300` `'Deputado Estadual · MG'`; `:308` carrossel `'Deputada Estadual · MG'` | ✅ PASS |
| CFG-01: posse há mais de 100 dias → nada acima de 100 sobre "dia de 100" | — | — | ⏸ Pendente por decisão (T19), fora do veredito |

### P1: Parlamentares e municípios classificáveis sem ruído

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| PAR-02: cartão de parlamentar → relação atual uma vez + controle compacto com as 5 categorias e "Remover classificação" | sem os 5 botões; `select` com as 5 categorias na ordem; grava `D.relacoes[sq].status`; "Remover classificação" funciona | `plataforma/e2e/m1-conjuntura.spec.ts:324` `expect(cartao.locator('.st')).toHaveCount(0)`; `:328` `.cartao-class-cat` `toHaveCount(1)`; `:331` `expect(troca.locator('option')).toHaveText(CATS)`; `:335-336` status `toEqual(['aliado_concorrente', 'concorrente'])`; `:338` filtro `Aliado, mas concorrente 1`; `:341-342` remover → `Todas 1` | ✅ PASS (⚠️ P2) |
| PAR-03: parlamentares em 1280px → botão de navegação fora da caixa do cabeçalho | caixa da 1ª aba começa à direita de `.lado-alterna` | `plataforma/e2e/m1-conjuntura.spec.ts:361` `expect(a!.x).toBeGreaterThanOrEqual(b!.x + b!.width)` (menu recolhido) | ✅ PASS (⚠️ P3) |
| PAR-04: fim da rolagem → último bloco inteiro | — | — | ⏸ Pendente por decisão (não reproduzido; com o Pedro), fora do veredito |
| CJ-02: 2.2 com partido e UF → 5 cartões no tópico de municípios; sem os botões de adicionar | 5 cartões entre o título do tópico e a seção 4; 0 botões; `prefExtra` antigo intacto | `plataforma/e2e/m1-conjuntura-partido.spec.ts:93` `toHaveCount(5)`; `:94` e `:95` botões `toHaveCount(0)`; `:103` `expect(primeiro!.y).toBeGreaterThan(topico!.y)`; `:104` `expect(ultimo!.y).toBeLessThan(filiados!.y)`; `:107` `prefExtra[3500204]` `toBe('oposicao')`; `:108` `toBe('base')` | ✅ PASS |
| CJ-03: Placar exibido → sem a linha "Prefeitura" | linhas `['Presidência', 'Governo SP']`, sem "Prefeitura" | `plataforma/e2e/m1-conjuntura-partido.spec.ts:39` `toHaveText(['Presidência', 'Governo SP'])`; `:40` `not.toContainText(/Prefeitura/)` | ✅ PASS |

### P2: Cartões de agenda legíveis

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| OP-01: cartão com mais que 420px → só a lista rola; título e filtro visíveis | altura ≤ 420px; `scrollTop` > 0; título e filtro parados e visíveis; a página não rola | `plataforma/e2e/m1-oportunidades.spec.ts:163` `toBeLessThanOrEqual(420.5)`; `:169` `scrollTop` `toBeGreaterThan(0)`; `:170` posições `toEqual(antes)`; `:171-172` `toBeInViewport()`; `:173` `scrollY` `toBe(paginaAntes)`; `:174` o cartão não rola | ✅ PASS |
| OP-02: faixa exibida → fundo preenchido, negrito, contraste ≥ 4,5:1 | cada faixa com cor própria e texto ≥ 4,5:1 na tela | Regra: `plataforma/tests/indicadoresSociais.test.ts:87` cores distintas; `:90` `assert.ok(wcag(f.cor, texto) >= 4.5)` nas 5 faixas. Tela: `plataforma/e2e/m1-oportunidades.spec.ts:196` fundo `not.toBe('rgba(0, 0, 0, 0)')`; `:197` `peso >= 700`; **`:207` `expect(z).toBeGreaterThanOrEqual(4.5)` para todo `.as-fx` exibido**, com `:206` contra lista vazia (E7 morto) | ✅ PASS |
| OP-03: cartão exibido → cabeçalho separado por faixa colorida ou fundo suave | borda inferior na cor da agenda (≥ 3px), fundo não transparente, título e filtro dentro | `plataforma/e2e/m1-oportunidades.spec.ts:187` título e filtro no `.as-topo`; `:188` `expect(r.borda).toBe(r.rgb)`; `:189` `larg >= 3`; `:190` fundo não transparente (nos 4 cartões) | ✅ PASS |
| OP-04: hover ou foco no ⓘ → tooltip com fonte, ano e sentido | `Fonte: MEC/IDEB · Ano: 2023 · Sentido: mais é melhor`; foco abre; Esc fecha; sem "undefined/null" | `plataforma/e2e/m1-oportunidades.spec.ts:224` `toHaveText('Fonte: MEC/IDEB · Ano: 2023 · Sentido: mais é melhor')` (hover); `:226` Esc → `toBeHidden()`; `:230-231` foco → visível, sem `/undefined|null/`; `:233` Esc fecha. Regra: `plataforma/tests/indicadoresSociais.test.ts:110`, `:115-118`, `:132`, `:134` | ✅ PASS |

### P2: Selecionar 2 dados clicando na página (SEL-01)

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| SEL-01.1: "Selecionar 2 dados na tela" → banner fixo com [Cancelar], `.capturable-data` destacados, 1º clique = Dado 1, 2º = Dado 2 | banner com "1º" e Cancelar; contorno só no modo ativo; `reacoes[0].dado` = 1º clicado, `reacoes[1].dado` = 2º | `plataforma/e2e/m1-conjuntura-partido.spec.ts:177` banner `'1º'`; `:178` Cancelar visível; `:180` `'2º'`; `:182` nada gravado depois do 1º clique; `:195` `r[0]` `toMatchObject({ dado: 'filiados', … })`; `:196` `r[1]` `{ dado: 'parlamentares', … }`; destaque `:273`/`:276`/`:280` `outlineStyle` `none` → `not none` → `none`. Regra: `plataforma/tests/selecaoDados.test.ts:12-13`, `:19-24` `deepEqual(dadosFinais(e), [A, B])` | ✅ PASS |
| SEL-01.2: 2º clique → fecha o banner, rola suavemente ao formulário, chips com ✕ | banner some; o formulário entra na tela; 2 chips com ✕ | `plataforma/e2e/m1-conjuntura-partido.spec.ts:184` banner `toHaveCount(0)`; `:186` `.rea-chip` `toHaveCount(2)`; **`:187` `expect(page.locator('section.rea')).toBeInViewport()`** (E6 morto); ✕ exercitado em `:254` (`Remover o dado 1`) | ✅ PASS (⚠️ P5: "suavemente" não tem medida) |
| SEL-01.3: remover chip → limpa só aquele dado e permite reabrir | 1 chip; dado 2 e o texto dele ficam; reabrir pede o 1º; termina `['vereadores', 'parlamentares']` | `plataforma/e2e/m1-conjuntura-partido.spec.ts:255` `toHaveCount(1)`; `:256` linha 2 continua `Parlamentares do partido`; `:257` `toHaveValue('texto do dado 2')`; `:259` `'1º'`; `:265` `toEqual(['vereadores', 'parlamentares'])`. Regra: `plataforma/tests/selecaoDados.test.ts:50` `deepEqual(e.atuais, [null, B])`, `:58` `[C, B]` | ✅ PASS |
| SEL-01.4: mesmo dado duas vezes → ignora e avisa no banner | `Escolha um indicador diferente.`; nenhum chip; o próximo válido conclui | `plataforma/e2e/m1-conjuntura-partido.spec.ts:222` `toContainText('Escolha um indicador diferente.')`; `:223` `.rea-chip` `toHaveCount(0)`; `:225` `toHaveCount(2)`. Regra: `plataforma/tests/selecaoDados.test.ts:32` `deepEqual(e.novos, [A])`; `:33` aviso | ✅ PASS |
| SEL-01.5: [Cancelar] ou Esc no meio → fecha sem gravar pela metade | banner some; nenhuma tag; `reacoes` vazio depois do atraso de gravação | `plataforma/e2e/m1-conjuntura-partido.spec.ts:233` (Cancelar) e `:237` (Esc) banner `toHaveCount(0)`; `:238` tags 0; `:241` `reacoes` `toHaveLength(0)`. Regra: `plataforma/tests/selecaoDados.test.ts:43-45` | ✅ PASS |

**Status**: ✅ os 16 critérios entregues estão cobertos com o valor da spec; ⚠️ 5 lacunas de precisão da spec (perguntas ao Pedro, não bloqueiam); ⏸ CFG-01 e PAR-04 pendentes por decisão.

### Regra de payload e conjunção

| Payload | Asserido por valor | Falta |
| --- | --- | --- |
| `D.conj2.reacoes[0]` `{dado, valor, texto}` | `dado` e `texto` (`m1-conjuntura-partido.spec.ts:195`); `valor` exato contra o Placar (`:214`) | — |
| `D.conj2.reacoes[1]` | `dado` e `texto` (`:196`); `valor` só não vazio e começando com dígito (`:198-199`) | `valor` exato (Minor, F3 residual) |
| `reacoes` depois de remover e recapturar | só `.map((x) => x.dado)` (`:265`) | `valor` e `texto` da linha nova (Minor, F3 residual) |
| Resumo da Missão 1 | lê o mesmo `reacoes` (`plataforma/public/legacy/novos.js:205`); `:203-204` conferem a 1ª reação no `#/resumo` | a 2ª reação no Resumo (Minor, F3 residual) |
| `D.conj2.prefExtra` | `:107-108` por valor | — |
| `D.relacoes[sq].status` | `m1-conjuntura.spec.ts:335-336` por valor | — |

### Asserções rasas e testes sem âncora

- `plataforma/e2e/m1-conjuntura-partido.spec.ts:198-199`: `toBeTruthy()` e `/^\d/` aceitam qualquer valor que comece com dígito (sonda E16). Não bloqueia: o caminho do `valor` capturado (`data-dado-valor`) é conferido por valor para o 1º dado (`:214`) e, para o mesmo mecanismo, em `:159` e `:165`.
- `plataforma/tests/selecaoDados.test.ts:34-35`: `mensagem(e) === ''` vale porque a fase virou `concluida`, não porque o aviso foi limpo. Não é critério da spec; segue como observação.
- `plataforma/e2e/m1-oportunidades.spec.ts:193-197`: fundo e peso conferidos só no 1º selo. O contraste (`:207`) agora cobre todos os selos exibidos.
- Testes sem âncora: nenhum. Os testes fora dos critérios mapeiam para "Done when": T10 (`razaoContraste` com valores WCAG conhecidos), T15/T16 (`m1-conjuntura-partido.spec.ts:146`) e T18 (banner fora do botão lateral e do menu em 390px, `:283` e `:298`).

---

## Discrimination Sensor

**Como rodou na iteração 2**: `git worktree add --detach` de `HEAD` (`f8b4bc1`) em `C:\Users\brand\AppData\Local\Temp\claude\57a04a93ef010ab3\cc3f1601-5bd2-491e-83c5-9b086656eab8\scratchpad\verif2-wt`, fora do worktree real, com `npm ci` próprio. Os e2e rodaram com um `playwright.isolado.config.ts` criado só no worktree temporário (porta 3200, `reuseExistingServer: false`, 1 worker). Cada mutação foi uma troca exata de uma ocorrência (conferida antes de gravar) e foi desfeita com `git checkout -- <arquivo>` no worktree temporário antes da seguinte. Antes das mutações, a describe "reação a 2 dados" (9 testes) e o teste OP-02/OP-03 passaram em `HEAD`: 10 de 10.

**Por que os 20 mutantes antigos continuam mortos sem nova rodada**: `fa6fede..f8b4bc1` tem 13 inserções e 0 remoções, só nos dois specs e2e. O código mutado é idêntico byte a byte, e toda asserção que matou um mutante na iteração 1 continua no arquivo (testes só ficaram mais estritos). Os resultados da iteração 1 seguem válidos; as linhas de morte citadas abaixo estão na numeração de `f8b4bc1`.

| # | Arquivo:linha | Mutação | Testes | Morreu? |
| --- | --- | --- | --- | --- |
| M1 | `plataforma/lib/cargoEleito.ts:6` | `fem = e.g === 'F'` → `fem = false` | `tests/cargoEleito.test.ts` | ✅ Morto (it. 1, 2 falhas) |
| M2 | `plataforma/lib/agendas.ts:71` | `textoSobre` escolhe a cor de **menor** contraste | `tests/indicadoresSociais.test.ts` | ✅ Morto (it. 1, 2) |
| M3 | `plataforma/lib/selecaoDados.ts:40` | `if (ja)` → `if (false && ja)` | `tests/selecaoDados.test.ts` | ✅ Morto (it. 1, 2) |
| M4 | `plataforma/lib/selecaoDados.ts:48` | `remover` limpa as duas linhas | `tests/selecaoDados.test.ts` | ✅ Morto (it. 1, 2) |
| M5 | `plataforma/lib/indicadoresSociais.ts:44-45` | `limpo` vira `String(v).trim()` | `tests/indicadoresSociais.test.ts` | ✅ Morto (it. 1, 2) |
| M6 | `plataforma/lib/selecaoDados.ts:45` | `cancelar` conclui com o dado pela metade | `tests/selecaoDados.test.ts` | ✅ Morto (it. 1, 1) |
| M7 | `plataforma/lib/selecaoDados.ts:42` | conclui com 1 clique | `tests/selecaoDados.test.ts` | ✅ Morto (it. 1, 3) |
| M8 | `plataforma/lib/cargoEleito.ts:9` | Federal no DF vira "Distrital" | `tests/cargoEleito.test.ts` | ✅ Morto (it. 1, 1) |
| E1 | `plataforma/public/legacy/ilhas.css:25` | `.abas{overflow-y:auto}` | `m1-conjuntura` "não rolam na vertical" | ✅ Morto (it. 1) |
| E2 | `plataforma/ilhas/Assentos.tsx:173,309` | `cargoEleito` recebe `g: undefined` | `m1-conjuntura` PAR-01 | ✅ Morto (it. 1; `m1-conjuntura.spec.ts:289`, `:304`) |
| E3 | `plataforma/ilhas/CartoesMunicipio.tsx:61` | editar uma prefeitura recria `c.prefExtra = {}` | `m1-conjuntura-partido` CJ-02 | ✅ Morto (it. 1; `:108`) |
| E4 | `plataforma/ilhas/Reacoes.tsx:39` | Esc não cancela | `m1-conjuntura-partido` "Cancelar e Esc" | ✅ Morto (it. 1) |
| E5 | `plataforma/ilhas/Reacoes.tsx:76` | remover um chip apaga as duas reações | `m1-conjuntura-partido` "remover um chip" | ✅ Morto (it. 1) |
| E6 | `plataforma/ilhas/Reacoes.tsx:70` | sem `scrollIntoView` ao concluir | `m1-conjuntura-partido` describe "reação a 2 dados" (9 testes) | ✅ **Morto na it. 2** (`m1-conjuntura-partido.spec.ts:187`, `viewport ratio 0`; 1 falhou, 8 passaram). Sobreviveu na it. 1 |
| E7 | `plataforma/ilhas/AgendasSociais.tsx:108` | o selo perde `--ft` (texto cai no `#fff`) | `m1-oportunidades.spec.ts` inteiro (16 testes) | ✅ **Morto na it. 2** (`m1-oportunidades.spec.ts:207`, recebido 2,525; 1 falhou, 15 passaram). Sobreviveu na it. 1 |
| E8 | `plataforma/public/legacy/ilhas.css:1120` | `max-height:none` no cartão de agenda | `m1-oportunidades` OP-01 | ✅ Morto (it. 1) |
| E9 | `plataforma/ilhas/Reacoes.tsx:36` | sem `preventDefault/stopPropagation` | `m1-conjuntura-partido` "botão dentro do dado" | ✅ Morto (it. 1) |
| E10 | `plataforma/public/legacy/ilhas.css:399` | sem o `padding-left` com o menu recolhido | `m1-conjuntura` PAR-03 | ✅ Morto (it. 1) |
| E11 | `plataforma/ilhas/AgendasSociais.tsx:59` | tooltip monta o texto direto (`Sentido: undefined`) | `m1-oportunidades` OP-04 | ✅ Morto (it. 1) |
| E12 | `plataforma/ilhas/Conjuntura.tsx:308` | volta "Prefeitura · a definir" no Placar | `m1-conjuntura-partido` "sem mapa nem painel" | ✅ Morto (it. 1; `:39`) |
| E13 | `plataforma/public/legacy/ilhas.css:1155` | destaque dos capturáveis sempre ativo | `m1-conjuntura-partido` "destaque" | ✅ Morto (it. 1) |
| E14 | `plataforma/ilhas/Classificados.tsx:50` | os 5 `StatusBotoes` voltam ao cartão | `m1-conjuntura` PAR-02 | ✅ Morto (it. 1) |

**Sondas informativas da iteração 2 (fora da contagem, para caracterizar F3)**:
- **E15** (`plataforma/ilhas/Reacoes.tsx:66`: a 2ª linha recebe o `valor` do 1º dado). Descartada por ser equivalente: `atuais` (`Reacoes.tsx:24`) relê o dado da lista pelo id, e o `fill` da 2ª linha (`m1-conjuntura-partido.spec.ts:191`) regrava o `valor` correto. O estado final fica certo, então a sonda não mede a asserção.
- **E16** (`plataforma/lib/dadosPartido.ts:46`: na linha 1, `valor: dado.valor.split(' ')[0]`, só o 1º número). **Sobreviveu** ao teste de `m1-conjuntura-partido.spec.ts:170` e aos 10 testes de `plataforma/tests/dadosPartido.test.ts`, porque a fixture `d2` (`:47`) tem `valor: 'Oposição'`, de uma palavra só. `lib/dadosPartido.ts` e o teste dele **não fazem parte do diff da feature** (`git diff 8a987b7..f8b4bc1` não os toca), então E16 fica fora do sensor e não bloqueia. Fica registrada como F3 residual (Minor).

**Sensor depth**: ampliado (≥ 5 por pedido do orquestrador; 22 mutantes cobrindo lib, ilhas e CSS).
**Resultado do sensor**: 22 de 22 mortos em `f8b4bc1` (24 injeções: 22 na it. 1 e E6/E7 de novo na it. 2), 0 sobreviventes no código da feature.
**Isolamento**: baseline do worktree real antes do sensor = `?? .specs/features/sugestoes-pedro-1111/validation.md`. Depois de `git worktree remove --force` e `git worktree prune`, o `git status --porcelain` ficou idêntico (conferido com `diff`), HEAD real segue `f8b4bc1`, `git stash list` vazio (nenhum `git stash` usado) e nenhum servidor ficou de pé nas portas 3000 e 3200.

---

## Edge Cases (spec.md)

- [ ] Posse ausente: o contador não aparece. ⏸ Pendente por decisão (CFG-01/T19), fora do veredito.
- [x] Parlamentar sem gênero → masculino: `plataforma/tests/cargoEleito.test.ts:26-29`.
- [x] Indicador sem fonte ou ano → tooltip só com o que existe: `plataforma/tests/indicadoresSociais.test.ts:115-117`, `:132`, `:134`.
- [x] Botão ou link dentro de um capturável durante a captura → conta como captura e não age: `plataforma/e2e/m1-conjuntura-partido.spec.ts:324` `toContainText('2º')` e `:325` contador do botão `toBe(0)` (E9 morto).

---

## Code Quality

| Princípio | Status |
| --- | --- |
| Código mínimo | ✅ |
| Mudanças cirúrgicas (sem tocar `conteudo.js`, `app.js`, `legacy.css`) | ✅ |
| Sem escopo extra | ✅ (`f8b4bc1` só acrescenta asserções) |
| Segue os padrões do projeto (`plataforma/CLAUDE.md`) | ✅ |
| Spec-anchored (valor asserido = valor da spec) | ✅ (SEL-01.2 e OP-02 fechados) |
| Cobertura por camada (`lib` 1:1 com critérios; e2e com caminho feliz, borda e erro) | ✅ |
| Todo teste mapeia para critério, borda ou "Done when" | ✅ |
| Diretrizes documentadas: `plataforma/CLAUDE.md`, matriz de testes de `tasks.md` | ✅ |

Notas sobre as asserções novas (sem bloqueio):
- `m1-oportunidades.spec.ts:201` lê só R, G e B e ignora o alfa. Hoje está certo, porque o fundo do selo é `var(--f)` opaco (`ilhas.css:1131`); se o selo ganhar fundo translúcido, a conta passa a superestimar o contraste.
- `:207` mede os selos exibidos no slide aberto, e quais faixas aparecem depende dos dados da UF. As 5 faixas estão cobertas na regra (`indicadoresSociais.test.ts:90`), e a ligação na tela, pela asserção nova.

Observações da iteração 1 que seguem valendo (sem bloqueio): `ilhas.css:399` `padding-left:max(2.5rem,3.5rem)` é constante; `AgendasSociais.tsx:106` tem IIFE no JSX e o `<label>` de `:89-94` ficou sem reindentar; `Conjuntura.tsx` usa `!` em `dadoPorId`, que é seguro pelos ids fixos de `plataforma/lib/dadosPartido.ts:22-26`.

---

## Gate Check

- **Gate commands** (worktree real, sem alterar nada): `cd plataforma && npx tsc --noEmit && npm test` e `npx playwright test e2e/m1-`. O Playwright subiu o próprio `npm run dev` na porta 3000, que estava livre, e o desligou no fim.
- **tsc**: exit 0.
- **npm test**: 1459 passaram, 0 falharam, 0 pulados, 0 cancelados (55 s).
- **e2e `m1-`**: 88 passaram, 0 falharam, 0 pulados; exit 0 (3,1 min, 4 workers).
- **Contagem antes da feature**: unit 1441 → 1459 (+18); e2e 70 → 88 (+18 líquido, como na iteração 1). `f8b4bc1` não cria teste: acrescenta 5 asserções a 2 testes existentes e não remove nenhuma.
- **Build** (`npm run build`): não rodado. O pedido foi tsc, unit e e2e, e o `plataforma/CLAUDE.md` registra que o build oscila com `SecurityFatalError` do Next 16.4.

---

## Fix Plans

Nenhuma correção bloqueia T1 a T18. O que sobra é opcional:

### F3 residual: `valor` da 2ª reação por valor (Minor, opcional)

- **Causa**: `m1-conjuntura-partido.spec.ts:198-199` confere só formato; E16 sobrevive. Na `lib`, a fixture `d2` de `plataforma/tests/dadosPartido.test.ts:47` tem valor sem espaço.
- **Sugestão**: em `:199`, `expect(r[1].valor).toBe(await capturavel(page, 'parlamentares').getAttribute('data-dado-valor'))` ou, no mínimo, `toMatch(/no estado, .* no Brasil/)`. No teste de `:248`, comparar `dado`, `valor` e `texto` depois de recapturar. No Resumo, conferir também a 2ª reação.
- **Prioridade**: Minor.

---

## Pendente por decisão (fora do veredito)

| Item | Situação | Quem decide |
| --- | --- | --- |
| CFG-01 / T19 (contador "dia de 100") | Pausada: a leitura do #141 ("a contagem aqui está errada") não foi confirmada. O edge case "posse ausente" vai junto | Pedro |
| PAR-04 (#139 item 1, caixa cortada no rodapé) | Não reproduzido em 1280, 1500 e 390px; voltou ao Pedro | Pedro |
| F4 / P1 | Os critérios da spec não trazem o ID (CJ-01 etc.); o mapa depende do campo Requirement das tasks | Autor da spec |
| F4 / P2 (PAR-02) | Entra a ficha de detalhe (`plataforma/ilhas/Assentos.tsx:318`, ainda com os 5 `StatusBotoes` e sem "Remover classificação")? O `select` nativo mostra o valor atual além de `.cartao-class-cat`: conta como "uma única vez"? | Pedro |
| F4 / P3 (PAR-03) | Qual é a "caixa de texto do cabeçalho"? O teste usa a 1ª aba e só o menu recolhido | Pedro |
| F4 / P4 (UI-01) | "Qualquer `.abas`": a regra é global (`ilhas.css:25`), mas só a Conjuntura é medida; a de `plataforma/ilhas/Social.tsx:179` não tem asserção | Pedro (ou teste opcional) |
| F4 / P5 (SEL-01.2) | "Suavemente" não tem medida; o teste exige o mínimo verificável, o formulário na tela (`:187`) | Pedro |
| Consequência da premissa #136 (não confirmada) | Com a esfera `pref` fora de `esferas`, a prefeitura do **domicílio** só é classificável quando o município está entre os 5 cartões (`plataforma/ilhas/CartoesMunicipio.tsx:57-61` grava em `posicao.pref`). Fora dos 5, não há onde classificá-la; o valor antigo continua gravado | Pedro |
| Perguntas abertas da spec | #141, #139 item 1, #139 item 4 (sem descrição), #138.4 (textos de conceito dos indicadores) | Pedro |

---

## Requirement Traceability Update

Sugestão para `spec.md`. O Verifier não edita a spec; o orquestrador aplica.

| Requirement | Status anterior | Status novo |
| --- | --- | --- |
| CJ-01 | Pending | ✅ Verified |
| CJ-02 | Pending | ✅ Verified |
| CJ-03 | Pending | ✅ Verified |
| UI-01 | Pending | ✅ Verified (⚠️ P4) |
| PAR-01 | Pending | ✅ Verified |
| PAR-02 | Pending | ✅ Verified (⚠️ P2, confirmar escopo) |
| PAR-03 | Pending | ✅ Verified (⚠️ P3) |
| PAR-04 | Pending | ⏸ Pendente por decisão |
| OP-01 | Pending | ✅ Verified |
| OP-02 | Pending (it. 1: needs test fix) | ✅ Verified |
| OP-03 | Pending | ✅ Verified |
| OP-04 | Pending | ✅ Verified |
| SEL-01 | Pending (it. 1: needs test fix) | ✅ Verified (⚠️ P5) |
| CFG-01 | Pending | ⏸ Pendente por decisão |

---

## Summary

**Overall**: ✅ Ready **para T1 a T18**. T19/CFG-01 e PAR-04 seguem pendentes por decisão e não estão cobertos por este veredito.

**Spec-anchored check**: 16 de 16 critérios entregues com o valor da spec; 5 lacunas de precisão ⚠️ (perguntas ao Pedro).
**Sensor**: 22 de 22 mutantes mortos (E6 e E7 mortos na iteração 2, pelas asserções novas); 0 sobreviventes no código da feature. A sonda E16, fora do diff, sobrevive (F3 residual, Minor).
**Gate**: tsc 0 erros; unit 1459/1459; e2e `m1-` 88/88.

**O que funciona**: texto da 2.1 (CJ-01); abas sem rolagem vertical (UI-01); cargo por gênero (PAR-01); cartão com `select` e remover (PAR-02); botão fora do cabeçalho com o menu recolhido (PAR-03); 5 cartões no tópico, `prefExtra` preservado, Placar sem "Prefeitura" (CJ-02, CJ-03); cartões de agenda com altura máxima, faixa colorida, selos com contraste ≥ 4,5:1 medido na tela e tooltip (OP-01 a OP-04); captura com banner, rolagem de volta ao formulário, Cancelar/Esc, repetido, remover chip e gravação no formato de antes, lida pelo Resumo (SEL-01).

**Próximo passo**: o orquestrador aplica a rastreabilidade na spec e leva as pendências por decisão ao Pedro. F3 residual é opcional. O veredito continua valendo só para T1 a T18; T19 e PAR-04 precisam de nova verificação quando forem decididos.
