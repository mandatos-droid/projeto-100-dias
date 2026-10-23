'use client';
/* Missão 3 · metas agrupadas por objetivo específico, com retorno SMART, responsável e apoios (CartaoMeta).
   Estado: D.metas (campos antigos pred, texto, resp, apoio preservados). */
import { MAX_METAS_POR_OBJETIVO, METAS_MAX, METAS_MIN, contagemMetas, podeAcrescentarMeta } from '@/lib/plano';
import CartaoMeta from './CartaoMeta';
import { useRumo } from './useRumo';
import './rumo.css';

export default function Metas() {
  const { d, c, arv, objetivos, pessoas, addMeta, setMeta, rmMeta } = useRumo();
  const { n, faixa } = contagemMetas(d);
  const podeMover = (pid: string) => { const r = podeAcrescentarMeta(d, pid); return r.ok ? null : r.motivo ?? ''; };
  const remove = (idx: number) => {
    const t = String((d.metas as { texto?: string }[])[idx]?.texto ?? '').trim();
    if (t && !window.confirm('Remover esta meta? O texto dela será apagado.')) return;
    rmMeta(idx);
  };
  const cartao = (m: (typeof arv.semObjetivo)[number]) => (
    <CartaoMeta key={m.idx} meta={m} objetivos={objetivos} pessoas={pessoas} campos={c} podeMover={podeMover} onChange={setMeta} onRemove={remove} />
  );

  return (
    <div className="ilha-corpo rm-metas" data-n-metas={n}>
      <p className={`contador ${faixa === 'ok' ? 'ok' : 'falta'}`} role="status">
        {n} {n === 1 ? 'meta' : 'metas'}
        {faixa === 'abaixo' && ` · o Guia pede de ${METAS_MIN} a ${METAS_MAX}`}
        {faixa === 'acima' && ` · o Guia pede de ${METAS_MIN} a ${METAS_MAX}; revise e aglutine as parecidas`}
        {faixa === 'ok' && ` · dentro da faixa do Guia (${METAS_MIN} a ${METAS_MAX})`}
      </p>

      {!objetivos.length && (
        <div className="rm-bloqueio">
          <button type="button" className="bt sec peq" disabled>Acrescentar meta</button>
          <p className="rm-dica">Escolha os preditores na etapa anterior antes de escrever as metas. <a href="#/m/3/m3.preditores">Ir para os preditores</a></p>
        </div>
      )}

      {arv.objetivos.map((o) => (
        <section key={o.pid} className="rm-obj-grupo" aria-labelledby={`rm-og-${o.pid}`} data-objetivo={o.pid}>
          <h4 id={`rm-og-${o.pid}`}>
            <span className="rm-no-tag obj">{o.nome}</span>
            {o.texto}
            <span className="rm-n">{o.metas.length} de {MAX_METAS_POR_OBJETIVO} metas</span>
          </h4>
          {!o.metas.length && <p className="rm-vazio">Nenhuma meta neste objetivo ainda.</p>}
          {o.metas.map(cartao)}
          <button type="button" className="bt sec peq" aria-label={`Acrescentar meta a ${o.texto}`} onClick={() => addMeta(o.pid)}>Acrescentar meta</button>
        </section>
      ))}

      {arv.semObjetivo.length > 0 && (
        <section className="rm-obj-grupo sem" aria-labelledby="rm-og-sem" data-objetivo="sem">
          <h4 id="rm-og-sem">Metas sem objetivo <span className="rm-n">{arv.semObjetivo.length}</span></h4>
          <p className="rm-alerta" role="note">Estas metas não estão ligadas a um objetivo específico. Escolha o objetivo em cada uma; nada foi apagado.</p>
          {arv.semObjetivo.map(cartao)}
        </section>
      )}
    </div>
  );
}
