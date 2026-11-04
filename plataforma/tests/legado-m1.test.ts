import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/* m1.js é o arquivo de ganchos da Missão 1 sobre o Guia legado. Aqui ele roda sobre o conteudo.js e o guia.js reais,
   numa "janela" com as globais mínimas, para provar os textos e a ordem pedidos nas sugestões #16 a #23. */
const ler = (nome: string) => readFileSync(new URL(`../public/legacy/${nome}`, import.meta.url), 'utf8');
const CONTEUDO = ler('conteudo.js');
const GUIA = ler('guia.js');
const CODIGO = ler('m1.js');

type Item = { k: string; t: string; d: string; ilha?: string; caixas?: { k: string; rot: string }[] };
type Ex = { id: string; t: string; tipo: string; intro?: string; fim?: string; itens?: Item[] };
type Passo = { k: string; n?: number };
type Janela = {
  MISSOES: { n: number; exercicios: Ex[] }[];
  Guia: { m: unknown; ex: Ex; passos: Passo[]; montar(ex: Ex): Passo[]; bloco(p: Passo, n: number): string };
  Comp: { perguntas(ex: Ex): string };
};

function janela(): Janela {
  const ctx: Record<string, unknown> = {
    esc: (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
    D: { campos: {}, frags: [] },
  };
  vm.createContext(ctx);
  vm.runInContext(`${CONTEUDO};this.MISSOES=MISSOES;`, ctx);
  vm.runInContext(`${GUIA};this.Guia=Guia;this.Comp=Comp;`, ctx);
  vm.runInContext(CODIGO, ctx);
  return ctx as unknown as Janela;
}
const ex1 = (w: Janela, id: string) => w.MISSOES[0].exercicios.find((e) => e.id === id)!;
/** Abre o passo da pergunta `n` do exercício `id`, como o modo passo a passo faz. */
function pergunta(w: Janela, id: string, n: number) {
  const ex = ex1(w, id);
  w.Guia.m = w.MISSOES[0];
  w.Guia.ex = ex;
  return w.Guia.bloco({ k: 'pergunta', n }, 0);
}
const chaves = (h: string) => [...h.matchAll(/<textarea data-k="([^"]+)"/g)].map((m) => m[1]);

/* ---------- SUG-16: pergunta 3 da Persona ---------- */
test('m1.q3 mostra duas caixas, conquistas e próximo cargo, e não a caixa única antiga (SUG-16)', () => {
  const h = pergunta(janela(), 'm1.persona', 2);
  assert.deepEqual(chaves(h), ['m1.q3', 'm1.q3b']);
  assert.ok(h.includes('Elenque quais são as 4 principais conquistas e entregas que o mandato deseja ter alcançado antes do fim da legislatura?'));
  assert.ok(h.includes('Qual é o próximo cargo que a liderança parlamentar deseja ocupar?'));
});

test('as caixas de m1.q3 vêm depois do texto "Mapeie" (SUG-16)', () => {
  const h = pergunta(janela(), 'm1.persona', 2);
  assert.ok(h.indexOf('Mapeie') > 0 && h.indexOf('Mapeie') < h.indexOf('data-k="m1.q3"'));
  assert.equal(h.includes('<label class="campo"></label>'), false);
});

test('no modo "ver tudo" Comp.perguntas também traz as duas caixas de m1.q3 (SUG-16)', () => {
  const w = janela();
  const h = w.Comp.perguntas(ex1(w, 'm1.persona'));
  assert.deepEqual(chaves(h).filter((k) => k.startsWith('m1.q3')), ['m1.q3', 'm1.q3b']);
  assert.equal(chaves(h).filter((k) => k === 'm1.q3').length, 1);
});

test('perguntas sem caixas novas seguem com a caixa única (SUG-16)', () => {
  const h = pergunta(janela(), 'm1.persona', 0);
  assert.deepEqual(chaves(h), ['m1.q1']);
});
