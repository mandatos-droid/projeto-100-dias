# Missão 2 · Equipe, Organograma e Rotinas Validation

**Date**: 2026-10-23
**Spec**: `.specs/features/missao2-equipe/spec.md`
**Diff range**: `7351bbf..HEAD` (36 commits; `git diff 7351bbf..HEAD -- plataforma` = 45 arquivos, +3324/-8)
**Verifier**: independent sub-agent (author != verifier)

---

## Veredito

**PASS**

Iteração 2 de 3. Na iteração 1 o veredito foi FAIL (G1 defeito de lógica em `alternaArea`; G2 a G5 mutantes sobreviventes). O commit `01bd49a` resolveu os cinco: todos os mutantes que sobreviveram foram mortos e o defeito G1 não se reproduz (inclusive em 4000 casos aleatórios). Gates verdes: `tsc` limpo, 107/107 nos 9 arquivos de teste da feature, e2e 68/68 (com ressalva de infraestrutura, abaixo). Restam só lacunas de baixa gravidade (G6 a G11) e a observação O1, que não bloqueiam.

Fora do escopo, de outro trabalho do usuário: `npm test` inteiro falha por `tests/rumo.test.ts` (trabalho novo, com regex inválida em `lib/rumo.ts`). Não é falha desta feature, não foi corrigido e não entra no veredito.

---

## Iteração 2

Iteração 1 (mantida nas seções originais abaixo): gates 101/101, e2e 68/68, sensor 31/40 mortos; FAIL por G1 a G5.

### Lacunas G1 a G5

| # | Resolução | Evidência (`arquivo:linha` + asserção) | Result |
| - | --------- | -------------------------------------- | ------ |
| G1 | `alternaArea` retira uma a uma sobre uma cópia que reflete as saídas anteriores | `lib/cadeiras.ts:107-115` (cópia com `m2.on`, `retira`, `aplica(copia, p)`, atualiza `m2.on`). Teste `tests/cadeiras.test.ts:219-233`: `confirma == ['A','D']`, `ativas == [0,20,23]`, `liderDe(c,23) == 20`, `liderDe(c,20) == 0` | ✅ |
| G2 | Caso negativo de `c2` | `tests/entrega.test.ts:55-60`: `m2.on '0\|20\|21'`, 21 com líder `-`, 22 com líder 20, `c2 == false`; depois liderada pela Chefia, `c2 == true` | ✅ |
| G3 | Topo da área com coordenador que não é a 1ª cadeira | `tests/rotinas.test.ts:188-193` `convoca == 8` (área); `:195-201` `participantes == [1, 8]` (entre áreas) | ✅ |
| G4 | Ids distintos nas rotinas entre áreas | `tests/rotinas.test.ts:202-209` `ids == ['x1','x2']` e as duas finalidades listadas | ✅ |
| G5 | Escape do Resumo | `tests/legado-m2.test.ts:116-121` o cargo `<i>Chefe</i>` sai `&lt;i&gt;Chefe&lt;/i&gt;`, a pessoa `Ana &lt;b&gt;&amp;&lt;/b&gt;`, `h.includes('<i>') == false`; o stub de `esc` (`:59`) passou a escapar de verdade (antes era identidade, por isso M37 sobrevivia) | ✅ |

Nenhum teste foi apagado nem enfraquecido (`git show 01bd49a -- plataforma/tests`: só linhas adicionadas, mais a troca do stub `esc` por um que escapa, o que fortalece).

### Por que o conserto de G1 poderia estar errado, e o que se tentou

- Outras ordens de remoção, `m2.on` ausente (formato antigo), cadeiras 20+ e liderança padrão `PADRAO`: fuzz diferencial em cópia descartável (`scratchpad/verif2/plataforma/fuzz.test.ts`): 4000 mandatos aleatórios, 30% no formato antigo, índices 20, 21, 22, 25 e 30, líderes explícitos e `PADRAO`, áreas desmarcadas com subconjuntos variados de cadeiras vazias e nomeadas. Oráculo: o líder esperado de cada cadeira que fica é o primeiro ancestral da árvore original que não foi removido. Resultado: 1 divergência em cerca de 3950 casos comparáveis (47 descartados por já terem ciclo nos dados de entrada), explicada em O1; nenhuma divergência na lógica de repasse em cadeia que G1 corrigia.
- Formato antigo (sem `m2.on`): a cópia fixa `m2.on` explícito (`lib/cadeiras.ts:109`), então a derivação por nome ou ficha não encolhe a lista no meio do laço. Sem divergência.
- Mutantes G1b (sem `aplica(copia, p)`), G1c (sem atualizar `m2.on` da cópia) e G1d (cópia sem `m2.on`) sobrevivem e são **equivalentes** nos cenários cobertos: cada mecanismo sozinho basta para subir até o ancestral certo (se a chave do removido permanece, `liderDe` sobe por ela; se foi apagada, o ponteiro já foi regravado). Não mudam resultado observável.
- **O1 (observação, Baixa, preexistente, não é regressão de G1)**: `retira` só regrava quem aponta direto para a cadeira removida (`lib/cadeiras.ts:85`). Se uma cadeira ativa aponta, pelo padrão, para uma cadeira do modelo inativa (ponteiro pendurado: 14 aponta para 13 inativa, que aponta para 11) e a 11 é removida, a 14 sobe para a Chefia em vez de virar topo como a 11. Só ocorre ao reativar uma cadeira do modelo isolada, sem a de cima. Sem perda de dado. Registrado, não bloqueia.

### Sensor (mutantes da iteração 1 e novos)

Cópia descartável nova: `scratchpad/verif2/plataforma/` (extraída do `HEAD` com `git archive`: `lib`, `tests`, `ilhas/equipe`, `public/legacy`, `package.json`, `tsconfig.json`; `node_modules` por junção; `tests/rumo.test.ts` e `tests/criterios.test.ts` removidos da cópia por serem de outro trabalho). Linha base: 107/107. Script: `scratchpad/mut3.py`.

| # | Arquivo | Mutação | Resultado |
| - | ------- | ------- | --------- |
| M12 | `lib/entrega.ts:12` | `c2`: `=== CHEFIA` para `!== CHEFIA` | ✅ Morto (1 falha, teste de G2) |
| M18 | `lib/rotinas.ts:36` | Topo da área = primeira cadeira | ✅ Morto (1 falha, teste de G3) |
| M31 | `lib/rotinas.ts:92` | `topoDe` (entre áreas) = primeira cadeira | ✅ Morto (1 falha, teste de G3) |
| M37 | `public/legacy/m2.js:98` | Resumo sem `esc()` no nome do cargo | ✅ Morto (1 falha, teste de G5) |
| M48 | `lib/rotinas.ts:111` | Id das rotinas entre áreas sempre `x1` | ✅ Morto (1 falha, teste de G4) |
| G1a | `lib/cadeiras.ts:109-115` | Desfaz o conserto (volta a `retira(c, i)` sobre a árvore original) | ✅ Morto (1 falha, teste de G1) |
| G1b, G1c, G1d | `lib/cadeiras.ts:109-114` | Tirar `aplica(copia, p)`, ou a atualização de `m2.on` da cópia, ou o `m2.on` inicial | Sobrevivem, **equivalentes** (um mecanismo sozinho basta) |

**Result**: PASS, 6/6 mutantes relevantes mortos; 0 sobreviventes relevantes; 3 equivalentes. Os antigos M35, M43 e M52 (cosméticos ou cobertos só pelo e2e) seguem como na iteração 1 e não bloqueiam.

### Gates da iteração 2 (árvore real, em `plataforma/`)

| Gate | Comando | Resultado |
| ---- | ------- | --------- |
| Tipos | `npx tsc --noEmit` | exit 0, sem erros |
| Lógica + legado | `node --test tests/cadeiras.test.ts tests/rotinas.test.ts tests/layoutOrg.test.ts tests/entrega.test.ts tests/exporta.test.ts tests/foco.test.ts tests/legado-m2.test.ts tests/demo.test.ts tests/landing.test.ts` | tests 107, pass 107, fail 0, skipped 0 (101 + 6 novos do `01bd49a`) |
| Telas | `npm run test:e2e` | 1ª execução: 64 passed, 4 failed (`escalacao.spec.ts:77`, `migracao.spec.ts:73`, `organograma.spec.ts:35`, `rotinas.spec.ts:8`): 3 por timeout de 30 s em `#tela[data-pronto="true"]` e 1 por `net::ERR_NETWORK_IO_SUSPENDED` (execução de 5.9 min contra 1.6 min na iteração 1: máquina suspensa ou sob carga). Reexecução dos 4 arquivos: 60 passed, 0 failed (1.4 min). Efetivo: 68/68. Nenhuma falha tem relação com o `01bd49a` (só tocou `lib/cadeiras.ts` e testes unitários). |
| `npm test` completo | `npm test` | **Fora do escopo, de outro trabalho do usuário**: falha em `tests/rumo.test.ts` (regex inválida em `lib/rumo.ts`, trabalho novo não commitado). Não corrigido e fora do veredito. Na cópia descartável (sem esse arquivo) `npm test` dá 107/107. |
| Build | `npm run build` | NÃO executado, por instrução |

`git status --porcelain` (sem `graphify-out`): igual ao do início, exceto este arquivo e duas mudanças em arquivos não rastreados do próprio trabalho do usuário durante a execução (`lib/criterios.ts` e `tests/criterios.test.ts` viraram `tests/atingimento.test.ts`); não foram tocadas por mim.

---

## Diff range

- Commits: `git log --oneline 7351bbf..HEAD` = 36 commits (T1 a T36). Tarefas T1 a T36 marcadas como feitas em `tasks.md` (linhas 100 a 1016); T37 a T41 (Fase 7) sem marca, adiadas de propósito.
- Superfície lida por inteiro: `lib/cadeiras.ts`, `lib/rotinas.ts`, `lib/layoutOrg.ts`, `lib/entrega.ts`, `lib/exporta.ts`, `public/legacy/m2.js`, `ilhas/equipe/*.tsx|ts`, os 7 arquivos de `tests/` e os 6 de `e2e/` do escopo, mais o diff de `ponte.tsx`, `app/guia/page.tsx` e `public/painel.html`.
- A árvore real tem mudanças não commitadas do usuário (Equipe.tsx, Assentos.tsx, novos.js, cadastro.js, Recomenda.tsx etc.). Nada foi tocado nelas; `git status --porcelain` (sem `graphify-out`) idêntico ao do início, exceto este arquivo.

---

## Resultado dos gates (contagens, iteração 1)

| Gate | Comando (em `plataforma/`) | Resultado |
| ---- | -------------------------- | --------- |
| Lógica + legado | `npm test` | tests 101, pass 101, fail 0, skipped 0 |
| Tipos | `npx tsc --noEmit` | exit 0, sem erros |
| Telas | `npm run test:e2e` (reexecução limpa) | 68 passed, 0 failed (1.6m) |
| Telas, 1ª execução | idem, com a CPU disputada pelos mutantes que eu rodava ao mesmo tempo | 67 passed, 1 failed: `e2e/rotinas.spec.ts:155` ("desmarcar a área guarda a rotina e remarcar a restaura"), timeout de 5 s em `getByText('Guardadas porque...')`. Rodou sozinho (14/14) e na reexecução completa passou. Intermitente sob carga; não é defeito de lógica. |
| Build | `npm run build` | NÃO executado, por instrução (aviso de segurança conhecido do Next 16.4) |

Integridade dos testes: antes da feature havia 19 testes (`demo` + `landing`); agora 101 (+82). O diff de `tests/` só tem linhas adicionadas; nenhum teste apagado nem enfraquecido. E2e: 0 antes, 68 agora.

---

## Cobertura por AC

Convenção: `U` = `plataforma/tests/*.test.ts`, `E` = `plataforma/e2e/*.spec.ts`. Linhas conferidas contra o arquivo lido.

### P1: Escolher as áreas e ajustar as cadeiras (MEQ-01..04)

| AC | Resultado definido na spec | `arquivo:linha` + asserção | Result |
| -- | -------------------------- | -------------------------- | ------ |
| 1 | Etapa "Áreas do mandato"; 6 áreas desmarcadas; Chefia marcada | `e2e/escalacao.spec.ts:9` `getByText('Etapa 1 de 3 · Áreas do mandato')`; `:42` `toContainText('1 cadeira')`; `tests/cadeiras.test.ts:13` `deepEqual(ativas({}), [0])` | ⚠️ Parcial: nenhum teste afirma as 6 caixas desmarcadas nem a Chefia marcada e desabilitada (`.check()` em `:43` passa mesmo se já estivesse marcada). Baixa |
| 2 | Marcar área traz as cadeiras de `PADRAO` da área e mostra o total | `tests/cadeiras.test.ts:68` `deepEqual(ativas(c), [0,1,2,3,4,5,6])`; `:74` `equal(ativas(c).length, 11)`; `e2e/escalacao.spec.ts:45` `toContainText('11 cadeiras')` | ✅ |
| 3 | "Usar o modelo completo": 6 áreas, 20 cadeiras | `tests/cadeiras.test.ts:80-82` `ativas == 0..19`, `coordsDe == [...AREAS]`, `AREAS.length == 6`; `e2e/escalacao.spec.ts:52` `toContainText('20 cadeiras')`, `:54` `m2.coords == MODELO` | ✅ |
| 4 | Desmarcar área com cadeiras sem nome remove sem confirmar | `tests/cadeiras.test.ts:88` `equal(r.confirma, undefined)`, `:90` `ativas == [0,7,8,9,10]`; `e2e/escalacao.spec.ts:82-83` `19 cadeiras`, `perguntou == false` | ✅ |
| 5 | Com nome: confirmação listando nomes; ao confirmar vão para "Sem área", não apaga | `tests/cadeiras.test.ts:97` `deepEqual(r.confirma, ['Ana'])`, `:100` `coordDe == SEM_AREA`, `:101` `m2.f3 == 'Ana'`; `e2e/escalacao.spec.ts:64` `msgs[0] contém 'Bia Lima'`, `:73` `m2.p8.coord == 'Sem área'` | ✅ |
| 6 | Remover/acrescentar atualiza a contagem; 1 a 40 | `tests/cadeiras.test.ts:127` `ativas.length == 40`, `:155-156` (Chefia não sai = piso 1); `e2e/escalacao.spec.ts:95-103` `20 de 40` → `19` → `20` → `21` | ✅ |
| 7 | Remover Chefia: recusa e explica que é obrigatória | `tests/cadeiras.test.ts:155` `match(r.erro, /obrigat/i)`, `:156` `patch == {}`; `e2e/escalacao.spec.ts:115` `Remover Chefia de gabinete` `toHaveCount(0)` | ✅ |
| 8 | Passar de 40: bloqueia e informa o limite | `tests/cadeiras.test.ts:129` `match(r.erro, /40/)`, `:131` `ativas.length == 40`; `e2e/escalacao.spec.ts:109-110` `toBeDisabled`, `getByText(/40 cadeiras permitidas/)` | ✅ |
| 9 | Sem área marcada, "Nomes" bloqueada e o motivo à vista | `e2e/escalacao.spec.ts:10` `aria-disabled == 'true'`, `:11` texto "Marque ao menos uma área para liberar os nomes.", `:14` `m2.etapa` `toBeUndefined` | ✅ |
| 10 | "Especialista temático(a) N" + etiqueta "Temático", sem bandeira | `e2e/escalacao.spec.ts:117-119` tag `Temático`, `[data-etapa]` `not.toContainText(/bandeira/i)`; `tests/legado-m2.test.ts:39` `/bandeira|escopo/i` falso no texto da tarefa | ⚠️ Parcial: só o temático 1 e só a etapa 2 são afirmados; "N = 2" e as etapas 1 e 3 sem assertiva. Baixa |

### P1: Nomear e posicionar a equipe (MEQ-05..07)

| AC | Resultado definido na spec | `arquivo:linha` + asserção | Result |
| -- | -------------------------- | -------------------------- | ------ |
| 1 | Lista cada cadeira ativa com nome, cargo, coordenação, liderança, já pré-preenchidas | `e2e/escalacao.spec.ts:130` `.es-nome` `toHaveCount(11)`, `:131` coordenação `toHaveValue('Legislativo')`, `:132` liderança `toHaveValue('1')`; `tests/cadeiras.test.ts:29-32` | ✅ (campo "Nome do cargo" não é afirmado: baixa) |
| 2 | `*` marca "processo seletivo de ampla concorrência" | `e2e/escalacao.spec.ts:148` texto "Processo seletivo de ampla concorrência" visível, `:149` `m2.f9 == '*'` | ✅ |
| 3 | Grava e atualiza o mini-organograma em menos de 300 ms | `e2e/escalacao.spec.ts:186` `__dt toBeLessThan(300)`, `:187` `m2.p9.lider == '0'` | ✅ para liderança. Troca de coordenação na Tarefa 1 não tem teste (baixa) |
| 4 | Ciclo: recusa e mostra a cadeia | `tests/cadeiras.test.ts:190` `ciclo == [20,21]`, `:197` `ciclo == [20,21,22]`, `:202` `[21]`; `e2e/escalacao.spec.ts:140` alerta "Alfa → Beta → Gama voltaria para Alfa", `:141-142` valor anterior mantido | ✅ |
| 5 | Liderança que aponta para cadeira removida passa à liderança da removida | `tests/cadeiras.test.ts:163` `liderDe(c, 22) == 20`; `e2e/escalacao.spec.ts` n/a; `e2e/organograma.spec.ts:173` `m2.p23.lider == '20'` | ⚠️ PASS só para 1 cadeira removida por vez. Defeito real com 2 removidas encadeadas (G1) |
| 6 | Sem escopo, perfil nem repertório na Tarefa 1 | `e2e/escalacao.spec.ts:133` `textarea` `toHaveCount(0)`, `:134` `not.toContainText(/escopo\|habilidade\|repertório/i)` | ✅ |
| 7 | Sai e volta: mantém tudo (autosalvamento) | `e2e/escalacao.spec.ts:31-32` `m2.f1 == 'Ana Souza'`, `m2.coords == 'Legislativo'`; `:157` `toHaveValue('Bia Lima')` após `reload` | ✅ |
| 8 | "Etapa X de 3" e voltar sem perder dados | `e2e/escalacao.spec.ts:20` "Etapa 3 de 3 · Nomes e liderança", `:29` "Etapa 2 de 3 · Cadeiras" depois de Voltar, `:22` `m2.etapa == '3'` | ✅ |

### P1: Organograma interativo com painel (MEQ-08..11, 15, 16)

| AC | Resultado definido na spec | `arquivo:linha` + asserção | Result |
| -- | -------------------------- | -------------------------- | ------ |
| 1 | Clique ou Enter abre o painel com os campos | `e2e/organograma.spec.ts:70-72` painel `toBeVisible` e cargo; `:198-200` Enter abre e o foco cai num `INPUT` do painel | ⚠️ Parcial: pessoa, coordenação, liderança e escopo são exercitados (`:74`, `:90`, `:100`, `:110`); especificidades, habilidades e repertório nunca são tocados em teste. Baixa |
| 2 | Alterar campo reflete na caixa e nas rotinas e grava | `e2e/organograma.spec.ts:91` caixa contém 'Carla Dias', `:103` `m2.p9.coord == 'Legislativo'`; `e2e/rotinas.spec.ts:48-49` rotina da área `2 participantes` sem 'Caio Reis' | ✅ |
| 3 | Alterar coordenação ou liderança no painel redesenha e atualiza rotinas | coordenação: `e2e/organograma.spec.ts:101-103`, `e2e/rotinas.spec.ts:48`; liderança: só o caminho de recusa, `e2e/organograma.spec.ts:111-112` | ⚠️ Parcial: troca de liderança aceita no painel não tem teste. Média-baixa |
| 4 | Caixa mostra pessoa, cargo, área (cor) e anel | `e2e/organograma.spec.ts:14-17` pessoa, cargo, anel `'0 de 6 campos do painel preenchidos'`, `:19-22` área e anel `'1 de 6'` | ✅ ("apenas" convive com o selo do AC 5: ⚠️ precisão da spec) |
| 5 | Sem escopo: selo "escopo pendente" | `e2e/organograma.spec.ts:16` selo visível, `:21` `toHaveCount(0)` quando há escopo | ✅ |
| 6 | Barra: com escopo / ativas | `e2e/organograma.spec.ts:37` `'1/5 cadeiras com escopo definido'`, `:43` `'2/5 ...'` | ✅ |
| 7 | "Acrescentar cadeira" com seleção cria subordinada e abre o painel | `e2e/organograma.spec.ts:144-148` caixa 20 visível, painel "Cadeira acrescentada", liderança `'7'`, coordenação `'Comunicação'`, `m2.on == '0\|1\|2\|7\|8\|20'` | ✅ |
| 8 | Remover líder: confirma e repassa | `tests/cadeiras.test.ts:163`; `e2e/organograma.spec.ts:164` mensagem contém 'Gama', `:172-173` `m2.on == '0\|20\|22'`, `m2.p23.lider == '20'`, `:175` liderança `'20'` | ✅ |
| 9 | "Ajustar layout" reorganiza em árvore e enquadra | `e2e/organograma.spec.ts:58` `viewport style` volta a `inicial` | ✅ (⚠️ precisão: "reorganizar em árvore" não é afirmado separadamente; sem arrastar, equivale a reenquadrar) |
| 10 | Filtro por área esmaece as outras sem esconder | `e2e/organograma.spec.ts:29` opacidade da cadeira 7 `< 1`, `:30` cadeira 1 `== 1`, `:32` volta a `1` com "Todas" | ✅ |

### P1: Rotinas geradas (MEQ-17)

| AC | Resultado definido na spec | `arquivo:linha` + asserção | Result |
| -- | -------------------------- | -------------------------- | ------ |
| 1 | ≥1 cadeira com nome: planejamento quadrimestral, monitoramento mensal, alinhamento semanal | `tests/rotinas.test.ts:10-14` `[id, freq, duracao]` das 3, `:16` `participantes == [0]`, `:17` `convoca == 0` | ✅ (⚠️ precisão: "cadeiras ocupadas" na spec; o código usa todas as ativas, coerente com o AC 6) |
| 2 | Área com ≥2 cadeiras: reunião semanal de 45 min, cadeiras da área, convocador = topo | `tests/rotinas.test.ts:28-31` `freq`, `duracao == '45 min'`, `participantes == [7,8,9]`, `convoca == 7`; `:36` (1 cadeira não gera); `e2e/rotinas.spec.ts:11-14` | ✅ para o topo padrão. Regra "topo" quando o coordenador não é a 1ª cadeira não é testada (M18, M31) |
| 3 | Par líder/liderado: "Feedback semestral 1:1" de 30 min, agrupado por líder | `tests/rotinas.test.ts:42` `ids == ['fb:1>2','fb:1>3']`, `:43` `30 min`, `Semestralmente`, `convoca == 1`; `e2e/rotinas.spec.ts:56-57` | ✅ |
| 4 | Recalcula em menos de 300 ms | `e2e/rotinas.spec.ts:48` a rotina atualiza na mesma tela (sem medida de tempo) | ⚠️ Parcial: o limite de 300 ms só é medido no mini-organograma (`e2e/escalacao.spec.ts:186`). Baixa |
| 5 | Lista por área: quem coordena, quem participa, escopo de cada pessoa | `e2e/rotinas.spec.ts:14` `convoca: Bia Lima`, `:13` `3 participantes`, `:24` `escopo ainda não definido` | ⚠️ Parcial: o ramo "escopo listado por pessoa" não tem assertiva. Baixa |
| 6 | Cadeira sem nome: "vaga", fora dos confirmados | `tests/rotinas.test.ts:51` `participantes == [7,8,9]`, `:52` `confirmados == 1`, `:53` `semanal confirmados == 2`; `e2e/rotinas.spec.ts:22-23` `'2 de 3 com nome'`, `vaga` | ✅ |
| 7 | Desligar rotina guarda a escolha e tira do checklist | `tests/rotinas.test.ts:66-70`; `e2e/rotinas.spec.ts:37` `m2.rotoff == 'area:Comunicação'`; `tests/entrega.test.ts:43` `c3 == false` após `desliga(plan)` | ✅ |

### P2: Cadeia de rotinas (MEQ-18, 19)

| AC | Resultado definido na spec | `arquivo:linha` + asserção | Result |
| -- | -------------------------- | -------------------------- | ------ |
| 1 | Ordem planejamento → monitoramento → alinhamento → área → feedback, com frequência, duração e nº de cadeiras | `tests/rotinas.test.ts:79-80` `tipos == ['plan','mensal','semanal','area','feedback']`, `ordem == [1..5]`; `e2e/rotinas.spec.ts:76`, `:80`, `:82` frequência, duração e "N cadeiras" | ✅ |
| 2 | Elo selecionado destaca as cadeiras e esmaece as demais | `tests/rotinas.test.ts:100` `cadeirasDoElo == [7,8]`; `e2e/rotinas.spec.ts:94,97` foco `[1,2,7,8,9]`/`[7,8,9]`; `e2e/organograma.spec.ts:228-229` opacidade 1 em 7,8,9 e `< 1` em 0,1,2 | ✅ |
| 3 | Selecionar cadeira lista suas rotinas | `tests/rotinas.test.ts:106`; `e2e/organograma.spec.ts:253-257` | ✅ |
| 4 | "Mostrar todos" limpa o destaque | `e2e/rotinas.spec.ts:99-100` foco `[]` e botão some; `e2e/organograma.spec.ts:239` opacidade volta a 1 | ✅ |
| 5 | Elos distinguidos por texto e ícone, nunca só cor | `e2e/rotinas.spec.ts:84-85` `.es-elo-n` `toHaveText(k+1)`, `.es-elo-ic` `not.toBeEmpty()` | ✅ |

### P2: Comunicação entre áreas (MEQ-20..22)

| AC | Resultado definido na spec | `arquivo:linha` + asserção | Result |
| -- | -------------------------- | -------------------------- | ------ |
| 1 | 4 sugestões, cada uma só com as duas áreas ativas | `tests/rotinas.test.ts:159-162` `[]` sem áreas; só `'Legislativo>Comunicação'` com 2 áreas; `:169-171` as 4 com as 6 áreas; `e2e/rotinas.spec.ts:117` "Sugestões da Legisla" | ✅ |
| 2 | Pede origem, destino, finalidade, frequência, canal e grava | `tests/rotinas.test.ts:134` `[de, para, finalidade, freq, canal]`; `e2e/rotinas.spec.ts:139` `m2.x` com os 5 campos | ✅ |
| 3 | Mesma área: recusa | `tests/rotinas.test.ts:125-126` `match(erro, /mesma área/i)`, `patch == {}`; `e2e/rotinas.spec.ts:151-152` alerta e `m2.x` `toBeUndefined` | ✅ |
| 4 | Linha pontilhada rotulada, sem alterar a hierarquia | `tests/layoutOrg.test.ts:50-53` aresta `entre` `[1,7]`, rótulo `/Semanalmente/`, hierarquia igual; `e2e/organograma.spec.ts:293` `stroke-dasharray /6/`, `:294` rótulo "Semanalmente: Pauta da semana" | ✅ |
| 5 | Selecionar a rotina destaca as cadeiras de convocação das duas áreas | `tests/rotinas.test.ts:135` `participantes == [1,7]`; `e2e/organograma.spec.ts:307-310` opacidade 1 em 1 e 7, `< 1` em 0 e 2 | ✅ (⚠️ precisão: "cadeiras de convocação" só é definida no código, `rotinas.ts:89`) |
| 6 | Desmarcar área arquiva e não apaga | `tests/rotinas.test.ts:150-151` `rotinasEntreAreas == []`, `entreAreasArquivadas.length == 1`; `e2e/rotinas.spec.ts:159-160` | ✅ |
| 7 | Remarcar restaura | `tests/rotinas.test.ts:153` `deepEqual(rotinasEntreAreas(c), antes)`; `e2e/rotinas.spec.ts:166` | ✅ |

### P2: Entrega e compartilhamento (MEQ-23)

| AC | Resultado definido na spec | `arquivo:linha` + asserção | Result |
| -- | -------------------------- | -------------------------- | ------ |
| 1 | 4 blocos | `e2e/entrega.spec.ts:16` `[data-bloco]` `toHaveCount(4)`, `:17-21` conteúdo de cada um | ✅ |
| 2 | PNG do organograma completo com área e legenda | `e2e/entrega.spec.ts:27-30` nome `organograma-do-mandato.png`, `> 1000` bytes, assinatura PNG; `tests/exporta.test.ts:17-18,30-34` nomes, cargos, áreas e legenda só das ativas | ✅ |
| 3 | Imprimir: abre a impressão com layout de papel | `e2e/entrega.spec.ts:53` `window.print` chamado 1 vez, `:55-56` 4 blocos visíveis e botão oculto em `media: print` | ✅ (⚠️ precisão: "layout de papel" não é definido) |
| 4 | Escopo de todas as cadeiras com nome sugere `m2.c1` | `tests/entrega.test.ts:14` `c1 == true`, `:21` `false` sem escopo, `:28` `{}` falso; `e2e/entrega.spec.ts:36` sugestão visível, `:45` ausente | ✅ |
| 5 | Cadeira ligada à Chefia sugere `m2.c2` | `tests/entrega.test.ts:32` `c2 == false` com só a Chefia, `:35` `c2 == true` com Legislativo | ⚠️ Passa nos 2 valores mas não discrimina: o mutante `=== CHEFIA` → `!== CHEFIA` sobrevive (M12, G2) |
| 6 | Rotina ativa de cada tipo gerado sugere `m2.c3` | `tests/entrega.test.ts:41` `c3 == true`, `:43` `false` com `plan` desligada, `:44` `{}` falso | ✅ |
| 7 | Marcação final sob controle do usuário | `tests/entrega.test.ts:51-52` JSON do campo inalterado, `m2.c1 == undefined`; `e2e/entrega.spec.ts:37` antes do clique `toBeUndefined`, `:39` depois `toBeTruthy` | ✅ |

### Edge cases

| Edge case | `arquivo:linha` + asserção | Result |
| --------- | -------------------------- | ------ |
| Mandato antigo: ativa cadeiras com nome, marca áreas, preserva `m2.p{n}.*` | `tests/cadeiras.test.ts:9` `ativas == [0,2,4]`, `:109` `m2.f2 == 'Bia'`; `e2e/migracao.spec.ts:16-19` `20 cadeiras` e as 6 áreas marcadas, `:22-23` nomes intactos, `:30` `'2/20 ...'`, `:32` ficha antiga `aria-pressed true` | ✅ (o unitário T-21 não afirma as áreas inferidas: M35 sobrevive, coberto só pelo e2e) |
| `m2.areas` preservada e oculta | `tests/cadeiras.test.ts:25` JSON do campo idêntico após ler; `e2e/migracao.spec.ts:41-42` `m2.areas == 'saude\|educacao'`, `m2.areas_aplicadas == 'saude'` após editar, `:43-44` não aparece | ✅ |
| Área toda sem nome: gera reunião e lista "vaga" | `tests/rotinas.test.ts:26-30` (só a Chefia nomeada, área Comunicação gerada com `[7,8,9]`); `e2e/rotinas.spec.ts:23` `vaga` | ✅ |
| Nome repetido: aceita com aviso | `e2e/escalacao.spec.ts:164-165` `mesma pessoa em 2 cadeiras` `toHaveCount(2)`, `m2.f10 == 'bia lima'` | ✅ |
| Sem rede: edição local e sincronização | nenhum teste (herdado de `Store.salvar` do Guia, sem código novo) | ⚠️ Sem evidência; aceito como herdado |
| 360 px: painel em gaveta e sem rolagem horizontal | `e2e/organograma.spec.ts:121-123` painel encosta no fim da tela, `width <= 360`, `scrollWidth <= innerWidth` | ✅ para o organograma; Tarefa 1 e Rotinas em 360 px sem teste (baixa) |
| Só teclado: Tab até a caixa, Enter abre | `e2e/organograma.spec.ts:195-200` | ✅ |

### Requisitos MEQ (resumo; cada um aponta os testes acima)

| MEQ | Evidência principal | Result |
| --- | ------------------- | ------ |
| 01 | `e2e/escalacao.spec.ts:9-14`; `tests/legado-m2.test.ts:32` `Comp.funcoes()` só o contêiner | ✅ |
| 02 | `tests/cadeiras.test.ts:68,74,80-82`; `e2e/escalacao.spec.ts:45,52` | ✅ |
| 03 | `tests/cadeiras.test.ts:127-131,155-156`; `e2e/escalacao.spec.ts:95-110` | ✅ |
| 04 | `tests/cadeiras.test.ts:88-102,118`; `e2e/escalacao.spec.ts:64-83` | ✅ |
| 05 | `e2e/escalacao.spec.ts:20-33,157` | ✅ |
| 06 | `tests/cadeiras.test.ts:29-53`; `e2e/escalacao.spec.ts:131-134` | ✅ |
| 07 | `tests/cadeiras.test.ts:190,197,202,210,216`; `e2e/escalacao.spec.ts:140-142`; `e2e/organograma.spec.ts:111-112` | ✅ |
| 08 | `tests/cadeiras.test.ts:163,170-174`; `e2e/organograma.spec.ts:164-175` | ⚠️ ✅ salvo o caso encadeado (G1) |
| 09 | `e2e/organograma.spec.ts:70-82` | ✅ |
| 10 | `e2e/organograma.spec.ts:91,103`; `e2e/rotinas.spec.ts:48-49` | ✅ |
| 11 | `tests/layoutOrg.test.ts:16-18,25-27,33,40-41`; `e2e/organograma.spec.ts:14-22` | ✅ |
| 15 (filtro por área) | `e2e/organograma.spec.ts:29-32` (a visão por área é P3, adiada) | ✅ |
| 16 | `e2e/organograma.spec.ts:195-200,206-207,216-217,132` | ✅ |
| 17 | `tests/rotinas.test.ts:10-70`; `e2e/rotinas.spec.ts:11-57` | ✅ |
| 18 | `tests/rotinas.test.ts:79-96`; `e2e/rotinas.spec.ts:76-86` | ✅ |
| 19 | `tests/rotinas.test.ts:100-107`; `tests/foco.test.ts:12,21,32`; `e2e/organograma.spec.ts:228-229` | ✅ |
| 20 | `tests/rotinas.test.ts:125,134,141-142,162,169-171,176,184-185`; `e2e/rotinas.spec.ts:118-153` | ✅ |
| 21 | `tests/layoutOrg.test.ts:49-53,59`; `e2e/organograma.spec.ts:291-300` | ✅ |
| 22 | `tests/rotinas.test.ts:150-154`; `e2e/rotinas.spec.ts:159-168` | ✅ |
| 23 | `tests/entrega.test.ts:14-52`; `tests/exporta.test.ts:16-51`; `e2e/entrega.spec.ts:16-56` | ⚠️ ✅ salvo o mutante M12 (c2) |
| 24 | `tests/cadeiras.test.ts:9-26,105-110`; `tests/legado-m2.test.ts:75,81,85,97-113`; `e2e/migracao.spec.ts:16-75` | ✅ |

**Status**: ✅ P1 e P2 todos com evidência. ⚠️ 1 AC com defeito real num caso (P1 nomear AC5, G1), 1 AC com asserção que não discrimina (P2 entrega AC5, G2), 7 ACs com cobertura parcial de baixa gravidade, 6 lacunas de precisão da spec.

### Lacunas de precisão da spec

1. Rotinas AC1 diz "cadeiras ocupadas", mas AC6 e T-15 exigem listar vagas; o código usa todas as ativas (`lib/rotinas.ts:29`). Esclarecer o texto.
2. "Menos de 300 ms" (Nomear AC3, Rotinas AC4) não define como medir; só o mini-organograma é medido.
3. Organograma AC4 ("apenas pessoa, cargo, área e anel") convive com o selo do AC5; dizer que o selo é exceção.
4. "Cadeira de topo da área" e "cadeiras de convocação" não definem o desempate quando a área tem mais de um topo (o código escolhe o primeiro, `lib/rotinas.ts:36,92`).
5. Uma cadeira movida para uma área não marcada, pelo seletor de coordenação (`EtapaNomes.tsx:51`, `PainelCadeira.tsx:69`), ainda gera "Reunião da área" (`lib/rotinas.ts:33` percorre `AREAS`, não `coordsDe`). A spec não diz se área não marcada gera rotina.
6. "Layout de papel" (Entrega AC3) e "reorganizar em árvore" (Organograma AC9) sem resultado mensurável. O quadro de rastreabilidade da spec ainda mostra `Pending` e "0 mapped to tasks" (desatualizado; não editei a spec).

---

## Discrimination Sensor (iteração 1)

Cópia descartável: `scratchpad/verif/` (cópia de `lib`, `tests`, `public/legacy/m2.js`, `ilhas/equipe/foco.ts`, `package.json`, `tsconfig.json`; `node_modules` por junção). Cada mutante foi aplicado a uma cópia, `npm test` executado e o arquivo restaurado. Linha base da cópia: 101/101. Sensor completo (≥5, feature de dados do usuário). Um mutante (M06) era inválido (`ReferenceError` por import ausente, 23 falhas espúrias) e foi refeito como M06b.

| # | Arquivo:linha | Mutação | Resultado |
| - | ------------- | ------- | --------- |
| M01 | `lib/cadeiras.ts:120` | Tirar a recusa de ciclo (`if (false)`) | ✅ Morto (3 falhas) |
| M02 | `lib/cadeiras.ts:14` | Limite 40 → 41 | ✅ Morto |
| M03 | `lib/cadeiras.ts:86` | Remoção não repassa a liderança | ✅ Morto |
| M04 | `lib/cadeiras.ts:139` | Chefia removível | ✅ Morto |
| M05 | `lib/cadeiras.ts:108` | Desmarcar área não move nomeadas para "Sem área" | ✅ Morto |
| M06b | `lib/rotinas.ts:22` | `*` conta como pessoa nos confirmados | ✅ Morto |
| M07 | `lib/rotinas.ts:52` | Ordem da cadeia: área antes de semanal | ✅ Morto |
| M08 | `lib/rotinas.ts:101` | Rotina entre áreas não é arquivada | ✅ Morto |
| M09 | `lib/rotinas.ts:35` | Área com 1 cadeira gera reunião (`< 2` → `< 1`) | ✅ Morto |
| M10 | `lib/layoutOrg.ts:25` | Layout não sobe ao líder visível | ✅ Morto |
| M11 | `lib/rotinas.ts:40` | Feedback 30 → 45 min | ✅ Morto |
| M12 | `lib/entrega.ts:12` | `c2`: `=== CHEFIA` → `!== CHEFIA` | ❌ **Sobreviveu** |
| M13 | `lib/exporta.ts:8` | SVG sem escape de `&` | ✅ Morto |
| M14 | `public/legacy/m2.js:69` | `*` não conta como cadeira nomeada | ✅ Morto (2 falhas) |
| M15 | `lib/cadeiras.ts:38` | `ativas` sem a Chefia obrigatória | ✅ Morto (11 falhas) |
| M16 | `public/legacy/m2.js:71` | Total sem o fallback de 20 | ✅ Morto |
| M17 | `lib/cadeiras.ts:98` | Marcar área não traz as cadeiras sugeridas | ✅ Morto (16 falhas) |
| M18 | `lib/rotinas.ts:36` | Topo da área = primeira cadeira | ❌ **Sobreviveu** |
| M19 | `lib/rotinas.ts:107` | `criaEntreAreas` aceita a mesma área | ✅ Morto |
| M20 | `lib/rotinas.ts:46` | Rotina desligada continua na lista | ✅ Morto |
| M21 | `lib/entrega.ts:15` | `c3` ignora rotinas desligadas | ✅ Morto |
| M22 | `lib/cadeiras.ts:120` | Cadeia do ciclo sem `reverse` | ✅ Morto |
| M23 | `lib/cadeiras.ts:133` | Cadeira nova (índice 20+) sem líder `-` | ❌ Sobreviveu, **equivalente**: `liderDe` já devolve `null` para índice sem `PADRAO` |
| M24 | `public/legacy/m2.js:77` | `temConteudo` ignora `m2.coords` | ✅ Morto |
| M25 | `lib/entrega.ts:11` | `c1` com `some` em vez de `every` | ✅ Morto |
| M26 | `lib/layoutOrg.ts:35` | Rótulo da aresta entre áreas sem a frequência | ✅ Morto |
| M27 | `lib/rotinas.ts:40` | Feedback agrupado pelo liderado | ✅ Morto |
| M28 | `lib/cadeiras.ts:147` | Modelo completo com 19 cadeiras | ✅ Morto |
| M29 | `lib/cadeiras.ts:50` | Líder `-` deixa de ser topo | ✅ Morto |
| M30 | `lib/exporta.ts:45` | Legenda lista todas as áreas | ✅ Morto |
| M31 | `lib/rotinas.ts:92` | `topoDe` (entre áreas) = primeira cadeira | ❌ **Sobreviveu** |
| M34 | `lib/cadeiras.ts:52` | `liderDe` não sobe até a cadeira ativa | ✅ Morto |
| M35 | `lib/cadeiras.ts:65` | `coordsDe` do mandato antigo não infere áreas | ❌ **Sobreviveu** nos unitários (o e2e `migracao.spec.ts:17-19` o mataria) |
| M37 | `public/legacy/m2.js:96` | Resumo sem `esc()` no nome do cargo | ❌ **Sobreviveu** |
| M43 | `lib/exporta.ts:27` | Aresta entre áreas sem pontilhado no SVG | ❌ Sobreviveu (cosmético, a tela é coberta por `organograma.spec.ts:293`) |
| M48 | `lib/rotinas.ts:111` | Id das rotinas entre áreas sempre `x1` | ❌ **Sobreviveu** |
| M52 | `lib/layoutOrg.ts:28` | Cor da aresta de hierarquia pela área do líder | ❌ Sobreviveu (cosmético) |
| M53 | `lib/cadeiras.ts:78` | Remoção não guarda `m2.arq` | ✅ Morto |
| M54 | `lib/rotinas.ts:88` | Chefia não aceita como ponta de rotina entre áreas | ✅ Morto |
| M55 | `lib/rotinas.ts:29` | Planejamento sem convocador | ✅ Morto |

**Sensor depth**: P0-full manual (40 mutantes válidos em 6 arquivos).
**Resultado da iteração 1**: 31/40 mortos, 9 sobreviventes (1 equivalente, 2 cosméticos, 1 coberto só no e2e) — ❌ FAIL por M12, M18, M31, M37, M48.

---

## Achados em código (ilhas e integração)

Li `ilhas/equipe/*.tsx|ts` por inteiro contra a spec. Itens verificados sem problema: `m2.areas` e `m2.areas_aplicadas` nunca são lidas nem gravadas pelas ilhas (a única menção está em `lib/recomenda.ts`, fora de escopo); Tarefa 1 não renderiza escopo, perfil nem repertório (`EtapaNomes.tsx:33-64`, só pessoa, cargo, coordenação, liderança); chaves gravadas são as da spec (`m2.f{n}`, `m2.p{n}.*`, `m2.coords`, `m2.on`, `m2.arq.{n}`, `m2.x`, `m2.rotoff`, `m2.etapa`); `m2.etapa` sobrevive a `Ilhas.ligar` por estar em `D.campos` (`Escalacao.tsx:20,32`); `useEquipe.agir` aplica o patch no próprio `D.campos` e chama `bump` (`useEquipe.ts:12-18`); `m2.js` usa os nomes reais do legado (`Telas.estadoTxt` em `app.js:141,242`, `Resumo.ex` em `resumo.js:6`, `temConteudo` em `nucleo.js:230`) e entra na ordem certa em `app/guia/page.tsx` (depois de `novos`).

| # | Local | Achado | Severidade |
| - | ----- | ------ | ---------- |
| A1 | `lib/cadeiras.ts:75-89` e `:107` | **Defeito real (G1).** `alternaArea(c, área, false)` chama `retira(c, i)` para cada cadeira vazia sobre a árvore original. Com 2 cadeiras vazias encadeadas na área, a repassagem da segunda aponta para a primeira (já removida). Reprodução em cópia descartável: cadeiras `0|20|21|22|23`, 21 e 22 vazias na área desmarcada, 23 com nome e liderada por 22 (que é liderada por 21, liderada por 20). Antes: `liderDe(23) = 22`. Depois de desmarcar: `liderDe(23) = null` (esperado `20`). A cadeira nomeada vira topo e aparece como raiz solta no organograma. Sem perda de nome. O modelo padrão nunca forma essa cadeia (profundidade máxima 2 por área), então só ocorre com liderança personalizada. | Média |
| A2 | `lib/rotinas.ts:33` vs `lib/cadeiras.ts:63` | Uma cadeira movida para área não marcada (coordenação no `select`) gera "Reunião da área" dessa área, mas a área não aparece marcada na Etapa 1 nem entra em "Entre áreas". Inconsistência de modelo, não perda de dado. | Baixa |
| A3 | `ilhas/equipe/Entrega.tsx:32` | `marca()` grava `'1'`; o checklist legado grava `true` (`guia.js:160`). Compatível, porque todos os leitores usam truthiness (`app.js:248`, `nucleo.js:235`). | Info |
| A4 | `public/painel.html:807-808` | `cargosPreenchidos` conta qualquer chave `m2.f{n}` com valor, sem checar `m2.on`; `m2.js` conta só ativas. Divergem se sobrar nome de cadeira inativa (o fluxo normal apaga o nome ao remover, então só em dado inconsistente). Coberto no cenário normal por `e2e/migracao.spec.ts:65-66`. | Info |
| A5 | `e2e/rotinas.spec.ts:155` | Teste intermitente sob carga (timeout de 5 s em `Guardadas porque...`). Passou isolado e na reexecução. | Baixa |
| A6 | `ilhas/equipe/EtapaCadeiras.tsx:22` | A confirmação de remoção na Etapa 2 só aparece com nome; remover um líder sem nome repassa a liderança em silêncio (a spec só exige confirmação no organograma, MEQ-08). Comportamento aceitável. | Info |

---

## Lacunas ranqueadas (iteração 1; G1 a G5 resolvidas na iteração 2)

| # | Sev. | Onde | O que consertar |
| - | ---- | ---- | --------------- |
| G1 | Média | `plataforma/lib/cadeiras.ts:75-89,107` (`retira`/`alternaArea`) | Defeito: repasse de liderança errado ao remover 2+ cadeiras encadeadas numa desmarcação de área. Resolver `acima` contra o conjunto que está sendo removido (subir até a primeira cadeira que fica) ou aplicar as retiradas em sequência numa cópia. Teste novo em `tests/cadeiras.test.ts`: cenário da reprodução, afirmando `liderDe(c, 23) === 20`. |
| G2 | Média | `plataforma/tests/entrega.test.ts:31-36` (mata M12, `lib/entrega.ts:12`) | Acrescentar o caso negativo de `c2`: equipe em que nenhuma cadeira é liderada direto pela Chefia (por exemplo `m2.on '0\|20\|21'`, `m2.p21.lider '-'`, `m2.p22.lider '20'`) deve dar `c2 === false`. |
| G3 | Média | `plataforma/tests/rotinas.test.ts:25-33` (mata M18 e M31, `lib/rotinas.ts:36,92`) | Testar o convocador/topo com área em que o coordenador não é a 1ª cadeira (por exemplo, `m2.p8.lider '9'` e `m2.p9.lider '0'`: a cadeira 8 passa a ser liderada pela 9, então o topo de Comunicação deixa de ser a cadeira 7), em `gerarRotinas` (`convoca`) e em `rotinasEntreAreas` (`participantes`). |
| G4 | Média-baixa | `plataforma/tests/rotinas.test.ts:129-137` (mata M48, `lib/rotinas.ts:111`) | Criar 2 pares em sequência e afirmar ids distintos (`x1`, `x2`); remover um mantém o outro. |
| G5 | Baixa | `plataforma/tests/legado-m2.test.ts:102-110` (mata M37, `public/legacy/m2.js:96`) | Resumo com `nome_cargo` contendo `<b>&` e afirmar `&lt;b&gt;&amp;` (o nome do cargo é texto livre do usuário). |
| G6 | Baixa | `plataforma/tests/cadeiras.test.ts` (mata M35, `lib/cadeiras.ts:65`) | T-21: afirmar `coordsDe(mandatoAntigo)` com as 6 áreas inferidas (hoje só o e2e cobre). |
| G7 | Baixa | `plataforma/e2e/escalacao.spec.ts:7-15` | AC1: afirmar as 6 áreas desmarcadas e a Chefia marcada e desabilitada ao abrir; AC10: temático 2 e etapas 1 e 3 sem "bandeira". |
| G8 | Baixa | `plataforma/e2e/organograma.spec.ts:106-113` | AC3: caso de sucesso, trocar a liderança no painel e ver a aresta/caixa mudar de lugar; acrescentar um teste que preencha especificidades, habilidades e repertório (MEQ-09 AC1). |
| G9 | Baixa | `plataforma/e2e/rotinas.spec.ts:19-25` | AC5: afirmar o escopo listado por pessoa (ramo positivo); AC4: medir <300 ms no recálculo das rotinas. |
| G10 | Baixa | `plataforma/e2e/escalacao.spec.ts`, `e2e/rotinas.spec.ts` | 360 px na Tarefa 1 e nas Rotinas (spec: "tela de 360 px não rola na horizontal"); estabilizar `rotinas.spec.ts:155` (A5). |
| G11 | Info | `plataforma/lib/rotinas.ts:33` (A2) | Decidir com a Legisla se cadeira em área não marcada gera reunião; registrar na spec. |

---

## Fora do escopo (Fase 7)

Não implementado, fora do escopo desta entrega (adiado a pedido do usuário; não conta como falha):

- MEQ-12, arrastar caixa para ligar (T37, E-16)
- MEQ-13, mover só a cadeira com Ctrl (T38, E-17)
- MEQ-14, recolher subárvore e desfazer remoção em 10 s (T39, T40, E-18)
- MEQ-15, visão por área ("Visão por área", T41, E-19). O filtro por área, que é P1, está implementado e coberto.

---

## Code Quality

| Princípio | Status |
| --------- | ------ |
| Sem recursos além do pedido | ✅ |
| Sem abstração de uso único | ✅ |
| Só arquivos necessários | ✅ (nenhum arquivo do usuário alterado nos commits da feature; `novos.js` não consta no diff) |
| Segue os padrões do projeto | ✅ |
| Valor asserido bate com a spec | ⚠️ (G2: `c2` não discrimina) |
| Cobertura por camada: lógica 1:1 com ACs; ilhas com caminho feliz + borda + erro | ⚠️ (G1 a G4 em lógica; G7 a G10 em ilhas) |
| Todo teste mapeia a um AC, edge case ou Done-when | ✅ (os testes citam MEQ/T/E no título) |
| Diretrizes documentadas | `plataforma/CLAUDE.md`, `plataforma/AGENTS.md`, AD-003 e AD-004 (`.specs/STATE.md`): seguidas |

---

## Requirement Traceability Update (sugestão, spec.md não foi editada)

| Requisito | Status sugerido |
| --------- | --------------- |
| MEQ-01..07, 09..11, 15 (filtro), 16..22, 24 | ✅ Verified |
| MEQ-08 | ❌ Needs Fix (G1) |
| MEQ-23 | ⚠️ Verified com ressalva (G2) |
| MEQ-12, 13, 14, 15 (visão por área) | Deferred (Fase 7) |

---

## Summary

**Overall**: ✅ Ready (iteração 2: PASS)

**Spec-anchored check**: 0 ACs sem evidência; os 2 ACs com problema de conteúdo da iteração 1 (P1 nomear AC5 em caso encadeado, P2 entrega AC5) foram resolvidos por G1 e G2; 7 ACs parciais de baixa gravidade; 6 lacunas de precisão da spec.
**Sensor**: M12, M18, M31, M37, M48 e o mutante que desfaz G1 mortos; 3 equivalentes; M35, M43 e M52 sem bloqueio.
**Gate**: 107 unitários nos 9 arquivos da feature, e2e 68 (após reexecução por falhas de infraestrutura), `tsc` limpo.

**What works**: assistente de 3 etapas, limites 1 a 40, ciclo, repasse de liderança em remoção simples e encadeada, rotinas geradas, cadeia, entre áreas (arquivar e restaurar), entrega e PNG, migração do mandato antigo com `m2.areas` preservada, contadores do Guia e do painel da Legisla.

**Issues found**: G6 a G11 (baixa gravidade) e O1 (baixa, preexistente); nenhum bloqueia.

**Next steps**: opcional, G6 a G10 (testes de baixa gravidade) e decidir G11 com a Legisla; Fase 7 (MEQ-12 a 15) segue adiada de propósito.

---

## validate_state.py

Comando (da raiz do git): `python .claude/skills/tlc-spec-driven/scripts/validate_state.py missao2-equipe`

```
validate_state: 0 error(s) across [missao2-equipe]
exit=0
```

