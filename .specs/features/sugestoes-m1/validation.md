# Validação · sugestoes-m1 (SUG-16 a SUG-23)

**Veredito: PASS** (com lacunas de precisão e de cobertura listadas abaixo, nenhuma bloqueante)

Verificador independente (autor != verificador). Faixa de diff da feature: `5acc0d3..bdbcf40`, restrita a `.specs/features/sugestoes-m1/`, `plataforma/public/legacy/m1.js`, `plataforma/public/legacy/ilhas.css`, `plataforma/ilhas/Assentos.tsx`, `plataforma/ilhas/Conjuntura.tsx`, `plataforma/app/guia/page.tsx`, `plataforma/tests/legado-m1.test.ts` e `plataforma/e2e/m1-*.spec.ts`. Os arquivos `plataforma/ilhas/capital/*` aparecem no mesmo intervalo, mas são da M4 e ficam fora desta validação.

## Execução

| Comando | Resultado |
| ------- | --------- |
| `cd plataforma && npm test` | 532 testes, 532 pass, 0 fail |
| `npx playwright test e2e/m1-` | 20 testes. Na 1ª rodada 16 pass e 4 fail, todos por `ENOENT` em `test-results/.playwright-artifacts-*` (colisão com a execução completa em paralelo na mesma pasta, não falha de asserção). Reexecutados com `--output` próprio: 3 dos 4 passaram; `m1-persona.spec.ts:19` (poll de `m1.q3b`) falhou uma vez por timeout sob carga e passou na reexecução isolada (3/3). Resultado final: 20/20 verdes, com 1 flake de timing registrado |

## Evidência por AC (valor assertado vs. resultado definido na spec)

| AC | Teste unit | Teste e2e | Confere com a spec? |
| -- | ---------- | --------- | ------------------- |
| SUG-16 duas caixas, rótulos e chaves `m1.q3` / `m1.q3b`, sem caixa única | `plataforma/tests/legado-m1.test.ts:44-49` (chaves `['m1.q3','m1.q3b']`, dois rótulos literais), `:51-55` (depois de "Mapeie", sem `<label class="campo"></label>`), `:57-62` (modo "ver tudo") | `plataforma/e2e/m1-persona.spec.ts:12-21` | Sim: rótulos literais iguais aos da spec |
| SUG-17 instrução sem "100 primeiros dias" e sem "agendas similares" | `plataforma/tests/legado-m1.test.ts:70-75` | `plataforma/e2e/m1-conjuntura.spec.ts:10-15` | Sim. A frase é checada do meio ("nesta legislatura, a partir dos dados expostos abaixo. Em seguida, ...") e não a instrução inteira |
| SUG-17 orientação Parceiro/Concorrente e caixa `m1.q4b` abaixo da tabela | `plataforma/tests/legado-m1.test.ts:77-85` (posição depois da ilha, pergunta das pontes por prefixo, chave `m1.q4b`), `:87-90` | `plataforma/e2e/m1-conjuntura.spec.ts:16-19` (caixa abaixo da ilha), `:21-27` (grava `m1.q4b`) | Parcial: só "Marque na tabela acima" é assertado; "região, perfil pessoal e disputa partidária" não é (mutante M13 sobrevive) |
| SUG-18 tabela inteira sem rolagem | n/a (CSS) | `plataforma/e2e/m1-conjuntura.spec.ts:81-93` (linhas == total, `max-height: none`, `scrollHeight/Width` <= 1 px) | Sim |
| SUG-19 `m1.q5`: ordem título, texto, dados, caixa e comando | `plataforma/tests/legado-m1.test.ts:95-105`, `:107-112` (temas do original) | `plataforma/e2e/m1-conjuntura.spec.ts:38-44` | Sim, menos o "título em negrito" (não assertado) |
| SUG-19 `m1.q6` e `m1.q8` com o comando depois dos dados | `plataforma/tests/legado-m1.test.ts:114-122` | `plataforma/e2e/m1-conjuntura.spec.ts:46-53` | Sim |
| SUG-20 seções relação e desafios fora; `D.conj2` intacto | n/a | `plataforma/e2e/m1-conjuntura.spec.ts:59-65` (3 textos ausentes), `:67-74` (`conj2` igual a `CONJ2` após editar) | Sim |
| SUG-21 4 etapas na ordem, 1 só `aria-current="step"` | `plataforma/tests/legado-m1.test.ts:160-167`, `:169-171` (título "As fragilidades e fortalezas") | `plataforma/e2e/m1-etapas.spec.ts:8-17` (4 exercícios, ordem, 1 atual), `:19-24`, `:26-31` (sem faixa nas M2 e M3) | Sim |
| SUG-22 `m1.frag` com 1 passo, comando e checklist juntos | `plataforma/tests/legado-m1.test.ts:138-143` | `plataforma/e2e/m1-frag.spec.ts:6-18` (`1 de 1`) | Sim |
| SUG-23 bloco "Tornando fragilidades em fortalezas!", link `#/biblioteca`, sem "Para fechar" | `plataforma/tests/legado-m1.test.ts:145-157` | `plataforma/e2e/m1-frag.spec.ts:12-17`, `:20-24` | Sim; o "texto completo da Alana" é checado só por 2 fragmentos |

### Edge Cases

| Edge case | Evidência |
| --------- | --------- |
| Respostas antigas de `m1.q3`, `m1.q4`, `m1.q5` preservadas | `plataforma/e2e/m1-persona.spec.ts:23-28`, `plataforma/e2e/m1-conjuntura.spec.ts:21-27`, `:38-44` |
| Resposta antiga de `m1.q6` preservada | Sem teste (ver lacunas) |
| `D.conj2.relacao/relacaoPq/desafios/oportunidades` intactos | `plataforma/e2e/m1-conjuntura.spec.ts:57`, `:67-74` |
| Resumo mostra `m1.q3b` e `m1.q4b` | `plataforma/tests/legado-m1.test.ts:185-192`, `:194-199`; `plataforma/e2e/m1-persona.spec.ts:30-34` (só `m1.q3b`) |
| "Brasil inteiro" mantém "Mostrar mais" | `plataforma/e2e/m1-conjuntura.spec.ts:95-101` |

## Sensor de discriminação (testes unitários)

Cópias isoladas de `m1.js`, `conteudo.js`, `guia.js`, `resumo.js` e `legado-m1.test.ts` no scratchpad, com a mesma estrutura de pastas; cada mutante aplicado sobre `plataforma/public/legacy/m1.js` (cópia, linhas citadas do original) e a cópia descartada. 17 mutantes: 15 mortos, 2 sobreviventes.

| Mutante | Linha de m1.js | Resultado | Teste que mata |
| ------- | -------------- | --------- | -------------- |
| M1 chave `m1.q3b` trocada | 21 | morto (3) | `legado-m1.test.ts:44`, `:57`, `:185` |
| M2 `depois:true` removido de q5/q6/q8 | 39 | morto (2) | `:95`, `:114` |
| M3 `.replace(vazio,'')` removido | 53, 55 | morto (1) | `:51` |
| M4 diagFrag/fim invertidos | 97 | morto (1) | `:154` |
| M5 faixa marca duas etapas | 113 | morto (1) | `:160` |
| M6 texto dos 100 dias de volta | 26 | morto (1) | `:70` |
| M7 `m1.frag` volta a ter vários passos | 91 | morto (2) | `:138`, `:145` |
| M8 link da Biblioteca trocado | 86 | morto (1) | `:145` |
| M9 `resumo` de `m1.q4b` removido | 28 | morto (1) | `:185` |
| M10 `aria-current` removido | 114 | morto (1) | `:160` |
| M11 comando da análise alterado | 34 | morto (2) | `:95`, `:114` |
| M12 ordem das etapas trocada | 110 | morto (1) | `:160` |
| M13 trecho "região, perfil pessoal e disputa partidária" removido | 29 | **sobrevive** | nenhum |
| M14 "agendas similares ou concorrentes" reinserido na orientação | 29 | morto (1) | `:70` |
| M15 `q3.depois=true` | 19 | **sobrevive** (provavelmente equivalente: `m1.q3` não tem ilha, então `injeta` cai no mesmo caminho) | nenhum |
| M16 tema "setoriais e diretórios" removido de q5 | 36 | morto (1) | `:107` |
| M17 mecanismo só vale fora da Missão 1 | 61 | morto (4) | `:44`, `:77`, `:95`, `:114` |

Working tree real: `git status --porcelain` idêntico antes e depois do sensor (mesmo hash); nada foi escrito fora do scratchpad.

## Lacunas ranqueadas

1. Média: M13 sobrevive. A orientação "considerando a região, o perfil pessoal e a disputa partidária" (SUG-17 AC3) não é assertada em unit nem em e2e (`legado-m1.test.ts:77-85`, `m1-conjuntura.spec.ts:15`). Basta incluir a frase no teste.
2. Média: a spec não traz o texto da Alana de SUG-23 nem o rótulo completo de `m1.q4b` por extenso nos testes. O bloco é validado por 2 fragmentos (`legado-m1.test.ts:149-150`) e a pergunta das pontes só por prefixo (`:83`). Uma edição no meio desses textos passa. A fonte de verdade está nos prints, não na spec.
3. Baixa: edge case "resposta antiga de `m1.q6` preservada" não tem teste (a spec cita `m1.q6`; só q3, q4 e q5 têm). O comportamento vem do mesmo `injeta`, então o risco é pequeno.
4. Baixa: SUG-19 pede "título em negrito" e nenhum teste confere o negrito.
5. Baixa: imprecisão de rotas na spec. A SUG-16 usa `m1.persona/3` para "pergunta 3" (índice 1-based no e2e `m1-persona.spec.ts:13`, mas o unit usa `n=2`, 0-based, em `legado-m1.test.ts:45`), enquanto SUG-19 usa `m1.conjuntura/1` para "pergunta 2" (0-based). A spec mistura as duas contagens.
6. Baixa: o Resumo de `m1.q8a` ("Análise da conjuntura social", `m1.js:40`) não tem teste; a spec só exige `m1.q3b` e `m1.q4b`.
7. Baixa (processo): 1 flake de timing em `m1-persona.spec.ts:19` quando rodou concorrente com a suíte completa; 3 falhas `ENOENT` em `test-results/` por colisão de execuções paralelas (não é defeito da feature).
8. Informativa: M15 sobrevive por ser provavelmente mutante equivalente; não exige ação.
