'use client';
/* Seleção múltipla em chips (escopo, habilidades, repertório). */
export default function Chips({ opcoes, valor, onChange, rotulo }: { opcoes: readonly string[]; valor: string[]; onChange: (v: string[]) => void; rotulo: string }) {
  return (
    <div className="eq-chips" role="group" aria-label={rotulo}>
      {opcoes.map((o) => {
        const on = valor.includes(o);
        return (
          <button key={o} type="button" className={'eq-chip' + (on ? ' on' : '')} aria-pressed={on}
            onClick={() => onChange(on ? valor.filter((x) => x !== o) : [...valor, o])}>
            {o}
          </button>
        );
      })}
    </div>
  );
}
