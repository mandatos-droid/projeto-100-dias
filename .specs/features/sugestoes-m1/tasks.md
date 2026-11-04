# Sugestões da Missão 1 (#16 a #23) · Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path.

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/sugestoes-m1/spec.md`
**Design**: nenhum (mudança de texto e de ordem sobre mecanismos que já existem; o desenho está nas Assumptions da spec)
**Status**: Implementado (T1 a T8); verificação pendente

Caminhos relativos a `plataforma/`. A árvore de trabalho tem mudanças do usuário não commitadas (`public/legacy/sugestoes.js`, `public/legacy/ilhas.css`, `graphify-out/`, `contexto inicial/`, `.vscode/`, `Alterador/`). Regras:

1. Cada commit usa `git add` com os arquivos nomeados da tarefa; nunca `git add -A`. Não commitar as mudanças do usuário em `sugestoes.js` e `ilhas.css` (T5 mexe em `ilhas.css`: usar `git diff` antes e `git add -p` só do trecho próprio).
2. `conteudo.js`, `guia.js`, `app.js`, `nucleo.js` e `resumo.js` não são editados (AD-003); ganchos novos ficam em `public/legacy/m1.js`.
3. Dados novos só em `D.campos` (`m1.q3b`, `m1.q4b`, `m1.q8a`); nada do que já está salvo é apagado.
4. `git push`, deploy e escrita na tabela `sugestoes` exigem go-ahead explícito; não fazem parte destas tarefas.
5. Rodar o Python do projeto por `C:\Users\brand\AppData\Roaming\uv\tools\graphifyy\Scripts\python.exe`.

---

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Ganchos do legado (`public/legacy/m1.js`) | unit (`node:vm` com globais simuladas) | Cada override: entrada antiga e nova; texto comparado com o esperado na spec | `tests/legado-m1.test.ts` | `npm test` |
| Ilhas React (`ilhas/*.tsx`) e telas do Guia | e2e (`abreGuia` de `e2e/guia-real.ts`) | Caminho feliz de cada requisito + cada edge case da spec | `e2e/m1-*.spec.ts` | `npx playwright test e2e/m1-` |
| Resumo (`novos.js`) | unit (vm) | Chaves novas aparecem | `tests/legado-m1.test.ts` | `npm test` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tarefas só com unit | `npm test` |
| Full | Tarefas com e2e | `npm test && npx tsc --noEmit && npx playwright test e2e/m1-` |

---

## Execution Plan

### Phase 1: Textos e caixas da Persona e da Conjuntura

```
T1 → T2 → T3 → T4
```

### Phase 2: Telas

```
T4 → T5 → T6 → T7
```

### Phase 3: Fechamento

```
T7 → T8
```

---

## Task Breakdown

### T1: Gancho `m1.js` e as duas caixas da pergunta 3 da Persona ✅

**What**: Criar `public/legacy/m1.js` (carregado depois de `m5` em `app/guia/page.tsx`) com o mecanismo `caixas` por item de pergunta: `Guia.bloco` e `Comp.perguntas` trocam a caixa única do item pelas caixas dele (rótulo + `textarea data-k`), antes ou depois da ilha. Aplicar a `m1.q3`: duas caixas (`m1.q3`, `m1.q3b`).
**Where**: `public/legacy/m1.js`, `app/guia/page.tsx`, `tests/legado-m1.test.ts`, `e2e/m1-persona.spec.ts`
**Depends on**: None
**Reuses**: padrão de `public/legacy/m3.js` (override sobre `Guia`/`Comp`)
**Requirement**: SUG-16

**Done when**:

- [x] Em `m1.persona/2` aparecem, depois do texto "Mapeie", as duas perguntas da Alana, cada uma com sua caixa, e não há a caixa única antiga (SUG-16)
- [x] Resposta antiga de `m1.q3` aparece na primeira caixa; digitar na segunda grava `m1.q3b` (edge case)
- [x] Gate: `npm test && npx tsc --noEmit && npx playwright test e2e/m1-persona`

**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(m1): duas caixas na pergunta sobre o futuro da liderança (sugestão #16)`

---

### T2: Pergunta 1 da Conjuntura (legislatura): texto e pontes não óbvias ✅

**What**: Em `m1.js`, trocar o texto de `m1.q4` (sem "Quando passarem-se os 100 primeiros dias" e sem "agendas similares ou concorrentes") e abrir, depois do mapa e da tabela, a orientação de marcar Parceiro/Concorrente e a caixa `m1.q4b` das pontes não óbvias.
**Where**: `public/legacy/m1.js`, `tests/legado-m1.test.ts`, `e2e/m1-conjuntura.spec.ts`
**Depends on**: T1
**Reuses**: mecanismo `caixas` com `depois: true` (T1)
**Requirement**: SUG-17

**Done when**:

- [x] O texto da pergunta é o da SUG-17 e não contém "100 primeiros dias" nem "agendas similares" (SUG-17)
- [x] Depois da ilha aparece a orientação de marcar Parceiro/Concorrente e a caixa `m1.q4b` com a pergunta das pontes (SUG-17)
- [x] Digitar na caixa grava `m1.q4b`
- [x] Gate: `npm test && npx tsc --noEmit && npx playwright test e2e/m1-conjuntura`

**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(m1): legislatura com dados primeiro e pontes não óbvias (sugestão #17)`

---

### T3: Padrão "texto, dados, caixa de análise" em partido, território e social ✅

**What**: Em `m1.js`, reescrever o texto de `m1.q5` (frase que termina em "é fundamental para a compreensão…") e dar a `m1.q5`, `m1.q6` e `m1.q8` a caixa de análise depois da ilha, com o comando da SUG-19 (`m1.q5`, `m1.q6`, `m1.q8a`).
**Where**: `public/legacy/m1.js`, `tests/legado-m1.test.ts`, `e2e/m1-conjuntura.spec.ts`
**Depends on**: T2
**Reuses**: mecanismo `caixas` (T1)
**Requirement**: SUG-19

**Done when**:

- [x] `m1.q5` mostra título, texto novo, dados e a caixa nessa ordem; a caixa traz o comando da SUG-19 (SUG-19)
- [x] `m1.q6` e `m1.q8` mostram a caixa com o mesmo comando depois dos dados (SUG-19)
- [x] Resposta antiga de `m1.q5` e `m1.q6` aparece na caixa (edge case)
- [x] Gate: `npm test && npx tsc --noEmit && npx playwright test e2e/m1-conjuntura`

**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(m1): caixa de análise depois dos dados em partido, território e social (sugestões #19, #20)`

---

### T4: Tirar relação e desafios da tela do partido ✅

**What**: Em `ilhas/Conjuntura.tsx`, remover do JSX as seções 5 (relação com o partido) e 6 (desafios e oportunidades). `D.conj2` e seus campos ficam como estão.
**Where**: `ilhas/Conjuntura.tsx`, `e2e/m1-conjuntura.spec.ts`
**Depends on**: T3
**Reuses**: nenhum
**Requirement**: SUG-20

**Done when**:

- [x] A tela de `m1.q5` não mostra "Que relação a liderança quer ter com o partido?" nem "Desafios e oportunidades de expansão da relevância partidária" (SUG-20)
- [x] Mandato com `conj2.relacao`, `relacaoPq` e `desafios` salvos continua com os valores iguais depois de abrir e editar a tela (edge case)
- [x] Gate: `npx tsc --noEmit && npx playwright test e2e/m1-conjuntura`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m1): só a pergunta abrangente na conjuntura do partido (sugestão #20)`

---

### T5: Tabela de eleitos completa ✅

**What**: Em `ilhas/Assentos.tsx` e `public/legacy/ilhas.css`, tirar a rolagem interna da tabela de eleitos e mostrar todas as linhas do escopo de um estado; "Brasil inteiro" mantém "Mostrar mais".
**Where**: `ilhas/Assentos.tsx`, `public/legacy/ilhas.css`, `e2e/m1-conjuntura.spec.ts`
**Depends on**: T4
**Reuses**: nenhum
**Requirement**: SUG-18

**Done when**:

- [x] Com SP selecionado, a tabela mostra todas as linhas e o contêiner não rola (`scrollHeight <= clientHeight` e `scrollWidth <= clientWidth`) em 1280 px (SUG-18)
- [x] Com "Brasil inteiro" o botão "Mostrar mais" continua (edge case)
- [x] Gate: `npx tsc --noEmit && npx playwright test e2e/m1-conjuntura`

**Tests**: e2e
**Gate**: full
**Commit**: `feat(m1): tabela de eleitos inteira, sem rolagem interna (sugestão #18)`

---

### T6: Fragilidades e fortalezas numa página só ✅

**What**: Em `m1.js`, `Guia.montar` do exercício `m1.frag` devolve um passo só; o bloco renderiza comando, checklist, diagnóstico e o bloco "Tornando fragilidades em fortalezas!" com link para `#/biblioteca`. O título do exercício passa a "As fragilidades e fortalezas".
**Where**: `public/legacy/m1.js`, `tests/legado-m1.test.ts`, `e2e/m1-frag.spec.ts`
**Depends on**: T5
**Reuses**: `Comp.frag`, `Comp.diagFrag` (`guia.js`)
**Requirement**: SUG-22, SUG-23

**Done when**:

- [x] `m1.frag` tem 1 passo e mostra comando e checklist juntos (SUG-22)
- [x] Depois do checklist aparece "Tornando fragilidades em fortalezas!" com o texto da Alana e o link `#/biblioteca`; não existe o passo "Para fechar" (SUG-23)
- [x] Marcar M/P numa fragilidade continua gravando em `D.frags`
- [x] Gate: `npm test && npx tsc --noEmit && npx playwright test e2e/m1-frag`

**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(m1): fragilidades e plano de estudo numa página só, com link da Biblioteca (sugestões #22, #23)`

---

### T7: Faixa das 4 etapas do Mapa Político ✅

**What**: Em `m1.js`, envolver `Guia.render` para, na Missão 1, inserir antes da etiqueta a faixa com as 4 etapas e a atual com `aria-current="step"`; estilo em `public/legacy/ilhas.css`.
**Where**: `public/legacy/m1.js`, `public/legacy/ilhas.css`, `tests/legado-m1.test.ts`, `e2e/m1-etapas.spec.ts`
**Depends on**: T6
**Reuses**: `Guia.render` (`guia.js`)
**Requirement**: SUG-21

**Done when**:

- [x] Em cada exercício da Missão 1 a faixa mostra "A Persona", "A Conjuntura", "As Oportunidades e Ameaças" e "As Fragilidades e Fortalezas", com a etapa atual marcada (SUG-21)
- [x] Nas Missões 2 a 5 a faixa não aparece
- [x] Gate: `npm test && npx tsc --noEmit && npx playwright test e2e/m1-etapas`

**Tests**: unit + e2e
**Gate**: full
**Commit**: `feat(m1): faixa com as 4 etapas do Mapa Político (sugestão #21)`

---

### T8: Resumo com as respostas novas ✅

**What**: Em `m1.js`, fazer o Resumo da Missão 1 mostrar `m1.q3b`, `m1.q4b` e `m1.q8a` (o `novos.js` não é editado).
**Where**: `public/legacy/m1.js`, `tests/legado-m1.test.ts`
**Depends on**: T7
**Reuses**: `Resumo.ex` (`resumo.js`)
**Requirement**: SUG-16, SUG-17

**Done when**:

- [x] O Resumo mostra "Próximo cargo desejado" (`m1.q3b`) e "Pontes não óbvias" (`m1.q4b`) quando preenchidas (edge case)
- [x] Gate: `npm test`

**Tests**: unit
**Gate**: quick
**Commit**: `feat(m1): resumo mostra próximo cargo e pontes não óbvias`
