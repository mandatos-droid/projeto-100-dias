'use client';
import { useMemo, useState } from 'react';
import { carregaGeo, carregaHist, carregaMun } from '@/lib/dados';
import { nf, pct, semAcento } from '@/lib/format';
import { corPartido } from '@/lib/partidos';
import type { Relacao } from '@/lib/types';
import { salva, useLegado } from './ponte';
import { BarrasPartido, Chip, Foto, Marca, StatusBotoes, useCarga } from './pecas';
import MapaConjuntura, { type Celula, type Marcas } from './MapaConjuntura';

type Pessoa = { sq: string; nome: string; partido: string; votos: number; pctMun: number; eleito: boolean; cargo: string };
type Camada = 'pref' | 'ver' | 'votos' | 'pct' | 'meus';
type Cargo = 'federal' | 'estadual';
type Ator = 'pref' | 'ver' | 'est' | 'fed';
type Linha = { id: string; nm: string; num: number; txt: string; fill: string; linhas: string[] };

const CLARO: [number, number, number] = [243, 234, 217];
const VINHO: [number, number, number] = [87, 23, 48];
const TEAL: [number, number, number] = [3, 82, 82];
const VAZIO = '#efe8d8';
const mix = (a: [number, number, number], b: [number, number, number], t: number) =>
  `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * Math.min(1, Math.max(0, t)))).join(',')})`;
const grad = (b: [number, number, number]) => `linear-gradient(90deg, ${mix(CLARO, b, 0)}, ${mix(CLARO, b, 1)})`;

const CAMADAS: { k: Camada; t: string }[] = [
  { k: 'pref', t: 'Prefeituras' }, { k: 'ver', t: 'Vereadores eleitos' }, { k: 'votos', t: 'Total de votos' },
  { k: 'pct', t: '% do partido' }, { k: 'meus', t: 'Meus votos' },
];

async function buscaMeusVotos(uf: string, casa: string, sq: string): Promise<{ mun: Record<string, [number, number]> }> {
  const r = await fetch(`/api/votos-mun?uf=${uf.toLowerCase()}&casa=${casa}&sq=${sq}`);
  if (!r.ok) throw new Error('Não foi possível coletar os votos por município no TSE agora.');
  return r.json();
}

export default function Municipio() {
  const { D, m } = useLegado();
  const mun = useCarga(() => carregaMun(m.uf), m.uf);
  const geo = useCarga(() => carregaGeo(m.uf), m.uf);
  const hist = useCarga(() => carregaHist(m.uf), m.uf);
  const t = D.tse as { cdi?: string; sq?: string; casa?: string; uf?: string; partido?: string; nome?: string };
  const casaId = m.municipio || t.cdi || null;

  const [sel, setSelLocal] = useState<string | null>(D.munSel ?? casaId);
  const [focoSig, setFocoSig] = useState(0);
  const [busca, setBusca] = useState('');
  const [camada, setCamada] = useState<Camada>('pref');
  const [ano, setAno] = useState<2026 | 2022>(2026);
  const [cargo, setCargo] = useState<Cargo>('federal');
  const [partido, setPartido] = useState<string>(m.partido || t.partido || '');
  const [ator, setAtor] = useState<Ator>('pref');
  const [mostraMarcas, setMostraMarcas] = useState(true);

  const setSel = (id: string | null, aproxima = false) => {
    setSelLocal(id); D.munSel = id; salva();
    if (aproxima) setFocoSig((n) => n + 1);
  };
  const trocaCamada = (k: Camada) => {
    setCamada(k);
    if (k === 'pref') setAtor('pref');
    if (k === 'ver') setAtor('ver');
  };

  const vinculo = t.sq && t.casa && t.casa !== 'vereador' && (!t.uf || t.uf === m.uf) ? { casa: t.casa, sq: t.sq } : null;
  const meus = useCarga(vinculo && camada === 'meus' ? () => buscaMeusVotos(m.uf, vinculo.casa, vinculo.sq) : null, `${m.uf}${vinculo?.sq}${camada === 'meus'}`);

  const lista = useMemo(
    () => (mun.dados ? Object.entries(mun.dados.mun).map(([id, x]) => ({ id, nm: x.nm })).sort((a, b) => a.nm.localeCompare(b.nm, 'pt')) : []),
    [mun.dados]);
  const sugestoes = busca.trim().length >= 2 ? lista.filter((x) => semAcento(x.nm).includes(semAcento(busca))).slice(0, 8) : [];

  const partidos = useMemo(() => {
    if (!mun.dados) return [] as string[];
    const soma: Record<string, number> = {};
    for (const x of Object.values(mun.dados.mun)) for (const [p, v] of x[cargo]?.p ?? []) soma[p] = (soma[p] ?? 0) + v;
    return Object.entries(soma).sort((a, b) => b[1] - a[1]).map(([p]) => p);
  }, [mun.dados, cargo]);
  const partidoAtivo = partido || partidos[0] || '';

  /* ---------- valor de cada município na camada ativa ---------- */
  const camadaInfo = useMemo(() => {
    if (!mun.dados) return null;
    const dados = mun.dados.mun;
    const nomeCargo = cargo === 'federal' ? 'dep. federal' : (m.uf === 'DF' ? 'dep. distrital' : 'dep. estadual');
    const bruto = Object.entries(dados).map(([id, x]) => {
      const bloco = ano === 2026 ? x[cargo] : hist.dados?.[id]?.[`${cargo}2022`];
      const v = bloco?.v ?? 0;
      const pv = bloco?.p.find(([p]) => p === partidoAtivo)?.[1] ?? 0;
      const mv = meus.dados?.mun[id];
      const eleitos = x.m24?.ver.eleitos.length ?? 0;
      const prefEleito = x.m24?.pref.cands.find((c) => c[4]);
      return { id, nm: x.nm, v, pv, pp: v ? (pv / v) * 100 : 0, mv: mv?.[0] ?? 0, mvv: mv?.[1] ?? 0, eleitos, prefEleito, pref: x.m24?.pref };
    });
    const maxV = Math.max(1, ...bruto.map((b) => b.v));
    const maxP = Math.max(0.0001, ...bruto.map((b) => b.pp));
    const maxM = Math.max(1, ...bruto.map((b) => b.mv));
    const maxE = Math.max(1, ...bruto.map((b) => b.eleitos));
    const totalV = bruto.reduce((a, b) => a + b.v, 0);
    const totalM = bruto.reduce((a, b) => a + b.mv, 0);
    const n = bruto.length;

    const linhas: Linha[] = bruto.map((b) => {
      if (camada === 'pref') {
        const pe = b.prefEleito;
        return {
          id: b.id, nm: b.nm, num: 0, txt: pe ? `${pe[1]}` : '—', fill: pe ? corPartido(pe[1]) : VAZIO,
          linhas: pe ? [`${pe[0]} · ${pe[1]}`, `${pct((pe[2] / (b.pref?.v || 1)) * 100)} dos votos válidos em 2024`] : ['Sem dados de prefeitura'],
        };
      }
      if (camada === 'ver') {
        return {
          id: b.id, nm: b.nm, num: b.eleitos, txt: String(b.eleitos), fill: b.eleitos ? mix(CLARO, TEAL, Math.pow(b.eleitos / maxE, 0.6)) : VAZIO,
          linhas: [`${b.eleitos} vereador${b.eleitos === 1 ? '' : 'es'} eleito${b.eleitos === 1 ? '' : 's'} em 2024`],
        };
      }
      if (camada === 'votos') {
        return {
          id: b.id, nm: b.nm, num: b.v, txt: nf.format(b.v), fill: b.v ? mix(CLARO, VINHO, Math.pow(b.v / maxV, 0.45)) : VAZIO,
          linhas: [`${nf.format(b.v)} votos válidos`, `${nomeCargo} ${ano} · ${pct(totalV ? (b.v / totalV) * 100 : 0)} do estado`],
        };
      }
      if (camada === 'pct') {
        return {
          id: b.id, nm: b.nm, num: b.pp, txt: pct(b.pp), fill: b.pv ? mix(CLARO, VINHO, Math.pow(b.pp / maxP, 0.7)) : VAZIO,
          linhas: [`${partidoAtivo}: ${pct(b.pp)} dos votos`, `${nf.format(b.pv)} de ${nf.format(b.v)} · ${nomeCargo} ${ano}`],
        };
      }
      return {
        id: b.id, nm: b.nm, num: b.mv, txt: nf.format(b.mv), fill: b.mv ? mix(CLARO, VINHO, Math.pow(b.mv / maxM, 0.45)) : VAZIO,
        linhas: [`${nf.format(b.mv)} votos da liderança`, `${pct(b.mvv ? (b.mv / b.mvv) * 100 : 0)} dos válidos · ${pct(totalM ? (b.mv / totalM) * 100 : 0)} da sua votação`],
      };
    });

    const partidosPref: [string, number][] = [];
    if (camada === 'pref') {
      const c: Record<string, number> = {};
      bruto.forEach((b) => { if (b.prefEleito) c[b.prefEleito[1]] = (c[b.prefEleito[1]] ?? 0) + 1; });
      partidosPref.push(...Object.entries(c).sort((a, b) => b[1] - a[1]));
    }
    const maxLegenda = camada === 'votos' ? nf.format(maxV) : camada === 'pct' ? pct(maxP) : camada === 'meus' ? nf.format(maxM) : String(maxE);
    return { linhas, partidosPref, maxLegenda, n, totalV, totalM, nomeCargo, porId: new Map(linhas.map((l) => [l.id, l])) };
  }, [mun.dados, hist.dados, meus.dados, camada, ano, cargo, partidoAtivo, m.uf]);

  const celulas = useMemo(() => {
    const o: Record<string, Celula> = {};
    camadaInfo?.linhas.forEach((l) => { o[l.id] = { fill: l.fill, titulo: l.nm, linhas: l.linhas }; });
    return o;
  }, [camadaInfo]);

  /* parceiros e concorrentes já marcados em algum município deste estado */
  const marcas = useMemo(() => {
    const out: Marcas = {};
    if (!mun.dados) return out;
    const idPorNome = new Map(lista.map((x) => [semAcento(x.nm), x.id]));
    for (const r of Object.values(D.relacoes ?? {})) {
      if (r.uf !== m.uf || !r.mun || r.status === 'neutro') continue;
      const id = idPorNome.get(semAcento(r.mun));
      if (!id) continue;
      (out[id] ??= { aliado: 0, concorrente: 0 })[r.status]++;
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
  const deputados = (chave: 'estadual' | 'federal', rotulo: string): Pessoa[] =>
    (x?.[chave]?.c ?? []).map((c) => ({
      sq: c[3], nome: c[0], partido: c[1], votos: c[2], pctMun: (c[2] / (x?.[chave]?.v || 1)) * 100, eleito: !!c[4], cargo: rotulo,
    }));
  const estaduais = deputados('estadual', m.uf === 'DF' ? 'Deputado Distrital' : 'Deputado Estadual');
  const federais = deputados('federal', 'Deputado Federal');
  const eleitoPref = prefeitos.find((p) => p.eleito);
  const resumoVer = x?.m24?.ver.el ? Object.entries(x.m24.ver.el) : [];

  const ATORES: { k: Ator; t: string; n: number }[] = [
    { k: 'pref', t: 'Prefeito', n: prefeitos.length },
    { k: 'ver', t: 'Vereadores', n: vereadores.length },
    { k: 'est', t: m.uf === 'DF' ? 'Distritais' : 'Estaduais', n: estaduais.length },
    { k: 'fed', t: 'Federais', n: federais.length },
  ];
  const lugares = { pref: prefeitos, ver: vereadores, est: estaduais, fed: federais }[ator];
  const NOTAS: Record<Ator, string> = {
    pref: 'Candidatos do 1º turno de 2024; “eleito” indica quem venceu.',
    ver: 'Todos os vereadores eleitos em 2024.',
    est: 'Os seis mais votados neste município. “Eleito” = conquistou cadeira no estado.',
    fed: 'Os seis mais votados neste município. “Eleito” = conquistou cadeira no estado.',
  };
  const barrasPartido = ator === 'ver' ? resumoVer : ator === 'est' ? x?.estadual?.p.slice(0, 6) : ator === 'fed' ? x?.federal?.p.slice(0, 6) : null;
  const tituloBarras = ator === 'ver' ? 'Câmara de vereadores por partido' : 'Partidos mais votados no município (2026)';

  const top = camadaInfo && camada !== 'pref'
    ? [...camadaInfo.linhas].filter((l) => l.num > 0).sort((a, b) => b.num - a.num).slice(0, 8) : [];
  const maxTop = Math.max(0.0001, ...top.map((l) => l.num));
  const linhaSel = sel ? camadaInfo?.porId.get(sel) : null;
  const carregandoCamada = camada === 'meus' && vinculo && meus.carregando;
  const usaAno = camada === 'votos' || camada === 'pct';
  const usaCargo = camada === 'votos' || camada === 'pct';

  return (
    <div className="ilha-corpo cj">
      <h4>Atores locais · explore o mapa</h4>
      {(mun.carregando || geo.carregando) && <p className="sem">Carregando…</p>}
      {(mun.erro || geo.erro) && <div className="erro-cx">Não foi possível carregar os dados de {m.uf}.</div>}

      {mun.dados && geo.dados && camadaInfo && (
        <>
          <div className="cj-barra">
            <div className="cj-seg" role="tablist" aria-label="Camada do mapa">
              {CAMADAS.map((c) => (
                <button key={c.k} type="button" role="tab" aria-selected={camada === c.k} onClick={() => trocaCamada(c.k)}>{c.t}</button>
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

          {(usaAno || usaCargo) && (
            <div className="cj-opcoes">
              {usaAno && (
                <div className="cj-mini" role="group" aria-label="Ano da eleição">
                  {([2026, 2022] as const).map((a) => <button key={a} type="button" aria-pressed={ano === a} onClick={() => setAno(a)}>{a}</button>)}
                </div>
              )}
              {usaCargo && (
                <div className="cj-mini" role="group" aria-label="Cargo">
                  <button type="button" aria-pressed={cargo === 'federal'} onClick={() => setCargo('federal')}>Dep. federal</button>
                  <button type="button" aria-pressed={cargo === 'estadual'} onClick={() => setCargo('estadual')}>{m.uf === 'DF' ? 'Dep. distrital' : 'Dep. estadual'}</button>
                </div>
              )}
              {camada === 'pct' && (
                <label className="cj-sel-p">Partido
                  <select value={partidoAtivo} onChange={(e) => setPartido(e.target.value)}>
                    {partidos.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
              )}
              {ano === 2022 && hist.erro && <span className="peq-t">Os dados de 2022 não carregaram.</span>}
            </div>
          )}

          {camada === 'meus' && !vinculo && (
            <div className="apoio atencao"><span className="tag">Atenção</span>Vincule a candidatura da liderança em “A persona” para ver em quais municípios estão os votos dela.</div>
          )}
          {camada === 'meus' && meus.erro && <div className="erro-cx">{meus.erro}</div>}
          {carregandoCamada && (
            <div className="mv-carga" style={{ margin: '0 0 12px' }}>
              <span className="mv-pulso" />
              <div><strong>Coletando os votos de {t.nome ?? 'a liderança'} município a município…</strong>
                <p className="peq-t" style={{ margin: '2px 0 0' }}>Na primeira vez leva alguns segundos; depois fica guardado.</p></div>
            </div>
          )}

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
                    <i style={{ background: grad(camada === 'ver' ? TEAL : VINHO) }} />
                    <span>{camadaInfo.maxLegenda}</span>
                  </div>
                )}
                <label className="cj-chk">
                  <input type="checkbox" checked={mostraMarcas} onChange={(e) => setMostraMarcas(e.target.checked)} />
                  <Marca tipo="aliado" tam={12} /><Marca tipo="concorrente" tam={12} /> parceiros e concorrentes marcados
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
                  {linhaSel && camada !== 'pref' && camada !== 'ver' && (
                    <p className="cj-destaque"><b>{linhaSel.txt}</b><span>{linhaSel.linhas.join(' · ')}</span></p>
                  )}
                  <div className="kpis" style={{ gridTemplateColumns: '1fr 1fr', margin: '12px 0 10px' }}>
                    <div className="kp"><b>{nf.format(x.federal?.v ?? 0)}</b><span>votos válidos (dep. federal 2026)</span></div>
                    <div className="kp"><b>{vereadores.length}</b><span>vereadores eleitos em 2024</span></div>
                  </div>
                  {eleitoPref && <p className="com-foto"><Foto sq={eleitoPref.sq} uf={m.uf} ano={2024} nome={eleitoPref.nome} tam={48} /><span><strong>Prefeito(a):</strong> {eleitoPref.nome} ({eleitoPref.partido})</span></p>}

                  <div className="cj-seg cj-atores" role="tablist" aria-label="Quais atores mostrar">
                    {ATORES.map((a) => (
                      <button key={a.k} type="button" role="tab" aria-selected={ator === a.k} onClick={() => setAtor(a.k)}>{a.t}<small>{a.n}</small></button>
                    ))}
                  </div>
                  <p className="peq-t" style={{ margin: '8px 0 4px' }}>{NOTAS[ator]}</p>

                  {lugares.length === 0 ? <p className="sem">Sem dados para este município.</p> : (
                    <ul className="cj-pessoas rolagem">
                      {lugares.map((p) => (
                        <li key={p.sq}>
                          <Foto sq={p.sq} uf={m.uf} ano={p.cargo === 'Prefeito' || p.cargo === 'Vereador' ? 2024 : 2026} nome={p.nome} tam={38} />
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
                  {barrasPartido && barrasPartido.length > 0 && (<><h4 style={{ marginTop: 18 }}>{tituloBarras}</h4><BarrasPartido dados={barrasPartido as [string, number][]} /></>)}
                </>
              ) : (
                <>
                  <p className="cj-vazio">Clique em um município para ver prefeito, vereadores e deputados que atuam ali.</p>
                  {top.length > 0 && (
                    <>
                      <h5 className="mv-sub">Maiores valores nesta camada</h5>
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
      <p className="peq-t">Parceiros e concorrentes marcados aqui aparecem no resumo do preenchimento e no próprio mapa.</p>
    </div>
  );
}
