import { test, expect, type Page } from '@playwright/test';
import { abreGuia } from './guia-real';

/* Layout do Resumo reestruturado (ilhas.css, bloco "Resumo reestruturado"): barra fixa no topo (abaixo do .topo-movel no
   celular), título da missão livre da barra, ação no rodapé até 61,25rem, 375 px sem rolagem lateral, impressão,
   movimento reduzido e foco visível. */
const SEIS = ['m1.persona', 'm1.conjuntura', 'm1.oportunidades', 'm2.funcoes', 'm3.bandeiras', 'm3.legado'];

async function abreResumo(page: Page, largura: number, altura = 800) {
  await page.setViewportSize({ width: largura, height: altura });
  await abreGuia(page, '#/resumo', { dados: { campos: {}, feitos: Object.fromEntries(SEIS.map((id) => [id, true])) } });
  await expect(page.locator('#tela .res2 .seg')).toHaveCount(5);
}
const caixa = (page: Page, sel: string) => page.locator(sel).first().evaluate((e) => {
  const r = e.getBoundingClientRect();
  return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width };
});
const rola = (page: Page, y: number) => page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y);

test('a barra continua no topo depois de rolar 1.500 px; no celular, logo abaixo do .topo-movel (RES-02.4)', async ({ page }) => {
  await abreResumo(page, 1280);
  await page.getByRole('button', { name: 'Expandir tudo' }).click();
  await rola(page, 1500);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThanOrEqual(1500);
  await expect.poll(async () => Math.abs((await caixa(page, '#tela .barra')).top)).toBeLessThanOrEqual(1);
  await expect(page.locator('#tela .barra')).toBeInViewport();

  await page.setViewportSize({ width: 800, height: 900 });
  await rola(page, 0);
  await rola(page, 1500);
  await expect(page.locator('.topo-movel')).toBeVisible();
  const topo = await caixa(page, '.topo-movel');
  expect(topo.bottom).toBeGreaterThan(0);
  await expect.poll(async () => Math.abs((await caixa(page, '#tela .barra')).top - topo.bottom)).toBeLessThanOrEqual(1);
});

test('depois de clicar em um segmento, o título da missão fica visível logo abaixo da barra (RES-02.5)', async ({ page }) => {
  for (const largura of [1280, 800]) {
    await abreResumo(page, largura);
    await page.getByRole('button', { name: 'Expandir tudo' }).click();
    await page.getByRole('button', { name: 'Ir para a Missão 3: Defina o rumo' }).click();
    await expect.poll(async () => (await caixa(page, '#res-m3 .m-tit')).top - (await caixa(page, '#tela .barra')).bottom).toBeGreaterThanOrEqual(0);
    await expect.poll(async () => (await caixa(page, '#res-m3')).top - (await caixa(page, '#tela .barra')).bottom).toBeLessThan(40);
    await expect(page.locator('#res-m3 .m-tit')).toBeInViewport();
  }
});

test('a 800 px o botão de download fica fixo no rodapé, na largura toda; a 1.280 px fica na barra (RES-03, RES-02.8)', async ({ page }) => {
  await abreResumo(page, 800, 900);
  const acoes = page.locator('#tela .acoes');
  await expect(acoes).toHaveCSS('position', 'fixed');
  const a = await caixa(page, '#tela .acoes');
  expect(a.left).toBe(0);
  expect(a.width).toBe(800);
  expect(Math.round(a.bottom)).toBe(900);
  await rola(page, 1200);
  await expect(page.getByRole('button', { name: 'Baixar resumo completo (HTML)' })).toBeInViewport();
  const regra = await page.evaluate(() => [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } })
    .flatMap((r) => (r instanceof CSSMediaRule ? [...r.cssRules] : [r])).map((r) => r.cssText)
    .find((t) => t.startsWith('#tela .res2 .acoes') && t.includes('position: fixed')));
  expect(regra).toContain('env(safe-area-inset-bottom)');

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(acoes).not.toHaveCSS('position', 'fixed');
  const barra = await caixa(page, '#tela .barra');
  const bt = await caixa(page, '#tela .acoes .bt');
  expect(bt.top).toBeGreaterThanOrEqual(barra.top);
  expect(bt.bottom).toBeLessThanOrEqual(barra.bottom);
});

test('a 375 px a página não rola na horizontal e os segmentos rolam dentro da barra (RES-13.5, RES-02.8)', async ({ page }) => {
  await abreResumo(page, 375, 812);
  await page.getByRole('button', { name: 'Expandir tudo' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const segs = page.locator('#tela .segs');
  await expect(segs).toHaveCSS('overflow-x', 'auto');
  expect(await segs.evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true);
  expect(await segs.evaluate((e) => { e.scrollLeft = 120; return e.scrollLeft; })).toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollX)).toBe(0);
});

test('na impressão a barra e as ferramentas somem e, após beforeprint, todos os blocos estão abertos (RES-05.2)', async ({ page }) => {
  await abreResumo(page, 1280);
  await expect(page.locator('#tela details.missao:not([open])')).not.toHaveCount(0);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#tela .barra')).toBeHidden();
  await expect(page.locator('#tela .ferr')).toBeHidden();
  await expect(page.locator('#tela .chev').first()).toBeHidden();
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  expect(await page.locator('#tela details').evaluateAll((ds) => ds.every((d) => (d as HTMLDetailsElement).open))).toBe(true);
  await expect(page.locator('#res-m5 .m-tit')).toBeVisible();
});

test('com movimento reduzido a rolagem é instantânea e sem transição (RES-13.4)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await abreResumo(page, 1280);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  await expect(page.locator('#tela .seg .f i').first()).toHaveCSS('transition-duration', '0s');
  await expect(page.locator('#tela .chev').first()).toHaveCSS('transition-duration', '0s');
  await page.getByRole('button', { name: 'Expandir tudo' }).click();
  await page.getByRole('button', { name: 'Ir para a Missão 3: Defina o rumo' }).click();
  const imediato = (await caixa(page, '#res-m3')).top - (await caixa(page, '#tela .barra')).bottom; // sem esperar: já chegou
  expect(imediato).toBeGreaterThanOrEqual(0);
  expect(imediato).toBeLessThan(40);
});

test('todo botão, a chave e cada <summary> mostram anel de foco ao receber Tab (RES-13.3)', async ({ page }) => {
  await abreResumo(page, 1280);
  const vistos = new Map<string, boolean>();
  for (let i = 0; i < 90 && !(vistos.has('summary.ex') && vistos.has('summary.missao')); i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      const e = document.activeElement as HTMLElement | null;
      if (!e || !e.closest('#tela .res2')) return null;
      const s = getComputedStyle(e);
      const tipo = e.tagName === 'SUMMARY' ? `summary.${e.parentElement!.className}` : e.tagName === 'INPUT' ? 'chave'
        : e.classList.contains('seg') ? `seg${e.dataset.n}` : e.tagName === 'BUTTON' ? e.textContent!.trim() : null;
      return tipo ? { tipo, anel: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 } : null;
    });
    if (f) vistos.set(f.tipo, f.anel);
  }
  for (const k of ['Baixar resumo completo (HTML)', 'seg1', 'seg2', 'seg3', 'seg4', 'seg5', 'Expandir tudo', 'Recolher tudo', 'chave', 'summary.missao', 'summary.ex']) {
    expect(vistos.get(k), k).toBe(true);
  }
});
