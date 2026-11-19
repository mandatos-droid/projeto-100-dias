'use client';
/* Missão 3 · metas agrupadas por objetivo estratégico, com retorno SMART, responsável e apoios (CartaoMeta).
   Estado: D.metas (campos antigos pred, texto, resp, apoio preservados). */
import { MAX_METAS_POR_OBJETIVO, METAS_MAX, METAS_MIN, contagemMetas, podeAcrescentarMeta } from '@/lib/plano';
import { resolve } from '@/lib/pessoas';
import { lerSucessos } from '@/lib/sucessos';
import { useState } from 'react';
import Gaveta from '../Gaveta';
import { aviso } from '../ponte';
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
  const [editando, setEditando] = useState<{ idx: number; origem?: HTMLElement | null } | null>(null);
  const acrescenta = (pid: string, origem?: HTMLElement | null) => {
    const prox = Array.isArray(d.metas) ? d.metas.length : 0;
    if (addMeta(pid) === null) setEditando({ idx: prox, origem: origem ?? null });
  };
  const metasLista = [...arv.objetivos.flatMap((o) => o.metas), ...arv.semObjetivo];
  const metaGaveta = editando ? metasLista.find((x) => x.idx === editando.idx) ?? null : null;

  const opcoes = {
    cartoes: true,
    onStatus: () => {},
    leitura: true,
    infoMeta: (m: (typeof arv.semObjetivo)[number]) => {
      const r = resolve(c, m);
      const suc = lerSucessos(m).length;
      return (
        <span className="np-meta-resp">
          Responsável: <b>{r.resp || 'A definir'}</b>
          {r.apoios.length > 0 && ` · Apoio: ${r.apoios.join(', ')}`}
          {` · ${suc} ${suc === 1 ? 'sucesso mensal' : 'sucessos mensais'}`}
        </span>
      );
    },
    extraObjetivo: (pid: string) => (
      <button type="button" className="bt sec peq" aria-label={`Acrescentar meta a ${objetivos.find((o) => o.pid === pid)?.texto ?? pid}`} onClick={(e) => acrescenta(pid, e.currentTarget)}>+ Acrescentar meta</button>
    ),
    extra: (m: (typeof arv.semObjetivo)[number]) => {
      const aberta = editando?.idx === m.idx;
      const nMeta = String(m.idx + 1).padStart(2, '0');
      return (
        <button type="button" className="bt sec peq" aria-expanded={aberta} aria-label={`${aberta ? 'Fechar a edição da' : 'Editar a'} meta ${nMeta}`}
          onClick={(e) => setEditando(aberta ? null : { idx: m.idx, origem: e.currentTarget })}>{aberta ? 'Fechar' : 'Editar'}</button>
      );
    },
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
      <ArvorePlano modo="plano" estilo="cartoes" arv={arv} rotulo="Árvore do planejamento: Legado, objetivos e metas" opcoes={opcoes}
        editandoId={editando ? `meta-${editando.idx}` : null}
        onAtiva={(id) => {
          if (id.startsWith('meta-')) {
            const i = Number(id.slice(5));
            const origem = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            setEditando(editando?.idx === i ? null : { idx: i, origem });
          }
        }} />

      <Gaveta
        aberta={metaGaveta !== null}
        titulo={metaGaveta ? `Editar Meta ${String(metaGaveta.idx + 1).padStart(2, '0')}` : ''}
        ariaLabel="Editar meta SMART"
        classeCorpo="rm-no-edicao"
        origem={editando?.origem ?? null}
        onFechar={() => setEditando(null)}
        rodape={
          <>
            <button type="button" className="bt sec" onClick={() => setEditando(null)}>Fechar</button>
            <button
              type="button"
              className="bt pri"
              onClick={() => {
                if (metaGaveta) aviso(`Meta ${String(metaGaveta.idx + 1).padStart(2, '0')} salva!`);
                setEditando(null);
              }}
            >
              Salvar meta
            </button>
          </>
        }
      >
        {metaGaveta && (
          <CartaoMeta
            meta={metaGaveta}
            objetivos={objetivos}
            pessoas={pessoas}
            campos={c}
            umaColuna
            podeMover={podeMover}
            onChange={setMeta}
            onRemove={remove}
          />
        )}
      </Gaveta>
    </div>
  );
}
