'use client';
/* Missão 2 · Mão na massa 2: o quadro-modelo das 5 rotinas do mandato. A Legisla sugere o modelo; o mandato concorda e marca
   data e horário de início, ou altera frequência, participantes e duração e liga/desliga cada rotina. Tudo grava na hora em m2.rq. */
import { useEffect, useState } from 'react';
import { MODELO, agendadas, areasDoMandato, concluida, dataPassada, editaRotina, lerQuadro, type RotinaQ } from '@/lib/quadroRotinas';
import { useEquipe } from './useEquipe';
import './equipe.css';

type Edita = (id: string, parcial: Parameters<typeof editaRotina>[2]) => void;

/** Campo de texto com rascunho: apagar tudo para reescrever não devolve na hora o texto do modelo. */
function Texto({ rotulo, valor, onChange }: { rotulo: string; valor: string; onChange: (v: string) => void }) {
  const [d, setD] = useState(valor);
  useEffect(() => { if (valor !== d && d.trim() !== '') setD(valor); }, [valor]); // eslint-disable-line react-hooks/exhaustive-deps
  return <input type="text" aria-label={rotulo} value={d} onChange={(e) => { setD(e.target.value); onChange(e.target.value); }} onBlur={() => { if (d.trim() === '') setD(valor); }} />;
}

function Linha({ r, areas, edita }: { r: RotinaQ; areas: string[]; edita: Edita }) {
  const passada = !!r.data && dataPassada(r.data);
  return (
    <tr data-rotina={r.id} className={r.on ? '' : 'desligada'}>
      <th scope="row" data-label="Rotina">
        {r.titulo}
        <label className="es-rq-liga"><input type="checkbox" aria-label={`Rotina ligada: ${r.titulo}`} checked={r.on} onChange={(e) => edita(r.id, { on: e.target.checked ? undefined : false })} /> {r.on ? 'ligada' : 'desligada'}</label>
      </th>
      <td data-label="Frequência"><Texto rotulo={`Frequência: ${r.titulo}`} valor={r.freq} onChange={(v) => edita(r.id, { freq: v })} /></td>
      <td data-label="Quem participa">
        <Texto rotulo={`Quem participa: ${r.titulo}`} valor={r.quem} onChange={(v) => edita(r.id, { quem: v })} />
        {r.id === 'area' && areas.length > 0 && <small className="es-tab-leg" data-areas>Áreas do mandato: {areas.join(', ')}</small>}
      </td>
      <td data-label="Duração média"><Texto rotulo={`Duração média: ${r.titulo}`} valor={r.dur} onChange={(v) => edita(r.id, { dur: v })} /></td>
      <td data-label="Quando o mandato iniciará a rotina?">
        <div className="es-rq-quando">
          <input type="date" aria-label={`Data de início: ${r.titulo}`} value={r.data ?? ''} disabled={!r.on} onChange={(e) => edita(r.id, { data: e.target.value })} />
          <input type="time" aria-label={`Horário de início: ${r.titulo}`} value={r.hora ?? ''} disabled={!r.on} onChange={(e) => edita(r.id, { hora: e.target.value })} />
        </div>
        {!r.on && <small className="es-tab-leg">Rotina desligada: não precisa de data.</small>}
        {passada && <small className="es-tab-leg ps" role="note">Essa data já passou. Você pode mantê-la, é só um aviso.</small>}
      </td>
    </tr>
  );
}

export default function QuadroRotinas() {
  const { c, agir } = useEquipe();
  const quadro = lerQuadro(c);
  const { n, total } = agendadas(c);
  const areas = areasDoMandato(c);
  const edita: Edita = (id, parcial) => { agir({ patch: editaRotina(c, id, parcial) }); };

  return (
    <div className="ilha-corpo es-rq-ilha">
      <p className="es-tab-contador" data-contador><strong>{n} de {total}</strong> agendadas</p>
      {concluida(c) && <p className="apoio" role="status" data-concluida>Todas as rotinas ligadas têm data e horário. Você já pode marcar o exercício como concluído.</p>}
      <div className="es-tab-rolagem">
        <table className="es-tab es-rq">
          <thead>
            <tr><th scope="col">Rotina</th><th scope="col">Frequência</th><th scope="col">Quem participa</th><th scope="col">Duração média</th><th scope="col">Quando o mandato iniciará a rotina?</th></tr>
          </thead>
          <tbody>{quadro.map((r) => <Linha key={r.id} r={r} areas={areas} edita={edita} />)}</tbody>
        </table>
      </div>
      <p className="es-tab-ajuda">São {MODELO.length} rotinas sugeridas pela Legisla. Desligue as que o mandato não vai adotar: elas saem da contagem e do PDF.</p>
    </div>
  );
}
