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
export const PAPEIS = ['Titular', 'Suplente', 'Relatoria', 'Vice-presidência', 'Presidência'];

/** Primeiro movimento (múltipla escolha). */
export const MOVIMENTOS: Opcao[] = [
  { id: 'lideranca', rot: 'Conversar com a liderança partidária' },
  { id: 'secretaria', rot: 'Procurar a secretaria da comissão' },
  { id: 'presidencia', rot: 'Marcar conversa com a presidência da comissão' },
  { id: 'pauta', rot: 'Mapear a pauta e os projetos em tramitação' },
  { id: 'relatoria', rot: 'Identificar uma relatoria estratégica' },
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
