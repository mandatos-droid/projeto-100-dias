import { test, expect, type Page } from '@playwright/test';
import { abreGuia, salvoDe, MANDATO_REAL } from './guia-real';

/* Qualidade do preenchimento · Grupo C: cada exercício das Missões 1 e 2 preenchido, a página recarregada,
   tudo ainda lá, e o Resumo do preenchimento refletindo a resposta (prévia, estado e a lista completa). */

type Dados = { campos?: Record<string, string>; frags?: { t?: string; mp?: string }[]; feitos?: Record<string, unknown> };
const dados = async (page: Page) => ((await salvoDe(page)).dados ?? {}) as Dados;
const campos = async (page: Page) => (await dados(page)).campos ?? {};

/** Escreve num campo do Guia (editor rico ou textarea comum) e espera chegar ao que seria salvo. */
async function escreve(page: Page, k: string, texto: string) {
  const rico = page.locator(`.campo:has(textarea[data-k="${k}"]) .rico-area`);
  if (await rico.count()) {
    await rico.first().click();
    await page.keyboard.type(texto);
  } else {
    await page.locator(`textarea[data-k="${k}"], input[data-k="${k}"]`).first().fill(texto);
  }
  await expect.poll(async () => (await campos(page))[k] ?? '').toContain(texto);
}

/** Recarrega a página e espera o Guia montar (o que ficou no localStorage é o que sobrou da gravação). */
async function recarrega(page: Page) {
  await page.reload();
  await page.locator('#ladoNav .it').first().waitFor();
}

/** Abre o Resumo e devolve o bloco do exercício (já aberto, para ler a lista completa). */
async function noResumo(page: Page, missao: number, titulo: string) {
  await page.goto('/guia#/resumo');
  await page.locator(`#res-m${missao}`).waitFor();
  const m = page.locator(`#res-m${missao}`);
  if (!(await m.evaluate((d) => (d as HTMLDetailsElement).open))) await m.locator('summary').first().click();
  const ex = m.locator('details.ex', { has: page.locator('.ex-link', { hasText: titulo }) });
  if (!(await ex.evaluate((d) => (d as HTMLDetailsElement).open))) await ex.locator('summary').click();
  return ex;
}

const FRASE = (k: string) => `Resposta de teste para ${k} com acentuação: ação, coração.`;

/** Passa em cada exercício: escreve, confere o salvo, recarrega, confere na tela e no Resumo. */
async function preencheEConfere(page: Page, hash: string, missao: number, titulo: string, ks: string[]) {
  await abreGuia(page, hash);
  for (const k of ks) await escreve(page, k, FRASE(k));
  await recarrega(page);
  for (const k of ks) {
    expect((await campos(page))[k]).toContain(FRASE(k));
    await expect(page.locator(`.campo:has([data-k="${k}"])`).first()).toContainText(FRASE(k));
  }
  const ex = await noResumo(page, missao, titulo);
  for (const k of ks) await expect(ex).toContainText(FRASE(k));
  await expect(ex.locator('.ex-p')).toContainText(FRASE(ks[0]).slice(0, 40));
  await expect(ex).not.toHaveAttribute('data-estado', 'nao');
}

test.describe('Missão 1 · perguntas gravam, sobrevivem ao recarregar e aparecem no Resumo', () => {
  test('Persona · quem é a liderança (m1.q1)', async ({ page }) => {
    await preencheEConfere(page, '#/m/1/m1.persona', 1, 'A persona', ['m1.q1']);
  });

  test('Persona · desempenho eleitoral (m1.q2)', async ({ page }) => {
    await preencheEConfere(page, '#/m/1/m1.persona', 1, 'A persona', ['m1.q2']);
  });

  test('Persona · 3 conquistas e o próximo cargo (m1.q3c1..3, m1.q3b)', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.persona');
    for (const k of ['m1.q3c1', 'm1.q3c2', 'm1.q3c3']) await escreve(page, k, FRASE(k));
    await page.locator('select[data-k="m1.q3b"]').selectOption('Senador(a)');
    await expect.poll(async () => (await campos(page))['m1.q3b']).toBe('Senador(a)');
    await recarrega(page);
    for (const k of ['m1.q3c1', 'm1.q3c2', 'm1.q3c3']) expect((await campos(page))[k]).toContain(FRASE(k));
    await expect(page.locator('select[data-k="m1.q3b"]')).toHaveValue('Senador(a)');
    const ex = await noResumo(page, 1, 'A persona');
    for (const k of ['m1.q3c1', 'm1.q3c2', 'm1.q3c3']) await expect(ex).toContainText(FRASE(k));
    await expect(ex).toContainText('Senador(a)');
  });

  for (const [k, i] of [['m1.q4c', 'Conjuntura · estratégias para novas pessoas aliadas'], ['m1.q5', 'Conjuntura · reação aos dados do partido']]) {
    test(`${i} (${k})`, async ({ page }) => {
      await preencheEConfere(page, '#/m/1/m1.conjuntura', 1, 'A conjuntura', [k]);
    });
  }

  for (const [k, i] of [['m1.q8a', 'Oportunidades · análise da conjuntura social']]) {
    test(`${i} (${k})`, async ({ page }) => {
      await preencheEConfere(page, '#/m/1/m1.oportunidades', 1, 'As oportunidades e ameaças', [k]);
    });
  }

  test('Oportunidades · expectativas do eleitorado (m1.q7): promessa e grupos gravam, sobrevivem e vão ao Resumo', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.oportunidades');
    const coluna = (t: string) => page.locator(`section.el-col[aria-label="${t}"]`);
    const adiciona = async (t: string, form: string, texto: string) => {
      await coluna(t).getByRole('button', { name: new RegExp(`formulário: ${t}`) }).click();
      await coluna(t).locator('input[type="text"]').fill(texto);
      await coluna(t).getByRole('button', { name: 'Adicionar' }).click();
      await expect(coluna(t)).toContainText(texto);
    };
    await adiciona('Promessas de Campanha', 'promessa', 'Ampliar o transporte escolar rural');
    await adiciona('Grupos que Apoiaram', 'apoio', 'Professoras da rede municipal');
    await adiciona('Grupos com Potencial', 'potencial', 'Jovens de 16 a 24 anos');
    const itens = async () => (((await salvoDe(page)).dados ?? {}) as { eleitorado?: { itens: { tipo: string; texto: string }[] } }).eleitorado?.itens ?? [];
    await expect.poll(async () => (await itens()).length).toBe(3);
    await recarrega(page);
    expect((await itens()).map((i) => i.tipo).sort()).toEqual(['apoio', 'potencial', 'promessa']);
    await expect(coluna('Promessas de Campanha')).toContainText('Ampliar o transporte escolar rural');
    await expect(coluna('Grupos com Potencial')).toContainText('Jovens de 16 a 24 anos');
    const ex = await noResumo(page, 1, 'As oportunidades e ameaças');
    await expect(ex).toContainText('Ampliar o transporte escolar rural');
    await expect(ex).toContainText('Professoras da rede municipal');
    await expect(ex).toContainText('Jovens de 16 a 24 anos');
    await expect(ex).not.toHaveAttribute('data-estado', 'nao');
  });

  test('Oportunidades · agendas prioritárias (m1.q9): escolhas sobrevivem ao recarregar e vão ao Resumo', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.oportunidades');
    const bts = page.locator('.np-prio-bt');
    const nomes: string[] = [];
    for (const i of [0, 2]) {
      nomes.push(((await bts.nth(i).locator('span').first().textContent()) ?? '').trim());
      await bts.nth(i).click();
    }
    const prio = async () => (((await salvoDe(page)).dados ?? {}) as { agendasPrio?: string[] }).agendasPrio ?? [];
    await expect.poll(async () => (await prio()).length).toBe(2);
    await recarrega(page);
    expect((await prio()).length).toBe(2);
    await expect(page.locator('.np-prio-bt[aria-pressed="true"]')).toHaveCount(2);
    const ex = await noResumo(page, 1, 'As oportunidades e ameaças');
    for (const n of nomes) await expect(ex).toContainText(n);
  });

  test('Fragilidades · classificar como Gabinete e Parlamentar, acrescentar uma nova', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.frag');
    const itens = page.locator('.frag-i');
    await itens.nth(0).getByRole('button', { name: 'Gabinete' }).click();
    await itens.nth(1).getByRole('button', { name: 'Parlamentar' }).click();
    await page.locator('#fragNova').fill('Domínio do regimento interno');
    await page.getByRole('button', { name: 'Acrescentar' }).click();
    await page.locator('.frag-i').last().getByRole('button', { name: 'Gabinete' }).click();
    await expect.poll(async () => ((await dados(page)).frags ?? []).filter((f) => f.mp).length).toBe(3);
    const antes = (await dados(page)).frags ?? [];
    expect(antes.some((f) => f.t === 'Domínio do regimento interno')).toBe(true);
    await recarrega(page);
    const depois = (await dados(page)).frags ?? [];
    expect(depois.map((f) => f.mp ?? '')).toEqual(antes.map((f) => f.mp ?? ''));
    await expect(page.locator('.frag-i').nth(0).locator('[aria-pressed="true"], .on')).toHaveCount(1);
    const ex = await noResumo(page, 1, 'As fragilidades');
    await expect(ex).toContainText(antes[0].t!);
    await expect(ex).toContainText(antes[1].t!);
    await expect(ex).toContainText('Domínio do regimento interno');
    await expect(ex).not.toHaveAttribute('data-estado', 'nao');
  });

  test('Conjuntura · relações com parlamentares (m1.q4): classificações sobrevivem ao recarregar e vão ao Resumo', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const linhas = page.locator('[data-ilha="assentos"] table.tb tbody tr');
    await abreGuia(page, '#/m/1/m1.conjuntura', { mandato: { ...MANDATO_REAL, partido: 'PSOL' } });
    await expect.poll(() => linhas.count(), { timeout: 30_000 }).toBe(15);
    await linhas.nth(0).getByRole('button', { name: 'Aliado', exact: true }).click();
    await linhas.nth(1).getByRole('button', { name: 'Aliado', exact: true }).click();
    await linhas.nth(2).getByRole('button', { name: 'Oponente e concorrente', exact: true }).click();
    const rel = async () => Object.values(((await dados(page)) as { relacoes?: Record<string, { status: string }> }).relacoes ?? {}).map((r) => r.status).sort();
    await expect.poll(rel).toEqual(['aliado', 'aliado', 'oponente_concorrente']);
    await recarrega(page);
    expect(await rel()).toEqual(['aliado', 'aliado', 'oponente_concorrente']);
    await expect(page.getByTestId('classificados').locator('article')).toHaveCount(3, { timeout: 30_000 });
    await page.goto('/guia#/resumo');
    await expect(page.locator('#tela')).toContainText('Você tem 2 Aliados; 1 Oponente e concorrente', { timeout: 20_000 });
  });

  test('Conjuntura do partido (m1.q5): posição do Executivo no cartão do município sobrevive ao recarregar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const TSE = { sq: '250002536851', casa: 'estadual', uf: 'SP', nome: 'EDUARDO SUPLICY', partido: 'PSOL', cargo: 'Deputado Estadual', votos: 654627, situacao: 'Eleito por QP', vagas: 94 };
    const VOTOS = { atualizado: '2026-10-05', mun: { 3500105: [900, 10000], 3500204: [4000, 20000], 3500303: [3000, 6000], 3500402: [1500, 30000], 3500501: [2500, 5000] } };
    await page.route('**/api/votos-mun**', (r) => r.fulfill({ json: VOTOS }));
    await abreGuia(page, '#/m/1/m1.conjuntura', { mandato: { ...MANDATO_REAL, partido: 'PSOL' }, dados: { tse: TSE } });
    const cartoes = page.getByTestId('cartao-municipio');
    await expect(cartoes).toHaveCount(5, { timeout: 30_000 });
    await cartoes.first().getByRole('radio', { name: /^Oposição/ }).click();
    const extra = async () => Object.values(((await dados(page)) as { conj2?: { prefExtra?: Record<string, string> } }).conj2?.prefExtra ?? {});
    await expect.poll(extra).toContain('oposicao');
    await recarrega(page);
    expect(await extra()).toContain('oposicao');
    await expect(page.getByTestId('cartao-municipio').first().getByRole('radio', { name: /^Oposição/ })).toHaveAttribute('aria-checked', 'true', { timeout: 30_000 });
  });

  test('concluir cada exercício da Missão 1 sobrevive ao recarregar e vale no Resumo', async ({ page }) => {
    await abreGuia(page, '#/m/1/m1.persona');
    await escreve(page, 'm1.q1', FRASE('m1.q1'));
    await page.getByRole('button', { name: /Marcar como concluído/ }).first().click();
    await expect.poll(async () => Object.keys((await dados(page)).feitos ?? {})).toContain('m1.persona');
    await recarrega(page);
    expect(Object.keys((await dados(page)).feitos ?? {})).toContain('m1.persona');
    const ex = await noResumo(page, 1, 'A persona');
    await expect(ex).toHaveAttribute('data-estado', 'ok');
  });
});

/* ---------- Missão 2 ---------- */
const celula = (page: Page, rotulo: string, linha: number) => page.getByLabel(`${rotulo}, assessor/a ${linha}`);

test.describe('Missão 2 · equipe, organograma e rotinas gravam e aparecem no Resumo', () => {
  test('A equipe de sucesso: quantidade e linhas completas sobrevivem ao recarregar e vão ao Resumo', async ({ page }) => {
    await abreGuia(page, '#/m/2/m2.funcoes');
    await page.getByLabel('Registre aqui quantas pessoas o mandato irá contratar').fill('2');
    await page.getByRole('button', { name: /Criar tabela|Ajustar/ }).click();
    await celula(page, 'Escopo', 1).fill('Coordenar a equipe e a agenda');
    await celula(page, 'Competências comportamentais', 1).fill('Liderança e organização');
    await celula(page, 'Nome do cargo', 1).fill('Chefe de gabinete');
    await celula(page, 'Nome da pessoa', 1).fill('Maria Teste');
    await celula(page, 'Categoria', 1).selectOption('Chefia');
    await celula(page, 'Área', 1).selectOption('Chefia de área');
    await expect.poll(async () => (await campos(page))['m2.f1']).toBe('Maria Teste');
    await recarrega(page);
    const c = await campos(page);
    expect(c['m2.n']).toBe('2');
    expect(c['m2.p1.nome_cargo']).toBe('Chefe de gabinete');
    expect(c['m2.p1.esc']).toBe('Coordenar a equipe e a agenda');
    await page.goto('/guia#/m/2/m2.funcoes');
    await expect(celula(page, 'Nome da pessoa', 1)).toHaveValue('Maria Teste');
    await expect(celula(page, 'Nome do cargo', 1)).toHaveValue('Chefe de gabinete');
    const ex = await noResumo(page, 2, 'A equipe de sucesso');
    await expect(ex).toContainText('Maria Teste');
    await expect(ex).toContainText('Chefe de gabinete');
    await expect(ex).not.toHaveAttribute('data-estado', 'nao');
  });

  test('Organograma e rotinas: agendar as 5 rotinas e marcar o checklist, tudo no Resumo após recarregar', async ({ page }) => {
    await abreGuia(page, '#/m/2/m2.gestao');
    const datas = page.locator('input[type="date"]');
    const n = await datas.count();
    expect(n).toBeGreaterThanOrEqual(5);
    for (let i = 0; i < 5; i++) await datas.nth(i).fill(`2030-03-0${i + 1}`);
    for (const k of ['m2.c1', 'm2.c2', 'm2.c3']) await page.locator(`input[type="checkbox"][data-k="${k}"]`).check();
    await expect.poll(async () => (await campos(page))['m2.c3']).toBeTruthy();
    await expect.poll(async () => Object.keys(JSON.parse((await campos(page))['m2.rq'] ?? '{}')).length).toBe(5);
    await recarrega(page);
    const c = await campos(page);
    for (const k of ['m2.c1', 'm2.c2', 'm2.c3']) expect(c[k]).toBeTruthy();
    expect(JSON.parse(c['m2.rq'])['plan']).toMatchObject({ data: '2030-03-01' });
    for (const k of ['m2.c1', 'm2.c2', 'm2.c3']) await expect(page.locator(`input[type="checkbox"][data-k="${k}"]`)).toBeChecked();
    const ex = await noResumo(page, 2, 'Organograma e rotinas');
    await expect(ex).toContainText('Itens marcados (3 de 3)');
    await expect(ex).not.toHaveAttribute('data-estado', 'nao');
  });

  test('concluir a Missão 2 sobrevive ao recarregar e vale no Resumo', async ({ page }) => {
    await abreGuia(page, '#/m/2/m2.gestao');
    for (const k of ['m2.c1', 'm2.c2', 'm2.c3']) await page.locator(`input[type="checkbox"][data-k="${k}"]`).check();
    await page.getByRole('button', { name: /Marcar como concluído/ }).first().click();
    await expect.poll(async () => Object.keys((await dados(page)).feitos ?? {})).toContain('m2.gestao');
    await recarrega(page);
    expect(Object.keys((await dados(page)).feitos ?? {})).toContain('m2.gestao');
    const ex = await noResumo(page, 2, 'Organograma e rotinas');
    await expect(ex).toHaveAttribute('data-estado', 'ok');
  });
});
