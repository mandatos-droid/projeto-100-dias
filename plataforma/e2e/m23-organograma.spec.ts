import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { abre, camposDe } from './semente';

/* Missão 2 · organograma gerado da tabela de equipe (RM2-30 a 38). A tabela e o organograma ficam na mesma página, como na Mão na massa 1. */
const ILHAS = ['equipe-tabela', 'organograma'];
const campo = (page: Page, rotulo: string, linha: number) => page.getByLabel(`${rotulo}, linha ${linha}`);
const caixa = (page: Page, i: number) => page.locator(`.react-flow__node:has([data-cadeira="${i}"])`);
const topo = async (page: Page, i: number) => (await caixa(page, i).boundingBox())!.y;

/** linha completa de uma cadeira nova (índice i ≥ 20) ou da Chefia (0) */
const linha = (i: number, v: { pessoa: string; cargo: string; cat: string; coord: string; lider: string }) => ({
  [`m2.p${i + 1}.esc`]: 'Escopo do cargo', [`m2.p${i + 1}.comp`]: 'Competências do cargo',
  [`m2.p${i + 1}.nome_cargo`]: v.cargo, [`m2.f${i + 1}`]: v.pessoa,
  [`m2.p${i + 1}.cat`]: v.cat, [`m2.p${i + 1}.coord`]: v.coord, [`m2.p${i + 1}.lider`]: v.lider,
});
/* Chefia (0), Coordenação de Legislativo (20) e duas Executoras de Legislativo (21, 22) */
const equipe: Record<string, string> = {
  'm2.n': '4', 'm2.on': '0|20|21|22',
  ...linha(0, { pessoa: 'Ana Souza', cargo: 'Chefe de gabinete', cat: 'Chefia', coord: 'Chefia de área', lider: '-' }),
  ...linha(20, { pessoa: 'Bia Lima', cargo: 'Coordenadora Legislativa', cat: 'Coordenação', coord: 'Legislativo', lider: '0' }),
  ...linha(21, { pessoa: 'Caio Reis', cargo: 'Assessor legislativo', cat: 'Executora', coord: 'Legislativo', lider: '20' }),
  ...linha(22, { pessoa: 'Dani Melo', cargo: 'Assessora de plenário', cat: 'Executora', coord: 'Legislativo', lider: '20' }),
};

test.describe('Organograma gerado: estrutura (RM2-31, RM2-32, RM2-33, RM2-34)', () => {
  test('Chefia, Coordenação e Executoras formam 3 níveis ligados por hierarquia (RM2-31)', async ({ page }) => {
    await abre(page, ILHAS, equipe);
    await expect(page.locator('.es-no')).toHaveCount(4);
    const [yChefia, yCoord, yExec1, yExec2] = [await topo(page, 0), await topo(page, 20), await topo(page, 21), await topo(page, 22)];
    expect(yChefia).toBeLessThan(yCoord);
    expect(yCoord).toBeLessThan(yExec1);
    expect(yExec1).toBe(yExec2);
    await expect(page.locator('.react-flow__edge')).toHaveCount(3);
    for (const id of ['0-20', '20-21', '20-22']) await expect(page.locator(`.react-flow__edge[data-id="${id}"]`)).toHaveCount(1);
    await expect(page.getByRole('status', { name: 'Avisos do organograma' })).toHaveCount(0);
  });

  test('tirar a Coordenação mostra "Área sem coordenação" e liga as Executoras à Chefia (RM2-32)', async ({ page }) => {
    await abre(page, ILHAS, equipe);
    await campo(page, 'Categoria', 2).selectOption('Especialista');
    await expect(page.getByRole('status', { name: 'Avisos do organograma' })).toContainText('Área sem coordenação: Legislativo');
    for (const id of ['0-20', '0-21', '0-22']) await expect(page.locator(`.react-flow__edge[data-id="${id}"]`)).toHaveCount(1);
    expect((await camposDe(page))['m2.p22.lider']).toBe('0');
  });

  test('sem Chefia mostra "Defina a chefia"; com duas, o aviso de mais de uma chefia (RM2-33, RM2-34)', async ({ page }) => {
    await abre(page, ILHAS, equipe);
    await campo(page, 'Categoria', 1).selectOption('Coordenação');
    await expect(page.getByRole('status', { name: 'Avisos do organograma' })).toContainText('Defina a chefia');
    await campo(page, 'Categoria', 1).selectOption('Chefia');
    await campo(page, 'Categoria', 2).selectOption('Chefia');
    await expect(page.getByRole('status', { name: 'Avisos do organograma' })).toContainText('Mais de uma chefia');
    expect(Math.round(await topo(page, 0))).toBe(Math.round(await topo(page, 20))); // lado a lado, no topo
  });
});

test.describe('Organograma gerado: caixa e tabela (RM2-36, RM2-37)', () => {
  test('editar a tabela atualiza o organograma na hora (RM2-36)', async ({ page }) => {
    await abre(page, ILHAS, equipe);
    await expect(caixa(page, 21)).toContainText('Caio Reis');
    await campo(page, 'Nome da pessoa', 3).fill('Caio Reis Filho');
    await expect(caixa(page, 21)).toContainText('Caio Reis Filho');
    await campo(page, 'Nome do cargo', 3).fill('Assessor de comissões');
    await expect(caixa(page, 21)).toContainText('Assessor de comissões');
    await campo(page, 'Nome da pessoa', 3).fill('*');
    await expect(caixa(page, 21)).toContainText('Processo seletivo');
  });

  test('a caixa mostra só pessoa, cargo e área, sem painel, anel nem "Acrescentar cadeira" (RM2-37)', async ({ page }) => {
    await abre(page, ILHAS, equipe);
    const c = page.locator('.es-no[data-cadeira="20"]');
    await expect(c).toContainText('Bia Lima');
    await expect(c).toContainText('Coordenadora Legislativa');
    await expect(c).toContainText('Legislativo');
    await expect(page.locator('.es-no[data-cadeira="0"]')).toContainText('Chefia de gabinete');
    await expect(c.getByRole('img')).toHaveCount(0);
    await page.locator('.es-no[data-cadeira="20"]').click();
    await expect(page.getByRole('complementary')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Acrescentar cadeira' })).toHaveCount(0);
  });

  test('clicar na caixa leva à linha da tabela e foca o primeiro campo editável dela (RM2-37)', async ({ page }) => {
    await abre(page, ILHAS, equipe);
    await page.locator('.es-no[data-cadeira="22"]').click();
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('es-tab-22-esc');
    await expect(page.locator('#es-linha-22')).toBeInViewport();
  });

  test('Enter numa caixa focada também leva à linha da tabela', async ({ page }) => {
    await abre(page, ILHAS, equipe);
    await caixa(page, 21).focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('es-tab-21-esc');
  });

  test('cada caixa expõe pessoa, cargo e área no aria-label', async ({ page }) => {
    await abre(page, ILHAS, equipe);
    await expect(caixa(page, 20)).toHaveAttribute('aria-label', /^Bia Lima, Coordenadora Legislativa, área Legislativo\./);
    await expect(caixa(page, 0)).toHaveAttribute('aria-label', /^Ana Souza, Chefe de gabinete, área Chefia de gabinete\./);
  });

  test('sem nenhuma linha com cargo, categoria e área, explica quando o organograma aparece', async ({ page }) => {
    await abre(page, ILHAS, { 'm2.n': '2', 'm2.on': '0|20' });
    await expect(page.getByText('O organograma aparece sozinho quando ao menos uma linha da tabela tiver cargo, categoria e área.')).toBeVisible();
    await expect(page.locator('.es-no')).toHaveCount(0);
  });

  test('todas as linhas com asterisco mostram só cargos e áreas (edge case)', async ({ page }) => {
    const todasVagas = { ...equipe, 'm2.f1': '*', 'm2.f21': '*', 'm2.f22': '*', 'm2.f23': '*' };
    await abre(page, ILHAS, todasVagas);
    await expect(page.locator('.es-no strong', { hasText: 'Processo seletivo' })).toHaveCount(4);
    await expect(caixa(page, 20)).toContainText('Coordenadora Legislativa');
    await expect(caixa(page, 20)).toContainText('Legislativo');
  });
});

test.describe('Organograma gerado: exportar (RM2-38)', () => {
  test('"Exportar organograma (PNG)" baixa um .png não vazio', async ({ page }) => {
    await abre(page, ILHAS, equipe);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar organograma (PNG)' }).click()]);
    expect(dl.suggestedFilename()).toBe('organograma-do-mandato.png');
    const bytes = readFileSync((await dl.path())!);
    expect(bytes.length).toBeGreaterThan(1000);
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  });
});

test.describe('Organograma gerado: mandato do modelo antigo (RMX-02)', () => {
  test('desenha com categoria e área derivadas e não grava nada ao abrir', async ({ page }) => {
    const antigo = { 'm2.on': '0|1|2', 'm2.f1': 'Ana', 'm2.f2': 'Bia', 'm2.f3': 'Caio', 'm2.p1.nome_cargo': 'Chefe de gabinete', 'm2.p2.nome_cargo': 'Coordenadora Legislativa', 'm2.p3.nome_cargo': 'Assessor' };
    await abre(page, ['organograma'], antigo);
    await expect(page.locator('.es-no')).toHaveCount(3);
    await expect(caixa(page, 1)).toContainText('Legislativo');
    expect(await topo(page, 0)).toBeLessThan(await topo(page, 1));
    expect(await topo(page, 1)).toBeLessThan(await topo(page, 2));
    expect((await camposDe(page))['m2.n']).toBeUndefined();
  });
});
