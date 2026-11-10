/* Organograma da equipe no Resumo do preenchimento (RES-09): lógica pura sobre a tabela de equipe da Missão 2.
   Recebe a vista da tabela (vistaDaTabela(D.campos)), para o mandato do formato antigo ter os mesmos ramos que a tabela. */
import { SEM_AREA, type Campos } from './cadeiras.ts';
import { COORDENACOES, COR_COORD } from './equipe.ts';
import { CATEGORIAS, linhas, migrada, type Linha } from './tabelaEquipe.ts';

export type EstadoCartao = 'ok' | 'vaga' | 'aberto';
export type Cartao = { i: number; cargo: string; pessoa: string; estado: EstadoCartao };
export type Ramo = { area: string; cor: string | undefined; cartoes: Cartao[] };
export type Arvore = { chefia: Cartao | null; ramos: Ramo[] };

const CHEFIA_AREA = 'Chefia de área';

/** "*" na pessoa = processo seletivo a abrir; sem pessoa = cargo ainda sem nome. */
const estado = (l: Linha): EstadoCartao => (l.processoSeletivo ? 'vaga' : l.pessoa === '' ? 'aberto' : 'ok');
const cartao = (l: Linha): Cartao => ({ i: l.i, cargo: l.cargo, pessoa: l.pessoa, estado: estado(l) });
/* ordem dentro do ramo: Chefia, Coordenação, Especialista, Executora (sem categoria por último) e, no empate, a ordem das linhas */
const posCat = (l: Linha) => { const p = (CATEGORIAS as readonly string[]).indexOf(l.cat); return p < 0 ? CATEGORIAS.length : p; };
const posArea = (a: string) => { const p = (COORDENACOES as readonly string[]).indexOf(a); return p < 0 ? COORDENACOES.length : p; };

/** Chefia de gabinete no topo e um ramo por área presente, na ordem de COORDENACOES (áreas fora da lista vêm depois).
 *  Sem linhas ativas (a tabela não começou: sem m2.n e fora do formato antigo, como a Missão 2 conta), árvore vazia. */
export function arvore(c: Campos): Arvore {
  if (c['m2.n'] === undefined && !migrada(c)) return { chefia: null, ramos: [] };
  const ls = linhas(c).map((l, ordem) => ({ l, ordem })).sort((a, b) => posCat(a.l) - posCat(b.l) || a.ordem - b.ordem).map((x) => x.l);
  const topo = ls.find((l) => l.area === CHEFIA_AREA);
  const porArea = new Map<string, Cartao[]>();
  ls.forEach((l) => {
    if (l === topo) return;
    const area = l.area || SEM_AREA;
    if (!porArea.has(area)) porArea.set(area, []);
    porArea.get(area)!.push(cartao(l));
  });
  const areas = [...porArea.keys()].sort((a, b) => posArea(a) - posArea(b));
  return { chefia: topo ? cartao(topo) : null, ramos: areas.map((area) => ({ area, cor: COR_COORD[area], cartoes: porArea.get(area)! })) };
}
