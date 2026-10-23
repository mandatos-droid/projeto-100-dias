import { test, expect } from '@playwright/test';
import { abre, camposDe } from './semente';

const base = { 'm2.coords': 'Comunicação', 'm2.on': '0|7|8|9', 'm2.f1': 'Ana Souza', 'm2.f8': 'Bia Lima', 'm2.f9': 'Caio Reis', 'm2.f10': 'Dora Alves' };
const secao = (page: import('@playwright/test').Page, id: string) => page.locator(`[data-rotina="${id}"]`);

test.describe('Rotinas por área (MEQ-17)', () => {
  test('uma área de 3 cadeiras mostra a reunião semanal de 45 min com 3 participantes e quem convoca', async ({ page }) => {
    await abre(page, ['rotinas'], base);
    const area = secao(page, 'area:Comunicação');
    await expect(area).toContainText('Reunião semanal da área');
    await expect(area).toContainText('45 min por semana');
    await expect(area).toContainText('3 participantes');
    await expect(area).toContainText('convoca: Bia Lima');
    await expect(secao(page, 'semanal')).toContainText('Semanalmente');
    await expect(secao(page, 'plan')).toContainText('2 períodos de 6h');
  });

  test('cadeira sem nome aparece como "vaga" e fora da contagem de pessoas com nome', async ({ page }) => {
    await abre(page, ['rotinas'], { ...base, 'm2.f10': '*' });
    const area = secao(page, 'area:Comunicação');
    await expect(area).toContainText('3 participantes · 2 de 3 com nome');
    await expect(area.locator('li', { hasText: 'Vídeo-maker' }).getByText('vaga', { exact: true })).toBeVisible();
    await expect(area).toContainText('escopo ainda não definido');
  });

  test('sem nenhuma pessoa nomeada mostra o estado vazio', async ({ page }) => {
    await abre(page, ['rotinas'], { 'm2.coords': 'Comunicação', 'm2.on': '0|7|8' });
    await expect(page.getByText('Dê nome a ao menos uma cadeira')).toBeVisible();
  });

  test('desligar uma rotina a tira da lista, guarda a escolha e permite religar', async ({ page }) => {
    await abre(page, ['rotinas'], base);
    await secao(page, 'area:Comunicação').getByRole('button', { name: /Desligar/ }).click();
    await expect(secao(page, 'area:Comunicação')).toHaveCount(0);
    await expect(page.getByText('Rotinas desligadas (1)')).toBeVisible();
    expect((await camposDe(page))['m2.rotoff']).toBe('area:Comunicação');
    await page.getByRole('button', { name: /Religar/ }).click();
    await expect(secao(page, 'area:Comunicação')).toBeVisible();
    expect((await camposDe(page))['m2.rotoff']).toBeUndefined();
  });

  test('mudar a coordenação de uma cadeira no painel atualiza a rotina da área na mesma tela (E-08)', async ({ page }) => {
    await abre(page, ['organograma', 'rotinas'], base);
    await expect(secao(page, 'area:Comunicação')).toContainText('3 participantes');
    await page.locator('.es-no[data-cadeira="8"]').click();
    await page.getByRole('complementary', { name: /Painel da cadeira/ }).getByLabel('Coordenação').selectOption('Legislativo');
    await expect(secao(page, 'area:Comunicação')).toContainText('2 participantes');
    await expect(secao(page, 'area:Comunicação')).not.toContainText('Caio Reis');
  });

  test('o feedback individual lista cada liderado sob a liderança (MEQ-17)', async ({ page }) => {
    await abre(page, ['rotinas'], base);
    const fb = page.locator('.es-fb');
    await expect(fb).toContainText('Ana Souza');
    await expect(fb.locator('[data-rotina="fb:7>8"]')).toContainText('Caio Reis');
    await expect(fb.locator('[data-rotina="fb:7>9"]')).toContainText('Dora Alves');
  });
});

test.describe('Aba Cadeia (MEQ-18, MEQ-19)', () => {
  const aba = (page: import('@playwright/test').Page) => page.getByRole('tab', { name: 'Cadeia' }).click();
  const foco = (page: import('@playwright/test').Page) => page.evaluate(() => (window as unknown as { __focos: { cadeiras: number[] }[] }).__focos.at(-1)?.cadeiras);
  const escuta = (page: import('@playwright/test').Page) => page.evaluate(() => {
    const w = window as unknown as { __focos: unknown[] };
    w.__focos = [];
    window.addEventListener('equipe:foco', (e) => w.__focos.push((e as CustomEvent).detail));
  });

  test('os 5 elos aparecem na ordem da spec, cada um com número, ícone, frequência, duração e quantidade de cadeiras', async ({ page }) => {
    await abre(page, ['rotinas'], base);
    await aba(page);
    const elos = page.locator('.es-elo');
    await expect(elos).toHaveCount(5);
    await expect(elos.nth(0)).toContainText('Planejamento estratégico');
    await expect(elos.nth(0)).toContainText('Quadrimestralmente · 2 períodos de 6h · 4 cadeiras');
    await expect(elos.nth(1)).toContainText('Monitoramento de avanços');
    await expect(elos.nth(2)).toContainText('Alinhamento de atualização coletiva');
    await expect(elos.nth(3)).toContainText('Reunião de área');
    await expect(elos.nth(3)).toContainText('Semanalmente · 45 min · 3 cadeiras');
    await expect(elos.nth(4)).toContainText('Feedback 1:1');
    await expect(elos.nth(4)).toContainText('Semestralmente · 30 min');
    for (let k = 0; k < 5; k++) {
      await expect(elos.nth(k).locator('.es-elo-n')).toHaveText(String(k + 1));
      await expect(elos.nth(k).locator('.es-elo-ic')).not.toBeEmpty();
    }
  });

  test('selecionar um elo publica as cadeiras envolvidas e "Mostrar todos" limpa', async ({ page }) => {
    await abre(page, ['rotinas'], { ...base, 'm2.coords': 'Comunicação|Legislativo', 'm2.on': '0|1|2|7|8|9' });
    await escuta(page);
    await aba(page);
    await page.locator('[data-elo="area"] .es-elo-bt').click();
    expect(await foco(page)).toEqual([1, 2, 7, 8, 9]);
    await expect(page.locator('[data-elo="area"] .es-elo-bt')).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Reunião da área Comunicação' }).click();
    expect(await foco(page)).toEqual([7, 8, 9]);
    await page.getByRole('button', { name: 'Mostrar todos' }).click();
    expect(await foco(page)).toEqual([]);
    await expect(page.getByRole('button', { name: 'Mostrar todos' })).toHaveCount(0);
  });

  test('sem rotinas a aba mostra o estado vazio', async ({ page }) => {
    await abre(page, ['rotinas'], {});
    await aba(page);
    await expect(page.getByText('Dê nome a ao menos uma cadeira para a cadeia')).toBeVisible();
  });
});

test.describe('Aba Entre áreas (MEQ-20, MEQ-22)', () => {
  const duas = { 'm2.coords': 'Comunicação|Legislativo', 'm2.on': '0|1|2|7|8', 'm2.f1': 'Ana Souza', 'm2.f2': 'Eva Prado', 'm2.f8': 'Bia Lima' };
  const aba = (page: import('@playwright/test').Page) => page.getByRole('tab', { name: 'Entre áreas' }).click();

  test('aceitar a sugestão Legislativo → Comunicação grava a rotina e a tira das sugestões (E-11)', async ({ page }) => {
    await abre(page, ['rotinas'], duas);
    await aba(page);
    await expect(page.getByText('Sugestões da Legisla')).toBeVisible();
    await page.getByRole('button', { name: 'Aceitar sugestão: Legislativo → Comunicação' }).click();
    const item = page.locator('.es-ent [data-rotina="x1"]');
    await expect(item).toContainText('Legislativo → Comunicação');
    await expect(item).toContainText('Semanalmente');
    await expect(page.getByRole('button', { name: /Aceitar sugestão: Legislativo/ })).toHaveCount(0);
    const x = JSON.parse((await camposDe(page))['m2.x']);
    expect(x).toHaveLength(1);
    expect([x[0].de, x[0].para, x[0].freq]).toEqual(['Legislativo', 'Comunicação', 'Semanalmente']);
  });

  test('o formulário registra origem, destino, finalidade, frequência e canal', async ({ page }) => {
    await abre(page, ['rotinas'], duas);
    await aba(page);
    const form = page.locator('.es-form');
    await form.getByLabel('Origem').selectOption('Comunicação');
    await form.getByLabel('Destino').selectOption('Legislativo');
    await form.getByLabel('Finalidade').fill('Revisar os textos antes de publicar');
    await form.getByLabel('Frequência').selectOption('Mensalmente');
    await form.getByLabel('Canal').fill('Grupo das coordenações');
    await form.getByRole('button', { name: 'Registrar rotina' }).click();
    const x = JSON.parse((await camposDe(page))['m2.x']);
    expect([x[0].de, x[0].para, x[0].finalidade, x[0].freq, x[0].canal]).toEqual(['Comunicação', 'Legislativo', 'Revisar os textos antes de publicar', 'Mensalmente', 'Grupo das coordenações']);
    await expect(page.locator('.es-ent')).toContainText('Comunicação → Legislativo');
  });

  test('a mesma área em origem e destino mostra o erro e não grava', async ({ page }) => {
    await abre(page, ['rotinas'], duas);
    await aba(page);
    const form = page.locator('.es-form');
    await form.getByLabel('Origem').selectOption('Legislativo');
    await form.getByLabel('Destino').selectOption('Legislativo');
    await form.getByLabel('Finalidade').fill('qualquer');
    await form.getByRole('button', { name: 'Registrar rotina' }).click();
    await expect(page.locator('.es-entre').getByRole('alert')).toContainText('não podem ser a mesma área');
    expect((await camposDe(page))['m2.x']).toBeUndefined();
  });

  test('desmarcar a área guarda a rotina e remarcar a restaura', async ({ page }) => {
    const x = JSON.stringify([{ id: 'x1', de: 'Legislativo', para: 'Comunicação', finalidade: 'Pauta da semana', freq: 'Semanalmente', canal: 'Grupo' }]);
    await abre(page, ['rotinas'], { ...duas, 'm2.coords': 'Legislativo', 'm2.x': x });
    await aba(page);
    await expect(page.locator('.es-ent')).toHaveCount(0);
    await expect(page.getByText('Guardadas porque uma das áreas foi desmarcada (1)')).toBeVisible();
    await page.evaluate(() => {
      const w = window as unknown as { D: { campos: Record<string, string> } };
      w.D.campos['m2.coords'] = 'Comunicação|Legislativo';
      window.dispatchEvent(new Event('guia:mudou'));
    });
    await expect(page.locator('.es-ent [data-rotina="x1"]')).toContainText('Pauta da semana');
    await expect(page.getByText(/Guardadas porque/)).toHaveCount(0);
  });

  test('sem rotinas mostra o estado vazio e remover tira da lista', async ({ page }) => {
    await abre(page, ['rotinas'], duas);
    await aba(page);
    await expect(page.getByText('Nenhuma rotina entre áreas ainda')).toBeVisible();
    await page.getByRole('button', { name: 'Aceitar sugestão: Legislativo → Comunicação' }).click();
    await page.getByRole('button', { name: 'Remover: Legislativo → Comunicação' }).click();
    await expect(page.getByText('Nenhuma rotina entre áreas ainda')).toBeVisible();
    expect((await camposDe(page))['m2.x']).toBeUndefined();
  });
});
