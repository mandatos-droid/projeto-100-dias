const PALETA: Record<string, string> = {
  PT: '#e5383b', PL: '#1d4ed8', 'UNIÃO': '#0891b2', PSD: '#eab308', PP: '#14b8a6', REPUBLICANOS: '#6366f1',
  MDB: '#15803d', PODE: '#84cc16', PSB: '#f97316', PSOL: '#a21caf', PSDB: '#60a5fa', PDT: '#7c3aed',
  NOVO: '#fb923c', PCDOB: '#9f1239', PV: '#4ade80', AVANTE: '#a78bfa', SOLIDARIEDADE: '#f472b6',
  PRD: '#78716c', 'MISSÃO': '#64748b', REDE: '#65a30d', CIDADANIA: '#fcd34d', DC: '#92400e', AGIR: '#b45309',
  PMB: '#0d9488', PRTB: '#475569', PCO: '#7f1d1d', PSTU: '#991b1b', PCB: '#b91c1c', UP: '#dc2626',
  DEMOCRATA: '#38bdf8', MOBILIZA: '#c084fc', PMN: '#e879f9',
};

// da esquerda para a direita; usado para ordenar as cadeiras no hemiciclo
export const ESPECTRO = ['PSTU', 'PCO', 'PCB', 'UP', 'PSOL', 'PCDOB', 'PT', 'PV', 'REDE', 'PSB', 'PDT', 'SOLIDARIEDADE',
  'AVANTE', 'CIDADANIA', 'PSDB', 'MDB', 'PODE', 'PSD', 'AGIR', 'PMB', 'DEMOCRATA', 'MOBILIZA', 'PMN', 'REPUBLICANOS',
  'PP', 'UNIÃO', 'PRD', 'NOVO', 'PL', 'PRTB', 'DC', 'MISSÃO'];

export function posEspectro(p: string) {
  const i = ESPECTRO.indexOf(p);
  return i < 0 ? 999 : i;
}

export function corPartido(p: string) {
  if (PALETA[p]) return PALETA[p];
  let h = 0;
  for (const ch of p) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 50% 45%)`;
}

/** Mistura a cor do partido com o creme de fundo: t = 0 → creme, t = 1 → cor cheia. */
export function mistura(cor: string, t: number) {
  const base = [243, 239, 230];
  let rgb = [90, 90, 90];
  if (cor.startsWith('#')) {
    const n = parseInt(cor.slice(1), 16);
    rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const c = rgb.map((v, i) => Math.round(base[i] + (v - base[i]) * t));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}
