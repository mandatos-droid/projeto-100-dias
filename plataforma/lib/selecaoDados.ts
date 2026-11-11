/* Seleção de 2 dados clicando na página (Conjuntura, pergunta 2.2): máquina de estados pura, sem DOM.
   A captura só grava quando termina: cancelar (botão ou Esc) no meio descarta o que já foi clicado (SEL-01). */
import type { DadoPartido } from './dadosPartido.ts';

export type Par = [DadoPartido | null, DadoPartido | null];
export type Fase = 'ociosa' | 'capturando' | 'concluida';
/** `atuais`: os dados já gravados (chips); `novos`: os clicados nesta captura, ainda não gravados. */
export type Estado = { fase: Fase; atuais: Par; novos: DadoPartido[]; aviso: string | null };
export type Evento =
  | { tipo: 'iniciar'; atuais: Par }
  | { tipo: 'capturar'; dado: DadoPartido }
  | { tipo: 'cancelar' }
  | { tipo: 'remover'; i: 0 | 1 };

export const AVISO_REPETIDO = 'Escolha um indicador diferente.';
const ORDINAL = ['1º', '2º'] as const;

export const estadoInicial = (atuais: Par = [null, null]): Estado => ({ fase: 'ociosa', atuais, novos: [], aviso: null });

/** Quantos dados ainda faltam escolher. */
export const vagas = (atuais: Par): number => atuais.filter((d) => !d).length;

/** Os dois dados depois da captura: os clicados ocupam, em ordem, as vagas livres. */
export function dadosFinais(e: Estado): Par {
  const fim: Par = [...e.atuais];
  const fila = [...e.novos];
  for (const i of [0, 1] as const) if (!fim[i] && fila.length) fim[i] = fila.shift()!;
  return fim;
}

export function proximo(e: Estado, ev: Evento): Estado {
  switch (ev.tipo) {
    case 'iniciar':
      // sem vaga livre não há o que capturar: o usuário remove um chip antes
      return vagas(ev.atuais) === 0 ? { ...e, fase: 'ociosa', atuais: ev.atuais, novos: [], aviso: null }
        : { fase: 'capturando', atuais: ev.atuais, novos: [], aviso: null };
    case 'capturar': {
      if (e.fase !== 'capturando') return e;
      const ja = [...e.atuais, ...e.novos].some((d) => d?.id === ev.dado.id);
      if (ja) return { ...e, aviso: AVISO_REPETIDO };
      const novos = [...e.novos, ev.dado];
      return { ...e, novos, aviso: null, fase: novos.length >= vagas(e.atuais) ? 'concluida' : 'capturando' };
    }
    case 'cancelar':
      return e.fase === 'capturando' ? { ...e, fase: 'ociosa', novos: [], aviso: null } : e;
    case 'remover': {
      const atuais: Par = [...dadosFinais(e)];
      atuais[ev.i] = null;
      return { fase: 'ociosa', atuais, novos: [], aviso: null };
    }
  }
}

/** Texto do banner por etapa; vazio fora da captura. */
export function mensagem(e: Estado): string {
  if (e.fase !== 'capturando') return '';
  const livres = ([0, 1] as const).filter((i) => !e.atuais[i]);
  const proxima = livres[e.novos.length];
  const base = `Clique no ${ORDINAL[proxima]} dado na tela.`;
  return e.aviso ? `${e.aviso} ${base}` : base;
}
