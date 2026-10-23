/* Destaque transitório de cadeiras compartilhado entre as ilhas da Missão 2 (cada ilha é uma raiz React separada).
   Não é salvo: some ao trocar de tela. O que precisa durar fica em D.campos. */
export type Foco = { cadeiras: number[]; id?: string };
type Ouvinte = (f: Foco) => void;

let atual: Foco = { cadeiras: [] };
const ouvintes = new Set<Ouvinte>();

export const focoAtual = (): Foco => atual;

export function definirFoco(f: Foco) {
  atual = f;
  ouvintes.forEach((o) => o(atual));
}

export const limparFoco = () => definirFoco({ cadeiras: [] });

/** Recebe o foco atual na hora e cada mudança depois; devolve a função que cancela. */
export function assinar(o: Ouvinte): () => void {
  ouvintes.add(o);
  o(atual);
  return () => { ouvintes.delete(o); };
}
