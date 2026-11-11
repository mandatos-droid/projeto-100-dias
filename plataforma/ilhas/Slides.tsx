'use client';
import { useState, type ReactNode } from 'react';
import { emSlides } from '@/lib/indicadoresSociais';

/** Carrossel por páginas: mostra `tam` itens por slide, com Anterior/Próximo e o indicador "Slide X de Y".
 *  Se a lista encolher (um cartão removido), o slide atual volta para o último que ainda existe. */
export default function Slides<T>({ itens, tam = 4, rotulo, chave, render, vazio }: {
  itens: T[]; tam?: number; rotulo: string; chave: (item: T) => string; render: (item: T) => ReactNode; vazio?: ReactNode;
}) {
  const [i, setI] = useState(0);
  const slides = emSlides(itens, tam);
  const total = slides.length;
  if (!total) return <>{vazio ?? null}</>;
  const at = Math.min(i, total - 1);
  return (
    <section className="slides" aria-roledescription="carrossel" aria-label={rotulo}>
      <div className="slides-lista" role="list">
        {slides[at].map((it) => <div key={chave(it)} role="listitem" className="slides-item">{render(it)}</div>)}
      </div>
      <nav className="slides-nav" aria-label={`Navegação: ${rotulo}`}>
        <button type="button" className="bt fant peq" disabled={at === 0} onClick={() => setI(at - 1)}>‹ Anterior</button>
        <span className="peq-t" role="status" aria-live="polite" aria-atomic="true">Slide {at + 1} de {total}</span>
        <button type="button" className="bt fant peq" disabled={at >= total - 1} onClick={() => setI(at + 1)}>Próximo ›</button>
      </nav>
    </section>
  );
}
