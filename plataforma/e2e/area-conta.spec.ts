import { test, expect, type Page } from '@playwright/test';
import * as area from './area-api';

/* Aba Minha conta da Área do mandato (#/config/conta): o e-mail da conta e o perfil da própria pessoa em texto, sem campo
   editável (AMA-02.8, 02.9, 02.10). O Guia abre em modo nuvem com Lia logada; o Supabase é a nuvem em memória de area-api.ts. */

const conta = (page: Page) => page.locator('#areaConta');
const COLUNAS = 'nome,nascimento,genero,raca,telefone,atua,tempo';
const CORRIGIR = 'Para corrigir seus dados, escreva para contato@legislabrasil.org';

/** Pares rótulo → valor que a aba mostra, na ordem. */
const pares = (page: Page) => conta(page).locator('dl > div').evaluateAll((els) =>
  els.map((e) => [e.querySelector('dt')?.textContent ?? '', e.querySelector('dd')?.textContent ?? '']));

const COMPLETO = [
  ['E-mail', 'lia@gabinete.test'],
  ['Nome', 'Lia Torres Almeida'],
  ['Data de nascimento', '17/05/1990'],
  ['Gênero', 'Mulher cisgênero'],
  ['Raça', 'Parda'],
  ['Telefone', '(11) 98765-4321'],
  ['Atuação política', '3 a 5 anos'],
];

test.afterEach(() => {
  expect(area.naoMapeadas()).toEqual([]);
});

test('mostra o e-mail da conta e os campos do próprio perfil, em texto e nesta ordem (AMA-02.8)', async ({ page }) => {
  await area.abreArea(page, '#/config/conta');
  await expect(conta(page).locator('dl')).toBeVisible();
  expect(await pares(page)).toEqual(COMPLETO);
});

test('nenhum campo é editável e aparece "Para corrigir seus dados, escreva para contato@legislabrasil.org" (AMA-02.8)', async ({ page }) => {
  await area.abreArea(page, '#/config/conta');
  await expect(conta(page).locator('dl')).toBeVisible();
  await expect(conta(page).locator('input, select, textarea, [contenteditable="true"]')).toHaveCount(0);
  await expect(conta(page).getByRole('button')).toHaveCount(0);
  await expect(conta(page).getByText(CORRIGIR)).toHaveText(CORRIGIR);
  await expect(conta(page).getByRole('link', { name: 'contato@legislabrasil.org' })).toHaveAttribute('href', 'mailto:contato@legislabrasil.org');
});

test('quem é da equipe Legisla e não tem perfil vê só o e-mail (AMA-02.9)', async ({ page }) => {
  await area.abreArea(page, '#/config/conta', { legisla: true });
  await expect(conta(page).locator('dl')).toBeVisible();
  expect(await pares(page)).toEqual([['E-mail', 'lia@gabinete.test']]);
  await expect(conta(page)).not.toContainText('Nome');
});

test('a aba lê só a linha da própria pessoa em perfis (user_id=eq.<id>), com o token dela', async ({ page }) => {
  await area.abreArea(page, '#/config/conta');
  await expect(conta(page).locator('dl')).toBeVisible();
  const daAba = area.leituras('perfis').filter((p) => p.caminho !== `perfis?select=user_id&user_id=eq.${area.LIA.id}`); // a do Guia, ao abrir
  expect(daAba.map((p) => [p.caminho, p.token])).toEqual([[`perfis?select=${COLUNAS}&user_id=eq.${area.LIA.id}`, area.LIA.token]]);
  expect(area.leituras('perfis').every((p) => p.caminho.endsWith(`&user_id=eq.${area.LIA.id}`))).toBe(true);
});

test('falha ao ler o perfil mostra o erro da aba e "Tentar de novo"; tentar de novo mostra os dados (AMA-02.10)', async ({ page }) => {
  const estado: area.EstadoArea = {};
  await area.abreArea(page, '#/config', estado);
  estado.falha = { perfis: 'servidor' }; // depois de o Guia abrir: só a leitura da aba falha
  await page.getByRole('tab', { name: 'Minha conta' }).click();
  await expect(conta(page).getByRole('alert')).toHaveText('Não foi possível carregar. Tente de novo.');
  await expect(conta(page).locator('dl')).toHaveCount(0); // a falha nunca vira "sem perfil"
  estado.falha = {};
  await conta(page).getByRole('button', { name: 'Tentar de novo' }).click();
  await expect(conta(page).locator('dl')).toBeVisible();
  expect(await pares(page)).toEqual(COMPLETO);
  // as outras abas seguem
  await page.getByRole('tab', { name: 'Visão geral' }).click();
  await expect(page.locator('#areaVisao .md-cartao')).toBeVisible();
});

test.describe('fora do fuso de Brasília', () => {
  test.use({ timezoneId: 'America/Los_Angeles' });
  test('a data de nascimento sai como foi gravada, sem andar um dia com o fuso', async ({ page }) => {
    await area.abreArea(page, '#/config/conta', { perfil: { ...area.PERFIL_LIA, nascimento: '2000-01-01' } });
    await expect(conta(page).locator('dl')).toBeVisible();
    expect((await pares(page)).find(([r]) => r === 'Data de nascimento')).toEqual(['Data de nascimento', '01/01/2000']);
  });
});

test('em 400 px a aba não cria rolagem horizontal, com e-mail e nome longos (AMA-04.3)', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await area.abreArea(page, '#/config/conta', { perfil: { ...area.PERFIL_LIA, nome: 'Maria Aparecida dos Santos Figueiredo Nogueira de Albuquerque' } });
  await expect(conta(page).locator('dl')).toBeVisible();
  const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(sobra).toBe(0);
});
