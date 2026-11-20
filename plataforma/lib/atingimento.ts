/* Missão 3 · status das metas e atingimento. O total pesa cada meta ativa por igual (objetivo com mais metas pesa mais); meta congelada fica fora da conta. */
import type { StatusMeta } from './rumo.ts';
import { lerSucessos } from './sucessos.ts';

/** Passos de 10% (SUG-43): Concluída (100), Em andamento – 90% ... Em andamento – 10% (#196: só 100% é "concluída"), Não concluída (0) e Congelada (fora da conta). */
export const STATUS: { id: StatusMeta; rot: string; pct: number | null }[] = [
  { id: 'concluida', rot: 'Concluída', pct: 100 },
  ...[90, 80, 70, 60, 50, 40, 30, 20, 10].map((n) => ({ id: `concluida${n}` as StatusMeta, rot: `Em andamento – ${n}%`, pct: n })),
  { id: 'nao_concluida', rot: 'Não concluída', pct: 0 },
  { id: 'congelada', rot: 'Congelada', pct: null },
];

/** Opções do seletor de status da meta. Com sucessos mensais o status é calculado pela média deles, então só se pode congelar
 *  (ou descongelar); sem sucessos vale a lista inteira. `atual` é o status já derivado (statusPorAtingimento). */
export function opcoesStatus(atual: StatusMeta | undefined, temSucessos: boolean): typeof STATUS {
  if (!temSucessos) return STATUS;
  const ids: string[] = atual === 'congelada' ? ['congelada', 'nao_concluida'] : [atual ?? 'nao_concluida', 'congelada'];
  return ids.map((id) => STATUS.find((x) => x.id === id)).filter((x): x is (typeof STATUS)[number] => !!x);
}

const media = (v: number[]) => Math.round(v.reduce((s, n) => s + n, 0) / v.length);

/** Atingimento de um status: o passo de 10% dele (concluída 100, "Em andamento – 70%" 70, não concluída 0); congelada é null. Status desconhecido vale 0. */
const pctStatus = (status?: string): number | null => {
  const s = STATUS.find((x) => x.id === status);
  return s ? s.pct : 0;
};

/** Atingimento da meta. Com sucessos mensais: a MÉDIA do atingimento de cada sucesso pelo status dele (70% e 50% dão 60%), arredondada;
 *  sucesso congelado fica fora e, se todos estão congelados, é null. O status próprio da meta não entra quando há sucessos (ele é derivado da média).
 *  Sem sucessos: o passo de 10% do status da meta. Meta congelada fica fora da conta (null) mesmo com sucessos. Sem status válido vale 0. */
export function pctMeta(status?: string, sucessos?: unknown): number | null {
  if (pctStatus(status) === null) return null;
  const lista = lerSucessos({ sucessos });
  if (lista.length) {
    const ativos = lista.map((x) => pctStatus(x.status)).filter((p): p is number => p !== null);
    return ativos.length ? media(ativos) : null;
  }
  return pctStatus(status);
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
