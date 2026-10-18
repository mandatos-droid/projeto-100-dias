# Guia rápido: API de resultados do TSE

Contexto para outro projeto. A API é **não documentada oficialmente**: são os JSONs estáticos que alimentam o site `resultados.tse.jus.br`. Funciona sem chave nem login.

## URL base

```
https://resultados.tse.jus.br/oficial/ele{ANO}/{CICLO}/...
```

- `{ANO}`: ano da eleição (`ele2022`, `ele2024`, ...).
- `{CICLO}`: código do turno/pleito, com 6 dígitos nos nomes de arquivo (`e000619`).

| Eleição | Ano | Ciclo | Status (testado em 2026-10-13) |
|---|---|---|---|
| Municipal 1º turno | 2024 | `619` | OK |
| Municipal 2º turno | 2024 | `620` | OK (config só lista municípios com 2º turno) |
| Geral 1º turno | 2022 | `544` | **404 em todos os caminhos testados** |
| Geral 2º turno | 2022 | `545` | **404 em todos os caminhos testados** |
| Projeto atual (1º/2º) | 2026 | `6257`/`6259` | OK (ver `dados/logs/download.log`) |

> **2024 está disponível.** **2022 não está neste host**: os caminhos `ele2022/...` retornam 404 (NoSuchKey).
> Para 2022 e anos anteriores, use os dados abertos em CSV (seção final).

## Cabeçalho obrigatório

Envie um `User-Agent` de navegador, senão pode haver bloqueio:

```
curl -A "Mozilla/5.0" "<url>"
```

## Endpoints

### 1. Lista de municípios (config)

```
/oficial/ele2024/619/config/mun-e000619-cm.json
```

Estrutura: `abr[]` (UF) → `mu[]` (município) com:
- `cd`: código TSE do município (5 dígitos, ex. `01120`). **Não é o código IBGE.**
- `cdi`: código IBGE de 7 dígitos (ex. `1200013`). Use para cruzar com malhas/mapas.
- `nm`: nome; `z`: zonas eleitorais.

### 2. Resultado de um município por cargo

```
/oficial/ele2024/619/dados/{uf}/{uf}{cdMun}-c{cargo}-e000619-u.json
```

Exemplo (prefeito de São Paulo): `.../dados/sp/sp71072-c0011-e000619-u.json`

Códigos de cargo (`c`): `0001` presidente, `0003` governador, `0005` senador, `0006` dep. federal, `0007` dep. estadual, `0011` prefeito, `0013` vereador.

Campos principais do JSON:
- Cabeçalho: `ele` (ciclo), `t` (turno), `cdabr` (cód. município), `dt`/`ht` (data/hora da totalização).
- `carg[]` → cargo (`cd`, `nmn`, `nv` = nº de vagas).
- `agr[]` → agremiações → `par[]` → partidos → `cand[]` → candidatos.
- Candidato: `n` (número), `nm`/`nmu` (nome/nome de urna), `st` (situação: "Eleito", "Não eleito"...), `e` (`s`/`n` eleito), `vap` (votos nominais, **string**), `pvap` (% votos, string com vírgula), `vs[]` (vice).
- Partido: `sg` (sigla), `tvtn` (votos totais), `tvan` (votos anulados/nominais).

### 3. Por estado / Brasil (agregado)

Testado e funcionando:

```
/oficial/ele2024/619/dados/sp/sp-e000619-ab.json         # estado, todos os cargos (537 KB)
/oficial/ele2026/6259/dados/sp/sp-c0003-e006259-u.json   # estado, um cargo (governador)
/oficial/ele2026/6257/dados/br/br-c0001-e006257-u.json   # Brasil, presidente
```

Não funcionam em 2024: `sp-c0011-...-u.json` (prefeito é só por município) e `br-c0011-...-u.json` (404).

Padrão: `{abr}-c{cargo}-e{ciclo6d}-u.json`, onde `abr` é `br`, uma UF (`sp`) ou `{uf}{cdMun}`.

## Pegadinhas

1. **Números vêm como string**, com vírgula decimal no `pvap` (`"1,38"`). Use `pvapn` (`"1,378479243"`, ponto decimal) para percentual numérico.
2. `dg`/`hg` no cabeçalho é a data de geração do arquivo, não a da eleição. Para a totalização use `dt`/`ht`.
3. Código TSE ≠ IBGE. Faça o de-para via `cdi` no arquivo de config.
4. Arquivos de **boletim de urna** (`arquivo-urna/...`): o caminho de 2026 existe; o de 2024 que tentei deu 404 (ciclo/caminho não confirmado). Descubra pela aba Network.
5. Para coleta em massa (5.570 municípios): use pausa de ~1 s entre requests, registre log e faça retry em 429/5xx. Dados de eleição encerrada são estáticos: baixe uma vez e guarde em disco.
6. A API de resultado dá o líder/votos por candidato **por município**; não há votos por seção/local nesses JSONs (para isso, use os dados abertos em CSV: `dadosabertos.tse.jus.br`).

## Exemplo mínimo (Python)

```python
import requests, time

H = {"User-Agent": "Mozilla/5.0"}
BASE = "https://resultados.tse.jus.br/oficial/ele2024/619"

cfg = requests.get(f"{BASE}/config/mun-e000619-cm.json", headers=H).json()
for uf in cfg["abr"]:
    for mu in uf["mu"][:2]:                      # limite p/ teste
        url = f"{BASE}/dados/{uf['cd']}/{uf['cd']}{mu['cd']}-c0011-e000619-u.json"
        r = requests.get(url, headers=H)
        if r.status_code != 200:                 # município sem prefeito (ex.: DF) ou sem 2º turno
            continue
        carg = r.json()["carg"][0]
        for agr in carg["agr"]:
            for par in agr["par"]:
                for c in par["cand"]:
                    print(mu["nm"], c["nmu"], par["sg"], c["vap"], c["st"])
        time.sleep(1)
```

## Alternativa oficial (CSV)

Portal de dados abertos: <https://dadosabertos.tse.jus.br/>. Tem candidatos, resultados por seção e perfil do eleitorado de 2024 e anos anteriores, em arquivos ZIP/CSV. É a melhor opção para análises detalhadas ou em lote.

## Referência no projeto

Coletor de votos municipais completos: `tse-eleitos-2026/static/d/tools/coleta_municipal.py`.
