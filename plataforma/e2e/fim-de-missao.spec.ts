import { test, expect } from '@playwright/test';
import { abreGuia } from './guia-real';
import type { Page } from '@playwright/test';

/* O botão só aparece no último passo do exercício: avança até o "Avançar" sumir. */
async function ateOFim(page: Page) {
  const avancar = page.locator('#tela .passo-rodape').getByRole('button', { name: 'Avançar', exact: true });
  for (let i = 0; i < 30 && (await avancar.count()) > 0; i++) await avancar.click();
}

/* No último exercício de cada missão, o botão vira "Iniciar missão N" e leva à capa da próxima (não ao 1º exercício dela). */
for (const n of [1, 2, 3, 4]) {
  test(`fim da Missão ${n}: "Iniciar missão ${n + 1}" abre a capa`, async ({ page }) => {
    await abreGuia(page, `#/m/${n}`);
    const ultimo = await page.evaluate((k) => {
      const m = (window as any).MISSOES.find((x: any) => x.n === k);
      return m.exercicios[m.exercicios.length - 1].id as string;
    }, n);
    await page.evaluate(([k, id]) => { location.hash = `#/m/${k}/${id}`; }, [n, ultimo] as const);
    await ateOFim(page);
    const botao = page.locator('#tela .passo-rodape .bt.fant');
    await expect(botao).toHaveText(`Iniciar missão ${n + 1} ›`);
    await botao.click();
    await expect(page).toHaveURL(new RegExp(`#/m/${n + 1}$`));
  });
}

test('exercício que não é o último segue com "Próximo exercício"', async ({ page }) => {
  await abreGuia(page, '#/m/2/m2.funcoes');
  await ateOFim(page);
  await expect(page.locator('#tela .passo-rodape .bt.fant')).toHaveText('Próximo exercício ›');
});

test('último exercício da última missão não oferece "Iniciar missão"', async ({ page }) => {
  await abreGuia(page, '#/m/5');
  const id = await page.evaluate(() => {
    const m = (window as any).MISSOES.find((x: any) => x.n === 5);
    return m.exercicios[m.exercicios.length - 1].id as string;
  });
  await page.evaluate((i) => { location.hash = `#/m/5/${i}`; }, id);
  await ateOFim(page);
  await expect(page.locator('#tela .passo-rodape .bt.fant')).toHaveText('Próximo exercício ›');
});
