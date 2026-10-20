"""Gera public/data/filiados/{uf}.json e br.json: filiados por partido em cada município, com recortes.

Fonte: "Perfil Filiação Partidária" dos dados abertos do TSE (um CSV de ~3,5 GB, já agregado: não tem
nomes, só contagens por partido, município, zona e perfil). O TSE o regenera uma vez por mês.
O arquivo é baixado uma vez para scripts/.cache e reduzido aqui a poucos MB; a plataforma só lê os JSONs.

Os municípios saem com o código IBGE (mesma chave de public/data/mun); o arquivo do TSE usa o código do TSE,
traduzido por public/data/cdmun.json (rode build_data.py antes se ele não existir).
Cada partido vira  [total, [gênero], [faixa etária], [escolaridade]]  com as categorias de GENERO, FAIXAS e
ESCOLA (mesma ordem, nos mesmos nomes em ilhas/Conjuntura.tsx). Os recortes não somam o total: "não informado"
e "inválida" ficam só no total.

Uso:  python scripts/build_filiados.py [--refresh]   (--refresh baixa o arquivo de novo)
Só usa a biblioteca padrão.
"""
import csv, io, json, sys, urllib.request, zipfile
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / "scripts" / ".cache"
OUT = RAIZ / "public" / "data" / "filiados"
URL = "https://cdn.tse.jus.br/estatistica/sead/odsele/filiacao_partidaria/perfil_filiacao_partidaria.zip"
ZIP = CACHE / "filiacao.zip"
UA = {"User-Agent": "Mozilla/5.0"}

GENERO = ["MASCULINO", "FEMININO"]  # o resto entra só no total
FAIXAS = {"16 anos": 0, "17 anos": 0, "18 a 20 anos": 0, "21 a 24 anos": 0, "25 a 34 anos": 1, "35 a 44 anos": 2,
          "45 a 59 anos": 3, "60 a 69 anos": 4, "70 a 79 anos": 5, "Superior a 79 anos": 6}
ESCOLA = {"ANALFABETO": 0, "LÊ E ESCREVE": 0, "ENSINO FUNDAMENTAL INCOMPLETO": 0, "ENSINO FUNDAMENTAL COMPLETO": 1,
          "ENSINO MÉDIO INCOMPLETO": 2, "ENSINO MÉDIO COMPLETO": 3, "SUPERIOR INCOMPLETO": 4, "SUPERIOR COMPLETO": 5}
# siglas do arquivo -> padrão usado no resto da plataforma (ver build_data.py)
SIGLA = {"PC DO B": "PCDOB", "PC do B": "PCDOB", "PCdoB": "PCDOB", "PODEMOS": "PODE", "SOLIDARIEDADE": "SOLIDARIEDADE",
         "UNIAO": "UNIÃO", "DEMOCRACIA CRISTÃ": "DC", "MOBILIZA": "MOBILIZA"}


def baixa():
    if ZIP.exists() and "--refresh" not in sys.argv:
        return
    CACHE.mkdir(parents=True, exist_ok=True)
    print("baixando", URL, "(~230 MB)")
    req = urllib.request.Request(URL, headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r, open(ZIP, "wb") as f:
        while b := r.read(1 << 20):
            f.write(b)


def novo():
    return [0, [0] * 2, [0] * 7, [0] * 6]


def soma(a, q, g, f, e):
    a[0] += q
    if g is not None: a[1][g] += q
    if f is not None: a[2][f] += q
    if e is not None: a[3][e] += q


def tse_para_ibge():
    """cdmun.json (gerado pelo build_data.py) vai de IBGE para o código do TSE; aqui precisamos do inverso."""
    cd = json.loads((RAIZ / "public" / "data" / "cdmun.json").read_text(encoding="utf-8"))
    return {uf: {tse: ibge for ibge, tse in d.items()} for uf, d in cd.items()}


def main():
    baixa()
    t2i = tse_para_ibge()
    mun = defaultdict(lambda: defaultdict(lambda: defaultdict(novo)))  # uf -> cdi -> partido -> acumulador
    ref = ger = None
    sem_sigla = set()
    with zipfile.ZipFile(ZIP) as z:
        nome = next(n for n in z.namelist() if n.lower().endswith(".csv"))
        with z.open(nome) as f:
            rd = csv.reader(io.TextIOWrapper(f, encoding="latin-1", newline=""), delimiter=";")
            h = {k: i for i, k in enumerate(next(rd))}
            i_ref, i_dt, i_sg, i_uf, i_cd = h["NR_ANO_MES"], h["DT_GERACAO"], h["SG_PARTIDO"], h["SG_UF"], h["CD_MUNICIPIO"]
            i_g, i_f, i_e, i_q = h["DS_GENERO"], h["DS_FAIXA_ETARIA"], h["DS_GRAU_INSTRUCAO"], h["QT_FILIADO"]
            n = 0
            for r in rd:
                n += 1
                if n % 2_000_000 == 0:
                    print(f"{n:,} linhas")
                uf = r[i_uf].lower()
                ibge = t2i.get(uf, {}).get(r[i_cd].zfill(5))
                if not ibge:   # exterior ("ZZ") e municípios sem correspondência ficam de fora
                    continue
                ref, ger = r[i_ref], r[i_dt]
                sg = r[i_sg].strip()
                sg = SIGLA.get(sg, sg).upper()
                try:
                    q = int(r[i_q])
                except ValueError:
                    continue
                g = GENERO.index(r[i_g]) if r[i_g] in GENERO else None
                soma(mun[uf][ibge][sg], q, g, FAIXAS.get(r[i_f]), ESCOLA.get(r[i_e]))
    print(n, "linhas lidas; referência", ref)

    OUT.mkdir(parents=True, exist_ok=True)
    br = defaultdict(novo)
    por_uf = {}
    for uf, muns in sorted(mun.items()):
        tot_uf = defaultdict(novo)
        for partidos in muns.values():
            for sg, a in partidos.items():
                for dest in (tot_uf[sg], br[sg]):
                    dest[0] += a[0]
                    for k in (1, 2, 3):
                        for j, v in enumerate(a[k]):
                            dest[k][j] += v
        por_uf[uf] = tot_uf
        dados = {"ref": ref, "geracao": ger, "uf": tot_uf, "mun": {cd: dict(p) for cd, p in sorted(muns.items())}}
        (OUT / f"{uf}.json").write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    brasil = {"ref": ref, "geracao": ger, "br": br, "uf": {uf: dict(t) for uf, t in por_uf.items()}}
    (OUT / "br.json").write_text(json.dumps(brasil, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    tam = sum(p.stat().st_size for p in OUT.glob("*.json"))
    print(f"{len(por_uf)} UFs, {tam / 1e6:.1f} MB em {OUT}")
    print("partidos:", sorted(br))


if __name__ == "__main__":
    main()
