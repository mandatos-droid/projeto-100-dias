import { test, expect, type Page } from '@playwright/test';
import { abre, camposDe, dadoDe } from './semente-rumo';

const ILHA = 'rumo-preditores';
const card = (page: Page, pid: string) => page.locator(`[data-preditor="${pid}"]`);
const marca = (page: Page, pid: string) => card(page, pid).locator('.rm-pred-bt');
const arvore = (page: Page) => page.getByRole('tree', { name: 'Árvore do planejamento' });
const itens = (page: Page) => arvore(page).getByRole('treeitem');
const objetivo = (page: Page, pid: string) => card(page, pid).getByRole('textbox');

test.describe('Selecionar abre o objetivo e cresce a árvore (RUM-20.1, RUM-20.2, RUM-20.6)', () => {
  test('selecionar um preditor abre o campo com o exemplo do Guia e acrescenta o nó', async ({ page }) => {
    await abre(page, [ILHA]);
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await marca(page, 'p2').click();
    await expect(objetivo(page, 'p2')).toBeVisible();
    await expect(objetivo(page, 'p2')).toHaveAttribute('placeholder', /Ser referência nacional na defesa do fim do trabalho infantil/);
    await expect(page.locator('[data-no="obj-p2"]')).toBeVisible();
    expect(await dadoDe(page, 'preditores')).toEqual(['p2']);
    await expect(page.getByText('1 de 3 preditores escolhidos')).toBeVisible();
  });

  test('o exemplo sugerido casa com o preditor (3º e 4º do Guia estão trocados na tabela)', async ({ page }) => {
    await abre(page, [ILHA]);
    await marca(page, 'p3').click();
    await marca(page, 'p4').click();
    await expect(objetivo(page, 'p3')).toHaveAttribute('placeholder', /Expandir relevância como liderança do partido/);
    await expect(objetivo(page, 'p4')).toHaveAttribute('placeholder', /Articular a Liderança de pelo menos 2 Fóruns/);
  });

  test('objetivo vazio mostra o nome do preditor na árvore; escrever grava m3.obj e atualiza o nó', async ({ page }) => {
    await abre(page, [ILHA]);
    await marca(page, 'p1').click();
    await expect(page.locator('[data-no="obj-p1"]')).toContainText('Priorizar a agenda');
    await objetivo(page, 'p1').fill('Ampliar a agenda de educação');
    await expect(page.locator('[data-no="obj-p1"]')).toContainText('Ampliar a agenda de educação');
    expect((await camposDe(page))['m3.obj.p1']).toBe('Ampliar a agenda de educação');
    await objetivo(page, 'p1').fill('');
    await expect(page.locator('[data-no="obj-p1"]')).toContainText('Priorizar a agenda');
    expect((await camposDe(page))['m3.obj.p1']).toBeUndefined();
  });

  test('a tabela de exemplos do Guia continua na tela', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1'] } });
    await expect(page.getByRole('heading', { name: 'Objetivo específico de cada preditor' })).toBeVisible();
    await expect(page.locator('table.tb tbody tr')).toHaveCount(5);
    await expect(page.locator('table.tb')).toContainText('Destravar a entrega do Hospital da Universidade Federal de Jiripoca');
  });

  test('a árvore mostra o Legado no topo com a manchete resumida (RUM-20.5)', async ({ page }) => {
    await abre(page, [ILHA], { campos: { 'm3.legado': 'Mandato que colocou a Educação no centro' }, D: { preditores: ['p1'] } });
    await expect(page.locator('[data-no="legado"]')).toContainText('Mandato que colocou a Educação no centro');
  });
});

test.describe('Limite de três e desmarcar (RUM-20.3, RUM-21.4)', () => {
  test('o quarto preditor é recusado com mensagem que cita quais desmarcar', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1', 'p2', 'p3'] } });
    await marca(page, 'p4').click();
    await expect(page.locator('#avisos')).toContainText('Escolha até 3 preditores. Desmarque um deles (Priorizar a agenda, Pautar os debates, Construir o partido)');
    expect(await dadoDe(page, 'preditores')).toEqual(['p1', 'p2', 'p3']);
    await expect(objetivo(page, 'p4')).toHaveCount(0);
  });

  test('desmarcar preditor com metas pede confirmação com a contagem e deixa as metas sem objetivo', async ({ page }) => {
    await abre(page, [ILHA], {
      D: { preditores: ['p1', 'p2'], metas: [{ id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos' }, { id: 'b', pred: 'p1', texto: 'Visitar 10 escolas' }, { id: 'c', pred: 'p2', texto: 'Realizar 3 debates' }] },
    });
    let msg = '';
    page.once('dialog', async (dl) => { msg = dl.message(); await dl.dismiss(); });
    await marca(page, 'p1').click();
    expect(msg).toContain('2 metas');
    expect(await dadoDe(page, 'preditores')).toEqual(['p1', 'p2']);
    page.once('dialog', (dl) => dl.accept());
    await marca(page, 'p1').click();
    await expect.poll(() => dadoDe(page, 'preditores')).toEqual(['p2']);
    const metas = (await dadoDe(page, 'metas')) as { id: string; pred: string; texto: string }[];
    expect(metas.map((m) => [m.id, m.pred, m.texto])).toEqual([['a', '', 'Aprovar 2 projetos'], ['b', '', 'Visitar 10 escolas'], ['c', 'p2', 'Realizar 3 debates']]);
  });

  test('desmarcar preditor sem metas não pede confirmação e o texto do objetivo fica guardado', async ({ page }) => {
    await abre(page, [ILHA], { campos: { 'm3.obj.p1': 'Meu objetivo' }, D: { preditores: ['p1'] } });
    let pediu = false;
    page.on('dialog', async (dl) => { pediu = true; await dl.dismiss(); });
    await marca(page, 'p1').click();
    await expect.poll(() => dadoDe(page, 'preditores')).toEqual([]);
    expect(pediu).toBe(false);
    expect((await camposDe(page))['m3.obj.p1']).toBe('Meu objetivo');
  });
});

test.describe('Árvore acessível (RUM-42.14, primeira parte)', () => {
  const semente = { campos: { 'm3.legado': 'Manchete do legado' }, D: { preditores: ['p1', 'p2'] } };

  test('tem role tree, nós focáveis com rótulo acessível e aria-expanded', async ({ page }) => {
    await abre(page, [ILHA], semente);
    await expect(arvore(page)).toBeVisible();
    await expect(itens(page)).toHaveCount(3);
    const legado = page.locator('[data-no="legado"]');
    await expect(legado).toHaveAttribute('aria-expanded', 'true');
    await expect(legado).toHaveAttribute('aria-label', /^Legado: Manchete do legado/);
    await expect(page.locator('[data-no="obj-p1"]')).toHaveAttribute('aria-label', /^Objetivo de Priorizar a agenda: Priorizar a agenda\. 0 metas/);
    await expect(page.locator('[data-no="obj-p1"]')).toHaveAttribute('aria-level', '2');
  });

  test('setas navegam, Espaço recolhe e expande, setas esquerda/direita também', async ({ page }) => {
    await abre(page, [ILHA], semente);
    const legado = page.locator('[data-no="legado"]');
    await legado.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('[data-no="obj-p1"]')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('[data-no="obj-p2"]')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowLeft'); // sem filhos: sobe para o pai
    await expect(legado).toBeFocused();
    await page.keyboard.press('Space');
    await expect(legado).toHaveAttribute('aria-expanded', 'false');
    await expect(itens(page)).toHaveCount(1);
    await page.keyboard.press('ArrowRight');
    await expect(legado).toHaveAttribute('aria-expanded', 'true');
    await expect(itens(page)).toHaveCount(3);
    await page.keyboard.press('ArrowRight'); // aberto: desce ao primeiro filho
    await expect(page.locator('[data-no="obj-p1"]')).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.locator('[data-no="obj-p2"]')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(legado).toBeFocused();
  });

  test('só um nó entra na ordem do Tab (roving tabindex)', async ({ page }) => {
    await abre(page, [ILHA], semente);
    await expect(page.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(1);
  });
});
