import { test, expect, type Page } from '@playwright/test';
import { TOKEN, naoMapeadas, rpcs, semeiaSessao } from './convite-api';
import { ANA, MANDATO_A, mocaMandato, pessoa, type EstadoMandato, type MandatoDaPessoa } from './mandato-api';

/* Tela Equipe e convites (ACE-01, ACE-03.7, ACE-04). Supabase todo interceptado (mandato-api.ts). */

const MARIANA = { access_token: 'tok-mariana', refresh_token: 'ref-mariana' };
const EU = pessoa('Mariana Rocha', 'assessoria', 'mariana@gabinete.test', 'uid-mariana');
const CRIADO = { id: 'c0000000-0000-4000-8000-000000000001', token: TOKEN, expira_em: '2027-02-19T12:00:00Z' };

const formulario = (page: Page) => page.getByRole('form', { name: 'Convidar uma pessoa' });
const nome = (page: Page) => formulario(page).getByLabel('Nome');
const email = (page: Page) => formulario(page).getByLabel('E-mail (opcional)');
const papel = (page: Page) => formulario(page).getByLabel('Papel');
const gerar = (page: Page) => formulario(page).getByRole('button', { name: 'Gerar link de convite' });
const alerta = (page: Page) => formulario(page).getByRole('alert');
const linkPronto = (page: Page) => page.getByTestId('link-convite');

async function abre(page: Page, estado: EstadoMandato = {}) {
  await semeiaSessao(page, MARIANA);
  await mocaMandato(page, {
    mandatos: [ANA],
    ...estado,
    rpc: { equipe_do_mandato: () => ({ corpo: [EU] }), convite_criar: () => ({ corpo: CRIADO }), ...estado.rpc },
  });
  await page.goto('/mandato/equipe');
  await expect(page.getByRole('heading', { level: 1, name: 'Equipe e convites' })).toBeVisible();
}

const comPapel = (p: string): MandatoDaPessoa => ({ ...ANA, papel: p });
const origem = (page: Page) => new URL(page.url()).origin;

test.afterEach(() => {
  expect(naoMapeadas()).toEqual([]);
});

test.describe('Sessão', () => {
  test('sem sessão a Equipe também pede a entrada, pois a casca é o layout das duas telas', async ({ page }) => {
    await mocaMandato(page, { mandatos: [ANA] });
    await page.goto('/mandato/equipe');
    await expect(page.locator('.md-corpo').getByRole('heading', { name: 'Entre para continuar' })).toBeVisible();
    await expect(formulario(page)).toHaveCount(0);
  });
});

test.describe('Gerar o link (ACE-01.1)', () => {
  test('com nome e papel mostra o link completo, a validade e os três botões', async ({ page }) => {
    await abre(page);
    await nome(page).fill('Carlos Lima');
    await gerar(page).click();
    await expect(linkPronto(page)).toHaveText(`${origem(page)}/convite#${TOKEN}`);
    await expect(formulario(page)).toContainText('Vale por 7 dias e só pode ser usado uma vez.');
    await expect(formulario(page).getByRole('button', { name: 'Copiar link' })).toBeVisible();
    await expect(formulario(page).getByRole('button', { name: 'Copiar mensagem pronta' })).toBeVisible();
    await expect(formulario(page).getByRole('link', { name: 'Abrir no WhatsApp' })).toBeVisible();
    expect(rpcs('convite_criar')).toHaveLength(1);
    expect(rpcs('convite_criar')[0].corpo).toEqual({ p_mandato: MANDATO_A, p_nome: 'Carlos Lima', p_email: null, p_papel: 'assessoria' });
    expect(rpcs('convite_criar')[0].token).toBe('tok-mariana');
  });

  test('o e-mail opcional vai sem espaços nas pontas e em minúsculas, e o papel escolhido vai junto', async ({ page }) => {
    await abre(page);
    await nome(page).fill('  Dora Alves ');
    await email(page).fill('  Dora@Gabinete.TEST ');
    await papel(page).selectOption('leitura');
    await gerar(page).click();
    await expect(linkPronto(page)).toBeVisible();
    expect(rpcs('convite_criar')[0].corpo).toEqual({ p_mandato: MANDATO_A, p_nome: 'Dora Alves', p_email: 'dora@gabinete.test', p_papel: 'leitura' });
  });

  test('gerar de novo troca o link mostrado pelo novo', async ({ page }) => {
    const tokens = [TOKEN, 'Zz8-1aBb_9CcDd2EeFf7Gg'];
    await abre(page, { rpc: { convite_criar: () => ({ corpo: { ...CRIADO, token: tokens.shift() } }) } });
    await nome(page).fill('Primeiro');
    await gerar(page).click();
    await expect(linkPronto(page)).toHaveText(`${origem(page)}/convite#${TOKEN}`);
    await nome(page).fill('Segundo');
    await gerar(page).click();
    await expect(linkPronto(page)).toHaveText(`${origem(page)}/convite#Zz8-1aBb_9CcDd2EeFf7Gg`);
    await expect(linkPronto(page)).toHaveCount(1);
  });
});

test.describe('Papéis oferecidos (ACE-04.9)', () => {
  const casos: [string, string[]][] = [
    ['coordenacao', ['Coordenação', 'Assessoria', 'Somente leitura']],
    ['assessoria', ['Assessoria', 'Somente leitura']],
    ['leitura', ['Somente leitura']],
  ];
  for (const [p, opcoes] of casos) {
    test(`quem é ${p} vê ${opcoes.join(', ')}`, async ({ page }) => {
      await abre(page, { mandatos: [comPapel(p)] });
      await expect(papel(page).locator('option')).toHaveText(opcoes);
    });
  }

  test('quem é leitura convida com o papel Somente leitura', async ({ page }) => {
    await abre(page, { mandatos: [comPapel('leitura')] });
    await nome(page).fill('Dora Alves');
    await gerar(page).click();
    await expect(linkPronto(page)).toBeVisible();
    expect(rpcs('convite_criar')[0].corpo).toMatchObject({ p_papel: 'leitura' });
  });
});

test.describe('Recusas (ACE-01.6 a 01.9)', () => {
  const TEXTO_NOME = 'Informe um nome de até 80 caracteres.';

  test('nome vazio ou só espaços mostra a mensagem da spec, sem chamar o banco nem mostrar link', async ({ page }) => {
    await abre(page);
    await nome(page).fill('   ');
    await gerar(page).click();
    await expect(alerta(page)).toHaveText(TEXTO_NOME);
    await expect(linkPronto(page)).toHaveCount(0);
    expect(rpcs('convite_criar')).toEqual([]);
  });

  test('nome com 81 caracteres é recusado e com 80 passa', async ({ page }) => {
    await abre(page);
    await nome(page).fill('x'.repeat(81));
    await gerar(page).click();
    await expect(alerta(page)).toHaveText(TEXTO_NOME);
    expect(rpcs('convite_criar')).toEqual([]);
    await nome(page).fill('x'.repeat(80));
    await gerar(page).click();
    await expect(linkPronto(page)).toBeVisible();
    await expect(alerta(page)).toHaveCount(0);
    expect(rpcs('convite_criar')).toHaveLength(1);
  });

  test('e-mail inválido ou com mais de 254 caracteres mostra "E-mail inválido." sem chamar o banco', async ({ page }) => {
    await abre(page);
    await nome(page).fill('Carlos Lima');
    for (const ruim of ['sem-arroba', 'a@b', 'a b@c.d', `${'a'.repeat(250)}@b.cd`]) {
      await email(page).fill(ruim);
      await gerar(page).click();
      await expect(alerta(page)).toHaveText('E-mail inválido.');
    }
    await expect(linkPronto(page)).toHaveCount(0);
    expect(rpcs('convite_criar')).toEqual([]);
  });

  test('papel maior que o de quem convida (recusa do banco) mostra a mensagem exata e nenhum link', async ({ page }) => {
    await abre(page, {
      rpc: { convite_criar: () => ({ status: 400, corpo: { message: 'Você só pode convidar com papel igual ou menor que o seu.' } }) },
    });
    await nome(page).fill('Carlos Lima');
    await papel(page).selectOption('assessoria');
    await gerar(page).click();
    await expect(alerta(page)).toHaveText('Você só pode convidar com papel igual ou menor que o seu.');
    await expect(linkPronto(page)).toHaveCount(0);
  });

  test('20 convites pendentes mostra a mensagem exata e nenhum link', async ({ page }) => {
    await abre(page, {
      rpc: { convite_criar: () => ({ status: 400, corpo: { message: 'Este mandato já tem 20 convites pendentes. Cancele algum para criar outro.' } }) },
    });
    await nome(page).fill('Carlos Lima');
    await gerar(page).click();
    await expect(alerta(page)).toHaveText('Este mandato já tem 20 convites pendentes. Cancele algum para criar outro.');
    await expect(linkPronto(page)).toHaveCount(0);
  });

  test('falha de rede mostra "Não foi possível concluir. Tente de novo." e um erro depois de um sucesso apaga o link antigo', async ({ page }) => {
    let vez = 0;
    await abre(page, { rpc: { convite_criar: () => (++vez === 1 ? { corpo: CRIADO } : { rede: true }) } });
    await nome(page).fill('Carlos Lima');
    await gerar(page).click();
    await expect(linkPronto(page)).toBeVisible();
    await nome(page).fill('Outro');
    await gerar(page).click();
    await expect(alerta(page)).toHaveText('Não foi possível concluir. Tente de novo.');
    await expect(linkPronto(page)).toHaveCount(0);
  });
});

test.describe('Enviar o link (ACE-01.1)', () => {
  const MENSAGEM = [
    'Olá! Mariana Rocha convidou você para a equipe do mandato de Ana Souza no Projeto 100 dias.',
    '',
    'Entre por este link:',
    '{link}',
    '',
    'O link é pessoal e vale por 7 dias.',
  ].join('\n');

  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  const geraConvite = async (page: Page) => {
    await abre(page);
    await nome(page).fill('Carlos Lima');
    await gerar(page).click();
    await expect(linkPronto(page)).toBeVisible();
  };

  test('"Copiar link" copia o link exato que está na tela', async ({ page }) => {
    await geraConvite(page);
    await formulario(page).getByRole('button', { name: 'Copiar link' }).click();
    await expect(formulario(page).getByRole('status')).toHaveText('Link copiado.');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${origem(page)}/convite#${TOKEN}`);
  });

  test('"Copiar mensagem pronta" copia a mensagem com quem convida, o mandato e o link', async ({ page }) => {
    await geraConvite(page);
    await formulario(page).getByRole('button', { name: 'Copiar mensagem pronta' }).click();
    await expect(formulario(page).getByRole('status')).toHaveText('Mensagem copiada.');
    // o Windows entrega a área de transferência com quebras CRLF; o texto é o mesmo
    const copiado = (await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n');
    expect(copiado).toBe(MENSAGEM.replace('{link}', `${origem(page)}/convite#${TOKEN}`));
  });

  test('"Abrir no WhatsApp" aponta para wa.me com a mensagem e abre em outra aba sem referrer', async ({ page }) => {
    await geraConvite(page);
    const wa = formulario(page).getByRole('link', { name: 'Abrir no WhatsApp' });
    const texto = MENSAGEM.replace('{link}', `${origem(page)}/convite#${TOKEN}`);
    await expect(wa).toHaveAttribute('href', `https://wa.me/?text=${encodeURIComponent(texto)}`);
    await expect(wa).toHaveAttribute('target', '_blank');
    await expect(wa).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('sem permissão da área de transferência avisa em vez de dizer que copiou', async ({ page, context }) => {
    await context.clearPermissions();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('negado')) }, configurable: true });
    });
    await geraConvite(page);
    await formulario(page).getByRole('button', { name: 'Copiar link' }).click();
    await expect(formulario(page).getByRole('status')).toHaveText('Não foi possível copiar. Selecione o texto e copie.');
  });
});

test.describe('O link aparece uma só vez (ACE-01.3)', () => {
  test('some ao recarregar a tela e o token não aparece em nenhum outro lugar', async ({ page }) => {
    await abre(page);
    await nome(page).fill('Carlos Lima');
    await gerar(page).click();
    await expect(linkPronto(page)).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Equipe e convites' })).toBeVisible();
    await expect(linkPronto(page)).toHaveCount(0);
    expect(await page.locator('body').innerText()).not.toContain(TOKEN);
    expect(await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }))).not.toContain(TOKEN);
  });

  test('o link some também ao trocar de mandato', async ({ page }) => {
    const outro = { ...ANA, id: '6f1c2b3a-0000-4000-8000-00000000b002', nome_parlamentar: 'Bruno Alves' };
    await abre(page, { mandatos: [ANA, outro] });
    await nome(page).fill('Carlos Lima');
    await gerar(page).click();
    await expect(linkPronto(page)).toBeVisible();
    await page.getByRole('combobox', { name: 'Mandato' }).selectOption(outro.id);
    await expect(page.getByRole('heading', { level: 1, name: 'Equipe e convites' })).toBeVisible();
    await expect(linkPronto(page)).toHaveCount(0);
  });
});

test.describe('Layout (ACE-04.13)', () => {
  test('em 400 px não há rolagem horizontal, com o link gerado e as mensagens de erro', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await abre(page);
    await nome(page).fill('Carlos Lima');
    await gerar(page).click();
    await expect(linkPronto(page)).toBeVisible();
    await nome(page).fill('x'.repeat(200));
    await email(page).fill('e'.repeat(60) + '@' + 'd'.repeat(60) + '.com');
    await gerar(page).click();
    await expect(alerta(page)).toBeVisible();
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra).toBeLessThanOrEqual(0);
  });

  test('o foco do teclado fica visível nos campos e no botão', async ({ page }) => {
    await abre(page);
    for (const alvo of [nome(page), email(page), papel(page), gerar(page)]) {
      await alvo.focus();
      expect(await alvo.evaluate((el) => getComputedStyle(el).outlineStyle + ' ' + getComputedStyle(el).outlineWidth)).toBe('solid 3px');
    }
  });
});
