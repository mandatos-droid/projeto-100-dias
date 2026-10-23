'use client';
/* Etapa 1: quais áreas o mandato terá. Cada área marcada traz as cadeiras sugeridas pelo modelo. */
import { AREAS, CHEFIA, alternaArea, ativas, coordsDe, modeloCompleto, sugeridasDaArea } from '@/lib/cadeiras';
import { COR_COORD } from '@/lib/equipe';
import { useEquipe } from './useEquipe';

export default function EtapaAreas() {
  const { c, agir } = useEquipe();
  const marcadas = coordsDe(c);
  const total = ativas(c).length;

  const alterna = (area: string) => {
    const ligar = !marcadas.includes(area);
    const r = alternaArea(c, area, ligar);
    if (r.confirma && !window.confirm(`A área ${area} tem pessoas nomeadas: ${r.confirma.join(', ')}.\n\nElas ficam no gabinete, em "Sem área", e você pode mudar a área depois. Desmarcar mesmo assim?`)) return;
    agir(r);
  };

  return (
    <div>
      <p className="rc-ajuda">Marque as áreas que o mandato terá. Cada área traz as cadeiras que o modelo da Legisla sugere; você ajusta na próxima etapa.</p>
      <ul className="es-areas">
        <li className="es-area fixa">
          <input type="checkbox" checked disabled aria-label="Chefia de gabinete (obrigatória)" />
          <i style={{ background: COR_COORD['Chefia de área'] }} aria-hidden="true" />
          <span><strong>Chefia de gabinete</strong><small>obrigatória, é a cadeira {CHEFIA + 1}</small></span>
        </li>
        {AREAS.map((a) => (
          <li key={a} className={'es-area' + (marcadas.includes(a) ? ' on' : '')}>
            <label>
              <input type="checkbox" checked={marcadas.includes(a)} onChange={() => alterna(a)} />
              <i style={{ background: COR_COORD[a] }} aria-hidden="true" />
              <span><strong>{a}</strong><small>{sugeridasDaArea(a).length} cadeiras sugeridas</small></span>
            </label>
          </li>
        ))}
      </ul>
      <div className="rc-acoes">
        <button type="button" className="bt sec peq es-bt" onClick={() => agir({ patch: modeloCompleto(c) })}>Usar o modelo completo (20 cadeiras)</button>
        <span className="rc-cont" role="status" aria-live="polite"><strong>{total}</strong> {total === 1 ? 'cadeira' : 'cadeiras'} no gabinete</span>
      </div>
    </div>
  );
}
