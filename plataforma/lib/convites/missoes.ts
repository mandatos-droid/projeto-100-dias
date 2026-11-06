export interface ExercicioCatalogo { id: string; missao: number; ordem: number; titulo?: string }
export type StatusMissao = 'Concluída' | 'Em andamento' | 'A fazer';

// Missão concluída = todos os exercícios dela feitos (mesma regra de lib/admin/funil.ts).
// `feitos` é dados.feitos do mandato: {idDoExercicio: true}; só `true` conta (como no banco).
export function statusMissoes(
  feitos: Record<string, boolean> | null | undefined,
  catalogo: ExercicioCatalogo[],
): { missao: number; status: StatusMissao }[] {
  const porMissao = new Map<number, string[]>();
  for (const e of [...catalogo].sort((a, b) => a.missao - b.missao || a.ordem - b.ordem)) {
    (porMissao.get(e.missao) ?? porMissao.set(e.missao, []).get(e.missao)!).push(e.id);
  }
  return [...porMissao].map(([missao, ids]) => {
    const feitosNaMissao = ids.filter((id) => feitos?.[id] === true).length;
    const status: StatusMissao = feitosNaMissao === ids.length ? 'Concluída' : feitosNaMissao > 0 ? 'Em andamento' : 'A fazer';
    return { missao, status };
  });
}
