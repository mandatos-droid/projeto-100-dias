/* Casa e catálogo de comissões usados pelas comissões da Missão 4. A lista de espaços da Missão 3 saiu (sugestão 33, Alana:
   comissões são tratadas só na Missão 4); D.comissoesDesejadas segue gravado e a Missão 4 o importa. */

export type Casa = 'federal' | 'estadual' | 'senado' | 'municipal';
export interface Comissao { nome: string; sigla?: string }
export interface Catalogo { gerado: string; fonte: string; comissoes: Comissao[] }

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

/** A Casa do cargo: Câmara para Deputado(a) Federal, Assembleia para Estadual/Distrital; sem Casa conhecida, null. */
export function casaDe(cargo: string): Casa | null {
  const n = norm(cargo);
  if (n.includes('federal')) return 'federal';
  if (n.includes('estadual') || n.includes('distrital')) return 'estadual';
  if (n.includes('senador')) return 'senado';
  if (n.includes('vereador')) return 'municipal';
  return null;
}
