import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/* m4.js é o arquivo de ganchos da Missão 4 sobre o Guia legado. Aqui ele roda numa "janela" com globais simuladas,
   e o conteudo.js real é lido para provar que os textos do Guia não mudam (CAP-21.9, CAP-40). */
const CODIGO = readFileSync(new URL('../public/legacy/m4.js', import.meta.url), 'utf8');
const CONTEUDO = readFileSync(new URL('../public/legacy/conteudo.js', import.meta.url), 'utf8');

/* Hashes do conteudo.js de antes da feature: o JSON inteiro da Missão 4 (t, d, intro, fim, entrega, itens, campos...) e o BINGOS (frentes e ações). */
const HASH_MISSAO4 = 'd852535b0589a45fffc49b8e4a822aec61a6f6df42d838789c2fd7533de0412c';
const HASH_BINGOS = '970fc89d9dc694913ad47b3d3a7d867152d3181be54eec13605a165aac54cbd7';

type Ex = Record<string, unknown> & { id: string; t: string; d: string; intro?: string; fim?: string; tipo: string };
type Missao = Record<string, unknown> & { n: number; entrega: string[]; exercicios: Ex[] };
type Janela = { MISSOES: Missao[]; BINGOS: Record<string, unknown> } & Record<string, unknown>;

function guia(extra: Record<string, unknown> = {}) {
  const ctx: Record<string, unknown> = { ...extra };
  vm.createContext(ctx);
  vm.runInContext(`${CONTEUDO};this.MISSOES=MISSOES;this.BINGOS=BINGOS;`, ctx);
  return ctx as Janela;
}
const sha = (o: unknown) => createHash('sha256').update(JSON.stringify(o)).digest('hex');
const hashMissao4 = (w: Janela) => sha(w.MISSOES.find((x) => x.n === 4));
const ex4 = (w: Janela, id: string) => w.MISSOES.find((m) => m.n === 4)!.exercicios.find((e) => e.id === id)!;

/* ---------- textos intocáveis (CAP-21.9, CAP-40) ---------- */
test('os textos da Missão 4 do conteudo.js batem com o hash gravado antes dos ganchos (CAP-21.9)', () => {
  assert.equal(hashMissao4(guia()), HASH_MISSAO4);
});

test('os bingos (frentes e ações recomendadas) batem com o hash gravado (CAP-10, CAP-40)', () => {
  assert.equal(sha(guia().BINGOS), HASH_BINGOS);
});

test('alterar um caractere de qualquer texto da Missão 4 muda o hash e o teste falharia (CAP-21.9)', () => {
  const w = guia();
  const m = w.MISSOES.find((x) => x.n === 4)!;
  const alvos: [string, () => string, (v: string) => void][] = [
    ['titulo do exercício t', () => m.exercicios[0].t, (v) => { m.exercicios[0].t = v; }],
    ['d', () => m.exercicios[1].d, (v) => { m.exercicios[1].d = v; }],
    ['intro', () => m.exercicios[0].intro!, (v) => { m.exercicios[0].intro = v; }],
    ['fim', () => m.exercicios[0].fim!, (v) => { m.exercicios[0].fim = v; }],
    ['entrega', () => m.entrega[0], (v) => { m.entrega[0] = v; }],
  ];
  for (const [nome, ler, gravar] of alvos) {
    const original = ler();
    gravar(original + '.');
    assert.notEqual(hashMissao4(w), HASH_MISSAO4, nome);
    gravar(original);
    assert.equal(hashMissao4(w), HASH_MISSAO4, `${nome} restaurado`);
  }
  const b = guia();
  (b.BINGOS.articulacao as { itens: string[] }).itens[0] += '.';
  assert.notEqual(sha(b.BINGOS), HASH_BINGOS, 'bingos');
});

test('carregar o m4.js não muda nenhum texto da Missão 4 nem os bingos (CAP-21.9, CAP-40)', () => {
  const w = guia({ Comp: { lista: () => '', bingo: () => '', checklist: () => '' } });
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  assert.equal(hashMissao4(w), HASH_MISSAO4);
  assert.equal(sha(w.BINGOS), HASH_BINGOS);
});

/* ---------- ganchos: um por exercício, o resto passa direto (CAP-40) ---------- */
function janela() {
  const ctx = { Comp: { lista: (l: { chave: string }) => `original:lista:${l.chave}`, bingo: () => 'original:bingo', checklist: (e: { id: string }) => `original:checklist:${e.id}` } };
  const w = guia(ctx);
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  return w as Janela & { Comp: { lista(e: unknown, dono?: string): string; bingo(e: unknown): string; checklist(e: unknown): string } };
}

test('m4.comissoes abre a ilha capital-comissoes; outras listas do Guia passam direto', () => {
  const w = janela();
  const ex = ex4(w, 'm4.comissoes') as Ex & { chave: string };
  assert.equal(ex.tipo, 'lista');
  assert.equal(w.Comp.lista(ex), '<div class="ilha" data-ilha="capital-comissoes"></div>');
  assert.equal(w.Comp.lista({ chave: 'comissoesDesejadas' }, 'm3.bandeiras'), 'original:lista:comissoesDesejadas');
});

test('m4.acoes abre a ilha capital-acoes', () => {
  const w = janela();
  const ex = ex4(w, 'm4.acoes');
  assert.equal(ex.tipo, 'bingo');
  assert.equal(w.Comp.bingo(ex), '<div class="ilha" data-ilha="capital-acoes"></div>');
});

test('m4.metricas abre a ilha capital-comunicacao; outros checklists passam direto', () => {
  const w = janela();
  const ex = ex4(w, 'm4.metricas');
  assert.equal(ex.tipo, 'checklist');
  assert.equal(w.Comp.checklist(ex), '<div class="ilha" data-ilha="capital-comunicacao"></div>');
  assert.equal(w.Comp.checklist({ id: 'm2.outro' }), 'original:checklist:m2.outro');
});

test('carregar o m4.js sem Comp (outras janelas de teste) não falha', () => {
  const w = guia();
  assert.doesNotThrow(() => vm.runInContext(CODIGO, w as unknown as vm.Context));
});

/* ---------- Resumo e Missão 5 leem os dados novos sem quebrar os antigos (CAP-40, CAP-21) ---------- */
const RESUMO = readFileSync(new URL('../public/legacy/resumo.js', import.meta.url), 'utf8');
type ResumoJ = { ex(ex: unknown): string; sem: string };
/** Janela com conteudo.js + resumo.js reais; `comM4` carrega o m4.js por cima, como na página. */
function janelaResumo(D: Record<string, unknown>, comM4: boolean) {
  const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const ctx: Record<string, unknown> = { D, esc, rich: esc, estadoEx: () => 'ok', ResumoIlhas: undefined, CAMPOS_MONIT: [], PREDITORES: [], CARGOS_EQUIPE: [] };
  vm.createContext(ctx);
  vm.runInContext(`${CONTEUDO};this.MISSOES=MISSOES;this.BINGOS=BINGOS;`, ctx);
  vm.runInContext(`${RESUMO};this.Resumo=Resumo;`, ctx);
  if (comM4) vm.runInContext(CODIGO, ctx);
  return ctx as unknown as Janela & { Resumo: ResumoJ };
}
const html = (w: Janela & { Resumo: ResumoJ }, id: string) => w.Resumo.ex(ex4(w, id));
const ANTIGO = {
  campos: { 'm4.k1': true, 'm4.k3': true },
  comissoes: [{ id: 'c1', prio: 'Saúde', esp: 'Comissão de Saúde', pq: 'Onde tramitam as propostas', papel: 'Titular', mov: 'Pedir a vaga' }],
  acoes: [
    { id: 'a1', bingo: 'articulacao', i: 0, titulo: 'Primeira ação', alcancar: 'Alcançar X', resp: 'Ana', prazo: 'até 20/03', saber: 'Ata', prox: 'Ligar' },
    { id: 'a2', bingo: 'articulacao', i: 1, titulo: 'Segunda ação', resp: '', prazo: '' },
  ],
};

test('dados antigos da Missão 4: o Resumo fica idêntico ao do Guia sem o m4.js (sem perda)', () => {
  for (const id of ['m4.comissoes', 'm4.acoes', 'm4.metricas']) {
    assert.equal(html(janelaResumo(ANTIGO, true), id), html(janelaResumo(ANTIGO, false), id), id);
  }
  assert.match(html(janelaResumo(ANTIGO, true), 'm4.acoes'), /Prazo: até 20\/03/);
});

test('mandato sem nenhum dado da Missão 4 abre o Resumo sem erro e com "não preenchido"', () => {
  const w = janelaResumo({ campos: {} }, true);
  for (const id of ['m4.comissoes', 'm4.acoes', 'm4.metricas']) assert.doesNotThrow(() => html(w, id), id);
  assert.match(html(w, 'm4.acoes'), /não preenchido/);
  assert.doesNotMatch(html(w, 'm4.metricas'), /Acompanhamento semanal/);
});

test('Resumo: comissões mostram o texto legível de motivo, papel e movimento', () => {
  const D = { campos: {}, comissoes: [{ id: 'c1', sigla: 'CSAUDE', prio: 'Saúde', esp: 'Comissão de Saúde', pq: 'Combina com a bandeira', papel: 'Titular', mov: 'Pedir a vaga ao líder' }] };
  const h = html(janelaResumo(D, true), 'm4.comissoes');
  for (const t of ['Comissão de Saúde', 'Combina com a bandeira', 'Titular', 'Pedir a vaga ao líder']) assert.ok(h.includes(t), t);
});

test('Resumo: prazo novo AAAA-MM-DD aparece como DD/MM/AAAA, em qualquer ano e dia; data inválida fica como veio', () => {
  const D = { campos: {}, acoes: [
    { id: 'a1', bingo: 'articulacao', i: 0, titulo: 'T1', resp: 'Ana', prazo: '2027-03-08' },
    { id: 'a2', bingo: 'articulacao', i: 1, titulo: 'T2', prazo: '2026-12-31' },
    { id: 'a3', bingo: 'articulacao', i: 2, titulo: 'T3', prazo: '2026-1-5' },
  ] };
  const h = html(janelaResumo(D, true), 'm4.acoes');
  assert.match(h, /Responsável: Ana · Prazo: 08\/03\/2027/);
  assert.match(h, /Prazo: 31\/12\/2026/);
  assert.match(h, /Prazo: 2026-1-5/);
  assert.doesNotMatch(h, /2027-03-08/);
});

test('Resumo: mostra o último registro de cada seção da comunicação, com a semana, sem aparecer ao Resumo antigo', () => {
  const D = { campos: {}, comunicacao: { semanas: {
    '2026-W44': { k1: { seguidores: 900, alcance: 10 }, k2: { comentarios: 3 } },
    '2026-W46': { k1: { seguidores: 1000, novos: 12 } },
    '2026-W45': { k5: { aparicoes: 0 } },
  }, clipping: [] } };
  const h = html(janelaResumo(D, true), 'm4.metricas');
  assert.match(h, /Acompanhamento semanal/);
  assert.match(h, /Alcance e crescimento da comunidade<\/strong> \(2026-W46\): Seguidores \(total\) 1000 · Novos seguidores na semana 12/);
  assert.doesNotMatch(h, /900/);
  assert.match(h, /Compartilhamentos, comentários e respostas<\/strong> \(2026-W44\): Comentários recebidos 3/);
  assert.match(h, /\(2026-W45\): Aparições na imprensa 0/);
  assert.doesNotMatch(h, /Mensagens recebidas e encaminhadas<\/strong>/);
  assert.doesNotMatch(html(janelaResumo(D, false), 'm4.metricas'), /Acompanhamento semanal/);
});

test('Resumo: D.comunicacao corrompida (texto, lista, números ruins) não quebra nada', () => {
  for (const ruim of ['x', 5, [], { semanas: 'x' }, { semanas: { 'lixo': {}, '2026-W44': 'x', '2026-W45': { k1: 'x', k2: { comentarios: 'a', respostas: NaN } } } }]) {
    const h = html(janelaResumo({ campos: {}, comunicacao: ruim }, true), 'm4.metricas');
    assert.doesNotMatch(h, /Acompanhamento semanal/);
  }
});

test('os rótulos das seções no m4.js são os mesmos de lib/comunicacao.ts (não divergem)', async () => {
  const { SECOES } = await import('../lib/comunicacao.ts');
  const D = { campos: {}, comunicacao: { semanas: { '2026-W44': Object.fromEntries(SECOES.map((s) => [s.id, Object.fromEntries(s.campos.map((c, i) => [c.id, i + 1]))])) }, clipping: [] } };
  const h = html(janelaResumo(D, true), 'm4.metricas');
  for (const s of SECOES) {
    assert.ok(h.includes(`<strong>${s.titulo}</strong>`), s.titulo);
    s.campos.forEach((c, i) => assert.ok(h.includes(`${c.rot} ${i + 1}`), c.rot));
  }
});