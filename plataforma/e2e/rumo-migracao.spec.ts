import { test, expect, type Page } from '@playwright/test';
import { abreGuia, salvoDe, MANDATO_REAL } from './guia-real';
import { abre, EQUIPE, MANDATO } from './semente-rumo';

/* Mandato salvo antes da Missão 3 nova: só texto em m3.*, D.preditores e metas com pred, texto, resp e apoio (RUM-70). */
const CAMPOS_ANTIGOS: Record<string, string> = {
  'm3.mural': 'Educação; Saúde; Segurança no entorno das escolas',
  'm3.argumentos': 'Educação: muita demanda nas escolas. Saúde: filas longas.',
  'm3.criterios': 'Pesamos o impacto no território e a quantidade de apoiadores.',
  'm3.b1': 'Educação', 'm3.b2': 'Saúde',
  'm3.legado': 'Joaquim José: a educação no centro do debate',
  'm3.cargo': 'Senador(a)',
  'm3.obj.p1': 'Priorizar a educação', 'm3.obj.p2': 'Pautar o fim do trabalho infantil',
};
const METAS_ANTIGAS = [
  { id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos de lei sobre educação até dezembro de 2027', resp: 'Carla Dias', apoio: 'Davi Rocha e Bruno Lima' },
  { id: 'b', pred: 'p1', texto: '<b>Visitar</b> 10 escolas da rede estadual', resp: 'Bruno Lima', apoio: '' },
  { id: 'c', pred: 'p2', texto: 'Realizar 3 debates públicos sobre trabalho infantil', resp: 'Ana Souza', apoio: 'Carla Dias' },
];
const ANTIGO = { campos: { ...CAMPOS_ANTIGOS, ...EQUIPE }, preditores: ['p1', 'p2'], metas: METAS_ANTIGAS };
const campos = async (page: Page) => (await salvoDe(page)).dados.campos as Record<string, string>;
const metas = async (page: Page) => (await salvoDe(page)).dados.metas as Record<string, unknown>[];
/* o Guia salva com 700 ms de espera; forçar a gravação deixa o teste determinístico */
const esperaSalvo = async (page: Page) => { await page.evaluate(() => (window as unknown as { Store: { gravar(): Promise<void> } }).Store.gravar()); };

test.describe('Mandato antigo percorrido de ponta a ponta (RUM-70, critério de sucesso 3)', () => {
  test('abrir os exercícios e editar uma meta não faz sumir texto, meta nem preditor', async ({ page }) => {
    await abreGuia(page, '#/m/3/m3.bandeiras/1', { dados: ANTIGO });
    await expect(page.locator('.rm-chip[aria-pressed="true"]')).toHaveCount(3); // o mural antigo virou chips
    await expect(page.locator('.rm-antigo, .rm-recap').first()).toBeVisible();
    for (const h of ['#/m/3/m3.legado/1', '#/m/3/m3.preditores/1']) {
      await page.evaluate((x) => { location.hash = x; }, h);
      await expect(page.locator('.ilha-corpo').first()).toBeVisible();
    }
    await expect(page.getByLabel('Texto final da manchete')).toHaveCount(0);
    await expect(page.locator('[data-preditor="p1"] input')).toHaveValue('Priorizar a educação');
    await expect(page.locator('[data-preditor="p2"] input')).toHaveValue('Pautar o fim do trabalho infantil');
    await page.evaluate(() => { location.hash = '#/m/3/m3.metas/1'; });
    const meta1 = page.locator('[data-meta="0"]');
    await expect(meta1.getByRole('textbox', { name: /no formato SMART/ })).toHaveValue(METAS_ANTIGAS[0].texto);
    await expect(page.locator('[data-meta="1"]').getByRole('textbox', { name: /no formato SMART/ })).toHaveValue('Visitar 10 escolas da rede estadual');
    await meta1.getByRole('textbox', { name: /no formato SMART/ }).fill(`${METAS_ANTIGAS[0].texto} e mais um`);
    await esperaSalvo(page);

    const c = await campos(page);
    for (const [k, v] of Object.entries(CAMPOS_ANTIGOS)) expect(c[k], k).toBe(v); // nenhum texto de m3.* mudou
    expect((await salvoDe(page)).dados.preditores).toEqual(['p1', 'p2']);
    const l = await metas(page);
    expect(l).toHaveLength(3);
    expect(l[0]).toMatchObject({ id: 'a', pred: 'p1', resp: 'Carla Dias', apoio: 'Davi Rocha e Bruno Lima', texto: `${METAS_ANTIGAS[0].texto} e mais um` });
    expect(l[1]).toEqual(METAS_ANTIGAS[1]); // a meta com HTML do editor antigo segue como estava
    expect(l[2]).toEqual(METAS_ANTIGAS[2]);
    expect((await salvoDe(page)).dados.rumo).toBeUndefined(); // abrir e editar meta não grava o estado novo das bandeiras
  });

  test('o Legado antigo abre como texto manual e o cargo antigo vira o cargo escolhido', async ({ page }) => {
    await abreGuia(page, '#/m/3/m3.legado/1', { dados: ANTIGO });
    await expect(page.getByLabel('Texto final da manchete')).toHaveValue(CAMPOS_ANTIGOS['m3.legado']);
    await expect(page.getByText('Este texto foi escrito à mão')).toBeVisible();
    expect((await campos(page))['m3.legado']).toBe(CAMPOS_ANTIGOS['m3.legado']);
  });

  test('editar uma bandeira regrava o estado novo e o texto antigo continua no espelho', async ({ page }) => {
    await abreGuia(page, '#/m/3/m3.bandeiras/1', { dados: ANTIGO });
    await page.getByLabel('Argumentos de Educação').fill('Educação é a maior demanda');
    await esperaSalvo(page);
    const c = await campos(page);
    for (const rot of ['Educação', 'Saúde', 'Segurança no entorno das escolas']) expect(c['m3.mural']).toContain(rot);
    expect(c['m3.b1']).toBe('Educação');
    expect(c['m3.b2']).toBe('Saúde');
    expect(c['m3.argumentos']).toContain('Educação: Educação é a maior demanda');
    expect(c['m3.argumentos']).toContain('Saúde: filas longas.'); // o texto livre antigo é mantido
    expect(c['m3.criterios']).toContain('quantidade de apoiadores');
    expect((await salvoDe(page)).dados.metas).toHaveLength(3);
  });

  test('as metas antigas aparecem na aba como Não concluída e contam 0 até alguém mudar o status', async ({ page }) => {
    await abreGuia(page, '#/plano', { dados: ANTIGO });
    await expect(page.locator('.rm-anel b')).toHaveText('0%');
    for (const i of [0, 1, 2]) await expect(page.getByLabel(`Status da meta 0${i + 1}`)).toHaveValue('nao_concluida');
    await expect(page.locator('[data-tipo="meta"]').first()).toContainText('Não concluída');
    await expect(page.locator('[data-no="legado"]')).toContainText('Joaquim José: a educação no centro do debate');
    await page.getByLabel('Status da meta 01').selectOption('concluida');
    await expect(page.locator('.rm-anel b')).toHaveText('25%'); // p1 = (100 + 0) / 2 = 50; p2 = 0; total = (50 + 0) / 2 = 25
  });

  test('o Resumo continua mostrando bandeiras, legado, preditores e metas', async ({ page }) => {
    await abreGuia(page, '#/resumo', { dados: ANTIGO });
    const tela = page.locator('#tela');
    await expect(tela).toContainText('Educação');
    await expect(tela).toContainText('Segurança no entorno das escolas');
    await expect(tela).toContainText('Joaquim José: a educação no centro do debate');
    await expect(tela).toContainText('Senador(a)');
    await expect(tela).toContainText('Priorizar a educação');
    await expect(tela).toContainText('Aprovar 2 projetos de lei sobre educação até dezembro de 2027');
    await expect(tela).toContainText('Carla Dias');
  });

  test('o Painel de um mandato antigo mostra o resumo do plano (sem status, 0%)', async ({ page }) => {
    await abreGuia(page, '#/', { dados: ANTIGO });
    await expect(page.locator('[data-ilha="plano-resumo"]').getByRole('img', { name: 'Atingimento total do planejamento: 0%' })).toBeVisible();
  });
});

test.describe('Gabinete novo, pelo Guia real em modo local', () => {
  test('cria o mandato, percorre as 4 etapas da Missão 3 e vê o plano na aba e no Painel', async ({ page }) => {
    await page.route('**/legacy/nucleo.js', async (rota) => {
      const r = await rota.fetch();
      await rota.fulfill({ response: r, body: (await r.text()).replace('var NUVEM=!!(CONFIG.url&&CONFIG.key);', 'var NUVEM=false;') });
    });
    await page.addInitScript(() => {
      if (sessionStorage.getItem('fluxo-novo')) return;
      sessionStorage.setItem('fluxo-novo', '1');
      const u = { id: 'u_novo', email: 'novo@legisla.test', nome: 'Novo' };
      localStorage.setItem('legisla.regimento.v3', JSON.stringify({ sessao: u, usuarios: { [u.email]: u }, mandatos: {} }));
    });
    await page.goto('/guia');
    // o cadastro em etapas (escolha do eleito pelo TSE) está em reformulação: o mandato é criado pela API do legado, a mesma que o formulário chama
    await expect(page.getByRole('heading', { name: 'Vamos cadastrar o mandato' })).toBeVisible();
    await page.evaluate(async () => {
      const w = window as unknown as { Store: { criarMandato(c: object): Promise<{ id: string }> }; App: { entrou(): Promise<void> } };
      const m = await w.Store.criarMandato({ nome_parlamentar: 'Ana Souza', cargo: 'Deputado(a) Estadual', uf: 'SP', casa: 'Assembleia Legislativa', data_posse: '2027-02-01' });
      localStorage.setItem('legisla.mandatoAtual', m.id);
      await w.App.entrou();
      location.hash = '#/';
    });
    await expect(page.locator('[data-ilha="plano-resumo"]')).toContainText('Ele nasce quando você conclui a Missão 3');
    // a Missão 2 já deu nome a duas cadeiras
    await page.evaluate(() => { const w = window as unknown as { D: { campos: Record<string, string> }; Store: { salvar(): void } }; Object.assign(w.D.campos, { 'm2.on': '0|1', 'm2.f1': 'Ana Souza', 'm2.f2': 'Bruno Lima' }); w.Store.salvar(); });

    // 1) bandeiras
    await page.evaluate(() => { location.hash = '#/m/3/m3.bandeiras/1'; });
    await page.getByRole('button', { name: 'Educação', exact: true }).click();
    await page.getByLabel('Argumentos de Educação').fill('Maior demanda do território');
    await page.getByRole('button', { name: 'Marcar Educação como prioritária' }).click();
    // 2) legado
    await page.evaluate(() => { location.hash = '#/m/3/m3.legado/1'; });
    await page.getByRole('textbox', { name: /^Protagonista/ }).fill('Ana Souza');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByLabel('Principal entrega').fill('colocou a Educação no centro do debate');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByLabel('Resultado verificável').fill('zerou a fila da educação infantil');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByLabel('Cargo em quatro anos').selectOption('Reeleição a Deputado(a) Estadual');
    await page.getByRole('button', { name: 'Fechar a edição' }).click();
    await expect(page.getByText('Edição fechada').first()).toBeVisible();
    // 3) preditores
    await page.evaluate(() => { location.hash = '#/m/3/m3.preditores/1'; });
    await page.locator('[data-preditor="p1"] .rm-pred-bt').click();
    await page.locator('[data-preditor="p1"] input').fill('Priorizar a educação');
    // 4) metas
    await page.evaluate(() => { location.hash = '#/m/3/m3.metas/1'; });
    await page.getByRole('button', { name: 'Acrescentar meta a Priorizar a educação' }).click();
    await page.getByRole('textbox', { name: /no formato SMART/ }).fill('Aprovar 2 projetos de lei sobre educação até dezembro de 2027');
    await page.getByRole('group', { name: /^Responsável direto/ }).getByRole('button', { name: /Bruno Lima/ }).click();
    await page.getByLabel('Cabe na capacidade da equipe nos 4 meses?').check();
    await expect(page.locator('[data-letra][data-ok="true"]')).toHaveCount(5);
    // a aba e o Painel
    await page.locator('#ladoNav a.it[href="#/plano"]').click();
    await expect(page.locator('[data-no="legado"]')).toHaveAttribute('aria-label', /reeleição a Deputado\(a\) Estadual/i); // a manchete composta cita o cargo
    await expect(page.locator('[data-no="meta-0"]')).toContainText('Aprovar 2 projetos de lei');
    await expect(page.locator('.rm-anel b')).toHaveText('0%');
    await page.getByLabel('Status da meta 01').selectOption('concluida');
    await expect(page.locator('.rm-anel b')).toHaveText('100%');
    await page.locator('#ladoNav a.it[href="#/"]').click();
    await expect(page.locator('[data-ilha="plano-resumo"]').getByRole('img', { name: 'Atingimento total do planejamento: 100%' })).toBeVisible();
    await esperaSalvo(page);
    const dados = (await salvoDe(page)).dados as { campos: Record<string, string>; preditores: string[]; metas: { respCad: number; resp: string; status: string }[] };
    expect(dados.campos['m3.b1']).toBe('Educação');
    expect(dados.campos['m3.legado']).toMatch(/reeleição a Deputado\(a\) Estadual/i);
    expect(dados.campos['m3.cargo']).toBe('Reeleição a Deputado(a) Estadual');
    expect(dados.preditores).toEqual(['p1']);
    expect(dados.metas[0]).toMatchObject({ respCad: 1, resp: 'Bruno Lima', status: 'concluida' });
  });
});

/* ---------- as 7 ilhas em 375 px e 1280 px: sem rolagem horizontal da página; capturas em test-results/rumo-telas ---------- */
const SEMENTE = {
  campos: { ...EQUIPE, 'm1.q1': 'Ana Souza, professora e vereadora.', 'm3.obj.p1': 'Priorizar a educação', 'm3.obj.p2': 'Pautar o fim do trabalho infantil' },
  mandato: MANDATO,
  D: {
    preditores: ['p1', 'p2'],
    metas: [
      { id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos de lei sobre educação até dezembro de 2027', respCad: 1, resp: 'Bruno Lima', apoioCad: [2], apoio: 'Carla Dias', status: 'concluida', alcancavel: true },
      { id: 'b', pred: 'p1', texto: 'Visitar 10 escolas da rede estadual', status: 'concluida70' },
      { id: 'c', pred: 'p2', texto: 'Realizar 3 debates públicos sobre trabalho infantil ao longo do primeiro semestre com a participação de conselhos tutelares', status: 'congelada' },
      { id: 'd', pred: '', texto: 'Meta solta, sem objetivo', status: 'nao_concluida' },
    ],
    rumo: {
      v: 1,
      bandeiras: [
        { id: 'educacao', rot: 'Educação', argumentos: 'Maior demanda do território, com muitas escolas sem reforma e uma fila grande por vagas.', notas: { especializacao: 5, apoiadores: 4, promessas: 5, impacto: 4 }, prioridade: 1 },
        { id: 'saude', rot: 'Saúde', argumentos: 'Filas longas.', notas: { especializacao: 2, apoiadores: 3 }, prioridade: 2 },
      ],
      legado: { el: { protagonista: 'Ana Souza', entrega: 'colocou a Educação no centro do debate político do estado inteiro', resultado: 'zerou a fila da educação infantil em todos os municípios', cargo: 'Reeleição a Deputado(a) Estadual' },
        manchete: 'Ana Souza colocou a Educação no centro do debate político do estado inteiro e zerou a fila da educação infantil em todos os municípios: reeleição a Deputado(a) Estadual', manual: false, jornal: 'A Gazeta do Mandato', fechado: true,
        rascunhos: [{ id: 'r1', grupo: 'Grupo Azul', manchete: 'Educação em primeiro lugar', cargo: 'Senador(a)' }] },
    },
    comissoesDesejadas: [{ id: 'x', comissao: 'Comissão de Educação', papel: 'Titular', cargo: 'Titular', bandeira: 'Educação' }],
  },
};
const ILHAS = ['rumo-bandeiras', 'rumo-espacos', 'rumo-legado', 'rumo-preditores', 'rumo-metas', 'plano', 'plano-resumo'];

for (const largura of [375, 1280]) {
  for (const ilha of ILHAS) {
    test(`a ilha ${ilha} em ${largura} px não tem rolagem horizontal da página`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: 800 });
      await abre(page, [ilha], SEMENTE);
      await expect(page.locator(`[data-ilha="${ilha}"] .ilha-corpo`)).toBeVisible();
      await page.waitForTimeout(250);
      const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(sw, `scrollWidth ${sw} > largura ${cw}`).toBeLessThanOrEqual(cw);
      await page.screenshot({ path: `test-results/rumo-telas/${ilha}-${largura}.png`, fullPage: true });
    });
  }
}

test.describe('Impressão do Plano com o CSS do Guia carregado', () => {
  test('mesmo com o @media print global da Equipe, a aba do plano imprime a árvore', async ({ page }) => {
    await abreGuia(page, '#/plano', { dados: { ...ANTIGO, metas: METAS_ANTIGAS.map((m) => ({ ...m, status: 'concluida' })) }, mandato: MANDATO_REAL });
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('[data-no="obj-p1"]')).toBeVisible();
    await expect(page.locator('#ladoNav')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Imprimir' })).toBeHidden();
  });
});
