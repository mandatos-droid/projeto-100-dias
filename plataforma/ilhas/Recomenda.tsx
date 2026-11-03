'use client';
/* Missão 2: seletor de bandeiras e recomendação de cargos.
   As áreas ficam em D.campos['m2.areas']; "Aplicar" escreve nas fichas (m2.f{n}, m2.p{n}.*) e no organograma/rotinas. */
import { useState } from 'react';
import { useLegado, aviso } from './ponte';
import { BANDEIRAS, MAX_BANDEIRAS, bandeiraDe, bandeiraDoRotulo } from '@/lib/bandeiras';
import { CHAVE_APLICADAS, CHAVE_AREAS, areasDe, junta, recomenda, type Grupo, type Item } from '@/lib/recomenda';
import { COORDENACOES, COR_COORD, ESCOPOS, PADRAO, SEP, chaveFicha, chaveNome, lista } from '@/lib/equipe';

const cargos = () => (window as unknown as { CARGOS_EQUIPE: string[][] }).CARGOS_EQUIPE;
const ESCOPO_TEMATICO = ESCOPOS[10]; // "Atuar como especialista de pauta ..."

const GRUPOS: { g: Grupo; t: string; d: string }[] = [
  { g: 'tematico', t: 'Cargos temáticos', d: 'Nascem das bandeiras escolhidas.' },
  { g: 'ajustavel', t: 'Cargos que se ajustam', d: 'Existem em qualquer mandato; o perfil ou o tamanho depende das bandeiras e do território.' },
  { g: 'fixo', t: 'Núcleo fixo', d: 'Independe das bandeiras.' },
  { g: 'opcional', t: 'Ainda sem bandeira', d: 'Ficam de fora até haver bandeira para cobrir.' },
];

/** Bandeiras já escritas na Missão 3 (m3.b1..b3, depois o mural) que a taxonomia reconhece. */
function daMissao3(c: Record<string, string>) {
  const textos = [c['m3.b1'], c['m3.b2'], c['m3.b3']].filter(Boolean) as string[];
  const mural = (c['m3.mural'] ?? '').split(/;|\n|<br\s*\/?>/i).map((x) => x.replace(/<[^>]*>/g, ' ').trim()).filter(Boolean);
  const ids: string[] = [];
  let ignoradas = 0;
  [...(textos.length ? textos : mural)].forEach((t) => {
    const b = bandeiraDoRotulo(t);
    if (b && !ids.includes(b.id)) ids.push(b.id); else if (!b) ignoradas++;
  });
  return { ids: ids.slice(0, MAX_BANDEIRAS), ignoradas };
}

export default function Recomenda() {
  const { D, bump } = useLegado();
  const c = D.campos;
  const areas = areasDe(c);
  const aplicadas = areasDe(c, CHAVE_APLICADAS);
  const [msg, setMsg] = useState('');
  const { itens, avisos } = recomenda(areas);
  const m3 = daMissao3(c);

  const grava = (ids: string[]) => { c[CHAVE_AREAS] = junta(ids); setMsg(''); bump(); };
  const alterna = (id: string) => {
    if (areas.includes(id)) return grava(areas.filter((a) => a !== id));
    if (areas.length >= MAX_BANDEIRAS) return setMsg(`O Guia recomenda até ${MAX_BANDEIRAS} bandeiras para não dispersar esforços. Desmarque uma para trocar.`);
    grava([...areas, id]);
  };
  const sobe = (n: number) => { const l = [...areas]; [l[n - 1], l[n]] = [l[n], l[n - 1]]; grava(l); };
  const importa = () => grava(m3.ids);
  const levaParaM3 = () => {
    areas.forEach((id, n) => { const k = `m3.b${n + 1}`; if (!(c[k] ?? '').trim()) c[k] = bandeiraDe(id)!.rot; });
    bump(); aviso('Bandeiras copiadas para os campos vazios da Missão 3.');
  };

  const cargoNome = (i: number) => c[chaveFicha(i, 'nome_cargo')] || cargos()[i][0];
  const semNome = (i: number) => !(c[chaveNome(i)] ?? '').trim();
  const aplica = () => {
    const mexe = itens.filter((it) => (it.grupo === 'tematico' || it.grupo === 'ajustavel') && (it.espec || it.grupo === 'tematico'));
    mexe.forEach((it) => {
      if (it.grupo === 'tematico' && semNome(it.i)) c[chaveNome(it.i)] = '*';
      if (it.espec && !(c[chaveFicha(it.i, 'espec')] ?? '').trim()) c[chaveFicha(it.i, 'espec')] = it.espec;
      if (it.grupo === 'tematico') {
        const esc = lista(c[chaveFicha(it.i, 'escopo')]);
        if (!esc.includes(ESCOPO_TEMATICO)) c[chaveFicha(it.i, 'escopo')] = [...esc, ESCOPO_TEMATICO].join(SEP);
      }
    });
    c[CHAVE_APLICADAS] = junta(areas);
    bump();
    /* os campos de nome do legado são HTML estático: reabre a tela para mostrar os asteriscos, mantendo a rolagem */
    const g = (window as unknown as { Guia?: { render(): void } }).Guia, y = window.scrollY;
    if (g) { g.render(); window.scrollTo(0, y); }
    aviso('Recomendação aplicada: veja o organograma e as rotinas.');
  };
  const mudou = aplicadas.length > 0 && junta(aplicadas) !== junta(areas);

  const porGrupo = (g: Grupo) => itens.filter((it) => it.grupo === g);
  const linha = (it: Item) => {
    const coord = PADRAO[it.i]?.coord ?? 'Chefia de área';
    return (
      <li key={it.i} className={'rc-it g-' + it.grupo}>
        <i className="rc-pt" style={{ background: COR_COORD[coord] ?? '#571730' }} title={coord} />
        <div>
          <strong>{cargoNome(it.i)}</strong>
          {it.area && <span className="rc-tag">{bandeiraDe(it.area)?.rot}</span>}
          <span className="rc-mt">{it.motivo}</span>
        </div>
      </li>
    );
  };

  return (
    <div className="ilha-corpo rc">
      <h4>Bandeiras do mandato e cargos recomendados</h4>
      <p className="rc-ajuda">Marque até {MAX_BANDEIRAS} agendas em ordem de prioridade. O sistema recomenda os cargos da equipe; quem ocupa cada cargo você decide depois, pela competência.</p>

      <div className="eq-chips" role="group" aria-label="Bandeiras do mandato">
        {BANDEIRAS.map((b) => {
          const n = areas.indexOf(b.id);
          return (
            <button key={b.id} type="button" className={'eq-chip' + (n >= 0 ? ' on' : '')} aria-pressed={n >= 0} onClick={() => alterna(b.id)}>
              {n >= 0 && <b className="rc-n">{n + 1}</b>}{b.rot}
            </button>
          );
        })}
      </div>
      <div className="rc-acoes">
        <span className="rc-cont"><strong>{areas.length}</strong> de {MAX_BANDEIRAS} bandeiras</span>
        {areas.length > 1 && areas.slice(1).map((id, n) => (
          <button key={id} type="button" className="bt sec peq" onClick={() => sobe(n + 1)}>Subir “{bandeiraDe(id)?.rot}”</button>
        ))}
        {!areas.length && m3.ids.length > 0 && <button type="button" className="bt sec peq" onClick={importa}>Importar da Missão 3 ({m3.ids.length})</button>}
        {areas.length > 0 && <button type="button" className="bt sec peq" onClick={levaParaM3}>Levar para a Missão 3</button>}
      </div>
      {m3.ignoradas > 0 && !areas.length && <p className="rc-aviso">{m3.ignoradas} bandeira(s) da Missão 3 não estão na lista e não entram na recomendação.</p>}
      {msg && <p className="rc-aviso" role="status">{msg}</p>}

      <div className="rc-lista">
        {GRUPOS.map(({ g, t, d }) => {
          const l = porGrupo(g);
          if (!l.length) return null;
          return (
            <section key={g} className={'rc-grupo g-' + g}>
              <header><strong>{t}</strong><span>{l.length} cargo(s) · {d}</span></header>
              <ul>{l.map(linha)}</ul>
            </section>
          );
        })}
      </div>

      <ul className="rc-avisos">{avisos.map((a) => <li key={a}>{a}</li>)}</ul>
      {mudou && <p className="rc-aviso" role="status">As bandeiras mudaram desde a última vez que a recomendação foi aplicada. Reaplique para atualizar os cargos temáticos.</p>}
      <div className="rc-acoes">
        <button type="button" className="bt pri peq" disabled={!areas.length} onClick={aplica}>Aplicar ao organograma e às rotinas</button>
        <span className="rc-cont">Marca com * os cargos temáticos ainda sem nome e preenche as especificidades vazias. Não apaga nada do que você escreveu.</span>
      </div>
      <p className="rc-leg">Coordenações: {COORDENACOES.map((k) => <span key={k}><i style={{ background: COR_COORD[k] }} />{k}</span>)}</p>
    </div>
  );
}
