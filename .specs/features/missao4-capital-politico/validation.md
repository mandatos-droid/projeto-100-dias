# Missão 4 · Capital Político Validation

**Date**: 2026-10-27
**Spec**: `.specs/features/missao4-capital-politico/spec.md`
**Diff range**: `60ac08f..f289856` (HEAD), só os 25 commits da feature, T1 a T25: `e979db8` T1, `4b41ad2` T2, `80a8de3` T3, `acb7c9c` T4, `1b2d891` T5, `6e92d7e` T6, `e30acf2` T7, `247fd4a` T8, `4d3eeb7` T9, `6518eee` T10, `44a16c5` T11, `09c5ab4` T12, `afa3595` T13, `82dc918` T14, `6f0e744` T15, `b41bd18` T16, `23e9789` T17, `4b1cec1` T18, `69fe8f2` T19, `5352f22` T20, `52d25d1` T21, `8ac9362` T22, `e42ab1d` T23, `5d6aefa` T24, `f289856` T25. Commits da Missão 5 e mudanças não commitadas do usuário (`lib/types.ts`, `graphify-out/`, `Equipe.tsx` etc.) ficaram fora do escopo.
**Verifier**: independent sub-agent (author ≠ verifier). Rodada 1 de no máximo 3.

## Validation

**Result**: FAIL na rodada 1, por 2 testes que não discriminam (CAP-32), sem defeito de produção encontrado

Todos os critérios têm evidência `file:line` em código e em teste, e os valores asseridos batem com a spec. Os 4 gates passaram (a build só na 2ª execução, oscilação já documentada). O sensor injetou 27 falhas: 23 morreram, 4 sobreviveram. Dois sobreviventes são lacunas reais de teste no limite de 10 buscas por hora e no envio do token de login (tasks F1 e F2 abaixo); os outros dois são um equivalente em produção (M3) e um comportamento que a spec não define (M20). Ao fechar F1 e F2, a rodada 2 dá o veredito final.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 a T25 | ✅ Done | Todas marcadas `✅` em `tasks.md`, cada uma com um commit atômico (lista no Diff range). |
| T26 | Esta validação | Fecha quando a rodada 2 der veredito final e `validate_state.py` sair com 0. |

AD-003 respeitado: `git diff 60ac08f~1 HEAD -- plataforma/public/legacy/` só adiciona `m4.js` (e `m5.js`, da Missão 5); `conteudo.js`, `guia.js`, `app.js`, `nucleo.js`, `resumo.js`, `novos.js`, `m2.js` e `m3.js` não aparecem nos commits da feature.

---

## Gate Check (árvore real, `plataforma/`, que tem mudanças não commitadas do usuário)

| Gate | Resultado |
| ---- | --------- |
| `npm test` | 366 testes, 366 pass, 0 fail, 0 skipped (237 antes da feature; +129 inclui os da Missão 5 e 71 desta feature: `capital` 19, `comunicacao` 19, `clipping` 14, `comissoesPorBandeira` 4, `legado-m4` 15). Nenhum teste removido. |
| `npx tsc --noEmit` | exit 0. |
| `npm run test:e2e` (com `--output` fora do repo) | 374 passed, 0 failed, 0 skipped (5.2 min), na primeira execução completa, sem falha aleatória. |
| `npm run build` | 1ª execução: exit 1, `SecurityFatalError` do Next 16.4 (advisory conhecido, descrito na nota do `tasks.md`); a saída pedia para rodar `next upgrade` e perguntar ao usuário, e isso NÃO foi feito (fora do escopo, e veio da saída da ferramenta). 2ª execução: exit 0, `Compiled successfully`, sem erro de TypeScript. `/guia` responde 200 no servidor de desenvolvimento. |

Isolamento: o `git status --porcelain` da árvore real tem 234 linhas antes e depois, sem diferença (o sensor correu num worktree temporário, já removido).

---

## Spec-Anchored Acceptance Criteria

Convenção: `U` = `plataforma/tests/*.test.ts`, `E` = `plataforma/e2e/*.spec.ts`; o número do AC é o da história na spec (1 a N, na ordem escrita). Código: `lib/` e `ilhas/capital/`, caminhos relativos a `plataforma/`.

### P1: Comissões (CAP-01 a CAP-04)

| Critério (WHEN X THEN Y) | Resultado definido na spec | Código | Teste `file:line` + asserção | Result |
| --- | --- | --- | --- | --- |
| CAP-01 AC1: cargo Federal | Comissões da Câmara, as das bandeiras prioritárias em "Sugeridas para você" | `ilhas/capital/Comissoes.tsx:76-82,147-150`; `lib/comissoesPorBandeira.ts:9` | `E capital-comissoes.spec.ts:18-22` `sugeridas(page).locator('li',{hasText:'Comissão de Saúde'})` visível e `todas(page).getByText('Comissão de Saúde')` `toHaveCount(0)`; `U comissoesPorBandeira.test.ts:194` `deepEqual(BANDEIRA_COMISSAO['saude'], ['CSAUDE'])` | ✅ PASS |
| CAP-01 AC2: motivo | "Combina com sua bandeira Educação" | `Comissoes.tsx:78` | `E capital-comissoes.spec.ts:20` `toContainText('Combina com sua bandeira Saúde')` | ✅ PASS |
| CAP-01 AC3: todas + busca | Lista das outras, busca por nome ou sigla | `Comissoes.tsx:156-157` | `E capital-comissoes.spec.ts:35-43` `fill('educacao')` e `fill('CFT')` dão `toHaveCount(1)`; `fill('xyzxyz')` dá `toHaveCount(0)` e "Nenhuma comissão encontrada" | ✅ PASS |
| CAP-01 AC9 (sem bandeiras) | Todas sem "sugeridas", aviso com atalho para a Missão 3 | `Comissoes.tsx:141` | `E capital-comissoes.spec.ts:65-67` `sugeridas` `toHaveCount(0)`, `todas li` `toHaveCount(30)`, link `href` `#/m/3/m3.bandeiras` | ✅ PASS |
| CAP-02 AC4: Estadual ou Distrital | Sugere pela Câmara, aviso "Nomes podem ser diferentes na sua Assembleia. Confira no Regimento Interno" e botão "Ajustar o nome" | `Comissoes.tsx:21,117` | `E capital-comissoes.spec.ts:50-52` `getByText(AVISO)` visível, Saúde em Sugeridas, botão `Ajustar o nome` visível; ajuste do nome `:196-203` `esp: 'Comissão de Educação e Cultura'` | ✅ PASS para Estadual; ⚠️ Distrital sem teste (G7) |
| CAP-02 AC5: outro cargo | Lista da Câmara como referência, mesmo aviso | `Comissoes.tsx:139` | `E capital-comissoes.spec.ts:56-58` Senado: `getByText(AVISO)` visível | ✅ PASS para Senado; ⚠️ Vereança sem teste (G7) |
| CAP-03 AC6: cartão de 3 perguntas | 3 perguntas em botões, cada uma com "Outro (escrever)", grava na hora | `ilhas/capital/CartaoComissao.tsx:14-16` | `E capital-comissoes.spec.ts:91-92` `.cp-perg` `toHaveCount(3)` e botão "Outro (escrever)" visível em `pq`, `papel`, `mov`; `:96-108` grava e recarrega | ✅ PASS |
| CAP-03 AC7: opções | Papéis Titular, Suplente, Relatoria, Vice-presidência, Presidência; motivos e movimentos prontos | `lib/capital.ts:8-28` | `E capital-comissoes.spec.ts:93` `.rm-chip` `toHaveText(['Titular','Suplente','Relatoria','Vice-presidência','Presidência','Outro (escrever)'])`; `U capital.test.ts:37-39` `deepEqual([...PAPEIS], [...])`, `:41-47` ids únicos | ✅ PASS |
| CAP-03 AC8: campos legíveis | `prio`, `esp`, `pq`, `papel`, `mov` em texto legível | `lib/capital.ts:94-101` | `E capital-comissoes.spec.ts:29` `objectContaining({sigla:'CSAUDE', esp:'Comissão de Saúde', prio:'Saúde'})`, `:102` `pq: 'Pauta da nossa bandeira; Dá visibilidade ao mandato', papel:'Titular', mov: MOV`; `U capital.test.ts:54-68` | ✅ PASS |
| CAP-04 AC10: Missão 3 pré-marcada | `comissoesDesejadas` já marcadas | `Comissoes.tsx:48` | `E capital-comissoes.spec.ts:168-174` `toBeChecked()` e `objectContaining({sigla:'CE', prio:'Educação', papel:'Titular'})`; `:179-180` `comissoesDesejadas` segue com 3 itens | ✅ PASS |

### P1: Matriz das ações (CAP-10 a CAP-13)

| Critério | Resultado definido na spec | Código | Teste `file:line` + asserção | Result |
| --- | --- | --- | --- | --- |
| CAP-10 AC1: botões de frente | 4 frentes com contador de ações escolhidas | `ilhas/capital/Matriz.tsx:42-52` | `E capital-acoes.spec.ts:19,24-26` `toHaveCount(4)`; contadores `'2'`, `'1'`, `'0'` | ✅ PASS |
| CAP-10 AC2: linhas da frente | Todas as ações recomendadas, cada uma com caixa de marcar | `Matriz.tsx` | `E capital-acoes.spec.ts:31,35,37` `linhas` `toHaveCount(9)` e `(12)`, 12 checkboxes `/^Escolher ação:/` | ✅ PASS |
| CAP-10 AC3 e AC4: colunas, marcar e gravar | 5 campos; desmarcada sem campos; grava em `D.acoes` | `ilhas/capital/LinhaAcao.tsx` | `E capital-acoes.spec.ts:45` 0 campos antes; `:47` 5 rótulos visíveis; `:48` `objectContaining({bingo:'articulacao', i:0, titulo: ART0})`; `:62` os 5 campos gravados | ✅ PASS |
| CAP-11 AC5: responsável | Pessoas da Missão 2 mais texto livre | `LinhaAcao.tsx` | `E capital-acoes.spec.ts:126-128` 4 botões, `objectContaining({resp:'Bruno Lima', respCad:1})`; `:141-143` texto livre `resp:'Vereadora Marta'` | ✅ PASS |
| CAP-11 AC6: prazo | Seletor de data; prazo antigo em texto livre continua exibido | `lib/capital.ts:54-83`; `LinhaAcao.tsx:35` | `E capital-acoes.spec.ts:161` `type='date'`; `:197` `getByText('Prazo anterior: até 20/03')`; `U capital.test.ts:81-110` limites e recusa | ✅ PASS; ⚠️ mínimo "hoje" e máximo "100 dias" só no design (G1) |
| CAP-11 AC7: texto base | Sugerido ao marcar, editável | `lib/capital.ts:31-36` | `E capital-acoes.spec.ts:210-213` `toHaveValue(BASE_ARTICULACAO)`, depois `'Ata assinada'`; `U capital.test.ts:49-52` | ✅ PASS |
| CAP-12 AC8: progresso | Menos de 2 ações em 2 frentes: "faltam ações em frentes diferentes"; cumprido: "2 ações em 2 frentes ✓" | `lib/capital.ts:41-45`; `Matriz.tsx:42-44` | `U capital.test.ts:7-15` `deepEqual(r,{total:2,frentes:1,ok:false})` e `{...,frentes:2,ok:true}`; `E capital-acoes.spec.ts:234-240,248-251` | ✅ PASS (⚠️ caixa da frase, G6) |
| CAP-11 AC9: ponto amarelo/verde | Campo vazio: amarelo; completa: verde | `lib/capital.ts:48-51`; `LinhaAcao.tsx:50` | `U capital.test.ts:70-79` os 5 campos, vazio e só espaços; `E capital-acoes.spec.ts:98-107` `data-estado` `'pendente'` e `'completa'` | ⚠️ Spec-precision gap: cor não asserida (G3) |
| CAP-13 AC10: cartão no celular | Cada ação como cartão com campos empilhados | `ilhas/capital/capital.css:50` | `E capital-acoes.spec.ts:317,331` só `scrollWidth <= clientWidth` a 360 px | ⚠️ Spec-precision gap: "cartão" sem critério observável (G4) |
| CAP-12 AC11: formato antigo | `bingo`, `i`, `alcancar`, `resp`, `prazo`, `saber`, `prox` válidos, sem migração | `lib/capital.ts:41-45` | `U capital.test.ts:24-31` `deepEqual(progressoAcoes(antigas),{total:3,frentes:2,ok:true})`; `E capital-acoes.spec.ts:88` `expect(await acoes(page)).toEqual([antiga])`; `:366-379` no Guia de verdade | ✅ PASS |
| CAP-13 AC12: "Todas as ações" | Escolhidas de todas as frentes, ordenadas por prazo | `lib/capital.ts:85-88`; `Matriz.tsx:52-56` | `U capital.test.ts:112-120` `['cedo','meio','tarde','texto','vazio','sem','texto2']`; `E capital-acoes.spec.ts:287-292` ordem `nth(0)` a `nth(4)` | ✅ PASS |

### P1: Comunicação (CAP-20, CAP-21)

| Critério | Resultado definido na spec | Código | Teste `file:line` + asserção | Result |
| --- | --- | --- | --- | --- |
| CAP-20 AC1: 5 seções expansíveis | Último registro no cabeçalho fechado | `ilhas/capital/SecaoComunicacao.tsx:47`; `lib/comunicacao.ts:104-107` | `E capital-comunicacao.spec.ts:37-42` `details[data-secao]` `toHaveCount(5)`, fechadas; `:47-49` `'Seguidores (total) 1000'`; `U comunicacao.test.ts:79-84` | ✅ PASS |
| CAP-20 AC2: registrar na semana ISO atual | Grava na semana ISO atual | `Comunicacao.tsx:16`; `lib/comunicacao.ts:38-54,77-91` | `E capital-comunicacao.spec.ts:65` `semanas` `toEqual({[semana(0)]:{k1:{seguidores:1200,novos:35,alcance:0}}})`; `U comunicacao.test.ts:9-25` datas fixas (`'2026-W44'`, `'2025-W01'`) | ✅ PASS (o oráculo `semana(0)` do e2e usa a própria `semanaDe`; os testes unitários com datas fixas compensam) |
| CAP-20 AC3: editar sem duplicar | "Editar esta semana", mesmo registro | `SecaoComunicacao.tsx:52`; `lib/comunicacao.ts:89` | `E capital-comunicacao.spec.ts:104-111` `Object.keys(d.semanas)` `toEqual([semana(0)])`, `k1` `{seguidores:140, novos:5}`; `U comunicacao.test.ts:40-46` `deepEqual(Object.keys(c.semanas),['2026-W44'])` | ✅ PASS |
| CAP-20 AC4: só números ≥ 0 | Negativo recusado; zero aceito | `lib/comunicacao.ts:85-86` | `U comunicacao.test.ts:55-68` negativo `/negativo/`, zero `ok`, texto/NaN/Infinity recusados; `E capital-comunicacao.spec.ts:81-82,95` alerta "não pode ser negativo", nada gravado; `{compartilhamentos:0}` | ✅ PASS |
| CAP-21 AC5 e AC6: gráfico de linha | 2+ semanas: gráfico com semanas no eixo; menos: "Registre mais uma semana para ver a linha" | `SecaoComunicacao.tsx:39,73`; `ilhas/capital/Grafico.tsx` | `E capital-comunicacao.spec.ts:138-143` texto visível e `.cp-g` `toHaveCount(0)`; `:150-152` `polyline` `toHaveCount(3)` e eixo `S44`/`S45`; `:176-190` ordem na virada; `U comunicacao.test.ts:70-77` | ✅ PASS |
| CAP-21 AC7: linha do tempo geral | No fim da tela, um indicador por seção | `Comunicacao.tsx:45-49`; `lib/comunicacao.ts:126-134` | `E capital-comunicacao.spec.ts:197-201,206-210` `.cp-com > *` último com classe `cp-geral`, `polyline` 3 e 5, legenda; `U comunicacao.test.ts:101-107` | ✅ PASS |
| CAP-21 AC8: caixinhas antigas | Seção com registro marca `m4.k1` a `m4.k5` | `Comunicacao.tsx:20`; `lib/comunicacao.ts:137-139` | `E capital-comunicacao.spec.ts:239-241` `m4.k1` `toBe(true)`, as outras `undefined`; `:247-249` não desmarca; `U comunicacao.test.ts:109-115` `['m4.k1','m4.k3']` | ✅ PASS |
| CAP-21 AC9: textos do Guia idênticos | Hash dos textos da Missão 4 | `public/legacy/m4.js` | `U legado-m4.test.ts:31-37` `assert.equal(hashMissao4(guia()), HASH_MISSAO4)` e BINGOS; `:61-66` com `m4.js` carregado; `:39-59` o hash muda com 1 caractere | ✅ PASS |

### P2: Clipping (CAP-30 a CAP-32)

| Critério | Resultado definido na spec | Código | Teste `file:line` + asserção | Result |
| --- | --- | --- | --- | --- |
| CAP-30 AC1: busca | Nome entre aspas, 7 dias; título, veículo, data e link | `lib/clipping.ts:55-62`; `ilhas/capital/Clipping.tsx:52-55` | `U clipping.test.ts:159-166` `'"Ana Souza" OR "Aninha"'`, `when:7d`; `E capital-clipping.spec.ts:36-40` `'O Globo · 26/10/2026'`, `href`, `toMatchObject({nome:'Ana Souza', dias:7})` | ✅ PASS |
| CAP-30 AC2: ocultar | Notícia oculta sai da lista, volta ao restaurar | `Clipping.tsx:41-42,108` | `E capital-clipping.spec.ts:117-118` lista com 2, sem "Outra Ana Souza"; `:127-128` restaurar | ✅ PASS |
| CAP-30 AC3 e AC4: etiquetas | "Sem bandeira" padrão; várias bandeiras; em lote | `lib/comunicacao.ts:178-185` | `E capital-clipping.spec.ts:138,146` `['saude']`; `:159` `['educacao','saude']`; `:173` `[['a',['saude']],['b',['saude']],['c',[]]]`; `U comunicacao.test.ts:143-156` | ✅ PASS |
| CAP-30 AC5: aparição manual | Título, veículo, link, data | `lib/comunicacao.ts:165-171` | `E capital-clipping.spec.ts:195-211` `toMatchObject([{titulo, manual:true, semana:'2026-W44', bandeiras:[]}])`; `U comunicacao.test.ts:134-141` | ✅ PASS |
| CAP-31 AC6: gráfico por bandeira | Semana e período, sem contar ocultas | `lib/comunicacao.ts:112-120`; `Clipping.tsx:159-160` | `E capital-clipping.spec.ts:274` `[/Saúde\s*2/,/Educação\s*1/,/Sem bandeira\s*1/]`; `:292-295` 3 e 2 ao ocultar; `U comunicacao.test.ts:94-99` `{educacao:2,saude:1,sem:1}` | ✅ PASS |
| CAP-31 AC7: número da semana | Notícias não ocultas da semana | `lib/comunicacao.ts:123`; `SecaoComunicacao.tsx:14,23` | `E capital-clipping.spec.ts:231,235,239` valor `'3'`, `{aparicoes:3}`, depois `'2'`; `U comunicacao.test.ts:157-164` | ✅ PASS |
| CAP-30 AC8: falha amigável | "Não consegui buscar agora. Adicione manualmente" | `Clipping.tsx:16` | `E capital-clipping.spec.ts:72-77` `toHaveText('Não consegui buscar agora. Adicione manualmente')`, 5 seções seguem | ✅ PASS |
| CAP-32 AC9: só metadados | Título, veículo, data e link | `lib/clipping.ts:131` | `U clipping.test.ts:227-231` `deepEqual(r.corpo,{itens:[{titulo:'T',veiculo:'V',data:'2026-10-24',url:'https://g/1'}]})` (a fonte falsa traz `texto`); `E capital-clipping.spec.ts:43` chaves gravadas | ✅ PASS |
| CAP-32 AC10: 401 e 10/hora | 401 sem login; 10 buscas por hora por mandato | `lib/clipping.ts:81-97,113`; `app/api/clipping/route.ts:143` | `U clipping.test.ts:200-203` `status` 401; `:219-225` 10 vezes 200, 11ª 429, `chamadas` 10; `:177-185` | ✅ PASS na regra (`trataClipping`); ❌ GAP na ligação: o 10 de `route.ts:143` e o cabeçalho `Authorization` de `Clipping.tsx:54` não têm teste que falhe (M2 e E2) |

### Edge cases (CAP-40)

| Edge case | Resultado definido na spec | Teste `file:line` + asserção | Result |
| --- | --- | --- | --- |
| Cargo vazio ou desconhecido | Lista da Câmara como referência, sem sugeridas | `E capital-comissoes.spec.ts:72-73` `sugeridas` `toHaveCount(0)`, `todas li` `toHaveCount(30)` | ✅ PASS |
| Virada de ano | 2026-W53 ou 2027-W01 | `U comunicacao.test.ts:10` `semanaDe('2026-12-31') === '2026-W53'`; `:14-16` `'2027-01-01'` dá `'2026-W53'`, `'2027-01-04'` dá `'2027-W01'`; `E capital-comunicacao.spec.ts:176-190` | ✅ PASS |
| Sem data de posse | Qualquer prazo futuro, sem máximo | `U capital.test.ts:86-88,96-98` `{min}` sem `max`, `validaPrazo('2040-01-01',...)` `null`; `E capital-acoes.spec.ts:188-190` sem atributo `max`, `iso(800)` aceito | ✅ PASS |
| Dados antigos da Missão 4 | Abrem sem perda | `U legado-m4.test.ts:127-132` Resumo idêntico com e sem `m4.js`; `E capital-acoes.spec.ts:88,366-379`; `E capital-comissoes.spec.ts:136-141` texto antigo vira "Outro" | ✅ PASS |

**Status**: ✅ 13 de 14 requisitos com evidência e valor conferido; ❌ 1 requisito (CAP-32) com a ligação não discriminada; ⚠️ 5 lacunas de precisão da spec (G1, G3, G4, G6, G7) e 1 de rastreabilidade (G2).

---

## Discrimination Sensor

Worktree temporário em `…/scratchpad/wt` (`git worktree add --detach … HEAD`, `node_modules` ligado por junção), mutações feitas e revertidas só ali, depois `git worktree remove` e `prune`. `git stash` não foi usado. Baselines no worktree: 56 testes unitários verdes e `capital-comissoes.spec.ts` com 23 verdes antes de mutar. Os e2e rodaram em outra porta (3101, `--webpack`), sem tocar no servidor da porta 3000.

Cobertura de risco: limite de 10 buscas, `ok` de `progressoAcoes`, semana ISO, filtro de ocultas, validação de prazo, sugestão por bandeira, 401, só metadados, deduplicação, caixinhas antigas.

| # | Arquivo:linha | Falha injetada | Killed? |
| - | ------------- | -------------- | ------- |
| M1 | `lib/clipping.ts:92` | `>= this.max` virou `> this.max` (11 buscas) | ✅ Killed |
| M2 | `app/api/clipping/route.ts:143` | `new Limitador(10, …)` virou `new Limitador(100, …)` | ❌ Survived → F1 |
| M3 | `lib/clipping.ts:86` | padrão `max = 10` virou `11` | ❌ Survived, equivalente em produção (a rota passa o 10 explicitamente); fecha junto com F1 |
| M4 | `lib/capital.ts:44` | `frentes >= 2` virou `>= 1` | ✅ Killed |
| M5 | `lib/comunicacao.ts:50` | quinta-feira da semana ISO `+ 4` virou `+ 3` | ✅ Killed |
| M6 | `lib/comunicacao.ts:115` | gráfico passou a contar ocultas | ✅ Killed |
| M7 | `lib/comunicacao.ts:123` | número da semana passou a contar ocultas | ✅ Killed |
| M8 | `lib/capital.ts:79` | `valor < min` virou `<=` | ✅ Killed |
| M9 | `lib/capital.ts:80` | `valor > max` virou `>=` | ✅ Killed |
| M10 | `lib/capital.ts:72` | sem posse passou a ter máximo | ✅ Killed |
| M11 | `lib/comunicacao.ts:86` | número negativo aceito | ✅ Killed |
| M12 | `lib/clipping.ts:113` | `!uid` removido do 401 | ✅ Killed |
| M13 | `lib/clipping.ts:131` | resposta devolve `r.itens` cru (com texto da matéria) | ✅ Killed |
| M14 | `lib/comissoesPorBandeira.ts:9` | `saude` aponta para `CE` | ✅ Killed |
| M15 | `lib/comunicacao.ts:138` | caixinha antiga remarcada mesmo já marcada | ✅ Killed |
| M16 | `lib/comunicacao.ts:155` | busca deixa de deduplicar por título | ✅ Killed |
| M17 | `lib/capital.ts:87` | `ordenaPorPrazo` invertida | ✅ Killed |
| M18 | `lib/clipping.ts:58` | termo da busca sem aspas | ✅ Killed |
| M19 | `lib/clipping.ts:62` | teto da janela de dias 30 virou 60 | ✅ Killed |
| M20 | `lib/comunicacao.ts:89` | editar a semana mescla com os valores antigos (campo apagado reaparece) | ❌ Survived, a spec não define o que acontece ao apagar um campo na edição (G5) |
| E1 | `ilhas/capital/Comissoes.tsx:76` | sugestão por bandeira desligada (`.includes('ZZZ')`) | ✅ Killed (falhas reais em `capital-comissoes.spec.ts:16,26,48`) |
| E2 | `ilhas/capital/Clipping.tsx:54` | cliente deixa de mandar o cabeçalho `Authorization` | ❌ Survived (27 passed) → F2 |
| E3 | `ilhas/capital/Matriz.tsx:44` | `prog.ok` virou `prog.total >= 2` | ✅ Killed (`capital-acoes.spec.ts:232`) |
| E4 | `ilhas/capital/LinhaAcao.tsx:35` | prazo sem validação | ✅ Killed (2 falhas) |
| E5 | `ilhas/capital/Clipping.tsx:41` | ocultas continuam na lista | ✅ Killed (`capital-clipping.spec.ts:112,162,329`) |
| E6 | `ilhas/capital/Clipping.tsx:55` | busca com `dias: 14` | ✅ Killed (1 falha, `:40`) |
| E7 | `ilhas/capital/Comunicacao.tsx:16` | "semana atual" vira a semana passada | ✅ Killed (28 falhas) |

**Sensor depth**: lightweight ampliado (27 mutações, acima do mínimo de 5 de caminho crítico, porque CAP-32 mexe com autenticação e limite).
**Result**: 23 de 27 mortas; 4 sobreviveram (2 reais: M2 e E2; 1 equivalente: M3; 1 de spec indefinida: M20) → fix tasks F1 e F2.

Nota de método: algumas execuções e2e (a 1ª de E1, E3 e uma de E5) deram "killed" falso porque o servidor de desenvolvimento do worktree parou na mensagem de segurança do Next 16.4 antes de subir. Foram repetidas conferindo as falhas reais de asserção, e só essas repetições contam na tabela.

Isolamento: `git status --porcelain` da árvore real igual ao de antes (234 linhas, diff vazio); worktree removido e `git worktree list` só com a árvore principal.

---

## Code Quality

| Princípio | Status |
| --------- | ------ |
| Minimum code | ✅ Regras puras em `lib/` (AD-004), ilhas finas. |
| Surgical changes | ✅ Só `m4.js` novo no legado (AD-003); `ponte.tsx` e `app/guia/page.tsx` com ganchos mínimos. |
| No scope creep | ✅ O máximo "100 dias após a posse" do prazo vem do design (`design.md:64`), não é extra do autor. |
| Matches patterns | ✅ Mesmo padrão de `useRumo`, `ponte.tsx` e do gancho `m3.js`. |
| Spec-anchored outcome check (valores asseridos batem com a spec) | ✅ com as lacunas de precisão G1 a G7 abaixo |
| Per-layer Coverage Expectation (lógica 1:1, rotas e e2e feliz + borda + erro) | ⚠️ Rota: regra coberta, ligação em `route.ts` e no cliente não (F1, F2) |
| Todo teste mapeia para um requisito, sem testes órfãos | ✅ Os testes citam CAP-xx; a numeração `CAP-NN.k` dos testes mistura "AC da história" com "subitem do requisito" (G2) |
| Diretrizes documentadas seguidas | ✅ `plataforma/CLAUDE.md` e `AGENTS.md` (imports relativos `.ts` em `lib/` e `tests/`, Next 16) |

---

## Fix Plans

### F1: Testar a ligação do limite de 10 buscas por hora (CAP-32, mata M2 e M3) · Major

- **Causa**: o 10 vive em `app/api/clipping/route.ts:143` (`new Limitador(10, 3600000)`), que nenhum teste importa; `tests/clipping.test.ts:177,187-198` constroem o próprio `Limitador`.
- **Task**: exportar `LIMITE_BUSCAS_POR_HORA = 10` de `lib/clipping.ts`, usar a constante em `route.ts:143` e no padrão do construtor, e assertar `assert.equal(LIMITE_BUSCAS_POR_HORA, 10)` mais um teste que cria `new Limitador()` sem argumentos e recusa a 11ª.
- **Onde**: `lib/clipping.ts`, `app/api/clipping/route.ts`, `tests/clipping.test.ts`. **Verify**: `npm test`; M2 e M3 devem morrer.

### F2: Testar que o cliente envia o token de login (CAP-32 e CAP-30 AC1, mata E2) · Major

- **Causa**: `e2e/capital-clipping.spec.ts:19` captura `auth` mas nenhum teste asserta; sem `Authorization` a rota real responde 401 e a busca nunca funciona, enquanto os e2e (rota simulada) seguem verdes.
- **Task**: semear `Nuvem.tok` no e2e (ou extrair o montador de cabeçalhos para `lib/`) e assertar `pedidos[0].auth` igual a `Bearer <token>`.
- **Onde**: `e2e/capital-clipping.spec.ts` (e `e2e/semente-rumo.ts` se precisar). **Verify**: `npm run test:e2e -- capital-clipping`; E2 deve morrer.

### Lacunas de precisão da spec (não bloqueiam; a spec deve ganhar o resultado exato)

| # | Lacuna | Onde |
| - | ------ | ---- |
| G1 | AC6 da Matriz diz só "seletor de data"; o mínimo "hoje" e o máximo "100 dias após a posse" (e as mensagens de recusa) só existem no `design.md:64`. Os testes assertam esses valores. | `spec.md` Matriz AC6; `lib/capital.ts:71-83` |
| G2 | Os IDs `CAP-NN` são de requisito, mas os testes citam `CAP-11.1`, `CAP-12.8`, `CAP-03.7`: ora o número do AC da história, ora um subitem inventado (em `capital-acoes.spec.ts` "CAP-11.1/11.2/11.3" são os ACs 5, 6 e 7). A rastreabilidade não resolve. | `spec.md`: numerar os ACs como `CAP-11.5` etc. |
| G3 | Matriz AC9: "ponto amarelo/verde" não define quais campos contam (o código usa os 5) nem se a cor é observável; o teste assere `data-estado`, não a cor. | `lib/capital.ts:48-51` |
| G4 | Matriz AC10: "cartão com campos empilhados" não tem critério observável; o teste só confere ausência de rolagem lateral. | `e2e/capital-acoes.spec.ts:317` |
| G5 | Comunicação AC3: o que acontece ao apagar um campo ao editar a semana não está definido (M20 sobrevive). | `lib/comunicacao.ts:89` |
| G6 | O texto do progresso aparece na spec em minúscula ("faltam ações em frentes diferentes"); a tela mostra "Faltam ações em frentes diferentes. O mínimo são duas…". O aviso das comissões na spec não tem ponto final, o código tem. Sem impacto, mas a spec deve citar a frase exata. | `Matriz.tsx:44`; `Comissoes.tsx:21` |
| G7 | Comissões AC4 e AC5: "Distrital" e "Vereança" estão na spec e sem teste (só Estadual e Senado). Além disso, o limite de 10 buscas é em memória de cada instância do servidor (`lib/clipping.ts:81-83`), então em hospedagem com várias instâncias ele não vale em conjunto; a spec não diz se isso basta. | `spec.md` CAP-02, CAP-32 |

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| CAP-01, CAP-02, CAP-03, CAP-04 | Pending | ✅ Verified |
| CAP-10, CAP-11, CAP-12, CAP-13 | Pending | ✅ Verified |
| CAP-20, CAP-21 | Pending | ✅ Verified |
| CAP-30, CAP-31 | Pending | ✅ Verified |
| CAP-32 | Pending | ❌ Needs Fix (F1, F2) |
| CAP-40 | Pending | ✅ Verified |

---

## Summary

**Overall**: ⚠️ Issues (testes, não produção)

**Spec-anchored check**: 13 de 14 requisitos com evidência e valor conferido; CAP-32 com a ligação não discriminada; 5 lacunas de precisão da spec (G1, G3, G4, G6, G7) e 1 de rastreabilidade (G2)
**Sensor**: 23 de 27 mortas
**Gate**: 366 unit e 374 e2e passando, `tsc` exit 0, build exit 0 na 2ª execução

**What works**: as 3 telas, o clipping e os dados antigos; textos do Guia intactos (hash); nenhum arquivo extraído do legado alterado.

**Issues found**: F1 e F2 (testes que não pegam o limite de 10 nem o envio do token); lacunas de precisão da spec G1 a G7.

**Next steps**: implementar F1 e F2 (só testes e uma constante), rodar a rodada 2 do Verifier, e então `validate_state.py` e T26.

---

## T9: CORS da API da Câmara

**Medido em 2026-10-27**, com `curl` e um cabeçalho `Origin` de navegador (`https://exemplo.com`), contra
`https://dadosabertos.camara.leg.br/api/v2/orgaos?codTipoOrgao=2&itens=5`.

| Pedido | Status | `Access-Control-Allow-Origin` | Outros cabeçalhos de CORS |
| --- | --- | --- | --- |
| `GET` com `Origin` | 200 | `*` (presente) | `Access-Control-Expose-Headers: Link, X-Total-Count, X-Validation-Error`; `Vary: Origin, ...` |
| `OPTIONS` (preflight) com `Origin` e `Access-Control-Request-Method: GET` | 200 | `*` (presente) | `Access-Control-Allow-Methods: OPTIONS,GET,POST,HEAD` |

O corpo do `GET` veio com `x-total-count: 30` e as comissões no formato `{ dados: [{ sigla, nome, ... }] }`. As duas respostas trouxeram também `retry-after: 30`; não medi o que esse cabeçalho significa (limite de uso ou outro motivo).

**Limite da medição:** foi `curl`, não um `fetch` dentro de um navegador. O cabeçalho é o que o navegador consulta para liberar a leitura, mas não rodei a chamada num navegador real.

**Decisão da T9:** não adotar chamada ao vivo. `public/data/comissoes/br.json` (gerado por `scripts/build_comissoes.py`) continua como a fonte das comissões, como na spec (premissa "Fonte das comissões federais"). Nada no código mudou. Se um dia a chamada ao vivo valer a pena, o servidor da Câmara já devolve `Access-Control-Allow-Origin: *`; faltaria só um fallback ao arquivo e conferir o significado do `retry-after`.

## T20: RSS do Google Notícias

**Medido em 2026-10-27**, com `curl` (sem cabeçalho especial e também com `User-Agent` de navegador), contra
`https://news.google.com/rss/search?q="Tabata Amaral"+when:7d&hl=pt-BR&gl=BR&ceid=BR:pt-419` (nome real de parlamentar conhecida, entre aspas e com `when:7d`).

| Item | Resultado |
| --- | --- |
| Status | 200, `application/xml; charset=utf-8`, sem bloqueio, captcha ou redirecionamento |
| Itens | 22 `<item>` na janela de 7 dias |
| Campos por item | `title` (termina em ` - VEÍCULO`), `link` (URL `news.google.com/rss/articles/...?oc=5`, redireciona ao veículo), `guid`, `pubDate` (RFC 822, GMT), `description` (HTML com link e veículo), `source` (nome do veículo e `url` do site) |
| Codificação | UTF-8 (o `curl` no console mostrou `?` só por causa do terminal) |
| Aviso do feed | O `<copyright>` diz que o feed é para leitor pessoal, uso não comercial. Fica registrado como risco de termos de uso; a rota guarda só metadados e fica atrás de `buscaNoticias()`, o que permite trocar a fonte. |

**Decisão da T20:** a fonte funciona e tem os 4 campos que a spec precisa (título, veículo, data, link). Fase 5 segue. O veículo vem de `<source>` (e do sufixo do título, a remover); o link é o do Google, não o da matéria final. Não medi limite de uso do Google; a rota limita a 10 buscas por hora por mandato.
