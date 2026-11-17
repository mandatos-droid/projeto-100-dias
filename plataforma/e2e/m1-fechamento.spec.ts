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
    await expect(pronto.getByRole('button', { name: 'Gerar HTML do Mapa Político' })).toHaveCount(0);
    const comp = pronto.locator('.m1-compilado');
    await expect(comp).toContainText('RESPOSTA-QUEM-E');
    await expect(comp).toContainText('CONQUISTA-UM');
    await expect(comp).toContainText('PROMESSA-UM');
    await expect(comp.locator('li', { hasText: /^Saúde$/ })).toHaveCount(1);
    await expect(comp.locator('li', { hasText: /^Cultura e esporte$/ })).toHaveCount(1);
    await pronto.scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath('fechamento.png'), fullPage: false });
  });

});

test.describe('Resumo e andamento (GER-02, GER-03)', () => {
  test('responder só em cartões e seletores novos deixa a etapa "em andamento" e o Resumo mostra tudo', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await abreGuia(page, '#/resumo', { dados: { agendasPrio: ['saude'], eleitorado: DADOS.eleitorado } });
    /* a aba Resumo é a tela nova (resumo-tela.js): um bloco por missão, um <details class="ex"> por exercício, com selo de estado */
    await expect(page.locator('#tela .seg')).toHaveCount(5, { timeout: 30_000 });
    await page.getByRole('button', { name: 'Expandir tudo' }).click();
    const missao = page.locator('#res-m1');
    await expect(missao).toBeVisible();
    const sel = (titulo: RegExp) => missao.locator('details.ex', { has: page.locator('a.ex-link', { hasText: titulo }) }).locator('.selo');
    await expect(sel(/oportunidades/i)).toHaveText('em andamento');
    await expect(sel(/conjuntura/i)).toHaveText('não iniciado');
    await expect(missao).toContainText('PROMESSA-UM');
    await expect(missao.locator('li', { hasText: /^Saúde$/ })).toHaveCount(1);
    await expect(missao).toContainText('Promessas de Campanha (1)');
  });
});
