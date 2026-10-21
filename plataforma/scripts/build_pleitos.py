"""Gera public/data/pleitos/{uf}.json: todos os pleitos anteriores (2006 a 2024) de quem aparece em 2026 ou foi eleito em 2024.

A mesma pessoa é reconhecida pelo TÍTULO ELEITORAL (NR_TITULO_ELEITORAL_CANDIDATO, dados abertos do TSE), que não muda entre
eleições nem com a troca de nome. O título só é usado aqui, na geração: o arquivo publicado é indexado pelo sequencial (SQ)
da candidatura de 2026 ou de 2024 e não contém título, CPF nem data de nascimento.

Fontes (cdn.tse.jus.br, baixadas para scripts/.cache): consulta_cand_{ano}.zip (quem foi candidato, cargo, partido, situação)
e votacao_candidato_munzona_{ano}.zip (votos por zona). Votos nominais do 1º turno. Antes de 2006 o TSE muda o layout: fora.
Formato de cada pleito: [ano, cargo, uf, município ('' nas eleições gerais), partido, número, votos, % dos votos nominais, situação].
Uso:  python scripts/build_pleitos.py [ano ...]     (sem argumentos: todos os anos)
"""
import csv, io, json, sys, urllib.request, zipfile
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / "scripts" / ".cache"
OUT = RAIZ / "public" / "data" / "pleitos"
CDN = "https://cdn.tse.jus.br/estatistica/sead/odsele/{0}/{0}_{1}.zip"
UA = {"User-Agent": "Mozilla/5.0"}
ANOS = [2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024]
CARGO = {"PRESIDENTE": "Presidente", "GOVERNADOR": "Governador", "SENADOR": "Senador", "DEPUTADO FEDERAL": "Deputado Federal",
         "DEPUTADO ESTADUAL": "Deputado Estadual", "DEPUTADO DISTRITAL": "Deputado Distrital", "PREFEITO": "Prefeito",
         "VEREADOR": "Vereador"}
GERAL = {"Presidente", "Governador", "Senador", "Deputado Federal", "Deputado Estadual", "Deputado Distrital"}
ELEITO = ("ELEITO", "ELEITO POR QP", "ELEITO POR MEDIA")


def zip_(tipo, ano):
    f = CACHE / f"{'cc' if tipo == 'consulta_cand' else 'vcm'}{str(ano)[2:]}.zip"
    if not f.exists():
        print("baixando", tipo, ano, flush=True)
        tmp = f.with_suffix(".part")
        with urllib.request.urlopen(urllib.request.Request(CDN.format(tipo, ano), headers=UA), timeout=300) as r, open(tmp, "wb") as o:
            while b := r.read(1 << 20):
                o.write(b)
        tmp.rename(f)
    return zipfile.ZipFile(f)


def linhas(z, nome_ok):
    for nome in z.namelist():
        if nome.lower().endswith(".csv") and nome_ok(nome.upper()):
            with z.open(nome) as f:
                yield nome, csv.DictReader(io.TextIOWrapper(f, encoding="latin-1", newline=""), delimiter=";")


def titulo(r):
    t = r.get("NR_TITULO_ELEITORAL_CANDIDATO", "").strip()
    return t if t.isdigit() and int(t) > 0 else ""


def num(s):
    try:
        return int(str(s).replace(".", ""))
    except ValueError:
        return 0


def norm_sit(s):
    return s.strip().capitalize() if s.strip() and not s.startswith("#") else ""


def alvos():
    """título -> [(uf, sq 2026 ou 2024)] de quem tem um pleito atual na plataforma (candidato em 2026, eleito em 2024)."""
    t = defaultdict(set)
    for _, rd in linhas(zip_("consulta_cand", 2026), lambda n: n.endswith("_BRASIL.CSV")):
        for r in rd:
            if titulo(r) and r["DS_CARGO"].upper() in CARGO:
                t[titulo(r)].add((r["SG_UF"].lower(), r["SQ_CANDIDATO"], 2026))
    for _, rd in linhas(zip_("consulta_cand", 2024), lambda n: n.endswith("_BRASIL.CSV")):
        for r in rd:
            if titulo(r) and r["DS_CARGO"].upper() in ("VEREADOR", "PREFEITO") and r["DS_SIT_TOT_TURNO"].upper().startswith("ELEITO"):
                t[titulo(r)].add((r["SG_UF"].lower(), r["SQ_CANDIDATO"], 2024))
    print("títulos-alvo:", len(t), flush=True)
    return t


def pleitos_do_ano(ano, alvo):
    """sq do ano -> (título, pleito sem votos); depois soma os votos por zona e a base do % de cada cargo/unidade."""
    cand = {}
    for _, rd in linhas(zip_("consulta_cand", ano), lambda n: n.endswith("_BRASIL.CSV")):
        for r in rd:
            cargo = CARGO.get(r["DS_CARGO"].upper())
            ti = titulo(r)
            if not cargo or not ti or ti not in alvo or r["NR_TURNO"] != "1":
                continue
            sg = r["SG_PARTIDO"].strip().upper()
            if sg.startswith("UNI") and len(sg) == 5:
                sg = "UNIÃO"
            cand[r["SQ_CANDIDATO"]] = (ti, [ano, cargo, r["SG_UF"].lower(), "" if cargo in GERAL else r["NM_UE"].strip().title(), sg,
                                            r["NR_CANDIDATO"], 0, 0, norm_sit(r.get("DS_SIT_TOT_TURNO", ""))], r["SG_UE"], cargo)
    votos, base = defaultdict(int), defaultdict(int)
    for nome, rd in linhas(zip_("votacao_candidato_munzona", ano), lambda n: True):
        brasil = nome.upper().endswith("_BRASIL.CSV")   # repete todos os cargos; só serve para presidente
        for r in rd:
            cargo = CARGO.get(r["DS_CARGO"].upper())
            if not cargo or r["NR_TURNO"] != "1" or brasil != (cargo == "Presidente"):
                continue
            v = num(r["QT_VOTOS_NOMINAIS_VALIDOS"] if "QT_VOTOS_NOMINAIS_VALIDOS" in r else r["QT_VOTOS_NOMINAIS"])
            base[(cargo, "BR" if cargo == "Presidente" else r["SG_UF"].upper() if cargo in GERAL else r["SG_UE"])] += v
            if r["SQ_CANDIDATO"] in cand:
                votos[r["SQ_CANDIDATO"]] += v
    out = {}
    for sq, (ti, p, ue, cargo) in cand.items():
        p[6] = votos.get(sq, 0)
        tot = base.get((cargo, "BR" if cargo == "Presidente" else p[2].upper() if cargo in GERAL else ue), 0)
        p[7] = round(p[6] / tot * 100, 2) if tot else 0
        if p[6] or p[8]:
            out.setdefault(ti, []).append(p)
    print(ano, len(out), "pessoas", flush=True)
    return out


def main():
    anos = [int(a) for a in sys.argv[1:]] or ANOS
    alvo = alvos()
    por_titulo = defaultdict(list)
    for ano in anos:
        for ti, ps in pleitos_do_ano(ano, alvo).items():
            por_titulo[ti].extend(ps)
    saida = defaultdict(dict)
    for ti, ligacoes in alvo.items():
        ps = por_titulo.get(ti)
        if not ps:
            continue
        for uf, sq, ano_ref in ligacoes:
            # na ficha de 2026 entram 2006-2024; na de 2024, 2006-2022 (o próprio 2024 já aparece na ficha)
            lista = sorted((p for p in ps if p[0] < ano_ref), key=lambda p: -p[0])
            if lista:
                saida[uf][sq] = lista
    OUT.mkdir(parents=True, exist_ok=True)
    for uf, d in saida.items():
        (OUT / f"{uf}.json").write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print("ok", uf, len(d), flush=True)


if __name__ == "__main__":
    main()
