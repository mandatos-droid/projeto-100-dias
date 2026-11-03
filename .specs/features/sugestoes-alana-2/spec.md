# Sugestões da Alana, rodada 2 (tabela `sugestoes`, #14–#59, 29/10–03/11/2026) Specification

Texto original de cada pedido: [sugestoes-origem.md](sugestoes-origem.md). O ID `SUG-NN` de cada requisito é o `id` da tabela. Rodada 1 (#1–#13): `.specs/features/sugestoes-alana/`.

## Problem Statement

Em 29/10 e 02–03/11 a Alana (Legisla) abriu 46 pedidos no app, todos pendentes. Eles pedem: textos e comandos novos no Mapa Político (Missão 1), mais conteúdo teórico e navegação entre missões, passos em ordem, correções na tela de agendas (Missão 3), ajustes de Biblioteca, Ferramentas e Planejamento, e telas mais livres na Equipe (Missão 2) e em Comissões/Ações/Métricas (Missão 4). O Guia é autoaplicável (quem usa sozinho precisa entender sem mentor), então o texto e a ordem dos passos são parte do produto.

## Goals

- [ ] Os 46 pedidos (#14–#59) estão atendidos, ou têm decisão registrada em "Assumptions" quando o pedido está incompleto ou conflita com o Guia.
- [ ] Cada pedido atendido tem teste (unitário ou e2e) que falha sem a mudança.
- [ ] Ao final, as 46 linhas da tabela `sugestoes` estão marcadas como resolvidas.  (com go-ahead do usuário, por ser escrita em produção).

## Out of Scope

| Feature                                                          | Reason                                                                                                   |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Reescrever o exercício de Preditores (#35)                      | A Alana diz que o exercício "vai mudar totalmente"; falta o desenho novo. Só a explicação atual sai. |
| Redesenho completo do organograma e do layout da Missão 2 (#56) | A Alana propôs "pensar juntos"; entra só o que está listado nos ACs.                                  |
| Importar a planilha de planejamento (#41)                        | A Alana entende que o Planejamento do app já é a planilha.                                             |
| `git push`, deploy e escrita em produção                     | Exigem go-ahead à parte.                                                                                |

---

## Assumptions & Open Questions

Cada linha é uma decisão que a spec tomou por falta de resposta. "Confirmed? n" pede resposta do usuário antes de implementar o bloco afetado.

| Assumption / decision                                                                                    | Chosen default                                                                                                                                                                 | Rationale                                                                                                         | Confirmed? |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------- |
| #14 não diz qual sigla                                                                                  | Trocar toda sigla visível na tela `m1.persona/2` por extenso (ex.: "TSE" vira "Tribunal Superior Eleitoral" na primeira ocorrência da tela)                                | O pedido é "sem sigla" na página em que ela escreveu                                                            | n          |
| #32 chegou truncado ("Lembre-se de que")                                                                 | Nenhuma mudança; perguntar à Alana o que ela queria dizer                                                                                                                    | Não há requisito derivável                                                                                     | n          |
| #33 pergunta se o exercício de comissões na Missão 3 veio do Chico                                    | Remover da Missão 3 (`m3.bandeiras/3`) o exercício de comissões e espaços, mantendo-o só na Missão 4                                                                   | Ela diz que comissões é assunto só da Missão 4 e que o exercício não está no Guia                          | n          |
| #35 exercício de Preditores "vai mudar totalmente"                                                      | Remover só a explicação atual; o exercício em si fica como está até haver desenho novo                                                                                   | Evita apagar o que ainda funciona                                                                                 | n          |
| #36 "Legado só na mentoria; pode pular na imersão?"                                                    | Na imersão o Guia pula a etapa Legado (`m3.legado`) e segue de Agendas direto para Preditores; fora da imersão a etapa continua                                            | Ela pergunta se há problema; sem objeção técnica conhecida. Precisa confirmar como o app distingue "imersão" | n          |
| #24 pede varredura de conteúdo teórico faltando "em todas as missões"                                 | Comparar a abertura de cada missão no Guia do Word (`contexto inicial/`) com `conteudo.js` e trazer o que faltar; o Word é a fonte e só o que faltar entra              | Os textos do Guia só mudam de propósito (hashes de `tests/legado-m*.test.ts`)                                 | n          |
| #45 número do plano "favorece quem bate só uma meta"                                                   | O percentual de atingimento passa a ponderar cada meta pelo seu peso no total de metas ativas (metas × 100 / total)                                                           | Ela suspeita de erro e diz que talvez seja por ter só uma meta; fórmula exata não foi dada                     | n          |
| #43 "gradiente melhor do atingimento"                                                                    | Escala em passos de 10% (0%, 10%, … 100%)                                                                                                                                     | É a lista que ela escreveu                                                                                       | y          |
| #56 "escopo megalomaníaco", layout não alterável, imprimir só o organograma, visualização estreita | Entram os 4 pontos como AC (reduzir escopo padrão, alterar layout, imprimir só o organograma, visualização larga); o desenho exato do escopo menor fica para a fase Design | Ela pediu para pensar juntos                                                                                      | n          |
| #57 "caixas clicáveis" em vez de lista                                                                  | Escolhas da Missão 2 Gestão viram caixas clicáveis (chips); quais campos migram fica para a fase Design                                                                     | Pedido genérico                                                                                                  | n          |
| #53 relacionar registros a metas                                                                         | Cada registro de Ações pode apontar para uma ou mais metas do planejamento ativo; o vínculo alimenta o atingimento                                                          | Ela diz que "ajuda a alimentar as evidências de atingimentos"                                                    | n          |
| Mudanças de texto do Guia (#15, #17, #19, #23, #37, #38, #39, #46–#48, #50)                            | Entram por override em arquivo escrito à mão (`novos.js`, `m2.js`, `m3.js`, `m4.js`), conforme AD-003, com hashes dos testes de legado atualizados de propósito     | Os arquivos extraídos são sobrescritos                                                                          | y          |
| Marcar as linhas como resolvidas                                                                         | Só depois de cada bloco commitado e com go-ahead                                                                                                                              | Escrita em produção                                                                                             | y          |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Mapa Político com dados automáticos e perguntas novas (#14–#23) ⭐ MVP

**User Story**: Como pessoa que usa o Guia sozinha, quero que o Mapa Político mostre os dados prontos e me peça só a análise, em etapas bem marcadas, para analisar em vez de pesquisar.

**Why P1**: É a primeira missão; a Alana abriu 10 pedidos aqui no mesmo dia.

**Acceptance Criteria**:

1. SUG-14: The system SHALL exibir na tela `m1.persona/2` todos os termos por extenso, sem sigla.
2. SUG-15: WHEN a pessoa abre `m1.persona/2` THEN the system SHALL mostrar a instrução "Analise os dados dos pleitos em que a liderança parlamentar concorreu e que são apresentados abaixo." seguida dos dados dos pleitos.
3. SUG-15: WHEN a pessoa abre `m1.persona/2` THEN the system SHALL oferecer duas opções mutuamente exclusivas: "quero subir meus próprios dados e análises sobre os pleitos que a liderança parlamentar concorreu e desconsiderar os dados acima" e "aceito os dados apresentados acima e quero utilizá-los em formato de resumo, no relatório final do Mapa Político".
4. SUG-15: WHEN a pessoa abre `m1.persona/2` THEN the system SHALL mostrar uma caixa de texto com o comando "A partir dos dados acima, faça uma análise e transcreva-a abaixo" e as cinco perguntas da Alana (fatores de sucesso e insucesso; relação com o Partido; aprendizados; grupos sociais e agendas defendidas; promessas de campanha do último pleito).
5. SUG-16: WHEN a pessoa abre `m1.persona/3` THEN the system SHALL abrir, depois do texto "Mapeie", duas caixas: "Elenque quais são as 4 principais conquistas e entregas que o mandato deseja ter alcançado antes do fim da legislatura?" e "Qual é o próximo cargo que a liderança parlamentar deseja ocupar?".
6. SUG-17: WHEN a pessoa abre `m1.conjuntura` THEN the system SHALL mostrar a instrução "Identifique quem são os/as parlamentares eleitos(as) nesta legislatura, a partir dos dados expostos abaixo. Em seguida, faça uma análise sobre o que esperar dos colegas e das possíveis alianças." sem o trecho "Quando passarem-se os 100 dias...".
7. SUG-17: WHEN a pessoa abre `m1.conjuntura` THEN the system SHALL abrir, abaixo do mapa, duas caixas de texto: parcerias e concorrentes potenciais (considerando região, agendas, perfil pessoal e disputa partidária) e pontes não óbvias (espaços de convergência por consensos mínimos, nomes não óbvios).
8. SUG-18: WHEN a pessoa abre `m1.conjuntura` THEN the system SHALL mostrar a tabela de eleitos completa, sem rolagem interna vertical nem horizontal.
9. SUG-19: WHEN a pessoa abre `m1.conjuntura/1` THEN the system SHALL mostrar, nesta ordem: a pergunta em negrito, o texto "A análise da quantidade de cargos… é fundamental para compreensão da conjuntura política em que a liderança parlamentar está inserida.", os dados, e a caixa de texto com o comando "A partir dos dados apresentados acima, e de outros que você possa ter pesquisado, faça uma análise destacando o que mais te chama a atenção e como o mandato deve agir a partir desta conjuntura."
10. SUG-19: WHERE um exercício do Mapa Político já traz dados automáticos THEN the system SHALL aplicar o mesmo padrão da SUG-19 (pergunta, texto, dados, caixa de análise).
11. SUG-20: WHEN a pessoa abre `m1.conjuntura/1` THEN the system SHALL mostrar a pergunta mais abrangente da SUG-19 antes das perguntas que a Alana aprovou ("podemos manter").
12. SUG-21: WHILE a pessoa está no Mapa Político the system SHALL exibir as 4 subetapas rotuladas "A Persona", "A Conjuntura", "As Oportunidades e Ameaças" e "As Fragilidades e Fortalezas", com a atual destacada, e uma transição visível ao mudar de uma para outra.
13. SUG-22: WHEN a pessoa abre `m1.frag` THEN the system SHALL mostrar o comando e a atividade na mesma página.
14. SUG-23: WHEN a pessoa abre `m1.frag/2` THEN the system SHALL mostrar na mesma página, depois do checklist, o bloco "Tornando fragilidades em fortalezas!" com o texto completo da Alana e um link para a Biblioteca.

**Independent Test**: Abrir `#/m/1` e percorrer as telas `persona/2`, `persona/3`, `conjuntura`, `conjuntura/1`, `frag`, `frag/2` conferindo textos e ordem.

---

### P1: Passos em ordem e navegação entre missões (#24, #25, #30) ⭐ MVP

**User Story**: Como pessoa que faz o Guia sem mentor, quero ver os passos um de cada vez, na ordem, e passar de uma missão para a seguinte pela capa, para não me perder.

**Why P1**: Afeta todas as missões e o Guia é autoaplicável.

**Acceptance Criteria**:

1. SUG-24: WHEN a abertura de uma missão no Guia do Word tem conteúdo teórico ausente em `conteudo.js` THEN the system SHALL exibir esse conteúdo na capa/parte teórica da missão.
2. SUG-25: WHEN a pessoa clica no botão do último exercício de uma missão THEN the system SHALL abrir a capa da missão seguinte (com a parte teórica), e o botão SHALL se chamar "Ir para Missão N" com N o número da seguinte.
3. SUG-30: WHERE um exercício tem instruções em passos (Primeiro, Segundo, Terceiro passo) THEN the system SHALL mostrar um passo por vez, com o rótulo "Primeiro passo:" seguido do exercício correspondente.
4. SUG-30: WHILE o passo atual não está cumprido the system SHALL manter ocultos e inacessíveis os passos seguintes.
5. SUG-30: WHEN a pessoa cumpre o passo atual THEN the system SHALL revelar o seguinte, em todas as missões.

**Independent Test**: Percorrer o último exercício da Missão 1 e ver a capa da Missão 2; abrir um exercício com passos e ver só o primeiro.

---

### P1: Tela de agendas (Missão 3) (#26–#29, #31, #33, #37–#39) ⭐ MVP

**User Story**: Como equipe, quero escolher, priorizar e transformar agendas em metas sem palavras antigas, botões fora de lugar ou exercícios que não pertencem à missão.

**Why P1**: Foi a tela mais usada e voltou com os mesmos pedidos.

**Acceptance Criteria**:

1. SUG-26: The system SHALL usar "agenda(s)" no lugar de "bandeira(s)" em todo texto visível a partir de `m3.bandeiras` (rótulos, placeholders, avisos, `aria-label` e título da página).
2. SUG-27: WHEN a pessoa abre `m3.bandeiras` THEN the system SHALL mostrar a lista de agendas para seleção depois da instrução.
3. SUG-28: The system SHALL NOT mostrar o botão "Remover" nas agendas da etapa de ranking.
4. SUG-28: WHEN a pessoa termina o ranking THEN the system SHALL mostrar, depois dele, a seleção das agendas priorizadas.
5. SUG-29: WHEN a pessoa abre `m3.bandeiras/1` THEN the system SHALL listar todas as agendas levantadas nas etapas anteriores, todas já marcadas.
6. SUG-31: WHEN o ranking automático é calculado THEN the system SHALL permitir ter de 1 a 3 agendas prioritárias, sem pré-selecionar as três de maior nota.
7. SUG-31: The system SHALL NOT usar a palavra "sugerida" no ranking.
8. SUG-33: The system SHALL NOT exibir exercício de comissões em `m3.bandeiras/3` (ver Assumptions).
9. SUG-37: WHEN a pessoa abre `m3.metas` THEN the system SHALL mostrar "Serão criadas até 9 metas" e SHALL trocar a primeira ocorrência de "garantindo" por "fazendo com que", de modo que "garantindo" e "garantem" não apareçam juntos.
10. SUG-38: WHEN a pessoa marca "Cabe na capacidade…" em `m3.metas/1` THEN the system SHALL marcar também os critérios temporal e alcançável.
11. SUG-38: WHEN a pessoa abre `m3.metas/1` THEN the system SHALL mostrar as frases "Cabe na temporalidade dos 100 Primeiros dias?" e "O mandato dispõe de meios realistas para alcançá-la?", marcando o temporal e o alcançável respectivamente quando cada uma é marcada.
12. SUG-39: WHEN a pessoa abre `m3.metas/1` THEN the system SHALL mostrar o quadro como fechado, com o título "Para ir além! Caso já tenha resolvido a Missão 2 ou caso queira destrinchar esta meta em tarefas menores."

**Independent Test**: Percorrer `#/m/3` de `bandeiras` até `metas/1` conferindo palavras, ordem e checks.

---

### P2: Legado e Preditores na Missão 3 (#34, #35, #36)

**User Story**: Como equipe em mentoria ou em imersão, quero ver Legado e Preditores só como o Guia prevê.

**Why P2**: Depende de confirmações da Alana (Assumptions).

**Acceptance Criteria**:

1. SUG-34: WHEN a pessoa abre `m3.legado/1` THEN the system SHALL mostrar todas as opções à vista, sem barra de rolagem e sem opção escondida.
2. SUG-35: The system SHALL NOT exibir a explicação atual do exercício em `m3.preditores`.
3. SUG-36: WHILE a pessoa está em imersão the system SHALL pular a etapa Legado e seguir de Agendas para Preditores.

**Independent Test**: Abrir `m3.legado/1` e contar as opções visíveis sem rolar; abrir `m3.preditores`.

---

### P2: Biblioteca, Ferramentas e Planejamento (#40–#45, #54)

**User Story**: Como equipe, quero achar conteúdos e ferramentas por sumário e chegar ao Planejamento rapidamente.

**Why P2**: Melhora o uso diário depois que o Guia está concluído.

**Acceptance Criteria**:

1. SUG-40: WHEN a pessoa abre `#/biblioteca` THEN the system SHALL mostrar um sumário clicável, e SHALL mostrar o conteúdo de um item só ao clicar nele.
2. SUG-40: WHERE um conteúdo foi recomendado por missões THEN the system SHALL listar essas missões junto ao item.
3. SUG-41: WHEN a pessoa abre `#/ferramentas` THEN the system SHALL listar as ferramentas em ordem alfabética, cada uma com link que abre o conteúdo e referência às missões.
4. SUG-41: The system SHALL NOT oferecer upload de planilha de planejamento (ver Out of Scope).
5. SUG-42: The system SHALL mostrar o link "Planejamento" no cabeçalho, perto do nome da deputada, em todas as telas do Guia.
6. SUG-43: WHEN a pessoa informa o atingimento de uma meta em `#/plano` THEN the system SHALL oferecer os níveis 0%, 10%, 20%, …, 100%.
7. SUG-44: WHEN a pessoa abre `#/plano` THEN the system SHALL mostrar o botão "Voltar ao planejamento 1".
8. SUG-45: WHEN o percentual global de atingimento é calculado THEN the system SHALL ponderar cada meta pelo seu peso no total de metas ativas, de modo que atingir uma de quatro metas dê 25% e não 100% (ver Assumptions).
9. SUG-54: WHEN a pessoa chega a `#/plano` a partir da Missão 5 ("Garanta o avanço") THEN the system SHALL mostrar um botão que volta à Missão 5 no ponto em que ela estava.

**Independent Test**: Abrir `#/biblioteca`, `#/ferramentas`, `#/plano` com 4 metas e 1 atingida; conferir 25%.

---

### P2: Missão 2 · Funções e Gestão (#55–#59)

**User Story**: Como equipe, quero montar a estrutura do gabinete do meu jeito, sem ficar presa ao modelo sugerido.

**Why P2**: A Alana vê o modelo atual como limitante.

**Acceptance Criteria**:

1. SUG-55: WHEN a pessoa está em `m2.funcoes` THEN the system SHALL oferecer um botão "Adicionar" que cria um cargo novo, inclusive repetido (ex.: dois assessores de Articulação Política).
2. SUG-58: WHEN a pessoa está em `m2.funcoes` THEN the system SHALL permitir criar uma área nova com nome livre.
3. SUG-59: WHEN a pessoa abre `m2.funcoes` THEN the system SHALL perguntar, em uma caixa, quantos assessores o mandato terá no total, em vez de mostrar o modelo pronto.
4. SUG-56: WHEN a pessoa abre `m2.gestao` THEN the system SHALL propor um escopo inicial reduzido e SHALL permitir alterar o layout do organograma.
5. SUG-56: WHEN a pessoa imprime em `m2.gestao` THEN the system SHALL permitir imprimir só o organograma.
6. SUG-56: WHILE a pessoa vê o organograma the system SHALL usá-lo na largura da tela, sem visualização estreita.
7. SUG-57: WHEN a pessoa preenche dados em `m2.gestao` THEN the system SHALL oferecer as escolhas em caixas clicáveis, não em lista.

**Independent Test**: Abrir `#/m/2/m2.funcoes`, adicionar dois cargos iguais e uma área nova; abrir `m2.gestao` e imprimir.

---

### P2: Missão 4 · Comissões, Ações e Métricas (#46–#53)

**User Story**: Como equipe, quero registrar movimentos, ações e métricas com datas, textos livres e vínculo às metas.

**Why P2**: Completa a lista da Alana; depende de modelo de dados (vínculo a metas, data por movimento).

**Acceptance Criteria**:

1. SUG-46: The system SHALL chamar a opção de Relatoria em `m4.comissoes/1` de "Conquista de Relatoria Relevante".
2. SUG-47: WHEN a pessoa abre `m4.comissoes/1` THEN the system SHALL mostrar "Ordem de tudo o que o mandato precisa fazer para alcançar este objetivo [selecionar até 4 movimentos]:" e SHALL limitar a 4 movimentos.
3. SUG-47: WHEN a pessoa seleciona um movimento THEN the system SHALL pedir uma data para ele.
4. SUG-48: WHEN a pessoa abre `m4.comissoes/1` THEN the system SHALL oferecer o movimento "Articular com a Presidência da Casa".
5. SUG-49: WHEN a pessoa abre qualquer aba de `m4.acoes/1` THEN the system SHALL mostrar um campo livre de preenchimento.
6. SUG-52: WHEN a pessoa abre `m4.acoes/1` THEN the system SHALL oferecer as opções "a. detalhar em formato de resumo" (só uma caixa de texto) e "b. detalhar em formato de registro completo" (todos os campos atuais).
7. SUG-53: WHEN a pessoa salva um registro em `m4.acoes/1` THEN the system SHALL permitir associá-lo a uma ou mais metas do planejamento ativo.
8. SUG-50: WHEN a pessoa abre `m4.metricas/1` THEN the system SHALL oferecer as opções "Registrar o que aconteceu esta semana ou nos últimos 15 dias" e "Registrar o que aconteceu este mês".
9. SUG-51: WHEN a pessoa vê o último registro de `m4.metricas/1` THEN the system SHALL mostrar a data completa (dd/mm/aaaa) e SHALL NOT mostrar rótulos como "w".

**Independent Test**: Abrir `#/m/4`, selecionar 5 movimentos (só 4 aceitos), preencher datas; salvar uma ação em modo resumo vinculada a uma meta.

---

## Edge Cases

- IF a pessoa já preencheu dados nas telas antigas do Mapa Político THEN the system SHALL manter as respostas salvas no mesmo lugar e SHALL NOT apagá-las ao mudar o layout.
- IF a pessoa escolhe "subir meus próprios dados" em `m1.persona/2` THEN the system SHALL ocultar os dados automáticos nessa análise e SHALL manter a caixa de texto.
- IF `D.metas` está vazio THEN the system SHALL mostrar 0% de atingimento global em `#/plano`.
- IF a pessoa adiciona um cargo sem nome em `m2.funcoes` THEN the system SHALL recusar e SHALL manter o foco no campo de nome.
- WHEN a pessoa seleciona o 5º movimento em `m4.comissoes/1` THEN the system SHALL manter os 4 anteriores e mostrar o aviso "Escolha até 4 movimentos".

---

## Requirement Traceability

| Requirement ID | Story                    | Phase | Status  |
| -------------- | ------------------------ | ----- | ------- |
| SUG-14         | P1: Mapa Político       | -     | Pending |
| SUG-15         | P1: Mapa Político       | -     | Pending |
| SUG-16         | P1: Mapa Político       | -     | Pending |
| SUG-17         | P1: Mapa Político       | -     | Pending |
| SUG-18         | P1: Mapa Político       | -     | Pending |
| SUG-19         | P1: Mapa Político       | -     | Pending |
| SUG-20         | P1: Mapa Político       | -     | Pending |
| SUG-21         | P1: Mapa Político       | -     | Pending |
| SUG-22         | P1: Mapa Político       | -     | Pending |
| SUG-23         | P1: Mapa Político       | -     | Pending |
| SUG-24         | P1: Passos e navegação | -     | Pending |
| SUG-25         | P1: Passos e navegação | -     | Pending |
| SUG-26         | P1: Agendas              | -     | Pending |
| SUG-27         | P1: Agendas              | -     | Pending |
| SUG-28         | P1: Agendas              | -     | Pending |
| SUG-29         | P1: Agendas              | -     | Pending |
| SUG-30         | P1: Passos e navegação | -     | Pending |
| SUG-31         | P1: Agendas              | -     | Pending |
| SUG-33         | P1: Agendas              | -     | Pending |
| SUG-34         | P2: Legado e Preditores  | -     | Pending |
| SUG-35         | P2: Legado e Preditores  | -     | Pending |
| SUG-36         | P2: Legado e Preditores  | -     | Pending |
| SUG-37         | P1: Agendas              | -     | Pending |
| SUG-38         | P1: Agendas              | -     | Pending |
| SUG-39         | P1: Agendas              | -     | Pending |
| SUG-40         | P2: Biblioteca e Plano   | -     | Pending |
| SUG-41         | P2: Biblioteca e Plano   | -     | Pending |
| SUG-42         | P2: Biblioteca e Plano   | -     | Pending |
| SUG-43         | P2: Biblioteca e Plano   | -     | Pending |
| SUG-44         | P2: Biblioteca e Plano   | -     | Pending |
| SUG-45         | P2: Biblioteca e Plano   | -     | Pending |
| SUG-46         | P2: Missão 4            | -     | Pending |
| SUG-47         | P2: Missão 4            | -     | Pending |
| SUG-48         | P2: Missão 4            | -     | Pending |
| SUG-49         | P2: Missão 4            | -     | Pending |
| SUG-50         | P2: Missão 4            | -     | Pending |
| SUG-51         | P2: Missão 4            | -     | Pending |
| SUG-52         | P2: Missão 4            | -     | Pending |
| SUG-53         | P2: Missão 4            | -     | Pending |
| SUG-54         | P2: Biblioteca e Plano   | -     | Pending |
| SUG-55         | P2: Missão 2            | -     | Pending |
| SUG-56         | P2: Missão 2            | -     | Pending |
| SUG-57         | P2: Missão 2            | -     | Pending |
| SUG-58         | P2: Missão 2            | -     | Pending |
| SUG-59         | P2: Missão 2            | -     | Pending |

**Coverage:** 45 requisitos mapeados a 7 histórias; #32 fica sem requisito até a Alana completar o pedido (ver Assumptions). 0 mapeados a tasks (fase Tasks ainda não rodou).

---

## Success Criteria

- [ ] As 45 linhas com requisito têm teste que passa; #32 tem resposta registrada.
- [ ] `npm test` e `npm run test:e2e` passam, e `tsc` não acusa erros.
- [ ] Nenhuma tela alterada perde resposta já salva por usuário (Edge Cases).
- [ ] As linhas #14–#59 de `sugestoes` estão marcadas como resolvidas, com go-ahead.
