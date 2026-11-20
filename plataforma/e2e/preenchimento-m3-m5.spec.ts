import { test, expect, type Page } from '@playwright/test';
import { abreGuia, salvoDe } from './guia-real';
import { EQUIPE } from './semente-rumo';

/* Qualidade do preenchimento · Grupo D: cada exercício das Missões 3, 4 e 5 preenchido, a página recarregada,
   tudo ainda lá, e o Resumo do preenchimento refletindo a resposta (prévia, estado e a lista completa). */

type Dados = Record<string, unknown> & { campos?: Record<string, string> };
const dados = async (page: Page) => ((await salvoDe(page)).dados ?? {}) as Dados;
const campos = async (page: Page) => (await dados(page)).campos ?? {};

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

/** Marca o exercício como concluído e confere que o Resumo o mostra como feito, mesmo depois de recarregar. */
async function concluiEConfere(page: Page, id: string, missao: number, titulo: string) {
  await page.getByRole('button', { name: /Marcar como concluído/ }).first().click();
  await expect.poll(async () => Object.keys(((await dados(page)).feitos ?? {}) as object)).toContain(id);
  await recarrega(page);
  const ex = await noResumo(page, missao, titulo);
  await expect(ex).toHaveAttribute('data-estado', 'ok');
}

/* ───────── Missão 3 ───────── */

const BANDEIRAS = { 'm3.mural': 'Educação; Saúde', 'm3.b1': 'Educação', 'm3.b2': 'Saúde' };

test.describe('Missão 3 · bandeiras, legado, preditores e metas', () => {
  test('As bandeiras do mandato: escolha, argumento, notas e prioridade gravam, sobrevivem e vão ao Resumo', async ({ page }) => {
    await abreGuia(page, '#/m/3/m3.bandeiras', { dados: { agendasPrio: ['educacao', 'saude', 'modernizacao'] } });
    const chips = page.locator('.rm-chip');
    await expect(chips.first()).toBeVisible();
    const nome = ((await chips.first().textContent()) ?? '').trim();
    await page.getByRole('button', { name: nome, exact: true }).click();
    await page.getByLabel(`Argumentos de ${nome}`).fill('Muita demanda nas escolas do território');
    await page.getByRole('button', { name: new RegExp(`^Nota 5 em `) }).first().click();
    await expect.poll(async () => (await campos(page))['m3.argumentos'] ?? '').toContain('Muita demanda nas escolas do território');
    await page.getByRole('button', { name: new RegExp(`Marcar ${nome} como prioritárias?`) }).click();
    const rumo = async () => ((await dados(page)).rumo ?? { bandeiras: [] }) as { bandeiras: { rot: string; prioridade: number | null }[] };
    await expect.poll(async () => (await rumo()).bandeiras.find((b) => b.rot === nome)?.prioridade ?? null).not.toBeNull();

    await recarrega(page);
    expect((await campos(page))['m3.mural']).toContain(nome);
    expect((await campos(page))['m3.argumentos']).toContain('Muita demanda nas escolas do território');
    await expect(page.getByRole('button', { name: nome, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByLabel(`Argumentos de ${nome}`)).toHaveValue('Muita demanda nas escolas do território');
    expect((await rumo()).bandeiras.find((b) => b.rot === nome)?.prioridade).not.toBeNull();

    const ex = await noResumo(page, 3, 'As agendas do mandato');
    await expect(ex).toContainText(nome);
    await expect(ex).toContainText('Muita demanda nas escolas do território');
    await expect(ex).not.toHaveAttribute('data-estado', 'nao');
  });

  test('O legado: os 4 passos gravam a manchete e o cargo, sobrevivem ao recarregar e vão ao Resumo', async ({ page }) => {
    await abreGuia(page, '#/m/3/m3.legado/1', { dados: { campos: BANDEIRAS } });
    await page.getByRole('textbox', { name: /^Protagonista( Usar .*)?$/ }).fill('Ana Souza');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByLabel('Principal entrega').fill('colocou a Educação no centro do debate');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByLabel('Resultado verificável').fill('zerou a fila da educação infantil');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('radiogroup', { name: 'Cargo em quatro anos' }).getByRole('radio', { name: 'Reeleição a Deputado(a) Estadual', exact: true }).click();
    await expect.poll(async () => (await campos(page))['m3.cargo'] ?? '').toBe('Reeleição a Deputado(a) Estadual');
    await expect.poll(async () => (await campos(page))['m3.legado'] ?? '').toContain('zerou a fila da educação infantil');

    await recarrega(page);
    const c = await campos(page);
    expect(c['m3.cargo']).toBe('Reeleição a Deputado(a) Estadual');
    expect(c['m3.legado']).toContain('Ana Souza');
    expect(c['m3.legado']).toContain('colocou a Educação no centro do debate');
    await expect(page.getByLabel('Texto final da manchete')).toHaveValue(/zerou a fila da educação infantil/);

    const ex = await noResumo(page, 3, 'O Legado do mandato');
    await expect(ex).toContainText('zerou a fila da educação infantil');
    await expect(ex).toContainText('Reeleição a Deputado(a) Estadual');
    await expect(ex).not.toHaveAttribute('data-estado', 'nao');
  });

  test('Os preditores: 3 escolhidos, justificativas e estratégia gravam, sobrevivem e vão ao Resumo', async ({ page }) => {
    await abreGuia(page, '#/m/3/m3.preditores/1');
    const card = (pid: string) => page.locator(`[data-preditor="${pid}"]`);
    page.on('dialog', (dl) => dl.accept());
    for (const pid of ['p1', 'p2', 'p3']) await card(pid).locator('.rm-pred-bt').click();
    // as 5 justificativas fecham o passo: as 3 escolhidas ("foi escolhido pois") e as 2 que ficaram de fora
    for (const pid of ['p1', 'p2', 'p3', 'p4', 'p5']) await card(pid).getByRole('textbox').fill(`Justificativa do ${pid} com acentuação: ação`);
    await page.locator('[data-estrategia="b"]').getByRole('radio').check();
    for (const pid of ['p1', 'p2', 'p3']) await page.locator(`[data-frase="${pid}"] input`).fill(`Objetivo do ${pid} em outras palavras`);
    await expect.poll(async () => ((await dados(page)).preditores as string[] | undefined)?.length ?? 0).toBe(3);
    await expect.poll(async () => (await campos(page))['m3.just.p3'] ?? '').toContain('Justificativa do p3');
    await expect.poll(async () => (await campos(page))['m3.obj.p3'] ?? '').toContain('Objetivo do p3');
    expect((await campos(page))['m3.est']).toBe('b');

    await recarrega(page);
    expect(((await dados(page)).preditores as string[]).sort()).toEqual(['p1', 'p2', 'p3']);
    const c = await campos(page);
    for (const pid of ['p1', 'p2', 'p3', 'p4', 'p5']) {
      expect(c[`m3.just.${pid}`]).toBe(`Justificativa do ${pid} com acentuação: ação`);
      await expect(card(pid).getByRole('textbox')).toHaveValue(`Justificativa do ${pid} com acentuação: ação`);
    }
    expect(c['m3.est']).toBe('b');
    await expect(page.locator('[data-estrategia="b"]').getByRole('radio')).toBeChecked();
    for (const pid of ['p1', 'p2', 'p3']) {
      expect(c[`m3.obj.${pid}`]).toBe(`Objetivo do ${pid} em outras palavras`);
      await expect(page.locator(`[data-frase="${pid}"] input`)).toHaveValue(`Objetivo do ${pid} em outras palavras`);
    }

    const ex = await noResumo(page, 3, 'Os preditores de sucesso');
    for (const pid of ['p1', 'p2', 'p3', 'p4', 'p5']) await expect(ex).toContainText(`Justificativa do ${pid} com acentuação: ação`);
    for (const pid of ['p1', 'p2', 'p3']) await expect(ex).toContainText(`Objetivo do ${pid} em outras palavras`);
    await expect(ex).not.toHaveAttribute('data-estado', 'nao');

    // concluído de verdade: o Resumo passa a mostrar o exercício como feito, mesmo depois de recarregar
    await page.goto('/guia#/m/3/m3.preditores/2');
    await concluiEConfere(page, 'm3.preditores', 3, 'Os preditores de sucesso');
  });

  test('As metas: texto SMART, objetivo, responsável, apoio e sucessos gravam, sobrevivem e vão ao Resumo', async ({ page }) => {
    await abreGuia(page, '#/m/3/m3.metas/1', { dados: { campos: EQUIPE, preditores: ['p1', 'p2', 'p3'] } });
    await page.getByRole('button', { name: /^Acrescentar meta a / }).first().click();
    const meta = page.locator('[data-meta="0"]');
    await meta.getByRole('textbox', { name: /no formato SMART/ }).fill('Aprovar 2 projetos de lei de educação até dezembro de 2027');
    await meta.getByRole('group', { name: /^Responsável direto/ }).getByRole('button', { name: /Bruno Lima/ }).click();
    await meta.getByRole('group', { name: /^Apoios/ }).getByRole('button', { name: 'Carla Dias' }).click();
    await meta.getByRole('button', { name: 'Adicionar sucesso à meta 01' }).click();
    await meta.getByLabel('Texto do sucesso 1 da meta 01').fill('Protocolar o primeiro projeto');
    await meta.getByLabel('Status do sucesso 1 da meta 01').selectOption('concluida');
    type M = { texto?: string; resp?: string; apoio?: string[] | string; sucessos?: { texto: string; status: string }[] };
    const metas = async () => ((await dados(page)).metas ?? []) as M[];
    await expect.poll(async () => (await metas())[0]?.sucessos?.[0]?.status).toBe('concluida');
    expect((await metas())[0].texto).toContain('Aprovar 2 projetos de lei de educação');

    await recarrega(page);
    const m0 = (await metas())[0];
    expect(m0.texto).toContain('Aprovar 2 projetos de lei de educação até dezembro de 2027');
    expect(m0.sucessos?.[0]).toMatchObject({ texto: 'Protocolar o primeiro projeto', status: 'concluida' });
    const arvore = page.getByRole('tree', { name: /Árvore do planejamento/ });
    await expect(arvore).toContainText('Aprovar 2 projetos de lei de educação até dezembro de 2027');
    await expect(arvore).toContainText('Responsável: Bruno Lima');
    await expect(arvore).toContainText('Apoio: Carla Dias');
    await page.getByRole('button', { name: 'Editar a meta 01' }).click();
    await expect(page.locator('[data-meta="0"]').getByRole('textbox', { name: /no formato SMART/ })).toHaveValue(/Aprovar 2 projetos de lei de educação/);
    await expect(page.locator('[data-meta="0"]').getByRole('group', { name: /^Responsável direto/ }).getByRole('button', { name: /Bruno Lima/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-meta="0"]').getByLabel('Texto do sucesso 1 da meta 01')).toHaveValue('Protocolar o primeiro projeto');

    const ex = await noResumo(page, 3, 'As metas dos primeiros 100 dias');
    await expect(ex).toContainText('Aprovar 2 projetos de lei de educação até dezembro de 2027');
    await expect(ex).toContainText('Bruno Lima');
    await expect(ex).toContainText('Carla Dias');
    await expect(ex).not.toHaveAttribute('data-estado', 'nao');
  });
});

/* ---------- Missão 4 ---------- */
const FEDERAL = { nome_parlamentar: 'Ana Souza', cargo: 'Deputado(a) Federal', casa: 'Câmara dos Deputados', uf: 'SP', data_posse: '2027-02-01' };
const MOTIVO1 = 'Pauta da nossa bandeira';
const MOTIVO2 = 'Dá visibilidade ao mandato';
const MOV = 'Procurar a secretaria da comissão';
const perg = (page: Page, campo: 'pq' | 'papel' | 'mov', rot: string) => page.locator(`.cp-perg[data-campo="${campo}"]`).getByRole('button', { name: rot, exact: true });
type Lista = Array<Record<string, string | number>>;
const iso = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

test.describe('Missão 4 · comissões, ações e métricas', () => {
  test('Comissões: escolha, motivo, papel e movimento gravam, sobrevivem ao recarregar e chegam ao Resumo', async ({ page }) => {
    await abreGuia(page, '#/m/4/m4.comissoes/1', { mandato: FEDERAL, dados: { campos: { 'm3.mural': 'Saúde', 'm3.b1': 'Saúde' } } });
    await page.getByRole('checkbox', { name: 'Escolher Comissão de Saúde' }).check();
    await perg(page, 'pq', MOTIVO1).click();
    await perg(page, 'pq', MOTIVO2).click();
    await perg(page, 'papel', 'Titular').click();
    await perg(page, 'mov', MOV).click();
    await expect.poll(async () => ((await dados(page)).comissoes as Lista | undefined)?.[0]?.mov).toBe(MOV);
    const c0 = ((await dados(page)).comissoes as Lista)[0];
    expect(c0).toMatchObject({ sigla: 'CSAUDE', esp: 'Comissão de Saúde', pq: `${MOTIVO1}; ${MOTIVO2}`, papel: 'Titular', mov: MOV });

    await recarrega(page);
    expect(((await dados(page)).comissoes as Lista)).toHaveLength(1);
    await expect(page.getByRole('checkbox', { name: 'Escolher Comissão de Saúde' })).toBeChecked();
    await page.locator('li[data-sigla="CSAUDE"]').getByRole('button', { name: 'Configurar' }).first().click();
    await expect(perg(page, 'pq', MOTIVO1)).toHaveAttribute('aria-pressed', 'true');
    await expect(perg(page, 'pq', MOTIVO2)).toHaveAttribute('aria-pressed', 'true');
    await expect(perg(page, 'papel', 'Titular')).toHaveAttribute('aria-pressed', 'true');
    await expect(perg(page, 'mov', MOV)).toHaveAttribute('aria-pressed', 'true');

    const ex = await noResumo(page, 4, 'A escolha das Comissões Permanentes');
    await expect(ex).toContainText('Comissão de Saúde');
    await expect(ex).toContainText('Titular');
    await expect(ex).not.toHaveAttribute('data-estado', 'nao');
  });

  test('Ações: marcar e detalhar grava os 5 campos, sobrevive ao recarregar e chega ao Resumo', async ({ page }) => {
    await abreGuia(page, '#/m/4/m4.acoes/1', { mandato: FEDERAL });
    await page.locator('.cp-acoes > li[data-bingo="articulacao"][data-i="0"]').getByRole('checkbox').check();
    const l = page.getByRole('dialog').locator('li[data-bingo="articulacao"][data-i="0"]');
    await l.getByRole('button', { name: 'Detalhar em formato de registro completo' }).click();
    await l.getByLabel('O que queremos alcançar').fill('Ser ouvido nas decisões da Mesa');
    await l.getByLabel('Responsável').fill('Bruno');
    await l.getByLabel('Prazo').fill(iso(20));
    await l.getByLabel('Como saberemos').fill('Ata da reunião');
    await l.getByLabel('Próximo passo').fill('Ligar para a secretaria');
    await expect.poll(async () => ((await dados(page)).acoes as Lista | undefined)?.[0]?.prox).toBe('Ligar para a secretaria');

    await recarrega(page);
    const a0 = ((await dados(page)).acoes as Lista)[0];
    expect(a0).toMatchObject({ bingo: 'articulacao', i: 0, alcancar: 'Ser ouvido nas decisões da Mesa', resp: 'Bruno', prazo: iso(20), saber: 'Ata da reunião', prox: 'Ligar para a secretaria' });
    const item = page.locator('.cp-acoes > li[data-bingo="articulacao"][data-i="0"]');
    await expect(item.getByRole('checkbox')).toBeChecked();
    await item.getByRole('button', { name: 'Detalhar ação' }).click();
    const l2 = page.getByRole('dialog').locator('li[data-bingo="articulacao"][data-i="0"]');
    await expect(l2.getByLabel('O que queremos alcançar')).toHaveValue('Ser ouvido nas decisões da Mesa');
    await expect(l2.getByLabel('Responsável')).toHaveValue('Bruno');
    await expect(l2.getByLabel('Próximo passo')).toHaveValue('Ligar para a secretaria');

    const ex = await noResumo(page, 4, 'Articulação e Mobilização');
    await expect(ex).toContainText('Ser ouvido nas decisões da Mesa');
    await expect(ex).toContainText('Bruno');
    await expect(ex).not.toHaveAttribute('data-estado', 'nao');
  });

  test('Métricas: o registro semanal grava, sobrevive ao recarregar e chega ao Resumo', async ({ page }) => {
    await abreGuia(page, '#/m/4/m4.metricas/1', { dados: {} });
    const secao = page.locator('details[data-secao="k1"]');
    await secao.locator(':scope > summary').click();
    await secao.getByRole('button', { name: /^Registrar/ }).click();
    await secao.getByLabel('Seguidores (total)', { exact: true }).fill('1200');
    await secao.getByLabel('Alcance ou visualizações', { exact: true }).fill('30');
    await secao.getByRole('button', { name: 'Salvar registro' }).click();
    await expect.poll(async () => JSON.stringify((await dados(page)).comunicacao ?? {})).toContain('1200');

    await recarrega(page);
    expect(JSON.stringify((await dados(page)).comunicacao)).toMatch(/"seguidores":1200/);
    const s2 = page.locator('details[data-secao="k1"]');
    await s2.locator(':scope > summary').click();
    await expect(s2).toContainText('1200');

    const ex = await noResumo(page, 4, 'O acompanhamento da comunicação');
    await expect(ex).toContainText(/Seguidores \(total\) 1200 · Alcance ou visualizações 30/);
    await expect(ex).not.toHaveAttribute('data-estado', 'nao');
  });
});

/* ───────── Missão 5 ───────── */

type Meta5 = { id: string; pred?: string; texto?: string; status?: string; sucessos?: { id: string; mes: number; texto: string; status: string }[] };
const META_BASE: Meta5 = { id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos de lei de educação até dezembro de 2027', status: 'nao_concluida' };
const D5 = { campos: { ...EQUIPE, 'm3.obj.p1': 'Priorizar a educação', 'm3.legado': 'A Educação no centro do debate' }, preditores: ['p1'], metas: [META_BASE] };
const metas5 = async (page: Page) => ((await dados(page)).metas ?? []) as Meta5[];

test.describe('Missão 5 · monitoramento, sucessos, feedback, imersão e novo planejamento', () => {
  test('Monitoramento: o detalhe de cada mês grava, sobrevive ao recarregar e chega ao Resumo', async ({ page }) => {
    await abreGuia(page, '#/m/5/m5.monit/1', { dados: D5 });
    const mes = (n: number) => page.locator(`details[data-mes="${n}"]`);
    /* o Guia troca o textarea por um editor rico (.rico-area); o textarea escondido guarda o HTML */
    const escreve = async (n: number, texto: string) => {
      await mes(n).locator(':scope > summary').click();
      await mes(n).locator('.rico-area').click();
      await page.keyboard.type(texto);
      await expect.poll(async () => (await campos(page))[`mon.a.${n}.det`] ?? '').toContain(texto);
    };
    await escreve(1, 'Protocolamos o projeto e ouvimos três escolas');
    await escreve(3, 'Votação adiada para o mês seguinte');

    await recarrega(page);
    expect((await campos(page))['mon.a.1.det']).toContain('Protocolamos o projeto e ouvimos três escolas');
    await expect(mes(1)).toHaveAttribute('open', '');
    await expect(mes(1).locator('.rico-area')).toContainText('Protocolamos o projeto e ouvimos três escolas');
    await expect(mes(3).locator('.rico-area')).toContainText('Votação adiada para o mês seguinte');
    await expect(mes(1).locator('summary').first()).toContainText('✓');
    await expect(mes(2).locator('summary').first()).not.toContainText('✓');

    const ex = await noResumo(page, 5, 'O monitoramento do avanço das metas');
    await expect(ex).toContainText('Meta 01');
    await expect(ex).toContainText('1º monitoramento');
    await expect(ex).toContainText('Protocolamos o projeto e ouvimos três escolas');
    await expect(ex).toContainText('3º monitoramento');
    await expect(ex).toContainText('Votação adiada para o mês seguinte');
    await expect(ex).not.toHaveAttribute('data-estado', 'nao');
    await page.goto('/guia#/m/5/m5.monit/1');
    await concluiEConfere(page, 'm5.monit', 5, 'O monitoramento do avanço das metas');
  });

  test('Sucessos mensais: o atingimento da meta é a média dos meses, grava e sobrevive ao recarregar', async ({ page }) => {
    await abreGuia(page, '#/m/3/m3.metas/1', { dados: D5 });
    await page.getByRole('button', { name: 'Editar a meta 01' }).click();
    const meta = page.locator('[data-meta="0"]');
    await meta.getByRole('button', { name: 'Adicionar sucesso à meta 01' }).click();
    await meta.getByLabel('Texto do sucesso 1 da meta 01').fill('Protocolar o projeto');
    await meta.getByLabel('Status do sucesso 1 da meta 01').selectOption('concluida70');
    await meta.getByRole('button', { name: 'Adicionar sucesso à meta 01' }).click();
    await meta.getByLabel('Mês do sucesso 2 da meta 01').selectOption('2');
    await meta.getByLabel('Texto do sucesso 2 da meta 01').fill('Votar em plenário');
    await meta.getByLabel('Status do sucesso 2 da meta 01').selectOption('concluida50');
    await expect.poll(async () => (await metas5(page))[0]?.status).toBe('concluida60');

    await recarrega(page);
    const m0 = (await metas5(page))[0];
    expect(m0.status).toBe('concluida60');
    expect(m0.sucessos?.map((s) => [s.mes, s.texto, s.status])).toEqual([[1, 'Protocolar o projeto', 'concluida70'], [2, 'Votar em plenário', 'concluida50']]);
    await page.getByRole('button', { name: 'Editar a meta 01' }).click();
    await expect(page.locator('[data-meta="0"]').getByLabel('Status do sucesso 2 da meta 01')).toHaveValue('concluida50');
    await expect(page.locator('[data-meta="0"]').getByLabel('Texto do sucesso 1 da meta 01')).toHaveValue('Protocolar o projeto');
    await expect(page.locator('[data-meta="0"]')).toContainText('60%');
  });

  test('Feedback: a conversa grava, a pessoa vira "feita" depois de recarregar e o Resumo mostra o registro', async ({ page }) => {
    await abreGuia(page, '#/m/5/m5.feedback/1', { dados: { campos: EQUIPE } });
    await page.locator('[data-lider="1"]').getByRole('button', { name: /Bruno Lima/ }).click();
    await page.locator('[data-pessoa="3"]').getByRole('button', { name: /Davi Rocha/ }).click();
    const form = page.getByRole('form', { name: 'Conversa de feedback com Davi Rocha' });
    await form.getByLabel('Data da conversa').fill('18/03');
    await form.getByLabel('Ponto de destaque 1').fill('Boa entrega');
    await form.getByLabel('Ponto de ajuste 1').fill('Prazos');
    await form.getByLabel('Resumo do plano de ação').fill('Reunião semanal');
    await form.getByRole('button', { name: 'Salvar conversa' }).click();
    const conversas = async () => ((await dados(page)).feedbacks ?? (await dados(page)).feedback ?? []) as Record<string, string>[];
    await expect.poll(async () => (await conversas()).length).toBe(1);

    await recarrega(page);
    expect((await conversas())[0]).toMatchObject({ data: '18/03' });
    await page.locator('[data-lider="1"]').getByRole('button', { name: /Bruno Lima/ }).click();
    await expect(page.locator('[data-pessoa="3"]')).toContainText(/feit/i);
    await expect(page.locator('[data-pessoa="2"]')).not.toContainText(/feit/i);

    const ex = await noResumo(page, 5, 'O primeiro ciclo de feedback estruturado');
    await expect(ex).toContainText('Davi Rocha');
    await expect(ex).toContainText('Bruno Lima');
    await expect(ex).toContainText('18/03');
    await expect(ex).toContainText('Boa entrega');
    await expect(ex).toContainText('Prazos');
    await expect(ex).toContainText('Reunião semanal');
    await expect(ex).not.toHaveAttribute('data-estado', 'nao');
  });

  test('Imersão: data, participantes e itens do checklist gravam, sobrevivem e chegam ao Resumo', async ({ page }) => {
    await abreGuia(page, '#/m/5/m5.imersao/1', { dados: {} });
    await page.getByLabel('Data da imersão de planejamento do quadrimestre').fill('12 e 13 de maio');
    await page.getByLabel('Quem deve participar').fill('toda a equipe');
    const itens = page.locator('input[type="checkbox"][data-k^="m5.i"]');
    await itens.nth(0).check();
    await itens.nth(2).check();
    await expect.poll(async () => (await campos(page))['m5.i3']).toBeTruthy();
    expect((await campos(page))['m5.i1']).toBeTruthy();
    expect((await campos(page))['m5.dataImersao']).toBe('12 e 13 de maio');
    expect((await campos(page))['m5.quemImersao']).toBe('toda a equipe');

    await recarrega(page);
    await expect(page.getByLabel('Data da imersão de planejamento do quadrimestre')).toHaveValue('12 e 13 de maio');
    await expect(page.getByLabel('Quem deve participar')).toHaveValue('toda a equipe');
    await expect(itens.nth(0)).toBeChecked();
    await expect(itens.nth(2)).toBeChecked();
    await expect(itens.nth(1)).not.toBeChecked();

    const ex = await noResumo(page, 5, 'Calibragem e replanejamento');
    await expect(ex).toContainText('12 e 13 de maio');
    await expect(ex).toContainText('toda a equipe');
    await expect(ex).toContainText('Itens marcados (2 de 9)');
    await expect(ex).not.toHaveAttribute('data-estado', 'nao');
    await page.goto('/guia#/m/5/m5.imersao/2');
    await concluiEConfere(page, 'm5.imersao', 5, 'Calibragem e replanejamento');
  });

  test('Novo planejamento: guarda o anterior, abre o novo só com as metas escolhidas e tudo sobrevive ao recarregar', async ({ page }) => {
    const metas = [{ ...META_BASE, status: 'concluida', sucessos: [{ id: 's1', mes: 1, texto: 'Protocolar', status: 'concluida' }] }, { id: 'b', pred: 'p1', texto: 'Visitar 10 escolas', status: 'concluida70' }];
    await abreGuia(page, '#/m/5/m5.imersao/1', { dados: { ...D5, metas } });
    await page.getByRole('button', { name: 'Criar novo planejamento' }).click();
    const painel = page.getByRole('group', { name: 'Criar novo planejamento' });
    await painel.getByRole('button', { name: 'Desmarcar todas' }).click();
    await painel.getByRole('checkbox', { name: /Visitar 10 escolas/ }).check();
    await page.getByRole('button', { name: 'Confirmar e criar novo planejamento' }).click();
    type P = { n: number; legado: string; metas: Meta5[] };
    const planos = async () => ((await dados(page)).planos ?? []) as P[];
    await expect.poll(async () => (await planos()).length).toBe(1);

    await recarrega(page);
    const [p1] = await planos();
    expect(p1.n).toBe(1);
    expect(p1.legado).toBe('A Educação no centro do debate');
    expect(p1.metas.map((m) => m.id)).toEqual(['a', 'b']);
    expect((await metas5(page)).map((m) => [m.id, m.status])).toEqual([['b', 'nao_concluida']]);
    expect((await metas5(page))[0].sucessos ?? []).toHaveLength(0);
    expect((await campos(page))['m3.legado']).toBe('A Educação no centro do debate');
  });
});
