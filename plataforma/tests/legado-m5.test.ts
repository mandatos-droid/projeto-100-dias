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
const HASH_TEXTOS = '3800b1f3de8cc148918f003b16128e6788facaa527017da52858d58362938240';

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

/* ---------- monitoramento conforme a Alana: uma caixa por meta e por mês (MON-01, MON-03, MON-04) ---------- */
import { BOTAO_MONIT, MONIT_INTRO, MONIT_PERGUNTAS, MONIT_ROTULO } from '../ilhas/rumo/textosAlana.ts';

type Meta = { id: string; pred?: string; texto?: string; resp?: string; status?: string; sucessos?: { status: string }[] };
function monit(metas: Meta[], campos: Record<string, string> = {}, foco?: string) {
  const janela: Record<string, unknown> = { MonitFoco: foco };
  const w = guia({
    Comp: { monit: () => '<table>tabela original</table>', outro: () => 'outro' },
    D: { metas, campos },
    esc: (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'),
    rich: (s: string) => s,
    window: janela,
  });
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  const c = w as unknown as { Comp: { monit(ex?: unknown): string; outro(): string }; CAMPOS_MONIT: string[][] };
  return { html: c.Comp.monit({ id: 'm5.monit' }), campos: c.CAMPOS_MONIT, janela, w: c };
}
const META = (id: string, extra: Partial<Meta> = {}): Meta => ({ id, texto: `texto ${id}`, resp: 'Ana', status: 'nao_concluida', ...extra });

test('depois do m5.js o Guia tem um único campo de monitoramento, "det" (MON-04, AD-2)', () => {
  const { campos } = monit([]);
  assert.deepEqual([...campos.map((c) => c[0])], ['det']);
});

test('a tarefa de monitoramento mostra o texto #129 e o botão "Abrir Planejamento Estratégico" que leva a #/plano (MON-01.1, MON-01.2)', () => {
  const { html } = monit([META('m1')]);
  for (const p of MONIT_INTRO) assert.ok(html.includes(p), p);
  assert.match(html, /<a class="bt pri" href="#\/plano">Abrir Planejamento Estratégico<\/a>/);
});

test('o monitoramento não traz mais a tabela nem os 6 campos antigos (MON-03.1)', () => {
  const { html } = monit([META('m1')]);
  assert.ok(!html.includes('tabela original'));
  assert.ok(!/data-k="mon\.m1\.\d\.(sucesso|result|pct|desafios|oport|read)"/.test(html));
});

test('cada meta tem 3 caixas, uma por mês, com o rótulo e as perguntas da #128 (MON-03.1)', () => {
  const { html } = monit([META('m1'), META('m2')]);
  for (const id of ['m1', 'm2']) for (const mes of [1, 2, 3]) assert.ok(html.includes(`data-k="mon.${id}.${mes}.det"`), `${id} mês ${mes}`);
  assert.ok(!html.includes('data-k="mon.m1.4.det"'));
  assert.equal(html.split(MONIT_ROTULO).length - 1, 6);
  for (const q of MONIT_PERGUNTAS) assert.equal(html.split(q).length - 1, 6, q);
});

test('o cartão da meta mostra o número, o objetivo estratégico dela, o texto e o responsável (MON-03.1)', () => {
  const { html } = monit([META('m1', { pred: 'p1', texto: 'Aprovar 2 projetos', resp: 'Carla Dias' })], { 'm3.obj.p1': 'Priorizar a educação' });
  assert.match(html, /<span class="idx">Meta 01 · Priorizar a educação<\/span>/);
  assert.ok(html.includes('Aprovar 2 projetos'));
  assert.ok(html.includes('Responsável: Carla Dias'));
});

test('meta sem objetivo mostra só o número (MON-03.1)', () => {
  assert.match(monit([META('m1')]).html, /<span class="idx">Meta 01<\/span>/);
});

test('o cartão da meta mostra o atingimento registrado no Planejamento, com o link "alterar" (MON-03.3)', () => {
  const { html } = monit([META('m1', { status: 'concluida60' })]);
  assert.match(html, /data-status="concluida60"/);
  assert.match(html, /Concluída 60%/);
  assert.match(html, /<small>60%<\/small>/);
  assert.match(html, /href="#\/plano"[^>]*>alterar<\/a>/);
});

test('meta com sucessos mostra atingidos sobre o total e meta congelada mostra "—" (MON-03.3)', () => {
  const com = monit([META('m1', { sucessos: [{ status: 'concluida' }, { status: 'nao_concluida' }, { status: 'congelada' }] })]).html;
  assert.match(com, /<small>50%<\/small>/);
  const cong = monit([META('m2', { status: 'congelada' })]).html;
  assert.match(cong, /<small>—<\/small>/);
});

test('sem metas o monitoramento mostra o aviso e ainda assim o botão do Planejamento (MON-03.4)', () => {
  const { html } = monit([]);
  assert.match(html, /As metas da Missão 3 aparecem aqui assim que forem escritas\./);
  assert.match(html, /href="#\/plano"/);
});

test('a caixa com texto abre o mês; as vazias ficam fechadas (MON-03.2)', () => {
  const { html } = monit([META('m1')], { 'mon.m1.2.det': 'andou bem' });
  assert.match(html, /<details open[^>]*data-mes="2"/);
  assert.match(html, /<details(?! open)[^>]*data-mes="1"/);
});

test('com MonitFoco de uma meta existente, só o cartão dela sai marcado e aberto; id inexistente é ignorado (MON-02.2)', () => {
  const a = monit([META('m1'), META('m2')], {}, 'm2');
  assert.equal(a.html.split('data-foco').length - 1, 1);
  assert.match(a.html, /data-meta="m2"[^>]*data-foco/);
  assert.equal(a.janela.MonitFoco, undefined, 'o foco é consumido');
  const b = monit([META('m1')], {}, 'inexistente');
  assert.ok(!b.html.includes('data-foco'));
});

test('os textos do m5.js são os mesmos de textosAlana.ts (sem divergência entre o legado e as ilhas)', () => {
  const ilhas = [...MONIT_INTRO, ...MONIT_PERGUNTAS, MONIT_ROTULO];
  for (const t of ilhas) assert.ok(CODIGO.includes(t), t);
  assert.ok(BOTAO_MONIT.length > 0);
});

test('o gancho não mexe nos outros componentes do Guia', () => {
  assert.equal(monit([]).w.Comp.outro(), 'outro');
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

/* ---------- botão de novo planejamento (M5-31.1, M5-31.2) ---------- */
const ILHA_NOVO = '<div class="ilha" data-ilha="rumo-novociclo"></div>';
function janelaCiclo() {
  const tela = { html: '<h1>Planejamento</h1>', insertAdjacentHTML(_p: string, h: string) { this.html += h; } };
  const ligadas: string[] = [];
  const janela: { Ilhas: { ligar(t: typeof tela): void } } = { Ilhas: { ligar: (t) => ligadas.push(t.html) } };
  const w = guia({
    Comp: { checklist: (ex: { id: string }) => `<checklist-original ${ex.id}>` },
    /* o original do Guia monta a tela e religa as ilhas (como em m3.js) */
    Telas: { plano: () => { tela.html = '<h1>Planejamento</h1><div data-ilha="plano"></div>'; janela.Ilhas.ligar(tela); } },
    document: { getElementById: (id: string) => (id === 'tela' ? tela : null) },
    window: janela,
  });
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  return { w: w as unknown as { Comp: { checklist(ex: unknown): string }; Telas: { plano(): void }; MISSOES: Missao[] }, tela, ligadas };
}

test('a tarefa "Calibragem e replanejamento" mostra o checklist original e, ao final, o botão de novo planejamento (M5-31.1)', () => {
  const h = janelaCiclo().w.Comp.checklist({ id: 'm5.imersao' });
  assert.ok(h.startsWith('<checklist-original m5.imersao>'));
  assert.ok(h.endsWith(ILHA_NOVO));
});

test('outros checklists do Guia ficam como estavam (M5-31.1)', () => {
  assert.equal(janelaCiclo().w.Comp.checklist({ id: 'm1.outro' }), '<checklist-original m1.outro>');
});

test('o exercício m5.imersao segue com os itens do checklist em conteudo.js e o hash dos textos não muda (M5-31.1)', () => {
  const { w } = janelaCiclo();
  const ex = w.MISSOES.find((m) => m.n === 5)!.exercicios.find((e) => e.id === 'm5.imersao') as unknown as { itens: unknown[]; tipo: string };
  assert.equal(ex.tipo, 'checklist');
  assert.equal(ex.itens.length, 9);
  assert.equal(hashM5(w.MISSOES), HASH_TEXTOS);
});

test('a aba Planejamento mostra o botão de novo planejamento depois da árvore, com uma só ligação das ilhas (M5-31.2)', () => {
  const { w, tela, ligadas } = janelaCiclo();
  w.Telas.plano();
  assert.match(tela.html, /data-ilha="plano"/);
  assert.ok(tela.html.endsWith(ILHA_NOVO));
  assert.equal(ligadas.length, 1);
  assert.ok(ligadas[0].endsWith(ILHA_NOVO)); // a ilha já estava no #tela quando as ilhas foram ligadas
});

test('a ilha rumo-novociclo está registrada na ponte (M5-31)', () => {
  const ponte = readFileSync(new URL('../ilhas/ponte.tsx', import.meta.url), 'utf8');
  assert.match(ponte, /'rumo-novociclo':\s*\(\)\s*=>\s*<NovoCiclo\s*\/>/);
});

test('a aba Planejamento sem Ilhas carregado não quebra', () => {
  const w = guia({ Telas: { plano() {} }, document: { getElementById: () => ({ insertAdjacentHTML() {} }) }, window: {} });
  vm.runInContext(CODIGO, w as unknown as vm.Context);
  assert.doesNotThrow(() => (w as unknown as { Telas: { plano(): void } }).Telas.plano());
});

/* ---------- Resumo do Preenchimento com o texto novo (MON-04, FBK-01.5) ---------- */
import { paraGuia, registra } from '../lib/feedback.ts';
const RESUMO = readFileSync(new URL('../public/legacy/resumo.js', import.meta.url), 'utf8');

function resumo(D: Record<string, unknown>) {
  const w = guia({ D, esc: (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'), rich: (s: string) => s, window: {}, Comp: { monit: () => '' } });
  vm.runInContext(CODIGO, w as unknown as vm.Context); // m5.js reescreve CAMPOS_MONIT
  vm.runInContext(`${RESUMO};this.Resumo=Resumo;`, w as unknown as vm.Context);
  const m5 = w.MISSOES.find((m) => m.n === 5)! as unknown as { exercicios: Record<string, unknown>[] };
  const ex = (id: string) => m5.exercicios.find((e) => e.id === id)!;
  return { monit: () => (w as unknown as { Resumo: { ex(e: unknown): string } }).Resumo.ex(ex('m5.monit')), feedback: () => (w as unknown as { Resumo: { ex(e: unknown): string } }).Resumo.ex(ex('m5.feedback')) };
}

test('o Resumo lista o "Detalhamento do mês" sob a meta e o mês certos, e não os campos antigos (MON-04.1)', () => {
  const r = resumo({
    metas: [{ id: 'a', texto: 'Aprovar 2 projetos' }, { id: 'b', texto: 'Visitar escolas' }],
    campos: { 'mon.a.2.det': 'Aprovamos o primeiro projeto', 'mon.a.2.result': 'texto antigo que não deve aparecer' },
  }).monit();
  assert.match(r, /Meta 01 — Aprovar 2 projetos<\/dt><dt>2º monitoramento<\/dt><dd><strong>Detalhamento do mês:<\/strong> Aprovamos o primeiro projeto<\/dd>/);
  assert.ok(!r.includes('texto antigo'));
  assert.match(r, /Meta 02 — Visitar escolas<\/dt><dd><span class="sem">não preenchido<\/span><\/dd>/);
});

test('o Resumo de uma conversa nova mostra os destaques e os ajustes digitados (FBK-01.5)', () => {
  const conversa = paraGuia(registra([], { cadeira: 3, pessoa: 'Davi Rocha', lider: 'Bruno Lima', data: '18/03', destaques: '', ajustes: '', acao: 'Reunião semanal', d1: 'Boa entrega', d2: 'Boa escuta', a1: 'Prazos', a2: '' })[0]);
  const h = resumo({ metas: [], campos: {}, feedbacks: [conversa] }).feedback();
  assert.ok(h.includes('Boa entrega'));
  assert.ok(h.includes('Boa escuta'));
  assert.ok(h.includes('Prazos'));
  assert.ok(h.includes('Reunião semanal'));
});
