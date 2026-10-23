import { test, expect } from '@playwright/test';
import { abre } from './semente';

const ILHA = 'organograma';
const ESCOPO = 'Definir a estratégia de comunicação: posicionamento, cronograma e gestão de crises';
const base = { 'm2.coords': 'Comunicação|Legislativo', 'm2.on': '0|1|2|7|8', 'm2.f1': 'Ana Souza', 'm2.f8': 'Bia Lima' };
const opacidade = (page: import('@playwright/test').Page, i: number) =>
  page.locator(`.react-flow__node:has([data-cadeira="${i}"])`).evaluate((el) => getComputedStyle(el).opacity);

test.describe('Organograma: canvas e caixa (MEQ-09, MEQ-11, MEQ-15)', () => {
  test('a caixa mostra pessoa, cargo e área, com anel de progresso e o selo "escopo pendente" só sem escopo', async ({ page }) => {
    await abre(page, [ILHA], { ...base, 'm2.p8.escopo': ESCOPO });
    const chefia = page.locator('.es-no[data-cadeira="0"]');
    await expect(chefia).toContainText('Ana Souza');
    await expect(chefia).toContainText('Chefia de gabinete');
    await expect(chefia.getByText('escopo pendente')).toBeVisible();
    await expect(chefia.getByRole('img', { name: '0 de 6 campos do painel preenchidos' })).toBeVisible();
    const coord = page.locator('.es-no[data-cadeira="7"]');
    await expect(coord).toContainText('Bia Lima');
    await expect(coord).toContainText('Comunicação');
    await expect(coord.getByText('escopo pendente')).toHaveCount(0);
    await expect(coord.getByRole('img', { name: '1 de 6 campos do painel preenchidos' })).toBeVisible();
  });

  test('o filtro por área esmaece as outras áreas sem escondê-las', async ({ page }) => {
    await abre(page, [ILHA], base);
    await page.getByRole('button', { name: 'Legislativo' }).click();
    await expect(page.locator('.es-no[data-cadeira="7"]')).toBeVisible();
    expect(Number(await opacidade(page, 7))).toBeLessThan(1);
    expect(Number(await opacidade(page, 1))).toBe(1);
    await page.getByRole('button', { name: 'Todas' }).click();
    expect(Number(await opacidade(page, 7))).toBe(1);
  });

  test('o contador "X/Y cadeiras com escopo" muda quando o escopo de uma cadeira muda', async ({ page }) => {
    await abre(page, [ILHA], { ...base, 'm2.p1.escopo': ESCOPO });
    await expect(page.locator('[data-contador]')).toContainText('1/5 cadeiras com escopo definido');
    await page.evaluate((v) => {
      const w = window as unknown as { D: { campos: Record<string, string> } };
      w.D.campos['m2.p8.escopo'] = v;
      window.dispatchEvent(new Event('guia:mudou'));
    }, ESCOPO);
    await expect(page.locator('[data-contador]')).toContainText('2/5 cadeiras com escopo definido');
  });

  test('"só cadeiras com nome" tira as vagas e "Ajustar layout" enquadra tudo de novo', async ({ page }) => {
    await abre(page, [ILHA], base);
    await expect(page.locator('.es-no')).toHaveCount(5);
    await page.getByLabel('só cadeiras com nome').check();
    await expect(page.locator('.es-no')).toHaveCount(2);
    await page.getByLabel('só cadeiras com nome').uncheck();
    await expect(page.locator('.es-no')).toHaveCount(5);
    const vp = page.locator('.react-flow__viewport');
    const inicial = await vp.getAttribute('style');
    await page.locator('.react-flow__controls-zoomin').click();
    await expect.poll(async () => vp.getAttribute('style')).not.toBe(inicial);
    await page.getByRole('button', { name: 'Ajustar layout' }).click();
    await expect.poll(async () => vp.getAttribute('style')).toBe(inicial);
  });
});

import { camposDe } from './semente';

test.describe('Painel da cadeira (MEQ-09, MEQ-10)', () => {
  const painel = (page: import('@playwright/test').Page) => page.getByRole('complementary', { name: /Painel da cadeira/ });
  const abrePainel = async (page: import('@playwright/test').Page, i: number) => page.locator(`.es-no[data-cadeira="${i}"]`).click();

  test('clicar na caixa abre o painel; marcar 2 itens de escopo sobe o anel e o contador (E-07)', async ({ page }) => {
    await abre(page, [ILHA], base);
    await abrePainel(page, 7);
    await expect(painel(page)).toBeVisible();
    await expect(painel(page)).toContainText('Coordenador/a de Comunicação');
    await expect(page.locator('[data-contador]')).toContainText('0/5');
    const escopo = painel(page).getByRole('group', { name: 'Escopo de trabalho' });
    await escopo.getByRole('button', { name: ESCOPO }).click();
    await expect(page.locator('[data-contador]')).toContainText('1/5');
    await expect(page.locator('.es-no[data-cadeira="7"]').getByRole('img', { name: '1 de 6 campos do painel preenchidos' })).toBeVisible();
    await expect(page.locator('.es-no[data-cadeira="7"]').getByText('escopo pendente')).toHaveCount(0);
    await escopo.getByRole('button', { name: /Produzir conteúdo editorial/ }).click();
    expect(((await camposDe(page))['m2.p8.escopo']).split('|')).toHaveLength(2);
    await expect(page.locator('[data-contador]')).toContainText('1/5');
  });

  test('editar a pessoa no painel muda a caixa na hora e o zoom do canvas não é reenquadrado', async ({ page }) => {
    await abre(page, [ILHA], base);
    await page.locator('.react-flow__controls-zoomin').click();
    const vp = page.locator('.react-flow__viewport');
    const zoom = await vp.getAttribute('style');
    await abrePainel(page, 7);
    await painel(page).getByLabel('Pessoa', { exact: true }).fill('Carla Dias');
    await expect(page.locator('.es-no[data-cadeira="7"]')).toContainText('Carla Dias');
    expect(await vp.getAttribute('style')).toBe(zoom);
  });

  test('trocar a coordenação no painel muda a cor e o nome da área na caixa (E-08)', async ({ page }) => {
    await abre(page, [ILHA], base);
    const borda = (i: number) => page.locator(`.es-no[data-cadeira="${i}"]`).evaluate((el) => getComputedStyle(el).borderTopColor);
    const antes = await borda(8);
    await abrePainel(page, 8);
    await painel(page).getByLabel('Coordenação').selectOption('Legislativo');
    await expect(page.locator('.es-no[data-cadeira="8"]')).toContainText('Legislativo');
    expect(await borda(8)).not.toBe(antes);
    expect((await camposDe(page))['m2.p9.coord']).toBe('Legislativo');
  });

  test('liderança em ciclo no painel mostra a cadeia e mantém o valor (MEQ-07)', async ({ page }) => {
    const c = { 'm2.coords': 'Legislativo', 'm2.on': '0|20|21', 'm2.f1': 'Ana', 'm2.p21.nome_cargo': 'Alfa', 'm2.p22.nome_cargo': 'Beta', 'm2.p21.lider': '0', 'm2.p22.lider': '20' };
    await abre(page, [ILHA], c);
    await abrePainel(page, 20);
    await painel(page).getByLabel('Liderança imediata').selectOption({ label: 'Beta' });
    await expect(painel(page).getByRole('alert')).toContainText('Alfa → Beta voltaria para Alfa');
    await expect(painel(page).getByLabel('Liderança imediata')).toHaveValue('0');
  });

  test('em 360 px o painel é gaveta inferior e a página não rola na horizontal (E-13)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await abre(page, [ILHA], base);
    await abrePainel(page, 7);
    await expect(painel(page)).toBeVisible();
    const caixa = (await painel(page).boundingBox())!;
    expect(caixa.y + caixa.height).toBeGreaterThan(740 - 2);
    expect(caixa.width).toBeLessThanOrEqual(360);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('Esc fecha o painel e devolve o foco à caixa', async ({ page }) => {
    await abre(page, [ILHA], base);
    await abrePainel(page, 7);
    await expect(painel(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(painel(page)).toHaveCount(0);
    expect(await page.evaluate(() => !!document.activeElement?.closest('.react-flow__node')?.querySelector('[data-cadeira="7"]'))).toBe(true);
  });
});

test.describe('Acrescentar e remover cadeiras no organograma (MEQ-08, MEQ-09)', () => {
  const painel = (page: import('@playwright/test').Page) => page.getByRole('complementary', { name: /Painel da cadeira/ });
  const cadeia = { 'm2.coords': 'Legislativo', 'm2.on': '0|20|21|22', 'm2.f1': 'Ana', 'm2.p21.nome_cargo': 'Alfa', 'm2.p22.nome_cargo': 'Beta', 'm2.p23.nome_cargo': 'Gama', 'm2.p21.lider': '0', 'm2.p22.lider': '20', 'm2.p23.lider': '21', 'm2.p21.coord': 'Legislativo', 'm2.p22.coord': 'Legislativo', 'm2.p23.coord': 'Legislativo' };

  test('com uma caixa selecionada, "Acrescentar cadeira" cria a subordinada na mesma área e abre o painel', async ({ page }) => {
    await abre(page, [ILHA], base);
    await page.locator('.es-no[data-cadeira="7"]').click();
    await page.getByRole('button', { name: 'Acrescentar cadeira' }).click();
    await expect(page.locator('.es-no[data-cadeira="20"]')).toBeVisible();
    await expect(painel(page)).toContainText('Cadeira acrescentada');
    await expect(painel(page).getByLabel('Liderança imediata')).toHaveValue('7');
    await expect(painel(page).getByLabel('Coordenação')).toHaveValue('Comunicação');
    expect((await camposDe(page))['m2.on']).toBe('0|1|2|7|8|20');
  });

  test('sem seleção, a nova cadeira entra sob a Chefia, sem área', async ({ page }) => {
    await abre(page, [ILHA], base);
    await page.getByRole('button', { name: 'Acrescentar cadeira' }).click();
    await expect(painel(page).getByLabel('Liderança imediata')).toHaveValue('0');
    await expect(painel(page).getByLabel('Coordenação')).toHaveValue('Sem área');
  });

  test('remover um líder pede confirmação e reatribui os liderados ao líder do removido (E-09)', async ({ page }) => {
    await abre(page, [ILHA], cadeia);
    await page.locator('.es-no[data-cadeira="21"]').click();
    const msgs: string[] = [];
    page.once('dialog', (d) => { msgs.push(d.message()); d.dismiss(); });
    await painel(page).getByRole('button', { name: 'Remover esta cadeira' }).click();
    expect(msgs[0]).toContain('Gama');
    expect((await camposDe(page))['m2.on']).toBe('0|20|21|22');

    page.once('dialog', (d) => d.accept());
    await painel(page).getByRole('button', { name: 'Remover esta cadeira' }).click();
    await expect(page.locator('.es-no[data-cadeira="21"]')).toHaveCount(0);
    await expect(painel(page)).toHaveCount(0);
    const c = await camposDe(page);
    expect(c['m2.on']).toBe('0|20|22');
    expect(c['m2.p23.lider']).toBe('20');
    await page.locator('.es-no[data-cadeira="22"]').click();
    await expect(painel(page).getByLabel('Liderança imediata')).toHaveValue('20');
  });

  test('a Chefia de gabinete não oferece remover', async ({ page }) => {
    await abre(page, [ILHA], base);
    await page.locator('.es-no[data-cadeira="0"]').click();
    await expect(painel(page)).toBeVisible();
    await expect(painel(page).getByRole('button', { name: 'Remover esta cadeira' })).toHaveCount(0);
  });
});

test.describe('Organograma só com teclado (MEQ-16)', () => {
  const painel = (page: import('@playwright/test').Page) => page.getByRole('complementary', { name: /Painel da cadeira/ });

  test('Tab chega a uma caixa, Enter abre o painel e o foco cai no primeiro campo (E-12)', async ({ page }) => {
    await abre(page, [ILHA], base);
    await page.getByRole('button', { name: 'Ajustar layout' }).focus();
    let achou = false;
    for (let k = 0; k < 40 && !achou; k++) {
      await page.keyboard.press('Tab');
      achou = await page.evaluate(() => document.activeElement?.classList.contains('react-flow__node') ?? false);
    }
    expect(achou).toBe(true);
    await page.keyboard.press('Enter');
    await expect(painel(page)).toBeVisible();
    expect(await page.evaluate(() => (document.activeElement as HTMLInputElement | null)?.closest('.es-painel') !== null && document.activeElement?.tagName === 'INPUT')).toBe(true);
  });

  test('cada caixa expõe pessoa, cargo, área e estado do escopo no aria-label', async ({ page }) => {
    await abre(page, [ILHA], { ...base, 'm2.p8.escopo': ESCOPO });
    const no = (i: number) => page.locator(`.react-flow__node:has([data-cadeira="${i}"])`);
    await expect(no(0)).toHaveAttribute('aria-label', /^Ana Souza, Chefia de gabinete, área Chefia de gabinete, escopo pendente/);
    await expect(no(7)).toHaveAttribute('aria-label', /^Bia Lima, .*, área Comunicação, escopo definido/);
  });

  test('as ações da barra funcionam só com teclado', async ({ page }) => {
    await abre(page, [ILHA], base);
    await page.getByRole('button', { name: 'Acrescentar cadeira' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.es-no[data-cadeira="20"]')).toBeVisible();
    await page.getByRole('button', { name: 'Legislativo' }).focus();
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Legislativo' })).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Destaque vindo da cadeia de rotinas (MEQ-19)', () => {
  const duas = { ...base, 'm2.coords': 'Comunicação|Legislativo', 'm2.on': '0|1|2|7|8|9', 'm2.f2': 'Eva Prado', 'm2.f3': 'Gil Neves' };

  test('selecionar "Reunião da área Comunicação" na cadeia deixa só as cadeiras de Comunicação em destaque (E-10)', async ({ page }) => {
    await abre(page, [ILHA, 'rotinas'], duas);
    await page.getByRole('tab', { name: 'Cadeia' }).click();
    await page.getByRole('button', { name: 'Reunião da área Comunicação' }).click();
    for (const i of [7, 8, 9]) expect(Number(await opacidade(page, i))).toBe(1);
    for (const i of [0, 1, 2]) expect(Number(await opacidade(page, i))).toBeLessThan(1);
    await expect(page.locator('.es-no')).toHaveCount(6);
  });

  test('"Mostrar todos" devolve todas as caixas ao normal', async ({ page }) => {
    await abre(page, [ILHA, 'rotinas'], duas);
    await page.getByRole('tab', { name: 'Cadeia' }).click();
    await page.getByRole('button', { name: 'Reunião da área Comunicação' }).click();
    expect(Number(await opacidade(page, 1))).toBeLessThan(1);
    await page.locator('.es-org').getByRole('button', { name: 'Mostrar todos' }).click();
    for (const i of [0, 1, 2, 7, 8, 9]) expect(Number(await opacidade(page, i))).toBe(1);
    await expect(page.getByRole('tab', { name: 'Cadeia' })).toBeVisible();
    await expect(page.locator('.es-rot').getByRole('button', { name: 'Mostrar todos' })).toHaveCount(0);
  });
});

test.describe('Rotinas da cadeira no painel (MEQ-19)', () => {
  const painel = (page: import('@playwright/test').Page) => page.getByRole('complementary', { name: /Painel da cadeira/ });
  const tres = { 'm2.coords': 'Comunicação', 'm2.on': '0|7|8|9', 'm2.f1': 'Ana Souza', 'm2.f8': 'Bia Lima', 'm2.f9': 'Caio Reis', 'm2.f10': 'Dora Alves' };

  test('lista as rotinas em que a cadeira participa, com frequência e duração', async ({ page }) => {
    await abre(page, [ILHA], tres);
    await page.locator('.es-no[data-cadeira="8"]').click();
    const lista = painel(page).locator('.es-minhas');
    await expect(lista.locator('[data-rotina="plan"]')).toContainText('Quadrimestralmente · 2 períodos de 6h · 4 cadeiras');
    await expect(lista.locator('[data-rotina="area:Comunicação"]')).toContainText('Reunião semanal da área: Comunicação');
    await expect(lista.locator('[data-rotina="area:Comunicação"]')).toContainText('Semanalmente · 45 min · 3 cadeiras');
    await expect(lista.locator('[data-rotina="fb:7>8"]')).toContainText('Semestralmente · 30 min');
    await expect(lista.locator('[data-rotina="fb:7>9"]')).toHaveCount(0);
  });

  test('cadeira sozinha na área não lista reunião de área', async ({ page }) => {
    await abre(page, [ILHA], { 'm2.coords': 'Comunicação', 'm2.on': '0|7', 'm2.f1': 'Ana Souza' });
    await page.locator('.es-no[data-cadeira="7"]').click();
    await expect(painel(page).locator('.es-minhas [data-rotina="plan"]')).toBeVisible();
    await expect(painel(page).locator('[data-rotina^="area:"]')).toHaveCount(0);
  });

  test('"Destacar" esmaece, no organograma, quem não participa da rotina', async ({ page }) => {
    await abre(page, [ILHA], tres);
    await page.locator('.es-no[data-cadeira="8"]').click();
    await painel(page).getByRole('button', { name: /Destacar quem participa: Feedback estruturado individual/ }).click();
    expect(Number(await opacidade(page, 7))).toBe(1);
    expect(Number(await opacidade(page, 8))).toBe(1);
    expect(Number(await opacidade(page, 0))).toBeLessThan(1);
    expect(Number(await opacidade(page, 9))).toBeLessThan(1);
  });
});

test.describe('Linhas entre áreas no organograma (MEQ-21)', () => {
  const x = JSON.stringify([{ id: 'x1', de: 'Legislativo', para: 'Comunicação', finalidade: 'Pauta da semana', freq: 'Semanalmente', canal: 'Grupo' }]);
  const duas = { ...base, 'm2.coords': 'Comunicação|Legislativo', 'm2.on': '0|1|2|7|8', 'm2.f2': 'Eva Prado' };
  const arestas = (page: import('@playwright/test').Page) => page.locator('.react-flow__edge');

  test('uma rotina entre áreas desenha uma linha pontilhada rotulada, sem mudar a hierarquia', async ({ page }) => {
    await abre(page, [ILHA], duas);
    const sem = await arestas(page).count();
    await page.evaluate((v) => {
      const w = window as unknown as { D: { campos: Record<string, string> } };
      w.D.campos['m2.x'] = v;
      window.dispatchEvent(new Event('guia:mudou'));
    }, x);
    await expect(arestas(page)).toHaveCount(sem + 1);
    const linha = page.locator('.react-flow__edge[data-id="x1"]');
    await expect(linha.locator('path.react-flow__edge-path')).toHaveCSS('stroke-dasharray', /6/);
    await expect(page.locator('.react-flow__edge-textwrapper, .react-flow__edge-text').filter({ hasText: 'Semanalmente: Pauta da semana' }).first()).toBeVisible();
    await expect(page.locator('.react-flow__edge[data-id="0-1"]')).toBeVisible();
  });

  test('sem as duas áreas ativas a linha não aparece', async ({ page }) => {
    await abre(page, [ILHA], { ...duas, 'm2.coords': 'Legislativo', 'm2.x': x });
    await expect(page.locator('.react-flow__edge[data-id="x1"]')).toHaveCount(0);
  });

  test('"Destacar" na aba Entre áreas destaca as cadeiras que convocam nas duas áreas', async ({ page }) => {
    await abre(page, [ILHA, 'rotinas'], { ...duas, 'm2.x': x });
    await page.getByRole('tab', { name: 'Entre áreas' }).click();
    await page.getByRole('button', { name: 'Destacar no organograma: Legislativo → Comunicação' }).click();
    expect(Number(await opacidade(page, 1))).toBe(1);
    expect(Number(await opacidade(page, 7))).toBe(1);
    expect(Number(await opacidade(page, 0))).toBeLessThan(1);
    expect(Number(await opacidade(page, 2))).toBeLessThan(1);
  });
});
