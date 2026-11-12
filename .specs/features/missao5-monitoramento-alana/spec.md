# Missão 5 · Monitoramento e Feedback conforme a Alana — Specification

Origem: sugestões #124 a #131 da Alana (tabela `sugestoes`, páginas `#/plano`, `#/m/5/m5.monit` e `#/m/5/m5.feedback`).
Protótipo navegável com a UI real: [proposta-alana-tela.html](../missao5-avanco/proposta-alana-tela.html).
Complementa a spec [missao5-avanco](../missao5-avanco/spec.md); não a substitui.

## Problem Statement

Hoje o Monitoramento da Missão 5 pede, para cada meta, 6 campos em 3 meses, e esses dados não movem nenhum atingimento. A Alana não entendeu para onde eles vão (#125) e só depois achou, por conta própria, que o atingimento se registra no Planejamento (#127). O Feedback, por sua vez, não diz quem pode ver os registros nem como a Chefia de Gabinete os usa.

## Goals

- [ ] Quem abre o Monitoramento entende, sem ajuda, que o monitoramento é voltar ao Planejamento, registrar o quanto cada meta andou (percentual dotodo) e então resumir o mês na Missão 5.
- [ ] O Planejamento tem um botão que leva ao Monitoramento, fechando o ciclo de ida e volta.
- [ ] Cada meta tem uma única caixa de texto de detalhamento no Monitoramento, no lugar dos 6 campos × 3 meses.
- [ ] O Feedback abre com a orientação da Alana, registra 4 informações por conversa e deixa claro quem pode ver.

## Out of Scope

| Feature                                                 | Reason                                                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Mudar o cálculo de atingimento                         | O percentual já se registra na aba Planejamento (status em passos de 10%); a Alana só quer que isso fique claro (#127) |
| Remover as opções de objetivos do Planejamento (#126) | É outro assunto da Alana, sobre a conversão de objetivos no guarda-chuva da Legisla; tem spec própria                 |
| Resumo do preenchimento (#102)                          | Decisão do Pedro em aberto, fora desta spec                                                                             |
| Lembretes e notificações                              | Já fora de escopo na spec missao5-avanco                                                                                |
| Aprovação ou assinatura das conversas de feedback     | Não foi pedido                                                                                                          |

## Assumptions & Open Questions

Premissas de base:

| Assumption / decision            | Default                                                                               | Rationale                                             |
| -------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Onde o percentual é registrado  | Continua no seletor de status da meta, na aba Planejamento                            | Já existe, em passos de 10% (`lib/atingimento.ts`) |
| Onde o texto do mês é guardado | Nova chave por meta e por mês em `D.campos` (ex.: `mon2.<idMeta>.<mes>`)                                 | Mesma fonte de dados do Guia, sem tabela nova         |
| Textos do Guia                   | Intocáveis em `conteudo.js` (AD-003); trocas por gancho em `public/legacy/m5.js` | Regra do projeto                                      |
| Textos da Alana                  | Copiados como ela escreveu                                                            | Ela é a dona do conteúdo pedagógico                |

### Decisões tomadas (respostas do Pedro)

| #   | Decisão | Efeito na spec |
| --- | ------- | -------------- |
| Q1  | Uma caixa por meta **e por mês** (Mês 1, 2, 3), cada uma em sanfona | História "Uma caixa por meta e por mês"; mantém o histórico |
| Q2  | Descartar os campos antigos `mon.*`. Só o Pedro e a chefia usam a plataforma hoje | Sem migração e sem seção "Registros anteriores" |
| Q3  | O Resumo do Preenchimento passa a listar o texto novo, por meta e por mês | História P2 |
| Q4  | O botão do Planejamento leva ao Monitoramento já rolado até a meta que o usuário estava vendo | Ver história "Botão de volta no Planejamento" |
| Q5  | Mantém o percentual só leitura no cartão da meta, com link "alterar" | Critério na história da caixa |
| Q6  | Só o texto de orientação, sem bloquear nada. "Acesso restrito" é texto da Alana e não tem relação com os papéis de usuário (coordenação, assessoria, leitura) | Sem mudança em acesso, papéis ou RLS |
| Q7  | Continua qualquer pessoa com acesso editando, mas o texto usa as palavras da Alana (Chefia de Gabinete, liderança parlamentar) | Texto copiado como escrito |
| Q8  | Campos separados para destaques (2) e ajustes (2), mais data e resumo do plano. Registros existentes não importam | Muda o formato de `Conversa` em `lib/feedback.ts`; sem migração |
| Q10 | O texto novo (#129) substitui a introdução atual do Monitoramento | Troca por gancho em `m5.js` |
| Q11 | As duas perguntas da #128 ficam como texto de apoio visível acima da caixa | Vai na linha de ajuda (`aj`) do campo |
| Q9  | A #130 vale só do parágrafo "Os registros a seguir..." em diante; "Pedro Salvar orientação antes da árvore do organograma" é anotação interna e fica de fora | Texto do Feedback |
| Q12 | O Monitoramento tem 3 meses (Mês 1 a 3) | Mantém o que há hoje; os sucessos do Planejamento seguem como na spec `missao5-avanco` |
| Q13 | Formulário: data; destaque 1; destaque 2; ajuste 1; ajuste 2; resumo do plano de ação. Todos os campos opcionais | Sem validação de obrigatoriedade |

### Perguntas em aberto

Nenhuma.

## User Stories

### P1: Explicação do Monitoramento ⭐ MVP

**User Story**: Como chefe de gabinete, quero que a tela do Monitoramento explique que o monitoramento acontece no Planejamento, para não preencher no lugar errado.

**Acceptance Criteria**:

1. WHEN o usuário abre `m5.monit` THEN a plataforma SHALL mostrar o texto da sugestão #129 e o passo a passo em duas etapas (registrar o percentual no Planejamento; resumir o mês na Missão 5).
2. WHEN o usuário aciona "Abrir Planejamento Estratégico" THEN a plataforma SHALL abrir `#/plano`.
3. THE plataforma SHALL manter intactos os textos de `conteudo.js` e aplicar a troca por gancho em `public/legacy/m5.js`.

**Independent Test**: Abrir o Monitoramento, ler o texto novo e chegar ao Planejamento com um clique.

### P1: Botão de volta no Planejamento ⭐ MVP

**User Story**: Como chefe de gabinete, quero um botão no Planejamento que leve ao Monitoramento, para registrar o detalhamento logo depois de atualizar o percentual.

**Acceptance Criteria**:

1. WHEN a aba Planejamento Estratégico abre THEN a plataforma SHALL mostrar o botão "Registrar detalhes sobre o atingimento das metas no Monitoramento" no topo, junto do atingimento total.
2. WHEN o usuário aciona o botão THEN a plataforma SHALL abrir `#/m/5/m5.monit` já rolado até a meta que ele estava vendo ou editando; se não houver meta em foco, abre no topo.
   - Cada meta da árvore ganha também o link "Detalhar no Monitoramento", que abre direto no cartão dela.
3. WHERE o planejamento aberto é um arquivado, a plataforma SHALL esconder o botão (arquivado é só leitura).

**Independent Test**: No Planejamento, clicar no botão e chegar ao Monitoramento.

### P1: Uma caixa por meta e por mês ⭐ MVP

**User Story**: Como chefe de gabinete, quero uma caixa por meta, em cada mês, para resumir como ela caminhou.

**Acceptance Criteria**:

1. WHEN o Monitoramento mostra as metas da Missão 3 THEN a plataforma SHALL mostrar, por meta, o número, o objetivo, o texto, o responsável e, por mês (Mês 1 a 3, em sanfona), uma caixa com o rótulo da sugestão #128 e, acima dela, as duas perguntas como texto de apoio visível.
2. WHEN o usuário digita na caixa THEN a plataforma SHALL gravar com o mesmo salvamento automático do Guia e mostrar "Salvo automaticamente".
3. WHEN a meta tem percentual no Planejamento THEN a plataforma SHALL mostrá-lo no cartão da meta, só leitura, com link "alterar" para o Planejamento.
4. IF não há metas na Missão 3 THEN a plataforma SHALL manter o aviso atual de que as metas aparecem ali quando forem escritas.
5. THE plataforma SHALL deixar de mostrar e de contar os campos antigos `mon.*`; o texto antigo não é migrado (decisão do Pedro).
6. WHEN o exercício tem texto em qualquer caixa THEN a plataforma SHALL contá-lo como em andamento, como `estadoEx` faz hoje.

**Independent Test**: Escrever na caixa de uma meta, recarregar e ver o texto de volta e o exercício como "Em andamento".

### P1: Orientação e registro do Feedback ⭐ MVP

**User Story**: Como chefe de gabinete, quero a orientação antes do mapa do organograma e 4 informações por conversa, para registrar cada ciclo do mesmo jeito.

**Acceptance Criteria**:

1. WHEN o usuário abre `m5.feedback` THEN a plataforma SHALL mostrar o texto da sugestão #130 antes do mapa do organograma.
2. WHEN o usuário abre o formulário de uma conversa THEN a plataforma SHALL pedir, com a ajuda da Alana em cada campo: data, 2 pontos de destaque, 2 pontos de ajuste e resumo do plano de ação, cada ponto em seu campo.
3. WHEN o usuário salva, edita ou apaga uma conversa THEN a plataforma SHALL atualizar na hora o "feitas X de Y" e o status feita/pendente.
4. THE plataforma SHALL mostrar o aviso de acesso restrito da Alana perto do mapa, só como texto: nada é bloqueado e qualquer pessoa com acesso ao mandato edita.
5. THE plataforma SHALL gravar os campos novos em `D.feedbacks` e continuar espelhando para o Resumo do Guia (`paraGuia`); conversas no formato antigo podem ficar sem os campos novos.

**Independent Test**: Registrar uma conversa para uma pessoa e ver "feita" e o contador subir.

### P2: Resumo do Preenchimento reflete o texto novo

**Acceptance Criteria**:

1. WHEN o Resumo do Preenchimento é aberto THEN a plataforma SHALL listar, por meta, o texto do Monitoramento, por mês.

## Edge Cases

- Meta removida na Missão 3 com texto de monitoramento: o texto fica guardado e some da tela.
- Meta congelada: continua aparecendo no Monitoramento, com o percentual "—".
- Mandato sem metas: o Monitoramento mostra só a explicação e o botão para o Planejamento.
- Planejamento arquivado (somente leitura): sem o botão novo e sem edição de percentual.
- Mandato novo (segundo planejamento): as caixas começam vazias; o texto do planejamento anterior fica no arquivado.

## Requirement Traceability

| ID     | Story                               | Origem           | Status  |
| ------ | ----------------------------------- | ---------------- | ------- |
| MON-01 | Explicação do Monitoramento       | #127, #129       | Done |
| MON-02 | Botão de volta no Planejamento     | #131             | Done |
| MON-03 | Uma caixa por meta e por mês        | #124, #125, #128 | Done |
| FBK-01 | Orientação e registro do Feedback | #130             | Done |
| MON-04 | Resumo reflete o texto novo         | #125             | Done |

## Success Criteria

- [ ] A Alana consegue dizer, sem ajuda, onde se registra o atingimento e onde se detalha o mês.
- [ ] O Monitoramento novo não mostra nem conta os campos antigos `mon.*`.
- [ ] Os testes de hash de `conteudo.js` (`tests/legado-m5.test.ts`) continuam passando.
