/* Missão 3 · hierarquia do planejamento: Legado → objetivo específico (1:1 com o preditor) → metas.
   Funções puras sobre D. O objetivo da meta é derivado de `pred`; não existe campo `obj` gravado.
   PREDITORES e OBJ_ESPECIFICOS são cópias tipadas de public/legacy/conteudo.js (tests/plano.test.ts confere a paridade). */
import { lerMeta, lerRumo } from './rumo.ts';
import type { DadosM3, Meta } from './rumo.ts';

export interface Preditor { id: string; n: string; d: string; q: string }

export const PREDITORES: Preditor[] = [
  { id: 'p1', n: 'Priorizar a agenda', d: 'Concentrar recursos, tempo e produção em um conjunto delimitado de temas', q: 'A meta organiza o foco temático interno do mandato?' },
  { id: 'p2', n: 'Pautar os debates', d: 'Inserir ou elevar determinado tema na agenda institucional ou pública', q: 'A meta gera tração na agenda pública?' },
  { id: 'p3', n: 'Construir o partido', d: 'Fortalecer a estrutura organizacional e política da legenda', q: 'A meta amplia ou fortalece a estrutura partidária?' },
  { id: 'p4', n: 'Protagonizar espaços de decisão', d: 'Ocupar ou estruturar posições formais com poder decisório', q: 'A meta visa conquistar ou estruturar um espaço de poder decisório?' },
  { id: 'p5', n: 'Articular e mobilizar para a entrega de resultados', d: 'Transformar estratégia e articulação em avanço institucional concreto', q: 'A meta visa aprovação, tramitação ou avanço institucional direto?' },
];

/** Exemplos de objetivos específicos do Guia: [preditor, exemplo] */
export const OBJ_ESPECIFICOS: [string, string][] = [
  ['Priorização de agenda', 'Expandir iniciativas antirracistas por toda região central de Jiripoca'],
  ['Pautar os debates', 'Ser referência nacional na defesa do fim do trabalho infantil'],
  ['Protagonismo nos espaços de decisão', 'Articular a Liderança de pelo menos 2 Fóruns Notórios da Casa'],
  ['Construção de partido', 'Expandir relevância como liderança do partido na Casa Legislativa'],
  ['Articular e mobilizar para a entrega de resultados', 'Destravar a entrega do Hospital da Universidade Federal de Jiripoca'],
];

export const MAX_PREDITORES = 3;
export const MAX_METAS_POR_OBJETIVO = 4;
export const METAS_MIN = 10;
export const METAS_MAX = 16;

export interface Objetivo { pid: string; nome: string; pergunta: string; texto: string }
export type ItemMeta = Meta & { idx: number };
export interface Arvore {
  legado: string;
  bandeiras: string[];
  objetivos: (Objetivo & { metas: ItemMeta[] })[];
  semObjetivo: ItemMeta[];
}

const ehObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const nomeDe = (pid: string) => PREDITORES.find((p) => p.id === pid)?.n ?? pid;

/** Ids dos preditores escolhidos: só os conhecidos, sem repetição, na ordem escolhida. */
function escolhidos(d: DadosM3): string[] {
  const lista = Array.isArray(d.preditores) ? d.preditores : [];
  return lista.filter((p): p is string => typeof p === 'string' && PREDITORES.some((x) => x.id === p)).filter((p, i, a) => a.indexOf(p) === i);
}

/** Metas com a posição original em D.metas (itens que não são objeto são ignorados, mas contam na posição). */
function metasComIdx(d: DadosM3): ItemMeta[] {
  return (Array.isArray(d.metas) ? d.metas : []).flatMap((m, idx) => (ehObj(m) ? [{ ...lerMeta(m), idx }] : []));
}

/** Um objetivo por preditor escolhido: o texto de m3.obj.{pid}, ou o nome do preditor quando vazio (regra do Guia). */
export function objetivos(d: DadosM3): Objetivo[] {
  return escolhidos(d).map((pid) => {
    const p = PREDITORES.find((x) => x.id === pid)!;
    return { pid, nome: p.n, pergunta: p.q, texto: (d.campos?.[`m3.obj.${pid}`] ?? '').trim() || p.n };
  });
}

export function arvore(d: DadosM3): Arvore {
  const rumo = lerRumo(d);
  const metas = metasComIdx(d);
  const objs = objetivos(d);
  const ids = new Set(objs.map((o) => o.pid));
  return {
    legado: rumo.legado.manchete,
    bandeiras: rumo.bandeiras.filter((b) => b.prioridade !== null).sort((a, b) => a.prioridade! - b.prioridade!).map((b) => b.rot),
    objetivos: objs.map((o) => ({ ...o, metas: metas.filter((m) => m.pred === o.pid) })),
    semObjetivo: metas.filter((m) => !m.pred || !ids.has(m.pred)),
  };
}

/** Pode acrescentar uma meta a este objetivo? Exige preditor escolhido e no máximo 4 metas por objetivo. */
export function podeAcrescentarMeta(d: DadosM3, pid: string): { ok: boolean; motivo?: string } {
  const ids = escolhidos(d);
  if (!ids.length) return { ok: false, motivo: 'Escolha os preditores na etapa anterior antes de escrever as metas.' };
  if (!pid || !ids.includes(pid)) return { ok: false, motivo: 'Escolha o objetivo específico a que a meta pertence.' };
  if (metasComIdx(d).filter((m) => m.pred === pid).length >= MAX_METAS_POR_OBJETIVO)
    return { ok: false, motivo: `Cada objetivo tem no máximo ${MAX_METAS_POR_OBJETIVO} metas (limite do Guia). Use outro objetivo ou revise as metas deste.` };
  return { ok: true };
}

/** 10 a 16 metas é a faixa do Guia; fora dela é só aviso. */
export function contagemMetas(d: DadosM3): { n: number; faixa: 'abaixo' | 'ok' | 'acima' } {
  const n = metasComIdx(d).length;
  return { n, faixa: n < METAS_MIN ? 'abaixo' : n > METAS_MAX ? 'acima' : 'ok' };
}

/** Marca ou desmarca um preditor. O quarto é recusado, citando os que podem sair. Não altera `d`. */
export function alternaPreditor(d: DadosM3, pid: string): { preditores: string[]; erro?: string } {
  const atuais = escolhidos(d);
  if (atuais.includes(pid)) return { preditores: atuais.filter((p) => p !== pid) };
  if (atuais.length >= MAX_PREDITORES)
    return { preditores: atuais, erro: `Escolha até ${MAX_PREDITORES} preditores. Desmarque um deles (${atuais.map(nomeDe).join(', ')}) para trocar.` };
  return { preditores: [...atuais, pid] };
}

/** Desmarca o preditor: as metas dele ficam sem objetivo (pred vazio), sem apagar nada. Quem chama grava o patch. */
export function desmarcaPreditor(d: DadosM3, pid: string): { afetadas: number; patch: { preditores: string[]; metas: Meta[] } } {
  const bruto = Array.isArray(d.metas) ? d.metas : [];
  const afetadas = bruto.filter((m) => ehObj(m) && m.pred === pid).length;
  const metas = bruto.map((m) => (ehObj(m) && m.pred === pid ? { ...m, pred: '' } : m)) as Meta[];
  return { afetadas, patch: { preditores: escolhidos(d).filter((p) => p !== pid), metas } };
}

/** Meta normalizada (status padrão "não concluída", campo inválido descartado). */
export const normalizaMeta = lerMeta;
