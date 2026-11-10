import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
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
  // indicador "Salvando…" / "Salvo automaticamente" do Guia (nucleo.js, marcaSalvando e marcaSalvo)
  const salvo = elemento('salvo');
  return {
    corpo, salvo, body: elemento('body'), head: elemento('head'),
    createElement: () => elemento(),
    getElementById(id: string) {
      if (!porId.has(id)) { const e = elemento(id); if (id === 'tela') corpo.appendChild(e); porId.set(id, e); }
      return porId.get(id)!;
    },
    querySelector: () => null,
    querySelectorAll: (s: string) => (s === '[data-salvo]' ? [salvo] : []),
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
    criarConta(e: string, s: string, n: string): Promise<unknown>; entrar(e: string, s: string): Promise<unknown>;
    sessao(): Promise<{ id: string } | null>; erroOAuth?: string;
  };
  Telas: { equipeHtml(): string; primeiroAcesso(): void; config(): void };
  Cad: { blocoCodigo(): string };
  App: { iniciar(): Promise<void>; entrou(): Promise<void> };
  Area: { ir(id: string): void; tecla(ev: { key: string; preventDefault(): void }): void };
  location: { hash: string };
}

/** Carrega nucleo.js, app.js, cadastro.js e acesso.js reais, na ordem do Guia. O atraso de 700 ms do Store.salvar some. */
function janela(o: { nuvem?: boolean; responde?: Responde; hash?: string; tok?: string } = {}) {
  const pedidos: Pedido[] = [];
  const guardado = new Map<string, string>();
  if (o.tok) guardado.set('legisla.tok', o.tok);
  const guardadoSessao = new Map<string, string>();
  const redirecionou: string[] = [];
  const document = documento();
  const ctx: Record<string, unknown> = {
    document, console, URLSearchParams,
    location: { hostname: 'localhost', hash: o.hash ?? '#/', origin: 'http://localhost:3000', pathname: '/guia', search: '', replace: (u: string) => { redirecionou.push(u); } },
    history: { replaceState() {} },
    localStorage: {
      getItem: (k: string) => guardado.get(k) ?? null,
      setItem: (k: string, v: string) => { guardado.set(k, String(v)); },
      removeItem: (k: string) => { guardado.delete(k); },
    },
    sessionStorage: {
      getItem: (k: string) => guardadoSessao.get(k) ?? null,
      setItem: (k: string, v: string) => { guardadoSessao.set(k, String(v)); },
      removeItem: (k: string) => { guardadoSessao.delete(k); },
    },
    setTimeout: (f: () => void) => { f(); return 0; },
    clearTimeout: () => {},
    fetch: async (url: string, op: { method?: string; body?: string } = {}) => {
      const metodo = op.method ?? 'GET';
      pedidos.push({ url, metodo, corpo: op.body ? JSON.parse(op.body) : undefined });
      const r = o.responde?.(url, metodo);
      const recusa = r && typeof r === 'object' && '__status' in r ? Number((r as { __status: number }).__status) : 0; // resposta de erro HTTP
      if (recusa) return { ok: false, status: recusa, text: async () => '', json: async () => ({}) };
      return { ok: true, status: 200, text: async () => (r === undefined ? '' : JSON.stringify(r)), json: async () => r };
    },
    FRAGILIDADES: [],
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(arquivo('nucleo'), ctx);
  if (o.nuvem === false) vm.runInContext('NUVEM=false;', ctx);
  for (const n of ['app', 'cadastro', 'acesso']) vm.runInContext(arquivo(n), ctx);
  return { w: ctx as unknown as Guia, pedidos, document, redirecionou, guardadoSessao };
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

test('Equipe e convites em Área do mandato vira um cartão com link para /mandato/equipe, sem código (ACE-07.2, ACE-07.5)', () => {
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

/* ---------- Área do mandato: casca com abas em #/config (AMA-01.2, 01.3, 01.6, 02.7, 04.1, 04.2) ---------- */
const ABAS_AREA = ['Visão geral', 'Dados do mandato', 'Equipe e convites', 'Minha conta'];
const PAINEIS_AREA = ['areaVisao', 'areaDados', 'areaEquipe', 'areaConta'];
const DOIS_MEMBROS = [{ user_id: 'u1', nome: 'Lia', papel: 'coordenacao' }, { user_id: 'u2', nome: 'Mariana', papel: 'assessoria' }];

function atributos(s: string): Record<string, string> {
  const r: Record<string, string> = {};
  for (const m of s.matchAll(/([\w-]+)(?:="([^"]*)")?/g)) r[m[1]] = m[2] ?? '';
  return r;
}
/** Telas.config real no hash dado; devolve as abas e os painéis que ela escreveu no #tela (HTML do documento simulado). */
function areaEm(hash: string, membros: unknown[] = DOIS_MEMBROS) {
  const j = janela({ hash });
  j.w.Store.mandato = { ...MANDATO };
  j.w.Store.membros = membros;
  j.w.Telas.config();
  const html = j.document.getElementById('tela').innerHTML;
  const lista = /<div ([^>]*role="tablist"[^>]*)>/.exec(html);
  const abas = [...html.matchAll(/<button ([^>]*role="tab"[^>]*)>([^<]*)<\/button>/g)].map(([, a, rot]) => ({ rot, a: atributos(a) }));
  const paineis = [...html.matchAll(/<section ([^>]*role="tabpanel"[^>]*)>([\s\S]*?)<\/section>/g)].map(([, a, corpo]) => ({ a: atributos(a), corpo }));
  const ativa = abas.findIndex((x) => x.a['aria-selected'] === 'true');
  const visivel = paineis.filter((p) => !('hidden' in p.a)).map((p) => p.a.id);
  return { ...j, html, lista: lista ? atributos(lista[1]) : null, abas, paineis, ativa, visivel };
}

test('#/config desenha a Área do mandato: lista de abas com Visão geral, Dados do mandato, Equipe e convites e Minha conta, Visão geral ativa (AMA-01.2, AMA-04.1)', () => {
  const r = areaEm('#/config');
  assert.match(r.html, /<h1[^>]*>Área do mandato<\/h1>/);
  assert.equal(r.lista?.role, 'tablist');
  assert.deepEqual(r.abas.map((x) => x.rot), ['Visão geral', 'Dados do mandato', 'Equipe e convites (2)', 'Minha conta']);
  assert.deepEqual(r.abas.map((x) => x.a['aria-selected']), ['true', 'false', 'false', 'false']);
  assert.deepEqual(r.paineis.map((p) => p.a.id), PAINEIS_AREA);
  assert.deepEqual(r.visivel, ['areaVisao']);
});

for (const [hash, i] of [['#/config/dados', 1], ['#/config/equipe', 2], ['#/config/conta', 3]] as const) {
  test(`${hash} abre a aba ${ABAS_AREA[i]} ativa, com o painel dela à mostra (AMA-01.3)`, () => {
    const r = areaEm(hash);
    assert.equal(r.ativa, i);
    assert.deepEqual(r.visivel, [PAINEIS_AREA[i]]);
  });
}

test('aba desconhecida (#/config/xyz) abre a Visão geral (AMA-01.6)', () => {
  const r = areaEm('#/config/xyz');
  assert.equal(r.ativa, 0);
  assert.deepEqual(r.visivel, ['areaVisao']);
});

test('o rótulo da aba Equipe traz o total de pessoas do mandato (Store.membros), no formato "Equipe e convites (N)" (AMA-02.7)', () => {
  assert.equal(areaEm('#/config', DOIS_MEMBROS).abas[2].rot, 'Equipe e convites (2)');
  assert.equal(areaEm('#/config', [...DOIS_MEMBROS, { user_id: 'u3', nome: 'Rui', papel: 'leitura' }]).abas[2].rot, 'Equipe e convites (3)');
});

test('cada aba controla o seu painel, e cada painel nasce vazio (#areaVisao, #areaDados, #areaEquipe, #areaConta) (AMA-04.1)', () => {
  const r = areaEm('#/config/equipe');
  r.abas.forEach((aba, i) => {
    const painel = r.paineis[i];
    assert.equal(aba.a['aria-controls'], painel.a.id);
    assert.equal(painel.a['aria-labelledby'], aba.a.id);
    assert.equal(painel.corpo, '');
  });
});

test('clicar numa aba (Area.ir) leva ao endereço dela: #/config para a Visão geral e #/config/<aba> para as outras (AMA-01.4)', () => {
  const { w } = areaEm('#/config');
  for (const [id, hash] of [['equipe', '#/config/equipe'], ['conta', '#/config/conta'], ['dados', '#/config/dados'], ['visao', '#/config']]) {
    w.Area.ir(id);
    assert.equal(w.location.hash, hash, id);
  }
});

test('na lista de abas, seta direita e esquerda vão à aba vizinha e Home e End à primeira e à última; outras teclas seguem livres (AMA-04.2)', () => {
  const { w } = areaEm('#/config');
  const tecla = (key: string) => { let impedida = false; w.Area.tecla({ key, preventDefault: () => { impedida = true; } }); return impedida; };
  assert.equal(tecla('ArrowRight'), true);
  assert.equal(w.location.hash, '#/config/dados');
  tecla('ArrowRight');
  assert.equal(w.location.hash, '#/config/equipe');
  tecla('ArrowLeft');
  assert.equal(w.location.hash, '#/config/dados');
  tecla('End');
  assert.equal(w.location.hash, '#/config/conta');
  tecla('Home');
  assert.equal(w.location.hash, '#/config');
  assert.equal(tecla('Tab'), false);
  assert.equal(w.location.hash, '#/config');
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

/* ---------- T35: modo somente leitura (ACE-03.2, ACE-03.3) ---------- */
const AVISO_LEITURA = 'Você está com acesso somente leitura';

/** Abre o mandato m-a como Lia pelo Store.abrir real; o papel de Lia vem da linha dela em `membros` (mutável em `estado`). */
async function abreComo(papel: string) {
  const estado = { papel };
  const j = janela({
    responde: (url, metodo) => {
      if (metodo !== 'GET') return undefined;
      if (url.includes('/rest/v1/mandatos?id=eq.m-a')) return [{ ...MANDATO }];
      if (url.includes('/rest/v1/membros?mandato_id=eq.m-a'))
        return [{ user_id: 'uid-lia', nome: 'Lia', papel: estado.papel }, { user_id: 'uid-mariana', nome: 'Mariana', papel: 'coordenacao' }];
      if (url.includes('/rest/v1/eventos?')) return [];
      return undefined;
    },
  });
  j.w.Store.usuario = { id: 'uid-lia', nome: 'Lia', email: 'lia@gabinete.test' };
  await j.w.Store.abrir('m-a');
  j.pedidos.length = 0; // daqui em diante, só o que a pessoa faz
  return { ...j, estado };
}
const avisoDe = (d: ReturnType<typeof documento>) => d.corpo.filhos.find((e) => e.id === 'avisoLeitura' && !e.removido);

test('ao abrir um mandato com papel leitura, o body ganha so-leitura e aparece o aviso de somente leitura (ACE-03.3)', async () => {
  const { document } = await abreComo('leitura');
  assert.equal(document.body.classList.contains('so-leitura'), true);
  assert.equal(avisoDe(document)?.textContent, AVISO_LEITURA);
});

test('com papel assessoria ou coordenacao, o Guia fica como hoje: sem so-leitura e sem aviso (ACE-03.3)', async () => {
  for (const papel of ['assessoria', 'coordenacao']) {
    const { document } = await abreComo(papel);
    assert.equal(document.body.classList.contains('so-leitura'), false, papel);
    assert.equal(avisoDe(document), undefined, papel);
  }
});

test('trocar para um mandato em que a pessoa é coordenacao tira a classe e o aviso (ACE-03.3)', async () => {
  const { w, document, estado } = await abreComo('leitura');
  estado.papel = 'coordenacao';
  await w.Store.abrir('m-a');
  assert.equal(document.body.classList.contains('so-leitura'), false);
  assert.equal(avisoDe(document), undefined);
});

test('como leitura, Store.salvar, gravar, atualizar e registrar não fazem nenhuma requisição (ACE-03.2)', async () => {
  const { w, pedidos, document } = await abreComo('leitura');
  w.Store.salvar();
  // a guarda do próprio salvar: sem ela o "Salvando…" ficaria preso, sem gravação que o troque
  assert.equal(document.salvo.textContent, '');
  await w.Store.gravar();
  await w.Store.atualizar({ partido: 'NOVO' });
  await w.Store.registrar(1, 'm1.persona', 'A persona');
  assert.deepEqual(pedidos.map((p) => `${p.metodo} ${p.url}`), []);
});

test('como assessoria, as mesmas chamadas gravam como hoje: PATCH em mandatos e POST em eventos (ACE-03.2)', async () => {
  const { w, pedidos } = await abreComo('assessoria');
  w.Store.salvar();
  await new Promise((r) => setImmediate(r));
  await w.Store.atualizar({ partido: 'NOVO' });
  await w.Store.registrar(1, 'm1.persona', 'A persona');
  const rotas = pedidos.map((p) => `${p.metodo} ${p.url.replace(/^https:\/\/[^/]+\/rest\/v1\//, '')}`);
  assert.deepEqual(rotas, ['PATCH mandatos?id=eq.m-a', 'PATCH mandatos?id=eq.m-a', 'POST eventos']);
  assert.ok(pedidos[0].corpo && 'dados' in pedidos[0].corpo);
  assert.deepEqual({ ...pedidos[1].corpo }, { partido: 'NOVO' });
  assert.equal(pedidos[2].corpo?.mandato_id, 'm-a');
});

/* ---------- T36: aviso de consentimento sem "código de convite" (ACE-07.4) ---------- */
const CORPO_TS = readFileSync(new URL('../lib/legacyBody.ts', import.meta.url), 'utf8');
const CORPO = JSON.parse(/const corpo: string = ("[\s\S]*");/.exec(CORPO_TS)![1]) as string;
const avisoLgpd = (corpo: string) => /<div class="lgpd oculto" id="blocoLgpd">([\s\S]*?)<\/div>/.exec(corpo)![1];
/** O aviso de consentimento (#blocoLgpd) como estava antes da feature, copiado de lib/legacyBody.ts. */
const AVISO_ORIGINAL = '\n      <strong>Proteção de dados pessoais (LGPD, Lei nº 13.709/2018).</strong>\n' +
  '      Ao criar conta, a Legisla Brasil trata seu nome e e-mail para autenticação e para identificar quem preencheu\n' +
  '      cada registro do mandato. Se você se indicar como responsável pelo preenchimento, também tratamos o cargo e,\n' +
  '      caso informe, o telefone de contato. Os conteúdos registrados ficam vinculados ao mandato cadastrado e são\n' +
  '      acessíveis a quem tiver o código de convite dele. A base legal é o seu consentimento, que pode ser revogado a\n' +
  '      qualquer momento pela exclusão da conta. Você pode solicitar acesso, correção, portabilidade ou eliminação dos\n' +
  '      seus dados pelo endereço <a href="mailto:contato@legislabrasil.org">contato@legislabrasil.org</a>.\n    ';
/** sha256 do corpo inteiro do Guia (lib/legacyBody.ts) antes da feature. */
const HASH_CORPO_ORIGINAL = '29526bcd82757450bcd9a6cb3bd18b3f713c0b3166dac77e3e49bec3219c63fb';

test('o aviso de consentimento do Guia fala em "link de convite" (ACE-07.4)', () => {
  assert.equal(avisoLgpd(CORPO).includes('acessíveis a quem tiver o link de convite dele.'), true);
});

test('o aviso de consentimento do Guia não fala mais em "código de convite" (ACE-07.4)', () => {
  assert.equal(avisoLgpd(CORPO).includes('código de convite'), false);
});

test('o restante do aviso é idêntico ao texto original, palavra por palavra (ACE-07.4)', () => {
  assert.equal(avisoLgpd(CORPO), AVISO_ORIGINAL.replace('código de convite', 'link de convite'));
});

test('fora dessa expressão, o corpo do Guia não muda: desfazer a troca devolve o corpo original (ACE-07.4)', () => {
  assert.equal(createHash('sha256').update(CORPO.replace('link de convite', 'código de convite')).digest('hex'), HASH_CORPO_ORIGINAL);
});

/* ---------- primeiro acesso: perfil antes do Guia (PAG-02.1, 02.2, 02.15, 02.16, PAG-04.1, 04.6) ---------- */
interface Pessoa { legisla?: boolean; perfil?: boolean; mandatos?: unknown[]; falhaPerfil?: boolean; falhaLegisla?: boolean; falhaMandatos?: boolean }

/** App.entrou real, com a pessoa u1 e as respostas das consultas que o Guia faz (equipe_legisla, perfis, membros). */
function entrando(p: Pessoa, semEquipe = false) {
  const j = janela({
    responde: (url, metodo) => {
      if (metodo !== 'GET') return undefined;
      if (url.includes('/rest/v1/equipe_legisla?')) { if (p.falhaLegisla) throw new Error('rede'); return p.legisla ? [{ user_id: 'u1' }] : []; }
      if (url.includes('/rest/v1/perfis?')) { if (p.falhaPerfil) throw new Error('rede'); return p.perfil ? [{ user_id: 'u1' }] : []; }
      if (url.includes('/rest/v1/membros?select=papel,mandatos(*)')) { if (p.falhaMandatos) throw new Error('rede'); return (p.mandatos ?? []).map((m) => ({ papel: 'coordenacao', mandatos: m })); }
      if (url.includes('/rest/v1/mandatos?id=eq.')) return [{ ...MANDATO }];
      if (url.includes('/rest/v1/membros?mandato_id=')) return [{ user_id: 'u1', nome: 'Lia', papel: 'coordenacao' }];
      if (url.includes('/rest/v1/eventos?')) return [];
      return undefined;
    },
  });
  j.w.Store.usuario = { id: 'u1', nome: 'Lia', email: 'lia@gabinete.test' };
  const aberturaDoCadastro: string[] = [];
  j.w.Telas.primeiroAcesso = () => { aberturaDoCadastro.push('cadastro'); };
  if (semEquipe) j.guardadoSessao.set('legisla.semEquipe', '1');
  const leituras = () => j.pedidos.map((q) => q.url.replace(/^https:\/\/[^/]+\/rest\/v1\//, ''));
  return { ...j, aberturaDoCadastro, leituras };
}

test('sem perfil e fora da equipe Legisla, o Guia abre /primeiro-acesso?volta=guia sem ler os mandatos (PAG-02.1, 02.2)', async () => {
  const { w, redirecionou, leituras } = entrando({ mandatos: [{ ...MANDATO }] });
  await w.App.entrou();
  assert.deepEqual(redirecionou, ['/primeiro-acesso?volta=guia']);
  assert.equal(leituras().some((u) => u.startsWith('membros?select=papel')), false);
});

test('antes de ler os mandatos, o Guia consulta equipe_legisla e perfis pela pessoa da sessão (PAG-02.1)', async () => {
  const { w, leituras } = entrando({ perfil: true, mandatos: [{ ...MANDATO }] });
  await w.App.entrou().catch(() => {}); // o resto da abertura usa telas que o documento simulado não tem
  const l = leituras();
  assert.ok(l.includes('equipe_legisla?select=user_id&user_id=eq.u1'));
  assert.ok(l.includes('perfis?select=user_id&user_id=eq.u1'));
  const iMembros = l.findIndex((u) => u.startsWith('membros?select=papel'));
  assert.ok(iMembros > l.indexOf('equipe_legisla?select=user_id&user_id=eq.u1'));
  assert.ok(iMembros > l.indexOf('perfis?select=user_id&user_id=eq.u1'));
});

test('com perfil e mandato, o Guia abre como hoje, sem redirecionar (PAG-02.15)', async () => {
  const { w, redirecionou, aberturaDoCadastro, document } = entrando({ perfil: true, mandatos: [{ ...MANDATO }] });
  await w.App.entrou().catch(() => {}); // o resto da abertura usa telas que o documento simulado não tem
  assert.deepEqual(redirecionou, []);
  assert.deepEqual(aberturaDoCadastro, []);
  assert.equal(document.getElementById('app').classList.contains('oculto'), false);
});

test('quem é da equipe Legisla abre o Guia sem perfil e sem redirecionar (PAG-02.16)', async () => {
  const { w, redirecionou, document } = entrando({ legisla: true, perfil: false, mandatos: [{ ...MANDATO }] });
  await w.App.entrou().catch(() => {});
  assert.deepEqual(redirecionou, []);
  assert.equal(document.getElementById('app').classList.contains('oculto'), false);
});

/* Falha na consulta de perfil: caixa de erro com "Tentar de novo" (spec, Assumption "Falha ao consultar o perfil no Guia"). */
const ERRO_PERFIL = 'Não foi possível carregar seus dados. Tente de novo.';
type Botao = El & { onclick: () => unknown };
const caixasDeErro = (d: ReturnType<typeof documento>) => d.body.filhos.filter((e) => e.id === 'erroPerfil' && !e.removido);
function caixaDeErro(d: ReturnType<typeof documento>) {
  const cx = caixasDeErro(d);
  assert.equal(cx.length, 1, 'uma caixa de erro à mostra');
  const [mensagem, botao] = cx[0].filhos;
  return { caixa: cx[0], mensagem, botao: botao as Botao };
}

test('falha na consulta de perfil não manda ao formulário: mostra a caixa "Não foi possível carregar seus dados. Tente de novo." com o botão "Tentar de novo", sem ler os mandatos', async () => {
  const { w, redirecionou, leituras, document, aberturaDoCadastro } = entrando({ falhaPerfil: true, mandatos: [{ ...MANDATO }] });
  await w.App.entrou();
  assert.deepEqual(redirecionou, []);
  assert.deepEqual(aberturaDoCadastro, []);
  assert.equal(leituras().some((u) => u.startsWith('membros?select=papel')), false);
  const { mensagem, botao } = caixaDeErro(document);
  assert.equal(mensagem.textContent, ERRO_PERFIL);
  assert.equal(mensagem.atributos.role, 'alert');
  assert.equal(botao.textContent, 'Tentar de novo');
  assert.equal(botao.atributos.type, 'button');
});

test('"Tentar de novo" refaz a entrada: falhando de novo a caixa volta, sem formulário; com a consulta funcionando a caixa sai e o Guia abre', async () => {
  const p: Pessoa = { falhaPerfil: true, perfil: true, mandatos: [{ ...MANDATO }] };
  const { w, redirecionou, leituras, document } = entrando(p);
  await w.App.entrou();
  const primeira = caixaDeErro(document);
  await primeira.botao.onclick();
  assert.equal(primeira.caixa.removido, true);
  const segunda = caixaDeErro(document); // continua falhando: uma caixa nova, nenhuma ida ao formulário
  assert.equal(segunda.mensagem.textContent, ERRO_PERFIL);
  assert.deepEqual(redirecionou, []);
  p.falhaPerfil = false;
  await Promise.resolve(segunda.botao.onclick()).catch(() => {}); // o resto da abertura usa telas que o documento simulado não tem
  assert.deepEqual(caixasDeErro(document), []);
  assert.deepEqual(redirecionou, []);
  assert.ok(leituras().some((u) => u.startsWith('membros?select=papel')), 'com a consulta funcionando, o Guia lê os mandatos');
  assert.equal(document.getElementById('app').classList.contains('oculto'), false);
});

test('falha na consulta de equipe_legisla mostra a mesma caixa "Não foi possível carregar seus dados. Tente de novo." com "Tentar de novo", sem formulário e sem ler os mandatos; com a consulta funcionando o Guia abre', async () => {
  const p: Pessoa = { falhaLegisla: true, perfil: true, mandatos: [{ ...MANDATO }] };
  const { w, redirecionou, leituras, document, aberturaDoCadastro } = entrando(p);
  await w.App.entrou();
  assert.deepEqual(redirecionou, []);
  assert.deepEqual(aberturaDoCadastro, []);
  assert.equal(leituras().some((u) => u.startsWith('membros?select=papel')), false);
  const { mensagem, botao } = caixaDeErro(document);
  assert.equal(mensagem.textContent, ERRO_PERFIL);
  assert.equal(botao.textContent, 'Tentar de novo');
  p.falhaLegisla = false;
  await Promise.resolve(botao.onclick()).catch(() => {}); // o resto da abertura usa telas que o documento simulado não tem
  assert.deepEqual(caixasDeErro(document), []);
  assert.deepEqual(redirecionou, []);
  assert.ok(leituras().some((u) => u.startsWith('membros?select=papel')), 'com a consulta funcionando, o Guia lê os mandatos');
  assert.equal(document.getElementById('app').classList.contains('oculto'), false);
});

test('falha na leitura dos mandatos da trava mostra a mesma caixa "Não foi possível carregar seus dados. Tente de novo." com "Tentar de novo", sem formulário; com a leitura funcionando o Guia abre', async () => {
  const p: Pessoa = { falhaMandatos: true, perfil: true, mandatos: [{ ...MANDATO }] };
  const { w, redirecionou, document, aberturaDoCadastro, leituras } = entrando(p);
  await w.App.entrou();
  assert.deepEqual(redirecionou, []);
  assert.deepEqual(aberturaDoCadastro, []);
  assert.ok(leituras().some((u) => u.startsWith('membros?select=papel')), 'a leitura dos mandatos foi tentada');
  const { mensagem, botao } = caixaDeErro(document);
  assert.equal(mensagem.textContent, ERRO_PERFIL);
  assert.equal(botao.textContent, 'Tentar de novo');
  p.falhaMandatos = false;
  await Promise.resolve(botao.onclick()).catch(() => {}); // o resto da abertura usa telas que o documento simulado não tem
  assert.deepEqual(caixasDeErro(document), []);
  assert.deepEqual(redirecionou, []);
  assert.equal(document.getElementById('app').classList.contains('oculto'), false);
});

test('com perfil, sem mandato e sem a marca "Ainda não", o Guia abre /primeiro-acesso para a pergunta (PAG-04.1)', async () => {
  const { w, redirecionou, aberturaDoCadastro } = entrando({ perfil: true, mandatos: [] });
  await w.App.entrou();
  assert.deepEqual(redirecionou, ['/primeiro-acesso']);
  assert.deepEqual(aberturaDoCadastro, []);
});

test('com perfil, sem mandato e com legisla.semEquipe, o Guia abre o cadastro do mandato (PAG-04.6)', async () => {
  const { w, redirecionou, aberturaDoCadastro } = entrando({ perfil: true, mandatos: [] }, true);
  await w.App.entrou();
  assert.deepEqual(aberturaDoCadastro, ['cadastro']);
  assert.deepEqual(redirecionou, []);
});

test('a marca "Ainda não" não vale sem perfil: continua indo ao formulário (PAG-02.1)', async () => {
  const { w, redirecionou, aberturaDoCadastro } = entrando({ perfil: false, mandatos: [] }, true);
  await w.App.entrou();
  assert.deepEqual(redirecionou, ['/primeiro-acesso?volta=guia']);
  assert.deepEqual(aberturaDoCadastro, []);
});

/* ---------- login só com Google (PAG-01.4, PAG-05.1, 05.2, 05.3) ---------- */
test('Store.criarConta recusa com "Entre com o Google." e sem nenhuma chamada de rede (PAG-05.1)', async () => {
  const { w, pedidos } = janela();
  await assert.rejects(w.Store.criarConta('a@b.org', 'segredo123', 'Ana'), { message: 'Entre com o Google.' });
  assert.equal(pedidos.length, 0);
});

test('Store.entrar recusa com "Entre com o Google." e sem nenhuma chamada de rede (PAG-05.1)', async () => {
  const { w, pedidos } = janela();
  await assert.rejects(w.Store.entrar('a@b.org', 'segredo123'), { message: 'Entre com o Google.' });
  assert.equal(pedidos.length, 0);
});

test('erro do Google na volta da entrada mostra "Não foi possível entrar com o Google. Tente de novo." (PAG-01.4)', async () => {
  const { w, document } = janela({ hash: '#error_description=Acesso+negado+pelo+Google' });
  await w.App.iniciar();
  assert.match(document.getElementById('erroEntrada').innerHTML, /Não foi possível entrar com o Google\. Tente de novo\./);
  assert.doesNotMatch(document.getElementById('erroEntrada').innerHTML, /Acesso negado/);
});

test('token vencido: o Guia renova pelo refresh_token e não usa senha (PAG-05.3)', async () => {
  let consultasAoUsuario = 0;
  const { w, pedidos } = janela({
    tok: JSON.stringify({ access_token: 'vencido', refresh_token: 'r1' }),
    responde: (url, metodo) => {
      if (url.endsWith('/auth/v1/user')) return ++consultasAoUsuario === 1 ? { __status: 401 } : { id: 'u1', email: 'lia@gabinete.test', user_metadata: { nome: 'Lia' } };
      if (metodo === 'POST' && url.endsWith('/auth/v1/token?grant_type=refresh_token')) return { access_token: 'novo', refresh_token: 'r2', user: { id: 'u1' } };
      return undefined;
    },
  });
  const u = await w.Store.sessao();
  assert.equal(u?.id, 'u1');
  const renovacao = pedidos.filter((p) => p.url.includes('/auth/v1/token'));
  assert.deepEqual(renovacao.map((p) => [p.url.split('/auth/v1/')[1], { ...p.corpo }]), [['token?grant_type=refresh_token', { refresh_token: 'r1' }]]);
});

/* Nenhum caminho do app chama o cadastro com senha nem o login por senha, nem trata e-mail não confirmado (PAG-05.1, 05.2). */
function arquivosDe(pasta: URL): URL[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? arquivosDe(new URL(`${e.name}/`, pasta)) : [new URL(e.name, pasta)]));
}

test('app/, lib/ e acesso.js não têm uso de signup, grant_type=password, email_not_confirmed nem a mensagem de confirmar o e-mail (PAG-05.1, 05.2)', () => {
  const raiz = new URL('../', import.meta.url);
  const alvos = [...arquivosDe(new URL('app/', raiz)), ...arquivosDe(new URL('lib/', raiz)), new URL('public/legacy/acesso.js', raiz)]
    .filter((u) => /\.(ts|tsx|js)$/.test(u.pathname));
  assert.ok(alvos.length > 20);
  const achados = alvos.flatMap((u) => {
    const texto = readFileSync(u, 'utf8');
    return [/signup/i, /grant_type=password/, /email_not_confirmed/, /Confirme o e-mail/i].filter((re) => re.test(texto)).map((re) => `${u.pathname}: ${re}`);
  });
  assert.deepEqual(achados, []);
});
