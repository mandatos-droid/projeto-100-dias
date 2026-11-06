// Colunas reais de v_admin_uso_campos (a view já exclui mandatos arquivados;
// `arquivado_em` é opcional só para a função também servir a linhas vindas de v_admin_mandatos).
export interface LinhaUsoCampos {
  mandato_id: string; uf: string | null
  persona: boolean; conjuntura: boolean; municipio: boolean; eleitorado: boolean; social: boolean; cadeiras: boolean
  arquivado_em?: string | null
}

export interface LinhaUso { id: Campo; nome: string; mandatos: number; aberturas: number | null; tendencia: number[] | null }
type Campo = 'persona' | 'conjuntura' | 'municipio' | 'eleitorado' | 'social' | 'cadeiras';

// As 6 funcionalidades que têm um campo em `dados` provando o uso (Fase 1).
const FUNCIONALIDADES: { id: Campo; nome: string }[] = [
  { id: 'persona', nome: 'Persona' },
  { id: 'conjuntura', nome: 'Conjuntura' },
  { id: 'municipio', nome: 'Município' },
  { id: 'eleitorado', nome: 'Eleitorado' },
  { id: 'social', nome: 'Social' },
  { id: 'cadeiras', nome: 'Cadeiras e escalação' },
];

// Aberturas e tendência dependem do registro de uso (P3): sem ele ficam null e a tela mostra "—".
export function usoPorFuncionalidade(campos: LinhaUsoCampos[]): LinhaUso[] {
  const ativos = campos.filter((c) => !c.arquivado_em);
  return FUNCIONALIDADES.map(({ id, nome }) => ({
    id, nome, mandatos: ativos.filter((c) => c[id]).length, aberturas: null, tendencia: null,
  }));
}
