/* Missão 2 · o que a plataforma sugere marcar no checklist (m2.c1..c3). Só sugere: quem marca é o usuário. */
import { CHEFIA, ativas, liderDe, nomeLimpo, type Campos } from './cadeiras.ts';
import { chaveFicha, lista } from './equipe.ts';
import { gerarRotinas, rotinasDesligadas } from './rotinas.ts';

export type Sugestao = { c1: boolean; c2: boolean; c3: boolean };

export function sugestaoChecklist(c: Campos): Sugestao {
  const on = ativas(c);
  const comNome = on.filter((i) => nomeLimpo(c, i) !== '');
  const c1 = comNome.length > 0 && comNome.every((i) => lista(c[chaveFicha(i, 'escopo')]).length > 0);
  const c2 = on.some((i) => i !== CHEFIA && liderDe(c, i) === CHEFIA);
  const ativasTipos = new Set(gerarRotinas(c).map((r) => r.tipo));
  const geradas = new Set([...ativasTipos, ...rotinasDesligadas(c).map((r) => r.tipo)]);
  const c3 = geradas.size > 0 && [...geradas].every((t) => ativasTipos.has(t));
  return { c1, c2, c3 };
}
