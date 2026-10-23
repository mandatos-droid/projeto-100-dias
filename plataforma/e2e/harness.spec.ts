import { test, expect } from '@playwright/test';

test('o servidor de desenvolvimento responde e a raiz abre', async ({ page }) => {
  const r = await page.goto('/');
  expect(r?.status()).toBe(200);
  await expect(page.locator('body')).toBeVisible();
});
