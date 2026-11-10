import { test, expect, type Page } from '@playwright/test';
import { naoMapeadas, semeiaSessao } from './convite-api';
import { ANA, leituras, mocaMandato, type EstadoMandato } from './mandato-api';

/* /mandato sem perfil: a casca manda ao formulário antes de ler os mandatos (PAG-02.1, 02.2, 02.16).
   Supabase todo interceptado; /primeiro-acesso vira página vazia. */

const SEM_PERFIL: EstadoMandato['ler'] = { perfis: () => ({ corpo: [] }) };
const DA_LEGISLA: EstadoMandato['ler'] = { equipe_legisla: () => ({ corpo: [{ user_id: 'uid-mariana' }] }) };
const corpo = (page: Page) => page.locator('.md-corpo');

async function abre(page: Page, estado: EstadoMandato) {
  await semeiaSessao(page, { access_token: 'tok-mariana', refresh_token: 'ref-mariana' });
  await mocaMandato(page, estado);
  await page.route((u) => ['localhost', '127.0.0.1'].includes(u.hostname) && u.pathname === '/primeiro-acesso', (rota) =>
    rota.fulfill({ status: 200, headers: { 'content-type': 'text/html' }, body: '<!doctype html><title>perfil</title><h1>Perfil aberto</h1>' }));
  await page.goto('/mandato');
}

test.afterEach(() => {
  expect(naoMapeadas()).toEqual([]);
});

test.describe('Casca de /mandato e o perfil', () => {
  test('sem perfil e fora da equipe Legisla abre /primeiro-acesso?volta=mandato, sem ler os mandatos (PAG-02.1, 02.2)', async ({ page }) => {
    await abre(page, { mandatos: [ANA], ler: SEM_PERFIL });
    await expect(page).toHaveURL(/\/primeiro-acesso\?volta=mandato$/);
    expect(leituras('membros')).toEqual([]);
  });

  test('com perfil segue para a Área do mandato como antes', async ({ page }) => {
    await abre(page, { mandatos: [ANA], ler: { perfis: () => ({ corpo: [{ user_id: 'uid-mariana' }] }) } });
    await expect(corpo(page).getByRole('heading', { level: 1, name: 'Ana Souza' })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/mandato');
  });

  test('da equipe Legisla, mesmo sem perfil, segue para a Área do mandato (PAG-02.16)', async ({ page }) => {
    await abre(page, { mandatos: [ANA], ler: { ...SEM_PERFIL, ...DA_LEGISLA } });
    await expect(corpo(page).getByRole('heading', { level: 1, name: 'Ana Souza' })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/mandato');
  });

  test('falha na consulta de perfil mostra o erro existente e nunca manda ao formulário', async ({ page }) => {
    await abre(page, { mandatos: [ANA], ler: { perfis: () => ({ status: 500, corpo: { message: 'boom' } }) } });
    await expect(corpo(page).getByRole('alert')).toHaveText('Não foi possível concluir. Tente de novo.');
    await expect(corpo(page).getByRole('button', { name: 'Tentar de novo' })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/mandato');
  });

  test('falha na consulta da equipe Legisla também mostra o erro, sem formulário', async ({ page }) => {
    await abre(page, { mandatos: [ANA], ler: { ...SEM_PERFIL, equipe_legisla: () => ({ rede: true }) } });
    await expect(corpo(page).getByRole('alert')).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/mandato');
  });
});
