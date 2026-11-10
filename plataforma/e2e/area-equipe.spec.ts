import { test, expect, type Page } from '@playwright/test';
import * as area from './area-api';

/* Aba Equipe e convites da Área do mandato (#/config/equipe): a tela de /mandato/equipe dentro do Guia, com as mesmas regras,
   mensagens e permissões (AMA-02.6, 02.7, 02.10, 02.11; Edge Cases de sair do mandato e de papel). O Guia abre em modo
   nuvem com Lia logada; o Supabase é respondido pela nuvem em memória de area-api.ts. */

const painel = (page: Page) => page.locator('#areaEquipe');
const formulario = (page: Page) => painel(page).getByRole('form', { name: 'Convidar uma pessoa' });
const nome = (page: Page) => formulario(page).getByLabel('Nome');
const email = (page: Page) => formulario(page).getByLabel('E-mail (opcional)');
const papel = (page: Page) => formulario(page).getByLabel('Papel');
const gerar = (page: Page) => formulario(page).getByRole('button', { name: 'Gerar link de convite' });
const pendentes = (page: Page) => painel(page).locator('.md-pendentes');
const pessoas = (page: Page) => painel(page).locator('.md-pessoas');
const linhaDe = (page: Page, quem: string) => pessoas(page).locator('li', { hasText: quem });
const sair = (page: Page) => painel(page).getByRole('region', { name: 'Sair do mandato' });
const abaEquipe = (page: Page) => page.getByRole('tablist', { name: 'Área do mandato' }).getByRole('tab', { name: /^Equipe e convites/ });
const aba = (page: Page, nomeAba: string) => page.getByRole('tablist', { name: 'Área do mandato' }).getByRole('tab', { name: nomeAba, exact: true });
const ERRO_LEITURA = 'Não foi possível carregar. Tente de novo.';
const JOAO = area.membro(area.MANDATO_A, 'uid-joao', 'João Pereira', 'assessoria', 'joao@gabinete.test');
const MARIANA = area.membro(area.MANDATO_A, area.MARIANA.id, area.MARIANA.nome, 'coordenacao', area.MARIANA.email);

async function abre(page: Page, estado: area.EstadoArea = {}) {
  const nuvem = await area.abreArea(page, '#/config/equipe', estado);
  await expect(formulario(page)).toBeVisible();
  return nuvem;
}

test.afterEach(() => {
  expect(area.naoMapeadas()).toEqual([]);
});

test('mostra, nesta ordem, o formulário de convite, os convites pendentes, as pessoas e "Sair do mandato" (AMA-02.6)', async ({ page }) => {
  await abre(page);
  await expect(painel(page).getByRole('heading', { level: 2, name: 'Equipe e convites' })).toBeVisible();
  await expect(pessoas(page).locator('li')).toHaveCount(2);
  const ordem = await painel(page).locator('.md-form, .md-pendentes, .md-pessoas, section[aria-label="Sair do mandato"]').evaluateAll((els) =>
    els.map((e) => e.getAttribute('aria-label') ?? e.querySelector('h2')?.textContent ?? ''));
  expect(ordem).toEqual(['Convidar uma pessoa', 'Convites pendentes', 'Pessoas neste mandato', 'Sair do mandato']);
  await expect(linhaDe(page, 'Lia Torres')).toContainText('você');
  await expect(pessoas(page)).toContainText('A equipe da Legisla acompanha este mandato, conforme o cadastro.');
});

test('gerar um convite chama convite_criar com o mandato aberto, mostra o link e o convite entra nos pendentes sem recarregar (AMA-02.6)', async ({ page }) => {
  await abre(page);
  await page.evaluate(() => { (window as unknown as { __mesmaPagina: boolean }).__mesmaPagina = true; });
  await nome(page).fill('Carlos Lima');
  await email(page).fill('  Carlos@Gabinete.TEST ');
  await gerar(page).click();
  const origem = new URL(page.url()).origin;
  await expect(painel(page).getByTestId('link-convite')).toHaveText(`${origem}/convite#${area.tokenDoConvite(1)}`);
  await expect(formulario(page)).toContainText('Vale por 7 dias e só pode ser usado uma vez.');
  expect(area.rpcs('convite_criar').map((p) => [p.corpo, p.token])).toEqual([
    [{ p_mandato: area.MANDATO_A, p_nome: 'Carlos Lima', p_email: 'carlos@gabinete.test', p_papel: 'assessoria' }, area.LIA.token],
  ]);
  await expect(pendentes(page).locator('li')).toHaveCount(1);
  await expect(pendentes(page).locator('li')).toContainText('Carlos Lima');
  await expect(pendentes(page).locator('li')).toContainText('Assessoria · enviado por Lia Torres');
  expect(await page.evaluate(() => (window as unknown as { __mesmaPagina?: boolean }).__mesmaPagina)).toBe(true);
});

for (const [meuPapel, opcoes] of [
  ['coordenacao', ['Coordenação', 'Assessoria', 'Somente leitura']],
  ['assessoria', ['Assessoria', 'Somente leitura']],
  ['leitura', ['Somente leitura']],
] as const) {
  test(`quem é ${meuPapel} convida com os papéis ${opcoes.join(', ')}, como hoje (AMA-02.6)`, async ({ page }) => {
    await abre(page, { papel: meuPapel });
    await expect(papel(page).locator('option')).toHaveText([...opcoes]);
  });
}

test('nome vazio mostra "Informe um nome de até 80 caracteres." sem chamar o banco nem mostrar link (AMA-02.6)', async ({ page }) => {
  await abre(page);
  await nome(page).fill('   ');
  await gerar(page).click();
  await expect(formulario(page).getByRole('alert')).toHaveText('Informe um nome de até 80 caracteres.');
  await expect(painel(page).getByTestId('link-convite')).toHaveCount(0);
  expect(area.rpcs('convite_criar')).toEqual([]);
});

test('recusa do banco ao convidar mostra a mensagem exata e nenhum link (AMA-02.6)', async ({ page }) => {
  const msg = 'Este mandato já tem 20 convites pendentes. Cancele algum para criar outro.';
  await abre(page, { rpc: { convite_criar: () => ({ status: 400, corpo: { message: msg } }) } });
  await nome(page).fill('Carlos Lima');
  await gerar(page).click();
  await expect(formulario(page).getByRole('alert')).toHaveText(msg);
  await expect(painel(page).getByTestId('link-convite')).toHaveCount(0);
});

test('"Cancelar" chama convite_cancelar com o id e tira o convite da lista (AMA-02.6)', async ({ page }) => {
  await abre(page, { convites: [area.convite('c1', 'Carlos Lima'), area.convite('c2', 'Dora Alves', 'leitura')] });
  await expect(pendentes(page).locator('li')).toHaveCount(2);
  await pendentes(page).getByRole('button', { name: 'Cancelar convite de Carlos Lima' }).click();
  await expect(pendentes(page).locator('li')).toHaveCount(1);
  await expect(pendentes(page).locator('li')).toContainText('Dora Alves');
  expect(area.rpcs('convite_cancelar').map((p) => p.corpo)).toEqual([{ p_id: 'c1' }]);
});

test('a coordenação troca o papel de outra pessoa: chama membro_trocar_papel e a lista mostra o papel novo (AMA-02.6)', async ({ page }) => {
  await abre(page, { equipe: [MARIANA, JOAO] });
  await linhaDe(page, 'João Pereira').getByLabel('Papel de João Pereira').selectOption('leitura');
  await expect.poll(() => area.rpcs('membro_trocar_papel').map((p) => p.corpo)).toEqual([{ p_mandato: area.MANDATO_A, p_user: 'uid-joao', p_papel: 'leitura' }]);
  await expect(linhaDe(page, 'João Pereira').getByLabel('Papel de João Pereira')).toHaveValue('leitura');
  await expect(linhaDe(page, 'Lia Torres').getByRole('combobox')).toHaveCount(0); // a própria linha não muda de papel
});

test('"Remover" pede confirmação; confirmar chama membro_remover, tira a pessoa e o rótulo da aba passa de (3) a (2) (AMA-02.6, 02.7)', async ({ page }) => {
  await abre(page, { equipe: [MARIANA, JOAO] });
  await expect(abaEquipe(page)).toHaveText('Equipe e convites (3)');
  await linhaDe(page, 'João Pereira').getByRole('button', { name: 'Remover João Pereira' }).click();
  const confirma = painel(page).getByRole('group', { name: 'Confirmar a remoção de João Pereira' });
  await expect(confirma).toContainText('Remover João Pereira do mandato?');
  expect(area.rpcs('membro_remover')).toEqual([]);
  await confirma.getByRole('button', { name: 'Confirmar remoção' }).click();
  await expect(linhaDe(page, 'João Pereira')).toHaveCount(0);
  expect(area.rpcs('membro_remover').map((p) => p.corpo)).toEqual([{ p_mandato: area.MANDATO_A, p_user: 'uid-joao' }]);
  await expect(abaEquipe(page)).toHaveText('Equipe e convites (2)');
  // o total vale para o Guia todo: trocar de aba e voltar mantém (2)
  await aba(page, 'Visão geral').click();
  await expect(abaEquipe(page)).toHaveText('Equipe e convites (2)');
});

test('o rótulo da aba acompanha quem entrou depois de o Guia abrir: a aba lê a equipe do banco e mostra o total novo (AMA-02.7)', async ({ page }) => {
  const nuvem = await area.abreArea(page, '#/config');
  await expect(abaEquipe(page)).toHaveText('Equipe e convites (2)');
  nuvem.membros.push(JOAO); // João aceitou um convite em outro lugar
  await abaEquipe(page).click();
  await expect(linhaDe(page, 'João Pereira')).toBeVisible();
  await expect(abaEquipe(page)).toHaveText('Equipe e convites (3)');
});

test('"Sair do mandato" pede confirmação; confirmar chama membro_sair e o Guia abre o outro mandato da pessoa (Edge Case: sair)', async ({ page }) => {
  await abre(page, { outros: [{ mandato: area.BRUNO, papel: 'assessoria' }] });
  await sair(page).getByRole('button', { name: 'Sair do mandato' }).click();
  const confirma = painel(page).getByRole('group', { name: 'Confirmar a saída do mandato' });
  await expect(confirma).toContainText('Sair de Ana Souza?');
  await confirma.getByRole('button', { name: 'Confirmar saída' }).click();
  await expect(page.locator('#ladoMandato')).toContainText('Bruno Alves');
  expect(area.rpcs('membro_sair').map((p) => p.corpo)).toEqual([{ p_mandato: area.MANDATO_A }]);
  expect(new URL(page.url()).pathname).toBe('/guia');
  expect(await page.evaluate(() => localStorage.getItem('legisla.mandatoAtual'))).toBe(area.MANDATO_B);
});

test('sair do único mandato leva ao primeiro acesso, como hoje (Edge Case: sair)', async ({ page }) => {
  await abre(page);
  await sair(page).getByRole('button', { name: 'Sair do mandato' }).click();
  await painel(page).getByRole('button', { name: 'Confirmar saída' }).click();
  await expect(page).toHaveURL(/\/primeiro-acesso$/);
  expect(area.rpcs('membro_sair').map((p) => p.corpo)).toEqual([{ p_mandato: area.MANDATO_A }]);
});

test('a única pessoa na coordenação recebe a orientação ao sair e o banco não é chamado (AMA-02.6)', async ({ page }) => {
  await abre(page, { equipe: [{ ...MARIANA, papel: 'assessoria' }] });
  await expect(pessoas(page).locator('li')).toHaveCount(2);
  await sair(page).getByRole('button', { name: 'Sair do mandato' }).click();
  await expect(sair(page).getByRole('alert')).toHaveText('Você é a única pessoa na coordenação. Promova outra pessoa para a Coordenação antes de sair.');
  await expect(painel(page).getByRole('group', { name: 'Confirmar a saída do mandato' })).toHaveCount(0);
  expect(area.rpcs('membro_sair')).toEqual([]);
});

test('quem é leitura não vê botões que alteram a equipe: papéis em texto, sem seletor e sem "Remover" (AMA-02.11)', async ({ page }) => {
  await abre(page, { papel: 'leitura', equipe: [MARIANA, JOAO] });
  await expect(pessoas(page).locator('li')).toHaveCount(3);
  await expect(pessoas(page).getByRole('combobox')).toHaveCount(0);
  await expect(pessoas(page).getByRole('button')).toHaveCount(0);
  await expect(linhaDe(page, 'Mariana Rocha').locator('.md-papel-txt')).toHaveText('Coordenação');
  await expect(linhaDe(page, 'João Pereira').locator('.md-papel-txt')).toHaveText('Assessoria');
  await expect(linhaDe(page, 'Lia Torres').locator('.md-papel-txt')).toHaveText('Somente leitura');
});

test('quem é leitura convida como Somente leitura, como hoje: dentro da aba os campos não ficam travados pelo modo leitura do Guia (AMA-02.6)', async ({ page }) => {
  await abre(page, { papel: 'leitura' });
  await expect(page.locator('body')).toHaveClass(/\bso-leitura\b/);
  await expect(nome(page)).toBeEnabled();
  await expect(papel(page)).toBeEnabled();
  await nome(page).fill('Dora Alves');
  await gerar(page).click();
  await expect(painel(page).getByTestId('link-convite')).toBeVisible();
  expect(area.rpcs('convite_criar').map((p) => p.corpo)).toEqual([{ p_mandato: area.MANDATO_A, p_nome: 'Dora Alves', p_email: null, p_papel: 'leitura' }]);
});

test('exceção de AMA-02.11: quem é leitura vê na aba Equipe os botões de hoje (Gerar link, Cancelar em convite de outra pessoa, Sair do mandato); o banco recusa o Cancelar e a tela mostra o erro (AMA-02.6, AMA-02.11)', async ({ page }) => {
  await abre(page, {
    papel: 'leitura',
    equipe: [MARIANA, JOAO],
    convites: [area.convite('c1', 'Carlos Lima', 'assessoria')], // convidado por Mariana, não por Lia
    rpc: { convite_cancelar: () => ({ status: 403, corpo: { message: 'Você não tem permissão para esta ação.', code: '42501' } }) },
  });
  await expect(pendentes(page).locator('li')).toHaveCount(1);
  // a lista de pessoas segue sem seletor e sem "Remover"; o resto da aba mantém as regras de AMA-02.6
  await expect(pessoas(page).getByRole('button')).toHaveCount(0);
  await expect(painel(page).getByRole('button')).toHaveText(['Gerar link de convite', 'Cancelar', 'Sair do mandato']);
  await pendentes(page).getByRole('button', { name: 'Cancelar' }).click();
  await expect(pendentes(page).getByRole('alert')).toHaveText('Você não tem permissão para esta ação.');
  await expect(pendentes(page).locator('li')).toHaveCount(1);
  expect(area.rpcs('convite_cancelar').map((p) => p.corpo)).toEqual([{ p_id: 'c1' }]);
});

test('falha ao ler as pessoas mostra o erro e "Tentar de novo"; tentar de novo com a leitura funcionando mostra a lista (AMA-02.10)', async ({ page }) => {
  const estado: area.EstadoArea = { falha: { 'rpc/equipe_do_mandato': 'servidor' } };
  await abre(page, estado);
  await expect(pessoas(page).getByRole('alert')).toHaveText(ERRO_LEITURA);
  await expect(pendentes(page)).toContainText('Nenhum convite pendente.');
  estado.falha = {};
  await pessoas(page).getByRole('button', { name: 'Tentar de novo' }).click();
  await expect(linhaDe(page, 'Mariana Rocha')).toBeVisible();
  await expect(pessoas(page).getByRole('alert')).toHaveCount(0);
  await expect(abaEquipe(page)).toHaveText('Equipe e convites (2)');
});

test('falha ao ler os convites pendentes mostra o erro e "Tentar de novo"; tentar de novo lê de novo (AMA-02.10)', async ({ page }) => {
  const estado: area.EstadoArea = { falha: { 'rpc/convites_pendentes': 'rede' }, convites: [area.convite('c1', 'Carlos Lima')] };
  await abre(page, estado);
  await expect(pendentes(page).getByRole('alert')).toHaveText(ERRO_LEITURA);
  await expect(linhaDe(page, 'Mariana Rocha')).toBeVisible();
  estado.falha = {};
  await pendentes(page).getByRole('button', { name: 'Tentar de novo' }).click();
  await expect(pendentes(page).locator('li')).toContainText('Carlos Lima');
  await expect(pendentes(page).getByRole('alert')).toHaveCount(0);
});

test('sem o papel da pessoa no mandato, a aba mostra o erro com "Tentar de novo" e nenhum botão que altera (Edge Case: papel)', async ({ page }) => {
  await area.abreArea(page, '#/config/equipe', { semLiaNosMembros: true });
  await expect(painel(page).getByRole('alert')).toHaveText('Não foi possível carregar. Tente de novo.');
  await expect(painel(page).getByRole('button')).toHaveText(['Tentar de novo']);
  await expect(painel(page).locator('form, select, input')).toHaveCount(0);
  expect(area.rpcs('equipe_do_mandato')).toEqual([]);
});

test('em 400 px, com o link gerado, nomes longos e a confirmação aberta, não há rolagem horizontal (AMA-04.3)', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  const longo = area.membro(area.MANDATO_A, 'uid-longo', 'Maria Aparecida dos Santos Figueiredo Nogueira', 'assessoria', 'maria.aparecida.figueiredo.nogueira@gabinete-muito-longo.test');
  await abre(page, { equipe: [MARIANA, longo], convites: [area.convite('c1', 'Bartolomeu Nepomuceno de Albuquerque e Vasconcelos Filho')] });
  await nome(page).fill('Carlos Lima');
  await gerar(page).click();
  await expect(painel(page).getByTestId('link-convite')).toBeVisible();
  await linhaDe(page, 'Maria Aparecida').getByRole('button', { name: /^Remover/ }).click();
  await expect(painel(page).getByRole('group', { name: /Confirmar a remoção/ })).toBeVisible();
  const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(sobra).toBe(0);
});
