import { test, expect } from '@playwright/test';
import { abre } from './semente';

const ILHA = 'organograma';
const ESCOPO = 'Definir a estratégia de comunicação: posicionamento, cronograma e gestão de crises';
const base = { 'm2.coords': 'Comunicação|Legislativo', 'm2.on': '0|1|2|7|8', 'm2.f1': 'Ana Souza', 'm2.f8': 'Bia Lima' };
const opacidade = (page: import('@playwright/test').Page, i: number) =>
  page.locator(`.react-flow__node:has([data-cadeira="${i}"])`).evaluate((el) => getComputedStyle(el).opacity);

test.describe('Organograma: canvas e caixa (MEQ-09, MEQ-11, MEQ-15)', () => {
  test('a caixa mostra pessoa, cargo e área, com anel de progresso e o selo "escopo pendente" só sem escopo', async ({ page }) => {
    await abre(page, [ILHA], { ...base, 'm2.p8.escopo': ESCOPO });
    const chefia = page.locator('.es-no[data-cadeira="0"]');
    await expect(chefia).toContainText('Ana Souza');
    await expect(chefia).toContainText('Chefia de gabinete');
    await expect(chefia.getByText('escopo pendente')).toBeVisible();
    await expect(chefia.getByRole('img', { name: '0 de 6 campos do painel preenchidos' })).toBeVisible();
    const coord = page.locator('.es-no[data-cadeira="7"]');
    await expect(coord).toContainText('Bia Lima');
    await expect(coord).toContainText('Comunicação');
    await expect(coord.getByText('escopo pendente')).toHaveCount(0);
    await expect(coord.getByRole('img', { name: '1 de 6 campos do painel preenchidos' })).toBeVisible();
  });

  test('o filtro por área esmaece as outras áreas sem escondê-las', async ({ page }) => {
    await abre(page, [ILHA], base);
    await page.getByRole('button', { name: 'Legislativo' }).click();
    await expect(page.locator('.es-no[data-cadeira="7"]')).toBeVisible();
    expect(Number(await opacidade(page, 7))).toBeLessThan(1);
    expect(Number(await opacidade(page, 1))).toBe(1);
    await page.getByRole('button', { name: 'Todas' }).click();
    expect(Number(await opacidade(page, 7))).toBe(1);
  });

  test('o contador "X/Y cadeiras com escopo" muda quando o escopo de uma cadeira muda', async ({ page }) => {
    await abre(page, [ILHA], { ...base, 'm2.p1.escopo': ESCOPO });
    await expect(page.locator('[data-contador]')).toContainText('1/5 cadeiras com escopo definido');
    await page.evaluate((v) => {
      const w = window as unknown as { D: { campos: Record<string, string> } };
      w.D.campos['m2.p8.escopo'] = v;
      window.dispatchEvent(new Event('guia:mudou'));
    }, ESCOPO);
    await expect(page.locator('[data-contador]')).toContainText('2/5 cadeiras com escopo definido');
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
