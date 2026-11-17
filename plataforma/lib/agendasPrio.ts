/* Escolha das agendas prioritárias (pergunta 3.3 da Missão 1). Guarda em D.agendasPrio a lista de ids.
   Não há limite: quantas o mandato escolher aqui são as únicas que ele pode priorizar na Missão 3 (até 3). */
import { AGENDAS_PRIO } from './agendas.ts';

/** Marca ou desmarca a agenda. Id desconhecido é ignorado. Sempre devolve uma lista nova. */
export function alterna(atual: string[], id: string): { lista: string[] } {
  if (!AGENDAS_PRIO.some((a) => a.id === id)) return { lista: [...atual] };
  if (atual.includes(id)) return { lista: atual.filter((x) => x !== id) };
  return { lista: [...atual, id] };
}

/** Ids válidos, sem repetição, na ordem em que foram escolhidos. */
export const validas = (lista: unknown): string[] =>
  [...new Set(Array.isArray(lista) ? (lista as unknown[]) : [])].filter((id): id is string => typeof id === 'string' && AGENDAS_PRIO.some((a) => a.id === id));
