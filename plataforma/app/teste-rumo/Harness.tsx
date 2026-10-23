'use client';
import { useEffect, useState } from 'react';
import { instalaIlhas } from '@/ilhas/ponte';
import Jornal, { type JornalProps } from '@/ilhas/rumo/Jornal';

type Semente = { campos?: Record<string, string>; D?: Record<string, unknown>; mandato?: Record<string, string> };
type Janela = Window & {
  __semente?: Semente;
  D?: unknown; Store?: unknown; aviso?: (t: string) => void;
  Ilhas?: { ligar(raiz: HTMLElement): void };
};
const CHAVE = 'teste-rumo.estado';

/* componente solto, sem D: ?comp=jornal&props={json}. Com `editavel` o nome do jornal é um campo de verdade. */
function JornalDemo({ props }: { props: JornalProps & { editavel?: boolean } }) {
  const [jornal, setJornal] = useState(props.jornal);
  return <Jornal {...props} jornal={jornal} onJornal={props.editavel ? setJornal : undefined} />;
}

/* ?ilha=a,b monta as ilhas pedidas (nomes de data-ilha da ponte). window.__semente = {campos, D, mandato} preenche
   D.campos, as listas de D (metas, preditores, rumo...) e Store.mandato antes de montar. */
export default function Harness() {
  const [nomes, setNomes] = useState<string[]>([]);
  const [pronto, setPronto] = useState(false);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [comp, setComp] = useState<{ nome: string; props: JornalProps & { editavel?: boolean } } | null>(null);

  useEffect(() => {
    const w = window as Janela;
    const q = new URLSearchParams(location.search);
    const pedido = q.get('ilha') ?? '';
    if (q.get('comp')) setComp({ nome: q.get('comp')!, props: JSON.parse(q.get('props') ?? '{}') });
    const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? 'null');
    const s0: Semente = w.__semente ?? salvo ?? {};
    const D: Record<string, unknown> = { relacoes: {}, tse: {}, feitos: {}, metas: [], preditores: [], comissoesDesejadas: [], ...s0.D, campos: s0.campos ?? {} };
    const mandato = s0.mandato ?? {};
    w.D = D;
    w.Store = {
      mandato,
      salvar() { localStorage.setItem(CHAVE, JSON.stringify({ campos: D.campos, D: { ...D, campos: undefined }, mandato })); },
      atualizar: async () => {},
    };
    w.aviso = (t: string) => setAvisos((a) => [...a, t]);
    const s = document.createElement('script'); // traz CARGOS_EQUIPE, PREDITORES e os demais dados reais do Guia
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
        {comp?.nome === 'jornal' && <JornalDemo props={comp.props} />}
      </div>
      <div role="status" aria-live="polite" id="avisos">{avisos.map((a, i) => <p key={i}>{a}</p>)}</div>
    </>
  );
}
