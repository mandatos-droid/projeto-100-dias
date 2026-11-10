# Primeiro Acesso e Login só com Google Specification

## Problem Statement

Hoje a plataforma aceita login por e-mail com senha e por Google, e quem entra pela primeira vez cai direto no cadastro do mandato, sem a plataforma saber quem é a pessoa. Login por senha exige recuperação de senha e, com a confirmação de e-mail ligada, um serviço de e-mail que o projeto decidiu não usar. Esta feature deixa o Google como único login e coloca, antes de qualquer outra coisa, um cadastro de perfil obrigatório no primeiro acesso, seguido da pergunta se a equipe do mandato já tem conta.

## Goals

- [ ] Nenhuma tela do convite, do Guia e do `/admin` pede ou cria senha; o único login é "Entrar com Google".
- [ ] Toda pessoa fora da equipe Legisla que entra pela primeira vez preenche 7 campos de perfil antes de usar o Guia, a Área do mandato ou aceitar um convite.
- [ ] Só a equipe Legisla lê o perfil, aplicado no banco; ninguém de mandato lê o perfil de ninguém.
- [ ] A tela Analytics do `/admin` mostra, em números agregados, quem usa a plataforma por gênero, raça, faixa etária e atuação política, sem expor dado individual.
- [ ] Depois do perfil, a pessoa que não veio por convite escolhe entre "minha equipe já criou" (vai às instruções do link) e "ainda não" (escolhe o parlamentar e cria o mandato).
- [ ] Nenhuma funcionalidade do produto passa a depender de e-mail enviado pelo sistema.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| ------- | ------ |
| Recuperar senha e confirmação de e-mail | Sem senha, não há o que recuperar; o Google confirma o e-mail |
| Servidor de e-mail próprio (SMTP) | Nenhuma funcionalidade usa e-mail depois desta feature |
| Editar o perfil depois do cadastro | Não pedido; correção segue pelo e-mail contato@legislabrasil.org, como no aviso de privacidade |
| Lista de perfis individuais, busca por pessoa e exportação (CSV) no `/admin` | O Analytics mostra só números agregados; ninguém vê nome, telefone ou data de nascimento de uma pessoa nessa tela. Não pedido |
| Filtros (UF, período) e cruzamentos (gênero por raça) no Analytics de perfil | Primeira versão mostra a distribuição geral; filtros entram quando houver volume que os justifique |
| Outros provedores de login (Microsoft, Apple) | Decisão do usuário: só Google |
| Migrar contas antigas com senha | Todas as contas existentes são do Google (informação do usuário) |
| Mudar o cadastro do mandato (escolha do parlamentar) | Reaproveita o que já existe; só muda quando e como ele aparece |
| Reescrever o texto jurídico do aviso de privacidade | Esta feature acrescenta um consentimento específico para os dados de perfil; a revisão jurídica do texto fica com a Legisla |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Método de login | Só Google, nas três entradas (convite, Guia, `/admin`) | Decisão do usuário em 2026-11-09 | y |
| Campos do perfil | Nome completo, data de nascimento, gênero, raça, telefone, atua na política e, se atua, há quanto tempo | Decisão do usuário; sem UF (decidido em 2026-11-09) | y |
| Obrigatoriedade | Todos os campos são obrigatórios; "Prefiro não informar" em gênero e raça conta como resposta | Decisão do usuário | y |
| Quem vê o perfil | Só quem está em `equipe_legisla`, em qualquer papel; membros de mandato não leem nem o próprio perfil de outra pessoa | Decisão do usuário: "somente a equipe Legisla vê" | y |
| Quem fica dispensado | Quem está em `equipe_legisla` não preenche perfil | Decisão do usuário: os 3 usuários da Legisla ficam dispensados; todas as contas atuais são deles | y |
| Telefone | Cada pessoa cadastra o próprio; é um dado do perfil, separado do telefone do responsável pelo preenchimento do mandato | Decisão do usuário | y |
| Faixas de tempo na política | `Não atuo na política`, `Menos de 1 ano`, `1 a 2 anos`, `3 a 5 anos`, `6 a 10 anos`, `Mais de 10 anos` | Decisão do usuário (sugestão aceita, com a opção "Não atuo") | y |
| Leitura das faixas em anos completos | `1 a 2 anos` vale de 1 ano completo até menos de 3; `3 a 5` de 3 a menos de 6; `6 a 10` de 6 a menos de 11; `Mais de 10` a partir de 11 | Fecha a lacuna de 2 a 3 anos que a lista original tinha; só a pessoa escolhe a faixa, o sistema não calcula | n |
| Opções de raça | Branca, Preta, Parda, Amarela, Indígena, Prefiro não informar (categorias de cor ou raça do IBGE) | Decisão do usuário: lista padrão do IBGE | y |
| Opções de gênero | Mulher cisgênero, Homem cisgênero, Mulher transgênero, Homem transgênero, Travesti, Pessoa não binária, Outra identidade, Prefiro não informar | Decisão do usuário em 2026-11-09: lista maior que feminino e masculino. O IBGE só pergunta sexo, então a lista é de identidade de gênero, escolhida por mim; o usuário ajusta os rótulos | n |
| Nome completo | De 2 a 120 caracteres, com pelo menos duas palavras; o nome da conta Google vem preenchido e pode ser editado | "Completo" pede sobrenome | n |
| Data de nascimento | Data real, não futura, a partir de 1900-01-01 | Evita datas impossíveis sem inventar idade mínima | n |
| Telefone | Brasileiro, com DDD de 2 dígitos (11 a 99) e 8 ou 9 dígitos do número, guardado só com dígitos; a tela aceita parênteses, espaço e hífen | Padrão nacional; evita lixo | n |
| Consentimento do perfil | Caixa obrigatória e separada do aviso do cadastro, com texto específico para gênero, raça e data de nascimento (dados pessoais sensíveis, LGPD art. 11) e a mesma versão gravada em `consentimentos`; o texto final é revisado pela Legisla | Raça e gênero exigem consentimento específico e destacado | n |
| Finalidade informada no consentimento | "Conhecer o perfil de quem usa a plataforma e orientar o programa; só a equipe da Legisla Brasil vê esses dados" | O usuário não definiu a finalidade; esta é a mais próxima do que ele disse | n |
| Pessoa que chega por convite | Preenche o perfil (se não é da Legisla) e em seguida aceita o convite; a pergunta "sua equipe já criou?" não aparece | A pessoa já provou que a equipe criou, pelo link | n |
| Pessoa que já tem mandato mas não tem perfil | Preenche o perfil uma vez, na próxima entrada, e segue para onde estava | Garante que todos tenham perfil, sem tela nova de mandato | n |
| Página de instruções para quem a equipe já criou | Explica em 3 passos como a equipe gera e envia o link (Área do mandato, Equipe e convites, Gerar link de convite) e tem um campo para colar o link recebido | Reaproveita `/convite` e o convite por link | n |
| Quando perfil entra no primeiro acesso | Antes da pergunta sobre a equipe; a pergunta só aparece com perfil gravado | Ordem pedida pelo usuário | y |
| Sessão compartilhada | Continua em `legisla.tok`, no mesmo formato | `painel-admin` e o Guia dependem dele | n |
| Fuso das datas | `America/Sao_Paulo` | Público e equipe no Brasil | y |
| Analytics do perfil | Nova seção "Perfil de quem usa a plataforma" na tela Analytics do `/admin`, só com números agregados; lê por função do banco que exige `equipe_legisla` | Decisão do usuário em 2026-11-09 | y |
| Quais números | Total de pessoas com perfil, cadastros por mês, e a distribuição de gênero, raça, faixa etária e atuação política | Cobre os campos pedidos; telefone e nome não são agregáveis e ficam fora | n |
| Faixas etárias | Até 24, 25 a 34, 35 a 44, 45 a 54, 55 a 64, 65 ou mais, calculadas a partir da data de nascimento na data da consulta | Faixas usuais de pesquisa de perfil no Brasil | n |
| Quem entra na conta | Só pessoas com linha em `perfis`; a equipe Legisla (dispensada) não aparece nos números | Os dispensados não têm perfil | y |
| Quem vê a seção | `admin` e `leitura` da equipe Legisla, como o restante do Analytics | `painel-admin` já define que os dois papéis veem todas as telas | n |
| Grupos pequenos | Os números aparecem exatos, sem ocultar grupos com poucas pessoas | Só a equipe Legisla vê, e ela já lê a tabela inteira pelo banco; esconder grupos atrapalharia o uso com poucos cadastros | n |
| Categorias sem ninguém no Analytics | Toda categoria da lista da spec aparece, na ordem da spec, mesmo com 0 pessoas (inclusive "Prefiro não informar"); o gráfico fica estável entre consultas | Decisão do orquestrador na rodada 1 do Verifier (SP-1); o usuário pode preferir ocultar zeros | n |
| Porcentagem no Analytics | Cada porcentagem é arredondada para inteiro por categoria; a soma pode ser 99 ou 101 e isso é aceito. A soma das quantidades é sempre igual ao total | Decisão do orquestrador na rodada 1 do Verifier (SP-2); o número exato está ao lado da porcentagem | n |
| Falha ao consultar o perfil no Guia | Mostra uma caixa de erro "Não foi possível carregar seus dados. Tente de novo." com botão "Tentar de novo"; nunca manda ao formulário de perfil por causa da falha | Decisão do orquestrador na rodada 1 do Verifier (SP-3): sem isso o Guia fica em branco | n |
| Ordem das checagens no aceite do convite | Perfil antes de consentimento: quem não tem perfil recebe `erro:'perfil'` e preenche o perfil (que já grava o consentimento) sem ver a tela de consentimento do convite | Verifier rodada 1 (GAP-1): a ordem inversa mostrava o consentimento duas vezes | y |
| Tratamento de "Prefiro não informar" | Aparece como uma categoria própria, nunca somado a outra | Dado honesto sobre quem não quis responder | n |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Entrar só com Google ⭐ MVP

**User Story**: As a pessoa que usa a plataforma, I want entrar só com a minha conta Google so that eu não crie nem lembre senha, e o sistema não precise mandar e-mail.

**Why P1**: É a decisão que elimina a dependência de e-mail e a recuperação de senha.

**Acceptance Criteria** (each line is one EARS pattern):

1. The sistema SHALL oferecer "Entrar com Google" como único método de login na página do convite, no Guia e no `/admin`. <!-- ubiquitous -->
2. The sistema SHALL não mostrar campo de senha nem opção "Criar conta" ou "Entrar com e-mail" em nenhuma dessas três entradas. <!-- ubiquitous -->
3. WHEN uma pessoa volta do Google com sessão válida THEN the sistema SHALL guardar a sessão em `legisla.tok` e seguir o fluxo da entrada onde ela estava. <!-- event-driven -->
4. IF o Google devolve erro ou a pessoa cancela THEN the sistema SHALL mostrar "Não foi possível entrar com o Google. Tente de novo." e manter o botão disponível. <!-- unwanted-behavior -->
5. WHEN a pessoa entra com o Google pela primeira vez em um convite THEN the sistema SHALL guardar o link do convite no navegador e concluí-lo na volta, sem pedir o link de novo. <!-- event-driven -->
6. The sistema SHALL não enviar e-mail em nenhuma funcionalidade do produto. <!-- ubiquitous -->

**Independent Test**: Abrir `/convite#<token>`, `/guia` e `/admin` sem sessão e conferir que só existe o botão "Entrar com Google"; entrar e voltar ao ponto de partida.

---

### P1: Cadastro de perfil no primeiro acesso ⭐ MVP

**User Story**: As a pessoa que entra pela primeira vez, I want preencher meu perfil uma vez so that a Legisla conheça quem usa a plataforma.

**Why P1**: É o pedido central; sem perfil gravado, o fluxo seguinte não começa.

**Acceptance Criteria**:

1. WHEN uma pessoa fora de `equipe_legisla` entra e não tem perfil gravado THEN the sistema SHALL mostrar o formulário de perfil antes de qualquer outra tela do Guia, da Área do mandato ou do aceite de convite. <!-- event-driven -->
2. WHILE a pessoa não tem perfil gravado the sistema SHALL impedir o acesso ao Guia, à Área do mandato e ao aceite de convite. <!-- state-driven -->
3. The formulário SHALL pedir: nome completo, data de nascimento, gênero, raça, telefone e "Atua na política?" (Sim ou Não). <!-- ubiquitous -->
4. WHERE a pessoa responde "Sim" em "Atua na política?" the formulário SHALL pedir o tempo entre `Menos de 1 ano`, `1 a 2 anos`, `3 a 5 anos`, `6 a 10 anos` e `Mais de 10 anos`. <!-- optional-feature -->
5. WHERE a pessoa responde "Não" em "Atua na política?" the sistema SHALL gravar a atuação como `Não atuo na política` e não pedir o tempo. <!-- optional-feature -->
6. The formulário SHALL oferecer em gênero as opções `Mulher cisgênero`, `Homem cisgênero`, `Mulher transgênero`, `Homem transgênero`, `Travesti`, `Pessoa não binária`, `Outra identidade` e `Prefiro não informar`, e em raça `Branca`, `Preta`, `Parda`, `Amarela`, `Indígena` e `Prefiro não informar`. <!-- ubiquitous -->
7. WHEN o formulário abre THEN the sistema SHALL preencher o nome com o nome da conta Google, editável. <!-- event-driven -->
8. IF algum campo está vazio ou a caixa de consentimento está desmarcada THEN the sistema SHALL recusar o envio, destacar o campo e mostrar "Preencha todos os campos e aceite o tratamento dos dados para continuar." <!-- unwanted-behavior -->
9. IF o nome tem menos de duas palavras ou fora de 2 a 120 caracteres THEN the sistema SHALL recusar com "Informe seu nome completo." <!-- unwanted-behavior -->
10. IF a data de nascimento não é uma data real, é futura ou anterior a 1900-01-01 THEN the sistema SHALL recusar com "Informe uma data de nascimento válida." <!-- unwanted-behavior -->
11. IF o telefone não tem DDD de 2 dígitos (11 a 99) mais 8 ou 9 dígitos THEN the sistema SHALL recusar com "Informe um telefone com DDD." <!-- unwanted-behavior -->
12. WHEN a pessoa envia o formulário válido THEN the sistema SHALL gravar o perfil, gravar o consentimento com a versão do perfil e seguir para o passo seguinte do fluxo. <!-- event-driven -->
13. IF a gravação falha THEN the sistema SHALL manter os dados digitados e mostrar "Não foi possível salvar. Tente de novo." <!-- unwanted-behavior -->
14. WHEN a pessoa envia o formulário duas vezes seguidas THEN the sistema SHALL manter um único perfil por pessoa. <!-- event-driven -->
15. WHERE a pessoa já tem perfil gravado the sistema SHALL não mostrar o formulário de novo. <!-- optional-feature -->
16. WHERE a pessoa está em `equipe_legisla` the sistema SHALL não mostrar o formulário nem bloquear nenhuma tela. <!-- optional-feature -->

**Independent Test**: Entrar com uma conta Google sem perfil, tentar abrir `/guia` e ver o formulário; enviar vazio e ver a recusa; enviar completo e ver o perfil no banco; entrar de novo e não ver o formulário.

---

### P1: Perfil protegido no banco ⭐ MVP

**User Story**: As a pessoa cadastrada, I want que só a equipe Legisla veja meu perfil so that meus dados sensíveis não circulem entre os mandatos.

**Why P1**: Raça, gênero e nascimento são dados sensíveis; a regra precisa estar no banco, não só na tela.

**Acceptance Criteria**:

1. The banco SHALL guardar o perfil em tabela própria, com uma linha por pessoa (`user_id` único). <!-- ubiquitous -->
2. WHEN uma pessoa autenticada grava o perfil THEN the banco SHALL aceitar só linha com o `user_id` dela. <!-- event-driven -->
3. IF uma pessoa tenta gravar o perfil de outra THEN the banco SHALL recusar com erro de permissão. <!-- unwanted-behavior -->
4. WHERE a pessoa está em `equipe_legisla` (qualquer papel) the banco SHALL permitir ler todos os perfis. <!-- optional-feature -->
5. IF uma pessoa fora de `equipe_legisla` tenta ler o perfil de outra, inclusive de um membro do mesmo mandato, THEN the banco SHALL devolver zero linhas. <!-- unwanted-behavior -->
6. The banco SHALL permitir que uma pessoa leia só o próprio perfil, para o app saber se o cadastro está feito. <!-- ubiquitous -->
7. IF os valores de gênero, raça, atuação ou tempo fogem da lista da spec, ou o telefone, a data ou o nome fogem das regras de formato, THEN the banco SHALL recusar a gravação. <!-- unwanted-behavior -->
8. IF a pessoa responde que não atua mas manda um tempo de atuação, ou responde que atua sem tempo, THEN the banco SHALL recusar a gravação. <!-- unwanted-behavior -->
9. WHEN uma conta é excluída THEN the banco SHALL apagar o perfil dela. <!-- event-driven -->
10. WHEN a pessoa usa "excluir meus dados" THEN the sistema SHALL apagar o perfil dela. <!-- event-driven -->

**Independent Test**: Com duas contas de mandatos diferentes e uma da equipe Legisla, consultar `perfis` com cada uma: a de mandato vê só a própria, a da Legisla vê as duas.

---

### P1: Pergunta sobre a equipe e escolha do mandato ⭐ MVP

**User Story**: As a pessoa recém-cadastrada, I want dizer se minha equipe já criou conta so that eu entre pelo caminho certo, sem criar um mandato duplicado.

**Why P1**: Evita mandatos duplicados e dá a quem já tem equipe o caminho do link.

**Acceptance Criteria**:

1. WHEN o perfil é gravado e a pessoa não veio por convite e não tem mandato THEN the sistema SHALL perguntar "A equipe do seu mandato já criou uma conta?" com as respostas "Sim, já criou" e "Ainda não". <!-- event-driven -->
2. WHEN a pessoa responde "Sim, já criou" THEN the sistema SHALL abrir a página de instruções do link de convite. <!-- event-driven -->
3. The página de instruções SHALL explicar em 3 passos como a equipe gera e envia o link e SHALL ter um campo para colar o link recebido. <!-- ubiquitous -->
4. WHEN a pessoa cola um link de convite válido nessa página THEN the sistema SHALL abrir a página do convite com o token. <!-- event-driven -->
5. IF o texto colado não é um link de convite THEN the sistema SHALL mostrar "Este não parece um link de convite. Peça a quem convidou para enviar de novo." <!-- unwanted-behavior -->
6. WHEN a pessoa responde "Ainda não" THEN the sistema SHALL abrir o cadastro de mandato com a escolha do parlamentar, como já existe hoje. <!-- event-driven -->
7. WHEN a pessoa conclui o cadastro de mandato THEN the sistema SHALL torná-la `coordenacao` do mandato criado e levá-la ao Guia. <!-- event-driven -->
8. WHERE a pessoa chegou por um link de convite the sistema SHALL não mostrar a pergunta e SHALL concluir o aceite depois do perfil. <!-- optional-feature -->
9. WHERE a pessoa já pertence a algum mandato the sistema SHALL não mostrar a pergunta. <!-- optional-feature -->
10. WHILE a pessoa está na página de instruções the sistema SHALL oferecer voltar à pergunta para trocar a resposta. <!-- state-driven -->

**Independent Test**: Entrar com conta nova sem convite, preencher o perfil e ver a pergunta; responder "Sim" e ver as instruções com o campo de colar; responder "Ainda não" e ver a escolha do parlamentar.

---

### P2: Remoção do login por senha no código

**User Story**: As a pessoa que mantém o sistema, I want que o código de senha e de confirmação de e-mail saia so that ninguém reative por engano um caminho que depende de e-mail.

**Why P2**: A feature funciona sem esta limpeza, mas deixar o código aumenta a superfície e a confusão.

**Acceptance Criteria**:

1. The sistema SHALL não ter caminho que chame o cadastro com senha (`/auth/v1/signup`) nem o login por senha (`grant_type=password`) em nenhuma entrada; o código extraído do Guia (`nucleo.js`, regenerado por script e não editado à mão, AD-003) fica sem caminho que o alcance por override em `acesso.js`. <!-- ubiquitous -->
2. The sistema SHALL não exibir a mensagem "Confirme o e-mail enviado e faça login" em nenhuma tela, e o código do app (`app/`, `lib/`) SHALL não tratar `email_not_confirmed`. <!-- ubiquitous -->
3. WHEN a sessão do Google vence THEN the sistema SHALL renovar pelo `refresh_token` como hoje, sem pedir senha. <!-- event-driven -->

**Independent Test**: Buscar em `app/`, `lib/` e `public/legacy/acesso.js` por `signup` e `grant_type=password` e não achar uso; no Guia, chamar `Store.criarConta` e `Store.entrar` e ver recusa sem chamada de rede.

---

### P2: Analytics do perfil no painel do admin

**User Story**: As a pessoa da equipe Legisla, I want ver números agregados do perfil de quem usa a plataforma so that eu entenda quem são as pessoas dos mandatos sem abrir dados individuais.

**Why P2**: É o motivo de coletar o perfil; não bloqueia o cadastro, que já entrega valor sozinho.

**Acceptance Criteria**:

1. WHEN uma pessoa com papel `admin` ou `leitura` abre Analytics THEN the painel SHALL mostrar a seção "Perfil de quem usa a plataforma". <!-- event-driven -->
2. The seção SHALL mostrar o total de pessoas com perfil e o gráfico de cadastros de perfil por mês, no máximo 12 meses. <!-- ubiquitous -->
3. The seção SHALL mostrar a distribuição em número e porcentagem inteira de toda categoria da lista da spec, mesmo com 0 pessoas, de gênero, de raça, de faixa etária e de atuação política (com `Não atuo na política` e as 5 faixas de tempo). <!-- ubiquitous -->
4. The seção SHALL mostrar `Prefiro não informar` como categoria própria em gênero e em raça. <!-- ubiquitous -->
5. The faixa etária SHALL ser calculada da data de nascimento na data da consulta, nas faixas `Até 24`, `25 a 34`, `35 a 44`, `45 a 54`, `55 a 64` e `65 ou mais`. <!-- ubiquitous -->
6. The seção SHALL não mostrar nome, e-mail, telefone nem data de nascimento de nenhuma pessoa. <!-- ubiquitous -->
7. The banco SHALL entregar esses números por função que devolve só contagens, sem linha individual. <!-- ubiquitous -->
8. IF quem chama a função não está em `equipe_legisla` THEN the banco SHALL recusar com erro de permissão. <!-- unwanted-behavior -->
9. IF não há nenhuma pessoa com perfil THEN the seção SHALL mostrar "Ainda não há perfis cadastrados." e nenhum gráfico vazio. <!-- unwanted-behavior -->
10. WHEN os dados falham ao carregar THEN the seção SHALL mostrar "Não foi possível carregar o perfil. Tente de novo." sem afetar o restante do Analytics. <!-- event-driven -->
11. The sistema SHALL dar a cada gráfico um título que diz o que mede e a categoria com texto, sem depender só de cor, para leitura em tela pequena e por leitor de tela. <!-- ubiquitous -->
12. The soma das categorias de cada distribuição SHALL ser igual ao total de pessoas com perfil. <!-- ubiquitous -->

**Independent Test**: Com 3 perfis de teste (gêneros, raças e idades diferentes), abrir Analytics e conferir que cada distribuição bate com uma contagem manual no banco e que nenhum dado individual aparece; chamar a função com uma conta de mandato e ver a recusa.

---

## Edge Cases

- IF a pessoa fecha a aba no meio do perfil THEN the sistema SHALL perder o que foi digitado e mostrar o formulário vazio na próxima entrada, sem criar perfil parcial.
- IF a pessoa abre um convite já aceito, vencido ou cancelado depois do perfil THEN the sistema SHALL mostrar a mesma mensagem de convite inválido do fluxo de convites.
- IF a pessoa tem perfil mas nenhum mandato e não veio por convite THEN the sistema SHALL mostrar a pergunta sobre a equipe, sem pedir o perfil de novo.
- IF o Google devolve uma conta sem nome THEN the sistema SHALL abrir o formulário com o nome vazio.
- WHEN a pessoa da equipe Legisla (dispensada) também entra por convite THEN the sistema SHALL aceitar o convite sem pedir perfil.

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| PAG-01 | P1: Entrar só com Google | Tasks (T7, T9, T11, T12, T13, T16) | Pending |
| PAG-02 | P1: Cadastro de perfil no primeiro acesso | Execute (T1 a T10, T16) | In progress (T1, T2, T4, T5, T6) |
| PAG-03 | P1: Perfil protegido no banco | Execute (T1, T2, T6, T16) | In progress (T1, T2, T6) |
| PAG-04 | P1: Pergunta sobre a equipe e escolha do mandato | Execute (T5, T8, T9, T10, T16) | In progress (T5) |
| PAG-05 | P2: Remoção do login por senha no código | Tasks (T11, T12, T13, T16) | Pending |
| PAG-06 | P2: Analytics do perfil no painel do admin | Execute (T3, T14, T15, T16) | In progress (T3) |

**ID format:** `[CATEGORY]-[NUMBER]`; cada critério de aceite é citado como `PAG-02.8` (história, ponto).

**Coverage:** 6 total, 6 mapped to tasks, 0 unmapped

---

## Success Criteria

How we know the feature is successful:

- [ ] Uma pessoa nova entra com Google, preenche o perfil e chega ao Guia (como coordenação de um mandato novo) ou à página do convite em menos de 3 minutos.
- [ ] Nenhuma tela do produto pede senha e nenhuma funcionalidade depende de e-mail.
- [ ] Consultas ao perfil feitas por conta de mandato devolvem zero linhas de outras pessoas, nos testes do banco.
- [ ] Os 3 usuários da Legisla entram sem ver o formulário.
- [ ] Os números da seção de perfil no Analytics batem com uma contagem manual no banco para os perfis de teste.
