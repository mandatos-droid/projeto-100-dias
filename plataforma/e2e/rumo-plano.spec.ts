import { test, expect, type Page } from '@playwright/test';
import { abre, dadoDe } from './semente-rumo';

const ILHA = 'plano';
type M = { id: string; pred?: string; texto?: string; status?: string };
const metasDe = async (page: Page) => (await dadoDe(page, 'metas')) as M[];
const no = (page: Page, id: string) => page.locator(`[data-no="${id}"]`);
const total = (page: Page) => page.locator('.rm-anel b');
const statusDe = (page: Page, idx: number) => page.getByLabel(`Status da meta ${String(idx + 1).padStart(2, '0')}`);
const pctObj = (page: Page, pid: string) => no(page, `obj-${pid}`).locator('> .rm-no-cab .rm-no-pct');

/* objetivo p1: 100, 70, 0 e uma congelada = 57; objetivo p2: concluída = 100; total = 79 (RUM-41.5, RUM-41.6) */
const PLANO = {
  campos: { 'm3.legado': 'A Educação no centro do debate', 'm3.obj.p1': 'Priorizar a educação', 'm3.obj.p2': 'Pautar o fim do trabalho infantil' },
  D: {
    preditores: ['p1', 'p2'],
    metas: [
      { id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos de lei até dezembro', status: 'concluida' },
      { id: 'b', pred: 'p1', texto: 'Visitar 10 escolas', status: 'concluida70' },
      { id: 'c', pred: 'p1', texto: 'Realizar 3 audiências', status: 'nao_concluida' },
      { id: 'd', pred: 'p1', texto: 'Criar a frente parlamentar', status: 'congelada' },
      { id: 'e', pred: 'p2', texto: 'Lançar a campanha', status: 'concluida' },
    ],
  },
};

test.describe('A árvore e o total (RUM-40.1, RUM-41)', () => {
  test('com 2 objetivos e 4 metas mostra Legado, objetivos com preditor, metas e o total no topo', async ({ page }) => {
    await abre(page, [ILHA], { campos: PLANO.campos, D: { preditores: PLANO.D.preditores, metas: PLANO.D.metas.slice(0, 3).concat({ id: 'e', pred: 'p2', texto: 'Lançar a campanha', status: 'concluida' }) } });
    await expect(page.getByRole('tree', { name: 'Árvore do planejamento' })).toBeVisible();
    await expect(no(page, 'legado')).toContainText('A Educação no centro do debate');
    await expect(no(page, 'obj-p1')).toContainText('Priorizar a agenda');
    await expect(no(page, 'obj-p1')).toContainText('Priorizar a educação');
    await expect(no(page, 'obj-p2')).toContainText('Pautar os debates');
    await expect(page.locator('[data-tipo="meta"]')).toHaveCount(4);
    await expect(total(page)).toHaveText('79%'); // p1 = (100 + 70 + 0) / 3 = 57, p2 = 100, total = (57 + 100) / 2 = 79
  });

  test('o total é a média dos objetivos: 57 e 100 dão 79; meta congelada fica fora da conta', async ({ page }) => {
    await abre(page, [ILHA], PLANO);
    await expect(pctObj(page, 'p1')).toHaveText('57%');
    await expect(pctObj(page, 'p2')).toHaveText('100%');
    await expect(total(page)).toHaveText('79%');
    await expect(page.getByRole('img', { name: 'Atingimento total do planejamento: 79%' })).toBeVisible();
  });

  test('mudar o status de uma meta recalcula objetivo e total em menos de 300 ms e grava', async ({ page }) => {
    await abre(page, [ILHA], PLANO);
    await statusDe(page, 2).selectOption('concluida'); // p1: 100, 70, 100 => 90
    await expect(pctObj(page, 'p1')).toHaveText('90%', { timeout: 300 });
    await expect(total(page)).toHaveText('95%', { timeout: 300 }); // (90 + 100) / 2
    expect((await metasDe(page))[2].status).toBe('concluida');
    await expect(no(page, 'meta-2')).toContainText('Concluída');
  });

  test('objetivo só com metas congeladas mostra "—" e fica fora do total', async ({ page }) => {
    await abre(page, [ILHA], { campos: PLANO.campos, D: { preditores: ['p1', 'p2'], metas: [{ id: 'a', pred: 'p1', texto: 'Visitar 10 escolas', status: 'congelada' }, { id: 'e', pred: 'p2', texto: 'Lançar a campanha', status: 'concluida70' }] } });
    await expect(pctObj(page, 'p1')).toHaveText('—');
    await expect(pctObj(page, 'p2')).toHaveText('70%');
    await expect(total(page)).toHaveText('70%');
    await expect(no(page, 'meta-0')).toContainText('Congelada');
  });

  test('cada objetivo mostra a barra e a contagem de metas por status (RUM-41.12)', async ({ page }) => {
    await abre(page, [ILHA], PLANO);
    const barra = no(page, 'obj-p1').getByRole('progressbar', { name: /Atingimento do objetivo/ });
    await expect(barra).toHaveAttribute('aria-valuenow', '57');
    const cont = no(page, 'obj-p1').locator('> .rm-no-cab .rm-cont li');
    await expect(cont).toHaveText(['Concluída 1', 'Concluída 70% 1', 'Não concluída 1', 'Congelada 1']);
    await statusDe(page, 3).selectOption('concluida');
    await expect(cont).toHaveText(['Concluída 2', 'Concluída 70% 1', 'Não concluída 1', 'Congelada 0']);
    await expect(barra).toHaveAttribute('aria-valuenow', '68'); // (100 + 70 + 0 + 100) / 4 = 67,5
  });

  test('o status aparece como texto e símbolo, não só como cor', async ({ page }) => {
    await abre(page, [ILHA], PLANO);
    const st = (i: number) => no(page, `meta-${i}`).locator('> .rm-no-cab .rm-st');
    await expect(st(0)).toContainText('Concluída');
    await expect(st(1)).toContainText('Concluída 70%');
    await expect(st(2)).toContainText('Não concluída');
    await expect(st(3)).toContainText('Congelada');
    await expect(no(page, 'meta-1')).toHaveAttribute('aria-label', /Status: Concluída 70%, 70%/);
    await expect(no(page, 'meta-3')).toHaveAttribute('aria-label', /Status: Congelada, fora da conta/);
  });
});

test.describe('Estado vazio, metas sem objetivo e metas antigas (RUM-40.2, RUM-21.4, RUM-70)', () => {
  test('sem preditor com meta mostra o estado vazio com atalho para a Missão 3', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1'] } });
    await expect(page.getByRole('heading', { name: 'O planejamento ainda não tem metas' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ir para a Missão 3' })).toHaveAttribute('href', '#/m/3/m3.preditores');
    await expect(page.getByRole('tree')).toHaveCount(0);
  });

  test('metas sem objetivo aparecem em bloco próprio, com aviso, fora do total', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1'], metas: [{ id: 'a', pred: 'p1', texto: 'Visitar 10 escolas', status: 'concluida' }, { id: 'b', pred: '', texto: 'Meta solta', status: 'nao_concluida' }] } });
    const bloco = no(page, 'sem-objetivo');
    await expect(bloco).toContainText('não estão ligadas a um objetivo específico');
    await expect(bloco.locator('[data-tipo="meta"]')).toHaveCount(1);
    await expect(total(page)).toHaveText('100%');
  });

  test('metas antigas, sem status, aparecem como Não concluída e contam 0 até alguém mudar', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1'], metas: [{ id: 'a', pred: 'p1', texto: 'Visitar 10 escolas', resp: 'Fulano', apoio: 'Beltrano' }] } });
    await expect(no(page, 'meta-0')).toContainText('Não concluída');
    await expect(statusDe(page, 0)).toHaveValue('nao_concluida');
    await expect(pctObj(page, 'p1')).toHaveText('0%');
    await expect(total(page)).toHaveText('0%');
    expect(await metasDe(page)).toEqual([{ id: 'a', pred: 'p1', texto: 'Visitar 10 escolas', resp: 'Fulano', apoio: 'Beltrano' }]); // abrir não grava
    await statusDe(page, 0).selectOption('concluida70');
    await expect(total(page)).toHaveText('70%');
    expect((await metasDe(page))[0]).toMatchObject({ resp: 'Fulano', apoio: 'Beltrano', status: 'concluida70' });
  });
});


/* ---------- T21: edição pela aba, filtro por pessoa, impressão e teclado ---------- */
const EQUIPE4 = { 'm2.on': '0|1|2|3', 'm2.f1': 'Ana Souza', 'm2.f2': 'Bruno Lima', 'm2.f3': 'Carla Dias', 'm2.f4': 'Davi Rocha' };
const edita = (page: Page, i: number) => page.getByRole('button', { name: `Editar a meta ${String(i + 1).padStart(2, '0')}` });
const cartao = (page: Page, i: number) => page.locator('[data-ilha="plano"] .rm-no-edicao').locator(`[data-meta="${i}"]`);

test.describe('Edição pela aba (RUM-40.8, RUM-40.9, RUM-40.10)', () => {
  test('acrescentar meta pela aba aplica o vínculo com o objetivo e o limite de 4 por objetivo', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1', 'p2'], metas: [{ id: 'a', pred: 'p1', texto: 'Visitar 10 escolas' }, { id: 'b', pred: 'p1', texto: 'Aprovar 2 projetos' }, { id: 'c', pred: 'p1', texto: 'Realizar 3 audiências' }] } });
    await page.getByRole('button', { name: 'Acrescentar meta a Priorizar a agenda' }).click();
    let l = await metasDe(page);
    expect(l).toHaveLength(4);
    expect([l[3].pred, l[3].status]).toEqual(['p1', 'nao_concluida']);
    await expect(cartao(page, 3)).toBeVisible(); // a meta nova já abre para editar
    await page.getByRole('button', { name: 'Acrescentar meta a Priorizar a agenda' }).click();
    await expect(page.locator('#avisos')).toContainText('no máximo 4 metas (limite do Guia)');
    l = await metasDe(page);
    expect(l).toHaveLength(4);
  });

  test('editar texto, objetivo, responsável, apoio e status na aba reflete no exercício e vice-versa', async ({ page }) => {
    await abre(page, ['rumo-metas', ILHA], { campos: EQUIPE4, D: { preditores: ['p1', 'p2'], metas: [{ id: 'a', pred: 'p1', texto: 'Visitar 10 escolas' }] } });
    const exercicio = page.locator('[data-ilha="rumo-metas"] [data-meta="0"]');
    await edita(page, 0).click();
    const c = cartao(page, 0);
    await c.getByRole('textbox', { name: /no formato SMART/ }).fill('Aprovar 2 projetos de lei até dezembro de 2027');
    await c.getByLabel('Objetivo específico da meta 01').selectOption('p2');
    await c.getByRole('group', { name: /^Responsável direto/ }).getByRole('button', { name: /Bruno Lima/ }).click();
    await c.getByRole('group', { name: /^Apoios/ }).getByRole('button', { name: 'Carla Dias' }).click();
    await c.getByLabel('Status da meta 01').selectOption('concluida70');
    // o exercício mostra o mesmo dado
    await expect(exercicio.getByRole('textbox', { name: /no formato SMART/ })).toHaveValue('Aprovar 2 projetos de lei até dezembro de 2027');
    await expect(exercicio.getByLabel('Objetivo específico da meta 01')).toHaveValue('p2');
    await expect(exercicio.getByRole('group', { name: /^Responsável direto/ }).getByRole('button', { name: /Bruno Lima/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(exercicio.getByRole('group', { name: /^Apoios/ }).getByRole('button', { name: 'Carla Dias' })).toHaveAttribute('aria-pressed', 'true');
    expect((await metasDe(page))[0]).toMatchObject({ pred: 'p2', respCad: 1, resp: 'Bruno Lima', apoioCad: [2], status: 'concluida70' });
    // e o caminho de volta: editar no exercício muda a árvore
    await exercicio.getByRole('textbox', { name: /no formato SMART/ }).fill('Realizar 3 audiências até junho');
    await expect(no(page, 'meta-0')).toContainText('Realizar 3 audiências até junho');
    await expect(no(page, 'obj-p2')).toContainText('Concluída 70%');
  });

  test('o cartão da meta na aba mostra o retorno SMART (S M A R T) ao editar o texto (RUM-40.8)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1'], metas: [{ id: 'a', pred: 'p1', texto: 'Melhorar a educação' }] } });
    await edita(page, 0).click();
    const c = cartao(page, 0);
    expect(await c.locator('[data-letra]').evaluateAll((els) => els.map((e) => e.getAttribute('data-letra')))).toEqual(['S', 'M', 'A', 'R', 'T']);
    await expect(c.locator('[data-letra="S"]')).toHaveAttribute('data-ok', 'false');
    await expect(c.locator('[data-letra="T"]')).toHaveAttribute('data-ok', 'false');
    await c.getByRole('textbox', { name: /no formato SMART/ }).fill('Aprovar 2 projetos de lei sobre educação até dezembro de 2027');
    for (const l of ['S', 'M', 'R', 'T']) await expect(c.locator(`[data-letra="${l}"]`)).toHaveAttribute('data-ok', 'true', { timeout: 300 });
    await expect(c.locator('[data-letra="A"]')).toHaveAttribute('data-ok', 'false');
    await expect(c.locator('[data-pontos]')).toHaveText('4 de 5 letras atendidas');
  });

  test('remover pede confirmação e sai da árvore', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1'], metas: [{ id: 'a', pred: 'p1', texto: 'Visitar 10 escolas' }, { id: 'b', pred: 'p1', texto: 'Aprovar 2 projetos' }] } });
    await edita(page, 0).click();
    page.once('dialog', (dl) => dl.dismiss());
    await page.getByRole('button', { name: 'Remover a meta 01' }).click();
    expect(await metasDe(page)).toHaveLength(2);
    page.once('dialog', (dl) => dl.accept());
    await page.getByRole('button', { name: 'Remover a meta 01' }).click();
    await expect.poll(async () => (await metasDe(page)).length).toBe(1);
    await expect(page.locator('[data-tipo="meta"]')).toHaveCount(1);
  });
});

test.describe('Filtro por pessoa (RUM-42.11)', () => {
  const metas = [
    { id: 'a', pred: 'p1', texto: 'Visitar 10 escolas', respCad: 1, resp: 'Bruno Lima' },
    { id: 'b', pred: 'p1', texto: 'Aprovar 2 projetos', respCad: 0, resp: 'Ana Souza', apoioCad: [1], apoio: 'Bruno Lima' },
    { id: 'c', pred: 'p1', texto: 'Realizar 3 audiências', respCad: 0, resp: 'Ana Souza' },
    { id: 'd', pred: 'p1', texto: 'Lançar a campanha', resp: 'Dona Maria' },
  ];
  test('destaca as metas em que a pessoa é responsável ou apoio e esmaece as demais', async ({ page }) => {
    await abre(page, [ILHA], { campos: EQUIPE4, D: { preditores: ['p1'], metas } });
    await page.getByLabel('Filtrar por pessoa').selectOption('Bruno Lima');
    await expect(no(page, 'meta-0')).toHaveAttribute('data-marca', 'destaque');
    await expect(no(page, 'meta-1')).toHaveAttribute('data-marca', 'destaque');
    await expect(no(page, 'meta-2')).toHaveAttribute('data-marca', 'esmaecido');
    await expect(no(page, 'meta-3')).toHaveAttribute('data-marca', 'esmaecido');
    await page.getByLabel('Filtrar por pessoa').selectOption('');
    await expect(page.locator('[data-marca]')).toHaveCount(0);
  });

  test('nomes em texto livre também entram no filtro', async ({ page }) => {
    await abre(page, [ILHA], { campos: EQUIPE4, D: { preditores: ['p1'], metas } });
    await page.getByLabel('Filtrar por pessoa').selectOption('Dona Maria');
    await expect(no(page, 'meta-3')).toHaveAttribute('data-marca', 'destaque');
    await expect(no(page, 'meta-0')).toHaveAttribute('data-marca', 'esmaecido');
  });
});

test.describe('Imprimir (RUM-42.13)', () => {
  test('"Imprimir" chama a impressão e, em mídia de impressão, só a árvore fica visível, sem os controles', async ({ page }) => {
    await abre(page, [ILHA], PLANO);
    await page.evaluate(() => { const w = window as unknown as { __imprimiu: number }; w.__imprimiu = 0; window.print = () => { w.__imprimiu++; }; });
    await page.getByRole('button', { name: 'Imprimir' }).click();
    expect(await page.evaluate(() => (window as unknown as { __imprimiu: number }).__imprimiu)).toBe(1);
    await page.emulateMedia({ media: 'print' });
    await expect(no(page, 'obj-p1')).toBeVisible();
    await expect(no(page, 'meta-0')).toBeVisible();
    await expect(page.locator('.rm-anel b')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Imprimir' })).toBeHidden();
    await expect(page.getByRole('button', { name: /^Acrescentar meta a / }).first()).toBeHidden();
    await expect(page.getByLabel('Status da meta 01')).toBeHidden();
    await expect(page.getByLabel('Filtrar por pessoa')).toBeHidden();
    const pos = await page.evaluate(() => getComputedStyle(document.querySelector('.rm-plano')!).position);
    expect(pos).toBe('absolute');
    await page.screenshot({ path: 'test-results/plano-impressao.png', fullPage: true });
  });
});

test.describe('Teclado na aba (RUM-42.14)', () => {
  test('Enter abre e fecha a edição da meta; cada nó tem rótulo acessível', async ({ page }) => {
    await abre(page, [ILHA], PLANO);
    await no(page, 'meta-0').focus();
    await expect(no(page, 'meta-0')).toHaveAttribute('aria-label', /^Meta 01: Aprovar 2 projetos de lei até dezembro\. Status: Concluída, 100%/);
    await page.keyboard.press('Enter');
    await expect(cartao(page, 0)).toBeVisible();
    // dentro do cartão as teclas pertencem aos campos, não à árvore
    await cartao(page, 0).getByRole('textbox', { name: /no formato SMART/ }).press('Space');
    await expect(no(page, 'obj-p1')).toHaveAttribute('aria-expanded', 'true');
    await no(page, 'meta-0').focus();
    await page.keyboard.press('Enter');
    await expect(cartao(page, 0)).toHaveCount(0);
    await page.keyboard.press('ArrowDown');
    await expect(no(page, 'meta-1')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(no(page, 'obj-p1')).toBeFocused();
    await page.keyboard.press('Space');
    await expect(no(page, 'obj-p1')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[data-tipo="meta"]')).toHaveCount(1); // só a meta do outro objetivo (p2) segue visível
  });
});
