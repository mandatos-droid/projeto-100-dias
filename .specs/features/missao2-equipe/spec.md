# Missão 2 · Equipe, Organograma e Rotinas Specification

## Problem Statement

Hoje a Missão 2 começa com 20 cadeiras fixas, pede o nome de cada pessoa antes de definir a estrutura e espalha o trabalho em três lugares: lista de nomes (`m2.funcoes`), fichas de gestão dentro dessa lista e um organograma que só lê o que foi digitado. As rotinas são uma tabela genérica de 5 linhas, sem relação com as cadeiras do mandato. O resultado final que a Missão promete (cadeiras, escopo de cada cargo, organograma visual, fluxos e rotinas de comunicação) não nasce do preenchimento: o usuário precisa montá-lo por conta própria. A bandeira prioritária também é perguntada na Missão 2, mas pertence à Missão 3.

## Goals

- [ ] O usuário monta a estrutura em ordem: áreas, depois cadeiras, depois pessoas, depois escopo e perfil.
- [ ] O número de cadeiras deixa de ser fixo em 20: nasce das áreas escolhidas e pode ser ajustado (de 1 a 40 cadeiras).
- [ ] Coordenação e liderança imediata são preenchidas na escalação; escopo, perfil e repertório são preenchidos clicando na caixa do organograma.
- [ ] Cada edição no organograma atualiza, na hora, as rotinas das áreas e a visão de cadeia.
- [ ] O produto final da Missão tem 4 partes visíveis e exportáveis: cadeiras, escopo por cargo, organograma e rotinas (cadeia + comunicação entre áreas).
- [ ] Mandatos que já preencheram a Missão 2 não perdem nenhum dado.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Perguntar bandeiras prioritárias na Missão 2 (seletor e recomendação de cargos por bandeira) | Pertence à Missão 3; os cargos temáticos aparecem só como "temático" |
| Agenda com datas, convites e lembretes das rotinas | Exige calendário e notificação; fica para a v2 |
| Edição simultânea por várias pessoas no mesmo organograma (cursor ao vivo) | O salvamento atual é por mandato, sem tempo real |
| Matriz RACI completa por entrega | Pesquisa mostra risco de excesso; entram só rotinas e quem participa |
| Avaliação de desempenho e feedback individual (campos `fb_*`, `ritmo`, `rel`) | Não pedido; os campos continuam gravados, sem tela nova |
| Integração com folha, RH ou Casa Legislativa | Fora do escopo do Guia |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| "1 de cadeiras possa ser alterado em pré-seleção" | Leio como "o número de cadeiras pode ser alterado numa pré-seleção": uma etapa antes dos nomes, onde se escolhe as áreas e se ajustam as cadeiras | Único sentido que combina com o resto do pedido | y (usuário aprovou o padrão) |
| Lista de áreas | As 6 coordenações atuais (Legislativo, Comunicação, Articulação de aliados, Mobilização de pessoas, Secretariado, Logística). "Chefia de área" sai da lista porque a Chefia de gabinete é cadeira obrigatória | `COORDENACOES` em `lib/equipe.ts`; "Chefia de área" é só o rótulo da cadeira 0 | y (aprovado em 2026-10-23) |
| Nenhuma área vem marcada | O usuário marca; um atalho "Usar o modelo completo (20 cadeiras)" marca as 6 de uma vez | O pedido exige selecionar antes de nomear; o atalho protege quem quer o modelo atual | y (aprovado em 2026-10-23) |
| Cadeiras de cada área | Pré-preenchidas a partir de `CARGOS_EQUIPE` + `PADRAO` (mesmo agrupamento de hoje); o usuário remove ou acrescenta | Reaproveita o conteúdo validado pela Legisla | y (aprovado em 2026-10-23) |
| Cargos temáticos | "Especialista temático(a) 1" e "2", etiqueta "Temático", sem bandeira | Pedido do usuário | y |
| Onde edita escopo, perfil e repertório | Só no painel do organograma (Tarefa 2). A Tarefa 1 mantém: nome, nome do cargo, coordenação, liderança imediata | Pedido do usuário | y |
| Coordenação e liderança pré-preenchidas | Vêm de `PADRAO` e continuam editáveis | Pedido do usuário | y |
| O que é "cadeia de rotinas" | Sequência de rituais do mais amplo ao mais restrito (planejamento, monitoramento, alinhamento semanal, reunião de área, feedback 1:1), cada um ligado às cadeiras que participam | Interpretação do pedido; derivável do que já existe em `ROTINAS` | y (aprovado em 2026-10-23) |
| Rotinas geradas | Planejamento, monitoramento e alinhamento semanal = todas as cadeiras ocupadas; reunião de área = cadeiras da área; feedback = par líder/liderado pela liderança imediata | Regras determinísticas e testáveis; mantêm as 5 rotinas atuais | y (aprovado em 2026-10-23) |
| Rotinas entre áreas | O usuário cria pares de áreas com frequência, finalidade e canal. A plataforma oferece 4 sugestões iniciais: Legislativo↔Comunicação, Articulação↔Legislativo, Mobilização↔Comunicação, Secretariado↔Chefia | Conteúdo ainda não validado pela Legisla: ver pergunta 3 abaixo | y (aprovado em 2026-10-23) |
| Chave de armazenamento | Mantém `m2.f{n}` (nome) e `m2.p{n}.*` (ficha); acrescenta `m2.coords`, `m2.on` (cadeiras ativas), `m2.x` (rotinas entre áreas) | O painel, o resumo e a nuvem já leem `m2.f{n}` | y (aprovado em 2026-10-23) |
| Cadeiras acrescentadas à mão | Recebem índice 20 em diante; ficam em `m2.on` | Evita renumerar as 20 originais | y (aprovado em 2026-10-23) |
| Concluir tarefa | Os itens do checklist `m2.c1..c3` passam a ser sugeridos como "pronto" pela plataforma; a pessoa confirma | Mantém o controle do usuário e o painel atual | y (aprovado em 2026-10-23) |
| Pesquisa de UX | Baseada em páginas de fornecedores de organograma e em guias de acessibilidade; pouco material sobre ciclos e desfazer. Esses dois pontos são decisão minha, não achado | Resultado das buscas desta sessão | y (aprovado em 2026-10-23) |

**Open questions:** none - all resolved or logged above. As linhas com "Confirmed? n" aguardam a validação do usuário; cada uma já tem padrão escolhido.

---

## Pesquisa que orienta o desenho

Resumo do que as buscas sustentam e como a spec usa cada achado.

| Achado | Fonte | Decisão na spec |
| ------ | ----- | --------------- |
| Mostrar o local de destino antes de soltar (contorno azul) e atualizar as linhas de subordinação sozinho | [Functionly](https://www.functionly.com/help/drag-drop-edit), [Unaric](https://www.unaric.com/feature/unaric-org-chart-drag-and-drop-org-chart-builder) | MEQ-12 |
| Mover um gestor sem a equipe exige gesto separado | [Functionly](https://www.functionly.com/help/drag-drop-edit) | MEQ-13 |
| Painel de perfil e canvas são a mesma fonte de verdade | [TechClass](https://docs.techclass.com/docs/people/org-chart) | MEQ-09, MEQ-10 |
| Caixa com o mínimo (nome, cargo, área); mesma forma e cor por nível; dividir em visões por departamento | [The Org Chart](https://theorgchart.com/?p=66845), [Functionly](https://www.functionly.com/orginometry/organizational-accountability/the-ultimate-guide-to-choosing-the-right-organization-chart-software) | MEQ-11, MEQ-15 |
| Linha pontilhada para relação de matriz | [OrgChartDesk](https://alternativeto.net/software/orgchartdesk/about/) | MEQ-21 (comunicação entre áreas) |
| Teclado: nós focáveis, `ariaLabel` por nó, Enter/Espaço seleciona; colapsar com `aria-expanded`; ações de edição fora de menus escondidos | [React Flow](https://reactflow.dev/learn/advanced-use/accessibility), [Telerik](https://www.telerik.com/design-system/docs/components/orgchart/accessibility/), [freeCodeCamp](https://www.freecodecamp.org/news/designing-keyboard-accessibility-for-complex-react-experiences/) | MEQ-16 |
| RACI: listas Consulted/Informed curtas; documento vivo, sempre visível | [Routine](https://routine.co/blog/posts/guide-to-the-raci-matrix), [Fellow](https://fellow.ai/blog/raci-meeting-your-complete-guide-to-a-well-informed-team/) | MEQ-18, MEQ-19 |
| Plano de comunicação: finalidade, público, frequência, canal | [Reliable Plant](https://reliableplant.com/Articles/Print/32177?id=32177) | MEQ-21 |
| Assistente: autosalvar, "Etapa X de Y", voltar sem perder dados, foco no primeiro campo da etapa | [Visa](https://design.visa.com/patterns/wizard/usage/), [EZUD](https://ezud.com/progressive-disclosure-showing-complexity/) | MEQ-01, MEQ-05 |

---

## Jornada do usuário

```
TAREFA 1 · A escalação do time                    TAREFA 2 · Organograma e rotinas
 ① Áreas do mandato                                ④ Organograma interativo
 ② Cadeiras (ajustar número)                          clicar na caixa → escopo, perfil, repertório
 ③ Nomes + coordenação + liderança                  ⑤ Rotinas
    (mini-organograma ao vivo)                          por área · cadeia · entre áreas
                                                    ⑥ Entrega: ver, exportar, conferir checklist
```

Layout do organograma (Tarefa 2, etapa ④):

```
┌ barra ────────────────────────────────────────────────────────────┐
│ 14/18 cadeiras com escopo · [+ Cadeira] [Ajustar layout] [Exportar]│
│ Áreas: ● Legislativo ● Comunicação ...   Ver: [Estrutura|Rotina ▾] │
├───────────────────────────────────────┬───────────────────────────┤
│                                       │ PAINEL DA CADEIRA          │
│        canvas (React Flow)            │ Nome do cargo / Pessoa     │
│     caixa: nome · cargo · área        │ Coordenação  Liderança     │
│     anel de progresso por caixa       │ Escopo (chips)  Específico │
│                                       │ Perfil e repertório        │
│                                       │ Rotinas desta cadeira      │
└───────────────────────────────────────┴───────────────────────────┘
(em celular: painel vira gaveta inferior; barra rola na horizontal)
```

---

## User Stories

### P1: Escolher as áreas e ajustar as cadeiras ⭐ MVP

**User Story**: Como chefe de gabinete, quero escolher as áreas do mandato e ajustar as cadeiras antes de colocar nomes, para que a estrutura nasça do mandato e não de um modelo fixo de 20 cadeiras.

**Why P1**: Sem isso nada do restante muda; é o pedido central.

**Acceptance Criteria**:

1. WHEN o usuário abre a Missão 2 pela primeira vez THEN a plataforma SHALL mostrar a etapa "Áreas do mandato" com as 6 áreas desmarcadas e a Chefia de gabinete já marcada como cadeira obrigatória.
2. WHEN o usuário marca uma área THEN a plataforma SHALL acrescentar a ela as cadeiras sugeridas daquela área (as de `PADRAO` com a mesma coordenação) e mostrar a contagem total de cadeiras.
3. WHEN o usuário aciona "Usar o modelo completo" THEN a plataforma SHALL marcar as 6 áreas e totalizar 20 cadeiras.
4. WHEN o usuário desmarca uma área que tem cadeiras sem nome THEN a plataforma SHALL remover essas cadeiras sem pedir confirmação.
5. IF o usuário desmarca uma área que tem cadeira com nome preenchido THEN a plataforma SHALL pedir confirmação listando os nomes e, ao confirmar, mover as cadeiras para "Sem área" em vez de apagá-las.
6. WHEN o usuário remove ou acrescenta uma cadeira na etapa "Cadeiras" THEN a plataforma SHALL atualizar a contagem e manter de 1 a 40 cadeiras.
7. IF o usuário tenta remover a Chefia de gabinete THEN a plataforma SHALL recusar e explicar que ela é obrigatória.
8. IF o usuário tenta passar de 40 cadeiras THEN a plataforma SHALL bloquear o acréscimo e informar o limite.
9. WHILE nenhuma área estiver marcada, a plataforma SHALL manter bloqueada a etapa "Nomes" e informar o motivo.
10. The plataforma SHALL exibir os cargos temáticos como "Especialista temático(a) N" com a etiqueta "Temático" e SHALL NOT pedir bandeira prioritária.

**Independent Test**: Marcar Legislativo e Comunicação, ver as cadeiras mudarem de 1 para 11, remover uma cadeira e ver 10.

---

### P1: Nomear e posicionar a equipe ⭐ MVP

**User Story**: Como chefe de gabinete, quero escrever o nome de cada pessoa e dizer a coordenação e a liderança imediata, para que o organograma seja gerado a partir disso.

**Why P1**: Coordenação e liderança são o que desenham o organograma.

**Acceptance Criteria**:

1. WHEN a etapa "Nomes" abre THEN a plataforma SHALL listar cada cadeira ativa com nome da pessoa, nome do cargo, coordenação e liderança imediata, com coordenação e liderança já preenchidas pelo padrão.
2. WHEN o usuário digita `*` no nome THEN a plataforma SHALL marcar a cadeira como "processo seletivo de ampla concorrência".
3. WHEN o usuário altera coordenação ou liderança imediata THEN a plataforma SHALL gravar a escolha e atualizar o mini-organograma ao lado em menos de 300 ms.
4. IF a liderança escolhida criaria um ciclo (A lidera B e B lidera A, direta ou indiretamente) THEN a plataforma SHALL recusar a escolha e mostrar a cadeia que formaria o ciclo.
5. IF a liderança imediata aponta para uma cadeira que foi removida THEN a plataforma SHALL passar a cadeira para a liderança da cadeira removida.
6. The plataforma SHALL NOT exibir campos de escopo, perfil nem repertório na Tarefa 1.
7. WHEN o usuário sai da etapa e volta THEN a plataforma SHALL manter tudo o que foi digitado (autosalvamento).
8. WHILE o usuário está na Tarefa 1, a plataforma SHALL mostrar "Etapa X de 3" e permitir voltar sem perder dados.

**Independent Test**: Nomear 3 cadeiras, trocar a liderança de uma e ver o mini-organograma refletir; tentar o ciclo e ver a recusa.

---

### P1: Organograma interativo com painel por cadeira ⭐ MVP

**User Story**: Como chefe de gabinete, quero clicar em cada caixa do organograma e definir escopo, perfil e repertório ali, para ver a estrutura crescer enquanto defino o trabalho de cada cargo.

**Why P1**: É a segunda metade do produto final e o pedido central de interatividade.

**Acceptance Criteria**:

1. WHEN o usuário clica ou aciona Enter na caixa de uma cadeira THEN a plataforma SHALL abrir o painel da cadeira com nome do cargo, pessoa, coordenação, liderança, escopo, especificidades, habilidades e repertório.
2. WHEN o usuário altera qualquer campo do painel THEN a plataforma SHALL refletir a mudança na caixa e nas rotinas sem recarregar e gravar o dado.
3. WHEN o usuário altera coordenação ou liderança no painel THEN a plataforma SHALL redesenhar o organograma e atualizar as rotinas.
4. The plataforma SHALL mostrar em cada caixa apenas pessoa, cargo, área (cor) e um anel de progresso do preenchimento do painel.
5. WHEN a cadeira não tem escopo THEN a plataforma SHALL destacar a caixa com o selo "escopo pendente".
6. The plataforma SHALL mostrar na barra o total de cadeiras com escopo definido sobre o total de cadeiras ativas.
7. WHEN o usuário aciona "Acrescentar cadeira" com uma caixa selecionada THEN a plataforma SHALL criar uma cadeira subordinada a ela e abrir o painel.
8. WHEN o usuário remove uma cadeira que lidera outras THEN a plataforma SHALL pedir confirmação e, ao confirmar, repassar as cadeiras lideradas para a liderança da removida.
9. WHEN o usuário aciona "Ajustar layout" THEN a plataforma SHALL reorganizar as caixas em árvore e enquadrar tudo na tela.
10. WHEN o usuário filtra por área THEN a plataforma SHALL esmaecer as caixas das outras áreas sem escondê-las.

**Independent Test**: Clicar em uma caixa, marcar 2 itens de escopo e ver o anel e o contador mudarem.

---

### P1: Rotinas geradas pelas cadeiras ⭐ MVP

**User Story**: Como chefe de gabinete, quero que as rotinas de cada área apareçam sozinhas conforme eu monto a equipe, para pactuar reuniões sem escrever tudo do zero.

**Why P1**: É a terceira parte do produto final e o que diferencia da tabela fixa de hoje.

**Acceptance Criteria**:

1. WHEN a equipe tem ao menos 1 cadeira com nome THEN a plataforma SHALL gerar as rotinas: planejamento quadrimestral, monitoramento mensal e alinhamento semanal, todas com as cadeiras ocupadas.
2. WHEN uma área tem 2 ou mais cadeiras THEN a plataforma SHALL gerar a "Reunião semanal da área", de 45 min, com as cadeiras da área e como convocador a cadeira de topo da área.
3. WHEN existe um par líder/liderado pela liderança imediata THEN a plataforma SHALL gerar o "Feedback semestral 1:1", de 30 min, para esse par, agrupado por líder.
4. WHEN o usuário altera cadeiras, coordenação ou liderança THEN a plataforma SHALL recalcular as rotinas em menos de 300 ms.
5. WHEN o usuário abre a lista por área THEN a plataforma SHALL mostrar, para cada área, quem coordena, quem participa e o escopo de cada pessoa.
6. WHEN uma rotina envolve cadeiras sem nome THEN a plataforma SHALL listá-las como "vaga" e SHALL NOT contá-las na contagem de participantes confirmados.
7. WHERE o usuário desliga uma rotina gerada, a plataforma SHALL guardar a escolha e deixar de contar a rotina no checklist.

**Independent Test**: Montar uma área de 3 cadeiras e ver a reunião semanal da área aparecer com 3 participantes e 45 min.

---

### P2: Cadeia de rotinas com cadeiras destacadas

**User Story**: Como chefe de gabinete, quero ver as rotinas em cadeia e as cadeiras envolvidas em cada elo, para entender como a informação circula pelo mandato.

**Why P2**: Pedido explícito, mas depende das rotinas geradas.

**Acceptance Criteria**:

1. The plataforma SHALL mostrar a cadeia na ordem planejamento → monitoramento → alinhamento semanal → reunião de área → feedback 1:1, cada elo com frequência, duração e quantidade de cadeiras.
2. WHEN o usuário seleciona um elo da cadeia THEN a plataforma SHALL destacar no organograma as cadeiras envolvidas e esmaecer as demais.
3. WHEN o usuário seleciona uma cadeira no organograma THEN a plataforma SHALL listar as rotinas de que ela participa.
4. WHILE um elo está selecionado, a plataforma SHALL permitir limpar o destaque com um único comando ("Mostrar todos").
5. The plataforma SHALL distinguir os elos também por texto e ícone, nunca só por cor.

**Independent Test**: Selecionar "Reunião da área Comunicação" e ver só as cadeiras de Comunicação em destaque.

---

### P2: Comunicação entre áreas

**User Story**: Como chefe de gabinete, quero registrar as rotinas de comunicação entre áreas, para evitar ruído e retrabalho entre elas.

**Why P2**: Pedido explícito; o conteúdo das sugestões precisa de validação da Legisla.

**Acceptance Criteria**:

1. WHEN o usuário abre "Entre áreas" THEN a plataforma SHALL mostrar as 4 sugestões iniciais, cada uma só se as duas áreas estiverem ativas.
2. WHEN o usuário aceita uma sugestão ou cria um par THEN a plataforma SHALL pedir área de origem, área de destino, finalidade, frequência e canal, e SHALL gravar a rotina.
3. IF a origem e o destino são a mesma área THEN a plataforma SHALL recusar o par.
4. WHEN existe ao menos uma rotina entre duas áreas THEN a plataforma SHALL desenhar no organograma uma linha pontilhada rotulada entre as áreas, sem alterar a hierarquia.
5. WHEN o usuário seleciona uma rotina entre áreas THEN a plataforma SHALL destacar as cadeiras de convocação das duas áreas.
6. IF uma das áreas é desmarcada THEN a plataforma SHALL arquivar as rotinas que a envolvem e SHALL NOT apagá-las.
7. WHEN a área volta a ser marcada THEN a plataforma SHALL restaurar as rotinas arquivadas.

**Independent Test**: Criar "Legislativo→Comunicação, semanal, pauta da semana" e ver a linha pontilhada entre as duas áreas.

---

### P2: Entrega e compartilhamento

**User Story**: Como chefe de gabinete, quero ver e exportar o resultado da Missão para compartilhar com a equipe, para que todos conheçam a estrutura e as rotinas.

**Why P2**: A conteúdo de "próximo passo" pede compartilhar a estrutura com toda a equipe.

**Acceptance Criteria**:

1. WHEN o usuário abre "Entrega" THEN a plataforma SHALL mostrar o produto final em 4 blocos: cadeiras, escopo por cargo, organograma e rotinas.
2. WHEN o usuário aciona "Exportar organograma" THEN a plataforma SHALL baixar uma imagem PNG do organograma completo com área e legenda.
3. WHEN o usuário aciona "Imprimir ou salvar em PDF" THEN a plataforma SHALL abrir a impressão com a visão de entrega em layout de papel.
4. WHEN o escopo de todas as cadeiras com nome estiver definido THEN a plataforma SHALL sugerir marcar `m2.c1` como pronto.
5. WHEN o organograma tem ao menos uma cadeira ligada à Chefia de gabinete THEN a plataforma SHALL sugerir marcar `m2.c2`.
6. WHEN existir ao menos uma rotina ativa de cada tipo gerado THEN a plataforma SHALL sugerir marcar `m2.c3`.
7. The plataforma SHALL manter a marcação final do checklist sob controle do usuário.

**Independent Test**: Completar o escopo de todas as cadeiras e ver `m2.c1` sugerido.

---

### P3: Controles avançados do organograma

**User Story**: Como usuário frequente, quero atalhos de edição direta no canvas, para ajustar a estrutura mais rápido.

**Why P3**: Melhoram o ritmo, mas o painel já cobre toda a função.

**Acceptance Criteria**:

1. WHEN o usuário arrasta uma caixa sobre outra THEN a plataforma SHALL mostrar contorno no destino e, ao soltar, definir o destino como liderança imediata.
2. WHEN o usuário arrasta com Ctrl pressionado THEN a plataforma SHALL mover só a cadeira, deixando as lideradas com a liderança anterior.
3. WHEN o usuário aciona "Recolher" em uma caixa com subordinados THEN a plataforma SHALL esconder a subárvore e mostrar o contador de escondidos, com `aria-expanded` atualizado.
4. WHEN o usuário aciona "Desfazer" até 10 s depois de uma remoção THEN a plataforma SHALL restaurar a cadeira com seus dados.
5. WHEN o usuário aciona "Visão por área" THEN a plataforma SHALL mostrar só as cadeiras da área escolhida com a chefia de ligação.

**Independent Test**: Arrastar uma caixa sobre outra e ver a liderança mudar no painel.

---

## Edge Cases

- IF o mandato já tem dados da versão antiga (20 cadeiras fixas, `m2.f{n}` preenchidos) THEN a plataforma SHALL ativar todas as cadeiras com nome, marcar as áreas dessas cadeiras e manter cada campo `m2.p{n}.*` sem alteração.
- IF o mandato tem a chave de bandeiras `m2.areas` THEN a plataforma SHALL preservá-la sem exibi-la na Missão 2.
- IF todas as cadeiras de uma área ficam sem nome THEN a plataforma SHALL gerar a reunião de área e listar todos os participantes como "vaga".
- IF a lista tem cadeira com nome repetido THEN a plataforma SHALL aceitar, pois uma pessoa pode ocupar duas cadeiras, e mostrar o aviso "mesma pessoa em 2 cadeiras".
- IF o navegador está sem rede ao editar THEN a plataforma SHALL manter a edição no armazenamento local e sincronizar ao voltar, como o resto do Guia.
- WHEN a tela tem 360 px de largura THEN a plataforma SHALL mostrar o painel como gaveta inferior e SHALL NOT gerar rolagem horizontal da página.
- IF um usuário só de teclado percorre o organograma THEN a plataforma SHALL permitir focar as caixas com Tab e abrir o painel com Enter.

---

## Implicit-Requirement Dimensions

| Dimensão | Resultado |
| -------- | --------- |
| Validação e limites | MEQ-03 (1 a 40 cadeiras), ciclos (MEQ-07), par de áreas igual (MEQ-20) |
| Falhas e salvamento parcial | Autosalvamento por campo; falha de nuvem cai no local (Edge Cases) |
| Idempotência e duplicados | "Mesma pessoa em 2 cadeiras" aceito com aviso; rotinas geradas são recalculadas, nunca duplicadas (MEQ-17) |
| Autorização | N/A because a Missão 2 já herda o acesso por mandato do Guia; nada novo |
| Concorrência | N/A because não há edição simultânea em tempo real (Out of Scope); vale o último salvamento, como hoje |
| Ciclo de vida dos dados | Migração do formato antigo (Edge Cases) e arquivamento de rotinas de área desmarcada (MEQ-22) |
| Observabilidade | N/A because o projeto não tem analytics definido (mesma decisão da landing) |
| Falha de dependência externa | N/A because tudo roda no navegador; só a nuvem do Guia, já coberta |
| Integridade de transição | Remoção de cadeira com subordinados repassa a liderança (MEQ-08); desmarcar área com nomes pede confirmação (MEQ-04) |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| MEQ-01 | P1: Áreas e cadeiras (assistente, etapas) | Design | Pending |
| MEQ-02 | P1: Áreas e cadeiras (cadeiras por área) | Design | Pending |
| MEQ-03 | P1: Áreas e cadeiras (limites 1 a 40) | Design | Pending |
| MEQ-04 | P1: Áreas e cadeiras (desmarcar área) | Design | Pending |
| MEQ-05 | P1: Nomear e posicionar (autosalvar, etapa X de Y) | Design | Pending |
| MEQ-06 | P1: Nomear e posicionar (coordenação e liderança pré-preenchidas) | Design | Pending |
| MEQ-07 | P1: Nomear e posicionar (ciclo recusado) | Design | Pending |
| MEQ-08 | P1: Organograma (remover cadeira que lidera) | Design | Pending |
| MEQ-09 | P1: Organograma (painel por cadeira) | Design | Pending |
| MEQ-10 | P1: Organograma (edição reflete em tudo) | Design | Pending |
| MEQ-11 | P1: Organograma (caixa mínima e anel) | Design | Pending |
| MEQ-12 | P3: Controles avançados (arrastar para ligar) | - | Pending |
| MEQ-13 | P3: Controles avançados (mover sem equipe) | - | Pending |
| MEQ-14 | P3: Controles avançados (recolher e desfazer) | - | Pending |
| MEQ-15 | P1: Organograma (filtro por área) | Design | Pending |
| MEQ-16 | P1: Organograma (teclado e leitor de tela) | Design | Pending |
| MEQ-17 | P1: Rotinas geradas | Design | Pending |
| MEQ-18 | P2: Cadeia de rotinas | - | Pending |
| MEQ-19 | P2: Cadeia (cadeiras destacadas) | - | Pending |
| MEQ-20 | P2: Comunicação entre áreas (par inválido) | - | Pending |
| MEQ-21 | P2: Comunicação entre áreas (linha pontilhada) | - | Pending |
| MEQ-22 | P2: Comunicação entre áreas (arquivar e restaurar) | - | Pending |
| MEQ-23 | P2: Entrega e compartilhamento | - | Pending |
| MEQ-24 | Migração do formato antigo | Design | Pending |

**Coverage:** 24 total, 0 mapped to tasks, 24 unmapped ⚠️ (tarefas só depois da sua validação)

---

## Plano de testes

O projeto não tem framework de testes hoje (`package.json` sem script `test`). A spec propõe duas camadas, instaladas na primeira tarefa:

- **`node --test`** (já configurado em `npm test`) para a lógica pura em `lib/` (gerar cadeiras, validar ciclos, gerar rotinas, migrar). Roda em segundos, sem navegador. Substitui o Vitest da primeira versão desta spec: não há dependência nova.
- **Playwright** para a jornada no navegador (assistente, organograma, painel, exportação). Roda contra `npm run dev`.

Cada teste cita o critério que prova.

### Lógica (`node --test`)

| ID | Caso | Entrada | Resultado esperado | Prova |
| -- | ---- | ------- | ------------------ | ----- |
| T-01 | Cadeiras por área | áreas = [Legislativo] | Chefia + 6 cadeiras do Legislativo = 7 | MEQ-02 |
| T-02 | Modelo completo | as 6 áreas | 20 cadeiras, mesma ordem de `CARGOS_EQUIPE` | MEQ-02 |
| T-03 | Limite máximo | 40 cadeiras + acrescentar | recusa; total continua 40 | MEQ-03 |
| T-04 | Chefia obrigatória | remover cadeira 0 | recusa | MEQ-03 |
| T-05 | Desmarcar área vazia | área com 0 nomes | cadeiras removidas | MEQ-04 |
| T-06 | Desmarcar área com nome | área com 1 nome | pede confirmação; cadeiras vão para "Sem área" | MEQ-04 |
| T-07 | Padrão pré-preenchido | cadeira 1 sem edição | coordenação Legislativo, líder = cadeira 0 | MEQ-06 |
| T-08 | Ciclo direto | A lidera B, definir B lidera A | recusa | MEQ-07 |
| T-09 | Ciclo indireto | A→B→C, definir C lidera A | recusa com a cadeia A→B→C | MEQ-07 |
| T-10 | Remover líder | remover B em A→B→C | C passa a ser liderada por A | MEQ-08 |
| T-11 | Rotinas básicas | 1 cadeira com nome | 3 rotinas coletivas geradas | MEQ-17 |
| T-12 | Reunião de área | área com 3 cadeiras | 1 reunião de 45 min com 3 participantes | MEQ-17 |
| T-13 | Área com 1 cadeira | área com 1 cadeira | nenhuma reunião de área | MEQ-17 |
| T-14 | Feedback por par | 2 liderados de um líder | 2 feedbacks de 30 min, agrupados no líder | MEQ-17 |
| T-15 | Vaga na rotina | cadeira sem nome | listada como "vaga"; fora da contagem confirmada | MEQ-17 |
| T-16 | Idempotência | gerar duas vezes | mesmo resultado, sem duplicados | MEQ-17 |
| T-17 | Cadeia | rotinas geradas | ordem planejamento→monitoramento→alinhamento→área→feedback | MEQ-18 |
| T-18 | Cadeiras do elo | elo "Reunião da área Comunicação" | só as cadeiras de Comunicação | MEQ-19 |
| T-19 | Par igual | origem = destino | recusa | MEQ-20 |
| T-20 | Arquivar e restaurar | desmarcar e remarcar área | rotinas entre áreas somem e voltam iguais | MEQ-22 |
| T-21 | Migração | mandato antigo com 20 `m2.f` e fichas | todos os campos preservados; áreas inferidas | MEQ-24 |
| T-22 | Migração com bandeiras | `m2.areas` presente | chave preservada | MEQ-24 |
| T-23 | Sugestão de checklist | escopo completo em todas as cadeiras com nome | `m2.c1` sugerido; marcação continua do usuário | MEQ-23 |
| T-24 | Layout do organograma | líder escondido; rotina entre áreas ativa | cadeira sobe ao líder visível; aresta `entre` rotulada, hierarquia igual | MEQ-11, MEQ-21 |
| T-25 | Exportação SVG | nomes com `&`, `<`, aspas | SVG bem formado com nomes, áreas e legenda das áreas ativas | MEQ-23 |
| T-26 | Destaque entre ilhas | definir, limpar e cancelar assinatura | notifica cada mudança; cancelar para de notificar | MEQ-19 |
| T-27 | Ganchos da escalação (`m2.js`) | `Comp.funcoes()` e textos de `MISSOES` | só o contêiner `equipe-escalacao`; textos sem bandeira; checklist mantido | MEQ-01, MEQ-06 |
| T-28 | Contadores do Guia (`m2.js`) | mandato antigo e mandato com `m2.on` | "N de 20" no antigo; "N de 12" no novo; Resumo só com cadeiras ativas | MEQ-24 |

### Jornada (Playwright)

| ID | Cenário | Passos | Resultado esperado | Prova |
| -- | ------- | ------ | ------------------ | ----- |
| E-01 | Etapas em ordem | abrir Missão 2 | "Etapa 1 de 3"; "Nomes" bloqueada sem área | MEQ-01, MEQ-05 |
| E-02 | Marcar áreas | marcar Legislativo e Comunicação | contador mostra 11 cadeiras | MEQ-02 |
| E-03 | Sem escopo na Tarefa 1 | abrir "Nomes" | só nome, cargo, coordenação, liderança | MEQ-06 |
| E-04 | Mini-organograma ao vivo | trocar liderança | caixa muda de lugar em < 300 ms | MEQ-06 |
| E-05 | Ciclo recusado | escolher liderança em ciclo | mensagem de erro; valor anterior mantido | MEQ-07 |
| E-06 | Autosalvar | digitar nome, recarregar | nome mantido | MEQ-05 |
| E-07 | Painel da cadeira | clicar caixa, marcar 2 escopos | anel e contador sobem | MEQ-09, MEQ-11 |
| E-08 | Edição vira rotina | mover cadeira de área no painel | rotina da área atualiza | MEQ-10, MEQ-17 |
| E-09 | Acrescentar e remover | acrescentar filha; remover líder | confirmação; subordinados reatribuídos | MEQ-08 |
| E-10 | Cadeia destaca cadeiras | selecionar elo "Área Comunicação" | só cadeiras de Comunicação ficam em destaque | MEQ-19 |
| E-11 | Comunicação entre áreas | criar Legislativo→Comunicação | linha pontilhada rotulada | MEQ-21 |
| E-12 | Teclado | Tab até caixa, Enter | painel abre; foco vai ao primeiro campo | MEQ-16 |
| E-13 | Celular 360 px | repetir E-07 | painel em gaveta; sem rolagem horizontal | Edge Cases |
| E-14 | Exportar PNG | acionar exportar | arquivo `.png` baixado e não vazio | MEQ-23 |
| E-15 | Mandato antigo | abrir mandato com dados da versão antiga | 20 cadeiras e nomes intactos; painel e Resumo mostram a mesma contagem | MEQ-24 |
| E-16 | Arrastar para ligar (P3) | soltar A sobre B | B vira liderança de A | MEQ-12 |
| E-17 | Mover sem a equipe (P3) | Ctrl + soltar | lideradas passam ao líder anterior | MEQ-13 |
| E-18 | Desfazer remoção (P3) | remover e desfazer em 10 s | cadeira volta com dados | MEQ-14 |
| E-19 | Visão por área (P3) | escolher Comunicação | só Comunicação e a Chefia de ligação | MEQ-15 |

---

## Impacto técnico (resumo; o design vem depois da validação)

| Arquivo | Mudança prevista |
| ------- | ---------------- |
| `plataforma/lib/cadeiras.ts` (novo) | Funções puras: cadeiras por área, limites, ciclo, remoção com repasse, migração |
| `plataforma/lib/rotinas.ts`, `layoutOrg.ts`, `entrega.ts`, `exporta.ts` (novos) | Rotinas e cadeia, layout do organograma, sugestão do checklist, exportação SVG/PNG |
| `plataforma/ilhas/equipe/*` (novos) | Assistente (Tarefa 1), organograma com painel, rotinas e entrega (Tarefa 2); a `Ficha` deixa de ser montada na escalação |
| `plataforma/ilhas/Recomenda.tsx` + `lib/recomenda.ts` + gancho em `public/legacy/novos.js:387` | Desligados da Missão 2 (bandeiras ficam na Missão 3). Os arquivos ficam no disco: estão sem commit e a decisão de apagar é do usuário |
| `plataforma/public/legacy/novos.js` | Único arquivo do legado alterado (AD-003): substitui `Comp.funcoes` pela ilha do assistente, reescreve os textos das duas tarefas e troca os contadores de cargos (`temConteudo`, `estadoTxt`, Resumo) |
| `plataforma/public/painel.html:807,1149` | Conta cadeiras ativas em vez de `CARGOS_EQUIPE.length` |
| `package.json`, `playwright.config.ts`, `app/teste-equipe/` | Playwright (Chromium) e rota de teste que monta as ilhas sem login, só fora de produção |

---

## Success Criteria

- [ ] Um chefe de gabinete novo chega ao produto final (4 blocos) em até 15 minutos, sem apoio.
- [ ] Todos os 24 requisitos têm teste citado no plano acima e verde.
- [ ] Um mandato com dados da versão antiga abre sem perder nenhum campo (T-21, E-15).
- [ ] Todas as ações do organograma funcionam só com teclado.
- [ ] A Missão 2 funciona em 360 px sem rolagem horizontal.
