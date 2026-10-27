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

## T20: RSS do Google Notícias

**Medido em 2026-10-27**, com `curl` (sem cabeçalho especial e também com `User-Agent` de navegador), contra
`https://news.google.com/rss/search?q="Tabata Amaral"+when:7d&hl=pt-BR&gl=BR&ceid=BR:pt-419` (nome real de parlamentar conhecida, entre aspas e com `when:7d`).

| Item | Resultado |
| --- | --- |
| Status | 200, `application/xml; charset=utf-8`, sem bloqueio, captcha ou redirecionamento |
| Itens | 22 `<item>` na janela de 7 dias |
| Campos por item | `title` (termina em ` - VEÍCULO`), `link` (URL `news.google.com/rss/articles/...?oc=5`, redireciona ao veículo), `guid`, `pubDate` (RFC 822, GMT), `description` (HTML com link e veículo), `source` (nome do veículo e `url` do site) |
| Codificação | UTF-8 (o `curl` no console mostrou `?` só por causa do terminal) |
| Aviso do feed | O `<copyright>` diz que o feed é para leitor pessoal, uso não comercial. Fica registrado como risco de termos de uso; a rota guarda só metadados e fica atrás de `buscaNoticias()`, o que permite trocar a fonte. |

**Decisão da T20:** a fonte funciona e tem os 4 campos que a spec precisa (título, veículo, data, link). Fase 5 segue. O veículo vem de `<source>` (e do sufixo do título, a remover); o link é o do Google, não o da matéria final. Não medi limite de uso do Google; a rota limita a 10 buscas por hora por mandato.
