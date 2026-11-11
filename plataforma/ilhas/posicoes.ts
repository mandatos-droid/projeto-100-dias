import type { PosExec, RegExec } from '@/lib/types';

/* posição do partido diante de cada Executivo. A sugestão sai da coligação com que o eleito disputou. */
export const POSICOES: { k: PosExec; rot: string }[] = [
  { k: 'governo', rot: 'Partido do governo' },
  { k: 'base', rot: 'Base aliada' },
  { k: 'oposicao', rot: 'Oposição' },
  { k: 'independente', rot: 'Independente' },
];
export const ROT_POS = Object.fromEntries(POSICOES.map((p) => [p.k, p.rot])) as Record<PosExec, string>;

/** Do que a coligação da eleição diz sobre o partido: 'governo' (é o do eleito), 'base' (está na coligação) ou null. */
export function sugere(reg: RegExec | undefined, partido: string): PosExec | null {
  if (!reg) return null;
  return reg.p === partido ? 'governo' : reg.c.includes(partido) ? 'base' : null;
}
