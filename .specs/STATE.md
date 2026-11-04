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

### AD-006: Tabela de equipe e organograma gerado sobre o modelo de cadeiras; liderança derivada e gravada (2026-11-03)

- A Missão 2 troca as 3 etapas da escalação por uma tabela de equipe em ordem travada (escopo, competências, cargo, pessoa, categoria, área) e o organograma passa a ser gerado dela (`lib/tabelaEquipe.ts`, `lib/layoutOrg.ts`). O modelo de cadeiras (`m2.on`, `m2.f{n}`, `m2.p{n}.*`) continua sendo a fonte; a tela é nova, o dado não.
- A liderança direta é derivada pela regra D8 (Chefia sem líder; Coordenação liderada pela Chefia; Especialista e Executora, pela Coordenação da área, ou pela Chefia se não houver) e **gravada** em `m2.p{n}.lider`. Motivo: o Feedback da Missão 5 (`lib/feedback.ts`), o Resumo e o painel da Legisla já leem `liderDe`; gravar evita mudar quem lê.
- Todo dado novo fica em `D.campos` (`m2.n`, `m2.p{n}.esc/comp/cat`, `m2.rq`, `m3.est`, `m3.just.{pid}`); nenhuma chave nova de topo em `D`, e nada do modelo antigo é apagado (perfil, repertório, ritmo, `m2.rotoff`, `m2.x` ficam guardados sem aparecer).
- A estratégia A/B/C só define o texto do nó do preditor; a árvore do planejamento e as metas da Missão 3 não mudam. Mandato com `m3.obj.*` abre na estratégia B.
- As telas antigas (escalação, painel da cadeira, rotinas por cadeia, entrega) saíram de `ilhas/equipe/`; a sugestão do checklist (`m2.c1..c3`) ficou na ilha `m2-sugestao-checklist`.

## Handoff

Feature `missao2-3-reestruturacao`: T1 a T29 implementadas (T27A criada no fechamento para a sugestão do checklist). 497 testes unitários; e2e completo na T27 com 391 passando (mais o spec `migracao` corrigido e relançado, 5 de 5); `m23-migracao` e `m5-feedback` 24 de 24; `npm run build` passou na T27. Pendente: Verifier da feature, artefatos de `graphify-out/` (ficam para o orquestrador), `git push` e deploy aguardam go-ahead. Arquivos do usuário seguem não commitados (`graphify-out/`, `contexto inicial/`, `.vscode/`, `Alterador/`).

Feature `missao5-avanco` concluída: T1 a T18 implementadas (sucessos mensais, monitoramento com link, feedback pelo organograma, novos planejamentos com arquivados somente leitura); 339 testes unitários e 319 e2e passando. `npm run build` falha só por `SecurityFatalError` do Next 16.4 (advisory conhecido). Pendente: validação (verifier) da feature, `git push` e deploy aguardam go-ahead. Arquivos do usuário seguem não commitados (`Equipe.tsx`, `Organograma.tsx`, `types.ts`, `novos.js`, `guia.js`, `cadastro.js`, entre outros).

Feature `missao4-capital-politico` concluída: T1 a T26. Rodada 1 do Verifier deu FAIL (2 mutantes em CAP-32); F1 (`84b5a69`, constante `LIMITE_BUSCAS_POR_HORA` testada) e F2 (`a449c89`, e2e do cabeçalho `Authorization`) fecharam as lacunas e a rodada 2 deu PASS (M2, M3 e E2 mortos; só M20 sobrevive, spec indefinida). 367 unit e 374 e2e passando, `tsc` ok; `validate_state.py` sai com 0. Observações não bloqueantes: lacunas de precisão da spec G1 a G7 (lições L-010 a L-013 seguem como candidatas no `lessons.py`). `git push` e deploy aguardam go-ahead.
