import { test, expect } from '@playwright/test';
import { abre, camposDe } from './semente';

const base = { 'm2.coords': 'Comunicação', 'm2.on': '0|7|8|9', 'm2.f1': 'Ana Souza', 'm2.f8': 'Bia Lima', 'm2.f9': 'Caio Reis', 'm2.f10': 'Dora Alves' };
const secao = (page: import('@playwright/test').Page, id: string) => page.locator(`[data-rotina="${id}"]`);

test.describe('Rotinas por área (MEQ-17)', () => {
  test('uma área de 3 cadeiras mostra a reunião semanal de 45 min com 3 participantes e quem convoca', async ({ page }) => {
    await abre(page, ['rotinas'], base);
    const area = secao(page, 'area:Comunicação');
    await expect(area).toContainText('Reunião semanal da área');
    await expect(area).toContainText('45 min por semana');
    await expect(area).toContainText('3 participantes');
    await expect(area).toContainText('convoca: Bia Lima');
    await expect(secao(page, 'semanal')).toContainText('Semanalmente');
    await expect(secao(page, 'plan')).toContainText('2 períodos de 6h');
  });

  test('cadeira sem nome aparece como "vaga" e fora da contagem de pessoas com nome', async ({ page }) => {
    await abre(page, ['rotinas'], { ...base, 'm2.f10': '*' });
    const area = secao(page, 'area:Comunicação');
    await expect(area).toContainText('3 participantes · 2 de 3 com nome');
    await expect(area.locator('li', { hasText: 'Vídeo-maker' }).getByText('vaga', { exact: true })).toBeVisible();
    await expect(area).toContainText('escopo ainda não definido');
  });

  test('sem nenhuma pessoa nomeada mostra o estado vazio', async ({ page }) => {
    await abre(page, ['rotinas'], { 'm2.coords': 'Comunicação', 'm2.on': '0|7|8' });
    await expect(page.getByText('Dê nome a ao menos uma cadeira')).toBeVisible();
  });

  test('desligar uma rotina a tira da lista, guarda a escolha e permite religar', async ({ page }) => {
    await abre(page, ['rotinas'], base);
    await secao(page, 'area:Comunicação').getByRole('button', { name: /Desligar/ }).click();
    await expect(secao(page, 'area:Comunicação')).toHaveCount(0);
    await expect(page.getByText('Rotinas desligadas (1)')).toBeVisible();
    expect((await camposDe(page))['m2.rotoff']).toBe('area:Comunicação');
    await page.getByRole('button', { name: /Religar/ }).click();
    await expect(secao(page, 'area:Comunicação')).toBeVisible();
    expect((await camposDe(page))['m2.rotoff']).toBeUndefined();
  });

  test('mudar a coordenação de uma cadeira no painel atualiza a rotina da área na mesma tela (E-08)', async ({ page }) => {
    await abre(page, ['organograma', 'rotinas'], base);
    await expect(secao(page, 'area:Comunicação')).toContainText('3 participantes');
    await page.locator('.es-no[data-cadeira="8"]').click();
    await page.getByRole('complementary', { name: /Painel da cadeira/ }).getByLabel('Coordenação').selectOption('Legislativo');
    await expect(secao(page, 'area:Comunicação')).toContainText('2 participantes');
    await expect(secao(page, 'area:Comunicação')).not.toContainText('Caio Reis');
  });

  test('o feedback individual lista cada liderado sob a liderança (MEQ-17)', async ({ page }) => {
    await abre(page, ['rotinas'], base);
    const fb = page.locator('.es-fb');
    await expect(fb).toContainText('Ana Souza');
    await expect(fb.locator('[data-rotina="fb:7>8"]')).toContainText('Caio Reis');
    await expect(fb.locator('[data-rotina="fb:7>9"]')).toContainText('Dora Alves');
  });
});
