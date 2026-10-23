'use client';
/* Missão 3 · primeira página de jornal do Legado. Só apresentação: HTML e CSS, sem imagem externa.
   Todo texto entra como texto (o React escapa); as colunas e a "foto" são decorativas e ficam fora da árvore de acessibilidade. */
import { useRef } from 'react';
import { aviso } from '../ponte';
import './rumo.css';

export interface JornalProps {
  /** nome do jornal (fictício, "A Gazeta do Mandato" por padrão) */
  jornal: string;
  /** nome parlamentar do mandato */
  nome: string;
  manchete: string;
  /** linha de apoio: bandeiras prioritárias e cargo postulado */
  linhaFina: string;
  /** "dezembro de 2030" ou "ao fim da legislatura" */
  dataEdicao: string;
  fechado: boolean;
  /** com isto o nome do jornal vira um campo editável */
  onJornal?: (nome: string) => void;
  /** a impressão mostra só esta página (padrão); falso quando o jornal é um resumo dentro de outra tela */
  imprime?: boolean;
  /** mostra o botão "Baixar imagem" (PNG da primeira página) */
  baixavel?: boolean;
}

/* larguras das linhas cinza que simulam a matéria; o padrão é fixo para a página não "pular" a cada tecla */
const COL_A = [100, 96, 100, 88, 100, 94, 62];
const COL_B = [100, 92, 100, 98, 84, 100, 100, 58];
const tamanho = (n: number) => (n <= 90 ? 'curta' : n <= 170 ? 'media' : 'longa');

function Coluna({ linhas }: { linhas: number[] }) {
  return <div className="rm-jn-col" aria-hidden="true">{linhas.map((l, i) => <i key={i} style={{ width: `${l}%` }} />)}</div>;
}

export default function Jornal({ jornal, nome, manchete, linhaFina, dataEdicao, fechado, onJornal, imprime = true, baixavel = false }: JornalProps) {
  const texto = manchete.trim();
  const ref = useRef<HTMLElement>(null);
  const baixa = async () => {
    if (!ref.current) return;
    try {
      const { toPng } = await import('html-to-image'); // só carrega quando alguém pede a imagem
      const url = await toPng(ref.current, { pixelRatio: 2, backgroundColor: '#F5ECD9', cacheBust: true });
      const a = document.createElement('a');
      a.href = url;
      a.download = `${jornal.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'primeira-pagina'}.png`;
      a.click();
    } catch { aviso('Não foi possível gerar a imagem. Use a impressão do navegador.'); }
  };
  const pagina = (
    <article ref={ref} className="rm-jornal" aria-label={`Primeira página de ${jornal}`} data-imprime={imprime ? '' : undefined} data-fechado={fechado}>
      <header className="rm-jn-cabeca">
        {onJornal
          ? <input className="rm-jn-titulo" value={jornal} onChange={(e) => onJornal(e.target.value)} aria-label="Nome do jornal" maxLength={40} />
          : <p className="rm-jn-titulo">{jornal}</p>}
        <p className="rm-jn-faixa">
          <span>Edição de {dataEdicao}</span>
          <span>{nome ? `Mandato de ${nome}` : 'Mandato parlamentar'}</span>
          <span>Exemplar único</span>
        </p>
      </header>
      <div className="rm-jn-corpo">
        {fechado && <p className="rm-jn-carimbo" role="status">Edição fechada</p>}
        <h2 className={`rm-jn-manchete ${tamanho(texto.length)}${texto ? '' : ' vazia'}`}>
          {texto || 'A manchete aparece aqui à medida que você completa os passos.'}
        </h2>
        {linhaFina.trim() && <p className="rm-jn-fina">{linhaFina}</p>}
        <div className="rm-jn-materia" aria-hidden="true">
          <Coluna linhas={COL_A} />
          <div className="rm-jn-foto" />
          <Coluna linhas={COL_B} />
        </div>
      </div>
    </article>
  );
  if (!baixavel) return pagina;
  return (
    <>
      {pagina}
      <p className="rm-jn-acoes"><button type="button" className="bt sec peq" onClick={baixa}>Baixar imagem</button></p>
    </>
  );
}
