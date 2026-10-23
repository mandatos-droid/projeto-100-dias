import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplica, alternaArea } from '../lib/cadeiras.ts';
import { desliga } from '../lib/rotinas.ts';
import { sugestaoChecklist } from '../lib/entrega.ts';

type C = Record<string, string>;
const ESC = 'Definir a estratégia de comunicação: posicionamento, cronograma e gestão de crises';

test('escopo preenchido em todas as cadeiras com nome sugere c1 (MEQ-23, T-23)', () => {
  const c: C = { 'm2.f1': 'Ana', 'm2.p1.escopo': ESC };
  aplica(c, alternaArea(c, 'Comunicação', true).patch);
  c['m2.f8'] = 'Bia'; c['m2.p8.escopo'] = ESC;
  assert.equal(sugestaoChecklist(c).c1, true);
});

test('uma cadeira com nome e sem escopo mantém c1 falso (MEQ-23)', () => {
  const c: C = { 'm2.f1': 'Ana', 'm2.p1.escopo': ESC };
  aplica(c, alternaArea(c, 'Comunicação', true).patch);
  c['m2.f8'] = 'Bia';
  assert.equal(sugestaoChecklist(c).c1, false);
});

test('cadeira sem nome não exige escopo, mas sem nenhuma pessoa c1 é falso (MEQ-23)', () => {
  const c: C = { 'm2.f1': 'Ana', 'm2.p1.escopo': ESC };
  aplica(c, alternaArea(c, 'Comunicação', true).patch);
  assert.equal(sugestaoChecklist(c).c1, true);
  assert.equal(sugestaoChecklist({}).c1, false);
});

test('c2 sugere quando há ao menos uma cadeira ligada à Chefia de gabinete (MEQ-23)', () => {
  assert.equal(sugestaoChecklist({ 'm2.f1': 'Ana' }).c2, false);
  const c: C = { 'm2.f1': 'Ana' };
  aplica(c, alternaArea(c, 'Legislativo', true).patch);
  assert.equal(sugestaoChecklist(c).c2, true);
});

test('c3 sugere quando cada tipo de rotina gerado tem ao menos uma ativa (MEQ-23)', () => {
  const c: C = { 'm2.f1': 'Ana' };
  aplica(c, alternaArea(c, 'Comunicação', true).patch);
  assert.equal(sugestaoChecklist(c).c3, true);
  aplica(c, desliga(c, 'plan'));
  assert.equal(sugestaoChecklist(c).c3, false);
  assert.equal(sugestaoChecklist({}).c3, false);
});

test('a sugestão só devolve valores: nunca grava m2.c1..c3 (MEQ-23)', () => {
  const c: C = { 'm2.f1': 'Ana', 'm2.p1.escopo': ESC };
  const antes = JSON.stringify(c);
  sugestaoChecklist(c);
  assert.equal(JSON.stringify(c), antes);
  assert.equal(c['m2.c1'], undefined);
});
