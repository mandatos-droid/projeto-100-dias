'use client';
import { useEffect, useState, type KeyboardEvent } from 'react';
import { resumo } from '@/lib/demo';
import type { Eleito } from '@/lib/types';

type Props = {
  valor: string;
  sugestoes: Eleito[];
  onValor: (v: string) => void;
  onEscolhe: (e: Eleito) => void;
};

/** Campo de busca com lista de sugestões (padrão ARIA combobox): setas movem, Enter escolhe, Esc fecha. */
export default function BuscaEleito({ valor, sugestoes, onValor, onEscolhe }: Props) {
  const [ativo, setAtivo] = useState(0);
  const [aberto, setAberto] = useState(true);
  const mostra = aberto && sugestoes.length > 0;

  useEffect(() => { setAtivo(0); setAberto(true); }, [valor]);

  function escolhe(e: Eleito) {
    setAberto(false);
    onEscolhe(e);
  }

  function tecla(ev: KeyboardEvent<HTMLInputElement>) {
    if (ev.key === 'Escape') { setAberto(false); return; }
    if (!mostra) return;
    if (ev.key === 'ArrowDown') { ev.preventDefault(); setAtivo((i) => (i + 1) % sugestoes.length); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); setAtivo((i) => (i - 1 + sugestoes.length) % sugestoes.length); }
    else if (ev.key === 'Enter') { ev.preventDefault(); escolhe(sugestoes[ativo]); }
  }

  return (
    <div className="ld-busca">
      <label htmlFor="ld-busca-campo">Digite o nome de um(a) parlamentar eleito(a) em 2026</label>
      <input
        id="ld-busca-campo"
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={mostra}
        aria-controls="ld-busca-lista"
        aria-activedescendant={mostra ? `ld-op-${ativo}` : undefined}
        placeholder="Ex.: Silva"
        value={valor}
        onChange={(ev) => onValor(ev.target.value)}
        onKeyDown={tecla}
      />
      {mostra && (
        <ul id="ld-busca-lista" className="ld-lista" role="listbox" aria-label="Parlamentares encontrados">
          {sugestoes.map((e, i) => (
            <li
              key={e.s}
              id={`ld-op-${i}`}
              className="ld-op"
              role="option"
              aria-selected={i === ativo}
              onMouseEnter={() => setAtivo(i)}
              onMouseDown={(ev) => { ev.preventDefault(); escolhe(e); }}
            >
              <span>
                <strong>{e.u}</strong>
                <small>{resumo(e, []).cargo} · {e.p} · {e.uf}</small>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
