import { test, expect, type Page } from '@playwright/test';
import { abreGuia, MANDATO_REAL } from './guia-real';

/* Contador de dias do Guia (CFG-01): quantos dias faltam, nos três lugares que mostram o número. O relógio do navegador
   fica fixo para os casos serem determinísticos. */
const AGORA = new Date(2026, 10, 11, 12, 0, 0);
const posseEm = (dias: number) => {
  const d = new Date(AGORA.getTime() + dias * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
/** `desdePosse`: dias já passados desde a posse (negativo = a posse é no futuro). */
async function abre(page: Page, desdePosse: number) {
  await page.clock.setFixedTime(AGORA);
  await abreGuia(page, '#/', { mandato: { ...MANDATO_REAL, data_posse: posseEm(-desdePosse) } });
}
const resumoBaixado = (page: Page) => page.evaluate(() => (window as unknown as { Baixar: { pagina: (t: string, m: string) => string } }).Baixar.pagina('t', '<p>x</p>'));
const lateral = (page: Page) => page.locator('#ladoMandato .contador-dia');

test.describe('Contador de dias mostra quanto falta (CFG-01)', () => {
  test('posse há 283 dias: "100 dias concluídos" na barra lateral, no cabeçalho móvel e no resumo baixado', async ({ page }) => {
    await abre(page, 282);
    await expect(lateral(page)).toContainText('100 dias concluídos');
    await expect(lateral(page)).not.toContainText('283');
    await expect(page.locator('#diaMovel')).toHaveText('100 dias concluídos');
    const h = await resumoBaixado(page);
    expect(h).toContain('100 dias concluídos');
    expect(h).not.toMatch(/dia \d+ de 100/);
  });

  test('posse há 30 dias (dia 30): "faltam 70 dias" nos três lugares', async ({ page }) => {
    await abre(page, 29);
    await expect(lateral(page)).toContainText('faltam 70 dias');
    await expect(page.locator('#diaMovel')).toHaveText('faltam 70 dias');
    expect(await resumoBaixado(page)).toContain(' · faltam 70 dias');
  });

  test('posse daqui a 5 dias: "faltam 5 dias para a posse"', async ({ page }) => {
    await abre(page, -5);
    await expect(lateral(page)).toContainText('faltam 5 dias para a posse');
    await expect(page.locator('#diaMovel')).toHaveText('faltam 5 dias para a posse');
    expect(await resumoBaixado(page)).toContain(' · faltam 5 dias para a posse');
  });

  test('dia 99 no singular ("falta 1 dia")', async ({ page }) => {
    await abre(page, 98);
    await expect(lateral(page)).toContainText('falta 1 dia');
    await expect(lateral(page)).not.toContainText('faltam');
  });

  test('dia 100: "último dia dos 100"', async ({ page }) => {
    await abre(page, 99);
    await expect(lateral(page)).toContainText('último dia dos 100');
    await expect(page.locator('#diaMovel')).toHaveText('último dia dos 100');
  });

  for (const largura of [1280, 390]) {
    test(`o texto mais longo cabe na barra lateral sem quebrar o visual (${largura}px)`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      await abre(page, -5);
      const c = await page.evaluate(() => {
        const el = document.querySelector('#ladoMandato .contador-dia') as HTMLElement;
        const pai = document.getElementById('lado') as HTMLElement;
        const r = el.getBoundingClientRect(); const p = pai.getBoundingClientRect();
        return { sobraDireita: Math.round(r.right - p.right), sobra: el.scrollWidth - el.clientWidth, altura: Math.round(r.height) };
      });
      expect(c.sobra).toBeLessThanOrEqual(1);
      expect(c.sobraDireita).toBeLessThanOrEqual(0);
      expect(c.altura).toBeLessThan(120);
    });
  }
});
