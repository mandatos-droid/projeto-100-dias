'use client';
/* Ligação entre as ilhas da Missão 2 e o estado do Guia: lê D.campos e aplica o patch devolvido pelas funções de lib/. */
import { aplica, type Patch } from '@/lib/cadeiras';
import { aviso, useLegado } from '../ponte';

export type Resultado = { patch?: Patch; erro?: string };

export function useEquipe() {
  const { D, bump } = useLegado();
  const c = D.campos;
  /** Aplica o patch e salva. Com `erro`, mostra o aviso e não grava nada. Devolve se gravou. */
  const agir = (r: Resultado): boolean => {
    if (r.erro) { aviso(r.erro); return false; }
    if (!r.patch) return false;
    aplica(c, r.patch);
    bump();
    return true;
  };
  return { c, agir, bump };
}
