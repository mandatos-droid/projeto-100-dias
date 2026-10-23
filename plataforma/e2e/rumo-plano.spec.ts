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
