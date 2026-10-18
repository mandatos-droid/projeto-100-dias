/* Agendas temáticas da pergunta "Qual é a conjuntura social do território?" (m1.q8) e os indicadores
   do IDSC-BR 2026 que alimentam o mapa.

   Os arquivos de public/data/social/ são gerados por scripts/build_social.py a partir da planilha do IDSC:
     catalogo.json   ODS e indicadores        idsc.json e ods-<n>.json   notas gerais
     <codigo>.json   nota de cada indicador   perfil/<uf>.json           perfil de cada município
   Cada arquivo de indicador tem o formato { unidade, ano?, uf: {GO: 51.0}, mun: {"5208707": 48.2} }.
   Toda nota vai de 0 a 100 e MAIOR = MELHOR (a planilha já traz os indicadores "quanto menos, melhor" invertidos).
   Para incluir outra base, basta gerar um arquivo nesse formato e listar o id numa agenda. */

export type Agenda = {
  id: string; rot: string; cor: string;
  ods: number[];      // ODS cujas notas e indicadores aparecem nesta agenda
  extras?: string[];  // indicadores avulsos de outros ODS
};

export const AGENDAS: Agenda[] = [
  { id: 'saude', rot: 'Saúde', cor: '#C93636', ods: [3] },
  { id: 'educacao', rot: 'Educação', cor: '#2F6FB5', ods: [4] },
  { id: 'seguranca', rot: 'Segurança pública', cor: '#4B3F72', ods: [16] },
  { id: 'moradia', rot: 'Moradia e saneamento', cor: '#8A5A2B', ods: [6, 7, 11] },
  { id: 'trabalho', rot: 'Trabalho e renda', cor: '#B87A00', ods: [8] },
  { id: 'assistencia', rot: 'Assistência social e fome', cor: '#A8346B', ods: [1, 2] },
  { id: 'meio-ambiente', rot: 'Meio ambiente e clima', cor: '#1B6B4F', ods: [12, 13, 14, 15] },
  { id: 'mobilidade', rot: 'Mobilidade e infraestrutura', cor: '#3E7C8C', ods: [9] },
  { id: 'campo', rot: 'Campo e agricultura familiar', cor: '#6E8B2F', ods: [], extras: ['SDG2_8_AGR_FAM', 'SDG2_9_AGR_ORG'] },
  { id: 'mulheres', rot: 'Mulheres', cor: '#BA3F9B', ods: [5] },
  { id: 'juventude', rot: 'Juventude', cor: '#E0701F', ods: [],
    extras: ['SDG8_7_P_JV_NENT', 'SDG8_4_T_DSC_JV', 'SDG4_17_JV_EM', 'SDG16_1_OB_HM', 'SDG5_3_M_JV_NENT', 'SDG3_8_GRV', 'SDG10_HM_JUV_NNN'] },
  { id: 'raca', rot: 'Igualdade racial e povos tradicionais', cor: '#5C3A21', ods: [10] },
  { id: 'cultura', rot: 'Cultura e esporte', cor: '#7A4FB0', ods: [], extras: ['SDG4_6_EQP_CUL'] },
];

/** ODS que cada agenda recebe quando a equipe registra um problema a partir de uma nota baixa. */
export const AGENDA_DO_ODS: Record<number, string> = Object.fromEntries(
  AGENDAS.flatMap((a) => a.ods.map((n) => [n, a.id] as const)));

export type OdsInfo = { n: number; rot: string };
export type IndInfo = { id: string; ods: number; nome: string; fonte: string; ano: string | null; sentido: string };
export type Catalogo = { fonte: string; url: string; ods: OdsInfo[]; indicadores: IndInfo[] };
export type DadosIndicador = { unidade?: string; ano?: string; uf?: Record<string, number>; mun?: Record<string, number> };
export type Perfil = Record<string, { n: string; p: number; i: number; v: string; r: number; o: (number | null)[] }>;

/** Faixas do IDSC-BR (0-100). Usadas para pintar o mapa e para a legenda. */
export const FAIXAS = [
  { de: 0, rot: 'Muito baixo', cor: '#B3261E' },
  { de: 40, rot: 'Baixo', cor: '#E8742A' },
  { de: 50, rot: 'Médio', cor: '#F2C230' },
  { de: 60, rot: 'Alto', cor: '#7FB069' },
  { de: 80, rot: 'Muito alto', cor: '#1B6B4F' },
];
export const faixaDe = (v: number) => [...FAIXAS].reverse().find((f) => v >= f.de) ?? FAIXAS[0];

export type OpcaoInd = { id: string; nome: string; grupo: string };

/** Indicadores oferecidos para a agenda escolhida (ou todos, agrupados por ODS, quando é "todas"). */
export function opcoesIndicador(cat: Catalogo | undefined, agenda: Agenda | null): OpcaoInd[] {
  const geral: OpcaoInd[] = [{ id: 'idsc', nome: 'IDSC-BR 2026 · nota geral', grupo: 'Nota geral' }];
  if (!cat) return geral;
  const odsNota = (n: number): OpcaoInd => ({ id: `ods-${n}`, nome: `ODS ${n} · ${cat.ods.find((o) => o.n === n)?.rot ?? ''} (nota)`, grupo: 'Notas por ODS' });
  const ind = (i: IndInfo): OpcaoInd => ({ id: i.id, nome: i.nome, grupo: `ODS ${i.ods} · ${cat.ods.find((o) => o.n === i.ods)?.rot ?? ''}` });
  if (!agenda) return [...geral, ...cat.ods.map((o) => odsNota(o.n)), ...cat.indicadores.map(ind)];
  const doOds = cat.indicadores.filter((i) => agenda.ods.includes(i.ods));
  const extras = (agenda.extras ?? []).map((id) => cat.indicadores.find((i) => i.id === id)).filter((i): i is IndInfo => !!i);
  return [
    ...agenda.ods.map(odsNota),
    ...doOds.map((i) => ({ ...ind(i), grupo: 'Indicadores da agenda' })),
    ...extras.map((i) => ({ ...ind(i), grupo: 'Indicadores da agenda' })),
    ...geral,
  ];
}

const cache = new Map<string, Promise<unknown>>();
function carrega<T>(url: string): Promise<T | null> {
  let p = cache.get(url) as Promise<T | null> | undefined;
  if (!p) {
    p = fetch(url).then((r) => (r.ok && /json/.test(r.headers.get('content-type') ?? '') ? (r.json() as Promise<T>) : null)).catch(() => null);
    cache.set(url, p);
  }
  return p;
}
export const carregaCatalogo = () => carrega<Catalogo>('/data/social/catalogo.json');
/** Lê a base de um indicador; devolve null se o arquivo não existir. */
export const carregaIndicador = (id: string) => carrega<DadosIndicador>(`/data/social/${id}.json`);
export const carregaPerfil = (uf: string) => carrega<Perfil>(`/data/social/perfil/${uf.toLowerCase()}.json`);
