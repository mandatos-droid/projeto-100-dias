import { notFound } from 'next/navigation';
import Harness from './Harness';

/* Rota só de teste: monta as ilhas da Missão 3 sem login, com D/Store simulados (ver e2e/semente-rumo.ts).
   Em produção não existe. */
export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <Harness />;
}
