'use client';
/* Missão 3 · aba Planejamento Estratégico: árvore Legado → objetivos → metas, com status por meta e atingimento por objetivo e total.
   Lê e grava os mesmos dados do exercício (D.metas, D.preditores, D.rumo); a edição usa o mesmo CartaoMeta. */
import { useState } from 'react';
import { pctObjetivo, pctTotal } from '@/lib/atingimento';
import { podeAcrescentarMeta } from '@/lib/plano';
import { resolve } from '@/lib/pessoas';
import ArvorePlano, { pctTxt } from './ArvorePlano';
import CartaoMeta from './CartaoMeta';
import { useRumo } from './useRumo';
import './rumo.css';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

function Anel({ pct }: { pct: number | null }) {
  const r = 42, c = 2 * Math.PI * r;
  return (
    <div className="rm-anel" role="img" aria-label={pct === null ? 'Atingimento total do planejamento: ainda sem metas ativas' : `Atingimento total do planejamento: ${pct}%`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="fundo" />
        <circle cx="50" cy="50" r={r} className="valor" strokeDasharray={`${(c * (pct ?? 0)) / 100} ${c}`} transform="rotate(-90 50 50)" />
      </svg>
      <b data-total={pct ?? ''}>{pctTxt(pct)}</b>
    </div>
  );
}

export default function Plano() {
  const { d, c, arv, objetivos, pessoas, metas, setMeta, addMeta, rmMeta } = useRumo();
  const [editando, setEditando] = useState<number | null>(null);
  const [filtro, setFiltro] = useState('');
  const total = pctTotal(arv.objetivos.map((o) => pctObjetivo(o.metas)));
  const vazio = !arv.objetivos.some((o) => o.metas.length > 0);
  const nMetas = metas.length;

  const podeMover = (pid: string) => { const r = podeAcrescentarMeta(d, pid); return r.ok ? null : r.motivo ?? ''; };
  const remove = (idx: number) => {
    if (!window.confirm('Remover esta meta? O texto dela será apagado.')) return;
    setEditando(null);
    rmMeta(idx);
  };
  const acrescenta = (pid: string) => {
    if (addMeta(pid) === null) setEditando((Array.isArray(d.metas) ? d.metas.length : 1) - 1);
  };

  /* filtro por pessoa: as da Missão 2 e os nomes livres que já aparecem nas metas */
  const nomesDasMetas = (m: (typeof metas)[number]) => { const r = resolve(c, m); return [r.resp, ...r.apoios].filter(Boolean); };
  const gente = [...new Map([...pessoas.map((p) => p.nome), ...metas.flatMap(nomesDasMetas)].map((n) => [norm(n), n])).values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const daPessoa = (m: (typeof metas)[number]) => nomesDasMetas(m).some((n) => norm(n) === norm(filtro));

  const opcoes = {
    onStatus: (idx: number, status: Parameters<typeof setMeta>[1]['status'] & string) => setMeta(idx, { status }),
    marca: (m: (typeof metas)[number]) => (filtro ? (daPessoa(m) ? ('destaque' as const) : ('esmaecido' as const)) : undefined),
    extraObjetivo: (pid: string) => (
      <button type="button" className="bt sec peq rm-nao-imprime" aria-label={`Acrescentar meta a ${objetivos.find((o) => o.pid === pid)?.texto ?? pid}`} onClick={() => acrescenta(pid)}>Acrescentar meta</button>
    ),
    extra: (m: (typeof metas)[number]) => (
      <>
        <button type="button" className="rm-link rm-nao-imprime" aria-expanded={editando === m.idx} aria-label={`${editando === m.idx ? 'Fechar a edição da' : 'Editar a'} meta ${String(m.idx + 1).padStart(2, '0')}`}
          onClick={() => setEditando(editando === m.idx ? null : m.idx)}>{editando === m.idx ? 'Fechar' : 'Editar'}</button>
        {editando === m.idx && (
          <div className="rm-no-edicao rm-nao-imprime">
            <CartaoMeta meta={m} objetivos={objetivos} pessoas={pessoas} campos={c} comStatus podeMover={podeMover} onChange={setMeta} onRemove={remove} />
          </div>
        )}
      </>
    ),
  };

  return (
    <div className="ilha-corpo rm-plano" data-n-metas={nMetas} data-imprime="">
      {vazio && (
        <div className="rm-plano-vazio">
          <h4>O planejamento ainda não tem metas</h4>
          <p>Ele aparece aqui assim que um preditor tiver ao menos uma meta. Escolha os preditores e escreva as metas na Missão 3.</p>
          <a className="bt pri" href="#/m/3/m3.preditores">Ir para a Missão 3</a>
        </div>
      )}
      {(!vazio || arv.semObjetivo.length > 0) && (
        <>
          <div className="rm-plano-topo">
            <Anel pct={total} />
            <div>
              <p className="rm-plano-t">Atingimento total</p>
              <p className="rm-dica">Média simples dos objetivos que têm ao menos uma meta ativa. Meta congelada fica fora da conta; meta sem status vale 0.</p>
            </div>
            <div className="rm-plano-acoes rm-nao-imprime">
              <label className="campo"><span className="rot">Filtrar por pessoa</span>
                <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                  <option value="">Todas as pessoas</option>
                  {gente.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <button type="button" className="bt sec peq" onClick={() => window.print()}>Imprimir</button>
            </div>
          </div>
          {filtro && <p className="rm-dica rm-nao-imprime" role="status">Em destaque: metas em que {filtro} é responsável ou apoio. As demais ficam esmaecidas.</p>}
          <ArvorePlano modo="plano" arv={arv} opcoes={opcoes}
            onAtiva={(id) => { if (id.startsWith('meta-')) { const i = Number(id.slice(5)); setEditando(editando === i ? null : i); } }} />
        </>
      )}
    </div>
  );
}
