'use client';
/* Missão 4 · matriz das ações dos 100 dias. As frentes e as ações recomendadas vêm de BINGOS (conteudo.js, só leitura);
   as escolhidas ficam em D.acoes no formato antigo ({id, bingo, i, titulo, alcancar, resp, prazo, saber, prox}), sem migração. */
import { useState } from 'react';
import { useLegado } from '../ponte';
import LinhaAcao, { type Acao } from './LinhaAcao';
import '../rumo/rumo.css';
import './capital.css';

type Bingo = { n: string; itens: string[] };
const bingos = () => (window as unknown as { BINGOS?: Record<string, Bingo> }).BINGOS ?? {};
const uid = () => Math.random().toString(36).slice(2, 10);
const temTexto = (a: Acao) => (['alcancar', 'resp', 'prazo', 'saber', 'prox'] as const).some((k) => typeof a[k] === 'string' && a[k]!.trim() !== '');

export default function Matriz() {
  const { D, bump } = useLegado();
  const frentes = Object.entries(bingos());
  const [ativa, setAtiva] = useState(frentes[0]?.[0] ?? '');
  const lista = (Array.isArray(D.acoes) ? D.acoes : []) as Acao[];
  const doBingo = (k: string) => lista.filter((a) => a.bingo === k);
  const frente = bingos()[ativa];

  const alterna = (k: string, i: number, titulo: string) => {
    const a = lista.find((x) => x.bingo === k && x.i === i);
    if (!a) { D.acoes = [...lista, { id: uid(), bingo: k, i, titulo }]; bump(); return; }
    if (temTexto(a) && !window.confirm('Remover esta ação? O que foi preenchido nela será apagado.')) return;
    D.acoes = lista.filter((x) => x !== a);
    bump();
  };

  return (
    <div className="ilha-corpo cp-esc cp-matriz">
      <div className="cp-frentes" role="group" aria-label="Frentes de ação">
        {frentes.map(([k, b]) => (
          <button key={k} type="button" className="rm-chip" data-frente={k} aria-pressed={ativa === k} onClick={() => setAtiva(k)}>
            {b.n} <span className="cp-n">{doBingo(k).length}</span>
          </button>
        ))}
      </div>
      {frente && (
        <ul className="cp-acoes cp-lista" aria-label={`Ações de ${frente.n}`}>
          {frente.itens.map((titulo, i) => (
            <LinhaAcao key={`${ativa}-${i}`} bingo={ativa} i={i} titulo={titulo} acao={lista.find((x) => x.bingo === ativa && x.i === i)}
              onAlterna={() => alterna(ativa, i, titulo)} onMuda={bump} />
          ))}
        </ul>
      )}
    </div>
  );
}
