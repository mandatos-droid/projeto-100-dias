# Plataforma dos 100 Dias (Next.js)

O Guia original (HTML/JS do mandato) roda **como está**: mesmos estilos, telas, exercícios, resumo e painel.
Os módulos novos da Missão 1 entram dentro dos exercícios como "ilhas" React:

| Exercício | Módulo novo |
|---|---|
| A persona · pergunta 2 | Desempenho eleitoral 2026 (TSE): votos, %, ranking |
| A conjuntura · pergunta 1 | Hemiciclo da Casa, filtro por partido, parceiro/concorrente |
| A conjuntura · pergunta 2 | Mapa de calor municipal (2026 e 2024) e cadeiras por partido |
| A conjuntura · pergunta 3 | Município: prefeito, vereadores, deputados, parceiro/concorrente |
| Cadastro do mandato | Caixa de seleção de parlamentares eleitos (preenche nome, partido e Casa) |

No **Resumo**, cada pergunta é um link para a sua página no exercício, e os mapas (calor do partido,
político do estado, hemiciclo) aparecem sob as respostas (`ilhas/Resumos.tsx`). As escolhas feitas nos mapas
ficam em `D.calor`, `D.munSel` e `D.casaSel`.

## Rodar
    npm install
    npm run dev        # http://localhost:3000   (painel: /painel)

## Estrutura
- `scripts/extrair_legado.py`: extrai CSS, scripts, logos e painel do HTML original (`../contexto inicial`) para `public/legacy`
  aplicando 7 retoques conferidos. Se o HTML original mudar, rode de novo.
- `public/legacy/novos.js`: escrito à mão (seleção no cadastro e blocos do Resumo). `ilhas.css`: estilo dos módulos.
- `ilhas/`: componentes React; `ilhas/ponte.tsx` liga o React ao estado do Guia (`D` e `Store`).
- Os dados novos ficam em `D.tse` (candidatura vinculada) e `D.relacoes` (parceiros/concorrentes), dentro do mesmo JSON do mandato.
- `python scripts/build_eleitos.py`: gera `public/data/eleitos.json` (todos os eleitos + gênero, cor/raça e reeleição, via dados abertos do TSE).
- `npm run dados`: gera `public/data` e `public/geo` (TSE 2026 e 2024).

## Limites conhecidos
- RO: TSE ainda marca "aguardando reprocessamento"; rodar `npm run dados -- --refresh` depois.
- Senado: só os eleitos em 2026. Município: 6 deputados mais votados por município. Votos de partido = nominais.
- O painel não exibe ainda os dados novos (parceiros/concorrentes).
