export type Papel = 'coordenacao' | 'assessoria' | 'leitura';

// Do maior para o menor: a posição define a hierarquia (igual à de private.nivel_papel no banco).
export const PAPEIS: readonly Papel[] = ['coordenacao', 'assessoria', 'leitura'];

const ROTULOS: Record<Papel, string> = {
  coordenacao: 'Coordenação',
  assessoria: 'Assessoria',
  leitura: 'Somente leitura',
};

const ehPapel = (p: unknown): p is Papel => PAPEIS.includes(p as Papel);

export function rotuloPapel(p: Papel): string {
  return ROTULOS[p];
}

// Quem convida só concede papel igual ou menor que o seu.
export function papeisPermitidos(meu: Papel | string | null | undefined): Papel[] {
  return ehPapel(meu) ? PAPEIS.slice(PAPEIS.indexOf(meu)) : [];
}

export function podeGerirEquipe(p: Papel | string | null | undefined): boolean {
  return p === 'coordenacao';
}

export function podeEditar(p: Papel | string | null | undefined): boolean {
  return p === 'coordenacao' || p === 'assessoria';
}
