'use client';
/* Pergunta 3.3 da Missão 1: a equipe escolhe as agendas prioritárias da liderança, sem limite.
   A escolha fica em D.agendasPrio (lista de ids) e define o que a Missão 3 pode priorizar. Regras em lib/agendasPrio.ts. */
import { AGENDAS_PRIO } from '@/lib/agendas';
import { alterna, validas } from '@/lib/agendasPrio';
import { useLegado } from './ponte';

export default function Prioritarias() {
  const { D, bump } = useLegado();
  const lista = validas(D.agendasPrio);

  const clica = (id: string) => {
    D.agendasPrio = alterna(lista, id).lista;
    bump();
  };

  return (
    <div className="ilha-corpo">
      <div className="so-agendas" role="group" aria-label="Agendas prioritárias">
        {AGENDAS_PRIO.map((a) => (
          <button key={a.id} type="button" aria-pressed={lista.includes(a.id)} style={{ ['--c' as string]: a.cor }} onClick={() => clica(a.id)}>{a.rot}</button>
        ))}
      </div>
      <p className="peq-t" role="status" aria-live="polite">
        {lista.length === 0 ? 'Nenhuma agenda escolhida' : `${lista.length} ${lista.length === 1 ? 'agenda escolhida' : 'agendas escolhidas'}`}
        {' · '}Na Missão 3 você poderá priorizar até 3 delas.
      </p>
    </div>
  );
}
