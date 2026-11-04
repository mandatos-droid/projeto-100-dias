import { test, expect, type Page } from '@playwright/test';
import { abreGuia, salvoDe } from './guia-real';

/* Missão 1 · Conjuntura (sugestões #17 a #20). O Guia troca cada textarea por um editor rico (.rico-area). */
const editor = (page: Page, k: string) => page.locator(`.campo:has(textarea[data-k="${k}"]) .rico-area`);
const campos = async (page: Page) => ((await salvoDe(page)).dados as { campos?: Record<string, string> }).campos ?? {};

test.describe('Conjuntura · legislatura (SUG-17)', () => {
  test('instrução com os dados primeiro, sem o trecho dos 100 dias, e caixa das pontes depois da tabela', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.conjuntura');
    await expect(page.getByText('a partir dos dados expostos abaixo. Em seguida, faça uma análise')).toBeVisible();
    await expect(page.locator('#tela')).not.toContainText('100 primeiros dias');
    await expect(page.locator('#tela')).not.toContainText('agendas similares');
    await expect(page.getByText('Marque na tabela acima')).toBeVisible();
    const ilha = await page.locator('[data-ilha="assentos"]').boundingBox();
    const caixa = await editor(page, 'm1.q4b').boundingBox();
    expect(ilha && caixa && caixa.y > ilha.y).toBeTruthy();
  });

  test('grava a resposta das pontes em m1.q4b e mantém a resposta antiga de m1.q4', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.conjuntura', { dados: { campos: { 'm1.q4': 'texto antigo' } } });
    await editor(page, 'm1.q4b').click();
    await page.keyboard.type('Vereadora do interior');
    await expect.poll(async () => (await campos(page))['m1.q4b']).toContain('Vereadora do interior');
    expect((await campos(page))['m1.q4']).toBe('texto antigo');
  });
});

test.describe('Conjuntura · partido, território e social (SUG-19)', () => {
  const COMANDO = 'A partir dos dados apresentados acima, e de outros que você possa ter pesquisado, faça uma análise destacando o que mais te chama a atenção e como o mandato deve agir a partir desta conjuntura.';
  const depoisDosDados = async (page: Page, ilha: string, k: string) => {
    const d = await page.locator(`[data-ilha="${ilha}"]`).boundingBox();
    const c = await editor(page, k).boundingBox();
    expect(d && c && c.y > d.y).toBeTruthy();
  };

  test('m1.q5: texto novo, dados e a caixa com o comando depois deles; resposta antiga preservada', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.conjuntura/1', { dados: { campos: { 'm1.q5': 'análise antiga' } } });
    await expect(page.getByText('é fundamental para a compreensão da conjuntura política em que a liderança parlamentar está inserida.')).toBeVisible();
    await expect(page.getByText(COMANDO)).toBeVisible();
    await depoisDosDados(page, 'calor', 'm1.q5');
    await expect(editor(page, 'm1.q5')).toContainText('análise antiga');
  });

  test('m1.q6 e m1.q8 trazem a caixa de análise depois dos dados', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.conjuntura/2');
    await expect(page.getByText(COMANDO)).toBeVisible();
    await depoisDosDados(page, 'municipio', 'm1.q6');
    await abreGuia(page, '#/m/1/m1.oportunidades/1');
    await expect(page.getByText(COMANDO)).toBeVisible();
    await depoisDosDados(page, 'social', 'm1.q8a');
  });
});
