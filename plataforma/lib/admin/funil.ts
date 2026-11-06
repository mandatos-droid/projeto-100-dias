// Colunas reais de v_admin_exercicios. `ordem` reinicia em cada missão (unique(missao, ordem)),
// então a ordem global do Guia é (missao, ordem). A view já exclui mandatos arquivados.
export interface LinhaExercicio { mandato_id: string; uf: string | null; exercicio: string; missao: number; ordem: number; ok: boolean }

export interface LinhaFunil { missao: number; concluiram: number; pct: number }
export interface LinhaTrava { exercicio: string; alcancaram: number; concluiram: number; abandono: number }

const MAX_TRAVAS = 10;
const pct = (parte: number, todo: number) => (todo ? Math.round((parte * 100) / todo) : 0);

// Exercícios únicos na ordem do Guia e, por mandato, o que está feito.
function organiza(linhas: LinhaExercicio[]) {
  const catalogo = new Map<string, { exercicio: string; missao: number; ordem: number }>();
  const feitos = new Map<string, Set<string>>();
  for (const l of linhas) {
    catalogo.set(l.exercicio, { exercicio: l.exercicio, missao: l.missao, ordem: l.ordem });
    const f = feitos.get(l.mandato_id) ?? feitos.set(l.mandato_id, new Set()).get(l.mandato_id)!;
    if (l.ok) f.add(l.exercicio);
  }
  const ordenados = [...catalogo.values()].sort((a, b) => a.missao - b.missao || a.ordem - b.ordem);
  return { ordenados, feitos: [...feitos.values()] };
}

// Missão concluída = todos os exercícios dela feitos (regra de public/painel.html).
export function funil(linhas: LinhaExercicio[]): LinhaFunil[] {
  const { ordenados, feitos } = organiza(linhas);
  const missoes = [...new Set(ordenados.map((e) => e.missao))];
  return missoes.map((missao) => {
    const ids = ordenados.filter((e) => e.missao === missao).map((e) => e.exercicio);
    const concluiram = feitos.filter((f) => ids.every((id) => f.has(id))).length;
    return { missao, concluiram, pct: pct(concluiram, feitos.length) };
  });
}

// Alcançou o exercício k = concluiu o anterior (o primeiro é de todos); "concluíram" conta só entre quem alcançou.
export function travas(linhas: LinhaExercicio[]): LinhaTrava[] {
  const { ordenados, feitos } = organiza(linhas);
  const saida: (LinhaTrava & { pos: number })[] = [];
  ordenados.forEach((e, pos) => {
    const anterior = pos === 0 ? null : ordenados[pos - 1].exercicio;
    const alcancaram = feitos.filter((f) => anterior === null || f.has(anterior));
    if (!alcancaram.length) return; // 0 alcançaram: sem linha
    const concluiram = alcancaram.filter((f) => f.has(e.exercicio)).length;
    saida.push({ exercicio: e.exercicio, alcancaram: alcancaram.length, concluiram, abandono: pct(alcancaram.length - concluiram, alcancaram.length), pos });
  });
  return saida
    .sort((a, b) => b.abandono - a.abandono || a.pos - b.pos)
    .slice(0, MAX_TRAVAS)
    .map(({ pos: _pos, ...linha }) => linha);
}
