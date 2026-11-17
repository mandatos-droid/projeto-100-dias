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

// Papéis que o convidador pode dar: os de nível igual ou menor que o dele e, se ele edita (assessoria para cima),
// também Parlamentar e Chefe de Gabinete enquanto ninguém do mandato tem esse papel (ocupados = papéis de hoje).
export function papeisConvidaveis(meu: Papel | string | null | undefined, ocupados: readonly string[]): Papel[] {
  const base = papeisPermitidos(meu);
  if (nivel(meu) < 2) return base;
  const vagos = (['parlamentar', 'chefe_gabinete'] as const).filter((p) => !base.includes(p) && !ocupados.includes(p));
  return [...vagos, ...base];
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
