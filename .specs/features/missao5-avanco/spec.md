# Missão 5 · Garanta o avanço (reestruturação) Specification

## Problem Statement

O Planejamento Estratégico (Missão 3) não tem "sucesso mensal". A Missão 5 é só texto e formulários soltos: o feedback não usa o organograma da Missão 2, e não dá para criar um segundo planejamento depois dos 100 dias.

## Goals

- [ ] Cada meta tem sucessos mensais (Mês 1 a 4), editáveis na Missão 3 e visíveis na aba Planejamento.
- [ ] A tarefa de monitoramento leva direto ao Planejamento Estratégico.
- [ ] O feedback parte do mapa do organograma e registra cada conversa.
- [ ] Ao fim da Missão 5, e a qualquer momento, o mandato cria novos planejamentos sem perder os anteriores.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Lembretes e notificações dos sucessos | Exige calendário e envio; fica para a v2 |
| Feedback avaliado por IA | Custo e privacidade do gabinete |
| Mais de 4 meses por planejamento | Os 100 dias cabem em 4 meses |
| Editar um planejamento arquivado | Arquivado é só leitura por decisão |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale |
| --------------------- | -------------- | --------- |
| Meses do planejamento | Mês 1 a Mês 4 | 100 dias ≈ 3,3 meses; aprovado pelo usuário em "PODE EXECUTAR" |
| Atingimento da meta | Meta com sucessos usa a razão atingidos/total; sem sucessos, usa o status da meta como hoje | Aprovado pelo usuário; mantém metas antigas funcionando |
| Status do sucesso | Mesmos 4 status das metas (`lib/rumo.ts`) | Evita um segundo vocabulário |
| Novo planejamento | Mantém Legado, bandeiras, objetivos e preditores; metas começam vazias; usuário escolhe metas antigas para copiar | Aprovado pelo usuário |
| Onde ficam os dados | Sucessos em `D.metas[i].sucessos`; conversas em `D.feedbacks`; planos arquivados em `D.planos` | Mesma fonte de dados do Guia, sem tabela nova |
| Pessoas do feedback | Cadeiras ativas da Missão 2 via `lib/cadeiras.ts`; liderança direta = cadeira superior no organograma | Reaproveita o organograma |
| Textos da Missão 5 | Intocáveis no `conteudo.js` (AD-003); ganchos em `public/legacy/m5.js` | Regra do projeto |

Perguntas abertas: nenhuma. As 3 do rascunho foram resolvidas acima.

## User Stories

### P1: Sucesso mensal nas metas ⭐ MVP

**User Story**: Como chefe de gabinete, quero registrar sucessos mensais em cada meta, para acompanhar o avanço mês a mês.

**Why P1**: É a base do monitoramento da Missão 5.

**Acceptance Criteria**:

1. WHEN o usuário aciona "Adicionar sucesso" em uma meta THEN a plataforma SHALL criar um sucesso com mês (1 a 4), texto e status "Não concluída" e gravá-lo em `D.metas[i].sucessos`.
2. WHEN o usuário edita o texto, o mês ou o status de um sucesso THEN a plataforma SHALL gravar na hora.
3. WHEN o usuário remove um sucesso THEN a plataforma SHALL removê-lo e manter os demais.
4. WHEN a aba Planejamento Estratégico abre THEN a plataforma SHALL mostrar os sucessos dentro de cada meta, agrupados por mês, com o status de cada um.
5. WHEN uma meta tem ao menos um sucesso THEN a plataforma SHALL calcular o atingimento dela como sucessos atingidos dividido pelo total de sucessos.
6. IF uma meta não tem sucessos THEN a plataforma SHALL calcular o atingimento pelo status da meta, como antes.
7. IF `D.metas` vem de um mandato antigo, sem `sucessos` THEN a plataforma SHALL normalizar sem erro e sem apagar texto.

**Independent Test**: Adicionar 2 sucessos a uma meta, marcar 1 como atingido e ver 50% na aba Planejamento.

### P1: Monitoramento leva ao planejamento ⭐ MVP

**User Story**: Como chefe de gabinete, quero abrir o Planejamento Estratégico direto da tarefa de monitoramento.

**Why P1**: O acompanhamento mensal acontece no planejamento.

**Acceptance Criteria**:

1. WHEN a tarefa "O monitoramento do avanço das metas" abre THEN a plataforma SHALL mostrar os textos atuais sem alteração.
2. WHEN o usuário aciona "Abrir Planejamento Estratégico" THEN a plataforma SHALL navegar para `#/plano`.

**Independent Test**: Abrir a tarefa, conferir o texto e clicar no botão.

### P1: Primeiro ciclo de feedback pelo organograma ⭐ MVP

**User Story**: Como liderança, quero ver quantas pessoas devo dar feedback e registrar cada conversa a partir do organograma.

**Why P1**: É o pedido central da tarefa 2.

**Acceptance Criteria**:

1. WHEN a tarefa de feedback abre THEN a plataforma SHALL mostrar o mapa do organograma com cada liderança, o texto "dá feedback a N pessoas" e a contagem "feitas X de N".
2. WHEN o usuário clica em uma liderança THEN a plataforma SHALL listar as pessoas dela, cada uma marcada como "feita" ou "pendente".
3. WHEN o usuário clica em uma pessoa THEN a plataforma SHALL abrir o registro da conversa com data, pontos de destaque, pontos de ajuste e plano de ação.
4. WHEN o usuário salva a conversa THEN a plataforma SHALL gravá-la em `D.feedbacks`, marcar a pessoa como "feita" e atualizar a contagem da liderança.
5. WHEN o usuário edita ou apaga uma conversa THEN a plataforma SHALL gravar a mudança e atualizar as contagens.
6. IF a equipe da Missão 2 não tem cadeiras ativas THEN a plataforma SHALL mostrar um aviso com link para a Missão 2.
7. IF existem conversas no formato antigo (`pessoa`, `lider`, `data`, `pontos`, `encam`) THEN a plataforma SHALL aproveitá-las sem perder texto.
8. WHILE a tela tem largura de celular THE plataforma SHALL mostrar o mapa como lista vertical.

**Independent Test**: Com equipe montada, abrir uma liderança, registrar uma conversa e ver "feitas 1 de N".

### P1: Novos planejamentos ⭐ MVP

**User Story**: Como chefe de gabinete, quero criar um novo planejamento estratégico ao fim das 5 missões, ou quando eu quiser, sem perder os anteriores.

**Why P1**: É a funcionalidade mais relevante da tarefa 3.

**Acceptance Criteria**:

1. WHEN a tarefa "Calibragem e replanejamento" abre THEN a plataforma SHALL mostrar todos os textos e o checklist atuais e, ao final, o botão "Criar novo planejamento".
2. WHEN a aba Planejamento Estratégico abre THEN a plataforma SHALL mostrar o botão "Criar novo planejamento".
3. WHEN o usuário aciona "Criar novo planejamento" THEN a plataforma SHALL pedir confirmação e permitir escolher quais metas antigas copiar.
4. WHEN o usuário confirma THEN a plataforma SHALL guardar o planejamento atual em `D.planos`, manter Legado, bandeiras, objetivos e preditores e iniciar o novo com as metas escolhidas (sem sucessos copiados).
5. WHEN existe mais de um planejamento THEN a plataforma SHALL mostrar um seletor "Planejamento 1, 2, 3…" com o atual marcado.
6. WHEN o usuário abre um planejamento arquivado THEN a plataforma SHALL mostrá-lo somente para leitura.
7. WHEN o usuário cria o 2º, 3º ou mais planejamentos THEN a plataforma SHALL preservar cada anterior sem alteração.

**Independent Test**: Criar um 2º planejamento, abrir o 1º no seletor e conferir que está igual e sem edição.

## Edge Cases

- WHEN o usuário apaga todas as metas de um planejamento THEN a plataforma SHALL mostrar o estado vazio sem erro.
- WHEN a pessoa da conversa deixa de existir na Missão 2 THEN a plataforma SHALL manter a conversa e mostrá-la como "pessoa removida".
- IF o usuário cancela a confirmação de novo planejamento THEN a plataforma SHALL não alterar nada.

## Requirement Traceability

| Requirement ID | Story | Tasks | Status |
| -------------- | ----- | ----- | ------ |
| M5-01 | P1: Sucesso mensal (criar, editar, remover) | T1, T3 | Done |
| M5-02 | P1: Sucesso mensal (visão no Planejamento, atingimento, migração) | T2, T4 | Done |
| M5-10 | P1: Monitoramento (textos e link) | T6 | Done |
| M5-20 | P1: Feedback (mapa, lista, contagens, vazio, celular) | T7 a T10 | Done |
| M5-21 | P1: Feedback (registro, edição, formato antigo) | T7, T9 | Done |
| M5-30 | P1: Novos planejamentos (arquivar, copiar metas) | T12, T13 | Done |
| M5-31 | P1: Novos planejamentos (botões, seletor, leitura) | T14 a T16 | Done |

**Coverage:** 7 total, 7 mapped to tasks, 0 unmapped (todos Done)

## Success Criteria

- [x] Um sucesso criado na Missão 3 aparece na aba Planejamento e altera o atingimento da meta.
- [x] O feedback mostra "N pessoas" por liderança a partir da equipe da Missão 2.
- [x] Criar um novo planejamento não altera nenhum dado do anterior.
- [x] Os textos da Missão 5 no `conteudo.js` ficam byte a byte iguais.
