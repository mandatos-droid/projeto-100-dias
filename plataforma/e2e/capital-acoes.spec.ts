import { test, expect, type Page } from '@playwright/test';
import { abre, dadoDe, MANDATO } from './semente-rumo';

/* Missão 4 · matriz das ações dos 100 dias (CAP-10 a CAP-13, CAP-40). Ilha montada na rota de teste, com os BINGOS reais do Guia. */
const ILHA = 'capital-acoes';
type Acao = { id?: string; bingo?: string; i?: number; titulo?: string; alcancar?: string; resp?: string; prazo?: string; saber?: string; prox?: string };
const acoes = (page: Page) => dadoDe(page, 'acoes') as Promise<Acao[] | undefined>;
const frente = (page: Page, k: string) => page.locator(`.cp-frentes button[data-frente="${k}"]`);
const linhas = (page: Page) => page.locator('.cp-acoes > li');
const linha = (page: Page, bingo: string, i: number) => page.locator(`li[data-bingo="${bingo}"][data-i="${i}"]`);
const ART0 = 'Sustentar diálogo aberto com a Secretaria-Geral da Mesa ou estrutura equivalente';

test.describe('Frentes e linhas (CAP-10.1, CAP-10.2)', () => {
  test('mostra os botões das 4 frentes de hoje, cada um com o contador de ações escolhidas', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO, D: { acoes: [{ id: 'a', bingo: 'partido', i: 2, titulo: 'x' }, { id: 'b', bingo: 'partido', i: 3, titulo: 'y' }, { id: 'c', bingo: 'redes', i: 0, titulo: 'z' }] } });
    await expect(page.locator('.cp-frentes button')).toHaveCount(4);
    await expect(frente(page, 'articulacao')).toContainText('Articulação política');
    await expect(frente(page, 'mobilizacao')).toContainText('Mobilização de apoiadores');
    await expect(frente(page, 'partido')).toContainText('Relevância no partido');
    await expect(frente(page, 'redes')).toContainText('Redes sociais e presença pública');
    await expect(frente(page, 'partido').locator('.cp-n')).toHaveText('2');
    await expect(frente(page, 'redes').locator('.cp-n')).toHaveText('1');
    await expect(frente(page, 'articulacao').locator('.cp-n')).toHaveText('0');
  });

  test('escolher uma frente mostra todas as ações recomendadas dela como linhas com caixa de marcar', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await expect(linhas(page)).toHaveCount(9);
    await expect(linhas(page).first()).toContainText(ART0);
    await frente(page, 'mobilizacao').click();
    await expect(frente(page, 'mobilizacao')).toHaveAttribute('aria-pressed', 'true');
    await expect(linhas(page)).toHaveCount(12);
    await expect(linhas(page).first()).toContainText('Organizar uma base de apoiadores e voluntários');
    await expect(page.getByRole('checkbox', { name: /^Escolher ação:/ })).toHaveCount(12);
  });
});

test.describe('Marcar, campos e gravação no formato antigo (CAP-10.3, CAP-10.4, CAP-12.11)', () => {
  test('linha desmarcada não tem campos; marcar ativa os 5 campos e grava a ação em D.acoes', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    const l = linha(page, 'articulacao', 0);
    await expect(l.locator('textarea, input[type=text], input[type=date]')).toHaveCount(0);
    await l.getByRole('checkbox').check();
    for (const rot of ['O que queremos alcançar', 'Responsável', 'Prazo', 'Como saberemos', 'Próximo passo']) await expect(l.getByLabel(rot)).toBeVisible();
    expect(await acoes(page)).toEqual([expect.objectContaining({ bingo: 'articulacao', i: 0, titulo: ART0 })]);
    expect((await acoes(page))![0].id).toBeTruthy();
    await expect(frente(page, 'articulacao').locator('.cp-n')).toHaveText('1');
  });

  test('o que se digita grava na hora nos campos alcancar, resp, prazo, saber e prox', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    const l = linha(page, 'articulacao', 0);
    await l.getByRole('checkbox').check();
    await l.getByLabel('O que queremos alcançar').fill('Ser ouvido nas decisões da Mesa');
    await l.getByLabel('Responsável').fill('Bruno');
    await l.getByLabel('Prazo').fill('até 20/03');
    await l.getByLabel('Como saberemos').fill('Ata da reunião');
    await l.getByLabel('Próximo passo').fill('Ligar para a secretaria');
    expect(await acoes(page)).toEqual([expect.objectContaining({ bingo: 'articulacao', i: 0, alcancar: 'Ser ouvido nas decisões da Mesa', resp: 'Bruno', prazo: 'até 20/03', saber: 'Ata da reunião', prox: 'Ligar para a secretaria' })]);
  });

  test('desmarcar remove a ação; com campos preenchidos pede confirmação e cancelar mantém tudo', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    const l = linha(page, 'articulacao', 1);
    await l.getByRole('checkbox').check();
    await l.getByLabel('Responsável').fill('Bruno');
    page.once('dialog', (d) => d.dismiss());
    await l.getByRole('checkbox').click(); // uncheck() falharia: ele confere que a caixa mudou, e cancelar a mantém marcada
    await expect(l.getByRole('checkbox')).toBeChecked();
    expect(await acoes(page)).toHaveLength(1);
    page.once('dialog', (d) => d.accept());
    await l.getByRole('checkbox').uncheck();
    expect(await acoes(page)).toEqual([]);
    await expect(l.getByLabel('Responsável')).toHaveCount(0);
  });

  test('ação salva no formato antigo abre marcada, com os campos preenchidos e a mesma identidade (id, bingo, i)', async ({ page }) => {
    const antiga = { id: 'old1', bingo: 'partido', i: 2, titulo: 'Contribuir para uma posição ou documento partidário', alcancar: 'Texto antigo', resp: 'Ana', prazo: 'até 20/03', saber: 'Ata', prox: 'Escrever' };
    await abre(page, [ILHA], { mandato: MANDATO, D: { acoes: [antiga] } });
    await frente(page, 'partido').click();
    const l = linha(page, 'partido', 2);
    await expect(l.getByRole('checkbox')).toBeChecked();
    await expect(l.getByLabel('O que queremos alcançar')).toHaveValue('Texto antigo');
    await expect(l.getByLabel('Responsável')).toHaveValue('Ana');
    expect(await acoes(page)).toEqual([antiga]);
  });
});

test.describe('Ponto de preenchimento (CAP-11.9)', () => {
  test('ação marcada com campo vazio mostra ponto amarelo; completa mostra ponto verde', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    const l = linha(page, 'articulacao', 0);
    await expect(l.locator('.cp-ponto')).toHaveCount(0);
    await l.getByRole('checkbox').check();
    await expect(l.locator('.cp-ponto')).toHaveAttribute('data-estado', 'pendente');
    await l.getByLabel('O que queremos alcançar').fill('a');
    await l.getByLabel('Responsável').fill('Bruno');
    await l.getByLabel('Prazo').fill('até 20/03');
    await l.getByLabel('Como saberemos').fill('s');
    await expect(l.locator('.cp-ponto')).toHaveAttribute('data-estado', 'pendente');
    await l.getByLabel('Próximo passo').fill('p');
    await expect(l.locator('.cp-ponto')).toHaveAttribute('data-estado', 'completa');
    await l.getByLabel('Próximo passo').fill('');
    await expect(l.locator('.cp-ponto')).toHaveAttribute('data-estado', 'pendente');
  });
});
