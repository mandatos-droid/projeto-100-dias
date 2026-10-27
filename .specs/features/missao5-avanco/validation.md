# Missão 5 · Garanta o avanço Validation

**Date**: 2026-10-27
**Spec**: `.specs/features/missao5-avanco/spec.md`
**Diff range**: `2a6b32e..3ba1372` (a faixa também contém commits `feat(capital)` da Missão 4, intercalados; fora de escopo aqui)
**Verifier**: independent sub-agent (author != verifier)

## Validation: Missão 5 - PASS

**Verdict: PASS** (com 2 lacunas de precisão da spec e 1 mutante sobrevivente de baixa gravidade; nenhum AC falhou)

---

## Gates

| Gate | Resultado |
| ---- | --------- |
| `npx tsc --noEmit` (plataforma/) | exit 0 |
| `npm test` | 339 pass, 0 fail |
| `npm run test:e2e` | 321 pass, 13 fail. As 13 falhas estão todas em `e2e/capital-comunicacao.spec.ts` (Missão 4, arquivo não rastreado/WIP do usuário na hora da execução; fora da faixa e fora da Missão 5). 0 falhas fora desse arquivo |
| e2e da Missão 5 isolado (`m5-sucessos`, `m5-feedback`, `m5-ciclos`) | 36 passed |
| `npm run build` | não executado (conhecido: pode falhar só por `SecurityFatalError` do Next 16.4) |

Obs.: durante a verificação entrou o commit externo `23e9789 feat(capital): add seções expansíveis da comunicação` (não é meu; sensor rodou em worktree separado). O `git status` da árvore real difere do baseline apenas por esse commit.

## Spec-Anchored Acceptance Criteria

| AC | Resultado definido na spec | `file:line` + asserção | Coberto? |
| -- | -------------------------- | ---------------------- | -------- |
| M5-01.1 criar sucesso (mês, texto, "Não concluída", em `D.metas[i].sucessos`) | status `nao_concluida`, mês 1..4, gravado | `tests/sucessos.test.ts:16-20` (`s.mes===3`, `s.texto`, `s.status==='nao_concluida'`); e2e `e2e/m5-sucessos.spec.ts:24-27` lê `D.metas[0].sucessos` (`gravado[0].status` = `'nao_concluida'`, `mes` = 1) | Sim (payload por valor) |
| M5-01.2 editar grava na hora | texto/mês/status gravados | `e2e/m5-sucessos.spec.ts:40` `toEqual({id:'y',mes:2,texto:'Segundo',status:'concluida'})`; `:45` `toEqual({id:'x',mes:4,texto:'Primeiro editado',status:'nao_concluida'})`; unit `tests/sucessos.test.ts:34-39` | Sim |
| M5-01.3 remover mantém os demais | ids restantes | `e2e/m5-sucessos.spec.ts:54` `ids toEqual(['x','z'])`; unit `tests/sucessos.test.ts:51` | Sim |
| M5-02.4 sucessos agrupados por mês com status | meses 1,3 (só os com sucesso), status exibido | `e2e/m5-sucessos.spec.ts:84-91` (`toHaveCount(2)`, `/mês 1/i`, `/mês 3/i`, `toHaveValue('concluida')`); unit `tests/sucessos.test.ts:83-87` (`porMes`) | Sim |
| M5-02.5 atingimento = atingidos/total | 1 de 2 = 50% | `tests/atingimento.test.ts:150` `pctMeta('nao_concluida', suc('concluida','nao_concluida')) === 50`; `:152` 67; e2e `e2e/m5-sucessos.spec.ts:99-102` `'50%'` na meta, objetivo e total + `status` gravado `'concluida'` | Sim (⚠ lacuna de precisão: "atingido") |
| M5-02.6 sem sucessos usa status | 70 | `tests/atingimento.test.ts:158` `pctMeta('concluida70', []) === 70`; e2e `:108` `'70%'` | Sim |
| M5-02.7 mandato antigo normaliza sem erro, sem apagar texto | sem chave `sucessos`, texto mantido | `tests/sucessos.test.ts:58-60` (`[]`, JSON igual, sem chave); `:71` `deepEqual(l[0], {id:'x',mes:1,texto:'Escrito',status:'nao_concluida'})`; e2e `:69` `'sucessos' in meta === false` | Sim |
| M5-10.1 textos intactos | hash igual | `tests/legado-m5.test.ts:166` `hashM5(MISSOES) === '88f4daa4...a1b9'` e `:172` após carregar m5.js; `git diff 2a6b32e..HEAD -- conteudo.js` vazio | Sim |
| M5-10.2 botão leva a `#/plano` | `href="#/plano"` | `tests/legado-m5.test.ts:184-185` `match(/Abrir Planejamento Estratégico/)`, `match(/href="#\/plano"/)` | Sim (só unitário sobre HTML; não há e2e do clique real) |
| M5-20.1 mapa com "dá feedback a N pessoas" e "feitas X de N" | Ana 1 pessoa, Bruno 2 | `e2e/m5-feedback.spec.ts:15-19` `toContainText('dá feedback a 2 pessoas')`, `'feitas 0 de 2'`; unit `tests/feedback.test.ts:13-14` `n [1,2]` | Sim |
| M5-20.2 clicar na liderança lista pessoas feita/pendente | Carla feita, Davi pendente | `e2e/m5-feedback.spec.ts:57,59`; unit `tests/feedback.test.ts:38-39` | Sim |
| M5-20.6 sem cadeiras: aviso com link Missão 2 | link `#/m/2/m2.funcoes` | `e2e/m5-feedback.spec.ts:149` `toHaveAttribute('href','#/m/2/m2.funcoes')` | Sim |
| M5-20.8 celular = lista vertical | y crescente, x igual, sem scroll horizontal | `e2e/m5-feedback.spec.ts:176-179` | Sim |
| M5-21.3 abrir registro (data, destaques, ajustes, plano) | 4 campos | `e2e/m5-feedback.spec.ts:67-70` | Sim |
| M5-21.4 salvar grava em `D.feedbacks` e marca feita | payload gravado | `e2e/m5-feedback.spec.ts:85` `toMatchObject({cadeira:3,pessoa:'Davi Rocha',lider:'Bruno Lima',data:'18/03',destaques:'Boa entrega',ajustes:'Prazos',acao:'Reunião semanal'})`; `:86` `'feitas 1 de 2'` | Sim |
| M5-21.5 editar/apagar | grava e atualiza contagem | `e2e/m5-feedback.spec.ts:117` `toMatchObject({id:'a',destaques:'Depois',cadeira:2})`; `:127` `feedbacks toEqual([])`, `:128` `'feitas 0 de 2'` | Sim |
| M5-21.7 formato antigo aproveitado | texto preservado | `tests/feedback.test.ts:89-90` `destaques==='Falamos de prazos'`, `acao==='Revisar escopo'`; e2e `:34` `D.feedbacks toEqual([antiga])` e `:33` `'feitas 1 de 2'` | Sim |
| M5-30.3 confirmação e escolha de metas | painel com 3 checkboxes; nada grava | `e2e/m5-ciclos.spec.ts:30,32` (`toHaveCount(3)`, `planos toEqual([])`) | Sim |
| M5-30.4 guarda em `D.planos`, mantém Legado/bandeiras/objetivos/preditores, metas escolhidas sem sucessos | payload | `tests/ciclos.test.ts:206-209` (`n`, `criadoEm`, `legado`, objetivos), `:208` `foto(p.metas)===antes`; `:228-229` ids `['a','c']`, `status==='nao_concluida'` e sem `sucessos`; e2e `:43-49` (`ids ['a','b']`, `p1.metas toEqual(PLANO.D.metas)`, `preditores toEqual(['p1','p2'])`) | Sim (⚠ lacuna: status das copiadas) |
| M5-31.1 botão na tarefa Calibragem | termina com a ilha, checklist original antes | `tests/legado-m5.test.ts:255-256` (`startsWith`, `endsWith(ILHA_NOVO)`) e `:267` 9 itens | Sim (unitário; sem e2e do Guia real) |
| M5-31.2 botão na aba Planejamento | ilha após a árvore, uma só ligação | `tests/legado-m5.test.ts:275-277` | Sim (unitário) |
| M5-31.5 seletor "Planejamento 1, 2, 3…" com atual | opções + `value 3` | `e2e/m5-ciclos.spec.ts:87-88` `toHaveText([...'Planejamento 3 (atual)'])`, `toHaveValue('3')`; unit `tests/ciclos.test.ts:270-276` | Sim |
| M5-31.6 arquivado somente leitura | sem selects/botões de edição, D intacto | `e2e/m5-ciclos.spec.ts:95,98,99` (`somente leitura`, `.rm-st-sel` count 0, sem botões); `:107-108` `metas toEqual(D.metas)`, `planos toEqual(D.planos)`; `:100` `'85%'` | Sim |
| M5-31.7 2º/3º preservam anteriores | planos idênticos | `e2e/m5-ciclos.spec.ts:140` `planos[0] toEqual(p1)`; `:141` `[['a','nao_concluida'],['b','concluida']]`; unit `tests/ciclos.test.ts:255-257` | Sim |
| Edge: apagar todas as metas, estado vazio | sem erro | `e2e/rumo-painel.spec.ts:76` (pré-existente, RUM-40.2); `e2e/m5-ciclos.spec.ts:118-119` (arquivado sem metas, `erros toEqual([])`) | Sim |
| Edge: pessoa removida da Missão 2 | conversa mantida, "pessoa removida" | `e2e/m5-feedback.spec.ts:137-139` (`'pessoa removida'`, `'texto guardado'`, `feedbacks toEqual([sai])`); unit `tests/feedback.test.ts:120-122` | Sim |
| Edge: cancelar não altera nada | nada muda | `e2e/m5-ciclos.spec.ts:58-59` `metas toEqual(PLANO.D.metas)`, `planos toEqual([])` | Sim |

**ACs conferidos: 7/7 requisitos (M5-01, 02, 10, 20, 21, 30, 31), 25/25 linhas acima cobertas com `file:line` e valor asserido; 3 edge cases cobertos.**

## Verificações adicionais

| Item | Resultado |
| ---- | --------- |
| (a) Hash dos textos da Missão 5 | Igual (`tests/legado-m5.test.ts:166` passa). `conteudo.js`, `guia.js`, `novos.js`, `m2.js` e `lib/types.ts`/`ilhas/equipe/*` não aparecem em `git diff 2a6b32e..3ba1372` |
| (b) Arquivos do usuário nos commits | `ilhas/rumo/Espacos.tsx` aparece na faixa por `1b2d891 feat(capital)` (Missão 4: apenas `casaDe` passou a `export`), não por commit `m5`. `lib/types.ts` e `ilhas/equipe/*` não foram commitados. Nenhum commit `m5` tocou arquivos do usuário. Observação: `app/guia/page.tsx` ganhou `'m4', 'm5'` na mesma linha, formatado `'m5','sugestoes'` (sem espaço) |
| (c-1) Desvio T2: atingido = só `concluida`; `congelada` sai do total | **Lacuna de precisão da spec**, não violação. A spec diz "atingidos" sem definir; `concluida70` conta como não atingido (`tests/sucessos.test.ts:91`, `tests/atingimento.test.ts:166-167`). Vale registrar a decisão no spec/STATE (AD-005 só cobre planejamentos) |
| (c-2) Metas copiadas com `status "não concluída"` | **Lacuna de precisão da spec**, não violação. M5-30.4 diz "metas escolhidas (sem sucessos copiados)" e não fala do status; está registrado em AD-005 (`.specs/STATE.md:30`) e testado (`tests/ciclos.test.ts:229`) |

## Discrimination Sensor

Worktree isolado em diretório temporário curto (path longo falhou no Windows), `node_modules` por junção; HEAD = 3ba1372. Rodados só os testes relevantes.

| # | Mutação | File:line | Killed? |
| - | ------- | --------- | ------- |
| 1 | Inverter condição do atingimento por sucessos (`if (lista.length)` para `if (!lista.length)`) | `lib/atingimento.ts:70` | Morto (testes `tests/atingimento.test.ts` falham, ex. `:150`) |
| 2 | `arquivarEIniciar` deixa de copiar o plano para `D.planos` | `lib/ciclos.ts:138` | Morto (6+ falhas em `tests/ciclos.test.ts`) |
| 3 | `arquivarEIniciar` copia os sucessos para as metas novas | `lib/ciclos.ts:133` | Morto (`tests/ciclos.test.ts:229`) |
| 4 | `mapaFeedback` conta N errado (`+1`) | `lib/feedback.ts:183` | Morto (`tests/feedback.test.ts:14`, `:21`, `:38`) |
| 5 | `migraAntigo` perde o texto de `pontos` | `lib/feedback.ts:223` | Morto (`tests/feedback.test.ts:89`) |
| 6 | `atingidos` passa a contar `concluida70` como atingido | `lib/sucessos.ts:50` | Morto (`tests/sucessos.test.ts:91`) |
| 7 | `abrirCiclo` muta `D.planos[0]` ao ler (leitura deixa de ser pura) | `lib/ciclos.ts:152` | **Sobreviveu** no unitário (`tests/ciclos.test.ts` 10 pass): nenhum teste unitário chama `abrirCiclo` com um arquivado existente e depois compara `D`. A cobertura de somente leitura é só e2e (`e2e/m5-ciclos.spec.ts:107-108`), e não consegui executar o e2e sobre a cópia (Turbopack não aceita a junção de `node_modules`; as rodadas e2e que passaram na cópia bateram num servidor da porta 3000 da árvore real, então são inválidas e foram descartadas). Mutantes de UI (campos editáveis no arquivado; `NovoCiclo` ignorando as metas escolhidas) **não foram avaliados** |

**Sensor depth**: lightweight (7 mutações). **Result**: 6/7 mortos; 1 sobrevivente (baixa gravidade). Isolamento: worktree removido, junção removida, `node_modules` real intacto; o `git status` da árvore real só difere do baseline pelo commit externo `23e9789` (Missão 4).

## Lacunas ranqueadas (nenhuma bloqueia o PASS)

1. Mutante 7 sobrevivente: falta asserção de que `abrirCiclo` não altera `d` quando há arquivado. Sugestão: em `tests/ciclos.test.ts:260-266`, arquivar antes e comparar `foto(d)` depois de `abrirCiclo(d, 1)`. (M5-31.6, `lib/ciclos.ts:151`)
2. Precisão da spec: "atingido" não está definido (só `concluida`? `concluida70`?). Desvio T2 em `lib/sucessos.ts:48-52` sem registro em spec/STATE. (M5-02.5)
3. Precisão da spec: status das metas copiadas ao novo planejamento (`lib/ciclos.ts:133`) fica só no AD-005. (M5-30.4)
4. Sem e2e do clique real do botão do monitoramento e dos botões dentro do Guia (M5-10.2, M5-31.1, M5-31.2): cobertos por teste unitário de HTML (`tests/legado-m5.test.ts:184-185,255-256,275-277`).
5. Mutantes de UI não avaliados pelo sensor (limitação de ambiente).
