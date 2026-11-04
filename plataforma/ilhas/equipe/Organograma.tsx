'use client';
/* Missão 2 · organograma do mandato, gerado da tabela de equipe (categoria + área). Cada caixa mostra pessoa, cargo e área;
   clicar leva à linha da tabela. O desenho vem de lib/layoutOrg, o mesmo da exportação. */
import { useMemo, useState } from 'react';
import { Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { coordDe } from '@/lib/cadeiras';
import { COR_COORD } from '@/lib/equipe';
import { organogramaSvg } from '@/lib/exporta';
import { layoutOrg } from '@/lib/layoutOrg';
import { avisosOrg, organogramaGerado, vistaDaTabela } from '@/lib/tabelaEquipe';
import { cargoNome, modeloNome } from './cargos';
import { baixaPng } from './exportaPng';
import { useEquipe } from './useEquipe';
import './equipe.css';

type Dado = { i: number; cargo: string; nome: string; coord: string; vaga: boolean; aberto: boolean };

const rotuloArea = (a: string) => (a === 'Chefia de área' ? 'Chefia de gabinete' : a);

/** Leva à linha da tabela da Mão na massa 1 e põe o foco no primeiro campo editável dela (se a tabela está na página). */
function focaLinha(i: number) {
  const linha = document.getElementById(`es-linha-${i}`);
  if (!linha) return;
  linha.scrollIntoView({ behavior: 'smooth', block: 'center' });
  linha.querySelector<HTMLElement>('input:not(:disabled), textarea:not(:disabled), select:not(:disabled)')?.focus({ preventScroll: true });
}

function NoCadeira({ data }: NodeProps<Node<Dado>>) {
  const cor = COR_COORD[data.coord] ?? '#5E524C';
  return (
    <div className={'es-no' + (data.vaga ? ' vaga' : '')} data-cadeira={data.i} style={{ borderTopColor: cor }}>
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <span className="es-no-area" style={{ color: cor }}>{rotuloArea(data.coord)}</span>
      <strong className="es-no-nome">{data.vaga ? (data.aberto ? 'Processo seletivo' : 'Vaga em aberto') : data.nome}</strong>
      <span className="es-no-cargo">{data.cargo}</span>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}
const tipos = { cadeira: NoCadeira };

export default function Organograma() {
  const { c } = useEquipe();
  const [filtro, setFiltro] = useState('');
  const [soPreenchidas, setSo] = useState(false);
  const [reajusta, setReajusta] = useState(0);

  /* mandato do modelo antigo: desenha e avisa já com categoria, área e liderança derivadas, sem gravar nada */
  const vista = vistaDaTabela(c, modeloNome);
  const pronto = organogramaGerado(vista);
  const avisos = avisosOrg(vista);
  const l = layoutOrg(vista, { soPreenchidas });
  /* altura pelo conteúdo: sem faixa vazia embaixo; o zoom inicial nunca fica menor que 55% (legível) */
  const baixo = l.nos.reduce((m, n) => Math.max(m, n.y + n.h), 0);
  const alturaCanvas = Math.min(720, Math.max(380, Math.round(baixo * 0.75) + 90));
  const chave = JSON.stringify([l.nos.map((n) => [n.i, n.x, n.y, n.nome, n.coord, cargoNome(vista, n.i)]), l.arestas.map((a) => a.id), filtro]);
  /* o canvas só é remontado (e reenquadrado) quando a estrutura muda; editar nome ou cargo só atualiza as caixas */
  const estrutura = JSON.stringify([l.nos.map((n) => n.i), l.arestas.map((a) => a.id), reajusta]);
  const { nos, arestas } = useMemo(() => ({
    nos: l.nos.map<Node<Dado>>((n) => ({
      id: String(n.i), type: 'cadeira', position: { x: n.x, y: n.y }, draggable: false, focusable: true,
      ariaLabel: `${n.vaga ? (n.aberto ? 'Processo seletivo' : 'Vaga em aberto') : n.nome}, ${cargoNome(vista, n.i)}, área ${rotuloArea(n.coord)}. Enter leva à linha da tabela.`,
      data: { i: n.i, cargo: cargoNome(vista, n.i), nome: n.nome, coord: n.coord, vaga: n.vaga, aberto: n.aberto },
      style: { width: n.w, opacity: filtro && coordDe(vista, n.i) !== filtro ? 0.25 : 1 },
    })),
    arestas: l.arestas.map<Edge>((a) => ({ id: a.id, source: String(a.de), target: String(a.para), type: 'smoothstep', style: { stroke: COR_COORD[a.coord] ?? '#5E524C', strokeWidth: 2 } })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [chave]);

  if (!pronto) return <div className="ilha-corpo eq-org es-org"><p className="es-vazio">O organograma aparece sozinho quando ao menos uma linha da tabela tiver cargo, categoria e área.</p></div>;

  return (
    <div className="ilha-corpo eq-org es-org">
      {avisos.length > 0 && (
        <ul className="es-org-avisos" role="status" aria-label="Avisos do organograma">
          {avisos.map((a) => <li key={a} className="es-motivo">{a}</li>)}
        </ul>
      )}
      <div className="eq-barra">
        <label className="eq-tg"><input type="checkbox" checked={soPreenchidas} onChange={(e) => setSo(e.target.checked)} /> só cadeiras com nome</label>
        <button type="button" className="bt sec peq es-bt" onClick={() => setReajusta((n) => n + 1)}>Ajustar layout</button>
        <button type="button" className="bt pri peq es-bt" onClick={() => baixaPng(organogramaSvg(vista, (i) => cargoNome(vista, i)), 'organograma-do-mandato.png')}>Exportar organograma (PNG)</button>
        <div className="eq-legenda" role="group" aria-label="Filtrar por área">
          <button type="button" className={!filtro ? 'on' : ''} aria-pressed={!filtro} onClick={() => setFiltro('')}>Todas</button>
          {l.areas.map((a) => (
            <button key={a} type="button" className={filtro === a ? 'on' : ''} aria-pressed={filtro === a} onClick={() => setFiltro(filtro === a ? '' : a)}>
              <i style={{ background: COR_COORD[a] ?? '#5E524C' }} />{a}
            </button>
          ))}
        </div>
      </div>
      <div className="eq-canvas" style={{ height: alturaCanvas }} onKeyDown={(e) => {
        /* Enter ou Espaço numa caixa focada leva à linha da tabela (o React Flow só a seleciona) */
        const no = (e.target as HTMLElement).closest<HTMLElement>('.react-flow__node');
        if ((e.key === 'Enter' || e.key === ' ') && no && e.target === no) { e.preventDefault(); focaLinha(Number(no.dataset.id)); }
      }}>
        <ReactFlow key={estrutura} nodes={nos} edges={arestas} nodeTypes={tipos} fitView fitViewOptions={{ padding: 0.08, minZoom: 0.55, maxZoom: 1 }} minZoom={0.2} maxZoom={1.5}
          nodesConnectable={false} proOptions={{ hideAttribution: true }}
          zoomOnScroll={false} preventScrolling={false}
          onNodeClick={(_, n) => focaLinha(Number(n.id))}>
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
