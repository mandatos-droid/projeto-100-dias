import { test, expect, type Page } from '@playwright/test';
import { chamadas, mandato, moca, naoMapeadas, semeiaSessao, vazou, type EstadoMoca, type Papel } from './admin-api';

/* Tela Analytics do /admin (ADM-09, 10, 11, 12, 16). Supabase todo interceptado (admin-api.ts).
   A fixture é pequena e calculada à mão (veja os comentários): os números esperados abaixo não vêm de nenhuma função do app. */
const diasAtras = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

// Mês corrente em Brasília e deslocamentos: a fixture é relativa a "agora" para não envelhecer.
const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
const ANO = Number(partes.find((p) => p.type === 'year')!.value);
const MES = Number(partes.find((p) => p.type === 'month')!.value);
const mesRel = (k: number) => { const i = ANO * 12 + (MES - 1) + k; return { ano: Math.floor(i / 12), mes: (i % 12) + 1 }; };
const doisDig = (n: number) => String(n).padStart(2, '0');
const iso = (k: number, dia: number) => { const { ano, mes } = mesRel(k); return `${ano}-${doisDig(mes)}-${doisDig(dia)}T15:00:00Z`; }; // 15h UTC = 12h em Brasília
const mesView = (k: number) => { const { ano, mes } = mesRel(k); return `${ano}-${doisDig(mes)}-01`; };
const NOMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const rotulo = (k: number) => { const { ano, mes } = mesRel(k); return `${NOMES[mes - 1]}/${String(ano).slice(2)}`; };

// Catálogo do Guia (16 exercícios) na ordem do Guia, como em exercicios_guia.
const GUIA = [
  ['m1.persona', 1, 1, 'A persona'], ['m1.conjuntura', 1, 2, 'A conjuntura'], ['m1.oportunidades', 1, 3, 'As oportunidades e ameaças'], ['m1.frag', 1, 4, 'As fragilidades'],
  ['m2.funcoes', 2, 1, 'A escalação do time'], ['m2.gestao', 2, 2, 'Organograma e rotinas'],
  ['m3.bandeiras', 3, 1, 'As bandeiras do mandato'], ['m3.legado', 3, 2, 'O Legado do mandato'], ['m3.preditores', 3, 3, 'Os preditores de sucesso'], ['m3.metas', 3, 4, 'As metas dos primeiros 100 dias'],
  ['m4.comissoes', 4, 1, 'A escolha das Comissões Permanentes'], ['m4.acoes', 4, 2, 'As ações dos 100 dias'], ['m4.metricas', 4, 3, 'O acompanhamento da comunicação'],
  ['m5.monit', 5, 1, 'O monitoramento do avanço das metas'], ['m5.feedback', 5, 2, 'O primeiro ciclo de feedback estruturado'], ['m5.imersao', 5, 3, 'Calibragem e replanejamento'],
] as const;
const exerciciosGuia = GUIA.map(([id, missao, ordem, titulo]) => ({ id, missao, ordem, titulo }));
const linhasExercicio = (mandatoId: string, uf: string, feitos: string[]) =>
  GUIA.map(([id, missao, ordem]) => ({ mandato_id: mandatoId, uf, exercicio: id, missao, ordem, ok: feitos.includes(id) }));

const M1 = ['m1.persona', 'm1.conjuntura', 'm1.oportunidades', 'm1.frag'];
const M2 = ['m2.funcoes', 'm2.gestao'];
const TODOS = GUIA.map((g) => g[0] as string);

/* Mandatos (a5 é de MG; x está arquivado e não conta em lugar nenhum):
   id  UF  criado  última atividade  concluídos (o que está feito)
   a1  SP  M-2     3 dias            6   (missões 1 e 2)
   a2  SP  M-2     20 dias           2   (persona e conjuntura)
   a3  RJ  M-1     40 dias           0
   a4  RJ  M-1     60 dias           1   (persona)
   a5  MG  M0      hoje              16  (tudo)
   x   SP  M-2     1 dia             (arquivado) */
const MANDATOS = [
  mandato({ id: 'a1', uf: 'SP', criado_em: iso(-2, 15), ultima_atividade: diasAtras(3), exercicios_concluidos: 6 }),
  mandato({ id: 'a2', uf: 'SP', criado_em: iso(-2, 15), ultima_atividade: diasAtras(20), exercicios_concluidos: 2 }),
  mandato({ id: 'a3', uf: 'RJ', criado_em: iso(-1, 15), ultima_atividade: diasAtras(40), exercicios_concluidos: 0 }),
  mandato({ id: 'a4', uf: 'RJ', criado_em: iso(-1, 15), ultima_atividade: diasAtras(60), exercicios_concluidos: 1 }),
  mandato({ id: 'a5', uf: 'MG', criado_em: iso(0, 1), ultima_atividade: diasAtras(0), exercicios_concluidos: 16 }),
  mandato({ id: 'x', uf: 'SP', criado_em: iso(-2, 15), ultima_atividade: diasAtras(1), exercicios_concluidos: 16, arquivado_em: diasAtras(2) }),
];
// v_admin_exercicios não traz arquivados
const EXERCICIOS = [
  ...linhasExercicio('a1', 'SP', [...M1, ...M2]),
  ...linhasExercicio('a2', 'SP', ['m1.persona', 'm1.conjuntura']),
  ...linhasExercicio('a3', 'RJ', []),
  ...linhasExercicio('a4', 'RJ', ['m1.persona']),
  ...linhasExercicio('a5', 'MG', TODOS),
];
// eventos por mandato e mês; o do arquivado (x) deve ser ignorado
const EVENTOS = [
  { mandato_id: 'a1', mes: mesView(-2), qtd: 3 }, { mandato_id: 'a1', mes: mesView(-1), qtd: 2 }, { mandato_id: 'a1', mes: mesView(0), qtd: 1 },
  { mandato_id: 'a2', mes: mesView(-2), qtd: 1 },
  { mandato_id: 'a3', mes: mesView(-1), qtd: 4 },
  { mandato_id: 'a5', mes: mesView(0), qtd: 2 },
  { mandato_id: 'x', mes: mesView(0), qtd: 9 },
];
const campo = (id: string, uf: string, on: string[]) => ({
  mandato_id: id, uf, persona: on.includes('persona'), conjuntura: on.includes('conjuntura'), municipio: on.includes('municipio'),
  eleitorado: on.includes('eleitorado'), social: on.includes('social'), cadeiras: on.includes('cadeiras'),
});
const CAMPOS = [
  campo('a1', 'SP', ['persona', 'conjuntura', 'cadeiras']), campo('a2', 'SP', ['persona']), campo('a3', 'RJ', ['conjuntura', 'municipio']),
  campo('a4', 'RJ', []), campo('a5', 'MG', ['persona', 'conjuntura', 'municipio', 'eleitorado', 'social', 'cadeiras']),
];

const estadoPadrao = (): EstadoMoca => ({
  views: { v_admin_mandatos: MANDATOS, v_admin_exercicios: EXERCICIOS, v_admin_eventos_mes: EVENTOS, v_admin_uso_campos: CAMPOS, v_admin_uso: [], exercicios_guia: exerciciosGuia },
});

async function abre(page: Page, extra: EstadoMoca = {}, papel: Papel = 'admin') {
  await semeiaSessao(page, papel);
  await moca(page, { ...estadoPadrao(), ...extra });
  await page.goto('/admin/analytics');
  await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
  await expect(page.locator('.kpis')).toBeVisible();
}

const kpi = (page: Page, i: number) => page.locator('.kpi').nth(i).locator('b');
const grafico = (page: Page, titulo: string) => page.getByRole('group', { name: titulo });
const tabela = (page: Page, titulo: string) => page.locator('.card', { has: page.getByRole('heading', { name: titulo }) });
const kpis = async (page: Page) => [await kpi(page, 0).innerText(), await kpi(page, 1).innerText(), await kpi(page, 2).innerText(), await kpi(page, 3).innerText()];
const linhasTexto = (loc: ReturnType<Page['locator']>) => loc.locator('tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent?.trim())));

test.afterEach(() => {
  // nada pode ter saído da máquina nem ter trazido texto de gabinete (a view de uso vem vazia aqui: ver admin-analytics-uso.spec.ts)
  expect(naoMapeadas()).toEqual([]);
  expect(vazou()).toEqual([]);
});

test.describe('Analytics: indicadores e filtros (ADM-09)', () => {
  test('quatro indicadores batem com a conta feita à mão (padrão: 30 dias, parado há 45)', async ({ page }) => {
    await abre(page);
    // cadastrados 5 (sem o arquivado); ativos (última atividade há ≤ 30 dias): a1, a2, a5 = 3;
    // média de concluídos (6+2+0+1+16)/5 = 5; parados (> 45 dias): só a4 (60) = 1
    expect(await kpis(page)).toEqual(['5', '3', '5', '1']);
    await expect(page.locator('.kpi').nth(0)).toContainText('mandatos cadastrados');
    await expect(page.locator('.kpi').nth(1)).toContainText('ativos nos últimos 30 dias');
    await expect(page.locator('.kpi').nth(2)).toContainText('exercícios concluídos (média por mandato, de 16)');
    await expect(page.locator('.kpi').nth(3)).toContainText('parados há mais de 45 dias');
    await expect(page.getByLabel('Período')).toHaveValue('30');
    await expect(page.getByLabel('Parado há')).toHaveValue('45');
    await expect(page.getByLabel('Período').locator('option')).toHaveText(['Últimos 7 dias', 'Últimos 15 dias', 'Últimos 30 dias', 'Últimos 45 dias']);
    await expect(page.getByLabel('Parado há').locator('option')).toHaveText(['Parado há: 7 dias', 'Parado há: 15 dias', 'Parado há: 30 dias', 'Parado há: 45 dias']);
  });

  test('o período muda só os ativos; funil, travas e status mensal ficam iguais (ADM-09.2)', async ({ page }) => {
    await abre(page);
    const antes = {
      funil: await grafico(page, 'Funil das missões').innerText(),
      travas: await linhasTexto(tabela(page, 'Onde os mandatos travam')),
      mensal: await grafico(page, 'Status de atividade dos mandatos por mês').innerText(),
      parados: await kpi(page, 3).innerText(),
    };
    // ativos por período (dias de última atividade: 3, 20, 40, 60, 0): 7 -> a1,a5 = 2; 15 -> 2; 30 -> 3; 45 -> a1,a2,a3,a5 = 4
    for (const [dias, ativos] of [['7', '2'], ['15', '2'], ['30', '3'], ['45', '4']] as const) {
      await page.getByLabel('Período').selectOption(dias);
      await expect(kpi(page, 1)).toHaveText(ativos);
      await expect(page.locator('.kpi').nth(1)).toContainText(`ativos nos últimos ${dias} dias`);
    }
    expect(await grafico(page, 'Funil das missões').innerText()).toBe(antes.funil);
    expect(await linhasTexto(tabela(page, 'Onde os mandatos travam'))).toEqual(antes.travas);
    expect(await grafico(page, 'Status de atividade dos mandatos por mês').innerText()).toBe(antes.mensal);
    expect(await kpi(page, 3).innerText()).toBe(antes.parados);
  });

  test('"Parado há" muda só os parados: mais de N dias (ADM-09.1)', async ({ page }) => {
    await abre(page);
    // mais de 7 dias: a2(20), a3(40), a4(60) = 3; mais de 15: os mesmos 3; mais de 30: a3, a4 = 2; mais de 45: a4 = 1
    for (const [dias, parados] of [['7', '3'], ['15', '3'], ['30', '2'], ['45', '1']] as const) {
      await page.getByLabel('Parado há').selectOption(dias);
      await expect(kpi(page, 3)).toHaveText(parados);
      await expect(page.locator('.kpi').nth(3)).toContainText(`parados há mais de ${dias} dias`);
      await expect(kpi(page, 1)).toHaveText('3'); // ativos não mexe
    }
  });

  test('a UF recalcula indicadores, gráficos e tabelas só com os mandatos dela (ADM-09.3)', async ({ page }) => {
    await abre(page);
    await expect(page.getByLabel('UF').locator('option')).toHaveText(['UF: todas', 'MG', 'RJ', 'SP']); // UF do arquivado não cria opção sozinha: SP já existe por a1 e a2

    await page.getByLabel('UF').selectOption('SP');
    // SP: a1 e a2. cadastrados 2; ativos 2; média (6+2)/2 = 4; parados 0
    expect(await kpis(page)).toEqual(['2', '2', '4', '0']);
    // status mensal SP: M-2 ativos a1,a2 (2) e 0 parados; M-1 ativo a1 (1) e parado a2 (1); M0 ativo a1 (1) e parado a2 (1)
    const mensal = grafico(page, 'Status de atividade dos mandatos por mês');
    await expect(mensal.getByRole('img')).toHaveCount(3);
    await expect(mensal.getByRole('img', { name: `${rotulo(-2)}: Ativo 2, Parado 0` })).toBeVisible();
    await expect(mensal.getByRole('img', { name: `${rotulo(-1)}: Ativo 1, Parado 1` })).toBeVisible();
    await expect(mensal.getByRole('img', { name: `${rotulo(0)}: Ativo 1, Parado 1` })).toBeVisible();
    // funil SP (2 mandatos): M1 e M2 só a1 = 1 (50%); M3 a M5 = 0
    await expect(grafico(page, 'Funil das missões').locator('.fr small')).toHaveText(['1 · 50%', '1 · 50%', '0 · 0%', '0 · 0%', '0 · 0%']);
    // travas SP: 7 linhas (m3.legado e seguintes ninguém alcançou)
    const travas = await linhasTexto(tabela(page, 'Onde os mandatos travam'));
    expect(travas).toEqual([
      ['As bandeiras do mandato', '3', '1', '0', '100%'],
      ['As oportunidades e ameaças', '1', '2', '1', '50%'],
      ['A persona', '1', '2', '2', '0%'],
      ['A conjuntura', '1', '2', '2', '0%'],
      ['As fragilidades', '1', '1', '1', '0%'],
      ['A escalação do time', '2', '1', '1', '0%'],
      ['Organograma e rotinas', '2', '1', '1', '0%'],
    ]);
    // uso SP: persona 2, conjuntura 1, município 0, eleitorado 0, social 0, cadeiras 1
    expect(await linhasTexto(tabela(page, 'Uso por funcionalidade'))).toEqual([
      ['Persona', '2', '—', '—'], ['Conjuntura', '1', '—', '—'], ['Município', '0', '—', '—'],
      ['Eleitorado', '0', '—', '—'], ['Social', '0', '—', '—'], ['Cadeiras e escalação', '1', '—', '—'],
    ]);

    // RJ: a3 e a4. cadastrados 2; ativos 0; parados (> 45 dias): só a4 = 1
    await page.getByLabel('UF').selectOption('RJ');
    const rj = await kpis(page);
    expect([rj[0], rj[1], rj[3]]).toEqual(['2', '0', '1']);

    await page.getByLabel('UF').selectOption('');
    expect(await kpis(page)).toEqual(['5', '3', '5', '1']);
  });
});

test.describe('Analytics: gráficos (ADM-10, ADM-11)', () => {
  test('status mensal: título, unidade, legenda, eixo e contagem dentro de cada segmento; arquivado fora (ADM-10.4, 10.5, 11.10)', async ({ page }) => {
    await abre(page);
    const g = grafico(page, 'Status de atividade dos mandatos por mês');
    await expect(g.getByRole('heading', { name: 'Status de atividade dos mandatos por mês' })).toBeVisible();
    await expect(g.locator('.cs')).toHaveText('Quantidade de mandatos em cada mês, por status');
    await expect(g.locator('.key span')).toHaveText(['Ativo: ao menos 1 registro no mês', 'Parado: cadastrado, sem registro no mês']);
    // do mês do primeiro cadastro (M-2) até o atual: 3 colunas
    // M-2: ativos a1,a2 = 2, parados 0; M-1: ativos a1,a3 = 2, parados a2,a4 = 2; M0: ativos a1,a5 = 2, parados a2,a3,a4 = 3
    await expect(g.getByRole('img')).toHaveCount(3);
    await expect(g.getByRole('img', { name: `${rotulo(-2)}: Ativo 2, Parado 0` })).toBeVisible();
    await expect(g.getByRole('img', { name: `${rotulo(-1)}: Ativo 2, Parado 2` })).toBeVisible();
    await expect(g.getByRole('img', { name: `${rotulo(0)}: Ativo 2, Parado 3` })).toBeVisible();
    // contagem escrita dentro de cada segmento (segmento de 0 não é desenhado)
    await expect(g.getByRole('img').nth(0).locator('.seg')).toHaveText(['2']);
    await expect(g.getByRole('img').nth(1).locator('.seg')).toHaveText(['2', '2']);
    await expect(g.getByRole('img').nth(2).locator('.seg')).toHaveText(['2', '3']);
    // rótulos de mês no eixo horizontal e eixo vertical com valores (topo = maior total = 5)
    await expect(g.locator('.cl em')).toHaveText([rotulo(-2), rotulo(-1), rotulo(0)]);
    await expect(g.locator('.yax span')).toHaveText(['5', '3', '2', '0']);
    // o arquivado (x) teria 9 eventos no mês atual e 1 mandato a mais: nada disso aparece
    await expect(g.getByText('9', { exact: true })).toHaveCount(0);
  });

  test('funil: 5 barras com número e % dos cadastrados (ADM-11.7)', async ({ page }) => {
    await abre(page);
    const g = grafico(page, 'Funil das missões');
    await expect(g.locator('.cs')).toHaveText('Mandatos que concluíram cada missão, em número e % dos 5 cadastrados');
    // missão 1 concluída por a1 e a5 = 2 (40%); missão 2: a1 e a5 = 2 (40%); missões 3, 4 e 5: só a5 = 1 (20%)
    await expect(g.locator('.fr span')).toHaveText(['Missão 1', 'Missão 2', 'Missão 3', 'Missão 4', 'Missão 5']);
    await expect(g.locator('.fr small')).toHaveText(['2 · 40%', '2 · 40%', '1 · 20%', '1 · 20%', '1 · 20%']);
    await expect(g.locator('.meter i').first()).toHaveAttribute('style', /width:\s*40%/);
    await expect(g.locator('.key')).toHaveCount(0); // uma série só: sem legenda
  });

  test('travas: até 10 exercícios, do maior abandono para o menor, e sem os que ninguém alcançou (ADM-11.8, 11.9)', async ({ page }) => {
    await abre(page);
    // alcançaram/concluíram/abandono: bandeiras 2/1/50%; oportunidades 3/2/33%; conjuntura 4/3/25%; persona 5/4/20%;
    // depois os de 0% na ordem do Guia: frag, funcoes, gestao, legado, preditores, metas (corta em 10)
    expect(await linhasTexto(tabela(page, 'Onde os mandatos travam'))).toEqual([
      ['As bandeiras do mandato', '3', '2', '1', '50%'],
      ['As oportunidades e ameaças', '1', '3', '2', '33%'],
      ['A conjuntura', '1', '4', '3', '25%'],
      ['A persona', '1', '5', '4', '20%'],
      ['As fragilidades', '1', '2', '2', '0%'],
      ['A escalação do time', '2', '2', '2', '0%'],
      ['Organograma e rotinas', '2', '2', '2', '0%'],
      ['O Legado do mandato', '3', '1', '1', '0%'],
      ['Os preditores de sucesso', '3', '1', '1', '0%'],
      ['As metas dos primeiros 100 dias', '3', '1', '1', '0%'],
    ]);
    await expect(tabela(page, 'Onde os mandatos travam').getByRole('columnheader')).toHaveText(['Exercício', 'Missão', 'Alcançaram', 'Concluíram', 'Abandono']);
  });
});

test.describe('Analytics: uso por funcionalidade sem registro (ADM-12)', () => {
  test('"Mandatos que usaram" vem dos campos; Aberturas e Tendência mostram "—"; gráfico diz "Sem registro de uso ainda"', async ({ page }) => {
    await abre(page);
    // persona a1,a2,a5 = 3; conjuntura a1,a3,a5 = 3; município a3,a5 = 2; eleitorado a5 = 1; social a5 = 1; cadeiras a1,a5 = 2
    const t = tabela(page, 'Uso por funcionalidade');
    await expect(t.getByRole('columnheader')).toHaveText(['Funcionalidade', 'Mandatos que usaram', 'Aberturas (30d)', 'Tendência']);
    expect(await linhasTexto(t)).toEqual([
      ['Persona', '3', '—', '—'], ['Conjuntura', '3', '—', '—'], ['Município', '2', '—', '—'],
      ['Eleitorado', '1', '—', '—'], ['Social', '1', '—', '—'], ['Cadeiras e escalação', '2', '—', '—'],
    ]);
    const uso = grafico(page, 'Uso das funcionalidades por dia');
    await expect(uso.locator('.cs')).toHaveText('Total de aberturas de todas as funcionalidades, nos últimos 14 dias');
    await expect(uso.getByText('Sem registro de uso ainda')).toBeVisible();
    // trocar o período muda o rótulo da coluna, não os números
    await page.getByLabel('Período').selectOption('15');
    await expect(t.getByRole('columnheader', { name: 'Aberturas (15d)' })).toBeVisible();
  });

  test('os três gráficos têm título e unidade; legenda só onde há mais de uma série (ADM-11.10)', async ({ page }) => {
    await abre(page);
    for (const titulo of ['Status de atividade dos mandatos por mês', 'Funil das missões', 'Uso das funcionalidades por dia']) {
      const g = grafico(page, titulo);
      await expect(g.getByRole('heading', { name: titulo })).toBeVisible();
      await expect(g.locator('.cs')).not.toBeEmpty();
    }
    await expect(grafico(page, 'Status de atividade dos mandatos por mês').locator('.key')).toHaveCount(1);
    await expect(grafico(page, 'Funil das missões').locator('.key')).toHaveCount(0);
    await expect(grafico(page, 'Uso das funcionalidades por dia').locator('.key')).toHaveCount(0);
  });
});

test.describe('Analytics: bordas', () => {
  test('sem mandatos mostra "Ainda não há mandatos cadastrados." no lugar dos gráficos (ADM-10.6)', async ({ page }) => {
    await abre(page, { views: { v_admin_mandatos: [], v_admin_exercicios: [], v_admin_eventos_mes: [], v_admin_uso_campos: [], v_admin_uso: [], exercicios_guia: exerciciosGuia } });
    await expect(page.getByText('Ainda não há mandatos cadastrados.')).toBeVisible();
    await expect(page.getByRole('group')).toHaveCount(0);
    await expect(page.locator('table')).toHaveCount(0);
    expect(await kpis(page)).toEqual(['0', '0', '0', '0']);
  });

  test('só arquivados também conta como sem mandatos', async ({ page }) => {
    await abre(page, { views: { ...estadoPadrao().views, v_admin_mandatos: [MANDATOS[5]], v_admin_exercicios: [], v_admin_eventos_mes: [], v_admin_uso_campos: [] } });
    await expect(page.getByText('Ainda não há mandatos cadastrados.')).toBeVisible();
  });

  test('mais de 1.000 linhas de exercícios: a tela pagina e não corta o funil nem a base', async ({ page }) => {
    // 70 mandatos x 16 exercícios = 1.120 linhas (o PostgREST cortaria em 1.000, cerca de 62 mandatos). Todos concluíram a missão 1.
    const ms = Array.from({ length: 70 }, (_, i) => mandato({ id: `p${String(i + 1).padStart(2, '0')}`, uf: 'SP', ultima_atividade: diasAtras(2), exercicios_concluidos: 4 }));
    const ex = ms.flatMap((m) => linhasExercicio(m.id, 'SP', M1));
    expect(ex.length).toBe(1120);
    await abre(page, { views: { ...estadoPadrao().views, v_admin_mandatos: ms, v_admin_exercicios: ex, v_admin_eventos_mes: [], v_admin_uso_campos: [] } });
    expect(await kpis(page)).toEqual(['70', '70', '4', '0']);
    await expect(grafico(page, 'Funil das missões').locator('.fr small')).toHaveText(['70 · 100%', '0 · 0%', '0 · 0%', '0 · 0%', '0 · 0%']);
    const pedidos = chamadas().filter((c) => c.caminho.startsWith('v_admin_exercicios?')).map((c) => /limit=(\d+)&offset=(\d+)/.exec(c.caminho)!.slice(1).join(':'));
    expect(pedidos).toEqual(['1000:0', '1000:1000']);
  });

  test('erro de servidor mostra "Tentar de novo", sem tela em branco', async ({ page }) => {
    await semeiaSessao(page, 'admin');
    await moca(page, { ...estadoPadrao(), statusErro: 500 });
    await page.goto('/admin/analytics');
    await expect(page.getByText('Não foi possível carregar.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tentar de novo' })).toBeVisible();
  });

  test('papel leitura enxerga o Analytics inteiro (sem botão de alteração)', async ({ page }) => {
    await abre(page, {}, 'leitura');
    expect(await kpis(page)).toEqual(['5', '3', '5', '1']);
    await expect(page.locator('.main').getByRole('button')).toHaveCount(1); // só o Sair da casca
  });
});
