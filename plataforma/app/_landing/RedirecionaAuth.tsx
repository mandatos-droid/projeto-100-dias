'use client';
import { useEffect } from 'react';
import { destinoAuth } from '@/lib/landing';
import { lePendente } from '@/lib/convites/pendente';

/** O login Google pode voltar na raiz com o token no hash; repassa para o Guia (ou para o convite pendente) sem deixar a raiz no histórico. */
export default function RedirecionaAuth() {
  useEffect(() => {
    let pendente: string | null = null;
    try {
      pendente = lePendente(sessionStorage);
    } catch {
      /* sessionStorage indisponível: segue para o Guia */
    }
    const destino = destinoAuth(location.hash, pendente);
    if (destino) location.replace(destino);
  }, []);
  return null;
}
