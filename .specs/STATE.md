# Project State

## Decisions

### AD-001: A landing vive em `/` e o Guia passa a `/guia` (2026-10-23)

- A landing é a raiz do app Next.js (`plataforma/app/page.tsx`); o Guia legado move para `plataforma/app/guia/page.tsx`.
- O CSS legado (`legacy.css`, `ilhas.css`) sai do `app/layout.tsx` raiz e passa a ser carregado só pelo layout do `/guia`, para não vazar para a landing.
- O retorno do login Google (Supabase) usa `location.origin + location.pathname`, então passa a voltar em `/guia`. Se `/guia` não estiver na lista de redirecionamento do Supabase, o retorno cai na raiz com `#access_token`: a landing repassa o hash para `/guia`.
- Ação manual fora do código: incluir `<domínio>/guia` nas Redirect URLs do Supabase.

### AD-002: Demonstração usa os dados do TSE já publicados em `public/data` (2026-10-23)

- A busca roda no navegador sobre `eleitos.json` (1.621 eleitos) e `pleitos/{uf}.json`. Só a foto vem direto do site do TSE em tempo real.
- Os dados são atualizados por `npm run dados` e `scripts/build_eleitos.py`, não a cada visita.

### AD-003: Ganchos novos do legado entram só em arquivos escritos à mão (2026-10-23)

- `conteudo.js`, `guia.js`, `nucleo.js`, `app.js` e `resumo.js` são extraídos de `contexto inicial/index (6).html` por `scripts/extrair_legado.py` e sobrescritos a cada extração. Mudança nova no comportamento do Guia (textos de exercício, `Comp.funcoes`, contadores) é feita por override em arquivo escrito à mão: `public/legacy/novos.js` (padrão em `novos.js:387`) ou `public/legacy/m2.js` (Missão 2, carregado depois de `novos.js`).
- Motivo: `guia.js` já tem edições diretas não commitadas que a próxima extração apagaria.

### AD-004: Regra de negócio das ilhas vive em `lib/` como função pura (2026-10-23)

- Cada regra (cadeiras, rotinas, layout, exportação) é função pura sobre `D.campos` que devolve um patch ou um valor; a ilha só chama e grava pela ponte.
- Testes: `node --test "tests/**/*.test.ts"` (`npm test`). Telas: Playwright (`npm run test:e2e`).
- Imports em `lib/` e `tests/` são relativos e terminam em `.ts` (o `@/` não resolve no runner do Node).

### AD-005: Planejamentos arquivados ficam em `D.planos`, o ativo continua nos campos de hoje (2026-10-27)

- Criar novo planejamento guarda uma cópia congelada do atual em `D.planos[]` (`{n, criadoEm, legado, bandeiras, objetivos, metas}`) e deixa em `D.metas` só as metas escolhidas, sem sucessos e com status "não concluída". Legado, bandeiras, objetivos e preditores seguem nos campos de sempre (`D.rumo`, `D.campos`, `D.preditores`).
- Motivo: Painel, Resumo e monitoramento leem os mesmos campos e não precisam mudar. Os arquivados são somente leitura (`lib/ciclos.ts`: `arquivarEIniciar`, `listaCiclos`, `abrirCiclo`); a tela de arquivados nunca escreve no ativo.
- Ganchos do botão (tarefa "Calibragem e replanejamento" e aba Planejamento) ficam em `public/legacy/m5.js`. Na aba, a ilha entra antes da única chamada de `Ilhas.ligar` do original: religar duas vezes quebra as raízes React.

## Handoff

Feature `missao5-avanco` concluída: T1 a T18 implementadas (sucessos mensais, monitoramento com link, feedback pelo organograma, novos planejamentos com arquivados somente leitura); 339 testes unitários e 319 e2e passando. `npm run build` falha só por `SecurityFatalError` do Next 16.4 (advisory conhecido). Pendente: validação (verifier) da feature, `git push` e deploy aguardam go-ahead. Arquivos do usuário seguem não commitados (`Equipe.tsx`, `Organograma.tsx`, `types.ts`, `novos.js`, `guia.js`, `cadastro.js`, entre outros).

Feature `missao4-capital-politico`: T1 a T25 implementadas; Verifier rodada 1 em 2026-10-27 deu FAIL (sem defeito de produção): 2 mutantes sobreviventes em CAP-32, tasks F1 (testar o limite de 10 buscas ligado em `route.ts`) e F2 (testar o cabeçalho `Authorization` do cliente) em `validation.md`; lacunas de precisão G1 a G7 pendentes na spec. 366 unit e 374 e2e passando, `tsc` ok, build ok na 2ª execução (`SecurityFatalError` na 1ª). Falta: F1, F2, rodada 2 do Verifier, T26 e `validate_state.py` com exit 0. `git push` e deploy aguardam go-ahead.
