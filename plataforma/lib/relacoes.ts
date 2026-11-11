/* As 5 categorias de relação com os parlamentares (pergunta 2.1 da Missão 1), na ordem da Alana.
   As chaves gravadas em D.relacoes[sq].status não mudam: `concorrente` é "Oponente" e `potencial` é "Indefinida";
   só `aliado_concorrente` e `oponente_concorrente` são chaves novas (LEG-11). */
import type { Relacao, Status } from './types.ts';

export type Categoria = { k: Exclude<Status, 'neutro'>; rot: string; plural: string; def: string };

export const CATEGORIAS: Categoria[] = [
  { k: 'aliado', rot: 'Aliado', plural: 'Aliados',
    def: 'para aqueles com quem já tem uma boa relação e o mandato sabe que pode contar durante votações, por exemplo.' },
  { k: 'aliado_concorrente', rot: 'Aliado, mas concorrente', plural: 'Aliados, mas concorrentes',
    def: 'para aqueles com quem já tem uma boa relação, mas cujas agendas defendidas ou o território da base de apoio lhes impõem uma competição direta.' },
  { k: 'concorrente', rot: 'Oponente', plural: 'Oponentes',
    def: 'para as lideranças com quem a liderança parlamentar já teve algum embate ou cujos posicionamentos são contrários ao que defende.' },
  { k: 'oponente_concorrente', rot: 'Oponente e concorrente', plural: 'Oponentes e concorrentes',
    def: 'para colegas com quem a relação é ou tende a ser desafiadora, e ainda existe uma disputa direta de agendas ou território.' },
  { k: 'potencial', rot: 'Indefinida', plural: 'Indefinidas',
    def: 'para perfis com quem haja potencial de construção de espaços de convergência e que pode ser aliado ou oponente, a depender da pauta debatida, e cuja relação ainda precisa ser desenvolvida.' },
];

/** Texto do balão de ajuda: as 5 definições da Alana (as mesmas listadas em public/legacy/m1.js, conferidas em tests/relacoes.test.ts). */
export const ajudaTexto = (): string => CATEGORIAS.map((c) => `${c.rot}: ${c.def}`).join(' ');

/** Rótulo de uma categoria; vazio para `neutro` (sem classificação). */
export const rotulo = (k: Status): string => CATEGORIAS.find((c) => c.k === k)?.rot ?? '';

/** Quantas pessoas há em cada categoria; `neutro` e chaves desconhecidas não contam. */
export function contagem(relacoes: Record<string, Relacao>): Partial<Record<Status, number>> {
  const out: Partial<Record<Status, number>> = {};
  for (const r of Object.values(relacoes ?? {})) {
    if (CATEGORIAS.some((c) => c.k === r.status)) out[r.status] = (out[r.status] ?? 0) + 1;
  }
  return out;
}

/** "Você tem 20 Aliados; 5 Aliados, mas concorrentes": só categorias com ao menos 1 (LEG-12); vazio sem classificação. */
export function resumoTexto(relacoes: Record<string, Relacao>): string {
  const n = contagem(relacoes);
  const partes = CATEGORIAS.filter((c) => (n[c.k] ?? 0) >= 1).map((c) => `${n[c.k]} ${n[c.k] === 1 ? c.rot : c.plural}`);
  return partes.length ? `Você tem ${partes.join('; ')}` : '';
}
