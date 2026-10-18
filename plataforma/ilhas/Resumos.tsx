'use client';
/* Versões somente leitura dos módulos da Missão 1, para a aba Resumo.
   Repetem a visão que a equipe deixou nos exercícios (D.calor, D.munSel, D.casaSel). */
import { useMemo } from 'react';
import { carregaEleitos, carregaGeo, carregaMun, carregaNacional, carregaUF } from '@/lib/dados';
import { corPartido, mistura } from '@/lib/partidos';
import { nf, pct, semAcento } from '@/lib/format';
import type { CasaChave } from '@/lib/types';
import { CARGOS, NIVEIS } from './Calor';
import { dadosGuia, statusDe, useLegado } from './ponte';
import { BarrasPartido, Hemiciclo, Marca, MapaMunicipios, useCarga, type Membro } from './pecas';

const semUF = (
  <p className="sem">Informe a UF em “Dados do mandato” para ver o mapa.</p>
);
const nada = () => {};

export function CalorResumo() {
  const { D, m } = useLegado();
  const mun = useCarga(() => carregaMun(m.uf), m.uf);
  const geo = useCarga(() => carregaGeo(m.uf), m.uf);
  const uf = useCarga(() => carregaUF(m.uf), m.uf);
  const nac = useCarga(() => carregaNacional(), 'nac');

  const escolha = D.calor;
  const cargo = CARGOS.find((c) => c.id === escolha?.cargoId && c.ano === escolha?.ano) ?? CARGOS[0];
  const partido = escolha?.partido || (m.partido || '').toUpperCase();

  const pcts = useMemo(() => {
    const out = new Map<string, number>();
    let max = 0, validos = 0, total = 0, lider = 0;
    if (mun.dados) {
      for (const [id, x] of Object.entries(mun.dados.mun)) {
        const b = cargo.pega(x);
        if (!b || !b.v) continue;
        const v = b.p.find((q) => q[0] === partido)?.[1] ?? 0;
        const p = (v / b.v) * 100;
        out.set(id, p);
        if (p > max) max = p;
        validos += b.v;
        total += v;
        if (b.p[0]?.[0] === partido) lider++;
      }
    }
    return { out, max, validos, total, lider };
  }, [mun.dados, cargo, partido]);

  if (!m.uf) return semUF;
  if (!partido) return <p className="sem">Escolha um partido no mapa de calor da pergunta 5 para ele aparecer aqui.</p>;

  const cor = corPartido(partido);
  const fill = (id: string) =>
    pcts.out.has(id) ? mistura(cor, 0.06 + 0.94 * (pcts.max ? pcts.out.get(id)! / pcts.max : 0)) : '#d9d2c3';
  const cadUF = uf.dados?.cadeiras ?? {};
  const totUF = (k: string) => Object.values(cadUF[k] ?? {}).reduce((a, b) => a + b, 0);
  const totBR = (k: string) => Object.values(nac.dados?.[k as keyof typeof nac.dados] ?? {}).reduce((a, b) => a + b, 0);

  return (
    <div className="ilha-corpo">
      <h4>Mapa de calor · {partido} · {cargo.rot} {cargo.ano}</h4>
      {(mun.carregando || geo.carregando) && <p className="sem">Carregando mapa…</p>}
      {(mun.erro || geo.erro) && <div className="erro-cx">Não foi possível carregar o mapa de {m.uf}.</div>}
      {mun.dados && geo.dados && (
        <div className="ilha-lado">
          <div>
            <MapaMunicipios geo={geo.dados} fill={fill} selecionado={null} onSelecionar={nada}
              titulo={(id, nm) => `${nm}: ${pcts.out.has(id) ? pct(pcts.out.get(id)!) : 'sem dados'}`} />
            <div className="escala-l">
              <span>0%</span>
              <i style={{ background: `linear-gradient(90deg, ${mistura(cor, 0.06)}, ${cor})` }} />
              <span>{pct(pcts.max, 0)} dos votos válidos do município</span>
            </div>
          </div>
          <div className="kpis" style={{ gridTemplateColumns: '1fr' }}>
            <div className="kp"><b>{pct(pcts.validos ? (pcts.total / pcts.validos) * 100 : 0, 1)}</b><span>{partido} no estado · {nf.format(pcts.total)} votos</span></div>
            <div className="kp"><b>{pcts.lider}</b><span>municípios em que é o mais votado</span></div>
          </div>
        </div>
      )}
      <h4>Cadeiras do {partido} em todos os níveis</h4>
      <div className="rolar">
        <table className="tb" style={{ minWidth: 0 }}>
          <thead><tr><th>Nível</th><th>{m.uf}</th><th>% em {m.uf}</th><th>Brasil</th><th>% no Brasil</th></tr></thead>
          <tbody>
            {NIVEIS.map(({ k, rot }) => {
              const a = cadUF[k]?.[partido] ?? 0;
              const b = nac.dados?.[k as keyof typeof nac.dados]?.[partido] ?? 0;
              return (
                <tr key={k}>
                  <td><strong>{rot}</strong></td><td>{nf.format(a)}</td>
                  <td>{totUF(k) ? pct((a / totUF(k)) * 100, 1) : '—'}</td><td>{nf.format(b)}</td>
                  <td>{totBR(k) ? pct((b / totBR(k)) * 100, 1) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MunicipioResumo() {
  const { D, m } = useLegado();
  const geo = useCarga(() => carregaGeo(m.uf), m.uf);
  const sel = D.munSel ?? (D.tse as { cdi?: string }).cdi ?? null;

  const porNome = new Map<string, Set<string>>();
  let marcados = 0;
  Object.values(dadosGuia().relacoes).forEach((r) => {
    if (!r.mun || r.status === 'neutro') return;
    const k = semAcento(r.mun);
    porNome.set(k, (porNome.get(k) ?? new Set()).add(r.status));
    marcados++;
  });

  if (!m.uf) return semUF;
  const nomeSel = geo.dados?.mun.find((x) => x.id === sel)?.nm;
  const fill = (id: string, nm: string) => {
    const st = porNome.get(semAcento(nm));
    if (st?.has('aliado') && st.has('concorrente')) return '#8a6d3b';
    if (st?.has('aliado')) return '#1B6B4F';
    if (st?.has('concorrente')) return '#EB5454';
    return id === sel ? '#ffd278' : '#e4dccb';
  };
  const nomes = new Map(geo.dados?.mun.map((x) => [x.id, x.nm]) ?? []);

  return (
    <div className="ilha-corpo">
      <h4>Mapa político de {m.uf}{nomeSel ? ` · município em foco: ${nomeSel}` : ''}</h4>
      {geo.carregando && <p className="sem">Carregando mapa…</p>}
      {geo.erro && <div className="erro-cx">Não foi possível carregar o mapa de {m.uf}.</div>}
      {geo.dados && (
        <>
          <MapaMunicipios geo={geo.dados} fill={(id) => fill(id, nomes.get(id) ?? '')} selecionado={sel} onSelecionar={nada}
            titulo={(_, nm) => nm} />
          <p className="peq-t">
            <span className="ponto" style={{ background: '#1B6B4F', display: 'inline-block' }} /> município com parceiro ·{' '}
            <span className="ponto" style={{ background: '#EB5454', display: 'inline-block' }} /> com concorrente ·{' '}
            <span className="ponto" style={{ background: '#8a6d3b', display: 'inline-block' }} /> com ambos ·{' '}
            <span className="ponto" style={{ background: '#ffd278', display: 'inline-block' }} /> em foco
            {marcados === 0 && ' · nenhum parceiro ou concorrente marcado por município ainda'}
          </p>
        </>
      )}
    </div>
  );
}

const ROT_CASA: Record<CasaChave, string> = { estadual: 'Assembleia Legislativa', federal: 'Câmara dos Deputados', senado: 'Senado' };

export function AssentosResumo() {
  const { D, m } = useLegado();
  const { dados: todos, erro, carregando } = useCarga(carregaEleitos, 'eleitos');
  const casa: CasaChave = (D.casaSel as CasaChave | undefined) ?? (D.tse as { casa?: CasaChave }).casa
    ?? (/Federal/.test(m.cargo) ? 'federal' : /Senador/.test(m.cargo) ? 'senado' : 'estadual');
  const escopo = (D.escopoSel as string | undefined) ?? (m.uf || 'BR');
  const k = casa === 'federal' ? 'f' : casa === 'senado' ? 's' : 'e';
  const eleitos = useMemo(() => (todos ?? []).filter((e) => e.k === k && (escopo === 'BR' || e.uf === escopo)), [todos, k, escopo]);
  const membros: Membro[] = useMemo(() => eleitos.map((c) => ({ key: c.s, nome: `${c.u} (${c.uf})`, partido: c.p, votos: c.v })), [eleitos]);
  const contagem = useMemo(() => {
    const c: Record<string, number> = {};
    eleitos.forEach((e) => { c[e.p] = (c[e.p] ?? 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [eleitos]);

  const parceiros = eleitos.filter((e) => statusDe(e.s) === 'aliado').length;
  const concorrentes = eleitos.filter((e) => statusDe(e.s) === 'concorrente').length;

  return (
    <div className="ilha-corpo">
      <h4>{ROT_CASA[casa]} · {escopo === 'BR' ? 'Brasil' : escopo}</h4>
      {carregando && <p className="sem">Carregando…</p>}
      {erro && <div className="erro-cx">Não foi possível carregar os parlamentares eleitos.</div>}
      {eleitos.length > 0 && (
        <div className="ilha-lado">
          <div>
            <Hemiciclo membros={membros} partidos={new Set()} filtroStatus="todos" selecionado={null}
              proprio={(D.tse as { sq?: string }).sq} onSelecionar={nada} />
            <ul className="legenda">
              <li><Marca tipo="aliado" tam={13} /> parceiro</li>
              <li><Marca tipo="concorrente" tam={13} /> concorrente</li>
              <li><Marca tipo="proprio" tam={13} /> esta liderança</li>
            </ul>
          </div>
          <div>
            <div className="kpis" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="kp ok"><b><Marca tipo="aliado" tam={18} /> {parceiros}</b><span>parceiros</span></div>
              <div className="kp coral"><b><Marca tipo="concorrente" tam={18} /> {concorrentes}</b><span>concorrentes</span></div>
            </div>
            <BarrasPartido dados={contagem.slice(0, 10)} destaque={(m.partido || '').toUpperCase()} />
          </div>
        </div>
      )}
    </div>
  );
}
