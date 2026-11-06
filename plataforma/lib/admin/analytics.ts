import { diasParado, partesBrasilia } from './escala.ts';
import type { LinhaMandato } from './mandatos.ts';

// Colunas reais de v_admin_eventos_mes; `mes` vem como 'YYYY-MM-01' já no fuso de Brasília.
export interface LinhaEventoMes { mandato_id: string; mes: string; qtd: number }

export interface Indicadores { cadastrados: number; ativos: number; mediaConcluidos: number; parados: number }
export interface MesStatus { mes: string; ativos: number; parados: number }

const MAX_MESES = 12;

// Arquivados saem de tudo (ADM-08.1); a UF, quando escolhida, vale para todos os números (ADM-09.3).
const doEscopo = (ms: LinhaMandato[], uf: string | null) => ms.filter((m) => m.arquivado_em === null && (!uf || m.uf === uf));

// "Ativo no período" = última atividade há N dias ou menos. A spec não define a conta com precisão; ver registro da T12.
export function indicadores(mandatos: LinhaMandato[], agora: Date, periodo: number, parado: number, uf: string | null = null): Indicadores {
  const ms = doEscopo(mandatos, uf);
  const dias = ms.map((m) => diasParado(m.ultima_atividade, agora));
  return {
    cadastrados: ms.length,
    ativos: dias.filter((d) => d <= periodo).length,
    mediaConcluidos: ms.length ? ms.reduce((s, m) => s + m.exercicios_concluidos, 0) / ms.length : 0,
    parados: dias.filter((d) => d > parado).length,
  };
}

// Mês como número corrido (ano*12 + mês-1) para somar e comparar sem Date.
const indiceDe = (ano: number, mes: number) => ano * 12 + (mes - 1);
const indiceBrasilia = (d: Date | string) => { const p = partesBrasilia(d); return indiceDe(p.ano, p.mes); };
const rotulo = (i: number) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;

// Ativo = ao menos 1 linha de evento no mês; Parado = cadastrado até o fim do mês e sem linha.
export function statusMensal(mandatos: LinhaMandato[], eventosMes: LinhaEventoMes[], agora: Date, uf: string | null = null): MesStatus[] {
  const ms = doEscopo(mandatos, uf);
  if (!ms.length) return [];
  const atual = indiceBrasilia(agora);
  const primeiro = Math.min(atual, ...ms.map((m) => indiceBrasilia(m.criado_em)));
  const inicio = Math.max(primeiro, atual - (MAX_MESES - 1));

  const comEvento = new Map<number, Set<string>>(); // mês -> mandatos com linha
  for (const e of eventosMes) {
    const i = indiceDe(Number(e.mes.slice(0, 4)), Number(e.mes.slice(5, 7)));
    (comEvento.get(i) ?? comEvento.set(i, new Set()).get(i)!).add(e.mandato_id);
  }

  const criadoEm = ms.map((m) => ({ id: m.id, mes: indiceBrasilia(m.criado_em) }));
  const saida: MesStatus[] = [];
  for (let i = inicio; i <= atual; i++) {
    const ativosDoMes = comEvento.get(i);
    const ativos = ms.filter((m) => ativosDoMes?.has(m.id)).length;
    const parados = criadoEm.filter((c) => c.mes <= i && !ativosDoMes?.has(c.id)).length;
    saida.push({ mes: rotulo(i), ativos, parados });
  }
  return saida;
}
