import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usoPorFuncionalidade } from '../lib/admin/usoFuncionalidades.ts';
import type { LinhaUsoCampos } from '../lib/admin/usoFuncionalidades.ts';

const vazia = (id: string): LinhaUsoCampos => ({
  mandato_id: id, uf: 'SP', persona: false, conjuntura: false, municipio: false, eleitorado: false, social: false, cadeiras: false,
});
const todas = (id: string): LinhaUsoCampos => ({ ...vazia(id), persona: true, conjuntura: true, municipio: true, eleitorado: true, social: true, cadeiras: true });
const contagens = (l: LinhaUsoCampos[]) => usoPorFuncionalidade(l).map((x) => x.mandatos);

test('devolve as 6 linhas da Fase 1, na ordem da spec (ADM-12.11)', () => {
  const r = usoPorFuncionalidade([vazia('a')]);
  assert.deepEqual(r.map((x) => x.nome), ['Persona', 'Conjuntura', 'Município', 'Eleitorado', 'Social', 'Cadeiras e escalação']);
  assert.deepEqual(r.map((x) => x.id), ['persona', 'conjuntura', 'municipio', 'eleitorado', 'social', 'cadeiras']);
});

test('zero mandatos: as 6 linhas continuam, todas com 0', () => {
  assert.deepEqual(contagens([]), [0, 0, 0, 0, 0, 0]);
});

test('todos os mandatos usaram tudo: cada linha conta todos', () => {
  assert.deepEqual(contagens([todas('a'), todas('b'), todas('c')]), [3, 3, 3, 3, 3, 3]);
});

test('um só mandato que usou uma só funcionalidade soma 1 só naquela linha', () => {
  assert.deepEqual(contagens([{ ...vazia('a'), municipio: true }, vazia('b')]), [0, 0, 1, 0, 0, 0]);
});

test('cada campo alimenta a sua linha e nenhuma outra', () => {
  const campos = ['persona', 'conjuntura', 'municipio', 'eleitorado', 'social', 'cadeiras'] as const;
  campos.forEach((c, i) => {
    const esperado = [0, 0, 0, 0, 0, 0];
    esperado[i] = 1;
    assert.deepEqual(contagens([{ ...vazia('a'), [c]: true }]), esperado, c);
  });
});

test('mandato arquivado fica de fora, quando a linha traz arquivado_em (ADM-08.1)', () => {
  const r = usoPorFuncionalidade([todas('a'), { ...todas('b'), arquivado_em: '2026-10-01T12:00:00Z' }]);
  assert.deepEqual(r.map((x) => x.mandatos), [1, 1, 1, 1, 1, 1]);
});

test('aberturas e tendência ficam null sem registro de uso (ADM-12.12)', () => {
  for (const linha of usoPorFuncionalidade([todas('a')])) {
    assert.equal(linha.aberturas, null);
    assert.equal(linha.tendencia, null);
  }
});

test('não altera a lista recebida', () => {
  const l = [todas('a'), vazia('b')];
  const antes = JSON.stringify(l);
  usoPorFuncionalidade(l);
  assert.equal(JSON.stringify(l), antes);
});
