/* Missão 2 · rotinas do mandato geradas a partir das cadeiras (função pura, nunca guardada).
   Só as preferências do usuário (rotinas desligadas, rotinas entre áreas) vão para D.campos. */
import { AREAS, CHEFIA, SEP, ativas, coordDe, coordsDe, liderDe, nomeLimpo, type Campos, type Patch } from './cadeiras.ts';
import { COORDENACOES, lista } from './equipe.ts';

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

const ORDEM: Rotina['tipo'][] = ['plan', 'mensal', 'semanal', 'area', 'feedback'];
export type Elo = { tipo: Rotina['tipo']; ordem: number; titulo: string; freq: Freq; duracao: string; ids: string[]; cadeiras: number[] };

/** A cadeia: do ritual mais amplo ao mais restrito; só entram os elos que têm rotina. */
export function cadeia(rotinas: Rotina[]): Elo[] {
  return ORDEM.map((tipo, n) => {
    const rs = rotinas.filter((r) => r.tipo === tipo);
    if (!rs.length) return null;
    const dur = [...new Set(rs.map((r) => r.duracao))];
    return {
      tipo, ordem: n + 1, titulo: tipo === 'area' ? 'Reunião de área' : tipo === 'feedback' ? 'Feedback 1:1' : rs[0].titulo.split(' — ')[0],
      freq: rs[0].freq, duracao: dur.length === 1 ? dur[0] : dur.join(' ou '),
      ids: rs.map((r) => r.id), cadeiras: [...new Set(rs.flatMap((r) => r.participantes))].sort((a, b) => a - b),
    };
  }).filter((e): e is Elo => e !== null);
}

export const cadeirasDoElo = (rotinas: Rotina[], id: string): number[] =>
  rotinas.find((r) => r.id === id)?.participantes ?? [];

export const rotinasDaCadeira = (rotinas: Rotina[], i: number): Rotina[] =>
  rotinas.filter((r) => r.participantes.includes(i));

/* ---------- rotinas entre áreas (m2.x: JSON [{id,de,para,finalidade,freq,canal}]) ---------- */
export const CHAVE_ENTRE = 'm2.x';
const FREQS: Freq[] = ['Semanalmente', 'Mensalmente', 'Quadrimestralmente', 'Semestralmente'];
const CHEFIA_AREA = 'Chefia de área'; // a Chefia de gabinete é sempre ativa e pode ser ponta de uma rotina
export type EntreAreas = { de: string; para: string; finalidade: string; freq: Freq; canal: string };
type Guardada = EntreAreas & { id: string };

const guardadas = (c: Campos): Guardada[] => {
  try {
    const v = JSON.parse(c[CHAVE_ENTRE] ?? '[]');
    return Array.isArray(v) ? v.filter((x) => x && typeof x.id === 'string' && typeof x.de === 'string' && typeof x.para === 'string') : [];
  } catch { return []; }
};
const ativaArea = (c: Campos, a: string) => a === CHEFIA_AREA || coordsDe(c).includes(a);
const topoDe = (c: Campos, area: string): number => {
  if (area === CHEFIA_AREA) return CHEFIA;
  const gente = ativas(c).filter((i) => i !== CHEFIA && coordDe(c, i) === area);
  return gente.find((i) => { const l = liderDe(c, i); return l === null || coordDe(c, l) !== area; }) ?? gente[0] ?? CHEFIA;
};
const comoRotina = (c: Campos, g: Guardada): Rotina => {
  const participantes = [...new Set([topoDe(c, g.de), topoDe(c, g.para)])];
  return nova(c, { id: g.id, tipo: 'entre', titulo: `${g.de} → ${g.para}`, freq: g.freq, duracao: '', convoca: participantes[0], participantes, de: g.de, para: g.para, finalidade: g.finalidade, canal: g.canal });
};

/** Rotinas entre áreas cujas duas pontas estão ativas. */
export const rotinasEntreAreas = (c: Campos): Rotina[] =>
  guardadas(c).filter((g) => ativaArea(c, g.de) && ativaArea(c, g.para)).map((g) => comoRotina(c, g));
/** As que ficaram guardadas porque uma das áreas foi desmarcada; voltam ao remarcar. */
export const entreAreasArquivadas = (c: Campos): Rotina[] =>
  guardadas(c).filter((g) => !(ativaArea(c, g.de) && ativaArea(c, g.para))).map((g) => comoRotina(c, g));

export function criaEntreAreas(c: Campos, r: EntreAreas): { patch: Patch; erro?: string } {
  if (r.de === r.para) return { patch: {}, erro: 'Escolha duas áreas diferentes: a origem e o destino não podem ser a mesma área.' };
  if (!(COORDENACOES as readonly string[]).includes(r.de) || !(COORDENACOES as readonly string[]).includes(r.para)) return { patch: {}, erro: 'Área desconhecida.' };
  if (!FREQS.includes(r.freq)) return { patch: {}, erro: 'Escolha uma frequência da lista.' };
  const atuais = guardadas(c);
  const n = Math.max(0, ...atuais.map((g) => Number(g.id.replace(/\D/g, '')) || 0)) + 1;
  return { patch: { [CHAVE_ENTRE]: JSON.stringify([...atuais, { id: `x${n}`, ...r }]) } };
}

export const removeEntreAreas = (c: Campos, id: string): Patch => {
  const resto = guardadas(c).filter((g) => g.id !== id);
  return { [CHAVE_ENTRE]: resto.length ? JSON.stringify(resto) : '' };
};

/** Sugestões iniciais (conteúdo a validar com a Legisla): só quando as duas áreas estão ativas e o par ainda não existe. */
const SUGESTOES: EntreAreas[] = [
  { de: 'Legislativo', para: 'Comunicação', freq: 'Semanalmente', finalidade: 'Pauta da semana: o que tramita e o que vira comunicação', canal: 'Reunião curta entre as coordenações' },
  { de: 'Articulação de aliados', para: 'Legislativo', freq: 'Semanalmente', finalidade: 'Compromissos políticos que dependem de voto, emenda ou tramitação', canal: 'Reunião curta entre as coordenações' },
  { de: 'Mobilização de pessoas', para: 'Comunicação', freq: 'Mensalmente', finalidade: 'Agenda de base e território para cobertura e divulgação', canal: 'Reunião entre as lideranças' },
  { de: 'Secretariado', para: CHEFIA_AREA, freq: 'Semanalmente', finalidade: 'Agenda e prazos da semana do parlamentar', canal: 'Conversa com a Chefia de gabinete' },
];
export const sugestoesEntreAreas = (c: Campos): EntreAreas[] =>
  SUGESTOES.filter((s) => ativaArea(c, s.de) && ativaArea(c, s.para) && !guardadas(c).some((g) => g.de === s.de && g.para === s.para));
