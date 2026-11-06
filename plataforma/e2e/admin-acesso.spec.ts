import { test, expect, type Page } from '@playwright/test';
import { chamadas, esperaSemMandatos, mandato, moca, naoMapeadas, semeiaSessao, vazou, type EstadoMoca, type Papel } from './admin-api';

/* Acesso, papéis e sessão do /admin (ADM-01, ADM-02.6). Supabase todo interceptado (admin-api.ts). */
const MANDATOS = [mandato({ id: 'a', codigo: 'ABC234', nome_parlamentar: 'Ana Souza' }), mandato({ id: 'b', codigo: 'XYZ789', nome_parlamentar: 'Bia Lima' })];
const estadoBase = (): EstadoMoca => ({ views: { v_admin_mandatos: MANDATOS } });
const tokenGuardado = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('legisla.tok') ?? 'null'));
const linhas = (page: Page) => page.locator('tbody tr');

async function entraComo(page: Page, papel: Papel | 'fora', estado: EstadoMoca = estadoBase(), opcoes = {}) {
  await semeiaSessao(page, papel, opcoes);
  await moca(page, estado);
  await page.goto('/admin');
}

test.afterEach(() => {
  expect(naoMapeadas()).toEqual([]);
  expect(vazou()).toEqual([]);
});

test.describe('Sem sessão e sem acesso (ADM-01.1, 01.2)', () => {
  test('sem sessão mostra a entrada (Google e e-mail) e não consulta nada do banco', async ({ page }) => {
    await moca(page, estadoBase());
    await page.goto('/admin');
    await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible();
    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar com e-mail' })).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(0);
    // espera ~1,2 s: um pedido atrasado também seria visto
    expect(await esperaSemMandatos(page)).toEqual([]);
  });

  test('conta fora de equipe_legisla vê "Sem acesso" e nenhuma view de mandatos é consultada', async ({ page }) => {
    await entraComo(page, 'fora');
    await expect(page.getByRole('heading', { name: 'Sem acesso' })).toBeVisible();
    await expect(page.getByText('fora@legisla.test')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(0);
    expect(await esperaSemMandatos(page)).toEqual([]);
    // só a checagem de papel foi ao banco
    expect(chamadas().filter((c) => c.caminho.startsWith('equipe_legisla')).length).toBe(1);
  });

  test('"Entrar com Google" vai ao Supabase com redirect_to apontando para /admin', async ({ page }) => {
    await moca(page, estadoBase());
    await page.goto('/admin');
    const origem = new URL(page.url()).origin; // antes do clique, que leva a página ao Supabase
    await page.getByRole('button', { name: 'Entrar com Google' }).click();
    await expect.poll(() => chamadas().some((c) => c.caminho.startsWith('auth/authorize'))).toBe(true);
    const ida = chamadas().find((c) => c.caminho.startsWith('auth/authorize'))!;
    const redirect = new URL(`http://x/${ida.caminho}`).searchParams.get('redirect_to');
    // a origem vem da página aberta, para o teste valer em qualquer porta (o worktree isolado usa a 3100)
    expect(redirect).toBe(`${origem}/admin`);
  });
});

test.describe('Entrada com sessão, retorno do Google e senha (ADM-01.3, 01.4)', () => {
  test('aproveita legisla.tok: abre direto em Mandatos, com o menu e o link para /painel', async ({ page }) => {
    await entraComo(page, 'admin');
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Mandatos' })).toBeVisible();
    await expect(linhas(page)).toHaveCount(2);
    const menu = page.getByRole('navigation', { name: 'Menu do painel' });
    await expect(menu.getByRole('link')).toHaveText(['Equipe', 'Mandatos', 'Analytics', 'Logs', 'Painel de métricas', '← Voltar para a plataforma']);
    await expect(menu.getByRole('link', { name: 'Mandatos' })).toHaveAttribute('aria-current', 'page');
    await expect(menu.getByRole('link', { name: /Painel de métricas/ })).toHaveAttribute('href', '/painel');
    await expect(menu.getByRole('link', { name: /Voltar para a plataforma/ })).toHaveAttribute('href', '/guia');
    await expect(page.getByRole('link', { name: 'Equipe' })).not.toHaveAttribute('aria-current', 'page');
    // nenhuma tela de login apareceu
    await expect(page.getByRole('button', { name: 'Entrar com Google' })).toHaveCount(0);
  });

  test('retorno do Google em #access_token: grava a sessão, limpa a URL e abre Mandatos', async ({ page }) => {
    await moca(page, estadoBase());
    await page.goto('/admin#access_token=tok-admin&refresh_token=ref-admin');
    await expect(linhas(page)).toHaveCount(2);
    expect(page.url()).not.toContain('access_token');
    expect(await tokenGuardado(page)).toEqual({ access_token: 'tok-admin', refresh_token: 'ref-admin' });
  });

  test('erro do Google na URL volta à entrada com a mensagem', async ({ page }) => {
    await moca(page, estadoBase());
    await page.goto('/admin#error_description=Acesso+negado+pelo+Google');
    await expect(page.locator('.aviso')).toHaveText('Acesso negado pelo Google');
    await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible();
    expect(await esperaSemMandatos(page)).toEqual([]);
  });

  test('entrada por e-mail e senha abre Mandatos; senha errada mostra o erro', async ({ page }) => {
    await moca(page, { ...estadoBase(), senha: { email: 'ana@legisla.test', senha: 'segredo123' } });
    await page.goto('/admin');
    await page.getByLabel('E-mail').fill('ana@legisla.test');
    await page.getByLabel('Senha').fill('errada');
    await page.getByRole('button', { name: 'Entrar com e-mail' }).click();
    await expect(page.locator('.aviso')).toHaveText('Invalid login credentials');
    expect(await esperaSemMandatos(page)).toEqual([]);
    await page.getByLabel('Senha').fill('segredo123');
    await page.getByRole('button', { name: 'Entrar com e-mail' }).click();
    await expect(linhas(page)).toHaveCount(2);
  });

  test('Sair volta à entrada e apaga a sessão', async ({ page }) => {
    await entraComo(page, 'admin');
    await expect(linhas(page)).toHaveCount(2);
    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible();
    expect(await tokenGuardado(page)).toBeNull();
  });
});

test.describe('Papéis (ADM-01.3, 02.6)', () => {
  test('admin: mostra nome e papel', async ({ page }) => {
    await entraComo(page, 'admin');
    await expect(page.getByText('Pessoa admin')).toBeVisible();
    await expect(page.locator('.who b')).toHaveText('admin');
  });

  test('leitura vê as telas, sem nenhum botão que altere dados e sem seletor de papel habilitado', async ({ page }) => {
    await entraComo(page, 'leitura');
    await expect(linhas(page)).toHaveCount(2);
    await expect(page.locator('.who b')).toHaveText('leitura');
    for (const nome of [/Incluir/, /Remover/, /Editar/, /Adicionar/, /Arquivar/, /Excluir/]) {
      await expect(page.getByRole('button', { name: nome })).toHaveCount(0);
      await expect(page.getByRole('link', { name: nome })).toHaveCount(0);
    }
    // todo seletor habilitado é filtro de lista; nenhum é seletor de papel
    const habilitados = await page.locator('select:enabled').evaluateAll((s) => s.map((x) => x.getAttribute('aria-label')));
    expect(habilitados).toEqual(['UF', 'Casa', 'Situação', 'Parado há']);
  });
});

test.describe('Sessão vencida e 401 (ADM-01.5)', () => {
  test('token vencido é renovado com o refresh_token e a tela abre sem pedir login', async ({ page }) => {
    await entraComo(page, 'admin', estadoBase(), { vencido: true });
    await expect(linhas(page)).toHaveCount(2);
    expect(chamadas().some((c) => c.caminho.includes('grant_type=refresh_token'))).toBe(true);
    expect(await tokenGuardado(page)).toEqual({ access_token: 'tok-novo-admin', refresh_token: 'ref-admin' });
  });

  test('token vencido sem refresh_token volta à entrada', async ({ page }) => {
    await entraComo(page, 'admin', estadoBase(), { vencido: true, semRefresh: true });
    await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible();
    expect(await esperaSemMandatos(page)).toEqual([]);
  });

  test('renovação recusada volta à entrada com aviso', async ({ page }) => {
    await entraComo(page, 'admin', { ...estadoBase(), renovacao: 'falha' }, { vencido: true });
    await expect(page.locator('.aviso')).toHaveText('Sua sessão venceu. Entre de novo.');
    await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible();
    expect(await tokenGuardado(page)).toBeNull();
  });

  test('401 em uma consulta, mesmo depois de renovar, volta à entrada', async ({ page }) => {
    await entraComo(page, 'admin', { ...estadoBase(), sempre401: true });
    await expect(page.locator('.aviso')).toHaveText('Sua sessão venceu. Entre de novo.');
    await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(0);
    // tentou renovar antes de desistir
    expect(chamadas().some((c) => c.caminho.includes('grant_type=refresh_token'))).toBe(true);
  });
});
