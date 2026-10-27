# Missão 4 · Capital Político Specification

## Problem Statement

A Missão 4 tem três telas que hoje são formulários soltos. Comissões: o usuário digita tudo à mão, sem ajuda do cargo nem das bandeiras da Missão 3. Ações dos 100 dias: escolhe num "bingo" e preenche quatro campos de texto por ação, sem visão geral. Acompanhamento da comunicação: é só uma lista de caixinhas "marque o que você acompanha", sem guardar número algum.

## Goals

- [ ] Comissões sugeridas a partir do cargo e das bandeiras prioritárias, com todas as outras visíveis.
- [ ] Campos de texto das comissões trocados por escolhas rápidas (botões) mais texto livre opcional.
- [ ] Ações numa matriz: escolho a frente, vejo as ações recomendadas e preencho tudo na mesma linha.
- [ ] Comunicação em 5 seções expansíveis, números digitados por semana e gráfico de linha do tempo.
- [ ] Clipping semanal de notícias, cada uma etiquetável com as bandeiras do mandato.
- [ ] Textos do Guia da Missão 4 idênticos; quem já preencheu não perde dado.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Ligar às redes sociais (Instagram, X etc.) | Digitação semanal, definido pelo usuário |
| Catálogo oficial de comissões de cada Assembleia | Cada Casa é diferente; v1 sugere pela Câmara Federal |
| Notícia com resumo por IA | Custo e privacidade |
| Lembrete ou aviso semanal por e-mail | Fica para a v2 |
| Visão Kanban das ações | Pode entrar depois como 2ª visão |
| Alterar `conteudo.js`, `guia.js` e demais extraídos | AD-003: mudanças por arquivo novo (`m4.js`) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Fonte das comissões federais | Arquivo `br.json` atualizado por script (já existe, feito da API da Câmara), sem chamada ao vivo | CORS da API da Câmara não foi verificado; arquivo é mais rápido e não quebra | y |
| Ligação bandeira → comissão | Tabela nossa, feita à mão, com teste contra as siglas do `br.json` | A API não informa o tema de cada comissão | y |
| Cargo do mandato | Vem do cadastro do mandato (mesma regra da Missão 3, `casaDe`) | Já existe | y |
| Comissões da Missão 3 | `comissoesDesejadas` já aparecem marcadas na Missão 4 | Evita digitar duas vezes | y |
| Formato da matriz de ações | Tabela editável estilo 5W2H, uma ação por linha; cartão no celular | Método conhecido de plano de ação; os 5 campos do Guia já são quase um 5W2H | y |
| Fonte do clipping | RSS do Google Notícias (sem chave) | Gratuito; não é API oficial e pode mudar; plano B: GDELT ou NewsAPI (não verificados) | y |
| Onde roda a busca de notícias | Rota do nosso servidor | O navegador não lê o RSS do Google direto | y |
| Semana | ISO, segunda a domingo; um registro por seção por semana | Simples de explicar | y |
| Pesquisa de UX | Só RSS do Google e 5W2H foram pesquisados; o restante é decisão nossa | Honestidade sobre a base | y |

**Open questions:** none - todas resolvidas ou registradas acima; o usuário aprovou os padrões ("pode seguir").

---

## User Stories

### P1: Comissões permanentes sugeridas ⭐ MVP

**User Story**: Como chefe de gabinete, quero ver as comissões que combinam com as nossas bandeiras já sugeridas, para escolher rápido.

**Why P1**: Primeira tela da missão; hoje exige digitar tudo.

**Acceptance Criteria**:

1. WHEN o cargo for Deputado(a) Federal THEN a plataforma SHALL mostrar as comissões permanentes da Câmara, com as das bandeiras prioritárias no topo em "Sugeridas para você".
2. The plataforma SHALL mostrar em cada comissão sugerida o motivo ("Combina com sua bandeira Educação").
3. The plataforma SHALL listar todas as outras comissões em "Todas as comissões", com busca por nome ou sigla.
4. WHEN o cargo for Deputado(a) Estadual ou Distrital THEN a plataforma SHALL sugerir a partir das comissões da Câmara Federal e SHALL exibir o aviso "Nomes podem ser diferentes na sua Assembleia. Confira no Regimento Interno" e o botão "Ajustar o nome".
5. WHEN o cargo for outro (Senado, Vereança) THEN a plataforma SHALL mostrar a lista da Câmara como referência de temas, com o mesmo aviso.
6. WHEN o usuário escolher uma comissão THEN a plataforma SHALL abrir um cartão com três perguntas em botões (motivo, papel, primeiro movimento), cada uma com "Outro (escrever)", e SHALL gravar na hora.
7. The plataforma SHALL oferecer motivos de múltipla escolha, papéis (Titular, Suplente, Relatoria, Vice-presidência, Presidência) e movimentos iniciais prontos.
8. The plataforma SHALL manter gravados em texto legível os campos `prio`, `esp`, `pq`, `papel` e `mov` de `D.comissoes`.
9. IF não houver bandeiras da Missão 3 THEN a plataforma SHALL mostrar todas as comissões sem "sugeridas" e um aviso com atalho para a Missão 3.
10. WHEN a Missão 3 já tiver `comissoesDesejadas` THEN a plataforma SHALL mostrar essas comissões já marcadas na Missão 4.

**Independent Test**: Cargo Federal + bandeira Saúde: "Comissão de Saúde" aparece em Sugeridas; escolho "Titular" e um movimento; recarrego e continua salvo.

---

### P1: Matriz das ações dos 100 dias ⭐ MVP

**User Story**: Como chefe de gabinete, quero escolher uma frente e ver as ações recomendadas numa matriz, para preencher meta, responsável, prazo, prova e próximo passo sem me perder.

**Why P1**: Segunda tela da missão; o bingo atual não dá visão geral.

**Acceptance Criteria**:

1. The plataforma SHALL mostrar botões de frente (as de hoje: Articulação política, Mobilização etc.), cada um com o contador de ações escolhidas.
2. WHEN o usuário escolher uma frente THEN a plataforma SHALL mostrar todas as ações recomendadas dela como linhas, cada uma com caixa de marcar.
3. The plataforma SHALL oferecer as colunas Ação, O que queremos alcançar, Responsável, Prazo, Como saberemos e Próximo passo.
4. WHEN o usuário marcar uma linha THEN a plataforma SHALL ativar os campos dela e gravar em `D.acoes`; linha desmarcada fica sem campos.
5. The plataforma SHALL oferecer em "Responsável" as pessoas da Missão 2 e aceitar texto livre.
6. The plataforma SHALL oferecer "Prazo" como seletor de data e SHALL manter exibido o prazo antigo em texto livre.
7. WHEN o usuário marcar uma ação THEN a plataforma SHALL sugerir um texto base em "Como saberemos", editável.
8. WHILE houver menos de 2 ações em 2 frentes diferentes, the plataforma SHALL mostrar o progresso "faltam ações em frentes diferentes"; ao cumprir, SHALL mostrar "2 ações em 2 frentes ✓".
9. WHEN uma ação marcada tiver campo vazio THEN a plataforma SHALL mostrar ponto amarelo na linha; completa mostra verde.
10. WHERE a tela for estreita (celular), a plataforma SHALL mostrar cada ação como cartão com campos empilhados.
11. The plataforma SHALL manter válidas as ações já salvas em `D.acoes` (`bingo`, `i`, `alcancar`, `resp`, `prazo`, `saber`, `prox`) sem migração.
12. The plataforma SHALL oferecer a visão "Todas as ações" com as escolhidas de todas as frentes, ordenadas por prazo.

**Independent Test**: Escolho Articulação, marco 1 ação e preencho; troco para Mobilização, marco outra; vejo "2 ações em 2 frentes ✓" e, em "Todas as ações", as duas.

---

### P1: Acompanhamento semanal da comunicação ⭐ MVP

**User Story**: Como assessor de comunicação, quero registrar toda semana os números de cada tópico e ver a evolução num gráfico.

**Why P1**: Hoje nada é guardado; sem número não há acompanhamento.

**Acceptance Criteria**:

1. The plataforma SHALL mostrar os 5 tópicos como seções expansíveis, exibindo o último registro no cabeçalho fechado.
2. WHEN o usuário acionar "Registrar esta semana" THEN a plataforma SHALL abrir um formulário com os números do tópico e gravar o registro na semana ISO atual.
3. IF já existir registro do tópico na semana THEN a plataforma SHALL mostrar "Editar esta semana" e SHALL editar o mesmo registro, sem duplicar.
4. The plataforma SHALL aceitar nos campos só números maiores ou iguais a zero.
5. WHEN houver 2 ou mais semanas registradas THEN a plataforma SHALL mostrar o gráfico de linha da seção, com semanas no eixo horizontal.
6. IF houver menos de 2 semanas THEN a plataforma SHALL mostrar "Registre mais uma semana para ver a linha".
7. The plataforma SHALL mostrar, no fim da tela, a "Linha do tempo geral" com um indicador de cada seção.
8. WHEN uma seção tiver registro THEN a plataforma SHALL marcar automaticamente a caixinha antiga `m4.k1` a `m4.k5` correspondente.
9. The plataforma SHALL manter os textos do Guia da Missão 4 idênticos.

**Independent Test**: Registro 2 semanas em "Alcance"; vejo a linha; reabro a semana atual e o botão vira "Editar esta semana".

---

### P2: Clipping de imprensa com etiquetas de bandeira

**User Story**: Como assessor de comunicação, quero buscar as notícias da semana sobre o parlamentar e etiquetá-las com as bandeiras, para ver se a imprensa fala das nossas prioridades.

**Why P2**: Valioso, mas depende de uma fonte não oficial; as demais telas funcionam sem ele.

**Acceptance Criteria**:

1. WHEN o usuário acionar "Buscar notícias da semana" THEN a plataforma SHALL pesquisar o nome parlamentar entre aspas nos últimos 7 dias e listar título, veículo, data e link.
2. The plataforma SHALL permitir ocultar notícias que não são do mandato.
3. The plataforma SHALL permitir etiquetar cada notícia com uma ou mais bandeiras da Missão 3, e "Sem bandeira" SHALL ser o padrão.
4. The plataforma SHALL permitir etiquetar várias notícias de uma vez.
5. The plataforma SHALL permitir adicionar uma aparição manual (título, veículo, link, data).
6. The plataforma SHALL mostrar o gráfico de barras das aparições por bandeira na semana e no período, sem contar as ocultas.
7. The plataforma SHALL calcular o número de aparições do registro semanal a partir das notícias não ocultas.
8. IF a busca falhar THEN a plataforma SHALL mostrar "Não consegui buscar agora. Adicione manualmente" e SHALL manter o resto da tela funcionando.
9. The plataforma SHALL gravar só título, veículo, data e link, sem texto de matéria.
10. IF o usuário não estiver autenticado THEN a rota de busca SHALL responder 401, e SHALL limitar a 10 buscas por hora por mandato.

**Independent Test**: Busco notícias (simuladas), aceito 3, etiqueto 2 com "Educação"; vejo o gráfico por bandeira e o número da semana igual a 3.

---

## Edge Cases

- WHEN o cargo estiver vazio ou desconhecido THEN a plataforma SHALL mostrar a lista da Câmara como referência, sem sugeridas.
- WHEN a virada de ano cair no meio de uma semana ISO THEN a plataforma SHALL usar a semana ISO correta (ex.: 2026-W53 ou 2027-W01).
- WHEN a data da posse não existir THEN a plataforma SHALL aceitar qualquer prazo futuro, sem máximo.
- WHEN o mandato tiver dados antigos da Missão 4 THEN a plataforma SHALL abri-los sem perda.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| CAP-01 | P1: Comissões (cargo Federal, sugeridas, todas, busca) | Tasks | Pending |
| CAP-02 | P1: Comissões (Estadual e outros cargos, aviso, ajustar nome) | Tasks | Pending |
| CAP-03 | P1: Comissões (cartão com 3 perguntas em botões, gravação em texto legível) | Tasks | Pending |
| CAP-04 | P1: Comissões (sem bandeiras, pré-marcar da Missão 3) | Tasks | Pending |
| CAP-10 | P1: Matriz (frentes, linhas, colunas, marcar e gravar) | Tasks | Pending |
| CAP-11 | P1: Matriz (responsável, prazo, texto base, indicador de preenchimento) | Tasks | Pending |
| CAP-12 | P1: Matriz (progresso 2 ações em 2 frentes, compatibilidade com `D.acoes`) | Tasks | Pending |
| CAP-13 | P1: Matriz (cartões no celular, visão Todas as ações) | Tasks | Pending |
| CAP-20 | P1: Comunicação (seções, registro semanal, edição, números) | Tasks | Pending |
| CAP-21 | P1: Comunicação (gráficos de linha, linha do tempo geral, caixinhas antigas, textos do Guia) | Tasks | Pending |
| CAP-30 | P2: Clipping (busca, ocultar, aparição manual, falha amigável) | Tasks | Pending |
| CAP-31 | P2: Clipping (etiquetas de bandeira, gráfico por bandeira, número semanal) | Tasks | Pending |
| CAP-32 | P2: Clipping (rota autenticada, limite, só metadados) | Tasks | Pending |
| CAP-40 | Edge cases (cargo vazio, virada de ano, sem posse, dados antigos) | Tasks | Pending |

**ID format:** `CAP-NN` (comissões 01-04, matriz 10-13, comunicação 20-21, clipping 30-32, bordas 40).

---

## Success Criteria

- [ ] Um mandato Federal com bandeira Saúde vê Saúde sugerida e escolhe papel e movimento sem digitar.
- [ ] Um mandato registra 2 semanas de comunicação e vê a linha do tempo.
- [ ] Mandatos com dados antigos da Missão 4 abrem sem perda e os textos do Guia continuam idênticos.
