'use client';
import { useEffect, useMemo, useState } from 'react';
import { carregaGeo, carregaMun, carregaNacional, carregaUF } from '@/lib/dados';
import { corPartido, mistura } from '@/lib/partidos';
import { nf, pct } from '@/lib/format';
import type { Mun, PartidoVotos } from '@/lib/types';
import { dadosGuia, salva, useLegado } from './ponte';
import { BarrasPartido, MapaMunicipios, useCarga } from './pecas';

type Cargo = { id: string; ano: 2026 | 2024; rot: string; pega: (m: Mun) => { v: number; p: PartidoVotos } | undefined };
export const CARGOS: Cargo[] = [
  { id: 'estadual', ano: 2026, rot: 'Deputado estadual/distrital', pega: (m) => m.estadual },
  { id: 'federal', ano: 2026, rot: 'Deputado federal', pega: (m) => m.federal },
  { id: 'senador', ano: 2026, rot: 'Senador', pega: (m) => m.senador },
  { id: 'governador', ano: 2026, rot: 'Governador (1º turno)', pega: (m) => m.governador },
  { id: 'presidente', ano: 2026, rot: 'Presidente (1º turno)', pega: (m) => m.presidente },
  { id: 'pref', ano: 2024, rot: 'Prefeito (1º turno)', pega: (m) => m.m24?.pref },
  { id: 'ver', ano: 2024, rot: 'Vereador', pega: (m) => m.m24?.ver },
];
export const NIVEIS = [
  { k: 'federal', rot: 'Câmara dos Deputados' },
  { k: 'senado', rot: 'Senado' },
  { k: 'estadual', rot: 'Assembleia Legislativa' },
  { k: 'prefeitos', rot: 'Prefeituras (2024)' },
  { k: 'vereadores', rot: 'Câmaras de vereadores (2024)' },
];

export default function Calor() {
  const { m } = useLegado();
  const mun = useCarga(() => carregaMun(m.uf), m.uf);
  const geo = useCarga(() => carregaGeo(m.uf), m.uf);
  const uf = useCarga(() => carregaUF(m.uf), m.uf);
  const nac = useCarga(() => carregaNacional(), 'nac');

  const salvo = dadosGuia().calor;
  const [ano, setAno] = useState<2026 | 2024>(salvo?.ano ?? 2026);
  const [cargoId, setCargoId] = useState(salvo?.cargoId ?? 'estadual');
  const [partidoSel, setPartidoSel] = useState(salvo?.partido ?? (m.partido || '').toUpperCase());
  const [munSel, setMunSel] = useState<string | null>(null);
  const [nivel, setNivel] = useState('estadual');

  const temM24 = m.uf !== 'DF';
  const cargosAno = CARGOS.filter((c) => c.ano === ano);
  const cargo = cargosAno.find((c) => c.id === cargoId) ?? cargosAno[0];

  const resumo = useMemo(() => {
    if (!mun.dados) return null;
    const tot = new Map<string, number>();
    const lider = new Map<string, number>();
    let validos = 0;
    for (const x of Object.values(mun.dados.mun)) {
      const b = cargo.pega(x);
      if (!b || !b.v) continue;
      validos += b.v;
      b.p.forEach(([p, v]) => tot.set(p, (tot.get(p) ?? 0) + v));
      if (b.p[0]) lider.set(b.p[0][0], (lider.get(b.p[0][0]) ?? 0) + 1);
    }
    return { lista: [...tot.entries()].sort((a, b) => b[1] - a[1]), validos, lider };
  }, [mun.dados, cargo]);

  const partido = resumo?.lista.some(([p]) => p === partidoSel) ? partidoSel : resumo?.lista[0]?.[0] ?? '';
  const pcts = useMemo(() => {
    const out = new Map<string, number>();
    let max = 0;
    if (mun.dados) {
      for (const [id, x] of Object.entries(mun.dados.mun)) {
        const b = cargo.pega(x);
        if (!b || !b.v) continue;
        const p = ((b.p.find((q) => q[0] === partido)?.[1] ?? 0) / b.v) * 100;
        out.set(id, p);
        if (p > max) max = p;
      }
    }
    return { out, max };
  }, [mun.dados, cargo, partido]);

  useEffect(() => {
    if (!resumo) return;
    dadosGuia().calor = { ano, cargoId: cargo.id, partido };
    salva();
  }, [ano, cargo.id, partido, resumo]);

  if (!m.uf) return <div className="apoio atencao"><span className="tag">Atenção</span>Informe a UF em “Dados do mandato” para ver o mapa.</div>;

  const cor = corPartido(partido);
  const fill = (id: string) => (pcts.out.has(id) ? mistura(cor, 0.06 + 0.94 * (pcts.max ? pcts.out.get(id)! / pcts.max : 0)) : '#d9d2c3');
  const detalhe = munSel && mun.dados ? mun.dados.mun[munSel] : null;
  const detB = detalhe ? cargo.pega(detalhe) : null;
  const totalPartido = resumo?.lista.find(([p]) => p === partido)?.[1] ?? 0;
  const cadUF = uf.dados?.cadeiras ?? {};
  const totUF = (k: string) => Object.values(cadUF[k] ?? {}).reduce((a, b) => a + b, 0);
  const totBR = (k: string) => Object.values(nac.dados?.[k as keyof typeof nac.dados] ?? {}).reduce((a, b) => a + b, 0);

  return (
    <div className="ilha-corpo">
      <h4>Onde o partido tem força em {uf.dados?.nome ?? m.uf}</h4>
      <div className="ilha-controles">
        <div className="abas" style={{ margin: 0 }}>
          {([2026, 2024] as const).map((a) => (
            <button key={a} type="button" aria-selected={ano === a} disabled={a === 2024 && !temM24}
              onClick={() => { setAno(a); setCargoId(a === 2026 ? 'estadual' : 'ver'); setMunSel(null); }}>Eleição {a}</button>
          ))}
        </div>
        <label className="campo"><span className="rot">Cargo</span>
          <select value={cargo.id} onChange={(e) => setCargoId(e.target.value)}>
            {cargosAno.map((c) => <option key={c.id} value={c.id}>{c.rot}</option>)}
          </select></label>
        <label className="campo"><span className="rot">Partido</span>
          <select value={partido} onChange={(e) => setPartidoSel(e.target.value)}>
            {(resumo?.lista ?? []).map(([p, v]) => <option key={p} value={p}>{p} ({pct((v / (resumo?.validos || 1)) * 100, 1)})</option>)}
          </select></label>
      </div>
      {!temM24 && <p className="peq-t">O Distrito Federal não tem eleição municipal.</p>}
      {(mun.carregando || geo.carregando) && <p className="sem">Carregando mapa…</p>}
      {(mun.erro || geo.erro) && <div className="erro-cx">Não foi possível carregar o mapa de {m.uf}.</div>}

      {mun.dados && geo.dados && resumo && (
        <>
          <div className="kpis">
            <div className="kp"><b>{pct((totalPartido / (resumo.validos || 1)) * 100, 1)}</b><span>{partido} no estado · {nf.format(totalPartido)} votos</span></div>
            <div className="kp"><b>{resumo.lider.get(partido) ?? 0}</b><span>municípios em que é o mais votado</span></div>
            <div className="kp"><b>{pct(pcts.max, 0)}</b><span>maior % municipal</span></div>
          </div>
          <div className="ilha-lado">
            <div>
              <MapaMunicipios geo={geo.dados} fill={fill} selecionado={munSel} onSelecionar={setMunSel}
                titulo={(id, nm) => `${nm}: ${pcts.out.has(id) ? pct(pcts.out.get(id)!) : 'sem dados'}`} />
              <div className="escala-l">
                <span>0%</span>
                <i style={{ background: `linear-gradient(90deg, ${mistura(cor, 0.06)}, ${cor})` }} />
                <span>{pct(pcts.max, 0)} dos votos válidos do município</span>
              </div>
              <p className="peq-t">Cinza = município sem dados para este cargo. A escala é relativa ao maior valor do estado.</p>
            </div>
            <div>
              {detalhe && detB ? (
                <>
                  <div className="topo"><h4 style={{ margin: 0 }}>{detalhe.nm}</h4><button type="button" className="rm" onClick={() => setMunSel(null)} aria-label="Fechar">×</button></div>
                  <p className="peq-t">{nf.format(detB.v)} votos válidos · {cargo.rot} {ano}</p>
                  <BarrasPartido destaque={partido} dados={detB.p.slice(0, 10)} />
                </>
              ) : (
                <>
                  <h4 style={{ marginTop: 0 }}>Ranking no estado</h4>
                  <p className="peq-t">Clique num município para ver o detalhe.</p>
                  <BarrasPartido destaque={partido} dados={resumo.lista.slice(0, 12)} />
                </>
              )}
            </div>
          </div>
        </>
      )}

      <h4>Cadeiras do {partido || 'partido'} em todos os níveis</h4>
      <p className="peq-t">Deputados e senadores eleitos em 2026; prefeitos e vereadores eleitos em 2024. Clique numa linha para ver todos os partidos do nível.</p>
      <div className="ilha-lado">
        <div className="rolar">
          <table className="tb" style={{ minWidth: 0 }}>
            <thead><tr><th>Nível</th><th>{m.uf}</th><th>% em {m.uf}</th><th>Brasil</th><th>% no Brasil</th></tr></thead>
            <tbody>
              {NIVEIS.map(({ k, rot }) => {
                const a = cadUF[k]?.[partido] ?? 0;
                const b = nac.dados?.[k as keyof typeof nac.dados]?.[partido] ?? 0;
                return (
                  <tr key={k} className={nivel === k ? 'sel' : ''} onClick={() => setNivel(k)} style={{ cursor: 'pointer' }}>
                    <td><strong>{rot}</strong></td><td>{nf.format(a)}</td>
                    <td>{totUF(k) ? pct((a / totUF(k)) * 100, 1) : '—'}</td><td>{nf.format(b)}</td>
                    <td>{totBR(k) ? pct((b / totBR(k)) * 100, 1) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div>
          <h4 style={{ marginTop: 0 }}>{NIVEIS.find((n) => n.k === nivel)?.rot} em {m.uf}</h4>
          <BarrasPartido destaque={partido} dados={Object.entries(cadUF[nivel] ?? {}).slice(0, 12)} />
        </div>
      </div>
      <p className="peq-t">Os senadores eleitos em 2022 não estão na contagem.</p>
    </div>
  );
}
