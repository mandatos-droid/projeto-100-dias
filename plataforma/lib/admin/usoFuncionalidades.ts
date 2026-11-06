import { partesBrasilia } from './escala.ts';

// Colunas reais de v_admin_uso_campos (a view já exclui mandatos arquivados;
// `arquivado_em` é opcional só para a função também servir a linhas vindas de v_admin_mandatos).
export interface LinhaUsoCampos {
  mandato_id: string; uf: string | null
  persona: boolean; conjuntura: boolean; municipio: boolean; eleitorado: boolean; social: boolean; cadeiras: boolean
  arquivado_em?: string | null
}

// Colunas reais de v_admin_uso; `dia` vem como 'YYYY-MM-DD' já no fuso de Brasília.
export interface LinhaUsoDia { dia: string; mandato_id: string; uf: string | null; funcionalidade: string; qtd: number }
export interface DiaUso { dia: string; total: number }

export interface LinhaUso { id: Campo | 'organograma'; nome: string; mandatos: number; aberturas: number | null; tendencia: number[] | null }
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

// Passa a existir com o registro de uso (P3): não tem campo em `dados`, só abertura registrada.
// O id é o mesmo que lib/uso.ts grava em uso_funcionalidades.funcionalidade.
const SO_REGISTRO = { id: 'organograma' as const, nome: 'Organograma e rotinas' };

const DIA_MS = 86400000;
const SEMANAS = 5;
const DIAS_GRAFICO = 14;

// Dia de calendário de Brasília como número corrido de dias, para somar e comparar sem Date local.
const numeroDoDia = (d: Date) => { const p = partesBrasilia(d); return Date.UTC(p.ano, p.mes - 1, p.dia) / DIA_MS; };
const numeroDe = (dia: string) => Date.UTC(Number(dia.slice(0, 4)), Number(dia.slice(5, 7)) - 1, Number(dia.slice(8, 10))) / DIA_MS;
const rotuloDe = (n: number) => new Date(n * DIA_MS).toISOString().slice(0, 10);

// Sem `uso` (ou com a lista vazia, que é registro ainda não ativo) aberturas e tendência ficam null e a tela mostra "—".
// Com `uso`: aberturas = soma de `qtd` nos últimos `periodo` dias de calendário (hoje incluído); tendência = aberturas por
// semana (blocos de 7 dias terminando hoje) nas últimas 5 semanas, da mais antiga para a atual.
export function usoPorFuncionalidade(
  campos: LinhaUsoCampos[], uso?: LinhaUsoDia[], agora: Date = new Date(), periodo = 30,
): LinhaUso[] {
  const ativos = campos.filter((c) => !c.arquivado_em);
  const base: LinhaUso[] = FUNCIONALIDADES.map(({ id, nome }) => ({
    id, nome, mandatos: ativos.filter((c) => c[id]).length, aberturas: null, tendencia: null,
  }));
  if (!uso || uso.length === 0) return base;

  const hoje = numeroDoDia(agora);
  const linhas = [...base, { ...SO_REGISTRO, mandatos: 0, aberturas: null, tendencia: null }];
  return linhas.map((l) => {
    const dele = uso.filter((u) => u.funcionalidade === l.id);
    let aberturas = 0;
    const tendencia = new Array<number>(SEMANAS).fill(0);
    for (const u of dele) {
      const idade = hoje - numeroDe(u.dia); // 0 = hoje
      if (idade < 0) continue; // dia no futuro: ignora
      if (idade < periodo) aberturas += u.qtd;
      const semana = Math.floor(idade / 7);
      if (semana < SEMANAS) tendencia[SEMANAS - 1 - semana] += u.qtd;
    }
    const mandatos = l.id === 'organograma' ? new Set(dele.map((u) => u.mandato_id)).size : l.mandatos;
    return { ...l, mandatos, aberturas, tendencia };
  });
}

// Total de aberturas de todas as funcionalidades nos últimos 14 dias (hoje incluído), do mais antigo para hoje.
export function usoPorDia(uso: LinhaUsoDia[], agora: Date = new Date()): DiaUso[] {
  const hoje = numeroDoDia(agora);
  const total = new Map<number, number>();
  for (const u of uso) total.set(numeroDe(u.dia), (total.get(numeroDe(u.dia)) ?? 0) + u.qtd);
  return Array.from({ length: DIAS_GRAFICO }, (_, k) => {
    const n = hoje - (DIAS_GRAFICO - 1 - k);
    return { dia: rotuloDe(n), total: total.get(n) ?? 0 };
  });
}
