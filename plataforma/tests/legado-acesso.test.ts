import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/* acesso.js é o arquivo de ganchos da feature acesso-equipe-convites sobre o Guia legado (AD-003). Aqui ele roda numa
   "janela" com o nucleo.js, o app.js e o cadastro.js reais, um documento simulado e o fetch espionado. */
const arquivo = (nome: string) => readFileSync(new URL(`../public/legacy/${nome}.js`, import.meta.url), 'utf8');
const PAGINA = readFileSync(new URL('../app/guia/page.tsx', import.meta.url), 'utf8');

const escapa = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface El {
  id: string; texto: string; html: string; removido: boolean; atributos: Record<string, string>; filhos: El[]; parentNode: El | null;
  classList: { add(c: string): void; remove(c: string): void; contains(c: string): boolean; toggle(c: string, on?: boolean): boolean };
  textContent: string; innerHTML: string;
  setAttribute(k: string, v: string): void; remove(): void; appendChild(n: El): El; insertBefore(n: El, ref?: El): El;
  querySelector(s: string): El | null; querySelectorAll(s: string): El[];
}

/** Elemento simulado: só o que o Guia e o acesso.js usam. */
function elemento(id = ''): El {
  const classes = new Set<string>();
  const el: El = {
    id, texto: '', html: '', removido: false, atributos: {}, filhos: [], parentNode: null,
    classList: {
      add: (c) => { classes.add(c); },
      remove: (c) => { classes.delete(c); },
      contains: (c) => classes.has(c),
      toggle: (c, on) => { const v = on ?? !classes.has(c); if (v) classes.add(c); else classes.delete(c); return v; },
    },
    get textContent() { return el.texto; },
    set textContent(v: string) { el.texto = String(v); el.html = ''; },
    get innerHTML() { return el.html || escapa(el.texto); },
    set innerHTML(v: string) { el.html = String(v); },
    setAttribute(k, v) { el.atributos[k] = String(v); },
    remove() { el.removido = true; },
    appendChild(n) { el.filhos.push(n); n.parentNode = el; return n; },
    insertBefore(n) { el.filhos.push(n); n.parentNode = el; return n; },
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  return el;
}

/** Documento simulado. O #tela fica dentro de `.corpo`, como no corpo do Guia (lib/legacyBody.ts). */
function documento() {
  const porId = new Map<string, El>();
  const corpo = elemento('corpo');
  return {
    corpo, body: elemento('body'), head: elemento('head'),
    createElement: () => elemento(),
    getElementById(id: string) {
      if (!porId.has(id)) { const e = elemento(id); if (id === 'tela') corpo.appendChild(e); porId.set(id, e); }
      return porId.get(id)!;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
  };
}

interface Pedido { url: string; metodo: string; corpo: Record<string, unknown> | undefined }
type Responde = (url: string, metodo: string) => unknown;

interface Guia {
  NUVEM: boolean;
  Store: {
    usuario: { id: string; nome: string; email?: string } | null; mandato: Record<string, unknown> | null; membros: unknown[];
    abrir(id: string): Promise<unknown>; salvar(): void; gravar(): Promise<void>; atualizar(c: Record<string, unknown>): Promise<void>;
    registrar(m: number, e: string, t: string): Promise<void>; entrarPorCodigo(c: string): Promise<unknown>;
    criarMandato(c: Record<string, unknown>): Promise<{ id: string }>;
  };
  Telas: { equipeHtml(): string };
  Cad: { blocoCodigo(): string };
  App: { iniciar(): Promise<void> };
}

/** Carrega nucleo.js, app.js, cadastro.js e acesso.js reais, na ordem do Guia. O atraso de 700 ms do Store.salvar some. */
function janela(o: { nuvem?: boolean; responde?: Responde } = {}) {
  const pedidos: Pedido[] = [];
  const guardado = new Map<string, string>();
  const document = documento();
  const ctx: Record<string, unknown> = {
    document, console, URLSearchParams,
    location: { hostname: 'localhost', hash: '#/', origin: 'http://localhost:3000', pathname: '/guia', search: '' },
    history: { replaceState() {} },
    localStorage: {
      getItem: (k: string) => guardado.get(k) ?? null,
      setItem: (k: string, v: string) => { guardado.set(k, String(v)); },
      removeItem: (k: string) => { guardado.delete(k); },
    },
    setTimeout: (f: () => void) => { f(); return 0; },
    clearTimeout: () => {},
    fetch: async (url: string, op: { method?: string; body?: string } = {}) => {
      const metodo = op.method ?? 'GET';
      pedidos.push({ url, metodo, corpo: op.body ? JSON.parse(op.body) : undefined });
      const r = o.responde?.(url, metodo);
      return { ok: true, status: 200, text: async () => (r === undefined ? '' : JSON.stringify(r)), json: async () => r };
    },
    FRAGILIDADES: [],
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(arquivo('nucleo'), ctx);
  if (o.nuvem === false) vm.runInContext('NUVEM=false;', ctx);
  for (const n of ['app', 'cadastro', 'acesso']) vm.runInContext(arquivo(n), ctx);
  return { w: ctx as unknown as Guia, pedidos, document };
}

const MANDATO = { id: 'm-a', nome_parlamentar: 'Ana Souza', cargo: 'Deputado(a) Estadual', uf: 'SP', partido: 'PX', codigo: 'KJ4TP9', dados: {} };
const CODIGO_DE_CONVITE = /c[oó]digo/i;

/* ---------- ordem de carga ---------- */
test('acesso.js é carregado depois de cadastro.js e antes de iniciar.js na página do Guia (T34)', () => {
  const lista = /const SCRIPTS = \[([^\]]*)\]/.exec(PAGINA)![1].replace(/['\s]/g, '').split(',');
  assert.ok(lista.includes('acesso'));
  assert.ok(lista.indexOf('acesso') > lista.indexOf('cadastro'));
  assert.equal(lista.indexOf('iniciar'), lista.indexOf('acesso') + 1);
});

/* ---------- código de convite fora das telas (ACE-07.2, ACE-07.5) ---------- */
test('o cadastro novo (primeiro acesso e "Novo cadastro") não traz mais o bloco do código de convite (ACE-07.2)', () => {
  const { w } = janela();
  assert.equal(w.NUVEM, true);
  assert.equal(w.Cad.blocoCodigo(), '');
});

test('Equipe e convites em Configurações vira um cartão com link para /mandato/equipe, sem código (ACE-07.2, ACE-07.5)', () => {
  const { w } = janela();
  w.Store.mandato = { ...MANDATO };
  w.Store.membros = [{ user_id: 'u1', nome: 'Lia', papel: 'coordenacao' }];
  const h = w.Telas.equipeHtml();
  assert.match(h, /<a [^>]*href="\/mandato\/equipe"[^>]*>/);
  assert.match(h, /id="cadEquipe"/);
  assert.doesNotMatch(h, CODIGO_DE_CONVITE);
  assert.equal(h.includes('KJ4TP9'), false);
  assert.equal(h.includes('Equipe.copiar'), false);
  assert.equal(h.includes('Cad.codigo'), false);
});

test('no modo local, Equipe e convites segue sem código e sem link para /mandato, que exige a nuvem (ACE-07.2)', () => {
  const { w } = janela({ nuvem: false });
  w.Store.mandato = { ...MANDATO };
  const h = w.Telas.equipeHtml();
  assert.doesNotMatch(h, CODIGO_DE_CONVITE);
  assert.equal(h.includes('KJ4TP9'), false);
  assert.equal(h.includes('/mandato/equipe'), false);
  assert.match(h, /Modo local/);
});

test('Store.entrarPorCodigo recusa sem nenhuma chamada ao banco e sem citar código (ACE-07.1, ACE-07.2)', async () => {
  const { w, pedidos } = janela();
  w.Store.usuario = { id: 'u1', nome: 'Lia' };
  await assert.rejects(w.Store.entrarPorCodigo('KJ4TP9'), (e: Error) => !CODIGO_DE_CONVITE.test(e.message));
  assert.equal(pedidos.length, 0);
});

test('a tela de entrada (login) não fala mais em código de convite no aviso do modo nuvem (ACE-07.2)', async () => {
  const { w, document } = janela();
  await w.App.iniciar();
  const aviso = document.getElementById('avisoModo').innerHTML;
  assert.match(aviso, /^<strong>Modo nuvem\.<\/strong>/);
  assert.doesNotMatch(aviso, CODIGO_DE_CONVITE);
});

test('cadastrar um mandato novo continua incluindo a pessoa como coordenacao (ACE-07.3)', async () => {
  const { w, pedidos } = janela({ responde: (url, metodo) => (metodo === 'POST' && url.endsWith('/rest/v1/mandatos') ? [{ id: 'm-novo' }] : undefined) });
  w.Store.usuario = { id: 'uid-ana', nome: 'Ana Lima' };
  const m = await w.Store.criarMandato({ nome_parlamentar: 'Bruno Alves', cargo: 'Vereador(a)', uf: 'MG' });
  assert.equal(m.id, 'm-novo');
  const membro = pedidos.find((p) => p.metodo === 'POST' && p.url.endsWith('/rest/v1/membros'));
  assert.ok(membro, 'POST em membros');
  assert.deepEqual({ ...membro.corpo }, { mandato_id: 'm-novo', user_id: 'uid-ana', papel: 'coordenacao', nome: 'Ana Lima' });
});
