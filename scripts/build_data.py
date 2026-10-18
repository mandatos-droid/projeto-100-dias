"""Gera os JSONs estáticos que alimentam a plataforma (public/data e public/geo).

Fontes:
  - 2026: API de resultados do TSE (UF: federal, estadual/distrital, senado) e
          agregados municipais já coletados em ../../mapa-eleitoral.
  - 2024: dados abertos do TSE (votacao_candidato_munzona_2024.zip), baixado uma vez.

Uso:  python scripts/build_data.py [--refresh]
Só usa a biblioteca padrão. Os brutos ficam em scripts/.cache (fora do deploy).
"""
import csv, io, json, re, shutil, sys, time, urllib.request, zipfile
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / "scripts" / ".cache"
OUT = RAIZ / "public" / "data"
GEO_OUT = RAIZ / "public" / "geo"
MAPA = RAIZ.parent.parent / "mapa-eleitoral"
MUN_2026 = MAPA / "tse-eleitos-2026" / "static" / "d" / "data"
GEO_SRC = MAPA / "tse-eleitos-2026" / "static" / "geo"
CFG_2026 = MAPA / "dados" / "raw" / "2026" / "1-turno" / "mun-e006259-cm.json"
UA = {"User-Agent": "Mozilla/5.0"}
REFRESH = "--refresh" in sys.argv

UFS = {
    "ac": "Acre", "al": "Alagoas", "am": "Amazonas", "ap": "Amapá", "ba": "Bahia",
    "ce": "Ceará", "df": "Distrito Federal", "es": "Espírito Santo", "go": "Goiás",
    "ma": "Maranhão", "mg": "Minas Gerais", "ms": "Mato Grosso do Sul",
    "mt": "Mato Grosso", "pa": "Pará", "pb": "Paraíba", "pe": "Pernambuco",
    "pi": "Piauí", "pr": "Paraná", "rj": "Rio de Janeiro", "rn": "Rio Grande do Norte",
    "ro": "Rondônia", "rr": "Roraima", "rs": "Rio Grande do Sul", "sc": "Santa Catarina",
    "se": "Sergipe", "sp": "São Paulo", "to": "Tocantins",
}
# normaliza siglas de 2024 para o padrão usado pelo TSE em 2026
PARTIDO_24 = {"PC DO B": "PCDOB", "PCDOB": "PCDOB", "UNIÃO": "UNIÃO", "PATRIOTA": "PRD", "PTB": "PRD",
              "MOBILIZA": "MOBILIZA", "AGIR": "AGIR", "CIDADANIA": "CIDADANIA", "PODE": "PODE"}


def num(s):
    try:
        return int(str(s).replace(".", ""))
    except ValueError:
        return 0


def fnum(s):
    try:
        return float(str(s).replace(",", "."))
    except ValueError:
        return 0.0


def baixa(url, destino: Path):
    if destino.exists() and not REFRESH:
        return destino.read_bytes()
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                b = r.read()
            destino.parent.mkdir(parents=True, exist_ok=True)
            destino.write_bytes(b)
            return b
        except Exception as e:  # noqa: BLE001
            if i == 3:
                raise
            time.sleep(1 + i * 2)


def json_tse(b: bytes):
    try:
        return json.loads(b.decode("utf-8"))
    except UnicodeDecodeError:
        return json.loads(b.decode("latin-1"))


# ------------------------------------------------------------------ 2026 · UF
def cargo_uf(uf, cargo):
    url = f"https://resultados.tse.jus.br/oficial/ele2026/6259/dados/{uf}/{uf}-c{cargo:04d}-e006259-u.json"
    d = json_tse(baixa(url, CACHE / "2026" / f"{uf}-c{cargo:04d}.json"))
    c = d["carg"][0]
    cands = []
    for agr in c.get("agr", []):
        fed = agr["nm"] if agr.get("tp") == "f" else ""
        fed = re.sub(r"^FEDERA[CÇ][AÃ]O\s+", "", fed)
        for par in agr.get("par", []):
            for k in par.get("cand", []):
                cands.append({
                    "s": k["sqcand"], "n": k.get("n", ""), "u": k.get("nmu") or k.get("nm"), "c": k.get("nm"),
                    "p": par["sg"], "f": fed, "v": num(k.get("vap", 0)), "x": round(fnum(k.get("pvapn", 0)), 3),
                    "e": 1 if k.get("e") == "s" else 0, "t": k.get("st", ""),
                })
    cands.sort(key=lambda k: -k["v"])
    return {"cargo": c["nmn"], "vagas": num(c.get("nv", 0)), "cands": cands,
            "atualizado": f"{d.get('dt', '')} {d.get('ht', '')}".strip(), "aviso": d.get("mntf", "")}


def coleta_2026():
    jobs = [(uf, cg) for uf in UFS for cg in (5, 6, 8 if uf == "df" else 7)]
    with ThreadPoolExecutor(4) as ex:
        res = list(ex.map(lambda j: (j, cargo_uf(*j)), jobs))
    out = defaultdict(dict)
    nome = {5: "senado", 6: "federal", 7: "estadual", 8: "estadual"}
    for (uf, cg), r in res:
        out[uf][nome[cg]] = r
    return out


# ------------------------------------------------------------------ 2024
def parte24(sg):
    sg = sg.strip().upper()
    return PARTIDO_24.get(sg, sg)


def coleta_2024(cd2cdi):
    b = baixa("https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_2024.zip",
              CACHE / "vcm24.zip")
    z = zipfile.ZipFile(io.BytesIO(b))
    out = {}
    for uf in UFS:
        nome = f"votacao_candidato_munzona_2024_{uf.upper()}.csv"
        if nome not in z.namelist():   # DF não tem eleição municipal
            out[uf] = {}
            continue
        # (cd_mun, cargo, turno, sq) -> [nome, partido, votos, situação]
        cand = {}
        with z.open(nome) as f:
            rd = csv.DictReader(io.TextIOWrapper(f, encoding="latin-1", newline=""), delimiter=";")
            for r in rd:
                cg = int(r["CD_CARGO"])
                if cg not in (11, 13):
                    continue
                k = (r["CD_MUNICIPIO"].zfill(5), cg, int(r["NR_TURNO"]), r["SQ_CANDIDATO"])
                v = num(r["QT_VOTOS_NOMINAIS_VALIDOS"])
                if k in cand:
                    cand[k][2] += v
                else:
                    cand[k] = [r["NM_URNA_CANDIDATO"], parte24(r["SG_PARTIDO"]), v, r["DS_SIT_TOT_TURNO"].strip()]
        mun = defaultdict(lambda: {"pref": {"cands": [], "p": defaultdict(int), "v": 0},
                                   "ver": {"eleitos": [], "p": defaultdict(int), "v": 0, "el": defaultdict(int)}})
        for (cd, cg, turno, sq), (nm, par, v, sit) in cand.items():
            cdi = cd2cdi.get(cd)
            if not cdi:
                continue
            eleito = sit.upper().startswith("ELEITO") and "NÃO" not in sit.upper()
            if cg == 11:
                bloco = mun[cdi]["pref"]
                if turno == 1:
                    bloco["p"][par] += v
                    bloco["v"] += v
                    bloco["cands"].append([nm, par, v, sq, 0])
                if eleito:   # sinaliza o eleito (no 1º ou no 2º turno)
                    bloco.setdefault("elei", {})[sq] = [nm, par]
            else:
                bloco = mun[cdi]["ver"]
                bloco["p"][par] += v
                bloco["v"] += v
                if eleito:
                    bloco["eleitos"].append([nm, par, v, sq])
                    bloco["el"][par] += 1
        res = {}
        for cdi, m in mun.items():
            pf = m["pref"]
            elei = pf.pop("elei", {})
            for c in pf["cands"]:
                c[4] = 1 if c[3] in elei else 0
            pf["cands"].sort(key=lambda c: -c[2])
            if elei and not any(c[4] for c in pf["cands"]):   # eleito só aparece no 2º turno com outro sq
                pass
            pf["p"] = sorted(pf["p"].items(), key=lambda kv: -kv[1])
            vr = m["ver"]
            vr["eleitos"].sort(key=lambda c: -c[2])
            vr["p"] = sorted(vr["p"].items(), key=lambda kv: -kv[1])
            vr["el"] = dict(sorted(vr["el"].items(), key=lambda kv: -kv[1]))
            pf["v"] = int(pf["v"])
            res[cdi] = {"pref": pf, "ver": vr}
        out[uf] = res
        print("2024", uf, len(res), "municípios")
    return out


# ------------------------------------------------------------------ geo + montagem
def main():
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "uf").mkdir(exist_ok=True)
    (OUT / "mun").mkdir(exist_ok=True)
    GEO_OUT.mkdir(parents=True, exist_ok=True)

    cfg = json.loads(CFG_2026.read_text(encoding="utf-8"))
    cd2cdi, nomes = {}, {}
    for a in cfg["abr"]:
        for m in a["mu"]:
            cd2cdi[m["cd"]] = m["cdi"]
            nomes[m["cdi"]] = m["nm"].title().replace(" De ", " de ").replace(" Da ", " da ").replace(" Do ", " do ") \
                .replace(" Dos ", " dos ").replace(" Das ", " das ")

    print("2026 · UFs ...")
    uf26 = coleta_2026()
    print("2024 · municípios ...")
    m24 = coleta_2024(cd2cdi)

    nacional = {"federal": defaultdict(int), "senado": defaultdict(int), "estadual": defaultdict(int),
                "prefeitos": defaultdict(int), "vereadores": defaultdict(int)}
    ufs_idx = []
    for uf, nome in UFS.items():
        d = uf26[uf]
        cad = {}
        for casa in ("federal", "senado", "estadual"):
            conta = defaultdict(int)
            for k in d[casa]["cands"]:
                if k["e"]:
                    conta[k["p"]] += 1
                    nacional[casa][k["p"]] += 1
            cad[casa] = dict(sorted(conta.items(), key=lambda kv: -kv[1]))
        pref, ver = defaultdict(int), defaultdict(int)
        for cdi, m in m24[uf].items():
            for c in m["pref"]["cands"]:
                if c[4]:
                    pref[c[1]] += 1
            for par, n in m["ver"]["el"].items():
                ver[par] += n
        for par, n in pref.items():
            nacional["prefeitos"][par] += n
        for par, n in ver.items():
            nacional["vereadores"][par] += n
        cad["prefeitos"] = dict(sorted(pref.items(), key=lambda kv: -kv[1]))
        cad["vereadores"] = dict(sorted(ver.items(), key=lambda kv: -kv[1]))
        (OUT / "uf" / f"{uf}.json").write_text(
            json.dumps({"uf": uf.upper(), "nome": nome, "cadeiras": cad, **d}, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8")

        # municipal 2026 (parte do que já foi coletado) + 2024
        m26 = json.loads((MUN_2026 / f"mun-{uf}.json").read_text(encoding="utf-8"))
        eleito_sq = {k["s"] for casa in ("federal", "estadual", "senado") for k in d[casa]["cands"] if k["e"]}
        mun = {}
        for cdi in sorted({*m24[uf], *(m26.get("federal") or {})}):
            e = {"nm": nomes.get(cdi, cdi)}
            for chave in ("presidente", "governador", "senador", "federal", "estadual"):
                b = (m26.get(chave) or {}).get(cdi)
                if not b:
                    continue
                reg = {"v": b["v"], "p": b["p"]}
                if chave in ("federal", "estadual"):
                    reg["c"] = [[c[0], c[1], c[2], c[3], 1 if c[3] in eleito_sq else 0] for c in b["c"]]
                e[chave] = reg
            if cdi in m24[uf]:
                e["m24"] = m24[uf][cdi]
            mun[cdi] = e
        (OUT / "mun" / f"{uf}.json").write_text(
            json.dumps({"atualizado": m26.get("atualizado"), "mun": mun}, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8")
        shutil.copy(GEO_SRC / f"mun-{uf}.json", GEO_OUT / f"{uf}.json")
        ufs_idx.append({"uf": uf.upper(), "nome": nome, "cadeiras": {k: sum(v.values()) for k, v in cad.items()},
                        "vagas": {c: d[c]["vagas"] for c in ("federal", "senado", "estadual")}})
        print("ok", uf)

    ord_ = lambda dct: dict(sorted(dct.items(), key=lambda kv: -kv[1]))
    (OUT / "ufs.json").write_text(json.dumps(ufs_idx, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (OUT / "nacional.json").write_text(
        json.dumps({k: ord_(v) for k, v in nacional.items()}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("pronto")


if __name__ == "__main__":
    main()
