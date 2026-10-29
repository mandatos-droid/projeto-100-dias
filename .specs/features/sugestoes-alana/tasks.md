# Sugestões da Alana (tabela `sugestoes`, 21–22/10/2026) · Tasks

**Origem**: 13 envios no app; #1, #2 e #12 são testes do Pedro e foram ignorados. Os ids abaixo são os da tabela.
**Contexto importante**: as sugestões #3–#11 foram feitas em 21/10 sobre a tela antiga da Missão 3 (mural em texto livre). A ilha nova `ilhas/rumo/Bandeiras.tsx` entrou em 23/10 e já cobre parte dos pedidos. Cada bloco diz o que já existia e o que falta.

Caminhos relativos a `plataforma/`. Regras do repo: commits atômicos com `git add` nominal (há mudanças do usuário não commitadas em `guia.js`, `novos.js`, `cadastro.js` etc.), textos do Guia só mudam com hash atualizado de propósito, `graphify update .` ao final.

---

## Bloco A · Vocabulário (#9, #13)

| Task | Pedido | O que fazer | Teste |
| ---- | ------ | ----------- | ----- |
| A1 | #9 | Na tela de agendas da Missão 3 (`ilhas/rumo/Bandeiras.tsx`, `lib/criterios.ts`, `ilhas/rumo/Espacos.tsx`): trocar "bandeira(s)" por "agenda(s)" em rótulos, placeholders, avisos e `aria-label`. O Guia anterior à tela (`conteudo.js`) mantém "bandeira" de propósito, para quem usa essa palavra. | `e2e/rumo-bandeiras.spec.ts`, `tests/criterios.test.ts` com os textos novos |
| A2 | #13 | Trocar "o parlamentar" por "a liderança parlamentar" nos textos que se referem à pessoa: `public/legacy/conteudo.js` (poucos trechos que sobraram, mais "Lidera/Participam: Parlamentar") e `lib/equipe.ts`. Não mexer em "parlamentares eleitos(as)" (plural genérico), "Preditores de Sucesso Parlamentar" (nome do conceito), "atuação/mandato parlamentar". Atualizar os hashes de `tests/legado-m2/m3/m4.test.ts` de propósito. | `npm test` |

## Bloco B · Passos e ordem da tela de agendas (#8, #10, #11)

| Task | Pedido | O que fazer | Teste |
| ---- | ------ | ----------- | ----- |
| B1 | #8, #10 | Mostrar "Como conduzir" (Primeiro/Segundo/Terceiro passo) também no passo da ilha, acima do mural, num bloco recolhível. O texto vem de `ex.passos`, sem copiar nem editar. Os textos ficam, porque o Guia é autoaplicável. | `tests/legado-m3.test.ts` (novo caso) |
| B2 | #8, #11 | "No futuro" (`ex.fim`) vem antes de "Comissões e espaços": ordem dos passos `intro, componente, fim, listaExtra`. | `tests/legado-m3.test.ts` (ordem muda) |

## Bloco C · Agendas em quadradinhos (#3, #4, #5, #6)

| Task | Pedido | O que fazer | Teste |
| ---- | ------ | ----------- | ----- |
| C1 | #3 | A caixa "Exemplos de agendas e bandeiras" vira quadradinhos separados na hora de exibir (`public/legacy/m3.js` transforma o HTML do `.apoio.exemplo`; o texto do `conteudo.js` não muda). Estilo em `ilhas/rumo/rumo.css`. | `tests/legado-m3.test.ts` |
| C2 | #4, #5, #6 | **Já atendidos pela ilha nova**: marcar todas as agendas levantadas (chips), um card por agenda com campo de argumentos e o ranking com as selecionadas na etapa das três finais. Só confirmar no navegador e deixar registrado. | `e2e/rumo-bandeiras.spec.ts` (já cobre) |

## Bloco D · Ordem de prioridade escolhida pela equipe (#7)

| Task | Pedido | O que fazer | Teste |
| ---- | ------ | ----------- | ----- |
| D1 | #7 | `lib/criterios.ts`: `movePrioritaria(rumo, id, 'cima' ou 'baixo')` troca a posição (1º, 2º, 3º) entre prioritárias. Hoje a posição é a ordem de confirmação e não dá para mudar. | `tests/criterios.test.ts` |
| D2 | #7 | No ranking, botões "Subir" e "Descer" nas prioritárias, com o selo "1º/2º/3º". | `e2e/rumo-bandeiras.spec.ts` |

## Ordem de execução

A2 (isolado, mexe em hash) → B1+B2 → C1 → D1+D2 → A1 (por último, porque renomeia strings que os outros testes usam) → `graphify update .`.
