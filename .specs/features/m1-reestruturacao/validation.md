# Reestruturação da Missão 1 Validation

**Verdict**: FAIL (gaps de cobertura de teste nos requisitos PAR-05, PAR-06, FEC-02, SOC-09 e nos 3 casos de borda; nenhum teste falhou e nenhum mutante sobreviveu)
**Date**: 2026-11-11
**Spec**: `.specs/features/m1-reestruturacao/spec.md` (75 requisitos EARS)
**Diff range**: `8bbd641..99b70f8` (47 commits, branch `feat/m1-reestruturacao`, worktree `m1-reestruturacao-wt`)
**Verifier**: independent sub-agent (author ≠ verifier). Nada de produto foi alterado; só este arquivo foi escrito.

Convenção de caminhos: `tests/` e `e2e/` são `plataforma/tests/` e `plataforma/e2e/`.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 a T30 | ✅ Done | `**Status**: ✅ Done` em `.specs/features/m1-reestruturacao/tasks.md` (T1 sem a linha, mas todos os "Done when" marcados) |
| T31 a T43 | ⚠️ Partial (bookkeeping) | "Done when" todos `[x]` (ex.: `tasks.md:973-978`) e commits existem (`git log 8bbd641..HEAD`), mas a linha `**Status**` não foi escrita e a tabela de rastreabilidade do `spec.md:261-335` segue com "Implementing" em todos os 75 |

---

## Spec-Anchored Acceptance Criteria

Legenda do resultado: ✅ PASS (teste ancorado no valor da spec); ⚠️ PARCIAL (existe evidência, mas o valor afirmado não cobre tudo o que a spec define); ❌ GAP (sem teste; só implementação citada); ⚠️ Spec-precision gap.

### P1: Cada etapa numa página só

| Critério | Resultado definido pela spec | `file:line` + assertion | Result |
| -------- | ---------------------------- | ----------------------- | ------ |
| PAG-01 | todas as perguntas do exercício na mesma página, na ordem 1.1-1.3, 2.1-2.2, 3.1-3.3, 4.1 | `tests/legado-m1.test.ts:326-338` `tela.innerHTML.includes(titulo(it))` para cada item das 4 etapas; `e2e/m1-pagina-unica.spec.ts:93-95` `getByText(p).toBeVisible()` para os 8 títulos; ordem só afirmada nas Oportunidades `legado-m1.test.ts:406-413` | ✅ PASS (ordem das etapas 1 e 2 não afirmada: baixo risco) |
| PAG-02 | faixa com 4 nomes, atual em `aria-current="step"` | `tests/legado-m1.test.ts:232-239` nomes `['A Persona','A Conjuntura','As Oportunidades e Ameaças','As Fragilidades e Fortalezas']` e 1 `aria-current`; `e2e/m1-etapas.spec.ts:195-201` | ✅ PASS |
| PAG-03 | botão de seguir à etapa seguinte; sem botão de avançar entre perguntas | `tests/legado-m1.test.ts:340-348` ausência de `>Anterior<`, `>Avançar<`, `Ver tudo de uma vez` e presença de `Próximo exercício`; `e2e/m1-pagina-unica.spec.ts:102-106,110-114` (clica e vai a `m1.conjuntura`) | ✅ PASS |
| PAG-04 | `#/m/1/m1.conjuntura/1` e `m1.oportunidades/1` abrem a página única | `tests/legado-m1.test.ts:351-360` `assert.deepEqual(trocas, ['#/m/1/<id>'])`; `e2e/m1-pagina-unica.spec.ts:120-126` `toHaveURL(...)` | ✅ PASS |

### P1: Persona

| Critério | Resultado definido pela spec | `file:line` + assertion | Result |
| -------- | ---------------------------- | ----------------------- | ------ |
| PER-01 | sem o mapa "Onde estão os votos" | `e2e/m1-persona.spec.ts:62` `getByText('Onde estão os votos').toHaveCount(0)`; `MapaVotos.tsx` removido no diff | ✅ PASS |
| PER-02 | lista com posição, nome, partido ao lado; sem barras | `e2e/m1-persona.spec.ts:61-63` `.rk-linha .chip` visível, `.barra-p` count 0; implementação `ilhas/Persona.tsx:280-284` (`rk-pos`, `rk-nome`, `Chip`) | ⚠️ PARCIAL (não afirma a posição nem o nome da linha) |
| PER-03 | 5 cartões, ordem decrescente, posição, município, votos, % dos válidos | `tests/maisVotados.test.ts:12-13` `[[1,'Delta',900],[2,'Beta',700],...]`, `:18-19` `pct 35 / 30`; `e2e/m1-persona.spec.ts:64-69` `toHaveCount(5)`, `'1º'`, `'4.000 votos'`, `'20'`, `'dos votos válidos'`, 5º `'900 votos'` | ✅ PASS |
| PER-04 | sem cartões/lista de município em pleito anterior a 2026 | só implementação: `ilhas/Persona.tsx:288` (`<MaisVotados />` apenas dentro do cartão TSE 2026); `e2e/m1-persona.spec.ts:78-85` cobre só "sem candidatura 2026" | ⚠️ PARCIAL (sem teste que abra um pleito manual anterior com a 2026 vinculada) |
| PER-05 | mensagem "Não foi possível carregar os municípios mais votados agora." mantendo o resto | `e2e/m1-persona.spec.ts:71-75` `getByText(msg).toBeVisible()`, `.mv5-cartao` count 0, ranking visível; `tests/maisVotados.test.ts:32-34` vazio → `[]` | ✅ PASS |
| PER-06 | texto "Seu papel agora é registrar…" logo abaixo dos dados e antes da caixa | `tests/legado-m1.test.ts:90-97` `ilha < texto < caixa`, `chaves(h) == ['m1.q2']` | ✅ PASS |
| PER-07 | texto "Registre até 3:" + 3 cartões "Conquista/Grande Entrega almejada 1..3" | `tests/legado-m1.test.ts:46-53` `chaves(h) == [q3c1,q3c2,q3c3,q3b]` e textos; `e2e/m1-persona.spec.ts:158-167` grava em `m1.q3c2` | ✅ PASS |
| PER-08 | cargos de hoje + "Não sei / não desejo registrar" | `tests/legado-m1.test.ts:61-67` 6 opções; `e2e/m1-persona.spec.ts:172-174` grava `'Não sei / não desejo registrar'` | ✅ PASS |
| PER-09 | `m1.q3` antigo aparece como "Resposta anterior", sem apagar | `tests/legado-m1.test.ts:69-77` `includes('Resposta anterior')` e `D.campos['m1.q3']` intacto; `e2e/m1-persona.spec.ts:179-182` | ✅ PASS |

### P1: Conjuntura, relações (2.1)

| Critério | Resultado definido pela spec | `file:line` + assertion | Result |
| -------- | ---------------------------- | ----------------------- | ------ |
| LEG-01 | sem mapa do Brasil/cartograma; com hemiciclo e seletor "Brasil inteiro / UF" | `e2e/m1-conjuntura.spec.ts:117-118` `.mapa-br` count 0, `getByLabel('Território')` visível; implementação `ilhas/Assentos.tsx:191-194` (`<option value="BR">Brasil inteiro`), `:288` `Hemiciclo` | ⚠️ PARCIAL (opção "Brasil inteiro" e hemiciclo não afirmados) |
| LEG-02 | abas "Câmara Legislativa" (DF) / "Assembleia Legislativa", "Câmara dos Deputados", "Senado", com contagem | `e2e/m1-conjuntura.spec.ts:119-121,132` (regex `^Assembleia Legislativa`, `^Câmara dos Deputados`, `^Senado`, `^Câmara Legislativa` no DF); `tests/rotulos-m1.test.ts:26-37` | ⚠️ PARCIAL (contagem na aba, `Assentos.tsx:205`, não afirmada) |
| LEG-03 | 5 categorias na ordem | `tests/relacoes.test.ts:14-19` rótulos e chaves; `e2e/m1-conjuntura.spec.ts:122-124` `botoes.nth(i).toHaveText(CATS[i])` | ✅ PASS |
| LEG-04 | texto, 2 orientações numeradas, 5 definições antes dos dados | `tests/legado-m1.test.ts:112-129` (texto, `<li>` = 2, 5 definições em ordem, `ilha > pos`); `tests/relacoes.test.ts:46-50`; `e2e/m1-conjuntura.spec.ts:12-20` | ✅ PASS |
| LEG-05 | sem a pergunta das pontes | `tests/legado-m1.test.ts:131-140` `chaves(h) == []`, `m1.q4b` mantida; `e2e/m1-conjuntura.spec.ts:16-17` | ✅ PASS |
| LEG-06 | grandes números e gráficos logo abaixo dos filtros | só implementação: `ilhas/Assentos.tsx:225-265` (`barra-f` seguido de `ass-topo`/`kpis`) | ❌ GAP (sem teste; mudança só de ordem visual) |
| LEG-07 | selo "Esta liderança", sem botões na própria linha | `e2e/m1-conjuntura.spec.ts:143-146` `toContainText('Esta liderança')`, `.st button` count 0, linha 2 com 5 | ✅ PASS |
| LEG-08 | cartão no carrossel com anterior/próximo | `e2e/m1-conjuntura.spec.ts:159-163` `article` count 3, `Slide 1 de 1`; `:186-187` Próximo → `Slide 2 de 2` | ✅ PASS |
| LEG-09 | filtro por categoria mostra só ela; "Todas" mostra todos | `e2e/m1-conjuntura.spec.ts:164-165` (Aliado 2 → 2 cartões), `:188-191` | ✅ PASS |
| LEG-10 | reclassificar/remover atualiza cartão e contagens na hora | `e2e/m1-conjuntura.spec.ts:167-172` (`Indefinida 1`, `Todas` contém `2`) | ✅ PASS |
| LEG-11 | `aliado/concorrente/potencial` mostram "Aliado/Oponente/Indefinida" | `tests/relacoes.test.ts:21-27` `rotulo('concorrente') == 'Oponente'`, `rotulo('potencial') == 'Indefinida'`; `tests/rotulos-m1.test.ts:16-24` | ✅ PASS |
| LEG-12 | "Você tem 20 Aliados; 5 Aliados, mas concorrentes; …", só categorias ≥ 1 | `tests/relacoes.test.ts:34-39` strings exatas; `tests/legado-m1.test.ts:527` (JS do Resumo); `e2e/m1-conjuntura.spec.ts:174` `'Você tem 1 Oponente e concorrente; 1 Indefinida'` | ✅ PASS; ⚠️ Spec-precision gap: a spec só mostra plural; o singular ("1 Aliado") é decisão do autor, afirmada em `legado-m1.test.ts:527` mas não definida na spec |
| LEG-13 | Resumo mostra o resumo de LEG-12 no lugar do antigo | `tests/legado-m1.test.ts:522-537` (`Aliados (2)`, sem `Potenciais relacionamentos`, "Nada classificado ainda.") | ✅ PASS |

### P1: Conjuntura, partido (2.2)

| Critério | Resultado definido pela spec | `file:line` + assertion | Result |
| -------- | ---------------------------- | ----------------------- | ------ |
| PAR-01 | texto de contexto antes dos dados | `tests/legado-m1.test.ts:147-164`; `e2e/m1-conjuntura-partido.spec.ts:291-293` | ✅ PASS |
| PAR-02 | Placar (parlamentares, vereadores, prefeituras, filiados, posição nos Executivos) em cartões com borda | `e2e/m1-conjuntura-partido.spec.ts:220-222` `.v2-grande` com `borderTopWidth > 0`; `:210` `'Placar do partido'` | ⚠️ PARCIAL (os 5 indicadores não são afirmados nos cartões; só o seletor `dadosSelecionaveis` em `tests/dadosPartido.test.ts:17-22` lista os 5) |
| PAR-03 | sem mapa coroplético de município | `e2e/m1-conjuntura-partido.spec.ts:217` `svg.mapa-mun, .ilha-lado, .v2-det` count 0 | ✅ PASS |
| PAR-04 | 1 cartão por município mais votado, mesma ordem e critério de PER-03 | `e2e/m1-conjuntura-partido.spec.ts:228,238-239` `toHaveCount(5)`, `.mv5-pos` `'1º'`, `'4.000 votos'`; critério compartilhado `ilhas/CartoesMunicipio.tsx:70` (`cincoMais`) | ✅ PASS |
| PAR-05 | Placar do cartão: vereadores do município, vereadores do partido, foto e nome do prefeito, posição do partido, filiados | e2e afirma só rótulos `'Vereadores no município'` e `'Filiados do PSOL'` (`e2e/m1-conjuntura-partido.spec.ts:234-235`); implementação `ilhas/CartoesMunicipio.tsx:114-136` | ❌ GAP: sem teste de valor/presença de "Vereadores do PSOL", foto/nome do prefeito; a posição do partido aparece só no bloco Executivo (`:148-158`), não no Placar como a spec define |
| PAR-06 | Força: % do partido no município e % no estado | só implementação `ilhas/CartoesMunicipio.tsx:138-146`; e2e afirma só o título `'Força'` (`e2e/m1-conjuntura-partido.spec.ts:232`) | ❌ GAP: nenhum valor de % é afirmado (as funções `pctMun`/`pctEstado` em `:24-37` não têm teste) |
| PAR-07 | 4 posições, escolher uma, gravar em `D.conj2` | `e2e/m1-conjuntura-partido.spec.ts:236` `getByRole('radio') count 4`, `:245-247` clica `Oposição` e `prefExtra` contém `'oposicao'` | ⚠️ PARCIAL (rótulos das outras 3 posições não afirmados; gravação do município de domicílio em `posicao.pref` sem teste) |
| PAR-08 | sem votação 2026: cartão só do domicílio, ou mensagem | `e2e/m1-conjuntura-partido.spec.ts:252-253` mensagem + 0 cartões; ramo "com domicílio" só em `ilhas/CartoesMunicipio.tsx:62-66` | ⚠️ PARCIAL (ramo com `m.municipio` sem teste) |
| PAR-09 | dois textos depois dos dados | `tests/legado-m1.test.ts:153-154` `ilha < a && a < b`; `e2e/m1-conjuntura-partido.spec.ts:291-292` | ✅ PASS |
| PAR-10 | seletor lista os indicadores de PAR-02, 05, 06 com valor | `tests/dadosPartido.test.ts:17-29` nomes e valores (`'3 no estado, 1.200 no Brasil'`, `'12,50%'`); `e2e/m1-conjuntura-partido.spec.ts:281-283` valor bate com o Placar | ✅ PASS |
| PAR-11 | frase "Considerando {nome}: {valor}, o mandato deve…" e caixa abre | `tests/dadosPartido.test.ts:41-44` string exata; `e2e/m1-conjuntura-partido.spec.ts:263,266-267` | ✅ PASS |
| PAR-12 | grava `[{dado,valor,texto}]`, no máximo 2 | `tests/dadosPartido.test.ts:50-62` `deepEqual` com `{dado,valor,texto}` e índice 2 ignorado; `e2e/m1-conjuntura-partido.spec.ts:271-276` | ✅ PASS |
| PAR-13 | texto + `m1.q6` no fim; sem a pergunta/mapa de origem | `tests/legado-m1.test.ts:175-188`; `e2e/m1-conjuntura-partido.spec.ts:293-300` | ✅ PASS |
| PAR-14 | `relacao`, `relacaoPq`, `desafios`, `oportunidades`, `muns` seguem gravados | `e2e/m1-conjuntura-partido.spec.ts:309-313` `toEqual` nos 5 campos; `e2e/m1-conjuntura.spec.ts:84` | ✅ PASS |

### P1: Oportunidades e ameaças

| Critério | Resultado definido pela spec | `file:line` + assertion | Result |
| -------- | ---------------------------- | ----------------------- | ------ |
| SOC-01 | texto exato antes das 3 colunas | `tests/legado-m1.test.ts:375-379` `texto < indexOf('data-ilha="eleitorado"')` | ✅ PASS |
| SOC-02 | texto novo e sem mapa | `tests/legado-m1.test.ts:381-387`; `e2e/m1-oportunidades.spec.ts:128` `svg` count 0 | ✅ PASS |
| SOC-03 | 1 cartão por agenda (13), notas ODS e indicadores da UF | `tests/indicadoresSociais.test.ts:28-41` `deepEqual` das linhas por UF; `e2e/m1-oportunidades.spec.ts:127-130` 4 cartões/slide, `Slide 1 de 4` (13 → 4 slides) | ✅ PASS |
| SOC-04 | mini tabela indicador, ODS relacionada, nota | `e2e/m1-oportunidades.spec.ts:133` `columnheader` `['Indicador','ODS relacionada','Nota']` | ✅ PASS |
| SOC-05 | filtro por faixa (<40, 40-49, 50-59, 60-79, ≥80) | `tests/indicadoresSociais.test.ts:51-60` limites 39,9/40/59,9/60/80; `e2e/m1-oportunidades.spec.ts:134,141` | ✅ PASS |
| SOC-06 | slides de 4, "Anterior", "Próximo", "Slide X de Y" | `tests/indicadoresSociais.test.ts:68-74` `[4,4,4,1]`; `e2e/m1-oportunidades.spec.ts:129,131,143-148` | ✅ PASS |
| SOC-07 | caixa `m1.q8a` depois dos cartões | `tests/legado-m1.test.ts:385`; `e2e/m1-oportunidades.spec.ts:153-155` | ✅ PASS |
| SOC-08 | mensagem e caixa mantida | `e2e/m1-oportunidades.spec.ts:161-162` | ✅ PASS |
| SOC-09 | `D.social` segue gravado | só implementação: `ilhas/AgendasSociais.tsx:3` (não lê nem escreve `D.social`) e `ilhas/Social.tsx:34` (código antigo ainda no repo) | ❌ GAP (sem teste que prove preservação) |
| ELE-01 | sem mapa, busca nem seleção de município | `e2e/m1-oportunidades.spec.ts:21-23` `svg` 0, `Procurar município` 0, `município selecionado` 0 | ✅ PASS |
| ELE-02 | 3 colunas na ordem, título, contagem, "+" | `tests/eleitorado.test.ts:7`; `e2e/m1-oportunidades.spec.ts:24-25` regex `^Promessas de Campanha\s*0\s*\+$` etc. | ✅ PASS |
| ELE-03 | formulário com rótulo, exemplo, "Adicionar" | `tests/eleitorado.test.ts:8-11`; `e2e/m1-oportunidades.spec.ts:41-43` `placeholder` = exemplo | ✅ PASS |
| ELE-04 | 16 tags só nos grupos | `tests/eleitorado.test.ts:15-21`; `e2e/m1-oportunidades.spec.ts:44-45` `toHaveText(TAGS)` / `.el-acoes` count 0 | ✅ PASS |
| ELE-05 | adiciona no fim, `muns: []`, limpa o campo, mantém o formulário | `tests/eleitorado.test.ts:28` `{id:'n1',tipo,texto:'Transporte rural',muns:[]}`; `e2e/m1-oportunidades.spec.ts:60-66` | ✅ PASS |
| ELE-06 | tag adiciona sem texto | `e2e/m1-oportunidades.spec.ts:73-76` `[['potencial','Jovens']]` | ✅ PASS |
| ELE-07 | vazio/espaços: botão desabilitado, nada gravado | `tests/eleitorado.test.ts:35-38`; `e2e/m1-oportunidades.spec.ts:55-57` | ✅ PASS |
| ELE-08 | repetido (sem acento/maiúscula) barrado com "Este item já está na lista." | `tests/eleitorado.test.ts:44-48,53-56`; `e2e/m1-oportunidades.spec.ts:86,91` | ✅ PASS |
| ELE-09 | "×" remove da coluna e de `D.eleitorado.itens` | `tests/eleitorado.test.ts:64`; `e2e/m1-oportunidades.spec.ts:106-108` `['Estudantes']` | ✅ PASS |
| ELE-10 | itens com `muns` aparecem sem município e seguem gravados | `e2e/m1-oportunidades.spec.ts:114-119` `muns` `toEqual(['3550308','3509502'])`; `tests/eleitorado.test.ts:64` | ✅ PASS |
| ELE-11 | Resumo lista os itens nas 3 colunas, sem município e sem mapa | `tests/legado-m1.test.ts:635-637` `'Promessas de Campanha (2)'`, `<li><strong>…</strong></li>`, sem `5208707`; `e2e/m1-fechamento.spec.ts:65,67` | ✅ PASS |
| AGE-01 | texto + 13 agendas como botões | `tests/legado-m1.test.ts:396-404`; `e2e/m1-oportunidades.spec.ts:171` `toHaveCount(13)` | ✅ PASS |
| AGE-02 | grava em `D.agendasPrio` e mostra quantas faltam | `tests/agendasPrio.test.ts:6-7,35-37`; `e2e/m1-oportunidades.spec.ts:172,179` `['saude','educacao','seguranca']` | ✅ PASS |
| AGE-03 | 4ª não marca; mensagem exata | `tests/agendasPrio.test.ts:13-14`; `e2e/m1-oportunidades.spec.ts:177-178` | ✅ PASS |
| AGE-04 | desmarcar remove | `tests/agendasPrio.test.ts:18-20`; `e2e/m1-oportunidades.spec.ts:182` `['saude','seguranca']` | ✅ PASS |

### P2: Fragilidades

| Critério | Resultado definido pela spec | `file:line` + assertion | Result |
| -------- | ---------------------------- | ----------------------- | ------ |
| FRA-01 | título e instrução M/P exatos | `tests/legado-m1.test.ts:416-421` `instrucao > titulo && instrucao < frag-l` | ✅ PASS |
| FRA-02 | "Uso dos Sistemas da Casa Legislativa" e M/P/os dois | `tests/legado-m1.test.ts:423-432`; `e2e/m1-frag.spec.ts:247-248` grava `mp == 'M'` | ✅ PASS |
| FRA-03 | texto "Caso sinta falta…" depois da lista | `tests/legado-m1.test.ts:434-439` | ✅ PASS |

### P1: Fechamento

| Critério | Resultado definido pela spec | `file:line` + assertion | Result |
| -------- | ---------------------------- | ----------------------- | ------ |
| FEC-01 | "Pronto!", texto, botão | `tests/legado-m1.test.ts:681-689` (3 trechos exatos, após o fim de `m1.frag`, 1 só "Pronto!"); `e2e/m1-fechamento.spec.ts:19-21` | ✅ PASS |
| FEC-02 | baixa HTML com as respostas na ordem do Resumo, incluindo categorias de relação, resumo LEG-12, cartões de município, reação a 2 dados, agendas prioritárias, cartões de agenda | `tests/legado-m1.test.ts:574-581` ordem e conteúdo (q1, conquista, cargo, `Os municípios mais votados`, `Taguatinga`, atores, `Indicadores por agenda temática`, `Base aliada`, `Ind Saúde A`); `:691-700` botão chama `Baixar.mapaPolitico()`; `e2e/m1-fechamento.spec.ts:42` (inclui `Saúde`, `Cultura e esporte`) | ⚠️ PARCIAL: o HTML gerado não é afirmado para categorias de relação, resumo LEG-12 e reações a 2 dados (essas só no Resumo vivo, `legado-m1.test.ts:522-533,648-662`) |
| FEC-03 | carrosséis e filtros funcionam sem plataforma | `tests/legado-m1.test.ts:591-595` sem `<svg`, `src="http`, 1 `<script>`; `:597-623` Chromium sem rede: `Slide 2 de 2`, filtro `Baixo` → 1 linha, `Alto` → 0 e `[data-vazio]` visível; `e2e/m1-fechamento.spec.ts:46-51` | ✅ PASS |
| FEC-04 | compilado no fim da página = Resumo | `tests/legado-m1.test.ts:702-711` `includes('<div class="m1-compilado">'+resumo+'</div>')`; `e2e/m1-fechamento.spec.ts:22-27` | ✅ PASS |
| FEC-05 | pergunta sem resposta vira "Não respondida", sem bloquear | `tests/legado-m1.test.ts:584-589`; `e2e/m1-fechamento.spec.ts:43` | ✅ PASS |

### P2: Linguagem e resumo

| Critério | Resultado definido pela spec | `file:line` + assertion | Result |
| -------- | ---------------------------- | ----------------------- | ------ |
| GER-01 | usa "liderança parlamentar"; sem "o/a parlamentar" para a pessoa | `tests/legado-m1.test.ts:441-444` regex sobre `m1.js` `deepEqual(achados, [])` | ⚠️ PARCIAL: varre só `m1.js`; textos escritos à mão em `ilhas/*.tsx` e `novos.js` não passam por varredura (grep manual do verificador, sem ocorrência) |
| GER-02 | Resumo mostra q3c1-3, q3b, 2 reações, agendas prioritárias, q8a, q6 | `tests/legado-m1.test.ts:447-457`, `:648-662` (`Considerando Vereadores do partido: 12 no estado, 400 no Brasil, o mandato deve… ampliar a bancada`), `:674-677` nomes das 13 agendas | ✅ PASS |
| GER-03 | resposta só em cartões/carrosséis/seletores novos → "em andamento" | `tests/legado-m1.test.ts:471-498` (eleitorado, `agendasPrio`, `conj2.reacoes`, conquistas, `m1.q6`; Missões 2-5 intactas); `e2e/m1-fechamento.spec.ts:63-64` selo `em andamento` / `não iniciado` | ✅ PASS |

### Edge cases

- [x] "`m1.q3`, `m1.q4b`, `m1.q6` antigos seguem gravados": ✅ `tests/legado-m1.test.ts:69-77,131-140`; `e2e/m1-conjuntura.spec.ts:27-28`
- [ ] Liderança vereadora, só blocos de 2024 e mensagens PER-05/PAR-08: ⚠️ cobertura indireta (`e2e/m1-persona.spec.ts:78-85`, `m1-conjuntura-partido.spec.ts:252-253`); sem teste com `casa: 'vereador'`
- [x] UF sem arquivo de indicadores aplica SOC-08: ✅ `e2e/m1-oportunidades.spec.ts:158-162` (404 simulado)
- [ ] Trocar de etapa com "+" aberto e vazio não grava: ❌ sem teste (nenhuma ocorrência em `e2e/m1-*`/`tests/`)
- [ ] Mais de 12 classificados mantêm o carrossel navegável sem rolagem horizontal: ❌ sem teste (e2e usa 3 e 4 classificados: `m1-conjuntura.spec.ts:155-158,182-183`; sem checagem de `scrollWidth`)
- [ ] Escopo "Brasil inteiro" mantém a paginação de 15: ❌ sem teste (`m1-conjuntura.spec.ts:94` usa o escopo da UF do mandato); implementação `ilhas/Assentos.tsx:41,169-171`

**Status**: ❌ Gaps present. Contagem por requisito (75): 62 PASS, 9 PARCIAL (PER-02, PER-04, LEG-01, LEG-02, PAR-02, PAR-07, PAR-08, FEC-02, GER-01), 4 GAP sem teste (LEG-06, PAR-05, PAR-06, SOC-09); 1 spec-precision gap (LEG-12, singular) em requisito PASS; 3 casos de borda sem teste.

---

## Discrimination Sensor

Escopo: scratch isolado em `git worktree add --no-checkout` + sparse (`plataforma/lib`, `tests`, `public/legacy`, `ilhas`) com `node_modules` ligado por junção (junção removida antes do `git worktree remove --force`). Linha de base no scratch: 104 testes passando nos 8 arquivos alvo. Cada mutação foi aplicada em uma cópia, rodou-se `node --test <arquivos>` e o arquivo foi restaurado. Todos os 25 retornaram falha de teste (exit ≠ 0).

| # | Arquivo | Descrição | Teste que mata | Killed? |
| - | ------- | --------- | -------------- | ------- |
| M1 | `lib/eleitorado.ts:23` | dedupe sem normalizar acento/maiúscula | `tests/eleitorado.test.ts:42-49` | ✅ Killed |
| M2 | `lib/eleitorado.ts:23` | dedupe ignora o tipo da coluna | `tests/eleitorado.test.ts:51-57` | ✅ Killed |
| M3 | `lib/eleitorado.ts:24` | item novo grava `muns` não vazio | `tests/eleitorado.test.ts:28` | ✅ Killed |
| M4 | `lib/agendasPrio.ts:11` | `>=` vira `>` (permite 4ª) | `tests/agendasPrio.test.ts:10-15` | ✅ Killed |
| M5 | `lib/agendasPrio.ts:9` | remove o filtro de id fora das 13 | `tests/agendasPrio.test.ts:23-26` | ✅ Killed |
| M6 | `lib/agendasPrio.ts:4` | `MAX_PRIO` 3 → 4 | `tests/agendasPrio.test.ts:34-38` | ✅ Killed |
| M7 | `lib/relacoes.ts:39` | resumo lista categorias com 0 (`>= 1` → `>= 0`) | `tests/relacoes.test.ts:34-39` | ✅ Killed |
| M8 | `lib/relacoes.ts:13` | rótulo "Oponente" → "Opositor" | `tests/relacoes.test.ts:14-27`, `tests/rotulos-m1.test.ts:16` | ✅ Killed |
| M9 | `lib/relacoes.ts:11` | troca a ordem das categorias | `tests/relacoes.test.ts:14-19` | ✅ Killed |
| M10 | `lib/relacoes.ts:39` | singular/plural invertido | `tests/relacoes.test.ts` (via `legado-m1.test.ts:527` para o singular) | ✅ Killed |
| M11 | `lib/maisVotados.ts:13` | `slice(0,5)` → `slice(0,6)` | `tests/maisVotados.test.ts:7-14` | ✅ Killed |
| M12 | `lib/maisVotados.ts:12` | ordem crescente de votos | `tests/maisVotados.test.ts:7-14` | ✅ Killed |
| M13 | `lib/maisVotados.ts:11` | `pct` sem `× 100` | `tests/maisVotados.test.ts:16-20` | ✅ Killed |
| M14 | `lib/maisVotados.ts:10` | aceita município com válidos 0 | `tests/maisVotados.test.ts:27-30` | ✅ Killed |
| M15 | `lib/dadosPartido.ts:44` | aceita 3ª linha de reação | `tests/dadosPartido.test.ts:57-62` | ✅ Killed |
| M16 | `lib/dadosPartido.ts:36` | frase sem o valor | `tests/dadosPartido.test.ts:41-44` | ✅ Killed |
| M17 | `lib/dadosPartido.ts:46` | grava `valor: ''` | `tests/dadosPartido.test.ts:50-55` | ✅ Killed |
| M18 | `lib/agendas.ts:52` | `faixaDe` `>=` → `>` (limite 40) | `tests/indicadoresSociais.test.ts:51-60` | ✅ Killed |
| M19 | `lib/indicadoresSociais.ts:36` | `emSlides` 4 → 3 | `tests/indicadoresSociais.test.ts:68-74` | ✅ Killed |
| M20 | `lib/indicadoresSociais.ts:13` | nota lida de `mun` em vez de `uf` | `tests/indicadoresSociais.test.ts:28-41` | ✅ Killed |
| M21 | `public/legacy/m1.js:20` | "Registre até 3:" → "até 4:" | `tests/legado-m1.test.ts:46-53` | ✅ Killed |
| M22 | `public/legacy/m1.js:67` | "Selecione 2 dados" → "3 dados" | `tests/legado-m1.test.ts:147-157` | ✅ Killed |
| M23 | `public/legacy/m1.js:247` | andamento ignora `D.agendasPrio` | `tests/legado-m1.test.ts:482-485` | ✅ Killed |
| M24 | `public/legacy/novos.js:255` | singular/plural invertido no Resumo | `tests/legado-m1.test.ts:527` | ✅ Killed |
| M25 | `public/legacy/m1.js:392` | botão chama outra função | `tests/legado-m1.test.ts:691-700` | ✅ Killed |

**Sensor depth**: P0-style (≥5 manuais; a feature mexe em dado salvo), 25 mutações.
**Result**: 25/25 killed, 0 survived — PASS ✅
**Limite do sensor**: só as camadas testáveis por `node --test` (lib e legado). As ilhas React (`CartoesMunicipio.tsx`, `Assentos.tsx`, `Persona.tsx`) só são cobertas por e2e, que exige servidor e disco; não foram mutadas. Os gaps PAR-05/PAR-06 abaixo indicam exatamente onde um mutante nessas ilhas sobreviveria (ex.: trocar `pctMun` por `0`).

**Isolamento**: `git status --porcelain` do worktree real antes e depois do sensor idênticos (`?? plataforma/playwright.isolado.config.ts`); scratch removido (`git worktree list` sem `m1-verifier-scratch`); `node_modules` real intacto (44 entradas).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ (`MapaVotos.tsx` removido, 171 linhas; regras puras em `lib/`) |
| Surgical changes | ✅ |
| No scope creep | ✅ (Missões 2-5 afirmadas inalteradas: `legado-m1.test.ts:362-372,500-503`, `e2e/m1-pagina-unica.spec.ts:131-144`) |
| Matches patterns | ✅ |
| Spec-anchored outcome check | ⚠️ ver gaps PAR-05, PAR-06, FEC-02 |
| Per-layer Coverage Expectation (domain 1:1; e2e happy+edge+error) | ⚠️ domínio 1:1 OK; e2e sem os 3 casos de borda acima |
| Every test maps to a spec requirement | ✅ (testes extras de SUG-16..23 e sugestão 92 mapeiam para itens listados na spec) |
| Guidelines | `plataforma/CLAUDE.md` seguido (pt-BR, ilhas fora do legado); duplicação deliberada: o resumo LEG-12 existe em TS (`lib/relacoes.ts:37`, usado em `ilhas/Resumos.tsx:160`) e em JS (`public/legacy/novos.js:255`), ambos testados |

Itens conhecidos pelos autores (conferidos, sem impacto novo nos requisitos): `Resumos.tsx` MunicipioResumo corrigido; RECAP da Missão 3 lê `m1.q3` (spec mantém M2-M5); SPEC_DEVIATION AD-003 (`Baixar.mapaPolitico` em `m1.js`, afirmado por `legado-m1.test.ts:691-700`); reações de município sem o nome no Resumo da aba (PAR-12 grava só `dado`/`valor`; o teste `legado-m1.test.ts:661` documenta o caso "Considerando 340…"); ENOSPC nos e2e anteriores (desta vez 61/61 passaram).

---

## Gate Check

- **Gate command**: `cd plataforma && npx tsc --noEmit && npm test`; e2e `npx playwright test -c playwright.isolado.config.ts e2e/m1- --workers=1 --trace off` (servidor `next dev -p 3100` fora do Playwright, encerrado ao fim, `.next` e `test-results` apagados)
- **`npx tsc --noEmit`**: exit 0
- **`npm test`**: 1192 tests, 1192 pass, 0 fail, 0 skipped, 0 cancelled (35,0 s)
- **e2e `e2e/m1-`**: 61 passed, 0 failed (1,6 min)
- **Test count before feature** (declarações `test(` em `plataforma/tests` no `8bbd641`): 1109; **after**: 1192 (contagem de execução). **Delta**: +83 testes unitários. e2e da Missão 1: 17 → 54 declarados (61 execuções com os laços).
- **Skipped tests**: nenhum
- **Failures**: nenhuma
- **Aviso externo**: o Next 16.4.0 imprimiu um alerta de vulnerabilidade e pediu para rodar `next upgrade`; o upgrade NÃO foi rodado (instrução do orquestrador) e o servidor subiu na segunda tentativa. O alerta fica registrado aqui para o usuário decidir.

---

## Fix Plans

Ordem por severidade. Todos são reforços de teste ou correção pontual; nenhum teste atual falha.

### Fix 1: Placar do cartão de município sem evidência e sem a posição do partido (Major)

- **Requisito**: PAR-05, PAR-06
- **Root cause**: o e2e só confere os títulos dos blocos e dois rótulos (`e2e/m1-conjuntura-partido.spec.ts:232-235`); `pctMun`/`pctEstado`/`numerosMun` (`ilhas/CartoesMunicipio.tsx:24-50`) não têm teste. A posição do partido está só no bloco Executivo (`:148-158`), mas PAR-05 a pede no Placar.
- **Fix task**: extrair `numerosMun`/`pctMun`/`pctEstado` para `lib/` com teste unitário de valores (inclusive `pct == null`), e estender o e2e para afirmar "Vereadores do PSOL", nome do prefeito e as duas % da Força; mostrar a posição também no Placar (ou registrar a decisão de manter só no Executivo e ajustar a spec).
- **Priority**: Major

### Fix 2: HTML baixado sem afirmação das categorias, do resumo LEG-12 e das reações (Major)

- **Requisito**: FEC-02
- **Root cause**: `tests/legado-m1.test.ts:574-581` e `e2e/m1-fechamento.spec.ts:42` não incluem relações classificadas nem `conj2.reacoes` nos dados do HTML.
- **Fix task**: no teste de `htmlMapaPolitico`, semear `D.relacoes` (com 2 categorias) e `D.conj2.reacoes` e afirmar `Você tem …` e a frase `Considerando … o mandato deve… …` dentro do HTML.
- **Priority**: Major

### Fix 3: Três casos de borda da spec sem teste (Minor)

- **Requisito**: Edge cases (formulário "+" aberto e vazio ao trocar de etapa; >12 classificados sem rolagem horizontal da página; "Brasil inteiro" mantém 15 linhas)
- **Fix task**: adicionar e2e para cada um (`document.documentElement.scrollWidth <= clientWidth` com 13 classificados; `selectOption('BR')` → 15 linhas e `Página 1 de`; abrir "+" sem digitar, ir à etapa seguinte e conferir `D.eleitorado.itens` vazio).
- **Priority**: Minor

### Fix 4: SOC-09 e PER-04 sem teste que prove a preservação/ausência (Minor)

- **Fix task**: teste que semeia `D.social.itens`, abre as Oportunidades, edita e confere `D.social` igual; teste que abre um pleito manual anterior com 2026 vinculada e confere que só o cartão 2026 tem `.mv5`.
- **Priority**: Minor

### Fix 5: Precisão de PER-02, LEG-01, LEG-02, PAR-02, PAR-07, PAR-08 (Minor)

- **Fix task**: afirmar posição/nome na linha do ranking, `option` "Brasil inteiro", contagem nas abas, os 5 indicadores do Placar, os 4 rótulos de posição e o ramo "só o domicílio" (com `municipio` no mandato).
- **Priority**: Minor

### Fix 6: Bookkeeping (Cosmetic)

- Marcar `**Status**: ✅ Done` em T31-T43 e atualizar a coluna Status do `spec.md:261-335` (`Implementing` → `Verified`/`Needs Fix` conforme os fixes acima). Estender a varredura GER-01 (`tests/legado-m1.test.ts:441`) para `ilhas/*.tsx` e `novos.js`.
- **Priority**: Cosmetic

### Spec-precision gap registrado

- **LEG-12**: a spec só define o plural ("20 Aliados"); o singular ("1 Aliado") foi decidido pelo autor e afirmado em `tests/legado-m1.test.ts:527`. Sugestão: acrescentar à spec.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| PAG-01 a PAG-04 | Implementing | ✅ Verified |
| PER-01, PER-03, PER-05 a PER-09 | Implementing | ✅ Verified |
| PER-02, PER-04 | Implementing | ⚠️ Partial (Fix 4/5) |
| LEG-03 a LEG-05, LEG-07 a LEG-13 | Implementing | ✅ Verified |
| LEG-01, LEG-02 | Implementing | ⚠️ Partial (Fix 5) |
| LEG-06 | Implementing | ❌ Needs test (Fix 5) |
| PAR-01, PAR-03, PAR-04, PAR-09 a PAR-14 | Implementing | ✅ Verified |
| PAR-02, PAR-07, PAR-08 | Implementing | ⚠️ Partial (Fix 5) |
| PAR-05, PAR-06 | Implementing | ❌ Needs Fix (Fix 1) |
| SOC-01 a SOC-08, ELE-01 a ELE-11, AGE-01 a AGE-04 | Implementing | ✅ Verified |
| SOC-09 | Implementing | ❌ Needs test (Fix 4) |
| FRA-01 a FRA-03 | Implementing | ✅ Verified |
| FEC-01, FEC-03 a FEC-05 | Implementing | ✅ Verified |
| FEC-02 | Implementing | ⚠️ Partial (Fix 2) |
| GER-02, GER-03 | Implementing | ✅ Verified |
| GER-01 | Implementing | ⚠️ Partial (Fix 6) |

(Não alterei o `spec.md`: o Verifier não edita artefatos do autor; a tabela acima é a recomendação.)

---

## Summary

**Overall**: ❌ Not Ready (somente por lacunas de evidência; o produto passou em todos os gates e em todas as mutações)

**Spec-anchored check**: 62/75 requisitos com PASS ancorado no valor da spec; 9 parciais; 4 sem teste (LEG-06, PAR-05, PAR-06, SOC-09); 1 spec-precision gap (LEG-12 singular); 3 casos de borda sem teste.
**Sensor**: 25/25 mutations killed
**Gate**: tsc exit 0; 1192 passed, 0 failed; e2e 61 passed, 0 failed

**What works**: página única por etapa, regras puras (eleitorado, agendas prioritárias, relações, mais votados, dados do partido, indicadores), textos exatos de `m1.js`, HTML offline com carrossel e filtro (testado em Chromium sem rede), preservação de `m1.q3`/`q4b`/`conj2`/`eleitorado.muns`.

**Issues found**: ver Fix 1 a 6.

**Next steps**: executar Fix 1 e Fix 2 (Major), depois 3 a 6; re-verificar (iteração 1 de no máximo 3).
