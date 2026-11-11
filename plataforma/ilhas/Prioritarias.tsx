'use client';
/* Pergunta 3.3 da Missão 1: a equipe escolhe as 3 agendas prioritárias da liderança entre as 13 agendas temáticas.
   A escolha fica em D.agendasPrio (lista de ids). Regras em lib/agendasPrio.ts. */
import { useState } from 'react';
import { AGENDAS } from '@/lib/agendas';
import { MAX_PRIO, alterna, faltam } from '@/lib/agendasPrio';
import { useLegado } from './ponte';

export const MSG_CHEIO = 'Você já escolheu 3 agendas. Desmarque uma para trocar.';

export default function Prioritarias() {
  const { D, bump } = useLegado();
  const [aviso, setAviso] = useState('');
  const lista = (D.agendasPrio ?? []).filter((id) => AGENDAS.some((a) => a.id === id));
  const falta = faltam(lista);

  const clica = (id: string) => {
    const r = alterna(lista, id);
    if (r.erro === 'cheio') { setAviso(MSG_CHEIO); return; }
    setAviso('');
    D.agendasPrio = r.lista;
    bump();
  };

  return (
    <div className="ilha-corpo">
      <div className="so-agendas" role="group" aria-label="Agendas prioritárias">
        {AGENDAS.map((a) => (
          <button key={a.id} type="button" aria-pressed={lista.includes(a.id)} style={{ ['--c' as string]: a.cor }} onClick={() => clica(a.id)}>{a.rot}</button>
        ))}
      </div>
      <p className="peq-t" role="status" aria-live="polite">
        {falta > 0 ? `${lista.length} de ${MAX_PRIO} escolhidas · faltam ${falta}` : `${MAX_PRIO} de ${MAX_PRIO} escolhidas`}
        {aviso && <> · <strong style={{ color: 'var(--erro, #B3261E)' }}>{aviso}</strong></>}
      </p>
    </div>
  );
}
