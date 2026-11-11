import { test, expect } from '@playwright/test';
import { abreGuia } from './guia-real';

/* Missão 1 · faixa das 4 etapas (sugestão #21). */
const ETAPAS = ['A Persona', 'A Conjuntura', 'As Oportunidades e Ameaças', 'As Fragilidades e Fortalezas'];
const EXERCICIOS = ['m1.persona', 'm1.conjuntura', 'm1.oportunidades', 'm1.frag'];

test.describe('Faixa das 4 etapas (SUG-21)', () => {
  EXERCICIOS.forEach((id, i) => {
    test(`em ${id} mostra as 4 etapas e marca só a ${i + 1}ª como atual`, async ({ page }) => {
      await abreGuia(page, `#/m/1/${id}`);
      const faixa = page.getByRole('navigation', { name: 'As 4 etapas do Mapa Político' });
      await expect(faixa.getByRole('listitem')).toHaveText(ETAPAS.map((e, n) => new RegExp(`${n + 1}\s*${e}`)));
      await expect(faixa.locator('[aria-current="step"]')).toHaveCount(1);
      await expect(faixa.locator('li').nth(i)).toHaveAttribute('aria-current', 'step');
    });
  });

  test('clicar numa etapa abre o exercício dela', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.persona');
    await page.getByRole('navigation', { name: 'As 4 etapas do Mapa Político' }).getByRole('link', { name: /As Fragilidades e Fortalezas/ }).click();
    await expect(page).toHaveURL(/#\/m\/1\/m1\.frag$/);
    await expect(page.locator('.etiqueta')).toContainText('As fragilidades e fortalezas');
  });

  test('nas Missões 2 a 5 a faixa das 4 etapas do Mapa Político não aparece', async ({ page }) => {
    const faixa = page.getByRole('navigation', { name: 'As 4 etapas do Mapa Político' });
    await abreGuia(page, '#/m/2');
    await expect(faixa).toHaveCount(0);
    await abreGuia(page, '#/m/3/m3.bandeiras');
    await expect(faixa).toHaveCount(0);
  });
});
