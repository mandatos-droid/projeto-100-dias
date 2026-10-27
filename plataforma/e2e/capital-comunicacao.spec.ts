import { test, expect, type Page } from '@playwright/test';
import { abre, dadoDe, MANDATO } from './semente-rumo';
import { abreGuia } from './guia-real';
import { semanaDe } from '../lib/comunicacao.ts';

/* Missão 4 · acompanhamento semanal da comunicação (CAP-20, CAP-21). Ilha montada na rota de teste. */
const ILHA = 'capital-comunicacao';
type Dados = { semanas: Record<string, Record<string, Record<string, number>>>; clipping: unknown[] };
const comunicacao = (page: Page) => dadoDe(page, 'comunicacao') as Promise<Dados | undefined>;
/** Semana ISO de n semanas atrás (0 = a atual), no fuso do aparelho, como a tela calcula. */
const semana = (atras = 0) => { const d = new Date(); d.setDate(d.getDate() - 7 * atras); return semanaDe(d)!; };
const secao = (page: Page, k: string) => page.locator(`details[data-secao="${k}"]`);
const topo = (page: Page, k: string) => secao(page, k).locator(':scope > summary'); // o gráfico tem outro <summary> (tabela) dentro
const abreSecao = async (page: Page, k: string) => { // abre só se estiver fechada: clicar de novo fecharia
  if (!(await secao(page, k).evaluate((el) => (el as HTMLDetailsElement).open))) await topo(page, k).click();
  return secao(page, k);
};
const TITULOS = [
  'Alcance e crescimento da comunidade',
  'Compartilhamentos, comentários e respostas',
  'Mensagens recebidas e encaminhadas',
  'Participação gerada por campanhas e convites',
  'Presença das agendas do mandato na imprensa e no debate público',
];
async function registra(page: Page, k: string, valores: Record<string, string>) {
  const s = await abreSecao(page, k);
  await s.getByRole('button', { name: /^(Registrar|Editar) esta semana$/ }).click();
  for (const [rot, v] of Object.entries(valores)) await s.getByLabel(rot, { exact: true }).fill(v);
  await s.getByRole('button', { name: 'Salvar registro' }).click();
  return s;
}
const semanas = (n: number) => Object.fromEntries(Array.from({ length: n }, (_, i) => [semana(n - 1 - i), { k1: { alcance: 100 * (i + 1), novos: 10 + i, seguidores: 1000 + 50 * i } }]));

test.describe('Cinco seções expansíveis (CAP-20.1)', () => {
  test('mostra as 5 seções do Guia, fechadas, com "Sem registro ainda" no cabeçalho', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await expect(page.locator('details[data-secao]')).toHaveCount(5);
    for (const [i, t] of TITULOS.entries()) {
      await expect(page.locator('details[data-secao] > summary').nth(i)).toContainText(t);
      await expect(page.locator('details[data-secao]').nth(i)).not.toHaveAttribute('open', '');
    }
    await expect(page.locator('details[data-secao] > summary').first()).toContainText('Sem registro ainda');
  });

  test('o cabeçalho fechado mostra o último registro da seção', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO, D: { comunicacao: { semanas: { [semana(1)]: { k1: { seguidores: 900, alcance: 10 } }, [semana(0)]: { k1: { seguidores: 1000, novos: 12, alcance: 20 } } }, clipping: [] } } });
    await expect(topo(page, 'k1')).toContainText(semana(0));
    await expect(topo(page, 'k1')).toContainText('Seguidores (total) 1000');
    await expect(topo(page, 'k1')).toContainText('Novos seguidores na semana 12');
    await expect(topo(page, 'k2')).toContainText('Sem registro ainda');
  });
});

test.describe('Registrar esta semana (CAP-20.2)', () => {
  test('abre o formulário com os números da seção, cada um com a explicação, e grava na semana ISO atual', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    const s = await abreSecao(page, 'k1');
    await s.getByRole('button', { name: 'Registrar esta semana' }).click();
    for (const rot of ['Seguidores (total)', 'Novos seguidores na semana', 'Alcance ou visualizações']) await expect(s.getByLabel(rot, { exact: true })).toBeVisible();
    await expect(s.getByText('Onde achar? Na página inicial das estatísticas da rede social.')).toBeVisible();
    await s.getByLabel('Seguidores (total)', { exact: true }).fill('1200');
    await s.getByLabel('Novos seguidores na semana', { exact: true }).fill('35');
    await s.getByLabel('Alcance ou visualizações', { exact: true }).fill('0');
    await s.getByRole('button', { name: 'Salvar registro' }).click();
    expect((await comunicacao(page))!.semanas).toEqual({ [semana(0)]: { k1: { seguidores: 1200, novos: 35, alcance: 0 } } });
    await expect(topo(page, 'k1')).toContainText('Seguidores (total) 1200');
  });

  test('cada seção grava o seu: os registros de seções diferentes na mesma semana convivem', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await registra(page, 'k1', { 'Alcance ou visualizações': '50' });
    await registra(page, 'k3', { 'Mensagens recebidas': '7', 'Mensagens encaminhadas': '2' });
    expect((await comunicacao(page))!.semanas).toEqual({ [semana(0)]: { k1: { alcance: 50 }, k3: { recebidas: 7, encaminhadas: 2 } } });
  });
});

test.describe('Só números maiores ou iguais a zero (CAP-20.4)', () => {
  test('número negativo é recusado com mensagem e nada é gravado', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await registra(page, 'k1', { 'Seguidores (total)': '-5' });
    await expect(secao(page, 'k1').getByRole('alert')).toContainText('Seguidores (total): o número não pode ser negativo');
    expect(await comunicacao(page)).toBeUndefined();
  });

  test('formulário sem nenhum número preenchido não grava', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await registra(page, 'k1', {});
    await expect(secao(page, 'k1').getByRole('alert')).toContainText('Preencha ao menos um número');
    expect(await comunicacao(page)).toBeUndefined();
  });

  test('zero é aceito', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await registra(page, 'k2', { Compartilhamentos: '0' });
    expect((await comunicacao(page))!.semanas[semana(0)].k2).toEqual({ compartilhamentos: 0 });
  });
});

test.describe('Editar esta semana (CAP-20.3)', () => {
  test('com registro na semana o botão vira "Editar esta semana", abre com os valores e edita o mesmo registro', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await registra(page, 'k1', { 'Seguidores (total)': '100', 'Novos seguidores na semana': '5' });
    const s = secao(page, 'k1');
    await expect(s.getByRole('button', { name: 'Registrar esta semana' })).toHaveCount(0);
    await s.getByRole('button', { name: 'Editar esta semana' }).click();
    await expect(s.getByLabel('Seguidores (total)', { exact: true })).toHaveValue('100');
    await s.getByLabel('Seguidores (total)', { exact: true }).fill('140');
    await s.getByRole('button', { name: 'Salvar registro' }).click();
    const d = (await comunicacao(page))!;
    expect(Object.keys(d.semanas)).toEqual([semana(0)]);
    expect(d.semanas[semana(0)].k1).toEqual({ seguidores: 140, novos: 5 });
  });

  test('reabrir depois de recarregar continua mostrando "Editar esta semana"', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await registra(page, 'k4', { 'Convites enviados': '30' });
    await page.reload();
    await page.locator('#tela[data-pronto="true"]').waitFor();
    const s = await abreSecao(page, 'k4');
    await expect(s.getByRole('button', { name: 'Editar esta semana' })).toBeVisible();
  });

  test('cancelar descarta o que foi digitado', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await registra(page, 'k1', { 'Seguidores (total)': '100' });
    const s = secao(page, 'k1');
    await s.getByRole('button', { name: 'Editar esta semana' }).click();
    await s.getByLabel('Seguidores (total)', { exact: true }).fill('999');
    await s.getByRole('button', { name: 'Cancelar' }).click();
    expect((await comunicacao(page))!.semanas[semana(0)].k1).toEqual({ seguidores: 100 });
  });
});

test.describe('Gráfico de linha da seção (CAP-20.5, CAP-20.6)', () => {
  test('sem registro ou com 1 semana mostra "Registre mais uma semana para ver a linha" e nenhum gráfico', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    const s = await abreSecao(page, 'k1');
    await expect(s.getByText('Registre mais uma semana para ver a linha')).toBeVisible();
    await expect(s.locator('.cp-g')).toHaveCount(0);
    await registra(page, 'k1', { 'Seguidores (total)': '100' });
    await expect(s.getByText('Registre mais uma semana para ver a linha')).toBeVisible();
    await expect(s.locator('.cp-g')).toHaveCount(0);
  });

  test('registrar a 2ª semana mostra a linha, com as semanas no eixo horizontal e a legenda das séries', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO, D: { comunicacao: { semanas: { [semana(1)]: { k1: { seguidores: 900, novos: 20, alcance: 100 } } }, clipping: [] } } });
    const s = await registra(page, 'k1', { 'Seguidores (total)': '1000', 'Novos seguidores na semana': '30', 'Alcance ou visualizações': '250' });
    await expect(s.getByText('Registre mais uma semana para ver a linha')).toHaveCount(0);
    const g = s.locator('.cp-g[data-tipo="linha"]');
    await expect(g.locator('polyline')).toHaveCount(3);
    await expect(g.locator('.cp-g-eixo', { hasText: `S${semana(1).slice(-2)}` })).toBeVisible();
    await expect(g.locator('.cp-g-eixo', { hasText: `S${semana(0).slice(-2)}` })).toBeVisible();
    await expect(g.getByRole('list', { name: 'Legenda' }).locator('li')).toHaveText(['Seguidores (total)', 'Novos seguidores na semana', 'Alcance ou visualizações']);
  });

  test('a tabela equivalente traz os mesmos números do gráfico', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO, D: { comunicacao: { semanas: semanas(2), clipping: [] } } });
    const s = await abreSecao(page, 'k1');
    await s.getByText('Ver como tabela').click();
    const linhas = s.locator('.cp-g-tab tbody tr');
    await expect(linhas).toHaveCount(2);
    await expect(linhas.nth(0)).toContainText('100');
    await expect(linhas.nth(1)).toContainText('200');
  });

  test('10 semanas renderizam sem erro, com 10 marcadores por série e 10 linhas na tabela', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await abre(page, [ILHA], { mandato: MANDATO, D: { comunicacao: { semanas: semanas(10), clipping: [] } } });
    const s = await abreSecao(page, 'k1');
    await expect(s.locator('.cp-g-s1 title')).toHaveCount(10);
    await expect(s.locator('.cp-g-tab tbody tr')).toHaveCount(10);
    expect(erros).toEqual([]);
  });

  test('semanas registradas fora de ordem (e na virada de ano) aparecem em ordem no gráfico', async ({ page }) => {
    const dados = { semanas: { '2027-W01': { k1: { alcance: 30 } }, '2026-W44': { k1: { alcance: 10 } }, '2026-W53': { k1: { alcance: 20 } } }, clipping: [] };
    await abre(page, [ILHA], { mandato: MANDATO, D: { comunicacao: dados } });
    const s = await abreSecao(page, 'k1');
    await s.getByText('Ver como tabela').click();
    await expect(s.locator('.cp-g-tab tbody th')).toHaveText(['2026-W44', '2026-W53', '2027-W01']);
  });
});

/* ---------- linha do tempo geral e caixinhas antigas (CAP-21.7, CAP-21.8) ---------- */
const geral = (page: Page) => page.locator('.cp-geral');
const duasSemanas = (secoes: Record<string, Record<string, number>>) => ({
  semanas: { [semana(1)]: secoes, [semana(0)]: Object.fromEntries(Object.entries(secoes).map(([k, v]) => [k, Object.fromEntries(Object.entries(v).map(([c, n]) => [c, n + 5]))])) },
  clipping: [],
});
const TODAS = { k1: { alcance: 100 }, k2: { comentarios: 10 }, k3: { recebidas: 20 }, k4: { participaram: 30 }, k5: { aparicoes: 4 } };
const caixinha = (page: Page, k: string) => page.evaluate((c) => (window as unknown as { D: { campos: Record<string, unknown> } }).D.campos[c], k);

test.describe('Linha do tempo geral (CAP-21.7)', () => {
  test('fica no fim da tela e, com 2 semanas registradas, mostra um indicador de cada seção com registro', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO, D: { comunicacao: duasSemanas({ k1: { alcance: 100 }, k3: { recebidas: 20 }, k5: { aparicoes: 4 } }) } });
    await expect(page.locator('.cp-com').locator('> *').last()).toHaveClass(/cp-geral/);
    await expect(geral(page).getByRole('heading', { name: 'Linha do tempo geral' })).toBeVisible();
    const g = geral(page).locator('.cp-g[data-tipo="linha"]');
    await expect(g.locator('polyline')).toHaveCount(3);
    await expect(g.getByRole('list', { name: 'Legenda' }).locator('li')).toHaveText(['Alcance', 'Mensagens', 'Imprensa']);
  });

  test('com as 5 seções registradas há um indicador para cada uma, na ordem do Guia', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO, D: { comunicacao: duasSemanas(TODAS) } });
    const g = geral(page).locator('.cp-g[data-tipo="linha"]');
    await expect(g.locator('polyline')).toHaveCount(5);
    await expect(g.getByRole('list', { name: 'Legenda' }).locator('li')).toHaveText(['Alcance', 'Interações', 'Mensagens', 'Campanhas', 'Imprensa']);
  });

  test('o indicador de cada seção é o número principal dela (o gráfico e a tabela trazem o mesmo valor)', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO, D: { comunicacao: duasSemanas({ k1: { seguidores: 5000, alcance: 100 } }) } });
    await geral(page).getByText('Ver como tabela').click();
    const linhas = geral(page).locator('.cp-g-tab tbody tr');
    await expect(linhas.nth(0)).toContainText('100');
    await expect(linhas.nth(1)).toContainText('105');
    await expect(geral(page).locator('.cp-g-tab')).not.toContainText('5000');
  });

  test('com menos de 2 semanas no total pede mais uma semana, sem gráfico', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await expect(geral(page).getByText('Registre mais uma semana para ver a linha do tempo geral')).toBeVisible();
    await expect(geral(page).locator('.cp-g')).toHaveCount(0);
    await registra(page, 'k1', { 'Alcance ou visualizações': '10' });
    await expect(geral(page).locator('.cp-g')).toHaveCount(0);
  });

  test('semanas de seções diferentes se somam no eixo: 1 semana em k1 e outra em k2 já formam a linha geral', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO, D: { comunicacao: { semanas: { [semana(1)]: { k1: { alcance: 10 } }, [semana(0)]: { k2: { comentarios: 3 } } }, clipping: [] } } });
    await expect(geral(page).locator('.cp-g[data-tipo="linha"]')).toBeVisible();
  });
});

test.describe('Caixinhas antigas m4.k1 a m4.k5 (CAP-21.8)', () => {
  test('registrar uma seção marca só a caixinha dela', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    expect(await caixinha(page, 'm4.k1')).toBeUndefined();
    await registra(page, 'k1', { 'Alcance ou visualizações': '10' });
    expect(await caixinha(page, 'm4.k1')).toBe(true);
    for (const k of ['m4.k2', 'm4.k3', 'm4.k4', 'm4.k5']) expect(await caixinha(page, k)).toBeUndefined();
  });

  test('seções que já tinham registro marcam a caixinha ao abrir a tela, e caixinha já marcada à mão não é desmarcada', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO, campos: { 'm4.k5': true as unknown as string }, D: { comunicacao: duasSemanas({ k2: { comentarios: 10 }, k4: { participaram: 3 } }) } });
    await expect.poll(() => caixinha(page, 'm4.k2')).toBe(true);
    expect(await caixinha(page, 'm4.k4')).toBe(true);
    expect(await caixinha(page, 'm4.k5')).toBe(true);
    expect(await caixinha(page, 'm4.k1')).toBeUndefined();
  });

  test('no Guia de verdade o Resumo continua certo: conta e lista os itens marcados, inclusive os antigos', async ({ page }) => {
    await abreGuia(page, '#/m/4/m4.metricas/1', { dados: { campos: { 'm4.k3': true } } });
    await registra(page, 'k1', { 'Alcance ou visualizações': '10' });
    await page.evaluate(() => { location.hash = '#/resumo'; });
    const resumo = page.locator('#tela');
    await expect(resumo).toContainText('Itens marcados (2 de 5)');
    await expect(resumo).toContainText('Alcance e crescimento da comunidade');
    await expect(resumo).toContainText('Mensagens recebidas e encaminhadas');
  });
});

/* ---------- fluxo completo em celular e computador, com 2 semanas registradas de verdade (relógio do navegador controlado) ---------- */
const semRolagemLateral = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

for (const tela of [{ nome: 'celular 360 px', width: 360, height: 740 }, { nome: 'computador 1280 px', width: 1280, height: 800 }]) {
  test.describe(`Fluxo completo em ${tela.nome}`, () => {
    test.use({ viewport: { width: tela.width, height: tela.height } });

    test('registra 2 semanas, vê a linha, edita a semana atual sem duplicar e confere a linha do tempo geral', async ({ page }) => {
      await page.clock.install({ time: new Date('2026-11-04T12:00:00') }); // quarta-feira da semana 2026-W45
      await abre(page, [ILHA], { mandato: MANDATO });
      expect(await semRolagemLateral(page)).toBe(true);

      let s = await registra(page, 'k1', { 'Seguidores (total)': '1000', 'Alcance ou visualizações': '100' });
      await expect(s.getByText('Registre mais uma semana para ver a linha')).toBeVisible();
      await expect(geral(page).getByText('Registre mais uma semana para ver a linha do tempo geral')).toBeVisible();
      expect(Object.keys((await comunicacao(page))!.semanas)).toEqual(['2026-W45']);

      await page.clock.setSystemTime(new Date('2026-11-11T12:00:00')); // semana seguinte
      await page.reload();
      await page.locator('#tela[data-pronto="true"]').waitFor();
      s = await abreSecao(page, 'k1');
      await expect(s.getByRole('button', { name: 'Registrar esta semana' })).toBeVisible(); // a semana nova ainda não tem registro
      s = await registra(page, 'k1', { 'Seguidores (total)': '1100', 'Alcance ou visualizações': '150' });
      await expect(s.getByText('Registre mais uma semana para ver a linha')).toHaveCount(0);
      await expect(s.locator('.cp-g[data-tipo="linha"] polyline')).toHaveCount(2);
      expect(Object.keys((await comunicacao(page))!.semanas)).toEqual(['2026-W45', '2026-W46']);
      expect(await semRolagemLateral(page)).toBe(true);

      await expect(s.getByRole('button', { name: 'Editar esta semana' })).toBeVisible();
      s = await registra(page, 'k1', { 'Alcance ou visualizações': '160' });
      const d = (await comunicacao(page))!;
      expect(Object.keys(d.semanas)).toEqual(['2026-W45', '2026-W46']);
      expect(d.semanas['2026-W46'].k1).toEqual({ seguidores: 1100, alcance: 160 });
      await expect(topo(page, 'k1')).toContainText('Último registro (2026-W46)');

      await geral(page).getByText('Ver como tabela').click();
      const linhas = geral(page).locator('.cp-g-tab tbody tr');
      await expect(linhas).toHaveCount(2);
      await expect(linhas.nth(0)).toContainText('100');
      await expect(linhas.nth(1)).toContainText('160');
      await expect(geral(page).locator('.cp-g[data-tipo="linha"] polyline')).toHaveCount(1);
      expect(await caixinha(page, 'm4.k1')).toBe(true);
      expect(await semRolagemLateral(page)).toBe(true);

      await page.reload();
      await page.locator('#tela[data-pronto="true"]').waitFor();
      await expect(topo(page, 'k1')).toContainText('Último registro (2026-W46)');
      expect((await comunicacao(page))!.semanas['2026-W46'].k1).toEqual({ seguidores: 1100, alcance: 160 });
    });

    test('registro feito em 31/12 cai na semana ISO 2026-W53 (virada de ano, CAP-40)', async ({ page }) => {
      await page.clock.install({ time: new Date('2026-12-31T12:00:00') });
      await abre(page, [ILHA], { mandato: MANDATO });
      await registra(page, 'k2', { Compartilhamentos: '4' });
      expect(Object.keys((await comunicacao(page))!.semanas)).toEqual(['2026-W53']);
      expect(await semRolagemLateral(page)).toBe(true);
    });
  });
}
