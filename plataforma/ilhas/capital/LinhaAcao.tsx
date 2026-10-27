'use client';
/* Missão 4 · uma linha da matriz de ações (estilo 5W2H): caixa de marcar, os 5 campos e o ponto de preenchimento.
   Grava direto no registro de D.acoes, no formato do Guia: { id, bingo, i, titulo, alcancar, resp, prazo, saber, prox }. */
import { acaoCompleta } from '@/lib/capital';
import '../rumo/rumo.css';
import './capital.css';

export type Acao = { id?: string; bingo?: string; i?: number; titulo?: string; alcancar?: string; resp?: string; prazo?: string; saber?: string; prox?: string } & Record<string, unknown>;
type Chave = 'alcancar' | 'resp' | 'prazo' | 'saber' | 'prox';

const CAMPOS: { k: Chave; rot: string; longo: boolean }[] = [
  { k: 'alcancar', rot: 'O que queremos alcançar', longo: true },
  { k: 'resp', rot: 'Responsável', longo: false },
  { k: 'prazo', rot: 'Prazo', longo: false },
  { k: 'saber', rot: 'Como saberemos', longo: true },
  { k: 'prox', rot: 'Próximo passo', longo: true },
];

export default function LinhaAcao({ bingo, i, titulo, acao, onAlterna, onMuda }: {
  bingo: string; i: number; titulo: string; acao?: Acao; onAlterna: () => void; onMuda: () => void;
}) {
  const grava = (k: Chave, v: string) => { if (acao) { acao[k] = v; onMuda(); } };
  const completa = acao ? acaoCompleta(acao) : false;
  return (
    <li className={`cp-acao${acao ? ' on' : ''}`} data-bingo={bingo} data-i={i}>
      <div className="cp-acao-topo">
        <label>
          <input type="checkbox" checked={!!acao} onChange={onAlterna} aria-label={`Escolher ação: ${titulo}`} />
          <span>{titulo}</span>
        </label>
        {acao && (
          <span className="cp-ponto" data-estado={completa ? 'completa' : 'pendente'} role="img" aria-label={completa ? 'Ação completa' : 'Faltam campos'}>
            {completa ? 'Completa' : 'Faltam campos'}
          </span>
        )}
      </div>
      {acao && (
        <div className="cp-campos">
          {CAMPOS.map((c) => (
            <label key={c.k} className={`campo cp-c-${c.k}`}><span className="rot">{c.rot}</span>
              {c.longo
                ? <textarea value={typeof acao[c.k] === 'string' ? acao[c.k] : ''} onChange={(e) => grava(c.k, e.target.value)} />
                : <input type="text" value={typeof acao[c.k] === 'string' ? acao[c.k] : ''} onChange={(e) => grava(c.k, e.target.value)} />}
            </label>
          ))}
        </div>
      )}
    </li>
  );
}
