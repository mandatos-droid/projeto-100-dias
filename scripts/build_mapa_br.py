"""Gera public/geo/br.json (mapa do Brasil por UF) a partir da malha do IBGE (qualidade mínima).
Projeção simples (equiretangular corrigida pela latitude média). Uso: python scripts/build_mapa_br.py"""
import json, math, urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
URL = "https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?intrarregiao=UF&formato=application/vnd.geo+json&qualidade=minima"
COD = {"11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO", "21": "MA", "22": "PI", "23": "CE",
       "24": "RN", "25": "PB", "26": "PE", "27": "AL", "28": "SE", "29": "BA", "31": "MG", "32": "ES", "33": "RJ", "35": "SP",
       "41": "PR", "42": "SC", "43": "RS", "50": "MS", "51": "MT", "52": "GO", "53": "DF"}
K = 14  # px por grau
cache = RAIZ / "scripts" / ".cache" / "br-uf.json"
if not cache.exists():
    cache.write_bytes(urllib.request.urlopen(urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"}), timeout=60).read())
d = json.loads(cache.read_text(encoding="utf-8"))
fx = math.cos(math.radians(15))
aneis = {}
for f in d["features"]:
    g = f["geometry"]
    polis = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    aneis[COD[f["properties"]["codarea"]]] = polis
xs = [p[0] for ps in aneis.values() for pl in ps for r in pl for p in r]
ys = [p[1] for ps in aneis.values() for pl in ps for r in pl for p in r]
x0, y1 = min(xs), max(ys)
X = lambda lon: round((lon - x0) * fx * K, 1)
Y = lambda lat: round((y1 - lat) * K, 1)
out = []
for uf, polis in sorted(aneis.items()):
    d_ = ""
    maior, cx, cy = 0, 0, 0
    for pl in polis:
        for i, r in enumerate(pl):
            d_ += "M" + "L".join(f"{X(a)} {Y(b)}" for a, b in r) + "Z"
        ext = pl[0]
        area = abs(sum(ext[i][0] * ext[(i + 1) % len(ext)][1] - ext[(i + 1) % len(ext)][0] * ext[i][1] for i in range(len(ext)))) / 2
        if area > maior:
            maior, cx, cy = area, sum(p[0] for p in ext) / len(ext), sum(p[1] for p in ext) / len(ext)
    out.append({"id": uf, "d": d_, "cx": X(cx), "cy": Y(cy)})
w = round((max(xs) - x0) * fx * K, 1); h = round((y1 - min(ys)) * K, 1)
(RAIZ / "public" / "geo" / "br.json").write_text(json.dumps({"w": w, "h": h, "uf": out}, separators=(",", ":")), encoding="utf-8")
print(w, h, len(out))
