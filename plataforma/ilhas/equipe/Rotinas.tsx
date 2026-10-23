'use client';
/* Missão 2 · rotinas do mandato, geradas a partir das cadeiras: por área, em cadeia e entre áreas. */
import { useEffect, useState } from 'react';
import { ativas, coordDe, nomeLimpo, type Campos } from '@/lib/cadeiras';
import { COR_COORD, chaveFicha, lista } from '@/lib/equipe';
import { cadeia, desliga, gerarRotinas, religa, rotinasDesligadas, type Rotina } from '@/lib/rotinas';
import { cargoNome } from './cargos';
import { assinar, definirFoco, limparFoco } from './foco';
import { useEquipe } from './useEquipe';
import './equipe.css';

type Aba = 'area' | 'cadeia' | 'entre';
const ABAS: [Aba, string][] = [['area', 'Por área'], ['cadeia', 'Cadeia'], ['entre', 'Entre áreas']];

const ICONES: Record<string, string> = { plan: '◈', mensal: '▤', semanal: '▥', area: '▣', feedback: '◉' };
const pessoa = (c: Campos, i: number) => nomeLimpo(c, i) || '';
const quem = (c: Campos, i: number | null) => (i === null ? '' : pessoa(c, i) || cargoNome(c, i));

function Participantes({ c, r }: { c: Campos; r: Rotina }) {
  return <span>{r.participantes.length} participantes{r.confirmados < r.participantes.length ? ` · ${r.confirmados} de ${r.participantes.length} com nome` : ''}</span>;
}

export default function Rotinas() {
  const { c, agir } = useEquipe();
  const [aba, setAba] = useState<Aba>('area');
  const [ativo, setAtivo] = useState<string | null>(null);
  /* o destaque é compartilhado com o organograma; se ele for limpo de fora, a seleção daqui limpa junto */
  useEffect(() => assinar((f) => { if (!f.cadeiras.length) setAtivo(null); }), []);
  useEffect(() => () => limparFoco(), []);
  const escolhe = (id: string, cadeiras: number[]) => {
    if (ativo === id) { limparFoco(); return; }
    setAtivo(id);
    definirFoco({ cadeiras, id });
  };
  const rs = gerarRotinas(c);
  const off = rotinasDesligadas(c);
  const por = (t: Rotina['tipo']) => rs.filter((r) => r.tipo === t);
  const botao = (r: Rotina) => <button type="button" className="bt sec peq es-bt" aria-label={`Desligar: ${r.titulo}`} onClick={() => agir({ patch: desliga(c, r.id) })}>Desligar</button>;

  return (
    <div className="ilha-corpo es-rot">
      <div className="eq-abas" role="tablist" aria-label="Rotinas">
        {ABAS.map(([k, t]) => <button key={k} role="tab" id={`rot-${k}`} aria-selected={aba === k} aria-controls="rot-painel" onClick={() => setAba(k)}>{t}</button>)}
      </div>
      <div id="rot-painel" role="tabpanel" aria-labelledby={`rot-${aba}`}>
        {aba === 'area' && (rs.length === 0 && off.length === 0
          ? <p className="sem">Dê nome a ao menos uma cadeira para as rotinas do mandato aparecerem aqui.</p>
          : (<>
            <h4>Rotinas coletivas</h4>
            <div className="eq-faixas">
              {[...por('plan'), ...por('mensal'), ...por('semanal')].map((r) => (
                <div key={r.id} className="eq-rot-card" data-rotina={r.id}>
                  <strong>{r.titulo}</strong>
                  <span><b>{r.freq}</b> · {r.duracao}</span>
                  <span><b>Convoca:</b> {quem(c, r.convoca)}</span>
                  <Participantes c={c} r={r} />
                  {botao(r)}
                </div>
              ))}
            </div>
            <h4>Rotina de cada área</h4>
            <p className="eq-ajuda">Reunião semanal de distribuição de trabalho dentro de cada área: quem convoca e o que cada pessoa assume.</p>
            <div className="eq-areas">
              {por('area').map((r) => (
                <section key={r.id} className="eq-area" data-rotina={r.id} style={{ borderTopColor: COR_COORD[r.area!] }}>
                  <header><strong style={{ color: COR_COORD[r.area!] }}>{r.area}</strong><Participantes c={c} r={r} /></header>
                  <p className="eq-reun"><b>{r.titulo}</b> · {r.duracao} por semana · convoca: <b>{quem(c, r.convoca)}</b></p>
                  <ul>
                    {r.participantes.map((i) => (
                      <li key={i}>
                        <b>{pessoa(c, i) || <em>vaga</em>}</b> <span className="cf">{cargoNome(c, i)}</span>
                        {lista(c[chaveFicha(i, 'escopo')]).length
                          ? <ul className="eq-tarefas">{lista(c[chaveFicha(i, 'escopo')]).map((e) => <li key={e}>{e}</li>)}</ul>
                          : <span className="sem"> — escopo ainda não definido</span>}
                      </li>
                    ))}
                  </ul>
                  {botao(r)}
                </section>
              ))}
              {!por('area').length && <p className="sem">Uma reunião de área aparece quando a área tem 2 ou mais cadeiras.</p>}
            </div>
            <h4>Feedback individual</h4>
            <p className="eq-ajuda">Semestral, 30 minutos por conversa, entre cada liderança e quem ela lidera.</p>
            <ul className="es-fb">
              {ativas(c).filter((l) => por('feedback').some((r) => r.grupo === l)).map((l) => (
                <li key={l}><b>{quem(c, l)}</b> <span className="cf">{cargoNome(c, l)}</span>
                  <ul>{por('feedback').filter((r) => r.grupo === l).map((r) => (
                    <li key={r.id} data-rotina={r.id}>{quem(c, r.participantes[1])} <span className="cf">({coordDe(c, r.participantes[1])})</span> {botao(r)}</li>
                  ))}</ul>
                </li>
              ))}
            </ul>
            {off.length > 0 && (
              <details className="es-off" open>
                <summary>Rotinas desligadas ({off.length})</summary>
                <ul>{off.map((r) => (
                  <li key={r.id}>{r.titulo}{r.area ? ` · ${r.area}` : ''}
                    <button type="button" className="bt sec peq es-bt" aria-label={`Religar: ${r.titulo}${r.area ? ` ${r.area}` : ''}`} onClick={() => agir({ patch: religa(c, r.id) })}>Religar</button></li>
                ))}</ul>
              </details>
            )}
          </>))}
        {aba === 'cadeia' && (rs.length === 0
          ? <p className="sem">Dê nome a ao menos uma cadeira para a cadeia de rotinas aparecer aqui.</p>
          : (<>
            <p className="eq-ajuda">Do encontro mais amplo ao mais restrito. Escolha um elo para ver, no organograma, as cadeiras que participam dele.</p>
            {ativo && <button type="button" className="bt sec peq es-bt" onClick={() => limparFoco()}>Mostrar todos</button>}
            <ol className="es-cadeia">
              {cadeia(rs).map((e) => (
                <li key={e.tipo} className={'es-elo' + (ativo === e.tipo ? ' on' : '')} data-elo={e.tipo}>
                  <button type="button" className="es-elo-bt" aria-pressed={ativo === e.tipo} onClick={() => escolhe(e.tipo, e.cadeiras)}>
                    <b className="es-elo-n" aria-hidden="true">{e.ordem}</b>
                    <span className="es-elo-ic" aria-hidden="true">{ICONES[e.tipo]}</span>
                    <span className="es-elo-t"><strong>{e.titulo}</strong>
                      <small>{e.freq} · {e.duracao} · {e.cadeiras.length} {e.cadeiras.length === 1 ? 'cadeira' : 'cadeiras'}</small></span>
                  </button>
                  {e.ids.length > 1 && (
                    <ul className="es-elo-sub">
                      {rs.filter((r) => e.ids.includes(r.id)).map((r) => (
                        <li key={r.id}><button type="button" className="es-elo-sb" aria-pressed={ativo === r.id} onClick={() => escolhe(r.id, r.participantes)}>
                          {r.tipo === 'area' ? `Reunião da área ${r.area}` : `Feedback: ${quem(c, r.participantes[0])} e ${quem(c, r.participantes[1])}`}
                        </button></li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </>))}
        {aba === 'entre' && <p className="sem">As rotinas entre áreas aparecem aqui.</p>}
      </div>
    </div>
  );
}
