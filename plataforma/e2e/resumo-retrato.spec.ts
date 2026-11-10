import { test, expect, type Page } from '@playwright/test';
import { abreGuia, MANDATO_REAL } from './guia-real';

/* Retrato do mandato no cabeçalho do Resumo (RES-06): cartão da parlamentar e os números que têm fonte.
   As fotos do TSE nunca saem da máquina: a rota é atendida com uma imagem local ou abortada. Os números de cadeiras e
   filiados vêm dos arquivos reais de public/data (SP: PT com 16 cadeiras na Assembleia e 374.990 filiados). */
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const MANDATO = { ...MANDATO_REAL, partido: 'PT', casa: 'Assembleia Legislativa de São Paulo' };
const TSE = { sq: '250001234567', uf: 'SP', cargo: 'Deputado Estadual', nome: 'ANA SOUZA', partido: 'PT', votos: 97335, pos: 57 };
/* tabela de equipe nova: Chefia e Ana com nome, uma vaga com "*" e uma linha sem pessoa */
const EQUIPE = { 'm2.on': '0|1|2|3', 'm2.n': '4', 'm2.f1': 'Paulo Ribeiro', 'm2.f2': 'Ana Furtado', 'm2.f3': '*', 'm2.f4': '' };

async function abre(page: Page, o: { tse?: Record<string, unknown>; campos?: Record<string, string>; mandato?: Record<string, string>; foto?: 'ok' | 'bloqueada' } = {}) {
  await page.route('**/resultados.tse.jus.br/**', (r) => (o.foto === 'ok' ? r.fulfill({ status: 200, contentType: 'image/png', body: PNG }) : r.abort()));
  await abreGuia(page, '#/resumo', { dados: { campos: o.campos ?? {}, ...(o.tse ? { tse: o.tse } : {}) }, mandato: o.mandato ?? MANDATO });
  await expect(page.locator('#tela .retrato .parl')).toBeVisible();
}
const stat = (page: Page, id: string) => page.locator(`#tela .stat[data-num="${id}"]`);

test('com D.tse completo o cartão mostra nome, "cargo · UF" e partido, e o 1º número é a votação em pt-BR com a posição (RES-06.1, RES-06.4)', async ({ page }) => {
  await abre(page, { tse: TSE });
  const parl = page.locator('#tela .parl');
  await expect(parl.locator('strong')).toHaveText('Ana Souza');
  await expect(parl).toContainText('Deputado(a) Estadual · SP');
  await expect(parl).toContainText('PT');
  const primeiro = page.locator('#tela .stat').first();
  await expect(primeiro.locator('b')).toHaveText('97.335');
  await expect(primeiro.locator('span')).toHaveText('Votos válidos');
  await expect(primeiro.locator('em')).toHaveText('57º mais votado(a) · SP · TSE');
});

test('com D.tse.sq a foto vem da URL do TSE (RES-06.2)', async ({ page }) => {
  await abre(page, { tse: TSE, foto: 'ok' });
  const img = page.locator('#tela .parl .foto img');
  await expect(img).toBeVisible();
  await expect(img).toHaveAttribute('src', 'https://resultados.tse.jus.br/oficial/ele2026/6259/fotos/sp/250001234567.jpeg');
  await expect(img).toHaveAttribute('alt', 'Foto de Ana Souza');
});

test('foto bloqueada ou sem sq: o cartão mostra a inicial do nome (RES-06.3)', async ({ page }) => {
  await abre(page, { tse: TSE, foto: 'bloqueada' });
  await expect(page.locator('#tela .parl .foto img')).toHaveCount(0);
  await expect(page.locator('#tela .parl .foto')).toHaveText('A');
  const outra = await page.context().newPage(); // nova aba: o Guia é semeado de novo
  await abre(outra, { tse: { votos: 10 }, mandato: { ...MANDATO, nome_parlamentar: 'Ângela Dias' } });
  await expect(outra.locator('#tela .parl .foto img')).toHaveCount(0);
  await expect(outra.locator('#tela .parl .foto')).toHaveText('Â');
});

test('cadeiras do partido na Casa e filiados na UF aparecem com os rótulos da spec (RES-06.5, RES-06.6)', async ({ page }) => {
  await abre(page, { tse: TSE });
  await expect(stat(page, 'cadeiras').locator('b')).toHaveText('16');
  await expect(stat(page, 'cadeiras').locator('span')).toHaveText('Cadeiras do PT na Assembleia Legislativa de São Paulo');
  await expect(stat(page, 'filiados').locator('b')).toHaveText('374 mil+');
  await expect(stat(page, 'filiados').locator('span')).toHaveText('Filiados do PT em SP');
  await expect(page.locator('#tela .stat')).toHaveCount(3);
});

test('sem partido, cadeiras e filiados somem e a votação fica (RES-06.8)', async ({ page }) => {
  await abre(page, { tse: { ...TSE, partido: '' }, mandato: { ...MANDATO, partido: '' } });
  await expect(stat(page, 'votos')).toBeVisible();
  await expect(stat(page, 'cadeiras')).toHaveCount(0);
  await expect(stat(page, 'filiados')).toHaveCount(0);
});

test('"Cargos da equipe com nome" mostra X/Y e a legenda dos processos seletivos; sem tabela, o número some (RES-06.7)', async ({ page }) => {
  await abre(page, { tse: TSE, campos: EQUIPE });
  await expect(stat(page, 'equipe').locator('b')).toHaveText('2/4');
  await expect(stat(page, 'equipe').locator('span')).toHaveText('Cargos da equipe com nome');
  await expect(stat(page, 'equipe').locator('em')).toHaveText('1 processo seletivo a abrir');
  const outra = await page.context().newPage(); // nova aba: o Guia é semeado de novo
  await abre(outra, { tse: TSE });
  await expect(stat(outra, 'votos')).toBeVisible();
  await expect(stat(outra, 'equipe')).toHaveCount(0);
});

test('sem nenhuma fonte o cabeçalho mostra só o cartão, sem traço nem caixa vazia (RES-06.8)', async ({ page }) => {
  await abre(page, { mandato: { ...MANDATO, partido: '' } });
  await expect(page.locator('#tela .parl strong')).toHaveText('Ana Souza');
  await expect(page.locator('#tela .retrato .stat')).toHaveCount(0);
  await expect(page.locator('#tela .retrato-num')).toHaveCount(0);
  await expect(page.locator('#tela .retrato')).not.toContainText('—');
});

test('se a carga das cadeiras falha (500), o número some e a tela segue funcionando (RES-06.9)', async ({ page }) => {
  await page.route('**/data/uf/sp.json', (r) => r.fulfill({ status: 500, body: 'erro' }));
  await abre(page, { tse: TSE });
  await expect(stat(page, 'filiados')).toBeVisible();
  await expect(stat(page, 'votos')).toBeVisible();
  await expect(stat(page, 'cadeiras')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ir para a Missão 3: Defina o rumo' }).click();
  await expect(page.locator('#res-m3')).toHaveAttribute('open', '');
});

test('a 600 px o cartão fica acima dos números, em faixa horizontal (RES-06.10)', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 900 });
  await abre(page, { tse: TSE });
  await expect(stat(page, 'filiados')).toBeVisible();
  const caixa = (sel: string) => page.locator(sel).first().evaluate((e) => { const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width }; });
  const parl = await caixa('#tela .parl'), num = await caixa('#tela .stat'), foto = await caixa('#tela .parl .foto'), id = await caixa('#tela .parl .id');
  expect(parl.bottom).toBeLessThanOrEqual(num.top);
  expect(foto.right).toBeLessThanOrEqual(id.left);
  expect(Math.abs(foto.top - parl.top)).toBeLessThanOrEqual(1);
  expect(parl.width).toBeGreaterThan(400);
});

test('sem nome parlamentar o cartão mostra o nome civil e a inicial dele (RES-06.1)', async ({ page }) => {
  await abre(page, { mandato: { ...MANDATO, nome_parlamentar: '', nome_civil: 'Maria Oliveira' } });
  const parl = page.locator('#tela .parl');
  await expect(parl.locator('strong')).toHaveText('Maria Oliveira');
  await expect(parl.locator('.foto')).toContainText('M');
});
