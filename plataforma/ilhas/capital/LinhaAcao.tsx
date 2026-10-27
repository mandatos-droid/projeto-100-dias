'use client';
/* Missão 4 · uma linha da matriz de ações (estilo 5W2H): caixa de marcar, os 5 campos e o ponto de preenchimento.
   Grava direto no registro de D.acoes, no formato do Guia: { id, bingo, i, titulo, alcancar, resp, prazo, saber, prox }.
   Extras ignorados pelo legado: respCad (índice da cadeira da Missão 2; `resp` guarda a cópia do nome). */
import { acaoCompleta, ehDataISO, hojeISO, limitesPrazo, validaPrazo } from '@/lib/capital';
import type { Pessoa } from '@/lib/pessoas';
import { aviso } from '../ponte';
import '../rumo/rumo.css';
import './capital.css';

export type Acao = { id?: string; bingo?: string; i?: number; titulo?: string; alcancar?: string; resp?: string; respCad?: number | null; prazo?: string; saber?: string; prox?: string } & Record<string, unknown>;
type Texto = 'alcancar' | 'saber' | 'prox';

const longo: { k: Texto; rot: string }[] = [
  { k: 'alcancar', rot: 'O que queremos alcançar' },
  { k: 'saber', rot: 'Como saberemos' },
  { k: 'prox', rot: 'Próximo passo' },
];
const texto = (v: unknown) => (typeof v === 'string' ? v : '');

export default function LinhaAcao({ bingo, i, titulo, acao, pessoas, posse, onAlterna, onMuda }: {
  bingo: string; i: number; titulo: string; acao?: Acao; pessoas: Pessoa[]; posse?: string; onAlterna: () => void; onMuda: () => void;
}) {
  const completa = acao ? acaoCompleta(acao) : false;
  const grava = (k: Texto, v: string) => { if (acao) { acao[k] = v; onMuda(); } };
  const escolhePessoa = (p: Pessoa) => {
    if (!acao) return;
    if (acao.respCad === p.cad) { acao.respCad = null; acao.resp = ''; } else { acao.respCad = p.cad; acao.resp = p.nome; }
    onMuda();
  };
  const textoResp = (v: string) => { if (acao) { acao.respCad = null; acao.resp = v; onMuda(); } };
  const mudaPrazo = (v: string) => {
    if (!acao) return;
    if (v === '') { acao.prazo = ''; onMuda(); return; }
    const erro = validaPrazo(v, hojeISO(), posse);
    if (erro) { aviso(erro); onMuda(); return; } // refaz o campo com o valor que já estava gravado
    acao.prazo = v;
    onMuda();
  };
  const prazo = texto(acao?.prazo);
  const lim = limitesPrazo(posse, hojeISO());
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
          <label className="campo cp-c-alcancar"><span className="rot">{longo[0].rot}</span>
            <textarea value={texto(acao.alcancar)} onChange={(e) => grava('alcancar', e.target.value)} />
          </label>
          <div className="cp-c-resp">
            {pessoas.length > 0 ? (
              <div className="rm-chips" role="group" aria-label="Pessoas da equipe">
                {pessoas.map((p) => (
                  <button key={p.cad} type="button" className="rm-chip" aria-pressed={acao.respCad === p.cad} onClick={() => escolhePessoa(p)}>
                    {p.nome}{p.cargo && <small> · {p.cargo}</small>}
                  </button>
                ))}
              </div>
            ) : <p className="rm-dica">A lista de pessoas vem da Missão 2 (Equipe), que ainda não tem cadeiras com nome. Escreva o nome por enquanto.</p>}
            <label className="campo"><span className="rot">Responsável</span>
              <input type="text" value={typeof acao.respCad === 'number' ? '' : texto(acao.resp)} placeholder={typeof acao.respCad === 'number' ? texto(acao.resp) : ''} onChange={(e) => textoResp(e.target.value)} />
            </label>
          </div>
          <div className="cp-c-prazo">
            <label className="campo"><span className="rot">Prazo</span>
              <input type="date" value={ehDataISO(prazo) ? prazo : ''} min={lim.min} max={lim.max} onChange={(e) => mudaPrazo(e.target.value)} />
            </label>
            {prazo !== '' && !ehDataISO(prazo) && <p className="rm-dica">Prazo anterior: {prazo}. Escolha uma data para trocá-lo.</p>}
          </div>
          {longo.slice(1).map((c) => (
            <label key={c.k} className={`campo cp-c-${c.k}`}><span className="rot">{c.rot}</span>
              <textarea value={texto(acao[c.k])} onChange={(e) => grava(c.k, e.target.value)} />
            </label>
          ))}
        </div>
      )}
    </li>
  );
}
