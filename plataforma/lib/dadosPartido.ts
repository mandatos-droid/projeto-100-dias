/* Reação do mandato a 2 dados do partido (pergunta 2.2 da Missão 1): lista dos dados que a pessoa pode escolher,
   a frase que se completa e a gravação em D.conj2.reacoes (no máximo 2 linhas). Regra pura (AD-004). */
import { nf, pct } from './format.ts';
import type { Reacao } from './types.ts';

export type DadoPartido = { id: string; nome: string; valor: string };

/** Contagem do partido no estado e no Brasil, como o Placar mostra. */
export type ParPlacar = { uf: number; br: number };
export type PlacarPartido = {
  parlamentares: ParPlacar; vereadores: ParPlacar; prefeituras: ParPlacar; filiados: ParPlacar;
  executivos: string; // posição do partido nos Executivos, já em texto (ex.: "Base aliada")
};
/** Números de um dos 5 municípios mais votados: vereadores do partido, filiados e % de votos do partido. */
export type MunPartido = { cdi: string; nome: string; vereadoresPartido: number; filiados: number; pct: number };

const par = (p: ParPlacar) => `${nf.format(p.uf)} no estado, ${nf.format(p.br)} no Brasil`;

/** Os dados do seletor, com o valor já formatado (PAR-10): o Placar e, por município, vereadores do partido, filiados e % de votos. */
export function dadosSelecionaveis(placar: PlacarPartido, municipios: MunPartido[]): DadoPartido[] {
  return [
    { id: 'parlamentares', nome: 'Parlamentares do partido', valor: par(placar.parlamentares) },
    { id: 'vereadores', nome: 'Vereadores do partido', valor: par(placar.vereadores) },
    { id: 'prefeituras', nome: 'Prefeituras do partido', valor: par(placar.prefeituras) },
    { id: 'filiados', nome: 'Filiados do partido', valor: par(placar.filiados) },
    { id: 'executivos', nome: 'Posição do partido nos Executivos', valor: placar.executivos },
    ...municipios.flatMap((m): DadoPartido[] => [
      { id: `mun:${m.cdi}:vereadores`, nome: `Vereadores do partido em ${m.nome}`, valor: nf.format(m.vereadoresPartido) },
      { id: `mun:${m.cdi}:filiados`, nome: `Filiados do partido em ${m.nome}`, valor: nf.format(m.filiados) },
      { id: `mun:${m.cdi}:pct`, nome: `% de votos do partido em ${m.nome}`, valor: pct(m.pct) },
    ]),
  ];
}

/** Início da frase que a pessoa completa (PAR-11). */
export const frase = (d: DadoPartido): string => `Considerando ${d.nome}: ${d.valor}, o mandato deve`;

const vaga = (r: Reacao) => !r.dado && !r.texto;

/** Grava a linha `i` (0 ou 1) e devolve a lista nova, com no máximo 2 linhas; índice acima de 1 é ignorado (PAR-12).
 *  `dado` null limpa a linha; linhas vazias no fim saem da lista. Só o id e o valor do dado ficam gravados. */
export function defineReacao(reacoes: Reacao[], i: number, dado: DadoPartido | null, texto: string): Reacao[] {
  const atual = [...reacoes].slice(0, 2);
  if (i !== 0 && i !== 1) return atual;
  while (atual.length < i) atual.push({ dado: '', valor: '', texto: '' });
  atual[i] = dado ? { dado: dado.id, valor: dado.valor, texto } : { dado: '', valor: '', texto: '' };
  while (atual.length && vaga(atual[atual.length - 1])) atual.pop();
  return atual;
}
