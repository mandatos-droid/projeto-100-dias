# Reestruturação da Missão 1 Validation

**Verdict**: PASS (iteração 3 de no máximo 3: 75/75 requisitos com PASS ancorado no valor da spec; mutantes N8 e N12 agora mortos; 12/12 mutações da iteração 3 mortas; gates verdes)
**Date**: 2026-11-11
**Spec**: `.specs/features/m1-reestruturacao/spec.md` (75 requisitos EARS)
**Diff range**: `8bbd641..2ed2b49` (65 commits na branch `feat/m1-reestruturacao`, worktree `m1-reestruturacao-wt`; a volta de correção da iteração 2 foi `2ed2b49`, que só toca `tests/legado-m1.test.ts`)
**Verifier**: independent sub-agent (author ≠ verifier). Nada de produto foi alterado; só este arquivo e a coluna Status da tabela de rastreabilidade do `spec.md` foram escritos.

Convenção: `tests/` e `e2e/` são `plataforma/tests/` e `plataforma/e2e/`. Citações de `tests/legado-m1.test.ts` com linha >= 440 já estão com a numeração atual (a edição da varredura GER-01 deslocou +17 linhas).

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 a T43 | ✅ Done | `**Status**: ✅ Done` em todas no `tasks.md` (T1 sem a linha, mas todos os "Done when" marcados); bookkeeping da iteração 1 resolvido |

---

## Spec-Anchored Acceptance Criteria

Regra payload/conjunção aplicada: cada valor da spec é afirmado como valor (texto, número, ordem, chave gravada), não só "o elemento existe". Valores numéricos dos e2e novos foram re-derivados pelo verificador a partir dos arquivos `public/data/**` (Campinas: 33 vereadores, 2 do PSOL, 1.498 filiados, 88.745/589.932 = 15,04%, 8,97% em SP; Franca: 15, 1, 335, 5,23%), conforme a definição da spec, sem usar a implementação.

### Os 13 que estavam parciais ou sem teste (re-derivados)

| Critério | Resultado definido pela spec | `file:line` + assertion | Result |
| -------- | ---------------------------- | ----------------------- | ------ |
| PER-02 | lista com posição, nome, partido ao lado do nome, sem barras | `e2e/m1-persona.spec.ts:60-65` `.rk-pos` `'1º'`/`'2º'`, `.rk-nome` `'EDUARDA CAMPOPIANO'`/`'EDUARDO SUPLICY'`, `.rk-nome .chip` `'PL'`/`'PT'`; `:66` `.barra-p` count 0 | ✅ PASS |
| PER-04 | pleito anterior a 2026 sem cartões nem lista de municípios | `e2e/m1-persona.spec.ts:84-93` pleito manual 2022 com a 2026 vinculada: `.mv5-cartao` count 5 (só o de 2026), `anterior.locator('.mv5, .mv5-cartao')` count 0, cartão da 2026 count 5 | ✅ PASS |
| LEG-01 | sem mapa/cartograma; hemiciclo; seletor "Brasil inteiro / UF" | `e2e/m1-conjuntura.spec.ts:118-119` `.mapa-br` count 0, opção 1 `toHaveText('Brasil inteiro')`; `:126` `getByRole('img', { name: 'Hemiciclo com N cadeiras' })` com N contado em `eleitos.json` | ✅ PASS |
| LEG-02 | abas "Câmara Legislativa" (DF) / "Assembleia Legislativa", "Câmara dos Deputados", "Senado", com contagem | `e2e/m1-conjuntura.spec.ts:123-125` regex com a contagem `^Assembleia Legislativa\s*${n('e')}$`, `^Câmara dos Deputados\s*${n('f')}$`, `^Senado\s*${n('s')}$` (n = contagem independente em `/data/eleitos.json`); DF: `:164` (Câmara Legislativa) e `tests/rotulos-m1.test.ts:26-37` | ✅ PASS |
| LEG-06 | grandes números e gráficos de gênero, cor ou raça e mandato logo abaixo dos filtros | `e2e/m1-conjuntura.spec.ts:132-145` `kpis.y >= filtros.y+filtros.height-1`, `kpis.y-(filtros.bottom) < 120`, `perfil` abaixo de `kpis`, `hemi` abaixo de `perfil`; `.perfil` contém `'Gênero'`, `'Cor ou raça'`, `'Mandato'`; `.kpis` contém `'parlamentares eleitos'` | ✅ PASS |
| PAR-02 | Placar (parlamentares, vereadores, prefeituras, filiados, posição nos Executivos) em cartões com borda | `e2e/m1-conjuntura-partido.spec.ts:32-39` 5 `.v2-grande`; `.rot` `toHaveText([/^Parlamentares/,'Vereadores (2024)','Prefeituras (2024)','Filiados','Posição nos Executivos'])`; `borderTopWidth > 0` nos 5 (`:34-36`); números Brasil/UF; `li span` `['Presidência','Governo SP','Prefeitura']` | ✅ PASS |
| PAR-05 | Placar do município: vereadores do município, do partido, foto e nome do prefeito, posição do partido, filiados | `tests/forcaMunicipio.test.ts:39-41` `deepEqual(numerosMun(...), {vereadoresPartido:2, vereadoresTotal:9, filiados:340, pct:25,...})` (+ caso sem dados `:44-48`); `e2e/m1-conjuntura-partido.spec.ts:68-74` Campinas `'33'`, `'2'`, `'1.498'`, `'Oposição'`, prefeito `'Dário Saadi'`, `'REPUBLICANOS'`, foto `src` `/250001918263/`; Franca `:81-85` `'15'`, `'1'`, `'335'`, `'Não informada'`, `'Alexandre Ferreira'` | ✅ PASS (posição agora no Placar, `ilhas/CartoesMunicipio.tsx:90`, commit `cfa45e9`) |
| PAR-06 | Força: % do partido no município e % no estado, para o cargo da liderança | `tests/forcaMunicipio.test.ts:20-34` `pctMun(A,'estadual','PSOL') == 25`, senado lê `senador` `== 10`, `pctEstado == 10` (=(250+150)/(1000+3000)), `null` sem votação/casa; `e2e/m1-conjuntura-partido.spec.ts:76-77,86` `'15,04%'`, `'8,97%'`, `'5,23%'` | ✅ PASS |
| PAR-07 | 4 posições, escolher uma, gravar em `D.conj2` como hoje | `e2e/m1-conjuntura-partido.spec.ts:53` radios `[/^Partido do governo/,/^Base aliada/,/^Oposição/,/^Independente/]`; `:89-95` grava `prefExtra` `'oposicao'`; `:97-108` domicílio: clique em "Base aliada" → `conj2.posicao.pref == 'base'` | ✅ PASS |
| PAR-08 | sem votação 2026: cartão só do domicílio, ou a mensagem | `e2e/m1-conjuntura-partido.spec.ts:97-108` 1 cartão `'Campinas'`, heading `'Município da liderança'`, `.mv5-pos` count 0, sem a mensagem; `:110-114` sem domicílio: mensagem "Informe o município de domicílio em Dados do mandato" e 0 cartões | ✅ PASS |
| SOC-09 | `D.social` segue gravado, sem apagar | `e2e/m1-oportunidades.spec.ts:192-201` semeia `D.social.itens`, marca "Saúde", espera `agendasPrio == ['saude']`, `social toEqual(SOCIAL)`, recarrega e repete | ✅ PASS |
| FEC-02 | HTML baixado na ordem do Resumo, com categorias de relação, resumo LEG-12, cartões, 2 reações, agendas prioritárias e cartões de agenda | `tests/legado-m1.test.ts:617` `'… 1 Oponente; 1 Oponente e concorrente; 1 Indefinida'`; `:618-620` os 5 cabeçalhos e os 6 nomes (`'Fabi Dupla'` semeada como `oponente_concorrente` em `:609`), `deepEqual` da ordem (`:621-622`); `:623-625` reações "Considerando … o mandato deve… ampliar a bancada"; agendas e cartões já afirmados na iteração 2 | ✅ PASS (re-derivado na iteração 3) |
| GER-01 | usa "liderança parlamentar"; sem "o/a parlamentar" para a pessoa | `tests/legado-m1.test.ts:450-455` varre `m1.js`, `novos.js` (exceto o "Selecione o parlamentar…" do cadastro da Missão 0) e todas as `ilhas/*.ts(x)` (`ESCRITO_A_MAO.length > 20`), `deepEqual(achados, [])`; `:457-461` a regex pega "o parlamentar" e ignora "liderança parlamentar"/"parlamentarismo"; mutantes N9 e N10 mortos | ✅ PASS |

### Os demais 62 (mantidos da iteração 1, reconferidos nos arquivos atuais)

| Critério | Resultado definido pela spec | `file:line` + assertion | Result |
| -------- | ---------------------------- | ----------------------- | ------ |
| PAG-01 | todas as perguntas na mesma página, ordem 1.1-1.3, 2.1-2.2, 3.1-3.3, 4.1 | `tests/legado-m1.test.ts:326-338` `tela.innerHTML.includes(titulo(it))` por item; `:406-413` ordem; `e2e/m1-pagina-unica.spec.ts:93-95` | ✅ PASS |
| PAG-02 | faixa de 4 nomes, atual em `aria-current="step"` | `tests/legado-m1.test.ts:232-239`; `e2e/m1-etapas.spec.ts:195-201` | ✅ PASS |
| PAG-03 | botão de seguir à etapa seguinte; sem avançar entre perguntas | `tests/legado-m1.test.ts:340-348`; `e2e/m1-pagina-unica.spec.ts:102-114` | ✅ PASS |
| PAG-04 | endereços antigos `#/m/1/<id>/1` abrem a página única | `tests/legado-m1.test.ts:351-360` `deepEqual(trocas, ['#/m/1/<id>'])`; `e2e/m1-pagina-unica.spec.ts:120-126` | ✅ PASS |
| PER-01 | sem o mapa "Onde estão os votos" | `e2e/m1-persona.spec.ts:55` `getByText('Onde estão os votos')` count 0 | ✅ PASS |
| PER-03 | 5 cartões, decrescente, posição, município, votos, % dos válidos | `tests/maisVotados.test.ts:12-20`; `e2e/m1-persona.spec.ts:67-72` (`'1º'`, `'4.000 votos'`, `'dos votos válidos'`) | ✅ PASS |
| PER-05 | mensagem "Não foi possível carregar os municípios mais votados agora." | `e2e/m1-persona.spec.ts:76-82`; `tests/maisVotados.test.ts:32-34` | ✅ PASS |
| PER-06 | texto "Seu papel agora é registrar…" abaixo dos dados, antes da caixa | `tests/legado-m1.test.ts:90-97` | ✅ PASS |
| PER-07 | texto "Registre até 3:" + 3 cartões "Conquista/Grande Entrega almejada 1..3" | `tests/legado-m1.test.ts:46-53`; `e2e/m1-persona.spec.ts:12-24` | ✅ PASS |
| PER-08 | cargos de hoje + "Não sei / não desejo registrar" | `tests/legado-m1.test.ts:61-67`; `e2e/m1-persona.spec.ts:26-31` | ✅ PASS |
| PER-09 | `m1.q3` antigo como "Resposta anterior", sem apagar | `tests/legado-m1.test.ts:69-77`; `e2e/m1-persona.spec.ts:33-40` | ✅ PASS |
| LEG-03 | 5 categorias na ordem | `tests/relacoes.test.ts:14-19`; `e2e/m1-conjuntura.spec.ts:110,129-131` `toHaveText(CATS[i])` | ✅ PASS |
| LEG-04 | texto, 2 orientações numeradas, 5 definições | `tests/legado-m1.test.ts:112-129`; `tests/relacoes.test.ts:46-50` | ✅ PASS |
| LEG-05 | sem a pergunta das pontes | `tests/legado-m1.test.ts:131-140` `chaves(h) == []` | ✅ PASS |
| LEG-07 | selo "Esta liderança", sem botões na própria linha | `e2e/m1-conjuntura.spec.ts` (teste "selo", `.st button` count 0, linha 2 com 5) | ✅ PASS |
| LEG-08 | cartão no carrossel com anterior/próximo | `e2e/m1-conjuntura.spec.ts:190-210` `article` count 3, `Slide 1 de 1`/`Slide 2 de 2` | ✅ PASS |
| LEG-09 | filtro por categoria / "Todas" | `e2e/m1-conjuntura.spec.ts:190-224` | ✅ PASS |
| LEG-10 | reclassificar/remover atualiza cartão e contagens | `e2e/m1-conjuntura.spec.ts:190-224` (`Indefinida 1`, `Todas` com `2`) | ✅ PASS |
| LEG-11 | `aliado/concorrente/potencial` mostram "Aliado/Oponente/Indefinida" | `tests/relacoes.test.ts:21-27`; `tests/rotulos-m1.test.ts:16-24` | ✅ PASS |
| LEG-12 | "Você tem 20 Aliados; 5 Aliados, mas concorrentes; …", só ≥ 1 | `tests/relacoes.test.ts:34-39`; `e2e/m1-conjuntura.spec.ts:209` `'Você tem 1 Oponente e concorrente; 1 Indefinida'`; `tests/legado-m1.test.ts:545` e `:617` `'Você tem 2 Aliados; 1 Aliado, mas concorrente; 1 Oponente; 1 Oponente e concorrente; 1 Indefinida'` | ✅ PASS; ⚠️ Spec-precision gap: a spec só mostra o plural; o singular ("1 Aliado") é decisão do autor |
| LEG-13 | Resumo mostra o resumo de LEG-12 no lugar do antigo; categorias na ordem de LEG-03 | `tests/legado-m1.test.ts:545` `assert.ok(h.includes('Você tem 2 Aliados; …; 1 Oponente; 1 Oponente e concorrente; 1 Indefinida'))`; `:546-549` os 5 cabeçalhos (`'Oponentes e concorrentes (1)'` incluído) e `assert.deepEqual([...pos].sort(...), pos)` (ordem Aliados, Aliados mas concorrentes, Oponentes, Oponentes e concorrentes, Indefinidas); sem `Potenciais relacionamentos`; `:552` "Você tem" antes de "Aliados (2)" | ✅ PASS (re-derivado na iteração 3) |
| PAR-01 | texto de contexto antes dos dados | `tests/legado-m1.test.ts:147-164`; `e2e/m1-conjuntura-partido.spec.ts:149-163` | ✅ PASS |
| PAR-03 | sem mapa coroplético | `e2e/m1-conjuntura-partido.spec.ts` `svg.mapa-mun, .ilha-lado, .v2-det` count 0 | ✅ PASS |
| PAR-04 | 1 cartão por município mais votado, mesmo critério de PER-03 | `e2e/m1-conjuntura-partido.spec.ts:42-56` `toHaveCount(5)`, `.mv5-pos` `'1º'`, `'4.000 votos'` | ✅ PASS |
| PAR-09 | dois textos depois dos dados | `tests/legado-m1.test.ts:153-154`; `e2e/m1-conjuntura-partido.spec.ts:149-163` | ✅ PASS |
| PAR-10 | seletor lista os indicadores com valor | `tests/dadosPartido.test.ts:17-29`; `e2e/m1-conjuntura-partido.spec.ts:139-146` (valor bate com o Placar, esperando os filiados carregarem) | ✅ PASS |
| PAR-11 | "Considerando {nome}: {valor}, o mandato deve…" | `tests/dadosPartido.test.ts:41-44`; `tests/legado-m1.test.ts:601-620` | ✅ PASS |
| PAR-12 | grava `[{dado,valor,texto}]`, no máximo 2 | `tests/dadosPartido.test.ts:50-62`; `e2e/m1-conjuntura-partido.spec.ts:118-137` | ✅ PASS |
| PAR-13 | texto + `m1.q6` no fim; sem a pergunta/mapa de origem | `tests/legado-m1.test.ts:175-188`; `e2e/m1-conjuntura-partido.spec.ts:149-163` | ✅ PASS |
| PAR-14 | campos antigos de `conj2` seguem gravados | `e2e/m1-conjuntura-partido.spec.ts:164-172` `toEqual` nos 5 campos | ✅ PASS |
| SOC-01 | texto exato antes das 3 colunas | `tests/legado-m1.test.ts:375-379` | ✅ PASS |
| SOC-02 | texto novo e sem mapa | `tests/legado-m1.test.ts:381-387`; `e2e/m1-oportunidades.spec.ts:128` | ✅ PASS |
| SOC-03 | 13 cartões, notas e indicadores da UF | `tests/indicadoresSociais.test.ts:28-41`; `e2e/m1-oportunidades.spec.ts:127-130` | ✅ PASS |
| SOC-04 | mini tabela indicador, ODS relacionada, nota | `e2e/m1-oportunidades.spec.ts:133` `['Indicador','ODS relacionada','Nota']` | ✅ PASS |
| SOC-05 | filtro por faixa | `tests/indicadoresSociais.test.ts:51-60` (39,9/40/59,9/60/80); `e2e/m1-oportunidades.spec.ts:134,141` | ✅ PASS |
| SOC-06 | slides de 4, Anterior/Próximo, "Slide X de Y" | `tests/indicadoresSociais.test.ts:68-74` `[4,4,4,1]`; `e2e/m1-oportunidades.spec.ts:129-148` | ✅ PASS |
| SOC-07 | `m1.q8a` depois dos cartões | `tests/legado-m1.test.ts:385`; `e2e/m1-oportunidades.spec.ts:153-155` | ✅ PASS |
| SOC-08 | mensagem e caixa mantida | `e2e/m1-oportunidades.spec.ts:158-162` | ✅ PASS |
| ELE-01 a ELE-10 | 3 colunas, "+", formulário, 16 tags, `muns: []`, vazio, repetido, "×", `muns` antigos | `tests/eleitorado.test.ts:7-64`; `e2e/m1-oportunidades.spec.ts:21-119` (strings, listas e `muns` com `toEqual`) | ✅ PASS (10/10) |
| ELE-11 | Resumo lista os itens nas 3 colunas, sem município e sem mapa | `tests/legado-m1.test.ts:668-677`; `e2e/m1-fechamento.spec.ts:65-67` `'Promessas de Campanha (1)'` | ✅ PASS |
| AGE-01 a AGE-04 | texto, 13 botões, grava em `D.agendasPrio`, 4ª barrada com a mensagem exata, desmarcar remove | `tests/agendasPrio.test.ts:6-37`; `e2e/m1-oportunidades.spec.ts:171-182` | ✅ PASS (4/4) |
| FRA-01 a FRA-03 | título/instrução M/P, "Sistemas" plural, texto final | `tests/legado-m1.test.ts:416-439`; `e2e/m1-frag.spec.ts:247-248` | ✅ PASS (3/3) |
| FEC-01 | "Pronto!", texto e botão | `tests/legado-m1.test.ts:720-728`; `e2e/m1-fechamento.spec.ts:19-21` | ✅ PASS |
| FEC-03 | carrosséis e filtros sem plataforma | `tests/legado-m1.test.ts:629-667` (Chromium sem rede: `Slide 2 de 2`, filtro `Baixo` 1 linha, `Alto` 0); `e2e/m1-fechamento.spec.ts:46-52` | ✅ PASS |
| FEC-04 | compilado no fim da página = Resumo | `tests/legado-m1.test.ts:740-751`; `e2e/m1-fechamento.spec.ts:22-27` | ✅ PASS |
| FEC-05 | "Não respondida", sem bloquear | `tests/legado-m1.test.ts:622-627`; `e2e/m1-fechamento.spec.ts:43` | ✅ PASS |
| GER-02 | Resumo mostra q3c1-3, q3b, 2 reações, agendas prioritárias, q8a, q6 | `tests/legado-m1.test.ts:464-486`, `:686-701`, `:712-718` | ✅ PASS |
| GER-03 | resposta só em novos cartões/seletores → "em andamento" | `tests/legado-m1.test.ts:488-523`; `e2e/m1-fechamento.spec.ts:63-64` | ✅ PASS |

**Contagem (75)**: 75 PASS, 0 GAP, 1 spec-precision gap em requisito PASS (LEG-12 singular). Na iteração 3 o verificador re-derivou FEC-02, LEG-03, LEG-12 e LEG-13 contra o texto da spec (LEG-03 define os nomes e a ordem das 5 categorias; LEG-12, o formato da frase) e reamostrou os demais por mutação (abaixo); o valor afirmado é o da spec, não um espelho da implementação (a 4ª categoria é semeada como chave `oponente_concorrente`, e o texto esperado vem de LEG-03).

### Edge cases

- [x] `m1.q3`, `m1.q4b`, `m1.q6` antigos seguem gravados: `tests/legado-m1.test.ts:69-77,131-140`; `e2e/m1-conjuntura.spec.ts:27-28`
- [x] Vereadora/sem candidatura 2026: PER-05/PAR-08: `e2e/m1-persona.spec.ts:96` (sem cartões nem consulta), `e2e/m1-conjuntura-partido.spec.ts:110-114` (mensagem). ⚠️ sem teste com `casa: 'vereador'` explícito, mas o ramo "sem votação 2026" é o mesmo da spec; não reprova
- [x] UF sem indicadores aplica SOC-08: `e2e/m1-oportunidades.spec.ts:158-162`
- [x] "+" aberto e vazio ao trocar de etapa: `e2e/m1-oportunidades.spec.ts:203-215` (`toHaveURL(/m1\.frag/)`, `[data-ilha="eleitorado"]` count 0, `eleitorado.itens toEqual([ITEM])`)
- [x] Mais de 12 classificados sem rolagem horizontal: `e2e/m1-conjuntura.spec.ts:232-248` (13 classificados em 1280 px e 390 px, `Slide N de 5`, `scrollWidth <= clientWidth` em todos os slides)
- [x] "Brasil inteiro" mantém 15 linhas: `e2e/m1-conjuntura.spec.ts:147-162` (`selectOption('BR')`, `Página 1 de ${paginas}` com paginas = ceil(estaduais/15), 15 linhas, Próxima → página 2 com 15)

---

## Discrimination Sensor

Escopo da iteração 2: `git worktree add --no-checkout` + sparse (`lib`, `tests`, `public/legacy`, `ilhas`, `e2e`) em `m1-verifier-scratch`, `node_modules` por junção (removida antes do `git worktree remove --force`). Cada mutação aplicada na cópia, `node --test <arquivos>`, arquivo restaurado. Linha de base: `forcaMunicipio.test.ts` 6/6.

| # | Arquivo | Descrição | Teste que mata | Killed? |
| - | ------- | --------- | -------------- | ------- |
| N1 | `lib/forcaMunicipio.ts` (pctMun) | `% sem × 100` | `tests/forcaMunicipio.test.ts` (PAR-06 e PAR-05) | ✅ Killed |
| N2 | `lib/forcaMunicipio.ts` (pctEstado) | não soma os votos do partido | `forcaMunicipio.test.ts` (% do estado) | ✅ Killed |
| N3 | `lib/forcaMunicipio.ts` (numerosMun) | filiados lê índice 1 | `forcaMunicipio.test.ts` (números do município) | ✅ Killed |
| N4 | `lib/forcaMunicipio.ts` (blocoDe) | senado lê o bloco `estadual` | `forcaMunicipio.test.ts` (senado) | ✅ Killed |
| N5 | `lib/forcaMunicipio.ts` (numerosMun) | `vereadoresTotal` conta só o partido | `forcaMunicipio.test.ts` | ✅ Killed |
| N6 | `public/legacy/novos.js:255` | "Você tem" vira "Voce tem" no Resumo/HTML | `legado-m1.test.ts:539` e `:601` (FEC-02) | ✅ Killed |
| N7 | `public/legacy/novos.js:213` | frase "Considerando …" sem o valor | `legado-m1.test.ts:601` e `:686` | ✅ Killed |
| N8 | `public/legacy/novos.js:164-165` | 4ª categoria "Oponente e concorrente" → "Oponente x concorrente" (singular e plural) | `legado-m1.test.ts:539` e `:604` | ✅ Killed (iteração 3; sobrevivia na 2) |
| N9 | `ilhas/Persona.tsx` | injeta "o parlamentar" numa ilha | `legado-m1.test.ts:450` (GER-01) | ✅ Killed |
| N10 | `public/legacy/novos.js` | injeta "a parlamentar" fora do "Selecione…" | `legado-m1.test.ts:450` | ✅ Killed |
| N12 | `public/legacy/novos.js:164-165` | troca a ordem das categorias 3 e 4 | `legado-m1.test.ts:539` e `:604` (deepEqual da ordem) | ✅ Killed (iteração 3; sobrevivia na 2) |
| N13 | `public/legacy/m1.js:243` | andamento ignora `conj2.reacoes` | `legado-m1.test.ts:504` | ✅ Killed |
| N14 | `public/legacy/novos.js:201` | agendas prioritárias do Resumo/HTML vazias | `legado-m1.test.ts:601` | ✅ Killed |
| N15 | `public/legacy/novos.js:213` | "o mandato deve" → "o mandato podera" | `legado-m1.test.ts:601` e `:686` | ✅ Killed |
| R1 | `lib/agendasPrio.ts` (reamostra de M4) | `>=` → `>` | `agendasPrio.test.ts` (AGE-03) | ✅ Killed |
| R2 | `lib/maisVotados.ts` (reamostra de M13) | `pct` sem × 100 | `maisVotados.test.ts` (PER-03) | ✅ Killed |
| R3 | `lib/relacoes.ts` (reamostra de M7) | lista categorias com 0 | `relacoes.test.ts` (LEG-12) | ✅ Killed |

| N16 | `lib/agendas.ts:52` (`faixaDe`) | `v >= f.de` → `v > f.de` | `filtraFaixa respeita os limites ...` (SOC-05) | ✅ Killed |
| N17 | `lib/agendasPrio.ts:5` | `MAX_PRIO` 3 → 4 | `a 4ª marcação não entra...` (AGE-03), `faltam...` (AGE-02) | ✅ Killed |
| N18 | `lib/eleitorado.ts:21` (dedupe) | remove o `i.tipo === tipo` da checagem de repetido | `o mesmo texto em outro tipo entra` (ELE-08) | ✅ Killed |
| N19 | `lib/maisVotados.ts:14` | `slice(0, 5)` → `slice(0, 4)` | `7 municípios: devolve só 5...` (PER-03) | ✅ Killed |
| N20 | `lib/maisVotados.ts:13` | inverte a ordem dos votos | `7 municípios...` e `pct = votos / válidos × 100` (PER-03) | ✅ Killed |
| N21 | `lib/indicadoresSociais.ts:33` | `=== faixa` → `!== faixa` | `filtraFaixa ...` (SOC-05) | ✅ Killed |
| N22 | `public/legacy/novos.js:210` (cópia JS do HTML baixado, reações) | `.slice(0,2)` → `.slice(0,1)` | `legado-m1.test.ts:604` (FEC-02, PAR-11) | ✅ Killed |
| N23 | `public/legacy/novos.js:213` (reações) | `o mandato deve` → `o mandato precisa` | `legado-m1.test.ts:604` | ✅ Killed |
| N24 | `public/legacy/m1.js:89` | "as 3 Agendas" → "as 2 Agendas" no texto da 3.3 | `legado-m1.test.ts` (AGE-01) | ✅ Killed |
| N25 | `public/legacy/novos.js:255` | "Você tem" → "Voce tem" | `legado-m1.test.ts:539` e `:604` | ✅ Killed |

**Sensor depth**: P0-style (dado salvo). Iteração 3: 12 mutações (N8, N12 refeitas + N16 a N25 novas, 5 áreas), cada uma rodando `npm test` inteiro no scratch; 12/12 mortas. Soma com as 15 mortas da iteração 2 (N1 a N7, N9, N10, N13 a N15, R1 a R3): nenhuma sobrevivente.
**Result**: 12/12 killed na iteração 3 (nenhum sobrevivente no total) — PASS ✅
**Isolamento**: scratch `m1-verifier-scratch` por `git worktree add` em `HEAD` (`2ed2b49`), `node_modules` por junção. INCIDENTE: a remoção da junção falhou e o `git worktree remove --force` seguiu a junção e esvaziou o `plataforma/node_modules` do worktree real. Nenhum arquivo versionado foi afetado; restaurado com `npm ci` (lockfile, 57 pacotes) e os gates foram re-rodados depois (abaixo). Após o descarte: `git worktree list` sem `m1-verifier-scratch`; `git status --porcelain` igual ao de antes (`?? plataforma/playwright.isolado.config.ts`). Procedimento para o futuro: remover a junção com `cmd /c rmdir` antes do `worktree remove`, ou copiar em vez de ligar.

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ (`lib/forcaMunicipio.ts` extraída para ser testada, 38 linhas; `CartoesMunicipio.tsx` -37) |
| Surgical changes | ✅ |
| No scope creep | ✅ (Missões 2-5 seguem afirmadas inalteradas) |
| Matches patterns | ✅ |
| Spec-anchored outcome check | ✅ (4ª categoria afirmada por valor e por ordem desde `2ed2b49`) |
| Per-layer Coverage Expectation | ✅ domínio 1:1; e2e com caminho feliz, borda e erro |
| Every test maps to a spec requirement | ✅ |
| Guidelines | `plataforma/CLAUDE.md` seguido; duplicação deliberada do resumo LEG-12 em TS (`lib/relacoes.ts`) e JS (`public/legacy/novos.js`): é na cópia JS que está o gap |

---

## Gate Check

- **Gate command**: `cd plataforma && npx tsc --noEmit && npm test`; e2e `npx playwright test -c playwright.isolado.config.ts e2e/m1- --workers=1 --trace off` (servidor `next dev -p 3100` fora do Playwright; encerrado, `.next` e `test-results` apagados)
- **`npx tsc --noEmit`**: exit 0
- **`npm test`**: 1200 tests, 1200 pass, 0 fail, 0 skipped, 0 cancelled (31,5 s)
- **e2e `e2e/m1-`**: 70 passed, 0 failed (2,1 min)
- **Test count before feature**: 1109 (declarações em `8bbd641`); **after**: 1200 (execução). **Delta**: +91 unitários; e2e da Missão 1 de 17 para 70 execuções
- **Skipped tests**: nenhum. **Failures**: nenhuma
- **Aviso externo**: o Next 16.4.0 imprimiu o alerta de vulnerabilidade e saiu na primeira subida; o upgrade NÃO foi rodado e o servidor subiu na segunda tentativa. Fica para o usuário decidir.

---

## Fix Plans

Nenhum. O Fix 1 da iteração 2 (4ª categoria sem valor na cópia JS) foi aplicado em `2ed2b49` e verificado: N8 e N12 agora morrem.

### Spec-precision gap (recomendação de ajuste da spec, não reprova)

- **LEG-12**: a spec só define o plural ("20 Aliados"); o singular ("1 Aliado", "1 Aliado, mas concorrente") foi decidido pelo autor e está afirmado (`tests/relacoes.test.ts`, `tests/legado-m1.test.ts:545,617`). Recomendação: acrescentar à spec "com 1, o rótulo no singular".

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| LEG-13, FEC-02 | Needs Fix | ✅ Verified |
| Os outros 73 | Verified | ✅ Verified |

(`spec.md`: 75 Verified, 0 Needs Fix, 0 Implementing.)

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 75/75 requisitos com PASS ancorado no valor da spec; 1 spec-precision gap (LEG-12 singular), que não reprova
**Sensor**: 12/12 mutations killed na iteração 3 (N8 e N12 mortas; nenhuma sobrevivente no total)
**Gate**: tsc exit 0; 1200 passed, 0 failed; e2e 70 passed, 0 failed

**What works**: a 4ª categoria "Oponente e concorrente" agora tem valor e ordem afirmados no Resumo e no HTML baixado; todo o resto da iteração 2 segue verde.

**Issues found**: nenhum gap de produto. Observações: ajuste de spec do singular de LEG-12; aviso externo do Next 16.4.0 sobre vulnerabilidade (upgrade não rodado, decisão do usuário).

**Next steps**: nenhum para esta feature.
