/* Registro de expectativas do eleitorado (pergunta 3.1 da Missão 1): 3 colunas, sem município.
   Regras puras; a ilha só chama e grava em D.eleitorado.itens pela ponte (AD-004). */
import { semAcento } from './format.ts';
import type { ItemEl, TipoEl } from './types.ts';

export type Coluna = { k: TipoEl; titulo: string; rotuloForm: string; exemplo: string; cor: string; tags: boolean };

/** Colunas na ordem da tela; `tags` diz se o formulário oferece as sugestões de grupo (ELE-02 a ELE-04). */
export const COLUNAS: Coluna[] = [
  { k: 'promessa', titulo: 'Promessas de Campanha', rotuloForm: 'Adicionar: promessa', exemplo: 'Ex.: Ampliar o transporte escolar rural', cor: '#571730', tags: false },
  { k: 'apoio', titulo: 'Grupos que Apoiaram', rotuloForm: 'Adicionar: grupo que apoiou', exemplo: 'Ex.: Professoras da rede municipal', cor: '#1B6B4F', tags: true },
  { k: 'potencial', titulo: 'Grupos com Potencial', rotuloForm: 'Adicionar: grupo com potencial', exemplo: 'Ex.: Jovens de 16 a 24 anos', cor: '#B87A00', tags: true },
];

/** As 16 tags de sugestão, na ordem da tela de hoje. */
export const GRUPOS: string[] = ['Mulheres', 'Jovens', 'Pessoas idosas', 'Pessoas negras', 'Povos indígenas', 'LGBTQIA+', 'Pessoas com deficiência', 'Servidores públicos', 'Professores', 'Evangélicos', 'Católicos', 'Agricultura familiar', 'Empreendedores e MEI', 'Estudantes', 'Moradores da periferia', 'Trabalhadores de aplicativo'];

/** Acrescenta no fim da lista, com o texto aparado e `muns: []`. Texto em branco = `vazio`; igual a outro do mesmo tipo
 *  (sem acento e sem maiúscula) = `repetido`; nos dois casos a lista volta como entrou. */
export function adiciona(itens: ItemEl[], tipo: TipoEl, texto: string, id: string): { itens: ItemEl[]; erro?: 'vazio' | 'repetido' } {
  const v = texto.trim();
  if (!v) return { itens, erro: 'vazio' };
  if (itens.some((i) => i.tipo === tipo && semAcento(i.texto.trim()) === semAcento(v))) return { itens, erro: 'repetido' };
  return { itens: [...itens, { id, tipo, texto: v, muns: [] }] };
}

export const remove = (itens: ItemEl[], id: string): ItemEl[] => itens.filter((i) => i.id !== id);
