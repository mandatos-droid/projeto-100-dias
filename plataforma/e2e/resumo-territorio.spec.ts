import { test, expect, type Page } from '@playwright/test';
import { abreGuia } from './guia-real';

/* Problemas e potencialidades por território na pergunta 8 do Resumo (RES-08): tabela Território | Problemas | Potencialidades. */
let n = 0;
const item = (tipo: string, nomes: string[], agenda: string, texto: string, nivel = 'UF', uf = '') =>
  ({ id: `s${++n}`, nivel, tipo, agenda, texto, uf, alvos: [], nomes });
/* um problema em SP e RJ e uma potencialidade em SP */
const SP_RJ = [
  item('problema', ['São Paulo', 'Rio de Janeiro'], 'saude', 'Fila de espera por consultas'),
  item('potencialidade', ['São Paulo'], 'educacao', 'Rede de escolas técnicas'),
];

async function abre(page: Page, itens: unknown[]) {
  await abreGuia(page, '#/resumo', { dados: { campos: { 'm1.q7': 'Expectativas do eleitorado' }, social: { itens } } });
  await expect(page.locator('#tela .seg')).toHaveCount(5);
}
const corpo = (page: Page) => page.locator('#tela details.ex:has(a.ex-link[href="#/m/1/m1.oportunidades"]) .ex-corpo');
const linha = (page: Page, t: string) => corpo(page).locator('table.terr tbody tr', { has: page.locator('th', { hasText: new RegExp(`^${t}$`) }) });

test('com um problema em SP e RJ e uma potencialidade em SP: 2 linhas, SP com os dois tipos e RJ com "—" em Potencialidades (RES-08.1, RES-08.5)', async ({ page }) => {
  await abre(page, SP_RJ);
  await expect(corpo(page).locator('table.terr thead th')).toHaveText(['Território', 'Problemas', 'Potencialidades']);
  await expect(corpo(page).locator('table.terr tbody tr')).toHaveCount(2);
  await expect(corpo(page).locator('table.terr tbody th')).toHaveText(['Rio de Janeiro', 'São Paulo']);
  const sp = linha(page, 'São Paulo').locator('td');
  await expect(sp.nth(0)).toContainText('Saúde');
  await expect(sp.nth(1)).toContainText('Educação');
  const rj = linha(page, 'Rio de Janeiro').locator('td');
  await expect(rj.nth(0)).toContainText('Saúde');
  await expect(rj.nth(1)).toHaveText('—');
});

test('a etiqueta do problema é vermelha e a da potencialidade verde, com o nome da agenda e o texto menor abaixo (RES-08.4)', async ({ page }) => {
  await abre(page, SP_RJ);
  const sp = linha(page, 'São Paulo');
  const prob = sp.locator('td').nth(0).locator('.tag.prob');
  const pot = sp.locator('td').nth(1).locator('.tag.pot');
  await expect(prob).toHaveText('Saúde');
  await expect(pot).toHaveText('Educação');
  await expect(prob).toHaveCSS('color', 'rgb(163, 42, 32)');
  await expect(pot).toHaveCSS('color', 'rgb(3, 82, 82)');
  const texto = sp.locator('td').nth(0).locator('small');
  await expect(texto).toHaveText('Fila de espera por consultas');
  const [t, e] = await Promise.all([texto.boundingBox(), prob.boundingBox()]);
  expect(t!.y).toBeGreaterThanOrEqual(e!.y + e!.height - 1); // o texto vem abaixo da etiqueta
  expect(await texto.evaluate((x) => parseFloat(getComputedStyle(x).fontSize))).toBeLessThan(
    await prob.evaluate((x) => parseFloat(getComputedStyle(x).fontSize)));
});

test('as linhas seguem Brasil, UFs e municípios, em ordem alfabética pt-BR (RES-08.2, RES-08.3)', async ({ page }) => {
  await abre(page, [
    item('problema', ['Campinas'], 'saude', 'a', 'MUN', 'SP'), item('problema', ['Distrito Federal'], 'saude', 'b'),
    item('potencialidade', [], 'educacao', 'c', 'BR'), item('problema', ['Ceará'], 'saude', 'd'),
  ]);
  await expect(corpo(page).locator('table.terr tbody th')).toHaveText(['Brasil', 'Ceará', 'Distrito Federal', 'Campinas (SP)']);
});

test('sem itens a pergunta mostra "Nada registrado ainda." e nenhuma tabela (RES-08.6)', async ({ page }) => {
  await abre(page, []);
  const social = corpo(page).locator('[data-ilha="social-resumo"]');
  await expect(social.getByText('Nada registrado ainda.')).toBeVisible();
  await expect(corpo(page).locator('table.terr')).toHaveCount(0);
});

test('a 375 px a tabela rola dentro do quadro e a página não ganha rolagem horizontal (RES-08.7)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await abre(page, SP_RJ);
  const quadro = corpo(page).locator('.terr-w');
  await expect(quadro).toBeVisible();
  const m = await quadro.evaluate((e) => ({ rola: e.scrollWidth > e.clientWidth, overflow: getComputedStyle(e).overflowX }));
  expect(m).toEqual({ rola: true, overflow: 'auto' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('o quadro rolável é alcançável por teclado e tem nome acessível (RES-13.3)', async ({ page }) => {
  await abre(page, SP_RJ);
  const quadro = corpo(page).getByRole('region', { name: 'Problemas e potencialidades por território' });
  await quadro.focus();
  await expect(quadro).toBeFocused();
});

test('o texto do item sai escapado, sem virar HTML (RES-08.4)', async ({ page }) => {
  await abre(page, [item('problema', ['Bahia'], 'saude', '<b>negrito</b> & cia')]);
  const c = linha(page, 'Bahia').locator('td').nth(0).locator('small');
  await expect(c).toHaveText('<b>negrito</b> & cia');
  await expect(c.locator('b')).toHaveCount(0);
});
