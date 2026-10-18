'use client';
import { useMemo, useRef, useState } from 'react';
import { carregaGeo } from '@/lib/dados';
import { nf, pct } from '@/lib/format';
import type { CasaChave, GeoUF } from '@/lib/types';
import { useCarga } from './pecas';

type Votos = { atualizado: string; mun: Record<string, [number, number]> };
type Modo = 'votos' | 'pct' | 'forca';
type Linha = { id: string; nm: string; v: number; vv: number; p: number; forca: number; rank: number };

const CLARO: [number, number, number] = [243, 234, 217];
const VINHO: [number, number, number] = [87, 23, 48];
const AZUL: [number, number, number] = [47, 111, 130];
const mix = (a: [number, number, number], b: [number, number, number], t: number) =>
  `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * Math.min(1, Math.max(0, t)))).join(',')})`;

async function buscaVotos(uf: string, casa: CasaChave, sq: string): Promise<Votos> {
  const r = await fetch(`/api/votos-mun?uf=${uf.toLowerCase()}&casa=${casa}&sq=${sq}`);
  if (!r.ok) throw new Error('Não foi possível coletar os votos por município no TSE agora.');
  return r.json();
}

export default function MapaVotos({ uf, casa, sq, nome, totalUF }: { uf: string; casa: CasaChave; sq: string; nome: string; totalUF: number }) {
  const votos = useCarga(() => buscaVotos(uf, casa, sq), `${uf}${casa}${sq}`);
  const geo = useCarga(() => carregaGeo(uf), uf);
  const [modo, setModo] = useState<Modo>('votos');
  const [foco, setFoco] = useState<string | null>(null);
  const [fixo, setFixo] = useState<string | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const caixa = useRef<HTMLDivElement>(null);

  const dados = useMemo(() => {
    if (!votos.dados || !geo.dados) return null;
    const g: GeoUF = geo.dados;
    const soma = Object.values(votos.dados.mun).reduce((a, [v]) => a + v, 0);
    const somaVal = Object.values(votos.dados.mun).reduce((a, [, vv]) => a + vv, 0);
    const media = somaVal ? soma / somaVal : 0;
    const linhas: Linha[] = g.mun.map((m) => {
      const [v, vv] = votos.dados!.mun[m.id] ?? [0, 0];
      const p = vv ? (v / vv) * 100 : 0;
      return { id: m.id, nm: m.nm, v, vv, p, forca: media && vv ? p / 100 / media : 0, rank: 0 };
    });
    [...linhas].sort((a, b) => b.v - a.v).forEach((l, i) => { l.rank = i + 1; });
    const porId = new Map(linhas.map((l) => [l.id, l]));
    const ordem = [...linhas].sort((a, b) => a.rank - b.rank);
    let acum = 0, n50 = 0;
    for (const l of ordem) { acum += l.v; n50++; if (acum >= soma / 2) break; }
    return {
      g, linhas, porId, ordem, soma, media, n50,
      comVoto: linhas.filter((l) => l.v > 0).length,
      maxV: Math.max(1, ...linhas.map((l) => l.v)),
      maxP: Math.max(0.0001, ...linhas.map((l) => l.p)),
      reduto: [...linhas].filter((l) => l.vv >= 500).sort((a, b) => b.p - a.p)[0],
    };
  }, [votos.dados, geo.dados]);

  if (votos.erro || geo.erro) return <div className="erro-cx">{votos.erro ?? geo.erro}</div>;
  if (!dados) {
    return (
      <div className="mv-carga">
        <span className="mv-pulso" />
        <div><strong>Coletando os votos de {nome} município a município…</strong>
          <p className="peq-t" style={{ margin: '2px 0 0' }}>Na primeira vez leva alguns segundos; depois fica guardado.</p></div>
      </div>
    );
  }

  const { g, linhas, porId, ordem, soma, media, n50, maxV, maxP } = dados;
  const cor = (l: Linha) => {
    if (l.vv === 0) return '#efe8d8';
    if (modo === 'votos') return l.v === 0 ? '#efe8d8' : mix(CLARO, VINHO, Math.pow(l.v / maxV, 0.45));
    if (modo === 'pct') return l.v === 0 ? '#efe8d8' : mix(CLARO, VINHO, Math.pow(l.p / maxP, 0.7));
    const lg = Math.log2(Math.max(l.forca, 0.05)) / 2; // −1 … +1 ≈ ¼× … 4× a média estadual
    return lg >= 0 ? mix(CLARO, VINHO, lg) : mix(CLARO, AZUL, -lg);
  };
  const ativo = foco ?? fixo;
  const L = ativo ? porId.get(ativo) : null;
  // ranking acompanha o modo; nas métricas relativas ignora municípios muito pequenos (< 500 votos válidos)
  const metrica = (l: Linha) => (modo === 'votos' ? l.v : modo === 'pct' ? l.p : l.forca);
  const top = (modo === 'votos' ? ordem : linhas.filter((l) => l.vv >= 500 && l.v > 0)).slice().sort((a, b) => metrica(b) - metrica(a)).slice(0, 8);
  const maxM = Math.max(0.0001, ...top.map(metrica));
  const fmtM = (l: Linha) => (modo === 'votos' ? nf.format(l.v) : modo === 'pct' ? pct(l.p) : `${l.forca.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}×`);
  const tituloTop = modo === 'votos' ? '8 municípios com mais votos' : modo === 'pct' ? '8 municípios com maior % dos válidos' : '8 municípios onde a força é maior que a média';

  function move(e: React.MouseEvent) {
    const r = caixa.current?.getBoundingClientRect();
    if (r) setMouse({ x: e.clientX - r.left, y: e.clientY - r.top });
  }

  const legenda = modo === 'forca'
    ? { a: 'abaixo da média do estado', b: 'acima da média', css: `linear-gradient(90deg, ${mix(CLARO, AZUL, 1)}, ${mix(CLARO, AZUL, 0)}, ${mix(CLARO, VINHO, 1)})` }
    : { a: modo === 'votos' ? 'poucos votos' : 'baixo %', b: modo === 'votos' ? `${nf.format(maxV)} votos` : pct(maxP), css: `linear-gradient(90deg, ${mix(CLARO, VINHO, 0)}, ${mix(CLARO, VINHO, 1)})` };

  return (
    <div className="mv">
      <div className="mv-cab">
        <h4 style={{ margin: 0 }}>Onde estão os votos · {g.mun.length} municípios</h4>
        <div className="abas mv-modos" role="tablist">
          {([['votos', 'Total de votos'], ['pct', '% dos votos válidos'], ['forca', 'Força relativa']] as [Modo, string][]).map(([k, t]) => (
            <button key={k} type="button" role="tab" aria-selected={modo === k} onClick={() => setModo(k)}>{t}</button>
          ))}
        </div>
      </div>

      <div className="mv-corpo">
        <div className="mv-mapa" ref={caixa} onMouseMove={move} onMouseLeave={() => { setFoco(null); setMouse(null); }}>
          <svg className="mapa" viewBox={`0 0 ${g.w} ${g.h}`} role="img" aria-label={`Votos de ${nome} por município`}>
            {g.mun.map((m) => {
              const l = porId.get(m.id)!;
              return (
                <path key={m.id} d={m.d} fill={cor(l)} className={`mv-p ${ativo === m.id ? 'ativo' : ''}`}
                  style={{ animationDelay: `${Math.min(1400, l.rank * 5)}ms` }}
                  onMouseEnter={() => setFoco(m.id)} onClick={() => setFixo(fixo === m.id ? null : m.id)} />
              );
            })}
            {L && <path d={g.mun.find((m) => m.id === L.id)!.d} fill="none" className="mv-halo" pointerEvents="none" />}
          </svg>
          {foco && L && mouse && (
            <div className="mv-tip" style={{ left: Math.min(mouse.x + 14, (caixa.current?.clientWidth ?? 400) - 190), top: mouse.y + 14 }}>
              <b>{L.nm}</b>
              <span>{nf.format(L.v)} votos · {pct(L.p)} dos válidos</span>
              <em>{L.rank}º município do estado em votos</em>
            </div>
          )}
          <div className="escala-l"><span>{legenda.a}</span><i style={{ background: legenda.css }} /><span>{legenda.b}</span></div>
          {modo === 'forca' && <p className="peq-t" style={{ margin: '6px 0 0' }}>Compara o % do município com o % do estado ({pct(media * 100)}): vinho = mais forte que a média, azul = mais fraco.</p>}
        </div>

        <aside className="mv-lado">
          <div className="mv-kpis">
            <div><b>{n50}</b><span>município{n50 > 1 ? 's' : ''} somam metade dos votos</span></div>
            <div><b>{dados.comVoto}</b><span>de {g.mun.length} com votos</span></div>
          </div>
          {dados.reduto && (
            <p className="mv-reduto">Maior proporção: <strong>{dados.reduto.nm}</strong>, com {pct(dados.reduto.p)} dos votos válidos locais.</p>
          )}
          <div className="mv-ficha">
            {L ? (
              <>
                <h5>{L.nm}</h5>
                <div className="mv-ficha-n"><b>{nf.format(L.v)}</b><span>votos · {pct(L.p)} dos válidos · {L.rank}º no estado</span></div>
                <p className="peq-t" style={{ margin: '4px 0 0' }}>{pct(soma ? (L.v / soma) * 100 : 0)} de toda a votação da candidatura · {L.forca ? `${L.forca.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}× a média estadual` : 'sem votos válidos'}</p>
                {fixo && <button type="button" className="bt fant peq" onClick={() => setFixo(null)} style={{ padding: '4px 0' }}>Soltar seleção</button>}
              </>
            ) : <p className="peq-t" style={{ margin: 0 }}>Passe o mouse ou clique em um município para ver os detalhes.</p>}
          </div>
          <h5 className="mv-sub">{tituloTop}</h5>
          {top.map((l) => (
            <button key={l.id} type="button" className={`mv-rk ${ativo === l.id ? 'ativo' : ''}`}
              onMouseEnter={() => setFoco(l.id)} onMouseLeave={() => setFoco(null)} onClick={() => setFixo(fixo === l.id ? null : l.id)}>
              <span className="n">{l.rank}</span>
              <span className="nm">{l.nm}</span>
              <span className="fundo"><i style={{ width: `${(metrica(l) / maxM) * 100}%` }} /></span>
              <span className="v">{fmtM(l)}</span>
            </button>
          ))}
        </aside>
      </div>
      <p className="peq-t">Soma dos municípios: {nf.format(soma)} votos{totalUF && soma !== totalUF ? ` (o total do estado, ${nf.format(totalUF)}, pode incluir diferença de totalização)` : ''}. Fonte: resultados.tse.jus.br.</p>
    </div>
  );
}
