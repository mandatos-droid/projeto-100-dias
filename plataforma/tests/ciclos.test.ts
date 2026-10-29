import { test } from 'node:test';
import assert from 'node:assert/strict';
import { abrirCiclo, arquivarEIniciar, listaCiclos, lerPlanos, type DadosCiclos } from '../lib/ciclos.ts';
import { aplicaRumo } from '../lib/rumo.ts';

const plano = (): DadosCiclos => {
  const d: DadosCiclos = {
    campos: { 'm3.obj.p1': 'Priorizar a educação', 'm3.obj.p2': 'Pautar o fim do trabalho infantil' },
    preditores: ['p1', 'p2'],
    metas: [
      { id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos', status: 'concluida', sucessos: [{ id: 's1', mes: 1, texto: 'Protocolar', status: 'concluida' }] },
      { id: 'b', pred: 'p1', texto: 'Visitar 10 escolas', status: 'concluida70' },
      { id: 'c', pred: 'p2', texto: 'Lançar a campanha', status: 'nao_concluida' },
    ],
  };
  aplicaRumo(d, { legado: { manchete: 'A Educação no centro do debate', manual: true } });
  return d;
};
const foto = (d: unknown) => JSON.stringify(d);

test('arquivarEIniciar guarda uma cópia congelada do plano atual em D.planos (M5-30.4)', () => {
  const d = plano();
  const antes = foto(d.metas);
  const n = arquivarEIniciar(d, { copiar: [0], agora: '2026-05-01T10:00:00.000Z' });
  assert.equal(n, 1);
  const [p] = lerPlanos(d);
  assert.equal(p.n, 1);
  assert.equal(p.criadoEm, '2026-05-01T10:00:00.000Z');
  assert.equal(p.legado, 'A Educação no centro do debate');
  assert.equal(foto(p.metas), antes);
  assert.deepEqual(p.objetivos.map((o) => [o.pid, o.texto]), [['p1', 'Priorizar a educação'], ['p2', 'Pautar o fim do trabalho infantil']]);
  // cópia congelada: mexer no plano ativo depois não muda o arquivado
  (d.metas as { texto: string }[])[0].texto = 'mudou';
  assert.equal(lerPlanos(d)[0].metas[0].texto, 'Aprovar 2 projetos');
});

test('o novo plano mantém Legado, bandeiras, objetivos e preditores (M5-30.4)', () => {
  const d = plano();
  const antes = { rumo: foto(d.rumo), campos: foto(d.campos), preditores: foto(d.preditores) };
  arquivarEIniciar(d, { copiar: [] });
  assert.equal(foto(d.rumo), antes.rumo);
  assert.equal(foto(d.campos), antes.campos);
  assert.equal(foto(d.preditores), antes.preditores);
});

test('só as metas escolhidas são copiadas, com os mesmos campos e sucessos, e status "não concluída" (M5-30.4)', () => {
  const d = plano();
  arquivarEIniciar(d, { copiar: [2, 0] });
  const metas = d.metas as { id: string; texto: string; status: string; sucessos?: unknown }[];
  assert.deepEqual(metas.map((m) => m.id), ['a', 'c']);
  assert.ok(metas.every((m) => m.status === 'nao_concluida'));
  assert.equal(metas[0].texto, 'Aprovar 2 projetos');
  assert.deepEqual(metas[0].sucessos, [{ id: 's1', mes: 1, texto: 'Protocolar', status: 'nao_concluida' }]);
  assert.equal('sucessos' in metas[1], false); // meta sem sucessos continua sem
  // o arquivado guarda os sucessos e o status originais
  assert.equal(lerPlanos(d)[0].metas[0].sucessos?.length, 1);
  assert.equal(lerPlanos(d)[0].metas[0].status, 'concluida');
});

test('sem metas escolhidas o plano novo começa sem metas; posição inválida é ignorada (M5-30.4)', () => {
  const d = plano();
  arquivarEIniciar(d, { copiar: [] });
  assert.deepEqual(d.metas, []);
  const e = plano();
  arquivarEIniciar(e, { copiar: [9, -1, 1.5, 1, 1] });
  assert.deepEqual((e.metas as { id: string }[]).map((m) => m.id), ['b']);
});

test('criar o 2º e o 3º plano não altera nenhum plano anterior (M5-30, M5-31.7)', () => {
  const d = plano();
  arquivarEIniciar(d, { copiar: [0, 1], agora: '2026-05-01T00:00:00.000Z' });
  const p1 = foto(lerPlanos(d)[0]);
  (d.metas as { status: string }[])[0].status = 'concluida';
  assert.equal(arquivarEIniciar(d, { copiar: [0], agora: '2026-09-01T00:00:00.000Z' }), 2);
  const p2 = foto(lerPlanos(d)[1]);
  assert.equal(arquivarEIniciar(d, { copiar: [] }), 3);
  const planos = lerPlanos(d);
  assert.equal(planos.length, 3);
  assert.equal(foto(planos[0]), p1);
  assert.equal(foto(planos[1]), p2);
  assert.equal(planos[1].metas[0].status, 'concluida');
});

test('sem chamar arquivarEIniciar (cancelar) nada muda, e ler os ciclos não altera D (edge case: cancelar)', () => {
  const d = plano();
  const antes = foto(d);
  listaCiclos(d); lerPlanos(d); abrirCiclo(d, 1);
  assert.equal(foto(d), antes);
  assert.equal('planos' in d, false);
});

test('listaCiclos: sem arquivados só há o atual; depois, arquivados em ordem e o atual por último (M5-31.5)', () => {
  const d = plano();
  assert.deepEqual(listaCiclos(d).map((c) => [c.n, c.atual]), [[1, true]]);
  arquivarEIniciar(d, { copiar: [] });
  arquivarEIniciar(d, { copiar: [] });
  const l = listaCiclos(d);
  assert.deepEqual(l.map((c) => [c.n, c.atual]), [[1, false], [2, false], [3, true]]);
  assert.equal(l[2].rot, 'Planejamento 3 (atual)');
  assert.equal(l[0].rot, 'Planejamento 1');
});

test('abrirCiclo devolve a árvore do arquivado, com metas por objetivo e sucessos; o atual e o inexistente dão null (M5-31.6)', () => {
  const d = plano();
  arquivarEIniciar(d, { copiar: [0] });
  const antes = foto(d);
  const arv = abrirCiclo(d, 1)!;
  assert.equal(foto(d), antes);
  assert.equal(arv.legado, 'A Educação no centro do debate');
  assert.deepEqual(arv.objetivos.map((o) => [o.pid, o.metas.map((m) => m.idx)]), [['p1', [0, 1]], ['p2', [2]]]);
  assert.equal(arv.objetivos[0].metas[0].sucessos?.length, 1);
  assert.equal(abrirCiclo(d, 2), null);
  assert.equal(abrirCiclo(d, 99), null);
});

test('plano sem metas arquiva sem erro e abre vazio (estado vazio)', () => {
  const d: DadosCiclos = { campos: {}, preditores: [], metas: [] };
  assert.equal(arquivarEIniciar(d), 1);
  const arv = abrirCiclo(d, 1)!;
  assert.deepEqual([arv.objetivos, arv.semObjetivo], [[], []]);
});

test('planos malformados em D.planos são ignorados na leitura', () => {
  const d: DadosCiclos = { campos: {}, planos: [null, 'x', { n: 'a' }, { n: 1, metas: [] }] };
  assert.deepEqual(lerPlanos(d).map((p) => p.n), [1]);
});
