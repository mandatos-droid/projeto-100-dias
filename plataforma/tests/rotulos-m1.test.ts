import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';

/* Varredura de rótulos antigos da Missão 1: as categorias de relação passaram a "Aliado", "Oponente", "Indefinida"
   (LEG-11) e as casas a "Câmara Legislativa"/"Assembleia Legislativa", "Câmara dos Deputados" e "Senado" (LEG-02).
   O teste falha se um rótulo antigo ressurgir nas ilhas, em lib/relacoes.ts ou nos ganchos da Missão 1 (GER-01). */
const raiz = new URL('../', import.meta.url);
const ler = (rel: string) => readFileSync(new URL(rel, raiz), 'utf8');

/** Só as ilhas da Missão 1 (arquivos na raiz de ilhas/): as pastas capital/, equipe/ e rumo/ são de outras missões. */
const ILHAS_M1 = readdirSync(new URL('ilhas/', raiz)).filter((f) => /\.tsx?$/.test(f)).map((f) => `ilhas/${f}`);
const FONTES = [...ILHAS_M1, 'lib/relacoes.ts', 'public/legacy/m1.js', 'public/legacy/novos.js'];

test('nenhuma ilha da Missão 1, lib/relacoes.ts, m1.js ou novos.js usa "Opositor" ou "Potencial relacionamento" (LEG-11)', () => {
  const achados: string[] = [];
  for (const f of FONTES) {
    ler(f).split('\n').forEach((l, i) => {
      if (/opositor|potenciais? relacionamentos?/i.test(l)) achados.push(`${f}:${i + 1}: ${l.trim().slice(0, 90)}`);
    });
  }
  assert.deepEqual(achados, []);
});

test('nenhum rótulo das ilhas da Missão 1 diz só "Câmara": é "Câmara dos Deputados", "Câmara Legislativa" ou "Câmara Municipal" (LEG-02)', () => {
  const OK = /^Câmaras? (dos Deputados|Legislativa|Municipal|de vereadores)/;
  const achados: string[] = [];
  for (const f of [...ILHAS_M1, 'public/legacy/m1.js']) {
    ler(f).split('\n').forEach((l, i) => {
      for (const m of l.matchAll(/Câmaras?(?![\p{L}])/gu)) {
        if (!OK.test(l.slice(m.index))) achados.push(`${f}:${i + 1}: ${l.trim().slice(0, 90)}`);
      }
    });
  }
  assert.deepEqual(achados, []);
});

test('o texto montado das 4 etapas da Missão 1 não tem "Opositor", "Potencial relacionamento", "pontes" nem "Pergunta 1 de 1" (LEG-05, LEG-11, PAG-03)', () => {
  const ctx: Record<string, unknown> = { esc: (s: string) => String(s ?? ''), D: { campos: {}, frags: [] } };
  vm.createContext(ctx);
  vm.runInContext(`${ler('public/legacy/conteudo.js')};this.MISSOES=MISSOES;`, ctx);
  vm.runInContext(`${ler('public/legacy/guia.js')};this.Guia=Guia;this.Comp=Comp;`, ctx);
  vm.runInContext(ler('public/legacy/m1.js'), ctx);
  type Ex = { id: string; t: string; d?: string; intro?: string };
  const w = ctx as unknown as { MISSOES: { n: number; exercicios: Ex[] }[]; Comp: { perguntas(e: Ex): string; frag(e: Ex): string } };
  const textos = w.MISSOES[0].exercicios.map((e) => JSON.stringify(e) + (e.id === 'm1.frag' ? w.Comp.frag(e) : w.Comp.perguntas(e))).join('\n');
  assert.ok(textos.length > 2000); // renderizou de verdade
  const achados = textos.match(/Opositor|Potencial relacionamento|Potenciais relacionamentos|[Pp]ontes|Pergunta \d+ de \d+/g) ?? [];
  assert.deepEqual([...achados], []);
});
