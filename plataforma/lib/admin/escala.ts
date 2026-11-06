// Escala única de dias do painel admin (seletor "Parado há" e período do Analytics).
export const ESCALA_DIAS = [7, 15, 30, 45] as const;

const FUSO = 'America/Sao_Paulo';
const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' });

// Ano, mês (1 a 12) e dia no fuso de Brasília. Nunca usar getMonth() local: o servidor e o navegador mudam de fuso.
export function partesBrasilia(d: Date | string): { ano: number; mes: number; dia: number } {
  const p = Object.fromEntries(fmt.formatToParts(new Date(d)).map((x) => [x.type, x.value]));
  return { ano: Number(p.year), mes: Number(p.month), dia: Number(p.day) };
}

const numeroDoDia = (d: Date | string) => {
  const { ano, mes, dia } = partesBrasilia(d);
  return Date.UTC(ano, mes - 1, dia) / 86400000;
};

// Dias de calendário (Brasília) entre a última atividade e agora; atividade no futuro conta 0.
export function diasParado(ultima: string, agora: Date): number {
  return Math.max(0, numeroDoDia(agora) - numeroDoDia(ultima));
}
