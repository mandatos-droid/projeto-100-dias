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

/* Missão 5 · sucessos na árvore da aba Planejamento (M5-02) */
test.describe('Sucessos na árvore do Planejamento (M5-02)', () => {
  const suc = (id: string, mes: number, texto: string, status = 'nao_concluida'): S => ({ id, mes, texto, status });
  const no = (page: Page, id: string) => page.locator(`[data-no="${id}"]`);
  const pctMetaNo = (page: Page, idx: number) => no(page, `meta-${idx}`).locator('> .rm-no-cab .rm-st small');
  const PLANO = (metas: unknown[]) => ({ campos: { 'm3.obj.p1': 'Priorizar a educação' }, D: { preditores: ['p1'], metas } });

  test('os sucessos aparecem dentro da meta, agrupados por mês na ordem 1 a 4, cada um com o status (M5-02.4)', async ({ page }) => {
    const metas = [{ id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos', status: 'nao_concluida', sucessos: [suc('s3', 3, 'Votar em plenário'), suc('s1', 1, 'Protocolar', 'concluida'), suc('s1b', 1, 'Reunir a bancada')] }];
    await abre(page, ['plano'], PLANO(metas));
    const meta0 = no(page, 'meta-0');
    await expect(meta0.locator('[data-tipo="mes"]')).toHaveCount(2); // só meses com sucesso
    const meses = await meta0.locator('[data-tipo="mes"] > .rm-no-cab').allInnerTexts();
    expect(meses[0]).toMatch(/mês 1/i);
    expect(meses[1]).toMatch(/mês 3/i);
    await expect(meta0.locator('[data-tipo="sucesso"]')).toHaveCount(3);
    await expect(no(page, 'suc-s1')).toContainText('Protocolar');
    await expect(no(page, 'suc-s1').getByLabel('Status do sucesso Protocolar')).toHaveValue('concluida');
    await expect(no(page, 'suc-s3').getByLabel('Status do sucesso Votar em plenário')).toHaveValue('nao_concluida');
  });

  test('marcar 1 de 2 sucessos como atingido mostra 50% na meta, no objetivo e no total, e grava (M5-02.5)', async ({ page }) => {
    const metas = [{ id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos', status: 'nao_concluida', sucessos: [suc('s1', 1, 'Protocolar'), suc('s2', 2, 'Votar')] }];
    await abre(page, ['plano'], PLANO(metas));
    await expect(pctMetaNo(page, 0)).toHaveText('0%');
    await no(page, 'suc-s1').getByLabel('Status do sucesso Protocolar').selectOption('concluida');
    await expect(pctMetaNo(page, 0)).toHaveText('50%');
    await expect(page.locator('[data-no="obj-p1"] > .rm-no-cab .rm-no-pct')).toHaveText('50%');
    await expect(page.locator('.rm-anel b')).toHaveText('50%');
    expect((await metasDe(page))[0].sucessos![0].status).toBe('concluida');
  });

  test('meta antiga, sem sucessos, continua mostrando o status e a porcentagem dela (M5-02.6)', async ({ page }) => {
    const metas = [{ id: 'a', pred: 'p1', texto: 'Visitar 10 escolas', status: 'concluida70' }];
    await abre(page, ['plano'], PLANO(metas));
    await expect(pctMetaNo(page, 0)).toHaveText('70%');
    await expect(no(page, 'meta-0').locator('[data-tipo="mes"]')).toHaveCount(0);
    await expect(page.locator('.rm-anel b')).toHaveText('70%');
    expect('sucessos' in (await metasDe(page))[0]).toBe(false);
  });
});
