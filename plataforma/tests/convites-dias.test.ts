import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diaDoMandato } from '../lib/convites/dias.ts';

// Brasília é UTC-3 o ano todo (sem horário de verão desde 2019).
const posse = '2026-03-10';

test('na data da posse é o dia 1 (ACE-05.2)', () => {
  assert.deepEqual(diaDoMandato(posse, new Date('2026-03-10T15:00:00Z')), { estado: 'em-curso', dia: 1 });
});

test('99 dias depois da posse é o dia 100 (ACE-05.2)', () => {
  assert.deepEqual(diaDoMandato(posse, new Date('2026-06-17T15:00:00Z')), { estado: 'em-curso', dia: 100 });
});

test('12 dias de contagem: 11 dias depois da posse é o dia 12', () => {
  assert.deepEqual(diaDoMandato(posse, new Date('2026-03-21T15:00:00Z')), { estado: 'em-curso', dia: 12 });
});

test('um dia antes da posse devolve antes (ACE-05.2)', () => {
  assert.deepEqual(diaDoMandato(posse, new Date('2026-03-09T15:00:00Z')), { estado: 'antes' });
});

test('100 dias depois da posse devolve concluido (ACE-05.2)', () => {
  assert.deepEqual(diaDoMandato(posse, new Date('2026-06-18T15:00:00Z')), { estado: 'concluido' });
  assert.deepEqual(diaDoMandato(posse, new Date('2027-01-01T15:00:00Z')), { estado: 'concluido' });
});

test('23:30 em Brasília, que já é o dia seguinte em UTC, conta como o dia de Brasília', () => {
  // 2026-03-10 23:30 BRT = 2026-03-11 02:30 UTC
  assert.deepEqual(diaDoMandato(posse, new Date('2026-03-11T02:30:00Z')), { estado: 'em-curso', dia: 1 });
  // 2026-03-09 23:30 BRT = 2026-03-10 02:30 UTC: ainda é véspera em Brasília
  assert.deepEqual(diaDoMandato(posse, new Date('2026-03-10T02:30:00Z')), { estado: 'antes' });
});

test('a virada do dia acontece à meia-noite de Brasília (03:00 UTC)', () => {
  assert.deepEqual(diaDoMandato(posse, new Date('2026-03-11T02:59:59Z')), { estado: 'em-curso', dia: 1 });
  assert.deepEqual(diaDoMandato(posse, new Date('2026-03-11T03:00:00Z')), { estado: 'em-curso', dia: 2 });
});

test('posse ausente devolve sem-posse', () => {
  assert.deepEqual(diaDoMandato(null, new Date('2026-03-10T15:00:00Z')), { estado: 'sem-posse' });
  assert.deepEqual(diaDoMandato(undefined, new Date('2026-03-10T15:00:00Z')), { estado: 'sem-posse' });
  assert.deepEqual(diaDoMandato('', new Date('2026-03-10T15:00:00Z')), { estado: 'sem-posse' });
});

test('posse com formato inválido também devolve sem-posse', () => {
  assert.deepEqual(diaDoMandato('10/03/2026', new Date('2026-03-10T15:00:00Z')), { estado: 'sem-posse' });
});

test('a travessia de ano e de ano bissexto conta dias de calendário', () => {
  assert.deepEqual(diaDoMandato('2027-12-25', new Date('2028-03-01T15:00:00Z')), { estado: 'em-curso', dia: 68 });
});
