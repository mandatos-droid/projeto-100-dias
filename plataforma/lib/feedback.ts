/* Missão 5 · feedback estruturado a partir do organograma da Missão 2. Funções puras: ler o mapa não altera nada
   e cada escrita devolve uma lista nova de D.feedbacks; quem grava em D é a ilha.
   Pessoas e liderança direta vêm de lib/cadeiras.ts (cadeira ativa com nome; líder = liderDe). */
import { ativas, liderDe, nomeLimpo, type Campos } from './cadeiras.ts';

/** Conversa de feedback. `cadeira` liga a conversa à cadeira da Missão 2; `pessoa` e `lider` guardam o nome da época. */
/** Conversa de feedback. `d1`/`d2` (destaques) e `a1`/`a2` (ajustes) são os campos separados pedidos pela Alana; `destaques` e `ajustes`
 *  continuam existindo, montados a partir deles, porque o Resumo do Guia e as conversas antigas leem esses dois. */
export interface Conversa { id: string; cadeira?: number; lider: string; pessoa: string; data: string; destaques: string; ajustes: string; acao: string; d1?: string; d2?: string; a1?: string; a2?: string }
export interface Pessoa { i: number; nome: string }
export interface Lideranca { i: number; nome: string; liderados: Pessoa[]; n: number }
export interface LiderancaContada { i: number; nome: string; liderados: (Pessoa & { feita: boolean })[]; n: number; feitas: number }

const ehObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const txt = (v: unknown) => (typeof v === 'string' ? v : '');
const uid = () => Math.random().toString(36).slice(2, 10);
const norm = (s: string) => s.replace(/\*/g, '').trim().toLowerCase();

/** Liderança → liderados, em ordem de cadeira. Só entram cadeiras ativas com nome como liderados; quem não lidera ninguém fica de fora. */
export function mapaFeedback(c: Campos): Lideranca[] {
  const com = ativas(c).filter((i) => nomeLimpo(c, i) !== '');
  return ativas(c).map((i) => {
    const liderados = com.filter((j) => liderDe(c, j) === i).map((j) => ({ i: j, nome: nomeLimpo(c, j) }));
    return { i, nome: nomeLimpo(c, i), liderados, n: liderados.length };
  }).filter((l) => l.n > 0);
}

/** O mapa com "feitas X de N": a pessoa é "feita" se tem ao menos uma conversa ligada à cadeira dela. */
export function contagens(c: Campos, conversas: Conversa[]): LiderancaContada[] {
  const feitas = new Set(conversas.map((v) => v.cadeira));
  return mapaFeedback(c).map((l) => {
    const liderados = l.liderados.map((p) => ({ ...p, feita: feitas.has(p.i) }));
    return { ...l, liderados, feitas: liderados.filter((p) => p.feita).length };
  });
}

/** Conversas que não pertencem a nenhum liderado atual (a pessoa saiu da Missão 2, ou o nome antigo não casa com ninguém). */
export function removidas(c: Campos, conversas: Conversa[]): Conversa[] {
  const atuais = new Set(mapaFeedback(c).flatMap((l) => l.liderados.map((p) => p.i)));
  return conversas.filter((v) => v.cadeira === undefined || !atuais.has(v.cadeira));
}

/** Junta os pontos escritos, um por linha, sem linha em branco. */
const junta = (...pontos: (string | undefined)[]) => pontos.filter((p) => p && p.trim() !== '').join('\n');

/** Monta `destaques` e `ajustes` a partir dos campos separados, quando a conversa os usa. Conversa antiga (sem d1/d2/a1/a2) passa igual. */
function comTextoMontado(v: Conversa): Conversa {
  const usaD = v.d1 !== undefined || v.d2 !== undefined;
  const usaA = v.a1 !== undefined || v.a2 !== undefined;
  return { ...v, ...(usaD ? { destaques: junta(v.d1, v.d2) } : {}), ...(usaA ? { ajustes: junta(v.a1, v.a2) } : {}) };
}

/** Os quatro pontos como o formulário os mostra: conversa nova pelos campos separados; conversa antiga (só destaques/ajustes) cai em d1 e a1. */
export const pontosDe = (v: Conversa): { d1: string; d2: string; a1: string; a2: string } => {
  const novaD = v.d1 !== undefined || v.d2 !== undefined;
  const novaA = v.a1 !== undefined || v.a2 !== undefined;
  return { d1: novaD ? v.d1 ?? '' : v.destaques, d2: v.d2 ?? '', a1: novaA ? v.a1 ?? '' : v.ajustes, a2: v.a2 ?? '' };
};

/** Lista com a conversa nova no fim (id gerado se faltar). */
export const registra = (lista: Conversa[], nova: Omit<Conversa, 'id'> & { id?: string }): Conversa[] => [...lista, comTextoMontado({ ...nova, id: nova.id || uid() })];

/** Troca só os campos do patch na conversa `id`; as demais ficam iguais. */
export const edita = (lista: Conversa[], id: string, patch: Partial<Omit<Conversa, 'id'>>): Conversa[] => lista.map((v) => (v.id === id ? comTextoMontado({ ...v, ...patch }) : v));

/** Lista sem a conversa `id`. */
export const apaga = (lista: Conversa[], id: string): Conversa[] => lista.filter((v) => v.id !== id);

/** Lê D.feedbacks no formato novo ou no antigo (pessoa, lider, data, pontos, encam) sem perder texto: pontos vira destaques e
 *  encam vira plano de ação. A cadeira é achada pelo nome da pessoa. Não altera a lista recebida. */
export function migraAntigo(bruto: unknown, c: Campos): Conversa[] {
  const porNome = new Map<string, number>();
  ativas(c).forEach((i) => { const n = norm(nomeLimpo(c, i)); if (n && !porNome.has(n)) porNome.set(n, i); });
  return (Array.isArray(bruto) ? bruto : []).filter(ehObj).map((v) => {
    const novo = 'destaques' in v || 'ajustes' in v || 'acao' in v;
    const pessoa = txt(v.pessoa);
    return {
      id: txt(v.id) || uid(),
      ...(typeof v.cadeira === 'number' ? { cadeira: v.cadeira } : porNome.has(norm(pessoa)) ? { cadeira: porNome.get(norm(pessoa)) } : {}),
      lider: txt(v.lider), pessoa, data: txt(v.data),
      destaques: txt(novo ? v.destaques : v.pontos), ajustes: txt(v.ajustes), acao: txt(novo ? v.acao : v.encam),
      ...(['d1', 'd2', 'a1', 'a2'] as const).reduce<Partial<Conversa>>((acc, k) => (typeof v[k] === 'string' ? { ...acc, [k]: v[k] as string } : acc), {}),
    };
  });
}

/** A conversa como o Guia antigo a lê (Resumo e telas legadas mostram `pontos` e `encam`): os campos novos ficam, e os antigos são espelhados. */
export const paraGuia = (v: Conversa): Conversa & { pontos: string; encam: string } => ({
  ...v, pontos: [v.destaques, v.ajustes && `Pontos de ajuste: ${v.ajustes}`].filter(Boolean).join('\n'), encam: v.acao,
});
