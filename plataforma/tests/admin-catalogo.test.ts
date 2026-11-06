// O catálogo semeado em exercicios_guia precisa acompanhar MISSOES de public/painel.html (ADM-09, ADM-11).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = join(import.meta.dirname, '..');
type Ex = { id: string; missao: number; ordem: number; titulo: string };

// exercícios de MISSOES: dentro de cada missão, na ordem em que aparecem
function doPainel(): Ex[] {
  const html = readFileSync(join(RAIZ, 'public', 'painel.html'), 'utf8').replaceAll('\r', '');
  const ini = html.indexOf('var MISSOES=[');
  const bloco = html.slice(ini, html.indexOf('\n];', ini));
  const partes = bloco.split(/\n\{\n n:(\d),/);
  const out: Ex[] = [];
  for (let i = 1; i < partes.length; i += 2) {
    let ordem = 0;
    for (const m of partes[i + 1].matchAll(/\{id:'([^']+)', t:'(.*?)', d:'/g)) out.push({ id: m[1], missao: Number(partes[i]), ordem: ++ordem, titulo: m[2] });
  }
  return out;
}

// linhas do insert da migration: ('m1.persona', 1, 1, 'A persona')
function doSeed(): Ex[] {
  const sql = readFileSync(join(RAIZ, 'supabase', 'migrations', '20261105130000_admin_leitura.sql'), 'utf8').replaceAll('\r', '');
  return [...sql.matchAll(/^\s*\('([^']+)', (\d+), (\d+), '([^']*)'\)[,;]?\s*$/gm)]
    .map((m) => ({ id: m[1], missao: Number(m[2]), ordem: Number(m[3]), titulo: m[4] }));
}

test('o painel tem 16 exercícios, 4, 2, 4, 3 e 3 por missão (referência do catálogo)', () => {
  const p = doPainel();
  assert.equal(p.length, 16);
  assert.deepEqual([1, 2, 3, 4, 5].map((n) => p.filter((e) => e.missao === n).length), [4, 2, 4, 3, 3]);
});

test('os ids do seed de exercicios_guia são exatamente os de MISSOES, sem sobra nem falta', () => {
  assert.deepEqual(doSeed().map((e) => e.id).sort(), doPainel().map((e) => e.id).sort());
});

test('missão e ordem de cada exercício do seed batem com o painel', () => {
  const p = new Map(doPainel().map((e) => [e.id, e]));
  for (const e of doSeed()) assert.deepEqual([e.missao, e.ordem], [p.get(e.id)!.missao, p.get(e.id)!.ordem], e.id);
});

test('os títulos do seed batem com os do painel, com os acentos corretos em UTF-8', () => {
  const p = new Map(doPainel().map((e) => [e.id, e.titulo]));
  for (const e of doSeed()) assert.equal(e.titulo, p.get(e.id), e.id);
  assert.ok(doSeed().some((e) => e.titulo === 'A escalação do time'));
});
