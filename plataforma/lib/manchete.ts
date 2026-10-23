/* Missão 3 · Legado: cargos postuláveis, composição da manchete, modelos e avisos. Funções puras.
   As opções de cargo e os modelos são inferência nossa (os 4 exemplos do Guia servem de base), não texto do Guia. */
import type { ElementosLegado, ModeloId } from './rumo.ts';

export const AVISO_SEM_CARGO = 'A manchete ainda não diz o cargo postulado';
export const AVISO_LONGA = 'Manchetes curtas funcionam melhor';
export const LIMITE_MANCHETE = 280;

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\(a\)/g, '').replace(/\s+/g, ' ').trim();
const espaco = (s: string) => s.replace(/\s+/g, ' ').trim();

const COMPLETA = ['Deputado(a) Estadual', 'Deputado(a) Federal', 'Senador(a)', 'Vice-governador(a)', 'Governador(a)', 'Vice-presidente', 'Presidente', 'Prefeito(a)', 'Vice-prefeito(a)', 'Vereador(a)', 'Outro'];
const POR_CARGO: { casa: string; opcoes: string[] }[] = [
  { casa: 'deputado estadual', opcoes: ['Reeleição a Deputado(a) Estadual', 'Deputado(a) Federal', 'Senador(a)', 'Vice-governador(a)', 'Governador(a)', 'Prefeito(a)', 'Outro'] },
  { casa: 'deputado federal', opcoes: ['Reeleição a Deputado(a) Federal', 'Senador(a)', 'Vice-governador(a)', 'Governador(a)', 'Prefeito(a)', 'Outro'] },
  { casa: 'senador', opcoes: ['Reeleição ao Senado', 'Governador(a)', 'Vice-presidente', 'Presidente', 'Outro'] },
  { casa: 'vereador', opcoes: ['Reeleição a Vereador(a)', 'Prefeito(a)', 'Vice-prefeito(a)', 'Deputado(a) Estadual', 'Deputado(a) Federal', 'Outro'] },
];

/** Cargos que o mandato pode postular em quatro anos, a partir do cargo atual; a reeleição vem primeiro. Sem cargo conhecido, a lista completa. */
export function cargosPostulaveis(cargoAtual: string): string[] {
  const n = norm(cargoAtual).replace(/(deputad|senador|vereador)a\b/g, '$1o');
  const achado = POR_CARGO.find((c) => n.includes(c.casa));
  return [...(achado ? achado.opcoes : COMPLETA)];
}

const cargoFinal = (el: ElementosLegado) => (el.cargo === 'Outro' ? (el.cargoOutro ?? '').trim() : el.cargo.trim());
const ehReeleicao = (cargo: string) => norm(cargo).startsWith('reeleicao');

/** Manchete composta pelos 4 elementos. O protagonista vazio cai no nome do mandato; elemento vazio some sem deixar resto. */
export function compoe(el: ElementosLegado, ctx: { nome: string; bandeiras: string[] }): string {
  const prot = espaco(el.protagonista) || espaco(ctx.nome);
  const cargo = espaco(cargoFinal(el));
  const tail = !cargo ? '' : ehReeleicao(cargo) ? `conquista a ${cargo.charAt(0).toLowerCase()}${cargo.slice(1)}` : `se candidata a ${cargo}`;
  const partes = [espaco(el.entrega), espaco(el.resultado), tail].filter(Boolean);
  const corpo = partes.length > 1 ? `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}` : (partes[0] ?? '');
  return prot && corpo ? `${prot}: ${corpo}` : prot || corpo;
}

// ---------- cargo na manchete ----------

const PALAVRAS: { cargo: string; chaves: string[] }[] = [
  { cargo: 'vice-governador', chaves: ['vice-governador', 'vice governador'] },
  { cargo: 'governador', chaves: ['governador', 'governo do estado', 'governo estadual'] },
  { cargo: 'vice-presidente', chaves: ['vice-president', 'vice president', 'vice-presidenc'] },
  { cargo: 'presidente', chaves: ['president', 'presidenc'] },
  { cargo: 'senador', chaves: ['senador', 'senado'] },
  { cargo: 'deputado federal', chaves: ['deputado federal', 'camara dos deputados', 'camara federal'] },
  { cargo: 'deputado estadual', chaves: ['deputado estadual', 'assembleia'] },
  { cargo: 'vice-prefeito', chaves: ['vice-prefeit', 'vice prefeit'] },
  { cargo: 'prefeito', chaves: ['prefeit'] },
  { cargo: 'vereador', chaves: ['vereador', 'camara municipal'] },
];
const REELEICAO = ['reeleicao', 'reeleg', 'reeleit'];

/** A manchete diz o cargo? Ignora acento, caixa e "(a)"; reconhece o nome da Casa ("Senado", "Governo do Estado"). */
export function mencionaCargo(texto: string, cargo: string): boolean {
  const t = norm(texto);
  const c = norm(cargo);
  if (!c) return true;
  const reeleicao = c.startsWith('reeleicao');
  const alvo = c.replace(/^reeleicao (a|ao|de|do|da)? ?/, '').trim() || c;
  const conhecido = PALAVRAS.find((p) => alvo === p.cargo || alvo === p.cargo.replace('-', ' ') || (p.cargo === 'senador' && alvo === 'senado'));
  const chaves = conhecido ? [...conhecido.chaves, ...(reeleicao ? REELEICAO : [])] : [alvo, ...(reeleicao ? REELEICAO : [])];
  return chaves.some((k) => t.includes(k));
}

/** Avisos que não bloqueiam a gravação. Sem manchete ou sem cargo escolhido, não há o que avisar sobre o cargo. */
export function avisos(texto: string, cargo: string): string[] {
  const lista: string[] = [];
  if (texto.trim() && cargo.trim() && !mencionaCargo(texto, cargo)) lista.push(AVISO_SEM_CARGO);
  if (texto.length > LIMITE_MANCHETE) lista.push(AVISO_LONGA);
  return lista;
}

// ---------- modelos ----------

/** Modelo com lacunas. `{b1}` e `{b2}` viram as bandeiras prioritárias. */
export interface Modelo { id: ModeloId; rot: string; sugestao: true; entrega: string; resultado: string; cargo: 'reeleicao' | string }

export const MODELOS: Modelo[] = [
  { id: 'reeleicao', rot: 'Reeleição', sugestao: true, entrega: 'liderou a agenda de {b1}', resultado: 'foi a mais votada da região', cargo: 'reeleicao' },
  { id: 'outro-cargo', rot: 'Candidatura a outro cargo', sugestao: true, entrega: 'provou, ainda no mandato, que {b1} e {b2} caminham juntas', resultado: 'com resultados verificáveis para o território', cargo: 'Governador(a)' },
  { id: 'camara-senado', rot: 'Da Câmara ao Senado', sugestao: true, entrega: 'aprovou o projeto de lei que fortaleceu {b1}', resultado: 'tornando-se referência nacional na pauta', cargo: 'Senador(a)' },
  { id: 'entrega', rot: 'Entrega legislativa', sugestao: true, entrega: 'colocou {b1} no centro do debate político', resultado: 'solucionando um problema concreto do território', cargo: '' },
];

const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Pré-preenche os 4 elementos do passo a passo; cada um segue editável. Sem bandeira prioritária, a lacuna vira "a pauta prioritária". */
export function aplicaModelo(m: Modelo, ctx: { nome: string; bandeiras: string[]; cargoAtual?: string }): ElementosLegado {
  const b = (i: number) => (ctx.bandeiras[i] ? minuscula(ctx.bandeiras[i]) : i === 0 ? 'a pauta prioritária' : 'a segunda pauta');
  const preenche = (t: string) => t.replace('{b1}', b(0)).replace('{b2}', ctx.bandeiras[1] ? b(1) : 'o território');
  const cargo = m.cargo === 'reeleicao' ? (cargosPostulaveis(ctx.cargoAtual ?? '').find(ehReeleicao) ?? '') : m.cargo;
  return { protagonista: ctx.nome, entrega: preenche(m.entrega), resultado: preenche(m.resultado), cargo };
}

// ---------- data da edição ----------

/** "dezembro de {ano da posse + 3}"; sem data de posse válida, "ao fim da legislatura". */
export function dataEdicao(dataPosse?: string): string {
  const ano = /^(\d{4})-/.exec(dataPosse ?? '')?.[1];
  return ano ? `dezembro de ${Number(ano) + 3}` : 'ao fim da legislatura';
}
