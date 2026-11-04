# Plataforma 100 Dias: o que foi entregue nas últimas rodadas

**Data:** 04/11/2026
**Origem dos pedidos:** sugestões enviadas pela Alana Portes (Legisla) dentro do próprio app e o documento de reestruturação das Missões 2 e 3.

## Resumo

| | |
|---|---|
| Pedidos atendidos | 8 na Missão 1, 8 na Missão 4 e a reestruturação das Missões 2 e 3 |
| Dados dos mandatos | Nenhuma resposta já salva foi perdida |
| Aprovação independente | Missão 1 e Missões 2 e 3: aprovadas. Missão 4: ainda sem verificação independente |
| Publicação | Não confirmada para as mudanças de 03 e 04/11 (ver "Pendências") |

Como ler as tabelas: **"Pronto"** significa feito e testado.

---

## 1. Missão 1 (Mapa Político): sugestões #16 a #23

A Alana pediu que o Mapa Político mostre os dados prontos e peça só a análise, em vez de mandar a pessoa pesquisar.

| # | Pedido | O que mudou para quem usa | Situação |
|---|---|---|---|
| 16 | Duas perguntas sobre o futuro da liderança | A pergunta única virou duas caixas. Respostas antigas foram mantidas como "conquistas". | Pronto |
| 17 | Legislatura: dados primeiro, depois "pontes não óbvias" | Os dados vêm antes. Entrou uma caixa de texto livre para as pontes. O trecho "agendas similares ou concorrentes" saiu. | Pronto |
| 18 | Tabela de eleitos inteira na tela | Sem rolagem interna. No "Brasil inteiro" (1.621 linhas) o botão "Mostrar mais" continua, senão o navegador trava. | Pronto |
| 19 | Caixa de análise depois dos dados | Em partido, território e social, a análise agora vem depois dos dados. O texto de partido foi reescrito. | Pronto |
| 20 | Só a pergunta abrangente na conjuntura do partido | As perguntas 5 e 6 saíram da tela. As respostas antigas ficam guardadas. | Pronto |
| 21 | Deixar claras as 4 etapas | Faixa no topo com Persona, Conjuntura, Oportunidades e Ameaças, e Fragilidades e Fortalezas. A etapa atual fica em destaque. | Pronto |
| 22 | Fragilidades numa página só | Comando, checklist, diagnóstico e bloco "Tornando fragilidades em fortalezas" ficaram juntos. | Pronto |
| 23 | Link para a Biblioteca | O bloco ganhou o link para a Biblioteca. | Pronto |
| extra | Resumo mais completo | O Resumo agora mostra o próximo cargo e as pontes não óbvias. | Pronto |

**Qualidade:** aprovado na verificação independente. Foram 532 testes automáticos passando e 20 testes de tela passando (1 falha esporádica de tempo que passou ao repetir). Lacunas pequenas: o texto exato da #23 é checado só por trechos, e uma resposta antiga de uma pergunta não tem teste.

## 2. Missão 4 (Capital Político): sugestões #46 a #53

A Alana testou as telas de comissões, ações dos 100 dias e acompanhamento da comunicação e pediu ajustes.

| # | Pedido | O que mudou para quem usa | Situação |
|---|---|---|---|
| 46 | Renomear "Relatoria" | Agora é "Conquista de Relatoria Relevante". Registros antigos aparecem marcados no botão novo. | Pronto |
| 48 | Novo movimento nas comissões | Entrou "Articular com a Presidência da Casa". | Pronto |
| 47 | Ordenar os movimentos com data | Escolhe até 4 movimentos, cada um com data, e a lista fica em ordem de data. | Pronto |
| 49 | Ação escrita pela própria pessoa | Cada frente tem "Outra ação (escrever)", que conta no progresso. | Pronto |
| 52 | Detalhar a ação em resumo ou completo | Duas opções ao marcar a ação: uma caixa de resumo ou os 5 campos. O Resumo do Guia mostra o texto. | Pronto |
| 53 | Ligar a ação a uma meta do planejamento | Cada ação marcada pode apontar para uma meta da Missão 3, e o vínculo aparece no Resumo. | Pronto (só a ligação) |
| 50 | Registrar a comunicação por semana, 15 dias ou mês | Dois botões novos: um para semana ou 15 dias, outro para o mês. | Pronto |
| 51 | Data certa do último registro | Aparece "em 04/11/2026" em vez de "2026-W45". O gráfico mensal surge com 2 ou mais meses. | Pronto |

**Qualidade:** esta rodada ainda não passou por verificação independente. Só há o registro de passagem de bastão.

## 3. Missões 2 e 3: reestruturação (03/11)

Resposta ao documento enviado pela Alana.

| Tema | O que mudou para quem usa | Situação |
|---|---|---|
| M2: tabela de equipe | Preenchida em ordem fixa: escopo, competências, cargo, pessoa, categoria e área. O número de pessoas define as linhas. | Pronto |
| M2: organograma | É gerado sozinho a partir da tabela. A liderança direta é calculada: Coordenação responde à Chefia, e as demais pessoas respondem à Coordenação da área. | Pronto |
| M2: rotinas | Quadro com 5 rotinas, editável, com data e horário. Aparece no planejamento final e sai em PDF junto com o organograma. | Pronto |
| M3: estratégia | Escolha de uma única estratégia (A, B ou C) e justificativa dos 3 preditores escolhidos e dos 2 não escolhidos. | Pronto |
| Vocabulário | "Objetivo Específico" virou "Objetivo Estratégico" em todo o produto. | Pronto |
| Dados antigos | Nada foi apagado. As telas antigas saíram, mas os dados ficam guardados. | Pronto |

**Qualidade:** aprovado na verificação independente. As 29 tarefas previstas foram concluídas.

---

## Pendências

| Item | Por quê | Quem decide |
|---|---|---|
| Marcar as sugestões #16 a #23 e #46 a #53 como "resolvidas" no sistema | Altera o ambiente de produção | Pedro |
| Publicar as mudanças (envio ao repositório e deploy na Vercel) | Não confirmado se as entregas de 03 e 04/11 já estão no ar | Pedro |
| Verificação independente da Missão 4 | Ainda não foi feita | Pedro |
| Usar as ações da Missão 4 como prova de que a meta foi atingida | Falta definir a regra: qual ação conta como sucesso? | Alana e equipe |
| Confirmar duas interpretações na Missão 4 | "Em todas as abas" foi lido como "em todas as frentes". "Últimos 15 dias" virou só uma janela para escolher a data. | Alana |
| Sugestões #33 e #61 (comissões na Missão 3) | Ficaram para a rodada da Missão 3 | Próxima rodada |
| Sugestão #60 (erro ao enviar sugestão) | É um problema do formulário de sugestões, não de uma missão | A definir |
