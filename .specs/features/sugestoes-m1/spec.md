# Sugestões da Missão 1 (Mapa Político): #16 a #23 Specification

Origem: tabela `sugestoes` do Supabase (lida pelo CLI em 2026-11-04), com os 8 prints em [prints/](prints/) (`s16.jpg` a `s23.jpg`, o número é o id) e os comentários do Pedro na tabela `sugestoes_comentarios`. Autora de todas: Alana Portes (Legisla). Telas são rotas do Guia (`#/m/1/...`). #14 e #15 já constam como resolvidas na tabela (o Pedro recusou a opção "subir meus próprios dados" no comentário #1) e ficam fora.

## Problem Statement

A Alana pediu que o Mapa Político (Missão 1) deixe de mandar a pessoa pesquisar e passe a mostrar os dados prontos e pedir só a análise. Pediu também perguntas novas na Persona e na Conjuntura, a tabela de eleitos inteira na tela, quatro etapas bem marcadas e a tela de Fragilidades numa página só. O Guia é autoaplicável: o texto e a ordem dos passos fazem parte do produto.

## Goals

- [ ] As 8 sugestões abertas (#16 a #23) estão atendidas, ou têm decisão registrada em "Assumptions".
- [ ] Cada requisito tem teste que falha sem a mudança.
- [ ] Nenhuma resposta já salva em `D.campos` ou `D.conj2` se perde.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| #14 e #15 (siglas e análise dos pleitos em `m1.persona/2`) | Já marcadas como resolvidas; o Pedro recusou a opção de subir dados próprios |
| Marcar #16 a #23 como resolvidas na tabela `sugestoes` | Escrita em produção: só com go-ahead |
| `git push` e deploy | Exigem go-ahead |
| Sugestões de outras missões (#24 em diante) | Pedido é só a Missão 1 |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| #20 "podemos manter [as perguntas 5 e 6 da tela de partido]; mas antes vale subir a pergunta mais abrangente" e o Pedro responde "vamos manter somente a que você sugeriu" | Em `m1.q5` só a pergunta abrangente fica visível. As seções 5 (relação com o partido) e 6 (desafios e oportunidades) saem da tela; `D.conj2.relacao`, `relacaoPq`, `desafios` e `oportunidades` continuam gravados | Decisão do Pedro no comentário #6; guardar o dado evita perda | n |
| #17 primeira caixa (parcerias e concorrentes): o Pedro diz que seleção tabula melhor que texto livre e que "agendas similares ou concorrentes" não é dado que temos | Sem caixa de texto para parceiros e concorrentes: a instrução manda marcar Parceiro/Concorrente na tabela (já existe). A frase "agendas similares ou concorrentes" sai | Comentários #3 e #4 do Pedro | n |
| #17 segunda caixa (pontes não óbvias): o Pedro pergunta se os status "aliado" e "concorrente" mudam | Caixa de texto livre `m1.q4b`; os status não mudam | Criar status novo mexe em Assentos, Resumo e painel; ele não decidiu | n |
| #19 pede o padrão "pergunta, texto, dados, caixa de análise" para "todos os exercícios com dados" | Vale para `m1.q5` (texto reescrito), `m1.q6` e `m1.q8` (texto mantido; só a caixa de análise vai para depois dos dados). `m1.q2` e `m1.q4` só têm dados e já seguem o padrão; `m1.q7` é preenchida pela pessoa, sem dado pronto | Só q5 tem texto novo ditado pela Alana | n |
| #19 texto "A análise da quantidade de cargos… [TODO O TEXTINHO ANTES]" | Frase única que preserva todos os temas do texto original (cargos na Casa, no território nacional e no domicílio; setoriais e diretórios; relação com o partido; desafios e oportunidades) e termina com "é fundamental para a compreensão da conjuntura política em que a liderança parlamentar está inserida." | O original está em forma de comando ("Contabilize…") | n |
| #16: a pergunta única `m1.q3` vira duas caixas | A primeira usa a chave `m1.q3` (resposta antiga vira "conquistas"); a segunda é `m1.q3b` | Não perde resposta salva | n |
| #21 "demarcar com clareza que são 4 coisas" | Faixa de 4 etapas (A Persona, A Conjuntura, As Oportunidades e Ameaças, As Fragilidades e Fortalezas) no topo de cada exercício da Missão 1, com a atual destacada; o exercício `m1.frag` passa a se chamar "As fragilidades e fortalezas" | A Alana lista os 4 nomes | n |
| #22 e #23: `m1.frag` numa página só | Ordem: comando, checklist de fragilidades, diagnóstico (já existente, hoje em "Para fechar"), bloco "Tornando fragilidades em fortalezas!". O texto do bloco é o da Alana com dois ajustes de digitação ("o que o mandato e a liderança ainda não dominam", "para ambos") | Ela diz "deixe tudo na página anterior" e que o bloco vem depois do checklist | n |
| #23 link da Biblioteca | Link para `#/biblioteca` | Rota existente do Guia | y |
| #18 "ver a tabela completa" | A tabela de eleitos do escopo escolhido aparece inteira, sem rolagem interna vertical nem horizontal. No escopo "Brasil inteiro" (1.621 linhas) o botão "Mostrar mais" continua | Renderizar 1.621 linhas de uma vez trava o navegador | n |
| Texto do Guia só muda de propósito (AD-003) | Ganchos novos em `public/legacy/m1.js` (arquivo à mão, carregado depois de `m5`), sem editar `conteudo.js` | `conteudo.js` é sobrescrito a cada extração | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Mapa Político com dados prontos e perguntas novas (#16 a #23) ⭐ MVP

**User Story**: Como pessoa que usa o Guia sozinha, quero ver os dados prontos e responder só a análise, em etapas bem marcadas, para analisar em vez de pesquisar.

**Why P1**: É a primeira missão; é o que as pessoas veem ao entrar.

**Acceptance Criteria**:

1. SUG-16: WHEN a pessoa abre `m1.persona/3` (pergunta 3, `m1.q3`) THEN the system SHALL mostrar, depois do texto "Mapeie", duas caixas de texto rotuladas "Elenque quais são as 4 principais conquistas e entregas que o mandato deseja ter alcançado antes do fim da legislatura?" (chave `m1.q3`) e "Qual é o próximo cargo que a liderança parlamentar deseja ocupar?" (chave `m1.q3b`), e SHALL NOT mostrar a caixa única antiga.
2. SUG-17: WHEN a pessoa abre `m1.conjuntura` (pergunta 1, `m1.q4`) THEN the system SHALL mostrar a instrução "Identifique quem são os/as parlamentares eleitos(as) nesta legislatura, a partir dos dados expostos abaixo. Em seguida, faça uma análise sobre o que esperar dos colegas e das possíveis alianças." sem o trecho "Quando passarem-se os 100 primeiros dias".
3. SUG-17: WHEN a pessoa abre `m1.conjuntura` (pergunta 1) THEN the system SHALL mostrar, abaixo da tabela de eleitos, a orientação para marcar Parceiro ou Concorrente considerando região, perfil pessoal e disputa partidária (sem "agendas similares ou concorrentes") e uma caixa de texto `m1.q4b` com a pergunta "E quais são as pontes não óbvias que podem ser construídas, a partir da criação de espaços de convergência que se baseiem em consensos mínimos e não necessariamente alinhamento completo? Elenque agora os nomes não óbvios, e que serão necessários para que as agendas e pautas avancem."
4. SUG-18: WHEN a pessoa abre `m1.conjuntura` (pergunta 1) com um estado selecionado THEN the system SHALL mostrar todas as linhas da tabela de eleitos desse estado, sem rolagem vertical nem horizontal dentro da tabela.
5. SUG-19: WHEN a pessoa abre `m1.conjuntura/1` (pergunta 2, `m1.q5`) THEN the system SHALL mostrar, nesta ordem: o título em negrito, o texto que termina em "é fundamental para a compreensão da conjuntura política em que a liderança parlamentar está inserida.", os dados (seções 1 a 4 da ilha) e a caixa `m1.q5` com o comando "A partir dos dados apresentados acima, e de outros que você possa ter pesquisado, faça uma análise destacando o que mais te chama a atenção e como o mandato deve agir a partir desta conjuntura."
6. SUG-19: WHEN a pessoa abre `m1.conjuntura/2` (`m1.q6`) ou `m1.oportunidades/1` (`m1.q8`) THEN the system SHALL mostrar a caixa de análise com o mesmo comando da SUG-19, depois dos dados.
7. SUG-20: WHEN a pessoa abre `m1.conjuntura/1` THEN the system SHALL NOT mostrar as seções "Que relação a liderança quer ter com o partido?" e "Desafios e oportunidades de expansão da relevância partidária", e SHALL manter gravados os valores já salvos nelas.
8. SUG-21: WHILE a pessoa está em qualquer exercício da Missão 1 THEN the system SHALL mostrar uma faixa com as 4 etapas "A Persona", "A Conjuntura", "As Oportunidades e Ameaças" e "As Fragilidades e Fortalezas", com a etapa atual marcada como atual (`aria-current="step"`).
9. SUG-22: WHEN a pessoa abre `m1.frag` THEN the system SHALL mostrar o comando e o checklist de fragilidades na mesma página, e o exercício SHALL ter um único passo.
10. SUG-23: WHEN a pessoa abre `m1.frag` THEN the system SHALL mostrar na mesma página, depois do checklist, o bloco "Tornando fragilidades em fortalezas!" com o texto completo da Alana e um link `#/biblioteca`, e SHALL NOT mostrar o passo "Para fechar" separado.

**Independent Test**: Abrir `#/m/1` e percorrer `persona/2`, `conjuntura`, `conjuntura/1`, `conjuntura/2`, `oportunidades/1` e `frag` conferindo textos, ordem e a faixa de etapas.

---

## Edge Cases

- IF a pessoa já respondeu `m1.q3`, `m1.q4`, `m1.q5` ou `m1.q6` antes THEN the system SHALL mostrar a resposta na caixa correspondente, sem apagar nada.
- IF a pessoa já usou as seções de relação e desafios de `m1.q5` THEN the system SHALL manter `D.conj2.relacao`, `relacaoPq`, `desafios` e `oportunidades` intactos.
- WHEN a pessoa abre o Resumo THEN the system SHALL mostrar `m1.q3b` e `m1.q4b` junto das respostas da Missão 1.
- IF o escopo da tabela de eleitos é "Brasil inteiro" THEN the system SHALL manter o botão "Mostrar mais".

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| SUG-16 | P1: Mapa Político | Done (T1) | Verified |
| SUG-17 | P1: Mapa Político | Done (T2) | Verified |
| SUG-18 | P1: Mapa Político | Done (T5) | Verified |
| SUG-19 | P1: Mapa Político | Done (T3) | Verified |
| SUG-20 | P1: Mapa Político | Done (T4) | Verified |
| SUG-21 | P1: Mapa Político | Tasks | Pending |
| SUG-22 | P1: Mapa Político | Tasks | Pending |
| SUG-23 | P1: Mapa Político | Tasks | Pending |

**Coverage:** 8 requisitos, 8 mapeados a tasks.

---

## Success Criteria

- [ ] Os 8 requisitos têm teste que passa; `npm test`, `npx tsc --noEmit` e os e2e da Missão 1 passam.
- [ ] Nenhuma resposta salva se perde.
