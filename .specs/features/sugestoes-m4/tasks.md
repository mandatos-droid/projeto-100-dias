# Sugestões da Missão 4 · Tasks

Caminhos relativos a `plataforma/`. Commits atômicos, `git add` nominal (há mudanças do usuário não commitadas). `graphify update .` ao final. Requisitos em [spec.md](spec.md).

## Grupo A · Comissões (SUG-46, 47, 48)

| Task | Req | O que fazer | Teste |
| --- | --- | --- | --- |
| A1 | 46, 48 | `lib/capital.ts`: papel "Conquista de Relatoria Relevante"; `papelNorm()` leva "Relatoria" antigo ao rótulo novo; `MOVIMENTOS` + "Articular com a Presidência da Casa". `Comissoes.tsx` usa `papelNorm` ao importar o papel da Missão 3. | `tests/capital.test.ts`, `e2e/capital-comissoes.spec.ts` |
| A2 | 47 | `lib/capital.ts`: `lerMovimentos`, `alternaMovimento` (máx. 4), `defineDataMovimento`, `textoMovimentos`. `CartaoComissao.tsx`: nova pergunta com data por movimento e ordem por data. | `tests/capital.test.ts`, `e2e/capital-comissoes.spec.ts` |

## Grupo B · Ações (SUG-49, 52, 53)

| Task | Req | O que fazer | Teste |
| --- | --- | --- | --- |
| B1 | 52 | `lib/capital.ts`: `modoDaAcao`, `acaoCompleta` por modo. `LinhaAcao.tsx`: as duas opções (resumo × registro completo). `public/legacy/m4.js`: Resumo mostra o resumo. | `tests/capital.test.ts`, `e2e/capital-acoes.spec.ts` |
| B2 | 53 | `LinhaAcao.tsx`/`Matriz.tsx`: lista de metas (`D.metas`) e `metaId`. Resumo mostra a meta. | `e2e/capital-acoes.spec.ts` |
| B3 | 49 | `Matriz.tsx`: campo "Outra ação (escrever)" em cada frente. | `e2e/capital-acoes.spec.ts` |

## Grupo C · Comunicação (SUG-50, 51)

| Task | Req | O que fazer | Teste |
| --- | --- | --- | --- |
| C1 | 51 | `lib/comunicacao.ts`: `datas` e `meses` opcionais em `Comunicacao`; `registra(..., data?)`, `registraMes`, `rotuloUltimoRegistro`. | `tests/comunicacao.test.ts` |
| C2 | 50, 51 | `SecaoComunicacao.tsx`/`Comunicacao.tsx`: os dois botões, data/mês, cabeçalho com a data certa, gráfico mensal; `m4.js` (Resumo). Atualizar seletores dos e2e antigos. | `e2e/capital-comunicacao.spec.ts`, `e2e/capital-clipping.spec.ts` |

## Fechamento

| Task | O que fazer |
| --- | --- |
| Z1 | `npm test`, `npx tsc --noEmit`, e2e `capital-*`; `STATE.md` (handoff); `graphify update .`. |

Ordem: A1 → A2 → B1 → B2 → B3 → C1 → C2 → Z1.
