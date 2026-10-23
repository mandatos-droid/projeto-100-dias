import { test, expect } from '@playwright/test';
import { abreComp } from './semente-rumo';

const BASE = {
  jornal: 'A Gazeta do Mandato', nome: 'Ana Souza', dataEdicao: 'dezembro de 2030', fechado: false,
  manchete: 'Ana Souza se reelege depois de colocar a Educação no centro do debate',
  linhaFina: 'Educação, Saúde · Reeleição a Deputado(a) Estadual',
};
const jornal = (page: import('@playwright/test').Page) => page.locator('.rm-jornal');

test.describe('Conteúdo (RUM-12.10)', () => {
  test('mostra nome do jornal, data de edição, manchete, linha de apoio e o mandato', async ({ page }) => {
    await abreComp(page, 'jornal', BASE);
    await expect(jornal(page)).toContainText('A Gazeta do Mandato');
    await expect(jornal(page)).toContainText('Edição de dezembro de 2030');
    await expect(jornal(page)).toContainText('Mandato de Ana Souza');
    await expect(page.getByRole('heading', { level: 2, name: BASE.manchete })).toBeVisible();
    await expect(jornal(page).locator('.rm-jn-fina')).toHaveText(BASE.linhaFina);
  });

  test('o selo "Edição fechada" só aparece quando a edição está fechada', async ({ page }) => {
    await abreComp(page, 'jornal', BASE);
    await expect(page.getByText('Edição fechada')).toHaveCount(0);
    await abreComp(page, 'jornal', { ...BASE, fechado: true });
    await expect(page.getByText('Edição fechada')).toBeVisible();
  });

  test('sem manchete mostra o convite, sem "undefined", e sem linha de apoio não deixa linha vazia', async ({ page }) => {
    await abreComp(page, 'jornal', { ...BASE, manchete: '   ', linhaFina: '' });
    await expect(page.getByRole('heading', { level: 2 })).toContainText('A manchete aparece aqui');
    await expect(jornal(page)).not.toContainText('undefined');
    await expect(jornal(page).locator('.rm-jn-fina')).toHaveCount(0);
  });

  test('o nome do jornal vira campo editável quando a tela permite', async ({ page }) => {
    await abreComp(page, 'jornal', { ...BASE, editavel: true });
    const campo = page.getByLabel('Nome do jornal');
    await campo.fill('Diário do Gabinete');
    await expect(campo).toHaveValue('Diário do Gabinete');
    await expect(page.getByRole('article', { name: 'Primeira página de Diário do Gabinete' })).toBeVisible();
  });
});

const LONGA = ('Deputada Ana Souza se candidata ao Governo do Estado depois de provar, ainda na Assembleia, que é possível conciliar ' +
  'crescimento produtivo, proteção ambiental e desenvolvimento social, e de aprovar o projeto que zerou a fila da educação infantil em todo o território paulista, ').repeat(2).slice(0, 280);

for (const [w, h] of [[375, 800], [1280, 900]] as const) {
  test(`manchete de 280 caracteres não estoura o layout em ${w} px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    expect(LONGA).toHaveLength(280);
    await abreComp(page, 'jornal', { ...BASE, manchete: LONGA, fechado: true });
    const caixa = await jornal(page).boundingBox();
    const titulo = await page.getByRole('heading', { level: 2 }).boundingBox();
    expect(titulo!.x).toBeGreaterThanOrEqual(caixa!.x - 1);
    expect(titulo!.x + titulo!.width).toBeLessThanOrEqual(caixa!.x + caixa!.width + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await jornal(page).evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
  });
}

test('palavra sem espaço de 280 letras quebra dentro da página em 375 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await abreComp(page, 'jornal', { ...BASE, manchete: 'A'.repeat(280) });
  expect(await jornal(page).evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
});

test.describe('Segurança e acessibilidade', () => {
  test('HTML e script digitados aparecem como texto e não executam', async ({ page }) => {
    const sujo = '<script>window.__xss=1</script><img src=x onerror="window.__xss=2"><b>negrito</b>';
    await abreComp(page, 'jornal', { ...BASE, manchete: sujo, linhaFina: sujo, nome: sujo });
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(sujo);
    expect(await jornal(page).locator('script, img, b').count()).toBe(0);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });

  test('as colunas decorativas ficam fora da árvore de acessibilidade e a manchete é um h2 nomeado', async ({ page }) => {
    await abreComp(page, 'jornal', BASE);
    await expect(jornal(page).locator('.rm-jn-materia')).toHaveAttribute('aria-hidden', 'true');
    await expect(jornal(page).locator('.rm-jn-materia')).not.toHaveText(/\S/);
    await expect(page.getByRole('heading', { level: 2, name: BASE.manchete })).toHaveCount(1);
    await expect(page.getByRole('article', { name: 'Primeira página de A Gazeta do Mandato' })).toBeVisible();
  });
});

test.describe('Impressão (RUM-12)', () => {
  test('@media print mostra só a primeira página', async ({ page }) => {
    await abreComp(page, 'jornal', { ...BASE, fechado: true }, ['rumo-bandeiras']);
    await expect(page.locator('.rm-chip').first()).toBeVisible();
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.rm-chip').first()).toBeHidden();
    await expect(page.getByRole('heading', { level: 2, name: BASE.manchete })).toBeVisible();
    await expect(page.getByText('Edição fechada')).toBeVisible();
  });

  test('com imprime falso, o jornal não pede página exclusiva na impressão', async ({ page }) => {
    await abreComp(page, 'jornal', { ...BASE, imprime: false });
    await expect(jornal(page)).not.toHaveAttribute('data-imprime', /.*/);
  });
});
