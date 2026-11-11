import { test, expect, type Page } from '@playwright/test';
import { abreGuia, salvoDe } from './guia-real';

/* Missão 1 · Persona, pergunta 1.3 (PER-07 a PER-09): 3 caixas de conquista e o cargo com a opção "Não sei".
   O Guia troca cada textarea por um editor rico (.rico-area); o textarea escondido guarda o HTML. */
const TEXTO = 'Elenque quais são as principais conquistas ou grandes entregas que o mandato deseja ter alcançado antes do fim da legislatura. Registre até 3:';
const CARGO = 'Qual é o próximo cargo que a liderança parlamentar gostaria de ocupar?';
const editor = (page: Page, k: string) => page.locator(`.campo:has(textarea[data-k="${k}"]) .rico-area`);
const campos = async (page: Page) => ((await salvoDe(page)).dados as { campos?: Record<string, string> }).campos ?? {};

test.describe('Persona · desejo para o futuro (PER-07 a PER-09)', () => {
  test('mostra o texto, as 3 caixas de conquista e o cargo, cada um gravando na sua chave', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.persona');
    await expect(page.getByText(TEXTO)).toBeVisible();
    for (const n of [1, 2, 3]) await expect(page.getByText(`Conquista/Grande Entrega almejada ${n}`)).toBeVisible();
    await expect(page.getByText(CARGO)).toBeVisible();
    await expect(page.locator('textarea[data-k="m1.q3"]')).toHaveCount(0);
    await editor(page, 'm1.q3c2').click();
    await page.keyboard.type('Aprovar a lei do saneamento');
    await expect.poll(async () => (await campos(page))['m1.q3c2']).toContain('Aprovar a lei do saneamento');
    await page.locator('select[data-k="m1.q3b"]').selectOption('Senador(a)');
    await expect.poll(async () => (await campos(page))['m1.q3b']).toBe('Senador(a)');
    expect((await campos(page))['m1.q3']).toBeUndefined();
  });

  test('o select de cargo traz a opção "Não sei / não desejo registrar" e ela grava', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.persona');
    await expect(page.locator('select[data-k="m1.q3b"] option', { hasText: 'Não sei / não desejo registrar' })).toHaveCount(1);
    await page.locator('select[data-k="m1.q3b"]').selectOption('Não sei / não desejo registrar');
    await expect.poll(async () => (await campos(page))['m1.q3b']).toBe('Não sei / não desejo registrar');
  });

  test('resposta antiga de m1.q3 aparece como "Resposta anterior" e segue gravada', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.persona', { dados: { campos: { 'm1.q3': 'Aprovar o plano estadual' } } });
    await expect(page.getByText('Resposta anterior')).toBeVisible();
    await expect(page.locator('.resposta-anterior')).toContainText('Aprovar o plano estadual');
    await expect(page.locator('select[data-k="m1.q3b"]')).toHaveValue('');
    expect((await campos(page))['m1.q3']).toBe('Aprovar o plano estadual');
  });
});

test('o Resumo mostra o próximo cargo (m1.q3b)', async ({ page }) => {
  await abreGuia(page, '#/resumo', { dados: { campos: { 'm1.q3b': 'Senado da República' } } });
  await expect(page.getByText('Próximo cargo que a liderança deseja ocupar')).toBeVisible();
  await expect(page.locator('#tela')).toContainText('Senado da República');
});
