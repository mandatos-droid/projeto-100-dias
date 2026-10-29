import { test, expect } from '@playwright/test';
import { abre, dadoDe, MANDATO } from './semente-rumo';

const ILHA = 'rumo-espacos';
const FEDERAL = { ...MANDATO, cargo: 'Deputado(a) Federal', casa: 'Câmara dos Deputados' };
const EDUCACAO = { 'm3.mural': 'Educação; Saúde', 'm3.b1': 'Educação' };
type Espaco = { comissao?: string; papel?: string; cargo?: string; bandeira?: string };
const registros = (page: import('@playwright/test').Page) => dadoDe(page, 'comissoesDesejadas') as Promise<Espaco[]>;

test.describe('Deputado(a) Federal com catálogo da Câmara (RUM-50.2, RUM-50.5, RUM-51.6)', () => {
  test('Educação prioritária: "Comissão de Educação" aparece destacada e registra como titular com a bandeira', async ({ page }) => {
    await abre(page, [ILHA], { campos: EDUCACAO, mandato: FEDERAL });
    const destacada = page.locator('.rm-sug-c.dest', { hasText: 'Comissão de Educação' });
    await expect(destacada).toBeVisible();
    await expect(destacada).toContainText('Educação');
    await destacada.getByRole('button', { name: 'Registrar Comissão de Educação' }).click();
    expect(await registros(page)).toEqual([expect.objectContaining({ comissao: 'Comissão de Educação', papel: 'Titular', cargo: 'Titular', bandeira: 'Educação' })]);
    await expect(page.locator('.rm-reg li')).toContainText('Comissão de Educação');
    await expect(page.getByRole('button', { name: 'Comissão de Educação já registrada' })).toBeDisabled();
  });

  test('as demais comissões do catálogo ficam numa lista recolhida e a data do catálogo aparece', async ({ page }) => {
    await abre(page, [ILHA], { campos: EDUCACAO, mandato: FEDERAL });
    await expect(page.locator('.rm-antigo summary')).toContainText('Todas as comissões');
    await expect(page.getByText(/Catálogo gerado em/)).toBeVisible();
  });

  test('sem bandeira prioritária pede para confirmá-las antes de sugerir', async ({ page }) => {
    await abre(page, [ILHA], { mandato: FEDERAL });
    await expect(page.getByText('Confirme as agendas prioritárias')).toBeVisible();
  });
});

const MINAS = { ...MANDATO, uf: 'MG' };
const ALMG = { gerado: '2026-10-01T00:00:00Z', fonte: 'https://exemplo.test/almg', comissoes: [{ nome: 'Comissão de Educação, Cultura, Ciência e Tecnologia da ALMG', sigla: 'CECCT' }, { nome: 'Comissão de Obras Públicas da ALMG', sigla: 'COP' }] };

test.describe('Deputado(a) Estadual com catálogo da UF (RUM-50.3, RUM-50.4)', () => {
  test('MG com mg.json: as comissões da Assembleia aparecem, a de Educação destacada, sem nomes genéricos', async ({ page }) => {
    let pedidos = 0;
    await page.route('**/data/comissoes/mg.json', (r) => { pedidos++; return r.fulfill({ json: ALMG }); });
    await abre(page, [ILHA], { campos: EDUCACAO, mandato: MINAS });
    const destacada = page.locator('.rm-sug-c.dest', { hasText: 'Comissão de Educação, Cultura, Ciência e Tecnologia da ALMG' });
    await expect(destacada).toBeVisible();
    await expect(page.locator('.rm-antigo summary')).toContainText('Todas as comissões');
    await expect(page.getByText('Comissão de Obras Públicas da ALMG')).toBeAttached();
    await expect(page.getByText('Nomes genéricos por bandeira')).toHaveCount(0);
    expect(pedidos).toBeGreaterThan(0);
  });

  test('MG com mg.json em 404: cai no modo genérico por bandeira e continua aceitando nome livre', async ({ page }) => {
    await page.route('**/data/comissoes/mg.json', (r) => r.fulfill({ status: 404, body: 'não existe' }));
    await abre(page, [ILHA], { campos: EDUCACAO, mandato: MINAS });
    await expect(page.getByText('Nomes genéricos por bandeira')).toBeVisible();
    await expect(page.locator('.rm-sug-c.dest', { hasText: 'Comissão de Educação' })).toBeVisible();
    await expect(page.locator('.rm-antigo')).toHaveCount(0);
    await expect(page.getByLabel('Comissão ou espaço')).toBeVisible();
  });
});

test.describe('Deputado(a) Estadual sem catálogo da UF (RUM-50.4)', () => {
  test('mostra nomes genéricos por bandeira e aceita nome livre', async ({ page }) => {
    await abre(page, [ILHA], { campos: EDUCACAO, mandato: MANDATO });
    await expect(page.locator('.rm-sug-c.dest', { hasText: 'Comissão de Educação' })).toBeVisible();
    await expect(page.getByText('Nomes genéricos por bandeira')).toBeVisible();
    await expect(page.locator('.rm-antigo')).toHaveCount(0);

    await page.getByLabel('Comissão ou espaço').fill('Comissão de Finanças e Orçamento');
    await page.getByLabel('Papel').selectOption('Relatoria');
    await page.getByRole('button', { name: 'Registrar espaço' }).click();
    expect(await registros(page)).toEqual([expect.objectContaining({ comissao: 'Comissão de Finanças e Orçamento', papel: 'Relatoria' })]);
  });

  test('os tipos de espaço da Assembleia aparecem e preenchem o papel ou o nome', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await expect(page.getByRole('button', { name: 'CPMI (Comissão Parlamentar Mista de Inquérito)' })).toHaveCount(0); // só Câmara e Senado
    await page.getByRole('button', { name: 'Suplente de comissão' }).click();
    await expect(page.getByLabel('Papel')).toHaveValue('Suplente');
    await page.getByRole('button', { name: 'Mesa Diretora' }).click();
    await expect(page.getByLabel('Comissão ou espaço')).toHaveValue('Mesa Diretora');
  });

  test('nome vazio não registra e avisa', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await page.getByRole('button', { name: 'Registrar espaço' }).click();
    await expect(page.locator('#avisos')).toContainText('Escreva a comissão ou o espaço');
    expect(await registros(page)).toEqual([]);
  });
});

test.describe('Alerta e dica (RUM-51.7, RUM-51.8)', () => {
  test('espaço que não conversa com a bandeira prioritária mostra o alerta e grava mesmo assim', async ({ page }) => {
    await abre(page, [ILHA], { campos: EDUCACAO, mandato: MANDATO });
    await page.getByLabel('Comissão ou espaço').fill('Comissão de Turismo');
    await page.getByRole('button', { name: 'Registrar espaço' }).click();
    await expect(page.locator('.rm-reg li')).toContainText('Este espaço não conversa com as agendas prioritárias');
    expect(await registros(page)).toHaveLength(1);
  });

  test('espaço da bandeira prioritária não mostra alerta', async ({ page }) => {
    await abre(page, [ILHA], { campos: EDUCACAO, mandato: MANDATO });
    await page.getByLabel('Comissão ou espaço').fill('Comissão de Educação e Cultura');
    await page.getByRole('button', { name: 'Registrar espaço' }).click();
    await expect(page.locator('.rm-reg li')).toHaveCount(1);
    await expect(page.locator('.rm-alerta')).toHaveCount(0);
  });

  test('a dica do Guia aparece enquanto a bandeira 1 não tem espaço e some quando ela ganha um', async ({ page }) => {
    await abre(page, [ILHA], { campos: EDUCACAO, mandato: MANDATO });
    const dica = page.locator('.apoio', { hasText: 'concentrar esforços para que a vaga na comissão com titularidade' });
    await expect(dica).toBeVisible();
    await page.getByLabel('Comissão ou espaço').fill('Comissão de Turismo');
    await page.getByRole('button', { name: 'Registrar espaço' }).click();
    await expect(dica).toBeVisible();
    await page.getByRole('button', { name: 'Registrar Comissão de Educação' }).click();
    await expect(dica).toHaveCount(0);
  });

  test('sem bandeira prioritária não há dica nem alerta', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await page.getByLabel('Comissão ou espaço').fill('Comissão de Turismo');
    await page.getByRole('button', { name: 'Registrar espaço' }).click();
    await expect(page.locator('.apoio')).toHaveCount(0);
    await expect(page.locator('.rm-alerta')).toHaveCount(0);
  });
});

test.describe('Registros antigos (RUM-51.9, RUM-70)', () => {
  test('registro sem papel abre sem erro, mostra o cargo antigo, o alerta e pode ser removido', async ({ page }) => {
    await abre(page, [ILHA], {
      campos: EDUCACAO, mandato: MANDATO,
      D: { comissoesDesejadas: [{ id: 'a', comissao: 'Comissão de Educação', cargo: 'titular', bandeira: 'Educação' }, { id: 'b', comissao: 'Comissão de Turismo', cargo: 'suplente' }] },
    });
    await expect(page.locator('.rm-reg li')).toHaveCount(2);
    await expect(page.locator('[data-espaco="0"]')).toContainText('titular · Educação');
    await expect(page.locator('[data-espaco="1"]')).toContainText('Este espaço não conversa');
    await expect(page.locator('[data-espaco="0"] .rm-alerta')).toHaveCount(0);
    await page.getByRole('button', { name: 'Remover Comissão de Turismo' }).click();
    expect(await registros(page)).toEqual([{ id: 'a', comissao: 'Comissão de Educação', cargo: 'titular', bandeira: 'Educação' }]);
  });

  test('registro corrompido (sem nome) não derruba a ilha', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO, D: { comissoesDesejadas: [{ id: 'x' }] } });
    await expect(page.locator('.rm-reg li')).toContainText('Espaço sem nome');
  });
});
