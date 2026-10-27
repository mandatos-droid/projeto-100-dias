import { test, expect, type Page } from '@playwright/test';
import { abre, dadoDe, EQUIPE, MANDATO } from './semente-rumo';
import { abreGuia } from './guia-real';

/* Missão 4 · matriz das ações dos 100 dias (CAP-10 a CAP-13, CAP-40). Ilha montada na rota de teste, com os BINGOS reais do Guia. */
const ILHA = 'capital-acoes';
type Acao = { id?: string; bingo?: string; i?: number; titulo?: string; alcancar?: string; resp?: string; prazo?: string; saber?: string; prox?: string };
const acoes = (page: Page) => dadoDe(page, 'acoes') as Promise<Acao[] | undefined>;
const frente = (page: Page, k: string) => page.locator(`.cp-frentes button[data-frente="${k}"]`);
const linhas = (page: Page) => page.locator('.cp-acoes > li');
const linha = (page: Page, bingo: string, i: number) => page.locator(`li[data-bingo="${bingo}"][data-i="${i}"]`);
/** Data AAAA-MM-DD daqui a n dias, no fuso do aparelho (os testes valem em qualquer dia). */
const iso = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const ART0 ='Sustentar diálogo aberto com a Secretaria-Geral da Mesa ou estrutura equivalente';

test.describe('Frentes e linhas (CAP-10.1, CAP-10.2)', () => {
  test('mostra os botões das 4 frentes de hoje, cada um com o contador de ações escolhidas', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO, D: { acoes: [{ id: 'a', bingo: 'partido', i: 2, titulo: 'x' }, { id: 'b', bingo: 'partido', i: 3, titulo: 'y' }, { id: 'c', bingo: 'redes', i: 0, titulo: 'z' }] } });
    await expect(page.locator('.cp-frentes button[data-frente]')).toHaveCount(4); // o 5º botão é a visão "Todas as ações" (CAP-13)
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
    await l.getByLabel('Prazo').fill(iso(20));
    await l.getByLabel('Como saberemos').fill('Ata da reunião');
    await l.getByLabel('Próximo passo').fill('Ligar para a secretaria');
    expect(await acoes(page)).toEqual([expect.objectContaining({ bingo: 'articulacao', i: 0, alcancar: 'Ser ouvido nas decisões da Mesa', resp: 'Bruno', prazo: iso(20), saber: 'Ata da reunião', prox: 'Ligar para a secretaria' })]);
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
    await l.getByLabel('Prazo').fill(iso(20));
    await l.getByLabel('Como saberemos').fill('s');
    await expect(l.locator('.cp-ponto')).toHaveAttribute('data-estado', 'pendente');
    await l.getByLabel('Próximo passo').fill('p');
    await expect(l.locator('.cp-ponto')).toHaveAttribute('data-estado', 'completa');
    await l.getByLabel('Próximo passo').fill('');
    await expect(l.locator('.cp-ponto')).toHaveAttribute('data-estado', 'pendente');
  });
});

/* ---------- responsável, prazo e texto base (CAP-11, CAP-40) ---------- */
const BASE_ARTICULACAO = 'Reunião ou contato registrado, com ata ou resumo do que foi combinado e quem dá continuidade.';
const comPosse = (dias: number) => ({ ...MANDATO, data_posse: iso(dias) });
type AcaoCad = Acao & { respCad?: number | null };
async function marca(page: Page, bingo = 'articulacao', i = 0) {
  const l = linha(page, bingo, i);
  await l.getByRole('checkbox').check();
  return l;
}

test.describe('Responsável (CAP-11.1)', () => {
  test('mostra as pessoas da Missão 2; escolher uma grava resp com o nome e respCad; clicar de novo desmarca', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO, campos: EQUIPE });
    const l = await marca(page);
    const grupo = l.getByRole('group', { name: 'Pessoas da equipe' });
    await expect(grupo.getByRole('button')).toHaveCount(4);
    await grupo.getByRole('button', { name: /Bruno Lima/ }).click();
    expect(await acoes(page)).toEqual([expect.objectContaining({ resp: 'Bruno Lima', respCad: 1 })]);
    await expect(grupo.getByRole('button', { name: /Bruno Lima/ })).toHaveAttribute('aria-pressed', 'true');
    await grupo.getByRole('button', { name: /Bruno Lima/ }).click();
    const [a] = (await acoes(page)) as AcaoCad[];
    expect(a.resp).toBe('');
    expect(a.respCad ?? null).toBeNull();
  });

  test('texto livre vale como responsável e desfaz a escolha de pessoa', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO, campos: EQUIPE });
    const l = await marca(page);
    await l.getByRole('group', { name: 'Pessoas da equipe' }).getByRole('button', { name: /Ana Souza/ }).click();
    await l.getByLabel('Responsável', { exact: true }).fill('Vereadora Marta');
    const [a] = (await acoes(page)) as AcaoCad[];
    expect(a.resp).toBe('Vereadora Marta');
    expect(a.respCad ?? null).toBeNull();
    await expect(l.getByRole('group', { name: 'Pessoas da equipe' }).locator('[aria-pressed="true"]')).toHaveCount(0);
  });

  test('sem pessoas na Missão 2 só o texto livre aparece, com a explicação', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    const l = await marca(page);
    await expect(l.getByRole('group', { name: 'Pessoas da equipe' })).toHaveCount(0);
    await expect(l.getByText('A lista de pessoas vem da Missão 2')).toBeVisible();
    await l.getByLabel('Responsável', { exact: true }).fill('Bruno');
    expect((await acoes(page))![0].resp).toBe('Bruno');
  });
});

test.describe('Prazo (CAP-11.2, CAP-40)', () => {
  test('é um seletor de data e grava AAAA-MM-DD', async ({ page }) => {
    await abre(page, [ILHA], { mandato: comPosse(10) });
    const l = await marca(page);
    await expect(l.getByLabel('Prazo')).toHaveAttribute('type', 'date');
    await l.getByLabel('Prazo').fill(iso(20));
    expect((await acoes(page))![0].prazo).toBe(iso(20));
  });

  test('uma data no passado é recusada com aviso e não grava', async ({ page }) => {
    await abre(page, [ILHA], { mandato: comPosse(10) });
    const l = await marca(page);
    await l.getByLabel('Prazo').fill(iso(-1));
    await expect(page.locator('#avisos')).toContainText('já passou');
    expect((await acoes(page))![0].prazo ?? '').toBe('');
  });

  test('com data de posse, passar de 100 dias depois dela é recusado e o último dia vale', async ({ page }) => {
    await abre(page, [ILHA], { mandato: comPosse(10) });
    const l = await marca(page);
    await expect(l.getByLabel('Prazo')).toHaveAttribute('max', iso(110));
    await l.getByLabel('Prazo').fill(iso(111));
    await expect(page.locator('#avisos')).toContainText('100 dias depois da posse');
    expect((await acoes(page))![0].prazo ?? '').toBe('');
    await l.getByLabel('Prazo').fill(iso(110));
    expect((await acoes(page))![0].prazo).toBe(iso(110));
  });

  test('sem data de posse qualquer prazo futuro é aceito, sem máximo', async ({ page }) => {
    await abre(page, [ILHA], { mandato: { ...MANDATO, data_posse: '' } });
    const l = await marca(page);
    await expect(l.getByLabel('Prazo')).not.toHaveAttribute('max', /.+/);
    await l.getByLabel('Prazo').fill(iso(800));
    expect((await acoes(page))![0].prazo).toBe(iso(800));
  });

  test('o prazo antigo em texto livre continua visível e guardado até escolherem uma data', async ({ page }) => {
    const antiga = { id: 'old1', bingo: 'articulacao', i: 0, titulo: ART0, alcancar: 'x', resp: 'Ana', prazo: 'até 20/03', saber: 's', prox: 'p' };
    await abre(page, [ILHA], { mandato: comPosse(10), D: { acoes: [antiga] } });
    const l = linha(page, 'articulacao', 0);
    await expect(l.getByText('Prazo anterior: até 20/03')).toBeVisible();
    await expect(l.locator('.cp-ponto')).toHaveAttribute('data-estado', 'completa');
    expect(await acoes(page)).toEqual([antiga]);
    await l.getByLabel('Prazo').fill(iso(30));
    expect((await acoes(page))![0].prazo).toBe(iso(30));
    await expect(l.getByText('Prazo anterior')).toHaveCount(0);
  });
});

test.describe('Texto base de "Como saberemos" (CAP-11.3)', () => {
  test('marcar a ação sugere o texto base da frente, editável', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    const l = await marca(page);
    await expect(l.getByLabel('Como saberemos')).toHaveValue(BASE_ARTICULACAO);
    expect((await acoes(page))![0].saber).toBe(BASE_ARTICULACAO);
    await l.getByLabel('Como saberemos').fill('Ata assinada');
    expect((await acoes(page))![0].saber).toBe('Ata assinada');
  });

  test('desmarcar logo em seguida, sem mexer no texto base, não pede confirmação', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    const l = await marca(page);
    let perguntou = false;
    page.on('dialog', (d) => { perguntou = true; void d.dismiss(); });
    await l.getByRole('checkbox').uncheck();
    expect(perguntou).toBe(false);
    expect(await acoes(page)).toEqual([]);
  });
});

/* ---------- progresso e "Todas as ações" (CAP-12, CAP-13) ---------- */
const progresso = (page: Page) => page.locator('.cp-progresso');
const OK = '2 ações em 2 frentes ✓';

test.describe('Progresso: 2 ações em 2 frentes (CAP-12)', () => {
  test('sem ações, ou com 2 na mesma frente, mostra que faltam ações em frentes diferentes', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await expect(progresso(page)).toContainText('Faltam ações em frentes diferentes');
    await expect(progresso(page)).toHaveAttribute('data-ok', 'false');
    await marca(page, 'articulacao', 0);
    await marca(page, 'articulacao', 1);
    await expect(progresso(page)).toContainText('Faltam ações em frentes diferentes');
    await expect(progresso(page)).not.toContainText('✓');
    await expect(progresso(page)).toHaveAttribute('data-ok', 'false');
  });

  test('marcar uma ação em outra frente mostra "2 ações em 2 frentes ✓"; desmarcar volta ao aviso', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await marca(page, 'articulacao', 0);
    await frente(page, 'mobilizacao').click();
    await marca(page, 'mobilizacao', 3);
    await expect(progresso(page)).toContainText(OK);
    await expect(progresso(page)).toHaveAttribute('data-ok', 'true');
    await linha(page, 'mobilizacao', 3).getByRole('checkbox').uncheck();
    await expect(progresso(page)).toContainText('Faltam ações em frentes diferentes');
  });

  test('a barra mostra o avanço: vazia, meio cheia com 1 ação e cheia ao cumprir a regra', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    const barra = progresso(page).locator('progress');
    await expect(barra).toHaveAttribute('value', '0');
    await marca(page, 'articulacao', 0);
    await expect(barra).toHaveAttribute('value', '2');
    await frente(page, 'redes').click();
    await marca(page, 'redes', 0);
    await expect(barra).toHaveAttribute('value', '4');
    await expect(barra).toHaveAttribute('max', '4');
  });

  test('ações salvas no formato antigo contam no progresso', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO, D: { acoes: [{ id: 'a', bingo: 'partido', i: 2, titulo: 'x' }, { id: 'b', bingo: 'redes', i: 0, titulo: 'y' }] } });
    await expect(progresso(page)).toContainText(OK);
  });
});

test.describe('Visão "Todas as ações" (CAP-13)', () => {
  const D = {
    acoes: [
      { id: 'a', bingo: 'redes', i: 0, titulo: 'Definir os públicos prioritários e a função de cada canal', prazo: iso(40), resp: 'Carla' },
      { id: 'b', bingo: 'articulacao', i: 0, titulo: ART0, prazo: iso(10), resp: 'Bruno' },
      { id: 'c', bingo: 'partido', i: 2, titulo: 'Contribuir para uma posição ou documento partidário', prazo: 'até 20/03' },
      { id: 'd', bingo: 'mobilizacao', i: 0, titulo: 'Organizar uma base de apoiadores e voluntários', prazo: iso(25) },
      { id: 'e', bingo: 'partido', i: 0, titulo: 'Apresentar as prioridades do mandato à liderança partidária' },
    ],
  };
  const todas = (page: Page) => page.locator('.cp-todas > li');

  test('lista as ações escolhidas de todas as frentes, da data mais próxima à mais distante, e sem data no fim', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO, D });
    await page.getByRole('button', { name: 'Todas as ações' }).click();
    await expect(todas(page)).toHaveCount(5);
    await expect(todas(page).nth(0)).toContainText(ART0);
    await expect(todas(page).nth(1)).toContainText('Organizar uma base de apoiadores e voluntários');
    await expect(todas(page).nth(2)).toContainText('Definir os públicos prioritários');
    await expect(todas(page).nth(3)).toContainText('Contribuir para uma posição');
    await expect(todas(page).nth(4)).toContainText('Apresentar as prioridades do mandato');
  });

  test('cada linha mostra a frente, o responsável e o prazo (data em dd/mm/aaaa, texto antigo como estava)', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO, D });
    await page.getByRole('button', { name: 'Todas as ações' }).click();
    const [ano, mes, dia] = iso(10).split('-');
    await expect(todas(page).nth(0)).toContainText('Articulação política');
    await expect(todas(page).nth(0)).toContainText('Bruno');
    await expect(todas(page).nth(0)).toContainText(`${dia}/${mes}/${ano}`);
    await expect(todas(page).nth(3)).toContainText('até 20/03');
  });

  test('sem ações escolhidas mostra o aviso; voltar para uma frente mostra as linhas de novo', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await page.getByRole('button', { name: 'Todas as ações' }).click();
    await expect(page.getByText('Nenhuma ação escolhida ainda')).toBeVisible();
    await expect(linhas(page)).toHaveCount(0);
    await frente(page, 'partido').click();
    await expect(linhas(page)).toHaveCount(9);
    await expect(page.getByText('Nenhuma ação escolhida ainda')).toHaveCount(0);
  });
});

/* ---------- fluxo completo, em celular e computador, e no Guia de verdade (CAP-10 a CAP-13, CAP-40) ---------- */
const semRolagemLateral = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

for (const tela of [{ nome: 'celular 360 px', width: 360, height: 740 }, { nome: 'computador 1280 px', width: 1280, height: 800 }]) {
  test.describe(`Fluxo completo em ${tela.nome}`, () => {
    test.use({ viewport: { width: tela.width, height: tela.height } });

    test('escolhe frente, marca e preenche, troca de frente, confere "Todas as ações", recarrega e continua salvo', async ({ page }) => {
      await abre(page, [ILHA], { mandato: comPosse(10), campos: EQUIPE });
      const a = await marca(page, 'articulacao', 0);
      await a.getByLabel('O que queremos alcançar').fill('Ser ouvido nas decisões da Mesa');
      await a.getByRole('group', { name: 'Pessoas da equipe' }).getByRole('button', { name: /Bruno Lima/ }).click();
      await a.getByLabel('Prazo').fill(iso(30));
      await a.getByLabel('Próximo passo').fill('Ligar para a secretaria');
      await expect(a.locator('.cp-ponto')).toHaveAttribute('data-estado', 'completa');
      expect(await semRolagemLateral(page)).toBe(true);

      await frente(page, 'mobilizacao').click();
      const b = await marca(page, 'mobilizacao', 0);
      await b.getByLabel('Prazo').fill(iso(15));
      await expect(b.locator('.cp-ponto')).toHaveAttribute('data-estado', 'pendente');
      await expect(progresso(page)).toContainText(OK);
      expect(await semRolagemLateral(page)).toBe(true);

      await page.getByRole('button', { name: 'Todas as ações' }).click();
      const todas = page.locator('.cp-todas > li');
      await expect(todas).toHaveCount(2);
      await expect(todas.nth(0)).toContainText('Mobilização de apoiadores'); // prazo mais próximo primeiro
      await expect(todas.nth(1)).toContainText('Articulação política');
      await expect(todas.nth(1)).toContainText('Bruno Lima');
      expect(await semRolagemLateral(page)).toBe(true);

      await page.reload();
      await page.locator('#tela[data-pronto="true"]').waitFor();
      await frente(page, 'articulacao').click();
      await expect(linha(page, 'articulacao', 0).getByLabel('Próximo passo')).toHaveValue('Ligar para a secretaria');
      await expect(progresso(page)).toContainText(OK);
      const salvas = (await acoes(page)) as AcaoCad[];
      expect(salvas).toHaveLength(2);
      expect(salvas[0]).toEqual(expect.objectContaining({ bingo: 'articulacao', i: 0, resp: 'Bruno Lima', respCad: 1, prazo: iso(30), prox: 'Ligar para a secretaria' }));
    });
  });
}

test.describe('Guia de verdade: ação salva antes da mudança continua abrindo (CAP-12.11, CAP-40)', () => {
  const antigas = [
    { id: 'o1', bingo: 'articulacao', i: 1, titulo: 'Reunir-se com a presidência ou a secretaria de uma comissão prioritária', alcancar: 'Acesso à pauta', resp: 'Ana', prazo: 'até 20/03', saber: 'Ata', prox: 'Agendar' },
    { id: 'o2', bingo: 'redes', i: 0, titulo: 'Definir os públicos prioritários e a função de cada canal' },
  ];

  test('a ilha abre as ações antigas marcadas, com prazo em texto livre visível, e o Resumo as mostra', async ({ page }) => {
    await abreGuia(page, '#/m/4/m4.acoes/1', { dados: { acoes: antigas } });
    await expect(linha(page, 'articulacao', 1).getByRole('checkbox')).toBeChecked();
    await expect(linha(page, 'articulacao', 1).getByText('Prazo anterior: até 20/03')).toBeVisible();
    await expect(progresso(page)).toContainText(OK);
    await frente(page, 'redes').click();
    await expect(linha(page, 'redes', 0).getByRole('checkbox')).toBeChecked();
    await page.evaluate(() => { location.hash = '#/resumo'; });
    const resumo = page.locator('#tela');
    await expect(resumo).toContainText('Reunir-se com a presidência ou a secretaria de uma comissão prioritária');
    await expect(resumo).toContainText('Responsável: Ana');
    await expect(resumo).toContainText('Prazo: até 20/03');
    await expect(resumo).toContainText('Verificação: Ata');
  });

  test('marcar e preencher no Guia grava no formato antigo e o Resumo mostra responsável e prazo', async ({ page }) => {
    await abreGuia(page, '#/m/4/m4.acoes/1', { dados: {} });
    const l = await marca(page, 'articulacao', 0);
    await l.getByLabel('Responsável', { exact: true }).fill('Bruno');
    await l.getByLabel('Prazo').fill(iso(5));
    await page.evaluate(() => { location.hash = '#/resumo'; });
    await expect(page.locator('#tela')).toContainText('Responsável: Bruno');
    await expect(page.locator('#tela')).toContainText(`Prazo: ${iso(5).split('-').reverse().join('/')}`); // o Resumo mostra DD/MM/AAAA (T25)
  });
});
