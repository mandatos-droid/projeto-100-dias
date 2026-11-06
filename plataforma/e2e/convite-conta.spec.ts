import { test, expect, type Page } from '@playwright/test';
import corpoGuia from '../lib/legacyBody.ts';
import {
  MANDATO_ID, PREVIA, TOKEN, auth, chamadas, consentimentos, localDe, moca, naoMapeadas, ordemDe, rpcs, semeiaSessao,
  type EstadoMoca, type RespostaRpc,
} from './convite-api';

/* Página do convite: criar conta, entrar e Google (ACE-02.2, 02.3, 02.5, 02.7, 02.8, 02.15 e a borda da sessão vencida).
   Supabase todo interceptado (convite-api.ts). */

const NOME = 'Carlos Lima';
const EMAIL = 'carlos@gabinete.test';
const SENHA = 'segredo-1234';
const CONCORDO = 'Li e concordo com o tratamento dos meus dados pessoais nos termos acima.';
const SEM_CONSENTIMENTO = 'Para criar a conta é preciso concordar com o tratamento dos dados pessoais.';
const SESSAO_GUIA = { access_token: 'tok-carlos', refresh_token: 'ref-carlos' };

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

async function preencheCadastro(page: Page, opcoes: { concorda?: boolean } = {}) {
  await page.getByLabel('Nome', { exact: true }).fill(NOME);
  await page.getByLabel('E-mail').fill(EMAIL);
  await page.getByLabel('Senha').fill(SENHA);
  if (opcoes.concorda !== false) await page.getByLabel(CONCORDO).check();
}

test.afterEach(() => {
  expect(naoMapeadas()).toEqual([]);
});

test.describe('Sem sessão (ACE-02.2, ACE-02.8)', () => {
  test('oferece criar conta (nome, e-mail, senha), entrar com conta existente e Google, com o aviso de consentimento do cadastro', async ({ page }) => {
    await moca(page, { rpc: base() });
    await page.goto(`/convite#${TOKEN}`);
    await expect(page.getByLabel('Nome', { exact: true })).toBeVisible();
    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await expect(botao(page, 'Criar conta e entrar no mandato')).toBeVisible();
    await expect(botao(page, 'Entrar e aceitar')).toBeVisible();
    await expect(botao(page, 'Entrar com Google')).toBeVisible();
    await expect(page.locator('.cv-lgpd')).toHaveText(AVISO);
    await expect(page.getByLabel(CONCORDO)).not.toBeChecked();
    // sem sessão não há aceite direto
    await expect(botao(page, 'Aceitar convite')).toHaveCount(0);
    // "Entrar e aceitar" leva ao login com conta existente
    await botao(page, 'Entrar e aceitar').click();
    await expect(page.getByRole('heading', { name: 'Entre para aceitar o convite' })).toBeVisible();
    await expect(page.getByLabel('Nome', { exact: true })).toHaveCount(0);
  });
});

test.describe('Criar conta (ACE-02.3, ACE-02.7, ACE-02.8, ACE-02.15)', () => {
  test('cria a conta, grava o consentimento antes do aceite, grava legisla.tok no formato do Guia e abre o Guia no mandato', async ({ page }) => {
    await moca(page, { rpc: base(aceiteExigeConsentimento) });
    await page.goto(`/convite#${TOKEN}`);
    await preencheCadastro(page);
    await botao(page, 'Criar conta e entrar no mandato').click();
    await page.waitForURL('**/guia');

    expect(auth('signup').map((c) => c.corpo)).toEqual([{ email: EMAIL, password: SENHA, data: { nome: NOME } }]);
    // consentimento: mesmo registro do cadastro, com a sessão nova, antes da chamada de aceite
    expect(consentimentos()).toHaveLength(1);
    expect(consentimentos()[0].token).toBe('tok-carlos');
    const reg = consentimentos()[0].corpo as Record<string, unknown>;
    expect(reg.user_id).toBe('uid-carlos');
    expect(reg.versao).toBe('2026-10');
    expect(Number.isNaN(Date.parse(String(reg.aceito_em)))).toBe(false);
    expect(ordemDe(ehConsentimento)).toBeLessThan(ordemDe(ehAceite));
    // aceite único, com o token do convite e o nome digitado
    expect(rpcs('convite_aceitar').map((c) => c.corpo)).toEqual([{ p_token: TOKEN, p_nome: NOME }]);
    expect(rpcs('convite_aceitar')[0].token).toBe('tok-carlos');
    expect(await sessaoGuardada(page)).toEqual(SESSAO_GUIA);
    expect(await localDe(page, 'legisla.mandatoAtual')).toBe(MANDATO_ID);
  });

  test('sem marcar a concordância, mostra o aviso do cadastro e não cria conta nem aceita', async ({ page }) => {
    await moca(page, { rpc: base() });
    await page.goto(`/convite#${TOKEN}`);
    await preencheCadastro(page, { concorda: false });
    await botao(page, 'Criar conta e entrar no mandato').click();
    await expect(alerta(page)).toHaveText(SEM_CONSENTIMENTO);
    await page.waitForLoadState('networkidle');
    expect(auth('signup')).toEqual([]);
    expect(rpcs('convite_aceitar')).toEqual([]);
  });

  test('e-mail já usado mostra o motivo; o convite não é consumido e a sessão não é gravada (ACE-02.15)', async ({ page }) => {
    await moca(page, {
      rpc: base(),
      cadastro: () => ({ status: 422, corpo: { code: 422, error_code: 'user_already_exists', msg: 'User already registered' } }),
    });
    await page.goto(`/convite#${TOKEN}`);
    await preencheCadastro(page);
    await botao(page, 'Criar conta e entrar no mandato').click();
    await expect(alerta(page)).toHaveText('Este e-mail já tem conta. Entre com ele para aceitar o convite.');
    await page.waitForLoadState('networkidle');
    expect(rpcs('convite_aceitar')).toEqual([]);
    expect(consentimentos()).toEqual([]);
    expect(await localDe(page, 'legisla.tok')).toBeNull();
    await expect(cartao(page).locator('strong')).toHaveText('Mandato de Ana Souza');
  });

  test('senha fraca mostra o motivo; o convite não é consumido (ACE-02.15)', async ({ page }) => {
    await moca(page, {
      rpc: base(),
      cadastro: () => ({ status: 422, corpo: { code: 422, error_code: 'weak_password', msg: 'Password should be at least 6 characters.' } }),
    });
    await page.goto(`/convite#${TOKEN}`);
    await preencheCadastro(page);
    await botao(page, 'Criar conta e entrar no mandato').click();
    await expect(alerta(page)).toHaveText('Senha fraca. Escolha uma senha mais longa, com letras e números.');
    await page.waitForLoadState('networkidle');
    expect(rpcs('convite_aceitar')).toEqual([]);
    expect(await localDe(page, 'legisla.tok')).toBeNull();
  });

  test('com a confirmação de e-mail ligada (cadastro sem sessão), pede a confirmação e guarda o convite pendente', async ({ page }) => {
    await moca(page, {
      rpc: base(),
      cadastro: (c) => ({ corpo: { id: 'uid-carlos', email: c.email, confirmation_sent_at: '2026-11-06T12:00:00Z' } }),
    });
    await page.goto(`/convite#${TOKEN}`);
    await preencheCadastro(page);
    await botao(page, 'Criar conta e entrar no mandato').click();
    await expect(page.locator('.cv-corpo').getByRole('status')).toHaveText('Conta criada. Confirme o e-mail enviado e faça login.');
    expect(await pendente(page)).toBe(TOKEN);
    await page.waitForLoadState('networkidle');
    expect(await localDe(page, 'legisla.tok')).toBeNull();
    expect(rpcs('convite_aceitar')).toEqual([]);
    expect(consentimentos()).toEqual([]);
  });
});

test.describe('Entrar com conta existente (ACE-02.4, ACE-02.7, ACE-02.8)', () => {
  test('senha errada mostra o motivo; senha certa grava legisla.tok, aceita o convite e abre o Guia', async ({ page }) => {
    await moca(page, { rpc: base(), senha: { email: EMAIL, senha: SENHA } });
    await page.goto(`/convite#${TOKEN}`);
    await botao(page, 'Entrar e aceitar').click();
    await page.getByLabel('E-mail').fill(EMAIL);
    await page.getByLabel('Senha').fill('errada');
    await botao(page, 'Entrar e aceitar').click();
    await expect(alerta(page)).toHaveText('E-mail ou senha incorretos.');
    expect(rpcs('convite_aceitar')).toEqual([]);

    await page.getByLabel('Senha').fill(SENHA);
    await botao(page, 'Entrar e aceitar').click();
    await page.waitForURL('**/guia');
    expect(rpcs('convite_aceitar').map((c) => c.corpo)).toEqual([{ p_token: TOKEN, p_nome: null }]);
    expect(rpcs('convite_aceitar')[0].token).toBe('tok-carlos');
    expect(await sessaoGuardada(page)).toEqual(SESSAO_GUIA);
    expect(await localDe(page, 'legisla.mandatoAtual')).toBe(MANDATO_ID);
  });

  test('conta sem consentimento: mostra o aviso, exige a concordância, grava em consentimentos e tenta o aceite de novo', async ({ page }) => {
    await moca(page, { rpc: base(aceiteExigeConsentimento), senha: { email: EMAIL, senha: SENHA } });
    await page.goto(`/convite#${TOKEN}`);
    await botao(page, 'Entrar e aceitar').click();
    await page.getByLabel('E-mail').fill(EMAIL);
    await page.getByLabel('Senha').fill(SENHA);
    await botao(page, 'Entrar e aceitar').click();

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
    expect(await localDe(page, 'legisla.mandatoAtual')).toBe(MANDATO_ID);
  });
});

test.describe('Entrar com Google (ACE-02.5, ACE-02.7)', () => {
  test('guarda o convite, pede redirect_to para /convite e, na volta, grava legisla.tok e conclui o aceite sem pedir o link', async ({ page }) => {
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
    await page.goto('/convite#access_token=tok-carlos&refresh_token=ref-carlos&expires_in=3600&token_type=bearer');
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

  test('erro do Google mostra o motivo e o convite segue válido, guardado e sem aceite', async ({ page }) => {
    await moca(page, { rpc: base() });
    await page.goto(`/convite#${TOKEN}`);
    await botao(page, 'Entrar com Google').click();
    await expect.poll(() => auth('authorize').length).toBe(1);
    await page.goto('/convite#error_description=Acesso+negado+pelo+Google');
    await expect(alerta(page)).toHaveText('Acesso negado pelo Google');
    await expect(cartao(page).locator('strong')).toHaveText('Mandato de Ana Souza');
    await expect(botao(page, 'Entrar com Google')).toBeVisible();
    expect(new URL(page.url()).hash).toBe(`#${TOKEN}`);
    expect(await pendente(page)).toBe(TOKEN);
    expect(rpcs('convite_aceitar')).toEqual([]);
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
    expect(rpcs('convite_aceitar').map((c) => c.corpo)).toEqual([{ p_token: TOKEN, p_nome: null }, { p_token: TOKEN, p_nome: null }]);
    expect(await sessaoGuardada(page)).toEqual({ access_token: 'tok-novo-carlos', refresh_token: 'ref-carlos' });
  });

  test('sem renovação: pede novo login e retoma o mesmo convite', async ({ page }) => {
    await semeiaSessao(page, { access_token: 'tok-vencido-carlos', refresh_token: 'ref-carlos' });
    await moca(page, { rpc: base(), renovacao: 'falha', senha: { email: EMAIL, senha: SENHA } });
    await page.goto(`/convite#${TOKEN}`);
    await botao(page, 'Aceitar convite').click();
    await expect(alerta(page)).toHaveText('Sua sessão venceu. Entre de novo para aceitar o convite.');
    expect(await localDe(page, 'legisla.tok')).toBeNull();
    await expect(cartao(page).locator('strong')).toHaveText('Mandato de Ana Souza');

    await page.getByLabel('E-mail').fill(EMAIL);
    await page.getByLabel('Senha').fill(SENHA);
    await botao(page, 'Entrar e aceitar').click();
    await page.waitForURL('**/guia');
    // o mesmo convite, sem colar o link de novo
    expect(rpcs('convite_aceitar').map((c) => c.corpo)).toEqual([{ p_token: TOKEN, p_nome: null }, { p_token: TOKEN, p_nome: null }]);
    expect(rpcs('convite_aceitar')[1].token).toBe('tok-carlos');
    expect(await sessaoGuardada(page)).toEqual(SESSAO_GUIA);
  });
});

test.describe('Conta indicada no convite (ACE-02.9)', () => {
  test('com sessão de outro e-mail, "Entrar com outra conta" troca a conta e mantém o convite', async ({ page }) => {
    await semeiaSessao(page, { access_token: 'tok-bia', refresh_token: 'ref-bia' });
    let vez = 0;
    await moca(page, {
      rpc: base(() => (++vez === 1 ? { corpo: { ok: false, erro: 'email' } } : ACEITE_OK)),
      senha: { email: EMAIL, senha: SENHA },
    });
    await page.goto(`/convite#${TOKEN}`);
    await botao(page, 'Aceitar convite').click();
    await expect(alerta(page)).toHaveText('Este convite é para outro e-mail. Entre com a conta indicada ou peça um novo convite.');
    await botao(page, 'Entrar com outra conta').click();
    expect(await localDe(page, 'legisla.tok')).toBeNull();
    await page.getByLabel('E-mail').fill(EMAIL);
    await page.getByLabel('Senha').fill(SENHA);
    await botao(page, 'Entrar e aceitar').click();
    await page.waitForURL('**/guia');
    expect(rpcs('convite_aceitar').map((c) => c.token)).toEqual(['tok-bia', 'tok-carlos']);
    expect(await sessaoGuardada(page)).toEqual(SESSAO_GUIA);
  });
});

test.describe('Celular (400 px)', () => {
  test.use({ viewport: { width: 400, height: 800 } });

  test('formulário de conta, aviso de consentimento e mensagens cabem sem rolagem horizontal', async ({ page }) => {
    await moca(page, {
      rpc: base(),
      cadastro: () => ({ status: 422, corpo: { code: 422, error_code: 'user_already_exists', msg: 'User already registered' } }),
    });
    await page.goto(`/convite#${TOKEN}`);
    const semRolagemLateral = () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    await expect(page.locator('.cv-lgpd')).toBeVisible();
    expect(await semRolagemLateral()).toBe(true);
    await preencheCadastro(page);
    await botao(page, 'Criar conta e entrar no mandato').click();
    await expect(alerta(page)).toBeVisible();
    expect(await semRolagemLateral()).toBe(true);
  });
});
