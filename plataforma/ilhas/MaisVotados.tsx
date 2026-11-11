'use client';
import { useMemo } from 'react';
import { carregaGeo } from '@/lib/dados';
import { cincoMais } from '@/lib/maisVotados';
import { nf, pct } from '@/lib/format';
import type { CasaChave } from '@/lib/types';
import { useLegado } from './ponte';
import { useCarga } from './pecas';

export type VotosMun = { atualizado: string; mun: Record<string, [number, number]> };

const CASAS: CasaChave[] = ['federal', 'estadual', 'senado'];
export const MSG_MAIS_VOTADOS = 'Não foi possível carregar os municípios mais votados agora.';

async function buscaVotos(uf: string, casa: CasaChave, sq: string): Promise<VotosMun> {
  const r = await fetch(`/api/votos-mun?uf=${uf.toLowerCase()}&casa=${casa}&sq=${sq}`);
  if (!r.ok) throw new Error(MSG_MAIS_VOTADOS);
  return r.json();
}

/** Votos da candidatura por município (formato de /api/votos-mun). Sem candidatura, não consulta. */
export function useVotosMun(uf: string, casa: CasaChave | null, sq: string | null) {
  const ok = !!uf && !!casa && !!sq;
  return useCarga(ok ? () => buscaVotos(uf, casa!, sq!) : null, `${uf}${casa}${sq}`);
}

/** Os 5 municípios em que a liderança teve mais votos (pergunta 1.2). Só para candidatura 2026. */
export default function MaisVotados() {
  const { D, m } = useLegado();
  const t = D.tse as { sq?: string; casa?: string; uf?: string };
  const casa = CASAS.find((c) => c === t.casa) ?? null; // vereador (2024) e sem vínculo ficam de fora
  const uf = t.uf || m.uf;
  const votos = useVotosMun(uf, casa, t.sq ?? null);
  const geo = useCarga(casa && uf ? () => carregaGeo(uf) : null, `geo${uf}`);

  const lista = useMemo(() => {
    if (!votos.dados) return null;
    const nomes = new Map((geo.dados?.mun ?? []).map((x) => [x.id, x.nm]));
    return cincoMais(votos.dados.mun, nomes);
  }, [votos.dados, geo.dados]);

  if (!casa || !t.sq) return null;
  if (votos.erro || (lista && lista.length === 0)) return <div className="erro-cx" role="status">{MSG_MAIS_VOTADOS}</div>;
  if (!lista || geo.carregando) return <p className="sem" role="status">Buscando os municípios mais votados…</p>;

  return (
    <section className="mv5" aria-labelledby="mv5-t">
      <h4 id="mv5-t">Municípios mais votados</h4>
      <ol className="mv5-lista">
        {lista.map((l) => (
          <li className="mv5-cartao" key={l.cdi}>
            <span className="mv5-pos" aria-label={`${l.pos}º lugar`}>{l.pos}º</span>
            <strong className="mv5-nome">{l.nome}</strong>
            <span className="mv5-votos">{nf.format(l.votos)} votos</span>
            <span className="peq-t mv5-pct">{pct(l.pct)} dos votos válidos</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
