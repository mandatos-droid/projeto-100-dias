import { test, expect } from '@playwright/test';
import { abre } from './semente';

const ILHA = 'organograma';
const base = { 'm2.coords': 'Comunicação|Legislativo', 'm2.on': '0|1|2|7|8', 'm2.f1': 'Ana Souza', 'm2.f8': 'Bia Lima' };
const opacidade = (page: import('@playwright/test').Page, i: number) =>
  page.locator(`.react-flow__node:has([data-cadeira="${i}"])`).evaluate((el) => getComputedStyle(el).opacity);

/* Os testes do anel de progresso, do contador de escopo, do painel da cadeira, de "Acrescentar cadeira", da cadeia de rotinas
   no organograma e das linhas entre áreas saíram na T18: essas telas foram substituídas pela tabela de equipe e pelo organograma
   gerado (RM2-37; a comunicação entre áreas saiu da spec). Os de organograma gerado estão em m23-organograma.spec.ts. */
test.describe('Organograma: canvas e caixa (MEQ-09, MEQ-11, MEQ-15)', () => {
  test('o filtro por área esmaece as outras áreas sem escondê-las', async ({ page }) => {
    await abre(page, [ILHA], base);
    await page.getByRole('button', { name: 'Legislativo' }).click();
    await expect(page.locator('.es-no[data-cadeira="7"]')).toBeVisible();
    expect(Number(await opacidade(page, 7))).toBeLessThan(1);
    expect(Number(await opacidade(page, 1))).toBe(1);
    await page.getByRole('button', { name: 'Todas' }).click();
    expect(Number(await opacidade(page, 7))).toBe(1);
  });

  test('"só cadeiras com nome" tira as vagas e "Ajustar layout" enquadra tudo de novo', async ({ page }) => {
    await abre(page, [ILHA], base);
    await expect(page.locator('.es-no')).toHaveCount(5);
    await page.getByLabel('só cadeiras com nome').check();
    await expect(page.locator('.es-no')).toHaveCount(2);
    await page.getByLabel('só cadeiras com nome').uncheck();
    await expect(page.locator('.es-no')).toHaveCount(5);
    const vp = page.locator('.react-flow__viewport');
    const inicial = await vp.getAttribute('style');
    await page.locator('.react-flow__controls-zoomin').click();
    await expect.poll(async () => vp.getAttribute('style')).not.toBe(inicial);
    await page.getByRole('button', { name: 'Ajustar layout' }).click();
    await expect.poll(async () => vp.getAttribute('style')).toBe(inicial);
  });
});

test.describe('Organograma só com teclado (MEQ-16)', () => {
  test('Tab chega a uma caixa e as ações da barra funcionam só com teclado', async ({ page }) => {
    await abre(page, [ILHA], base);
    await page.getByRole('button', { name: 'Ajustar layout' }).focus();
    let achou = false;
    for (let k = 0; k < 40 && !achou; k++) {
      await page.keyboard.press('Tab');
      achou = await page.evaluate(() => document.activeElement?.classList.contains('react-flow__node') ?? false);
    }
    expect(achou).toBe(true);
    await page.getByRole('button', { name: 'Legislativo' }).focus();
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Legislativo' })).toHaveAttribute('aria-pressed', 'true');
  });
});
