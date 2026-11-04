# Sugestões da Missão 4 (tabela `sugestoes`, #46–#53, 03/11/2026) · Specification

Origem: leitura direta do Supabase por CLI em 2026-11-04 (texto e print de cada pedido). Autora: Alana Portes Legisla. Todos pendentes (`resolvida = false`). O ID `SUG-NN` é o `id` da tabela. Os prints foram conferidos um a um.

## Problem Statement

A Alana testou as telas novas da Missão 4 (comissões, ações dos 100 dias, acompanhamento da comunicação) e pediu 8 ajustes de texto, de estrutura de perguntas e de registro. Nenhum muda o Guia (`conteudo.js`); todos mexem nas ilhas `ilhas/capital/*` e em `lib/capital.ts` / `lib/comunicacao.ts`.

## Fora de escopo (e por quê)

| Item | Motivo |
| --- | --- |
| #33, #61 (`#/m/3/m3.bandeiras/3`, comissões na Missão 3) | São da Missão 3: a #33 pergunta de onde veio o exercício; a #61 pede outros cargos além de titular nas comissões da M3. Ficam para a rodada da Missão 3. |
| #60 (`#/sugestoes`, "não estou conseguindo subir essa info") | Bug do envio de sugestão, não da Missão 4. |
| Alimentar `sucessos` da meta a partir das ações (#53, 2ª metade) | Só o vínculo ação → meta entra agora; a regra de evidência precisa de desenho (ver Assumptions). |
| `git push`, deploy, marcar as 8 linhas como resolvidas no Supabase | Exigem go-ahead à parte. |

## Requisitos (EARS)

### Grupo A · Comissões (`CartaoComissao.tsx`, `lib/capital.ts`)

| ID | Req |
| --- | --- |
| SUG-46 | O papel "Relatoria" passa a se chamar **"Conquista de Relatoria Relevante"** nos botões. Registro antigo com o texto "Relatoria" (ou vindo do espaço da Missão 3) aparece marcado nesse botão, sem perder o dado. |
| SUG-48 | A lista de movimentos ganha **"Articular com a Presidência da Casa"**. |
| SUG-47 | A pergunta "Primeiro movimento" vira **"Ordem de tudo o que o mandato precisa fazer para alcançar este objetivo (selecionar até 4 movimentos)"**. Cada movimento marcado pede uma **data**; os marcados aparecem em ordem de data (sem data, depois, na ordem em que foram marcados). O 5º movimento é recusado com aviso. A data segue a regra de prazo das ações (de hoje até 100 dias após a posse). `D.comissoes[i].mov` continua em texto legível (movimentos separados por "; ", com a data entre parênteses) para o Guia antigo e o Resumo; `movs` guarda a lista estruturada. Registro antigo só com `mov` abre com o movimento marcado e sem data. |

### Grupo B · Ações dos 100 dias (`Matriz.tsx`, `LinhaAcao.tsx`, `lib/capital.ts`)

| ID | Req |
| --- | --- |
| SUG-49 | Em **todas as frentes** há um campo "Outra ação (escrever)" com botão "Adicionar". A ação escrita entra na lista da frente, marcada, e conta no progresso (2 ações em 2 frentes) e em "Todas as ações". Pode ser removida como as demais. |
| SUG-52 | Ao marcar uma ação aparecem duas opções: **"Detalhar em formato de resumo"** (uma caixa de texto) e **"Detalhar em formato de registro completo"** (os 5 campos de hoje). Ação antiga com algum campo preenchido abre direto no registro completo. Ação completa = resumo preenchido (modo resumo) ou os 5 campos preenchidos (modo completo). O Resumo do Guia mostra o texto do resumo. |
| SUG-53 | Em cada ação marcada há "Meta do planejamento relacionada" (lista das metas da Missão 3, com "Nenhuma"). O vínculo guarda o `id` da meta; meta sem `id` ou removida some do vínculo sem apagar a ação. O Resumo mostra a meta ligada. |

### Grupo C · Acompanhamento da comunicação (`SecaoComunicacao.tsx`, `lib/comunicacao.ts`)

| ID | Req |
| --- | --- |
| SUG-50 | Em cada seção há dois botões: **"Registrar o que aconteceu esta semana ou nos últimos 15 dias"** e **"Registrar o que aconteceu este mês"**. O primeiro pede a data do registro (de 14 dias atrás até hoje, padrão hoje); o registro cai na semana ISO dessa data e uma semana tem um registro por seção. O segundo pede o mês (padrão o atual, não futuro); um mês tem um registro por seção, guardado em `D.comunicacao.meses`. Números ≥ 0, como hoje. |
| SUG-51 | O cabeçalho fechado mostra a **data certa** do último registro, não "2026-W45": "em 04/11/2026" (registro com data), "semana de 02/11 a 08/11/2026" (registro antigo sem data) ou "mês de novembro de 2026". O Resumo do Guia usa o mesmo texto. O gráfico mensal aparece com 2 meses ou mais; o semanal segue igual. |

## Assumptions (decisões minhas, para a Alana confirmar)

1. **SUG-49 "em todas as abas"**: li "abas" como as frentes (Articulação política, Mobilização, Relevância no partido, Redes sociais). Não entra campo na aba "Todas as ações" (ela só lista).
2. **SUG-47**: a data de cada movimento usa o mesmo limite do prazo das ações. O "objetivo" da pergunta é a comissão do cartão.
3. **SUG-50**: "últimos 15 dias" é uma janela só de escolha da data; a semana ISO continua sendo a chave do dado, para o gráfico semanal e o Resumo não mudarem.
4. **SUG-53**: o vínculo é só ligação e exibição. Usar as ações como evidência de atingimento (`sucessos` mensais da Missão 5) precisa de regra (qual ação conta como sucesso?) e fica como pergunta aberta.
5. Nenhum texto do Guia (`conteudo.js`) muda; `tests/legado-m4.test.ts` segue com os mesmos hashes.

## Critérios de sucesso

- 8 pedidos com teste (unitário em `tests/*.test.ts` ou e2e em `e2e/capital-*.spec.ts`) que falha sem a mudança.
- `npm test`, `npx tsc --noEmit` e os e2e `capital-*` passam; dados antigos (sem `movs`, `modo`, `metaId`, `meses`, `datas`) seguem abrindo.
