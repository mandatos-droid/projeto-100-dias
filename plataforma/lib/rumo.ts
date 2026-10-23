/* Missão 3 · estado novo do Rumo (bandeiras, critérios, Legado) e migração do formato antigo.
   Funções puras sobre D: ler (lerRumo, lerMeta) nunca altera nada; aplicaRumo é o único ponto de escrita e
   reespelha as chaves antigas m3.* em texto legível, para o Resumo, o painel e a nuvem seguirem lendo. */
import { BANDEIRAS, bandeiraDoRotulo } from './bandeiras.ts';

export type Campos = Record<string, string>;

export interface Criterio { id: string; rot: string; guia: boolean }
export interface BandeiraRumo {
  id: string;                          // id da taxonomia, ou "x-<slug>" para outra bandeira
  rot: string;
  argumentos: string;
  notas: Record<string, number>;       // critério → inteiro 0..5
  prioridade: number | null;           // 1..3, na ordem de confirmação
}
export interface ElementosLegado { protagonista: string; entrega: string; resultado: string; cargo: string; cargoOutro?: string }
export interface RascunhoLegado { id: string; grupo: string; manchete: string; cargo: string }
export type ModeloId = 'reeleicao' | 'outro-cargo' | 'camara-senado' | 'entrega';
export interface LegadoRumo {
  modelo?: ModeloId;
  el: ElementosLegado;
  manchete: string;                    // texto final; com manual, não é recomposto
  manual: boolean;
  jornal: string;
  fechado: boolean;
  rascunhos: RascunhoLegado[];
}
export interface Rumo {
  v: 1;
  criterios: Criterio[];
  bandeiras: BandeiraRumo[];
  legado: LegadoRumo;
  objetivoAno?: string;
  /** texto livre que o mandato já tinha em m3.argumentos/m3.criterios antes do estado estruturado; o espelho o mantém */
  textoAntigo?: { argumentos?: string; criterios?: string };
}

export type StatusMeta = 'concluida' | 'concluida70' | 'nao_concluida' | 'congelada';
export const STATUS_IDS: StatusMeta[] = ['concluida', 'concluida70', 'nao_concluida', 'congelada'];
export interface Meta {                // D.metas[i]; campos antigos (pred, texto, resp, apoio) preservados
  id?: string; pred?: string; texto?: string; resp?: string; apoio?: string;
  status: StatusMeta;
  respCad?: number | null; apoioCad?: number[]; alcancavel?: boolean;
}

/** O que a lógica lê e grava em D (o resto do D do legado passa intocado). */
export interface DadosM3 { campos?: Campos; rumo?: unknown; metas?: unknown; preditores?: unknown }

/** Mesmos quatro critérios de priorização do Guia (peso igual). */
export const CRITERIOS_GUIA: Criterio[] = [
  { id: 'especializacao', rot: 'Especialização da liderança no tema', guia: true },
  { id: 'apoiadores', rot: 'Quantidade de apoiadores', guia: true },
  { id: 'promessas', rot: 'Promessas de campanha', guia: true },
  { id: 'impacto', rot: 'Impacto para o território', guia: true },
];
export const JORNAL_PADRAO = 'A Gazeta do Mandato';
const MODELOS_IDS: ModeloId[] = ['reeleicao', 'outro-cargo', 'camara-senado', 'entrega'];

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const ehObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, padrao = '') => (typeof v === 'string' ? v : padrao);
const nota = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 5;
export const idOutra = (rot: string) => `x-${norm(rot).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'bandeira'}`;

// ---------- migração do formato antigo (m3.mural, m3.b1..b3, m3.legado, m3.cargo) ----------

/** Minúsculas e sem acento, mantendo o tamanho do texto (para casar posições com o original). */
const dobra = (s: string) => s.split('').map((ch) => ch.normalize('NFD')[0].toLowerCase()).join('');

/** Texto livre do mural → rótulos. Acha primeiro os rótulos da taxonomia (alguns têm vírgula) e separa o resto por linha, ; e vírgula. */
function rotulosDoMural(texto: string): string[] {
  const achados: { pos: number; rot: string }[] = [];
  let sobra = texto;
  [...BANDEIRAS].sort((a, b) => b.rot.length - a.rot.length).forEach((b) => {
    const pos = dobra(sobra).indexOf(dobra(b.rot));
    if (pos < 0) return;
    achados.push({ pos, rot: b.rot });
    sobra = sobra.slice(0, pos) + '\n'.repeat(b.rot.length) + sobra.slice(pos + b.rot.length);
  });
  const outros = sobra.split(/[\n;,]+/).map((p) => p.trim().replace(/^(?:[-•*–]|\d+[.)])\s*/, '').trim()).filter((p) => /[\p{L}\p{N}]/u.test(p));
  return [...achados.sort((a, b) => a.pos - b.pos).map((a) => a.rot), ...outros];
}

/** Rótulo único de uma prioritária antiga: o da taxonomia se reconhecer (exato ou contido), senão o texto. */
function rotuloPrioritaria(t: string): string {
  const exato = bandeiraDoRotulo(t);
  if (exato) return exato.rot;
  const n = norm(t);
  const contido = [...BANDEIRAS].sort((a, b) => b.rot.length - a.rot.length).find((b) => n.includes(norm(b.rot)));
  return contido ? contido.rot : t.trim();
}

export const novaBandeira = (rot: string): BandeiraRumo => {
  const t = bandeiraDoRotulo(rot);
  return { id: t ? t.id : idOutra(rot), rot: t ? t.rot : rot, argumentos: '', notas: {}, prioridade: null };
};

function migraBandeiras(c: Campos): BandeiraRumo[] {
  const lista: BandeiraRumo[] = [];
  const acha = (rot: string) => {
    const nova = novaBandeira(rot);
    let b = lista.find((x) => x.id === nova.id);
    if (!b) { b = nova; lista.push(b); }
    return b;
  };
  rotulosDoMural(c['m3.mural'] ?? '').forEach(acha);
  [1, 2, 3].forEach((i) => {
    const t = (c[`m3.b${i}`] ?? '').trim();
    if (t) acha(rotuloPrioritaria(t)).prioridade ??= i;
  });
  return lista;
}

function migraLegado(c: Campos): LegadoRumo {
  const manchete = c['m3.legado'] ?? '';
  return {
    el: { protagonista: '', entrega: '', resultado: '', cargo: (c['m3.cargo'] ?? '').trim() },
    manchete, manual: manchete.trim() !== '', jornal: JORNAL_PADRAO, fechado: false, rascunhos: [],
  };
}

// ---------- normalização campo a campo (descarta só o que é inválido) ----------

function lerBandeira(v: unknown): BandeiraRumo | null {
  if (!ehObj(v) || typeof v.id !== 'string' || v.id === '' || typeof v.rot !== 'string') return null;
  const notas: Record<string, number> = {};
  if (ehObj(v.notas)) Object.entries(v.notas).forEach(([k, n]) => { if (nota(n)) notas[k] = n; });
  const p = v.prioridade;
  return { id: v.id, rot: v.rot, argumentos: str(v.argumentos), notas, prioridade: typeof p === 'number' && Number.isInteger(p) && p >= 1 && p <= 3 ? p : null };
}

function lerCriterios(v: unknown): Criterio[] {
  if (!Array.isArray(v)) return CRITERIOS_GUIA.map((c) => ({ ...c }));
  const lista = v.filter(ehObj).filter((c) => typeof c.id === 'string' && typeof c.rot === 'string')
    .map((c) => ({ id: c.id as string, rot: c.rot as string, guia: CRITERIOS_GUIA.some((g) => g.id === c.id) }));
  return lista.length ? lista : CRITERIOS_GUIA.map((c) => ({ ...c }));
}

function lerLegado(v: unknown, antigo: LegadoRumo): LegadoRumo {
  if (!ehObj(v)) return antigo;
  const el = ehObj(v.el) ? v.el : {};
  const cargoOutro = typeof el.cargoOutro === 'string' ? el.cargoOutro : undefined;
  const rascunhos = (Array.isArray(v.rascunhos) ? v.rascunhos : []).filter(ehObj).filter((r) => typeof r.id === 'string')
    .map((r) => ({ id: r.id as string, grupo: str(r.grupo), manchete: str(r.manchete), cargo: str(r.cargo) }));
  return {
    modelo: MODELOS_IDS.includes(v.modelo as ModeloId) ? (v.modelo as ModeloId) : undefined,
    el: { protagonista: str(el.protagonista), entrega: str(el.entrega), resultado: str(el.resultado), cargo: str(el.cargo), ...(cargoOutro !== undefined ? { cargoOutro } : {}) },
    manchete: str(v.manchete), manual: v.manual === true, jornal: str(v.jornal, JORNAL_PADRAO) || JORNAL_PADRAO,
    fechado: v.fechado === true, rascunhos,
  };
}

/** Rumo do mandato, normalizado. Sem D.rumo válido, migra do texto antigo. Não altera `d`. */
export function lerRumo(d: DadosM3): Rumo {
  const c = d.campos ?? {};
  const antigo = migraLegado(c);
  if (!ehObj(d.rumo)) {
    const textoAntigo: Rumo['textoAntigo'] = {};
    if ((c['m3.argumentos'] ?? '').trim()) textoAntigo.argumentos = c['m3.argumentos'];
    if ((c['m3.criterios'] ?? '').trim()) textoAntigo.criterios = c['m3.criterios'];
    return { v: 1, criterios: CRITERIOS_GUIA.map((x) => ({ ...x })), bandeiras: migraBandeiras(c), legado: antigo, ...(Object.keys(textoAntigo).length ? { textoAntigo } : {}) };
  }
  const r = d.rumo;
  const usadas = new Set<number>();
  const bandeiras = (Array.isArray(r.bandeiras) ? r.bandeiras : []).map(lerBandeira).filter((b): b is BandeiraRumo => b !== null)
    .filter((b, i, todas) => todas.findIndex((x) => x.id === b.id) === i)
    .map((b) => { if (b.prioridade !== null) { if (usadas.has(b.prioridade)) b.prioridade = null; else usadas.add(b.prioridade); } return b; });
  const ta = ehObj(r.textoAntigo) ? r.textoAntigo : {};
  const textoAntigo: Rumo['textoAntigo'] = {};
  if (typeof ta.argumentos === 'string' && ta.argumentos.trim()) textoAntigo.argumentos = ta.argumentos;
  if (typeof ta.criterios === 'string' && ta.criterios.trim()) textoAntigo.criterios = ta.criterios;
  return {
    v: 1, criterios: lerCriterios(r.criterios), bandeiras, legado: lerLegado(r.legado, { ...antigo, manchete: '', manual: false, el: { ...antigo.el, cargo: '' } }),
    ...(typeof r.objetivoAno === 'string' ? { objetivoAno: r.objetivoAno } : {}),
    ...(Object.keys(textoAntigo).length ? { textoAntigo } : {}),
  };
}

// ---------- metas ----------

/** Meta normalizada: status ausente ou inválido vale "não concluída"; campo inválido é descartado, o resto fica. */
export function lerMeta(v: unknown): Meta {
  const o: Record<string, unknown> = ehObj(v) ? { ...v } : {};
  (['id', 'pred', 'texto', 'resp', 'apoio'] as const).forEach((k) => { if (k in o && typeof o[k] !== 'string') delete o[k]; });
  if ('respCad' in o && o.respCad !== null && !(typeof o.respCad === 'number' && Number.isInteger(o.respCad))) delete o.respCad;
  if ('apoioCad' in o) {
    if (Array.isArray(o.apoioCad)) o.apoioCad = o.apoioCad.filter((n) => typeof n === 'number' && Number.isInteger(n));
    else delete o.apoioCad;
  }
  if ('alcancavel' in o && typeof o.alcancavel !== 'boolean') delete o.alcancavel;
  o.status = STATUS_IDS.includes(o.status as StatusMeta) ? o.status : 'nao_concluida';
  return o as unknown as Meta;
}

/** D.metas normalizado; itens que não são objeto são ignorados. Não altera `d`. */
export const lerMetas = (d: DadosM3): Meta[] => (Array.isArray(d.metas) ? d.metas : []).filter(ehObj).map(lerMeta);

// ---------- espelho em m3.* ----------

const somaNotas = (b: BandeiraRumo, criterios: Criterio[]) => criterios.reduce((s, c) => s + (b.notas[c.id] ?? 0), 0);
const junta = (...partes: (string | undefined)[]) => partes.filter((p) => p && p.trim()).join('\n');

/** Texto legível para as chaves antigas. Chave vazia ('') significa "apagar". */
export function espelho(r: Rumo): Campos {
  const prior = [...r.bandeiras].filter((b) => b.prioridade !== null).sort((a, b) => a.prioridade! - b.prioridade!);
  const comArgs = r.bandeiras.filter((b) => b.argumentos.trim());
  const comNotas = r.bandeiras.filter((b) => Object.keys(b.notas).length);
  const crit = comNotas.length
    ? junta(`Critérios: ${r.criterios.map((c) => c.rot).join('; ')}`,
      ...comNotas.map((b) => `${b.rot} (${somaNotas(b, r.criterios)} pontos): ${r.criterios.filter((c) => c.id in b.notas).map((c) => `${c.rot} ${b.notas[c.id]}`).join(', ')}`))
    : '';
  const cargo = r.legado.el.cargo === 'Outro' && r.legado.el.cargoOutro?.trim() ? r.legado.el.cargoOutro.trim() : r.legado.el.cargo;
  return {
    'm3.mural': r.bandeiras.map((b) => b.rot).join('\n'),
    'm3.argumentos': junta(...comArgs.map((b) => `${b.rot}: ${b.argumentos.trim()}`), r.textoAntigo?.argumentos),
    'm3.criterios': junta(crit, r.textoAntigo?.criterios),
    'm3.b1': prior[0]?.rot ?? '',
    'm3.b2': prior[1]?.rot ?? '',
    'm3.b3': prior[2]?.rot ?? '',
    'm3.legado': r.legado.manchete,
    'm3.cargo': cargo,
  };
}

export type PatchRumo = Partial<Omit<Rumo, 'legado' | 'v'>> & { legado?: Partial<Omit<LegadoRumo, 'el'>> & { el?: Partial<ElementosLegado> } };

/** Grava o patch em D.rumo (mesclando o legado) e reespelha m3.*. Único ponto de escrita do estado. */
export function aplicaRumo(d: DadosM3, patch: PatchRumo): void {
  const atual = lerRumo(d);
  const { legado, ...resto } = patch;
  const proximo = lerRumo({ rumo: {
    ...atual, ...resto,
    legado: { ...atual.legado, ...legado, el: { ...atual.legado.el, ...legado?.el } },
  } });
  d.rumo = proximo;
  const campos = (d.campos ??= {});
  Object.entries(espelho(proximo)).forEach(([k, v]) => { if (v === '') delete campos[k]; else campos[k] = v; });
}
