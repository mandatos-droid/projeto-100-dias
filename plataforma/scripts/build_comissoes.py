#!/usr/bin/env python3
"""Gera public/data/comissoes/br.json: as comissões permanentes da Câmara dos Deputados (nome e sigla).

Fonte (API de dados abertos da Câmara, conferida em 2026-10-23):
  https://dadosabertos.camara.leg.br/api/v2/orgaos?codTipoOrgao=2
  codTipoOrgao=2 é "Comissão Permanente" (https://dadosabertos.camara.leg.br/api/v2/referencias/orgaos/codTipoOrgao).
  Resposta: {"dados": [{"id", "sigla", "nome", "apelido", "codTipoOrgao", "tipoOrgao", ...}], "links": [{"rel", "href"}]};
  a paginação segue o link rel="next".

Só nome e sigla vão para o arquivo (nada de pessoa ou contato). Se a fonte não responder ou vier sem comissões,
o script falha com mensagem e NÃO grava arquivo. Um public/data/comissoes/{uf}.json do mesmo formato
({gerado, fonte, comissoes: [{nome, sigla}]}) é aceito pela ilha de espaços; este script não gera os de UF.
Só biblioteca padrão. Cache bruto em scripts/.cache (fora do git); use --refresh para baixar de novo.
"""
import json, sys, urllib.request
from datetime import datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CACHE = Path(__file__).resolve().parent / '.cache' / 'camara_comissoes_permanentes.json'
SAIDA = RAIZ / 'public' / 'data' / 'comissoes' / 'br.json'
URL = 'https://dadosabertos.camara.leg.br/api/v2/orgaos?codTipoOrgao=2&itens=100&pagina=1&ordem=ASC&ordenarPor=sigla'
FONTE = 'https://dadosabertos.camara.leg.br/api/v2/orgaos?codTipoOrgao=2'
MINIMO = 20


def baixa(url):
    req = urllib.request.Request(url, headers={'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode('utf-8'))


def todas():
    dados, url = [], URL
    while url:
        pag = baixa(url)
        dados += pag.get('dados', [])
        url = next((l['href'] for l in pag.get('links', []) if l.get('rel') == 'next'), None)
    return dados


def main():
    try:
        if '--refresh' in sys.argv or not CACHE.exists():
            bruto = todas()
            CACHE.parent.mkdir(parents=True, exist_ok=True)
            CACHE.write_text(json.dumps(bruto, ensure_ascii=False), encoding='utf-8')
        else:
            bruto = json.loads(CACHE.read_text(encoding='utf-8'))
    except Exception as e:  # rede, JSON inválido, etc.
        sys.exit(f'build_comissoes: a fonte não respondeu ({e}). Nada foi gravado.')
    vistos, comissoes = set(), []
    for o in bruto:
        if o.get('codTipoOrgao') != 2:
            continue
        nome, sigla = (o.get('nome') or '').strip(), (o.get('sigla') or '').strip()
        if nome and sigla and sigla not in vistos:
            vistos.add(sigla)
            comissoes.append({'nome': nome, 'sigla': sigla})
    if len(comissoes) < MINIMO:
        sys.exit(f'build_comissoes: a fonte trouxe {len(comissoes)} comissões permanentes (mínimo {MINIMO}). Nada foi gravado.')
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps({'gerado': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'fonte': FONTE, 'comissoes': comissoes}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'{len(comissoes)} comissões permanentes em {SAIDA}')


if __name__ == '__main__':
    main()
