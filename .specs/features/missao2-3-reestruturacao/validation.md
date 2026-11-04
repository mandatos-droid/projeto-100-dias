# Missões 2 e 3 · Reestruturação: Validation

**Veredito**: PASS
**Date**: 2026-11-03
**Spec**: `.specs/features/missao2-3-reestruturacao/spec.md`
**Diff range**: `19cef43..HEAD` (HEAD = `bb8fac1`; 29 commits, T1 a T29 + T27A), escopo `plataforma/` e `.specs/`. `graphify-out/` ignorado.
**Verifier**: sub-agente independente (autor ≠ verifier). Nenhum código nem teste foi alterado na árvore real.

Resumo: todos os critérios de aceite têm teste com asserção sobre o valor definido na spec; 23 mutações comportamentais injetadas em worktree temporário, 22 mortas e 1 sobrevivente com justificativa (guarda redundante, mutação irmã morta); gates verdes.

---

## Task Completion

T1 a T29 e T27A estão marcadas ✅ em `tasks.md` (158 marcas `[x]`, 0 `[ ]`). A tabela de rastreabilidade da spec está toda em Done. O cabeçalho de `tasks.md` ainda diz "Status: Draft" (linha 13): inconsistência cosmética, não afeta o veredito.

---

## Spec-Anchored Acceptance Criteria

Convenção de caminhos: `T:` = `plataforma/tests/`, `E:` = `plataforma/e2e/`.

### M2 · Tabela de equipe em ordem (RM2-01 a 11)

| Critério | Resultado definido na spec | `file:linha` + asserção | Coberto |
| --- | --- | --- | --- |
| 1 Guia + passo a passo numerado | Texto "Ao invés de encaixar pessoas em cargos…" e lista numerada | `T:legado-m2.test.ts:40` `f.intro.includes('Ao invés de encaixar…')`, `h.match(/<ol class="passos-m2">/g)?.length === 1`, 8 `<li>`, ordem dos 8 passos; `:31` ilhas `equipe-tabela` antes de `organograma` | Sim |
| 2 Missão 1 preenchida marca o passo | Marcado com link; senão só link, sem bloquear | `T:legado-m2.test.ts:54` `feito.includes('<li class="passo-feito">')`, `href="#/m/1"` nos dois estados, `passo-feito === (estado==='andamento')` | Sim (sinal de "feito" não precisado: lacuna de precisão menor) |
| 3 Tabela vazia pede N (1 a 40) antes das linhas | Pergunta literal; nenhuma linha | `E:m23-tabela.spec.ts:23` `getByText(PERGUNTA)` visível, `locator('[data-linha]')` count 0; `:30` `#avisos` contém "Informe de 1 a 40 pessoas." para 0 e 41, `m2.n` undefined; unit `T:tabelaEquipe.test.ts:110` `r.patch deepEqual {}` e `erro` string para 0, 41, 2.5, -1, NaN, texto, vazio | Sim |
| 4 N cria N linhas; aumentar cria; diminuir remove só vazias, confirma as preenchidas | N linhas; confirmação para preenchidas | `T:tabelaEquipe.test.ts:124` `ativas(c) deepEqual [0,20,21,22]`; `:154` diminuir sem `confirma`; `:171` `confirma` ordenado `['Bia','Caio']`, `remove [20,21]`; `E:m23-tabela.spec.ts:39` `'0 de 4 linhas completas'`; `:47` diálogo contém "Linha 3", recusar mantém 4 linhas e `m2.n` `'4'` | Sim |
| 5 Coluna N só com N-1 preenchida, legenda "Preencha antes: <coluna>" | Ordem escopo→competências→cargo→pessoa→categoria→área | `T:tabelaEquipe.test.ts:15` `COLUNAS ids deepEqual ['esc','comp','cargo','pessoa','cat','area']`; `:43` `colunaLiberada → {ok:false, falta:'Escopo'}`; `E:m23-tabela.spec.ts:69` `Competências…` `toBeDisabled()`, legenda `'Preencha antes: Escopo'` | Sim |
| 6 Esvaziar anterior trava as seguintes sem apagar e avisa | Valores guardados; aviso | `T:tabelaEquipe.test.ts:60` `colunaLiberada(x,'area') → {ok:false,falta:'Escopo'}`, `x.comp === 'Liderança'`, JSON do mandato inalterado; `E:m23-tabela.spec.ts:80` cargo `toBeDisabled()` e `toHaveValue('Assessora de imprensa')`, `m2.p21.comp === 'Criatividade'`, legenda "Preencha antes: Escopo" | Sim. Lacuna de precisão: "avisar" não define a mensagem; vale a legenda por coluna |
| 7 `*` = processo seletivo + incentivo à diversidade | Texto do Guia | `T:tabelaEquipe.test.ts:76` `x.processoSeletivo === true`, categoria liberada; `E:m23-tabela.spec.ts:93` texto "Caso não haja pessoas que se encaixem… representatividade dentro da equipe!" visível só após `*`, "Processo seletivo a abrir" | Sim |
| 8 Nome libera categoria e depois área | Categorias D4 | `T:tabelaEquipe.test.ts:51` `colunaLiberada(sem,'cat') → {falta:'Nome da pessoa'}`; `:20` `CATEGORIAS deepEqual ['Chefia','Coordenação','Especialista','Executora']`; `E:m23-tabela.spec.ts:104` opções `['Selecione','Chefia','Coordenação','Especialista','Executora']` | Sim |
| 9 Linha na última coluna = completa; "X de N linhas completas" | `'1 de 4 linhas completas'` | `T:tabelaEquipe.test.ts:94` `contagemCompletas → {completas:1,total:3}`; `E:m23-tabela.spec.ts:118` `[data-contador]` `'1 de 4 linhas completas'`; `T:legado-m2.test.ts:124` `'Em andamento · 2 de 3 linhas completas'` | Sim |
| 10 Autosave | Grava a cada edição | `E:m23-tabela.spec.ts:135` sem botão salvar, `m2.p1.esc` gravado, volta após `reload` | Sim |
| 11 Celular: cartão vertical, mesma ordem | `display:block`, 6 rótulos em ordem, 1 só coluna | `E:m23-tabela.spec.ts:154` `toHaveCSS('display','block')`, `data-label` em ordem, `new Set(xs).size === 1`, `new Set(ys).size === 6` | Sim |

### M2 · Organograma gerado (RM2-30 a 38)

| Critério | Resultado definido na spec | `file:linha` + asserção | Coberto |
| --- | --- | --- | --- |
| 1 Gera com ≥1 linha cargo+categoria+área | Gera sozinho | `T:tabelaEquipe.test.ts:439` `organogramaGerado` false sem área, true com cargo+cat+coord; `E:m23-organograma.spec.ts:103` mensagem "O organograma aparece sozinho…" e `.es-no` count 0 | Sim |
| 2 Chefia topo; Coordenação abaixo; Especialista/Executora sob a Coordenação da área (D8) | 3 níveis | `T:tabelaEquipe.test.ts:228` `m2.p1.lider '-'`, `p21.lider '0'`, `p22.lider '20'`, `p25.lider '23'`; `E:m23-organograma.spec.ts:27` `yChefia<yCoord<yExec1`, `yExec1===yExec2`, arestas `0-20`, `20-21`, `20-22` (count 3) | Sim |
| 3 Área sem Coordenação liga à Chefia e avisa | "Área sem coordenação" | `T:tabelaEquipe.test.ts:238` `p22.lider '0'`, aviso contém "Área sem coordenação"; `E:m23-organograma.spec.ts:39` aviso "Área sem coordenação: Legislativo", arestas `0-21`, `0-22` | Sim |
| 4 Sem Chefia: sem raiz e "Defina a chefia" | Aviso literal | `T:tabelaEquipe.test.ts:251` `avisosOrg` inclui `'Defina a chefia'`, Coordenação `lider '-'`; `E:m23-organograma.spec.ts:47` aviso visível | Sim |
| 5 Várias Chefias lado a lado + aviso | Aviso; mesmo nível | `T:tabelaEquipe.test.ts:258` contém "Mais de uma chefia" e não "Defina a chefia"; `E:m23-organograma.spec.ts:255` `Math.round(topo(0)) === Math.round(topo(20))` | Sim |
| 6 Editar célula atualiza na hora | Atualização imediata | `T:tabelaEquipe.test.ts:270` `editaCelula` recalcula `lider` no mesmo patch; `E:m23-organograma.spec.ts:59` caixa contém "Caio Reis Filho", depois "Processo seletivo" | Sim |
| 7 Caixa só com pessoa/cargo/área; clique leva à linha; sem painel profundo | Sem painel | `E:m23-organograma.spec.ts:70` contém pessoa/cargo/área, sem `img`, `complementary` count 0, sem "Acrescentar cadeira"; `:284` `document.activeElement.id === 'es-tab-22-esc'` | Sim |
| 8 Manter exportar e imprimir | Exportar PNG; impressão pelo PDF | `E:m23-organograma.spec.ts:119` arquivo `organograma-do-mandato.png`, assinatura PNG `89504e470d0a1a0a`; impressão: `E:m23-pdf.spec.ts:39` | Sim. Lacuna de precisão: a tela antiga já só exportava; "imprimir" não define botão próprio. Vale o PDF (D9) |
| 9 Missão 5 lê a liderança da mesma regra | Coordenação da área ou Chefia | `T:tabelaEquipe.test.ts:305` `liderDe(c,21)===20`, `liderDe(c,20)===0`, `liderDe(c,0)===null`; `E:m23-migracao.spec.ts:91` Bia dá feedback a 2 pessoas, Ana a 1 (`Feedback.tsx`, `feedback.ts`, `cadeiras.ts` sem diff) | Sim |

### M2 · Rotinas pelo quadro (RM2-50 a 58)

| Critério | Resultado definido na spec | `file:linha` + asserção | Coberto |
| --- | --- | --- | --- |
| 1 Objetivo, importância, quadro, linha de início | 5 linhas literais da spec | `T:quadroRotinas.test.ts:10` `MODELO` com os 5 `[titulo,freq,quem,dur]` idênticos aos da spec; `T:legado-m2.test.ts:71` ordem Objetivo → Importância → texto → `quadro-rotinas` → `pdf-org-rotinas`; `E:m23-rotinas.spec.ts:18` 5 `[data-rotina]`, `columnheader 'Quando o mandato iniciará a rotina?'`, valores dos campos | Sim ("linha" da spec é coluna na UI: nota) |
| 2 Concordar: data e horário e "agendada" | "N de 5 agendadas" | `T:quadroRotinas.test.ts:74` `agendadas → {n:5,total:5}`, `concluida===true`; `:66` data sem hora não conta; `E:m23-rotinas.spec.ts:32` `'k de 5 agendadas'` a cada rotina | Sim |
| 3 Discordar: editar freq/quem/dur e ligar/desligar (D7) | Edição guardada | `T:quadroRotinas.test.ts:27` só a 1ª muda; `:55` `on` `[true,true,true,false,true]`; `E:m23-rotinas.spec.ts:49` `m2.rq === {plan:{dur:'2 períodos de 4h'}}` após reload; `:60` vazio volta ao modelo | Sim |
| 4 Data passada avisa sem bloquear | Aviso; conta como agendada | `T:quadroRotinas.test.ts:112` `dataPassada('2030-06-14')` true, hoje false; `:121` `agendadas(c).n === 1`; `E:m23-rotinas.spec.ts:72` "Essa data já passou. Você pode mantê-la, é só um aviso." e `'1 de 5 agendadas'` | Sim |
| 5 Guarda por mandato; sem edição vale o modelo | `lerQuadro({})` = modelo, tudo ligado | `T:quadroRotinas.test.ts:21` `[id,freq,quem,dur,on]` = modelo com `true`; `:43` JSON relido | Sim |
| 6 Reunião de distribuição lista áreas | Áreas do mandato | `T:quadroRotinas.test.ts:151` `areasDoMandato deepEqual ['Comunicação','Legislativo','Logística']`; `E:m23-rotinas.spec.ts:96` `'Áreas do mandato: Legislativo, Comunicação'` só na linha `area` | Sim |
| 7 Conclui quando as ligadas têm data e hora, com confirmação | Indicador + confirmação | `T:quadroRotinas.test.ts:81` desligar a 5ª → `{n:4,total:4}`, `concluida===true`; `:97` sem ligadas não conclui; `E:m23-rotinas.spec.ts:82` `[data-concluida]` "Você já pode marcar o exercício como concluído" | Sim |
| 8 Botão do PDF abaixo do quadro | Ordem | `T:legado-m2.test.ts:71` `quadro-rotinas` antes de `pdf-org-rotinas` | Sim |
| Checklist sugerido (RM2-57) | c1/c2/c3 pelo novo desenho | `T:entrega.test.ts` `c1` falso com escopo vazio/espaços, `c2` falso sem Chefia, `c3` com todas agendadas; `E:m23-checklist.spec.ts:16` só "Marcar como pronto" grava `m2.c1` | Sim |

### M2 · Rotinas no planejamento e PDF (RM2-60 a 64)

| Critério | Resultado definido na spec | `file:linha` + asserção | Coberto |
| --- | --- | --- | --- |
| 1 Seção "Rotinas do mandato" no fim da aba | Ligadas, freq, quem, dur, início | `E:m23-plano.spec.ts:92` seção abaixo da árvore (`y` maior), 4 linhas (mensal desligada), `'04/03/2030 às 09:00'`, `50 min`, `'início ainda não definido'`; `T:exporta.test.ts:59` 5 linhas e 5 cabeçalhos | Sim |
| 2 PDF: só organograma (pág. 1) + quadro, via impressão | Seções `['organograma','rotinas']`, resto oculto | `E:m23-pdf.spec.ts:39` `f.secoes deepEqual ['organograma','rotinas']`, `f.pdf==='block'`, `f.outros.every(d=>d==='none')`, `f.quebra==='page'`, `f.svgs===1`; `:166` `window.print` 1 vez e `imprimindo-org` limpo; `E:m23-plano.spec.ts:122` botão da seção chama impressão com `[['organograma','rotinas']]` | Sim |
| 3 Sem organograma: só rotinas + aviso | `secoes ['rotinas']` | `E:m23-pdf.spec.ts:70` `f.secoes deepEqual ['rotinas']`, `svgs 0`, `#avisos` "O organograma ainda não existe" | Sim |
| 4 Sem início: "início ainda não definido" + link Missão 2 | Link para `#/m/2/m2.gestao` | `E:m23-plano.spec.ts:109` `[data-sem-inicio]` "Início ainda não definido", `href '#/m/2/m2.gestao'`, 5 células "início ainda não definido"; `T:exporta.test.ts:66` 4 ocorrências com 1 definida | Sim |
| 5 Seção entra ao imprimir o planejamento completo | Dentro de `.rm-plano[data-imprime]`, botões ocultos | `E:m23-plano.spec.ts:134` `dentro===true`, `tabela===true`, `botao===false` | Sim |

### M3 · Preditores com justificativa (RM3-01 a 07)

| Critério | Resultado definido na spec | `file:linha` + asserção | Coberto |
| --- | --- | --- | --- |
| 1 5 caixas + texto "Atenção!…" | Literal | `E:m23-preditores.spec.ts:12` `[data-preditor]` count 5, texto "Atenção! Sua escolha deve considerar…" visível, nenhum textbox antes de escolher | Sim |
| 2 Selecionar abre "Este preditor foi escolhido pois…" | Literal | `E:m23-preditores.spec.ts:19` | Sim |
| 3 Com 3 escolhidos, os 2 restantes abrem "não foi escolhido pois…" | Literal | `E:m23-preditores.spec.ts:27` p4 e p5 | Sim |
| 4 4º preditor recusado dizendo qual desmarcar | Aviso com nomes | `E:m23-preditores.spec.ts:33` `#avisos` "Escolha até 3 preditores. Desmarque um deles (Priorizar a agenda, Pautar os debates, Construir o partido)"; `D.preditores` segue `['p1','p2','p3']` | Sim |
| 5 Trocar seleção preserva justificativas e ajusta rótulo | Texto mantido | `E:m23-preditores.spec.ts:40` `caixa(p3) toHaveValue('Porque o partido precisa crescer')`, rótulo "não foi escolhido"; `T:estrategia.test.ts:48` `lerJustificativa(c,'p4') === 'porque sim '` | Sim |
| 6 Conclui com 3 + 5 justificativas; "faltam N" sem bloquear | Indicador | `T:estrategia.test.ts:64` `passoPreditoresConcluido` true só com 3 escolhidos, estratégia e 5 justificativas; `:58` `faltamJustificativas({})===5`; `E:m23-preditores.spec.ts:54` "faltam 5 justificativas" → "faltam 4", troca de seleção não bloqueada; `T:legado-m3.test.ts:295` `temConteudo` coerente | Sim |
| 7 Texto do Guia mantido | Frases do Guia visíveis | `E:m23-preditores.spec.ts:76` três frases do Guia na tela real; `T:legado-m3.test.ts:40` hash do texto da M3 só muda no termo | Sim |

### M3 · Estratégia A/B/C, árvore inalterada (RM3-10 a 18)

| Critério | Resultado definido na spec | `file:linha` + asserção | Coberto |
| --- | --- | --- | --- |
| 1 Explica, 5 exemplos e 3 opções | Textos literais | `E:m23-estrategia.spec.ts:17` título "O que é Objetivo Estratégico", 5 linhas `table.tb`, textos de A/B/C literais, nenhum rádio marcado | Sim |
| 2 Exatamente 1 opção ativa | 1 rádio marcado | `E:m23-estrategia.spec.ts:28` `input[type=radio]:checked` count 1 para b, c, a; `m3.est === e` | Sim |
| 3 A: nome do preditor, sem campo de texto | Nome | `T:estrategia.test.ts:9` `textoObjetivo({obj:'Minha frase'},'p1','a') === 'Priorizar a agenda'`; `T:plano.test.ts:138` textos de A; `E:m23-estrategia.spec.ts:39` `getByRole('textbox')` count 0, nó contém nome e não "Minha frase" | Sim |
| 4 B: campo por preditor escolhido com nome visível; fecha com 3 frases | Frase por preditor | `T:estrategia.test.ts:13` frase aparada ou nome se vazia; `:70` B com 2 frases → false, com 3 → true; `E:m23-estrategia.spec.ts:48` 3 `[data-frase]`, "Objetivo Estratégico de Priorizar a agenda", `m3.obj.p1 === 'Foco em três temas'` | Sim |
| 5 C: 3 frases da Legisla como referência, sem campo | Lista literal | `T:estrategia.test.ts:19` `OBJETIVOS_LEGISLA deepEqual [3 frases]`; `E:m23-estrategia.spec.ts:62` nota `listitem` = as 3 frases, textbox count 0, 4 itens na árvore | Sim |
| 6 Árvore idêntica nas 3 opções; metas intactas | Mesmos pid, ordem, metas | `T:plano.test.ts:148` `estrutura(b) deepEqual estrutura(a)`, `estrutura(c) deepEqual estrutura(a)`, pids `['p3','p1','p2']`; `:156` `JSON.stringify([metas,preditores])` igual após ler em a,b,c,b,a; `E:m23-estrategia.spec.ts:100` estrutura igual, `JSON.stringify(dadoDe('metas')) === metasAntes`, nó com 2 metas; `E:m23-plano.spec.ts:43` nós `['legado','obj-p1','meta-0','obj-p2','obj-p3','meta-1']` e iguais em a/b/c | Sim |
| 7 Trocar pede confirmação e guarda o texto anterior | Confirmação; `m3.obj` preservado | `T:estrategia.test.ts:24` `defineEstrategia → {'m3.est':'a'}`, `m3.obj.p1` mantido; `E:m23-estrategia.spec.ts:73` diálogo contém "Trocar a estratégia", recusar mantém `b`, aceitar grava `a` e mantém `m3.obj.p1`; B reabre com a frase | Sim |
| 8 Estratégia e justificativas no Resumo e no Planejamento | Resumo A/B/C; bloco no plano | `T:legado-m3.test.ts:341` `h.includes('Estratégia: <strong>A</strong>')`, 5 `<li><strong>`; `:358` lista C; `E:m23-plano.spec.ts:13` "Estratégia dos objetivos: A", 5 `li`, bloco acima da árvore | Sim |

### Terminologia (RM3-40 a 44)

| Critério | Resultado definido na spec | `file:linha` + asserção | Coberto |
| --- | --- | --- | --- |
| 1 UI mostra "Objetivo Estratégico" | Troca nas telas | `T:varredura-termos.test.ts:41` `infratores(lista) deepEqual []` em `app`, `ilhas`, `lib`, `public/legacy` (>50 arquivos); `T:smart.test.ts:126` dica R; `T:plano.test.ts:163` motivo `/objetivo estratégico/` | Sim |
| 2 Guia por override (AD-003), `.docx` com a Alana | `m3.js` troca em M3 e M5 | `T:legado-m3.test.ts:40` hash M3 = `4139450e…`; `:46` hash M5 = `1a032f6a…`; `:52` `doesNotMatch(/objetivos?\s+espec/i)` após a carga | Sim |
| 3 Chaves de dados e nomes internos mantidos | `m3.obj.{pid}`, `D.metas[].pred` | `T:estrategia.test.ts:24` `m3.obj.*` preservado; `T:termos.test.ts:41` HTML/entidades intactos; `OBJ_ESPECIFICOS` mantido em `lib/plano.ts` | Sim |
| 4 Varredura sem "objetivo específico" | Nenhum arquivo infrator | `T:varredura-termos.test.ts:41` e `:51` (os ignorados `conteudo.js`, `guia.js` existem) | Sim. Lacuna de precisão: a spec cita varredura de textos de UI; a feature varre o código-fonte, não a UI renderizada (a renderização do Guia é coberta pelo `doesNotMatch` do `m3.js`) |
| Conversão do texto | Plural, caixa, byte a byte | `T:termos.test.ts:5` `'Objetivo específico' → 'Objetivo estratégico'`, `:10`, `:14`, `:28` | Sim |

### Migração (RMX-01 a 04)

| Critério | Resultado definido na spec | `file:linha` + asserção | Coberto |
| --- | --- | --- | --- |
| 1 Sem `m3.est`: B se há `m3.obj.*`, senão A | B/A, sem perder texto | `T:estrategia.test.ts:40` `lerEstrategia({'m3.obj.p2':'frase'})==='b'`, `'  '`→`'a'`, `({},['p1'])==='a'`, `({},[])===null`; `T:plano.test.ts:144` `objetivos` sem `m3.est` usa a frase; `E:m23-migracao.spec.ts:57` B marcada, frases em `m3.obj` iguais, `m3.est` não gravado | Sim |
| 2 Equipe antiga vira linhas | escopo, cargo, pessoa, área, categoria derivada | `T:tabelaEquipe.test.ts:344` `categoriaPadrao` 0=Chefia, líder=Coordenação, resto=Executora; `:364` `[pessoa,cargo,esc,cat,area] deepEqual ['Bia','Coordenadora Legislativa',"CHIP_A; CHIP_B; Foco em saúde",'Coordenação','Legislativo']`; `:409` `materializa` grava `m2.n '3'`, `p3.lider '1'`; `E:m23-migracao.spec.ts:20` 20 pessoas, categorias Chefia/Coordenação/Executora | Sim |
| 2b Dados sem destino ficam guardados | Nenhuma chave perdida | `T:tabelaEquipe.test.ts:386` JSON idêntico e nenhuma chave `hab_/rep_/ritmo/rel/entrega/fb_` apagada; `E:m23-migracao.spec.ts:32` `c[k] === v` para cada chave do antigo (exceto o escopo reescrito em `esc`, que mantém o original) | Sim |
| 3 `m2.rotoff` e `m2.x` guardados e ignorados | Preservados | `E:m23-migracao.spec.ts:32` (as duas chaves em `ANTIGO_M2` voltam iguais); `T:layoutOrg.test.ts` `layoutOrg` só devolve arestas `hierarquia` com `m2.x` gravado | Sim. Ausência de rotinas entre áreas na tela nova não é asserida diretamente (RM2-37 cobre o organograma) |
| 4 Metas inalteradas | Idênticas | `E:m23-migracao.spec.ts:57` `dadoDe('metas') toEqual METAS`; `:68` árvore com as mesmas metas | Sim |

### Edge cases

| Edge case | `file:linha` + asserção | Coberto |
| --- | --- | --- |
| N menor que as preenchidas pede confirmação | `E:m23-tabela.spec.ts:47`; `T:tabelaEquipe.test.ts:171` | Sim |
| Mesmo nome em duas linhas avisa sem bloquear | `E:m23-tabela.spec.ts:125` "O mesmo nome aparece em mais de uma linha: Ana Souza" e `'2 de 4 linhas completas'` | Sim |
| Todas `*`: só cargos e áreas | `E:m23-organograma.spec.ts:109` 4 "Processo seletivo", cargo e área visíveis | Sim |
| Preditor desmarcado: justificativa guardada; metas "sem objetivo" | `E:m23-preditores.spec.ts:40`; `T:plano.test.ts:99` `semObjetivo` inclui "preditor que sumiu" | Sim |
| Planejamentos arquivados somente leitura | `E:m23-migracao.spec.ts:110` "somente leitura", `D.planos` inalterado, sem erro de página; `E:m23-plano.spec.ts:64`, `:148` | Sim |

**Status**: todos os critérios cobertos. Nenhum critério sem teste.

### Regra de payload/conjunção

Asserções verificadas por valor, não só pela ocorrência: patches (`m2.p22.lider === '0'`, `m2.rq` deepEqual `{plan:{dur:…}}`, `m3.est`, `m3.obj.p1`), listas (`ativas`, `confirma`, `remove`), textos literais da spec e estrutura da árvore. Critérios compostos (quadro de 5 linhas, 3 Objetivos da Legisla, 3 níveis do organograma) têm asserção em cada elemento do conjunto.

---

## Pontos de decisão do usuário (verificação ativa)

| Ponto | Evidência | Resultado |
| --- | --- | --- |
| (a) Árvore e metas não mudam; sem limite de 9 nem tipos de avanço | `git diff 19cef43..HEAD -- lib/plano.ts`: só `objetivos()` troca a origem do texto (`textoObjetivo`) e o motivo de `podeAcrescentarMeta` vira "objetivo estratégico"; `arvore()` e `contagemMetas` sem diff (`METAS_MAX = 16`, `plano.ts:30`); `lib/atingimento.ts` sem diff; `CartaoMeta.tsx` só mudou o rótulo (1 linha); `Metas.tsx`, `ArvorePlano.tsx`, `EditorPlano.tsx` só comentário/texto | Confirmado |
| (b) Nenhum "objetivo específico" visível | `T:varredura-termos.test.ts:41` verde; só `conteudo.js` e `guia.js` ignorados, cobertos pelo override em `m3.js` (`T:legado-m3.test.ts:52`) | Confirmado |
| (c) Arquivos sem diff | `git diff --stat 19cef43..HEAD` em `conteudo.js`, `guia.js`, `app.js`, `nucleo.js`, `resumo.js`, `novos.js`: vazio. Só `m2.js` e `m3.js` mudaram em `public/legacy` | Confirmado |
| (d) Mandato antigo não perde chave de `D.campos` | `T:tabelaEquipe.test.ts:386`, `:409`; `E:m23-migracao.spec.ts:32` | Confirmado |
| (e) Liderança direta e Feedback da M5 | `recalculaLideres` grava `m2.p{n}.lider`; `Feedback.tsx`, `feedback.ts`, `cadeiras.ts` sem diff leem `liderDe`; `E:m23-migracao.spec.ts:91`, `:100` | Confirmado |
| (f) PDF = organograma + rotinas em mídia print | `E:m23-pdf.spec.ts:39` (`emulateMedia print`, seções `['organograma','rotinas']`, resto `display:none`) | Confirmado |
| (g) Dados novos só em `D.campos` | Chaves novas: `m2.n`, `m2.p{n}.esc/comp/cat`, `m2.rq`, `m3.est`, `m3.just.{pid}`; busca no diff por escrita em `D.*` fora de `campos`: nenhuma (só `useState` local) | Confirmado |

---

## Discrimination Sensor

Escopo: worktree temporário a partir de `HEAD` (`git worktree add`), junction PowerShell para `node_modules` removida antes do `git worktree remove --force` (verificado: 43 entradas intactas em `plataforma/node_modules`). Cada mutação rodou só os testes unitários relevantes (`node --test tests/<arquivo>.test.ts`) e foi revertida em seguida. Linha de base no worktree: 101/101 verdes.

| # | Arquivo | Mutação | Resultado |
| --- | --- | --- | --- |
| 1 | `lib/tabelaEquipe.ts` `colunaLiberada` | Coluna anterior vazia deixa de travar a seguinte | Morta (4 falhas) |
| 2 | `lib/tabelaEquipe.ts` `recalculaLideres` | Executora/Especialista ligada à Chefia em vez da Coordenação | Morta (3) |
| 3a | `lib/tabelaEquipe.ts` `defineN` | Aceita 41 (`q > MAX_CADEIRAS + 1`) | Morta (1) |
| 3b | `lib/tabelaEquipe.ts` `defineN` | Nunca devolve `confirma` ao apagar linha preenchida | Morta (2) |
| 4 | `lib/estrategia.ts` `textoObjetivo` | A devolve a frase de `m3.obj` em vez do nome | Morta (3) |
| 5 | `lib/plano.ts` `objetivos()` | Conjunto de pids muda com a estratégia C | Morta (2) |
| 6 | `lib/quadroRotinas.ts` `agendadas`/`concluida` | Ignora a hora | Morta (1) |
| 7 | `lib/tabelaEquipe.ts` `categoriaPadrao` | Coordenação e Executora invertidas | Morta (5) |
| 8 | `lib/estrategia.ts` `lerEstrategia` | Mandato antigo com `m3.obj` assume A em vez de B | Morta (1) |
| 8b | `lib/estrategia.ts` `lerEstrategia` | Mandato antigo só com preditores assume B em vez de A | Morta (1) |
| 8c | `lib/estrategia.ts` `lerEstrategia` | `m3.est` válido é ignorado | Morta (3) |
| 9 | `lib/tabelaEquipe.ts` `editaCelula` | Não recalcula a liderança ao mudar categoria/área | Morta (2) |
| 10 | `lib/estrategia.ts` `defineEstrategia` | Apaga `m3.obj.p1` ao trocar | Morta (1) |
| 11 | `lib/exporta.ts` `quadroRotinasHtml` | Inclui rotina desligada | Morta (1) |
| 12 | `lib/quadroRotinas.ts` `dataPassada` | `<` vira `<=` (hoje conta como passado) | Morta (1) |
| 13 | `lib/tabelaEquipe.ts` `avisosOrg` | Remove "Defina a chefia" | Morta (1) |
| 14 | `lib/estrategia.ts` `faltamJustificativas` | Texto só de espaços conta como preenchido | Morta (1) |
| 15 | `lib/tabelaEquipe.ts` `migrada` | Ignora `m2.n` | Morta (7) |
| 16 | `lib/tabelaEquipe.ts` `materializa` | Sobrescreve categoria já gravada | Morta (1) |
| 17 | `lib/estrategia.ts` `passoPreditoresConcluido` | Ignora as 3 frases da opção B | Morta (1) |
| 18 | `lib/entrega.ts` `sugestaoChecklist` | c2 sem exigir Chefia | Morta (1) |
| 19 | `lib/termos.ts` `paraEstrategico` | Caixa alta vira "Estratégico" | Morta (1) |
| 20 | `lib/quadroRotinas.ts` `areasDoMandato` | Remove o filtro `cat !== 'Chefia'` | Sobrevivente, justificado |
| 20b | idem | Remove o filtro irmão `area !== 'Chefia de área'` | Morta (1) |

**Sobrevivente 20**: o filtro `cat !== 'Chefia'` é redundante com `area !== 'Chefia de área'`, porque a Chefia sempre carrega esse rótulo de área (padrão da cadeira 0). A mutação só muda o resultado se o usuário puser a Chefia em uma área real, caso fora da spec (D8 não prevê). A mutação irmã (20b) é morta, então o comportamento especificado está protegido. Sem tarefa de correção.

**Sensor depth**: ≥5 mutações manuais cobrindo todos os ramos de lógica nova (caminho de dados de mandato, então tratado como crítico). **Resultado**: 22/23 mortas, 1 sobrevivente justificado. PASS ✅.

**Isolamento**: `git status --porcelain` da árvore real é idêntico antes e depois do sensor (diff vazio). `git worktree list` não lista mais o worktree do sensor. Nenhum `git stash` usado.

---

## Code Quality

| Princípio | Status |
| --- | --- |
| Sem funcionalidade além do pedido (nada de 9 metas, tipos de avanço, PLL, agenda) | ✅ |
| Mudanças cirúrgicas (arquivos fora do escopo sem diff; `Feedback.tsx`, `feedback.ts`, `cadeiras.ts`, `atingimento.ts` intactos) | ✅ |
| Segue padrões (funções puras sobre `D.campos` com Patch, ilhas, overrides em `m2.js`/`m3.js`) | ✅ |
| Valores asseridos batem com a spec (tabelas acima) | ✅ |
| Todo teste mapeia a AC, edge case ou Done-when | ✅ (testes de segurança/escape citados como "segurança" nas tasks) |
| Diretrizes do projeto seguidas (`plataforma/CLAUDE.md`: imports `.ts`, `npm test`, `tsc`) | ✅ |
| Remoção de testes justificada | ✅ `foco.test.ts`, `e2e/entrega|escalacao|rotinas.spec.ts` saíram junto com as telas removidas (T27); `organograma.spec.ts` e `migracao.spec.ts` foram reescritos para a tabela |

Observação: o teste `T:legado-m3.test.ts:39` registra que o hash antigo passou a valer só para o `conteudo.js` cru e criou hashes novos pós-troca (RM3-42). Ajuste previsto na T2, declarado no comentário, sem enfraquecer a checagem (compara o JSON inteiro).

---

## Gate Check

| Comando | Resultado |
| --- | --- |
| `npm test` (em `plataforma/`) | exit 0; tests 497, pass 497, fail 0, skipped 0, cancelled 0 |
| `npx tsc --noEmit` | exit 0, sem erros |
| `npx playwright test e2e/m23-*.spec.ts e2e/rumo-preditores.spec.ts e2e/rumo-plano.spec.ts e2e/rumo-migracao.spec.ts e2e/migracao.spec.ts e2e/m5-feedback.spec.ts` | exit 0; 152 passed (3.0 min), 0 failed |

Suíte e2e completa não repetida por instrução (423/423 antes da T27). Aviso `Reparsing as ES module` do Node nos testes é anterior à feature e não afeta o resultado.

---

## Edge Cases (resumo)

- [x] Todos os 5 edge cases da spec têm teste (ver tabela acima).

---

## Fix Plans

Nenhum. Sem lacuna de cobertura e sem mutante sobrevivente injustificado.

---

## Lacunas de precisão da spec (não bloqueiam o PASS)

1. RM2-06: "SHALL avisar" ao esvaziar uma coluna não define mensagem. A feature usa a legenda por coluna "Preencha antes: <coluna>" e o texto de ajuda fixo; os testes cobrem a legenda.
2. RM2-02: "marcar o passo como feito" não define o sinal visual; o teste assere a classe `passo-feito` e o link.
3. RM2-38 (organograma, critério 8): "exportar e imprimir" não define a impressão do organograma isolado; o produto já só exportava PNG antes da feature e a impressão ficou no PDF do D9.
4. RM2-51 (critério 1): a spec fala em "linha 'Quando o mandato iniciará a rotina?'"; na UI é coluna/cabeçalho. O teste assere o cabeçalho.
5. RMX-03: "ignorá-los na tela nova" não define como provar a ausência; o teste prova a preservação das chaves e a ausência de arestas entre áreas.
6. RM3-44: "varredura dos textos de UI" não define se é código-fonte ou página renderizada; a feature varre o código-fonte e testa o override do Guia por hash e por `doesNotMatch`.
7. Cabeçalho de `tasks.md` (linha 13) ainda diz "Draft"; ajuste cosmético.

---

## Requirement Traceability Update

Todas as faixas (RM2-01, RM2-30, RM2-50, RM2-60, RM3-01, RM3-10, RM3-40, RMX-01) permanecem **Done** em `spec.md`; esta verificação as confirma como ✅ Verified.

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: todos os critérios das 7 histórias, da migração e dos 5 edge cases com teste e valor batendo com a spec; 7 lacunas de precisão da spec registradas, nenhuma bloqueante.
**Sensor**: 22/23 mutações mortas; 1 sobrevivente justificado (guarda redundante, irmã morta).
**Gate**: `npm test` 497/497, `tsc` limpo, e2e da feature 152/152.

**Lições**: PASS limpo, nenhuma lição registrada (o mutante sobrevivente é equivalente em dados válidos e não indica teste fraco).

**Next steps**: nenhuma ação de correção. Opcional: trocar "Draft" por "Done" no cabeçalho de `tasks.md`.
