import { test, expect, type Page } from '@playwright/test';
import { chamadas, mandato, moca, naoMapeadas, semeiaSessao, vazou, type EstadoMoca } from './admin-api';

/* Analytics com o registro de uso ativo (ADM-15). Supabase todo interceptado (admin-api.ts).
   A fixture de uso é pequena e calculada à mão: os números esperados vêm dos comentários, não de função do app. */

// Dia de Brasília (YYYY-MM-DD) de n dias atrás. O Brasil não tem horário de verão hoje, então n x 24 h é n dias de calendário.
const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
const dia = (n: number) => fmt.format(new Date(Date.now() - n * 86400000));
const ddmm = (n: number) => { const d = dia(n); return `${d.slice(8, 10)}/${d.slice(5, 7)}`; };
const diasAtras = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

const MANDATOS = [
  mandato({ id: 'a1', uf: 'SP', criado_em: diasAtras(90), ultima_atividade: diasAtras(3) }),
  mandato({ id: 'a2', uf: 'SP', criado_em: diasAtras(90), ultima_atividade: diasAtras(20) }),
  mandato({ id: 'a3', uf: 'RJ', criado_em: diasAtras(60), ultima_atividade: diasAtras(40) }),
  mandato({ id: 'a5', uf: 'MG', criado_em: diasAtras(10), ultima_atividade: diasAtras(0) }),
];
const campo = (id: string, uf: string, on: string[]) => ({
  mandato_id: id, uf, persona: on.includes('persona'), conjuntura: on.includes('conjuntura'), municipio: on.includes('municipio'),
  eleitorado: on.includes('eleitorado'), social: on.includes('social'), cadeiras: on.includes('cadeiras'),
});
// persona: a1, a2, a5 (3); conjuntura: a1, a3, a5 (3); município: a3, a5 (2); eleitorado: a5 (1); social: a5 (1); cadeiras: a1, a5 (2)
const CAMPOS = [
  campo('a1', 'SP', ['persona', 'conjuntura', 'cadeiras']), campo('a2', 'SP', ['persona']), campo('a3', 'RJ', ['conjuntura', 'municipio']),
  campo('a5', 'MG', ['persona', 'conjuntura', 'municipio', 'eleitorado', 'social', 'cadeiras']),
];

const linha = (n: number, mandato_id: string, uf: string, funcionalidade: string, qtd: number) => ({ dia: dia(n), mandato_id, uf, funcionalidade, qtd });
/* Linhas de v_admin_uso (n = dias atrás; semana 0 = 0 a 6 dias, semana 1 = 7 a 13, semana 2 = 14 a 20...):
   0 dias   a1 SP persona 2          | 8 dias   a5 MG organograma 2
   3 dias   a1 SP persona 1          | 10 dias  a2 SP persona 4
   1 dia    a1 SP organograma 5      | 13 dias  a3 RJ conjuntura 1
   14 dias  a1 SP persona 7 (fora do gráfico de 14 dias) | 20 dias a3 RJ persona 3
   40 dias  a5 MG social 6 (só no período de 45 dias) */
const USO = [
  linha(0, 'a1', 'SP', 'persona', 2), linha(3, 'a1', 'SP', 'persona', 1), linha(10, 'a2', 'SP', 'persona', 4),
  linha(14, 'a1', 'SP', 'persona', 7), linha(20, 'a3', 'RJ', 'persona', 3),
  linha(1, 'a1', 'SP', 'organograma', 5), linha(8, 'a5', 'MG', 'organograma', 2),
  linha(13, 'a3', 'RJ', 'conjuntura', 1), linha(40, 'a5', 'MG', 'social', 6),
];

const estado = (uso: unknown[]): EstadoMoca => ({
  views: { v_admin_mandatos: MANDATOS, v_admin_exercicios: [], v_admin_eventos_mes: [], v_admin_uso_campos: CAMPOS, v_admin_uso: uso, exercicios_guia: [] },
});

async function abre(page: Page, uso: unknown[] = USO) {
  await semeiaSessao(page, 'admin');
  await moca(page, estado(uso));
  await page.goto('/admin/analytics');
  await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
  await expect(page.locator('.kpis')).toBeVisible();
}

const grafico = (page: Page, titulo: string) => page.getByRole('group', { name: titulo });
const tabela = (page: Page) => page.locator('.card', { has: page.getByRole('heading', { name: 'Uso por funcionalidade' }) });
const linhasTexto = (loc: ReturnType<Page['locator']>) => loc.locator('tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent?.trim())));

test.afterEach(() => {
  expect(naoMapeadas()).toEqual([]);
  expect(vazou()).toEqual([]);
});

test('com registro de uso, Aberturas e Tendência batem com a conta feita à mão (período padrão: 30 dias) (ADM-15.7)', async ({ page }) => {
  await abre(page);
  const t = tabela(page);
  await expect(t.getByRole('columnheader')).toHaveText(['Funcionalidade', 'Mandatos que usaram', 'Aberturas (30d)', 'Tendência']);
  // persona 30d: 2+1+4+7+3 = 17; tendência (da semana mais antiga para a atual): sem 2 = 7+3 = 10, sem 1 = 4, sem 0 = 2+1 = 3
  // organograma 30d: 5+2 = 7 (mandatos a1 e a5 = 2); tendência: sem 1 = 2, sem 0 = 5; conjuntura: 1 (sem 1); social 40 dias atrás: fora de 30d e das 5 semanas
  expect(await linhasTexto(t)).toEqual([
    ['Persona', '3', '17', '0 0 10 4 3'], ['Conjuntura', '3', '1', '0 0 0 1 0'], ['Município', '2', '0', '0 0 0 0 0'],
    ['Eleitorado', '1', '0', '0 0 0 0 0'], ['Social', '1', '0', '0 0 0 0 0'], ['Cadeiras e escalação', '2', '0', '0 0 0 0 0'],
    ['Organograma e rotinas', '2', '7', '0 0 0 2 5'],
  ]);
});

test('a consulta de uso limita as linhas pelo dia (45 dias) e pagina com ordem estável (ADM-15.7)', async ({ page }) => {
  await abre(page);
  const pedido = chamadas().find((c) => c.caminho.startsWith('v_admin_uso?'))!;
  expect(pedido.caminho).toContain(`dia=gte.${dia(45)}`);
  expect(pedido.caminho).toContain('order=dia,mandato_id,funcionalidade');
  expect(pedido.caminho).toMatch(/limit=\d+&offset=0/);
});

test('trocar o período troca as aberturas, não a tendência nem os mandatos (ADM-15.7, ADM-10.2)', async ({ page }) => {
  await abre(page);
  const t = tabela(page);
  const col = async (i: number) => (await linhasTexto(t)).map((l) => l[i]);
  // 7 dias: persona 2+1 = 3; conjuntura (13 dias atrás) 0; organograma 5 (8 dias atrás não entra)
  await page.getByLabel('Período').selectOption('7');
  await expect(t.getByRole('columnheader', { name: 'Aberturas (7d)' })).toBeVisible();
  expect(await col(2)).toEqual(['3', '0', '0', '0', '0', '0', '5']);
  // 15 dias: persona 2+1+4+7 = 14 (14 dias atrás entra; 20 não); conjuntura 1; organograma 7
  await page.getByLabel('Período').selectOption('15');
  expect(await col(2)).toEqual(['14', '1', '0', '0', '0', '0', '7']);
  // 45 dias: persona 17; social 6 (40 dias atrás)
  await page.getByLabel('Período').selectOption('45');
  expect(await col(2)).toEqual(['17', '1', '0', '0', '6', '0', '7']);
  expect(await col(3)).toEqual(['0 0 10 4 3', '0 0 0 1 0', '0 0 0 0 0', '0 0 0 0 0', '0 0 0 0 0', '0 0 0 0 0', '0 0 0 2 5']);
  expect(await col(1)).toEqual(['3', '3', '2', '1', '1', '2', '2']);
});

test('o gráfico "Uso das funcionalidades por dia" mostra 14 dias, do mais antigo para hoje (ADM-15.7)', async ({ page }) => {
  await abre(page);
  const g = grafico(page, 'Uso das funcionalidades por dia');
  await expect(g.getByText('Sem registro de uso ainda')).toHaveCount(0);
  const colunas = g.locator('.cl');
  await expect(colunas).toHaveCount(14);
  const rotulos = await colunas.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  // totais por dia: hoje 2; 1 dia 5; 3 dias 1; 8 dias 2; 10 dias 4; 13 dias 1; os demais 0.
  // Ficam de fora os de 14 dias (7), 20 dias (3) e 40 dias (6).
  const total: Record<number, number> = { 0: 2, 1: 5, 3: 1, 8: 2, 10: 4, 13: 1 };
  const esperado = Array.from({ length: 14 }, (_, k) => { const n = 13 - k; return `${ddmm(n)}: Aberturas ${total[n] ?? 0}`; });
  expect(rotulos).toEqual(esperado);
  expect(esperado.reduce((s, r) => s + Number(r.split(' ').pop()), 0)).toBe(15);
});

test('o filtro de UF vale para aberturas, tendência e gráfico (ADM-15.7, ADM-09.3)', async ({ page }) => {
  await abre(page);
  await page.getByLabel('UF').selectOption('RJ');
  // RJ: persona 3 (20 dias atrás, semana 2); conjuntura 1 (semana 1); organograma nenhuma (0 mandatos)
  expect(await linhasTexto(tabela(page))).toEqual([
    ['Persona', '0', '3', '0 0 3 0 0'], ['Conjuntura', '1', '1', '0 0 0 1 0'], ['Município', '1', '0', '0 0 0 0 0'],
    ['Eleitorado', '0', '0', '0 0 0 0 0'], ['Social', '0', '0', '0 0 0 0 0'], ['Cadeiras e escalação', '0', '0', '0 0 0 0 0'],
    ['Organograma e rotinas', '0', '0', '0 0 0 0 0'],
  ]);
  const g = grafico(page, 'Uso das funcionalidades por dia');
  await expect(g.locator('.cl')).toHaveCount(14);
  await expect(g.locator(`.cl[aria-label="${ddmm(13)}: Aberturas 1"]`)).toHaveCount(1);
});

test('sem registro de uso (view vazia) mantém "—" e "Sem registro de uso ainda" (ADM-12.12)', async ({ page }) => {
  await abre(page, []);
  expect(await linhasTexto(tabela(page))).toEqual([
    ['Persona', '3', '—', '—'], ['Conjuntura', '3', '—', '—'], ['Município', '2', '—', '—'],
    ['Eleitorado', '1', '—', '—'], ['Social', '1', '—', '—'], ['Cadeiras e escalação', '2', '—', '—'],
  ]);
  await expect(grafico(page, 'Uso das funcionalidades por dia').getByText('Sem registro de uso ainda')).toBeVisible();
});

test('view de uso ainda inexistente no banco (migration 4 não aplicada): a tela abre igual, com "—" (ADM-12.12)', async ({ page }) => {
  await semeiaSessao(page, 'admin');
  await moca(page, estado([]));
  // rota registrada depois tem prioridade: simula o PostgREST sem a view
  await page.route((u) => u.pathname.endsWith('/rest/v1/v_admin_uso'), (rota) =>
    rota.fulfill({ status: 404, headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'relation does not exist' }) }));
  await page.goto('/admin/analytics');
  await expect(page.locator('.kpis')).toBeVisible();
  await expect(page.locator('.aviso[role="alert"]')).toHaveCount(0);
  expect((await linhasTexto(tabela(page)))[0]).toEqual(['Persona', '3', '—', '—']);
  await expect(grafico(page, 'Uso das funcionalidades por dia').getByText('Sem registro de uso ainda')).toBeVisible();
});
