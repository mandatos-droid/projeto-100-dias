import { test, expect, type Page } from '@playwright/test';
import {
  CHAVE_ANON, MANDATO_ID, PREVIA, TOKEN, esperaSemRpc, localDe, moca, naoMapeadas, rpcs, semeiaSessao, type EstadoMoca,
} from './convite-api';

/* Página do convite: prévia e aceite com sessão (ACE-02). Supabase todo interceptado (convite-api.ts). */

const INVALIDO = 'Este convite não vale mais. Peça um novo para quem convidou você.';
const LIMITE = 'Muitas tentativas. Tente de novo em alguns minutos.';
const OUTRO_EMAIL = 'Este convite é para outro e-mail. Entre com a conta indicada ou peça um novo convite.';

const previaOk = (): EstadoMoca['rpc'] => ({ convite_previa: () => ({ corpo: PREVIA }) });
const cartao = (page: Page) => page.locator('.cv-mandato');
const aceitar = (page: Page) => page.getByRole('button', { name: 'Aceitar convite' });
// alerta da página (o Next mantém um anunciador de rota próprio, também com role="alert", fora do conteúdo)
const alerta = (page: Page) => page.locator('.cv-corpo').getByRole('alert');

test.afterEach(() => {
  expect(naoMapeadas()).toEqual([]);
});

test.describe('Prévia do convite (ACE-02.1)', () => {
  test('link válido mostra quem convidou, nome parlamentar, cargo, UF e papel, sem chamar o aceite', async ({ page }) => {
    await moca(page, { rpc: { ...previaOk(), convite_aceitar: () => ({ corpo: { ok: true, mandato_id: MANDATO_ID, ja_membro: false } }) } });
    await page.goto(`/convite#${TOKEN}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mariana Rocha convidou você');
    await expect(cartao(page).locator('strong')).toHaveText('Mandato de Ana Souza');
    await expect(cartao(page).locator('.cv-mut')).toHaveText('Deputada Estadual · SP · papel: Assessoria');
    // a prévia vai ao banco com o token do fragmento e a chave pública (quem abre o link ainda não tem conta)
    expect(rpcs('convite_previa')).toHaveLength(1);
    expect(rpcs('convite_previa')[0].corpo).toEqual({ p_token: TOKEN });
    expect(rpcs('convite_previa')[0].token).toBe(CHAVE_ANON);
    // abrir o link não consome: nenhum aceite, mesmo depois de a rede ficar quieta
    expect(await esperaSemRpc(page, 'convite_aceitar')).toEqual([]);
  });
});

test.describe('Aceite com sessão (ACE-02.4, ACE-02.6, ACE-02.13)', () => {
  test('"Aceitar convite" chama o aceite com a sessão, grava legisla.mandatoAtual e abre o Guia', async ({ page }) => {
    await semeiaSessao(page);
    await moca(page, { rpc: { ...previaOk(), convite_aceitar: () => ({ corpo: { ok: true, mandato_id: MANDATO_ID, ja_membro: false } }) } });
    await page.goto(`/convite#${TOKEN}`);
    await aceitar(page).click();
    await page.waitForURL('**/guia');
    await expect(page.getByRole('heading', { name: 'Guia aberto' })).toBeVisible();
    expect(await localDe(page, 'legisla.mandatoAtual')).toBe(MANDATO_ID);
    expect(rpcs('convite_aceitar')).toHaveLength(1);
    expect(rpcs('convite_aceitar')[0].corpo).toEqual({ p_token: TOKEN, p_nome: null });
    expect(rpcs('convite_aceitar')[0].token).toBe('tok-carlos');
  });

  test('quem já é membro vê "Você já está neste mandato" e o Guia abre no mandato', async ({ page }) => {
    await semeiaSessao(page);
    await moca(page, { rpc: { ...previaOk(), convite_aceitar: () => ({ corpo: { ok: true, mandato_id: MANDATO_ID, ja_membro: true } }) } });
    await page.goto(`/convite#${TOKEN}`);
    await aceitar(page).click();
    await expect(page.getByText('Você já está neste mandato')).toBeVisible();
    await page.waitForURL('**/guia');
    expect(await localDe(page, 'legisla.mandatoAtual')).toBe(MANDATO_ID);
  });

  test('convite de outro e-mail mostra a mensagem da spec e o convite continua disponível (ACE-02.9)', async ({ page }) => {
    await semeiaSessao(page);
    await moca(page, { rpc: { ...previaOk(), convite_aceitar: () => ({ corpo: { ok: false, erro: 'email' } }) } });
    await page.goto(`/convite#${TOKEN}`);
    await aceitar(page).click();
    await expect(alerta(page)).toHaveText(OUTRO_EMAIL);
    // a prévia e o botão seguem na tela, na mesma página; nada foi gravado como mandato atual
    await expect(cartao(page).locator('strong')).toHaveText('Mandato de Ana Souza');
    await expect(aceitar(page)).toBeEnabled();
    expect(new URL(page.url()).pathname).toBe('/convite');
    expect(await localDe(page, 'legisla.mandatoAtual')).toBeNull();
  });

  test('falha de rede no aceite mostra "Não foi possível concluir. Tente de novo." e permite repetir', async ({ page }) => {
    await semeiaSessao(page);
    let vez = 0;
    await moca(page, {
      rpc: {
        ...previaOk(),
        convite_aceitar: () => (++vez === 1 ? { rede: true } : { corpo: { ok: true, mandato_id: MANDATO_ID, ja_membro: false } }),
      },
    });
    await page.goto(`/convite#${TOKEN}`);
    await aceitar(page).click();
    await expect(alerta(page)).toHaveText('Não foi possível concluir. Tente de novo.');
    await aceitar(page).click();
    await page.waitForURL('**/guia');
    expect(await localDe(page, 'legisla.mandatoAtual')).toBe(MANDATO_ID);
  });
});

test.describe('Convite que não vale mais e limite (ACE-02.10, ACE-02.11, ACE-02.14)', () => {
  test('token inexistente mostra a mensagem da spec, sem revelar mandato nem quem convidou', async ({ page }) => {
    await moca(page, { rpc: { convite_previa: () => ({ corpo: { ok: false, erro: 'invalido' } }) } });
    await page.goto(`/convite#${TOKEN}`);
    await expect(alerta(page)).toHaveText(INVALIDO);
    await expect(cartao(page)).toHaveCount(0);
    await expect(aceitar(page)).toHaveCount(0);
    await expect(page.getByText('Ana Souza')).toHaveCount(0);
  });

  test('convite vencido, cancelado ou usado entre a prévia e o clique mostra a mesma mensagem e some da tela', async ({ page }) => {
    await semeiaSessao(page);
    await moca(page, { rpc: { ...previaOk(), convite_aceitar: () => ({ corpo: { ok: false, erro: 'invalido' } }) } });
    await page.goto(`/convite#${TOKEN}`);
    await aceitar(page).click();
    await expect(alerta(page)).toHaveText(INVALIDO);
    await expect(cartao(page)).toHaveCount(0);
    await expect(aceitar(page)).toHaveCount(0);
    expect(await localDe(page, 'legisla.mandatoAtual')).toBeNull();
  });

  test('resposta "limite" na prévia mostra "Muitas tentativas. Tente de novo em alguns minutos."', async ({ page }) => {
    await moca(page, { rpc: { convite_previa: () => ({ corpo: { ok: false, erro: 'limite' } }) } });
    await page.goto(`/convite#${TOKEN}`);
    await expect(alerta(page)).toHaveText(LIMITE);
    await expect(cartao(page)).toHaveCount(0);
  });

  test('resposta "limite" no aceite mostra a mesma mensagem e não abre o Guia', async ({ page }) => {
    await semeiaSessao(page);
    await moca(page, { rpc: { ...previaOk(), convite_aceitar: () => ({ corpo: { ok: false, erro: 'limite' } }) } });
    await page.goto(`/convite#${TOKEN}`);
    await aceitar(page).click();
    await expect(alerta(page)).toHaveText(LIMITE);
    expect(new URL(page.url()).pathname).toBe('/convite');
    expect(await localDe(page, 'legisla.mandatoAtual')).toBeNull();
  });
});

test.describe('Sem token no endereço: colar o link', () => {
  test('mostra o campo "Cole o link do convite"; o link colado abre a prévia com o token extraído', async ({ page }) => {
    await moca(page, { rpc: previaOk() });
    await page.goto('/convite');
    await expect(page.getByLabel('Cole o link do convite')).toBeVisible();
    expect(rpcs('convite_previa')).toEqual([]);
    await page.getByLabel('Cole o link do convite').fill(`  https://100dias.legislabrasil.org/convite#${TOKEN}  `);
    await page.getByRole('button', { name: 'Abrir convite' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mariana Rocha convidou você');
    expect(rpcs('convite_previa').map((c) => c.corpo)).toEqual([{ p_token: TOKEN }]);
    // o endereço passa a carregar o token, para recarregar a página não perder o convite
    expect(new URL(page.url()).hash).toBe(`#${TOKEN}`);
  });

  test('aceita o token puro de 22 caracteres; texto sem token mostra a mensagem do convite que não vale mais e não consulta o banco', async ({ page }) => {
    await moca(page, { rpc: previaOk() });
    await page.goto('/convite');
    await page.getByLabel('Cole o link do convite').fill('https://100dias.legislabrasil.org/convite#curto');
    await page.getByRole('button', { name: 'Abrir convite' }).click();
    await expect(alerta(page)).toHaveText(INVALIDO);
    expect(rpcs('convite_previa')).toEqual([]);
    await page.getByLabel('Cole o link do convite').fill(TOKEN);
    await page.getByRole('button', { name: 'Abrir convite' }).click();
    await expect(cartao(page).locator('strong')).toHaveText('Mandato de Ana Souza');
    expect(rpcs('convite_previa').map((c) => c.corpo)).toEqual([{ p_token: TOKEN }]);
  });
});

test.describe('Celular (400 px)', () => {
  test.use({ viewport: { width: 400, height: 800 } });

  const semRolagemLateral = (page: Page) =>
    page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

  test('prévia com sessão, mensagem de erro e campo de colar o link cabem sem rolagem horizontal', async ({ page }) => {
    await semeiaSessao(page);
    await moca(page, {
      rpc: {
        convite_previa: () => ({ corpo: { ...PREVIA, convidado_por: 'Maria Aparecida dos Santos Albuquerque Figueiredo', mandato: { nome_parlamentar: 'Ana Carolina de Souza Mendonça Vasconcelos', cargo: 'Deputada Estadual', uf: 'SP' } } }),
        convite_aceitar: () => ({ corpo: { ok: false, erro: 'email' } }),
      },
    });
    await page.goto(`/convite#${TOKEN}`);
    await expect(aceitar(page)).toBeVisible();
    expect(await semRolagemLateral(page)).toBe(true);
    await aceitar(page).click();
    await expect(alerta(page)).toHaveText(OUTRO_EMAIL);
    expect(await semRolagemLateral(page)).toBe(true);

    await page.goto('/convite');
    await expect(page.getByLabel('Cole o link do convite')).toBeVisible();
    expect(await semRolagemLateral(page)).toBe(true);
  });
});
