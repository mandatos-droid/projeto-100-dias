import { test, expect, type Page } from '@playwright/test';
import { abreGuia, salvoDe, MANDATO_REAL } from './guia-real';
const MANDATO = { ...MANDATO_REAL, partido: 'PSOL' };

/* Missão 1 · Conjuntura (sugestões #17 a #20). O Guia troca cada textarea por um editor rico (.rico-area). */
const editor = (page: Page, k: string) => page.locator(`.campo:has(textarea[data-k="${k}"]) .rico-area`);
const campos = async (page: Page) => ((await salvoDe(page)).dados as { campos?: Record<string, string> }).campos ?? {};

test.describe('Conjuntura · legislatura (LEG-04, LEG-05)', () => {
  test('texto de análise, 2 orientações e 5 definições antes dos dados, sem a pergunta das pontes', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.conjuntura');
    await expect(page.getByText('Analise qual é o tipo de relação que a liderança parlamentar tem com as pessoas eleitas, a partir dos dados expostos abaixo.')).toBeVisible();
    await expect(page.locator('ol li').filter({ hasText: 'Crie categorias iniciais de análise' })).toHaveCount(1);
    await expect(page.locator('.categorias-relacao li')).toHaveCount(5);
    await expect(page.locator('#tela')).not.toContainText('100 primeiros dias');
    await expect(page.locator('#tela')).not.toContainText('E quais são as pontes não óbvias que podem ser construídas');
    await expect(page.locator('textarea[data-k="m1.q4b"]')).toHaveCount(0);
    const defs = await page.locator('.categorias-relacao').boundingBox();
    const ilha = await page.locator('[data-ilha="assentos"]').boundingBox();
    expect(defs && ilha && defs.y < ilha.y).toBeTruthy();
  });

  test('as respostas antigas de m1.q4 e m1.q4b seguem gravadas, mesmo sem caixa na tela', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.conjuntura', { dados: { campos: { 'm1.q4': 'texto antigo', 'm1.q4b': 'ponte antiga' } } });
    await expect(page.locator('[data-ilha="assentos"]')).toBeVisible();
    const c = await campos(page);
    expect(c['m1.q4']).toBe('texto antigo');
    expect(c['m1.q4b']).toBe('ponte antiga');
  });
});

test.describe('Conjuntura · partido, atores e social (PAR-01, PAR-09, PAR-13, SOC-07)', () => {
  const COMANDO = 'A partir dos dados apresentados acima, e de outros que você possa ter pesquisado, faça uma análise destacando o que mais te chama a atenção e como o mandato deve agir a partir desta conjuntura.';
  const depoisDosDados = async (page: Page, ilha: string, k: string) => {
    const d = await page.locator(`[data-ilha="${ilha}"]`).boundingBox();
    const c = await editor(page, k).boundingBox();
    expect(d && c && c.y > d.y).toBeTruthy();
  };

  test('2.2: contexto antes dos dados, textos de PAR-09 depois; resposta antiga de m1.q5 preservada', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.conjuntura', { dados: { campos: { 'm1.q5': 'análise antiga' } } });
    await expect(page.getByText('é fundamental para a compreensão da conjuntura política em que a liderança parlamentar está inserida.')).toBeVisible();
    await expect(page.getByText('Identifique que tipo de relação com o partido a liderança parlamentar deseja ter')).toBeVisible();
    await expect(page.getByText('Selecione 2 dados e registre como a liderança parlamentar deseja que o mandato reaja a eles.')).toBeVisible();
    await depoisDosDados(page, 'calor', 'm1.q5');
    await expect(editor(page, 'm1.q5')).toContainText('análise antiga');
  });

  test('fim da página: texto dos atores políticos e caixa m1.q6, sem a pergunta nem o mapa de município', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.conjuntura');
    await expect(page.getByText('Registre quais são os principais atores políticos do entorno da liderança parlamentar.')).toBeVisible();
    await expect(page.locator('#tela')).not.toContainText('Qual é a conjuntura política do seu estado ou município de origem?');
    await expect(page.locator('[data-ilha="municipio"]')).toHaveCount(0);
    await depoisDosDados(page, 'calor', 'm1.q6');
    await editor(page, 'm1.q6').click();
    await page.keyboard.type('Prefeito da capital');
    await expect.poll(async () => (await campos(page))['m1.q6']).toContain('Prefeito da capital');
  });

  test('m1.q8a traz a caixa de análise depois dos dados sociais', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.oportunidades');
    await expect(page.getByText(COMANDO)).toBeVisible();
    await depoisDosDados(page, 'social', 'm1.q8a');
  });
});

test.describe('Conjuntura do partido · só a pergunta abrangente (SUG-20)', () => {
  const CONJ2 = { muns: {}, posicao: {}, relacao: 'lideranca', relacaoPq: 'quer disputar a executiva', desafios: ['Poucos filiados'], oportunidades: ['Eleição municipal'] };

  test('as seções de relação e de desafios e oportunidades não aparecem', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.conjuntura', { mandato: MANDATO });
    await expect(page.locator('[data-ilha="calor"]')).toContainText('Placar do partido', { timeout: 30_000 });
    await expect(page.locator('#tela')).not.toContainText('Que relação a liderança quer ter com o partido?');
    await expect(page.locator('#tela')).not.toContainText('Desafios e oportunidades de expansão da relevância partidária');
    await expect(page.locator('#tela')).not.toContainText('Por que essa escolha?');
  });

  test('os valores já salvos de relação e desafios seguem gravados depois de abrir e editar a tela', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.conjuntura', { mandato: MANDATO, dados: { conj2: CONJ2 } });
    await expect(page.locator('[data-ilha="calor"]')).toContainText('Placar do partido', { timeout: 30_000 });
    await editor(page, 'm1.q5').click();
    await page.keyboard.type('análise nova');
    await expect.poll(async () => (await campos(page))['m1.q5']).toContain('análise nova');
    expect(((await salvoDe(page)).dados as { conj2?: unknown }).conj2).toEqual(CONJ2);
  });
});

test.describe('Conjuntura · tabela de eleitos paginada (sugestão 92)', () => {
  const linhas = (page: Page) => page.locator('[data-ilha="assentos"] table.tb tbody tr');

  test('mostra 15 linhas por página e navega com Anterior/Próxima', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await abreGuia(page, '#/m/1/m1.conjuntura', { mandato: MANDATO });
    await expect.poll(() => linhas(page).count(), { timeout: 30_000 }).toBe(15);
    await expect(page.getByText(/Página 1 de/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Anterior/ })).toBeDisabled();
    await page.getByRole('button', { name: /Próxima/ }).click();
    await expect(page.getByText(/Página 2 de/)).toBeVisible();
  });

  test('a busca global de parlamentares foi removida', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.conjuntura', { mandato: MANDATO });
    await expect.poll(() => linhas(page).count(), { timeout: 30_000 }).toBeGreaterThan(0);
    await expect(page.getByText('Procurar qualquer parlamentar eleito no Brasil')).toHaveCount(0);
  });
});
