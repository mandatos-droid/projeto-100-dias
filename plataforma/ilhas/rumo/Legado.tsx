'use client';
/* Missão 3 · Legado em 4 passos (protagonista, entrega, resultado, cargo) com a primeira página de jornal ao vivo.
   Estado em D.rumo.legado, espelhado em m3.legado e m3.cargo. O texto final pode ser escrito à mão (manual) ou recomposto. */
import { useEffect, useRef, useState } from 'react';
import { avisos, cargosPostulaveis, compoe, dataEdicao } from '@/lib/manchete';
import type { ElementosLegado } from '@/lib/rumo';
import { aviso } from '../ponte';
import Jornal from './Jornal';
import { useRumo } from './useRumo';
import './rumo.css';

type Passo = { id: keyof Pick<ElementosLegado, 'protagonista' | 'entrega' | 'resultado' | 'cargo'>; rot: string; dica: string };
const PASSOS: Passo[] = [
  { id: 'protagonista', rot: 'Protagonista', dica: 'Quem aparece na manchete? Em geral, a liderança parlamentar.' },
  { id: 'entrega', rot: 'Entrega', dica: 'O que o mandato fez que marcou a legislatura? Ex.: colocou a Educação no centro do debate político.' },
  { id: 'resultado', rot: 'Resultado', dica: 'Que resultado dá para conferir? Uma lei aprovada, um número, um problema resolvido.' },
  { id: 'cargo', rot: 'Cargo', dica: 'Qual cargo a liderança estaria postulando daqui a quatro anos?' },
];
const cargoFinal = (el: ElementosLegado) => (el.cargo === 'Outro' ? (el.cargoOutro ?? '') : el.cargo).trim();
const completo = (el: ElementosLegado, i: number) => (i === 3 ? cargoFinal(el) !== '' : el[PASSOS[i].id].trim() !== '');

export default function Legado() {
  const { rumo, m, d, set } = useRumo();
  const lg = rumo.legado;
  const el = lg.el;
  const nome = (m.nome_parlamentar ?? '').trim();
  const prior = rumo.bandeiras.filter((b) => b.prioridade !== null).sort((a, b) => a.prioridade! - b.prioridade!).map((b) => b.rot);
  const ctx = { nome, bandeiras: prior };
  const feitos = [0, 1, 2, 3].filter((i) => completo(el, i));
  const primeiroAberto = [0, 1, 2, 3].find((i) => !completo(el, i)) ?? 3;
  const [passo, setPasso] = useState(primeiroAberto);
  const campo = useRef<HTMLElement | null>(null);
  const moveu = useRef(false);
  useEffect(() => { if (moveu.current) campo.current?.focus(); }, [passo]);

  const liberado = (i: number) => [...Array(i).keys()].every((k) => completo(el, k));
  const vai = (i: number) => { if (i < 0 || i > 3 || !liberado(i)) return; moveu.current = true; setPasso(i); };

  const mudaEl = (p: Partial<ElementosLegado>) => {
    const novo = { ...el, ...p };
    set({ legado: { el: p, ...(lg.manual ? {} : { manchete: compoe(novo, ctx) }) } });
  };
  const recompoe = () => set({ legado: { manual: false, manchete: compoe(el, ctx) } });
  const edita = (manchete: string) => set({ legado: { manchete, manual: true } });

  const cargos = cargosPostulaveis(m.cargo ?? '');
  const opcoes = el.cargo && !cargos.includes(el.cargo) ? [...cargos, el.cargo] : cargos;
  const todos = [0, 1, 2, 3].every((i) => completo(el, i));
  const podeFechar = !lg.fechado && lg.manchete.trim() !== '' && (todos || lg.manual);
  const lista = avisos(lg.manchete, cargoFinal(el));
  const linhaFina = [prior.join(', '), cargoFinal(el)].filter(Boolean).join(' · ');

  const marca = (v: boolean) => { const f = ((d as { feitos?: Record<string, boolean> }).feitos ??= {}); f['m3.legado'] = v; };
  const fecha = () => {
    set({ legado: { fechado: true } });
    marca(true);
    (window as unknown as { App?: { lateral?: () => void } }).App?.lateral?.();
    aviso('Edição fechada. O exercício está concluído.');
  };
  const reabre = () => { set({ legado: { fechado: false } }); marca(false); (window as unknown as { App?: { lateral?: () => void } }).App?.lateral?.(); };

  const p = PASSOS[passo];
  const ref = (e: HTMLElement | null) => { campo.current = e; };

  return (
    <div className="ilha-corpo rm-leg">
      <div className="rm-leg-grade">
        <section aria-labelledby="rm-leg-t" className="rm-leg-passos">
          <ol className="rm-passos" aria-label="Elementos da manchete">
            {PASSOS.map((s, i) => (
              <li key={s.id}>
                <button type="button" className={`rm-passo${feitos.includes(i) ? ' ok' : ''}`} aria-current={i === passo ? 'step' : undefined}
                  aria-disabled={!liberado(i)} onClick={() => vai(i)}>
                  <b>{feitos.includes(i) ? '✓' : i + 1}</b>{s.rot}
                </button>
              </li>
            ))}
          </ol>
          <h4 id="rm-leg-t">Passo {passo + 1} de 4 · {p.rot}</h4>
          <p className="rm-dica">{p.dica}</p>

          {passo === 0 && (
            <label className="campo"><span className="rot">Protagonista</span>
              <input ref={ref} type="text" value={el.protagonista} onChange={(e) => mudaEl({ protagonista: e.target.value })} placeholder={nome || 'Ex.: Joaquim José'} />
              {nome && el.protagonista.trim() !== nome && <button type="button" className="rm-link" onClick={() => mudaEl({ protagonista: nome })}>Usar {nome}</button>}
            </label>
          )}
          {passo === 1 && (
            <label className="campo"><span className="rot">Principal entrega</span>
              <textarea ref={ref} value={el.entrega} onChange={(e) => mudaEl({ entrega: e.target.value })} placeholder="o que o mandato entregou" />
            </label>
          )}
          {passo === 2 && (
            <label className="campo"><span className="rot">Resultado verificável</span>
              <textarea ref={ref} value={el.resultado} onChange={(e) => mudaEl({ resultado: e.target.value })} placeholder="o resultado que dá para conferir" />
            </label>
          )}
          {passo === 3 && (
            <>
              <label className="campo"><span className="rot">Cargo em quatro anos</span>
                <select ref={ref} value={el.cargo} onChange={(e) => mudaEl({ cargo: e.target.value })}>
                  <option value="">Escolha o cargo</option>
                  {opcoes.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              {el.cargo === 'Outro' && (
                <label className="campo"><span className="rot">Qual cargo?</span>
                  <input type="text" value={el.cargoOutro ?? ''} onChange={(e) => mudaEl({ cargoOutro: e.target.value })} placeholder="Ex.: Secretário(a) de Estado" />
                </label>
              )}
              {!m.cargo && <p className="rm-dica">O cargo atual do mandato não está cadastrado; por isso a lista mostra todos os cargos.</p>}
            </>
          )}

          <div className="rm-nav">
            <button type="button" className="bt sec peq" disabled={passo === 0} onClick={() => vai(passo - 1)}>Voltar</button>
            {passo < 3 && <button type="button" className="bt pri peq" disabled={!completo(el, passo)} onClick={() => vai(passo + 1)}>Continuar</button>}
          </div>

          <h4>Texto final da manchete</h4>
          {lg.manual && <p className="rm-dica">Este texto foi escrito à mão{!todos ? ' (ou vem de uma versão anterior da Missão)' : ''}. Os passos não o alteram até você recompor.</p>}
          <label className="campo"><span className="rot">Manchete</span>
            <textarea aria-label="Texto final da manchete" value={lg.manchete} onChange={(e) => edita(e.target.value)} placeholder="A manchete composta pelos passos aparece aqui" />
          </label>
          {lista.map((a) => <p key={a} className="rm-alerta" role="status">{a}</p>)}
          <div className="rm-nav">
            {lg.manual && <button type="button" className="bt sec peq" onClick={recompoe}>Recompor</button>}
            {lg.fechado
              ? <button type="button" className="bt sec peq" onClick={reabre}>Reabrir a edição</button>
              : <button type="button" className="bt pri peq" disabled={!podeFechar} onClick={fecha}>Fechar a edição</button>}
          </div>
          {!lg.fechado && !podeFechar && <p className="rm-dica">Complete os 4 passos para fechar a edição.</p>}
        </section>

        <div className="rm-leg-jornal">
          <Jornal jornal={lg.jornal} nome={nome} manchete={lg.manchete} linhaFina={linhaFina} dataEdicao={dataEdicao(m.data_posse)} fechado={lg.fechado}
            onJornal={(j) => set({ legado: { jornal: j } })} />
        </div>
      </div>
    </div>
  );
}
