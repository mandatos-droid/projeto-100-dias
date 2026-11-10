import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/* resumo-tela.js monta a nova tela #/resumo (blocos recolhíveis) sobre o Guia legado. Aqui ele roda numa "janela" com a
   cadeia real de scripts do Guia (conteudo, nucleo, app, guia, resumo, novos, m2 a m5, m1), na ordem da página, para que
   todas as sobreposições de Resumo.ex valham como no navegador. O DOM é o mínimo que esses scripts tocam ao carregar. */
const ler = (nome: string) => readFileSync(new URL(`../public/legacy/${nome}.js`, import.meta.url), 'utf8');
const CADEIA = ['conteudo', 'nucleo', 'app', 'guia', 'resumo', 'novos', 'm2', 'm3', 'm4', 'm5', 'm1'];
const PAGINA = readFileSync(new URL('../app/guia/page.tsx', import.meta.url), 'utf8');

type Ex = { id: string; t: string; tipo: string };
type Missao = { n: number; cor: string; curto: string; prazoTxt: string; exercicios: Ex[] };
interface Janela {
  MISSOES: Missao[];
  D: Record<string, unknown>;
  Resumo: { vivo?: boolean; ex(ex: Ex): string; missao(m: Missao): string };
  Telas: { estadoTxt(ex: Ex, e: string): string };
  estadoEx(ex: Ex): string;
  progMissao(m: Missao): { feitos: number; total: number };
  ResumoTela: { html(): string; previa(h: string): string; abreMissao(m: Missao): boolean; abreExercicio(ex: Ex): boolean };
}

function elemento(): Record<string, unknown> {
  return {
    style: { setProperty() {} }, classList: { toggle() {}, add() {}, remove() {}, contains: () => false },
    setAttribute() {}, getAttribute: () => null, appendChild: (n: unknown) => n, insertBefore: (n: unknown) => n,
    querySelector: () => null, querySelectorAll: () => [], addEventListener() {},
  };
}

/** Janela do Guia com os dados `D`; `comTela` carrega o resumo-tela.js por cima, como a página faz. */
function guia(D: Record<string, unknown>, comTela = true): Janela {
  const ctx: Record<string, unknown> = {
    console,
    location: { hostname: 'localhost', hash: '#/resumo' },
    document: { createElement: elemento, body: elemento(), getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener() {} },
    localStorage: { getItem: () => null, setItem() {} },
    history: { pushState() {} },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const n of CADEIA) vm.runInContext(ler(n), ctx, { filename: `${n}.js` });
  /* esc e rich do nucleo.js usam o DOM; aqui ficam versões de texto (rich mantém o HTML, como o sanitizador faz com tags permitidas) */
  vm.runInContext(`esc=function(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')};rich=function(s){return String(s)};`, ctx);
  if (comTela) vm.runInContext(ler('resumo-tela'), ctx, { filename: 'resumo-tela.js' });
  ctx.D = D;
  return ctx as unknown as Janela;
}

/** Como a Telas.resumo faz: Resumo.vivo ligado enquanto o HTML é montado. */
function comVivo<T>(w: Janela, f: () => T): T {
  w.Resumo.vivo = true;
  try { return f(); } finally { w.Resumo.vivo = false; }
}
const tela = (w: Janela) => comVivo(w, () => w.ResumoTela.html());
const rx = (w: Janela, ex: Ex) => comVivo(w, () => w.Resumo.ex(ex));
const exDe = (w: Janela, id: string) => w.MISSOES.flatMap((m) => m.exercicios).find((e) => e.id === id)!;

const pedacos = (h: string, abre: string) => h.split(abre).slice(1).map((p) => abre + p);
const missoes = (h: string) => pedacos(h, '<details class="missao"');
const exercicios = (bloco: string) => pedacos(bloco, '<details class="ex"');
const blocoEx = (h: string, id: string) => missoes(h).flatMap(exercicios).find((b) => b.includes(`href="#/m/${id[1]}/${id}"`))!;
const sumario = (b: string) => b.slice(0, b.indexOf('</summary>'));
const aberto = (b: string) => /^<details class="(missao|ex)"[^>]*\sopen>/.test(b);
const previaDe = (b: string) => /<span class="ex-p">([^]*?)<\/span>/.exec(b)![1];

/* m1.persona concluída, m1.conjuntura e m1.frag em andamento, m1.oportunidades vazia, m2.funcoes em andamento (formato antigo) */
const DADOS = () => ({
  campos: { 'm1.q1': 'Professora de <b>história</b>, sindicalista.', 'm1.q5': 'Partido com 2 cadeiras na Casa.', 'm2.f1': 'Paulo Ribeiro' },
  feitos: { 'm1.persona': true },
  frags: [{ t: 'Oratória', mp: 'P' }],
  relacoes: {},
});

/* ---------- estrutura (RES-01.1, RES-01.2) ---------- */
test('a tela lista as 5 missões como <details class="missao">, com "Missão n", título curto, prazo e feitos/total (RES-01.1)', () => {
  const w = guia(DADOS());
  const ms = missoes(tela(w));
  assert.equal(ms.length, 5);
  assert.deepEqual(ms.map((b) => /<span class="m-tit">([^<]*)<\/span>/.exec(b)![1]),
    ['Prepare sua chegada', 'Estruture a equipe', 'Defina o rumo', 'Construa capital político', 'Garanta o avanço']);
  w.MISSOES.forEach((m, i) => {
    const s = sumario(ms[i]);
    const p = w.progMissao(m);
    assert.ok(s.includes(`<span class="m-eb">Missão ${m.n}</span>`), `Missão ${m.n}`);
    assert.ok(s.includes(`<span class="m-prazo">${m.prazoTxt}</span>`), m.prazoTxt);
    assert.ok(s.includes(`<b>${p.feitos}/${p.total}</b>`), `${p.feitos}/${p.total}`);
  });
  assert.ok(sumario(ms[0]).includes('<b>1/4</b>'));
  assert.ok(sumario(ms[0]).includes('<span class="m-prazo">até o 15º dia</span>'));
  assert.ok(sumario(ms[3]).includes('<b>0/3</b>'));
});

test('cada missão traz um <details class="ex"> por exercício, na ordem do Guia: 16 no total (RES-01.1)', () => {
  const w = guia(DADOS());
  const ms = missoes(tela(w));
  ms.forEach((b, i) => {
    const titulos = exercicios(b).map((e) => /<a class="ex-link" href="[^"]*">([^<]*)<\/a>/.exec(e)![1]);
    assert.deepEqual(titulos, Array.from(w.MISSOES[i].exercicios, (e) => e.t));
  });
  assert.equal(ms.flatMap(exercicios).length, 16);
});

test('o <summary> do exercício tem o título com link para #/m/n/id, o selo do estado e o texto de Telas.estadoTxt (RES-01.2)', () => {
  const w = guia(DADOS());
  const h = tela(w);
  const persona = sumario(blocoEx(h, 'm1.persona'));
  assert.ok(persona.includes('<a class="ex-link" href="#/m/1/m1.persona">A persona</a><span class="selo ok">concluído</span>'));
  assert.ok(persona.includes('<span class="ex-n">Concluído · 1 de 3 respostas</span>'));
  assert.ok(sumario(blocoEx(h, 'm1.conjuntura')).includes('<span class="selo andamento">em andamento</span>'));
  assert.ok(sumario(blocoEx(h, 'm1.oportunidades')).includes('<span class="selo nao">não iniciado</span>'));
  for (const m of w.MISSOES) for (const ex of m.exercicios) {
    const s = sumario(blocoEx(h, ex.id));
    assert.ok(s.includes(`href="#/m/${m.n}/${ex.id}"`), ex.id);
    assert.ok(s.includes(`<span class="ex-n">${w.Telas.estadoTxt(ex, w.estadoEx(ex))}</span>`), ex.id);
  }
});

/* ---------- abertura inicial (RES-01.3, RES-01.4) ---------- */
test('a missão vem aberta só se algum exercício não está "não iniciado"; sem nenhuma resposta, todas vêm fechadas (RES-01.3, edge case)', () => {
  const w = guia(DADOS());
  assert.deepEqual(missoes(tela(w)).map(aberto), [true, true, false, false, false]);
  assert.deepEqual(Array.from(w.MISSOES, (m) => w.ResumoTela.abreMissao(m)), [true, true, false, false, false]);
  const vazio = tela(guia({ campos: {} }));
  assert.deepEqual(missoes(vazio).map(aberto), [false, false, false, false, false]);
  assert.equal(missoes(vazio).flatMap(exercicios).filter(aberto).length, 0);
});

test('exercício "não iniciado" vem fechado, com a caixa "Nenhuma resposta registrada ainda." e o link "Começar este exercício →" (RES-01.4)', () => {
  const w = guia(DADOS());
  const b = blocoEx(tela(w), 'm1.oportunidades');
  assert.equal(aberto(b), false);
  assert.equal(w.ResumoTela.abreExercicio(exDe(w, 'm1.oportunidades')), false);
  assert.ok(b.includes('<div class="ex-corpo"><div class="m-vazia"><span>Nenhuma resposta registrada ainda.</span>' +
    '<a class="ir" href="#/m/1/m1.oportunidades">Começar este exercício →</a></div></div></details>'));
  assert.equal(b.includes('<dl class="cmp">'), false);
});

test('exercício concluído ou em andamento vem aberto e o corpo é a saída de Resumo.ex(ex) (RES-01.4)', () => {
  const w = guia(DADOS());
  const h = tela(w);
  const persona = blocoEx(h, 'm1.persona');
  assert.equal(aberto(persona), true);
  assert.ok(persona.includes(`<div class="ex-corpo">${rx(w, exDe(w, 'm1.persona'))}</div></details>`));
  const conj = blocoEx(h, 'm1.conjuntura');
  assert.equal(aberto(conj), true);
  assert.ok(conj.includes(`<div class="ex-corpo">${rx(w, exDe(w, 'm1.conjuntura'))}<a class="ir"`));
  assert.ok(rx(w, exDe(w, 'm1.conjuntura')).includes('Partido com 2 cadeiras na Casa.'));
});

test('exercício em andamento termina com "Continuar este exercício →" para #/m/n/id; concluído e vazio não têm o link (RES-10)', () => {
  const w = guia(DADOS());
  const h = tela(w);
  assert.ok(blocoEx(h, 'm1.conjuntura').includes('<a class="ir" href="#/m/1/m1.conjuntura">Continuar este exercício →</a></div></details>'));
  assert.ok(blocoEx(h, 'm1.frag').includes('<a class="ir" href="#/m/1/m1.frag">Continuar este exercício →</a></div></details>'));
  assert.equal(blocoEx(h, 'm1.persona').includes('Continuar este exercício'), false);
  assert.equal(blocoEx(h, 'm1.oportunidades').includes('Continuar este exercício'), false);
});

/* ---------- prévia (RES-01.2 e edge cases) ---------- */
test('previa() devolve o texto puro da primeira resposta preenchida, pulando as vazias (RES-01.2)', () => {
  const p = guia(DADOS()).ResumoTela.previa;
  assert.equal(p('<dl class="cmp"><dt>1. Quem é?</dt><dd><span class="sem">não preenchido</span></dd>' +
    '<dt>2. E depois?</dt><dd><p>Professora de <b>história</b>,</p><ul><li>sindicalista</li></ul></dd><dt>3</dt><dd>outra</dd></dl>'),
  'Professora de história, sindicalista');
  assert.equal(p('<dd>Tom &amp; Jerry&nbsp;juntos</dd>'), 'Tom & Jerry juntos');
});

test('a prévia do exercício fechado aparece no <summary> com a primeira resposta (RES-01.2)', () => {
  const w = guia(DADOS());
  assert.equal(previaDe(blocoEx(tela(w), 'm1.persona')), 'Professora de história, sindicalista.');
});

test('previa() corta texto longo em até 160 caracteres, mesmo sem espaços (edge case)', () => {
  const p = guia(DADOS()).ResumoTela.previa;
  const longo = p(`<dd>${'a'.repeat(500)}</dd>`);
  assert.equal(longo.length, 160);
  assert.ok(longo.endsWith('…'));
  assert.equal(p('<dd>curto</dd>'), 'curto');
  assert.equal(p(`<dd>${'b'.repeat(160)}</dd>`), 'b'.repeat(160));
});

test('previa() sem resposta devolve "não preenchido", e o exercício vazio mostra isso no <summary> (edge case)', () => {
  const w = guia(DADOS());
  assert.equal(w.ResumoTela.previa(''), 'não preenchido');
  assert.equal(w.ResumoTela.previa('<dl class="cmp"><dt>Q</dt><dd><span class="sem">não preenchido</span></dd></dl>'), 'não preenchido');
  assert.equal(previaDe(blocoEx(tela(w), 'm1.oportunidades')), 'não preenchido');
});

test('resposta com HTML vira texto puro na prévia e não vaza marcação para a tela (edge case)', () => {
  const p = guia(DADOS()).ResumoTela.previa;
  const t = p(`<dd><img src="x" onerror="alert(1)"><script>x</script>${'z'.repeat(300)}</dd>`);
  assert.doesNotMatch(t, /[<>]/);
  assert.ok(t.length <= 160);
  const w = guia({ campos: { 'm1.q1': '&lt;b&gt;negrito&lt;/b&gt; <i>itálico</i>' } });
  const prev = previaDe(blocoEx(tela(w), 'm1.persona'));
  assert.equal(prev, '&lt;b&gt;negrito&lt;/b&gt; itálico');
});

/* ---------- pontos de montagem das ilhas (design) ---------- */
test('o corpo de "A escalação do time" (tipo funcoes) é o ponto de montagem da ilha resumo-equipe (design)', () => {
  const w = guia(DADOS());
  const b = blocoEx(tela(w), 'm2.funcoes');
  assert.ok(b.includes('<div class="ex-corpo"><div class="ilha" data-ilha="resumo-equipe"></div>' +
    '<a class="ir" href="#/m/2/m2.funcoes">Continuar este exercício →</a></div></details>'));
  const feito = guia({ ...DADOS(), feitos: { 'm2.funcoes': true } });
  assert.ok(blocoEx(tela(feito), 'm2.funcoes').includes('<div class="ex-corpo"><div class="ilha" data-ilha="resumo-equipe"></div></div></details>'));
  assert.equal(tela(w).split('data-ilha="resumo-equipe"').length - 1, 1);
});

test('o cabeçalho da tela traz o ponto de montagem da ilha resumo-retrato, antes das missões (design)', () => {
  const h = tela(guia(DADOS()));
  const i = h.indexOf('<div class="ilha" data-ilha="resumo-retrato"></div>');
  assert.ok(i > h.indexOf('<h1>Resumo do preenchimento</h1>'));
  assert.ok(i < h.indexOf('<details class="missao"'));
  assert.equal(h.split('data-ilha="resumo-retrato"').length - 1, 1);
});

/* ---------- nada muda fora da tela (RES-12.1) ---------- */
const RICO = () => ({
  campos: {
    'm1.q1': 'Professora', 'm1.q3b': 'Senado', 'm1.q4b': 'Vereadora do interior', 'm1.q5': 'Análise do partido', 'm1.q7': 'Expectativas',
    'm2.f1': 'Paulo Ribeiro', 'm2.f2': 'Vaga *', 'm4.k1': true, 'm4.k3': true,
  },
  feitos: { 'm1.persona': true, 'm4.acoes': true },
  frags: [{ t: 'Oratória', mp: 'P' }, { t: 'Emendas', mp: 'M' }, { t: 'Sem classe' }],
  relacoes: { 123: { status: 'aliado', nome: 'JOSE DA SILVA', partido: 'PSB', cargo: 'Deputado(a) Estadual', uf: 'SP', votos: 61204 } },
  metas: [{ id: 'mt1', texto: 'Aprovar a lei', resp: 'Ana' }],
  acoes: [{ id: 'a1', bingo: 'articulacao', i: 0, titulo: 'Reunião com a Mesa', resp: 'Ana', prazo: '2027-03-08' }],
  comissoes: [{ id: 'c1', esp: 'Comissão de Saúde', papel: 'Titular', pq: 'Bandeira' }],
});

test('Resumo.ex e Resumo.missao devolvem o mesmo HTML com e sem o resumo-tela.js, para os mesmos dados (RES-12.1)', () => {
  for (const dados of [RICO, () => ({ campos: {} })]) {
    const com = guia(dados());
    const sem = guia(dados(), false);
    assert.equal(typeof com.ResumoTela, 'object');
    assert.equal(typeof sem.ResumoTela, 'undefined');
    com.MISSOES.forEach((m, i) => {
      assert.equal(com.Resumo.missao(m), sem.Resumo.missao(sem.MISSOES[i]), `missão ${m.n}`);
      m.exercicios.forEach((ex, j) => assert.equal(com.Resumo.ex(ex), sem.Resumo.ex(sem.MISSOES[i].exercicios[j]), ex.id));
    });
  }
});

/* ---------- carga na página do Guia ---------- */
test('resumo-tela.js entra na página do Guia depois de m1.js e antes de sugestoes.js (design)', () => {
  const lista = /const SCRIPTS = \[([^\]]*)\]/.exec(PAGINA)![1].replace(/['\s]/g, '').split(',');
  assert.equal(lista.indexOf('resumo-tela'), lista.indexOf('m1') + 1);
  assert.equal(lista.indexOf('sugestoes'), lista.indexOf('resumo-tela') + 1);
});

test('resumo-tela.js carrega sobre a cadeia real do Guia sem erro e expõe ResumoTela', () => {
  let w: Janela | undefined;
  assert.doesNotThrow(() => { w = guia({ campos: {} }); });
  assert.deepEqual(Object.keys(w!.ResumoTela).sort(), ['abreExercicio', 'abreMissao', 'html', 'previa']);
  assert.doesNotThrow(() => tela(w!));
});
