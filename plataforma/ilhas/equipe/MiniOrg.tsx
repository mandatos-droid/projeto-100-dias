'use client';
/* Prévia do organograma ao lado da etapa "Nomes": só mostra, não edita. Redesenha a cada mudança de nome, área ou liderança. */
import { Background, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { COR_COORD } from '@/lib/equipe';
import { layoutOrg } from '@/lib/layoutOrg';
import { cargoNome } from './cargos';
import { useEquipe } from './useEquipe';
import { useMemo } from 'react';

type Dado = { cargo: string; nome: string; vaga: boolean; aberto: boolean; coord: string; i: number };

function NoMini({ data }: NodeProps<Node<Dado>>) {
  return (
    <div className={'es-mini-no' + (data.vaga ? ' vaga' : '')} data-cadeira={data.i} style={{ borderTopColor: COR_COORD[data.coord] ?? '#5E524C' }}>
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <strong>{data.vaga ? (data.aberto ? 'Processo seletivo' : 'Vaga em aberto') : data.nome}</strong>
      <span>{data.cargo}</span>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}
const tipos = { mini: NoMini };

export default function MiniOrg() {
  const { c } = useEquipe();
  const l = layoutOrg(c);
  const nomes = l.nos.map((n) => [n.i, cargoNome(c, n.i)] as const);
  const chave = JSON.stringify([l.nos.map((n) => [n.i, n.x, n.y, n.nome, n.coord]), l.arestas.map((a) => a.id), nomes]);
  const { nos, arestas } = useMemo(() => ({
    nos: l.nos.map<Node<Dado>>((n) => ({
      id: String(n.i), type: 'mini', position: { x: n.x, y: n.y }, draggable: false, selectable: false, focusable: false,
      data: { cargo: cargoNome(c, n.i), nome: n.nome, vaga: n.vaga, aberto: n.aberto, coord: n.coord, i: n.i }, style: { width: n.w },
    })),
    arestas: l.arestas.filter((a) => a.tipo === 'hierarquia').map<Edge>((a) => ({
      id: a.id, source: String(a.de), target: String(a.para), type: 'smoothstep', style: { stroke: COR_COORD[a.coord] ?? '#5E524C', strokeWidth: 2 },
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [chave]);

  return (
    <aside className="es-mini" aria-label="Prévia do organograma">
      <p className="es-mini-t">Prévia do organograma <span>{l.nos.length} {l.nos.length === 1 ? 'cadeira' : 'cadeiras'}</span></p>
      <div className="es-mini-canvas">
        <ReactFlow key={chave} nodes={nos} edges={arestas} nodeTypes={tipos} fitView fitViewOptions={{ padding: 0.1 }} minZoom={0.1} maxZoom={1.2}
          nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} nodesFocusable={false} edgesFocusable={false}
          proOptions={{ hideAttribution: true }}>
          <Background gap={22} color="#E6DCCE" />
        </ReactFlow>
      </div>
    </aside>
  );
}
