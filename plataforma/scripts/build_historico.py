"""Gera public/data/hist/{uf}.json: votos por partido em cada município nas eleições de 2022 e 2020.

Fonte: dados abertos do TSE (votacao_candidato_munzona_{ano}.zip), baixados antes em scripts/.cache
(vcm22.zip, vcm20.zip). Só votos nominais, como em 2024. Em 2022 cada bloco traz também "c": os 6 candidatos mais votados do município. Siglas antigas são levadas para as atuais.
Uso:  python scripts/build_historico.py
"""
import csv, io, json, zipfile
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / "scripts" / ".cache"
OUT = RAIZ / "public" / "data" / "hist"
CFG = RAIZ.parent.parent / "mapa-eleitoral" / "dados" / "raw" / "2026" / "1-turno" / "mun-e006259-cm.json"

# partidos extintos, fundidos ou renomeados -> sigla de hoje
ATUAL = {"PC DO B": "PCDOB", "PCDOB": "PCDOB", "PATRIOTA": "PRD", "PTB": "PRD", "PATRI": "PRD", "PRP": "PRD",
         "DEM": "UNIÃO", "PSL": "UNIÃO", "UNIAO": "UNIÃO", "PR": "PL", "PRB": "REPUBLICANOS", "PSC": "PODE",
         "PHS": "PODE", "PODEMOS": "PODE", "PROS": "SOLIDARIEDADE", "SD": "SOLIDARIEDADE", "PPS": "CIDADANIA",
         "PT DO B": "AVANTE", "PMN": "MOBILIZA", "PEN": "PATRIOTA", "PTC": "AGIR", "DC": "DC"}
CARGO = {2022: {1: "presidente", 3: "governador", 5: "senador", 6: "federal", 7: "estadual", 8: "estadual"},
         2020: {11: "pref", 13: "ver"}}


def num(s):
    try:
        return int(str(s).replace(".", ""))
    except ValueError:
        return 0


def le(ano, cd2cdi):
    z = zipfile.ZipFile(CACHE / f"vcm{str(ano)[2:]}.zip")
    tot = defaultdict(lambda: defaultdict(int))  # (uf, cdi, chave) -> partido -> votos
    cands = defaultdict(dict)  # (uf, cdi, chave) -> sq -> [nome, partido, votos, sq, eleito] (só 2022)
    for nome in z.namelist():
        if not nome.lower().endswith(".csv"):
            continue
        brasil = nome.upper().endswith("_BRASIL.csv".upper())   # repete todos os cargos; só serve para presidente
        with z.open(nome) as f:
            rd = csv.DictReader(io.TextIOWrapper(f, encoding="latin-1", newline=""), delimiter=";")
            for r in rd:
                chave = CARGO[ano].get(int(r["CD_CARGO"]))
                if not chave or int(r["NR_TURNO"]) != 1 or brasil != (chave == "presidente"):
                    continue
                cdi = cd2cdi.get(r["CD_MUNICIPIO"].zfill(5))
                if not cdi:
                    continue
                sg = r["SG_PARTIDO"].strip().upper()
                if sg.startswith("UNI") and len(sg) == 5:   # o TSE grafa "UNIÃO" com byte inválido em alguns anos
                    sg = "UNIÃO"
                v = num(r["QT_VOTOS_NOMINAIS_VALIDOS"] if "QT_VOTOS_NOMINAIS_VALIDOS" in r else r["QT_VOTOS_NOMINAIS"])
                ch = (r["SG_UF"].lower(), cdi, chave)
                tot[ch][ATUAL.get(sg, sg)] += v
                if ano == 2022:   # a linha vem por zona: soma as zonas do município
                    sq = r["SQ_CANDIDATO"]
                    c = cands[ch].setdefault(sq, [r["NM_URNA_CANDIDATO"].strip().title(), ATUAL.get(sg, sg), 0, sq, 0])
                    c[2] += v
                    c[4] = 1 if r["DS_SIT_TOT_TURNO"].upper().startswith("ELEITO") else c[4]
    print(ano, len(tot), "blocos")
    return tot, cands


def main():
    cfg = json.loads(CFG.read_text(encoding="utf-8"))
    cd2cdi = {m["cd"]: m["cdi"] for a in cfg["abr"] for m in a["mu"]}
    saida = defaultdict(lambda: defaultdict(dict))
    for ano in (2022, 2020):
        tot, cands = le(ano, cd2cdi)
        for (uf, cdi, chave), ps in tot.items():
            lista = sorted(((p, v) for p, v in ps.items() if v), key=lambda kv: -kv[1])
            if lista:
                bloco = {"v": sum(v for _, v in lista), "p": lista}
                if cands:   # 6 mais votados no município, como em 2026 (MunCand)
                    top = sorted((c for c in cands[(uf, cdi, chave)].values() if c[2]), key=lambda c: -c[2])[:6]
                    if top:
                        bloco["c"] = top
                saida[uf][cdi][f"{chave}{ano}"] = bloco
    OUT.mkdir(parents=True, exist_ok=True)
    for uf, d in saida.items():
        (OUT / f"{uf}.json").write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print("ok", uf, len(d))


if __name__ == "__main__":
    main()
