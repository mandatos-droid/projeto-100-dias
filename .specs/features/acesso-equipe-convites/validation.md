# Acesso, Equipe e Convites: relatório do Verifier

## Validation: acesso-equipe-convites — FAIL

**Data**: 2026-11-06
**Spec**: `.specs/features/acesso-equipe-convites/spec.md` (ACE-01 a ACE-07)
**Faixa do diff**: `ac19a35..7de8e8b` (42 commits, de `deaa5c5` a `7de8e8b`). `ac19a35` é o merge de `feat/painel-admin` nesta branch; o merge-base com `main` (`dd84572`) traz também os commits do `painel-admin`, que não são desta feature.
**Verifier**: sub-agente independente (autor ≠ verificador), sem código nem testes alterados. Sensor e sondas rodaram só num worktree temporário de `HEAD`.

**Motivo do FAIL**: três caminhos reais pela API (PostgREST) contornam os papéis que a spec manda o banco garantir (ACE-03.2, ACE-03.5, ACE-03.6 e o objetivo "ninguém suba o próprio acesso"). O primeiro passa por uma política que esta migration recriou (`mandatos_editar`) e não estava registrado em lugar nenhum. Os outros dois o autor anotou em `STATE.md:81` como "fora do escopo", mas a spec não os exclui. O resto da feature está bem coberto: gate verde, e o sensor matou 52 de 55 mutantes. As duas falhas que sobreviveram são menores e não mudam nenhum dado.

---

## Conclusão das tarefas

| Tarefa | Status | Observação |
| ------ | ------ | ---------- |
| T1 a T13 (banco) | ✅ Feitas | Commits `0eb4fc6` a `306a8b2` e `f87d398` (complemento da T1) |
| T14 a T22 (lógica pura) | ✅ Feitas | `da07552` a `2cd7084` |
| T23 a T26 (página do convite) | ✅ Feitas | `38e9302` a `482a2af` |
| T27 a T33 (Área do mandato e Equipe) | ✅ Feitas | `06e7903` a `a90abbe` |
| T34 a T37 (Guia legado e fechamento) | ✅ Feitas | `0d58279`, `d14992f`, `da3d9e3`, `cde3bc2` (ajuste de teste), `7de8e8b` |

Todas as 37 tarefas estão marcadas como feitas em `tasks.md` e têm commit.

---

## Critérios de aceite ancorados na spec

Legenda: ✅ o teste afirma o resultado definido pela spec · ❌ lacuna (sem evidência ou comportamento violado) · ⚠️ lacuna de precisão da spec ou teste que espelha a implementação.

### ACE-01: Criar um convite por link pessoal

| Critério | Resultado definido pela spec | Evidência (`arquivo:linha`, asserção) | Resultado |
| -------- | ---------------------------- | ------------------------------------- | --------- |
| 01.1 Gerar mostra link, validade e 3 botões | link completo, validade, "Copiar link", "Copiar mensagem pronta", "Abrir no WhatsApp" | `plataforma/e2e/mandato-equipe.spec.ts:51-55`: `toHaveText(\`${origem}/convite#${TOKEN}\`)`, `toContainText('Vale por 7 dias e só pode ser usado uma vez.')` e os três botões visíveis; `plataforma/tests/sql-convites.test.ts:225` chaves `['expira_em','id','token']` | ✅ |
| 01.2 Token no servidor, 128 bits, só o hash | só `sha256` gravado; 128 bits criptográficos | `plataforma/tests/sql-convites.test.ts:243` `confere: true`; `:253` nenhuma tabela contém o token; `:126-127` 22 caracteres e 1000 únicos; `:133` e `:143` 16 bytes, nenhum bit fixo | ✅ |
| 01.3 Link uma vez, nunca em listagens | listagem sem token, hash nem e-mail; o link some ao recarregar | `plataforma/tests/sql-convites.test.ts:429-433` só 5 colunas, sem token nem e-mail; `plataforma/e2e/mandato-equipe.spec.ts:242-244` link some e o token não fica no corpo nem no storage | ✅ |
| 01.4 Validade de 7 dias | `expira_em - criado_em = 7 dias` | `plataforma/tests/sql-convites.test.ts:231-236` `sete_dias: true` | ✅ |
| 01.5 E-mail normalizado | minúsculas, sem espaços nas pontas | `plataforma/tests/sql-convites.test.ts:261-262` `{ Um: 'carlos.lima@exemplo.com', Dois: null, Tres: null }` | ✅ |
| 01.6 Papel maior recusado | mensagem exata e nenhum convite | `plataforma/tests/sql-convites.test.ts:267-271` `PAPEL_MAIOR` (regex ancorada) e tabelas vazias; `plataforma/e2e/mandato-equipe.spec.ts:150-151` | ✅ |
| 01.7 Nome vazio ou >80 | "Informe um nome de até 80 caracteres." | `plataforma/tests/sql-convites.test.ts:291-295`; `plataforma/tests/convites-validacao.test.ts`; `plataforma/e2e/mandato-equipe.spec.ts:113-128` | ✅ |
| 01.8 E-mail inválido ou >254 | "E-mail inválido." | `plataforma/tests/sql-convites.test.ts:302-307`; `plataforma/e2e/mandato-equipe.spec.ts:137-140` | ✅ |
| 01.9 21º pendente | mensagem exata; 20º passa | `plataforma/tests/sql-convites.test.ts:317-325` | ✅ |
| 01.10 Não membro | erro de permissão | `plataforma/tests/sql-convites.test.ts:331` `{ code: '42501', message: ... }`, `:334` anon negado | ✅ |
| 01.11 Limpeza de mais de 30 dias | apaga vencidos ou cancelados há mais de 30 dias no mesmo mandato | `plataforma/tests/sql-convites.test.ts:351-353` (os de 29 dias, os usados e os de outro mandato ficam) | ✅ |

### ACE-02: Aceitar o convite e entrar no mandato

| Critério | Resultado definido pela spec | Evidência | Resultado |
| -------- | ---------------------------- | --------- | --------- |
| 02.1 Prévia sem consumir | quem convidou, nome parlamentar, cargo, UF e papel; não consome | `plataforma/tests/sql-convites.test.ts:567-573` (`deepEqual` do objeto inteiro, duas vezes; `usado_em` nulo); `plataforma/e2e/convite-aceite.spec.ts:26-34` | ✅ |
| 02.2 Sem sessão: criar conta, entrar, Google | os três caminhos | `plataforma/e2e/convite-conta.spec.ts:54-59` | ✅ |
| 02.3 Criar conta e entrar | conta, convite consumido, membro com o papel do convite | `plataforma/e2e/convite-conta.spec.ts:79-92`; `plataforma/tests/sql-convites.test.ts:712-718` | ✅ |
| 02.4 Aceitar com sessão | consome e inclui com o papel | `plataforma/e2e/convite-aceite.spec.ts:46-49`; `plataforma/tests/sql-convites.test.ts:716-718` | ✅ |
| 02.5 Google conclui o mesmo convite | aceite na volta, sem pedir o link | `plataforma/e2e/convite-conta.spec.ts:210-220`; `plataforma/tests/landing.test.ts:22` e `:30` | ✅ |
| 02.6 Abre o Guia no mandato aceito | `/guia` com o mandato aceito | `plataforma/e2e/convite-aceite.spec.ts:44-46` `legisla.mandatoAtual === MANDATO_ID`; o Guia lê essa chave em `plataforma/public/legacy/app.js:72` | ✅ |
| 02.7 Sessão em `legisla.tok` no formato do Guia | mesmo formato | `plataforma/e2e/convite-conta.spec.ts:91` `sessaoGuardada === SESSAO_GUIA` | ✅ (o formato é provado; nenhum teste abre o `/admin` depois) |
| 02.8 Consentimento antes do aceite | aviso do cadastro e registro em `consentimentos` antes do aceite | `plataforma/e2e/convite-conta.spec.ts:60` e `:81-87` (`ordemDe(consentimento) < ordemDe(aceite)`); `plataforma/tests/sql-convites.test.ts:728` | ✅ |
| 02.9 Outro e-mail | mensagem exata; convite segue válido | `plataforma/tests/sql-convites.test.ts:744-749`; `plataforma/e2e/convite-aceite.spec.ts:67-72` | ✅ |
| 02.10 Token inexistente | mensagem única, sem revelar | `plataforma/tests/sql-convites.test.ts:582-583`; `plataforma/e2e/convite-aceite.spec.ts:97-100` | ✅ |
| 02.11 Vencido, cancelado ou usado | mesma mensagem | `plataforma/tests/sql-convites.test.ts:582-583`, `:594`, `:804`; `plataforma/e2e/convite-aceite.spec.ts:108` | ✅ |
| 02.12 Dois aceites simultâneos | exatamente um conclui | `plataforma/tests/sql-convites.test.ts:767` (sequencial); `:775-778` procura `for update` no texto da função | ⚠️ simultaneidade real não reproduzível no PGlite; o teste espelha a implementação (regex no `prosrc`) |
| 02.13 Já é membro | mantém o papel, "Você já está neste mandato", não consome | `plataforma/tests/sql-convites.test.ts:785-791`; `plataforma/e2e/convite-aceite.spec.ts:57` | ✅ |
| 02.14 Mais de 10 inválidos em 10 min | bloqueio de 15 min com a mensagem | `plataforma/tests/sql-convites.test.ts:611-613`, `:628-632`, `:641-642`; `plataforma/e2e/convite-aceite.spec.ts:117` e `:126` | ✅ com ⚠️: "mesma origem" não é definida na spec; a implementação usa o 1º IP de `x-forwarded-for`, que o cliente pode forjar (`20261106120000_convites_equipe.sql:394-395`; pendência 3 do `STATE.md`) |
| 02.15 Falha ao criar conta | mostra o motivo; convite não consumido | `plataforma/e2e/convite-conta.spec.ts:114-118` e `:130-133` | ✅ |

### ACE-03: Papéis do mandato aplicados no banco

| Critério | Resultado definido pela spec | Evidência | Resultado |
| -------- | ---------------------------- | --------- | --------- |
| 03.1 Só três papéis | check em `membros.papel` | `plataforma/tests/sql-papeis.test.ts:54-65` | ✅ |
| 03.2 `leitura` não escreve | recusar **qualquer** escrita nos dados e nos membros do mandato | `plataforma/tests/sql-papeis.test.ts:76-78` (update em `mandatos` não muda linha) e `:83` (insert em `eventos` recusado). **Sonda S-2**: o criador do mandato rebaixado a `leitura` chama `excluir_mandato` e apaga o mandato inteiro (`20261020130000_excluir_mandato.sql:14`) | ❌ violado |
| 03.3 Guia oculta ou desabilita | controles de gravação travados | `plataforma/tests/legado-acesso.test.ts:202-203`; `plataforma/e2e/guia-acesso.spec.ts:169-170`, `:176-180`, `:194-199`, `:218` | ✅ |
| 03.4 Troca vale na chamada seguinte | papel lido da tabela a cada chamada | `plataforma/tests/sql-membros.test.ts:73-82`; `plataforma/tests/sql-papeis.test.ts:135-137` | ✅ |
| 03.5 Remover tira do mandato e mantém a conta | sai de `membros`; a conta fica | `plataforma/tests/sql-membros.test.ts:177-183`. **Sonda S-3**: o criador removido pela coordenação se reinsere como `coordenacao` por `POST /membros` (`20261016120000_schema_inicial.sql:150-156`) | ❌ a remoção é reversível pelo removido |
| 03.6 Só a coordenação troca papel ou remove | erro de permissão e nada muda | `plataforma/tests/sql-membros.test.ts:88-92`, `:98-102`, `:188-193`. **Sonda S-1**: `assessoria` vira `coordenacao` sem a coordenação, com `PATCH /mandatos {criado_por: eu}`, `rpc/membro_sair` e `POST /membros {papel:'coordenacao'}` | ❌ contornável pela API |
| 03.7 Última coordenação | mensagem exata e nada muda | `plataforma/tests/sql-membros.test.ts:108-111` (rebaixar), `:208-210` (remover), `:271-273` (sair) | ✅ com ⚠️: `excluir_meus_dados()` ainda deixa o mandato sem coordenação; a spec não diz se excluir a conta conta como "a própria saída" |
| 03.8 Rebaixamentos simultâneos | uma conclui, a outra é recusada | `plataforma/tests/sql-membros.test.ts:119-130` (sequencial); `:136-139` regex `for update` | ⚠️ simultaneidade não reproduzível; o teste espelha a implementação |
| 03.9 Sair por conta própria | sai, respeitando a coordenação | `plataforma/tests/sql-membros.test.ts:258-266` | ✅ |
| 03.10 Equipe Legisla intacta | `equipe_legisla` e o `/admin` não mudam | `plataforma/tests/sql-membros.test.ts:102` e `:203` `{ eventos: 0, legisla: 2 }`; nenhuma função da migration toca `equipe_legisla` (lido no código) | ✅ |
| 03.11 `leitura` convida só `leitura` e cancela só os próprios | — | `plataforma/tests/sql-convites.test.ts:269` e `:283-286`; `:466` (cancela o próprio); `:491` (recusa o alheio) | ✅ |

### ACE-04: Tela Equipe e convites

| Critério | Resultado definido pela spec | Evidência | Resultado |
| -------- | ---------------------------- | --------- | --------- |
| 04.1 Ordem da tela | formulário, pendentes, pessoas | `plataforma/e2e/mandato-equipe.spec.ts:529-532` | ✅ |
| 04.2 Só pendentes válidos, com nome, papel, quem convidou e dias | — | `plataforma/tests/sql-convites.test.ts:398-401`; `plataforma/e2e/mandato-equipe.spec.ts:303-306` | ✅ |
| 04.3 Cancelar remove da lista | — | `plataforma/e2e/mandato-equipe.spec.ts:328-333`; `plataforma/tests/sql-convites.test.ts:466` | ✅ |
| 04.4 Criador ou coordenação cancela | — | `plataforma/tests/sql-convites.test.ts:466-469`, `:478-479` | ✅ |
| 04.5 Outros recebem erro de permissão | — | `plataforma/tests/sql-convites.test.ts:488-492`; `plataforma/e2e/mandato-equipe.spec.ts:349-350` | ✅ |
| 04.6 Nome, e-mail, papel e "você" | — | `plataforma/e2e/mandato-equipe.spec.ts:423-429`; `plataforma/tests/sql-membros.test.ts:332-336` | ✅ |
| 04.7 Coordenação vê seletor e Remover | — | `plataforma/e2e/mandato-equipe.spec.ts:437-442` | ✅ |
| 04.8 Assessoria e leitura veem texto | — | `plataforma/e2e/mandato-equipe.spec.ts:449-453` | ✅ |
| 04.9 Papéis oferecidos por papel | — | `plataforma/e2e/mandato-equipe.spec.ts:93`; `plataforma/tests/convites-papeis.test.ts` | ✅ |
| 04.10 Atualiza sem recarregar | — | `plataforma/e2e/mandato-equipe.spec.ts:463-466` e `:502-506` (`marca === 1`) | ✅ |
| 04.11 Lista vazia | "Nenhum convite pendente." | `plataforma/e2e/mandato-equipe.spec.ts:364` | ✅ |
| 04.12 Linha da Legisla | texto exato | `plataforma/e2e/mandato-equipe.spec.ts:523` | ✅ |
| 04.13 400 px sem rolagem | `scrollWidth - clientWidth <= 0` | `plataforma/e2e/mandato-equipe.spec.ts:270-271` e `:551-552` | ✅ |

### ACE-05: Área do mandato

| Critério | Evidência | Resultado |
| -------- | --------- | --------- |
| 05.1 Cartão (foto, nome, cargo, UF, partido, posse) | `plataforma/e2e/mandato-area.spec.ts:30-31` e `:39-42` | ✅ |
| 05.2 Dia X de 100 em Brasília | `plataforma/e2e/mandato-area.spec.ts:63`, `:69`, `:74-77`, `:82`, `:88`; `plataforma/tests/convites-dias.test.ts` | ✅ |
| 05.3 Status das 5 missões | `plataforma/e2e/mandato-area.spec.ts:97-107`; `plataforma/tests/convites-missoes.test.ts` | ✅ (ver mutante T12) |
| 05.4 Resumo da equipe | `plataforma/e2e/mandato-area.spec.ts:182`, `:196`, `:201` | ✅ |
| 05.5 10 eventos mais recentes | `plataforma/e2e/mandato-area.spec.ts:258-260`; `plataforma/tests/convites-api.test.ts:204` (`order=criado_em.desc`, `limit=10`) | ✅ |
| 05.6 Editar dados | `plataforma/e2e/mandato-area.spec.ts:136-138` | ✅ |
| 05.7 Seletor com 2 ou mais | `plataforma/e2e/mandato-casca.spec.ts:85-89` e `:95-97` | ✅ |
| 05.8 Sem seletor com 1 | `plataforma/e2e/mandato-casca.spec.ts:59` | ✅ |
| 05.9 Nenhum mandato | `plataforma/e2e/mandato-casca.spec.ts:134-136` | ✅ |
| 05.10 Leitura sem "Editar dados" | `plataforma/e2e/mandato-area.spec.ts:145-146` | ✅ |

### ACE-06: Histórico da equipe

| Critério | Evidência | Resultado |
| -------- | --------- | --------- |
| 06.1 Criado, aceito e cancelado gravam linha na transação | `plataforma/tests/sql-convites.test.ts:359-362`, `:513-516`, `:828-831` | ✅ |
| 06.2 Troca, remoção e saída gravam linha | `plataforma/tests/sql-membros.test.ts:147-150`, `:232-235`, `:297-300` | ✅ |
| 06.3 Falha do histórico desfaz a ação | `plataforma/tests/sql-convites.test.ts:370-371`, `:524-525`, `:840-842`; `plataforma/tests/sql-membros.test.ts:157-158`, `:242-243`, `:307-308` | ✅ |
| 06.4 Só inclusão | `plataforma/tests/sql-eventos-equipe.test.ts:73-78` e `:85-88` | ✅ |
| 06.5 `eventos` sem linhas de acesso | `plataforma/tests/sql-convites.test.ts:363`, `:517`, `:832`; `plataforma/tests/sql-membros.test.ts:151` | ✅ |
| 06.6 Não membro não lê | `plataforma/tests/sql-eventos-equipe.test.ts:58-62` e `:67` | ✅ |

### ACE-07: Retirar o código de convite antigo

| Critério | Evidência | Resultado |
| -------- | --------- | --------- |
| 07.1 `entrar_com_codigo` sem execução | `plataforma/tests/sql-convites.test.ts:858` e `:862-865` `{ anon: false, authenticated: false }` | ✅ |
| 07.2 Guia sem campo, botão nem mensagem | `plataforma/e2e/guia-acesso.spec.ts:118`, `:123-126`, `:134-137`; `plataforma/tests/legado-acesso.test.ts:123` e `:159` | ✅ |
| 07.3 Cadastro novo cria `coordenacao` | `plataforma/tests/sql-convites.test.ts:875`; `plataforma/e2e/guia-acesso.spec.ts:158-159` | ✅ |
| 07.4 "link de convite" no aviso, resto igual | `plataforma/tests/legado-acesso.test.ts:260`, `:264`, `:268`, `:272` (hash do corpo original) | ✅ |
| 07.5 `mandatos.codigo` interno, fora das telas | `plataforma/tests/sql-convites.test.ts:882-888`; `plataforma/e2e/guia-acesso.spec.ts:135` | ✅ |

**Status**: ❌ lacunas presentes (ACE-03.2, ACE-03.5, ACE-03.6) · ⚠️ 5 lacunas de precisão (02.12, 02.14, 03.7, 03.8 e a borda "orientar a promover", abaixo).

---

## Sondas de comportamento (fora do sensor)

Arquivo de sonda só no worktree temporário (`tests/zz-sonda.test.ts`), sobre as migrations reais no PGlite. As três primeiras usam só chamadas que o PostgREST expõe a `authenticated`.

| Sonda | Passos (como a pessoa, pela API) | Resultado observado | Critério atingido |
| ----- | -------------------------------- | ------------------- | ----------------- |
| S-1 | `assessoria`: `update mandatos set criado_por = eu` → `membro_sair()` → `insert into membros (..., papel 'coordenacao')` | update afetou 1 linha; reinserção aceita; papel final `coordenacao` | ACE-03.6, objetivo 3 da spec |
| S-2 | criador rebaixado a `leitura` pela coordenação chama `excluir_mandato()` | sem erro; o mandato deixou de existir | ACE-03.2 |
| S-3 | criador removido por `membro_remover()` faz `insert into membros (..., papel 'coordenacao')` | aceito; papel final `coordenacao` | ACE-03.5, ACE-03.6 |
| S-4 | `leitura` insere em `uso_funcionalidades` | aceito | ⚠️ telemetria; a spec não diz se conta como "dados do mandato" |

Causa comum: `mandatos.criado_por` funciona como credencial (`membros_criar` em `20261016120000_schema_inicial.sql:150-156` e `excluir_mandato` em `20261020130000_excluir_mandato.sql:14`), e a política `mandatos_editar`, recriada por esta feature em `20261106120000_convites_equipe.sql:44-47`, deixa qualquer `assessoria` ou `coordenacao` reescrever essa coluna. O design (tabela de riscos, linha `mandatos_editar`) tratou só de `leitura` gravar e não viu a coluna.

---

## Sensor de discriminação

**Profundidade**: P0 (auth, permissões e integridade): 55 mutações manuais de comportamento, além das sondas.
**Isolamento**: `git worktree add --detach <scratchpad>/wt HEAD`, com `node_modules` ligado por junção e servidor próprio (`next dev --webpack -p 3300`, `reuseExistingServer: false`). Cada mutante foi aplicado, testado e revertido; o worktree foi descartado no fim. Sem `git stash`.

### Banco (`plataforma/supabase/migrations/20261106120000_convites_equipe.sql`), testes `tests/sql-*.test.ts`

| # | Mutação | Morto? |
| - | ------- | ------ |
| S01 | Token guardado em claro (sem `sha256`) em `convite_criar` | ✅ |
| S02 | Convite reutilizável: o aceite não marca `usado_em` | ✅ |
| S03 | Expiração ignorada na prévia | ✅ |
| S04 | Expiração ignorada no aceite | ✅ |
| S05 | Bloqueio por origem ignorado na prévia | ✅ |
| S06 | Limite de tentativas: `> 10` vira `> 11` | ✅ |
| S07 | Bloqueio por origem ignorado no aceite | ✅ |
| S08 | `leitura` passa a editar (`pode_editar` inclui `leitura`) | ✅ |
| S09 | Última coordenação removível (`membro_remover`) | ✅ |
| S10 | Última coordenação sai (`membro_sair`) | ✅ |
| S11 | Última coordenação rebaixável (`membro_trocar_papel`) | ✅ |
| S12 | E-mail vinculado ignorado no aceite | ✅ |
| S13 | Hierarquia de papel removida em `convite_criar` | ✅ |
| S14 | Qualquer membro cancela convite alheio | ✅ |
| S15 | Consentimento ignorado no aceite | ✅ |
| S16 | Quem já é membro consome o convite | ✅ |
| S17 | Limite de 20 pendentes: `>= 20` vira `> 20` | ✅ |
| S18 | Retenção apaga vencidos de 28 dias | ✅ |
| S19 | `assessoria` troca papel (guarda afrouxada) | ✅ |
| S20 | `assessoria` remove membro (guarda afrouxada) | ✅ |
| S21 | Token com os bits fixos de versão do UUID | ✅ |
| S22 | A prévia devolve o e-mail do convite | ✅ |
| S23 | `eventos_equipe` aberta a escrita pela API | ✅ |
| S24 | Troca de papel sem linha no histórico | ✅ |
| S25 | `entrar_com_codigo` segue executável por `authenticated` | ✅ |
| S26 | `convites_pendentes` lista vencidos | ✅ |
| S27 | `equipe_do_mandato` aberta a quem não é membro | ✅ |
| S28 | Aceite sem linha no histórico | ✅ |
| S29 | `eventos_equipe` legível por quem não é membro | ✅ |

### Lógica pura e Guia (`lib/`, `public/legacy/acesso.js`), testes `tests/*.test.ts`

| # | Mutação | Morto? |
| - | ------- | ------ |
| T01 | `destinoAuth` ignora o convite pendente | ✅ |
| T02 | `destinoAuth` manda ao `/convite` sem token pendente | ✅ |
| T03 | `lePendente` não valida o formato | ✅ |
| T04 | `papeisPermitidos` concede os três papéis a qualquer um | ✅ |
| T05 | `podeGerirEquipe` vale para `assessoria` | ✅ |
| T06 | `tokenDoHash` aceita de 20 a 24 caracteres | ✅ |
| T07 | Nome de 81 caracteres aceito | ✅ |
| T08 | E-mail de 255 caracteres aceito | ✅ |
| T09 | Erro `email` com a mensagem de convite inválido | ✅ |
| T10 | Dia X de 100: erro de um no fim (`>=` vira `>`) | ✅ |
| T11 | Dia X de 100 contado em UTC | ✅ |
| T12 | Missão conta exercício com valor verdadeiro que não é `true` (`=== true` vira `!!`) | ❌ sobreviveu (`plataforma/lib/convites/missoes.ts:15`); equivalente na prática, porque o Guia só grava `true`/`false` (`plataforma/public/legacy/guia.js:139`, `:144`) |
| T13 | Histórico lê 20 eventos | ✅ |
| T14 | `trocaPapel` envia o argumento com nome errado | ✅ |
| T15 | Guia: tirar a guarda de `leitura` de `Store.salvar` (`plataforma/public/legacy/acesso.js:75`) | ❌ sobreviveu. Nenhuma gravação sai, porque o `salvar` original agenda `s.gravar()` (`plataforma/public/legacy/nucleo.js:198`), que também tem guarda (`acesso.js:76`). O único efeito é o indicador "Salvando…" (`nucleo.js:221`) ficar preso para quem é `leitura`, e nenhum teste o confere. O teste de unidade (`plataforma/tests/legado-acesso.test.ts:224-228`) também confere logo depois da chamada, antes dos 700 ms |
| T16 | Guia: `leitura()` nunca reconhece o papel | ✅ |
| T17 | Guia: o bloco do código de convite volta ao cadastro | ✅ |
| T18 | Guia: `Store.atualizar` grava como `leitura` | ✅ |

### Telas (e2e)

| # | Mutação | Morto? |
| - | ------- | ------ |
| E01 | `Referrer-Policy` removido de `/convite` (`next.config.mjs`) | ✅ (`e2e/convite-cabecalhos.spec.ts:8`) |
| E02 | `assessoria` vê seletor de papel e "Remover" (`ListaPessoas.tsx`) | ✅ (`e2e/mandato-equipe.spec.ts:447`) |
| E03 | O aceite não grava `legisla.mandatoAtual` (`Convite.tsx`) | ✅ (`e2e/convite-aceite.spec.ts:39`, 3 testes) |
| E04 | Criar conta pelo convite não grava o consentimento (`Convite.tsx`) | ✅ (`e2e/convite-conta.spec.ts:72`) |
| E05 | Google: o token pendente não é guardado antes de sair (`FormularioConta.tsx`) | ✅ (`e2e/convite-conta.spec.ts:202`, 3 testes) |
| E06 | `leitura` vê "Editar dados" (`AreaMandato.tsx`) | ✅ (`e2e/mandato-area.spec.ts:142`) |
| E07 | Guia `leitura`: campos não travados (`acesso.js`) | ✅ (`e2e/guia-acesso.spec.ts:173`, 2 testes) |
| E08 | Mesma falha do T15, rodada contra `e2e/guia-acesso.spec.ts` (bloco "somente leitura") | ❌ sobreviveu (8 de 8 passaram): o `:202-218` espera 1500 ms e confirma que nada é gravado, o que segue certo pela guarda de `Store.gravar` |

**Resultado do sensor**: 55 execuções de mutação (29 no banco, 18 em lógica e Guia, 8 em telas). 52 mortas, 3 sobreviveram. As 3 sobreviventes são 2 falhas distintas (T12; T15 e E08 são a mesma), ambas sem efeito em dados: T12 é equivalente na prática e T15/E08 só deixa preso o indicador "Salvando…". Todas as falhas de segurança pedidas foram mortas: token em claro (S01), convite reutilizável (S02), expiração ignorada (S03, S04), limite de tentativas removido (S05 a S07), `leitura` escrevendo (S08), última coordenação removível (S09 a S11), e-mail vinculado ignorado (S12), `Referrer-Policy` removido (E01) e `destinoAuth` sem token pendente (T01, T02). Os mutantes não pegam os 3 caminhos de escalada das sondas, porque eles existem no código atual: são lacunas de comportamento, não de teste.

---

## Qualidade do código

| Princípio | Status |
| --------- | ------ |
| Código mínimo, sem escopo extra | ✅ |
| Mudanças cirúrgicas (`app.js` e `cadastro.js` intocados; ajustes do Guia em `acesso.js`) | ✅ |
| Segue os padrões do projeto (security definer, `search_path` vazio, imports `.ts` relativos) | ✅ |
| Resultado definido pela spec afirmado nos testes (mensagens com regex ancorada, `deepEqual` de objetos inteiros) | ✅ |
| Cobertura por camada (banco 1:1 com ACs; telas com caminho feliz, bordas e erros) | ✅ |
| Todo teste mapeia um AC, borda ou "Done when" | ✅ |
| Diretrizes: `plataforma/AGENTS.md`, AD-004 em `.specs/STATE.md` | ✅ |
| Integridade dos testes: +224 testes (725 → 949), nenhuma linha de teste removida no diff | ✅ |
| Testes que espelham a implementação: regex sobre `prosrc` para `for update` em `plataforma/tests/sql-convites.test.ts:775` e `plataforma/tests/sql-membros.test.ts:136`, `:223`, `:314` | ⚠️ aceitável como guarda estrutural, não prova a simultaneidade |

---

## Bordas da spec

- [x] Mesmo e-mail convidado duas vezes: cada link vale por si (o `token_hash` é único por convite; não há restrição por e-mail).
- [x] Convite aberto em outro aparelho: o estado fica no banco (`convite_previa`).
- [x] Página fechada no meio do Google: o convite segue válido (`plataforma/e2e/convite-conta.spec.ts:234`).
- [x] Sessão vencida durante o aceite: pede login e retoma o convite (`plataforma/e2e/convite-conta.spec.ts:250` e `:261`).
- [x] Conta com outro e-mail: recusa sem consumir (ACE-02.9).
- [ ] Última coordenação tenta sair: o banco recusa (`plataforma/tests/sql-membros.test.ts:271`), mas nada "orienta a promover outra pessoa antes": a mensagem é a da ACE-03.7 e não há botão "Sair do mandato" na interface (`STATE.md`, acompanhamento 5). ⚠️ menor.

---

## Gate

- **Comandos**: `npx tsc --noEmit`, `npm test` e `npx playwright test e2e/convite-*.spec.ts e2e/mandato-*.spec.ts e2e/guia-acesso.spec.ts` (em `plataforma/`).
- **`npx tsc --noEmit`**: 0 erros (exit 0).
- **`npm test`**: 949 passaram, 0 falharam, 0 pulados (árvore real; `plataforma/` sem alterações fora do commit).
- **e2e**: 137 passaram, 0 falharam. Rodados num worktree limpo de `HEAD` com servidor próprio na porta 3300, porque a 3000 era o `next dev` do usuário e o `reuseExistingServer` da config o reaproveitaria. Com `node_modules` por junção o Turbopack recusa o link, então o servidor do worktree rodou com `--webpack`.
- **Antes e depois**: 725 testes de unidade e SQL na base (`ac19a35`), 949 depois (+224).
- **Infraestrutura**: o `next dev` às vezes para com um aviso de vulnerabilidade conhecida do Next 16.4 (o mesmo `SecurityFatalError` do `STATE.md`); repetir o comando resolve. Nenhum upgrade foi feito.

---

## Planos de correção

### Correção 1 (Alta): `criado_por` reescrevível dá caminho de escalada (ACE-03.6, objetivo 3)

- **Causa**: `mandatos_editar` (`20261106120000_convites_equipe.sql:44-47`) deixa quem pode editar trocar `mandatos.criado_por`; `membros_criar` e `excluir_mandato` confiam nessa coluna.
- **Tarefa**: em migration nova, tornar `criado_por` imutável pela API (gatilho no molde de `mandatos_trava_arquivo`: se `new.criado_por is distinct from old.criado_por` e há `auth.uid()`, erro `42501`), ou trocar o `grant update` de `mandatos` por grant de colunas sem `criado_por`.
- **Verificar**: teste de SQL que repete a sonda S-1 e espera erro de permissão no `update` e papel inalterado.
- **Feito quando**: nenhum membro muda `criado_por`; o Guia segue salvando os dados do mandato (regressão em `plataforma/tests/legado-acesso.test.ts:231`).

### Correção 2 (Alta): `membros_criar` deixa o criador se reinserir com qualquer papel (ACE-03.5, ACE-03.6)

- **Causa**: `20261016120000_schema_inicial.sql:150-156` aceita `user_id = eu` sempre que `mandatos.criado_por = eu`.
- **Tarefa**: limitar a política à primeira linha do mandato (nenhum membro ainda) e a `papel = 'coordenacao'`, que é o fluxo de `criarMandato` do Guia.
- **Verificar**: teste que repete a sonda S-3 (criador removido não volta) e regressão de `plataforma/tests/sql-convites.test.ts:868` (cadastro novo segue como `coordenacao`).

### Correção 3 (Alta): `excluir_mandato` aceita o criador em qualquer papel (ACE-03.2)

- **Causa**: `20261020130000_excluir_mandato.sql:14` aceita `criado_por = eu` mesmo sem ser membro ou sendo `leitura`.
- **Tarefa**: exigir papel atual `coordenacao` (via `private.papel_no_mandato`) e tirar o ramo `criado_por`.
- **Verificar**: teste que repete a sonda S-2 (criador `leitura` recebe recusa e o mandato fica) e um teste com a coordenação apagando o mandato.

### Correção 4 (Menor): guarda de `Store.salvar` mascarada pela de `Store.gravar` (mutantes T15 e E08)

- **Tarefa**: testar a guarda de `Store.salvar` isolada. Em `plataforma/tests/legado-acesso.test.ts:222-229`, conferir que, como `leitura`, `salvar()` não agenda gravação nem marca "Salvando…" (`[data-salvo]`), e conferir `pedidos` só depois dos 700 ms de espera (relógio falso ou espera real).
- **Verificar**: T15 morre no teste de unidade.

### Correção 5 (Menor): `statusMissoes` com valor verdadeiro que não é `true` (mutante T12)

- **Tarefa**: decidir a regra (o Guia usa verdade simples em `plataforma/public/legacy/nucleo.js:247`; `missoes.ts` usa `=== true`) e fixá-la com um caso de valor `1` ou `'sim'` em `plataforma/tests/convites-missoes.test.ts`.

### Decisões que pedem o dono do produto (lacunas de precisão)

1. Definir "mesma origem" (ACE-02.14): o 1º IP de `x-forwarded-for` pode ser forjado; considerar o último IP confiável ou `cf-connecting-ip`.
2. Dizer se `excluir_meus_dados()` conta como "a própria saída" (ACE-03.7).
3. Dizer se a telemetria `uso_funcionalidades` entra em "dados do mandato" (ACE-03.2).
4. Aceitar formalmente que ACE-02.12 e ACE-03.8 só têm prova estrutural (`for update`) e sequencial, ou pedir um teste com duas conexões (Postgres real).
5. Borda "orientar a promover outra pessoa antes": mensagem própria e onde fica o botão "Sair".

---

## Rastreabilidade (sugestão para `spec.md`, não aplicada pelo Verifier)

| Requisito | Antes | Novo status |
| --------- | ----- | ----------- |
| ACE-01 | Pending | ✅ Verified |
| ACE-02 | Pending | ✅ Verified (com ⚠️ em 02.12 e 02.14) |
| ACE-03 | Pending | ❌ Needs Fix (03.2, 03.5, 03.6) |
| ACE-04 | Pending | ✅ Verified |
| ACE-05 | Pending | ✅ Verified |
| ACE-06 | Pending | ✅ Verified |
| ACE-07 | Pending | ✅ Verified |

---

## Resumo

**Geral**: ❌ Não pronto.

**Verificação ancorada na spec**: 71 critérios. 66 têm evidência no resultado definido pela spec; 3 estão violados (ACE-03.2, 03.5, 03.6, provados por sonda); 2 só têm prova estrutural e sequencial (02.12, 03.8). Há mais 3 lacunas de precisão (02.14, 03.7 e a borda "orientar a promover").
**Sensor**: 52 de 55 mortos. Sobreviveram T12 e T15/E08 (Menores, sem efeito em dados). Porcelain da árvore real idêntico antes e depois (114 linhas).
**Gate**: tsc 0 erros; 949/949 unidade e SQL; 137/137 e2e.

**O que funciona**: o ciclo de convite inteiro (token só como hash, prévia sem consumo, limite de tentativas, aceite atômico, e-mail vinculado, consentimento antes do aceite, retorno do Google), papéis nas funções novas, histórico na transação, telas e Guia somente leitura, aposentadoria do código.

**Próximo passo**: correções 1 a 3 (Altas) numa migration nova com os testes das sondas; depois correções 4 e 5 e as decisões de precisão; então um novo Verifier (iteração 2 de 3).
