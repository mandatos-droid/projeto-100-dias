'use client';

import { useEffect, useId, useRef, useState } from 'react';

export interface Confirmacao {
  rotulo: string;
  // Pode ser assíncrona: o botão fica desabilitado até ela terminar (evita duplo clique).
  executar: () => Promise<void> | void;
  desabilitado?: boolean;
  perigo?: boolean;
}

interface Props {
  titulo: string;
  onFechar: () => void;
  confirmar?: Confirmacao;
  erro?: string;
  children?: React.ReactNode;
}

const FOCAVEIS = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

// Diálogo modal e de confirmação. Quem usa o monta só enquanto está aberto (render condicional).
export default function Dialogo({ titulo, onFechar, confirmar, erro, children }: Props) {
  const idTitulo = useId();
  const caixa = useRef<HTMLDivElement>(null);
  const emCurso = useRef(false); // trava síncrona: o estado só atualiza no próximo render e um duplo clique rápido passaria
  const [enviando, setEnviando] = useState(false);
  const montado = useRef(true);
  const fechar = useRef(onFechar);
  fechar.current = onFechar;

  // Foco entra no diálogo ao abrir e volta ao botão de origem ao fechar.
  useEffect(() => {
    const origem = document.activeElement as HTMLElement | null;
    const primeiro = caixa.current?.querySelector<HTMLElement>('input, select, textarea') ?? caixa.current?.querySelector<HTMLElement>(FOCAVEIS);
    (primeiro ?? caixa.current)?.focus();
    montado.current = true;
    return () => { montado.current = false; origem?.focus?.(); };
  }, []);

  function aoTeclar(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      if (!emCurso.current) fechar.current(); // não fecha no meio da chamada
      return;
    }
    if (e.key !== 'Tab' || !caixa.current) return;
    // foco preso: Tab no último volta ao primeiro e Shift+Tab no primeiro vai ao último
    const itens = [...caixa.current.querySelectorAll<HTMLElement>(FOCAVEIS)];
    if (!itens.length) { e.preventDefault(); return; }
    const primeiro = itens[0];
    const ultimo = itens[itens.length - 1];
    const ativo = document.activeElement;
    if (e.shiftKey && (ativo === primeiro || ativo === caixa.current)) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && ativo === ultimo) { e.preventDefault(); primeiro.focus(); }
  }

  async function envia(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmar || confirmar.desabilitado || emCurso.current) return;
    emCurso.current = true;
    setEnviando(true);
    try {
      await confirmar.executar();
    } finally {
      emCurso.current = false;
      if (montado.current) setEnviando(false);
    }
  }

  return (
    <div className="modal" onKeyDown={aoTeclar}>
      <div className="dlg" role="dialog" aria-modal="true" aria-labelledby={idTitulo} ref={caixa} tabIndex={-1}>
        <form onSubmit={envia}>
          <h3 id={idTitulo}>{titulo}</h3>
          {children}
          {erro && <div className="aviso" role="alert">{erro}</div>}
          <div className="bar fim">
            <button type="button" className="btn" onClick={onFechar} disabled={enviando}>Cancelar</button>
            {confirmar && (
              <button type="submit" className={`btn ${confirmar.perigo ? 'bad' : 'pri'}`} disabled={enviando || confirmar.desabilitado}>
                {confirmar.rotulo}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
