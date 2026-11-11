# Reestruturação da Missão 1 (Mapa Político) Specification

Origem: documento `contexto inicial/AJUSTES PLATAFORMA MISSÃO 1 (organizado).docx` (a Alana descreve a missão; os trechos grifados em amarelo são as decisões e instruções do Pedro, lidas em 2026-11-10; em 2026-11-11 o Pedro acrescentou a decisão sobre a pergunta 3.1) e as 12 sugestões abertas da Alana em [sugestoes-alana.md](sugestoes-alana.md). Estado atual do código: `DOCUMENTACAO_FUNCIONALIDADES_MISSOES_1_A_5.md`, seção "Missão 1". Caminhos do código são relativos a `plataforma/`. Telas são rotas do Guia (`#/m/1/...`).

## Problem Statement

A Missão 1 hoje mostra muitos mapas e caixas soltas, em várias telas por etapa, e a Alana quer que a pessoa **analise dados já prontos**, com menos páginas, menos mapas e dados em cartões fáceis de ler. Ela também trocou as categorias de relação com os parlamentares e o texto de várias perguntas, e o Pedro definiu como cada ponto vira tela (cartões, carrosséis, seletores) e que a missão termine com um HTML compilado de tudo o que foi respondido.

## Goals

- [ ] As 4 etapas da Missão 1 abrem cada uma em **uma única página**, sem "Avançar" entre perguntas.
- [ ] Todo ajuste descrito pela Alana e toda decisão do Pedro tem requisito com teste (a tabela de rastreabilidade lista todos).
- [ ] Nenhuma resposta já salva em `D.campos`, `D.relacoes`, `D.conj2`, `D.social`, `D.eleitorado` ou `D.pleitos` se perde.
- [ ] A missão termina com um botão que gera o HTML do Mapa Político, com o mesmo compilado da aba Resumo do preenchimento.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| PDF separado só da Missão 1 | O Pedro ainda não decidiu; o fechamento gera HTML e o compilado segue o Resumo do preenchimento |
| Documento de análise do estado fora da plataforma (modelo "Espírito Santo: 24 desafios") | O Pedro recusou: a análise vem dos indicadores e notas de ODS que a plataforma já tem |
| Novo status de relação além dos 5 listados | Só os 5 da Alana |
| Marcar sugestões da Alana como resolvidas na tabela `sugestoes` | Escrita em produção: só com go-ahead |
| `git push` e deploy | Exigem go-ahead |
| Sugestões #96 (contagem de dias) e #99 (texto "oito perguntas-chave" da Persona) | Não constam no documento da reestruturação; seguem na lista de sugestões abertas |
| Texto de `conteudo.js` | É sobrescrito a cada extração (AD-003); os textos novos entram por `public/legacy/m1.js` |

---

## Assumptions & Open Questions

Todas as decisões foram aprovadas pelo Pedro em 2026-11-11 (as que estavam sem confirmação inclusive); o default escolhido é o que a spec implementa.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| "Uma página para cada Etapa" (Pedro) | Cada exercício (`m1.persona`, `m1.conjuntura`, `m1.oportunidades`, `m1.frag`) abre com todas as suas perguntas na mesma página, no modo "Ver tudo de uma vez"; o botão avança de etapa, não de pergunta | Pedro respondeu "Ok, uma página para cada Etapa" ao pedido da Alana | y |
| Posição no ranking com partido ao lado (1.2) | Lista do ranking com posição (1º, 2º…), nome e partido ao lado de cada nome; sem barras de votos. O KPI de votos da própria liderança continua | O pedido ("deixar apenas a posição") e a resposta do Pedro ("adicionar partido destes parlamentares logo ao lado") se leem assim; a Alana pode querer manter as barras | y |
| 5 municípios mais votados em cartões (1.2) | Só no pleito de 2026 (o único com votos por município, via `/api/votos-mun`), 5 cartões com posição, município, votos e % dos válidos. Nos pleitos anteriores não aparece nada de município | Pedro: "apenas no pleito de 2026, que possui o mapa" | y |
| Liderança sem votação 2026 por município (vereadora/prefeita, ou candidatura 2026 ausente) | Os cartões de município não aparecem na Persona; na etapa Conjuntura os cartões usam só o município de domicílio (`m.municipio`), se houver; se não houver, a seção mostra "Informe o município de domicílio em Dados do mandato" | Sem votos por município não há como eleger os 5 mais votados | y |
| Migração das categorias de relação | Nenhum dado é reescrito. As chaves gravadas em `D.relacoes[sq].status` ficam: `aliado` = Aliado, `concorrente` = Oponente, `potencial` = Indefinida. Entram duas chaves novas, `aliado_concorrente` e `oponente_concorrente`. Só os rótulos mudam | Os tipos já dizem que as chaves antigas são mantidas e os rótulos mudaram (`lib/types.ts`); reescrever dado salvo não traz ganho | y |
| Nome da 5ª categoria | "Indefinida", como no documento. A sugestão #105 usava "A descobrir" | O documento é posterior à sugestão | y |
| Carrossel de classificados (2.1) | Um cartão por parlamentar classificado, em carrossel, com filtros por categoria acima; cartão = foto, nome, partido, Casa/UF e a categoria, com botão para reclassificar ou remover | O Pedro pede "card slider" com filtros por classificação; o conteúdo do cartão não foi definido | y |
| Pergunta 2.3 removida, mas o texto volta no fim da página | Some o mapa e a pergunta "Qual é a conjuntura política do seu estado ou município de origem?". No fim da página da Conjuntura entra o texto "Registre quais são os principais atores políticos…" com a caixa `m1.q6`, para as respostas antigas continuarem visíveis | Pedro: "Ok, remover pergunta" e "adicione ele no final da página mesmo assim" | y |
| Pergunta "pontes não óbvias" (`m1.q4b`) | Deixa de aparecer na tela; o valor gravado fica. O documento não a lista e a sugestão #109 pede para apagá-la | O documento é a versão final da Alana | y |
| Escolha de escopo sem o mapa do Brasil (2.1) | Seletor "Brasil inteiro / UF" no lugar do cartograma; o escopo inicial segue a UF do mandato | O cartograma era o jeito de escolher a UF | y |
| Tabela de eleitos em 15 linhas por página | Mantém a paginação de 15 (sugestão #92 do Pedro) | A SUG-18 antiga pedia a tabela inteira; o Pedro mudou depois para paginação | y |
| Placar, Força e Executivo "em cartões dos municípios" (2.2) | Os 5 municípios mais votados da liderança (mesmo critério da Persona) viram 5 cartões. Cada cartão traz 3 blocos: **Placar** (vereadores do município, vereadores do partido, foto e nome do prefeito, posição do partido diante do Executivo, filiados do partido), **Força** (% de votos do partido no município, no cargo da liderança, ao lado da % do partido no estado) e **Executivo** (posição do partido diante da prefeitura). Só o Placar tem lista de campos ditada pelo Pedro; Força e Executivo seguem os dados que as telas de hoje já calculam | O Pedro detalhou só o tópico 1 | y |
| "Placar do partido" estadual e nacional | Continua aparecendo antes dos cartões de município, agora em cartões com borda | Pedro: "Ok, mas os indicadores precisam ser melhores apresentados, com borda, em cards" | y |
| Seleção de 2 dados com frase fixa (2.2) | Duas linhas "Considerando [seletor de dado] o mandato deve [caixa de texto]". O seletor lista os indicadores mostrados na tela (placar, filiados, força, executivo) com o valor ao lado; ao escolher, a frase fica "Considerando {nome do dado}: {valor}, o mandato deve…" | Pedro: "o campo deve ser o texto… abrir uma espécie de seleção na tela, podendo selecionar indicador e aí preenche o texto" | y |
| Análise social por agenda temática (3.2) | Cartões das 13 agendas já cadastradas (`lib/agendas.ts`), com indicadores IDSC-BR 2026 e notas de ODS **da UF da liderança** (média dos municípios ponderada pela população 2022, como hoje). Sem mapa | Pedro: "continuar usando os indicadores e notas de ODS que temos, só que os números do Estado do Parlamentar" | y |
| Seletor de classificação no cartão (3.2) | Seletor que **filtra** os indicadores do cartão pela faixa da nota (Muito baixo <40, Baixo 40–49, Médio 50–59, Alto 60–79, Muito alto ≥80, as faixas de hoje). A faixa é calculada da nota, não escolhida pela pessoa | "seletores da classificação dos indicadores" e a escala bate com a do IDSC | y |
| Mini tabela do cartão (3.2) | Colunas indicador, ODS relacionada e nota (0 a 100) | Pedro | y |
| Slides de 4 em 4 cartões (3.2) | Carrossel com 4 cartões por slide; botões anterior/próximo e indicador "slide X de Y" | Pedro | y |
| Seleção das 3 agendas prioritárias (3.3) | Escolha de exatamente 3 entre as 13 agendas (as de `lib/agendas.ts`), gravada em `D.agendasPrio` (lista de ids, máximo 3). A Missão 3 não lê esse campo nesta entrega | O documento pede a escolha, o Pedro não comentou e o dado não tem campo hoje | y |
| Pergunta 3.1 sem mapa (Pedro, 2026-11-11; atende a sugestão #112 da Alana) | Some o mapa, a busca e a seleção de município. A pergunta vira 3 colunas lado a lado: "Promessas de Campanha", "Grupos que Apoiaram" e "Grupos com Potencial". Cada coluna tem um botão "+" que abre o mesmo formulário de hoje (campo de texto com o exemplo de cada tipo e botão "Adicionar") e, nas duas colunas de grupos, as 16 tags de sugestão. Município deixa de ser registrado | Pedro: "adicione 3 colunas… adicione '+' para adicionar cada um destes tópicos com as mesmas tags ou campos. Não precisamos mais relacionar municípios" | y |
| Itens de eleitorado já gravados com município | Continuam em `D.eleitorado.itens` com `muns` intactos e aparecem na coluna do tipo, sem mostrar município. Itens novos gravam `muns: []`. O tipo `ItemEl` não muda | Não perde resposta salva | y |
| Perguntas 1.3 (conquistas) | Três caixas com os rótulos "Conquista/Grande Entrega almejada 1", "…2" e "…3", nas chaves `m1.q3c1`, `m1.q3c2`, `m1.q3c3`. A resposta antiga em `m1.q3` continua gravada e é mostrada como "Resposta anterior" enquanto existir | Não perde resposta salva | y |
| Fechamento com HTML (Pedro) | Ao fim da missão a mensagem "Pronto!" e o botão "Gerar HTML do Mapa Político". O arquivo reúne as respostas como o Resumo do preenchimento e inclui os carrosséis funcionando (HTML com script inline) | Pedro: "botão de gerar html, pois teremos alguns tópicos com sliders" | y |
| Termo "liderança parlamentar" | Todo texto novo ou reescrito desta spec usa "liderança parlamentar" para a pessoa. Os rótulos "Gabinete" e "Parlamentar" dos botões de fragilidades ficam | Sugestões #13 e #97 | y |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Cada etapa numa página só ⭐ MVP

**User Story**: Como pessoa que usa o Guia, quero ver todas as perguntas de uma etapa na mesma página, sem apertar "Avançar" a cada pergunta, para analisar o conjunto.

**Why P1**: Estrutura que todas as outras histórias usam.

**Acceptance Criteria**:

1. PAG-01: WHEN a pessoa abre `m1.persona`, `m1.conjuntura`, `m1.oportunidades` ou `m1.frag` THEN the system SHALL mostrar todas as perguntas do exercício na mesma página, na ordem do documento (1.1 a 1.3; 2.1 e 2.2; 3.1 a 3.3; 4.1).
2. PAG-02: WHEN a pessoa está em qualquer exercício da Missão 1 THEN the system SHALL mostrar a faixa das 4 etapas "A Persona", "A Conjuntura", "As Oportunidades e Ameaças" e "As Fragilidades e Fortalezas", com a atual em `aria-current="step"`.
3. PAG-03: WHEN a pessoa chega ao fim de uma página de etapa THEN the system SHALL oferecer o botão de seguir para a etapa seguinte, e SHALL NOT oferecer botão de avançar entre perguntas da mesma etapa.
4. PAG-04: IF a pessoa abre um endereço antigo de passo (`#/m/1/m1.conjuntura/1`, `#/m/1/m1.oportunidades/1`) THEN the system SHALL abrir a página única da etapa correspondente.

**Independent Test**: Abrir `#/m/1` e percorrer as 4 etapas, contando as páginas (4) e conferindo a faixa e os endereços antigos.

---

### P1: Persona (1.1 a 1.3) ⭐ MVP

**User Story**: Como pessoa que usa o Guia, quero ver o desempenho eleitoral em dados enxutos e registrar conquistas e próximo cargo, para fechar o retrato da liderança parlamentar.

**Why P1**: Primeira etapa da missão.

**Acceptance Criteria**:

1. PER-01: WHEN a pessoa abre a pergunta 1.2 THEN the system SHALL NOT mostrar o mapa "Onde estão os votos".
2. PER-02: WHEN a pessoa abre a pergunta 1.2 de uma liderança com candidatura 2026 THEN the system SHALL mostrar o ranking como lista com posição, nome e partido ao lado do nome, sem barras de votos.
3. PER-03: WHEN a pessoa abre a pergunta 1.2 de uma liderança com candidatura 2026 THEN the system SHALL mostrar 5 cartões com os municípios em que a liderança teve mais votos, em ordem decrescente, cada um com posição, nome do município, votos e % dos votos válidos.
4. PER-04: WHILE a pessoa vê um pleito anterior a 2026 THEN the system SHALL NOT mostrar cartões nem lista de municípios nesse pleito.
5. PER-05: IF a consulta de votos por município falha ou devolve vazio THEN the system SHALL mostrar a mensagem "Não foi possível carregar os municípios mais votados agora." no lugar dos cartões e manter o resto da pergunta.
6. PER-06: WHEN a pessoa abre a pergunta 1.2 THEN the system SHALL mostrar, logo abaixo dos dados, a caixa de análise precedida do texto "Seu papel agora é registrar a história política que traz sentido aos dados. O que justifica esta trajetória? O que os demais assessores precisam saber para compreender o caminho percorrido?"
7. PER-07: WHEN a pessoa abre a pergunta 1.3 THEN the system SHALL mostrar o texto "Elenque quais são as principais conquistas ou grandes entregas que o mandato deseja ter alcançado antes do fim da legislatura. Registre até 3:" e 3 cartões com caixa de texto, intitulados "Conquista/Grande Entrega almejada 1", "Conquista/Grande Entrega almejada 2" e "Conquista/Grande Entrega almejada 3".
8. PER-08: WHEN a pessoa abre a pergunta "Qual é o próximo cargo que a liderança parlamentar gostaria de ocupar?" THEN the system SHALL listar os cargos de hoje e a opção "Não sei / não desejo registrar".
9. PER-09: IF existe resposta antiga em `m1.q3` THEN the system SHALL mostrá-la como "Resposta anterior" na pergunta 1.3 sem apagá-la.

**Independent Test**: Abrir `m1.persona` com uma liderança federal de 2026 e conferir lista de ranking, 5 cartões, 3 caixas e o select de cargo.

---

### P1: Conjuntura: relações com os parlamentares (2.1) ⭐ MVP

**User Story**: Como pessoa que usa o Guia, quero classificar meus colegas parlamentares em 5 categorias e rever quem já classifiquei em um carrossel filtrável, para analisar as relações da liderança parlamentar.

**Why P1**: É o coração da etapa Conjuntura e muda o dado gravado.

**Acceptance Criteria**:

1. LEG-01: WHEN a pessoa abre a pergunta 2.1 THEN the system SHALL NOT mostrar o mapa do Brasil nem o cartograma de UFs, e SHALL mostrar as cadeiras legislativas (hemiciclo) e um seletor de escopo "Brasil inteiro / UF".
2. LEG-02: WHEN a pessoa abre a pergunta 2.1 THEN the system SHALL mostrar as abas "Câmara Legislativa" (no DF; "Assembleia Legislativa" nos demais estados), "Câmara dos Deputados" e "Senado", com a contagem de cada uma.
3. LEG-03: WHEN a pessoa classifica um parlamentar THEN the system SHALL oferecer exatamente estas 5 categorias, nesta ordem: "Aliado", "Aliado, mas concorrente", "Oponente", "Oponente e concorrente", "Indefinida".
4. LEG-04: WHEN a pessoa abre a pergunta 2.1 THEN the system SHALL mostrar o texto "Analise qual é o tipo de relação que a liderança parlamentar tem com as pessoas eleitas, a partir dos dados expostos abaixo.", as 2 orientações numeradas do documento e a explicação das 5 categorias com as definições da Alana.
5. LEG-05: WHEN a pessoa abre a pergunta 2.1 THEN the system SHALL NOT mostrar a pergunta das "pontes não óbvias".
6. LEG-06: WHEN a pessoa abre a pergunta 2.1 THEN the system SHALL mostrar os grandes números e os gráficos de gênero, cor ou raça e mandato logo abaixo dos filtros.
7. LEG-07: WHEN a pessoa mostra a linha da própria liderança na tabela THEN the system SHALL mostrar o selo "Esta liderança" e SHALL NOT oferecer botões de classificação nessa linha.
8. LEG-08: WHEN a pessoa classifica um parlamentar THEN the system SHALL acrescentar um cartão desse parlamentar a um carrossel com uma navegação anterior/próximo.
9. LEG-09: WHEN a pessoa escolhe uma das 5 categorias nos filtros acima do carrossel THEN the system SHALL mostrar só os cartões dessa categoria, e WHEN escolhe "Todas" SHALL mostrar todos.
10. LEG-10: WHEN a pessoa reclassifica ou remove a classificação de um parlamentar THEN the system SHALL atualizar o cartão do carrossel e a contagem de cada filtro na mesma hora.
11. LEG-11: IF existem classificações antigas (`aliado`, `concorrente`, `potencial`) THEN the system SHALL mostrá-las como "Aliado", "Oponente" e "Indefinida", sem pedir nova classificação.
12. LEG-12: WHEN a pessoa tem ao menos uma classificação THEN the system SHALL gerar um resumo em texto com a contagem por categoria no formato "Você tem 20 Aliados; 5 Aliados, mas concorrentes; …", listando só as categorias com ao menos 1.
13. LEG-13: WHEN a pessoa abre a aba "Resumo do preenchimento" THEN the system SHALL mostrar o resumo de LEG-12 no lugar do resumo antigo de aliados/opositores/potenciais.

**Independent Test**: Abrir `m1.conjuntura` de uma liderança do DF, classificar 3 parlamentares em 3 categorias, filtrar o carrossel e conferir o resumo na aba Resumo.

---

### P1: Conjuntura: partido em cartões e reação aos dados (2.2) ⭐ MVP

**User Story**: Como pessoa que usa o Guia, quero ver o placar, a força e a posição do partido nos municípios mais votados e registrar como o mandato reage a 2 dados, para entender a conjuntura partidária.

**Why P1**: É a segunda metade da etapa Conjuntura; muda tela e dado.

**Acceptance Criteria**:

1. PAR-01: WHEN a pessoa abre a pergunta 2.2 THEN the system SHALL mostrar o texto de contexto "A análise da quantidade de cargos ocupados pelo partido na sua Casa Legislativa, no território nacional e em seu domicílio eleitoral, … é fundamental para a compreensão da conjuntura política em que a liderança parlamentar está inserida." antes dos dados.
2. PAR-02: WHEN a pessoa abre a pergunta 2.2 THEN the system SHALL mostrar o Placar do partido (parlamentares, vereadores, prefeituras, filiados e posição nos Executivos) em cartões com borda.
3. PAR-03: WHEN a pessoa abre a pergunta 2.2 THEN the system SHALL NOT mostrar mapa coroplético de municípios.
4. PAR-04: WHEN a pessoa abre a pergunta 2.2 THEN the system SHALL mostrar um cartão para cada um dos 5 municípios mais votados da liderança, na mesma ordem e critério de PER-03.
5. PAR-05: WHEN a pessoa vê o bloco Placar de um cartão de município THEN the system SHALL mostrar a quantidade de vereadores do município, a quantidade de vereadores do partido, a foto e o nome do prefeito, a posição do partido em relação ao Executivo municipal e a quantidade de filiados do partido no município.
6. PAR-06: WHEN a pessoa vê o bloco Força de um cartão de município THEN the system SHALL mostrar a % de votos do partido no município e a % do partido no estado, para o cargo da liderança.
7. PAR-07: WHEN a pessoa vê o bloco Executivo de um cartão de município THEN the system SHALL mostrar as 4 posições (Partido do governo, Base aliada, Oposição, Independente) e SHALL permitir escolher uma, gravando em `D.conj2` como hoje.
8. PAR-08: IF a liderança não tem votação 2026 por município THEN the system SHALL mostrar cartões só para o município de domicílio, ou a mensagem "Informe o município de domicílio em Dados do mandato" se ele não existir.
9. PAR-09: WHEN a pessoa abre a pergunta 2.2 THEN the system SHALL mostrar, depois dos dados, os textos "Identifique que tipo de relação com o partido a liderança parlamentar deseja ter, à luz destes dados, refletindo como o mandato pode contribuir para o fortalecimento do partido e como pode se posicionar diante do poder Executivo." e "Selecione 2 dados e registre como a liderança parlamentar deseja que o mandato reaja a eles."
10. PAR-10: WHEN a pessoa abre a seleção de dado de uma das 2 linhas THEN the system SHALL listar os indicadores mostrados em PAR-02, PAR-05 e PAR-06 com o valor de cada um.
11. PAR-11: WHEN a pessoa escolhe um dado numa linha THEN the system SHALL preencher o início da frase como "Considerando {nome do dado}: {valor}, o mandato deve…" e SHALL abrir a caixa de texto para completar a frase.
12. PAR-12: WHEN a pessoa preenche as 2 linhas THEN the system SHALL gravá-las em `D.conj2.reacoes` como `[{dado, valor, texto}]` e SHALL NOT permitir uma 3ª linha.
13. PAR-13: WHEN a pessoa abre o final da página da Conjuntura THEN the system SHALL mostrar o texto "Registre quais são os principais atores políticos do entorno da liderança parlamentar. Leve em consideração os diversos poderes, e monte o cenário político instalado a partir de quem são seus aliados e concorrentes em potencial." com a caixa `m1.q6`, e SHALL NOT mostrar a pergunta nem o mapa "Qual é a conjuntura política do seu estado ou município de origem?".
14. PAR-14: IF existem valores gravados em `D.conj2.relacao`, `relacaoPq`, `desafios`, `oportunidades` ou `D.conj2.muns` THEN the system SHALL mantê-los gravados.

**Independent Test**: Abrir `m1.conjuntura` com uma liderança federal de 2026, conferir 5 cartões com 3 blocos, escolher dois dados e completar as frases.

---

### P1: Oportunidades e ameaças sem mapas (3.1 a 3.3) ⭐ MVP

**User Story**: Como pessoa que usa o Guia, quero registrar promessas e grupos em 3 colunas, ver os indicadores sociais do meu estado em cartões por agenda temática e escolher as 3 agendas prioritárias, para decidir onde atuar.

**Why P1**: Substitui os dois mapas da etapa e cria um dado novo (agendas prioritárias).

**Acceptance Criteria**:

1. SOC-01: WHEN a pessoa abre a pergunta 3.1 THEN the system SHALL mostrar o texto "Elenque quais foram os posicionamentos públicos e as promessas mais relevantes da sua campanha. Identifique também as regiões e os grupos sociais que mais apoiaram a candidatura e eleição, e também aqueles com potencial para maior aproximação ao longo dos anos que seguem." antes das 3 colunas de registro.
2. SOC-02: WHEN a pessoa abre a pergunta 3.2 THEN the system SHALL mostrar o texto "Inspire-se nos dados públicos oficiais apresentados abaixo, acerca do seu estado, e faça uma análise da conjuntura social do território da liderança parlamentar." e SHALL NOT mostrar mapa.
3. SOC-03: WHEN a pessoa abre a pergunta 3.2 THEN the system SHALL mostrar um cartão para cada uma das 13 agendas temáticas, com as notas de ODS e os indicadores da UF da liderança parlamentar.
4. SOC-04: WHEN a pessoa vê um cartão de agenda THEN the system SHALL mostrar uma mini tabela com as colunas indicador, ODS relacionada e nota de 0 a 100.
5. SOC-05: WHEN a pessoa escolhe uma faixa no seletor de classificação de um cartão ("Todas", "Muito baixo", "Baixo", "Médio", "Alto", "Muito alto") THEN the system SHALL mostrar na tabela só os indicadores cuja nota cai nessa faixa (Muito baixo <40, Baixo 40 a 49, Médio 50 a 59, Alto 60 a 79, Muito alto 80 ou mais).
6. SOC-06: WHILE a pessoa vê os cartões da 3.2 THEN the system SHALL mostrá-los em slides de 4 cartões, com os botões "Anterior" e "Próximo" e o indicador "Slide X de Y".
7. SOC-07: WHEN a pessoa abre a pergunta 3.2 THEN the system SHALL mostrar a caixa de análise `m1.q8a` depois dos cartões.
8. SOC-08: IF o arquivo de indicadores da UF não carrega THEN the system SHALL mostrar a mensagem "Não foi possível carregar os indicadores do seu estado agora." e SHALL manter a caixa de análise.
9. SOC-09: IF existem registros em `D.social` THEN the system SHALL mantê-los gravados e SHALL NOT apagá-los.
10. ELE-01: WHEN a pessoa abre a pergunta 3.1 THEN the system SHALL NOT mostrar mapa, busca de município nem seleção de município.
11. ELE-02: WHEN a pessoa abre a pergunta 3.1 THEN the system SHALL mostrar 3 colunas lado a lado, na ordem "Promessas de Campanha", "Grupos que Apoiaram" e "Grupos com Potencial", cada uma com o título, a contagem de itens e um botão "+".
12. ELE-03: WHEN a pessoa aciona o botão "+" de uma coluna THEN the system SHALL abrir o formulário dessa coluna com o rótulo "Adicionar: promessa", "Adicionar: grupo que apoiou" ou "Adicionar: grupo com potencial", um campo de texto com o exemplo "Ex.: Ampliar o transporte escolar rural", "Ex.: Professoras da rede municipal" ou "Ex.: Jovens de 16 a 24 anos" e o botão "Adicionar".
13. ELE-04: WHEN a pessoa abre o formulário de "Grupos que Apoiaram" ou de "Grupos com Potencial" THEN the system SHALL mostrar as 16 tags "+ Mulheres", "+ Jovens", "+ Pessoas idosas", "+ Pessoas negras", "+ Povos indígenas", "+ LGBTQIA+", "+ Pessoas com deficiência", "+ Servidores públicos", "+ Professores", "+ Evangélicos", "+ Católicos", "+ Agricultura familiar", "+ Empreendedores e MEI", "+ Estudantes", "+ Moradores da periferia" e "+ Trabalhadores de aplicativo", e SHALL NOT mostrá-las no formulário de "Promessas de Campanha".
14. ELE-05: WHEN a pessoa preenche o campo de texto e aciona "Adicionar" THEN the system SHALL acrescentar o item no fim da coluna do tipo, gravá-lo em `D.eleitorado.itens` com `muns: []`, limpar o campo e manter o formulário aberto.
15. ELE-06: WHEN a pessoa aciona uma tag de grupo THEN the system SHALL acrescentar esse grupo à coluna do tipo do formulário aberto, sem exigir texto.
16. ELE-07: IF o texto está vazio ou só tem espaços THEN the system SHALL manter o botão "Adicionar" desabilitado e SHALL NOT gravar item.
17. ELE-08: IF a coluna já tem um item com o mesmo texto (sem diferenciar acento nem maiúscula) THEN the system SHALL NOT gravar item repetido e SHALL mostrar a mensagem "Este item já está na lista."
18. ELE-09: WHEN a pessoa aciona o "×" de um item THEN the system SHALL remover esse item da coluna e de `D.eleitorado.itens`.
19. ELE-10: IF existem itens gravados com municípios THEN the system SHALL mostrá-los na coluna do tipo sem exibir município e SHALL manter `muns` gravado.
20. ELE-11: WHEN a pessoa abre a aba Resumo do preenchimento THEN the system SHALL listar os itens de eleitorado nas 3 colunas, sem município e sem mapa.
21. AGE-01: WHEN a pessoa abre a pergunta 3.3 THEN the system SHALL mostrar o texto "Considerando os dados acima e as promessas de campanha, selecione quais são as 3 Agendas que serão trabalhadas prioritariamente pela liderança parlamentar ao longo dos 100 Primeiros dias, mas também ao longo deste primeiro ano:" e as 13 agendas como botões de seleção.
22. AGE-02: WHEN a pessoa marca uma agenda THEN the system SHALL gravá-la em `D.agendasPrio` e SHALL mostrar quantas faltam para 3.
23. AGE-03: IF a pessoa tenta marcar uma 4ª agenda com 3 já marcadas THEN the system SHALL NOT marcá-la e SHALL mostrar a mensagem "Você já escolheu 3 agendas. Desmarque uma para trocar."
24. AGE-04: WHEN a pessoa desmarca uma agenda THEN the system SHALL removê-la de `D.agendasPrio`.

**Independent Test**: Abrir `m1.oportunidades` de uma liderança do ES, adicionar um item em cada uma das 3 colunas, conferir slides de 4 cartões, filtrar por "Baixo" e escolher 3 agendas.

---

### P2: Fragilidades e fortalezas (4.1)

**User Story**: Como pessoa que usa o Guia, quero marcar fragilidades da equipe e da liderança parlamentar na mesma página, para planejar o estudo.

**Why P2**: A etapa já funciona; o ajuste é de texto.

**Acceptance Criteria**:

1. FRA-01: WHEN a pessoa abre a pergunta 4.1 THEN the system SHALL mostrar o título "Quais são os conhecimentos e/ou práticas que a liderança parlamentar ou a equipe ainda não domina(m) para um bom exercício do mandato?" e a instrução "Coloque um M para fragilidades da equipe do mandato e um P para as fragilidades da liderança parlamentar.".
2. FRA-02: WHEN a pessoa abre a pergunta 4.1 THEN the system SHALL mostrar a lista de fragilidades com o item "Uso dos Sistemas da Casa Legislativa" (com "Sistemas" no plural) e SHALL permitir marcar M, P ou os dois em cada item.
3. FRA-03: WHEN a pessoa abre a pergunta 4.1 THEN the system SHALL mostrar o texto "Caso sinta falta de algum outro tema, suba na lista e crie um plano de estudos…" depois da lista.

**Independent Test**: Abrir `m1.frag`, marcar M e P no mesmo item e conferir o diagnóstico.

---

### P1: Fechamento com HTML do Mapa Político ⭐ MVP

**User Story**: Como pessoa que usa o Guia, quero gerar um arquivo com tudo o que respondi na Missão 1, para embasar o planejamento.

**Why P1**: É a entrega final da missão.

**Acceptance Criteria**:

1. FEC-01: WHEN a pessoa chega ao fim da Missão 1 (depois da etapa 4) THEN the system SHALL mostrar a mensagem "Pronto!" com o texto "Parabéns! Com base neste amplo estudo de preparação da sua chegada você gerou o seu Mapa Político. …" e o botão "Gerar HTML do Mapa Político".
2. FEC-02: WHEN a pessoa aciona "Gerar HTML do Mapa Político" THEN the system SHALL baixar um arquivo HTML com as respostas da Missão 1 na mesma ordem e conteúdo da aba Resumo do preenchimento, incluindo as categorias de relação, o resumo de LEG-12, os cartões de município, a reação a 2 dados, as agendas prioritárias e os cartões de agenda.
3. FEC-03: WHILE a pessoa abre o HTML gerado fora da plataforma THEN the system SHALL manter funcionando os carrosséis e os filtros de classificação, sem depender de conexão com a plataforma.
4. FEC-04: WHEN a pessoa abre o final da página do Mapa Político THEN the system SHALL mostrar o compilado de todas as respostas da missão, como aparece na aba Resumo do preenchimento.
5. FEC-05: IF a pessoa ainda não respondeu uma pergunta THEN the system SHALL listá-la no HTML como "Não respondida" e SHALL NOT bloquear a geração.

**Independent Test**: Preencher a missão em parte, gerar o HTML, abri-lo offline e navegar nos carrosséis.

---

### P2: Linguagem e resumo

**User Story**: Como pessoa da Legisla, quero que os textos da missão usem "liderança parlamentar" e que o Resumo mostre os dados novos, para o Guia ficar coerente.

**Why P2**: Acabamento que acompanha as telas novas.

**Acceptance Criteria**:

1. GER-01: The system SHALL usar "liderança parlamentar" nos textos novos ou reescritos da Missão 1, e SHALL NOT usar "o parlamentar" ou "a parlamentar" para se referir à pessoa do mandato.
2. GER-02: WHEN a pessoa abre a aba Resumo do preenchimento THEN the system SHALL mostrar `m1.q3c1`, `m1.q3c2`, `m1.q3c3`, `m1.q3b`, as 2 reações a dados, as agendas prioritárias, a análise `m1.q8a` e a caixa `m1.q6`.
3. GER-03: WHEN a pessoa responde só em cartões, carrosséis ou seletores novos THEN the system SHALL contar a etapa como "em andamento".

**Independent Test**: Abrir o Resumo com respostas em todas as telas e conferir cada item.

---

## Edge Cases

- IF a pessoa já respondeu `m1.q3`, `m1.q4b` ou `m1.q6` antes THEN the system SHALL manter o valor gravado, mesmo quando a caixa não aparece na tela.
- IF a liderança é vereadora (sem candidatura 2026) THEN the system SHALL mostrar só os blocos que dependem de dados 2024 e as mensagens de PER-05 e PAR-08 nos demais.
- IF a UF da liderança não tem arquivo de indicadores THEN the system SHALL aplicar SOC-08.
- IF a pessoa troca de etapa com o formulário "+" aberto e vazio THEN the system SHALL abrir a etapa seguinte sem gravar item.
- WHEN a pessoa classifica mais de 12 parlamentares THEN the system SHALL manter o carrossel navegável sem rolagem horizontal da página.
- IF o escopo é "Brasil inteiro" THEN the system SHALL manter a paginação de 15 linhas na tabela de eleitos.

---

## Requirement Traceability

| Requirement ID | Story | Tasks | Status |
| -------------- | ----- | ----- | ------ |
| PAG-01 | P1: Cada etapa numa página só | T8, T14, T43 | Implementing |
| PAG-02 | P1: Cada etapa numa página só | T14 | Implementing |
| PAG-03 | P1: Cada etapa numa página só | T8, T14 | Implementing |
| PAG-04 | P1: Cada etapa numa página só | T8, T14 | Implementing |
| PER-01 | P1: Persona | T16, T17, T18 | Implementing |
| PER-02 | P1: Persona | T16, T18 | Implementing |
| PER-03 | P1: Persona | T4, T15, T18 | Implementing |
| PER-04 | P1: Persona | T15, T16 | Implementing |
| PER-05 | P1: Persona | T15, T18 | Implementing |
| PER-06 | P1: Persona | T9 | Implementing |
| PER-07 | P1: Persona | T9, T18 | Implementing |
| PER-08 | P1: Persona | T9, T18 | Implementing |
| PER-09 | P1: Persona | T9, T18 | Implementing |
| LEG-01 | P1: Conjuntura, relações | T22, T25 | Implementing |
| LEG-02 | P1: Conjuntura, relações | T22, T25, T41 | Implementing |
| LEG-03 | P1: Conjuntura, relações | T1, T2, T19, T25 | Implementing |
| LEG-04 | P1: Conjuntura, relações | T10, T19 | Implementing |
| LEG-05 | P1: Conjuntura, relações | T10 | Implementing |
| LEG-06 | P1: Conjuntura, relações | T22 | Implementing |
| LEG-07 | P1: Conjuntura, relações | T22, T25 | Implementing |
| LEG-08 | P1: Conjuntura, relações | T20, T21, T25 | Implementing |
| LEG-09 | P1: Conjuntura, relações | T21, T25 | Implementing |
| LEG-10 | P1: Conjuntura, relações | T21, T25 | Implementing |
| LEG-11 | P1: Conjuntura, relações | T2, T19, T41 | Implementing |
| LEG-12 | P1: Conjuntura, relações | T2, T23, T25 | Implementing |
| LEG-13 | P1: Conjuntura, relações | T23, T24 | Implementing |
| PAR-01 | P1: Conjuntura, partido | T10, T30 | Implementing |
| PAR-02 | P1: Conjuntura, partido | T26, T30 | Implementing |
| PAR-03 | P1: Conjuntura, partido | T26, T30 | Implementing |
| PAR-04 | P1: Conjuntura, partido | T27, T29, T30 | Implementing |
| PAR-05 | P1: Conjuntura, partido | T27, T30 | Implementing |
| PAR-06 | P1: Conjuntura, partido | T27 | Implementing |
| PAR-07 | P1: Conjuntura, partido | T27 | Implementing |
| PAR-08 | P1: Conjuntura, partido | T15, T27 | Implementing |
| PAR-09 | P1: Conjuntura, partido | T10, T29, T30 | Implementing |
| PAR-10 | P1: Conjuntura, partido | T7, T28, T29 | Implementing |
| PAR-11 | P1: Conjuntura, partido | T7, T28, T30 | Implementing |
| PAR-12 | P1: Conjuntura, partido | T1, T7, T28, T30 | Implementing |
| PAR-13 | P1: Conjuntura, partido | T10, T30 | Implementing |
| PAR-14 | P1: Conjuntura, partido | T26, T30 | Implementing |
| SOC-01 | P1: Oportunidades e ameaças | T11 | Implementing |
| SOC-02 | P1: Oportunidades e ameaças | T11, T33, T36 | Implementing |
| SOC-03 | P1: Oportunidades e ameaças | T5, T33, T35 | Implementing |
| SOC-04 | P1: Oportunidades e ameaças | T5, T33 | Implementing |
| SOC-05 | P1: Oportunidades e ameaças | T5, T33, T37 | Implementing |
| SOC-06 | P1: Oportunidades e ameaças | T5, T20, T33, T37 | Implementing |
| SOC-07 | P1: Oportunidades e ameaças | T11 | Implementing |
| SOC-08 | P1: Oportunidades e ameaças | T33 | Implementing |
| SOC-09 | P1: Oportunidades e ameaças | T33 | Implementing |
| ELE-01 | P1: Oportunidades e ameaças | T31, T36, T37 | Implementing |
| ELE-02 | P1: Oportunidades e ameaças | T31, T37 | Implementing |
| ELE-03 | P1: Oportunidades e ameaças | T31, T37 | Implementing |
| ELE-04 | P1: Oportunidades e ameaças | T3, T31, T37 | Implementing |
| ELE-05 | P1: Oportunidades e ameaças | T3, T31, T37 | Implementing |
| ELE-06 | P1: Oportunidades e ameaças | T31, T37 | Implementing |
| ELE-07 | P1: Oportunidades e ameaças | T3, T31, T37 | Implementing |
| ELE-08 | P1: Oportunidades e ameaças | T3, T31, T37 | Implementing |
| ELE-09 | P1: Oportunidades e ameaças | T3, T31, T37 | Implementing |
| ELE-10 | P1: Oportunidades e ameaças | T31 | Implementing |
| ELE-11 | P1: Oportunidades e ameaças | T32, T39 | Implementing |
| AGE-01 | P1: Oportunidades e ameaças | T11, T34, T36 | Implementing |
| AGE-02 | P1: Oportunidades e ameaças | T6, T34, T35, T37 | Implementing |
| AGE-03 | P1: Oportunidades e ameaças | T6, T34, T37 | Implementing |
| AGE-04 | P1: Oportunidades e ameaças | T6, T34 | Implementing |
| FRA-01 | P2: Fragilidades | T12 | Implementing |
| FRA-02 | P2: Fragilidades | T12 | Implementing |
| FRA-03 | P2: Fragilidades | T12 | Implementing |
| FEC-01 | P1: Fechamento | T40, T42 | Implementing |
| FEC-02 | P1: Fechamento | T38, T40, T42 | Implementing |
| FEC-03 | P1: Fechamento | T38 | Implementing |
| FEC-04 | P1: Fechamento | T40, T42 | Implementing |
| FEC-05 | P1: Fechamento | T38, T42 | Implementing |
| GER-01 | P2: Linguagem e resumo | T12, T41 | Implementing |
| GER-02 | P2: Linguagem e resumo | T13, T39, T42 | Implementing |
| GER-03 | P2: Linguagem e resumo | T13, T42 | Implementing |

**Coverage:** 75 requisitos, 75 mapeados a tasks, 0 sem task.

---

## Success Criteria

- [ ] Os 75 requisitos têm teste que falha sem a mudança; `npm test`, `npx tsc --noEmit` e os e2e da Missão 1 passam.
- [ ] Nenhuma resposta salva antes da mudança se perde (conferido com um mandato real de teste).
- [ ] As 12 sugestões abertas da Alana em [sugestoes-alana.md](sugestoes-alana.md) estão atendidas (#112 pela pergunta 3.1 sem mapa) ou listadas como pendentes na seção Out of Scope e nas decisões com "n".
