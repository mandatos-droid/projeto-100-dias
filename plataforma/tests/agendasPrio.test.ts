import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alterna, faltam } from '../lib/agendasPrio.ts';

test('marcar acrescenta a agenda no fim da lista (AGE-02)', () => {
  assert.deepEqual(alterna([], 'saude'), { lista: ['saude'] });
  assert.deepEqual(alterna(['saude'], 'educacao'), { lista: ['saude', 'educacao'] });
});

test('a 4ª marcação não entra e devolve erro cheio (AGE-03)', () => {
  const tres = ['saude', 'educacao', 'campo'];
  const r = alterna(tres, 'mulheres');
  assert.equal(r.erro, 'cheio');
  assert.deepEqual(r.lista, tres);
});

test('desmarcar remove e libera vaga (AGE-04)', () => {
  const r = alterna(['saude', 'educacao', 'campo'], 'educacao');
  assert.deepEqual(r, { lista: ['saude', 'campo'] });
  assert.equal(alterna(r.lista, 'mulheres').erro, undefined);
});

test('id fora das 13 agendas é ignorado, mesmo com a lista cheia (AGE-02)', () => {
  assert.deepEqual(alterna(['saude'], 'inexistente'), { lista: ['saude'] });
  assert.deepEqual(alterna(['saude', 'educacao', 'campo'], 'inexistente'), { lista: ['saude', 'educacao', 'campo'] });
});

test('não altera a lista recebida', () => {
  const a = ['saude'];
  alterna(a, 'educacao');
  assert.deepEqual(a, ['saude']);
});

test('faltam devolve 3 menos o tamanho da lista (AGE-02)', () => {
  assert.equal(faltam([]), 3);
  assert.equal(faltam(['saude']), 2);
  assert.equal(faltam(['saude', 'educacao', 'campo']), 0);
});
