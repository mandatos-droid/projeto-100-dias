'use client';
/* Versões somente leitura dos módulos da Missão 1, para a aba Resumo.
   Repetem a visão que a equipe deixou nos exercícios (D.conj2, D.munSel, D.casaSel). */
import { useMemo } from 'react';
import { carregaEleitos, carregaExecBR, carregaExecUF, carregaFiliadosBR, carregaFiliadosUF, carregaGeo, carregaMun, carregaNacional, carregaUF } from '@/lib/dados';
import { nf, pct, semAcento } from '@/lib/format';
import type { CasaChave, EsferaExec, ExecEleito, FilAcum } from '@/lib/types';
import { NIVEIS } from './cargos';
import { ROT_POS, sugere } from './Conjuntura';
import { dadosGuia, statusDe, useLegado } from './ponte';
import { BarrasPartido, Hemiciclo, Marca, MapaMunicipios, useCarga, type Membro } from './pecas';

const semUF = (
  <p className="sem">Informe a UF em “Dados do mandato” para ver o mapa.</p>
);
const nada = () => {};

export function ConjunturaResumo() {
  const { D, m } = useLegado();
  const uf = useCarga(() => carregaUF(m.uf), m.uf);
  const nac = useCarga(() => carregaNacional(), 'nac');
  const fil = useCarga(() => carregaFiliadosUF(m.uf), m.uf);
  const filBR = useCarga(() => carregaFiliadosBR(), 'filbr');
  const exUF = useCarga(() => carregaExecUF(m.uf), m.uf);
  const exBR = useCarga(() => carregaExecBR(), 'exbr');
  const mun = useCarga(() => carregaMun(m.uf), m.uf);

  const partido = (m.partido || '').toUpperCase();
  if (!m.uf) return semUF;
  if (!partido) return <p className="sem">Informe o partido em “Dados do mandato” para ver a conjuntura.</p>;

  const cadUF = uf.dados?.cadeiras ?? {};
  const totUF = (k: string) => Object.values(cadUF[k] ?? {}).reduce((a, b) => a + b, 0);
  const totBR = (k: string) => Object.values(nac.dados?.[k as keyof typeof nac.dados] ?? {}).reduce((a, b) => a + b, 0);
  const somaFil = (mapa?: Record<string, FilAcum>) => Object.values(mapa ?? {}).reduce((a, b) => a + b[0], 0);
  const filA = fil.dados?.uf[partido]?.[0] ?? 0, filB = filBR.dados?.br[partido]?.[0] ?? 0;
  const cdi = (D.tse as { cdi?: string }).cdi || m.municipio || '';
  const nomeMun = mun.dados?.mun[cdi]?.nm;
  const c = D.conj2;

  const esferas: { k: EsferaExec; rot: string; eleito: ExecEleito | undefined }[] = [
    { k: 'pres', rot: 'Presidência da República', eleito: exBR.dados?.pres },
    { k: 'gov', rot: `Governo de ${uf.dados?.nome ?? m.uf}`, eleito: exUF.dados?.gov },
    { k: 'pref', rot: `Prefeitura de ${nomeMun ?? 'seu município'}`, eleito: cdi ? exUF.dados?.pref[cdi] : undefined },
  ];

  return (
    <div className="ilha-corpo">
      <h4>Cadeiras e filiados do {partido}</h4>
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
            <tr>
              <td><strong>Filiados</strong></td><td>{nf.format(filA)}</td>
              <td>{somaFil(fil.dados?.uf) ? pct((filA / somaFil(fil.dados?.uf)) * 100, 1) : '—'}</td><td>{nf.format(filB)}</td>
              <td>{somaFil(filBR.dados?.br) ? pct((filB / somaFil(filBR.dados?.br)) * 100, 1) : '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h4>Posição diante do Executivo</h4>
      <ul className="v2-pos-lista">
        {esferas.map((e) => {
          const eleito = e.eleito && !('pend' in e.eleito) ? e.eleito : null;
          const p = c?.posicao?.[e.k] ?? sugere(eleito ?? undefined, partido);
          return (
            <li key={e.k}>
              <span>{e.rot}{eleito ? ` · ${eleito.n} (${eleito.p})` : e.eleito && 'pend' in e.eleito ? ' · 2º turno pendente' : ''}</span>
              <strong>{p ? ROT_POS[p] : 'a definir'}</strong>
            </li>
          );
        })}
      </ul>
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
