import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statusMissoes } from '../lib/convites/missoes.ts';

// 5 missões; a ordem reinicia em cada missão (como em exercicios_guia).
const catalogo = [
  { id: 'a1', missao: 1, ordem: 1, titulo: 'A1' },
  { id: 'a2', missao: 1, ordem: 2, titulo: 'A2' },
  { id: 'b1', missao: 2, ordem: 1, titulo: 'B1' },
  { id: 'c1', missao: 3, ordem: 1, titulo: 'C1' },
  { id: 'c2', missao: 3, ordem: 2, titulo: 'C2' },
  { id: 'd1', missao: 4, ordem: 1, titulo: 'D1' },
  { id: 'e1', missao: 5, ordem: 1, titulo: 'E1' },
];

const status = (feitos: Record<string, boolean> | null | undefined) => statusMissoes(feitos, catalogo).map((m) => m.status);

test('todos os exercícios da missão feitos devolvem "Concluída" (ACE-05.3)', () => {
  assert.deepEqual(statusMissoes({ a1: true, a2: true }, catalogo)[0], { missao: 1, status: 'Concluída' });
});

test('ao menos um e não todos devolve "Em andamento" (ACE-05.3)', () => {
  assert.deepEqual(statusMissoes({ c2: true }, catalogo)[2], { missao: 3, status: 'Em andamento' });
});

test('nenhum exercício feito devolve "A fazer" (ACE-05.3)', () => {
  assert.deepEqual(statusMissoes({ a1: true }, catalogo)[1], { missao: 2, status: 'A fazer' });
});

test('devolve as 5 missões na ordem do catálogo com feitos vazio', () => {
  assert.deepEqual(statusMissoes({}, catalogo), [1, 2, 3, 4, 5].map((missao) => ({ missao, status: 'A fazer' })));
});

test('feitos nulo ou ausente também devolve as 5 missões "A fazer"', () => {
  const esperado = ['A fazer', 'A fazer', 'A fazer', 'A fazer', 'A fazer'];
  assert.deepEqual(status(null), esperado);
  assert.deepEqual(status(undefined), esperado);
});

test('exercício com valor falso ou ausente não conta', () => {
  assert.deepEqual(status({ a1: true, a2: false }), ['Em andamento', 'A fazer', 'A fazer', 'A fazer', 'A fazer']);
  assert.deepEqual(status({ b1: false, zzz: true }), ['A fazer', 'A fazer', 'A fazer', 'A fazer', 'A fazer']);
});

test('a ordem do catálogo vale mesmo com linhas embaralhadas', () => {
  const embaralhado = [...catalogo].reverse();
  assert.deepEqual(statusMissoes({ e1: true }, embaralhado).map((m) => m.missao), [1, 2, 3, 4, 5]);
  assert.equal(statusMissoes({ e1: true }, embaralhado)[4].status, 'Concluída');
});

test('situações mistas em uma só chamada', () => {
  assert.deepEqual(status({ a1: true, a2: true, b1: true, c1: true, d1: false }), [
    'Concluída',
    'Concluída',
    'Em andamento',
    'A fazer',
    'A fazer',
  ]);
});

test('catálogo vazio devolve lista vazia', () => {
  assert.deepEqual(statusMissoes({ a1: true }, []), []);
});
