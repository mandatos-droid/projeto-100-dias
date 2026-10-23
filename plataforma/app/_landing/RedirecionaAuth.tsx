'use client';
import { useEffect } from 'react';
import { destinoAuth } from '@/lib/landing';

/** O login Google pode voltar na raiz com o token no hash; repassa para o Guia sem deixar a raiz no histórico. */
export default function RedirecionaAuth() {
  useEffect(() => {
    const destino = destinoAuth(location.hash);
    if (destino) location.replace(destino);
  }, []);
  return null;
}
