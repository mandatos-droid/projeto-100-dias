import { test, expect, type Page } from '@playwright/test';
import { abreGuia, salvoDe } from './guia-real';

/* Salvamento e sessão (Grupo B). O Guia roda em modo local (sem Supabase), então aqui valem as garantias que não
   dependem da nuvem: saída rápida (flush em pagehide), indicador de salvamento e o fluxo "Marcar como concluído".
   A renovação do token, o bloqueio por sessão perdida e a mescla de edição concorrente têm fetch falso em
   tests/salvar-sessao.test.ts. */
const EX = '#/m/1/m1.persona';
const editor = (page: Page, k: string) => page.locator(`.campo:has(textarea[data-k="${k}"]) .rico-area`);
const campos = async (page: Page) => ((await salvoDe(page)).dados as { campos?: Record<string, string> }).campos ?? {};
const feitos = async (page: Page) => ((await salvoDe(page)).dados as { feitos?: Record<string, boolean> }).feitos ?? {};

/** Vai até o último passo do exercício (no modo guiado o botão de concluir só aparece lá). */
async function ateOFim(page: Page) {
  const avancar = page.getByRole('button', { name: 'Avançar' });
  while (await avancar.count()) await avancar.first().click();
}

test.describe('Saída rápida (flush ao sair da página)', () => {
  test('digitar e recarregar na hora, antes dos 700 ms, não perde o texto', async ({ page }) => {
    await abreGuia(page, EX);
    await editor(page, 'm1.q3c1').click();
    await page.keyboard.type('Entregar o hospital regional');
    await page.reload();
    await page.locator('#ladoNav .it').first().waitFor();
    await expect(editor(page, 'm1.q3c1')).toContainText('Entregar o hospital regional');
    expect((await campos(page))['m1.q3c1']).toContain('Entregar o hospital regional');
  });

  test('o texto digitado sobrevive a um segundo recarregamento seguido', async ({ page }) => {
    await abreGuia(page, EX);
    await editor(page, 'm1.q3c2').click();
    await page.keyboard.type('Aprovar a lei do saneamento');
    await page.reload();
    await page.locator('#ladoNav .it').first().waitFor();
    await page.reload();
    await page.locator('#ladoNav .it').first().waitFor();
    await expect(editor(page, 'm1.q3c2')).toContainText('Aprovar a lei do saneamento');
  });

  test('trocar de exercício logo depois de digitar mantém o texto', async ({ page }) => {
    await abreGuia(page, EX);
    await editor(page, 'm1.q3c3').click();
    await page.keyboard.type('Reduzir a fila da saúde');
    await page.goto('/guia#/');
    await page.locator('#ladoNav .it').first().waitFor();
    expect((await campos(page))['m1.q3c3']).toContain('Reduzir a fila da saúde');
  });
});

test.describe('Indicador de salvamento', () => {
  test('mostra "Salvo automaticamente" depois de salvar e não deixa "Não salvo" aparecer', async ({ page }) => {
    await abreGuia(page, EX);
    await editor(page, 'm1.q3c1').click();
    await page.keyboard.type('Meta 1');
    await expect(page.locator('[data-salvo]').first()).toHaveText('Salvo automaticamente');
    await expect(page.getByText('Não salvo')).toHaveCount(0);
    await expect.poll(async () => (await campos(page))['m1.q3c1']).toContain('Meta 1');
  });
});

test.describe('Marcar como concluído só vale depois de gravar', () => {
  test('concluir grava a marca, mostra o aviso e a marca sobrevive ao recarregamento', async ({ page }) => {
    await abreGuia(page, EX);
    await ateOFim(page);
    await page.getByRole('button', { name: 'Marcar como concluído' }).click();
    await expect(page.getByText('Exercício concluído.')).toBeVisible();
    expect((await feitos(page))['m1.persona']).toBe(true);
    await page.reload();
    await page.locator('#ladoNav .it').first().waitFor();
    await ateOFim(page);
    await expect(page.getByRole('button', { name: 'Reabrir exercício' })).toBeVisible();
    expect((await feitos(page))['m1.persona']).toBe(true);
  });

  test('reabrir grava a marca desfeita e ela sobrevive ao recarregamento', async ({ page }) => {
    await abreGuia(page, EX, { dados: { feitos: { 'm1.persona': true } } });
    await ateOFim(page);
    await page.getByRole('button', { name: 'Reabrir exercício' }).click();
    await expect(page.getByRole('button', { name: 'Marcar como concluído' })).toBeVisible();
    expect((await feitos(page))['m1.persona']).toBeFalsy();
    await page.reload();
    await page.locator('#ladoNav .it').first().waitFor();
    await ateOFim(page);
    await expect(page.getByRole('button', { name: 'Marcar como concluído' })).toBeVisible();
  });

  test('sem aviso de sessão perdida quando tudo salva normalmente', async ({ page }) => {
    await abreGuia(page, EX);
    await editor(page, 'm1.q3c1').click();
    await page.keyboard.type('Qualquer coisa');
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(page.getByText('Sua sessão expirou')).toHaveCount(0);
  });
});
