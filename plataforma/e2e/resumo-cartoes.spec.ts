import { test, expect, type Page } from '@playwright/test';
import { abreGuia } from './guia-real';

/* Cartões de aliados, opositores e potenciais no Resumo (RES-07): três grupos com contagem, anel da foto por grupo. */
const rel = (status: string, nome: string, extra: Record<string, unknown> = {}) =>
  ({ status, nome, partido: 'PSB', cargo: 'Deputado(a) Estadual', uf: 'SP', ...extra });
const RELACOES = {
  '1001': rel('aliado', 'ANA ALVES', { votos: 97335 }), '1002': rel('aliado', 'BETO BRAGA'), '1003': rel('aliado', 'CARLA CRUZ'),
  '2001': rel('concorrente', 'DAVI DIAS', { votos: 54332 }), '2002': rel('concorrente', 'EVA ESTEVES'),
  '3001': rel('potencial', 'FABIO FARIA', { partido: 'PSD' }),
};

async function abre(page: Page, dados: Record<string, unknown>) {
  await page.route('**/resultados.tse.jus.br/**', (r) => r.abort()); // sem rede: a inicial fica visível
  await abreGuia(page, '#/resumo', { dados });
  await expect(page.locator('#tela .seg')).toHaveCount(5);
}
const conj = (page: Page) => page.locator('#tela details.ex:has(a.ex-link[href="#/m/1/m1.conjuntura"]) .ex-corpo');

test('com 3 aliados, 2 opositores e 1 potencial na Casa: três grupos com contagens 3, 2 e 1 e um cartão por pessoa (RES-07.1)', async ({ page }) => {
  await abre(page, { relacoes: RELACOES });
  const c = conj(page);
  await expect(c.locator('.grp')).toHaveText(['Aliados · 3', 'Oponentes · 2', 'Indefinidas · 1']);
  await expect(c.locator('.cards.al .pessoa')).toHaveCount(3);
  await expect(c.locator('.cards.op .pessoa')).toHaveCount(2);
  await expect(c.locator('.cards.po .pessoa')).toHaveCount(1);
});

test('o cartão mostra a inicial, o nome, o partido, o cargo e "{votos} votos" em pt-BR; sem votos, sem a linha (RES-07.2)', async ({ page }) => {
  await abre(page, { relacoes: RELACOES });
  const ana = conj(page).locator('.pessoa', { hasText: 'Ana Alves' });
  await expect(ana.locator('.foto')).toContainText('A');
  await expect(ana.locator('strong')).toHaveText('Ana Alves');
  await expect(ana.locator('.meta')).toHaveText('PSB · Deputado(a) Estadual');
  await expect(ana.locator('.votos')).toHaveText('97.335 votos');
  await expect(conj(page).locator('.pessoa', { hasText: 'Beto Braga' }).locator('.votos')).toHaveCount(0);
});

test('o anel da foto é verde para aliado, coral para opositor e roxo para potencial (RES-07.3)', async ({ page }) => {
  await abre(page, { relacoes: RELACOES });
  const anel = (cl: string) => conj(page).locator(`.cards.${cl} .foto`).first().evaluate((e) => getComputedStyle(e).boxShadow);
  expect(await anel('al')).toContain('rgb(3, 82, 82)');
  expect(await anel('op')).toContain('rgb(235, 84, 84)');
  expect(await anel('po')).toContain('rgb(186, 107, 237)');
});

/* A Missão 1 reestruturada removeu a pergunta do município (PAR-13): a relação gravada com município não tem mais onde aparecer
   no Resumo, e a Casa Legislativa segue só com as relações sem município (RES-07.4). */
test('grupo sem pessoas não aparece; a relação com município fica fora da pergunta da Casa (RES-07.2, RES-07.4, PAR-13)', async ({ page }) => {
  await abre(page, { relacoes: { a: rel('aliado', 'ANA ALVES'), m: rel('concorrente', 'MARIO MELO', { mun: 'Campinas' }) } });
  const c = conj(page);
  await expect(c.locator('.grp')).toHaveText(['Aliados · 1']);
  await expect(c.locator('.grp.po')).toHaveCount(0);
  await expect(c.locator('.pessoa', { hasText: 'Mario Melo' })).toHaveCount(0);
  await expect(c.locator('.pessoa', { hasText: 'Ana Alves' }).locator('.meta')).not.toContainText('Campinas');
});

test('sem nenhuma relação a pergunta mostra "Nada classificado ainda." (LEG-13) e não há cartões (RES-07.5)', async ({ page }) => {
  await abre(page, { campos: { 'm1.q5': 'Partido com 2 cadeiras' }, relacoes: {} });
  const c = conj(page);
  await expect(c.locator('.pessoa')).toHaveCount(0);
  await expect(c.locator('dt', { hasText: 'Relação com os parlamentares' }).locator('+ dd')).toHaveText('Nada classificado ainda.');
});

test('a 375 px os cartões cabem na tela sem rolagem horizontal (RES-13.5)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await abre(page, { relacoes: RELACOES });
  await expect(conj(page).locator('.pessoa').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
