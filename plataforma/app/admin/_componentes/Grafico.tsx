'use client';

import { useId } from 'react';

// Altura útil das colunas em px; o CSS (.adm .plot) usa o mesmo valor.
const ALTURA = 180;
// Cor de cada série = classe de admin.css (a = vinho, p = cinza-areia). Só variáveis de .adm, nada de cor literal.
const COR = ['a', 'p'] as const;

// nome = texto da legenda; curto = nome usado no rótulo de leitor de tela de cada coluna (padrão: nome)
export interface Serie { nome: string; curto?: string }
// valores[i] pertence a series[i]; `texto` (só em barras) substitui o número escrito à direita da barra.
export interface Categoria { rotulo: string; valores: number[]; texto?: string }

export interface PropsGrafico {
  tipo: 'empilhadas' | 'colunas' | 'barras';
  titulo: string;   // obrigatório (ADM-11.10)
  unidade: string;  // obrigatório: a linha embaixo do título
  series: Serie[];
  categorias: Categoria[];
  vazio: string;    // texto do estado vazio (sem categorias)
  maximo?: number;  // barras: valor que ocupa 100% da largura (padrão: o maior valor)
}

// Eixo com 4 valores inteiros, de cima para baixo (como o wireframe): topo, 2/3, 1/3 e 0.
function eixo(topo: number): number[] {
  return [topo, Math.round((topo * 2) / 3), Math.round(topo / 3), 0];
}

const soma = (v: number[]) => v.reduce((s, x) => s + x, 0);

function Legenda({ series }: { series: Serie[] }) {
  return (
    <div className="key">
      {series.map((s, i) => <span key={s.nome}><i className={COR[i] ?? 'a'} aria-hidden="true" />{s.nome}</span>)}
    </div>
  );
}

function Colunas({ tipo, series, categorias }: Pick<PropsGrafico, 'tipo' | 'series' | 'categorias'>) {
  const topo = Math.max(1, ...categorias.map((c) => soma(c.valores)));
  // com muitas colunas, só rotula uma sim, outra não (contando a partir da última: o mês atual sempre aparece)
  const passo = categorias.length > 8 ? 2 : 1;
  return (
    <div className="plot">
      <div className="yax" aria-hidden="true">{eixo(topo).map((v, i) => <span key={i}>{v}</span>)}</div>
      <div className="cols">
        {categorias.map((c, i) => {
          const descricao = `${c.rotulo}: ${c.valores.map((v, k) => `${series[k]?.curto ?? series[k]?.nome ?? ''} ${v}`.trim()).join(', ')}`;
          return (
            <div key={c.rotulo} className="cl" role="img" aria-label={descricao} title={descricao}>
              <div className="stk">
                {c.valores.map((v, k) => v > 0 && (
                  // contagem dentro do segmento; segmento de 0 não desenha
                  <div key={k} className={`seg ${COR[tipo === 'colunas' ? 0 : k] ?? 'a'}`} style={{ height: (v / topo) * ALTURA }}>{v}</div>
                ))}
              </div>
              {(categorias.length - 1 - i) % passo === 0 && <em>{c.rotulo}</em>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Barras({ categorias, maximo }: Pick<PropsGrafico, 'categorias' | 'maximo'>) {
  const topo = Math.max(1, maximo ?? Math.max(0, ...categorias.map((c) => c.valores[0] ?? 0)));
  return (
    <div className="fun">
      {categorias.map((c) => {
        const v = c.valores[0] ?? 0;
        return (
          <div key={c.rotulo} className="fr">
            <span>{c.rotulo}</span>
            <div className="meter" role="img" aria-label={`${c.rotulo}: ${c.texto ?? v}`}><i style={{ width: `${Math.min(100, (v / topo) * 100)}%` }} /></div>
            <small>{c.texto ?? v}</small>
          </div>
        );
      })}
    </div>
  );
}

export default function Grafico({ tipo, titulo, unidade, series, categorias, vazio, maximo }: PropsGrafico) {
  const id = useId();
  return (
    <div className="chart" role="group" aria-labelledby={id}>
      <h3 className="ct" id={id}>{titulo}</h3>
      <p className="cs">{unidade}</p>
      {categorias.length === 0 ? (
        <p className="gvazio">{vazio}</p>
      ) : tipo === 'barras' ? (
        <Barras categorias={categorias} maximo={maximo} />
      ) : (
        <Colunas tipo={tipo} series={series} categorias={categorias} />
      )}
      {series.length > 1 && <Legenda series={series} />}
    </div>
  );
}
