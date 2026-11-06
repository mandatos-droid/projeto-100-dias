'use client';

import { rotuloPapel } from '../../lib/convites/papeis.ts';
import { nomeDoMandato, useMandato } from './contexto.ts';

// Página inicial mínima da casca; a Área do mandato (AreaMandato) a substitui na tarefa seguinte.
export default function PaginaMandato() {
  const { mandato, papel } = useMandato();
  return (
    <section className="md-pilha">
      <h1>{nomeDoMandato(mandato)}</h1>
      <p className="md-mut">Seu papel: <strong data-testid="papel-ativo">{rotuloPapel(papel)}</strong></p>
    </section>
  );
}
