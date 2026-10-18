'use client';
/* Versão 2 da pergunta 2 da Conjuntura: contabilizar cargos, mapear o território, registrar
   setoriais/diretórios, definir a relação com o partido e listar desafios e oportunidades.
   Tudo o que a equipe registra vai para D.conj2. */
import { useMemo, useState } from 'react';
import { carregaGeo, carregaHist, carregaMun, carregaNacional, carregaUF } from '@/lib/dados';
import { corPartido, mistura } from '@/lib/partidos';
import { nf, pct } from '@/lib/format';
import type { Conj2, StForo, TagMun } from '@/lib/types';
import { CARGOS, NIVEIS } from './Calor';
import type { Mun } from '@/lib/types';
import { dadosGuia, useLegado } from './ponte';
import { BarrasPartido, MapaMunicipios, useCarga } from './pecas';

const vazio = (): Conj2 => ({ muns: {}, foros: {}, foroExtra: [], relacao: '', relacaoPq: '', desafios: [], oportunidades: [] });
const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const soma = (o?: Record<string, number>) => Object.values(o ?? {}).reduce((a, b) => a + b, 0);

const TAGS: { k: TagMun; rot: string; cor: string }[] = [
  { k: 'base', rot: 'Base do mandato', cor: '#1B6B4F' },
  { k: 'expansao', rot: 'Prioridade de expansão', cor: '#E0A526' },
  { k: 'risco', rot: 'Risco / concorrência', cor: '#C93636' },
];
const COR_TAG = Object.fromEntries(TAGS.map((t) => [t.k, t.cor])) as Record<TagMun, string>;

const FOROS: { id: string; nome: string; grupo: string }[] = [
  { id: 'dir-mun', nome: 'Diretório municipal', grupo: 'Diretórios e executivas' },
  { id: 'dir-est', nome: 'Diretório estadual', grupo: 'Diretórios e executivas' },
  { id: 'exe-est', nome: 'Executiva estadual', grupo: 'Diretórios e executivas' },
  { id: 'dir-nac', nome: 'Diretório / Executiva nacional', grupo: 'Diretórios e executivas' },
  { id: 'bancada', nome: 'Liderança ou vice-liderança da bancada', grupo: 'Diretórios e executivas' },
  { id: 'set-mul', nome: 'Setorial de mulheres', grupo: 'Setoriais' },
  { id: 'set-jov', nome: 'Setorial de juventude', grupo: 'Setoriais' },
  { id: 'set-neg', nome: 'Setorial de igualdade racial', grupo: 'Setoriais' },
  { id: 'set-sin', nome: 'Setorial sindical / do trabalho', grupo: 'Setoriais' },
  { id: 'set-mun', nome: 'Setorial de prefeitos e vereadores', grupo: 'Setoriais' },
  { id: 'fund', nome: 'Fundação / instituto de formação do partido', grupo: 'Setoriais' },
];
const ST_FORO: { k: StForo; rot: string }[] = [
  { k: 'avaliar', rot: 'Avaliar' }, { k: 'quero', rot: 'Quero entrar' }, { k: 'ja', rot: 'Já participo' }, { k: 'descarta', rot: 'Não é prioridade' },
];
const RELACOES = [
  { k: 'direcao', t: 'Quadro de direção', d: 'Quer disputar espaço nas executivas e influir nas decisões do partido.' },
  { k: 'bancada', t: 'Liderança de bancada', d: 'Foca na atuação legislativa e na coordenação com os colegas de partido na Casa.' },
  { k: 'autonoma', t: 'Aliada com autonomia', d: 'Segue a linha geral, mas mantém agenda e base própria.' },
  { k: 'ponte', t: 'Ponte com outras forças', d: 'Usa o partido como plataforma para dialogar com outros partidos e movimentos.' },
  { k: 'transicao', t: 'Em reavaliação', d: 'Pondera mudar de papel ou de partido; precisa mapear custos e alternativas.' },
];

type Modo = 'calor' | 'lider' | 'marcas';
const MODOS: [Modo, string][] = [['calor', '% de votos'], ['lider', 'Quem lidera'], ['marcas', 'Minhas marcações']];

/** Cargos do mapa. 2026 e 2024 vêm do arquivo do município; 2022 e 2020 de public/data/hist. */
type CargoMapa = { id: string; ano: number; rot: string; pega: (x: Mun, h?: Record<string, { v: number; p: [string, number][] }>) => { v: number; p: [string, number][] } | undefined };
const hist = (k: string) => (_: Mun, h?: Record<string, { v: number; p: [string, number][] }>) => h?.[k];
const CARGOS_MAPA: CargoMapa[] = [
  ...CARGOS.map((c) => ({ id: `${c.id}${c.ano}`, ano: c.ano, rot: c.rot, pega: (x: Mun) => c.pega(x) })),
  { id: 'senador2022', ano: 2022, rot: 'Senador', pega: hist('senador2022') },
  { id: 'federal2022', ano: 2022, rot: 'Deputado federal', pega: hist('federal2022') },
  { id: 'estadual2022', ano: 2022, rot: 'Deputado estadual/distrital', pega: hist('estadual2022') },
  { id: 'governador2022', ano: 2022, rot: 'Governador (1º turno)', pega: hist('governador2022') },
  { id: 'presidente2022', ano: 2022, rot: 'Presidente (1º turno)', pega: hist('presidente2022') },
  { id: 'pref2020', ano: 2020, rot: 'Prefeito (1º turno)', pega: hist('pref2020') },
  { id: 'ver2020', ano: 2020, rot: 'Vereador', pega: hist('ver2020') },
];
const ANOS_MAPA = [2026, 2024, 2022, 2020];

export default function CalorV2() {
  const { D, m, bump } = useLegado();
  const mun = useCarga(() => carregaMun(m.uf), m.uf);
  const geo = useCarga(() => carregaGeo(m.uf), m.uf);
  const uf = useCarga(() => carregaUF(m.uf), m.uf);
  const nac = useCarga(() => carregaNacional(), 'nac');
  const his = useCarga(() => carregaHist(m.uf), m.uf);

  if (!D.conj2) D.conj2 = vazio();
  const c = D.conj2;
  const partido = (m.partido ?? '').toUpperCase();
  const cor = corPartido(partido);
  const [cargoId, setCargoId] = useState('estadual2026');
  const [modo, setModo] = useState<Modo>('calor');
  const [sel, setSel] = useState<string | null>(null);
  const [novoForo, setNovoForo] = useState('');
  const muda = (f: () => void) => { f(); bump(); };

  const cargo = CARGOS_MAPA.find((x) => x.id === cargoId) ?? CARGOS_MAPA[0];
  const pegaB = (id: string, x: Mun) => cargo.pega(x, his.dados?.[id]);
  const cdi = (D.tse as { cdi?: string }).cdi || m.municipio || '';

  const res = useMemo(() => {
    if (!mun.dados) return null;
    const tot = new Map<string, number>();
    const pcts = new Map<string, number>();
    const lider = new Map<string, string>();
    const prefDe = new Map<string, string>();
    let validos = 0;
    for (const [id, x] of Object.entries(mun.dados.mun)) {
      const b = pegaB(id, x);
      if (b?.v) {
        validos += b.v;
        b.p.forEach(([p, v]) => tot.set(p, (tot.get(p) ?? 0) + v));
        if (b.p[0]) lider.set(id, b.p[0][0]);
      }
      const eleito = x.m24?.pref.cands.find((q) => q[4]);
      if (eleito) prefDe.set(id, eleito[1]);
    }
    const lista = [...tot.entries()].sort((a, b) => b[1] - a[1]);
    return { tot, lista, validos, lider, prefDe, pcts };
  }, [mun.dados, his.dados, cargo]);

  const pcts = useMemo(() => {
    const out = new Map<string, number>();
    let max = 0;
    if (mun.dados) {
      for (const [id, x] of Object.entries(mun.dados.mun)) {
        const b = pegaB(id, x);
        if (!b?.v) continue;
        const p = ((b.p.find((q) => q[0] === partido)?.[1] ?? 0) / b.v) * 100;
        out.set(id, p);
        if (p > max) max = p;
      }
    }
    return { out, max };
  }, [mun.dados, his.dados, cargo, partido]);

  /* ---------- números por escopo ---------- */
  const cadUF = uf.dados?.cadeiras ?? {};
  const nacD = nac.dados;
  const xDom = cdi && mun.dados ? mun.dados.mun[cdi] : undefined;

  /* ---------- sugestões de desafios e oportunidades, calculadas dos dados ---------- */
  const sugestoes = useMemo(() => {
    const out: { tipo: 'd' | 'o'; texto: string }[] = [];
    if (!res || !uf.dados || !nacD || !partido) return out;
    const lidera = [...res.lider.entries()].filter(([, p]) => p === partido).map(([id]) => id);
    const semPref = lidera.filter((id) => res.prefDe.get(id) !== partido);
    if (semPref.length) out.push({ tipo: 'o', texto: `${partido} é o mais votado em ${semPref.length} município(s) de ${m.uf} (${cargo.rot} ${cargo.ano}) que não elegeram prefeito do partido em 2024: terreno para filiação e candidaturas em 2028.` });
    const medio = res.validos && res.tot.get(partido) ? (res.tot.get(partido)! / res.validos) * 100 : 0;
    const altaSemVer = [...pcts.out.entries()].filter(([id, p]) => p > medio * 1.5 && !(mun.dados?.mun[id]?.m24?.ver.el?.[partido])).length;
    if (altaSemVer) out.push({ tipo: 'o', texto: `${altaSemVer} município(s) com votação do ${partido} 50% acima da média estadual e sem nenhum vereador do partido eleito em 2024.` });
    const cadEst = cadUF.estadual?.[partido] ?? 0, totEst = soma(cadUF.estadual);
    if (totEst && medio) {
      const pc = (cadEst / totEst) * 100;
      if (pc < medio * 0.8) out.push({ tipo: 'd', texto: `${partido} tem ${pct(medio, 1)} dos votos no estado, mas só ${pct(pc, 1)} das cadeiras da Assembleia: votos que não viraram representação.` });
    }
    const prefUF = cadUF.prefeitos?.[partido] ?? 0, prefBR = nacD.prefeitos?.[partido] ?? 0;
    const pUF = soma(cadUF.prefeitos), pBR = soma(nacD.prefeitos);
    if (pUF && pBR && prefBR && prefUF / pUF < (prefBR / pBR) * 0.8) out.push({ tipo: 'd', texto: `Capilaridade municipal abaixo da média nacional: ${pct((prefUF / pUF) * 100, 1)} das prefeituras em ${m.uf} contra ${pct((prefBR / pBR) * 100, 1)} no Brasil.` });
    if (!(cadUF.senado?.[partido] ?? 0) && soma(cadUF.senado)) out.push({ tipo: 'd', texto: `${partido} não elegeu senador em ${m.uf} em 2026: menos peso nas negociações estaduais de chapa.` });
    return out;
  }, [res, uf.dados, nacD, partido, pcts, cargo, m.uf, mun.dados, cadUF]);

  if (!partido) return <div className="apoio atencao"><span className="tag">Atenção</span>Informe o partido em “Dados do mandato” para ver a conjuntura.</div>;
  if (!m.uf) return <div className="apoio atencao"><span className="tag">Atenção</span>Informe a UF em “Dados do mandato” para ver a conjuntura.</div>;

  const nomeMun = (id: string) => mun.dados?.mun[id]?.nm ?? id;
  const fill = (id: string) => {
    if (modo === 'marcas') return c.muns[id] ? COR_TAG[c.muns[id].tag] : '#d9d2c3';
    if (modo === 'lider') { const l = res?.lider.get(id); return l ? mistura(corPartido(l), 0.85) : '#d9d2c3'; }
    return pcts.out.has(id) ? mistura(cor, 0.06 + 0.94 * (pcts.max ? pcts.out.get(id)! / pcts.max : 0)) : '#d9d2c3';
  };
  const dica = (id: string, nm: string) => {
    const t = c.muns[id] ? ` · ${TAGS.find((x) => x.k === c.muns[id].tag)?.rot}` : '';
    if (modo === 'lider') return `${nm}: ${res?.lider.get(id) ?? 'sem dados'}${t}`;
    return `${nm}: ${pcts.out.has(id) ? pct(pcts.out.get(id)!) : 'sem dados'}${t}`;
  };

  const marcados = Object.entries(c.muns).sort((a, b) => nomeMun(a[0]).localeCompare(nomeMun(b[0]), 'pt'));
  const detB = sel && mun.dados ? pegaB(sel, mun.dados.mun[sel]) : undefined;
  const nForo = (st: StForo) => [...FOROS, ...c.foroExtra].filter((f) => (c.foros[f.id]?.st ?? 'avaliar') === st && (st !== 'avaliar' || c.foros[f.id])).length;
  const addLista = (k: 'desafios' | 'oportunidades', t: string) => { if (t.trim() && !c[k].includes(t.trim())) muda(() => c[k].push(t.trim())); };

  const lista = (k: 'desafios' | 'oportunidades', titulo: string, cl: string) => {
    const sug = sugestoes.filter((s) => s.tipo === (k === 'desafios' ? 'd' : 'o') && !c[k].includes(s.texto));
    return (
      <div className={`v2-col ${cl}`}>
        <h4>{titulo}</h4>
        <ul className="v2-itens">
          {c[k].map((t, i) => (
            <li key={i}><span>{t}</span><button type="button" className="rm" aria-label="Remover" onClick={() => muda(() => c[k].splice(i, 1))}>×</button></li>
          ))}
        </ul>
        {c[k].length === 0 && <p className="sem">Nada registrado ainda.</p>}
        <form className="v2-add" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget.elements.namedItem('t') as HTMLInputElement; addLista(k, f.value); f.value = ''; }}>
          <input name="t" type="text" placeholder="Escreva e tecle Enter" aria-label={`Adicionar a ${titulo}`} />
          <button type="submit" className="bt sec">Adicionar</button>
        </form>
        {sug.length > 0 && (
          <div className="v2-sug">
            <p className="peq-t">Apontado pelos dados — clique para incluir:</p>
            {sug.map((s) => <button key={s.texto} type="button" onClick={() => addLista(k, s.texto)}>+ {s.texto}</button>)}
          </div>
        )}
      </div>
    );
  };

  const foroLinha = (f: { id: string; nome: string }, extra = false) => {
    const v = c.foros[f.id] ?? { st: 'avaliar' as StForo, nota: '' };
    const nome = f.id === 'dir-mun' && xDom ? `${f.nome} de ${xDom.nm}` : f.id === 'dir-est' || f.id === 'exe-est' ? `${f.nome} (${m.uf})` : f.nome;
    return (
      <tr key={f.id}>
        <td><strong>{nome}</strong></td>
        <td>
          <select value={v.st} aria-label={`Situação: ${nome}`} onChange={(e) => muda(() => { c.foros[f.id] = { ...v, st: e.target.value as StForo }; })}>
            {ST_FORO.map((s) => <option key={s.k} value={s.k}>{s.rot}</option>)}
          </select>
        </td>
        <td><input type="text" value={v.nota} placeholder="Quem procurar, prazo, condição…" aria-label={`Nota: ${nome}`}
          onChange={(e) => muda(() => { c.foros[f.id] = { ...v, nota: e.target.value }; })} /></td>
        <td>{extra && <button type="button" className="rm" aria-label="Remover" onClick={() => muda(() => { c.foroExtra = c.foroExtra.filter((x) => x.id !== f.id); delete c.foros[f.id]; })}>×</button>}</td>
      </tr>
    );
  };

  return (
    <div className="ilha-corpo v2">
      <h4 className="v2-titulo">Conjuntura do {partido} em {uf.dados?.nome ?? m.uf} e no Brasil</h4>
      {(mun.carregando || geo.carregando || uf.carregando || nac.carregando || his.carregando) && <p className="sem">Carregando dados…</p>}
      {(mun.erro || geo.erro) && <div className="erro-cx">Não foi possível carregar os dados de {m.uf}.</div>}

      {/* 1 · cargos */}
      <h4><span className="v2-n">1</span> Cargos do partido em cada esfera</h4>
      <p className="peq-t">Deputados e senadores eleitos em 2026; prefeitos e vereadores eleitos em 2024. Senadores eleitos em 2022 não estão na contagem.</p>
      <div className="v2-grandes">
        {NIVEIS.map(({ k, rot }) => {
          const a = cadUF[k]?.[partido] ?? 0, b = nacD?.[k as keyof typeof nacD]?.[partido] ?? 0;
          const ta = soma(cadUF[k]), tb = soma(nacD?.[k as keyof typeof nacD]);
          return (
            <div className="v2-grande" key={k}>
              <span className="rot">{rot}</span>
              <b>{nf.format(b)}</b>
              <span>no Brasil{tb ? ` · ${pct((b / tb) * 100, 1)} de ${nf.format(tb)}` : ''}</span>
              <b className="uf">{nf.format(a)}</b>
              <span>em {m.uf}{ta ? ` · ${pct((a / ta) * 100, 1)} de ${nf.format(ta)}` : ''}</span>
            </div>
          );
        })}
      </div>

      {/* 2 · mapa */}
      <h4><span className="v2-n">2</span> Mapa: onde o partido tem força e onde marcar a estratégia</h4>
      <div className="ilha-controles">
        <div className="abas" style={{ margin: 0 }} role="tablist" aria-label="Camada do mapa">
          {MODOS.map(([k, r]) => <button key={k} type="button" role="tab" aria-selected={modo === k} onClick={() => setModo(k)}>{r}</button>)}
        </div>
        <label className="campo"><span className="rot">Cargo</span>
          <select value={cargo.id} onChange={(e) => { setCargoId(e.target.value); setSel(null); }}>
            {ANOS_MAPA.map((a) => (
              <optgroup key={a} label={`Eleição ${a}`}>
                {CARGOS_MAPA.filter((x) => x.ano === a).map((x) => <option key={x.id} value={x.id}>{x.rot}</option>)}
              </optgroup>
            ))}
          </select></label>
      </div>
      {mun.dados && geo.dados && res && (
        <div className="ilha-lado">
          <div>
            <MapaMunicipios geo={geo.dados} fill={fill} selecionado={sel} onSelecionar={setSel} titulo={dica} />
            <div className="escala-l">
              {modo === 'calor' && <><span>0%</span><i style={{ background: `linear-gradient(90deg, ${mistura(cor, 0.06)}, ${cor})` }} /><span>{pct(pcts.max, 0)}</span></>}
              {modo === 'lider' && res.lista.slice(0, 6).map(([p]) => <span key={p} className="v2-leg"><i style={{ background: mistura(corPartido(p), 0.85) }} />{p}</span>)}
              {modo === 'marcas' && TAGS.map((t) => <span key={t.k} className="v2-leg"><i style={{ background: t.cor }} />{t.rot}</span>)}
            </div>
            <p className="peq-t">Clique num município para marcá-lo. Cinza = sem dados.</p>
          </div>
          <div>
            {sel ? (
              <div className="v2-det">
                <div className="topo"><h4 style={{ margin: 0 }}>{nomeMun(sel)}</h4><button type="button" className="rm" onClick={() => setSel(null)} aria-label="Fechar">×</button></div>
                <p className="peq-t">
                  {detB ? `${nf.format(detB.v)} votos válidos · ${cargo.rot}` : 'Sem votos para este cargo'}
                  {res.prefDe.get(sel) ? ` · prefeito: ${res.prefDe.get(sel)}` : ''}
                </p>
                {detB && <BarrasPartido destaque={partido} dados={detB.p.slice(0, 6)} />}
                <div className="v2-tags" role="group" aria-label="Marcar município">
                  {TAGS.map((t) => (
                    <button key={t.k} type="button" aria-pressed={c.muns[sel]?.tag === t.k} style={{ ['--c' as string]: t.cor }}
                      onClick={() => muda(() => { if (c.muns[sel]?.tag === t.k) delete c.muns[sel]; else c.muns[sel] = { tag: t.k, nota: c.muns[sel]?.nota ?? '' }; })}>{t.rot}</button>
                  ))}
                </div>
                {c.muns[sel] && (
                  <label className="campo"><span className="rot">Anotação sobre {nomeMun(sel)}</span>
                    <textarea rows={2} value={c.muns[sel].nota} placeholder="Quem é a liderança local, o que falta, próximo passo…"
                      onChange={(e) => muda(() => { c.muns[sel].nota = e.target.value; })} /></label>
                )}
              </div>
            ) : (
              <>
                <h4 style={{ marginTop: 0 }}>Ranking no estado</h4>
                <BarrasPartido destaque={partido} dados={res.lista.slice(0, 10)} />
              </>
            )}
          </div>
        </div>
      )}
      {marcados.length > 0 && (
        <div className="rolar">
          <table className="tb" style={{ minWidth: 0 }}>
            <thead><tr><th>Município</th><th>Marcação</th><th>% do partido</th><th>Anotação</th><th /></tr></thead>
            <tbody>
              {marcados.map(([id, v]) => (
                <tr key={id} onClick={() => { setSel(id); setModo('marcas'); }} style={{ cursor: 'pointer' }}>
                  <td><strong>{nomeMun(id)}</strong></td>
                  <td><span className="v2-leg"><i style={{ background: COR_TAG[v.tag] }} />{TAGS.find((t) => t.k === v.tag)?.rot}</span></td>
                  <td>{pcts.out.has(id) ? pct(pcts.out.get(id)!, 1) : '—'}</td>
                  <td>{v.nota || <span className="peq-t">—</span>}</td>
                  <td><button type="button" className="rm" aria-label={`Remover marcação de ${nomeMun(id)}`} onClick={(e) => { e.stopPropagation(); muda(() => { delete c.muns[id]; }); }}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3 · setoriais e diretórios */}
      <h4><span className="v2-n">3</span> Setoriais e diretórios que a liderança pode integrar</h4>
      <p className="peq-t">
        {nForo('ja')} onde já participa · {nForo('quero')} onde quer entrar · {nForo('descarta')} descartados.
      </p>
      <div className="rolar">
        <table className="tb v2-foros" style={{ minWidth: 0 }}>
          <thead><tr><th>Espaço</th><th>Situação</th><th>Anotação</th><th /></tr></thead>
          <tbody>
            {['Diretórios e executivas', 'Setoriais'].map((g) => [
              <tr key={g} className="v2-grupo"><th colSpan={4}>{g}</th></tr>,
              ...FOROS.filter((f) => f.grupo === g).map((f) => foroLinha(f)),
            ])}
            {c.foroExtra.length > 0 && <tr className="v2-grupo"><th colSpan={4}>Outros</th></tr>}
            {c.foroExtra.map((f) => foroLinha(f, true))}
          </tbody>
        </table>
      </div>
      <form className="v2-add" onSubmit={(e) => { e.preventDefault(); if (novoForo.trim()) muda(() => { c.foroExtra.push({ id: novoId(), nome: novoForo.trim() }); setNovoForo(''); }); }}>
        <input type="text" value={novoForo} onChange={(e) => setNovoForo(e.target.value)} placeholder="Outro setorial, núcleo ou comissão do partido" aria-label="Novo espaço" />
        <button type="submit" className="bt sec">Adicionar espaço</button>
      </form>

      {/* 4 · relação desejada */}
      <h4><span className="v2-n">4</span> Que relação a liderança quer ter com o partido?</h4>
      <div className="v2-rels" role="radiogroup" aria-label="Relação desejada com o partido">
        {RELACOES.map((r) => (
          <button key={r.k} type="button" role="radio" aria-checked={c.relacao === r.k} onClick={() => muda(() => { c.relacao = c.relacao === r.k ? '' : r.k; })}>
            <strong>{r.t}</strong><span>{r.d}</span>
          </button>
        ))}
      </div>
      <label className="campo"><span className="rot">Por que essa escolha? O que o partido precisa oferecer?</span>
        <textarea rows={3} value={c.relacaoPq} onChange={(e) => muda(() => { c.relacaoPq = e.target.value; })} /></label>

      {/* 5 · desafios e oportunidades */}
      <h4><span className="v2-n">5</span> Desafios e oportunidades de expansão da relevância partidária</h4>
      <div className="v2-duas">
        {lista('desafios', 'Desafios', 'des')}
        {lista('oportunidades', 'Oportunidades', 'opo')}
      </div>
    </div>
  );
}
