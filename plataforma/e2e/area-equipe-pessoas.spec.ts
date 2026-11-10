import { test, expect, type Page } from '@playwright/test';
import * as area from './area-api';

/* Aba Equipe e convites, parte das pessoas e do "Sair do mandato". Casos migrados de e2e/mandato-equipe.spec.ts (AMA-02.6,
   02.11, AMA-05.2); o que complementa e2e/area-equipe.spec.ts. Guia em modo nuvem com Lia logada (area-api.ts). */

const painel = (page: Page) => page.locator('#areaEquipe');
const formulario = (page: Page) => painel(page).getByRole('form', { name: 'Convidar uma pessoa' });
const secao = (page: Page) => painel(page).locator('.md-pessoas');
const linhas = (page: Page) => secao(page).locator('li');
const linhaDe = (page: Page, quem: string) => linhas(page).filter({ hasText: quem });
const seletorDe = (page: Page, quem: string) => linhaDe(page, quem).getByLabel(`Papel de ${quem}`);
const semRolagem = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const ERRO_REDE = 'Não foi possível concluir. Tente de novo.';
const ULTIMA = 'O mandato precisa ter ao menos uma pessoa na coordenação.';

const MARIANA = area.membro(area.MANDATO_A, area.MARIANA.id, area.MARIANA.nome, 'coordenacao', area.MARIANA.email);
const JOAO = area.membro(area.MANDATO_A, 'uid-joao', 'João Pereira', 'assessoria', 'joao@gabinete.test');
const LUIZA = area.membro(area.MANDATO_A, 'uid-luiza', 'Luiza Ferraz', 'leitura', 'luiza@gabinete.test');
const EQUIPE = [MARIANA, JOAO, LUIZA]; // com Lia, 4 pessoas

async function abre(page: Page, estado: area.EstadoArea = {}) {
  const nuvem = await area.abreArea(page, '#/config/equipe', estado);
  await expect(formulario(page)).toBeVisible();
  return nuvem;
}

async function abrePessoas(page: Page, meuPapel: area.Papel, extra: Partial<area.EstadoArea> = {}) {
  const nuvem = await abre(page, { papel: meuPapel, equipe: EQUIPE, ...extra });
  await expect(linhas(page)).toHaveCount((extra.equipe ?? EQUIPE).length + 1);
  await page.evaluate(() => { (window as unknown as { marca: number }).marca = 1; });
  return nuvem;
}
const marca = (page: Page) => page.evaluate(() => (window as unknown as { marca?: number }).marca);

test.afterEach(() => {
  expect(area.naoMapeadas()).toEqual([]);
});

test.describe('Pessoas do mandato', () => {
  test('mostra nome, e-mail e papel de cada pessoa e marca "você" só na própria linha (AMA-02.6)', async ({ page }) => {
    await abrePessoas(page, 'coordenacao');
    await expect(linhaDe(page, 'Mariana Rocha')).toContainText('mariana@gabinete.test');
    await expect(linhaDe(page, 'Mariana Rocha').locator('.md-voce')).toHaveCount(0);
    await expect(linhaDe(page, 'Lia Torres').locator('.md-voce')).toHaveText('você');
    await expect(linhaDe(page, 'Lia Torres').locator('.md-papel-txt')).toHaveText('Coordenação');
    await expect(linhaDe(page, 'João Pereira')).toContainText('joao@gabinete.test');
    await expect(seletorDe(page, 'João Pereira')).toHaveValue('assessoria');
    await expect(seletorDe(page, 'Luiza Ferraz')).toHaveValue('leitura');
    await expect(secao(page).locator('.md-pilula')).toHaveText('4');
    expect(area.rpcs('equipe_do_mandato').map((c) => c.corpo)).toEqual([{ p_mandato: area.MANDATO_A }]);
  });

  test('coordenação vê seletor e "Remover" nas linhas das outras pessoas, e nenhum dos dois na própria (AMA-02.6)', async ({ page }) => {
    await abrePessoas(page, 'coordenacao');
    const minha = linhaDe(page, 'Lia Torres');
    await expect(minha.getByRole('combobox')).toHaveCount(0);
    await expect(minha.getByRole('button')).toHaveCount(0);
    for (const outra of ['Mariana Rocha', 'João Pereira', 'Luiza Ferraz']) {
      await expect(linhaDe(page, outra).getByRole('combobox')).toHaveCount(1);
      await expect(linhaDe(page, outra).getByRole('combobox').locator('option')).toHaveText(['Coordenação', 'Assessoria', 'Somente leitura']);
      await expect(linhaDe(page, outra).getByRole('button', { name: `Remover ${outra}` })).toHaveText('Remover');
    }
  });

  for (const meuPapel of ['assessoria', 'leitura'] as const) {
    test(`quem é ${meuPapel} vê os papéis como texto, sem seletor e sem "Remover" (AMA-02.6, 02.11)`, async ({ page }) => {
      await abrePessoas(page, meuPapel);
      await expect(secao(page).getByRole('combobox')).toHaveCount(0);
      await expect(secao(page).getByRole('button')).toHaveCount(0);
      await expect(linhaDe(page, 'Mariana Rocha').locator('.md-papel-txt')).toHaveText('Coordenação');
      await expect(linhaDe(page, 'João Pereira').locator('.md-papel-txt')).toHaveText('Assessoria');
      await expect(linhaDe(page, 'Luiza Ferraz').locator('.md-papel-txt')).toHaveText('Somente leitura');
    });
  }

  test('trocar o papel atualiza a lista sem recarregar a página nem reler as pessoas (AMA-02.6)', async ({ page }) => {
    await abrePessoas(page, 'coordenacao');
    await seletorDe(page, 'Luiza Ferraz').selectOption('coordenacao');
    await expect.poll(() => area.rpcs('membro_trocar_papel').length).toBe(1);
    expect(area.rpcs('membro_trocar_papel')[0].corpo).toEqual({ p_mandato: area.MANDATO_A, p_user: 'uid-luiza', p_papel: 'coordenacao' });
    expect(area.rpcs('membro_trocar_papel')[0].token).toBe(area.LIA.token);
    await expect(seletorDe(page, 'Luiza Ferraz')).toHaveValue('coordenacao');
    await expect(linhas(page)).toHaveCount(4);
    expect(await marca(page)).toBe(1);
    expect(area.rpcs('equipe_do_mandato')).toHaveLength(1);
  });

  test('recusa ao trocar o papel mostra a mensagem do banco e a lista não muda (AMA-02.6)', async ({ page }) => {
    await abrePessoas(page, 'coordenacao', { rpc: { membro_trocar_papel: () => ({ status: 400, corpo: { message: ULTIMA } }) } });
    await seletorDe(page, 'João Pereira').selectOption('leitura');
    await expect(linhaDe(page, 'João Pereira').getByRole('alert')).toHaveText(ULTIMA);
    await expect(seletorDe(page, 'João Pereira')).toHaveValue('assessoria');
    await expect(linhas(page)).toHaveCount(4);
  });

  test('sem permissão (papel mudou por fora) a troca mostra a mensagem de permissão e nada muda (AMA-02.6)', async ({ page }) => {
    await abrePessoas(page, 'coordenacao', {
      rpc: { membro_trocar_papel: () => ({ status: 403, corpo: { message: 'Você não tem permissão para esta ação.', code: '42501' } }) },
    });
    await seletorDe(page, 'João Pereira').selectOption('coordenacao');
    await expect(linhaDe(page, 'João Pereira').getByRole('alert')).toHaveText('Você não tem permissão para esta ação.');
    await expect(seletorDe(page, 'João Pereira')).toHaveValue('assessoria');
  });

  test('"Remover" pede confirmação na própria tela; "Não remover" fecha sem chamar o banco; só confirmar tira a pessoa (AMA-02.6)', async ({ page }) => {
    await abrePessoas(page, 'coordenacao');
    await linhaDe(page, 'João Pereira').getByRole('button', { name: 'Remover João Pereira' }).click();
    const confirma = linhaDe(page, 'João Pereira').getByRole('group', { name: 'Confirmar a remoção de João Pereira' });
    await expect(confirma).toContainText('Remover João Pereira do mandato?');
    await expect(confirma).toContainText('A conta dela continua na plataforma');
    expect(area.rpcs('membro_remover')).toEqual([]);
    await confirma.getByRole('button', { name: 'Não remover' }).click();
    await expect(confirma).toHaveCount(0);
    expect(area.rpcs('membro_remover')).toEqual([]);
    await linhaDe(page, 'João Pereira').getByRole('button', { name: 'Remover João Pereira' }).click();
    await confirma.getByRole('button', { name: 'Confirmar remoção' }).click();
    await expect(linhas(page)).toHaveCount(3);
    await expect(secao(page)).not.toContainText('João Pereira');
    await expect(secao(page).locator('.md-pilula')).toHaveText('3');
    expect(area.rpcs('membro_remover').map((c) => c.corpo)).toEqual([{ p_mandato: area.MANDATO_A, p_user: 'uid-joao' }]);
    expect(await marca(page)).toBe(1);
  });

  test('recusa ao remover (última coordenação) mostra a mensagem exata e a lista não muda (AMA-02.6)', async ({ page }) => {
    await abrePessoas(page, 'coordenacao', { rpc: { membro_remover: () => ({ status: 400, corpo: { message: ULTIMA } }) } });
    await linhaDe(page, 'Luiza Ferraz').getByRole('button', { name: 'Remover Luiza Ferraz' }).click();
    await linhaDe(page, 'Luiza Ferraz').getByRole('button', { name: 'Confirmar remoção' }).click();
    await expect(linhaDe(page, 'Luiza Ferraz').getByRole('alert')).toHaveText(ULTIMA);
    await expect(linhas(page)).toHaveCount(4);
    await expect(secao(page).locator('.md-pilula')).toHaveText('4');
    await expect(linhaDe(page, 'Luiza Ferraz').getByRole('button', { name: 'Remover Luiza Ferraz' })).toBeEnabled();
  });

  test('falha ao ler as pessoas mantém a linha sobre a equipe da Legisla (AMA-02.10)', async ({ page }) => {
    await abre(page, { falha: { 'rpc/equipe_do_mandato': 'rede' } });
    await expect(secao(page).getByRole('alert')).toHaveText(ERRO_REDE);
    await expect(linhas(page)).toHaveCount(0);
    await expect(secao(page)).toContainText('A equipe da Legisla acompanha este mandato');
  });

  test('em 400 px, com nomes e e-mails longos e os controles de coordenação, não há rolagem horizontal (AMA-04.3)', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    const longo = area.membro(area.MANDATO_A, 'uid-barto', 'Bartolomeu Nepomuceno de Albuquerque e Vasconcelos Filho', 'assessoria',
      'bartolomeu.nepomuceno.de.albuquerque.vasconcelos.filho@gabinete-do-mandato.example.org');
    await abrePessoas(page, 'coordenacao', { equipe: [MARIANA, longo] });
    await linhaDe(page, 'Bartolomeu').getByRole('button', { name: /^Remover/ }).click();
    await expect(linhaDe(page, 'Bartolomeu').getByRole('group')).toBeVisible();
    expect(await semRolagem(page)).toBeLessThanOrEqual(0);
  });
});

test.describe('Sair do mandato', () => {
  const regiao = (page: Page) => painel(page).getByRole('region', { name: 'Sair do mandato' });
  const botao = (page: Page) => regiao(page).getByRole('button', { name: 'Sair do mandato' });
  const confirma = (page: Page) => regiao(page).getByRole('group', { name: 'Confirmar a saída do mandato' });
  const UNICA = 'Você é a única pessoa na coordenação. Promova outra pessoa para a Coordenação antes de sair.';
  const JOAO_COORD = { ...JOAO, papel: 'coordenacao' as const };

  // devolve as janelas do navegador (confirm, alert) que a página abriu: a confirmação é na própria página
  async function abreSair(page: Page, meuPapel: area.Papel, equipe: area.Membro[], extra: Partial<area.EstadoArea> = {}) {
    const janelas: string[] = [];
    page.on('dialog', (d) => { janelas.push(d.type()); d.dismiss().catch(() => {}); });
    await abre(page, { papel: meuPapel, equipe, ...extra });
    await expect(linhas(page)).toHaveCount(equipe.length + 1);
    return janelas;
  }

  for (const meuPapel of ['coordenacao', 'assessoria', 'leitura'] as const) {
    test(`quem é ${meuPapel} vê "Sair do mandato" depois de "Pessoas neste mandato", fora da lista (AMA-02.6)`, async ({ page }) => {
      await abreSair(page, meuPapel, [MARIANA, JOAO_COORD]);
      await expect(botao(page)).toBeVisible();
      await expect(botao(page)).toBeEnabled();
      await expect(secao(page).getByRole('button', { name: 'Sair do mandato' })).toHaveCount(0);
      expect((await regiao(page).boundingBox())!.y).toBeGreaterThan((await secao(page).boundingBox())!.y);
    });
  }

  test('"Não sair" fecha a confirmação sem chamar o banco; "Confirmar saída" chama membro_sair, apaga o mandato ativo e abre o primeiro acesso, sem janelas do navegador (Edge Case: sair)', async ({ page }) => {
    const janelas = await abreSair(page, 'assessoria', [MARIANA, JOAO_COORD]);
    expect(await page.evaluate(() => localStorage.getItem('legisla.mandatoAtual'))).toBe(area.MANDATO_A);
    await botao(page).click();
    await expect(confirma(page)).toContainText('Sair de Ana Souza?');
    await confirma(page).getByRole('button', { name: 'Não sair' }).click();
    await expect(confirma(page)).toHaveCount(0);
    expect(area.rpcs('membro_sair')).toEqual([]);
    await botao(page).click();
    await confirma(page).getByRole('button', { name: 'Confirmar saída' }).click();
    await expect(page).toHaveURL(/\/primeiro-acesso$/);
    expect(area.rpcs('membro_sair').map((c) => ({ corpo: c.corpo, token: c.token }))).toEqual([{ corpo: { p_mandato: area.MANDATO_A }, token: area.LIA.token }]);
    expect(janelas).toEqual([]);
  });

  test('a única coordenação recebe a orientação no clique, sem janelas do navegador, e o banco não é chamado (AMA-02.6)', async ({ page }) => {
    const janelas = await abreSair(page, 'coordenacao', [{ ...MARIANA, papel: 'assessoria' }, JOAO]);
    await botao(page).click();
    await expect(regiao(page).getByRole('alert')).toHaveText(UNICA);
    await expect(confirma(page)).toHaveCount(0);
    expect(area.rpcs('membro_sair')).toEqual([]);
    expect(new URL(page.url()).hash).toBe('#/config/equipe');
    expect(await page.evaluate(() => localStorage.getItem('legisla.mandatoAtual'))).toBe(area.MANDATO_A);
    expect(janelas).toEqual([]);
  });

  test('com outra pessoa na coordenação, a coordenação confirma e sai (AMA-02.6)', async ({ page }) => {
    await abreSair(page, 'coordenacao', [MARIANA, JOAO_COORD]);
    await botao(page).click();
    await expect(regiao(page).getByRole('alert')).toHaveCount(0);
    await confirma(page).getByRole('button', { name: 'Confirmar saída' }).click();
    await expect(page).toHaveURL(/\/primeiro-acesso$/);
    expect(area.rpcs('membro_sair').map((c) => c.corpo)).toEqual([{ p_mandato: area.MANDATO_A }]);
  });

  test('promover outra pessoa para a Coordenação na mesma tela libera a saída, sem recarregar (AMA-02.6)', async ({ page }) => {
    await abreSair(page, 'coordenacao', [{ ...MARIANA, papel: 'assessoria' }, JOAO]);
    await botao(page).click();
    await expect(regiao(page).getByRole('alert')).toHaveText(UNICA);
    await seletorDe(page, 'João Pereira').selectOption('coordenacao');
    await expect(seletorDe(page, 'João Pereira')).toHaveValue('coordenacao');
    await expect(seletorDe(page, 'João Pereira')).toBeEnabled();
    await botao(page).click();
    await expect(regiao(page).getByRole('alert')).toHaveCount(0);
    await expect(confirma(page)).toBeVisible();
    expect(area.rpcs('equipe_do_mandato')).toHaveLength(1);
  });

  for (const [caso, resposta, mensagem] of [
    ['a recusa da coordenação', { status: 400, corpo: { message: ULTIMA } }, ULTIMA],
    ['a falha de rede', { rede: true }, ERRO_REDE],
  ] as const) {
    test(`${caso} ao sair mostra a mensagem e a pessoa continua na tela, com o mesmo mandato ativo (AMA-02.6)`, async ({ page }) => {
      // a lista ainda mostra outra coordenação, mas no banco ela já saiu
      await abreSair(page, 'coordenacao', [MARIANA, JOAO_COORD], { rpc: { membro_sair: () => resposta } });
      await botao(page).click();
      await confirma(page).getByRole('button', { name: 'Confirmar saída' }).click();
      await expect(regiao(page).getByRole('alert')).toHaveText(mensagem);
      await expect(confirma(page)).toHaveCount(0);
      expect(area.rpcs('membro_sair')).toHaveLength(1);
      expect(new URL(page.url()).hash).toBe('#/config/equipe');
      expect(await page.evaluate(() => localStorage.getItem('legisla.mandatoAtual'))).toBe(area.MANDATO_A);
      await expect(botao(page)).toBeEnabled();
    });
  }

  test('em 400 px, com a confirmação aberta, não há rolagem horizontal (AMA-04.3)', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await abreSair(page, 'coordenacao', [MARIANA, JOAO_COORD]);
    await botao(page).click();
    await expect(confirma(page)).toBeVisible();
    expect(await semRolagem(page)).toBeLessThanOrEqual(0);
  });
});
