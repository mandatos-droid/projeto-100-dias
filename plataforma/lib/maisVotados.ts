/* Os 5 municípios em que a liderança teve mais votos (pergunta 1.2 e cartões da 2.2).
   Entrada: o formato de /api/votos-mun, { [cdi]: [votos, votos válidos do município] }. */

export type MunVotado = { pos: number; cdi: string; nome: string; votos: number; pct: number };

/** Ordem decrescente de votos, desempate por nome; no máximo 5. `pct` = votos / válidos × 100.
 *  Município com válidos 0 fica fora (não há % a mostrar). Sem nome no mapa, o código IBGE faz as vezes. */
export function cincoMais(mun: Record<string, [number, number]>, nomes: Map<string, string>): MunVotado[] {
  return Object.entries(mun ?? {})
    .filter(([, [, vv]]) => vv > 0)
    .map(([cdi, [votos, vv]]) => ({ cdi, nome: nomes.get(cdi) ?? cdi, votos, pct: (votos / vv) * 100 }))
    .sort((a, b) => b.votos - a.votos || a.nome.localeCompare(b.nome, 'pt'))
    .slice(0, 5)
    .map((m, i) => ({ pos: i + 1, ...m }));
}
