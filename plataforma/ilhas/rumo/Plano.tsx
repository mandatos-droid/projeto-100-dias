'use client';
/* Missão 3 · aba Planejamento Estratégico: árvore Legado → objetivos → metas, com status por meta e atingimento por objetivo e total.
   Lê e grava os mesmos dados do exercício (D.metas, D.preditores, D.rumo). */
import { pctObjetivo, pctTotal } from '@/lib/atingimento';
import ArvorePlano, { pctTxt } from './ArvorePlano';
import { useRumo } from './useRumo';
import './rumo.css';

function Anel({ pct }: { pct: number | null }) {
  const r = 42, c = 2 * Math.PI * r;
  return (
    <div className="rm-anel" role="img" aria-label={pct === null ? 'Atingimento total do planejamento: ainda sem metas ativas' : `Atingimento total do planejamento: ${pct}%`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="fundo" />
        <circle cx="50" cy="50" r={r} className="valor" strokeDasharray={`${(c * (pct ?? 0)) / 100} ${c}`} transform="rotate(-90 50 50)" />
      </svg>
      <b data-total={pct ?? ''}>{pctTxt(pct)}</b>
    </div>
  );
}

export default function Plano() {
  const { arv, setMeta } = useRumo();
  const total = pctTotal(arv.objetivos.map((o) => pctObjetivo(o.metas)));
  const vazio = !arv.objetivos.some((o) => o.metas.length > 0);
  const nMetas = arv.objetivos.reduce((s, o) => s + o.metas.length, 0) + arv.semObjetivo.length;

  return (
    <div className="ilha-corpo rm-plano" data-n-metas={nMetas}>
      {vazio && (
        <div className="rm-plano-vazio">
          <h4>O planejamento ainda não tem metas</h4>
          <p>Ele aparece aqui assim que um preditor tiver ao menos uma meta. Escolha os preditores e escreva as metas na Missão 3.</p>
          <a className="bt pri" href="#/m/3/m3.preditores">Ir para a Missão 3</a>
        </div>
      )}
      {(!vazio || arv.semObjetivo.length > 0) && (
        <>
          <div className="rm-plano-topo">
            <Anel pct={total} />
            <div>
              <p className="rm-plano-t">Atingimento total</p>
              <p className="rm-dica">Média simples dos objetivos que têm ao menos uma meta ativa. Meta congelada fica fora da conta; meta sem status vale 0.</p>
            </div>
          </div>
          <ArvorePlano modo="plano" arv={arv} opcoes={{ onStatus: (idx, status) => setMeta(idx, { status }) }} />
        </>
      )}
    </div>
  );
}
