'use client';
import { memo, useEffect, useMemo, useState } from 'react';
import { carregaMun } from '@/lib/dados';
import type { GeoUF } from '@/lib/types';

/** Código IBGE da UF (2 primeiros dígitos do id do município) → sigla, para achar o arquivo de dados. */
const UF_IBGE: Record<string, string> = {
  '11': 'ro', '12': 'ac', '13': 'am', '14': 'rr', '15': 'pa', '16': 'ap', '17': 'to', '21': 'ma', '22': 'pi', '23': 'ce',
  '24': 'rn', '25': 'pb', '26': 'pe', '27': 'al', '28': 'se', '29': 'ba', '31': 'mg', '32': 'es', '33': 'rj', '35': 'sp',
  '41': 'pr', '42': 'sc', '43': 'rs', '50': 'ms', '51': 'mt', '52': 'go', '53': 'df',
};

type Rot = { id: string; nm: string; x: number; y: number; peso: number };

/** Centro da caixa de cada município + peso (votos válidos; sem dados, a área da caixa), do maior para o menor. */
function useRotulos(geo: GeoUF): Rot[] {
  const [pesos, setPesos] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    let vivo = true;
    const sg = UF_IBGE[geo.mun[0]?.id.slice(0, 2) ?? ''];
    setPesos(null);
    if (!sg) return;
    carregaMun(sg).then((m) => {
      if (!vivo) return;
      const o: Record<string, number> = {};
      for (const [id, v] of Object.entries(m.mun)) o[id] = v.presidente?.v ?? v.governador?.v ?? v.federal?.v ?? 0;
      setPesos(o);
    }).catch(() => {});
    return () => { vivo = false; };
  }, [geo]);

  return useMemo(() => {
    const lista = geo.mun.map((m) => {
      const n = m.d.match(/-?\d+\.?\d*/g) ?? [];
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (let i = 0; i + 1 < n.length; i += 2) {
        const x = +n[i], y = +n[i + 1];
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      return { id: m.id, nm: m.nm, x: (x0 + x1) / 2, y: (y0 + y1) / 2, peso: pesos?.[m.id] ?? 0, area: (x1 - x0) * (y1 - y0) };
    });
    const semDados = !pesos || lista.every((l) => !l.peso);
    return lista.map((l) => ({ id: l.id, nm: l.nm, x: l.x, y: l.y, peso: semDados ? l.area : l.peso })).sort((a, b) => b.peso - a.peso);
  }, [geo, pesos]);
}

/**
 * Nomes das cidades maiores, que vão aparecendo conforme o zoom (como num mapa de ruas).
 * Entra por ordem de tamanho e só se não bater em outro nome já posto; o texto tem tamanho fixo na tela.
 * `upp` = unidades do mapa por pixel da tela.
 */
export const RotulosMun = memo(function RotulosMun({ geo, k, upp, caixa }: {
  geo: GeoUF; k: number; upp: number; caixa: { x: number; y: number; w: number; h: number };
}) {
  const rots = useRotulos(geo);
  const fs = 11 * upp;
  // a escolha depende só do zoom (não do arrasto), para os nomes não piscarem ao mover o mapa
  const postos = useMemo(() => {
    if (!upp || !isFinite(upp)) return [] as Rot[];
    const limite = Math.ceil(8 * Math.pow(k, 1.5)), out: (Rot & { w: number })[] = [];
    for (const r of rots) {
      if (out.length >= limite) break;
      const w = r.nm.length * fs * 0.58 + 6 * upp, h = fs * 1.25;
      const bate = out.some((o) => Math.abs(o.x - r.x) < (o.w + w) / 2 && Math.abs(o.y - r.y) < h);
      if (!bate) out.push({ ...r, w });
    }
    return out;
  }, [rots, k, upp, fs]);

  const m = 40 * upp;
  return (
    <g className="rot-mun" fontSize={fs} pointerEvents="none" aria-hidden="true">
      {postos.filter((r) => r.x > caixa.x - m && r.x < caixa.x + caixa.w + m && r.y > caixa.y - m && r.y < caixa.y + caixa.h + m).map((r) => (
        <text key={r.id} x={r.x} y={r.y} textAnchor="middle" dominantBaseline="central" strokeWidth={3 * upp}>{r.nm}</text>
      ))}
    </g>
  );
});

/** Largura (px) do elemento, acompanhando redimensionamento. */
export function useLarguraPx(el: React.RefObject<Element | null>): number {
  const [px, setPx] = useState(0);
  useEffect(() => {
    const e = el.current;
    if (!e) return;
    const f = () => setPx(e.getBoundingClientRect().width);
    f();
    const ro = new ResizeObserver(f);
    ro.observe(e);
    return () => ro.disconnect();
  }, [el]);
  return px;
}
