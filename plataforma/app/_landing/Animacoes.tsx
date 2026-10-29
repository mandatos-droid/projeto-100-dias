'use client';
import { useEffect } from 'react';

/** O que entra com fade-and-rise ao rolar. Os seletores ficam aqui para os componentes de servidor não precisarem de atributos. */
const REVELAR = [
  '.ld-sec .ld-eyebrow', '.ld-sec .ld-h2', '.ld-sec .ld-lead', '.ld-demo-box', '.ld-pos-demo',
  '.ld-dor li', '.ld-miss li', '.ld-feat article', '.ld-conf > div', '.ld-faq details', '.ld-fecha .ld-bt',
].join(',');

const CURVA = (t: number) => 1 - Math.pow(1 - t, 3);

function contar(el: HTMLElement) {
  const alvo = Number(el.dataset.conta);
  if (!Number.isFinite(alvo)) return;
  const ini = performance.now();
  const passo = (agora: number) => {
    const t = Math.min((agora - ini) / 1100, 1);
    el.textContent = String(Math.round(alvo * CURVA(t)));
    if (t < 1) requestAnimationFrame(passo);
  };
  el.textContent = '0';
  requestAnimationFrame(passo);
}

/**
 * Movimento da landing: revelação ao rolar, contagem dos dias, fio da linha do tempo e sombra do topo.
 * Com "reduzir movimento" ligado não faz nada, e a página fica no estado final de sempre.
 */
export default function Animacoes() {
  useEffect(() => {
    const raiz = document.querySelector<HTMLElement>('.ld');
    const topo = document.querySelector<HTMLElement>('.ld-topo');
    if (!raiz) return;

    let rolagem = 0;
    const emRolagem = () => {
      rolagem = 0;
      topo?.classList.toggle('is-rolou', window.scrollY > 8);
      const ol = raiz.querySelector<HTMLElement>('.ld-miss');
      if (!ol) return;
      const linha = window.innerHeight * 0.65;
      const r = ol.getBoundingClientRect();
      ol.style.setProperty('--fio', `${Math.max(0, Math.min(linha - r.top, r.height))}px`);
      ol.querySelectorAll<HTMLElement>('li').forEach((li) => {
        const b = li.getBoundingClientRect();
        if (b.top + 34 > linha || li.classList.contains('is-on')) return;
        li.classList.add('is-on');
        const n = li.querySelector<HTMLElement>('[data-conta]');
        if (n) contar(n);
      });
    };
    const agendar = () => { if (!rolagem) rolagem = requestAnimationFrame(emRolagem); };
    window.addEventListener('scroll', agendar, { passive: true });
    emRolagem();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => window.removeEventListener('scroll', agendar);
    }

    const filhos = new Map<Element, number>();
    const itens = Array.from(raiz.querySelectorAll<HTMLElement>(REVELAR));
    itens.forEach((el) => {
      const n = filhos.get(el.parentElement as Element) ?? 0;
      filhos.set(el.parentElement as Element, n + 1);
      el.dataset.ldRev = '';
      el.style.setProperty('--rd', `${Math.min(n, 5) * 90}ms`);
    });
    raiz.classList.add('ld-anima');
    emRolagem();

    const obs = new IntersectionObserver((vistos) => {
      vistos.forEach((v) => {
        if (!v.isIntersecting) return;
        const el = v.target as HTMLElement;
        el.classList.add('is-in');
        obs.unobserve(el);
        // terminada a entrada, o atributo sai para não segurar o hover do elemento
        window.setTimeout(() => { delete el.dataset.ldRev; el.style.removeProperty('--rd'); }, 1500);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    itens.forEach((el) => obs.observe(el));

    return () => {
      obs.disconnect();
      window.removeEventListener('scroll', agendar);
      cancelAnimationFrame(rolagem);
      raiz.classList.remove('ld-anima');
    };
  }, []);
  return null;
}
