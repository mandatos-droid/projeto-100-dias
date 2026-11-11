'use client';
/* Reação do mandato a 2 dados do partido (2.2): "Considerando [dado]: [valor], o mandato deve…" (PAR-10 a PAR-12).
   Grava em D.conj2.reacoes, no máximo 2 linhas. A lista de dados vem da Conjuntura, com os mesmos números do Placar. */
import { defineReacao, frase, type DadoPartido } from '@/lib/dadosPartido';
import type { Reacao } from '@/lib/types';
import { useLegado } from './ponte';

const LINHAS = [0, 1] as const;
const vazia: Reacao = { dado: '', valor: '', texto: '' };

export function Reacoes({ dados }: { dados: DadoPartido[] }) {
  const { D, bump } = useLegado();
  const c = D.conj2;
  if (!c) return null;
  const reacoes = (c.reacoes ?? []).slice(0, 2);
  const grava = (i: 0 | 1, dado: DadoPartido | null, texto: string) => { c.reacoes = defineReacao(reacoes, i, dado, texto); bump(); };

  const placar = dados.filter((d) => !d.id.startsWith('mun:'));
  const municipios = dados.filter((d) => d.id.startsWith('mun:'));

  return (
    <section className="rea" aria-labelledby="rea-t">
      <h4 id="rea-t">Reação do mandato a 2 dados do partido</h4>
      {LINHAS.map((i) => {
        const r = reacoes[i] ?? vazia;
        const dado = dados.find((d) => d.id === r.dado);
        const atual = dado ?? (r.dado ? { id: r.dado, nome: r.dado, valor: r.valor } : null);
        const idSel = `rea-sel-${i}`;
        return (
          <div className="rea-linha" key={i}>
            <label className="campo" htmlFor={idSel}>
              <span className="rot">Dado {i + 1}</span>
            </label>
            <select id={idSel} value={r.dado} onChange={(e) => grava(i, dados.find((d) => d.id === e.target.value) ?? null, r.texto)}>
              <option value="">Escolha um dado…</option>
              {r.dado && !dado && <option value={r.dado}>{`${r.dado}: ${r.valor}`}</option>}
              <optgroup label="Placar do partido">
                {placar.map((d) => <option key={d.id} value={d.id}>{`${d.nome}: ${d.valor}`}</option>)}
              </optgroup>
              {municipios.length > 0 && (
                <optgroup label="Municípios mais votados">
                  {municipios.map((d) => <option key={d.id} value={d.id}>{`${d.nome}: ${d.valor}`}</option>)}
                </optgroup>
              )}
            </select>
            {atual && (
              <label className="campo">
                <span className="rot">{dado ? frase(dado) : `Considerando ${r.valor}, o mandato deve`}…</span>
                <textarea rows={3} value={r.texto} placeholder="Complete a frase"
                  onChange={(e) => grava(i, atual, e.target.value)} />
              </label>
            )}
          </div>
        );
      })}
    </section>
  );
}
