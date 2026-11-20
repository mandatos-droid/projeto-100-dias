import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/* Grupo B da "Qualidade do preenchimento": salvamento e sessão do Guia legado (nucleo.js e guia.js reais), com fetch,
   relógio e documento simulados. Cobre: token vencido (renova e repete), renovação que falha (tela travada, nada de
   "Salvo" nem "Exercício concluído"), saída rápida (descarrega ao sair) e edição concorrente (mescla por chave). */
const arquivo = (nome: string) => readFileSync(new URL(`../public/legacy/${nome}.js`, import.meta.url), 'utf8');

interface El {
  id: string; texto: string; html: string; atributos: Record<string, string>; filhos: El[]; removido: boolean; classes: Set<string>;
  classList: { add(c: string): void; remove(c: string): void; contains(c: string): boolean };
  textContent: string; innerHTML: string;
  setAttribute(k: string, v: string): void; getAttribute(k: string): string | null; remove(): void; appendChild(n: El): El;
  addEventListener(t: string, f: () => void): void; querySelector(s: string): El | null; querySelectorAll(s: string): El[]; focus(): void;
  ouvintes: Record<string, (() => void)[]>;
}

function elemento(id = ''): El {
  const el: El = {
    id, texto: '', html: '', atributos: {}, filhos: [], removido: false, classes: new Set(), ouvintes: {},
    classList: { add: (c) => { el.classes.add(c); }, remove: (c) => { el.classes.delete(c); }, contains: (c) => el.classes.has(c) },
    get textContent() { return el.texto; },
    set textContent(v: string) { el.texto = String(v); el.html = ''; },
    get innerHTML() { return el.html || el.texto; },
    set innerHTML(v: string) { el.html = String(v); },
    setAttribute(k, v) { el.atributos[k] = String(v); },
    getAttribute: (k) => el.atributos[k] ?? null,
    remove() { el.removido = true; },
    appendChild(n) { el.filhos.push(n); return n; },
    addEventListener(t, f) { (el.ouvintes[t] ||= []).push(f); },
    querySelector: () => null,
    querySelectorAll: () => [],
    focus() {},
  };
  return el;
}

interface Pedido { url: string; metodo: string; corpo: any; cab: Record<string, string>; keepalive: boolean }
type Resposta = { status?: number; corpo?: unknown } | 'rede';
type Responde = (p: Pedido, n: number) => Resposta | undefined;

const NOVO = { access_token: 'tok-novo', refresh_token: 'ref-novo', token_type: 'bearer' };
const SESSAO_VELHA = JSON.stringify({ access_token: 'tok-velho', refresh_token: 'ref-velho' });
const VENCIDO = { status: 401, corpo: { message: 'JWT expired', code: 'PGRST303' } };

function ambiente(o: { nuvem?: boolean; responde?: Responde; tok?: string | null; versao?: string | null; dados?: any } = {}) {
  const pedidos: Pedido[] = [];
  const guardado = new Map<string, string>();
  if (o.tok !== null) guardado.set('legisla.tok', o.tok ?? SESSAO_VELHA);
  const salvo = elemento('salvo');
  const toast = elemento('toast');
  const corpo = elemento('body');
  const porId = new Map<string, El>([['toast', toast]]);
  const ouvJanela: Record<string, (() => void)[]> = {};
  const ouvDoc: Record<string, (() => void)[]> = {};
  const timers: { id: number; f: () => void; ms: number }[] = [];
  let prox = 1;
  const doc: any = {
    body: corpo, head: elemento('head'), visibilityState: 'visible',
    createElement: () => elemento(),
    getElementById: (id: string) => { if (!porId.has(id)) porId.set(id, elemento(id)); return porId.get(id)!; },
    querySelector: () => null,
    querySelectorAll: (s: string) => (s === '[data-salvo]' ? [salvo] : []),
    addEventListener: (t: string, f: () => void) => { (ouvDoc[t] ||= []).push(f); },
  };
  const ctx: Record<string, any> = {
    document: doc, console, URLSearchParams, Date, JSON, Promise, Error, Object, Array, Math, String, Number,
    location: { hostname: 'localhost', hash: '#/', origin: 'http://localhost:3000', pathname: '/guia', search: '', reload() { ctx.recarregou = true; } },
    history: { replaceState() {} },
    localStorage: {
      getItem: (k: string) => guardado.get(k) ?? null,
      setItem: (k: string, v: string) => { guardado.set(k, String(v)); },
      removeItem: (k: string) => { guardado.delete(k); },
    },
    setTimeout: (f: () => void, ms: number) => { const id = prox++; timers.push({ id, f, ms }); return id; },
    clearTimeout: (id: number) => { const i = timers.findIndex((t) => t.id === id); if (i >= 0) timers.splice(i, 1); },
    addEventListener: (t: string, f: () => void) => { (ouvJanela[t] ||= []).push(f); },
    fetch: async (url: string, op: any = {}) => {
      const p: Pedido = { url, metodo: op.method ?? 'GET', corpo: op.body ? JSON.parse(op.body) : undefined, cab: op.headers ?? {}, keepalive: !!op.keepalive };
      pedidos.push(p);
      const r = o.responde?.(p, pedidos.length);
      if (r === 'rede') throw new TypeError('Failed to fetch');
      const status = r?.status ?? 200;
      const tx = r?.corpo === undefined ? '' : JSON.stringify(r.corpo);
      return { ok: status >= 200 && status < 300, status, text: async () => tx, json: async () => (tx ? JSON.parse(tx) : {}) };
    },
    FRAGILIDADES: [], MISSOES: [],
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(arquivo('nucleo'), ctx);
  vm.runInContext(arquivo('guia'), ctx);
  if (o.nuvem === false) vm.runInContext('NUVEM=false;', ctx);
  const dados = o.dados ?? { campos: {}, feitos: {}, metas: [] };
  const mandato = { id: 'm1', atualizado_em: o.versao === undefined ? 'v1' : o.versao, dados };
  if (o.nuvem === false) {
    guardado.set('legisla.regimento.v3', JSON.stringify({ mandatos: { m1: { id: 'm1', dados } } }));
  }
  vm.runInContext(
    `Store.usuario={id:'u1',nome:'Ana'};Store.mandato=${JSON.stringify(mandato)};Store.dados=${JSON.stringify(dados)};D=Store.dados;`
    + `Store._versao=${JSON.stringify(mandato.atualizado_em)};Store._base=JSON.stringify(Store.dados);`
    + `Nuvem.tok='tok-velho';`, ctx);
  const corre = async () => { // dispara o que estiver agendado (o atraso de 700 ms do salvar)
    for (const t of timers.splice(0)) t.f();
    await new Promise((r) => setImmediate(r));
  };
  const avalia = <T>(js: string) => vm.runInContext(js, ctx) as T;
  return {
    ctx, pedidos, guardado, salvo, toast, corpo, timers, corre, avalia, doc,
    sai: () => { for (const f of ouvJanela.pagehide ?? []) f(); },
    oculta: () => { doc.visibilityState = 'hidden'; for (const f of ouvDoc.visibilitychange ?? []) f(); },
    escuta: { janela: ouvJanela, doc: ouvDoc },
    gravar: () => avalia<Promise<boolean | undefined>>('Store.gravar()'),
    patches: () => pedidos.filter((p) => p.metodo === 'PATCH'),
    renovacoes: () => pedidos.filter((p) => p.url.includes('grant_type=refresh_token')),
    bloqueio: () => corpo.filhos.find((f) => /sess/i.test(f.innerHTML) && !f.removido),
  };
}

/** Servidor falso de `mandatos`: guarda o corpo, vence o token velho e confere a versão do PATCH condicional. */
function servidor(estado: { versao: number; dados: any }, regra: { tokenBom?: string; refreshOk?: boolean } = {}): Responde {
  return (p) => {
    if (p.url.includes('grant_type=refresh_token')) return regra.refreshOk === false ? { status: 400, corpo: { error: 'invalid_grant', error_description: 'Invalid Refresh Token' } } : { corpo: NOVO };
    if (p.cab.Authorization !== `Bearer ${regra.tokenBom ?? 'tok-novo'}`) return VENCIDO;
    if (p.metodo === 'PATCH') {
      const m = /atualizado_em=eq\.([^&]+)/.exec(p.url);
      if (m && decodeURIComponent(m[1]) !== `v${estado.versao}`) return { corpo: [] }; // outra sessão gravou antes
      estado.dados = p.corpo.dados;
      estado.versao += 1;
      return { corpo: [{ atualizado_em: `v${estado.versao}` }] };
    }
    if (p.metodo === 'GET' && p.url.includes('mandatos?')) return { corpo: [{ dados: estado.dados, atualizado_em: `v${estado.versao}` }] };
    return { corpo: [] };
  };
}

/* ---------- token vencido: renova sozinho e repete ---------- */
test('um 401 "JWT expired" ao gravar renova o token com o refresh_token e repete o PATCH (autosave não se perde)', async () => {
  const est = { versao: 1, dados: null as any };
  const a = ambiente({ responde: servidor(est) });
  a.avalia('D.campos.a="resposta"');
  assert.equal(await a.gravar(), true);
  assert.equal(a.renovacoes().length, 1, 'uma renovação');
  assert.equal(a.renovacoes()[0].corpo.refresh_token, 'ref-velho');
  assert.equal(a.patches().length, 2, 'o PATCH original (401) e a repetição');
  assert.equal(a.patches()[1].cab.Authorization, 'Bearer tok-novo');
  assert.equal(est.dados.campos.a, 'resposta');
  assert.equal(a.salvo.texto, 'Salvo automaticamente');
  assert.equal(JSON.parse(a.guardado.get('legisla.tok')!).access_token, 'tok-novo', 'a sessão nova fica guardada');
  assert.equal(a.avalia('Nuvem.tok'), 'tok-novo');
});

test('leituras (GET) também renovam e repetem ao receber 401', async () => {
  const est = { versao: 1, dados: { campos: {} } };
  const a = ambiente({ responde: servidor(est) });
  const r = await a.avalia<Promise<any[]>>("Nuvem.rest('mandatos?id=eq.m1&select=*')");
  assert.equal(r.length, 1);
  assert.equal(a.renovacoes().length, 1);
});

test('vários pedidos vencidos ao mesmo tempo renovam uma vez só (o refresh_token é de uso único)', async () => {
  const est = { versao: 1, dados: { campos: {} } };
  const a = ambiente({ responde: servidor(est) });
  await Promise.all([1, 2, 3].map(() => a.avalia<Promise<unknown>>("Nuvem.rest('mandatos?id=eq.m1&select=*')")));
  assert.equal(a.renovacoes().length, 1);
});

test('se a outra camada (ilhas) já renovou e guardou a sessão, o Guia adota o token novo sem gastar o refresh_token', async () => {
  const est = { versao: 1, dados: { campos: {} } };
  const a = ambiente({ responde: servidor(est) });
  a.guardado.set('legisla.tok', JSON.stringify({ access_token: 'tok-novo', refresh_token: 'ref-novo' }));
  await a.avalia<Promise<unknown>>("Nuvem.rest('mandatos?id=eq.m1&select=*')");
  assert.equal(a.renovacoes().length, 0);
  assert.equal(a.avalia('Nuvem.tok'), 'tok-novo');
});

test('um erro que não é de sessão (500) não renova nem trava a tela', async () => {
  const a = ambiente({ responde: () => ({ status: 500, corpo: { message: 'boom' } }) });
  assert.equal(await a.gravar(), false);
  assert.equal(a.renovacoes().length, 0);
  assert.equal(a.bloqueio(), undefined);
});

/* ---------- renovação que falha: travar a tela, sem "Salvo" nem "concluído" ---------- */
test('se a renovação for recusada, o Guia trava a tela com um aviso claro e gravar devolve false', async () => {
  const est = { versao: 1, dados: null as any };
  const a = ambiente({ responde: servidor(est, { refreshOk: false }) });
  a.avalia('D.campos.a="resposta"');
  assert.equal(await a.gravar(), false);
  const aviso = a.bloqueio();
  assert.ok(aviso, 'a tela fica coberta por um aviso');
  assert.match(aviso!.innerHTML, /sess[ãa]o/i);
  assert.match(aviso!.innerHTML, /n[ãa]o foram salvas|não salv/i);
  assert.equal(a.avalia('Nuvem.sessaoPerdida'), true);
  assert.notEqual(a.salvo.texto, 'Salvo automaticamente');
  assert.match(a.salvo.texto, /n[ãa]o salvo/i, 'o indicador fica avisando, não some em 3 s');
});

test('com a sessão perdida o aviso é único e persistente, e não há novas tentativas de gravação inúteis', async () => {
  const est = { versao: 1, dados: null as any };
  const a = ambiente({ responde: servidor(est, { refreshOk: false }) });
  await a.gravar();
  await a.gravar();
  assert.equal(a.corpo.filhos.filter((f) => /sess/i.test(f.innerHTML)).length, 1);
  assert.equal(a.renovacoes().length, 1, 'não insiste com um refresh_token já recusado');
});

test('o aviso de sessão perdida oferece entrar de novo', async () => {
  const est = { versao: 1, dados: null as any };
  const a = ambiente({ responde: servidor(est, { refreshOk: false }) });
  await a.gravar();
  assert.match(a.bloqueio()!.innerHTML, /entrar/i);
});

test('sem conexão na renovação não é sessão perdida: avisa que não salvou, sem travar a tela', async () => {
  const a = ambiente({ responde: (p) => (p.url.includes('grant_type=refresh_token') ? 'rede' : VENCIDO) });
  assert.equal(await a.gravar(), false);
  assert.equal(a.bloqueio(), undefined);
  assert.notEqual(a.avalia('Nuvem.sessaoPerdida'), true);
  assert.match(a.salvo.texto, /n[ãa]o salvo/i);
});

test('depois de uma falha, a próxima edição volta a tentar e o indicador passa a "Salvo automaticamente"', async () => {
  const est = { versao: 1, dados: null as any };
  let rede = true;
  const bom = servidor(est);
  const a = ambiente({ responde: (p, n) => (rede ? 'rede' : bom(p, n)) });
  assert.equal(await a.gravar(), false);
  rede = false;
  a.avalia('D.campos.b="x"');
  assert.equal(await a.gravar(), true);
  assert.equal(a.salvo.texto, 'Salvo automaticamente');
});

/* ---------- Guia.concluir / reabrir dependem do resultado do salvamento ---------- */
const prepGuia = (a: ReturnType<typeof ambiente>) => a.avalia(
  "var _reg=[];Store.registrar=async function(){_reg.push(1)};var _rend=0;Guia.render=function(){_rend++};"
  + "App={lateral:function(){}};Guia.ex={id:'m1.persona',t:'Persona'};Guia.m={n:1};",
);

test('concluir com o salvamento falhando não mostra "Exercício concluído", desfaz a marca e não registra o evento', async () => {
  const est = { versao: 1, dados: null as any };
  const a = ambiente({ responde: servidor(est, { refreshOk: false }) });
  prepGuia(a);
  await a.avalia<Promise<unknown>>('Guia.concluir()');
  assert.notEqual(a.toast.texto, 'Exercício concluído.');
  assert.equal(a.avalia('D.feitos["m1.persona"]'), false, 'a marca em memória volta atrás');
  assert.equal(a.avalia('_reg.length'), 0, 'o evento não é registrado');
});

test('concluir com o salvamento certo grava na hora (sem esperar 700 ms), registra e mostra "Exercício concluído."', async () => {
  const est = { versao: 1, dados: null as any };
  const a = ambiente({ responde: servidor(est) });
  prepGuia(a);
  await a.avalia<Promise<unknown>>('Guia.concluir()');
  assert.equal(a.toast.texto, 'Exercício concluído.');
  assert.equal(est.dados.feitos['m1.persona'], true, 'já está no servidor quando a tela diz concluído');
  assert.equal(a.avalia('_reg.length'), 1);
  assert.equal(a.timers.filter((t) => t.ms === 700).length, 0, 'o atraso do salvar foi cancelado pela gravação imediata');
});

test('concluir renova o token sozinho quando ele venceu (o caso relatado: JWT expired depois de muito tempo com a aba aberta)', async () => {
  const est = { versao: 1, dados: null as any };
  const a = ambiente({ responde: servidor(est) });
  prepGuia(a);
  await a.avalia<Promise<unknown>>('Guia.concluir()');
  assert.equal(a.renovacoes().length, 1);
  assert.equal(est.dados.feitos['m1.persona'], true);
  assert.equal(a.toast.texto, 'Exercício concluído.');
});

test('reabrir com o salvamento falhando devolve a marca de concluído e não finge que reabriu', async () => {
  const est = { versao: 1, dados: null as any };
  const a = ambiente({ responde: servidor(est, { refreshOk: false }), dados: { campos: {}, feitos: { 'm1.persona': true }, metas: [] } });
  prepGuia(a);
  await a.avalia<Promise<unknown>>('Guia.reabrir()');
  assert.equal(a.avalia('D.feitos["m1.persona"]'), true);
});

/* ---------- saída rápida ---------- */
test('o Guia escuta pagehide e visibilitychange para gravar antes de sair', () => {
  const a = ambiente();
  assert.ok((a.escuta.janela.pagehide ?? []).length >= 1, 'pagehide');
  assert.ok((a.escuta.doc.visibilitychange ?? []).length >= 1, 'visibilitychange');
});

test('digitou e saiu antes dos 700 ms: o pagehide envia o PATCH na hora, com keepalive, e cancela o atraso', async () => {
  const est = { versao: 1, dados: null as any };
  const a = ambiente({ responde: servidor(est, { tokenBom: 'tok-velho' }) });
  a.avalia('D.campos.q1="texto digitado"; Store.salvar()');
  assert.equal(a.timers.length, 1, 'o salvamento está esperando os 700 ms');
  assert.equal(a.patches().length, 0);
  a.sai();
  assert.equal(a.patches().length, 1, 'o PATCH saiu de forma síncrona, antes de a página ir embora');
  assert.equal(a.patches()[0].keepalive, true);
  assert.equal(a.patches()[0].corpo.dados.campos.q1, 'texto digitado');
  assert.equal(a.timers.length, 0);
  await new Promise((r) => setImmediate(r));
  assert.equal(est.dados.campos.q1, 'texto digitado');
});

test('ocultar a aba (visibilitychange para hidden) também descarrega o que está pendente', () => {
  const a = ambiente({ responde: servidor({ versao: 1, dados: null }, { tokenBom: 'tok-velho' }) });
  a.avalia('D.campos.q1="x"; Store.salvar()');
  a.oculta();
  assert.equal(a.patches().length, 1);
  assert.equal(a.patches()[0].keepalive, true);
});

test('sair sem nada pendente não envia nada', () => {
  const a = ambiente({ responde: servidor({ versao: 1, dados: null }, { tokenBom: 'tok-velho' }) });
  a.sai();
  a.oculta();
  assert.equal(a.pedidos.length, 0);
});

test('em modo local (sem nuvem) sair antes dos 700 ms grava no localStorage na hora', () => {
  const a = ambiente({ nuvem: false });
  a.avalia('D.campos.q1="local"; Store.salvar()');
  assert.equal(JSON.parse(a.guardado.get('legisla.regimento.v3')!).mandatos.m1.dados.campos?.q1, undefined, 'ainda não gravou');
  a.sai();
  assert.equal(JSON.parse(a.guardado.get('legisla.regimento.v3')!).mandatos.m1.dados.campos.q1, 'local');
});

test('o token perto de vencer é renovado em segundo plano na edição, para o pagehide não depender de renovar', async () => {
  const exp = Math.floor(Date.now() / 1000) + 30; // vence em 30 s
  const jwt = `x.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.y`;
  const a = ambiente({ tok: JSON.stringify({ access_token: jwt, refresh_token: 'ref-velho' }), responde: servidor({ versao: 1, dados: null }, { tokenBom: 'tok-novo' }) });
  a.avalia(`Nuvem.tok=${JSON.stringify(jwt)};D.campos.q1="x";Store.salvar()`);
  await new Promise((r) => setImmediate(r));
  assert.equal(a.renovacoes().length, 1);
  assert.equal(a.avalia('Nuvem.tok'), 'tok-novo');
});

/* ---------- edição concorrente ---------- */
test('o PATCH é condicional à versão lida (atualizado_em) e pede de volta a versão nova', async () => {
  const est = { versao: 1, dados: null as any };
  const a = ambiente({ responde: servidor(est, { tokenBom: 'tok-velho' }) });
  a.avalia('D.campos.a="1"');
  await a.gravar();
  const p = a.patches()[0];
  assert.match(decodeURIComponent(p.url), /atualizado_em=eq\.v1/);
  assert.match(p.cab.Prefer, /return=representation/);
  assert.equal(a.avalia('Store._versao'), 'v2', 'a versão devolvida vira a base da próxima gravação');
  a.avalia('D.campos.b="2"');
  await a.gravar();
  assert.match(decodeURIComponent(a.patches()[1].url), /atualizado_em=eq\.v2/);
  assert.equal(a.patches().length, 2, 'sem conflito, um PATCH por gravação');
});

test('duas sessões editando campos diferentes: a segunda mescla e nada é apagado', async () => {
  const est = { versao: 1, dados: null as any };
  const a = ambiente({ responde: servidor(est, { tokenBom: 'tok-velho' }), dados: { campos: { x: 'base' }, feitos: {}, metas: [] } });
  // a outra pessoa gravou antes: campo b novo, versão 2
  est.dados = { campos: { x: 'base', b: 'da outra pessoa' }, feitos: { 'm1.persona': true }, metas: [] };
  est.versao = 2;
  a.avalia('D.campos.a="minha edição"');
  assert.equal(await a.gravar(), true);
  assert.equal(a.patches().length, 2, 'o primeiro PATCH bateu no conflito, o segundo mesclou');
  assert.deepEqual(est.dados.campos, { x: 'base', b: 'da outra pessoa', a: 'minha edição' });
  assert.equal(est.dados.feitos['m1.persona'], true, 'o que a outra pessoa concluiu fica');
  assert.equal(a.avalia('D.campos.b'), 'da outra pessoa', 'a tela local também passa a ter o que veio da outra sessão');
  assert.equal(a.avalia('D.campos.a'), 'minha edição');
  assert.equal(a.salvo.texto, 'Salvo automaticamente');
  assert.match(a.toast.texto, /outra pessoa|combinad/i, 'avisa que houve mescla');
});

test('listas com id são mescladas por id: cada uma adiciona o seu item', async () => {
  const est = { versao: 2, dados: { metas: [{ id: 'a', t: 'A' }, { id: 'o', t: 'da outra pessoa' }] } as any };
  const a = ambiente({ responde: servidor(est, { tokenBom: 'tok-velho' }), dados: { metas: [{ id: 'a', t: 'A' }] } });
  a.avalia('D.metas.push({id:"m",t:"minha"})');
  await a.gravar();
  const ids = est.dados.metas.map((m: any) => m.id).sort();
  assert.deepEqual(ids, ['a', 'm', 'o']);
});

test('o item que só eu mudei dentro de uma lista com id mantém a minha edição, e o que só a outra pessoa mudou, a dela', async () => {
  const base = { metas: [{ id: 'a', t: 'A', s: 'novo' }, { id: 'b', t: 'B', s: 'novo' }] };
  const est = { versao: 2, dados: { metas: [{ id: 'a', t: 'A', s: 'novo' }, { id: 'b', t: 'B', s: 'concluída' }] } as any };
  const a = ambiente({ responde: servidor(est, { tokenBom: 'tok-velho' }), dados: JSON.parse(JSON.stringify(base)) });
  a.avalia('D.metas[0].t="A editada"');
  await a.gravar();
  assert.equal(est.dados.metas.find((m: any) => m.id === 'a').t, 'A editada');
  assert.equal(est.dados.metas.find((m: any) => m.id === 'b').s, 'concluída');
});

test('item apagado pela outra pessoa (e que eu não toquei) continua apagado; o que eu apaguei também', async () => {
  const est = { versao: 2, dados: { metas: [{ id: 'a', t: 'A' }, { id: 'c', t: 'C' }] } as any }; // a outra pessoa apagou o b
  const a = ambiente({ responde: servidor(est, { tokenBom: 'tok-velho' }), dados: { metas: [{ id: 'a', t: 'A' }, { id: 'b', t: 'B' }, { id: 'c', t: 'C' }] } });
  a.avalia('D.metas=D.metas.filter(function(m){return m.id!=="c"})'); // eu apaguei o c
  await a.gravar();
  assert.deepEqual(est.dados.metas.map((m: any) => m.id), ['a']);
});

test('o mesmo campo editado nas duas sessões: vale o da pessoa que está gravando agora (e o servidor não perde o resto)', async () => {
  const est = { versao: 2, dados: { campos: { x: 'da outra pessoa', y: 'y2' } } as any };
  const a = ambiente({ responde: servidor(est, { tokenBom: 'tok-velho' }), dados: { campos: { x: 'base', y: 'y' } } });
  a.avalia('D.campos.x="minha versão"');
  await a.gravar();
  assert.equal(est.dados.campos.x, 'minha versão');
  assert.equal(est.dados.campos.y, 'y2');
});

test('a mescla não leva D.feedbacks (vivem em feedbacks_mandato) nem para o servidor nem da outra sessão', async () => {
  const est = { versao: 2, dados: { campos: { b: '2' }, feedbacks: [{ id: 'z' }] } as any };
  const a = ambiente({ responde: servidor(est, { tokenBom: 'tok-velho' }), dados: { campos: {}, feedbacks: [{ id: 'f1' }] } });
  a.avalia('D.campos.a="1"');
  await a.gravar();
  // JSON: o array nasce no vm (outro realm), então deepStrictEqual compararia protótipos diferentes
  assert.equal(JSON.stringify(a.avalia('D.feedbacks')), JSON.stringify([{ id: 'f1' }]), 'a lista local de feedbacks não é tocada');
});

test('três conflitos seguidos viram erro (não fica em laço) e a gravação devolve false', async () => {
  let n = 0;
  const a = ambiente({ responde: (p) => (p.metodo === 'PATCH' ? { corpo: [] } : { corpo: [{ dados: { campos: { n: String(++n) } }, atualizado_em: `v${n + 5}` }] }) });
  a.avalia('D.campos.a="1"');
  assert.equal(await a.gravar(), false);
  assert.ok(a.patches().length <= 4);
  assert.match(a.salvo.texto, /n[ãa]o salvo/i);
});

test('sem versão conhecida (mandato sem atualizado_em) grava sem condição, como antes', async () => {
  const est = { versao: 1, dados: null as any };
  const a = ambiente({ versao: null, responde: servidor(est, { tokenBom: 'tok-velho' }) });
  a.avalia('D.campos.a="1"');
  assert.equal(await a.gravar(), true);
  assert.doesNotMatch(a.patches()[0].url, /atualizado_em/);
});
