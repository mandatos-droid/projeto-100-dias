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

  test('os cartões ficam no tópico de municípios, sem os botões de adicionar (CJ-02)', async ({ page }) => {
    await abre(page, { tse: TSE, conj2: { prefExtra: { 3550308: 'base' } } });
    const ilha = page.locator('[data-ilha="calor"]');
    await expect(page.getByTestId('cartao-municipio')).toHaveCount(5, { timeout: 30_000 });
    await expect(ilha.getByRole('button', { name: /Adicionar município/ })).toHaveCount(0);
    await expect(ilha.getByRole('button', { name: /Adicionar todos os municípios/ })).toHaveCount(0);
    await expect(ilha.locator('.v2-extras')).toHaveCount(0);
    // os cartões estão entre o tópico "Prefeituras que a liderança acompanha" e a seção 4 (filiados)
    const topico = await ilha.getByRole('heading', { name: 'Prefeituras que a liderança acompanha' }).boundingBox();
    const filiados = await ilha.getByRole('heading', { name: /Filiados: quem compõe a base do partido/ }).boundingBox();
    const primeiro = await page.getByTestId('cartao-municipio').first().boundingBox();
    const ultimo = await page.getByTestId('cartao-municipio').last().boundingBox();
    expect(topico && filiados && primeiro && ultimo).toBeTruthy();
    expect(primeiro!.y).toBeGreaterThan(topico!.y);
    expect(ultimo!.y).toBeLessThan(filiados!.y);
    // o dado antigo de uma prefeitura que não aparece mais continua gravado depois de editar a tela
    await page.getByTestId('cartao-municipio').first().getByRole('radio', { name: 'Oposição' }).click();
    await expect.poll(async () => (await dadosDe(page)).conj2?.prefExtra?.[3500204]).toBe('oposicao');
    expect((await dadosDe(page)).conj2?.prefExtra?.[3550308]).toBe('base');
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

const PLACAR_IDS = ['parlamentares', 'vereadores', 'prefeituras', 'filiados', 'executivos'];
const CDIS = ['3500204', '3500303', '3500501', '3500402', '3500105']; // os 5 mais votados de MUN, em ordem
const capturavel = (page: Page, id: string) => page.locator(`.capturable-data[data-dado-id="${id}"]`);
const banner = (page: Page) => page.locator('.rea-banner');
const iniciar = (page: Page) => page.getByRole('button', { name: 'Selecionar 2 dados na tela' }).click();

test.describe('Conjuntura do partido · dados capturáveis na página (SEL-01)', () => {
  test('todo dado que o seletor oferecia tem um elemento capturável, e só um, com nome e valor do que se vê', async ({ page }) => {
    await abre(page);
    await expect(page.getByTestId('cartao-municipio')).toHaveCount(5, { timeout: 30_000 });
    const ids = await page.locator('.capturable-data').evaluateAll((es) => es.map((e) => e.getAttribute('data-dado-id')!));
    expect(new Set(ids).size).toBe(ids.length); // sem repetição
    const esperados = [...PLACAR_IDS, ...CDIS.flatMap((c) => [`mun:${c}:vereadores`, `mun:${c}:filiados`])];
    for (const id of esperados) expect(ids).toContain(id);
    expect(ids.filter((i) => i.startsWith('mun:') && i.endsWith(':pct')).length).toBeGreaterThan(0);
    expect(ids.length).toBeLessThanOrEqual(PLACAR_IDS.length + CDIS.length * 3);
    for (const id of PLACAR_IDS) await expect(page.locator(`.v2-grande.capturable-data[data-dado-id="${id}"]`)).toHaveCount(1);
    for (const cdi of CDIS) { // cada cartão de município carrega os seus
      const el = capturavel(page, `mun:${cdi}:vereadores`);
      await expect(el).toHaveCount(1);
      await expect(el).toHaveText((await el.getAttribute('data-dado-valor'))!); // o número visível é o capturado
      expect(await el.getAttribute('data-dado-nome')).toMatch(/^Vereadores do partido em /);
      await expect(el.locator('xpath=ancestor::*[@data-testid="cartao-municipio"]')).toHaveCount(1);
    }
    const filiados = capturavel(page, 'filiados');
    const [br, uf] = await filiados.locator('b').allTextContents();
    await expect.poll(async () => filiados.getAttribute('data-dado-valor')).toBe(`${uf} no estado, ${br} no Brasil`);
  });
});

test.describe('Conjuntura do partido · reação a 2 dados (PAR-09 a PAR-12, SEL-01)', () => {
  test('o botão abre o banner, 2 cliques fecham e viram chips; as frases completam e gravam; não há 3ª linha', async ({ page }) => {
    await abre(page);
    await expect(page.getByTestId('cartao-municipio')).toHaveCount(5, { timeout: 30_000 });
    await expect(page.locator('.rea select')).toHaveCount(0); // sem os selects de Dado 1 e 2
    await expect(page.locator('.rea textarea')).toHaveCount(0); // a caixa só abre depois da escolha
    await expect(banner(page)).toHaveCount(0);
    await iniciar(page);
    await expect(banner(page)).toContainText('1º');
    await expect(banner(page).getByRole('button', { name: 'Cancelar' })).toBeVisible();
    await capturavel(page, 'filiados').click();
    await expect(banner(page)).toContainText('2º');
    await expect(capturavel(page, 'filiados')).toHaveAttribute('data-captura-tag', '1️⃣');
    expect((await dadosDe(page)).conj2?.reacoes ?? []).toHaveLength(0); // nada gravado pela metade
    await capturavel(page, 'parlamentares').click();
    await expect(banner(page)).toHaveCount(0);
    await expect(page.locator('[data-captura-tag]')).toHaveCount(0);
    await expect(page.locator('.rea-chip')).toHaveCount(2);
    await expect(page.locator('section.rea')).toBeInViewport(); // SEL-01: a página rolou de volta ao formulário
    await expect(page.locator('.rea-linha').nth(0)).toContainText('Considerando Filiados do partido:');
    await expect(page.locator('.rea-linha').nth(0)).toContainText(', o mandato deve');
    await page.locator('.rea-linha').nth(0).locator('textarea').fill('ampliar a filiação no interior');
    await page.locator('.rea-linha').nth(1).locator('textarea').fill('buscar a presidência da bancada');
    await expect.poll(async () => (await dadosDe(page)).conj2?.reacoes?.[1]?.texto).toBe('buscar a presidência da bancada');
    const r = (await dadosDe(page)).conj2!.reacoes!;
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ dado: 'filiados', texto: 'ampliar a filiação no interior' });
    expect(r[1]).toMatchObject({ dado: 'parlamentares', texto: 'buscar a presidência da bancada' });
    expect(r[0].valor).toMatch(/no estado, .* no Brasil/); // mesmo formato de antes
    expect(r[1].valor).toBeTruthy(); // a 2ª reação grava o valor do dado, não só o id
    expect(r[1].valor).toMatch(/^\d/);
    await expect(page.locator('.rea-linha')).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Selecionar 2 dados na tela' })).toBeDisabled(); // sem vaga: remova um chip
    await page.evaluate(() => { location.hash = '#/resumo'; }); // o Resumo lê o mesmo dado
    await expect(page.locator('#tela')).toContainText('Considerando Filiados do partido', { timeout: 20_000 });
    await expect(page.locator('#tela')).toContainText('ampliar a filiação no interior');
  });

  test('o dado gravado é o número que o Placar mostra', async ({ page }) => {
    await abre(page);
    const lePlacar = () => page.locator('.v2-grande').filter({ hasText: 'Filiados' }).first().locator('b').allTextContents();
    await expect.poll(async () => (await lePlacar())[1]).not.toBe('0'); // espera os filiados carregarem
    await iniciar(page);
    await capturavel(page, 'filiados').click();
    await capturavel(page, 'vereadores').click();
    await expect.poll(async () => { const p = await lePlacar(); return p[1] === '0' ? null : (await dadosDe(page)).conj2?.reacoes?.[0]?.valor === `${p[1]} no estado, ${p[0]} no Brasil`; }).toBe(true);
  });

  test('clicar duas vezes no mesmo dado avisa e segue esperando o 2º (AC4)', async ({ page }) => {
    await abre(page);
    await iniciar(page);
    await capturavel(page, 'filiados').click();
    await capturavel(page, 'filiados').click();
    await expect(banner(page)).toContainText('Escolha um indicador diferente.');
    await expect(page.locator('.rea-chip')).toHaveCount(0);
    await capturavel(page, 'vereadores').click();
    await expect(page.locator('.rea-chip')).toHaveCount(2);
  });

  test('Cancelar e Esc no meio fecham o banner sem gravar nada (AC5)', async ({ page }) => {
    await abre(page);
    await iniciar(page);
    await capturavel(page, 'filiados').click();
    await banner(page).getByRole('button', { name: 'Cancelar' }).click();
    await expect(banner(page)).toHaveCount(0);
    await iniciar(page);
    await capturavel(page, 'filiados').click();
    await page.keyboard.press('Escape');
    await expect(banner(page)).toHaveCount(0);
    await expect(page.locator('[data-captura-tag]')).toHaveCount(0);
    await expect(page.locator('.rea-chip')).toHaveCount(0);
    await page.waitForTimeout(600); // a gravação é com atraso: nada pode aparecer
    expect((await dadosDe(page)).conj2?.reacoes ?? []).toHaveLength(0);
    // fora do modo, clicar no dado não captura
    await capturavel(page, 'filiados').click();
    await expect(banner(page)).toHaveCount(0);
    await expect(page.locator('.rea-chip')).toHaveCount(0);
  });

  test('remover um chip limpa só aquele dado e permite escolher outro (AC3)', async ({ page }) => {
    await abre(page);
    await iniciar(page);
    await capturavel(page, 'filiados').click();
    await capturavel(page, 'parlamentares').click();
    await page.locator('.rea-linha').nth(1).locator('textarea').fill('texto do dado 2');
    await page.getByRole('button', { name: 'Remover o dado 1' }).click();
    await expect(page.locator('.rea-chip')).toHaveCount(1);
    await expect(page.locator('.rea-linha').nth(1)).toContainText('Parlamentares do partido');
    await expect(page.locator('.rea-linha').nth(1).locator('textarea')).toHaveValue('texto do dado 2');
    await iniciar(page);
    await expect(banner(page)).toContainText('1º'); // só falta o dado 1
    await capturavel(page, 'parlamentares').click(); // já está no dado 2: ignorado
    await expect(banner(page)).toContainText('Escolha um indicador diferente.');
    await capturavel(page, 'vereadores').click();
    await expect(banner(page)).toHaveCount(0);
    await expect(page.locator('.rea-linha').nth(0)).toContainText('Considerando Vereadores do partido:');
    await expect.poll(async () => (await dadosDe(page)).conj2?.reacoes?.map((x) => x.dado)).toEqual(['vereadores', 'parlamentares']);
  });

  test('o destaque dos dados só existe com o modo ativo (outline roxo)', async ({ page }) => {
    await abre(page);
    const el = capturavel(page, 'vereadores');
    const outline = () => el.evaluate((e) => getComputedStyle(e).outlineStyle);
    const cursor = () => el.evaluate((e) => getComputedStyle(e).cursor);
    expect(await outline()).toBe('none');
    expect(await cursor()).not.toBe('pointer');
    await iniciar(page);
    expect(await outline()).not.toBe('none');
    expect(await cursor()).toBe('pointer');
    await page.keyboard.press('Escape');
    await expect(banner(page)).toHaveCount(0);
    expect(await outline()).toBe('none');
  });

  test('o banner não cobre o botão da barra lateral no computador, aberta ou recolhida', async ({ page }) => {
    await abre(page);
    const sobrepoe = async () => {
      const b = await banner(page).boundingBox(), t = await page.locator('.lado-alterna').boundingBox();
      expect(b && t).toBeTruthy();
      return !(b!.x + b!.width <= t!.x || t!.x + t!.width <= b!.x || b!.y + b!.height <= t!.y || t!.y + t!.height <= b!.y);
    };
    await iniciar(page);
    expect(await sobrepoe()).toBe(false);
    await page.keyboard.press('Escape');
    await page.locator('.lado-alterna').click();
    await iniciar(page);
    expect(await sobrepoe()).toBe(false);
  });

  test('em 390px o banner não cobre o botão do menu móvel', async ({ page }) => {
    await abre(page);
    await page.setViewportSize({ width: 390, height: 800 });
    await iniciar(page);
    const b = await banner(page).boundingBox(), h = await page.locator('.topo-movel .ham').boundingBox();
    expect(b && h).toBeTruthy();
    expect(b!.y).toBeGreaterThanOrEqual(h!.y + h!.height); // o banner começa abaixo da faixa do menu
    await expect(page.locator('.topo-movel .ham')).toBeVisible();
    expect(b!.x + b!.width).toBeLessThanOrEqual(390);
  });

  test('durante a captura, botão dentro do dado conta como captura e não age', async ({ page }) => {
    await abre(page);
    await expect(page.getByTestId('cartao-municipio')).toHaveCount(5, { timeout: 30_000 });
    await iniciar(page);
    const dd = page.getByTestId('cartao-municipio').first().locator('.capturable-data').first();
    // um botão dentro do valor capturável: o clique vira captura e o botão não dispara
    await dd.evaluate((el) => {
      const w = window as unknown as { __b: number };
      w.__b = 0;
      const b = document.createElement('button');
      b.id = 'bt-teste'; b.textContent = 'x';
      b.addEventListener('click', () => { w.__b++; });
      el.appendChild(b);
    });
    await page.locator('#bt-teste').click();
    await expect(banner(page)).toContainText('2º');
    expect(await page.evaluate(() => (window as unknown as { __b: number }).__b)).toBe(0);
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
    await iniciar(page);
    await capturavel(page, 'vereadores').click();
    await capturavel(page, 'filiados').click();
    await expect.poll(async () => (await dadosDe(page)).conj2?.reacoes?.length).toBe(2);
    const c = (await dadosDe(page)).conj2 as Record<string, unknown>;
    expect(c.muns).toEqual(CONJ2.muns);
    expect(c.relacao).toBe('lideranca');
    expect(c.relacaoPq).toBe('quer');
    expect(c.desafios).toEqual(CONJ2.desafios);
    expect(c.oportunidades).toEqual(CONJ2.oportunidades);
  });
});
