import type { PleitoTSE } from './dados.ts';
import type { Eleito } from './types.ts';

const MAX_SUGESTOES = 8;

/** Minúsculas, sem acentos e sem espaços nas pontas, para comparar nomes. */
export function normaliza(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Eleitos cujo nome de urna ou civil contém o termo; até 8, do mais votado ao menos votado. */
export function busca(eleitos: Eleito[], termo: string): Eleito[] {
  const t = normaliza(termo);
  if (t.length < 2) return [];
  return eleitos
    .filter((e) => normaliza(e.u).includes(t) || normaliza(e.c).includes(t))
    .sort((a, b) => b.v - a.v)
    .slice(0, MAX_SUGESTOES);
}

const TRAJETORIA: Partial<Record<Eleito['m'], string>> = { r: 'reeleito', o: 'veio de outro cargo', n: 'primeiro mandato' };

function cargoDe(e: Eleito) {
  const f = e.g === 'F';
  if (e.k === 's') return f ? 'Senadora' : 'Senador';
  const dep = f ? 'Deputada' : 'Deputado';
  if (e.k === 'f') return `${dep} Federal`;
  return `${dep} ${e.uf === 'DF' ? 'Distrital' : 'Estadual'}`;
}

export type Resumo = {
  cargo: string;
  posicao: { n: number; de: number } | null;
  cadeirasPartido: number;
  trajetoria: string | null;
};

/** Cargo, posição por votos e cadeiras do partido na mesma Casa e UF. Senador de 2022 não tem votos nesta base, então fica sem posição. */
export function resumo(e: Eleito, todos: Eleito[]): Resumo {
  const casa = todos.filter((o) => o.k === e.k && o.uf === e.uf);
  let posicao: Resumo['posicao'] = null;
  if (e.a === 2026) {
    const grupo = casa.filter((o) => o.a === 2026).sort((a, b) => b.v - a.v);
    const n = grupo.findIndex((o) => o.s === e.s) + 1;
    if (n > 0) posicao = { n, de: grupo.length };
  }
  return {
    cargo: cargoDe(e),
    posicao,
    cadeirasPartido: casa.filter((o) => o.p === e.p).length,
    trajetoria: TRAJETORIA[e.m] ?? null,
  };
}

const MAX_PLEITOS = 6;

export type LinhaPleito = { ano: number; cargo: string; municipio: string; partido: string; votos: number; situacao: string };

/** Até 6 pleitos anteriores, do mais recente ao mais antigo. Só campos públicos de resultado. */
export function historico(pleitos: PleitoTSE[] | undefined): LinhaPleito[] {
  return [...(pleitos ?? [])]
    .sort((a, b) => b[0] - a[0])
    .slice(0, MAX_PLEITOS)
    .map((p) => ({ ano: p[0], cargo: p[1], municipio: p[3], partido: p[4], votos: p[6], situacao: p[8] }));
}
