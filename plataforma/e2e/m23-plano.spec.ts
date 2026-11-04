import { test, expect, type Page } from '@playwright/test';
import { abre } from './semente-rumo';

/* Aba Planejamento: estratégia dos objetivos e justificativas dos preditores (RM3-18). A árvore não muda com a estratégia (RM3-16). */
const ILHA = 'plano';
const TRES = ['p1', 'p2', 'p3'];
const JUST = { 'm3.just.p1': 'Foco no começo do mandato', 'm3.just.p2': 'Tema em alta na Casa', 'm3.just.p3': 'Partido precisa crescer', 'm3.just.p4': 'Ainda é cedo para ocupar espaços', 'm3.just.p5': 'Sem base para entregas agora' };
const METAS = [{ id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos', status: 'nao_concluida' }, { id: 'b', pred: 'p3', texto: 'Visitar 10 escolas', status: 'nao_concluida' }];
const bloco = (page: Page) => page.getByRole('region', { name: 'Estratégia dos objetivos' });
const nos = (page: Page) => page.locator('[role="treeitem"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-no')));

test.describe('Estratégia e justificativas no Planejamento (RM3-18)', () => {
  test('mostra a estratégia escolhida acima da árvore e as 5 justificativas em bloco recolhível', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES, metas: METAS }, campos: { 'm3.est': 'a', ...JUST } });
    await expect(bloco(page)).toContainText('Estratégia dos objetivos: A');
    const just = bloco(page).locator('details');
    await expect(just.locator('li')).toHaveCount(5);
    await expect(just).not.toHaveAttribute('open', '');
    await just.locator('summary').click();
    await expect(just.locator('[data-just="p1"]')).toContainText('Foco no começo do mandato');
    await expect(just.locator('[data-just="p1"]')).toContainText('escolhido');
    await expect(just.locator('[data-just="p4"]')).toContainText('não escolhido');
    await expect(just.locator('[data-just="p4"]')).toContainText('Ainda é cedo para ocupar espaços');
    // a ordem na página: o bloco vem antes da árvore
    const yBloco = (await bloco(page).boundingBox())!.y;
    const yArvore = (await page.getByRole('tree', { name: 'Árvore do planejamento' }).boundingBox())!.y;
    expect(yBloco).toBeLessThan(yArvore);
  });

  test('na B o bloco diz B e a árvore mostra as frases do mandato', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES, metas: METAS }, campos: { 'm3.est': 'b', 'm3.obj.p1': 'Foco em três temas' } });
    await expect(bloco(page)).toContainText('Estratégia dos objetivos: B');
    await expect(page.locator('[data-no="obj-p1"]')).toContainText('Foco em três temas');
  });

  test('na C a nota lista as 3 frases da Legisla e nenhum nó novo aparece (RM3-14)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES, metas: METAS }, campos: { 'm3.est': 'c' } });
    await expect(bloco(page)).toContainText('Estratégia dos objetivos: C');
    await expect(bloco(page).getByRole('note').getByRole('listitem')).toHaveText(['Avanço Legislativo', 'Expansão de Capital Político e Influência', 'Governança Estratégica']);
    expect(await nos(page)).toEqual(['legado', 'obj-p1', 'meta-0', 'obj-p2', 'obj-p3', 'meta-1']);
  });

  test('os nós da árvore são os mesmos nas três estratégias (RM3-16)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES, metas: METAS }, campos: { 'm3.est': 'a' } });
    const emA = await nos(page);
    for (const e of ['b', 'c']) {
      await page.evaluate((x) => { (window as unknown as { D: { campos: Record<string, string> } }).D.campos['m3.est'] = x; window.dispatchEvent(new Event('guia:mudou')); }, e);
      await expect(bloco(page)).toContainText(`Estratégia dos objetivos: ${e.toUpperCase()}`);
      expect(await nos(page)).toEqual(emA);
    }
  });

  test('mandato antigo, sem estratégia nem justificativas, abre sem o bloco e sem erro', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: [], metas: [] } });
    await expect(bloco(page)).toHaveCount(0);
    await expect(page.locator('[data-ilha="plano"] .ilha-corpo')).toBeVisible();
  });

  test('mandato antigo com preditores e m3.obj abre na estratégia B (RMX-01)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES, metas: METAS }, campos: { 'm3.obj.p1': 'Foco em três temas' } });
    await expect(bloco(page)).toContainText('Estratégia dos objetivos: B');
  });

  test('planejamento arquivado segue somente leitura, sem o bloco e sem erro', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    const arq = { n: 1, criadoEm: '2026-05-01T10:00:00.000Z', legado: 'L', bandeiras: [], objetivos: [{ pid: 'p1', nome: 'Priorizar a agenda', pergunta: '', texto: 'Priorizar a agenda' }], metas: [{ id: 'z', pred: 'p1', texto: 'Meta antiga', status: 'concluida' }] };
    await abre(page, [ILHA], { D: { preditores: TRES, metas: METAS, planos: [arq] }, campos: { 'm3.est': 'a', ...JUST } });
    await expect(bloco(page)).toHaveCount(1); // o atual mostra
    await page.locator('.rm-ciclo select').selectOption('1');
    await expect(page.getByText('somente leitura')).toBeVisible();
    await expect(page.getByText('Meta antiga')).toBeVisible();
    await expect(bloco(page)).toHaveCount(0);
    expect(erros).toEqual([]);
  });
});
