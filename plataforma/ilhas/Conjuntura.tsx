'use client';
/* Pergunta m1.q5 da Conjuntura: onde o partido está (cadeiras, Executivo, filiados) e que relação a liderança
   quer ter com ele. Tudo o que a equipe registra vai para D.conj2; o resto é leitura de public/data. */
import { Fragment, useMemo, useState } from 'react';
import {
  carregaExecBR, carregaExecUF, carregaFiliadosBR, carregaFiliadosUF, carregaHist, carregaMun,
  carregaNacional, carregaUF,
} from '@/lib/dados';
import { corPartido } from '@/lib/partidos';
import { nf, pct } from '@/lib/format';
import type { Conj2, EsferaExec, ExecEleito, FilAcum, Mun, PosExec, RegExec } from '@/lib/types';
import { CARGOS, NIVEIS } from './cargos';
import { CartoesMunicipio, numerosMun, pctEstado, useAlvoMun } from './CartoesMunicipio';
import { POSICOES, ROT_POS, sugere } from './posicoes';
import { Reacoes } from './Reacoes';
import { dadosSelecionaveis } from '@/lib/dadosPartido';
import { useLegado } from './ponte';
import { BarrasPartido, Chip, useCarga } from './pecas';

const vazio = (): Conj2 => ({ muns: {}, posicao: {}, relacao: '', relacaoPq: '', desafios: [], oportunidades: [] });
const soma = (o?: Record<string, number>) => Object.values(o ?? {}).reduce((a, b) => a + b, 0);
const somaArr = (a?: number[]) => (a ?? []).reduce((x, y) => x + y, 0);

const RELACOES = [
  { k: 'direcao', t: 'Quadro de direção', d: 'Quer disputar espaço nas executivas e influir nas decisões do partido.' },
  { k: 'bancada', t: 'Liderança de bancada', d: 'Foca na atuação legislativa e na coordenação com os colegas de partido na Casa.' },
  { k: 'autonoma', t: 'Aliada com autonomia', d: 'Segue a linha geral, mas mantém agenda e base própria.' },
  { k: 'ponte', t: 'Ponte com outras forças', d: 'Usa o partido como plataforma para dialogar com outros partidos e movimentos.' },
  { k: 'transicao', t: 'Em reavaliação', d: 'Pondera mudar de papel ou de partido; precisa mapear custos e alternativas.' },
];

export { ROT_POS, sugere }; // Resumos importa daqui

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

/** Uma barra por categoria: o partido (barra cheia) contra todos os partidos do mesmo escopo (traço). */
function Recorte({ titulo, rots, a, todos, cor }: { titulo: string; rots: string[]; a?: number[]; todos: number[]; cor: string }) {
  const ta = somaArr(a), tt = somaArr(todos);
  const pa = rots.map((_, i) => (ta ? ((a?.[i] ?? 0) / ta) * 100 : 0));
  const pt = rots.map((_, i) => (tt ? (todos[i] / tt) * 100 : 0));
  const esc = 100 / Math.max(1, ...pa, ...pt);
  return (
    <div className="v2-rec">
      <h5>{titulo}</h5>
      <div className="v2-rec-l cab" aria-hidden="true"><span /><span /><span className="v">Partido</span><span className="t">Todos</span></div>
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
      <p className="peq-t">Barra e % em destaque: o partido · traço e % em cinza: todos os partidos. Percentuais de quem informou este dado ({nf.format(ta)} filiados).</p>
    </div>
  );
}

export default function Conjuntura() {
  const { D, m, bump } = useLegado();
  const mun = useCarga(() => carregaMun(m.uf), m.uf);
  const uf = useCarga(() => carregaUF(m.uf), m.uf);
  const nac = useCarga(() => carregaNacional(), 'nac');
  const his = useCarga(() => carregaHist(m.uf), m.uf);
  const fil = useCarga(() => carregaFiliadosUF(m.uf), m.uf);
  const filBR = useCarga(() => carregaFiliadosBR(), 'filbr');
  const exUF = useCarga(() => carregaExecUF(m.uf), m.uf);
  const exBR = useCarga(() => carregaExecBR(), 'exbr');
  const alvo = useAlvoMun(mun.dados);

  if (!D.conj2) D.conj2 = vazio();
  const c = D.conj2;
  if (!c.posicao) c.posicao = {};
  const partido = (m.partido ?? '').toUpperCase();
  const cor = corPartido(partido);
  const [esc, setEsc] = useState<'uf' | 'br' | null>(null);
  const [somando, setSomando] = useState(false);               // seletor do botão + das prefeituras
  const muda = (f: () => void) => { f(); bump(); };

  const cargo = CARGOS_MAPA.find((x) => x.id === 'estadual2026') ?? CARGOS_MAPA[0];
  const pegaB = (id: string, x: Mun) => cargo.pega(x, his.dados?.[id]);
  const cdi = (D.tse as { cdi?: string }).cdi || m.municipio || '';
  const munAlvo = cdi; // perfil de filiados: o município de domicílio

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


  /* outras prefeituras que a liderança acompanha: botão + escolhe o município e depois a relação */
  const extras = c.prefExtra ?? {};
  const idsExtras = Object.keys(extras);
  const disponiveis = Object.entries(mun.dados?.mun ?? {}).filter(([id]) => !(id in extras) && id !== cdi)
    .sort((a, b) => a[1].nm.localeCompare(b[1].nm, 'pt-BR'));
  /* prefeituras do partido (eleição de 2024) ainda fora da lista */
  const doPartido = disponiveis.filter(([id]) => exUF.dados?.pref[id]?.p === partido);
  const prefExtras = () => (
    <div className="v2-extras">
      {idsExtras.map((id) => {
        const reg = exUF.dados?.pref[id];
        const sug = sugere(reg, partido);
        const salvo = extras[id] || null;
        const efetivo = salvo ?? sug;
        return (
          <div className="v2-exec" key={id}>
            <div className="quem">
              <h5>Prefeitura de {nomeMun(id)} <span className="peq-t">· eleição de 2024</span>
                <button type="button" className="link-bt" style={{ marginLeft: 8 }} aria-label={`Remover ${nomeMun(id)}`}
                  onClick={() => muda(() => { delete (c.prefExtra ?? {})[id]; })}>remover</button></h5>
              {reg ? <p><Chip p={reg.p} /> <strong>{reg.n}</strong> · coligação: {reg.c.join(', ')}.</p>
                : <p className="sem">Sem prefeito eleito em 2024 neste município no arquivo do TSE.</p>}
            </div>
            <div className="v2-seg" role="radiogroup" aria-label={`Posição do partido: prefeitura de ${nomeMun(id)}`}>
              {POSICOES.map((p) => (
                <button key={p.k} type="button" role="radio" aria-checked={efetivo === p.k}
                  onClick={() => muda(() => { const x = c.prefExtra ?? (c.prefExtra = {}); x[id] = salvo === p.k ? '' : p.k; })}>
                  {p.rot}{!salvo && sug === p.k ? <small> · sugerido</small> : null}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {somando ? (
        <div className="ilha-controles">
          <label className="campo"><span className="rot">Município</span>
            <select autoFocus value="" onChange={(e) => { const id = e.target.value; if (id) muda(() => { (c.prefExtra ?? (c.prefExtra = {}))[id] = ''; }); setSomando(false); }}>
              <option value="">Escolha…</option>
              {disponiveis.map(([id, x]) => <option key={id} value={id}>{x.nm}</option>)}
            </select>
          </label>
          <button type="button" className="bt fant peq" onClick={() => setSomando(false)}>Cancelar</button>
        </div>
      ) : (
        <button type="button" className="bt fant peq" onClick={() => setSomando(true)} disabled={!mun.dados} aria-label="Adicionar município e sua relação">
          <span aria-hidden="true">+</span> Adicionar município
        </button>
      )}
      {!somando && (
        <button type="button" className="bt fant peq" style={{ marginLeft: 8 }} disabled={!doPartido.length}
          onClick={() => muda(() => { const x = c.prefExtra ?? (c.prefExtra = {}); doPartido.forEach(([id]) => { x[id] = ''; }); })}>
          <span aria-hidden="true">+</span> Adicionar todos os municípios com prefeito do {partido}{doPartido.length ? ` (${doPartido.length})` : ''}
        </button>
      )}
    </div>
  );

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
  const escopo = esc ?? 'uf';
  const mapaEscopo = escopo === 'uf' ? fil.dados?.uf : filBR.dados?.br;
  const aEsc = mapaEscopo?.[partido];
  const rotEscopo = escopo === 'uf' ? nomeUF : 'Brasil';
  const rankUF = Object.entries(fil.dados?.uf ?? {}).map(([p, v]) => [p, v[0]] as [string, number]).sort((a, b) => b[1] - a[1]);
  const rankMostra = rankUF.slice(0, 10);
  if (!rankMostra.some(([p]) => p === partido) && fil.dados?.uf[partido]) rankMostra.push([partido, fil.dados.uf[partido][0]]);
  const carregando = mun.carregando || uf.carregando || nac.carregando || his.carregando || fil.carregando || filBR.carregando || exUF.carregando || exBR.carregando;
  const parlBR = parl('br'), parlUF = parl('uf');
  const verBR = cad('vereadores', 'br'), verUF = cad('vereadores', 'uf');
  const prefBR = cad('prefeitos', 'br'), prefUFn = cad('prefeitos', 'uf');
  const lbl = (n: number, t: number) => (t ? ` · ${pct((n / t) * 100, 1)} de ${nf.format(t)}` : '');

  /* os mesmos números do Placar e dos cartões, para o seletor das reações (PAR-10) */
  const dadosDoPartido = dadosSelecionaveis(
    {
      parlamentares: { uf: parlUF.n, br: parlBR.n }, vereadores: { uf: verUF.n, br: verBR.n },
      prefeituras: { uf: prefUFn.n, br: prefBR.n }, filiados: { uf: filUFn.n, br: filBRn.n },
      executivos: esferas.map((e) => { const x = posEfetiva(e.k, e.eleito); return `${e.k === 'pres' ? 'Presidência' : e.k === 'gov' ? `Governo ${m.uf}` : 'Prefeitura'}: ${x ? ROT_POS[x] : 'a definir'}`; }).join(' · '),
    },
    alvo.itens.map((it) => numerosMun(it, mun.dados, fil.dados, alvo.casa, partido)),
  );

  return (
    <div className="ilha-corpo v2">
      <h4 className="v2-titulo">Conjuntura do {partido} em {nomeUF} e no Brasil</h4>
      {carregando && <p className="sem">Carregando dados…</p>}
      {mun.erro && <div className="erro-cx">Não foi possível carregar os dados de {m.uf}.</div>}
      {(fil.erro || filBR.erro) && <div className="erro-cx">Não foi possível carregar os filiados.</div>}
      {(exUF.erro || exBR.erro) && <div className="erro-cx">Não foi possível carregar os dados do Executivo.</div>}

      {/* 1 · placar */}
      <h4><span className="v2-n">1</span> Placar do partido</h4>
      <div className="v2-grandes">
        {[
          { rot: 'Parlamentares (Câmara dos Deputados, Senado e Assembleia)', br: parlBR, uf: parlUF },
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

      {/* 2 · cadeiras (o mapa por município saiu: PAR-03) */}
      <h4><span className="v2-n">2</span> Cadeiras do partido</h4>
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

      {/* 3 · Executivo */}
      <h4><span className="v2-n">3</span> O partido diante do Executivo</h4>
      <p className="peq-t">
        A sugestão vem da coligação com que o eleito disputou (federações contam como coligação). Alianças mudam depois da eleição:
        confirme ou corrija a posição de cada esfera.
      </p>
      {esferas.map((e) => {
        if (e.k === 'pref' && !cdi) return <Fragment key={e.k}><h5 className="v2-sub">Prefeituras que a liderança acompanha</h5>{prefExtras()}</Fragment>; // sem domicílio: só a escolha de municípios
        const ef = e.eleito;
        const sug = ef && !('pend' in ef) ? sugere(ef, partido) : null;
        const salvo = c.posicao?.[e.k];
        const efetivo = salvo ?? sug;
        return (
          <Fragment key={e.k}>
          <div className="v2-exec">
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
          {e.k === 'pref' && prefExtras()}
          </Fragment>
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
          {([['uf', nomeUF], ['br', 'Brasil']] as const).map(([k, r]) => (
            <button key={k} type="button" role="tab" aria-selected={escopo === k} onClick={() => setEsc(k)}>{r}</button>
          ))}
        </div>
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

      {/* depois dos dados: um cartão por município e as 2 reações do mandato (PAR-04, PAR-09 a PAR-12) */}
      <CartoesMunicipio alvo={alvo} partido={partido} uf={m.uf} c={c} munUF={mun.dados} fil={fil.dados} exUF={exUF.dados}
        pctUF={pctEstado(mun.dados?.mun, alvo.casa, partido)} nomeUF={nomeUF} />
      <Reacoes dados={dadosDoPartido} />

      {/* As seções 5 (relação desejada com o partido) e 6 (desafios e oportunidades) saíram da tela por decisão sobre a sugestão #20:
          fica só a pergunta abrangente, no Guia. Os valores já salvos (c.relacao, c.relacaoPq, c.desafios, c.oportunidades) seguem gravados. */}
    </div>
  );
}
