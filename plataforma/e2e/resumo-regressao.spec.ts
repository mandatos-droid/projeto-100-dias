import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { abreGuia, MANDATO_REAL } from './guia-real';

/* Regressão e acessibilidade da tela #/resumo: o que não pode mudar (download, Painel), teclado, nomes acessíveis,
   pt-BR, voltar à tela e mandatos vazio e completo (RES-12, RES-13, RES-05, RES-01.6). */
const IDS = ['m1.persona', 'm1.conjuntura', 'm1.oportunidades', 'm1.frag', 'm2.funcoes', 'm2.gestao', 'm3.bandeiras', 'm3.legado',
  'm3.preditores', 'm3.metas', 'm4.comissoes', 'm4.acoes', 'm4.metricas', 'm5.monit', 'm5.feedback', 'm5.imersao'];
const CURTOS = ['Prepare sua chegada', 'Estruture a equipe', 'Defina o rumo', 'Construa capital político', 'Garanta o avanço'];

/* globais do Guia legado, lidas dentro da página */
type Legado = {
  D: { feitos: Record<string, boolean> };
  Store: { salvar(): void };
  Resumo: { missao(m: unknown): string };
  MISSOES: unknown[];
};

/* mandato com respostas, relações, fragilidades, itens sociais, equipe e TSE: exercita cartões, selos, tabela e organograma */
const rel = (status: string, nome: string, votos?: number) => ({ status, nome, partido: 'PSB', cargo: 'Deputado(a) Estadual', uf: 'SP', ...(votos ? { votos } : {}) });
const RICO = {
  campos: {
    'm1.q1': 'Professora da rede pública e sindicalista', 'm1.q7': 'Expectativas do eleitorado de São Paulo',
    'm2.on': '0|1', 'm2.n': '2', 'm2.f1': 'Paulo Ribeiro', 'm2.p1.nome_cargo': 'Chefe de gabinete', 'm2.p1.cat': 'Chefia', 'm2.p1.coord': 'Chefia de área',
    'm2.f2': 'Ana Furtado', 'm2.p2.nome_cargo': 'Coord. Legislativo', 'm2.p2.cat': 'Coordenação', 'm2.p2.coord': 'Legislativo',
  },
  feitos: { 'm1.persona': true },
  frags: [{ t: 'Oratória em plenário', mp: 'P' }, { t: 'Gestão de emendas', mp: 'M' }],
  relacoes: { 1: rel('aliado', 'ANA ALVES', 97335), 2: rel('concorrente', 'DAVI DIAS', 54332) },
  social: { itens: [{ id: 's1', nivel: 'UF', tipo: 'problema', agenda: 'saude', texto: 'Fila de espera', uf: 'SP', alvos: [], nomes: ['São Paulo'] }] },
  tse: { sq: '250001234567', uf: 'SP', cargo: 'Deputado Estadual', nome: 'ANA SOUZA', partido: 'PT', votos: 97335, pos: 57 },
};

async function abre(page: Page, dados: Record<string, unknown>, hash = '#/resumo') {
  await page.route('**/resultados.tse.jus.br/**', (r) => r.abort()); // as fotos do TSE nunca saem da máquina
  await abreGuia(page, hash, { dados, mandato: { ...MANDATO_REAL, partido: 'PT' } });
}
async function abreResumo(page: Page, dados: Record<string, unknown>) {
  await abre(page, dados);
  await expect(page.locator('#tela .seg')).toHaveCount(5);
  await page.waitForLoadState('networkidle');
}
const seg = (page: Page, n: number) => page.getByRole('button', { name: `Ir para a Missão ${n}: ${CURTOS[n - 1]}` });

test('o arquivo baixado tem os títulos das missões e as respostas, e não tem a barra, os segmentos nem os cartões (RES-12.3)', async ({ page }) => {
  await abreResumo(page, RICO);
  await expect(page.locator('#tela .cards.al .pessoa')).toHaveCount(1); // na tela há cartões...
  const titulos = await page.locator('#tela .ex-link').allTextContents();
  expect(titulos).toHaveLength(16);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar resumo completo (HTML)' }).click();
  const html = readFileSync((await (await download).path())!, 'utf8');
  for (const t of titulos) expect(html, t).toContain(t.replace(/&/g, '&amp;'));
  for (const c of CURTOS) expect(html, c).toContain('Missão');
  expect(html).toContain('Professora da rede pública e sindicalista');
  expect(html).toContain('Expectativas do eleitorado de São Paulo');
  expect(html).toContain('<strong>Parceiros (1)</strong>'); // ...e o arquivo segue com a lista de texto
  expect(html).toContain('<strong>P</strong> — Oratória em plenário');
  for (const proibido of ['class="barra"', 'class="seg"', 'class="segs"', 'class="pessoa"', 'class="cards', 'class="grp', 'class="res2"',
    'class="frag"', 'table class="terr"', 'data-ilha=']) expect(html, proibido).not.toContain(proibido);
});

test('"Ver o que foi preenchido" no Painel mostra o mesmo conteúdo de Resumo.missao, sem cartões, selos nem ilhas (RES-12.2)', async ({ page }) => {
  await abre(page, RICO, '#/');
  const resp = page.locator('details.ml-resp').first();
  await resp.locator('summary').click();
  await expect(resp.locator('.ml-corpo')).not.toBeEmpty();
  const corpo = await resp.locator('.ml-corpo').innerHTML();
  const esperado = await page.evaluate(() => { const w = window as unknown as Legado; return w.Resumo.missao(w.MISSOES[0]); });
  expect(corpo).toBe(esperado);
  expect(corpo).toContain('Professora da rede pública e sindicalista');
  await expect(resp.locator('.pessoa, .grp, ul.frag, .ilha, .barra')).toHaveCount(0);
  expect(corpo).toContain('<strong>P</strong> — Oratória em plenário'); // as fragilidades e os parceiros, no texto de sempre
  expect(corpo).toContain('Parceiros (1)');
});

test('Enter e Espaço abrem e fecham um <summary> de missão e de exercício (RES-01.6, RES-13.3)', async ({ page }) => {
  await abreResumo(page, { campos: {} });
  const aberto = (seletor: string) => page.locator(seletor).first().evaluate((e) => (e as HTMLDetailsElement).open);
  const alterna = async (seletor: string, nome: string) => {
    await page.locator(seletor).first().locator('summary').first().focus();
    for (const tecla of ['Enter', 'Space']) {
      expect(await aberto(seletor), `${nome} fechado antes de ${tecla}`).toBe(false);
      await page.keyboard.press(tecla);
      expect(await aberto(seletor), `${nome} aberto por ${tecla}`).toBe(true);
      await page.keyboard.press(tecla);
      expect(await aberto(seletor), `${nome} fechado por ${tecla}`).toBe(false);
    }
  };
  await alterna('#tela details.missao', 'missão');
  await page.locator('#tela details.missao').first().locator('summary').first().focus();
  await page.keyboard.press('Enter'); // missão aberta: os exercícios dentro dela podem receber o foco
  await alterna('#tela details.missao:first-of-type details.ex', 'exercício');
});

test('Tab chega aos segmentos, em ordem, e Enter leva à missão sem mudar o endereço (RES-13.3)', async ({ page }) => {
  await abreResumo(page, { campos: {} });
  await page.getByRole('button', { name: 'Baixar resumo completo (HTML)' }).focus();
  await page.keyboard.press('Tab');
  await expect(seg(page, 1)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(seg(page, 2)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(seg(page, 3)).toBeFocused();
  const hash = await page.evaluate(() => location.hash);
  await page.keyboard.press('Enter');
  await expect(page.locator('#res-m3')).toHaveAttribute('open', '');
  await expect.poll(() => page.locator('#res-m3').evaluate((e) => Math.round(e.getBoundingClientRect().top)), { timeout: 5000 }).toBeLessThan(260);
  expect(await page.evaluate(() => location.hash)).toBe(hash);
});

test('todo controle da barra e das ferramentas tem nome acessível (RES-13.3)', async ({ page }) => {
  await abreResumo(page, RICO);
  const nomes = await page.locator('#tela .barra button, #tela .ferr button, #tela .ferr input').evaluateAll((els) =>
    els.map((e) => (e.getAttribute('aria-label') || (e as HTMLElement).innerText || e.closest('label')?.textContent || '').trim()));
  expect(nomes).toHaveLength(9); // baixar, 5 segmentos, expandir, recolher e a caixa do filtro
  expect(nomes.every(Boolean)).toBe(true);
  for (let n = 1; n <= 5; n++) await expect(seg(page, n)).toBeVisible();
});

test('mandato vazio: "0%", "0 de 16 exercícios concluídos", todas as missões fechadas e "16 exercícios ainda sem conclusão"', async ({ page }) => {
  await abreResumo(page, { campos: {} });
  await expect(page.locator('#tela .geral b')).toHaveText('0%');
  await expect(page.getByText('0 de 16 exercícios concluídos', { exact: true })).toBeVisible();
  await expect(page.locator('#tela details.missao')).toHaveCount(5);
  await expect(page.locator('#tela details.missao[open]')).toHaveCount(0);
  await expect(page.locator('#tela details.ex[open]')).toHaveCount(0);
  await expect(page.locator('#tela [aria-live="polite"]')).toHaveText('16 exercícios ainda sem conclusão');
});

test('mandato 100% concluído: "100%" e a frase de conclusão', async ({ page }) => {
  await abreResumo(page, { campos: {}, feitos: Object.fromEntries(IDS.map((id) => [id, true])) });
  await expect(page.locator('#tela .geral b')).toHaveText('100%');
  await expect(page.getByText('16 de 16 exercícios concluídos', { exact: true })).toBeVisible();
  await expect(page.locator('#tela [aria-live="polite"]')).toHaveText('Todos os exercícios estão concluídos.');
});

test('sair e voltar a #/resumo redesenha com os dados atuais e mantém um único conjunto de ouvintes (edge case)', async ({ page }) => {
  await page.addInitScript(() => {
    const ativos = new Map<string, Set<unknown>>();
    (window as unknown as { __ativos: typeof ativos }).__ativos = ativos;
    const add = window.addEventListener.bind(window), rem = window.removeEventListener.bind(window);
    window.addEventListener = ((k: string, f: unknown, o?: unknown) => {
      if (!ativos.has(k)) ativos.set(k, new Set());
      ativos.get(k)!.add(f);
      return add(k, f as EventListener, o as boolean);
    }) as typeof add;
    window.removeEventListener = ((k: string, f: unknown, o?: unknown) => {
      ativos.get(k)?.delete(f);
      return rem(k, f as EventListener, o as boolean);
    }) as typeof rem;
  });
  await abreResumo(page, { campos: {} });
  await expect(page.locator('#tela .geral b')).toHaveText('0%');
  const conta = () => page.evaluate(() => {
    const a = (window as unknown as { __ativos: Map<string, Set<unknown>> }).__ativos;
    return ['scroll', 'beforeprint', 'afterprint'].map((k) => a.get(k)?.size ?? 0);
  });
  const base = await conta(); // o Guia tem os seus próprios ouvintes de scroll; a tela soma um de cada
  expect(base.slice(1)).toEqual([1, 1]);
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => { location.hash = '#/'; });
    await expect(page.locator('#tela .seg')).toHaveCount(0);
    if (i === 1) { // um exercício concluído enquanto a tela estava fora
      await page.evaluate(() => { const w = window as unknown as Legado; w.D.feitos['m1.persona'] = true; w.Store.salvar(); });
    }
    await page.evaluate(() => { location.hash = '#/resumo'; });
    await expect(page.locator('#tela .seg')).toHaveCount(5);
  }
  expect(await conta()).toEqual(base);
  await expect(page.locator('#tela .geral b')).toHaveText('6%');
  await expect(page.getByText('1 de 16 exercícios concluídos', { exact: true })).toBeVisible();
  await expect(page.locator('#res-m1')).toHaveAttribute('open', '');
});

test('a 375 px, com cartões, selos, tabela e organograma abertos, a página não tem rolagem horizontal (RES-13.5)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await abreResumo(page, RICO);
  await page.getByRole('button', { name: 'Expandir tudo' }).click();
  await expect(page.locator('#tela .pessoa').first()).toBeVisible();
  await expect(page.locator('#tela table.terr')).toBeVisible();
  await expect(page.locator('#tela .org')).toBeVisible();
  await expect(page.locator('#tela ul.frag li')).toHaveCount(2);
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(m.sw).toBeLessThanOrEqual(m.cw);
});

test('os números usam pt-BR e algarismos tabulares: votos com ponto de milhar no retrato e nos cartões (RES-13.6)', async ({ page }) => {
  await abreResumo(page, RICO);
  await expect(page.locator('#tela .stat').first().locator('b')).toHaveText('97.335');
  await expect(page.locator('#tela .pessoa .votos').first()).toHaveText('97.335 votos');
  await expect(page.locator('#tela .pessoa .votos').nth(1)).toHaveText('54.332 votos');
  for (const seletor of ['#tela .geral b', '#tela .stat b', '#tela .pessoa .votos', '#tela .m-cont b', '#tela .ex-n', '#tela .seg .t span:last-child']) {
    const v = await page.locator(seletor).first().evaluate((e) => getComputedStyle(e).fontVariantNumeric);
    expect(v, seletor).toContain('tabular-nums');
  }
});

test('as fragilidades aparecem com selo M verde e P vinho na tela (RES-11.1)', async ({ page }) => {
  await abreResumo(page, RICO);
  const lista = page.locator('#tela ul.frag li');
  await expect(lista).toHaveCount(2);
  await expect(lista.nth(0).locator('b')).toHaveText('P');
  await expect(lista.nth(0).locator('b')).toHaveCSS('background-color', 'rgb(87, 23, 48)');
  await expect(lista.nth(1).locator('b')).toHaveText('M');
  await expect(lista.nth(1).locator('b')).toHaveCSS('background-color', 'rgb(3, 82, 82)');
  await expect(lista.nth(0)).toContainText('Oratória em plenário');
});
