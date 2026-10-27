'use client';
/* Missão 4 · matriz das ações dos 100 dias. As frentes e as ações recomendadas vêm de BINGOS (conteudo.js, só leitura);
   as escolhidas ficam em D.acoes no formato antigo ({id, bingo, i, titulo, alcancar, resp, prazo, saber, prox}), sem migração. */
import { useState } from 'react';
import { TEXTO_SABER, acaoCompleta, ehDataISO, ordenaPorPrazo, progressoAcoes } from '@/lib/capital';
import { useRumo } from '../rumo/useRumo';
import LinhaAcao, { type Acao } from './LinhaAcao';
import '../rumo/rumo.css';
import './capital.css';

type Bingo = { n: string; itens: string[] };
const bingos = () => (window as unknown as { BINGOS?: Record<string, Bingo> }).BINGOS ?? {};
const dataBR = (v: string) => (ehDataISO(v) ? v.split('-').reverse().join('/') : v);
const uid = () => Math.random().toString(36).slice(2, 10);
/* o texto base de "Como saberemos" que ninguém mexeu não conta como conteúdo a proteger */
const temTexto = (a: Acao) => (['alcancar', 'resp', 'prazo', 'saber', 'prox'] as const).some((k) => {
  const v = typeof a[k] === 'string' ? a[k]!.trim() : '';
  return v !== '' && !(k === 'saber' && v === (TEXTO_SABER[a.bingo ?? ''] ?? ''));
});

export default function Matriz() {
  const { d: D, m, pessoas, bump } = useRumo();
  const frentes = Object.entries(bingos());
  const [ativa, setAtiva] = useState(frentes[0]?.[0] ?? '');
  const [todas, setTodas] = useState(false); // visão "Todas as ações" no lugar das linhas de uma frente
  const lista = (Array.isArray(D.acoes) ? D.acoes : []) as Acao[];
  const doBingo = (k: string) => lista.filter((a) => a.bingo === k);
  const frente = bingos()[ativa];
  const prog = progressoAcoes(lista);
  const validas = lista.filter((a) => typeof a.bingo === 'string' && bingos()[a.bingo]);

  const alterna = (k: string, i: number, titulo: string) => {
    const a = lista.find((x) => x.bingo === k && x.i === i);
    if (!a) { D.acoes = [...lista, { id: uid(), bingo: k, i, titulo, saber: TEXTO_SABER[k] ?? '' }]; bump(); return; }
    if (temTexto(a) && !window.confirm('Remover esta ação? O que foi preenchido nela será apagado.')) return;
    D.acoes = lista.filter((x) => x !== a);
    bump();
  };

  return (
    <div className="ilha-corpo cp-esc cp-matriz">
      <div className="cp-progresso" role="status" data-ok={prog.ok}>
        <progress max={4} value={Math.min(prog.total, 2) + Math.min(prog.frentes, 2)} aria-label="Progresso das ações" />
        <span>{prog.ok ? `${prog.total} ações em ${prog.frentes} frentes ✓` : 'Faltam ações em frentes diferentes. O mínimo são duas, cada uma em uma frente.'}</span>
      </div>
      <div className="cp-frentes" role="group" aria-label="Frentes de ação">
        {frentes.map(([k, b]) => (
          <button key={k} type="button" className="rm-chip" data-frente={k} aria-pressed={!todas && ativa === k} onClick={() => { setAtiva(k); setTodas(false); }}>
            {b.n} <span className="cp-n">{doBingo(k).length}</span>
          </button>
        ))}
        <button type="button" className="rm-chip" aria-pressed={todas} onClick={() => setTodas(true)}>Todas as ações <span className="cp-n">{validas.length}</span></button>
      </div>
      {todas ? (
        validas.length ? (
          <ol className="cp-todas cp-lista" aria-label="Todas as ações, por prazo">
            {ordenaPorPrazo(validas).map((a) => (
              <li key={a.id ?? `${a.bingo}-${a.i}`} className="cp-acao on" data-bingo={a.bingo} data-i={a.i}>
                <div className="cp-acao-topo">
                  <span><b>{bingos()[a.bingo!].n}</b>: {a.titulo}</span>
                  <span className="cp-ponto" data-estado={acaoCompleta(a) ? 'completa' : 'pendente'}>{acaoCompleta(a) ? 'Completa' : 'Faltam campos'}</span>
                </div>
                <p className="cp-resumo">Responsável: {a.resp ? a.resp : 'a definir'} · Prazo: {a.prazo ? dataBR(String(a.prazo)) : 'sem prazo'}</p>
              </li>
            ))}
          </ol>
        ) : <p className="cp-vazio">Nenhuma ação escolhida ainda. Escolha uma frente e marque as ações.</p>
      ) : frente && (
        <ul className="cp-acoes cp-lista" aria-label={`Ações de ${frente.n}`}>
          {frente.itens.map((titulo, i) => (
            <LinhaAcao key={`${ativa}-${i}`} bingo={ativa} i={i} titulo={titulo} acao={lista.find((x) => x.bingo === ativa && x.i === i)} pessoas={pessoas} posse={m.data_posse}
              onAlterna={() => alterna(ativa, i, titulo)} onMuda={bump} />
          ))}
        </ul>
      )}
    </div>
  );
}
