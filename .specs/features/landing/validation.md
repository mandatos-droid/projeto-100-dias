# Landing Validation

**Date**: 2026-10-23
**Spec**: `.specs/features/landing/spec.md`
**Diff range**: `344c816^..HEAD` (HEAD = e815d9c), escopo `plataforma/` e `.specs/`
**Verifier**: independent sub-agent (author != verifier)

**Verdict**: PASS
**Result**: PASS

Ressalvas: 0 ACs sem evidência; 4 lacunas de precisão da spec e 2 melhorias menores (seção "Lacunas ranqueadas"). Nenhum mutante não equivalente sobreviveu.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 a T4 (rotas) | Done | `plataforma/app/guia/layout.tsx:9-16`, `plataforma/app/page.tsx:27` |
| T5, T6 (runner, tsconfig) | Done | `plataforma/package.json:11` (script `test`) |
| T7 a T10 (lógica pura) | Done | `plataforma/lib/demo.ts`, `plataforma/lib/landing.ts` |
| T11 a T14 (UI da demo) | Done | `plataforma/app/_landing/*.tsx`, `plataforma/app/landing.css` |
| T15 a T21 (seções) | Done | idem |
| T22 (montagem) | Done | `plataforma/app/page.tsx:27-52` |

Todas as 22 tasks marcadas `[x]` em tasks.md.

---

## Spec-Anchored Acceptance Criteria

Convenção: "teste" = `plataforma/tests/demo.test.ts` (D) ou `plataforma/tests/landing.test.ts` (L). UI sem runner: evidência por leitura do componente (C) e por fumaça no navegador (F, Playwright em `next start -p 3112`).

### P1: Chegar na landing e entrar no Guia

| AC | Spec-defined outcome | `file:line` + evidência | Result |
| -- | -------------------- | ----------------------- | ------ |
| 1 | Título "Os primeiros 100 dias moldam o resto do mandato" e botão "Começar meu Mapa Político" visíveis sem rolar em 1280x720 | C `plataforma/app/_landing/Hero.tsx:29` (h1) e `Hero.tsx:33` (CTA). F: h1 termina em y=428, CTA em y=620 (< 720); texto do h1 "OS PRIMEIROS 100 DIAS MOLDAM O RESTO DO MANDATO" (caixa alta por CSS; HTML servido tem o texto exato) | PASS |
| 2 | Qualquer botão "Começar meu Mapa Político" navega a `/guia` | C `Hero.tsx:24`, `Hero.tsx:33`, `plataforma/app/page.tsx:40`, `plataforma/app/_landing/Fechamento.tsx:8`: todos `<a href="/guia">`. F: HTML de `/` tem 4 `href="/guia"`; clique no CTA do hero cai em `/guia` | PASS |
| 3 | `/guia` exibe o Guia legado com login/cadastro, como antes | C `plataforma/app/guia/page.tsx` (mv do page.tsx anterior, `git diff` mostra rename) e `plataforma/app/guia/layout.tsx:12-13` (legacy.css + ilhas.css). F: `/guia` 200, HTML tem `/legacy/legacy.css` e `/legacy/ilhas.css`, `<title>` "Guia dos 100 Dias · Legisla Brasil". Login Google real não exercitado (exige Supabase) | PASS (login Google não testado de ponta a ponta) |
| 4 | `/` não aplica `legacy.css` nem `ilhas.css` | C `plataforma/app/layout.tsx:9-15` (sem `<link>`). F: `grep -c 'legacy.css\|ilhas.css'` no HTML de `/` = 0; `document.styleSheets` em `/` = só 1 chunk `_next/static/...css` | PASS |
| 5 | `/` com `#access_token=` ou `#error_description=` redireciona para `/guia` preservando o hash | Teste L `plataforma/tests/landing.test.ts:6` `assert.equal(destinoAuth('#access_token=x&type=y'), '/guia#access_token=x&type=y')`; `landing.test.ts:10` idem para `#error_description=a+b`; negativo `landing.test.ts:14-15`. C `plataforma/app/_landing/RedirecionaAuth.tsx:8-9` (`location.replace`). F: navegações observadas `/#error_description=a+b` -> `/guia#error_description=a+b`; `/#access_token=x` -> `/guia#access_token=x`. O hash some depois, mas por ação do cliente Supabase do Guia legado, não da landing | PASS |
| 6 | `/painel` continua servindo `painel.html` | F: `curl /painel` = 200. Sem teste automatizado (config de rewrite não foi alterada no diff) | PASS (só fumaça) |
| 7 | Botão repetido no topo, após a demo e no fechamento | C `Hero.tsx:24` (topo), `plataforma/app/page.tsx:40` (após a demo), `Fechamento.tsx:8` (fechamento). F: 4 links no HTML | PASS |

### P1: Demonstração com dados do TSE

| AC | Spec-defined outcome | `file:line` + evidência | Result |
| -- | -------------------- | ----------------------- | ------ |
| 1 | 2+ caracteres lista até 8 eleitos por nome de urna ou civil, ignorando acentos e caixa | D `plataforma/tests/demo.test.ts:15-18` (`busca(..., 'joao')` acha 'JOÃO SILVA'); D `demo.test.ts:20-23` (nome civil); D `demo.test.ts:32-37` (limite 8). Impl `plataforma/lib/demo.ts:12-19`. F: "silva" lista 8 opções | PASS |
| 2 | Com menos de 2 caracteres não lista | D `demo.test.ts:25-30` (`busca(todos,'a')`, `'   '`, `''` = `[]`). F: "s" = 0 opções. Impl `demo.ts:14` | PASS |
| 3 | Escolher exibe foto, nome de urna, partido, cargo, UF, votos nominais e % dos votos válidos | D `demo.test.ts:82-90` (rótulos de cargo). C `plataforma/app/_landing/CartaoEleito.tsx:52,54,55,60,61` (foto, `e.u`, cargo/partido/UF, votos, `pct(e.x)`). F: cartão de "REINALDO AZAMBUJA": "Senador · PL · MS", "903.554 votos nominais", "34,65% dos votos válidos" | PASS |
| 4 | Posição por votos entre eleitos da mesma Casa e UF, formato "Nº X de Y" | D `demo.test.ts:43-54` (`{ n: 1, de: 3 }`, outra UF e outra Casa ignoradas, empate pela ordem de entrada). C `CartaoEleito.tsx:62` `Nº {n} de {de}`. F: "Nº 1 de 2" | PASS |
| 5 | Cadeiras do partido na mesma Casa e UF | D `demo.test.ts:56-65` (`cadeirasPartido === 2`, ignora UF e Casa diferentes). C `CartaoEleito.tsx:63` | PASS |
| 6 | Informa reeleito / outro cargo / primeiro mandato, quando o dado existir | D `demo.test.ts:67-73` (4 asserts, `'?'` = `null`). C `CartaoEleito.tsx:55` (só exibe se não nulo). F: "primeiro mandato" | PASS |
| 7 | Até 6 pleitos, do mais recente ao mais antigo, com ano, cargo, partido, votos, situação | D `demo.test.ts:94-97` (ordem), `demo.test.ts:99-105` (6 de 8, primeiro 2020, último 2010), `demo.test.ts:107-111` (campos). C `CartaoEleito.tsx:29,32-40`. F: tabela com 5 pleitos 2018..2006 em ordem decrescente | PASS |
| 8 | Sem resultado: "Não encontramos esse nome entre os eleitos de 2026. Confira a grafia ou cadastre-se para trabalhar com qualquer candidatura." | Lógica D `demo.test.ts:39-41`. Texto C `plataforma/app/_landing/Demo.tsx:46`, condição `Demo.tsx:26`. F: "zzzz" mostra o texto exatamente igual ao da spec | PASS |
| 9 | Falha dos pleitos: cartão visível e "Histórico indisponível agora" | C `CartaoEleito.tsx:23`, `Demo.tsx:35`. F: rota `**/pleitos/**` abortada: `.ld-msg` = "Histórico indisponível agora" e `.ld-card` visível | PASS |
| 10 | Foto do TSE falha: inicial do nome | C `CartaoEleito.tsx:15-16` (inicial sempre renderizada, `<img>` removido em `onError`). F: com `resultados.tse.jus.br` abortado, `.ld-foto img` = 0 e texto "R" | PASS |
| 11 | Cartão mostra "Salvar meu mapa" que leva a `/guia` | C `CartaoEleito.tsx:73`. F: `href="/guia"` | PASS |
| 12 | Senador eleito em 2022: omitir % dos votos válidos e posição por votos | D `demo.test.ts:75-80` (`posicao === null` para `a: 2022`, `{ n: 1, de: 1 }` para o de 2026). Impl `demo.ts:42-46`. C `CartaoEleito.tsx:48,60,61,62`. F: Rogério Marinho (2022, `v: 0`, `x: 0`) sem % e sem posição. O código omite também "votos nominais" (`CartaoEleito.tsx:60`), o que a spec não pede; ver lacuna 1 | PASS com lacuna de precisão |
| 13 | Nunca exibir título, CPF nem nascimento | D `demo.test.ts:118-121` (chaves das linhas = `ano, cargo, municipio, partido, situacao, votos`). C `CartaoEleito.tsx` não referencia campos sensíveis; `historico` lê só os índices 0,1,3,4,6,8 (`demo.ts:64`). `Eleito` não carrega esses campos. Confianca.tsx:14 só os menciona para negá-los | PASS |

### P2: Entender o caminho completo

| AC | Spec-defined outcome | `file:line` + evidência | Result |
| -- | -------------------- | ----------------------- | ------ |
| 1 | 5 missões em linha do tempo com título, dia (15, 30, 45, "desde o 1º dia", 100) e entrega | C `plataforma/app/_landing/Missoes.tsx:3,7,11,15,19` (dias '15','30','45','Desde o 1º dia','100'), lista `<ol>` `Missoes.tsx:31`. Grafia "Desde o 1º dia" com D maiúsculo (spec cita em minúscula; irrelevante) | PASS |
| 2 | 4 blocos: mapas, hemiciclo, equipe recomendada, resumo/painel | C `plataforma/app/_landing/Funcionalidades.tsx:67,72,77,83` (títulos "Mapas do território", "Hemiciclo da Casa", "Equipe recomendada", "Resumo e progresso") | PASS |
| 3 | Faixa de privacidade: dados do mandato ficam com o mandato; demo usa só dados públicos do TSE | C `plataforma/app/_landing/Confianca.tsx:6,10,14` | PASS |
| 4 | Cita TSE e IDSC-BR e identifica a Legisla Brasil como autora do Guia | C `Confianca.tsx:18`, `plataforma/app/_landing/Fechamento.tsx:14` | PASS |
| 5 | FAQ: tempo, quem pode usar, 100 dias já passaram, gratuito | C `plataforma/app/_landing/Faq.tsx:3,7,11,15` (4 `<details>`) | PASS |

### P2: Qualidade de acesso

| AC | Spec-defined outcome | `file:line` + evidência | Result |
| -- | -------------------- | ----------------------- | ------ |
| 1 | 360 px sem rolagem horizontal | C `plataforma/app/landing.css:14` (`overflow-x: hidden` no contêiner `.ld`). F: viewport 360, com cartão aberto: `documentElement.scrollWidth` = 360 = `clientWidth` | PASS |
| 2 | Rótulo associado ao campo; lista com `role="listbox"` | C `plataforma/app/_landing/BuscaEleito.tsx:36` (`label htmlFor`), `BuscaEleito.tsx:38` (`id` correspondente), `BuscaEleito.tsx:52` (`role="listbox"`), `:58` (`role="option"`). F: 1 label, 1 listbox | PASS |
| 3 | Setas e Enter movem o destaque e escolhem | C `BuscaEleito.tsx:29-31` (ArrowDown/ArrowUp/Enter). F: ArrowDown -> `aria-activedescendant=ld-op-1`; Enter escolheu "REINALDO AZAMBUJA" (a 2ª opção, a destacada) e abriu o cartão | PASS |
| 4 | Título, descrição e `lang="pt-BR"` com título diferente do Guia | C `plataforma/app/page.tsx:17-18` e `plataforma/app/layout.tsx:11`. F: `<title>Guia dos 100 Dias: o mapa do seu mandato · Legisla Brasil</title>` em `/` x `Guia dos 100 Dias · Legisla Brasil` em `/guia`; `<html lang="pt-BR">` | PASS |

**Status**: todos os ACs com evidência localizada. 4 lacunas de precisão da spec flagradas.

---

## Edge Cases

- [x] Só espaços não lista: D `demo.test.ts:28`; `Demo.tsx:26` usa `normaliza(valor).length >= 2`, então espaços também não disparam a mensagem de "nenhum resultado".
- [x] Mais de 8 casamentos: os 8 de maior votação: D `demo.test.ts:32-37` (`[110, 100, 90, 80, 70, 60, 50, 40]`). Impl `demo.ts:17-18`.
- [x] `eleitos.json` falha: "Não foi possível carregar a base do TSE agora" e CTA ativo: C `Demo.tsx:43`, CTA `page.tsx:40`. F: rota `**/eleitos.json` abortada mostra o texto exato e `.ld-pos-demo a` mantém `href="/guia"`.
- [x] Eleito sem entrada em `pleitos/{uf}.json`: "Sem pleitos anteriores no TSE": D `demo.test.ts:113-116`; C `CartaoEleito.tsx:24`, `Demo.tsx:34` (`historico(m[e.s])`). F: Rogério Marinho exibe o texto.
- [x] JavaScript desativado: landing e CTA como link comum: F: contexto Playwright com `java_script_enabled=False`: 4 CTAs presentes, clique no primeiro chega em `/guia`. C: os CTAs são `<a>` em componentes de servidor (`Hero.tsx`, `Fechamento.tsx`, `page.tsx:40`); FAQ usa `<details>` (`Faq.tsx:27`).

---

## Discrimination Sensor

Cópia isolada em diretório do scratchpad (`lib/demo.ts`, `lib/landing.ts`, `lib/types.ts`, `lib/dados.ts` e `tests/*.test.ts`), executada com `node --test`. Sem `git stash`, sem worktree; a cópia foi apagada. `git status --porcelain` da árvore real idêntico ao do início (177 linhas, `diff` vazio).

| # | File:line | Mutação | Killed? |
| - | --------- | ------- | ------- |
| 1 | `plataforma/lib/demo.ts:4` | limite `8` -> `9` | Killed |
| 2 | `demo.ts:17` | ordenação por votos invertida (`a.v - b.v`) | Killed |
| 3 | `demo.ts:14` | `t.length < 2` -> `< 1` | Killed |
| 4 | `demo.ts:50` | cadeiras do partido sem filtro de UF | Killed |
| 5 | `demo.ts:40` | posição/cadeiras sem filtro de Casa (`k`) | Killed |
| 6 | `demo.ts:8` | `normaliza` sem remover acentos | Killed |
| 7 | `plataforma/lib/landing.ts:3` | regex sem a âncora `[#&]` | Survived (equivalente para a spec) |
| 8 | `demo.ts:55` | limite do histórico `6` -> `7` | Killed |
| 9 | `demo.ts:62` | histórico em ordem crescente | Killed |
| 10 | `demo.ts:42` | `if (e.a === 2026)` -> `if (true)` | Survived (equivalente: o guard `n > 0` da linha 45 já devolve `null`) |
| 11 | `demo.ts:16` | busca só por nome de urna (sem nome civil) | Killed |
| 12 | `demo.ts:8` | `normaliza` sem `.trim()` | Killed |
| 13 | `demo.ts:28` | DF deixa de ser "Distrital" | Killed |
| 14 | `landing.ts:3` | regex sem `error_description` | Killed |
| 15 | `landing.ts:3` | redireciona para `/guia` sem preservar o hash | Killed |
| 16 | `demo.ts:21` | rótulo `r: 'reeleito'` trocado | Killed |
| 17 | `demo.ts:43` | desempate por `s` em vez da ordem de entrada | Killed |
| 18 | `demo.ts:64` | `votos: p[6]` -> `p[7]` | Killed |
| 19 | `demo.ts:42-43` | 2022 ranqueado (remove `a === 2026` nos dois pontos) | Killed |
| 20 | `demo.ts:43` | grupo da posição sem filtro `a === 2026` | Killed |

**Sensor depth**: expandido (20 mutações; a feature não é crítica, mas foram pedidas 5 a 8).
**Resultado do sensor**: 20 injetadas, 18 mortas, 2 sobreviventes, ambas equivalentes ou sem efeito observável pela spec.
Observação sobre #7: um hash como `#xaccess_token=1` passaria a redirecionar. Não é comportamento da spec; sem teste para essa borda. Baixo risco.

---

## Smoke Test da UI (spec exige; testes unitários não cobrem)

Servidor: `npx next start -p 3112` após `npm run build`. O primeiro `npm run build` falhou com `SecurityFatalError` (conhecido); a repetição passou. Servidor encerrado ao fim (porta 3112 sem resposta).

| Checagem | Resultado |
| -------- | --------- |
| `/` 200, `/guia` 200, `/painel` 200 | OK |
| `<title>` próprio em `/` e diferente do de `/guia` | OK |
| `<html lang="pt-BR">` | OK |
| 3+ links `href="/guia"` em `/` | OK (4 no HTML estático) |
| `legacy.css`/`ilhas.css` ausentes em `/`; presentes em `/guia` | OK |
| "silva" lista 8; "s" lista 0; setas + Enter escolhem; cartão aparece | OK |
| "zzzz" mostra a mensagem exata da spec | OK |
| Bloqueio de `**/pleitos/**`: "Histórico indisponível agora", cartão visível | OK |
| Bloqueio de `**/eleitos.json`: "Não foi possível carregar a base do TSE agora", CTA mantido | OK |
| Foto bloqueada: inicial do nome | OK |
| 360 px sem rolagem horizontal (com cartão aberto) | OK (scrollWidth 360 = clientWidth 360) |
| `/#access_token=x` e `/#error_description=a+b` redirecionam para `/guia` + hash | OK |
| JS desativado: 4 CTAs e navegação para `/guia` | OK |
| Senador 2022 (Rogério Marinho): sem %, sem posição, sem votos; "Sem pleitos anteriores no TSE" | OK, ver lacuna 1 |

Não verificado: login Google real em `/guia` (depende de Supabase e de redirect URL), `/painel` além do status 200, regra de 2 s em rede local (nenhum cronômetro).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | OK |
| Surgical changes | OK (commits tocam só arquivos da feature; `guia/page.tsx` é rename) |
| No scope creep | OK |
| Matches patterns | OK |
| Spec-anchored outcome check (asserted values match spec) | OK, com 4 lacunas de precisão |
| Per-layer Coverage Expectation (domínio 1:1 com ACs; UI por tsc/fumaça) | OK |
| Every test maps to a spec requirement | OK (19 testes, todos citam AC ou edge, `normaliza` é suporte de AC 1) |
| Documented guidelines followed | `plataforma/AGENTS.md` (Next 16), `plataforma/CLAUDE.md` |

---

## Gate Check

- **Gate command**: `npx tsc --noEmit && npm test && npm run build` (tasks.md, nível Build)
- **Resultado**: `npm test` 19 passed, 0 failed, 0 skipped. `npx tsc --noEmit` exit 0 depois do build. `npm run build` passou na segunda tentativa.
- **Nota**: antes do build, `tsc --noEmit` listou erros só em `.next/types/validator.ts` (referências a `app/alterador` e `app/api/alteracoes`, rotas que não existem mais; artefato obsoleto de `.next`, fora da feature). Nenhum erro em código-fonte. Depois do build, zero erros.
- **Test count before feature**: 0 (o repo não tinha testes)
- **Test count after feature**: 19
- **Delta**: +19
- **Skipped tests**: nenhum
- **Failures**: nenhuma

---

## Lacunas ranqueadas

Nenhuma bloqueia o PASS. Ordem por impacto.

1. Spec-precision, Demo AC 3 x AC 12: para senador de 2022 a spec manda omitir só o percentual e a posição, mas o código também omite "votos nominais" (`plataforma/app/_landing/CartaoEleito.tsx:60`). Na base, `v` = 0 para esses senadores, então exibir "0 votos" seria enganoso: a escolha do código é a correta. Ação sugerida: ajustar a spec (AC 12) para "omitir votos, percentual e posição". Nenhum teste cobre a regra de omissão de votos em UI.
2. Spec-precision, Demo AC 4: desempate de votos não está na spec; está só em tasks.md T8 ("ordem de entrada"). Coberto por `plataforma/tests/demo.test.ts:43-54`.
3. Spec-precision, Demo AC 1/8: o texto da busca e a mensagem de "nenhum resultado" dizem "eleitos de 2026", mas a base também inclui senadores eleitos em 2022 (AC 12 pressupõe isso). A mensagem é exata como a spec mandou; só a spec é imprecisa.
4. Spec-precision, Chegar AC 3 e Qualidade de acesso: o login Google em `/guia` e a regra "menos de 2 segundos" não têm critério mensurável nem teste; ficaram sem verificação automática.
5. Menor, `plataforma/lib/landing.ts:3`: o mutante #7 sobrevive porque nenhum teste fixa a âncora `[#&]` (ex.: `destinoAuth('#xaccess_token=1') === null`). Equivalente para a spec; opcional.
6. Menor, `plataforma/app/_landing/CartaoEleito.tsx:12`: a foto usa sempre o caminho `ele2026`; para senadores de 2022 a imagem não existe e cai na inicial (comportamento correto pela AC 10, só gera um request inútil).

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| LAND-01 | Pending | Verified |
| LAND-02 | Pending | Verified |
| LAND-03 | Pending | Verified |
| LAND-04 | Pending | Verified (lacuna de precisão: AC 12) |
| LAND-05 | Pending | Verified |
| LAND-06 | Pending | Verified |
| LAND-07 | Pending | Verified |
| LAND-08 | Pending | Verified |

(spec.md não foi editado por este verificador; atualizar a tabela é tarefa do orquestrador.)

---

## Summary

**Overall**: Ready

**Spec-anchored check**: 29/29 ACs com evidência (P1 Chegar 7, P1 Demo 13, P2 Entender 5, P2 Acesso 4) e 5/5 edge cases; 4 lacunas de precisão da spec
**Sensor**: 18/20 mutações mortas; 2 sobreviventes equivalentes
**Gate**: 19 testes passam; tsc exit 0; build passa na 2ª tentativa

**What works**: rotas `/`, `/guia`, `/painel`; CSS legado isolado em `/guia`; demonstração com os estados de erro exatos; redirecionamento de hash; acessibilidade da busca; 360 px sem rolagem horizontal; funcionamento sem JavaScript.

**Issues found**: apenas as lacunas ranqueadas acima.

**Next steps**: corrigir o texto do AC 12 na spec (lacuna 1); opcionalmente fixar a âncora do hash com um teste (lacuna 5).
