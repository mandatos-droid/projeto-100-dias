# Lançamento seguro: diagnóstico e plano

Data: 04/11/2026. Base: leitura do código (`plataforma/`), das 5 migrations e do `painel.html`, **confirmada no ambiente real** (Supabase pelo conector, Vercel pela CLI; ver seção 8). Itens que ainda dependem de conferência manual no painel: backups/PITR do Supabase, firewall da Vercel e SMTP.

## 1. O que já está bom

- RLS ligado em todas as tabelas, `anon` sem acesso, políticas `to authenticated`.
- Funções auxiliares em schema `private`; views com `security_invoker`; `search_path = ''` nas funções `security definer`.
- Nenhum `service_role` no código; só a chave pública.
- Rota do clipping exige login e confere se a pessoa é membro do mandato.
- Parâmetros de `/api/votos-mun` validados por regex.
- Sanitizador `rich()` com lista de tags permitidas; ampla suíte de testes (unitários e e2e).

## 2. Achados de segurança e privacidade

Gravidade: **P0** = resolver antes de divulgar; **P1** = primeiras semanas; **P2** = maturidade.

### P0

| # | Achado | Onde | Risco | Correção |
|---|---|---|---|---|
| S1 | **`permite_pesquisa` só vale na tela.** A política `mandatos_ler` deixa qualquer pessoa da equipe Legisla (inclusive papel `leitura`) ler `dados` de todos os mandatos pelo REST, com ou sem autorização. | `schema_inicial.sql` (`mandatos_ler`, `eventos_ler`, views) | Quebra da promessa de consentimento (LGPD art. 7º/8º). Dados de gabinetes parlamentares são sensíveis politicamente. | Separar o que a Legisla enxerga: view/RPC de agregados (contagens) para toda a equipe; `dados` e `eventos` só se `permite_pesquisa = true`. Tirar `eh_legisla()` do SELECT direto de `mandatos`. |
| S2 | **Qualquer membro edita qualquer coluna do mandato**, inclusive `codigo`, `criado_por` e `permite_pesquisa`. | `mandatos_editar` | Assessoria nova liga a autorização de leitura ou troca o dono sem a coordenação saber. | Trigger/RPC que limita colunas sensíveis à coordenação; `WITH CHECK` comparando `criado_por` com o valor antigo. |
| S3 | **Código de convite de 6 caracteres sem limite de tentativas, sem validade e sem rotação**; gerado com `Math.random()`. | `entrar_com_codigo`, `codigo()` em `nucleo.js` | Quem tem conta testa códigos até entrar num gabinete (≈ 32⁶ ≈ 1 bi, viável com script, ainda mais sem limite). Entra como membro e lê tudo. | Códigos aleatórios do servidor (`gen_random_bytes`), 10+ caracteres, validade e revogação, contador de tentativas por usuário, convite que precisa de aprovação da coordenação. |
| S4 | **Sugestões abertas a toda pessoa logada**, com nome, e-mail, mandato de origem e print (até 3 MB em texto). Decisão registrada na migration `leitura_aberta`. | `sugestoes_ler using (true)` | Vazamento de e-mail e de conteúdo entre gabinetes concorrentes. Um print pode mostrar dados de eleitor. O app abre para público externo e deixa de ser grupo fechado de testadores. | Voltar a leitura para a equipe Legisla (+ autor). Se quiser "mural público", expor uma view sem e-mail, sem print e sem mandato. |
| S5 | **Sem cabeçalhos de segurança.** `next.config.mjs` não define CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`. O Guia usa ~70 `innerHTML` e `dangerouslySetInnerHTML`. | `next.config.mjs`, `public/legacy/*.js` | Uma única falha de XSS rouba o token do `localStorage` (`legisla.tok`, com `refresh_token`) e dá acesso total à conta. Também é possível embutir o app em iframe (clickjacking). | Cabeçalhos no `next.config.mjs`; CSP começando em modo `Report-Only`; auditar os `innerHTML` que recebem texto de usuário. Médio prazo: sessão por cookie httpOnly (`@supabase/ssr`). |
| S6 | **"Dev" e "prod" apontam para o mesmo projeto Supabase** (`AMBIENTES.dev` e `prod` iguais). Quem roda `localhost` (ou testes e2e) grava no banco de produção. | `nucleo.js` | Dado de teste e testes destrutivos no banco real; migrations aplicam direto na produção a cada push na `main`. | Segundo projeto Supabase (staging) + branch de banco; workflow de migrations com etapa de revisão antes de produção. |
| S7 | **`/api/votos-mun` é pública e cara**: sem login, sem limite; cada chamada dispara até ~5.500 requisições ao TSE (16 em paralelo), com `maxDuration` de 120 s. Cache em `/tmp` não é compartilhado entre instâncias. | `app/api/votos-mun/route.ts` | Abuso derruba a conta da Vercel (custo de função) e pode fazer o TSE bloquear nosso IP, quebrando a ferramenta para todos. | Exigir login, limite por usuário **persistente** (tabela no Supabase ou Upstash/Vercel KV), cache compartilhado e, se possível, pré-gerar os dados em vez de consultar ao vivo. |
| S8 | **Segurança de conta não verificada**: cadastro aberto por e-mail e senha; configuração de confirmação de e-mail, tamanho mínimo da senha, proteção contra senha vazada, limite de tentativas e CAPTCHA estão **a conferir** no painel do Supabase. O front aceita qualquer senha. | `Store.criarConta` | Contas falsas, enchimento de banco e força bruta. | Confirmação de e-mail obrigatória, senha ≥ 10, "leaked password protection", CAPTCHA (Turnstile) no cadastro, SMTP próprio (o padrão do Supabase tem limite baixo). |

### P1

| # | Achado | Correção |
|---|---|---|
| S9 | Limitador do clipping vive na memória do servidor (serverless: reinicia e não é compartilhado). Na prática não limita. | Mesmo mecanismo persistente do S7. |
| S10 | `excluir_meus_dados` não apaga a conta (`auth.users`), nem as sugestões (com e-mail), e o consentimento some. Falta direito de **exportação** (portabilidade). | Fluxo "Excluir minha conta" completo (Edge Function com `service_role`), exportação em JSON/CSV, guardar prova do consentimento (hash/versão) em tabela de auditoria. |
| S11 | Consentimento com versão fixa (`'2026-10'`) e só pede na primeira vez; sem texto da política versionado nem Política de Privacidade/Termos linkados. | Tabela `termos_versoes`; reaceite quando a versão muda; páginas `/privacidade` e `/termos`; indicar encarregado (DPO) e canal do titular. |
| S12 | `sugestoes.imagem` guarda até 3 MB em texto, sem limite por usuário. | Limite de envios por hora, ou mover para Storage com bucket privado. |
| S13 | Sem trilha de auditoria: ninguém registra quem da equipe leu/alterou o quê. | Tabela `auditoria` (ator, ação, alvo, quando) alimentada por RPCs do painel. |
| S14 | Papel `coordenacao` pode sair (`membros_sair`) e deixar o mandato órfão; não há troca de papel nem remoção de membro. | RPCs `remover_membro`, `mudar_papel`, `transferir_coordenacao`; bloquear saída do último coordenador. |
| S15 | Next 16.4 com `SecurityFatalError` no build (registrado em `STATE.md` como "advisory conhecido"). | Atualizar o Next para a versão corrigida antes do lançamento; ligar Dependabot/`npm audit` no CI. |
| S16 | Chave `anon` repetida como fallback no código da rota de clipping. | Só variável de ambiente; sem fallback. (Não é segredo, mas evita divergência entre ambientes.) |

### P2

- Backups: confirmar plano do Supabase com **PITR**; testar restauração. A tabela `mandatos.dados` é um jsonb único por mandato (último a gravar vence; sem histórico): considerar versionamento ou controle otimista (`atualizado_em`) para evitar sobrescrita entre dois membros editando juntos.
- Monitoramento: Sentry (erros), alertas de uso do Supabase e da Vercel, página de status.
- MFA (TOTP) obrigatório para a equipe Legisla; para usuários, opcional.
- Pentest leve (OWASP ZAP) e revisão externa das políticas RLS antes de campanha grande.
- Dívida estrutural: o legado em JS global + HTML por string é a maior superfície de XSS; migrar telas para React reduz isso com o tempo.

## 3. Painel do administrador (Legisla)

Hoje `public/painel.html` é um arquivo estático feito à mão: só leitura, só contagens, sem gestão de equipe, sem auditoria. Proposta: rota autenticada `/admin` dentro do Next, no mesmo domínio, **servida só a quem está em `equipe_legisla`** (checagem no servidor, não só na tela).

**Papéis** (já existem no banco): `admin`, `analista`, `leitura`. Acrescentar o que cada um pode:

| Capacidade | leitura | analista | admin |
|---|---|---|---|
| Ver agregados (nº de mandatos, progresso por missão, por UF/cargo/partido) | sim | sim | sim |
| Ver conteúdo escrito de mandatos com `permite_pesquisa` | não | sim (registrado em auditoria) | sim (idem) |
| Tratar sugestões (resolver, comentar) | não | sim | sim |
| Gerir equipe Legisla (convidar, trocar papel, remover) | não | não | sim |
| Suporte a usuário: suspender conta, redefinir acesso, transferir coordenação | não | não | sim |
| Apagar dado/conta a pedido do titular (LGPD) | não | não | sim |
| Ver log de auditoria | não | não | sim |

**Telas (MVP em ordem):**
1. **Visão geral:** mandatos ativos, novos por semana, progresso por missão, funil de ativação (conta → mandato criado → Missão 1 → … → Missão 5), mandatos parados há 14+ dias.
2. **Mandatos:** lista com filtros (UF, cargo, partido, dia do mandato, `permite_pesquisa`), detalhe só com agregados; botão "ver conteúdo" só quando autorizado, com aviso de que a leitura é registrada.
3. **Usuários:** lista, situação (confirmou e-mail, último acesso, consentimento), ações de suporte.
4. **Sugestões:** caixa de entrada que já existe (com status, comentários, atribuição) e o vínculo com a entrega ("virou a tarefa X").
5. **Equipe Legisla:** convidar por e-mail, trocar papel, remover (hoje é SQL manual).
6. **Solicitações LGPD:** fila de pedidos (exportar, corrigir, excluir) com prazo (15 dias) e registro de atendimento.
7. **Auditoria:** quem acessou o quê, quando.

**Regras técnicas:** operações administrativas por RPC `security definer` no schema `private` (com checagem de papel e escrita em `auditoria`) e, onde precisar de `service_role`, **só no servidor** (Route Handler/Edge Function), nunca no navegador. A tabela `equipe_legisla` já bloqueia escrita a não-admin; falta o convite e a auditoria.

## 4. Regras de negócio a fechar (decisões do produto)

Cada item abaixo hoje é implícito ou inexistente. Precisam de decisão sua/da Legisla, depois viram spec.

1. **Quem pode se cadastrar?** Aberto a qualquer pessoa, ou só convidados/e-mail institucional? E o que acontece com a conta antes de entrar num mandato?
2. **Tipos de usuário:** parlamentar, assessoria, coordenação, Legisla. Quem é o "dono" do mandato? Pode haver mais de um coordenador? Pode o parlamentar ser membro?
3. **Entrada em mandato:** código livre (hoje) ou convite nominal aprovado pela coordenação? Validade do convite?
4. **Um mandato por pessoa ou vários?** Hoje uma pessoa pode estar em vários; o que isso significa para a Legisla (consultores que atendem vários gabinetes)?
5. **Consentimento:** o que exatamente `permite_pesquisa` autoriza (ler texto, usar em pesquisa, publicar de forma anônima)? Pode revogar? O que acontece com o que já foi lido?
6. **Retenção e exclusão:** por quanto tempo guardamos dados de mandato inativo? Quando o parlamentar perde a eleição ou o mandato acaba? Quem pode pedir exclusão do mandato inteiro?
7. **Dados de terceiros:** o mandato escreve nomes de aliados, concorrentes e assessores. A Legisla é controladora ou operadora desses dados? (Definir com assessoria jurídica e refletir na política de privacidade.)
8. **Conteúdo e propriedade:** o que o gabinete produz (planos, metas) é dele; a Legisla pode usar agregados anonimizados? Em quais condições?
9. **Modelo de oferta:** gratuito, gratuito com limite, pago? Existe limite de membros por mandato? Isso muda S7/S8 (anti-abuso) e a cobrança.
10. **Dados eleitorais públicos (TSE):** confirmar a base legal e o uso permitido; o aviso de "API não oficial" precisa constar nos termos e ter plano B.
11. **Fim do ciclo de 100 dias:** o que acontece depois do dia 100? Somente leitura, arquivamento ou continuidade (já existe "novo planejamento" na Missão 5)?
12. **Suporte e SLA:** canal, horário, tempo de resposta, política de incidente (e comunicação à ANPD em até 3 dias úteis se houver vazamento relevante).

## 5. Jornada do usuário

**Estado atual (resumo do que existe):** landing → CTA para `/guia` → login (Google ou e-mail/senha) → aceite LGPD → cria mandato ou entra por código → Missões 1 a 5 (campos salvos em `mandatos.dados`) → Resumo/exportações.

**Lacunas a desenhar antes do lançamento:**

| Momento | O que falta |
|---|---|
| Descoberta | Páginas de Privacidade, Termos, contato do encarregado; texto claro de "o que a Legisla vê". |
| Cadastro | Confirmação de e-mail com tela de espera, recuperação de senha, mensagens de erro claras, proteção anti-bot. |
| Primeiro acesso | Onboarding guiado (escolher: criar mandato **ou** entrar com convite), explicação de papéis, aceite com texto versionado. |
| Uso | Aviso de conflito quando dois membros editam o mesmo mandato; indicador "salvo/não salvo"; modo offline claro (hoje cai em `localStorage` sem avisar). |
| Equipe | Convidar, remover, trocar papel, ver quem é coordenação. |
| Retorno | Lembretes (e-mail) por inatividade ou prazos; resumo semanal opcional. |
| Suporte | Botão de ajuda e canal fora do formulário de sugestões; status do sistema. |
| Saída | Exportar meus dados, excluir minha conta, excluir o mandato (com confirmação forte e prazo de arrependimento). |

## 6. Operação e entrega

- **Ambientes:** local → staging (Supabase novo + deploy de preview da Vercel) → produção. Variáveis de ambiente em vez de constantes no JS.
- **CI:** `tsc`, `npm test`, build e `npm audit` em cada PR; e2e em staging; migrations com revisão e *dry-run* antes de produção; proteção da branch `main`.
- **Observabilidade:** Sentry, logs da Vercel, alertas do Supabase (conexões, tamanho do banco, erros 5xx).
- **Runbook de incidente:** quem decide, como revogar sessões (`auth.admin.signOut`), como rotacionar chaves, modelo de comunicação aos titulares e à ANPD.
- **Acessibilidade e UX:** passar a skill de revisão de interface (WCAG) nas telas de login, cadastro e painel.
- **Higiene do repositório:** `contexto inicial/banco.sql` e `supabase/.temp/` não devem ir ao git; `.claude/worktrees` e `graphify-out/cache` poluem o histórico (o `CLAUDE.md` já trata o grafo como esperado, mas confira o `.gitignore`).

## 7. Roteiro sugerido

| Fase | Entrega | Itens |
|---|---|---|
| 0 (esta semana) | Fechar buracos do banco e dos segredos | S1, S2, S3, S4 (migrations novas), S17 (remover segredos não usados da Vercel), S8 (decidir e-mail/senha, senha vazada) |
| 1 | Perímetro | S5 (cabeçalhos), S7/S9 (limite persistente), S15 (Next), S6 (staging) |
| 2 | Admin MVP | Telas 1, 2, 4, 5 e auditoria (S13) |
| 3 | LGPD e jornada | S10, S11, telas 3, 6 e 7, onboarding, páginas legais |
| 4 | Operação | Backups/PITR testados, Sentry, runbook, pentest leve |

**Só publique para o público geral depois da Fase 0 e da Fase 1.** Pode seguir com o grupo fechado atual enquanto isso, desde que S1 e S4 estejam corrigidos (vazamento entre gabinetes).

## 8. Verificação no ambiente real (04/11/2026)

Feita pelo conector do Supabase (somente leitura: advisors e `select`) e pela CLI da Vercel. O conector da Vercel pediu autorização do escopo `legisla` (`authorize_team_access`), então usei a CLI. Nada foi alterado no banco nem na Vercel.

### Supabase (projeto `fldmekrexvzchynnmeuq`, sa-east-1, Postgres 17, saudável)

| Item | Resultado | Efeito no diagnóstico |
|---|---|---|
| Escala hoje | 11 usuários, 11 mandatos, 11 membros, 26 eventos, 51 sugestões, banco com 16 MB. Todos entraram nos últimos 30 dias. Domínios: gmail.com, legislabrasil.org, unesp.br. | É um grupo pequeno e ativo: dá para corrigir sem migração pesada. |
| `permite_pesquisa` | **0 de 11 mandatos autorizaram**; a política `mandatos_ler` ainda libera tudo à equipe Legisla. | **S1 confirmado** na política publicada. Hoje só 1 pessoa está na equipe (papel `admin`), então o risco é de design, não de uso indevido. |
| Sugestões | 51 linhas, **todas com e-mail** e 50 com print; `sugestoes_ler` é `using (true)`. | **S4 confirmado e ativo**: os 11 usuários veem 51 e-mails e 50 prints. |
| Códigos de convite | Todos com 6 caracteres. Um usuário já está em 4 mandatos. | **S3 confirmado**. |
| RLS | Ligado nas 7 tabelas; 6 views existem; `anon` sem permissão (testei com a chave pública: 401/42501 em `mandatos`, `membros`, `sugestoes`, `equipe_legisla` e `v_panorama`). | Ponto forte confirmado: visitante anônimo não lê nada. |
| Advisor de segurança | (1) as 3 funções `security definer` de `public` (`entrar_com_codigo`, `excluir_mandato`, `excluir_meus_dados`) são chamáveis por qualquer logado via `/rest/v1/rpc/`; (2) **proteção contra senha vazada desligada**. | (1) é intencional, mas reforça S3: a função precisa de limite de tentativas. (2) entra em S8. |
| Advisor de desempenho | Sem urgência: 2 chaves estrangeiras sem índice (`eventos.user_id`, `sugestoes_comentarios.user_id`), 1 índice sem uso, 2 políticas permissivas em `equipe_legisla`, Auth limitado a 10 conexões absolutas. | P2. |
| Auth (configuração pública) | Cadastro **aberto** (`disable_signup: false`), provedor e-mail ligado, Google ligado, **confirmação de e-mail exigida** (`mailer_autoconfirm: false`), login anônimo desligado. Hoje **todos os 11 usuários vieram do Google**; ninguém usou e-mail/senha. | S8 melhora: a confirmação já está certa. Se o app quiser só Google, **desligue e-mail/senha** e reduza a superfície. Se mantiver, ligue a proteção contra senha vazada. |
| Extensões, Storage, Realtime | Sem `pg_cron`, sem buckets, sem tabelas no Realtime. | Nada a corrigir; sem uploads fora do banco. |
| Migrations | As 5 do repositório estão aplicadas, sem divergência. | OK. |

### Vercel (projeto `legisla/projeto-100-dias`, raiz `plataforma`)

| Item | Resultado | Efeito |
|---|---|---|
| Endereço real | `projeto-100-dias-delta.vercel.app` (e `-legisla.vercel.app`). Atenção: `projeto-100-dias.vercel.app` **não é nosso** (é outro projeto/dono). | Use o endereço certo em testes e links; ideal é um domínio próprio. |
| Variáveis de ambiente | Só no ambiente **Production**. Existem `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWT_SECRET` e várias `POSTGRES_*` (senha do banco), vindas da integração. **O código não usa nenhuma delas** (só `SUPABASE_URL` e `SUPABASE_ANON_KEY`, e mesmo essas têm fallback no código). | **Novo achado S17 (P0):** segredos poderosos expostos ao runtime sem necessidade. Qualquer falha de execução remota ou log vazado entrega o banco inteiro, ignorando o RLS. Remover as não usadas. |
| Ambientes | 7 deploys de **produção** nas últimas 24 h, todos feitos pela CLI a partir da sua máquina (inclui alterações sem commit). Não há deploy de preview nem staging. | Reforça S6: qualquer teste vai direto ao ar. Passar a publicar pelo `git push` com *preview* e promover. |
| Cabeçalhos HTTP | Só `Strict-Transport-Security` (bom). **Ausentes:** `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. | **S5 confirmado.** |
| `/api/votos-mun` | Respondeu **200 sem login** em produção. | **S7 confirmado na prática.** Ver aviso abaixo. |
| `/api/clipping` | Sem token responde "Faça login para buscar notícias." | Correto. |
| `/painel` | Página estática pública (a autenticação é feita dentro dela). | Aceitável se o conteúdo vier só do Supabase com RLS; mover para rota protegida no `/admin` novo. |
| Firewall, Web Analytics, alertas de uso | Não consegui ler (exige o escopo do conector). | A conferir no painel da Vercel: ligar o WAF/limite de taxa nas rotas `/api/*`. |
| Backups/PITR do Supabase | O conector não expõe o plano nem o PITR. | A conferir em Database → Backups. |

### Novos itens e ajustes

- **S17 (P0): remover da Vercel** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWT_SECRET` e as `POSTGRES_*`, depois de confirmar que nada as usa. Quando o painel `/admin` precisar de `service_role`, recriar só para esse caso e só no servidor.
- **S8 reduzido:** confirmação de e-mail já está ligada. Resta decidir se e-mail/senha continua existindo, ligar a proteção contra senha vazada, CAPTCHA e SMTP próprio.
- **Dado de teste:** 6 dos 11 mandatos não têm data de posse; confirme se são testes reais antes de qualquer limpeza.

### Aviso sobre o teste que fiz

Para confirmar o S7 chamei `/api/votos-mun` uma vez em produção, com um `sq` inválido de mentira. A rota aceitou e executou uma coleta completa em São Paulo (cerca de 645 municípios, 16 em paralelo) contra o TSE; o resultado foi gravado no cache temporário e expira em 30 minutos. O custo é uma execução de função e um volume pequeno de requisições ao TSE, mas mostra por que a rota precisa de login e limite. Também fiz um `GET` simples em `projeto-100-dias.vercel.app` (domínio de terceiros), só para ver o status das rotas, antes de descobrir que não era o nosso.
