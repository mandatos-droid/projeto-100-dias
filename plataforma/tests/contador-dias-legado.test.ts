import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { contadorDias } from '../lib/contadorDias.ts';

/* CFG-01: a cópia de contadorDias em public/legacy/novos.js tem de dar o mesmo resultado que lib/contadorDias.ts. */
const fonte = readFileSync(new URL('../public/legacy/novos.js', import.meta.url), 'utf8');
const bloco = fonte.match(/\/\* contadorDias:inicio \*\/([\s\S]*?)\/\* contadorDias:fim \*\//)?.[1];

test('novos.js traz o bloco marcado da cópia', () => {
  assert.ok(bloco, 'faltam os marcadores contadorDias:inicio/fim em novos.js');
});

test('a cópia do legado e a lib dão o mesmo resultado nos mesmos casos', () => {
  const ctx: Record<string, unknown> = {};
  vm.createContext(ctx);
  vm.runInContext(`${bloco}; this.f = contadorDias;`, ctx);
  const legado = ctx.f as (d: number | null) => unknown;
  const casos = [null, -29, -4, -1, 0, 1, 2, 30, 98, 99, 100, 101, 283, 999];
  for (const d of casos) assert.deepEqual(JSON.parse(JSON.stringify(legado(d))), contadorDias(d), `d=${d}`);
});
