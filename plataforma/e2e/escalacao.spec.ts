import { test, expect } from '@playwright/test';
import { abre, camposDe } from './semente';

const ILHA = 'equipe-escalacao';

test.describe('Escalação: etapas (MEQ-01, MEQ-05)', () => {
  test('abre na etapa 1 de 3, com os nomes bloqueados e o motivo à vista (E-01)', async ({ page }) => {
    await abre(page, [ILHA]);
    await expect(page.getByText('Etapa 1 de 3 · Áreas do mandato')).toBeVisible();
    await expect(page.getByRole('button', { name: /Nomes e liderança/ })).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByText('Marque ao menos uma área para liberar os nomes.')).toBeVisible();
    await page.getByRole('button', { name: /Nomes e liderança/ }).click({ force: true }); // aria-disabled: o Playwright esperaria habilitar
    await expect(page.getByText('Etapa 1 de 3 · Áreas do mandato')).toBeVisible();
    expect((await camposDe(page))['m2.etapa']).toBeUndefined();
  });

  test('voltar mantém os dados, recarregar mantém a etapa e o foco vai ao conteúdo da etapa (E-06)', async ({ page }) => {
    await abre(page, [ILHA], { 'm2.coords': 'Legislativo', 'm2.f1': 'Ana Souza' });
    await page.getByRole('button', { name: /Nomes e liderança/ }).click();
    await expect(page.getByText('Etapa 3 de 3 · Nomes e liderança')).toBeVisible();
    expect(await page.evaluate(() => document.querySelector('[data-etapa]')!.contains(document.activeElement))).toBe(true);
    expect((await camposDe(page))['m2.etapa']).toBe('3');

    await page.reload();
    await page.locator('#tela[data-pronto="true"]').waitFor();
    await expect(page.getByText('Etapa 3 de 3 · Nomes e liderança')).toBeVisible();

    await page.getByRole('button', { name: 'Voltar' }).click();
    await expect(page.getByText('Etapa 2 de 3 · Cadeiras')).toBeVisible();
    const c = await camposDe(page);
    expect(c['m2.f1']).toBe('Ana Souza');
    expect(c['m2.coords']).toBe('Legislativo');
  });
});

const MODELO = 'Comunicação|Mobilização de pessoas|Legislativo|Articulação de aliados|Secretariado|Logística';
const todas = Array.from({ length: 20 }, (_, i) => i).join('|');

test.describe('Etapa 1: áreas do mandato (MEQ-02, MEQ-04)', () => {
  test('marcar Legislativo e Comunicação mostra 11 cadeiras (E-02)', async ({ page }) => {
    await abre(page, [ILHA]);
    await expect(page.getByRole('status').filter({ hasText: 'cadeira' })).toContainText('1 cadeira');
    await page.getByLabel(/^Legislativo/).check();
    await page.getByLabel(/^Comunicação/).check();
    await expect(page.getByRole('status').filter({ hasText: 'cadeiras no gabinete' })).toContainText('11 cadeiras');
    expect((await camposDe(page))['m2.coords']).toBe('Comunicação|Legislativo');
  });

  test('"Usar o modelo completo" marca as 6 áreas e mostra 20 cadeiras', async ({ page }) => {
    await abre(page, [ILHA]);
    await page.getByRole('button', { name: /Usar o modelo completo/ }).click();
    await expect(page.getByRole('status').filter({ hasText: 'cadeiras no gabinete' })).toContainText('20 cadeiras');
    const c = await camposDe(page);
    expect(c['m2.coords']).toBe(MODELO);
    expect(c['m2.on']).toBe(todas);
    await expect(page.getByLabel(/^Logística/)).toBeChecked();
  });

  test('desmarcar área com nome abre confirmação com os nomes; cancelar mantém tudo, confirmar manda para Sem área', async ({ page }) => {
    await abre(page, [ILHA], { 'm2.coords': MODELO, 'm2.on': todas, 'm2.f8': 'Bia Lima' });
    const msgs: string[] = [];
    page.once('dialog', (d) => { msgs.push(d.message()); d.dismiss(); });
    await page.getByLabel(/^Comunicação/).click(); // cancelar a confirmação: a caixa continua marcada
    expect(msgs[0]).toContain('Bia Lima');
    await expect(page.getByLabel(/^Comunicação/)).toBeChecked();
    await expect(page.getByRole('status').filter({ hasText: 'cadeiras no gabinete' })).toContainText('20 cadeiras');

    page.once('dialog', (d) => d.accept());
    await page.getByLabel(/^Comunicação/).uncheck();
    await expect(page.getByLabel(/^Comunicação/)).not.toBeChecked();
    await expect(page.getByRole('status').filter({ hasText: 'cadeiras no gabinete' })).toContainText('17 cadeiras');
    const c = await camposDe(page);
    expect(c['m2.p8.coord']).toBe('Sem área');
    expect(c['m2.f8']).toBe('Bia Lima');
  });

  test('desmarcar área sem nomes remove as cadeiras sem perguntar', async ({ page }) => {
    await abre(page, [ILHA], { 'm2.coords': MODELO, 'm2.on': todas });
    let perguntou = false;
    page.on('dialog', (d) => { perguntou = true; d.dismiss(); });
    await page.getByLabel(/^Logística/).uncheck();
    await expect(page.getByRole('status').filter({ hasText: 'cadeiras no gabinete' })).toContainText('19 cadeiras');
    expect(perguntou).toBe(false);
  });
});

const ate39 = Array.from({ length: 40 }, (_, i) => i).join('|');

test.describe('Etapa 2: ajustar as cadeiras (MEQ-02, MEQ-03)', () => {
  const na2 = { 'm2.etapa': '2', 'm2.coords': MODELO, 'm2.on': todas };

  test('remover e acrescentar mudam a contagem', async ({ page }) => {
    await abre(page, [ILHA], na2);
    const cont = page.getByRole('status').filter({ hasText: 'de 40 cadeiras' });
    await expect(cont).toContainText('20 de 40 cadeiras');
    await page.getByRole('button', { name: 'Remover Motorista' }).click();
    await expect(cont).toContainText('19 de 40 cadeiras');
    await page.getByLabel('Acrescentar cadeira').selectOption({ label: 'Do modelo: Motorista' });
    await page.getByRole('button', { name: 'Acrescentar', exact: true }).click();
    await expect(cont).toContainText('20 de 40 cadeiras');
    await page.getByLabel('Acrescentar cadeira').selectOption('branco');
    await page.getByRole('button', { name: 'Acrescentar', exact: true }).click();
    await expect(cont).toContainText('21 de 40 cadeiras');
    expect((await camposDe(page))['m2.on']).toBe(todas + '|20');
  });

  test('com 40 cadeiras o botão de acrescentar fica desabilitado e explica o limite', async ({ page }) => {
    await abre(page, [ILHA], { ...na2, 'm2.on': ate39 });
    await expect(page.getByRole('button', { name: 'Acrescentar', exact: true })).toBeDisabled();
    await expect(page.getByText(/40 cadeiras permitidas/)).toBeVisible();
  });

  test('a Chefia de gabinete não tem botão de remover e os temáticos aparecem sem bandeira', async ({ page }) => {
    await abre(page, [ILHA], na2);
    await expect(page.getByRole('button', { name: 'Remover Chefia de gabinete' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Remover Social-media' })).toHaveCount(1);
    const tematico = page.locator('.es-cad', { hasText: 'Especialista temático(a) 1' });
    await expect(tematico.getByText('Temático', { exact: true })).toBeVisible();
    await expect(page.locator('[data-etapa]')).not.toContainText(/bandeira/i);
  });
});

test.describe('Etapa 3: nomes, coordenação e liderança (MEQ-05, MEQ-06, MEQ-07)', () => {
  const na3 = { 'm2.etapa': '3', 'm2.coords': 'Comunicação|Legislativo', 'm2.on': '0|1|2|3|4|5|6|7|8|9|10' };
  const cadeia = { 'm2.etapa': '3', 'm2.coords': 'Legislativo', 'm2.on': '0|20|21|22', 'm2.p21.nome_cargo': 'Alfa', 'm2.p22.nome_cargo': 'Beta', 'm2.p23.nome_cargo': 'Gama', 'm2.p21.lider': '0', 'm2.p22.lider': '20', 'm2.p23.lider': '21' };

  test('mostra só pessoa, cargo, coordenação e liderança por cadeira, já preenchidas (E-03)', async ({ page }) => {
    await abre(page, [ILHA], na3);
    const corpo = page.locator('[data-etapa]');
    await expect(corpo.locator('.es-nome')).toHaveCount(11);
    await expect(page.getByLabel('Coordenação, Assessor/a Legislativo/a')).toHaveValue('Legislativo');
    await expect(page.getByLabel('Liderança imediata, Assessor/a Legislativo/a')).toHaveValue('1');
    await expect(corpo.locator('textarea')).toHaveCount(0);
    await expect(corpo).not.toContainText(/escopo|habilidade|repertório/i);
  });

  test('liderança em ciclo mostra a cadeia e mantém o valor anterior (E-05)', async ({ page }) => {
    await abre(page, [ILHA], cadeia);
    await page.getByLabel('Liderança imediata, Alfa').selectOption({ label: 'Gama' });
    await expect(page.locator('[data-etapa]').getByRole('alert')).toContainText('Alfa → Beta → Gama voltaria para Alfa');
    await expect(page.getByLabel('Liderança imediata, Alfa')).toHaveValue('0');
    expect((await camposDe(page))['m2.p21.lider']).toBe('0');
  });

  test('digitar * marca a cadeira como processo seletivo de ampla concorrência', async ({ page }) => {
    await abre(page, [ILHA], na3);
    await page.getByLabel('Pessoa, Social-media').fill('*');
    await expect(page.locator('.es-nome', { hasText: 'Social-media' }).getByText('Processo seletivo de ampla concorrência')).toBeVisible();
    expect((await camposDe(page))['m2.f9']).toBe('*');
  });

  test('o nome digitado fica salvo depois de recarregar (E-06)', async ({ page }) => {
    await abre(page, [ILHA], na3);
    await page.getByLabel('Pessoa, Social-media').fill('Bia Lima');
    await page.reload();
    await page.locator('#tela[data-pronto="true"]').waitFor();
    await expect(page.getByLabel('Pessoa, Social-media')).toHaveValue('Bia Lima');
  });

  test('a mesma pessoa em 2 cadeiras é aceita, com aviso nas duas', async ({ page }) => {
    await abre(page, [ILHA], na3);
    await page.getByLabel('Pessoa, Social-media').fill('Bia Lima');
    await page.getByLabel('Pessoa, Vídeo-maker').fill('bia lima');
    await expect(page.getByText('mesma pessoa em 2 cadeiras')).toHaveCount(2);
    expect((await camposDe(page))['m2.f10']).toBe('bia lima');
  });
});

test.describe('Mini-organograma ao vivo (MEQ-05, MEQ-06)', () => {
  const na3 = { 'm2.etapa': '3', 'm2.coords': 'Comunicação', 'm2.on': '0|7|8|9|10', 'm2.f8': 'Bia Lima' };

  test('trocar a liderança de uma cadeira move a caixa na prévia em menos de 300 ms (E-04)', async ({ page }) => {
    await abre(page, [ILHA], na3);
    const caixa = page.locator('.es-mini [data-cadeira="8"]');
    await expect(caixa).toBeVisible();
    const antes = (await caixa.boundingBox())!.y;
    await page.evaluate(() => {
      const w = window as unknown as { __dt?: number };
      const cont = document.querySelector('.es-mini')!;
      let t0 = 0;
      document.addEventListener('change', () => { t0 = performance.now(); }, { capture: true, once: true });
      new MutationObserver(() => { if (t0 && w.__dt === undefined) w.__dt = performance.now() - t0; }).observe(cont, { childList: true, subtree: true, attributes: true });
    });
    await page.getByLabel('Liderança imediata, Social-media').selectOption('0'); // sobe para a Chefia de gabinete
    await expect.poll(async () => (await page.locator('.es-mini [data-cadeira="8"]').boundingBox())!.y).not.toBe(antes);
    expect(await page.evaluate(() => (window as unknown as { __dt?: number }).__dt)).toBeLessThan(300);
    expect((await camposDe(page))['m2.p9.lider']).toBe('0');
  });

  test('a prévia mostra só as cadeiras ativas e não abre painel nem edita nada', async ({ page }) => {
    await abre(page, [ILHA], na3);
    await expect(page.locator('.es-mini [data-cadeira]')).toHaveCount(5);
    await page.locator('.es-mini [data-cadeira="7"]').click({ force: true });
    await expect(page.locator('.eq-detalhe')).toHaveCount(0);
    expect(await camposDe(page)).toEqual(na3);
  });
});
