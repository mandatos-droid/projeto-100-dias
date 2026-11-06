# Acesso, Equipe e Convites Specification

## Problem Statement

Hoje a equipe de um mandato se forma por um código único e compartilhado (`mandatos.codigo`, função `entrar_com_codigo`). Quem tem o código entra como `assessoria`, sem registro de quem convidou, sem validade, sem como revogar uma pessoa sem trocar o código de todos e sem papel de só leitura. A tela de equipe fica no legado (`cadastro.js`) e mistura dados do mandato, código e lista de pessoas. Esta feature troca o código por um link de convite pessoal, define papéis por mandato com permissão aplicada no banco e entrega a Área do mandato e a tela Equipe e convites aprovadas em `wireframes/equipe-mandato` (artefato aprovado em 2026-11-05).

## Goals

- [ ] Qualquer pessoa da equipe de um mandato gera, em até 2 interações, um link de convite com nome, papel e validade, e o envia por onde quiser (copiar, mensagem pronta ou WhatsApp).
- [ ] Quem abre o link vê quem convidou e em qual mandato vai entrar, cria a conta ou entra, e fica no mandato com o papel do convite, sem digitar código.
- [ ] O banco impede que uma pessoa dê a outra um papel maior que o seu e impede que o mandato fique sem coordenação.
- [ ] Todo convite criado, aceito ou cancelado, toda troca de papel e toda remoção deixa uma linha de histórico visível na Área do mandato.
- [ ] O código de convite antigo deixa de existir no uso, na tela e no banco.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| ------- | ------ |
| Envio automático de e-mail de convite | O e-mail embutido do Supabase entrega 2 por hora e só para a equipe do projeto; um serviço de e-mail próprio exige domínio verificado e outra ferramenta. Decisão do usuário: link pessoal, sem e-mail |
| Migrar o login do Guia para sessão por cookie (`@supabase/ssr`) | O Guia e o `/admin` leem a sessão de `legisla.tok`; trocar o mecanismo quebraria os dois. Fica para uma feature própria |
| Mudanças no `/admin` | Tem spec própria (`painel-admin`); aqui só se registra a dependência do terceiro papel (ver Assumptions) |
| Reescrever o texto jurídico do aviso de privacidade | Decisão registrada em `painel-admin`: texto e versão do consentimento ficam para a Fase 2 do painel; aqui só se troca a expressão "código de convite" |
| Transferir a titularidade do mandato | Não pedido |
| Convite em lote (planilha ou lista de e-mails) | Não pedido; o fluxo é uma pessoa por vez |
| Restringir contas a um domínio de e-mail | Não pedido; o convite é por link pessoal |
| Notificar quem convidou quando o convite é aceito | Sem e-mail e sem push; o aceite aparece na lista de pessoas e no histórico |
| Novos métodos de login além de e-mail com senha e Google | Mantém o que já existe |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Forma do convite | Link pessoal gerado no app e enviado pelo próprio usuário; nenhum e-mail sai do sistema | Decisão do usuário em 2026-11-05 | y |
| Quem pode convidar | Qualquer membro do mandato, em qualquer papel | Decisão do usuário | y |
| Limite do papel concedido | Quem convida só concede papel igual ou menor que o seu, na ordem `coordenacao` > `assessoria` > `leitura` | Sem esse limite, um membro `leitura` convidaria alguém como `coordenacao` e escalaria o próprio acesso | n |
| Papéis do mandato | `coordenacao`, `assessoria` e `leitura` (rótulo "Somente leitura"); a coluna `membros.papel` passa a aceitar os três | Wireframe aprovado | y |
| Permissão de cada papel | `coordenacao` e `assessoria` editam o conteúdo do mandato; `leitura` só consulta. Só `coordenacao` troca papéis e remove pessoas | Sugestão do wireframe; o usuário não contestou | n |
| Titular na lista de pessoas | O parlamentar aparece no cartão de dados do mandato, não como linha de membro, porque o sistema não tem papel "titular"; a linha "Ana Souza, titular" do wireframe sai | `painel-admin` já registrou que o sistema não tem esse papel | n |
| Seletor de mandato | Aparece no topo só para quem pertence a 2 ou mais mandatos; com 1 mandato não aparece | O legado já guarda uma lista de mandatos por pessoa (`nucleo.js:149`) | n |
| Código de convite antigo | Deixa de valer na entrega: a função `entrar_com_codigo` perde a permissão de execução, a UI do código sai e a coluna `mandatos.codigo` continua existindo como identificador interno de busca | Os únicos cadastros hoje são de pessoas da equipe Legisla (informação do usuário); `painel-admin` e o painel `/painel` usam `codigo` para achar mandatos | n |
| Sessão compartilhada | As páginas novas gravam a sessão em `legisla.tok` no mesmo formato do Guia, de modo que Guia e `/admin` seguem funcionando sem novo login | `painel-admin` já depende de `legisla.tok` | n |
| Métodos de login | E-mail com senha e Google, como hoje; nenhum novo | Fora de escopo acrescentar métodos | n |
| Login com Google na página do convite | Depois do retorno do Google, o sistema conclui o aceite do mesmo convite; a URL da página do convite entra nas Redirect URLs do Supabase (ação manual fora do código) | O retorno do Google passa pela raiz (AD-001); o mecanismo exato fica para o `design.md` | n |
| Formato e armazenamento do token | 128 bits aleatórios de gerador criptográfico, 22 caracteres em base64url; o banco guarda só o hash SHA-256 | Decisão sobre segurança aprovada pelo usuário; o hash impede reconstruir links a partir de um vazamento do banco | y |
| Validade e uso | 7 dias; uso único | Valores aprovados pelo usuário | y |
| E-mail do convite | Opcional. Se preenchido, só a conta com esse e-mail (sem diferenciar maiúsculas e espaços nas pontas) aceita | Valor aprovado pelo usuário | y |
| Abrir o link não consome | O aceite só ocorre no clique de confirmação; abrir o link (inclusive por prévia do WhatsApp) não gasta o convite | Aplicativos de mensagem abrem links para gerar prévia | y |
| Limites de entrada | Nome de 1 a 80 caracteres; e-mail com formato válido e até 254 caracteres; até 20 convites pendentes por mandato | Evita abuso e lixo sem atrapalhar o uso real | n |
| Tentativas de adivinhar token | Mais de 10 tokens inválidos em 10 minutos pela mesma origem bloqueiam novas tentativas por 15 minutos | Defesa em profundidade; com 128 bits o risco real é nulo, o limite barra varredura e ruído | n |
| Convite aceito por quem já é membro | Mantém o papel atual, mostra "Você já está neste mandato" e não consome o convite | Evita rebaixar sem querer quem já está no mandato | n |
| Histórico da equipe | Tabela própria `eventos_equipe`; não usa `eventos` | `painel-admin` mede atividade do mandato por linhas de `eventos`; eventos de convite inflariam a métrica | n |
| Retenção de convites vencidos | Convites vencidos ou cancelados há mais de 30 dias são apagados quando alguém do mandato cria um novo convite | Evita guardar nome e e-mail de quem nunca entrou, sem precisar de rotina agendada | n |
| Consentimento ao criar conta pelo convite | A página do convite mostra o mesmo aviso de consentimento do cadastro e grava em `consentimentos`, como o cadastro atual | A decisão registrada é que quem se cadastra consente o acesso da equipe Legisla | n |
| Expressão "código de convite" no aviso | Trocada por "link de convite"; nenhuma outra palavra do aviso muda | Mantém o aviso coerente com a mudança sem tocar no texto jurídico | n |
| Quem pode sair do mandato | Qualquer membro, em qualquer papel, desde que reste ao menos uma coordenação | A spec não restringe a saída por papel; sair é direito da própria pessoa | n |
| Cancelar convite que já não está pendente | Não faz nada e não grava evento | O estado final não volta e nenhuma mensagem nova é necessária | n |
| Cancelar convite de quem já saiu do mandato | Só quem ainda é membro cancela, mesmo sendo o criador do convite | Ex-membro não deve mexer em dados do mandato | n |
| Formato de e-mail válido | Um único `@`, sem espaço e com ponto no domínio (`x@y.z`); a mesma regra vale no banco e no navegador | Evita regra diferente nas duas pontas | n |
| Fuso das datas | `America/Sao_Paulo` | Público e equipe no Brasil | y |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Criar um convite por link pessoal ⭐ MVP

**User Story**: As a membro de um mandato, I want gerar um link de convite com nome e papel so that eu envie à pessoa por WhatsApp ou onde preferir, sem depender de e-mail.

**Why P1**: É o que substitui o código compartilhado; sem ele ninguém entra no mandato.

**Acceptance Criteria** (each line is one EARS pattern):

1. WHEN um membro informa nome e papel e confirma "Gerar link de convite" THEN the sistema SHALL criar o convite e mostrar o link completo, a validade e os botões "Copiar link", "Copiar mensagem pronta" e "Abrir no WhatsApp". <!-- event-driven -->
2. WHEN o convite é criado THEN the sistema SHALL gerar o token no servidor, com 128 bits de gerador criptográfico, e gravar só o hash SHA-256 do token, nunca o token. <!-- event-driven -->
3. The sistema SHALL mostrar o link completo uma única vez, no momento da criação, e nunca devolvê-lo em listagens posteriores. <!-- ubiquitous -->
4. WHEN o convite é criado THEN the sistema SHALL definir a validade em 7 dias a partir da criação. <!-- event-driven -->
5. WHERE o e-mail foi preenchido no convite the sistema SHALL guardá-lo normalizado (minúsculas, sem espaços nas pontas) para conferir no aceite. <!-- optional-feature -->
6. IF o papel escolhido é maior que o papel de quem convida (ordem `coordenacao` > `assessoria` > `leitura`) THEN the banco SHALL recusar com "Você só pode convidar com papel igual ou menor que o seu." e nenhum convite ser criado. <!-- unwanted-behavior -->
7. IF o nome está vazio ou tem mais de 80 caracteres THEN the sistema SHALL recusar com "Informe um nome de até 80 caracteres." e nenhum convite ser criado. <!-- unwanted-behavior -->
8. IF o e-mail informado tem formato inválido ou mais de 254 caracteres THEN the sistema SHALL recusar com "E-mail inválido." e nenhum convite ser criado. <!-- unwanted-behavior -->
9. IF o mandato já tem 20 convites pendentes THEN the sistema SHALL recusar com "Este mandato já tem 20 convites pendentes. Cancele algum para criar outro." e nenhum convite ser criado. <!-- unwanted-behavior -->
10. IF quem pede o convite não é membro do mandato THEN the banco SHALL recusar com erro de permissão. <!-- unwanted-behavior -->
11. WHEN o convite é criado THEN the sistema SHALL apagar, no mesmo mandato, os convites vencidos ou cancelados há mais de 30 dias. <!-- event-driven -->

**Independent Test**: Com um membro `assessoria` logado, gerar convite para "Carlos Lima" como `assessoria`, ver o link e a validade na tela e conferir no banco que só existe o hash; tentar gerar como `coordenacao` e ver a recusa.

---

### P1: Aceitar o convite e entrar no mandato ⭐ MVP

**User Story**: As a pessoa convidada, I want abrir o link, ver quem me convidou e entrar no mandato so that eu comece a trabalhar sem digitar código.

**Why P1**: É a outra metade do convite; sem ela o link não leva a lugar nenhum.

**Acceptance Criteria**:

1. WHEN uma pessoa abre o link de convite (`/convite#<token>`, com o token no fragmento) de um convite válido THEN the sistema SHALL mostrar o nome de quem convidou, o nome parlamentar, cargo, UF e papel do convite, sem consumir o convite. <!-- event-driven -->
2. WHILE a pessoa não tem sessão the página SHALL oferecer criar conta (nome, e-mail, senha), entrar com conta existente e entrar com Google. <!-- state-driven -->
3. WHEN a pessoa sem conta preenche nome, e-mail e senha e confirma "Criar conta e entrar no mandato" THEN the sistema SHALL criar a conta, consumir o convite e incluí-la no mandato com o papel do convite. <!-- event-driven -->
4. WHEN a pessoa com sessão confirma "Aceitar convite" THEN the sistema SHALL consumir o convite e incluí-la no mandato com o papel do convite. <!-- event-driven -->
5. WHEN a pessoa escolhe entrar com Google na página do convite THEN the sistema SHALL, após o retorno do Google, concluir o aceite do mesmo convite sem pedir o link de novo. <!-- event-driven -->
6. WHEN o aceite termina THEN the sistema SHALL abrir o Guia no mandato recém-aceito. <!-- event-driven -->
7. The sistema SHALL gravar a sessão em `legisla.tok`, no mesmo formato do Guia, de modo que Guia e `/admin` sigam sem novo login. <!-- ubiquitous -->
8. WHEN a conta é criada pela página do convite THEN the sistema SHALL mostrar o aviso de consentimento do cadastro e gravar o registro em `consentimentos` antes de concluir o aceite. <!-- event-driven -->
9. IF o convite foi preenchido com e-mail e a conta que aceita tem outro e-mail THEN the sistema SHALL recusar com "Este convite é para outro e-mail. Entre com a conta indicada ou peça um novo convite." e o convite continuar válido. <!-- unwanted-behavior -->
10. IF o token não existe THEN the página SHALL mostrar "Este convite não vale mais. Peça um novo para quem convidou você." sem revelar se o token existiu. <!-- unwanted-behavior -->
11. IF o convite está vencido, cancelado ou já usado THEN the página SHALL mostrar a mesma mensagem do token inexistente. <!-- unwanted-behavior -->
12. IF dois aceites do mesmo convite chegam ao mesmo tempo THEN the banco SHALL concluir exatamente um e recusar o outro com a mensagem do convite que não vale mais. <!-- unwanted-behavior -->
13. IF a pessoa que aceita já é membro do mandato THEN the sistema SHALL manter o papel atual, mostrar "Você já está neste mandato" e não consumir o convite. <!-- unwanted-behavior -->
14. IF a mesma origem enviar mais de 10 tokens inválidos em 10 minutos THEN the sistema SHALL recusar novas tentativas dessa origem por 15 minutos com "Muitas tentativas. Tente de novo em alguns minutos." <!-- unwanted-behavior -->
15. IF a criação da conta falhar (e-mail já usado ou senha fraca) THEN the página SHALL mostrar o motivo e o convite continuar válido e não consumido. <!-- unwanted-behavior -->

**Independent Test**: Gerar um convite, abrir o link em janela anônima, criar conta e ver o Guia aberto no mandato com o papel certo; abrir o mesmo link de novo e ver "Este convite não vale mais".

---

### P1: Papéis do mandato aplicados no banco ⭐ MVP

**User Story**: As a coordenação do mandato, I want papéis com permissão aplicada no banco so that a pessoa de só leitura não altere nada e ninguém suba o próprio acesso.

**Why P1**: Convite com papel só tem valor se o papel for obedecido; a tela sozinha não protege.

**Acceptance Criteria**:

1. The banco SHALL aceitar só `coordenacao`, `assessoria` e `leitura` em `membros.papel`. <!-- ubiquitous -->
2. WHILE o papel do membro é `leitura` the banco SHALL permitir consultar os dados do mandato e recusar qualquer escrita nos dados e nos membros desse mandato. <!-- state-driven -->
3. WHILE o papel do membro é `leitura` the Guia SHALL ocultar ou desabilitar os controles que gravam dados. <!-- state-driven -->
4. WHEN um membro `coordenacao` troca o papel de outro membro THEN the banco SHALL gravar o novo papel, valendo na chamada seguinte, porque o papel é lido da tabela a cada chamada. <!-- event-driven -->
5. WHEN um membro `coordenacao` remove outro membro e confirma THEN the banco SHALL tirá-lo do mandato sem apagar a conta dele na plataforma. <!-- event-driven -->
6. IF quem troca papel ou remove não é `coordenacao` do mandato THEN the banco SHALL recusar com erro de permissão e nada mudar. <!-- unwanted-behavior -->
7. IF a ação (remover, rebaixar ou a própria saída) deixaria o mandato sem nenhum `coordenacao` THEN the banco SHALL recusar com "O mandato precisa ter ao menos uma pessoa na coordenação." e nada mudar. <!-- unwanted-behavior -->
8. IF duas ações simultâneas rebaixariam as duas últimas coordenações THEN the banco SHALL concluir uma e recusar a outra pela regra do critério anterior. <!-- unwanted-behavior -->
9. WHEN uma pessoa sai do mandato por conta própria THEN the banco SHALL tirá-la dos membros, respeitando a regra de ao menos uma coordenação. <!-- event-driven -->
10. The banco SHALL impedir que a equipe Legisla seja afetada: as linhas de `equipe_legisla` e as permissões do `/admin` não mudam por nenhuma função desta feature. <!-- ubiquitous -->
11. WHILE o papel do membro é `leitura` the banco SHALL aceitar criar convite só com o papel `leitura` e cancelar só os convites que ela criou. <!-- state-driven -->

**Independent Test**: Com membro `leitura`, tentar gravar um exercício, um convite com papel Assessoria e uma troca de papel direto pela API e ver erro de permissão nas três; criar um convite com papel Somente leitura e ver que funciona; tentar remover a única coordenação e ver a recusa.

---

### P1: Tela Equipe e convites ⭐ MVP

**User Story**: As a membro do mandato, I want ver quem está na equipe, os convites pendentes e gerar novos so that eu gerencie o acesso em um só lugar.

**Why P1**: É a tela aprovada onde o convite e os papéis ficam visíveis e operáveis.

**Acceptance Criteria**:

1. WHEN o membro abre Equipe e convites THEN the tela SHALL mostrar, nesta ordem, o formulário "Convidar uma pessoa", "Convites pendentes" e "Pessoas neste mandato". <!-- event-driven -->
2. The lista "Convites pendentes" SHALL mostrar só convites não vencidos, não cancelados e não usados, com nome, papel, quem convidou e dias para expirar. <!-- ubiquitous -->
3. WHEN o membro clica em "Cancelar" num convite pendente THEN the sistema SHALL invalidar o convite e removê-lo da lista pendente. <!-- event-driven -->
4. WHEN quem pede o cancelamento é quem criou o convite ou um `coordenacao` THEN the banco SHALL aceitar o cancelamento. <!-- event-driven -->
5. IF quem pede o cancelamento não criou o convite e não é `coordenacao` THEN the banco SHALL recusar com erro de permissão. <!-- unwanted-behavior -->
6. The lista "Pessoas neste mandato" SHALL mostrar, por pessoa, nome, e-mail e papel, e marcar a própria pessoa com "você". <!-- ubiquitous -->
7. WHILE o papel de quem vê a tela é `coordenacao` the tela SHALL mostrar o seletor de papel e o botão "Remover" nas linhas das outras pessoas. <!-- state-driven -->
8. WHILE o papel de quem vê a tela é `assessoria` ou `leitura` the tela SHALL mostrar os papéis como texto, sem seletor e sem "Remover". <!-- state-driven -->
9. WHILE o papel de quem vê a tela é `leitura` the formulário de convite SHALL oferecer só o papel "Somente leitura"; para `assessoria` SHALL oferecer "Assessoria" e "Somente leitura". <!-- state-driven -->
10. WHEN o papel de uma pessoa é trocado ou ela é removida THEN the tela SHALL atualizar a lista sem recarregar a página. <!-- event-driven -->
11. IF a lista de convites pendentes está vazia THEN the tela SHALL mostrar "Nenhum convite pendente." <!-- unwanted-behavior -->
12. The tela SHALL mostrar a linha "A equipe da Legisla acompanha este mandato, conforme o cadastro." <!-- ubiquitous -->
13. The tela SHALL funcionar em largura de celular (400 px) sem rolagem horizontal da página. <!-- ubiquitous -->

**Independent Test**: Abrir a tela como `coordenacao`, gerar convite, vê-lo em pendentes, cancelá-lo; trocar o papel de uma pessoa; abrir como `leitura` e ver tudo sem controles de edição.

---

### P2: Área do mandato

**User Story**: As a membro do mandato, I want uma página inicial do mandato com andamento, missões, equipe e atividade so that eu veja onde o mandato está e convide gente sem procurar.

**Why P2**: É a porta de entrada aprovada, mas o convite e os papéis funcionam sem ela.

**Acceptance Criteria**:

1. WHEN um membro abre a Área do mandato THEN the página SHALL mostrar o cartão do mandato (foto, nome parlamentar, cargo, UF, partido e data de posse), o andamento "Dia X de 100", as 5 missões com status e o resumo da equipe. <!-- event-driven -->
2. The "Dia X de 100" SHALL ser contado da data de posse no fuso `America/Sao_Paulo`, de 1 a 100, mostrando "Posse em DD/MM/AAAA" antes da posse e "100 dias concluídos" depois do dia 100. <!-- ubiquitous -->
3. The status de cada missão SHALL ser "Concluída", "Em andamento" ou "A fazer", calculado dos mesmos dados que o Guia já usa para o andamento das missões. <!-- ubiquitous -->
4. The resumo da equipe SHALL mostrar até 3 avatares, o total de pessoas, o número de convites pendentes e o botão "Convidar pessoa" que abre Equipe e convites. <!-- ubiquitous -->
5. The bloco "Atividade recente" SHALL listar os 10 eventos mais recentes de `eventos_equipe`, com quem fez, o que fez e quando, do mais recente para o mais antigo. <!-- ubiquitous -->
6. WHEN o membro clica em "Editar dados" THEN the página SHALL abrir a edição dos dados do mandato já existente no Guia. <!-- event-driven -->
7. WHILE a pessoa pertence a 2 ou mais mandatos the página SHALL mostrar o seletor de mandato no topo e trocar toda a página ao escolher outro. <!-- state-driven -->
8. WHILE a pessoa pertence a 1 mandato the página SHALL não mostrar o seletor de mandato. <!-- state-driven -->
9. IF a pessoa logada não pertence a nenhum mandato THEN the página SHALL mostrar "Você ainda não está em nenhum mandato" com as opções "Cadastrar um mandato" e "Tenho um link de convite". <!-- unwanted-behavior -->
10. WHILE o papel da pessoa é `leitura` the página SHALL ocultar "Editar dados". <!-- state-driven -->

**Independent Test**: Entrar com um membro de um mandato e ver cartão, andamento, 5 missões, equipe e atividade; entrar com pessoa sem mandato e ver as duas opções.

---

### P2: Histórico da equipe

**User Story**: As a membro do mandato, I want ver quem convidou, entrou, mudou papel ou saiu so that eu entenda mudanças no acesso.

**Why P2**: Dá rastro às ações de acesso; a Área do mandato mostra esse histórico.

**Acceptance Criteria**:

1. WHEN um convite é criado, aceito ou cancelado THEN the banco SHALL gravar uma linha em `eventos_equipe` com data e hora, quem fez, tipo, pessoa-alvo e papel, na mesma transação da ação. <!-- event-driven -->
2. WHEN o papel de uma pessoa é trocado, ou uma pessoa é removida ou sai THEN the banco SHALL gravar uma linha em `eventos_equipe` na mesma transação. <!-- event-driven -->
3. IF a gravação em `eventos_equipe` falhar THEN the banco SHALL desfazer a ação e nada mudar. <!-- unwanted-behavior -->
4. The `eventos_equipe` SHALL aceitar só inclusão: nenhum papel edita ou apaga linhas pela API. <!-- ubiquitous -->
5. The tabela `eventos` SHALL permanecer sem linhas de convite, papel ou remoção. <!-- ubiquitous -->
6. WHILE a pessoa não é membro do mandato the banco SHALL recusar a leitura de `eventos_equipe` desse mandato. <!-- state-driven -->

**Independent Test**: Gerar, aceitar e cancelar convites, trocar um papel e remover uma pessoa; ver as linhas certas em `eventos_equipe` e nenhuma nova em `eventos`.

---

### P2: Retirar o código de convite antigo

**User Story**: As a equipe Legisla, I want aposentar o código compartilhado so that o único caminho de entrada seja o link pessoal.

**Why P2**: Evita dois caminhos de entrada e fecha a brecha do código que nunca expira.

**Acceptance Criteria**:

1. The banco SHALL revogar a permissão de execução de `entrar_com_codigo` para `anon` e `authenticated`. <!-- ubiquitous -->
2. The Guia SHALL não exibir o campo, o botão nem a mensagem de código de convite em nenhuma tela. <!-- ubiquitous -->
3. WHEN a pessoa cadastra um mandato novo THEN the sistema SHALL criá-la como `coordenacao` desse mandato, como já ocorre. <!-- event-driven -->
4. The aviso de consentimento SHALL trocar "código de convite" por "link de convite" e manter o restante do texto. <!-- ubiquitous -->
5. The `mandatos.codigo` SHALL permanecer como identificador interno e não aparecer em nenhuma tela de equipe. <!-- ubiquitous -->

**Independent Test**: Chamar `entrar_com_codigo` com um código válido e receber erro de permissão; percorrer o Guia e não achar menção ao código.

---

## Edge Cases

- IF o mesmo e-mail é convidado duas vezes para o mesmo mandato THEN the sistema SHALL criar o segundo convite normalmente; cada link vale por si e o primeiro aceite consome só o seu.
- IF o convite é aberto em outro aparelho ou navegador THEN the página SHALL funcionar igual, pois o estado do convite está no banco.
- IF a pessoa fecha a página no meio do login com Google THEN the convite SHALL continuar válido e não consumido até a confirmação.
- IF a sessão expira durante o aceite THEN the página SHALL pedir novo login e retomar o mesmo convite.
- WHEN o convite é aceito por conta com e-mail diferente do preenchido THEN the sistema SHALL recusar sem consumir, pelo critério P1 Aceitar, item 9.
- IF o último `coordenacao` tenta sair do mandato THEN the sistema SHALL recusar e orientar a promover outra pessoa antes.

---

## Dimensions Sweep

| Dimensão | Cobertura |
| -------- | --------- |
| Input validation & bounds | Criar convite 7, 8, 9; formato do token em Criar convite 2 |
| Failure / partial-failure states | Criar convite 10; Aceitar 15; Histórico 3 |
| Idempotency / retry / duplicate handling | Aceitar 12 e 13; Edge Cases (convite repetido) |
| Auth boundaries & rate limits | Papéis 2, 6; Aceitar 14; Criar convite 6 e 10 |
| Concurrency / ordering | Aceitar 12; Papéis 8 |
| Data lifecycle / expiry | Criar convite 4 e 11; Aceitar 11 |
| Observability | Histórico da equipe; Área do mandato 5 |
| External-dependency failure | Aceitar 5 (Google) e Edge Cases (sessão expirada); envio de e-mail N/A because o sistema não envia e-mail |
| State-transition integrity | Convite: pendente → usado, cancelado ou vencido, sem volta; Papéis 7 |

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| ACE-01 | P1: Criar um convite por link pessoal | Design | Pending |
| ACE-02 | P1: Aceitar o convite e entrar no mandato | Design | Pending |
| ACE-03 | P1: Papéis do mandato aplicados no banco | Design | Pending |
| ACE-04 | P1: Tela Equipe e convites | Design | Pending |
| ACE-05 | P2: Área do mandato | - | Pending |
| ACE-06 | P2: Histórico da equipe | - | Pending |
| ACE-07 | P2: Retirar o código de convite antigo | - | Pending |

**ID format:** `[CATEGORY]-[NUMBER]`; critérios são citados como `ACE-02.9` (história, número do critério).

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 7 total, 0 mapped to tasks, 7 unmapped ⚠️

---

## Success Criteria

How we know the feature is successful:

- [ ] Uma pessoa nova entra em um mandato pelo link, em menos de 2 minutos, sem digitar código.
- [ ] Nenhuma chamada direta à API por um membro `leitura` grava dados, convites ou papéis.
- [ ] Um link usado, vencido ou cancelado devolve sempre a mesma mensagem e nunca revela o mandato.
- [ ] Nenhum token aparece em texto puro no banco, nos logs ou em listagens.
- [ ] Guia e `/admin` continuam funcionando com a mesma sessão após a entrega.
