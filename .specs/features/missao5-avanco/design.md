# Missão 5 · Garanta o avanço — Design

Segue AD-003 (ganchos só em `m3.js`/novo `m5.js`, nunca em `conteudo.js`) e AD-004 (regra em `lib/` como função pura, testada com `node --test`).

## Dados (tudo em `D`, sem tabela nova)
| Dado | Onde | Forma |
|---|---|---|
| Sucessos mensais | `D.metas[i].sucessos` | `[{id, mes: 1..4, texto, status}]` |
| Conversas de feedback | `D.feedbacks[]` | `{id, lider, pessoa, data, destaques, ajustes, acao}` (antigo `pontos/encam` migra) |
| Planos arquivados | `D.planos[]` | `{n, criadoEm, legado, bandeiras, objetivos, metas}` (cópia congelada) |
| Plano ativo | `D.metas`, `D.rumo`… como hoje | nada que já lê esses campos muda |

Ideia-chave: o plano "ativo" continua nos mesmos campos de hoje. Criar novo plano = **arquivar uma cópia** em `D.planos[]` e limpar as metas. Assim Painel, Resumo e monitoramento não precisam mudar.

## Telas
1. **Meta (Missão 3)** — `CartaoMeta.tsx` ganha bloco "Sucessos mensais": botão "+ Adicionar sucesso", escolhe mês e escreve o texto.
2. **Planejamento** — `ArvorePlano.tsx` ganha o nível "sucessos" (por mês) com status; seletor de planejamento no topo + botão "Criar novo planejamento".
3. **Monitoramento** — textos iguais + botão "Abrir Planejamento Estratégico" (`#/plano`).
4. **Feedback** — nova ilha `rumo-feedback`, reaproveita `lib/cadeiras.ts` e o desenho de `equipe/Organograma.tsx`:
   - Nível 1: mapa com cartões "Nome · dá feedback a N · feitas X/N".
   - Nível 2: liderança aberta → lista de pessoas com ✔/pendente.
   - Nível 3: formulário da conversa (data, destaques, ajustes, plano de ação).
   - No celular: lista vertical em vez de árvore.
5. **Calibragem** — checklist atual + bloco final com o botão; abre confirmação ("Isso guarda o planejamento atual e abre um novo") com opção de copiar metas.

## Código novo (`plataforma/`)
- `lib/sucessos.ts` — normaliza, agrupa por mês, calcula atingimento.
- `lib/feedback.ts` — monta o mapa liderança → liderados, contagens, migra formato antigo.
- `lib/ciclos.ts` — `arquivarEIniciar(D, {copiarMetas})` e `abrirCiclo(n)`.
- `ilhas/rumo/Feedback.tsx`, `ilhas/rumo/NovoCiclo.tsx`, ajustes em `CartaoMeta.tsx`, `ArvorePlano.tsx`, `atingimento.ts`.
- `public/legacy/m5.js` — ganchos das 3 tarefas; registro em `ponte.tsx`.

## Riscos
- Árvore muda de forma: `atingimento.ts` precisa aceitar metas com e sem sucessos.
- Árvore de feedback depende da Missão 2 estar feita (tratado com aviso).
- Arquivos do usuário não commitados (`ponte.tsx`, `novos.js`): commits só com arquivos nomeados.
