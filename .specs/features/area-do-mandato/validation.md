# Área do Mandato Validation

**Date**: 2026-11-10
**Spec**: `.specs/features/area-do-mandato/spec.md` (versão de `e8f9fc2`)
**Diff range**: `e50098f..f8f31db` (feature inteira, T1 `f983b18` a T12 `f8f31db`); correções desta rodada: `85e3372..f8f31db` (`8e23a4c`, `e8f9fc2`, `f8f31db`), branch `feat/area-do-mandato`
**Verifier**: sub-agente independente, rodada 2 de 3 (autor ≠ verificador)

## Validation: area-do-mandato - PASS ✅

Os sete itens da rodada 1 (GAP-1 a GAP-4, SP-1, Q-1, Q-2) estão fechados contra a spec atual. A spec editada é coerente nos quatro critérios mexidos (AMA-02.6, 02.8, 02.10, 02.11) e os testes afirmam o que ela define, sem asserção afrouxada. Gate verde na primeira rodada (tsc limpo, unit 1157/1157, e2e 384/384, nenhum flake). Sensor: 18/18 mutantes mortos por asserção. Fica uma nota de redação na spec (N-1, Success Criteria), que não bloqueia.

---

## Fechamento dos itens da rodada 1

| Item | Estado na spec atual | Evidência (`file:line`) | Result |
| ---- | -------------------- | ----------------------- | ------ |
| GAP-1 (AMA-02.11, Equipe para leitura) | AMA-02.11 vira exceção explícita: a aba Equipe mantém AMA-02.6 ("Gerar link de convite" como Somente leitura, "Cancelar", "Sair do mandato"; o banco recusa e a tela mostra o erro); a lista de pessoas fica sem seletor e sem "Remover". Premissa "Quem só lê" e Independent Test alinhados (`spec.md:43`, `:93`, `:95`) | `plataforma/e2e/area-equipe.spec.ts:184` - papel leitura, convite pendente de Mariana: `painel.getByRole('button')` `toHaveText(['Gerar link de convite','Cancelar','Sair do mandato'])`, `pessoas.getByRole('button')` `toHaveCount(0)`, recusa 403 → `pendentes.getByRole('alert')` `toHaveText('Você não tem permissão para esta ação.')`, convite segue na lista, `rpcs('convite_cancelar')` `toEqual([{p_id:'c1'}])`; `:173` convida como `p_papel: 'leitura'`; `:163` papéis em texto | ✅ |
| GAP-2 (Edge Case papel na aba Dados) | Edge Case "leitura do papel falha" (`spec.md:150`) + texto de AMA-02.10 | Código: `plataforma/public/legacy/acesso.js:156` (`if(NUVEM&&!euNosMembros()){this.erro(p);return}`), `:163-171` (erro + `Area.reler` com `Store.abrir`). Testes: `plataforma/tests/legado-acesso.test.ts:337` - HTML exato do alerta e do botão `onclick="Area.reler()"`, sem `cadSalvar1`, `Salvar alterações`, `cadNome`, `Cad.excluir`, `Zona de risco`; `plataforma/e2e/area-mandato.spec.ts:405` - alerta `toHaveText('Não foi possível carregar. Tente de novo.')`, `salvar` `toHaveCount(0)`, nenhum `input, select, textarea`, botões `toHaveText(['Tentar de novo'])`; "Tentar de novo" relê `membros` (`toBeGreaterThan(lidos)`) e o formulário volta com `salvar` `toBeEnabled()` | ✅ |
| GAP-3 (Edge Case sem mandato) | Edge Case `spec.md:152` | `plataforma/e2e/guia-acesso.spec.ts:436` - `#/config/equipe` com perfil e sem mandato: `toHaveURL(/\/primeiro-acesso$/)` (o `$` exclui o `?volta=guia` de quem não tem perfil), `tablist "Área do mandato"` e `#areaEquipe` `toHaveCount(0)` | ✅ |
| GAP-4 (UF em AMA-02.8) | UF fora de AMA-02.8 e da premissa, como desvio aceito por decisão do usuário (`spec.md:44`, `:90`) | `plataforma/e2e/area-conta.spec.ts:29` (`COMPLETO` sem UF), `plataforma/tests/mandato-conta.test.ts:34`; `plataforma/lib/mandato/conta.ts:6-9` registra o motivo | ✅ |
| SP-1 (texto do erro de leitura) | AMA-02.10 nomeia o texto único "Não foi possível carregar. Tente de novo." e deixa as ações com as mensagens de hoje (`spec.md:92`) | Todas as leituras das abas usam o texto: `plataforma/app/mandato/ProvedorLegado.tsx:58`, `plataforma/app/mandato/ResumoEquipe.tsx:26`, `plataforma/app/mandato/Atividade.tsx:60`, `plataforma/app/mandato/equipe/Equipe.tsx:35`, `:43`, `plataforma/ilhas/AreaConta.tsx:34`, `plataforma/public/legacy/acesso.js:124`. As ações seguem com `mensagemDe`: `ListaConvites.tsx:41`, `FormularioConvite.tsx:50`, `SairDoMandato.tsx:40`, `ListaPessoas.tsx:41`, `:57`. Testes com o texto exato: `area-mandato.spec.ts:259`, `:275`, `:287`, `:408`; `area-visao.spec.ts:97`, `:160`; `area-equipe.spec.ts:204`, `:216`, `:226`; `area-equipe-convites.spec.ts:326`; `area-equipe-pessoas.spec.ts:138`; `area-conta.spec.ts:64`; `tests/mandato-legado.test.ts:84`; `tests/legado-acesso.test.ts:339`. Erros de ação seguem fixos no texto de hoje (`area-equipe-convites.spec.ts:20` `ERRO_REDE`, `area-equipe.spec.ts:196`) | ✅ |
| Q-1 (override morto `Telas.equipeHtml`) | - | Override saiu de `acesso.js`; nada chama `Telas.equipeHtml` (busca em `plataforma/`: só a definição original em `plataforma/public/legacy/cadastro.js:714`, anterior à feature, sem chamador desde que `Cad.desenhar` passou a `zonaRisco`). O modo local não usava o override (nenhum chamador); a aba Dados no modo local segue com formulário e Zona de risco (`tests/legado-acesso.test.ts:344`, mutante R12 morto). A varredura de AMA-03.4 ficou (`tests/legado-acesso.test.ts:145`) e o código de convite segue fora das 4 abas (`e2e/guia-acesso.spec.ts:160`) | ✅ |
| Q-2 (esperas sob carga) | - | As esperas dos 8 testes de Q-2 (13 linhas) ganharam `{ timeout: 20_000 }` sem mudar o valor esperado (`area-equipe.spec.ts:140`, `:150`, `:156`, `:158`; `area-equipe-pessoas.spec.ts:190`, `:211`; `area-mandato.spec.ts:379`, `:383`; `area-redirects.spec.ts:30`, `:37`, `:67`, `:80`, `:90`). Gate e2e desta rodada: 384/384 na primeira passada | ✅ |

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T9 (`f983b18`..`85e3372`) | ✅ Done | conferidas na rodada 1 |
| T10 `8e23a4c` | ✅ Done | GAP-2 e GAP-3 |
| T11 `e8f9fc2` | ✅ Done | GAP-1, GAP-4, SP-1 (spec + texto único + e2e de leitura com convite) |
| T12 `f8f31db` | ✅ Done | Q-1 e Q-2 |

---

## Spec-Anchored Acceptance Criteria

### AMA-01: Uma tela com abas dentro do Guia (P1)

| Critério | Outcome da spec | `file:line` + asserção | Result |
| -------- | --------------- | ---------------------- | ------ |
| 01.1 "Área do mandato" no grupo Mandato | rótulo, `#/config`, sem "Configurações" | `plataforma/e2e/area-mandato.spec.ts:34` - `toHaveAttribute('href','#/config')`, `grupos['Mandato']` contém o rótulo, `not.toContainText('Configurações')` | ✅ PASS |
| 01.2 `#/config` = 4 abas, Visão geral ativa | 4 rótulos, ativa a 1ª | `plataforma/e2e/area-mandato.spec.ts:54` - `toHaveText(ROTULOS)`; `plataforma/tests/legado-acesso.test.ts:224` - `aria-selected` `['true','false','false','false']` | ✅ PASS |
| 01.3 `#/config/<aba>` abre a aba | aba ativa | `plataforma/e2e/area-mandato.spec.ts:63`; `plataforma/tests/legado-acesso.test.ts:235` | ✅ PASS |
| 01.4 clique troca sem recarregar e muda o hash | sem reload; hash da aba | `plataforma/e2e/area-mandato.spec.ts:75` - `toHaveURL(fim('#/config/dados'))` + marcador `__mesmaPagina`; `plataforma/tests/legado-acesso.test.ts:364` | ✅ PASS |
| 01.5 Voltar mostra a aba anterior | aba anterior ativa | `plataforma/e2e/area-mandato.spec.ts:87` | ✅ PASS |
| 01.6 aba desconhecida → Visão geral | Visão geral | `plataforma/e2e/area-mandato.spec.ts:70`; `plataforma/tests/legado-acesso.test.ts:242` | ✅ PASS |
| 01.7 menu e item ativo em todas as abas | `.on` único | `plataforma/e2e/area-mandato.spec.ts:101` | ✅ PASS |

### AMA-02: Conteúdo de cada aba (P1)

| Critério | Outcome da spec | `file:line` + asserção | Result |
| -------- | --------------- | ---------------------- | ------ |
| 02.1 cartão, papel, resumo, atividade; sem andamento/missões | textos exatos; nada de missões | `plataforma/e2e/area-mandato.spec.ts:166`, `:173`, `:187`, `:199`, `:214`, `:224`; `plataforma/e2e/area-visao.spec.ts:20`, `:79`, `:85` | ✅ PASS |
| 02.2 sem posse: aviso + "Informar agora" → Dados | texto exato + link | `plataforma/e2e/area-mandato.spec.ts:235`, `:249`, `:420` | ✅ PASS |
| 02.3 formulário com "Salvar alterações" | mesmo formulário e botão | `plataforma/e2e/area-mandato.spec.ts:337`, `:356`; `plataforma/tests/legado-acesso.test.ts:304` | ✅ PASS |
| 02.4 coordenacao: Zona de risco no fim | último bloco, confirmação de hoje | `plataforma/e2e/area-mandato.spec.ts:370`; `plataforma/tests/legado-acesso.test.ts:318` | ✅ PASS |
| 02.5 não coordenacao: sem Zona de risco | assessoria e leitura não veem | `plataforma/e2e/area-mandato.spec.ts:388`; `plataforma/tests/legado-acesso.test.ts:328` | ✅ PASS |
| 02.6 formulário, pendentes, pessoas, "Sair", regras de hoje | ordem e regras | `plataforma/e2e/area-equipe.spec.ts:34` (ordem), `:45`, `:68`, `:74`, `:83`, `:92`, `:101`, `:109`, `:154`, `:173`, `:184`; `plataforma/e2e/area-equipe-convites.spec.ts`; `plataforma/e2e/area-equipe-pessoas.spec.ts` | ✅ PASS |
| 02.7 rótulo "Equipe e convites (N)" | total de pessoas | `plataforma/tests/legado-acesso.test.ts:248`, `:274`; `plataforma/e2e/area-equipe.spec.ts:109`, `:125` | ✅ PASS |
| 02.8 Minha conta: e-mail + 6 campos sem UF, em texto; texto de correção | ordem e texto exatos | `plataforma/e2e/area-conta.spec.ts:29` `toEqual(COMPLETO)`, `:35` nada editável + `toHaveText(CORRIGIR)`; `plataforma/tests/mandato-conta.test.ts:34`, `:64` | ✅ PASS |
| 02.9 sem perfil: só o e-mail | só e-mail | `plataforma/e2e/area-conta.spec.ts:44`; `plataforma/tests/mandato-conta.test.ts:55` | ✅ PASS |
| 02.10 falha de leitura: "Não foi possível carregar. Tente de novo." + "Tentar de novo", outras abas seguem | texto exato + botão | ver SP-1 acima; botão e releitura: `plataforma/e2e/area-mandato.spec.ts:256`, `:272`, `:405`; `plataforma/e2e/area-equipe.spec.ts:201`, `:213`; `plataforma/e2e/area-conta.spec.ts:59` | ✅ PASS |
| 02.11 leitura: Dados só leitura; Equipe como AMA-02.6, sem seletor nem "Remover" | Dados travado; botões exatos na Equipe | Dados: `plataforma/e2e/area-mandato.spec.ts:396` (`toBeDisabled()`), `plataforma/e2e/guia-acesso.spec.ts:225`. Equipe: `plataforma/e2e/area-equipe.spec.ts:184`, `:163`, `plataforma/e2e/area-equipe-pessoas.spec.ts:68` | ✅ PASS |

### AMA-03: Endereços antigos (P1)

| Critério | Outcome da spec | `file:line` + asserção | Result |
| -------- | --------------- | ---------------------- | ------ |
| 03.1 `/mandato` → `/guia#/config` | 308 | `plataforma/e2e/area-redirects.spec.ts:15` (`toBe(308)`, `location`), `:27` | ✅ PASS |
| 03.2 `/mandato/equipe` → `/guia#/config/equipe` | 308 | `plataforma/e2e/area-redirects.spec.ts:21`, `:34` | ✅ PASS |
| 03.3 `volta=mandato` → `/guia#/config` | destino exato | `plataforma/e2e/primeiro-acesso.spec.ts:420`, `:268` | ✅ PASS |
| 03.4 sem link para `/mandato` | nenhum | `plataforma/tests/legado-acesso.test.ts:145`; `plataforma/e2e/area-redirects.spec.ts:44` | ✅ PASS |
| 03.5 sem sessão: Google e volta à aba | aba pedida | `plataforma/e2e/area-redirects.spec.ts:65`, `:72`, `:85`, `:94`; `plataforma/tests/legado-acesso.test.ts:153`, `:161`, `:176`, `:183`, `:193` | ✅ PASS |

### AMA-04 (P2) e AMA-05 (P3)

| Critério | `file:line` + asserção | Result |
| -------- | ---------------------- | ------ |
| 04.1 `tablist`/`tab`/`tabpanel` | `plataforma/tests/legado-acesso.test.ts:224`, `:253`; `plataforma/e2e/area-mandato.spec.ts:54` | ✅ PASS |
| 04.2 setas, Home, End | `plataforma/e2e/area-mandato.spec.ts:114`; `plataforma/tests/legado-acesso.test.ts:372` | ✅ PASS |
| 04.3 400 px sem rolagem da página | `plataforma/e2e/area-mandato.spec.ts:130`, `:313`; `plataforma/e2e/area-conta.spec.ts:84`; `plataforma/e2e/area-equipe.spec.ts:232` | ✅ PASS |
| 05.1 páginas e casca antigas fora | estrutural (`afe257d`), redirects em `plataforma/e2e/area-redirects.spec.ts:15` | ✅ PASS |
| 05.2 casos `mandato-*` migrados | conferido na rodada 1 (corpo de `afe257d`); nenhum caso saiu nesta rodada | ✅ PASS |

**Status**: ✅ 30/30 critérios com asserção no valor que a spec define. Nenhum spec-precision gap aberto.

---

## Edge Cases

- [x] **Leitura do papel falha**: Visão geral `plataforma/e2e/area-mandato.spec.ts:284`; Dados `plataforma/e2e/area-mandato.spec.ts:405` e `plataforma/tests/legado-acesso.test.ts:337`; Equipe `plataforma/e2e/area-equipe.spec.ts:224`; Minha conta usa o mesmo `ProvedorLegado` (`plataforma/ilhas/AreaConta.tsx:59`) e não tem botão de edição.
- [x] **Troca de mandato na Área**: `plataforma/e2e/area-mandato.spec.ts:298`, `plataforma/e2e/area-visao.spec.ts:85`, `plataforma/e2e/area-equipe-convites.spec.ts:191`, `plataforma/tests/mandato-legado.test.ts:39`.
- [x] **Aba Equipe sem mandato ativo**: `plataforma/e2e/guia-acesso.spec.ts:436`.
- [x] **Sair do mandato pela aba Equipe**: `plataforma/e2e/area-equipe.spec.ts:134`, `:146`; `plataforma/e2e/area-equipe-pessoas.spec.ts:180`.

---

## Discrimination Sensor

Scratch: `git worktree add --detach ../area-mandato-sensor-r2 f8f31db` + `npm ci`; servidor próprio na porta 3200 (o da 3100 não foi tocado). Baseline no scratch: unit dos arquivos alvo 65/65, e2e alvo 20/20. Cada mutante aplicado sozinho por substituição de texto com contagem exata (1 ocorrência) e desfeito com `git checkout -- plataforma` dentro do scratch.

| # | File:line | Mutação | Testes que mataram | Killed? |
| - | --------- | ------- | ------------------ | ------- |
| R1 | `plataforma/public/legacy/acesso.js:156` | aba Dados abre o formulário sem a linha da pessoa em membros | `tests/legado-acesso.test.ts:337`, `e2e/area-mandato.spec.ts:405` | ✅ |
| R2 | `plataforma/public/legacy/acesso.js:127` | `euNosMembros` aceita a linha de qualquer pessoa | `tests/legado-acesso.test.ts:337`, `e2e/area-mandato.spec.ts:405` | ✅ |
| R3 | `plataforma/public/legacy/acesso.js:124` | texto do erro da aba Dados trocado pelo de ação | `tests/legado-acesso.test.ts:337`, `e2e/area-mandato.spec.ts:405` | ✅ |
| R4 | `plataforma/public/legacy/acesso.js:169` | "Tentar de novo" da aba Dados não relê (`Store.abrir` sai) | `e2e/area-mandato.spec.ts:405` (`toBeEnabled`) | ✅ |
| R12 | `plataforma/public/legacy/acesso.js:156` | guarda vale também no modo local (`NUVEM&&` sai) | `tests/legado-acesso.test.ts:344` | ✅ |
| R5 | `plataforma/app/mandato/equipe/Equipe.tsx:35` | falha dos pendentes volta ao texto de ação | `e2e/area-equipe.spec.ts:213`, `e2e/area-equipe-convites.spec.ts:324` | ✅ |
| R11 | `plataforma/app/mandato/equipe/Equipe.tsx:43` | falha das pessoas volta ao texto de ação | `e2e/area-equipe.spec.ts:201`, `e2e/area-equipe-pessoas.spec.ts:136` | ✅ |
| R6 | `plataforma/app/mandato/Atividade.tsx:60` | falha da atividade volta ao texto de ação | `e2e/area-mandato.spec.ts:272`, `e2e/area-visao.spec.ts:158` | ✅ |
| R7b | `plataforma/app/mandato/equipe/ListaConvites.tsx:72` | leitura deixa de ver "Cancelar" (`display:none`) | `e2e/area-equipe.spec.ts:184` | ✅ |
| R8b | `plataforma/app/mandato/equipe/SairDoMandato.tsx:49` | leitura deixa de ver "Sair do mandato" (`display:none`) | `e2e/area-equipe.spec.ts:184` | ✅ |
| R9 | `plataforma/app/mandato/equipe/ListaConvites.tsx:81` | recusa do banco ao cancelar some da tela | `e2e/area-equipe.spec.ts:184` | ✅ |
| R10 | `plataforma/public/legacy/acesso.js:87` | sem mandato em `#/config...` não vai ao primeiro acesso | `e2e/guia-acesso.spec.ts:436` | ✅ |
| E2 | `plataforma/app/mandato/ProvedorLegado.tsx:37` | papel do contexto fixo em `coordenacao` (rodada 1) | `e2e/area-equipe.spec.ts:163`, `:184`, `e2e/area-equipe-pessoas.spec.ts:68` (2) | ✅ |
| E3 | `plataforma/public/legacy/acesso.js:242` | trava de leitura poupa a aba Dados (rodada 1) | `e2e/area-mandato.spec.ts:396`, `e2e/guia-acesso.spec.ts:225` | ✅ |
| U10 | `plataforma/lib/mandato/legado.ts:24` | papel da primeira linha de membros (rodada 1) | `tests/mandato-legado.test.ts:20`, `:32`, `:65`, `:70` | ✅ |
| U3 | `plataforma/public/legacy/cadastro.js:125` | Zona de risco visível para assessoria (rodada 1) | `tests/legado-acesso.test.ts:328`, `e2e/area-mandato.spec.ts:388` | ✅ |
| E6 | `plataforma/public/legacy/acesso.js:212` | trocar de mandato na Área não redesenha (rodada 1) | `e2e/area-mandato.spec.ts:298`, `e2e/area-visao.spec.ts:85` | ✅ |
| E1 | `plataforma/next.config.mjs:13` | `/mandato/equipe` → `/guia#/config` (rodada 1) | `e2e/area-redirects.spec.ts:21`, `:34` | ✅ |

**Sensor depth**: expandido (papéis e permissões): 12 mutantes novos para o que mudou na rodada + 6 dos mais fortes da rodada 1.
**Result**: 18/18 killed ✅, todos por asserção (`expect(...)` falhou; nenhum por erro de compilação).
**Mutantes inócuos descartados**: R7 e R8 (mesma ideia com o atributo `hidden`) passaram porque `.md-bt` (`display:inline-flex`) e `.md-pilha` (`display:flex`) em `plataforma/app/mandato/mandato.css:58`, `:34` anulam o `hidden`: o botão continuava visível, então a mutação não mudava comportamento. Refeitos como R7b/R8b com `display:none` em linha e mortos.
**Isolamento**: servidor da 3200 parado, scratch removido (`git worktree remove --force` + `prune`); `git status --porcelain` do worktree real (sem `graphify-out` e `plataforma/playwright.isolado.config.ts`) igual ao do início (vazio) e HEAD em `f8f31db`.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ override morto saiu; a guarda da aba Dados reaproveita o padrão da trava (`leitura()` em `acesso.js:233`) |
| Surgical changes | ✅ só os arquivos das correções; nenhum teste de outra feature mexido |
| No scope creep | ✅ sem migration, RLS ou função de banco no intervalo |
| Matches patterns | ✅ erro da aba com `erro-cx` + `role="alert"`, como `mostraErroPerfil` (`acesso.js:58`) |
| Spec-anchored outcome check | ✅ textos e listas exatas da spec nas asserções |
| Per-layer coverage | ✅ vm + e2e para a aba Dados; e2e para Equipe e sem mandato |
| Every test maps to a requirement | ✅ os 3 e2e novos citam AMA-02.6/02.11 e os Edge Cases |
| Guidelines followed | ✅ `plataforma/AGENTS.md`, `plataforma/CLAUDE.md` (worktree isolado, porta 3100) |
| Asserções afrouxadas | ✅ nenhuma: as trocas de texto seguem a spec (AMA-02.10) e os `timeout` não mudam o valor esperado |

---

## Gate Check

- **Gate command**: `npx tsc --noEmit`; `npm test`; `npx playwright test -c playwright.isolado.config.ts e2e/area- e2e/convite- e2e/guia-acesso e2e/primeiro-acesso e2e/admin-` (porta 3100)
- **tsc**: limpo (exit 0)
- **npm test**: 1157 passed, 0 failed, 0 skipped
- **e2e**: 384 passed, 0 failed, 0 flaky, 0 skipped (6,7 min, primeira passada)
- **Test count before feature** (`e50098f`): unit 1109; e2e do mesmo conjunto 349
- **Test count after feature**: unit 1157; e2e 384
- **Delta**: +48 unit, +35 e2e. Nesta rodada: unit 1158 → 1157 (o teste de `Telas.equipeHtml` no modo local saiu com o override; o da varredura AMA-03.4 ficou sem a parte de `equipeHtml`), e2e 381 → 384 (aba Dados sem papel, leitura com convite pendente, `#/config/equipe` sem mandato)

---

## Notas (não bloqueiam)

- **N-1 (Minor, redação da spec)**: `spec.md:181` (Success Criteria) ainda diz "`leitura` não altera nada", o que contradiz a exceção de AMA-02.11 (`spec.md:93`): quem é leitura gera link de convite como Somente leitura e sai do mandato (`plataforma/e2e/area-equipe.spec.ts:173`, `:184`). As permissões não mudam; só a frase. Sugestão: "Nenhuma permissão muda: `leitura` não edita os dados do mandato nem a equipe (só convida como Somente leitura e sai) e só `coordenacao` exclui o cadastro."
- **N-2 (Info)**: o texto único de AMA-02.10 vive em duas constantes, `ERRO_ABA` (`plataforma/public/legacy/acesso.js:124`) e `ERRO_CARREGAR` (`plataforma/lib/mandato/legado.ts:9`). As duas estão fixadas por teste (`tests/legado-acesso.test.ts:339`, `tests/mandato-legado.test.ts:84`), então uma divergência quebra a suíte.
- **N-3 (Info)**: com o override removido, a definição original de `Telas.equipeHtml` em `plataforma/public/legacy/cadastro.js:714-742` (anterior à feature, com o bloco "Código de convite") voltou a ser a única, ainda sem chamador. ACE-07.2 segue coberto nas 4 abas (`plataforma/e2e/guia-acesso.spec.ts:160`). Removê-la é limpeza opcional, fora do escopo.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| AMA-01 | Pending | ✅ Verified |
| AMA-02 | Pending (Needs Fix na rodada 1) | ✅ Verified |
| AMA-03 | Pending | ✅ Verified |
| AMA-04 | Pending | ✅ Verified |
| AMA-05 | Pending | ✅ Verified |

(`spec.md` ainda mostra "Pending" na tabela de rastreabilidade; o orquestrador atualiza junto com N-1.)

---

## Histórico

- Rodada 1 (`e50098f..85e3372`): reprovada com GAP-1 a GAP-4, SP-1, Q-1, Q-2; sensor 25/25. Relatório completo: `git show 8e23a4c:.specs/features/area-do-mandato/validation.md`.
- Rodada 2 (`85e3372..f8f31db`): aprovada, este relatório.

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 30/30 critérios casam com a spec; 4/4 Edge Cases cobertos; 0 spec-precision gap aberto
**Sensor**: 18/18 mutações mortas (2 inócuas refeitas)
**Gate**: tsc limpo; unit 1157/1157; e2e 384/384 sem flake

**What works**: tudo da rodada 1, mais a aba Dados sem papel conhecido (erro + releitura), o texto único de erro de leitura, a aba Equipe para leitura conforme a exceção registrada e o Edge Case sem mandato com teste.

**Issues found**: só N-1 (frase dos Success Criteria), de redação.

**Next steps**: orquestrador corrige N-1 e a tabela de rastreabilidade em `spec.md` (opcional antes do merge) e segue para publicação conforme o fluxo do projeto.
