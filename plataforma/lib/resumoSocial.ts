import type { ItemSoc, NivelSoc } from './types.ts';

/* Problemas e potencialidades por território, para a tabela do Resumo (RES-08): uma linha por território, com os itens
   separados por tipo. Um item com vários nomes aparece em uma linha por nome. */
export type LinhaTerritorio = {
  territorio: string;
  nivel: NivelSoc;
  problemas: ItemSoc[];
  potencialidades: ItemSoc[];
};

const ORDEM_NIVEL: Record<NivelSoc, number> = { BR: 0, UF: 1, MUN: 2 };

/** Rótulos do território de um item: "Brasil" no nível nacional; um por nome nos demais ("Campinas (SP)" no município). */
function territorios(it: ItemSoc): string[] {
  if (it.nivel === 'BR') return ['Brasil'];
  const nomes = (it.nomes ?? []).map((n) => String(n ?? '').trim()).filter(Boolean);
  const rotulos = it.nivel === 'MUN' && it.uf ? nomes.map((n) => `${n} (${it.uf})`) : nomes;
  return [...new Set(rotulos)];
}

/** Agrupa por território: Brasil, depois UFs, depois municípios; alfabética pt-BR (com acento) dentro de UFs e de municípios. */
export function porTerritorio(itens: ItemSoc[]): LinhaTerritorio[] {
  const mapa = new Map<string, LinhaTerritorio>();
  for (const it of itens ?? []) {
    for (const t of territorios(it)) {
      const chave = `${it.nivel}|${t}`;
      let linha = mapa.get(chave);
      if (!linha) mapa.set(chave, (linha = { territorio: t, nivel: it.nivel, problemas: [], potencialidades: [] }));
      (it.tipo === 'problema' ? linha.problemas : linha.potencialidades).push(it);
    }
  }
  return [...mapa.values()].sort((a, b) => ORDEM_NIVEL[a.nivel] - ORDEM_NIVEL[b.nivel] || a.territorio.localeCompare(b.territorio, 'pt-BR'));
}
