import { test, expect, type Page } from '@playwright/test';
import { abre, dadoDe } from './semente-rumo';

/* Missão 5 · novos planejamentos (M5-30, M5-31). */
type M = { id: string; pred?: string; texto?: string; status?: string; sucessos?: unknown[] };
type P = { n: number; legado: string; objetivos: { pid: string }[]; metas: M[] };
const metasDe = async (page: Page) => (await dadoDe(page, 'metas')) as M[];
const planosDe = async (page: Page) => ((await dadoDe(page, 'planos')) ?? []) as P[];

const PLANO = {
  campos: { 'm3.legado': 'A Educação no centro do debate', 'm3.obj.p1': 'Priorizar a educação', 'm3.obj.p2': 'Pautar o fim do trabalho infantil' },
  D: {
    preditores: ['p1', 'p2'],
    metas: [
      { id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos de lei', status: 'concluida', sucessos: [{ id: 's1', mes: 1, texto: 'Protocolar o texto', status: 'concluida' }] },
      { id: 'b', pred: 'p1', texto: 'Visitar 10 escolas', status: 'concluida70' },
      { id: 'c', pred: 'p2', texto: 'Lançar a campanha', status: 'nao_concluida' },
    ],
  },
};
const botao = (page: Page) => page.getByRole('button', { name: 'Criar novo planejamento' });
const painel = (page: Page) => page.getByRole('group', { name: 'Criar novo planejamento' });

test.describe('Botão e confirmação de novo planejamento (M5-30)', () => {
  test('o botão pede confirmação e lista as metas para copiar (M5-30.3)', async ({ page }) => {
    await abre(page, ['rumo-novociclo'], PLANO);
    await expect(painel(page)).toHaveCount(0);
    await botao(page).click();
    await expect(painel(page)).toContainText('Isso guarda o planejamento atual');
    await expect(painel(page).getByRole('checkbox')).toHaveCount(3);
    await expect(painel(page)).toContainText('Aprovar 2 projetos de lei');
    expect(await planosDe(page)).toEqual([]); // abrir o painel ainda não altera nada
  });

  test('confirmar cria o novo planejamento só com as metas escolhidas, sem sucessos, e guarda o anterior (M5-30.4)', async ({ page }) => {
    await abre(page, ['rumo-novociclo'], PLANO);
    await botao(page).click();
    await painel(page).getByRole('button', { name: 'Desmarcar todas' }).click();
    await painel(page).getByRole('checkbox', { name: /Visitar 10 escolas/ }).check();
    await painel(page).getByRole('checkbox', { name: /Aprovar 2 projetos/ }).check();
    await page.getByRole('button', { name: 'Confirmar e criar novo planejamento' }).click();
    await expect(page.locator('.rm-novociclo [role="status"]')).toContainText('Planejamento 1 guardado');
    const novas = await metasDe(page);
    expect(novas.map((m) => m.id)).toEqual(['a', 'b']);
    expect(novas.every((m) => m.status === 'nao_concluida')).toBe(true);
    expect(novas[0].sucessos).toEqual([{ id: 's1', mes: 1, texto: 'Protocolar o texto', status: 'nao_concluida' }]);
    const [p1] = await planosDe(page);
    expect(p1.n).toBe(1);
    expect(p1.legado).toBe('A Educação no centro do debate');
    expect(p1.metas).toEqual(PLANO.D.metas);
    expect(await dadoDe(page, 'preditores')).toEqual(['p1', 'p2']);
  });

  test('cancelar fecha o painel e não altera nada', async ({ page }) => {
    await abre(page, ['rumo-novociclo'], PLANO);
    await botao(page).click();
    await painel(page).getByRole('checkbox').first().check();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(painel(page)).toHaveCount(0);
    expect(await metasDe(page)).toEqual(PLANO.D.metas);
    expect(await planosDe(page)).toEqual([]);
  });

  test('sem metas o painel avisa e confirmar cria um plano vazio sem erro', async ({ page }) => {
    await abre(page, ['rumo-novociclo'], { campos: PLANO.campos, D: { preditores: ['p1'], metas: [] } });
    await botao(page).click();
    await expect(painel(page)).toContainText('ainda não tem metas');
    await page.getByRole('button', { name: 'Confirmar e criar novo planejamento' }).click();
    expect(await metasDe(page)).toEqual([]);
    expect((await planosDe(page)).length).toBe(1);
  });
});

/* ---------- seletor e leitura dos arquivados (M5-31.5, M5-31.6) ---------- */
const seletor = (page: Page) => page.locator('.rm-ciclo select');
const ARQ = (n: number, metas: M[], legado = 'A Educação no centro do debate') => ({
  n, criadoEm: '2026-05-01T10:00:00.000Z', legado, bandeiras: [],
  objetivos: [{ pid: 'p1', nome: 'Priorizar a agenda', pergunta: '', texto: 'Priorizar a educação' }], metas,
});

test.describe('Seletor de planejamentos e leitura dos arquivados (M5-31)', () => {
  test('com um só planejamento não aparece seletor', async ({ page }) => {
    await abre(page, ['plano'], PLANO);
    await expect(seletor(page)).toHaveCount(0);
  });

  test('com mais de um planejamento o seletor lista 1, 2… e marca o atual (M5-31.5)', async ({ page }) => {
    await abre(page, ['plano'], { campos: PLANO.campos, D: { preditores: ['p1'], metas: [{ id: 'n', pred: 'p1', texto: 'Meta nova', status: 'nao_concluida' }], planos: [ARQ(1, PLANO.D.metas.slice(0, 2)), ARQ(2, [])] } });
    await expect(seletor(page).locator('option')).toHaveText(['Planejamento 1', 'Planejamento 2', 'Planejamento 3 (atual)']);
    await expect(seletor(page)).toHaveValue('3');
    await expect(page.getByText('Meta nova')).toBeVisible();
  });

  test('o arquivado abre sem campos editáveis e mostra o atingimento congelado (M5-31.6)', async ({ page }) => {
    await abre(page, ['plano'], { campos: PLANO.campos, D: { preditores: ['p1'], metas: [{ id: 'n', pred: 'p1', texto: 'Meta nova', status: 'nao_concluida' }], planos: [ARQ(1, PLANO.D.metas.slice(0, 2))] } });
    await seletor(page).selectOption('1');
    await expect(page.getByText('somente leitura')).toBeVisible();
    await expect(page.getByText('Aprovar 2 projetos de lei')).toBeVisible();
    await expect(page.getByText('Meta nova')).toHaveCount(0);
    await expect(page.locator('.rm-plano select:not(.rm-ciclo select), .rm-st-sel')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Editar a meta|Acrescentar meta/ })).toHaveCount(0);
    await expect(page.locator('.rm-anel b')).toHaveText('85%'); // (100 + 70) / 2
  });

  test('ver o arquivado não altera o ativo nem o arquivado; voltar ao atual reabre a edição (M5-31.6)', async ({ page }) => {
    const D = { preditores: ['p1'], metas: [{ id: 'n', pred: 'p1', texto: 'Meta nova', status: 'nao_concluida' }], planos: [ARQ(1, PLANO.D.metas.slice(0, 2))] };
    await abre(page, ['plano'], { campos: PLANO.campos, D });
    await seletor(page).selectOption('1');
    expect(await metasDe(page)).toEqual(D.metas);
    expect(await planosDe(page)).toEqual(D.planos);
    await seletor(page).selectOption('2');
    await expect(page.getByLabel('Status da meta 01')).toBeVisible();
  });

  test('arquivado sem metas mostra o estado vazio sem erro', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await abre(page, ['plano'], { campos: PLANO.campos, D: { preditores: ['p1'], metas: [], planos: [ARQ(1, [])] } });
    await seletor(page).selectOption('1');
    await expect(page.getByText('Este planejamento não tinha metas')).toBeVisible();
    expect(erros).toEqual([]);
  });
});

/* ---------- fluxo de ponta a ponta (M5-30, M5-31.7) ---------- */
test('criar o 2º e o 3º planejamento deixa os anteriores idênticos e somente leitura (M5-31.7)', async ({ page }) => {
  await abre(page, ['plano', 'rumo-novociclo'], PLANO);
  const cria = async (copiar: RegExp[]) => {
    await botao(page).click();
    await painel(page).getByRole('button', { name: 'Desmarcar todas' }).click();
    for (const nome of copiar) await painel(page).getByRole('checkbox', { name: nome }).check();
    await page.getByRole('button', { name: 'Confirmar e criar novo planejamento' }).click();
    await expect(painel(page)).toHaveCount(0);
  };

  await cria([/Aprovar 2 projetos/, /Visitar 10 escolas/]);                       // guarda o 1º, abre o 2º
  const p1 = (await planosDe(page))[0];
  expect(p1.metas).toEqual(PLANO.D.metas);
  await page.getByLabel('Status da meta 02').selectOption('concluida');            // mexe no 2º (ativo)
  await cria([/Visitar 10 escolas/]);                                              // guarda o 2º, abre o 3º
  const planos = await planosDe(page);
  expect(planos.map((p) => p.n)).toEqual([1, 2]);
  expect(planos[0]).toEqual(p1);                                                   // o 1º não mudou
  expect(planos[1].metas.map((m) => [m.id, m.status])).toEqual([['a', 'nao_concluida'], ['b', 'concluida']]);

  await expect(seletor(page).locator('option')).toHaveText(['Planejamento 1', 'Planejamento 2', 'Planejamento 3 (atual)']);
  expect((await metasDe(page)).map((m) => m.id)).toEqual(['b']);                  // o 3º tem só a meta copiada

  for (const n of ['1', '2']) {                                                    // os dois anteriores abrem só para leitura
    await seletor(page).selectOption(n);
    await expect(page.getByText(`Planejamento ${n} guardado: somente leitura`)).toBeVisible();
    await expect(page.locator('.rm-st-sel')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Editar a meta|Acrescentar meta/ })).toHaveCount(0);
  }
  await seletor(page).selectOption('1');
  await expect(page.locator('.rm-anel b')).toHaveText('43%');                      // atingimento congelado do 1º: p1 = (100 + 70) / 2 = 85, p2 = 0, total = 42,5
  expect(await planosDe(page)).toEqual(planos);                                    // ver não altera nada
  expect((await metasDe(page)).map((m) => m.id)).toEqual(['b']);
});

/* ---------- montar o planejamento na própria aba, sem voltar à Missão 3 ---------- */
test('no planejamento vazio dá para escrever Legado, escolher preditor e objetivo, criar meta e sucesso sem ir à Missão 3', async ({ page }) => {
  await abre(page, ['plano'], { campos: {}, D: { preditores: [], metas: [] } });
  await expect(page.getByRole('link', { name: 'Ir para a Missão 3' })).toHaveCount(0);
  await page.getByLabel('Legado (a manchete dos 4 anos)').fill('Mandato da educação');
  await page.getByRole('checkbox', { name: /^[^ ]/ }).first().check();
  const obj = page.getByLabel(/Objetivo específico de/).first();
  await obj.fill('Ampliar a creche');
  await expect.poll(async () => (await dadoDe(page, 'preditores') as string[]).length).toBe(1);
  await page.getByRole('button', { name: /Acrescentar meta a/ }).click();
  await page.getByRole('button', { name: /Adicionar sucesso/ }).click();
  const metas = (await dadoDe(page, 'metas')) as M[];
  expect(metas).toHaveLength(1);
  expect(metas[0].sucessos).toHaveLength(1);
  await expect(page.locator('.rm-no-legado')).toContainText('Mandato da educação');
});
