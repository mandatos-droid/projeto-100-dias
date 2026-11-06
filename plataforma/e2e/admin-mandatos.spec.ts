import { test, expect, type Page } from '@playwright/test';
import { chamadasDeMandatos, mandato, moca, naoMapeadas, semeiaSessao, vazou, type EstadoMoca } from './admin-api';

/* Tela Mandatos do /admin (ADM-05, ADM-16). O Supabase é todo interceptado (admin-api.ts); as datas das fixtures são
   relativas a "agora" porque "parado há" conta dias de calendário em Brasília. */
const diasAtras = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const lista = (n: number, parcial: (i: number) => Partial<ReturnType<typeof mandato>> = () => ({})) =>
  Array.from({ length: n }, (_, i) => mandato({ id: `m${i + 1}`, codigo: `K${String(i + 1).padStart(3, '0')}`, ultima_atividade: diasAtras(1), ...parcial(i) }));

async function abre(page: Page, linhas: ReturnType<typeof mandato>[], extra: EstadoMoca = {}) {
  const estado: EstadoMoca = { views: { v_admin_mandatos: linhas }, ...extra };
  await semeiaSessao(page, 'admin');
  await moca(page, estado);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: /Mandatos/ })).toBeVisible();
  return estado;
}
const linhasDaTabela = (page: Page) => page.locator('tbody tr');

test.afterEach(() => {
  // nada pode ter saído da máquina nem ter trazido texto de gabinete (spec: Success Criteria)
  expect(naoMapeadas()).toEqual([]);
  expect(vazou()).toEqual([]);
});

test.describe('Mandatos: lista e paginação (ADM-05.1)', () => {
  test('25 por página, com colunas do wireframe e navegação entre páginas', async ({ page }) => {
    await abre(page, lista(60));
    await expect(page.getByRole('columnheader')).toHaveText(['Código', 'Parlamentar', 'Cargo', 'UF', 'Partido', 'Membros', 'Última atividade', '']);
    await expect(linhasDaTabela(page)).toHaveCount(25);
    await expect(page.getByText('1–25 de 60')).toBeVisible();
    await page.getByRole('button', { name: 'Próxima' }).click();
    await expect(linhasDaTabela(page)).toHaveCount(25);
    await expect(page.getByText('26–50 de 60')).toBeVisible();
    await page.getByRole('button', { name: 'Próxima' }).click();
    await expect(linhasDaTabela(page)).toHaveCount(10);
    await expect(page.getByRole('button', { name: 'Próxima' })).toBeDisabled();
    await page.getByRole('button', { name: 'Anterior' }).click();
    await expect(page.getByText('26–50 de 60')).toBeVisible();
  });

  test('com exatamente 25 mandatos não existe página seguinte', async ({ page }) => {
    await abre(page, lista(25));
    await expect(linhasDaTabela(page)).toHaveCount(25);
    await expect(page.getByRole('button', { name: 'Próxima' })).toHaveCount(0);
  });

  test('só pede a view v_admin_mandatos e não traz texto de gabinete (ADM-05.2)', async ({ page }) => {
    await abre(page, lista(3));
    const pedidos = chamadasDeMandatos();
    expect(pedidos.length).toBeGreaterThan(0);
    for (const p of pedidos) expect(p.caminho).toMatch(/^v_admin_mandatos\?/);
    expect(vazou()).toEqual([]);
  });
});

test.describe('Mandatos: busca e filtros (ADM-05.3, 05.4)', () => {
  const base = () => [
    mandato({ id: 'a', codigo: 'ABC234', nome_parlamentar: 'Márcia Ávila', uf: 'SP', casa: 'Assembleia Legislativa', ultima_atividade: diasAtras(1) }),
    mandato({ id: 'b', codigo: 'XYZ789', nome_parlamentar: 'João Nunes', uf: 'SP', casa: 'Câmara dos Deputados', ultima_atividade: diasAtras(1) }),
    mandato({ id: 'c', codigo: 'QWE456', nome_parlamentar: 'Helena Prado', uf: 'BA', casa: 'Assembleia Legislativa', ultima_atividade: diasAtras(1) }),
    mandato({ id: 'd', codigo: 'OLD001', nome_parlamentar: 'Otávio Reis', uf: 'PR', casa: 'Senado Federal', arquivado_em: diasAtras(5), ultima_atividade: diasAtras(1) }),
  ];

  test('busca sem diferenciar maiúsculas nem acentos, por nome ou código', async ({ page }) => {
    await abre(page, base());
    await expect(linhasDaTabela(page)).toHaveCount(3); // o arquivado fica de fora da lista padrão
    await page.getByLabel('Buscar mandato').fill('MARCIA avila');
    await expect(linhasDaTabela(page)).toHaveCount(1);
    await expect(linhasDaTabela(page).first()).toContainText('Márcia Ávila');
    await page.getByLabel('Buscar mandato').fill('xyz7');
    await expect(linhasDaTabela(page)).toHaveCount(1);
    await expect(linhasDaTabela(page).first()).toContainText('João Nunes');
  });

  test('UF, casa e busca combinam', async ({ page }) => {
    await abre(page, base());
    await page.getByLabel('UF').selectOption('SP');
    await expect(linhasDaTabela(page)).toHaveCount(2);
    await page.getByLabel('Casa').selectOption('Assembleia Legislativa');
    await expect(linhasDaTabela(page)).toHaveCount(1);
    await expect(linhasDaTabela(page).first()).toContainText('Márcia Ávila');
    await page.getByLabel('Buscar mandato').fill('joão');
    await expect(page.getByText('Nenhum mandato encontrado')).toBeVisible();
  });

  test('situação Arquivados mostra só os arquivados', async ({ page }) => {
    await abre(page, base());
    await page.getByLabel('Situação').selectOption('arquivados');
    await expect(linhasDaTabela(page)).toHaveCount(1);
    await expect(linhasDaTabela(page).first()).toContainText('Otávio Reis');
  });

  test('o botão Ver leva ao detalhe do mandato (ADM-05.6)', async ({ page }) => {
    await abre(page, base());
    const linha = linhasDaTabela(page).filter({ hasText: 'ABC234' });
    await expect(linha.getByRole('link', { name: 'Ver' })).toHaveAttribute('href', '/admin/mandatos/a');
  });
});

test.describe('Mandatos: parado há (ADM-05.5, 05.9)', () => {
  const fixture = () => [
    mandato({ id: 'h', codigo: 'HOJE01', nome_parlamentar: 'Recente', ultima_atividade: diasAtras(0) }),
    mandato({ id: 'p10', codigo: 'P10001', nome_parlamentar: 'Dez dias', ultima_atividade: diasAtras(10) }),
    mandato({ id: 'p20', codigo: 'P20001', nome_parlamentar: 'Vinte dias', ultima_atividade: diasAtras(20) }),
    mandato({ id: 'p35', codigo: 'P35001', nome_parlamentar: 'Trinta e cinco', ultima_atividade: diasAtras(35) }),
    mandato({ id: 'p50', codigo: 'P50001', nome_parlamentar: 'Cinquenta', ultima_atividade: diasAtras(50) }),
  ];

  test('a escala 7, 15, 30 e 45 muda a lista (mais de N dias)', async ({ page }) => {
    await abre(page, fixture());
    await expect(linhasDaTabela(page)).toHaveCount(5);
    const seletor = page.getByLabel('Parado há');
    await expect(seletor.locator('option')).toHaveText(['Parado há: qualquer', 'Parado há: 7 dias', 'Parado há: 15 dias', 'Parado há: 30 dias', 'Parado há: 45 dias']);
    for (const [n, esperado] of [['7', 4], ['15', 3], ['30', 2], ['45', 1]] as const) {
      await seletor.selectOption(n);
      await expect(linhasDaTabela(page)).toHaveCount(esperado);
    }
    await expect(linhasDaTabela(page).first()).toContainText('Cinquenta');
    await seletor.selectOption('');
    await expect(linhasDaTabela(page)).toHaveCount(5);
  });

  test('destaca "X dias parado" com os dias reais; o corte segue o seletor (padrão 45)', async ({ page }) => {
    await abre(page, fixture());
    await expect(page.getByText('50 dias parado')).toBeVisible();
    await expect(page.getByText('35 dias parado')).toHaveCount(0); // 35 não passa de 45
    await page.getByLabel('Parado há').selectOption('30');
    await expect(page.getByText('35 dias parado')).toBeVisible();
    await expect(page.getByText('50 dias parado')).toBeVisible();
    await expect(page.getByText('20 dias parado')).toHaveCount(0);
  });

  test('parado há combina com a busca', async ({ page }) => {
    await abre(page, fixture());
    await page.getByLabel('Parado há').selectOption('15');
    await page.getByLabel('Buscar mandato').fill('cinq');
    await expect(linhasDaTabela(page)).toHaveCount(1);
    await page.getByLabel('Buscar mandato').fill('dez');
    await expect(page.getByText('Nenhum mandato encontrado')).toBeVisible();
  });
});

test.describe('Mandatos: vazio, erro e celular', () => {
  test('sem resultado mostra "Nenhum mandato encontrado" e Limpar filtros restaura a lista (ADM-05.7)', async ({ page }) => {
    await abre(page, lista(4));
    await page.getByLabel('Buscar mandato').fill('zzzz');
    await expect(page.getByText('Nenhum mandato encontrado')).toBeVisible();
    await page.getByRole('button', { name: 'Limpar filtros' }).click();
    await expect(linhasDaTabela(page)).toHaveCount(4);
    await expect(page.getByLabel('Buscar mandato')).toHaveValue('');
  });

  test('erro de rede mostra "Tentar de novo" e a lista volta ao tentar', async ({ page }) => {
    const estado = await abre(page, lista(3), { rede: true });
    await expect(page.getByText('Não foi possível carregar.')).toBeVisible();
    estado.rede = false;
    await page.getByRole('button', { name: 'Tentar de novo' }).click();
    await expect(linhasDaTabela(page)).toHaveCount(3);
  });

  test('erro 5xx também mostra "Tentar de novo", sem tela em branco', async ({ page }) => {
    await abre(page, lista(3), { statusErro: 500 });
    await expect(page.getByText('Não foi possível carregar.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tentar de novo' })).toBeVisible();
  });

  test('em 360 px a página não rola na horizontal e os alvos de toque têm 40 px (ADM-16)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await abre(page, lista(30));
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra).toBeLessThanOrEqual(0);
    // a tabela rola dentro do próprio quadro
    const quadro = await page.locator('.rolagem').evaluate((e) => ({ rola: e.scrollWidth > e.clientWidth, overflow: getComputedStyle(e).overflowX }));
    expect(quadro).toEqual({ rola: true, overflow: 'auto' });
    const baixos = await page.locator('.adm button, .adm input, .adm select, .adm a.btn').evaluateAll((els) =>
      els.filter((e) => (e as HTMLElement).offsetParent !== null && e.getBoundingClientRect().height < 40).map((e) => e.outerHTML.slice(0, 80)));
    expect(baixos).toEqual([]);
  });
});
