# painel-admin Validation

**Date**: 2026-11-06
**Spec**: `.specs/features/painel-admin/spec.md`
**Diff range**: `7b0942c..80d732a` (41 commits, branch `feat/painel-admin`, 60 arquivos, +7.034/-144)
**Verifier**: sub-agente independente (autor != verificador). Árvore real somente leitura; mutações só em scratch (`git worktree` temporário em `%TEMP%`, removido ao fim).

## Validation summary - FAIL

**Result**: FAIL

Todos os critérios de ADM-01 a ADM-16 e os 7 Edge Cases têm evidência (`file:line` + asserção). O veredito é FAIL por causa de três itens relevantes, listados em "Lacunas ranqueadas": (1) um e2e intermitente (~7% de falha em repetição), (2) um mutante de permissão que sobreviveu (gatilho de `arquivado_em` aceita papel `leitura`) e (3) testes de ausência de ADM-01.1/01.2 que passam cedo demais (dois mutantes de "vazamento atrasado" sobreviveram). Há ainda outros mutantes sobreviventes de menor risco e lacunas de precisão da spec.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 a T36 | Done | `tasks.md` tem 126 caixas marcadas; nenhuma de T1 a T36 em aberto |
| T37 (spec da Fase 2) | Pendente de propósito | A task diz "só começa depois do Verifier da feature dar PASS"; 5 caixas abertas, todas dela |

---

## Gate Check

- **Comandos**: `npm test`, `npx tsc --noEmit`, `npx playwright test -c playwright.isolado.config.ts e2e/admin-` (config isolado, `next dev` na porta 3100). `npm run build` NÃO rodado (instrução do orquestrador; oscila com o aviso de segurança conhecido do Next 16.4).
- **Unit/SQL (`npm test`)**: 721 testes, 721 passam, 0 falham, 0 pulados. Dos 721, 197 são desta feature (`tests/admin-*`, `tests/sql-*`, `tests/uso.test.ts`); antes da feature eram 524. Nenhum teste apagado (diff de `tests/` e `e2e/` só tem inserções).
- **tsc**: `npx tsc --noEmit` sai com 0, sem mensagens (duas vezes: antes e depois da reinstalação descrita abaixo).
- **e2e `e2e/admin-`**: rodada 1: 116 passaram (2,0 min); rodada 2: 116 passaram (2,2 min); rodada 3 (depois da reinstalação de `node_modules`): 116 passaram (1,8 min). Nenhum pulado.
- **Intermitência encontrada**: repetindo só o teste `admin-equipe.spec.ts:221` com `--repeat-each` (12, 15, 15, 15 execuções) houve 2, 0, 1 e 1 falhas: 4 em 57 (~7%). Erro: `locator.click: Test timeout of 30000ms exceeded` esperando o botão Remover da linha "Carla Dias" (ver Lacuna 1). A suíte inteira passou 3 vezes seguidas por sorte.
- **Incidente de ambiente (registrado por honestidade)**: ao remover o scratch, `git worktree remove --force` seguiu a junção `node_modules` do scratch (criada por mim) e apagou parte do `plataforma/node_modules` REAL (pastas `@dagrejs`, `@electric-sql`, `@emnapi`, `@img` e outras). Reparei com `npm install --no-save --no-audit --no-fund` em `plataforma/` (adicionou 8 e alterou 8 pacotes; nenhum arquivo versionado mudou). Depois conferi `npm test` (721), `tsc` (0) e o e2e inteiro (116). Pasta `node_modules` é ignorada pelo git; `git status --porcelain` ficou igual ao do início (`?? plataforma/playwright.isolado.config.ts`).

---

## Spec-Anchored Acceptance Criteria

Legenda: PASS = asserção localizada e igual ao resultado da spec; GAP = sem asserção ou asserção que não discrimina; SPEC? = a spec não define o resultado com precisão. Caminhos relativos a `plataforma/`. "SQL" = PGlite com `auth` simulado e privilégios padrão do Supabase.

### ADM-01 e ADM-02: entrar no /admin e papéis (spec: P1 Entrar, AC 1 a 10)

| AC | Resultado da spec | `file:line` + asserção | Situação |
| -- | ----------------- | ---------------------- | -------- |
| 1.1 sem sessão | tela de entrada (Google e e-mail), nenhum dado de mandato | `e2e/admin-acesso.spec.ts:25-29` `getByRole('button',{name:'Entrar com Google'})`, `getByLabel('E-mail'/'Senha')` visíveis, `tbody tr` count 0; `:30` `expect(chamadasDeMandatos()).toEqual([])` | PASS na tela; a parte "nenhum dado" é teste de ausência que passa cedo (Lacuna 3) |
| 1.2 sem linha em equipe | "Sem acesso" e nenhuma consulta de mandatos | `admin-acesso.spec.ts:36` heading "Sem acesso"; `:39` `chamadasDeMandatos()` `[]`; `:41` `caminho.startsWith('equipe_legisla')` length 1 | PASS na mensagem; ausência de consulta é frágil (Lacuna 3: mutante EA2 sobreviveu) |
| 1.3 papel admin/leitura | abre em Mandatos com menu Equipe, Mandatos, Analytics, Logs e link /painel | `admin-acesso.spec.ts:61` heading Mandatos; `:64` `toHaveText(['Equipe','Mandatos','Analytics','Logs','Painel de métricas (/painel)'])`; `:66` `href '/painel'` | PASS |
| 1.4 reaproveita `legisla.tok` | sem novo login | `admin-acesso.spec.ts:58-69` (`Entrar com Google` count 0 depois de semear a sessão); `tests/admin-sessao.test.ts:23` chave `legisla.tok`; `:34` lê a sessão do Guia | PASS |
| 1.5 401 volta à entrada | tela de entrada | `admin-acesso.spec.ts:152-158` `.aviso` `'Sua sessão venceu. Entre de novo.'` + botão Google visível + tentou renovar; `:139-143`, `:145-149` | PASS |
| 2.6 leitura sem botões, seletores desabilitados | nenhum Incluir/Remover/Editar/Adicionar/Arquivar/Excluir; seletores de papel desabilitados | `admin-acesso.spec.ts:121-127` count 0 por nome + `habilitados` `toEqual(['UF','Casa','Situação','Parado há'])`; `admin-equipe.spec.ts:246-255` `seletores.nth(i)).toBeDisabled()`; `admin-detalhe.spec.ts:304-315`; `admin-logs.spec.ts:177-187`; `admin-analytics.spec.ts:309`; `admin-transversal.spec.ts:139-148` | PASS (mutantes E1, E2 mortos; ver E1t em Lacuna 7) |
| 2.7 escrita direta de `leitura` recusada | erro de permissão, nada muda | `tests/sql-admin-equipe.test.ts:164-178` `assert.rejects(chama(sql,args), SEM_PERMISSAO)` para leitura/gabinete/fora e `/permission denied/` para anônimo; `tests/sql-admin-mandatos.test.ts:164-181` idem para as 5 funções de mandato; `:180-185` escrita direta em `equipe_legisla` recusada até para admin; `:187-199` auditoria | PASS nas funções; GAP no gatilho `arquivado_em` para `leitura` que também é membro (Lacuna 2, mutante V5) |
| 2.8 fora da equipe | erro de permissão ou 0 linhas | `tests/sql-admin-leitura.test.ts:34` `(await q(select * from v_admin_*)).length` 0 para membro e fora e `:38` `/permission denied/` para anônimo; `sql-admin-equipe.test.ts:64-80`; `sql-admin-mandatos.test.ts:32-44` | PASS |
| 2.9 só admin/leitura; `analista` vira `leitura` | constraint + conversão | `sql-admin-equipe.test.ts:43` `papel` `'leitura'`; `:44-47` `rejects(..., /equipe_legisla_papel_check/)` | PASS |
| 2.10 papel lido a cada chamada | troca vale na chamada seguinte | `tests/sql-ambiente.test.ts:73-83` (fora sem acesso, depois com, depois sem); `sql-admin-equipe.test.ts:136-140` (admin rebaixado/promovido por fora vale na chamada seguinte) | PASS |

### ADM-03: gerir a equipe

| AC | Resultado da spec | `file:line` + asserção | Situação |
| -- | ----------------- | ---------------------- | -------- |
| 3.1 lista | nome, e-mail, papel, entrada; da mais antiga à mais recente | `sql-admin-equipe.test.ts:57-60` `deepEqual([[nome,email,papel]...])` com Lia (jan) antes de Ana (fev); `e2e/admin-equipe.spec.ts:84` `thead th` `['Nome','E-mail','Papel','Desde','']`, `:86-93` ordem e datas `16/10/2026`, `20/10/2026`, `03/11/2026` | PASS |
| 3.2 incluir | inclui com o papel e mostra | `admin-equipe.spec.ts:125-131` count 4, `Papel de Diego Reis` `'admin'`, `escritas()` `['rpc/admin_equipe_incluir']`; `sql-admin-equipe.test.ts:103` | PASS |
| 3.3 busca por e-mail | exato, sem caixa/espaços, no máximo 1, só admin | `sql-admin-equipe.test.ts:85-87` `'  FORA@Exemplo.com '` -> 1 linha igual a `{user_id,nome,email}`; `'fora@exemplo'` -> 0; `:91-97` leitura/gabinete recusados | PASS |
| 3.4 sem conta | "Nenhuma conta com este e-mail. A pessoa precisa entrar na plataforma uma vez." | `admin-equipe.spec.ts:137` `toHaveText(SEM_CONTA)`; `:138` `chamou('admin_equipe_incluir')` 0; `tests/admin-mensagens.test.ts:32` texto fixo | PASS (ausência imediata, Lacuna 3) |
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
| 5.1 25 por página | colunas código, parlamentar, cargo, UF, partido, membros, última atividade | `e2e/admin-mandatos.spec.ts:29` `columnheader` `['Código','Parlamentar','Cargo','UF','Partido','Membros','Última atividade','']`, `:30` 25 linhas, `:31` `'1–25 de 60'`, `:35` `'26–50 de 60'`, `:37` 10 linhas; `tests/admin-mandatos.test.ts:114` `TAMANHO_PAGINA` 25 | PASS; formato do valor de "última atividade" não definido (SPEC?) |
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
| 8.5 só por função admin | sem update/delete direto | `sql-admin-mandatos.test.ts:164-181`; `:183-192` gatilho (membro de gabinete); `:194-202` admin não membro: `affectedRows` 0 | PASS para gabinete e admin; GAP para `leitura` que é membro (Lacuna 2) |

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
| 14.4 `NUVEM=false` | não grava | `admin-uso-registro.spec.ts:78-82` `usos` length 0 após 500 ms e `NUVEM` `false` | GAP parcial: o teste não isola o flag `NUVEM` (Lacuna 6, mutante E14 sobreviveu) |
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
| Duplo clique envia uma vez | `admin-equipe.spec.ts:161-171` `chamou('admin_equipe_incluir')` 1; `admin-detalhe.spec.ts:282-290` `chamou('admin_mandato_excluir')` 1 | PASS na contagem; o teste não afirma "botão desabilitado" e o mutante que remove a trava síncrona sobreviveu (Lacuna 8) |
| Dois admins removem a mesma pessoa: "Pessoa não encontrada." | `sql-admin-equipe.test.ts:158`; `admin-equipe.spec.ts:228` | PASS; o e2e é o teste intermitente (Lacuna 1); a concorrência real não é simulada (só sequencial) |
| Admin rebaixa a si mesmo (há outro admin) | `sql-admin-equipe.test.ts:139-140`; `admin-equipe.spec.ts:233-243` recarrega `equipe_legisla` e `admin_equipe_papel` 1 | PASS |
| Exatamente 25 itens: sem página seguinte | `tests/admin-mandatos.test.ts:92`; `admin-mandatos.spec.ts:44-46` `Próxima` count 0 | PASS |
| Mandato sem evento: `atualizado_em` | `sql-admin-leitura.test.ts:73` `{BBB222,'2026-02-01'}` | PASS |
| E-mail inválido: "Digite um e-mail válido." sem consultar o banco | `admin-equipe.spec.ts:157-159` `toHaveText('Digite um e-mail válido.')`, `chamou('admin_buscar_usuario')` 0; `admin-detalhe.spec.ts:188-191` (`admin_buscar_usuario` 1 só do e-mail sem conta); `tests/admin-mensagens.test.ts:37-52` | PASS (ausência imediata, Lacuna 3) |

**Status**: todos os ACs e Edge Cases têm evidência; GAPs parciais em 2.7/8.5 (`leitura` + membro) e 14.4 (flag `NUVEM`); lacunas de precisão listadas abaixo.

---

## Discrimination Sensor

**Profundidade**: P0 (permissões, privacidade, autenticação): 73 mutações em scratch isolado (SQL e unitárias com `node --test`; e2e com `next dev --webpack` na porta 3200 e config Playwright temporária). A primeira tentativa de M10 (fuso da view) quebrava a migration em vez de mudar o comportamento e foi refeita corretamente; três M3 rodaram com um erro de ambiente e foram repetidas.

| Mutação | Onde | Descrição | Resultado |
| ------- | ---- | --------- | --------- |
| M1a | `20261105120000_admin_equipe.sql:183-186` | remove a trava de último admin em `admin_equipe_remover` (a) | morto (`sql-admin-equipe.test.ts:155`) |
| M1b | `...admin_equipe.sql:160` | `if false and v_antigo = 'admin'` em `admin_equipe_papel` | morto (`:131`) |
| M2a | `...admin_equipe.sql:121` | `eh_legisla()` no lugar de `eh_legisla_admin()` em `admin_equipe_incluir` (b) | morto (`:164`) |
| M2b | `20261105140000_admin_mandatos_gestao.sql:179` | idem em `admin_mandato_excluir` (b) | morto (`sql-admin-mandatos.test.ts:164`) |
| M2c | `...gestao.sql:128` | idem em `admin_membro_remover` (b) | morto (`:164`) |
| M3a | `20261105130000_admin_leitura.sql:80` | tira `where private.eh_legisla()` de `v_admin_mandatos` (c) | morto (`sql-admin-leitura.test.ts:29`) |
| M3b | `...admin_leitura.sql:104` | idem em `v_admin_atividade` (c) | morto (`:29`) |
| M3c | `...admin_leitura.sql:96` | idem em `v_admin_eventos_mes` (c) | morto (`:29`) |
| M4a | `...gestao.sql:31-32` | remove o gatilho de `arquivado_em` (d) | morto (2 testes, `:183`, `:127`) |
| M4b | `...gestao.sql:21` | `if false` na checagem do gatilho (d) | morto (`:183`) |
| M4c | `...gestao.sql:24` | gatilho não devolve `atualizado_em` | morto (`:127`) |
| M5 | `...admin_equipe.sql:73` | `grant execute on private.audita` a `authenticated` | morto (`sql-admin-equipe.test.ts:187`) |
| M6 | `...admin_equipe.sql:56` | `grant select, update on auditoria_admin` | morto (`:187`) |
| M7 | `...gestao.sql:137-141` | remove a trava de última coordenação em `admin_membro_remover` | morto (`sql-admin-mandatos.test.ts:102`) |
| M8 | `...gestao.sql:186-187` | remove a chamada de auditoria em `admin_mandato_excluir` | morto (2 testes) |
| M9 | `...admin_leitura.sql:74` | `v_admin_mandatos` expõe `nome_civil` | morto (`sql-admin-leitura.test.ts:52`) |
| M9b | `...admin_leitura.sql:101` | `v_admin_atividade` expõe `e.texto` | morto (`:52`) |
| M10 | `...admin_leitura.sql:93,97` | fuso da view mensal `America/Sao_Paulo` -> `UTC` | morto (`:106`) |
| M10b | `...uso_funcionalidades.sql:43,51` | fuso de `v_admin_uso` -> `UTC` | morto (`sql-uso-funcionalidades.test.ts:72`) |
| M11 | `...admin_equipe.sql:195-198` | `revoke ... from public` sem `anon` | morto (3 testes) |
| M12 | `...admin_equipe.sql:30` | remove o `revoke insert, update, delete` de `equipe_legisla` | morto (`:180`) |
| M13 | `...admin_equipe.sql:172` | tira `set search_path = ''` de `admin_equipe_remover` | **SOBREVIVEU** (Lacuna 5) |
| M14 | `20261105150000_uso_funcionalidades.sql:27` | `with check (true)` na política de inserção | morto (`sql-uso-funcionalidades.test.ts:34`) |
| M15 | `...uso_funcionalidades.sql:35` | não revoga os grants padrão de `anon` | morto (`:41`, `:62`) |
| V1 | `...admin_leitura.sql:134` | `grant select` das views também a `anon` | sobreviveu, equivalente na prática: `anon` não tem `usage` no schema `private`, então o `where private.eh_legisla()` falha com `permission denied` do mesmo jeito (defesa em profundidade); o teste não distingue as duas camadas |
| V3 | `...uso_funcionalidades.sql:50` | tira `private.eh_legisla()` de `v_admin_uso` | sobreviveu, equivalente na prática: a política `uso_func_ler` já limita à equipe |
| V4 | `...uso_funcionalidades.sql:50` | `v_admin_uso` conta arquivados | morto (`:72`) |
| V5 | `...gestao.sql:21` | gatilho de `arquivado_em` aceita `eh_legisla()` (inclui `leitura`) no lugar de `eh_legisla_admin()` | **SOBREVIVEU** (Lacuna 2) |
| V6 | `...gestao.sql:188` | `admin_mandato_excluir` apaga também sugestões órfãs | morto (`sql-admin-mandatos.test.ts:149`) |
| T1, T1b, T1c | `lib/admin/funil.ts:41,43` | muda a regra de "alcançaram" (sem anterior; invertida; "concluíram" global) (e) | mortos (8, 7 e 1 testes) |
| T2 | `lib/admin/analytics.ts:29` | `statusMensal` usa mês UTC (f) | morto (2 testes de virada de fuso) |
| T2b | `lib/admin/escala.ts:4` | `FUSO = 'UTC'` | morto (4 testes) |
| T3, T3b | `lib/admin/mandatos.ts:22,23` | busca sem normalizar acento / sem minúsculas (g) | mortos (2 e 3 testes) |
| T4 | `lib/admin/mandatos.ts:34` | `<=` -> `<` em "parado há" | morto (`tests/admin-mandatos.test.ts:68`) |
| T5 | `lib/admin/funil.ts:9` | `Math.round` -> `Math.floor` | morto (3 testes) |
| T6, T7, T8, T9 | `funil.ts:8`, `analytics.ts:10`, `mandatos.ts:20,42` | 10->11 travas, 12->13 meses, 25->26 por página, página extra com 25 itens | todos mortos |
| T10, T11 | `lib/admin/api.ts:57,61` | `lerTudo`: `offset += tamanho + 1`; `<` -> `<=` | mortos (2 e 3 testes) |
| T12, T13, T14, T15 | `analytics.ts:21`, `funil.ts:47,42`, `mensagens.ts:11` | fronteira de ativos, ordem das travas, remove "omite 0 alcançaram", 403 sem a mensagem de permissão | todos mortos |
| U1, U2, U5, U6, U7 | `lib/uso.ts:34,27`, `escala.ts:20`, `mensagens.ts:18`, `uso.ts:18` | janela de 60 s (`<=`, 30 s), `diasParado` negativo, e-mail sem domínio, `ficha-N` -> cadeiras | todos mortos |
| E1 | `app/admin/equipe/page.tsx:136` | leitura vê "Incluir pessoa" (h) | morto (`admin-equipe.spec.ts:246`) |
| E1t | idem, rodando só `admin-transversal.spec.ts:139` | idem | **SOBREVIVEU** no transversal (Lacuna 7); o teste de Equipe o pega |
| E2 | `equipe/page.tsx:157` | seletor de papel habilitado para leitura (h) | morto (`admin-equipe.spec.ts:246`, `admin-transversal.spec.ts:139`) |
| E3 | `_componentes/ZonaRisco.tsx:35` | confirmação de exclusão sem diferenciar caixa | morto (`admin-detalhe.spec.ts:262`) |
| E4, E13 | `logs/page.tsx:8,19` | 51 por página; fuso `UTC` na data | mortos (3 testes cada) |
| E5 | `app/admin/page.tsx:13` | corte do destaque 45 -> 30 | morto |
| E6 | `Dialogo.tsx:82` | tira `enviando` do `disabled` do botão de confirmar | sobreviveu, equivalente na prática: a trava síncrona `emCurso` (`Dialogo.tsx:27,61`) segura o duplo clique |
| E6b | `Dialogo.tsx:61` | tira `emCurso.current` da trava síncrona | **SOBREVIVEU** (Lacuna 8) nos testes de duplo clique (`admin-equipe.spec.ts:161`, `admin-detalhe.spec.ts:282`); o React já aplica o `disabled` entre os dois cliques |
| E7 | `app/admin/page.tsx:12` | o app pede a coluna `dados` | morto (17 testes; `vazou()` pega o pedido) |
| E8 | `e2e/admin-api.ts:34` + `page.tsx:12` | `vazou()` sem a chave `dados` e o app pede `dados` | **SOBREVIVEU** (Lacuna 7): o ajudante não tem autoteste |
| E9 | `e2e/admin-api.ts:71` | controle: fixture com chave `dados`, ajudante intacto | morto (13 falhas): a varredura de resposta funciona para o nome exato |
| E10 | `e2e/admin-api.ts:71` | resposta traz o conteúdo sob a chave renomeada `conteudo` | **SOBREVIVEU** (Lacuna 7): a varredura é por nome |
| E11 | `analytics/page.tsx:58` | exercícios lidos sem `lerTudo` | morto (`admin-analytics.spec.ts:289`) |
| E12 | `logs/page.tsx:157-158` | sem `noopener` nos links | morto (`admin-logs.spec.ts:160`) |
| E14 | `ilhas/ponte.tsx:137` | tira `!w.NUVEM` da guarda do registro | **SOBREVIVEU** (Lacuna 6) |
| E15 | `ponte.tsx:140` | tira a regra de 60 s do gancho | morto (`admin-uso-registro.spec.ts:53`) |
| E18 | `analytics/page.tsx:91` | o funil ignora a UF | morto |
| EA | `Sessao.tsx:96` | "Sem acesso" dispara `v_admin_mandatos` na hora | morto (`admin-acesso.spec.ts:34`), mas por corrida de milissegundos |
| EA2 | `Sessao.tsx:96` | "Sem acesso" dispara `v_admin_mandatos` 800 ms depois | **SOBREVIVEU** (Lacuna 3) |
| EB | `Sessao.tsx:115` | tela de entrada dispara `v_admin_mandatos` 800 ms depois (sem sessão) | **SOBREVIVEU** (Lacuna 3) |

**Resumo**: 73 mutações, 61 mortas, 12 sobreviventes: 9 relevantes (M13, V5, E1t, E6b, E8, E10, E14, EA2, EB) e 3 equivalentes na prática por defesa em profundidade (V1, V3, E6). Os 8 obrigatórios (a a h) estão cobertos: a, b, c, d, e, f, g, h mortos (h: E1 e E2 mortos; E8 e E10 sobreviveram para o ajudante `vazou()`).
**Sensor**: FAIL (mutantes relevantes sobreviveram).

Isolamento: scratch em `%TEMP%\vscratch` removido; `git worktree list` sem entrada de scratch; `git status --porcelain` da árvore real idêntico ao do início (só `?? plataforma/playwright.isolado.config.ts`). Ver o incidente de `node_modules` em "Gate Check".

---

## Code Quality

| Princípio | Situação |
| --------- | -------- |
| Sem funcionalidade além do pedido | OK, com um desvio documentado: `admin_membros` aceita `leitura` (marcado `SPEC_DEVIATION` em `20261105140000_admin_mandatos_gestao.sql:37`, justificado pela spec ADM-02.6 e ADM-07.3) |
| Cirúrgico (só arquivos da feature) | OK: 60 arquivos, todos de `app/admin`, `lib/admin`, `lib/uso.ts`, migrations, testes, docs e o gancho de 21 linhas em `ilhas/ponte.tsx` |
| Padrões do repositório | OK: imports `.ts`, `node --test`, Playwright, `security definer` + `revoke`, auditoria na mesma transação |
| Asserções com o valor da spec | OK na maioria; fracas só onde listado nas lacunas |
| Todo teste mapeia a um AC/edge case | OK (títulos citam o ADM-xx); testes de ambiente (`sql-ambiente.test.ts`, `admin-catalogo.test.ts`, `admin-config.test.ts`) sustentam ADM-02.10 e o catálogo |
| Diretrizes do projeto | `plataforma/AGENTS.md` (ler docs do Next antes de rota) e `plataforma/CLAUDE.md` (imports `.ts`, `node --test`); sem mudança de comportamento em arquivos fora do escopo |
| Segurança das migrations | `security definer` com `set search_path = ''` em todas as funções novas (leitura do código; não verificado por teste, Lacuna 5); `revoke execute ... from public, anon` em todas; nenhum grant a `anon` encontrado; nenhuma política remanescente (`equipe_gerir` removida); `auditoria_admin` sem grant de escrita |

---

## Lacunas ranqueadas

1. **Teste intermitente (Alta)**: `e2e/admin-equipe.spec.ts:221-229`. `abre()` (`:56-61`) só espera o título "Equipe Legisla"; a linha 224 (`banco.equipe = banco.equipe.filter(...)`) altera o banco simulado antes de a primeira leitura de `admin_equipe` terminar. Quando a leitura vem depois, a lista já não tem "Carla Dias" e o clique da linha 225 estoura 30 s. Medido: 4 falhas em 57 execuções (~7%) na árvore real; também falhou 2 vezes em 3 rodadas no scratch. Mesmo tipo de corrida já corrigida em `admin-mandatos.spec.ts`. Correção: antes da linha 224, `await expect(linhas(page)).toHaveCount(3)` (ou fazer `abre()` esperar as linhas).
2. **Permissão (Alta)**: ADM-02.7 e ADM-08.5. O mutante V5 (`mandatos_trava_arquivo` aceitando `private.eh_legisla()` em vez de `eh_legisla_admin()`, `...gestao.sql:21`) sobreviveu: o teste `sql-admin-mandatos.test.ts:183-192` só usa membro de gabinete fora da equipe, e `:194-202` só o admin. Falta o caso `leitura` que também é membro do mandato fazendo `update mandatos set arquivado_em = now()` direto (deve falhar com `Você não tem permissão para esta ação.`). Hoje o código está correto (a leitura confirma `eh_legisla_admin()`); o risco é de regressão.
3. **Testes de ausência que passam cedo (Alta)**: ADM-01.1 e 01.2. `e2e/admin-acesso.spec.ts:30`, `:31`, `:39`, `:85`, `:95`, `:142` (também `admin-equipe.spec.ts:138`, `:158` e `:190`, `admin-detalhe.spec.ts:190`, `:223` no mesmo estilo) afirmam `chamadasDeMandatos()`/`chamou(...)` igual a `[]`/0 logo depois de um `expect` de tela, sem esperar o tempo em que a chamada ocorreria. Mutantes EA2 (vazamento 800 ms depois do "Sem acesso") e EB (800 ms depois da tela de entrada) sobreviveram; EA (vazamento imediato) só morreu por corrida de milissegundos. Contraste: `admin-uso-registro.spec.ts:62`, `:81`, `:96` esperam 500 a 1.500 ms antes de afirmar ausência. Endurecer: ajudante `semChamadas(page, filtro)` que faz uma chamada-barreira conhecida depois da ação (o mock registra na ordem de chegada) e/ou `await page.waitForLoadState('networkidle')` mais um `waitForTimeout` de pelo menos 1 s; para cliques em Cancelar, o mesmo.
4. **Teto de 1.000 linhas na lista de Mandatos (Média)**: `app/admin/page.tsx:33` lê `v_admin_mandatos` com `api.ler` (sem `lerTudo`, sem `limit`); o PostgREST corta em 1.000 linhas sem aviso e, com `order=ultima_atividade.desc`, os mandatos descartados são exatamente os mais parados. O teto não está registrado em lugar nenhum (nem spec, `design.md`, `tasks.md` T20, `plataforma/CLAUDE.md`, nem comentário no código; `CLAUDE.md:67` fala de `lerTudo` só para o Analytics) e não há teste. Latente (hoje há bem menos de 1.000 mandatos). Correção: `lerTudo` com `order=ultima_atividade.desc,id` (e um e2e com mais de 1.000 linhas, como `admin-analytics.spec.ts:289`) ou registrar o teto e avisar na tela.
5. **`search_path` não é testado (Média)**: M13 sobreviveu. Nenhum teste lê `pg_proc.prosecdef/proconfig` das funções `admin_*` e `private.audita`, nem `has_function_privilege('anon'|PUBLIC, ...)`. Hoje o código tem `set search_path = ''` em todas (leitura das migrations). Adicionar um teste que enumere essas funções.
6. **ADM-14.4 não isola o flag `NUVEM` (Média/Baixa)**: E14 sobreviveu. `admin-uso-registro.spec.ts:75-83` não define `Nuvem.tok`, então a guarda `!tok` (`ilhas/ponte.tsx:137`) mascara a ausência de `!w.NUVEM`. Correção: nesse teste, definir `Nuvem.tok` e `CONFIG` com `NUVEM=false` e afirmar 0 gravações.
7. **Ajudante `vazou()` (Média)**: `e2e/admin-api.ts:34-57`. (a) a varredura de resposta é por nome exato da chave e sobre as fixtures do próprio teste, portanto circular: uma resposta com o conteúdo sob outro nome (E10) ou uma lista sem `dados` (E8) não é detectada, e o ajudante não tem autoteste; a proteção real está no pedido (`:136` regex `\bchave\b` na query), em `naoMapeadas()` (lista de permissão de fato) e no `information_schema` do SQL (`sql-admin-leitura.test.ts:52-57`), que cobrem bem. (b) `admin-transversal.spec.ts:140` usa `/^(Incluir|Remover|...)/` ancorado, que não casa "+ Incluir pessoa" nem "+ Adicionar membro" (E1t sobreviveu; os specs de Equipe e Detalhe pegam). Correção: autoteste do ajudante com resposta falsa contendo `dados`/aninhada e tirar a âncora `^`.
8. **Duplo clique (Baixa)**: E6b sobreviveu; os testes (`admin-equipe.spec.ts:161`, `admin-detalhe.spec.ts:282`) contam chamadas, mas a spec pede "botão desabilitado enquanto envia" e nenhum teste afirma o estado desabilitado durante o envio (seria preciso atrasar o mock). Duplo clique rápido do tipo `dblclick` já é segurado pelo `disabled`; a trava `emCurso` cobre o caso sem re-render.
9. **Lacunas de precisão da spec (não reprovam sozinhas)**:
   - ADM-09.1: "ativos no período" (última atividade em até N dias, `lib/admin/analytics.ts:21`) e a formatação da média (`'5'`, `'4'`, `1,5`?) não estão definidos.
   - ADM-05.1: formato do valor da coluna "última atividade" não definido (o e2e só afirma o destaque de "X dias parado").
   - ADM-04.5: texto da "descrição" das 9 ações não definido (o e2e fixa frases em `admin-logs.spec.ts:119-148`).
   - ADM-06.1: detalhe de mandato arquivado mostra "Missões concluídas: —" porque `v_admin_exercicios` esconde arquivados (`admin-detalhe.spec.ts:251`); a spec não diz.
   - Assumption "Linhas da tabela uso por funcionalidade": "Exportar PDF" e "Enviar sugestão" deveriam entrar com o registro; só "Organograma e rotinas" entrou (`lib/uso.ts:5-14`, `admin-analytics-uso.spec.ts:70`). Os ACs 14/15.7 não enumeram as linhas.
   - ADM-13.4: os dois endereços de log não foram abertos (a spec já registra).
   - Concorrência (edge "dois admins"): só testada em sequência (sem duas transações simultâneas).
   - A spec foi editada durante a implementação (duas linhas de Assumptions: "Parado há" e links de log); a confirmação do usuário não é verificável aqui.
10. **Observações**: `plataforma/package-lock.json` e `package.json` mudaram só para `@electric-sql/pglite` (devDependency). `npm run build` não foi executado. `next dev` imprimiu o aviso de segurança conhecido do Next 16.4 (recomenda `next upgrade --agent=security`); é o aviso registrado no design, sem relação com a feature.

---

## Fix Plans

- **Fix 1 (Alta)**: em `e2e/admin-equipe.spec.ts` antes de alterar `banco.equipe` (linha 224), esperar `toHaveCount(3)`. Verificar com `--repeat-each=30` do teste, 0 falhas.
- **Fix 2 (Alta)**: novo teste em `tests/sql-admin-mandatos.test.ts`: `leitura` inserida em `membros` do mandato A faz `update ... arquivado_em` direto e recebe `SEM_PERMISSAO`; mutante V5 passa a morrer.
- **Fix 3 (Alta)**: ajudante de ausência com barreira/espera nos testes citados; verificar que os mutantes EA2 e EB passam a morrer.
- **Fix 4 (Média)**: `lerTudo` na lista de Mandatos (ou teto registrado e aviso) e e2e com mais de 1.000 mandatos.
- **Fix 5, 6, 7, 8 (Média/Baixa)**: teste de `search_path`/privilégios das funções; teste de `NUVEM=false` com `Nuvem.tok`; autoteste de `vazou()` e regex sem âncora; asserção de botão desabilitado durante o envio.
- Pós-correção: rodar de novo `npm test`, `tsc` e o e2e (2 vezes mais o `--repeat-each` do teste 221) e repetir os mutantes V5, M13, E14, EA2, EB, E6b, E1t.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| ADM-01 | Implementing | Needs Fix (Lacuna 3: ausência de consulta passa cedo) |
| ADM-02 | Implementing | Needs Fix (Lacuna 2: `leitura` + membro no gatilho) |
| ADM-03 | Implementing | Verified (e2e do edge case "dois admins" é o teste intermitente, Lacuna 1) |
| ADM-04 | Implementing | Verified |
| ADM-05 | Implementing | Needs Fix (Lacuna 4: teto de 1.000 sem registro nem teste) |
| ADM-06 | Implementing | Verified |
| ADM-07 | Implementing | Verified |
| ADM-08 | Implementing | Needs Fix (Lacuna 2, mesma causa de ADM-02) |
| ADM-09 | Implementing | Verified (precisão: ver Lacuna 9) |
| ADM-10 | Implementing | Verified |
| ADM-11 | Implementing | Verified |
| ADM-12 | Implementing | Verified |
| ADM-13 | Implementing | Verified |
| ADM-14 | Implementing | Needs Fix (Lacuna 6: flag `NUVEM` sem teste que isole) |
| ADM-15 | Implementing | Verified (precisão: linhas "Exportar PDF" e "Enviar sugestão") |
| ADM-16 | Implementing | Verified |

---

## Summary

**Overall**: Not Ready (reaprovar depois dos fix tasks)

**Spec-anchored check**: 16/16 requisitos (todos os ACs e os 7 Edge Cases) com evidência `file:line`; 2 ACs com cobertura parcial (2.7/8.5 e 14.4); 8 lacunas de precisão da spec listadas.
**Sensor**: 61 de 73 mutantes mortos; 12 sobreviveram (9 relevantes, 3 equivalentes na prática).
**Gate**: unit 721/721, e2e 116/116 em 3 rodadas, tsc limpo; mas o teste `admin-equipe.spec.ts:221` falha ~7% em repetição.

**What works**: SQL (permissões, últimos admin e coordenação, auditoria só de inclusão e na mesma transação, privacidade das views por `information_schema`, fuso, RLS do uso), lógica pura (funil, travas, status mensal, busca, paginação, `lerTudo`) com mutantes mortos em todos os ramos testados, privacidade nos pedidos de rede e papel `leitura` nas telas.

**Next steps**: executar os Fix Plans 1 a 4 (obrigatórios para o PASS), depois 5 a 8, e disparar a re-verificação (iteração 1 de no máximo 3). T37 (spec da Fase 2) só depois do PASS.
