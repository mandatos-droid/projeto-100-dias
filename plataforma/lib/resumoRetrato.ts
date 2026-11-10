/* Retrato do mandato no cabeçalho do Resumo do preenchimento (RES-06): lógica pura, sem DOM nem React.
   A ilha ResumoRetrato (ilhas/ResumoRetrato.tsx) só desenha o que sai daqui. */
import { nf } from './format.ts';

export type Candidatura = { sq?: string | number | null; uf?: string | null; cargo?: string | null };

/** Foto da candidatura no TSE, pela mesma URL de ResumoIlhas.foto (public/legacy/novos.js): eleição municipal de 2024
 *  para prefeito e vereador, 2026 para os demais cargos. Sem `sq` não há foto. */
export function fotoUrl(t: Candidatura): string | null {
  if (t.sq == null || String(t.sq).trim() === '') return null;
  const base = /prefeit|vereador/i.test(t.cargo ?? '') ? 'ele2024/619' : 'ele2026/6259';
  return `https://resultados.tse.jus.br/oficial/${base}/fotos/${String(t.uf ?? '').toLowerCase()}/${String(t.sq).trim()}.jpeg`;
}

/** Primeira letra visível do nome, em maiúscula ("Ângela" → "Â"); espaço e emoji no início são pulados; sem letra, "?". */
export function inicial(nome: string | null | undefined): string {
  const l = String(nome ?? '').normalize('NFC').match(/\p{L}\p{M}*/u);
  return l ? l[0].toLocaleUpperCase('pt-BR') : '?';
}

/** Número em pt-BR ("97.335"). Com `mil`, a partir de 10.000 vira milhares inteiros com "+" ("112 mil+"), como os filiados. */
export function abrevia(n: number, mil = false): string {
  return mil && n >= 10000 ? `${nf.format(Math.floor(n / 1000))} mil+` : nf.format(n);
}

/** Legenda da votação: "57º mais votado(a) · SP · TSE"; sem posição, sem legenda. */
export function legendaPos(pos: number | null | undefined, uf: string | null | undefined): string {
  if (!pos) return '';
  return [`${pos}º mais votado(a)`, uf, 'TSE'].filter(Boolean).join(' · ');
}

/** Legenda dos cargos da equipe: "1 processo seletivo a abrir", "3 processos seletivos a abrir"; sem processo, vazio. */
export function legendaVagas(k: number): string {
  if (!k) return '';
  return k === 1 ? '1 processo seletivo a abrir' : `${k} processos seletivos a abrir`;
}

/** O que a ilha sabe de cada fonte. `undefined`/`null` = fonte indisponível (sem dado ou carga que falhou). */
export type EntradaRetrato = {
  tse?: { votos?: number | null; pos?: number | null; uf?: string | null } | null;
  partido?: string | null;
  uf?: string | null;
  casa?: string | null;      // nome da Casa no rótulo das cadeiras
  cadeiras?: number | null;  // cadeiras do partido na Casa do mandato
  filiados?: number | null;  // filiados do partido na UF do mandato
  equipe?: { comNome: number; ativas: number; vagas: number } | null;
};
export type Numero = { id: 'votos' | 'cadeiras' | 'filiados' | 'equipe'; valor: string; rotulo: string; legenda: string };

const ok = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n);

/** Os números do cabeçalho, na ordem da spec, só os que têm fonte (RES-06.4 a 06.8). Sem nenhum, lista vazia. */
export function numeros(e: EntradaRetrato): Numero[] {
  const r: Numero[] = [];
  const t = e.tse;
  if (t && ok(t.votos)) r.push({ id: 'votos', valor: abrevia(t.votos), rotulo: 'Votos válidos', legenda: legendaPos(t.pos, t.uf ?? e.uf) });
  if (e.partido && e.casa && ok(e.cadeiras)) r.push({ id: 'cadeiras', valor: nf.format(e.cadeiras), rotulo: `Cadeiras do ${e.partido} na ${e.casa}`, legenda: '' });
  if (e.partido && e.uf && ok(e.filiados)) r.push({ id: 'filiados', valor: abrevia(e.filiados, true), rotulo: `Filiados do ${e.partido} em ${e.uf}`, legenda: '' });
  if (e.equipe && e.equipe.ativas > 0) r.push({ id: 'equipe', valor: `${e.equipe.comNome}/${e.equipe.ativas}`, rotulo: 'Cargos da equipe com nome', legenda: legendaVagas(e.equipe.vagas) });
  return r;
}
