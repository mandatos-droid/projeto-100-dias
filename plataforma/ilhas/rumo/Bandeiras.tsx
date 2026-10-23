'use client';
/* Missão 3 · bandeiras: mural, argumentos e notas por critério, critérios próprios e ranking com as prioritárias.
   Estado em D.rumo (lib/rumo.ts), espelhado em m3.mural, m3.argumentos, m3.criterios e m3.b1..b3. */
import { useEffect, useState } from 'react';
import { BANDEIRAS } from '@/lib/bandeiras';
import { MAX_CRITERIOS, MAX_PRIORITARIAS, adicionaCriterio, alternaPrioritaria, defineNota, ranking, removeCriterio, total, type Resultado } from '@/lib/criterios';
import { novaBandeira, type BandeiraRumo, type Rumo } from '@/lib/rumo';
import { aviso } from '../ponte';
import { useRumo } from './useRumo';
import './rumo.css';

const NOTAS = [0, 1, 2, 3, 4, 5];
const RECAP: [string, string][] = [['m1.q1', 'Quem é a liderança'], ['m1.q3', 'Desejo para o futuro'], ['m1.q7', 'Expectativas do eleitorado'], ['m1.q8', 'Conjuntura social do território']];
/* o legado guarda HTML nas respostas da Missão 1; aqui só o texto */
const limpa = (s: unknown) => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

function ResumoMissao1() {
  const { c, d } = useRumo();
  const frags = ((d as { frags?: { t: string; mp?: string | null }[] }).frags ?? []).filter((f) => f.mp);
  const itens = RECAP.map(([k, rot]) => [rot, limpa(c[k])] as const).filter(([, v]) => v);
  return (
    <details className="rm-recap" open={itens.length > 0 || frags.length > 0}>
      <summary>Relembre o que a Missão 1 apurou</summary>
      {itens.map(([rot, v]) => <p key={rot}><b>{rot}</b>{v}</p>)}
      {frags.length > 0 && <p><b>Fragilidades apontadas</b>{frags.map((f) => f.t).join('; ')}</p>}
      {!itens.length && !frags.length && <p className="rm-vazio">Ainda não há respostas da Missão 1 neste mandato. Preencha-a para ver aqui o resumo.</p>}
    </details>
  );
}

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
          placeholder="O que a equipe disse a favor desta bandeira" />
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
  const { rumo, set } = useRumo();
  const [outra, setOutra] = useState('');
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
  const alterna = (rot: string) => {
    const nova = novaBandeira(rot);
    const atual = rumo.bandeiras.find((x) => x.id === nova.id);
    if (atual) return remove(atual);
    grava({ ...rumo, bandeiras: [...rumo.bandeiras, nova] });
    setFoco(nova.id);
  };
  const acrescentaOutra = () => {
    const rot = outra.trim();
    if (!rot) return;
    const nova = novaBandeira(rot);
    if (rumo.bandeiras.some((x) => x.id === nova.id)) { aviso(`${nova.rot} já está no mural.`); return; }
    setOutra('');
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

  const ids = new Set(BANDEIRAS.map((b) => b.id));
  const proprias = rumo.bandeiras.filter((b) => !ids.has(b.id));
  const ordem = ranking(rumo.bandeiras, rumo.criterios);
  const maximo = 5 * rumo.criterios.length;
  const nPrior = rumo.bandeiras.filter((b) => b.prioridade !== null).length;
  const porId = new Map(rumo.bandeiras.map((b) => [b.id, b]));

  return (
    <div className="ilha-corpo rm-band">
      <ResumoMissao1 />
      <div className="rm-grade">
        <section className="rm-mural" aria-labelledby="rm-mural-t">
          <h4 id="rm-mural-t">Marque as agendas e bandeiras levantadas</h4>
          <div className="rm-chips">
            {BANDEIRAS.map((b) => {
              const on = rumo.bandeiras.some((x) => x.id === b.id);
              return <button key={b.id} type="button" className="rm-chip" aria-pressed={on} onClick={() => alterna(b.rot)}>{b.rot}</button>;
            })}
            {proprias.map((b) => (
              <button key={b.id} type="button" className="rm-chip" aria-pressed="true" title="Clique para remover" onClick={() => remove(b)}>{b.rot} ×</button>
            ))}
          </div>
          <p className="rm-leg"><strong>{rumo.bandeiras.length}</strong> {rumo.bandeiras.length === 1 ? 'selecionada' : 'selecionadas'}</p>
          <div className="rm-add">
            <label className="campo"><span className="rot">Outra bandeira</span>
              <input type="text" value={outra} onChange={(e) => setOutra(e.target.value)} placeholder="Outra agenda ou bandeira"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); acrescentaOutra(); } }} />
            </label>
            <button type="button" className="bt sec peq" onClick={acrescentaOutra}>Acrescentar bandeira</button>
          </div>
        </section>

        <div className="rm-direita">
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

          {rumo.textoAntigo && (
            <details className="rm-antigo">
              <summary>Texto escrito antes desta tela (mantido)</summary>
              {rumo.textoAntigo.argumentos && <p><b>Argumentos</b>{rumo.textoAntigo.argumentos}</p>}
              {rumo.textoAntigo.criterios && <p><b>Critérios</b>{rumo.textoAntigo.criterios}</p>}
            </details>
          )}

          {rumo.bandeiras.length === 0
            ? <p className="rm-vazio">Marque ao menos uma bandeira ao lado para abrir os argumentos e as notas dela.</p>
            : rumo.bandeiras.map((b) => <Card key={b.id} b={b} rumo={rumo} aplica={aplica} remove={remove} foco={foco === b.id} />)}

          {rumo.bandeiras.length > 0 && (
            <section aria-labelledby="rm-rank-t" className="rm-ranking">
              <h4 id="rm-rank-t">Ranking e prioritárias <span>{nPrior} de {MAX_PRIORITARIAS}</span></h4>
              <ol>
                {ordem.map((l, i) => {
                  const b = porId.get(l.id)!;
                  return (
                    <li key={l.id} data-ranking={b.id}>
                      <span className="rm-pos">{i + 1}</span>
                      <span className="rm-rank-nome">{b.rot}{l.sugerida && <em className="rm-sug">sugerida</em>}</span>
                      <span className="rm-barra" aria-hidden="true"><i style={{ width: `${maximo ? (l.total / maximo) * 100 : 0}%` }} /></span>
                      <span className="rm-rank-pts">{l.total}</span>
                      <button type="button" className="rm-estrela" aria-pressed={b.prioridade !== null}
                        aria-label={b.prioridade !== null ? `Desmarcar ${b.rot} das prioritárias` : `Marcar ${b.rot} como prioritária`}
                        onClick={() => aplica(alternaPrioritaria(rumo, b.id))}>{b.prioridade !== null ? `★ ${b.prioridade}` : '☆'}</button>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
