import { tokenDoHash } from './link.ts';

export const CHAVE_PENDENTE = 'legisla.convite';

// Subconjunto de Storage usado aqui; sessionStorage serve. Qualquer falha do armazenamento é ignorada.
export interface Armazenamento {
  getItem(chave: string): string | null;
  setItem(chave: string, valor: string): void;
  removeItem(chave: string): void;
}

type Alvo = Armazenamento | null | undefined;

// Guarda o token antes de sair para o Google; só tokens no formato válido são guardados.
export function guardaPendente(storage: Alvo, token: string): void {
  if (!tokenDoHash(`#${token}`)) return;
  try {
    storage?.setItem(CHAVE_PENDENTE, token);
  } catch {
    /* armazenamento bloqueado ou cheio: o convite volta a depender do link */
  }
}

export function lePendente(storage: Alvo): string | null {
  try {
    const valor = storage?.getItem(CHAVE_PENDENTE);
    return valor ? tokenDoHash(`#${valor}`) : null;
  } catch {
    return null;
  }
}

export function limpaPendente(storage: Alvo): void {
  try {
    storage?.removeItem(CHAVE_PENDENTE);
  } catch {
    /* ignorado */
  }
}
