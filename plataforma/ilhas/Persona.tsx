'use client';
import { useMemo, useState, type ReactNode } from 'react';
import { carregaPleitos, carregaUF } from '@/lib/dados';
import { corPartido } from '@/lib/partidos';
import { nf, pct, semAcento } from '@/lib/format';
import type { Cand, CasaChave, Pleito, UFData } from '@/lib/types';
import { atualizaMandato, useLegado } from './ponte';
import { Chip, Foto, useCarga } from './pecas';
import MapaVotos from './MapaVotos';

const CASAS: CasaChave[] = ['federal', 'estadual', 'senado'];
const CARGOS = ['Presidente', 'Governador', 'Senador', 'Deputado Federal', 'Deputado Estadual', 'Deputado Distrital', 'Prefeito', 'Vice-prefeito', 'Vereador', 'Outro'];
const SITUACOES = ['Eleito', 'Eleito por QP', 'Eleito por média', 'Suplente', 'Não eleito', '2º turno'];
const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];
const PARTIDOS = ['PT', 'PL', 'UNIÃO', 'PSD', 'PP', 'REPUBLICANOS', 'MDB', 'PODE', 'PSB', 'PSOL', 'PSDB', 'PDT', 'NOVO', 'PCDOB', 'PV', 'AVANTE', 'SOLIDARIEDADE', 'PRD', 'MISSÃO', 'REDE', 'CIDADANIA', 'DC', 'AGIR', 'PMB', 'PRTB', 'DEMOCRATA', 'MOBILIZA', 'PMN', 'PTB', 'PATRIOTA', 'PROS', 'PSC', 'DEM'];
const local = (c: string) => /prefeit|vereador/i.test(c);

type Vinculo = {
  sq: string; casa: CasaChave; uf: string; nome: string; partido: string; cargo: string;
  votos: number; pct: number; situacao: string; pos: number; candidaturas: number; vagas: number;
};

export function snapshot(uf: UFData, casa: CasaChave, c: Cand): Vinculo {
  const lista = uf[casa].cands;
  return {
    sq: c.s, casa, uf: uf.uf, nome: c.u, partido: c.p, cargo: uf[casa].cargo, votos: c.v, pct: c.x,
    situacao: c.t || (c.e ? 'Eleito' : 'Não eleito'), pos: lista.findIndex((x) => x.s === c.s) + 1,
    candidaturas: lista.length, vagas: uf[casa].vagas,
  };
}

/* ---------- cartão retrátil ---------- */
function Cartao({ aberto, onAlterna, resumo, acoes, children }: {
  aberto: boolean; onAlterna: () => void; resumo: ReactNode; acoes?: ReactNode; children: ReactNode;
}) {
  return (
    <section className={`pl-cartao ${aberto ? 'aberto' : ''}`}>
      <div className="pl-cab">
        <button type="button" className="pl-alterna" aria-expanded={aberto} onClick={onAlterna}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
          <span className="pl-resumo">{resumo}</span>
        </button>
        {acoes && <span className="pl-acoes">{acoes}</span>}
      </div>
      <div className="pl-gaveta"><div className="pl-miolo" {...(aberto ? {} : { inert: true })}>{children}</div></div>
    </section>
  );
}

/* ---------- formulário de pleito manual ---------- */
function FormPleito({ inicial, ufPadrao, onSalvar, onCancelar }: {
  inicial?: Pleito; ufPadrao: string; onSalvar: (p: Pleito) => void; onCancelar: () => void;
}) {
  const [f, setF] = useState({
    ano: String(inicial?.ano ?? ''), cargo: inicial?.cargo ?? 'Deputado Estadual', uf: inicial?.uf ?? ufPadrao,
    municipio: inicial?.municipio ?? '', partido: inicial?.partido ?? '', numero: inicial?.numero ?? '',
    votos: inicial ? String(inicial.votos) : '', pct: inicial?.pct != null ? String(inicial.pct).replace('.', ',') : '',
    situacao: inicial?.situacao ?? 'Não eleito', obs: inicial?.obs ?? '',
  });
  const [erro, setErro] = useState('');
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  function envia(e: React.FormEvent) {
    e.preventDefault();
    const ano = parseInt(f.ano, 10), votos = parseInt(f.votos.replace(/\D/g, ''), 10);
    if (!(ano >= 1945 && ano <= 2100)) return setErro('Informe o ano da eleição.');
    if (!Number.isFinite(votos)) return setErro('Informe a quantidade de votos.');
    const p = parseFloat(f.pct.replace(',', '.'));
    onSalvar({
      id: inicial?.id ?? `p${Date.now().toString(36)}`, ano, cargo: f.cargo, uf: f.uf,
      municipio: local(f.cargo) ? f.municipio.trim() || undefined : undefined,
      partido: f.partido.trim().toUpperCase(), numero: f.numero.trim() || undefined,
      votos, pct: Number.isFinite(p) ? p : undefined, situacao: f.situacao, obs: f.obs.trim() || undefined,
    });
  }

  return (
    <form className="pl-form" onSubmit={envia}>
      <div className="pl-form-t">{inicial ? 'Editar pleito' : 'Novo pleito'}</div>
      <div className="pl-grade">
        <label className="campo"><span className="rot">Ano *</span>
          <input type="text" inputMode="numeric" maxLength={4} value={f.ano} onChange={set('ano')} placeholder="2022" autoFocus /></label>
        <label className="campo"><span className="rot">Cargo *</span>
          <select value={f.cargo} onChange={set('cargo')}>{CARGOS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="campo"><span className="rot">UF</span>
          <select value={f.uf} onChange={set('uf')}><option value="">—</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select></label>
        {local(f.cargo) && (
          <label className="campo"><span className="rot">Município</span>
            <input type="text" value={f.municipio} onChange={set('municipio')} placeholder="Ex.: Goiânia" /></label>
        )}
        <label className="campo"><span className="rot">Partido</span>
          <input type="text" list="pl-partidos" value={f.partido} onChange={set('partido')} placeholder="Sigla" /></label>
        <label className="campo"><span className="rot">Número</span>
          <input type="text" inputMode="numeric" value={f.numero} onChange={set('numero')} placeholder="Opcional" /></label>
        <label className="campo"><span className="rot">Votos *</span>
          <input type="text" inputMode="numeric" value={f.votos} onChange={set('votos')} placeholder="0" /></label>
        <label className="campo"><span className="rot">% dos válidos</span>
          <input type="text" inputMode="decimal" value={f.pct} onChange={set('pct')} placeholder="Opcional" /></label>
        <label className="campo"><span className="rot">Resultado</span>
          <select value={f.situacao} onChange={set('situacao')}>{SITUACOES.map((s) => <option key={s}>{s}</option>)}</select></label>
      </div>
      <label className="campo" style={{ maxWidth: 'none' }}><span className="rot">Observações</span>
        <span className="aj">Coligação, estratégia de campanha, motivo da troca de partido…</span>
        <input type="text" value={f.obs} onChange={set('obs')} /></label>
      <datalist id="pl-partidos">{PARTIDOS.map((p) => <option key={p} value={p} />)}</datalist>
      {erro && <div className="erro-cx" style={{ marginTop: 10 }}>{erro}</div>}
      <div className="bts" style={{ marginTop: 14 }}>
        <button type="submit" className="bt pri peq">{inicial ? 'Salvar alterações' : 'Adicionar pleito'}</button>
        <button type="button" className="bt fant peq" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}

const Selo = ({ s }: { s: string }) => <span className={`selo ${/^eleito/i.test(s) ? 'ok' : ''}`}>{s}</span>;
const Resumo = ({ ano, cargo, lugar, partido, votos, situacao }: { ano: number; cargo: string; lugar?: string; partido?: string; votos?: number; situacao?: string }) => (
  <>
    <span className="pl-ano">{ano}</span>
    <strong>{cargo}</strong>
    {lugar && <span className="peq-t pl-lugar">{lugar}</span>}
    {partido && <Chip p={partido} />}
    {votos != null && <span className="pl-votos">{nf.format(votos)} votos</span>}
    {situacao && <Selo s={situacao} />}
  </>
);

export default function Persona() {
  const { D, m, bump } = useLegado();
  const { dados: uf, erro, carregando } = useCarga(() => carregaUF(m.uf), m.uf);
  const [busca, setBusca] = useState(m.nome_parlamentar || '');
  const tsePl = useCarga(() => (m.uf ? carregaPleitos(m.uf) : Promise.reject(new Error('sem UF'))), m.uf);
  const [abertos, setAbertos] = useState<Record<string, boolean>>({ tse: true });
  const [form, setForm] = useState<string | null>(null); // 'novo' | id do pleito em edição
  const sq = (D.tse as { sq?: string }).sq;
  const alterna = (k: string) => setAbertos((a) => ({ ...a, [k]: !a[k] }));
  const pleitos = D.pleitos ?? [];

  const achado = useMemo(() => {
    if (!uf || !sq) return null;
    for (const casa of CASAS) {
      const c = uf[casa].cands.find((x) => x.s === sq);
      if (c) return { casa, cand: c };
    }
    return null;
  }, [uf, sq]);

  const resultados = useMemo(() => {
    if (!uf || semAcento(busca).length < 3) return [];
    const q = semAcento(busca);
    const out: { casa: CasaChave; cand: Cand }[] = [];
    for (const casa of CASAS) {
      for (const cand of uf[casa].cands) {
        if (semAcento(cand.u).includes(q) || semAcento(cand.c).includes(q)) out.push({ casa, cand });
        if (out.length > 40) break;
      }
    }
    return out.slice(0, 10);
  }, [uf, busca]);

  function vincula(casa: CasaChave, c: Cand) {
    D.tse = { ...snapshot(uf!, casa, c), atualizado: uf![casa].atualizado };
    if (!m.partido) atualizaMandato({ partido: c.p });
    bump();
  }

  function salvaPleito(p: Pleito) {
    const lista = pleitos.some((x) => x.id === p.id) ? pleitos.map((x) => (x.id === p.id ? p : x)) : [...pleitos, p];
    D.pleitos = lista;
    setForm(null);
    setAbertos((a) => ({ ...a, [p.id]: true }));
    bump();
  }
  function removePleito(p: Pleito) {
    if (!window.confirm(`Remover o pleito de ${p.ano} (${p.cargo})?`)) return;
    D.pleitos = pleitos.filter((x) => x.id !== p.id);
    bump();
  }

  /* ---- cartão do TSE ---- */
  const t = D.tse as Partial<Vinculo> & { municipio?: string; ano?: number };
  const vereador = t.casa === ('vereador' as CasaChave);
  const desvincula = <button type="button" className="bt fant peq" onClick={() => { D.tse = {}; bump(); }}>{vereador ? 'Desvincular' : 'Trocar candidatura'}</button>;
  let cartaoTse: { ano: number; no: ReactNode };

  if (vereador) {
    cartaoTse = {
      ano: 2024,
      no: (
        <Cartao aberto={!!abertos.tse} onAlterna={() => alterna('tse')} acoes={desvincula}
          resumo={<Resumo ano={2024} cargo="Vereador(a)" lugar={`${t.municipio} · ${t.uf}`} partido={t.partido} votos={t.votos} situacao={t.situacao} />}>
          <div className="ilha-linha">
            <Foto sq={t.sq ?? ''} uf={t.uf ?? ''} ano={2024} nome={t.nome ?? ''} tam={56} /><Chip p={t.partido ?? ''} /><strong>{t.nome}</strong>
            <span className="peq-t">Vereador(a) · {t.municipio} · {t.uf}</span>
          </div>
          <div className="kpis">
            <div className="kp"><b>{nf.format(t.votos ?? 0)}</b><span>votos totais</span></div>
            <div className="kp"><b>{pct(t.pct ?? 0)}</b><span>dos votos válidos para vereador no município</span></div>
          </div>
          <p className="peq-t">Em 2026 não houve eleição municipal. Fonte: dados abertos do TSE, eleições municipais de 2024.</p>
        </Cartao>
      ),
    };
  } else {
    const casa = achado ? uf![achado.casa] : null;
    const eleitos = casa ? casa.cands.filter((c) => c.e) : [];
    const menor = eleitos.length ? Math.min(...eleitos.map((c) => c.v)) : 0;
    const media = eleitos.length ? Math.round(eleitos.reduce((a, c) => a + c.v, 0) / eleitos.length) : 0;
    const ranking = casa && achado
      ? (() => {
          const top = casa.cands.slice(0, 10);
          return top.includes(achado.cand) ? top : [...top, achado.cand];
        })()
      : [];
    const c = achado?.cand;
    cartaoTse = {
      ano: 2026,
      no: (
        <Cartao aberto={!!abertos.tse} onAlterna={() => alterna('tse')} acoes={achado ? desvincula : undefined}
          resumo={c && casa
            ? <Resumo ano={2026} cargo={casa.cargo} lugar={`${uf!.nome} · TSE`} partido={c.p} votos={c.v} situacao={c.t || (c.e ? 'Eleito' : 'Não eleito')} />
            : <Resumo ano={2026} cargo="Dados do TSE" lugar={m.uf ? 'vincule a candidatura' : undefined} />}>
          {!m.uf && <div className="apoio atencao"><span className="tag">Atenção</span>Informe a UF em “Dados do mandato” para buscar o desempenho eleitoral.</div>}
          {carregando && <p className="sem">Carregando dados de {m.uf}…</p>}
          {erro && <div className="erro-cx">Não foi possível carregar os dados do TSE para {m.uf}.</div>}

          {uf && !achado && (
            <>
              <label className="campo" style={{ maxWidth: 'none' }}>
                <span className="aj">Procure a candidatura em {uf.nome} pelo nome civil ou de urna. Se a liderança não concorreu em 2026 (por exemplo, vereador ou prefeito eleito em 2024), deixe em branco e lance o pleito pelo botão “+”.</span>
                <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite ao menos 3 letras" />
              </label>
              {resultados.length > 0 && (
                <div className="rolar">
                  <table className="tb">
                    <thead><tr><th>Candidatura</th><th>Cargo</th><th>Partido</th><th>Votos</th><th>% válidos</th><th /></tr></thead>
                    <tbody>
                      {resultados.map(({ casa: ck, cand }) => (
                        <tr key={cand.s}>
                          <td><span className="com-foto"><Foto sq={cand.s} uf={m.uf} ano={2026} nome={cand.u} /><span><strong>{cand.u}</strong><br /><span className="peq-t">{cand.c}</span></span></span></td>
                          <td>{uf[ck].cargo}</td><td><Chip p={cand.p} /></td>
                          <td>{nf.format(cand.v)}</td><td>{pct(cand.x)}</td>
                          <td><button type="button" className="bt pri peq" onClick={() => vincula(ck, cand)}>É esta</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {uf && achado && casa && c && (
            <>
              {casa.aviso && <div className="apoio atencao"><span className="tag">TSE</span>{casa.aviso}. Os números podem mudar.</div>}
              <div className="ilha-linha">
                <Foto sq={c.s} uf={m.uf} ano={2026} nome={c.u} tam={56} />
                <Chip p={c.p} />
                <strong>{c.u}</strong>
                <span className="peq-t">nº {c.n} · {casa.cargo} · {uf.nome}</span>
                <span className={`selo ${c.e ? 'ok' : ''}`}>{c.t || (c.e ? 'Eleito' : 'Não eleito')}</span>
              </div>
              <div className="kpis">
                <div className="kp"><b>{nf.format(c.v)}</b><span>votos totais</span></div>
                <div className="kp"><b>{pct(c.x)}</b><span>dos votos válidos do cargo em {m.uf}</span></div>
                <div className="kp"><b>{ranking.length ? casa.cands.indexOf(c) + 1 : '—'}º</b><span>mais votado(a) entre {nf.format(casa.cands.length)} candidaturas</span></div>
                <div className="kp"><b>{nf.format(media)}</b><span>média de votos dos {eleitos.length} eleitos</span></div>
              </div>
              {c.f && <p className="peq-t">Federação: {c.f}</p>}
              {menor > 0 && (
                <p style={{ fontSize: 15 }}>
                  O(a) eleito(a) com menos votos teve <strong>{nf.format(menor)}</strong>.{' '}
                  {c.v >= menor
                    ? `A liderança ficou ${nf.format(c.v - menor)} votos acima dessa marca.`
                    : `A liderança ficou ${nf.format(menor - c.v)} votos abaixo dessa marca.`}
                </p>
              )}

              <MapaVotos uf={m.uf} casa={achado.casa} sq={c.s} nome={c.u} totalUF={c.v} />

              <h4>Posição no ranking de votos</h4>
              <div>
                {ranking.map((r) => {
                  const max = ranking[0].v;
                  return (
                    <div className={`barra-p largo ${r.s === c.s ? 'dest' : ''}`} key={r.s}>
                      <span className="nm">{casa.cands.indexOf(r) + 1}º {r.u}</span>
                      <span className="fundo"><i style={{ width: `${(r.v / max) * 100}%`, background: corPartido(r.p), opacity: r.e ? 1 : 0.4 }} /></span>
                      <span className="v">{nf.format(r.v)}</span>
                    </div>
                  );
                })}
              </div>
              <p className="peq-t">Barras claras = não eleitos. Fonte: resultados.tse.jus.br, totalização de {casa.atualizado}.</p>
            </>
          )}
        </Cartao>
      ),
    };
  }

  /* ---- lista de cartões, do pleito mais recente ao mais antigo ---- */
  const itens: { key: string; ano: number; no: ReactNode }[] = [
    { key: 'tse', ano: cartaoTse.ano, no: cartaoTse.no },
    ...pleitos.map((p) => ({
      key: p.id, ano: p.ano,
      no: form === p.id ? (
        <FormPleito key={p.id} inicial={p} ufPadrao={m.uf} onSalvar={salvaPleito} onCancelar={() => setForm(null)} />
      ) : (
        <Cartao key={p.id} aberto={!!abertos[p.id]} onAlterna={() => alterna(p.id)}
          acoes={<>
            <button type="button" className="bt fant peq" onClick={() => setForm(p.id)}>Editar</button>
            <button type="button" className="bt fant peq pl-rm" onClick={() => removePleito(p)}>Remover</button>
          </>}
          resumo={<Resumo ano={p.ano} cargo={p.cargo} lugar={[p.municipio, p.uf].filter(Boolean).join(' · ') || undefined} partido={p.partido || undefined} votos={p.votos} situacao={p.situacao} />}>
          <div className="kpis">
            <div className="kp"><b>{nf.format(p.votos)}</b><span>votos totais</span></div>
            {p.pct != null && <div className="kp"><b>{pct(p.pct)}</b><span>dos votos válidos</span></div>}
            {p.numero && <div className="kp"><b>{p.numero}</b><span>número de urna</span></div>}
          </div>
          {p.obs && <p style={{ fontSize: 15 }}>{p.obs}</p>}
          <p className="peq-t">Lançado manualmente.</p>
        </Cartao>
      ),
    })),
  ];
  /* pleitos anteriores (2006 a 2024) reconhecidos pelo título eleitoral (scripts/build_pleitos.py), salvo os lançados à mão */
  const doTse = (sq ? tsePl.dados?.[sq] : undefined) ?? [];
  doTse.forEach((p, i) => {
    const [ano, cargo, puf, mun, partido, numero, votos, pc, situacao] = p;
    if (pleitos.some((x) => x.ano === ano && x.cargo.toLowerCase() === cargo.toLowerCase() && (x.municipio ?? '') === mun)) return;
    const key = `tse-${ano}-${i}`;
    itens.push({
      key, ano,
      no: (
        <Cartao key={key} aberto={!!abertos[key]} onAlterna={() => alterna(key)}
          resumo={<Resumo ano={ano} cargo={cargo} lugar={[mun, puf.toUpperCase()].filter(Boolean).join(' · ') + ' · TSE'} partido={partido} votos={votos} situacao={situacao.replace(/ qp$/i, ' QP') || undefined} />}>
          <div className="kpis">
            <div className="kp"><b>{nf.format(votos)}</b><span>votos nominais (1º turno)</span></div>
            {pc > 0 && <div className="kp"><b>{pct(pc)}</b><span>dos votos nominais do cargo{mun ? ' no município' : ''}</span></div>}
            <div className="kp"><b>{numero}</b><span>número de urna</span></div>
          </div>
          <p className="peq-t">Pleito encontrado pelo título eleitoral nos dados abertos do TSE (eleição de {ano}). Se algo estiver errado, lance o pleito à mão pelo “+”: ele substitui este.</p>
        </Cartao>
      ),
    });
  });
  itens.sort((a, b) => b.ano - a.ano);

  return (
    <div className="ilha-corpo">
      <div className="pl-topo">
        <h4>Desempenho eleitoral · {itens.length} {itens.length === 1 ? 'pleito' : 'pleitos'}</h4>
        <button type="button" className="pl-mais" aria-label="Adicionar pleito manualmente" title="Adicionar pleito manualmente"
          aria-expanded={form === 'novo'} onClick={() => setForm(form === 'novo' ? null : 'novo')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>
      {form === 'novo' && <FormPleito ufPadrao={m.uf} onSalvar={salvaPleito} onCancelar={() => setForm(null)} />}
      <div className="pl-lista">{itens.map((i) => <div key={i.key}>{i.no}</div>)}</div>
    </div>
  );
}
