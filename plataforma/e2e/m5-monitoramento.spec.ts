import { test, expect, type Page } from '@playwright/test';
import { abre } from './semente-rumo';

/* Missão 5 · botão e links do Planejamento para o Monitoramento (spec missao5-monitoramento-alana: MON-02). */
const PLANO = {
  campos: { 'm3.legado': 'A Educação no centro do debate', 'm3.obj.p1': 'Priorizar a educação' },
  D: {
    preditores: ['p1'],
    metas: [
      { id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos de lei', status: 'concluida60' },
      { id: 'b', pred: 'p1', texto: 'Visitar 10 escolas', status: 'nao_concluida' },
    ],
  },
};
const BOTAO = 'Registrar detalhes sobre o atingimento das metas no Monitoramento';
const foco = (page: Page) => page.evaluate(() => (window as unknown as { MonitFoco?: string }).MonitFoco);
const hash = (page: Page) => page.evaluate(() => window.location.hash);

test.describe('Planejamento → Monitoramento (MON-02)', () => {
  test('o botão aparece junto do atingimento total e leva ao Monitoramento (MON-02.1, MON-02.2)', async ({ page }) => {
    await abre(page, ['plano'], PLANO);
    const botao = page.getByRole('button', { name: BOTAO });
    await expect(botao).toBeVisible();
    await botao.click();
    expect(await hash(page)).toBe('#/m/5/m5.monit');
  });

  test('sem mexer em nenhuma meta, o botão abre o Monitoramento sem meta em foco, no topo (MON-02.2)', async ({ page }) => {
    await abre(page, ['plano'], PLANO);
    await page.getByRole('button', { name: BOTAO }).click();
    expect(await foco(page)).toBeUndefined();
  });

  test('depois de mudar o status de uma meta, o botão leva o foco para ela (MON-02.2)', async ({ page }) => {
    await abre(page, ['plano'], PLANO);
    await page.getByLabel('Status da meta 02').selectOption('concluida30');
    await page.getByRole('button', { name: BOTAO }).click();
    expect(await foco(page)).toBe('b');
    expect(await hash(page)).toBe('#/m/5/m5.monit');
  });

  test('o link "Detalhar no Monitoramento" de uma meta leva ao Monitoramento já nela (MON-02.2)', async ({ page }) => {
    await abre(page, ['plano'], PLANO);
    await page.getByRole('button', { name: 'Detalhar a meta 01 no Monitoramento' }).click();
    expect(await foco(page)).toBe('a');
    expect(await hash(page)).toBe('#/m/5/m5.monit');
  });

  test('no planejamento arquivado nem o botão nem os links aparecem (MON-02.3)', async ({ page }) => {
    const arquivado = { n: 1, criadoEm: '2026-05-01T10:00:00.000Z', legado: 'Antigo', bandeiras: [], objetivos: [{ pid: 'p1', nome: 'Priorizar a agenda', pergunta: '', texto: 'Priorizar a educação' }], metas: PLANO.D.metas };
    await abre(page, ['plano'], { campos: PLANO.campos, D: { ...PLANO.D, planos: [arquivado] } });
    await expect(page.getByRole('button', { name: BOTAO })).toBeVisible();
    await page.getByRole('button', { name: /^Abrir/ }).first().click();
    await expect(page.getByText(/guardado: somente leitura/)).toBeVisible();
    await expect(page.getByRole('button', { name: BOTAO })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /no Monitoramento$/ })).toHaveCount(0);
  });
});
