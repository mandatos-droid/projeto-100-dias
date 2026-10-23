# Missão 3 · Defina o Rumo Validation

**Date**: 2026-10-23
**Spec**: `.specs/features/missao3-rumo/spec.md`
**Diff range**: `3f64f5d^..HEAD` (HEAD = `0c02186`). Os 24 commits `(rumo)` vão de `3f64f5d` a `0c02186`; o intervalo também contém 2 commits de outra feature (`01bd49a fix(equipe)`, `2e0d893 docs(equipe)`), que não foram avaliados aqui. 61 arquivos, +7156/-6 no intervalo.
**Verifier**: independent sub-agent (author ≠ verifier)

## Validation

**Result**: FAIL

Motivo: (1) o HEAD commitado não é autocontido (lacuna G1, bloqueante); (2) 3 mutantes sobreviventes (M28, M34, E4); (3) AC RUM-50.3 sem teste da fiação de tela. Nenhum AC falhou em comportamento: todos os 228 e2e e os 235 unit passam na árvore de trabalho.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 a T24 | ✅ Done | 24 de 24 títulos marcados ✅ em `tasks.md`; 24 commits `(rumo)` correspondentes |

---

## Gate Check

- **Árvore real** (`plataforma/`): `npx tsc --noEmit` exit 0. `npm test`: 235 tests, 235 pass, 0 fail, 0 skipped. `npm run test:e2e`: 228 passed, 0 failed, 0 skipped (7.7 min). `npm run build` não rodado (SecurityFatalError conhecido do Next 16.4).
- Uma primeira execução do e2e teve 8 falhas por `ENOENT` em `test-results/` (eu mesmo rodei `playwright test --list` durante a execução, o que limpa o diretório de saída). Reexecutada sem interferência: 228/228. Não é defeito do código.
- **HEAD limpo** (worktree de `0c02186`, sem os arquivos não commitados do usuário): `node --test` dá 6 arquivos de teste com falha (`criterios`, `espacos`, `plano`, `rumo` por `ERR_MODULE_NOT_FOUND: lib/bandeiras.ts`; `exporta` e `layoutOrg` só por faltar `node_modules` no worktree). Ver G1.
- Contagem antes da feature: não medida (sem baseline gravado); nenhum teste preexistente removido no diff (`git diff --stat` só mostra adições em testes de rumo; `legado-m2.test.ts` e `entrega/rotinas/cadeiras.test.ts` vêm do commit de Equipe `01bd49a`).

---

## Spec-Anchored Acceptance Criteria

Resultado: PASS = teste afirma o valor definido pela spec; GAP = sem teste da regra; PARCIAL = coberto com ressalva (ver coluna). U = unit em `plataforma/tests/`, E = e2e em `plataforma/e2e/`, código em `plataforma/lib|ilhas|public`.

### Bandeiras (RUM-01, 02, 03)

| AC | Resultado definido pela spec | Teste (`file:line`) | Código | Result |
| -- | ---------------------------- | ------------------- | ------ | ------ |
| 01.1 | selecionar abre card com Argumentos e nota por critério | `e2e/rumo-bandeiras.spec.ts:13-22` (chip pressed, card visível, 4 `.rm-nota`, `m3.mural === 'Educação'`) | `ilhas/rumo/Bandeiras.tsx` | PASS |
| 01.2 | grava na hora e atualiza total do card | `rumo-bandeiras.spec.ts:24-34` (`'8 pontos de 20'`, `m3.argumentos === 'Educação: Muita demanda...'`) | `lib/criterios.ts:15` | PASS |
| 01.3 | 4 critérios do Guia, próprios até 8, remover qualquer | U `criterios.test.ts:12,92,111`; E `rumo-bandeiras.spec.ts:119-141` (8 itens, 9º recusado, `'15 pontos de 15'`) | `criterios.ts:60,71` | PASS (M21 mata 9) |
| 01.4 | nota inteira 0..5, total = soma | U `criterios.test.ts:17,24,29` (`9`, nota 6/-1/2.5 não conta, `defineNota` recusa NaN) | `criterios.ts:12,15,22` | PASS |
| 01.5 | ≥2 com nota: ranking por total, 3 primeiras sugeridas | U `criterios.test.ts:43,50` (`['b','a','c']`, sugerida só com ≥2 e máx 3); E `rumo-bandeiras.spec.ts:51-68` | `criterios.ts:29` | PASS (M15, M30 mortos) |
| 02.6 | prioritária grava `m3.b1..b3` na ordem de confirmação | U `criterios.test.ts:60,77`; E `rumo-bandeiras.spec.ts:72-86` (`['Educação','Saúde','Cultura']`) | `criterios.ts:42` | PASS |
| 02.7 | quarta recusada dizendo qual desmarcar | U `criterios.test.ts:67` (erro cita ALFA/BETA/GAMA, /desmarque/); E `:82` | `criterios.ts:50-53` | PASS (M04 morto) |
| 02.8 (= 01.8 na spec) | remoção pede confirmação se há argumento/nota e sai das prioritárias | E `rumo-bandeiras.spec.ts:88-116` (dialog contém "Remover Saúde", `m3.b2` indefinido, sem diálogo quando vazia) | `Bandeiras.tsx` | PASS |
| 02.9 | importar do mural antigo, manter texto antigo | U `rumo.test.ts:9,18,107`; E `rumo-bandeiras.spec.ts:146-166` (`D.rumo` indefinido ao abrir; texto antigo mantido) | `rumo.ts:99,159` | PASS (M08, M09, M27 mortos) |
| 02.10 | espelho `m3.*` legível a cada edição | U `rumo.test.ts:67,86,98`; E `rumo-bandeiras.spec.ts:21,32-33` | `rumo.ts:209,233` | PASS (M20 morto) |

### Legado (RUM-10, 11, 12) e modelos (RUM-52)

| AC | Resultado definido pela spec | Teste | Código | Result |
| -- | ---------------------------- | ----- | ------ | ------ |
| 10.1 | 4 passos com marcador | E `rumo-legado.spec.ts:26-53` ("Passo 1 de 4 · Protagonista", `aria-current=step`) | `ilhas/rumo/Legado.tsx` | PASS |
| 10.2 (11.2) | cargo grava `m3.cargo` e entra na manchete | E `rumo-legado.spec.ts:56-73` (`m3.cargo === 'Reeleição a Deputado(a) Estadual'`, manchete literal) | `manchete.ts:31` | PASS |
| 10.3 | manchete composta pelos 4 elementos | U `manchete.test.ts:31,39,45,63`; E `rumo-legado.spec.ts:56` | `manchete.ts:31` | PASS |
| 10.4 | jornal atualiza em < 300 ms | E `rumo-legado.spec.ts:75-81` (`{timeout:300}`) | `Legado.tsx` | PASS |
| 10.5 | modelo preenche com lacunas editáveis | U `manchete.test.ts:104,118,126`; E `rumo-legado.spec.ts:222-265` | `manchete.ts:81,91` | PASS |
| 10.6 | texto manual vale; "Recompor" volta | E `rumo-legado.spec.ts:101-117` (`manual` true/false, texto preservado) | `Legado.tsx` | PASS |
| 11.7 | aviso "A manchete ainda não diz o cargo postulado" sem bloquear | U `manchete.test.ts:69,87` (texto exato); E `rumo-legado.spec.ts:119-125` (grava mesmo assim) | `manchete.ts:57,69` | PASS (M07 morto) |
| 11.8 | "Fechar a edição" grava `m3.legado`, marca feito, selo | E `rumo-legado.spec.ts:134-157` (`.rm-jn-carimbo` "Edição fechada", `feitos == {'m3.legado': true}`); U `legado-m3.test.ts:147` | `m3.js:57-60` | PASS |
| 11.9 | rascunhos de grupos, base, unificar | E `rumo-legado.spec.ts:267-345`; U `rumo.test.ts:161` | `rumo.ts:140` | PASS |
| 12.10 | jornal: nome editável, nome parlamentar, dezembro do último ano, manchete, linha fina, cargo | U `manchete.test.ts:134` (`'dezembro de 2030'` para posse 2027); E `rumo-jornal.spec.ts:12-46`, `rumo-legado.spec.ts:159` | `manchete.ts:101` | PASS (M14 morto) |
| 12.11 | textos do Guia intactos | U `legado-m3.test.ts:35,39,45` (hash `87baff53...`) | ver "Textos do Guia" abaixo | PASS |
| 52.1-52.4 | 4 modelos "sugestão da plataforma"; pré-preenche; rascunhos guardam grupo/manchete/cargo; base carrega | U `manchete.test.ts:104-133`; E `rumo-legado.spec.ts:222-345` | `manchete.ts:81-96` | PASS |

### Preditores (RUM-20, 21)

| AC | Resultado definido pela spec | Teste | Código | Result |
| -- | ---------------------------- | ----- | ------ | ------ |
| 20.1 | seleção abre campo com exemplo do Guia e nó na árvore | E `rumo-preditores.spec.ts:12-29` (placeholder = exemplo do Guia certo para p3/p4) | `plano.ts:18`, `Preditores.tsx` | PASS |
| 20.2 | vazio usa nome do preditor | U `plano.test.ts:19`; E `rumo-preditores.spec.ts:31-41` | `plano.ts:55` | PASS |
| 20.3 | quarto recusado, diz qual desmarcar | U `plano.test.ts:34`; E `rumo-preditores.spec.ts:57-63` (mensagem literal, `['p1','p2','p3']` inalterado) | `plano.ts:92` | PASS (M24 morto) |
| 21.4 | desmarcar com metas: confirma com contagem, metas ficam sem objetivo | U `plano.test.ts:48` (`afetadas 2`, nenhuma meta some); E `rumo-preditores.spec.ts:65-80` ("2 metas", `pred ''`) | `plano.ts:101` | PASS (M17 morto) |
| 20.5 | árvore com Legado no topo (manchete) | E `rumo-preditores.spec.ts:50-54` | `ArvorePlano.tsx` | PASS |
| 20.6 | objetivo grava `m3.obj.{pid}` | E `rumo-preditores.spec.ts:31-41` | `Preditores.tsx` | PASS |
| 21.7 | textos intactos (intro, nota, passos, tabela) | U `legado-m3.test.ts:35`; E `rumo-preditores.spec.ts:43-48` (tabela com 5 linhas) | hash | PASS |

### Metas (RUM-30, 31, 32)

| AC | Resultado definido pela spec | Teste | Código | Result |
| -- | ---------------------------- | ----- | ------ | ------ |
| 30.1 | exige escolher objetivo | U `plano.test.ts:71`; E `rumo-metas.spec.ts:23-31` | `plano.ts:76` | PASS |
| 30.2 | sem preditor: desabilita e aponta | U `plano.test.ts:65`; E `rumo-metas.spec.ts:16-21` | `plano.ts:78` | PASS |
| 31.3 | retorno SMART em ≤ 300 ms com acerto, falta, dica | U `smart.test.ts:15,33,43`; E `rumo-metas.spec.ts:70-94` | `smart.ts:36` | PARCIAL: nenhum teste mede 300 ms (o render é síncrono; ver G6) |
| 31.4 | M: número, % ou quantidade por extenso | U `smart.test.ts:60` | `smart.ts:28,43` | PASS |
| 31.5 | T: data, mês, "até", dias, mensalmente, frequência | U `smart.test.ts:68` | `smart.ts:29-33` | PARCIAL: "diário/diariamente" sem teste (M28 sobreviveu, G3) |
| 31.6 | S: infinitivo + ≥ 6 palavras | U `smart.test.ts:50` (5 palavras falha, 6 passa) | `smart.ts:42` | PASS (M19 morto) |
| 31.7 | R com objetivo vinculado | U `smart.test.ts:76`; E `rumo-metas.spec.ts:96-100` | `smart.ts:44` | PASS (M25 morto) |
| 31.8 | A só após confirmação | U `smart.test.ts:76`; E `rumo-metas.spec.ts:77-82` | `smart.ts:43` | PASS (M26 morto) |
| 31.9 | alerta "Meta não é tarefa diária" | U `smart.test.ts:87,95`; E `rumo-metas.spec.ts:102-108` | `smart.ts:34,52` | PASS (M29 morto) |
| 32.10 | responsável lista cadeiras ativas com nome, aceita texto livre | U `pessoas.test.ts:13,63`; E `rumo-metas.spec.ts:120-135` | `pessoas.ts:15` | PASS |
| 32.11 | 0 a 3 apoios | U `pessoas.test.ts:84`; E `rumo-metas.spec.ts:137-158` | `pessoas.ts:56-58` | PASS (M22 morto) |
| 32.12 | apoio = responsável é recusado | U `pessoas.test.ts:77` (mensagem /respons/, por cadeira e por nome com acento/caixa); E `rumo-metas.spec.ts:137-166` | `pessoas.ts:49-58` | PASS (M05, M32 mortos) |
| 32.13 | sem cadeiras: texto livre e aviso | U `pessoas.test.ts:28`; E `rumo-metas.spec.ts:168-176` | `pessoas.ts:15` | PASS |
| 30.14 | 10 a 16 verde, fora aviso, sem bloquear | U `plano.test.ts:89` (9/10/16/17); E `rumo-metas.spec.ts:188-206` | `plano.ts:86` | PASS (M16, M31, E1 mortos); "verde" verificado por classe CSS `ok`, não pela cor |
| 30.15 | quinta meta bloqueada com limite do Guia | U `plano.test.ts:78`; E `rumo-metas.spec.ts:33-45` | `plano.ts:80-81` | PASS (M03 morto) |
| 30.16 | introdução, passos e "Atenção" intactos | U `legado-m3.test.ts:35,45` | hash | PASS (ver observação G7) |

### Aba Planejamento (RUM-40, 41, 42) e Painel (RUM-43)

| AC | Resultado definido pela spec | Teste | Código | Result |
| -- | ---------------------------- | ----- | ------ | ------ |
| 40.1 | árvore Legado → objetivos → metas + total no topo | E `rumo-plano.spec.ts:28-45` (`'79%'`, `role=tree`) | `Plano.tsx`, `ArvorePlano.tsx` | PASS |
| 40.2 | vazio com atalho à Missão 3 | E `rumo-plano.spec.ts:88-93` (href `#/m/3/m3.preditores`), `rumo-painel.spec.ts:76` | `Plano.tsx` | PASS |
| 41.3 | status grava e recalcula em < 300 ms | E `rumo-plano.spec.ts:47-54` (`'90%'`/`'95%'` com `{timeout:300}`, `status === 'concluida'`) | `atingimento.ts` | PASS |
| 41.4 | 100, 70, 0, excluída | U `atingimento.test.ts:5,11` (`[100,70,0,null]`) | `atingimento.ts:4-15` | PASS (M01, M33 mortos) |
| 41.5 | média simples das não congeladas, arredondada | U `atingimento.test.ts:23` (`57` de 170/3; floor daria 56) | `atingimento.ts:17,20` | PASS (M02 morto) |
| 41.6 | total = média simples dos objetivos com meta ativa, arredondada | U `atingimento.test.ts:39` (`79` de 78,5; floor daria 78; `[57,null,100]` = 79) | `atingimento.ts:26` | PASS (M23 morto) |
| 41.7 | "—" sem metas ativas e fora do total | U `atingimento.test.ts:34,46`; E `rumo-plano.spec.ts:56-62` (`'—'`, total `'70%'`) | `atingimento.ts:20-22` | PASS |
| 40.8 | editar texto, objetivo, responsável, apoios, status, com retorno SMART | E `rumo-plano.spec.ts:136-156` (campos e espelho nos dois sentidos) | `CartaoMeta.tsx` (mesmo componente) | PARCIAL: o retorno SMART dentro da aba não é afirmado (G6) |
| 40.9 | acrescentar na aba com mesmas regras | E `rumo-plano.spec.ts:123-134` (4ª meta ok, 5ª recusada, `status nao_concluida`) | `plano.ts:76` | PASS |
| 40.10 | remover pede confirmação | E `rumo-plano.spec.ts:158-168` (dismiss mantém 2, accept deixa 1) | `Plano.tsx` | PASS |
| 42.11 | filtro por pessoa destaca/esmaece | E `rumo-plano.spec.ts:171-195` (`data-marca` destaque/esmaecido, inclui apoio e texto livre) | `Plano.tsx` | PASS |
| 41.12 | barra e contagem por status | E `rumo-plano.spec.ts:64-73` (`aria-valuenow 57`, contagens, `68` de 67,5) | `ArvorePlano.tsx` | PASS |
| 42.13 | Imprimir: impressão do navegador com árvore limpa | E `rumo-plano.spec.ts:197-215`, `rumo-migracao.spec.ts:218` | `Plano.tsx`, `rumo.css` | PASS |
| 42.14 | teclado (setas, Enter, Espaço) e rótulo por nó | E `rumo-plano.spec.ts:217-237`, `rumo-preditores.spec.ts:92-140` | `ArvorePlano.tsx` | PASS |
| 43.1 | Painel mostra resumo no lugar de "Últimos registros" | E `rumo-painel.spec.ts:19-30` (manchete, `79%`, barras 57/100, heading ausente) | `m3.js:114-129` | PASS (E2 morto) |
| 43.2 | sem plano: convite com botão | E `rumo-painel.spec.ts:68-74` | `PlanoResumo.tsx` | PASS |
| 43.3 | "Abrir o planejamento" vai a `#/plano` | E `rumo-painel.spec.ts:32-42` | `m3.js:88-98` | PASS |
| 43.4 | item no menu, ativo em `#/plano` | E `rumo-painel.spec.ts:32-52` (classe `on`, entre missões e "Apoio"); U `legado-m3.test.ts:191` | `m3.js:101-111` | PASS (E3 morto) |
| 43.5 | `Store.eventos` continua gravado | E `rumo-painel.spec.ts:96-100` (`Store.registrar` chega em `salvoDe.eventos`); `m3.js` não referencia `eventos` no código | `m3.js:71` (só comentário) | PASS |

### Espaços (RUM-50, 51)

| AC | Resultado definido pela spec | Teste | Código | Result |
| -- | ---------------------------- | ----- | ------ | ------ |
| 50.1 | tipos adequados a cargo e Casa | U `espacos.test.ts:22` (CPMI só federal/senado); E `rumo-espacos.spec.ts:47-54` | `espacos.ts:7-19` | PASS |
| 50.2 | Federal: comissões do catálogo `br.json` | U `espacos.test.ts:31`, `comissoes.test.ts:9,28`; E `rumo-espacos.spec.ts:11-26` | `espacos.ts:78` | PASS |
| 50.3 | Estadual com `{uf}.json`: sugere as da Assembleia | U `espacos.test.ts:56` (função com catálogo); nenhum e2e (não existe `{uf}.json`; E4 sobreviveu) | `ilhas/rumo/Espacos.tsx:37-41` | GAP: fiação da busca `{uf}.json` sem teste (G2) |
| 50.4 | Estadual sem catálogo: genéricas por bandeira + nome livre | U `espacos.test.ts:13,47,62`; E `rumo-espacos.spec.ts:35-45` | `espacos.ts:88-90` | PASS |
| 50.5 | bandeira prioritária destaca comissões | U `espacos.test.ts:31,42`; E `rumo-espacos.spec.ts:12-20` | `espacos.ts:81-86` | PASS |
| 51.6 | registro: comissão/espaço, papel, bandeira em `comissoesDesejadas` | E `rumo-espacos.spec.ts:11-20,35-45` (`objectContaining({comissao,papel:'Titular',cargo:'Titular',bandeira:'Educação'})`) | `Espacos.tsx` | PASS |
| 51.7 | alerta "Este espaço não conversa..." sem bloquear | U `espacos.test.ts:77,84,90`; E `rumo-espacos.spec.ts:65-79` | `espacos.ts:94` | PASS (M11 morto) |
| 51.8 | dica do Guia enquanto bandeira 1 sem espaço | U `espacos.test.ts:95,103`; E `rumo-espacos.spec.ts:81-98` | `espacos.ts:101` | PASS (M12 morto) |
| 51.9 | "No futuro" e campos antigos intactos | U `legado-m3.test.ts:45,119`, `espacos.test.ts:107`; E `rumo-espacos.spec.ts:101-126` | `m3.js:34-38` | PASS |

### Extras P3 (RUM-60)

| AC | Teste | Result |
| -- | ----- | ------ |
| 60.1 PNG da primeira página | E `rumo-extras.spec.ts:16-39` (assinatura `89504e47...`, `a-gazeta-do-mandato.png`, dimensões = 2x da caixa, bytes mudam com a manchete) | PASS |
| 60.2 ordenar menor para maior | E `rumo-extras.spec.ts:61-83` (`['obj-p3','obj-p1','obj-p2']`, "—" no fim, reordena ao mudar status) | PASS |

### Edge cases e migração (RUM-70)

| Edge case | Teste (`file:line`) | Result |
| --------- | ------------------- | ------ |
| sem `Store.mandato.cargo`: lista completa, não bloqueia | U `manchete.test.ts:22`; E `rumo-legado.spec.ts:91-99` | PASS |
| cadeira removida: nome gravado + "fora da equipe" | U `pessoas.test.ts:42,54`; E `rumo-metas.spec.ts:178-185` | PASS (M18 morto) |
| nome da cadeira muda: nome novo | U `pessoas.test.ts:33`; E `rumo-metas.spec.ts:178-185` | PASS |
| manchete > 280: aviso | U `manchete.test.ts:87` (281 avisa, 280 não); E `rumo-legado.spec.ts:127-132` | PASS (M13 morto) |
| duas abas editam a mesma meta: último salvamento | nenhum teste; comportamento herdado do `Store.salvar` do Guia, sem código novo | GAP informativo (G8) |
| HTML digitado vira texto | U `rumo.test.ts:128`, `smart.test.ts:111`; E `rumo-bandeiras.spec.ts:169-178`, `rumo-jornal.spec.ts:68`, `rumo-legado.spec.ts:189`, `rumo-metas.spec.ts:110` | PASS |
| `D.rumo`/`D.metas` antigo ou corrompido | U `rumo.test.ts:27,34,53,144,154`; `plano.test.ts:28`; E `rumo-migracao.spec.ts:26-103` | PASS |
| metas antigas sem status = Não concluída | U `atingimento.test.ts:18`, `rumo.test.ts:135`; E `rumo-plano.spec.ts:103-113` (abrir não grava, `toEqual` do original), `rumo-migracao.spec.ts:77` | PASS (M10 morto) |

### Verificações dirigidas

- **Textos do Guia intactos**: `git diff --stat 3f64f5d^..HEAD -- conteudo.js guia.js app.js nucleo.js resumo.js novos.js m2.js` devolve vazio (nenhum dos 7 foi alterado pelos commits). `git hash-object conteudo.js` = `477741e0...` = o blob de `3f64f5d^`. O hash de `legado-m3.test.ts:13` (`87baff53...`) recomputado sobre `3f64f5d^:conteudo.js` é idêntico ao do arquivo atual; o hash da Missão 3 inteira (`56d6bb25...`) também. Observação: `guia.js` e `novos.js` têm modificações NÃO commitadas do usuário na árvore; não vêm dos commits da feature.
- **Fórmula de atingimento**: ver 41.4 a 41.7; assertivas com valores que distinguem round de floor (57 e 79) e congelada de 0.
- **Limites**: 3 preditores (`plano.test.ts:34`), 3 bandeiras (`criterios.test.ts:67`), 4 metas por objetivo (`plano.test.ts:78`), 8 critérios (`criterios.test.ts:92`), 3 apoios (`pessoas.test.ts:84`), todos com mutante de limite morto.
- **Migração sem perda**: `rumo.test.ts:9,18,58,107`, `rumo-bandeiras.spec.ts:146-166`, `rumo-migracao.spec.ts:26-103`.
- **`Store.eventos`**: `m3.js` só cita `eventos` num comentário; nenhum `nucleo.js` alterado; `rumo-painel.spec.ts:96`.

---

## Discrimination Sensor

Scratch: `git worktree` detached em `0c02186`, fora do repositório, com `lib/bandeiras.ts`/`lib/recomenda.ts` copiados (não versionados) e `node_modules` copiado. Unit baseline no scratch: 235/235. Mutantes de tela rodaram contra um `next dev -p 3100` do próprio scratch (o `reuseExistingServer` da porta 3000 serviria a árvore real e daria falso "sobreviveu"; descartei essa primeira rodada). Worktree removido; `git status --porcelain` da árvore real idêntico ao inicial (181 linhas, `diff` vazio).

| Mutação | Arquivo | Descrição | Killed? |
| ------- | ------- | --------- | ------- |
| M01 | `lib/atingimento.ts:7` | congelada com pct 0 | ✅ (4 falhas) |
| M02 | `lib/atingimento.ts:17` | `Math.round` vira `Math.floor` | ✅ (2) |
| M03 | `lib/plano.ts:27` | 4 metas por objetivo vira 5 | ✅ (1) |
| M04 | `lib/criterios.ts:8` | 3 prioritárias vira 4 | ✅ (2) |
| M05 | `lib/pessoas.ts:58` | apoio igual ao responsável aceito | ✅ (1) |
| M06 | `lib/smart.ts:30` | regex de prazo `até` removida | ✅ (1) |
| M07 | `lib/manchete.ts:71` | cargo ausente sem aviso | ✅ (1) |
| M08 | `lib/rumo.ts:107` | migração descarta `m3.mural` | ✅ (4) |
| M09 | `lib/rumo.ts:164` | migração descarta `m3.argumentos` antigo | ✅ (1) |
| M10 | `lib/rumo.ts:196` | meta sem status vira concluída | ✅ (4) |
| M11 | `lib/espacos.ts:97` | alerta de espaço nunca aparece | ✅ (3) |
| M12 | `lib/espacos.ts:104` | dica da bandeira 1 nunca aparece | ✅ (1) |
| M13 | `lib/manchete.ts:72` | limite 280 vira `>=` | ✅ (1) |
| M14 | `lib/manchete.ts:103` | data da edição ano+4 | ✅ (1) |
| M15 | `lib/criterios.ts:31` | desempate invertido | ✅ (1) |
| M16 | `lib/plano.ts:28` | faixa mínima 10 vira 9 | ✅ (1) |
| M17 | `lib/plano.ts:104` | desmarcar preditor apaga texto das metas | ✅ (1) |
| M18 | `lib/pessoas.ts:46` | cadeira removida sem "fora da equipe" | ✅ (2) |
| M19 | `lib/smart.ts:42` | Específica com 5 palavras | ✅ (1) |
| M20 | `lib/rumo.ts:242` | espelho não apaga chave vazia | ✅ (1) |
| M21 | `lib/criterios.ts:7` | 8 critérios vira 9 | ✅ (1) |
| M22 | `lib/pessoas.ts:9` | 3 apoios vira 4 | ✅ (1) |
| M23 | `lib/atingimento.ts:28` | total conta objetivo nulo como 0 | ✅ (1) |
| M24 | `lib/plano.ts:95` | 4 preditores aceitos | ✅ (1) |
| M25 | `lib/smart.ts:45` | Relevante sempre atendida | ✅ (4) |
| M26 | `lib/smart.ts:44` | Alcançável sempre atendida | ✅ (4) |
| M27 | `lib/rumo.ts:165` | migração descarta `m3.criterios` antigo | ✅ (1) |
| M28 | `lib/smart.ts:32` | prazo "diário/diariamente" removido de T | ❌ SOBREVIVEU |
| M29 | `lib/smart.ts:34` | rotina "fazer reunião" removida | ✅ (1) |
| M30 | `lib/criterios.ts:32` | sugerida com 1 nota | ✅ (1) |
| M31 | `lib/plano.ts:29` | faixa máxima 16 vira 17 | ✅ (1) |
| M32 | `lib/pessoas.ts:50` | igualdade de nome sem normalizar acento | ✅ (1) |
| M33 | `lib/atingimento.ts:6` | concluída 70% vira 75 | ✅ (3) |
| M34 | `lib/rumo.ts:171` | bandeira duplicada em `D.rumo` não deduplica | ❌ SOBREVIVEU |
| E1 | `ilhas/rumo/Metas.tsx:24` | contador sempre verde | ✅ (e2e, 6 falhas) |
| E2 | `public/legacy/m3.js:123` | "Últimos registros" permanece no Painel | ✅ (e2e) |
| E3 | `public/legacy/m3.js:107` | href do menu `#/planos` | ✅ (e2e) |
| E4 | `ilhas/rumo/Espacos.tsx:37` | catálogo `{uf}.json` nunca carregado | ❌ SOBREVIVEU |

**Sensor depth**: ampliado (38 mutações, mais que as 8 pedidas; o escopo trata de integridade de dados).
**Result**: 35/38 mortos. FAIL: 3 sobreviventes viram tarefas (G2, G3, G4).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ (libs pequenas e puras; `lerRumo` é a única normalização) |
| Surgical changes | ✅ nos arquivos da feature: legado extraído intocado, `ponte.tsx` +16, `page.tsx` +/-1 linha, `m3.js` novo |
| No scope creep | ⚠️ passos bloqueados até completar o anterior no Legado e "Ignorar dica" vão além da spec (inofensivo) |
| Matches patterns | ✅ ilhas + `lib/` puro + ganchos em arquivo próprio (AD-003/AD-004) |
| Spec-anchored outcome (valores batem com a spec) | ✅ nenhum teste espelha a implementação; valores aritméticos distinguem round/floor |
| Domain 1:1 ACs; e2e happy+edge+error | ⚠️ exceto RUM-50.3 (G2) e SMART na aba (G6) |
| Todo teste mapeia a AC/edge | ✅ (nomes dos testes citam o RUM-xx) |
| Guidelines seguidas | `plataforma/CLAUDE.md` (imports `.ts`, `npm test`, `tsc`), AD-003, AD-004; `git add` nomeado |

---

## Fix Plans (lacunas ranqueadas)

1. **G1 (Blocker, entrega)**: o HEAD não é autocontido. `lib/rumo.ts:4`, `lib/espacos.ts:4` e `lib/criterios.ts` importam `./bandeiras.ts`, que está **não rastreado** (`?? plataforma/lib/bandeiras.ts`, trabalho do usuário da Missão 2). Num checkout limpo de `0c02186`, 4 arquivos de teste da feature (`criterios`, `espacos`, `plano`, `rumo`) quebram com `ERR_MODULE_NOT_FOUND`, e o build também. Evidência: `node --test` no worktree limpo (6 falhas; 2 delas só por `node_modules`). Fix: commitar `plataforma/lib/bandeiras.ts` (e conferir se algo mais não rastreado, como `Recomenda.tsx`/`recomenda.ts`, é necessário) antes de qualquer push/deploy; o usuário decide. Verify: worktree limpo + `npm test`.
2. **G2 (Major, AC RUM-50.3)**: a busca de `{uf}.json` para Deputado(a) Estadual não tem teste de tela. Mutante E4 sobreviveu. Fix: e2e que intercepta `**/data/comissoes/mg.json` com `page.route` e afirma que a comissão da Assembleia aparece destacada; ou um `mg.json` de teste. Where: `e2e/rumo-espacos.spec.ts`. Done when: E4 morre.
3. **G3 (Minor, AC RUM-31.5)**: "diário/diariamente" como prazo/frequência sem teste. M28 sobreviveu. Fix: acrescentar `'Realizar audiências diariamente'` (e variante "diária") na lista de T em `tests/smart.test.ts:69`, afirmando `T.ok === true`. Nota de precisão: a mesma palavra dispara o alerta de rotina; a spec não diz se "diariamente" deve contar como T.
4. **G4 (Minor, RUM-70)**: dedupe de bandeiras com `id` repetido em `D.rumo` corrompido sem teste (M34). Fix: caso em `tests/rumo.test.ts` com duas bandeiras de mesmo id, afirmando `length 1` e que a primeira vence.
5. **G5 (Housekeeping)**: `spec.md` e `design.md` estão não rastreados (`??`); só `tasks.md` foi commitado. A evidência desta validação referencia arquivos que não estão no histórico. O usuário decide commitar.
6. **G6 (Minor, RUM-31.3 e 40.8)**: nenhum teste mede os 300 ms do retorno SMART, e o retorno SMART dentro da aba `#/plano` não é afirmado (só o do exercício). Fix: `expect(letra).toHaveAttribute('data-ok','true',{timeout:300})` em `rumo-metas.spec.ts` e um caso em `rumo-plano.spec.ts` que preenche o texto no cartão da aba e confere `[data-letra]`.
7. **G7 (Observação, RUM-12.11/30.16)**: o hash de `legado-m3.test.ts:14-15` cobre `titulo..fecho` da missão e `id,t,d,intro,passos,fim` dos exercícios, mas não `itens`, `listaExtra`, `ct`, `prazo`. A igualdade byte a byte do arquivo foi provada aqui por `git hash-object`, mas o teste em si não trava essas chaves. Sugestão: incluir `JSON.stringify(m)` inteiro (hash `56d6bb25...`). Também: o placeholder `FORMULA_META.linha` (fórmula do Guia) deixou de aparecer na caixa da meta (`CartaoMeta.tsx:104` usa exemplo próprio); o texto segue em `conteudo.js`, só não é exibido ali. `#blocoMetasRef` já era um `div` vazio no original (`index (6).html:758`), então não é regressão.
8. **G8 (Informativo)**: edge "duas abas editam a mesma meta" sem teste; é comportamento herdado de `Store.salvar`, sem código novo.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| RUM-01, 02, 03, 10, 11, 12, 20, 21, 30, 32, 40, 41, 42, 43, 51, 52, 60, 70 | Pending | ✅ Verificado (com as ressalvas de G3, G4, G6) |
| RUM-31 | Pending | ⚠️ Verificado com lacunas menores (G3, G6) |
| RUM-50 | Pending | ❌ Needs Fix (50.3, G2) |

(`spec.md` não foi editado pelo Verifier.)

---

## Summary

**Overall**: ❌ Not Ready

**Spec-anchored check**: ACs verificados contra os valores da spec: nenhum FAIL de comportamento; 1 GAP (RUM-50.3), 3 PARCIAL (31.3, 31.5, 40.8).
**Sensor**: 35/38 mutações mortas (3 sobreviventes: M28, M34, E4).
**Gate**: tsc exit 0; unit 235 pass / 0 fail; e2e 228 pass / 0 fail.

**What works**: toda a lógica pura e a tela, na árvore de trabalho do usuário; textos do Guia byte a byte; fórmula de atingimento e limites com testes que discriminam; migração sem perda; `Store.eventos` intacto.

**Issues found**: G1 a G8 acima.

**Next steps**: orquestrador roteia G1 (decisão do usuário), G2, G3, G4, G6 como tarefas de correção e re-dispara o Verificador (iteração 2 de no máximo 3).
