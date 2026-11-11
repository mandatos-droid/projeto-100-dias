/* As 5 categorias de relação com os parlamentares (pergunta 2.1 da Missão 1), na ordem da Alana.
   As chaves gravadas em D.relacoes[sq].status não mudam: `concorrente` é "Oponente" e `potencial` é "Indefinida";
   só `aliado_concorrente` e `oponente_concorrente` são chaves novas (LEG-11). */
import type { Relacao, Status } from './types.ts';

export type Categoria = { k: Exclude<Status, 'neutro'>; rot: string; plural: string; def: string };

export const CATEGORIAS: Categoria[] = [
  { k: 'aliado', rot: 'Aliado', plural: 'Aliados',
    def: 'quem tende a caminhar com a liderança parlamentar, por dividir base, pauta ou partido, e não disputa o mesmo eleitorado. É com quem se pode contar para assinar, relatar e apoiar propostas.' },
  { k: 'aliado_concorrente', rot: 'Aliado, mas concorrente', plural: 'Aliados, mas concorrentes',
    def: 'quem costuma apoiar a liderança parlamentar, mas disputa a mesma base eleitoral ou o mesmo espaço político. A aliança existe, com cuidado para não perder território.' },
  { k: 'concorrente', rot: 'Oponente', plural: 'Oponentes',
    def: 'quem tende a se posicionar contra, por estar em campo político contrário ou defender pautas opostas. Não é inimigo: é quem a equipe precisa antecipar e acompanhar.' },
  { k: 'oponente_concorrente', rot: 'Oponente e concorrente', plural: 'Oponentes e concorrentes',
    def: 'quem se opõe à liderança parlamentar e ainda disputa a mesma base eleitoral. É a relação mais sensível: pede atenção redobrada ao território e às pautas em comum.' },
  { k: 'potencial', rot: 'Indefinida', plural: 'Indefinidas',
    def: 'quem ainda não é aliado nem oponente: a relação não está definida e vale cultivar. Marque para a equipe lembrar de abrir o diálogo.' },
];

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
