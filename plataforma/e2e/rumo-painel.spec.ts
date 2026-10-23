import { test, expect } from '@playwright/test';
import { abreGuia, salvoDe } from './guia-real';

/* Guia real em modo local (sem Supabase). Plano: p1 com metas 100, 70, 0 e congelada (57), p2 com uma concluída (100) => total 79. */
const DADOS = {
  campos: { 'm3.legado': 'A Educação no centro do debate político', 'm3.obj.p1': 'Priorizar a educação', 'm3.obj.p2': 'Pautar o fim do trabalho infantil' },
  preditores: ['p1', 'p2'],
  metas: [
    { id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos de lei até dezembro', status: 'concluida' },
    { id: 'b', pred: 'p1', texto: 'Visitar 10 escolas', status: 'concluida70' },
    { id: 'c', pred: 'p1', texto: 'Realizar 3 audiências', status: 'nao_concluida' },
    { id: 'd', pred: 'p1', texto: 'Criar a frente parlamentar', status: 'congelada' },
    { id: 'e', pred: 'p2', texto: 'Lançar a campanha', status: 'concluida' },
  ],
};
const EVENTOS = [{ texto: 'Concluiu o exercício X', autor: 'Teste', criado_em: '2027-02-02T10:00:00Z' }];

test.describe('Painel com o resumo do plano (RUM-43.1, RUM-43.3)', () => {
  test('mostra manchete, atingimento total e barra por objetivo no lugar de "Últimos registros"', async ({ page }) => {
    await abreGuia(page, '#/', { dados: DADOS, eventos: EVENTOS });
    const resumo = page.locator('[data-ilha="plano-resumo"]');
    await expect(resumo.getByRole('heading', { name: 'Planejamento Estratégico' })).toBeVisible();
    await expect(resumo).toContainText('A Educação no centro do debate político');
    await expect(resumo.getByRole('img', { name: 'Atingimento total do planejamento: 79%' })).toBeVisible();
    await expect(resumo.getByRole('progressbar', { name: /Priorizar a educação/ })).toHaveAttribute('aria-valuenow', '57');
    await expect(resumo.getByRole('progressbar', { name: /Pautar o fim do trabalho infantil/ })).toHaveAttribute('aria-valuenow', '100');
    await expect(page.getByRole('heading', { name: 'Últimos registros' })).toHaveCount(0);
    await expect(page.getByText('Concluiu o exercício X')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Ver tudo o que foi preenchido' })).toBeVisible();
  });

  test('"Abrir o planejamento" leva a #/plano, que mostra a árvore e marca o item do menu como ativo (RUM-43.3, RUM-43.4)', async ({ page }) => {
    await abreGuia(page, '#/', { dados: DADOS });
    await page.getByRole('link', { name: 'Abrir o planejamento' }).click();
    await expect(page).toHaveURL(/#\/plano$/);
    await expect(page.getByRole('heading', { name: 'Planejamento Estratégico', level: 1 })).toBeVisible();
    await expect(page.getByRole('tree', { name: 'Árvore do planejamento' })).toBeVisible();
    const item = page.locator('#ladoNav a.it[href="#/plano"]');
    await expect(item).toHaveClass(/\bon\b/);
    await expect(page.locator('#ladoNav a.it.on')).toHaveCount(1);
    await expect(page.locator('.rm-anel b')).toHaveText('79%');
  });

  test('o item "Planejamento Estratégico" fica entre as missões e a Caixa de ferramentas', async ({ page }) => {
    await abreGuia(page, '#/', { dados: DADOS });
    const textos = await page.locator('#ladoNav > a.it, #ladoNav > .nav-grupo').evaluateAll((l) => l.map((e) => e.textContent ?? ''));
    const i = textos.findIndex((t) => t.includes('Planejamento Estratégico'));
    const apoio = textos.findIndex((t) => t.trim() === 'Apoio');
    expect(i).toBeGreaterThan(0);
    expect(apoio).toBe(i + 1);
    await expect(page.locator('#ladoNav a.it[href="#/plano"]')).toHaveCount(1);
  });

  test('abrir #/plano direto (recarregando a página) também funciona e o resumo acompanha uma mudança de status', async ({ page }) => {
    await abreGuia(page, '#/plano', { dados: DADOS });
    await expect(page.locator('.rm-anel b')).toHaveText('79%');
    await page.getByLabel('Status da meta 03').selectOption('concluida');
    await expect(page.locator('.rm-anel b')).toHaveText('95%');
    await page.locator('#ladoNav a.it[href="#/"]').click();
    await expect(page.locator('[data-ilha="plano-resumo"]').getByRole('img', { name: 'Atingimento total do planejamento: 95%' })).toBeVisible();
    await expect.poll(async () => ((await salvoDe(page)).dados.metas as { status: string }[])[2].status).toBe('concluida'); // o salvamento tem 700 ms de espera
    await page.reload();
    await expect(page.locator('[data-ilha="plano-resumo"]').getByRole('img', { name: /95%/ })).toBeVisible(); // o status ficou salvo
  });
});

test.describe('Painel sem plano (RUM-43.2)', () => {
  test('mostra o convite com botão para a Missão 3', async ({ page }) => {
    await abreGuia(page, '#/', { dados: {} });
    const resumo = page.locator('[data-ilha="plano-resumo"]');
    await expect(resumo).toContainText('Ele nasce quando você conclui a Missão 3');
    await resumo.getByRole('link', { name: 'Ir para a Missão 3' }).click();
    await expect(page).toHaveURL(/#\/m\/3$/);
  });

  test('a aba #/plano sem metas mostra o estado vazio com atalho para a Missão 3 (RUM-40.2)', async ({ page }) => {
    await abreGuia(page, '#/plano', { dados: { preditores: ['p1'] } });
    await expect(page.getByRole('heading', { name: 'O planejamento ainda não tem metas' })).toBeVisible();
  });
});

test.describe('Eventos continuam sendo gravados (RUM-43.5)', () => {
  test('o Painel com e sem eventos não mostra "Últimos registros" e mantém o botão "Ver tudo o que foi preenchido"', async ({ page, browser }) => {
    await abreGuia(page, '#/', { dados: DADOS, eventos: EVENTOS });
    await expect(page.getByRole('heading', { name: 'Últimos registros' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Ver tudo o que foi preenchido' })).toBeVisible();
    const ctx2 = await browser.newContext();
    const p2 = await ctx2.newPage();
    await abreGuia(p2, '#/', { dados: DADOS });
    await expect(p2.getByRole('heading', { name: 'Últimos registros' })).toHaveCount(0);
    await expect(p2.getByRole('link', { name: 'Ver tudo o que foi preenchido' })).toBeVisible();
    await expect(p2.locator('[data-ilha="plano-resumo"]')).toBeVisible();
    await ctx2.close();
  });

  test('concluir um exercício grava o evento em Store.eventos, mesmo sem aparecer no Painel', async ({ page }) => {
    await abreGuia(page, '#/m/1', { dados: DADOS });
    await page.evaluate(() => (window as unknown as { Store: { registrar(n: number, e: string, t: string): Promise<void> } }).Store.registrar(1, 'm1.q1', 'Exercício de teste'));
    await expect.poll(async () => (await salvoDe(page)).eventos.map((e) => e.texto)).toContain('Exercício de teste');
  });
});
