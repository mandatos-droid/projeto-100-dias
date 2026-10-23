/* Missão 2 · estado das cadeiras do gabinete (quem está ativa, de que área, quem lidera quem).
   Funções puras sobre D.campos (Record<string,string>): ler não altera nada; operar devolve um Patch.
   Mantém as chaves antigas (m2.f{n} nome, m2.p{n}.* ficha) para o painel, o Resumo e a nuvem seguirem lendo. */
import { COORDENACOES, PADRAO, SEP, chaveFicha, chaveNome, lista } from './equipe.ts';

export type Campos = Record<string, string>;
/** chave → valor; '' apaga a chave */
export type Patch = Record<string, string>;

export const CHAVE_COORDS = 'm2.coords';   // áreas marcadas (SEP)
export const CHAVE_ON = 'm2.on';           // índices das cadeiras ativas (SEP); 20 em diante = acrescentadas à mão
export const chaveArq = (i: number) => `m2.arq.${i + 1}`; // cópia JSON {nome, ficha} de cadeira retirada
export const N_BASE = 20;
export const MAX_CADEIRAS = 40;                  // cadeiras do modelo original (CARGOS_EQUIPE)
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

const ficha = (c: Campos, i: number) => Object.fromEntries(
  FICHA_CAMPOS.map((k) => [k, (c[chaveFicha(i, k)] ?? '')] as const).filter(([, v]) => v.trim() !== ''));
const grava = (ids: number[]) => [...new Set(ids)].sort((a, b) => a - b).join(SEP);

/** Áreas marcadas, na ordem de AREAS. Sem m2.coords (mandato antigo), deriva das cadeiras ativas. */
export function coordsDe(c: Campos): string[] {
  const bruto = c[CHAVE_COORDS];
  const marcadas = bruto !== undefined ? lista(bruto) : ativas(c).map((i) => coordDe(c, i));
  return AREAS.filter((a) => marcadas.includes(a));
}

/** Cadeiras que o modelo sugere para a área (índices do modelo, sem a Chefia). */
export const sugeridasDaArea = (coord: string): number[] =>
  PADRAO.map((p, i) => (i !== CHEFIA && p.coord === coord ? i : -1)).filter((i) => i >= 0);

/** Patch que tira a cadeira: guarda cópia em m2.arq.{n} (se tinha nome ou ficha), apaga nome e ficha e repassa
 *  quem ela liderava para a liderança dela. Não mexe em m2.on: quem chama decide. */
function retira(c: Campos, i: number): Patch {
  const patch: Patch = {};
  const nome = nomeDe(c, i), f = ficha(c, i);
  if (nome !== '' || Object.keys(f).length) patch[chaveArq(i)] = JSON.stringify({ nome, ficha: f });
  patch[chaveNome(i)] = '';
  FICHA_CAMPOS.forEach((k) => { patch[chaveFicha(i, k)] = ''; });
  const acima = liderDe(c, i);
  ativas(c).forEach((j) => {
    if (j === i) return;
    const bruto = c[chaveFicha(j, 'lider')] ?? '';
    const aponta = bruto !== '' ? Number(bruto) === i : PADRAO[j]?.lider === i;
    if (aponta) patch[chaveFicha(j, 'lider')] = acima === null ? '-' : String(acima);
  });
  return patch;
}

/** Marcar ou desmarcar uma área. Ao desmarcar, se alguma cadeira dela tem nome, devolve `confirma` com os nomes:
 *  quem chama pede confirmação antes de aplicar o patch (as cadeiras com nome vão para Sem área). */
export function alternaArea(c: Campos, coord: string, ligar: boolean): { patch: Patch; confirma?: string[] } {
  const coords = coordsDe(c), on = ativas(c);
  if (ligar) {
    return { patch: {
      [CHAVE_COORDS]: AREAS.filter((a) => a === coord || coords.includes(a)).join(SEP),
      [CHAVE_ON]: grava([...on, ...sugeridasDaArea(coord)]),
    } };
  }
  const daArea = on.filter((i) => i !== CHEFIA && coordDe(c, i) === coord);
  const comNome = daArea.filter((i) => nomeLimpo(c, i) !== '');
  const patch: Patch = {
    [CHAVE_COORDS]: coords.filter((a) => a !== coord).join(SEP),
    [CHAVE_ON]: grava(on.filter((i) => !daArea.includes(i) || comNome.includes(i))),
  };
  /* retira uma a uma, sobre uma cópia que já reflete as saídas anteriores: assim quem era liderado por uma cadeira
     removida sobe até a cadeira mais próxima que fica, mesmo com várias removidas em cadeia */
  const copia: Campos = { ...c, [CHAVE_ON]: grava(on) };
  daArea.filter((i) => !comNome.includes(i)).forEach((i) => {
    const p = retira(copia, i);
    Object.assign(patch, p);
    aplica(copia, p);
    copia[CHAVE_ON] = grava(ativas(copia).filter((j) => j !== i));
  });
  comNome.forEach((i) => { patch[chaveFicha(i, 'coord')] = SEM_AREA; });
  return comNome.length ? { patch, confirma: comNome.map((i) => nomeLimpo(c, i)) } : { patch };
}

/** Define a liderança imediata. Se criaria um ciclo, devolve `ciclo` (da cadeira até quem a lideraria de volta) e nenhum patch. */
export function defineLider(c: Campos, i: number, novo: number | null): { patch?: Patch; ciclo?: number[] } {
  if (novo === null) return { patch: { [chaveFicha(i, 'lider')]: '-' } };
  const subida = [novo];
  for (let p: number | null = novo; p !== null && p !== i && subida.length < 60; subida.push(p)) {
    p = liderDe(c, p);
    if (p === null) break;
  }
  if (novo === i || subida.includes(i)) return { ciclo: novo === i ? [i] : [i, ...subida.slice(0, subida.indexOf(i)).reverse()] };
  return { patch: { [chaveFicha(i, 'lider')]: String(novo) } };
}

/** Acrescenta uma cadeira: reativa a do modelo (`modelo`) ou cria a de índice livre 20+, na área e sob a liderança dadas. */
export function acrescenta(c: Campos, o: { modelo?: number; area?: string; sob?: number }): { patch: Patch; erro?: string } {
  const on = ativas(c);
  if (on.length >= MAX_CADEIRAS) return { patch: {}, erro: `O gabinete pode ter no máximo ${MAX_CADEIRAS} cadeiras.` };
  let i = o.modelo;
  if (i === undefined || on.includes(i)) { i = N_BASE; while (on.includes(i)) i++; }
  const patch: Patch = { [CHAVE_ON]: grava([...on, i]) };
  if (i >= N_BASE || o.area) patch[chaveFicha(i, 'coord')] = o.area ?? SEM_AREA;
  if (o.sob !== undefined) patch[chaveFicha(i, 'lider')] = String(o.sob);
  else if (i >= N_BASE) patch[chaveFicha(i, 'lider')] = '-';
  return { patch };
}

/** Remove a cadeira (a Chefia não sai). Com nome, devolve `confirma`; quem chama pergunta antes de aplicar. */
export function remove(c: Campos, i: number): { patch: Patch; erro?: string; confirma?: string[] } {
  if (i === CHEFIA) return { patch: {}, erro: 'A Chefia de gabinete é obrigatória e não pode ser removida.' };
  const patch: Patch = { ...retira(c, i), [CHAVE_ON]: grava(ativas(c).filter((j) => j !== i)) };
  return nomeLimpo(c, i) !== '' ? { patch, confirma: [nomeLimpo(c, i)] } : { patch };
}

/** O modelo original: as 6 áreas e as 20 cadeiras (mantém as acrescentadas à mão). */
export const modeloCompleto = (c: Campos): Patch => ({
  [CHAVE_COORDS]: AREAS.join(SEP),
  [CHAVE_ON]: grava([...ativas(c), ...Array.from({ length: N_BASE }, (_, i) => i)]),
});

export { SEP };
