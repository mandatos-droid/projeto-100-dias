/* Missão 3 · status das metas e atingimento. O total pesa cada meta ativa por igual (objetivo com mais metas pesa mais); meta congelada fica fora da conta. */
import type { StatusMeta } from './rumo.ts';
import { atingidos, lerSucessos } from './sucessos.ts';

/** Passos de 10% (SUG-43): Concluída (100), Concluída 90% ... Concluída 10%, Não concluída (0) e Congelada (fora da conta). */
export const STATUS: { id: StatusMeta; rot: string; pct: number | null }[] = [
  { id: 'concluida', rot: 'Concluída', pct: 100 },
  ...[90, 80, 70, 60, 50, 40, 30, 20, 10].map((n) => ({ id: `concluida${n}` as StatusMeta, rot: `Concluída ${n}%`, pct: n })),
  { id: 'nao_concluida', rot: 'Não concluída', pct: 0 },
  { id: 'congelada', rot: 'Congelada', pct: null },
];

/** Atingimento da meta. Com sucessos mensais: atingidos/total arredondado (null se todos congelados). Sem sucessos: 100, 70 ou 0
 *  pelo status. Meta congelada fica fora da conta (null) mesmo com sucessos. Sem status válido vale 0. */
export function pctMeta(status?: string, sucessos?: unknown): number | null {
  const s = STATUS.find((x) => x.id === status);
  if (s && s.pct === null) return null;
  const lista = lerSucessos({ sucessos });
  if (lista.length) {
    const { atingidos: a, total } = atingidos(lista);
    return total ? Math.round((a / total) * 100) : null;
  }
  return s ? s.pct : 0;
}

/** Status que o atingimento (0 a 100) pede: o passo de 10% logo abaixo (100 concluída, 87 vira "concluída 80%", 0 não concluída). Meta congelada não muda; sem sucessos ativos mantém o atual. */
export function statusPorAtingimento(atual: StatusMeta | undefined, sucessos: unknown): StatusMeta {
  const base = atual ?? 'nao_concluida';
  if (base === 'congelada') return base;
  const pct = pctMeta(base, sucessos);
  if (pct === null || !lerSucessos({ sucessos }).length) return base;
  const passo = Math.floor(pct / 10) * 10;
  return STATUS.find((x) => x.pct === passo)?.id ?? 'nao_concluida';
}

const media = (v: number[]) => Math.round(v.reduce((s, n) => s + n, 0) / v.length);

/** Média das metas não congeladas, arredondada; null se não há meta ativa. */
export function pctObjetivo(metas: { status?: string; sucessos?: unknown }[]): number | null {
  const ativas = metas.map((m) => pctMeta(m.status, m.sucessos)).filter((p): p is number => p !== null);
  return ativas.length ? media(ativas) : null;
}

/** Média dos objetivos que têm atingimento; null se nenhum tem. (Média simples: o total do plano usa pctPlano, que pesa as metas.) */
export function pctTotal(objetivos: (number | null)[]): number | null {
  const com = objetivos.filter((p): p is number => p !== null);
  return com.length ? media(com) : null;
}

/** Atingimento do plano (SUG-45): média de TODAS as metas ativas, então cada meta pesa o mesmo no todo e quem bate só uma
 *  meta de um objetivo com uma meta não puxa o total como se o objetivo inteiro estivesse cumprido. null se não há meta ativa. */
export function pctPlano(objetivos: { metas: { status?: string; sucessos?: unknown }[] }[]): number | null {
  return pctObjetivo(objetivos.flatMap((o) => o.metas));
}
