import { test, expect, type Page } from '@playwright/test';
import { abreGuia } from './guia-real';

/* Resumo do preenchimento reestruturado (#/resumo): barra com progresso e segmentos, ação única, ferramentas da lista,
   rolagem e impressão. O Guia abre de verdade em modo local (guia-real.ts); o estado de cada exercício vem de D.feitos. */
const IDS = ['m1.persona', 'm1.conjuntura', 'm1.oportunidades', 'm1.frag', 'm2.funcoes', 'm2.gestao', 'm3.bandeiras', 'm3.legado',
  'm3.preditores', 'm3.metas', 'm4.comissoes', 'm4.acoes', 'm4.metricas', 'm5.monit', 'm5.feedback', 'm5.imersao'];
const SEIS = ['m1.persona', 'm1.conjuntura', 'm1.oportunidades', 'm2.funcoes', 'm3.bandeiras', 'm3.legado'];
const CURTOS = ['Prepare sua chegada', 'Estruture a equipe', 'Defina o rumo', 'Construa capital político', 'Garanta o avanço'];

async function abreResumo(page: Page, feitos: string[]) {
  await abreGuia(page, '#/resumo', { dados: { campos: {}, feitos: Object.fromEntries(feitos.map((id) => [id, true])) } });
  await expect(page.locator('#tela .seg')).toHaveCount(5);
  await expect(page.locator('#tela .retrato')).toBeVisible();
  await page.waitForLoadState('networkidle'); // ilhas do Resumo (retrato, mapas) já carregaram: a página não muda mais de altura
}
const seg = (page: Page, n: number) => page.getByRole('button', { name: `Ir para a Missão ${n}: ${CURTOS[n - 1]}` });
const missao = (page: Page, n: number) => page.locator(`#res-m${n}`);
const abertos = (page: Page) => page.locator('#tela details').evaluateAll((ds) => ds.map((d) => (d as HTMLDetailsElement).open));
const topo = (page: Page, n: number) => missao(page, n).evaluate((d) => d.getBoundingClientRect().top);

test('a barra mostra 38% e "6 de 16 exercícios concluídos" e um segmento por missão com "Mn · título" e feitos/total (RES-02.1, RES-02.2)', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await abreResumo(page, SEIS);
  const barra = page.locator('#tela .barra');
  await expect(barra.locator('.geral b')).toHaveText('38%');
  await expect(barra.getByText('6 de 16 exercícios concluídos', { exact: true })).toBeVisible();
  const contas = ['3/4', '1/2', '2/4', '0/3', '0/3'];
  for (let n = 1; n <= 5; n++) {
    await expect(seg(page, n)).toContainText(`M${n} · ${CURTOS[n - 1]}`);
    await expect(seg(page, n)).toContainText(contas[n - 1]);
  }
  await expect(seg(page, 1)).toHaveAttribute('style', /--p:75%/);
  await expect(barra.locator('.seg')).toHaveText(CURTOS.map((c, i) => new RegExp(`^M${i + 1} · ${c}`)));
  expect(erros).toEqual([]);
});

test('sem nenhuma resposta: 0%, "0 de 16 exercícios concluídos", todas as missões fechadas e "16 exercícios ainda sem conclusão" (edge case)', async ({ page }) => {
  await abreResumo(page, []);
  await expect(page.locator('#tela .geral b')).toHaveText('0%');
  await expect(page.getByText('0 de 16 exercícios concluídos', { exact: true })).toBeVisible();
  await expect(page.locator('#tela details.missao[open]')).toHaveCount(0);
  await expect(page.locator('#tela [aria-live="polite"]')).toHaveText('16 exercícios ainda sem conclusão');
});

test('com tudo concluído: 100% e "Todos os exercícios estão concluídos."; com o filtro, "Nenhum exercício pendente." (RES-04.9, RES-04.10)', async ({ page }) => {
  await abreResumo(page, IDS);
  await expect(page.locator('#tela .geral b')).toHaveText('100%');
  await expect(page.getByText('16 de 16 exercícios concluídos', { exact: true })).toBeVisible();
  await expect(page.locator('#tela [aria-live="polite"]')).toHaveText('Todos os exercícios estão concluídos.');
  await expect(page.getByText('Nenhum exercício pendente.')).toBeHidden();
  await page.getByLabel('Mostrar só o que falta preencher').check();
  await expect(page.getByText('Nenhum exercício pendente.')).toBeVisible();
  await expect(page.locator('#tela details.missao:visible')).toHaveCount(0);
});

test('clicar em um segmento abre a missão e a leva ao topo, sem mudar o endereço (RES-02.3)', async ({ page }) => {
  await abreResumo(page, SEIS);
  await expect(missao(page, 4)).not.toHaveAttribute('open', '');
  await seg(page, 4).click();
  await expect(missao(page, 4)).toHaveAttribute('open', '');
  await expect(missao(page, 4)).toBeInViewport();
  await expect.poll(() => topo(page, 4)).toBeLessThan(200);
  await seg(page, 2).click();
  await expect.poll(() => topo(page, 2)).toBeGreaterThanOrEqual(0);
  await expect.poll(() => topo(page, 2)).toBeLessThan(200);
  expect(await page.evaluate(() => location.hash)).toBe('#/resumo');
});

test('ao rolar, o segmento da última missão com o topo a 160 px ou menos fica com aria-current="true"; no topo, o da Missão 1 (RES-02.4)', async ({ page }) => {
  await abreResumo(page, SEIS);
  await page.getByRole('button', { name: 'Expandir tudo' }).click();
  await page.evaluate(() => window.scrollTo({ top: document.getElementById('res-m3')!.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }));
  await expect(seg(page, 3)).toHaveAttribute('aria-current', 'true');
  for (const n of [1, 2, 4, 5]) await expect(seg(page, n)).toHaveAttribute('aria-current', 'false');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(seg(page, 1)).toHaveAttribute('aria-current', 'true');
  for (const n of [2, 3, 4, 5]) await expect(seg(page, n)).toHaveAttribute('aria-current', 'false');
});

test('a única ação é "Baixar resumo completo (HTML)": baixa regimento-<nome>-completo.html e avisa; sem "Gerar PDF" nem JSON (RES-03)', async ({ page }) => {
  await abreResumo(page, SEIS);
  await expect(page.locator('#tela .barra button.bt')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Gerar PDF/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /JSON/ })).toHaveCount(0);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar resumo completo (HTML)' }).click();
  expect((await download).suggestedFilename()).toBe('regimento-ana-souza-completo.html');
  await expect(page.locator('#toast')).toHaveText('Resumo completo baixado.');
});

test('"Expandir tudo" abre todas as missões e exercícios; "Recolher tudo" fecha todos (RES-04.7)', async ({ page }) => {
  await abreResumo(page, SEIS);
  await page.getByRole('button', { name: 'Expandir tudo' }).click();
  expect(await abertos(page)).toEqual(Array(21).fill(true));
  await page.getByRole('button', { name: 'Recolher tudo' }).click();
  expect(await abertos(page)).toEqual(Array(21).fill(false));
});

test('"Mostrar só o que falta preencher" oculta exercícios concluídos e missões todas concluídas e, desmarcada, devolve tudo como estava (RES-04.8)', async ({ page }) => {
  await abreResumo(page, [...SEIS, 'm1.frag']);
  await expect(page.locator('#tela [aria-live="polite"]')).toHaveText('9 exercícios ainda sem conclusão');
  await missao(page, 4).evaluate((d) => { (d as HTMLDetailsElement).open = true; }); // abre uma missão à mão
  const antes = await abertos(page);
  await page.getByLabel('Mostrar só o que falta preencher').check();
  await expect(missao(page, 1)).toBeHidden();
  await expect(page.locator('#tela details.ex[data-estado="ok"]:visible')).toHaveCount(0);
  await expect(missao(page, 2)).toBeVisible();
  await expect(missao(page, 2).locator('details.ex:visible')).toHaveCount(1);
  await page.getByLabel('Mostrar só o que falta preencher').uncheck();
  await expect(missao(page, 1)).toBeVisible();
  await expect(page.locator('#tela details[hidden]')).toHaveCount(0);
  expect(await abertos(page)).toEqual(antes);
});

test('com 15 de 16 concluídos o contador diz "1 exercício ainda sem conclusão" (RES-04.9)', async ({ page }) => {
  await abreResumo(page, IDS.slice(0, 15));
  await expect(page.locator('#tela [aria-live="polite"]')).toHaveText('1 exercício ainda sem conclusão');
});

test('beforeprint abre todos os blocos e afterprint devolve cada um ao estado anterior (RES-05.1)', async ({ page }) => {
  await abreResumo(page, SEIS);
  await missao(page, 1).locator('details.ex').first().evaluate((d) => { (d as HTMLDetailsElement).open = false; }); // fecha um exercício à mão
  const antes = await abertos(page);
  expect(antes).toContain(false);
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  expect(await abertos(page)).toEqual(Array(21).fill(true));
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  expect(await abertos(page)).toEqual(antes);
});

test('sair e voltar a #/resumo não acumula ouvintes de scroll, beforeprint e afterprint na janela (edge case)', async ({ page }) => {
  await page.addInitScript(() => {
    const ativos: Record<string, Set<unknown>> = { scroll: new Set(), beforeprint: new Set(), afterprint: new Set() };
    const add = window.addEventListener, rem = window.removeEventListener;
    window.addEventListener = function (this: Window, t: string, f: EventListenerOrEventListenerObject, o?: boolean | AddEventListenerOptions) {
      ativos[t]?.add(f); return add.call(this, t, f, o);
    } as typeof window.addEventListener;
    window.removeEventListener = function (this: Window, t: string, f: EventListenerOrEventListenerObject, o?: boolean | EventListenerOptions) {
      ativos[t]?.delete(f); return rem.call(this, t, f, o);
    } as typeof window.removeEventListener;
    (window as unknown as { __ativos: () => Record<string, number> }).__ativos = () => Object.fromEntries(Object.entries(ativos).map(([k, s]) => [k, s.size]));
  });
  await abreResumo(page, SEIS);
  const ativos = () => page.evaluate(() => (window as unknown as { __ativos: () => Record<string, number> }).__ativos());
  const primeira = await ativos();
  expect(primeira.beforeprint).toBeGreaterThanOrEqual(1);
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => { location.hash = '#/'; });
    await expect(page.locator('#tela .seg')).toHaveCount(0);
    await page.evaluate(() => { location.hash = '#/resumo'; });
    await expect(page.locator('#tela .seg')).toHaveCount(5);
  }
  expect(await ativos()).toEqual(primeira);
});
