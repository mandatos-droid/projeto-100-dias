import { test, expect, type Page } from '@playwright/test';
import { abre, dadoDe } from './semente-rumo';

/* Missão 5 · sucessos mensais: bloco no cartão da meta (M5-01). */
type S = { id: string; mes: number; texto: string; status: string };
type M = { id: string; pred?: string; texto?: string; status?: string; sucessos?: S[] };
const metasDe = async (page: Page) => (await dadoDe(page, 'metas')) as M[];
const meta = (page: Page, i: number) => page.locator(`[data-meta="${i}"]`);
const linhas = (page: Page, i: number) => meta(page, i).locator('[data-sucesso]');
const COM_META = (sucessos?: S[]) => ({ D: { preditores: ['p1'], metas: [{ id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos de lei até dezembro de 2027', ...(sucessos ? { sucessos } : {}) }] } });

test.describe('Bloco "Sucessos mensais" no cartão da meta (M5-01)', () => {
  test('meta sem sucessos mostra o bloco vazio e o botão Adicionar sucesso', async ({ page }) => {
    await abre(page, ['rumo-metas'], COM_META());
    await expect(meta(page, 0).getByRole('group', { name: 'Sucessos mensais da meta 01' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Adicionar sucesso à meta 01' })).toBeVisible();
    await expect(linhas(page, 0)).toHaveCount(0);
  });

  test('"Adicionar sucesso" cria uma linha com mês e texto e grava na hora, como não concluída (M5-01.1)', async ({ page }) => {
    await abre(page, ['rumo-metas'], COM_META());
    await page.getByRole('button', { name: 'Adicionar sucesso à meta 01' }).click();
    await expect(linhas(page, 0)).toHaveCount(1);
    const gravado = (await metasDe(page))[0].sucessos!;
    expect(gravado).toHaveLength(1);
    expect(gravado[0].status).toBe('nao_concluida');
    expect(gravado[0].mes).toBe(1);
    await linhas(page, 0).getByLabel('Mês do sucesso 1 da meta 01').selectOption('3');
    await linhas(page, 0).getByLabel('Texto do sucesso 1 da meta 01').fill('Protocolar o projeto');
    const depois = (await metasDe(page))[0].sucessos!;
    expect(depois[0].mes).toBe(3);
    expect(depois[0].texto).toBe('Protocolar o projeto');
  });

  test('editar mês, texto ou status grava na hora e não mexe nos outros sucessos (M5-01.2)', async ({ page }) => {
    const s = (id: string, mes: number, texto: string): S => ({ id, mes, texto, status: 'nao_concluida' });
    await abre(page, ['rumo-metas'], COM_META([s('x', 1, 'Primeiro'), s('y', 2, 'Segundo')]));
    await linhas(page, 0).nth(1).getByLabel('Status do sucesso 2 da meta 01').selectOption('concluida');
    let g = (await metasDe(page))[0].sucessos!;
    expect(g[1]).toEqual({ id: 'y', mes: 2, texto: 'Segundo', status: 'concluida' });
    expect(g[0]).toEqual(s('x', 1, 'Primeiro'));
    await linhas(page, 0).nth(0).getByLabel('Texto do sucesso 1 da meta 01').fill('Primeiro editado');
    await linhas(page, 0).nth(0).getByLabel('Mês do sucesso 1 da meta 01').selectOption('4');
    g = (await metasDe(page))[0].sucessos!;
    expect(g[0]).toEqual({ id: 'x', mes: 4, texto: 'Primeiro editado', status: 'nao_concluida' });
    expect(g[1].status).toBe('concluida');
  });

  test('remover tira só aquela linha (M5-01.3)', async ({ page }) => {
    const s = (id: string, texto: string): S => ({ id, mes: 1, texto, status: 'nao_concluida' });
    await abre(page, ['rumo-metas'], COM_META([s('x', 'Primeiro'), s('y', 'Segundo'), s('z', 'Terceiro')]));
    await page.getByRole('button', { name: 'Remover o sucesso 2 da meta 01' }).click();
    await expect(linhas(page, 0)).toHaveCount(2);
    expect((await metasDe(page))[0].sucessos!.map((x) => x.id)).toEqual(['x', 'z']);
  });

  test('o que foi gravado sobrevive ao recarregar a tela', async ({ page }) => {
    await abre(page, ['rumo-metas'], COM_META());
    await page.getByRole('button', { name: 'Adicionar sucesso à meta 01' }).click();
    await linhas(page, 0).getByLabel('Texto do sucesso 1 da meta 01').fill('Guardado');
    await page.reload();
    await page.locator('#tela[data-pronto="true"]').waitFor();
    await expect(linhas(page, 0).getByLabel('Texto do sucesso 1 da meta 01')).toHaveValue('Guardado');
  });

  test('meta antiga, sem a chave sucessos, abre sem erro e não ganha a chave sozinha (M5-02.7)', async ({ page }) => {
    await abre(page, ['rumo-metas'], COM_META());
    await expect(meta(page, 0)).toBeVisible();
    expect('sucessos' in (await metasDe(page))[0]).toBe(false);
  });
});
