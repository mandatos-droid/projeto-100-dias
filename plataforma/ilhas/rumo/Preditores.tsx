'use client';
/* Missão 3 · preditores de sucesso com o objetivo específico no próprio cartão e a árvore do planejamento nascendo ao lado.
   Estado: D.preditores e D.campos['m3.obj.{pid}'] (os mesmos do Guia, lidos pelo Resumo e pela Missão 5). */
import { MAX_PREDITORES, OBJ_ESPECIFICOS, PREDITORES, alternaPreditor, desmarcaPreditor } from '@/lib/plano';
import { aviso } from '../ponte';
import ArvorePlano from './ArvorePlano';
import { useRumo } from './useRumo';
import './rumo.css';

/* OBJ_ESPECIFICOS segue a ordem do Guia, que troca o 3º e o 4º preditor de lugar em relação a PREDITORES */
const EXEMPLO: Record<string, number> = { p1: 0, p2: 1, p3: 3, p4: 2, p5: 4 };

export default function Preditores() {
  const { d, c, arv, setPreditores, setCampos } = useRumo();
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
          <ul className="rm-preds">
            {PREDITORES.map((p) => {
              const on = escolhidos.includes(p.id);
              const chave = `m3.obj.${p.id}`;
              return (
                <li key={p.id} className={`rm-pred-c${on ? ' on' : ''}`} data-preditor={p.id}>
                  <button type="button" className="rm-pred-bt" aria-pressed={on} onClick={() => alterna(p.id)}>
                    <span className="rm-pred-n">{p.n}</span>
                    <span className="rm-pred-d">{p.d}</span>
                  </button>
                  {on && (
                    <label className="campo rm-pred-obj"><span className="rot">Objetivo específico de {p.n}</span>
                      <input type="text" value={c[chave] ?? ''} onChange={(e) => setCampos({ [chave]: e.target.value })}
                        placeholder={`Ex.: ${OBJ_ESPECIFICOS[EXEMPLO[p.id]][1]}`} />
                      <span className="rm-dica">Se ficar vazio, a árvore usa o nome do preditor como objetivo.</span>
                    </label>
                  )}
                </li>
              );
            })}
          </ul>
          <p className={`contador ${n === MAX_PREDITORES ? 'ok' : 'falta'}`} role="status">{n} de {MAX_PREDITORES} preditores escolhidos</p>
          {n > 0 && (
            <>
              <h4>Objetivo específico de cada preditor</h4>
              <div className="rolar"><table className="tb"><thead><tr><th style={{ width: '38%' }}>Preditor</th><th>Objetivo específico (exemplo)</th></tr></thead>
                <tbody>{OBJ_ESPECIFICOS.map((o) => <tr key={o[0]}><td>{o[0]}</td><td>{o[1]}</td></tr>)}</tbody></table></div>
            </>
          )}
        </section>
        <aside className="rm-direita" aria-labelledby="rm-arv-t">
          <h4 id="rm-arv-t">Árvore do planejamento</h4>
          <ArvorePlano modo="previa" arv={arv} />
        </aside>
      </div>
    </div>
  );
}
