# Primeiro Acesso e Login só com Google Validation

**Date**: 2026-11-10
**Rodada**: 2 de no máximo 3
**Spec**: `.specs/features/primeiro-acesso-google/spec.md` (com as 4 Assumptions novas da rodada 1)
**Diff range**: superfície completa `246f853..4084295`; foco da rodada `4ea56e3..4084295` (T17 `d0080a5`, T18 `3055bdc`, T19 `4084295` e o registro da spec `2bbd33d`)
**Verifier**: sub-agente independente, novo (autor ≠ verificador; não herda o Verifier da rodada 1 nem quem corrigiu)

## Validation: primeiro-acesso-google - FAIL ❌

Os 5 itens da rodada 1 estão resolvidos e os 57 ACs têm evidência. O FAIL vem de um mutante sobrevivente (M8, GAP-R2-1, Minor): a falha da consulta de `equipe_legisla` no Guia não tem teste em nenhuma camada. Há ainda uma lacuna de precisão nova da mesma família (SP-R2-1, Minor).

---

## Reverificação dos gaps da rodada 1

Caminhos relativos a `plataforma/`.

| Gap | O que a spec define agora | Código atual | Teste que afirma o resultado da spec | Prova independente desta rodada | Resultado |
| --- | ------------------------- | ------------ | ------------------------------------ | ------------------------------- | --------- |
| GAP-1 (PAG-02.1, convite) | Assumption "Ordem das checagens no aceite do convite": sem perfil → `erro:'perfil'` antes do consentimento; a pessoa não vê a etapa de consentimento do convite | `supabase/migrations/20261109120000_perfis.sql:175-180` (perfil em 175-177, consentimento em 178-180); `app/convite/Convite.tsx:129-134` leva `perfil` a `/primeiro-acesso?volta=convite` | `tests/sql-perfil-trava.test.ts:99` (`{ok:false, erro:'perfil'}`, convite não usado, nada no histórico); `:85` (e-mail e `ja_membro` ainda respondem antes); `:125` (depois de `perfil_salvar` o mesmo convite é aceito); `e2e/convite-perfil.spec.ts:57` (conta nova: `viuConsentimento` nulo antes e depois, `consentimentos()` vazio, aceite conclui na volta); mock na ordem do banco em `e2e/convite-api.ts:59-63` | Sonda no PGlite (script próprio fora da árvore): conta nova recebe `perfil`, nenhum consentimento gravado; `perfil_salvar` grava só `2026-11`; o aceite seguinte passa | ✅ Resolvido |
| GAP-2 (PAG-02.2, banco) | Toda porta de entrada em mandato exige perfil, exceto a equipe Legisla | `perfis.sql:132-142` (`membros_criar` com `and private.tem_perfil()` em 141) | `tests/sql-perfil-trava.test.ts:187` (sonda S1: depois de `excluir_meus_dados`, reinserir como `coordenacao` dá 42501 e `membros` fica vazio); `:202` (Legisla segue dispensada); `:231` (a política é a de `20261106130000` mais só `tem_perfil`) | Sonda S1 reproduzida no PGlite: reinserção em `membros` e novo mandato dão 42501; convite devolve `perfil`; depois de gravar o perfil de novo a entrada volta a passar | ✅ Resolvido |
| SP-3 (Guia, consulta falha) | Assumption "Falha ao consultar o perfil no Guia": caixa "Não foi possível carregar seus dados. Tente de novo." com "Tentar de novo"; nunca manda ao formulário | `public/legacy/acesso.js:56-68` (caixa `#erroPerfil`, `role="alert"`, botão que refaz `App.entrou`), `:73-78` (`try`/`catch` em volta das duas consultas) | `tests/legado-acesso.test.ts:360` (texto literal, `role`, botão, sem redirecionar, sem ler mandatos); `:373` (tentar de novo: falhando a caixa volta uma só, funcionando a caixa sai e o Guia abre); `e2e/guia-acesso.spec.ts:364,373` | Sensor (ver abaixo) | ✅ Resolvido para a consulta de `perfis`; ver GAP-R2-1 para a de `equipe_legisla` |
| SP-1 (PAG-06.3, categorias com 0) | Assumption "Categorias sem ninguém no Analytics": toda categoria, na ordem da spec, mesmo com 0 | `lib/admin/perfil.ts:37-44` (linha 40 sem filtro) | `tests/admin-perfil.test.ts:19,33,81` (listas completas com 0 na ordem da spec); `e2e/admin-analytics-perfil.spec.ts:82` (rótulos em ordem e "0 · 0%") | Sensor M10 | ✅ Resolvido |
| SP-2 (PAG-06.3, porcentagem) | Assumption "Porcentagem no Analytics": arredondada por categoria; a soma pode dar 99 ou 101 | `perfil.ts:43` (`Math.round` por categoria) | `tests/admin-perfil.test.ts:39` (67 e 33), `:44` (33+33+33 = 99 e quantidades somam 3) | Sensor M11, M12 | ✅ Resolvido |

---

## Sondas no banco (PGlite, script próprio fora da árvore real)

Script em `scratchpad/r2-sondas/sondas.test.ts`, importando `tests/sql-ambiente.ts` de um worktree de scratch em `4084295`. 5/5 passaram.

| Sonda | Resultado |
| ----- | --------- |
| S1: com perfil cria o mandato e entra como `coordenacao`; `excluir_meus_dados()`; reinserir em `membros` como `coordenacao` | 42501 (RLS). Criar outro mandato: 42501. Aceitar convite: `{ok:false, erro:'perfil'}`. Depois de `perfil_salvar` de novo, a entrada no próprio mandato vazio volta a passar |
| Ordem real do aceite, conta nova sem consentimento e sem perfil | `{ok:false, erro:'perfil'}`, nenhum consentimento gravado; `perfil_salvar` grava `2026-11`; o aceite seguinte devolve `ok:true, ja_membro:false` |
| Regras do convite com a nova ordem (conta sem perfil) | Convite usado, vencido e cancelado: `invalido`; e-mail errado: `email`; membro sem perfil e sem consentimento: `ja_membro:true`. Nenhuma regra mudou de resposta |
| Equipe Legisla sem consentimento | `consentimento` (dispensada do perfil, não do consentimento); com consentimento aceita sem perfil |
| `admin_membro_adicionar` (admin da Legisla) para conta sem perfil | Inclui, como na rodada 1. Ação deliberada da equipe Legisla; segue como observação, não gap |

Outros caminhos que criam `membros` ou `mandatos`, conferidos nas migrations: `mandatos_criar` (`perfis.sql:123-126`, com `tem_perfil`), `membros_criar` (`perfis.sql:132-142`), `convite_aceitar` (`perfis.sql:148-189`), `entrar_com_codigo` (sem execução para `authenticated` desde `20261106120000_convites_equipe.sql:507`), `admin_membro_adicionar` (`20261105140000_admin_mandatos_gestao.sql:56-79`, só admin da Legisla). `membros` não tem grant de `update` (`20261016120000_schema_inicial.sql:198`). Nenhuma outra porta.

---

## Spec-Anchored Acceptance Criteria (57 ACs, evidência atual em `4084295`)

Legenda: ✅ PASS · ❌ GAP · ⚠️ lacuna de precisão da spec. Caminhos relativos a `plataforma/`. Arquivos fora do diff desta rodada (`git diff --stat 8609ccc..4084295` lista só os 15 tocados) mantêm as linhas da rodada 1; conferi uma amostra (`PrimeiroAcesso.tsx`, `lib/perfil/*`, `SecaoPerfil.tsx`, `perfil_resumo.sql`) e as linhas batem. As linhas dos arquivos alterados (`perfis.sql`, `acesso.js`, testes) foram refeitas.

### PAG-01 Entrar só com Google

| AC | Resultado definido pela spec | Código | Teste + asserção | Resultado |
| -- | ---------------------------- | ------ | ---------------- | --------- |
| 01.1 | Só "Entrar com Google" no convite, no Guia e no `/admin` | `app/convite/FormularioConta.tsx:67-79`; `public/legacy/acesso.js:33-42`; `app/primeiro-acesso/PrimeiroAcesso.tsx:176-192` | `e2e/convite-conta.spec.ts:46`; `e2e/guia-acesso.spec.ts:287`; `e2e/admin-acesso.spec.ts:33`; `e2e/primeiro-acesso.spec.ts:50` | ✅ |
| 01.2 | Sem senha, "Criar conta" ou "Entrar com e-mail" | `acesso.js:41-42` (remove abas, campos, caixa e botões antes de `App.iniciar`) | `e2e/guia-acesso.spec.ts:287`; `e2e/convite-conta.spec.ts:46`; `e2e/admin-acesso.spec.ts:33,98,116` | ✅ |
| 01.3 | Volta do Google grava `legisla.tok` e segue o fluxo | `PrimeiroAcesso.tsx:102-106`; `Convite.tsx:160-166` | `e2e/primeiro-acesso.spec.ts:67`; `e2e/convite-conta.spec.ts:73`; `e2e/admin-acesso.spec.ts:81` | ✅ |
| 01.4 | "Não foi possível entrar com o Google. Tente de novo." e botão mantido | `PrimeiroAcesso.tsx:17,106`; `acesso.js:32,44-48` | `e2e/primeiro-acesso.spec.ts:76`; `e2e/convite-conta.spec.ts:105`; `e2e/admin-acesso.spec.ts:89`; `e2e/guia-acesso.spec.ts:324`; `tests/legado-acesso.test.ts:425` | ✅ |
| 01.5 | Link do convite guardado e concluído na volta | `FormularioConta.tsx:68-71`; `Convite.tsx:160-166` | `e2e/convite-conta.spec.ts:73` | ✅ |
| 01.6 | Nenhuma funcionalidade envia e-mail | `acesso.js:35-36` (cadastro com senha, único gatilho de e-mail, sem caminho) | `tests/legado-acesso.test.ts:453` (varredura de `app/`, `lib/`, `acesso.js`); `e2e/guia-acesso.spec.ts:311` | ✅ |

### PAG-02 Cadastro de perfil no primeiro acesso

| AC | Resultado definido pela spec | Código | Teste + asserção | Resultado |
| -- | ---------------------------- | ------ | ---------------- | --------- |
| 02.1 | Sem perfil (fora da Legisla) → formulário antes de qualquer outra tela do Guia, da Área do mandato ou do aceite | Guia `acesso.js:70-81`; `/mandato` `app/mandato/Casca.tsx:57-60`; convite `perfis.sql:175-180` + `Convite.tsx:129-134` | `tests/legado-acesso.test.ts:316,405`; `e2e/guia-acesso.spec.ts:344`; `e2e/mandato-perfil.spec.ts:25`; `tests/sql-perfil-trava.test.ts:99` (`erro:'perfil'` para conta nova); `e2e/convite-perfil.spec.ts:41,50,57` (`viuConsentimento` nulo) | ✅ (GAP-1 resolvido) |
| 02.2 | Sem perfil, impedir Guia, Área do mandato e aceite | UI acima; banco `perfis.sql:123-126` (`mandatos_criar`), `:132-142` (`membros_criar`), `:175-177` (`convite_aceitar`) | `tests/sql-perfil-trava.test.ts:75` (perfil, convite não consumido), `:149` (42501), `:187` (sonda S1, 42501); `tests/legado-acesso.test.ts:316` | ✅ (GAP-2 resolvido) |
| 02.3 | 7 campos | `PrimeiroAcesso.tsx:248-278` | `e2e/primeiro-acesso.spec.ts:86` | ✅ |
| 02.4 | "Sim" pede o tempo nas 5 faixas | `PrimeiroAcesso.tsx:272-278`; `lib/perfil/opcoes.ts:26-35` | `e2e/primeiro-acesso.spec.ts:102`; `tests/sql-perfil.test.ts:202` | ✅ |
| 02.5 | "Não" grava `Não atuo na política` sem tempo | `lib/perfil/validacao.ts:70` | `e2e/primeiro-acesso.spec.ts:194` (`p_atua:false, p_tempo:null`); `tests/sql-perfil.test.ts:202` | ✅ |
| 02.6 | 8 gêneros e 6 raças com os rótulos da spec | `opcoes.ts:5-23` | `e2e/primeiro-acesso.spec.ts:86` (listas literais); `tests/sql-perfil.test.ts:187` | ✅ |
| 02.7 | Nome do Google preenchido e editável | `PrimeiroAcesso.tsx:43-56` | `e2e/primeiro-acesso.spec.ts:112,119` | ✅ |
| 02.8 | Vazio ou caixa desmarcada → "Preencha todos os campos e aceite o tratamento dos dados para continuar." | `validacao.ts:6,55-61` | `e2e/primeiro-acesso.spec.ts:126,135,145` (cada guarda isolada) | ✅ |
| 02.9 | "Informe seu nome completo." | `validacao.ts:7,63-64`; `perfis.sql:69-71` | `e2e/primeiro-acesso.spec.ts:155`; `tests/sql-perfil.test.ts:140` | ✅ |
| 02.10 | "Informe uma data de nascimento válida." | `validacao.ts:8,35-43`; `perfis.sql:72-82` | `e2e/primeiro-acesso.spec.ts:165,230`; `tests/sql-perfil.test.ts:150` | ✅ |
| 02.11 | "Informe um telefone com DDD." | `validacao.ts:9,29,68`; `perfis.sql:89-91` | `e2e/primeiro-acesso.spec.ts:174`; `tests/sql-perfil.test.ts:165` | ✅ |
| 02.12 | Grava perfil e consentimento com a versão do perfil e segue | `perfis.sql:100-107` | `tests/sql-perfil.test.ts:104,113,118`; `tests/sql-perfil-trava.test.ts:125`; `e2e/primeiro-acesso.spec.ts:185` | ✅ |
| 02.13 | Falha mantém os dados: "Não foi possível salvar. Tente de novo." | `lib/perfil/api.ts:9`; `PrimeiroAcesso.tsx:213-236` | `e2e/primeiro-acesso.spec.ts:202,213,221` | ✅ |
| 02.14 | Duplo envio → um único perfil | `perfis.sql:100-103` (`on conflict do nothing`) | `tests/sql-perfil.test.ts:130`; `e2e/primeiro-acesso.spec.ts:255` | ✅ |
| 02.15 | Com perfil, sem formulário | `lib/perfil/fluxo.ts:14-15`; `acesso.js:79-85` | `e2e/primeiro-acesso.spec.ts:265`; `tests/legado-acesso.test.ts:334`; `e2e/guia-acesso.spec.ts:350` | ✅ |
| 02.16 | `equipe_legisla` sem formulário nem bloqueio | `perfis.sql:43-47` (`tem_perfil`), `:141`; `acesso.js:80`; `Casca.tsx:57` | `tests/perfil-fluxo.test.ts:19`; `tests/sql-perfil.test.ts:255`; `tests/sql-perfil-trava.test.ts:138,172,202`; `tests/legado-acesso.test.ts:342`; `e2e/guia-acesso.spec.ts:358`; `e2e/mandato-perfil.spec.ts:37` | ✅ |

### PAG-03 Perfil protegido no banco

| AC | Resultado definido pela spec | Código | Teste + asserção | Resultado |
| -- | ---------------------------- | ------ | ---------------- | --------- |
| 03.1 | Tabela própria, `user_id` único | `perfis.sql:15-26,38-39` | `tests/sql-perfil.test.ts:75` | ✅ |
| 03.2 | Grava só com o `user_id` da sessão | `perfis.sql:60,100-101` | `tests/sql-perfil.test.ts:104` | ✅ |
| 03.3 | Gravar perfil de outra pessoa → erro de permissão | `perfis.sql:37-39` | `tests/sql-perfil.test.ts:86` (`permission denied`) | ✅ |
| 03.4 | Legisla (qualquer papel) lê todos | `perfis.sql:33-35` | `tests/sql-perfil.test.ts:246` | ✅ |
| 03.5 | Fora da Legisla, perfil de outra pessoa → zero linhas | `perfis.sql:33-35` | `tests/sql-perfil.test.ts:238` | ✅ |
| 03.6 | Lê o próprio | `perfis.sql:35` | `tests/sql-perfil.test.ts:232` | ✅ |
| 03.7 | Fora da lista ou do formato → recusa | `perfis.sql:17-25,69-94` | `tests/sql-perfil.test.ts:140-185` | ✅ |
| 03.8 | Não atua com tempo, ou atua sem tempo → recusa | `perfis.sql:25,95-98` | `tests/sql-perfil.test.ts:215` | ✅ |
| 03.9 | Conta excluída apaga o perfil | `perfis.sql:16` (`on delete cascade`) | `tests/sql-perfil-trava.test.ts:272` | ✅ |
| 03.10 | "Excluir meus dados" apaga o perfil | `perfis.sql:204` | `tests/sql-perfil-trava.test.ts:241,253` | ✅ |

### PAG-04 Pergunta sobre a equipe e escolha do mandato

| AC | Resultado definido pela spec | Código | Teste + asserção | Resultado |
| -- | ---------------------------- | ------ | ---------------- | --------- |
| 04.1 | Pergunta literal com "Sim, já criou" e "Ainda não" | `PrimeiroAcesso.tsx:162-164`; `fluxo.ts:16`; `acesso.js:84` | `e2e/primeiro-acesso.spec.ts:313,321`; `tests/perfil-fluxo.test.ts:39`; `tests/legado-acesso.test.ts:391`; `e2e/guia-acesso.spec.ts:388` | ✅ |
| 04.2 | "Sim" abre as instruções | `PrimeiroAcesso.tsx:163` | `e2e/primeiro-acesso.spec.ts:331` | ✅ |
| 04.3 | 3 passos e campo de colar | `PrimeiroAcesso.tsx:304-333` | `e2e/primeiro-acesso.spec.ts:331` | ✅ |
| 04.4 | Link válido abre `/convite` com o token | `lib/perfil/link.ts:5-10`; `PrimeiroAcesso.tsx:311-316` | `tests/perfil-fluxo.test.ts:54,59,63`; `e2e/primeiro-acesso.spec.ts:351,359` | ✅ |
| 04.5 | "Este não parece um link de convite. Peça a quem convidou para enviar de novo." | `PrimeiroAcesso.tsx:304,314` | `tests/perfil-fluxo.test.ts:68-84`; `e2e/primeiro-acesso.spec.ts:367,376` | ✅ |
| 04.6 | "Ainda não" abre o cadastro do mandato | `PrimeiroAcesso.tsx:90-94`; `acesso.js:82-85` | `e2e/primeiro-acesso.spec.ts:386,393`; `tests/legado-acesso.test.ts:398`; `e2e/guia-acesso.spec.ts:393` | ✅ |
| 04.7 | Cadastro concluído → `coordenacao` e Guia | `perfis.sql:123-126,132-142` | `tests/sql-perfil-trava.test.ts:155` (`papel_no_mandato = coordenacao`); `tests/legado-acesso.test.ts:181`; `tests/sql-membros.test.ts:448` | ✅ |
| 04.8 | Por convite: sem pergunta, aceite depois do perfil | `fluxo.ts:15`; `Convite.tsx:155-157`; nova ordem `perfis.sql:175-180` | `tests/perfil-fluxo.test.ts:47`; `e2e/primeiro-acesso.spec.ts:399,406`; `e2e/convite-perfil.spec.ts:57,75`; `tests/sql-perfil-trava.test.ts:125` | ✅ (a nova ordem não muda o fluxo; agora sem a etapa de consentimento duplicada) |
| 04.9 | Já em mandato: sem pergunta | `fluxo.ts:15` | `e2e/primeiro-acesso.spec.ts:414,420`; `tests/perfil-fluxo.test.ts:31,35` | ✅ |
| 04.10 | Voltar à pergunta | `PrimeiroAcesso.tsx:331` | `e2e/primeiro-acesso.spec.ts:343` | ✅ |

### PAG-05 Remoção do login por senha

| AC | Resultado definido pela spec | Código | Teste + asserção | Resultado |
| -- | ---------------------------- | ------ | ---------------- | --------- |
| 05.1 | Sem caminho para `signup` e `grant_type=password` | `acesso.js:34-39` | `tests/legado-acesso.test.ts:413,419,453`; `e2e/guia-acesso.spec.ts:311`; `e2e/admin-acesso.spec.ts:109` | ✅ |
| 05.2 | Sem "Confirme o e-mail enviado e faça login"; `app/` e `lib/` sem `email_not_confirmed` | `lib/convites/erros.ts` | `tests/legado-acesso.test.ts:453`; `e2e/convite-conta.spec.ts:59`; `e2e/guia-acesso.spec.ts:301,306` | ✅ |
| 05.3 | Renova pelo `refresh_token` | `lib/admin/sessao.ts`; Guia `Store.sessao` (`acesso.js:43-48` só troca o texto do erro) | `tests/legado-acesso.test.ts:432`; `e2e/guia-acesso.spec.ts:330`; `e2e/admin-acesso.spec.ts:163` | ✅ |

### PAG-06 Analytics do perfil

| AC | Resultado definido pela spec | Código | Teste + asserção | Resultado |
| -- | ---------------------------- | ------ | ---------------- | --------- |
| 06.1 | `admin` e `leitura` veem a seção | `app/admin/analytics/page.tsx`; `perfil_resumo.sql:20` | `e2e/admin-analytics-perfil.spec.ts:52,63`; `tests/sql-perfil-resumo.test.ts:145` | ✅ |
| 06.2 | Total e cadastros por mês, no máximo 12 | `perfil_resumo.sql:38-50`; `SecaoPerfil.tsx:49-59` | `tests/sql-perfil-resumo.test.ts:113,122,134`; `tests/admin-perfil.test.ts:114,124`; `e2e/admin-analytics-perfil.spec.ts:52` | ✅ |
| 06.3 | Número e % inteira de **toda** categoria da lista, mesmo com 0 | `lib/admin/perfil.ts:37-44` (linha 40: todas as categorias com `?? 0`; linha 43: `Math.round` por categoria) | `tests/admin-perfil.test.ts:19` (8 gêneros, 0 nas vazias), `:33`, `:39`, `:44` (soma 99), `:65`, `:81` (as 4 distribuições completas); `e2e/admin-analytics-perfil.spec.ts:69,82` ("0 · 0%" na tela, ordem da spec) | ✅ (SP-1, SP-2 resolvidos) |
| 06.4 | `Prefiro não informar` como categoria própria | `perfil.ts:40`; `perfil_resumo.sql` (chave `nao_informar`) | `tests/admin-perfil.test.ts:51` (última posição, com quantidade); `:81` (aparece com 0); `e2e/admin-analytics-perfil.spec.ts:104`; `tests/sql-perfil-resumo.test.ts:77,82` | ✅ |
| 06.5 | Faixas etárias na data da consulta | `perfil_resumo.sql:28-33` | `tests/sql-perfil-resumo.test.ts:92`; `tests/admin-perfil.test.ts:57` | ✅ |
| 06.6 | Sem nome, e-mail, telefone nem nascimento | `perfil_resumo.sql:13-58`; `SecaoPerfil.tsx:8-16` | `e2e/admin-analytics-perfil.spec.ts:122`; `tests/sql-perfil-resumo.test.ts:64`; `tests/admin-perfil.test.ts:128` | ✅ |
| 06.7 | Função só com contagens | `perfil_resumo.sql:13-58` | `tests/sql-perfil-resumo.test.ts:64` | ✅ |
| 06.8 | Fora da Legisla → erro de permissão | `perfil_resumo.sql:20-22` | `tests/sql-perfil-resumo.test.ts:152` | ✅ |
| 06.9 | "Ainda não há perfis cadastrados." sem gráfico vazio | `perfil.ts:24,47`; `SecaoPerfil.tsx:46` | `tests/admin-perfil.test.ts:109`; `e2e/admin-analytics-perfil.spec.ts:131` | ✅ |
| 06.10 | "Não foi possível carregar o perfil. Tente de novo." sem afetar o resto | `SecaoPerfil.tsx:26-30,40-45` | `e2e/admin-analytics-perfil.spec.ts:137` | ✅ |
| 06.11 | Título do que mede e categoria em texto | `SecaoPerfil.tsx:9-16` | `e2e/admin-analytics-perfil.spec.ts:110,146` | ✅ |
| 06.12 | Soma das categorias = total | `perfil.ts:40-41` (chave desconhecida anexada) | `tests/admin-perfil.test.ts:72,101`; `tests/sql-perfil-resumo.test.ts:105` | ✅ |

**Status**: 57/57 ACs com evidência `file:line` e asserção do resultado da spec. Os dois gaps abertos desta rodada (abaixo) não reprovam um AC literal: um é um mutante sobrevivente na Assumption "Falha ao consultar o perfil no Guia" e o outro uma lacuna de precisão da mesma família.

---

## Discrimination Sensor

Worktree de scratch próprio fora da árvore real (`git worktree add --detach <scratchpad>/r2mut 4084295`), `node_modules` por junction. Um script aplica cada mutante (o padrão precisa casar exatamente uma vez), roda só os arquivos de teste que cobrem o trecho (`node --test <arquivo>`), restaura o arquivo e, no fim, confere `git status --porcelain` do scratch (vazio). O mutante de tela (M15) rodou no worktree do gate, com o servidor da porta 3100, e foi desfeito com `git checkout` no scratch.

| # | Arquivo:linha | Mutação | Teste que matou | Resultado |
| - | ------------- | ------- | --------------- | --------- |
| M1 | `perfis.sql:175-180` | Volta a ordem antiga: consentimento antes de perfil | `tests/sql-perfil-trava.test.ts:85,99,125` (comportamento) e `:221` (fonte) | ✅ Morto |
| M2 | `perfis.sql:141` | `membros_criar` sem `private.tem_perfil()` | `tests/sql-perfil-trava.test.ts:187` (sonda S1) e `:231` (fonte) | ✅ Morto |
| M3 | `perfis.sql:141` | `membros_criar` exige linha em `perfis` (tira a dispensa da Legisla) | `tests/sql-perfil-trava.test.ts:202` e `:231` | ✅ Morto |
| M4 | `perfis.sql:178-180` | Aceite sem checar consentimento (perfil basta) | `tests/sql-perfil-trava.test.ts:108` e `:221` | ✅ Morto |
| M5 | `perfis.sql:140` | `membros_criar` sem `mandato_sem_membros` | `tests/sql-membros.test.ts:422` (B06) | ✅ Morto |
| M6 | `perfis.sql:168,175` | Perfil checado antes de `ja_membro` | `tests/sql-perfil-trava.test.ts:85` (membro sem perfil recebe `ja_membro`) e `:221` | ✅ Morto |
| M7 | `acesso.js:78` | Falha da consulta manda ao formulário de perfil | `tests/legado-acesso.test.ts:360,373` | ✅ Morto |
| M8 | `acesso.js:73-77` | Consulta de `equipe_legisla` fora do `try` (a falha dela deixa a tela em branco) | nenhum | ❌ **Sobreviveu** → GAP-R2-1 |
| M9 | `acesso.js:64` | "Tentar de novo" não tira a caixa | `tests/legado-acesso.test.ts:373` | ✅ Morto |
| M10 | `lib/admin/perfil.ts:40` | Analytics omite as categorias com 0 | `tests/admin-perfil.test.ts:19,33,39,44,51,81,101` | ✅ Morto |
| M11 | `perfil.ts:43` | `Math.floor` no lugar do arredondamento por categoria | `tests/admin-perfil.test.ts:19,39` | ✅ Morto |
| M12 | `perfil.ts:43` | Porcentagens forçadas a somar 100 (ajuste na maior categoria) | `tests/admin-perfil.test.ts:19,44` | ✅ Morto |
| M13 | `perfis.sql:138-139` | `membros_criar` sem exigir que a pessoa tenha criado o mandato | `tests/sql-membros.test.ts:448` (precisa do `comPerfil` de ASSESSORIA em `:450`) | ✅ Morto |
| M14 | `perfis.sql:137` | `membros_criar` aceita a primeira linha com qualquer papel | `tests/sql-membros.test.ts:448` | ✅ Morto |
| M15 | `acesso.js:61` | Caixa de erro criada mas invisível (`style.display='none'`) | `e2e/guia-acesso.spec.ts:364,373` | ✅ Morto |

Tentativa descartada: `cx.hidden=true` em `acesso.js:61` não muda o comportamento (a regra `.erro-perfil{display:grid}` de `acesso.js:149` vence o `[hidden]` do navegador), então é mutante equivalente e não entra na conta; foi trocado por M15.

**Sensor depth**: P0 (auth e integridade de dados), 15 mutações manuais nos arquivos corrigidos e vizinhos.
**Result**: 14/15 mortos, 1 sobrevivente (M8). ❌

Sobre os 4 testes de `sql-membros.test.ts` que ganharam `comPerfil`: com o perfil na preparação, cada um volta a isolar a guarda que afirma (L-019). M13 e M14 só morrem em `:448` porque `:450` dá perfil à segunda conta; sem isso a falta de perfil recusaria a inserção e mascararia a remoção da guarda. M5 morre em `:422`. Nas sondas S-1 (`:378`), S-3 (`:406`) e "saiu por conta própria" (`:437`) a recusa vem da guarda de quem criou o mandato e da leitura do mandato pela RLS (quem saiu não lê mais o mandato), não da falta de perfil. Nenhum desses testes foi enfraquecido.

---

## Gaps abertos nesta rodada

### GAP-R2-1 (Minor, mutante sobrevivente M8): falha da consulta de `equipe_legisla` no Guia sem teste

- **Onde**: `public/legacy/acesso.js:73-78`. O código atual está certo: as duas consultas (`equipe_legisla` e `perfis`) estão no mesmo `Promise.all` dentro do `try`, então a falha de qualquer uma mostra a caixa.
- **O que falta**: nenhum teste faz a consulta de `equipe_legisla` falhar. O harness de unidade só falha `perfis` (`tests/legado-acesso.test.ts:292,300`, opção `falhaPerfil`) e o mock do e2e sempre responde 200 para `equipe_legisla` (`e2e/guia-acesso.spec.ts:98`). Tirar essa consulta do `try` (M8) passa em todos os testes, e a pessoa veria a tela em branco que a Assumption "Falha ao consultar o perfil no Guia" proíbe. A própria T18 (`tasks.md`, Done when) diz "Falha na consulta de `equipe_legisla` ou `perfis` mostra uma caixa", e a Área do mandato já tem o teste equivalente (`e2e/mandato-perfil.spec.ts:50`).
- **Correção sugerida**: opção `falhaLegisla` no harness `entrando` de `tests/legado-acesso.test.ts` e estado `legisla: 'falha'` (500) no mock de `e2e/guia-acesso.spec.ts:98`; um teste em cada camada afirmando a caixa com o texto literal, nenhum redirecionamento e nenhuma leitura de `membros?select=papel`. Sem mudança de código de produção.

### SP-R2-1 (Minor, lacuna de precisão da spec): falha da leitura de mandatos dentro da trava do Guia deixa a tela em branco

- **Onde**: `public/legacy/acesso.js:84`. Com perfil e sem a marca "Ainda não", o override lê `Store.meusMandatos()` antes de `_entrou` mostrar o `#app`; essa leitura fica fora do `try` de `:73-78`. Se ela falha (`Nuvem.rest` lança em resposta não 2xx, `nucleo.js:65`), `App.entrou` rejeita, `iniciar.js:1` chama `App.iniciar()` sem `catch`, e `#entrada` e `#app` seguem ocultos: tela em branco, sem mensagem nem nova tentativa.
- **Por que é lacuna de spec e não AC reprovado**: a Assumption da rodada 1 cobre só "Falha ao consultar o perfil no Guia"; nenhuma linha da spec diz o que a pessoa vê quando a leitura de mandatos da mesma trava falha. Antes da feature a mesma falha deixava o `#app` visível (o `_entrou` original tira o `oculto` antes de ler os mandatos, `app.js:69-71`), então o caso piorou com a T10. É a mesma família de SP-3 (lição L-037).
- **Decisão pedida ao orquestrador ou ao dono do produto**: estender a Assumption à leitura de mandatos da trava (mesma caixa e mesmo "Tentar de novo"), e então incluir `Store.meusMandatos()` de `:84` no tratamento de erro, com teste de unidade e e2e.

---

## Gate Check

- **Unidade e SQL** (worktree limpo em `4084295`): `npm test` em 2 rodadas seguidas: 1107/1107 e 1107/1107 (0 falhas, 0 pulados, ~30 s cada).
- **Tipos**: `npx tsc --noEmit` sem erro.
- **e2e** (servidor próprio `next dev --webpack -p 3100` no mesmo worktree, `playwright.isolado.config.ts` não versionado, 4 workers como a rodada do worker): `convite-*`, `mandato-*`, `guia-acesso*`, `primeiro-acesso*`, `admin-*`: **345 passaram, 2 falharam** (7,9 min). As 2 falhas são exatamente as relatadas pelo worker na T19.
- **Contagem**: 1098 na rodada 1 → 1107 (+6 em `sql-perfil-trava`, +1 em `legado-acesso`, +2 em `admin-perfil`); e2e +1 em `convite-perfil`, +1 em `guia-acesso`, +1 em `admin-analytics-perfil`. Nenhum teste removido. Os testes cuja afirmação mudou (`sql-perfil-trava.test.ts:85,125`, `legado-acesso.test.ts:360`, `admin-perfil.test.ts:81`, `guia-acesso.spec.ts:364`) passaram a afirmar o resultado que a spec atualizada define; as afirmações antigas que seguem válidas (não redireciona, não lê mandatos, convite não consumido) ficaram.

### Flakiness (2 e2e do `/admin`, fora desta feature)

| Teste | Falha observada | Rodadas | Causa |
| ----- | --------------- | ------- | ----- |
| `e2e/admin-equipe.spec.ts:245` (rebaixar a si mesmo recarrega a tela) | `expect.poll` de `:251` esgota os 5 s padrão sem ver a nova leitura de `equipe_legisla` (recebe 1, espera mais que 1) | Rodada completa com 4 workers: falhou. Sozinho com 1 worker: passou. `--repeat-each=4` com 4 workers: falhou 1 de 4 | A tela faz `location.reload()` (`app/admin/equipe/page.tsx:115`); no `next dev` com 4 workers em paralelo o recarregamento mais a nova leitura passam de 5 s. Instabilidade de tempo do teste sob carga, não do produto. A feature só removeu código de `Sessao.tsx` (nenhuma chamada nova no carregamento) |
| `e2e/admin-transversal.spec.ts:139` (leitura vê as 5 telas sem botão que altera dados) | `page.goto('/admin/analytics')` aborta com `net::ERR_ABORTED` no meio da varredura das 5 telas | Rodada completa com 4 workers: falhou. Sozinho: passou. `--repeat-each=4` com 4 workers: 4/4 passaram | Navegação interrompida no servidor de desenvolvimento sob carga (o log do servidor mostra só `200` para `/admin/analytics`, sem erro de compilação). Intermitente, não reproduzida fora da rodada completa |

**Conclusão**: as duas falhas são instabilidade de tempo do `next dev` sob 4 workers, em testes do `painel-admin`, e não dependem do código desta feature. Correções sugeridas fora desta feature: `expect.poll(..., { timeout: 15_000 })` em `admin-equipe.spec.ts:251`; em `admin-transversal.spec.ts:63`, esperar a tela anterior ficar quieta (`waitForLoadState('networkidle')`) antes do próximo `goto`, ou rodar os e2e do `/admin` com 1 worker.

---

## Code Quality

| Princípio | Status |
| --------- | ------ |
| Minimum code | ✅ (`perfil.ts` troca um `filter` por `?? 0`; `acesso.js` acrescenta só a caixa e o `try`) |
| Surgical changes | ✅ (`app.js`, `nucleo.js` e `legacyBody.ts` intactos: AD-003) |
| No scope creep | ✅ |
| Matches patterns | ✅ (erro como dado no aceite, AD-008; caixa com as classes `erro-cx` e `bt pri` do Guia) |
| Spec-anchored outcome check | ✅ nos 57 ACs; ⚠️ SP-R2-1 |
| Per-layer Coverage Expectation | ❌ GAP-R2-1: o ramo de erro da consulta de `equipe_legisla` não tem teste em nenhuma camada |
| Every test maps to a spec requirement | ✅ |
| Documented guidelines followed | ⚠️ `plataforma/CLAUDE.md` diz "Mudanças de schema = nova migration com timestamp, nunca editar a existente"; a T17 editou `20261109120000_perfis.sql` em vez de criar uma nova (o Fix 1 e o Fix 2 da rodada 1 pediam migration nova). A edição só é segura porque a migration nunca saiu desta branch (`git log origin/main -- <arquivo>` vazio; a `main` aplica migrations por `migrations.yml`). Observação, não gap: antes do merge, confirmar que nenhum banco (produção ou prévia) já registrou a versão `20261109120000`, senão a versão corrigida nunca seria aplicada nele |

---

## Edge Cases

- [x] Fecha a aba no meio do perfil: nada guardado no navegador; gravação atômica (`tests/sql-perfil.test.ts:118`).
- [x] Convite já aceito, vencido ou cancelado: a nova ordem não muda a resposta, `invalido` vem antes do perfil (`perfis.sql:163-166`; sonda desta rodada com os três casos).
- [x] Perfil sem mandato e sem convite: pergunta (`e2e/primeiro-acesso.spec.ts:313`; `tests/legado-acesso.test.ts:391`).
- [x] Conta Google sem nome: nome vazio (`e2e/primeiro-acesso.spec.ts:119`).
- [x] Equipe Legisla por convite: aceita sem perfil (`tests/sql-perfil-trava.test.ts:138`); sem consentimento, recebe a etapa de consentimento do convite e não o formulário de perfil (`:108`).

---

## Observações (não são gaps)

1. **`admin_membro_adicionar`** segue incluindo conta sem perfil (sonda desta rodada). Ação deliberada da equipe Legisla admin; mesma leitura da rodada 1.
2. **Efeitos da nova ordem do aceite**: e-mail errado, `ja_membro`, convite inválido e limite seguem respondendo antes do perfil; consentimento segue exigido de quem tem perfil e da Legisla. Os mocks de `e2e/convite-api.ts:59-63` seguem a ordem do banco e `convite-conta.spec.ts:24` usa conta com perfil para a etapa de consentimento, que hoje só a equipe Legisla (dispensada) alcança.
3. **Aviso do Next 16.4**: o primeiro `next dev` não interativo para com o aviso de segurança conhecido (já registrado em `plataforma/CLAUDE.md`); a segunda tentativa sobe normalmente. Nenhuma atualização foi feita.

---

## Fix Plans

### Fix R2-1 (GAP-R2-1, Minor): teste da falha de `equipe_legisla` no Guia

- **Fix task**: em `tests/legado-acesso.test.ts`, campo `falhaLegisla` em `Pessoa` (`:292`) e no stub de `equipe_legisla`; teste "falha na consulta da equipe Legisla mostra a mesma caixa, sem formulário e sem ler os mandatos". Em `e2e/guia-acesso.spec.ts`, `legisla?: boolean | 'falha'` no `Estado` e resposta 500 em `:98`; teste equivalente ao de `:364`.
- **Verify**: com `Nuvem.rest('equipe_legisla…')` fora do `try` (M8) os dois testes falham; com o código atual passam.
- **Priority**: Minor.

### Fix R2-2 (SP-R2-1, Minor, depende de decisão)

- **Decisão**: a falha da leitura de mandatos na trava do Guia mostra a mesma caixa "Não foi possível carregar seus dados. Tente de novo."? (sugestão: sim, uma linha nova na Assumption "Falha ao consultar o perfil no Guia").
- **Fix task (se sim)**: em `acesso.js:84`, pôr `Store.meusMandatos()` sob o mesmo tratamento (`mostraErroPerfil`), com teste de unidade e e2e da leitura de mandatos falhando.

---

## Requirement Traceability Update

Para o orquestrador aplicar em `spec.md` (este Verifier só grava `validation.md`):

| Requirement | Status em `spec.md` | Novo status |
| ----------- | ------------------- | ----------- |
| PAG-01 | Verified (rodada 1) | ✅ Verified (rodada 2, sem regressão) |
| PAG-02 | Implemented, aguarda rodada 2 | ❌ Needs Fix (GAP-R2-1; SP-R2-1 aguarda decisão). GAP-1, GAP-2 e SP-3 resolvidos |
| PAG-03 | Verified (rodada 1) | ✅ Verified |
| PAG-04 | Verified, re-verificar a ordem do aceite | ✅ Verified (nova ordem conferida em banco, mock e tela) |
| PAG-05 | Verified (rodada 1) | ✅ Verified |
| PAG-06 | Implemented, aguarda rodada 2 | ✅ Verified (SP-1 e SP-2 resolvidos) |

---

## Histórico: o que mudou desde a rodada 1

| Item da rodada 1 | Correção | Situação na rodada 2 |
| ---------------- | -------- | -------------------- |
| GAP-1 (consentimento antes do perfil no convite) | T17 `d0080a5`: perfil antes de consentimento em `convite_aceitar`; mock do aceite na ordem do banco; e2e da conta nova | ✅ Resolvido; M1 morto por 3 testes de comportamento |
| GAP-2 (brecha em `membros_criar`) | T17: `and private.tem_perfil()` na política; sonda S1 virou teste | ✅ Resolvido; S1 reproduzida e barrada; M2 e M3 mortos |
| SP-3 (Guia em branco quando a consulta de perfil falha) | Spec: Assumption nova; T18 `3055bdc`: caixa com "Tentar de novo" | ✅ Resolvido para `perfis`; ❌ a falha de `equipe_legisla` ficou sem teste (GAP-R2-1); ⚠️ a leitura de mandatos da mesma trava ficou fora da decisão (SP-R2-1) |
| SP-1 (categorias com 0) | Spec: Assumption nova; T19 `4084295` | ✅ Resolvido; M10 morto |
| SP-2 (arredondamento) | Spec: Assumption nova; T19 | ✅ Resolvido; M11 e M12 mortos |
| Rastreabilidade de `spec.md` desatualizada | `2bbd33d`, T19 | ✅ Atualizada até a rodada 1; falta o resultado desta rodada (tabela acima) |
| Gate | 1098 → 1107 testes | ✅ 1107/1107 em 2 rodadas; e2e 345/347 com 2 falhas de tempo fora da feature |

---

## Summary

**Overall**: ❌ Not Ready (FAIL), por um mutante sobrevivente de severidade Minor.

**Spec-anchored check**: 57/57 ACs com evidência `file:line` e asserção do resultado da spec; os 5 itens da rodada 1 (GAP-1, GAP-2, SP-1, SP-2, SP-3) resolvidos com teste que afirma o resultado definido na spec. 1 lacuna de precisão nova (SP-R2-1).
**Sensor**: 14/15 mortos; M8 sobreviveu (GAP-R2-1).
**Gate**: `npm test` 1107/1107 em 2 rodadas; `tsc` sem erro; e2e 345/347 (2 falhas de tempo do `/admin` sob carga, não ligadas à feature).

**What works**: ordem perfil → consentimento no aceite, no banco, no mock e na tela; trava de perfil nas três portas (`mandatos_criar`, `membros_criar`, `convite_aceitar`) com a dispensa da Legisla; caixa de erro com "Tentar de novo" no Guia para a falha de `perfis`; Analytics com todas as categorias na ordem da spec e arredondamento por categoria; nenhuma regra antiga do convite mudou de resposta.

**Issues found**: GAP-R2-1 (Fix R2-1, só teste); SP-R2-1 (Fix R2-2, depende de decisão).

**Next steps**: executar o Fix R2-1, decidir o SP-R2-1 e rodar o Verifier na rodada 3 (última antes de escalar ao usuário).

---

## Lessons distilled

| Lição | Sinal | Origem | Efeito |
| ----- | ----- | ------ | ------ |
| L-032 [e2e] "When a UI pre-check depends on data that may fail to load, test the action with that load failed, so the fallback branch is pinned." | surviving_mutant | M8 / GAP-R2-1 | Segunda feature (`acesso-equipe-convites`, `primeiro-acesso-google`): **promovida a confirmed** pelo `lessons.py` |
| L-037 [spec] "Specify what the user sees and how to retry when a gating lookup fails, not only where the user must not be sent." | spec_precision_gap | SP-R2-1 | Nova evidência na mesma feature; segue candidate |

L-033 a L-037 não podem ser confirmadas nesta rodada: a promoção exige recorrência em 2 features distintas (`promote_threshold=2`) e é feita só pelo script; resolver o gap na mesma feature não conta. GAP-1, GAP-2, SP-1, SP-2 e SP-3 estão resolvidos com teste que os pegaria (M1, M2, M10, M11, M12 e M7 mortos), o que fica registrado aqui como evidência para quando recorrerem em outra feature. Nenhuma lição confirmada foi penalizada: L-019 foi seguida (os 4 testes de `sql-membros` com `comPerfil`, M13 e M14 mortos) e o M8 não é a falha que ela descreve.

---

## Cleanup

Worktrees de scratch (`gate` e `r2mut`, fora da árvore real) removidos com `git worktree remove --force`; as junctions de `node_modules` desfeitas antes com `[System.IO.Directory]::Delete(<junction>, $false)`; `node_modules` real intacto. Servidor da porta 3100 parado (porta livre). `git status --porcelain` da árvore real igual à linha de base capturada antes do sensor, exceto este `validation.md` e os arquivos de lições, gravados depois.
