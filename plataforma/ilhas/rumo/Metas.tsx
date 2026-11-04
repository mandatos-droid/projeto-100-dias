'use client';
/* Missão 3 · metas agrupadas por objetivo estratégico, com retorno SMART, responsável e apoios (CartaoMeta).
   Estado: D.metas (campos antigos pred, texto, resp, apoio preservados). */
import { MAX_METAS_POR_OBJETIVO, METAS_MAX, METAS_MIN, contagemMetas, podeAcrescentarMeta } from '@/lib/plano';
import { useState } from 'react';
import ArvorePlano from './ArvorePlano';
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
    setEditando(null);
  };
  const [editando, setEditando] = useState<number | null>(null);
  const acrescenta = (pid: string) => { const prox = (d.metas as unknown[]).length; addMeta(pid); setEditando(prox); };
  const opcoes = {
    onStatus: () => {}, leitura: true,
    extraObjetivo: (pid: string) => (
      <button type="button" className="bt sec peq" aria-label={`Acrescentar meta a ${objetivos.find((o) => o.pid === pid)?.texto ?? pid}`} onClick={() => acrescenta(pid)}>Acrescentar meta</button>
    ),
    extra: (m: (typeof arv.semObjetivo)[number]) => (
      <>
        <button type="button" className="rm-link" aria-expanded={editando === m.idx} aria-label={`${editando === m.idx ? 'Fechar a edição da' : 'Editar a'} meta ${String(m.idx + 1).padStart(2, '0')}`}
          onClick={() => setEditando(editando === m.idx ? null : m.idx)}>{editando === m.idx ? 'Fechar' : 'Editar'}</button>
        {editando === m.idx && (
          <div className="rm-no-edicao">
            <CartaoMeta meta={m} objetivos={objetivos} pessoas={pessoas} campos={c} podeMover={podeMover} onChange={setMeta} onRemove={remove} />
          </div>
        )}
      </>
    ),
  };

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

      <p className="rm-dica">Os objetivos definidos nos preditores já estão na árvore. Acrescente as metas dentro de cada objetivo (até {MAX_METAS_POR_OBJETIVO} por objetivo) e use Editar para escrever, definir responsável e apoios.</p>
      <ArvorePlano modo="plano" arv={arv} rotulo="Árvore do planejamento: Legado, objetivos e metas" opcoes={opcoes}
        onAtiva={(id) => { if (id.startsWith('meta-')) { const i = Number(id.slice(5)); setEditando(editando === i ? null : i); } }} />
    </div>
  );
}
