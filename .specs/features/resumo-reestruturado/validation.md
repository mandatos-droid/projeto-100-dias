# Resumo do Preenchimento Reestruturado Validation: PASS

**Date**: 2026-11-10 (rodada 2 de re-verificação; a rodada 1 terminou em FAIL)
**Spec**: `.specs/features/resumo-reestruturado/spec.md`
**Diff range**: `e2b3b0c~1..9998022` (branch `feat/resumo-reestruturado`; `docs(resumo): add spec, design and tasks` até HEAD `9998022`). Rodada 2: `20ede58..9998022` (`cc69686`, `b88b421`, `277e5f6`, `4d4002d`, `9998022`).
**Verifier**: independent sub-agent (author ≠ verifier)

## Verdict: PASS

**Rodada 2.** Os 3 gaps de teste da rodada 1 (limiar de 160 px, `nome_civil`, `porTerritorio`) foram corrigidos e re-verificados por mutação: W2, W3, I4, S3, S4 e o cosmético C3 agora são mortos, e 4 mutantes novos nas áreas alteradas também. Gates: `tsc` 0 erros, `npm test` 1282/0, Playwright com somente as 11 falhas pré-existentes aceitas (157 passed; as 2 flaky da rodada 1 passaram). Único sobrevivente: E4, quase equivalente e sem impacto na spec. Pendências de produto e pontos finos de precisão ficam ao fim; nenhum contradiz um critério de aceitação.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 a T13 | ✅ Done | commits `4df3b8d`..`f4d5906`; `tasks.md` marca todas como concluídas |
| T5 | ⚠️ SPEC_DEVIATION | deputado federal e senador usam as cadeiras da Casa inteira (`nacional.json`); vereador sem o número (`ilhas/ResumoRetrato.tsx:13`) |
| T8 | ⚠️ SPEC_DEVIATION | grupo "Potenciais" lê `status:'potencial'`, que o Guia não grava (`lib/types.ts:37`: `Status = 'aliado' \| 'concorrente' \| 'neutro'`) |

---

## Spec-Anchored Acceptance Criteria

(`U` = unit, `E` = e2e; linhas de `tests/legado-resumo.test.ts` = `L:`)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| RES-02.1 barra | "38%" e "6 de 16 exercícios concluídos"; 0%/0 de 16; 100% | `tests/legado-resumo.test.ts:271` (`includes('<b>38%</b><span>6 de 16 exercícios concluídos</span>')`), `:276`, `:282`; `e2e/resumo-estrutura.spec.ts:22` (`toHaveText('38%')`) | ✅ PASS |
| RES-02.2 segmentos | "M{n} · curto", "feitos/total", barra `--p` = feitos/total | `tests/legado-resumo.test.ts:294` (`;--p:75%`, `M1 · Prepare sua chegada`, `3/4`); `e2e/resumo-estrutura.spec.ts:22` | ✅ PASS |
| RES-02.3 clique abre/rola sem mudar hash | missão aberta, topo na janela, `location.hash === '#/resumo'` | `e2e/resumo-estrutura.spec.ts:58` (`expect(location.hash).toBe('#/resumo')`) | ✅ PASS |
| RES-02.4 scroll-spy 160 px + `aria-current` | última missão com topo ≤ 160 px; 1ª se nenhuma; demais "false" | `e2e/resumo-estrutura.spec.ts:71` (rola para topo da M3 = 100 px; `aria-current` true/false) ; barra sticky `e2e/resumo-layout.spec.ts:22` | ✅ PASS (rodada 2): `e2e/resumo-estrutura.spec.ts:158` posiciona a M3 a ~150 px (`aria-current` true) e a ~170 px (M3 false, M2 true); W2, W3, W9, W10 mortos. Tolerância de 10 px: 159/161 não são distinguidos |
| RES-02.5 barra não cobre o título | `top` do título ≥ `bottom` da barra | `e2e/resumo-layout.spec.ts:39` (`toBeGreaterThanOrEqual(0)`) | ✅ PASS |
| RES-02.8 / RES-03 celular | botão fixo no rodapé, largura toda, `env(safe-area-inset-bottom)`, segmentos rolam | `e2e/resumo-layout.spec.ts:50` (`position fixed`, `width 800`, `contain('env(safe-area-inset-bottom)')`), `:73` (`overflow-x auto`) | ✅ PASS (só 800 px e 375 px; a borda 61,25rem não é testada) |
| RES-03.6 ação única | 1 botão; sem "Gerar PDF"/"JSON" | `tests/legado-resumo.test.ts:308` (`split('class="bt').length - 1 === 1`); `e2e/resumo-estrutura.spec.ts:82` | ✅ PASS |
| RES-03.7 download | `regimento-<nome>-completo.html` e toast "Resumo completo baixado." | `e2e/resumo-estrutura.spec.ts:82` (`suggestedFilename()`, `#toast` `toHaveText`) | ✅ PASS |
| RES-01.1 estrutura | 5 `<details class="missao">` com "Missão n", curto, prazo, feitos/total; 16 `<details class="ex">` | `tests/legado-resumo.test.ts:79`, `:97` (`equal(length, 16)`) | ✅ PASS |
| RES-01.2 `<summary>` do exercício e prévia | título linkado, selo, `estadoTxt`, prévia ≤ 160 | `tests/legado-resumo.test.ts:107`, `:164`, `:172`, `:177` (`length === 160`, `endsWith('…')`) | ✅ PASS |
| RES-01.3 abertura da missão | fechada se nenhum exercício abre | `tests/legado-resumo.test.ts:123` (`[true,true,false,false,false]`), `:386` | ✅ PASS |
| RES-01.4 abertura do exercício e caixa de vazio | "não iniciado" sem resposta: fechado + "Nenhuma resposta registrada ainda." + "Começar este exercício →"; demais abertos com `Resumo.ex` | `tests/legado-resumo.test.ts:132`, `:142`, `:364`, `:377` | ✅ PASS |
| RES-10 (01.5) "Continuar este exercício →" | só em "andamento", para `#/m/{n}/{id}` | `tests/legado-resumo.test.ts:154` | ✅ PASS |
| RES-01.6 teclado | Enter/Espaço abrem e fecham | `e2e/resumo-regressao.spec.ts:77` | ✅ PASS |
| RES-04 (01.7) expandir/recolher | 21 `<details>` abertos / fechados | `e2e/resumo-estrutura.spec.ts:93` (`toEqual(Array(21).fill(true))`) | ✅ PASS |
| RES-01.8 só o que falta | oculta concluídos e missões totalmente concluídas; ao desmarcar restaura o estado | `e2e/resumo-estrutura.spec.ts:101` (`expect(await abertos(page)).toEqual(antes)`) | ✅ PASS |
| RES-01.9 contador | "{N} exercícios ainda sem conclusão"; singular; "Todos os exercícios estão concluídos." | `tests/legado-resumo.test.ts:288`; `e2e/resumo-estrutura.spec.ts:117` | ✅ PASS |
| RES-01.10 "Nenhum exercício pendente." | visível só com filtro e N = 0 | `e2e/resumo-estrutura.spec.ts:47` | ✅ PASS |
| RES-06.1 cartão da parlamentar | nome parlamentar (ou **civil**), "cargo · UF", partido | `e2e/resumo-retrato.spec.ts:20` (`toHaveText('Ana Souza')`, `Deputado(a) Estadual · SP`) | ✅ PASS (rodada 2): `e2e/resumo-retrato.spec.ts:107` (`nome_parlamentar: ''`, `nome_civil: 'Maria Oliveira'` → `toHaveText('Maria Oliveira')`, `.foto` contém `'M'`); I4 e I8 mortos |
| RES-06.2 foto TSE | URL `ele2026/6259` / `ele2024/619` | `tests/resumo-retrato.test.ts:8`, `:14`; `e2e/resumo-retrato.spec.ts:32` (`toHaveAttribute('src', ...)`) | ✅ PASS |
| RES-06.3 inicial | sem `sq` ou foto bloqueada: 1ª letra maiúscula | `tests/resumo-retrato.test.ts:24`, `:34`; `e2e/resumo-retrato.spec.ts:40` (`'A'`, `'Â'`) | ✅ PASS |
| RES-06.4 votos pt-BR + legenda | "97.335", "57º mais votado(a) · SP · TSE" | `tests/resumo-retrato.test.ts:42`, `:54`; `e2e/resumo-retrato.spec.ts:20` | ✅ PASS |
| RES-06.5 cadeiras do partido | "Cadeiras do {partido} na {Casa}" | `e2e/resumo-retrato.spec.ts:50` (`'16'`, `'Cadeiras do PT na Assembleia Legislativa de São Paulo'`) | ✅ PASS para estadual; a spec (T17) agora descreve federal/senador (Casa inteira em `nacional.json`) e vereador sem número, mas esses casos seguem sem e2e (pendência de teste) |
| RES-06.6 filiados | "112 mil+"; "9.800" | `tests/resumo-retrato.test.ts:47`; `e2e/resumo-retrato.spec.ts:50` (`'374 mil+'`) | ✅ PASS |
| RES-06.7 equipe X/Y e legenda | "{X}/{Y}", "1 processo seletivo a abrir" | `tests/resumo-retrato.test.ts:60`, `:72`; `e2e/resumo-retrato.spec.ts:66` (`'2/4'`, `'1 processo seletivo a abrir'`) | ✅ PASS |
| RES-06.8 fonte indisponível omitida | sem traço nem caixa vazia | `tests/resumo-retrato.test.ts:85`, `:97`; `e2e/resumo-retrato.spec.ts:77` | ✅ PASS |
| RES-06.9 falha de carga | número some, tela segue | `e2e/resumo-retrato.spec.ts:85` (rota 500 → `stat cadeiras toHaveCount(0)`; clique em M3 abre) | ✅ PASS |
| RES-06.10 ≤ 47,5rem | cartão acima dos números | `e2e/resumo-retrato.spec.ts:95` | ✅ PASS |
| RES-07.1 três grupos com contagem | "Aliados · 3", "Opositores · 2", "Potenciais · 1" | `tests/legado-resumo.test.ts:409`; `e2e/resumo-cartoes.spec.ts:20` | ✅ PASS (fixture `potencial` não é gravável pelo Guia hoje; ver Pendências) |
| RES-07.2 conteúdo do cartão | foto/inicial, nome, partido, cargo, município local, "97.335 votos" | `tests/legado-resumo.test.ts:418`, `:433`; `e2e/resumo-cartoes.spec.ts:29` | ✅ PASS |
| RES-07.3 anel | verde / coral / roxo | `e2e/resumo-cartoes.spec.ts:39` (`rgb(3, 82, 82)`, `rgb(235, 84, 84)`, `rgb(186, 107, 237)`) | ✅ PASS |
| RES-07.4, 07.5 | grupo vazio omitido; sem relações "não preenchido" | `tests/legado-resumo.test.ts:443`, `:450`; `e2e/resumo-cartoes.spec.ts:47`, `:56` | ✅ PASS |
| RES-07.6 download sem cartões | lista de texto igual à de antes | `tests/legado-resumo.test.ts:459`; `e2e/resumo-regressao.spec.ts:45` | ✅ PASS |
| RES-08.1, 08.5 tabela | colunas e 2 linhas; "—" em célula sem itens | `e2e/resumo-territorio.spec.ts:21` (`toHaveText(['Território','Problemas','Potencialidades'])`, `rj.nth(1) toHaveText('—')`); `tests/resumo-social.test.ts:59` | ✅ PASS |
| RES-08.2 território | "Brasil"; "Campinas (SP)"; uma linha por nome | `tests/resumo-social.test.ts:16`, `:26`, `:30` | ✅ PASS (rodada 2): `tests/resumo-social.test.ts:77-79` (`repetido[0].problemas.length === 1`), `:83` (MUN sem `uf` → `['Campinas']`); S3 e S4 mortos. A decisão "sem `uf`, sem sufixo" está só no comentário do teste (`:82`), não na spec |
| RES-08.3 ordem | Brasil, UFs, municípios; pt-BR | `tests/resumo-social.test.ts:37`, `:44`; `e2e/resumo-territorio.spec.ts:51` | ✅ PASS |
| RES-08.4 etiquetas | vermelha/verde com agenda e texto menor | `e2e/resumo-territorio.spec.ts:34` (`rgb(163, 42, 32)`, `rgb(3, 82, 82)`) | ✅ PASS |
| RES-08.6 vazio | "Nada registrado ainda." | `e2e/resumo-territorio.spec.ts:59` | ✅ PASS |
| RES-08.7 rolagem horizontal do quadro | quadro rola, página não | `e2e/resumo-territorio.spec.ts:66` (`{ rola: true, overflow: 'auto' }`) | ✅ PASS |
| RES-09.1 estrutura do organograma | chefia no topo; ramos na ordem de `COORDENACOES` | `tests/resumo-equipe.test.ts:28`, `:32`; `e2e/resumo-equipe.spec.ts:40` | ✅ PASS |
| RES-09.2 ordem no ramo | Chefia, Coordenação, Especialista, Executora | `tests/resumo-equipe.test.ts:39`, `:49`, `:57` | ✅ PASS |
| RES-09.3 três estados | cartão comum, "Processo seletivo a abrir" tracejado, "Sem nome" apagado | `e2e/resumo-equipe.spec.ts:23` (`border-top-style dashed`, `:33` `border-left-style dashed`, `Sem nome`, `rgb(147, 135, 128)`); `tests/resumo-equipe.test.ts:62` | ✅ PASS |
| RES-09.4 legenda | três estados | `e2e/resumo-equipe.spec.ts:50` | ✅ PASS |
| RES-09.5 formato antigo | vista derivada | `tests/resumo-equipe.test.ts:72`; `e2e/resumo-equipe.spec.ts:82` | ✅ PASS |
| RES-09.6 ≤ 47,5rem | coluna única, sem ligações | `e2e/resumo-equipe.spec.ts:65` (`display none`) | ✅ PASS |
| RES-09.7 sem linhas | "não preenchido" | `tests/resumo-equipe.test.ts:83`; `e2e/resumo-equipe.spec.ts:76` | ✅ PASS |
| RES-11.1 selos M/P | 5 linhas com selo certo, M verde, P vinho, texto escapado | `tests/legado-resumo.test.ts:486`, `:498`; `e2e/resumo-regressao.spec.ts:199` (`rgb(87, 23, 48)`, `rgb(3, 82, 82)`) | ✅ PASS |
| RES-11.2 | "não preenchido" sem item classificado | `tests/legado-resumo.test.ts:505` | ✅ PASS |
| RES-12.1 `Resumo.ex`/`Resumo.missao` inalterados | HTML idêntico com e sem `resumo-tela.js` | `tests/legado-resumo.test.ts:236`, `:517`, `:526`; `public/legacy/resumo.js` fora do diff | ✅ PASS |
| RES-12.2 Painel | mesmo conteúdo | `e2e/resumo-regressao.spec.ts:63` (`expect(corpo).toBe(esperado)`) | ✅ PASS |
| RES-12.3 download | sem barra, segmentos nem cartões; mesmos títulos | `e2e/resumo-regressao.spec.ts:45` | ✅ PASS |
| RES-12.4 `conteudo.js` idêntico | testes de hash seguem verdes | `npm test` 1281/0 (inclui `legado-m*.test.ts`); `conteudo.js` fora do diff | ✅ PASS |
| RES-05 (`beforeprint`/`afterprint`) | abre tudo e restaura | `e2e/resumo-estrutura.spec.ts:122` (`toEqual(antes)`); `tests/legado-resumo.test.ts:354` | ✅ PASS |
| RES-05.2 mídia de impressão | barra, ferramentas, setas ocultas | `e2e/resumo-layout.spec.ts:84` | ✅ PASS (estabilizado com `test.slow()` em `e2e/resumo-layout.spec.ts:85`; passou no gate completo) |
| RES-13.3 `<button>` com nome acessível e foco | "Ir para a Missão n: curto"; anel ≥ 2 px | `e2e/resumo-regressao.spec.ts:96`, `:112`; `e2e/resumo-layout.spec.ts:109` | ✅ PASS |
| RES-13.4 movimento reduzido | `scroll-behavior: auto`, `transition 0s` | `e2e/resumo-layout.spec.ts:96`; mutante W8 morto | ✅ PASS |
| RES-13.5 375 px | `scrollWidth <= clientWidth` | `e2e/resumo-layout.spec.ts:73`; `e2e/resumo-regressao.spec.ts:176` | ✅ PASS |
| RES-13.6 pt-BR e tabulares | "97.335", `tabular-nums` | `e2e/resumo-regressao.spec.ts:188` | ✅ PASS |

**Status**: ✅ 13/13 RES com evidência e valores assertados batendo com a spec (spec ajustada em T17: RES-02.4, 02.8, 06.5, 07.1, 09.1, 12.1 agora definem o que o código entrega).

### Edge cases

- [x] Mandato vazio: `tests/legado-resumo.test.ts:276`, `e2e/resumo-regressao.spec.ts:121`
- [x] 100% concluído: `tests/legado-resumo.test.ts:282`, `e2e/resumo-regressao.spec.ts:131`
- [x] Texto longo/sem espaços/HTML na prévia: `tests/legado-resumo.test.ts:177`, `:193`
- [x] Modo local (sem nuvem): todos os e2e rodam em modo local (`e2e/guia-real.ts`)
- [x] Trocar de tela e voltar redesenha: `e2e/resumo-regressao.spec.ts:138` (`6%` após marcar fora da tela)
- [x] Inicial com acento ou emoji: `tests/resumo-retrato.test.ts:34`, `:24`

---

## Discrimination Sensor

Scratch descartável fora do repositório (cópia de `plataforma/` em `%TEMP%`, servidor `next dev` na 3118, removido ao final). `git status --short` do worktree real igual ao baseline (`?? plataforma/playwright.isolado.config.ts`). Baseline do scratch verde (81 unit, 9 e2e de retrato) antes dos mutantes.

| # | File | Mutation | Killed? |
| - | ---- | -------- | ------- |
| U1 | `public/legacy/resumo-tela.js:27` | `abre` sem a cláusula "não iniciado com resposta visível" | ✅ |
| U2 | `resumo-tela.js:29` | `abreMissao`: `some` → `every` | ✅ |
| U3 | `resumo-tela.js:20` | prévia `slice(0,159)` → `slice(0,160)` | ✅ |
| U4 | `resumo-tela.js:20` | `>160` → `>=160` | ✅ |
| U5 | `resumo-tela.js:65` | singular "1 exercício" removido | ✅ |
| U6 | `resumo-tela.js:35` | "Continuar" quando `e!=='ok'` | ✅ |
| U7 | `resumo-tela.js:170` | fallback sem `Resumo.vivo` removido (lista) | ✅ |
| U8 | `resumo-tela.js:161` | classe do grupo Potenciais `po` → `al` | ✅ |
| U9 | `resumo-tela.js:181` | relação local deixa de ser filtrada da Casa | ✅ |
| U10 | `resumo-tela.js:203` | fragilidades sem filtro `f.mp` | ✅ |
| U11 | `resumo-tela.js:206` | classe do selo fixa em `P` | ✅ |
| U12 | `resumo-tela.js:202` | selos M/P também sem `Resumo.vivo` | ✅ |
| U13 | `resumo-tela.js:92` | ouvintes antigos não removidos | ✅ |
| U14 | `resumo-tela.js:65` | `n===0` → `n===1` (frase de conclusão) | ✅ |
| U15 | `resumo-tela.js:34` | ponto de montagem da ilha de equipe removido | ✅ |
| U16 | `resumo-tela.js:20` | prévia devolve texto em maiúsculas | ✅ |
| U17 | `resumo-tela.js:49` | contador `feitos/total` invertido | ✅ |
| U18 | `resumo-tela.js:46` | `data-pend` = feitos | ✅ |
| W1 | `resumo-tela.js:106` | scroll-spy `<=160` → `<=60` | ✅ |
| W2 | `resumo-tela.js:106` | scroll-spy `<=160` → `<=120` | ❌ R1, ✅ morto na R2 |
| W3 | `resumo-tela.js:106` | scroll-spy `<=160` → `<=260` | ❌ R1, ✅ morto na R2 |
| W4 | `resumo-tela.js:142` | `afterprint` restaura tudo fechado | ✅ |
| W5 | `resumo-tela.js:121` | filtro não oculta missão toda concluída | ✅ |
| W6 | `resumo-tela.js:112` | clique no segmento não abre a missão | ✅ |
| W7 | `resumo-tela.js:105` | sem "a 1ª se nenhuma passou" | ✅ |
| W8 | `resumo-tela.js:111` | movimento reduzido ignorado na rolagem | ✅ |
| L1 | `lib/resumoRetrato.ts:11` | foto 2024 só para prefeito | ✅ |
| L2 | `lib/resumoRetrato.ts:23` | abreviação de 10.000 → 100.000 | ✅ |
| L3 | `lib/resumoRetrato.ts:59` | equipe `ativas > 0` → `>= 0` | ✅ |
| L4 | `lib/resumoRetrato.ts:34` | singular de `legendaVagas` | ✅ |
| L5 | `lib/resumoRetrato.ts:58` | filiados sem exigir partido | ✅ |
| E1 | `lib/resumoEquipe.ts:76` | estado "aberto" colapsado em "ok" | ✅ |
| E2 | `lib/resumoEquipe.ts:86` | ordem por categoria removida | ✅ |
| E3 | `lib/resumoEquipe.ts:91` | área vazia vai para "Logística" | ✅ |
| E4 | `lib/resumoEquipe.ts:85` | `arvore` sem `migrada(c)` | ❌ Survived nas duas rodadas (quase equivalente: `vistaDaTabela` já materializa `m2.n`; ramo defensivo; sem impacto em AC) |
| W9 | `resumo-tela.js:106` | scroll-spy `<=160` → `<=145` (novo, R2) | ✅ |
| W10 | `resumo-tela.js:106` | scroll-spy `<=160` → `<=175` (novo, R2) | ✅ |
| I8 | `ilhas/ResumoRetrato.tsx:58` | inicial calculada só do nome parlamentar (novo, R2) | ✅ |
| C6 | `ilhas.css` (`.car.vaga`) | borda esquerda sólida, outra forma (novo, R2) | ✅ |
| S1 | `lib/resumoSocial.ts:109` | ordem UF/MUN trocada | ✅ |
| S2 | `lib/resumoSocial.ts:130` | `localeCompare('pt-BR')` → `<` | ✅ |
| S3 | `lib/resumoSocial.ts:116` | nome repetido no mesmo item não é deduplicado (`new Set` removido) | ❌ R1, ✅ morto na R2 |
| S4 | `lib/resumoSocial.ts:115` | MUN sem `uf` vira "Nome (undefined)" | ❌ R1, ✅ morto na R2 |
| S5 | `lib/resumoSocial.ts:127` | tipos problema/potencialidade trocados | ✅ |
| C1 | `public/legacy/ilhas.css` | barra `sticky` → `static` | ✅ |
| C2 | `ilhas.css` (print) | barra não oculta na impressão | ✅ |
| C3 | `ilhas.css` (`.car.vaga`) | borda esquerda tracejada → sólida | ❌ R1, ✅ morto na R2 (`e2e/resumo-equipe.spec.ts:33`) |
| C4 | `ilhas.css` (`ul.frag b.M`) | selo M vinho em vez de verde | ✅ |
| C5 | `ilhas.css` (`.cards.op`) | anel do opositor verde | ✅ |
| I1 | `ilhas/ResumoEquipe.tsx:87` | texto da vaga = "Sem nome" | ✅ |
| I2 | `ilhas/Social.tsx` | célula vazia sem "—" | ✅ |
| I3 | `ilhas/ResumoRetrato.tsx:47` | "com nome" conta linhas com `*` | ✅ |
| I4 | `ilhas/ResumoRetrato.tsx:50` | sem fallback para `nome_civil` | ❌ R1, ✅ morto na R2 |
| I5 | `ilhas/ResumoRetrato.tsx:57` | `onError` da foto removido | ✅ |
| I6 | `ilhas/ResumoRetrato.tsx:37` | filiados lê o índice errado | ✅ |
| I7 | `ilhas/ResumoRetrato.tsx:45` | cadeiras sempre 0 | ✅ |

**Sensor depth**: lightweight ampliado. Rodada 1: 52 mutantes. Rodada 2: reinjetados W2, W3, I4, S3, S4, C3, E4 (mais S1, S5, W1 de controle) e 4 novos (W9, W10, I8, C6) em scratch descartável (cópia de `plataforma/` em `%TEMP%`, `next dev` na 3118, removidos ao final; `git status --short` do worktree real igual ao baseline).
**Result**: 56 mutantes distintos, 55 mortos, 1 sobrevivente (E4, quase equivalente) - PASS ✅

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ (ilhas e libs enxutas; `resumo-tela.js` 220 linhas) |
| Surgical changes | ✅ (diff só em arquivos da feature; nenhum arquivo gerado) |
| No scope creep | ✅ |
| Matches patterns | ✅ (padrão `vm` do legado, ilhas via `ponte.tsx`) |
| Spec-anchored outcome check | ⚠️ 2 lacunas de precisão (limiar 160 px; `nome_civil`) |
| Per-layer coverage | ✅ (domínio 1:1 com ACs; e2e por interação) |
| Every test maps to a spec requirement | ✅ (os testes sem RES explícito mapeiam a edge case ou design) |
| Guidelines | `plataforma/CLAUDE.md`, `plataforma/AGENTS.md` |

Restrições: nenhum de `public/legacy/app.js`, `resumo.js`, `legacy.css`, `conteudo.js`, `lib/legacyBody.ts`, `graphify-out/` ou `playwright.isolado.config.ts` consta no diff `e2b3b0c~1..f4d5906`; `Resumo.ex`/`Resumo.missao` não foram editados (apenas sobrepostos sob `Resumo.vivo`, só para o tipo `frag`, `resumo-tela.js:201`).

---

## Gate Check (rodada 2, HEAD `9998022`)

- **`npx tsc --noEmit`**: exit 0.
- **`npm test`** (isolado): **1282 passed, 0 failed, 0 skipped** (+1 teste novo de `resumo-social` sobre a rodada 1: 1281). Sem flakiness.
- **Playwright** (`resumo-`, `rumo-painel`, `m1-`, `m23-`, porta 3117): **157 passed, 11 failed**, as 11 pré-existentes aceitas (`m1-etapas:26`, `m23-migracao:110`, `m23-pdf:39`, `m23-plano:64/92/148`, `m23-rotinas:31/42`, `rumo-painel:19/32/54`). Nenhuma falha nova; `resumo-layout:84` e `resumo-regressao:112` (timeouts da rodada 1) passaram.
- **Test count**: antes da feature 1200 unit; agora 1282 (+82). E2E novos: 60 (58 + 2 da rodada 2, mais 1 asserção em `resumo-equipe`). Nenhum teste removido nem asserção enfraquecida: o diff da rodada 2 só adiciona asserções, 3 testes e `test.slow()`.
- **Skipped**: nenhum. Servidores 3117 e 3118 derrubados.

---

## Fix Plans

Rodada 1 (FAIL) para rodada 2 (PASS): Fix 1 (`cc69686`, limiar 160 px), Fix 2 e 3 (`b88b421`, `nome_civil` e `porTerritorio`), Fix 4 (`277e5f6`, `test.slow()` nos dois e2e lentos), spec (`4d4002d`) e tipo (`9998022`) confirmados. Nenhuma correção pendente.

Opcional, não bloqueia:
- E4: teste direto de `arvore()` com campos do formato antigo, sem passar por `vistaDaTabela`.
- RES-02.4: a spec agora diz "160 px exatos contam; 161 não", mas o e2e fixa 150/170 (10 px de tolerância); um teste em 160/161 fecharia a borda exata.
- RES-02.8: testar a borda 980/981 px.
- RES-06.5: e2e para deputado federal/senador (Casa inteira) e vereador (sem número).
- RES-08.2: levar a decisão "município sem `uf` fica só com o nome" para a spec.

---

## Pendências de produto (não são falhas)

1. **Grupo "Potenciais"**: o Guia ainda não grava `status:'potencial'` (`lib/types.ts:37`). A spec (T17, RES-07.1) agora diz isso e que o grupo vazio é omitido, então spec e testes estão honestos; falta a fonte de dados (decisão de produto).
2. **Cadeiras da Casa**: spec RES-06.5 atualizada (estadual, federal/senador e vereador). Federal/senador seguem sem e2e.
3. **Spec**: RES-09.1 ("Chefia de área"), RES-12.1 (exceção `frag`/listas de pessoas sob `Resumo.vivo`), RES-02.4 e RES-02.8 foram alinhadas ao código em T17. A decisão sobre município sem `uf` ainda não está na spec.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| RES-01 a RES-13 | Implemented | ✅ Verified (rodada 2) |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 13/13 RES com `arquivo:linha` e assertivas batendo com a spec ajustada
**Sensor**: 55/56 mutantes mortos (E4 quase equivalente)
**Gate**: tsc 0 erros; `npm test` 1282/0; Playwright 157 passed, só as 11 pré-existentes

**What works**: toda a feature conforme a spec; regressões (Painel, download, `Resumo.ex`/`Resumo.missao`) protegidas; os gaps da rodada 1 foram fechados por testes que agora matam os mutantes.

**Next steps**: decisão de produto sobre a fonte do status `potencial` e os itens opcionais de precisão acima.
