import { test, expect, type Page } from '@playwright/test';
import { abreGuia } from './guia-real';

/* Registro de uso das funcionalidades (ADM-14): o Guia real abre em modo local (NUVEM=false, como nos outros e2e) e,
   quando o teste precisa, liga a nuvem e a sessão em memória. Toda chamada ao Supabase é interceptada aqui: nada sai da máquina. */
interface Uso { url: string; auth: string; apikey: string; corpo: Record<string, unknown> }

async function intercepta(page: Page, resposta: 'ok' | 500 | 401 | 'rede' = 'ok') {
  const usos: Uso[] = [];
  await page.route((u) => u.hostname.endsWith('.supabase.co'), async (rota) => {
    const req = rota.request();
    if (req.method() === 'OPTIONS') return rota.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (!req.url().includes('/rest/v1/uso_funcionalidades')) return rota.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' }, body: '' });
    usos.push({ url: req.url(), auth: req.headers()['authorization'] ?? '', apikey: req.headers()['apikey'] ?? '', corpo: JSON.parse(req.postData() ?? '{}') });
    if (resposta === 'rede') return rota.abort('failed');
    if (resposta === 'ok') return rota.fulfill({ status: 201, headers: { 'access-control-allow-origin': '*' }, body: '' });
    return rota.fulfill({ status: resposta, headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'erro do banco' }) });
  });
  return usos;
}

/** Liga a nuvem e a sessão depois da abertura do Guia (que o abreGuia faz local), para a abertura seguinte registrar. */
const ligaNuvem = (page: Page) => page.evaluate(() => {
  const w = window as unknown as { NUVEM: boolean; Nuvem: { tok: string } };
  w.NUVEM = true;
  w.Nuvem.tok = 'tok-teste';
});
const reabre = (page: Page) => page.evaluate(() => (window as unknown as { Guia: { render(): void } }).Guia.render());
const HASH = '#/m/1/m1.conjuntura/1'; // tela com a ilha "calor" = funcionalidade conjuntura
const paraFora = (u: URL) => !['localhost', '127.0.0.1'].includes(u.hostname) && !u.hostname.endsWith('.supabase.co');

test.beforeEach(async ({ page }) => {
  // fontes e afins: bloqueados, só o Supabase interceptado tem resposta
  await page.route(paraFora, (r) => r.abort('blockedbyclient'));
});

test('abrir a funcionalidade grava 1 linha só com mandato_id, funcionalidade e criado_em (ADM-14.1, 14.2)', async ({ page }) => {
  const usos = await intercepta(page);
  await abreGuia(page, HASH);
  await ligaNuvem(page);
  await reabre(page);
  await expect.poll(() => usos.length).toBe(1);
  const [u] = usos;
  expect(u.url).toContain('/rest/v1/uso_funcionalidades');
  expect(Object.keys(u.corpo).sort()).toEqual(['criado_em', 'funcionalidade', 'mandato_id']);
  expect(u.corpo.mandato_id).toBe('m_teste');
  expect(u.corpo.funcionalidade).toBe('conjuntura');
  expect(Number.isNaN(Date.parse(String(u.corpo.criado_em)))).toBe(false);
  expect(u.auth).toBe('Bearer tok-teste');
  expect(u.apikey).not.toBe('');
});

test('repetir a abertura em 60 s não duplica a linha (ADM-14.5)', async ({ page }) => {
  const usos = await intercepta(page);
  await abreGuia(page, HASH);
  await ligaNuvem(page);
  await reabre(page);
  await expect.poll(() => usos.length).toBe(1);
  await reabre(page);
  await reabre(page);
  await page.waitForTimeout(500);
  expect(usos).toHaveLength(1);
});

test('outra funcionalidade do mesmo mandato grava a sua própria linha (ADM-14.1)', async ({ page }) => {
  const usos = await intercepta(page);
  await abreGuia(page, HASH);
  await ligaNuvem(page);
  await reabre(page);
  await expect.poll(() => usos.length).toBe(1);
  await page.evaluate(() => { location.hash = '#/m/1/m1.persona/2'; });
  await expect.poll(() => usos.map((x) => x.corpo.funcionalidade)).toEqual(['conjuntura', 'persona']);
});

test('sem nuvem (NUVEM=false) não grava nada (ADM-14.4)', async ({ page }) => {
  const usos = await intercepta(page);
  await abreGuia(page, HASH);
  // só o flag NUVEM fica desligado: sessão e CONFIG existem, para a guarda `!tok` não mascarar a falta da guarda `!NUVEM`
  await page.evaluate(() => {
    const w = window as unknown as { Nuvem: { tok: string }; CONFIG?: { url: string; key: string } };
    w.Nuvem.tok = 'tok-teste';
    w.CONFIG ??= { url: 'https://teste.supabase.co', key: 'chave-teste' };
  });
  await reabre(page);
  await page.waitForTimeout(1000);
  expect(usos).toHaveLength(0);
  expect(await page.evaluate(() => {
    const w = window as unknown as { NUVEM: boolean; Nuvem: { tok: string }; CONFIG?: unknown };
    return [w.NUVEM, w.Nuvem.tok, !!w.CONFIG];
  })).toEqual([false, 'tok-teste', true]);
});

for (const falha of [500, 401, 'rede'] as const) {
  test(`erro do banco (${falha}) não aparece para a pessoa e não há nova tentativa (ADM-14.3)`, async ({ page }) => {
    const usos = await intercepta(page, falha);
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await abreGuia(page, HASH);
    await ligaNuvem(page);
    await reabre(page);
    await expect.poll(() => usos.length).toBe(1);
    await page.waitForTimeout(1500);
    expect(usos).toHaveLength(1); // sem nova tentativa
    expect(erros).toEqual([]);
    await expect(page.locator('#toast')).not.toHaveClass(/\bon\b/);
    await expect(page.locator('#tela')).toBeVisible(); // o Guia segue de pé
  });
}
