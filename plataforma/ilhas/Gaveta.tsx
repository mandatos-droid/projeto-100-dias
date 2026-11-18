'use client';
/* Gaveta lateral retrátil compartilhada (Slide-Over Drawer) da Nova Proposta.
   Reutilizável pelas ilhas React (<Gaveta>) e pelo legado JS (window.Gaveta).
   Regras: fecha com Esc e com o botão, move o foco para dentro ao abrir e devolve
   ao botão de origem ao fechar, trava a rolagem da página de trás e nunca descarta dados. */
import { useEffect, useRef, type ReactNode } from 'react';

const SELETOR_FOCAVEL = [
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  'a[href]',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function focaveisDe(raiz: HTMLElement): HTMLElement[] {
  return [...raiz.querySelectorAll<HTMLElement>(SELETOR_FOCAVEL)].filter(
    (el) => !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true' && el.offsetParent !== null,
  );
}

/** Ativa o comportamento padrão de acessibilidade e rolagem em um elemento `.np-drawer`. */
export function ligarComportamentoGaveta(
  painel: HTMLElement,
  aoFechar: () => void,
  origemExplicita?: HTMLElement | null,
): () => void {
  const doc = painel.ownerDocument;
  const origem =
    origemExplicita ?? (doc.activeElement instanceof HTMLElement ? doc.activeElement : null);
  const overflowAnterior = doc.body.style.overflow;
  doc.body.style.overflow = 'hidden';

  const focaInicial = () => {
    if (painel.contains(doc.activeElement)) return;
    const corpo = painel.querySelector<HTMLElement>('.np-drawer-body');
    const primeiroCorpo = corpo ? focaveisDe(corpo)[0] : undefined;
    const botaoFechar = painel.querySelector<HTMLElement>('.np-drawer-x');
    const alvo = primeiroCorpo ?? botaoFechar ?? painel;
    alvo.focus({ preventScroll: true });
  };
  const idRaf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(focaInicial) : 0;
  if (!idRaf) focaInicial();

  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      ev.stopPropagation();
      aoFechar();
      return;
    }
    if (ev.key === 'Tab') {
      const lista = focaveisDe(painel);
      if (!lista.length) {
        ev.preventDefault();
        painel.focus({ preventScroll: true });
        return;
      }
      const primeiro = lista[0];
      const ultimo = lista[lista.length - 1];
      const ativo = doc.activeElement as HTMLElement | null;
      if (ev.shiftKey) {
        if (!ativo || !painel.contains(ativo) || ativo === primeiro) {
          ev.preventDefault();
          ultimo.focus();
        }
      } else if (!ativo || !painel.contains(ativo) || ativo === ultimo) {
        ev.preventDefault();
        primeiro.focus();
      }
    }
  };

  doc.addEventListener('keydown', onKeyDown, true);

  return () => {
    if (idRaf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(idRaf);
    doc.removeEventListener('keydown', onKeyDown, true);
    doc.body.style.overflow = overflowAnterior;
    if (origem && origem.isConnected && typeof origem.focus === 'function') {
      origem.focus({ preventScroll: true });
    }
  };
}

export interface GavetaProps {
  aberta: boolean;
  titulo: string;
  ariaLabel?: string;
  corTopo?: string;
  classeCorpo?: string;
  rodape?: ReactNode;
  origem?: HTMLElement | null;
  onFechar: () => void;
  children: ReactNode;
}

export default function Gaveta({
  aberta,
  titulo,
  ariaLabel,
  corTopo,
  classeCorpo,
  rodape,
  origem,
  onFechar,
  children,
}: GavetaProps) {
  const painelRef = useRef<HTMLElement | null>(null);
  const onFecharRef = useRef(onFechar);
  onFecharRef.current = onFechar;

  useEffect(() => {
    if (!aberta || !painelRef.current) return;
    return ligarComportamentoGaveta(painelRef.current, () => onFecharRef.current(), origem);
  }, [aberta, origem]);

  if (!aberta) return null;

  return (
    <div
      className="np-drawer-veu"
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) onFechar();
      }}
    >
      <aside
        ref={painelRef}
        className="np-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? titulo}
        tabIndex={-1}
      >
        <div className="np-drawer-head" style={corTopo ? { background: corTopo } : undefined}>
          <h3>{titulo}</h3>
          <button type="button" className="np-drawer-x" onClick={onFechar} aria-label="Fechar">
            ×
          </button>
        </div>
        <div className={`np-drawer-body${classeCorpo ? ` ${classeCorpo}` : ''}`}>{children}</div>
        <div className="np-drawer-foot">
          {rodape ?? (
            <button type="button" className="bt sec" onClick={onFechar}>
              Fechar
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

/* ---------- API imperativa para uso direto pelo legado (JS) ---------- */
export interface OpcoesGavetaLegado {
  titulo: string;
  ariaLabel?: string;
  corTopo?: string;
  classeCorpo?: string;
  corpoHtml?: string;
  rodapeHtml?: string;
  origem?: HTMLElement | null;
  aoMontar?: (corpo: HTMLElement, fechar: () => void) => void;
  aoFechar?: () => void;
}

let limpaAtiva: (() => void) | null = null;

export function fecharGavetaLegado() {
  if (limpaAtiva) {
    const fn = limpaAtiva;
    limpaAtiva = null;
    fn();
  }
}

export function abrirGavetaLegado(op: OpcoesGavetaLegado) {
  if (typeof document === 'undefined') return;
  fecharGavetaLegado();

  const veu = document.createElement('div');
  veu.className = 'np-drawer-veu';

  const painel = document.createElement('aside');
  painel.className = 'np-drawer';
  painel.setAttribute('role', 'dialog');
  painel.setAttribute('aria-modal', 'true');
  painel.setAttribute('aria-label', op.ariaLabel ?? op.titulo);
  painel.tabIndex = -1;

  const cab = document.createElement('div');
  cab.className = 'np-drawer-head';
  if (op.corTopo) cab.style.background = op.corTopo;

  const h3 = document.createElement('h3');
  h3.textContent = op.titulo;

  const btX = document.createElement('button');
  btX.type = 'button';
  btX.className = 'np-drawer-x';
  btX.setAttribute('aria-label', 'Fechar');
  btX.textContent = '×';

  cab.appendChild(h3);
  cab.appendChild(btX);

  const corpo = document.createElement('div');
  corpo.className = `np-drawer-body${op.classeCorpo ? ` ${op.classeCorpo}` : ''}`;
  if (op.corpoHtml !== undefined) corpo.innerHTML = op.corpoHtml;

  const rodape = document.createElement('div');
  rodape.className = 'np-drawer-foot';
  if (op.rodapeHtml !== undefined) {
    rodape.innerHTML = op.rodapeHtml;
  } else {
    const btFechar = document.createElement('button');
    btFechar.type = 'button';
    btFechar.className = 'bt sec';
    btFechar.setAttribute('data-gaveta-fechar', '1');
    btFechar.textContent = 'Fechar';
    rodape.appendChild(btFechar);
  }

  painel.appendChild(cab);
  painel.appendChild(corpo);
  painel.appendChild(rodape);
  veu.appendChild(painel);
  document.body.appendChild(veu);

  const fechar = () => fecharGavetaLegado();
  veu.addEventListener('click', (ev) => {
    if (ev.target === veu) fechar();
  });
  btX.addEventListener('click', fechar);
  rodape.querySelectorAll<HTMLElement>('[data-gaveta-fechar]').forEach((b) => {
    b.addEventListener('click', fechar);
  });

  const desliga = ligarComportamentoGaveta(painel, fechar, op.origem);
  limpaAtiva = () => {
    desliga();
    veu.remove();
    op.aoFechar?.();
  };

  op.aoMontar?.(corpo, fechar);
}

export const GavetaLegado = {
  abrir: abrirGavetaLegado,
  fechar: fecharGavetaLegado,
  ligarComportamento: ligarComportamentoGaveta,
};

if (typeof window !== 'undefined') {
  (window as unknown as { Gaveta?: typeof GavetaLegado }).Gaveta = GavetaLegado;
}
