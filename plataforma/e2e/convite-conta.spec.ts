import { test, expect, type Page } from '@playwright/test';
import corpoGuia from '../lib/legacyBody.ts';
import {
  MANDATO_ID, PREVIA, TOKEN, auth, chamadas, consentimentos, localDe, moca, naoMapeadas, ordemDe, rpcs, semeiaSessao,
  type EstadoMoca, type RespostaRpc,
} from './convite-api';

/* Página do convite só com Google (PAG-01.1, 01.2, 01.4, 01.5, PAG-05.1, 05.2), a etapa de consentimento das contas Google
   sem consentimento e as bordas da sessão vencida e da conta indicada. Supabase todo interceptado (convite-api.ts). */

const CONCORDO = 'Li e concordo com o tratamento dos meus dados pessoais nos termos acima.';
const SEM_CONSENTIMENTO = 'Para criar a conta é preciso concordar com o tratamento dos dados pessoais.';
const ERRO_GOOGLE = 'Não foi possível entrar com o Google. Tente de novo.';
const SESSAO_GUIA = { access_token: 'tok-carlos', refresh_token: 'ref-carlos' };
const VOLTA_GOOGLE = '/convite#access_token=tok-carlos&refresh_token=ref-carlos&expires_in=3600&token_type=bearer';

// O aviso do cadastro do Guia (#blocoLgpd), com "link de convite" no lugar de "código de convite" (ACE-07.4).
const blocoLgpd = /<div class="lgpd oculto" id="blocoLgpd">([\s\S]*?)<\/div>/.exec(corpoGuia)![1];
const AVISO = blocoLgpd.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().replace('código de convite', 'link de convite');

const ACEITE_OK: RespostaRpc = { corpo: { ok: true, mandato_id: MANDATO_ID, ja_membro: false } };
// como o banco: o aceite só passa para quem já tem consentimento gravado
const aceiteExigeConsentimento = (): RespostaRpc =>
  consentimentos().length ? ACEITE_OK : { corpo: { ok: false, erro: 'consentimento' } };
const base = (aceite: () => RespostaRpc = () => ACEITE_OK): EstadoMoca['rpc'] => ({
  convite_previa: () => ({ corpo: PREVIA }),
  convite_aceitar: aceite,
});

const botao = (page: Page, nome: string) => page.getByRole('button', { name: nome, exact: true });
const alerta = (page: Page) => page.locator('.cv-corpo').getByRole('alert');
const cartao = (page: Page) => page.locator('.cv-mandato');
const sessaoGuardada = async (page: Page) => JSON.parse((await localDe(page, 'legisla.tok')) ?? 'null');
const pendente = (page: Page) => page.evaluate(() => sessionStorage.getItem('legisla.convite'));
const ehConsentimento = (c: { metodo: string; caminho: string }) => c.metodo === 'POST' && c.caminho.startsWith('consentimentos');
const ehAceite = (c: { metodo: string; caminho: string }) => c.metodo === 'POST' && c.caminho === 'rpc/convite_aceitar';

test.afterEach(() => {
  expect(naoMapeadas()).toEqual([]);
  // nenhuma tela do convite chama o cadastro nem o login por senha (PAG-05.1)
  expect(auth('signup')).toEqual([]);
  expect(auth('token?grant_type=password')).toEqual([]);
});

test.describe('Sem sessão: só o Google (PAG-01.1, 01.2, PAG-05.2)', () => {
  test('mostra só "Entrar com Google": sem campos, sem "Criar conta", sem abas, sem "Entrar e aceitar"', async ({ page }) => {
    await moca(page, { rpc: base() });
    await page.goto(`/convite#${TOKEN}`);
    await expect(botao(page, 'Entrar com Google')).toBeVisible();
    await expect(cartao(page).locator('strong')).toHaveText('Mandato de Ana Souza');
    await expect(page.locator('.cv-corpo input')).toHaveCount(0);
    await expect(page.getByRole('tab')).toHaveCount(0);
    await expect(page.locator('.cv-corpo').getByRole('button')).toHaveCount(1);
    await expect(page.getByText(/criar conta|entrar e aceitar|senha|e-mail e senha/i)).toHaveCount(0);
    // sem sessão não há aceite direto
    await expect(botao(page, 'Aceitar convite')).toHaveCount(0);
  });

  test('a mensagem "Confirme o e-mail enviado e faça login" não aparece em nenhum estado da página (PAG-05.2)', async ({ page }) => {
    await moca(page, { rpc: base() });
    await page.goto(`/convite#${TOKEN}`);
    await expect(botao(page, 'Entrar com Google')).toBeVisible();
    await expect(page.getByText(/confirme o e-mail/i)).toHaveCount(0);
    await botao(page, 'Entrar com Google').click();
    await expect.poll(() => auth('authorize').length).toBe(1);
    await page.goto('/convite#error_description=Email+not+confirmed');
    await expect(alerta(page)).toHaveText(ERRO_GOOGLE);
    await expect(page.getByText(/confirme o e-mail/i)).toHaveCount(0);
  });
});

test.describe('Entrar com Google (PAG-01.3, 01.4, 01.5)', () => {
  test('guarda o convite, pede redirect_to para /convite e, na volta, grava legisla.tok e conclui o aceite sem pedir o link (PAG-01.5)', async ({ page }) => {
    await moca(page, { rpc: base() });
    await page.goto(`/convite#${TOKEN}`);
    const origem = new URL(page.url()).origin;
    await botao(page, 'Entrar com Google').click();
    await expect.poll(() => auth('authorize').length).toBe(1);
    const ida = new URL(`http://x/${auth('authorize')[0].caminho}`);
    expect(ida.searchParams.get('provider')).toBe('google');
    expect(ida.searchParams.get('redirect_to')).toBe(`${origem}/convite`);
    expect(rpcs('convite_aceitar')).toEqual([]);

    // volta do Google: a URL só traz a sessão; o token do convite vem do que foi guardado antes de sair
    await page.goto(VOLTA_GOOGLE);
    await page.waitForURL('**/guia');
    expect(rpcs('convite_aceitar').map((c) => c.corpo)).toEqual([{ p_token: TOKEN, p_nome: null }]);
    expect(rpcs('convite_aceitar')[0].token).toBe('tok-carlos');
    expect(await sessaoGuardada(page)).toEqual(SESSAO_GUIA);
    expect(await localDe(page, 'legisla.mandatoAtual')).toBe(MANDATO_ID);
    expect(await pendente(page)).toBeNull(); // concluído, o convite sai do navegador
  });

  test('volta do Google na raiz (redirect fora da lista do Supabase) também chega ao convite e conclui o aceite', async ({ page }) => {
    await moca(page, { rpc: base() });
    await page.goto(`/convite#${TOKEN}`);
    await botao(page, 'Entrar com Google').click();
    await expect.poll(() => auth('authorize').length).toBe(1);
    await page.goto('/#access_token=tok-carlos&refresh_token=ref-carlos');
    await page.waitForURL('**/guia');
    expect(rpcs('convite_aceitar').map((c) => c.corpo)).toEqual([{ p_token: TOKEN, p_nome: null }]);
    expect(await sessaoGuardada(page)).toEqual(SESSAO_GUIA);
  });

  test('erro do Google mostra "Não foi possível entrar com o Google. Tente de novo." e mantém o botão, com o convite guardado e sem aceite (PAG-01.4)', async ({ page }) => {
    await moca(page, { rpc: base() });
    await page.goto(`/convite#${TOKEN}`);
    await botao(page, 'Entrar com Google').click();
    await expect.poll(() => auth('authorize').length).toBe(1);
    await page.goto('/convite#error_description=Acesso+negado+pelo+Google');
    await expect(alerta(page)).toHaveText(ERRO_GOOGLE);
    await expect(cartao(page).locator('strong')).toHaveText('Mandato de Ana Souza');
    await expect(botao(page, 'Entrar com Google')).toBeEnabled();
    expect(new URL(page.url()).hash).toBe(`#${TOKEN}`);
    expect(await pendente(page)).toBe(TOKEN);
    expect(rpcs('convite_aceitar')).toEqual([]);
  });

  test('conta Google sem consentimento: mostra o aviso, exige a concordância, grava em consentimentos e tenta o aceite de novo', async ({ page }) => {
    await moca(page, { rpc: base(aceiteExigeConsentimento) });
    await page.goto(`/convite#${TOKEN}`);
    await botao(page, 'Entrar com Google').click();
    await expect.poll(() => auth('authorize').length).toBe(1);
    await page.goto(VOLTA_GOOGLE);

    await expect(page.locator('.cv-lgpd')).toHaveText(AVISO);
    expect(rpcs('convite_aceitar')).toHaveLength(1);
    await botao(page, 'Aceitar convite').click();
    await expect(alerta(page)).toHaveText(SEM_CONSENTIMENTO);
    expect(consentimentos()).toEqual([]);

    await page.getByLabel(CONCORDO).check();
    await botao(page, 'Aceitar convite').click();
    await page.waitForURL('**/guia');
    expect(consentimentos()).toHaveLength(1);
    expect((consentimentos()[0].corpo as Record<string, unknown>).user_id).toBe('uid-carlos');
    expect((consentimentos()[0].corpo as Record<string, unknown>).versao).toBe('2026-10');
    // a segunda tentativa de aceite vem depois do registro
    const aceites = chamadas().map((c, i) => (ehAceite(c) ? i : -1)).filter((i) => i >= 0);
    expect(aceites).toHaveLength(2);
    expect(ordemDe(ehConsentimento)).toBeLessThan(aceites[1]);
  });
});

test.describe('Sessão vencida durante o aceite (borda da spec)', () => {
  test('401 com refresh_token válido: renova, grava a sessão nova e conclui o aceite', async ({ page }) => {
    await semeiaSessao(page, { access_token: 'tok-vencido-carlos', refresh_token: 'ref-carlos' });
    await moca(page, { rpc: base() });
    await page.goto(`/convite#${TOKEN}`);
    await botao(page, 'Aceitar convite').click();
    await page.waitForURL('**/guia');
    expect(rpcs('convite_aceitar').map((c) => c.token)).toEqual(['tok-vencido-carlos', 'tok-novo-carlos']);
    expect(await sessaoGuardada(page)).toEqual({ access_token: 'tok-novo-carlos', refresh_token: 'ref-carlos' });
  });

  test('sem renovação: pede novo login só com o Google e retoma o mesmo convite, sem colar o link de novo', async ({ page }) => {
    await semeiaSessao(page, { access_token: 'tok-vencido-carlos', refresh_token: 'ref-carlos' });
    await moca(page, { rpc: base(), renovacao: 'falha' });
    await page.goto(`/convite#${TOKEN}`);
    await botao(page, 'Aceitar convite').click();
    await expect(alerta(page)).toHaveText('Sua sessão venceu. Entre de novo para aceitar o convite.');
    expect(await localDe(page, 'legisla.tok')).toBeNull();
    await expect(cartao(page).locator('strong')).toHaveText('Mandato de Ana Souza');
    await expect(page.locator('.cv-corpo input')).toHaveCount(0);

    await botao(page, 'Entrar com Google').click();
    await expect.poll(() => auth('authorize').length).toBe(1);
    await page.goto(VOLTA_GOOGLE);
    await page.waitForURL('**/guia');
    expect(rpcs('convite_aceitar').map((c) => c.corpo)).toEqual([{ p_token: TOKEN, p_nome: null }, { p_token: TOKEN, p_nome: null }]);
    expect(rpcs('convite_aceitar')[1].token).toBe('tok-carlos');
    expect(await sessaoGuardada(page)).toEqual(SESSAO_GUIA);
  });
});

test.describe('Conta indicada no convite (ACE-02.9)', () => {
  test('com sessão de outro e-mail, "Entrar com outra conta" limpa a sessão e oferece só o Google, mantendo o convite', async ({ page }) => {
    await semeiaSessao(page, { access_token: 'tok-bia', refresh_token: 'ref-bia' });
    await moca(page, { rpc: base(() => ({ corpo: { ok: false, erro: 'email' } })) });
    await page.goto(`/convite#${TOKEN}`);
    await botao(page, 'Aceitar convite').click();
    await expect(alerta(page)).toHaveText('Este convite é para outro e-mail. Entre com a conta indicada ou peça um novo convite.');
    await botao(page, 'Entrar com outra conta').click();
    expect(await localDe(page, 'legisla.tok')).toBeNull();
    await expect(botao(page, 'Entrar com Google')).toBeVisible();
    await expect(page.locator('.cv-corpo input')).toHaveCount(0);
    await expect(cartao(page).locator('strong')).toHaveText('Mandato de Ana Souza');
  });
});

test.describe('Celular (400 px)', () => {
  test.use({ viewport: { width: 400, height: 800 } });

  test('a entrada só com Google e a mensagem de erro cabem sem rolagem horizontal', async ({ page }) => {
    await moca(page, { rpc: base() });
    await page.goto(`/convite#${TOKEN}`);
    const semRolagemLateral = () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    await expect(botao(page, 'Entrar com Google')).toBeVisible();
    expect(await semRolagemLateral()).toBe(true);
    await botao(page, 'Entrar com Google').click();
    await expect.poll(() => auth('authorize').length).toBe(1);
    await page.goto('/convite#error_description=Acesso+negado');
    await expect(alerta(page)).toBeVisible();
    expect(await semRolagemLateral()).toBe(true);
  });
});
