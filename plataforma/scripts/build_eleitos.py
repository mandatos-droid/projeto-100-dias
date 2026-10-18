"""Gera public/data/eleitos.json: todos os parlamentares eleitos (Câmara, Assembleias/CLDF e Senado) com
gênero, cor/raça e se é reeleição.

Fontes (dados abertos do TSE):
  - public/data/uf/*.json (resultado 2026, gerado por build_data.py)
  - consulta_cand_2026.zip: gênero e cor/raça por SQ_CANDIDATO
  - consulta_cand_2022.zip: eleitos de 2022 (reeleição = eleito em 2022 para o mesmo cargo, mesmo nome civil e UF;
    também traz os 27 senadores eleitos em 2022, com mandato até 2031)

Limite: a Justiça Eleitoral não divulga CPF/título em 2026, então o cruzamento é por nome civil + UF.
Quem foi parlamentar antes de 2022 e ficou fora de 2022 aparece como primeiro mandato.
Uso:  python scripts/build_eleitos.py   (rode build_data.py antes)
"""
import csv, io, json, unicodedata, urllib.request, zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / "scripts" / ".cache"
UA = {"User-Agent": "Mozilla/5.0"}
CDN = "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_{}.zip"
CASA = {"DEPUTADO FEDERAL": "federal", "DEPUTADO ESTADUAL": "estadual", "DEPUTADO DISTRITAL": "estadual", "SENADOR": "senado"}
RACA = {"BRANCA": "B", "PARDA": "P", "PRETA": "N", "AMARELA": "A", "INDÍGENA": "I"}


def zip_ano(ano):
    f = CACHE / f"cc{str(ano)[2:]}.zip"
    if not f.exists():
        req = urllib.request.Request(CDN.format(ano), headers=UA)
        f.write_bytes(urllib.request.urlopen(req, timeout=180).read())
    return zipfile.ZipFile(f)


def linhas(z, ano):
    with z.open(f"consulta_cand_{ano}_BRASIL.csv") as f:
        yield from csv.DictReader(io.TextIOWrapper(f, encoding="latin-1", newline=""), delimiter=";")


def norm(s):
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().upper().strip()


def main():
    perfil = {}
    for r in linhas(zip_ano(2026), 2026):
        if r["DS_CARGO"] in CASA:
            perfil[r["SQ_CANDIDATO"]] = (r["DS_GENERO"][:1], RACA.get(r["DS_COR_RACA"].upper(), ""))

    eleitos22, sen22 = set(), []
    for r in linhas(zip_ano(2022), 2022):
        casa = CASA.get(r["DS_CARGO"])
        if not casa or not r["DS_SIT_TOT_TURNO"].startswith("ELEITO"):
            continue
        eleitos22.add((r["SG_UF"], norm(r["NM_CANDIDATO"]), casa))
        if casa == "senado":
            sen22.append(r)

    out, sem_perfil = [], 0
    for f in sorted((RAIZ / "public" / "data" / "uf").glob("*.json")):
        d = json.loads(f.read_text(encoding="utf-8"))
        uf = d["uf"]
        for casa in ("federal", "estadual", "senado"):
            for c in d[casa]["cands"]:
                if not c["e"]:
                    continue
                g, r = perfil.get(c["s"], ("", ""))
                sem_perfil += not g
                nome = norm(c["c"])
                reel = (uf, nome, casa) in eleitos22
                outro = not reel and any((uf, nome, k) in eleitos22 for k in ("federal", "estadual", "senado"))
                out.append({"s": c["s"], "u": c["u"], "c": c["c"], "p": c["p"], "uf": uf, "k": casa[0] if casa != "senado" else "s",
                            "v": c["v"], "x": c["x"], "g": g, "r": r, "m": "r" if reel else "o" if outro else "n", "a": 2026})
    for r in sen22:   # senadores eleitos em 2022: mandato vai de 2023 a 2031
        out.append({"s": r["SQ_CANDIDATO"], "u": r["NM_URNA_CANDIDATO"], "c": r["NM_CANDIDATO"], "p": r["SG_PARTIDO"],
                    "uf": r["SG_UF"], "k": "s", "v": 0, "x": 0, "g": r["DS_GENERO"][:1],
                    "r": RACA.get(r["DS_COR_RACA"].upper(), ""), "m": "?", "a": 2022})
    (RAIZ / "public" / "data" / "eleitos.json").write_text(
        json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    from collections import Counter
    print(len(out), "eleitos;", "sem perfil:", sem_perfil)
    print(Counter((e["k"], e["a"]) for e in out))
    print(Counter(e["m"] for e in out if e["a"] == 2026), Counter(e["g"] for e in out), Counter(e["r"] for e in out))


if __name__ == "__main__":
    main()
