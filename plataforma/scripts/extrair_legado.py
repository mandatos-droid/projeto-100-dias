"""Extrai do HTML original do Guia (contexto inicial/index (6).html) os pedaços que o Next serve:

  public/legacy/legacy.css      estilos + fontes originais (sem alteração)
  public/legacy/logo-N.png      logos embutidas no HTML
  public/legacy/*.js            os scripts originais, com poucos retoques (ver PATCHES)
  lib/legacyBody.ts             marcação do <body>
  (public/painel.html agora é mantido à mão, não é gerado)

Refazer a extração quando o HTML original mudar:  python scripts/extrair_legado.py
Cada retoque é conferido (precisa casar exatamente uma vez); se o original mudou, o script avisa.
"""
import base64, json, re, sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ORIG = RAIZ.parent / "contexto inicial"
OUT = RAIZ / "public" / "legacy"
OUT.mkdir(parents=True, exist_ok=True)

html = (ORIG / "index (6).html").read_text(encoding="utf-8")


def troca(texto, antigo, novo, vezes=1):
    n = texto.count(antigo)
    if n != vezes:
        sys.exit(f"retoque não casou ({n}x, esperado {vezes}): {antigo[:80]!r}")
    return texto.replace(antigo, novo)


# ---------- CSS ----------
estilos = re.findall(r"<style>(.*?)</style>", html, re.S)
(OUT / "legacy.css").write_text(estilos[0], encoding="utf-8")  # o 2º "<style>" do arquivo está dentro de uma string JS

# ---------- corpo + logos ----------
corpo = html[html.index("<body>") + 6: html.index("<script>")]
logos = re.findall(r'src="(data:image/png;base64,[A-Za-z0-9+/=]+)"', corpo)
for i, uri in enumerate(dict.fromkeys(logos), 1):
    (OUT / f"logo-{i}.png").write_bytes(base64.b64decode(uri.split(",", 1)[1]))
    corpo = corpo.replace(uri, f"/legacy/logo-{i}.png")
corpo = corpo.replace("</body>", "").strip()
(RAIZ / "lib" / "legacyBody.ts").write_text(
    "// gerado por scripts/extrair_legado.py — não editar à mão\nconst corpo: string = " + json.dumps(corpo, ensure_ascii=False) + ";\nexport default corpo;\n",
    encoding="utf-8")

# ---------- scripts ----------
scripts = re.findall(r"<script>(.*?)</script>", html, re.S)
nomes = ["conteudo", "nucleo", "app", "guia", "resumo", "iniciar"]
assert len(scripts) == len(nomes), len(scripts)
S = dict(zip(nomes, scripts))

# os módulos novos (islas React) precisam de: relacoes/tse no estado do mandato
S["nucleo"] = troca(S["nucleo"], "d.campos=d.campos||{};d.feitos=d.feitos||{};",
                    "d.campos=d.campos||{};d.feitos=d.feitos||{};d.relacoes=d.relacoes||{};d.tse=d.tse||{};")

# perguntas que hospedam um módulo: ganham um contêiner <div data-ilha="...">
ILHAS = {"m1.q2": "persona-tse", "m1.q4": "assentos", "m1.q5": "calor", "m1.q6": "municipio"}
for k, ilha in ILHAS.items():
    S["conteudo"] = troca(S["conteudo"], "{k:'%s',t:" % k, "{k:'%s',ilha:'%s',t:" % (k, ilha))

S["guia"] = troca(
    S["guia"],
    """placeholder="Escreva aqui a resposta da equipe"></textarea></label>';""",
    """placeholder="Escreva aqui a resposta da equipe"></textarea></label>'+
        (it.ilha?'<div class="ilha" data-ilha="'+it.ilha+'"></div>':'');""")
S["guia"] = troca(
    S["guia"],
    """'<span class="aj">'+i.d+'</span><textarea data-k="'+i.k+'"></textarea></label>'}).join('');""",
    """'<span class="aj">'+i.d+'</span><textarea data-k="'+i.k+'"></textarea></label>'+
        (i.ilha?'<div class="ilha" data-ilha="'+i.ilha+'"></div>':'')}).join('');""")
S["guia"] = troca(
    S["guia"],
    """    document.getElementById('tela').innerHTML=h;
    Campos.ligar(document.getElementById('tela'));""",
    """    var tl=document.getElementById('tela');
    tl.innerHTML=h;
    tl.className='tela'+(tl.querySelector('[data-ilha]')?' largo':'');
    Campos.ligar(tl);
    if(window.Ilhas)Ilhas.ligar(tl);""")

# resumo: cada pergunta com módulo ganha o que foi registrado nele
S["resumo"] = troca(
    S["resumo"],
    """return '<dt>'+(n+1)+'. '+esc(i.t)+'</dt><dd>'+Resumo.v(i.k)+'</dd>'}).join('')+'</dl>';break;""",
    """return '<dt>'+(n+1)+'. '+esc(i.t)+'</dt><dd>'+Resumo.v(i.k)+'</dd>'+
            (i.ilha&&window.ResumoIlhas?ResumoIlhas.html(i.ilha):'')}).join('')+'</dl>';break;""")

# "Conta criada. Confirme o e-mail" é aviso (err.aviso), não erro: sai em verde
S["app"] = troca(
    S["app"],
    """}catch(err){cx.innerHTML='<div class="erro-cx">'+esc(err.message)+'</div>'}""",
    """}catch(err){cx.innerHTML='<div class="erro-cx"'+(err.aviso?' style="background:rgba(27,107,79,.1);border-left-color:var(--ok);color:var(--ok)" role="status"':'')+'>'+esc(err.message)+'</div>'}""")

for nome, txt in S.items():
    (OUT / f"{nome}.js").write_text(txt, encoding="utf-8")

# public/painel.html NÃO é mais gerado aqui: virou arquivo mantido à mão
# (login pela sessão do app, leitura do Supabase). Não sobrescrever.
print("ok:",", ".join(sorted(x.name for x in OUT.iterdir())))
