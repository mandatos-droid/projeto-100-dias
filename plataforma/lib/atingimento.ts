/* Missão 3 · status das metas e atingimento. Média simples, sem pesos; meta congelada fica fora da conta. */
import type { StatusMeta } from './rumo.ts';

export const STATUS: { id: StatusMeta; rot: string; pct: number | null }[] = [
  { id: 'concluida', rot: 'Concluída', pct: 100 },
  { id: 'concluida70', rot: 'Concluída 70%', pct: 70 },
  { id: 'nao_concluida', rot: 'Não concluída', pct: 0 },
  { id: 'congelada', rot: 'Congelada', pct: null },
];

/** Atingimento da meta: 100, 70, 0, ou null (congelada, fora da conta). Sem status válido vale 0. */
export function pctMeta(status?: string): number | null {
  const s = STATUS.find((x) => x.id === status);
  return s ? s.pct : 0;
}

const media = (v: number[]) => Math.round(v.reduce((s, n) => s + n, 0) / v.length);

/** Média das metas não congeladas, arredondada; null se não há meta ativa. */
export function pctObjetivo(metas: { status?: string }[]): number | null {
  const ativas = metas.map((m) => pctMeta(m.status)).filter((p): p is number => p !== null);
  return ativas.length ? media(ativas) : null;
}

/** Média dos objetivos que têm atingimento; null se nenhum tem. */
export function pctTotal(objetivos: (number | null)[]): number | null {
  const com = objetivos.filter((p): p is number => p !== null);
  return com.length ? media(com) : null;
}
