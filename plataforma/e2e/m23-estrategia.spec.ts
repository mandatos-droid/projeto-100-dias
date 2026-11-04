import { test, expect, type Page } from '@playwright/test';
import { abre, camposDe, dadoDe } from './semente-rumo';

const ILHA = 'rumo-estrategia';
const TRES = ['p1', 'p2', 'p3'];
const METAS = [{ id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos' }, { id: 'b', pred: 'p3', texto: 'Visitar 10 escolas' }, { id: 'c', pred: 'p1', texto: 'Realizar 3 debates' }];
const opcao = (page: Page, e: string) => page.locator(`[data-estrategia="${e}"]`);
const radio = (page: Page, e: string) => opcao(page, e).getByRole('radio');
const frase = (page: Page, pid: string) => page.locator(`[data-frase="${pid}"] input`);
const itens = (page: Page) => page.getByRole('tree', { name: 'Árvore do planejamento' }).getByRole('treeitem');

/** Estrutura da árvore: id e nome acessível de cada nó, sem o texto do objetivo. */
const estrutura = (page: Page) => page.locator('[role="treeitem"]').evaluateAll((els) =>
  els.map((e) => [e.getAttribute('data-no'), (e.getAttribute('aria-label') ?? '').replace(/^(Objetivo de [^:]+): .*?(\. \d+ metas?)$/, '$1$2')]));

test.describe('Estratégia dos Objetivos Estratégicos (RM3-10 a RM3-17)', () => {
  test('mostra as 3 opções do documento, nenhuma ativa sem escolha; sem a explicação de Objetivo Estratégico (RM3-11, sugestão 35)', async ({ page }) => {
    await abre(page, [ILHA]);
    await expect(page.getByRole('heading', { name: 'O que é Objetivo Estratégico' })).toHaveCount(0);
    await expect(page.locator('table.tb')).toHaveCount(0);
    await expect(opcao(page, 'a')).toContainText('Os preditores selecionados se tornarão os Objetivos Estratégicos do mandato.');
    await expect(opcao(page, 'b')).toContainText('Os preditores serão traduzidos em outra frase, que serão os Objetivos Estratégicos.');
    await expect(opcao(page, 'c')).toContainText('Os preditores apenas nortearão as Metas; os Objetivos Estratégicos serão os 3 sugeridos pela Legisla: 1. Avanço Legislativo; 2. Expansão de Capital Político e Influência; 3. Governança Estratégica.');
    await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  });

  test('uma única opção fica ativa de cada vez (RM3-11)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES } });
    page.on('dialog', (dl) => dl.accept());
    for (const e of ['b', 'c', 'a']) {
      await radio(page, e).check();
      await expect(page.locator('input[type="radio"]:checked')).toHaveCount(1);
      await expect(radio(page, e)).toBeChecked();
      expect((await camposDe(page))['m3.est']).toBe(e);
    }
  });

  test('A fecha o passo sem campo de texto (RM3-12)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES }, campos: { 'm3.obj.p1': 'Minha frase' } });
    page.on('dialog', (dl) => dl.accept());
    await radio(page, 'a').check();
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await expect(page.locator('[data-no="obj-p1"]')).toContainText('Priorizar a agenda');
    await expect(page.locator('[data-no="obj-p1"]')).not.toContainText('Minha frase');
  });

  test('B abre uma frase por preditor escolhido, com o nome visível, e a árvore mostra as frases (RM3-13)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES } });
    page.on('dialog', (dl) => dl.accept());
    await radio(page, 'b').check();
    await expect(page.locator('[data-frase]')).toHaveCount(3);
    await expect(page.locator('[data-frase="p1"]')).toContainText('Objetivo Estratégico de Priorizar a agenda');
    await expect(page.locator('[data-frase="p3"]')).toContainText('Objetivo Estratégico de Construir o partido');
    await expect(page.locator('[data-frase="p4"]')).toHaveCount(0);
    await frase(page, 'p1').fill('Foco em três temas');
    await expect(page.locator('[data-no="obj-p1"]')).toContainText('Foco em três temas');
    await expect(page.locator('[data-no="obj-p2"]')).toContainText('Pautar os debates'); // frase vazia: nome do preditor
    expect((await camposDe(page))['m3.obj.p1']).toBe('Foco em três temas');
  });

  test('C mostra as 3 frases da Legisla como referência e nenhum nó novo na árvore (RM3-14)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES } });
    page.on('dialog', (dl) => dl.accept());
    await radio(page, 'c').check();
    const nota = page.getByRole('note');
    await expect(nota.getByRole('listitem')).toHaveText(['Avanço Legislativo', 'Expansão de Capital Político e Influência', 'Governança Estratégica']);
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await expect(itens(page)).toHaveCount(4); // Legado + 3 preditores
    await expect(page.locator('[data-no="obj-p1"]')).toContainText('Priorizar a agenda');
  });

  test('trocar pede confirmação; recusar mantém e aceitar troca guardando o texto da opção anterior (RM3-17)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES }, campos: { 'm3.est': 'b', 'm3.obj.p1': 'Foco em três temas' } });
    let msg = '';
    page.once('dialog', async (dl) => { msg = dl.message(); await dl.dismiss(); });
    await radio(page, 'a').click();
    expect(msg).toContain('Trocar a estratégia');
    expect((await camposDe(page))['m3.est']).toBe('b');
    await expect(radio(page, 'b')).toBeChecked();
    page.once('dialog', (dl) => dl.accept());
    await radio(page, 'a').check();
    await expect.poll(async () => (await camposDe(page))['m3.est']).toBe('a');
    expect((await camposDe(page))['m3.obj.p1']).toBe('Foco em três temas');
    page.once('dialog', (dl) => dl.accept());
    await radio(page, 'b').check();
    await expect(frase(page, 'p1')).toHaveValue('Foco em três temas');
    await expect(page.locator('[data-no="obj-p1"]')).toContainText('Foco em três temas');
  });

  test('a primeira escolha não pede confirmação quando ainda não há estratégia (RM3-11)', async ({ page }) => {
    await abre(page, [ILHA]);
    let pediu = false;
    page.on('dialog', async (dl) => { pediu = true; await dl.dismiss(); });
    await radio(page, 'c').check();
    expect(pediu).toBe(false);
    expect((await camposDe(page))['m3.est']).toBe('c');
  });

  test('a árvore tem os mesmos nós nas três opções e nenhuma meta se move (RM3-16)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES, metas: METAS }, campos: { 'm3.obj.p1': 'Foco em três temas' } });
    page.on('dialog', (dl) => dl.accept());
    const metasAntes = JSON.stringify(await dadoDe(page, 'metas'));
    await radio(page, 'a').check();
    const emA = await estrutura(page);
    expect(emA.map((n) => n[0])).toEqual(['legado', 'obj-p1', 'obj-p2', 'obj-p3']);
    for (const e of ['b', 'c']) {
      await radio(page, e).check();
      await expect(radio(page, e)).toBeChecked();
      expect(await estrutura(page)).toEqual(emA);
      expect(JSON.stringify(await dadoDe(page, 'metas'))).toBe(metasAntes);
      expect(await dadoDe(page, 'preditores')).toEqual(TRES);
    }
    await expect(page.locator('[data-no="obj-p1"]')).toHaveAttribute('aria-label', /2 metas/);
  });

  test('mandato antigo com m3.obj e sem m3.est abre na opção B, sem perder texto (RMX-01)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES }, campos: { 'm3.obj.p2': 'Referência nacional no tema' } });
    await expect(radio(page, 'b')).toBeChecked();
    await expect(frase(page, 'p2')).toHaveValue('Referência nacional no tema');
    expect((await camposDe(page))['m3.est']).toBeUndefined();
  });

  test('mandato antigo só com preditores e sem texto abre na opção A (RMX-01)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES } });
    await expect(radio(page, 'a')).toBeChecked();
  });
});
