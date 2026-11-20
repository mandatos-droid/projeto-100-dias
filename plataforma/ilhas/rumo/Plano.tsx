'use client';
/* Missão 3 · aba Planejamento Estratégico: árvore Legado → objetivos → metas, com status por meta e atingimento por objetivo e total.
   Lê e grava os mesmos dados do exercício (D.metas, D.preditores, D.rumo); a edição usa o mesmo CartaoMeta. */
import { useRef, useState } from 'react';
import { pctObjetivo, pctPlano, statusPorAtingimento } from '@/lib/atingimento';
import { abrirCiclo, excluiPlano, lerPlanos, listaCiclos, renomeiaPlano } from '@/lib/ciclos';
import { OBJETIVOS_LEGISLA, lerEstrategia, lerJustificativa } from '@/lib/estrategia';
import { PREDITORES, podeAcrescentarMeta } from '@/lib/plano';
import { resolve } from '@/lib/pessoas';
import { quadroRotinasHtml } from '@/lib/exporta';
import { dataOk, lerQuadro } from '@/lib/quadroRotinas';
import { editaSucesso, lerSucessos } from '@/lib/sucessos';
import ArvorePlano, { pctTxt } from './ArvorePlano';
import CartaoMeta from './CartaoMeta';
import EditorPlano from './EditorPlano';
import Gaveta from '../Gaveta';
import { aviso } from '../ponte';
import { BOTAO_MONIT } from './textosAlana';
import { useRumo } from './useRumo';
import './rumo.css';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

export function Anel({ pct }: { pct: number | null }) {
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

const ESTRATEGIA_TXT = {
  a: 'os preditores escolhidos são os Objetivos Estratégicos.',
  b: 'os preditores foram traduzidos em outra frase, que são os Objetivos Estratégicos.',
  c: 'os preditores norteiam as metas; os Objetivos Estratégicos de referência são os 3 sugeridos pela Legisla.',
} as const;

/** Estratégia escolhida na Missão 3 e as justificativas dos preditores. Só mostra; a árvore abaixo não depende dela. */
function EstrategiaPlano({ campos, escolhidos }: { campos: Record<string, string>; escolhidos: string[] }) {
  const e = lerEstrategia(campos, escolhidos);
  const justificadas = PREDITORES.filter((p) => lerJustificativa(campos, p.id).trim() !== '');
  if (!e && justificadas.length === 0) return null;
  return (
    <section className="rm-est-plano" aria-label="Estratégia dos objetivos" data-estrategia-plano={e ?? ''}>
      {e && <p className="rm-est-linha"><b>Estratégia dos objetivos: {e.toUpperCase()}</b>. {ESTRATEGIA_TXT[e][0].toUpperCase() + ESTRATEGIA_TXT[e].slice(1)}</p>}
      {e === 'c' && (
        <div className="rm-est-ref" role="note">
          <p className="rm-dica">Objetivos Estratégicos sugeridos pela Legisla, como referência do mandato:</p>
          <ol>{OBJETIVOS_LEGISLA.map((x) => <li key={x}>{x}</li>)}</ol>
        </div>
      )}
      {justificadas.length > 0 && (
        <details className="rm-est-just">
          <summary>Justificativas dos preditores ({justificadas.length} de {PREDITORES.length})</summary>
          <ul>
            {PREDITORES.map((p) => {
              const txt = lerJustificativa(campos, p.id).trim();
              return (
                <li key={p.id} data-just={p.id}>
                  <b>{p.n}</b> <span className="rm-dica">({escolhidos.includes(p.id) ? 'escolhido' : 'não escolhido'})</span>
                  <p>{txt || 'Sem justificativa escrita.'}</p>
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </section>
  );
}

/** Rotinas ligadas do quadro da Missão 2, no fim da aba (e da impressão do planejamento). Sem início definido, leva à Missão 2. */
function RotinasPlano({ campos }: { campos: Record<string, string> }) {
  const rotinas = lerQuadro(campos);
  const ligadas = rotinas.filter((r) => r.on);
  const semInicio = !ligadas.some((r) => dataOk(r.data));
  return (
    <section className="rm-rotinas" aria-label="Rotinas do mandato" data-rotinas-plano>
      <h4>Rotinas do mandato</h4>
      {ligadas.length === 0
        ? <p className="rm-dica">Nenhuma rotina está ligada. Ligue as rotinas na Missão 2.</p>
        : <div dangerouslySetInnerHTML={{ __html: quadroRotinasHtml(rotinas) }} />}
      {semInicio && <p className="rm-dica rm-nao-imprime" data-sem-inicio>Início ainda não definido. <a href="#/m/2/m2.gestao">Defina a data de início na Missão 2</a>.</p>}
    </section>
  );
}

export default function Plano() {
  const { d, c, arv, objetivos, pessoas, metas, setMeta, addMeta, rmMeta, bump } = useRumo();
  const [editando, setEditando] = useState<{ idx: number; modo: 'gaveta' | 'inline'; origem?: HTMLElement | null } | null>(null);
  const [filtro, setFiltro] = useState('');
  const [ordenar, setOrdenar] = useState(false);
  const [ver, setVer] = useState<number | null>(null); // planejamento arquivado aberto para leitura; null = o atual
  /* Missão 5: a última meta mexida aqui é a que o Monitoramento abre; o legado lê window.MonitFoco (public/legacy/m5.js) */
  const ultima = useRef<string | null>(null);
  const lembra = (idx: number) => { ultima.current = metas.find((x) => x.idx === idx)?.id ?? null; };
  const irMonitoramento = (id?: string | null) => {
    (window as unknown as { MonitFoco?: string }).MonitFoco = id ?? undefined;
    window.location.hash = '#/m/5/m5.monit';
  };
  const total = pctPlano(arv.objetivos);
  const vazio = !arv.objetivos.some((o) => o.metas.length > 0);
  const nMetas = metas.length;
  const escolhidos = arv.objetivos.map((o) => o.pid);
  const temEstrategia = lerEstrategia(c, escolhidos) !== null || PREDITORES.some((p) => lerJustificativa(c, p.id).trim() !== '');
  /* "Ordenar por atingimento": do menor para o maior; objetivo sem atingimento ("—") vai ao fim; empate mantém a ordem dos preditores */
  const ordenado = ordenar
    ? { ...arv, objetivos: arv.objetivos.map((o, i) => ({ o, i, p: pctObjetivo(o.metas) })).sort((a, b) => (a.p ?? Infinity) - (b.p ?? Infinity) || a.i - b.i).map((x) => x.o) }
    : arv;

  const podeMover = (pid: string) => { const r = podeAcrescentarMeta(d, pid); return r.ok ? null : r.motivo ?? ''; };
  const remove = (idx: number) => {
    if (!window.confirm('Remover esta meta? O texto dela será apagado.')) return;
    setEditando(null);
    rmMeta(idx);
  };
  const acrescenta = (pid: string) => {
    if (addMeta(pid) === null) setEditando({ idx: (Array.isArray(d.metas) ? d.metas.length : 1) - 1, modo: 'inline' });
  };

  /* filtro por pessoa: as da Missão 2 e os nomes livres que já aparecem nas metas */
  const nomesDasMetas = (m: (typeof metas)[number]) => { const r = resolve(c, m); return [r.resp, ...r.apoios].filter(Boolean); };
  const gente = [...new Map([...pessoas.map((p) => p.nome), ...metas.flatMap(nomesDasMetas)].map((n) => [norm(n), n])).values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const daPessoa = (m: (typeof metas)[number]) => nomesDasMetas(m).some((n) => norm(n) === norm(filtro));
  const metaGaveta = editando?.modo === 'gaveta' ? metas.find((x) => x.idx === editando.idx) ?? null : null;

  const opcoes = {
    cartoes: true,
    onStatus: (idx: number, status: Parameters<typeof setMeta>[1]['status'] & string) => { lembra(idx); setMeta(idx, { status }); },
    onStatusSucesso: (idx: number, id: string, status: Parameters<typeof setMeta>[1]['status'] & string) => {
      const meta = metas.find((x) => x.idx === idx);
      lembra(idx);
      if (meta) { const sucessos = editaSucesso(lerSucessos(meta), id, { status }); setMeta(idx, { sucessos, status: statusPorAtingimento(meta.status, sucessos) }); }
    },
    marca: (m: (typeof metas)[number]) => (filtro ? (daPessoa(m) ? ('destaque' as const) : ('esmaecido' as const)) : undefined),
    infoMeta: (m: (typeof metas)[number]) => {
      const r = resolve(c, m);
      return (
        <span className="np-meta-resp">
          Responsável: <b>{r.resp || 'A definir'}</b>
          {r.apoios.length > 0 && ` · Apoio: ${r.apoios.join(', ')}`}
        </span>
      );
    },
    extraObjetivo: (pid: string) => (
      <button type="button" className="bt sec peq rm-nao-imprime" aria-label={`Acrescentar meta a ${objetivos.find((o) => o.pid === pid)?.texto ?? pid}`} onClick={() => acrescenta(pid)}>Acrescentar meta</button>
    ),
    extra: (m: (typeof metas)[number]) => {
      const aberta = editando?.idx === m.idx;
      return (
        <>
          <button type="button" className="bt sec peq rm-nao-imprime" aria-expanded={aberta} aria-label={`${aberta ? 'Fechar a edição da' : 'Editar a'} meta ${String(m.idx + 1).padStart(2, '0')}`}
            onClick={(e) => setEditando(aberta ? null : { idx: m.idx, modo: 'gaveta', origem: e.currentTarget })}>{aberta ? 'Fechar' : 'Editar'}</button>
          <button type="button" className="rm-link rm-nao-imprime" data-monit-meta={m.id} aria-label={`Detalhar a meta ${String(m.idx + 1).padStart(2, '0')} no Monitoramento`}
            onClick={() => irMonitoramento(m.id)}>Detalhar no Monitoramento</button>
        </>
      );
    },
    abaixoMeta: (m: (typeof metas)[number]) => (
      editando?.idx === m.idx && editando.modo === 'inline' ? (
        <div className="rm-no-edicao rm-nao-imprime">
          <CartaoMeta meta={m} objetivos={objetivos} pessoas={pessoas} campos={c} comStatus podeMover={podeMover} onChange={(i, patch) => { lembra(i); setMeta(i, patch); }} onRemove={remove} />
        </div>
      ) : null
    ),
  };

  /* vários planejamentos: seletor no topo; o arquivado abre só para leitura e nunca altera o ativo (M5-31.5, M5-31.6) */
  const ciclos = listaCiclos(d);
  const arquivado = ver === null ? null : abrirCiclo(d, ver);
  /* SUG-86: os planejamentos em cards; o atual abre para editar, os arquivados abrem para leitura, podem ser renomeados e excluídos */
  const planos = lerPlanos(d);
  const pctDe = (ms: { status?: string; sucessos?: unknown }[]) => pctObjetivo(ms);
  const renomeia = (n: number, atual: string) => {
    const nome = window.prompt('Nome do planejamento (deixe vazio para voltar ao padrão):', atual);
    if (nome === null) return;
    renomeiaPlano(d, n, nome); bump();
  };
  const exclui = (n: number, rot: string) => {
    if (!window.confirm(`Excluir "${rot}"? Esse planejamento guardado será apagado e não dá para desfazer.`)) return;
    excluiPlano(d, n); setVer(null); bump();
  };
  const seletor = ciclos.length > 1 && (
    <ul className="rm-ciclos rm-nao-imprime" aria-label="Planejamentos">
      {ciclos.map((x) => {
        const p = planos.find((y) => y.n === x.n);
        const ms = p ? p.metas : metas;
        const aberto = x.atual ? ver === null : ver === x.n;
        return (
          <li key={x.n} className="rm-ciclo-card" data-ciclo={x.n} data-atual={x.atual} aria-current={aberto || undefined}>
            <b>{x.rot}</b>
            <span className="rm-dica">{x.atual ? 'Em andamento' : `Guardado${x.criadoEm ? ` em ${new Date(x.criadoEm).toLocaleDateString('pt-BR')}` : ''}`} · {ms.length} {ms.length === 1 ? 'meta' : 'metas'} · atingimento {pctTxt(pctDe(ms))}</span>
            <div className="bts">
              <button type="button" className="bt sec peq" aria-pressed={aberto} onClick={() => setVer(x.atual ? null : x.n)}>{x.atual ? 'Editar' : 'Abrir'}<span className="sr"> {x.rot}</span></button>
              {!x.atual && <button type="button" className="bt fant peq" onClick={() => renomeia(x.n, p?.nome ?? '')}>Renomear<span className="sr"> {x.rot}</span></button>}
              {!x.atual && <button type="button" className="bt fant peq" onClick={() => exclui(x.n, x.rot)}>Excluir<span className="sr"> {x.rot}</span></button>}
            </div>
          </li>
        );
      })}
    </ul>
  );

  if (arquivado) {
    const totalArq = pctPlano(arquivado.objetivos);
    const semMetas = !arquivado.objetivos.some((o) => o.metas.length > 0) && arquivado.semObjetivo.length === 0;
    return (
      <div className="ilha-corpo rm-plano" data-n-metas={arquivado.objetivos.reduce((n, o) => n + o.metas.length, 0) + arquivado.semObjetivo.length} data-arquivado={ver} data-imprime="">
        {seletor}
        <p className="rm-dica" role="status">{ciclos.find((x) => x.n === ver)?.rot ?? `Planejamento ${ver}`} guardado: somente leitura. O planejamento atual não muda por aqui.</p>
        {semMetas ? (
          <div className="rm-plano-vazio"><h4>Este planejamento não tinha metas</h4><p>Ele foi guardado sem metas, então não há o que mostrar na árvore.</p></div>
        ) : (
          <>
            <div className="np-plano-dash sem-est">
              <div className="np-card np-plano-anel"><Anel pct={totalArq} /><div><p className="rm-plano-t">Atingimento total</p></div></div>
            </div>
            <ArvorePlano modo="plano" estilo="cartoes" arv={arquivado} opcoes={{ onStatus: () => {}, leitura: true, cartoes: true }} />
          </>
        )}
      </div>
    );
  }

  const temConteudo = !vazio || arv.semObjetivo.length > 0 || arv.objetivos.length > 0;

  return (
    <div className="ilha-corpo rm-plano" data-n-metas={nMetas} data-imprime="">
      {temConteudo && (
        <div className="np-plano-monit-topo rm-nao-imprime">
          <button type="button" className="bt pri" data-ir-monit onClick={() => irMonitoramento(ultima.current)}>{BOTAO_MONIT}</button>
        </div>
      )}
      {seletor}
      {temConteudo ? (
        <div className={`np-plano-dash${temEstrategia ? '' : ' sem-est'}`}>
          <div className="np-card np-plano-anel">
            <Anel pct={total} />
            <div>
              <p className="rm-plano-t">Atingimento total</p>
              <p className="rm-dica">Média de todas as metas ativas: cada meta pesa o mesmo no todo, então objetivos com mais metas pesam mais. Meta congelada fica fora da conta; meta sem status vale 0.</p>
            </div>
          </div>
          {temEstrategia && (
            <div className="np-card np-plano-est-card">
              <EstrategiaPlano campos={c} escolhidos={escolhidos} />
            </div>
          )}
        </div>
      ) : (
        temEstrategia && (
          <div className="np-card np-plano-est-card np-plano-est-solo">
            <EstrategiaPlano campos={c} escolhidos={escolhidos} />
          </div>
        )
      )}
      <EditorPlano aberto={arv.objetivos.length === 0} />
      {vazio && (
        <div className="rm-plano-vazio">
          <h4>O planejamento ainda não tem metas</h4>
          <p>{arv.objetivos.length === 0 ? 'Escolha os preditores acima. Cada um vira um objetivo, e você acrescenta as metas e os sucessos aqui mesmo.' : 'Use "Acrescentar meta" em cada objetivo abaixo. Os sucessos mensais entram na edição da meta.'}</p>
        </div>
      )}
      {temConteudo && (
        <>
          <div className="np-plano-filtros rm-nao-imprime">
            <label className="campo"><span className="rot">Filtrar por pessoa</span>
              <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                <option value="">Todas as pessoas</option>
                {gente.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <button type="button" className="bt sec peq" aria-pressed={ordenar} onClick={() => setOrdenar(!ordenar)}>Ordenar por atingimento</button>
          </div>
          {filtro && <p className="rm-dica rm-nao-imprime" role="status">Em destaque: metas em que {filtro} é responsável ou apoio. As demais ficam esmaecidas.</p>}
          <ArvorePlano modo="plano" estilo="cartoes" arv={ordenado} opcoes={opcoes} editandoId={editando ? `meta-${editando.idx}` : null}
            onAtiva={(id) => {
              if (id.startsWith('meta-')) {
                const i = Number(id.slice(5));
                const origem = document.activeElement instanceof HTMLElement ? document.activeElement : null;
                setEditando(editando?.idx === i ? null : { idx: i, modo: 'gaveta', origem });
              }
            }} />
        </>
      )}
      <div className="np-card np-rotinas-card"><RotinasPlano campos={c} /></div>
      <Gaveta
        aberta={!!metaGaveta}
        titulo={metaGaveta ? `Editar Meta ${String(metaGaveta.idx + 1).padStart(2, '0')}` : ''}
        classeCorpo="rm-no-edicao"
        origem={editando?.origem ?? null}
        onFechar={() => setEditando(null)}
        rodape={
          <>
            <button type="button" className="bt sec" onClick={() => setEditando(null)}>Fechar</button>
            <button
              type="button"
              className="bt pri"
              onClick={() => {
                if (metaGaveta) aviso(`Meta ${String(metaGaveta.idx + 1).padStart(2, '0')} salva!`);
                setEditando(null);
              }}
            >
              Salvar meta
            </button>
          </>
        }
      >
        {metaGaveta && (
          <CartaoMeta
            meta={metaGaveta}
            objetivos={objetivos}
            pessoas={pessoas}
            campos={c}
            comStatus
            umaColuna
            podeMover={podeMover}
            onChange={(i, patch) => { lembra(i); setMeta(i, patch); }}
            onRemove={remove}
          />
        )}
      </Gaveta>
    </div>
  );
}
