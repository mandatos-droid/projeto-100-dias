import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contadorDias } from '../lib/contadorDias.ts';

/* CFG-01: o contador mostra quantos dias faltam. d = diaAtual() (dia 1 = dia da posse). */
const texto = (d: number | null) => contadorDias(d)?.texto;

test('sem data de posse não há contador', () => {
  assert.equal(contadorDias(null), null);
});

test('posse futura: faltam N dias para a posse, com singular para 1 dia', () => {
  assert.equal(texto(-4), 'faltam 5 dias para a posse');
  assert.equal(texto(0), 'falta 1 dia para a posse');
  assert.equal(texto(-29), 'faltam 30 dias para a posse');
});

test('dias 1 a 99: faltam 100 menos o dia, com singular no dia 99', () => {
  assert.equal(texto(1), 'faltam 99 dias');
  assert.equal(texto(30), 'faltam 70 dias');
  assert.equal(texto(99), 'falta 1 dia');
});

test('dia 100 é o último dia dos 100', () => {
  assert.equal(texto(100), 'último dia dos 100');
  assert.equal(contadorDias(100)?.num, null);
});

test('acima de 100: 100 dias concluídos, nunca o número bruto', () => {
  assert.equal(texto(101), '100 dias concluídos');
  assert.equal(texto(283), '100 dias concluídos');
  assert.doesNotMatch(String(texto(283)), /283/);
});

test('as partes montam o texto e nenhuma saída tem "undefined" nem "null"', () => {
  for (const d of [-4, 0, 1, 30, 99, 100, 101, 283]) {
    const c = contadorDias(d)!;
    assert.doesNotMatch(c.texto, /undefined|null/);
    assert.doesNotMatch(c.pos, /undefined|null/);
    assert.equal(c.texto, [c.pre, c.num, c.pos].filter((p) => p !== '' && p !== null).join(' ').replace(/\n/g, ' '));
  }
});
