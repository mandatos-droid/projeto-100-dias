'use client';

import { createContext, useContext } from 'react';
import type { Api } from '../../lib/admin/api.ts';
import type { Config } from '../../lib/admin/config.ts';
import type { Papel } from '../../lib/convites/papeis.ts';

/* Um mandato da pessoa: a linha de `mandatos` com o papel dela em `membros` (mesmo formato de Store.meusMandatos no Guia). */
export interface MandatoDaPessoa {
  id: string;
  papel: Papel;
  nome_parlamentar: string | null;
  cargo: string | null;
  uf: string | null;
  partido: string | null;
  data_posse: string | null;
  dados: Record<string, unknown> | null;
}

export interface Usuario { id: string; email: string | null }

/* O que a casca entrega às telas filhas. `api` já renova a sessão sozinha. */
export interface ContextoMandato {
  cfg: Config;
  api: Api;
  usuario: Usuario;
  mandatos: MandatoDaPessoa[];
  mandato: MandatoDaPessoa;
  /** Papel da pessoa no mandato ativo. */
  papel: Papel;
  escolhe: (id: string) => void;
}

export const Contexto = createContext<ContextoMandato | null>(null);

export function useMandato(): ContextoMandato {
  const c = useContext(Contexto);
  if (!c) throw new Error('useMandato só funciona dentro da casca de /mandato.');
  return c;
}

export function nomeDoMandato(m: Pick<MandatoDaPessoa, 'nome_parlamentar'>): string {
  return m.nome_parlamentar?.trim() || 'Mandato sem nome';
}

// Iniciais para o círculo de avatar: primeira e última palavra do nome.
export function iniciais(nome: string | null | undefined): string {
  const p = (nome ?? '').trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() || '?';
}
