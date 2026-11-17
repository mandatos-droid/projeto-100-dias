import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alterna, validas } from '../lib/agendasPrio.ts';
import { AGENDAS, AGENDAS_PRIO } from '../lib/agendas.ts';
import { BANDEIRAS, BANDEIRA_DA_AGENDA } from '../lib/bandeiras.ts';

test('marcar acrescenta a agenda no fim da lista (AGE-02)', () => {
  assert.deepEqual(alterna([], 'saude'), { lista: ['saude'] });
  assert.deepEqual(alterna(['saude'], 'educacao'), { lista: ['saude', 'educacao'] });
});

test('não há limite: da 4ª à última agenda, todas entram', () => {
  let l: string[] = [];
  for (const a of AGENDAS_PRIO) l = alterna(l, a.id).lista;
  assert.equal(l.length, AGENDAS_PRIO.length);
  assert.ok(l.length > 3);
});

test('Modernização do Estado é uma agenda escolhível e não vira cartão social', () => {
  assert.deepEqual(alterna([], 'modernizacao'), { lista: ['modernizacao'] });
  assert.ok(AGENDAS_PRIO.some((a) => a.rot === 'Modernização do Estado'));
  assert.ok(!AGENDAS.some((a) => a.id === 'modernizacao'));
});

test('desmarcar remove (AGE-04)', () => {
  assert.deepEqual(alterna(['saude', 'educacao', 'campo'], 'educacao'), { lista: ['saude', 'campo'] });
});

test('id desconhecido é ignorado', () => {
  assert.deepEqual(alterna(['saude'], 'inexistente'), { lista: ['saude'] });
});

test('não altera a lista recebida', () => {
  const a = ['saude'];
  alterna(a, 'educacao');
  assert.deepEqual(a, ['saude']);
});

test('validas descarta repetidos, ids desconhecidos e lixo, mantendo a ordem', () => {
  assert.deepEqual(validas(['educacao', 'x', 'saude', 'educacao', 3]), ['educacao', 'saude']);
  assert.deepEqual(validas(undefined), []);
});

test('toda agenda da Missão 1 tem uma bandeira da taxonomia para guardar a escolha na Missão 3', () => {
  for (const a of AGENDAS_PRIO) assert.ok(BANDEIRAS.some((b) => b.id === BANDEIRA_DA_AGENDA[a.id]), a.id);
});
