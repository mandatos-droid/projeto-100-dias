# Missão 4 · Capital Político Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implemente estas tasks com a skill `tlc-spec-driven`: ative-a pelo nome e siga o fluxo Execute e as Critical Rules. Se não conseguir ativá-la, PARE e avise o usuário.

**Spec**: `.specs/features/missao4-capital-politico/spec.md`
**Design**: `.specs/features/missao4-capital-politico/design.md`
**Status**: Aprovado pelo usuário ("pode seguir com a spec"). Aprovação autoriza só implementação local e commits locais; `git push` e deploy exigem go-ahead.

Caminhos relativos a `plataforma/`, salvo indicação. A árvore de trabalho tem mudanças do usuário não commitadas.

1. Cada commit usa `git add` com os arquivos nomeados da task; nunca `git add -A`.
2. Antes de editar `ilhas/ponte.tsx` ou `app/guia/page.tsx`, rodar `git diff` no arquivo e preservar a mudança do usuário.
3. `conteudo.js`, `guia.js`, `app.js`, `nucleo.js`, `resumo.js`, `novos.js`, `m2.js` e `m3.js` não são editados (AD-003); os ganchos ficam em `public/legacy/m4.js`.
4. Antes de criar a rota de API (T21), ler o guia de rotas em `node_modules/next/dist/docs/` (regra do `AGENTS.md`).
5. Textos do Guia da Missão 4 são intocáveis: o teste da T3 falha se qualquer texto mudar.
6. Depois de modificar código, rodar `graphify update .` (regra do `CLAUDE.md`) antes do commit final de cada fase.
7. Mensagens de commit seguem Conventional Commits e terminam com a linha `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

---

## Test Coverage Matrix

> Gerada a partir da Missão 3 (`plataforma/CLAUDE.md`, `AGENTS.md`): `npm test` roda `node --test`, imports em `lib/` e `tests/` são relativos e terminam em `.ts`. Confirmar antes de executar.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Lógica pura (`lib/capital.ts`, `comissoesPorBandeira.ts`, `comunicacao.ts`) | unit | Todos os ramos; 1:1 com os critérios CAP; cada edge case tem teste | `tests/*.test.ts` | `npm test` |
| Ganchos do legado (`public/legacy/m4.js`) | unit (`node:vm` com globais simuladas) | Cada override; hash dos textos da Missão 4 | `tests/legado-m4.test.ts` | `npm test` |
| Rota de API (`app/api/clipping/route.ts`) | unit (com resposta falsa da fonte) | 401 sem login, limite por hora, só metadados, falha amigável | `tests/clipping.test.ts` | `npm test` |
| Ilhas React (`ilhas/capital/*.tsx`) | e2e | Cada tela que a task cria: caminho feliz + cada edge case e erro da spec | `e2e/capital-*.spec.ts` | `npm run test:e2e` |
| Gráfico (`Grafico.tsx`), CSS, registro das ilhas | none | - (build gate; exercitado pelos e2e das ilhas) | - | `npx tsc --noEmit` |

## Gate Check Commands

> Gerados a partir da Missão 3; confirmar antes de executar.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks só com testes unitários (`lib/`, `m4.js`, rota) | `npm test` |
| Full | Tasks de ilha, que têm teste e2e | `npm test && npx tsc --noEmit && npm run test:e2e` |
| Build | Fim de fase e tasks com `Tests: none` | `npx tsc --noEmit && npm test && npm run test:e2e && npm run build` |

Observação: o `npm run build` oscilou com `SecurityFatalError` do Next 16.4 na Missão 3. Se falhar só por isso, o gate Build vale como `npx tsc --noEmit && npm test && npm run test:e2e` mais `next dev` respondendo 200 em `/guia`, e a falha é registrada em `validation.md`.

---

## Execution Plan

Phases run in order; tasks run in order inside a phase. A seta que abre cada fase marca a dependência da última task da fase anterior.

### Phase 1: Base

```
T1 → T2 → T3
```

### Phase 2: Comissões

```
T3 → T4 → T5 → T6 → T7 → T8 → T9
```

### Phase 3: Matriz de ações

```
T9 → T10 → T11 → T12 → T13 → T14
```

### Phase 4: Comunicação

```
T14 → T15 → T16 → T17 → T18 → T19
```

### Phase 5: Clipping

```
T19 → T20 → T21 → T22 → T23 → T24
```

### Phase 6: Fechamento

```
T24 → T25 → T26
```

---

## Task Breakdown

### T1: Listas e regras puras da Missão 4 ✅

**What**: Criar `lib/capital.ts` com `MOTIVOS`, `PAPEIS`, `MOVIMENTOS`, textos base de "Como saberemos" e `progressoAcoes(acoes)`.
**Where**: `lib/capital.ts`, `tests/capital.test.ts`
**Depends on**: None
**Reuses**: `public/legacy/conteudo.js` (`BINGOS`, leitura)
**Requirement**: CAP-03, CAP-12

**Tools**: nenhuma MCP necessária.
**Done when**:
- [x] `progressoAcoes` devolve `ok:false` com 2 ações na mesma frente e `ok:true` com 2 ações em 2 frentes
- [x] `MOTIVOS`, `PAPEIS` e `MOVIMENTOS` têm os itens definidos na spec
- [x] Gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(capital): add listas e progresso das ações da Missão 4`

---

### T2: Gancho do legado `m4.js`

**What**: Criar `public/legacy/m4.js` e ligá-lo no `app/guia/page.tsx`, abrindo uma ilha para cada um dos 3 exercícios da Missão 4 (tela vazia por enquanto).
**Where**: `public/legacy/m4.js`, `app/guia/page.tsx`
**Depends on**: T1
**Reuses**: `public/legacy/m3.js` (padrão do gancho)
**Requirement**: CAP-40

**Tools**: nenhuma MCP necessária.
**Done when**:
- [ ] Os 3 exercícios da Missão 4 abrem a ilha correspondente
- [ ] Missão 4 abre sem erro no console
- [ ] `m3.js` e os arquivos extraídos seguem inalterados

**Tests**: none
**Gate**: build
**Commit**: `feat(capital): add gancho m4.js para os exercícios da Missão 4`

---

### T3: Teste dos textos do Guia da Missão 4 intactos

**What**: Criar teste que calcula o hash dos textos da Missão 4 em `conteudo.js` (`t`, `d`, `intro`, `fim`, `entrega`, bingos) e falha se qualquer um mudar.
**Where**: `tests/legado-m4.test.ts`
**Depends on**: T2
**Reuses**: `tests/legado-m3.test.ts` (padrão do hash)
**Requirement**: CAP-21, CAP-40

**Tools**: nenhuma MCP necessária.
**Done when**:
- [ ] O teste passa com o `conteudo.js` atual
- [ ] Alterar um caractere de um texto da Missão 4 faz o teste falhar
- [ ] Gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `test(capital): add hash dos textos do Guia da Missão 4`

---

### T4: Tabela bandeira → comissão

**What**: Criar `lib/comissoesPorBandeira.ts` (bandeira → siglas da Câmara) e teste que cada sigla existe em `public/data/comissoes/br.json`.
**Where**: `lib/comissoesPorBandeira.ts`, `tests/comissoesPorBandeira.test.ts`
**Depends on**: T3
**Reuses**: `lib/bandeiras.ts`, `public/data/comissoes/br.json`
**Requirement**: CAP-01

**Tools**: nenhuma MCP necessária.
**Done when**:
- [ ] Toda bandeira com tema óbvio tem ao menos uma sigla
- [ ] Teste falha se uma sigla não existir no `br.json`
- [ ] Gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(capital): add tabela de comissões por bandeira`

---

### T5: Tela de comissões: sugeridas e todas

**What**: Criar `ilhas/capital/Comissoes.tsx`: detecta o cargo, mostra "Sugeridas" com motivo e "Todas" com busca, avisos para Estadual e outros cargos, atalho para a Missão 3 sem bandeiras.
**Where**: `ilhas/capital/Comissoes.tsx`
**Depends on**: T4
**Reuses**: `lib/espacos.ts`, `ilhas/rumo/Espacos.tsx` (`casaDe`), `ilhas/ponte.tsx`
**Requirement**: CAP-01, CAP-02, CAP-04, CAP-40

**Tools**: nenhuma MCP necessária.
**Done when**:
- [ ] Federal + Saúde mostra a comissão de Saúde em "Sugeridas" com o motivo
- [ ] Estadual mostra o aviso e o botão "Ajustar o nome"
- [ ] Sem bandeiras mostra todas sem "sugeridas" e o atalho para a Missão 3
- [ ] Cargo vazio mostra a lista da Câmara sem sugeridas

**Tests**: e2e
**Gate**: full
**Commit**: `feat(capital): add tela de comissões sugeridas e todas`

---

### T6: Cartão da comissão com perguntas em botões

**What**: Criar `ilhas/capital/CartaoComissao.tsx`: 3 perguntas em botões mais "Outro", gravando `pq`, `papel`, `mov` em texto legível mais `sigla` em `D.comissoes`.
**Where**: `ilhas/capital/CartaoComissao.tsx`
**Depends on**: T5
**Reuses**: `lib/capital.ts`, `ilhas/ponte.tsx`
**Requirement**: CAP-03

**Tools**: nenhuma MCP necessária.
**Done when**:
- [ ] Escolher motivo, papel e movimento grava na hora e sobrevive a recarregar
- [ ] O Resumo mostra o texto legível de `pq`, `papel` e `mov`
- [ ] "Outro" aceita texto livre

**Tests**: e2e
**Gate**: full
**Commit**: `feat(capital): add cartão da comissão com perguntas em botões`

---

### T7: Pré-marcar comissões da Missão 3 e ajustar nome

**What**: Marcar na Missão 4 as comissões vindas de `comissoesDesejadas` e implementar o "Ajustar o nome" das comissões estaduais.
**Where**: `ilhas/capital/Comissoes.tsx`
**Depends on**: T6
**Reuses**: `ilhas/rumo/useRumo.ts`
**Requirement**: CAP-02, CAP-04

**Tools**: nenhuma MCP necessária.
**Done when**:
- [ ] Comissão escolhida na Missão 3 aparece marcada na Missão 4
- [ ] O nome ajustado passa a aparecer nos resumos

**Tests**: e2e
**Gate**: full
**Commit**: `feat(capital): add pré-marcação da Missão 3 e ajuste de nome`

---

### T8: Teste e2e das comissões

**What**: Cobrir em e2e os caminhos Federal e Estadual, em tela de celular e de computador.
**Where**: `e2e/capital-comissoes.spec.ts`
**Depends on**: T7
**Reuses**: `e2e/rumo-bandeiras.spec.ts`
**Requirement**: CAP-01, CAP-02, CAP-03, CAP-04

**Tools**: Playwright.
**Done when**:
- [ ] Federal e Estadual passam em 360 px e em 1280 px
- [ ] Dados salvos sobrevivem a recarregar

**Tests**: e2e
**Gate**: full
**Commit**: `test(capital): add e2e das comissões`

---

### T9: Teste da chamada ao vivo à API da Câmara (opcional)

**What**: Verificar se a API da Câmara aceita chamada direto do navegador (CORS) e registrar o resultado; só adotar a chamada ao vivo se funcionar, com fallback ao arquivo.
**Where**: `.specs/features/missao4-capital-politico/validation.md`
**Depends on**: T8
**Reuses**: `scripts/build_comissoes.py`
**Requirement**: CAP-01

**Tools**: WebFetch ou navegador.
**Done when**:
- [ ] O resultado do teste de CORS está registrado
- [ ] Se falhar, nada muda e o arquivo continua como fonte

**Tests**: none
**Gate**: build
**Commit**: `docs(capital): add resultado do teste de CORS da API da Câmara`

---

### T10: Matriz de ações: frentes, linhas e campos

**What**: Criar `ilhas/capital/Matriz.tsx` e `LinhaAcao.tsx`: botões de frente com contador, linhas com caixa de marcar, 5 campos, ponto amarelo ou verde.
**Where**: `ilhas/capital/Matriz.tsx`
**Depends on**: T9
**Reuses**: `ilhas/ponte.tsx`, `lib/capital.ts`
**Requirement**: CAP-10, CAP-12

**Tools**: nenhuma MCP necessária.
**Done when**:
- [ ] Escolher uma frente mostra todas as ações dela como linhas
- [ ] Marcar ativa os campos e grava em `D.acoes` no formato antigo
- [ ] Linha com campo vazio mostra ponto amarelo; completa mostra verde

**Tests**: e2e
**Gate**: full
**Commit**: `feat(capital): add matriz de ações por frente`

---

### T11: Responsável, prazo e texto base

**What**: Ligar o "Responsável" às pessoas da Missão 2 (mais texto livre), o "Prazo" a seletor de data e o texto base de "Como saberemos".
**Where**: `ilhas/capital/LinhaAcao.tsx`
**Depends on**: T10
**Reuses**: `lib/pessoas.ts`, `lib/cadeiras.ts`
**Requirement**: CAP-11, CAP-40

**Tools**: nenhuma MCP necessária.
**Done when**:
- [ ] Escolher uma pessoa e uma data grava `resp` e `prazo`
- [ ] Ação antiga com prazo em texto livre continua visível
- [ ] Sem data de posse, qualquer prazo futuro é aceito

**Tests**: e2e
**Gate**: full
**Commit**: `feat(capital): add responsável, prazo e texto base nas ações`

---

### T12: Cartões no celular

**What**: Layout em cartões empilhados na tela estreita, com foco no próximo campo.
**Where**: `ilhas/capital/capital.css`
**Depends on**: T11
**Reuses**: `ilhas/rumo/rumo.css`
**Requirement**: CAP-13

**Tools**: nenhuma MCP necessária.
**Done when**:
- [ ] A 360 px não há rolagem lateral e cada ação é um cartão

**Tests**: none
**Gate**: build
**Commit**: `feat(capital): add layout em cartões da matriz no celular`

---

### T13: Progresso e visão "Todas as ações"

**What**: Barra de progresso (2 ações em 2 frentes) e visão "Todas as ações" ordenada por prazo.
**Where**: `ilhas/capital/Matriz.tsx`
**Depends on**: T12
**Reuses**: `lib/capital.ts` (`progressoAcoes`)
**Requirement**: CAP-12, CAP-13

**Tools**: nenhuma MCP necessária.
**Done when**:
- [ ] Mostra "2 ações em 2 frentes ✓" ao cumprir a regra
- [ ] "Todas as ações" lista as de todas as frentes ordenadas por prazo

**Tests**: e2e
**Gate**: full
**Commit**: `feat(capital): add progresso e visão de todas as ações`

---

### T14: Teste e2e da matriz

**What**: Cobrir em e2e o fluxo de escolher frente, marcar, preencher, trocar de frente e conferir "Todas as ações", incluindo ação salva no formato antigo.
**Where**: `e2e/capital-acoes.spec.ts`
**Depends on**: T13
**Reuses**: `e2e/rumo-bandeiras.spec.ts`
**Requirement**: CAP-10, CAP-11, CAP-12, CAP-13, CAP-40

**Tools**: Playwright.
**Done when**:
- [ ] O fluxo completo passa
- [ ] Uma ação salva antes da mudança continua abrindo

**Tests**: e2e
**Gate**: full
**Commit**: `test(capital): add e2e da matriz de ações`

---

### T15: Regras puras da comunicação

**What**: Criar `lib/comunicacao.ts` com `semanaDe`, `serie`, `aparicoesPorBandeira` e os campos de cada seção.
**Where**: `lib/comunicacao.ts`, `tests/comunicacao.test.ts`
**Depends on**: T14
**Reuses**: `lib/bandeiras.ts`
**Requirement**: CAP-20, CAP-21, CAP-31, CAP-40

**Tools**: nenhuma MCP necessária.
**Done when**:
- [ ] `semanaDe('2026-12-31')` devolve a semana ISO correta na virada de ano
- [ ] Registrar a mesma semana duas vezes edita, não duplica
- [ ] `serie` devolve as semanas em ordem
- [ ] Números negativos são rejeitados
- [ ] Gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(capital): add regras puras da comunicação semanal`

---

### T16: Componente de gráfico

**What**: Criar `ilhas/capital/Grafico.tsx` com linha e barras, legenda e rótulos (não só cor).
**Where**: `ilhas/capital/Grafico.tsx`
**Depends on**: T15
**Reuses**: nenhuma
**Requirement**: CAP-21

**Tools**: skill `dataviz`.
**Done when**:
- [ ] Renderiza com 0, 1 e 10 semanas sem erro

**Tests**: none
**Gate**: build
**Commit**: `feat(capital): add componente de gráfico de linha e barras`

---

### T17: Seções de comunicação e registro semanal

**What**: Criar `ilhas/capital/Comunicacao.tsx` e `SecaoComunicacao.tsx`: 5 seções expansíveis, "Registrar esta semana", editar semana, mensagem com menos de 2 semanas, gráfico por seção.
**Where**: `ilhas/capital/Comunicacao.tsx`
**Depends on**: T16
**Reuses**: `lib/comunicacao.ts`, `ilhas/capital/Grafico.tsx`, `ilhas/ponte.tsx`
**Requirement**: CAP-20, CAP-21

**Tools**: nenhuma MCP necessária.
**Done when**:
- [ ] Registrar 2 semanas mostra a linha; com 1 semana mostra "Registre mais uma semana para ver a linha"
- [ ] Reabrir a semana atual mostra "Editar esta semana"
- [ ] O cabeçalho fechado mostra o último registro

**Tests**: e2e
**Gate**: full
**Commit**: `feat(capital): add seções expansíveis da comunicação`

---

### T18: Linha do tempo geral e caixinhas antigas

**What**: Gráfico "Linha do tempo geral" e marcação automática das caixinhas `m4.k1` a `m4.k5`.
**Where**: `ilhas/capital/Comunicacao.tsx`
**Depends on**: T17
**Reuses**: `lib/comunicacao.ts`
**Requirement**: CAP-21

**Tools**: nenhuma MCP necessária.
**Done when**:
- [ ] O gráfico geral aparece com um indicador de cada seção
- [ ] Seção com registro marca a caixinha antiga correspondente
- [ ] O Resumo continua correto

**Tests**: e2e
**Gate**: full
**Commit**: `feat(capital): add linha do tempo geral da comunicação`

---

### T19: Teste e2e da comunicação

**What**: Cobrir em e2e o registro de 2 semanas, a edição e a linha do tempo geral.
**Where**: `e2e/capital-comunicacao.spec.ts`
**Depends on**: T18
**Reuses**: `e2e/rumo-bandeiras.spec.ts`
**Requirement**: CAP-20, CAP-21

**Tools**: Playwright.
**Done when**:
- [ ] O fluxo completo passa em 360 px e em 1280 px

**Tests**: e2e
**Gate**: full
**Commit**: `test(capital): add e2e da comunicação`

---

### T20: Conferir o RSS do Google Notícias

**What**: Testar o RSS com o nome de um parlamentar real e registrar formato, falhas e bloqueios em `validation.md`; se falhar, parar e escolher o plano B com o usuário.
**Where**: `.specs/features/missao4-capital-politico/validation.md`
**Depends on**: T19
**Reuses**: nenhuma
**Requirement**: CAP-30

**Tools**: WebFetch ou curl.
**Done when**:
- [ ] O resultado real está registrado
- [ ] Se a fonte falhar, a Fase 5 para até o usuário decidir

**Tests**: none
**Gate**: build
**Commit**: `docs(capital): add resultado do teste do RSS de notícias`

---

### T21: Rota de busca de notícias

**What**: Criar `app/api/clipping/route.ts` e `buscaNoticias()`: login obrigatório, limite de 10 buscas por hora, só metadados, sem duplicadas.
**Where**: `app/api/clipping/route.ts`
**Depends on**: T20
**Reuses**: `lib/comunicacao.ts`
**Requirement**: CAP-30, CAP-32

**Tools**: nenhuma MCP necessária.
**Done when**:
- [ ] Sem login a rota responde 401
- [ ] A 11ª busca na hora é recusada
- [ ] A resposta tem só título, veículo, data e link
- [ ] Falha da fonte devolve erro tratável, não exceção
- [ ] Gate passa (com resposta falsa da fonte)

**Tests**: unit
**Gate**: quick
**Commit**: `feat(capital): add rota de busca de notícias do clipping`

---

### T22: Tela do clipping

**What**: Criar `ilhas/capital/Clipping.tsx`: buscar, listar, ocultar, etiquetar por bandeira (uma a uma e em lote), aparição manual, erro amigável.
**Where**: `ilhas/capital/Clipping.tsx`
**Depends on**: T21
**Reuses**: `lib/bandeiras.ts`, `ilhas/ponte.tsx`
**Requirement**: CAP-30, CAP-31

**Tools**: nenhuma MCP necessária.
**Done when**:
- [ ] Etiquetar uma notícia e recarregar mantém a etiqueta
- [ ] Notícia oculta some da lista e das contas
- [ ] Falha da busca mostra "Não consegui buscar agora. Adicione manualmente"
- [ ] Aparição manual entra na lista

**Tests**: e2e
**Gate**: full
**Commit**: `feat(capital): add tela do clipping com etiquetas de bandeira`

---

### T23: Gráfico por bandeira e número semanal

**What**: Gráfico de barras "aparições por bandeira" e cálculo do número de aparições do registro semanal a partir do clipping.
**Where**: `ilhas/capital/Comunicacao.tsx`
**Depends on**: T22
**Reuses**: `lib/comunicacao.ts` (`aparicoesPorBandeira`), `ilhas/capital/Grafico.tsx`
**Requirement**: CAP-31

**Tools**: nenhuma MCP necessária.
**Done when**:
- [ ] Aceitar 3 notícias muda o número da semana para 3
- [ ] O gráfico por bandeira não conta as ocultas

**Tests**: e2e
**Gate**: full
**Commit**: `feat(capital): add gráfico de aparições por bandeira`

---

### T24: Teste e2e do clipping

**What**: Cobrir em e2e a busca (simulada), a etiquetagem e o gráfico por bandeira.
**Where**: `e2e/capital-clipping.spec.ts`
**Depends on**: T23
**Reuses**: `e2e/rumo-bandeiras.spec.ts`
**Requirement**: CAP-30, CAP-31

**Tools**: Playwright.
**Done when**:
- [ ] O fluxo completo passa com a busca simulada

**Tests**: e2e
**Gate**: full
**Commit**: `test(capital): add e2e do clipping`

---

### T25: Resumo e Missão 5 leem os dados novos

**What**: Fazer o Resumo e a Missão 5 lerem comissões, ações e a última semana de comunicação sem quebrar os dados antigos.
**Where**: `public/legacy/m4.js`
**Depends on**: T24
**Reuses**: `public/legacy/m3.js` (padrão do espelho), `tests/legado-m4.test.ts`
**Requirement**: CAP-40, CAP-21

**Tools**: nenhuma MCP necessária.
**Done when**:
- [ ] Mandato com dados antigos da Missão 4 abre sem perda
- [ ] O Resumo mostra comissões, ações e a última semana de comunicação
- [ ] Gate passa

**Tests**: unit
**Gate**: quick
**Commit**: `feat(capital): add leitura dos dados novos no Resumo e na Missão 5`

---

### T26: Fechamento e verificação independente

**What**: Rodar o Verifier (autor diferente do verificador), gerar `validation.md` final e atualizar `.specs/STATE.md`.
**Where**: `.specs/features/missao4-capital-politico/validation.md`
**Depends on**: T25
**Reuses**: `.specs/features/missao3-rumo/validation.md` (formato)
**Requirement**: CAP-40

**Tools**: Verifier sub-agent.
**Done when**:
- [ ] `validation.md` tem veredito PASS com evidência `file:line`
- [ ] `validate_state.py` sai com código 0

**Tests**: none
**Gate**: build
**Commit**: `docs(capital): add validação final e handoff da Missão 4`

---

## Test Co-location Validation

| Task | Code layer | Matrix requires | Task Tests | Status |
| ---- | ---------- | --------------- | ---------- | ------ |
| T1, T4, T15 | Lógica pura | unit | unit | OK |
| T3, T25 | Ganchos do legado | unit | unit | OK |
| T21 | Rota de API | unit | unit | OK |
| T5-T8, T10, T11, T13, T14, T17-T19, T22-T24 | Ilhas | e2e | e2e | OK |
| T2, T9, T12, T16, T20, T26 | Config, CSS, gráfico, docs | none | none | OK |

## Requirement Coverage

| Requirement | Tasks |
| ----------- | ----- |
| CAP-01 | T4, T5, T8, T9 |
| CAP-02 | T5, T7, T8 |
| CAP-03 | T1, T6, T8 |
| CAP-04 | T5, T7, T8 |
| CAP-10 | T10, T14 |
| CAP-11 | T11, T14 |
| CAP-12 | T1, T10, T13, T14 |
| CAP-13 | T12, T13, T14 |
| CAP-20 | T15, T17, T19 |
| CAP-21 | T3, T15, T16, T17, T18, T19, T25 |
| CAP-30 | T20, T21, T22, T24 |
| CAP-31 | T15, T22, T23, T24 |
| CAP-32 | T21 |
| CAP-40 | T2, T3, T5, T11, T14, T15, T25, T26 |
