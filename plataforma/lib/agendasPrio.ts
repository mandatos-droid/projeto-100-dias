/* Escolha das 3 agendas prioritárias (pergunta 3.3 da Missão 1). Guarda em D.agendasPrio a lista de ids. */
import { AGENDAS } from './agendas.ts';

export const MAX_PRIO = 3;

/** Marca ou desmarca a agenda. Id fora das 13 agendas é ignorado; a 4ª marcação não entra e devolve `cheio`.
 *  Sempre devolve uma lista nova (AGE-02, AGE-03, AGE-04). */
export function alterna(atual: string[], id: string): { lista: string[]; erro?: 'cheio' } {
  if (!AGENDAS.some((a) => a.id === id)) return { lista: [...atual] };
  if (atual.includes(id)) return { lista: atual.filter((x) => x !== id) };
  if (atual.length >= MAX_PRIO) return { lista: [...atual], erro: 'cheio' };
  return { lista: [...atual, id] };
}

/** Quantas agendas ainda faltam para chegar a 3 (AGE-02). */
export const faltam = (lista: string[]): number => Math.max(0, MAX_PRIO - lista.length);
