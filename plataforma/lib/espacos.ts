/* Missão 3 · espaços que o mandato pretende compor (comissões e outros). Funções puras: o catálogo de comissões
   chega pronto (a ilha o busca em public/data/comissoes/{br|uf}.json); sem catálogo, as sugestões são genéricas por bandeira.
   Os nomes genéricos e as palavras-chave são inferência nossa, não texto do Guia. */
import { BANDEIRAS, bandeiraDe, bandeiraDoRotulo } from './bandeiras.ts';

export type Casa = 'federal' | 'estadual' | 'senado' | 'municipal';
export const TIPOS_ESPACO: { id: string; rot: string; casas: Casa[] }[] = [
  { id: 'titular', rot: 'Titular de comissão', casas: ['federal', 'estadual', 'senado', 'municipal'] },
  { id: 'suplente', rot: 'Suplente de comissão', casas: ['federal', 'estadual', 'senado', 'municipal'] },
  { id: 'presidencia', rot: 'Presidência ou vice-presidência de comissão', casas: ['federal', 'estadual', 'senado', 'municipal'] },
  { id: 'relatoria', rot: 'Relatoria', casas: ['federal', 'estadual', 'senado', 'municipal'] },
  { id: 'mesa', rot: 'Mesa Diretora', casas: ['federal', 'estadual', 'senado', 'municipal'] },
  { id: 'lideranca', rot: 'Liderança de partido, bloco ou bancada', casas: ['federal', 'estadual', 'senado', 'municipal'] },
  { id: 'frente', rot: 'Frente Parlamentar', casas: ['federal', 'estadual', 'senado', 'municipal'] },
  { id: 'cpi', rot: 'CPI', casas: ['federal', 'estadual', 'senado', 'municipal'] },
  { id: 'cpmi', rot: 'CPMI (Comissão Parlamentar Mista de Inquérito)', casas: ['federal', 'senado'] },
  { id: 'conselho', rot: 'Conselho ou colegiado', casas: ['federal', 'estadual', 'senado', 'municipal'] },
  { id: 'outro', rot: 'Outro espaço', casas: ['federal', 'estadual', 'senado', 'municipal'] },
];
export const PAPEIS = ['Titular', 'Suplente', 'Presidência', 'Vice-presidência', 'Relatoria', 'Outro'];

/** Nomes genéricos de comissão por bandeira (id da taxonomia). */
export const TEMAS_POR_BANDEIRA: Record<string, string[]> = {
  'seguranca': ['Comissão de Segurança Pública'],
  'educacao': ['Comissão de Educação'],
  'agricultura': ['Comissão de Agricultura e Pecuária'],
  'saude': ['Comissão de Saúde'],
  'direitos-humanos': ['Comissão de Direitos Humanos'],
  'desenvolvimento-economico': ['Comissão de Desenvolvimento Econômico'],
  'cultura': ['Comissão de Cultura'],
  'clima': ['Comissão de Meio Ambiente'],
  'mulheres': ['Comissão de Defesa dos Direitos da Mulher'],
  'equidade-racial': ['Comissão de Igualdade Racial'],
  'trabalho': ['Comissão de Trabalho'],
  'modernizacao': ['Comissão de Administração e Serviço Público'],
  'industria': ['Comissão de Indústria, Comércio e Serviços'],
  'esportes': ['Comissão do Esporte'],
  'ciencia': ['Comissão de Ciência, Tecnologia e Inovação'],
  'lazer': ['Comissão de Turismo'],
  'mineracao': ['Comissão de Minas e Energia'],
  'assistencia': ['Comissão de Assistência Social'],
  'lgbtqiap': ['Comissão de Diversidade e Direitos Humanos'],
};

/** Trechos (sem acento, minúsculos) que ligam o nome de uma comissão a uma bandeira. */
const CHAVES: Record<string, string[]> = {
  'seguranca': ['seguranca publica'], 'educacao': ['educacao'], 'agricultura': ['agricultura'], 'saude': ['saude'],
  'direitos-humanos': ['direitos humanos'], 'desenvolvimento-economico': ['desenvolvimento economico'], 'cultura': ['cultura'],
  'clima': ['meio ambiente', 'clima'], 'mulheres': ['mulher'], 'equidade-racial': ['igualdade racial'], 'trabalho': ['trabalho'],
  'modernizacao': ['modernizacao', 'servico publico'], 'industria': ['industria'], 'esportes': ['esporte', 'desporto'],
  'ciencia': ['ciencia'], 'lazer': ['lazer', 'turismo'], 'mineracao': ['minas e energia', 'mineracao'],
  'assistencia': ['assistencia social'], 'lgbtqiap': ['diversidade', 'lgbt'],
};

export const ALERTA_ESPACO = 'Este espaço não conversa com as agendas prioritárias';

export interface Comissao { nome: string; sigla?: string }
export interface Catalogo { gerado: string; fonte: string; comissoes: Comissao[] }
export interface Sugestao { nome: string; sigla?: string; bandeira?: string; destacada: boolean; origem: 'catalogo' | 'generica' }
/** Registro de D.comissoesDesejadas (registros antigos não têm `papel`). */
export interface Espaco { comissao?: string; cargo?: string; bandeira?: string; papel?: string }

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const txt = (v: unknown) => (typeof v === 'string' ? v : '');

/** Chave de comparação de uma bandeira: id da taxonomia (por id ou rótulo) ou o texto normalizado. */
const chave = (s: string) => bandeiraDe(s)?.id ?? bandeiraDoRotulo(s)?.id ?? norm(s);
/** Ids das bandeiras cujo tema aparece no nome da comissão. */
const temasDoNome = (nome: string) => { const n = norm(nome); return BANDEIRAS.filter((b) => CHAVES[b.id].some((k) => n.includes(k))).map((b) => b.id); };
/** Bandeira do espaço: a escrita no campo; sem ela, a inferida pelo nome da comissão. */
const bandeiraDoEspaco = (e: Espaco): string[] => {
  const b = txt(e?.bandeira).trim();
  return b ? [chave(b)] : temasDoNome(txt(e?.comissao));
};

/** Sugestões de espaço. Com catálogo (Câmara ou da UF), as comissões dele; sem, nomes genéricos das bandeiras prioritárias.
 *  `bandeiras` são os ids das prioritárias, na ordem. */
export function sugestoes(ctx: { cargo: string; uf: string; bandeiras: string[] }, catalogo?: Catalogo | null): Sugestao[] {
  const prioritarias = ctx.bandeiras.filter((b) => bandeiraDe(b));
  if (Array.isArray(catalogo?.comissoes) && catalogo!.comissoes.length) {
    const lista = catalogo!.comissoes.map((c): Sugestao => {
      const temas = temasDoNome(c.nome);
      const dela = temas.find((t) => prioritarias.includes(t));
      return { nome: c.nome, ...(c.sigla ? { sigla: c.sigla } : {}), ...((dela ?? temas[0]) ? { bandeira: dela ?? temas[0] } : {}), destacada: dela !== undefined, origem: 'catalogo' };
    });
    return [...lista.filter((s) => s.destacada), ...lista.filter((s) => !s.destacada)];
  }
  const vistos = new Set<string>();
  return prioritarias.flatMap((b) => TEMAS_POR_BANDEIRA[b].filter((nome) => !vistos.has(nome) && vistos.add(nome))
    .map((nome): Sugestao => ({ nome, bandeira: b, destacada: true, origem: 'generica' })));
}

/** Alerta (sem bloquear) quando o espaço não atende nenhuma bandeira prioritária; null se atende ou se ainda não há prioritárias. */
export function alerta(espaco: Espaco, prioritarias: string[]): string | null {
  if (!prioritarias.length) return null;
  const chaves = new Set(prioritarias.map(chave));
  return bandeiraDoEspaco(espaco).some((b) => chaves.has(b)) ? null : ALERTA_ESPACO;
}

/** Dica do Guia (concentrar esforços na titularidade da principal bandeira): vale enquanto nenhum espaço aponta a prioritária 1. */
export function faltaBandeira1(espacos: Espaco[], prioritarias: string[]): boolean {
  if (!prioritarias.length) return false;
  const primeira = chave(prioritarias[0]);
  return !espacos.some((e) => bandeiraDoEspaco(e).includes(primeira));
}
