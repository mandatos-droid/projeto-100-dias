#!/usr/bin/env bash
# Mantem a pasta principal igual a origin/main. Rode no FIM de toda tarefa
# (depois do push na main) e no INICIO de toda sessao.
# Uso: bash scripts/sync-principal.sh
set -u
PRINCIPAL="c:/Users/brand/Desktop/Dev Apps/Projeto 100 dias"
cd "$PRINCIPAL" || { echo "ERRO: pasta principal nao encontrada"; exit 1; }
git fetch -q origin || { echo "ERRO: fetch falhou"; exit 1; }

# 1) Alteracoes rastreadas soltas = alguem editou direto na pasta principal.
sujo=$(git status --short -uno | grep -v 'graphify-out' | wc -l)
if [ "$sujo" -gt 0 ]; then
  echo "ATENCAO: a pasta principal tem $sujo arquivo(s) alterado(s) sem commit."
  echo "Nao se edita na pasta principal: use 'git worktree add ../wt-NOME -b fix/NOME origin/main'."
  echo "Nada foi alterado. Revise com 'git status' antes de seguir."
  exit 2
fi

# 2) Na pasta principal so pode haver HEAD solto em origin/main.
atual=$(git rev-parse HEAD); alvo=$(git rev-parse origin/main)
if [ "$atual" != "$alvo" ]; then
  git switch -q --detach origin/main && echo "Pasta principal atualizada para $(git rev-parse --short HEAD)."
else
  echo "Pasta principal ja esta em origin/main ($(git rev-parse --short HEAD))."
fi

# 3) Aviso: branches locais com commits que a main nao tem (trabalho nao publicado).
for b in $(git for-each-ref --format='%(refname:short)' refs/heads); do
  n=$(git cherry origin/main "$b" | grep -c '^+')
  [ "$n" -gt 0 ] && echo "  info: $b tem $n commit(s) fora da main"
done
exit 0
