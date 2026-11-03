import { test, expect, type Page } from '@playwright/test';
import { abre, camposDe, dadoDe } from './semente-rumo';
import { abreGuia } from './guia-real';

const ILHA = 'rumo-preditores';
const card = (page: Page, pid: string) => page.locator(`[data-preditor="${pid}"]`);
const marca = (page: Page, pid: string) => card(page, pid).locator('.rm-pred-bt');
const caixa = (page: Page, pid: string) => card(page, pid).getByRole('textbox');
const faltam = (page: Page) => page.getByText(/^(faltam \d+ justificativas|falta 1 justificativa)$/);

test.describe('Justificativa de cada preditor (RM3-01 a RM3-07)', () => {
  test('mostra os 5 preditores clicáveis e o aviso sobre os primeiros dias do mandato (RM3-01)', async ({ page }) => {
    await abre(page, [ILHA]);
    await expect(page.locator('[data-preditor]')).toHaveCount(5);
    await expect(page.getByText('Atenção! Sua escolha deve considerar o que precisa acontecer logo nos primeiros dias do mandato.')).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveCount(0);
  });

  test('preditor marcado abre "Este preditor foi escolhido pois…" (RM3-02)', async ({ page }) => {
    await abre(page, [ILHA]);
    await marca(page, 'p2').click();
    await expect(card(page, 'p2').getByText('Este preditor foi escolhido pois…')).toBeVisible();
    await expect(caixa(page, 'p2')).toBeVisible();
    await expect(caixa(page, 'p1')).toHaveCount(0);
  });

  test('com 3 marcados, os 2 restantes abrem "não foi escolhido pois…" (RM3-03)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1', 'p2', 'p3'] } });
    for (const pid of ['p4', 'p5']) await expect(card(page, pid).getByText('Este preditor não foi escolhido pois…')).toBeVisible();
    for (const pid of ['p1', 'p2', 'p3']) await expect(card(page, pid).getByText('Este preditor foi escolhido pois…')).toBeVisible();
  });

  test('o quarto preditor é recusado com o aviso de quais desmarcar (RM3-04)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1', 'p2', 'p3'] } });
    await marca(page, 'p4').click();
    await expect(page.locator('#avisos')).toContainText('Escolha até 3 preditores. Desmarque um deles (Priorizar a agenda, Pautar os debates, Construir o partido)');
    expect(await dadoDe(page, 'preditores')).toEqual(['p1', 'p2', 'p3']);
  });

  test('trocar a seleção preserva as justificativas e troca o rótulo (RM3-05)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1', 'p2', 'p3'] }, campos: { 'm3.just.p3': 'Porque o partido precisa crescer', 'm3.just.p4': 'Porque ainda é cedo' } });
    page.on('dialog', (dl) => dl.accept());
    await marca(page, 'p3').click(); // desmarca p3: sobram 2 escolhidos, a caixa de p3 fecha mas o texto fica guardado
    await expect(caixa(page, 'p3')).toHaveCount(0);
    await marca(page, 'p4').click(); // marca p4: passa a "foi escolhido" e, com 3 escolhidos, p3 reabre como "não foi escolhido"
    await expect(card(page, 'p4').getByText('Este preditor foi escolhido pois…')).toBeVisible();
    await expect(caixa(page, 'p4')).toHaveValue('Porque ainda é cedo');
    await expect(card(page, 'p3').getByText('Este preditor não foi escolhido pois…')).toBeVisible();
    await expect(caixa(page, 'p3')).toHaveValue('Porque o partido precisa crescer');
    const c = await camposDe(page);
    expect([c['m3.just.p3'], c['m3.just.p4']]).toEqual(['Porque o partido precisa crescer', 'Porque ainda é cedo']);
  });

  test('"faltam N justificativas" diminui ao escrever, some com as 5 e nunca bloqueia (RM3-06)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1', 'p2', 'p3'] } });
    await expect(page.getByText('faltam 5 justificativas')).toBeVisible();
    await caixa(page, 'p1').fill('um');
    await expect(page.getByText('faltam 4 justificativas')).toBeVisible();
    // sem as 5 preenchidas, ainda dá para trocar a seleção
    await marca(page, 'p3').click();
    expect(await dadoDe(page, 'preditores')).toEqual(['p1', 'p2']);
    await marca(page, 'p3').click();
    for (const [pid, txt] of [['p2', 'dois'], ['p3', 'três'], ['p4', 'quatro'], ['p5', 'cinco']]) await caixa(page, pid).fill(txt);
    await expect(faltam(page)).toHaveCount(0);
    const c = await camposDe(page);
    expect(['p1', 'p2', 'p3', 'p4', 'p5'].map((p) => c[`m3.just.${p}`])).toEqual(['um', 'dois', 'três', 'quatro', 'cinco']);
  });

  test('digitar com espaços mantém o texto como foi escrito', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1'] } });
    await caixa(page, 'p1').pressSequentially('uma frase com espaços');
    await expect(caixa(page, 'p1')).toHaveValue('uma frase com espaços');
  });
});

test('o texto do Guia do exercício continua na tela real (RM3-07)', async ({ page }) => {
  await abreGuia(page, '#/m/3/m3.preditores');
  await expect(page.getByText('Nem todos os mandatos bem sucedidos conseguem ter boas práticas')).toBeVisible();
  await expect(page.getByText('apresente os 5 preditores de sucesso da metodologia GIP')).toBeVisible();
  await expect(page.getByText('Esta priorização deve vigorar ao longo do ano vigente')).toBeVisible();
});
