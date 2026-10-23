import { test, expect } from '@playwright/test';

test('o servidor de desenvolvimento responde e a raiz abre', async ({ page }) => {
  const r = await page.goto('/');
  expect(r?.status()).toBe(200);
  await expect(page.locator('body')).toBeVisible();
});

import { abre, camposDe } from './semente';

test('a rota de teste monta a ilha pedida com D.campos vazio', async ({ page }) => {
  await abre(page, ['organograma']);
  await expect(page.locator('.ilha-corpo').first()).toBeVisible();
  expect(await camposDe(page)).toEqual({});
});

test('a semente preenche D.campos antes de a ilha montar', async ({ page }) => {
  await abre(page, ['organograma'], { 'm2.f1': 'Ana Souza' });
  expect((await camposDe(page))['m2.f1']).toBe('Ana Souza');
  await expect(page.locator('.es-no[data-cadeira="0"]')).toContainText('Ana Souza');
});
