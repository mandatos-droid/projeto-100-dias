# Acesso, Equipe e Convites: relatório do Verifier

## Validation: acesso-equipe-convites — FAIL (iteração 3 de 3, a última)

**Data**: 2026-11-06
**Spec**: `.specs/features/acesso-equipe-convites/spec.md` (ACE-01 a ACE-07, com ACE-02.16 e ACE-03.12 novos)
**Faixa do diff**: feature inteira `ac19a35..0312cd1`; correções desta iteração `a2e317e..0312cd1` (`68c835e`, `13a0609`, `0312cd1`: migration `plataforma/supabase/migrations/20261106140000_convites_autoridade.sql`, 6 testes em `plataforma/tests/sql-convites.test.ts`, 2 em `plataforma/tests/sql-membros.test.ts`, AD-011 em `.specs/STATE.md`, ACE-02.16, ACE-03.12 e a linha "Convite de quem perdeu o papel" na spec).
**Verifier**: sub-agente independente (autor ≠ verificador). Nenhum código ou teste foi alterado. Sondas, sensor e gate rodaram em dois worktrees temporários de `HEAD` (`git worktree add --detach`), descartados no fim, sem `git stash`.

**Motivo do FAIL**: o código em `HEAD` está certo. Todas as sondas desta iteração foram recusadas: S-1 a S-3, V-1, V-1b, V-1c e 11 variantes novas da mesma classe. O fluxo legítimo continua funcionando, a migration aplica e reaplica sobre dados antigos, e o gate passou inteiro. O que reprova é o sensor: o mutante **A01** sobrevive na guarda nova `private.convite_autorizado`. Sem o filtro `b.mandato_id = p_mandato`, a suíte inteira passa (965/965). Mas a sonda N-1 mostra que, com esse mutante, quem foi rebaixado e saiu de um mandato volta como `coordenacao` pelo próprio convite, desde que seja `coordenacao` em **outro** mandato (ACE-02.16, ACE-03.12). Isso é comum aqui: hoje os cadastros são feitos pela equipe Legisla (`spec.md:46`), e uma mesma pessoa coordena vários mandatos. Também sobrevive o **R-X01**, a guarda de membro em `convite_cancelar`: ninguém testa a pessoa que já saiu tentando cancelar o convite que ela mesma criou. O efeito é baixo, mas é uma guarda de autorização. Como esta é a última iteração, o caso vai para o usuário (ver "Próximo passo").

---

## Situação das falhas anteriores

| Falha | Correção em `HEAD` | Teste que a fixa (`arquivo:linha`, asserção) | Sonda re-executada contra `HEAD` | Status |
| ----- | ------------------ | -------------------------------------------- | -------------------------------- | ------ |
| S-1: `assessoria` reescreve `criado_por`, sai e volta como `coordenacao` | gatilho `mandatos_trava_criador` (`20261106130000_papeis_blindagem.sql:16-30`) | `plataforma/tests/sql-membros.test.ts:380` `assert.rejects(trocaCriador(ASSESSORIA), SEM_PERMISSAO)`, `:384` reinserção recusada por RLS | update → `42501 Você não tem permissão para esta ação.`; reinserção → `new row violates row-level security policy for table "membros"` | ✅ fechada |
| S-2: criador rebaixado a `leitura` exclui o mandato | `excluir_mandato` exige `coordenacao` atual | `plataforma/tests/sql-membros.test.ts:485` e `:490` `assert.rejects(excluirMandato(), SO_COORDENACAO_EXCLUI)`, `:486` e `:491` `existe === true` | `42501 Só a coordenação do mandato pode excluir o cadastro.`; o mandato existe | ✅ fechada |
| S-3: criador removido se reinsere como `coordenacao` | `membros_criar` só na primeira linha | `plataforma/tests/sql-membros.test.ts:413`, `:417` `select id from mandatos` vazio | os três papéis recusados por RLS; 0 mandatos visíveis | ✅ fechada |
| V-1: coordenação rebaixada a `leitura` aceita o próprio convite e remove quem a rebaixou | `convite_aceitar` exige `private.convite_autorizado` (`20261106140000_convites_autoridade.sql:147-150`) | `plataforma/tests/sql-convites.test.ts:879` e `:883` `deepEqual(await aceitar(token), INVALIDO)`, `:885` `rejects(removerMembro(ASSESSORIA), SEM_PERMISSAO)`, `:886` papéis finais, `:887` convite não usado | antes e depois de sair: `{ok:false, erro:'invalido'}`; remoção → `42501`; papéis `{ASSESSORIA: coordenacao, LEITOR: leitura}` | ✅ fechada |
| V-1b: removida aceita o próprio convite | idem; `convite_previa` e `convites_pendentes` com a mesma condição (`:115`, `:93`) | `plataforma/tests/sql-convites.test.ts:902` prévia `INVALIDO`, `:904` aceite `INVALIDO`, `:905` `tentativas() === ['1.2.3.4','1.2.3.4']`, `:908` `nomesListados(ASSESSORIA) === []` | prévia e aceite `invalido`; pendentes `[]` | ✅ fechada |
| V-1c: `assessoria` rebaixada recupera a escrita | idem | `plataforma/tests/sql-convites.test.ts:921` (segunda conta) e `:925` `INVALIDO`, `:927` `affectedRows === 0` | `invalido`; `update mandatos` afeta 0 linhas | ✅ fechada |
| B06: guarda de mandato vazio em `membros_criar` sem teste | teste novo | `plataforma/tests/sql-membros.test.ts:429` o mandato segue visível pela equipe Legisla, `:431` `rejects(entraDireto(IDS.membro,'coordenacao'), RLS)` | mutante R-B06 agora morto | ✅ fechada |
| B08: `user_id = auth.uid()` em `membros_criar` sem teste | teste novo | `plataforma/tests/sql-membros.test.ts:470` `rejects(entraDireto(ASSESSORIA,'coordenacao',id), RLS)` | mutante R-B08 agora morto | ✅ fechada |
| T12: `=== true` em `missoes.ts` | aceito como equivalente | — | não reexecutado | ⚠️ aceito |

---

## Sondas da iteração 3

Arquivo de sonda só no worktree temporário, sobre as migrations reais no PGlite (`tests/sql-ambiente.ts`, que reproduz os privilégios padrão do Supabase). Só chamadas que o PostgREST expõe a `authenticated` e `anon`.

| Sonda | Passos (como a pessoa, pela API) | Resultado observado | Critério |
| ----- | -------------------------------- | ------------------- | -------- |
| N-1 | quem criou o convite (`coordenacao`) é também `coordenacao` no mandato B; é rebaixada a `leitura` no A, aceita, sai, abre a prévia e aceita de novo | `invalido` nas três | ✅ ACE-02.16, 03.12 (mas o mutante A01 libera, ver sensor) |
| N-2 | segunda conta aceita o convite de quem foi removida | `invalido` | ✅ ACE-03.12 |
| N-3 | rebaixada a `leitura`: cancela o próprio convite; cancela convite de outra pessoa; depois de sair, cancela convite de outra pessoa | aceito; `42501`; `42501` | ✅ ACE-03.11, 04.4, 04.5 |
| N-3b | removida cancela o próprio convite | `42501` | ✅ `spec.md:63` (sem teste: mutante R-X01) |
| N-4 | `convites_pendentes`: colunas devolvidas; chamado por removido, equipe Legisla fora do mandato, coordenação de outro mandato e anon; `private.convite_autorizado` chamado direto | colunas `convidado_por_nome, expira_em, id, nome, papel` (sem token, hash nem e-mail, mesmo com e-mail gravado); `42501` nos quatro; `permission denied for function convite_autorizado` | ✅ ACE-01.3, 04.2 |
| N-5 | `leitura`: `update mandatos`, `insert`/`update`/`delete` em `eventos` (também como `assessoria`), `update membros set papel`, `upsert` em `membros`, `delete` em `membros` e `mandatos`, `membro_trocar_papel` em si, `membro_remover`, convite `assessoria`, `excluir_mandato`, `insert` em `convites` e `eventos_equipe` | 0 linhas, RLS, `permission denied`, `42501` ou a mensagem de papel maior; papéis e dados inalterados | ✅ ACE-03.2 (⚠️ S-4: `uso_funcionalidades` aceita, inalterado) |
| N-6 | rebaixada de `coordenacao` a `assessoria`; segunda conta aceita o convite de `coordenacao` criado antes | `invalido` | ✅ ACE-02.16 |
| N-7 | conta de quem criou apagada (cascata `on delete set null`); outra conta aceita | `criado_por` nulo; `invalido` | ✅ ACE-02.16 |
| N-8 | removida e readmitida pela coordenação atual como `leitura`; segunda conta aceita o convite antigo de `coordenacao` | readmissão aceita; convite antigo `invalido` | ✅ ACE-03.12 |
| N-9 | membro atual (`leitura`) abre convite de quem foi rebaixada | `invalido` (não `ja_membro`); nada muda | ⚠️ ver "Ordem entre 02.13 e 02.16" |
| N-10 | a coordenação cria 20 convites e é removida; a nova coordenação cria convites | cria mais 20 e o 21º é recusado com a mensagem da spec | ✅ ACE-01.9 (observação: se a removida for readmitida, os 20 antigos voltam a valer e somam 40) |
| N-11 | a coordenação cria 20 convites de `coordenacao` e é rebaixada a `leitura` (segue no mandato); a nova coordenação convida | 0 pendentes visíveis; convite criado | ✅ ACE-01.9, AD-011 (sem teste: mutante A07) |
| Corrida | aceite simultâneo a uma troca de papel de quem criou | não reproduzível no PGlite (uma conexão). Análise: `membro_trocar_papel` e `membro_remover` travam as linhas de `membros`. O aceite lê o papel de quem criou sem trava e só acrescenta uma linha. Em `READ COMMITTED`, o resultado equivale ao aceite feito antes da troca: a nova pessoa fica visível na equipe e no histórico, e a regra da última coordenação não é afetada. É o que diz o comentário da migration (`:11-13`) | ⚠️ mesma classe de 02.12 e 03.8 |

**Fluxo legítimo** (mesmo arquivo, todas aceitas): cadastro novo como o Guia faz (`insert mandatos ... returning id`, depois `insert membros` como `coordenacao`), convite `assessoria` com prévia `ok:true` e aceite `{ok:true, ja_membro:false}`, `assessoria` editando o mandato (1 linha), `assessoria` convidando `leitura` e o aceite, troca de papel, remoção, saída e exclusão pela coordenação. Nos testes: `plataforma/tests/sql-convites.test.ts:932-948` (coordenação ativa convida e outra pessoa aceita com a equipe mudando em volta) e `:950-980` (rebaixada a `assessoria`, mantém os convites de `assessoria` e `leitura`; o de `coordenacao` volta a valer quando ela volta à coordenação).

**Dados que já existem**: com todas as migrations menos a última aplicadas e dados semeados (mandato com coordenação, assessoria e leitura; convite de `coordenacao` de uma coordenação ativa; convite de `coordenacao` gravado por um `leitura`; convite com `criado_por` nulo; convite de quem não é do mandato), `20261106140000_convites_autoridade.sql` aplicou sem erro e reaplicou sem erro. Depois dela, o convite da coordenação ativa foi aceito e os outros três responderam `invalido`. A migration só troca o corpo de quatro funções e cria uma; comparando os corpos com os de `20261106120000_convites_equipe.sql`, a única mudança é a condição `private.convite_autorizado` (e comentários). Grants e revokes são os mesmos.

---

## Critérios de aceite ancorados na spec

Legenda: ✅ o teste afirma o resultado definido pela spec · ❌ lacuna (sem evidência ou comportamento violado) · ⚠️ lacuna de precisão da spec ou teste que espelha a implementação.

### ACE-01: Criar um convite por link pessoal

| Critério | Resultado definido pela spec | Evidência (`arquivo:linha`, asserção) | Resultado |
| -------- | ---------------------------- | ------------------------------------- | --------- |
| 01.1 Gerar mostra link, validade e 3 botões | link completo, validade e os três botões | `plataforma/e2e/mandato-equipe.spec.ts:51-55`; `plataforma/tests/sql-convites.test.ts:225` chaves `['expira_em','id','token']` | ✅ |
| 01.2 Token no servidor, 128 bits, só o hash | só `sha256` gravado; 128 bits criptográficos | `plataforma/tests/sql-convites.test.ts:243`, `:253`, `:126-127`, `:133`, `:143` | ✅ |
| 01.3 Link uma vez, nunca em listagens | listagem sem token, hash nem e-mail | `plataforma/tests/sql-convites.test.ts:429-433`; `plataforma/e2e/mandato-equipe.spec.ts:242-244`; sonda N-4 | ✅ |
| 01.4 Validade de 7 dias | `expira_em - criado_em = 7 dias` | `plataforma/tests/sql-convites.test.ts:231-236` | ✅ |
| 01.5 E-mail normalizado | minúsculas, sem espaços nas pontas | `plataforma/tests/sql-convites.test.ts:261-262` | ✅ |
| 01.6 Papel maior recusado | mensagem exata e nenhum convite | `plataforma/tests/sql-convites.test.ts:267-271`; `plataforma/e2e/mandato-equipe.spec.ts:150-151`; agora conferido também no uso (ACE-02.16) | ✅ |
| 01.7 Nome vazio ou >80 | "Informe um nome de até 80 caracteres." | `plataforma/tests/sql-convites.test.ts:291-295`; `plataforma/e2e/mandato-equipe.spec.ts:113-128` | ✅ |
| 01.8 E-mail inválido ou >254 | "E-mail inválido." | `plataforma/tests/sql-convites.test.ts:302-307`; `plataforma/e2e/mandato-equipe.spec.ts:137-140` | ✅ |
| 01.9 21º pendente | mensagem exata; 20º passa; convites que já não valem não contam | `plataforma/tests/sql-convites.test.ts:317-325`; `:988-991` (20 convites sem autoridade não impedem o 21º) | ✅ (mutante A07 sobrevive: o teste usa 10 convites de quem segue membro, abaixo do limite) |
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
| 02.12 Dois aceites simultâneos | exatamente um conclui | `plataforma/tests/sql-convites.test.ts:767` (sequencial); `:775-778` regex `for update` | ⚠️ simultaneidade não reproduzível no PGlite |
| 02.13 Já é membro | mantém o papel, "Você já está neste mandato", não consome | `plataforma/tests/sql-convites.test.ts:785-791`; `plataforma/e2e/convite-aceite.spec.ts:57` | ✅ (⚠️ quando 02.16 também vale, o banco responde `invalido`: sonda N-9) |
| 02.14 Mais de 10 inválidos em 10 min | bloqueio de 15 min | `plataforma/tests/sql-convites.test.ts:611-613`, `:628-632`, `:641-642`; `plataforma/e2e/convite-aceite.spec.ts:117`, `:126` | ✅ com ⚠️ "mesma origem" = 1º IP de `x-forwarded-for`, forjável |
| 02.15 Falha ao criar conta | motivo; convite não consumido | `plataforma/e2e/convite-conta.spec.ts:114-118`, `:130-133` | ✅ |
| **02.16** Quem criou não é mais membro ou tem papel menor | prévia e aceite como no 02.10 (`{ok:false, erro:'invalido'}`, tentativa gravada) e convite não consumido | rebaixada: `plataforma/tests/sql-convites.test.ts:879`, `:965`, `:969`; removida: `:902`, `:904`, `:905` `tentativas() === ['1.2.3.4','1.2.3.4']`, `:907` `NAO_USADO`; conta apagada: `:993`; volta a valer: `:975`; coordenação ativa: `:941-944` | ✅ no comportamento; ❌ discriminação: o filtro de mandato da guarda não tem teste (mutante A01 sobrevive; a sonda N-1 mostra a volta pela coordenação de outro mandato) |

### ACE-03: Papéis do mandato aplicados no banco

| Critério | Resultado definido pela spec | Evidência | Resultado |
| -------- | ---------------------------- | --------- | --------- |
| 03.1 Só três papéis | check em `membros.papel` | `plataforma/tests/sql-papeis.test.ts:54-65` | ✅ |
| 03.2 `leitura` não escreve | nenhuma escrita nos dados e nos membros | `plataforma/tests/sql-papeis.test.ts:76-78`, `:83`; `plataforma/tests/sql-membros.test.ts:485`, `:490`, `:498`; `plataforma/tests/sql-convites.test.ts:927`; sonda N-5 | ✅ (⚠️ S-4 telemetria, inalterado) |
| 03.3 Guia oculta ou desabilita | controles travados | `plataforma/tests/legado-acesso.test.ts:204-205`, `:228`; `plataforma/e2e/guia-acesso.spec.ts:169-170`, `:176-180`, `:194-199`, `:218` | ✅ |
| 03.4 Troca vale na chamada seguinte | papel lido a cada chamada | `plataforma/tests/sql-membros.test.ts:73-82`; `plataforma/tests/sql-papeis.test.ts:135-137`; `plataforma/tests/sql-convites.test.ts:975` | ✅ |
| 03.5 Remover tira do mandato e mantém a conta | sai de `membros`; a conta fica; não volta sozinha | `plataforma/tests/sql-membros.test.ts:177-183`, `:413`, `:417`, `:431`; `plataforma/tests/sql-convites.test.ts:904-908` (V-1b fechada) | ✅ |
| 03.6 Só a coordenação troca papel ou remove | erro de permissão e nada muda | `plataforma/tests/sql-membros.test.ts:88-92`, `:98-102`, `:188-193`, `:380`, `:384`; `plataforma/tests/sql-convites.test.ts:885-886` (V-1 fechada) | ✅ |
| 03.7 Última coordenação | mensagem exata e nada muda | `plataforma/tests/sql-membros.test.ts:108-111`, `:208-210`, `:271-273` | ✅ com ⚠️ `excluir_meus_dados()` (V-5) |
| 03.8 Rebaixamentos simultâneos | uma conclui, a outra é recusada | `plataforma/tests/sql-membros.test.ts:119-130`; `:136-139` | ⚠️ simultaneidade não reproduzível |
| 03.9 Sair por conta própria | sai, respeitando a coordenação | `plataforma/tests/sql-membros.test.ts:258-266` | ✅ |
| 03.10 Equipe Legisla intacta | `equipe_legisla` e `/admin` não mudam | `plataforma/tests/sql-membros.test.ts:102`, `:203`, `:498` | ✅ |
| 03.11 `leitura` convida só `leitura` e cancela só os próprios | — | `plataforma/tests/sql-convites.test.ts:269`, `:283-286`, `:466`, `:491`; sonda N-3 | ✅ |
| **03.12** Rebaixada, removida ou que saiu não volta ao papel antigo por convite que criou, com a própria conta ou outra | recusado pelo 02.16 e nada muda | própria conta: `plataforma/tests/sql-convites.test.ts:879`, `:883`, `:904`, `:925`; outra conta: `:921`, `:969`; estado final: `:886`, `:906`, `:928`; sondas N-2, N-6, N-8 | ✅ no comportamento; ❌ discriminação (mutante A01, como em 02.16) |

### ACE-04: Tela Equipe e convites

| Critério | Evidência | Resultado |
| -------- | --------- | --------- |
| 04.1 Ordem da tela | `plataforma/e2e/mandato-equipe.spec.ts:529-532` | ✅ |
| 04.2 Só pendentes válidos (agora também pelo 02.16), com nome, papel, quem convidou e dias | `plataforma/tests/sql-convites.test.ts:398-401`, `:897` e `:908` (some ao remover quem criou), `:962` (rebaixada perde só o de coordenação), `:988`; `plataforma/e2e/mandato-equipe.spec.ts:303-306` | ✅ |
| 04.3 Cancelar remove da lista | `plataforma/e2e/mandato-equipe.spec.ts:328-333`; `plataforma/tests/sql-convites.test.ts:466` | ✅ |
| 04.4 Criador ou coordenação cancela | `plataforma/tests/sql-convites.test.ts:466-469`, `:478-479` | ✅ (⚠️ "só quem ainda é membro" de `spec.md:63` sem teste: mutante R-X01) |
| 04.5 Outros recebem erro de permissão | `plataforma/tests/sql-convites.test.ts:488-492`; `plataforma/e2e/mandato-equipe.spec.ts:349-350` | ✅ |
| 04.6 a 04.13 | sem mudança desde a iteração 2: `plataforma/e2e/mandato-equipe.spec.ts:423-429`, `:437-442`, `:449-453`, `:93`, `:463-466`, `:502-506`, `:364`, `:523`, `:270-271`, `:551-552`; `plataforma/tests/sql-membros.test.ts:332-336` | ✅ |

### ACE-05: Área do mandato

Sem mudança desde a iteração 2 (nenhum arquivo de tela ou lib no diff). Evidência: `plataforma/e2e/mandato-area.spec.ts:30-31`, `:63`, `:97-107`, `:136-138`, `:145-146`, `:182`, `:258-260`; `plataforma/e2e/mandato-casca.spec.ts:59`, `:85-89`, `:134-136`; `plataforma/tests/convites-dias.test.ts`, `plataforma/tests/convites-missoes.test.ts`, `plataforma/tests/convites-api.test.ts:204`. ✅ (T12 aceito como equivalente.)

### ACE-06: Histórico da equipe

Sem mudança no código do histórico. Evidência: `plataforma/tests/sql-convites.test.ts:359-362`, `:513-516`, `:828-831`; `plataforma/tests/sql-membros.test.ts:147-150`, `:232-235`, `:297-300`; `plataforma/tests/sql-eventos-equipe.test.ts:58-62`, `:73-78`; aceite recusado pelo 02.16 não grava `convite_aceito` (`plataforma/tests/sql-convites.test.ts:888`, `:909`). ✅

### ACE-07: Retirar o código de convite antigo

| Critério | Evidência | Resultado |
| -------- | --------- | --------- |
| 07.1 `entrar_com_codigo` sem execução | `plataforma/tests/sql-convites.test.ts:1001` `rejects(..., NEGADO)` e `:1006-1007` `has_function_privilege` falso para `anon` e `authenticated` | ✅ |
| 07.2 Guia sem campo, botão nem mensagem | `plataforma/e2e/guia-acesso.spec.ts:118`, `:123-126`, `:134-137`; `plataforma/tests/legado-acesso.test.ts:125`, `:161` | ✅ |
| 07.3 Cadastro novo cria `coordenacao` | `plataforma/tests/legado-acesso.test.ts:176`; `plataforma/tests/sql-membros.test.ts:452` (`assessoria` e `leitura` recusadas na primeira linha), `:456` e `:470` (outra conta recusada, B08), `:459`, `:461`; `plataforma/e2e/guia-acesso.spec.ts:159` | ✅ |
| 07.4 "link de convite" no aviso | `plataforma/tests/legado-acesso.test.ts:264`, `:268`, `:272`, `:276` | ✅ |
| 07.5 `mandatos.codigo` interno | `plataforma/e2e/guia-acesso.spec.ts:135` | ✅ |

**Status**: comportamento sem violação provada por sonda. ❌ Discriminação: ACE-02.16 e ACE-03.12 (A01). ⚠️ Lacunas de precisão: 02.12, 02.14, 03.7 (V-5), 03.8, a ordem entre 02.13 e 02.16, a corrida aceite × troca de papel, S-4 e a borda "orientar a promover".

---

## Sensor de discriminação

**Profundidade**: P0 (auth e permissões): 19 mutações na migration nova, que cobrem cada condição de `convite_autorizado` e os quatro pontos de uso, e 10 na reamostra das anteriores. Cada mutante rodou contra `tests/sql-convites`, `sql-membros`, `sql-papeis`, `sql-eventos-equipe`, `sql-ambiente` e `sql-admin-mandatos` (148 testes). Os três sobreviventes rodaram de novo contra a suíte inteira (`npm test`, 965) e contra a sonda que mostra a diferença.
**Isolamento**: worktrees temporários de `HEAD` com `node_modules` por junção. Um arquivo mutado por vez, restaurado após cada execução, e o harness confere o hash do conteúdo.

### Migration nova (`plataforma/supabase/migrations/20261106140000_convites_autoridade.sql`)

| # | Mutação | Morto? |
| - | ------- | ------ |
| A01 | `convite_autorizado`: sem `b.mandato_id = p_mandato` (`:25`), ou seja, o papel em qualquer mandato vale | ❌ **sobreviveu** (965/965). **Não equivalente**: com A01, a sonda N-1 dá `aceitar → {ok:true, ja_membro:true}`, prévia `ok:true` e, depois de sair, `aceitar → {ok:true, ja_membro:false}`, e a pessoa volta como `coordenacao` |
| A02 | `convite_autorizado`: sem `b.user_id = p_criado_por` | ✅ (5 falhas) |
| A03 | `>=` vira `>` (`:26`) | ✅ (8) |
| A04 | sem a comparação de nível (basta ser membro) | ✅ (4) |
| A05 | `criado_por` nulo passa a valer | ✅ (1) |
| A19 | níveis trocados na comparação | ✅ (23) |
| A20 | confere o papel de quem chama, não o de quem criou | ✅ (21) |
| A18 | `execute` de `convite_autorizado` liberado a `authenticated` (`:29`) | ✅ (1) |
| A06 | `convite_criar`: limite volta a contar convites sem autoridade (`:58`) | ✅ (1) |
| A07 | `convite_criar`: limite confere só se quem criou é membro (`'leitura'` no lugar de `c.papel`, `:58`) | ❌ **sobreviveu** (965/965). **Não equivalente**: com A07, a sonda N-11 (20 convites de `coordenacao` de quem foi rebaixada e segue no mandato) recusa o convite da nova coordenação com "Este mandato já tem 20 convites pendentes", e a lista de pendentes está vazia, então não há o que cancelar |
| A08 | `convites_pendentes`: sem o filtro (`:93`) | ✅ (3) |
| A09 | `convites_pendentes`: confere só se é membro | ✅ (2) |
| A10 | `convite_previa`: sem o filtro (`:115`) | ✅ (3) |
| A11 | `convite_previa`: confere só se é membro | ✅ (2) |
| A14 | `convite_aceitar`: sem a conferência (`:148`) | ✅ (4) |
| A15 | `convite_aceitar`: conferência depois de "já é membro" | ✅ (1) |
| A16 | `convite_aceitar`: alternativa mínima (recusa só quando `auth.uid() = criado_por`) | ✅ (3) |
| A17 | `convite_aceitar`: confere só se é membro | ✅ (3) |
| A13 | `convite_aceitar`: recusa por autoridade sem gravar a tentativa | ✅ (1) |

### Reamostra das iterações anteriores

| # | Mutação | Morto? |
| - | ------- | ------ |
| R-S02 | convite reutilizável (não marca `usado_em`) | ✅ |
| R-S12 | e-mail vinculado ignorado no aceite | ✅ |
| R-S13 | hierarquia removida em `convite_criar` | ✅ |
| R-S08 | `leitura` passa a editar (`pode_editar`) | ✅ |
| R-X01 | `convite_cancelar`: sem `v_papel is null` (`20261106120000_convites_equipe.sql:373`), ou seja, quem já saiu cancela o convite que criou | ❌ **sobreviveu** (965/965). **Não equivalente**: com R-X01, a sonda N-3b (removida cancela o próprio convite) é aceita e grava `convite_cancelado` no histórico do mandato em nome de quem já não é membro. Contraria `spec.md:63`. Guarda da iteração 1 que nunca teve teste próprio |
| R-B01 | gatilho de `criado_por` desligado | ✅ |
| R-B05 | `membros_criar` com qualquer papel | ✅ |
| R-B06 | `membros_criar` sem exigir mandato vazio | ✅ (era sobrevivente; morto por `plataforma/tests/sql-membros.test.ts:431`) |
| R-B08 | `membros_criar` sem `user_id = auth.uid()` | ✅ (era sobrevivente; morto por `plataforma/tests/sql-membros.test.ts:470`) |
| R-B12 | `excluir_mandato`: qualquer membro exclui | ✅ |

**Resultado do sensor**: 29 mutantes, 26 mortos e 3 sobreviventes, todos não equivalentes. A01 está na guarda de segurança nova e é o motivo do FAIL. R-X01 está numa guarda de autorização antiga, de efeito baixo. A07 está no limite anti-abuso e não reprova sozinho. B06 e B08 morreram.

---

## Qualidade do código (correções)

| Princípio | Status |
| --------- | ------ |
| Código mínimo: uma função nova de 4 linhas e a mesma condição nos quatro pontos; os corpos repetidos diferem dos originais só nessa condição (diff conferido) | ✅ |
| Mudanças cirúrgicas: nenhuma tela, lib ou e2e alterado; grants e revokes iguais aos originais | ✅ |
| Segue os padrões: `security definer` com `search_path` vazio, `execute` revogado de `public`, `anon` e `authenticated` (morto A18), idempotente (reaplicada sem erro) | ✅ |
| Asserções no resultado da spec: `deepEqual(..., INVALIDO)`, `NAO_USADO`, tentativas gravadas, estado final de `membros`, histórico | ✅ |
| Integridade dos testes: 957 → 965 (+6 em `sql-convites.test.ts`, +2 em `sql-membros.test.ts`); nenhuma asserção removida ou enfraquecida | ✅ |
| Decisão registrada: AD-011 (a confirmar), ACE-02.16, ACE-03.12 e a linha de premissa na spec | ✅ |
| Cada condição de uma guarda nova isolada por teste (lições L-019 e L-027) | ❌ A01 (filtro de mandato) e A07 (limite com quem criou ainda membro) |

---

## Bordas da spec

- [x] Mesmo e-mail convidado duas vezes; convite aberto em outro aparelho; página fechada no meio do Google; sessão vencida durante o aceite; conta com outro e-mail (sem mudança).
- [x] Convite de quem perdeu o papel (linha nova da spec): recusado na prévia e no aceite, fora dos pendentes e do limite, e volta a valer com o papel de volta (sondas N-1 a N-11; testes em `plataforma/tests/sql-convites.test.ts:870-994`).
- [ ] Última coordenação tenta sair: o banco recusa, mas nada "orienta a promover outra pessoa antes", e não há botão "Sair do mandato" na tela. ⚠️ inalterado.

---

## Gate

- **Comandos**: `npx tsc --noEmit`, `npm test` e `npx playwright test e2e/convite-*.spec.ts e2e/mandato-*.spec.ts e2e/guia-acesso.spec.ts --timeout=120000` (em `plataforma/`), num worktree limpo de `HEAD`. Para o e2e, uma config temporária só no worktree, com `next dev --webpack -p 3300` e `reuseExistingServer: false` (a 3000 é do usuário).
- **`npx tsc --noEmit`**: 0 erros (exit 0).
- **`npm test`**: 965 passaram, 0 falharam, 0 pulados.
- **e2e**: 137 de 137 (8,6 min). Na primeira rodada o `next dev` parou para mostrar o aviso de vulnerabilidade conhecida do Next 16.4 e o servidor não subiu. A segunda, com o mesmo comando, passou inteira. Nenhum upgrade foi feito; o aviso recomenda atualizar o Next, decisão do usuário.
- **Antes e depois**: 725 testes de unidade e SQL na base da feature (`ac19a35`), 949 na iteração 1, 957 na 2, 965 agora.

---

## Planos de correção

### Correção 9 (Alta): A01, filtro de mandato de `convite_autorizado` sem teste (ACE-02.16, ACE-03.12)

- **Causa**: nos testes, nenhuma pessoa que criou um convite tem papel em outro mandato. Tirar `b.mandato_id = p_mandato` não muda nenhum resultado.
- **Tarefa**: em `plataforma/tests/sql-convites.test.ts`, repetir V-1 com quem criou o convite também `coordenacao` do mandato B (o dono inclui a linha em `membros` do B). Rebaixada a `leitura` no A: aceite `INVALIDO`. Depois de sair do A: prévia e aceite `INVALIDO`, e papéis do A inalterados.
- **Verificar**: A01 morre; o código não muda.

### Correção 10 (Média): R-X01, quem já saiu cancela o convite que criou (`spec.md:63`, ACE-04.4)

- **Tarefa**: em `plataforma/tests/sql-convites.test.ts`, quem criou um convite é removido (ou sai) e chama `convite_cancelar` no próprio convite: esperar `SEM_PERMISSAO`, o convite não cancelado e nenhuma linha `convite_cancelado` no histórico.
- **Verificar**: R-X01 morre.

### Correção 11 (Baixa): A07, limite de 20 com convites de quem segue membro com papel menor (ACE-01.9, AD-011)

- **Tarefa**: no teste de `:982`, trocar ou somar o cenário da sonda N-11: 20 convites de `coordenacao` criados por quem foi rebaixada a `leitura` e segue no mandato; a nova coordenação ainda cria um convite.
- **Verificar**: A07 morre.

### Decisões que pedem o dono do produto (não reprovam sozinhas)

1. **AD-011**: confirmar que o convite de quem saiu, foi removido ou foi rebaixado abaixo do papel do convite deixa de valer e volta a valer se a pessoa recuperar o papel. Hoje esse convite some da lista e a coordenação não consegue cancelá-lo pela tela. Pela N-10, ao readmitir alguém, os convites antigos dessa pessoa voltam e podem passar de 20 pendentes.
2. **Ordem entre 02.13 e 02.16** (N-9): quem já é membro e abre um convite que perdeu a autoridade recebe "convite não vale mais", não "Você já está neste mandato". Nada muda nos dois casos; falta dizer na spec qual resposta vale.
3. Definir "mesma origem" (ACE-02.14, `x-forwarded-for` forjável).
4. Dizer se `excluir_meus_dados()` conta como a própria saída (ACE-03.7). Se a resposta for recusar a última coordenação, V-5 também fecha.
5. Dizer se a telemetria `uso_funcionalidades` entra em "dados do mandato" (S-4).
6. Aceitar que ACE-02.12, ACE-03.8 e a corrida entre aceite e troca de papel só têm prova estrutural e sequencial.
7. Borda "orientar a promover outra pessoa antes" e a falta de um botão "Sair do mandato".

---

## Rastreabilidade (sugestão para `spec.md`, não aplicada pelo Verifier)

| Requisito | Antes | Novo status |
| --------- | ----- | ----------- |
| ACE-01 | Pending | ✅ Verified (A07 a fortalecer) |
| ACE-02 | Pending | ❌ Needs Fix: teste de 02.16 (A01); ⚠️ 02.12, 02.13 × 02.16, 02.14 |
| ACE-03 | Pending | ❌ Needs Fix: teste de 03.12 (A01); 03.2, 03.5 e 03.6 fechados; ⚠️ 03.7, 03.8 |
| ACE-04 | Pending | ✅ Verified (R-X01 a fortalecer) |
| ACE-05 | Pending | ✅ Verified |
| ACE-06 | Pending | ✅ Verified |
| ACE-07 | Pending | ✅ Verified |

---

## Resumo

**Geral**: ❌ Não pronto, só pela discriminação dos testes. Nenhuma sonda achou violação no código de `HEAD`.

**Verificação ancorada na spec**: 73 critérios (71 + ACE-02.16 e ACE-03.12). Todos têm evidência no resultado da spec. Os dois novos ficam ❌ porque a guarda que os garante tem uma condição sem teste (A01). 02.12 e 03.8 só têm prova estrutural e sequencial.
**Sensor**: 26 de 29 mortos. Sobreviveram A01 (guarda de segurança nova), R-X01 (guarda de autorização antiga, efeito baixo) e A07 (limite). B06 e B08 morreram.
**Gate**: tsc 0 erros; 965/965 unidade e SQL; 137/137 e2e.
**Porcelain**: a árvore real terminou idêntica à linha de base (115 linhas).

**O que funciona**: V-1, V-1b e V-1c estão fechadas. O convite só vale com a autoridade atual de quem o criou, conferida na prévia, no aceite, na lista e no limite. Segunda conta, conta apagada, readmissão com papel menor, cancelamento por quem perdeu o papel, leitura sem escrita e `convites_pendentes` sem token nem e-mail foram todos recusados ou se comportaram como a spec pede. O fluxo legítimo segue de pé, e a migration aplica e reaplica sobre dados antigos.

**Próximo passo**: esta foi a iteração 3 de 3; levar ao usuário. As correções 9 a 11 são só testes (nenhuma mudança de código), mais as decisões de produto acima, sobretudo AD-011. Depois de aplicadas, uma nova verificação com o go-ahead do usuário.
