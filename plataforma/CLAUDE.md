# CLAUDE.md

Plataforma dos 100 Dias (Legisla Brasil): guia para os 100 primeiros dias de um mandato parlamentar. Idioma do produto, dos comentários e dos commits: **português do Brasil**.

## Comandos

```bash
npm install
npm run dev      # http://localhost:3000  (painel da Legisla em /painel)
npm run build
npm run start
npm run dados    # python scripts/build_data.py: gera public/data e public/geo (aceita --refresh)
npx tsc --noEmit # sem lint; checagem de tipos
npm test         # node --test em tests/ (só a lógica pura da landing)
```

Scripts Python (só biblioteca padrão; brutos do TSE em `scripts/.cache`, fora do git):

| Script | Gera |
|---|---|
| `build_data.py` | `public/data/uf`, `mun`, `nacional.json`, `ufs.json`, `cdmun.json`, `public/geo` (TSE 2026 e 2024) |
| `build_eleitos.py` | `public/data/eleitos.json` (rode depois do `build_data.py`) |
| `build_historico.py` | `public/data/hist/{uf}.json` (2022 e 2020; exige `vcm22.zip`/`vcm20.zip` em `scripts/.cache`). Em 2022 cada bloco traz também `c`, os 6 mais votados do município |
| `build_pleitos.py` | `public/data/pleitos/{uf}.json`: pleitos de 2006 a 2024 de cada candidato de 2026 (e eleito municipal de 2024), indexados pelo `sq` atual. A pessoa é reconhecida pelo **título eleitoral** (nunca pelo nome civil), usado só na geração: o arquivo publicado não leva título, CPF nem nascimento. Baixa os zips do TSE (~1,5 GB) para `scripts/.cache`; é a tela de pleitos do Persona (m1.q2) que consome |
| `build_mapa_br.py` | `public/geo/br.json` |
| `build_filiados.py` | `public/data/filiados/{uf}.json` e `br.json` (filiados por partido × município com gênero, faixa etária e escolaridade). Baixa o "Perfil Filiação Partidária" do TSE (~230 MB zip, 3,5 GB csv) para `scripts/.cache` e reduz a ~7 MB; o TSE atualiza todo mês, rode de novo com `--refresh`. Exige `cdmun.json` |
| `build_executivo.py` | `public/data/exec/{uf}.json` e `br.json`: eleito, partido e coligação da Presidência/governo (2026) e das prefeituras (2024). Quando sair o 2º turno, rode com `--refresh` |
| `build_social.py` | `public/data/social/*` a partir da planilha IDSC-BR em `../contexto inicial` |
| `build_comissoes.py` | `public/data/comissoes/br.json`: comissões permanentes da Câmara (`nome`, `sigla`), da API de dados abertos (`/api/v2/orgaos?codTipoOrgao=2`); falha sem gravar se a fonte vier vazia. Formato `{ gerado, fonte, comissoes: [{ nome, sigla }] }`; um `public/data/comissoes/{uf}.json` do mesmo formato (curado à mão, nenhum existe ainda) vira o catálogo das Assembleias na ilha de espaços da Missão 3 |
| `extrair_legado.py` | `public/legacy/*`, `lib/legacyBody.ts`, `public/painel.html` (ver abaixo) |

## Arquitetura: Guia legado + ilhas React

O app **não é um app Next.js convencional**. O Guia original (HTML/JS vanilla, ver `../contexto inicial/index (6).html`) roda como está dentro de uma única página, e os módulos novos entram como "ilhas" React montadas dentro dos exercícios.

- `app/page.tsx` é a **landing** (`app/_landing/*`, estilo em `app/landing.css`, tudo sob `.ld`): hero, demonstração com busca em `eleitos.json`/`pleitos/{uf}.json` (lógica pura em `lib/demo.ts`, testes em `tests/` com `npm test`), missões, FAQ. Todo CTA leva a `/guia`. Se o login Google voltar na raiz com `#access_token`, `RedirecionaAuth` repassa para `/guia`.
- `app/guia/page.tsx` (client): injeta o corpo do Guia via `dangerouslySetInnerHTML` (`lib/legacyBody.ts`) e carrega **em sequência** os scripts de `public/legacy/`: `conteudo, nucleo, app, guia, resumo, novos, m2, m3, cadastro, iniciar`. A ordem importa; os scripts compartilham globais (`D`, `Store`, `Nuvem`, `Resumo`, `App`).
- `app/guia/layout.tsx` carrega `legacy.css` e `ilhas.css` por `<link>` (só em `/guia`; o `app/layout.tsx` raiz não carrega CSS global). O retorno do login Google usa `location.pathname`, então volta em `/guia`: a URL `<domínio>/guia` precisa estar nas Redirect URLs do Supabase.
- `next.config.mjs`: `reactStrictMode: false` de propósito (o Guia mexe no DOM direto e o modo estrito montaria tudo duas vezes); `/painel` é rewrite para `public/painel.html`.
- `ilhas/ponte.tsx` é a ponte: expõe `window.Ilhas.ligar(raiz)`, que o legado chama a cada troca de tela. Ela procura `[data-ilha="nome"]` e monta o componente React registrado no mapa `ILHAS` (cada chamada desmonta as raízes anteriores). `ficha-N` é dinâmico (`Ficha i={N}`).
- **Nova ilha**: criar o componente em `ilhas/`, registrá-lo em `ILHAS` na ponte e emitir `<div class="ilha" data-ilha="nome"></div>` no ponto certo de `public/legacy/conteudo.js` (ou `guia.js`/`novos.js`). Para aparecer no Resumo, usar a ilha `nome-resumo` (ver `novos.js`).
- **Estado**: vive nos globais do legado, não em React. Use os helpers da ponte: `useLegado()` (re-render no evento `guia:mudou`, devolve `{ D, m, bump }`; `bump()` salva e notifica), `dadosGuia()`, `mandato()`, `marca()`, `atualizaMandato()`, `aviso()`, `salva()`. Não crie estado global paralelo.
- Dados das ilhas ficam dentro do mesmo JSON do mandato (`mandatos.dados`, jsonb): `D.tse`, `D.relacoes`, `D.pleitos`, `D.munSel`, `D.casaSel`, `D.escopoSel`, `D.conj2`, `D.eleitorado`, `D.social`. Tipos em `lib/types.ts`. Ao criar um campo novo, tipar em `Legado` (`ilhas/ponte.tsx`) e em `lib/types.ts`.

### Regras ao mexer no legado

- `lib/legacyBody.ts` é **gerado** (`scripts/extrair_legado.py`): não editar à mão.
- `public/legacy/*.js` e `legacy.css` são extraídos do HTML original com 7 retoques conferidos (cada um precisa casar exatamente uma vez). Se o HTML original mudar, rode `python scripts/extrair_legado.py`, que avisa quando um retoque não casa. Edições diretas nesses arquivos são **sobrescritas** na próxima extração; se for uma mudança permanente, coloque-a como retoque no script.
- `public/legacy/novos.js`, `public/legacy/m2.js`, `public/legacy/m3.js` e `ilhas.css` são escritos à mão e não são tocados pela extração. Mudança nova no comportamento do Guia entra neles por override, não nos arquivos extraídos. `m2.js` guarda os ganchos da Missão 2 (escalação, textos, contadores de cadeiras). `m3.js` guarda os da Missão 3 (corpo dos exercícios vira ilha `rumo-*`; os textos do `conteudo.js` não mudam, `tests/legado-m3.test.ts` confere por hash).
- `public/painel.html` é o painel da Legisla, **mantido à mão** (não é mais gerado pelo `extrair_legado.py`). Em `/painel` ele reaproveita a sessão `legisla.tok` do app (ou entra com Google/e-mail), lê URL e chave pública de `nucleo.js` em tempo de execução, exige linha em `equipe_legisla` e lê `mandatos` + `membros` do Supabase; também aceita arquivos JSON, "Este navegador" e demonstração. Só exibe contagens e percentuais, nunca o texto escrito pelos gabinetes. Ainda não exibe parceiros/concorrentes.

## Dados e backend

- `lib/dados.ts`: loaders com cache de Promise (`carregaUF`, `carregaMun`, `carregaGeo`, `carregaHist`, `carregaEleitos`, `carregaNacional`, `carregaMapaBR`) sobre os JSONs estáticos de `public/data` e `public/geo`. Os JSONs usam chaves curtas (ver comentários em `lib/types.ts`: `s`, `u`, `p`, `v`, `x`, `e`...).
- `public/data` e `public/geo` são commitados (grandes, gerados pelos scripts Python). Não edite à mão; regenere.
- `app/api/votos-mun/route.ts`: única rota de API. Coleta no TSE (`resultados.tse.jus.br/oficial/ele2026/6259`, sem CORS, exige `User-Agent` de navegador) os votos de uma candidatura (`sq`) em cada município de uma UF, com 16 requisições em paralelo, retry e cache em disco em `.cache-api/` (TTL 30 min, gitignored) e deduplicação de coletas em curso. Cargos TSE: senado 5, federal 6, estadual 7 (DF: 8). Valida `uf`, `casa` e `sq` antes de usar. Em hospedagem sem disco gravável (Vercel), o cache em disco não persiste.
- Guia da API do TSE: `../contexto inicial/API_TSE_GUIA.md` (não oficial; 2022 não existe nesse host, usar CSV dos dados abertos).
- **Supabase**: o legado fala com o Supabase por `fetch` direto (`nucleo.js`: `Nuvem`, `Store`, auth e REST), não por `supabase-js`. As URLs/chaves ficam em `AMBIENTES` no topo de `public/legacy/nucleo.js` (hoje preenchidas com o projeto "Projeto 100 Dias", ref `fldmekrexvzchynnmeuq`; sem elas o app roda só com `localStorage`, `NUVEM=false`). Nunca coloque `service_role` ali; só a chave pública. Schema em `supabase/migrations/` (tabelas `mandatos`, `membros`, `eventos`, `consentimentos`, `equipe_legisla`, RLS com `to authenticated`, funções auxiliares em schema `private`, views `security_invoker`). Mudanças de schema = nova migration com timestamp, nunca editar a existente.
- Chaves de `localStorage`: `legisla.mandatoAtual`, `legisla.tok`.

## Convenções

- TypeScript `strict`, alias `@/*` aponta para a raiz. Componentes de ilha são `'use client'`.
- Estilo do código existente: compacto, comentários curtos em português explicando o *porquê*; ilhas grandes em um arquivo por módulo (`Persona`, `Assentos`, `Conjuntura`, `Municipio`, `Eleitorado`, `Social`, `Equipe`, `Resumos`). `ilhas/pecas.tsx` guarda peças visuais compartilhadas.
- Cuidado com limitações de dados já documentadas no README: RO ainda "aguardando reprocessamento" no TSE (`npm run dados -- --refresh`); Senado só com eleitos de 2026 (+ 2022 em `eleitos.json`); município lista só os 6 deputados mais votados; votos de partido são nominais; cruzamento de reeleição é por nome civil + UF (sem CPF).
- Dados pessoais: `mandatos.permite_pesquisa` controla se a equipe da Legisla lê o conteúdo escrito (não só agregados). Respeite isso em qualquer consulta ou painel novo.

## Armadilhas

- Mudou algo no DOM de uma tela do Guia? A ilha é remontada em `Ilhas.ligar`; não guarde estado só no componente se ele precisa sobreviver à troca de tela (use `D.*`).
- `window.__guiaIniciado` evita carregar os scripts do legado duas vezes (HMR/remontagem); reinicie a página inteira ao testar mudanças em `public/legacy`.
- Windows: o app fica em `Desktop\Dev Apps\Projeto 100 dias\plataforma`, mas a raiz do git é a pasta pai, `Projeto 100 dias` (não existe `.git` dentro de `plataforma/`). Rode `git`, `commit` e `push` de qualquer lugar do projeto; a Vercel tem Root Directory `plataforma` e **nunca** deve ser acionada com `vercel` de dentro de `plataforma/` (duplica o caminho e o build falha com "Couldn't find any `pages` or `app` directory"). Publicar = `git push` na `main`. Contexto de origem (HTML original, docx, banco.sql, planilha IDSC) fica em `../contexto inicial`.
