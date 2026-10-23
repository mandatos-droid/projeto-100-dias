'use client';
/* Missão 2 · a entrega: cadeiras, escopo por cargo, organograma e rotinas num lugar só, para ver, exportar e imprimir.
   Também sugere marcar os itens do checklist (m2.c1..c3); quem marca é o usuário. */
import { AREAS, SEM_AREA, ativas, coordDe, nomeLimpo } from '@/lib/cadeiras';
import { COR_COORD, chaveFicha, lista } from '@/lib/equipe';
import { sugestaoChecklist } from '@/lib/entrega';
import { organogramaSvg } from '@/lib/exporta';
import { cadeia, gerarRotinas, rotinasEntreAreas } from '@/lib/rotinas';
import { cargoNome } from './cargos';
import { aviso } from '../ponte';
import { useEquipe } from './useEquipe';
import './equipe.css';

const ITENS = [
  { k: 'm2.c1', t: 'Escopo de trabalho de cada cargo definido', dica: 'Todas as cadeiras com nome têm escopo.' },
  { k: 'm2.c2', t: 'Organograma do mandato projetado visualmente', dica: 'Há cadeiras ligadas à Chefia de gabinete.' },
  { k: 'm2.c3', t: 'Fluxos de trabalho e rotinas de comunicação estabelecidos', dica: 'Todos os tipos de rotina gerados estão ativos.' },
] as const;

const baixa = (href: string, nome: string) => { const a = document.createElement('a'); a.href = href; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); };

export default function Entrega() {
  const { c, agir } = useEquipe();
  const on = ativas(c);
  const rs = gerarRotinas(c);
  const entre = rotinasEntreAreas(c);
  const sug = sugestaoChecklist(c);
  const svg = () => organogramaSvg(c, (i) => cargoNome(c, i));
  const porArea = [...['Chefia de área', ...AREAS, SEM_AREA]].map((a) => ({ a, ids: on.filter((i) => coordDe(c, i) === a) })).filter((g) => g.ids.length);

  const marca = (k: string) => {
    if (!agir({ patch: { [k]: '1' } })) return;
    /* a lista do checklist é HTML do legado: reabre a tela para mostrar a caixa marcada, mantendo a rolagem */
    const g = (window as unknown as { Guia?: { render(): void } }).Guia, y = window.scrollY;
    if (g) { g.render(); window.scrollTo(0, y); }
  };
  const exporta = () => {
    const s = svg();
    const m = /viewBox="0 0 (\d+) (\d+)"/.exec(s);
    const w = m ? Number(m[1]) : 1200, h = m ? Number(m[2]) : 800;
    const img = new Image();
    img.onload = () => {
      const esc = 2, cv = document.createElement('canvas');
      cv.width = w * esc; cv.height = h * esc;
      const ctx = cv.getContext('2d');
      if (!ctx) { aviso('Não foi possível gerar a imagem neste navegador.'); return; }
      ctx.scale(esc, esc);
      ctx.drawImage(img, 0, 0, w, h);
      cv.toBlob((b) => {
        if (!b) { aviso('Não foi possível gerar a imagem neste navegador.'); return; }
        const url = URL.createObjectURL(b);
        baixa(url, 'organograma-do-mandato.png');
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }, 'image/png');
    };
    img.onerror = () => aviso('Não foi possível gerar a imagem neste navegador.');
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  };

  const pendentes = ITENS.filter((i) => sug[i.k.slice(3) as 'c1' | 'c2' | 'c3'] && !c[i.k]);

  return (
    <div className="ilha-corpo es-entrega">
      <div className="es-nao-imprime">
        <div className="rc-acoes">
          <button type="button" className="bt pri peq es-bt" onClick={exporta}>Exportar organograma (PNG)</button>
          <button type="button" className="bt sec peq es-bt" onClick={() => window.print()}>Imprimir ou salvar em PDF</button>
        </div>
        {pendentes.length > 0 && (
          <div className="apoio" role="status">
            <span className="tag">Sugestão</span>Pelo que você preencheu, estes itens do checklist já podem ser marcados:
            <ul className="es-sugchk">
              {pendentes.map((i) => (
                <li key={i.k}><span>{i.t}<small>{i.dica}</small></span>
                  <button type="button" className="bt sec peq es-bt" aria-label={`Marcar como pronto: ${i.t}`} onClick={() => marca(i.k)}>Marcar como pronto</button></li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <section className="es-bloco" data-bloco="cadeiras">
        <h4>1. Cadeiras do gabinete <span>{on.length}</span></h4>
        <ul className="es-lista-a">
          {porArea.map(({ a, ids }) => (
            <li key={a} style={{ borderLeftColor: COR_COORD[a] ?? '#5E524C' }}>
              <strong>{a === 'Chefia de área' ? 'Chefia de gabinete' : a}</strong>
              <ul>{ids.map((i) => <li key={i}>{cargoNome(c, i)}: <b>{nomeLimpo(c, i) || <em>vaga</em>}</b></li>)}</ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="es-bloco" data-bloco="escopo">
        <h4>2. Escopo de trabalho por cargo</h4>
        <ul className="es-lista-a">
          {on.map((i) => (
            <li key={i} style={{ borderLeftColor: COR_COORD[coordDe(c, i)] ?? '#5E524C' }}>
              <strong>{cargoNome(c, i)}</strong>
              {lista(c[chaveFicha(i, 'escopo')]).length
                ? <ul>{lista(c[chaveFicha(i, 'escopo')]).map((e) => <li key={e}>{e}</li>)}</ul>
                : <span className="sem"> escopo ainda não definido</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="es-bloco" data-bloco="organograma">
        <h4>3. Organograma do mandato</h4>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="es-org-img" alt="Organograma do mandato, com as cadeiras, as áreas e quem lidera quem" src={'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg())} />
      </section>

      <section className="es-bloco" data-bloco="rotinas">
        <h4>4. Rotinas e comunicação</h4>
        {rs.length === 0 ? <p className="sem">As rotinas aparecem quando há pessoas nomeadas.</p> : (
          <ol className="es-lista-r">
            {cadeia(rs).map((e) => <li key={e.tipo}><strong>{e.titulo}</strong> · {e.freq} · {e.duracao} · {e.cadeiras.length} {e.cadeiras.length === 1 ? 'cadeira' : 'cadeiras'}</li>)}
          </ol>
        )}
        {entre.length > 0 && (<>
          <p className="rc-sub">Entre áreas</p>
          <ul className="es-lista-r">{entre.map((r) => <li key={r.id}><strong>{r.titulo.replace('Chefia de área', 'Chefia de gabinete')}</strong> · {r.freq} · {r.finalidade}{r.canal ? ` · ${r.canal}` : ''}</li>)}</ul>
        </>)}
      </section>
    </div>
  );
}
