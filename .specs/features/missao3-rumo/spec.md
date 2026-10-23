# Missão 3 · Defina o Rumo (Planejamento Estratégico) Specification

## Problem Statement

A Missão 3 promete como produto final o Planejamento Estratégico do mandato, mas hoje entrega cinco telas soltas: textos livres para bandeiras, argumentos e critérios; uma caixa de texto para o Legado; três cartões de preditores com uma frase; e uma lista de metas com um menu de preditor. Nada disso se liga: a bandeira não alimenta o Legado, o preditor não vira objetivo na hierarquia, a meta SMART não recebe retorno, responsável e apoio são texto digitado (as pessoas da Missão 2 não aparecem) e não existe acompanhamento do que foi atingido. O "Planejamento" não existe como objeto: o Painel do mandato mostra "Últimos registros" onde deveria mostrar o rumo do mandato.

## Goals

- [ ] Cada bandeira escolhida abre, na hora, o seu campo de argumentos e a pontuação nos critérios de priorização; o ranking sugere as 3 prioritárias.
- [ ] O mandato registra os espaços que pretende compor (comissões e outros), com sugestões por cargo, Casa e bandeira.
- [ ] O Legado é escrito por condução guiada (4 elementos), capta o cargo postulado em 4 anos e termina numa primeira página de jornal com a manchete.
- [ ] Escolher um preditor cria, no mesmo gesto, o objetivo específico dele: primeira camada da árvore do Planejamento.
- [ ] Toda meta pertence a um objetivo específico, recebe retorno SMART automático e tem responsável direto e apoios escolhidos entre as pessoas da Missão 2.
- [ ] Concluída a Missão 3, existe a aba "Planejamento Estratégico" (árvore Legado → bandeiras → preditores/objetivos → metas) com status por meta e atingimento por objetivo e total, editável depois, e o resumo dele ocupa o lugar de "Últimos registros" no Painel do mandato.
- [ ] Todos os textos do Guia da Missão 3 (introdução, passos, exemplos, notas, fecho) continuam visíveis e idênticos.
- [ ] Mandatos que já preencheram a Missão 3 não perdem nenhum dado.

## Out of Scope

| Feature                                                                            | Reason                                                                                                                 |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Catálogo completo e atualizado de comissões de todas as Assembleias Legislativas | Cada Casa tem estrutura própria e muda por legislatura; ver "Perspectivas sobre espaços" abaixo                      |
| Feedback de meta SMART por IA generativa                                           | Custo, privacidade do conteúdo do gabinete (`permite_pesquisa`) e imprevisibilidade; v1 usa regras determinísticas |
| Status intermediários além dos quatro pedidos (ex.: "em andamento")              | Pedido fixa 4 status; ampliar fica para depois                                                                         |
| Monitoramento mensal por meta (`mon.*`, exercício da Missão 5)                 | Já existe e segue como está; o status do plano é independente                                                       |
| Notificações, lembretes e agenda das metas                                       | Exige calendário e envio; fica para a v2                                                                              |
| Mais de um objetivo específico por preditor                                       | Guia define "o preditor OU uma frase que o represente" (1:1)                                                           |
| Gerar imagem/PDF do Planejamento                                                   | P3; v1 mostra na tela e usa a impressão do navegador                                                                  |
| Alterar `conteudo.js` / `guia.js` extraídos                                   | AD-003: mudanças entram por override em `novos.js` e `m3.js`                                                      |

---

## Assumptions & Open Questions

| Assumption / decision              | Chosen default                                                                                                                                                                                                                                           | Rationale                                                                                                                | Confirmed?     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------- |
| "Selecionar a bandeira" no passo 1 | Selecionar = levantar no mural (sem limite); cada bandeira levantada abre card com argumentos + notas por critério; a plataforma soma e sugere as 3 maiores; o usuário confirma as 3 prioritárias (estrela)                                           | O Guia manda pontuar todas as levantadas e só então escolher 3; o pedido (abrir campos ao selecionar) cabe nesse fluxo | y              |
| Critérios de priorização        | 4 critérios do Guia (especialização da liderança, quantidade de apoiadores, promessas de campanha, impacto no território) + critérios próprios; nota 0 a 5 por critério, peso igual                                                              | Texto do Guia dá os 4 exemplos; peso igual evita falsa precisão                                                        | y              |
| Taxonomia das bandeiras            | `BANDEIRAS` de `lib/bandeiras.ts` (19 do Guia) + "Outra bandeira" em texto livre                                                                                                                                                                     | Mesma lista da Missão 2 (`recomenda.ts`)                                                                              | y (já existe) |
| Onde ficam os dados                | `D.campos` mantém as chaves `m3.*` atuais (espelho de compatibilidade); estado novo em `D.rumo` (bandeiras, critérios, rascunhos de manchete); metas seguem em `D.metas`; preditores em `D.preditores`; espaços em `D.comissoesDesejadas` | Resumo, painel, nuvem e Missão 5 já leem essas chaves                                                                  | y              |
| Espelho `m3.*`                   | `m3.mural`, `m3.argumentos`, `m3.criterios`, `m3.b1..b3`, `m3.legado`, `m3.cargo`, `m3.obj.{pid}` continuam gravados com texto legível a cada edição                                                                                    | Resumo e checklist não podem quebrar                                                                                    | y              |
| Objetivo específico               | 1:1 com o preditor: `m3.obj.{pid}`; se vazio, vale o nome do preditor (regra do Guia)                                                                                                                                                                  | Guia: "usar o preditor como objetivo ou trocá-lo por uma frase"                                                         | y              |
| Hierarquia do plano                | Legado (4 anos) → Objetivo do ano (opcional, texto) → Preditor/Objetivo específico → Metas; bandeiras entram como contexto lateral do Legado, não como nó pai                                                                                      | O Guia cita "objetivo do ano" nas entregas, mas só pede preditores e objetivos específicos                             | n              |
| Cargo postulado                    | Lista por cargo atual do mandato (ver RUM-12) + "Outro (texto)"                                                                                                                                                                                          | Cargo vem de `Store.mandato.cargo`; opções são inferência nossa                                                    | n              |
| Manchetes-modelo                   | 4 modelos com lacunas, derivados dos 4 exemplos do Guia e marcados "sugestão da plataforma"; usuário pode ignorar e escrever livre                                                                                                                     | Pedido: avaliar modelos pré-definidos                                                                                   | n              |
| Nome do jornal                     | Nome fictício genérico "A Gazeta do Mandato" no topo da primeira página; editável                                                                                                                                                                    | Evita imitar jornal real                                                                                                 | y              |
| Feedback SMART                     | Regras sobre os 5 elementos de `FORMULA_META`: S, M e T automáticos; R pelo vínculo com o objetivo + pergunta do preditor (`PREDITORES.q`); A por confirmação do usuário                                                                        | Determinístico e testável; A e R não são inferíveis do texto                                                        | n              |
| Pessoas da Missão 2               | Responsável e apoios = cadeiras ativas com nome (`lib/cadeiras.ts`), guardadas por índice da cadeira + nome em cópia; texto livre continua aceito                                                                                                   | Nome muda sem quebrar o vínculo; metas antigas com texto livre não se perdem                                           | n              |
| Atingimento                        | Meta: concluída 100, concluída 70% = 70, não concluída 0, congelada fora da conta. Objetivo = média simples das metas não congeladas. Total = média simples dos objetivos que têm ao menos uma meta não congelada                               | Pedido; média simples é o mais explicável                                                                             | n              |
| Status inicial                     | Meta nova nasce "Não concluída" (0%)                                                                                                                                                                                                                   | Os 4 status pedidos não incluem "a iniciar"                                                                             | n              |
| Quando o plano "é gerado"         | Existe assim que há 1 preditor com 1 meta; a aba mostra estado vazio com atalho para a Missão 3 antes disso                                                                                                                                            | Evita aba vazia confusa e não bloqueia quem edita pela aba                                                              | n              |
| Rota da aba                        | `#/plano` (item "Planejamento Estratégico" na lateral, entre as missões e a Caixa de ferramentas)                                                                                                                                                    | Padrão de rotas do legado (`#/resumo`, `#/equipe`)                                                                  | y              |
| Painel do mandato                  | O bloco "Últimos registros" (`Store.eventos`) sai do Painel e dá lugar ao resumo do plano; `eventos` continua gravado                                                                                                                              | Pedido; nada deixa de ser registrado                                                                                     | y              |
| Permissões                        | Qualquer membro do mandato edita o plano (como o restante do Guia)                                                                                                                                                                                       | RLS atual por mandato; sem papéis novos                                                                                 | n              |
| "Diariamente" no SMART | "Diário/diariamente" descreve rotina, não prazo ou frequência de meta de 4 meses: não atende o T e dispara o alerta "Meta não é tarefa diária"; "mensalmente", "semanal" e afins atendem o T | A mesma palavra já aciona o alerta de rotina (RUM-31.9); contar como prazo daria sinal contraditório | n |
| Pesquisa de UX                     | Não foi feita pesquisa externa para esta spec; as decisões de interação são nossas                                                                                                                                                                  | Honestidade sobre a base                                                                                                 | y              |

**Open questions:** none - all resolved or logged above. As linhas com "Confirmed? n" têm padrão escolhido e aguardam a validação do usuário.

---

## Perspectivas sobre espaços (comissões)

Mapear todas as comissões de todas as Casas não cabe. Três caminhos:

| Caminho                             | O que é                                                                                                                                                                                                                                                                                                                                                                 | Prós                                                                                         | Contras                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| A. Catálogo completo por Casa      | Lista oficial de comissões de cada Assembleia e da Câmara                                                                                                                                                                                                                                                                                                              | Preciso                                                                                       | 27 Assembleias com estrutura própria e mudança a cada legislatura; manutenção insustentável     |
| **B. Híbrido (recomendado)** | (1) Tipos de espaço universais por cargo; (2) comissões temáticas **sugeridas por bandeira** com nome genérico ("Comissão de Educação"); (3) catálogo curado só da Câmara dos Deputados, gerado por script; (4) para Assembleias, campo livre com autocompletar do que o próprio mandato já digitou e uma lista opcional por UF que cresce sob demanda | Cobre 100% dos casos; o dado difícil é opcional; a sugestão por bandeira já cumpre o Guia | Nome genérico pode não casar com a Casa; exige revisão do catálogo da Câmara a cada legislatura |
| C. Só campo livre                  | O que existe hoje                                                                                                                                                                                                                                                                                                                                                        | Zero manutenção                                                                             | Não ajuda a decidir; ignora cargo e bandeira                                                        |

Decisão da spec: **B**. A Câmara dos Deputados publica dados abertos; o script `build_comissoes.py` os lê para gerar `public/data/comissoes/br.json` (a forma exata da API **não foi verificada** nesta sessão; a primeira tarefa do script a confere). Assembleias começam sem catálogo próprio e aceitam um `public/data/comissoes/{uf}.json` por UF quando alguém curar.

---

## User Stories

### P1: Bandeiras com argumentos e critérios ⭐ MVP

**User Story**: Como chefe de gabinete, quero que cada bandeira que a equipe levantar abra seus argumentos e a pontuação nos critérios, para chegar às 3 prioritárias com base no que a equipe disse.

**Why P1**: É o começo da cadeia; sem bandeiras prioritárias, Legado e comissões ficam soltos.

**Acceptance Criteria**:

1. WHEN o usuário seleciona uma bandeira da lista ou digita uma outra THEN a plataforma SHALL adicioná-la ao mural e abrir, no mesmo gesto, o card dela com os campos "Argumentos" e a nota de cada critério.
2. WHEN o usuário preenche argumentos ou notas THEN a plataforma SHALL gravar na hora e atualizar o total de pontos do card.
3. The plataforma SHALL oferecer os 4 critérios do Guia e permitir acrescentar critérios próprios (máximo 8 critérios) e remover qualquer um.
4. The plataforma SHALL aceitar nota inteira de 0 a 5 por critério e calcular o total como a soma das notas.
5. WHEN há ao menos 2 bandeiras com nota THEN a plataforma SHALL ordenar o ranking por total e marcar as 3 primeiras como "sugeridas".
6. WHEN o usuário confirma uma bandeira como prioritária THEN a plataforma SHALL gravá-la em `m3.b1..b3` na ordem de confirmação.
7. IF o usuário tenta confirmar uma quarta prioritária THEN a plataforma SHALL recusar e dizer qual desmarcar.
8. WHEN o usuário remove uma bandeira do mural THEN a plataforma SHALL pedir confirmação se ela tiver argumentos ou notas e, ao confirmar, removê-la também das prioritárias.
9. IF o mandato já tem texto em `m3.mural`, `m3.b1..b3` e não tem `D.rumo` THEN a plataforma SHALL importar os rótulos reconhecidos pela taxonomia como bandeiras do mural e SHALL manter o texto antigo intacto.
10. The plataforma SHALL manter `m3.mural`, `m3.argumentos`, `m3.criterios` e `m3.b1..b3` atualizados em texto legível a cada edição.

**Independent Test**: Marcar Educação e Saúde, escrever um argumento, dar notas, ver o ranking e confirmar as duas como prioritárias.

---

### P1: Legado guiado com primeira página de jornal ⭐ MVP

**User Story**: Como parlamentar ou assessor, quero ser conduzido a escrever a manchete do Legado, já dizendo o cargo que vou postular em quatro anos, e ver o resultado como a primeira página de um jornal.

**Why P1**: Pedido central da etapa; o cargo postulado entra no plano.

**Acceptance Criteria**:

1. WHEN a etapa Legado abre THEN a plataforma SHALL conduzir em 4 passos com marcador de progresso: protagonista, principal entrega, resultado verificável, cargo em quatro anos.
2. WHEN o usuário escolhe o cargo no passo 4 THEN a plataforma SHALL gravar em `m3.cargo` e incluir o cargo na manchete composta.
3. WHEN o usuário completa os passos THEN a plataforma SHALL compor a manchete a partir dos 4 elementos e mostrá-la na primeira página de jornal ao lado.
4. WHEN o usuário edita qualquer elemento THEN a plataforma SHALL atualizar a primeira página em menos de 300 ms.
5. WHERE o usuário escolhe um modelo de manchete, a plataforma SHALL preencher a estrutura do passo a passo com as lacunas do modelo e SHALL permitir sobrescrever cada lacuna.
6. WHEN o usuário edita o texto final da manchete à mão THEN a plataforma SHALL passar a usar esse texto e manter a composição automática disponível por "Recompor".
7. IF a manchete final não menciona o cargo escolhido THEN a plataforma SHALL exibir o aviso "A manchete ainda não diz o cargo postulado" sem bloquear a gravação.
8. WHEN o usuário aciona "Fechar a edição" THEN a plataforma SHALL gravar a manchete em `m3.legado`, marcar o exercício como concluído e mostrar o selo "Edição fechada".
9. WHEN o usuário acrescenta rascunhos de manchete de grupos THEN a plataforma SHALL listá-los, permitir escolher um como base e SHALL permitir unificar elementos de mais de um.
10. The plataforma SHALL exibir a primeira página com nome do jornal editável, nome parlamentar, data de dezembro do último ano da legislatura, manchete, linha de apoio com as bandeiras prioritárias e o cargo.
11. The plataforma SHALL manter intactos o texto de abertura, os 4 exemplos de manchetes, os passos e o fecho do exercício.

**Independent Test**: Seguir os 4 passos, escolher cargo, ver a primeira página, fechar a edição e conferir `m3.legado` e `m3.cargo`.

---

### P1: Preditores e objetivos específicos como primeira camada do plano ⭐ MVP

**User Story**: Como chefe de gabinete, quero escolher os 3 preditores e já definir o objetivo específico de cada um, vendo a árvore nascer.

**Why P1**: É a primeira camada do Planejamento Estratégico e a base das metas.

**Acceptance Criteria**:

1. WHEN o usuário seleciona um preditor THEN a plataforma SHALL abrir o campo do objetivo específico dele com o exemplo do Guia como sugestão e adicionar o nó à árvore mostrada ao lado.
2. WHEN o usuário deixa o objetivo vazio THEN a plataforma SHALL usar o nome do preditor como objetivo.
3. IF o usuário tenta selecionar um quarto preditor THEN a plataforma SHALL recusar e dizer qual desmarcar.
4. WHEN o usuário desmarca um preditor que tem metas THEN a plataforma SHALL pedir confirmação informando quantas metas serão afetadas e, ao confirmar, mantê-las sem objetivo, sinalizadas "sem objetivo".
5. The plataforma SHALL mostrar a árvore com Legado no topo (manchete resumida), os preditores escolhidos e seus objetivos específicos.
6. WHEN o usuário altera o texto de um objetivo THEN a plataforma SHALL gravar em `m3.obj.{pid}` e atualizar a árvore.
7. The plataforma SHALL manter intactos a introdução, a nota, os passos e a tabela de exemplos de objetivos do exercício.

**Independent Test**: Escolher 3 preditores, escrever um objetivo, ver a árvore com 3 ramos e tentar o quarto.

---

### P1: Metas SMART com retorno, responsável e apoio ⭐ MVP

**User Story**: Como chefe de gabinete, quero escrever cada meta ligada a um objetivo específico e receber um retorno sobre o formato SMART, definindo quem é o responsável e quem apoia.

**Why P1**: Fecha o Planejamento e é o pedido mais detalhado.

**Acceptance Criteria**:

1. WHEN o usuário acrescenta uma meta THEN a plataforma SHALL exigir a escolha de um objetivo específico entre os dos preditores escolhidos.
2. IF não há preditor escolhido THEN a plataforma SHALL desabilitar "Acrescentar meta" e apontar para a etapa de preditores.
3. WHEN o usuário digita o texto da meta THEN a plataforma SHALL mostrar, em até 300 ms, o retorno por letra do SMART (Específica, Mensurável, Alcançável, Relevante, Temporal) com acerto, falta e dica.
4. The plataforma SHALL marcar Mensurável como atendida quando o texto contém número, percentual ou quantidade por extenso.
5. The plataforma SHALL marcar Temporal como atendida quando o texto contém prazo (data, mês, "até", "dias", "mensalmente", frequência).
6. The plataforma SHALL marcar Específica como atendida quando o texto começa com verbo no infinitivo e tem ao menos 6 palavras.
7. The plataforma SHALL marcar Relevante como atendida quando a meta tem objetivo específico vinculado.
8. The plataforma SHALL marcar Alcançável como atendida somente após o usuário confirmar a pergunta "Cabe na capacidade da equipe nos 4 meses?".
9. IF o texto lembra tarefa rotineira (ex.: "enviar e-mail", "fazer reunião semanal") THEN a plataforma SHALL exibir o alerta "Meta não é tarefa diária" do Guia.
10. WHEN o usuário escolhe responsável direto THEN a plataforma SHALL listar as cadeiras ativas com nome da Missão 2 e aceitar também texto livre.
11. WHEN o usuário escolhe apoios THEN a plataforma SHALL aceitar de 0 a 3 pessoas, diferentes do responsável.
12. IF o usuário escolhe como apoio a mesma pessoa do responsável THEN a plataforma SHALL recusar.
13. IF a Missão 2 não tem cadeiras nomeadas THEN a plataforma SHALL permitir texto livre e avisar que a lista vem da Missão 2.
14. WHEN o mandato tem de 10 a 16 metas THEN a plataforma SHALL mostrar o contador em verde; fora dessa faixa, em aviso, sem bloquear.
15. IF um objetivo tem mais de 4 metas THEN a plataforma SHALL bloquear a quinta e informar o limite do Guia.
16. The plataforma SHALL manter intactos a introdução (com o bloco de referência das metas), os passos e a nota "Atenção" do exercício.

**Independent Test**: Escrever "Aprovar 2 projetos de lei sobre educação até dezembro de 2027" num objetivo, ver S, M, T verdes, confirmar A, escolher responsável e apoio.

---

### P1: Aba Planejamento Estratégico com atingimento ⭐ MVP

**User Story**: Como chefe de gabinete, quero uma aba onde o planejamento aparece como árvore, com status das metas e atingimento por objetivo e total, para acompanhar e ajustar o rumo.

**Why P1**: É a funcionalidade nova pedida; o produto final da Missão 3.

**Acceptance Criteria**:

1. WHEN o usuário abre `#/plano` THEN a plataforma SHALL mostrar a árvore Legado → objetivos específicos (com preditor) → metas, e o atingimento total no topo.
2. WHEN o mandato não tem preditor com meta THEN a plataforma SHALL mostrar o estado vazio com atalho para a Missão 3.
3. WHEN o usuário muda o status de uma meta para concluída, concluída 70%, não concluída ou congelada THEN a plataforma SHALL gravar e recalcular atingimento do objetivo e total em menos de 300 ms.
4. The plataforma SHALL calcular o atingimento da meta como 100, 70, 0 ou excluída (congelada) conforme o status.
5. The plataforma SHALL calcular o atingimento do objetivo como a média simples das metas não congeladas, arredondada ao inteiro.
6. The plataforma SHALL calcular o atingimento total como a média simples dos objetivos com ao menos uma meta não congelada, arredondada ao inteiro.
7. IF um objetivo só tem metas congeladas ou nenhuma meta THEN a plataforma SHALL exibir "—" em vez de 0% e excluí-lo do total.
8. WHEN o usuário edita uma meta na aba THEN a plataforma SHALL permitir alterar texto, objetivo, responsável, apoios e status, com o mesmo retorno SMART do exercício.
9. WHEN o usuário acrescenta uma meta pela aba THEN a plataforma SHALL aplicar as mesmas regras de limite e vínculo do exercício.
10. WHEN o usuário remove uma meta THEN a plataforma SHALL pedir confirmação.
11. WHEN o usuário filtra por pessoa THEN a plataforma SHALL destacar as metas em que ela é responsável ou apoio e esmaecer as demais.
12. WHILE a aba está aberta, a plataforma SHALL mostrar por objetivo a barra de atingimento e a contagem de metas por status.
13. WHERE o usuário aciona "Imprimir", a plataforma SHALL abrir a impressão do navegador com a árvore em página limpa.
14. The plataforma SHALL oferecer navegação por teclado na árvore (setas, Enter para editar, Espaço para recolher) e rótulo acessível em cada nó.

**Independent Test**: Com 2 objetivos e 4 metas, mudar um status e ver o objetivo e o total mudarem conforme a conta.

---

### P1: Resumo do plano no Painel do mandato ⭐ MVP

**User Story**: Como usuário do Guia, quero ver o resumo do Planejamento no Painel no lugar de "Últimos registros", para ter o rumo do mandato à vista.

**Why P1**: Pedido explícito.

**Acceptance Criteria**:

1. WHEN o usuário abre o Painel do mandato THEN a plataforma SHALL exibir o resumo do plano (manchete, atingimento total, barra por objetivo) no lugar do bloco "Últimos registros".
2. WHEN o plano ainda não existe THEN a plataforma SHALL exibir o convite para concluir a Missão 3 com botão para ela.
3. WHEN o usuário aciona "Abrir o planejamento" THEN a plataforma SHALL navegar para `#/plano`.
4. The plataforma SHALL adicionar o item "Planejamento Estratégico" ao menu lateral, marcado como ativo em `#/plano`.
5. The plataforma SHALL continuar gravando `Store.eventos`.

**Independent Test**: Abrir `#/` com plano e ver o resumo; sem plano, ver o convite.

---

### P2: Espaços que o mandato pretende compor

**User Story**: Como chefe de gabinete, quero registrar as comissões e outros espaços que o mandato quer ocupar, com sugestões para o meu cargo, minha Casa e minhas bandeiras.

**Why P2**: Pedido do usuário; depende das bandeiras e não bloqueia o plano.

**Acceptance Criteria**:

1. WHEN o usuário abre "Espaços que o mandato pretende compor" THEN a plataforma SHALL mostrar tipos de espaço adequados ao cargo e à Casa do mandato.
2. WHERE o cargo é Deputado(a) Federal, a plataforma SHALL sugerir as comissões permanentes do catálogo da Câmara (`public/data/comissoes/br.json`).
3. WHERE o cargo é Deputado(a) Estadual e existe `public/data/comissoes/{uf}.json`, a plataforma SHALL sugerir as comissões dessa Assembleia.
4. WHERE o cargo é Deputado(a) Estadual e não existe catálogo da UF, a plataforma SHALL sugerir comissões temáticas por bandeira com nome genérico e aceitar nome livre.
5. WHEN o usuário escolhe uma bandeira prioritária THEN a plataforma SHALL destacar as comissões e espaços sugeridos para ela.
6. WHEN o usuário registra um espaço THEN a plataforma SHALL pedir comissão ou espaço, papel (titular, suplente, presidência, vice-presidência, relatoria, outro) e bandeira relacionada, e gravar em `D.comissoesDesejadas`.
7. IF o espaço registrado não atende nenhuma bandeira prioritária THEN a plataforma SHALL exibir o alerta "Este espaço não conversa com as bandeiras prioritárias" sem bloquear.
8. WHILE a bandeira prioritária 1 não tem espaço registrado, a plataforma SHALL exibir a dica do Guia sobre concentrar esforços na titularidade da principal bandeira.
9. The plataforma SHALL manter intactos o texto "No futuro" e os campos já gravados em `comissoesDesejadas`.

**Independent Test**: Mandato de Deputado Federal com Educação prioritária: ver "Comissão de Educação" sugerida e registrá-la como titular.

---

### P2: Modelos de manchete e rascunhos dos grupos

**User Story**: Como facilitador, quero modelos de manchete e rascunhos por grupo, para conduzir a dinâmica do Guia em subgrupos.

**Why P2**: Pedido de avaliar modelos; o P1 funciona sem eles.

**Acceptance Criteria**:

1. The plataforma SHALL oferecer 4 modelos: reeleição, candidatura a outro cargo, Câmara ao Senado e entrega legislativa, todos rotulados "sugestão da plataforma".
2. WHEN o usuário escolhe um modelo THEN a plataforma SHALL pré-preencher os 4 passos com o nome parlamentar, as bandeiras prioritárias e as lacunas do modelo.
3. WHEN o usuário adiciona um rascunho de grupo THEN a plataforma SHALL guardar nome do grupo, manchete e cargo e listá-los em cartões.
4. WHEN o usuário escolhe um rascunho como base THEN a plataforma SHALL carregá-lo nos 4 passos.

**Independent Test**: Escolher "reeleição" e ver os passos pré-preenchidos; salvar um rascunho e recarregá-lo.

---

### P3: Imagem da primeira página e extras do plano

**User Story**: Como parlamentar, quero baixar a primeira página do Legado como imagem para compartilhar com a equipe.

**Why P3**: Conveniência.

**Acceptance Criteria**:

1. WHERE o usuário aciona "Baixar imagem", a plataforma SHALL gerar um PNG da primeira página com a manchete atual.
2. WHERE o usuário aciona "Ordenar por atingimento", a plataforma SHALL reordenar os objetivos do menor para o maior atingimento.

---

## Edge Cases

- IF o mandato não tem `Store.mandato.cargo` THEN a plataforma SHALL oferecer a lista de cargos de Casa legislativa e SHALL NOT bloquear o Legado.
- IF a cadeira usada como responsável é removida na Missão 2 THEN a plataforma SHALL manter o nome gravado e marcar a pessoa como "fora da equipe".
- IF o nome de uma cadeira muda na Missão 2 THEN a plataforma SHALL mostrar o nome novo nas metas que a referenciam.
- IF a manchete tem mais de 280 caracteres THEN a plataforma SHALL avisar "Manchetes curtas funcionam melhor" sem bloquear.
- IF dois usuários editam a mesma meta em abas diferentes THEN a plataforma SHALL manter o último salvamento (mesmo comportamento do Guia).
- WHEN o usuário digita HTML ou script em qualquer campo THEN a plataforma SHALL exibi-lo como texto puro.
- IF `D.rumo` ou `D.metas` vêm com formato antigo ou corrompido THEN a plataforma SHALL normalizá-los sem erro e sem apagar texto.
- WHEN as metas antigas têm `pred` mas não têm status THEN a plataforma SHALL tratá-las como "Não concluída".

---

## Requirement Traceability

| Requirement ID | Story                                                                   | Phase  | Status  |
| -------------- | ----------------------------------------------------------------------- | ------ | ------- |
| RUM-01         | P1: Bandeiras (abrir card, argumentos, notas, ranking)                  | Design | Pending |
| RUM-02         | P1: Bandeiras (prioritárias, limite 3, importação, espelho `m3.*`) | Design | Pending |
| RUM-03         | P1: Bandeiras (critérios próprios, remoção)                         | Design | Pending |
| RUM-10         | P1: Legado (condução em 4 passos, composição da manchete)           | Design | Pending |
| RUM-11         | P1: Legado (cargo, aviso, edição à mão, fechar edição)            | Design | Pending |
| RUM-12         | P1: Legado (primeira página de jornal, textos preservados)             | Design | Pending |
| RUM-20         | P1: Preditores (seleção, objetivo, limite 3, árvore)                 | Design | Pending |
| RUM-21         | P1: Preditores (desmarcar com metas, textos preservados)                | Design | Pending |
| RUM-30         | P1: Metas (vínculo ao objetivo, limites)                               | Design | Pending |
| RUM-31         | P1: Metas (retorno SMART, alerta de tarefa rotineira)                   | Design | Pending |
| RUM-32         | P1: Metas (responsável e apoio da Missão 2)                           | Design | Pending |
| RUM-40         | P1: Plano (árvore, estado vazio, edição pela aba)                    | Design | Pending |
| RUM-41         | P1: Plano (status e atingimento)                                        | Design | Pending |
| RUM-42         | P1: Plano (filtro por pessoa, teclado, impressão)                      | Design | Pending |
| RUM-43         | P1: Painel (resumo, menu, eventos)                                      | Design | Pending |
| RUM-50         | P2: Espaços (sugestões por cargo, Casa, bandeira)                     | Design | Pending |
| RUM-51         | P2: Espaços (registro, alertas, dica)                                  | Design | Pending |
| RUM-52         | P2: Modelos de manchete e rascunhos                                     | Design | Pending |
| RUM-60         | P3: Imagem e ordenação                                                | -      | Pending |
| RUM-70         | Edge cases: migração, segurança, cadeira removida                    | Design | Pending |

**Coverage:** 20 total, 0 mapped to tasks, 20 unmapped (tarefas ainda não escritas) ⚠️

---

## Success Criteria

- [ ] Um gabinete novo percorre a Missão 3 e termina com a aba Planejamento preenchida sem digitar nada duas vezes.
- [ ] Mudar o status de uma meta atualiza objetivo, total e resumo do Painel na mesma tela, em menos de 300 ms.
- [ ] Nenhum dado de um mandato que já preencheu a Missão 3 se perde (teste de migração).
- [ ] Os textos da Missão 3 no `conteudo.js` ficam byte a byte iguais (teste de regressão por hash).
