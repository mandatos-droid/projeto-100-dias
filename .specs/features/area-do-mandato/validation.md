# Área do Mandato Validation

**Date**: 2026-11-10
**Spec**: `.specs/features/area-do-mandato/spec.md`
**Diff range**: `e50098f..85e3372` (T1 `f983b18` a T9 `85e3372`; base `e50098f` = docs da spec e das tasks), branch `feat/area-do-mandato`
**Verifier**: sub-agente independente, rodada 1 de 3 (autor ≠ verificador)

## Validation: area-do-mandato - FAIL ❌

O gate passa e o sensor matou 25/25 mutantes, mas um critério P1 (AMA-02.11, parte da aba Equipe) não é cumprido no texto da spec, o Edge Case "leitura do papel falha" não vale para a aba Dados, um Edge Case não tem teste e AMA-02.8 tem um desvio (UF) que a spec ainda não registra.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 `f983b18` | ✅ Done | casca com abas, rota, teclado, menu |
| T2 `609450a` | ✅ Done | `ProvedorLegado` + `lib/mandato/legado.ts` |
| T3 `205e3df` | ✅ Done | Visão geral |
| T4 `2ce31ea` | ✅ Done | Equipe e convites |
| T5 `67a830c` | ✅ Done | Dados + Zona de risco; ver GAP-2 (papel desconhecido) |
| T6 `8fcfaed` | ✅ Done | Minha conta, sem UF (SPEC_DEVIATION, GAP-4) |
| T7 `0ea8927` | ✅ Done | redirects 308, `volta=mandato`, hash guardado na volta do Google |
| T8 `afe257d` | ✅ Done | páginas e casca antigas removidas; migração caso a caso no corpo do commit |
| T9 `85e3372` | ✅ Done | AD-014 e Handoff no STATE.md |

---

## Spec-Anchored Acceptance Criteria

### AMA-01: Uma tela com abas dentro do Guia (P1)

| Critério | Outcome da spec | `file:line` + asserção | Result |
| -------- | --------------- | ---------------------- | ------ |
| 01.1 item "Área do mandato" no grupo Mandato, no lugar de "Configurações" | rótulo exato, `href="#/config"`, grupo Mandato, sem "Configurações" | `plataforma/e2e/area-mandato.spec.ts:34` - `toHaveAttribute('href', '#/config')`, `expect(grupos['Mandato']).toContain('Área do mandato')`, `not.toContainText('Configurações')` | ✅ PASS |
| 01.2 `#/config` mostra as 4 abas, Visão geral ativa | abas `Visão geral`, `Dados do mandato`, `Equipe e convites`, `Minha conta`; ativa = Visão geral | `plataforma/e2e/area-mandato.spec.ts:54` - `toHaveText(ROTULOS)` + `ativa(page, ABAS[0])`; `plataforma/tests/legado-acesso.test.ts:240` - `deepEqual(... ['true','false','false','false'])` | ✅ PASS |
| 01.3 `#/config/dados|equipe|conta` abre a aba | aba correspondente ativa | `plataforma/e2e/area-mandato.spec.ts:62` - `ativa(page, a)`; `plataforma/tests/legado-acesso.test.ts:251` - `equal(r.ativa, i)` | ✅ PASS |
| 01.4 clicar troca sem recarregar e atualiza o endereço | sem reload; hash da aba | `plataforma/e2e/area-mandato.spec.ts:75` - `toHaveURL(fim('#/config/dados'))` + marcador `__mesmaPagina` `toBe(true)`; `plataforma/tests/legado-acesso.test.ts:378` - `equal(w.location.hash, hash)` | ✅ PASS |
| 01.5 Voltar mostra a aba anterior | aba anterior ativa | `plataforma/e2e/area-mandato.spec.ts:87` - `goBack()` → `toHaveURL(fim('#/config/dados'))` + `ativa(ABAS[1])`, depois `#/config` + `ativa(ABAS[0])` | ✅ PASS |
| 01.6 aba desconhecida → Visão geral | `#/config/xyz` = Visão geral | `plataforma/e2e/area-mandato.spec.ts:70` - `ativa(page, ABAS[0])`; `plataforma/tests/legado-acesso.test.ts:258` - `equal(r.ativa, 0)` | ✅ PASS |
| 01.7 menu, cabeçalho e item ativo em todas as abas | item `.on` único em cada aba | `plataforma/e2e/area-mandato.spec.ts:101` - `toHaveClass(/\bon\b/)` + `#ladoNav .it.on` `toHaveCount(1)` + `#lado` visível | ✅ PASS |

### AMA-02: Conteúdo de cada aba (P1)

| Critério | Outcome da spec | `file:line` + asserção | Result |
| -------- | --------------- | ---------------------- | ------ |
| 02.1 cartão, papel, resumo, atividade; sem andamento nem missões | nome, cargo, UF, partido, posse; papel; avatares, total, pendentes, "Convidar pessoa" → aba Equipe; atividade; nada de 100 dias/missões | `plataforma/e2e/area-mandato.spec.ts:166` - `toHaveText('Deputado(a) Estadual · SP · Partido Exemplo · posse em 01/02/2027')`; `:173` papel; `:187` `toContainText('4 pessoas · 2 convites pendentes')`; `:199` atividade; `:214` `toHaveCount(0)` para `.md-andamento, .md-missoes-bloco` e `rpcs('catalogo_exercicios')` vazio; `:224` `href '#/config/equipe'` + aba ativa sem reload; `plataforma/e2e/area-visao.spec.ts:19-164` | ✅ PASS |
| 02.2 sem posse: aviso + "Informar agora" → aba Dados | texto exato "Informe a data de posse para acompanhar os prazos." + link para Dados | `plataforma/e2e/area-mandato.spec.ts:235` - `toHaveText(`${AVISO_POSSE} Informar agora`)`, `href '#/config/dados'`, clique → aba Dados ativa; `:249` sem aviso com posse | ✅ PASS |
| 02.3 formulário de edição com "Salvar alterações" | mesmo formulário e mesmo botão | `plataforma/e2e/area-mandato.spec.ts:337` (valores e botão), `:356` PATCH `mandatos?id=eq.<A>` com `data_posse: '2027-03-01'`; `plataforma/tests/legado-acesso.test.ts:320` | ✅ PASS |
| 02.4 coordenacao: "Zona de risco" no fim, "Excluir cadastro" com a confirmação de hoje | bloco separado, último da aba, mesma confirmação | `plataforma/e2e/area-mandato.spec.ts:370` - último filho `aria-labelledby='cadRiscoTit'`, diálogo `toEqual([CONFIRMA])`, `excluir_mandato` só depois de aceitar; `plataforma/tests/legado-acesso.test.ts:334` | ✅ PASS |
| 02.5 não coordenacao: sem Zona de risco | assessoria e leitura não veem | `plataforma/e2e/area-mandato.spec.ts:387` - `getByText('Zona de risco')` e botão `toHaveCount(0)`; `plataforma/tests/legado-acesso.test.ts:344` | ✅ PASS |
| 02.6 formulário, pendentes, pessoas e "Sair", mesmas regras | ordem e regras de hoje | `plataforma/e2e/area-equipe.spec.ts:34` ordem `['Convidar uma pessoa','Convites pendentes','Pessoas neste mandato','Sair do mandato']`; `:45`, `:63`, `:74`, `:83`, `:92`, `:101`, `:109`, `:154`; `plataforma/e2e/area-equipe-convites.spec.ts` (25 casos); `plataforma/e2e/area-equipe-pessoas.spec.ts` (21 casos) | ✅ PASS |
| 02.7 rótulo "Equipe e convites (N)" | total de pessoas | `plataforma/tests/legado-acesso.test.ts:264` - `(2)` e `(3)`; `:290` lista da aba acerta o rótulo; `plataforma/e2e/area-equipe.spec.ts:109` `(3)` → `(2)` após remover; `:125` `(2)` → `(3)` | ✅ PASS |
| 02.8 Minha conta: e-mail + nome, nascimento, gênero, raça, **UF**, telefone, atuação, em texto; texto de correção | 8 campos + e-mail; texto exato | `plataforma/e2e/area-conta.spec.ts:29` - `toEqual(COMPLETO)` (sem UF); `:35` nenhum campo editável + `toHaveText(CORRIGIR)`; `plataforma/tests/mandato-conta.test.ts:34`, `:64` | ⚠️ SPEC_DEVIATION (GAP-4): UF não aparece porque `perfis` não tem UF (`plataforma/supabase/migrations/20261109120000_perfis.sql:11`); a spec ainda pede UF |
| 02.9 sem perfil (equipe Legisla): só o e-mail | só e-mail | `plataforma/e2e/area-conta.spec.ts:44` - `toEqual([['E-mail', 'lia@gabinete.test']])`; `plataforma/tests/mandato-conta.test.ts:55` | ✅ PASS |
| 02.10 falha de leitura: erro da aba + "Tentar de novo", sem derrubar as outras | erro + botão; outras abas seguem | `plataforma/e2e/area-mandato.spec.ts:256`, `:272`; `plataforma/e2e/area-equipe.spec.ts:184`, `:196`; `plataforma/e2e/area-conta.spec.ts:59` (repete a leitura e troca de aba) | ✅ PASS; ⚠️ SP-1: a spec não define o texto do erro |
| 02.11 leitura: Dados só leitura; Equipe sem botões que alteram | Dados travado; **nenhum** botão que altera na aba Equipe | Dados: `plataforma/e2e/area-mandato.spec.ts:396` - `#cadNome`, `#cadPosse`, "Salvar alterações" `toBeDisabled()`; `plataforma/e2e/guia-acesso.spec.ts:225`. Equipe: `plataforma/e2e/area-equipe.spec.ts:163` só confere a lista de pessoas (`pessoas(page).getByRole('button')` `toHaveCount(0)`) | ❌ GAP-1 (Equipe): com convite pendente, quem é leitura vê "Gerar link de convite", "Cancelar" (em convite de outra pessoa, que o banco recusa: `convite_cancelar` exige coordenação ou autoria, `plataforma/supabase/migrations/20261106120000_convites_equipe.sql`) e "Sair do mandato" |

### AMA-03: Endereços antigos (P1)

| Critério | Outcome da spec | `file:line` + asserção | Result |
| -------- | --------------- | ---------------------- | ------ |
| 03.1 `/mandato` → `/guia#/config` | redirect permanente | `plataforma/e2e/area-redirects.spec.ts:15` - `status()` `toBe(308)`, `location` `toMatch(/\/guia#\/config$/)`; `:27` no navegador, Visão geral ativa | ✅ PASS |
| 03.2 `/mandato/equipe` → `/guia#/config/equipe` | redirect permanente | `plataforma/e2e/area-redirects.spec.ts:21` - `308` + `/guia#\/config\/equipe$/`; `:34` aba Equipe ativa | ✅ PASS |
| 03.3 `volta=mandato` abre `/guia#/config` | destino exato | `plataforma/e2e/primeiro-acesso.spec.ts:420` e `:268` - `toHaveURL(/\/guia#\/config$/)` | ✅ PASS (nota: trocar o destino por `/mandato` é mutante equivalente, o redirect leva ao mesmo endereço) |
| 03.4 Guia sem link para `/mandato` e `/mandato/equipe` | nenhum link | `plataforma/tests/legado-acesso.test.ts:145` - varre todos os scripts do Guia com `doesNotMatch(/["'`(=]\/mandato(\/equipe)?["'`)\s]/)`; `plataforma/e2e/area-redirects.spec.ts:43` - `a[href^="/mandato"]` `toHaveCount(0)` nas 4 abas e em `#/` | ✅ PASS |
| 03.5 sem sessão: entrada Google e, depois do login, a aba pedida | entrada com Google; volta na aba pedida | `plataforma/e2e/area-redirects.spec.ts:65` entrada com Google; `:72` volta em `#/config/equipe` com a aba ativa e `hashVolta` limpo; `:85` `/mandato` → Visão geral; `:94` sem endereço antigo não força aba; `plataforma/tests/legado-acesso.test.ts:169`, `:177`, `:192`, `:199`, `:209` | ✅ PASS |

### AMA-04: Teclado, leitor de tela e celular (P2)

| Critério | Outcome da spec | `file:line` + asserção | Result |
| -------- | --------------- | ---------------------- | ------ |
| 04.1 `tablist`/`tab`/`tabpanel`, `aria-selected` | papéis e seleção | `plataforma/tests/legado-acesso.test.ts:240`, `:269` (`aria-controls` ↔ `aria-labelledby`); `plataforma/e2e/area-mandato.spec.ts:54` | ✅ PASS |
| 04.2 setas movem foco e ativam; Home/End | vizinha, primeira, última | `plataforma/e2e/area-mandato.spec.ts:114` - `toBeFocused()` + aba ativa + hash a cada tecla; `plataforma/tests/legado-acesso.test.ts:386` | ✅ PASS |
| 04.3 400 px sem rolagem horizontal da página; lista rola dentro | página 0; lista rolável | `plataforma/e2e/area-mandato.spec.ts:130` - `medida.pagina` `toBe(0)`, `medida.lista` `> 0`, `overflowX` auto/scroll; mais 400 px em cada aba (`area-mandato.spec.ts:313`, `area-conta.spec.ts:84`, `area-equipe.spec.ts:215`) | ✅ PASS |

### AMA-05: Código antigo removido (P3)

| Critério | Outcome da spec | Evidência | Result |
| -------- | --------------- | --------- | ------ |
| 05.1 sem `app/mandato/page.tsx`, `app/mandato/equipe/page.tsx`, `Casca.tsx` | arquivos ausentes | `git diff e50098f..85e3372` apaga os 4 arquivos (`afe257d`); `app/mandato/` hoje só tem componentes reaproveitados; busca por `Casca` só acha a casca do `/admin` (outra); redirects cobertos em `plataforma/e2e/area-redirects.spec.ts:15` | ✅ PASS (evidência estrutural) |
| 05.2 casos de `e2e/mandato-*.spec.ts` migrados | nenhum caso que ainda vale removido | corpo do commit `afe257d` lista caso a caso (101 casos declarados); conferi a lista contra os 4 arquivos antigos em `e50098f`: os que saíram são do andamento/missões (fora de AMA-02.1), da casca ou do seletor de mandato, que agora é do Guia | ✅ PASS |

**Status**: ❌ Gaps presentes (GAP-1, GAP-2, GAP-3, GAP-4) e ⚠️ 1 spec-precision gap (SP-1).

---

## Edge Cases

- [ ] **Leitura do papel falha → erro com "Tentar de novo" e nenhum botão de edição**: Visão geral ✅ (`plataforma/e2e/area-mandato.spec.ts:284`), Equipe ✅ (`plataforma/e2e/area-equipe.spec.ts:207`), Minha conta usa o mesmo `ProvedorLegado`. **Aba Dados ❌ (GAP-2)**: sonda em scratch com `semLiaNosMembros` em `#/config/dados` deu `{"salvarEnabled":true,"nomeEnabled":true,"tentar":0,"alerta":[]}`: formulário editável, sem erro e sem "Tentar de novo". `plataforma/tests/legado-acesso.test.ts:353` só prova que a Zona de risco some.
- [x] **Troca de mandato estando na Área**: `plataforma/e2e/area-mandato.spec.ts:298`, `plataforma/e2e/area-visao.spec.ts:85`, `plataforma/e2e/area-equipe-convites.spec.ts:190`, `plataforma/tests/mandato-legado.test.ts:39`.
- [ ] **Aba Equipe sem mandato ativo → primeiro acesso**: o comportamento vale (sonda em scratch: `#/config/equipe` sem mandato foi para `/primeiro-acesso`, sem `tablist` nem `#areaEquipe`), mas **nenhum teste** abre um `#/config...` sem mandato; `plataforma/e2e/guia-acesso.spec.ts:431` só cobre `#/` (GAP-3).
- [x] **Sair do mandato pela aba Equipe**: `plataforma/e2e/area-equipe.spec.ts:134` (abre o outro mandato), `:146` e `plataforma/e2e/area-equipe-pessoas.spec.ts:179` (primeiro acesso).

---

## Discrimination Sensor

Scratch: `git worktree add --detach ../area-mandato-sensor-scratch 85e3372` + `npm ci`; servidor próprio na porta 3200 (o da 3100 não foi tocado). Baseline no scratch antes das mutações: unitários dos arquivos alvo 74/74 e e2e alvo 210/210. Cada mutante foi aplicado sozinho e o arquivo restaurado a partir do conteúdo original antes do próximo.

| # | File | Mutação | Testes que mataram | Killed? |
| - | ---- | ------- | ------------------ | ------- |
| U1 | `public/legacy/acesso.js` (Nuvem.google) | regex do hash guardado aceita qualquer `#...` | `legado-acesso.test.ts:177` | ✅ |
| U1b | `public/legacy/acesso.js` (App.entrou) | regex do hash restaurado aceita qualquer coisa | `legado-acesso.test.ts:199` | ✅ |
| U2 | `public/legacy/acesso.js` (App.entrou) | hash guardado não é restaurado | `legado-acesso.test.ts:192` | ✅ |
| E7 | idem, no navegador | hash guardado não é restaurado | `area-redirects.spec.ts:72`, `:85` | ✅ |
| E1 | `next.config.mjs` | `/mandato/equipe` → `/guia#/config` (destino errado) | `area-redirects.spec.ts:21`, `:34` | ✅ |
| E8 | `app/primeiro-acesso/PrimeiroAcesso.tsx` | `volta=mandato` → `/guia` sem a aba | `primeiro-acesso.spec.ts:420` | ✅ |
| U3 | `public/legacy/cadastro.js` (zonaRisco) | Zona de risco visível para assessoria | `legado-acesso.test.ts:344` | ✅ |
| E4 | idem, no navegador | Zona de risco visível para assessoria | `area-mandato.spec.ts:388` | ✅ |
| U4 | `public/legacy/acesso.js` (Area.rotulo) | contador fixo em `(2)` | `legado-acesso.test.ts:264` | ✅ |
| U5 | `public/legacy/acesso.js` (Area.equipe) | rótulo não se atualiza | `legado-acesso.test.ts:290` | ✅ |
| E13 | `ilhas/AreaEquipe.tsx` | a aba não entrega a lista ao Guia | `area-equipe.spec.ts:109`, `:125` | ✅ |
| U6 | `public/legacy/acesso.js` (Area.equipe) | aceita lista de outro mandato | `legado-acesso.test.ts:290` | ✅ |
| U7 | `public/legacy/acesso.js` (abaDoHash) | aba desconhecida cai em Dados | `legado-acesso.test.ts:240`, `:258`, `:386` | ✅ |
| U8 | `public/legacy/acesso.js` (Area.tecla) | seta esquerda vai para a direita | `legado-acesso.test.ts:386` | ✅ |
| U9 | `public/legacy/acesso.js` (Area.tecla) | End vai à penúltima | `legado-acesso.test.ts:386` | ✅ |
| U13 | `public/legacy/acesso.js` (Area.desenhar) | todas as abas `aria-selected="true"` | `legado-acesso.test.ts:240`, `:251`, `:258` | ✅ |
| U10 | `lib/mandato/legado.ts` | papel da primeira linha de membros, não da própria | `mandato-legado.test.ts:32`, `:65` | ✅ |
| E2 | `app/mandato/ProvedorLegado.tsx` | papel do contexto fixo em `coordenacao` (leitura com botões de coordenação) | `area-equipe.spec.ts:163`, `area-equipe-pessoas.spec.ts:67` (5 testes) | ✅ |
| E3 | `public/legacy/acesso.js` (trava) | trava de leitura poupa a aba Dados | `area-mandato.spec.ts:396`, `guia-acesso.spec.ts:225` | ✅ |
| U11 | `lib/mandato/conta.ts` | consulta de `perfis` sem filtro `user_id` | `mandato-conta.test.ts:59` | ✅ |
| U12 | `lib/mandato/conta.ts` | sem perfil mostra campo a mais | `mandato-conta.test.ts:55` | ✅ |
| E9 | `ilhas/AreaConta.tsx` | "Tentar de novo" não relê | `area-conta.spec.ts:59` | ✅ |
| E5 | `ilhas/AreaVisao.tsx` | "Informar agora" aponta para `#/config` | `area-mandato.spec.ts:235`, `:405` | ✅ |
| E11 | `ilhas/AreaVisao.tsx` | "Convidar pessoa" aponta para `#/config` | `area-mandato.spec.ts:224`, `area-visao.spec.ts:79` | ✅ |
| E6 | `public/legacy/acesso.js` (Seletor.ir) | trocar de mandato na Área não redesenha a aba | `area-mandato.spec.ts:298`, `area-visao.spec.ts:85`, `area-equipe-convites.spec.ts:190` | ✅ |

**Sensor depth**: expandido (permissões e papéis): 25 mutações, 14 unitárias e 11 e2e.
**Result**: 25/25 killed ✅. Todas morreram por asserção (nenhuma por erro de sintaxe).
**Isolamento**: scratch removido (`git worktree remove --force` + `prune`); `git status --porcelain` do worktree real ficou idêntico ao do início (inclusive `graphify-out` e `plataforma/playwright.isolado.config.ts`).

Sondas (no scratch, não são testes da suíte): A = papel leitura com convite pendente na aba Equipe → botões `["Gerar link de convite","Cancelar","Sair do mandato"]`; B = aba Dados sem a linha da própria pessoa → formulário editável; C = `#/config/equipe` sem mandato → `/primeiro-acesso`.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ⚠️ `Telas.equipeHtml` (override em `plataforma/public/legacy/acesso.js:93`) não é mais chamado por ninguém e segue testado em `plataforma/tests/legado-acesso.test.ts:145-165` (Q-1) |
| Surgical changes | ✅ `nucleo.js`, `app.js`, `guia.js`, `conteudo.js`, `resumo.js` e `lib/legacyBody.ts` sem diff no intervalo |
| No scope creep | ✅ sem migration e sem mudança de RLS/função no intervalo; a única mudança de trava é poupar os campos de `#areaEquipe`, que reproduz a tela de equipe de antes |
| Matches patterns | ✅ ilhas em `ponte.tsx`, overrides em `acesso.js`/`cadastro.js`, imports `.ts` relativos em `lib/` e `tests/` |
| Spec-anchored outcome check | ❌ AMA-02.11 (Equipe) afirma menos do que a spec pede (GAP-1) |
| Per-layer coverage | ⚠️ Edge Case de papel desconhecido sem cobertura na aba Dados (GAP-2) e Edge Case sem mandato sem teste (GAP-3) |
| Every test maps to a requirement | ✅ todo teste novo cita AMA-xx, Edge Case ou caso migrado |
| Guidelines followed | ✅ `plataforma/AGENTS.md`, `plataforma/CLAUDE.md` (worktree isolado, porta 3100) |

Sem link para `/mandato` nem `/mandato/equipe` em `plataforma/public`, `ilhas`, `app` e `lib` (só um comentário em `app/mandato/mandato.css:1`).

---

## Gate Check

- **Gate command**: `npx tsc --noEmit`; `npm test`; `npx playwright test -c playwright.isolado.config.ts e2e/area- e2e/convite- e2e/guia-acesso e2e/primeiro-acesso e2e/admin-` (porta 3100)
- **tsc**: limpo (exit 0)
- **npm test**: 1158 passed, 0 failed, 0 skipped
- **e2e**: 381 testes. 1ª rodada 372 passed / 9 failed, todos por tempo (a 1ª rodada correu junto com o `npm ci` do scratch). Os 9 passaram de novo: 7 na rodada conjunta seguinte e os 2 restantes (`area-equipe-pessoas.spec.ts:179`, `area-mandato.spec.ts:370`) sozinhos. Resultado final: 381/381.
- **Test count before feature** (`e50098f`): unit 1109; e2e do mesmo conjunto (com `e2e/mandato-*`) 349
- **Test count after feature**: unit 1158; e2e 381
- **Delta**: +49 unit, +32 e2e (saíram 4 arquivos `mandato-*`, com a migração descrita em `afe257d`)
- **Skipped tests**: nenhum
- **Flakes (Q-2)**: testes que esperam a navegação para `/primeiro-acesso` ou o diálogo da Zona de risco com o timeout padrão de 5 s caem sob carga em paralelo (`area-equipe.spec.ts:134`, `:146`, `:154`; `area-equipe-pessoas.spec.ts:179`, `:205`; `area-mandato.spec.ts:370`; `area-redirects.spec.ts:27`, `:85`). Passam sozinhos.

---

## Fix Plans

### GAP-1 (Major): AMA-02.11 na aba Equipe — leitura vê botões que alteram

- **Root cause**: AMA-02.11 diz "a aba Equipe SHALL não mostrar botões que alteram" e a premissa "Equipe sem botões de alterar (já existente)" está errada: a tela de equipe de antes já mostrava a quem é leitura "Gerar link de convite" (convida como Somente leitura), "Cancelar" em todo convite pendente e "Sair do mandato". AMA-02.6 ("mesmas regras de hoje") manda manter isso. O teste `plataforma/e2e/area-equipe.spec.ts:163` só afirma a lista de pessoas e não semeia convites.
- **Fix task**: decisão do usuário. (a) Ajustar AMA-02.11 e a premissa para dizer o que quem é leitura vê na aba Equipe (sem seletor de papel e sem "Remover"; convida só como Somente leitura; sai do mandato; e se "Cancelar" aparece em convite de outra pessoa, que o banco recusa); ou (b) esconder de quem é leitura o "Cancelar" de convites que não criou (pede `criado_por` em `convites_pendentes`, mudança de banco fora do escopo atual). Nos dois casos, um e2e com papel leitura **e** convites pendentes afirmando a lista exata de botões da aba.
- **Priority**: Major

### GAP-2 (Major): Edge Case "leitura do papel falha" não vale para a aba Dados

- **Root cause**: `Area.preencher` (`plataforma/public/legacy/acesso.js:156-159`) desenha `Cad.abrir('editar',...)` sem olhar o papel. Sem a linha da própria pessoa em `Store.membros`, `leitura()` dá `false`, a trava não age e o formulário fica editável, com "Salvar alterações" ativo, sem erro e sem "Tentar de novo".
- **Fix task**: na aba Dados, com nuvem e sem papel da própria pessoa, mostrar o erro da aba com "Tentar de novo" (relendo com `Store.abrir`, como o `ProvedorLegado`) em vez do formulário. Testes: vm em `legado-acesso.test.ts` (sem papel → sem `cadSalvar1`, com o erro e o botão) e e2e `area-mandato.spec.ts` com `semLiaNosMembros` em `#/config/dados`.
- **Priority**: Major

### GAP-3 (Minor): Edge Case "aba Equipe sem mandato ativo" sem teste

- **Root cause**: o comportamento vem do `App.entrou` do Guia e vale (sonda C), mas nenhum teste abre `#/config/equipe` sem mandato.
- **Fix task**: e2e (em `area-redirects.spec.ts` ou `guia-acesso.spec.ts`) que abre `/guia#/config/equipe` com a lista de mandatos vazia e afirma a ida para `/primeiro-acesso` e a ausência do `tablist` "Área do mandato".
- **Priority**: Minor

### GAP-4 (Minor): AMA-02.8 pede UF, que `perfis` não tem

- **Root cause**: SPEC_DEVIATION registrado em `plataforma/lib/mandato/conta.ts:6-9` e em `tasks.md` (T6), mas `spec.md` (AMA-02.8 e a premissa "Minha conta") ainda lista a UF.
- **Fix task**: confirmar com o usuário e tirar a UF de AMA-02.8 e da premissa (só documento; nenhuma migration).
- **Priority**: Minor

### SP-1 (Minor): AMA-02.10 não define o texto do erro

- A spec diz "a mensagem de erro daquela aba". O código usa dois textos: "Não foi possível concluir. Tente de novo." nas seções da Visão e da Equipe e "Não foi possível carregar. Tente de novo." no contexto e na Minha conta. Os testes fixam os textos atuais. Recomendo a spec nomear o texto (ou os dois).

### Q-1 / Q-2 (Minor, sem bloqueio)

- Q-1: remover o override morto `Telas.equipeHtml` e os 2 testes que o exercitam, ou registrar por que fica.
- Q-2: dar timeout explícito às esperas de navegação para `/primeiro-acesso` nos testes listados no Gate Check.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| AMA-01 | Pending | ✅ Verified |
| AMA-02 | Pending | ❌ Needs Fix (02.11 Equipe; 02.8 UF; Edge Case de papel na aba Dados) |
| AMA-03 | Pending | ✅ Verified |
| AMA-04 | Pending | ✅ Verified |
| AMA-05 | Pending | ✅ Verified |

---

## Summary

**Overall**: ❌ Not Ready

**Spec-anchored check**: 26/28 critérios casam com a spec; 1 gap (AMA-02.11 Equipe), 1 desvio não registrado na spec (AMA-02.8 UF), 1 spec-precision gap (SP-1); Edge Cases: 2/4 cobertos, 1 com falha (aba Dados), 1 sem teste
**Sensor**: 25/25 mutações mortas
**Gate**: tsc limpo; unit 1158/1158; e2e 381/381 (9 flakes de carga repetidos e verdes)

**What works**: casca com abas, rotas, Voltar, teclado e 400 px; Visão geral, Dados, Equipe e Minha conta; contador da aba; redirects 308; volta do Google na aba pedida; `volta=mandato`; código antigo removido com a migração dos testes conferida.

**Issues found**: GAP-1 e GAP-4 pedem decisão do usuário sobre a spec; GAP-2 e GAP-3 são correções de código e teste.

**Next steps**: orquestrador leva GAP-1 e GAP-4 ao usuário, cria as tasks de GAP-2 e GAP-3 (e Q-1/Q-2, se quiser) e chama o Verifier na rodada 2.
