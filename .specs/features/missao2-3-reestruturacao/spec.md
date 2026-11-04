# Missões 2 e 3 · Reestruturação (ajustes da Alana) Specification

Fonte: `contexto inicial/AJUSTES Missão 3  E Missão 2.docx` (texto, notas entre colchetes e 4 comentários da Alana Portes), com as decisões do usuário de 2026-11-03. Esta spec **substitui, onde conflitar**, `missao2-equipe/spec.md` e `missao3-rumo/spec.md`; o que não é citado aqui continua valendo como está.

## Problem Statement

**Missão 2.** Hoje o usuário escolhe áreas, ajusta cadeiras, escreve nomes e só depois define o escopo, clicando em cada caixa do organograma (perfil, repertório, rotinas por cadeira, cadeia, comunicação entre áreas). A Legisla quer o exercício contrário: partir do **trabalho** (escopo → competências → cargo → pessoa), numa tabela preenchida **em ordem obrigatória**, com a quantidade de linhas definida pelo número de pessoas do mandato. O organograma passa a ser **gerado** dessa tabela, sem o detalhamento profundo de hoje. As rotinas deixam de ser geradas por cadeira e viram um **quadro-modelo fixo de 5 rotinas** que o mandato aceita ou edita, só preenchendo data e horário.

**Missão 3.** O exercício dos preditores ganha justificativas (por que escolhemos e por que não escolhemos) e a escolha de **uma de três estratégias** (A, B ou C) para os Objetivos Estratégicos. **A hierarquia do Planejamento Estratégico não muda com a estratégia escolhida.** As metas **não mudam** nesta rodada. Além disso, "Objetivo Específico" passa a se chamar "Objetivo Estratégico" em todo o produto.

## Goals

- [ ] M2: a tabela de equipe é preenchida na ordem escopo → competências → cargo → pessoa → categoria → área, e não aceita outra ordem.
- [ ] M2: o número de pessoas informado define o número de linhas.
- [ ] M2: o organograma é gerado da tabela (categoria + área), sem passos manuais de layout.
- [ ] M2: o quadro de 5 rotinas é aceito ou editado, recebe data e horário, e sai no planejamento final e em um PDF com o organograma e as rotinas.
- [ ] M3: o mandato escolhe 3 preditores e justifica cada escolha e cada não escolha.
- [ ] M3: o mandato escolhe uma (e só uma) das 3 estratégias A/B/C, sem alterar a árvore do planejamento.
- [ ] "Objetivo Específico" some da interface e dos textos do Guia; entra "Objetivo Estratégico".
- [ ] Mandatos que já preencheram M2 e M3 não perdem dados.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| **Qualquer mudança nas metas da M3** (limite de 9, tipos de avanço concreto, contadores, "Momento Metas 100 Dias", catálogo Legislativo/Capital Político/Governança) | Decisão do usuário: ignorar; metas ficam como estão hoje (faixa 10 a 16 e até 4 por objetivo permanecem, sem novos limites) |
| Mudar a hierarquia da árvore (Legado → preditor/objetivo → metas) | Decisão do usuário: a estratégia A/B/C não muda a estrutura |
| Tratamento especial do PLL (pré-selecionar ou travar a opção C) | Decisão do usuário: ignorar |
| Itens "cabem a Reynolds" (asterisco) | Decisão do usuário: ignorar |
| Agenda com convites e lembretes das rotinas | Exige calendário e envio |
| Detalhamento "ultra profundo" por cadeira (hábitos, repertório, ritmo, relações, entrega) | A Alana pede para não manter; os dados antigos ficam guardados, só saem da tela |
| Reescrever textos do Guia fora do que o documento cita | O documento traz "TEXTO DO GUIA" em branco; só o que foi escrito entra |

## Decisões e Assumptions

| # | Decisão | Padrão | Status |
| - | ------- | ------ | ------ |
| D1 | "Objetivo Específico" → "Objetivo Estratégico" | Troca só de **texto visível** (UI, Guia, exportações). Chaves de dados (`m3.obj.{pid}`, `D.metas[].pred`) **não mudam** | Confirmado (usuário e comentário da Alana) |
| D2 | Passo "Clareza sobre as entregas e agendas [CHECK, pois o mapa político já foi feito]" | Item de checagem automático se a Missão 1 está preenchida; não é campo novo | Confirmado ("M2 está correto") |
| D3 | Ordem obrigatória das colunas da M2 | Coluna N só destrava com a N-1 preenchida; esvaziar uma anterior trava as seguintes (conteúdo guardado, não apagado) | Confirmado |
| D4 | Categorias da pessoa | `Chefia`, `Coordenação`, `Especialista`, `Executora` | Confirmado |
| D5 | Áreas do mandato | As 6 atuais (`COORDENACOES`: Legislativo, Comunicação, Articulação de aliados, Mobilização de pessoas, Secretariado, Logística) + "Outra" | Confirmado (Q7 "Ok") |
| D6 | Pessoa sem perfil disponível | Mantém o `*` = processo seletivo e o texto de incentivo à diversidade | Confirmado |
| D7 | Rotinas | 5 linhas do quadro; o usuário edita frequência, participantes e duração e liga/desliga cada uma; data e horário na última linha | Confirmado |
| D8 | Liderança direta no organograma | **Coordenação** e **Chefia de gabinete**: Especialista/Executora respondem à Coordenação da própria área; Coordenação responde à Chefia | Confirmado ("liderança direta = coordenador e chefe de gabinete") |
| D9 | Onde entram as rotinas no planejamento final | Seção "Rotinas do mandato" no fim da aba Planejamento Estratégico (`#/plano`). O botão "Gerar PDF do organograma e rotinas" fica em dois lugares: abaixo do quadro na Mão na massa 2 e no topo dessa seção. O PDF traz **o organograma e o quadro de rotinas**, nada mais | Confirmado (o PDF inclui o organograma) |
| D10 | Estratégia A/B/C | Escolha **única**; trocar pede confirmação. **Não altera a árvore**: o nó de cada preditor continua sendo o Objetivo Estratégico dele | Confirmado |
| D11 | Como cada estratégia preenche o texto do nó do preditor | A: nome do preditor. B: a frase escrita pelo usuário. C: o nome do preditor, como em A; os 3 Objetivos Estratégicos da Legisla (Avanço Legislativo; Expansão de Capital Político e Influência; Governança Estratégica) ficam registrados como **referência** do mandato e aparecem como nota no Planejamento, sem virar nós | Confirmado |
| D12 | Justificativas dos preditores | Obrigatórias para considerar o exercício concluído (3 escolhidos + 2 não escolhidos), mas não bloqueiam a navegação | Padrão nosso |

**Pontos abertos:** nenhum.

---

## User Stories

### P1: Tabela de equipe em ordem obrigatória ⭐ MVP (M2 · Mão na massa 1)

**User Story**: Como chefe de gabinete, quero montar a equipe a partir do trabalho a ser feito e só depois dar nome às pessoas.

**Acceptance Criteria**

1. WHEN a Mão na massa 1 abre THEN a plataforma SHALL mostrar o texto do Guia ("Ao invés de encaixar pessoas em cargos…") e o passo a passo numerado.
2. WHEN a Missão 1 está preenchida THEN a plataforma SHALL marcar o passo "clareza sobre entregas e agendas" como feito, com link para o mapa político; senão, SHALL mostrar o link sem bloquear. (D2)
3. WHEN a tabela está vazia THEN a plataforma SHALL pedir "Quantas pessoas o mandato terá ou espera ter nos primeiros 100 dias?" (inteiro, 1 a 40) antes de mostrar qualquer linha.
4. WHEN o usuário informa N THEN a plataforma SHALL criar N linhas vazias e permitir ajustar N depois (aumentar cria linhas; diminuir só remove linhas **vazias** e pede confirmação para as preenchidas).
5. WHILE a coluna anterior de uma linha estiver vazia THE plataforma SHALL manter a coluna seguinte desabilitada, com a legenda "Preencha antes: <coluna>". Ordem: escopo → competências comportamentais → nome do cargo → nome da pessoa → categoria → área. (D3)
6. WHEN o usuário esvazia uma coluna anterior THEN a plataforma SHALL travar as seguintes sem apagá-las e SHALL avisar.
7. WHEN o usuário escreve `*` no nome da pessoa THEN a plataforma SHALL tratar como processo seletivo a abrir e SHALL mostrar o incentivo à diversidade e representatividade do Guia. (D6)
8. WHEN o nome da pessoa está preenchido THEN a plataforma SHALL liberar a categoria (D4) e depois a área (D5).
9. WHEN uma linha chega à última coluna THEN a plataforma SHALL contá-la como completa e mostrar "X de N linhas completas".
10. The plataforma SHALL gravar a cada edição (autosave).
11. WHILE a tela tem largura de celular THE plataforma SHALL mostrar cada linha como um cartão vertical, com as colunas na mesma ordem.

**Independent Test**: Informar 4 pessoas, tentar clicar em "Nome do cargo" com o escopo vazio (desabilitada), preencher a linha 1 inteira e ver "1 de 4 linhas completas".

### P1: Organograma gerado da tabela ⭐ MVP

**Acceptance Criteria**

1. WHEN existe ao menos uma linha com cargo, categoria e área THEN a plataforma SHALL gerar o organograma sozinha.
2. The plataforma SHALL posicionar: **Chefia** no topo; **Coordenação** de cada área abaixo da Chefia; **Especialista** e **Executora** abaixo da Coordenação da própria área. (D8)
3. IF uma área tem Especialistas/Executoras e nenhuma Coordenação THEN a plataforma SHALL ligá-las direto à Chefia e avisar "Área sem coordenação".
4. IF não há Chefia THEN a plataforma SHALL mostrar o organograma sem raiz comum e o aviso "Defina a chefia".
5. IF há mais de uma Chefia THEN a plataforma SHALL mostrar todas no topo, lado a lado, com aviso.
6. WHEN o usuário edita qualquer célula da tabela THEN o organograma SHALL atualizar na hora.
7. The plataforma SHALL mostrar em cada caixa só: nome da pessoa (ou "Processo seletivo"), nome do cargo e área; clicar na caixa SHALL levar à linha da tabela. O painel profundo por cadeira SHALL sair da tela.
8. The plataforma SHALL manter exportar e imprimir o organograma.
9. The Missão 5 (feedback) SHALL continuar lendo "liderança direta" como a Coordenação da área (ou a Chefia), derivada desta mesma regra.

**Independent Test**: Criar 1 Chefia, 1 Coordenação de Legislativo e 2 Executoras de Legislativo e ver 3 níveis corretos; remover a coordenação e ver o aviso.

### P1: Rotinas pelo quadro-modelo ⭐ MVP (M2 · Mão na massa 2)

**Acceptance Criteria**

1. WHEN a Mão na massa 2 abre THEN a plataforma SHALL mostrar objetivo e importância (texto do documento) e o quadro abaixo, mais a linha "Quando o mandato iniciará a rotina?".

   | Rotina | Frequência | Quem participa | Duração média |
   | ------ | ---------- | -------------- | ------------- |
   | Planejamento estratégico | Quadrimestralmente | Todos | 2 períodos de 6h |
   | Monitoramento de avanços do trabalho previsto para o mês (acompanhamento de metas) | Mensalmente | Todos | 1h |
   | Alinhamento de atualização coletiva e expectativas do trabalho da semana | Semanalmente | Todos | 1h |
   | Reunião de distribuição de trabalho dentro de cada área | Semanalmente | Assessores e Coordenação de uma área específica | 45 min |
   | Reunião de feedback estruturado individual | Semestralmente | Liderança e Assessores (individualmente) | 30 min por reunião |

2. WHEN o usuário concorda THEN a plataforma SHALL pedir data e horário de início de cada rotina e marcá-la como "agendada".
3. WHEN o usuário discorda THEN a plataforma SHALL permitir editar frequência, participantes e duração e ligar/desligar cada rotina. (D7)
4. IF a data é anterior a hoje THEN a plataforma SHALL avisar sem bloquear.
5. The plataforma SHALL guardar o quadro por mandato; sem edição, vale o modelo da Legisla.
6. WHEN a Mão na massa 1 está preenchida THEN a linha "Reunião de distribuição…" SHALL listar as áreas do mandato.
7. The plataforma SHALL concluir a tarefa quando todas as rotinas ligadas tiverem data e horário, com confirmação do usuário.
8. The plataforma SHALL mostrar, abaixo do quadro, o botão "Gerar PDF do organograma e rotinas". (D9)

**Independent Test**: Preencher data e horário das 5 rotinas e ver "5 de 5 agendadas"; editar a duração da 1ª e reabrir.

### P1: Rotinas no planejamento final e PDF do organograma e rotinas ⭐ MVP

**Acceptance Criteria** (D9)

1. WHEN a aba Planejamento Estratégico abre THEN a plataforma SHALL mostrar, **no fim da aba**, a seção "Rotinas do mandato" com as rotinas ligadas, frequência, participantes, duração e início.
2. WHEN o usuário aciona "Gerar PDF do organograma e rotinas" (na seção ou na M2) THEN a plataforma SHALL abrir a impressão do navegador com **só** o organograma gerado (página 1) e o quadro de rotinas (a seguir), no mesmo recurso de impressão do produto, pronto para "Salvar como PDF".
3. IF o organograma ainda não existe (tabela da Mão na massa 1 vazia) THEN o PDF SHALL trazer só as rotinas e a plataforma SHALL avisar.
4. IF nenhuma rotina tem início definido THEN a seção SHALL mostrar "início ainda não definido" com link para a Missão 2.
5. The plataforma SHALL incluir a seção "Rotinas do mandato" também ao imprimir o planejamento completo.

### P1: Preditores com justificativa ⭐ MVP (M3)

**Acceptance Criteria**

1. WHEN o exercício abre THEN a plataforma SHALL mostrar os 5 preditores em caixas clicáveis, cada uma com explicação breve (de `PREDITORES`), e o texto "Atenção! Sua escolha deve considerar o que precisa acontecer logo nos primeiros dias do mandato."
2. WHEN o usuário seleciona um preditor THEN a plataforma SHALL abrir a caixa "Este preditor foi escolhido pois…".
3. WHEN há 3 escolhidos THEN a plataforma SHALL abrir nos 2 não escolhidos a caixa "Este preditor não foi escolhido pois…".
4. IF o usuário tenta escolher um 4º THEN a plataforma SHALL recusar e dizer qual desmarcar (comportamento atual).
5. WHEN o usuário troca a seleção THEN a plataforma SHALL preservar as justificativas já escritas (guardadas por preditor) e ajustar o rótulo "escolhido/não escolhido".
6. The plataforma SHALL concluir o passo com 3 escolhidos e 5 justificativas preenchidas (D12); sem elas, mostra "faltam N justificativas" sem bloquear.
7. The plataforma SHALL manter o texto atual do Guia (intro, passos, nota sobre priorização anual), salvo a troca de nomenclatura.

**Independent Test**: Escolher p1, p2, p3, escrever 3 "foi escolhido pois" e 2 "não foi escolhido pois" e ver o passo concluído.

### P1: Escolha única da estratégia A/B/C ⭐ MVP

**Acceptance Criteria**

1. WHEN o bloco abre THEN a plataforma SHALL explicar "o que é Objetivo Estratégico", mostrar os 5 exemplos do documento e as 3 opções:
   - **A.** Os preditores selecionados se tornarão os Objetivos Estratégicos do mandato.
   - **B.** Os preditores serão traduzidos em outra frase, que serão os Objetivos Estratégicos.
   - **C.** Os preditores apenas nortearão as Metas; os Objetivos Estratégicos serão os 3 sugeridos pela Legisla: 1. Avanço Legislativo; 2. Expansão de Capital Político e Influência; 3. Governança Estratégica.
2. The plataforma SHALL permitir exatamente 1 opção ativa. (D10)
3. WHEN o usuário escolhe A THEN a plataforma SHALL usar o nome de cada preditor como Objetivo Estratégico e SHALL fechar o passo, sem campo de texto.
4. WHEN o usuário escolhe B THEN a plataforma SHALL abrir um campo de frase por preditor escolhido, com o nome do preditor visível, e fechar o passo quando os 3 estiverem preenchidos. (Comentário da Alana: B abre para a frase conforme a seleção do exercício 1.)
5. WHEN o usuário escolhe C THEN a plataforma SHALL registrar os 3 Objetivos Estratégicos da Legisla como referência e SHALL fechar o passo, sem campo de texto. (D11)
6. **A árvore do planejamento SHALL permanecer idêntica nas três opções**: Legado → preditor/Objetivo Estratégico → metas. A estratégia só define o **texto** do nó do preditor (D11); nenhuma meta é reclassificada, movida ou bloqueada por causa da troca.
7. WHEN o usuário troca de opção THEN a plataforma SHALL pedir confirmação e SHALL guardar (não apagar) o texto da opção anterior.
8. The plataforma SHALL mostrar a estratégia escolhida e as justificativas dos preditores no Resumo e na aba Planejamento.

**Independent Test**: Escolher B, escrever 3 frases e ver os 3 nós da árvore com essas frases; trocar para A e ver os nomes dos preditores; em nenhum caso as metas se movem.

### P1: Terminologia "Objetivo Estratégico" ⭐ MVP

**Acceptance Criteria**

1. The plataforma SHALL exibir "Objetivo Estratégico" onde hoje há "Objetivo Específico" (Preditores, Metas, Árvore, Resumo, Painel, Planejamento, Missão 5, avisos, exportações).
2. The plataforma SHALL alterar os textos do Guia em `conteudo.js` por override em `m3.js`/`m5.js` (AD-003); o `.docx` do Guia fica com a Alana.
3. The plataforma SHALL manter chaves de dados e nomes internos (D1).
4. A varredura dos textos de UI SHALL não encontrar "objetivo específico".

### P2: Migração

**Acceptance Criteria**

1. IF existe `D.preditores` e `m3.obj.*` sem estratégia gravada THEN a plataforma SHALL assumir **B** quando houver ao menos um `m3.obj.*` preenchido e **A** quando não houver, sem perder texto.
2. IF existe equipe no modelo antigo (`m2.on`, `m2.f{n}`, `m2.p{n}.*`) THEN a plataforma SHALL convertê-la em linhas da tabela: escopo ← `escopo`, cargo ← `nome_cargo` (ou cargo do modelo), pessoa ← `m2.f{n}`, área ← `coord`, categoria ← derivada (cadeira 0 = Chefia; quem lidera outras = Coordenação; o resto = Executora). Dados sem destino (perfil, repertório, ritmo…) SHALL ficar guardados sem aparecer.
3. IF existem `m2.rotoff` ou rotinas entre áreas (`m2.x`) THEN a plataforma SHALL mantê-los guardados e ignorá-los na tela nova.
4. As metas existentes SHALL permanecer exatamente como estão.

---

## Edge Cases

- WHEN o usuário informa um número menor que as linhas preenchidas THEN a plataforma SHALL pedir confirmação antes de remover.
- WHEN duas linhas têm o mesmo nome de pessoa THEN a plataforma SHALL avisar sem bloquear.
- WHEN todas as linhas são `*` THEN o organograma SHALL mostrar só cargos e áreas.
- WHEN um preditor escolhido é desmarcado THEN a justificativa fica guardada e volta se ele for reescolhido; as metas dele seguem o comportamento atual ("sem objetivo").
- Planejamentos arquivados (Missão 5, `D.planos`) SHALL seguir somente leitura; os antigos sem estratégia exibem o texto gravado.

## Impacto técnico (resumo; o design vem depois)

| Área | Arquivos | Mudança |
| ---- | -------- | ------- |
| Tabela de equipe M2 | `ilhas/equipe/EtapaAreas.tsx`, `EtapaCadeiras.tsx`, `EtapaNomes.tsx`, `Escalacao.tsx`, `lib/cadeiras.ts`, `public/legacy/m2.js` | Trocar as 3 etapas por 1 tabela com ordem travada; função pura nova (`lib/tabelaEquipe.ts`, AD-004) |
| Organograma | `ilhas/equipe/Organograma.tsx`, `PainelCadeira.tsx`, `MiniOrg.tsx`, `lib/layoutOrg.ts` | Gerar por categoria + área; remover painel profundo; manter exportar |
| Rotinas | `ilhas/equipe/Rotinas.tsx`, `EntreAreas.tsx`, `Entrega.tsx`, `lib/rotinas.ts`, `lib/exporta.ts` | Quadro-modelo de 5 linhas; sair cadeia e comunicação entre áreas; PDF do organograma e rotinas |
| Planejamento | `ilhas/rumo/Plano.tsx`, `PlanoResumo.tsx`, `public/legacy/m5.js` | Seção "Rotinas do mandato" no fim; estratégia e justificativas visíveis |
| Preditores e estratégia M3 | `ilhas/rumo/Preditores.tsx`, `lib/plano.ts` (`objetivos()` lê a estratégia), `public/legacy/m3.js` | Justificativas; `estrategia` ('a'\|'b'\|'c'); **a árvore e as metas não mudam** |
| Missão 5 | `ilhas/rumo/Feedback.tsx`, `lib/feedback.ts` | Liderança direta pela regra D8; texto "Objetivo Estratégico" |
| Dados | Só `D.campos`: `m2.n`, `m2.p{n}.esc/comp/cat`, `m2.rq`, `m3.est`, `m3.just.{pid}` (ver design) | Aditivo; nada é removido |

## Requirement Traceability

| ID | Story | Tasks | Status |
| -- | ----- | ----- | ------ |
| RM2-01 | Tabela de equipe em ordem obrigatória (RM2-01 a 11) | T12, T13, T15, T16, T19 | Done |
| RM2-30 | Organograma gerado da tabela (RM2-30 a 38) | T14, T17, T18, T27 | Done |
| RM2-50 | Rotinas pelo quadro-modelo (RM2-50 a 58) | T20, T21, T24, T25, T27A | Pending |
| RM2-60 | Rotinas no planejamento e PDF (RM2-60 a 64) | T22, T23, T26 | Pending |
| RM3-01 | Preditores com justificativa (RM3-01 a 07) | T5, T7 | Done |
| RM3-10 | Estratégia A/B/C, árvore inalterada (RM3-10 a 18) | T5, T6, T8, T9, T10, T11 | Done |
| RM3-40 | Terminologia "Objetivo Estratégico" (RM3-40 a 44) | T1, T2, T3, T4 | Done |
| RMX-01 | Migração (RMX-01 a 04) | T5, T9, T15, T28 | Pending |

Os critérios numerados de cada história são o ID da faixa (ex.: critério 5 da tabela = RM2-05).

## Plano de testes (proposto)

- **Lógica (`node --test`)**: travamento das colunas, conversão equipe antiga → tabela, derivação do organograma (D8), estratégia A/B/C → texto do nó do preditor, **teste de que a árvore é igual nas 3 estratégias**, migração.
- **Jornada (Playwright)**: tabela em ordem; rotinas com data e horário; PDF do organograma e rotinas; preditores com justificativas; troca A/B/C sem mover metas; varredura de "objetivo específico".

## Sugestão de entrega em ondas

1. **Onda 1 · Terminologia** (baixo risco).
2. **Onda 2 · M3**: justificativas e estratégia A/B/C.
3. **Onda 3 · M2 tabela + organograma gerado**, com migração.
4. **Onda 4 · M2 rotinas** + seção no Planejamento + PDF.

## Success Criteria

- [ ] Um mandato novo monta a equipe só pela tabela, na ordem, e vê o organograma gerado sem tocar em layout.
- [ ] Um mandato antigo abre a M2 e a M3 sem perder nenhum dado.
- [ ] Escolher A, B ou C fecha o passo e **não altera a estrutura nem as metas** do planejamento.
- [ ] Nenhuma tela mostra "Objetivo Específico".
- [ ] A aba Planejamento mostra as rotinas e gera o PDF do organograma e das rotinas.
