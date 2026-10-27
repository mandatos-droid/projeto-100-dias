'use client';
/* Missão 4 · acompanhamento semanal da comunicação. Cinco seções expansíveis (as do Guia), números digitados por semana ISO,
   gráfico de linha por seção e, no fim, a "Linha do tempo geral" com um indicador de cada seção.
   Grava em D.comunicacao = { semanas, clipping } (formato e regras em lib/comunicacao.ts) e marca as caixinhas antigas m4.k1 a m4.k5. */
import { useEffect } from 'react';
import { SECOES, caixinhasParaMarcar, indicador, lerComunicacao, registra, semanaDe } from '@/lib/comunicacao';
import { useLegado } from '../ponte';
import Grafico from './Grafico';
import SecaoComunicacao from './SecaoComunicacao';
import './capital.css';

export default function Comunicacao() {
  const { D, bump } = useLegado();
  const com = lerComunicacao(D.comunicacao);
  const semana = semanaDe(new Date()) ?? '';

  /* seção com registro marca a caixinha antiga: o Resumo e o contador do Guia leem D.campos['m4.kN'] (nunca desmarca) */
  const marcaCaixinhas = () => {
    const chaves = caixinhasParaMarcar(lerComunicacao(D.comunicacao), D.campos);
    if (!chaves.length) return;
    chaves.forEach((k) => { (D.campos as Record<string, unknown>)[k] = true; });
    bump();
  };
  useEffect(marcaCaixinhas, []); // registros que já existiam antes de abrir a tela // eslint-disable-line react-hooks/exhaustive-deps

  const grava = (secaoId: string, valores: Record<string, number>): string | null => {
    const r = registra(com, secaoId, semana, valores);
    if (!r.ok) return r.erro;
    D.comunicacao = r.com;
    marcaCaixinhas();
    bump();
    return null;
  };

  const series = SECOES.map((s) => ({ id: s.id, rot: s.curto, pontos: indicador(com, s.id).map((p) => ({ x: p.semana, valor: p.valor })) })).filter((s) => s.pontos.length > 0);
  const semanasTotal = new Set(series.flatMap((s) => s.pontos.map((p) => p.x))).size;

  return (
    <div className="ilha-corpo cp-esc cp-com">
      <p className="cp-band">Semana atual: {semana}. Registre uma vez por semana os números de cada tópico; só valem números iguais ou maiores que zero.</p>
      {SECOES.map((s) => <SecaoComunicacao key={s.id} secao={s} com={com} semana={semana} onGrava={grava} />)}
      <section className="cp-geral" aria-labelledby="cp-geral-t">
        <h4 id="cp-geral-t">Linha do tempo geral</h4>
        <p className="cp-fonte">Um indicador de cada seção: o número principal dela em cada semana (alcance, comentários, mensagens recebidas, pessoas que participaram e aparições na imprensa).</p>
        {semanasTotal >= 2
          ? <Grafico tipo="linha" titulo="Um indicador de cada seção, por semana" series={series} />
          : <p className="cp-vazio">Registre mais uma semana para ver a linha do tempo geral.</p>}
      </section>
    </div>
  );
}
