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

test.describe('Lista de pessoas e registro da conversa (M5-20.2, M5-21)', () => {
  const abreEquipe = (page: Page, feedbacks: Conv[] = []) => abre(page, ['rumo-feedback'], { campos: EQUIPE, D: { feedbacks } });
  const pessoa = (page: Page, i: number) => page.locator(`[data-pessoa="${i}"]`);
  const feedbacksDe = async (page: Page) => (await dadoDe(page, 'feedbacks')) as Conv[];

  test('clicar na liderança lista as pessoas dela, "feita" ou "pendente" (M5-20.2)', async ({ page }) => {
    await abreEquipe(page, [{ id: 'a', cadeira: 2, pessoa: 'Carla Dias', destaques: 'x' }]);
    await expect(page.locator('[data-pessoa]')).toHaveCount(0);
    await card(page, 1).getByRole('button', { name: /Bruno Lima/ }).click();
    await expect(page.locator('[data-pessoa]')).toHaveCount(2);
    await expect(pessoa(page, 2)).toContainText('Carla Dias');
    await expect(pessoa(page, 2)).toContainText('feita');
    await expect(pessoa(page, 3)).toContainText('Davi Rocha');
    await expect(pessoa(page, 3)).toContainText('pendente');
  });

  test('clicar na pessoa abre o formulário com data, destaques, ajustes e plano de ação (M5-21.3)', async ({ page }) => {
    await abreEquipe(page);
    await card(page, 1).getByRole('button', { name: /Bruno Lima/ }).click();
    await pessoa(page, 3).getByRole('button', { name: /Davi Rocha/ }).click();
    const form = page.getByRole('form', { name: 'Conversa de feedback com Davi Rocha' });
    await expect(form.getByLabel('Data da conversa')).toBeVisible();
    await expect(form.getByLabel('Pontos de destaque')).toBeVisible();
    await expect(form.getByLabel('Pontos de ajuste')).toBeVisible();
    await expect(form.getByLabel('Plano de ação pactuado')).toBeVisible();
  });

  test('salvar grava em D.feedbacks, marca a pessoa como feita e atualiza a contagem (M5-21.4)', async ({ page }) => {
    await abreEquipe(page);
    await card(page, 1).getByRole('button', { name: /Bruno Lima/ }).click();
    await pessoa(page, 3).getByRole('button', { name: /Davi Rocha/ }).click();
    const form = page.getByRole('form', { name: 'Conversa de feedback com Davi Rocha' });
    await form.getByLabel('Data da conversa').fill('18/03');
    await form.getByLabel('Pontos de destaque').fill('Boa entrega');
    await form.getByLabel('Pontos de ajuste').fill('Prazos');
    await form.getByLabel('Plano de ação pactuado').fill('Reunião semanal');
    await form.getByRole('button', { name: 'Salvar conversa' }).click();
    const g = await feedbacksDe(page);
    expect(g).toHaveLength(1);
    expect(g[0]).toMatchObject({ cadeira: 3, pessoa: 'Davi Rocha', lider: 'Bruno Lima', data: '18/03', destaques: 'Boa entrega', ajustes: 'Prazos', acao: 'Reunião semanal' });
    await expect(card(page, 1)).toContainText('feitas 1 de 2');
    await expect(pessoa(page, 3)).toContainText('feita');
    await expect(pessoa(page, 2)).toContainText('pendente');
  });

  test('a conversa gravada segue legível pelo Resumo do Guia (campos pontos e encam espelhados)', async ({ page }) => {
    await abreEquipe(page);
    await card(page, 1).getByRole('button', { name: /Bruno Lima/ }).click();
    await pessoa(page, 2).getByRole('button', { name: /Carla Dias/ }).click();
    const form = page.getByRole('form', { name: 'Conversa de feedback com Carla Dias' });
    await form.getByLabel('Pontos de destaque').fill('Boa escuta');
    await form.getByLabel('Pontos de ajuste').fill('Prazos');
    await form.getByLabel('Plano de ação pactuado').fill('Agenda semanal');
    await form.getByRole('button', { name: 'Salvar conversa' }).click();
    const [v] = await feedbacksDe(page);
    expect(v.pontos).toContain('Boa escuta');
    expect(v.pontos).toContain('Prazos');
    expect(v.encam).toBe('Agenda semanal');
  });

  test('editar a conversa grava a mudança sem criar outra e a contagem segue (M5-21.5)', async ({ page }) => {
    await abreEquipe(page, [{ id: 'a', cadeira: 2, pessoa: 'Carla Dias', lider: 'Bruno Lima', data: '10/03', destaques: 'Antes', ajustes: '', acao: '' }]);
    await card(page, 1).getByRole('button', { name: /Bruno Lima/ }).click();
    await pessoa(page, 2).getByRole('button', { name: /Carla Dias/ }).click();
    await page.getByRole('button', { name: 'Editar conversa de 10/03' }).click();
    const form = page.getByRole('form', { name: 'Conversa de feedback com Carla Dias' });
    await expect(form.getByLabel('Pontos de destaque')).toHaveValue('Antes');
    await form.getByLabel('Pontos de destaque').fill('Depois');
    await form.getByRole('button', { name: 'Salvar conversa' }).click();
    const g = await feedbacksDe(page);
    expect(g).toHaveLength(1);
    expect(g[0]).toMatchObject({ id: 'a', destaques: 'Depois', cadeira: 2 });
    await expect(card(page, 1)).toContainText('feitas 1 de 2');
  });

  test('apagar a conversa volta a pessoa para pendente e atualiza a contagem (M5-21.5)', async ({ page }) => {
    await abreEquipe(page, [{ id: 'a', cadeira: 2, pessoa: 'Carla Dias', data: '10/03', destaques: 'x' }]);
    await card(page, 1).getByRole('button', { name: /Bruno Lima/ }).click();
    await pessoa(page, 2).getByRole('button', { name: /Carla Dias/ }).click();
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Apagar conversa de 10/03' }).click();
    expect(await feedbacksDe(page)).toEqual([]);
    await expect(card(page, 1)).toContainText('feitas 0 de 2');
    await expect(pessoa(page, 2)).toContainText('pendente');
  });

  test('conversa de pessoa que saiu da Missão 2 continua na lista, como "pessoa removida"', async ({ page }) => {
    const sai: Conv = { id: 'z', cadeira: 9, pessoa: 'Zé Antigo', lider: 'Bruno Lima', data: '01/02', destaques: 'texto guardado' };
    await abreEquipe(page, [sai]);
    const bloco = page.locator('[data-removidas]');
    await expect(bloco).toContainText('Zé Antigo');
    await expect(bloco).toContainText('pessoa removida');
    await expect(bloco).toContainText('texto guardado');
    expect(await feedbacksDe(page)).toEqual([sai]);
  });
});
