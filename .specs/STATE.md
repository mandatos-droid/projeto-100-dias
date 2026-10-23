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

## Handoff

Feature `landing` concluída e verificada (validation.md: PASS). Pendente fora do código: incluir `<domínio>/guia` nas Redirect URLs do Supabase; `git push` e deploy aguardam go-ahead.

Feature `missao2-equipe`: spec e design aprovados pelo usuário em 2026-10-23 (padrões das 4 perguntas aceitos); `tasks.md` aguarda aprovação. Execução não iniciada. Arquivos do usuário não commitados nos mesmos caminhos: `Equipe.tsx`, `ponte.tsx`, `novos.js`, `guia.js`, `Recomenda.tsx`, `recomenda.ts`, `bandeiras.ts`.
