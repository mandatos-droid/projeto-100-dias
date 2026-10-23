'use client';
/* Ligação entre as ilhas da Missão 3 e o estado do Guia. Toda escrita passa por aplicaRumo/normalizaMeta (lib/) e termina em bump().
   Metas são endereçadas pela posição em D.metas (`idx`), a mesma que o Guia e a Missão 5 usam. */
import { arvore, normalizaMeta, objetivos, podeAcrescentarMeta, type ItemMeta } from '@/lib/plano';
import { pessoas } from '@/lib/pessoas';
import { aplicaRumo, lerRumo, type Meta, type PatchRumo } from '@/lib/rumo';
import { aviso, useLegado } from '../ponte';

const modelo = () => ((window as unknown as { CARGOS_EQUIPE?: string[][] }).CARGOS_EQUIPE ?? []).map((c) => c[0] ?? '');
const uid = () => Math.random().toString(36).slice(2, 10);

export function useRumo() {
  const { D, m, bump } = useLegado();
  const rumo = lerRumo(D);
  const arv = arvore(D);
  const metas: ItemMeta[] = [...arv.objetivos.flatMap((o) => o.metas), ...arv.semObjetivo].sort((a, b) => a.idx - b.idx);
  const lista = () => (Array.isArray(D.metas) ? (D.metas as unknown[]) : []);

  return {
    d: D, c: D.campos, m, rumo, arv, metas, objetivos: objetivos(D), pessoas: pessoas(D.campos, modelo()), bump,
    /** Grava o patch do Rumo e reespelha m3.*. */
    set(patch: PatchRumo) { aplicaRumo(D, patch); bump(); },
    /** Grava chaves soltas de D.campos (ex.: m3.obj.p1). Valor vazio apaga. */
    setCampos(patch: Record<string, string>) {
      Object.entries(patch).forEach(([k, v]) => { if (v === '') delete D.campos[k]; else D.campos[k] = v; });
      bump();
    },
    /** Escolhe os preditores; `metasNovas` opcional troca D.metas inteiro (usado ao desmarcar um preditor). */
    setPreditores(preditores: string[], metasNovas?: Meta[]) {
      D.preditores = preditores;
      if (metasNovas) D.metas = metasNovas.map(normalizaMeta);
      bump();
    },
    setMeta(idx: number, patch: Partial<Meta>) {
      const l = lista();
      if (!l[idx]) return;
      l[idx] = normalizaMeta({ ...(l[idx] as object), ...patch });
      bump();
    },
    /** Acrescenta uma meta ao objetivo. Devolve o motivo da recusa (e avisa) ou null se gravou. */
    addMeta(pred: string): string | null {
      const r = podeAcrescentarMeta(D, pred);
      if (!r.ok) { aviso(r.motivo ?? ''); return r.motivo ?? ''; }
      if (!Array.isArray(D.metas)) D.metas = [];
      (D.metas as unknown[]).push(normalizaMeta({ id: uid(), pred, texto: '' }));
      bump();
      return null;
    },
    rmMeta(idx: number) {
      if (!lista()[idx]) return;
      lista().splice(idx, 1);
      bump();
    },
  };
}
