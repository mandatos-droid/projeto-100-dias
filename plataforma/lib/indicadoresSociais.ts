/* Cartões de agenda da pergunta 3.2 (Missão 1): notas de ODS e indicadores da UF da liderança, filtrados por faixa.
   Regra pura; os arquivos de public/data/social são carregados pela ilha (lib/agendas.ts). */
import { faixaDe } from './agendas.ts';
import type { Agenda, Catalogo, DadosIndicador, IndInfo } from './agendas.ts';

export type LinhaInd = { indicador: string; ods: number; odsRot: string; nota: number };

/** Linhas da mini tabela de uma agenda, com a nota da UF (`dados.uf[uf]`): primeiro a nota de cada ODS da agenda
 *  (arquivo `ods-<n>`), depois os indicadores desses ODS e os indicadores avulsos (`extras`).
 *  `dados` é indexado pelo id do arquivo; quem não tem arquivo ou nota para a UF é omitido (SOC-03, SOC-04). */
export function linhasDaAgenda(agenda: Agenda, cat: Catalogo, dados: Record<string, DadosIndicador | null>, uf: string): LinhaInd[] {
  const odsRot = (n: number) => cat.ods.find((o) => o.n === n)?.rot ?? '';
  const nota = (id: string) => dados[id]?.uf?.[uf];
  const out: LinhaInd[] = [];
  for (const n of agenda.ods) {
    const v = nota(`ods-${n}`);
    if (typeof v === 'number') out.push({ indicador: `Nota geral do ODS ${n}`, ods: n, odsRot: odsRot(n), nota: v });
  }
  const doOds = cat.indicadores.filter((i) => agenda.ods.includes(i.ods));
  const extras = (agenda.extras ?? []).map((id) => cat.indicadores.find((i) => i.id === id)).filter((i): i is IndInfo => !!i);
  const vistos = new Set<string>();
  for (const i of [...doOds, ...extras]) {
    if (vistos.has(i.id)) continue;
    vistos.add(i.id);
    const v = nota(i.id);
    if (typeof v === 'number') out.push({ indicador: i.nome, ods: i.ods, odsRot: odsRot(i.ods), nota: v });
  }
  return out;
}

/** Só as linhas cuja nota cai na faixa (rótulo de `FAIXAS`); 'todas' devolve tudo (SOC-05). */
export const filtraFaixa = (linhas: LinhaInd[], faixa: string): LinhaInd[] =>
  faixa === 'todas' ? linhas : linhas.filter((l) => faixaDe(l.nota).rot === faixa);

/** Divide em grupos de `tam`; o último pode ser menor (SOC-06). */
export function emSlides<T>(itens: T[], tam = 4): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < itens.length; i += tam) out.push(itens.slice(i, i + tam));
  return out;
}
