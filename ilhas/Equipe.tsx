'use client';
/* Missão 2: ficha de gestão de cada cargo (escalação), organograma e rotinas.
   Tudo é gravado em D.campos (m2.f{n} = nome; m2.p{n}.{campo} = ficha), então segue o mesmo
   caminho de salvamento e de nuvem do resto do Guia. */
import { useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, Handle, Position, type Node, type Edge, type NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import { useLegado } from './ponte';
import {
  COORDENACOES, COR_COORD, HABILIDADES, RITMOS, RELACIONAL, ESCOPOS, PADRAO,
  CAMPOS_FICHA, chaveFicha, chaveNome, lista, SEP, type CampoFicha,
} from '@/lib/equipe';

type Cargo = [string, string, string];
const cargos = () => (window as unknown as { CARGOS_EQUIPE: Cargo[] }).CARGOS_EQUIPE;
const rotinas = () => (window as unknown as { ROTINAS: string[][] }).ROTINAS;

function useFicha() {
  const { D, bump } = useLegado();
  const c = D.campos;
  const get = (i: number, k: CampoFicha) => c[chaveFicha(i, k)] ?? '';
  const set = (i: number, k: CampoFicha, v: string) => { c[chaveFicha(i, k)] = v; bump(); };
  const nome = (i: number) => (c[chaveNome(i)] ?? '').trim();
  const coord = (i: number) => get(i, 'coord') || PADRAO[i]?.coord || 'Chefia de área';
  const lider = (i: number): number | null => {
    const v = get(i, 'lider');
    if (v === '-') return null;
    if (v !== '') return Number(v);
    return PADRAO[i]?.lider ?? null;
  };
  const cargoNome = (i: number) => get(i, 'nome_cargo') || cargos()[i][0];
  return { get, set, nome, coord, lider, cargoNome, n: cargos().length };
}

/* ---------- seleção múltipla em chips ---------- */
function Chips({ opcoes, valor, onChange }: { opcoes: string[]; valor: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="eq-chips">
      {opcoes.map((o) => {
        const on = valor.includes(o);
        return (
          <button key={o} type="button" className={'eq-chip' + (on ? ' on' : '')} aria-pressed={on}
            onClick={() => onChange(on ? valor.filter((x) => x !== o) : [...valor, o])}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- ficha de gestão (embaixo de cada cargo da escalação) ---------- */
export function Ficha({ i }: { i: number }) {
  const f = useFicha();
  const [aberto, setAberto] = useState(false);
  const [aba, setAba] = useState<'escopo' | 'perfil'>('escopo');
  const L = (k: CampoFicha) => lista(f.get(i, k));
  const S = (k: CampoFicha) => (v: string[]) => f.set(i, k, v.join(SEP));
  const t = (k: CampoFicha, rot: string, ph = '', area = true) => (
    <label className="eq-campo"><span className="rot">{rot}</span>
      {area ? <textarea value={f.get(i, k)} placeholder={ph} onChange={(e) => f.set(i, k, e.target.value)} />
        : <input type="text" value={f.get(i, k)} placeholder={ph} onChange={(e) => f.set(i, k, e.target.value)} />}
    </label>
  );
  const preenchidos = CAMPOS_FICHA.filter((k) => f.get(i, k)).length;
  const liderVal = f.get(i, 'lider') || (PADRAO[i]?.lider ?? '-').toString();
  return (
    <div className="eq-ficha">
      <button type="button" className="eq-ficha-bt" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
        <span>{aberto ? '▾' : '▸'} Ficha de gestão</span>
        <span className="eq-ficha-n">{preenchidos ? `${preenchidos} campos preenchidos` : 'coordenação, liderança, escopo, habilidades e feedback'}</span>
      </button>
      {aberto && (
        <div className="eq-ficha-corpo">
          <div className="eq-abas" role="tablist">
            {([['escopo', 'Escopo e liderança'], ['perfil', 'Perfil e repertório']] as const).map(([k, r]) => (
              <button key={k} role="tab" aria-selected={aba === k} onClick={() => setAba(k)}>{r}</button>
            ))}
          </div>
          {aba === 'escopo' && (<>
            <div className="eq-linha">
              {t('nome_cargo', 'Nome do cargo', cargos()[i][0], false)}
              <label className="eq-campo"><span className="rot">Coordenação</span>
                <select value={f.coord(i)} onChange={(e) => f.set(i, 'coord', e.target.value)}>
                  {COORDENACOES.map((c) => <option key={c}>{c}</option>)}
                </select></label>
              <label className="eq-campo"><span className="rot">Liderança imediata</span>
                <select value={liderVal} onChange={(e) => f.set(i, 'lider', e.target.value)}>
                  <option value="-">Ninguém (topo)</option>
                  {cargos().map((c, j) => j !== i && <option key={j} value={j}>{f.nome(j) ? `${f.nome(j)} — ` : ''}{c[0]}</option>)}
                </select></label>
            </div>
            <span className="rot">Escopo de trabalho</span>
            <Chips opcoes={ESCOPOS} valor={L('escopo')} onChange={S('escopo')} />
            {t('espec', 'Especificidades do cargo', 'O que é particular deste cargo neste mandato')}
          </>)}
          {aba === 'perfil' && (<>
            <span className="rot">Habilidades de destaque</span>
            <Chips opcoes={HABILIDADES} valor={L('hab_dest')} onChange={S('hab_dest')} />
            <span className="rot">Habilidades a serem desenvolvidas</span>
            <Chips opcoes={HABILIDADES} valor={L('hab_dev')} onChange={S('hab_dev')} />
            <span className="rot">Repertório técnico de destaque</span>
            <Chips opcoes={ESCOPOS} valor={L('rep_dest')} onChange={S('rep_dest')} />
            <span className="rot">Repertório técnico a ser desenvolvido</span>
            <Chips opcoes={ESCOPOS} valor={L('rep_dev')} onChange={S('rep_dev')} />
          </>)}
        </div>
      )}
    </div>
  );
}

/* ---------- organograma ---------- */
const LARG = 230, ALT = 96;
type DadoNo = { idx: number; cargo: string; nome: string; coord: string; vaga: boolean; aberto: boolean; ritmo: string };

function NoCargo({ data, selected }: NodeProps<Node<DadoNo>>) {
  const cor = COR_COORD[data.coord] ?? '#571730';
  return (
    <div className={'eq-no' + (data.vaga ? ' vaga' : '') + (selected ? ' sel' : '')} style={{ borderTopColor: cor }}>
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <span className="eq-no-coord" style={{ color: cor }}>{data.coord}</span>
      <strong className="eq-no-nome">{data.vaga ? (data.aberto ? 'Processo seletivo' : 'Vaga em aberto') : data.nome}</strong>
      <span className="eq-no-cargo">{data.cargo}</span>
      {data.ritmo && <span className={'eq-no-ritmo r-' + data.ritmo.toLowerCase()}>{data.ritmo}</span>}
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}
const tiposNo = { cargo: NoCargo };

export function Organograma() {
  const f = useFicha();
  const [filtro, setFiltro] = useState('');
  const [sel, setSel] = useState<number | null>(null);
  const [soPreenchidos, setSoPreenchidos] = useState(false);
  const todos = [...Array(f.n).keys()];
  const chave = JSON.stringify(todos.map((i) => [f.nome(i), f.coord(i), f.lider(i), f.get(i, 'ritmo'), f.get(i, 'nome_cargo')]));
  const { nos, arestas } = useMemo(() => {
    const idx = todos.filter((i) => !soPreenchidos || f.nome(i));
    const vis = new Set(idx);
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: 24, ranksep: 70 });
    g.setDefaultEdgeLabel(() => ({}));
    idx.forEach((i) => g.setNode(String(i), { width: LARG, height: ALT }));
    const ar: Edge[] = [];
    idx.forEach((i) => {
      let p = f.lider(i);
      let guarda = 0;
      while (p !== null && !vis.has(p) && guarda++ < 30) p = f.lider(p); // sobe até o líder visível mais próximo
      if (p !== null && p !== i && vis.has(p)) {
        g.setEdge(String(p), String(i));
        ar.push({ id: `${p}-${i}`, source: String(p), target: String(i), type: 'smoothstep', style: { stroke: COR_COORD[f.coord(i)] ?? '#571730', strokeWidth: 2 } });
      }
    });
    dagre.layout(g);
    const ns: Node<DadoNo>[] = idx.map((i) => {
      const p = g.node(String(i));
      const nome = f.nome(i);
      const semNome = nome.replace(/\*/g, '').trim() === '';
      return {
        id: String(i), type: 'cargo', position: { x: p.x - LARG / 2, y: p.y - ALT / 2 }, draggable: false,
        data: { idx: i, cargo: f.cargoNome(i), nome: nome.replace(/\*/g, '').trim(), coord: f.coord(i), vaga: semNome, aberto: nome.includes('*'), ritmo: f.get(i, 'ritmo') },
        style: { opacity: filtro && f.coord(i) !== filtro ? 0.25 : 1, width: LARG },
      };
    });
    return { nos: ns, arestas: ar };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro, soPreenchidos, chave]);
  const preenchidos = todos.filter((i) => f.nome(i)).length;
  return (
    <div className="ilha-corpo eq-org">
      <div className="eq-barra">
        <span><strong>{preenchidos}</strong> de {f.n} cargos com nome</span>
        <label className="eq-tg"><input type="checkbox" checked={soPreenchidos} onChange={(e) => setSoPreenchidos(e.target.checked)} /> só cargos preenchidos</label>
        <div className="eq-legenda">
          <button type="button" className={!filtro ? 'on' : ''} onClick={() => setFiltro('')}>Todas</button>
          {COORDENACOES.map((c) => (
            <button key={c} type="button" className={filtro === c ? 'on' : ''} onClick={() => setFiltro(filtro === c ? '' : c)}>
              <i style={{ background: COR_COORD[c] }} />{c}
            </button>
          ))}
        </div>
      </div>
      <div className="eq-canvas">
        <ReactFlow key={chave + soPreenchidos} nodes={nos} edges={arestas} nodeTypes={tiposNo} fitView fitViewOptions={{ padding: 0.12 }} minZoom={0.2} maxZoom={1.5}
          nodesConnectable={false} proOptions={{ hideAttribution: true }} onNodeClick={(_, n) => setSel(Number(n.id))} onPaneClick={() => setSel(null)}>
          <Background gap={22} color="#E6DCCE" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      {sel !== null && (
        <aside className="eq-detalhe">
          <button type="button" className="eq-x" onClick={() => setSel(null)} aria-label="Fechar">×</button>
          <span className="eq-no-coord" style={{ color: COR_COORD[f.coord(sel)] }}>{f.coord(sel)}</span>
          <h4>{f.nome(sel) || 'Vaga em aberto'}</h4>
          <p className="cf">{f.cargoNome(sel)}{f.lider(sel) !== null && <> · lidera: {f.nome(f.lider(sel)!) || f.cargoNome(f.lider(sel)!)}</>}</p>
          {lista(f.get(sel, 'escopo')).length > 0 && (<><b>Escopo de trabalho</b><ul>{lista(f.get(sel, 'escopo')).map((e) => <li key={e}>{e}</li>)}</ul></>)}
          {lista(f.get(sel, 'hab_dest')).length > 0 && (<><b>Habilidades de destaque</b><p>{lista(f.get(sel, 'hab_dest')).join(', ')}</p></>)}
          {lista(f.get(sel, 'hab_dev')).length > 0 && (<><b>A desenvolver</b><p>{lista(f.get(sel, 'hab_dev')).join(', ')}</p></>)}
          {f.get(sel, 'entrega') && (<><b>Grande entrega do ciclo</b><p>{f.get(sel, 'entrega')}</p></>)}
          {f.get(sel, 'espec') && (<><b>Especificidades</b><p>{f.get(sel, 'espec')}</p></>)}
          {!lista(f.get(sel, 'escopo')).length && !f.get(sel, 'espec') && <p className="sem">Abra a “Ficha de gestão” deste cargo na escalação para preencher escopo e perfil.</p>}
        </aside>
      )}
    </div>
  );
}

/* ---------- rotinas ---------- */
const ORDEM = ['Semanalmente', 'Mensalmente', 'Quadrimestralmente', 'Semestralmente'];
export function Rotinas() {
  const f = useFicha();
  const rs = rotinas();
  const porCoord = COORDENACOES.map((c) => ({
    c,
    gente: [...Array(f.n).keys()].filter((i) => f.coord(i) === c),
  })).filter((x) => x.gente.length);
  return (
    <div className="ilha-corpo eq-rot">
      <h4>Calendário de rotinas do mandato</h4>
      <div className="eq-faixas">
        {ORDEM.map((freq) => {
          const itens = rs.filter((r) => r[0] === freq);
          return (
            <div key={freq} className="eq-faixa">
              <div className="eq-faixa-t">{freq.replace('mente', '')}</div>
              {itens.map((r, k) => (
                <div key={k} className="eq-rot-card">
                  <strong>{r[1]}</strong>
                  <span><b>Quem:</b> {r[2]}</span>
                  <span className="eq-dur">⏱ {r[3]}</span>
                </div>
              ))}
              {!itens.length && <p className="sem">—</p>}
            </div>
          );
        })}
      </div>
      <h4>Rotina de cada área</h4>
      <p className="eq-ajuda">Reunião semanal de distribuição de trabalho: quem coordena cada área e o que cada pessoa assume (escopo da ficha de gestão).</p>
      <div className="eq-areas">
        {porCoord.map(({ c, gente }) => {
          const chefe = gente.find((i) => { const l = f.lider(i); return l === null || f.coord(l) !== c; }) ?? gente[0];
          return (
            <section key={c} className="eq-area" style={{ borderTopColor: COR_COORD[c] }}>
              <header><strong style={{ color: COR_COORD[c] }}>{c}</strong><span>{gente.length} cargo(s)</span></header>
              <p className="eq-reun">Reunião da área · coordena: <b>{f.nome(chefe) || f.cargoNome(chefe)}</b> · 45 min por semana</p>
              <ul>
                {gente.map((i) => (
                  <li key={i}>
                    <b>{f.nome(i) || <em>vaga</em>}</b> <span className="cf">{f.cargoNome(i)}</span>
                    {lista(f.get(i, 'escopo')).length ? <ul className="eq-tarefas">{lista(f.get(i, 'escopo')).map((e) => <li key={e}>{e}</li>)}</ul>
                      : <span className="sem"> — escopo ainda não definido</span>}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
