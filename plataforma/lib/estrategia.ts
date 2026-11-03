/* Missão 3 · estratégia dos Objetivos Estratégicos (A/B/C) e justificativas dos preditores.
   Funções puras sobre D.campos: ler não altera nada; operar devolve um Patch (valor vazio apaga a chave, como em useRumo.setCampos).
   A estratégia só decide o TEXTO que objetivos() devolve; a árvore do planejamento e as metas não mudam (RM3-16).
   Dados: m3.est ('a'|'b'|'c'), m3.just.{pid}; m3.obj.{pid} guarda a frase da opção B e nunca é apagado ao trocar (RM3-17). */
import { PREDITORES, MAX_PREDITORES } from './plano.ts';

export type Campos = Record<string, string>;
export type Patch = Record<string, string>;
export type Estrategia = 'a' | 'b' | 'c';

/** Os 3 Objetivos Estratégicos sugeridos pela Legisla (opção C): só referência, nunca viram nós da árvore (D11). */
export const OBJETIVOS_LEGISLA: string[] = [
  'Avanço Legislativo',
  'Expansão de Capital Político e Influência',
  'Governança Estratégica',
];

const chaveObj = (pid: string) => `m3.obj.${pid}`;
const chaveJust = (pid: string) => `m3.just.${pid}`;
const lido = (c: Campos | undefined, k: string) => (c?.[k] ?? '').trim();
const nomeDe = (pid: string) => PREDITORES.find((p) => p.id === pid)?.n ?? pid;

/** Estratégia vigente. Sem m3.est: 'b' se há frase em m3.obj.*, senão 'a' se há preditores, senão null (RMX-01).
    Valor gravado inválido vale null. `escolhidos` são os ids de D.preditores. */
export function lerEstrategia(c: Campos | undefined, escolhidos: string[] = []): Estrategia | null {
  const bruto = c?.['m3.est'];
  if (bruto !== undefined && bruto !== '') return bruto === 'a' || bruto === 'b' || bruto === 'c' ? bruto : null;
  if (PREDITORES.some((p) => lido(c, chaveObj(p.id)) !== '')) return 'b';
  return escolhidos.length ? 'a' : null;
}

/** Patch que grava a estratégia. Não toca em m3.obj.*: o texto da opção anterior fica guardado. */
export function defineEstrategia(_c: Campos | undefined, e: Estrategia): Patch {
  return { 'm3.est': e };
}

/** Texto do nó do preditor: A e C = nome do preditor; B = frase de m3.obj.{pid}, ou o nome se vazia. */
export function textoObjetivo(c: Campos | undefined, pid: string, e: Estrategia | null): string {
  return (e === 'b' ? lido(c, chaveObj(pid)) : '') || nomeDe(pid);
}

export const lerJustificativa = (c: Campos | undefined, pid: string): string => lido(c, chaveJust(pid));

/** Patch que grava a justificativa de um preditor (escolhido ou não). Texto vazio apaga a chave. */
export function defineJustificativa(_c: Campos | undefined, pid: string, v: string): Patch {
  return { [chaveJust(pid)]: v.trim() };
}

/** Quantas das 5 justificativas ainda estão vazias. */
export const faltamJustificativas = (c: Campos | undefined): number => PREDITORES.filter((p) => lerJustificativa(c, p.id) === '').length;

/** Passo fechado: 3 preditores, estratégia, 3 frases se B e as 5 justificativas. Só indicador, nunca bloqueia (RM3-06). */
export function passoPreditoresConcluido(c: Campos | undefined, escolhidos: string[]): boolean {
  if (escolhidos.length !== MAX_PREDITORES) return false;
  const e = lerEstrategia(c, escolhidos);
  if (!e) return false;
  if (e === 'b' && escolhidos.some((pid) => lido(c, chaveObj(pid)) === '')) return false;
  return faltamJustificativas(c) === 0;
}
