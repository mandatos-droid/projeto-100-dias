# Aba Usuários no Painel Admin Specification

## Problem Statement

O painel `/admin` mostra a equipe Legisla, os mandatos e os números agregados, mas não mostra as pessoas que usam a plataforma. Com o login só por Google e o perfil obrigatório no primeiro acesso (feature `primeiro-acesso-google`), a Legisla passa a ter dados de cada pessoa e não tem onde consultá-los: quem entrou, em qual mandato, com qual papel, quando acessou pela última vez e qual é o perfil. Esta feature acrescenta a aba Usuários, só de leitura.

## Goals

- [ ] A equipe Legisla (admin e leitura) abre a aba Usuários e vê todas as pessoas com conta, com mandato, papel, data de cadastro e último acesso.
- [ ] Em até 2 interações a equipe encontra uma pessoa por nome ou e-mail e abre o detalhe com perfil, consentimento e mandatos.
- [ ] Só a equipe Legisla lê esses dados, aplicado no banco; ninguém de mandato lê a lista nem o detalhe.
- [ ] A aba não altera nada: nenhum botão de editar, remover ou exportar.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| ------- | ------ |
| Exportar a lista ou o detalhe (CSV, planilha) | Não pedido; dados sensíveis |
| Editar perfil, trocar papel, remover pessoa ou excluir conta pela aba | Mexer em membros continua nas telas de mandato que já existem; a aba é só leitura |
| Registrar no histórico quem abriu o detalhe de uma pessoa | Não pedido; fica como pendência de LGPD (ver Assumptions) |
| Enviar mensagem ou e-mail às pessoas | Nenhuma funcionalidade usa e-mail |
| Atividade por pessoa (o que a pessoa fez no Guia) | O sistema não guarda o autor do uso das funcionalidades |
| Cruzamentos e gráficos de perfil | Já existem em Analytics |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Quem vê a aba | `admin` e `leitura` da equipe Legisla, como o resto do painel | `painel-admin` define que os dois papéis veem todas as telas | y |
| Colunas da lista | Nome, e-mail, mandatos com o papel em cada um, data de cadastro, último acesso e a marca "sem perfil" ou o papel na equipe Legisla | Pedido do usuário em 2026-11-10 (lista com último acesso) | y |
| Quem aparece | Toda conta de `auth.users`, inclusive quem é da equipe Legisla e quem ainda não preencheu o perfil | O objetivo é ver todas as pessoas com conta | n |
| Gênero, raça e nascimento | Aparecem só no detalhe, nunca na lista; o detalhe mostra o valor individual | Decisão do usuário em 2026-11-10: "quero ver no detalhe sim" | y |
| Último acesso | Mostra o último login (`last_sign_in_at` de `auth.users`), data e hora de Brasília; sem login registrado mostra "Nunca" | Decisão do usuário: quer ver o último acesso. A renovação silenciosa da sessão não conta como login, então uma pessoa que usa o Guia todo dia pode mostrar um acesso mais antigo | y |
| Só leitura | Nenhum botão altera dado; o detalhe tem links para o mandato na tela de Mandatos | Mexer em membros já tem tela própria | y |
| Histórico de quem leu | Não registra a abertura do detalhe | Não pedido; ver Out of Scope. Risco de LGPD registrado como pendência | n |
| Busca | Por nome (do perfil, ou do cadastro da conta quando não há perfil) ou e-mail, sem diferenciar maiúsculas e acentos | Padrão da tela Mandatos | n |
| Filtros | Papel (`coordenacao`, `assessoria`, `leitura`, `equipe Legisla`), mandato (um só) e "sem perfil" | Cobre as perguntas de gestão mais comuns | n |
| Ordem e paginação | Do acesso mais recente ao mais antigo, quem nunca entrou por último; 25 pessoas por página, com total | Evita lista longa; volume atual é de 12 contas | n |
| Pessoa em mais de um mandato | A lista mostra todos, cada um com o papel; o filtro por mandato acha a pessoa em qualquer um | Uma pessoa pode estar em vários mandatos | n |
| Nome mostrado | Nome do perfil; sem perfil, o nome do cadastro da conta; sem nada, o e-mail | A equipe Legisla não tem perfil | n |
| Consentimento no detalhe | Mostra a versão e a data do consentimento mais recente; sem consentimento mostra "Sem consentimento registrado" | Ajuda a conferir a LGPD | n |
| Fuso das datas | `America/Sao_Paulo` | Público e equipe no Brasil | y |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Ver a lista de usuários ⭐ MVP

**User Story**: As a pessoa da equipe Legisla, I want ver todas as pessoas com conta, com mandato, papel e último acesso so that eu saiba quem usa a plataforma e quem está parado.

**Why P1**: É a aba pedida; sem a lista não há o que filtrar nem detalhar.

**Acceptance Criteria** (each line is one EARS pattern):

1. The painel SHALL ter o item "Usuários" no menu, entre "Mandatos" e "Analytics", que abre `/admin/usuarios`. <!-- ubiquitous -->
2. WHEN uma pessoa com papel `admin` ou `leitura` abre a aba THEN the painel SHALL mostrar a lista com nome, e-mail, mandatos com o papel em cada um, data de cadastro e último acesso de cada pessoa. <!-- event-driven -->
3. The lista SHALL incluir toda conta de `auth.users`, inclusive quem é da equipe Legisla e quem não tem perfil. <!-- ubiquitous -->
4. WHERE a pessoa não tem perfil e não é da equipe Legisla the lista SHALL mostrar a marca "Sem perfil". <!-- optional-feature -->
5. WHERE a pessoa é da equipe Legisla the lista SHALL mostrar a marca com o papel dela na equipe (`admin` ou `leitura`). <!-- optional-feature -->
6. The lista SHALL mostrar o nome do perfil e, sem perfil, o nome do cadastro da conta e, sem nenhum, o e-mail. <!-- ubiquitous -->
7. The lista SHALL mostrar o último acesso em `dd/mm/aaaa hh:mm`, horário de Brasília, e "Nunca" quando a pessoa não tem login registrado. <!-- ubiquitous -->
8. The lista SHALL ordenar do acesso mais recente ao mais antigo, com quem nunca entrou por último, e desempatar pelo e-mail. <!-- ubiquitous -->
9. The lista SHALL mostrar 25 pessoas por página e o total de pessoas. <!-- ubiquitous -->
10. The lista SHALL não mostrar gênero, raça, data de nascimento nem telefone. <!-- ubiquitous -->
11. IF não há nenhuma conta THEN the painel SHALL mostrar "Nenhuma pessoa cadastrada." e nenhuma tabela vazia. <!-- unwanted-behavior -->
12. IF os dados falham ao carregar THEN the painel SHALL mostrar a mensagem de erro padrão do painel e o botão "Tentar de novo", sem afetar o restante do painel. <!-- unwanted-behavior -->

**Independent Test**: Com 3 contas de teste (uma da Legisla, uma em dois mandatos, uma sem perfil), abrir a aba e conferir colunas, marcas, ordem e total.

---

### P1: Ver o detalhe da pessoa ⭐ MVP

**User Story**: As a pessoa da equipe Legisla, I want abrir uma pessoa e ver o perfil completo, o consentimento e os mandatos so that eu atenda dúvidas e confira a LGPD sem pedir dados a ela.

**Why P1**: É onde ficam os dados sensíveis que o usuário pediu para ver.

**Acceptance Criteria**:

1. WHEN a pessoa da equipe clica em uma linha da lista THEN the painel SHALL abrir `/admin/usuarios/<id>` com o detalhe. <!-- event-driven -->
2. The detalhe SHALL mostrar nome, e-mail, data de cadastro, último acesso e o papel na equipe Legisla, quando houver. <!-- ubiquitous -->
3. WHERE a pessoa tem perfil the detalhe SHALL mostrar nome completo, data de nascimento (`dd/mm/aaaa`), gênero, raça, telefone, se atua na política e o tempo de atuação, com os rótulos da lista da feature `primeiro-acesso-google`. <!-- optional-feature -->
4. WHERE a pessoa não tem perfil the detalhe SHALL mostrar "Esta pessoa ainda não preencheu o perfil." no lugar dos campos de perfil. <!-- optional-feature -->
5. The detalhe SHALL mostrar a versão e a data do consentimento mais recente e, sem consentimento, "Sem consentimento registrado". <!-- ubiquitous -->
6. The detalhe SHALL listar os mandatos da pessoa com nome do parlamentar, cargo, UF e papel, cada um com um link para `/admin/mandatos/<id>`. <!-- ubiquitous -->
7. WHERE a pessoa não está em nenhum mandato the detalhe SHALL mostrar "Esta pessoa não está em nenhum mandato." <!-- optional-feature -->
8. The detalhe SHALL ter o link "← Voltar para Usuários" que mantém a busca, os filtros e a página da lista. <!-- ubiquitous -->
9. The detalhe SHALL não ter botão que altere dado nem exportação. <!-- ubiquitous -->
10. IF o id não existe THEN the painel SHALL mostrar "Pessoa não encontrada." e o link para voltar. <!-- unwanted-behavior -->
11. IF os dados falham ao carregar THEN the painel SHALL mostrar a mensagem de erro padrão do painel e o botão "Tentar de novo". <!-- unwanted-behavior -->

**Independent Test**: Abrir uma pessoa com perfil e outra sem, e conferir cada campo, o consentimento e os links dos mandatos; abrir um id inexistente e ver "Pessoa não encontrada."

---

### P1: Dados protegidos no banco ⭐ MVP

**User Story**: As a pessoa de um mandato, I want que ninguém fora da equipe Legisla leia a lista e o detalhe so that meus dados e os dos outros não circulem.

**Why P1**: Os dados incluem raça, gênero e nascimento; a regra precisa estar no banco, não só na tela.

**Acceptance Criteria**:

1. The banco SHALL entregar a lista e o detalhe por funções próprias, que leem `equipe_legisla` a cada chamada. <!-- ubiquitous -->
2. IF quem chama não está em `equipe_legisla` THEN the banco SHALL recusar com "Você não tem permissão para esta ação." e erro de permissão. <!-- unwanted-behavior -->
3. The banco SHALL não permitir que `anon` execute as funções. <!-- ubiquitous -->
4. The funções SHALL devolver só os campos listados na spec, nunca senha, hash, token, metadados brutos da conta nem dados de outras tabelas. <!-- ubiquitous -->
5. The funções SHALL não gravar nada no banco. <!-- ubiquitous -->
6. WHEN a lista é pedida com busca, filtros, limite e posição THEN the banco SHALL aplicar tudo no servidor e devolver o total das pessoas que atendem aos filtros. <!-- event-driven -->
7. IF o limite pedido passa de 100 ou é menor que 1 THEN the banco SHALL usar 25. <!-- unwanted-behavior -->

**Independent Test**: Chamar as funções com uma conta de mandato (recusa), com `anon` (recusa) e com `leitura` da Legisla (lista), e conferir que a resposta não tem campo fora da spec.

---

### P2: Buscar, filtrar e paginar

**User Story**: As a pessoa da equipe Legisla, I want buscar por nome ou e-mail e filtrar por papel, mandato e "sem perfil" so that eu ache uma pessoa sem rolar a lista.

**Why P2**: A lista funciona sem isso com poucas contas; com o crescimento vira necessidade.

**Acceptance Criteria**:

1. WHEN a pessoa digita na busca THEN the painel SHALL filtrar por nome ou e-mail, sem diferenciar maiúsculas e acentos, voltando à primeira página. <!-- event-driven -->
2. The painel SHALL oferecer o filtro de papel com as opções `Todos`, `Coordenação`, `Assessoria`, `Somente leitura` e `Equipe Legisla`. <!-- ubiquitous -->
3. The painel SHALL oferecer o filtro de mandato com os mandatos não arquivados, em ordem alfabética do nome do parlamentar. <!-- ubiquitous -->
4. The painel SHALL oferecer o filtro "Só quem ainda não preencheu o perfil". <!-- ubiquitous -->
5. WHEN mais de um filtro está ativo THEN the painel SHALL aplicar todos juntos. <!-- event-driven -->
6. WHEN a pessoa troca de página THEN the painel SHALL manter a busca e os filtros. <!-- event-driven -->
7. IF a busca e os filtros não acham ninguém THEN the painel SHALL mostrar "Nenhuma pessoa encontrada com esses filtros." <!-- unwanted-behavior -->
8. WHILE existem filtros ativos the painel SHALL mostrar o botão "Limpar filtros". <!-- state-driven -->

**Independent Test**: Buscar "ana", filtrar por "Assessoria" e por um mandato, e conferir que o total e as linhas batem com uma contagem manual.

---

## Edge Cases

- WHEN a pessoa está em um mandato arquivado THEN the lista SHALL mostrar o mandato com o rótulo "(arquivado)".
- IF a busca tem mais de 100 caracteres THEN the painel SHALL cortar a busca em 100 caracteres sem erro.
- WHEN dois usuários têm o mesmo nome THEN the lista SHALL distingui-los pelo e-mail na mesma linha.
- IF a conta não tem e-mail (provedor sem e-mail) THEN the lista SHALL mostrar "—" no lugar do e-mail.
- WHEN a pessoa está na equipe Legisla e em um mandato THEN the lista SHALL mostrar os dois.

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| USR-01 | P1: Ver a lista de usuários | Specify | Pending |
| USR-02 | P1: Ver o detalhe da pessoa | Specify | Pending |
| USR-03 | P1: Dados protegidos no banco | Specify | Pending |
| USR-04 | P2: Buscar, filtrar e paginar | Specify | Pending |

**ID format:** `[CATEGORY]-[NUMBER]`; cada critério de aceite é citado como `USR-02.3` (história, ponto).

**Coverage:** 4 total, 0 mapped to tasks, 4 unmapped ⚠️

---

## Success Criteria

How we know the feature is successful:

- [ ] Uma pessoa da equipe Legisla acha qualquer usuário por nome ou e-mail e abre o detalhe em menos de 30 segundos.
- [ ] Consultas feitas com conta de mandato ou anônima recusam, nos testes do banco.
- [ ] A lista e o detalhe batem com uma contagem manual no banco para as contas de teste.
- [ ] Nenhuma tela da aba tem botão que altere dado.
