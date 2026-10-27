import { test, expect, type Page } from '@playwright/test';
import { abre, dadoDe, EQUIPE } from './semente-rumo';

/* Missão 5 · feedback pelo organograma da Missão 2 (M5-20, M5-21).
   EQUIPE: 0 Ana lidera 1 Bruno; Bruno lidera 2 Carla e 3 Davi. */
type Conv = { id: string; cadeira?: number; pessoa?: string; lider?: string; data?: string; destaques?: string; ajustes?: string; acao?: string; pontos?: string; encam?: string };
const card = (page: Page, i: number) => page.locator(`[data-lider="${i}"]`);
/* Equipe com duas lideranças irmãs: a Chefia (0) lidera Legislativo (1) e Comunicação (7); cada uma lidera uma pessoa. */
const IRMAS = { 'm2.on': '0|1|2|7|8', 'm2.f1': 'Ana Souza', 'm2.f2': 'Bruno Lima', 'm2.f3': 'Carla Dias', 'm2.f8': 'Hugo Alves', 'm2.f9': 'Ivo Costa' };

test.describe('Mapa do organograma no feedback (M5-20.1)', () => {
  test('cada liderança aparece com "dá feedback a N pessoas" e "feitas X de N"', async ({ page }) => {
    await abre(page, ['rumo-feedback'], { campos: EQUIPE, D: { feedbacks: [] } });
    await expect(card(page, 0)).toContainText('Ana Souza');
    await expect(card(page, 0)).toContainText('dá feedback a 1 pessoa');
    await expect(card(page, 0)).toContainText('feitas 0 de 1');
    await expect(card(page, 1)).toContainText('Bruno Lima');
    await expect(card(page, 1)).toContainText('dá feedback a 2 pessoas');
    await expect(card(page, 1)).toContainText('feitas 0 de 2');
    await expect(page.locator('[data-lider]')).toHaveCount(2);
  });

  test('a contagem "feitas X de N" vem das conversas gravadas', async ({ page }) => {
    const feitas: Conv[] = [{ id: 'a', cadeira: 2, pessoa: 'Carla Dias', destaques: 'x' }];
    await abre(page, ['rumo-feedback'], { campos: EQUIPE, D: { feedbacks: feitas } });
    await expect(card(page, 1)).toContainText('feitas 1 de 2');
    await expect(card(page, 0)).toContainText('feitas 0 de 1');
  });

  test('conversa no formato antigo (só o nome da pessoa) conta para a pessoa certa, sem alterar D.feedbacks (M5-21.7)', async ({ page }) => {
    const antiga: Conv = { id: 'o', pessoa: 'davi rocha', lider: 'Bruno', data: '10/03', pontos: 'Falamos de prazos', encam: 'Revisar escopo' };
    await abre(page, ['rumo-feedback'], { campos: EQUIPE, D: { feedbacks: [antiga] } });
    await expect(card(page, 1)).toContainText('feitas 1 de 2');
    expect(await dadoDe(page, 'feedbacks')).toEqual([antiga]);
  });

  test('lideranças irmãs ficam lado a lado no computador (M5-20.1)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await abre(page, ['rumo-feedback'], { campos: IRMAS, D: { feedbacks: [] } });
    const a = (await card(page, 1).boundingBox())!, b = (await card(page, 7).boundingBox())!;
    expect(Math.abs(a.y - b.y)).toBeLessThan(2);
    expect(Math.abs(a.x - b.x)).toBeGreaterThan(100);
  });
});
