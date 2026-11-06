import { diasParado } from './escala.ts';

// Colunas reais de v_admin_mandatos (migration 20261105130000).
export interface LinhaMandato {
  id: string; codigo: string; nome_parlamentar: string | null; cargo: string | null
  casa: string | null; uf: string | null; partido: string | null; data_posse: string | null
  resp_nome: string | null; resp_cargo: string | null
  criado_em: string; arquivado_em: string | null; membros: number
  ultima_atividade: string; exercicios_concluidos: number
}

export interface Filtros {
  busca?: string
  uf?: string
  casa?: string
  situacao?: 'ativos' | 'arquivados' // padrão: ativos (a lista padrão esconde os arquivados)
  paradoHa?: number | null
}

export const TAMANHO_PAGINA = 25;

export const semAcento = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '');
const chave = (s: string | null) => semAcento(s ?? '').toLowerCase();

// `agora` entra por parâmetro para o cálculo de "parado há" ser testável.
export function filtraMandatos(linhas: LinhaMandato[], f: Filtros, agora: Date): LinhaMandato[] {
  const busca = chave(f.busca ?? '').trim();
  const arquivados = f.situacao === 'arquivados';
  return linhas.filter((l) => {
    if ((l.arquivado_em !== null) !== arquivados) return false;
    if (f.uf && l.uf !== f.uf) return false;
    if (f.casa && l.casa !== f.casa) return false;
    if (busca && !chave(l.codigo).includes(busca) && !chave(l.nome_parlamentar).includes(busca)) return false;
    if (f.paradoHa != null && diasParado(l.ultima_atividade, agora) <= f.paradoHa) return false;
    return true;
  });
}

// Página 1-based. Com exatamente `tamanho` itens não nasce página extra; lista vazia tem 1 página.
export function paginaDe<T>(lista: T[], pagina: number, tamanho: number): { itens: T[]; total: number; paginas: number } {
  const total = lista.length;
  const paginas = Math.max(1, Math.ceil(total / tamanho));
  const p = Math.min(Math.max(1, pagina), paginas);
  return { itens: lista.slice((p - 1) * tamanho, p * tamanho), total, paginas };
}
