'use client';
import { useEffect } from 'react';
import corpo from '@/lib/legacyBody';
import { instalaIlhas } from '@/ilhas/ponte';

// O Guia original (HTML + JS do mandato) roda como está, na ordem abaixo.
// Os módulos novos da Missão 1 (TSE, mapas, parcerias) entram como "ilhas" React
// montadas dentro dos exercícios; veja ilhas/ponte.tsx.
const SCRIPTS = ['conteudo', 'nucleo', 'app', 'guia', 'resumo', 'novos', 'm2', 'sugestoes', 'cadastro', 'iniciar'];

function carrega(nome: string) {
  return new Promise<void>((ok, erro) => {
    const s = document.createElement('script');
    s.src = `/legacy/${nome}.js`;
    s.onload = () => ok();
    s.onerror = () => erro(new Error(`Falha ao carregar ${nome}.js`));
    document.body.appendChild(s);
  });
}

export default function Guia() {
  useEffect(() => {
    const w = window as unknown as { __guiaIniciado?: boolean };
    if (w.__guiaIniciado) return;
    w.__guiaIniciado = true;
    instalaIlhas();
    (async () => {
      for (const n of SCRIPTS) await carrega(n);
    })().catch((e) => console.error(e));
  }, []);
  return <div dangerouslySetInnerHTML={{ __html: corpo }} />;
}
