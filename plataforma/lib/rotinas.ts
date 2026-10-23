/* Missão 2 · rotinas do mandato geradas a partir das cadeiras (função pura, nunca guardada).
   Só as preferências do usuário (rotinas desligadas, rotinas entre áreas) vão para D.campos. */
import { AREAS, CHEFIA, SEP, ativas, coordDe, liderDe, nomeLimpo, type Campos, type Patch } from './cadeiras.ts';
import { lista } from './equipe.ts';

export type Freq = 'Semanalmente' | 'Mensalmente' | 'Quadrimestralmente' | 'Semestralmente';
export type Rotina = {
  id: string;
  tipo: 'plan' | 'mensal' | 'semanal' | 'area' | 'feedback' | 'entre';
  titulo: string; freq: Freq; duracao: string;
  convoca: number | null;
  participantes: number[];   // todas as cadeiras envolvidas, com ou sem nome
  confirmados: number;       // as que têm nome
  area?: string;             // reunião de área
  grupo?: number;            // feedback: o líder
  de?: string; para?: string; finalidade?: string; canal?: string; // entre áreas
};

export const CHAVE_ROTOFF = 'm2.rotoff';

const nova = (c: Campos, r: Omit<Rotina, 'confirmados'>): Rotina =>
  ({ ...r, confirmados: r.participantes.filter((i) => nomeLimpo(c, i) !== '').length });

/** Todas as rotinas geradas, inclusive as desligadas. Sem nenhuma cadeira com nome, não há o que gerar. */
function todas(c: Campos): Rotina[] {
  const on = ativas(c);
  if (!on.some((i) => nomeLimpo(c, i) !== '')) return [];
  const rs: Rotina[] = [
    nova(c, { id: 'plan', tipo: 'plan', titulo: 'Planejamento estratégico', freq: 'Quadrimestralmente', duracao: '2 períodos de 6h', convoca: CHEFIA, participantes: on }),
    nova(c, { id: 'mensal', tipo: 'mensal', titulo: 'Monitoramento de avanços do trabalho previsto para o mês — acompanhamento de metas', freq: 'Mensalmente', duracao: '1h', convoca: CHEFIA, participantes: on }),
    nova(c, { id: 'semanal', tipo: 'semanal', titulo: 'Alinhamento de atualização coletiva e expectativas do trabalho da semana', freq: 'Semanalmente', duracao: '1h', convoca: CHEFIA, participantes: on }),
  ];
  AREAS.forEach((area) => {
    const gente = on.filter((i) => i !== CHEFIA && coordDe(c, i) === area);
    if (gente.length < 2) return;
    const topo = gente.find((i) => { const l = liderDe(c, i); return l === null || coordDe(c, l) !== area; }) ?? gente[0];
    rs.push(nova(c, { id: `area:${area}`, tipo: 'area', titulo: 'Reunião semanal da área', freq: 'Semanalmente', duracao: '45 min', convoca: topo, participantes: gente, area }));
  });
  on.forEach((l) => on.filter((i) => liderDe(c, i) === l).forEach((i) =>
    rs.push(nova(c, { id: `fb:${l}>${i}`, tipo: 'feedback', titulo: 'Feedback estruturado individual', freq: 'Semestralmente', duracao: '30 min', convoca: l, participantes: [l, i], grupo: l }))));
  return rs;
}

const desligadas = (c: Campos) => lista(c[CHAVE_ROTOFF]);

export const gerarRotinas = (c: Campos): Rotina[] => todas(c).filter((r) => !desligadas(c).includes(r.id));
export const rotinasDesligadas = (c: Campos): Rotina[] => todas(c).filter((r) => desligadas(c).includes(r.id));

export const desliga = (c: Campos, id: string): Patch => ({ [CHAVE_ROTOFF]: [...new Set([...desligadas(c), id])].join(SEP) });
export const religa = (c: Campos, id: string): Patch => ({ [CHAVE_ROTOFF]: desligadas(c).filter((x) => x !== id).join(SEP) });
