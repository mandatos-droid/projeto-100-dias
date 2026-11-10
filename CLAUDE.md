## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.

## Deploy (Vercel)

- Projeto `projeto-100-dias` (time `legisla`), já vinculado em `.vercel/` na **raiz** do repositório. O app Next.js fica em `plataforma/`; o diretório do app vem da configuração do projeto na Vercel.
- Para publicar em produção, rode na **raiz** (nunca dentro de `plataforma/`): `vercel --prod --yes`
- Use a CLI pelo terminal (Bash/PowerShell). Não dependa do conector MCP da Vercel, que pede autorização separada.
- A CLI envia a pasta de trabalho, incluindo alterações sem commit. Confira `git status` antes se isso importar.
- Se der erro de login: `vercel whoami` (esperado: `pedrobrandine-5642`) e, se preciso, `vercel login`.
- Para conferir o resultado: `vercel inspect <url-do-deploy>` (status esperado: Ready).

### Regra de deploy (obrigatória, vale para toda sessão)

Em 2026-11-10 um deploy feito sem push no `main` fez a produção voltar a um dado já corrigido (505 em vez de 513 cadeiras). Para isso nunca mais acontecer:

1. **Antes do deploy**, rode `git fetch` e `git cherry origin/main <branch>`. Linhas com `+` são commits que ainda não estão no `main`; confira se algo publicado antes ou em outra branch seria sobrescrito.
2. **Termine todo deploy com push no `main`**: `git push origin deploy/<x>:main`. `vercel --prod` publica a pasta do worktree, não o `main`; sem o push, o próximo deploy apaga a correção.
3. Publique sempre de um worktree limpo, criado a partir de `origin/main` (nunca da pasta compartilhada) e trazendo só os commits da feature por cherry-pick. Como o cherry-pick muda o hash, use `git cherry` (compara por conteúdo), não `main..branch`.
