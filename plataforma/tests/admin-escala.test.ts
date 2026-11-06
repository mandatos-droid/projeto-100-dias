import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESCALA_DIAS, diasParado, partesBrasilia } from '../lib/admin/escala.ts';

test('a escala é 7, 15, 30 e 45 dias (ADM-05.5, ADM-05.9)', () => {
  assert.deepEqual([...ESCALA_DIAS], [7, 15, 30, 45]);
});

test('atividade de hoje conta 0 dia parado', () => {
  assert.equal(diasParado('2026-11-05T13:00:00Z', new Date('2026-11-05T15:00:00Z')), 0);
});

test('fronteira de 45 dias: exatamente 45 dias atrás devolve 45, um dia a menos devolve 44', () => {
  const agora = new Date('2026-11-05T15:00:00Z');
  assert.equal(diasParado('2026-09-21T15:00:00Z', agora), 45);
  assert.equal(diasParado('2026-09-22T15:00:00Z', agora), 44);
  // "parado há mais de 45" exige 46
  assert.equal(diasParado('2026-09-20T15:00:00Z', agora), 46);
});

test('data futura não vira número negativo (relógio adiantado): devolve 0', () => {
  assert.equal(diasParado('2026-11-09T15:00:00Z', new Date('2026-11-05T15:00:00Z')), 0);
});

test('virada de mês: de 28/10 a 02/11 são 5 dias (outubro tem 31)', () => {
  assert.equal(diasParado('2026-10-28T15:00:00Z', new Date('2026-11-02T15:00:00Z')), 5);
});

test('virada de fuso: 02:30Z de 01/11 ainda é 31/10 em Brasília, então conta 1 dia até 01/11 de tarde', () => {
  // 2026-11-01T02:30Z = 31/10 23:30 em Brasília (UTC-3, sem horário de verão)
  assert.deepEqual(partesBrasilia('2026-11-01T02:30:00Z'), { ano: 2026, mes: 10, dia: 31 });
  assert.equal(diasParado('2026-11-01T02:30:00Z', new Date('2026-11-01T15:00:00Z')), 1);
});

test('virada de dia perto da meia-noite: 23:50 e 00:10 em Brasília são dias diferentes', () => {
  // 02:50Z = 23:50 de 04/11; 03:10Z = 00:10 de 05/11
  assert.equal(diasParado('2026-11-05T02:50:00Z', new Date('2026-11-05T03:10:00Z')), 1);
  // mesmo dia em Brasília apesar de datas UTC diferentes: 01:00Z e 02:00Z de 05/11 são 04/11 22h e 23h
  assert.equal(diasParado('2026-11-05T01:00:00Z', new Date('2026-11-05T02:00:00Z')), 0);
});

test('o ano vira junto: de 30/12/2026 a 02/01/2027 são 3 dias', () => {
  assert.equal(diasParado('2026-12-30T15:00:00Z', new Date('2027-01-02T15:00:00Z')), 3);
});
