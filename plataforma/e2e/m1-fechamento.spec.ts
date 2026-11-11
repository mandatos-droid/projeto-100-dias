import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { abreGuia } from './guia-real';

/* Missão 1 · Fechamento e Resumo (FEC-01, FEC-02, FEC-04, FEC-05, GER-02, GER-03): "Pronto!", botão que baixa o HTML,
   compilado no fim da página e andamento contado só pelos cartões e seletores novos. */
const DADOS = {
  campos: { 'm1.q1': 'RESPOSTA-QUEM-E', 'm1.q3c1': 'CONQUISTA-UM', 'm1.q3b': 'Senador(a)', 'm1.q8a': 'ANALISE-SOCIAL' },
  agendasPrio: ['saude', 'educacao', 'cultura'],
  eleitorado: { itens: [{ id: 'e1', tipo: 'promessa', texto: 'PROMESSA-UM', muns: [] }] },
};

test.describe('Fechamento da Missão 1 (FEC-01, FEC-02, FEC-04, FEC-05)', () => {
  test('no fim da etapa 4 aparecem "Pronto!", o texto, o botão e o compilado com as respostas', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await abreGuia(page, '#/m/1/m1.frag', { dados: DADOS });
    const pronto = page.locator('.m1-pronto');
    await expect(pronto.getByRole('heading', { name: 'Pronto!' })).toBeVisible({ timeout: 30_000 });
    await expect(pronto).toContainText('Parabéns! Com base neste amplo estudo de preparação da sua chegada você gerou o seu Mapa Político.');
    await expect(pronto.getByRole('button', { name: 'Gerar HTML do Mapa Político' })).toBeVisible();
    const comp = pronto.locator('.m1-compilado');
    await expect(comp).toContainText('RESPOSTA-QUEM-E');
    await expect(comp).toContainText('CONQUISTA-UM');
    await expect(comp).toContainText('PROMESSA-UM');
    await expect(comp.locator('li', { hasText: /^Saúde$/ })).toHaveCount(1);
    await expect(comp.locator('li', { hasText: /^Cultura e esporte$/ })).toHaveCount(1);
    await pronto.scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath('fechamento.png'), fullPage: false });
  });

  test('o botão baixa o HTML com as respostas, "Não respondida" nas vazias e carrossel funcionando', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await abreGuia(page, '#/m/1/m1.frag', { dados: DADOS });
    const botao = page.getByRole('button', { name: 'Gerar HTML do Mapa Político' });
    await expect(botao).toBeVisible({ timeout: 30_000 });
    const [arq] = await Promise.all([page.waitForEvent('download'), botao.click()]);
    expect(arq.suggestedFilename()).toMatch(/^mapa-politico-.*\.html$/);
    const caminho = test.info().outputPath('mapa-politico.html');
    await arq.saveAs(caminho); // com extensão .html, para abrir como página
    const html = readFileSync(caminho, 'utf8');
    for (const t of ['RESPOSTA-QUEM-E', 'CONQUISTA-UM', 'Senador(a)', 'ANALISE-SOCIAL', 'PROMESSA-UM', 'Saúde', 'Cultura e esporte']) expect(html, t).toContain(t);
    expect(html).toContain('Não respondida'); // m1.q6, m1.q2 e outras ficaram sem resposta
    expect(html).toContain('data-slides');
    // o arquivo aberto sozinho, sem a plataforma: o carrossel responde ao "Próximo"
    const solto = await page.context().newPage();
    await solto.route('**/*', (r) => (r.request().url().startsWith('file:') ? r.continue() : r.abort()));
    await solto.goto(pathToFileURL(caminho).href);
    await expect(solto.locator('[data-ind]').first()).toHaveText(/^Slide 1 de \d+$/);
    await solto.locator('[data-prox]').first().click();
    await expect(solto.locator('[data-ind]').first()).toHaveText(/^Slide 2 de \d+$/);
    await expect(solto.locator('body')).toContainText('RESPOSTA-QUEM-E');
  });
});

test.describe('Resumo e andamento (GER-02, GER-03)', () => {
  test('responder só em cartões e seletores novos deixa a etapa "em andamento" e o Resumo mostra tudo', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await abreGuia(page, '#/resumo', { dados: { agendasPrio: ['saude'], eleitorado: DADOS.eleitorado } });
    const missao = page.locator('.res-missao').first();
    await expect(missao).toBeVisible({ timeout: 30_000 });
    const sel = (titulo: string) => missao.locator('.res-ex', { has: page.locator('h4', { hasText: titulo }) }).locator('.selo');
    await expect(sel('Oportunidades')).toHaveText('em andamento');
    await expect(sel('Conjuntura')).toHaveText('não iniciado');
    await expect(missao).toContainText('PROMESSA-UM');
    await expect(missao.locator('li', { hasText: /^Saúde$/ })).toHaveCount(1);
    await expect(missao).toContainText('Promessas de Campanha (1)');
  });
});
