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

function janela(antesM1 = ''): Janela {
  const ctx: Record<string, unknown> = {
    esc: (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
    D: { campos: {}, frags: [] },
  };
  vm.createContext(ctx);
  vm.runInContext(`${CONTEUDO};this.MISSOES=MISSOES;`, ctx);
  vm.runInContext(`${GUIA};this.Guia=Guia;this.Comp=Comp;`, ctx);
  if (antesM1) vm.runInContext(antesM1, ctx);
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
const chaves = (h: string) => [...h.matchAll(/<(?:textarea|select) data-k="([^"]+)"/g)].map((m) => m[1]);

/* ---------- PER-07 a PER-09 (antes SUG-16): pergunta 3 da Persona ---------- */
const CONQUISTAS = ['m1.q3c1', 'm1.q3c2', 'm1.q3c3'];
test('1.3 mostra o texto "Registre até 3:" e 3 caixas de conquista mais o próximo cargo, sem a caixa única antiga (PER-07)', () => {
  const h = pergunta(janela(), 'm1.persona', 2);
  assert.deepEqual(chaves(h), [...CONQUISTAS, 'm1.q3b']);
  assert.ok(h.includes('Elenque</em> quais são as principais conquistas ou grandes entregas que o mandato deseja ter alcançado antes do fim da legislatura. Registre até 3:'));
  for (const n of [1, 2, 3]) assert.ok(h.includes(`Conquista/Grande Entrega almejada ${n}`));
  assert.ok(h.includes('Qual é o próximo cargo que a liderança parlamentar gostaria de ocupar?'));
  assert.equal(h.includes('as 4 principais'), false);
});

test('as caixas de 1.3 vêm depois do texto "Registre até 3:" (PER-07)', () => {
  const h = pergunta(janela(), 'm1.persona', 2);
  assert.ok(h.indexOf('Registre até 3:') > 0 && h.indexOf('Registre até 3:') < h.indexOf('data-k="m1.q3c1"'));
  assert.equal(h.includes('<label class="campo"></label>'), false);
});

test('o select de cargo traz os cargos de hoje e a opção "Não sei / não desejo registrar" (PER-08)', () => {
  const h = pergunta(janela(), 'm1.persona', 2);
  const sel = h.slice(h.indexOf('<select data-k="m1.q3b"'), h.indexOf('</select>'));
  for (const o of ['Vereador(a)', 'Deputado(a) federal', 'Senador(a)', 'Governador(a)', 'Presidente da República', 'Não sei / não desejo registrar']) {
    assert.ok(sel.includes(`<option value="${o}">`), o);
  }
});

test('com resposta antiga em m1.q3 aparece "Resposta anterior" e o valor segue gravado (PER-09)', () => {
  const w = janela();
  (w as unknown as { D: { campos: Record<string, string> } }).D.campos['m1.q3'] = 'Aprovar a lei do saneamento';
  const h = pergunta(w, 'm1.persona', 2);
  assert.ok(h.includes('Resposta anterior'));
  assert.ok(h.includes('Aprovar a lei do saneamento'));
  assert.equal((w as unknown as { D: { campos: Record<string, string> } }).D.campos['m1.q3'], 'Aprovar a lei do saneamento');
  assert.equal(chaves(h).includes('m1.q3'), false);
});

test('sem resposta antiga em m1.q3 não aparece "Resposta anterior" (PER-09)', () => {
  assert.equal(pergunta(janela(), 'm1.persona', 2).includes('Resposta anterior'), false);
});

test('no modo "ver tudo" Comp.perguntas também traz as 3 caixas de conquista e o cargo (PER-07)', () => {
  const w = janela();
  const h = w.Comp.perguntas(ex1(w, 'm1.persona'));
  assert.deepEqual(chaves(h).filter((k) => k.startsWith('m1.q3')), [...CONQUISTAS, 'm1.q3b']);
});

/* ---------- PER-06: texto e caixa de análise logo abaixo dos dados de 1.2 ---------- */
test('1.2 mostra, logo abaixo dos dados, o texto "Seu papel agora é registrar…" e depois a caixa de análise (PER-06)', () => {
  const h = pergunta(janela(), 'm1.persona', 1);
  const ilha = h.indexOf('data-ilha="persona-tse"');
  const texto = h.indexOf('Seu papel agora é registrar a história política que traz sentido aos dados. O que justifica esta trajetória? O que os demais assessores precisam saber para compreender o caminho percorrido?');
  const caixa = h.indexOf('data-k="m1.q2"');
  assert.ok(ilha > 0 && texto > ilha && caixa > texto);
  assert.deepEqual(chaves(h), ['m1.q2']);
});

test('perguntas sem caixas novas seguem com a caixa única (SUG-16)', () => {
  const h = pergunta(janela(), 'm1.persona', 0);
  assert.deepEqual(chaves(h), ['m1.q1']);
});

/* ---------- LEG-04 e LEG-05: pergunta 2.1 ---------- */
const DEFINICOES = [
  'Aliado:</strong> para aqueles com quem já tem uma boa relação e o mandato sabe que pode contar durante votações, por exemplo.',
  'Aliado, mas concorrente:</strong> para aqueles com quem já tem uma boa relação, mas cujas agendas defendidas ou o território da base de apoio lhes impõem uma competição direta.',
  'Oponente:</strong> para as lideranças com quem a liderança parlamentar já teve algum embate ou cujos posicionamentos são contrários ao que defende.',
  'Oponente e concorrente:</strong> para colegas com quem a relação é ou tende a ser desafiadora, e ainda existe uma disputa direta de agendas ou território.',
  'Indefinida:</strong> para perfis com quem haja potencial de construção de espaços de convergência e que pode ser aliado ou oponente, a depender da pauta debatida, e cuja relação ainda precisa ser desenvolvida.',
];
test('2.1 mostra o texto de análise, as 2 orientações numeradas e as 5 definições, antes dos dados (LEG-04)', () => {
  const h = pergunta(janela(), 'm1.conjuntura', 0);
  const ilha = h.indexOf('data-ilha="assentos"');
  assert.ok(h.includes('Analise qual é o tipo de relação que a liderança parlamentar tem com as pessoas eleitas, a partir dos dados expostos abaixo.'));
  assert.ok(h.includes('Siga as seguintes orientações para realizar a análise:'));
  const ol = h.slice(h.indexOf('<ol>'), h.indexOf('</ol>'));
  assert.equal((ol.match(/<li>/g) ?? []).length, 2);
  assert.ok(ol.includes('Crie categorias iniciais de análise, por meio do filtro, para iniciar sua avaliação.'));
  assert.ok(ol.includes('Não é necessário esgotar este processo com todas as cadeiras da Casa.'));
  let pos = h.indexOf('</ol>');
  for (const d of DEFINICOES) {
    const i = h.indexOf(d);
    assert.ok(i > pos, d);
    pos = i;
  }
  assert.ok(ilha > pos);
  assert.equal(h.includes('100 primeiros'), false);
});

test('2.1 não traz a pergunta das pontes não óbvias nem caixa de texto, e m1.q4b segue gravada (LEG-05)', () => {
  const w = janela();
  const campos = (w as unknown as { D: { campos: Record<string, string> } }).D.campos;
  campos['m1.q4b'] = 'Vereadora do interior';
  const h = pergunta(w, 'm1.conjuntura', 0);
  assert.deepEqual(chaves(h), []);
  assert.equal(h.includes('pontes não óbvias'), false);
  assert.equal(h.includes('Marque na tabela acima'), false);
  assert.equal(campos['m1.q4b'], 'Vereadora do interior');
});

/* ---------- PAR-01 e PAR-09: pergunta 2.2 ---------- */
const COMANDO = 'A partir dos dados apresentados acima, e de outros que você possa ter pesquisado, faça uma análise destacando o que mais te chama a atenção e como o mandato deve agir a partir desta conjuntura.';
const PAR09A = 'Identifique que tipo de relação com o partido a liderança parlamentar deseja ter, à luz destes dados, refletindo como o mandato pode contribuir para o fortalecimento do partido e como pode se posicionar diante do poder Executivo.';
const PAR09B = 'Selecione 2 dados e registre como a liderança parlamentar deseja que o mandato reaja a eles.';

test('2.2 mostra o texto de contexto antes dos dados e os dois textos de PAR-09 depois deles (PAR-01, PAR-09)', () => {
  const h = pergunta(janela(), 'm1.conjuntura', 1);
  const texto = h.indexOf('é fundamental para a compreensão da conjuntura política em que a liderança parlamentar está inserida.');
  const ilha = h.indexOf('data-ilha="calor"');
  assert.ok(h.indexOf('Qual é a conjuntura política regional e nacional de seu partido?') < texto);
  assert.ok(texto > 0 && texto < ilha);
  const a = h.indexOf(PAR09A), b = h.indexOf(PAR09B);
  assert.ok(ilha < a && a < b);
  assert.equal(h.includes('Contabilize'), false);
  assert.equal(h.includes(COMANDO), false);
});

test('o texto de contexto de 2.2 mantém os temas do original (PAR-01)', () => {
  const h = pergunta(janela(), 'm1.conjuntura', 1);
  for (const tema of ['Casa Legislativa', 'território nacional', 'domicílio eleitoral', 'setoriais e diretórios', 'relação que deseja ter com o partido', 'desafios e oportunidades de expansão da relevância partidária']) {
    assert.ok(h.includes(tema), tema);
  }
});

/* ---------- PAR-13: fim da página da Conjuntura ---------- */
function paginaConj() {
  const w = janela() as Janela;
  const ex = ex1(w, 'm1.conjuntura');
  w.Guia.m = w.MISSOES[0];
  w.Guia.ex = ex;
  w.Guia.passos = w.Guia.montar(ex);
  return { w, ex, html: w.Guia.passos.map((p, n) => w.Guia.bloco(p, n)).join('') };
}
test('o fim da Conjuntura traz o texto dos atores políticos e a caixa m1.q6, depois dos dados de 2.2 (PAR-13)', () => {
  const { html } = paginaConj();
  const texto = html.indexOf('Registre quais são os principais atores políticos do entorno da liderança parlamentar. Leve em consideração os diversos poderes, e monte o cenário político instalado a partir de quem são seus aliados e concorrentes em potencial.');
  assert.ok(texto > html.indexOf(PAR09B));
  assert.ok(html.indexOf('data-k="m1.q6"') > texto);
  assert.equal((html.match(/data-k="m1\.q6"/g) ?? []).length, 1);
});

test('a pergunta "Qual é a conjuntura política do seu estado ou município de origem?" e o mapa dela não aparecem (PAR-13)', () => {
  const { ex, html } = paginaConj();
  assert.equal(html.includes('conjuntura política do seu estado ou município de origem'), false);
  assert.equal(html.includes('data-ilha="municipio"'), false);
  assert.equal(ex.itens!.some((i) => i.k === 'm1.q6'), false);
});

test('m1.q8 mostra a caixa de análise depois dos dados, com o comando da análise (SUG-19)', () => {
  const q8 = pergunta(janela(), 'm1.oportunidades', 1);
  assert.ok(q8.indexOf('data-ilha="agendas-sociais"') < q8.indexOf('data-k="m1.q8a"'));
  assert.ok(q8.includes(COMANDO));
});

test('m1.q7 não ganha caixa nova: é preenchida pela pessoa, sem dado pronto (SUG-19)', () => {
  assert.deepEqual(chaves(pergunta(janela(), 'm1.oportunidades', 0)), ['m1.q7']);
});

/* ---------- SUG-22 e SUG-23: fragilidades numa página só ---------- */
function paginaFrag() {
  const w = janela() as Janela & { Comp: { frag(ex: Ex): string; diagFrag(): string } };
  const ex = ex1(w, 'm1.frag');
  w.Guia.m = w.MISSOES[0];
  w.Guia.ex = ex;
  w.Guia.passos = w.Guia.montar(ex);
  return { w, ex, passos: w.Guia.passos, html: w.Guia.passos.map((p, n) => w.Guia.bloco(p, n)).join('') };
}

test('m1.frag tem um passo só e traz comando e checklist na mesma página (SUG-22)', () => {
  const { passos, html } = paginaFrag();
  assert.equal(passos.length, 1);
  assert.ok(html.indexOf('Quais são os conhecimentos e/ou práticas') >= 0);
  assert.ok(html.indexOf('Quais são os conhecimentos e/ou práticas') < html.indexOf('frag-l'));
});

test('depois do checklist vem "Tornando fragilidades em fortalezas!" com o link da Biblioteca, e não há "Para fechar" (SUG-23)', () => {
  const { html } = paginaFrag();
  assert.ok(html.indexOf('frag-l') < html.indexOf('Tornando fragilidades em fortalezas!'));
  assert.ok(html.includes('href="#/biblioteca"'));
  assert.ok(html.includes('Escola do Legislativo da Casa'));
  assert.ok(html.includes('o que o mandato e a liderança ainda não dominam'));
  assert.equal(html.includes('Para fechar'), false);
});

test('o diagnóstico das fragilidades fica entre o checklist e o plano de estudo (SUG-23)', () => {
  const { html } = paginaFrag();
  assert.ok(html.indexOf('frag-l') < html.indexOf('diag-frag') && html.indexOf('diag-frag') < html.indexOf('Tornando fragilidades'));
});

/* ---------- SUG-21: faixa das 4 etapas ---------- */
test('a faixa traz as 4 etapas na ordem e marca só a atual (SUG-21)', () => {
  const w = janela() as Janela & { Guia: { faixaEtapas(id: string): string } };
  const h = w.Guia.faixaEtapas('m1.conjuntura');
  const nomes = [...h.matchAll(/<span>([^<]+)<\/span>/g)].map((m) => m[1]);
  assert.deepEqual(nomes, ['A Persona', 'A Conjuntura', 'As Oportunidades e Ameaças', 'As Fragilidades e Fortalezas']);
  assert.equal((h.match(/aria-current="step"/g) ?? []).length, 1);
  assert.ok(h.includes('<li aria-current="step"><a href="#/m/1/m1.conjuntura">'));
});

test('o exercício de fragilidades passa a se chamar "As fragilidades e fortalezas" (SUG-21)', () => {
  assert.equal(ex1(janela(), 'm1.frag').t, 'As fragilidades e fortalezas');
});

/* ---------- Resumo: respostas das caixas novas ---------- */
function janelaResumo(campos: Record<string, string>) {
  const w = janela() as Janela & { Resumo: { ex(ex: Ex): string } };
  const ctx = w as unknown as Record<string, unknown>;
  ctx.D = { campos, frags: [] };
  ctx.rich = (s: string) => s;
  ctx.window = {};
  vm.runInContext(`${ler('resumo.js')};this.Resumo=Resumo;`, ctx as vm.Context);
  vm.runInContext(CODIGO, ctx as vm.Context);
  return w;
}

test('o Resumo da Persona mostra o próximo cargo (m1.q3b) e o da Conjuntura mostra os atores políticos (m1.q6)', () => {
  const w = janelaResumo({ 'm1.q3b': 'Senado', 'm1.q6': 'Prefeito da capital' });
  const persona = w.Resumo.ex(ex1(w, 'm1.persona'));
  assert.ok(persona.includes('<dt>Próximo cargo que a liderança deseja ocupar</dt><dd>Senado</dd>'));
  const conj = w.Resumo.ex(ex1(w, 'm1.conjuntura'));
  assert.ok(conj.includes('<dt>Principais atores políticos do entorno</dt><dd>Prefeito da capital</dd>'));
  assert.equal(persona.includes('Principais atores'), false);
});

test('o Resumo continua com um só </dl> final e sem repetir o texto de m1.q5 (mesma chave de antes)', () => {
  const w = janelaResumo({ 'm1.q5': 'análise do partido' });
  const conj = w.Resumo.ex(ex1(w, 'm1.conjuntura'));
  assert.equal(conj.split('análise do partido').length - 1, 1);
  assert.ok(conj.endsWith('</dl>'));
});

/* ---------- SUG-87: pergunta 2 da Persona é de análise, não de levantamento ---------- */
test('m1.q2 pede análise dos pleitos já preenchidos, sem o comando "Levante" (SUG-87)', () => {
  const h = pergunta(janela(), 'm1.persona', 1);
  assert.ok(h.includes('<em>Analise</em>'));
  assert.ok(h.includes('já preenchidos com os dados do TSE'));
  assert.ok(!h.includes('Levante'));
});

/* ---------- PAG-01, PAG-03, PAG-04: página única por etapa ---------- */
type Tela = { innerHTML: string; className: string; querySelector(s: string): unknown };
/** Janela com o mínimo de DOM para o Guia.render, que escreve o HTML numa `#tela` falsa. */
function janelaPagina(hash = '#/m/1/m1.conjuntura') {
  /* os ganchos reais de endereço do novos.js (abrir com passo e ir com pushState) entram antes do m1.js, como no Guia */
  const NOVOS = ler('novos.js');
  const ini = NOVOS.indexOf('var _ga=Guia.abrir;');
  const FIM = 'App.ultima=h;App.marcar();';
  const fim = NOVOS.indexOf(FIM, ini);
  assert.ok(ini >= 0 && fim > ini);
  const w = janela(NOVOS.slice(ini, fim + FIM.length + 3)) as Janela & { Guia: Record<string, unknown> };
  const tela: Tela = {
    innerHTML: '', className: '',
    querySelector(s: string) {
      if (s === '[data-ilha]') return null;
      if (s === 'button[onclick="Guia.alternarModo()"]') {
        const m = /<button class="bt fant peq"[^>]*onclick="Guia\.alternarModo\(\)">[^<]*<\/button>/.exec(this.innerHTML);
        return m ? { parentNode: { removeChild: () => { this.innerHTML = this.innerHTML.replace(m[0], ''); } } } : null;
      }
      return null;
    },
  };
  const ctx = w as unknown as Record<string, unknown>;
  const trocas: string[] = [];
  ctx.document = { getElementById: () => tela };
  ctx.window = { Ilhas: undefined };
  ctx.location = { hash };
  ctx.history = { replaceState: (_a: unknown, _b: unknown, h: string) => { (ctx.location as { hash: string }).hash = h; trocas.push(h); } };
  ctx.estadoEx = () => 'nao';
  ctx.achaEx = (id: string) => {
    for (const m of w.MISSOES) { const e = m.exercicios.find((x) => x.id === id); if (e) return { m, ex: e }; }
    return null;
  };
  ctx.App = { ultima: '', marcar() {} };
  (ctx.history as { pushState: (a: unknown, b: unknown, h: string) => void }).pushState = (_a, _b, h) => { (ctx.location as { hash: string }).hash = h; trocas.push('push ' + h); };
  ctx.Campos = { ligar() {} };
  ctx.D = { campos: {}, frags: [], feitos: {} };
  return { w, tela, trocas, ctx };
}
const titulo = (it: Item) => it.t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
function abre(w: Janela, nm: number, id: string) {
  const g = w.Guia as unknown as { abrir(nm: number, id: string): void; ex: Ex };
  g.abrir(nm, id);
}

test('as 4 etapas da Missão 1 renderizam todas as perguntas na mesma página (PAG-01)', () => {
  for (const id of ['m1.persona', 'm1.conjuntura', 'm1.oportunidades']) {
    const { w, tela } = janelaPagina(`#/m/1/${id}`);
    abre(w, 1, id);
    for (const it of ex1(w, id).itens!) {
      assert.ok(tela.innerHTML.includes(titulo(it)), `${id}: ${it.k}`);
    }
    assert.ok(tela.innerHTML.includes('class="passo-corpo"'));
  }
  const { w, tela } = janelaPagina('#/m/1/m1.frag');
  abre(w, 1, 'm1.frag');
  assert.ok(tela.innerHTML.includes('frag-l'));
});

test('na Missão 1 não há "Anterior", "Avançar" nem "Ver tudo de uma vez" (PAG-03)', () => {
  for (const id of ['m1.persona', 'm1.conjuntura', 'm1.oportunidades', 'm1.frag']) {
    const { w, tela } = janelaPagina(`#/m/1/${id}`);
    abre(w, 1, id);
    for (const t of ['>Anterior<', '>Avançar<', 'Ver tudo de uma vez', 'Voltar ao passo a passo', 'passos-barra']) {
      assert.equal(tela.innerHTML.includes(t), false, `${id}: ${t}`);
    }
    assert.ok(tela.innerHTML.includes('Próximo exercício'));
  }
});

test('endereço antigo de passo abre a página única da etapa (PAG-04)', () => {
  for (const [id, n] of [['m1.conjuntura', 1], ['m1.oportunidades', 1]] as const) {
    const { w, tela, trocas } = janelaPagina(`#/m/1/${id}/${n}`);
    abre(w, 1, id);
    assert.ok(tela.innerHTML.includes('class="passo-corpo"'));
    for (const it of ex1(w, id).itens!) assert.ok(tela.innerHTML.includes(titulo(it)), `${id}: ${it.k}`);
    assert.equal(tela.innerHTML.includes('Avançar'), false);
    assert.deepEqual(trocas, [`#/m/1/${id}`]);
  }
});

test('as Missões 2 a 5 não mudam: seguem no passo a passo com o botão de alternar modo (PAG-03)', () => {
  const { w, tela } = janelaPagina('#/m/1/m1.persona');
  abre(w, 1, 'm1.persona');
  const g = w.Guia as unknown as { modo: string };
  assert.equal(g.modo, 'tudo');
  const m2 = w.MISSOES.find((m) => m.n === 2)!;
  (w as unknown as Record<string, unknown>).location = { hash: `#/m/2/${m2.exercicios[0].id}` };
  abre(w, 2, m2.exercicios[0].id);
  assert.equal(g.modo, 'guiado');
  assert.ok(tela.innerHTML.includes('Ver tudo de uma vez'));
});

/* ---------- SOC-01, SOC-02, SOC-07, AGE-01: textos das Oportunidades e pergunta das agendas ---------- */
test('3.1 mostra o texto exato antes da ilha das colunas de registro (SOC-01)', () => {
  const h = pergunta(janela(), 'm1.oportunidades', 0);
  const texto = h.indexOf('Elenque</em> quais foram os posicionamentos públicos e as promessas mais relevantes da sua campanha. Identifique também as regiões e os grupos sociais que mais apoiaram a candidatura e eleição, e também aqueles com potencial para maior aproximação ao longo dos anos que seguem.');
  assert.ok(texto > 0 && texto < h.indexOf('data-ilha="eleitorado"'));
});

test('3.2 mostra o texto novo e a caixa m1.q8a só depois dos dados (SOC-02, SOC-07)', () => {
  const h = pergunta(janela(), 'm1.oportunidades', 1);
  const texto = h.indexOf('Inspire-se nos dados públicos oficiais apresentados abaixo, acerca do seu estado, e faça uma análise da conjuntura social do território da liderança parlamentar.');
  assert.ok(texto > 0);
  assert.ok(texto < h.indexOf('data-ilha="agendas-sociais"') && h.indexOf('data-ilha="agendas-sociais"') < h.indexOf('data-k="m1.q8a"'));
  assert.equal(h.includes('Consulte'), false);
});

test('m1.oportunidades emite as ilhas eleitorado, agendas-sociais e prioritarias, nessa ordem, e não emite social (ELE-01, SOC-02, AGE-01)', () => {
  const w = janela();
  const ilhas = [0, 1, 2].flatMap((n) => [...pergunta(w, 'm1.oportunidades', n).matchAll(/data-ilha="([^"]+)"/g)].map((r) => r[1]));
  assert.deepEqual(ilhas, ['eleitorado', 'agendas-sociais', 'prioritarias']);
  assert.equal(ilhas.includes('social'), false);
});

test('3.3 é a pergunta m1.q9 com o texto das 3 agendas prioritárias e a ilha de seleção, sem caixa de texto (AGE-01)', () => {
  const w = janela();
  const ex = ex1(w, 'm1.oportunidades');
  assert.deepEqual([...ex.itens!.map((i) => i.k)], ['m1.q7', 'm1.q8', 'm1.q9']);
  const h = pergunta(w, 'm1.oportunidades', 2);
  assert.ok(h.includes('Considerando os dados acima e as promessas de campanha, selecione quais são as 3 Agendas que serão trabalhadas prioritariamente pela liderança parlamentar ao longo dos 100 Primeiros dias, mas também ao longo deste primeiro ano:'));
  assert.ok(h.includes('data-ilha="prioritarias"'));
  assert.deepEqual(chaves(h), []);
});

test('na página única das Oportunidades as 3 perguntas aparecem na ordem 3.1, 3.2, 3.3 (AGE-01)', () => {
  const { w, tela } = janelaPagina('#/m/1/m1.oportunidades');
  abre(w, 1, 'm1.oportunidades');
  const h = tela.innerHTML;
  const ordem = ['data-ilha="eleitorado"', 'data-ilha="agendas-sociais"', 'data-k="m1.q8a"', 'data-ilha="prioritarias"'].map((t) => h.indexOf(t));
  assert.ok(ordem.every((i) => i > 0));
  assert.deepEqual([...ordem].sort((a, b) => a - b), ordem);
});

/* ---------- FRA-01 a FRA-03 e GER-01: Fragilidades e linguagem ---------- */
test('4.1 mostra o título e a instrução M/P exatos, antes da lista (FRA-01)', () => {
  const { html } = paginaFrag();
  const titulo = html.indexOf('Quais são os conhecimentos e/ou práticas que a liderança parlamentar ou a equipe ainda não domina(m) para um bom exercício do mandato?');
  const instrucao = html.indexOf('Coloque um M para fragilidades da equipe do mandato e um P para as fragilidades da liderança parlamentar.');
  assert.ok(titulo >= 0 && instrucao > titulo && instrucao < html.indexOf('frag-l'));
});

test('a lista traz "Uso dos Sistemas da Casa Legislativa" com "Sistemas" no plural e deixa marcar M, P ou os dois (FRA-02)', () => {
  const w = janela() as Janela & { Comp: { frag(ex: Ex): string }; FRAGILIDADES: string[] };
  (w as unknown as { D: { frags: unknown[] } }).D.frags = w.FRAGILIDADES.map((t) => ({ t, mp: 'MP' }));
  const h = w.Comp.frag(ex1(w, 'm1.frag'));
  assert.ok(h.includes('Uso dos Sistemas da Casa Legislativa'));
  assert.equal(h.includes('Uso do Sistema da Casa'), false);
  const item = h.slice(h.indexOf('Uso dos Sistemas da Casa Legislativa'));
  assert.ok(item.indexOf("Comp.mp(") > 0 && item.includes("'M')") && item.includes("'P')"));
  assert.equal((item.match(/aria-pressed="true"/g) ?? []).length >= 2, true);
});

test('depois da lista vem o texto "Caso sinta falta de algum outro tema, suba na lista…" (FRA-03)', () => {
  const { html } = paginaFrag();
  const caso = html.indexOf('Caso sinta falta de algum outro tema, suba na lista e crie um plano de estudos');
  assert.ok(caso > html.indexOf('Uso dos Sistemas da Casa Legislativa'));
  assert.ok(caso < html.indexOf('Tornando fragilidades em fortalezas!'));
});

test('nenhum texto da Missão 1 escrito à mão usa "o parlamentar" ou "a parlamentar" para a pessoa do mandato (GER-01)', () => {
  const achados = CODIGO.match(/(?<![\p{L}\p{N}])(?:o|a|do|da|ao|à|pelo|pela) parlamentar(?![\p{L}\p{N}])/giu) ?? [];
  assert.deepEqual([...achados], []);
});

/* ---------- GER-02 e GER-03: Resumo e andamento ---------- */
test('o Resumo lista as 3 conquistas, o próximo cargo, os atores (m1.q6) e a análise social (m1.q8a) (GER-02)', () => {
  const w = janelaResumo({
    'm1.q3c1': 'Aprovar o plano de saneamento', 'm1.q3c2': 'Criar a frente parlamentar', 'm1.q3c3': 'Relatar o orçamento',
    'm1.q3b': 'Senador(a)', 'm1.q6': 'Prefeito da capital', 'm1.q8a': 'Desigualdade no interior',
  });
  const persona = w.Resumo.ex(ex1(w, 'm1.persona'));
  for (const n of [1, 2, 3]) assert.ok(persona.includes(`<dt>Conquista/Grande Entrega almejada ${n}</dt>`), `conquista ${n}`);
  assert.ok(persona.includes('<dd>Aprovar o plano de saneamento</dd>') && persona.includes('<dd>Relatar o orçamento</dd>'));
  assert.ok(persona.includes('<dd>Senador(a)</dd>'));
  assert.ok(w.Resumo.ex(ex1(w, 'm1.conjuntura')).includes('<dd>Prefeito da capital</dd>'));
  assert.ok(w.Resumo.ex(ex1(w, 'm1.oportunidades')).includes('<dd>Desigualdade no interior</dd>'));
});

/** Janela com o temConteudo real do nucleo.js carregado antes do m1.js, como no Guia. */
function janelaAndamento(D: Record<string, unknown>) {
  const NUCLEO = ler('nucleo.js');
  const ini = NUCLEO.indexOf('function temConteudo(ex){');
  const fim = NUCLEO.indexOf('function estadoEx(ex)');
  assert.ok(ini >= 0 && fim > ini);
  const w = janela(NUCLEO.slice(ini, fim)) as Janela & { temConteudo(ex: Ex): boolean };
  (w as unknown as { D: unknown }).D = { campos: {}, frags: [], ...D };
  return w;
}

test('uma etapa sem nenhuma resposta não conta como em andamento (GER-03)', () => {
  const w = janelaAndamento({});
  for (const id of ['m1.persona', 'm1.conjuntura', 'm1.oportunidades']) assert.equal(w.temConteudo(ex1(w, id)), false, id);
});

test('responder só em D.eleitorado marca as Oportunidades como em andamento (GER-03)', () => {
  const w = janelaAndamento({ eleitorado: { itens: [{ id: 'a', tipo: 'promessa', texto: 'x', muns: [] }] } });
  assert.equal(w.temConteudo(ex1(w, 'm1.oportunidades')), true);
  assert.equal(w.temConteudo(ex1(w, 'm1.conjuntura')), false);
});

test('responder só em D.agendasPrio marca as Oportunidades como em andamento (GER-03)', () => {
  const w = janelaAndamento({ agendasPrio: ['saude'] });
  assert.equal(w.temConteudo(ex1(w, 'm1.oportunidades')), true);
});

test('responder só em D.conj2.reacoes marca a Conjuntura como em andamento (GER-03)', () => {
  const w = janelaAndamento({ conj2: { muns: {}, relacao: '', relacaoPq: '', desafios: [], oportunidades: [], reacoes: [{ dado: 'vereadores', valor: '12', texto: '' }] } });
  assert.equal(w.temConteudo(ex1(w, 'm1.conjuntura')), true);
  assert.equal(w.temConteudo(ex1(w, 'm1.oportunidades')), false);
});

test('responder só nas conquistas ou em m1.q6 marca a etapa como em andamento (GER-03)', () => {
  const p = janelaAndamento({ campos: { 'm1.q3c2': 'algo' } });
  assert.equal(p.temConteudo(ex1(p, 'm1.persona')), true);
  const c = janelaAndamento({ campos: { 'm1.q6': 'atores' } });
  assert.equal(c.temConteudo(ex1(c, 'm1.conjuntura')), true);
});

test('as Missões 2 a 5 não ganham regra nova de andamento (GER-03)', () => {
  const w = janelaAndamento({ eleitorado: { itens: [{ id: 'a' }] }, agendasPrio: ['saude'] });
  for (const m of w.MISSOES.filter((x) => x.n !== 1)) for (const e of m.exercicios) assert.equal(w.temConteudo(e), false, e.id);
});

/* ---------- LEG-12, LEG-13: Resumo do preenchimento com as 5 categorias (novos.js, ResumoIlhas) ---------- */
function resumoIlhas(relacoes: Record<string, unknown>, vivo = false) {
  const codigo = ler('novos.js');
  const ini = codigo.indexOf('window.ResumoIlhas={');
  const fim = codigo.indexOf('/* ---------- Perguntas respondidas só pelo módulo');
  const ctx: Record<string, unknown> = {
    esc: (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;'),
    titulo: (s: string) => s, fmt: (n: number) => String(n), pc: (n: number) => `${n}%`,
    D: { relacoes, tse: {}, pleitos: [] }, Resumo: { vivo, sem: 'Sem resposta.' },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(codigo.slice(ini, fim), ctx);
  return (ctx.ResumoIlhas as { html(i: string): string }).html('assentos');
}
const pessoa = (status: string, nome: string, mun?: string) => ({ status, nome, partido: 'PSOL', cargo: 'Deputado Federal', uf: 'DF', mun });

test('o Resumo mostra "Você tem N Aliados; …" e as listas por categoria, só com as que têm alguém (LEG-12, LEG-13)', () => {
  const h = resumoIlhas({
    a1: pessoa('aliado', 'Ana'), a2: pessoa('aliado', 'Bia'), c1: pessoa('aliado_concorrente', 'Caio'),
    o1: pessoa('concorrente', 'Dani'), x1: pessoa('potencial', 'Eva'), m1: pessoa('aliado', 'Prefeito', 'Taguatinga'),
  });
  assert.ok(h.includes('Você tem 2 Aliados; 1 Aliado, mas concorrente; 1 Oponente; 1 Indefinida'));
  assert.equal(h.includes('Oponente e concorrente'), false);
  assert.ok(h.includes('Aliados (2)') && h.includes('Aliados, mas concorrentes (1)') && h.includes('Oponentes (1)') && h.includes('Indefinidas (1)'));
  assert.equal(h.includes('Prefeito'), false);
  assert.equal(h.includes('Potenciais relacionamentos'), false);
  assert.ok(h.indexOf('Você tem') < h.indexOf('Aliados (2)'));
});

test('sem classificação o Resumo mostra "Nada classificado ainda." (LEG-13)', () => {
  assert.ok(resumoIlhas({}).includes('Nada classificado ainda.'));
});
