import { test, expect, type Page } from '@playwright/test';
import { abre, dadoDe } from './semente-rumo';

/* Atingimento da meta = média do atingimento de cada sucesso mensal, não o status próprio da meta (relato do Pedro, 2026-11-20).
   Caso do print: "Priorizar a agenda", meta com status próprio 80%, mês 1 a 70% e mês 2 a 50% → 60% em todo lugar. */
type S = { id: string; mes: number; texto: string; status: string };
const suc = (id: string, mes: number, texto: string, status = 'nao_concluida'): S => ({ id, mes, texto, status });
const no = (page: Page, id: string) => page.locator(`[data-no="${id}"]`);
const pctMetaNo = (page: Page, idx: number) => no(page, `meta-${idx}`).locator('> .rm-no-cab .rm-st small');
const rotMetaNo = (page: Page, idx: number) => no(page, `meta-${idx}`).locator('> .rm-no-cab .rm-st');
const PLANO = (metas: unknown[]) => ({ campos: { 'm3.obj.p1': 'Priorizar a agenda' }, D: { preditores: ['p1'], metas } });
const PRINT = [{ id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos de lei até dezembro de 2027', status: 'concluida80', sucessos: [suc('s1', 1, 'Protocolar', 'concluida70'), suc('s2', 2, 'Votar', 'concluida50')] }];

test.describe('Atingimento da meta pelos sucessos mensais', () => {
  test('o caso do print: meses 70% e 50% mostram 60% na meta, no objetivo e no total (status próprio 80% é ignorado)', async ({ page }) => {
    await abre(page, ['plano'], PLANO(PRINT));
    await expect(pctMetaNo(page, 0)).toHaveText('60%');
    await expect(rotMetaNo(page, 0)).toContainText('Em andamento – 60%');
    await expect(page.locator('[data-no="obj-p1"] > .rm-no-cab .rm-no-pct')).toHaveText('60%');
    await expect(page.locator('.rm-anel b')).toHaveText('60%');
  });

  test('mudar o status de um mês recalcula a meta e grava o status derivado', async ({ page }) => {
    await abre(page, ['plano'], PLANO(PRINT));
    await no(page, 'suc-s2').getByLabel('Status do sucesso Votar').selectOption('concluida');
    await expect(pctMetaNo(page, 0)).toHaveText('85%');
    await expect(page.locator('.rm-anel b')).toHaveText('85%');
    const metas = (await dadoDe(page, 'metas')) as { status: string }[];
    expect(metas[0].status).toBe('concluida80');
  });

  test('sucesso congelado sai da média', async ({ page }) => {
    await abre(page, ['plano'], PLANO(PRINT));
    await no(page, 'suc-s2').getByLabel('Status do sucesso Votar').selectOption('congelada');
    await expect(pctMetaNo(page, 0)).toHaveText('70%');
  });

  test('com sucessos, o seletor de status da meta só oferece o status calculado e congelar', async ({ page }) => {
    await abre(page, ['plano'], PLANO(PRINT));
    const opcoes = await no(page, 'meta-0').getByLabel('Status da meta 01').locator('option').allInnerTexts();
    expect(opcoes).toEqual(['Em andamento – 60%', 'Congelada']);
  });

  test('meta sem sucessos continua pelo status próprio (70%)', async ({ page }) => {
    await abre(page, ['plano'], PLANO([{ id: 'a', pred: 'p1', texto: 'Visitar 10 escolas', status: 'concluida70' }]));
    await expect(pctMetaNo(page, 0)).toHaveText('70%');
    await expect(no(page, 'meta-0').getByLabel('Status da meta 01').locator('option')).toHaveCount(12);
  });

  test('o cartão da meta (aberto em Editar) mostra o mesmo número da árvore', async ({ page }) => {
    await abre(page, ['rumo-metas'], { D: { preditores: ['p1'], metas: PRINT } });
    await expect(pctMetaNo(page, 0)).toHaveText('60%');
    await page.getByRole('button', { name: 'Editar a meta 01' }).click();
    await expect(page.locator('[data-meta="0"] [data-pct]')).toHaveAttribute('data-pct', '60');
  });
  /* A persistência do 60% depois de recarregar fica no Grupo C/D (Guia real): esta rota de teste não guarda o estado. */
});
