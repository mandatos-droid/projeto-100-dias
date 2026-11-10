import type { MandatoDaPessoa, Usuario } from '../../app/mandato/contexto.ts';
import { PAPEIS, type Papel } from '../convites/papeis.ts';

/* O mandato aberto no Guia (Store.mandato, Store.membros, Store.usuario em nucleo.js) no formato que as telas de
   app/mandato/ leem por useMandato(). O papel é o da linha da própria pessoa em `membros`, como na trava de leitura do
   Guia (acesso.js): sem essa linha, ou com papel desconhecido, não há papel e a tela não libera nada. */

/** Mensagem da aba quando o contexto não monta (AMA-02.10). */
export const ERRO_CARREGAR = 'Não foi possível carregar. Tente de novo.';

export type FaltaNoGuia = 'sem-usuario' | 'sem-mandato' | 'sem-membros' | 'sem-papel';
export type MandatoDoGuia = { ok: true; mandato: MandatoDaPessoa; usuario: Usuario } | { ok: false; falta: FaltaNoGuia };

const texto = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const objeto = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

export function mandatoDoGuia(mandato: unknown, membros: unknown, usuario: unknown): MandatoDoGuia {
  const u = objeto(usuario);
  if (!u || !texto(u.id)) return { ok: false, falta: 'sem-usuario' };
  const m = objeto(mandato);
  if (!m || !texto(m.id)) return { ok: false, falta: 'sem-mandato' };
  if (!Array.isArray(membros)) return { ok: false, falta: 'sem-membros' };
  const eu = membros.map(objeto).find((x) => x?.user_id === u.id);
  const papel = eu?.papel;
  if (!PAPEIS.includes(papel as Papel)) return { ok: false, falta: 'sem-papel' };
  return {
    ok: true,
    usuario: { id: u.id as string, email: texto(u.email) },
    mandato: {
      id: m.id as string,
      papel: papel as Papel,
      nome_parlamentar: texto(m.nome_parlamentar),
      cargo: texto(m.cargo),
      uf: texto(m.uf),
      partido: texto(m.partido),
      data_posse: texto(m.data_posse),
      dados: objeto(m.dados),
    },
  };
}
