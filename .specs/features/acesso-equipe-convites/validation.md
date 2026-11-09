# Acesso, Equipe e Convites: relatório do Verifier

## Validation: acesso-equipe-convites — PASS ✅ (Verifier final, HEAD f4a54cc)

**Data**: 2026-11-09
**Spec**: `.specs/features/acesso-equipe-convites/spec.md`
**Diff range**: `ac19a35..f4a54cc` (branch `feat/acesso-convites`). Foco desta rodada: `ab6d5b3..f4a54cc` (AD-012 em `a594caf`, botão "Sair do mandato" em `1ed70ab`, docs em `f4a54cc`), sem deixar de repetir as sondas e os mutantes das iterações 1 a 3.
**Verifier**: sub-agente independente, final (autor ≠ verificador). Nenhum código ou teste do repositório foi alterado. Sondas, sensor e gate rodaram num worktree temporário de `HEAD` (`git worktree add --detach`, `node_modules` por junção), descartado no fim, sem `git stash`.

**Veredito**: aprovado. Nenhuma sonda achou violação de critério da spec: S-1 a S-3, V-1, V-1b e V-1c seguem recusadas, e as 21 sondas novas sobre as regras do AD-012 e o botão sair se comportam como a spec pede. A migration nova aplica e reaplica sobre dados antigos. O gate passou inteiro: `npx tsc --noEmit` limpo, `npm test` 981/981, e2e 147/147. No sensor, A01, R-X01 (duas formas) e A07 morrem, 13 dos G01 a G20 do worker e 10 mutantes novos também; na tela, 12 de 14. Sobram U11, equivalente, e U12, sobrevivente na pré-checagem da tela quando a lista de pessoas não carrega. U12 não é guarda de segurança (a regra está no banco, mutante V06 morto), então fica como gap menor. As ⚠️ restantes são as pendências já classificadas do dono do produto, listadas no fim.

**Spec-anchored check**: 7 de 7 requisitos (ACE-01 a ACE-07, com os critérios novos 02.16 a 02.18, 03.12 e 04.14 a 04.18) com evidência `arquivo:linha` cuja asserção bate com o resultado da spec; lacunas de precisão só nas pendências já registradas e em 04.17 sem lista (U12).
**Gate**: `npm test` 981 passaram, 0 falharam; `tsc` 0 erros; e2e 147 passaram, 0 falharam.
**Sensor**: 43 mutações, 41 mortas, 1 equivalente (U11), 1 sobrevivente fora de guarda de segurança (U12).

---

## Tarefas

T1 a T37 com todos os "Done when" marcados em `tasks.md` (nenhum `- [ ]`). As correções 1 a 11 das iterações 1 a 4 e as decisões A (botão sair), B (AD-012) e C (telemetria aceita) de 2026-11-09 estão em `HEAD` e registradas em `.specs/STATE.md` (handoff). O AD-012 e o botão não viraram tasks numeradas em `tasks.md`: entraram como critérios novos da spec (ACE-02.16 reescrito, 02.17, 02.18, 03.12 reescrito, 04.14 a 04.18) com a traceability em `spec.md:290-294`. Não reprova: os critérios e os testes estão lá.

| Commit | O que muda | Conferido |
| ------ | ---------- | --------- |
| `a594caf` | migration `20261106150000_convites_de_quem_sai.sql`, 13 testes SQL, spec | as quatro funções de convite diferem das de `20261106140000` só na chamada `private.convite_autorizado(..., papel_ao_sair)`; `membro_sair` difere da de `20261106120000` só pelo `update ... set papel_ao_sair = v_papel`; `excluir_meus_dados` difere da de `20261016120000` só pelo `update ... set papel_ao_sair = null` (diff dos corpos, cópia de `HEAD`). Grants e revokes iguais |
| `1ed70ab` | `app/mandato/equipe/SairDoMandato.tsx` (novo), `Equipe.tsx` (+1 linha), 10 e2e, spec | o botão chama só `saiDoMandato` → `api.rpc('membro_sair', { p_mandato })` (`plataforma/lib/convites/api.ts:63-65`); nenhuma escrita direta em `membros` |
| `f4a54cc` | STATE.md | só documentação |

---

## Sondas desta rodada

Arquivo de sonda só no worktree temporário, sobre as migrations reais no PGlite (`tests/sql-ambiente.ts`, que reproduz os privilégios padrão do Supabase), chamando só o que o PostgREST expõe a `authenticated` e `anon`. 27 sondas, 0 violações de critério da spec.

| Sonda | Passos (como a pessoa, pela API) | Resultado observado | Critério |
| ----- | -------------------------------- | ------------------- | -------- |
| S-1 | `assessoria` reescreve `mandatos.criado_por`, sai e se reinsere como `coordenacao` | update → `42501 Você não tem permissão para esta ação.`; reinserção → RLS de `membros`; ela fica fora | ✅ ACE-03.6, 03.12 |
| S-2 | criador rebaixado a `leitura` chama `excluir_mandato` | `42501 Só a coordenação do mandato pode excluir o cadastro.`; o mandato existe | ✅ ACE-03.2 |
| S-3 | criador removido se reinsere como `coordenacao`, `assessoria` e `leitura` | as três recusadas por RLS | ✅ ACE-03.5 |
| V-1 | coordenação rebaixada a `leitura` aceita o próprio convite de `coordenacao`; sai; aceita de novo; segunda conta aceita; tenta remover quem a rebaixou | `invalido` nas três tentativas; remoção `42501`; equipe inalterada; `papel_ao_sair = leitura` | ✅ ACE-02.16, 03.6, 03.12 |
| V-1b | removida: prévia, aceite com a própria conta e com outra | `invalido` nas três; pendentes `[]` | ✅ ACE-02.16, 03.12 |
| V-1c | `assessoria` rebaixada a `leitura`: segunda conta aceita o convite de `assessoria`; sai e aceita; `update mandatos` | `invalido`, `invalido`; 0 linhas | ✅ ACE-02.16, 03.2 |
| N-12a | sai como `coordenacao`; volta pelo `/admin` como `assessoria`; sai de novo | convites `coordenacao`/`assessoria`: `vale/vale` → `invalido/vale` → `invalido/vale` | ✅ ACE-02.18 |
| N-12b | sai como `coordenacao` e volta pelo **próprio** convite de `coordenacao`, com a própria conta | `{ok:true, ja_membro:false}`, volta como `coordenacao` | ⚠️ pendência 7(a) do STATE (aceita pelo pedido: até o papel que tinha ao sair) |
| N-12c | sai como `coordenacao`, volta por convite de `leitura`, é removida; segunda conta tenta o convite antigo | dentro: `invalido`; removida: `invalido`; aceite `invalido` | ✅ ACE-02.18, 03.12 |
| N-13 | duas pessoas saem com convites válidos; a conta de uma é apagada e a outra chama `excluir_meus_dados` | `vale/vale` → `invalido/invalido`; pendentes `[]` | ✅ ACE-02.16 |
| N-14 | V-1 com saída: rebaixada a `leitura`, sai; convites `coordenacao`, `assessoria`, `leitura`; aceite com a própria conta e com outra | `invalido`, `invalido`, `vale`; aceites `invalido` | ✅ ACE-02.16, 03.12 |
| N-15 | rebaixada a `assessoria`; segunda conta aceita o convite de `coordenacao`; sai e tenta de novo | `invalido` nas duas | ✅ ACE-03.12 |
| N-16 | coordenação no A e no B: sai do A; é rebaixada no B a `leitura`; sai do B | a saída do A não grava nada no B; convite de `coordenacao` do B `invalido` depois do rebaixamento e da saída; o do A segue `vale` | ✅ ACE-02.16, 02.17 (filtro de mandato) |
| N-17 | sair depois de removida; remover depois de sair (sequencial) | `42501` e o convite `invalido`; `Pessoa não encontrada.` e o convite segue `vale` | ✅; ⚠️ pendência 7(c) |
| N-18 | reentrada desfeita: o aceite falha no histórico (gatilho que lança) | aceite desfeito, `papel_ao_sair` continua `coordenacao`, o convite segue `vale` | ✅ ACE-06.3, 02.17 |
| N-18b | quem saiu cria outro mandato pelo cadastro do Guia e entra nele | os convites do A não mudam (`vale`) | ✅ ACE-02.17 |
| N-19 | `private.convite_autorizado` chamado direto; `update convites set papel_ao_sair` e `select papel_ao_sair` pela API; convite com `criado_por` nulo e `papel_ao_sair = coordenacao` | `permission denied for function`; `permission denied for table convites` (2×); `invalido` | ✅ ACE-02.16 |
| N-20 | `excluir_meus_dados` ainda no mandato; volta como `leitura` e sai | convite de `assessoria` `invalido` e segue `invalido` (vale o papel da última saída) | ✅ ACE-02.16, 02.18 |
| N-21 | `/admin`: `admin_membro_remover` e `admin_membro_papel` em quem já saiu; a equipe Legisla chama `membro_sair` | `Pessoa não encontrada.` (2×), o convite segue `vale`; `42501` | ✅ ACE-03.10 |
| N-22 | `convites_pendentes`: colunas (com e-mail gravado); chamada por quem saiu, admin Legisla, coordenação do B e `anon` | `convidado_por_nome, expira_em, id, nome, papel`; `42501` (3×) e `permission denied` | ✅ ACE-01.3, 04.2 |
| N-23 | saída direta: `delete from membros` (própria linha) e `update membros set papel` | `permission denied for table membros` (2×); o update afeta 0 linhas | ✅ ACE-03.7, 03.9 |
| N-24 | última coordenação chama `membro_sair`; com duas, a segunda a sair | `O mandato precisa ter ao menos uma pessoa na coordenação.` nas duas | ✅ ACE-03.7 |
| N-25 | 20 convites de quem saiu como `coordenacao`; depois volta pelo `/admin` e é removida | o 21º é recusado com a mensagem da spec; depois da remoção, a coordenação cria | ✅ ACE-01.9, 02.17, 02.18 |
| N-26 | a coordenação vê e cancela o convite de quem saiu; quem saiu tenta cancelar | `['C']`; quem saiu: `42501`; coordenação: aceito; depois `invalido` | ✅ ACE-04.4; ⚠️ pendência 7(b) |
| N-27 | criador rebaixado a `leitura` sai; as outras duas pessoas chamam `excluir_meus_dados` e o mandato fica vazio; o criador se reinsere | reinserção aceita como `coordenacao` pela política `membros_criar` | ⚠️ pendência ACE-03.7 (`excluir_meus_dados` pode deixar o mandato sem coordenação); não é efeito do AD-012 |
| M-1 | a migration nova reaplicada duas vezes sobre dados com saída gravada | sem erro; o convite segue `vale` | ✅ |
| M-2 | migrations até `20261106140000` com dados semeados (coordenação ativa, assessoria, leitura que já foi coordenação, pessoa que saiu antes, `criado_por` nulo), depois `20261106150000` duas vezes | sem erro; `vale, vale, invalido, invalido, invalido`; a assessoria sai depois e o convite dela `vale`; coluna, gatilho e `convite_autorizado(uuid,uuid,text,text)` presentes, versão de 3 argumentos removida | ✅ (observação: quem saiu antes da migration fica com `papel_ao_sair` nulo; sem efeito real, porque `20261106120000` a `20261106150000` sobem juntas e não há convites em produção) |
| Corrida | saída simultânea a uma remoção | não reproduzível no PGlite (uma conexão). Análise: `membro_sair` e `membro_remover` travam todas as linhas de `membros` do mandato antes de ler o papel; `admin_membro_remover` trava as linhas de coordenação, que `membro_sair` também trava. Em `READ COMMITTED` a segunda chamada relê depois do `commit` da primeira: ou a saída vence (remoção `Pessoa não encontrada.`, convites seguem valendo) ou a remoção vence (saída `42501`, convites deixam de valer) | ⚠️ pendência 7(c), mesma classe de 02.12 e 03.8 |

**Fluxo legítimo** (mesmo arquivo e testes da suíte): saída comum de `assessoria` e `leitura`, saída da coordenação com outra coordenação, aceite por outra pessoa do convite de quem saiu, volta pelo `/admin` e por convite, cadastro de mandato novo. Todos aceitos.

---

## Critérios de aceite ancorados na spec

Legenda: ✅ o teste afirma o resultado definido pela spec · ❌ lacuna (sem evidência ou comportamento violado) · ⚠️ lacuna de precisão da spec ou pendência do dono do produto (não reprova).

Os números de linha antes de `plataforma/tests/sql-convites.test.ts:996` e de `plataforma/e2e/mandato-equipe.spec.ts:555` não mudaram desde a iteração 3 (`git diff eb1cc0d HEAD` só acrescenta trechos depois dessas linhas); foram reconferidos pelo nome dos testes.

### ACE-01: Criar um convite por link pessoal

| Critério | Resultado definido pela spec | Evidência (`arquivo:linha`, asserção) | Resultado |
| -------- | ---------------------------- | ------------------------------------- | --------- |
| 01.1 Gerar mostra link, validade e 3 botões | link completo, validade e os três botões | `plataforma/e2e/mandato-equipe.spec.ts:51-55`; `plataforma/tests/sql-convites.test.ts:225` chaves `['expira_em','id','token']` | ✅ |
| 01.2 Token no servidor, 128 bits, só o hash | só `sha256` gravado | `plataforma/tests/sql-convites.test.ts:243`, `:253`, `:126-127`, `:133`, `:143` | ✅ |
| 01.3 Link uma vez, nunca em listagens | listagem sem token, hash nem e-mail | `plataforma/tests/sql-convites.test.ts:429-433`; `plataforma/e2e/mandato-equipe.spec.ts:242-244`; sonda N-22 | ✅ |
| 01.4 Validade de 7 dias | `expira_em - criado_em = 7 dias` | `plataforma/tests/sql-convites.test.ts:231-236` | ✅ |
| 01.5 E-mail normalizado | minúsculas, sem espaços | `plataforma/tests/sql-convites.test.ts:261-262` | ✅ |
| 01.6 Papel maior recusado | mensagem exata, nenhum convite | `plataforma/tests/sql-convites.test.ts:267-271`; `plataforma/e2e/mandato-equipe.spec.ts:150-151` | ✅ |
| 01.7 Nome vazio ou >80 | "Informe um nome de até 80 caracteres." | `plataforma/tests/sql-convites.test.ts:291-295`; `plataforma/e2e/mandato-equipe.spec.ts:113-128` | ✅ |
| 01.8 E-mail inválido ou >254 | "E-mail inválido." | `plataforma/tests/sql-convites.test.ts:302-307`; `plataforma/e2e/mandato-equipe.spec.ts:137-140` | ✅ |
| 01.9 21º pendente | mensagem exata; contam só os que valem (02.16 a 02.18) | `plataforma/tests/sql-convites.test.ts:317-325`; `:1069` `rejects(criar('Novo 21'), VINTE_PENDENTES)` com 20 sem autoridade fora da conta (`:1063`, `:1072-1074` 40 no banco); `:1319` (20 de quem saiu como coordenação contam); `:1335-1338` (20 de quem foi rebaixada e saiu não contam); sonda N-25 | ✅ (A07 morto) |
| 01.10 Não membro | erro de permissão | `plataforma/tests/sql-convites.test.ts:331`, `:334` | ✅ |
| 01.11 Limpeza de mais de 30 dias | apaga vencidos ou cancelados há mais de 30 dias | `plataforma/tests/sql-convites.test.ts:351-353` | ✅ |

### ACE-02: Aceitar o convite e entrar no mandato

| Critério | Resultado definido pela spec | Evidência | Resultado |
| -------- | ---------------------------- | --------- | --------- |
| 02.1 Prévia sem consumir | quem convidou, nome parlamentar, cargo, UF e papel; não consome | `plataforma/tests/sql-convites.test.ts:567-573`; `plataforma/e2e/convite-aceite.spec.ts:26-34` | ✅ |
| 02.2 Sem sessão: criar conta, entrar, Google | os três caminhos | `plataforma/e2e/convite-conta.spec.ts:54-59` | ✅ |
| 02.3 Criar conta e entrar | conta, convite consumido, membro com o papel | `plataforma/e2e/convite-conta.spec.ts:79-92`; `plataforma/tests/sql-convites.test.ts:712-718` | ✅ |
| 02.4 Aceitar com sessão | consome e inclui com o papel | `plataforma/e2e/convite-aceite.spec.ts:46-49`; `plataforma/tests/sql-convites.test.ts:716-718`, `:944` | ✅ |
| 02.5 Google conclui o mesmo convite | aceite na volta | `plataforma/e2e/convite-conta.spec.ts:210-220`; `plataforma/tests/landing.test.ts:22`, `:30` | ✅ |
| 02.6 Abre o Guia no mandato aceito | `/guia` com o mandato | `plataforma/e2e/convite-aceite.spec.ts:44-46` | ✅ |
| 02.7 Sessão em `legisla.tok` | mesmo formato do Guia | `plataforma/e2e/convite-conta.spec.ts:91` | ✅ |
| 02.8 Consentimento antes do aceite | aviso e registro antes | `plataforma/e2e/convite-conta.spec.ts:60`, `:81-87`; `plataforma/tests/sql-convites.test.ts:728` | ✅ |
| 02.9 Outro e-mail | mensagem exata; convite segue válido | `plataforma/tests/sql-convites.test.ts:744-749`; `plataforma/e2e/convite-aceite.spec.ts:67-72` | ✅ |
| 02.10 Token inexistente | mensagem única | `plataforma/tests/sql-convites.test.ts:582-583`; `plataforma/e2e/convite-aceite.spec.ts:97-100` | ✅ |
| 02.11 Vencido, cancelado ou usado | mesma mensagem | `plataforma/tests/sql-convites.test.ts:582-583`, `:594`, `:804`; `plataforma/e2e/convite-aceite.spec.ts:108` | ✅ |
| 02.12 Dois aceites simultâneos | exatamente um conclui | `plataforma/tests/sql-convites.test.ts:767` (sequencial); `:775-778` regex `for update` | ⚠️ simultaneidade só com prova sequencial (pendência) |
| 02.13 Já é membro | mantém o papel, "Você já está neste mandato", não consome | `plataforma/tests/sql-convites.test.ts:785-791`; `plataforma/e2e/convite-aceite.spec.ts:57` | ✅ (⚠️ ordem 02.13 × 02.16: quando o convite não vale, o banco responde `invalido`; pendência) |
| 02.14 Mais de 10 inválidos em 10 min | bloqueio de 15 min | `plataforma/tests/sql-convites.test.ts:611-613`, `:628-632`, `:641-642`; `plataforma/e2e/convite-aceite.spec.ts:117`, `:126` | ✅ (⚠️ `x-forwarded-for` forjável; pendência) |
| 02.15 Falha ao criar conta | motivo; convite não consumido | `plataforma/e2e/convite-conta.spec.ts:114-118`, `:130-133` | ✅ |
| **02.16** Quem criou tem papel menor; saiu com papel menor; foi removida (coordenação ou `/admin`); conta apagada ou dados excluídos | prévia e aceite `{ok:false, erro:'invalido'}` (o mesmo do 02.10), convite não consumido | rebaixada e ainda membro: `plataforma/tests/sql-convites.test.ts:879`, `:965`, `:969`, `:1014`, `:1016`; saiu com papel menor: `:1130` `situacao(...) === ['invalido','vale','vale']`, `:1133` `aceitar === INVALIDO`, `:1134` `NAO_USADO`, `:1157`, `:1161`, `:1163`; removida pela coordenação e pelo `/admin`: `:902`, `:904`, `:905` tentativas, `:907`, `:1180` `['invalido','invalido']`; conta apagada depois de sair: `:1192`, `:1195`, `:1196`; dados excluídos depois de sair: `:1213` `['invalido','vale']`; papel lido no mandato do convite: `:1014-1025`; sondas V-1, V-1b, N-13, N-14, N-19, N-20 | ✅ |
| **02.17** Fora do mandato depois de sair por conta própria: vale se o papel ao sair ≥ papel do convite, na prévia, no aceite, nos pendentes e no limite | prévia completa `ok:true`, aceite `{ok:true, ja_membro:false}`, listado, conta no limite | `plataforma/tests/sql-convites.test.ts:1109-1110` `deepEqual(previa, {ok:true, nome:'Reserva', papel:'coordenacao', convidado_por:'Mario Membro', mandato, exige_email:false})`, `:1111` pendentes `['Reserva']`, `:1113` aceite, `:1114` `usado_por: DORA`, `:1115-1117` papel `coordenacao`; assessoria: `:1130`, `:1131`, `:1136`, `:1138`; limite: `:1317`, `:1319`; outro mandato não interfere: `:1281`, `:1287`, `:1307-1308`; sondas N-12a, N-16, N-18, N-18b, N-25 | ✅ |
| **02.18** Reentrada (convite ou `/admin`) descarta o papel da saída: vale o atual, removida depois não vale, nova saída vale pela última | `invalido` dentro com papel menor, `invalido` depois de removida, a última saída manda | por convite e removida: `plataforma/tests/sql-convites.test.ts:1225`, `:1227`, `:1228`, `:1231`, `:1233`, `:1235`; pelo `/admin`: `:1245`, `:1248`, `:1249`; duas saídas: `:1257`, `:1264` `['invalido']`; outra entrada não descarta: `:1307`; sondas N-12a, N-12c, N-20, N-25 | ✅ |

### ACE-03: Papéis do mandato aplicados no banco

| Critério | Resultado definido pela spec | Evidência | Resultado |
| -------- | ---------------------------- | --------- | --------- |
| 03.1 Só três papéis | check em `membros.papel` | `plataforma/tests/sql-papeis.test.ts:54-65` | ✅ |
| 03.2 `leitura` não escreve | nenhuma escrita nos dados e nos membros | `plataforma/tests/sql-papeis.test.ts:76-78`, `:83`; `plataforma/tests/sql-membros.test.ts:485`, `:490`, `:498`; `plataforma/tests/sql-convites.test.ts:927`; sondas S-2, V-1c | ✅ (telemetria `uso_funcionalidades` por `leitura` aceita pelo usuário) |
| 03.3 Guia oculta ou desabilita | controles travados | `plataforma/tests/legado-acesso.test.ts:204-205`, `:228`; `plataforma/e2e/guia-acesso.spec.ts:169-170`, `:176-180`, `:194-199`, `:218` | ✅ |
| 03.4 Troca vale na chamada seguinte | papel lido a cada chamada | `plataforma/tests/sql-membros.test.ts:73-82`; `plataforma/tests/sql-papeis.test.ts:135-137`; `plataforma/tests/sql-convites.test.ts:975` | ✅ |
| 03.5 Remover tira do mandato e mantém a conta | sai de `membros`; a conta fica | `plataforma/tests/sql-membros.test.ts:177-183`, `:413`, `:417`, `:431`; `plataforma/tests/sql-convites.test.ts:904-908`; sonda S-3 | ✅ |
| 03.6 Só a coordenação troca papel ou remove | erro de permissão e nada muda | `plataforma/tests/sql-membros.test.ts:88-92`, `:98-102`, `:188-193`, `:380`, `:384`; `plataforma/tests/sql-convites.test.ts:885-886`; sonda S-1 | ✅ |
| 03.7 Última coordenação (remover, rebaixar ou sair) | "O mandato precisa ter ao menos uma pessoa na coordenação." e nada muda | `plataforma/tests/sql-membros.test.ts:108-111`, `:208-210`, `:271-273`; sonda N-24; na tela, `plataforma/e2e/mandato-equipe.spec.ts:607-612`, `:646` | ✅ (⚠️ `excluir_meus_dados` pode deixar o mandato sem coordenação, sonda N-27; pendência) |
| 03.8 Rebaixamentos simultâneos | uma conclui, a outra é recusada | `plataforma/tests/sql-membros.test.ts:119-130`, `:136-139` | ⚠️ simultaneidade só com prova sequencial (pendência) |
| 03.9 Sair por conta própria | sai, respeitando a coordenação | `plataforma/tests/sql-membros.test.ts:258-266`, `:271`; `plataforma/e2e/mandato-equipe.spec.ts:599` `membro_sair` com `{p_mandato}` | ✅ |
| 03.10 Equipe Legisla intacta | `equipe_legisla` e `/admin` não mudam | `plataforma/tests/sql-membros.test.ts:102`, `:203`, `:498`; sonda N-21 | ✅ |
| 03.11 `leitura` convida só `leitura` e cancela só os próprios | — | `plataforma/tests/sql-convites.test.ts:269`, `:283-286`, `:466`, `:491` | ✅ |
| **03.12** Removida, ou rebaixada (e depois saiu) não volta a papel maior que o atual ou que o da saída por convite que criou, com a própria conta ou outra | recusado pelo 02.16 e nada muda | própria conta: `plataforma/tests/sql-convites.test.ts:879`, `:883`, `:904`, `:925`, `:1161` (loop com `IDS.membro`), `:1233`; outra conta: `:921`, `:969`, `:1161` (loop com `CARLOS`); estado final: `:886`, `:906`, `:928`, `:1166-1168`, `:1236`; sondas V-1, N-12c, N-14, N-15 | ✅ |

### ACE-04: Tela Equipe e convites

| Critério | Resultado definido pela spec | Evidência | Resultado |
| -------- | ---------------------------- | --------- | --------- |
| 04.1 Ordem da tela | formulário, pendentes, pessoas | `plataforma/e2e/mandato-equipe.spec.ts:529-532` | ✅ |
| 04.2 Só pendentes que valem (02.16 a 02.18), com nome, papel, quem convidou e dias | — | `plataforma/tests/sql-convites.test.ts:398-401`, `:897`, `:908`, `:962`, `:988`, `:1111`, `:1131`, `:1158`, `:1181`, `:1214`, `:1228`, `:1288`, `:1308`; `plataforma/e2e/mandato-equipe.spec.ts:303-306` | ✅ |
| 04.3 Cancelar remove da lista | — | `plataforma/e2e/mandato-equipe.spec.ts:328-333`; `plataforma/tests/sql-convites.test.ts:466` | ✅ |
| 04.4 Criador ou coordenação cancela | — | `plataforma/tests/sql-convites.test.ts:466-469`, `:478-479`; quem saiu ou foi removida não cancela: `:1042`, `:1044` `rejects(cancelar(...), SEM_PERMISSAO)`, `:1046-1051` | ✅ (R-X01 morto) |
| 04.5 Outros recebem erro de permissão | — | `plataforma/tests/sql-convites.test.ts:488-492`; `plataforma/e2e/mandato-equipe.spec.ts:349-350` | ✅ |
| 04.6 a 04.13 | sem mudança de comportamento; o botão novo fica fora da lista | `plataforma/e2e/mandato-equipe.spec.ts:423-429`, `:437-442`, `:449-453`, `:93`, `:463-466`, `:502-506`, `:364`, `:523`, `:270-271`, `:551-552`, `:581` (lista sem "Sair do mandato" para os três papéis, 04.8); `plataforma/tests/sql-membros.test.ts:332-336` | ✅ |
| **04.14** Botão "Sair do mandato" em qualquer papel, depois de "Pessoas neste mandato" | visível e habilitado nos três papéis, abaixo da lista | `plataforma/e2e/mandato-equipe.spec.ts:579-580` `toBeVisible`/`toBeEnabled`, `:583` `y(área) > y(.md-pessoas)` (laço dos três papéis em `:576`) | ✅ |
| **04.15** Confirmação na própria página; só "Confirmar saída" chama o banco | sem janela do navegador; "Não sair" não chama | `plataforma/e2e/mandato-equipe.spec.ts:591` texto da confirmação, `:593-594` `esperaSemRpc('membro_sair') === []`, `:601` `janelas === []` | ✅ |
| **04.16** Saída apaga `legisla.mandatoAtual` e abre o Guia | chave nula, `/guia` | `plataforma/e2e/mandato-equipe.spec.ts:589` (antes: `MANDATO_A`), `:597-598` `/guia`, `:599` uma chamada `membro_sair` com `{p_mandato: MANDATO_A}` e o token da sessão, `:600` `localDe(...) === null`; `:620-621` (coordenação com outra coordenação) | ✅ (o Guia escolher outro mandato ou o primeiro acesso sem a chave é comportamento anterior do Guia; o e2e usa um Guia de teste) |
| **04.17** Única coordenação: mensagem no clique e banco não chamado | texto exato; sem chamada | `plataforma/e2e/mandato-equipe.spec.ts:607` `toHaveText(UNICA)` (texto da spec em `:562`), `:608`, `:609` `esperaSemRpc === []`, `:610-611`, `:627-633` (promover outra pessoa libera, sem recarregar) | ✅ |
| **04.18** Recusa do banco: mensagem e a pessoa continua com o mesmo mandato | as duas mensagens da spec | `plataforma/e2e/mandato-equipe.spec.ts:638-639` (as duas mensagens), `:646` `toHaveText(mensagem)`, `:648-651` uma chamada, `/mandato/equipe`, `MANDATO_A`, botão habilitado | ✅ |

### ACE-05: Área do mandato

Sem mudança de código nesta rodada. Evidência: `plataforma/e2e/mandato-area.spec.ts:30-31`, `:63`, `:97-107`, `:136-138`, `:145-146`, `:182`, `:258-260`; `plataforma/e2e/mandato-casca.spec.ts:59`, `:85-89`, `:134-136`; `plataforma/tests/convites-dias.test.ts`, `plataforma/tests/convites-missoes.test.ts`, `plataforma/tests/convites-api.test.ts:204`. ✅

### ACE-06: Histórico da equipe

Evidência: `plataforma/tests/sql-convites.test.ts:359-362`, `:513-516`, `:828-831`, `:888`, `:1029`, `:1051` (`membro_saiu` gravado); `plataforma/tests/sql-membros.test.ts:147-150`, `:232-235`, `:297-300`; `plataforma/tests/sql-eventos-equipe.test.ts:58-62`, `:73-78`; sonda N-18 (aceite desfeito pelo histórico não zera `papel_ao_sair`). ✅

### ACE-07: Retirar o código de convite antigo

| Critério | Evidência | Resultado |
| -------- | --------- | --------- |
| 07.1 `entrar_com_codigo` sem execução | `plataforma/tests/sql-convites.test.ts:1346` `rejects(..., NEGADO)`, `:1350-1353` `has_function_privilege` falso para `anon` e `authenticated` | ✅ |
| 07.2 Guia sem campo, botão nem mensagem | `plataforma/e2e/guia-acesso.spec.ts:118`, `:123-126`, `:134-137`; `plataforma/tests/legado-acesso.test.ts:125`, `:161` | ✅ |
| 07.3 Cadastro novo cria `coordenacao` | `plataforma/tests/legado-acesso.test.ts:176`; `plataforma/tests/sql-membros.test.ts:452`, `:456`, `:459`, `:461`, `:470`; `plataforma/e2e/guia-acesso.spec.ts:159` | ✅ |
| 07.4 "link de convite" no aviso | `plataforma/tests/legado-acesso.test.ts:264`, `:268`, `:272`, `:276` | ✅ |
| 07.5 `mandatos.codigo` interno | `plataforma/e2e/guia-acesso.spec.ts:135` | ✅ |

**Status**: todos os critérios com evidência; nenhuma violação provada. ⚠️ só as pendências já classificadas pelo dono do produto (ver "Pendências").

### Os testes novos afirmam a spec, não a implementação

Os 13 testes do AD-012 (`plataforma/tests/sql-convites.test.ts:1103-1339`) afirmam só o que a pessoa vê pela API: a resposta da prévia (`situacao(...)` devolve `vale` ou exatamente `{ok:false, erro:'invalido'}`), a do aceite, os nomes em "Convites pendentes", a recusa do 21º convite e o estado final de `membros` e do convite. Nenhum lê `papel_ao_sair` nem chama `private.convite_autorizado`. Os 10 e2e do botão afirmam os textos da spec, a ausência de janela do navegador, a chamada ao banco com o corpo, a URL, a chave `legisla.mandatoAtual` e o estado do botão. Único ponto ligado à implementação: o nome do RPC (`membro_sair`), que é o contrato da ACE-03.9.

---

## Discrimination Sensor

**Profundidade**: P0 (autorização e papéis). Cada mutante foi aplicado no worktree temporário e rodou contra todos os `tests/sql-*.test.ts` (10 arquivos, 203 testes); o arquivo voltava por `git checkout` antes do próximo. Base sem mutante: 203/203. Script e log: `C:/Users/brand/AppData/Local/Temp/claude/57a04a93ef010ab3/5234d250-8b62-4943-94c7-21c4926689eb/scratchpad/vf8/mutar_sql.py` e `mutar_sql.log`.

### SQL: os sobreviventes das iterações anteriores, refeitos sobre o código atual

| Mutante | Arquivo | Descrição | Morto? | Teste que mata |
| ------- | ------- | --------- | ------ | -------------- |
| A01a | `plataforma/supabase/migrations/20261106150000_convites_de_quem_sai.sql:33` | sem `b.mandato_id = p_mandato` na conferência do nível (o papel em outro mandato vale) | ✅ (1 falha) | `plataforma/tests/sql-convites.test.ts:998` |
| A01b | `:31` e `:33` | sem o filtro de mandato nos dois `exists` | ✅ (2) | `:998`, `:1291` |
| R-X01a | `plataforma/supabase/migrations/20261106120000_convites_equipe.sql:373` | sem `v_papel is null or` (quem saiu cancela o próprio) | ✅ (2) | `plataforma/tests/sql-convites.test.ts:1032`, `:495` |
| R-X01b | `20261106120000_convites_equipe.sql:372` | `coalesce(papel_no_mandato(...), 'leitura')` (quem está fora vira `leitura`) | ✅ (1) | `plataforma/tests/sql-convites.test.ts:1032` |
| A07 | `20261106150000_convites_de_quem_sai.sql:131` | limite confere `'leitura'` no lugar de `c.papel` | ✅ (2) | `plataforma/tests/sql-convites.test.ts:1054`, `:1324` |

### SQL: amostra dos G01 a G20 do worker (13 de 20)

| Mutante | Linha | Descrição | Morto? |
| ------- | ----- | --------- | ------ |
| G01 | `:30` | sem `when p_criado_por is null then false` | ✅ (1) `:1184` |
| G02 | `:31` | membro em qualquer mandato | ✅ (2) `:1268`, `:1291` |
| G04 | `:35` | fora do mandato, sempre vale | ✅ (13) |
| G06 | `:35` | `>=` vira `>` | ✅ (9) |
| G08 | `:79` | `membro_sair` não grava `papel_ao_sair` | ✅ (9) |
| G09 | `:79` | grava em todos os mandatos da pessoa | ✅ (1) `:1268` |
| G11 | `:79` | grava sempre `coordenacao` | ✅ (7) |
| G12 | `:47-48` | reentrada não zera | ✅ (2) `:1217`, `:1239` |
| G13 | `:48` | reentrada zera em todos os mandatos | ✅ (1) `:1291` |
| G14 | `:48` | reentrada zera os convites de todo o mandato | ✅ (2) `:1120`, `:1291` |
| G15 | `:95` | `excluir_meus_dados` não zera | ✅ (1) `:1199` |
| G17 | `:131` | limite ignora `papel_ao_sair` | ✅ (1) `:1311` |
| G19 | `:188` | prévia ignora `papel_ao_sair` | ✅ (8) |
| G20 | `:221` | aceite ignora `papel_ao_sair` | ✅ (4) |

### SQL: mutantes novos do Verifier

| Mutante | Linha | Descrição | Morto? |
| ------- | ----- | --------- | ------ |
| V01 | `:221` | aceite trata quem saiu como `coordenacao` | ✅ (7) |
| V02 | `:188` | prévia idem | ✅ (10) |
| V03 | `:166` | pendentes idem | ✅ (11) |
| V04 | `:131` | limite idem | ✅ (1) `:1324` |
| V05 | `:30` | `criado_por` nulo vale | ✅ (2) `:982`, `:1184` |
| V06 | `:73-77` | `membro_sair` sem a regra da última coordenação | ✅ (2) `plataforma/tests/sql-membros.test.ts:269`, `:311` |
| V07 | `:56` | gatilho em `update` em vez de `insert` | ✅ (2) `:1217`, `:1239` |
| V08 | `:95` | `excluir_meus_dados` zera os convites de todo mundo | ✅ (1) `:1199` |
| V09 | `:79` | saída grava sempre `leitura` | ✅ (8) |
| V10 | `:34` | membro precisa de papel estritamente maior | ✅ (10) |

**SQL**: 29 de 29 mortos, 0 sobreviventes (A01, R-X01 nas duas formas e A07 agora morrem).

### Botão "Sair do mandato" e tratamento de erro

Cada mutante no worktree temporário, servido pelo `next dev` da porta 3300, contra o bloco "Sair do mandato" de `plataforma/e2e/mandato-equipe.spec.ts` (10 testes; base 10/10) e, no mutante de `erros.ts`, também contra `plataforma/tests/convites-erros.test.ts`. O arquivo voltava ao conteúdo original antes do próximo. Script e log: `C:/Users/brand/AppData/Local/Temp/claude/57a04a93ef010ab3/5234d250-8b62-4943-94c7-21c4926689eb/scratchpad/vf8/mutar_ui.py` e `mutar_ui.log`.

| Mutante | Arquivo:linha | Descrição | Morto? |
| ------- | ------------- | --------- | ------ |
| U01 | `plataforma/app/mandato/equipe/SairDoMandato.tsx:44` | não apaga `legisla.mandatoAtual` | ✅ (1) `:587` |
| U02 | `:41-42` | depois da recusa, segue para o Guia | ✅ (2) `:641` |
| U03 | `:24` | a própria pessoa conta como "outra coordenação" | ✅ (2) `:604`, `:624` |
| U04 | `:29` | sem confirmação: o clique já chama o banco | ✅ (6) |
| U05 | `:40` | mensagem fixa no lugar da recusa do banco | ✅ (1) `:641` (recusa) |
| U06 | `:37` | `membro_remover` da própria pessoa no lugar de `membro_sair` | ✅ (4) |
| U07 | `:45` | abre `/mandato` no lugar de `/guia` | ✅ (2) `:587`, `:615` |
| U08 | `:28` | sem a orientação da única coordenação | ✅ (2) `:604`, `:624` |
| U09 | `:39` | a recusa deixa a confirmação aberta | ✅ (2) `:641` |
| U10 | `:41` | a recusa deixa os botões travados | ✅ (2) `:641` |
| U11 | `:23` | a orientação vale para qualquer papel, não só `coordenacao` | ⚠️ sobreviveu; **equivalente** nos estados que a spec admite: quem não é `coordenacao` só fica sem outra coordenação na lista se o mandato não tiver nenhuma, o que a ACE-03.7 proíbe (o único caminho é a pendência `excluir_meus_dados`) |
| U12 | `:23-24` | sem a lista (leitura falhou), a coordenação recebe a orientação da única coordenação e não sai pela tela | ❌ sobreviveu; **não equivalente**, mas não é guarda de segurança: só deixa a tela mais restritiva, e a regra de verdade está no banco (V06 morto). A ACE-04.17 fala de "nenhuma outra pessoa da lista" e não diz o que vale sem lista (⚠️ precisão); o código diz "sem a lista, quem decide é o banco" e nenhum teste fixa isso |
| A01-UI | `plataforma/lib/convites/api.ts:64` | o botão chama `excluir_meus_dados` | ✅ (4) |
| E01 | `plataforma/lib/convites/erros.ts:15` | a recusa da última coordenação vira "Não foi possível concluir." | ✅ e2e `:641` e `plataforma/tests/convites-erros.test.ts:39` |

**Tela**: 12 de 14 mortos; 1 equivalente (U11); 1 sobrevivente não equivalente fora de guarda de segurança (U12, gap menor).

**Total do sensor**: 43 mutantes, 41 mortos, 1 equivalente, 1 sobrevivente de baixo risco. Nenhum mutante não equivalente sobrevive em guarda de segurança.

---

## Qualidade do código

| Princípio | Status |
| --------- | ------ |
| Código mínimo | ✅ a migration repete as funções só para trocar a chamada da guarda (diff dos corpos acima); o componente tem 66 linhas, sem abstração nova |
| Mudanças cirúrgicas | ✅ `Equipe.tsx` ganhou 1 import e 1 linha; nenhum arquivo fora do escopo |
| Sem escopo extra | ✅ |
| Segue os padrões | ✅ confirmação na própria página, como "Remover" (`ListaPessoas.tsx`); erro por `mensagemDe`; `localStorage` dentro de `try`, como `Casca.tsx` |
| Asserções batem com a spec | ✅ (seção acima) |
| Cobertura por camada | ✅ SQL com caminho feliz, bordas e recusas; e2e com feliz, borda (única coordenação) e erro (recusa e rede) |
| Todo teste mapeia um critério | ✅ os títulos citam o critério |
| Guias do projeto | `plataforma/AGENTS.md` (guia do Next lido antes de código Next) e as regras de `tasks.md:17-24`; seguidas |

---

## Bordas

- [x] Última coordenação tenta sair: o banco recusa (sonda N-24, `plataforma/tests/sql-membros.test.ts:271`) e a tela orienta antes (`plataforma/e2e/mandato-equipe.spec.ts:607`).
- [x] Mesmo e-mail convidado duas vezes, outro aparelho, Google interrompido, sessão expirada, outro e-mail: sem mudança desde a iteração 3.
- [x] Quem saiu, voltou e foi removida (N-12c), conta apagada depois de sair (N-13), saída em um mandato com convites em outro (N-16), reentrada desfeita (N-18).

---

## Gate

- **Comandos** (gate de build de `tasks.md:41-51`, em `plataforma/`, num worktree limpo de `HEAD`): `npx tsc --noEmit`, `npm test` e `npx playwright test e2e/convite-*.spec.ts e2e/mandato-*.spec.ts e2e/guia-acesso.spec.ts --timeout=120000`. Para o e2e, uma config temporária só no worktree, com `baseURL` na porta 3300 e o servidor `next dev --webpack -p 3300` (a 3000 é do usuário; outras sessões usam a 3100).
- **`npx tsc --noEmit`**: 0 erros (exit 0).
- **`npm test`**: 981 passaram, 0 falharam, 0 pulados, 0 cancelados (exit 0).
- **e2e**: 147 de 147 (10,4 min, exit 0). Na primeira subida o `next dev` parou para mostrar o aviso de vulnerabilidade conhecida do Next 16.4; a segunda, com o mesmo comando, subiu. Nenhum upgrade foi feito.
- **Antes e depois**: 725 testes de unidade e SQL na base da feature (`ac19a35`); 965 na iteração 3; 981 agora (+256 na feature; +16 desde a iteração 3: 3 da correção `6092e3c` e 13 do AD-012). e2e: 137 na iteração 3, 147 agora (+10 do botão). Nenhum teste removido ou enfraquecido: `git diff eb1cc0d HEAD -- plataforma/tests plataforma/e2e` só acrescenta, fora uma linha de import do e2e que passa a trazer `esperaSemRpc` e `localDe`.
- **`npm run build`**: fora do gate, como `tasks.md:51` registra (`SecurityFatalError` do Next 16.4).

---

## Pendências do dono do produto (não reprovam)

1. **ACE-02.12 e ACE-03.8**: simultaneidade só com prova sequencial e trava `for update` conferida no código; o PGlite tem uma conexão.
2. **ACE-02.14**: a "mesma origem" é o primeiro IP de `x-forwarded-for`, que o cliente pode forjar.
3. **ACE-03.7**: `excluir_meus_dados()` apaga as linhas da pessoa sem a regra da última coordenação. Sonda N-27: se todos os outros membros excluírem os dados, o criador do mandato (mesmo rebaixado e fora) volta como `coordenacao` pela política do cadastro.
4. **Ordem 02.13 × 02.16**: quem já é membro e abre um convite que não vale recebe `invalido`, não "Você já está neste mandato".
5. **Pendência 7 do STATE (AD-012)**: (a) quem sai pode voltar pelos próprios convites, com a própria conta ou outra, até o papel que tinha ao sair (sonda N-12b: volta como `coordenacao`); (b) a coordenação vê esses convites e pode cancelá-los (sonda N-26); (c) saída simultânea a uma remoção: a remoção falha com "Pessoa não encontrada." e os convites seguem valendo (sonda N-17 e análise da corrida).
6. **Textos escolhidos pelos workers** onde a spec não dá o texto (por exemplo, a confirmação "Sair de {mandato}? Você deixa de ver este mandato e, para voltar, precisa de um link de convite." e "Você pode sair deste mandato. A sua conta continua na plataforma.").
7. **Aviso do Next 16.4**: o `next dev` parou na primeira subida para mostrar o aviso de vulnerabilidade conhecida e recomendar o upgrade; nada foi atualizado (decisão do usuário, registrada no STATE).

---

## Requirement Traceability Update

| Requisito | Status anterior | Status novo |
| --------- | --------------- | ----------- |
| ACE-01 | Pending | ✅ Verified |
| ACE-02 (com 02.16 a 02.18) | Pending | ✅ Verified |
| ACE-03 (com 03.12) | Pending | ✅ Verified |
| ACE-04 (com 04.14 a 04.18) | Pending | ✅ Verified |
| ACE-05 | Pending | ✅ Verified |
| ACE-06 | Pending | ✅ Verified |
| ACE-07 | Pending | ✅ Verified |

Atualizado em `spec.md` (tabela de traceability) e no status de `tasks.md`.

---

## Resumo

**Geral**: ✅ Pronto (PASS), com um gap menor e as pendências do dono do produto.

**O que funciona**: o convite vale só com a autoridade de quem o criou, lida no mandato do convite: papel atual para quem está dentro; papel da última saída para quem saiu por conta própria; nada para quem foi removida, teve a conta apagada ou excluiu os dados. Isso vale na prévia, no aceite, nos pendentes e no limite de 20. A reentrada por convite, pelo `/admin` ou pelo cadastro zera o papel da saída só daquele mandato, e uma reentrada desfeita não zera. O botão "Sair do mandato" aparece em qualquer papel, confirma na própria página, chama só `membro_sair`, apaga o mandato ativo e abre o Guia. Na recusa, mostra a mensagem e mantém a pessoa na tela.

**Gaps (ranqueados)**:
1. Menor, só na tela: U12. Se a lista de pessoas não carrega, nenhum teste fixa que a coordenação ainda pode pedir a saída e o banco decide. Correção sugerida: um e2e em `plataforma/e2e/mandato-equipe.spec.ts` com `equipe_do_mandato` falhando; a coordenação clica "Sair do mandato", vê a confirmação e "Confirmar saída" chama `membro_sair`. Antes, a spec deve dizer o que a ACE-04.17 faz sem lista.
2. U11: equivalente enquanto a ACE-03.7 valer. Só muda se a pendência de `excluir_meus_dados` deixar um mandato sem coordenação.

**Lições**: L-032 (candidata, `surviving_mutant`, U12) registrada por `lessons.py`. Nenhuma outra: os demais sinais são pendências já registradas (L-024 a L-031).

**Próximo passo**: entregar ao usuário com a lista de pendências acima, principalmente a pendência 7 do STATE (efeitos do AD-012), e decidir se o gap 1 vira uma task de teste. Push, migrations e deploy só com go-ahead explícito.
