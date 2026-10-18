'use client';
/* Pergunta 7 da Missão 1 (expectativas do eleitorado): o mapa do estado no lugar da caixa de texto.
   A equipe seleciona municípios e registra promessas da campanha, grupos sociais que apoiaram
   e grupos com potencial de aproximação. Tudo vai para D.eleitorado. */
import { useMemo, useState } from 'react';
import { carregaGeo } from '@/lib/dados';
import { mistura } from '@/lib/partidos';
import { semAcento } from '@/lib/format';
import type { Eleitorado, ItemEl, TipoEl } from '@/lib/types';
import { useLegado } from './ponte';
import { useCarga } from './pecas';
import MapaConjuntura, { type Celula } from './MapaConjuntura';

const TIPOS: { k: TipoEl; rot: string; add: string; ph: string; cor: string }[] = [
  { k: 'promessa', rot: 'Promessas da campanha', add: 'Promessa', ph: 'Ex.: Ampliar o transporte escolar rural', cor: '#571730' },
  { k: 'apoio', rot: 'Grupos que apoiaram', add: 'Grupo que apoiou', ph: 'Ex.: Professoras da rede municipal', cor: '#1B6B4F' },
  { k: 'potencial', rot: 'Grupos com potencial', add: 'Grupo com potencial', ph: 'Ex.: Jovens de 16 a 24 anos', cor: '#B87A00' },
];
const GRUPOS = ['Mulheres', 'Jovens', 'Pessoas idosas', 'Pessoas negras', 'Povos indígenas', 'LGBTQIA+', 'Pessoas com deficiência', 'Servidores públicos', 'Professores', 'Evangélicos', 'Católicos', 'Agricultura familiar', 'Empreendedores e MEI', 'Estudantes', 'Moradores da periferia', 'Trabalhadores de aplicativo'];

const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const plural = (n: number, a: string, b: string) => `${n} ${n === 1 ? a : b}`;
const porNome = (a: string, b: string) => a.localeCompare(b, 'pt');

export default function EleitoradoIlha() {
  const { D, m, bump } = useLegado();
  const geo = useCarga(() => (m.uf ? carregaGeo(m.uf) : Promise.reject(new Error('sem UF'))), m.uf);
  if (!D.eleitorado) D.eleitorado = { itens: [] } satisfies Eleitorado;
  const itens = D.eleitorado.itens;

  const [tipo, setTipo] = useState<TipoEl>('promessa');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');
  const [ver, setVer] = useState(0); // os itens mudam no lugar; a versão avisa os cálculos do mapa
  const muda = (f: () => void) => { f(); setVer((v) => v + 1); bump(); };

  const nomes = useMemo(() => new Map((geo.dados?.mun ?? []).map((x) => [x.id, x.nm])), [geo.dados]);
  const nome = (id: string) => nomes.get(id) ?? id;
  const t = TIPOS.find((x) => x.k === tipo)!;

  /* quantidade de registros por município e tipo; registros do estado inteiro não pintam o mapa */
  const cont = useMemo(() => {
    const o: Record<string, Record<TipoEl, number>> = {};
    itens.forEach((i) => i.muns.forEach((id) => { (o[id] ??= { promessa: 0, apoio: 0, potencial: 0 })[i.tipo]++; }));
    return o;
  }, [ver, itens]); // eslint-disable-line react-hooks/exhaustive-deps
  const max = Math.max(1, ...Object.values(cont).map((c) => c[tipo]));

  const celulas = useMemo(() => {
    const o: Record<string, Celula> = {};
    (geo.dados?.mun ?? []).forEach((x) => {
      const c = cont[x.id];
      o[x.id] = {
        fill: c && c[tipo] ? mistura(t.cor, 0.22 + 0.78 * (c[tipo] / max)) : '#e4dccb',
        titulo: x.nm,
        linhas: c ? TIPOS.filter((y) => c[y.k]).map((y) => `${c[y.k]} · ${y.rot.toLowerCase()}`) : ['Nada registrado'],
      };
    });
    return o;
  }, [geo.dados, cont, tipo, max, t.cor]);

  const alterna = (id: string | null) => {
    if (!id) return;
    setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };
  const achados = useMemo(() => {
    const q = semAcento(busca.trim());
    if (!q || !geo.dados) return [];
    return geo.dados.mun.filter((x) => semAcento(x.nm).includes(q) && !sel.has(x.id)).slice(0, 8);
  }, [busca, geo.dados, sel]);

  const adiciona = (txt: string) => {
    const v = txt.trim();
    if (!v) return;
    const muns = [...sel];
    const ja = itens.find((i) => i.tipo === tipo && semAcento(i.texto) === semAcento(v));
    muda(() => {
      if (!ja) itens.push({ id: novoId(), tipo, texto: v, muns });
      else if (ja.muns.length) ja.muns = muns.length ? [...new Set([...ja.muns, ...muns])] : [];
    });
    setTexto('');
  };

  const noMun = (i: ItemEl, id: string) => !i.muns.length || i.muns.includes(id);
  const unico = sel.size === 1 ? [...sel][0] : null;

  if (!m.uf) return <div className="apoio atencao"><span className="tag">Atenção</span>Informe a UF em “Dados do mandato” para ver o mapa do estado.</div>;

  const chips = (i: ItemEl) => {
    if (!i.muns.length) return <span className="todo">Estado inteiro</span>;
    const ord = [...i.muns].sort((a, b) => porNome(nome(a), nome(b)));
    return (
      <>
        {ord.slice(0, 5).map((id) => (
          <span key={id}>{nome(id)}
            {i.muns.length > 1 && <button type="button" aria-label={`Tirar ${nome(id)} de “${i.texto}”`} onClick={() => muda(() => { i.muns = i.muns.filter((x) => x !== id); })}>×</button>}
          </span>
        ))}
        {ord.length > 5 && <span title={ord.slice(5).map(nome).join(', ')}>+{ord.length - 5}</span>}
      </>
    );
  };

  return (
    <div className="ilha-corpo">
      <div className="el-tipos" role="group" aria-label="O que registrar no mapa">
        {TIPOS.map((x) => (
          <button key={x.k} type="button" aria-pressed={tipo === x.k} style={{ ['--c' as string]: x.cor }} onClick={() => setTipo(x.k)}>
            {x.rot}<small>{itens.filter((i) => i.tipo === x.k).length}</small>
          </button>
        ))}
      </div>
      {geo.carregando && <p className="sem">Carregando mapa…</p>}
      {geo.erro && <div className="erro-cx">Não foi possível carregar o mapa de {m.uf}.</div>}
      {geo.dados && (
        <div className="ilha-lado">
          <div>
            <MapaConjuntura geo={geo.dados} celulas={celulas} selecionado={null} multi={sel} onSelecionar={alterna} />
            <div className="escala-l">
              <span>Nenhum</span>
              <i style={{ background: `linear-gradient(90deg, ${mistura(t.cor, 0.22)}, ${t.cor})` }} />
              <span>{plural(max, 'registro', 'registros')}</span>
            </div>
            <p className="peq-t">Cor = quantidade de “{t.rot.toLowerCase()}” em cada município. Clique para selecionar vários; arraste para mover; role para aproximar.</p>
          </div>

          <div className="el-painel">
            <h4>{sel.size ? plural(sel.size, 'município selecionado', 'municípios selecionados') : 'Nenhum município selecionado'}</h4>
            <p className="peq-t" style={{ margin: 0 }}>
              {sel.size ? `O que você adicionar vale para ${sel.size === 1 ? 'este município' : 'estes municípios'}.` : `Sem seleção, o registro vale para o estado inteiro (${m.uf}).`}
            </p>
            {sel.size > 0 && (
              <div className="el-sels">
                {[...sel].sort((a, b) => porNome(nome(a), nome(b))).map((id) => (
                  <span key={id}>{nome(id)}<button type="button" aria-label={`Desmarcar ${nome(id)}`} onClick={() => alterna(id)}>×</button></span>
                ))}
              </div>
            )}
            <label className="el-busca">
              <span className="peq-t" style={{ display: 'block', margin: '4px 0 2px' }}>Procurar município pelo nome</span>
              <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite para buscar" />
            </label>
            {achados.length > 0 && (
              <ul className="el-sug">
                {achados.map((x) => <li key={x.id}><button type="button" onClick={() => { alterna(x.id); setBusca(''); }}>{x.nm}</button></li>)}
              </ul>
            )}
            {sel.size > 0 && <div className="el-acoes"><button type="button" className="bt sec" onClick={() => setSel(new Set())}>Limpar seleção</button></div>}

            <form className="el-form" onSubmit={(e) => { e.preventDefault(); adiciona(texto); }}>
              <label className="peq-t" htmlFor="el-texto" style={{ margin: 0 }}><strong>Adicionar: {t.add.toLowerCase()}</strong></label>
              <div className="linha">
                <input id="el-texto" type="text" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={t.ph} />
                <button type="submit" className="bt sec">Adicionar</button>
              </div>
              {tipo !== 'promessa' && (
                <div className="el-acoes" role="group" aria-label="Sugestões de grupos sociais">
                  {GRUPOS.map((s) => <button key={s} type="button" className="bt sec" onClick={() => adiciona(s)}>+ {s}</button>)}
                </div>
              )}
            </form>

            {unico && (
              <div style={{ marginTop: 14 }}>
                <h4>Em {nome(unico)}</h4>
                {TIPOS.map((x) => {
                  const l = itens.filter((i) => i.tipo === x.k && noMun(i, unico));
                  return l.length ? <p key={x.k} className="peq-t" style={{ margin: '2px 0' }}><strong>{x.rot}:</strong> {l.map((i) => i.texto).join(' · ')}</p> : null;
                })}
                {!itens.some((i) => noMun(i, unico)) && <p className="peq-t">Nada registrado ainda.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="el-cols">
        {TIPOS.map((x) => {
          const l = itens.filter((i) => i.tipo === x.k);
          return (
            <section className="el-col" key={x.k} style={{ ['--c' as string]: x.cor }}>
              <h4>{x.rot}</h4>
              {l.length === 0 && <p className="sem">Nada registrado ainda.</p>}
              {l.map((i) => (
                <div className="el-item" key={i.id}>
                  <div className="topo">
                    <button type="button" className="txt" title={i.muns.length ? 'Mostrar no mapa' : undefined}
                      onClick={() => { setTipo(i.tipo); if (i.muns.length) setSel(new Set(i.muns)); }}>{i.texto}</button>
                    <button type="button" className="rm" aria-label={`Remover “${i.texto}”`} onClick={() => muda(() => { D.eleitorado!.itens = itens.filter((q) => q.id !== i.id); })}>×</button>
                  </div>
                  <div className="el-chips">{chips(i)}</div>
                  {sel.size > 0 && i.muns.length > 0 && (
                    <div className="el-acoes" style={{ marginTop: 5 }}>
                      <button type="button" className="bt sec" onClick={() => muda(() => { i.muns = [...new Set([...i.muns, ...sel])]; })}>+ Incluir {plural(sel.size, 'selecionado', 'selecionados')}</button>
                    </div>
                  )}
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/** Versão somente leitura para a aba Resumo. */
export function EleitoradoResumo() {
  const { D, m } = useLegado();
  const geo = useCarga(() => (m.uf ? carregaGeo(m.uf) : Promise.reject(new Error('sem UF'))), m.uf);
  const itens = D.eleitorado?.itens ?? [];
  const nome = (id: string) => geo.dados?.mun.find((x) => x.id === id)?.nm ?? id;
  if (!itens.length) return <p className="sem">Nada registrado ainda.</p>;
  return (
    <div className="ilha-corpo">
      {TIPOS.map((x) => {
        const l = itens.filter((i) => i.tipo === x.k);
        if (!l.length) return null;
        return (
          <div key={x.k}>
            <strong style={{ color: x.cor }}>{x.rot} ({l.length})</strong>
            <ul className="el-resumo-lista">
              {l.map((i) => <li key={i.id}><strong>{i.texto}</strong> — {i.muns.length ? i.muns.map(nome).sort(porNome).join(', ') : `estado inteiro (${m.uf})`}</li>)}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
