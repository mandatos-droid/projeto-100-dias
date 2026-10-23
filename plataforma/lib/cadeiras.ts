/* Missão 2 · estado das cadeiras do gabinete (quem está ativa, de que área, quem lidera quem).
   Funções puras sobre D.campos (Record<string,string>): ler não altera nada; operar devolve um Patch.
   Mantém as chaves antigas (m2.f{n} nome, m2.p{n}.* ficha) para o painel, o Resumo e a nuvem seguirem lendo. */
import { COORDENACOES, PADRAO, SEP, chaveFicha, chaveNome, lista } from './equipe.ts';

export type Campos = Record<string, string>;
/** chave → valor; '' apaga a chave */
export type Patch = Record<string, string>;

export const CHAVE_ON = 'm2.on';           // índices das cadeiras ativas (SEP); 20 em diante = acrescentadas à mão
export const N_BASE = 20;                  // cadeiras do modelo original (CARGOS_EQUIPE)
export const CHEFIA = 0;
export const SEM_AREA = 'Sem área';
/** áreas escolhíveis: a Chefia de gabinete é cadeira obrigatória, não uma área */
export const AREAS = COORDENACOES.filter((c) => c !== 'Chefia de área');

const FICHA_CAMPOS = ['nome_cargo', 'coord', 'lider', 'escopo', 'espec', 'hab_dest', 'hab_dev', 'rep_dest', 'rep_dev', 'ritmo', 'rel', 'entrega', 'fb_falei', 'fb_ouvi', 'fb_dev'] as const;

export const aplica = (c: Campos, patch: Patch) => {
  Object.entries(patch).forEach(([k, v]) => { if (v === '') delete c[k]; else c[k] = v; });
};

export const nomeDe = (c: Campos, i: number) => (c[chaveNome(i)] ?? '').trim();
/** nome sem o asterisco do processo seletivo */
export const nomeLimpo = (c: Campos, i: number) => nomeDe(c, i).replace(/\*/g, '').trim();

const temFicha = (c: Campos, i: number) => FICHA_CAMPOS.some((k) => (c[chaveFicha(i, k)] ?? '').trim() !== '');

/** Cadeiras ativas, em ordem. Sem m2.on (mandato da versão antiga), deriva: a Chefia e toda cadeira com nome ou ficha. */
export function ativas(c: Campos): number[] {
  const bruto = c[CHAVE_ON];
  const base = bruto !== undefined
    ? lista(bruto).map(Number).filter((n) => Number.isInteger(n) && n >= 0)
    : Array.from({ length: N_BASE }, (_, i) => i).filter((i) => nomeDe(c, i) !== '' || temFicha(c, i));
  return [...new Set([CHEFIA, ...base])].sort((a, b) => a - b);
}

export const coordDe = (c: Campos, i: number): string =>
  (c[chaveFicha(i, 'coord')] ?? '') || PADRAO[i]?.coord || SEM_AREA;

/** Liderança imediata: valor gravado, ou o padrão; sobe até a cadeira ativa mais próxima. null = topo. */
export function liderDe(c: Campos, i: number): number | null {
  const ativa = new Set(ativas(c));
  let atual = i;
  for (let passo = 0; passo < 60; passo++) {
    const v = c[chaveFicha(atual, 'lider')] ?? '';
    const p = v === '-' ? null : v !== '' ? Number(v) : (PADRAO[atual]?.lider ?? null);
    if (p === null || Number.isNaN(p) || p === i) return null;
    if (ativa.has(p)) return p;
    atual = p;
  }
  return null;
}

export { SEP };
