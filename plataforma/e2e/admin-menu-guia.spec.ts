import { test, expect } from '@playwright/test';
import { abreGuia } from './guia-real';

/* Atalhos do menu lateral do Guia: Biblioteca de Mandatos no grupo Mandato e grupo Admin só para a equipe Legisla. */
const nomes = (page: import('@playwright/test').Page) => page.locator('#ladoNav .it .tx').allTextContents();

test('Biblioteca de Mandatos fica logo após o Resumo do preenchimento e sai do rodapé', async ({ page }) => {
  await abreGuia(page);
  const lista = await nomes(page);
  expect(lista.indexOf('Biblioteca de Mandatos')).toBe(lista.indexOf('Resumo do preenchimento') + 1);
  await expect(page.locator('#itemBiblioMandatos')).toHaveAttribute('href', /legislabrasil\.org\/biblioteca/);
  await expect(page.locator('#itemBiblioMandatos')).toHaveAttribute('target', '_blank');
  await expect(page.locator('#linkBiblio')).toBeHidden();
  await expect(page.locator('#ladoNav a[href="#/resumo"] + a')).toHaveCount(1);
});

test('sem ser da equipe Legisla não aparece o grupo Admin', async ({ page }) => {
  await abreGuia(page);
  await expect(page.locator('#itemPainelAdmin')).toHaveCount(0);
  await expect(page.locator('#ladoNav .nav-grupo', { hasText: 'Admin' })).toHaveCount(0);
});

test('equipe Legisla vê o grupo Admin com o Painel admin apontando para /admin', async ({ page }) => {
  await abreGuia(page);
  await page.evaluate(() => { (window as any).Sug.ehEquipe = true; (window as any).App.lateral(); });
  await expect(page.locator('#ladoNav .nav-grupo', { hasText: 'Admin' })).toHaveCount(1);
  await expect(page.locator('#itemPainelAdmin')).toHaveAttribute('href', '/admin');
  const lista = await nomes(page);
  expect(lista.at(-1)).toBe('Painel admin');
  expect(lista.filter((n) => n === 'Biblioteca de Mandatos')).toHaveLength(1);
});
