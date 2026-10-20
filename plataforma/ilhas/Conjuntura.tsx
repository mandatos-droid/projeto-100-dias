'use client';
/* Pergunta m1.q5 da Conjuntura: onde o partido está (cadeiras, Executivo, filiados) e que relação a liderança
   quer ter com ele. Tudo o que a equipe registra vai para D.conj2; o resto é leitura de public/data. */
import { useMemo, useState } from 'react';
import {
  carregaExecBR, carregaExecUF, carregaFiliadosBR, carregaFiliadosUF, carregaGeo, carregaHist, carregaMun,
  carregaNacional, carregaUF,
} from '@/lib/dados';
import { corPartido, mistura } from '@/lib/partidos';
import { nf, pct } from '@/lib/format';
import type { Conj2, EsferaExec, ExecEleito, FilAcum, Mun, PosExec, RegExec, TagMun } from '@/lib/types';
import { CARGOS, NIVEIS } from './cargos';
import { useLegado } from './ponte';
import { BarrasPartido, Chip, MapaMunicipios, useCarga } from './pecas';

const vazio = (): Conj2 => ({ muns: {}, posicao: {}, relacao: '', relacaoPq: '', desafios: [], oportunidades: [] });
const soma = (o?: Record<string, number>) => Object.values(o ?? {}).reduce((a, b) => a + b, 0);
const somaArr = (a?: number[]) => (a ?? []).reduce((x, y) => x + y, 0);

const TAGS: { k: TagMun; rot: string; cor: string }[] = [
  { k: 'base', rot: 'Base do mandato', cor: '#1B6B4F' },
  { k: 'expansao', rot: 'Prioridade de expansão', cor: '#E0A526' },
  { k: 'risco', rot: 'Risco / concorrência', cor: '#C93636' },
];
const COR_TAG = Object.fromEntries(TAGS.map((t) => [t.k, t.cor])) as Record<TagMun, string>;

const RELACOES = [
  { k: 'direcao', t: 'Quadro de direção', d: 'Quer disputar espaço nas executivas e influir nas decisões do partido.' },
  { k: 'bancada', t: 'Liderança de bancada', d: 'Foca na atuação legislativa e na coordenação com os colegas de partido na Casa.' },
  { k: 'autonoma', t: 'Aliada com autonomia', d: 'Segue a linha geral, mas mantém agenda e base própria.' },
  { k: 'ponte', t: 'Ponte com outras forças', d: 'Usa o partido como plataforma para dialogar com outros partidos e movimentos.' },
  { k: 'transicao', t: 'Em reavaliação', d: 'Pondera mudar de papel ou de partido; precisa mapear custos e alternativas.' },
];

/* posição do partido diante de cada Executivo. A sugestão sai da coligação com que o eleito disputou. */
const POSICOES: { k: PosExec; rot: string }[] = [
  { k: 'governo', rot: 'Partido do governo' },
  { k: 'base', rot: 'Base aliada' },
  { k: 'oposicao', rot: 'Oposição' },
  { k: 'independente', rot: 'Independente' },
];
export const ROT_POS = Object.fromEntries(POSICOES.map((p) => [p.k, p.rot])) as Record<PosExec, string>;

/** Do que a coligação da eleição diz sobre o partido: 'governo' (é o do eleito), 'base' (está na coligação) ou null. */
export function sugere(reg: RegExec | undefined, partido: string): PosExec | null {
  if (!reg) return null;
  return reg.p === partido ? 'governo' : reg.c.includes(partido) ? 'base' : null;
}

/* recortes dos filiados, na mesma ordem dos vetores de scripts/build_filiados.py */
const GENERO = ['Masculino', 'Feminino'];
const FAIXAS = ['Até 24 anos', '25 a 34', '35 a 44', '45 a 59', '60 a 69', '70 a 79', '80 ou mais'];
const ESCOLA = ['Fundamental incompleto ou menos', 'Fundamental completo', 'Médio incompleto', 'Médio completo', 'Superior incompleto', 'Superior completo'];

/** Soma o recorte `k` (1 gênero, 2 faixa, 3 escolaridade) de todos os partidos de um escopo. */
function somaTodos(mapa: Record<string, FilAcum> | undefined, k: 1 | 2 | 3, n: number) {
  const out = new Array<number>(n).fill(0);
  Object.values(mapa ?? {}).forEach((a) => a[k].forEach((v, i) => { out[i] += v; }));
  return out;
}

type Modo = 'calor' | 'lider' | 'ver' | 'fil' | 'marcas';
const MODOS: [Modo, string][] = [['calor', '% de votos'], ['lider', 'Quem lidera'], ['ver', 'Vereadores'], ['fil', 'Filiados'], ['marcas', 'Minhas marcações']];

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

/** Uma barra por categoria: o partido (barra cheia) contra todos os partidos do mesmo escopo (traço). */
function Recorte({ titulo, rots, a, todos, cor }: { titulo: string; rots: string[]; a?: number[]; todos: number[]; cor: string }) {
  const ta = somaArr(a), tt = somaArr(todos);
  const pa = rots.map((_, i) => (ta ? ((a?.[i] ?? 0) / ta) * 100 : 0));
  const pt = rots.map((_, i) => (tt ? (todos[i] / tt) * 100 : 0));
  const esc = 100 / Math.max(1, ...pa, ...pt);
  return (
    <div className="v2-rec">
      <h5>{titulo}</h5>
      {rots.map((r, i) => (
        <div className="v2-rec-l" key={r}>
          <span className="nm">{r}</span>
          <span className="fundo">
            <i style={{ width: `${pa[i] * esc}%`, background: cor }} />
            <b style={{ left: `${pt[i] * esc}%` }} />
          </span>
          <span className="v">{pct(pa[i], 1)}</span>
          <span className="t">{pct(pt[i], 1)}</span>
        </div>
      ))}
      <p className="peq-t">Barra: o partido · traço: todos os partidos. Percentuais de quem informou este dado ({nf.format(ta)} filiados).</p>
    </div>
  );
}

export default function Conjuntura() {
  const { D, m, bump } = useLegado();
  const mun = useCarga(() => carregaMun(m.uf), m.uf);
  const geo = useCarga(() => carregaGeo(m.uf), m.uf);
  const uf = useCarga(() => carregaUF(m.uf), m.uf);
  const nac = useCarga(() => carregaNacional(), 'nac');
  const his = useCarga(() => carregaHist(m.uf), m.uf);
  const fil = useCarga(() => carregaFiliadosUF(m.uf), m.uf);
  const filBR = useCarga(() => carregaFiliadosBR(), 'filbr');
  const exUF = useCarga(() => carregaExecUF(m.uf), m.uf);
  const exBR = useCarga(() => carregaExecBR(), 'exbr');

  if (!D.conj2) D.conj2 = vazio();
  const c = D.conj2;
  if (!c.posicao) c.posicao = {};
  const partido = (m.partido ?? '').toUpperCase();
  const cor = corPartido(partido);
  const [cargoId, setCargoId] = useState('estadual2026');
  const [modo, setModo] = useState<Modo>('calor');
  const [sel, setSel] = useState<string | null>(null);        // município aberto no painel do mapa
  const [munFil, setMunFil] = useState<string | null>(null);   // município do perfil de filiados (fechar o painel não o muda)
  const [esc, setEsc] = useState<'mun' | 'uf' | 'br' | null>(null);
  const muda = (f: () => void) => { f(); bump(); };

  const cargo = CARGOS_MAPA.find((x) => x.id === cargoId) ?? CARGOS_MAPA[0];
  const pegaB = (id: string, x: Mun) => cargo.pega(x, his.dados?.[id]);
  const cdi = (D.tse as { cdi?: string }).cdi || m.municipio || '';
  const munAlvo = munFil ?? cdi; // perfil de filiados: o último município clicado no mapa ou escolhido na lista; senão o de domicílio
  const escolheMun = (id: string | null) => { setSel(id); if (id) setMunFil(id); };

  const res = useMemo(() => {
    if (!mun.dados) return null;
    const tot = new Map<string, number>();
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
    return { tot, lista, validos, lider, prefDe };
  }, [mun.dados, his.dados, cargo]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [mun.dados, his.dados, cargo, partido]); // eslint-disable-line react-hooks/exhaustive-deps

  /* vereadores eleitos em 2024 e filiados, por município: parte do partido no total do município */
  const porMun = useMemo(() => {
    const ver = new Map<string, { v: number; t: number; p: number }>();
    const fl = new Map<string, { v: number; t: number; p: number }>();
    const verPart: Record<string, number> = {};
    let maxVer = 0, maxFil = 0;
    if (mun.dados) {
      for (const [id, x] of Object.entries(mun.dados.mun)) {
        const el = x.m24?.ver.el;
        if (!el) continue;
        const t = soma(el), v = el[partido] ?? 0, p = t ? (v / t) * 100 : 0;
        ver.set(id, { v, t, p });
        for (const [sg, n] of Object.entries(el)) verPart[sg] = (verPart[sg] ?? 0) + n;
        if (p > maxVer) maxVer = p;
      }
    }
    if (fil.dados) {
      for (const [id, parts] of Object.entries(fil.dados.mun)) {
        const t = Object.values(parts).reduce((a, b) => a + b[0], 0), v = parts[partido]?.[0] ?? 0, p = t ? (v / t) * 100 : 0;
        fl.set(id, { v, t, p });
        if (p > maxFil) maxFil = p;
      }
    }
    return { ver, fl, maxVer, maxFil, verPart };
  }, [mun.dados, fil.dados, partido]);

  /* ---------- números por escopo ---------- */
  const cadUF = uf.dados?.cadeiras ?? {};
  const nacD = nac.dados;
  const xDom = cdi && mun.dados ? mun.dados.mun[cdi] : undefined;
  const nomeUF = uf.dados?.nome ?? m.uf;
  const nomeMun = (id: string) => mun.dados?.mun[id]?.nm ?? id;
  const cad = (k: string, esfera: 'uf' | 'br') => {
    const mapa = esfera === 'uf' ? cadUF[k] : nacD?.[k as keyof typeof nacD];
    return { n: mapa?.[partido] ?? 0, t: soma(mapa) };
  };
  const parl = (esfera: 'uf' | 'br') => ['federal', 'senado', 'estadual'].reduce((s, k) => ({ n: s.n + cad(k, esfera).n, t: s.t + cad(k, esfera).t }), { n: 0, t: 0 });

  const filTot = (mapa?: Record<string, FilAcum>) => ({ n: mapa?.[partido]?.[0] ?? 0, t: Object.values(mapa ?? {}).reduce((a, b) => a + b[0], 0) });
  const filBRn = filTot(filBR.dados?.br), filUFn = filTot(fil.dados?.uf), filMunn = filTot(munAlvo ? fil.dados?.mun[munAlvo] : undefined);

  /* ---------- Executivo ---------- */
  const esferas: { k: EsferaExec; titulo: string; ano: number; eleito: ExecEleito | undefined; aviso?: string }[] = [
    { k: 'pres', titulo: 'Presidência da República', ano: 2026, eleito: exBR.dados?.pres },
    { k: 'gov', titulo: `Governo de ${nomeUF}`, ano: 2026, eleito: exUF.dados?.gov },
    {
      k: 'pref', titulo: `Prefeitura de ${xDom?.nm ?? 'seu município'}`, ano: 2024, eleito: cdi ? exUF.dados?.pref[cdi] ?? null : null,
      aviso: !cdi ? 'Informe o município de domicílio em “Dados do mandato” para ver a prefeitura.'
        : exUF.dados && !exUF.dados.pref[cdi] ? 'Sem prefeito eleito em 2024 neste município no arquivo do TSE (eleição suplementar, por exemplo).' : undefined,
    },
  ];
  const posEfetiva = (k: EsferaExec, eleito: ExecEleito | undefined): PosExec | null =>
    c.posicao?.[k] ?? (eleito && !('pend' in eleito) ? sugere(eleito, partido) : null);

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
    if (porMun.fl.size && filUFn.t && medio) {
      const medFil = (filUFn.n / filUFn.t) * 100;
      const pouco = [...pcts.out.entries()].filter(([id, p]) => p > medio * 1.5 && (porMun.fl.get(id)?.p ?? 0) < medFil * 0.5).length;
      if (pouco) out.push({ tipo: 'o', texto: `${pouco} município(s) onde o ${partido} tem votação 50% acima da média estadual, mas menos da metade da média de filiados do estado: espaço para ampliar a base de filiação.` });
    }
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
  }, [res, uf.dados, nacD, partido, pcts, cargo, m.uf, mun.dados, cadUF, porMun, filUFn.n, filUFn.t]);

  if (!partido) return <div className="apoio atencao"><span className="tag">Atenção</span>Informe o partido em “Dados do mandato” para ver a conjuntura.</div>;
  if (!m.uf) return <div className="apoio atencao"><span className="tag">Atenção</span>Informe a UF em “Dados do mandato” para ver a conjuntura.</div>;

  const escala = (v: number, max: number) => mistura(cor, 0.06 + 0.94 * (max ? v / max : 0));
  const fill = (id: string) => {
    if (modo === 'marcas') return c.muns[id] ? COR_TAG[c.muns[id].tag] : '#d9d2c3';
    if (modo === 'lider') { const l = res?.lider.get(id); return l ? mistura(corPartido(l), 0.85) : '#d9d2c3'; }
    if (modo === 'ver') { const x = porMun.ver.get(id); return x ? escala(x.p, porMun.maxVer) : '#d9d2c3'; }
    if (modo === 'fil') { const x = porMun.fl.get(id); return x ? escala(x.p, porMun.maxFil) : '#d9d2c3'; }
    return pcts.out.has(id) ? escala(pcts.out.get(id)!, pcts.max) : '#d9d2c3';
  };
  const dica = (id: string, nm: string) => {
    const t = c.muns[id] ? ` · ${TAGS.find((x) => x.k === c.muns[id].tag)?.rot}` : '';
    if (modo === 'lider') return `${nm}: ${res?.lider.get(id) ?? 'sem dados'}${t}`;
    if (modo === 'ver') { const x = porMun.ver.get(id); return `${nm}: ${x ? `${x.v} de ${x.t} vereadores` : 'sem dados'}${t}`; }
    if (modo === 'fil') { const x = porMun.fl.get(id); return `${nm}: ${x ? `${nf.format(x.v)} filiados (${pct(x.p, 1)} do município)` : 'sem dados'}${t}`; }
    return `${nm}: ${pcts.out.has(id) ? pct(pcts.out.get(id)!) : 'sem dados'}${t}`;
  };

  const marcados = Object.entries(c.muns).sort((a, b) => nomeMun(a[0]).localeCompare(nomeMun(b[0]), 'pt'));
  const detB = sel && mun.dados ? pegaB(sel, mun.dados.mun[sel]) : undefined;
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

  /* ---------- filiados: escopo e vetores dos recortes ---------- */
  const escopo = esc ?? (munAlvo && fil.dados?.mun[munAlvo] ? 'mun' : 'uf');
  const mapaEscopo = escopo === 'mun' ? (munAlvo ? fil.dados?.mun[munAlvo] : undefined) : escopo === 'uf' ? fil.dados?.uf : filBR.dados?.br;
  const aEsc = mapaEscopo?.[partido];
  const rotEscopo = escopo === 'mun' ? nomeMun(munAlvo) : escopo === 'uf' ? nomeUF : 'Brasil';
  const rankUF = Object.entries(fil.dados?.uf ?? {}).map(([p, v]) => [p, v[0]] as [string, number]).sort((a, b) => b[1] - a[1]);
  const rankMostra = rankUF.slice(0, 10);
  if (!rankMostra.some(([p]) => p === partido) && fil.dados?.uf[partido]) rankMostra.push([partido, fil.dados.uf[partido][0]]);
  /* o ranking acompanha a camada do mapa; o partido do mandato sempre aparece, mesmo fora do top 10 */
  const top = (e: [string, number][], n = 10) => {
    const o = [...e].sort((a, b) => b[1] - a[1]);
    const t = o.slice(0, n);
    const meu = o.find(([p]) => p === partido);
    if (meu && !t.includes(meu)) t.push(meu);
    return t;
  };
  const lidera = new Map<string, number>();
  res?.lider.forEach((p) => lidera.set(p, (lidera.get(p) ?? 0) + 1));
  const ranking = modo === 'ver' ? { titulo: 'Vereadores eleitos em 2024 no estado', dados: top(Object.entries(porMun.verPart)) }
    : modo === 'fil' ? { titulo: 'Filiados por partido no estado', dados: top(rankUF) }
    : modo === 'lider' ? { titulo: `Municípios em que lidera (${cargo.rot} ${cargo.ano})`, dados: top([...lidera.entries()]) }
    : { titulo: `Votos no estado (${cargo.rot} ${cargo.ano})`, dados: top(res?.lista ?? []) };
  /* barras do município clicado: também seguem a camada (vereadores e filiados dele, ou votos do cargo) */
  const detRank = !sel ? null
    : modo === 'ver' ? { t: 'Vereadores eleitos em 2024', d: top(Object.entries(mun.dados?.mun[sel]?.m24?.ver.el ?? {}), 6) }
    : modo === 'fil' ? { t: 'Filiados por partido', d: top(Object.entries(fil.dados?.mun[sel] ?? {}).map(([p, v]) => [p, v[0]] as [string, number]), 6) }
    : detB ? { t: `Votos · ${cargo.rot} ${cargo.ano}`, d: top(detB.p, 6) } : null;
  const munsOrdem = mun.dados ? Object.entries(mun.dados.mun).sort((a, b) => a[1].nm.localeCompare(b[1].nm, 'pt')) : [];
  const carregando = mun.carregando || geo.carregando || uf.carregando || nac.carregando || his.carregando || fil.carregando || filBR.carregando || exUF.carregando || exBR.carregando;
  const parlBR = parl('br'), parlUF = parl('uf');
  const verBR = cad('vereadores', 'br'), verUF = cad('vereadores', 'uf');
  const prefBR = cad('prefeitos', 'br'), prefUFn = cad('prefeitos', 'uf');
  const lbl = (n: number, t: number) => (t ? ` · ${pct((n / t) * 100, 1)} de ${nf.format(t)}` : '');

  return (
    <div className="ilha-corpo v2">
      <h4 className="v2-titulo">Conjuntura do {partido} em {nomeUF} e no Brasil</h4>
      {carregando && <p className="sem">Carregando dados…</p>}
      {(mun.erro || geo.erro) && <div className="erro-cx">Não foi possível carregar os dados de {m.uf}.</div>}
      {(fil.erro || filBR.erro) && <div className="erro-cx">Não foi possível carregar os filiados.</div>}
      {(exUF.erro || exBR.erro) && <div className="erro-cx">Não foi possível carregar os dados do Executivo.</div>}

      {/* 1 · placar */}
      <h4><span className="v2-n">1</span> Placar do partido</h4>
      <div className="v2-grandes">
        {[
          { rot: 'Parlamentares (Câmara, Senado e Assembleia)', br: parlBR, uf: parlUF },
          { rot: 'Vereadores (2024)', br: verBR, uf: verUF },
          { rot: 'Prefeituras (2024)', br: prefBR, uf: prefUFn },
          { rot: 'Filiados', br: filBRn, uf: filUFn },
        ].map((x) => (
          <div className="v2-grande" key={x.rot}>
            <span className="rot">{x.rot}</span>
            <b>{nf.format(x.br.n)}</b>
            <span>no Brasil{lbl(x.br.n, x.br.t)}</span>
            <b className="uf">{nf.format(x.uf.n)}</b>
            <span>em {m.uf}{lbl(x.uf.n, x.uf.t)}</span>
          </div>
        ))}
        <div className="v2-grande">
          <span className="rot">Posição nos Executivos</span>
          <ul className="v2-pos-lista">
            {esferas.map((e) => {
              const p = posEfetiva(e.k, e.eleito);
              return <li key={e.k}><span>{e.k === 'pres' ? 'Presidência' : e.k === 'gov' ? `Governo ${m.uf}` : 'Prefeitura'}</span><strong>{p ? ROT_POS[p] : 'a definir'}</strong></li>;
            })}
          </ul>
        </div>
      </div>
      <p className="peq-t">
        Parlamentares eleitos em 2026 (senadores eleitos em 2022 não entram); prefeitos e vereadores eleitos em 2024.
        Filiados: posição de {fil.dados?.geracao ?? '…'} (TSE, atualizada todo mês).
      </p>

      {/* 2 · cadeiras e mapa */}
      <h4><span className="v2-n">2</span> Cadeiras e mapa: onde o partido tem força</h4>
      <div className="v2-grandes">
        {NIVEIS.slice(0, 3).map(({ k, rot }) => { // vereadores e prefeituras já estão no placar
          const b = cad(k, 'br'), a = cad(k, 'uf');
          return (
            <div className="v2-grande" key={k}>
              <span className="rot">{rot}</span>
              <b>{nf.format(b.n)}</b>
              <span>no Brasil{lbl(b.n, b.t)}</span>
              <b className="uf">{nf.format(a.n)}</b>
              <span>em {m.uf}{lbl(a.n, a.t)}</span>
            </div>
          );
        })}
      </div>
      <div className="ilha-controles">
        <div className="abas" style={{ margin: 0 }} role="tablist" aria-label="Camada do mapa">
          {MODOS.map(([k, r]) => <button key={k} type="button" role="tab" aria-selected={modo === k} onClick={() => setModo(k)}>{r}</button>)}
        </div>
        {(modo === 'calor' || modo === 'lider' || modo === 'marcas') && (
          <label className="campo"><span className="rot">Cargo</span>
            <select value={cargo.id} onChange={(e) => setCargoId(e.target.value)}>
              {ANOS_MAPA.map((a) => (
                <optgroup key={a} label={`Eleição ${a}`}>
                  {CARGOS_MAPA.filter((x) => x.ano === a).map((x) => <option key={x.id} value={x.id}>{x.rot}</option>)}
                </optgroup>
              ))}
            </select></label>
        )}
      </div>
      {mun.dados && geo.dados && res && (
        <div className="ilha-lado">
          <div>
            <MapaMunicipios geo={geo.dados} fill={fill} selecionado={sel} onSelecionar={escolheMun} titulo={dica} />
            <div className="escala-l">
              {modo === 'calor' && <><span>0%</span><i style={{ background: `linear-gradient(90deg, ${mistura(cor, 0.06)}, ${cor})` }} /><span>{pct(pcts.max, 0)} dos votos</span></>}
              {modo === 'ver' && <><span>0%</span><i style={{ background: `linear-gradient(90deg, ${mistura(cor, 0.06)}, ${cor})` }} /><span>{pct(porMun.maxVer, 0)} dos vereadores</span></>}
              {modo === 'fil' && <><span>0%</span><i style={{ background: `linear-gradient(90deg, ${mistura(cor, 0.06)}, ${cor})` }} /><span>{pct(porMun.maxFil, 0)} dos filiados</span></>}
              {modo === 'lider' && res.lista.slice(0, 6).map(([p]) => <span key={p} className="v2-leg"><i style={{ background: mistura(corPartido(p), 0.85) }} />{p}</span>)}
              {modo === 'marcas' && TAGS.map((t) => <span key={t.k} className="v2-leg"><i style={{ background: t.cor }} />{t.rot}</span>)}
            </div>
            <p className="peq-t">
              {modo === 'ver' ? 'Parte das cadeiras da Câmara Municipal que é do partido (eleição de 2024). ' : modo === 'fil' ? 'Parte dos filiados do município que é do partido. ' : ''}
              Clique num município para detalhar e marcar. Cinza = sem dados.
            </p>
          </div>
          <div>
            {sel ? (
              <div className="v2-det">
                <div className="topo"><h4 style={{ margin: 0 }}>{nomeMun(sel)}</h4><button type="button" className="rm" onClick={() => setSel(null)} aria-label="Fechar">×</button></div>
                <p className="peq-t">
                  {[
                    modo === 'ver' || modo === 'fil' ? null : detB ? `${nf.format(detB.v)} votos válidos · ${cargo.rot} ${cargo.ano}` : 'Sem votos para este cargo',
                    res.prefDe.get(sel) ? `prefeito: ${res.prefDe.get(sel)}` : null,
                  ].filter(Boolean).join(' · ') || 'Sem prefeito registrado'}
                </p>
                <p className="peq-t">
                  {porMun.ver.get(sel) ? `${partido}: ${porMun.ver.get(sel)!.v} de ${porMun.ver.get(sel)!.t} vereadores` : 'Sem vereadores registrados'}
                  {porMun.fl.get(sel) ? ` · ${nf.format(porMun.fl.get(sel)!.v)} filiados (${pct(porMun.fl.get(sel)!.p, 1)})` : ''}
                </p>
                {detRank && (detRank.d.length > 0
                  ? <><p className="peq-t" style={{ marginBottom: 2 }}><strong>{detRank.t}</strong></p><BarrasPartido destaque={partido} dados={detRank.d} /></>
                  : <p className="sem">Sem dados de {detRank.t.toLowerCase()} neste município.</p>)}
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
                <h4 style={{ marginTop: 0 }}>{ranking.titulo}</h4>
                <BarrasPartido destaque={partido} dados={ranking.dados} />
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
                <tr key={id} onClick={() => { escolheMun(id); setModo('marcas'); }} style={{ cursor: 'pointer' }}>
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

      {/* 3 · Executivo */}
      <h4><span className="v2-n">3</span> O partido diante do Executivo</h4>
      <p className="peq-t">
        A sugestão vem da coligação com que o eleito disputou (federações contam como coligação). Alianças mudam depois da eleição:
        confirme ou corrija a posição de cada esfera.
      </p>
      {esferas.map((e) => {
        const ef = e.eleito;
        const sug = ef && !('pend' in ef) ? sugere(ef, partido) : null;
        const salvo = c.posicao?.[e.k];
        const efetivo = salvo ?? sug;
        return (
          <div className="v2-exec" key={e.k}>
            <div className="quem">
              <h5>{e.titulo} <span className="peq-t">· eleição de {e.ano}</span></h5>
              {e.aviso ? <p className="sem">{e.aviso}</p>
                : ef === undefined ? <p className="sem">Carregando…</p>
                : ef === null ? <p className="sem">Sem dados para esta esfera.</p>
                : 'pend' in ef ? (
                  <>
                    <p className="peq-t">2º turno ainda sem resultado. Seu partido, conforme quem vencer:</p>
                    <ul className="v2-itens">
                      {ef.pend.map((r) => (
                        <li key={r.n}><span><Chip p={r.p} /> <strong>{r.n}</strong> · {r.p === partido ? 'é do seu partido' : r.c.includes(partido) ? 'seu partido está na coligação' : 'seu partido está fora da coligação'}</span></li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <>
                    <p><Chip p={ef.p} /> <strong>{ef.n}</strong> · eleito(a) em {e.ano}</p>
                    <p className="peq-t">Coligação da eleição: {ef.c.join(', ')}.</p>
                    <p className="peq-t">
                      {sug === 'governo' ? 'Seu partido é o do eleito.' : sug === 'base' ? 'Seu partido está na coligação do eleito.' : 'Seu partido ficou fora da coligação do eleito: defina se é oposição ou independente.'}
                    </p>
                  </>
                )}
            </div>
            <div className="v2-seg" role="radiogroup" aria-label={`Posição do partido: ${e.titulo}`}>
              {POSICOES.map((p) => (
                <button key={p.k} type="button" role="radio" aria-checked={efetivo === p.k}
                  onClick={() => muda(() => { const pos = c.posicao ?? (c.posicao = {}); if (salvo === p.k) delete pos[e.k]; else pos[e.k] = p.k; })}>
                  {p.rot}{!salvo && sug === p.k ? <small> · sugerido</small> : null}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* 4 · filiados */}
      <h4><span className="v2-n">4</span> Filiados: quem compõe a base do partido</h4>
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
        <div className="kp"><b>{nf.format(filBRn.n)}</b><span>no Brasil{lbl(filBRn.n, filBRn.t)}</span></div>
        <div className="kp"><b>{nf.format(filUFn.n)}</b><span>em {nomeUF}{lbl(filUFn.n, filUFn.t)}</span></div>
        {munAlvo && <div className="kp"><b>{nf.format(filMunn.n)}</b><span>em {nomeMun(munAlvo)}{lbl(filMunn.n, filMunn.t)}</span></div>}
      </div>
      <h4 style={{ marginTop: 6 }}>Filiados por partido em {nomeUF}</h4>
      <BarrasPartido destaque={partido} dados={rankMostra} />
      <h4>Perfil dos filiados do {partido}</h4>
      <div className="ilha-controles">
        <div className="abas" style={{ margin: 0 }} role="tablist" aria-label="Escopo do perfil">
          {([['mun', 'Município'], ['uf', nomeUF], ['br', 'Brasil']] as const).map(([k, r]) => (
            <button key={k} type="button" role="tab" aria-selected={escopo === k} disabled={k === 'mun' && !munAlvo} onClick={() => setEsc(k)}>{r}</button>
          ))}
        </div>
        {escopo === 'mun' && (
          <label className="campo"><span className="rot">Município</span>
            <select value={munAlvo} onChange={(e) => setMunFil(e.target.value || null)}>
              {!munAlvo && <option value="">Escolha…</option>}
              {munsOrdem.map(([id, x]) => <option key={id} value={id}>{x.nm}</option>)}
            </select></label>
        )}
      </div>
      {aEsc ? (
        <>
          <p className="peq-t">{partido} em {rotEscopo}: <strong>{nf.format(aEsc[0])}</strong> filiados.</p>
          <div className="v2-recs">
            <Recorte titulo="Gênero" rots={GENERO} a={aEsc[1]} todos={somaTodos(mapaEscopo, 1, GENERO.length)} cor={cor} />
            <Recorte titulo="Faixa etária" rots={FAIXAS} a={aEsc[2]} todos={somaTodos(mapaEscopo, 2, FAIXAS.length)} cor={cor} />
            <Recorte titulo="Escolaridade" rots={ESCOLA} a={aEsc[3]} todos={somaTodos(mapaEscopo, 3, ESCOLA.length)} cor={cor} />
          </div>
        </>
      ) : (
        !carregando && <p className="sem">O {partido} não tem filiados registrados em {rotEscopo}.</p>
      )}

      {/* 5 · relação desejada */}
      <h4><span className="v2-n">5</span> Que relação a liderança quer ter com o partido?</h4>
      <div className="v2-rels" role="radiogroup" aria-label="Relação desejada com o partido">
        {RELACOES.map((r) => (
          <button key={r.k} type="button" role="radio" aria-checked={c.relacao === r.k} onClick={() => muda(() => { c.relacao = c.relacao === r.k ? '' : r.k; })}>
            <strong>{r.t}</strong><span>{r.d}</span>
          </button>
        ))}
      </div>
      <label className="campo"><span className="rot">Por que essa escolha? O que o partido precisa oferecer?</span>
        <textarea rows={3} value={c.relacaoPq} onChange={(e) => muda(() => { c.relacaoPq = e.target.value; })} /></label>

      {/* 6 · desafios e oportunidades */}
      <h4><span className="v2-n">6</span> Desafios e oportunidades de expansão da relevância partidária</h4>
      <div className="v2-duas">
        {lista('desafios', 'Desafios', 'des')}
        {lista('oportunidades', 'Oportunidades', 'opo')}
      </div>
    </div>
  );
}
