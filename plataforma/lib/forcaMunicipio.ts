/* Números do cartão de município do partido (Missão 1, pergunta 2.2; PAR-05 e PAR-06): vereadores, filiados e % de
   votos do partido no município e no estado, para o cargo da liderança. Regra pura, compartilhada com o seletor de dados. */
import type { CasaChave, FiliadosUF, Mun, MunUF } from './types.ts';
import type { MunPartido } from './dadosPartido.ts';

/** Votos do partido no cargo da liderança: de um município (`pctMun`) ou do estado inteiro (`pctEstado`). */
const blocoDe = (m: Mun | undefined, casa: CasaChave | null) => (m && casa ? m[casa === 'senado' ? 'senador' : casa] : undefined);

/** % dos votos do cargo no município que foram do partido; null sem votação do cargo (ou sem casa). */
export function pctMun(m: Mun | undefined, casa: CasaChave | null, partido: string): number | null {
  const b = blocoDe(m, casa);
  return b?.v ? ((b.p.find((q) => q[0] === partido)?.[1] ?? 0) / b.v) * 100 : null;
}

/** % dos votos do cargo no estado (soma dos municípios com votação) que foram do partido. */
export function pctEstado(muns: Record<string, Mun> | undefined, casa: CasaChave | null, partido: string): number | null {
  let v = 0, n = 0;
  for (const m of Object.values(muns ?? {})) {
    const b = blocoDe(m, casa);
    if (!b?.v) continue;
    v += b.v;
    n += b.p.find((q) => q[0] === partido)?.[1] ?? 0;
  }
  return v ? (n / v) * 100 : null;
}

/** Números do município que o seletor de dados e o cartão compartilham. */
export function numerosMun(it: { cdi: string; nome: string }, munUF: MunUF | undefined, fil: FiliadosUF | undefined, casa: CasaChave | null, partido: string): MunPartido & { vereadoresTotal: number } {
  const m = munUF?.mun[it.cdi];
  const el = m?.m24?.ver.el ?? {};
  return {
    cdi: it.cdi, nome: m?.nm ?? it.nome,
    vereadoresPartido: el[partido] ?? 0,
    vereadoresTotal: Object.values(el).reduce((a, b) => a + b, 0),
    filiados: fil?.mun[it.cdi]?.[partido]?.[0] ?? 0,
    pct: pctMun(m, casa, partido),
  };
}
