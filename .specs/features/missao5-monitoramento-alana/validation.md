# Validation: missao5-monitoramento-alana — PASS ✅

**Date**: 2026-11-12
**Spec**: `.specs/features/missao5-monitoramento-alana/spec.md`
**Diff range**: `d30caca..HEAD` (HEAD = `1ed4f78`, branch `feat/m5-monitoramento-alana`; 8 commits, `c4298fd`..`1ed4f78`)
**Verifier**: independent sub-agent (author ≠ verifier)

**Verdict**: PASS com lacunas não bloqueantes (nenhum mutante unitário sobrevivente que não seja equivalente; ACs MON-01..04 e FBK-01 com evidência; 4 lacunas de cobertura/precisão listadas abaixo).

---

## Task Completion

Tarefas e rastreabilidade fechadas no commit `1ed4f78` (spec: MON-01..04 e FBK-01 em Done). Código do app alterado: `plataforma/public/legacy/m5.js`, `plataforma/lib/feedback.ts`, `plataforma/ilhas/rumo/{Plano,Feedback}.tsx`, `textosAlana.ts`, `feedback.css`. Fora de `plataforma/` o diff traz só `.specs/` e arquivos regeneráveis de `graphify-out/`.

---

## Spec-Anchored Acceptance Criteria

Linhas de teste citadas no HEAD (`1ed4f78`). Unit = `node --test`; e2e = Playwright (não executados por mim, ver Gate).

| Critério | Resultado definido na spec | `file:line` + asserção | Resultado |
| --- | --- | --- | --- |
| MON-01.1 abre `m5.monit` → texto #129 + passo a passo em 2 etapas | os 3 parágrafos da #129 e "Primeiro/Segundo passo" | `plataforma/tests/legado-m5.test.ts:61` — `for (const p of MONIT_INTRO) assert.ok(html.includes(p), p)`; texto do #129 fixado em `plataforma/tests/textosAlana.test.ts:6` — `join(' ').includes('o percentual corresponde ao todo, e não ao mês')`. Passo a passo em duas etapas (`Primeiro passo:` / `Segundo passo:`, `m5.js:359-360`) **sem asserção** | ⚠️ Parcial: texto #129 PASS; as 2 etapas sem evidência (lacuna 3) |
| MON-01.2 "Abrir Planejamento Estratégico" → `#/plano` | link para `#/plano` | `plataforma/tests/legado-m5.test.ts:61` — `assert.match(html, /<a class="bt pri" href="#\/plano">Abrir Planejamento Estratégico<\/a>/)` | ✅ PASS |
| MON-01.3 `conteudo.js` intacto, troca por gancho em `m5.js` | hash dos textos igual | `plataforma/tests/legado-m5.test.ts:27` e `:31` — `assert.equal(hashM5(w.MISSOES), HASH_TEXTOS)` | ✅ PASS |
| MON-02.1 aba Planejamento mostra o botão no topo junto do atingimento total | botão "Registrar detalhes sobre o atingimento das metas no Monitoramento" | `plataforma/e2e/m5-monitoramento.spec.ts:20-26` — `expect(botao).toBeVisible()`; texto em `plataforma/tests/textosAlana.test.ts:17` — `assert.equal(BOTAO_MONIT, 'Registrar detalhes …')`. "Junto do atingimento total" não é asserido (só visível) | ✅ PASS (posição: lacuna menor) |
| MON-02.2 botão abre `#/m/5/m5.monit` rolado até a meta em foco; sem foco, topo | hash `#/m/5/m5.monit`; foco = id da meta | `plataforma/e2e/m5-monitoramento.spec.ts:25` — `expect(await hash(page)).toBe('#/m/5/m5.monit')`; `:31` — `expect(await foco(page)).toBeUndefined()`; `:38` — `expect(await foco(page)).toBe('b')`; `:45` — `expect(await foco(page)).toBe('a')` (link "Detalhar no Monitoramento"); unit do lado do legado `plataforma/tests/legado-m5.test.ts:108-115` — `assert.equal(a.html.split('data-foco').length - 1, 1)`, `assert.equal(a.janela.MonitFoco, undefined)`. O `scrollIntoView` em si não é asserido | ✅ PASS (rolagem: lacuna 4) |
| MON-02.3 plano arquivado esconde o botão | botão e links ausentes | `plataforma/e2e/m5-monitoramento.spec.ts:55-56` — `toHaveCount(0)` para o botão e `/no Monitoramento$/`; a estrutura (ramo `if (arquivado)` retorna antes de `rm-plano-acoes`, `Plano.tsx:191`) confirma | ✅ PASS (e2e; sensor não aplicável, ver abaixo) |
| MON-03.1 por meta: número, objetivo, texto, responsável, 3 meses em sanfona, caixa com rótulo #128 e as 2 perguntas acima | 3 caixas `mon.<id>.<mes>.det`; rótulo e perguntas | `plataforma/tests/legado-m5.test.ts:76` — `assert.ok(html.includes(\`data-k="mon.${id}.${mes}.det"\`))`; `:77` — `!html.includes('data-k="mon.m1.4.det"')`; `:78` — `split(MONIT_ROTULO).length - 1` igual a 6; `:79` — cada pergunta 6 vezes. "Objetivo" da meta não aparece no cartão (`m5.js:327-347` só tem número, texto, responsável) e **não é asserido** | ✅ PASS em caixas/rótulo/perguntas; ⚠️ "objetivo" (lacuna 2) |
| MON-03.2 digitar grava com salvamento automático e mostra "Salvo automaticamente" | autosave do Guia | Sem teste nesta feature; o cartão usa `data-k` com a mesma chave que o Guia grava (`legado-m5.test.ts:76` prova só a chave). "Salvo automaticamente" não asserido | ⚠️ Herdado do Guia, sem evidência própria (lacuna 1) |
| MON-03.3 percentual do Planejamento só leitura + link "alterar" | `60%`, `—` p/ congelada, sucessos = atingidos/total | `plataforma/tests/legado-m5.test.ts:83-86` — `/<small>60%<\/small>/` e `/href="#\/plano"[^>]*>alterar<\/a>/`; `:91` — `/<small>50%<\/small>/` (1 de 2 sucessos não congelados); `:93` — `/<small>—<\/small>/` | ✅ PASS |
| MON-03.4 sem metas mantém o aviso | texto "As metas da Missão 3 aparecem aqui assim que forem escritas." | `plataforma/tests/legado-m5.test.ts:97` — `assert.match(html, /As metas da Missão 3 aparecem aqui assim que forem escritas\./)` e `:98` botão ainda presente | ✅ PASS |
| MON-03.5 deixa de mostrar e contar `mon.*` antigos | só `det` em `CAMPOS_MONIT`; sem os 6 campos | `plataforma/tests/legado-m5.test.ts:68-70` — `!html.includes('tabela original')` e `!/data-k="mon\.m1\.\d\.(sucesso\|result\|pct\|desafios\|oport\|read)"/.test(html)`; `:56-58` — `assert.deepEqual([...campos.map((c) => c[0])], ['det'])` (garante que a contagem não vê os antigos); Resumo: `:241` — `assert.ok(!r.includes('texto antigo'))` | ✅ PASS |
| MON-03.6 texto em qualquer caixa conta como "em andamento" (`estadoEx`) | estado "em andamento" | Sem teste direto de `estadoEx`. Indireto: `CAMPOS_MONIT` reduzido a `det` (`legado-m5.test.ts:58`, mutante M7 morto) e a caixa com texto abre o mês `:105-106`. Nenhuma asserção do estado | ⚠️ Sem asserção do resultado (lacuna 1) |
| FBK-01.1 orientação #130 antes do mapa | texto presente e antes do `.fb-arvore`; sem "Pedro Salvar" | `plataforma/e2e/m5-feedback.spec.ts:74-75` — `toContainText('Os registros a seguir devem ser realizados pela Chefia de Gabinete')`, `not.toContainText('Pedro Salvar')`; `:80-81` — `expect(ordem).toBe(true)` (`compareDocumentPosition`); unit `plataforma/tests/textosAlana.test.ts:24` — `!t.includes('Pedro Salvar')` | ✅ PASS (e2e) |
| FBK-01.2 formulário: data, 2 destaques, 2 ajustes, resumo do plano, cada um em seu campo, com ajuda da Alana em cada campo | 6 campos rotulados | `plataforma/e2e/m5-feedback.spec.ts:68-69` — `for (const r of ['Ponto de destaque 1', …, 'Resumo do plano de ação']) expect(form.getByLabel(r)).toBeVisible()`; `plataforma/tests/feedback.test.ts:144-150` — `d1/d2/a1/a2` guardados e `destaques === 'Entrega no prazo\nBoa escuta'`. "Ajuda da Alana em cada campo": `Feedback.tsx` só põe `aj` em destaque 1, ajuste 1 e resumo (faltam data, destaque 2, ajuste 2); **sem asserção** | ✅ PASS nos campos; ⚠️ ajuda em todos (lacuna 2) |
| FBK-01.3 salvar/editar/apagar atualiza "feitas X de Y" e feita/pendente | contadores e situação | `plataforma/e2e/m5-feedback.spec.ts:110-112` — `toContainText('feitas 1 de 2')`, `pessoa(page, 3)` contém `feita`; editar `:131-144` e apagar `:146-155` (testes pré-existentes, ainda válidos); sem preencher nada `:92-93` — `toHaveLength(1)` + `'feitas 1 de 2'` | ✅ PASS |
| FBK-01.4 aviso de acesso restrito perto do mapa, só texto, nada bloqueado | texto "Acesso restrito"; formulário continua habilitado | `plataforma/e2e/m5-feedback.spec.ts:76` — `[data-acesso-restrito]` `toContainText('Acesso restrito')`; `:84` — botão "Salvar conversa" `toBeEnabled()` | ✅ PASS |
| FBK-01.5 grava campos novos em `D.feedbacks` e espelha para o Resumo (`paraGuia`); formato antigo sem os novos | `pontos`/`encam` montados; antigas lidas | `plataforma/tests/feedback.test.ts:171-173` — `assert.equal(v.pontos, 'Entrega no prazo\nBoa escuta\nPontos de ajuste: Atualizar o monitoramento\nMais devolutiva escrita')`, `assert.equal(v.encam, 'Reunião semanal')`; antigas `:182-183` — `pontosDe(...)` igual a `{ d1: 'Antigo D', … }`; Resumo `plataforma/tests/legado-m5.test.ts:246-250` — `h.includes('Boa entrega')`…; e2e `plataforma/e2e/m5-feedback.spec.ts:107` — `toMatchObject({ … d1: 'Boa entrega', …, destaques: 'Boa entrega\nBoa escuta', … })` | ✅ PASS |
| MON-04.1 Resumo lista o texto do Monitoramento por meta e por mês | `Meta 01 — … / 2º monitoramento / Detalhamento do mês: <texto>`; sem texto antigo; meta sem texto = "não preenchido" | `plataforma/tests/legado-m5.test.ts:240` — `assert.match(r, /Meta 01 — Aprovar 2 projetos<\/dt><dt>2º monitoramento<\/dt><dd><strong>Detalhamento do mês:<\/strong> Aprovamos o primeiro projeto<\/dd>/)`; `:241` — `!r.includes('texto antigo')`; `:242` — `/Meta 02 — Visitar escolas<\/dt><dd><span class="sem">não preenchido<\/span><\/dd>/` | ✅ PASS |

### Casos de borda

| Caso | Evidência | Resultado |
| --- | --- | --- |
| Meta removida na M3 com texto: guardado e some da tela | Comportamento estrutural (o cartão itera `D.metas`; chaves ficam em `D.campos`). Sem teste | ⚠️ Sem evidência (lacuna 3) |
| Meta congelada continua no Monitoramento, percentual "—" | `plataforma/tests/legado-m5.test.ts:93` — `assert.match(cong, /<small>—<\/small>/)` | ✅ PASS |
| Mandato sem metas: só explicação e botão | `plataforma/tests/legado-m5.test.ts:97-98` | ✅ PASS |
| Planejamento arquivado: sem botão e sem edição de percentual | botão: `plataforma/e2e/m5-monitoramento.spec.ts:55-56`; edição: `opcoes={{ onStatus: () => {}, leitura: true }}` em `Plano.tsx:203`, sem teste novo (herdado) | ✅ PASS (botão); herdado (edição) |
| Mandato novo: caixas vazias; texto do anterior fica no arquivado | Sem teste. As chaves são por `m.id` e as metas do novo plano têm ids novos, o que dá o comportamento, mas não há asserção | ⚠️ Sem evidência (lacuna 3) |

**Status**: ⚠️ Spec-precision / cobertura: nenhum AC sem implementação; 4 lacunas não bloqueantes. Gaps de precisão da spec: "ajuda da Alana em cada campo" (FBK-01.2) não diz o que escrever para data, destaque 2 e ajuste 2 (as sugestões #130 só dão ajuda para 3 dos 6); "junto do atingimento total" (MON-02.1) e "perto do mapa" (FBK-01.4) não são mensuráveis; MON-03.1 pede "o objetivo" mas a spec não diz de onde vem (a meta tem `pred`, mas o cartão do legado não o mostra).

---

## Discrimination Sensor

Cópia isolada: `git worktree add --detach "../m5-sensor-scratch" HEAD`, `plataforma/node_modules` por junction ao do repositório principal. Comando em cada mutante: `node --test tests/legado-m5.test.ts tests/feedback.test.ts tests/textosAlana.test.ts` (linha de base: 54 passam, 0 falham). Cada mutante foi aplicado, rodado e revertido com `git checkout` na cópia. Nunca usei `git stash`.

| # | Arquivo | Mutação | Resultado |
| --- | --- | --- | --- |
| M1 | `plataforma/public/legacy/m5.js:67-69` | chave `.det` → `.txt` na caixa | ✅ Morto (2 falhas) |
| M2 | `plataforma/public/legacy/m5.js:29` | `MESES=[1,2,3]` → `[1,2]` | ✅ Morto (1 falha) |
| M3 | `plataforma/lib/feedback.ts` (`junta`) | remover o filtro de pontos vazios | ✅ Morto (1 falha) |
| M4 | `plataforma/public/legacy/m5.js` (`pctMeta`) | congelada devolve `0` em vez de `null` | ✅ Morto (1 falha) |
| M5 | `plataforma/public/legacy/m5.js:82` | foco não é consumido (`MonitFoco` fica) | ✅ Morto (1 falha) |
| M6 | `plataforma/public/legacy/m5.js:83` | aceitar `MonitFoco` de meta inexistente (remover o `foco=null`) | ❌ Sobreviveu — **equivalente**: com id inexistente, `cartao` já compara `m.id===foco` e não marca ninguém; a única diferença é um `setTimeout` que acha `null` e é protegido por `if(el&&…)`. Sem efeito observável, sem tarefa |
| M7 | `plataforma/public/legacy/m5.js:25` | `CAMPOS_MONIT.splice` → `slice` (campos antigos voltam à contagem) | ✅ Morto (2 falhas) |
| M8 | `plataforma/lib/feedback.ts` (`pontosDe`) | conversa antiga sem fallback para `d1` | ✅ Morto (1 falha) |
| M9 | `plataforma/lib/feedback.ts` (`edita`) | não remontar `destaques/ajustes` ao editar | ✅ Morto (1 falha) |
| M10 | `plataforma/public/legacy/m5.js` (`pctMeta`) | ignorar os sucessos da meta | ✅ Morto (1 falha) |
| M11 | `plataforma/public/legacy/m5.js:68` | abrir sempre todos os meses | ✅ Morto (1 falha) |
| M12 | `plataforma/public/legacy/m5.js:361` | remover o botão "Abrir Planejamento" da explicação | ✅ Morto (2 falhas) |
| M14 | `plataforma/lib/feedback.ts` (`migraAntigo`) | descartar `d1` e `a1` ao reler | ✅ Morto (1 falha) |
| (M13) | `lib/feedback.ts` | trocar o separador `\n` por espaço | não aplicado (a expressão regular do `sed` não casou); o separador `\n` é asserido em `feedback.test.ts:149-150` e `:171` por valor |

Mutantes de camada de tela (esconder a checagem de plano arquivado no `Plano.tsx`, retirar `lembra(idx)` de `onStatus`, inverter a ordem orientação/mapa no `Feedback.tsx`): **não validados**. A cópia isolada não sobe o `next dev` com Turbopack porque a junction de `node_modules` fica fora da raiz do projeto (erro "Symlink node_modules could not be resolved … leaves the filesystem root"). Uma primeira rodada de e2e na cópia passou antes dessa falha aparecer em rodadas seguintes, então não a conto como prova de que o e2e detecta essas mutações. Os testes e2e que apontam esses comportamentos existem (`m5-monitoramento.spec.ts:49-57`, `:34-40`; `m5-feedback.spec.ts:71-85`) e passaram na rodada inicial, mas o sensor não os atacou.

**Sensor depth**: lightweight expandido (14 mutantes aplicados em unitários, 13 mortos, 1 equivalente). Feature não é P0.
**Resultado**: 13/13 mutantes não equivalentes mortos — PASS ✅. Limitação: camada e2e sem sensor.

Isolamento: `git status --porcelain` do worktree real vazio antes e depois (o `validation.md` é o único arquivo novo desta tarefa); cópia removida com `git worktree remove --force`; junction removida sem tocar no alvo; servidor de teste na porta 3100 encerrado.

---

## Code Quality

| Princípio | Status |
| --- | --- |
| Mínimo de código | ✅ (textos da Alana em `textosAlana.ts`, 31 linhas, sem camadas extras) |
| Mudanças cirúrgicas | ✅ (`conteudo.js` intocado, troca por gancho em `m5.js`; AD-003) |
| Sem escopo extra | ✅ (diff de código só em Monitoramento, Planejamento e Feedback) |
| Segue padrões existentes | ✅ (mesmo estilo de `Comp.monit` do gancho anterior; `data-*` para e2e) |
| Spec-anchored: valores asseridos batem com a spec | ✅ nos ACs listados; ⚠️ nas lacunas |
| Teste por AC, sem testes sem dono | ✅ (todos os testes novos citam MON/FBK/Q) — exceção: `legado-m5.test.ts:117` e `:56` citam AD-2/sem ID de AC, mas cobrem MON-01/MON-04 |
| Diretrizes documentadas | none — strong defaults applied |

Observação de duplicação aceita e protegida: o legado (`m5.js`) repete os textos de `textosAlana.ts`; o teste `plataforma/tests/legado-m5.test.ts:117-121` (`CODIGO.includes(t)`) impede divergência. `pctMeta` do legado replica `lib/atingimento.ts`; não há teste de paridade entre os dois (risco baixo, ver lacuna 5).

---

## Gate Check

- **Comando**: `node --test tests/legado-m5.test.ts tests/feedback.test.ts tests/textosAlana.test.ts` (em `plataforma/`, na cópia limpa de HEAD) — rodado por mim.
- **Resultado**: 54 passam, 0 falham, 0 ignorados (linha de base antes de qualquer mutação).
- **e2e**: não rodei `npm run test:e2e` completo (instrução). Há 19 e2e antigos já falhando na linha de base (rumo-plano, m5-ciclos, m23-plano, m5-sucessos), confirmados sem as mudanças desta feature; não contam como regressão. Na cópia, `e2e/m5-monitoramento.spec.ts` rodou uma vez com 5/5 passando; `m5-feedback.spec.ts` não foi rodado por mim.
- **Testes novos na feature (diff de `tests/`)**: `legado-m5.test.ts` +124/−13 linhas, `feedback.test.ts` +48, `textosAlana.test.ts` +26 (4 testes). e2e: `m5-monitoramento.spec.ts` (5 testes novos), `m5-feedback.spec.ts` (+2 novos e 5 ajustados).
- **Integridade**: os testes de hash de `conteudo.js` seguem iguais (`legado-m5.test.ts:27`, `:31`). Dois testes antigos de gancho ("o corpo original do monitoramento continua inteiro", M5-10.2) foram substituídos pelos novos, já que o corpo antigo deixou de existir por decisão do Pedro (Q2); não é enfraquecimento.

---

## Fix Plans (não bloqueantes, ranqueadas)

1. **MON-03.6 / MON-03.2 sem asserção do resultado** (Major-baixo). Testar `estadoEx` com um `mon.<id>.<mes>.det` preenchido e ver `em andamento` (guia.js:445 / app.js), e "Salvo automaticamente" no e2e do Monitoramento. Verify: teste que falha se `CAMPOS_MONIT` perder o `det`.
2. **FBK-01.2 ajuda em cada campo + MON-03.1 "objetivo"** (Minor). `Feedback.tsx` só tem texto de apoio em 3 dos 6 campos e o cartão do Monitoramento não mostra o objetivo da meta. Decidir com o Pedro/Alana se a spec exige (e escrever o texto de apoio faltante) ou ajustar a spec.
3. **Bordas sem teste** (Minor): meta removida com texto, mandato novo com caixas vazias, e as duas etapas do passo a passo (`m5.js:359-360`). Um teste unitário de 5 linhas para cada.
4. **Rolagem até a meta (`scrollIntoView`)** não verificada (Minor); o e2e checa só o `MonitFoco` e o hash. Um e2e que abre o Monitoramento a partir do Planejamento e confere que `[data-foco]` está visível.
5. **Sensor na camada e2e** (Minor/infra): mutantes de `Plano.tsx`/`Feedback.tsx` não foram aplicados. Rodar numa cópia com `node_modules` físico (não junction) ou num worktree dentro da raiz com a árvore real. `pctMeta` (legado) sem teste de paridade com `lib/atingimento.ts`.

---

## Requirement Traceability Update

| Requisito | Status anterior | Novo status |
| --- | --- | --- |
| MON-01 | Done | ✅ Verified (passo a passo em 2 etapas sem asserção) |
| MON-02 | Done | ✅ Verified (rolagem não asserida) |
| MON-03 | Done | ✅ Verified (MON-03.2 e MON-03.6 herdados, sem asserção direta) |
| MON-04 | Done | ✅ Verified |
| FBK-01 | Done | ✅ Verified (ajuda em cada campo parcial) |

---

## Summary

**Overall**: ✅ Ready, com lacunas não bloqueantes

**Spec-anchored check**: 14 de 17 ACs/sub-ACs batem com o resultado da spec (MON-01.2, 01.3, 02.2, 02.3, 03.1 caixas/rótulo, 03.3, 03.4, 03.5, FBK-01.1, 01.3, 01.4, 01.5, MON-04.1 e MON-02.1); 3 parciais (MON-01.1 etapas, MON-03.2, MON-03.6) e 2 lacunas de precisão da spec (FBK-01.2 ajuda em cada campo, MON-03.1 "objetivo").
**Sensor**: 13/13 não equivalentes mortos, 1 equivalente (M6); camada e2e sem sensor.
**Gate**: 54 passam, 0 falham (unitários).

**What works**: caixa por meta e por mês com a chave `det`, percentual só leitura, foco vindo do Planejamento, botão ausente no arquivado, textos da Alana iguais nos dois lugares, campos separados do feedback com espelho para o Resumo, leitura de conversas antigas.

**Issues found**: ver Fix Plans.

**Next steps**: lacunas 1 e 2 antes da publicação, se o Pedro quiser a spec cumprida ao pé da letra; as demais podem ir para o backlog.
