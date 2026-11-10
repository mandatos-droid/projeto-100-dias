'use client';
/* Pergunta 8 da Missão 1 (conjuntura social do território): mapa do Brasil até o município,
   agendas temáticas que mudam o mapa e registro de problemas e potencialidades nos níveis
   nacional, estadual e municipal. Os registros vão para D.social.
   Os indicadores sociais entram depois, sem mexer aqui: veja lib/agendas.ts. */
import { useMemo, useState } from 'react';
import { carregaGeo, carregaMapaBR, carregaUFs } from '@/lib/dados';
import { AGENDAS, FAIXAS, carregaCatalogo, carregaIndicador, carregaPerfil, faixaDe, opcoesIndicador } from '@/lib/agendas';
import { mistura } from '@/lib/partidos';
import { nf } from '@/lib/format';
import { porTerritorio } from '@/lib/resumoSocial';
import type { GeoUF, ItemSoc, NivelSoc, TipoSoc } from '@/lib/types';
import { useLegado } from './ponte';
import { useCarga } from './pecas';
import MapaConjuntura, { type Celula } from './MapaConjuntura';

const TIPOS: { k: TipoSoc; rot: string; um: string; cor: string; ph: string }[] = [
  { k: 'problema', rot: 'Problemas', um: 'problema', cor: '#C0392B', ph: 'Ex.: Fila de espera por consultas especializadas passa de seis meses' },
  { k: 'potencialidade', rot: 'Potencialidades', um: 'potencialidade', cor: '#1B6B4F', ph: 'Ex.: Rede de cooperativas de agricultura familiar já organizada' },
];
const NIVEIS: { k: NivelSoc; rot: string }[] = [{ k: 'UF', rot: 'Estadual' }, { k: 'MUN', rot: 'Municipal' }];
const ROT_NIVEL: Record<NivelSoc, string> = { BR: 'Nacional', UF: 'Estadual', MUN: 'Municipal' };
type Camada = TipoSoc | 'indicador';

const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const porNome = (a: string, b: string) => a.localeCompare(b, 'pt');
const plural = (n: number, a: string, b: string) => `${nf.format(n)} ${n === 1 ? a : b}`;
const agendaDe = (id: string) => AGENDAS.find((a) => a.id === id);

export default function SocialIlha() {
  const { D, m, bump } = useLegado();
  const br = useCarga(() => carregaMapaBR(), 'br');
  const ufs = useCarga(() => carregaUFs(), 'ufs');

  if (!D.social) D.social = { itens: [] };
  const itens = D.social.itens;

  const [agenda, setAgenda] = useState<string>('todas');
  const [camada, setCamada] = useState<Camada>('problema');
  const [indId, setIndId] = useState('');
  const [vista, setVista] = useState<string | null>(null); // null = Brasil; sigla = municípios da UF
  const [selUF, setSelUF] = useState<Set<string>>(new Set());
  const [selMun, setSelMun] = useState<Set<string>>(new Set());
  const [nivel, setNivel] = useState<NivelSoc>('UF');
  const [tipoForm, setTipoForm] = useState<TipoSoc>('problema');
  const [texto, setTexto] = useState('');
  const [ver, setVer] = useState(0); // os itens mudam no lugar; a versão avisa os cálculos do mapa
  const muda = (f: () => void) => { f(); setVer((v) => v + 1); bump(); };

  const geoUF = useCarga(vista ? () => carregaGeo(vista) : null, vista ?? '');
  const nomeUF = useMemo(() => new Map((ufs.dados ?? []).map((u) => [u.uf, u.nome])), [ufs.dados]);
  const nomeMunGeo = useMemo(() => new Map((geoUF.dados?.mun ?? []).map((x) => [x.id, x.nm])), [geoUF.dados]);

  /* o mapa nacional é uma "malha" cujas unidades são as UFs */
  const geoBR = useMemo<GeoUF | null>(
    () => (br.dados ? { w: br.dados.w, h: br.dados.h, mun: br.dados.uf.map((u) => ({ id: u.id, nm: nomeUF.get(u.id) ?? u.id, d: u.d })) } : null),
    [br.dados, nomeUF]);
  const geo = vista ? geoUF.dados ?? null : geoBR;

  const agendaAtual = agenda === 'todas' ? null : agendaDe(agenda)!;
  const cat = useCarga(() => carregaCatalogo(), 'cat');
  /* o indicador social não segue as agendas temáticas: lista todos */
  const inds = useMemo(() => opcoesIndicador(cat.dados ?? undefined, null), [cat.dados]);
  const indSel = inds.find((i) => i.id === indId) ?? inds[0];
  const infoInd = cat.dados?.indicadores.find((i) => i.id === indSel?.id);
  const dadosInd = useCarga(camada === 'indicador' && indSel ? () => carregaIndicador(indSel.id) : null, indSel?.id ?? '');
  const perfil = useCarga(camada === 'indicador' && vista ? () => carregaPerfil(vista) : null, vista ?? '');

  const doAgenda = (i: ItemSoc) => agenda === 'todas' || i.agenda === agenda;
  const tipoCamada = camada === 'indicador' ? null : camada;
  const cor = camada === 'indicador' ? '#571730' : TIPOS.find((t) => t.k === camada)!.cor;

  /* registros que "pertencem" a cada unidade do mapa visível: por UF no Brasil; por município na UF */
  const porUnidade = useMemo(() => {
    const o: Record<string, Record<TipoSoc, number>> = {};
    const soma = (id: string, t: TipoSoc) => { (o[id] ??= { problema: 0, potencialidade: 0 })[t]++; };
    itens.filter(doAgenda).forEach((i) => {
      if (!vista) { if (i.nivel === 'UF') i.alvos.forEach((u) => soma(u, i.tipo)); else if (i.nivel === 'MUN') soma(i.uf, i.tipo); }
      else if (i.nivel === 'MUN' && i.uf === vista) i.alvos.forEach((id) => soma(id, i.tipo));
    });
    return o;
  }, [ver, itens, agenda, vista]); // eslint-disable-line react-hooks/exhaustive-deps

  const valores = useMemo(() => {
    const d = dadosInd.dados;
    return (vista ? d?.mun : d?.uf) ?? null;
  }, [dadosInd.dados, vista]);

  const maxReg = useMemo(() => (camada === 'indicador' ? 1 : Math.max(1, ...Object.values(porUnidade).map((c) => c[camada]))), [camada, porUnidade]);

  const celulas = useMemo(() => {
    const o: Record<string, Celula> = {};
    (geo?.mun ?? []).forEach((x) => {
      let fill = '#e4dccb';
      const linhas: string[] = [];
      if (camada === 'indicador') {
        const v = valores?.[x.id];
        if (v != null) {
          const f = faixaDe(v);
          fill = f.cor;
          linhas.push(`Nota ${nf.format(v)} · ${f.rot}`);
        } else linhas.push('Sem dado');
      } else {
        const c = porUnidade[x.id];
        if (c?.[camada]) fill = mistura(cor, 0.22 + 0.78 * (c[camada] / maxReg));
        TIPOS.forEach((t) => { if (c?.[t.k]) linhas.push(plural(c[t.k], t.um, t.rot.toLowerCase())); });
        if (!linhas.length) linhas.push('Nada registrado');
      }
      o[x.id] = { fill, titulo: x.nm, linhas };
    });
    return o;
  }, [geo, camada, valores, maxReg, porUnidade, cor]);

  /* ---------- seleção e navegação ---------- */
  const alterna = (id: string | null) => {
    if (!id) return;
    if (!vista) { setSelUF((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); setNivel('UF'); }
    else { setSelMun((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); setNivel('MUN'); }
  };
  const abre = (uf: string | null) => { setVista(uf); setSelMun(new Set()); if (!uf) setNivel('UF'); };
  const escolheAgenda = (id: string) => {
    setAgenda(id);
  };

  /* ---------- registro ---------- */
  const alvosUF = selUF.size ? [...selUF] : vista ? [vista] : [];
  const alvosMun = [...selMun];
  const alvos = nivel === 'BR' ? [] : nivel === 'UF' ? alvosUF : alvosMun;
  const nomeDe = (id: string) => (nivel === 'UF' ? nomeUF.get(id) : nomeMunGeo.get(id)) ?? id;
  const podeAdd = texto.trim() && agendaAtual && (nivel === 'BR' || alvos.length > 0);
  const aviso =
    nivel === 'UF' && !alvos.length ? 'Selecione um ou mais estados no mapa do Brasil.'
    : nivel === 'MUN' && !alvos.length ? (vista ? 'Selecione um ou mais municípios no mapa.' : 'Abra um estado e selecione os municípios no mapa.')
    : '';

  const adiciona = () => {
    if (!podeAdd) return;
    const novo: ItemSoc = {
      id: novoId(), nivel, tipo: tipoForm, agenda: agendaAtual!.id, texto: texto.trim(),
      uf: nivel === 'BR' ? '' : nivel === 'MUN' ? vista! : '', alvos, nomes: alvos.map(nomeDe),
    };
    if (nivel === 'UF') novo.uf = alvos.length === 1 ? alvos[0] : '';
    muda(() => { itens.push(novo); });
    setTexto('');
  };

  const mostra = (i: ItemSoc) => {
    setCamada(i.tipo); setTipoForm(i.tipo);
    if (i.nivel === 'UF') { setVista(null); setSelMun(new Set()); setSelUF(new Set(i.alvos)); setNivel('UF'); }
    else if (i.nivel === 'MUN') { setVista(i.uf); setSelMun(new Set(i.alvos)); setNivel('MUN'); }
    else { setVista(null); setSelUF(new Set()); setNivel('UF'); }
  };

  const rotuloAlvo = (i: ItemSoc) => {
    if (i.nivel === 'BR') return 'Brasil';
    const l = [...i.nomes].sort(porNome);
    const base = l.length > 3 ? `${l.slice(0, 3).join(', ')} +${l.length - 3}` : l.join(', ');
    return i.nivel === 'MUN' && i.uf ? `${base} (${i.uf})` : base;
  };

  const nomeVista = vista ? nomeUF.get(vista) ?? vista : 'Brasil';
  const tForm = TIPOS.find((t) => t.k === tipoForm)!;
  const filtrados = itens.filter(doAgenda);
  const carregando = br.carregando || ufs.carregando || (!!vista && geoUF.carregando);
  const selecao = vista ? selMun : selUF;

  return (
    <div className="ilha-corpo so">
      {/* agendas temáticas */}
      <p className="peq-t" style={{ margin: '6px 0 4px' }}><strong>Agenda temática</strong> — filtra os registros e o mapa; também é a agenda dos novos registros. O indicador social não é filtrado por ela.</p>
      <div className="so-agendas" role="group" aria-label="Agenda temática">
        {[{ id: 'todas', rot: 'Todas as agendas', cor: '#571730' }, ...AGENDAS].map((a) => (
          <button key={a.id} type="button" aria-pressed={agenda === a.id} style={{ ['--c' as string]: a.cor }} onClick={() => escolheAgenda(a.id)}>{a.rot}</button>
        ))}
      </div>

      {/* camada do mapa */}
      <div className="ilha-controles">
        <div className="abas" style={{ margin: 0 }} role="tablist" aria-label="Camada do mapa">
          {TIPOS.map((t) => <button key={t.k} type="button" role="tab" aria-selected={camada === t.k} onClick={() => { setCamada(t.k); setTipoForm(t.k); }}>{t.rot}</button>)}
          <button type="button" role="tab" aria-selected={camada === 'indicador'} onClick={() => setCamada('indicador')}>Indicador social</button>
        </div>
        {camada === 'indicador' && (
          <label className="campo"><span className="rot">Indicador</span>
            <select value={indSel?.id ?? ''} onChange={(e) => setIndId(e.target.value)}>
              {[...new Set(inds.map((i) => i.grupo))].map((g) => (
                <optgroup key={g} label={g}>
                  {inds.filter((i) => i.grupo === g).map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
                </optgroup>
              ))}
            </select></label>
        )}
      </div>

      {/* navegação nacional → estadual → municipal */}
      <nav className="so-trilha" aria-label="Nível do mapa">
        <button type="button" aria-current={!vista ? 'page' : undefined} onClick={() => abre(null)}>Brasil</button>
        {vista && <><span aria-hidden="true">›</span><button type="button" aria-current="page">{nomeVista}</button></>}
        <span className="espaco" />
        {!vista && selUF.size === 1 && <button type="button" className="bt sec" onClick={() => abre([...selUF][0])}>Abrir municípios de {nomeUF.get([...selUF][0])}</button>}
        {!vista && m.uf && <button type="button" className="bt sec" onClick={() => abre(m.uf)}>Ir para {nomeUF.get(m.uf.toUpperCase()) ?? m.uf}</button>}
        {vista && <button type="button" className="bt sec" onClick={() => abre(null)}>← Voltar ao Brasil</button>}
      </nav>

      {carregando && <p className="sem">Carregando mapa…</p>}
      {(br.erro || geoUF.erro) && <div className="erro-cx">Não foi possível carregar o mapa.</div>}

      {geo && (
        <div className="ilha-lado">
          <div>
            <MapaConjuntura geo={geo} celulas={celulas} selecionado={null} multi={selecao} onSelecionar={alterna} />
            <div className="escala-l">
              {camada === 'indicador' ? (
                valores ? FAIXAS.map((f, k) => <span key={f.rot} className="v2-leg"><i style={{ background: f.cor }} />{f.rot} <small>({f.de}{k < FAIXAS.length - 1 ? `–${FAIXAS[k + 1].de - 1}` : '+'})</small></span>)
                  : <span>{dadosInd.carregando ? 'Carregando indicador…' : 'Este indicador não tem dados carregados.'}</span>
              ) : (
                <><span>Nada</span><i style={{ background: `linear-gradient(90deg, ${mistura(cor, 0.22)}, ${cor})` }} /><span>{plural(maxReg, 'registro', 'registros')}</span></>
              )}
            </div>
            <p className="peq-t">
              {vista ? 'Municípios de ' + nomeVista : 'Estados do Brasil'}: clique para selecionar vários, arraste para mover, role para aproximar.
              {!vista && ' Abra um estado para chegar aos municípios.'}
              {tipoCamada && ' Cor = registros da equipe; cinza = nada registrado.'}
            </p>
            {camada === 'indicador' && (
              <p className="peq-t">
                <strong>{indSel?.nome}</strong> · nota de 0 a 100, <strong>quanto maior, melhor</strong> (cinza = sem dado).
                {infoInd && <> {infoInd.sentido === 'menos é melhor' ? 'O indicador original é “quanto menos, melhor”; a nota já está invertida. ' : ''}Fonte: {infoInd.fonte}{infoInd.ano ? `, ${infoInd.ano}` : ''}.</>}
                {!vista && ' Na visão dos estados, a nota é a média dos municípios ponderada pela população (cálculo da plataforma).'}
                {' '}Base: <a href={cat.dados?.url ?? 'https://idsc.cidadessustentaveis.org.br/'} target="_blank" rel="noreferrer">{cat.dados?.fonte ?? 'IDSC-BR 2026'}</a>.
              </p>
            )}
          </div>

          <div>
            {camada === 'indicador' && vista && (
              <div className="el-painel so-perfil" style={{ marginBottom: 14 }}>
                {selMun.size !== 1 ? <p className="peq-t" style={{ margin: 0 }}>Selecione <strong>um município</strong> para ver a nota geral dele no IDSC.</p> : (() => {
                  const id = [...selMun][0], pf = perfil.dados?.[id];
                  if (!pf) return <p className="peq-t" style={{ margin: 0 }}>{perfil.carregando ? 'Carregando perfil…' : 'Sem perfil para este município.'}</p>;
                  const f = faixaDe(pf.i);
                  return (
                    <>
                      <h4>{pf.n} <small className="peq-t">· {nf.format(pf.p)} hab.</small></h4>
                      <p style={{ margin: '2px 0 0', fontSize: 14 }}>IDSC-BR 2026: <strong>{nf.format(pf.i)}</strong> · <span className="v2-leg" style={{ margin: 0 }}><i style={{ background: f.cor }} />{pf.v}</span> · {nf.format(pf.r)}º entre 5.570</p>
                    </>
                  );
                })()}
              </div>
            )}
          <div className="el-painel" id="so-registro">
            <h4>Registrar no mapa</h4>
            <fieldset className="so-radios">
              <legend className="peq-t">Nível</legend>
              {NIVEIS.map((n) => (
                <label key={n.k}><input type="radio" name="so-nivel" checked={nivel === n.k} onChange={() => setNivel(n.k)} />{n.rot}</label>
              ))}
            </fieldset>
            <p className="peq-t" style={{ margin: '0 0 8px' }}>
              {nivel === 'BR' ? 'Vale para o país inteiro.' : alvos.length ? <>Vale para: <strong>{alvos.map(nomeDe).sort(porNome).join(', ')}</strong></> : aviso}
              {alvos.length > 0 && nivel !== 'BR' && <> <button type="button" className="rm" style={{ fontSize: 13 }} onClick={() => (nivel === 'UF' ? setSelUF(new Set()) : setSelMun(new Set()))}>limpar</button></>}
            </p>
            <fieldset className="so-radios">
              <legend className="peq-t">Tipo</legend>
              {TIPOS.map((t) => (
                <label key={t.k}><input type="radio" name="so-tipo" checked={tipoForm === t.k} onChange={() => { setTipoForm(t.k); setCamada(t.k); }} /><span style={{ color: t.cor, fontWeight: 700 }}>{t.um[0].toUpperCase() + t.um.slice(1)}</span></label>
              ))}
            </fieldset>
            <p className="peq-t" style={{ margin: '0 0 8px' }}>
              {agendaAtual ? <>Agenda temática: <strong>{agendaAtual.rot}</strong> (a escolhida no topo).</> : <strong>Escolha uma agenda temática no topo para registrar.</strong>}
            </p>
            <form onSubmit={(e) => { e.preventDefault(); adiciona(); }}>
              <label className="campo" style={{ marginBottom: 8 }}><span className="rot" style={{ fontSize: 13 }}>Descreva o {tForm.um}</span>
                <textarea rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={tForm.ph} /></label>
              <button type="submit" className="bt" disabled={!podeAdd}>Adicionar {tForm.um}</button>
            </form>
          </div>
          </div>
        </div>
      )}

      {/* registros */}
      <div className="so-cols">
        {TIPOS.map((t) => {
          const l = filtrados.filter((i) => i.tipo === t.k);
          return (
            <section key={t.k} className="el-col" style={{ ['--c' as string]: t.cor }}>
              <h4>{t.rot} <small>{l.length}</small></h4>
              {l.length === 0 && <p className="sem">{agendaAtual ? `Nada registrado em ${agendaAtual.rot}.` : 'Nada registrado ainda.'}</p>}
              {(['BR', 'UF', 'MUN'] as NivelSoc[]).flatMap((n) => l.filter((i) => i.nivel === n)).map((i) => (
                <div className="el-item" key={i.id}>
                  <div className="so-meta">
                    <span className="so-nivel">{ROT_NIVEL[i.nivel]}</span>
                    <span className="so-ag" style={{ ['--c' as string]: agendaDe(i.agenda)?.cor ?? '#888' }}>{agendaDe(i.agenda)?.rot ?? i.agenda}</span>
                  </div>
                  <div className="topo">
                    <span style={{ flex: 1 }}>{i.texto}</span>
                    <button type="button" className="rm" aria-label="Remover registro" onClick={() => muda(() => { D.social!.itens = itens.filter((q) => q.id !== i.id); })}>×</button>
                  </div>
                  <div className="el-acoes" style={{ marginTop: 4 }}>
                    <span className="peq-t" style={{ margin: 0 }}>{rotuloAlvo(i)}</span>
                    {i.nivel !== 'BR' && <button type="button" className="bt sec" onClick={() => mostra(i)}>Ver no mapa</button>}
                  </div>
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/** Versão somente leitura para a aba Resumo: uma linha por território, com problemas e potencialidades lado a lado (RES-08). */
export function SocialResumo() {
  const { D } = useLegado();
  const linhas = porTerritorio(D.social?.itens ?? []);
  if (!linhas.length) return <p className="sem">Nada registrado ainda.</p>;
  const celula = (itens: ItemSoc[], cl: 'prob' | 'pot') =>
    itens.length === 0 ? '—' : itens.map((i) => (
      <div className="terr-it" key={i.id}>
        <span className={`tag ${cl}`}>{agendaDe(i.agenda)?.rot ?? i.agenda}</span>
        <small>{i.texto}</small>
      </div>
    ));
  return (
    <div className="ilha-corpo">
      <div className="leg">
        <span><span className="tag prob">Problema</span>o que dói hoje</span>
        <span><span className="tag pot">Potencialidade</span>o que pode crescer</span>
      </div>
      <div className="terr-w" tabIndex={0} role="region" aria-label="Problemas e potencialidades por território">
        <table className="terr">
          <thead><tr><th scope="col">Território</th><th scope="col">Problemas</th><th scope="col">Potencialidades</th></tr></thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={`${l.nivel}|${l.territorio}`}>
                <th scope="row">{l.territorio}</th>
                <td>{celula(l.problemas, 'prob')}</td>
                <td>{celula(l.potencialidades, 'pot')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
