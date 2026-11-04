import { test, expect } from '@playwright/test';
import { abreGuia, salvoDe } from './guia-real';

/* Missão 1 · Fragilidades (sugestões #22 e #23): comando, checklist e plano de estudo na mesma página. */
test.describe('Fragilidades e fortalezas numa página só (SUG-22, SUG-23)', () => {
  test('um passo só: comando, checklist, diagnóstico e plano de estudo, nessa ordem', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.frag');
    await expect(page.locator('.passo-conta')).toHaveText('1 de 1');
    await expect(page.getByText('Quais são os conhecimentos e/ou práticas')).toBeVisible();
    await expect(page.locator('.frag-i').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Diagnóstico das fragilidades' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tornando fragilidades em fortalezas!' })).toBeVisible();
    await expect(page.locator('#tela')).not.toContainText('Para fechar');
    const y = async (sel: string) => (await page.locator(sel).first().boundingBox())!.y;
    const lista = await y('.frag-l'), diag = await y('.diag-frag'), plano = await y('h4:has-text("Tornando fragilidades")');
    expect(lista).toBeLessThan(diag);
    expect(diag).toBeLessThan(plano);
  });

  test('o link leva à Biblioteca', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.frag');
    await page.getByRole('link', { name: 'Clique no link da nossa Biblioteca' }).click();
    await expect(page).toHaveURL(/#\/biblioteca$/);
  });

  test('classificar uma fragilidade como Gabinete continua gravando em D.frags', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.frag');
    await page.locator('.frag-i').first().getByRole('button', { name: 'Gabinete' }).click();
    await expect.poll(async () => ((await salvoDe(page)).dados as { frags?: { mp?: string }[] }).frags?.[0]?.mp).toBe('M');
    await expect(page.locator('.diag-frag')).toContainText('1');
  });
});
