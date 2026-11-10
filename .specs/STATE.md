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

### AD-011: O convite vale só com a autoridade atual de quem o criou (2026-11-06)

- Prévia e aceite exigem que quem criou o convite siga no mandato com papel igual ou maior que o do convite (`private.convite_autorizado`, lido de `membros` a cada chamada). Senão a resposta é a do token inválido (`{ok:false, erro:'invalido'}`, com a tentativa gravada), sem consumir o convite. `convites_pendentes` deixa de listar esse convite e `convite_criar` deixa de contá-lo no limite de 20 (`supabase/migrations/20261106140000_convites_autoridade.sql`).
- Trocar papel, remover e sair não cancelam convites: se a pessoa recuperar o papel antes do vencimento, o convite volta a valer.
- Efeito colateral: o convite de quem saiu do mandato (ou teve a conta apagada) deixa de valer, e o de quem foi rebaixado vale só até o novo papel. Decisão tomada pelo orquestrador com base no objetivo 3 da spec e na linha "Limite do papel concedido"; **a confirmar pelo dono do produto**. A alternativa mínima, se ele quiser manter esses convites, é recusar só o aceite pela própria pessoa que criou (`auth.uid() = convites.criado_por`); ela não fecha o caso de uma segunda conta da mesma pessoa.
- Motivo: sonda V-1 do Verifier (iteração 2). A coordenação rebaixada a `leitura`, ou removida, voltava como `coordenacao` aceitando um convite que tinha criado antes, e removia quem a rebaixou (ACE-02.16, ACE-03.12).
- **Status**: superado em parte pelo AD-012 (2026-11-09). O dono do produto confirmou a regra para rebaixamento, remoção e conta apagada; quem sai por conta própria passa a manter os convites.

### AD-012: Quem sai por conta própria mantém os convites até o papel que tinha ao sair (2026-11-09)

- `membro_sair` grava em `convites.papel_ao_sair` o papel da pessoa, em todos os convites dela naquele mandato; cada saída sobrescreve a anterior. Fora do mandato, o convite vale se esse papel é igual ou maior que o do convite (`private.convite_autorizado(mandato, criado_por, papel, papel_ao_sair)`), na prévia, no aceite, nos pendentes e no limite de 20 (`supabase/migrations/20261106150000_convites_de_quem_sai.sql`).
- A V-1 segue fechada. Quem é rebaixado e depois sai grava o papel menor. Remoção (pela coordenação ou pelo `/admin`) não grava nada. Conta apagada (`criado_por` nulo) e `excluir_meus_dados()` fazem o convite não valer. O gatilho `membros_reentrada` zera `papel_ao_sair` quando a pessoa entra de novo no mandato, por qualquer caminho, e daí vale o papel atual.
- Regra para código novo: caminho novo de saída voluntária grava `papel_ao_sair`; caminho novo de remoção não grava; entrada nova em `membros` já passa pelo gatilho.
- Motivo: decisão do usuário de 2026-11-09. A regra proposta sem a trava de conta apagada e sem o gatilho reabria a V-1 em dois casos, provados por sonda antes da implementação: sair e depois ter a conta apagada; sair, voltar por outro convite e ser removida.

### AD-013: Login só com Google, perfil de 7 campos e `/primeiro-acesso` como porta única (2026-11-09)

- Entrada só com Google no Guia, no `/convite` e no `/admin`. `Store.criarConta` e `Store.entrar` lançam `Error('Entre com o Google.')` sem chamada de rede; a renovação por `refresh_token` segue. O erro do Google é o literal de PAG-01.4 em todas as entradas.
- O perfil tem 7 campos e **não tem UF**: nome, nascimento, telefone, gênero, raça, atua na política e tempo de atuação (`public.perfis`, `lib/perfil/opcoes.ts`). Só `perfil_salvar` escreve (`security definer`, `user_id` da sessão); `authenticated` só lê o próprio perfil e a equipe Legisla lê todos. O resumo do Analytics não tem distribuição por UF.
- O consentimento de dados sensíveis é gravado na versão `2026-11`, na mesma transação do perfil: falhou um, desfaz o outro.
- `/primeiro-acesso` é a página única: perfil primeiro, depois a pergunta sobre a equipe (código ou convite). Quem não tem perfil é enviado para lá pelo Guia e pelo `/convite`.
- Trava no banco, não só na tela: `convite_aceitar` e `mandatos_criar` exigem `private.tem_perfil()` (perfil gravado ou linha em `equipe_legisla`). `excluir_meus_dados` apaga `perfis`.
- Analytics: seção "Perfil de quem usa a plataforma" lê só `public.admin_perfil_resumo()` (contagens, exige equipe Legisla); lógica pura em `lib/admin/perfil.ts`. Categoria sem ninguém não aparece e a porcentagem é inteira arredondada, então a soma das porcentagens pode não dar 100.
- Decisões de execução dos workers: (1) perfil sem UF; (2) nomes de erro do banco como dado (`{ok:false, erro:<campo>}`); (3) `p_nascimento` como texto, para data inexistente voltar como erro de campo e não como exceção; (4) a função de entrada por convite se chama `convite_aceitar`, não `aceitar_convite`; (5) ao fim do perfil a pessoa volta ao convite pelo token guardado em `sessionStorage`; (6) `?volta=convite` sem token guardado cai na pergunta da equipe.
- Motivo: decisão do usuário de 2026-11-09; o perfil agregado serve ao Analytics sem abrir dado individual.

### AD-014: Aba Usuários do `/admin` só de leitura, com dados sensíveis só no detalhe (2026-11-10)

- A aba é só leitura: nenhum botão altera dado e não há exportação. Mexer em membros continua nas telas de mandato.
- Gênero, raça, nascimento e telefone aparecem só no detalhe da pessoa. A função da lista não devolve esses campos.
- Último acesso é o último login (`auth.users.last_sign_in_at`), em Brasília; sem login, "Nunca". A renovação silenciosa da sessão não conta, então quem usa o Guia todo dia pode mostrar um acesso antigo.
- Leitura por duas funções do banco (`supabase/migrations/20261110120000_admin_usuarios.sql`): `public.admin_usuarios` (busca, filtros, total, ordem e limite no servidor) e `public.admin_usuario_detalhe` (`null` para id inexistente). As duas são `security definer`, `stable`, com `search_path` vazio, leem `equipe_legisla` a cada chamada (erro 42501 com "Você não tem permissão para esta ação.") e não têm execute para `anon`. A busca sem acento usa `private.sem_acento` (`translate`), porque o PGlite dos testes não tem `unaccent`.
- O estado da lista vive na URL (`q`, `papel`, `mandato`, `sem_perfil`, `pagina`). O detalhe recebe a consulta da lista em `de=` e o "← Voltar para Usuários" a relê e remonta: só busca, filtros e página válidos voltam.
- Decisões de execução do worker, para o dono do produto confirmar: (1) papel e mandato juntos acham quem tem aquele papel naquele mandato; (2) `p_papel` desconhecido não filtra; (3) a marca da equipe é "Equipe Legisla · admin" ou "Equipe Legisla · leitura"; (4) a opção padrão do filtro de mandato é "Todos os mandatos"; (5) id do detalhe que não é uuid mostra "Pessoa não encontrada." sem chamar o banco; (6) página além da última vai à última; (7) se as opções do filtro de mandato não carregam, o filtro fica só com "Todos os mandatos" e a lista segue; (8) a busca é enviada depois de 300 ms sem digitar; (9) no detalhe, quem não atua mostra tempo "—" e o consentimento mostra a data sem hora.
- Motivo: decisão do usuário de 2026-11-10 (lista com último acesso; "quero ver no detalhe sim" para os dados sensíveis).

### AD-R1: A tela nova sobrepõe `Telas.resumo`, não `Resumo.missao` (2026-11-10)

- `Resumo.missao` alimenta o Painel ("Ver o que foi preenchido") e o download; mexer nele violaria a regra de que nada fora da tela muda (RES-12). A tela monta os próprios blocos e chama `Resumo.ex` por exercício.
- Motivo: proteger Painel e download; um teste compara a saída com a de um `vm` sem `resumo-tela.js`.

### AD-R2: Arquivo novo `resumo-tela.js` em vez de editar `novos.js` (2026-11-10)

- `novos.js` já tem cerca de 500 linhas e várias responsabilidades; um arquivo por tela segue o padrão `m1.js` a `m5.js`. Custo: uma entrada em `SCRIPTS`, depois de `m1` e antes de `sugestoes`.
- Motivo: `app.js`, `resumo.js` e `legacy.css` são regenerados pela extração; o arquivo escrito à mão não é sobrescrito.

### AD-R3: Segmento ativo por `scroll` com `requestAnimationFrame` e `getBoundingClientRect` (2026-11-10)

- A regra da spec é "topo passou de 160 px"; `getBoundingClientRect` a implementa literalmente e dispensa simular `IntersectionObserver` nos testes.
- Motivo: regra simples, testável e sem dependência do navegador.

### AD-R4: Segmentos são `<button>`, não `<a href="#...">` (2026-11-10)

- O hash pertence ao roteador do Guia; o clique abre a missão e rola até ela sem mudar `location.hash`.
- Motivo: evitar que o roteador desenhe outra tela ao clicar no segmento.

### AD-R5: Abertura inicial derivada dos dados, sem `localStorage` (2026-11-10)

- Só o vazio vem fechado; "Expandir tudo" e "Recolher tudo" cobrem o resto. Nada de estado novo no navegador.
- Motivo: a regra de abertura resolve o caso comum e evita estado que diverge entre aparelhos.

### AD-R6: Número do retrato sem fonte é omitido, não vira "—" (2026-11-10)

- Sem TSE, partido, Casa, carga que falhou ou tabela vazia, o número some. Sem nenhuma fonte, só o cartão da parlamentar aparece.
- Execução (T5): deputado federal e senador leem as cadeiras da Casa inteira em `nacional.json`, não a bancada da UF; vereador fica sem o número.
- Motivo: "—" induz a achar que o dado é zero.

### AD-R7: Exercício "não iniciado" sem resposta visível vira caixa; com resposta visível abre (2026-11-10)

- Refinado após o T3: `temConteudo` não conta as caixas extras (como o próximo cargo da Persona, `m1-persona.spec.ts:29`), então `estadoEx` pode dar "nao" com resposta já visível; nesse caso o bloco abre com o corpo de `Resumo.ex`.
- Motivo: evitar oito "não preenchido" seguidos sem esconder o que já existe.

### AD-R8: `ResumoIlhas.lista`, `ResumoIlhas.html` e a saída de `frag` só mudam com `Resumo.vivo` (2026-11-10)

- O download e o Painel rodam sem `vivo` e seguem com a lista de texto e a lista de fragilidades de antes (RES-07.6, RES-12.1, RES-12.3).
- Execução (T8): "Potenciais" lê o status `potencial` de `D.relacoes`, que o Guia ainda não grava (só `aliado` e `concorrente`); o grupo aparece quando o dado existir. A sobreposição fica em `ResumoIlhas.html` para as perguntas de Casa e de município, que compõe os grupos e chama `ResumoIlhas.lista` por grupo.
- Motivo: a spec pede três grupos, mas o modelo de dados só tem dois status; decisão do dono do produto pendente (gravar `potencial` no Guia ou trocar a regra).

### AD-015: Área do mandato é uma tela única em `#/config`, com 4 abas dentro do Guia (2026-11-10)

- `#/config` do Guia vira a "Área do mandato" (item do menu no lugar de "Configurações"), com as abas Visão geral (`#/config`), Dados do mandato (`#/config/dados`), Equipe e convites (`#/config/equipe`) e Minha conta (`#/config/conta`). Aba desconhecida abre a Visão geral. O Guia roteia por hash; a casca com abas entra por override em `public/legacy/acesso.js` (`Telas.config`, `App.lateral`), sem editar os arquivos extraídos (AD-003).
- Visão geral, Equipe e Minha conta são ilhas React (`ilhas/AreaVisao.tsx`, `AreaEquipe.tsx`, `AreaConta.tsx`) que reaproveitam os componentes de `app/mandato/` (`CartaoMandato`, `ResumoEquipe`, `Atividade`, `equipe/*`). `ProvedorLegado` entrega o `useMandato()` a partir do estado do Guia (`Store.mandato`, `Store.membros`, `Store.usuario`, sessão `legisla.tok`), com a conversão pura em `lib/mandato/legado.ts` e a renovação de sessão no 401 em `app/mandato/sessaoApi.ts`. A aba Dados é o formulário legado `Cad.abrir('editar')` desenhado em `#areaDados`, com "Excluir cadastro" em bloco "Zona de risco" só para `coordenacao`. Nenhuma regra de papel mudou.
- `/mandato` e `/mandato/equipe` viram redirects permanentes em `next.config.mjs` (`/guia#/config`, `/guia#/config/equipe`); o primeiro acesso com `volta=mandato` abre `/guia#/config`. A volta do login Google perdia o hash (`Nuvem.google` usa `origin + pathname`): o override guarda o hash em `sessionStorage` e o restaura na volta.
- As páginas `/mandato`, a casca (`Casca.tsx`, `layout.tsx`) e `e2e/mandato-{area,casca,equipe,perfil}.spec.ts` saíram (T8); a cobertura migrou para `e2e/area-*.spec.ts` e `tests/mandato-sessao-api.test.ts`. O andamento dos 100 dias e as missões deixaram de existir fora do Painel do mandato do Guia; `lib/convites/{dias,missoes}.ts` e `catalogoExercicios` ficaram sem uso na tela, com os testes unitários.
- Motivo: pedido do usuário de 2026-11-10; gestão do mandato em três lugares (Configurações, `/mandato`, `/mandato/equipe`) levava a pessoa de um sistema a outro.

## Handoff

**Snapshot atual (`resumo-reestruturado`, 2026-11-10):**

- **Feature**: `resumo-reestruturado` (`.specs/features/resumo-reestruturado/`), tela `#/resumo` com blocos recolhíveis, retrato, cartões, tabela por território e organograma. Decisões AD-R1 a AD-R8.
- **Branch**: `feat/resumo-reestruturado`, no worktree `Dev Apps/Projeto 100 dias - resumo`, criado de `origin/main`. Nada foi enviado: sem push, deploy nem migration.
- **Phase / Task**: T1 a T17 concluídas, um commit por task. Verifier PASS na rodada 2 (`.specs/features/resumo-reestruturado/validation.md`); `validate_state.py` com 0 erros. Spec encerrada (Done).
- **Gate**: 11 e2e do gate de build já falham sem a feature (`m1-etapas:26`, `m23-migracao:110`, `m23-pdf:39`, `m23-plano:64/92/148`, `m23-rotinas:31/42`, `rumo-painel:19/32/54`); nenhuma falha nova aceita.
- **Pendência para o dono do produto**: o grupo "Potenciais" (RES-07) lê o status `potencial` de `D.relacoes`, que o Guia não grava hoje; sem esse dado o grupo nunca aparece.

- **Feature `area-do-mandato`** (`.specs/features/area-do-mandato/`): branch `feat/area-do-mandato`, worktree `Dev Apps/area-mandato-wt`. T1 a T9 commitadas; última task: T9 (este registro; T8 `afe257d` removeu o código antigo e migrou os testes). Gate da T8: `npx tsc --noEmit` limpo, `npm test` 1158/1158, e2e `area-*`, `convite-*`, `guia-acesso*`, `primeiro-acesso*` e `admin-*` 381/381 na porta 3100. **Próximo passo: Verifier independente** (autor diferente, spec-anchored, sensor de discriminação, até 3 rodadas), que escreve `validation.md`. Depois: apagar `plataforma/playwright.isolado.config.ts` (não versionado) e parar o servidor da porta 3100. Sem push, deploy ou banco sem "pode" específico do usuário.
- **Pendências de `area-do-mandato`** (fora do escopo, na spec): (1) editar o perfil pessoal na aba Minha conta (hoje só leitura; correção por contato@legislabrasil.org); (2) contador de convites pendentes no rótulo da aba Equipe (hoje só o total de pessoas); (3) seletor de mandato dentro da Área do mandato (hoje o seletor é o do Guia). Limpeza possível: `lib/convites/{dias,missoes}.ts` e `catalogoExercicios` sem uso na tela; CSS de `app/mandato/mandato.css` da casca e das missões (`.md-barra`, `.md-corpo`, `.md-seletor`, `.md-andamento`, `.md-missao*`) sem uso.
- **Blockers**: nenhum
- **Portas**: 3100 é de outra sessão (`area-mandato-wt`); usar 3117 no `playwright.isolado.config.ts` (não versionado, nunca commitar).
- **Uncommitted files**: `plataforma/playwright.isolado.config.ts` (nunca commitar) e `graphify-out/`.

- **Feature**: `admin-usuarios` (`.specs/features/admin-usuarios/`), aba Usuários do `/admin`, só leitura (AD-014)
- **Branch**: `feat/admin-usuarios`, no worktree `Dev Apps/admin-usuarios-wt`, criado de `origin/main`. Nada foi enviado: sem push, deploy nem migration remota.
- **Phase / Task**: T1 a T7 concluídas, um commit por task. Última task: T7 (este registro).
- **Gate (fim da T6)**: `npx tsc --noEmit` sem erro; `npm test` 1190/1190 (com cerca de 3 GB livres, `npm test` abortou duas vezes arquivos `sql-*` do PGlite com `Fatal process out of memory: Zone`; os arquivos passaram sozinhos e a suíte inteira passou com `node --test --test-concurrency=3 "tests/**/*.test.ts"`); e2e `admin-*` no servidor próprio da porta 3100: 192/192 (`admin-menu-guia` falhou uma vez por tempo sob carga e passou sozinho). Testes novos: 34 de SQL da lista, 18 de SQL do detalhe, 29 de unidade, 31 e2e da lista e 20 e2e do detalhe.
- **In-progress**: nenhum
- **Next step**: Verifier independente (spec-anchored check e sensor de mutantes) sobre `ff334b6..HEAD`, gravando `.specs/features/admin-usuarios/validation.md`. Depois, só com go-ahead explícito: push na `main` (aplica `20261110120000_admin_usuarios.sql` pelo workflow `migrations.yml`) e deploy.
- **Blockers**: nenhum
- **Uncommitted files**: `graphify-out/` (atualização do grafo)

**Pendências abertas de `admin-usuarios`:**

1. LGPD: registrar no histórico quem abriu o detalhe de uma pessoa (hoje a abertura não fica registrada).
2. Exportação da lista ou do detalhe segue fora do escopo; qualquer pedido novo passa pela revisão de LGPD.
3. Revisão jurídica do texto de consentimento de dados sensíveis (versão `2026-11`), herdada de `primeiro-acesso-google`.
4. A migration `20261110120000_admin_usuarios.sql` só vale em produção depois do push na `main`, com go-ahead explícito.
5. As 9 decisões de execução do worker (AD-014) esperam confirmação do dono do produto.
6. A busca usa `strpos` sem índice: revisar se as contas passarem de alguns milhares.

**Snapshot anterior (`primeiro-acesso-google`, branch `feat/primeiro-acesso-google`):** T1 a T21 commitadas, Verifier rodada 3 PASS. Release preparado no branch `deploy/primeiro-acesso`; falta o push na `main` e o deploy, só com go-ahead. Nota sobre AD-013: desde a T19 toda categoria do Analytics aparece, mesmo com 0, e a soma das porcentagens pode dar 99 ou 101.

**Release `deploy/primeiro-acesso` (2026-11-10):**

- Branch `deploy/primeiro-acesso`, no worktree `Dev Apps/primeiro-acesso-deploy`, sobre `origin/main` `7df7417` (painel-admin publicado). Leva `acesso-equipe-convites` e `primeiro-acesso-google`, reaplicados por cherry-pick de `1a97fe1..feat/primeiro-acesso-google`, mais a atualização do Next e este registro. Nada foi enviado: sem push, deploy nem migration remota.
- O merge `ac19a35` (`feat/painel-admin` em `feat/acesso-convites`) ficou de fora: foi limpo (`git show --remerge-diff` vazio) e o lado que ele trazia já está no `origin/main`. Os dois commits anteriores a ele, `3e33d47` e `e5bdaa9`, entraram. Juntos eles têm o mesmo conteúdo de `9057bcb` (sugestões 89 a 95, branch `fix/sugestoes-89-95`), então o release publica também a tabela de eleitos paginada, a caixa de informação sem corte, o fim da busca global e a Configurações unificada. A sugestão 91 (`dd84572`) não entra: está na base local do painel-admin, mas não no `origin/main`.
- Conflito único: `plataforma/public/legacy/ilhas.css` no `e5bdaa9`. Ficou o arquivo do `origin/main`, sem o bloco "Relação em três categorias" da sugestão 91, mais as duas regras `.ass .paginacao` do commit.
- Next de 16.4.0 para 16.4.6 (`chore(deps): update next to 16.4.6`): só o `next`, o `@next/env` e os `@next/swc-*` mudam no lockfile. `npm run build` passa na primeira tentativa, sem `SecurityFatalError`, e `npm audit` mostra 0 vulnerabilidades. **O advisory do Next 16.4 está resolvido**: o build volta a valer como gate, e as notas "advisory conhecido" dos `tasks.md` das features ficam históricas.
- Gates no estado final: `npx tsc --noEmit` sem erro; `npm test` 1109/1109 (em duas rodadas anteriores, arquivos `sql-*` do PGlite abortaram com `Fatal process out of memory: Zone` porque a máquina estava com pouca memória livre; os mesmos arquivos passam sozinhos e a rodada final passou inteira); `npm run build` ok; e2e `convite-*`, `mandato-*`, `guia-acesso*`, `primeiro-acesso*` e `admin-*` no servidor próprio da porta 3100: 349/349.
- Migrations que o push na `main` aplica (workflow `migrations.yml`), nenhuma ainda no remoto (`supabase migration list`): `20261106120000_convites_equipe.sql`, `20261106130000_papeis_blindagem.sql`, `20261106140000_convites_autoridade.sql`, `20261106150000_convites_de_quem_sai.sql`, `20261109120000_perfis.sql` e `20261109130000_perfil_resumo.sql`.

**Pendências abertas de `primeiro-acesso-google`:**

1. Revisão jurídica do texto do consentimento de dados sensíveis (versão `2026-11`) antes de produção.
2. Resolvido em 2026-11-10: o banco remoto foi consultado só para leitura e tem 12 contas, todas Google, nenhuma com senha.
3. `/painel` (`public/painel.html`) ainda tem login próprio (Google e e-mail); fora desta feature.
4. Resolvido em 2026-11-10: o usuário incluiu as Redirect URLs do Supabase (`<domínio>/primeiro-acesso` e `<domínio>/convite`).
5. A sessão do primeiro acesso fica em `sessionStorage`: se a pessoa trocar de aba durante o perfil, o token do convite se perde e ela abre o link de novo.
6. Tela de lista e exportação de perfis estão fora do escopo (o Analytics mostra só agregados).
7. Resolvido na T18: a falha na consulta de perfil no Guia mostra a caixa "Não foi possível carregar seus dados. Tente de novo." com "Tentar de novo". O texto da caixa e as decisões da rodada 1 ainda não confirmadas na spec (categorias com 0 no Analytics, arredondamento por categoria) esperam confirmação do dono do produto.
8. O override do Guia só vale com a nuvem ligada; o modo local não muda.
9. As 2 migrations novas desta feature, `20261109120000_perfis.sql` e `20261109130000_perfil_resumo.sql`, só são aplicadas em produção quando a `main` receber push (workflow `migrations.yml`); isso exige go-ahead explícito do usuário. Já estão no branch `deploy/primeiro-acesso`.
10. As 6 decisões de execução dos workers (AD-013) esperam confirmação do dono do produto.

**Pendências da feature anterior `acesso-equipe-convites` (branch `feat/acesso-convites`, ainda abertas):**

1. Conferir "Confirmar e-mail" no Supabase (Authentication, Providers, Email). Ligado: quem é de fora pode não receber a confirmação (e-mail embutido) e o convite guardado no `sessionStorage` só vale na mesma aba; em outra aba ou aparelho a pessoa abre o link de novo.
2. Resolvido em 2026-11-10: o usuário incluiu `<domínio>/convite` nas Redirect URLs do Supabase.
3. Depois do primeiro uso em produção, conferir se o `x-forwarded-for` chega à função do banco e qual IP é confiável: o primeiro costuma ser controlado pelo cliente, e trocar o cabeçalho contorna o limite de tentativas.
4. Aplicar `20261106120000_convites_equipe.sql`, `20261106130000_papeis_blindagem.sql`, `20261106140000_convites_autoridade.sql` e `20261106150000_convites_de_quem_sai.sql`, nessa ordem, só ao subir para a `main`, com go-ahead explícito. Já estão no branch `deploy/primeiro-acesso`.
5. A tela de membros do `/admin` precisa aceitar o papel `leitura` (spec `painel-admin`).
6. AD-011 confirmado com ajuste (AD-012): rebaixamento, remoção e conta apagada invalidam os convites; quem sai por conta própria os mantém até o papel que tinha ao sair.
7. Decidir os três efeitos do AD-012 que seguem abertos: (a) quem sai por conta própria pode voltar pelos próprios convites pendentes, com a própria conta ou com outra, até o papel que tinha ao sair, até vencerem (7 dias) ou serem cancelados; (b) a coordenação vê esses convites em "Convites pendentes" e pode cancelá-los; (c) se a pessoa sai enquanto a coordenação tenta removê-la, a remoção falha com "Pessoa não encontrada." e os convites seguem valendo até alguém cancelar.

**Acompanhamentos (fora do escopo desta feature):**

1. Segurança: `authenticated` tem privilégios padrão excessivos (TRUNCATE, UPDATE, DELETE, TRIGGER, REFERENCES) em `mandatos`, `membros` e `eventos`. O insert de `leitura` em `uso_funcionalidades` (telemetria) foi aceito pelo usuário em 2026-11-09 e fica como está.
2. `excluir_meus_dados()` apaga a linha de membro sem checar coordenação e pode deixar o mandato sem coordenação.
3. `convite_tentativas` e `convite_bloqueios` nunca são limpas (IPs se acumulam).
4. O limite de 20 convites pendentes não trava a contagem: duas criações simultâneas podem chegar a 21.
5. Resolvido em 2026-11-09: o botão "Sair do mandato" fica na tela Equipe e convites, para qualquer papel (`app/mandato/equipe/SairDoMandato.tsx`, ACE-04.14 a 04.18).
6. Textos sem definição exata na spec, para revisão do dono do produto: mensagens do GoTrue, "expira em N dias" (arredonda para cima, mínimo 1 dia), "Data de posse não informada", textos dos 6 eventos, ator só pelo primeiro nome; no Guia, o cartão "Abrir Equipe e convites", o aviso do modo nuvem ("acessíveis a quem tiver o link de convite") e a mensagem de `Store.entrarPorCodigo`; na saída do mandato, "Você pode sair deste mandato. A sua conta continua na plataforma." e "Sair de <mandato>? Você deixa de ver este mandato e, para voltar, precisa de um link de convite.".
7. Modo somente leitura do Guia: campos das ilhas React ficam desabilitados (inclusive filtros), mas os botões das ilhas não são travados um a um; a gravação é barrada no `Store`.
8. `lib/legacyBody.ts` é gerado por `scripts/extrair_legado.py`: uma nova extração devolve "código de convite" ao aviso (o teste `legado-acesso` acusa).
9. Rodapé dos commits dos lotes 1, 2 e 4 usa "Claude Opus 5.5"; os demais, "Claude Sonnet 5.5".
