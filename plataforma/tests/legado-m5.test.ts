import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/* m5.js é o arquivo de ganchos da Missão 5 sobre o Guia legado. Roda numa "janela" com globais simuladas;
   o conteudo.js real é lido para provar que os textos da Missão 5 não mudam (M5-10.1). */
const CODIGO = readFileSync(new URL('../public/legacy/m5.js', import.meta.url), 'utf8');
const CONTEUDO = readFileSync(new URL('../public/legacy/conteudo.js', import.meta.url), 'utf8');
const PAGINA = readFileSync(new URL('../app/guia/page.tsx', import.meta.url), 'utf8');

/* Hash do JSON inteiro da Missão 5 (agenda, resumo, fecho e exercícios), calculado sobre o conteudo.js de antes da feature. */
const HASH_TEXTOS = '88f4daa4ef189545ba9ad920b2e8a8214e8458cf47cbf9b17fbc00565665a1b9';

type Missao = Record<string, unknown> & { n: number; exercicios: { id: string }[] };

function guia(extra: Record<string, unknown> = {}) {
  const ctx: Record<string, unknown> = { ...extra };
  vm.createContext(ctx);
  vm.runInContext(`${CONTEUDO};this.MISSOES=MISSOES;`, ctx);
  return ctx as { MISSOES: Missao[] } & Record<string, unknown>;
}
const hashM5 = (missoes: Missao[]) => createHash('sha256').update(JSON.stringify(missoes.find((x) => x.n === 5))).digest('hex');

/* ---------- textos intocáveis (M5-10.1) ---------- */
test('os textos da Missão 5 do conteudo.js batem com o hash gravado antes dos ganchos (M5-10.1)', () => {
  assert.equal(hashM5(guia().MISSOES), HASH_TEXTOS);
});

test('carregar o m5.js não muda nenhum texto da Missão 5 (M5-10.1)', () => {
  const w = guia({ Comp: { monit: () => '<p>original</p>' }, esc: (s: string) => s });
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  assert.equal(hashM5(w.MISSOES), HASH_TEXTOS);
});

/* ---------- gancho do monitoramento ---------- */
function janela() {
  const w = guia({ Comp: { monit: () => '<table>tabela original</table>', outro: () => 'outro' } });
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  return w as unknown as { Comp: { monit(ex?: unknown): string; outro(): string } };
}

test('a tarefa de monitoramento mostra o botão "Abrir Planejamento Estratégico" que leva a #/plano (M5-10.2)', () => {
  const h = janela().Comp.monit({ id: 'm5.monit' });
  assert.match(h, /Abrir Planejamento Estratégico/);
  assert.match(h, /href="#\/plano"/);
});

test('o corpo original do monitoramento continua inteiro, sem alteração (M5-10.1)', () => {
  const h = janela().Comp.monit({ id: 'm5.monit' });
  assert.ok(h.includes('<table>tabela original</table>'));
});

test('o gancho não mexe nos outros componentes do Guia', () => {
  assert.equal(janela().Comp.outro(), 'outro');
});

test('m5.js sem o Comp do Guia carregado não quebra', () => {
  const ctx = vm.createContext({});
  assert.doesNotThrow(() => vm.runInContext(CODIGO, ctx));
});

/* ---------- ordem de carga ---------- */
test('m5.js é carregado depois de m3.js na página do Guia (M5-10)', () => {
  const lista = /const SCRIPTS = \[([^\]]*)\]/.exec(PAGINA)![1].replace(/['\s]/g, '').split(',');
  assert.ok(lista.includes('m5'));
  assert.ok(lista.indexOf('m5') > lista.indexOf('m3'));
});

/* ---------- gancho do feedback: a lista "feedbacks" vira a ilha rumo-feedback (M5-20.1) ---------- */
function janelaLista() {
  const w = guia({ Comp: { lista: (ex: { chave: string }, dono?: string) => `lista-original:${ex.chave}:${dono ?? ''}` } });
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  return w as unknown as { Comp: { lista(ex: unknown, dono?: string): string } };
}

test('o exercício m5.feedback (lista "feedbacks") passa a montar a ilha rumo-feedback (M5-20.1)', () => {
  const ex = guia().MISSOES.find((m) => m.n === 5)!.exercicios.find((e) => e.id === 'm5.feedback') as unknown as { chave: string };
  assert.equal(ex.chave, 'feedbacks');
  assert.match(janelaLista().Comp.lista(ex), /<div class="ilha" data-ilha="rumo-feedback"><\/div>/);
});

test('outras listas do Guia seguem pelo corpo original, com o dono (M5-20.1)', () => {
  assert.equal(janelaLista().Comp.lista({ chave: 'comissoes' }, 'dono'), 'lista-original:comissoes:dono');
});

test('a ilha rumo-feedback está registrada na ponte (M5-20.1)', () => {
  const ponte = readFileSync(new URL('../ilhas/ponte.tsx', import.meta.url), 'utf8');
  assert.match(ponte, /'rumo-feedback':\s*\(\)\s*=>\s*<Feedback\s*\/>/);
});

test('os campos antigos do exercício de feedback seguem em conteudo.js (M5-21.7)', () => {
  const ex = guia().MISSOES.find((m) => m.n === 5)!.exercicios.find((e) => e.id === 'm5.feedback') as unknown as { campos: { k: string }[] };
  assert.deepEqual([...ex.campos.map((c) => c.k)], ['pessoa', 'lider', 'data', 'pontos', 'encam']);
});
