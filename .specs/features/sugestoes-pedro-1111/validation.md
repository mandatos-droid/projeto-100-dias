# Sugestões do Pedro (11/11/2026): relatório do Verifier

## Validation (iteração 3): sugestoes-pedro-1111, T1 a T22 — FAIL ❌ (Verifier, HEAD eb8ea09)

**Data**: 2026-11-11
**Spec**: `.specs/features/sugestoes-pedro-1111/spec.md`
**Diff range**: `8a987b7..eb8ea09` (branch `feat/sugestoes-pedro-1111`; o código parte de `origin/main` `8f40943`, que é o merge-base). A iteração 2 aprovou `8a987b7..f8b4bc1` (T1 a T18). Esta iteração verifica o que entrou em `f8b4bc1..eb8ea09`: docs `5f091c2` e `137c500`; código `ec616b0` (T20, PAR-05), `705fe1c` (T21, PAR-06), `1dd69b3` (T19, CFG-01) e `eb8ea09` (T22, CFG-01). Nesse trecho o código e os testes só ganham linhas, com uma exceção: `plataforma/ilhas/Assentos.tsx` perde 2 (+19 −2). Nenhum teste é removido, e os 8 arquivos de `plataforma/` somam 297 inserções e 2 remoções. Durante a verificação, o HEAD real avançou para `498f5cb` (15:23), um commit só de docs (`spec.md` e `tasks.md`, que acrescentam T23/TERM-01). O código verificado é idêntico ao de `eb8ea09`, e T23 fica fora desta iteração.
**Verifier**: sub-agente independente (autor ≠ verificador), iteração 3 de no máximo 3. Não alterei nenhum código nem teste do worktree real. Este arquivo é a única mudança e não foi commitado.

**Veredito**: FAIL, por uma lacuna só (G1, abaixo), pequena e bem delimitada. PAR-05 e PAR-06 passam com evidência e com todos os mutantes mortos. CFG-01 passa em quase tudo: a regra e o espelho estão provados ramo a ramo, e os três lugares estão ligados. Falta o resumo baixado com posse futura, que não mostra contador nenhum. A spec pede esse caso ("Abrir o Guia com a posse há 283, 30 e **-5** dias e conferir o contador **nos três lugares**"), e nenhum teste o cobre. Como esta é a última iteração, a decisão vai ao usuário. Há dois caminhos: corrigir 1 linha em `novos.js` e acrescentar 1 asserção, ou o dono registrar na spec que o resumo baixado continua sem contador antes da posse. No segundo caso, esta verificação passa a PASS sem mudar código.

**Spec-anchored check**: 18 dos 19 critérios entregues têm evidência `arquivo:linha` com o valor da spec. São os 16 da iteração 2, mais PAR-05 e PAR-06, mais CFG-01 em 7 dos seus 8 ramos e lugares. O ramo que falta é posse futura no resumo baixado (G1). Seguem 5 lacunas de precisão da spec da iteração 2 (P1 a P5) e entra uma nova (P6, dia 100).
**Gate**: `tsc` exit 0; `npm test` 1467/1467; e2e `m1-` + `guia-acesso` (129 testes): **129/129 com 2 workers** e **129/129 com os 4 workers padrão** com a máquina folgada. Antes disso, duas rodadas com 4 workers e a máquina saturada (CPU 100%, 0,7 a 1,4 GB livres) tiveram 6 e 31 falhas. Foram 32 por tempo esgotado de 30s e 5 por asserções que pegaram a página ainda carregando. Esses testes passam isolados e com a máquina folgada. É instabilidade de carga, não da feature (seção Gate). Nenhuma falha de asserção ficou sem explicação.
**Sensor**: 20 mutantes novos (9 unit, 11 e2e), todos mortos. No acumulado das três iterações são 42 mutantes e 42 mortos. Uma sonda informativa (L5, quebra de linha da barra lateral, fora da spec) sobreviveu e fica fora da contagem.

---

## Gaps ranqueados

| # | Gap | Critério | Evidência | Severidade |
| --- | --- | --- | --- | --- |
| **G1** | O resumo baixado com **posse futura** não mostra "faltam N dias para a posse". O override `plataforma/public/legacy/novos.js:596` (`return c&&d>0?h.replace(...):h`) só troca o texto quando `d>0`, e o original (`resumo.js:118`, `(d&&d>0?' · dia '+d+' de 100':'')`) não escreve nada antes da posse. Sonda no worktree temporário, com relógio fixo: posse daqui a 5 dias dá `cab` = `"… · SP · posse em 15/11/2026"`, sem contador; daqui a 1 dia, `"… · posse em 11/11/2026"`, também sem contador. A implementação também não é coerente consigo mesma: o cabeçalho móvel, que antes da posse também ficava vazio (`app.js:95`), passou a mostrar o contador, e o resumo baixado não | CFG-01 (P1, crit. 4: "(barra lateral, cabeçalho móvel e resumo baixado) … com posse futura, 'faltam N dias para a posse'"); Independent Test ("-5 dias … nos três lugares") | `plataforma/e2e/m1-contador.spec.ts:37-41` confere só a barra lateral (`:39`) e o cabeçalho móvel (`:40`); **não há asserção para o resumo baixado com posse futura** | Minor no impacto, mas é desvio da spec sem evidência e bloqueia o PASS |
| G2 | "Posse ausente: nada quebra" não tem e2e | Edge case da spec | Unit: `plataforma/tests/contador-dias.test.ts:9` `assert.equal(contadorDias(null), null)` e paridade em `plataforma/tests/contador-dias-legado.test.ts:20` (caso `null`). A sonda mostra a barra lateral com `"— informe a data de posse"` (o marcador original), o cabeçalho móvel vazio, o resumo sem contador e 0 `pageerror`. O comportamento está certo, mas sem teste no repositório | Minor |
| G3 | Os 2 testes de layout do contador passam também sem a mudança | T22 Done-when ("a barra lateral não quebra com o texto mais longo") | `plataforma/e2e/m1-contador.spec.ts:55-69`. Com L4 (barra lateral sem o override) os dois passam, porque medem o texto curto original. Com L5 (sem a quebra `<br>`) os 7 testes passam. Os testes usam "faltam 5 dias para a posse", não o texto mais longo possível ("faltam 999 dias para a posse") | Minor: servem de guarda contra regressão, não discriminam a regra (ver avaliação abaixo) |
| G4 | PAR-05: duas asserções de texto frouxas, troca seguinte sem conferir o que foi gravado, contagens sem asserção | PAR-05 e T20 Done-when ("as contagens acompanham") | `plataforma/e2e/m1-conjuntura.spec.ts:384` `toHaveText(/Oponente/)` aceita "Oponente e concorrente"; `:388` `/Aliado/` aceita "Aliado, mas concorrente"; depois de `:387` (`selectOption('aliado')`) nada confere `status: 'aliado'` gravado; nenhuma asserção nos chips de contagem depois de trocar pela ficha. A gravação da 1ª troca está presa por valor em `:386` | Minor |
| G5 | PAR-06: "Anterior" não é exercitado | PAR-06 ("mantendo Anterior/Próximo") | `:424-425` cobrem só "Próximo"; nenhum teste do carrossel clica em "Anterior". O `Anterior` de `m1-conjuntura.spec.ts:91-96` é o da paginação da tabela | Minor (a mudança é só CSS e não toca os botões) |

---

## Tarefas

| Task | Status | Notas |
| ---- | ------ | ----- |
| T1 a T18 | ✅ Done | Aprovadas na iteração 2. Nada nos arquivos delas mudou em `f8b4bc1..eb8ea09`, fora as linhas acrescentadas no fim de `m1-conjuntura.spec.ts` e o trecho da ficha em `Assentos.tsx:7,318-335`. As citações da iteração 2 seguem nas mesmas linhas |
| T6 (PAR-04) | ✅ Done (fechada) | Recorte de captura, sem defeito, confirmado pelo dono. O worker mediu margem inferior de 87 a 125px (`tasks.md:244`). Não pesa no veredito |
| T19 | ✅ Done | `plataforma/lib/contadorDias.ts:21-27`; testes `plataforma/tests/contador-dias.test.ts` (6) |
| T20 | ✅ Done | `plataforma/ilhas/Assentos.tsx:318-335`; e2e `plataforma/e2e/m1-conjuntura.spec.ts:365-393` |
| T21 | ✅ Done | `plataforma/public/legacy/ilhas.css:1163`; e2e `plataforma/e2e/m1-conjuntura.spec.ts:395-431` |
| T22 | ⚠️ Partial | `plataforma/public/legacy/novos.js:560-599`. Barra lateral e cabeçalho móvel certos em todos os ramos; resumo baixado sem contador com posse futura (G1) |

---

## Spec-Anchored Acceptance Criteria (novos nesta iteração)

### PAR-05: ficha de detalhe com relação única (P1 Parlamentares, crit. 6)

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| Ficha exibida → relação atual uma única vez | um rótulo da categoria | `plataforma/e2e/m1-conjuntura.spec.ts:383` `expect(ficha.locator('.cartao-class-cat')).toHaveCount(1)`; `:384` `toHaveText(/Oponente/)` (frouxa, G4) | ✅ PASS (⚠️ P2: o `select` também mostra o valor atual) |
| … controle compacto com as 5 categorias para trocar | `select` com as 5, na ordem; grava em `D.relacoes[sq].status` | `:381` `getByRole('combobox', { name: /Trocar a relação de/ })`; `:385` `expect(troca.locator('option')).toHaveText(['Aliado', 'Aliado, mas concorrente', 'Oponente', 'Oponente e concorrente', 'Indefinida'])`; `:386` statuses gravados `toEqual(['concorrente'])` | ✅ PASS |
| … e "Remover classificação" | remove a relação gravada | `:389` clica; `:390` `.cartao-class-cat` `toHaveCount(0)`; `:391` `Object.keys(relacoes).length` `toBe(0)`; `:380`: sem classificação, o botão não aparece (`toHaveCount(0)`) | ✅ PASS |
| … sem os 5 botões de relação | nenhum `.st` nem botão de categoria na ficha | `:377` `expect(ficha.locator('.st')).toHaveCount(0)`; `:378` `getByRole('button', { name: /^(Aliado\|Oponente\|Indefinida)/ })` `toHaveCount(0)` | ✅ PASS |
| A linha da tabela mantém os 5 botões (premissa da spec) | 5 botões na linha | `:374` `expect(linha.first().locator('.st button')).toHaveCount(5)` | ✅ PASS |

### PAR-06: carrossel de classificados com largura fluida (P1 Parlamentares, crit. 7)

| Critério | Resultado definido na spec | `arquivo:linha` + asserção | Resultado |
| --- | --- | --- | --- |
| 390 a 1600px → divide a largura, sem espaço vazio à direita | borda direita do último cartão = borda da lista; larguras iguais; 3 colunas em tela larga | `plataforma/e2e/m1-conjuntura.spec.ts:415` `expect(Math.abs(direita - l.dir)).toBeLessThanOrEqual(2)`; `:419` diferença de larguras `≤ 2`; `:421` 3 posições x distintas (≥1280px), em 1600, 1280 e 390px (`:396`) | ✅ PASS |
| … sem cortar o conteúdo | nada passa da lista nem da página | `:416` `min(x) ≥ l.x - 1`; `:422` `scrollWidth <= clientWidth` | ✅ PASS (⚠️ o corte *dentro* do cartão não é medido) |
| … slide com menos cartões mantém a largura (Done-when T21) | cartão único com a mesma largura | `:427` `expect(Math.abs(ultimo.w - largs[0])).toBeLessThanOrEqual(2)` | ✅ PASS |
| … mantém Anterior/Próximo e as contagens | navegação e contagem seguem | `:424-425` Próximo → `Slide 2 de 2`; `:428` `Todas` `toContainText('4')`; Anterior sem asserção (G5) | ✅ PASS (G5 Minor) |
| "Qualquer largura de 390 a 1600px" | — | O teste mede 3 pontos. A sonda do Verifier (o mesmo corpo de teste em 1440, 1024, 900, 768, 600 e 480px, no worktree temporário) passou nos 6 | ✅ (sonda; fora do repositório) |

### CFG-01: contador de dias (P1 Corrigir, crit. 4)

Regra: `plataforma/lib/contadorDias.ts:21-27`. Espelho: `plataforma/public/legacy/novos.js:560-578`. Ligação: `:580-599`. `d` = `diaAtual()` (`nucleo.js:226`, dia 1 = dia da posse). No e2e, `abre(page, k)` põe a posse a `k` dias atrás, então `d = k + 1`.

| Ramo | Resultado definido na spec | Regra (`lib`) | Espelho (vm) | Barra lateral (e2e) | Cabeçalho móvel (e2e) | Resumo baixado (e2e) | Resultado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Posse futura, N > 1 | "faltam N dias para a posse" | `tests/contador-dias.test.ts:13` `texto(-4)` = `'faltam 5 dias para a posse'`; `:15` (-29) | `tests/contador-dias-legado.test.ts:21` `deepEqual` em -29, -4, -1 | `e2e/m1-contador.spec.ts:39` `toContainText('faltam 5 dias para a posse')` | `:40` `toHaveText('faltam 5 dias para a posse')` | **nenhuma; a tela não mostra** (G1) | ❌ GAP (resumo baixado) |
| Posse futura, 1 dia | "falta 1 dia para a posse" | `:14` `texto(0)` = `'falta 1 dia para a posse'` | `:21` (d=0) | — (sonda: `"FALTA 1 DIA PARA A POSSE"`) | — (sonda: `"falta 1 dia para a posse"`) | **não mostra** (G1) | ✅ regra; ❌ resumo (G1) |
| Dia 1 | "faltam 99 dias" | `:19` | `:21` (d=1) | — (sonda ✅) | — (sonda ✅) | — (sonda: `"· faltam 99 dias"`) | ✅ PASS (regra + paridade) |
| Dia 30 | "faltam 70 dias" | `:20` | `:21` (d=30) | `m1-contador.spec.ts:32` `toContainText('faltam 70 dias')` | `:33` `toHaveText('faltam 70 dias')` | `:34` `toContain(' · faltam 70 dias')` | ✅ PASS |
| Dia 99 | "falta 1 dia" | `:21` | `:21` (d=99) | `:45` `toContainText('falta 1 dia')`; `:46` `not.toContainText('faltam')` | — (sonda ✅) | — (sonda ✅) | ✅ PASS |
| Dia 100 | "último dia dos 100" | `:25`; `:26` `num` `null` | `:21` (d=100) | `:51` `toContainText('último dia dos 100')` | `:52` `toHaveText('último dia dos 100')` | — (sonda: `"· último dia dos 100"`) | ✅ PASS (⚠️ P6: texto não confirmado pelo Pedro) |
| Dia 101 | "100 dias concluídos" | `:30` | `:21` (d=101) | — (sonda ✅) | — (sonda ✅) | — (sonda ✅) | ✅ PASS (regra + paridade) |
| Dia 283 | "100 dias concluídos" e nenhum número acima de 100 | `:31`; `:32` `doesNotMatch(/283/)` | `:21` (283, 999) | `:22` `toContainText('100 dias concluídos')`; `:23` `not.toContainText('283')` | `:24` `toHaveText('100 dias concluídos')` | `:26` `toContain('100 dias concluídos')`; `:27` `not.toMatch(/dia \d+ de 100/)` | ✅ PASS |
| Sem posse | sem contador | `:9` `contadorDias(null)` = `null` | `:21` (null) | — (sonda: marcador original `"— informe a data de posse"`) | — (sonda: vazio) | — (sonda: sem contador) | ✅ regra; ⚠️ sem e2e (G2) |
| Saídas limpas | sem "undefined"/"null"; o texto é a junção das partes | `:36-40` | — | — | — | — | ✅ PASS |

A tabela fecha assim: os valores da regra batem com a spec em todos os ramos. Isso está provado na `lib` e, por `deepEqual`, no espelho de `novos.js`, em 14 casos. Os três lugares estão ligados por e2e, cada um com pelo menos dois ramos (barra lateral: 5; cabeçalho móvel: 4; resumo baixado: 2). Como a ligação é a mesma função para todos os ramos (`novos.js:585-590`, `:595-596`), a paridade mais a ligação bastam para os ramos sem e2e, e a sonda confirmou na tela os ramos -1, 0, 98, 99, 100 e 282. O ramo que não fecha é posse futura no resumo baixado (G1), porque ali a ligação deixa a regra de fora de propósito (`d>0`).

### Asserções rasas e testes que passam sem a mudança (avaliação pedida)

- **`plataforma/e2e/m1-contador.spec.ts:55-69` (1280 e 390px)**: passam sem o override (L4) e sem a quebra de linha (L5). Medem o que o Done-when pede, que o contador não transborde de `#lado` (`:65` `sobra ≤ 1`, `:66` `sobraDireita ≤ 0`, `:67` `altura < 120`). Com o texto curto original, nada transborda mesmo. **Avaliação: aceitável como guarda de regressão, raso como prova da T22.** Eles não usam o texto mais longo possível, e a altura de 120px é folgada. Não bloqueiam, porque nenhum critério da spec define o visual do contador. A sonda do Verifier mediu também o cabeçalho móvel em 390px com `"faltam 400 dias para a posse"`: cabe, `sobra 0` e a página sem rolagem horizontal.
- **`plataforma/e2e/m1-conjuntura.spec.ts:397` em 390px**: passa sem a regra nova (C1), porque em 390px o layout antigo já tinha 1 coluna. **Avaliação: aceitável, não é raso.** As asserções são geométricas e exatas (`:415`, `:416`, `:419`, `:422`, `:427`), e o teste mata C2 (colunas fixas de volta: `repeat(3,14rem)` transborda em 390px). Os testes de 1600 e 1280px são os que discriminam a mudança.
- PAR-05: `:384` e `:388` (regex frouxas) e a 2ª troca sem conferir o que foi gravado (G4).

---

## Discrimination Sensor (iteração 3)

**Como rodou**: `git worktree add --detach` de `HEAD` (`eb8ea09`) em `C:\Users\brand\AppData\Local\Temp\claude\57a04a93ef010ab3\cc3f1601-5bd2-491e-83c5-9b086656eab8\scratchpad\verif3-wt`, fora do worktree real, com `npm ci` próprio. Os unit rodaram com `node --test` nos 2 arquivos do contador. Os e2e rodaram com um `playwright.isolado.config.ts` criado só no worktree temporário: `next dev -p 3200` próprio, de pé durante as mutações, `retries: 0`, 2 workers. Cada mutação foi uma troca exata de uma única ocorrência (um script recusa se não houver exatamente 1) e foi desfeita com `git checkout -- <arquivo>` antes da seguinte. Antes das mutações, os 11 testes novos (7 de `m1-contador`, PAR-05 e os 3 de PAR-06) passaram 11/11. Depois de todas as mutações desfeitas, passaram 11/11 de novo, o que confirma que o servidor voltou ao código de HEAD. Nenhum `git stash` foi usado.

| # | Arquivo:linha | Mutação | Testes | Morreu? |
| --- | --- | --- | --- | --- |
| U1 | `plataforma/lib/contadorDias.ts:24` | `d < 100` → `d <= 100` (dia 100 vira "faltam 0 dias") | `contador-dias*.test.ts` | ✅ Morto (2: "dia 100", paridade) |
| U2 | `plataforma/lib/contadorDias.ts:26` | acima de 100 mostra `d` (o número bruto) | idem | ✅ Morto (2: "acima de 100", paridade) |
| U3 | `plataforma/lib/contadorDias.ts:19` | `faltam` sempre no plural | idem | ✅ Morto (3: posse futura, dias 1 a 99, paridade) |
| U4 | `plataforma/lib/contadorDias.ts:23` | posse futura sem "para a posse" | idem | ✅ Morto (2) |
| U5 | `plataforma/lib/contadorDias.ts:23` | `n = 1 - d` → `n = -d` (erro de um dia antes da posse) | idem | ✅ Morto (2) |
| U6 | `plataforma/lib/contadorDias.ts:22` | sem posse devolve um contador vazio em vez de `null` | idem | ✅ Morto (2) |
| LM1 | `plataforma/public/legacy/novos.js:574` | espelho diverge: `d<100` → `d<=100` | `contador-dias-legado.test.ts` | ✅ Morto (`d=100`) |
| LM2 | `plataforma/public/legacy/novos.js:571` | espelho diverge: `faltam` sempre no plural | idem | ✅ Morto (`d=0`) |
| LM3 | `plataforma/public/legacy/novos.js:568` | espelho diverge: `texto` mantém o `\n` | idem | ✅ Morto (`d=-29`) |
| L1 | `plataforma/public/legacy/novos.js:596` | `Baixar.pagina` sem override (`return h`) | `e2e/m1-contador.spec.ts` (7) | ✅ Morto (`:26`, `:34`; 2 falharam, 5 passaram) |
| L3 | `plataforma/public/legacy/novos.js:590` | cabeçalho móvel sem override | idem | ✅ Morto (`:24`, `:33`, `:40`, `:52`) |
| L4 | `plataforma/public/legacy/novos.js:587` | barra lateral sem override | idem | ✅ Morto (`:22`, `:32`, `:39`, `:45`, `:51`). Os 2 testes de layout passaram (G3) |
| A1 | `plataforma/ilhas/Assentos.tsx:318` | a ficha volta aos 5 `StatusBotoes` | `m1-conjuntura` PAR-05 | ✅ Morto (`:377`) |
| A2 | `plataforma/ilhas/Assentos.tsx:330` | sem "Remover classificação" | idem | ✅ Morto (`:389`) |
| A3 | `plataforma/ilhas/Assentos.tsx:330` | "Remover" reclassifica como Indefinida | idem | ✅ Morto (`:390`) |
| A4 | `plataforma/ilhas/Assentos.tsx:326` | o `select` não grava (`onChange={() => {}}`) | idem | ✅ Morto (`:383`) |
| A5 | `plataforma/ilhas/Assentos.tsx:324` | a relação aparece duas vezes | idem | ✅ Morto (`:383`) |
| C1 | `plataforma/public/legacy/ilhas.css:1163` | regra nova removida (volta a `auto-fill` com `14rem`) | `m1-conjuntura` PAR-06 (3) | ✅ Morto (`:415` em 1600 e 1280px; 390px passou) |
| C2 | `plataforma/public/legacy/ilhas.css:1163` | colunas fixas `repeat(3,14rem)` | idem | ✅ Morto (`:415` nas 3 larguras) |
| C3 | `plataforma/public/legacy/ilhas.css:1163` | `auto-fill` → `auto-fit` (o cartão sozinho estica) | idem | ✅ Morto (`:427` em 1600 e 1280px) |

**Sondas informativas (fora da contagem)**:
- **L5** (`novos.js:588`, a barra lateral sem `<br>`): **sobreviveu** aos 7 testes. A posição da quebra não está na spec; fica registrada em G3.
- **C1 sobre as larguras intermediárias**: com a regra removida, a sonda falha em 1440 e 900px e passa em 1024, 768, 600 e 480px, onde o layout antigo já enchia a lista por acaso. Com a regra, passa nas 6.
- **Comportamento nos três lugares** (relógio fixo em 11/11/2026 12h): ver a tabela de CFG-01. É a sonda que prova G1.

**Sensor depth**: ampliado (≥ 6 por pedido do orquestrador; 20 mutantes cobrindo `lib`, espelho, ligação, ilha e CSS).
**Resultado do sensor**: 20 de 20 mortos nesta iteração. No acumulado são **42 de 42** (22 das iterações 1 e 2, com o código daquelas tasks idêntico em `eb8ea09`, mais 20 agora), com 0 sobreviventes no código da feature.
**Isolamento**: o baseline do worktree real antes de qualquer trabalho era `git status --porcelain` vazio, HEAD `eb8ea09`. Ver o fechamento na seção Gate.

### Sensor acumulado das iterações 1 e 2 (resumo)

M1 a M8 (unit: `cargoEleito`, `agendas.textoSobre`, `selecaoDados`, `indicadoresSociais`) e E1 a E14 (e2e: abas, cargo por gênero, `prefExtra`, Esc, remover chip, rolagem ao formulário, contraste do selo, altura do cartão, `preventDefault`, botão do menu, tooltip, Placar, destaque, botões do cartão): 22 de 22 mortos, com o detalhe no `validation.md` de `031d5fb`. O código mutado ali não mudou em `f8b4bc1..eb8ea09`, e as asserções que mataram cada um continuam nas mesmas linhas. A sonda E16 (`lib/dadosPartido.ts`, fora do diff) segue como F3 residual (Minor).

---

## Gate Check

- **Comandos** (worktree real, sem alterar nada): `cd plataforma && npx tsc --noEmit && npm test` e `npx playwright test e2e/m1- e2e/guia-acesso`. O `playwright.config.ts` tem `retries: 0`, sem workers definidos (4 nesta máquina) e reaproveita a porta 3000, que estava livre em todas as rodadas.
- **tsc**: exit 0.
- **npm test**: 1467 passaram, 0 falharam, 0 pulados, 0 cancelados. São +8 sobre os 1459 da iteração 2: 6 em `contador-dias.test.ts` e 2 em `contador-dias-legado.test.ts`.
- **e2e `m1-` + `guia-acesso`**: 129 testes (99 `m1-` + 30 `guia-acesso`). Os `m1-` foram de 88 para 99: +1 PAR-05, +3 PAR-06, +7 `m1-contador`. Nenhum teste foi removido, e as contagens das T1 a T18 se mantêm: `m1-conjuntura-partido` 19, `m1-oportunidades` 16, `cargoEleito` 4, `selecaoDados` 7, `indicadoresSociais` 12, `legado-m1` 62, com o mesmo número de asserções que em `f8b4bc1`.

| Rodada | Workers | Resultado | Duração | Falhas |
| --- | --- | --- | --- | --- |
| 1 | 4 (padrão) | 123 passaram, **6 falharam** | 10,3 min | todas `Test timeout of 30000ms exceeded`: `m1-conjuntura.spec.ts:397` (390px), `m1-fechamento.spec.ts:32`, `m1-oportunidades.spec.ts:151` e `:177`, `m1-persona.spec.ts:12` e `:26` |
| 2 | 4 (padrão) | 98 passaram, **31 falharam** | 18,9 min | 26 por `Test timeout` e 5 por asserções que pegaram a página ainda carregando (`guia-acesso.spec.ts:256` string vazia, `:354` e `:431` URL antes do redirecionamento, `:374` elemento ausente, `m1-conjuntura.spec.ts:147` 0 linhas na tabela). Espalhadas por 8 dos 10 arquivos, inclusive `guia-acesso`, `m1-etapas` e `m1-frag`, que não têm nada desta feature |
| 3 | **2** | **129 passaram, 0 falharam** | 6,2 min | — |
| Isolado | 1, `--repeat-each=4` | `m1-fechamento.spec.ts:32`: 4/4 | 1,2 min | — (7 a 14s cada) |
| `origin/main` (`8f40943`, worktree temporário, porta 3200) | 4 | 100 passaram, 0 falharam | 2,5 min | — (máquina já folgada: 3,5 GB livres, CPU 25%) |
| 4 | 4 (padrão) | **129 passaram, 0 falharam** | 4,3 min | — (logo depois da rodada de `origin/main`, nas mesmas condições) |

**Diagnóstico da instabilidade**: o problema é a carga da máquina, não a feature. Nas rodadas 1 e 2 a máquina (8 núcleos lógicos) estava com CPU em 100% e só 0,7 a 1,4 GB de RAM livre, ocupada pelo Chrome do usuário, VS Code e Defender. 32 das 37 falhas são tempo esgotado de 30s em testes que levam de 2 a 14s fora de carga. As outras 5 são asserções que pegaram a página ainda carregando (string vazia, 0 linhas, URL antes do redirecionamento, elemento ausente), e nenhuma recebeu um valor errado já carregado. As 5 passaram nas rodadas 1, 3 e 4. Com a máquina folgada, os mesmos 4 workers passaram 129/129 em HEAD (rodada 4) e 100/100 em `origin/main`. Com 2 workers passaram 129/129 mesmo com carga.

**Taxa por teste** (3 rodadas de HEAD com 4 workers, mais 1 com 2 workers e 1 isolada):
- `m1-fechamento.spec.ts:32` (download do Mapa Político): é o mais frágil. Falhou em 2 das 3 rodadas com 4 workers (as duas sob carga) e passou na rodada com 2 workers, isolado 4/4 (7 a 14s) e em `origin/main`. O teste e o caminho dele são os mesmos de `origin/main`: o arquivo de teste não mudou, e o override de `Baixar.pagina` devolve o HTML sem alterar quando a posse é futura, como no `MANDATO_REAL` padrão. A falha acontece no `solto.goto(file://…)` de `:48`, quando o tempo acaba.
- `m1-persona.spec.ts:12` e `:26`, `m1-oportunidades.spec.ts:151` e `:177`, `m1-conjuntura.spec.ts:397` (390px): falharam só na rodada 1 (1 de 3).
- Rodada 2: 31 testes de 8 dos 10 arquivos, inclusive `guia-acesso`, `m1-etapas` e `m1-frag`, que a feature não toca. É um padrão de saturação, não de teste.
- **É pré-existente em `origin/main`?** Não consegui provar nem descartar. Quando rodei `origin/main`, a carga já tinha caído, e `origin/main` passou 100/100. Nas mesmas condições, HEAD também passou 129/129. As rodadas 1 e 2 somam 36 testes distintos com falha. Desses, 27 já existiam em `origin/main`: 26 com o mesmo título e `m1-etapas.spec.ts:10`, cujo título é montado em tempo de execução e cujo arquivo é igual. Os outros 9 são desta feature: `m1-conjuntura-partido.spec.ts:90`, `:170`, `:228` e `:309`; `m1-conjuntura.spec.ts:397`; `m1-contador.spec.ts:20` e `:49`; `m1-oportunidades.spec.ts:151` e `:177`. Os 9 passaram nas rodadas 3 e 4. Não encontrei sinal de regressão de desempenho: na rodada 4, 129 testes levaram 4,3 min, perto da proporção dos 100 de `origin/main` em 2,5 min.

**Sobre o relato do worker** ("2 specs listados antes de '121 passed' que passaram no retry"): com `retries: 0` não existe retry. No reporter `list`, o bloco listado antes de "N passed" é o de **falhas** ("N failed" com a lista dos testes). O mais provável é que, naquela rodada, `m1-fechamento` (download) e `m1-oportunidades` (slides) tenham **falhado** por tempo esgotado, como aqui nas rodadas 1 e 2. Os dois aparecem entre as falhas por tempo das rodadas com 4 workers e passam quando a máquina tem folga. A contagem de 121 também não fecha com o conjunto atual, que tem 129.

- **Build** (`npm run build`): não rodado. O pedido foi tsc, unit e e2e, e o `plataforma/CLAUDE.md` registra que o build oscila com `SecurityFatalError` do Next 16.4.

**Isolamento (fechamento)**: o worktree temporário foi para `8f40943` só para a comparação com `origin/main` (mesmo `package-lock.json` e mesmos testes de `m1-fechamento`, `m1-persona` e `guia-real`). Depois disso, `git worktree remove --force` e `git worktree prune`; a pasta `verif3-wt` não existe mais, e `git worktree list` não a mostra. O servidor da porta 3200 foi desligado, e as portas 3000 e 3200 estão livres. No worktree real, `git status --porcelain` = ` M .specs/features/sugestoes-pedro-1111/validation.md`: só este arquivo, que é a mudança autorizada. Sem ele, o estado é igual ao baseline vazio. `git stash list` está vazio. O HEAD real avançou de `eb8ea09` para `498f5cb` por um commit de docs feito por outra sessão às 15:23, que não toca código nem este arquivo.

---

## Code Quality

| Princípio | Status |
| --- | --- |
| Código mínimo | ✅ (regra de 27 linhas; override de 20 linhas; 1 regra CSS; a ficha reaproveita o padrão de `Classificados.tsx:49-56`) |
| Mudanças cirúrgicas (sem tocar `app.js`, `resumo.js`, `nucleo.js`, `conteudo.js`, `legacy.css`) | ✅ |
| Sem escopo extra | ✅ |
| Segue os padrões do projeto (regra em `lib/`, cópia marcada no legado com teste de paridade) | ✅ |
| Spec-anchored (valor asserido = valor da spec) | ❌ G1 (posse futura no resumo baixado sem asserção e sem comportamento) |
| Cobertura por camada (`lib` 1:1 com os ramos; e2e nos três lugares) | ⚠️ `lib` completa; e2e sem "sem posse" (G2) |
| Todo teste mapeia para critério, borda ou "Done when" | ✅ (os testes de layout mapeiam para o Done-when da T22) |
| Diretrizes documentadas: `plataforma/CLAUDE.md`, matriz de testes de `tasks.md` | ✅ |

Observações sem bloqueio:
- `novos.js:596` depende do texto exato `' · dia '+d+' de 100'` de `resumo.js:118`. Se o extrator mudar essa frase, o `replace` deixa de agir sem erro. Os e2e `:26`, `:27` e `:34` pegariam a falha.
- Fora do escopo da feature, mas visível ao lado do contador: `dBRc` (`plataforma/public/legacy/nucleo.js:44`, `new Date('AAAA-MM-DD')` lido como UTC) mostra no resumo baixado a data de posse **um dia antes** (posse 12/11 aparece "posse em 11/11/2026"). É anterior à feature e fica em arquivo extraído.

---

## Edge Cases (spec.md)

- [x] Posse ausente: o contador não aparece e nada quebra. Coberto pela regra (`tests/contador-dias.test.ts:9`) e pela paridade. Na tela, só a sonda confere: marcador original, 0 erros. Sem e2e (G2).
- [x] Parlamentar sem gênero → masculino: `plataforma/tests/cargoEleito.test.ts:26-29` (iteração 2).
- [x] Indicador sem fonte ou ano: `plataforma/tests/indicadoresSociais.test.ts:115-117`, `:132`, `:134` (iteração 2).
- [x] Botão dentro de um capturável: `plataforma/e2e/m1-conjuntura-partido.spec.ts:324-325` (iteração 2).

---

## Fix Plans

### Fix G1 (bloqueia o PASS): contador no resumo baixado com posse futura

- **Causa**: `plataforma/public/legacy/novos.js:596` só troca o texto quando `d>0`, e o original não escreve contador antes da posse.
- **Fix task** (implementer, não o Verifier): em `Baixar.pagina`, quando `c && d <= 0`, inserir `' · '+c.texto` logo depois de `' · posse em '+dBRc(m.data_posse)`. Por exemplo, trocar a primeira ocorrência de `'<br>Exportado em '` por `' · '+c.texto+'<br>Exportado em '`. Acrescentar em `plataforma/e2e/m1-contador.spec.ts:37-41` a asserção `expect(await resumoBaixado(page)).toContain(' · faltam 5 dias para a posse')`.
- **Alternativa sem código**: o dono registra na spec (critério 4 e Independent Test) que o resumo baixado mostra o contador só depois da posse. G1 então vira premissa e a verificação passa.
- **Prioridade**: Minor no impacto; bloqueia por ser um ramo do critério sem evidência.

### Opcionais (Minor)

- G2: um e2e com `data_posse` ausente conferindo barra lateral, cabeçalho móvel vazio, resumo sem contador e 0 `pageerror`.
- G3: nos testes de layout, usar o texto mais longo (por exemplo, posse daqui a 999 dias) e conferir o `<br>` (2 linhas no `<span>`).
- G4: trocar `:384` por `toHaveText(/Oponente$/)` (ou o texto exato) e `:388` idem; conferir `status: 'aliado'` depois de `:387`; conferir o chip de contagem.
- G5: clicar "Anterior" no fim de `m1-conjuntura.spec.ts:428` e voltar a `Slide 1 de 2`.
- Ambiente: fixar `workers: 2` no `playwright.config.ts`, ou rodar o gate com `--workers=2`, nesta máquina.

---

## Pendente por decisão / confirmar com o Pedro (fora do veredito, exceto G1)

| Item | Situação | Quem decide |
| --- | --- | --- |
| **G1** | Resumo baixado antes da posse: mostrar "faltam N dias para a posse" (corrigir) ou manter sem contador (ajustar a spec)? | Dono do produto, antes do merge |
| **P6: "último dia dos 100"** (dia 100) | Decisão da coordenação, registrada na spec como premissa não confirmada (`spec.md:27`). Implementado e testado (`contador-dias.test.ts:25`, `m1-contador.spec.ts:51-52`) | Pedro |
| Painel do mandato (`app.js:194`) | Continua "Dia 283 / os 100 primeiros dias terminaram em …" e, antes da posse, "Faltam N dias" (sem singular). A T22 deixa o `painel()` como está, e o critério limita "nenhum número acima de 100" aos três lugares. Confirmar que o Pedro não espera a regra nova também no Painel | Pedro |
| #138.4 | Conceito do indicador no tooltip: o catálogo não tem o texto; o tooltip mostra fonte, ano e sentido | Pedro (enviar os textos) |
| ⚠️ P2 (PAR-02 e PAR-05) | O `select` nativo mostra o valor atual além de `.cartao-class-cat`: conta como "uma única vez"? Agora vale para o cartão e para a ficha | Pedro |
| ⚠️ P3 (PAR-03) | Qual é a "caixa de texto do cabeçalho"? O teste usa a 1ª aba, só com o menu recolhido | Pedro |
| ⚠️ P4 (UI-01) | "Qualquer `.abas`": a regra é global, mas só a Conjuntura é medida | Pedro (ou teste opcional) |
| ⚠️ P5 (SEL-01.2) | "Suavemente" não tem medida; o teste exige o formulário na tela | Pedro |
| ⚠️ P1 | Os critérios da spec não trazem o ID; o mapa depende do campo Requirement das tasks (CFG-01, PAR-05 e PAR-06 já trazem o ID no texto) | Autor da spec |
| Consequência da premissa #136 | A prefeitura do domicílio só é classificável se estiver entre os 5 cartões (agora confirmado pelo Pedro, `spec.md:33`) | — (registrado) |
| F3 residual | `valor` da 2ª reação conferido só pelo formato (sonda E16, fora do diff) | Opcional |
| TERM-01 / T23 (sugestão #97) | Entrou na spec e nas tasks em `498f5cb`, durante esta verificação. Ainda não está implementado e fica fora desta iteração (T1 a T22) | Próxima verificação |

---

## Requirement Traceability Update

Sugestão para `spec.md`. O Verifier não edita a spec; o orquestrador aplica.

| Requirement | Status anterior | Status novo |
| --- | --- | --- |
| CJ-01, CJ-02, CJ-03, OP-01 a OP-04 | Pending (it. 2: Verified) | ✅ Verified |
| UI-01 | Pending (it. 2: Verified) | ✅ Verified (⚠️ P4) |
| PAR-01 | Pending (it. 2: Verified) | ✅ Verified |
| PAR-02 | Pending (it. 2: Verified) | ✅ Verified (⚠️ P2) |
| PAR-03 | Pending (it. 2: Verified) | ✅ Verified (⚠️ P3) |
| PAR-04 | Pendente por decisão | ✅ Fechado (recorte de captura, sem defeito; confirmado pelo dono) |
| PAR-05 | Pending | ✅ Verified (⚠️ P2; G4 Minor) |
| PAR-06 | Pending | ✅ Verified (G5 Minor) |
| SEL-01 | Pending (it. 2: Verified) | ✅ Verified (⚠️ P5) |
| CFG-01 | Pending | ❌ Needs Fix (G1) ou decisão do dono; o resto do critério está verificado (⚠️ P6) |

---

## Summary

**Overall**: ❌ Not Ready, por **um** gap (G1). Todo o resto de T1 a T22 está verificado.

**Spec-anchored check**: 18 de 19 critérios entregues com o valor da spec. CFG-01 está verificado em 7 dos 8 ramos e lugares, e falta posse futura no resumo baixado (G1). As lacunas de precisão ⚠️ P1 a P6 são perguntas ao Pedro.
**Sensor**: 20 de 20 nesta iteração; 42 de 42 no acumulado.
**Gate**: tsc 0 erros; unit 1467/1467; e2e 129/129 com 2 workers e 129/129 com 4 workers com a máquina folgada. Com 4 workers e a máquina saturada, 6 e 31 falhas, por tempo esgotado ou com a página ainda carregando; `m1-fechamento.spec.ts:32` é o mais frágil (2 de 3 rodadas com 4 workers). Ver Gate.

**O que funciona**: a ficha de detalhe com relação única, `select` e "Remover classificação", e a linha da tabela com os 5 botões (PAR-05). O carrossel fluido de 390 a 1600px, inclusive nas larguras intermediárias medidas pela sonda (PAR-06). O contador nos três lugares para dias 1 a 99, 100, 101 e 283, e na barra lateral e no cabeçalho móvel antes da posse, inclusive no singular. A cópia de `novos.js` é provada igual à `lib` (CFG-01).

**Próximo passo** (escala ao usuário, última iteração): decidir G1, com a correção de 1 linha mais 1 asserção ou o ajuste da spec. Depois da correção, o único re-teste necessário é `npx playwright test e2e/m1-contador.spec.ts` mais `npm test`.
