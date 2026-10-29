'use client';
/* Missão 5 · editor do planejamento na própria aba: Legado, preditores e objetivos. As metas e os sucessos já se editam na árvore.
   Grava nos mesmos dados da Missão 3 (D.rumo.legado, D.preditores, m3.obj.*), então ninguém precisa refazer a missão. */
import { useState } from 'react';
import { MAX_PREDITORES, PREDITORES, alternaPreditor, desmarcaPreditor } from '@/lib/plano';
import { aviso } from '../ponte';
import { useRumo } from './useRumo';
import './rumo.css';

export default function EditorPlano({ aberto }: { aberto: boolean }) {
  const { d, c, rumo, arv, set, setCampos, setPreditores } = useRumo();
  const escolhidos = arv.objetivos.map((o) => o.pid);
  const [aberta, setAberta] = useState(aberto); // só o valor inicial vem de fora: escolher um preditor não fecha o editor

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
    <details className="rm-editor rm-nao-imprime" open={aberta} onToggle={(e) => setAberta(e.currentTarget.open)}>
      <summary>Editar Legado, preditores e objetivos</summary>
      <label className="campo"><span className="rot">Legado (a manchete dos 4 anos)</span>
        <textarea rows={2} value={rumo.legado.manchete} onChange={(e) => set({ legado: { manchete: e.target.value, manual: true } })}
          placeholder="Ex.: Mandato que colocou a educação no centro do debate" />
      </label>
      <fieldset className="rm-editor-pred">
        <legend>Preditores de sucesso ({escolhidos.length} de {MAX_PREDITORES})</legend>
        {PREDITORES.map((p) => {
          const on = escolhidos.includes(p.id);
          const chave = `m3.obj.${p.id}`;
          return (
            <div key={p.id} className={`rm-editor-p${on ? ' on' : ''}`}>
              <label className="chk"><input type="checkbox" checked={on} onChange={() => alterna(p.id)} /><span>{p.n}</span></label>
              {on && (
                <label className="campo"><span className="rot">Objetivo específico de {p.n}</span>
                  <input type="text" value={c[chave] ?? ''} onChange={(e) => setCampos({ [chave]: e.target.value })} placeholder="Se ficar vazio, vale o nome do preditor" />
                </label>
              )}
            </div>
          );
        })}
      </fieldset>
    </details>
  );
}
