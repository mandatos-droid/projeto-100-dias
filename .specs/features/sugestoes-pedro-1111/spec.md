# Sugestões do Pedro (11/11/2026) Specification

**Fonte**: tabela `sugestoes` (Supabase Projeto 100 Dias), ids 132–141, conta pedrobrandine@legislabrasil.org, todas `resolvida=false`. Código-base: `origin/main` (Missão 1 reestruturada); a branch `feat/primeiro-acesso-google` não tem essas telas.
**Status**: Draft

## Problem Statement

Em 11/11/2026 o Pedro registrou 10 sugestões revisando a Missão 1 (Conjuntura, Oportunidades) e a tela de dados do mandato: texto que cita um botão inexistente, barras de rolagem indevidas nas abas, cartões de parlamentares ruidosos e com cargo sem concordância de gênero, municípios mais votados fora do tópico onde são classificados, cartões de agenda longos e pouco legíveis, uma seleção de dados por `<select>` que ele quer visual, e um contador de dias que passa de 100.

## Goals

- Fechar as 10 sugestões sem mudar schema do banco nem o formato do que já está gravado em `mandatos.dados`.
- Manter o Resumo da Missão 1 igual depois das mudanças.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Mudar schema do banco | Nenhuma sugestão exige; `D.conj2.reacoes` e `prefExtra` mantêm o formato. |
| Editar arquivos extraídos do Guia (`conteudo.js`, `app.js`, `legacy.css`) | Seriam sobrescritos na próxima extração (CLAUDE.md); correções vão em `ilhas.css`, `novos.js` e `m1.js`. |
| Texto de conceito por indicador no tooltip | O catálogo não traz conceito; só se o Pedro enviar os textos. |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| #141 "a contagem aqui está errada" (regra do contador, opção 2 do Pedro) | O contador mostra quanto falta: posse futura "faltam N dias para a posse"; dias 1 a 99 "faltam N dias" (N = 100 - dia); dia 100 "último dia dos 100"; acima de 100 "100 dias concluídos"; sem posse, sem contador | Pedro: "o contador deve mostrar quantos dias faltam para a posse"; escolheu a opção 2 em 11/11 | y (Pedro, 11/11); o texto do dia 100 é decisão da coordenação e o Pedro ainda deve confirmar |
| #139 item 1: caixa cortada no rodapé | A T6 reproduz em 1280px e 390px antes de corrigir; sem repro, devolve ao Pedro. A nova captura do Pedro mostra o topo do bloco seguinte cortado pela borda do print: recorte de captura, sem defeito | A captura mostra só o cabeçalho; corrigir sem causa seria chute | y (Pedro, 11/11) |
| #133/#135: onde ficam os 5 municípios | Os cartões "Os 5 municípios mais votados" passam a ocupar o tópico "Prefeituras que a liderança acompanha"; some a escolha manual de municípios | #135 diz que "isso" deve estar no tópico do #133 | n |
| `prefExtra` já salvo | Preservado no banco, só deixa de ser exibido | Apagar perderia respostas de quem já preencheu | y |
| #138.4 conteúdo do tooltip | Fonte, ano e sentido do catálogo | O catálogo não tem conceito por indicador | n |
| #137 `.capturable-data` | A classe é criada nos números do Placar, grandes números e cartões de município | Não existe no código hoje | y |
| #136 "Remover Prefeitura" | Remove a linha "Prefeitura · a definir" do Placar | A captura mostra essa linha; a prefeitura passa a ser classificada nos 5 cartões. A prefeitura do domicílio só é classificável se o município estiver entre os 5 cartões | y (Pedro, 11/11) |
| #139 item 4 "layout rígido / dimensionamento incorreto" (veio sem texto) | Lido como cartões do carrossel de parlamentares com largura fixa que deixam a direita vazia em telas largas: passam a dividir a largura disponível (PAR-06). Interpretação do dono do produto | O item 4 não tem texto; a captura mostra 3 cartões estreitos e espaço vazio à direita | y (Pedro, 11/11) |
| Ficha de detalhe do parlamentar | Segue o mesmo padrão do cartão do carrossel (PAR-05): relação atual uma vez, `select` e "Remover classificação"; a linha da tabela mantém os 5 botões | O dono confirmou que PAR-02 vale também para a ficha | y (Pedro, 11/11) |

Open questions: #138.4 (textos de conceito dos indicadores). Resolvidas pelo Pedro em 11/11: #141 (contador), #139 item 1 (recorte de captura) e item 4 (layout fluido), #136 e a ficha de detalhe.

## User Stories

### P1: Corrigir o que está quebrado ou enganoso ⭐ MVP

**User Story**: Como assessor(a), quero que as telas não prometam botões inexistentes nem tenham barras de rolagem e erros de concordância, para confiar no que leio.

**Why P1**: São defeitos visíveis em telas que todo gabinete usa.

**Acceptance Criteria** (each line is one EARS pattern):

1. WHEN a Conjuntura 2.1 é exibida, THE SYSTEM SHALL mostrar o título "Categorias de classificação" sem o trecho "o botão “i” também explica cada uma".
2. WHEN qualquer `.abas` é exibida, THE SYSTEM SHALL NOT mostrar barra de rolagem vertical.
3. WHEN um cartão de parlamentar mulher é exibido, THE SYSTEM SHALL escrever o cargo no feminino (Deputada Estadual, Deputada Federal, Deputada Distrital, Senadora).
4. WHEN o contador de dias é exibido (barra lateral, cabeçalho móvel e resumo baixado), THE SYSTEM SHALL mostrar: com posse futura, "faltam N dias para a posse" ("falta 1 dia para a posse" no singular); com a posse já ocorrida e o dia entre 1 e 99, "faltam N dias" com N = 100 menos o dia ("falta 1 dia" no singular); no dia 100, "último dia dos 100"; acima de 100, "100 dias concluídos"; e SHALL NOT mostrar um número maior que 100. (CFG-01)
5. WHEN um texto da Missão 1 se refere à pessoa de forma genérica, THE SYSTEM SHALL usar “liderança parlamentar” em vez de formas flexionadas (“parlamentar”, “eleito(a)”, “Deputado(a)”), e SHALL manter o cargo flexionado no cartão de uma pessoa específica (PAR-01) e as listas de opções de cargo. (TERM-01, sugestão #97 da Alana)

**Independent Test**: Abrir o Guia com a posse há 283, 30 e -5 dias e conferir o contador nos três lugares.

### P1: Parlamentares e municípios classificáveis sem ruído ⭐ MVP

**User Story**: Como assessor(a), quero classificar parlamentares e os 5 municípios mais votados num lugar só e sem repetição de botões.

**Why P1**: É o núcleo da Conjuntura 2.1 e 2.2.

**Acceptance Criteria**:

1. WHEN um cartão de parlamentar é exibido, THE SYSTEM SHALL mostrar a relação atual uma única vez e um controle compacto para trocá-la, com as 5 categorias e "Remover classificação".
2. WHEN a tela de parlamentares é exibida em 1280px de largura, THE SYSTEM SHALL manter o botão de navegação fora da caixa de texto do cabeçalho.
3. WHEN a rolagem chega ao fim da página, THE SYSTEM SHALL mostrar o último bloco inteiro, com margem inferior.
4. WHEN a Conjuntura 2.2 é exibida com partido e UF definidos, THE SYSTEM SHALL mostrar os 5 cartões de município mais votado dentro do tópico de municípios e SHALL NOT mostrar "Adicionar município" nem "Adicionar todos os municípios com prefeito".
5. WHEN o Placar é exibido, THE SYSTEM SHALL NOT mostrar a linha "Prefeitura".
6. WHEN a ficha de detalhe de um parlamentar é exibida, THE SYSTEM SHALL mostrar a relação atual uma única vez, um controle compacto com as 5 categorias para trocá-la e "Remover classificação", sem os 5 botões de relação. (PAR-05)
7. WHEN o carrossel de parlamentares classificados é exibido em qualquer largura de 390px a 1600px, THE SYSTEM SHALL dividir a largura disponível entre os cartões do slide, sem espaço vazio à direita e sem cortar o conteúdo, mantendo Anterior/Próximo e as contagens por categoria. (PAR-06)

**Independent Test**: Classificar um parlamentar e um município e conferir que o Resumo mostra as mesmas respostas.

### P2: Cartões de agenda legíveis

**User Story**: Como assessor(a), quero cartões de agenda curtos, coloridos e explicados, para ler os indicadores sem percorrer a página inteira.

**Why P2**: Melhora leitura; a Missão funciona sem isso.

**Acceptance Criteria**:

1. WHEN um cartão de agenda tem mais indicadores que cabem em 420px, THE SYSTEM SHALL rolar só a lista, mantendo título e filtro visíveis.
2. WHEN uma faixa (Muito baixo a Muito alto) é exibida, THE SYSTEM SHALL usar fundo preenchido e texto em negrito, com contraste mínimo de 4,5:1.
3. WHEN um cartão de agenda é exibido, THE SYSTEM SHALL separar o cabeçalho do corpo por faixa colorida ou fundo suave.
4. WHEN a pessoa passa o mouse ou foca o ⓘ de um indicador, THE SYSTEM SHALL mostrar um tooltip com fonte, ano e sentido do indicador.

**Independent Test**: Abrir Oportunidades 3.2 com UF=MG, rolar um cartão longo e focar o ⓘ do IDEB.

### P2: Selecionar 2 dados clicando na página

**User Story**: Como assessor(a), quero escolher os dois dados da reação do mandato clicando neles na própria página.

**Why P2**: Pedido de melhoria de uso; o `<select>` atual funciona.

**Acceptance Criteria**:

1. WHEN a pessoa aciona "Selecionar 2 dados na tela", THE SYSTEM SHALL abrir um banner fixo com [Cancelar], destacar os elementos `.capturable-data` e capturar o 1º clique como Dado 1 e o 2º como Dado 2.
2. WHEN o 2º clique ocorre, THE SYSTEM SHALL fechar o banner, rolar suavemente ao formulário e exibir os dois dados como chips com ✕.
3. WHEN a pessoa remove um chip, THE SYSTEM SHALL limpar só aquele dado e permitir reabrir a seleção.
4. IF a pessoa clica duas vezes no mesmo dado, THEN THE SYSTEM SHALL ignorar o segundo clique e avisar no banner.
5. WHEN a pessoa aciona [Cancelar] ou Esc no meio da captura, THE SYSTEM SHALL fechar o banner sem gravar dado pela metade.
6. WHEN o modo de captura está ativo na pergunta 2 (Cadeiras do partido), THE SYSTEM SHALL permitir escolher cada cartão inteiro (Câmara, Senado, Assembleia Legislativa), com o par Brasil/UF como valor, destacando o cartão todo ao passar o mouse. (SEL-02, sugestão #144)

**Independent Test**: Capturar dois indicadores, conferir os chips e o Resumo; repetir cancelando no meio.

## Edge Cases

- Posse ausente: o contador não aparece e nada quebra.
- Parlamentar sem gênero cadastrado: cargo no masculino.
- Indicador sem fonte ou ano: o tooltip mostra só o que existe.
- Clique em botão ou link dentro de um elemento capturável durante a captura: conta como captura, não aciona o botão.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| CJ-01 | P1: Corrigir o que está quebrado | Tasks | Pending |
| CJ-02 | P1: Parlamentares e municípios | Tasks | Pending |
| CJ-03 | P1: Parlamentares e municípios | Tasks | Pending |
| UI-01 | P1: Corrigir o que está quebrado | Tasks | Pending |
| PAR-01 | P1: Corrigir o que está quebrado | Tasks | Pending |
| PAR-02 | P1: Parlamentares e municípios | Tasks | Pending |
| PAR-03 | P1: Parlamentares e municípios | Tasks | Pending |
| PAR-04 | P1: Parlamentares e municípios | Tasks | Pending |
| PAR-05 | P1: Parlamentares e municípios | Tasks | Pending |
| PAR-06 | P1: Parlamentares e municípios | Tasks | Pending |
| OP-01 | P2: Cartões de agenda | Tasks | Pending |
| OP-02 | P2: Cartões de agenda | Tasks | Pending |
| OP-03 | P2: Cartões de agenda | Tasks | Pending |
| OP-04 | P2: Cartões de agenda | Tasks | Pending |
| SEL-01 | P2: Selecionar 2 dados | Tasks | Pending |
| CFG-01 | P1: Corrigir o que está quebrado | Tasks | Pending |
| TERM-01 | P1: Corrigir o que está quebrado | Tasks | Pending |
| SEL-02 | P2: Selecionar 2 dados | Tasks | Done |

## Success Criteria

- As 10 sugestões (132–141) ficam `resolvida=true` só depois do deploy verificado e da confirmação do Pedro.
- `tsc`, `npm test` e os e2e `m1-*` passam; o Resumo da Missão 1 não muda.
