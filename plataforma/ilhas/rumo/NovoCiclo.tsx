'use client';
/* Missão 5 · botão "Criar novo planejamento". Pede confirmação, deixa escolher quais metas copiar e chama lib/ciclos.ts.
   Cancelar fecha o painel sem tocar em D. O plano novo mantém Legado, bandeiras, objetivos e preditores (design: AD-005). */
import { useState } from 'react';
import { arquivarEIniciar, listaCiclos } from '@/lib/ciclos';
import { useRumo } from './useRumo';
import './rumo.css';

const txt = (t?: string) => (t ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export default function NovoCiclo() {
  const { d, metas, bump } = useRumo();
  const [aberto, setAberto] = useState(false);
  const [escolhidas, setEscolhidas] = useState<Set<number>>(new Set());
  const [feito, setFeito] = useState<{ guardado: number; atual: number } | null>(null);
  const atual = listaCiclos(d).length;

  const alterna = (idx: number) => setEscolhidas((s) => { const n = new Set(s); if (n.has(idx)) n.delete(idx); else n.add(idx); return n; });
  const abre = () => { setEscolhidas(new Set()); setFeito(null); setAberto(true); };
  const confirma = () => {
    const guardado = arquivarEIniciar(d, { copiar: [...escolhidas] });
    bump();
    setAberto(false);
    setFeito({ guardado, atual: guardado + 1 });
  };

  return (
    <div className="rm-novociclo rm-nao-imprime">
      {!aberto && <button type="button" className="bt pri" onClick={abre}>Criar novo planejamento</button>}
      {feito && !aberto && (
        <p className="rm-dica" role="status">Planejamento {feito.guardado} guardado. Você está no Planejamento {feito.atual}.</p>
      )}
      {aberto && (
        <section className="rm-novociclo-painel" role="group" aria-labelledby="rm-nc-t">
          <h4 id="rm-nc-t">Criar novo planejamento</h4>
          <p>Isso guarda o planejamento atual (Planejamento {atual}) e abre um novo. O Legado, as bandeiras, os objetivos e os preditores continuam. O planejamento guardado fica disponível só para leitura.</p>
          <fieldset className="rm-novociclo-metas">
            <legend>Metas a copiar para o novo planejamento (sem os sucessos, com status “não concluída”)</legend>
            {metas.length === 0 && <p className="rm-dica">O planejamento atual ainda não tem metas.</p>}
            {metas.map((m) => (
              <label key={m.idx} className="chk">
                <input type="checkbox" checked={escolhidas.has(m.idx)} onChange={() => alterna(m.idx)} />
                <span>Meta {String(m.idx + 1).padStart(2, '0')}: {txt(m.texto) || 'sem texto'}</span>
              </label>
            ))}
            {metas.length > 0 && (
              <button type="button" className="bt sec peq" onClick={() => setEscolhidas(escolhidas.size === metas.length ? new Set() : new Set(metas.map((m) => m.idx)))}>
                {escolhidas.size === metas.length ? 'Desmarcar todas' : 'Marcar todas'}
              </button>
            )}
          </fieldset>
          <div className="bts">
            <button type="button" className="bt pri" onClick={confirma}>Confirmar e criar novo planejamento</button>
            <button type="button" className="bt sec" onClick={() => setAberto(false)}>Cancelar</button>
          </div>
        </section>
      )}
    </div>
  );
}
