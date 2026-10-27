# Missão 4 · Validação

> Rascunho parcial. A fase final do Verifier (T26) sobrescreve este arquivo. Por ora só registra a medição da T9.

## T9: CORS da API da Câmara

**Medido em 2026-10-27**, com `curl` e um cabeçalho `Origin` de navegador (`https://exemplo.com`), contra
`https://dadosabertos.camara.leg.br/api/v2/orgaos?codTipoOrgao=2&itens=5`.

| Pedido | Status | `Access-Control-Allow-Origin` | Outros cabeçalhos de CORS |
| --- | --- | --- | --- |
| `GET` com `Origin` | 200 | `*` (presente) | `Access-Control-Expose-Headers: Link, X-Total-Count, X-Validation-Error`; `Vary: Origin, ...` |
| `OPTIONS` (preflight) com `Origin` e `Access-Control-Request-Method: GET` | 200 | `*` (presente) | `Access-Control-Allow-Methods: OPTIONS,GET,POST,HEAD` |

O corpo do `GET` veio com `x-total-count: 30` e as comissões no formato `{ dados: [{ sigla, nome, ... }] }`. As duas respostas trouxeram também `retry-after: 30`; não medi o que esse cabeçalho significa (limite de uso ou outro motivo).

**Limite da medição:** foi `curl`, não um `fetch` dentro de um navegador. O cabeçalho é o que o navegador consulta para liberar a leitura, mas não rodei a chamada num navegador real.

**Decisão da T9:** não adotar chamada ao vivo. `public/data/comissoes/br.json` (gerado por `scripts/build_comissoes.py`) continua como a fonte das comissões, como na spec (premissa "Fonte das comissões federais"). Nada no código mudou. Se um dia a chamada ao vivo valer a pena, o servidor da Câmara já devolve `Access-Control-Allow-Origin: *`; faltaria só um fallback ao arquivo e conferir o significado do `retry-after`.
