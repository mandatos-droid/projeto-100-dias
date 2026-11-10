import { test, expect, type Page } from '@playwright/test';
import { MANDATO_ID, PREVIA, TOKEN, esperaSemRpc, moca, naoMapeadas, rpcs, semeiaSessao, type EstadoMoca } from './convite-api';

/* Convite sem perfil: o aceite devolve erro:'perfil', o token fica guardado e a pessoa vai a /primeiro-acesso; na volta o aceite
   conclui sozinho (PAG-02.1, PAG-04.8). Supabase todo interceptado (convite-api.ts); /primeiro-acesso vira página vazia. */

const SEM_PERFIL = { ok: false, erro: 'perfil' };
const ACEITE_OK = { ok: true, mandato_id: MANDATO_ID, ja_membro: false };

const botao = (page: Page, nome: string) => page.getByRole('button', { name: nome, exact: true });
const pendente = (page: Page) => page.evaluate(() => sessionStorage.getItem('legisla.convite'));

async function abre(page: Page, aceite: () => { corpo: unknown }, url: string, opcoes: { pendente?: boolean } = {}) {
  const rpc: EstadoMoca['rpc'] = { convite_previa: () => ({ corpo: PREVIA }), convite_aceitar: aceite };
  await semeiaSessao(page);
  await moca(page, { rpc });
  await page.route((u) => ['localhost', '127.0.0.1'].includes(u.hostname) && u.pathname === '/primeiro-acesso', (rota) =>
    rota.fulfill({ status: 200, headers: { 'content-type': 'text/html' }, body: '<!doctype html><title>perfil</title><h1>Perfil aberto</h1>' }));
  if (opcoes.pendente) await page.addInitScript((t) => { if (!sessionStorage.getItem('semeado')) { sessionStorage.setItem('semeado', '1'); sessionStorage.setItem('legisla.convite', t); } }, TOKEN);
  await page.goto(url);
}

test.afterEach(() => {
  expect(naoMapeadas()).toEqual([]);
});

test.describe('Aceite sem perfil (PAG-02.1)', () => {
  test('aceite que devolve perfil guarda o token e abre /primeiro-acesso?volta=convite, sem mensagem de erro', async ({ page }) => {
    await abre(page, () => ({ corpo: SEM_PERFIL }), `/convite#${TOKEN}`);
    await botao(page, 'Aceitar convite').click();
    await expect(page).toHaveURL(/\/primeiro-acesso\?volta=convite$/);
    expect(await pendente(page)).toBe(TOKEN);
    expect(rpcs('convite_aceitar')).toHaveLength(1);
  });

  test('na volta do Google com sessão e sem perfil, também vai ao formulário com o token guardado', async ({ page }) => {
    await abre(page, () => ({ corpo: SEM_PERFIL }), '/convite#access_token=tok-carlos&refresh_token=ref-carlos', { pendente: true });
    await expect(page).toHaveURL(/\/primeiro-acesso\?volta=convite$/);
    expect(await pendente(page)).toBe(TOKEN);
  });
});

test.describe('Volta do perfil (PAG-04.8)', () => {
  test('com o token guardado igual ao do endereço e sessão, o aceite conclui sem novo clique e abre o Guia', async ({ page }) => {
    await abre(page, () => ({ corpo: ACEITE_OK }), `/convite#${TOKEN}`, { pendente: true });
    await expect(page).toHaveURL(/\/guia$/);
    expect(rpcs('convite_aceitar')).toHaveLength(1);
    expect(await pendente(page)).toBeNull();
  });

  test('sem token guardado, abrir o convite com sessão não aceita sozinho: espera o clique em "Aceitar convite"', async ({ page }) => {
    await abre(page, () => ({ corpo: ACEITE_OK }), `/convite#${TOKEN}`);
    await expect(botao(page, 'Aceitar convite')).toBeVisible();
    expect(await esperaSemRpc(page, 'convite_aceitar')).toHaveLength(0);
  });
});
