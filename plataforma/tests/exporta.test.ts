import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplica, alternaArea } from '../lib/cadeiras.ts';
import { organogramaSvg, quadroRotinasHtml } from '../lib/exporta.ts';
import { MODELO, editaRotina, lerQuadro } from '../lib/quadroRotinas.ts';

type C = Record<string, string>;
const cargo = (i: number) => (i === 0 ? 'Chefia de gabinete' : i === 7 ? 'Coordenador/a de Comunicação' : `Cargo ${i + 1}`);
const base = (): C => {
  const c: C = { 'm2.f1': 'Ana Souza', 'm2.f8': 'Bia Lima' };
  aplica(c, alternaArea(c, 'Comunicação', true).patch);
  return c;
};

test('o SVG traz o nome de cada pessoa, o cargo e o nome da área (MEQ-23, T-25)', () => {
  const svg = organogramaSvg(base(), cargo);
  assert.ok(svg.startsWith('<svg') && svg.trimEnd().endsWith('</svg>'));
  ['Ana Souza', 'Bia Lima', 'Chefia de gabinete', 'Coordenador/a de Comunicação'].forEach((t) => assert.ok(svg.includes(t), t));
  assert.ok(svg.includes('Comunicação'));
});

test('vaga aparece como "Vaga em aberto" e processo seletivo como "Processo seletivo" (MEQ-23)', () => {
  const c = base();
  c['m2.f9'] = '*';
  const svg = organogramaSvg(c, cargo);
  assert.ok(svg.includes('Processo seletivo'));
  assert.ok(svg.includes('Vaga em aberto'));
});

test('a legenda lista as áreas ativas e nenhuma inativa (MEQ-23, T-25)', () => {
  const svg = organogramaSvg(base(), cargo);
  const legenda = svg.slice(svg.indexOf('<g id="legenda"'));
  assert.ok(legenda.includes('Comunicação'));
  assert.equal(legenda.includes('Logística'), false);
  assert.equal(legenda.includes('Legislativo'), false);
});

test('nomes com &, < e aspas saem escapados e o SVG segue bem formado (MEQ-23, T-25)', () => {
  const c = base();
  c['m2.f8'] = 'Bia & "Cia" <b>';
  const svg = organogramaSvg(c, cargo);
  assert.ok(svg.includes('Bia &amp; &quot;Cia&quot; &lt;b&gt;'));
  assert.equal(/&(?!amp;|lt;|gt;|quot;|apos;)/.test(svg), false);
  assert.equal(svg.includes('<b>'), false);
});

test('o SVG tem largura e altura que cobrem todas as caixas (MEQ-23)', () => {
  const svg = organogramaSvg(base(), cargo);
  const [, w, h] = /viewBox="0 0 (\d+) (\d+)"/.exec(svg)!.map(Number) as number[];
  const xs = [...svg.matchAll(/<rect class="caixa" x="(-?[\d.]+)" y="(-?[\d.]+)" width="(\d+)" height="(\d+)"/g)];
  assert.equal(xs.length, 5); // Chefia + 4 cadeiras de Comunicação
  xs.forEach((m) => { assert.ok(Number(m[1]) >= 0 && Number(m[1]) + Number(m[3]) <= w); assert.ok(Number(m[2]) >= 0 && Number(m[2]) + Number(m[4]) <= h); });
});

/* ---------- T22 · quadro de rotinas para impressão ---------- */
const edita = (c: C, id: string, p: Parameters<typeof editaRotina>[2]): C => { const x = { ...c }; aplica(x, editaRotina(x, id, p)); return x; };
const linhasDaTabela = (html: string) => (/<tbody[^>]*>([\s\S]*)<\/tbody>/.exec(html)?.[1] ?? '').split('<tr').length - 1;

test('a tabela traz cabeçalho e uma linha por rotina ligada com rotina, frequência, participantes e duração (RM2-60, RM2-62)', () => {
  const html = quadroRotinasHtml(lerQuadro({}));
  ['Rotina', 'Frequência', 'Quem participa', 'Duração média', 'Início'].forEach((t) => assert.ok(html.includes(t), t));
  MODELO.forEach((m) => [m.titulo, m.freq, m.quem, m.dur].forEach((t) => assert.ok(html.includes(t), t)));
  assert.equal(linhasDaTabela(html), 5);
});

test('o início sai como "dd/mm/aaaa às hh:mm", ou "início ainda não definido" sem data e hora (RM2-62)', () => {
  let c: C = edita({}, 'plan', { data: '2030-03-05', hora: '09:30' });
  c = edita(c, 'mensal', { data: '2030-03-12' }); // sem hora: não está definido
  const html = quadroRotinasHtml(lerQuadro(c));
  assert.ok(html.includes('05/03/2030 às 09:30'));
  assert.equal(html.split('início ainda não definido').length - 1, 4);
});

test('rotina desligada não aparece (RM2-60)', () => {
  const html = quadroRotinasHtml(lerQuadro(edita({}, 'area', { on: false })));
  assert.equal(html.includes(MODELO[3].titulo), false);
  assert.equal(linhasDaTabela(html), 4);
});

test('texto digitado com <, & e aspas sai escapado, também no início (segurança)', () => {
  const c = edita({}, 'plan', { quem: '<b>Ana</b> & "Bia"', dur: `<img src=x onerror='1'>` });
  const html = quadroRotinasHtml(lerQuadro(c));
  assert.ok(html.includes('&lt;b&gt;Ana&lt;/b&gt; &amp; &quot;Bia&quot;'));
  assert.equal(html.includes('<b>'), false);
  assert.equal(html.includes('<img'), false);
  assert.equal(/&(?!amp;|lt;|gt;|quot;|apos;|#39;)/.test(html), false);
  const r = lerQuadro({}).map((x) => ({ ...x, data: '<x>', hora: '"y"' }));
  assert.equal(quadroRotinasHtml(r).includes('<x>'), false);
});
