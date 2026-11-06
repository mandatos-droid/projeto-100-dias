# Acesso, Equipe e Convites Design

**Spec**: `.specs/features/acesso-equipe-convites/spec.md`
**Status**: Draft

---

## Architecture Overview

Três rotas novas no app Next.js (`/convite`, `/mandato`, `/mandato/equipe`) conversam com o Supabase por `fetch`, com a chave pública e a sessão de `legisla.tok`, exatamente como o `/admin` (feature `painel-admin`). Toda leitura sensível e toda escrita de acesso passam por funções SQL `security definer`; o navegador nunca toca as tabelas de convite. O Guia legado continua dono do login, do cadastro de mandato e da edição dos dados; recebe só ajustes em arquivos escritos à mão.

```mermaid
graph TD
    L[Link /convite#token] --> C[/convite: página React]
    C -->|anon| P[convite_previa]
    C -->|sessão| A[convite_aceitar]
    C -->|Google| G[Supabase OAuth] --> C
    M[/mandato: Área do mandato] --> S[(membros, mandatos, exercicios_guia)]
    E[/mandato/equipe] --> F1[convite_criar / cancelar / pendentes]
    E --> F2[equipe_do_mandato / trocar_papel / remover / sair]
    F1 --> T[(convites)]
    F2 --> S
    F1 --> V[(eventos_equipe)]
    A --> T
    A --> S
    A --> V
    GU[Guia legado] -->|leitura: so-leitura| S
    GU -->|RLS pode_editar| S
```

### Abordagens consideradas

| Abordagem | Resumo | Veredito |
| --------- | ------ | -------- |
| **A (recomendada)** | Rotas Next.js novas + funções SQL `security definer`; sessão em `legisla.tok`; Guia só ganha ajustes pontuais | Mesmo padrão do `/admin`, sem risco para o Guia, testável em PGlite |
| B | Refazer Equipe e Área do mandato dentro do Guia (JavaScript legado) | Fica preso ao arquivo `cadastro.js` e ao HTML do Guia, sem testes de tela fáceis; descartada |
| C | Migrar tudo para sessão por cookie (`@supabase/ssr`) e rotas protegidas no servidor | Quebra Guia e `/admin`, que leem `legisla.tok`; fora de escopo da spec |

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
| --------- | -------- | ---------- |
| `lib/admin/config.ts`, `sessao.ts`, `api.ts` (config, sessão `legisla.tok`, renovação, `rest`/`rpc`, Google) | `plataforma/lib/admin/` | Reusar como estão; mover para `lib/supabase/` fica como tarefa de refatoração só se o import cruzado incomodar (ver Tech Decisions) |
| Funções `private.eh_membro`, `eh_legisla`, `eh_legisla_admin` | `supabase/migrations/20261016120000_schema_inicial.sql:96-116` | Base das novas `private.papel_no_mandato` e `private.pode_editar` |
| Molde de função `security definer`, `set search_path = ''`, `revoke ... from public, anon` | `supabase/migrations/20261020130000_excluir_mandato.sql` | Todas as funções novas |
| Ambiente PGlite com migrations reais e troca de identidade | `plataforma/tests/sql-ambiente.ts` | Testes de SQL desta feature (`tests/sql-convites*.test.ts`) |
| Catálogo `exercicios_guia` (16 exercícios) | `supabase/migrations/20261105130000_admin_leitura.sql:17` | Status das missões na Área do mandato, sem duplicar o catálogo |
| `Store.abrir` grava `legisla.mandatoAtual` | `public/legacy/nucleo.js:189` | Depois do aceite, a página do convite grava esse valor e abre `/guia` já no mandato |
| `Store.consentimento` (`consentimentos`, versão `2026-10`) | `public/legacy/nucleo.js:129` | Mesmo registro e mesma versão na página do convite |
| `Telas.equipeHtml` e `window.Equipe` | `public/legacy/cadastro.js:703-745` | Trocados por um atalho para `/mandato/equipe`; a tela de código sai |
| `destinoAuth` (repasse do retorno do Google) | `plataforma/lib/landing.ts:2` | Estendido para devolver à `/convite` quando há convite pendente |
| Tokens visuais (`--vinho`, `--verde`, `--coral`, `--turquesa`, `--papel`), Anton e Commissioner | `plataforma/app/landing.css:3-8` | CSS próprio de `/mandato` e `/convite`, sem `legacy.css` |
| Wireframe aprovado | Artefato `Ptx9T27wvd8pxS3nmpVhLu` | Fonte visual das três telas |

### Integration Points

| System | Integration Method |
| ------ | ------------------ |
| Supabase Auth (GoTrue) | `signup`, `token?grant_type=password` e `authorize?provider=google` pelas funções de `lib/admin/sessao.ts`; resultado em `legisla.tok` |
| PostgREST | `rpc/<função>` para convites e equipe; `select` com RLS para `membros`, `mandatos` e `eventos_equipe`; `rpc/catalogo_exercicios` |
| Guia legado | Lê `legisla.mandatoAtual` e `legisla.tok`; recebe a classe `so-leitura` e o aviso no corpo |
| `painel-admin` (mesma branch) | Compartilha `lib/admin/sessao.ts`; as migrations desta feature vêm depois de `20261105140000`; a tela de membros do `/admin` precisa aceitar o papel `leitura` (item aberto, ver Risks) |

---

## Components

### Migration `20261106120000_convites_equipe.sql`

- **Purpose**: tabelas, funções, políticas e grants de convite, papéis e histórico.
- **Location**: `plataforma/supabase/migrations/20261106120000_convites_equipe.sql`
- **Interfaces** (todas `security definer`, `set search_path = ''`, `revoke execute ... from public, anon`, `grant ... to authenticated`, salvo `convite_previa`):
  - `convite_criar(p_mandato uuid, p_nome text, p_email text, p_papel text) → jsonb {id, token, expira_em}`: valida, checa membro e hierarquia, limpa convites antigos, grava, registra evento. Erros de regra viram `raise exception` com a mensagem da spec (nenhuma ação a preservar).
  - `convite_previa(p_token text) → jsonb`: liberada para `anon` e `authenticated`; devolve `{ok, nome, papel, convidado_por, mandato:{nome_parlamentar, cargo, uf}, exige_email}` ou `{ok:false, erro:'invalido'|'limite'}`. Não consome nada.
  - `convite_aceitar(p_token text, p_nome text) → jsonb`: `{ok:true, mandato_id, ja_membro}` ou `{ok:false, erro:'invalido'|'email'|'consentimento'|'limite'}`.
  - `convite_cancelar(p_id uuid) → void`
  - `convites_pendentes(p_mandato uuid) → table(id, nome, papel, convidado_por_nome, expira_em)`
  - `equipe_do_mandato(p_mandato uuid) → table(user_id, nome, email, papel, criado_em)`: e-mail vem de `auth.users`, só para membros do mandato.
  - `membro_trocar_papel(p_mandato uuid, p_user uuid, p_papel text) → void`
  - `membro_remover(p_mandato uuid, p_user uuid) → void`
  - `membro_sair(p_mandato uuid) → void`
  - `private.papel_no_mandato(p_mandato uuid) → text`, `private.pode_editar(p_mandato uuid) → boolean`, `private.nivel_papel(p text) → int`, `private.token_aleatorio() → text`, `private.convite_limite(p_origem text) → boolean`.
- **Dependencies**: schema inicial e `painel-admin` (migrations anteriores).
- **Reuses**: molde de `excluir_mandato`; `eh_membro`.

Comportamentos de segurança que o SQL carrega:

- **Token:** `private.token_aleatorio()` monta 16 bytes de entropia plena a partir de `gen_random_uuid()` (gerador criptográfico nativo, sem `pgcrypto`) e devolve 22 caracteres base64url. O banco guarda `sha256(convert_to(token,'UTF8'))`.
- **Concorrência do aceite:** `select ... from convites where token_hash = ... for update` serializa dois aceites; o segundo vê `usado_em` preenchido e recebe `invalido`.
- **Limite de tentativas:** falhas são gravadas em `convite_tentativas(origem, em)` e **retornadas como `{ok:false}`**, não como exceção, porque uma exceção desfaria a gravação da tentativa. A origem vem de `current_setting('request.headers', true)::json->>'x-forwarded-for'` (primeiro IP). Mais de 10 falhas em 10 minutos gravam um bloqueio de 15 minutos em `convite_bloqueios(origem, ate)`. Sem cabeçalho, o limite não se aplica (ver Risks).
- **Última coordenação:** as três funções de membro fazem `select ... from public.membros where mandato_id = p_mandato for update` antes de contar coordenações; isso serializa operações simultâneas.
- **Acesso direto:** `convites`, `convite_tentativas`, `convite_bloqueios` não têm nenhum grant para `anon` ou `authenticated`; `eventos_equipe` só tem `select` para `authenticated`; `membros` perde `delete` e a política `membros_sair`.

### Banco: papéis e leitura (mesma migration)

- **Purpose**: aplicar `leitura` e o limite de papéis nas tabelas existentes.
- **Interfaces**: `membros.papel` com `check (papel in ('coordenacao','assessoria','leitura'))`; `mandatos_editar` e `eventos_criar` passam a exigir `private.pode_editar(...)`; função `public.catalogo_exercicios()` para membros (a tabela `exercicios_guia` continua fechada, pois o teste do painel-admin exige 0 linhas para membros); `revoke execute on function public.entrar_com_codigo(text, text) from authenticated`.
- **Reuses**: políticas de `schema_inicial.sql:127-171`.

### `lib/convites/` (funções puras, `node --test`)

- **Purpose**: regras testáveis sem rede.
- **Location**: `plataforma/lib/convites/`
- **Interfaces**:
  - `papeis.ts`: `PAPEIS`, `rotuloPapel(p)`, `papeisPermitidos(meu: Papel): Papel[]`, `podeGerirEquipe(p)`, `podeEditar(p)`.
  - `link.ts`: `montaLink(origem, token)` → `${origem}/convite#${token}`; `tokenDoHash(hash): string | null` (só aceita 22 caracteres `[A-Za-z0-9_-]`).
  - `mensagem.ts`: `mensagemConvite({parlamentar, convidadoPor, link, validade})`, `urlWhatsApp(texto)`.
  - `validacao.ts`: `validaConvite({nome, email})` com os limites da spec (80 e 254, formato).
  - `erros.ts`: `mensagemDe(erro)` mapeia as exceções e os códigos `{ok:false}` para os textos da spec.
  - `dias.ts`: `diaDoMandato(posse, agora): {estado: 'antes'|'em-curso'|'concluido', dia?: number}` em `America/Sao_Paulo`.
  - `missoes.ts`: `statusMissoes(feitos, catalogo): {missao, status}[]` (Concluída, Em andamento, A fazer).
  - `pendente.ts`: `guardaPendente(storage, token)`, `lePendente(storage)`, `limpaPendente(storage)` sobre `sessionStorage['legisla.convite']`.
- **Dependencies**: nenhuma.
- **Reuses**: padrão de `lib/*.ts` com imports relativos terminando em `.ts` (AD-004); regra de missão concluída de `lib/admin/funil.ts`.

### `app/convite/page.tsx`

- **Purpose**: página pública do convite (prévia, criar conta, entrar, Google, aceitar).
- **Location**: `plataforma/app/convite/` (`page.tsx`, `Convite.tsx`, `convite.css`)
- **Interfaces**: lê o token de `location.hash`; sem token mostra o campo "Cole o link do convite". Fluxo: `convite_previa` → (sem sessão) formulário → `signup` ou `password` ou Google → aviso de consentimento e `consentimentos` → `convite_aceitar` → grava `legisla.mandatoAtual` → `location.replace('/guia')`.
- **Dependencies**: `lib/admin/sessao.ts`, `api.ts`, `lib/convites/*`.
- **Reuses**: `Store.consentimento` (mesmo registro), fluxo de sessão do painel.
- **Cabeçalhos**: `Referrer-Policy: no-referrer` e `X-Robots-Tag: noindex` para `/convite`, em `next.config.mjs`.
- **Google**: antes de sair, grava o token em `sessionStorage` e pede `redirect_to = origin + '/convite'`. Na volta, a página lê `access_token` do hash, grava `legisla.tok`, recupera o token pendente e conclui. Se a URL não estiver nas Redirect URLs do Supabase e o retorno cair na raiz, `destinoAuth` devolve `/convite#access_token=...` quando há convite pendente.

### `app/mandato/` (Área do mandato e Equipe e convites)

- **Purpose**: as duas telas autenticadas do wireframe.
- **Location**: `plataforma/app/mandato/` (`layout.tsx`, `page.tsx`, `equipe/page.tsx`, `AreaMandato.tsx`, `Equipe.tsx`, `mandato.css`)
- **Interfaces**: `layout` exige sessão (sem sessão mostra "Entre para continuar" com botão para `/guia`), carrega mandatos da pessoa, guarda o mandato ativo e o papel, mostra o seletor só com 2 ou mais mandatos; `AreaMandato` lê `mandatos`, `membros` (contagem), `convites_pendentes` (contagem), `exercicios_guia`, `eventos_equipe`; `Equipe` usa as funções de convite e de membro e atualiza a lista sem recarregar.
- **Dependencies**: `lib/admin/sessao.ts`, `api.ts`, `lib/convites/*`.
- **Reuses**: tokens de `landing.css`; textos e estrutura do wireframe.

### Ajustes no Guia legado

- **Purpose**: tirar o código de convite e aplicar `leitura` na interface.
- **Location**: `public/legacy/cadastro.js` (escrito à mão), `plataforma/lib/legacyBody.ts` e a regra de `destinoAuth` em `plataforma/lib/landing.ts`.
- **Interfaces**:
  - `cadastro.js`: remove o `<details class="cad-codigo">` (linha 124) e troca `Telas.equipeHtml` por um cartão com link para `/mandato/equipe`.
  - Tela de entrada sem mandato (`app.js:452-457`, arquivo extraído, não editar): sobrescrever o texto e o campo por override em `cadastro.js`, no padrão AD-003; a verificação de qual tela é a ativa é a primeira tarefa.
  - `leitura`: depois de `Store.abrir`, `cadastro.js` põe a classe `so-leitura` no `body`, mostra o aviso "Você está com acesso somente leitura" e troca `Store.salvar` e `Store.atualizar` por funções que não gravam; o CSS da classe desabilita `input`, `textarea`, `select` e botões de gravação.
  - Aviso de consentimento: troca "código de convite" por "link de convite" em `legacyBody.ts`.
- **Reuses**: padrão de override de AD-003.

### Testes

- **Purpose**: provar cada critério da spec.
- **Location**: `plataforma/tests/sql-convites.test.ts` (convite, aceite, concorrência, limite, token), `sql-papeis.test.ts` (leitura, hierarquia, última coordenação), `sql-eventos-equipe.test.ts`; `plataforma/tests/convites-*.test.ts` (funções puras); `plataforma/e2e/convite-*.spec.ts` e `mandato-*.spec.ts` (Playwright, com Supabase simulado por `page.route`).
- **Reuses**: `tests/sql-ambiente.ts` (`criaBanco`, troca de identidade); padrão e2e do repo.

---

## Data Models

```sql
-- membros.papel: coordenacao | assessoria | leitura

create table public.convites (
  id               uuid primary key default gen_random_uuid(),
  mandato_id       uuid not null references public.mandatos on delete cascade,
  token_hash       bytea not null unique,        -- sha256 do token; o token nunca é gravado
  nome             text not null check (char_length(nome) between 1 and 80),
  email            text check (email is null or char_length(email) <= 254),  -- normalizado
  papel            text not null check (papel in ('coordenacao','assessoria','leitura')),
  criado_por       uuid references auth.users on delete set null,
  criado_por_nome  text,                          -- cópia do nome de quem convidou
  criado_em        timestamptz not null default now(),
  expira_em        timestamptz not null,          -- criado_em + 7 dias
  usado_em         timestamptz,
  usado_por        uuid references auth.users on delete set null,
  cancelado_em     timestamptz,
  cancelado_por    uuid references auth.users on delete set null,
  check (usado_em is null or cancelado_em is null)
);
create index convites_pendentes_idx on public.convites (mandato_id)
  where usado_em is null and cancelado_em is null;

create table public.eventos_equipe (
  id          bigserial primary key,
  mandato_id  uuid not null references public.mandatos on delete cascade,
  criado_em   timestamptz not null default now(),
  ator_id     uuid references auth.users on delete set null,
  ator_nome   text,
  tipo        text not null check (tipo in
    ('convite_criado','convite_aceito','convite_cancelado','papel_trocado','membro_removido','membro_saiu')),
  alvo_nome   text,
  alvo_id     uuid,
  papel       text
);
create index eventos_equipe_idx on public.eventos_equipe (mandato_id, criado_em desc);

create table public.convite_tentativas (origem text not null, em timestamptz not null default now());
create table public.convite_bloqueios  (origem text primary key, ate timestamptz not null);
```

**Estados do convite** (derivados, sem coluna de estado): pendente = `usado_em`, `cancelado_em` nulos e `expira_em > now()`; vencido = `expira_em <= now()`; usado e cancelado são finais e excludentes.

**Relationships**: `convites.mandato_id` e `eventos_equipe.mandato_id` apontam para `mandatos`; `usado_por` vira linha em `membros`; nomes e papéis em `eventos_equipe` são cópias para o histórico sobreviver à saída da pessoa.

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
| -------------- | -------- | ----------- |
| Token inexistente, vencido, cancelado ou usado | `convite_previa` e `convite_aceitar` devolvem `{ok:false, erro:'invalido'}` e gravam a tentativa | "Este convite não vale mais. Peça um novo para quem convidou você." |
| Mais de 10 falhas em 10 minutos pela mesma origem | Bloqueio de 15 minutos em `convite_bloqueios`; `{ok:false, erro:'limite'}` | "Muitas tentativas. Tente de novo em alguns minutos." |
| E-mail da conta diferente do convite | `{ok:false, erro:'email'}` sem consumir | Mensagem da spec; convite segue válido |
| Conta sem consentimento gravado | `{ok:false, erro:'consentimento'}` | A página mostra o aviso e tenta de novo |
| Pessoa já é membro | `{ok:true, ja_membro:true}` sem consumir | "Você já está neste mandato" e abre o Guia |
| Papel maior que o de quem convida | `raise exception` com a mensagem da spec | Texto em vermelho no formulário |
| Última coordenação removida, rebaixada ou saindo | `raise exception` | "O mandato precisa ter ao menos uma pessoa na coordenação." |
| Sessão vencida (401) | `api.ts` tenta renovar com `refresh_token`; sem sucesso volta para entrada, guardando o token pendente | Pede novo login e retoma o mesmo convite |
| Falha de rede ao gerar ou aceitar | A chamada é repetível: gerar cria outro convite, aceitar é idempotente por `usado_por` | "Não foi possível concluir. Tente de novo." |
| Cadastro recusado pelo Supabase (e-mail usado, senha fraca, confirmação de e-mail pendente) | Mostra o motivo; convite não consumido | Mensagem do GoTrue traduzida em `erros.ts` |

---

## Risks & Concerns

| Concern | Location (file:line) | Impact | Mitigation |
| ------- | -------------------- | ------ | ---------- |
| **"Confirmar e-mail" do Supabase pode estar ligado.** Com o e-mail embutido (2 por hora, só para a equipe do projeto), uma pessoa de fora não recebe a confirmação e não consegue criar conta | `public/legacy/nucleo.js:105` (trata o caso "Confirme o e-mail") | O convite chega à pessoa e a conta nunca é criada | Primeira tarefa verifica a configuração de Auth; se estiver ligada, decisão do usuário entre desligar a confirmação (o link já prova o canal) ou configurar SMTP próprio. Não implementar o aceite antes disso |
| Cabeçalho `x-forwarded-for` pode não chegar à função SQL | design desta feature | Sem origem, o limite de tentativas não se aplica | Tarefa de verificação em produção; sem cabeçalho, o limite fica inativo e o risco real é nulo com 128 bits de token. Registrado como limitação |
| Token na URL apareceria em log de servidor e em `Referer` | `/convite` | Vazamento do link em log da Vercel ou em site externo | Token no fragmento (`#`), que o navegador não envia ao servidor; `Referrer-Policy: no-referrer`; `noindex` |
| `membros_sair` permite deletar a própria linha direto, sem a regra da última coordenação | `schema_inicial.sql:158` | Último coordenador sai por API e o mandato fica sem coordenação | Migration remove a política e o `grant delete`; só `membro_sair` remove |
| `excluir_meus_dados()` apaga a linha de membro sem checar coordenação | `schema_inicial.sql:226-235` | A última coordenação some ao excluir a conta | Fora da spec; registrada como acompanhamento em `STATE.md` ao fechar a feature |
| `mandatos_editar` e `eventos_criar` hoje aceitam qualquer membro | `schema_inicial.sql:139`, `:168` | `leitura` conseguiria gravar | Migration troca por `private.pode_editar(id)`; teste de SQL cobre os dois |
| Gatilho de `arquivado_em` do `painel-admin` mexe no mesmo `update` de `mandatos` | `20261105140000_admin_mandatos_gestao.sql` | Conflito de ordem de migrations | Migration desta feature tem data posterior e testes rodam as duas em sequência |
| Tela de membros do `/admin` e seu teste aceitam só `coordenacao` e `assessoria` | spec `painel-admin` (papéis de membro) | Equipe Legisla não consegue incluir alguém como `leitura` | Item aberto fora desta spec; registrado em `STATE.md` e levado ao usuário |
| `app.js` e `nucleo.js` são sobrescritos por `extrair_legado.py` | AD-003 | Edição direta some | Ajustes só em `cadastro.js` (escrito à mão) e `legacyBody.ts` |
| Guia salva com `Store.salvar` e mostra "Não foi possível salvar" para quem é `leitura` | `nucleo.js:198-204` | Mensagem de erro repetida a cada edição | Override de `Store.salvar` e `Store.atualizar` não grava quando o papel é `leitura` |
| Modo local do Guia (sem nuvem) não tem convite | `cadastro.js:731` | Convite não funciona offline | Mantém o aviso "Modo local" existente; `/mandato` exige nuvem |
| Teste de interface depende de Supabase real | `plataforma/e2e/` | Teste instável | e2e usa `page.route` para simular `rest` e `rpc`; lógica de segurança fica coberta pelos testes de SQL |

---

## Tech Decisions (only non-obvious ones)

| Decision | Choice | Rationale |
| -------- | ------ | --------- |
| Onde fica o token | Fragmento da URL: `/convite#<token>` | Não vai ao servidor nem ao `Referer`; a spec trazia `/convite/<token>`, que apareceria em logs da Vercel |
| Falha de token devolve `{ok:false}` em vez de exceção | Retorno de dados | A exceção desfaz a gravação da tentativa e quebraria o limite |
| Geração do token | `gen_random_uuid()` nativo montando 16 bytes plenos | `pgcrypto` existe em produção (`extensions`), mas não no PGlite de teste; o gerador nativo é criptográfico e testável |
| Hash do token | `sha256()` nativo do Postgres | Sem extensão; token tem entropia alta, então hash rápido basta |
| Lista de convites pendentes e equipe | Funções, não `select` direto | Nenhuma tabela de convite exposta; e-mail só sai para membros do mandato |
| Catálogo de missões | Função `catalogo_exercicios()` sobre a tabela `exercicios_guia` do `painel-admin` | Evita um terceiro catálogo duplicado sem abrir a tabela a membros (teste do painel-admin exige 0 linhas) |
| Reuso do cliente de sessão | Importar de `lib/admin/` | Mesmo formato de `legisla.tok`; mover para `lib/supabase/` só se houver motivo |
| Histórico de equipe | `eventos_equipe` própria | `eventos` mede atividade no `painel-admin` |

> **Project-level decisions:** duas entram em `.specs/STATE.md` como AD-008 e AD-009 ao aprovar o design: (AD-008) convite e equipe só por funções `security definer` sem grant em tabela, com expectativa de falha devolvida como dado quando a tentativa precisa persistir; (AD-009) segredos de link vão no fragmento da URL, nunca no caminho ou na query.
