"""Gera public/data/exec/br.json e exec/{uf}.json: quem ocupa o Executivo e a coligação com que foi eleito.

  br.json   Presidência 2026   -> {"pres": {...}}
  {uf}.json Governo 2026 e prefeituras 2024 -> {"gov": {...}, "pref": {cdi: {...}}}
Cada registro: {"n": nome de urna, "p": partido, "c": [siglas da coligação, federações abertas]} ou, quando
ainda não há eleito (2º turno pendente), {"pend": [registros dos candidatos que disputam o 2º turno]}.
Só entram eleitos (prefeitura: 1º ou 2º turno de 2024). A coligação é a da eleição, não a base de governo atual.

Fonte: consulta_cand dos dados abertos do TSE (2026 já em scripts/.cache/cc26.zip pelo build_eleitos.py;
2024 é baixado uma vez para cc24.zip). Rode de novo com --refresh quando saírem os resultados do 2º turno.
Uso:  python scripts/build_executivo.py [--refresh]
"""
import csv, io, json, re, sys, urllib.request, zipfile
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / "scripts" / ".cache"
OUT = RAIZ / "public" / "data" / "exec"
CDN = "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_{}.zip"
UA = {"User-Agent": "Mozilla/5.0"}
REFRESH = "--refresh" in sys.argv

# siglas antigas ou grafias do TSE -> padrão da plataforma (igual a build_historico.py)
ATUAL = {"PC DO B": "PCDOB", "PCDOB": "PCDOB", "PATRIOTA": "PRD", "PTB": "PRD", "PATRI": "PRD", "PRP": "PRD",
         "DEM": "UNIÃO", "PSL": "UNIÃO", "UNIAO": "UNIÃO", "PR": "PL", "PRB": "REPUBLICANOS", "PSC": "PODE",
         "PHS": "PODE", "PODEMOS": "PODE", "PROS": "SOLIDARIEDADE", "SD": "SOLIDARIEDADE", "PPS": "CIDADANIA",
         "PT DO B": "AVANTE", "PMN": "MOBILIZA", "PTC": "AGIR"}


def sigla(s):
    s = s.strip().upper()
    if s.startswith("UNI") and len(s) == 5:   # "UNIÃO" chega com byte inválido em alguns arquivos
        s = "UNIÃO"
    return ATUAL.get(s, s)


def coligacao(txt, partido):
    """'PDT / PSB / FEDERAÇÃO X (13-PT / 65-PC do B)' -> ['PDT','PSB','PT','PCDOB'] (federações abertas)."""
    dentro = re.findall(r"\(([^)]*)\)", txt)
    fora = re.sub(r"\([^)]*\)", "", txt)
    out = {partido}
    for parte in fora.split("/"):
        p = parte.strip()
        if p and not p.upper().startswith("FEDERA"):
            out.add(sigla(p))
    for grupo in dentro:
        for item in grupo.split("/"):
            m = re.match(r"\s*\d+\s*-\s*(.+?)\s*$", item)
            if m:
                out.add(sigla(m.group(1)))
    return sorted(out)


def zip_ano(ano):
    f = CACHE / f"cc{str(ano)[2:]}.zip"
    if REFRESH or not f.exists():
        print("baixando consulta_cand", ano)
        f.write_bytes(urllib.request.urlopen(urllib.request.Request(CDN.format(ano), headers=UA), timeout=300).read())
    return zipfile.ZipFile(f)


def linhas(z, nome):
    with z.open(nome) as f:
        yield from csv.DictReader(io.TextIOWrapper(f, encoding="latin-1", newline=""), delimiter=";")


def reg(r):
    p = sigla(r["SG_PARTIDO"])
    return {"n": r["NM_URNA_CANDIDATO"].title(), "p": p, "c": coligacao(r["DS_COMPOSICAO_COLIGACAO"], p)}


def escolhe(cands):
    """cands: linhas de um cargo. Eleito se alguém tem DS_SIT_TOT_TURNO 'ELEITO*'; senão, 2º turno pendente."""
    eleitos = [r for r in cands if r["DS_SIT_TOT_TURNO"].startswith("ELEITO")]
    if eleitos:
        return reg(eleitos[-1])
    seg = [r for r in cands if r["NR_TURNO"] == "2"]
    return {"pend": [reg(r) for r in seg]} if seg else None


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    z26 = zip_ano(2026)
    pres = [r for r in linhas(z26, "consulta_cand_2026_BR.csv") if r["DS_CARGO"] == "PRESIDENTE"]
    gov = defaultdict(list)
    for r in linhas(z26, "consulta_cand_2026_BRASIL.csv"):
        if r["DS_CARGO"] == "GOVERNADOR":
            gov[r["SG_UF"].lower()].append(r)

    # prefeituras saem com o código IBGE (chave de public/data/mun); o TSE usa o próprio código (cdmun.json é IBGE -> TSE)
    cd = json.loads((RAIZ / "public" / "data" / "cdmun.json").read_text(encoding="utf-8"))
    t2i = {uf: {tse: ibge for ibge, tse in d.items()} for uf, d in cd.items()}
    z24 = zip_ano(2024)
    pref = defaultdict(lambda: defaultdict(list))
    for nome in z24.namelist():
        if nome.lower().endswith("_brasil.csv") or not nome.lower().endswith(".csv"):
            continue
        for r in linhas(z24, nome):
            if r["DS_CARGO"] == "PREFEITO" and r["DS_SIT_TOT_TURNO"].startswith("ELEITO"):
                uf = r["SG_UF"].lower()
                ibge = t2i.get(uf, {}).get(r["SG_UE"].zfill(5))
                if ibge:
                    pref[uf][ibge].append(r)

    (OUT / "br.json").write_text(json.dumps({"ref": "2026", "pres": escolhe(pres)}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    ufs = sorted({*gov, *pref})
    n_pref = n_pend = 0
    for uf in ufs:
        prefs = {cd: reg(rs[-1]) for cd, rs in sorted(pref[uf].items())}
        g = escolhe(gov[uf]) if uf in gov else None
        n_pref += len(prefs)
        n_pend += bool(g and "pend" in g)
        (OUT / f"{uf}.json").write_text(json.dumps({"gov": g, "pref": prefs}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(len(ufs), "UFs;", n_pref, "prefeitos eleitos em 2024;", n_pend, "governos com 2º turno pendente")
    print("presidência:", escolhe(pres))


if __name__ == "__main__":
    main()
