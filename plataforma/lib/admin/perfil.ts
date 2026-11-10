import { ATUACOES, GENEROS, RACAS } from '../perfil/opcoes.ts';
import type { Opcao } from '../perfil/opcoes.ts';

// Retorno de public.admin_perfil_resumo(): só contagens. Gênero, raça e atuação vêm pelas chaves internas;
// a faixa etária vem com o rótulo da spec. Categoria sem ninguém não vem; `por_mes` traz meses vazios em zero.
export interface ResumoPerfil {
  total: number;
  por_mes: { mes: string; qtd: number }[];
  genero: Record<string, number>;
  raca: Record<string, number>;
  faixa: Record<string, number>;
  atuacao: Record<string, number>;
}

export interface CategoriaPerfil { rotulo: string; qtd: number; pct: number }
export interface MesPerfil { rotulo: string; qtd: number }
export type Distribuicao = 'genero' | 'raca' | 'faixa' | 'atuacao';

export type ViewPerfil =
  | { vazio: true; mensagem: string }
  | { vazio: false; total: number; meses: MesPerfil[]; distribuicoes: Record<Distribuicao, CategoriaPerfil[]> };

export const MENSAGEM_SEM_PERFIL = 'Ainda não há perfis cadastrados.';

// Ordem da spec (PAG-06.5): da mais nova para a mais velha.
export const FAIXAS = ['Até 24', '25 a 34', '35 a 44', '45 a 54', '55 a 64', '65 ou mais'] as const;

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export const rotuloMes = (m: string) => `${MESES[Number(m.slice(5, 7)) - 1]}/${m.slice(2, 4)}`; // '2026-11' -> 'Nov/26'

// Categorias na ordem de `ordem`, só as que vieram com quantidade; chave fora da lista entra no fim, com a própria chave
// como rótulo, para a soma continuar igual ao total (PAG-06.12). Porcentagem inteira arredondada sobre o total.
function categorias(contagem: Record<string, number>, ordem: readonly Opcao[], total: number): CategoriaPerfil[] {
  const conhecidas = new Set(ordem.map((o) => o.chave));
  const lista = [
    ...ordem.filter((o) => (contagem[o.chave] ?? 0) > 0).map((o) => ({ rotulo: o.rotulo, qtd: contagem[o.chave] })),
    ...Object.keys(contagem).filter((k) => !conhecidas.has(k) && contagem[k] > 0).map((k) => ({ rotulo: k, qtd: contagem[k] })),
  ];
  return lista.map((c) => ({ ...c, pct: Math.round((c.qtd * 100) / total) }));
}

export function viewPerfil(r: ResumoPerfil): ViewPerfil {
  if (r.total === 0) return { vazio: true, mensagem: MENSAGEM_SEM_PERFIL };
  return {
    vazio: false,
    total: r.total,
    meses: r.por_mes.map((m) => ({ rotulo: rotuloMes(m.mes), qtd: m.qtd })),
    distribuicoes: {
      genero: categorias(r.genero, GENEROS, r.total),
      raca: categorias(r.raca, RACAS, r.total),
      faixa: categorias(r.faixa, FAIXAS.map((f) => ({ chave: f, rotulo: f })), r.total),
      atuacao: categorias(r.atuacao, ATUACOES, r.total),
    },
  };
}
