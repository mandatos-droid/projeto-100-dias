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

/* ---------- SUG-17: pergunta 1 da Conjuntura ---------- */
test('m1.q4 pede a análise a partir dos dados abaixo e não traz o trecho dos 100 primeiros dias (SUG-17)', () => {
  const h = pergunta(janela(), 'm1.conjuntura', 0);
  assert.ok(h.includes('nesta legislatura, a partir dos dados expostos abaixo. Em seguida, faça uma análise sobre o que esperar dos colegas e das possíveis alianças.'));
  assert.equal(h.includes('100 primeiros'), false);
  assert.equal(h.includes('agendas similares'), false);
});

test('m1.q4 abre depois do mapa a orientação de marcar Parceiro e Concorrente e a caixa das pontes não óbvias (SUG-17)', () => {
  const h = pergunta(janela(), 'm1.conjuntura', 0);
  const ilha = h.indexOf('data-ilha="assentos"');
  assert.ok(ilha > 0);
  assert.ok(h.indexOf('Marque na tabela acima') > ilha);
  assert.ok(h.indexOf('data-k="m1.q4b"') > h.indexOf('Marque na tabela acima'));
  assert.ok(h.includes('E quais são as pontes não óbvias que podem ser construídas'));
  assert.deepEqual(chaves(h), ['m1.q4b']);
});

test('m1.q4 não ganha caixa de parceiros e concorrentes: a marcação é na tabela (SUG-17)', () => {
  const h = pergunta(janela(), 'm1.conjuntura', 0);
  assert.equal(h.includes('potenciais parcerias'), false);
});

/* ---------- SUG-19: texto, dados, caixa de análise ---------- */
const COMANDO = 'A partir dos dados apresentados acima, e de outros que você possa ter pesquisado, faça uma análise destacando o que mais te chama a atenção e como o mandato deve agir a partir desta conjuntura.';

test('m1.q5 mostra título, texto novo, dados e só então a caixa com o comando da análise (SUG-19)', () => {
  const h = pergunta(janela(), 'm1.conjuntura', 1);
  const texto = h.indexOf('é fundamental para a compreensão da conjuntura política em que a liderança parlamentar está inserida.');
  const ilha = h.indexOf('data-ilha="calor"');
  const caixa = h.indexOf('data-k="m1.q5"');
  assert.ok(h.indexOf('Qual é a conjuntura política regional e nacional de seu partido?') < texto);
  assert.ok(texto > 0 && texto < ilha && ilha < caixa);
  assert.ok(h.includes(COMANDO));
  assert.equal(h.includes('Contabilize'), false);
  assert.deepEqual(chaves(h), ['m1.q5']);
});

test('o texto novo de m1.q5 mantém os temas do original (SUG-19)', () => {
  const h = pergunta(janela(), 'm1.conjuntura', 1);
  for (const tema of ['Casa Legislativa', 'território nacional', 'domicílio eleitoral', 'setoriais e diretórios', 'relação que deseja ter com o partido', 'desafios e oportunidades de expansão da relevância partidária']) {
    assert.ok(h.includes(tema), tema);
  }
});

test('m1.q6 e m1.q8 mostram a caixa de análise depois dos dados, com o mesmo comando (SUG-19)', () => {
  const w = janela();
  const q6 = pergunta(w, 'm1.conjuntura', 2);
  assert.ok(q6.indexOf('data-ilha="municipio"') < q6.indexOf('data-k="m1.q6"'));
  assert.ok(q6.includes(COMANDO));
  const q8 = pergunta(w, 'm1.oportunidades', 1);
  assert.ok(q8.indexOf('data-ilha="social"') < q8.indexOf('data-k="m1.q8a"'));
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

test('o Resumo da Persona mostra o próximo cargo (m1.q3b) e o da Conjuntura mostra as pontes (m1.q4b)', () => {
  const w = janelaResumo({ 'm1.q3b': 'Senado', 'm1.q4b': 'Vereadora do interior' });
  const persona = w.Resumo.ex(ex1(w, 'm1.persona'));
  assert.ok(persona.includes('<dt>Próximo cargo que a liderança deseja ocupar</dt><dd>Senado</dd>'));
  const conj = w.Resumo.ex(ex1(w, 'm1.conjuntura'));
  assert.ok(conj.includes('<dt>Pontes não óbvias</dt><dd>Vereadora do interior</dd>'));
  assert.equal(persona.includes('Pontes não óbvias'), false);
});

test('o Resumo continua com um só </dl> final e sem repetir o texto de m1.q5 (mesma chave de antes)', () => {
  const w = janelaResumo({ 'm1.q5': 'análise do partido' });
  const conj = w.Resumo.ex(ex1(w, 'm1.conjuntura'));
  assert.equal(conj.split('análise do partido').length - 1, 1);
  assert.ok(conj.endsWith('</dl>'));
});
