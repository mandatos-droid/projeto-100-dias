# Resumo do Preenchimento Reestruturado Design

**Spec**: `.specs/features/resumo-reestruturado/spec.md`
**Referência visual**: `.specs/features/resumo-reestruturado/proposta.html` (CSS e marcação do mock são o ponto de partida; os tokens são os de `legacy.css`)
**Status**: Done

---

## Architecture Overview

`#/resumo` é desenhada por `Telas.resumo` (`public/legacy/app.js`), embrulhada por `novos.js`, que liga `Resumo.vivo = true`, acrescenta links nas perguntas e monta as ilhas React. A nova tela **substitui `Telas.resumo`** num arquivo novo e **não mexe em `Resumo.ex` nem em `Resumo.missao`**, que o Painel (`ml-resp`) e o download reaproveitam.

```
Telas.resumo (novo, resumo-tela.js)
  ├─ Resumo.vivo = true                    (liga links de pergunta e ilhas, como hoje)
  ├─ cabeçalho: <div class="ilha" data-ilha="resumo-retrato">      → ilha React ResumoRetrato
  ├─ barra fixa: percentual + 5 segmentos + "Baixar resumo completo (HTML)"
  ├─ ferramentas: Expandir/Recolher tudo, "só o que falta", contador
  └─ 5 × <details.missao> → N × <details.ex>
        corpo = Resumo.ex(ex)                    (toda sobreposição de m1..m5 continua valendo)
              | caixa "Nenhuma resposta ainda"   (estado "nao")
              | <div class="ilha" data-ilha="resumo-equipe">   (ex.tipo === 'funcoes')
        + ResumoIlhas.lista → cartões            (Resumo.vivo)
        + SocialResumo (ilha 'social-resumo')    → tabela por território
        + Resumo.ex tipo 'frag' → selos M/P
```

Ordem de carga: `resumo-tela.js` entra em `SCRIPTS` (`app/guia/page.tsx`) **depois de `m1` e antes de `sugestoes`**, para que `Telas.resumo` (de `novos.js`) e todos os `Resumo.ex` de `m1.js` a `m5.js` já existam. As ilhas novas entram no mapa `ILHAS` de `ilhas/ponte.tsx`.

---

## Code Reuse Analysis

| Existente | Uso |
| --------- | --- |
| `estadoEx`, `progMissao`, `progGeral`, `Telas.estadoTxt` (`nucleo.js`, `app.js`) | Estados, contadores e texto do estado |
| `Resumo.ex`, `Resumo.sem`, `Resumo.v` | Corpo dos exercícios, "não preenchido" |
| `ResumoIlhas.foto`, `ResumoIlhas.rel`, `ResumoIlhas.lista` (`novos.js`) | Foto TSE e relações; `lista` é sobreposta só com `Resumo.vivo` |
| `Baixar.tudo` (`resumo.js`) | Download HTML, sem mudança |
| `useLegado`, `useCarga`, `carregaUF`, `carregaFiliadosUF` (`ilhas/ponte.tsx`, `lib/dados.ts`) | Dados dos números do retrato |
| `linhas`, `vistaDaTabela`, `contagemCompletas` (`lib/tabelaEquipe.ts`), `COORDENACOES`, `COR_COORD` (`lib/equipe.ts`) | Modelo do organograma |
| `agendaDe`, `ROT_NIVEL`, `TIPOS` (`ilhas/Social.tsx`) | Rótulos da tabela de território |
| `abreGuia` (`e2e/guia-real.ts`), `tests/legado-*.test.ts` (padrão `vm`) | Testes |

Nenhum dado novo; nenhuma migration; nenhuma chave nova em `D`.

---

## Components

### `public/legacy/resumo-tela.js` (novo, escrito à mão, IIFE)

- **Responsabilidade**: construir a tela, ligar os comportamentos e sobrepor `ResumoIlhas.lista` (cartões) e o corpo de `frag` (selos).
- **Funções** (expostas em `window.ResumoTela` para teste em `vm`): `html()` devolve a string da tela; `previa(htmlCorpo)` devolve o texto puro da primeira resposta (≤160 caracteres); `abreMissao(m)` e `abreExercicio(ex)` aplicam a regra de abertura; `textoPendentes(n)` devolve a frase do contador; `ligar(raiz)` liga cliques, filtro, `scroll-spy` e `beforeprint`/`afterprint`.
- **Sem estado persistente**: tudo é derivado de `D`, `MISSOES` e do DOM.
- **Scroll-spy**: no evento `scroll` (com `requestAnimationFrame`), marca o segmento da última missão com `getBoundingClientRect().top <= 160`; a primeira se nenhuma. Sem `IntersectionObserver`, para a regra de 160 px ser exata e testável.
- **Clique no segmento**: `details.open = true` e `scrollIntoView({block:'start', behavior})`, com `behavior:'auto'` sob `prefers-reduced-motion`. Não toca em `location.hash` (o roteador do Guia usa o hash).
- **Contador** com `aria-live="polite"`.

### `ilhas/ResumoRetrato.tsx` (novo) + `lib/resumoRetrato.ts` (novo)

- `lib/resumoRetrato.ts` (lógica pura, testada): `fotoUrl(t)`, `inicial(nome)`, `abrevia(n)` ("112 mil+" a partir de 10.000), `legendaPos`, `numeros(entrada)` que devolve só os números cujas fontes existem.
- `ResumoRetrato.tsx`: lê `useLegado()`, `D.tse`, `carregaUF(m.uf)` (cadeiras), `carregaFiliadosUF(m.uf)` (filiados) e `linhas(vistaDaTabela(D.campos))`; renderiza cartão + números. Falha de carga omite o número, não derruba a tela (`useCarga` já devolve `dados` indefinido).
- A Casa do mandato é a mesma que `ConjunturaResumo` usa para as cadeiras; o implementador lê `ilhas/Conjuntura.tsx` (`NIVEIS`) e `ilhas/Resumos.tsx:18-90` e reaproveita a escolha, sem criar regra nova.

### `ilhas/ResumoEquipe.tsx` (novo) + `lib/resumoEquipe.ts` (novo)

- `lib/resumoEquipe.ts` (pura, testada): `arvore(c)` recebe `vistaDaTabela(D.campos)` e devolve `{ chefia: Cartao | null, ramos: { area, cor, cartoes: Cartao[] }[] }`, com `Cartao = { i, cargo, pessoa, estado: 'ok' | 'vaga' | 'aberto' }`. Chefia = linha da área `Chefia de área`; ramos na ordem de `COORDENACOES` (sem a Chefia); dentro do ramo, ordem Chefia, Coordenação, Especialista, Executora (`CATEGORIAS`) e depois a ordem das linhas.
- `ResumoEquipe.tsx`: CSS próprio em `ilhas.css`, no desenho do mock (grade de ramos com linhas de ligação em pseudo-elementos). Sem `@xyflow/react` (o organograma interativo da Missão 2 continua o mesmo).

### `lib/resumoSocial.ts` (novo) e `ilhas/Social.tsx` (`SocialResumo`)

- `lib/resumoSocial.ts` (pura, testada): `porTerritorio(itens)` devolve `{ territorio, problemas: ItemSoc[], potencialidades: ItemSoc[] }[]` na ordem da spec (Brasil, UFs, municípios; `localeCompare('pt-BR')`), com uma linha por nome de `nomes`.
- `SocialResumo` passa a desenhar a tabela. É usada só na `#/resumo` (ilha `social-resumo`); conferir com `grep` antes de editar.

### `ilhas.css` e `ponte.tsx`

- `ilhas.css`: bloco novo `/* ===== Resumo reestruturado ===== */` com tudo sob `#tela .res2` (classe raiz da nova tela), para não vazar para o resto do Guia. Reaproveita os tokens `--vinho`, `--turquesa`, etc.
- `ponte.tsx`: registra `'resumo-retrato'` e `'resumo-equipe'`.

---

## Decisions

- **AD-R1: sobrepor `Telas.resumo`, não `Resumo.missao`.** `Resumo.missao` alimenta o Painel e o download; qualquer mudança nele violaria RES-12. A nova tela monta seus blocos e chama `Resumo.ex` por exercício.
- **AD-R2: arquivo novo em vez de editar `novos.js`.** `novos.js` já tem ~500 linhas e várias responsabilidades; um arquivo por tela segue o padrão `m1.js` a `m5.js`. Custo: uma entrada em `SCRIPTS`.
- **AD-R3: `scroll` com `requestAnimationFrame`, sem `IntersectionObserver`.** A regra da spec é "topo passou de 160 px"; `getBoundingClientRect` a implementa literalmente e dispensa simular observador nos testes.
- **AD-R4: segmentos são `<button>`, não `<a href="#...">`.** O hash pertence ao roteador do Guia.
- **AD-R5: abertura inicial derivada dos dados, sem `localStorage`.** Evita estado novo; o "Expandir/Recolher tudo" cobre o resto.
- **AD-R6: números do retrato omitidos quando sem fonte.** Mostrar "—" induz a achar que o dado é zero.
- **AD-R7: corpo "não iniciado" e sem resposta visível é uma caixa, não a saída de `Resumo.ex`.** Refinado após o T3: `temConteudo` não conta as caixas extras (`caixas`), então `estadoEx` pode dar "nao" com resposta já visível (`m1-persona.spec.ts:29`); nesse caso o bloco abre com `Resumo.ex`. Evita oito "não preenchido" seguidos; o título de cada pergunta continua a ser alcançável abrindo o exercício pelo link.
- **AD-R8: `ResumoIlhas.lista` só vira cartões com `Resumo.vivo`.** O download roda sem `vivo` e segue em texto (RES-07.6).

---

## Pontos de atenção (para os workers)

- `Resumo.vivo` precisa estar `true` durante a montagem do HTML da nova tela e voltar a `false` ao fim, como `novos.js` faz (`try/finally`).
- `Telas.resumo` é chamado pelo roteador a cada visita: cada chamada reconstrói a tela e religa eventos; ouvir `scroll`, `beforeprint` e `afterprint` na `window` exige remover os ouvintes anteriores (guardar a função em `window.__resumoOuvintes`) para não acumular.
- A barra é `position: sticky` dentro de `#tela`: conferir no e2e que nenhum ancestral tem `overflow` que a quebre; em ≤61,25rem o `.topo-movel` já é sticky em `top: 0` (`legacy.css:80`), então a barra usa `top` igual à altura dele (variável CSS `--topo-movel`, medida em `ligar`).
- `public/legacy/app.js`, `resumo.js` e `legacy.css` são gerados: **não editar**.
- `ponte.tsx` monta ilhas com `Ilhas.ligar(raiz)`; `novos.js` chama isso ao fim de `Telas.resumo`. A nova `Telas.resumo` precisa chamar `Ilhas.ligar(t)` também.
- Fotos do TSE nos e2e: interceptar `**/resultados.tse.jus.br/**` (abortar) para o teste não depender de rede e cair na inicial.
- Mocks de e2e do Guia: `abreGuia(page, '#/resumo', { dados, mandato })`. Porta isolada 3100 (ver `plataforma/CLAUDE.md`, "Em worktree isolado").

---

## Tech Decisions (não óbvias)

| Decisão | Escolha | Racional |
| ------- | ------- | -------- |
| `<details>` nativo | Sim | Teclado e leitor de tela sem JS; "Expandir tudo" é só `open = true` |
| Print | `beforeprint`/`afterprint` abrem e restauram | `<details>` fechado não imprime o conteúdo |
| Árvore do organograma | CSS Grid + pseudo-elementos | Sem biblioteca; vira coluna única no celular |
| Contagem "N de 16" | Soma de `progMissao(m).total` | Não fixar o 16 no código |
