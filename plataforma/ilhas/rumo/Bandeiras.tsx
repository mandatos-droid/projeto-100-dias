'use client';
/* Missão 3 · agendas: só as agendas escolhidas na Missão 1 (D.agendasPrio) entram no mural; mural, argumentos e notas por critério, critérios próprios e ranking com as prioritárias.
   Estado em D.rumo (lib/rumo.ts), espelhado em m3.mural, m3.argumentos, m3.criterios e m3.b1..b3. */
import { useEffect, useState } from 'react';
import { AGENDAS_PRIO } from '@/lib/agendas';
import { validas } from '@/lib/agendasPrio';
import { BANDEIRA_DA_AGENDA, bandeiraDe } from '@/lib/bandeiras';
import { MAX_CRITERIOS, MAX_PRIORITARIAS, adicionaCriterio, alternaPrioritaria, defineNota, movePrioritaria, ranking, removeCriterio, total, type Resultado } from '@/lib/criterios';
import { novaBandeira, type BandeiraRumo, type Rumo } from '@/lib/rumo';
import { aviso } from '../ponte';
import { useRumo } from './useRumo';
import './rumo.css';

const NOTAS = [0, 1, 2, 3, 4, 5];

function Card({ b, rumo, aplica, remove, foco }: { b: BandeiraRumo; rumo: Rumo; aplica: (r: Resultado) => void; remove: (b: BandeiraRumo) => void; foco: boolean }) {
  const pts = total(b, rumo.criterios);
  const maximo = 5 * rumo.criterios.length;
  const grava = (argumentos: string) => aplica({ rumo: { ...rumo, bandeiras: rumo.bandeiras.map((x) => (x.id === b.id ? { ...x, argumentos } : x)) } });
  return (
    <details className="rm-card" open data-bandeira={b.id}>
      <summary>
        <span className="rm-card-nome">{b.rot}</span>
        {b.prioridade !== null && <span className="rm-selo">Prioridade {b.prioridade}</span>}
        <span className="rm-pts" aria-label={`${pts} pontos de ${maximo}`}><b>{pts}</b>/{maximo}</span>
      </summary>
      <label className="campo">
        <span className="rot">Argumentos</span>
        <textarea autoFocus={foco} aria-label={`Argumentos de ${b.rot}`} value={b.argumentos} onChange={(e) => grava(e.target.value)}
          placeholder="O que a equipe disse a favor desta agenda" />
      </label>
      <div className="rm-notas">
        {rumo.criterios.map((cr) => (
          <div className="rm-nota" key={cr.id} role="group" aria-label={`Nota de ${b.rot} em ${cr.rot}`}>
            <span>{cr.rot}</span>
            <span className="rm-nota-bt">
              {NOTAS.map((n) => (
                <button key={n} type="button" aria-pressed={b.notas[cr.id] === n} aria-label={`Nota ${n} em ${cr.rot}`}
                  onClick={() => aplica(defineNota(rumo, b.id, cr.id, n))}>{n}</button>
              ))}
            </span>
          </div>
        ))}
      </div>
      <button type="button" className="rm-link" onClick={() => remove(b)}>Remover {b.rot}</button>
    </details>
  );
}

export default function Bandeiras() {
  const { rumo, set, d } = useRumo();
  const [novoCriterio, setNovoCriterio] = useState('');
  const [foco, setFoco] = useState<string | null>(null);
  useEffect(() => { if (foco) document.querySelector(`[data-bandeira="${foco}"]`)?.scrollIntoView({ block: 'nearest' }); }, [foco]);

  const grava = (r: Rumo) => set({ bandeiras: r.bandeiras, criterios: r.criterios });
  const aplica = (res: Resultado) => { if (res.erro) aviso(res.erro); else grava(res.rumo); };

  const remove = (b: BandeiraRumo) => {
    if ((b.argumentos.trim() || Object.keys(b.notas).length) && !window.confirm(`Remover ${b.rot}? Os argumentos e as notas dela serão apagados.`)) return;
    const livre = b.prioridade !== null ? alternaPrioritaria(rumo, b.id).rumo : rumo; // as outras prioritárias sobem
    grava({ ...livre, bandeiras: livre.bandeiras.filter((x) => x.id !== b.id) });
  };
  const alterna = (agendaId: string) => {
    const ag = AGENDAS_PRIO.find((a) => a.id === agendaId);
    const bid = BANDEIRA_DA_AGENDA[agendaId];
    if (!ag || !bid) return;
    const nova = { ...novaBandeira(bandeiraDe(bid)?.rot ?? ag.rot), id: bid, rot: ag.rot };
    const atual = rumo.bandeiras.find((x) => x.id === nova.id);
    if (atual) return remove(atual);
    grava({ ...rumo, bandeiras: [...rumo.bandeiras, nova] });
    setFoco(nova.id);
  };
  const removeCrit = (id: string, rot: string) => {
    const comNota = rumo.bandeiras.some((b) => id in b.notas);
    if (comNota && !window.confirm(`Remover o critério "${rot}"? As notas dadas nele serão apagadas.`)) return;
    aplica(removeCriterio(rumo, id));
  };
  const acrescentaCrit = () => {
    const r = adicionaCriterio(rumo, novoCriterio);
    if (r.erro) { aviso(r.erro); return; }
    setNovoCriterio('');
    grava(r.rumo);
  };

  const escolhidas = validas(d.agendasPrio).map((id) => AGENDAS_PRIO.find((a) => a.id === id)!);
  const ids = new Set(escolhidas.map((a) => BANDEIRA_DA_AGENDA[a.id]));
  /* marcadas antes e fora da seleção da Missão 1: continuam visíveis e podem ser removidas, nada é apagado em silêncio */
  const proprias = rumo.bandeiras.filter((b) => !ids.has(b.id));
  const ordem = ranking(rumo.bandeiras, rumo.criterios);
  const maximo = 5 * rumo.criterios.length;
  const nPrior = rumo.bandeiras.filter((b) => b.prioridade !== null).length;
  const porId = new Map(rumo.bandeiras.map((b) => [b.id, b]));

  return (
    <div className="ilha-corpo rm-band">
      <div className="np-sec-card">
        <div className="etiqueta np-passo-et">Passo 1 · Seleção de agendas e critérios</div>
        <div className="np-2col np-band-passo1">
          <section className="rm-mural" aria-labelledby="rm-mural-t">
            <h4 id="rm-mural-t">Marque as agendas que o mandato vai avaliar</h4>
            {escolhidas.length === 0 && (
              <p className="rm-vazio">Escolha antes as agendas prioritárias na <a href="#/m/1/m1.oportunidades">Missão 1</a>. Só elas podem ser priorizadas aqui.</p>
            )}
            <div className="rm-chips">
              {escolhidas.map((a) => {
                const on = rumo.bandeiras.some((x) => x.id === BANDEIRA_DA_AGENDA[a.id]);
                return <button key={a.id} type="button" className="rm-chip" aria-pressed={on} onClick={() => alterna(a.id)}>{a.rot}</button>;
              })}
              {proprias.map((b) => (
                <button key={b.id} type="button" className="rm-chip" aria-pressed="true" title="Fora da seleção da Missão 1. Clique para remover" onClick={() => remove(b)}>{b.rot} ×</button>
              ))}
            </div>
            <p className="rm-leg"><strong>{rumo.bandeiras.length}</strong> {rumo.bandeiras.length === 1 ? 'selecionada' : 'selecionadas'}</p>
          </section>

          <section aria-labelledby="rm-crit-t" className="rm-criterios">
            <h4 id="rm-crit-t">Critérios de priorização</h4>
            <ul className="rm-crit-lista">
              {rumo.criterios.map((cr) => (
                <li key={cr.id}>{cr.rot}
                  <button type="button" aria-label={`Remover o critério ${cr.rot}`} onClick={() => removeCrit(cr.id, cr.rot)}>×</button>
                </li>
              ))}
            </ul>
            <div className="rm-add">
              <label className="campo"><span className="rot">Novo critério ({rumo.criterios.length} de {MAX_CRITERIOS})</span>
                <input type="text" value={novoCriterio} onChange={(e) => setNovoCriterio(e.target.value)} placeholder="Ex.: viabilidade política"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); acrescentaCrit(); } }} />
              </label>
              <button type="button" className="bt sec peq" onClick={acrescentaCrit}>Acrescentar critério</button>
            </div>
            <p className="rm-dica">Nota de 0 a 5 em cada critério, todos com o mesmo peso.</p>
          </section>
        </div>

        {rumo.textoAntigo && (
          <details className="rm-antigo" open>
            <summary>Texto escrito antes desta tela (mantido)</summary>
            {rumo.textoAntigo.argumentos && <p><b>Argumentos</b>{rumo.textoAntigo.argumentos}</p>}
            {rumo.textoAntigo.criterios && <p><b>Critérios</b>{rumo.textoAntigo.criterios}</p>}
          </details>
        )}
      </div>

      <div className="np-sec-card">
        <div className="etiqueta np-passo-et">Passo 2 · Avaliação por bandeira</div>
        <h3 className="np-passo-t">Avaliação por bandeira</h3>
        {rumo.bandeiras.length === 0
          ? <p className="rm-vazio">Marque ao menos uma agenda ao lado para abrir os argumentos e as notas dela.</p>
          : <div className="np-band-grid2">{rumo.bandeiras.map((b) => <Card key={b.id} b={b} rumo={rumo} aplica={aplica} remove={remove} foco={foco === b.id} />)}</div>}
      </div>

      {rumo.bandeiras.length > 0 && (
        <section aria-labelledby="rm-rank-t" className="np-sec-card np-rank-card rm-ranking">
          <div className="etiqueta np-passo-et">Passo 3 · Ranking e prioritárias</div>
          <h4 id="rm-rank-t">Ranking e prioritárias <span>{nPrior} de {MAX_PRIORITARIAS}</span></h4>
          <p className="rm-comando">Analise o ranking e decida, à luz dos dados, quais são as agendas prioritárias que decidem manter.</p>
          <ol className="np-rank-lista">
            {ordem.map((l, i) => {
              const b = porId.get(l.id)!;
              return (
                <li key={l.id} data-ranking={b.id} className="np-rank-item">
                  <span className="rm-pos">#{i + 1}</span>
                  <span className="rm-rank-nome">{b.rot}</span>
                  <span className="rm-barra" aria-hidden="true"><i style={{ width: `${maximo ? (l.total / maximo) * 100 : 0}%` }} /></span>
                  <span className="rm-rank-pts">{l.total}/{maximo}</span>
                  <span className="np-rank-acoes">
                    <button type="button" className="rm-estrela" aria-pressed={b.prioridade !== null}
                      aria-label={b.prioridade !== null ? `Desmarcar ${b.rot} das prioritárias` : `Marcar ${b.rot} como prioritária`}
                      onClick={() => aplica(alternaPrioritaria(rumo, b.id))}>{b.prioridade !== null ? `★ ${b.prioridade}` : '☆'}</button>
                    {b.prioridade !== null && (
                      <span className="rm-mover">
                        <button type="button" disabled={b.prioridade === 1} aria-label={`Subir ${b.rot} na ordem de prioridade`} onClick={() => aplica(movePrioritaria(rumo, b.id, 'cima'))}>↑</button>
                        <button type="button" disabled={b.prioridade === nPrior} aria-label={`Descer ${b.rot} na ordem de prioridade`} onClick={() => aplica(movePrioritaria(rumo, b.id, 'baixo'))}>↓</button>
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
