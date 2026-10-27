# Missão 4 · Capital Político — Design

**Spec**: `spec.md` · **Status**: Rascunho

Segue o padrão da Missão 3: telas novas são **ilhas React** em `plataforma/ilhas/capital/`, penduradas no Guia legado por um arquivo novo `public/legacy/m4.js` (sem mexer em `conteudo.js`/`guia.js`, regra AD-003). Regra de negócio fica em `lib/` como função pura com teste (regra AD-004).

## 1. O que reaproveitamos (já existe)

| Peça | Onde | Uso |
|---|---|---|
| Lista das 30 comissões da Câmara | `public/data/comissoes/br.json` + `scripts/build_comissoes.py` | Fonte das comissões federais (feita da API da Câmara) |
| Lógica de sugestão por cargo/bandeira | `lib/espacos.ts` | Base das sugestões |
| Bandeiras com id estável | `lib/bandeiras.ts` | Sugestões e etiquetas do clipping |
| Pessoas da equipe | `lib/cadeiras.ts` | Lista de "Responsável" |
| Bingos (frentes e ações) | `BINGOS` em `conteudo.js` | Ações recomendadas (só leitura) |
| Ponte com os dados do Guia | `ilhas/ponte.tsx` | Ler/gravar `D.*` |

## 2. Parte A — Comissões

```
┌ Suas bandeiras: Saúde · Educação ─────────┐
│ SUGERIDAS PARA VOCÊ                        │
│ ┌ Comissão de Saúde (CSAUDE) ───── ☐ ─┐   │
│ │ Combina com: Saúde                   │   │
│ └──────────────────────────────────────┘   │
│ TODAS AS COMISSÕES   [🔍 buscar]           │
│ ○ CCJC  ○ CFT  ○ CTRAB ...                 │
└────────────────────────────────────────────┘
Ao escolher ► cartão com 3 perguntas em botões
```

- **Sugestão** = tabela `BANDEIRA_COMISSAO` em `lib/comissoesPorBandeira.ts` (ex.: `saude → [CSAUDE]`, `educacao → [CE]`; `mulheres → [CMULHER]`). Feita à mão e conferida com as siglas do `br.json`; teste falha se uma sigla não existir no arquivo.
- **Cargo**: Federal usa `br.json` direto. Estadual/Distrital usa o mesmo `br.json` com o aviso e o botão "Ajustar o nome" (o nome digitado vira o que aparece nos resumos). Se algum dia existir `{uf}.json`, ele tem prioridade (mecanismo que a Missão 3 já tem).
- **Dados "ao vivo"?** Fica como está: script atualiza o arquivo (`npm run dados`). Depois que você confirmar a decisão 1, a task opcional T9 testa chamar a API da Câmara no navegador com *fallback* para o arquivo.
- **Perguntas em botões**: listas fixas em `lib/capital.ts` (`MOTIVOS`, `PAPEIS`, `MOVIMENTOS`). Escolhas viram texto: `pq = "Pauta da nossa bandeira; Dá visibilidade"`.
- **Gravação**: lista `D.comissoes` com `{prio, esp, pq, papel, mov}` (formato de hoje) + novo `sigla` e `motivos[]` (extras, ignorados pelo legado).

## 3. Parte B — Matriz de ações

**Framework escolhido: tabela editável no estilo 5W2H** (método de plano de ação, usado em planilhas): cada linha é uma ação; colunas respondem *o quê, por quê, quem, quando, como, próximo passo*. Fontes da pesquisa: descrições de 5W2H como plano de ação em tabela com status por validação de dados e lista de tarefas ligada (ver links no chat). A fraqueza relatada do formato é **enxergar o tempo**; por isso a visão "Todas as ações" ordena por prazo.

Mapa dos seus campos para o 5W2H:

| Seu campo | 5W2H |
|---|---|
| Ação (da lista) | What |
| O que pretende alcançar | Why |
| Responsável | Who |
| Prazo | When |
| Como saberemos | How (prova) |
| Próximo passo | How/Where (primeiro passo) |

Layout (computador):

```
[Articulação 1] [Mobilização 0] [Comunicação 1] …   ← frentes
 ☑ Ação | Alcançar | Responsável ▾ | Prazo 📅 | Como saberemos | Próximo passo
 ☐ Ação (apagada)
```

Layout (celular): cada ação é um **cartão** que abre ao marcar, campos empilhados, botão "Próximo campo".

- **Responsável** = lista das cadeiras ativas (Missão 2), guardada por índice + nome em cópia (mesma regra da Missão 3); texto livre continua.
- **Prazo**: `<input type="date">`, mín. hoje, máx. +100 dias da posse (se a data da posse existir; senão sem máximo).
- **Texto base** em "Como saberemos": um exemplo por ação em `lib/capital.ts` (opcional, editável).
- **Progresso**: função pura `progressoAcoes(acoes)` → `{total, frentes, ok}` (ok = ≥2 ações em ≥2 frentes).
- **Compatível**: mesma lista `D.acoes` (`bingo`, `i`, `titulo`, `alcancar`, `resp`, `prazo`, `saber`, `prox`). Prazo antigo em texto livre continua mostrado.

## 4. Parte C — Comunicação

### Seções e campos semanais

| Seção | Números da semana |
|---|---|
| Alcance e crescimento | Seguidores (total), novos seguidores, alcance/visualizações |
| Compartilhamento, comentários e respostas | Compartilhamentos, comentários, respostas dadas |
| Mensagens recebidas e encaminhadas | Recebidas, encaminhadas |
| Campanhas e convites | Convites enviados, pessoas que participaram |
| Imprensa e debate público | Aparições (calculado pelo clipping), notas/entrevistas dadas |

Campos são só números ≥ 0, com explicação curta embaixo de cada ("Onde achar? Nas estatísticas da rede").

### Dados

```
D.comunicacao = { semanas: { "2026-W44": { k1:{seguidores,novos,alcance}, k2:{...}, ... } },
                  clipping: [{id, semana, titulo, veiculo, data, url, bandeiras:[id], manual, oculta}] }
```
Chave de semana: ISO (segunda a domingo). Funções puras em `lib/comunicacao.ts`: `semanaDe(data)`, `serie(secao, campo)`, `aparicoesPorBandeira(clipping)`. As caixinhas antigas (`m4.k1..k5`) são marcadas automaticamente quando a seção tem registro.

### Gráficos
- **Linha** (SVG simples, sem biblioteca nova se couber; se não, uma lib pequena já aceita no projeto): eixo X = semanas, linha por campo. Em cada seção expandida e uma "Linha do tempo geral" no fim.
- **Barras horizontais** para "aparições por bandeira" (melhor que pizza para ler no celular).
- Cores com legenda e rótulo (não só cor, por acessibilidade).

### Clipping (notícias)

```
navegador ──POST /api/clipping {nome, cargo, dias:7}──► rota do servidor
                                                      └► Google Notícias RSS
                                                         news.google.com/rss/search?q="Nome"+when:7d&hl=pt-BR&gl=BR&ceid=BR:pt-419
◄── [{titulo, veiculo, data, url}] ──────────────────────┘
```

- Fonte **não oficial** (o Google não documenta o RSS; os parâmetros `hl`, `gl`, `ceid`, `q` e `when:7d` vêm de guias de terceiros). Por isso a fonte fica atrás de uma função `buscaNoticias()`; trocar por GDELT ou NewsAPI não muda a tela. **GDELT e NewsAPI não foram verificados nesta sessão.**
- Rota exige usuário logado, limita a 10 buscas/hora por mandato e **não guarda** texto de matéria.
- Termo: `"Nome Parlamentar"` entre aspas; se existir, `OR "Nome de urna"`.
- Remove duplicadas (mesmo link/título) e marca as ocultas.
- **Etiquetas**: chips das bandeiras da Missão 3 em cada notícia; "Sem bandeira" é o padrão. Opção "Marcar vários" para etiquetar em lote.

## 5. Arquivos novos

```
lib/comissoesPorBandeira.ts   lib/capital.ts   lib/comunicacao.ts
ilhas/capital/Comissoes.tsx  CartaoComissao.tsx  Matriz.tsx  LinhaAcao.tsx
               Comunicacao.tsx  SecaoComunicacao.tsx  Grafico.tsx  Clipping.tsx
public/legacy/m4.js
app/api/clipping/route.ts
tests/capital.test.ts  tests/comunicacao.test.ts  e2e/capital.spec.ts
```

## 6. Suposições assumidas (peço seu OK)

- Não pesquisei a fundo "framework de matriz interativa" além do 5W2H; a escolha de tabela editável + cartão no celular é nossa. Se preferir um quadro **Kanban** (colunas A fazer / Fazendo / Feito), dá para adicionar como 2ª visão depois.
- O gráfico por bandeira conta só notícias não ocultas.
- Quem edita: qualquer membro do mandato (igual ao resto do Guia).
