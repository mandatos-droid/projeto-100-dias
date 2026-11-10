# Primeiro Acesso e Login só com Google Validation

**Date**: 2026-11-10
**Rodada**: 3 de no máximo 3 (última antes de escalar ao usuário)
**Spec**: `.specs/features/primeiro-acesso-google/spec.md` (Assumption "Falha ao consultar o perfil ou os mandatos no Guia", estendida em `d349024`)
**Diff range**: superfície completa `246f853..80e2f1e` (45 arquivos em `plataforma/`); foco da rodada `f3aee72..80e2f1e` (spec `d349024`, T20 `208cad8`, T21 `80e2f1e`; em `plataforma/` só `public/legacy/acesso.js`, `tests/legado-acesso.test.ts` e `e2e/guia-acesso.spec.ts`)
**Verifier**: sub-agente independente, novo (autor ≠ verificador; não herda os Verifiers das rodadas 1 e 2 nem quem corrigiu)

## Validation: primeiro-acesso-google - PASS ✅

Os 2 itens abertos da rodada 2 estão resolvidos com teste nas duas camadas: o M8 (consulta de `equipe_legisla` fora do `try`) agora morre na unidade e no e2e, e a falha da leitura de mandatos da trava (SP-R2-1) mostra a caixa com "Tentar de novo". Os 57 ACs têm evidência `file:line` atual, o sensor matou 20/20 mutantes e o gate passou inteiro (`npm test` 1109/1109 em 2 rodadas, `tsc` limpo, e2e 349/349). Nenhuma lacuna nova.

---

## Reverificação dos itens da rodada 2

Caminhos relativos a `plataforma/`.

| Item | O que a spec define | Código atual | Teste que afirma o resultado da spec | Prova independente desta rodada | Resultado |
| ---- | ------------------- | ------------ | ------------------------------------ | ------------------------------- | --------- |
| GAP-R2-1 / M8 (falha de `equipe_legisla` sem teste) | Assumption "Falha ao consultar o perfil ou os mandatos no Guia" (`spec.md:69`): caixa "Não foi possível carregar seus dados. Tente de novo." com "Tentar de novo"; nunca o formulário; vale para `equipe_legisla` | `public/legacy/acesso.js:73-78` (as duas consultas no mesmo `Promise.all`, dentro do `try`; `catch` chama `mostraErroPerfil` em `:78`) | Unidade: `tests/legado-acesso.test.ts:391` (stub lança em `:299`; sem redirecionamento, sem cadastro, sem ler `membros?select=papel`, texto literal em `:399`, botão em `:400`; depois do clique, caixa some em `:403`, mandatos lidos em `:405`, `#app` visível em `:406`). e2e: `e2e/guia-acesso.spec.ts:390` (mock 500 em `:100`; caixa com `role=alert` e texto literal em `:395`; continua em `/guia` em `:398`; não lê mandatos em `:399`; clique com a consulta funcionando abre o Guia em `:402`, caixa some em `:403`, nenhuma navegação fora de `/guia` em `:404`) | Sensor R3-M1 (unidade) e R3-E1 (e2e) | ✅ Resolvido nas duas camadas |
| SP-R2-1 (leitura de mandatos da trava sem tratamento) | Mesma Assumption, estendida em `d349024` (`spec.md:69`): "vale ... para a leitura dos mandatos que vem logo depois" | `acesso.js:84-88`: `try{mandatos=await Store.meusMandatos()}catch(e){mostraErroPerfil();return}` em `:86`; a lista vazia segue indo à pergunta em `:87` | Unidade: `tests/legado-acesso.test.ts:409` (stub lança em `:301`; leitura tentada em `:415`; sem redirecionamento nem cadastro em `:413-414`; texto literal em `:417`; depois do clique a caixa some em `:421` e `#app` fica visível em `:423`). e2e: `e2e/guia-acesso.spec.ts:407` (mock 500 em `:96`; caixa em `:412`, botão em `:413`, `/guia` em `:415`; clique com a leitura funcionando abre o Guia em `:418`, caixa some em `:419`, nenhuma navegação fora de `/guia` em `:420`) | Sensor R3-M3, R3-M8, R3-M9 (unidade) e R3-E2 (e2e) | ✅ Resolvido nas duas camadas |

**"Tentar de novo" refaz a entrada e abre o Guia quando a consulta volta**: `acesso.js:64` (`cx.remove();caixaErroPerfil=null;return App.entrou()`), afirmado para as 3 consultas: `perfis` em `tests/legado-acesso.test.ts:373` e `e2e/guia-acesso.spec.ts:375` (2 leituras de `perfis` em `:387`), `equipe_legisla` em `tests/legado-acesso.test.ts:391` e `e2e/guia-acesso.spec.ts:390`, mandatos em `tests/legado-acesso.test.ts:409` e `e2e/guia-acesso.spec.ts:407`.

**Nenhuma das 3 falhas deixa o `#app` oculto sem caixa**: `#entrada` e `#app` nascem ocultos e só o `_entrou` original os troca (`app.js:69-70`). Na trava (`acesso.js:70-90`) há 3 leituras que podem lançar (`Nuvem.rest` lança em resposta não 2xx, `nucleo.js:65`; `Store.meusMandatos` usa `Nuvem.rest`, `nucleo.js:142-144`): as duas de `:74-77` e a de `:86`. As três estão em `try` com `mostraErroPerfil()` (caixa acrescentada ao `body`, visível pela regra `.erro-perfil{display:grid}` de `acesso.js:153`). Não há outro `await` na trava antes de `_entrou` (`sessionStorage` em `:83` já está em `try` e não é assíncrono).

**Efeito colateral de `acesso.js` mudado (regressão dos caminhos da trava)**: cada caminho tem teste nas duas camadas, todos passando nesta rodada.

| Caminho | Código | Unidade | e2e |
| ------- | ------ | ------- | --- |
| Perfil e mandato: o Guia abre como antes | `acesso.js:84-89` | `tests/legado-acesso.test.ts:334` (sem redirecionar, `#app` visível) | `e2e/guia-acesso.spec.ts:352` (espera `#ladoNav .it`, ordem das consultas) |
| Equipe Legisla sem perfil: abre | `acesso.js:80` | `tests/legado-acesso.test.ts:342` | `e2e/guia-acesso.spec.ts:360` |
| Sem perfil: `/primeiro-acesso?volta=guia`, sem ler mandatos | `acesso.js:81` | `tests/legado-acesso.test.ts:316`, `:440` (a marca "Ainda não" não vale sem perfil) | `e2e/guia-acesso.spec.ts:346` |
| Sem mandato e com `semEquipe`: cadastro do mandato | `acesso.js:82-84` (pula a leitura) + `app.js:74` | `tests/legado-acesso.test.ts:433` (`aberturaDoCadastro = ['cadastro']`) | `e2e/guia-acesso.spec.ts:428` ("Vamos cadastrar o mandato") |
| Sem mandato e sem a marca: a pergunta | `acesso.js:87` | `tests/legado-acesso.test.ts:426` (`['/primeiro-acesso']`) | `e2e/guia-acesso.spec.ts:423` |

---

## Spec-Anchored Acceptance Criteria (57 ACs, evidência atual em `80e2f1e`)

Legenda: ✅ PASS · ❌ GAP · ⚠️ lacuna de precisão da spec. Caminhos relativos a `plataforma/`. Desde a rodada 2 só 3 arquivos de `plataforma/` mudaram (`git diff --stat 4084295..80e2f1e`); neles as linhas foram refeitas (`acesso.js` +4 a partir da `:84`; `legado-acesso.test.ts` +35 a partir da `:391`; `guia-acesso.spec.ts` +2 a partir da `:47` e +35 a partir da `:390`). Nos demais conferi as declarações de teste citadas de `primeiro-acesso.spec.ts`, `sql-perfil-trava.test.ts`, `sql-perfil.test.ts`, `perfil-fluxo.test.ts`, `admin-perfil.test.ts`, `sql-perfil-resumo.test.ts`, `convite-perfil.spec.ts`, `convite-conta.spec.ts`, `mandato-perfil.spec.ts`, `admin-acesso.spec.ts` e `admin-analytics-perfil.spec.ts`, e as linhas de `perfis.sql:123-142,148-189`: todas batem.

### PAG-01 Entrar só com Google

| AC | Resultado definido pela spec | Código | Teste + asserção | Resultado |
| -- | ---------------------------- | ------ | ---------------- | --------- |
| 01.1 | Só "Entrar com Google" no convite, no Guia e no `/admin` | `app/convite/FormularioConta.tsx:67-79`; `public/legacy/acesso.js:33-42`; `app/primeiro-acesso/PrimeiroAcesso.tsx:176-192` | `e2e/convite-conta.spec.ts:46`; `e2e/guia-acesso.spec.ts:289`; `e2e/admin-acesso.spec.ts:33`; `e2e/primeiro-acesso.spec.ts:50` | ✅ |
| 01.2 | Sem senha, "Criar conta" ou "Entrar com e-mail" | `acesso.js:41-42` | `e2e/guia-acesso.spec.ts:289` (nenhum `input`, nenhuma aba, 1 botão); `e2e/convite-conta.spec.ts:46`; `e2e/admin-acesso.spec.ts:33,98,116` | ✅ |
| 01.3 | Volta do Google grava `legisla.tok` e segue o fluxo | `PrimeiroAcesso.tsx:102-106`; `Convite.tsx:160-166` | `e2e/primeiro-acesso.spec.ts:67`; `e2e/convite-conta.spec.ts:73`; `e2e/admin-acesso.spec.ts:81` | ✅ |
| 01.4 | "Não foi possível entrar com o Google. Tente de novo." e botão mantido | `PrimeiroAcesso.tsx:17,106`; `acesso.js:32,43-48` | `e2e/primeiro-acesso.spec.ts:76`; `e2e/convite-conta.spec.ts:105`; `e2e/admin-acesso.spec.ts:89`; `e2e/guia-acesso.spec.ts:326`; `tests/legado-acesso.test.ts:460` | ✅ |
| 01.5 | Link do convite guardado e concluído na volta | `FormularioConta.tsx:68-71`; `Convite.tsx:160-166` | `e2e/convite-conta.spec.ts:73` | ✅ |
| 01.6 | Nenhuma funcionalidade envia e-mail | `acesso.js:35-36` (o cadastro com senha, único gatilho de e-mail, fica sem caminho) | `tests/legado-acesso.test.ts:488` (varredura de `app/`, `lib/`, `acesso.js`); `e2e/guia-acesso.spec.ts:313` | ✅ |

### PAG-02 Cadastro de perfil no primeiro acesso

| AC | Resultado definido pela spec | Código | Teste + asserção | Resultado |
| -- | ---------------------------- | ------ | ---------------- | --------- |
| 02.1 | Sem perfil (fora da Legisla) → formulário antes de qualquer outra tela do Guia, da Área do mandato ou do aceite | Guia `acesso.js:70-81`; `/mandato` `app/mandato/Casca.tsx:57-60`; convite `supabase/migrations/20261109120000_perfis.sql:175-180` + `app/convite/Convite.tsx:129-134` | `tests/legado-acesso.test.ts:316,440`; `e2e/guia-acesso.spec.ts:346`; `e2e/mandato-perfil.spec.ts:25`; `tests/sql-perfil-trava.test.ts:99`; `e2e/convite-perfil.spec.ts:41,50,57` | ✅ |
| 02.2 | Sem perfil, impedir Guia, Área do mandato e aceite | UI acima; banco `perfis.sql:123-126,132-142,175-177` | `tests/sql-perfil-trava.test.ts:75,149,187`; `tests/legado-acesso.test.ts:316` | ✅ |
| 02.3 | 7 campos | `PrimeiroAcesso.tsx:248-278` | `e2e/primeiro-acesso.spec.ts:86` | ✅ |
| 02.4 | "Sim" pede o tempo nas 5 faixas | `PrimeiroAcesso.tsx:272-278`; `lib/perfil/opcoes.ts:26-35` | `e2e/primeiro-acesso.spec.ts:102`; `tests/sql-perfil.test.ts:202` | ✅ |
| 02.5 | "Não" grava `Não atuo na política` sem tempo | `lib/perfil/validacao.ts:70` | `e2e/primeiro-acesso.spec.ts:194` (`p_atua:false, p_tempo:null`); `tests/sql-perfil.test.ts:202` | ✅ |
| 02.6 | 8 gêneros e 6 raças com os rótulos da spec | `opcoes.ts:5-23` | `e2e/primeiro-acesso.spec.ts:86`; `tests/sql-perfil.test.ts:187` | ✅ |
| 02.7 | Nome do Google preenchido e editável | `PrimeiroAcesso.tsx:43-56` | `e2e/primeiro-acesso.spec.ts:112,119` | ✅ |
| 02.8 | Vazio ou caixa desmarcada → "Preencha todos os campos e aceite o tratamento dos dados para continuar." | `validacao.ts:6,55-61` | `e2e/primeiro-acesso.spec.ts:126,135,145` (cada guarda isolada, L-019) | ✅ |
| 02.9 | "Informe seu nome completo." | `validacao.ts:7,63-64`; `perfis.sql:69-71` | `e2e/primeiro-acesso.spec.ts:155`; `tests/sql-perfil.test.ts:140` | ✅ |
| 02.10 | "Informe uma data de nascimento válida." | `validacao.ts:8,35-43`; `perfis.sql:72-82` | `e2e/primeiro-acesso.spec.ts:165,230`; `tests/sql-perfil.test.ts:150` | ✅ |
| 02.11 | "Informe um telefone com DDD." | `validacao.ts:9,29,68`; `perfis.sql:89-91` | `e2e/primeiro-acesso.spec.ts:174`; `tests/sql-perfil.test.ts:165` | ✅ |
| 02.12 | Grava perfil e consentimento com a versão do perfil e segue | `perfis.sql:100-107` | `tests/sql-perfil.test.ts:104,113,118`; `tests/sql-perfil-trava.test.ts:125`; `e2e/primeiro-acesso.spec.ts:185` | ✅ |
| 02.13 | Falha mantém os dados: "Não foi possível salvar. Tente de novo." | `lib/perfil/api.ts:9`; `PrimeiroAcesso.tsx:213-236` | `e2e/primeiro-acesso.spec.ts:202,213,221` | ✅ |
| 02.14 | Duplo envio → um único perfil | `perfis.sql:100-103` (`on conflict do nothing`) | `tests/sql-perfil.test.ts:130`; `e2e/primeiro-acesso.spec.ts:255` | ✅ |
| 02.15 | Com perfil, sem formulário | `lib/perfil/fluxo.ts:14-15`; `acesso.js:79-89` | `e2e/primeiro-acesso.spec.ts:265`; `tests/legado-acesso.test.ts:334`; `e2e/guia-acesso.spec.ts:352` | ✅ |
| 02.16 | `equipe_legisla` sem formulário nem bloqueio | `perfis.sql:43-47,141`; `acesso.js:80`; `Casca.tsx:57` | `tests/perfil-fluxo.test.ts:19`; `tests/sql-perfil.test.ts:255`; `tests/sql-perfil-trava.test.ts:138,172,202`; `tests/legado-acesso.test.ts:342`; `e2e/guia-acesso.spec.ts:360`; `e2e/mandato-perfil.spec.ts:37` | ✅ |

**Assumption "Falha ao consultar o perfil ou os mandatos no Guia"** (`spec.md:69`, decisão das rodadas 1 e 2): `acesso.js:56-68,73-78,86`; unidade `tests/legado-acesso.test.ts:360,373,391,409`; e2e `e2e/guia-acesso.spec.ts:366,375,390,407`. ✅ nas 3 consultas e nas duas camadas.

### PAG-03 Perfil protegido no banco

| AC | Resultado definido pela spec | Código | Teste + asserção | Resultado |
| -- | ---------------------------- | ------ | ---------------- | --------- |
| 03.1 | Tabela própria, `user_id` único | `perfis.sql:15-26,38-39` | `tests/sql-perfil.test.ts:75` | ✅ |
| 03.2 | Grava só com o `user_id` da sessão | `perfis.sql:60,100-101` | `tests/sql-perfil.test.ts:104` | ✅ |
| 03.3 | Gravar perfil de outra pessoa → erro de permissão | `perfis.sql:37-39` | `tests/sql-perfil.test.ts:86` (`permission denied`) | ✅ |
| 03.4 | Legisla (qualquer papel) lê todos | `perfis.sql:33-35` | `tests/sql-perfil.test.ts:246` | ✅ |
| 03.5 | Fora da Legisla, perfil de outra pessoa → zero linhas | `perfis.sql:33-35` | `tests/sql-perfil.test.ts:238` | ✅ |
| 03.6 | Lê o próprio | `perfis.sql:35` | `tests/sql-perfil.test.ts:232` | ✅ |
| 03.7 | Fora da lista ou do formato → recusa | `perfis.sql:17-25,69-94` | `tests/sql-perfil.test.ts:140,150,165,177,215` | ✅ |
| 03.8 | Não atua com tempo, ou atua sem tempo → recusa | `perfis.sql:25,95-98` | `tests/sql-perfil.test.ts:215` | ✅ |
| 03.9 | Conta excluída apaga o perfil | `perfis.sql:16` (`on delete cascade`) | `tests/sql-perfil-trava.test.ts:272` | ✅ |
| 03.10 | "Excluir meus dados" apaga o perfil | `perfis.sql:204` | `tests/sql-perfil-trava.test.ts:241,253` | ✅ |

### PAG-04 Pergunta sobre a equipe e escolha do mandato

| AC | Resultado definido pela spec | Código | Teste + asserção | Resultado |
| -- | ---------------------------- | ------ | ---------------- | --------- |
| 04.1 | Pergunta literal com "Sim, já criou" e "Ainda não" | `PrimeiroAcesso.tsx:162-164`; `fluxo.ts:16`; `acesso.js:87` | `e2e/primeiro-acesso.spec.ts:313,321`; `tests/perfil-fluxo.test.ts:39`; `tests/legado-acesso.test.ts:426`; `e2e/guia-acesso.spec.ts:423` | ✅ |
| 04.2 | "Sim" abre as instruções | `PrimeiroAcesso.tsx:163` | `e2e/primeiro-acesso.spec.ts:331` | ✅ |
| 04.3 | 3 passos e campo de colar | `PrimeiroAcesso.tsx:304-333` | `e2e/primeiro-acesso.spec.ts:331` | ✅ |
| 04.4 | Link válido abre `/convite` com o token | `lib/perfil/link.ts:5-10`; `PrimeiroAcesso.tsx:311-316` | `tests/perfil-fluxo.test.ts:54,59,63`; `e2e/primeiro-acesso.spec.ts:351,359` | ✅ |
| 04.5 | "Este não parece um link de convite. Peça a quem convidou para enviar de novo." | `PrimeiroAcesso.tsx:304,314` | `tests/perfil-fluxo.test.ts:68,72,78,84`; `e2e/primeiro-acesso.spec.ts:367,376` | ✅ |
| 04.6 | "Ainda não" abre o cadastro do mandato | `PrimeiroAcesso.tsx:90-94`; `acesso.js:82-89` | `e2e/primeiro-acesso.spec.ts:386,393`; `tests/legado-acesso.test.ts:433`; `e2e/guia-acesso.spec.ts:428` | ✅ |
| 04.7 | Cadastro concluído → `coordenacao` e Guia | `perfis.sql:123-126,132-142` | `tests/sql-perfil-trava.test.ts:155`; `tests/sql-membros.test.ts:448` | ✅ |
| 04.8 | Por convite: sem pergunta, aceite depois do perfil | `fluxo.ts:15`; `Convite.tsx:155-157`; `perfis.sql:175-180` | `tests/perfil-fluxo.test.ts:47`; `e2e/primeiro-acesso.spec.ts:399,406`; `e2e/convite-perfil.spec.ts:57,75`; `tests/sql-perfil-trava.test.ts:125` | ✅ |
| 04.9 | Já em mandato: sem pergunta | `fluxo.ts:15` | `e2e/primeiro-acesso.spec.ts:414,420`; `tests/perfil-fluxo.test.ts:31,35` | ✅ |
| 04.10 | Voltar à pergunta | `PrimeiroAcesso.tsx:331` | `e2e/primeiro-acesso.spec.ts:343` | ✅ |

### PAG-05 Remoção do login por senha

| AC | Resultado definido pela spec | Código | Teste + asserção | Resultado |
| -- | ---------------------------- | ------ | ---------------- | --------- |
| 05.1 | Sem caminho para `signup` e `grant_type=password` | `acesso.js:34-39` | `tests/legado-acesso.test.ts:448,454,488`; `e2e/guia-acesso.spec.ts:313`; `e2e/admin-acesso.spec.ts:109` | ✅ |
| 05.2 | Sem "Confirme o e-mail enviado e faça login"; `app/` e `lib/` sem `email_not_confirmed` | `lib/convites/erros.ts` | `tests/legado-acesso.test.ts:488`; `e2e/convite-conta.spec.ts:59`; `e2e/guia-acesso.spec.ts:303,308` | ✅ |
| 05.3 | Renova pelo `refresh_token` | `lib/admin/sessao.ts`; Guia `Store.sessao` (`acesso.js:43-48` só troca o texto do erro) | `tests/legado-acesso.test.ts:467`; `e2e/guia-acesso.spec.ts:332`; `e2e/admin-acesso.spec.ts:163` | ✅ |

### PAG-06 Analytics do perfil

| AC | Resultado definido pela spec | Código | Teste + asserção | Resultado |
| -- | ---------------------------- | ------ | ---------------- | --------- |
| 06.1 | `admin` e `leitura` veem a seção | `app/admin/analytics/page.tsx`; `supabase/migrations/20261109130000_perfil_resumo.sql:20` | `e2e/admin-analytics-perfil.spec.ts:52,63`; `tests/sql-perfil-resumo.test.ts:145` | ✅ |
| 06.2 | Total e cadastros por mês, no máximo 12 | `perfil_resumo.sql:38-50`; `SecaoPerfil.tsx:49-59` | `tests/sql-perfil-resumo.test.ts:113,122,134`; `tests/admin-perfil.test.ts:114,124`; `e2e/admin-analytics-perfil.spec.ts:52` | ✅ |
| 06.3 | Número e % inteira de toda categoria, mesmo com 0 | `lib/admin/perfil.ts:37-44` | `tests/admin-perfil.test.ts:19,33,39,44,65,81`; `e2e/admin-analytics-perfil.spec.ts:69,82` | ✅ |
| 06.4 | `Prefiro não informar` como categoria própria | `perfil.ts:40`; `perfil_resumo.sql` (chave `nao_informar`) | `tests/admin-perfil.test.ts:51,81`; `e2e/admin-analytics-perfil.spec.ts:104`; `tests/sql-perfil-resumo.test.ts:77,82` | ✅ |
| 06.5 | Faixas etárias na data da consulta | `perfil_resumo.sql:28-33` | `tests/sql-perfil-resumo.test.ts:92`; `tests/admin-perfil.test.ts:57` | ✅ |
| 06.6 | Sem nome, e-mail, telefone nem nascimento | `perfil_resumo.sql:13-58`; `SecaoPerfil.tsx:8-16` | `e2e/admin-analytics-perfil.spec.ts:122`; `tests/sql-perfil-resumo.test.ts:64`; `tests/admin-perfil.test.ts:128` | ✅ |
| 06.7 | Função só com contagens | `perfil_resumo.sql:13-58` | `tests/sql-perfil-resumo.test.ts:64` | ✅ |
| 06.8 | Fora da Legisla → erro de permissão | `perfil_resumo.sql:20-22` | `tests/sql-perfil-resumo.test.ts:152` | ✅ |
| 06.9 | "Ainda não há perfis cadastrados." sem gráfico vazio | `perfil.ts:24,47`; `SecaoPerfil.tsx:46` | `tests/admin-perfil.test.ts:109`; `e2e/admin-analytics-perfil.spec.ts:131` | ✅ |
| 06.10 | "Não foi possível carregar o perfil. Tente de novo." sem afetar o resto | `SecaoPerfil.tsx:26-30,40-45` | `e2e/admin-analytics-perfil.spec.ts:137` | ✅ |
| 06.11 | Título do que mede e categoria em texto | `SecaoPerfil.tsx:9-16` | `e2e/admin-analytics-perfil.spec.ts:110,146` | ✅ |
| 06.12 | Soma das categorias = total | `perfil.ts:40-41` | `tests/admin-perfil.test.ts:72,101`; `tests/sql-perfil-resumo.test.ts:105` | ✅ |

**Status**: 57/57 ACs com evidência `file:line` e asserção do resultado definido pela spec. Nenhuma lacuna de precisão nova.

---

## Discrimination Sensor

Dois worktrees de scratch próprios fora da árvore real (`git worktree add --detach <scratchpad>/r3mut 80e2f1e` e `<scratchpad>/r3gate`), `node_modules` por junction. Camada de unidade e SQL (`r3mut`): um script aplica cada mutante (o padrão precisa casar exatamente uma vez), roda só os arquivos de teste que cobrem o trecho (`node --test tests/legado-acesso.test.ts` para `acesso.js`; `node --test tests/sql-perfil-trava.test.ts tests/sql-membros.test.ts` para `perfis.sql`), restaura o arquivo e confere o sha256; no fim o `git status --porcelain` do scratch saiu vazio. Camada e2e (`r3gate`, servidor próprio da porta 3100): o mesmo `acesso.js` mutado, rodando o bloco "Perfil antes do Guia" de `e2e/guia-acesso.spec.ts` (9 testes, 2 workers) e restaurando com `git checkout` no scratch.

### Unidade e SQL

| # | Arquivo:linha | Mutação | Testes que mataram | Resultado |
| - | ------------- | ------- | ------------------ | --------- |
| R3-M1 | `acesso.js:73-77` | Consulta de `equipe_legisla` fora do `try` (o M8 sobrevivente da rodada 2) | `tests/legado-acesso.test.ts:391` | ✅ Morto |
| R3-M2 | `acesso.js:73-77` | Consulta de `perfis` fora do `try` | `tests/legado-acesso.test.ts:360,373` | ✅ Morto |
| R3-M3 | `acesso.js:86` | Leitura de mandatos sem tratamento (estado antes da T21) | `tests/legado-acesso.test.ts:409` | ✅ Morto |
| R3-M4 | `acesso.js:64` | "Tentar de novo" não tira a caixa | `tests/legado-acesso.test.ts:373,391,409` | ✅ Morto |
| R3-M5 | `acesso.js:64` | "Tentar de novo" tira a caixa mas não refaz a entrada | `tests/legado-acesso.test.ts:373,391` | ✅ Morto |
| R3-M6 | `acesso.js:64` | "Tentar de novo" pula a trava (chama o `_entrou` original) | `tests/legado-acesso.test.ts:373` | ✅ Morto |
| R3-M7 | `acesso.js:78` | Falha de `equipe_legisla` ou `perfis` manda ao formulário de perfil | `tests/legado-acesso.test.ts:360,373,391` | ✅ Morto |
| R3-M8 | `acesso.js:86` | Falha da leitura de mandatos manda ao formulário de perfil | `tests/legado-acesso.test.ts:409` | ✅ Morto |
| R3-M9 | `acesso.js:86` | Falha da leitura de mandatos vira "sem mandato" (iria à pergunta) | `tests/legado-acesso.test.ts:409` | ✅ Morto |
| R3-M10 | `acesso.js:56` | Texto da caixa trocado ("Não foi possível carregar seus dados.") | `tests/legado-acesso.test.ts:360,373,391,409` | ✅ Morto |
| R3-M11 | `acesso.js:83` | Ignora a marca `legisla.semEquipe` | `tests/legado-acesso.test.ts:433` | ✅ Morto |
| R3-M12 | `acesso.js:80` | Ignora a dispensa da equipe Legisla no Guia | `tests/legado-acesso.test.ts:342` | ✅ Morto |
| R3-M13 | `acesso.js:81` | Sem perfil vai a `/primeiro-acesso` sem `?volta=guia` | `tests/legado-acesso.test.ts:316,440` | ✅ Morto |
| R3-M14 | `acesso.js:62` | Caixa sem `role="alert"` | `tests/legado-acesso.test.ts:360` | ✅ Morto |
| R3-M15 | `perfis.sql:175-180` | Ordem do aceite invertida: consentimento antes de perfil (já coberto: M1 da rodada 2) | `tests/sql-perfil-trava.test.ts:85,99,125` (comportamento) e `:221` (fonte) | ✅ Morto |
| R3-M16 | `perfis.sql:141` | `membros_criar` sem `private.tem_perfil()` (já coberto: M2 da rodada 2) | `tests/sql-perfil-trava.test.ts:187` (sonda S1, comportamento) e `:231` (fonte) | ✅ Morto |

### e2e (camada de tela, servidor da porta 3100)

| # | Arquivo:linha | Mutação | Testes que mataram | Resultado |
| - | ------------- | ------- | ------------------ | --------- |
| R3-E1 | `acesso.js:73-77` | Consulta de `equipe_legisla` fora do `try` (M8) | `e2e/guia-acesso.spec.ts:390` (caixa ausente em `:395`) | ✅ Morto |
| R3-E2 | `acesso.js:86` | Leitura de mandatos sem tratamento | `e2e/guia-acesso.spec.ts:407` (caixa ausente em `:412`) | ✅ Morto |
| R3-E3 | `acesso.js:73-77` | Consulta de `perfis` fora do `try` | `e2e/guia-acesso.spec.ts:366,375` | ✅ Morto |
| R3-E4 | `acesso.js:64` | "Tentar de novo" não tira a caixa | `e2e/guia-acesso.spec.ts:375,390,407` | ✅ Morto |

As falhas de R3-E1 e R3-E2 são pelo motivo certo: `locator('#erroPerfil').getByRole('alert')` não existe (tela em branco), não tempo nem compilação. Depois dos 4 mutantes, `acesso.js` voltou com o mesmo sha256 e uma rodada de controle de `e2e/guia-acesso.spec.ts` inteiro passou (ver Gate Check).

**Sensor depth**: P0 (auth e integridade de dados): 20 mutações manuais (16 em unidade e SQL, 4 em e2e) no código novo de `acesso.js`, nos vizinhos e em 2 guardas de SQL já cobertas.
**Result**: 20/20 mortos, 0 sobreviventes. ✅

---

## Gate Check

Rodado num worktree limpo em `80e2f1e` (fora da árvore real, que tem alterações de outras frentes).

- **Unidade e SQL**: `npm test` em 2 rodadas seguidas: **1109/1109** e **1109/1109** (0 falhas, 0 pulados, 0 cancelados; ~38 s e ~35 s).
- **Tipos**: `npx tsc --noEmit` sem nenhuma saída de erro.
- **e2e** (servidor próprio `next dev --webpack -p 3100` no mesmo worktree, `playwright.isolado.config.ts` não versionado, 4 workers): `e2e/convite-*`, `e2e/mandato-*`, `e2e/guia-acesso*`, `e2e/primeiro-acesso*`, `e2e/admin-*`: **349 passaram, 0 falharam** (6,7 min). Rodada de controle de `e2e/guia-acesso.spec.ts` depois do sensor: 29/29.
- **Contagem**: 1107 na rodada 2 → 1109 (+2 em `tests/legado-acesso.test.ts`: `:391` e `:409`); e2e 347 → 349 (+2 em `e2e/guia-acesso.spec.ts`: `:390` e `:407`). Nenhum teste removido.
- **Integridade dos testes desde a rodada 2** (`git diff f3aee72..80e2f1e -- plataforma/tests plataforma/e2e`): só 6 linhas trocadas, todas ampliações: o tipo `Pessoa` ganhou `falhaLegisla` e `falhaMandatos` (`tests/legado-acesso.test.ts:292`), os stubs de `equipe_legisla` e de mandatos passaram a poder lançar mantendo a resposta anterior (`:299,301`), o `Estado` do e2e ganhou `legisla: 'falha'` e `mandatos: 'falha'` (`e2e/guia-acesso.spec.ts:47-49`) e os mocks passaram a poder responder 500 mantendo a resposta 200 anterior (`:96,100`). Nenhuma asserção foi removida nem afrouxada; os testes da rodada 2 (`tests/legado-acesso.test.ts:360,373`, `e2e/guia-acesso.spec.ts:366,375`) estão intactos.

### Instabilidade

Nenhuma nesta rodada. Os dois e2e do `/admin` conhecidos como instáveis sob carga do `next dev` (`e2e/admin-equipe.spec.ts:245` e `e2e/admin-transversal.spec.ts:139`, fora desta feature) passaram na rodada completa com 4 workers. A recomendação da rodada 2 para eles segue válida (`expect.poll(..., { timeout: 15_000 })` em `admin-equipe.spec.ts:251`; esperar a tela anterior ficar quieta antes do próximo `goto` em `admin-transversal.spec.ts`).

---

## Code Quality

| Princípio | Status |
| --------- | ------ |
| Minimum code | ✅ (T21: 5 linhas em `acesso.js:84-88`, reaproveitando `mostraErroPerfil`; T20 só teste) |
| Surgical changes | ✅ (`app.js`, `nucleo.js`, `iniciar.js` e `lib/legacyBody.ts` sem nenhuma mudança em `246f853..80e2f1e`: AD-003) |
| No scope creep | ✅ |
| Matches patterns | ✅ (mesma caixa, mesmo texto e mesmo botão das outras duas consultas) |
| Spec-anchored outcome check | ✅ 57/57; a Assumption estendida (`spec.md:69`) é afirmada com o texto literal nas 3 consultas |
| Per-layer Coverage Expectation | ✅ cada ramo de erro da trava (3 consultas) tem teste de unidade e e2e, com o caminho feliz do "Tentar de novo" |
| Every test maps to a spec requirement | ✅ (os 4 testes novos citam a Assumption e PAG-02) |
| Documented guidelines followed | ⚠️ `plataforma/CLAUDE.md`: "Mudanças de schema = nova migration com timestamp, nunca editar a existente". A T17 (rodada 2) editou `20261109120000_perfis.sql`; seguro só porque a migration nunca saiu desta branch. Observação herdada, não gap (ver Observações) |

---

## Edge Cases

- [x] Fecha a aba no meio do perfil: nada guardado no navegador; gravação atômica (`tests/sql-perfil.test.ts:118`).
- [x] Convite já aceito, vencido ou cancelado: `invalido` responde antes do perfil (`perfis.sql:163-166`).
- [x] Perfil sem mandato e sem convite: pergunta (`e2e/primeiro-acesso.spec.ts:313`; `tests/legado-acesso.test.ts:426`; `e2e/guia-acesso.spec.ts:423`).
- [x] Conta Google sem nome: nome vazio (`e2e/primeiro-acesso.spec.ts:119`).
- [x] Equipe Legisla por convite: aceita sem perfil (`tests/sql-perfil-trava.test.ts:138`).

---

## Observações (não são gaps)

1. **Leitura de mandatos do `_entrou` original** (`app.js:71`): para a equipe Legisla (`acesso.js:80`) e para quem tem a marca "Ainda não" (`acesso.js:82-84`, que pula a leitura da trava), a única leitura de mandatos é a do `_entrou` original. Ela roda depois de `app.js:69-70` mostrar o `#app`, então uma falha ali deixa o `#app` visível, sem caixa: o mesmo comportamento de antes da feature para todo mundo. Não é a "leitura dos mandatos que vem logo depois" da consulta de perfil (`spec.md:69`) e não deixa o `#app` oculto. Se o dono do produto quiser a caixa também ali, é mudança nova de spec, fora desta feature.
2. **Migration editada no lugar** (herdada da rodada 2): antes do merge, confirmar que nenhum banco (produção ou prévia) já registrou a versão `20261109120000`; senão a versão corrigida pela T17 nunca seria aplicada nele.
3. **`admin_membro_adicionar`** segue incluindo conta sem perfil: ação deliberada da equipe Legisla admin, mesma leitura das rodadas 1 e 2.
4. **Aviso do Next 16.4**: o primeiro `next dev` não interativo parou de novo com a recomendação de atualização de segurança do Next.js (já registrada em `plataforma/CLAUDE.md`); a segunda tentativa subiu. Nenhuma atualização foi feita; fica com o dono do projeto.
5. **`spec.md` desatualizado na rastreabilidade**: PAG-02 e PAG-06 ainda dizem "aguarda a re-verificação (rodada 2)". Este Verifier só grava `validation.md`; a tabela abaixo é para o orquestrador aplicar.

---

## Requirement Traceability Update

| Requirement | Status em `spec.md` | Novo status |
| ----------- | ------------------- | ----------- |
| PAG-01 | Verified (rodada 1) | ✅ Verified (rodada 3, sem regressão) |
| PAG-02 | Implemented, aguarda re-verificação | ✅ Verified (rodada 3): GAP-1, GAP-2, SP-3, GAP-R2-1 e SP-R2-1 resolvidos |
| PAG-03 | Verified (rodada 1) | ✅ Verified |
| PAG-04 | Verified, re-verificar a ordem do aceite | ✅ Verified (ordem do aceite conferida nas rodadas 2 e 3; R3-M15 morto) |
| PAG-05 | Verified (rodada 1) | ✅ Verified |
| PAG-06 | Implemented, aguarda re-verificação | ✅ Verified (SP-1 e SP-2 resolvidos na rodada 2, sem regressão) |

---

## Histórico das 3 rodadas

| Rodada | Faixa verificada | Veredito | Achados | Correção |
| ------ | ---------------- | -------- | ------- | -------- |
| 1 | `246f853..8609ccc` | Reprovada | GAP-1 (consentimento antes do perfil no aceite do convite), GAP-2 (brecha em `membros_criar`, sonda S1), SP-1 (categorias com 0 no Analytics), SP-2 (arredondamento), SP-3 (Guia em branco quando a consulta de perfil falha) | Spec `2bbd33d` (4 Assumptions); T17 `d0080a5`, T18 `3055bdc`, T19 `4084295` |
| 2 | `246f853..4084295` | Reprovada | Os 5 itens da rodada 1 resolvidos; GAP-R2-1 (mutante M8 sobrevivente: falha de `equipe_legisla` sem teste), SP-R2-1 (falha da leitura de mandatos da trava deixava a tela em branco). Sensor 14/15 | Spec `d349024` (Assumption estendida aos mandatos); T20 `208cad8` (só teste), T21 `80e2f1e` |
| 3 | `246f853..80e2f1e` | **PASS** | GAP-R2-1 e SP-R2-1 resolvidos nas duas camadas; 57/57 ACs; sensor 20/20; gate 1109/1109 (x2), `tsc` limpo, e2e 349/349 | Nenhuma |

---

## Summary

**Overall**: ✅ Ready.

**Spec-anchored check**: 57/57 ACs com evidência `file:line` e asserção do resultado definido na spec; a Assumption "Falha ao consultar o perfil ou os mandatos no Guia" afirmada nas 3 consultas, nas duas camadas. Nenhuma lacuna de precisão nova.
**Sensor**: 20/20 mortos (16 em unidade e SQL, 4 em e2e), incluindo o M8 da rodada 2 nas duas camadas e as 2 guardas de SQL já cobertas.
**Gate**: `npm test` 1109/1109 em 2 rodadas; `tsc` sem erro; e2e 349/349; nenhuma instabilidade.

**What works**: trava do Guia com a caixa "Não foi possível carregar seus dados. Tente de novo." e "Tentar de novo" para `equipe_legisla`, `perfis` e a leitura de mandatos; o botão refaz a entrada e abre o Guia quando a consulta volta; os caminhos da trava (perfil e mandato, Legisla, sem perfil, `semEquipe`, sem a marca) seguem como antes; ordem perfil → consentimento no aceite e trava de perfil em `membros_criar` seguem mortas para os mutantes.

**Issues found**: nenhum.

**Next steps**: o orquestrador aplica a rastreabilidade acima em `spec.md` e o Handoff em `STATE.md`. Push, merge e aplicação da migration seguem dependendo de go-ahead explícito; antes, conferir a Observação 2.

---

## Lessons distilled

Nenhuma lição nova: a rodada 3 é um PASS limpo (nenhum mutante sobrevivente, nenhuma lacuna de precisão, nenhum AC sem evidência, nenhum `SPEC_DEVIATION`). As candidatas L-033 a L-037 seguem candidatas: a promoção exige recorrência em 2 features distintas, e resolver o gap na mesma feature não conta. As lições confirmadas foram seguidas, sem penalidade: L-019 (cada guarda isolada; R3-M11 e R3-M12 morrem cada um num teste próprio, `tests/legado-acesso.test.ts:433` e `:342`) e L-032 (cada pré-checagem da trava tem teste com a carga falhando, `tests/legado-acesso.test.ts:360,391,409`).

---

## Cleanup

Junctions de `node_modules` dos dois worktrees de scratch desfeitas com `[System.IO.Directory]::Delete(<junction>, $false)` (o `node_modules` real segue intacto); worktrees `r3gate` e `r3mut` removidos com `git worktree remove --force` e `git worktree prune`. Servidor da porta 3100 parado (porta livre). `git status --porcelain` da árvore real igual à linha de base capturada antes de qualquer trabalho de sensor, exceto este `validation.md`.
