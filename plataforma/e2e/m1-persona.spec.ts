import { test, expect, type Page } from '@playwright/test';
import { abreGuia, salvoDe } from './guia-real';

/* Missão 1 · Persona, pergunta 1.3 (PER-07 a PER-09): 3 caixas de conquista e o cargo com a opção "Não sei".
   O Guia troca cada textarea por um editor rico (.rico-area); o textarea escondido guarda o HTML. */
const TEXTO = 'Elenque quais são as principais conquistas ou grandes entregas que o mandato deseja ter alcançado antes do fim da legislatura. Registre até 3:';
const CARGO = 'Qual é o próximo cargo que a liderança parlamentar gostaria de ocupar?';
const editor = (page: Page, k: string) => page.locator(`.campo:has(textarea[data-k="${k}"]) .rico-area`);
const campos = async (page: Page) => ((await salvoDe(page)).dados as { campos?: Record<string, string> }).campos ?? {};

test.describe('Persona · desejo para o futuro (PER-07 a PER-09)', () => {
  test('mostra o texto, as 3 caixas de conquista e o cargo, cada um gravando na sua chave', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.persona');
    await expect(page.getByText(TEXTO)).toBeVisible();
    for (const n of [1, 2, 3]) await expect(page.getByText(`Conquista/Grande Entrega almejada ${n}`)).toBeVisible();
    await expect(page.getByText(CARGO)).toBeVisible();
    await expect(page.locator('textarea[data-k="m1.q3"]')).toHaveCount(0);
    await editor(page, 'm1.q3c2').click();
    await page.keyboard.type('Aprovar a lei do saneamento');
    await expect.poll(async () => (await campos(page))['m1.q3c2']).toContain('Aprovar a lei do saneamento');
    await page.locator('select[data-k="m1.q3b"]').selectOption('Senador(a)');
    await expect.poll(async () => (await campos(page))['m1.q3b']).toBe('Senador(a)');
    expect((await campos(page))['m1.q3']).toBeUndefined();
  });

  test('o select de cargo traz a opção "Não sei / não desejo registrar" e ela grava', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.persona');
    await expect(page.locator('select[data-k="m1.q3b"] option', { hasText: 'Não sei / não desejo registrar' })).toHaveCount(1);
    await page.locator('select[data-k="m1.q3b"]').selectOption('Não sei / não desejo registrar');
    await expect.poll(async () => (await campos(page))['m1.q3b']).toBe('Não sei / não desejo registrar');
  });

  test('resposta antiga de m1.q3 aparece como "Resposta anterior" e segue gravada', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.persona', { dados: { campos: { 'm1.q3': 'Aprovar o plano estadual' } } });
    await expect(page.getByText('Resposta anterior')).toBeVisible();
    await expect(page.locator('.resposta-anterior')).toContainText('Aprovar o plano estadual');
    await expect(page.locator('select[data-k="m1.q3b"]')).toHaveValue('');
    expect((await campos(page))['m1.q3']).toBe('Aprovar o plano estadual');
  });
});

test('o Resumo mostra o próximo cargo (m1.q3b)', async ({ page }) => {
  await abreGuia(page, '#/resumo', { dados: { campos: { 'm1.q3b': 'Senado da República' } } });
  await expect(page.getByText('Próximo cargo que a liderança deseja ocupar')).toBeVisible();
  await expect(page.locator('#tela')).toContainText('Senado da República');
});

/* Persona, pergunta 1.2 (PER-01 a PER-05): ranking em lista, sem mapa, e os 5 municípios mais votados. */
const SQ = '250002536851'; // EDUARDO SUPLICY, PT, Deputado Estadual SP (public/data/uf/sp.json)
const TSE = { sq: SQ, casa: 'estadual', uf: 'SP', nome: 'EDUARDO SUPLICY', partido: 'PT', cargo: 'Deputado Estadual', votos: 654627, pct: 2.806, situacao: 'Eleito por QP', pos: 2, candidaturas: 1346, vagas: 94, atualizado: '04/10/2026 22:58:07' };
const MUN = { atualizado: '2026-10-05', mun: { 3500105: [900, 10000], 3500204: [4000, 20000], 3500303: [3000, 6000], 3500402: [1500, 30000], 3500501: [2500, 5000], 3500550: [100, 1000] } };

test.describe('Persona · ranking em lista e municípios mais votados (PER-01 a PER-05)', () => {
  test('sem mapa, ranking com partido ao lado e sem barras, e 5 cartões em ordem decrescente', async ({ page }) => {
    await page.route('**/api/votos-mun**', (r) => r.fulfill({ json: MUN }));
    await abreGuia(page, '#/m/1/m1.persona', { dados: { tse: TSE } });
    await expect(page.getByText('Posição no ranking de votos')).toBeVisible();
    await expect(page.getByText('Onde estão os votos')).toHaveCount(0);
    await expect(page.locator('.rk-linha').first().locator('.chip')).toBeVisible();
    await expect(page.locator('.barra-p')).toHaveCount(0);
    const cartoes = page.locator('.mv5-cartao');
    await expect(cartoes).toHaveCount(5);
    await expect(cartoes.first()).toContainText('1º');
    await expect(cartoes.first()).toContainText('4.000 votos');
    await expect(cartoes.first()).toContainText('20');
    await expect(cartoes.first()).toContainText('dos votos válidos');
    await expect(cartoes.nth(4)).toContainText('900 votos');
  });

  test('com a consulta falhando mostra a mensagem e mantém o ranking', async ({ page }) => {
    await page.route('**/api/votos-mun**', (r) => r.fulfill({ status: 500, json: { erro: 'x' } }));
    await abreGuia(page, '#/m/1/m1.persona', { dados: { tse: TSE } });
    await expect(page.getByText('Não foi possível carregar os municípios mais votados agora.')).toBeVisible();
    await expect(page.locator('.mv5-cartao')).toHaveCount(0);
    await expect(page.getByText('Posição no ranking de votos')).toBeVisible();
  });

  test('sem candidatura 2026 não há cartões nem consulta', async ({ page }) => {
    let consultas = 0;
    await page.route('**/api/votos-mun**', (r) => { consultas++; return r.fulfill({ json: MUN }); });
    await abreGuia(page, '#/m/1/m1.persona');
    await expect(page.getByText(TEXTO)).toBeVisible();
    await expect(page.locator('.mv5')).toHaveCount(0);
    expect(consultas).toBe(0);
  });
});
