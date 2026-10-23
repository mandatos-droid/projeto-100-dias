'use client';
/* Missão 2 · Tarefa 2: organograma do mandato. Cada caixa é uma cadeira; o painel (clique na caixa) edita escopo e perfil.
   O desenho vem de lib/layoutOrg, o mesmo da prévia e da exportação. */
import { useMemo, useState } from 'react';
import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CHEFIA, MAX_CADEIRAS, SEM_AREA, acrescenta, ativas, coordDe, type Campos } from '@/lib/cadeiras';
import { COR_COORD, chaveFicha, lista } from '@/lib/equipe';
import { layoutOrg } from '@/lib/layoutOrg';
import { cargoNome } from './cargos';
import PainelCadeira from './PainelCadeira';
import { useEquipe } from './useEquipe';
import './equipe.css';

/* o anel conta os 6 campos do painel */
const CAMPOS_PAINEL = ['escopo', 'espec', 'hab_dest', 'hab_dev', 'rep_dest', 'rep_dev'] as const;
export const preenchidos = (c: Campos, i: number) => CAMPOS_PAINEL.filter((k) => (c[chaveFicha(i, k)] ?? '').trim() !== '').length;
export const temEscopo = (c: Campos, i: number) => lista(c[chaveFicha(i, 'escopo')]).length > 0;

type Dado = { i: number; cargo: string; nome: string; coord: string; vaga: boolean; aberto: boolean; feitos: number; escopo: boolean };

function Anel({ n }: { n: number }) {
  const r = 11, perim = 2 * Math.PI * r;
  return (
    <svg className="es-anel" width="30" height="30" viewBox="0 0 30 30" role="img" aria-label={`${n} de 6 campos do painel preenchidos`}>
      <circle cx="15" cy="15" r={r} fill="none" stroke="#E6DCCE" strokeWidth="4" />
      <circle cx="15" cy="15" r={r} fill="none" stroke="#1B6B4F" strokeWidth="4" strokeDasharray={`${(perim * n) / 6} ${perim}`} transform="rotate(-90 15 15)" />
      <text x="15" y="19" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2B2420">{n}</text>
    </svg>
  );
}

function NoCadeira({ data, selected }: NodeProps<Node<Dado>>) {
  const cor = COR_COORD[data.coord] ?? '#5E524C';
  return (
    <div className={'es-no' + (data.vaga ? ' vaga' : '') + (selected ? ' sel' : '')} data-cadeira={data.i} style={{ borderTopColor: cor }}>
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <span className="es-no-area" style={{ color: cor }}>{data.coord === 'Chefia de área' ? 'Chefia de gabinete' : data.coord}</span>
      <strong className="es-no-nome">{data.vaga ? (data.aberto ? 'Processo seletivo' : 'Vaga em aberto') : data.nome}</strong>
      <span className="es-no-cargo">{data.cargo}</span>
      <span className="es-no-rodape">
        {!data.escopo && <em className="es-selo">escopo pendente</em>}
        <Anel n={data.feitos} />
      </span>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}
const tipos = { cadeira: NoCadeira };

export default function Organograma() {
  const { c, agir } = useEquipe();
  const [filtro, setFiltro] = useState('');
  const [soPreenchidas, setSo] = useState(false);
  const [reajusta, setReajusta] = useState(0);
  const [sel, setSel] = useState<number | null>(null);

  const l = layoutOrg(c, { soPreenchidas });
  const on = ativas(c);
  const comEscopo = on.filter((i) => temEscopo(c, i)).length;
  const aberto = sel !== null && on.includes(sel);
  const chave = JSON.stringify([l.nos.map((n) => [n.i, n.x, n.y, n.nome, n.coord, cargoNome(c, n.i), preenchidos(c, n.i), temEscopo(c, n.i)]), l.arestas.map((a) => a.id), filtro, aberto && sel]);
  /* o canvas só é remontado (e reenquadrado) quando a estrutura muda; editar nome ou escopo só atualiza as caixas */
  const estrutura = JSON.stringify([l.nos.map((n) => n.i), l.arestas.map((a) => a.id), reajusta]);
  const { nos, arestas } = useMemo(() => ({
    nos: l.nos.map<Node<Dado>>((n) => ({
      id: String(n.i), type: 'cadeira', position: { x: n.x, y: n.y }, draggable: false, selected: sel === n.i,
      data: { i: n.i, cargo: cargoNome(c, n.i), nome: n.nome, coord: n.coord, vaga: n.vaga, aberto: n.aberto, feitos: preenchidos(c, n.i), escopo: temEscopo(c, n.i) },
      style: { width: n.w, opacity: filtro && coordDe(c, n.i) !== filtro ? 0.25 : 1 },
    })),
    arestas: l.arestas.filter((a) => a.tipo === 'hierarquia').map<Edge>((a) => ({
      id: a.id, source: String(a.de), target: String(a.para), type: 'smoothstep', style: { stroke: COR_COORD[a.coord] ?? '#5E524C', strokeWidth: 2 },
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [chave]);

  /* nova cadeira: subordinada à caixa selecionada (ou à Chefia), na mesma área; abre o painel dela */
  const acrescentaCadeira = () => {
    const sob = sel !== null && on.includes(sel) ? sel : CHEFIA;
    const area = coordDe(c, sob);
    const antes = on;
    const r = acrescenta(c, { sob, area: area === 'Chefia de área' ? SEM_AREA : area });
    if (!agir(r)) return;
    const nova = ativas(c).find((i) => !antes.includes(i));
    if (nova !== undefined) setSel(nova);
  };

  return (
    <div className="ilha-corpo eq-org es-org">
      <div className="eq-barra">
        <span data-contador><strong>{comEscopo}/{on.length}</strong> cadeiras com escopo definido</span>
        <label className="eq-tg"><input type="checkbox" checked={soPreenchidas} onChange={(e) => setSo(e.target.checked)} /> só cadeiras com nome</label>
        <button type="button" className="bt pri peq es-bt" disabled={on.length >= MAX_CADEIRAS} title={on.length >= MAX_CADEIRAS ? `Limite de ${MAX_CADEIRAS} cadeiras` : undefined} onClick={acrescentaCadeira}>Acrescentar cadeira</button>
        <button type="button" className="bt sec peq es-bt" onClick={() => setReajusta((n) => n + 1)}>Ajustar layout</button>
        <div className="eq-legenda" role="group" aria-label="Filtrar por área">
          <button type="button" className={!filtro ? 'on' : ''} aria-pressed={!filtro} onClick={() => setFiltro('')}>Todas</button>
          {l.areas.map((a) => (
            <button key={a} type="button" className={filtro === a ? 'on' : ''} aria-pressed={filtro === a} onClick={() => setFiltro(filtro === a ? '' : a)}>
              <i style={{ background: COR_COORD[a] ?? '#5E524C' }} />{a}
            </button>
          ))}
        </div>
      </div>
      <div className={'es-org-corpo' + (aberto ? ' com-painel' : '')}>
      <div className="eq-canvas">
        <ReactFlow key={estrutura} nodes={nos} edges={arestas} nodeTypes={tipos} fitView fitViewOptions={{ padding: 0.12 }} minZoom={0.2} maxZoom={1.5}
          nodesConnectable={false} proOptions={{ hideAttribution: true }}
          onNodeClick={(_, n) => setSel(Number(n.id))} onPaneClick={() => setSel(null)}>
          <Background gap={22} color="#E6DCCE" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      {aberto && <PainelCadeira i={sel} onFechar={() => setSel(null)} />}
      </div>
    </div>
  );
}
