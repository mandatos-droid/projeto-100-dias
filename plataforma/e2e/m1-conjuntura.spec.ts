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
    await depoisDosDados(page, 'agendas-sociais', 'm1.q8a');
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

test.describe('Conjuntura · relações com os parlamentares (LEG-01, LEG-02, LEG-03, LEG-07 a LEG-10, LEG-12)', () => {
  const linhas = (page: Page) => page.locator('[data-ilha="assentos"] table.tb tbody tr');
  const CATS = ['Aliado', 'Aliado, mas concorrente', 'Oponente', 'Oponente e concorrente', 'Indefinida'];

  test('sem cartograma de UFs; seletor de escopo e abas com os nomes novos; 5 botões de categoria', async ({ page, request }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await abreGuia(page, '#/m/1/m1.conjuntura', { mandato: MANDATO });
    const ilha = page.locator('[data-ilha="assentos"]');
    await expect.poll(() => linhas(page).count(), { timeout: 30_000 }).toBe(15);
    await expect(ilha.locator('.mapa-br')).toHaveCount(0);
    await expect(ilha.getByLabel('Território')).toBeVisible();
    await expect(ilha.getByLabel('Território').locator('option').first()).toHaveText('Brasil inteiro');
    // abas com a contagem de cada Casa em SP (contada nos dados do TSE: 94 deputados estaduais, 70 federais, 3 senadores)
    const eleitos = (await (await request.get('/data/eleitos.json')).json()) as { k: string; uf: string }[];
    const n = (k: string) => eleitos.filter((e) => e.k === k && e.uf === 'SP').length.toLocaleString('pt-BR');
    await expect(ilha.getByRole('tab', { name: new RegExp(String.raw`^Assembleia Legislativa\s*${n('e')}$`) })).toBeVisible();
    await expect(ilha.getByRole('tab', { name: new RegExp(String.raw`^Câmara dos Deputados\s*${n('f')}$`) })).toBeVisible();
    await expect(ilha.getByRole('tab', { name: new RegExp(String.raw`^Senado\s*${n('s')}$`) })).toBeVisible();
    await expect(ilha.getByRole('img', { name: `Hemiciclo com ${n('e')} cadeiras` })).toBeVisible();
    const botoes = linhas(page).first().locator('.st button');
    await expect(botoes).toHaveCount(5);
    for (let i = 0; i < 5; i++) await expect(botoes.nth(i)).toHaveText(CATS[i]);
  });

  test('os grandes números e os gráficos de gênero, cor ou raça e mandato ficam logo abaixo dos filtros (LEG-06)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await abreGuia(page, '#/m/1/m1.conjuntura', { mandato: MANDATO });
    const ilha = page.locator('[data-ilha="assentos"]');
    await expect.poll(() => linhas(page).count(), { timeout: 30_000 }).toBe(15);
    const caixa = async (seletor: string) => (await ilha.locator(seletor).first().boundingBox())!;
    const filtros = await caixa('.barra-f'), kpis = await caixa('.kpis'), perfil = await caixa('.perfil'), hemi = await caixa('svg.hemi');
    expect(kpis.y).toBeGreaterThanOrEqual(filtros.y + filtros.height - 1); // abaixo dos filtros
    expect(kpis.y - (filtros.y + filtros.height)).toBeLessThan(120); // e logo abaixo
    expect(perfil.y).toBeGreaterThanOrEqual(kpis.y + kpis.height - 1);
    expect(hemi.y).toBeGreaterThanOrEqual(perfil.y + perfil.height - 1); // antes do hemiciclo e da tabela
    for (const t of ['Gênero', 'Cor ou raça', 'Mandato']) await expect(ilha.locator('.perfil')).toContainText(t);
    await expect(ilha.locator('.kpis')).toContainText('parlamentares eleitos');
  });

  test('"Brasil inteiro" mantém a tabela de eleitos em 15 linhas por página', async ({ page, request }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await abreGuia(page, '#/m/1/m1.conjuntura', { mandato: MANDATO });
    const ilha = page.locator('[data-ilha="assentos"]');
    await expect.poll(() => linhas(page).count(), { timeout: 30_000 }).toBe(15);
    await ilha.getByLabel('Território').selectOption('BR');
    const eleitos = (await (await request.get('/data/eleitos.json')).json()) as { k: string }[];
    const paginas = Math.ceil(eleitos.filter((e) => e.k === 'e').length / 15);
    await expect(page.getByText(`Página 1 de ${paginas}`)).toBeVisible();
    await expect(linhas(page)).toHaveCount(15);
    await page.getByRole('button', { name: /Próxima/ }).click();
    await expect(page.getByText(`Página 2 de ${paginas}`)).toBeVisible();
    await expect(linhas(page)).toHaveCount(15);
  });

  test('o seletor de escopo grava D.escopoSel; no DF a aba se chama Câmara Legislativa', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.conjuntura', { mandato: MANDATO });
    const ilha = page.locator('[data-ilha="assentos"]');
    await expect.poll(() => linhas(page).count(), { timeout: 30_000 }).toBe(15);
    await ilha.getByLabel('Território').selectOption('DF');
    await expect(ilha.getByRole('tab', { name: /^Câmara Legislativa/ })).toBeVisible();
    await expect.poll(async () => ((await salvoDe(page)).dados as { escopoSel?: string }).escopoSel).toBe('DF');
  });

  test('a linha da própria liderança tem o selo "Esta liderança" e não tem botões de classificação', async ({ page, request }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const todos = (await (await request.get('/data/eleitos.json')).json()) as { s: string; k: string; uf: string; v: number; u: string }[];
    const meu = todos.filter((e) => e.k === 'e' && e.uf === 'SP').sort((x, y) => y.v - x.v)[0];
    await abreGuia(page, '#/m/1/m1.conjuntura', { mandato: MANDATO, dados: { tse: { sq: meu.s } } });
    await expect.poll(() => linhas(page).count(), { timeout: 30_000 }).toBe(15);
    const minha = linhas(page).first();
    await expect(minha).toContainText(meu.u);
    await expect(minha).toContainText('Esta liderança');
    await expect(minha.locator('.st button')).toHaveCount(0);
    await expect(linhas(page).nth(1).locator('.st button')).toHaveCount(5);
  });

  test('classificar 3 parlamentares, filtrar o carrossel e ver o resumo na aba Resumo', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await abreGuia(page, '#/m/1/m1.conjuntura', { mandato: MANDATO });
    await expect.poll(() => linhas(page).count(), { timeout: 30_000 }).toBe(15);
    const marca = (i: number, cat: string) => linhas(page).nth(i).getByRole('button', { name: cat, exact: true }).click();
    await expect(page.getByTestId('classificados-vazio')).toBeVisible();
    await marca(0, 'Aliado');
    await marca(1, 'Aliado');
    await marca(2, 'Oponente e concorrente');
    const car = page.getByTestId('classificados');
    await expect(car.locator('article')).toHaveCount(3);
    await expect(car.getByRole('button', { name: /^Todas/ })).toContainText('3');
    await expect(car.getByRole('button', { name: /^Aliado\s*2/ })).toBeVisible();
    await expect(car.getByRole('button', { name: /^Oponente e concorrente\s*1/ })).toBeVisible();
    await expect(car.getByText('Slide 1 de 1')).toBeVisible();
    await car.getByRole('button', { name: /^Aliado\s*2/ }).click();
    await expect(car.locator('article')).toHaveCount(2);
    // reclassificar pelo cartão atualiza cartões e contagens na hora
    await car.locator('article').first().getByRole('combobox').selectOption({ label: 'Indefinida' });
    await expect(car.locator('article')).toHaveCount(1);
    await expect(car.getByRole('button', { name: /^Indefinida\s*1/ })).toBeVisible();
    // remover
    await car.locator('article').first().getByRole('button', { name: /Remover classificação/ }).click();
    await expect(car.getByRole('button', { name: /^Todas/ })).toContainText('2');
    await page.evaluate(() => { location.hash = '#/resumo'; });
    await expect(page.locator('#tela')).toContainText('Você tem 1 Oponente e concorrente; 1 Indefinida', { timeout: 20_000 });
  });

  test('ao trocar o filtro do carrossel, ele volta ao primeiro slide (LEG-09)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await abreGuia(page, '#/m/1/m1.conjuntura', { mandato: MANDATO });
    await expect.poll(() => linhas(page).count(), { timeout: 30_000 }).toBe(15);
    const marca = (i: number, cat: string) => linhas(page).nth(i).getByRole('button', { name: cat, exact: true }).click();
    for (let i = 0; i < 3; i++) await marca(i, 'Aliado');
    await marca(3, 'Oponente e concorrente');
    const car = page.getByTestId('classificados');
    await expect(car.getByText('Slide 1 de 2')).toBeVisible();
    await car.getByRole('button', { name: /^Próximo/ }).click();
    await expect(car.getByText('Slide 2 de 2')).toBeVisible();
    await car.getByRole('button', { name: /^Oponente e concorrente\s*1/ }).click();
    await expect(car.getByText('Slide 1 de 1')).toBeVisible();
    await car.getByRole('button', { name: /^Todas/ }).click();
    await expect(car.getByText('Slide 1 de 2')).toBeVisible();
  });

  for (const largura of [1280, 390]) {
    test(`mais de 12 classificados: o carrossel segue navegável sem rolagem horizontal da página (${largura}px)`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      await abreGuia(page, '#/m/1/m1.conjuntura', { mandato: MANDATO });
      await expect.poll(() => linhas(page).count(), { timeout: 30_000 }).toBe(15);
      for (let i = 0; i < 13; i++) await linhas(page).nth(i).getByRole('button', { name: 'Aliado', exact: true }).click();
      const car = page.getByTestId('classificados');
      await expect(car.getByRole('button', { name: /^Todas/ })).toContainText('13');
      await expect(car.getByText('Slide 1 de 5')).toBeVisible(); // 3 cartões por slide
      const semRolagem = () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      expect(await semRolagem()).toBe(true);
      for (let n = 2; n <= 5; n++) {
        await car.getByRole('button', { name: /^Próximo/ }).click();
        await expect(car.getByText(`Slide ${n} de 5`)).toBeVisible();
        expect(await semRolagem()).toBe(true);
      }
      await expect(car.getByRole('button', { name: /^Próximo/ })).toBeDisabled();
      await expect(car.locator('article')).toHaveCount(1); // o último slide leva só o 13º
    });
  }
});

test.describe('Abas sem barra de rolagem vertical (UI-01)', () => {
  const semRolagemVertical = async (page: Page, seletor: string) => {
    const abas = page.locator(seletor);
    await expect(abas.first()).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(3000); // deixa as ilhas montarem as abas que chegam depois
    const dados = await abas.evaluateAll((els) => els.map((el) => ({
      overflowY: getComputedStyle(el).overflowY, sobra: el.scrollHeight - el.clientHeight,
    })));
    expect(dados.length).toBeGreaterThan(0);
    for (const d of dados) {
      expect(d.overflowY).toBe('hidden');
      // 1px é a margem negativa do botão sobre a borda da aba (legacy.css); mais que isso seria conteúdo escondido
      expect(d.sobra).toBeLessThanOrEqual(1);
    }
  };

  test('todas as .abas da Conjuntura (Casas legislativas, escopo do perfil) não rolam na vertical', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await abreGuia(page, '#/m/1/m1.conjuntura', { mandato: MANDATO });
    await semRolagemVertical(page, '#tela .abas');
  });
});

test.describe('Conjuntura · cargo no gênero da pessoa eleita (PAR-01)', () => {
  const abreMG = async (page: Page) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await abreGuia(page, '#/m/1/m1.conjuntura', { mandato: MANDATO, dados: { escopoSel: 'MG', casaSel: 'estadual' } });
    const ilha = page.locator('[data-ilha="assentos"]');
    await expect(ilha.locator('table.tb tbody tr').first()).toBeVisible({ timeout: 30_000 });
    return ilha;
  };
  const escolhe = async (page: Page, nome: string) => {
    const ilha = page.locator('[data-ilha="assentos"]');
    await ilha.getByLabel('Buscar nesta lista').fill(nome);
    await ilha.locator('table.tb tbody tr', { hasText: nome }).first().click();
    return ilha.locator('.ficha-sel');
  };

  test('Marli Ribeiro e Delegada Sheila aparecem como Deputada Estadual', async ({ page }) => {
    await abreMG(page);
    for (const nome of ['Marli Ribeiro', 'Delegada Sheila']) {
      const ficha = await escolhe(page, nome);
      await expect(ficha).toContainText('Deputada Estadual · MG');
    }
  });

  test('um deputado continua como Deputado Estadual', async ({ page }) => {
    await abreMG(page);
    const ficha = await escolhe(page, 'Bruno Engler');
    await expect(ficha).toContainText('Deputado Estadual · MG');
    await expect(ficha).not.toContainText('Deputada');
  });

  test('o cargo gravado ao classificar uma deputada já sai no feminino no cartão do carrossel', async ({ page }) => {
    const ilha = await abreMG(page);
    await escolhe(page, 'Marli Ribeiro');
    await ilha.locator('table.tb tbody tr', { hasText: 'MARLI RIBEIRO' }).getByRole('button', { name: 'Aliado', exact: true }).click();
    await expect(page.getByTestId('classificados').locator('article')).toContainText('Deputada Estadual · MG');
  });
});

test.describe('Conjuntura · cartão de parlamentar com relação única (PAR-02)', () => {
  const CATS = ['Aliado', 'Aliado, mas concorrente', 'Oponente', 'Oponente e concorrente', 'Indefinida'];
  test('o cartão mostra a relação uma vez, troca por select com as 5 categorias e grava no mesmo campo', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await abreGuia(page, '#/m/1/m1.conjuntura', { mandato: MANDATO });
    const linhas = page.locator('[data-ilha="assentos"] table.tb tbody tr');
    await expect.poll(() => linhas.count(), { timeout: 30_000 }).toBe(15);
    await linhas.nth(0).getByRole('button', { name: 'Aliado', exact: true }).click();
    await linhas.nth(1).getByRole('button', { name: 'Oponente', exact: true }).click();
    const car = page.getByTestId('classificados');
    const cartao = car.locator('article').first();
    // sem os 5 botões de relação; só o select e "Remover classificação"
    await expect(cartao.locator('.st')).toHaveCount(0);
    await expect(cartao.getByRole('button', { name: /^(Aliado|Oponente|Indefinida)/ })).toHaveCount(0);
    await expect(cartao.getByRole('button', { name: /Remover classificação/ })).toBeVisible();
    // a relação atual aparece uma única vez como texto do cartão
    await expect(cartao.locator('.cartao-class-cat')).toHaveCount(1);
    await expect(cartao.locator('.cartao-class-cat')).toHaveText(/Aliado/);
    const troca = cartao.getByRole('combobox');
    await expect(troca.locator('option')).toHaveText(CATS);
    await expect(troca).toHaveValue('aliado');
    await troca.selectOption('aliado_concorrente');
    // grava no mesmo campo de hoje (D.relacoes[sq].status) e as contagens do filtro acompanham
    await expect.poll(async () => Object.values(((await salvoDe(page)).dados as { relacoes?: Record<string, { status: string }> }).relacoes ?? {}).map((r) => r.status).sort())
      .toEqual(['aliado_concorrente', 'concorrente']);
    await expect(car.getByRole('button', { name: /^Todas/ })).toContainText('2');
    await expect(car.getByRole('button', { name: /^Aliado, mas concorrente\s*1/ })).toBeVisible();
    await expect(car.getByRole('button', { name: /^Aliado\s*0/ })).toBeVisible();
    // "Remover classificação" continua funcionando
    await car.locator('article').filter({ has: page.getByRole('combobox') }).first().getByRole('button', { name: /Remover classificação/ }).click();
    await expect(car.getByRole('button', { name: /^Todas/ })).toContainText('1');
  });
});

test.describe('Botão do menu não cobre o cabeçalho (PAR-03)', () => {
  test('com o menu recolhido a 1280px, o botão e a 1ª aba da Conjuntura não se sobrepõem', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await abreGuia(page, '#/m/1/m1.conjuntura', { mandato: MANDATO });
    const botao = page.locator('.lado-alterna');
    await expect(botao).toBeVisible({ timeout: 30_000 });
    await botao.click();
    await expect(page.locator('body')).toHaveClass(/lado-fechado/);
    const aba = page.locator('#tela .abas button').first();
    await expect(aba).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(500); // a transição do menu dura .25s
    const b = await botao.boundingBox();
    const a = await aba.boundingBox();
    expect(b && a).toBeTruthy();
    // PAR-03: a caixa da aba começa à direita da borda direita do botão
    expect(a!.x).toBeGreaterThanOrEqual(b!.x + b!.width);
  });
});
