/* Missão 2 · quadro-modelo de 5 rotinas do mandato (função pura sobre D.campos).
   O texto do modelo vem da Legisla; o mandato guarda só as edições em m2.rq (JSON por rotina), nunca o quadro inteiro. */
import { type Campos, type Patch } from './cadeiras.ts';
import { linhas } from './tabelaEquipe.ts';

export const CHAVE_RQ = 'm2.rq';
export type RotinaId = 'plan' | 'mensal' | 'semanal' | 'area' | 'feedback';
export type RotinaQ = {
  id: RotinaId; titulo: string; freq: string; quem: string; dur: string;
  /** rotina ligada; desligada sai da contagem, do planejamento e do PDF */
  on: boolean;
  /** AAAA-MM-DD */
  data?: string;
  /** HH:MM */
  hora?: string;
};
type Edicao = Partial<Pick<RotinaQ, 'freq' | 'quem' | 'dur' | 'on' | 'data' | 'hora'>>;

export const MODELO: Omit<RotinaQ, 'on' | 'data' | 'hora'>[] = [
  { id: 'plan', titulo: 'Planejamento estratégico', freq: 'Quadrimestralmente', quem: 'Todos', dur: '2 períodos de 6h' },
  { id: 'mensal', titulo: 'Monitoramento de avanços do trabalho previsto para o mês (acompanhamento de metas)', freq: 'Mensalmente', quem: 'Todos', dur: '1h' },
  { id: 'semanal', titulo: 'Alinhamento de atualização coletiva e expectativas do trabalho da semana', freq: 'Semanalmente', quem: 'Todos', dur: '1h' },
  { id: 'area', titulo: 'Reunião de distribuição de trabalho dentro de cada área', freq: 'Semanalmente', quem: 'Assessores e Coordenação de uma área específica', dur: '45 min' },
  { id: 'feedback', titulo: 'Reunião de feedback estruturado individual', freq: 'Semestralmente', quem: 'Liderança e Assessores (individualmente)', dur: '30 min por reunião' },
];

const dataOk = (d?: string): d is string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d ?? '');
  if (!m) return false;
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return dt.getFullYear() === Number(m[1]) && dt.getMonth() === Number(m[2]) - 1 && dt.getDate() === Number(m[3]);
};
const horaOk = (h?: string): h is string => /^([01]\d|2[0-3]):[0-5]\d$/.test(h ?? '');

/** As edições gravadas, por id. JSON inválido ou fora do formato vale como "sem edições". */
function lerEdicoes(c: Campos): Record<string, Record<string, unknown>> {
  try {
    const j = JSON.parse(c[CHAVE_RQ] ?? '');
    if (j === null || typeof j !== 'object' || Array.isArray(j)) return {};
    return Object.fromEntries(Object.entries(j).filter(([, v]) => v !== null && typeof v === 'object' && !Array.isArray(v))) as Record<string, Record<string, unknown>>;
  } catch { return {}; }
}

const texto = (v: unknown, padrao: string) => (typeof v === 'string' && v.trim() !== '' ? v : padrao);

/** O quadro do mandato: o modelo com as edições por cima. Campo de tipo errado é ignorado. */
export function lerQuadro(c: Campos): RotinaQ[] {
  const ed = lerEdicoes(c);
  return MODELO.map((m) => {
    const e = ed[m.id] ?? {};
    return {
      ...m,
      freq: texto(e.freq, m.freq), quem: texto(e.quem, m.quem), dur: texto(e.dur, m.dur),
      on: typeof e.on === 'boolean' ? e.on : true,
      data: typeof e.data === 'string' && e.data !== '' ? e.data : undefined,
      hora: typeof e.hora === 'string' && e.hora !== '' ? e.hora : undefined,
    };
  });
}

/** Grava só os campos dados da rotina `id`; '' volta o campo ao modelo; as outras rotinas ficam como estão. */
export function editaRotina(c: Campos, id: string, parcial: Edicao): Patch {
  if (!MODELO.some((m) => m.id === id)) return {};
  const todas = lerEdicoes(c);
  const nova: Record<string, unknown> = { ...(todas[id] ?? {}) };
  (Object.keys(parcial) as (keyof Edicao)[]).forEach((k) => {
    const v = parcial[k];
    if (v === undefined || v === '') delete nova[k]; else nova[k] = v;
  });
  if (Object.keys(nova).length) todas[id] = nova; else delete todas[id];
  return { [CHAVE_RQ]: Object.keys(todas).length ? JSON.stringify(todas) : '' };
}

const ligadas = (c: Campos) => lerQuadro(c).filter((r) => r.on);

/** "X de N agendadas": N = rotinas ligadas; X = as que têm data e hora válidas. */
export function agendadas(c: Campos): { n: number; total: number } {
  const l = ligadas(c);
  return { n: l.filter((r) => dataOk(r.data) && horaOk(r.hora)).length, total: l.length };
}

/** Todas as rotinas ligadas têm data e hora (e há ao menos uma ligada). */
export function concluida(c: Campos): boolean {
  const { n, total } = agendadas(c);
  return total > 0 && n === total;
}

/** Só informação para o aviso "a data já passou"; nunca bloqueia. `data` é AAAA-MM-DD; hoje não é passado. */
export function dataPassada(data: string, hoje: Date = new Date()): boolean {
  if (!dataOk(data)) return false;
  const h = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  return data < h;
}

/** Áreas das linhas da tabela de equipe, na ordem das linhas, sem repetir e sem o rótulo da Chefia. */
export function areasDoMandato(c: Campos): string[] {
  return [...new Set(linhas(c).filter((l) => l.cat !== 'Chefia' && l.area !== '' && l.area !== 'Chefia de área').map((l) => l.area))];
}
