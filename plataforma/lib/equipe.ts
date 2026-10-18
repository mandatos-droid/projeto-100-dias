/* Missão 2 · listas de seleção e padrões da "Planilha de Gestão de Pessoas e Organograma" (Legisla, maio/2026).
   Os valores vêm das validações de dados da planilha original. */

export const COORDENACOES = ['Comunicação', 'Mobilização de pessoas', 'Legislativo', 'Chefia de área', 'Articulação de aliados', 'Secretariado', 'Logística'] as const;
export const COR_COORD: Record<string, string> = {
  Comunicação: '#BA6BED', 'Mobilização de pessoas': '#4ABFB2', Legislativo: '#035252', 'Chefia de área': '#571730',
  'Articulação de aliados': '#EB5454', Secretariado: '#A55415', Logística: '#5E524C',
};
export const HABILIDADES = ['Organização', 'Cordialidade', 'Liderança', 'Persuasão', 'Análise crítica', 'Responsabilidade', 'Resolutividade', 'Comprometimento', 'Trânsito político', 'Proatividade', 'Perfeccionismo', 'Tato social', 'Observação', 'Visão sistêmica', 'Empatia', 'Adaptabilidade', 'Criatividade', 'Articulação e diálogo'];
export const RITMOS = ['Adequado', 'Lento', 'Apressado'];
export const RELACIONAL = ['Bom', 'Questão pontual', 'Questão recorrente'];

/* escopo de trabalho / repertório técnico (itens da planilha, sem repetições) */
export const ESCOPOS = [
  'Definir a estratégia de comunicação: posicionamento, cronograma e gestão de crises',
  'Produzir conteúdo editorial para redes sociais, site, e-mail marketing e relatórios',
  'Gerenciar assessoria de imprensa: coletar releases, responder jornalistas e monitorar clipping',
  'Redigir discursos oficiais, artigos de opinião e materiais de debate parlamentar',
  'Criar vídeos institucionais e peças gráficas (posts, infográficos, banners)',
  'Elaborar propostas legislativas: projetos de lei, emendas, requerimentos e indicações',
  'Apoiar o processo de apresentação e negociação de emendas parlamentares orçamentárias',
  'Articular politicamente com parlamentares, representantes do poder executivo e outras lideranças institucionais',
  'Representar o mandato em fóruns, conselhos e reuniões estratégicas com organizações parceiras',
  'Preparar orientação de voto para comissões e plenário',
  'Atuar como especialista de pauta (Meio Ambiente, Educação, Saúde etc.), pesquisando dados e jurisprudência',
  'Gerir a aquisição de passagens aéreas e registrar o uso da cota parlamentar',
  'Organizar o transporte do parlamentar entre compromissos institucionais',
  'Recepcionar e encaminhar demandas da população ao responsável interno adequado',
  'Agendar compromissos do parlamentar e validar solicitações de audiência',
  'Atuar como secretariado executivo: receber e orientar convidados e visitas ao gabinete',
  'Contratar e organizar compra de materiais de escritório e pagamento de contas',
  'Mobilizar apoiadores, voluntários e potenciais eleitores para ações de campanha e base',
  'Manter o relacionamento partidário: coordenar contatos e alinhamento de direção política',
  'Realizar atividades de fiscalização de políticas públicas do Executivo',
  'Elaborar o planejamento da sua área',
  'Coordenar a equipe: distribuir tarefas, acompanhar prazos e avaliar desempenho',
  'Acompanhar a execução e o aperfeiçoamento de processos internos',
  'Promover reuniões de alinhamento entre áreas (Comunicação, Jurídico, Logística etc.)',
  'Desenvolver relatórios periódicos de atividades e resultados para prestar contas ao parlamentar',
];

/* padrões sugeridos para os 20 cargos de CARGOS_EQUIPE (mesma ordem): coordenação e liderança imediata (índice) */
export const PADRAO: { coord: string; lider: number | null }[] = [
  { coord: 'Chefia de área', lider: null },            // 0 Chefia de gabinete
  { coord: 'Legislativo', lider: 0 },                  // 1 Coord. Legislativo
  { coord: 'Legislativo', lider: 1 }, { coord: 'Legislativo', lider: 1 }, { coord: 'Legislativo', lider: 1 },
  { coord: 'Legislativo', lider: 1 }, { coord: 'Legislativo', lider: 1 },
  { coord: 'Comunicação', lider: 0 },                  // 7 Coord. Comunicação
  { coord: 'Comunicação', lider: 7 }, { coord: 'Comunicação', lider: 7 }, { coord: 'Comunicação', lider: 7 },
  { coord: 'Articulação de aliados', lider: 0 },       // 11 Coord. Articulação e Mobilização
  { coord: 'Articulação de aliados', lider: 11 },
  { coord: 'Mobilização de pessoas', lider: 11 },      // 13 Líder de mobilização
  { coord: 'Mobilização de pessoas', lider: 13 }, { coord: 'Mobilização de pessoas', lider: 13 }, { coord: 'Mobilização de pessoas', lider: 13 },
  { coord: 'Secretariado', lider: 0 },                 // 17 Coord. Administrativa
  { coord: 'Secretariado', lider: 17 },
  { coord: 'Logística', lider: 17 },
];

export const CAMPOS_FICHA = ['nome_cargo', 'coord', 'lider', 'escopo', 'espec', 'hab_dest', 'hab_dev', 'rep_dest', 'rep_dev', 'ritmo', 'rel', 'entrega', 'fb_falei', 'fb_ouvi', 'fb_dev'] as const;
export type CampoFicha = (typeof CAMPOS_FICHA)[number];

export const SEP = '|';
export const lista = (v?: string) => (v ? v.split(SEP).filter(Boolean) : []);
export const chaveNome = (i: number) => `m2.f${i + 1}`;
export const chaveFicha = (i: number, c: CampoFicha) => `m2.p${i + 1}.${c}`;
