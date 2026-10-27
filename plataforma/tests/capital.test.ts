import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOTIVOS, PAPEIS, MOVIMENTOS, TEXTO_SABER, progressoAcoes } from '../lib/capital.ts';

/* Missão 4 · listas e regra de progresso (CAP-03, CAP-12). Resultados esperados vêm da spec. */

test('progressoAcoes: 2 ações na mesma frente não cumprem a regra (CAP-12.8)', () => {
  const r = progressoAcoes([{ bingo: 'articulacao', i: 0 }, { bingo: 'articulacao', i: 1 }]);
  assert.deepEqual(r, { total: 2, frentes: 1, ok: false });
});

test('progressoAcoes: 2 ações em 2 frentes diferentes cumprem a regra (CAP-12.8)', () => {
  const r = progressoAcoes([{ bingo: 'articulacao', i: 0 }, { bingo: 'mobilizacao', i: 3 }]);
  assert.deepEqual(r, { total: 2, frentes: 2, ok: true });
});

test('progressoAcoes: 1 ação sozinha, lista vazia e entradas inválidas não cumprem (CAP-12.8, CAP-40)', () => {
  assert.equal(progressoAcoes([{ bingo: 'redes', i: 0 }]).ok, false);
  assert.deepEqual(progressoAcoes([]), { total: 0, frentes: 0, ok: false });
  assert.deepEqual(progressoAcoes(undefined), { total: 0, frentes: 0, ok: false });
  assert.deepEqual(progressoAcoes('corrompido'), { total: 0, frentes: 0, ok: false });
});

test('progressoAcoes: ação salva no formato antigo (id, bingo, i, titulo, campos soltos) conta normalmente (CAP-12.11)', () => {
  const antigas = [
    { id: 'a1', bingo: 'partido', i: 2, titulo: 'Contribuir', alcancar: 'x', resp: 'Ana', prazo: 'até 20/03', saber: 'y', prox: 'z' },
    { id: 'a2', bingo: 'redes', i: 0, titulo: 'Definir públicos' },
    { id: 'a3', bingo: 'redes', i: 1, titulo: 'Planejar' },
  ];
  assert.deepEqual(progressoAcoes(antigas), { total: 3, frentes: 2, ok: true });
});

test('progressoAcoes: registro sem frente ou que não é objeto não conta (CAP-40)', () => {
  assert.deepEqual(progressoAcoes([null, 'x', { i: 1 }, { bingo: 'redes', i: 0 }]), { total: 1, frentes: 1, ok: false });
});

test('PAPEIS tem exatamente Titular, Suplente, Relatoria, Vice-presidência e Presidência (CAP-03.7)', () => {
  assert.deepEqual([...PAPEIS], ['Titular', 'Suplente', 'Relatoria', 'Vice-presidência', 'Presidência']);
});

test('MOTIVOS e MOVIMENTOS têm ids únicos e rótulos preenchidos, prontos para múltipla escolha (CAP-03.7)', () => {
  for (const lista of [MOTIVOS, MOVIMENTOS]) {
    assert.ok(lista.length >= 3);
    assert.equal(new Set(lista.map((x) => x.id)).size, lista.length);
    assert.ok(lista.every((x) => x.rot.trim() !== ''));
  }
});

test('TEXTO_SABER tem um texto base para cada uma das 4 frentes do Guia (CAP-11.7)', () => {
  assert.deepEqual(Object.keys(TEXTO_SABER).sort(), ['articulacao', 'mobilizacao', 'partido', 'redes']);
  assert.ok(Object.values(TEXTO_SABER).every((t) => t.trim() !== ''));
});
