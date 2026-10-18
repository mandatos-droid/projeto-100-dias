'use client';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GeoUF } from '@/lib/types';
import { COR_REL } from './pecas';

/** Valor de um município na camada ativa: cor de preenchimento e linhas do balão. */
export type Celula = { fill: string; titulo: string; linhas: string[] };
export type Marcas = Record<string, { aliado: number; concorrente: number }>;

type Vista = { cx: number; cy: number; k: number };
type Caixa = { x0: number; y0: number; x1: number; y1: number };

const bbox = (d: string): Caixa => {
  const n = d.match(/-?\d+\.?\d*/g) ?? [];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i + 1 < n.length; i += 2) {
    const x = +n[i], y = +n[i + 1];
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1 };
};

/** Camada de municípios: só redesenha quando as cores mudam, não a cada movimento do mouse. */
const Municipios = memo(function Municipios({ geo, celulas }: { geo: GeoUF; celulas: Record<string, Celula> }) {
  return (
    <g>
      {geo.mun.map((m) => <path key={m.id} d={m.d} data-id={m.id} fill={celulas[m.id]?.fill ?? '#efe8d8'} />)}
    </g>
  );
});

export default function MapaConjuntura({ geo, celulas, selecionado, casa = null, marcas = {}, mostraMarcas = false, onSelecionar, focoSignal = 0, multi }: {
  geo: GeoUF; celulas: Record<string, Celula>; selecionado: string | null; casa?: string | null;
  marcas?: Marcas; mostraMarcas?: boolean; onSelecionar: (id: string | null) => void; focoSignal?: number;
  /** seleção múltipla (ex.: vários municípios de uma vez): contorno em todos eles */
  multi?: Set<string>;
}) {
  const [vista, setVista] = useState<Vista>({ cx: geo.w / 2, cy: geo.h / 2, k: 1 });
  const [foco, setFoco] = useState<string | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const arrasto = useRef<{ x: number; y: number; cx: number; cy: number; moveu: boolean } | null>(null);
  const anim = useRef(0);
  const vistaRef = useRef(vista);
  vistaRef.current = vista;

  const caixas = useMemo(() => {
    const o: Record<string, Caixa> = {};
    geo.mun.forEach((m) => { o[m.id] = bbox(m.d); });
    return o;
  }, [geo]);
  const porId = useMemo(() => new Map(geo.mun.map((m) => [m.id, m])), [geo]);

  const limita = useCallback((v: Vista): Vista => {
    const k = Math.min(14, Math.max(1, v.k));
    const w = geo.w / k, h = geo.h / k;
    return { k, cx: Math.min(geo.w - w / 2, Math.max(w / 2, v.cx)), cy: Math.min(geo.h - h / 2, Math.max(h / 2, v.cy)) };
  }, [geo]);

  const vaiPara = useCallback((alvo: Vista) => {
    cancelAnimationFrame(anim.current);
    const a = vistaRef.current, b = limita(alvo), t0 = performance.now();
    const passo = (t: number) => {
      const p = Math.min(1, (t - t0) / 380), e = 1 - Math.pow(1 - p, 3);
      setVista({ cx: a.cx + (b.cx - a.cx) * e, cy: a.cy + (b.cy - a.cy) * e, k: a.k * Math.pow(b.k / a.k, e) });
      if (p < 1) anim.current = requestAnimationFrame(passo);
    };
    anim.current = requestAnimationFrame(passo);
  }, [limita]);

  const focaMun = useCallback((id: string) => {
    const b = caixas[id];
    if (!b) return;
    const k = Math.min(10, 0.55 * Math.min(geo.w / Math.max(b.x1 - b.x0, 1), geo.h / Math.max(b.y1 - b.y0, 1)));
    vaiPara({ cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, k: Math.max(1.6, k) });
  }, [caixas, geo, vaiPara]);

  // o botão "Aproximar" do painel manda um sinal; o mapa se aproxima do município selecionado
  const sinal = useRef(focoSignal);
  useEffect(() => {
    if (sinal.current === focoSignal) return;
    sinal.current = focoSignal;
    if (selecionado) focaMun(selecionado);
  }, [focoSignal, selecionado, focaMun]);

  useEffect(() => { setVista({ cx: geo.w / 2, cy: geo.h / 2, k: 1 }); }, [geo]);
  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  const w = geo.w / vista.k, h = geo.h / vista.k, x = vista.cx - w / 2, y = vista.cy - h / 2;

  // roda do mouse: zoom em torno do cursor (precisa de listener não passivo para segurar a rolagem da página)
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const f = (e: WheelEvent) => {
      e.preventDefault();
      cancelAnimationFrame(anim.current);
      const v = vistaRef.current, r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      const wx = v.cx - geo.w / v.k / 2 + px * (geo.w / v.k), wy = v.cy - geo.h / v.k / 2 + py * (geo.h / v.k);
      const k = Math.min(14, Math.max(1, v.k * Math.exp(-e.deltaY * 0.0018)));
      setVista(limita({ k, cx: wx - (px - 0.5) * (geo.w / k), cy: wy - (py - 0.5) * (geo.h / k) }));
    };
    el.addEventListener('wheel', f, { passive: false });
    return () => el.removeEventListener('wheel', f);
  }, [geo, limita]);

  const idDe = (t: EventTarget | null) => (t as SVGElement | null)?.dataset?.id ?? null;

  function move(e: React.PointerEvent) {
    const r = caixa.current?.getBoundingClientRect();
    if (tip.current && r) {
      const lw = tip.current.offsetWidth;
      const left = e.clientX - r.left + 16;
      tip.current.style.transform = `translate(${left + lw > r.width ? left - lw - 32 : left}px, ${e.clientY - r.top + 16}px)`;
    }
    const a = arrasto.current;
    if (a && svg.current) {
      const rs = svg.current.getBoundingClientRect(), dx = e.clientX - a.x, dy = e.clientY - a.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) a.moveu = true;
      if (a.moveu) {
        const v = vistaRef.current;
        setVista(limita({ k: v.k, cx: a.cx - (dx / rs.width) * (geo.w / v.k), cy: a.cy - (dy / rs.height) * (geo.h / v.k) }));
        setFoco(null);
        return;
      }
    }
    const id = idDe(e.target);
    setFoco((f) => (f === id ? f : id));
  }

  const focoCel = foco ? celulas[foco] : null;
  const focoGeo = foco ? porId.get(foco) : null;
  const selGeo = selecionado ? porId.get(selecionado) : null;
  const casaGeo = casa ? porId.get(casa) : null;
  const s = 1 / vista.k; // mantém marcadores com o mesmo tamanho na tela, em qualquer zoom
  const centro = (id: string) => { const b = caixas[id]; return { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 }; };

  return (
    <div className="cj-mapa" ref={caixa}>
      <svg ref={svg} className="mapa cj-svg" viewBox={`${x} ${y} ${w} ${h}`} role="img" aria-label="Mapa dos municípios. Passe o mouse para ver o nome; role para aproximar; arraste para mover."
        style={{ cursor: arrasto.current?.moveu ? 'grabbing' : 'pointer', touchAction: 'none' }}
        onPointerDown={(e) => { arrasto.current = { x: e.clientX, y: e.clientY, cx: vista.cx, cy: vista.cy, moveu: false }; }}
        onPointerMove={move}
        onPointerUp={(e) => {
          const a = arrasto.current; arrasto.current = null;
          if (!a?.moveu) { const id = idDe(e.target); onSelecionar(id === selecionado ? null : id); }
        }}
        onPointerLeave={() => { arrasto.current = null; setFoco(null); }}>
        <Municipios geo={geo} celulas={celulas} />
        {foco && focoGeo && foco !== selecionado && <path d={focoGeo.d} className="cj-hover" pointerEvents="none" />}
        {multi && geo.mun.filter((m) => multi.has(m.id)).map((m) => <path key={m.id} d={m.d} className="cj-sel2" pointerEvents="none" />)}
        {selGeo && <path d={selGeo.d} className="cj-sel" pointerEvents="none" />}
        {mostraMarcas && Object.entries(marcas).map(([id, mk]) => {
          if (!caixas[id]) return null;
          const c = centro(id);
          return (
            <g key={id} transform={`translate(${c.x} ${c.y}) scale(${s})`} pointerEvents="none" className="cj-marca">
              {mk.aliado > 0 && <path d="M0-9 8 0 0 9-8 0Z" transform={mk.concorrente ? 'translate(-7 0)' : ''} fill={COR_REL.aliado} style={{ stroke: '#fff', strokeWidth: 1.6 }} />}
              {mk.concorrente > 0 && <path d="M0-9 9 7H-9Z" transform={mk.aliado ? 'translate(7 0)' : ''} fill={COR_REL.concorrente} style={{ stroke: '#fff', strokeWidth: 1.6 }} />}
            </g>
          );
        })}
        {casaGeo && (() => {
          const c = centro(casa!);
          return (
            <g transform={`translate(${c.x} ${c.y - 12 * s}) scale(${s})`} pointerEvents="none">
              <path d="M0-12 3.2-4 12-3.4 5.2 2.2 7.4 11 0 6.2-7.4 11-5.2 2.2-12-3.4-3.2-4Z" fill={COR_REL.proprio} style={{ stroke: '#571730', strokeWidth: 1.4 }} />
            </g>
          );
        })()}
      </svg>

      <div className="cj-tip" ref={tip} style={{ opacity: foco && focoCel ? 1 : 0 }} aria-hidden="true">
        {focoCel && (<><b>{focoCel.titulo}</b>{focoCel.linhas.map((l, i) => <span key={i}>{l}</span>)}</>)}
      </div>

      <div className="cj-zoom" role="group" aria-label="Zoom do mapa">
        <button type="button" aria-label="Aproximar" onClick={() => vaiPara({ ...vista, k: vista.k * 1.8 })}>+</button>
        <button type="button" aria-label="Afastar" onClick={() => vaiPara({ ...vista, k: vista.k / 1.8 })}>−</button>
        <button type="button" aria-label="Ver o estado inteiro" className="rs" disabled={vista.k === 1} onClick={() => vaiPara({ cx: geo.w / 2, cy: geo.h / 2, k: 1 })}>⤢</button>
      </div>
    </div>
  );
}
