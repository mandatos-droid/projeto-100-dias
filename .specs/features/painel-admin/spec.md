# Painel do Administrador Specification

## Problem Statement

A equipe da Legisla acompanha os mandatos só pelo `/painel` (métricas agregadas, HTML à mão). Não há onde gerir a própria equipe, ver e ajustar gabinetes, nem consultar logs: incluir alguém na equipe exige SQL no Supabase, e nenhuma ação administrativa deixa registro. O `/admin` entrega essa gestão, com métricas e logs, sem expor o texto escrito pelos gabinetes. O desenho aprovado está em `wireframes/painel-admin.html`.

## Goals

- [ ] Um admin inclui, muda o papel e remove pessoas da equipe Legisla sem tocar em SQL.
- [ ] Um admin encontra qualquer mandato por busca ou filtro em até 3 interações e gerencia seus membros, arquivamento e exclusão.
- [ ] Toda ação administrativa que altera dados deixa uma linha de auditoria legível no painel.
- [ ] A equipe vê, na tela Analytics, o status de atividade dos mandatos por mês, o funil das 5 missões e onde os mandatos travam.
- [ ] Nenhuma tela do `/admin` exibe o texto escrito pelos gabinetes.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep. Estes itens, mais os riscos do `design.md`, alimentam a spec da Fase 2 do painel, que é criada ao final desta feature (última task de `tasks.md`).

| Feature | Reason |
| ------- | ------ |
| Ler o texto escrito pelos gabinetes (`dados`, `eventos.texto`) | Esta spec mostra só números e metadados; a leitura do texto fica para a Fase 2 |
| Substituir ou migrar o `/painel` | Continua como está; o `/admin` só leva um link para ele |
| Convidar por e-mail quem ainda não tem conta | Exige chave `service_role` em rota de servidor; v1 inclui só quem já entrou na plataforma |
| Rota de servidor que lê logs da Vercel e do Supabase | v1 só abre os painéis dessas ferramentas por link |
| Editar o conteúdo ou os dados do mandato (metas, campos, exercícios) | A Legisla lê e gerencia membros, não escreve no conteúdo |
| Papéis além de `admin` e `leitura` | Decisão do usuário: dois papéis bastam por enquanto |
| Exportar CSV dos mandatos ou do Analytics | Não pedido no desenho aprovado |
| Notificações (e-mail, push) de mandatos parados | Não pedido no desenho aprovado |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Onde mora o painel | Rota `/admin` no app Next.js, separada do Guia legado; `/painel` segue como está | Wireframe aprovado traz o link "Painel de métricas (/painel)" no menu | y |
| Papéis da equipe | `admin` e `leitura`; linhas `analista` existentes viram `leitura` na migration | `analista` e `leitura` enxergam o mesmo hoje; decisão do usuário | y |
| O que `leitura` vê | Todas as telas, incluindo Equipe e Logs de ações, sem nenhum botão que altere dados | Decisão do usuário | y |
| Escopo e ordem | Fase 1 (Equipe, Mandatos, Detalhe, Analytics, Logs com dados existentes) primeiro; registro de uso das funcionalidades como P3, última etapa da mesma spec | Decisão do usuário | y |
| Logs de sistema e erros | Dois links que abrem os painéis de logs da Vercel e do Supabase em nova aba | Decisão do usuário; sem tokens de servidor | y |
| Papéis de membro de mandato | Só `coordenacao` e `assessoria`, os dois que o Guia grava hoje (`nucleo.js`) | O wireframe mostrava "parlamentar", que o sistema não tem; o wireframe será corrigido | y |
| Tela inicial do `/admin` | Mandatos | É a tela P1 de uso mais frequente | n |
| Como o painel altera dados | Funções SQL `security definer` que checam `private.eh_legisla_admin()` e gravam a auditoria na mesma transação; sem `service_role` no navegador | Segue o padrão de `excluir_mandato` e a regra do projeto de nunca expor `service_role` | n |
| Permissão vale na hora | O papel é lido da tabela `equipe_legisla` a cada chamada, não do token | Evita o atraso de até 1 hora do JWT; o RLS atual já funciona assim | n |
| Última atividade de um mandato | O maior entre `mandatos.atualizado_em` e o último `eventos.criado_em` | `atualizado_em` muda quando o gabinete salva exercícios; `eventos` só guarda o diário | n |
| Spec da Fase 2 do painel | Criada ao final desta feature, pelo fluxo de Specify, a partir da tabela "Out of Scope" e dos riscos do `design.md`. Nesta spec, "Fase 2" não é o registro de uso (que é P3 aqui) | Pedido do usuário; evita perder o que ficou de fora | y |
| Consentimento de acesso da equipe | Quem se cadastra consente que a equipe Legisla acesse os dados do mandato; `mandatos.permite_pesquisa` não condiciona mais nenhuma tela | Decisão do usuário em 2026-11-05 | y |
| Aviso de privacidade do cadastro | O texto atual (`lib/legacyBody.ts`) diz que o conteúdo é acessível a quem tiver o código de convite e não cita a equipe Legisla; atualizar o texto e a versão do consentimento fica para a Fase 2 | O consentimento só vale para o que o aviso informa; mexer no texto jurídico não faz parte desta spec | n |
| Escala de dias | Uma escala única: 7, 15, 30 e 45 dias. Vale para o seletor "Parado há" (Mandatos e Analytics) e para o filtro de período do Analytics | Decisão do usuário | y |
| Seletor "Parado há" na lista de mandatos | Padrão "qualquer" (não filtra) com destaque de "X dias parado" a partir de 45 dias; ao escolher 7, 15, 30 ou 45, filtra a lista e o destaque passa a usar esse N | Com padrão 45 filtrando, a lista inicial já abriria só com os parados; o wireframe aprovado já traz a opção "qualquer" | n |
| Mandato "parado" | Última atividade há mais de N dias, com N escolhido na escala; padrão 45 | 45 era o valor do wireframe; a escala deixa a equipe apertar o critério | n |
| Status de atividade no mês | Ativo = ao menos 1 linha em `eventos` no mês; Parado = cadastrado até o fim do mês e sem linha | Só `eventos` guarda histórico por data. O Guia grava uma linha por exercício concluído (`guia.js:140`, texto = título do exercício); um mandato que trabalha sem concluir exercícios no mês aparece como Parado (limitação conhecida) | n |
| Fuso dos meses e das datas | `America/Sao_Paulo` | Público e equipe no Brasil | n |
| Missão concluída, exercício alcançado, total de exercícios | Missão N concluída = todos os seus exercícios em `dados.feitos`, como em `public/painel.html`. O catálogo tem 16 exercícios (4, 2, 4, 3 e 3 por missão). "Alcançaram" o exercício k = mandatos que concluíram o exercício anterior na ordem do Guia (no primeiro, todos) | O painel atual só sabe "concluído"; o Guia não registra "iniciado". "Alcançou" é calculável e tem uma única leitura | n |
| Linhas da tabela "uso por funcionalidade" na Fase 1 | Persona, Conjuntura, Município, Eleitorado, Social, Cadeiras e escalação, pelos campos já preenchidos em `dados`. Organograma e rotinas, Exportar PDF e Enviar sugestão entram com o registro de uso (P3) | Só estes seis têm um campo em `dados` que prova o uso | n |
| Filtros do Analytics | Período (7, 15, 30 ou 45 dias; padrão 30) vale para "ativos" e para o uso; UF vale para tudo; funil e travas mostram o estado atual, sem período | Funil e conclusão são acumulados, não têm janela | n |
| Arquivar um mandato | Esconde da lista padrão e do Analytics; os membros continuam acessando normalmente | Arquivar é organização da equipe, não bloqueio do gabinete | n |
| Coordenação mínima | O painel recusa remover ou rebaixar a última pessoa da coordenação de um mandato | Sem coordenação, ninguém do gabinete consegue excluir ou gerir o cadastro | n |
| Campos exibidos do mandato | Código, nome parlamentar, cargo, casa, UF, partido, posse, responsável (nome e cargo), contagens; nunca `nome_civil`, `resp_telefone`, `dados` nem `eventos.texto` | Minimização de dados: a spec mostra só o necessário, mesmo com o consentimento dado no cadastro | n |
| Tamanho das páginas | 25 mandatos por página; 50 linhas de log por página | Cabe em tela de celular sem carregar demais | n |
| Busca de mandato | Sem diferenciar maiúsculas nem acentos, por código ou nome parlamentar | Uso comum em nomes brasileiros | n |
| Links de log do sistema | `https://vercel.com/legisla/projeto-100-dias/logs` e `https://supabase.com/dashboard/project/fldmekrexvzchynnmeuq/logs/explorer`; conferir no Design que abrem | Time, projeto e ref vêm do `CLAUDE.md`; os caminhos exatos não foram testados | n |
| Registro de uso (P3) | Tabela com só `mandato_id`, `funcionalidade` e `criado_em`; sem texto, sem `user_id`; 1 linha por abertura, no máximo 1 por minuto por funcionalidade e mandato; sem expiração na v1 | Mínimo para contar uso sem dado pessoal | n |
| Tendência de uso | Aberturas por semana nas últimas 5 semanas | Reproduz as 5 barras do wireframe | n |
| Visual do `/admin` | Paleta e tipografia da Legisla (`--vinho`, `--papel`), não o cinza do wireframe | Segue a identidade do produto; o wireframe só define estrutura | n |
| Publicação | Aprovar esta spec autoriza código e commits locais; a migration vai ao banco de produção só quando a `main` for publicada (workflow `migrations.yml`), com go-ahead explícito | Regra de blast radius do fluxo e do `CLAUDE.md` | y |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Entrar no `/admin` e ter o papel respeitado ⭐ MVP

**User Story**: Como pessoa da equipe Legisla, quero entrar no `/admin` com o meu login e ver só o que o meu papel permite, para que ninguém de fora acesse dados dos gabinetes.

**Why P1**: Sem acesso e permissões nenhuma outra tela é segura.

**Acceptance Criteria** (each line is one EARS pattern):

1. WHEN uma pessoa sem sessão abre `/admin` THEN the painel SHALL mostrar a tela de entrada (Google ou e-mail, a mesma do `/painel`) e nenhum dado de mandato. <!-- event-driven -->
2. WHEN uma pessoa com sessão e sem linha em `equipe_legisla` abre `/admin` THEN the painel SHALL mostrar a mensagem "Sem acesso" e não consultar nenhuma tabela ou view de mandatos. <!-- event-driven -->
3. WHEN uma pessoa com papel `admin` ou `leitura` abre `/admin` THEN the painel SHALL abrir na tela Mandatos, com o menu Equipe, Mandatos, Analytics, Logs e o link para `/painel`. <!-- event-driven -->
4. The painel SHALL reaproveitar a sessão guardada em `legisla.tok` pelo Guia, sem pedir novo login a quem já entrou. <!-- ubiquitous -->
5. IF uma chamada ao Supabase responder 401 THEN the painel SHALL voltar à tela de entrada. <!-- unwanted-behavior -->
6. WHILE o papel da pessoa é `leitura` the painel SHALL ocultar todos os botões que alteram dados (Incluir pessoa, Remover, Editar, Adicionar membro, Arquivar, Excluir) e deixar os seletores de papel desabilitados. <!-- state-driven -->
7. IF uma pessoa com papel `leitura` enviar direto ao Supabase uma operação de escrita do painel THEN the banco SHALL rejeitar com erro de permissão e nenhum dado mudar. <!-- unwanted-behavior -->
8. IF uma pessoa sem linha em `equipe_legisla` consultar as views e funções do painel THEN the banco SHALL devolver erro de permissão ou zero linhas, nunca dados de mandato. <!-- unwanted-behavior -->
9. The banco SHALL aceitar só `admin` e `leitura` em `equipe_legisla.papel`, e a migration SHALL converter as linhas `analista` em `leitura`. <!-- ubiquitous -->
10. The banco SHALL ler o papel da tabela `equipe_legisla` a cada chamada, de modo que uma troca de papel vale na chamada seguinte. <!-- ubiquitous -->

**Independent Test**: Abrir `/admin` sem sessão, com conta fora da equipe, como leitura e como admin, e conferir tela, botões e erro de escrita direta pela API.

---

### P1: Gerir a equipe Legisla ⭐ MVP

**User Story**: Como admin, quero incluir, mudar o papel e remover pessoas da equipe pela tela, para não depender de SQL.

**Why P1**: É a única forma de dar ou tirar acesso hoje, e só funciona com SQL.

**Acceptance Criteria**:

1. WHEN uma pessoa com papel `admin` ou `leitura` abre Equipe THEN the painel SHALL listar toda a equipe com nome, e-mail, papel e data de entrada, da entrada mais antiga para a mais recente. <!-- event-driven -->
2. WHEN o admin informa o e-mail de uma conta existente, escolhe o papel e confirma THEN the painel SHALL incluir a pessoa na equipe com esse papel e mostrá-la na lista. <!-- event-driven -->
3. The busca por e-mail SHALL comparar o e-mail exato sem diferenciar maiúsculas nem espaços nas pontas, devolver no máximo uma pessoa e responder só a admin. <!-- ubiquitous -->
4. IF o e-mail não tem conta na plataforma THEN the painel SHALL mostrar "Nenhuma conta com este e-mail. A pessoa precisa entrar na plataforma uma vez." e não incluir ninguém. <!-- unwanted-behavior -->
5. IF a pessoa já está na equipe THEN the painel SHALL mostrar "Esta pessoa já está na equipe." e não duplicar a linha. <!-- unwanted-behavior -->
6. WHEN o admin troca o papel de uma pessoa THEN the painel SHALL gravar o novo papel e mostrá-lo na lista. <!-- event-driven -->
7. WHEN o admin pede para remover uma pessoa e confirma THEN the painel SHALL tirá-la da equipe sem apagar a conta dela na plataforma. <!-- event-driven -->
8. IF a ação deixaria a equipe sem nenhum `admin` (remover ou rebaixar o último) THEN the painel SHALL recusar com "A equipe precisa ter ao menos um admin." e nada mudar. <!-- unwanted-behavior -->

**Independent Test**: Incluir uma conta de teste como `leitura`, promover a `admin`, tentar rebaixar o único admin e remover a conta de teste.

---

### P1: Registrar toda ação administrativa em auditoria ⭐ MVP

**User Story**: Como admin, quero que cada alteração feita no painel fique registrada, para saber quem fez o quê e quando.

**Why P1**: Sem auditoria, ações como excluir mandato não deixam rastro.

**Acceptance Criteria**:

1. WHEN uma ação do painel que altera dados é concluída (incluir, mudar papel ou remover pessoa da equipe; adicionar, editar ou remover membro de mandato; arquivar, desarquivar ou excluir mandato) THEN the banco SHALL gravar uma linha em `auditoria_admin` com data e hora, quem fez, ação, alvo e detalhe, na mesma transação da ação. <!-- event-driven -->
2. IF a gravação da auditoria falhar THEN the banco SHALL desfazer a ação e nada mudar. <!-- unwanted-behavior -->
3. The `auditoria_admin` SHALL aceitar só inclusão: nenhum papel, nem `admin`, edita ou apaga linhas pela API ou pelo painel. <!-- ubiquitous -->
4. WHEN o admin exclui um mandato THEN the linha de auditoria SHALL guardar o código e o nome parlamentar do mandato. <!-- event-driven -->
5. WHEN uma pessoa com papel `admin` ou `leitura` abre Logs, aba "Ações da equipe" THEN the painel SHALL listar as linhas da mais recente para a mais antiga, 50 por página, com data e hora no fuso de Brasília, quem fez e a descrição. <!-- event-driven -->

**Independent Test**: Executar cada ação, conferir a linha correspondente na aba, e provar que `update` e `delete` na tabela falham.

---

### P1: Listar e achar mandatos ⭐ MVP

**User Story**: Como pessoa da equipe, quero listar e filtrar os mandatos, para encontrar um gabinete e ver quem está parado.

**Why P1**: É a porta de entrada para o detalhe e para o apoio aos gabinetes.

**Acceptance Criteria**:

1. WHEN a pessoa abre Mandatos THEN the painel SHALL listar os mandatos não arquivados, 25 por página, com código, parlamentar, cargo, UF, partido, número de membros, última atividade. <!-- event-driven -->
2. The lista SHALL vir de uma view que não contém `nome_civil`, `resp_telefone`, `dados` nem `eventos.texto`. <!-- ubiquitous -->
3. WHEN a pessoa digita na busca THEN the painel SHALL filtrar por código ou nome parlamentar, sem diferenciar maiúsculas nem acentos. <!-- event-driven -->
4. WHEN a pessoa escolhe UF, casa ou situação (ativos ou arquivados) THEN the painel SHALL combinar os filtros escolhidos com a busca. <!-- event-driven -->
5. WHILE a última atividade de um mandato tem mais de N dias, com N o valor do seletor "Parado há" (7, 15, 30 ou 45; padrão 45), the painel SHALL mostrar "X dias parado" em destaque na linha, com X os dias reais. <!-- state-driven -->
6. WHEN a pessoa clica em Ver THEN the painel SHALL abrir o detalhe daquele mandato. <!-- event-driven -->
7. IF nenhum mandato atende aos filtros THEN the painel SHALL mostrar "Nenhum mandato encontrado" e um botão para limpar os filtros. <!-- unwanted-behavior -->
8. The "última atividade" SHALL ser o maior entre `mandatos.atualizado_em` e o último `eventos.criado_em` do mandato. <!-- ubiquitous -->
9. WHEN a pessoa escolhe um valor no seletor "Parado há" THEN the painel SHALL listar só os mandatos com última atividade há mais de N dias, combinado com a busca e os outros filtros. <!-- event-driven -->

**Independent Test**: Com mandatos de teste de UFs e atividades diferentes, filtrar, buscar sem acento e conferir o destaque de parado e as colunas ausentes.

---

### P1: Ver o detalhe do mandato e gerir seus membros ⭐ MVP

**User Story**: Como admin, quero ver o cadastro de um mandato e adicionar, editar e remover membros, para dar suporte ao gabinete.

**Why P1**: É o caso de uso de suporte que hoje exige SQL.

**Acceptance Criteria**:

1. WHEN a pessoa abre o detalhe THEN the painel SHALL mostrar o cadastro (cargo, casa e UF, partido, posse, responsável com nome e cargo, criado em), as contagens de andamento (missões concluídas de 5 e exercícios feitos) e a última atividade. <!-- event-driven -->
2. The detalhe SHALL nunca exibir `dados`, `eventos.texto`, `nome_civil` nem `resp_telefone`. <!-- ubiquitous -->
3. WHEN a pessoa abre o detalhe THEN the painel SHALL listar os membros com nome, e-mail, papel (`coordenacao` ou `assessoria`) e data de entrada. <!-- event-driven -->
4. WHEN o admin informa o e-mail de uma conta existente, escolhe o papel e confirma THEN the painel SHALL adicionar a pessoa ao mandato com esse papel. <!-- event-driven -->
5. IF o e-mail não tem conta THEN the painel SHALL mostrar a mesma mensagem da Equipe e não adicionar ninguém. <!-- unwanted-behavior -->
6. IF a pessoa já é membro do mandato THEN the painel SHALL mostrar "Esta pessoa já é membro deste mandato." e não duplicar. <!-- unwanted-behavior -->
7. WHEN o admin troca o papel de um membro THEN the painel SHALL gravar o novo papel e mostrá-lo na lista. <!-- event-driven -->
8. WHEN o admin pede para remover um membro e confirma THEN the painel SHALL tirá-lo do mandato sem apagar a conta nem os registros que ele escreveu. <!-- event-driven -->
9. IF a ação deixaria o mandato sem ninguém na `coordenacao` (remover ou rebaixar a última) THEN the painel SHALL recusar com "O mandato precisa de ao menos uma pessoa na coordenação." e nada mudar. <!-- unwanted-behavior -->

**Independent Test**: Em um mandato de teste, adicionar, editar e remover membros, tentar tirar a única coordenação e conferir que nenhum texto de gabinete aparece na tela.

---

### P1: Arquivar e excluir mandatos ⭐ MVP

**User Story**: Como admin, quero arquivar um mandato (reversível) e, só se preciso, excluí-lo de vez, para manter a lista limpa sem perder dados por engano.

**Why P1**: A exclusão é irreversível; o arquivamento é o caminho seguro.

**Acceptance Criteria**:

1. WHEN o admin arquiva um mandato THEN the painel SHALL gravar a data de arquivamento, escondê-lo da lista padrão e do Analytics, e os membros SHALL continuar acessando o mandato normalmente. <!-- event-driven -->
2. WHEN o admin desarquiva um mandato pelo filtro "Arquivados" THEN the painel SHALL devolvê-lo à lista padrão e ao Analytics. <!-- event-driven -->
3. WHILE o texto digitado no campo de confirmação difere do código do mandato the painel SHALL manter o botão "Excluir definitivamente" desabilitado. <!-- state-driven -->
4. WHEN o admin confirma a exclusão com o código exato THEN the banco SHALL apagar o mandato e, em cascata, seus membros e eventos, e as sugestões enviadas SHALL ficar com `mandato_id` nulo. <!-- event-driven -->
5. The exclusão e o arquivamento SHALL passar por funções do banco que exigem papel `admin`, sem `delete` ou `update` direto da tabela pelo painel. <!-- ubiquitous -->

**Independent Test**: Arquivar e desarquivar um mandato de teste; excluir outro digitando o código e conferir cascata e auditoria.

---

### P2: Acompanhar o Analytics

**User Story**: Como pessoa da equipe, quero ver indicadores, a atividade por mês, o funil das missões e onde os mandatos travam, para decidir onde apoiar.

**Why P2**: Usa dados que já existem, mas só faz sentido com a gestão pronta.

**Acceptance Criteria**:

1. WHEN a pessoa abre Analytics THEN the painel SHALL mostrar 4 indicadores: mandatos cadastrados (não arquivados), ativos no período, média de exercícios concluídos e mandatos parados há mais de N dias (N do seletor "Parado há", padrão 45). <!-- event-driven -->
2. WHEN a pessoa muda o período (7, 15, 30 ou 45 dias) THEN the painel SHALL recalcular "ativos" e, quando o registro de uso estiver ativo, as aberturas; funil e travas SHALL permanecer iguais. <!-- event-driven -->
3. WHEN a pessoa escolhe uma UF THEN the painel SHALL recalcular todos os indicadores, gráficos e tabelas só com os mandatos daquela UF. <!-- event-driven -->
4. WHEN a pessoa abre Analytics THEN the painel SHALL mostrar o gráfico "Status de atividade dos mandatos por mês" em colunas empilhadas, do mês do primeiro cadastro até o mês atual, no máximo 12 meses. <!-- event-driven -->
5. The gráfico mensal SHALL contar como Ativo o mandato com ao menos 1 linha em `eventos` no mês e como Parado o mandato cadastrado até o fim do mês e sem linha, no fuso `America/Sao_Paulo`, sem mandatos arquivados. <!-- ubiquitous -->
6. IF não existe nenhum mandato THEN the painel SHALL mostrar "Ainda não há mandatos cadastrados." no lugar dos gráficos. <!-- unwanted-behavior -->
7. The painel SHALL mostrar o funil das missões com 5 barras (Missão 1 a 5), cada uma com o número e a porcentagem de mandatos que a concluíram, pela regra de `public/painel.html`. <!-- ubiquitous -->
8. WHEN a pessoa abre Analytics THEN the painel SHALL listar na tabela "onde os mandatos travam" até 10 exercícios, do maior para o menor abandono, com alcançaram, concluíram e abandono em porcentagem inteira, sendo abandono = (alcançaram − concluíram) ÷ alcançaram, arredondado. <!-- event-driven -->
9. IF um exercício tem 0 mandatos que o alcançaram THEN the painel SHALL omitir a linha dele da tabela de travas. <!-- unwanted-behavior -->
10. The painel SHALL dar a todo gráfico um título, uma linha de unidade embaixo do título, eixo com valores (quando houver eixo) e legenda (quando houver mais de uma série). <!-- ubiquitous -->
11. The tabela "uso por funcionalidade" SHALL mostrar a coluna "Mandatos que usaram" calculada dos campos já preenchidos em `dados`. <!-- ubiquitous -->
12. WHILE o registro de uso não está ativo the painel SHALL mostrar "—" nas colunas "Aberturas" e "Tendência" e "Sem registro de uso ainda" no gráfico de uso por dia. <!-- state-driven -->

**Independent Test**: Com mandatos de teste espalhados por meses e UFs, conferir cada número contra uma contagem feita à mão no banco.

---

### P2: Consultar os Logs

**User Story**: Como pessoa da equipe, quero ver a atividade dos gabinetes e os erros do sistema, para detectar problemas e quem precisa de apoio.

**Why P2**: Complementa a auditoria (P1) com atividade e acesso aos logs técnicos.

**Acceptance Criteria**:

1. WHEN a pessoa abre Logs, aba "Atividade dos gabinetes" THEN the painel SHALL listar os eventos da mais recente para a mais antiga, 50 por página, com data e hora, missão, código do mandato e exercício, e "texto oculto" no lugar do texto. <!-- event-driven -->
2. IF um evento não tem missão THEN the painel SHALL mostrar "—" na coluna de missão. <!-- unwanted-behavior -->
3. The leitura da atividade SHALL passar por uma view que não contém `eventos.texto`. <!-- ubiquitous -->
4. WHEN a pessoa abre Logs, aba "Sistema e erros" THEN the painel SHALL mostrar dois links, "Abrir logs na Vercel" e "Abrir logs no Supabase", que abrem em nova aba com `rel="noopener noreferrer"`. <!-- event-driven -->

**Independent Test**: Registrar eventos de teste e conferir que a aba mostra data, missão e código sem o texto; clicar nos dois links.

---

### P3: Registrar e mostrar o uso das funcionalidades

**User Story**: Como pessoa da equipe, quero saber quantas vezes cada funcionalidade do Guia é aberta, para priorizar melhorias.

**Why P3**: Hoje ninguém registra abertura; exige mexer no Guia legado e criar tabela.

**Acceptance Criteria**:

1. WHEN uma pessoa logada, com mandato aberto, abre uma funcionalidade da lista de uso THEN the Guia SHALL gravar 1 linha em `uso_funcionalidades` com `mandato_id`, identificador estável da funcionalidade e `criado_em`. <!-- event-driven -->
2. The linha de uso SHALL NOT conter texto, nome, e-mail nem `user_id`. <!-- ubiquitous -->
3. IF a gravação do uso falhar THEN the Guia SHALL ignorar o erro, sem aviso à pessoa e sem nova tentativa. <!-- unwanted-behavior -->
4. WHILE o Guia roda sem nuvem (`NUVEM=false`) the Guia SHALL NOT gravar uso. <!-- state-driven -->
5. WHEN a mesma funcionalidade é aberta pelo mesmo mandato mais de uma vez em 60 segundos THEN the Guia SHALL gravar só 1 linha. <!-- event-driven -->
6. The banco SHALL aceitar inclusão em `uso_funcionalidades` só de membros do próprio mandato e leitura só da equipe Legisla. <!-- ubiquitous -->
7. WHILE o registro de uso está ativo the painel SHALL mostrar na tabela "uso por funcionalidade" as aberturas do período e a tendência (aberturas por semana nas últimas 5 semanas), e o gráfico "Uso das funcionalidades por dia" com os últimos 14 dias. <!-- state-driven -->

**Independent Test**: Abrir uma funcionalidade no Guia, conferir a linha gravada sem dado pessoal, repetir em 60 s e conferir que não duplica, e ver os números no Analytics.

---

### P2: Usar o painel no celular

**User Story**: Como pessoa da equipe, quero usar o `/admin` no celular, para acompanhar os gabinetes fora do computador.

**Why P2**: O usuário que pediu o painel o revisa pelo celular.

**Acceptance Criteria**:

1. The painel SHALL funcionar em tela de 360 px de largura sem rolagem horizontal da página, com as tabelas rolando dentro do próprio quadro. <!-- ubiquitous -->
2. The painel SHALL manter todo botão e campo alcançável por toque, com alvo de pelo menos 40 px de altura. <!-- ubiquitous -->

**Independent Test**: Abrir cada tela com a janela em 360 px e conferir ausência de rolagem lateral na página.

---

## Edge Cases

- IF o Supabase não responder ou responder erro 5xx THEN the painel SHALL mostrar "Não foi possível carregar. Tentar de novo" com botão, sem tela em branco.
- IF o admin clicar duas vezes em Incluir, Adicionar ou Excluir THEN the painel SHALL enviar a ação uma só vez (botão desabilitado enquanto envia).
- IF dois admins removem a mesma pessoa ao mesmo tempo THEN the banco SHALL concluir a primeira e responder à segunda "Pessoa não encontrada", sem erro técnico visível.
- IF um admin rebaixa a si mesmo e ainda há outro admin THEN the painel SHALL permitir e recarregar a tela já no novo papel.
- WHEN a lista de mandatos tem exatamente 25 itens THEN the painel SHALL não mostrar página seguinte.
- IF um mandato não tem nenhum evento THEN the painel SHALL usar `atualizado_em` como última atividade.
- IF o e-mail digitado tem formato inválido THEN the painel SHALL mostrar "Digite um e-mail válido." e não consultar o banco.

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| ADM-01 | P1: Entrar no `/admin` e ter o papel respeitado (AC 1 a 5, tela de entrada e sessão) | Specify | Implementing |
| ADM-02 | P1: Entrar no `/admin` e ter o papel respeitado (AC 6 a 10, papéis e permissões no banco) | Specify | Implementing |
| ADM-03 | P1: Gerir a equipe Legisla | Specify | Implementing |
| ADM-04 | P1: Registrar toda ação administrativa em auditoria | Specify | Implementing |
| ADM-05 | P1: Listar e achar mandatos | Specify | Implementing |
| ADM-06 | P1: Detalhe do mandato (AC 1 e 2, cadastro e privacidade) | Specify | Implementing |
| ADM-07 | P1: Detalhe do mandato (AC 3 a 9, CRUD de membros) | Specify | Implementing |
| ADM-08 | P1: Arquivar e excluir mandatos | Specify | Implementing |
| ADM-09 | P2: Analytics (AC 1 a 3, indicadores e filtros) | Specify | Implementing |
| ADM-10 | P2: Analytics (AC 4 a 6, status de atividade por mês) | Specify | Implementing |
| ADM-11 | P2: Analytics (AC 7 a 10, funil, travas e títulos de gráfico) | Specify | Implementing |
| ADM-12 | P2: Analytics (AC 11 e 12, uso por funcionalidade sem registro) | Specify | Implementing |
| ADM-13 | P2: Consultar os Logs | Specify | Implementing |
| ADM-14 | P3: Registrar o uso das funcionalidades (AC 1 a 6) | Specify | Pending |
| ADM-15 | P3: Mostrar o uso das funcionalidades (AC 7) | Specify | Pending |
| ADM-16 | P2: Usar o painel no celular | Specify | Implementing |

**ID format:** `[CATEGORY]-[NUMBER]` (e.g., `AUTH-01`, `CART-03`, `NOTIF-02`)

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 16 total, 0 mapped to tasks, 16 unmapped ⚠️ (esperado: ainda não há tasks)

---

## Success Criteria

How we know the feature is successful:

- [ ] Um admin inclui uma pessoa na equipe em menos de 30 segundos, sem abrir o Supabase.
- [ ] Nenhuma resposta de rede das telas do `/admin` contém `dados`, `eventos.texto`, `nome_civil` nem `resp_telefone`.
- [ ] Cada ação de escrita do painel tem uma linha de auditoria; a tentativa de alterar ou apagar a auditoria falha.
- [ ] Os números do Analytics batem com uma contagem manual no banco para os mandatos de teste.
- [ ] Todas as telas abrem em 360 px sem rolagem horizontal da página.
