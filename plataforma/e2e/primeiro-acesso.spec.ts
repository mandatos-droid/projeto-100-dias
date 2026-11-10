import { test, expect, type Page } from '@playwright/test';
import { auth, localDe, naoMapeadas, rpcs, semeiaSessao } from './convite-api';
import { PERFIL_VALIDO, argumentosSalvar, mocaPerfil, salvamentos, type EstadoPerfil } from './primeiro-acesso-api';

/* /primeiro-acesso, estados entrada e perfil (PAG-01.1, 01.3, 01.4 e PAG-02.3 a 02.16). Supabase todo interceptado
   (primeiro-acesso-api.ts); /guia, /mandato e /convite viram páginas vazias. */

const VAZIO = 'Preencha todos os campos e aceite o tratamento dos dados para continuar.';
const ERRO_NOME = 'Informe seu nome completo.';
const ERRO_DATA = 'Informe uma data de nascimento válida.';
const ERRO_TEL = 'Informe um telefone com DDD.';
const ERRO_SALVAR = 'Não foi possível salvar. Tente de novo.';
const ERRO_GOOGLE = 'Não foi possível entrar com o Google. Tente de novo.';
const CONCORDO = 'Li e concordo com o tratamento dos meus dados pessoais nos termos acima.';
const CONCORDO_SENSIVEIS = 'Concordo, de forma específica, com o tratamento dos meus dados de gênero, raça e data de nascimento para essa finalidade.';

const alerta = (page: Page) => page.locator('.cv-corpo').getByRole('alert');
const enviar = (page: Page) => page.getByRole('button', { name: 'Salvar e continuar' });

async function abreFormulario(page: Page, estado: EstadoPerfil = {}, url = '/primeiro-acesso?volta=guia') {
  await semeiaSessao(page);
  await mocaPerfil(page, estado);
  await page.goto(url);
  await expect(page.getByRole('heading', { name: 'Conte um pouco sobre você' })).toBeVisible();
}

// Preenche tudo, com as duas caixas marcadas; cada teste desfaz o que quer provar.
async function preenche(page: Page, o: { nome?: string; nascimento?: string; telefone?: string; atua?: 'sim' | 'nao' } = {}) {
  await page.getByLabel('Nome completo', { exact: true }).fill(o.nome ?? 'Carlos Lima');
  await page.getByLabel('Data de nascimento', { exact: true }).fill(o.nascimento ?? '1990-05-17');
  await page.getByLabel('Gênero', { exact: true }).selectOption({ label: 'Homem cisgênero' });
  await page.getByLabel('Raça', { exact: true }).selectOption({ label: 'Parda' });
  await page.getByLabel('Telefone com DDD', { exact: true }).fill(o.telefone ?? '(11) 98765-4321');
  if ((o.atua ?? 'sim') === 'sim') {
    await page.getByLabel('Sim', { exact: true }).check();
    await page.getByLabel('Há quanto tempo?', { exact: true }).selectOption({ label: '3 a 5 anos' });
  } else {
    await page.getByLabel('Não', { exact: true }).check();
  }
  await page.getByLabel(CONCORDO).check();
  await page.getByLabel(CONCORDO_SENSIVEIS).check();
}

test.afterEach(() => {
  expect(naoMapeadas()).toEqual([]);
});

test.describe('Entrada (PAG-01)', () => {
  test('sem sessão mostra só "Entrar com Google", sem senha, e-mail nem criar conta (PAG-01.1)', async ({ page }) => {
    await mocaPerfil(page);
    await page.goto('/primeiro-acesso?volta=guia');
    await expect(page.getByRole('button', { name: 'Entrar com Google', exact: true })).toBeVisible();
    await expect(page.locator('.cv-corpo input')).toHaveCount(0);
    await expect(page.getByText(/senha|criar conta|entrar com e-mail/i)).toHaveCount(0);
  });

  test('"Entrar com Google" sai para o Google e volta a /primeiro-acesso com o mesmo `volta`', async ({ page }) => {
    await mocaPerfil(page);
    await page.goto('/primeiro-acesso?volta=mandato');
    await page.getByRole('button', { name: 'Entrar com Google', exact: true }).click();
    await expect.poll(() => auth('authorize').length).toBe(1);
    const destino = new URL(auth('authorize')[0].caminho, 'http://x').searchParams.get('redirect_to');
    expect(destino).toMatch(/\/primeiro-acesso\?volta=mandato$/);
  });

  test('na volta do Google guarda a sessão em legisla.tok, limpa o endereço e segue o fluxo (PAG-01.3)', async ({ page }) => {
    await mocaPerfil(page);
    await page.goto('/primeiro-acesso?volta=guia#access_token=tok-carlos&refresh_token=ref-carlos');
    await expect(page.getByRole('heading', { name: 'Conte um pouco sobre você' })).toBeVisible();
    expect(JSON.parse((await localDe(page, 'legisla.tok'))!)).toEqual({ access_token: 'tok-carlos', refresh_token: 'ref-carlos' });
    expect(page.url()).not.toContain('access_token');
    expect(new URL(page.url()).search).toBe('?volta=guia');
  });

  test('erro ou cancelamento do Google mostra a mensagem e mantém o botão (PAG-01.4)', async ({ page }) => {
    await mocaPerfil(page);
    await page.goto('/primeiro-acesso?volta=guia#error=access_denied&error_description=Access+denied');
    await expect(alerta(page)).toHaveText(ERRO_GOOGLE);
    await expect(page.getByRole('button', { name: 'Entrar com Google', exact: true })).toBeEnabled();
    expect(page.url()).not.toContain('error_description');
  });
});

test.describe('Formulário (PAG-02.3 a 02.7)', () => {
  test('traz os 7 campos, as listas da spec, o aviso da LGPD e as duas caixas de consentimento', async ({ page }) => {
    await abreFormulario(page);
    for (const rotulo of ['Nome completo', 'Data de nascimento', 'Gênero', 'Raça', 'Telefone com DDD']) {
      await expect(page.getByLabel(rotulo, { exact: true })).toBeVisible();
    }
    await expect(page.getByRole('group', { name: 'Atua na política?' })).toBeVisible();
    await expect(page.getByLabel('Sim', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Não', { exact: true })).toBeVisible();
    const opcoes = (rotulo: string) => page.getByLabel(rotulo, { exact: true }).locator('option').allTextContents();
    expect(await opcoes('Gênero')).toEqual(['Selecione', 'Mulher cisgênero', 'Homem cisgênero', 'Mulher transgênero', 'Homem transgênero', 'Travesti', 'Pessoa não binária', 'Outra identidade', 'Prefiro não informar']);
    expect(await opcoes('Raça')).toEqual(['Selecione', 'Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Prefiro não informar']);
    await expect(page.locator('.cv-lgpd')).toContainText('Proteção de dados pessoais (LGPD, Lei nº 13.709/2018).');
    await expect(page.getByLabel(CONCORDO)).not.toBeChecked();
    await expect(page.getByLabel(CONCORDO_SENSIVEIS)).not.toBeChecked();
  });

  test('o tempo só aparece com "Sim", com as 5 faixas da spec (PAG-02.4, 02.5)', async ({ page }) => {
    await abreFormulario(page);
    await expect(page.getByLabel('Há quanto tempo?', { exact: true })).toHaveCount(0);
    await page.getByLabel('Sim', { exact: true }).check();
    expect(await page.getByLabel('Há quanto tempo?', { exact: true }).locator('option').allTextContents())
      .toEqual(['Selecione', 'Menos de 1 ano', '1 a 2 anos', '3 a 5 anos', '6 a 10 anos', 'Mais de 10 anos']);
    await page.getByLabel('Não', { exact: true }).check();
    await expect(page.getByLabel('Há quanto tempo?', { exact: true })).toHaveCount(0);
  });

  test('o nome da conta Google vem preenchido e pode ser editado (PAG-02.7)', async ({ page }) => {
    await abreFormulario(page, { nomeGoogle: 'Carlos Alberto Lima' });
    await expect(page.getByLabel('Nome completo', { exact: true })).toHaveValue('Carlos Alberto Lima');
    await page.getByLabel('Nome completo', { exact: true }).fill('Carlos A. Lima');
    await expect(page.getByLabel('Nome completo', { exact: true })).toHaveValue('Carlos A. Lima');
  });

  test('conta Google sem nome abre o formulário com o nome vazio', async ({ page }) => {
    await abreFormulario(page);
    await expect(page.getByLabel('Nome completo', { exact: true })).toHaveValue('');
  });
});

test.describe('Recusas no formulário (PAG-02.8 a 02.11)', () => {
  test('campo vazio: recusa, destaca o primeiro campo vazio e não chama o banco (PAG-02.8)', async ({ page }) => {
    await abreFormulario(page);
    await enviar(page).click();
    await expect(alerta(page)).toHaveText(VAZIO);
    await expect(page.getByLabel('Nome completo', { exact: true })).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Nome completo', { exact: true })).toBeFocused();
    expect(salvamentos()).toHaveLength(0);
  });

  test('caixa geral desmarcada: recusa e destaca a caixa, com os outros guardas satisfeitos (PAG-02.8)', async ({ page }) => {
    await abreFormulario(page);
    await preenche(page);
    await page.getByLabel(CONCORDO).uncheck();
    await enviar(page).click();
    await expect(alerta(page)).toHaveText(VAZIO);
    await expect(page.locator('.pa-chk').first()).toHaveAttribute('data-invalido', 'true');
    expect(salvamentos()).toHaveLength(0);
  });

  test('caixa dos dados sensíveis desmarcada: recusa e destaca a caixa, com os outros guardas satisfeitos (PAG-02.8)', async ({ page }) => {
    await abreFormulario(page);
    await preenche(page);
    await page.getByLabel(CONCORDO_SENSIVEIS).uncheck();
    await enviar(page).click();
    await expect(alerta(page)).toHaveText(VAZIO);
    await expect(page.locator('.pa-chk').nth(1)).toHaveAttribute('data-invalido', 'true');
    expect(salvamentos()).toHaveLength(0);
  });

  test('nome com uma palavra: "Informe seu nome completo.", campo destacado e dados mantidos (PAG-02.9)', async ({ page }) => {
    await abreFormulario(page);
    await preenche(page, { nome: 'Carlos' });
    await enviar(page).click();
    await expect(alerta(page)).toHaveText(ERRO_NOME);
    await expect(page.getByLabel('Nome completo', { exact: true })).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Telefone com DDD', { exact: true })).toHaveValue('(11) 98765-4321');
    expect(salvamentos()).toHaveLength(0);
  });

  test('data futura: "Informe uma data de nascimento válida." (PAG-02.10)', async ({ page }) => {
    await abreFormulario(page);
    await preenche(page, { nascimento: '2999-01-01' });
    await enviar(page).click();
    await expect(alerta(page)).toHaveText(ERRO_DATA);
    await expect(page.getByLabel('Data de nascimento', { exact: true })).toHaveAttribute('aria-invalid', 'true');
    expect(salvamentos()).toHaveLength(0);
  });

  test('telefone sem DDD: "Informe um telefone com DDD." (PAG-02.11)', async ({ page }) => {
    await abreFormulario(page);
    await preenche(page, { telefone: '98765-4321' });
    await enviar(page).click();
    await expect(alerta(page)).toHaveText(ERRO_TEL);
    await expect(page.getByLabel('Telefone com DDD', { exact: true })).toHaveAttribute('aria-invalid', 'true');
    expect(salvamentos()).toHaveLength(0);
  });
});

test.describe('Envio (PAG-02.12 a 02.14)', () => {
  test('formulário válido grava com os argumentos p_* (telefone só com dígitos) e segue ao ponto de partida (PAG-02.12)', async ({ page }) => {
    await abreFormulario(page);
    await preenche(page);
    await enviar(page).click();
    await expect(page).toHaveURL(/\/guia$/);
    expect(salvamentos()).toHaveLength(1);
    expect(argumentosSalvar(salvamentos()[0])).toEqual(PERFIL_VALIDO);
  });

  test('"Não" em "Atua na política?" grava p_atua false e p_tempo nulo (PAG-02.5)', async ({ page }) => {
    await abreFormulario(page);
    await preenche(page, { atua: 'nao' });
    await enviar(page).click();
    await expect(page).toHaveURL(/\/guia$/);
    expect(argumentosSalvar(salvamentos()[0])).toEqual({ ...PERFIL_VALIDO, p_atua: false, p_tempo: null });
  });

  test('falha do servidor mostra "Não foi possível salvar. Tente de novo." e mantém o que foi digitado (PAG-02.13)', async ({ page }) => {
    await abreFormulario(page, { salvar: () => ({ status: 500, corpo: { message: 'boom' } }) });
    await preenche(page);
    await enviar(page).click();
    await expect(alerta(page)).toHaveText(ERRO_SALVAR);
    await expect(page.getByLabel('Nome completo', { exact: true })).toHaveValue('Carlos Lima');
    await expect(page.getByLabel('Telefone com DDD', { exact: true })).toHaveValue('(11) 98765-4321');
    await expect(page.getByLabel(CONCORDO)).toBeChecked();
    await expect(enviar(page)).toBeEnabled();
  });

  test('falha de rede mostra a mesma mensagem e deixa repetir (PAG-02.13)', async ({ page }) => {
    await abreFormulario(page, { salvar: () => ({ rede: true }) });
    await preenche(page);
    await enviar(page).click();
    await expect(alerta(page)).toHaveText(ERRO_SALVAR);
    await expect(enviar(page)).toBeEnabled();
  });

  test('recusa 4xx que não é 401 mostra "Não foi possível salvar. Tente de novo." sem perder os dados', async ({ page }) => {
    await abreFormulario(page, { salvar: () => ({ status: 403, corpo: { message: 'permission denied' } }) });
    await preenche(page);
    await enviar(page).click();
    await expect(alerta(page)).toHaveText(ERRO_SALVAR);
    await expect(page.getByLabel('Nome completo', { exact: true })).toHaveValue('Carlos Lima');
    await expect(enviar(page)).toBeEnabled();
  });

  test('o banco recusa um campo: a mensagem da spec vem com o campo destacado (PAG-02.10)', async ({ page }) => {
    await abreFormulario(page, { salvar: () => ({ corpo: { ok: false, erro: 'nascimento' } }) });
    await preenche(page);
    await enviar(page).click();
    await expect(alerta(page)).toHaveText(ERRO_DATA);
    await expect(page.getByLabel('Data de nascimento', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  });

  test('401 na gravação renova a sessão uma vez e repete a chamada (PAG-01.3)', async ({ page }) => {
    let n = 0;
    await abreFormulario(page, { salvar: () => (++n === 1 ? { status: 401, corpo: { message: 'JWT expired' } } : { corpo: { ok: true } }) });
    await preenche(page);
    await enviar(page).click();
    await expect(page).toHaveURL(/\/guia$/);
    expect(salvamentos().map((c) => c.token)).toEqual(['tok-carlos', 'tok-novo-carlos']);
  });

  test('401 que a renovação não resolve volta à entrada com o botão do Google', async ({ page }) => {
    await abreFormulario(page, { renovacao: 'falha', salvar: () => ({ status: 401, corpo: { message: 'JWT expired' } }) });
    await preenche(page);
    await enviar(page).click();
    await expect(page.getByRole('button', { name: 'Entrar com Google', exact: true })).toBeVisible();
    await expect(page.getByLabel('Nome completo', { exact: true })).toHaveCount(0);
  });

  test('duplo clique em enviar grava um único perfil (PAG-02.14)', async ({ page }) => {
    await abreFormulario(page);
    await preenche(page);
    await enviar(page).dblclick();
    await expect(page).toHaveURL(/\/guia$/);
    expect(salvamentos()).toHaveLength(1);
  });
});

test.describe('Quem não vê o formulário (PAG-02.15, 02.16)', () => {
  test('quem já tem perfil não vê o formulário e segue ao ponto de partida (PAG-02.15)', async ({ page }) => {
    await semeiaSessao(page);
    await mocaPerfil(page, { temPerfil: true });
    await page.goto('/primeiro-acesso?volta=mandato');
    await expect(page).toHaveURL(/\/mandato$/);
    expect(rpcs('perfil_salvar')).toHaveLength(0);
  });

  test('quem é da equipe Legisla não vê o formulário, mesmo sem perfil (PAG-02.16)', async ({ page }) => {
    await semeiaSessao(page);
    await mocaPerfil(page, { legisla: true, temPerfil: false });
    await page.goto('/primeiro-acesso?volta=guia');
    await expect(page).toHaveURL(/\/guia$/);
  });

  test('falha na consulta de perfil mostra o erro e nunca abre o formulário', async ({ page }) => {
    await semeiaSessao(page);
    await mocaPerfil(page, { perfilLeitura: 'servidor' });
    await page.goto('/primeiro-acesso?volta=guia');
    await expect(alerta(page)).toHaveText('Não foi possível concluir. Tente de novo.');
    await expect(page.getByRole('button', { name: 'Tentar de novo' })).toBeVisible();
    await expect(page.getByLabel('Nome completo', { exact: true })).toHaveCount(0);
  });
});

test('em 400 px de largura o formulário não rola na horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await abreFormulario(page);
  const [largura, visivel] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(largura).toBeLessThanOrEqual(visivel);
});
