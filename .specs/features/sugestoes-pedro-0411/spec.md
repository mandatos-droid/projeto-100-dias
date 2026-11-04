# Sugestões do Pedro (04/11/2026) — ids 61–86 em `sugestoes`

Fonte: tabela `sugestoes` (Supabase Projeto 100 Dias), todas `resolvida=false`. Prints ficam em base64 no banco; aqui trabalhamos pelo texto.
Camada de testes mínima: `tsc` + `vitest` dos arquivos tocados; sem novo e2e.

## Requisitos (EARS curto)
| ID | Sug | Local | Pedido |
|----|-----|-------|--------|
| R1 | 62 | M1 Persona/2 | A tag "eleito por QP" aparece uma vez só. |
| R2 | 63 | M1 Persona/2 | A caixa amarela do mapa de votos tem altura fixa; não empurra a lista de municípios. |
| R3 | 64 | M1 Persona/2 | Remover o botão "Trocar candidatura". |
| R4 | 65 | M1 Persona/3 | Próximo cargo vira seletor com todos os cargos do Legislativo e do Executivo (até ministro). |
| R5 | 66 | M1 Conjuntura | Grandes números e gênero/cor-raça/mandato ficam no topo, logo abaixo dos filtros. |
| R6 | 67 | M1 Conjuntura | Mapa fixo (sticky) ao lado do gráfico de leque; tabela logo abaixo, com ordenação por coluna. |
| R7 | 70 | M1 Conjuntura/1 | Gráficos legíveis; remover o botão Município (só Estado e Brasil). |
| R8 | 71 | M1 Oportunidades/1 | Manter só os filtros de agenda do topo; remover a visão Nacional. |
| R9 | 72 | M1 Oportunidades/1 | Essa visualização não é filtrada pelas agendas temáticas. |
| R10 | 73 | M1 Frag | Poder marcar gabinete e parlamentar na mesma frase (ambos podem dominar/não dominar). |
| R11 | 74 | M1 Frag | Visualização dos dados mais limpa; botões de filtro no padrão do app. |
| R12 | 75 | M2 Gestão | Remover os horários. |
| R13 | 76 | M2 Gestão | A tela ocupa toda a largura da página. |
| R14 | 77, 61 | M3 Bandeiras/3 | Reestruturar a tela de comissões pelo Guia: tipos no início; registrar qualquer cargo (titular, suplente, presidente, vice…) e vários por comissão. |
| R15 | 78 | M3 Legado | Remover o bloco indicado; texto de instrução (como no manual): o envolvimento do time é essencial. |
| R16 | 79 | M3 Legado | Remover o botão sem função. |
| R17 | 80 | M3 Metas/1 | Objetivos aparecem na árvore do planejamento, com as metas ligadas aos objetivos definidos antes. |
| R18 | 81 | M1 Persona | Os botões (print) valem em todas as missões. |
| R19 | 82 | M4 Comissões | Remover a data. |
| R20 | 83 | M4 Ações | Selecionar e editar registros. |
| R21 | 84 | M4 Métricas | Seletor/botão para tagear manchetes. |
| R22 | 85 | Plano | Atingimento da meta calculado a partir dos sucessos mensais; status (ativa/congelada/não concluída) muda conforme o atingimento. |
| R23 | 86 | Plano | Planejamentos em cards, com editar/excluir. |

## Fora de escopo
Alterar dados do Guia; novos e2e; mudar schema do banco (se R14/R22 pedirem, migration mínima).
