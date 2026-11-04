/* Missão 4 · Capital Político: listas das escolhas rápidas e regra pura do progresso das ações.
   As frentes e as ações vêm de BINGOS (conteudo.js, só leitura); `D.acoes` segue no formato antigo, sem migração.
   Os textos dos botões e o texto base de "Como saberemos" são nossos, não texto do Guia. */

export type Opcao = { id: string; rot: string };

/** Por que estar na comissão (múltipla escolha). */
export const MOTIVOS: Opcao[] = [
  { id: 'pauta', rot: 'Pauta da nossa bandeira' },
  { id: 'visibilidade', rot: 'Dá visibilidade ao mandato' },
  { id: 'tramitacao', rot: 'Ali tramitam propostas importantes para nós' },
  { id: 'articulacao', rot: 'Abre espaço de articulação com outros mandatos' },
  { id: 'territorio', rot: 'Atende uma demanda do território' },
  { id: 'partido', rot: 'Pedido ou estratégia do partido' },
];

/** Papéis que o mandato pretende exercer. */
export const PAPEL_RELATORIA = 'Conquista de Relatoria Relevante';
export const PAPEIS = ['Titular', 'Suplente', PAPEL_RELATORIA, 'Vice-presidência', 'Presidência'];

/** "Relatoria" (texto antigo, ou papel do espaço da Missão 3) é o botão "Conquista de Relatoria Relevante" (SUG-46). */
export const papelNorm = (papel: unknown): string => (typeof papel === 'string' ? (papel.trim() === 'Relatoria' ? PAPEL_RELATORIA : papel) : '');

/** Movimentos da comissão (até 4, cada um com data; ver lerMovimentos). */
export const MOVIMENTOS: Opcao[] = [
  { id: 'lideranca', rot: 'Conversar com a liderança partidária' },
  { id: 'secretaria', rot: 'Procurar a secretaria da comissão' },
  { id: 'presidencia', rot: 'Marcar conversa com a presidência da comissão' },
  { id: 'pauta', rot: 'Mapear a pauta e os projetos em tramitação' },
  { id: 'relatoria', rot: 'Identificar uma relatoria estratégica' },
  { id: 'casa', rot: 'Articular com a Presidência da Casa' },
  { id: 'vaga', rot: 'Pedir a vaga formalmente' },
];

/** Texto base, editável, de "Como saberemos que a ação foi alcançada?" por frente (chaves de BINGOS). */
export const TEXTO_SABER: Record<string, string> = {
  articulacao: 'Reunião ou contato registrado, com ata ou resumo do que foi combinado e quem dá continuidade.',
  mobilizacao: 'Número de pessoas que participaram, lista ou registro da atividade e retorno de quem esteve presente.',
  partido: 'Registro da participação ou do encaminhamento dado pelo partido, com data e responsável.',
  redes: 'Publicação, matéria ou rotina no ar, com os números de alcance e de resposta do período.',
};

const ehObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Progresso do exercício de ações: ok quando há ao menos 2 ações em ao menos 2 frentes diferentes (Guia). */
export function progressoAcoes(acoes: unknown): { total: number; frentes: number; ok: boolean } {
  const validas = (Array.isArray(acoes) ? acoes : []).filter((a): a is Record<string, unknown> & { bingo: string } => ehObj(a) && typeof a.bingo === 'string' && a.bingo !== '');
  const frentes = new Set(validas.map((a) => a.bingo)).size;
  return { total: validas.length, frentes, ok: validas.length >= 2 && frentes >= 2 };
}

const CAMPOS_ACAO = ['alcancar', 'resp', 'prazo', 'saber', 'prox'] as const;
const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export type ModoAcao = 'resumo' | 'completo';

/** Alguma coisa escrita pela pessoa na ação? O texto base de "Como saberemos" que ninguém mexeu não conta. */
export function acaoTemTexto(a: unknown): boolean {
  if (!ehObj(a)) return false;
  if (texto(a.resumo) !== '') return true;
  return CAMPOS_ACAO.some((k) => texto(a[k]) !== '' && !(k === 'saber' && texto(a[k]) === (TEXTO_SABER[typeof a.bingo === 'string' ? a.bingo : ''] ?? '')));
}

/** Como a ação está detalhada (SUG-52): o modo escolhido; ação antiga com campos preenchidos é registro completo; senão ainda não escolheu (null). */
export function modoDaAcao(a: unknown): ModoAcao | null {
  if (!ehObj(a)) return null;
  if (a.modo === 'resumo' || a.modo === 'completo') return a.modo;
  return acaoTemTexto(a) ? 'completo' : null;
}

/** Ação completa (ponto verde): resumo preenchido (modo resumo) ou os 5 campos preenchidos (registro completo); sem modo escolhido, nunca. */
export function acaoCompleta(a: unknown): boolean {
  if (!ehObj(a)) return false;
  const modo = modoDaAcao(a);
  if (modo === 'resumo') return texto(a.resumo) !== '';
  return modo === 'completo' && CAMPOS_ACAO.every((k) => texto(a[k]) !== '');
}

/* ---------- ação ligada a uma meta do planejamento (SUG-53) ---------- */
export type MetaLigavel = { chave: string; texto: string };

/** Metas da Missão 3 que podem ser ligadas: as que têm texto. A chave é o `id` da meta ou, sem id, o próprio texto. */
export function metasLigaveis(metas: unknown): MetaLigavel[] {
  return (Array.isArray(metas) ? metas : []).filter(ehObj).flatMap((m) => {
    const t = texto(m.texto);
    return t === '' ? [] : [{ chave: texto(m.id) !== '' ? texto(m.id) : `txt:${t}`, texto: t }];
  });
}

/** A meta ligada à ação, se ela ainda existe (meta apagada ou reescrita some do vínculo, sem mexer na ação). */
export const metaDaAcao = (a: unknown, metas: unknown): MetaLigavel | null =>
  (ehObj(a) && typeof a.meta === 'string' ? metasLigaveis(metas).find((m) => m.chave === a.meta) : undefined) ?? null;

/** Próximo índice livre para uma ação escrita à mão numa frente (nunca colide com os itens do Guia, de 0 a n-1). */
export function proximoIndiceLivre(acoes: unknown, bingo: string, nItens: number): number {
  const usados = (Array.isArray(acoes) ? acoes : []).filter(ehObj).filter((a) => a.bingo === bingo && typeof a.i === 'number').map((a) => a.i as number);
  return Math.max(nItens - 1, ...usados) + 1;
}

/* ---------- prazo das ações (CAP-11.6, CAP-40) ---------- */
/** "AAAA-MM-DD" de uma data que existe no calendário. O prazo antigo, em texto livre ("até 20/03"), não é. */
export function ehDataISO(v: unknown): v is string {
  const m = typeof v === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(v) : null;
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

export const DIAS_APOS_POSSE = 100;
const maisDias = (iso: string, n: number) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
};

/** Hoje como "AAAA-MM-DD" no fuso do aparelho. */
export const hojeISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Menor e maior prazo aceitos: de hoje até 100 dias depois da posse. Sem data de posse válida não há máximo. */
export function limitesPrazo(posse: unknown, hoje: string): { min: string; max?: string } {
  return ehDataISO(posse) ? { min: hoje, max: maisDias(posse, DIAS_APOS_POSSE) } : { min: hoje };
}

/** Mensagem de recusa do prazo, ou null se vale. */
export function validaPrazo(valor: string, hoje: string, posse: unknown): string | null {
  if (!ehDataISO(valor)) return 'Escolha uma data válida.';
  const { min, max } = limitesPrazo(posse, hoje);
  if (valor < min) return 'Esse prazo já passou. Escolha uma data a partir de hoje.';
  if (max && valor > max) return `O prazo vai até ${DIAS_APOS_POSSE} dias depois da posse.`;
  return null;
}

/** Ordena as ações por prazo (data mais próxima primeiro). Prazo antigo em texto livre ou vazio fica no fim, na ordem em que estava. */
export function ordenaPorPrazo<T extends { prazo?: unknown }>(acoes: T[]): T[] {
  const chave = (a: T) => (ehDataISO(a.prazo) ? a.prazo : null);
  return acoes.map((a, i) => ({ a, i, k: chave(a) })).sort((x, y) => (x.k === y.k ? x.i - y.i : x.k === null ? 1 : y.k === null ? -1 : x.k < y.k ? -1 : 1)).map((x) => x.a);
}

/* ---------- escolhas rápidas ⇄ texto legível (D.comissoes: pq, papel, mov) ---------- */
const SEPARADOR = '; ';

/** Rótulos marcados mais o texto livre ("Outro"), em um texto só: "Pauta da nossa bandeira; Dá visibilidade ao mandato". */
export function textoDasEscolhas(rotulos: string[], outro = ''): string {
  return [...rotulos, outro.trim()].filter((s) => s !== '').join(SEPARADOR);
}

/** Inverso de textoDasEscolhas: o que casa com um rótulo das opções vira marcado; o resto (inclusive texto antigo, digitado à mão) é o "Outro". */
export function leEscolhas(texto: unknown, opcoes: string[]): { marcados: string[]; outro: string } {
  const partes = (typeof texto === 'string' ? texto : '').split(SEPARADOR).map((s) => s.trim()).filter((s) => s !== '');
  return { marcados: partes.filter((p) => opcoes.includes(p)), outro: partes.filter((p) => !opcoes.includes(p)).join(SEPARADOR) };
}

/* ---------- movimentos da comissão: até 4, cada um com data (SUG-47) ---------- */
export type Movimento = { rot: string; data: string };
export const MAX_MOVIMENTOS = 4;
const dataBR = (iso: string) => iso.split('-').reverse().join('/');
const ROTULOS_MOV = MOVIMENTOS.map((m) => m.rot);

/** Lê os movimentos de um registro de D.comissoes: `movs` se existir; senão o texto antigo `mov` (sem data). */
export function lerMovimentos(reg: { movs?: unknown; mov?: unknown }): Movimento[] {
  if (Array.isArray(reg.movs)) {
    return reg.movs.filter(ehObj).filter((m) => typeof m.rot === 'string').map((m) => ({ rot: m.rot as string, data: ehDataISO(m.data) ? m.data : '' })).slice(0, MAX_MOVIMENTOS);
  }
  return (typeof reg.mov === 'string' ? reg.mov : '').split(SEPARADOR).map((p) => p.trim()).filter((p) => p !== '').slice(0, MAX_MOVIMENTOS).map((p) => {
    const m = /^(.*?)\s*\((\d{2})\/(\d{2})\/(\d{4})\)$/.exec(p);
    const iso = m ? `${m[4]}-${m[3]}-${m[2]}` : '';
    return m && ehDataISO(iso) ? { rot: m[1], data: iso } : { rot: p, data: '' };
  });
}

/** Posições (índices de `movs`) na ordem de exibição: por data; sem data depois, na ordem em que foram marcados. */
export function ordemMovimentos(movs: Movimento[]): number[] {
  return movs.map((m, i) => ({ k: m.data || null, i })).sort((a, b) => (a.k === b.k ? a.i - b.i : a.k === null ? 1 : b.k === null ? -1 : a.k < b.k ? -1 : 1)).map((x) => x.i);
}

/** Texto legível de `mov` (o Guia antigo e o Resumo leem): "Rótulo (dd/mm/aaaa); Outro", na ordem de exibição. Movimento sem texto não entra. */
export function textoMovimentos(movs: Movimento[]): string {
  return ordemMovimentos(movs).map((i) => movs[i]).filter((m) => m.rot.trim() !== '')
    .map((m) => `${m.rot.trim().replace(/;/g, ',')}${m.data ? ` (${dataBR(m.data)})` : ''}`).join(SEPARADOR);
}

export type ResultadoMov = { ok: true; movs: Movimento[] } | { ok: false; erro: string };
const LIMITE_MSG = `Escolha no máximo ${MAX_MOVIMENTOS} movimentos.`;

/** Marca ou desmarca um movimento da lista de opções. O 5º é recusado. */
export function alternaMovimento(movs: Movimento[], rot: string): ResultadoMov {
  if (movs.some((m) => m.rot === rot)) return { ok: true, movs: movs.filter((m) => m.rot !== rot) };
  if (movs.length >= MAX_MOVIMENTOS) return { ok: false, erro: LIMITE_MSG };
  return { ok: true, movs: [...movs, { rot, data: '' }] };
}

/** "Outro (escrever)": liga ou desliga o movimento de texto livre (o que não é uma das opções). */
export function alternaOutroMovimento(movs: Movimento[]): ResultadoMov {
  if (movs.some((m) => !ROTULOS_MOV.includes(m.rot))) return { ok: true, movs: movs.filter((m) => ROTULOS_MOV.includes(m.rot)) };
  if (movs.length >= MAX_MOVIMENTOS) return { ok: false, erro: LIMITE_MSG };
  return { ok: true, movs: [...movs, { rot: '', data: '' }] };
}

export const defineDataMovimento = (movs: Movimento[], i: number, data: string): Movimento[] => movs.map((m, j) => (j === i ? { ...m, data } : m));
export const defineTextoMovimento = (movs: Movimento[], i: number, rot: string): Movimento[] => movs.map((m, j) => (j === i ? { ...m, rot } : m));
