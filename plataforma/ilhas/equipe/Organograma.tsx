'use client';
/* Missão 2 · organograma do mandato, gerado da tabela de equipe (categoria + área). Cada caixa mostra pessoa, cargo e área;
   clicar abre a ficha da cadeira na gaveta lateral, com botão para ir ao card correspondente. */
import { useMemo, useState } from 'react';
import { Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { coordDe } from '@/lib/cadeiras';
import { COR_COORD } from '@/lib/equipe';
import { layoutOrg } from '@/lib/layoutOrg';
import { avisosOrg, linhas, organogramaGerado, vistaDaTabela } from '@/lib/tabelaEquipe';
import Gaveta from '../Gaveta';
import { cargoNome, modeloNome } from './cargos';
import { useEquipe } from './useEquipe';
import './equipe.css';

type Dado = { i: number; cargo: string; nome: string; coord: string; vaga: boolean; aberto: boolean; sel: boolean };

const rotuloArea = (a: string) => (a === 'Chefia de área' ? 'Chefia de gabinete' : a);

/** Leva ao card correspondente da Mão na massa 1 e põe o foco no primeiro campo editável dele (se existir na página). */
function focaLinha(i: number) {
  const linha = document.getElementById(`es-linha-${i}`);
  if (!linha) return;
  linha.scrollIntoView({ behavior: 'smooth', block: 'center' });
  linha.querySelector<HTMLElement>('input:not(:disabled), textarea:not(:disabled), select:not(:disabled)')?.focus({ preventScroll: true });
}

function NoCadeira({ data }: NodeProps<Node<Dado>>) {
  const cor = COR_COORD[data.coord] ?? '#5E524C';
  return (
    <div className={`es-no${data.vaga ? ' vaga' : ''}${data.sel ? ' sel' : ''}`} data-cadeira={data.i} style={{ borderTopColor: cor }}>
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
  const [selecionada, setSelecionada] = useState<{ i: number; origem?: HTMLElement | null } | null>(null);

  /* mandato do modelo antigo: desenha e avisa já com categoria, área e liderança derivadas, sem gravar nada */
  const vista = vistaDaTabela(c, modeloNome);
  const pronto = organogramaGerado(vista);
  const avisos = avisosOrg(vista);
  const ls = linhas(vista);
  const l = layoutOrg(vista, { soPreenchidas });
  /* altura pelo conteúdo: sem faixa vazia embaixo; o zoom inicial nunca fica menor que 55% (legível) */
  const baixo = l.nos.reduce((m, n) => Math.max(m, n.y + n.h), 0);
  const alturaCanvas = Math.min(720, Math.max(380, Math.round(baixo * 0.75) + 90));
  const selId = selecionada?.i ?? null;
  const chave = JSON.stringify([l.nos.map((n) => [n.i, n.x, n.y, n.nome, n.coord, cargoNome(vista, n.i)]), l.arestas.map((a) => a.id), filtro, selId]);
  /* o canvas só é remontado (e reenquadrado) quando a estrutura muda; editar nome ou selecionar nó só atualiza as caixas */
  const estrutura = JSON.stringify([l.nos.map((n) => n.i), l.arestas.map((a) => a.id), reajusta]);
  const { nos, arestas } = useMemo(() => ({
    nos: l.nos.map<Node<Dado>>((n) => ({
      id: String(n.i), type: 'cadeira', position: { x: n.x, y: n.y }, draggable: false, focusable: true,
      ariaLabel: `${n.vaga ? (n.aberto ? 'Processo seletivo' : 'Vaga em aberto') : n.nome}, ${cargoNome(vista, n.i)}, área ${rotuloArea(n.coord)}. Enter ou clique abre a ficha da cadeira.`,
      data: { i: n.i, cargo: cargoNome(vista, n.i), nome: n.nome, coord: n.coord, vaga: n.vaga, aberto: n.aberto, sel: selId === n.i },
      style: { width: n.w, opacity: filtro && coordDe(vista, n.i) !== filtro ? 0.25 : 1 },
    })),
    arestas: l.arestas.map<Edge>((a) => ({ id: a.id, source: String(a.de), target: String(a.para), type: 'smoothstep', style: { stroke: COR_COORD[a.coord] ?? '#5E524C', strokeWidth: 2 } })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [chave]);

  if (!pronto) return <div className="ilha-corpo eq-org es-org"><p className="es-vazio">O organograma aparece sozinho quando ao menos uma linha da tabela tiver cargo, categoria e área.</p></div>;

  const posSel = selecionada !== null ? ls.findIndex((x) => x.i === selecionada.i) : -1;
  const cadeiraSel = posSel >= 0 ? ls[posSel] : null;
  const corSel = cadeiraSel ? (COR_COORD[cadeiraSel.area] ?? 'var(--vinho)') : undefined;
  const temCard = cadeiraSel && typeof document !== 'undefined' ? !!document.getElementById(`es-linha-${cadeiraSel.i}`) : false;

  const abreFicha = (i: number, origem?: HTMLElement | null) => setSelecionada({ i, origem: origem ?? null });
  const irAoCard = (i: number) => {
    setSelecionada(null);
    requestAnimationFrame(() => focaLinha(i));
  };

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
        /* Enter ou Espaço numa caixa focada abre a ficha da cadeira na gaveta lateral */
        const no = (e.target as HTMLElement).closest<HTMLElement>('.react-flow__node');
        if ((e.key === 'Enter' || e.key === ' ') && no && e.target === no) { e.preventDefault(); abreFicha(Number(no.dataset.id), no); }
      }}>
        <ReactFlow key={estrutura} nodes={nos} edges={arestas} nodeTypes={tipos} fitView fitViewOptions={{ padding: 0.08, minZoom: 0.55, maxZoom: 1 }} minZoom={0.2} maxZoom={1.5}
          nodesConnectable={false} proOptions={{ hideAttribution: true }}
          zoomOnScroll={false} preventScrolling={false}
          onNodeClick={(ev, n) => {
            const origem = (ev.target as HTMLElement | null)?.closest<HTMLElement>('.react-flow__node')
              ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
            abreFicha(Number(n.id), origem);
          }}>
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <Gaveta
        aberta={cadeiraSel !== null}
        titulo={cadeiraSel ? `Ficha da cadeira · #${posSel + 1}` : ''}
        ariaLabel="Ficha da cadeira"
        corTopo={corSel}
        origem={selecionada?.origem ?? null}
        onFechar={() => setSelecionada(null)}
        rodape={
          <>
            <button type="button" className="bt sec" onClick={() => setSelecionada(null)}>Fechar</button>
            {cadeiraSel && temCard && (
              <button type="button" className="bt pri" onClick={() => irAoCard(cadeiraSel.i)}>
                Ir para o card #{posSel + 1} ↑
              </button>
            )}
          </>
        }
      >
        {cadeiraSel && (
          <>
            <div className="np-eq-gaveta-topo">
              <h2 className="np-eq-gaveta-nome">
                {cadeiraSel.processoSeletivo ? 'Processo seletivo em aberto' : (cadeiraSel.pessoa || 'Vaga em aberto')}
              </h2>
              {cadeiraSel.processoSeletivo
                ? <span className="selo ps">Processo seletivo</span>
                : cadeiraSel.completa
                  ? <span className="selo ok">Completa</span>
                  : <span className="selo andamento">Em andamento</span>}
            </div>
            <p className="peq-t np-eq-gaveta-sub">
              {cadeiraSel.cargo || 'Cargo não definido'} · {cadeiraSel.cat || 'Categoria pendente'} · {cadeiraSel.area ? rotuloArea(cadeiraSel.area) : 'Área pendente'}
            </p>
            <div className="np-card">
              <dl className="cmp np-eq-gaveta-dl">
                <dt>Escopo</dt>
                <dd>{cadeiraSel.esc || 'Ainda não preenchido'}</dd>
                <dt>Competências comportamentais</dt>
                <dd>{cadeiraSel.comp || 'Ainda não preenchido'}</dd>
              </dl>
            </div>
          </>
        )}
      </Gaveta>
    </div>
  );
}
