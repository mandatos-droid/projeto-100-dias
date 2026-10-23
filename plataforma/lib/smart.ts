/* Missão 3 · retorno SMART de uma meta, por regras (sem IA). É heurística sobre o texto: orienta, nunca bloqueia.
   S, M e T saem do texto; R vem do vínculo com o objetivo; A só vale depois da confirmação da equipe. */

export const LETRAS = ['S', 'M', 'A', 'R', 'T'] as const;
export type Letra = (typeof LETRAS)[number];
export const ALERTA_ROTINA = 'Meta não é tarefa diária';

export interface Retorno {
  letras: Record<Letra, { ok: boolean; dica: string }>;
  alertas: string[];
  pontos: number;                 // 0..5, letras atendidas
  falta: Letra | null;            // primeira letra que falta, na ordem S, M, A, R, T
  dica: string;                   // dica dessa letra ('' quando nada falta)
}

const DICAS: Record<Letra, string> = {
  S: 'Comece com um verbo no infinitivo (aprovar, ampliar, realizar) e descreva a entrega com pelo menos 6 palavras.',
  M: 'Diga quanto: um número, um percentual ou uma quantidade (30%, 3 projetos, duas vezes).',
  A: 'Confirme que a meta cabe na capacidade da equipe nos 4 meses.',
  R: 'Ligue a meta a um objetivo específico: é o que a torna relevante para o mandato.',
  T: 'Defina um prazo ou uma frequência (até dezembro de 2027, mensalmente).',
};

const sem = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// substantivos e adjetivos que terminam como infinitivo mas não são verbos
const NAO_VERBOS = new Set(['amor', 'calor', 'valor', 'autor', 'setor', 'motor', 'menor', 'maior', 'melhor', 'pior', 'senhor', 'doutor', 'favor', 'sabor', 'tutor', 'mulher', 'lazer', 'prazer', 'dor', 'cor']);
const QUANTIDADE = /\b(um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|quinze|vinte|trinta|cem|mil|metade|todos|todas)\b/;
const PRAZO = new RegExp([
  '\\bate\\b', '\\b(dias|semanas|meses|anos)\\b', '\\b(19|20)\\d{2}\\b',
  '\\b(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\\b',
  '\\b(mens|seman|quinzen|bimestr|trimestr|semestr|anu)(al|ais|almente)\\b', '\\bdiari\\w*', '\\bpor (mes|semana|ano)\\b',
].join('|'));
const ROTINA = /\benviar e-?mails?\b|\bfazer reuni|\bresponder\b|\batender\b|\bpostar\b|\bpublicar diariamente|\btodo dia\b|\bdiariamente\b/;

export function avaliaMeta(m: { texto: string; pred?: string; alcancavel?: boolean }): Retorno {
  const texto = typeof m.texto === 'string' ? m.texto.trim() : '';
  const t = sem(texto);
  const palavras = t.split(/\s+/).filter(Boolean);
  const primeira = (palavras[0] ?? '').replace(/[^a-z]/g, '');
  const atende: Record<Letra, boolean> = texto === '' ? { S: false, M: false, A: false, R: false, T: false } : {
    S: palavras.length >= 6 && primeira.length >= 4 && /(ar|er|ir|or)$/.test(primeira) && !NAO_VERBOS.has(primeira),
    M: /\d|%/.test(t) || QUANTIDADE.test(t),
    A: m.alcancavel === true,
    R: !!m.pred,
    T: PRAZO.test(t),
  };
  const letras = Object.fromEntries(LETRAS.map((l) => [l, { ok: atende[l], dica: DICAS[l] }])) as Retorno['letras'];
  const falta = LETRAS.find((l) => !atende[l]) ?? null;
  return {
    letras, pontos: LETRAS.filter((l) => atende[l]).length, falta, dica: falta ? DICAS[falta] : '',
    alertas: ROTINA.test(t) ? [ALERTA_ROTINA] : [],
  };
}
