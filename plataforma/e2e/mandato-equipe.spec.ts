import { test, expect, type Page } from '@playwright/test';
import { TOKEN, esperaSemRpc, localDe, naoMapeadas, rpcs, semeiaSessao } from './convite-api';
import { ANA, MANDATO_A, mocaMandato, pendente, pessoa, type EstadoMandato, type MandatoDaPessoa } from './mandato-api';

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

test.describe('Convites pendentes (ACE-04.2, 04.3, 04.5, 04.10, 04.11)', () => {
  const lista = (page: Page) => page.locator('.md-pendentes');
  const itens = (page: Page) => lista(page).locator('li');
  const AGORA = '2027-02-12T12:00:00Z';
  const dias = (n: number) => new Date(new Date(AGORA).getTime() + n * 86_400_000).toISOString();
  const marca = (page: Page) => page.evaluate(() => (window as unknown as { marca?: number }).marca);

  async function abrePendentes(page: Page, convites: ReturnType<typeof pendente>[], extra: NonNullable<EstadoMandato['rpc']> = {}) {
    await page.clock.setFixedTime(new Date(AGORA));
    await abre(page, { rpc: { convites_pendentes: () => ({ corpo: convites }), ...extra } });
  }

  test('mostra nome, papel, quem convidou e dias para expirar de cada convite', async ({ page }) => {
    await abrePendentes(page, [
      pendente('c1', 'Carlos Lima', 'assessoria', 'Mariana Rocha', dias(7)),
      pendente('c2', 'Dora Alves', 'leitura', 'João Pereira', dias(1)),
      pendente('c3', 'Eva Costa', 'coordenacao', null, dias(2)),
    ]);
    await expect(itens(page)).toHaveCount(3);
    await expect(itens(page).nth(0)).toContainText('Carlos Lima');
    await expect(itens(page).nth(0)).toContainText('Assessoria · enviado por Mariana Rocha · expira em 7 dias');
    await expect(itens(page).nth(1)).toContainText('Somente leitura · enviado por João Pereira · expira em 1 dia');
    await expect(itens(page).nth(1)).not.toContainText('1 dias');
    await expect(itens(page).nth(2)).toContainText('Coordenação · enviado por alguém da equipe · expira em 2 dias');
    await expect(lista(page).locator('.md-pilula')).toHaveText('3');
    expect(rpcs('convites_pendentes').map((c) => c.corpo)).toEqual([{ p_mandato: MANDATO_A }]);
  });

  test('dias que sobram contam para cima: 6 dias e 1 hora é "7 dias" e 3 horas é "1 dia"', async ({ page }) => {
    const mais = (ms: number) => new Date(new Date(AGORA).getTime() + ms).toISOString();
    await abrePendentes(page, [
      pendente('c1', 'Um', 'assessoria', 'Mariana Rocha', mais(6 * 86_400_000 + 3_600_000)),
      pendente('c2', 'Dois', 'assessoria', 'Mariana Rocha', mais(3 * 3_600_000)),
    ]);
    await expect(itens(page).nth(0)).toContainText('expira em 7 dias');
    await expect(itens(page).nth(1)).toContainText('expira em 1 dia');
  });

  test('"Cancelar" chama o banco com o id e tira o convite da lista sem recarregar a página', async ({ page }) => {
    await abrePendentes(page, [pendente('c1', 'Carlos Lima', 'assessoria', 'Mariana Rocha', dias(7)), pendente('c2', 'Dora Alves', 'leitura', 'Mariana Rocha', dias(5))], {
      convite_cancelar: () => ({}),
    });
    await expect(itens(page)).toHaveCount(2);
    await page.evaluate(() => { (window as unknown as { marca: number }).marca = 1; });
    await itens(page).filter({ hasText: 'Carlos Lima' }).getByRole('button', { name: 'Cancelar' }).click();
    await expect(itens(page)).toHaveCount(1);
    await expect(itens(page).first()).toContainText('Dora Alves');
    await expect(lista(page).locator('.md-pilula')).toHaveText('1');
    expect(rpcs('convite_cancelar').map((c) => c.corpo)).toEqual([{ p_id: 'c1' }]);
    expect(rpcs('convite_cancelar')[0].token).toBe('tok-mariana');
    expect(await marca(page)).toBe(1); // a página não recarregou
    expect(rpcs('convites_pendentes')).toHaveLength(1);
  });

  test('cancelar o último convite mostra "Nenhum convite pendente."', async ({ page }) => {
    await abrePendentes(page, [pendente('c1', 'Carlos Lima', 'assessoria', 'Mariana Rocha', dias(7))], { convite_cancelar: () => ({}) });
    await lista(page).getByRole('button', { name: 'Cancelar' }).click();
    await expect(lista(page)).toContainText('Nenhum convite pendente.');
    await expect(itens(page)).toHaveCount(0);
  });

  test('recusa de permissão do banco mostra a mensagem e o convite continua na lista', async ({ page }) => {
    await abrePendentes(page, [pendente('c1', 'Carlos Lima', 'assessoria', 'João Pereira', dias(7))], {
      convite_cancelar: () => ({ status: 403, corpo: { message: 'Você não tem permissão para esta ação.', code: '42501' } }),
    });
    await lista(page).getByRole('button', { name: 'Cancelar' }).click();
    await expect(lista(page).getByRole('alert')).toHaveText('Você não tem permissão para esta ação.');
    await expect(itens(page)).toHaveCount(1);
    await expect(lista(page).locator('.md-pilula')).toHaveText('1');
    await expect(lista(page).getByRole('button', { name: 'Cancelar' })).toBeEnabled();
  });

  test('falha de rede ao cancelar mostra "Não foi possível concluir. Tente de novo." e o convite fica', async ({ page }) => {
    await abrePendentes(page, [pendente('c1', 'Carlos Lima', 'assessoria', 'Mariana Rocha', dias(7))], { convite_cancelar: () => ({ rede: true }) });
    await lista(page).getByRole('button', { name: 'Cancelar' }).click();
    await expect(lista(page).getByRole('alert')).toHaveText('Não foi possível concluir. Tente de novo.');
    await expect(itens(page)).toHaveCount(1);
  });

  test('lista vazia mostra "Nenhum convite pendente." e zero na contagem', async ({ page }) => {
    await abrePendentes(page, []);
    await expect(lista(page)).toContainText('Nenhum convite pendente.');
    await expect(lista(page).locator('.md-pilula')).toHaveText('0');
  });

  test('um convite gerado no formulário aparece na lista sem recarregar a página', async ({ page }) => {
    const servidor = [pendente('c1', 'Carlos Lima', 'assessoria', 'Mariana Rocha', dias(7))];
    await abrePendentes(page, servidor, {
      convite_criar: (a) => { servidor.push(pendente('c9', String(a.p_nome), String(a.p_papel), 'Mariana Rocha', dias(7))); return { corpo: CRIADO }; },
      convites_pendentes: () => ({ corpo: [...servidor] }),
    });
    await expect(itens(page)).toHaveCount(1);
    await page.evaluate(() => { (window as unknown as { marca: number }).marca = 1; });
    await nome(page).fill('Dora Alves');
    await papel(page).selectOption('leitura');
    await gerar(page).click();
    await expect(itens(page)).toHaveCount(2);
    await expect(itens(page).nth(1)).toContainText('Dora Alves');
    await expect(itens(page).nth(1)).toContainText('Somente leitura · enviado por Mariana Rocha · expira em 7 dias');
    await expect(lista(page).locator('.md-pilula')).toHaveText('2');
    expect(await marca(page)).toBe(1);
  });

  test('falha ao ler a lista mostra a mensagem e o formulário continua funcionando', async ({ page }) => {
    await abrePendentes(page, [], { convites_pendentes: () => ({ rede: true }) });
    await expect(lista(page).getByRole('alert')).toHaveText('Não foi possível concluir. Tente de novo.');
    await expect(lista(page)).not.toContainText('Nenhum convite pendente.');
    await nome(page).fill('Carlos Lima');
    await gerar(page).click();
    await expect(linkPronto(page)).toBeVisible();
  });

  test('em 400 px a lista com nomes longos não cria rolagem horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await abrePendentes(page, [pendente('c1', 'Bartolomeu Nepomuceno de Albuquerque e Vasconcelos Filho Segundo', 'assessoria', 'Maria Aparecida Fernandes de Souza Pimentel', dias(7))]);
    await expect(itens(page)).toHaveCount(1);
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra).toBeLessThanOrEqual(0);
  });
});

test.describe('Pessoas do mandato (ACE-04.1, 04.6 a 04.8, 04.10, 04.12, ACE-03.7)', () => {
  const secao = (page: Page) => page.locator('.md-pessoas');
  const linhas = (page: Page) => secao(page).locator('li');
  const linhaDe = (page: Page, quem: string) => linhas(page).filter({ hasText: quem });
  const marca = (page: Page) => page.evaluate(() => (window as unknown as { marca?: number }).marca);

  const MARIA = pessoa('Mariana Rocha', 'coordenacao', 'mariana@gabinete.test', 'uid-mariana');
  const JOAO = pessoa('João Pereira', 'assessoria', 'joao@gabinete.test', 'uid-joao');
  const LUIZA = pessoa('Luiza Ferraz', 'leitura', 'luiza@gabinete.test', 'uid-luiza');
  const EQUIPE = [MARIA, JOAO, LUIZA];

  async function abrePessoas(page: Page, meuPapel: string, extra: NonNullable<EstadoMandato['rpc']> = {}, equipe = EQUIPE) {
    await abre(page, { mandatos: [comPapel(meuPapel)], rpc: { equipe_do_mandato: () => ({ corpo: equipe }), ...extra } });
    await expect(linhas(page)).toHaveCount(equipe.length);
    await page.evaluate(() => { (window as unknown as { marca: number }).marca = 1; });
  }

  test('mostra nome, e-mail e papel de cada pessoa e marca "você" só na própria linha', async ({ page }) => {
    await abrePessoas(page, 'coordenacao');
    await expect(linhaDe(page, 'Mariana Rocha')).toContainText('mariana@gabinete.test');
    await expect(linhaDe(page, 'Mariana Rocha').locator('.md-voce')).toHaveText('você');
    await expect(linhaDe(page, 'Mariana Rocha').locator('.md-papel-txt')).toHaveText('Coordenação');
    await expect(linhaDe(page, 'João Pereira')).toContainText('joao@gabinete.test');
    await expect(linhaDe(page, 'João Pereira').locator('.md-voce')).toHaveCount(0);
    await expect(linhaDe(page, 'João Pereira').getByLabel('Papel de João Pereira')).toHaveValue('assessoria');
    await expect(linhaDe(page, 'Luiza Ferraz').getByLabel('Papel de Luiza Ferraz')).toHaveValue('leitura');
    await expect(secao(page).locator('.md-pilula')).toHaveText('3');
    expect(rpcs('equipe_do_mandato').map((c) => c.corpo)).toEqual([{ p_mandato: MANDATO_A }]);
  });

  test('coordenação vê seletor e "Remover" nas linhas das outras pessoas, e nenhum dos dois na própria', async ({ page }) => {
    await abrePessoas(page, 'coordenacao');
    const minha = linhaDe(page, 'Mariana Rocha');
    await expect(minha.getByRole('combobox')).toHaveCount(0);
    await expect(minha.getByRole('button')).toHaveCount(0);
    for (const outra of ['João Pereira', 'Luiza Ferraz']) {
      await expect(linhaDe(page, outra).getByRole('combobox')).toHaveCount(1);
      await expect(linhaDe(page, outra).getByRole('combobox').locator('option')).toHaveText(['Coordenação', 'Assessoria', 'Somente leitura']);
      await expect(linhaDe(page, outra).getByRole('button', { name: `Remover ${outra}` })).toHaveText('Remover');
    }
  });

  for (const meuPapel of ['assessoria', 'leitura']) {
    test(`quem é ${meuPapel} vê os papéis como texto, sem seletor e sem "Remover"`, async ({ page }) => {
      await abrePessoas(page, meuPapel);
      await expect(secao(page).getByRole('combobox')).toHaveCount(0);
      await expect(secao(page).getByRole('button')).toHaveCount(0);
      await expect(linhaDe(page, 'Mariana Rocha').locator('.md-papel-txt')).toHaveText('Coordenação');
      await expect(linhaDe(page, 'João Pereira').locator('.md-papel-txt')).toHaveText('Assessoria');
      await expect(linhaDe(page, 'Luiza Ferraz').locator('.md-papel-txt')).toHaveText('Somente leitura');
    });
  }

  test('trocar o papel chama o banco e atualiza a lista sem recarregar a página', async ({ page }) => {
    await abrePessoas(page, 'coordenacao', { membro_trocar_papel: () => ({}) });
    await linhaDe(page, 'Luiza Ferraz').getByLabel('Papel de Luiza Ferraz').selectOption('coordenacao');
    await expect.poll(() => rpcs('membro_trocar_papel').length).toBe(1);
    expect(rpcs('membro_trocar_papel')[0].corpo).toEqual({ p_mandato: MANDATO_A, p_user: 'uid-luiza', p_papel: 'coordenacao' });
    expect(rpcs('membro_trocar_papel')[0].token).toBe('tok-mariana');
    await expect(linhaDe(page, 'Luiza Ferraz').getByLabel('Papel de Luiza Ferraz')).toHaveValue('coordenacao');
    await expect(linhas(page)).toHaveCount(3);
    expect(await marca(page)).toBe(1);
    expect(rpcs('equipe_do_mandato')).toHaveLength(1); // a lista foi atualizada na tela, sem nova leitura
  });

  test('recusa ao trocar o papel mostra a mensagem do banco e a lista não muda', async ({ page }) => {
    await abrePessoas(page, 'coordenacao', {
      membro_trocar_papel: () => ({ status: 400, corpo: { message: 'O mandato precisa ter ao menos uma pessoa na coordenação.' } }),
    });
    await linhaDe(page, 'João Pereira').getByLabel('Papel de João Pereira').selectOption('leitura');
    await expect(linhaDe(page, 'João Pereira').getByRole('alert')).toHaveText('O mandato precisa ter ao menos uma pessoa na coordenação.');
    await expect(linhaDe(page, 'João Pereira').getByLabel('Papel de João Pereira')).toHaveValue('assessoria');
    await expect(linhas(page)).toHaveCount(3);
  });

  test('sem permissão (papel mudou por fora) a troca mostra a mensagem de permissão e nada muda', async ({ page }) => {
    await abrePessoas(page, 'coordenacao', {
      membro_trocar_papel: () => ({ status: 403, corpo: { message: 'Você não tem permissão para esta ação.', code: '42501' } }),
    });
    await linhaDe(page, 'João Pereira').getByLabel('Papel de João Pereira').selectOption('coordenacao');
    await expect(linhaDe(page, 'João Pereira').getByRole('alert')).toHaveText('Você não tem permissão para esta ação.');
    await expect(linhaDe(page, 'João Pereira').getByLabel('Papel de João Pereira')).toHaveValue('assessoria');
  });

  test('"Remover" pede confirmação na própria tela; só confirmar chama o banco e tira a pessoa da lista', async ({ page }) => {
    await abrePessoas(page, 'coordenacao', { membro_remover: () => ({}) });
    await linhaDe(page, 'João Pereira').getByRole('button', { name: 'Remover João Pereira' }).click();
    const confirma = linhaDe(page, 'João Pereira').getByRole('group', { name: 'Confirmar a remoção de João Pereira' });
    await expect(confirma).toContainText('Remover João Pereira do mandato?');
    await expect(confirma).toContainText('A conta dela continua na plataforma');
    expect(rpcs('membro_remover')).toEqual([]);
    // desistir não chama o banco e fecha a confirmação
    await confirma.getByRole('button', { name: 'Não remover' }).click();
    await expect(confirma).toHaveCount(0);
    expect(rpcs('membro_remover')).toEqual([]);
    // confirmar chama o banco e atualiza a lista, sem recarregar
    await linhaDe(page, 'João Pereira').getByRole('button', { name: 'Remover João Pereira' }).click();
    await confirma.getByRole('button', { name: 'Confirmar remoção' }).click();
    await expect(linhas(page)).toHaveCount(2);
    await expect(secao(page)).not.toContainText('João Pereira');
    await expect(secao(page).locator('.md-pilula')).toHaveText('2');
    expect(rpcs('membro_remover').map((c) => c.corpo)).toEqual([{ p_mandato: MANDATO_A, p_user: 'uid-joao' }]);
    expect(await marca(page)).toBe(1);
  });

  test('recusa ao remover (última coordenação) mostra a mensagem exata e a lista não muda', async ({ page }) => {
    await abrePessoas(page, 'coordenacao', {
      membro_remover: () => ({ status: 400, corpo: { message: 'O mandato precisa ter ao menos uma pessoa na coordenação.' } }),
    });
    await linhaDe(page, 'Luiza Ferraz').getByRole('button', { name: 'Remover Luiza Ferraz' }).click();
    await linhaDe(page, 'Luiza Ferraz').getByRole('button', { name: 'Confirmar remoção' }).click();
    await expect(linhaDe(page, 'Luiza Ferraz').getByRole('alert')).toHaveText('O mandato precisa ter ao menos uma pessoa na coordenação.');
    await expect(linhas(page)).toHaveCount(3);
    await expect(secao(page).locator('.md-pilula')).toHaveText('3');
    await expect(linhaDe(page, 'Luiza Ferraz').getByRole('button', { name: 'Remover Luiza Ferraz' })).toBeEnabled();
  });

  test('mostra "A equipe da Legisla acompanha este mandato, conforme o cadastro."', async ({ page }) => {
    await abrePessoas(page, 'leitura');
    await expect(secao(page)).toContainText('A equipe da Legisla acompanha este mandato, conforme o cadastro.');
  });

  test('a ordem da tela é formulário, convites pendentes e pessoas', async ({ page }) => {
    await abrePessoas(page, 'coordenacao');
    const titulos = await page.locator('.md-tela h2').allInnerTexts();
    expect(titulos).toEqual(['Convidar uma pessoa', 'Convites pendentes', 'Pessoas neste mandato']);
    const ys = await Promise.all(['.md-form', '.md-pendentes', '.md-pessoas'].map(async (s) => (await page.locator(s).boundingBox())!.y));
    expect(ys[0]).toBeLessThan(ys[1]);
    expect(ys[1]).toBeLessThan(ys[2]);
  });

  test('falha ao ler as pessoas mostra a mensagem e mantém a linha sobre a equipe da Legisla', async ({ page }) => {
    await abre(page, { mandatos: [comPapel('coordenacao')], rpc: { equipe_do_mandato: () => ({ rede: true }) } });
    await expect(secao(page).getByRole('alert')).toHaveText('Não foi possível concluir. Tente de novo.');
    await expect(linhas(page)).toHaveCount(0);
    await expect(secao(page)).toContainText('A equipe da Legisla acompanha este mandato');
  });

  test('em 400 px, com nomes e e-mails longos e os controles de coordenação, não há rolagem horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    const longos = [
      MARIA,
      pessoa('Bartolomeu Nepomuceno de Albuquerque e Vasconcelos Filho', 'assessoria', 'bartolomeu.nepomuceno.de.albuquerque.vasconcelos.filho@gabinete-do-mandato.example.org', 'uid-barto'),
    ];
    await abrePessoas(page, 'coordenacao', {}, longos);
    await linhaDe(page, 'Bartolomeu').getByRole('button', { name: /^Remover/ }).click();
    await expect(linhaDe(page, 'Bartolomeu').getByRole('group')).toBeVisible();
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra).toBeLessThanOrEqual(0);
  });
});

test.describe('Sair do mandato (ACE-04.14 a 04.18, ACE-03.9)', () => {
  const area = (page: Page) => page.getByRole('region', { name: 'Sair do mandato' });
  const botao = (page: Page) => area(page).getByRole('button', { name: 'Sair do mandato' });
  const confirma = (page: Page) => area(page).getByRole('group', { name: 'Confirmar a saída do mandato' });
  const linhaDe = (page: Page, quem: string) => page.locator('.md-pessoas li').filter({ hasText: quem });
  const caminho = (page: Page) => new URL(page.url()).pathname;
  const UNICA = 'Você é a única pessoa na coordenação. Promova outra pessoa para a Coordenação antes de sair.';
  const MARIA = pessoa('Mariana Rocha', 'coordenacao', 'mariana@gabinete.test', 'uid-mariana');
  const JOAO = pessoa('João Pereira', 'assessoria', 'joao@gabinete.test', 'uid-joao');
  const JOAO_COORD = { ...JOAO, papel: 'coordenacao' };

  // devolve as janelas do navegador (confirm, alert) que a página abriu: a confirmação é na própria página
  async function abreSair(page: Page, meuPapel: string, equipe: ReturnType<typeof pessoa>[], extra: NonNullable<EstadoMandato['rpc']> = {}) {
    const janelas: string[] = [];
    page.on('dialog', (d) => { janelas.push(d.type()); d.dismiss().catch(() => {}); });
    await abre(page, { mandatos: [comPapel(meuPapel)], rpc: { equipe_do_mandato: () => ({ corpo: equipe }), ...extra } });
    await expect(page.locator('.md-pessoas li')).toHaveCount(equipe.length);
    return janelas;
  }

  for (const meuPapel of ['coordenacao', 'assessoria', 'leitura']) {
    test(`quem é ${meuPapel} vê "Sair do mandato" depois de "Pessoas neste mandato", fora da lista`, async ({ page }) => {
      await abreSair(page, meuPapel, [{ ...EU, papel: meuPapel }, JOAO_COORD]);
      await expect(botao(page)).toBeVisible();
      await expect(botao(page)).toBeEnabled();
      await expect(page.locator('.md-pessoas').getByRole('button', { name: 'Sair do mandato' })).toHaveCount(0);
      const yPessoas = (await page.locator('.md-pessoas').boundingBox())!.y;
      expect((await area(page).boundingBox())!.y).toBeGreaterThan(yPessoas);
    });
  }

  test('clicar pede a confirmação na própria página; "Não sair" fecha sem chamar o banco; "Confirmar saída" chama membro_sair, apaga o mandato ativo e abre o Guia', async ({ page }) => {
    const janelas = await abreSair(page, 'assessoria', [EU, JOAO_COORD], { membro_sair: () => ({}) });
    expect(await localDe(page, 'legisla.mandatoAtual')).toBe(MANDATO_A);
    await botao(page).click();
    await expect(confirma(page)).toContainText('Sair de Ana Souza?');
    await confirma(page).getByRole('button', { name: 'Não sair' }).click();
    await expect(confirma(page)).toHaveCount(0);
    expect(await esperaSemRpc(page, 'membro_sair')).toEqual([]);
    await botao(page).click();
    await confirma(page).getByRole('button', { name: 'Confirmar saída' }).click();
    await expect(page.getByRole('heading', { name: 'Guia aberto' })).toBeVisible();
    expect(caminho(page)).toBe('/guia');
    expect(rpcs('membro_sair').map((c) => ({ corpo: c.corpo, token: c.token }))).toEqual([{ corpo: { p_mandato: MANDATO_A }, token: 'tok-mariana' }]);
    expect(await localDe(page, 'legisla.mandatoAtual')).toBeNull();
    expect(janelas).toEqual([]);
  });

  test('a única coordenação recebe a orientação no clique e o banco não é chamado', async ({ page }) => {
    const janelas = await abreSair(page, 'coordenacao', [MARIA, JOAO], { membro_sair: () => ({}) });
    await botao(page).click();
    await expect(area(page).getByRole('alert')).toHaveText(UNICA);
    await expect(confirma(page)).toHaveCount(0);
    expect(await esperaSemRpc(page, 'membro_sair')).toEqual([]);
    expect(caminho(page)).toBe('/mandato/equipe');
    expect(await localDe(page, 'legisla.mandatoAtual')).toBe(MANDATO_A);
    expect(janelas).toEqual([]);
  });

  test('com outra pessoa na coordenação, a coordenação confirma e sai', async ({ page }) => {
    await abreSair(page, 'coordenacao', [MARIA, JOAO_COORD], { membro_sair: () => ({}) });
    await botao(page).click();
    await expect(area(page).getByRole('alert')).toHaveCount(0);
    await confirma(page).getByRole('button', { name: 'Confirmar saída' }).click();
    await expect(page.getByRole('heading', { name: 'Guia aberto' })).toBeVisible();
    expect(rpcs('membro_sair').map((c) => c.corpo)).toEqual([{ p_mandato: MANDATO_A }]);
  });

  test('promover outra pessoa para a Coordenação na mesma tela libera a saída, sem recarregar', async ({ page }) => {
    await abreSair(page, 'coordenacao', [MARIA, JOAO], { membro_trocar_papel: () => ({}) });
    await botao(page).click();
    await expect(area(page).getByRole('alert')).toHaveText(UNICA);
    await linhaDe(page, 'João Pereira').getByLabel('Papel de João Pereira').selectOption('coordenacao');
    await expect(linhaDe(page, 'João Pereira').getByLabel('Papel de João Pereira')).toHaveValue('coordenacao');
    await expect(linhaDe(page, 'João Pereira').getByLabel('Papel de João Pereira')).toBeEnabled();
    await botao(page).click();
    await expect(area(page).getByRole('alert')).toHaveCount(0);
    await expect(confirma(page)).toBeVisible();
    expect(rpcs('equipe_do_mandato')).toHaveLength(1);
  });

  for (const [caso, resposta, mensagem] of [
    ['a recusa da coordenação', { status: 400, corpo: { message: 'O mandato precisa ter ao menos uma pessoa na coordenação.' } }, 'O mandato precisa ter ao menos uma pessoa na coordenação.'],
    ['a falha de rede', { rede: true }, 'Não foi possível concluir. Tente de novo.'],
  ] as const) {
    test(`${caso} ao sair mostra a mensagem e a pessoa continua na tela, com o mesmo mandato ativo`, async ({ page }) => {
      // a lista ainda mostra outra coordenação, mas no banco ela já saiu
      await abreSair(page, 'coordenacao', [MARIA, JOAO_COORD], { membro_sair: () => resposta });
      await botao(page).click();
      await confirma(page).getByRole('button', { name: 'Confirmar saída' }).click();
      await expect(area(page).getByRole('alert')).toHaveText(mensagem);
      await expect(confirma(page)).toHaveCount(0);
      expect(rpcs('membro_sair')).toHaveLength(1);
      expect(caminho(page)).toBe('/mandato/equipe');
      expect(await localDe(page, 'legisla.mandatoAtual')).toBe(MANDATO_A);
      await expect(botao(page)).toBeEnabled();
    });
  }

  test('em 400 px, com a confirmação aberta, não há rolagem horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await abreSair(page, 'coordenacao', [MARIA, JOAO_COORD]);
    await botao(page).click();
    await expect(confirma(page)).toBeVisible();
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra).toBeLessThanOrEqual(0);
  });
});
