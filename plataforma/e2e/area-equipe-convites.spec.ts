import { test, expect, type Page } from '@playwright/test';
import * as area from './area-api';

/* Aba Equipe e convites, parte dos convites: gerar o link, as recusas, enviar o link e a lista de pendentes. Casos migrados de
   e2e/mandato-equipe.spec.ts (AMA-02.6, AMA-05.2); o que complementa e2e/area-equipe.spec.ts. Guia em modo nuvem com Lia
   logada; o Supabase é respondido pela nuvem em memória de area-api.ts. */

const painel = (page: Page) => page.locator('#areaEquipe');
const formulario = (page: Page) => painel(page).getByRole('form', { name: 'Convidar uma pessoa' });
const nome = (page: Page) => formulario(page).getByLabel('Nome');
const email = (page: Page) => formulario(page).getByLabel('E-mail (opcional)');
const papel = (page: Page) => formulario(page).getByLabel('Papel');
const gerar = (page: Page) => formulario(page).getByRole('button', { name: 'Gerar link de convite' });
const alerta = (page: Page) => formulario(page).getByRole('alert');
const linkPronto = (page: Page) => painel(page).getByTestId('link-convite');
const origem = (page: Page) => new URL(page.url()).origin;
const semRolagem = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const TEXTO_NOME = 'Informe um nome de até 80 caracteres.';
const ERRO_REDE = 'Não foi possível concluir. Tente de novo.';
const ERRO_LEITURA = 'Não foi possível carregar. Tente de novo.';

async function abre(page: Page, estado: area.EstadoArea = {}) {
  const nuvem = await area.abreArea(page, '#/config/equipe', estado);
  await expect(formulario(page)).toBeVisible();
  return nuvem;
}

test.afterEach(() => {
  expect(area.naoMapeadas()).toEqual([]);
});

test.describe('Gerar o link', () => {
  test('com nome e papel mostra o link completo, a validade e os três botões (AMA-02.6)', async ({ page }) => {
    await abre(page);
    await nome(page).fill('Carlos Lima');
    await gerar(page).click();
    await expect(linkPronto(page)).toHaveText(`${origem(page)}/convite#${area.tokenDoConvite(1)}`);
    await expect(formulario(page)).toContainText('Vale por 7 dias e só pode ser usado uma vez.');
    await expect(formulario(page).getByRole('button', { name: 'Copiar link' })).toBeVisible();
    await expect(formulario(page).getByRole('button', { name: 'Copiar mensagem pronta' })).toBeVisible();
    await expect(formulario(page).getByRole('link', { name: 'Abrir no WhatsApp' })).toBeVisible();
    expect(area.rpcs('convite_criar')).toHaveLength(1);
    expect(area.rpcs('convite_criar')[0].corpo).toEqual({ p_mandato: area.MANDATO_A, p_nome: 'Carlos Lima', p_email: null, p_papel: 'assessoria' });
    expect(area.rpcs('convite_criar')[0].token).toBe(area.LIA.token);
  });

  test('nome e e-mail vão sem espaços nas pontas, o e-mail em minúsculas, e o papel escolhido vai junto (AMA-02.6)', async ({ page }) => {
    await abre(page);
    await nome(page).fill('  Dora Alves ');
    await email(page).fill('  Dora@Gabinete.TEST ');
    await papel(page).selectOption('leitura');
    await gerar(page).click();
    await expect(linkPronto(page)).toBeVisible();
    expect(area.rpcs('convite_criar')[0].corpo).toEqual({ p_mandato: area.MANDATO_A, p_nome: 'Dora Alves', p_email: 'dora@gabinete.test', p_papel: 'leitura' });
  });

  test('gerar de novo troca o link mostrado pelo novo (AMA-02.6)', async ({ page }) => {
    await abre(page);
    await nome(page).fill('Primeiro');
    await gerar(page).click();
    await expect(linkPronto(page)).toHaveText(`${origem(page)}/convite#${area.tokenDoConvite(1)}`);
    await nome(page).fill('Segundo');
    await gerar(page).click();
    await expect(linkPronto(page)).toHaveText(`${origem(page)}/convite#${area.tokenDoConvite(2)}`);
    await expect(linkPronto(page)).toHaveCount(1);
  });
});

test.describe('Recusas', () => {
  test('nome com 81 caracteres é recusado e com 80 passa (AMA-02.6)', async ({ page }) => {
    await abre(page);
    await nome(page).fill('x'.repeat(81));
    await gerar(page).click();
    await expect(alerta(page)).toHaveText(TEXTO_NOME);
    expect(area.rpcs('convite_criar')).toEqual([]);
    await nome(page).fill('x'.repeat(80));
    await gerar(page).click();
    await expect(linkPronto(page)).toBeVisible();
    await expect(alerta(page)).toHaveCount(0);
    expect(area.rpcs('convite_criar')).toHaveLength(1);
  });

  test('e-mail inválido ou com mais de 254 caracteres mostra "E-mail inválido." sem chamar o banco (AMA-02.6)', async ({ page }) => {
    await abre(page);
    await nome(page).fill('Carlos Lima');
    for (const ruim of ['sem-arroba', 'a@b', 'a b@c.d', `${'a'.repeat(250)}@b.cd`]) {
      await email(page).fill(ruim);
      await gerar(page).click();
      await expect(alerta(page)).toHaveText('E-mail inválido.');
    }
    await expect(linkPronto(page)).toHaveCount(0);
    expect(area.rpcs('convite_criar')).toEqual([]);
  });

  test('papel maior que o de quem convida (recusa do banco) mostra a mensagem exata e nenhum link (AMA-02.6)', async ({ page }) => {
    const msg = 'Você só pode convidar com papel igual ou menor que o seu.';
    await abre(page, { papel: 'assessoria', rpc: { convite_criar: () => ({ status: 400, corpo: { message: msg } }) } });
    await nome(page).fill('Carlos Lima');
    await gerar(page).click();
    await expect(alerta(page)).toHaveText(msg);
    await expect(linkPronto(page)).toHaveCount(0);
  });

  test('falha de rede mostra "Não foi possível concluir. Tente de novo." e um erro depois de um sucesso apaga o link antigo (AMA-02.6)', async ({ page }) => {
    let vez = 0;
    await abre(page, { rpc: { convite_criar: (args, nuvem) => {
      if (++vez > 1) return { rede: true };
      nuvem.convites.push({ ...area.convite('c-1', String(args.p_nome)), convidado_por_nome: area.LIA.nome });
      return { corpo: { id: 'c-1', token: area.tokenDoConvite(1), expira_em: area.EXPIRA_NOVO } };
    } } });
    await nome(page).fill('Carlos Lima');
    await gerar(page).click();
    await expect(linkPronto(page)).toBeVisible();
    await nome(page).fill('Outro');
    await gerar(page).click();
    await expect(alerta(page)).toHaveText(ERRO_REDE);
    await expect(linkPronto(page)).toHaveCount(0);
  });
});

test.describe('Enviar o link', () => {
  const MENSAGEM = [
    'Olá! Lia Torres convidou você para a equipe do mandato de Ana Souza no Projeto 100 dias.',
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
  const linkDe = (page: Page) => `${origem(page)}/convite#${area.tokenDoConvite(1)}`;

  test('"Copiar link" copia o link exato que está na tela (AMA-02.6)', async ({ page }) => {
    await geraConvite(page);
    await formulario(page).getByRole('button', { name: 'Copiar link' }).click();
    await expect(formulario(page).getByRole('status')).toHaveText('Link copiado.');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(linkDe(page));
  });

  test('"Copiar mensagem pronta" copia a mensagem com quem convida, o mandato e o link (AMA-02.6)', async ({ page }) => {
    await geraConvite(page);
    await formulario(page).getByRole('button', { name: 'Copiar mensagem pronta' }).click();
    await expect(formulario(page).getByRole('status')).toHaveText('Mensagem copiada.');
    // o Windows entrega a área de transferência com quebras CRLF; o texto é o mesmo
    const copiado = (await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n');
    expect(copiado).toBe(MENSAGEM.replace('{link}', linkDe(page)));
  });

  test('"Abrir no WhatsApp" aponta para wa.me com a mensagem e abre em outra aba sem referrer (AMA-02.6)', async ({ page }) => {
    await geraConvite(page);
    const wa = formulario(page).getByRole('link', { name: 'Abrir no WhatsApp' });
    await expect(wa).toHaveAttribute('href', `https://wa.me/?text=${encodeURIComponent(MENSAGEM.replace('{link}', linkDe(page)))}`);
    await expect(wa).toHaveAttribute('target', '_blank');
    await expect(wa).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('sem permissão da área de transferência avisa em vez de dizer que copiou (AMA-02.6)', async ({ page, context }) => {
    await context.clearPermissions();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('negado')) }, configurable: true });
    });
    await geraConvite(page);
    await formulario(page).getByRole('button', { name: 'Copiar link' }).click();
    await expect(formulario(page).getByRole('status')).toHaveText('Não foi possível copiar. Selecione o texto e copie.');
  });
});

test.describe('O link aparece uma só vez', () => {
  test('some ao recarregar a tela e o token não aparece em nenhum outro lugar (AMA-02.6)', async ({ page }) => {
    await abre(page);
    await nome(page).fill('Carlos Lima');
    await gerar(page).click();
    await expect(linkPronto(page)).toBeVisible();
    await page.reload();
    await expect(formulario(page)).toBeVisible();
    await expect(linkPronto(page)).toHaveCount(0);
    expect(await page.locator('body').innerText()).not.toContain(area.tokenDoConvite(1));
    expect(await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }))).not.toContain(area.tokenDoConvite(1));
  });

  test('o link some também ao trocar de mandato no Guia (AMA-02.6)', async ({ page }) => {
    await abre(page, { outros: [{ mandato: area.BRUNO, papel: 'coordenacao' }] });
    await nome(page).fill('Carlos Lima');
    await gerar(page).click();
    await expect(linkPronto(page)).toBeVisible();
    await page.locator('#ladoNav .sel-it', { hasText: 'Bruno Alves' }).click();
    await expect(formulario(page)).toBeVisible();
    await expect(linkPronto(page)).toHaveCount(0);
  });
});

test.describe('Layout do formulário', () => {
  test('em 400 px não há rolagem horizontal, com o link gerado e as mensagens de erro (AMA-04.3)', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await abre(page);
    await nome(page).fill('Carlos Lima');
    await gerar(page).click();
    await expect(linkPronto(page)).toBeVisible();
    await nome(page).fill('x'.repeat(200));
    await email(page).fill('e'.repeat(60) + '@' + 'd'.repeat(60) + '.com');
    await gerar(page).click();
    await expect(alerta(page)).toBeVisible();
    expect(await semRolagem(page)).toBeLessThanOrEqual(0);
  });

  test('o foco do teclado fica visível nos campos e no botão (AMA-04)', async ({ page }) => {
    await abre(page);
    for (const alvo of [nome(page), email(page), papel(page), gerar(page)]) {
      await alvo.focus();
      expect(await alvo.evaluate((el) => getComputedStyle(el).outlineStyle + ' ' + getComputedStyle(el).outlineWidth)).toBe('solid 3px');
    }
  });
});

test.describe('Convites pendentes', () => {
  const lista = (page: Page) => painel(page).locator('.md-pendentes');
  const itens = (page: Page) => lista(page).locator('li');
  const AGORA = '2027-02-12T12:00:00Z';
  const em = (ms: number) => new Date(new Date(AGORA).getTime() + ms).toISOString();
  const dias = (n: number) => em(n * 86_400_000);
  const pend = (id: string, quem: string, papelDele: area.Papel, por: string | null, expira: string): area.Convite =>
    ({ ...area.convite(id, quem, papelDele), convidado_por_nome: por, expira_em: expira });
  const marca = (page: Page) => page.evaluate(() => (window as unknown as { marca?: number }).marca);

  async function abrePendentes(page: Page, convites: area.Convite[], extra: Partial<area.EstadoArea> = {}) {
    await page.clock.setFixedTime(new Date(AGORA));
    return abre(page, { convites, ...extra });
  }

  test('mostra nome, papel, quem convidou e dias para expirar de cada convite (AMA-02.6)', async ({ page }) => {
    await abrePendentes(page, [
      pend('c1', 'Carlos Lima', 'assessoria', 'Mariana Rocha', dias(7)),
      pend('c2', 'Dora Alves', 'leitura', 'João Pereira', dias(1)),
      pend('c3', 'Eva Costa', 'coordenacao', null, dias(2)),
    ]);
    await expect(itens(page)).toHaveCount(3);
    await expect(itens(page).nth(0)).toContainText('Carlos Lima');
    await expect(itens(page).nth(0)).toContainText('Assessoria · enviado por Mariana Rocha · expira em 7 dias');
    await expect(itens(page).nth(1)).toContainText('Somente leitura · enviado por João Pereira · expira em 1 dia');
    await expect(itens(page).nth(1)).not.toContainText('1 dias');
    await expect(itens(page).nth(2)).toContainText('Coordenação · enviado por alguém da equipe · expira em 2 dias');
    await expect(lista(page).locator('.md-pilula')).toHaveText('3');
    expect(area.rpcs('convites_pendentes').map((c) => c.corpo)).toEqual([{ p_mandato: area.MANDATO_A }]);
  });

  test('dias que sobram contam para cima: 6 dias e 1 hora é "7 dias" e 3 horas é "1 dia" (AMA-02.6)', async ({ page }) => {
    await abrePendentes(page, [
      pend('c1', 'Um', 'assessoria', 'Mariana Rocha', em(6 * 86_400_000 + 3_600_000)),
      pend('c2', 'Dois', 'assessoria', 'Mariana Rocha', em(3 * 3_600_000)),
    ]);
    await expect(itens(page).nth(0)).toContainText('expira em 7 dias');
    await expect(itens(page).nth(1)).toContainText('expira em 1 dia');
  });

  test('"Cancelar" tira o convite da lista, atualiza a contagem e não recarrega a página nem relê a lista (AMA-02.6)', async ({ page }) => {
    await abrePendentes(page, [pend('c1', 'Carlos Lima', 'assessoria', 'Mariana Rocha', dias(7)), pend('c2', 'Dora Alves', 'leitura', 'Mariana Rocha', dias(5))]);
    await expect(itens(page)).toHaveCount(2);
    await page.evaluate(() => { (window as unknown as { marca: number }).marca = 1; });
    await itens(page).filter({ hasText: 'Carlos Lima' }).getByRole('button', { name: 'Cancelar' }).click();
    await expect(itens(page)).toHaveCount(1);
    await expect(itens(page).first()).toContainText('Dora Alves');
    await expect(lista(page).locator('.md-pilula')).toHaveText('1');
    expect(area.rpcs('convite_cancelar').map((c) => c.corpo)).toEqual([{ p_id: 'c1' }]);
    expect(area.rpcs('convite_cancelar')[0].token).toBe(area.LIA.token);
    expect(await marca(page)).toBe(1);
    expect(area.rpcs('convites_pendentes')).toHaveLength(1);
  });

  test('cancelar o último convite mostra "Nenhum convite pendente." (AMA-02.6)', async ({ page }) => {
    await abrePendentes(page, [pend('c1', 'Carlos Lima', 'assessoria', 'Mariana Rocha', dias(7))]);
    await lista(page).getByRole('button', { name: 'Cancelar' }).click();
    await expect(lista(page)).toContainText('Nenhum convite pendente.');
    await expect(itens(page)).toHaveCount(0);
  });

  test('recusa de permissão do banco mostra a mensagem e o convite continua na lista (AMA-02.6)', async ({ page }) => {
    await abrePendentes(page, [pend('c1', 'Carlos Lima', 'assessoria', 'João Pereira', dias(7))], {
      rpc: { convite_cancelar: () => ({ status: 403, corpo: { message: 'Você não tem permissão para esta ação.', code: '42501' } }) },
    });
    await lista(page).getByRole('button', { name: 'Cancelar' }).click();
    await expect(lista(page).getByRole('alert')).toHaveText('Você não tem permissão para esta ação.');
    await expect(itens(page)).toHaveCount(1);
    await expect(lista(page).locator('.md-pilula')).toHaveText('1');
    await expect(lista(page).getByRole('button', { name: 'Cancelar' })).toBeEnabled();
  });

  test('falha de rede ao cancelar mostra "Não foi possível concluir. Tente de novo." e o convite fica (AMA-02.6)', async ({ page }) => {
    await abrePendentes(page, [pend('c1', 'Carlos Lima', 'assessoria', 'Mariana Rocha', dias(7))], { rpc: { convite_cancelar: () => ({ rede: true }) } });
    await lista(page).getByRole('button', { name: 'Cancelar' }).click();
    await expect(lista(page).getByRole('alert')).toHaveText(ERRO_REDE);
    await expect(itens(page)).toHaveCount(1);
  });

  test('lista vazia mostra "Nenhum convite pendente." e zero na contagem (AMA-02.6)', async ({ page }) => {
    await abrePendentes(page, []);
    await expect(lista(page)).toContainText('Nenhum convite pendente.');
    await expect(lista(page).locator('.md-pilula')).toHaveText('0');
  });

  test('um convite gerado no formulário aparece na lista sem recarregar a página (AMA-02.6)', async ({ page }) => {
    await abrePendentes(page, [pend('c1', 'Carlos Lima', 'assessoria', 'Mariana Rocha', dias(7))]);
    await expect(itens(page)).toHaveCount(1);
    await page.evaluate(() => { (window as unknown as { marca: number }).marca = 1; });
    await nome(page).fill('Dora Alves');
    await papel(page).selectOption('leitura');
    await gerar(page).click();
    await expect(itens(page)).toHaveCount(2);
    await expect(itens(page).nth(1)).toContainText('Dora Alves');
    await expect(itens(page).nth(1)).toContainText('Somente leitura · enviado por Lia Torres · expira em 7 dias');
    await expect(lista(page).locator('.md-pilula')).toHaveText('2');
    expect(await marca(page)).toBe(1);
  });

  test('falha ao ler a lista mostra a mensagem e o formulário continua funcionando (AMA-02.10)', async ({ page }) => {
    await abrePendentes(page, [], { falha: { 'rpc/convites_pendentes': 'rede' } });
    await expect(lista(page).getByRole('alert')).toHaveText(ERRO_LEITURA);
    await expect(lista(page)).not.toContainText('Nenhum convite pendente.');
    await nome(page).fill('Carlos Lima');
    await gerar(page).click();
    await expect(linkPronto(page)).toBeVisible();
  });

  test('em 400 px a lista com nomes longos não cria rolagem horizontal (AMA-04.3)', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await abrePendentes(page, [pend('c1', 'Bartolomeu Nepomuceno de Albuquerque e Vasconcelos Filho Segundo', 'assessoria', 'Maria Aparecida Fernandes de Souza Pimentel', dias(7))]);
    await expect(itens(page)).toHaveCount(1);
    expect(await semRolagem(page)).toBeLessThanOrEqual(0);
  });
});
