import { test, expect, type Page } from '@playwright/test';
import { abre, dadoDe, MANDATO } from './semente-rumo';

/* Missão 4 · comissões (CAP-01, CAP-02, CAP-04). Ilha montada na rota de teste, com o catálogo real da Câmara (br.json). */
const ILHA = 'capital-comissoes';
const FEDERAL = { ...MANDATO, cargo: 'Deputado(a) Federal', casa: 'Câmara dos Deputados' };
const SAUDE = { 'm3.mural': 'Saúde', 'm3.b1': 'Saúde' };
const AVISO = 'Nomes podem ser diferentes na sua Assembleia. Confira no Regimento Interno';
type Registro = { sigla?: string; esp?: string; prio?: string };
const registros = (page: Page) => dadoDe(page, 'comissoes') as Promise<Registro[]>;
const sugeridas = (page: Page) => page.getByRole('region', { name: 'Sugeridas para você' });
const todas = (page: Page) => page.getByRole('region', { name: 'Todas as comissões' });

test.describe('Deputado(a) Federal com bandeira (CAP-01.1, CAP-01.2, CAP-01.3)', () => {
  test('Saúde prioritária: a Comissão de Saúde aparece em "Sugeridas para você" com o motivo, e não em "Todas"', async ({ page }) => {
    await abre(page, [ILHA], { campos: SAUDE, mandato: FEDERAL });
    const saude = sugeridas(page).locator('li', { hasText: 'Comissão de Saúde' });
    await expect(saude).toBeVisible();
    await expect(saude).toContainText('Combina com sua bandeira Saúde');
    await expect(todas(page).getByText('Comissão de Saúde')).toHaveCount(0);
    await expect(todas(page).locator('li', { hasText: 'Comissão de Educação' })).toBeVisible();
    await expect(page.getByText(AVISO)).toHaveCount(0);
  });

  test('escolher a comissão grava em D.comissoes com sigla, nome e bandeira em texto legível', async ({ page }) => {
    await abre(page, [ILHA], { campos: SAUDE, mandato: FEDERAL });
    await page.getByRole('checkbox', { name: 'Escolher Comissão de Saúde' }).check();
    expect(await registros(page)).toEqual([expect.objectContaining({ sigla: 'CSAUDE', esp: 'Comissão de Saúde', prio: 'Saúde' })]);
  });

  test('a busca acha por nome (sem acento) e por sigla, e avisa quando nada casa', async ({ page }) => {
    await abre(page, [ILHA], { campos: SAUDE, mandato: FEDERAL });
    const busca = page.getByLabel('Buscar por nome ou sigla');
    await busca.fill('educacao');
    await expect(todas(page).locator('li')).toHaveCount(1);
    await expect(todas(page).locator('li')).toContainText('Comissão de Educação');
    await busca.fill('CFT');
    await expect(todas(page).locator('li')).toHaveCount(1);
    await expect(todas(page).locator('li')).toContainText('Comissão de Finanças e Tributação');
    await busca.fill('xyzxyz');
    await expect(todas(page).locator('li')).toHaveCount(0);
    await expect(todas(page).getByText('Nenhuma comissão encontrada')).toBeVisible();
  });
});

test.describe('Deputado(a) Estadual e outros cargos (CAP-02)', () => {
  test('Estadual: sugere pela Câmara, mostra o aviso e o botão "Ajustar o nome"', async ({ page }) => {
    await abre(page, [ILHA], { campos: SAUDE, mandato: MANDATO });
    await expect(page.getByText(AVISO)).toBeVisible();
    await expect(sugeridas(page).locator('li', { hasText: 'Comissão de Saúde' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ajustar o nome' }).first()).toBeVisible();
  });

  test('Senado: lista da Câmara como referência, com o mesmo aviso', async ({ page }) => {
    await abre(page, [ILHA], { campos: SAUDE, mandato: { ...MANDATO, cargo: 'Senador(a)', casa: 'Senado Federal' } });
    await expect(page.getByText(AVISO)).toBeVisible();
    await expect(todas(page).locator('li').first()).toBeVisible();
  });
});

test.describe('Sem bandeiras e cargo vazio (CAP-01.9, CAP-40)', () => {
  test('sem bandeiras: todas as 30 comissões, sem "Sugeridas", e o atalho para a Missão 3', async ({ page }) => {
    await abre(page, [ILHA], { mandato: FEDERAL });
    await expect(sugeridas(page)).toHaveCount(0);
    await expect(todas(page).locator('li')).toHaveCount(30);
    await expect(page.getByRole('link', { name: /Missão 3/ })).toHaveAttribute('href', '#/m/3/m3.bandeiras');
  });

  test('cargo vazio: a lista da Câmara aparece sem sugeridas, mesmo com bandeira', async ({ page }) => {
    await abre(page, [ILHA], { campos: SAUDE, mandato: { ...MANDATO, cargo: '' } });
    await expect(sugeridas(page)).toHaveCount(0);
    await expect(todas(page).locator('li')).toHaveCount(30);
  });
});
