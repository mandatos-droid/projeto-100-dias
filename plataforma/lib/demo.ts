import type { Eleito } from './types.ts';

const MAX_SUGESTOES = 8;

/** Minúsculas, sem acentos e sem espaços nas pontas, para comparar nomes. */
export function normaliza(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Eleitos cujo nome de urna ou civil contém o termo; até 8, do mais votado ao menos votado. */
export function busca(eleitos: Eleito[], termo: string): Eleito[] {
  const t = normaliza(termo);
  if (t.length < 2) return [];
  return eleitos
    .filter((e) => normaliza(e.u).includes(t) || normaliza(e.c).includes(t))
    .sort((a, b) => b.v - a.v)
    .slice(0, MAX_SUGESTOES);
}
