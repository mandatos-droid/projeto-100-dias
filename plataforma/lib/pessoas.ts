/* Missão 3 · quem pode ser responsável ou apoio de uma meta: as cadeiras ativas com nome da Missão 2.
   A meta guarda o índice da cadeira (respCad, apoioCad) e uma cópia do nome (resp, apoio) para o legado e o Resumo.
   O nome em `apoio` vem separado por "; ": primeiro os das cadeiras (na ordem de apoioCad), depois o texto livre. */
import { ativas, coordDe, nomeLimpo } from './cadeiras.ts';
import type { Campos } from './cadeiras.ts';
import { chaveFicha } from './equipe.ts';
import type { Meta } from './rumo.ts';

export const MAX_APOIOS = 3;
export interface Pessoa { cad: number; nome: string; cargo: string; area: string }
/** Pessoa escolhida: da Missão 2 (cad) ou texto livre (só nome). */
export interface Ref { cad?: number | null; nome: string }

/** Cadeiras ativas com nome. `nomesModelo` (CARGOS_EQUIPE) dá o cargo quando a ficha não tem nome_cargo. */
export function pessoas(c: Campos, nomesModelo: string[] = []): Pessoa[] {
  return ativas(c).filter((i) => nomeLimpo(c, i) !== '').map((i) => ({
    cad: i, nome: nomeLimpo(c, i),
    cargo: (c[chaveFicha(i, 'nome_cargo')] ?? '').trim() || nomesModelo[i] || '',
    area: coordDe(c, i),
  }));
}

/** Nome atual da cadeira, ou null se ela saiu da equipe ou ficou sem nome. */
const atual = (c: Campos, cad: number) => (ativas(c).includes(cad) ? nomeLimpo(c, cad) || null : null);
const partes = (t?: string) => (t ?? '').split(';').map((s) => s.trim()).filter(Boolean);

/** Responsável e apoios para exibir: nome atual da cadeira; se ela some, o nome gravado e `foraDaEquipe`. */
export function resolve(c: Campos, m: Partial<Meta>): { resp: string; foraDaEquipe: boolean; apoios: string[]; fora: string[] } {
  const fora: string[] = [];
  let resp = (m.resp ?? '').trim();
  if (typeof m.respCad === 'number') {
    const nome = atual(c, m.respCad);
    if (nome) resp = nome; else if (resp) fora.push(resp);
  }
  const gravados = partes(m.apoio);
  const cads = m.apoioCad ?? [];
  const apoios = cads.map((cad, i) => {
    const nome = atual(c, cad);
    if (nome) return nome;
    const g = gravados[i] ?? `Cadeira ${cad + 1}`;
    fora.push(g);
    return g;
  });
  // sem vínculo com cadeira, o texto livre antigo vale inteiro (pode ter "e" ou vírgulas dentro de um só campo)
  const livres = cads.length ? gravados.slice(cads.length) : (m.apoio ?? '').trim() ? [(m.apoio ?? '').trim()] : [];
  return { resp, foraDaEquipe: fora.length > 0, apoios: [...apoios, ...livres], fora };
}

const igual = (a: Ref, b: Ref) => {
  const n = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  if (typeof a.cad === 'number' && a.cad === b.cad) return true;
  return n(a.nome) !== '' && n(a.nome) === n(b.nome);
};

/** Mensagem de recusa, ou null se está certo: no máximo 3 apoios e nenhum igual ao responsável. */
export function validaApoio(resp: Ref, apoios: Ref[]): string | null {
  if (apoios.length > MAX_APOIOS) return `Escolha no máximo ${MAX_APOIOS} pessoas de apoio.`;
  if (apoios.some((a) => igual(resp, a))) return 'O apoio precisa ser diferente do responsável direto.';
  return null;
}
