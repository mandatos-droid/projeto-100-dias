# Landing Page do Guia dos 100 Dias Specification

## Problem Statement

Hoje a raiz da plataforma abre direto o Guia (login e exercícios). Quem chega sem conhecer a Legisla Brasil não vê o que ganha antes de se cadastrar. A landing apresenta o Guia ao público-alvo, o Mandato (parlamentar eleito e equipe), prova o valor com uma demonstração com dados reais do TSE e leva ao cadastro livre. O foco é conversão para o cadastro e o início da Missão 1, não venda.

## Goals

- [ ] O visitante chega ao cadastro (`/guia`) em no máximo 1 clique a partir de qualquer ponto da landing.
- [ ] O visitante vê o desempenho de um parlamentar com dados do TSE em até 3 interações: digitar, escolher, ler.
- [ ] A landing funciona em tela de 360 px, sem rolagem horizontal.
- [ ] O Guia continua funcionando como antes, agora em `/guia`, incluindo o login Google.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| ------- | ------ |
| Pré-preencher o cadastro do Guia com o parlamentar escolhido na demonstração | Exige mexer no legado (`cadastro.js`); fica para a v2 |
| Medição de conversão (analytics, eventos) | Ferramenta ainda não definida; fica para a v2 |
| Prints reais da plataforma | A v1 usa ilustração em CSS/SVG; prints entram quando o layout estabilizar |
| Depoimentos de mandatos | Ainda não existem |
| Preços, planos, pagamento | O Guia é gratuito; o foco não é venda |
| Demonstração de vereadores e prefeitos | O `eleitos.json` cobre só Câmara, Assembleias/CLDF e Senado |
| Alterar regras de cadastro/login | O cadastro livre já é o comportamento do Guia |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Público-alvo | O Mandato: parlamentar eleito e quem o assessora | Decisão do usuário | y |
| Cadastro | Livre, feito no próprio Guia em `/guia` | Decisão do usuário | y |
| Onde fica a landing | Dentro da plataforma Next.js, em `/` | Decisão do usuário | y |
| O que "ao vivo do TSE" significa | Busca sobre os dados do TSE já publicados em `public/data`; só a foto vem em tempo real do TSE | Evita depender de API do TSE no navegador (CORS, instabilidade); o `npm run dados` já mantém a base | n |
| Quem aparece na demonstração | Os eleitos de 2026 e os senadores eleitos em 2022 do `eleitos.json` | É a base que o produto já tem; dados públicos | n |
| Privacidade da demonstração | Mostra só dados públicos de candidatura e resultado; nunca título, CPF ou nascimento | Regra de LGPD já adotada em `build_pleitos.py` | y |
| Destino do CTA | `/guia` (o Guia já tem a tela de login/cadastro) | Zero mudança no fluxo de cadastro | n |
| Retorno do login Google | `/guia`; se cair em `/` com `#access_token`, a landing repassa para `/guia` | Ninguém perde o login por falta da Redirect URL no Supabase | n |
| Tom e identidade | Português do Brasil, paleta bordô da Legisla (`--vinho:#571730`, `--papel:#FBF6EE`) | Segue `legacy.css` | n |
| Testes | Testes unitários da lógica pura (`node --test`); UI conferida por `tsc` e fumaça no navegador | O repo não tem runner de testes; Node 25 executa `.ts` direto | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Chegar na landing e entrar no Guia ⭐ MVP

**User Story**: Como membro de um mandato, quero abrir o endereço da plataforma e entender em segundos o que é o Guia, para decidir me cadastrar.

**Why P1**: Sem a rota e o CTA não há conversão.

**Acceptance Criteria** (each line is one EARS pattern):

1. WHEN o visitante abre `/` THEN the system SHALL exibir a landing com o título "Os primeiros 100 dias moldam o resto do mandato" e o botão "Começar meu Mapa Político" visível sem rolar a página em 1280×720.
2. WHEN o visitante aciona qualquer botão "Começar meu Mapa Político" THEN the system SHALL navegar para `/guia`.
3. WHEN o visitante abre `/guia` THEN the system SHALL exibir o Guia legado com o mesmo comportamento de antes, incluindo a tela de login/cadastro.
4. WHILE o visitante está em `/` the system SHALL NOT aplicar `legacy.css` nem `ilhas.css` à página.
5. WHEN o visitante abre `/` com `#access_token=` ou `#error_description=` no endereço THEN the system SHALL redirecionar para `/guia` preservando o hash.
6. WHEN o visitante abre `/painel` THEN the system SHALL continuar servindo `painel.html`.
7. The system SHALL repetir o botão "Começar meu Mapa Político" no topo, após a demonstração e no fechamento da página.

**Independent Test**: Abrir `/` e `/guia` no navegador; clicar no CTA e cair em `/guia`; abrir `/#access_token=x` e cair em `/guia#access_token=x`.

---

### P1: Demonstração com dados do TSE ⭐ MVP

**User Story**: Como parlamentar ou assessor, quero digitar um nome e ver votos, ranking e histórico eleitoral, para sentir o valor do Guia antes de me cadastrar.

**Why P1**: É o principal gerador de conversão da página.

**Acceptance Criteria**:

1. WHEN o visitante digita 2 ou mais caracteres no campo de busca THEN the system SHALL listar até 8 eleitos cujo nome de urna ou nome civil contém o termo, ignorando acentos e maiúsculas.
2. WHILE o campo tem menos de 2 caracteres the system SHALL NOT listar sugestões.
3. WHEN o visitante escolhe um eleito THEN the system SHALL exibir foto, nome de urna, partido, cargo, UF, votos nominais e percentual dos votos válidos.
4. WHEN o visitante escolhe um eleito THEN the system SHALL exibir a posição dele por votos entre os eleitos da mesma Casa e UF, no formato "Nº X de Y".
5. WHEN o visitante escolhe um eleito THEN the system SHALL exibir quantas cadeiras o partido dele ocupa na mesma Casa e UF.
6. WHEN o visitante escolhe um eleito THEN the system SHALL informar se foi reeleito, veio de outro cargo ou está no primeiro mandato, quando o dado existir.
7. WHEN o visitante escolhe um eleito com pleitos anteriores no TSE THEN the system SHALL listar até 6 pleitos, do mais recente ao mais antigo, com ano, cargo, partido, votos e situação.
8. IF a busca não encontra nenhum eleito THEN the system SHALL exibir a mensagem "Não encontramos esse nome entre os eleitos de 2026. Confira a grafia ou cadastre-se para trabalhar com qualquer candidatura."
9. IF o carregamento do histórico de pleitos falha THEN the system SHALL manter o cartão do eleito visível e exibir "Histórico indisponível agora".
10. IF a foto do TSE não carrega THEN the system SHALL exibir a inicial do nome no lugar da foto.
11. WHEN o cartão do eleito é exibido THEN the system SHALL mostrar o botão "Salvar meu mapa" que leva a `/guia`.
12. WHEN o eleito escolhido é senador eleito em 2022 THEN the system SHALL omitir o percentual dos votos válidos e a posição por votos.
13. The system SHALL NOT exibir título eleitoral, CPF nem data de nascimento.

**Independent Test**: Digitar "silva", escolher um resultado, conferir o cartão; digitar "zzzz" e ver a mensagem; bloquear `pleitos` na rede e ver "Histórico indisponível agora".

---

### P2: Entender o caminho completo

**User Story**: Como visitante, quero ver as missões, o que a plataforma entrega, a base de confiança e as dúvidas comuns, para ter segurança de que vale começar.

**Why P2**: Sustenta a decisão, mas a demonstração e o CTA já formam o MVP.

**Acceptance Criteria**:

1. The system SHALL exibir as 5 missões em linha do tempo, cada uma com título, dia ideal (15, 30, 45, "desde o 1º dia", 100) e o que entrega.
2. The system SHALL exibir 4 blocos de funcionalidades: mapas, hemiciclo, equipe recomendada e resumo/painel.
3. The system SHALL exibir uma faixa de privacidade que diz que os dados do mandato ficam com o mandato e que a demonstração usa só dados públicos do TSE.
4. The system SHALL citar as fontes TSE e IDSC-BR e identificar a Legisla Brasil como autora do Guia.
5. The system SHALL exibir perguntas frequentes sobre tempo de uso, quem pode usar, o que fazer se os 100 dias já passaram e se é gratuito.

**Independent Test**: Rolar a página e conferir cada seção.

---

### P2: Qualidade de acesso

**User Story**: Como visitante em celular ou com leitor de tela, quero a mesma experiência, para não ser barrado.

**Why P2**: Boa parte do público abre pelo celular e por WhatsApp.

**Acceptance Criteria**:

1. WHILE a largura da tela é 360 px the system SHALL exibir a landing sem rolagem horizontal.
2. The system SHALL associar um rótulo ao campo de busca e expor a lista de sugestões com `role="listbox"`.
3. WHEN o visitante usa as setas e Enter no campo de busca THEN the system SHALL mover o destaque e escolher a sugestão destacada.
4. The system SHALL definir título, descrição e `lang="pt-BR"` da página, com título diferente do Guia.

**Independent Test**: Reduzir a janela a 360 px; navegar a busca só pelo teclado.

---

## Edge Cases

- IF o visitante digita só espaços THEN the system SHALL tratar o termo como vazio e não listar sugestões.
- IF o termo casa com mais de 8 eleitos THEN the system SHALL listar os 8 de maior votação.
- IF o arquivo `eleitos.json` falha ao carregar THEN the system SHALL exibir "Não foi possível carregar a base do TSE agora" e manter o CTA funcionando.
- IF o eleito escolhido não tem entrada em `pleitos/{uf}.json` THEN the system SHALL exibir "Sem pleitos anteriores no TSE".
- IF o JavaScript está desativado THEN the system SHALL exibir a landing e o botão "Começar meu Mapa Político" funcionando como link comum.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| LAND-01 | P1: Chegar na landing e entrar no Guia | Tasks | Pending |
| LAND-02 | P1: Chegar na landing e entrar no Guia | Tasks | Pending |
| LAND-03 | P1: Demonstração com dados do TSE | Tasks | Pending |
| LAND-04 | P1: Demonstração com dados do TSE | Tasks | Pending |
| LAND-05 | P1: Demonstração com dados do TSE | Tasks | Pending |
| LAND-06 | P1: Demonstração com dados do TSE | Tasks | Pending |
| LAND-07 | P2: Entender o caminho completo | Tasks | Pending |
| LAND-08 | P2: Qualidade de acesso | Tasks | Pending |

Mapeamento ACs → IDs: LAND-01 = P1 Chegar AC 1, 4, 7; LAND-02 = P1 Chegar AC 2, 3, 5, 6; LAND-03 = P1 Demo AC 1, 2 e edge de busca; LAND-04 = P1 Demo AC 3 a 7 e 12; LAND-05 = P1 Demo AC 8 a 10 e edges de falha; LAND-06 = P1 Demo AC 11 e 13; LAND-07 = P2 Entender AC 1 a 5; LAND-08 = P2 Qualidade AC 1 a 4.

**Coverage:** 8 total, 8 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] `/` abre a landing e `/guia` abre o Guia, com o login Google voltando para o Guia.
- [ ] Digitar "silva" na demonstração e escolher um resultado mostra o cartão completo em menos de 2 segundos em rede local.
- [ ] `npx tsc --noEmit` e `npm test` passam.
- [ ] Sem rolagem horizontal em 360 px.
