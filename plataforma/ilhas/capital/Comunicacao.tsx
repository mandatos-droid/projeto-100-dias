'use client';
/* Missão 4 · acompanhamento semanal da comunicação. Cinco seções expansíveis (as do Guia), números digitados por semana ISO
   e gráfico de linha por seção. Grava em D.comunicacao = { semanas, clipping } (formato e regras em lib/comunicacao.ts). */
import { SECOES, lerComunicacao, registra, semanaDe } from '@/lib/comunicacao';
import { useLegado } from '../ponte';
import SecaoComunicacao from './SecaoComunicacao';
import './capital.css';

export default function Comunicacao() {
  const { D, bump } = useLegado();
  const com = lerComunicacao(D.comunicacao);
  const semana = semanaDe(new Date()) ?? '';

  const grava = (secaoId: string, valores: Record<string, number>): string | null => {
    const r = registra(com, secaoId, semana, valores);
    if (!r.ok) return r.erro;
    D.comunicacao = r.com;
    bump();
    return null;
  };

  return (
    <div className="ilha-corpo cp-esc cp-com">
      <p className="cp-band">Semana atual: {semana}. Registre uma vez por semana os números de cada tópico; só valem números iguais ou maiores que zero.</p>
      {SECOES.map((s) => <SecaoComunicacao key={s.id} secao={s} com={com} semana={semana} onGrava={grava} />)}
    </div>
  );
}
