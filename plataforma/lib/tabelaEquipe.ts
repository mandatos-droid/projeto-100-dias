/* Missão 2 · tabela de equipe em ordem obrigatória (função pura sobre D.campos).
   Cada linha é uma cadeira ativa (m2.on); os seis valores moram nas chaves de sempre (m2.f{n}, m2.p{n}.*),
   mais `esc`, `comp` e `cat`, novas. Ler não altera nada; operar devolve um Patch. */
import { ativas, nomeDe, type Campos } from './cadeiras.ts';

export type ColunaId = 'esc' | 'comp' | 'cargo' | 'pessoa' | 'cat' | 'area';
export const COLUNAS: { id: ColunaId; rotulo: string; dica: string }[] = [
  { id: 'esc', rotulo: 'Escopo', dica: 'O trabalho que essa pessoa vai fazer' },
  { id: 'comp', rotulo: 'Competências comportamentais', dica: 'Como essa pessoa precisa agir para fazer esse trabalho' },
  { id: 'cargo', rotulo: 'Nome do cargo', dica: 'O nome do cargo que reúne esse trabalho' },
  { id: 'pessoa', rotulo: 'Nome da pessoa', dica: 'Quem ocupa o cargo; escreva * se ainda não há pessoa (processo seletivo)' },
  { id: 'cat', rotulo: 'Categoria', dica: 'Chefia, Coordenação, Especialista ou Executora' },
  { id: 'area', rotulo: 'Área', dica: 'A área do mandato a que o cargo pertence' },
];

export const CATEGORIAS = ['Chefia', 'Coordenação', 'Especialista', 'Executora'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

/** chave de uma coluna da cadeira i (m2.f{n} para a pessoa; m2.p{n}.{campo} para as demais) */
export const chaveCelula = (i: number, col: ColunaId): string =>
  col === 'pessoa' ? `m2.f${i + 1}` : `m2.p${i + 1}.${{ esc: 'esc', comp: 'comp', cargo: 'nome_cargo', cat: 'cat', area: 'coord' }[col]}`;

export type Linha = {
  i: number;
  esc: string; comp: string; cargo: string; pessoa: string; cat: string; area: string;
  /** a pessoa foi escrita como "*": vaga a abrir por processo seletivo */
  processoSeletivo: boolean;
  completa: boolean;
};

const valor = (c: Campos, i: number, col: ColunaId): string =>
  col === 'pessoa' ? nomeDe(c, i) : (c[chaveCelula(i, col)] ?? '').trim();

export const completa = (l: Pick<Linha, ColunaId>): boolean => COLUNAS.every((x) => l[x.id].trim() !== '');

/** Uma linha por cadeira ativa, em ordem. */
export function linhas(c: Campos): Linha[] {
  return ativas(c).map((i) => {
    const v = Object.fromEntries(COLUNAS.map((x) => [x.id, valor(c, i, x.id)])) as Record<ColunaId, string>;
    return { i, ...v, processoSeletivo: v.pessoa.includes('*'), completa: completa(v) };
  });
}

/** A coluna só libera quando todas as anteriores estão preenchidas; senão devolve o rótulo da primeira que falta. */
export function colunaLiberada(l: Pick<Linha, ColunaId>, col: ColunaId): { ok: boolean; falta?: string } {
  for (const x of COLUNAS) {
    if (x.id === col) return { ok: true };
    if (l[x.id].trim() === '') return { ok: false, falta: x.rotulo };
  }
  return { ok: true };
}

/** "X de N linhas completas" */
export function contagemCompletas(c: Campos): { completas: number; total: number } {
  const ls = linhas(c);
  return { completas: ls.filter((l) => l.completa).length, total: ls.length };
}
