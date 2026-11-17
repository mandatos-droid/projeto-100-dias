import { test, expect, type Page } from '@playwright/test';
import { abre, camposDe, dadoDe } from './semente-rumo';

const ILHA = 'rumo-bandeiras';
const chip = (page: Page, rot: string) => page.getByRole('button', { name: rot, exact: true });
const card = (page: Page, rot: string) => page.locator('.rm-card', { has: page.locator('.rm-card-nome', { hasText: new RegExp(`^${rot}$`) }) });
const estrela = (page: Page, rot: string) => page.getByRole('button', { name: new RegExp(`(Marcar|Desmarcar) ${rot} (como|das) prioritárias?`) });
const nota = (page: Page, rot: string, n: number, criterio: string) => card(page, rot).getByRole('button', { name: `Nota ${n} em ${criterio}` });
const CRIT = ['Especialização da liderança no tema', 'Quantidade de apoiadores', 'Promessas de campanha', 'Impacto para o território'];
const rumoDe = (page: Page) => dadoDe(page, 'rumo') as Promise<{ bandeiras: { id: string; rot: string; prioridade: number | null }[]; criterios: unknown[] }>;

test.describe('Mural e card (RUM-01.1, RUM-01.2, RUM-02.10)', () => {
  test('selecionar Educação ativa o chip e abre o card com Argumentos e as 4 notas na mesma interação', async ({ page }) => {
    await abre(page, [ILHA]);
    await expect(card(page, 'Educação')).toHaveCount(0);
    await chip(page, 'Educação').click();
    await expect(chip(page, 'Educação')).toHaveAttribute('aria-pressed', 'true');
    await expect(card(page, 'Educação')).toBeVisible();
    await expect(page.getByLabel('Argumentos de Educação')).toBeVisible();
    await expect(card(page, 'Educação').locator('.rm-nota')).toHaveCount(4);
    expect((await camposDe(page))['m3.mural']).toBe('Educação');
  });

  test('digitar argumento e dar notas atualiza o total do card e m3.argumentos na hora', async ({ page }) => {
    await abre(page, [ILHA]);
    await chip(page, 'Educação').click();
    await page.getByLabel('Argumentos de Educação').fill('Muita demanda nas escolas do território');
    await nota(page, 'Educação', 5, CRIT[0]).click();
    await nota(page, 'Educação', 3, CRIT[1]).click();
    await expect(card(page, 'Educação').locator('.rm-pts')).toHaveAccessibleName('8 pontos de 20');
    const c = await camposDe(page);
    expect(c['m3.argumentos']).toBe('Educação: Muita demanda nas escolas do território');
    expect(c['m3.criterios']).toContain('Educação (8 pontos)');
  });

  test('só as agendas escolhidas na Missão 1 viram chips; não há "Outra agenda"', async ({ page }) => {
    await abre(page, [ILHA], { D: { agendasPrio: ['saude', 'modernizacao'] } });
    await expect(page.locator('.rm-chip')).toHaveText(['Saúde', 'Modernização do Estado']);
    await expect(page.getByLabel('Outra agenda')).toHaveCount(0);
    await chip(page, 'Modernização do Estado').click();
    await expect(card(page, 'Modernização do Estado')).toBeVisible();
    expect((await rumoDe(page)).bandeiras.map((x) => x.id)).toEqual(['modernizacao']);
  });

  test('com a Missão 1 vazia aparece o aviso com o link para a Missão 1 e nenhum chip', async ({ page }) => {
    await abre(page, [ILHA], { D: { agendasPrio: [] } });
    await expect(page.locator('.rm-chip')).toHaveCount(0);
    await expect(page.locator('.rm-vazio a[href="#/m/1/m1.oportunidades"]')).toBeVisible();
  });
});

async function comNotas(page: Page, rot: string, n: number) {
  await chip(page, rot).click();
  for (const cr of CRIT) await nota(page, rot, n, cr).click();
}

test.describe('Ranking (RUM-01.5)', () => {
  test('com 4 bandeiras com nota, ordena por total sem rótulo de sugerida', async ({ page }) => {
    await abre(page, [ILHA]);
    await comNotas(page, 'Cultura e esporte', 1);
    await comNotas(page, 'Saúde', 5);
    await comNotas(page, 'Educação', 3);
    await comNotas(page, 'Mulheres', 0);
    const nomes = await page.locator('.rm-ranking li .rm-rank-nome').allTextContents();
    expect(nomes).toEqual(['Saúde', 'Educação', 'Cultura e esporte', 'Mulheres']);
    await expect(page.locator('.rm-ranking .rm-sug')).toHaveCount(0);
  });

  test('com uma só bandeira com nota, o ranking segue sem rótulo', async ({ page }) => {
    await abre(page, [ILHA]);
    await comNotas(page, 'Saúde', 4);
    await chip(page, 'Educação').click();
    await expect(page.locator('.rm-ranking .rm-sug')).toHaveCount(0);
  });
});

test.describe('Prioritárias (RUM-02.6, RUM-02.7, RUM-01.8)', () => {
  test('confirmar as três grava m3.b1..b3 na ordem; a quarta é recusada citando as três e não grava', async ({ page }) => {
    await abre(page, [ILHA]);
    for (const r of ['Saúde', 'Educação', 'Cultura e esporte', 'Mulheres']) await chip(page, r).click();
    await estrela(page, 'Educação').click();
    await estrela(page, 'Saúde').click();
    await estrela(page, 'Cultura e esporte').click();
    let c = await camposDe(page);
    expect([c['m3.b1'], c['m3.b2'], c['m3.b3']]).toEqual(['Educação', 'Saúde', 'Cultura e esporte']);

    await estrela(page, 'Mulheres').click();
    await expect(page.locator('#avisos')).toContainText('Já são 3 agendas prioritárias (Educação, Saúde, Cultura e esporte)');
    c = await camposDe(page);
    expect([c['m3.b1'], c['m3.b2'], c['m3.b3']]).toEqual(['Educação', 'Saúde', 'Cultura e esporte']);
    expect((await rumoDe(page)).bandeiras.find((b) => b.id === 'mulheres')!.prioridade).toBeNull();
  });

  test('subir e descer reordena as prioritárias e o espelho m3.b1..b3 acompanha (sugestão #7 da Alana)', async ({ page }) => {
    await abre(page, [ILHA]);
    for (const r of ['Saúde', 'Educação', 'Cultura e esporte']) await chip(page, r).click();
    await estrela(page, 'Educação').click();
    await estrela(page, 'Saúde').click();
    await estrela(page, 'Cultura e esporte').click();
    await expect(page.getByRole('button', { name: /^Subir Educação/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: /^Descer Cultura/ })).toBeDisabled();

    await page.getByRole('button', { name: /^Subir Cultura/ }).click();
    let c = await camposDe(page);
    expect([c['m3.b1'], c['m3.b2'], c['m3.b3']]).toEqual(['Educação', 'Cultura e esporte', 'Saúde']);

    await page.getByRole('button', { name: /^Descer Educação/ }).click();
    c = await camposDe(page);
    expect([c['m3.b1'], c['m3.b2'], c['m3.b3']]).toEqual(['Cultura e esporte', 'Educação', 'Saúde']);
  });

  test('remover bandeira com notas pede confirmação; ao confirmar, sai das prioritárias e as outras sobem', async ({ page }) => {
    await abre(page, [ILHA]);
    await comNotas(page, 'Saúde', 4);
    await chip(page, 'Educação').click();
    await estrela(page, 'Saúde').click();
    await estrela(page, 'Educação').click();

    let texto = '';
    page.once('dialog', (d) => { texto = d.message(); d.dismiss(); });
    await chip(page, 'Saúde').click();
    expect(texto).toContain('Remover Saúde');
    await expect(card(page, 'Saúde')).toBeVisible();

    page.once('dialog', (d) => d.accept());
    await chip(page, 'Saúde').click();
    await expect(card(page, 'Saúde')).toHaveCount(0);
    const c = await camposDe(page);
    expect([c['m3.b1'], c['m3.b2']]).toEqual(['Educação', undefined]);
    expect(c['m3.mural']).toBe('Educação');
  });

  test('remover bandeira sem argumentos nem notas não pergunta nada', async ({ page }) => {
    await abre(page, [ILHA]);
    page.on('dialog', () => { throw new Error('não deveria abrir confirmação'); });
    await chip(page, 'Juventude').click();
    await chip(page, 'Juventude').click();
    await expect(card(page, 'Juventude')).toHaveCount(0);
  });
});

test.describe('Critérios (RUM-01.3)', () => {
  test('critério próprio entra até o 8º; o 9º é recusado', async ({ page }) => {
    await abre(page, [ILHA]);
    for (let i = 1; i <= 4; i++) {
      await page.getByLabel(/Novo critério/).fill(`Critério extra ${i}`);
      await page.getByRole('button', { name: 'Acrescentar critério' }).click();
    }
    await expect(page.locator('.rm-crit-lista li')).toHaveCount(8);
    await page.getByLabel(/Novo critério/).fill('Nono critério');
    await page.getByRole('button', { name: 'Acrescentar critério' }).click();
    await expect(page.locator('#avisos')).toContainText('O limite é de 8 critérios');
    await expect(page.locator('.rm-crit-lista li')).toHaveCount(8);
    expect((await rumoDe(page)).criterios).toHaveLength(8);
  });

  test('remover um critério apaga as notas dele e o total acompanha', async ({ page }) => {
    await abre(page, [ILHA]);
    await comNotas(page, 'Saúde', 5);
    await expect(card(page, 'Saúde').locator('.rm-pts')).toHaveAccessibleName('20 pontos de 20');
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: `Remover o critério ${CRIT[0]}` }).click();
    await expect(card(page, 'Saúde').locator('.rm-pts')).toHaveAccessibleName('15 pontos de 15');
  });
});

test.describe('Mandato antigo (RUM-02.9, RUM-70)', () => {
  const antigo = { 'm3.mural': 'Educação; Saúde; Mobilidade urbana', 'm3.b1': 'Educação', 'm3.argumentos': 'Escrito pela equipe na versão antiga' };

  test('abre com os chips marcados, a prioritária no ranking e nada gravado em D.rumo', async ({ page }) => {
    await abre(page, [ILHA], { campos: antigo });
    await expect(chip(page, 'Educação')).toHaveAttribute('aria-pressed', 'true');
    await expect(chip(page, 'Saúde')).toHaveAttribute('aria-pressed', 'true');
    await expect(chip(page, 'Mobilidade urbana ×')).toBeVisible();
    await expect(chip(page, 'Cultura e esporte')).toHaveAttribute('aria-pressed', 'false');
    await expect(card(page, 'Educação').locator('.rm-selo')).toHaveText('Prioridade 1');
    await expect(page.locator('.rm-antigo')).toContainText('Escrito pela equipe na versão antiga');
    expect(await dadoDe(page, 'rumo')).toBeUndefined();
  });

  test('a primeira edição não apaga o texto antigo de m3.argumentos', async ({ page }) => {
    await abre(page, [ILHA], { campos: antigo });
    await chip(page, 'Cultura e esporte').click();
    await page.getByLabel('Argumentos de Cultura e esporte').fill('Festivais da região');
    const c = await camposDe(page);
    expect(c['m3.argumentos']).toContain('Escrito pela equipe na versão antiga');
    expect(c['m3.argumentos']).toContain('Cultura e esporte: Festivais da região');
    expect(c['m3.mural'].split('\n')).toEqual(['Educação', 'Saúde', 'Mobilidade urbana', 'Cultura e esporte']);
    expect(c['m3.b1']).toBe('Educação');
  });
});

test('HTML digitado nos argumentos aparece como texto e não executa', async ({ page }) => {
  await abre(page, [ILHA]);
  await chip(page, 'Saúde').click();
  await page.getByLabel('Argumentos de Saúde').fill('<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>');
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  expect(await page.locator('.rm-band b', { hasText: /^negrito$/ }).count()).toBe(0);
});
