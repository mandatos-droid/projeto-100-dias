/* Missão 3 · status das metas e atingimento. Média simples, sem pesos; meta congelada fica fora da conta. */
import type { StatusMeta } from './rumo.ts';
import { atingidos, lerSucessos } from './sucessos.ts';

export const STATUS: { id: StatusMeta; rot: string; pct: number | null }[] = [
  { id: 'concluida', rot: 'Concluída', pct: 100 },
  { id: 'concluida70', rot: 'Concluída 70%', pct: 70 },
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

/** Status que o atingimento (0 a 100) pede: 100 concluída, 70 ou mais "concluída 70%", abaixo disso não concluída. Meta congelada não muda; sem sucessos ativos mantém o atual. */
export function statusPorAtingimento(atual: StatusMeta | undefined, sucessos: unknown): StatusMeta {
  const base = atual ?? 'nao_concluida';
  if (base === 'congelada') return base;
  const pct = pctMeta(base, sucessos);
  if (pct === null || !lerSucessos({ sucessos }).length) return base;
  return pct >= 100 ? 'concluida' : pct >= 70 ? 'concluida70' : 'nao_concluida';
}

const media = (v: number[]) => Math.round(v.reduce((s, n) => s + n, 0) / v.length);

/** Média das metas não congeladas, arredondada; null se não há meta ativa. */
export function pctObjetivo(metas: { status?: string; sucessos?: unknown }[]): number | null {
  const ativas = metas.map((m) => pctMeta(m.status, m.sucessos)).filter((p): p is number => p !== null);
  return ativas.length ? media(ativas) : null;
}

/** Média dos objetivos que têm atingimento; null se nenhum tem. */
export function pctTotal(objetivos: (number | null)[]): number | null {
  const com = objetivos.filter((p): p is number => p !== null);
  return com.length ? media(com) : null;
}
