'use client';
/* Missão 3 · preditores de sucesso, cada um com a justificativa da escolha (ou da não escolha) e a árvore do planejamento nascendo ao lado.
   Estado: D.preditores e D.campos['m3.just.{pid}'] (a frase do Objetivo Estratégico fica na ilha da estratégia). */
import { MAX_PREDITORES, PREDITORES, alternaPreditor, desmarcaPreditor } from '@/lib/plano';
import { defineJustificativa, faltamJustificativas, lerJustificativa } from '@/lib/estrategia';
import { aviso } from '../ponte';
import ArvorePlano from './ArvorePlano';
import { useRumo } from './useRumo';
import './rumo.css';

export default function Preditores() {
  const { d, c, arv, setPreditores, setCampos } = useRumo();
  const falta = faltamJustificativas(c);
  const escolhidos = arv.objetivos.map((o) => o.pid);
  const n = escolhidos.length;

  const alterna = (pid: string) => {
    if (escolhidos.includes(pid)) {
      const { afetadas, patch } = desmarcaPreditor(d, pid);
      if (afetadas > 0 && !window.confirm(`Este preditor tem ${afetadas} ${afetadas === 1 ? 'meta' : 'metas'}. Ao desmarcar, ${afetadas === 1 ? 'ela fica' : 'elas ficam'} sem objetivo (nada é apagado). Desmarcar mesmo?`)) return;
      setPreditores(patch.preditores, afetadas > 0 ? patch.metas : undefined);
      return;
    }
    const r = alternaPreditor(d, pid);
    if (r.erro) { aviso(r.erro); return; }
    setPreditores(r.preditores);
  };

  return (
    <div className="ilha-corpo rm-pred">
      <div className="rm-grade">
        <section aria-labelledby="rm-pred-t">
          <h4 id="rm-pred-t">Escolha os preditores</h4>
          <p className="rm-dica">Atenção! Sua escolha deve considerar o que precisa acontecer logo nos primeiros dias do mandato.</p>
          <ul className="rm-preds">
            {PREDITORES.map((p) => {
              const on = escolhidos.includes(p.id);
              const abre = on || n === MAX_PREDITORES; // com 3 escolhidos, os 2 restantes pedem "não foi escolhido pois…"
              const rotulo = on ? 'Este preditor foi escolhido pois…' : 'Este preditor não foi escolhido pois…';
              return (
                <li key={p.id} className={`rm-pred-c${on ? ' on' : ''}`} data-preditor={p.id}>
                  <button type="button" className="rm-pred-bt" aria-pressed={on} onClick={() => alterna(p.id)}>
                    <span className="rm-pred-n">{p.n}</span>
                    <span className="rm-pred-d">{p.d}</span>
                  </button>
                  {abre && (
                    <label className="campo rm-pred-obj"><span className="rot">{rotulo}</span>
                      <textarea rows={2} value={lerJustificativa(c, p.id)} aria-label={`${rotulo} (${p.n})`}
                        onChange={(e) => setCampos(defineJustificativa(c, p.id, e.target.value))} />
                    </label>
                  )}
                </li>
              );
            })}
          </ul>
          <p className={`contador ${n === MAX_PREDITORES ? 'ok' : 'falta'}`} role="status">{n} de {MAX_PREDITORES} preditores escolhidos</p>
          {falta > 0 && <p className="contador falta" role="status">{falta === 1 ? 'falta 1 justificativa' : `faltam ${falta} justificativas`}</p>}
        </section>
        <aside className="rm-direita" aria-labelledby="rm-arv-t">
          <h4 id="rm-arv-t">Árvore do planejamento</h4>
          <ArvorePlano modo="previa" arv={arv} />
        </aside>
      </div>
    </div>
  );
}
