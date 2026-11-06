# Acesso, Equipe e Convites: relatório do Verifier

## Validation: acesso-equipe-convites — FAIL (iteração 2 de 3)

**Data**: 2026-11-06
**Spec**: `.specs/features/acesso-equipe-convites/spec.md` (ACE-01 a ACE-07)
**Faixa do diff**: feature inteira `ac19a35..abf711e`; correções desta iteração `1523e65..abf711e` (`336ae11`, `cb6f20d`, `fb8dd0e`, `f25911d`, `abf711e`: migration `plataforma/supabase/migrations/20261106130000_papeis_blindagem.sql`, 8 testes em `plataforma/tests/sql-membros.test.ts`, 1 asserção em `plataforma/tests/legado-acesso.test.ts`, `STATE.md` e lições).
**Verifier**: sub-agente independente (autor ≠ verificador). Nenhum código ou teste foi alterado. Sondas, sensor e e2e rodaram em worktrees temporários de `HEAD` (`git worktree add --detach`), descartados no fim, sem `git stash`.

**Motivo do FAIL**: as três falhas altas da iteração 1 estão fechadas. As sondas S-1, S-2 e S-3, re-executadas contra `HEAD`, são recusadas, e os testes novos as fixam. Mas a busca por variantes da mesma classe achou outro caminho (V-1): o convite pendente sobrevive ao rebaixamento ou à remoção de quem o criou, e essa pessoa pode aceitá-lo ela mesma. Assim, uma coordenação rebaixada a `leitura` ou removida volta como `coordenacao`, sem nenhuma ação da coordenação atual, e remove quem a rebaixou. Isso viola ACE-03.5 e ACE-03.6, o objetivo 3 da spec e o motivo da decisão "Limite do papel concedido" (`spec.md:41`: impedir que alguém "escale o próprio acesso" por convite). Há ainda dois mutantes novos sobreviventes na migration da correção (B06, B08): o código atual está certo, mas nenhum teste isola essas duas guardas.

---

## Situação das falhas da iteração 1

| Falha | Correção em `HEAD` | Teste que a fixa (`arquivo:linha`, asserção) | Sonda re-executada contra `HEAD` | Status |
| ----- | ------------------ | -------------------------------------------- | -------------------------------- | ------ |
| S-1: `assessoria` reescreve `criado_por`, sai e volta como `coordenacao` | gatilho `mandatos_trava_criador` (`20261106130000_papeis_blindagem.sql:16-30`) | `plataforma/tests/sql-membros.test.ts:380` `assert.rejects(trocaCriador(ASSESSORIA), SEM_PERMISSAO)`, `:384` reinserção recusada por RLS, `:386` papéis finais; `:392` ninguém troca `criado_por`, nem a coordenação; `:397-398` o resto segue editável; `:402` sem uid a coluna muda | update → `42501 Você não tem permissão para esta ação.`; insert → RLS; papel final inalterado | ✅ fechada |
| S-2: criador rebaixado a `leitura` exclui o mandato | `excluir_mandato` exige `coordenacao` atual (`:67-79`) | `:455` e `:460` `assert.rejects(excluirMandato(), SO_COORDENACAO_EXCLUI)`, `:456` e `:461` o mandato existe; `:468` e `:471` outros papéis e anon recusados; `:481` e `:485` a coordenação exclui | `42501 Só a coordenação do mandato pode excluir o cadastro.`; mandato existe | ✅ fechada |
| S-3: criador removido se reinsere como `coordenacao` | `membros_criar` só na primeira linha e só `coordenacao` (`:45-54`); `mandatos_ler` por `criado_por` só com o mandato vazio (`:58-63`) | `:413` reinserção recusada com os três papéis, `:415` papéis, `:417` `select id from mandatos` vazio; `:426` quem saiu também não volta | insert → RLS; 0 mandatos visíveis ao removido | ✅ fechada |
| T15/E08: guarda de `Store.salvar` mascarada | asserção nova | `plataforma/tests/legado-acesso.test.ts:228` `assert.equal(document.salvo.textContent, '')` | mutante T15 agora morto | ✅ fechada |
| T12: `=== true` em `missoes.ts` | não alterado; aceito como equivalente (`STATE.md`, Handoff) | — | segue sobrevivendo | ⚠️ aceito |

---

## Sondas de variantes da mesma classe (iteração 2)

Arquivo de sonda só no worktree temporário, sobre as migrations reais no PGlite (`tests/sql-ambiente.ts`, que reproduz os privilégios padrão do Supabase). Só chamadas que o PostgREST expõe a `authenticated`.

| Sonda | Passos (como a pessoa, pela API) | Resultado observado | Critério |
| ----- | -------------------------------- | ------------------- | -------- |
| **V-1** | a coordenação que criou o mandato gera `convite_criar(A, 'Reserva', null, 'coordenacao')` e guarda o link; promove outra pessoa; é rebaixada a `leitura`; `membro_sair(A)`; `convite_aceitar(token)`; `membro_remover(A, nova coordenação)` | todos aceitos; estado final `{ CRIADOR: coordenacao, LEITOR: leitura }`: a coordenação que a rebaixou foi removida | ❌ ACE-03.6, objetivo 3 |
| **V-1b** | igual, mas a pessoa é **removida** pela nova coordenação e depois aceita o próprio convite | aceito; volta como `coordenacao`. A nova coordenação via o convite em "pendentes" (`Reserva`, `coordenacao`, convidado por `Mario Membro`) | ❌ ACE-03.5 |
| **V-1c** | `assessoria` gera convite `assessoria`, é rebaixada a `leitura`, sai e aceita | volta como `assessoria` e grava em `mandatos` (1 linha) | ❌ ACE-03.6 (recupera escrita) |
| V-2 | `upsert` (`insert ... on conflict (id) do update set criado_por`) como `assessoria` | `42501`; `criado_por` inalterado | ✅ |
| V-3/V-4 | `criado_por` para nulo (`assessoria`) e de nulo para si (coordenação do mandato B) | ambos `42501` | ✅ |
| V-5 | só restam a coordenação X e quem criou (rebaixada a `leitura`); X chama `excluir_meus_dados()`; quem criou sai e entra direto como `coordenacao` | aceito (o mandato fica vazio, e `membros_criar` vale para quem criou) | ⚠️ depende da decisão sobre `excluir_meus_dados` (ACE-03.7) |
| V-6 | removido lê `mandatos`, `membros`, `eventos`, `eventos_equipe`, `v_panorama`, `equipe_do_mandato`, `convites_pendentes` | 0 linhas ou `42501` em todas | ✅ |
| V-7 | `leitura`: `update membros set papel='coordenacao'`; `upsert` em `membros`; `delete` de `membros` e de `mandatos` direto; `membro_trocar_papel` em si; convite `coordenacao` | 0 linhas, RLS, `permission denied` ou a mensagem de papel maior | ✅ |
| S-4 | `leitura` insere em `uso_funcionalidades` | aceito | ⚠️ telemetria (inalterado; acompanhamento 1 do `STATE.md`) |

**Fluxo legítimo** (mesmo arquivo, todas aceitas): cadastro novo como o Guia faz (`POST mandatos` com `return=representation`, depois `POST membros` com `papel:'coordenacao'`, como em `plataforma/public/legacy/nucleo.js:155-157`), leitura do mandato depois (`Seletor.ir`, `meusMandatos`), convite aceito, Guia salvando como `assessoria` (`PATCH {dados, atualizado_em}` e `PATCH` dos campos de `colher()`, sem `criado_por`), coordenação trocando papel e removendo, admin arquivando, coordenação excluindo.

**Dados que já existem (como em produção)**: com todas as migrations menos a última aplicadas e dados semeados (mandato com coordenação e assessoria, mandato com `criado_por` nulo, dois mandatos órfãos sem membros), `20261106130000_papeis_blindagem.sql` aplicou sem erro e reaplicou sem erro (idempotente). Depois dela: a coordenação e a assessoria antigas editam, a coordenação do mandato sem `criado_por` edita, quem criou o órfão o vê e entra como `coordenacao`, e a coordenação antiga exclui. Apagar a conta de quem criou um mandato (cascata `on delete set null` em `criado_por`) passa sem uid na sessão (GoTrue, painel do Supabase). Dentro de uma sessão com uid, a mesma cascata é recusada pelo gatilho. Hoje nenhum caminho do código apaga `auth.users` assim (busca por `deleteUser` e `delete from auth.users`), então isso é só observação.

**Causa de V-1**: `convite_aceitar` (`plataforma/supabase/migrations/20261106120000_convites_equipe.sql:475-494`) só confere o próprio convite (pendente, e-mail, consentimento, se a pessoa já é membro). Não confere se quem criou o convite ainda tem papel para concedê-lo. E `membro_trocar_papel` (`:133-153`), `membro_remover` (`:159-180`) e `membro_sair` (`:186-206`) não cancelam os convites pendentes da pessoa afetada. A hierarquia de `convite_criar` (`:315`) é conferida só na criação. Mitigação parcial: o convite aparece em "Convites pendentes" com quem convidou, a coordenação pode cancelá-lo, e o aceite grava `convite_aceito` no histórico. Um convite comum, criado para outra pessoa e sem e-mail, também serve a quem o criou, que viu o link.

---

## Critérios de aceite ancorados na spec

Legenda: ✅ o teste afirma o resultado definido pela spec · ❌ lacuna (sem evidência ou comportamento violado) · ⚠️ lacuna de precisão da spec ou teste que espelha a implementação.

### ACE-01: Criar um convite por link pessoal

| Critério | Resultado definido pela spec | Evidência (`arquivo:linha`, asserção) | Resultado |
| -------- | ---------------------------- | ------------------------------------- | --------- |
| 01.1 Gerar mostra link, validade e 3 botões | link completo, validade, "Copiar link", "Copiar mensagem pronta", "Abrir no WhatsApp" | `plataforma/e2e/mandato-equipe.spec.ts:51-55`: `toHaveText(\`${origem}/convite#${TOKEN}\`)`, `toContainText('Vale por 7 dias e só pode ser usado uma vez.')` e os três botões visíveis; `plataforma/tests/sql-convites.test.ts:225` chaves `['expira_em','id','token']` | ✅ |
| 01.2 Token no servidor, 128 bits, só o hash | só `sha256` gravado; 128 bits criptográficos | `plataforma/tests/sql-convites.test.ts:243` `confere: true`; `:253` nenhuma tabela contém o token; `:126-127` 22 caracteres e 1000 únicos; `:133` e `:143` 16 bytes, nenhum bit fixo | ✅ |
| 01.3 Link uma vez, nunca em listagens | listagem sem token, hash nem e-mail; o link some ao recarregar | `plataforma/tests/sql-convites.test.ts:429-433`; `plataforma/e2e/mandato-equipe.spec.ts:242-244` | ✅ |
| 01.4 Validade de 7 dias | `expira_em - criado_em = 7 dias` | `plataforma/tests/sql-convites.test.ts:231-236` `sete_dias: true` | ✅ |
| 01.5 E-mail normalizado | minúsculas, sem espaços nas pontas | `plataforma/tests/sql-convites.test.ts:261-262` | ✅ |
| 01.6 Papel maior recusado | mensagem exata e nenhum convite | `plataforma/tests/sql-convites.test.ts:267-271` `PAPEL_MAIOR` (regex ancorada); `plataforma/e2e/mandato-equipe.spec.ts:150-151` | ✅ na criação (ver V-1: o limite não é conferido de novo no aceite) |
| 01.7 Nome vazio ou >80 | "Informe um nome de até 80 caracteres." | `plataforma/tests/sql-convites.test.ts:291-295`; `plataforma/e2e/mandato-equipe.spec.ts:113-128` | ✅ |
| 01.8 E-mail inválido ou >254 | "E-mail inválido." | `plataforma/tests/sql-convites.test.ts:302-307`; `plataforma/e2e/mandato-equipe.spec.ts:137-140` | ✅ |
| 01.9 21º pendente | mensagem exata; 20º passa | `plataforma/tests/sql-convites.test.ts:317-325` | ✅ |
| 01.10 Não membro | erro de permissão | `plataforma/tests/sql-convites.test.ts:331` `{ code: '42501', message: ... }`, `:334` anon negado | ✅ |
| 01.11 Limpeza de mais de 30 dias | apaga vencidos ou cancelados há mais de 30 dias no mesmo mandato | `plataforma/tests/sql-convites.test.ts:351-353` | ✅ |

### ACE-02: Aceitar o convite e entrar no mandato

| Critério | Resultado definido pela spec | Evidência | Resultado |
| -------- | ---------------------------- | --------- | --------- |
| 02.1 Prévia sem consumir | quem convidou, nome parlamentar, cargo, UF e papel; não consome | `plataforma/tests/sql-convites.test.ts:567-573`; `plataforma/e2e/convite-aceite.spec.ts:26-34` | ✅ |
| 02.2 Sem sessão: criar conta, entrar, Google | os três caminhos | `plataforma/e2e/convite-conta.spec.ts:54-59` | ✅ |
| 02.3 Criar conta e entrar | conta, convite consumido, membro com o papel do convite | `plataforma/e2e/convite-conta.spec.ts:79-92`; `plataforma/tests/sql-convites.test.ts:712-718` | ✅ |
| 02.4 Aceitar com sessão | consome e inclui com o papel | `plataforma/e2e/convite-aceite.spec.ts:46-49`; `plataforma/tests/sql-convites.test.ts:716-718` | ✅ |
| 02.5 Google conclui o mesmo convite | aceite na volta, sem pedir o link | `plataforma/e2e/convite-conta.spec.ts:210-220`; `plataforma/tests/landing.test.ts:22` e `:30` | ✅ |
| 02.6 Abre o Guia no mandato aceito | `/guia` com o mandato aceito | `plataforma/e2e/convite-aceite.spec.ts:44-46` `legisla.mandatoAtual === MANDATO_ID` | ✅ |
| 02.7 Sessão em `legisla.tok` no formato do Guia | mesmo formato | `plataforma/e2e/convite-conta.spec.ts:91` `sessaoGuardada === SESSAO_GUIA` | ✅ |
| 02.8 Consentimento antes do aceite | aviso e registro antes do aceite | `plataforma/e2e/convite-conta.spec.ts:60` e `:81-87`; `plataforma/tests/sql-convites.test.ts:728` | ✅ |
| 02.9 Outro e-mail | mensagem exata; convite segue válido | `plataforma/tests/sql-convites.test.ts:744-749`; `plataforma/e2e/convite-aceite.spec.ts:67-72` | ✅ |
| 02.10 Token inexistente | mensagem única, sem revelar | `plataforma/tests/sql-convites.test.ts:582-583`; `plataforma/e2e/convite-aceite.spec.ts:97-100` | ✅ |
| 02.11 Vencido, cancelado ou usado | mesma mensagem | `plataforma/tests/sql-convites.test.ts:582-583`, `:594`, `:804`; `plataforma/e2e/convite-aceite.spec.ts:108` | ✅ |
| 02.12 Dois aceites simultâneos | exatamente um conclui | `plataforma/tests/sql-convites.test.ts:767` (sequencial); `:775-778` regex `for update` no `prosrc` | ⚠️ simultaneidade real não reproduzível no PGlite |
| 02.13 Já é membro | mantém o papel, "Você já está neste mandato", não consome | `plataforma/tests/sql-convites.test.ts:785-791`; `plataforma/e2e/convite-aceite.spec.ts:57` | ✅ |
| 02.14 Mais de 10 inválidos em 10 min | bloqueio de 15 min com a mensagem | `plataforma/tests/sql-convites.test.ts:611-613`, `:628-632`, `:641-642`; `plataforma/e2e/convite-aceite.spec.ts:117` e `:126` | ✅ com ⚠️ "mesma origem" = 1º IP de `x-forwarded-for`, forjável |
| 02.15 Falha ao criar conta | mostra o motivo; convite não consumido | `plataforma/e2e/convite-conta.spec.ts:114-118` e `:130-133` | ✅ |

### ACE-03: Papéis do mandato aplicados no banco

| Critério | Resultado definido pela spec | Evidência | Resultado |
| -------- | ---------------------------- | --------- | --------- |
| 03.1 Só três papéis | check em `membros.papel` | `plataforma/tests/sql-papeis.test.ts:54-65` | ✅ |
| 03.2 `leitura` não escreve | recusar qualquer escrita nos dados e nos membros do mandato | `plataforma/tests/sql-papeis.test.ts:76-78` e `:83`; `plataforma/tests/sql-membros.test.ts:455` e `:460` `assert.rejects(excluirMandato(), SO_COORDENACAO_EXCLUI)` com `:456`/`:461` `existe === true`; `:468` `leitura` e `assessoria` recusadas. Sondas S-2 e V-7 recusadas | ✅ (⚠️ S-4 telemetria, inalterado) |
| 03.3 Guia oculta ou desabilita | controles de gravação travados | `plataforma/tests/legado-acesso.test.ts:204-205`; `:228` `document.salvo.textContent === ''`; `plataforma/e2e/guia-acesso.spec.ts:169-170`, `:176-180`, `:194-199`, `:218` | ✅ |
| 03.4 Troca vale na chamada seguinte | papel lido da tabela a cada chamada | `plataforma/tests/sql-membros.test.ts:73-82`; `plataforma/tests/sql-papeis.test.ts:135-137` | ✅ |
| 03.5 Remover tira do mandato e mantém a conta | sai de `membros`; a conta fica | `plataforma/tests/sql-membros.test.ts:177-183`; `:413` e `:417` (S-3 fechada). **Sonda V-1b**: a pessoa removida volta como `coordenacao` aceitando um convite que ela mesma criou antes (`20261106120000_convites_equipe.sql:475-494`) | ❌ a remoção é reversível pela removida |
| 03.6 Só a coordenação troca papel ou remove | erro de permissão e nada muda | `plataforma/tests/sql-membros.test.ts:88-92`, `:98-102`, `:188-193`; `:380`, `:384`, `:392` (S-1 fechada). **Sondas V-1 e V-1c**: rebaixada a `leitura`, a pessoa sai, aceita o próprio convite, volta ao papel antigo e, como `coordenacao`, remove quem a rebaixou | ❌ contornável pela API |
| 03.7 Última coordenação | mensagem exata e nada muda | `plataforma/tests/sql-membros.test.ts:108-111`, `:208-210`, `:271-273` | ✅ com ⚠️ `excluir_meus_dados()` ainda deixa o mandato sem coordenação (e abre V-5) |
| 03.8 Rebaixamentos simultâneos | uma conclui, a outra é recusada | `plataforma/tests/sql-membros.test.ts:119-130` (sequencial); `:136-139` regex `for update` | ⚠️ simultaneidade não reproduzível |
| 03.9 Sair por conta própria | sai, respeitando a coordenação | `plataforma/tests/sql-membros.test.ts:258-266` | ✅ |
| 03.10 Equipe Legisla intacta | `equipe_legisla` e o `/admin` não mudam | `plataforma/tests/sql-membros.test.ts:102` e `:203` `{ eventos: 0, legisla: 2 }`; `:468` a equipe Legisla não exclui | ✅ |
| 03.11 `leitura` convida só `leitura` e cancela só os próprios | — | `plataforma/tests/sql-convites.test.ts:269` e `:283-286`; `:466`; `:491` | ✅ |

### ACE-04: Tela Equipe e convites

| Critério | Evidência | Resultado |
| -------- | --------- | --------- |
| 04.1 Ordem da tela | `plataforma/e2e/mandato-equipe.spec.ts:529-532` | ✅ |
| 04.2 Só pendentes válidos, com nome, papel, quem convidou e dias | `plataforma/tests/sql-convites.test.ts:398-401`; `plataforma/e2e/mandato-equipe.spec.ts:303-306` | ✅ |
| 04.3 Cancelar remove da lista | `plataforma/e2e/mandato-equipe.spec.ts:328-333`; `plataforma/tests/sql-convites.test.ts:466` | ✅ |
| 04.4 Criador ou coordenação cancela | `plataforma/tests/sql-convites.test.ts:466-469`, `:478-479` | ✅ |
| 04.5 Outros recebem erro de permissão | `plataforma/tests/sql-convites.test.ts:488-492`; `plataforma/e2e/mandato-equipe.spec.ts:349-350` | ✅ |
| 04.6 Nome, e-mail, papel e "você" | `plataforma/e2e/mandato-equipe.spec.ts:423-429`; `plataforma/tests/sql-membros.test.ts:332-336` | ✅ |
| 04.7 Coordenação vê seletor e Remover | `plataforma/e2e/mandato-equipe.spec.ts:437-442` | ✅ |
| 04.8 Assessoria e leitura veem texto | `plataforma/e2e/mandato-equipe.spec.ts:449-453` | ✅ |
| 04.9 Papéis oferecidos por papel | `plataforma/e2e/mandato-equipe.spec.ts:93`; `plataforma/tests/convites-papeis.test.ts` | ✅ |
| 04.10 Atualiza sem recarregar | `plataforma/e2e/mandato-equipe.spec.ts:463-466` e `:502-506` | ✅ |
| 04.11 Lista vazia | `plataforma/e2e/mandato-equipe.spec.ts:364` | ✅ |
| 04.12 Linha da Legisla | `plataforma/e2e/mandato-equipe.spec.ts:523` | ✅ |
| 04.13 400 px sem rolagem | `plataforma/e2e/mandato-equipe.spec.ts:270-271` e `:551-552` | ✅ |

### ACE-05: Área do mandato

| Critério | Evidência | Resultado |
| -------- | --------- | --------- |
| 05.1 Cartão | `plataforma/e2e/mandato-area.spec.ts:30-31` e `:39-42` | ✅ |
| 05.2 Dia X de 100 | `plataforma/e2e/mandato-area.spec.ts:63`, `:69`, `:74-77`, `:82`, `:88`; `plataforma/tests/convites-dias.test.ts` | ✅ |
| 05.3 Status das 5 missões | `plataforma/e2e/mandato-area.spec.ts:97-107`; `plataforma/tests/convites-missoes.test.ts` | ✅ (T12 aceito como equivalente) |
| 05.4 Resumo da equipe | `plataforma/e2e/mandato-area.spec.ts:182`, `:196`, `:201` | ✅ |
| 05.5 10 eventos mais recentes | `plataforma/e2e/mandato-area.spec.ts:258-260`; `plataforma/tests/convites-api.test.ts:204` | ✅ |
| 05.6 Editar dados | `plataforma/e2e/mandato-area.spec.ts:136-138`; regressão do gatilho em `plataforma/tests/sql-membros.test.ts:397-398` (`affectedRows === 1` sem mexer em `criado_por`) | ✅ |
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
| 07.1 `entrar_com_codigo` sem execução | `plataforma/tests/sql-convites.test.ts:858` e `:862-865` | ✅ |
| 07.2 Guia sem campo, botão nem mensagem | `plataforma/e2e/guia-acesso.spec.ts:118`, `:123-126`, `:134-137`; `plataforma/tests/legado-acesso.test.ts:125` e `:161` | ✅ |
| 07.3 Cadastro novo cria `coordenacao` | `plataforma/tests/legado-acesso.test.ts:176` (`papel: 'coordenacao'` no corpo do `POST membros`); `plataforma/tests/sql-membros.test.ts:437` (`assessoria` e `leitura` recusadas na primeira linha), `:432-434` (o `INSERT ... RETURNING` de quem criou devolve o id), `:444` (o mandato segue visível depois da inclusão), `:446` `[{ user_id: IDS.fora, papel: 'coordenacao' }]`; `plataforma/e2e/guia-acesso.spec.ts:159` | ✅ |
| 07.4 "link de convite" no aviso, resto igual | `plataforma/tests/legado-acesso.test.ts:264`, `:268`, `:272`, `:276` (hash do corpo original) | ✅ |
| 07.5 `mandatos.codigo` interno, fora das telas | `plataforma/tests/sql-convites.test.ts:882-888`; `plataforma/e2e/guia-acesso.spec.ts:135` | ✅ |

**Status**: ❌ lacunas presentes (ACE-03.5, ACE-03.6 por V-1) · ⚠️ lacunas de precisão: 02.12, 02.14, 03.7 (agora com V-5), 03.8, a borda "orientar a promover" e S-4.

---

## Sensor de discriminação

**Profundidade**: P0 (auth e permissões): 16 mutações novas na área mudada e reamostra de 10 mutações da iteração 1.
**Isolamento**: worktree temporário de `HEAD` com `node_modules` por junção, um arquivo mutado por vez e restaurado após cada teste (o harness confere o conteúdo). O worktree foi descartado no fim (junção desfeita antes da remoção). O porcelain da árvore real ficou idêntico ao de antes (114 linhas).

### Migration da correção (`plataforma/supabase/migrations/20261106130000_papeis_blindagem.sql`) e Guia, testes `tests/sql-membros.test.ts`, `tests/sql-convites.test.ts`, `tests/sql-papeis.test.ts` e `tests/legado-acesso.test.ts`

| # | Mutação | Morto? |
| - | ------- | ------ |
| B01 | Gatilho: guarda de `criado_por` vira `if false` (`:19`) | ✅ (2 falhas) |
| B02 | Gatilho: `is distinct from` vira `<>` (nulo escapa) | ✅ |
| B03 | Gatilho: sem a exceção para sessão sem uid | ✅ |
| B04 | Gatilho não é criado (`:27-28`) | ✅ |
| B05 | `membros_criar`: entrada direta com qualquer papel (`:50`) | ✅ |
| B06 | `membros_criar`: sem exigir mandato vazio (`:53`) | ❌ **sobreviveu**. A guarda de `mandatos_ler` a mascara: o `exists` em `mandatos` dentro da política roda sob RLS, e quem foi removido deixa de ver o mandato. Não é equivalente. Sonda: com B06 aplicado, quem criou o mandato **e está na equipe Legisla** (que vê todo mandato por `eh_legisla`) volta como `coordenacao` depois de removido; sem B06, RLS recusa. Hoje todos os cadastros são de pessoas da Legisla (`spec.md:46`) |
| B07 | `membros_criar`: sem exigir ser quem criou | ✅ |
| B08 | `membros_criar`: sem `user_id = auth.uid()` (`:49`) | ❌ **sobreviveu**. Nenhum teste tenta incluir outra conta na primeira linha. Efeito: quem cria um mandato põe outra conta como `coordenacao` sem que ela aceite nada |
| B09 | `mandatos_ler`: quem criou lê mesmo com membros (`:62`) | ✅ |
| B10 | `mandatos_ler`: sem o ramo de quem criou (quebra o `RETURNING` do cadastro) | ✅ |
| B11 | `mandato_sem_membros` invertida (`:37`) | ✅ (4 falhas) |
| B12 | `excluir_mandato`: qualquer membro exclui (`:71`) | ✅ |
| B13 | `excluir_mandato`: volta o ramo de quem criou (S-2) | ✅ |
| B14 | `excluir_mandato`: guarda removida | ✅ |
| B15 | `excluir_mandato`: erro sem o código `42501` | ✅ |
| G01 | Guia: cadastro novo sem `papel:'coordenacao'` (cai no padrão `assessoria`, que a nova `membros_criar` recusa) (`plataforma/public/legacy/nucleo.js:157`) | ✅ |

### Reamostra da iteração 1

| # | Mutação | Morto? |
| - | ------- | ------ |
| S02 | Convite reutilizável | ✅ |
| S08 | `leitura` passa a editar | ✅ |
| S09 | Última coordenação removível | ✅ |
| S11 | Última coordenação rebaixável | ✅ |
| S12 | E-mail vinculado ignorado no aceite | ✅ |
| S13 | Hierarquia de papel removida em `convite_criar` | ✅ |
| S19 | `assessoria` troca papel | ✅ |
| T05 | `podeGerirEquipe` vale para `assessoria` | ✅ |
| T15 | Guia: guarda de `leitura` tirada de `Store.salvar` | ✅ (era sobrevivente; morto por `plataforma/tests/legado-acesso.test.ts:228`) |
| T12 | `=== true` vira `!!` em `missoes.ts` | ❌ sobrevive (aceito como equivalente; o Guia só grava `true`/`false`) |

E08 (a mesma falha do T15 contra o e2e) não foi rodado de novo: o e2e não mudou e a falha agora morre no teste de unidade.

**Resultado do sensor**: 26 execuções. 23 mortas, 3 sobreviventes: B06 e B08 (novas, testes que não isolam a guarda; o código está certo) e T12 (aceito). Os mutantes não pegam V-1 porque o caminho existe no código atual: é lacuna de comportamento, não de teste.

---

## Qualidade do código (correções)

| Princípio | Status |
| --------- | ------ |
| Código mínimo, sem escopo extra: uma migration de 79 linhas, testes no arquivo já existente | ✅ |
| Mudanças cirúrgicas: nenhuma tela nem lib alterada; `nucleo.js` intocado (já mandava `papel:'coordenacao'`) | ✅ |
| Segue os padrões: gatilho no molde de `mandatos_trava_arquivo`, `security definer` com `search_path` vazio, `revoke`/`grant` explícitos, idempotente (reaplicada sem erro na sonda) | ✅ |
| Asserções no resultado da spec: mensagens com regex ancorada e `code: '42501'`, `deepEqual` do estado final de `membros` | ✅ |
| Integridade dos testes: 949 → 957 (+8, todos em `sql-membros.test.ts`); nenhuma asserção removida (`legado-acesso.test.ts` só ganhou o indicador `[data-salvo]` no documento falso e uma asserção) | ✅ |
| Decisão registrada: AD-010 em `.specs/STATE.md` | ✅ |
| Guardas redundantes isoladas por teste (lição L-019) | ❌ B06 e B08 |

---

## Bordas da spec

- [x] Mesmo e-mail convidado duas vezes; convite aberto em outro aparelho; página fechada no meio do Google; sessão vencida durante o aceite; conta com outro e-mail (sem mudança desde a iteração 1).
- [ ] Última coordenação tenta sair: o banco recusa, mas nada "orienta a promover outra pessoa antes". ⚠️ menor (inalterado).

---

## Gate

- **Comandos**: `npx tsc --noEmit`, `npm test` e `npx playwright test e2e/convite-*.spec.ts e2e/mandato-*.spec.ts e2e/guia-acesso.spec.ts` (em `plataforma/`), todos no worktree limpo de `HEAD`.
- **`npx tsc --noEmit`**: 0 erros (exit 0).
- **`npm test`**: 957 passaram, 0 falharam, 0 pulados.
- **e2e**: 137 de 137, em servidor próprio na porta 3300 (`next dev --webpack -p 3300`, `reuseExistingServer: false`; a 3000 é do usuário). Na primeira rodada o `next dev` parou para mostrar um aviso de vulnerabilidade conhecida do Next 16.4 e todos falharam por conexão recusada. Na segunda, 133 passaram e os 4 primeiros (um por worker) estouraram os 30 s na compilação a frio. Rodados de novo com `--timeout=120000`, os 4 passaram. Nenhum upgrade foi feito.
- **Antes e depois**: 725 testes de unidade e SQL na base da feature (`ac19a35`), 949 na iteração 1, 957 agora.

---

## Planos de correção

### Correção 6 (Alta): convite pendente sobrevive ao rebaixamento ou à remoção de quem o criou (V-1; ACE-03.5, ACE-03.6, objetivo 3)

- **Causa**: o limite de papel é conferido só em `convite_criar` (`20261106120000_convites_equipe.sql:315`); `convite_aceitar` (`:475-494`) não olha quem criou o convite, e trocar papel, remover e sair não cancelam os convites pendentes da pessoa.
- **Tarefa (recomendada)**: em migration nova, `convite_aceitar` exige que quem criou o convite ainda seja membro do mandato com `private.nivel_papel(papel atual) >= private.nivel_papel(convite.papel)`. Senão, devolve a mesma resposta de convite inválido. `convite_previa` aplica a mesma regra, para não mostrar convite morto. Uma regra só cobre remoção, rebaixamento, saída, `excluir_meus_dados` e o `/admin`.
- **Decisão de produto**: com essa regra, o convite de quem saiu deixa de valer (hoje `spec.md:63` só diz quem pode cancelá-lo). Alternativa mínima, se o dono do produto quiser manter esses convites: recusar o aceite quando `auth.uid() = convites.criado_por`. Isso fecha V-1, V-1b e V-1c, mas não uma segunda conta da mesma pessoa.
- **Verificar**: testes de SQL que repetem V-1 (rebaixada, sai, aceita: recusado e papéis inalterados), V-1b (removida, aceita: recusado) e V-1c; regressão: o convite de uma coordenação ativa segue aceitável, e o de uma `assessoria` rebaixada a `leitura` com papel `leitura` segue aceitável.

### Correção 7 (Média): B06, guarda de mandato vazio em `membros_criar` sem teste próprio

- **Tarefa**: em `plataforma/tests/sql-membros.test.ts`, repetir S-3 com quem criou o mandato também em `equipe_legisla` (vê o mandato por `eh_legisla`), removido pela coordenação, e esperar RLS na reinserção.
- **Verificar**: B06 morre.

### Correção 8 (Menor): B08, `user_id = auth.uid()` em `membros_criar` sem teste próprio

- **Tarefa**: no teste "cadastro novo" (`plataforma/tests/sql-membros.test.ts:430`), quem criou o mandato tenta incluir outra conta como `coordenacao` na primeira linha; esperar RLS.
- **Verificar**: B08 morre.

### Decisões que pedem o dono do produto (lacunas de precisão, inalteradas)

1. Definir "mesma origem" (ACE-02.14).
2. Dizer se `excluir_meus_dados()` conta como "a própria saída" (ACE-03.7). Se a resposta for recusar a última coordenação, V-5 também fecha.
3. Dizer se a telemetria `uso_funcionalidades` entra em "dados do mandato" (S-4).
4. Aceitar que ACE-02.12 e ACE-03.8 só têm prova estrutural e sequencial.
5. Borda "orientar a promover outra pessoa antes".

### Observação (sem ação agora)

O gatilho `mandatos_trava_criador` também recusa a cascata `on delete set null` de `criado_por` se uma conta for apagada dentro de uma sessão com uid. GoTrue e o painel do Supabase não têm uid na sessão e passam (sonda). Se um dia existir "apagar minha conta" por função do banco chamada pelo usuário, essa função precisa tratar isso.

---

## Rastreabilidade (sugestão para `spec.md`, não aplicada pelo Verifier)

| Requisito | Antes | Novo status |
| --------- | ----- | ----------- |
| ACE-01 | Pending | ✅ Verified |
| ACE-02 | Pending | ✅ Verified (com ⚠️ em 02.12 e 02.14) |
| ACE-03 | Pending | ❌ Needs Fix (03.5, 03.6 por V-1; 03.2 fechado) |
| ACE-04 | Pending | ✅ Verified |
| ACE-05 | Pending | ✅ Verified |
| ACE-06 | Pending | ✅ Verified |
| ACE-07 | Pending | ✅ Verified |

---

## Resumo

**Geral**: ❌ Não pronto.

**Verificação ancorada na spec**: 71 critérios. 67 têm evidência no resultado da spec; 2 seguem violados por outro caminho (ACE-03.5 e 03.6, sonda V-1); 2 só têm prova estrutural e sequencial (02.12, 03.8). ACE-03.2 passou a ✅.
**Sensor**: 23 de 26 mortos. Sobreviveram B06 e B08 (novos) e T12 (aceito). T15 agora morre.
**Gate**: tsc 0 erros; 957/957 unidade e SQL; 137/137 e2e.
**Porcelain**: a árvore real terminou idêntica à linha de base (114 linhas).

**O que funciona**: as correções da iteração 1. `criado_por` não muda pela API, nem por `upsert` nem de ou para nulo. Quem criou o mandato só entra direto na primeira linha, como `coordenacao`. Quem foi removido não lê nada do mandato. `excluir_mandato` exige a coordenação atual. O fluxo legítimo segue de pé: cadastro do Guia, convite, troca, remoção, edição como `assessoria`, `/admin` e dados antigos.

**Próximo passo**: correção 6 (decidir entre a regra recomendada e a mínima), depois 7 e 8. Então o último Verifier (iteração 3 de 3); se a falha persistir, levar ao usuário.
