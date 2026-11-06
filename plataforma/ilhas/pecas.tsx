'use client';
import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { corPartido, posEspectro } from '@/lib/partidos';
import type { GeoUF, Relacao, Status } from '@/lib/types';
import { marca, statusDe } from './ponte';

/** Ícone “i” que abre uma explicação curta ao lado de um número ou visualização (clique, toque ou foco).
    A caixa é posicionada em relação à janela, para nunca ficar cortada na borda nem atrás de outra caixa. */
export function Info({ texto, rotulo = 'O que é isto?' }: { texto: string; rotulo?: string }) {
  const [aberto, setAberto] = useState(false);
  const [sobre, setSobre] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 8, top: 0 });
  const raiz = useRef<HTMLSpanElement>(null);
  const caixa = useRef<HTMLSpanElement>(null);
  const mede = () => {
    const r = raiz.current?.getBoundingClientRect();
    if (!r) return;
    const w = Math.min(caixa.current?.offsetWidth ?? 288, window.innerWidth - 16);
    const h = caixa.current?.offsetHeight ?? 0;
    const left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 8));
    const abaixo = r.bottom + 6;
    const top = abaixo + h > window.innerHeight - 8 && r.top - h - 6 > 8 ? r.top - h - 6 : abaixo;
    setPos({ left, top });
  };
  const visivel = aberto || sobre;
  useEffect(() => {
    if (!visivel) return;
    mede();
    window.addEventListener('scroll', mede, true);
    window.addEventListener('resize', mede);
    return () => { window.removeEventListener('scroll', mede, true); window.removeEventListener('resize', mede); };
  }, [visivel]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span ref={raiz} className={`info ${aberto ? 'aberto' : ''}`} onMouseEnter={() => setSobre(true)} onMouseLeave={() => setSobre(false)}>
      <button type="button" className="info-bt" aria-label={rotulo} aria-expanded={aberto}
        onClick={() => setAberto((a) => !a)} onBlur={() => setAberto(false)} onKeyDown={(e) => e.key === 'Escape' && setAberto(false)}>i</button>
      <span ref={caixa} className="info-tx" role="note" style={{ left: pos.left, top: pos.top }}>{texto}</span>
    </span>
  );
}

/** Carrega um recurso assíncrono; refaz a carga quando a chave muda. */
export function useCarga<T>(fn: (() => Promise<T>) | null, chave: string) {
  const [estado, setEstado] = useState<{ chave: string; dados?: T; erro?: string }>({ chave: '' });
  useEffect(() => {
    if (!fn) return;
    let vivo = true;
    fn().then(
      (dados) => vivo && setEstado({ chave, dados }),
      (e) => vivo && setEstado({ chave, erro: String(e?.message ?? e) }),
    );
    return () => { vivo = false; };
  }, [chave]); // eslint-disable-line react-hooks/exhaustive-deps
  const atual = estado.chave === chave ? estado : { chave };
  return { dados: atual.dados, erro: atual.erro, carregando: !!fn && !atual.dados && !atual.erro };
}

/** Foto oficial da candidatura (TSE). Sem foto ou sem rede, fica a inicial do nome. */
export function urlFoto(sq: string, uf: string, ano: 2026 | 2024) {
  const base = ano === 2024 ? 'ele2024/619' : 'ele2026/6259';
  return `https://resultados.tse.jus.br/oficial/${base}/fotos/${uf.toLowerCase()}/${sq}.jpeg`;
}
export const anoDoCargo = (cargo: string): 2026 | 2024 => (/prefeit|vereador/i.test(cargo) ? 2024 : 2026);

export function Foto({ sq, uf, ano, nome, tam = 36 }: { sq: string; uf: string; ano: 2026 | 2024; nome: string; tam?: number }) {
  const [falhou, setFalhou] = useState(false);
  return (
    <span className="foto" style={{ width: tam, height: tam, fontSize: tam * 0.42 }} title={nome}>
      {(nome.trim()[0] ?? '?').toUpperCase()}
      {!falhou && sq && uf && (
        <img src={urlFoto(sq, uf, ano)} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFalhou(true)} />
      )}
    </span>
  );
}

export function Chip({ p }: { p: string }) {
  return <span className="chip"><i className="ponto" style={{ background: corPartido(p) }} />{p}</span>;
}

/** Formas geométricas das relações: parceiro = losango, concorrente = triângulo, esta liderança = estrela.
 *  A forma repete a cor, então a leitura não depende só do verde e do vermelho (WCAG 1.4.1). */
export const COR_REL = { aliado: '#1B6B4F', concorrente: '#C93636', proprio: '#E0A526' } as const;
export function Marca({ tipo, tam = 14 }: { tipo: 'aliado' | 'concorrente' | 'proprio'; tam?: number }) {
  const c = COR_REL[tipo];
  const f = tipo === 'aliado' ? <path d="M8 1.2 14.8 8 8 14.8 1.2 8Z" />
    : tipo === 'concorrente' ? <path d="M8 1.6 15 14H1Z" />
    : <path d="M8 1 9.9 5.8 15 6.1 11 9.3 12.4 14.4 8 11.6 3.6 14.4 5 9.3 1 6.1 6.1 5.8Z" />;
  return <svg className="marca" width={tam} height={tam} viewBox="0 0 16 16" fill={c} aria-hidden="true" focusable="false">{f}</svg>;
}
export const ROT_REL = { aliado: 'Parceiro', concorrente: 'Concorrente' } as const;

export function StatusBotoes({ chave, rel }: { chave: string; rel: Omit<Relacao, 'status'> }) {
  const atual = statusDe(chave);
  return (
    <span className="st">
      {(['aliado', 'concorrente'] as const).map((t) => (
        <button key={t} type="button" className={t} aria-pressed={atual === t}
          onClick={() => marca(chave, rel, atual, t)}>
          <Marca tipo={t} tam={11} />{ROT_REL[t]}
        </button>
      ))}
    </span>
  );
}

export function BarrasPartido({ dados, destaque }: { dados: [string, number][]; destaque?: string }) {
  const max = Math.max(1, ...dados.map((d) => d[1]));
  return (
    <div>
      {dados.map(([p, n]) => (
        <div className={`barra-p ${p === destaque ? 'dest' : ''}`} key={p}>
          <span>{p}</span>
          <span className="fundo"><i style={{ width: `${(n / max) * 100}%`, background: corPartido(p) }} /></span>
          <span className="v">{n.toLocaleString('pt-BR')}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- hemiciclo ---------- */
export type Membro = { key: string; nome: string; partido: string; votos: number };
const R = 300;

function layout(n: number) {
  if (n === 0) return { pos: [] as { x: number; y: number }[], r: 0 };
  const fileiras = Math.max(1, Math.round(Math.sqrt(n / 2.4)));
  const interno = fileiras === 1 ? 0.75 : 0.4;
  const raios = Array.from({ length: fileiras }, (_, i) => (interno + ((1 - interno) * (i + 0.5)) / fileiras) * R);
  const soma = raios.reduce((a, b) => a + b, 0);
  const qtd = raios.map((r) => Math.max(1, Math.round((n * r) / soma)));
  let dif = n - qtd.reduce((a, b) => a + b, 0);
  for (let i = fileiras - 1; dif !== 0; i = (i - 1 + fileiras) % fileiras) {
    qtd[i] += Math.sign(dif);
    dif -= Math.sign(dif);
    if (qtd[i] < 1) { qtd[i] = 1; dif += 1; }
  }
  const pts: { x: number; y: number; a: number; r: number }[] = [];
  raios.forEach((r, i) => {
    for (let j = 0; j < qtd[i]; j++) {
      const a = qtd[i] === 1 ? Math.PI / 2 : Math.PI * (1 - j / (qtd[i] - 1));
      pts.push({ x: r * Math.cos(a), y: -r * Math.sin(a), a, r });
    }
  });
  pts.sort((p, q) => q.a - p.a || p.r - q.r);
  const passo = ((1 - interno) * R) / fileiras;
  let minArco = Infinity;
  raios.forEach((r, i) => { if (qtd[i] > 1) minArco = Math.min(minArco, (Math.PI * r) / (qtd[i] - 1)); });
  return { pos: pts, r: Math.min(passo, minArco) * 0.43 };
}

export function Hemiciclo({ membros, partidos, filtroStatus, visivel, selecionado, proprio, onSelecionar }: {
  membros: Membro[]; partidos: Set<string>; filtroStatus: Status | 'todos'; visivel?: Set<string>;
  selecionado: string | null; proprio?: string | null; onSelecionar: (k: string) => void;
}) {
  const ordenados = useMemo(
    () => [...membros].sort((a, b) => posEspectro(a.partido) - posEspectro(b.partido) || a.partido.localeCompare(b.partido) || b.votos - a.votos),
    [membros]);
  const { pos, r } = useMemo(() => layout(ordenados.length), [ordenados.length]);
  return (
    <svg className="hemi" viewBox={`${-R - 14} ${-R - 14} ${2 * R + 28} ${R + 40}`} role="img" aria-label={`Hemiciclo com ${ordenados.length} cadeiras`}>
      {ordenados.map((m, i) => {
        const p = pos[i];
        const st = statusDe(m.key);
        const ativo = visivel ? visivel.has(m.key) : (partidos.size === 0 || partidos.has(m.partido)) && (filtroStatus === 'todos' || st === filtroStatus);
        const sel = selecionado === m.key;
        const meu = proprio === m.key;
        const cor = corPartido(m.partido);
        const lw = Math.max(1.2, r * 0.32);
        const contorno = sel ? '#571730' : st === 'aliado' ? COR_REL.aliado : st === 'concorrente' ? COR_REL.concorrente : 'none';
        const k = r * 1.28;
        const forma = st === 'aliado' ? `${p.x},${p.y - k} ${p.x + k},${p.y} ${p.x},${p.y + k} ${p.x - k},${p.y}`
          : st === 'concorrente' ? `${p.x},${p.y - k * 1.05} ${p.x + k * 1.05},${p.y + k * 0.8} ${p.x - k * 1.05},${p.y + k * 0.8}` : '';
        const props = { className: 'as', fill: cor, opacity: ativo ? 1 : 0.13, stroke: contorno, strokeWidth: contorno === 'none' ? 0 : lw, strokeLinejoin: 'round' as const };
        return (
          <g key={m.key} onClick={() => onSelecionar(m.key)}>
            <title>{`${m.nome} · ${m.partido} · ${m.votos.toLocaleString('pt-BR')} votos${st !== 'neutro' ? ` · ${ROT_REL[st]}` : ''}`}</title>
            {forma ? <polygon points={forma} {...props} /> : <circle cx={p.x} cy={p.y} r={r} {...props} />}
            {meu && <path className="estrela" transform={`translate(${p.x} ${p.y}) scale(${r / 5})`} d="M0-5 1.5-1.6 5-1.4 2.3 .9 3.2 4.4 0 2.5-3.2 4.4-2.3 .9-5-1.4-1.5-1.6Z" fill="#fff" stroke="#571730" strokeWidth={0.6} pointerEvents="none" />}
          </g>
        );
      })}
      <text x={0} y={-14} textAnchor="middle" fontSize={44} fontFamily="Anton, sans-serif" fill="#571730">{ordenados.length}</text>
      <text x={0} y={8} textAnchor="middle" fontSize={15} fill="#938780">cadeiras</text>
    </svg>
  );
}

/* ---------- svg com botões de zoom (+, −, ver tudo) e arrasto quando aproximado ---------- */
export function SvgZoom({ w, h, className, rotulo, role = 'img', children }: {
  w: number; h: number; className: string; rotulo: string; role?: 'img' | 'group'; children: ReactNode;
}) {
  const [v, setV] = useState({ k: 1, cx: w / 2, cy: h / 2 });
  const arr = useRef<{ x: number; y: number; cx: number; cy: number; moveu: boolean } | null>(null);
  const el = useRef<SVGSVGElement>(null);
  const limita = (n: { k: number; cx: number; cy: number }) => {
    const k = Math.min(10, Math.max(1, n.k)), vw = w / k, vh = h / k;
    return { k, cx: Math.min(w - vw / 2, Math.max(vw / 2, n.cx)), cy: Math.min(h - vh / 2, Math.max(vh / 2, n.cy)) };
  };
  const zoom = (f: number) => setV((a) => limita({ ...a, k: a.k * f }));
  const vw = w / v.k, vh = h / v.k;
  return (
    <div className="zm">
      <svg ref={el} className={className} viewBox={`${v.cx - vw / 2} ${v.cy - vh / 2} ${vw} ${vh}`} role={role} aria-label={rotulo}
        style={v.k > 1 ? { cursor: 'grab', touchAction: 'none' } : undefined}
        onPointerDown={(e) => { arr.current = { x: e.clientX, y: e.clientY, cx: v.cx, cy: v.cy, moveu: false }; }}
        onPointerMove={(e) => {
          const a = arr.current, r = el.current?.getBoundingClientRect();
          if (!a || !r || v.k === 1) return;
          const dx = e.clientX - a.x, dy = e.clientY - a.y;
          if (Math.abs(dx) + Math.abs(dy) > 4) a.moveu = true;
          if (a.moveu) setV(limita({ k: v.k, cx: a.cx - (dx / r.width) * vw, cy: a.cy - (dy / r.height) * vh }));
        }}
        onPointerUp={() => { setTimeout(() => { arr.current = null; }, 0); }}
        onPointerLeave={() => { arr.current = null; }}
        onClickCapture={(e) => { if (arr.current?.moveu) { e.stopPropagation(); e.preventDefault(); } }}>
        {children}
      </svg>
      <div className="cj-zoom" role="group" aria-label="Zoom do mapa">
        <button type="button" aria-label="Aproximar" onClick={() => zoom(1.8)}>+</button>
        <button type="button" aria-label="Afastar" onClick={() => zoom(1 / 1.8)}>−</button>
        <button type="button" aria-label="Ver o mapa inteiro" className="rs" disabled={v.k === 1} onClick={() => setV({ k: 1, cx: w / 2, cy: h / 2 })}>⤢</button>
      </div>
    </div>
  );
}

/* ---------- mapa municipal ---------- */
function MapaBase({ geo, fill, selecionado, onSelecionar, titulo }: {
  geo: GeoUF; fill: (id: string) => string; selecionado: string | null;
  onSelecionar: (id: string) => void; titulo: (id: string, nome: string) => string;
}) {
  return (
    <SvgZoom w={geo.w} h={geo.h} className="mapa" rotulo="Mapa dos municípios">
      {geo.mun.map((m) => (
        <path key={m.id} d={m.d} fill={fill(m.id)} onClick={() => onSelecionar(m.id)}>
          <title>{titulo(m.id, m.nm)}</title>
        </path>
      ))}
      {selecionado && geo.mun.filter((m) => m.id === selecionado).map((m) => (
        <path key="sel" d={m.d} fill="none" className="sel" pointerEvents="none" />
      ))}
    </SvgZoom>
  );
}
export const MapaMunicipios = memo(MapaBase);
