import type { Mun, PartidoVotos } from '@/lib/types';

/** Cargos e níveis de cadeira compartilhados pela Conjuntura e pelo Resumo. */
type Cargo = { id: string; ano: 2026 | 2024; rot: string; pega: (m: Mun) => { v: number; p: PartidoVotos } | undefined };
export const CARGOS: Cargo[] = [
  { id: 'estadual', ano: 2026, rot: 'Deputado estadual/distrital', pega: (m) => m.estadual },
  { id: 'federal', ano: 2026, rot: 'Deputado federal', pega: (m) => m.federal },
  { id: 'senador', ano: 2026, rot: 'Senador', pega: (m) => m.senador },
  { id: 'governador', ano: 2026, rot: 'Governador (1º turno)', pega: (m) => m.governador },
  { id: 'presidente', ano: 2026, rot: 'Presidente (1º turno)', pega: (m) => m.presidente },
  { id: 'pref', ano: 2024, rot: 'Prefeito (1º turno)', pega: (m) => m.m24?.pref },
  { id: 'ver', ano: 2024, rot: 'Vereador', pega: (m) => m.m24?.ver },
];
export const NIVEIS = [
  { k: 'federal', rot: 'Câmara dos Deputados' },
  { k: 'senado', rot: 'Senado' },
  { k: 'estadual', rot: 'Assembleia Legislativa' },
  { k: 'prefeitos', rot: 'Prefeituras (2024)' },
  { k: 'vereadores', rot: 'Câmaras de vereadores (2024)' },
];
