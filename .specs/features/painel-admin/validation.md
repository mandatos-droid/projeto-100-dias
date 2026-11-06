# painel-admin Validation

**Date**: 2026-11-06
**Spec**: `.specs/features/painel-admin/spec.md`
**Diff range**: `7b0942c..db72024` (branch `feat/painel-admin`; a iteração 1 verificou até `80d732a`; esta iteração 2 re-verificou `00b95ad..db72024`: 9 commits de correção F1 a F9, 12 arquivos, +249/-36)
**Verifier**: sub-agente independente (autor != verificador), iteração 2 de no máximo 3. Árvore real somente leitura; mutações só num scratch fora do repositório.

## Validation summary - PASS

**Result**: PASS

Todos os critérios ADM-01 a ADM-16 e os 7 Edge Cases têm evidência `file:line` + asserção, e as 8 lacunas ranqueadas da iteração 1 foram fechadas com correção verificada. Dos 9 mutantes relevantes que sobreviveram na iteração 1, 8 agora morrem; o E10 segue sobrevivendo por limite de projeto documentado e aceitável (ver Sensor). Das 13 mutações novas, 11 morreram e 2 sobreviveram por serem equivalentes (comportamento idêntico). Gates verdes em 3 rodadas seguidas e em 20 repetições de Equipe e de Mandatos (sem intermitência). Nenhuma lacuna relevante restante; só observações de baixo risco.

### Histórico (iteração 1, FAIL)

A iteração 1 (73 mutações, 61 mortas, 12 sobreviventes) reprovou por: (1) e2e intermitente em `admin-equipe.spec.ts` (~7%), (2) gatilho `arquivado_em` aceitando `leitura` sem teste (V5), (3) testes de ausência de ADM-01.1/01.2 que passavam cedo (EA2, EB). Outros sobreviventes: M13 (`search_path` sem teste), E14 (flag `NUVEM`), E1t, E6b, E8, E10, e a lista de Mandatos sem `lerTudo` (teto de 1.000). A iteração 1 também registrou um incidente de ambiente (junção de `node_modules` seguida por `git worktree remove --force`); nesta iteração nenhum link foi criado (ver Integridade).

### Correções F1 a F9 (resumo)

| Commit | O que mudou | Lacuna da iteração 1 |
| ------ | ----------- | -------------------- |
| `5567be0` | `admin-equipe.spec.ts:235` espera `toHaveCount(3)` antes de mexer no banco | 1 |
| `5f0c8f3` | `sql-admin-mandatos.test.ts:194-205` cobre `leitura` + membro no gatilho | 2 |
| `9c2c690` | `esperaSemChamadas`/`esperaSemMandatos`/`esperaSemRpc` em `e2e/admin-api.ts:42-58` (rede quieta + 1,2 s), usados em acesso, equipe e detalhe | 3 |
| `cdbaeea` | `app/admin/page.tsx:36` lê com `lerTudo` e `order=ultima_atividade.desc,id`; e2e com 1.120 mandatos (`admin-mandatos.spec.ts:48`) | 4 |
| `ff56547` | `tests/sql-admin-funcoes.test.ts` lê `pg_proc` (`prosecdef`, `proconfig`, `has_function_privilege`, `proacl`) | 5 |
| `834852a` | `admin-uso-registro.spec.ts:75-91` isola `NUVEM` com `Nuvem.tok` e `CONFIG` | 6 |
| `22eb009` | `vazou()` refatorado em `chavesProibidasEm`/`pedidoCitaChaves` + autoteste `e2e/admin-helper.spec.ts` (8 testes); regex sem âncora em `admin-transversal.spec.ts:141` | 7 |
| `7a8dff1` | duplo clique com `seguraRpc`: `toBeDisabled()` no botão e em Cancelar, 2 `requestSubmit()` simultâneos, `pedidos()` igual a 1 | 8 |
| `db72024` | 8 linhas de Assumptions na spec (precisão) | 9 |

Única mudança de código de produção: `plataforma/app/admin/page.tsx` (leitura paginada de Mandatos).

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 a T36 | Done | `tasks.md` com as caixas de T1 a T36 marcadas |
| T37 (spec da Fase 2) | Pendente de propósito | só começa depois do PASS do Verifier da feature |

---

## Gate Check

- **Comandos**: `npm test`, `npx tsc --noEmit`, `npx playwright test -c playwright.isolado.config.ts e2e/admin-` (config isolado, `next dev` do worktree na porta 3100; `curl /admin` = 200). `npm run build` NÃO rodado (instrução do orquestrador).
- **Unit/SQL (`npm test`)**: 725 testes, 725 passam, 0 falham, 0 pulados (721 na iteração 1: +3 em `sql-admin-funcoes.test.ts`, +1 em `sql-admin-mandatos.test.ts`). Repetido depois da limpeza do scratch: 725/725.
- **tsc**: `npx tsc --noEmit` sai com 0, sem mensagens.
- **e2e `e2e/admin-`**: rodada 1: 125 passaram (2,2 min); rodada 2: 125 (2,2 min); rodada 3: 125 (2,1 min); 0 falhas, 0 pulados (116 na iteração 1: +8 do autoteste do ajudante, +1 do teste de 1.120 mandatos).
- **Intermitência**: `--repeat-each=20` de `e2e/admin-equipe.spec.ts`: 360 passaram, 0 falhas (5,7 min); de `e2e/admin-mandatos.spec.ts`: 300 passaram, 0 falhas (4,0 min). A iteração 1 media ~7% de falha no teste antigo `:221` (hoje `:231`); agora 0 em 360 execuções do arquivo todo.
- **Test integrity**: `git diff 00b95ad..HEAD` em `tests/` e `e2e/` só tem acréscimos e endurecimentos; nenhum teste removido. Asserções trocadas: `chamou(x)).toBe(0)` e `chamadasDeMandatos()).toEqual([])` viraram `esperaSemRpc`/`esperaSemMandatos` (mais fortes: esperam). A segunda linha de `admin-acesso.spec.ts:31` (filtro `v_admin|mandatos`) foi absorvida por `ehDeMandatos` em `admin-api.ts:45`, que cobre `v_admin_|^mandatos|^eventos|rpc/admin_mandato|rpc/admin_membro` (mais ampla). A âncora `^` removida do regex ALTERA tornou o teste mais sensível.
- **Regressão da leitura paginada de Mandatos**: nenhuma. Os testes de `admin-mandatos.spec.ts` (ordem, filtros, "X dias parado", "Parado há", 25 por página, vazio, erro, celular) seguem verdes em 20 repetições; a ordem continua por `ultima_atividade.desc` (o `,id` só desempata) e `lerTudo` tem testes unitários de fronteira (`tests/admin-api.test.ts`; mutantes T10, T11, N3, N16 mortos).

---

## Spec-Anchored Acceptance Criteria

Legenda: PASS = asserção localizada e igual ao resultado da spec; GAP = sem asserção ou asserção que não discrimina; SPEC? = a spec não define o resultado com precisão. Caminhos relativos a `plataforma/`. "SQL" = PGlite com `auth` simulado e privilégios padrão do Supabase.

### ADM-01 e ADM-02: entrar no /admin e papéis (spec: P1 Entrar, AC 1 a 10)

| AC | Resultado da spec | `file:line` + asserção | Situação |
| -- | ----------------- | ---------------------- | -------- |
| 1.1 sem sessão | tela de entrada (Google e e-mail), nenhum dado de mandato | `e2e/admin-acesso.spec.ts:25-29` `getByRole('button',{name:'Entrar com Google'})`, `getByLabel('E-mail'/'Senha')` visíveis, `tbody tr` count 0; `:30` `expect(chamadasDeMandatos()).toEqual([])` | PASS; a parte "nenhum dado" agora espera ~1,2 s + rede quieta: `admin-acesso.spec.ts:31` `expect(await esperaSemMandatos(page)).toEqual([])` (EB morto) |
| 1.2 sem linha em equipe | "Sem acesso" e nenhuma consulta de mandatos | `admin-acesso.spec.ts:36` heading "Sem acesso"; `:39` `chamadasDeMandatos()` `[]`; `:41` `caminho.startsWith('equipe_legisla')` length 1 | PASS; `:39` `expect(await esperaSemMandatos(page)).toEqual([])` (EA2 morto, pelo teste `:34`) |
| 1.3 papel admin/leitura | abre em Mandatos com menu Equipe, Mandatos, Analytics, Logs e link /painel | `admin-acesso.spec.ts:61` heading Mandatos; `:64` `toHaveText(['Equipe','Mandatos','Analytics','Logs','Painel de métricas (/painel)'])`; `:66` `href '/painel'` | PASS |
| 1.4 reaproveita `legisla.tok` | sem novo login | `admin-acesso.spec.ts:58-69` (`Entrar com Google` count 0 depois de semear a sessão); `tests/admin-sessao.test.ts:23` chave `legisla.tok`; `:34` lê a sessão do Guia | PASS |
| 1.5 401 volta à entrada | tela de entrada | `admin-acesso.spec.ts:152-158` `.aviso` `'Sua sessão venceu. Entre de novo.'` + botão Google visível + tentou renovar; `:139-143`, `:145-149` | PASS |
| 2.6 leitura sem botões, seletores desabilitados | nenhum Incluir/Remover/Editar/Adicionar/Arquivar/Excluir; seletores de papel desabilitados | `admin-acesso.spec.ts:121-127` count 0 por nome + `habilitados` `toEqual(['UF','Casa','Situação','Parado há'])`; `admin-equipe.spec.ts:246-255` `seletores.nth(i)).toBeDisabled()`; `admin-detalhe.spec.ts:304-315`; `admin-logs.spec.ts:177-187`; `admin-analytics.spec.ts:309`; `admin-transversal.spec.ts:139-148` | PASS (mutantes E1, E2 e E1t mortos) |
| 2.7 escrita direta de `leitura` recusada | erro de permissão, nada muda | `tests/sql-admin-equipe.test.ts:164-178` `assert.rejects(chama(sql,args), SEM_PERMISSAO)` para leitura/gabinete/fora e `/permission denied/` para anônimo; `tests/sql-admin-mandatos.test.ts:164-181` idem para as 5 funções de mandato; `:180-185` escrita direta em `equipe_legisla` recusada até para admin; `:187-199` auditoria | PASS nas funções e no gatilho: `sql-admin-mandatos.test.ts:194-205` `assert.rejects(chama(update ... arquivado_em), SEM_PERMISSAO)` para `leitura` que é membro, arquivar e desarquivar (V5 morto) |
| 2.8 fora da equipe | erro de permissão ou 0 linhas | `tests/sql-admin-leitura.test.ts:34` `(await q(select * from v_admin_*)).length` 0 para membro e fora e `:38` `/permission denied/` para anônimo; `sql-admin-equipe.test.ts:64-80`; `sql-admin-mandatos.test.ts:32-44` | PASS |
| 2.9 só admin/leitura; `analista` vira `leitura` | constraint + conversão | `sql-admin-equipe.test.ts:43` `papel` `'leitura'`; `:44-47` `rejects(..., /equipe_legisla_papel_check/)` | PASS |
| 2.10 papel lido a cada chamada | troca vale na chamada seguinte | `tests/sql-ambiente.test.ts:73-83` (fora sem acesso, depois com, depois sem); `sql-admin-equipe.test.ts:136-140` (admin rebaixado/promovido por fora vale na chamada seguinte) | PASS |

### ADM-03: gerir a equipe

| AC | Resultado da spec | `file:line` + asserção | Situação |
| -- | ----------------- | ---------------------- | -------- |
| 3.1 lista | nome, e-mail, papel, entrada; da mais antiga à mais recente | `sql-admin-equipe.test.ts:57-60` `deepEqual([[nome,email,papel]...])` com Lia (jan) antes de Ana (fev); `e2e/admin-equipe.spec.ts:84` `thead th` `['Nome','E-mail','Papel','Desde','']`, `:86-93` ordem e datas `16/10/2026`, `20/10/2026`, `03/11/2026` | PASS |
| 3.2 incluir | inclui com o papel e mostra | `admin-equipe.spec.ts:125-131` count 4, `Papel de Diego Reis` `'admin'`, `escritas()` `['rpc/admin_equipe_incluir']`; `sql-admin-equipe.test.ts:103` | PASS |
| 3.3 busca por e-mail | exato, sem caixa/espaços, no máximo 1, só admin | `sql-admin-equipe.test.ts:85-87` `'  FORA@Exemplo.com '` -> 1 linha igual a `{user_id,nome,email}`; `'fora@exemplo'` -> 0; `:91-97` leitura/gabinete recusados | PASS |
| 3.4 sem conta | "Nenhuma conta com este e-mail. A pessoa precisa entrar na plataforma uma vez." | `admin-equipe.spec.ts:137` `toHaveText(SEM_CONTA)`; `:138` `expect(await esperaSemRpc(page, 'admin_equipe_incluir')).toEqual([])`; `tests/admin-mensagens.test.ts:32` texto fixo | PASS (ausência com espera) |
| 3.5 já na equipe | "Esta pessoa já está na equipe." | `sql-admin-equipe.test.ts:115` `/Esta pessoa já está na equipe\./` e `:118-119` equipe 2 e auditoria 0; `admin-equipe.spec.ts:147` `toHaveText('Esta pessoa já está na equipe.')` | PASS |
| 3.6 trocar papel | grava e mostra | `sql-admin-equipe.test.ts:125-128`; `admin-equipe.spec.ts:178-181` `escritas()` `['rpc/admin_equipe_papel']` e `banco.equipe...papel` `'admin'` | PASS |
| 3.7 remover | sem apagar a conta | `sql-admin-equipe.test.ts:148` `auth.users` ainda 1 linha, `:152` detalhe `{nome,papel}`; `admin-equipe.spec.ts:187-197` cancelar 0 chamadas, confirmar 1 | PASS |
| 3.8 último admin | "A equipe precisa ter ao menos um admin." | `sql-admin-equipe.test.ts:133` `ULTIMO_ADMIN` (papel), `:157` (remover); `admin-equipe.spec.ts:201-219` `toHaveText('A equipe precisa ter ao menos um admin.')` | PASS (mutantes M1a, M1b mortos) |

### ADM-04: auditoria

| AC | Resultado da spec | `file:line` + asserção | Situação |
| -- | ----------------- | ---------------------- | -------- |
| 4.1 linha por ação, mesma transação | data/hora, quem, ação, alvo, detalhe | `sql-admin-equipe.test.ts:105-110` `acao 'equipe.incluir'`, `alvo_tipo`, `alvo_id`, `user_id`, `autor 'Ana Admin'`, `deepEqual(detalhe,{papel,nome,email})`; `sql-admin-mandatos.test.ts:51-55`, `:73-75`, `:97-99`, `:121-124` (arquivar/desarquivar), `:159-161` (excluir) | PASS (as 9 ações têm asserção de linha) |
| 4.2 falha da auditoria desfaz | nada muda | `sql-admin-equipe.test.ts:201-216` (gatilho que quebra a inserção; equipe igual ao início); `sql-admin-mandatos.test.ts:204-226` (5 funções) | PASS |
| 4.3 só inclusão | update/delete falham até para admin | `sql-admin-equipe.test.ts:190-193` `rejects(update/delete/insert/private.audita, /permission denied/)` | PASS (M5, M6 mortos) |
| 4.4 excluir guarda código e nome | `{codigo, nome_parlamentar}` | `sql-admin-mandatos.test.ts:161` `deepEqual(linha.detalhe,{codigo:'AAA111',nome_parlamentar:'Parlamentar Um'})` | PASS |
| 4.5 aba Ações da equipe | mais recente primeiro, 50/página, fuso de Brasília, quem fez, descrição | `e2e/admin-logs.spec.ts:108` `celulas(0)` `['04/11/2026 22:30','Autor 0','Arquivou o mandato Z00']`, `:110-112` 21:30 e 02/11 21:30; `:114-116` página 2 com 10; `:117` `limit=51&offset=0/50`; `:119-148` 10 frases | PASS; texto da "descrição" não é definido pela spec (SPEC?) |

### ADM-05: listar mandatos

| AC | Resultado da spec | `file:line` + asserção | Situação |
| -- | ----------------- | ---------------------- | -------- |
| 5.1 25 por página | colunas código, parlamentar, cargo, UF, partido, membros, última atividade | `e2e/admin-mandatos.spec.ts:29` `columnheader` `['Código','Parlamentar','Cargo','UF','Partido','Membros','Última atividade','']`, `:30` 25 linhas, `:31` `'1–25 de 60'`, `:35` `'26–50 de 60'`, `:37` 10 linhas; `tests/admin-mandatos.test.ts:114` `TAMANHO_PAGINA` 25 | PASS; leitura paginada: `admin-mandatos.spec.ts:48-58` com 1.120 mandatos, pedidos `['1000:0','1000:1000']` com `order=ultima_atividade.desc,id`, `'1–25 de 1120'` e, com "Parado há" 45, `'1–25 de 130'` (os 130 mais parados que um corte em 1.000 perderia) (N1, N2 mortos); formato da "última atividade" agora é Assumption da spec (F9) |
| 5.2 view sem texto | sem `nome_civil`, `resp_telefone`, `dados`, `eventos.texto` | `sql-admin-leitura.test.ts:55-56` `cols.filter(PROIBIDAS.includes(column_name))` `[]` sobre `information_schema.columns` de `v_admin_%`; `admin-mandatos.spec.ts:52-55` caminho `/^v_admin_mandatos\?/` e `vazou()` `[]` | PASS (M9, M9b, E7 mortos) |
| 5.3 busca | por código ou nome, sem caixa nem acento | `tests/admin-mandatos.test.ts:32-45`; `admin-mandatos.spec.ts:71-76` `fill('MARCIA avila')` -> `toContainText('Márcia Ávila')`, `fill('xyz7')` -> 'João Nunes' | PASS (T3, T3b mortos) |
| 5.4 filtros combinam | UF, casa, situação + busca | `tests/admin-mandatos.test.ts:48-62`; `admin-mandatos.spec.ts:79-94` | PASS |
| 5.5 "X dias parado" | N do seletor (padrão 45), X real | `admin-mandatos.spec.ts:127-134` `getByText('50 dias parado')` visível, `'35 dias parado'` count 0, depois com 30: `'35 dias parado'` visível, `'20 dias parado'` count 0 | PASS (E5 morto) |
| 5.6 Ver abre o detalhe | detalhe do mandato | `admin-mandatos.spec.ts:96-101` | PASS |
| 5.7 vazio | "Nenhum mandato encontrado" + limpar filtros | `admin-mandatos.spec.ts:148-153` texto visível, clique em "Limpar filtros", 4 linhas, busca `''` | PASS |
| 5.8 última atividade | maior entre `atualizado_em` e último evento; sem evento = `atualizado_em` | `sql-admin-leitura.test.ts:71-75` `deepEqual([{AAA111,'2026-03-05'},{BBB222,'2026-02-01'},{CCC333,'2026-05-01'}])`; `sql-admin-mandatos.test.ts:136` arquivar não mexe em `atualizado_em` | PASS |
| 5.9 "Parado há" filtra | só mais de N dias | `tests/admin-mandatos.test.ts:63-77`; `admin-mandatos.spec.ts:113-124` `[['7',4],['15',3],['30',2],['45',1]]` | PASS (T4 morto) |

### ADM-06 e ADM-07: detalhe e membros

| AC | Resultado da spec | `file:line` + asserção | Situação |
| -- | ----------------- | ---------------------- | -------- |
| 6.1 cadastro e andamento | cargo, casa/UF, partido, posse, responsável (nome e cargo), criado em; missões de 5, exercícios feitos, última atividade | `e2e/admin-detalhe.spec.ts:101-110` `toContainText('Deputada Federal'/'Câmara dos Deputados · SP'/'01/02/2027'/'Rafael Cruz (chefe de gabinete)'/'21/10/2026')`, `:112-114` `'Missões concluídas: 2 de 5'`, `'Exercícios feitos: 7 de 16'`, `'Última atividade: hoje'`; `sql-admin-leitura.test.ts:83` `exercicios_concluidos` | PASS; mandato arquivado mostra "Missões concluídas: —" (`:251`), comportamento que a spec não define (SPEC?) |
| 6.2 nunca texto | sem `dados`, `eventos.texto`, `nome_civil`, `resp_telefone` | `admin-detalhe.spec.ts:140-148` caminhos só `v_admin_mandatos|v_admin_exercicios|rpc/admin_membros`; colunas do `select=` sem as proibidas; corpo sem 'nome civil'/'telefone'; `vazou()` `[]`; `sql-admin-leitura.test.ts:56` | PASS |
| 7.3 lista de membros | nome, e-mail, papel, entrada | `admin-detalhe.spec.ts:155-161` `Membros (2)`, linhas e `option` `['assessoria','coordenacao']`; `sql-admin-mandatos.test.ts:36` `deepEqual([{Mario Membro, membro@gabinete.leg.br, coordenacao}])` | PASS |
| 7.4 adicionar | com o papel | `admin-detalhe.spec.ts:171-176` `Papel de Paula Reis no mandato` `'coordenacao'`, `chamou('admin_membro_adicionar')` 1; `sql-admin-mandatos.test.ts:49-55` | PASS |
| 7.5 sem conta | mesma mensagem da Equipe | `admin-detalhe.spec.ts:186` `toHaveText('Nenhuma conta com este e-mail. A pessoa precisa entrar na plataforma uma vez.')`; `:190` `chamou('admin_membro_adicionar')` 0 | PASS (ausência imediata) |
| 7.6 já é membro | "Esta pessoa já é membro deste mandato." | `admin-detalhe.spec.ts:201`; `sql-admin-mandatos.test.ts:60` | PASS |
| 7.7 trocar papel | grava e mostra | `admin-detalhe.spec.ts:209-212`; `sql-admin-mandatos.test.ts:72-75` | PASS |
| 7.8 remover | sem apagar conta nem eventos | `sql-admin-mandatos.test.ts:95-96` conta 1 linha e eventos de `IDS.fora` 1 linha; `admin-detalhe.spec.ts:218-226` | PASS |
| 7.9 última coordenação | "O mandato precisa de ao menos uma pessoa na coordenação." | `sql-admin-mandatos.test.ts:80`, `:104`; `admin-detalhe.spec.ts:233`, `:239` `toHaveText(...)` | PASS (M7 morto) |

### ADM-08: arquivar e excluir

| AC | Resultado da spec | `file:line` + asserção | Situação |
| -- | ----------------- | ---------------------- | -------- |
| 8.1 arquivar | grava data, esconde da lista e do Analytics, membros seguem acessando | `sql-admin-mandatos.test.ts:114` `arquivado_em` verdadeiro, `:116` membro ainda vê `[{id:A}]`; `sql-admin-leitura.test.ts:103` e `:94-102` (arquivado fora de `v_admin_exercicios`); `tests/admin-analytics.test.ts:21-23`, `:61-67`; `admin-detalhe.spec.ts:249-255` | PASS |
| 8.2 desarquivar | volta à lista e ao Analytics | `sql-admin-mandatos.test.ts:119` `arquivado_em` `null`; `admin-detalhe.spec.ts:256-259`; `admin-mandatos.spec.ts:89-94` filtro Arquivados | PASS |
| 8.3 botão desabilitado | enquanto o texto difere do código | `admin-detalhe.spec.ts:267-275` `confirma` `toBeDisabled()` para `K7QX2`, `k7qx29`, `K7QX29 ` (espaço), `XK7QX29`, `toBeEnabled()` com o código exato | PASS (E3 morto) |
| 8.4 excluir | apaga mandato; cascata em membros e eventos; sugestões ficam com `mandato_id` nulo | `sql-admin-mandatos.test.ts:154-157` mandatos `[B]`, membros 0, eventos 0, `deepEqual(sugestoes,[{mandato_id:null,texto:...}])`; `:141` código errado `/O código digitado não confere com o do mandato\./` | PASS (V6 morto) |
| 8.5 só por função admin | sem update/delete direto | `sql-admin-mandatos.test.ts:164-181`; `:183-192` gatilho (membro de gabinete); `:194-202` admin não membro: `affectedRows` 0 | PASS para gabinete, admin e `leitura` que é membro (`:194-205`) |

### ADM-09 a ADM-12: Analytics

| AC | Resultado da spec | `file:line` + asserção | Situação |
| -- | ----------------- | ---------------------- | -------- |
| 9.1 quatro indicadores | cadastrados (sem arquivados), ativos no período, média de concluídos, parados há mais de N | `e2e/admin-analytics.spec.ts:105` `kpis` `['5','3','5','1']`, `:106-109` rótulos; `tests/admin-analytics.test.ts:22`, `:29-53` (fronteiras exatas), `:55-59` | PASS; "ativos no período" e a formatação da média não são definidos pela spec (SPEC?) (T12 morto) |
| 9.2 período muda só ativos | funil e travas iguais | `admin-analytics.spec.ts:122-129` ativos `7->2, 15->2, 30->3, 45->4`, depois `funil`, `travas`, `mensal`, `parados` iguais ao início | PASS |
| 9.3 UF recalcula tudo | indicadores, gráficos, tabelas | `admin-analytics.spec.ts:151-176` SP: kpis `['2','2','4','0']`, imagens do mensal `Ativo 2, Parado 0`..., funil `['1 · 50%','1 · 50%','0 · 0%',...]`, travas, uso | PASS (E18 morto) |
| 10.4 gráfico mensal | colunas empilhadas, do 1º cadastro ao mês atual, máx. 12 | `tests/admin-analytics.test.ts:90-97`, `:132-142` (12 meses); `admin-analytics.spec.ts:199-205` 3 colunas com `Ativo 2, Parado 3` | PASS (T7 morto) |
| 10.5 regra Ativo/Parado e fuso | ao menos 1 linha no mês; parado = cadastrado até o fim do mês sem linha; `America/Sao_Paulo`; sem arquivados | `tests/admin-analytics.test.ts:99-114`, `:116-130` (virada de fuso), `:149-153`; `sql-admin-leitura.test.ts:115-117` (01h UTC do dia 1 ainda é o mês anterior) | PASS (T2, T2b, M10 mortos) |
| 10.6 sem mandatos | "Ainda não há mandatos cadastrados." no lugar dos gráficos | `admin-analytics.spec.ts:279-282` texto visível, `getByRole('group')` count 0, `table` count 0; `:284-286` só arquivados | PASS |
| 11.7 funil | 5 barras, número e % | `admin-analytics.spec.ts:217-220` `['Missão 1',...,'Missão 5']`, `['2 · 40%','2 · 40%','1 · 20%','1 · 20%','1 · 20%']`; `tests/admin-funil.test.ts:25-31` | PASS |
| 11.8 travas | até 10, do maior ao menor abandono, abandono = (alcançaram - concluíram) / alcançaram arredondado | `admin-analytics.spec.ts:229-240` 10 linhas com `'33%'`, `'25%'`, `'20%'`...; `tests/admin-funil.test.ts:67-122` (regra de "alcançaram", `1 de 8 = 13`, empate na ordem do Guia, corte em 10) | PASS (T1, T1b, T1c, T5, T6, T13 mortos) |
| 11.9 0 alcançaram | omite a linha | `tests/admin-funil.test.ts:101-106`; `admin-analytics.spec.ts:174` (SP com 7 linhas) | PASS (T15 morto) |
| 11.10 gráficos | título, linha de unidade, eixo com valores, legenda se houver mais de uma série | `admin-analytics.spec.ts:191-195` `.cs` `'Quantidade de mandatos em cada mês, por status'`, `.key span` 2 itens, `:209-211` `.yax span` `['5','3','2','0']`; `:262-272` `.key` count 1 / 0 / 0 | PASS |
| 12.11 "Mandatos que usaram" | calculado dos campos de `dados` | `sql-admin-leitura.test.ts:152-155`, `:163`, `:174`; `tests/admin-uso-funcionalidades.test.ts:12-37`; `admin-analytics.spec.ts:249-253` `['Persona','3','—','—'],...` | PASS |
| 12.12 sem registro | "—" em Aberturas e Tendência; "Sem registro de uso ainda" | `admin-analytics.spec.ts:253`, `:257` `getByText('Sem registro de uso ainda')`; `e2e/admin-analytics-uso.spec.ts:132-146` (view vazia e view inexistente) | PASS |

### ADM-13: Logs

| AC | Resultado da spec | `file:line` + asserção | Situação |
| -- | ----------------- | ---------------------- | -------- |
| 13.1 atividade | mais recente primeiro, 50/página, data e hora, missão, código, exercício, "texto oculto" | `e2e/admin-logs.spec.ts:51` `linhas` 50, `:52` `'05/11/2026 14:06'`, `:53` `'C126'`, `:68` 27 linhas na página 3, `:73` `limit=51&offset=0/50/100/50`, `:82` `'texto oculto'` nas 50 | PASS (E4 morto, E13 morto) |
| 13.2 sem missão | "—" | `admin-logs.spec.ts:85` `celulas(1)` `['05/11/2026 14:05','—','C125','m1.persona','texto oculto']` | PASS |
| 13.3 view sem `eventos.texto` | view sem a coluna | `sql-admin-leitura.test.ts:56` (sem coluna `texto`), `:133` `!JSON.stringify(r).includes('SECRETO')` | PASS |
| 13.4 sistema e erros | dois links em nova aba, `rel="noopener noreferrer"` | `admin-logs.spec.ts:167-171` `href`, `target '_blank'`, `rel 'noopener noreferrer'` para os dois | PASS (E12 morto); endereços não abertos em teste (a spec já registra) |

### ADM-14 e ADM-15: uso das funcionalidades (P3)

| AC | Resultado da spec | `file:line` + asserção | Situação |
| -- | ----------------- | ---------------------- | -------- |
| 14.1 grava 1 linha | `mandato_id`, funcionalidade estável, `criado_em` | `e2e/admin-uso-registro.spec.ts:44-48` `Object.keys(corpo).sort()` `['criado_em','funcionalidade','mandato_id']`, `mandato_id 'm_teste'`, `funcionalidade 'conjuntura'`; `:65-72` outra funcionalidade grava a sua; `tests/uso.test.ts:11`, `:71` | PASS |
| 14.2 sem texto/nome/e-mail/`user_id` | só 3 colunas (mais id) | `sql-uso-funcionalidades.test.ts:21-26`; `admin-uso-registro.spec.ts:44` (chaves exatas) | PASS |
| 14.3 erro ignorado | sem aviso e sem nova tentativa | `admin-uso-registro.spec.ts:94-97` `usos` length 1 após 1,5 s, `erros` `[]`, `#toast` sem classe `on`, `#tela` visível (500, 401 e rede) | PASS |
| 14.4 `NUVEM=false` | não grava | `admin-uso-registro.spec.ts:78-82` `usos` length 0 após 500 ms e `NUVEM` `false` | PASS: `admin-uso-registro.spec.ts:75-91` define `Nuvem.tok` e `CONFIG`, espera 1 s, `usos` length 0 e `[NUVEM, tok, !!CONFIG]` igual a `[false,'tok-teste',true]` (E14 morto) |
| 14.5 1 linha em 60 s | só 1 | `tests/uso.test.ts:16-33` (59 s ignora; 60 s grava); `admin-uso-registro.spec.ts:61-62` `usos` length 1 | PASS (U1, U2 mortos) |
| 14.6 inclusão só de membros; leitura só da equipe | RLS | `sql-uso-funcionalidades.test.ts:27-70` (membro insere; outro mandato e fora recusados; anônimo recusado; gabinete não lê; ninguém atualiza/apaga) | PASS (M14, M15 mortos) |
| 15.7 tabela e gráfico com registro | aberturas do período, tendência de 5 semanas, gráfico de 14 dias | `admin-analytics-uso.spec.ts:67-71` `['Persona','3','17','0 0 10 4 3'],...`, `:88-100` períodos 7/15/45, `:113-114` 14 rótulos `dd/mm: Aberturas n`; `tests/admin-uso-funcionalidades.test.ts:63-136`; `sql-uso-funcionalidades.test.ts:72-90` | PASS; a Assumption da spec que lista "Exportar PDF" e "Enviar sugestão" entre as linhas do registro não foi implementada (só "Organograma e rotinas"): SPEC? |

### ADM-16: celular

| AC | Resultado da spec | `file:line` + asserção | Situação |
| -- | ----------------- | ---------------------- | -------- |
| 16.1 360 px sem rolagem lateral | tabelas rolam no próprio quadro | `e2e/admin-transversal.spec.ts:85-101` (5 telas + 3 abas de Logs); `admin-mandatos.spec.ts:172-176` `sobra <= 0` e `quadro` `{rola:true, overflow:'auto'}`; `admin-detalhe.spec.ts:320`; `admin-equipe.spec.ts:296` | PASS |
| 16.2 alvos de 40 px | altura mínima | `admin-mandatos.spec.ts:177-179` `baixos` `[]`; `admin-transversal.spec.ts:104-120` (inclui diálogo); `admin-equipe.spec.ts:296` | PASS |

### Edge Cases

| Edge case | `file:line` + asserção | Situação |
| --------- | ---------------------- | -------- |
| 5xx/erro de rede: "Não foi possível carregar. Tentar de novo" | `admin-mandatos.spec.ts:156-168` (rede e 500), `admin-analytics.spec.ts:301-306`, `admin-logs.spec.ts:189-193`, `admin-equipe.spec.ts:108-119`, `admin-detalhe.spec.ts:124-134`; `tests/admin-mensagens.test.ts:15-25` | PASS |
| Duplo clique envia uma vez | `admin-equipe.spec.ts:161-171` `chamou('admin_equipe_incluir')` 1; `admin-detalhe.spec.ts:282-290` `chamou('admin_mandato_excluir')` 1 | PASS: `admin-equipe.spec.ts:161-181` e `admin-detalhe.spec.ts:282-299` seguram a resposta (`seguraRpc`), afirmam `toBeDisabled()` no botão e em Cancelar, dois `requestSubmit()` no mesmo instante e `gate.pedidos()` 1 (E6b, N6, N6b mortos) |
| Dois admins removem a mesma pessoa: "Pessoa não encontrada." | `sql-admin-equipe.test.ts:158`; `admin-equipe.spec.ts:228` | PASS; o e2e (`admin-equipe.spec.ts:231-243`) agora espera `toHaveCount(3)` antes de mexer no banco: 360/360 em `--repeat-each=20`; a concorrência real não é simulada (só sequencial, registrado na spec) |
| Admin rebaixa a si mesmo (há outro admin) | `sql-admin-equipe.test.ts:139-140`; `admin-equipe.spec.ts:233-243` recarrega `equipe_legisla` e `admin_equipe_papel` 1 | PASS |
| Exatamente 25 itens: sem página seguinte | `tests/admin-mandatos.test.ts:92`; `admin-mandatos.spec.ts:44-46` `Próxima` count 0 | PASS |
| Mandato sem evento: `atualizado_em` | `sql-admin-leitura.test.ts:73` `{BBB222,'2026-02-01'}` | PASS |
| E-mail inválido: "Digite um e-mail válido." sem consultar o banco | `admin-equipe.spec.ts:156-158` `toHaveText('Digite um e-mail válido.')`, `esperaSemRpc(page,'admin_buscar_usuario')` `[]`; `admin-detalhe.spec.ts:188-191` (`admin_buscar_usuario` 1 só do e-mail sem conta); `tests/admin-mensagens.test.ts:37-52` | PASS (ausência com espera: `esperaSemRpc`) |

**Status**: todos os ACs e Edge Cases têm evidência `file:line` + asserção; nenhum GAP restante. Os GAPs parciais da iteração 1 (2.7/8.5 `leitura` + membro; 14.4 flag `NUVEM`) e as asserções de ausência frágeis (ADM-01.1/01.2, 3.4, 7.5, e-mail inválido) estão fechados. Precisão da spec: as Assumptions de F9 fixam ativos no período, média, formato da última atividade, frases da auditoria, mandato arquivado, linhas de uso e concorrência (ver "Lacunas de precisão").

---

## Discrimination Sensor

**Método**: scratch em `%TEMP%\vscratch2` criado com `git archive HEAD | tar -x` (cópia do HEAD fora do repositório, sem `.git`), `npm ci` dentro de `plataforma/` do scratch, nenhuma junção nem link (busca por `ReparsePoint`: 0). SQL e unitárias com `node --test`; e2e com `next dev --webpack` na porta 3200 e config Playwright própria. Cada mutação foi aplicada por substituição exata de texto (falha se o trecho não aparece exatamente 1 vez), testada e revertida ao conteúdo original.

### Os 9 sobreviventes da iteração 1, reinjetados

| Mutante | Onde | Descrição | Resultado |
| ------- | ---- | --------- | --------- |
| M13 | `20261105120000_admin_equipe.sql` `admin_equipe_remover` | tira `set search_path = ''` | **morto** (`sql-admin-funcoes.test.ts:30`) |
| V5 | `20261105140000_admin_mandatos_gestao.sql:21` | gatilho de `arquivado_em` aceita `eh_legisla()` (inclui `leitura`) | **morto** (`sql-admin-mandatos.test.ts:194`) |
| E1t | `app/admin/equipe/page.tsx:136` | leitura vê "+ Incluir pessoa" | **morto** no transversal (`admin-transversal.spec.ts:145` `expect(rotulos.filter(ALTERA)).toEqual([])`) |
| E6b | `Dialogo.tsx:61` | tira `emCurso.current` da trava síncrona | **morto** (`admin-equipe.spec.ts:161`, `admin-detalhe.spec.ts:282`) |
| E8 | `e2e/admin-api.ts:34` + `page.tsx:13` | ajudante sem a chave `dados` e o app pede `dados` | **morto** pelo autoteste (`admin-helper.spec.ts:7`, `:21`, `:39`). Sem o autoteste (só mandatos e transversal) ainda sobrevive (E8b), como esperado: quem mata é o autoteste |
| E10 | `e2e/admin-api.ts` (resposta com o conteúdo sob chave renomeada) | a varredura de resposta é por nome de chave | **sobrevive, por limite de projeto** (avaliação abaixo; não reexecutado, o autoteste `admin-helper.spec.ts:30` afirma o comportamento) |
| E14 | `ilhas/ponte.tsx:137` | tira `!w.NUVEM` da guarda | **morto** (`admin-uso-registro.spec.ts:75`) |
| EA2 | `Sessao.tsx:96` | "Sem acesso" dispara `v_admin_mandatos` 800 ms depois | **morto** (`admin-acesso.spec.ts:34`, `esperaSemMandatos` em `:39`) |
| EB | `Sessao.tsx:115` | tela de entrada dispara `v_admin_mandatos` 800 ms depois | **morto** (`admin-acesso.spec.ts:22` e `:88`) |

Avaliação do E10: o limite está no docstring de `chavesProibidasEm` (`e2e/admin-api.ts`) e afirmado pelo autoteste (`admin-helper.spec.ts:30`, `chavesProibidasEm({conteudo:{notas:'segredo'}})` igual a `[]`). Quem impede o vazamento são as outras camadas, que têm mutantes mortos: o regex do pedido (`pedidoCitaChaves`, E7 morto), `naoMapeadas()` (lista de permissão da rede) e o `information_schema` do SQL (`sql-admin-leitura.test.ts:52-57`, M9 e M9b mortos). Uma coluna que carregasse `dados` sob outro nome só passaria se alguém a criasse na view; risco baixo, vira observação (lacuna 1). Aceitável.

Limite do helper de ausência: `esperaSemChamadas` espera rede quieta mais 1,2 s; EA2 e EB, com atraso de 800 ms, morreram. Uma chamada atrasada mais de ~1,2 s não seria vista (observação 2).

### Mutações novas (13)

| Mutante | Onde | Descrição | Resultado |
| ------- | ---- | --------- | --------- |
| N1 | `app/admin/page.tsx:36` | `lerTudo(...).then(l => l.slice(0,1000))` (descarta o 2º bloco) | morto (`admin-mandatos.spec.ts:48`, `toBeVisible` de `1–25 de 1120`) |
| N2 | `app/admin/page.tsx:36` | tira o `,id` do `order` (ordem instável) | morto (`admin-mandatos.spec.ts:48`, checa `order=ultima_atividade.desc,id`) |
| N3 | `lib/admin/api.ts` `lerTudo` | `offset` inicial 1 | morto (`tests/admin-api.test.ts`) |
| N16 | `lib/admin/api.ts` `lerTudo` | `todas.push(...bloco.slice(1))` (perde a 1ª linha de cada bloco) | morto (`tests/admin-api.test.ts`) |
| N17 | `lib/admin/api.ts` `lerTudo` | `bloco.length < tamanho - 1` | sobrevive, **equivalente**: só pede um bloco vazio a mais quando o bloco tem exatamente `tamanho-1` linhas; o resultado é o mesmo |
| N4a | `...gestao.sql` `admin_mandato_arquivar` | aceita `eh_legisla()` (leitura) | sobrevive, **equivalente na prática**: o gatilho `mandatos_trava_arquivo` (V5 morto) recusa `leitura` com a mesma mensagem; defesa em profundidade (mesmo padrão de V1 e V3 da iteração 1) |
| N4b | `...gestao.sql` `admin_membro_papel` | aceita `eh_legisla()` (leitura) | morto (`sql-admin-mandatos.test.ts:164`) |
| N5 | `...admin_equipe.sql` `private.audita` | grava `autor` nulo | morto (`sql-admin-equipe.test.ts:105-110` `autor 'Ana Admin'`) |
| N6 | `Dialogo.tsx:82` | botão de confirmar sem `enviando` no `disabled` | morto (`admin-equipe.spec.ts:161`, `admin-detalhe.spec.ts:282` `toBeDisabled()`); era o E6 equivalente na iteração 1, agora discriminado |
| N6b | `Dialogo.tsx:80` | Cancelar sem `disabled={enviando}` | morto (mesmos dois testes) |
| N7 | `lib/admin/funil.ts` `travas` | regra de "alcançaram" vira `true` (todos) | morto (`tests/admin-funil.test.ts`) |
| N8 | `...admin_equipe.sql` `private.audita` | tira `set search_path = ''` | morto (`sql-admin-funcoes.test.ts:30`); cobre a função que não é `admin_*` |
| N9 | `...gestao.sql:196` | `revoke execute ... from public` sem `anon` | morto (`sql-admin-funcoes.test.ts:39`) |

**Resumo**: 22 mutações nesta iteração (9 reinjetadas + 13 novas); 19 mortas, 3 sobreviventes: E10 (limite documentado e aceito) e N4a, N17 (equivalentes). Nenhum mutante relevante sobrevive. Somadas às 73 da iteração 1: 95 mutações no total.
**Sensor**: PASS.

**Isolamento**: mutações só no scratch; `git status --porcelain` do worktree real igual ao do início (`?? plataforma/playwright.isolado.config.ts`). Scratch removido com `rm -rf` comum depois de confirmar 0 links; não foi criado worktree (`git archive`), então `git worktree list` não mudou e não houve `git worktree prune` nem `git worktree remove`. O servidor da porta 3200 foi encerrado; a porta 3100 (worktree real) segue em 200; a porta 3000 nunca foi usada.

---

## Code Quality

| Princípio | Situação |
| --------- | -------- |
| Sem funcionalidade além do pedido | OK. A única mudança de produção (`app/admin/page.tsx`, 5 linhas) corrige a lacuna 4; o desvio `SPEC_DEVIATION` de `admin_membros` (leitura) continua documentado |
| Cirúrgico | OK: 12 arquivos, todos de testes, helper e spec, mais `page.tsx` |
| Padrões do repositório | OK: imports `.ts`, `node --test`, Playwright; `lerTudo` é o utilitário que o Analytics já usa |
| Asserções com o valor da spec | OK; as frágeis da iteração 1 agora esperam ou isolam o estado |
| Todo teste mapeia a um AC/edge case | OK; `admin-helper.spec.ts` e `sql-admin-funcoes.test.ts` sustentam ADM-01, ADM-02 e ADM-05.2 |
| Segurança das migrations | `security definer` + `search_path` vazio e `revoke` agora verificados por teste lendo o catálogo (`sql-admin-funcoes.test.ts`: guarda de lista vazia com 10 ou mais funções públicas, `search_path=("")`, `anon`/`PUBLIC` sem execute, `authenticated` só nas públicas) |
| Nota | `mandatos_trava_arquivo` não é `security definer` e fica fora do teste de catálogo por desenho (é gatilho; V5 o cobre) |

---

## Lacunas ranqueadas

Nenhuma lacuna relevante. Observações de baixo risco, para a Fase 2 ou para quando alguém mexer na área:

1. **Varredura de resposta por nome (Baixa)**: E10. `chavesProibidasEm` em `e2e/admin-api.ts`: conteúdo de `dados` sob outro nome de coluna não seria visto pelo ajudante; coberto por regex do pedido, lista de permissão da rede e `information_schema` (`sql-admin-leitura.test.ts:52-57`). Limite documentado e afirmado em `admin-helper.spec.ts:30`.
2. **Janela de espera de ausência (Baixa)**: `esperaSemChamadas` (`e2e/admin-api.ts:50-55`) vê atraso de até ~1,2 s com rede quieta; um vazamento mais tardio passaria. O mesmo vale para as ausências de `admin-uso-registro.spec.ts` (500 a 1.500 ms).
3. **Camada de função de `admin_mandato_arquivar` (Info)**: N4a é equivalente porque o gatilho a segura; se o gatilho for removido por engano, V5 morre, então a combinação está protegida.
4. **Concorrência (Info)**: só em sequência (registrado na spec, F9); não há teste com duas transações.

### Lacunas de precisão da spec

Resolvidas em F9 (agora Assumptions da spec): ativos no período e média (ADM-09.1), formato da "última atividade" (ADM-05.1), frases da auditoria (ADM-04.5), mandato arquivado "Missões concluídas: —" (ADM-06.1), linhas da tabela de uso (só "Organograma e rotinas" entra com registro; "Exportar PDF" e "Enviar sugestão" vão para a Fase 2), janela das aberturas (ADM-15.7), concorrência e a lista de Mandatos paginada em blocos de 1.000.

Restam apenas:
- ADM-13.4: os dois endereços de log não foram abertos (a spec já registra).
- Concorrência real (edge "dois admins"): sequencial apenas (registrado na spec).
- A spec foi editada em F9 e durante a implementação; a confirmação do usuário não é verificável aqui (as Assumptions novas têm `n` na coluna de confirmação).
- `plataforma/package-lock.json` e `package.json` mudaram só para `@electric-sql/pglite` (devDependency). `npm run build` não foi executado. `next dev` mostra o aviso de segurança conhecido do Next 16.4, sem relação com a feature.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| ADM-01 | Needs Fix | Verified |
| ADM-02 | Needs Fix | Verified |
| ADM-03 | Verified | Verified |
| ADM-04 | Verified | Verified |
| ADM-05 | Needs Fix | Verified |
| ADM-06 | Verified | Verified |
| ADM-07 | Verified | Verified |
| ADM-08 | Needs Fix | Verified |
| ADM-09 | Verified | Verified |
| ADM-10 | Verified | Verified |
| ADM-11 | Verified | Verified |
| ADM-12 | Verified | Verified |
| ADM-13 | Verified | Verified |
| ADM-14 | Needs Fix | Verified |
| ADM-15 | Verified | Verified |
| ADM-16 | Verified | Verified |

---

## Integridade do ambiente

Depois do sensor: `plataforma/node_modules` do worktree real (44 entradas) e da pasta compartilhada (44 entradas, só leitura) contêm `@dagrejs`, `@electric-sql`, `@img`, `@playwright`, `next` e `react`; `npm test` no worktree: 725/725. `git status --porcelain` do worktree: só `?? plataforma/playwright.isolado.config.ts`.

---

## Summary

**Overall**: Ready (PASS na iteração 2 de 3)

**Spec-anchored check**: 16/16 requisitos (todos os ACs e os 7 Edge Cases) com `file:line` + asserção; 0 GAPs; precisão da spec resolvida por Assumptions, sobrando só itens já registrados.
**Sensor**: 22 mutações nesta iteração, 19 mortas, 3 sobreviventes (1 limite documentado aceito, 2 equivalentes); dos 9 antigos, 8 morreram e o E10 segue como limite de projeto.
**Gate**: unit 725/725, e2e 125/125 em 3 rodadas, `--repeat-each=20` Equipe 360/360 e Mandatos 300/300, tsc limpo.

**Next steps**: T37 (spec da Fase 2) pode começar; o orquestrador commita este relatório.
