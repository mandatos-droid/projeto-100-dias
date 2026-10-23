'use client';
/* Missão 3 · árvore do planejamento (Legado → objetivos específicos → metas), HTML aninhado com role="tree".
   Usada na prévia dos preditores (T18) e na aba Planejamento (T20). Teclado: setas navegam, Espaço recolhe, Enter aciona o nó. */
import { useState, type KeyboardEvent, type ReactNode } from 'react';
import type { Arvore } from '@/lib/plano';
import './rumo.css';

export interface No {
  id: string;
  tipo: 'legado' | 'objetivo' | 'meta' | 'sem';
  /** nome acessível do nó (lido pelo leitor de tela) */
  rot: string;
  cabeca: ReactNode;
  filhos?: No[];
  /** na aba: 'esmaecido' (fora do filtro de pessoa) ou 'destaque' */
  marca?: 'esmaecido' | 'destaque';
}

const curto = (t: string, n = 110) => (t.length > n ? `${t.slice(0, n).trimEnd()}…` : t);

/** Nós da prévia: Legado e um objetivo por preditor escolhido, com a contagem de metas. */
export function nosPrevia(arv: Arvore): No[] {
  const legado = arv.legado.trim();
  return [{
    id: 'legado', tipo: 'legado',
    rot: legado ? `Legado: ${legado}` : 'Legado ainda não escrito',
    cabeca: (
      <>
        <span className="rm-no-tag">Legado</span>
        <span className={`rm-no-txt rm-no-legado${legado ? '' : ' vazio'}`}>{legado ? curto(legado) : 'Escreva a manchete no exercício do Legado.'}</span>
      </>
    ),
    filhos: arv.objetivos.map((o) => ({
      id: `obj-${o.pid}`, tipo: 'objetivo' as const,
      rot: `Objetivo de ${o.nome}: ${o.texto}. ${o.metas.length} ${o.metas.length === 1 ? 'meta' : 'metas'}`,
      cabeca: (
        <>
          <span className="rm-no-tag obj">{o.nome}</span>
          <span className="rm-no-txt">{o.texto}</span>
          <span className="rm-no-n">{o.metas.length} {o.metas.length === 1 ? 'meta' : 'metas'}</span>
        </>
      ),
    })),
  }];
}

export function ArvoreNos({ nos, rotulo, onAtiva, vazio }: { nos: No[]; rotulo: string; onAtiva?: (id: string) => void; vazio?: string }) {
  const [fechados, setFechados] = useState<Set<string>>(new Set());
  const [foco, setFoco] = useState<string | null>(null);
  const primeiro = foco ?? nos[0]?.id ?? null;
  const alterna = (id: string) => setFechados((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const teclas = (e: KeyboardEvent<HTMLUListElement>) => {
    const li = e.target as HTMLElement;
    if (li.getAttribute('role') !== 'treeitem') return; // teclas dentro de campos e botões não são da árvore
    const itens = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="treeitem"]')];
    const i = itens.indexOf(li);
    const id = li.dataset.no ?? '';
    const tem = li.hasAttribute('aria-expanded');
    const aberto = li.getAttribute('aria-expanded') === 'true';
    const vai = (el?: HTMLElement) => { if (el) { e.preventDefault(); el.focus(); } };
    switch (e.key) {
      case 'ArrowDown': vai(itens[i + 1]); break;
      case 'ArrowUp': vai(itens[i - 1]); break;
      case 'Home': vai(itens[0]); break;
      case 'End': vai(itens[itens.length - 1]); break;
      case 'ArrowRight':
        if (tem && !aberto) { e.preventDefault(); alterna(id); } else if (tem) vai(itens[i + 1]);
        break;
      case 'ArrowLeft':
        if (tem && aberto) { e.preventDefault(); alterna(id); } else vai(li.parentElement?.closest<HTMLElement>('[role="treeitem"]') ?? undefined);
        break;
      case ' ': if (tem) { e.preventDefault(); alterna(id); } else e.preventDefault(); break;
      case 'Enter': if (onAtiva) { e.preventDefault(); onAtiva(id); } break;
    }
  };

  const item = (n: No, nivel: number): ReactNode => {
    const tem = !!n.filhos?.length;
    const aberto = !fechados.has(n.id);
    return (
      <li key={n.id} role="treeitem" data-no={n.id} data-tipo={n.tipo} data-marca={n.marca} aria-level={nivel} aria-label={n.rot}
        aria-expanded={tem ? aberto : undefined} tabIndex={n.id === primeiro ? 0 : -1} onFocus={(e) => { if (e.target === e.currentTarget) setFoco(n.id); }}>
        <div className="rm-no-cab">
          {tem && <button type="button" className="rm-no-bt" tabIndex={-1} aria-hidden="true" onClick={() => alterna(n.id)}>{aberto ? '−' : '+'}</button>}
          {n.cabeca}
        </div>
        {tem && aberto && <ul role="group">{n.filhos!.map((f) => item(f, nivel + 1))}</ul>}
      </li>
    );
  };

  if (!nos.length) return <p className="rm-vazio">{vazio ?? 'Nada para mostrar ainda.'}</p>;
  return <ul role="tree" aria-label={rotulo} className="rm-arvore" onKeyDown={teclas}>{nos.map((n) => item(n, 1))}</ul>;
}

export default function ArvorePlano({ modo, arv, rotulo = 'Árvore do planejamento' }: { modo: 'previa' | 'plano'; arv: Arvore; rotulo?: string }) {
  // o modo "plano" (metas, status, barras) entra na aba do planejamento
  return <ArvoreNos nos={modo === 'previa' ? nosPrevia(arv) : nosPrevia(arv)} rotulo={rotulo} />;
}
