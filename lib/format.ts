export const nf = new Intl.NumberFormat('pt-BR');
export const pct = (x: number, d = 2) =>
  `${x.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })}%`;
export const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
