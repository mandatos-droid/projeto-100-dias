import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { abre, MANDATO } from './semente-rumo';

/* P3 (RUM-60): imagem da primeira página e ordenação por atingimento. */
const LEGADO = {
  mandato: MANDATO,
  D: { rumo: { v: 1, bandeiras: [], legado: { el: { protagonista: 'Ana Souza', entrega: '', resultado: '', cargo: '' }, manchete: 'Ana Souza colocou a Educação no centro do debate', manual: true, jornal: 'A Gazeta do Mandato', fechado: false, rascunhos: [] } } },
};
const png = (caminho: string) => {
  const b = readFileSync(caminho);
  return { b, assinatura: b.subarray(0, 8).toString('hex'), largura: b.readUInt32BE(16), altura: b.readUInt32BE(20) };
};

test.describe('Baixar imagem (RUM-60.1)', () => {
  test('gera um PNG da primeira página, com o nome do jornal no arquivo', async ({ page }) => {
    await abre(page, ['rumo-legado'], LEGADO);
    const jornal = page.locator('.rm-jornal');
    const caixa = (await jornal.boundingBox())!;
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Baixar imagem' }).click()]);
    expect(download.suggestedFilename()).toBe('a-gazeta-do-mandato.png');
    const img = png((await download.path())!);
    expect(img.assinatura).toBe('89504e470d0a1a0a'); // assinatura de PNG
    expect(img.largura).toBeGreaterThanOrEqual(Math.floor(caixa.width * 2) - 2); // pixelRatio 2
    expect(img.altura).toBeGreaterThanOrEqual(Math.floor(caixa.height * 2) - 2);
  });

  test('a imagem acompanha a manchete atual: mudar o texto muda o PNG', async ({ page }) => {
    await abre(page, ['rumo-legado'], LEGADO);
    const baixa = async () => {
      const [d] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Baixar imagem' }).click()]);
      return png((await d.path())!).b;
    };
    const antes = await baixa();
    await page.getByLabel('Texto final da manchete').fill('Outra manchete, bem diferente e bem mais longa do que a primeira, para mudar o desenho');
    await expect(page.locator('.rm-jornal h2')).toContainText('Outra manchete');
    const depois = await baixa();
    expect(Buffer.compare(antes, depois)).not.toBe(0);
  });

  test('o botão não entra na impressão nem na imagem (fica fora da primeira página)', async ({ page }) => {
    await abre(page, ['rumo-legado'], LEGADO);
    await expect(page.locator('.rm-jornal').getByRole('button', { name: 'Baixar imagem' })).toHaveCount(0);
    await page.emulateMedia({ media: 'print' });
    await expect(page.getByRole('button', { name: 'Baixar imagem' })).toBeHidden();
  });
});

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
