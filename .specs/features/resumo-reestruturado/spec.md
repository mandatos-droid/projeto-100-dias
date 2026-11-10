# Resumo do Preenchimento Reestruturado Specification

Referência visual aprovada: `.specs/features/resumo-reestruturado/proposta.html` (dados de exemplo; abrir no navegador). Onde esta spec e o HTML divergirem, vale a spec.

## Problem Statement

A aba "Resumo do preenchimento" (`#/resumo`) lista as 16 respostas do Guia como uma página única e longa, sem hierarquia: não mostra o quanto já foi feito, não deixa recolher o que já foi lido, e apresenta parceiros, territórios e equipe como texto corrido. Ela é usada nas reuniões de alinhamento e na imersão de planejamento, quando a equipe precisa ver o estado do mandato de relance e achar o que falta. Esta feature reestrutura a tela com progresso, navegação fixa, blocos recolhíveis e componentes visuais para as respostas mais densas.

## Goals

- [ ] A tela mostra, sempre visível no topo, o progresso geral e o de cada missão, e leva a cada missão com um clique.
- [ ] Missões e exercícios são blocos recolhíveis; o que está vazio não ocupa espaço.
- [ ] O cabeçalho traz a foto da parlamentar ao lado de quatro números-chave.
- [ ] Aliados, opositores e potenciais aparecem como cartões; problemas e potencialidades como tabela por território; a escalação como organograma com vagas marcadas.
- [ ] A única ação da tela é "Baixar resumo completo (HTML)", sempre ao alcance.
- [ ] Nada do que o Guia grava, calcula ou baixa hoje muda: só a apresentação de `#/resumo`.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Botões "Gerar PDF" e "Baixar dados (JSON)" na tela | Decisão do usuário na validação: fica só o HTML. A função `Baixar.json` continua no código |
| Mudar o arquivo HTML baixado (`Baixar.tudo`, `Baixar.pagina`) | Pedido é só da tela; o download segue simples e imprimível |
| Mudar o bloco "Ver o que foi preenchido" do Painel (`ml-resp`) | Usa `Resumo.missao`, que não muda |
| Etiquetas coloridas para as bandeiras (Missão 3), metas, ações e demais exercícios | O mock os mostra como exemplo; mantêm a lista atual do Guia. Entram em feature própria |
| Lembrar entre visitas quais blocos estavam abertos | A regra de abertura inicial (RES-01) resolve o caso comum; sem estado novo no navegador |
| Link "Preencher →" por pergunta | O título de cada pergunta já leva a ela (`.res-link`); o link novo é por exercício (RES-10) |
| Tema escuro | O Guia não tem tema escuro |
| Painel da Legisla (`public/painel.html`) e `/admin` | Outras telas |
| Novos dados, tabelas ou migrations | A tela só lê o que já existe |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Quais botões ficam | Só "Baixar resumo completo (HTML)"; PDF e JSON saem da tela | "Mantenha apenas o baixar resumo com opção em html" (2026-11-10) | y |
| Quem imprime com Ctrl+P | Continua recebendo tudo aberto e sem barras | Com blocos fechados a página sairia vazia | n |
| Índice lateral da sugestão | Vira 5 segmentos na barra fixa do topo | O Guia já tem menu lateral de 18,75rem; uma 2ª coluna espremeria o conteúdo e não serve no celular | y |
| Cor das etiquetas de território | Por tipo (problema vermelho, potencialidade verde), não por tema | Há dezenas de agendas; cor por tema não escala | y |
| Abertura inicial dos blocos | Missão abre se tem algum exercício que abre; exercício abre se o estado não é "não iniciado" ou se, mesmo "não iniciado", `Resumo.ex` já mostra alguma resposta (ex.: caixa extra da persona) | Preserva o que a tela mostra hoje; só o vazio vem fechado | n |
| Corpo do exercício | É a saída de `Resumo.ex(ex)`, inclusive as sobreposições de `m1.js` a `m5.js` | Reaproveita todas as regras de texto sem duplicar | n |
| Foto da parlamentar | Mesma URL do TSE que o Resumo já usa (`sq` da candidatura em `D.tse`); sem `sq` ou sem rede, a inicial do nome | Evita nova fonte de dados | n |
| Número "cadeiras do partido" | Cadeiras do partido do mandato na Casa do mandato, da mesma fonte da tabela da Conjuntura (`carregaUF`); sem a fonte, o número é omitido | Evita número divergente do que o exercício mostra | n |
| Número "filiados" | Filiados do partido na UF do mandato, da mesma fonte da Conjuntura (`carregaFiliadosUF`) | Idem | n |
| Número "cargos da equipe" | Linhas da tabela de equipe com pessoa preenchida e sem `*`, sobre o total de linhas ativas | Linha com `*` é vaga a abrir, não pessoa | n |
| Contagem de progresso | A de `progMissao` e `progGeral` (exercício concluído = marcado como feito) | Mesma conta do menu lateral; números não divergem | y |
| Onde entra o código | Novo `public/legacy/resumo-tela.js` (escrito à mão), novas ilhas React e `ilhas.css` | `app.js`, `resumo.js` e `legacy.css` são regenerados pela extração | y |
| Base do branch | `origin/main`, em worktree próprio | Esta feature não depende de `feat/primeiro-acesso-google`; regra de sessões paralelas | n |
| Segmento ativo ao rolar | A última missão cujo topo passou da linha 160 px abaixo do topo da janela; a 1ª se nenhuma passou | Regra simples e testável | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Barra fixa com progresso e navegação ⭐ MVP

**User Story**: Como membro da equipe, quero ver o progresso e saltar entre as missões sem rolar a página inteira.

**Why P1**: É o pedido central e o que dá relance do estado do mandato.

**Acceptance Criteria**:

1. WHEN o usuário abre `#/resumo` THEN a tela SHALL mostrar uma barra no topo com o percentual `progGeral()` e o texto "N de 16 exercícios concluídos" (N = soma dos exercícios concluídos das 5 missões, 16 = soma dos exercícios), e cinco segmentos, um por missão, na ordem do Guia.  <!-- RES-02 -->
2. Cada segmento SHALL mostrar "M{n} · {título curto da missão}", "{feitos}/{total}" da missão e uma barra preenchida em `feitos/total` na cor da missão.
3. WHEN o usuário clica em um segmento THEN a tela SHALL abrir a missão correspondente e rolá-la até o topo sem alterar `location.hash`.
4. WHILE o usuário rola a página THEN a barra SHALL permanecer visível no topo da janela (abaixo de `.topo-movel` quando ele existe) e o segmento da missão atual SHALL ter `aria-current="true"`, e os demais `aria-current="false"`.
5. WHEN o título de uma missão é levado ao topo por um segmento THEN a barra SHALL NOT cobri-lo.
6. The barra SHALL conter exatamente um botão de ação, "Baixar resumo completo (HTML)", e a tela SHALL NOT conter "Gerar PDF" nem "Baixar dados (JSON)".  <!-- RES-03 -->
7. WHEN o usuário clica em "Baixar resumo completo (HTML)" THEN a tela SHALL chamar `Baixar.tudo()`, que baixa `regimento-<nome>-completo.html` e mostra "Resumo completo baixado.".
8. WHILE a largura da janela é de 61,25rem ou menos, o botão de ação SHALL ficar fixo no rodapé da janela, na largura toda, com margem inferior `env(safe-area-inset-bottom)`, e os segmentos SHALL rolar na horizontal dentro da barra.

**Independent Test**: Abrir `#/resumo` com dados parciais, rolar até a Missão 4 e ver o segmento M4 marcado; clicar em M2 e ver a Missão 2 no topo, com a barra ainda visível.

---

### P1: Missões e exercícios recolhíveis ⭐ MVP

**User Story**: Como membro da equipe, quero recolher o que já li e abrir só o que me interessa.

**Why P1**: Resolve a página longa.

**Acceptance Criteria**:

1. WHEN o usuário abre `#/resumo` THEN a tela SHALL listar as 5 missões como blocos `<details>`, cada um com "Missão {n}", o título curto, o prazo (`prazoTxt`) e "{feitos}/{total}", e dentro de cada um um bloco `<details>` por exercício.  <!-- RES-01 -->
2. Cada exercício SHALL mostrar no `<summary>` o título (link para `#/m/{n}/{id}`), o selo "concluído", "em andamento" ou "não iniciado" (de `estadoEx`) e o texto de `Telas.estadoTxt(ex, estado)`; fechado, SHALL mostrar também a primeira resposta preenchida em texto puro, de até 160 caracteres, em uma linha.
3. WHEN a missão não tem nenhum exercício que abre (ver 01.4) THEN o bloco da missão SHALL vir fechado; caso contrário, aberto.
4. WHEN o exercício está "não iniciado" E `Resumo.ex(ex)` não mostra nenhuma resposta THEN o bloco SHALL vir fechado e o corpo SHALL ser a caixa "Nenhuma resposta registrada ainda." com o link "Começar este exercício →"; caso contrário (estado diferente de "não iniciado", ou "não iniciado" com resposta já visível em `Resumo.ex`) SHALL vir aberto e o corpo SHALL ser a saída de `Resumo.ex(ex)`.
5. WHERE o exercício está "em andamento" THEN o corpo SHALL terminar com o link "Continuar este exercício →" para `#/m/{n}/{id}`.  <!-- RES-10 -->
6. WHEN o usuário aciona um `<summary>` por mouse, Enter ou Espaço THEN o bloco SHALL abrir ou fechar.
7. WHEN o usuário clica em "Expandir tudo" THEN todas as missões e exercícios SHALL abrir; WHEN clica em "Recolher tudo" THEN todos SHALL fechar.  <!-- RES-04 -->
8. WHEN o usuário marca "Mostrar só o que falta preencher" THEN a tela SHALL ocultar os exercícios "concluído" e as missões em que todos os exercícios são "concluído"; WHEN desmarca THEN SHALL mostrá-los de novo, no estado aberto ou fechado em que estavam.
9. The tela SHALL mostrar, com `aria-live="polite"`, "{N} exercícios ainda sem conclusão" (N = total − concluídos; "1 exercício ainda sem conclusão" quando N = 1) ou, quando N = 0, "Todos os exercícios estão concluídos.".
10. IF o filtro "só o que falta" está marcado e N = 0 THEN a tela SHALL mostrar "Nenhum exercício pendente.".

**Independent Test**: Abrir com a Missão 1 completa e a 4 vazia: M4 vem fechada; "Mostrar só o que falta" some com os 4 exercícios concluídos da M1.

---

### P1: Retrato do mandato no cabeçalho ⭐ MVP

**User Story**: Como membro da equipe, quero ver quem é a parlamentar e os números-chave logo ao abrir.

**Why P1**: Pedido explícito na validação.

**Acceptance Criteria**:

1. WHEN o usuário abre `#/resumo` THEN o cabeçalho SHALL mostrar um cartão com a foto da parlamentar, o nome parlamentar (ou o nome civil, se não houver), "cargo · UF" e o partido, ao lado dos números.  <!-- RES-06 -->
2. WHERE `D.tse.sq` existe THEN a foto SHALL vir do TSE, pela mesma URL que `ResumoIlhas.foto` usa (`ele2024/619` para prefeito e vereador, `ele2026/6259` para os demais cargos).
3. IF não há `D.tse.sq` ou a foto não carrega THEN o cartão SHALL mostrar a primeira letra do nome em maiúscula no lugar da foto.
4. WHERE `D.tse.votos` existe THEN o primeiro número SHALL ser a votação em formato pt-BR (`97.335`) com o rótulo "Votos válidos" e, se `D.tse.pos` existe, a legenda "{pos}º mais votado(a) · {UF} · TSE".
5. WHERE as cadeiras do partido na Casa do mandato estão disponíveis THEN um número SHALL mostrar essa quantidade com o rótulo "Cadeiras do {partido} na {Casa}".
6. WHERE os filiados do partido na UF estão disponíveis THEN um número SHALL mostrar o total, abreviado a partir de 10.000 ("112 mil+"), com o rótulo "Filiados do {partido} em {UF}".
7. WHERE a tabela de equipe tem ao menos uma linha ativa THEN um número SHALL mostrar "{X}/{Y}" (X = linhas com pessoa e sem `*`, Y = linhas ativas) com o rótulo "Cargos da equipe com nome" e, se há processos seletivos a abrir, a legenda "{K} processos seletivos a abrir" ("1 processo seletivo a abrir" quando K = 1).
8. IF a fonte de um número está indisponível (sem TSE, sem partido, sem a Casa, carga que falhou ou tabela vazia) THEN a tela SHALL omitir esse número, sem traço nem espaço vazio; IF todos faltam THEN o cabeçalho SHALL mostrar só o cartão da parlamentar.
9. IF a carga de dados de um número falha THEN o resto da tela SHALL continuar funcionando.
10. WHILE a largura da janela é de 47,5rem ou menos, o cartão da parlamentar SHALL ficar acima dos números, em faixa horizontal.

**Independent Test**: Com `D.tse` completo, ver foto (ou inicial), votos e legenda; sem `D.tse`, ver só nome e os números que existirem.

---

### P2: Cartões de aliados, opositores e potenciais

**User Story**: Como membro da equipe, quero ver as pessoas mapeadas como cartões e não como lista de texto.

**Why P2**: Melhora a leitura; o conteúdo já existe.

**Acceptance Criteria**:

1. WHEN as perguntas m1.q4 ou m1.q6 têm relações em `D.relacoes` THEN a tela SHALL mostrar três grupos — "Aliados", "Opositores" e "Potenciais", cada um com a contagem — e um cartão por pessoa.  <!-- RES-07 -->
2. Cada cartão SHALL mostrar a foto (ou a inicial), o nome, o partido, o cargo, o município quando a relação é local e, se `votos` existe, "{votos} votos" em pt-BR.
3. The cartão SHALL ter o anel da foto verde para aliado, coral para opositor e roxo para potencial.
4. IF um grupo não tem pessoas THEN a tela SHALL omitir o grupo.
5. IF nenhuma relação foi registrada THEN a tela SHALL manter "não preenchido".
6. The arquivo baixado por `Baixar.tudo` SHALL continuar com a lista de texto atual (sem cartões).

**Independent Test**: Com 3 aliados, 2 opositores e 1 potencial, ver três grupos com contagens 3, 2 e 1.

---

### P2: Problemas e potencialidades por território

**User Story**: Como membro da equipe, quero comparar, por território, o que dói e o que pode crescer.

**Why P2**: A tabela organiza o que hoje é uma lista por tipo.

**Acceptance Criteria**:

1. WHEN `D.social.itens` tem itens THEN a pergunta m1.q8 do Resumo SHALL mostrar uma tabela com as colunas "Território", "Problemas" e "Potencialidades", e uma linha por território.  <!-- RES-08 -->
2. O território SHALL ser "Brasil" para o nível `BR` e, para os níveis `UF` e `MUN`, cada nome de `nomes` (município com " ({uf})"); um item com vários nomes SHALL aparecer em uma linha por nome.
3. As linhas SHALL seguir a ordem Brasil, UFs, municípios, e dentro de UFs e de municípios a ordem alfabética pt-BR.
4. Cada item SHALL aparecer na coluna do seu tipo como uma etiqueta com o nome da agenda, vermelha para problema e verde para potencialidade, seguida do `texto` do item em letra menor.
5. IF uma linha não tem itens de um tipo THEN a célula SHALL ficar com "—".
6. IF `D.social.itens` está vazio THEN a tela SHALL mostrar "Nada registrado ainda.".
7. WHILE a largura da janela é de 47,5rem ou menos, a tabela SHALL rolar na horizontal dentro do seu quadro, sem criar rolagem horizontal na página.

**Independent Test**: Com um item de problema em SP e RJ e uma potencialidade em SP, ver 2 linhas: SP com os dois tipos e RJ com "—" em Potencialidades.

---

### P2: Organograma da equipe com vagas marcadas

**User Story**: Como membro da equipe, quero ver a escalação como organograma, com as vagas abertas destacadas.

**Why P2**: Pedido da sugestão, aceito na validação.

**Acceptance Criteria**:

1. WHEN o exercício "A escalação do time" tem linhas ativas THEN seu corpo no Resumo SHALL mostrar um organograma: a linha da Chefia de gabinete no topo e, abaixo, um ramo por área presente, na ordem de `COORDENACOES`.  <!-- RES-09 -->
2. Dentro de cada ramo, os cartões SHALL seguir a ordem das categorias Chefia, Coordenação, Especialista, Executora e, dentro delas, a ordem das linhas.
3. Cada cartão SHALL mostrar o cargo e, em destaque, a pessoa; linha com `*` na pessoa SHALL mostrar "Processo seletivo a abrir" com borda tracejada; linha sem pessoa SHALL mostrar "Sem nome", apagada.
4. The organograma SHALL ter uma legenda com os três estados (preenchido, processo seletivo a abrir, ainda sem nome).
5. WHERE o mandato usa o formato antigo de equipe THEN o organograma SHALL usar a vista derivada de `vistaDaTabela`, como a tabela e o PDF já fazem.
6. WHILE a largura da janela é de 47,5rem ou menos, os ramos SHALL aparecer em coluna única, sem linhas de ligação.
7. IF não há linhas ativas THEN o corpo SHALL mostrar "não preenchido".

**Independent Test**: Com 1 chefia, 2 pessoas, 1 linha com `*` e 1 vazia, ver 2 cartões comuns, 1 tracejado e 1 apagado.

---

### P3: Fragilidades com M e P em destaque

**User Story**: Como membro da equipe, quero distinguir de relance fragilidades do mandato e da parlamentar.

**Why P3**: Acabamento.

**Acceptance Criteria**:

1. WHEN o exercício "As fragilidades" tem itens classificados THEN cada item SHALL mostrar a letra M ou P em um selo (verde para M, vinho para P) seguida do texto da fragilidade.  <!-- RES-11 -->
2. IF nenhum item foi classificado THEN o corpo SHALL mostrar "não preenchido".

**Independent Test**: Com 3 itens M e 2 P, ver 5 linhas com os selos certos.

---

### P1: Nada muda fora da tela ⭐ MVP

**User Story**: Como equipe do mandato, quero que o que já uso continue funcionando igual.

**Why P1**: Impede regressão.

**Acceptance Criteria**:

1. The `Resumo.missao(m)` e o `Resumo.ex(ex)` SHALL devolver o mesmo HTML que devolviam antes desta feature, para os mesmos dados.  <!-- RES-12 -->
2. WHEN o usuário abre o Painel e abre "Ver o que foi preenchido" THEN o bloco SHALL mostrar o mesmo conteúdo de antes.
3. WHEN o usuário baixa o resumo completo THEN o arquivo SHALL conter os mesmos títulos e respostas de antes e SHALL NOT conter a barra, os segmentos nem os cartões.
4. The textos de `conteudo.js` SHALL permanecer idênticos (os testes de hash existentes seguem passando).

**Independent Test**: Rodar os testes `legado-m*.test.ts` e os e2e do Painel sem alteração; baixar o resumo e abrir o arquivo.

---

### P1: Impressão, teclado e movimento ⭐ MVP

**User Story**: Como usuário, quero imprimir o resumo e usá-lo por teclado.

**Why P1**: Impressão e acessibilidade quebram sem tratamento explícito em blocos recolhíveis.

**Acceptance Criteria**:

1. WHEN o navegador dispara `beforeprint` THEN a tela SHALL abrir todos os blocos; WHEN dispara `afterprint` THEN SHALL restaurar o estado de cada bloco como estava.  <!-- RES-05 -->
2. WHILE a mídia é de impressão, a tela SHALL ocultar a barra, as ferramentas e os indicadores de abrir e fechar.
3. The segmentos SHALL ser `<button>` com nome acessível "Ir para a Missão {n}: {título curto}", e todo controle da tela SHALL ter foco visível.
4. WHERE o usuário prefere movimento reduzido THEN a tela SHALL rolar e animar sem transição.  <!-- RES-13 -->
5. WHILE a largura da janela é de 23,4375rem (375 px), a página SHALL NOT ter rolagem horizontal.
6. The números da tela SHALL usar formato pt-BR e algarismos tabulares.

**Independent Test**: Emular mídia de impressão e ver tudo aberto e sem barra; abrir a tela a 375 px e conferir `scrollWidth <= clientWidth`.

---

## Edge Cases

- IF o mandato não tem nenhuma resposta THEN a tela SHALL mostrar "0%", "0 de 16 exercícios concluídos", todas as missões fechadas e o filtro com "16 exercícios ainda sem conclusão".
- IF todos os 16 exercícios estão concluídos THEN a tela SHALL mostrar "100%" e "Todos os exercícios estão concluídos.".
- IF uma resposta tem texto longo, sem espaços ou com HTML THEN a prévia SHALL mostrar texto puro e SHALL NOT quebrar o layout.
- IF a pessoa abre `#/resumo` sem nuvem (modo local) THEN a tela SHALL funcionar igual.
- WHEN o usuário troca de tela e volta THEN a tela SHALL ser desenhada de novo a partir dos dados atuais, com a regra de abertura inicial.
- IF o nome parlamentar tem acento ou emoji THEN a inicial SHALL ser a primeira letra visível, sem erro.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| RES-01 | P1: Missões e exercícios recolhíveis | Execute (T1, T2, T3) | In progress |
| RES-02 | P1: Barra fixa com progresso e navegação | Execute (T2, T3) | Implemented (aguarda o Verifier) |
| RES-03 | P1: Barra fixa com progresso e navegação (ação única) | Execute (T2, T3) | Implemented (aguarda o Verifier) |
| RES-04 | P1: Missões e exercícios recolhíveis (ferramentas) | Execute (T2) | Implemented (aguarda o Verifier) |
| RES-05 | P1: Impressão, teclado e movimento | Execute (T2, T3) | In progress |
| RES-06 | P1: Retrato do mandato no cabeçalho | Execute (T4, T5) | Implemented (aguarda o Verifier) |
| RES-07 | P2: Cartões de aliados, opositores e potenciais | Execute (T8) | Implemented (aguarda o Verifier) |
| RES-08 | P2: Problemas e potencialidades por território | Execute (T9, T10) | Implemented (aguarda o Verifier) |
| RES-09 | P2: Organograma da equipe com vagas marcadas | Execute (T6, T7) | Implemented (aguarda o Verifier) |
| RES-10 | P1: Missões e exercícios recolhíveis (saída do vazio) | Execute (T1) | Implemented (aguarda o Verifier) |
| RES-11 | P3: Fragilidades com M e P em destaque | Tasks | Pending |
| RES-12 | P1: Nada muda fora da tela | Execute (T1) | In progress |
| RES-13 | P1: Impressão, teclado e movimento (acessibilidade) | Execute (T2, T3) | In progress |

**Coverage:** 13 total, 13 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Abrir `#/resumo` de um mandato com 6 de 16 exercícios concluídos mostra "38%" e os cinco segmentos com os contadores certos.
- [ ] Os testes existentes (`npm test` e os e2e de Painel, Guia e Missões) passam sem alteração.
- [ ] A tela a 375 px não tem rolagem horizontal e o botão de download fica no rodapé.
- [ ] O Verifier confirma cada RES-01 a RES-13 com evidência `arquivo:linha`.
