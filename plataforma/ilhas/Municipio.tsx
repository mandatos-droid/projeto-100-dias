'use client';
import { useMemo, useState } from 'react';
import { carregaGeo, carregaMun } from '@/lib/dados';
import { nf, pct, semAcento } from '@/lib/format';
import { corPartido } from '@/lib/partidos';
import type { Relacao } from '@/lib/types';
import { salva, useLegado } from './ponte';
import { BarrasPartido, Chip, Foto, Marca, StatusBotoes, useCarga } from './pecas';
import MapaConjuntura, { type Celula, type Marcas } from './MapaConjuntura';

type Pessoa = { sq: string; nome: string; partido: string; votos: number; pctMun: number; eleito: boolean; cargo: string };
type Camada = 'pref' | 'ver';
type Linha = { id: string; nm: string; num: number; txt: string; fill: string; linhas: string[] };

const CLARO: [number, number, number] = [243, 234, 217];
const TEAL: [number, number, number] = [3, 82, 82];
const VAZIO = '#efe8d8';
const mix = (a: [number, number, number], b: [number, number, number], t: number) =>
  `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * Math.min(1, Math.max(0, t)))).join(',')})`;
const grad = (b: [number, number, number]) => `linear-gradient(90deg, ${mix(CLARO, b, 0)}, ${mix(CLARO, b, 1)})`;

const CAMADAS: { k: Camada; t: string }[] = [{ k: 'pref', t: 'Prefeitos' }, { k: 'ver', t: 'Vereadores' }];

export default function Municipio() {
  const { D, m } = useLegado();
  const mun = useCarga(() => carregaMun(m.uf), m.uf);
  const geo = useCarga(() => carregaGeo(m.uf), m.uf);
  const t = D.tse as { cdi?: string; sq?: string; casa?: string; uf?: string; partido?: string; nome?: string };
  const casaId = m.municipio || t.cdi || null;

  const [sel, setSelLocal] = useState<string | null>(D.munSel ?? casaId);
  const [focoSig, setFocoSig] = useState(0);
  const [busca, setBusca] = useState('');
  const [camada, setCamada] = useState<Camada>('pref');
  const [mostraMarcas, setMostraMarcas] = useState(true);
  const partido = (m.partido || t.partido || '').toUpperCase();

  const setSel = (id: string | null, aproxima = false) => {
    setSelLocal(id); D.munSel = id; salva();
    if (aproxima) setFocoSig((n) => n + 1);
  };
  const lista = useMemo(
    () => (mun.dados ? Object.entries(mun.dados.mun).map(([id, x]) => ({ id, nm: x.nm })).sort((a, b) => a.nm.localeCompare(b.nm, 'pt')) : []),
    [mun.dados]);
  const sugestoes = busca.trim().length >= 2 ? lista.filter((x) => semAcento(x.nm).includes(semAcento(busca))).slice(0, 8) : [];

  /* ---------- valor de cada município na camada ativa ---------- */
  /* ---------- valor de cada município na camada ativa ---------- */
  const camadaInfo = useMemo(() => {
    if (!mun.dados) return null;
    const bruto = Object.entries(mun.dados.mun).map(([id, x]) => ({
      id, nm: x.nm, total: x.m24?.ver.eleitos.length ?? 0, eleitos: x.m24?.ver.el?.[partido] ?? 0, prefEleito: x.m24?.pref.cands.find((c) => c[4]), pref: x.m24?.pref,
    }));
    const maxE = Math.max(1, ...bruto.map((b) => b.eleitos));
    const linhas: Linha[] = bruto.map((b) => {
      if (camada === 'pref') {
        const pe = b.prefEleito;
        return {
          id: b.id, nm: b.nm, num: 0, txt: pe ? `${pe[1]}` : '—', fill: pe ? corPartido(pe[1]) : VAZIO,
          linhas: pe ? [`${pe[0]} · ${pe[1]}`, `${pct((pe[2] / (b.pref?.v || 1)) * 100)} dos votos válidos em 2024`] : ['Sem dados de prefeitura'],
        };
      }
      return {
        id: b.id, nm: b.nm, num: b.eleitos, txt: String(b.eleitos), fill: b.eleitos ? mix(CLARO, TEAL, Math.pow(b.eleitos / maxE, 0.6)) : VAZIO,
        linhas: [`${b.eleitos} vereador${b.eleitos === 1 ? '' : 'es'} do ${partido || 'partido'} eleito${b.eleitos === 1 ? '' : 's'} em 2024`,
          `${pct(b.total ? (b.eleitos / b.total) * 100 : 0)} da câmara (${b.total} vereadores)`],
      };
    });
    const c: Record<string, number> = {};
    if (camada === 'pref') bruto.forEach((b) => { if (b.prefEleito) c[b.prefEleito[1]] = (c[b.prefEleito[1]] ?? 0) + 1; });
    const partidosPref = Object.entries(c).sort((a, b) => b[1] - a[1]);
    return { linhas, partidosPref, maxLegenda: String(maxE), porId: new Map(linhas.map((l) => [l.id, l])) };
  }, [mun.dados, camada, partido]);

  const celulas = useMemo(() => {
    const o: Record<string, Celula> = {};
    camadaInfo?.linhas.forEach((l) => { o[l.id] = { fill: l.fill, titulo: l.nm, linhas: l.linhas }; });
    return o;
  }, [camadaInfo]);

  /* aliados, opositores e potenciais relacionamentos já marcados em algum município deste estado */
  const marcas = useMemo(() => {
    const out: Marcas = {};
    if (!mun.dados) return out;
    const idPorNome = new Map(lista.map((x) => [semAcento(x.nm), x.id]));
    for (const r of Object.values(D.relacoes ?? {})) {
      if (r.uf !== m.uf || !r.mun || r.status === 'neutro') continue;
      const id = idPorNome.get(semAcento(r.mun));
      if (!id) continue;
      (out[id] ??= { aliado: 0, concorrente: 0, potencial: 0 })[r.status]++;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mun.dados, lista, D.relacoes, m.uf, JSON.stringify(D.relacoes)]);

  if (!m.uf) return <div className="apoio atencao"><span className="tag">Atenção</span>Informe a UF em “Dados do mandato” para escolher um município.</div>;

  const x = sel && mun.dados ? mun.dados.mun[sel] : null;
  const rel = (p: Pessoa): Omit<Relacao, 'status'> => ({ nome: p.nome, partido: p.partido, cargo: p.cargo, uf: m.uf, mun: x?.nm, votos: p.votos });
  const prefeitos: Pessoa[] = (x?.m24?.pref.cands ?? []).map((c) => ({
    sq: c[3], nome: c[0], partido: c[1], votos: c[2], pctMun: (c[2] / (x?.m24?.pref.v || 1)) * 100, eleito: !!c[4], cargo: 'Prefeito',
  }));
  const vereadores: Pessoa[] = (x?.m24?.ver.eleitos ?? []).map((c) => ({
    sq: c[3], nome: c[0], partido: c[1], votos: c[2], pctMun: (c[2] / (x?.m24?.ver.v || 1)) * 100, eleito: true, cargo: 'Vereador',
  }));
  const eleitoPref = prefeitos.find((p) => p.eleito);
  const resumoVer = x?.m24?.ver.el ? Object.entries(x.m24.ver.el) : [];

  const ATORES: { k: Camada; t: string; n: number }[] = [
    { k: 'pref', t: 'Prefeito', n: prefeitos.length },
    { k: 'ver', t: 'Vereadores', n: vereadores.length },
  ];
  const lugares = camada === 'pref' ? prefeitos : [...vereadores].sort((a, b) => Number(b.partido === partido) - Number(a.partido === partido) || b.votos - a.votos);
  const nota = camada === 'pref' ? 'Candidatos do 1º turno de 2024; “eleito” indica quem venceu.' : `Todos os vereadores eleitos em 2024; os do ${partido || 'seu partido'} vêm primeiro.`;

  const top = camadaInfo && camada === 'ver'
    ? [...camadaInfo.linhas].filter((l) => l.num > 0).sort((a, b) => b.num - a.num).slice(0, 8) : [];
  const maxTop = Math.max(0.0001, ...top.map((l) => l.num));

  return (
    <div className="ilha-corpo cj">
      <h4>Atores locais · prefeitos e vereadores</h4>
      {(mun.carregando || geo.carregando) && <p className="sem">Carregando…</p>}
      {(mun.erro || geo.erro) && <div className="erro-cx">Não foi possível carregar os dados de {m.uf}.</div>}

      {mun.dados && geo.dados && camadaInfo && (
        <>
          <div className="cj-barra">
            <div className="cj-seg" role="tablist" aria-label="Camada do mapa">
              {CAMADAS.map((c) => (
                <button key={c.k} type="button" role="tab" aria-selected={camada === c.k} onClick={() => setCamada(c.k)}>{c.t}</button>
              ))}
            </div>
            <label className="cj-busca">
              <span className="rot">Buscar município</span>
              <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite o nome" />
              {sugestoes.length > 0 && (
                <div className="sugestoes">
                  {sugestoes.map((f) => (
                    <button key={f.id} type="button" onClick={() => { setSel(f.id, true); setBusca(''); }}>{f.nm}</button>
                  ))}
                </div>
              )}
            </label>
          </div>

          <div className="cj-grade">
            <div className="cj-esq">
              <MapaConjuntura geo={geo.dados} celulas={celulas} selecionado={sel} casa={casaId && mun.dados.mun[casaId] ? casaId : null}
                marcas={marcas} mostraMarcas={mostraMarcas} onSelecionar={(id) => setSel(id)} focoSignal={focoSig} />

              <div className="cj-leg">
                {camada === 'pref' ? (
                  <ul className="cj-partidos" aria-label="Partido do prefeito eleito em 2024">
                    {camadaInfo.partidosPref.slice(0, 9).map(([p, n]) => (
                      <li key={p}><i style={{ background: corPartido(p) }} />{p}<b>{n}</b></li>
                    ))}
                    {camadaInfo.partidosPref.length > 9 && <li className="mais">+{camadaInfo.partidosPref.length - 9} partidos</li>}
                  </ul>
                ) : (
                  <div className="escala-l">
                    <span>0</span>
                    <i style={{ background: grad(TEAL) }} />
                    <span>{camadaInfo.maxLegenda} vereadores do {partido || 'partido'}</span>
                  </div>
                )}
                <label className="cj-chk">
                  <input type="checkbox" checked={mostraMarcas} onChange={(e) => setMostraMarcas(e.target.checked)} />
                  <Marca tipo="aliado" tam={12} /><Marca tipo="concorrente" tam={12} /><Marca tipo="potencial" tam={12} /> aliados, opositores e potenciais relacionamentos marcados
                  {casaId && <><Marca tipo="proprio" tam={13} /> município de origem</>}
                </label>
              </div>
              <p className="peq-t cj-dica">Passe o mouse para ver o nome · role para aproximar · arraste para mover · clique para ver os atores.</p>
            </div>

            <aside className="cj-lado" aria-live="polite">
              {x && sel ? (
                <>
                  <div className="cj-cab">
                    <h3>{x.nm}</h3>
                    <span className="cj-acoes">
                      <button type="button" className="bt fant peq" onClick={() => setFocoSig((n) => n + 1)}>Aproximar</button>
                      <button type="button" className="bt fant peq" onClick={() => setSel(null)}>Fechar</button>
                    </span>
                  </div>
                  <div className="kpis" style={{ gridTemplateColumns: '1fr 1fr', margin: '12px 0 10px' }}>
                    <div className="kp"><b>{prefeitos.length}</b><span>candidatos a prefeito em 2024</span></div>
                    <div className="kp"><b>{partido ? (resumoVer.find(([p]) => p === partido)?.[1] ?? 0) : '—'}</b><span>vereadores do {partido || 'partido'} (de {vereadores.length} eleitos em 2024)</span></div>
                  </div>
                  {eleitoPref && <p className="com-foto"><Foto sq={eleitoPref.sq} uf={m.uf} ano={2024} nome={eleitoPref.nome} tam={48} /><span><strong>Prefeito(a):</strong> {eleitoPref.nome} ({eleitoPref.partido})</span></p>}

                  <div className="cj-seg cj-atores" role="tablist" aria-label="Quais atores mostrar">
                    {ATORES.map((a) => (
                      <button key={a.k} type="button" role="tab" aria-selected={camada === a.k} onClick={() => setCamada(a.k)}>{a.t}<small>{a.n}</small></button>
                    ))}
                  </div>
                  <p className="peq-t" style={{ margin: '8px 0 4px' }}>{nota}</p>

                  {lugares.length === 0 ? <p className="sem">Sem dados para este município.</p> : (
                    <ul className="cj-pessoas rolagem">
                      {lugares.map((p) => (
                        <li key={p.sq}>
                          <Foto sq={p.sq} uf={m.uf} ano={2024} nome={p.nome} tam={38} />
                          <div className="cj-pnome">
                            <strong>{p.nome}</strong>
                            <span><Chip p={p.partido} />{p.eleito && p.cargo !== 'Vereador' && <span className="selo ok">eleito</span>}</span>
                            <span className="peq-t">{nf.format(p.votos)} votos · {pct(p.pctMun)}</span>
                          </div>
                          <StatusBotoes chave={p.sq} rel={rel(p)} />
                        </li>
                      ))}
                    </ul>
                  )}
                  {camada === 'ver' && resumoVer.length > 0 && (<><h4 style={{ marginTop: 18 }}>Câmara de vereadores por partido</h4><BarrasPartido destaque={partido} dados={resumoVer as [string, number][]} /></>)}
                </>
              ) : (
                <>
                  <p className="cj-vazio">Clique em um município para ver o prefeito e os vereadores que atuam ali.</p>
                  {top.length > 0 && (
                    <>
                      <h5 className="mv-sub">Municípios com mais vereadores do {partido}</h5>
                      {top.map((l, i) => (
                        <button key={l.id} type="button" className="mv-rk" onClick={() => setSel(l.id, true)}>
                          <span className="n">{i + 1}</span><span className="nm">{l.nm}</span>
                          <span className="fundo"><i style={{ width: `${(l.num / maxTop) * 100}%` }} /></span>
                          <span className="v">{l.txt}</span>
                        </button>
                      ))}
                    </>
                  )}
                </>
              )}
            </aside>
          </div>
        </>
      )}
      <p className="peq-t">Aliados, opositores e potenciais relacionamentos marcados aqui aparecem no resumo do preenchimento e no próprio mapa.</p>
    </div>
  );
}
