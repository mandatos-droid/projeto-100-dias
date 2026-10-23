'use client';
/* Missão 3 · árvore do planejamento (Legado → objetivos específicos → metas), HTML aninhado com role="tree".
   Usada na prévia dos preditores (T18) e na aba Planejamento (T20). Teclado: setas navegam, Espaço recolhe, Enter aciona o nó. */
import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { STATUS, pctMeta, pctObjetivo } from '@/lib/atingimento';
import type { Arvore, ItemMeta } from '@/lib/plano';
import type { StatusMeta } from '@/lib/rumo';
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
const semTags = (t?: string) => (t ?? '').replace(/<\/(p|div|li)>|<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
export const pctTxt = (p: number | null) => (p === null ? '—' : `${p}%`);

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

const SIMBOLO: Record<StatusMeta, string> = { concluida: '✓', concluida70: '◐', nao_concluida: '○', congelada: '✱' };
const rotStatus = (id: string) => STATUS.find((x) => x.id === id)?.rot ?? 'Não concluída';

export interface OpcoesPlano {
  /** muda o status de uma meta (posição em D.metas) */
  onStatus: (idx: number, status: StatusMeta) => void;
  /** conteúdo extra dentro do nó da meta (a edição, na T21) */
  extra?: (m: ItemMeta) => ReactNode;
  /** botões do objetivo (acrescentar meta) */
  extraObjetivo?: (pid: string) => ReactNode;
  marca?: (m: ItemMeta) => 'esmaecido' | 'destaque' | undefined;
}

function noMeta(m: ItemMeta, o: OpcoesPlano): No {
  const n = String(m.idx + 1).padStart(2, '0');
  const txt = semTags(m.texto).trim();
  const p = pctMeta(m.status);
  return {
    id: `meta-${m.idx}`, tipo: 'meta', marca: o.marca?.(m),
    rot: `Meta ${n}: ${txt || 'sem texto'}. Status: ${rotStatus(m.status)}${p === null ? ', fora da conta' : `, ${p}%`}`,
    cabeca: (
      <>
        <span className="rm-no-tag">Meta {n}</span>
        <span className="rm-no-txt">{txt ? curto(txt, 160) : <em>Meta ainda sem texto</em>}</span>
        <span className="rm-st" data-status={m.status}><i aria-hidden="true">{SIMBOLO[m.status]}</i>{rotStatus(m.status)}<small>{pctTxt(p)}</small></span>
        <label className="rm-st-sel"><span className="sr">Status da meta {n}</span>
          <select value={m.status} onChange={(e) => o.onStatus(m.idx, e.target.value as StatusMeta)}>
            {STATUS.map((s) => <option key={s.id} value={s.id}>{s.rot}</option>)}
          </select>
        </label>
        {o.extra?.(m)}
      </>
    ),
  };
}

/** Nós da aba: Legado → objetivos (atingimento, barra, contagem por status) → metas; metas sem objetivo em bloco próprio. */
export function nosPlano(arv: Arvore, o: OpcoesPlano): No[] {
  const base = nosPrevia(arv)[0];
  const objs: No[] = arv.objetivos.map((ob) => {
    const p = pctObjetivo(ob.metas);
    const cont = STATUS.map((s) => ({ ...s, n: ob.metas.filter((m) => m.status === s.id).length }));
    return {
      id: `obj-${ob.pid}`, tipo: 'objetivo' as const,
      rot: `Objetivo de ${ob.nome}: ${ob.texto}. Atingimento ${pctTxt(p)}. ${ob.metas.length} ${ob.metas.length === 1 ? 'meta' : 'metas'}`,
      cabeca: (
        <>
          <span className="rm-no-tag obj">{ob.nome}</span>
          <span className="rm-no-txt">{ob.texto}</span>
          <span className="rm-no-pct" data-pct={p ?? ''}>{pctTxt(p)}</span>
          <span className="rm-no-barra" role="progressbar" aria-label={`Atingimento do objetivo ${ob.texto}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={p ?? undefined} aria-valuetext={pctTxt(p)}>
            <i style={{ width: `${p ?? 0}%` }} />
          </span>
          <ul className="rm-cont" aria-label="Metas por status">
            {cont.map((s) => <li key={s.id} data-status={s.id} data-n={s.n}>{s.rot} <b>{s.n}</b></li>)}
          </ul>
          {o.extraObjetivo?.(ob.pid)}
        </>
      ),
      filhos: ob.metas.map((m) => noMeta(m, o)),
    };
  });
  const sem: No[] = arv.semObjetivo.length ? [{
    id: 'sem-objetivo', tipo: 'sem', rot: `Metas sem objetivo: ${arv.semObjetivo.length}`,
    cabeca: (
      <>
        <span className="rm-no-tag">Sem objetivo</span>
        <span className="rm-no-txt">Estas metas não estão ligadas a um objetivo específico e ficam fora do atingimento. Escolha o objetivo delas na Missão 3.</span>
      </>
    ),
    filhos: arv.semObjetivo.map((m) => noMeta(m, o)),
  }] : [];
  return [{ ...base, filhos: objs }, ...sem];
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
      case ' ': e.preventDefault(); if (tem) alterna(id); break;
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

export default function ArvorePlano({ modo, arv, rotulo = 'Árvore do planejamento', opcoes, onAtiva }: { modo: 'previa' | 'plano'; arv: Arvore; rotulo?: string; opcoes?: OpcoesPlano; onAtiva?: (id: string) => void }) {
  return <ArvoreNos nos={modo === 'plano' && opcoes ? nosPlano(arv, opcoes) : nosPrevia(arv)} rotulo={rotulo} onAtiva={onAtiva} />;
}
