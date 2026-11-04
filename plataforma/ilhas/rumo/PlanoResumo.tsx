'use client';
/* Missão 3 · resumo do planejamento no Painel do mandato (no lugar de "Últimos registros"): manchete, atingimento total e barra por objetivo. */
import { pctObjetivo, pctTotal } from '@/lib/atingimento';
import { pctTxt } from './ArvorePlano';
import { Anel } from './Plano';
import { useRumo } from './useRumo';
import './rumo.css';

export default function PlanoResumo() {
  const { arv } = useRumo();
  const pcts = arv.objetivos.map((o) => pctObjetivo(o.metas));
  const existe = arv.objetivos.some((o) => o.metas.length > 0);
  const manchete = arv.legado.trim();

  if (!existe) {
    return (
      <section className="ilha-corpo rm-resumo vazio" aria-labelledby="rm-res-t">
        <h2 id="rm-res-t">Planejamento Estratégico</h2>
        <p>O rumo do mandato aparece aqui: o Legado, os objetivos e o atingimento das metas. Ele nasce quando você conclui a Missão 3 e escreve ao menos uma meta.</p>
        <a className="bt pri" href="#/m/3">Ir para a Missão 3</a>
      </section>
    );
  }
  return (
    <section className="ilha-corpo rm-resumo" aria-labelledby="rm-res-t">
      <h2 id="rm-res-t">Planejamento Estratégico</h2>
      <div className="rm-res-topo">
        <Anel pct={pctTotal(pcts)} />
        <div className="rm-res-leg">
          <p className="rm-res-et">Legado do mandato</p>
          <p className={`rm-res-manchete${manchete ? '' : ' vazia'}`}>{manchete || 'A manchete do Legado ainda não foi escrita.'}</p>
          <a className="bt sec peq" href="#/plano">Abrir o planejamento</a>
        </div>
      </div>
      <ul className="rm-res-objs" aria-label="Atingimento por objetivo">
        {arv.objetivos.map((o, i) => (
          <li key={o.pid} data-objetivo={o.pid}>
            <span className="rm-res-nome">{o.texto}<small>{o.metas.length} {o.metas.length === 1 ? 'meta' : 'metas'}</small></span>
            <span className="rm-no-barra" role="progressbar" aria-label={`Atingimento do objetivo ${o.texto}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pcts[i] ?? undefined} aria-valuetext={pctTxt(pcts[i])}>
              <i style={{ width: `${pcts[i] ?? 0}%` }} />
            </span>
            <b className="rm-res-pct">{pctTxt(pcts[i])}</b>
          </li>
        ))}
      </ul>
    </section>
  );
}
