# Missão 1 (Mapa Político): sugestões da Alana reunidas

Origem: tabela `sugestoes` do Supabase (projeto Projeto 100 Dias), lida pelo CLI (`supabase db query --linked`) em 2026-11-10, filtrando `pagina like '#/m/1%'` e autora Alana Portes Legisla. Inclui os comentários do Pedro em `sugestoes_comentarios`. Os prints das sugestões novas estão em [prints/](prints/) (`s<id>.jpg`); os das antigas (#16 a #23) estão em [../sugestoes-m1/prints/](../sugestoes-m1/prints/).

Total: **28 sugestões da Alana** na Missão 1 (#13 a #23 e #96 a #112). **12 abertas** (todas de 10/11), 16 marcadas como resolvidas na tabela.

Excluídas: #1 (teste do Pedro) e #62 a #94 (anotações do próprio Pedro, todas resolvidas).

---

## A. Abertas (10/11/2026): o que falta fazer

| # | Tela | Pedido | Print |
| - | ---- | ------ | ----- |
| 97 | Missão 1 (geral) | Trocar tudo para "Liderança Parlamentar" (evitar flexão de gênero). É o mesmo pedido do #13, que voltou: sobraram trechos | sem texto novo |
| 98 | Missão 1 (geral) | A mensagem de fechamento "PRONTO: Com base neste Mapa Político, você tem as informações necessárias para começar a rodar o mandato…" deve aparecer no **cumprimento da missão inteira** (ao concluir as 4 etapas), não numa etapa só | s98 |
| 99 | `m1.persona` | O bloco "Elencamos as oito perguntas-chave… Pesquise, reflita, responda-as e agrupe todos os dados em formato de relatório" + a DICA ("Depois de pronto, apresente o relatório…") não é sobre a persona, é sobre o Mapa Político como um todo: tirar da Persona e levar para a abertura da missão. Pedro perguntou "qual é o comando?" (sem resposta ainda) | s99 |
| 103 | `m1.persona/3` | Retirar a frase que começa com "Mapeie" (quais são os pontos de chegada…). Na pergunta "Qual é o próximo cargo…" incluir a opção **"Não sei / não quero registrar"** | s103 |
| 104 | `m1.conjuntura` | Retirar o mapa do Brasil (bloco "Território", com o link "← ver o Brasil") | s104 |
| 105 | `m1.conjuntura` | Novas categorias de relação, nesta ordem: **Aliado · Aliado, mas concorrente · Oponente · Oponente e concorrente · A descobrir**. Hoje a tabela tem só os botões Parceiro e Concorrente | s105 |
| 106 | `m1.conjuntura` | Na linha da própria liderança ("ESTA LIDERANÇA") não abrir a caixa/botões de classificação: ela não se classifica | s106 |
| 107 | `m1.conjuntura` | Nomes das abas: **Câmara Legislativa · Câmara dos Deputados · Senado**. "Câmara dos Deputados" deve ser demarcada em todas as telas (hoje a aba diz só "Câmara") | s107 |
| 109 | `m1.conjuntura` | Retirar este quadro: a pergunta "E quais são as pontes não óbvias…" com a caixa de texto (e a instrução "Marque na tabela acima quem é Parceiro e quem é Concorrente…" logo acima) | s109 |
| 110 | `m1.conjuntura/2` | Apagar esta pergunta: "Qual é a conjuntura política do seu estado ou município de origem?" (pergunta 3 de 3, atores locais, prefeitos e vereadores, com mapa) | s110 |
| 111 | `m1.conjuntura/1` | Retirar o mapa (visão "% de votos / Quem lidera / Variação / Vereadores / Filiados…") | s111 |
| 112 | `m1.oportunidades` | Retirar o mapa (abas "Promessas da campanha / Grupos que apoiaram / Grupos com potencial") | s112 |

Pontos para decidir com a Alana (as sugestões abertas se cruzam):

1. **#110 e #111 e #112 retiram mapas inteiros** e #104 retira o mapa do Brasil. A pergunta 3 de 3 da Conjuntura some junto com o seu mapa. Resta saber se o texto de orientação e o campo de resposta de cada tela continuam e se o mapa some só das telas de M1 (o componente de mapas é usado também em outras missões).
2. **#109 apaga a segunda caixa** ("pontes não óbvias") que o Pedro e a Alana tinham combinado em #17. Se a pergunta 1 de 3 fica só com a tabela, falta o campo de análise (o texto do #19: "A partir dos dados apresentados acima… faça uma análise").
3. **#105 substitui as categorias** do #91 do Pedro ("aliado", "opositor", "potencial relacionamento") e as de hoje (Parceiro/Concorrente). Migrar o que já foi marcado: Parceiro vira Aliado, Concorrente vira Oponente?
4. **#98 e #99** juntos pedem uma abertura da missão (instrução geral) e um fechamento (PRONTO) fora das etapas individuais.
5. **#96 (contagem de dias)**: ver seção B, está marcada como resolvida mas vale checar o texto "Dia 283 de 100".

---

## B. Marcadas como resolvidas na tabela (histórico)

Estas já foram tratadas; ficam aqui para a reestruturação não desfazer o que já foi decidido.

| # | Data | Tela | Pedido | Observação |
| - | ---- | ---- | ------ | ---------- |
| 13 | 22/10 | `m1` | Trocar "parlamentar" por "liderança parlamentar" em todo o guia | Voltou como #97 |
| 14 | 29/10 | `m1.persona/2` | Siglas por extenso | |
| 15 | 29/10 | `m1.persona/2` | Nova orientação: "Analise os dados dos pleitos…", opção de subir dados próprios e aceitar os dados do sistema, e caixa com 5 perguntas (fatores de sucesso, relação com o partido, aprendizados, grupos sociais e agendas, promessas do último pleito) | Pedro recusou a opção "subir meus próprios dados" (todo dado histórico vem do sistema) e disse que grupos sociais são da tarefa 3 |
| 16 | 29/10 | `m1.persona/3` | Duas caixas: 4 conquistas antes do fim da legislatura; próximo cargo | |
| 17 | 29/10 | `m1.conjuntura` | Tirar "Quando passarem-se os 100 dias"; duas caixas (potenciais parcerias/concorrentes e pontes não óbvias) | Pedro: seleção tabula melhor que texto; não há dado de "agendas similares". Hoje o #109 pede para tirar a caixa das pontes |
| 18 | 29/10 | `m1.conjuntura` | Ver a tabela completa sem rolar de 5 em 5 nomes | Depois o Pedro pediu paginação (#92) |
| 19 | 29/10 | `m1.conjuntura/1` | Padrão "pergunta, textinho, dados, caixa de análise" em todos os exercícios com dados | |
| 20 | 29/10 | `m1.conjuntura/1` | Manter só a pergunta abrangente da Alana | Decisão do Pedro |
| 21 | 29/10 | `m1.conjuntura` | Marcar as 4 etapas: A Persona, A Conjuntura, As Oportunidades e Ameaças, As Fragilidades e Fortalezas | |
| 22 | 29/10 | `m1.frag` | Trazer o comando na mesma página da atividade | |
| 23 | 29/10 | `m1.frag/2` | Link para a Biblioteca; tudo na página anterior; bloco "Tornando fragilidades em fortalezas!" depois do checklist | |
| 96 | 10/11 | `m1` | "Contagem de dias está dando problema". No print: "283 dia de 100" na lateral e "Dia 283: os 100 primeiros dias terminaram em 11/05/2026" | Marcada resolvida, mas o print mostra o comportamento após o fim dos 100 dias; confirmar com a Alana se o texto está como ela quer |
| 108 | 10/11 | `m1.conjuntura` | "Por que está aparecendo 505 ao invés de 513 cadeiras?" | Resolvida (ver memória do caso 505/513) |

---

## C. Leitura rápida: o que a Alana quer para a Missão 1

- **Tom de análise, não de pesquisa**: o sistema entrega os dados e a pessoa só analisa (#15, #19, #20).
- **Terminologia**: "liderança parlamentar" em todo lugar (#13, #97); relações "Aliado / Oponente / A descobrir" (#105); "Câmara dos Deputados" (#107).
- **Tela mais enxuta**: menos mapas (#104, #110, #111, #112), menos caixas (#109, #110).
- **Estrutura**: 4 etapas bem marcadas (#21), instrução geral e fechamento no nível da missão (#98, #99).
- **Persona**: pergunta de futuro com duas caixas e opção "Não sei / não quero registrar" (#16, #103).
