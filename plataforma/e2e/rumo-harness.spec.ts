import { test, expect } from '@playwright/test';
import { abre, camposDe, dadoDe, EQUIPE, MANDATO } from './semente-rumo';

const ILHAS = ['rumo-bandeiras', 'rumo-espacos', 'rumo-legado', 'rumo-preditores', 'rumo-metas', 'plano', 'plano-resumo'];

for (const ilha of ILHAS) {
  test(`a rota de teste monta a ilha ${ilha} (RUM-70)`, async ({ page }) => {
    await abre(page, [ilha]);
    await expect(page.locator(`[data-ilha="${ilha}"] .ilha-corpo`)).toBeVisible();
  });
}

test('monta várias ilhas de uma vez', async ({ page }) => {
  await abre(page, ['rumo-bandeiras', 'rumo-metas']);
  await expect(page.locator('.ilha-corpo')).toHaveCount(2);
});

test('o hook lê o mandato antigo e migra o mural sem gravar nada (RUM-70)', async ({ page }) => {
  await abre(page, ['rumo-bandeiras'], { campos: { 'm3.mural': 'Educação\nSaúde', 'm3.b1': 'Educação' } });
  await expect(page.locator('.rm-chip[aria-pressed="true"]')).toHaveCount(2);
  expect(await dadoDe(page, 'rumo')).toBeUndefined();
  expect((await camposDe(page))['m3.mural']).toBe('Educação\nSaúde');
});

test('a semente leva metas, preditores, equipe e mandato para o D e o Store', async ({ page }) => {
  await abre(page, ['rumo-metas'], {
    campos: EQUIPE, mandato: MANDATO,
    D: { preditores: ['p1'], metas: [{ id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos' }, { id: 'b', pred: 'p1', texto: 'Visitar 10 escolas' }] },
  });
  await expect(page.locator('[data-n-metas="2"]')).toBeVisible();
  expect(await dadoDe(page, 'preditores')).toEqual(['p1']);
  expect((await camposDe(page))['m2.f2']).toBe('Bruno Lima');
  expect(await page.evaluate(() => (window as unknown as { Store: { mandato: Record<string, string> } }).Store.mandato.uf)).toBe('SP');
});
