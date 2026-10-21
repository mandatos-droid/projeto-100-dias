import type { Mun, MunCand, PartidoVotos } from './types';
import type { Hist, HistBloco } from './dados';

/** Cargos com votação em 2022 (chave em public/data/hist) e o bloco equivalente em public/data/mun (2026). */
export const CARGOS_22 = ['presidente', 'governador', 'senador', 'federal', 'estadual'] as const;
export type Cargo22 = (typeof CARGOS_22)[number];

/** Bloco de 2022 de um município e cargo (undefined se o município não tem o dado). */
export const bloco22 = (h: Hist | undefined, cdi: string, cargo: Cargo22): HistBloco | undefined => h?.[cdi]?.[`${cargo}2022`];

/** Participação de cada partido nos votos nominais do bloco, em %. */
export const pctPartidos = (p: PartidoVotos | undefined, total: number): Record<string, number> => {
  const o: Record<string, number> = {};
  if (total > 0) for (const [sg, v] of p ?? []) o[sg] = (v / total) * 100;
  return o;
};

export type Variacao = { partido: string; v22: number; v26: number; p22: number; p26: number; dp: number };

/** Variação 2022 → 2026 por partido: votos, % e diferença em pontos percentuais. Ordenada pelo maior ganho. */
export function variacaoPartidos(a: HistBloco | undefined, b: { v: number; p: PartidoVotos } | undefined): Variacao[] {
  if (!a || !b) return [];
  const p22 = pctPartidos(a.p, a.v), p26 = pctPartidos(b.p, b.v);
  const v22 = Object.fromEntries(a.p), v26 = Object.fromEntries(b.p);
  return [...new Set([...Object.keys(p22), ...Object.keys(p26)])]
    .map((partido) => ({ partido, v22: v22[partido] ?? 0, v26: v26[partido] ?? 0, p22: p22[partido] ?? 0, p26: p26[partido] ?? 0, dp: (p26[partido] ?? 0) - (p22[partido] ?? 0) }))
    .sort((x, y) => y.dp - x.dp);
}

/** Bloco de 2026 de um município para o cargo (senador, federal...). */
export const bloco26 = (m: Mun | undefined, cargo: Cargo22) => m?.[cargo];

/** Candidatos de 2022 de um município e cargo, já com a % dos votos nominais do bloco. */
export const candidatos22 = (b: HistBloco | undefined): (MunCand & { pct: number })[] =>
  (b?.c ?? []).map((c) => Object.assign([...c] as MunCand, { pct: b && b.v ? (c[2] / b.v) * 100 : 0 }));
