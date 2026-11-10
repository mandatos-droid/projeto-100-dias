import { test, expect, type Page } from '@playwright/test';
import * as area from './area-api';
import { LIA } from './area-api';

/* Endereços antigos da Área do mandato (AMA-03): /mandato e /mandato/equipe redirecionam para o Guia; sem sessão o Guia
   mostra a entrada com o Google e, na volta do login, abre a aba pedida. O Supabase é simulado (area-api.ts). */

const aba = (page: Page, nome: string) => page.getByRole('tablist', { name: 'Área do mandato' }).getByRole('tab', { name: nome });

test.afterEach(() => {
  expect(area.naoMapeadas()).toEqual([]);
});

test.describe('redirects do Next (AMA-03.1, 03.2)', () => {
  test('/mandato responde redirect permanente para /guia#/config (AMA-03.1)', async ({ request }) => {
    const r = await request.get('/mandato', { maxRedirects: 0 });
    expect(r.status()).toBe(308);
    expect(r.headers()['location']).toMatch(/\/guia#\/config$/);
  });

  test('/mandato/equipe responde redirect permanente para /guia#/config/equipe (AMA-03.2)', async ({ request }) => {
    const r = await request.get('/mandato/equipe', { maxRedirects: 0 });
    expect(r.status()).toBe(308);
    expect(r.headers()['location']).toMatch(/\/guia#\/config\/equipe$/);
  });

  test('no navegador, /mandato abre a Visão geral da Área do mandato (AMA-03.1)', async ({ page }) => {
    await area.abreArea(page, '#/');
    await page.goto('/mandato');
    await expect(page).toHaveURL(/\/guia#\/config$/);
    await expect(aba(page, 'Visão geral')).toHaveAttribute('aria-selected', 'true');
  });

  test('no navegador, /mandato/equipe abre a aba Equipe e convites (AMA-03.2)', async ({ page }) => {
    await area.abreArea(page, '#/');
    await page.goto('/mandato/equipe');
    await expect(page).toHaveURL(/\/guia#\/config\/equipe$/);
    await expect(aba(page, 'Equipe e convites (2)')).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('Guia sem link para o endereço antigo (AMA-03.4)', () => {
  for (const hash of ['#/config', '#/config/dados', '#/config/equipe', '#/config/conta', '#/']) {
    test(`nenhum link para /mandato em ${hash} (AMA-03.4)`, async ({ page }) => {
      await area.abreArea(page, hash);
      await expect(page.locator('a[href^="/mandato"]')).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Abrir Equipe e convites' })).toHaveCount(0);
    });
  }
});

test.describe('sem sessão (AMA-03.5)', () => {
  const GOOGLE = new RegExp(`${area.LIA.id}|/auth/v1/authorize`);

  /** Abre o endereço antigo sem token e espera a entrada com o Google. */
  async function semSessao(page: Page, endereco: string) {
    await area.abreArea(page, '#/');
    await page.evaluate(() => { localStorage.removeItem('legisla.tok'); });
    await page.route((u) => u.pathname === '/auth/v1/authorize', (rota) =>
      rota.fulfill({ status: 200, headers: { 'content-type': 'text/html' }, body: '<!doctype html><title>google</title><h1>Google</h1>' }));
    await page.goto(endereco);
    await page.locator('#entrada').waitFor();
  }

  test('/mandato/equipe sem sessão mostra a entrada com o Google (AMA-03.5)', async ({ page }) => {
    await semSessao(page, '/mandato/equipe');
    await expect(page).toHaveURL(/\/guia#\/config\/equipe$/);
    await expect(page.locator('#entrada').getByRole('button', { name: /Google/ })).toBeVisible();
    await expect(page.locator('#ladoNav .it')).toHaveCount(0);
  });

  test('entrar com o Google guarda a aba pedida e volta a ela depois do login (AMA-03.5)', async ({ page }) => {
    await semSessao(page, '/mandato/equipe');
    await page.locator('#entrada').getByRole('button', { name: /Google/ }).click();
    await expect(page).toHaveURL(GOOGLE);
    // a volta do Google: origin + pathname + fragmento da sessão, sem o hash que a pessoa pediu
    // (o hash guardado só é legível na origem do Guia; a prova é a aba pedida abrir na volta)
    await page.goto(`/guia#access_token=${LIA.token}&refresh_token=${LIA.refresh}`);
    await page.locator('#ladoNav .it').first().waitFor();
    await expect(page).toHaveURL(/\/guia#\/config\/equipe$/);
    await expect(aba(page, 'Equipe e convites (2)')).toHaveAttribute('aria-selected', 'true');
    expect(await page.evaluate(() => sessionStorage.getItem('legisla.hashVolta'))).toBeNull();
  });

  test('/mandato sem sessão volta à Visão geral depois do login (AMA-03.5)', async ({ page }) => {
    await semSessao(page, '/mandato');
    await page.locator('#entrada').getByRole('button', { name: /Google/ }).click();
    await page.goto(`/guia#access_token=${LIA.token}&refresh_token=${LIA.refresh}`);
    await page.locator('#ladoNav .it').first().waitFor();
    await expect(page).toHaveURL(/\/guia#\/config$/);
    await expect(aba(page, 'Visão geral')).toHaveAttribute('aria-selected', 'true');
  });

  test('entrar sem endereço antigo (#/) volta ao painel, sem aba forçada (AMA-03.5)', async ({ page }) => {
    await area.abreArea(page, '#/');
    await page.evaluate(() => { localStorage.removeItem('legisla.tok'); });
    await page.route((u) => u.pathname === '/auth/v1/authorize', (rota) =>
      rota.fulfill({ status: 200, headers: { 'content-type': 'text/html' }, body: '<h1>Google</h1>' }));
    await page.goto('about:blank'); // navegação completa: só o hash mudando não recarregaria o Guia
    await page.goto('/guia#/');
    await page.locator('#entrada').waitFor();
    await page.locator('#entrada').getByRole('button', { name: /Google/ }).click();
    await expect(page).toHaveURL(GOOGLE);
    await page.goto(`/guia#access_token=${LIA.token}&refresh_token=${LIA.refresh}`);
    await page.locator('#ladoNav .it').first().waitFor();
    await expect(page).not.toHaveURL(/#\/config/);
  });
});
