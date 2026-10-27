import { test, expect, type Page } from '@playwright/test';
import { abre, dadoDe } from './semente-rumo';

/* Missão 5 · novos planejamentos (M5-30, M5-31). */
type M = { id: string; pred?: string; texto?: string; status?: string; sucessos?: unknown[] };
type P = { n: number; legado: string; objetivos: { pid: string }[]; metas: M[] };
const metasDe = async (page: Page) => (await dadoDe(page, 'metas')) as M[];
const planosDe = async (page: Page) => ((await dadoDe(page, 'planos')) ?? []) as P[];

const PLANO = {
  campos: { 'm3.legado': 'A Educação no centro do debate', 'm3.obj.p1': 'Priorizar a educação', 'm3.obj.p2': 'Pautar o fim do trabalho infantil' },
  D: {
    preditores: ['p1', 'p2'],
    metas: [
      { id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos de lei', status: 'concluida', sucessos: [{ id: 's1', mes: 1, texto: 'Protocolar o texto', status: 'concluida' }] },
      { id: 'b', pred: 'p1', texto: 'Visitar 10 escolas', status: 'concluida70' },
      { id: 'c', pred: 'p2', texto: 'Lançar a campanha', status: 'nao_concluida' },
    ],
  },
};
const botao = (page: Page) => page.getByRole('button', { name: 'Criar novo planejamento' });
const painel = (page: Page) => page.getByRole('group', { name: 'Criar novo planejamento' });

test.describe('Botão e confirmação de novo planejamento (M5-30)', () => {
  test('o botão pede confirmação e lista as metas para copiar (M5-30.3)', async ({ page }) => {
    await abre(page, ['rumo-novociclo'], PLANO);
    await expect(painel(page)).toHaveCount(0);
    await botao(page).click();
    await expect(painel(page)).toContainText('Isso guarda o planejamento atual');
    await expect(painel(page).getByRole('checkbox')).toHaveCount(3);
    await expect(painel(page)).toContainText('Aprovar 2 projetos de lei');
    expect(await planosDe(page)).toEqual([]); // abrir o painel ainda não altera nada
  });

  test('confirmar cria o novo planejamento só com as metas escolhidas, sem sucessos, e guarda o anterior (M5-30.4)', async ({ page }) => {
    await abre(page, ['rumo-novociclo'], PLANO);
    await botao(page).click();
    await painel(page).getByRole('checkbox', { name: /Visitar 10 escolas/ }).check();
    await painel(page).getByRole('checkbox', { name: /Aprovar 2 projetos/ }).check();
    await page.getByRole('button', { name: 'Confirmar e criar novo planejamento' }).click();
    await expect(page.locator('.rm-novociclo [role="status"]')).toContainText('Planejamento 1 guardado');
    const novas = await metasDe(page);
    expect(novas.map((m) => m.id)).toEqual(['a', 'b']);
    expect(novas.every((m) => m.status === 'nao_concluida' && !('sucessos' in m))).toBe(true);
    const [p1] = await planosDe(page);
    expect(p1.n).toBe(1);
    expect(p1.legado).toBe('A Educação no centro do debate');
    expect(p1.metas).toEqual(PLANO.D.metas);
    expect(await dadoDe(page, 'preditores')).toEqual(['p1', 'p2']);
  });

  test('cancelar fecha o painel e não altera nada', async ({ page }) => {
    await abre(page, ['rumo-novociclo'], PLANO);
    await botao(page).click();
    await painel(page).getByRole('checkbox').first().check();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(painel(page)).toHaveCount(0);
    expect(await metasDe(page)).toEqual(PLANO.D.metas);
    expect(await planosDe(page)).toEqual([]);
  });

  test('sem metas o painel avisa e confirmar cria um plano vazio sem erro', async ({ page }) => {
    await abre(page, ['rumo-novociclo'], { campos: PLANO.campos, D: { preditores: ['p1'], metas: [] } });
    await botao(page).click();
    await expect(painel(page)).toContainText('ainda não tem metas');
    await page.getByRole('button', { name: 'Confirmar e criar novo planejamento' }).click();
    expect(await metasDe(page)).toEqual([]);
    expect((await planosDe(page)).length).toBe(1);
  });
});
