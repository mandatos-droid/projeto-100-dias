import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lerConfig, carregaConfig } from '../lib/admin/config.ts';

const nucleo = readFileSync(new URL('../public/legacy/nucleo.js', import.meta.url), 'utf8');

test('lerConfig extrai url e chave do bloco prod do nucleo.js real (ADM-01)', () => {
  const c = lerConfig(nucleo);
  assert.match(c.url, /^https:\/\/[a-z0-9]+\.supabase\.co$/);
  assert.ok(c.key.split('.').length === 3, 'a chave pública é um JWT');
});

test('lerConfig lê o bloco prod mesmo com o dev logo depois', () => {
  const t = "var A={prod:{url:'https://p.supabase.co',key:'KP'},dev :{url:'https://d.supabase.co',key:'KD'}};";
  assert.deepEqual(lerConfig(t), { url: 'https://p.supabase.co', key: 'KP' });
});

test('lerConfig falha com mensagem clara sem o bloco prod ou com valores vazios', () => {
  assert.throws(() => lerConfig('var x = 1;'), /não está configurado em nucleo\.js/);
  assert.throws(() => lerConfig("prod:{url:'',key:''}"), /não está configurado em nucleo\.js/);
});

test('carregaConfig busca /legacy/nucleo.js e devolve a configuração', async () => {
  const antes = globalThis.fetch;
  let pedido = '';
  globalThis.fetch = (async (u: string) => { pedido = String(u); return new Response(nucleo); }) as typeof fetch;
  try {
    const c = await carregaConfig();
    assert.equal(pedido, '/legacy/nucleo.js');
    assert.equal(c.url, lerConfig(nucleo).url);
  } finally { globalThis.fetch = antes; }
});
