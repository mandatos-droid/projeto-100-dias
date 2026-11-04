import { test, expect, type Page } from '@playwright/test';
import { abreGuia, salvoDe } from './guia-real';

/* Missão 1 · Persona, pergunta 3 (sugestão #16): duas caixas no lugar da caixa única.
   O Guia troca cada textarea por um editor rico (.rico-area); o textarea escondido guarda o HTML. */
const CONQUISTAS = 'Elenque quais são as 4 principais conquistas e entregas que o mandato deseja ter alcançado antes do fim da legislatura?';
const CARGO = 'Qual é o próximo cargo que a liderança parlamentar deseja ocupar?';
const editor = (page: Page, k: string) => page.locator(`.campo:has(textarea[data-k="${k}"]) .rico-area`);
const campos = async (page: Page) => ((await salvoDe(page)).dados as { campos?: Record<string, string> }).campos ?? {};

test.describe('Persona · desejo para o futuro (SUG-16)', () => {
  test('mostra as duas perguntas, cada uma com sua caixa, e grava em chaves separadas', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.persona/3');
    await expect(page.getByText(CONQUISTAS)).toBeVisible();
    await expect(page.getByText(CARGO)).toBeVisible();
    await expect(page.locator('textarea[data-k="m1.q3"]')).toHaveCount(1);
    await page.locator('select[data-k="m1.q3b"]').selectOption('Senador(a)');
    await expect.poll(async () => (await campos(page))['m1.q3b']).toBe('Senador(a)');
    expect((await campos(page))['m1.q3']).toBeUndefined();
  });

  test('resposta antiga de m1.q3 aparece na primeira caixa', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.persona/3', { dados: { campos: { 'm1.q3': 'Aprovar o plano estadual' } } });
    await expect(editor(page, 'm1.q3')).toContainText('Aprovar o plano estadual');
    await expect(page.locator('select[data-k="m1.q3b"]')).toHaveValue('');
  });
});

test('o Resumo mostra o próximo cargo (m1.q3b)', async ({ page }) => {
  await abreGuia(page, '#/resumo', { dados: { campos: { 'm1.q3b': 'Senado da República' } } });
  await expect(page.getByText('Próximo cargo que a liderança deseja ocupar')).toBeVisible();
  await expect(page.locator('#tela')).toContainText('Senado da República');
});
