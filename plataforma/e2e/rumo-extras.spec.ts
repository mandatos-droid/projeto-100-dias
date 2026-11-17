import { test, expect } from '@playwright/test';
import { abre, MANDATO } from './semente-rumo';

/* P3 (RUM-60): imagem da primeira página e ordenação por atingimento. */
const LEGADO = {
  mandato: MANDATO,
  D: { rumo: { v: 1, bandeiras: [], legado: { el: { protagonista: 'Ana Souza', entrega: '', resultado: '', cargo: '' }, manchete: 'Ana Souza colocou a Educação no centro do debate', manual: true, jornal: 'A Gazeta do Mandato', fechado: false, rascunhos: [] } } },
};

test.describe('Ordenar por atingimento (RUM-60.2)', () => {
  const D = {
    preditores: ['p1', 'p2', 'p3'],
    metas: [
      { id: 'a', pred: 'p1', texto: 'Visitar 10 escolas', status: 'concluida70' },
      { id: 'b', pred: 'p2', texto: 'Lançar a campanha', status: 'congelada' },
      { id: 'c', pred: 'p3', texto: 'Realizar 3 audiências', status: 'nao_concluida' },
      { id: 'd', pred: 'p3', texto: 'Aprovar 2 projetos', status: 'concluida' },
    ],
  };
  const ordem = (page: import('@playwright/test').Page) => page.locator('[data-tipo="objetivo"]').evaluateAll((l) => l.map((e) => (e as HTMLElement).dataset.no));

  test('reordena do menor para o maior, com "—" ao final, e volta à ordem original ao desligar', async ({ page }) => {
    await abre(page, ['plano'], { D });
    expect(await ordem(page)).toEqual(['obj-p1', 'obj-p2', 'obj-p3']); // p1 = 70, p2 = —, p3 = 50
    const bt = page.getByRole('button', { name: 'Ordenar por atingimento' });
    await bt.click();
    await expect(bt).toHaveAttribute('aria-pressed', 'true');
    expect(await ordem(page)).toEqual(['obj-p3', 'obj-p1', 'obj-p2']);
    await bt.click();
    expect(await ordem(page)).toEqual(['obj-p1', 'obj-p2', 'obj-p3']);
  });

  test('mudar um status com a ordenação ligada reordena na hora', async ({ page }) => {
    await abre(page, ['plano'], { D });
    await page.getByRole('button', { name: 'Ordenar por atingimento' }).click();
    await page.getByLabel('Status da meta 03').selectOption('concluida'); // p3 = (100 + 100) / 2 = 100
    expect(await ordem(page)).toEqual(['obj-p1', 'obj-p3', 'obj-p2']);
  });
});
