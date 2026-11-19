'use client';
/* Missão 4 · acompanhamento semanal da comunicação. No alto, o Resumo (um cartão por seção: número principal, variação e
   miniatura); depois as cinco seções expansíveis (as do Guia), números digitados por semana ISO, com um gráfico por número;
   no fim, o clipping de notícias.
   Grava em D.comunicacao = { semanas, clipping } (formato e regras em lib/comunicacao.ts) e marca as caixinhas antigas m4.k1 a m4.k5. */
import { useEffect } from 'react';
import { SECOES, caixinhasParaMarcar, lerComunicacao, registra, registraMes, resumoSecao, rotuloSemana, semanaDe, type ResumoSecao } from '@/lib/comunicacao';
import { hojeISO } from '@/lib/capital';
import { useLegado } from '../ponte';
import Clipping from './Clipping';
import SecaoComunicacao, { type RefRegistro } from './SecaoComunicacao';
import './capital.css';

const fmt = (n: number) => n.toLocaleString('pt-BR');

/** Miniatura do cartão: a mesma linha do gráfico, sem eixos (os números estão escritos ao lado e na tabela da seção). */
function Miniatura({ valores }: { valores: number[] }) {
  if (valores.length < 2) return null;
  const max = Math.max(...valores), min = Math.min(...valores), W = 100, H = 28, m = 3;
  const px = (i: number) => m + (i * (W - 2 * m)) / (valores.length - 1);
  const py = (v: number) => (max === min ? H / 2 : H - m - ((v - min) / (max - min)) * (H - 2 * m));
  const pts = valores.map((v, i) => `${px(i)},${py(v)}`).join(' ');
  return (
    <svg className="cp-kpi-sp" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1={px(valores.length - 1)} x2={px(valores.length - 1)} y1={py(valores[valores.length - 1])} y2={py(valores[valores.length - 1])} stroke="currentColor" strokeWidth={6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** "▲ +12 (+8%)" contra o registro anterior da mesma seção; sem anterior, "1º registro". */
function variacaoDe(r: ResumoSecao): { cls: 'sobe' | 'desce' | 'igual' | 'novo'; texto: string } {
  if (r.anterior === null) return { cls: 'novo', texto: '1º registro' };
  const d = r.valor - r.anterior;
  const ref = r.periodo === 'mês' ? 'mês anterior' : 'semana anterior';
  if (d === 0) return { cls: 'igual', texto: `= igual ${r.periodo === 'mês' ? 'ao' : 'à'} ${ref}` };
  const pct = r.anterior > 0 ? ` (${d > 0 ? '+' : '−'}${Math.round(Math.abs(d / r.anterior) * 100)}%)` : '';
  return { cls: d > 0 ? 'sobe' : 'desce', texto: `${d > 0 ? '▲ +' : '▼ −'}${fmt(Math.abs(d))}${pct} vs. ${ref}` };
}

export default function Comunicacao() {
  const { D, bump } = useLegado();
  const com = lerComunicacao(D.comunicacao);
  const hoje = hojeISO();
  const semana = semanaDe(new Date()) ?? '';

  /* seção com registro marca a caixinha antiga: o Resumo e o contador do Guia leem D.campos['m4.kN'] (nunca desmarca) */
  const marcaCaixinhas = () => {
    const chaves = caixinhasParaMarcar(lerComunicacao(D.comunicacao), D.campos);
    if (!chaves.length) return;
    chaves.forEach((k) => { (D.campos as Record<string, unknown>)[k] = true; });
    bump();
  };
  useEffect(marcaCaixinhas, []); // registros que já existiam antes de abrir a tela // eslint-disable-line react-hooks/exhaustive-deps

  const grava = (secaoId: string, valores: Record<string, number>, ref: RefRegistro): string | null => {
    const r = ref.tipo === 'semana' ? registra(com, secaoId, semanaDe(ref.data) ?? '', valores, ref.data) : registraMes(com, secaoId, ref.mes, valores);
    if (!r.ok) return r.erro;
    D.comunicacao = r.com;
    marcaCaixinhas();
    bump();
    return null;
  };

  return (
    <div className="ilha-corpo cp-esc cp-com">
      <div className="np-sec-card cp-com-banda">
        <p className="cp-band">Semana atual: {rotuloSemana(semana)}. Registre uma vez por semana os números de cada tópico; só valem números iguais ou maiores que zero.</p>
      </div>
      <section className="cp-com-resumo" aria-labelledby="cp-com-resumo-t">
        <h4 id="cp-com-resumo-t" className="cp-com-resumo-t">Resumo</h4>
        <div className="cp-kpis">
          {SECOES.map((sec) => {
            const r = resumoSecao(com, sec.id);
            const v = r ? variacaoDe(r) : null;
            return (
              <div key={sec.id} className="cp-kpi" data-kpi={sec.id}>
                <p className="rot">{sec.curto}</p>
                <p className="num">{r ? fmt(r.valor) : '–'}</p>
                <p className="sub">{r ? r.rot : 'Sem registro ainda'}</p>
                {v && <p className={`var ${v.cls}`}>{v.texto}</p>}
                {r && <Miniatura valores={r.serie} />}
              </div>
            );
          })}
        </div>
      </section>
      <div className="np-sec-card np-com-secoes">
        {SECOES.map((s) => <SecaoComunicacao key={s.id} secao={s} com={com} hoje={hoje} onGrava={grava} clipping={com.clipping} />)}
      </div>
      <div className="np-sec-card">
        <Clipping />
      </div>
    </div>
  );
}
