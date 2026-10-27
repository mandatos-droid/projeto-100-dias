/* Missão 5 · sucessos mensais de uma meta (D.metas[i].sucessos). Funções puras: ler normaliza sem mutar,
   e cada escrita devolve uma lista nova; quem grava em D é a ilha. Mesmos 4 status das metas (lib/rumo.ts). */
import { STATUS_IDS, type StatusMeta } from './rumo.ts';

export const MESES = [1, 2, 3, 4] as const;
export interface Sucesso { id: string; mes: number; texto: string; status: StatusMeta }

const ehObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const mesValido = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 4;
const uid = () => Math.random().toString(36).slice(2, 10);

/** Sucessos da meta, normalizados: mês fora de 1..4 vira 1, status inválido vale "não concluída". Não altera a meta. */
export function lerSucessos(meta: object | null | undefined): Sucesso[] {
  const s0 = (meta as { sucessos?: unknown } | null | undefined)?.sucessos;
  const bruto = Array.isArray(s0) ? s0 : [];
  return bruto.filter(ehObj).map((s) => ({
    id: typeof s.id === 'string' && s.id ? s.id : uid(),
    mes: mesValido(s.mes) ? s.mes : 1,
    texto: typeof s.texto === 'string' ? s.texto : '',
    status: STATUS_IDS.includes(s.status as StatusMeta) ? (s.status as StatusMeta) : 'nao_concluida',
  }));
}

/** Lista com um sucesso novo no fim (status "não concluída"); mês inválido vira 1. */
export function adicionaSucesso(lista: Sucesso[], novo: { mes: number; texto: string; id?: string }): Sucesso[] {
  return [...lista, { id: novo.id ?? uid(), mes: mesValido(novo.mes) ? novo.mes : 1, texto: novo.texto, status: 'nao_concluida' }];
}

/** Troca só os campos do patch no sucesso `id`; os demais ficam iguais. */
export function editaSucesso(lista: Sucesso[], id: string, patch: Partial<Pick<Sucesso, 'mes' | 'texto' | 'status'>>): Sucesso[] {
  return lista.map((s) => {
    if (s.id !== id) return s;
    const p = { ...patch };
    if ('mes' in p && !mesValido(p.mes)) delete p.mes;
    if ('status' in p && !STATUS_IDS.includes(p.status as StatusMeta)) delete p.status;
    return { ...s, ...p };
  });
}

/** Lista sem o sucesso `id`. */
export const removeSucesso = (lista: Sucesso[], id: string): Sucesso[] => lista.filter((s) => s.id !== id);

/** Sucessos agrupados por mês, na ordem 1 a 4; mês sem sucesso fica de fora. */
export function porMes(lista: Sucesso[]): { mes: number; sucessos: Sucesso[] }[] {
  return MESES.map((mes) => ({ mes, sucessos: lista.filter((s) => s.mes === mes) })).filter((g) => g.sucessos.length > 0);
}

/** Atingidos (status "concluída") sobre o total; sucesso congelado fica fora da conta, como na meta. */
export function atingidos(lista: Sucesso[]): { atingidos: number; total: number } {
  const ativos = lista.filter((s) => s.status !== 'congelada');
  return { atingidos: ativos.filter((s) => s.status === 'concluida').length, total: ativos.length };
}
