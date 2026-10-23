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

const MODELO = 'Comunicação|Mobilização de pessoas|Legislativo|Articulação de aliados|Secretariado|Logística';
const todas = Array.from({ length: 20 }, (_, i) => i).join('|');

test.describe('Etapa 1: áreas do mandato (MEQ-02, MEQ-04)', () => {
  test('marcar Legislativo e Comunicação mostra 11 cadeiras (E-02)', async ({ page }) => {
    await abre(page, [ILHA]);
    await expect(page.getByRole('status').filter({ hasText: 'cadeira' })).toContainText('1 cadeira');
    await page.getByLabel(/^Legislativo/).check();
    await page.getByLabel(/^Comunicação/).check();
    await expect(page.getByRole('status').filter({ hasText: 'cadeiras no gabinete' })).toContainText('11 cadeiras');
    expect((await camposDe(page))['m2.coords']).toBe('Comunicação|Legislativo');
  });

  test('"Usar o modelo completo" marca as 6 áreas e mostra 20 cadeiras', async ({ page }) => {
    await abre(page, [ILHA]);
    await page.getByRole('button', { name: /Usar o modelo completo/ }).click();
    await expect(page.getByRole('status').filter({ hasText: 'cadeiras no gabinete' })).toContainText('20 cadeiras');
    const c = await camposDe(page);
    expect(c['m2.coords']).toBe(MODELO);
    expect(c['m2.on']).toBe(todas);
    await expect(page.getByLabel(/^Logística/)).toBeChecked();
  });

  test('desmarcar área com nome abre confirmação com os nomes; cancelar mantém tudo, confirmar manda para Sem área', async ({ page }) => {
    await abre(page, [ILHA], { 'm2.coords': MODELO, 'm2.on': todas, 'm2.f8': 'Bia Lima' });
    const msgs: string[] = [];
    page.once('dialog', (d) => { msgs.push(d.message()); d.dismiss(); });
    await page.getByLabel(/^Comunicação/).click(); // cancelar a confirmação: a caixa continua marcada
    expect(msgs[0]).toContain('Bia Lima');
    await expect(page.getByLabel(/^Comunicação/)).toBeChecked();
    await expect(page.getByRole('status').filter({ hasText: 'cadeiras no gabinete' })).toContainText('20 cadeiras');

    page.once('dialog', (d) => d.accept());
    await page.getByLabel(/^Comunicação/).uncheck();
    await expect(page.getByLabel(/^Comunicação/)).not.toBeChecked();
    await expect(page.getByRole('status').filter({ hasText: 'cadeiras no gabinete' })).toContainText('17 cadeiras');
    const c = await camposDe(page);
    expect(c['m2.p8.coord']).toBe('Sem área');
    expect(c['m2.f8']).toBe('Bia Lima');
  });

  test('desmarcar área sem nomes remove as cadeiras sem perguntar', async ({ page }) => {
    await abre(page, [ILHA], { 'm2.coords': MODELO, 'm2.on': todas });
    let perguntou = false;
    page.on('dialog', (d) => { perguntou = true; d.dismiss(); });
    await page.getByLabel(/^Logística/).uncheck();
    await expect(page.getByRole('status').filter({ hasText: 'cadeiras no gabinete' })).toContainText('19 cadeiras');
    expect(perguntou).toBe(false);
  });
});
