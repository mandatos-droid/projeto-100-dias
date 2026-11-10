# Primeiro Acesso e Login só com Google Validation

**Date**: 2026-11-10
**Spec**: `.specs/features/primeiro-acesso-google/spec.md`
**Diff range**: `246f853..8609ccc` (branch `feat/primeiro-acesso-google`, T1 a T16 mais 2 commits de docs)
**Verifier**: sub-agente independente (autor ≠ verificador)

## Validation: primeiro-acesso-google - FAIL ❌

Uma falha de critério (PAG-02.1 no caminho do convite) e uma brecha na trava do banco. O resto da feature está coberto com evidência e o sensor matou 14 de 14 mutantes.

---

## Task Completion

| Task | Status | Notas |
| ---- | ------ | ----- |
| T1 a T16 | ✅ Done (marcadas em `tasks.md`, um commit cada) | `lib/legacyBody.ts` não foi editado (T13 listava no Where); a remoção dos campos ficou toda em `public/legacy/acesso.js`, que carrega antes de `iniciar.js` (`app/guia/page.tsx:9`). Ver ponto 5 abaixo |
| Rastreabilidade em `spec.md` | ⚠️ Desatualizada | A tabela "Requirement Traceability" (`spec.md:226-231`) ainda diz Pending / In progress; atualizar ao fechar a feature |

---

## Gate Check

- **Unidade e SQL**: `npm test` em `plataforma/`, 3 rodadas seguidas: 1098/1098, 1098/1098, 1098/1098 (0 falhas, 0 pulados).
- **e2e** (worktree de scratch em HEAD, servidor próprio `next dev --webpack -p 3100`): `primeiro-acesso`, `convite-perfil`, `mandato-perfil`, `guia-acesso`, `admin-analytics-perfil`, `convite-conta`, `admin-acesso`: 112/112 passaram (4,3 min).
- **Contagem**: 981 antes da feature (`tasks.md` T1) → 1098 depois (+117 testes de unidade/SQL); e2e em 4 specs novos e 3 ajustados. Nenhum teste removido sem substituto (os de senha saíram junto com o comportamento, T11, T12).
- **Flakiness**: a rodada "981 testes e 5 falhas" do worker 3 não se repetiu em 3 rodadas completas nem nas rodadas parciais do sensor. 981 é exatamente a contagem anterior à T1, então aquela rodada provavelmente correu sobre outra cópia da árvore (sem os commits da feature), não sobre esta branch. Nenhum teste instável identificado.

---

## Spec-Anchored Acceptance Criteria

Legenda: ✅ PASS · ❌ GAP · ⚠️ Spec-precision gap. Caminhos relativos a `plataforma/`.

### PAG-01 Entrar só com Google

| AC | Resultado definido pela spec | Código | Teste + asserção | Resultado |
| -- | ---------------------------- | ------ | ---------------- | --------- |
| 01.1 | Só "Entrar com Google" no convite, no Guia e no `/admin` | `app/convite/FormularioConta.tsx:67-79`; `public/legacy/acesso.js:33-42`; `app/admin/_componentes/Sessao.tsx` (sem formulário de senha); `app/primeiro-acesso/PrimeiroAcesso.tsx:175-195` | `e2e/convite-conta.spec.ts:46`; `e2e/guia-acesso.spec.ts:287` (`SO_GOOGLE`: 1 botão, 0 `input`, 0 abas); `e2e/admin-acesso.spec.ts:33`; `e2e/primeiro-acesso.spec.ts:50` | ✅ |
| 01.2 | Sem senha, "Criar conta" ou "Entrar com e-mail" | idem; Guia remove `.abas,.campo,#wrapLgpd,.bts,#btComEmail` em `acesso.js:41-42` antes de `App.iniciar` (`app/guia/page.tsx:9`, `acesso` antes de `iniciar`); `#entrada` nasce com `oculto` | `e2e/guia-acesso.spec.ts:276-284` (`innerText` sem "criar conta", "senha"); `e2e/convite-conta.spec.ts:46`; `e2e/admin-acesso.spec.ts:33,98` | ✅ |
| 01.3 | Volta do Google grava `legisla.tok` e segue o fluxo da entrada | `PrimeiroAcesso.tsx:104-108`; `app/convite/Convite.tsx:160-166` | `e2e/primeiro-acesso.spec.ts:67` (`legisla.tok` igual ao token; URL limpa; `?volta=guia` mantido); `e2e/convite-conta.spec.ts:73`; `e2e/admin-acesso.spec.ts:81` | ✅ |
| 01.4 | "Não foi possível entrar com o Google. Tente de novo." e botão mantido | `PrimeiroAcesso.tsx:17,106`; `Convite.tsx:32,164`; `acesso.js:31,43-47` | `e2e/primeiro-acesso.spec.ts:76`; `e2e/convite-conta.spec.ts:105`; `e2e/admin-acesso.spec.ts:89`; `e2e/guia-acesso.spec.ts:324` (`toHaveText` literal); `tests/legado-acesso.test.ts:390` | ✅ |
| 01.5 | Link do convite guardado e concluído na volta | `FormularioConta.tsx:69`; `Convite.tsx:160-166` | `e2e/convite-conta.spec.ts:73` | ✅ |
| 01.6 | Nenhuma funcionalidade envia e-mail | Único gatilho de e-mail era o cadastro com senha (`signup`), sem caminho: `acesso.js:35` | `tests/legado-acesso.test.ts:418` (nenhum `signup` em `app/`, `lib/`, `acesso.js`); `e2e/guia-acesso.spec.ts:311`; `e2e/convite-conta.spec.ts:41-42` | ✅ |

### PAG-02 Cadastro de perfil no primeiro acesso

| AC | Resultado definido pela spec | Código | Teste + asserção | Resultado |
| -- | ---------------------------- | ------ | ---------------- | --------- |
| 02.1 | Sem perfil (fora da Legisla) → formulário **antes de qualquer outra tela** do Guia, da Área do mandato ou do aceite de convite | Guia `acesso.js:56-64`; `/mandato` `app/mandato/Casca.tsx:57-60`; convite `Convite.tsx:129-134` | `tests/legado-acesso.test.ts:316`; `e2e/guia-acesso.spec.ts:343`; `e2e/mandato-perfil.spec.ts:25`; `e2e/convite-perfil.spec.ts:28,36` | ❌ **GAP-1**: no convite, conta Google nova (sem consentimento e sem perfil) vê antes a etapa de consentimento do aceite. `convite_aceitar` checa consentimento antes de perfil (`supabase/migrations/20261109120000_perfis.sql:157-162`, confirmado por `tests/sql-perfil-trava.test.ts:101`: o primeiro aceite devolve `consentimento`), e `Convite.tsx:135` desenha a tela "Entrar no mandato" com aviso e caixa da LGPD. Só depois de aceitar essa caixa o aceite devolve `perfil` e a pessoa vai ao formulário, que pede o mesmo aviso e a mesma caixa de novo. Os e2e mocam `perfil` direto e não cobrem a ordem real |
| 02.2 | Sem perfil, impedir Guia, Área do mandato e aceite | UI: as três entradas acima; banco: `perfis.sql:122-125` (`mandatos_criar`), `perfis.sql:160-162` (`convite_aceitar`) | `tests/sql-perfil-trava.test.ts:74` (`{ok:false, erro:'perfil'}`, convite não consumido), `:122` (RLS 42501); `tests/legado-acesso.test.ts:370` | ✅ na UI. ❌ **GAP-2** (banco): ver Sondas |
| 02.3 | 7 campos | `PrimeiroAcesso.tsx:248-278` | `e2e/primeiro-acesso.spec.ts:86` | ✅ |
| 02.4 | "Sim" pede o tempo nas 5 faixas | `PrimeiroAcesso.tsx:272-278`; `lib/perfil/opcoes.ts:26-35` | `e2e/primeiro-acesso.spec.ts:102` (opções literais); `tests/perfil-validacao.test.ts:42,85,179` | ✅ |
| 02.5 | "Não" grava `Não atuo na política` sem tempo | `lib/perfil/validacao.ts:70` | `e2e/primeiro-acesso.spec.ts:194` (`p_atua:false, p_tempo:null`); `tests/perfil-validacao.test.ts:171`; `tests/sql-perfil.test.ts:202` | ✅ |
| 02.6 | 8 gêneros e 6 raças com os rótulos da spec | `opcoes.ts:5-23` | `e2e/primeiro-acesso.spec.ts:95-96` (listas literais); `tests/perfil-validacao.test.ts:27,35`; `tests/sql-perfil.test.ts:187` | ✅ |
| 02.7 | Nome do Google preenchido e editável | `PrimeiroAcesso.tsx:44-56,122,204` | `e2e/primeiro-acesso.spec.ts:112` | ✅ |
| 02.8 | Vazio ou caixa desmarcada → recusa, destaque, "Preencha todos os campos e aceite o tratamento dos dados para continuar." | `validacao.ts:6,55-61` | `tests/perfil-validacao.test.ts:61-99`; `e2e/primeiro-acesso.spec.ts:126,135,145` (cada caixa isolada com os outros guardas satisfeitos) | ✅ |
| 02.9 | "Informe seu nome completo." | `validacao.ts:63-64`; `perfis.sql:69-71` | `tests/perfil-validacao.test.ts:106,110`; `e2e/primeiro-acesso.spec.ts:155`; `tests/sql-perfil.test.ts:140` | ✅ |
| 02.10 | "Informe uma data de nascimento válida." | `validacao.ts:35-43,65`; `perfis.sql:72-82` | `tests/perfil-validacao.test.ts:121-143`; `e2e/primeiro-acesso.spec.ts:165`; `tests/sql-perfil.test.ts:150` | ✅ |
| 02.11 | "Informe um telefone com DDD." (DDD 11 a 99 + 8 ou 9 dígitos) | `validacao.ts:29,66-68`; `perfis.sql:89-91` | `tests/perfil-validacao.test.ts:150-163`; `e2e/primeiro-acesso.spec.ts:174`; `tests/sql-perfil.test.ts:165` | ✅ |
| 02.12 | Grava perfil e consentimento com a versão do perfil e segue | `perfis.sql:100-108`; `PrimeiroAcesso.tsx:137-144` | `tests/sql-perfil.test.ts:104,113` (`['2026-11']`), `:118` (desfaz junto); `e2e/primeiro-acesso.spec.ts:185` | ✅ |
| 02.13 | Falha mantém os dados e mostra "Não foi possível salvar. Tente de novo." | `lib/perfil/api.ts:30-33`; `PrimeiroAcesso.tsx:232-236` | `e2e/primeiro-acesso.spec.ts:202,213,221`; `tests/perfil-api.test.ts:90,96` | ✅ |
| 02.14 | Duplo envio → um único perfil | `perfis.sql:100-103` (`on conflict do nothing`); `PrimeiroAcesso.tsx:224` | `tests/sql-perfil.test.ts:130`; `e2e/primeiro-acesso.spec.ts:255` | ✅ |
| 02.15 | Com perfil, sem formulário | `lib/perfil/fluxo.ts:14-15` | `e2e/primeiro-acesso.spec.ts:265`; `tests/legado-acesso.test.ts:334`; `e2e/guia-acesso.spec.ts:349` | ✅ |
| 02.16 | `equipe_legisla` sem formulário nem bloqueio | `fluxo.ts:13`; `perfis.sql:45`; `acesso.js:62`; `Casca.tsx:57` | `tests/perfil-fluxo.test.ts:19`; `tests/sql-perfil.test.ts:255`; `tests/sql-perfil-trava.test.ts:111,145`; `e2e/primeiro-acesso.spec.ts:273`; `e2e/mandato-perfil.spec.ts:37`; `e2e/guia-acesso.spec.ts:357` | ✅ |

### PAG-03 Perfil protegido no banco

| AC | Resultado definido pela spec | Código | Teste + asserção | Resultado |
| -- | ---------------------------- | ------ | ---------------- | --------- |
| 03.1 | Tabela própria, `user_id` único | `perfis.sql:15-26,38-39` | `tests/sql-perfil.test.ts:75` (só `authenticated:SELECT`; `duplicate key`) | ✅ |
| 03.2 | Grava só com o `user_id` da sessão | `perfis.sql:60,100-101` | `tests/sql-perfil.test.ts:104` | ✅ |
| 03.3 | Gravar perfil de outra pessoa → erro de permissão | `perfis.sql:37-39` (sem grant de escrita) | `tests/sql-perfil.test.ts:86` (`permission denied` para insert, update, delete) | ✅ |
| 03.4 | Equipe Legisla (qualquer papel) lê todos | `perfis.sql:33-35` | `tests/sql-perfil.test.ts:246` (admin e leitura) | ✅ |
| 03.5 | Fora da Legisla, perfil de outra pessoa → zero linhas, mesmo do mesmo mandato | `perfis.sql:33-35` | `tests/sql-perfil.test.ts:238` | ✅ |
| 03.6 | Lê o próprio | `perfis.sql:35` | `tests/sql-perfil.test.ts:232` | ✅ |
| 03.7 | Valores fora da lista ou do formato → recusa | `perfis.sql:17-25,69-94` | `tests/sql-perfil.test.ts:140-185` (`{ok:false, erro:<campo>}` e nada gravado) | ✅ |
| 03.8 | Não atua com tempo, ou atua sem tempo → recusa | `perfis.sql:25,95-98` | `tests/sql-perfil.test.ts:215` | ✅ |
| 03.9 | Conta excluída apaga o perfil | `perfis.sql:16` (`on delete cascade`) | `tests/sql-perfil-trava.test.ts:184` | ✅ |
| 03.10 | "Excluir meus dados" apaga o perfil | `perfis.sql:186` | `tests/sql-perfil-trava.test.ts:153,165` | ✅ |

### PAG-04 Pergunta sobre a equipe e escolha do mandato

| AC | Resultado definido pela spec | Código | Teste + asserção | Resultado |
| -- | ---------------------------- | ------ | ---------------- | --------- |
| 04.1 | Pergunta literal com "Sim, já criou" e "Ainda não" | `PrimeiroAcesso.tsx:159-167`; `fluxo.ts:16`; `acesso.js:63` | `e2e/primeiro-acesso.spec.ts:313,321`; `tests/perfil-fluxo.test.ts:39`; `tests/legado-acesso.test.ts:356`; `e2e/guia-acesso.spec.ts:370` | ✅ |
| 04.2 | "Sim" abre as instruções | `PrimeiroAcesso.tsx:163` | `e2e/primeiro-acesso.spec.ts:331` | ✅ |
| 04.3 | 3 passos e campo de colar | `PrimeiroAcesso.tsx:307-333` | `e2e/primeiro-acesso.spec.ts:331` (3 `li` literais) | ✅ |
| 04.4 | Link válido abre `/convite` com o token | `lib/perfil/link.ts:5-10`; `PrimeiroAcesso.tsx:311-316` | `tests/perfil-fluxo.test.ts:54-66`; `e2e/primeiro-acesso.spec.ts:351,359` | ✅ |
| 04.5 | "Este não parece um link de convite. Peça a quem convidou para enviar de novo." | `PrimeiroAcesso.tsx:304,314` | `tests/perfil-fluxo.test.ts:68-88`; `e2e/primeiro-acesso.spec.ts:367,376` | ✅ |
| 04.6 | "Ainda não" abre o cadastro do mandato | `PrimeiroAcesso.tsx:91-94`; `acesso.js:61-64` | `e2e/primeiro-acesso.spec.ts:386`; `tests/legado-acesso.test.ts:363`; `e2e/guia-acesso.spec.ts:375` | ✅ |
| 04.7 | Cadastro concluído → `coordenacao` e Guia | Cadastro existente (`nucleo.js` `criarMandato`); política `perfis.sql:123-125` | `tests/sql-perfil-trava.test.ts:128` (`papel_no_mandato = coordenacao`); `tests/legado-acesso.test.ts:181`; `tests/sql-convites.test.ts:1361` | ✅ |
| 04.8 | Por convite: sem pergunta, aceite depois do perfil | `fluxo.ts:15`; `PrimeiroAcesso.tsx:64-70,78`; `Convite.tsx:155-157` | `tests/perfil-fluxo.test.ts:47`; `e2e/primeiro-acesso.spec.ts:399`; `e2e/convite-perfil.spec.ts:44,51` | ✅ (ver GAP-1 sobre a ordem consentimento/perfil) |
| 04.9 | Já em mandato: sem pergunta | `fluxo.ts:15` | `e2e/primeiro-acesso.spec.ts:414,420`; `tests/perfil-fluxo.test.ts:31,35` | ✅ |
| 04.10 | Voltar à pergunta | `PrimeiroAcesso.tsx:331` | `e2e/primeiro-acesso.spec.ts:343` | ✅ |

### PAG-05 Remoção do login por senha

| AC | Resultado definido pela spec | Código | Teste + asserção | Resultado |
| -- | ---------------------------- | ------ | ---------------- | --------- |
| 05.1 | Sem caminho para `signup` e `grant_type=password`; `nucleo.js` sem caminho por override | `acesso.js:34-39`; `lib/admin/sessao.ts` (sem `entraComSenha`); `FormularioConta.tsx` | `tests/legado-acesso.test.ts:378,384,418`; `e2e/guia-acesso.spec.ts:311`; `e2e/admin-acesso.spec.ts:109` | ✅ |
| 05.2 | Sem "Confirme o e-mail enviado e faça login"; `app/` e `lib/` sem `email_not_confirmed` | `lib/convites/erros.ts` (sai `mensagemDoLogin`) | `tests/legado-acesso.test.ts:418`; `e2e/convite-conta.spec.ts:59`; `e2e/guia-acesso.spec.ts:301,306` | ✅ |
| 05.3 | Renova pelo `refresh_token` | `lib/admin/sessao.ts:46-49`; Guia `Store.sessao` (inalterado) | `tests/legado-acesso.test.ts:397`; `e2e/guia-acesso.spec.ts:330`; `e2e/admin-acesso.spec.ts:163` | ✅ |

### PAG-06 Analytics do perfil

| AC | Resultado definido pela spec | Código | Teste + asserção | Resultado |
| -- | ---------------------------- | ------ | ---------------- | --------- |
| 06.1 | `admin` e `leitura` veem a seção | `app/admin/analytics/page.tsx:215`; `perfil_resumo.sql:20-22` | `e2e/admin-analytics-perfil.spec.ts:52,63`; `tests/sql-perfil-resumo.test.ts:145` | ✅ |
| 06.2 | Total e cadastros por mês, no máximo 12 | `perfil_resumo.sql:39-50`; `SecaoPerfil.tsx:49-59` | `tests/sql-perfil-resumo.test.ts:113,122,134`; `e2e/admin-analytics-perfil.spec.ts:52` | ✅ |
| 06.3 | Número e porcentagem inteira de cada categoria | `lib/admin/perfil.ts:31-40`; `SecaoPerfil.tsx:16` | `tests/admin-perfil.test.ts:19-59`; `e2e/admin-analytics-perfil.spec.ts:69` | ⚠️ **SP-1, SP-2** |
| 06.4 | `Prefiro não informar` como categoria própria | `perfil.ts:33-40`; `perfil_resumo.sql:51-52` | `tests/admin-perfil.test.ts:40`; `e2e/admin-analytics-perfil.spec.ts:82`; `tests/sql-perfil-resumo.test.ts:77,82` | ✅ |
| 06.5 | Faixas etárias na data da consulta | `perfil_resumo.sql:16,27-34` | `tests/sql-perfil-resumo.test.ts:92` (limites 24/25 a 64/65); `tests/admin-perfil.test.ts:46` | ✅ |
| 06.6 | Sem nome, e-mail, telefone nem nascimento | `perfil_resumo.sql:46-55`; `SecaoPerfil.tsx` | `e2e/admin-analytics-perfil.spec.ts:100` (única chamada `POST rpc/admin_perfil_resumo`; `vazou()` vazio); `tests/sql-perfil-resumo.test.ts:64` | ✅ |
| 06.7 | Função só com contagens | `perfil_resumo.sql:13-58` | `tests/sql-perfil-resumo.test.ts:64` | ✅ |
| 06.8 | Fora da Legisla → erro de permissão | `perfil_resumo.sql:20-22` | `tests/sql-perfil-resumo.test.ts:152` (42501 e texto literal) | ✅ |
| 06.9 | "Ainda não há perfis cadastrados." sem gráfico vazio | `perfil.ts:23,43`; `SecaoPerfil.tsx:46` | `tests/admin-perfil.test.ts:75`; `e2e/admin-analytics-perfil.spec.ts:109` | ✅ |
| 06.10 | "Não foi possível carregar o perfil. Tente de novo." sem afetar o resto | `SecaoPerfil.tsx:26-30,40-45` | `e2e/admin-analytics-perfil.spec.ts:115` | ✅ |
| 06.11 | Título do que mede e categoria em texto | `SecaoPerfil.tsx:9-16` | `e2e/admin-analytics-perfil.spec.ts:88,124` | ✅ |
| 06.12 | Soma das categorias = total | `perfil.ts:31-38` (chave desconhecida entra com a própria chave) | `tests/sql-perfil-resumo.test.ts:105`; `tests/admin-perfil.test.ts:61` | ✅ |

**Status**: ❌ 1 AC reprovado (PAG-02.1, caminho do convite) e 1 brecha no reforço do banco de PAG-02.2; ⚠️ 3 lacunas de precisão da spec.

---

## Edge Cases

- [x] Fecha a aba no meio do perfil: nada é guardado no navegador (`PrimeiroAcesso.tsx:204-212`) e a gravação é atômica (`tests/sql-perfil.test.ts:118`). Sem e2e de "reabrir vazio"; aceito pela leitura do código.
- [x] Convite já aceito, vencido ou cancelado depois do perfil: o aceite automático da volta cai em `invalido` e mostra a mensagem do fluxo de convites (`Convite.tsx:136-138`), coberta pelos specs `convite-*` existentes.
- [x] Perfil sem mandato e sem convite: pergunta (`e2e/primeiro-acesso.spec.ts:313`; `tests/legado-acesso.test.ts:356`).
- [x] Conta Google sem nome: nome vazio (`e2e/primeiro-acesso.spec.ts:119`).
- [x] Equipe Legisla por convite: aceita sem perfil (`tests/sql-perfil-trava.test.ts:111`).

---

## Pontos de atenção dos workers

1. **Falha na consulta de perfil no Guia**: não manda ao formulário (`acesso.js:57-60` lança antes de `location.replace`; `tests/legado-acesso.test.ts:349`, `e2e/guia-acesso.spec.ts:363`). Mas a tela fica em branco: `#entrada` e `#app` nascem com `oculto` (`lib/legacyBody.ts`), o override lança antes de `_entrou` mostrar o app, e `iniciar.js:1` chama `App.iniciar()` sem `catch`. Não há mensagem nem "Tentar de novo". O design diz "mostra o erro que já mostra"; na prática não há erro algum. **SP-3** (spec não define; UX fraca).
2. **Atalho da volta do perfil no `Convite.tsx:155-157`**: só aceita sozinho com sessão e com o token do `sessionStorage` igual ao do endereço. O token só chega ao `sessionStorage` por ação da própria pessoa na mesma aba (clicou em "Entrar com Google" no convite, `FormularioConta.tsx:69`, ou já clicou em aceitar e recebeu `perfil`, `Convite.tsx:131`). Um terceiro só planta o valor com XSS na mesma origem. O aceite continua sujeito a todas as checagens do banco (e-mail, consentimento, perfil, autoridade). Sem brecha encontrada. Coberto por `e2e/convite-perfil.spec.ts:44,51` (o mutante M14 morreu).
3. **`/primeiro-acesso?volta=convite` sem token**: cai na pergunta (ou segue, se já tem mandato). O design previa a tela de colar do `/convite`; a pergunta leva ao mesmo campo de colar com um clique a mais. Não é gap da spec.
4. **Override do Guia só com nuvem**: `NUVEM` é sempre verdadeiro em produção (`nucleo.js:9-10`: `AMBIENTES.prod` e `dev` preenchidos). O modo local não tem rede nem Google. Não é gap.
5. **`legacyBody.ts` não editado**: os campos de senha existem no HTML injetado, mas `#entrada` nasce oculto e `acesso.js` (carregado antes de `iniciar.js`) os remove antes de `App.iniciar` revelar a entrada. Não há janela em que apareçam. PAG-01.2 vale na tela real (`e2e/guia-acesso.spec.ts:287`).
6. **Flakiness**: ver Gate Check. Não reproduzida.
7. **Porcentagem por categoria**: `Math.round` por categoria; a soma pode não dar 100. Chave desconhecida vinda do banco é anexada com a chave como rótulo, o que preserva PAG-06.12; com os `check` de `perfis` ela não ocorre hoje. Ver SP-2.
8. **Trava no banco**: `entrar_com_codigo` sem execução para `authenticated` (`20261106120000_convites_equipe.sql:507`). `convite_aceitar` e `mandatos_criar` barram. `anon` não executa nenhuma função nova (`tests/sql-perfil.test.ts:265`, `tests/sql-perfil-resumo.test.ts:163`). **Brecha GAP-2** em `membros_criar` (ver Sondas). `admin_membro_adicionar` inclui conta sem perfil (sonda S2), mas é ação deliberada da equipe Legisla admin; registrado como observação.
9. **Consentimento `2026-11` satisfaz `convite_aceitar`**: coerente, porque o formulário de perfil traz o mesmo aviso e a mesma caixa geral do cadastro (`PrimeiroAcesso.tsx:280-283`) além da caixa específica. O problema é o inverso: para conta nova, o consentimento é pedido duas vezes (GAP-1).
10. **Privacidade**: `perfis_ler` só para a própria pessoa ou `eh_legisla()` (`perfis.sql:33-35`); membro do mesmo mandato lê zero linhas (`tests/sql-perfil.test.ts:238`; sonda S3 com `select *`). `perfis` não tem FK para `membros`, então não há embutimento PostgREST. A função de resumo só devolve contagens (`tests/sql-perfil-resumo.test.ts:64`). A seção faz uma única chamada, `POST rpc/admin_perfil_resumo` (`e2e/admin-analytics-perfil.spec.ts:105-106`), sem telefone nem nascimento.

---

## Sondas no banco (PGlite, só no scratch)

| Sonda | Resultado |
| ----- | --------- |
| S1: com perfil, cria o mandato e entra como coordenação; chama `excluir_meus_dados()` (apaga perfil e a linha em `membros`); depois insere a si mesma em `membros` | **Entra de novo como `coordenacao`, sem perfil.** `membros_criar` (`20261106130000_papeis_blindagem.sql:46-54`) aceita porque o mandato ficou sem membros e `criado_por` é a pessoa; a política não exige `private.tem_perfil()`. **GAP-2** |
| S2: admin da Legisla chama `admin_membro_adicionar` para conta sem perfil | Inclui. Ação deliberada da equipe; observação, não gap |
| S3: membro do mandato faz `select * from perfis` | 0 linhas |

---

## Discrimination Sensor

Worktree de scratch fora da árvore real (`git worktree add --detach`), `node_modules` por junction. Cada mutante foi aplicado, testado só com os arquivos que o cobrem e desfeito.

| # | Arquivo:linha | Mutação | Teste que matou | Resultado |
| - | ------------- | ------- | --------------- | --------- |
| M1 | `perfis.sql:160` | Trava de perfil invertida no aceite | `tests/sql-perfil-trava.test.ts:74,98,111` | ✅ Morto |
| M2 | `perfis.sql:45` | `tem_perfil` sem a dispensa da Legisla | `tests/sql-perfil.test.ts:255`; `tests/sql-perfil-trava.test.ts:111,145` | ✅ Morto |
| M3 | `perfil_resumo.sql:28` | Faixa `<= 24` → `<= 25` | `tests/sql-perfil-resumo.test.ts:92` | ✅ Morto |
| M4 | `lib/perfil/validacao.ts:29` | Telefone aceito sem DDD (`^[0-9]{8,11}$`) | `tests/perfil-validacao.test.ts:150` | ✅ Morto |
| M5 | `perfis.sql:101` | `perfil_salvar` grava com o `user_id` de outra conta | `tests/sql-perfil.test.ts:104` e mais 9 | ✅ Morto |
| M6 | `perfis.sql:186` | `excluir_meus_dados` sem `delete` em `perfis` | `tests/sql-perfil-trava.test.ts:153,165` | ✅ Morto |
| M7 | `validacao.ts:9` | Texto da recusa de telefone trocado | `tests/perfil-validacao.test.ts:20` | ✅ Morto |
| M8 | `perfil_resumo.sql:20` | Resumo sem checar `eh_legisla()` | `tests/sql-perfil-resumo.test.ts:152` | ✅ Morto |
| M9 | `lib/perfil/fluxo.ts:16` | `proximoPasso` ignora `semEquipe` | `tests/perfil-fluxo.test.ts:43` | ✅ Morto |
| M10 | `fluxo.ts:15` | `proximoPasso` ignora `veioPorConvite` | `tests/perfil-fluxo.test.ts:47` | ✅ Morto |
| M11 | `validacao.ts:58` | Formulário aceita sem a caixa dos dados sensíveis | `tests/perfil-validacao.test.ts:95` | ✅ Morto |
| M12 | `app/mandato/Casca.tsx:57` | Gate de `/mandato` passa sem perfil | `e2e/mandato-perfil.spec.ts:25,43` | ✅ Morto |
| M13 | `perfis.sql:125` | `mandatos_criar` sem `tem_perfil()` | `tests/sql-perfil-trava.test.ts:122` | ✅ Morto |
| M14 | `app/convite/Convite.tsx:157` | Aceite automático sem comparar o token guardado | `e2e/convite-perfil.spec.ts:51` (e `:28`) | ✅ Morto |

**Sensor depth**: P0 (auth e integridade de dados): 14 mutações manuais cobrindo banco, lógica pura, páginas e Guia.
**Result**: 14/14 mortos. Nenhum sobrevivente. Cada mutante caiu no teste que afirma o resultado da spec para aquele comportamento (lição L-019 respeitada: os guardas de convite, marca "Ainda não", Legisla e caixas de consentimento têm teste próprio com os outros guardas satisfeitos).
**Isolamento**: `git status --porcelain` da árvore real comparado com a linha de base capturada antes do sensor (ver Cleanup).

Os dois gaps abaixo não são de discriminação: os testes existentes são fortes, mas não cobrem um caminho real (GAP-1) e uma terceira porta do banco (GAP-2).

---

## Spec-precision gaps

| Id | Critério | O que falta na spec | O que a implementação escolheu |
| -- | -------- | ------------------- | ------------------------------ |
| SP-1 | PAG-06.3, 06.4 | "cada categoria" não diz se categorias sem ninguém aparecem com 0 | Omite (`perfil_resumo.sql:8`, `lib/admin/perfil.ts:36`); `tests/admin-perfil.test.ts:70` afirma a escolha da implementação, não um resultado da spec. Com isso `Prefiro não informar` some quando ninguém o escolheu |
| SP-2 | PAG-06.3 | "porcentagem inteira" não define o arredondamento nem se a soma precisa dar 100 | `Math.round` por categoria (`perfil.ts:39`); 3 categorias de 1/3 somam 99 ou 101 |
| SP-3 | PAG-02.1, 02.2 (Guia) | Não diz o que a pessoa vê quando a consulta de perfil falha | Tela em branco, sem mensagem nem nova tentativa (ponto de atenção 1) |

---

## Code Quality

| Princípio | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ (`nucleo.js`, `app.js` e `legacyBody.ts` intactos: `git diff --stat 246f853..HEAD` não os lista) |
| No scope creep | ✅ |
| Matches patterns | ✅ (erro como dado, AD-008; leitura e escrita por função `security definer`, AD-007) |
| Spec-anchored outcome check | ⚠️ SP-1: `tests/admin-perfil.test.ts:70` espelha a implementação |
| Per-layer Coverage Expectation | ❌ GAP-1: a ordem real consentimento → perfil no convite não tem teste de ponta a ponta; os e2e mocam `perfil` |
| Every test maps to a spec requirement | ✅ |
| Documented guidelines followed | ✅ `plataforma/CLAUDE.md`, `plataforma/AGENTS.md`, AD-003, AD-004 |

---

## Fix Plans

### Fix 1 (GAP-1, Major): perfil antes do consentimento no convite

- **Root cause**: `convite_aceitar` devolve `consentimento` antes de `perfil` (`perfis.sql:157-162`). Para conta nova, `Convite.tsx:135` mostra a etapa de consentimento do aceite antes do formulário de perfil, e o formulário pede o mesmo consentimento geral de novo.
- **Fix task**: nova migration que redefine `convite_aceitar` (copiar a de `20261109120000_perfis.sql`) com a checagem `if not private.tem_perfil()` **antes** da de consentimento. Quem não tem perfil vai ao formulário, que grava o consentimento `2026-11`; a equipe Legisla (dispensada) sem consentimento continua vendo a etapa de consentimento.
- **Verify**: teste de SQL "conta sem consentimento e sem perfil recebe `perfil` (não `consentimento`) e, depois de `perfil_salvar`, o aceite passa"; ajustar `tests/sql-perfil-trava.test.ts:84,98` à nova ordem; e2e em `convite-perfil.spec.ts` com o mock reproduzindo a ordem do banco (sem consentimento e sem perfil → `perfil`) e afirmando que a etapa "Entrar no mandato" com a caixa da LGPD nunca aparece antes de `/primeiro-acesso`.
- **Done when**: PAG-02.1 vale no convite para conta nova; consentimento pedido uma vez só.

### Fix 2 (GAP-2, Minor): `membros_criar` exige perfil

- **Root cause**: a política `membros_criar` (`20261106130000_papeis_blindagem.sql:46-54`) não exige `private.tem_perfil()`. Quem criou um mandato e depois usou `excluir_meus_dados` volta sozinha como `coordenacao`, sem perfil (sonda S1). A tela ainda manda ao formulário; a brecha é só pela API.
- **Fix task**: nova migration que recria `membros_criar` com `and private.tem_perfil()`.
- **Verify**: teste em `tests/sql-perfil-trava.test.ts`: depois de `excluir_meus_dados`, inserir a si mesma em `membros` dá erro de RLS; o cadastro com perfil (`:128`) e a Legisla seguem passando.

### Fix 3 (SP-3, Minor): erro visível no Guia quando a consulta de perfil falha

- **Fix task**: no override de `App.entrou` (`acesso.js:56-60`), capturar a falha das consultas e mostrar uma caixa de erro com "Tentar de novo" (recarrega), sem mandar ao formulário. Confirmar o texto com o usuário (a spec não o define).

### Decisões para o usuário (SP-1, SP-2)

- Mostrar ou não as categorias com 0 nas distribuições do Analytics.
- Regra de arredondamento da porcentagem (por categoria, como hoje, ou maior resto para somar 100).

---

## Requirement Traceability Update

| Requirement | Status anterior (`spec.md`) | Novo status |
| ----------- | --------------------------- | ----------- |
| PAG-01 | Pending | ✅ Verified |
| PAG-02 | In progress | ❌ Needs Fix (02.1 no convite; reforço de 02.2 no banco) |
| PAG-03 | In progress | ✅ Verified |
| PAG-04 | In progress | ✅ Verified |
| PAG-05 | Pending | ✅ Verified |
| PAG-06 | In progress | ✅ Verified (⚠️ SP-1, SP-2 aguardam decisão) |

---

## Summary

**Overall**: ❌ Not Ready

**Spec-anchored check**: 57 ACs, todos com evidência `file:line`; 54 PASS limpos, 1 reprovado (PAG-02.1, convite), 1 com brecha no reforço do banco (PAG-02.2), 1 com lacuna de precisão (PAG-06.3). 3 lacunas de precisão no total (SP-1 a SP-3).
**Sensor**: 14/14 mutantes mortos.
**Gate**: `npm test` 1098/1098 em 3 rodadas; e2e 112/112.

**What works**: login só com Google nas quatro telas; formulário com textos literais e validação repetida no banco; RLS de `perfis` (só a pessoa e a Legisla); trava em `convite_aceitar` e `mandatos_criar`; exclusão do perfil; pergunta, instruções e "Ainda não"; Analytics agregado sem dado individual.

**Issues found**: GAP-1 (Fix 1), GAP-2 (Fix 2), SP-3 (Fix 3), SP-1 e SP-2 (decisão).

**Next steps**: executar Fix 1 e Fix 2 como tasks, decidir SP-1 e SP-2, atualizar a rastreabilidade de `spec.md` e rodar o Verifier de novo.

---

## Lessons distilled

| Lição | Sinal | Origem |
| ----- | ----- | ------ |
| L-033 [e2e] | ac_gap | GAP-1 (PAG-02.1) |
| L-034 [sql] | ac_gap | GAP-2 (PAG-02.2, sonda S1) |
| L-035 [spec] | spec_precision_gap | SP-1 (PAG-06.3) |
| L-036 [spec] | spec_precision_gap | SP-2 (PAG-06.3) |
| L-037 [spec] | spec_precision_gap | SP-3 (Guia, falha da consulta) |

Nenhuma lição confirmada foi penalizada: L-019 foi seguida e nenhum mutante sobreviveu.

---

## Cleanup

Worktree de scratch removido, junction de `node_modules` desfeita sem recursão, servidor da porta 3100 parado. `git status --porcelain` da árvore real igual à linha de base capturada antes do sensor (exceto este `validation.md` e os arquivos de lições, gravados depois).
