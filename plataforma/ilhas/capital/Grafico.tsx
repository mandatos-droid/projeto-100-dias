'use client';
/* Missão 4 · gráficos simples em SVG/HTML, sem biblioteca: linha (semanas no eixo horizontal) e barras horizontais.
   Identidade nunca só por cor: legenda com o mesmo marcador de cada série, valor escrito no último ponto, e uma tabela
   equivalente em "Ver como tabela". As cores seguem a paleta categórica validada da skill dataviz, em ordem fixa, e o
   gráfico traz a própria superfície, então vale no Guia claro e num tema escuro. */
import { rotuloMes, rotuloSemana, rotuloSemanaCurto } from '@/lib/comunicacao';
import './capital.css';

export type Periodo = 'semana' | 'mes';
/** `cor` (0 a 4) fixa a cor e o marcador da série; sem ele, valem a ordem da série no gráfico. */
export type SerieLinha = { id: string; rot: string; cor?: number; pontos: { x: string; valor: number }[] };
export type ItemBarra = { id: string; rot: string; valor: number };
export type GraficoProps =
  | { tipo: 'linha'; titulo: string; series: SerieLinha[]; vazio?: string; alto?: number; periodo?: Periodo; semTabela?: boolean }
  | { tipo: 'barras'; titulo: string; itens: ItemBarra[]; vazio?: string };

const L = 360, A_PADRAO = 220, ME = 38, MD = 22, MT = 18, MB = 30; // tamanho do desenho e margens

/** "2026-W47" → "16/11" (segunda-feira da semana) no eixo; outros rótulos ficam como vieram. */
export const rotuloX = rotuloSemanaCurto;

/** Rótulo curto do eixo: "16/11" para a semana (segunda-feira) e "11/26" (MM/AA) para o mês. */
export const rotuloEixo = (x: string, periodo: Periodo) => (periodo === 'mes' && /^\d{4}-\d{2}$/.test(x) ? `${x.slice(5)}/${x.slice(2, 4)}` : rotuloX(x));
export const rotuloLongo = (x: string, periodo: Periodo) => (periodo === 'mes' ? rotuloMes(x) : rotuloSemana(x));

/** Teto "redondo" do eixo vertical: 1, 2, 5 ou 10 vezes uma potência de 10. */
export function tetoEixo(max: number): number {
  if (!(max > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(max));
  return ([1, 2, 5, 10].map((m) => m * p).find((t) => t >= max)) ?? 10 * p;
}

const MARCAS = ['circulo', 'quadrado', 'losango', 'triangulo', 'cruz'] as const;
function Marca({ forma, x, y, r = 4.5 }: { forma: (typeof MARCAS)[number]; x: number; y: number; r?: number }) {
  const p = { fill: 'var(--c)', stroke: 'var(--g-sup)', strokeWidth: 2 };
  if (forma === 'quadrado') return <rect x={x - r} y={y - r} width={2 * r} height={2 * r} {...p} />;
  if (forma === 'losango') return <polygon points={`${x},${y - r - 1} ${x + r + 1},${y} ${x},${y + r + 1} ${x - r - 1},${y}`} {...p} />;
  if (forma === 'triangulo') return <polygon points={`${x},${y - r - 1} ${x + r + 1},${y + r} ${x - r - 1},${y + r}`} {...p} />;
  if (forma === 'cruz') return <polygon points={`${x - 1.5},${y - r} ${x + 1.5},${y - r} ${x + 1.5},${y - 1.5} ${x + r},${y - 1.5} ${x + r},${y + 1.5} ${x + 1.5},${y + 1.5} ${x + 1.5},${y + r} ${x - 1.5},${y + r} ${x - 1.5},${y + 1.5} ${x - r},${y + 1.5} ${x - r},${y - 1.5} ${x - 1.5},${y - 1.5}`} {...p} />;
  return <circle cx={x} cy={y} r={r} {...p} />;
}

/** Tabela equivalente ao(s) gráfico(s) de linha: uma linha por semana (ou mês), uma coluna por série. */
export function TabelaSeries({ series, periodo = 'semana' }: { series: SerieLinha[]; periodo?: Periodo }) {
  const xs = [...new Set(series.flatMap((s) => s.pontos.map((p) => p.x)))].sort();
  if (!xs.length) return null;
  return (
    <details className="cp-g-tab">
      <summary>Ver como tabela</summary>
      <table>
        <thead><tr><th scope="col">{periodo === 'mes' ? 'Mês' : 'Semana'}</th>{series.map((s) => <th key={s.id} scope="col">{s.rot}</th>)}</tr></thead>
        <tbody>{xs.map((x) => <tr key={x}><th scope="row">{rotuloLongo(x, periodo)}</th>{series.map((s) => <td key={s.id}>{s.pontos.find((p) => p.x === x)?.valor ?? '–'}</td>)}</tr>)}</tbody>
      </table>
    </details>
  );
}

function Linha({ titulo, series, vazio, alto, periodo = 'semana', semTabela }: { titulo: string; series: SerieLinha[]; vazio?: string; alto?: number; periodo?: Periodo; semTabela?: boolean }) {
  const A = alto ?? A_PADRAO;
  const xs = [...new Set(series.flatMap((s) => s.pontos.map((p) => p.x)))].sort();
  if (!xs.length) return <p className="cp-g-vazio">{vazio ?? 'Ainda não há registros para mostrar.'}</p>;
  const teto = tetoEixo(Math.max(0, ...series.flatMap((s) => s.pontos.map((p) => p.valor))));
  const px = (i: number) => (xs.length === 1 ? (ME + L - MD) / 2 : ME + (i * (L - ME - MD)) / (xs.length - 1));
  const py = (v: number) => A - MB - (v / teto) * (A - MB - MT);
  const cada = Math.ceil(xs.length / 6); // no máximo ~6 rótulos no eixo, para não se sobreporem no celular
  const ticks = [0, teto / 2, teto];
  return (
    <>
      <svg className="cp-g-svg" viewBox={`0 0 ${L} ${A}`} role="img" aria-label={`${titulo}. ${series.map((s) => `${s.rot}: ${s.pontos.map((p) => `${rotuloLongo(p.x, periodo)} ${p.valor}`).join(', ')}`).join('. ')}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={ME} x2={L - MD} y1={py(t)} y2={py(t)} className="cp-g-grade" />
            <text x={ME - 6} y={py(t) + 4} textAnchor="end" className="cp-g-eixo">{Number.isInteger(t) ? t : t.toLocaleString('pt-BR')}</text>
          </g>
        ))}
        {xs.map((x, i) => i % cada === 0 && <text key={x} x={px(i)} y={A - 10} textAnchor="middle" className="cp-g-eixo">{rotuloEixo(x, periodo)}</text>)}
        {series.map((s, i) => {
          const k = s.cor ?? i;
          const pts = s.pontos.slice().sort((a, b) => (a.x < b.x ? -1 : 1)).map((p) => ({ ...p, cx: px(xs.indexOf(p.x)), cy: py(p.valor) }));
          const ultimo = pts[pts.length - 1];
          return (
            <g key={s.id} className={`cp-g-s${(k % 5) + 1}`} data-serie={s.id}>
              {pts.length > 1 && <polyline points={pts.map((p) => `${p.cx},${p.cy}`).join(' ')} fill="none" stroke="var(--c)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
              {pts.map((p) => (
                <g key={p.x}>
                  <Marca forma={MARCAS[k % MARCAS.length]} x={p.cx} y={p.cy} />
                  <circle cx={p.cx} cy={p.cy} r={11} fill="transparent"><title>{`${s.rot}, ${rotuloLongo(p.x, periodo)}: ${p.valor}`}</title></circle>
                </g>
              ))}
              {ultimo && series.length <= 4 && <text x={Math.min(ultimo.cx, L - MD)} y={ultimo.cy - 10} textAnchor="middle" className="cp-g-valor">{ultimo.valor}</text>}
            </g>
          );
        })}
      </svg>
      {series.length > 1 && (
        <ul className="cp-g-leg" aria-label="Legenda">
          {series.map((s, i) => (
            <li key={s.id} className={`cp-g-s${((s.cor ?? i) % 5) + 1}`}>
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><Marca forma={MARCAS[(s.cor ?? i) % MARCAS.length]} x={7} y={7} /></svg>{s.rot}
            </li>
          ))}
        </ul>
      )}
      {!semTabela && <TabelaSeries series={series} periodo={periodo} />}
    </>
  );
}

function Barras({ titulo, itens, vazio }: { titulo: string; itens: ItemBarra[]; vazio?: string }) {
  if (!itens.length) return <p className="cp-g-vazio">{vazio ?? 'Ainda não há dados para mostrar.'}</p>;
  const max = Math.max(...itens.map((i) => i.valor), 0);
  return (
    <ul className="cp-g-barras" aria-label={titulo}>
      {itens.map((i) => (
        <li key={i.id} data-id={i.id}>
          <span className="cp-g-rot">{i.rot}</span>
          <span className="cp-g-trilho"><span className="cp-g-barra" style={{ width: `${max > 0 ? Math.max((i.valor / max) * 100, i.valor > 0 ? 2 : 0) : 0}%` }} /></span>
          <span className="cp-g-num">{i.valor}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Grafico(p: GraficoProps) {
  return (
    <figure className="cp-g" data-tipo={p.tipo}>
      <figcaption>{p.titulo}</figcaption>
      {p.tipo === 'linha' ? <Linha titulo={p.titulo} series={p.series} vazio={p.vazio} alto={p.alto} periodo={p.periodo} semTabela={p.semTabela} /> : <Barras titulo={p.titulo} itens={p.itens} vazio={p.vazio} />}
    </figure>
  );
}
