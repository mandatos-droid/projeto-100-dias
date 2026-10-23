'use client';
import { useEffect, useState } from 'react';
import { instalaIlhas } from '@/ilhas/ponte';

type Janela = Window & {
  __semente?: { campos?: Record<string, string> };
  D?: unknown; Store?: unknown; aviso?: (t: string) => void;
  Ilhas?: { ligar(raiz: HTMLElement): void };
  CARGOS_EQUIPE?: unknown;
};
const CHAVE = 'teste-equipe.campos';

/* ?ilha=a,b monta as ilhas pedidas (nomes de data-ilha da ponte). window.__semente = {campos} preenche D.campos antes de montar. */
export default function Harness() {
  const [nomes, setNomes] = useState<string[]>([]);
  const [pronto, setPronto] = useState(false);
  const [avisos, setAvisos] = useState<string[]>([]);

  useEffect(() => {
    const w = window as Janela;
    const pedido = new URLSearchParams(location.search).get('ilha') ?? '';
    const campos = w.__semente?.campos ?? JSON.parse(localStorage.getItem(CHAVE) ?? '{}');
    const D = { campos, relacoes: {}, tse: {}, feitos: {} };
    w.D = D;
    w.Store = { mandato: {}, salvar() { localStorage.setItem(CHAVE, JSON.stringify(D.campos)); }, atualizar: async () => {} };
    w.aviso = (t: string) => setAvisos((a) => [...a, t]);
    const s = document.createElement('script'); // traz CARGOS_EQUIPE e ROTINAS, os dados reais do Guia
    s.src = '/legacy/conteudo.js';
    s.onload = () => { instalaIlhas(); setNomes(pedido.split(',').filter(Boolean)); setPronto(true); };
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    const raiz = document.getElementById('tela');
    if (pronto && raiz) (window as Janela).Ilhas?.ligar(raiz);
  }, [pronto, nomes]);

  return (
    <>
      <link rel="stylesheet" href="/legacy/legacy.css" />
      <link rel="stylesheet" href="/legacy/ilhas.css" />
      <div id="tela" className="tela largo" data-pronto={pronto}>
        {nomes.map((n) => <div key={n} className="ilha" data-ilha={n} />)}
      </div>
      <div role="status" aria-live="polite" id="avisos">{avisos.map((a, i) => <p key={i}>{a}</p>)}</div>
    </>
  );
}
