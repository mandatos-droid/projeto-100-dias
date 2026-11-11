/* Cargo de um(a) parlamentar eleito(a), com a concordância de gênero (sugestão 135, PAR-01).
   Gênero ausente ou desconhecido cai no masculino, que é o que o Guia sempre mostrou. */
export type CargoEntrada = { k: 'f' | 'e' | 's'; uf: string; g?: string | null };

export function cargoEleito(e: CargoEntrada): string {
  const fem = e.g === 'F';
  if (e.k === 's') return fem ? 'Senadora' : 'Senador';
  const deputado = fem ? 'Deputada' : 'Deputado';
  if (e.k === 'f') return `${deputado} Federal`;
  return e.uf === 'DF' ? `${deputado} Distrital` : `${deputado} Estadual`;
}
