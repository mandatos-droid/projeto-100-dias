/* Missão 5 · ciclos de planejamento. O plano ativo continua nos campos de hoje (D.metas, D.rumo, D.preditores, D.campos);
   criar um novo planejamento guarda uma cópia congelada do atual em D.planos[] e deixa no ativo só as metas escolhidas.
   Legado, bandeiras, objetivos e preditores seguem onde estão. Os arquivados são somente leitura (abrirCiclo só lê). */
import { arvore, objetivos, type Arvore, type Objetivo } from './plano.ts';
import { lerMeta, lerMetas, type DadosM3, type Meta } from './rumo.ts';

export interface PlanoArquivado {
  n: number;
  criadoEm: string;
  /** nome dado pela pessoa (opcional); sem ele vale "Planejamento n" */
  nome?: string;
  legado: string;
  bandeiras: string[];
  objetivos: Objetivo[];
  metas: Meta[];
}
export type DadosCiclos = DadosM3 & { planos?: unknown };
export interface Ciclo { n: number; atual: boolean; rot: string; criadoEm?: string }

const ehObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const clona = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Arquivados válidos de D.planos (item que não é um plano completo é ignorado). Não altera `d`. */
export function lerPlanos(d: DadosCiclos): PlanoArquivado[] {
  return (Array.isArray(d.planos) ? d.planos : []).filter((p): p is Record<string, unknown> => ehObj(p) && typeof p.n === 'number' && Array.isArray(p.metas))
    .map((p) => ({
      n: p.n as number,
      criadoEm: typeof p.criadoEm === 'string' ? p.criadoEm : '',
      ...(typeof p.nome === 'string' && p.nome.trim() ? { nome: p.nome.trim() } : {}),
      legado: typeof p.legado === 'string' ? p.legado : '',
      bandeiras: (Array.isArray(p.bandeiras) ? p.bandeiras : []).filter((b): b is string => typeof b === 'string'),
      objetivos: (Array.isArray(p.objetivos) ? p.objetivos : []).filter(ehObj) as unknown as Objetivo[],
      metas: (p.metas as unknown[]).map(lerMeta),
    }));
}

/**
 * Guarda o plano atual em D.planos e abre o próximo: Legado, bandeiras, objetivos e preditores ficam; D.metas passa a ter só as
 * metas de `copiar` (posições em D.metas), com os mesmos campos (texto, preditor, responsáveis, sucessos) e status "não concluída" na meta e em cada sucesso. Devolve o número do plano guardado.
 * Quem chama grava (bump). Sem chamar esta função nada muda.
 */
export function arquivarEIniciar(d: DadosCiclos, opcoes: { copiar?: number[]; agora?: string } = {}): number {
  const atual = arvore(d);
  const n = lerPlanos(d).length + 1;
  const metas = lerMetas(d);
  const copiadas = [...new Set(opcoes.copiar ?? [])].filter((i) => Number.isInteger(i) && i >= 0 && i < metas.length).sort((a, b) => a - b)
    .map((i) => { const m = clona(metas[i]); return { ...m, status: 'nao_concluida' as const, ...(m.sucessos ? { sucessos: m.sucessos.map((s) => ({ ...s, status: 'nao_concluida' as const })) } : {}) }; });
  const plano: PlanoArquivado = {
    n, criadoEm: opcoes.agora ?? new Date().toISOString(),
    legado: atual.legado, bandeiras: [...atual.bandeiras], objetivos: clona(objetivos(d)), metas: clona(metas),
  };
  d.planos = [...(Array.isArray(d.planos) ? d.planos : []), plano];
  d.metas = copiadas;
  return n;
}

/** Os planejamentos em ordem: os arquivados (1, 2…) e o atual por último. */
export function listaCiclos(d: DadosCiclos): Ciclo[] {
  const arq = lerPlanos(d).map((p) => ({ n: p.n, atual: false, rot: p.nome || `Planejamento ${p.n}`, criadoEm: p.criadoEm }));
  const n = arq.length + 1;
  return [...arq, { n, atual: true, rot: `Planejamento ${n} (atual)` }];
}

/** Árvore do arquivado `n` para leitura (metas com `idx` na ordem guardada); null se `n` não é um arquivado. */
export function abrirCiclo(d: DadosCiclos, n: number): Arvore | null {
  const p = lerPlanos(d).find((x) => x.n === n);
  if (!p) return null;
  const metas = p.metas.map((m, idx) => ({ ...clona(m), idx }));
  const ids = new Set(p.objetivos.map((o) => o.pid));
  return {
    legado: p.legado, bandeiras: [...p.bandeiras],
    objetivos: p.objetivos.map((o) => ({ ...o, metas: metas.filter((m) => m.pred === o.pid) })),
    semObjetivo: metas.filter((m) => !m.pred || !ids.has(m.pred)),
  };
}

/** Dá (ou, com texto vazio, tira) o nome de um planejamento arquivado. Devolve false se `n` não é arquivado. Quem chama grava. */
export function renomeiaPlano(d: DadosCiclos, n: number, nome: string): boolean {
  const lista = Array.isArray(d.planos) ? d.planos : [];
  const alvo = lista.find((p) => ehObj(p) && p.n === n);
  if (!ehObj(alvo)) return false;
  if (nome.trim()) alvo.nome = nome.trim(); else delete alvo.nome;
  return true;
}

/** Exclui um planejamento arquivado e renumera os demais (1, 2…). O atual não se exclui. Devolve false se `n` não é arquivado. Quem chama grava. */
export function excluiPlano(d: DadosCiclos, n: number): boolean {
  const lista = Array.isArray(d.planos) ? d.planos : [];
  if (!lista.some((p) => ehObj(p) && p.n === n)) return false;
  d.planos = lista.filter((p) => !(ehObj(p) && p.n === n)).map((p, i) => (ehObj(p) ? { ...p, n: i + 1 } : p));
  return true;
}
