import { test, expect } from '@playwright/test';
import { PREVIA, TOKEN, moca, naoMapeadas } from './convite-api';

/* Cabeçalhos de privacidade da página do convite (ACE-02; design: "Token na URL apareceria em log e em Referer").
   O token vai no fragmento; a página ainda pede ao navegador que não envie o endereço como Referer e aos buscadores
   que não a indexem. Só /convite recebe os dois cabeçalhos. */

test('a página /convite aberta pelo link responde com Referrer-Policy: no-referrer e X-Robots-Tag: noindex', async ({ page }) => {
  await moca(page, { rpc: { convite_previa: () => ({ corpo: PREVIA }) } });
  const resposta = await page.goto(`/convite#${TOKEN}`);
  expect(resposta?.status()).toBe(200);
  const h = resposta!.headers();
  expect(h['referrer-policy']).toBe('no-referrer');
  expect(h['x-robots-tag']).toBe('noindex');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mariana Rocha convidou você');
  expect(naoMapeadas()).toEqual([]);
});

test('a resposta de /guia não recebe os dois cabeçalhos', async ({ request }) => {
  const r = await request.get('/guia');
  expect(r.status()).toBe(200);
  expect(r.headers()['referrer-policy']).toBeUndefined();
  expect(r.headers()['x-robots-tag']).toBeUndefined();
});

test('a resposta de / (landing) não recebe os dois cabeçalhos', async ({ request }) => {
  const r = await request.get('/');
  expect(r.status()).toBe(200);
  expect(r.headers()['referrer-policy']).toBeUndefined();
  expect(r.headers()['x-robots-tag']).toBeUndefined();
});
