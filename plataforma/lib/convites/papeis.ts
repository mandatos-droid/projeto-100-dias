export type Papel = 'parlamentar' | 'chefe_gabinete' | 'coordenacao' | 'assessoria' | 'leitura';

// Do maior para o menor: a posição define a hierarquia (igual à de private.nivel_papel no banco).
export const PAPEIS: readonly Papel[] = ['parlamentar', 'chefe_gabinete', 'coordenacao', 'assessoria', 'leitura'];

const ROTULOS: Record<Papel, string> = {
  parlamentar: 'Parlamentar',
  chefe_gabinete: 'Chefe de Gabinete',
  coordenacao: 'Coordenação',
  assessoria: 'Assessoria',
  leitura: 'Somente leitura',
};

const ehPapel = (p: unknown): p is Papel => PAPEIS.includes(p as Papel);

// Nível 5 (parlamentar) a 1 (leitura); 0 para papel ausente ou desconhecido.
const nivel = (p: unknown): number => (ehPapel(p) ? PAPEIS.length - PAPEIS.indexOf(p) : 0);

export function rotuloPapel(p: Papel): string {
  return ROTULOS[p];
}

// Quem convida só concede papel igual ou menor que o seu.
export function papeisPermitidos(meu: Papel | string | null | undefined): Papel[] {
  return ehPapel(meu) ? PAPEIS.slice(PAPEIS.indexOf(meu)) : [];
}

// Parlamentar, chefe de gabinete e coordenação gerem a equipe.
export function podeGerirEquipe(p: Papel | string | null | undefined): boolean {
  return nivel(p) >= 3;
}

// Todos, menos leitura.
export function podeEditar(p: Papel | string | null | undefined): boolean {
  return nivel(p) >= 2;
}

// Só parlamentar e chefe de gabinete veem e editam o feedback da Missão 5.
export function podeVerFeedback(p: Papel | string | null | undefined): boolean {
  return p === 'parlamentar' || p === 'chefe_gabinete';
}
