# Missão 5 · Monitoramento e Feedback conforme a Alana — Design

**Spec**: [spec.md](spec.md) · **Protótipo**: [proposta-alana-tela.html](../missao5-avanco/proposta-alana-tela.html)
Caminhos relativos a `plataforma/`. Os pontos marcados "verificar" foram lidos por cima e devem ser confirmados na T1.

## Decisões de arquitetura

**AD-1. Textos do Guia continuam intocáveis (AD-003 da spec missao5-avanco).**
`conteudo.js`, `guia.js`, `resumo.js` e `nucleo.js` não são editados. Tudo entra em `public/legacy/m5.js` por sobrescrita, como os ganchos que já existem lá.

**AD-2. O Monitoramento reaproveita o campo `CAMPOS_MONIT` e as chaves `mon.<idMeta>.<mes>.<campo>`.**
`CAMPOS_MONIT` é uma variável global de `conteudo.js`. O `m5.js` a reescreve em tempo de execução com um único campo: `['det', 'Detalhamento do mês', '<ajuda>']`.
- O Resumo do Preenchimento (`resumo.js`) e a contagem "em andamento" (`nucleo.js`, `temConteudo`) já leem `mon.*` pelas chaves e por `CAMPOS_MONIT`. Com isso passam a mostrar o texto novo sem editar esses arquivos. Verificar na T1.
- O arquivo `conteudo.js` não muda, então o teste de hash segue passando.
- Os campos antigos (`sucesso`, `result`, `pct`, …) deixam de ser lidos pelo Resumo. Chaves `mon.*` antigas com texto ainda fazem o exercício contar como "em andamento"; o Pedro disse que pode descartar, então não há limpeza.

**AD-3. `Comp.monit` é substituído por inteiro, não embrulhado.**
O hook atual (`m5.js`) embrulha o original e só acrescenta o botão. A nova versão não chama o original e monta: texto novo, passo a passo, botão "Abrir Planejamento Estratégico" e um cartão por meta. O cartão usa as classes que já existem (`din`, `idx`, `campo`, `rot`, `aj`, `rm-st`).

**AD-4. Foco da meta ao ir do Planejamento ao Monitoramento.**
Uma variável global `window.MonitFoco = <idMeta>` é gravada antes de navegar. Depois de renderizar o Monitoramento, o gancho abre a sanfona do mês atual na meta e chama `scrollIntoView`. Sem foco, abre no topo.
- Foco vem de duas fontes: o link "Detalhar no Monitoramento" de cada meta e o botão geral, que usa a última meta cujo status mudou.
- Não usamos o hash para isso: o roteador já usa o final do hash como número do passo (`#/m/5/m5.monit/1`).

**AD-5. O percentual do cartão vem de `lib/atingimento.ts`, só leitura.**
O `m5.js` não importa TypeScript. A ilha do Planejamento grava o percentual (`status` da meta) e o legado o lê de `D.metas[i].status`; o texto "Concluída 60%" sai de uma tabela pequena duplicada no `m5.js`. Alternativa descartada: montar o cartão como ilha React. Ficou fora porque o resto do Monitoramento é HTML do legado e um cartão em React exigiria religar ilhas a cada digitação.
- Verificar na T1 se o percentual de uma meta com sucessos mensais usa `pctMeta` (razão atingidos/total) e não o status; nesse caso o cartão deve mostrar o valor calculado.

**AD-6. Feedback: campos novos na `Conversa`, com os antigos derivados.**
`Conversa` ganha `d1`, `d2`, `a1`, `a2` (strings, opcionais). `destaques` e `ajustes` continuam existindo e são montados a partir dos novos (juntando com quebra de linha), para o Resumo do Guia (`paraGuia`) e os testes atuais seguirem lendo o que já leem. Registros antigos (só `destaques`/`ajustes`) aparecem com `d1`/`a1` preenchidos por esses valores, sem migração gravada.

**AD-7. Acesso não muda.**
O aviso "acesso restrito" é só texto. Nenhum papel, nenhuma política RLS e nenhuma ilha são escondidos.

## Componentes

| Peça | Arquivo | Mudança |
| ---- | ------- | ------- |
| Monitoramento (HTML) | `public/legacy/m5.js` | Reescreve `CAMPOS_MONIT`; substitui `Comp.monit`; trata `MonitFoco`; grava texto por `data-k` (o mesmo `Campos.ligar` do Guia já cuida do salvamento automático) |
| Botão e links no Planejamento | `ilhas/rumo/Plano.tsx`, `ilhas/rumo/ArvorePlano.tsx` | Botão novo no topo (`rm-plano-acoes`); link "Detalhar no Monitoramento" por meta (`extra`); ambos escondidos no plano arquivado |
| Foco da meta | `ilhas/rumo/Plano.tsx` | Guarda a última meta mexida e grava `window.MonitFoco` antes de `location.hash` |
| Texto e formulário do Feedback | `ilhas/rumo/Feedback.tsx`, `ilhas/rumo/feedback.css` | Orientação (#130) e aviso antes do mapa; 6 campos no formulário |
| Modelo da conversa | `lib/feedback.ts` | `d1`, `d2`, `a1`, `a2`; `registra`, `edita`, `migraAntigo`, `paraGuia` ajustados |
| Textos da Alana | `ilhas/rumo/textosAlana.ts` (novo) | Constantes com os textos #128, #129, #130 e #131, copiados como ela escreveu |

## Texto de cada tela

Os textos vêm da tabela `sugestoes` (ids 128, 129, 130, 131) e são copiados sem reescrever. A única exceção é a #130: a linha "Pedro Salvar orientação antes da árvore do organograma" não entra (Q9).

## Riscos

| Risco | Efeito | Tratamento |
| ----- | ------ | ---------- |
| Reescrever `CAMPOS_MONIT` depois de o `resumo.js` já tê-lo lido | Resumo mostraria campos antigos | O `m5.js` carrega depois de `conteudo.js` e `resumo.js` lê a variável no momento do desenho; confirmar na T1 |
| Ilha do Plano ligada duas vezes | Quebra as raízes React (já avisado em `m5.js`) | Botão e links usam só props do componente; nada novo de `Ilhas.ligar` |
| `window.MonitFoco` vaza entre mandatos | Rola para meta que não existe | Limpar depois de usar e ignorar id sem meta |
| Conversas antigas sem `d1`/`a1` | Formulário de edição vazio | Ler `destaques`/`ajustes` como valor inicial de `d1`/`a1` |

## Testes

- `tests/feedback.test.ts`: casos novos de `registra`, `edita`, `paraGuia` e conversa antiga.
- `tests/legado-m5.test.ts`: hash de `conteudo.js` continua igual; teste novo confirma que `CAMPOS_MONIT` tem 1 campo depois do `m5.js`.
- E2E (padrão da rota `app/teste-rumo/*`): ida e volta Planejamento → Monitoramento com foco na meta; digitar na caixa e recarregar; formulário de Feedback com os 6 campos.

## Premissas verificadas (T1)

- `resumo.js:68` e `guia.js:434,445,449` leem `CAMPOS_MONIT` dentro das funções de desenho, então reescrever a variável no `m5.js` (carregado depois) vale para o Resumo e para o Guia.
- `Campos.ligar` (`guia.js:154-166`) grava qualquer `[data-k]` em `D.campos` e chama `Store.salvar()`; as caixas novas usam `data-k`.
- Percentual de meta com sucessos: atingidos sobre o total, com sucesso congelado fora da conta (`lib/sucessos.ts:49`). Sem sucessos, vale o passo de 10% do status.
- `tests/legado-m5.test.ts` tem dois testes do monitoramento antigo (botão acima da tabela original; corpo original inteiro). Eles são atualizados na T3, porque o pedido da Alana substitui esse comportamento.
