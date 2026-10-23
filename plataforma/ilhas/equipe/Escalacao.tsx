'use client';
/* Missão 2 · Tarefa 1, a escalação do time em 3 etapas: áreas, cadeiras, nomes e liderança.
   A etapa atual fica em D.campos['m2.etapa'] para sobreviver à troca de tela e ao recarregar. */
import { useEffect, useRef } from 'react';
import { coordsDe } from '@/lib/cadeiras';
import EtapaAreas from './EtapaAreas';
import { useEquipe } from './useEquipe';
import './equipe.css';

const ETAPAS = ['Áreas do mandato', 'Cadeiras', 'Nomes e liderança'] as const;
const CHAVE_ETAPA = 'm2.etapa';
const SEM_AREA_MOTIVO = 'Marque ao menos uma área para liberar os nomes.';

export default function Escalacao() {
  const { c, agir } = useEquipe();
  const liberada = coordsDe(c).length > 0;
  const pedida = Math.min(3, Math.max(1, Number(c[CHAVE_ETAPA]) || 1));
  const etapa = !liberada && pedida === 3 ? 2 : pedida;
  const corpo = useRef<HTMLDivElement>(null);
  const primeira = useRef(true);

  /* ao trocar de etapa o foco vai ao primeiro campo dela (ou ao título, se ainda não houver campo) */
  useEffect(() => {
    if (primeira.current) { primeira.current = false; return; }
    const alvo = corpo.current?.querySelector<HTMLElement>('input,select,textarea,button:not([data-passo])') ?? corpo.current?.querySelector<HTMLElement>('h4');
    alvo?.focus();
  }, [etapa]);

  const vai = (n: number) => { if (n === 3 && !liberada) return; agir({ patch: { [CHAVE_ETAPA]: String(n) } }); };

  return (
    <div className="ilha-corpo es-etapa">
      <p className="es-progresso" aria-live="polite">Etapa {etapa} de 3 · {ETAPAS[etapa - 1]}</p>
      <ol className="es-passos">
        {ETAPAS.map((t, k) => {
          const bloqueada = k === 2 && !liberada;
          return (
            <li key={t}>
              <button type="button" data-passo className="es-passo" aria-current={etapa === k + 1 ? 'step' : undefined}
                aria-disabled={bloqueada || undefined} onClick={() => vai(k + 1)}>
                <b aria-hidden="true">{k + 1}</b>{t}
              </button>
            </li>
          );
        })}
      </ol>
      {!liberada && etapa < 3 && <p className="es-motivo" role="status">{SEM_AREA_MOTIVO}</p>}
      <div ref={corpo} className="es-etapa-corpo" data-etapa={etapa}>
        <h4 tabIndex={-1}>{ETAPAS[etapa - 1]}</h4>
        {etapa === 1 && <EtapaAreas />}
      </div>
      <div className="es-nav">
        {etapa > 1 && <button type="button" className="bt sec peq es-bt" onClick={() => vai(etapa - 1)}>Voltar</button>}
        {etapa < 3 && <button type="button" className="bt pri peq es-bt" aria-disabled={(etapa === 2 && !liberada) || undefined} onClick={() => vai(etapa + 1)}>Avançar</button>}
      </div>
    </div>
  );
}
