import { test, expect } from '@playwright/test';
import { abre, camposDe } from './semente';

const ILHA = 'equipe-escalacao';

test.describe('Escalação: etapas (MEQ-01, MEQ-05)', () => {
  test('abre na etapa 1 de 3, com os nomes bloqueados e o motivo à vista (E-01)', async ({ page }) => {
    await abre(page, [ILHA]);
    await expect(page.getByText('Etapa 1 de 3 · Áreas do mandato')).toBeVisible();
    await expect(page.getByRole('button', { name: /Nomes e liderança/ })).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByText('Marque ao menos uma área para liberar os nomes.')).toBeVisible();
    await page.getByRole('button', { name: /Nomes e liderança/ }).click({ force: true }); // aria-disabled: o Playwright esperaria habilitar
    await expect(page.getByText('Etapa 1 de 3 · Áreas do mandato')).toBeVisible();
    expect((await camposDe(page))['m2.etapa']).toBeUndefined();
  });

  test('voltar mantém os dados, recarregar mantém a etapa e o foco vai ao conteúdo da etapa (E-06)', async ({ page }) => {
    await abre(page, [ILHA], { 'm2.coords': 'Legislativo', 'm2.f1': 'Ana Souza' });
    await page.getByRole('button', { name: /Nomes e liderança/ }).click();
    await expect(page.getByText('Etapa 3 de 3 · Nomes e liderança')).toBeVisible();
    expect(await page.evaluate(() => document.querySelector('[data-etapa]')!.contains(document.activeElement))).toBe(true);
    expect((await camposDe(page))['m2.etapa']).toBe('3');

    await page.reload();
    await page.locator('#tela[data-pronto="true"]').waitFor();
    await expect(page.getByText('Etapa 3 de 3 · Nomes e liderança')).toBeVisible();

    await page.getByRole('button', { name: 'Voltar' }).click();
    await expect(page.getByText('Etapa 2 de 3 · Cadeiras')).toBeVisible();
    const c = await camposDe(page);
    expect(c['m2.f1']).toBe('Ana Souza');
    expect(c['m2.coords']).toBe('Legislativo');
  });
});
