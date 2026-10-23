import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { abre, camposDe } from './semente';

const ILHA = 'entrega';
const ESCOPO = 'Definir a estratégia de comunicação: posicionamento, cronograma e gestão de crises';
const equipe = {
  'm2.coords': 'Comunicação', 'm2.on': '0|7|8', 'm2.f1': 'Ana Souza', 'm2.f8': 'Bia Lima', 'm2.f9': 'Caio Reis',
  'm2.p1.escopo': ESCOPO, 'm2.p8.escopo': ESCOPO, 'm2.p9.escopo': ESCOPO,
};

test.describe('Entrega (MEQ-23)', () => {
  test('mostra os 4 blocos: cadeiras, escopo por cargo, organograma e rotinas', async ({ page }) => {
    await abre(page, [ILHA], equipe);
    const blocos = page.locator('[data-bloco]');
    await expect(blocos).toHaveCount(4);
    await expect(page.locator('[data-bloco="cadeiras"]')).toContainText('Bia Lima');
    await expect(page.locator('[data-bloco="escopo"]')).toContainText(ESCOPO);
    await expect(page.locator('[data-bloco="organograma"] img')).toBeVisible();
    await expect(page.locator('[data-bloco="rotinas"]')).toContainText('Planejamento estratégico');
    await expect(page.locator('[data-bloco="rotinas"]')).toContainText('Reunião de área');
  });

  test('"Exportar organograma" baixa um .png não vazio (E-14)', async ({ page }) => {
    await abre(page, [ILHA], equipe);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar organograma (PNG)' }).click()]);
    expect(dl.suggestedFilename()).toBe('organograma-do-mandato.png');
    const bytes = readFileSync((await dl.path())!);
    expect(bytes.length).toBeGreaterThan(1000);
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a'); // assinatura PNG
  });

  test('escopo completo sugere c1 e só "Marcar como pronto" grava', async ({ page }) => {
    await abre(page, [ILHA], equipe);
    const sug = page.getByRole('status').filter({ hasText: 'Sugestão' });
    await expect(sug).toContainText('Escopo de trabalho de cada cargo definido');
    expect((await camposDe(page))['m2.c1']).toBeUndefined();
    await sug.getByRole('button', { name: /Marcar como pronto: Escopo de trabalho/ }).click();
    expect((await camposDe(page))['m2.c1']).toBeTruthy();
    await expect(sug).not.toContainText('Escopo de trabalho de cada cargo definido');
  });

  test('sem escopo em alguma cadeira com nome, c1 não é sugerido', async ({ page }) => {
    await abre(page, [ILHA], { ...equipe, 'm2.p9.escopo': '' });
    await expect(page.getByText('Escopo de trabalho de cada cargo definido')).toHaveCount(0);
    await expect(page.locator('[data-bloco="escopo"]')).toContainText('escopo ainda não definido');
  });

  test('a visão de impressão mostra os 4 blocos e esconde os botões', async ({ page }) => {
    await abre(page, [ILHA], equipe);
    await page.evaluate(() => { (window as unknown as { __print: number }).__print = 0; window.print = () => { (window as unknown as { __print: number }).__print++; }; });
    await page.getByRole('button', { name: 'Imprimir ou salvar em PDF' }).click();
    expect(await page.evaluate(() => (window as unknown as { __print: number }).__print)).toBe(1);
    await page.emulateMedia({ media: 'print' });
    for (const b of ['cadeiras', 'escopo', 'organograma', 'rotinas']) await expect(page.locator(`[data-bloco="${b}"]`)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Exportar organograma (PNG)' })).toBeHidden();
  });
});
