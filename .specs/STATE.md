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

### AD-007: Telas administrativas leem por views `v_admin_*` e escrevem por funções com auditoria (2026-11-05)

- Leitura da equipe Legisla: views `security_invoker` com `where private.eh_legisla()` e só as colunas necessárias (nunca `dados`, `eventos.texto`, `nome_civil`, `resp_telefone`). Escrita: funções `security definer` que checam `private.eh_legisla_admin()` e gravam `auditoria_admin` na mesma transação; sem `update` ou `delete` direto pelo navegador.
- Contas (filtros, status por mês, funil, travas) em funções puras de `plataforma/lib/admin/`, testadas com `node --test`; o SQL só entrega linhas mínimas.
- Motivo: o RLS atual deixa a equipe ler a linha inteira de `mandatos` e `eventos` por API; as views e funções são a barreira de privacidade e de auditoria enquanto isso não for endurecido (feature `painel-admin`).

### AD-008: Convite e equipe só por funções `security definer`; a falha que precisa persistir volta como dado (2026-11-06)

- `convites`, `convite_tentativas` e `convite_bloqueios` não têm grant para `anon` nem `authenticated`; `eventos_equipe` só tem `select`. Criar, listar, cancelar, prever e aceitar convite, e trocar papel, remover e sair, passam por funções `security definer` com `set search_path = ''` (`supabase/migrations/20261106120000_convites_equipe.sql`).
- Erro de regra vira `raise exception` com a mensagem da spec. Quando a tentativa precisa ficar gravada (token inválido, limite de tentativas), a função devolve `{ok:false, erro}` em vez de exceção, porque a exceção desfaria a gravação.
- Motivo: nenhuma tabela de convite fica exposta ao navegador, o e-mail da equipe só sai para membros do mandato e o limite de tentativas funciona.

### AD-009: Segredo de link vai no fragmento da URL (2026-11-06)

- O token do convite fica em `/convite#<token>`, nunca no caminho nem na query. Vale para todo segredo novo levado em link.
- O navegador não envia o fragmento ao servidor nem no `Referer`; `/convite` responde com `Referrer-Policy: no-referrer` e `X-Robots-Tag: noindex`.
- Motivo: caminho e query aparecem nos logs da Vercel e no `Referer` de sites externos.

### AD-010: Acesso ao mandato vem só de `membros.papel`; `mandatos.criado_por` não é credencial (2026-11-06)

- `criado_por` não muda pela API (gatilho `mandatos_trava_criador`). Ele só vale no cadastro: com o mandato ainda sem membros, quem criou lê o mandato (o `INSERT ... RETURNING`) e entra direto em `membros` como `coordenacao`. Depois disso, só por convite (`supabase/migrations/20261106130000_papeis_blindagem.sql`).
- Política ou função nova que decida acesso lê o papel atual (`private.papel_no_mandato`, `private.pode_editar`, `private.eh_membro`), nunca `criado_por`. `excluir_mandato` exige `coordenacao`.
- Motivo: o Verifier mostrou três caminhos pela API (sondas S-1 a S-3) em que `criado_por` subia o acesso ou sobrevivia à remoção.

## Handoff

- **Feature**: `acesso-equipe-convites` (`.specs/features/acesso-equipe-convites/`)
- **Phase / Task**: Fase 6 concluída; T1 a T37 implementadas e commitadas. Verifier 1 deu FAIL (`validation.md`); a correção 1 de 3 fechou as três falhas altas (sondas S-1 a S-3, ACE-03.2, 03.5, 03.6) na migration `20261106130000_papeis_blindagem.sql` (commits `336ae11`, `cb6f20d`, `fb8dd0e`) e a menor T15/E08 no teste do Guia (`f25911d`). T12 ficou como está (equivalente).
- **Completed**: T1 a T37; correções 1 a 4 do `validation.md`
- **In-progress**: nenhum
- **Next step**: rodar o Verifier de novo (iteração 2 de 3); depois, com go-ahead explícito, `git push`, migrations e deploy
- **Blockers**: nenhum desta feature. Fora dela, 8 e2e do Guia já falhavam antes da fase 6 e falham igual com `acesso.js` vazio (`capital-acoes` 4, `rumo-painel` 3, `m1-etapas` 1)
- **Uncommitted files**: só de outras frentes (`.pw-out-tmp/`, `AJUSTES_GUIA_100_DIAS.md`, `supabase/` na raiz, `graphify-out/`, `contexto inicial/`)
- **Branch**: `feat/acesso-convites`

**Pendências manuais (dependem do dono do projeto):**

1. Conferir "Confirmar e-mail" no Supabase (Authentication, Providers, Email). Ligado: quem é de fora pode não receber a confirmação (e-mail embutido) e o convite guardado no `sessionStorage` só vale na mesma aba; em outra aba ou aparelho a pessoa abre o link de novo.
2. Incluir `<domínio>/convite` nas Redirect URLs do Supabase (sem isso o retorno do Google cai na raiz e é repassado).
3. Depois do primeiro uso em produção, conferir se o `x-forwarded-for` chega à função do banco e qual IP é confiável: o primeiro costuma ser controlado pelo cliente, e trocar o cabeçalho contorna o limite de tentativas.
4. Aplicar `20261106120000_convites_equipe.sql` e `20261106130000_papeis_blindagem.sql`, nessa ordem, só ao subir para a `main`, com go-ahead explícito.
5. A tela de membros do `/admin` precisa aceitar o papel `leitura` (spec `painel-admin`).

**Acompanhamentos (fora do escopo desta feature):**

1. Segurança: `authenticated` tem privilégios padrão excessivos (TRUNCATE, UPDATE, DELETE, TRIGGER, REFERENCES) em `mandatos`, `membros` e `eventos`; `uso_funcionalidades` aceita insert de `leitura` (telemetria).
2. `excluir_meus_dados()` apaga a linha de membro sem checar coordenação e pode deixar o mandato sem coordenação.
3. `convite_tentativas` e `convite_bloqueios` nunca são limpas (IPs se acumulam).
4. O limite de 20 convites pendentes não trava a contagem: duas criações simultâneas podem chegar a 21.
5. Não há botão "Sair do mandato" na UI (`membro_sair` no banco, `saiDoMandato` em `lib/convites/api.ts`); decidir onde entra.
6. Textos sem definição exata na spec, para revisão do dono do produto: mensagens do GoTrue, "expira em N dias" (arredonda para cima, mínimo 1 dia), "Data de posse não informada", textos dos 6 eventos, ator só pelo primeiro nome; no Guia, o cartão "Abrir Equipe e convites", o aviso do modo nuvem ("acessíveis a quem tiver o link de convite") e a mensagem de `Store.entrarPorCodigo`.
7. Modo somente leitura do Guia: campos das ilhas React ficam desabilitados (inclusive filtros), mas os botões das ilhas não são travados um a um; a gravação é barrada no `Store`.
8. `lib/legacyBody.ts` é gerado por `scripts/extrair_legado.py`: uma nova extração devolve "código de convite" ao aviso (o teste `legado-acesso` acusa).
9. Rodapé dos commits dos lotes 1, 2 e 4 usa "Claude Opus 5.5"; os demais, "Claude Sonnet 5.5".
