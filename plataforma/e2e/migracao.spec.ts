import { test, expect, type Page } from '@playwright/test';
import { abre, camposDe } from './semente';

/* Mandato salvo pela versão antiga da Missão 2: 20 cadeiras fixas, sem m2.on nem m2.coords, com ficha e bandeiras (m2.areas). */
const ESCOPO = 'Definir a estratégia de comunicação: posicionamento, cronograma e gestão de crises';
const legado: Record<string, string> = {
  ...Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`m2.f${i + 1}`, `Pessoa ${i + 1}`])),
  'm2.p1.escopo': ESCOPO, 'm2.p1.coord': 'Chefia de área', 'm2.p8.escopo': ESCOPO,
  'm2.areas': 'saude|educacao', 'm2.areas_aplicadas': 'saude',
};

test.describe('Mandato da versão antiga (MEQ-24)', () => {
  /* T27: a escalação saiu; a tabela de equipe mostra as 20 pessoas do mandato antigo, com os nomes intactos (E-15) */
  test('a tabela abre com as 20 linhas e os nomes das pessoas intactos (E-15)', async ({ page }) => {
    await abre(page, ['equipe-tabela'], legado);
    await expect(page.getByLabel(/^Nome da pessoa, linha \d+$/)).toHaveCount(20);
    await expect(page.getByLabel('Nome da pessoa, linha 9')).toHaveValue('Pessoa 9');
    await expect(page.getByLabel('Nome da pessoa, linha 20')).toHaveValue('Pessoa 20');
  });

  /* T18: o painel e o contador de escopo saíram do organograma; a ficha antiga agora aparece na linha da tabela de equipe */
  test('o organograma mostra as 20 cadeiras e o escopo antigo aparece na tabela', async ({ page }) => {
    await abre(page, ['equipe-tabela', 'organograma'], legado);
    await expect(page.locator('.es-no')).toHaveCount(20);
    await expect(page.locator('.es-no[data-cadeira="0"]')).toContainText('Pessoa 1');
    await expect(page.getByLabel('Escopo, linha 8')).toHaveValue(ESCOPO);
  });

  test('m2.areas e m2.areas_aplicadas continuam gravadas depois de editar e não aparecem na tela', async ({ page }) => {
    await abre(page, ['equipe-tabela', 'organograma'], legado);
    await page.getByLabel('Escopo, linha 8').fill(ESCOPO + ' e relações com a imprensa'); // T27: editar pela tabela, não mais pela escalação
    const c = await camposDe(page);
    expect(c['m2.areas']).toBe('saude|educacao');
    expect(c['m2.areas_aplicadas']).toBe('saude');
    await expect(page.locator('#tela')).not.toContainText(/bandeira/i);
    await expect(page.locator('#tela')).not.toContainText('saude');
  });

  /* ganchos do Guia (m2.js) rodando sobre stubs mínimos do legado; confere tela, Resumo e painel da Legisla */
  async function confere(page: Page, campos: Record<string, string>, nomeadas: number, total: number, completas: number) {
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
    expect(guia.exercicio).toContain(`${completas} de ${total} linhas completas`); // T19: o Guia conta linhas completas da tabela (RM2-09)
    expect(guia.resumo).toContain(`Linhas completas (${completas} de ${total})`);
    await page.goto('/painel');
    const l = await page.evaluate((cs) => (window as unknown as { lerMandato(m: unknown): { cargosPreenchidos: number; cargosTotal: number } }).lerMandato({ dados: { campos: cs } }), campos);
    expect([l.cargosPreenchidos, l.cargosTotal]).toEqual([nomeadas, total]);
  }

  test('mandato antigo: o Guia mostra 0 de 20 linhas completas (sem escopo e competências por linha) e o painel da Legisla, 20 de 20 cargos', async ({ page }) => {
    await confere(page, legado, 20, 20, 0);
  });

  test('mandato com 4 cadeiras e 3 nomes: o Guia mostra 0 de 4 linhas completas e o painel da Legisla, 3 de 4 cargos', async ({ page }) => {
    await confere(page, { 'm2.coords': 'Comunicação', 'm2.on': '0|7|8|9', 'm2.f1': 'Ana', 'm2.f8': 'Bia', 'm2.f9': '*' }, 3, 4, 0);
  });
});
