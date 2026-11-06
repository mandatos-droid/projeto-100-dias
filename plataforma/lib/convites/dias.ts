export type DiaDoMandato =
  | { estado: 'sem-posse' }
  | { estado: 'antes' }
  | { estado: 'em-curso'; dia: number }
  | { estado: 'concluido' };

const FUSO = 'America/Sao_Paulo';
const DIAS = 100;
const DIA_MS = 86_400_000;

// 'YYYY-MM-DD' -> dias desde 1970 (calendário puro, sem fuso).
function numeroDoDia(iso: string): number {
  const [a, m, d] = iso.split('-').map(Number);
  return Date.UTC(a, m - 1, d) / DIA_MS;
}

// Dia 1 é a data da posse; passados 100 dias da posse a contagem termina.
export function diaDoMandato(posse: string | null | undefined, agora: Date): DiaDoMandato {
  const dataPosse = /^\d{4}-\d{2}-\d{2}/.exec(posse ?? '')?.[0];
  if (!dataPosse) return { estado: 'sem-posse' };
  const hoje = agora.toLocaleDateString('en-CA', { timeZone: FUSO }); // YYYY-MM-DD no dia de Brasília
  const passados = numeroDoDia(hoje) - numeroDoDia(dataPosse);
  if (passados < 0) return { estado: 'antes' };
  if (passados >= DIAS) return { estado: 'concluido' };
  return { estado: 'em-curso', dia: passados + 1 };
}
