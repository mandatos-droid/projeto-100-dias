# Área do Mandato Specification

## Problem Statement

A gestão do mandato está em três lugares: "Configurações" no Guia (dados, conta e exclusão), `/mandato` (cartão, andamento, equipe, atividade) e `/mandato/equipe` (convites e pessoas). As duas últimas são páginas separadas, sem o menu do Guia, e ficam ligadas por links que levam a pessoa de um sistema para o outro. O andamento e as missões aparecem em duas telas, o nome "Configurações" não diz o que há ali e o perfil coletado no primeiro acesso não aparece em lugar nenhum. Esta feature junta tudo em uma tela só, "Área do mandato", dentro do Guia, com abas.

## Goals

- [ ] Toda a gestão do mandato (visão geral, dados, equipe e convites, conta) acontece em uma única tela do Guia, sem sair do menu lateral.
- [ ] O item "Configurações" do menu passa a se chamar "Área do mandato".
- [ ] Os endereços antigos `/mandato` e `/mandato/equipe` continuam funcionando e levam à aba equivalente.
- [ ] Nenhuma função existente se perde: convidar, cancelar, trocar papel, remover, sair do mandato, editar dados e excluir cadastro seguem com as mesmas regras e permissões.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| ------- | ------ |
| Editar o perfil pessoal (nome, telefone, gênero etc.) | A aba Minha conta só mostra; a correção segue por contato@legislabrasil.org, como no aviso de privacidade |
| Mudar regras de papéis, convites ou perfil | Esta feature só reorganiza telas |
| Mudar o Painel do mandato (home do Guia), o Resumo do preenchimento e o `/admin` | Fora da área pedida |
| Reescrever o formulário "Dados do mandato" | Reaproveita o formulário legado como está |
| Contador de convites pendentes na aba | Exigiria carregar dados antes de abrir a aba; a aba mostra só o total de pessoas |
| Seletor de mandato na Área do mandato | O Guia já escolhe o mandato ativo (`legisla.mandatoAtual`) |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Nome e lugar | "Área do mandato" no menu lateral, grupo Mandato, no lugar de "Configurações"; a rota `#/config` continua | Decisão do usuário em 2026-11-10 | y |
| Abas | Visão geral, Dados do mandato, Equipe e convites, Minha conta | Proposta aprovada pelo usuário | y |
| Visão geral sem missões | Mostra cartão do mandato, papel, resumo da equipe e atividade recente; não repete andamento nem missões, que ficam no Painel do mandato | Proposta aprovada pelo usuário | y |
| Aba inicial | `#/config` abre a Visão geral | A Visão geral orienta; o link de data de posse leva à aba Dados | n |
| Endereço de cada aba | `#/config` (Visão geral), `#/config/dados`, `#/config/equipe`, `#/config/conta` | O Guia roteia por hash; permite voltar, favoritar e compartilhar | n |
| Aviso de data de posse | Sem data de posse, a Visão geral mostra um aviso com link para a aba Dados | O link antigo "Informe a data de posse em Configurações" do Guia passa a cair na Visão geral | n |
| Número na aba Equipe | Mostra o total de pessoas do mandato, ex.: "Equipe e convites (2)" | Já está carregado no Guia; sem convites pendentes (fora de escopo) | n |
| Excluir cadastro | Fica no fim da aba Dados, em bloco separado "Zona de risco", só para `coordenacao`, com a mesma confirmação de hoje | Separa a ação destrutiva do formulário | n |
| Quem só lê (`leitura`) | Vê as quatro abas; Dados em modo somente leitura (já existente) e Equipe sem botões de alterar (já existente) | As regras de papel não mudam | y |
| Minha conta | Mostra e-mail da conta, nome, telefone, data de nascimento, gênero, raça, UF e atuação do perfil da própria pessoa, só leitura; quem não tem perfil (equipe Legisla) vê só o e-mail | O perfil vem de `perfis`, que a própria pessoa lê | n |
| Endereços antigos | `/mandato` e `/mandato/equipe` redirecionam (redirect permanente do Next) para `/guia#/config` e `/guia#/config/equipe`; fragmentos e `?volta=mandato` do primeiro acesso passam a apontar para `/guia#/config` | Convites e favoritos não quebram | n |
| Código antigo | As páginas de `/mandato` e a casca antiga saem do código depois da migração dos testes | Evita duas versões da mesma tela | n |
| Fuso das datas | `America/Sao_Paulo` | Público e equipe no Brasil | y |

**Open questions:** none - all resolved or logged above (required before the spec is confirmed).

---

## User Stories

### P1: Uma tela com abas dentro do Guia ⭐ MVP

**User Story**: As a pessoa da equipe do mandato, I want encontrar tudo do mandato em uma tela do Guia so that eu não entre e saia de páginas diferentes.

**Why P1**: É o pedido central.

**Acceptance Criteria** (each line is one EARS pattern):

1. The Guia SHALL mostrar no grupo Mandato do menu lateral o item "Área do mandato" no lugar de "Configurações". <!-- ubiquitous -->
2. WHEN a pessoa abre `#/config` THEN the Guia SHALL mostrar a tela "Área do mandato" com as abas `Visão geral`, `Dados do mandato`, `Equipe e convites` e `Minha conta`, com a Visão geral ativa. <!-- event-driven -->
3. WHEN a pessoa abre `#/config/dados`, `#/config/equipe` ou `#/config/conta` THEN the Guia SHALL mostrar a aba correspondente ativa. <!-- event-driven -->
4. WHEN a pessoa clica em uma aba THEN the Guia SHALL trocar o conteúdo sem recarregar a página e atualizar o endereço para a aba escolhida. <!-- event-driven -->
5. WHEN a pessoa usa o botão Voltar do navegador depois de trocar de aba THEN the Guia SHALL mostrar a aba anterior. <!-- event-driven -->
6. IF o endereço tem uma aba desconhecida (`#/config/xyz`) THEN the Guia SHALL mostrar a Visão geral. <!-- unwanted-behavior -->
7. The Guia SHALL manter o menu lateral, o cabeçalho e o item "Área do mandato" marcado como ativo em todas as abas. <!-- ubiquitous -->

**Independent Test**: Abrir o Guia, clicar em "Área do mandato" e percorrer as 4 abas vendo o endereço mudar e o botão Voltar funcionar, sem sair do Guia.

---

### P1: Conteúdo de cada aba ⭐ MVP

**User Story**: As a pessoa da equipe, I want que cada aba traga o que já existe hoje so that nada se perca na mudança.

**Why P1**: Sem o conteúdo, a tela nova não substitui as antigas.

**Acceptance Criteria**:

1. The aba Visão geral SHALL mostrar o cartão do mandato (nome, cargo, UF, partido, posse), o papel da pessoa, o resumo da equipe (avatares, total de pessoas, convites pendentes e botão "Convidar pessoa" que abre a aba Equipe) e a atividade recente, sem o andamento dos 100 dias nem as missões. <!-- ubiquitous -->
2. WHILE o mandato não tem data de posse a aba Visão geral SHALL mostrar o aviso "Informe a data de posse para acompanhar os prazos." com o link "Informar agora" para a aba Dados. <!-- state-driven -->
3. The aba Dados do mandato SHALL mostrar o formulário de edição que as Configurações têm hoje, com as mesmas regras e o mesmo botão "Salvar alterações". <!-- ubiquitous -->
4. WHERE a pessoa é `coordenacao` the aba Dados SHALL mostrar no fim, em bloco separado "Zona de risco", o botão "Excluir cadastro" com a confirmação de hoje. <!-- optional-feature -->
5. WHERE a pessoa não é `coordenacao` the aba Dados SHALL não mostrar a Zona de risco. <!-- optional-feature -->
6. The aba Equipe e convites SHALL mostrar o formulário de convite, os convites pendentes, as pessoas do mandato e o "Sair do mandato", com as mesmas regras e permissões de hoje. <!-- ubiquitous -->
7. The aba Equipe e convites SHALL mostrar no rótulo o total de pessoas, no formato "Equipe e convites (2)". <!-- ubiquitous -->
8. The aba Minha conta SHALL mostrar o e-mail da conta e os campos do próprio perfil (nome, data de nascimento, gênero, raça, UF, telefone, atuação política) em texto, sem campo editável, e o texto "Para corrigir seus dados, escreva para contato@legislabrasil.org". <!-- ubiquitous -->
9. WHERE a pessoa não tem perfil (equipe Legisla) the aba Minha conta SHALL mostrar só o e-mail. <!-- optional-feature -->
10. IF a leitura de uma aba falha THEN the Guia SHALL mostrar a mensagem de erro daquela aba com o botão "Tentar de novo" sem derrubar as outras abas. <!-- unwanted-behavior -->
11. WHILE a pessoa tem papel `leitura` the aba Dados SHALL mostrar o formulário só para leitura e a aba Equipe SHALL não mostrar botões que alteram. <!-- state-driven -->

**Independent Test**: Em um mandato com 2 pessoas, abrir cada aba e conferir o conteúdo; como `coordenacao` ver a Zona de risco; como `leitura` não ver nenhum botão que altera.

---

### P1: Endereços antigos continuam funcionando ⭐ MVP

**User Story**: As a pessoa com um link ou favorito antigo, I want que ele leve ao lugar certo so that nada quebre.

**Why P1**: Links de convite, mensagens enviadas e favoritos usam `/mandato` e `/mandato/equipe`.

**Acceptance Criteria**:

1. WHEN uma pessoa abre `/mandato` THEN the sistema SHALL redirecionar para `/guia#/config`. <!-- event-driven -->
2. WHEN uma pessoa abre `/mandato/equipe` THEN the sistema SHALL redirecionar para `/guia#/config/equipe`. <!-- event-driven -->
3. WHEN o primeiro acesso volta com `volta=mandato` THEN the sistema SHALL abrir `/guia#/config`. <!-- event-driven -->
4. The Guia SHALL não conter mais link para `/mandato` nem para `/mandato/equipe`. <!-- ubiquitous -->
5. IF a pessoa sem sessão abre um endereço antigo THEN the Guia SHALL mostrar a entrada com o Google e, depois do login, abrir a aba pedida. <!-- unwanted-behavior -->

**Independent Test**: Abrir `/mandato/equipe` com e sem sessão e ver o Guia abrir na aba Equipe e convites.

---

### P2: Teclado, leitor de tela e celular

**User Story**: As a pessoa que usa teclado, leitor de tela ou celular, I want que as abas funcionem para mim so that eu consiga usar a tela.

**Why P2**: Acessibilidade e uso em 400 px são obrigatórios no projeto, mas não bloqueiam o uso principal.

**Acceptance Criteria**:

1. The abas SHALL ter papel de lista de abas (`tablist`, `tab`, `tabpanel`), com a aba ativa marcada por `aria-selected`. <!-- ubiquitous -->
2. WHEN a pessoa usa as setas esquerda e direita com o foco na lista de abas THEN the Guia SHALL mover o foco e ativar a aba vizinha, com Home e End indo à primeira e à última. <!-- event-driven -->
3. The Guia SHALL mostrar a Área do mandato sem rolagem horizontal da página em 400 px de largura, com a lista de abas rolando dentro do próprio contêiner. <!-- ubiquitous -->

**Independent Test**: Navegar só com o teclado entre as 4 abas; abrir em 400 px e conferir que a página não rola para o lado.

---

### P3: Código antigo removido

**User Story**: As a pessoa que mantém o sistema, I want que a tela antiga saia do código so that não existam duas versões.

**Why P3**: Higiene; a feature funciona sem ela.

**Acceptance Criteria**:

1. The sistema SHALL não conter as páginas `app/mandato/page.tsx` e `app/mandato/equipe/page.tsx` nem a casca `app/mandato/Casca.tsx`, mantendo só o que as abas reaproveitam. <!-- ubiquitous -->
2. The sistema SHALL manter a cobertura de testes das telas movidas, com os testes de `e2e/mandato-*.spec.ts` migrados para a Área do mandato, sem remover caso de teste que ainda vale. <!-- ubiquitous -->

**Independent Test**: A busca por `Casca` e pelas páginas antigas não acha uso, e a suíte passa.

---

## Edge Cases

- IF a pessoa tem um mandato mas a leitura do papel falha THEN the Guia SHALL mostrar o erro da aba com "Tentar de novo" e não liberar botões de edição.
- WHEN a pessoa troca de mandato no Guia estando na Área do mandato THEN the Guia SHALL recarregar a aba aberta para o novo mandato, sem mostrar dados do anterior.
- IF a pessoa abre a aba Equipe sem ter mandato ativo THEN the Guia SHALL seguir o fluxo de primeiro acesso, sem mostrar a Área do mandato.
- WHEN a pessoa sai do mandato pela aba Equipe THEN the Guia SHALL abrir outro mandato dela ou o primeiro acesso, como hoje.

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| AMA-01 | P1: Uma tela com abas dentro do Guia | Specify | Pending |
| AMA-02 | P1: Conteúdo de cada aba | Specify | Pending |
| AMA-03 | P1: Endereços antigos continuam funcionando | Specify | Pending |
| AMA-04 | P2: Teclado, leitor de tela e celular | Specify | Pending |
| AMA-05 | P3: Código antigo removido | Specify | Pending |

**ID format:** `[CATEGORY]-[NUMBER]`; cada critério de aceite é citado como `AMA-02.4` (história, ponto).

**Coverage:** 5 total, 0 mapped to tasks, 5 unmapped ⚠️

---

## Success Criteria

How we know the feature is successful:

- [ ] Uma pessoa gera um convite, vê a equipe e edita os dados do mandato sem sair do menu lateral do Guia.
- [ ] Nenhum link, convite ou favorito antigo de `/mandato` quebra.
- [ ] Nenhuma permissão muda: `leitura` não altera nada e só `coordenacao` exclui o cadastro.
- [ ] A suíte de testes não perde nenhum caso das telas movidas.
