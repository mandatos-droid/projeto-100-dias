import { test, expect, type Page } from '@playwright/test';
import { abreGuia } from './guia-real';

/* Organograma de "A escalação do time" no Resumo (RES-09): chefia no topo, um ramo por área, cargos em três estados. */
/* tabela nova: Chefia, duas pessoas, uma vaga com "*" e uma linha sem pessoa */
const NOVA = {
  'm2.on': '0|1|2|3|4', 'm2.n': '5',
  'm2.f1': 'Paulo Ribeiro', 'm2.p1.nome_cargo': 'Chefe de gabinete', 'm2.p1.cat': 'Chefia', 'm2.p1.coord': 'Chefia de área',
  'm2.f2': 'Ana Furtado', 'm2.p2.nome_cargo': 'Coord. Legislativo', 'm2.p2.cat': 'Coordenação', 'm2.p2.coord': 'Legislativo',
  'm2.f3': 'Dani Pires', 'm2.p3.nome_cargo': 'Coord. Comunicação', 'm2.p3.cat': 'Coordenação', 'm2.p3.coord': 'Comunicação',
  'm2.f4': '*', 'm2.p4.nome_cargo': 'Vídeo-maker', 'm2.p4.cat': 'Executora', 'm2.p4.coord': 'Comunicação',
  'm2.f5': '', 'm2.p5.nome_cargo': 'Motorista', 'm2.p5.cat': 'Executora', 'm2.p5.coord': 'Logística',
};
/* formato antigo (sem m2.n): só nomes nas cadeiras do modelo; área e cargo vêm do modelo, como a tabela da Missão 2 mostra */
const ANTIGA = { 'm2.f1': 'Paulo', 'm2.f2': 'Ana', 'm2.f8': 'Dani', 'm2.f12': '*', 'm2.f20': 'Rui' };

async function abre(page: Page, campos: Record<string, string>, feitos: Record<string, boolean> = {}) {
  await abreGuia(page, '#/resumo', { dados: { campos, feitos } });
  await expect(page.locator('#tela .seg')).toHaveCount(5);
}
const corpo = (page: Page) => page.locator('#tela details.ex:has(a.ex-link[href="#/m/2/m2.funcoes"]) .ex-corpo');

test('com 1 chefia, 2 pessoas, 1 vaga com "*" e 1 linha vazia: 2 cartões comuns, 1 tracejado e 1 apagado (RES-09.3)', async ({ page }) => {
  await abre(page, NOVA);
  const org = corpo(page).locator('.org');
  await expect(org.locator('.org-raiz .car')).toHaveText(['Chefe de gabinetePaulo Ribeiro']);
  const ram = org.locator('.org-ram');
  await expect(ram.locator('.car:not(.vaga):not(.aberto)')).toHaveCount(2);
  const vaga = ram.locator('.car.vaga');
  await expect(vaga).toHaveCount(1);
  await expect(vaga.locator('strong')).toHaveText('Processo seletivo a abrir');
  await expect(vaga).toHaveCSS('border-top-style', 'dashed');
  const aberto = ram.locator('.car.aberto');
  await expect(aberto).toHaveCount(1);
  await expect(aberto.locator('strong')).toHaveText('Sem nome');
  await expect(aberto.locator('strong')).toHaveCSS('font-style', 'italic');
  await expect(aberto.locator('strong')).toHaveCSS('color', 'rgb(147, 135, 128)'); // --tinta-3, apagado
});

test('cada cartão mostra o cargo e, em destaque, a pessoa; os ramos seguem a ordem de COORDENACOES (RES-09.1, RES-09.3)', async ({ page }) => {
  await abre(page, NOVA);
  const ram = corpo(page).locator('.org-ram');
  await expect(ram.locator('.ram h5')).toHaveText(['Comunicação', 'Legislativo', 'Logística']);
  const ana = ram.locator('.car', { hasText: 'Ana Furtado' });
  await expect(ana.locator('small')).toHaveText('Coord. Legislativo');
  await expect(ana.locator('strong')).toHaveText('Ana Furtado');
  await expect(ram.locator('.ram').first().locator('.car strong')).toHaveText(['Dani Pires', 'Processo seletivo a abrir']);
});

test('a legenda mostra os três estados (RES-09.4)', async ({ page }) => {
  await abre(page, NOVA);
  await expect(corpo(page).getByLabel('Legenda do organograma')).toHaveText(/Preenchido.*Processo seletivo a abrir.*Ainda sem nome/);
  await expect(corpo(page).locator('.org-leg > span')).toHaveText(['Preenchido', 'Processo seletivo a abrir', 'Ainda sem nome']);
});

test('no computador os ramos ficam lado a lado, ligados à chefia por linhas (RES-09.1)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await abre(page, NOVA);
  const tops = await corpo(page).locator('.ram').evaluateAll((rs) => rs.map((r) => Math.round(r.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);
  expect(await corpo(page).locator('.org-ram').evaluate((e) => getComputedStyle(e, '::before').display)).toBe('block');
  expect(await corpo(page).locator('.ram').first().evaluate((e) => getComputedStyle(e, '::before').display)).toBe('block');
});

test('a 600 px os ramos ficam em coluna única e as linhas de ligação somem (RES-09.6)', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 900 });
  await abre(page, NOVA);
  const lefts = await corpo(page).locator('.ram').evaluateAll((rs) => rs.map((r) => Math.round(r.getBoundingClientRect().left)));
  expect(lefts).toHaveLength(3);
  expect(new Set(lefts).size).toBe(1);
  for (const [sel, pseudo] of [['.org-ram', '::before'], ['.ram', '::before'], ['.org-raiz', '::after']] as const) {
    expect(await corpo(page).locator(sel).first().evaluate((e, p) => getComputedStyle(e, p).display, pseudo), sel).toBe('none');
  }
});

test('sem linhas ativas, o corpo da escalação mostra "não preenchido" (RES-09.7)', async ({ page }) => {
  await abre(page, {}, { 'm2.funcoes': true });
  await expect(corpo(page).locator('[data-ilha="resumo-equipe"]')).toHaveText('não preenchido');
  await expect(corpo(page).locator('.org')).toHaveCount(0);
});

test('mandato no formato antigo mostra o organograma da vista derivada, como a tabela da Missão 2 (RES-09.5)', async ({ page }) => {
  await abre(page, ANTIGA);
  const org = corpo(page).locator('.org');
  await expect(org.locator('.org-raiz .car strong')).toHaveText('Paulo');
  await expect(org.locator('.ram h5')).toHaveText(['Comunicação', 'Legislativo', 'Articulação de aliados', 'Logística']);
  await expect(org.locator('.ram', { hasText: 'Articulação de aliados' }).locator('.car.vaga')).toHaveCount(1);
  await expect(org.locator('.ram', { hasText: 'Logística' }).locator('.car strong')).toHaveText(['Rui']);
  /* as áreas derivadas são as da tabela da Missão 2 (padrão de cada cadeira do modelo) */
  await expect(org.locator('.ram', { hasText: 'Legislativo' }).locator('.car strong')).toHaveText(['Ana']);
  await expect(org.locator('.ram', { hasText: 'Comunicação' }).locator('.car strong')).toHaveText(['Dani']);
});
