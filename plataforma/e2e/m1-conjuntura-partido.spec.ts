import { test, expect, type Page } from '@playwright/test';
import { abreGuia, salvoDe, MANDATO_REAL } from './guia-real';

/* Missão 1 · Conjuntura, pergunta 2.2 (PAR-01 a PAR-05, PAR-08, PAR-09, PAR-11 a PAR-14): sem mapa, 5 cartões de
   município, 2 reações a dados do partido e o texto final com a caixa m1.q6. */
const MANDATO = { ...MANDATO_REAL, partido: 'PSOL' };
const TSE = { sq: '250002536851', casa: 'estadual', uf: 'SP', nome: 'EDUARDO SUPLICY', partido: 'PSOL', cargo: 'Deputado Estadual', votos: 654627, situacao: 'Eleito por QP', vagas: 94 };
// códigos IBGE de municípios de SP, o primeiro com mais votos
const MUN = { atualizado: '2026-10-05', mun: { 3500105: [900, 10000], 3500204: [4000, 20000], 3500303: [3000, 6000], 3500402: [1500, 30000], 3500501: [2500, 5000], 3500550: [100, 1000] } };
const editor = (page: Page, k: string) => page.locator(`.campo:has(textarea[data-k="${k}"]) .rico-area`);
const dadosDe = async (page: Page) => (await salvoDe(page)).dados as { conj2?: { reacoes?: { dado: string; valor: string; texto: string }[]; prefExtra?: Record<string, string> } };

async function abre(page: Page, dados: Record<string, unknown> = { tse: TSE }, votos: unknown = MUN, mandato: Record<string, string> = MANDATO) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.route('**/api/votos-mun**', (r) => r.fulfill({ json: votos }));
  await abreGuia(page, '#/m/1/m1.conjuntura', { mandato, dados });
  await expect(page.locator('[data-ilha="calor"]')).toContainText('Placar do partido', { timeout: 30_000 });
}

test.describe('Conjuntura do partido · sem mapa, com cartões (PAR-02 a PAR-05, PAR-14)', () => {
  test('sem mapa nem painel, e o Placar do partido em cartões com borda', async ({ page }) => {
    await abre(page);
    const ilha = page.locator('[data-ilha="calor"]');
    await expect(ilha.locator('svg.mapa-mun, .ilha-lado, .v2-det')).toHaveCount(0);
    await expect(ilha.getByRole('tab', { name: '% de votos' })).toHaveCount(0);
    await expect(ilha.getByRole('tab', { name: 'Minhas marcações' })).toHaveCount(0);
    const cartao = ilha.locator('.v2-grande').first();
    await expect(cartao).toBeVisible();
    expect(await cartao.evaluate((e) => parseFloat(getComputedStyle(e).borderTopWidth))).toBeGreaterThan(0);
    // PAR-02: os 5 indicadores, cada um num cartão com borda
    const cartoesPlacar = ilha.locator('.v2-grandes').first().locator('.v2-grande');
    await expect(cartoesPlacar).toHaveCount(5);
    await expect(cartoesPlacar.locator('.rot')).toHaveText([/^Parlamentares/, 'Vereadores (2024)', 'Prefeituras (2024)', 'Filiados', 'Posição nos Executivos']);
    for (let i = 0; i < 5; i++) {
      expect(await cartoesPlacar.nth(i).evaluate((e) => parseFloat(getComputedStyle(e).borderTopWidth))).toBeGreaterThan(0);
    }
    for (let i = 0; i < 4; i++) await expect(cartoesPlacar.nth(i).locator('b')).toHaveText([/^\d{1,3}(\.\d{3})*$/, /^\d{1,3}(\.\d{3})*$/]); // Brasil e UF
    await expect(cartoesPlacar.nth(4).locator('li strong').first()).toBeVisible(); // posição em cada Executivo
    await expect(cartoesPlacar.nth(4).locator('li span')).toHaveText(['Presidência', 'Governo SP']); // CJ-03: sem a linha Prefeitura
    await expect(cartoesPlacar.nth(4)).not.toContainText(/Prefeitura/);
  });

  test('5 cartões de município, cada um com Placar, Força e Executivo', async ({ page }) => {
    await abre(page);
    const cartoes = page.getByTestId('cartao-municipio');
    await expect(cartoes).toHaveCount(5, { timeout: 30_000 });
    for (let i = 0; i < 5; i++) {
      const c = cartoes.nth(i);
      await expect(c.getByRole('heading', { name: 'Placar' })).toBeVisible();
      await expect(c.getByRole('heading', { name: 'Força' })).toBeVisible();
      await expect(c.getByRole('heading', { name: 'Executivo' })).toBeVisible();
      await expect(c.getByText('Vereadores no município')).toBeVisible();
      await expect(c.getByText('Filiados do PSOL')).toBeVisible();
      await expect(c.getByRole('radio')).toHaveText([/^Partido do governo/, /^Base aliada/, /^Oposição/, /^Independente/]);
    }
    await expect(cartoes.first().locator('.mv5-pos')).toHaveText('1º');
    await expect(cartoes.first()).toContainText('4.000 votos');
  });

  test('Placar e Força de um município trazem os valores dos arquivos do TSE (PAR-05, PAR-06)', async ({ page }) => {
    // Campinas (3509502): 33 vereadores, 2 do PSOL, 1.498 filiados do PSOL; prefeito eleito em 2024 Dário Saadi (REPUBLICANOS);
    // PSOL teve 88.745 de 589.932 votos válidos para deputado estadual (15,04%) e 8,97% no estado de SP.
    // Franca (3516200) fica sem posição gravada.
    await abre(page, { tse: TSE, conj2: { prefExtra: { 3509502: 'oposicao' } } }, { atualizado: '2026-10-05', mun: { 3509502: [9000, 20000], 3516200: [800, 9000] } });
    const campinas = page.getByTestId('cartao-municipio').filter({ hasText: 'Campinas' });
    await expect(campinas).toBeVisible({ timeout: 30_000 });
    const placar = campinas.getByRole('group', { name: /^Placar de/ });
    const valor = (grupo: typeof placar, rotulo: string) => grupo.locator('div', { has: page.locator(`dt:text-is("${rotulo}")`) }).locator('dd').first();
    await expect(valor(placar, 'Vereadores no município')).toHaveText('33');
    await expect(valor(placar, 'Vereadores do PSOL')).toHaveText('2');
    await expect(valor(placar, 'Filiados do PSOL')).toHaveText('1.498');
    await expect(valor(placar, 'Posição do PSOL diante do Executivo')).toHaveText('Oposição');
    await expect(placar.locator(':scope > .casa-pref strong')).toHaveText('Dário Saadi');
    await expect(placar.locator(':scope > .casa-pref')).toContainText('REPUBLICANOS');
    await expect(placar.locator(':scope > .casa-pref .foto img')).toHaveAttribute('src', /250001918263/);
    const forca = campinas.getByRole('group', { name: /^Força de/ });
    await expect(valor(forca, 'Votos do PSOL em Campinas')).toHaveText('15,04%');
    await expect(valor(forca, 'Votos do PSOL em São Paulo')).toHaveText('8,97%');
    // Franca: 15 vereadores, 1 do PSOL, 335 filiados; sem posição gravada, aparece "Não informada"
    const franca = page.getByTestId('cartao-municipio').filter({ hasText: 'Franca' });
    const placarFranca = franca.getByRole('group', { name: /^Placar de/ });
    await expect(valor(placarFranca, 'Vereadores no município')).toHaveText('15');
    await expect(valor(placarFranca, 'Vereadores do PSOL')).toHaveText('1');
    await expect(valor(placarFranca, 'Filiados do PSOL')).toHaveText('335');
    await expect(valor(placarFranca, 'Posição do PSOL diante do Executivo')).toHaveText('Não informada');
    await expect(placarFranca.locator(':scope > .casa-pref strong')).toHaveText('Alexandre Ferreira');
    await expect(valor(franca.getByRole('group', { name: /^Força de/ }), 'Votos do PSOL em Franca')).toHaveText('5,23%');
  });

  test('a posição do Executivo no cartão grava em D.conj2', async ({ page }) => {
    await abre(page);
    const c = page.getByTestId('cartao-municipio').first();
    await c.getByRole('radio', { name: 'Oposição' }).click();
    await expect(c.getByRole('radio', { name: 'Oposição' })).toHaveAttribute('aria-checked', 'true');
    await expect.poll(async () => Object.values((await dadosDe(page)).conj2?.prefExtra ?? {})).toContain('oposicao');
  });

  test('sem votação 2026 mas com domicílio: um cartão só do município, e a posição grava em posicao.pref (PAR-07, PAR-08)', async ({ page }) => {
    await abre(page, {}, MUN, { ...MANDATO, municipio: '3509502' });
    const cartoes = page.getByTestId('cartao-municipio');
    await expect(cartoes).toHaveCount(1, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Município da liderança' })).toBeVisible();
    await expect(cartoes.first()).toContainText('Campinas');
    await expect(cartoes.first().locator('.mv5-pos')).toHaveCount(0); // sem ranking de votos
    await expect(page.locator('[data-ilha="calor"]')).not.toContainText('Informe o município de domicílio');
    await expect(cartoes.first().getByRole('radio')).toHaveText([/^Partido do governo/, /^Base aliada/, /^Oposição/, /^Independente/]);
    await cartoes.first().getByRole('radio', { name: /^Base aliada/ }).click();
    await expect.poll(async () => ((await salvoDe(page)).dados as { conj2?: { posicao?: { pref?: string } } }).conj2?.posicao?.pref).toBe('base');
  });

  test('sem votação 2026 e sem domicílio: mensagem de PAR-08, sem cartões', async ({ page }) => {
    await abre(page, {});
    await expect(page.locator('[data-ilha="calor"]')).toContainText('Informe o município de domicílio em Dados do mandato');
    await expect(page.getByTestId('cartao-municipio')).toHaveCount(0);
  });
});

test.describe('Conjuntura do partido · reação a 2 dados (PAR-09 a PAR-12)', () => {
  test('escolher 2 dados completa as frases e grava; não há 3ª linha', async ({ page }) => {
    await abre(page);
    await expect(page.getByTestId('cartao-municipio')).toHaveCount(5, { timeout: 30_000 });
    const sel0 = page.locator('#rea-sel-0'), sel1 = page.locator('#rea-sel-1');
    await expect(sel0.locator('option', { hasText: 'Filiados do partido' }).first()).toBeAttached();
    await expect(page.locator('.rea textarea')).toHaveCount(0); // a caixa só abre depois da escolha
    await sel0.selectOption('filiados');
    const caixa0 = page.locator('.rea-linha').nth(0).locator('textarea');
    await expect(page.locator('.rea-linha').nth(0)).toContainText('Considerando Filiados do partido:');
    await expect(page.locator('.rea-linha').nth(0)).toContainText(', o mandato deve');
    await caixa0.fill('ampliar a filiação no interior');
    await sel1.selectOption('parlamentares');
    await page.locator('.rea-linha').nth(1).locator('textarea').fill('buscar a presidência da bancada');
    await expect.poll(async () => (await dadosDe(page)).conj2?.reacoes?.length).toBe(2);
    const r = (await dadosDe(page)).conj2!.reacoes!;
    expect(r[0]).toMatchObject({ dado: 'filiados', texto: 'ampliar a filiação no interior' });
    expect(r[1]).toMatchObject({ dado: 'parlamentares', texto: 'buscar a presidência da bancada' });
    expect(r[0].valor).toMatch(/no estado, .* no Brasil/);
    await expect(page.locator('.rea-linha')).toHaveCount(2);
  });

  test('os dados do seletor batem com o número mostrado no Placar', async ({ page }) => {
    await abre(page);
    const lePlacar = () => page.locator('.v2-grande').filter({ hasText: 'Filiados' }).first().locator('b').allTextContents();
    await expect.poll(async () => (await lePlacar())[1]).not.toBe('0'); // espera os filiados carregarem
    await page.locator('#rea-sel-0').selectOption('filiados');
    await expect.poll(async () => { const p = await lePlacar(); return p[1] === '0' ? null : (await dadosDe(page)).conj2?.reacoes?.[0]?.valor === `${p[1]} no estado, ${p[0]} no Brasil`; }).toBe(true);
  });
});

test.describe('Conjuntura do partido · fim da página (PAR-01, PAR-09, PAR-13)', () => {
  test('textos de PAR-09 e a caixa m1.q6 vêm depois dos cartões e das reações', async ({ page }) => {
    await abre(page);
    await expect(page.getByTestId('cartao-municipio')).toHaveCount(5, { timeout: 30_000 });
    await expect(page.getByText('Identifique que tipo de relação com o partido a liderança parlamentar deseja ter')).toBeVisible();
    await expect(page.getByText('Selecione 2 dados e registre como a liderança parlamentar deseja que o mandato reaja a eles.')).toBeVisible();
    await expect(page.getByText('Registre quais são os principais atores políticos do entorno da liderança parlamentar.')).toBeVisible();
    await expect(page.locator('#tela')).not.toContainText('Qual é a conjuntura política do seu estado ou município de origem?');
    const rea = await page.locator('.rea').boundingBox();
    const q6 = await editor(page, 'm1.q6').boundingBox();
    expect(rea && q6 && q6.y > rea.y).toBeTruthy();
    await editor(page, 'm1.q6').click();
    await page.keyboard.type('Prefeito da capital');
    await expect.poll(async () => ((await salvoDe(page)).dados as { campos?: Record<string, string> }).campos?.['m1.q6']).toContain('Prefeito da capital');
  });

  test('valores antigos de conj2 seguem gravados (PAR-14)', async ({ page }) => {
    const CONJ2 = { muns: { 3500105: { tag: 'base', nota: 'x' } }, posicao: {}, relacao: 'lideranca', relacaoPq: 'quer', desafios: ['Poucos filiados'], oportunidades: ['Eleição'] };
    await abre(page, { tse: TSE, conj2: CONJ2 });
    await page.locator('#rea-sel-0').selectOption('vereadores');
    await expect.poll(async () => (await dadosDe(page)).conj2?.reacoes?.length).toBe(1);
    const c = (await dadosDe(page)).conj2 as Record<string, unknown>;
    expect(c.muns).toEqual(CONJ2.muns);
    expect(c.relacao).toBe('lideranca');
    expect(c.relacaoPq).toBe('quer');
    expect(c.desafios).toEqual(CONJ2.desafios);
    expect(c.oportunidades).toEqual(CONJ2.oportunidades);
  });
});
