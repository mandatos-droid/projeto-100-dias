import { test, expect, type Page } from '@playwright/test';
import { abre, camposDe } from './semente';

/* Mandato salvo pela versão antiga da Missão 2: 20 cadeiras fixas, sem m2.on nem m2.coords, com ficha e bandeiras (m2.areas). */
const ESCOPO = 'Definir a estratégia de comunicação: posicionamento, cronograma e gestão de crises';
const legado: Record<string, string> = {
  ...Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`m2.f${i + 1}`, `Pessoa ${i + 1}`])),
  'm2.p1.escopo': ESCOPO, 'm2.p1.coord': 'Chefia de área', 'm2.p8.escopo': ESCOPO,
  'm2.areas': 'saude|educacao', 'm2.areas_aplicadas': 'saude',
};
const painel = (page: Page) => page.getByRole('complementary', { name: /Painel da cadeira/ });

test.describe('Mandato da versão antiga (MEQ-24)', () => {
  test('a escalação abre com as 20 cadeiras e as 6 áreas marcadas, e os nomes intactos (E-15)', async ({ page }) => {
    await abre(page, ['equipe-escalacao'], legado);
    await expect(page.getByRole('status').filter({ hasText: 'cadeiras no gabinete' })).toContainText('20 cadeiras');
    for (const a of ['Legislativo', 'Comunicação', 'Articulação de aliados', 'Mobilização de pessoas', 'Secretariado', 'Logística']) {
      await expect(page.getByLabel(new RegExp(`^${a}`))).toBeChecked();
    }
    await page.getByRole('button', { name: /Nomes e liderança/ }).click();
    await expect(page.locator('.es-nome')).toHaveCount(20);
    await expect(page.getByLabel('Pessoa, Social-media')).toHaveValue('Pessoa 9');
    await expect(page.getByLabel('Pessoa, Motorista')).toHaveValue('Pessoa 20');
  });

  test('o organograma mostra as 20 cadeiras e a ficha antiga aparece no painel', async ({ page }) => {
    await abre(page, ['organograma'], legado);
    await expect(page.locator('.es-no')).toHaveCount(20);
    await expect(page.locator('.es-no[data-cadeira="0"]')).toContainText('Pessoa 1');
    await expect(page.locator('[data-contador]')).toContainText('2/20 cadeiras com escopo definido');
    await page.locator('.es-no[data-cadeira="7"]').click();
    await expect(painel(page).getByRole('group', { name: 'Escopo de trabalho' }).getByRole('button', { name: ESCOPO })).toHaveAttribute('aria-pressed', 'true');
  });

  test('m2.areas e m2.areas_aplicadas continuam gravadas depois de editar e não aparecem na tela', async ({ page }) => {
    await abre(page, ['equipe-escalacao', 'organograma'], legado);
    page.once('dialog', (d) => d.accept()); // a Logística tem o motorista nomeado: pede confirmação
    await page.getByLabel(/^Logística/).uncheck();
    await page.getByLabel(/^Logística/).check();
    const c = await camposDe(page);
    expect(c['m2.areas']).toBe('saude|educacao');
    expect(c['m2.areas_aplicadas']).toBe('saude');
    await expect(page.locator('#tela')).not.toContainText(/bandeira/i);
    await expect(page.locator('#tela')).not.toContainText('saude');
  });

  /* ganchos do Guia (m2.js) rodando sobre stubs mínimos do legado; confere tela, Resumo e painel da Legisla */
  async function confere(page: Page, campos: Record<string, string>, nomeadas: number, total: number) {
    await page.addInitScript(() => {
      const w = window as unknown as Record<string, unknown>;
      w.Comp = {}; w.esc = (s: unknown) => String(s); w.temConteudo = () => false;
      w.Telas = { estadoTxt: () => 'Em andamento · 0 de 20 cargos' };
      w.Resumo = { sem: 'sem', ex: () => 'orig' };
    });
    await abre(page, ['organograma'], campos);
    await page.addScriptTag({ url: '/legacy/m2.js' });
    await expect(page.locator('.es-no')).toHaveCount(total);
    const guia = await page.evaluate(() => {
      const w = window as unknown as { Telas: { estadoTxt(e: unknown): string }; Resumo: { ex(e: unknown): string } };
      return { exercicio: w.Telas.estadoTxt({ tipo: 'funcoes' }), resumo: w.Resumo.ex({ tipo: 'funcoes' }) };
    });
    expect(guia.exercicio).toContain(`${nomeadas} de ${total} cargos`);
    expect(guia.resumo).toContain(`Cargos preenchidos (${nomeadas} de ${total})`);
    await page.goto('/painel');
    const l = await page.evaluate((cs) => (window as unknown as { lerMandato(m: unknown): { cargosPreenchidos: number; cargosTotal: number } }).lerMandato({ dados: { campos: cs } }), campos);
    expect([l.cargosPreenchidos, l.cargosTotal]).toEqual([nomeadas, total]);
  }

  test('mandato antigo: tela, Resumo e painel da Legisla mostram 20 de 20', async ({ page }) => {
    await confere(page, legado, 20, 20);
  });

  test('mandato novo com 4 cadeiras e 3 nomes: tela, Resumo e painel mostram 3 de 4', async ({ page }) => {
    await confere(page, { 'm2.coords': 'Comunicação', 'm2.on': '0|7|8|9', 'm2.f1': 'Ana', 'm2.f8': 'Bia', 'm2.f9': '*' }, 3, 4);
  });
});
