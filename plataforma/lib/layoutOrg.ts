/* Missão 2 · layout do organograma (puro): posições por dagre, arestas de hierarquia e arestas entre áreas.
   Usado pelo mini-organograma, pelo canvas e pela exportação, para os três mostrarem o mesmo desenho. */
import dagre from '@dagrejs/dagre';
import { AREAS, SEM_AREA, ativas, coordDe, liderDe, nomeDe, nomeLimpo, type Campos } from './cadeiras.ts';
import { rotinasEntreAreas } from './rotinas.ts';

export const LARG = 230;
export const ALT = 96;

export type No = { i: number; x: number; y: number; w: number; h: number; coord: string; nome: string; vaga: boolean; aberto: boolean };
export type Aresta = { id: string; de: number; para: number; tipo: 'hierarquia' | 'entre'; coord: string; rotulo?: string };
export type Layout = { nos: No[]; arestas: Aresta[]; areas: string[] };

export function layoutOrg(c: Campos, o: { soPreenchidas?: boolean } = {}): Layout {
  const visiveis = ativas(c).filter((i) => !o.soPreenchidas || nomeLimpo(c, i) !== '');
  const vis = new Set(visiveis);
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 24, ranksep: 70 });
  g.setDefaultEdgeLabel(() => ({}));
  visiveis.forEach((i) => g.setNode(String(i), { width: LARG, height: ALT }));

  const arestas: Aresta[] = [];
  visiveis.forEach((i) => {
    let p = liderDe(c, i);
    for (let passo = 0; p !== null && !vis.has(p) && passo < 60; passo++) p = liderDe(c, p); // sobe até o líder visível mais próximo
    if (p === null || p === i || !vis.has(p)) return;
    g.setEdge(String(p), String(i));
    arestas.push({ id: `${p}-${i}`, de: p, para: i, tipo: 'hierarquia', coord: coordDe(c, i) });
  });
  dagre.layout(g);

  rotinasEntreAreas(c).forEach((r) => {
    const [a, b] = r.participantes;
    if (a === undefined || b === undefined || !vis.has(a) || !vis.has(b)) return;
    arestas.push({ id: r.id, de: a, para: b, tipo: 'entre', coord: r.de ?? '', rotulo: `${r.freq}: ${r.finalidade ?? ''}`.trim() });
  });

  const nos: No[] = visiveis.map((i) => {
    const p = g.node(String(i));
    const nome = nomeLimpo(c, i);
    return { i, x: p.x - LARG / 2, y: p.y - ALT / 2, w: LARG, h: ALT, coord: coordDe(c, i), nome, vaga: nome === '', aberto: nome === '' && nomeDe(c, i).includes('*') };
  });
  const presentes = new Set(nos.map((n) => n.coord));
  return { nos, arestas, areas: [...AREAS, SEM_AREA].filter((a) => presentes.has(a)) };
}
