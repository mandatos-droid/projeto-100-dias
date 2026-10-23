/* Missão 3 · notas por critério, ranking e bandeiras prioritárias. Funções puras: devolvem um Rumo novo
   (nunca alteram o recebido) e, quando recusam, devolvem o mesmo Rumo com a mensagem em `erro`. */
import { CRITERIOS_GUIA } from './rumo.ts';
import type { BandeiraRumo, Criterio, Rumo } from './rumo.ts';

export { CRITERIOS_GUIA };
export const MAX_CRITERIOS = 8;
export const MAX_PRIORITARIAS = 3;

export type Resultado = { rumo: Rumo; erro?: string };

export const notaValida = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 5;

/** Soma das notas dos critérios existentes; nota inválida não conta. */
export const total = (b: Pick<BandeiraRumo, 'notas'>, criterios: Criterio[]): number =>
  criterios.reduce((s, c) => s + (notaValida(b.notas[c.id]) ? b.notas[c.id] : 0), 0);

const troca = (r: Rumo, id: string, f: (b: BandeiraRumo) => BandeiraRumo): Rumo =>
  ({ ...r, bandeiras: r.bandeiras.map((b) => (b.id === id ? f(b) : b)) });

/** Grava a nota de uma bandeira em um critério; recusa nota fora de 0 a 5 ou não inteira. */
export function defineNota(r: Rumo, bandeira: string, criterio: string, nota: number): Resultado {
  if (!notaValida(nota)) return { rumo: r, erro: 'A nota é um número inteiro de 0 a 5.' };
  if (!r.bandeiras.some((b) => b.id === bandeira) || !r.criterios.some((c) => c.id === criterio)) return { rumo: r, erro: 'Bandeira ou critério não encontrado.' };
  return { rumo: troca(r, bandeira, (b) => ({ ...b, notas: { ...b.notas, [criterio]: nota } })) };
}

/** Ordem por total desc, empate pela ordem de entrada. `sugerida` marca as 3 primeiras com nota, só se 2 ou mais têm nota. */
export function ranking(bandeiras: BandeiraRumo[], criterios: Criterio[]): { id: string; total: number; sugerida: boolean }[] {
  const linhas = bandeiras.map((b, i) => ({ id: b.id, total: total(b, criterios), i, comNota: Object.keys(b.notas).length > 0 }));
  const ordem = [...linhas].sort((a, b) => b.total - a.total || a.i - b.i);
  const liberado = linhas.filter((l) => l.comNota).length >= 2;
  let marcadas = 0;
  return ordem.map((l) => {
    const sugerida = liberado && l.comNota && marcadas < MAX_PRIORITARIAS;
    if (sugerida) marcadas++;
    return { id: l.id, total: l.total, sugerida };
  });
}

/** Marca ou desmarca a bandeira como prioritária. A quarta é recusada; ao desmarcar, as outras sobem mantendo a ordem. */
export function alternaPrioritaria(r: Rumo, id: string): Resultado {
  const b = r.bandeiras.find((x) => x.id === id);
  if (!b) return { rumo: r, erro: 'Bandeira não encontrada.' };
  const prior = r.bandeiras.filter((x) => x.prioridade !== null).sort((x, y) => x.prioridade! - y.prioridade!);
  if (b.prioridade !== null) {
    const resto = prior.filter((x) => x.id !== id).map((x) => x.id);
    return { rumo: { ...r, bandeiras: r.bandeiras.map((x) => ({ ...x, prioridade: resto.includes(x.id) ? resto.indexOf(x.id) + 1 : null })) } };
  }
  if (prior.length >= MAX_PRIORITARIAS) {
    const nomes = prior.map((x) => x.rot).join(', ');
    return { rumo: r, erro: `Já são ${MAX_PRIORITARIAS} bandeiras prioritárias (${nomes}). Desmarque uma delas para escolher ${b.rot}.` };
  }
  return { rumo: troca(r, id, (x) => ({ ...x, prioridade: prior.length + 1 })) };
}

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'criterio';

/** Acrescenta um critério próprio (até 8 no total). */
export function adicionaCriterio(r: Rumo, rot: string): Resultado {
  const nome = rot.trim();
  if (!nome) return { rumo: r, erro: 'Escreva o nome do critério.' };
  if (r.criterios.length >= MAX_CRITERIOS) return { rumo: r, erro: `O limite é de ${MAX_CRITERIOS} critérios. Remova um para acrescentar outro.` };
  const base = `c-${slug(nome)}`;
  let id = base;
  for (let n = 2; r.criterios.some((c) => c.id === id); n++) id = `${base}-${n}`;
  return { rumo: { ...r, criterios: [...r.criterios, { id, rot: nome, guia: false }] } };
}

/** Remove o critério (do Guia ou próprio) e as notas dele em todas as bandeiras. */
export function removeCriterio(r: Rumo, id: string): Resultado {
  if (!r.criterios.some((c) => c.id === id)) return { rumo: r, erro: 'Critério não encontrado.' };
  return { rumo: {
    ...r, criterios: r.criterios.filter((c) => c.id !== id),
    bandeiras: r.bandeiras.map((b) => { const { [id]: _fora, ...notas } = b.notas; return { ...b, notas }; }),
  } };
}
