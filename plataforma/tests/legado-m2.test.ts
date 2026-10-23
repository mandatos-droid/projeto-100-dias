import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/* m2.js é o arquivo de ganchos da Missão 2 sobre o Guia legado. Aqui ele roda numa "janela" com globais simuladas. */
const CODIGO = readFileSync(new URL('../public/legacy/m2.js', import.meta.url), 'utf8');

type Ex = { id: string; t: string; d: string; tipo: string; intro: string; itens?: { k: string; t: string }[] };
const ITENS = [{ k: 'm2.c1', t: 'Escopo de trabalho de cada cargo definido' }, { k: 'm2.c2', t: 'Organograma do mandato projetado visualmente' }, { k: 'm2.c3', t: 'Fluxos de trabalho e rotinas de comunicação estabelecidos' }];

function janela(extra: Record<string, unknown> = {}) {
  const ctx: Record<string, unknown> = {
    Comp: { funcoes: () => '<input data-k="m2.f1">' },
    MISSOES: [
      { n: 1, exercicios: [{ id: 'm1.q1', tipo: 'perguntas', intro: 'm1' }] },
      { n: 2, exercicios: [
        { id: 'm2.funcoes', t: 'A escalação do time', d: 'antigo', tipo: 'funcoes', intro: 'antigo, fale das bandeiras' },
        { id: 'm2.gestao', t: 'Organograma e rotinas', d: 'antigo', tipo: 'checklist', intro: 'antigo', itens: ITENS.map((i) => ({ ...i })) },
      ] },
    ],
    ...extra,
  };
  vm.createContext(ctx);
  vm.runInContext(CODIGO, ctx);
  return ctx as { Comp: { funcoes(): string }; MISSOES: { n: number; exercicios: Ex[] }[] } & Record<string, unknown>;
}
const ex = (w: ReturnType<typeof janela>, id: string) => w.MISSOES[1].exercicios.find((e) => e.id === id)!;

test('Comp.funcoes devolve só o contêiner da escalação, sem campos m2.f (MEQ-01, T-27)', () => {
  const w = janela();
  assert.equal(w.Comp.funcoes(), '<div class="ilha" data-ilha="equipe-escalacao"></div>');
  assert.equal(w.Comp.funcoes().includes('data-k="m2.f'), false);
});

test('o texto da escalação não fala de bandeira nem de escopo; o de m2.gestao traz organograma, rotinas e entrega nesta ordem (MEQ-01, MEQ-06, T-27)', () => {
  const w = janela();
  const f = ex(w, 'm2.funcoes'), g = ex(w, 'm2.gestao');
  assert.equal(/bandeira|escopo/i.test(f.intro + f.d), false);
  const a = g.intro.indexOf('data-ilha="organograma"'), b = g.intro.indexOf('data-ilha="rotinas"'), c = g.intro.indexOf('data-ilha="entrega"');
  assert.ok(a > 0 && b > a && c > b, `ordem das ilhas: ${a}, ${b}, ${c}`);
  assert.equal(g.intro.includes('data-ilha="recomenda-cargos"'), false);
});

test('o checklist m2.c1..c3 e os tipos dos exercícios continuam como no Guia original (MEQ-01, T-27)', () => {
  const w = janela();
  assert.equal(ex(w, 'm2.funcoes').tipo, 'funcoes');
  assert.equal(ex(w, 'm2.gestao').tipo, 'checklist');
  assert.deepEqual(ex(w, 'm2.gestao').itens, ITENS);
  assert.equal(w.MISSOES[0].exercicios[0].intro, 'm1'); // outras missões intactas
});
