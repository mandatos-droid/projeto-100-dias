/* Missão 2 · o que a plataforma sugere marcar no checklist (m2.c1..c3). Só sugere: quem marca é o usuário.
   c1 = toda linha da tabela tem escopo; c2 = organograma gerado com Chefia definida; c3 = rotinas ligadas, todas agendadas. */
import { type Campos } from './cadeiras.ts';
import { concluida } from './quadroRotinas.ts';
import { linhas } from './tabelaEquipe.ts';

export type Sugestao = { c1: boolean; c2: boolean; c3: boolean };

export function sugestaoChecklist(c: Campos): Sugestao {
  const ls = linhas(c);
  const c1 = ls.every((l) => l.esc !== '');
  const gerado = ls.some((l) => l.cargo !== '' && l.cat !== '' && l.area !== '');
  const c2 = gerado && ls.some((l) => l.cat === 'Chefia');
  return { c1, c2, c3: concluida(c) };
}
