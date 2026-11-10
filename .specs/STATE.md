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

## Handoff

- **Feature**: `primeiro-acesso-google` (`.specs/features/primeiro-acesso-google/`)
- **Branch**: `feat/primeiro-acesso-google`
- **Phase / Task**: Fase 6 (correções do Verifier, rodada 1) concluída; T1 a T19 commitadas. Última task: T19 (Analytics com todas as categorias, este registro). T17 `d0080a5` (perfil antes do consentimento no aceite e perfil em `membros_criar`, editando a migration `20261109120000_perfis.sql`, ainda não aplicada), T18 `3055bdc` (caixa "Não foi possível carregar seus dados. Tente de novo." no Guia). Verifier rodada 1: FAIL em `validation.md` (GAP-1, GAP-2, SP-1 a SP-3), todos tratados em T17 a T19.
- **Gate**: `npx tsc --noEmit` sem erro; `npm test` 1107/1107; e2e `convite-*`, `mandato-*`, `guia-acesso*`, `primeiro-acesso*` e `admin-*` no servidor próprio da porta 3100: 345/347 na rodada completa; as 2 falhas (tempo esgotado em `admin-equipe.spec.ts:245` e `admin-transversal.spec.ts:139`, telas fora desta feature) passaram na nova rodada desses dois specs (33/33).
- **In-progress**: nenhum
- **Next step**: re-verificação independente, rodada 2 (author != verifier), sobre o intervalo `2bbd33d..HEAD` (T17 a T19) e os critérios PAG-02, PAG-04 e PAG-06, regravando `.specs/features/primeiro-acesso-google/validation.md`; depois `validate_state.py primeiro-acesso-google`. Push, migrations e deploy só com go-ahead explícito.
- **Blockers**: nenhum
- **Nota sobre AD-013**: a linha "Categoria sem ninguém não aparece" foi substituída pela spec (Assumptions "Categorias sem ninguém no Analytics" e "Porcentagem no Analytics"): desde a T19 toda categoria aparece, mesmo com 0, e a soma das porcentagens pode dar 99 ou 101.
- **Uncommitted files**: só arquivos de outras frentes (`plataforma/ilhas/`, `plataforma/public/data/`, `plataforma/public/legacy/ilhas.css`, `graphify-out/`, `.pw-out-tmp/`, `AJUSTES_GUIA_100_DIAS.md`, `supabase/` na raiz)

**Pendências abertas de `primeiro-acesso-google`:**

1. Revisão jurídica do texto do consentimento de dados sensíveis (versão `2026-11`) antes de produção.
2. Conferir no banco, só leitura e com go-ahead do usuário, que não há contas com senha (o login por senha foi removido da tela, mas contas antigas podem existir).
3. `/painel` (`public/painel.html`) ainda tem login próprio (Google e e-mail); fora desta feature.
4. Incluir `<domínio>/primeiro-acesso` e `<domínio>/convite` nas Redirect URLs do Supabase (ação manual; sem isso o retorno do Google cai na raiz).
5. A sessão do primeiro acesso fica em `sessionStorage`: se a pessoa trocar de aba durante o perfil, o token do convite se perde e ela abre o link de novo.
6. Tela de lista e exportação de perfis estão fora do escopo (o Analytics mostra só agregados).
7. Resolvido na T18: a falha na consulta de perfil no Guia mostra a caixa "Não foi possível carregar seus dados. Tente de novo." com "Tentar de novo". O texto da caixa e as decisões da rodada 1 ainda não confirmadas na spec (categorias com 0 no Analytics, arredondamento por categoria) esperam confirmação do dono do produto.
8. O override do Guia só vale com a nuvem ligada; o modo local não muda.
9. As 2 migrations novas desta feature, `20261109120000_perfis.sql` e `20261109130000_perfil_resumo.sql`, só são aplicadas em produção quando a `main` receber push (workflow `migrations.yml`); isso exige go-ahead explícito do usuário.
10. As 6 decisões de execução dos workers (AD-013) esperam confirmação do dono do produto.

**Pendências da feature anterior `acesso-equipe-convites` (branch `feat/acesso-convites`, ainda abertas):**

1. Conferir "Confirmar e-mail" no Supabase (Authentication, Providers, Email). Ligado: quem é de fora pode não receber a confirmação (e-mail embutido) e o convite guardado no `sessionStorage` só vale na mesma aba; em outra aba ou aparelho a pessoa abre o link de novo.
2. Incluir `<domínio>/convite` nas Redirect URLs do Supabase (sem isso o retorno do Google cai na raiz e é repassado).
3. Depois do primeiro uso em produção, conferir se o `x-forwarded-for` chega à função do banco e qual IP é confiável: o primeiro costuma ser controlado pelo cliente, e trocar o cabeçalho contorna o limite de tentativas.
4. Aplicar `20261106120000_convites_equipe.sql`, `20261106130000_papeis_blindagem.sql`, `20261106140000_convites_autoridade.sql` e `20261106150000_convites_de_quem_sai.sql`, nessa ordem, só ao subir para a `main`, com go-ahead explícito.
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
