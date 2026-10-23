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

## Handoff

Nada em andamento. Feature `landing`: spec e tasks criadas, execução não iniciada.
