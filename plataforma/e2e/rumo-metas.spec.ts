import { test, expect, type Page } from '@playwright/test';
import { abre, dadoDe, EQUIPE, MANDATO } from './semente-rumo';

const ILHA = 'rumo-metas';
type M = { id: string; pred?: string; texto?: string; resp?: string; apoio?: string; respCad?: number | null; apoioCad?: number[]; alcancavel?: boolean; status?: string };
const metasDe = async (page: Page) => (await dadoDe(page, 'metas')) as M[];
const meta = (page: Page, i: number) => page.locator(`[data-meta="${i}"]`);
const texto = (page: Page, i: number) => meta(page, i).getByRole('textbox', { name: /no formato SMART/ });
const letra = (page: Page, i: number, l: string) => meta(page, i).locator(`[data-letra="${l}"]`);
const resp = (page: Page, i: number) => meta(page, i).getByRole('group', { name: /^Responsável direto/ });
const apoio = (page: Page, i: number) => meta(page, i).getByRole('group', { name: /^Apoios/ });
const mkMetas = (n: number, pred = 'p1'): M[] => Array.from({ length: n }, (_, i) => ({ id: `m${i}`, pred, texto: `Meta ${i}` }));
const COM_PREDITOR = { D: { preditores: ['p1'] } };

test.describe('Acrescentar meta e limites (RUM-30.1, RUM-30.2, RUM-30.15)', () => {
  test('sem preditor, "Acrescentar meta" está desabilitado e aponta para a etapa de preditores', async ({ page }) => {
    await abre(page, [ILHA]);
    await expect(page.getByRole('button', { name: 'Acrescentar meta' })).toBeDisabled();
    await expect(page.getByText('Escolha os preditores na etapa anterior')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ir para os preditores' })).toHaveAttribute('href', '#/m/3/m3.preditores');
  });

  test('acrescentar a um objetivo grava a meta ligada a ele, com status não concluída', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1', 'p2'] } });
    await page.getByRole('button', { name: 'Acrescentar meta a Pautar os debates' }).click();
    const l = await metasDe(page);
    expect(l).toHaveLength(1);
    expect(l[0].pred).toBe('p2');
    expect(l[0].status).toBe('nao_concluida');
    await expect(meta(page, 0).getByLabel('Objetivo específico da meta 01')).toHaveValue('p2');
  });

  test('a quinta meta do mesmo objetivo é bloqueada com a mensagem do limite do Guia', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1'], metas: mkMetas(4) } });
    await page.getByRole('button', { name: 'Acrescentar meta a Priorizar a agenda' }).click();
    await expect(page.locator('#avisos')).toContainText('no máximo 4 metas (limite do Guia)');
    expect(await metasDe(page)).toHaveLength(4);
  });

  test('mover uma meta para um objetivo que já tem 4 também é recusado', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1', 'p2'], metas: [...mkMetas(4), { id: 'x', pred: 'p2', texto: 'Outra' }] } });
    await meta(page, 4).getByLabel('Objetivo específico da meta 05').selectOption('p1');
    await expect(page.locator('#avisos')).toContainText('no máximo 4 metas');
    expect((await metasDe(page))[4].pred).toBe('p2');
  });

  test('meta sem objetivo aparece em bloco próprio, com aviso, e escolher o objetivo a leva ao grupo', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1'], metas: [{ id: 'a', pred: '', texto: 'Visitar 10 escolas' }] } });
    const bloco = page.locator('[data-objetivo="sem"]');
    await expect(bloco).toContainText('não estão ligadas a um objetivo específico');
    await meta(page, 0).getByLabel('Objetivo específico da meta 01').selectOption('p1');
    await expect(bloco).toHaveCount(0);
    expect((await metasDe(page))[0].pred).toBe('p1');
  });

  test('remover uma meta com texto pede confirmação', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1'], metas: mkMetas(2) } });
    page.once('dialog', (d) => d.dismiss());
    await page.getByRole('button', { name: 'Remover a meta 01' }).click();
    expect(await metasDe(page)).toHaveLength(2);
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Remover a meta 01' }).click();
    await expect.poll(async () => (await metasDe(page)).length).toBe(1);
  });
});

test.describe('Retorno SMART (RUM-31.3, RUM-31.7, RUM-31.8, RUM-31.9)', () => {
  const EXEMPLO = 'Aprovar 2 projetos de lei sobre educação até dezembro de 2027';

  test('a meta de exemplo atende S, M, T e R (pelo vínculo); confirmar a capacidade da equipe acende A', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1'], metas: [{ id: 'a', pred: 'p1' }] } });
    await texto(page, 0).fill(EXEMPLO);
    for (const l of ['S', 'M', 'R', 'T']) await expect(letra(page, 0, l)).toHaveAttribute('data-ok', 'true');
    await expect(letra(page, 0, 'A')).toHaveAttribute('data-ok', 'false');
    await expect(meta(page, 0).locator('[data-pontos]')).toHaveText('4 de 5 letras atendidas');
    await expect(letra(page, 0, 'A')).toHaveAttribute('aria-label', 'Alcançável: falta');
    await page.getByLabel('Cabe na capacidade da equipe nos 4 meses?').check();
    await expect(letra(page, 0, 'A')).toHaveAttribute('data-ok', 'true');
    await expect(meta(page, 0).locator('[data-pontos]')).toHaveText('5 de 5 letras atendidas');
    const m = (await metasDe(page))[0];
    expect(m.texto).toBe(EXEMPLO);
    expect(m.alcancavel).toBe(true);
  });

  test('o retorno SMART aparece em até 300 ms depois de digitar (RUM-31.3)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1'], metas: [{ id: 'a', pred: 'p1' }] } });
    await texto(page, 0).fill(EXEMPLO);
    for (const l of ['S', 'M', 'R', 'T']) await expect(letra(page, 0, l)).toHaveAttribute('data-ok', 'true', { timeout: 300 });
    await expect(meta(page, 0).locator('[data-pontos]')).toHaveText('4 de 5 letras atendidas', { timeout: 300 });
  });

  test('texto que não atende mostra a dica da primeira letra que falta, que pode ser ignorada', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1'], metas: [{ id: 'a', pred: 'p1' }] } });
    await texto(page, 0).fill('Melhorar a educação');
    await expect(letra(page, 0, 'S')).toHaveAttribute('data-ok', 'false');
    await expect(letra(page, 0, 'M')).toHaveAttribute('data-ok', 'false');
    await expect(letra(page, 0, 'T')).toHaveAttribute('data-ok', 'false');
    await expect(meta(page, 0).locator('[data-dica="S"]')).toContainText('verbo no infinitivo');
    await meta(page, 0).getByRole('button', { name: 'Ignorar dica' }).click();
    await expect(meta(page, 0).locator('[data-dica]')).toHaveCount(0);
  });

  test('sem objetivo, a letra R não é atendida', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1'], metas: [{ id: 'a', pred: '' }] } });
    await texto(page, 0).fill(EXEMPLO);
    await expect(letra(page, 0, 'R')).toHaveAttribute('data-ok', 'false');
  });

  test('"Enviar e-mail semanal" mostra o alerta "Meta não é tarefa diária"', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1'], metas: [{ id: 'a', pred: 'p1' }] } });
    await texto(page, 0).fill('Enviar e-mail semanal aos assessores');
    await expect(meta(page, 0).getByRole('status').filter({ hasText: 'Meta não é tarefa diária' })).toBeVisible();
    await texto(page, 0).fill(EXEMPLO);
    await expect(meta(page, 0).getByText('Meta não é tarefa diária')).toHaveCount(0);
  });

  test('digitar espaços e HTML mantém o texto como foi escrito', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: ['p1'], metas: [{ id: 'a', pred: 'p1' }] } });
    await texto(page, 0).pressSequentially('Aprovar <script>x</script> leis ');
    expect((await metasDe(page))[0].texto).toBe('Aprovar <script>x</script> leis ');
  });
});

test.describe('Responsável e apoios (RUM-32.10, RUM-32.12, RUM-32.13)', () => {
  const semente = { campos: EQUIPE, mandato: MANDATO, D: { preditores: ['p1'], metas: [{ id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos' }] } };

  test('o responsável vem das cadeiras nomeadas da Missão 2 e grava cadeira e nome', async ({ page }) => {
    await abre(page, [ILHA], semente);
    await expect(resp(page, 0).getByRole('button')).toHaveText([/Ana Souza/, /Bruno Lima/, /Carla Dias/, /Davi Rocha/]);
    await resp(page, 0).getByRole('button', { name: /Bruno Lima/ }).click();
    const m = (await metasDe(page))[0];
    expect([m.respCad, m.resp]).toEqual([1, 'Bruno Lima']);
    await expect(resp(page, 0).getByRole('button', { name: /Bruno Lima/ })).toHaveAttribute('aria-pressed', 'true');
  });

  test('o responsável também aceita texto livre, que desfaz a escolha da cadeira', async ({ page }) => {
    await abre(page, [ILHA], semente);
    await resp(page, 0).getByRole('button', { name: /Bruno Lima/ }).click();
    await meta(page, 0).getByLabel('Ou outro nome').fill('Dona Maria');
    const m = (await metasDe(page))[0];
    expect([m.respCad, m.resp]).toEqual([null, 'Dona Maria']);
  });

  test('apoio igual ao responsável é recusado; apoios de 0 a 3, no máximo', async ({ page }) => {
    await abre(page, [ILHA], semente);
    await resp(page, 0).getByRole('button', { name: /Bruno Lima/ }).click();
    await apoio(page, 0).getByRole('button', { name: 'Bruno Lima' }).click();
    await expect(page.locator('#avisos')).toContainText('O apoio precisa ser diferente do responsável direto.');
    expect((await metasDe(page))[0].apoioCad ?? []).toEqual([]);
    await apoio(page, 0).getByRole('button', { name: 'Carla Dias' }).click();
    await apoio(page, 0).getByRole('button', { name: 'Davi Rocha' }).click();
    await apoio(page, 0).getByRole('button', { name: 'Ana Souza' }).click();
    let m = (await metasDe(page))[0];
    expect(m.apoioCad).toEqual([2, 3, 0]);
    expect(m.apoio).toBe('Carla Dias; Davi Rocha; Ana Souza');
    await meta(page, 0).getByLabel(/^Outros apoios/).fill('Pedro');
    await meta(page, 0).getByLabel(/^Outros apoios/).blur();
    await expect(page.locator('#avisos')).toContainText('Escolha no máximo 3 pessoas de apoio.');
    m = (await metasDe(page))[0];
    expect(m.apoio).toBe('Carla Dias; Davi Rocha; Ana Souza');
    await apoio(page, 0).getByRole('button', { name: 'Ana Souza' }).click(); // tirar um
    await meta(page, 0).getByLabel(/^Outros apoios/).fill('Pedro');
    await meta(page, 0).getByLabel(/^Outros apoios/).blur();
    await expect.poll(async () => (await metasDe(page))[0].apoio).toBe('Carla Dias; Davi Rocha; Pedro');
  });

  test('o texto livre do responsável igual a um apoio da equipe também é recusado', async ({ page }) => {
    await abre(page, [ILHA], semente);
    await apoio(page, 0).getByRole('button', { name: 'Carla Dias' }).click();
    await meta(page, 0).getByLabel('Ou outro nome').fill('carla dias');
    await expect(page.locator('#avisos')).toContainText('diferente do responsável direto');
    expect((await metasDe(page))[0].resp ?? '').toBe('');
  });

  test('sem cadeiras nomeadas o texto livre funciona e o aviso aponta para a Missão 2', async ({ page }) => {
    await abre(page, [ILHA], { campos: { 'm2.on': '0' }, D: { preditores: ['p1'], metas: [{ id: 'a', pred: 'p1' }] } });
    await expect(meta(page, 0)).toContainText('A lista de pessoas vem da Missão 2');
    await meta(page, 0).getByLabel('Nome do responsável').fill('Joana');
    await meta(page, 0).getByLabel(/^Quem dá suporte/).fill('Pedro; Rita');
    await meta(page, 0).getByLabel(/^Quem dá suporte/).blur();
    await expect.poll(async () => (await metasDe(page))[0].apoio).toBe('Pedro; Rita');
    expect((await metasDe(page))[0].resp).toBe('Joana');
  });

  test('cadeira renomeada mostra o nome novo; cadeira removida mantém o nome gravado como "fora da equipe"', async ({ page }) => {
    await abre(page, [ILHA], {
      campos: { ...EQUIPE, 'm2.f2': 'Bruno Novo', 'm2.on': '0|1' },
      D: { preditores: ['p1'], metas: [{ id: 'a', pred: 'p1', texto: 'x', respCad: 1, resp: 'Bruno Lima', apoioCad: [3], apoio: 'Davi Rocha' }] },
    });
    await expect(resp(page, 0).getByRole('button', { name: /Bruno Novo/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(meta(page, 0).getByText('Davi Rocha: fora da equipe da Missão 2.')).toBeVisible();
  });
});

test.describe('Contador (RUM-30.14) e metas antigas (RUM-70)', () => {
  const d = (n: number) => ({ preditores: ['p1', 'p2', 'p3'], metas: Array.from({ length: n }, (_, i) => ({ id: `m${i}`, pred: ['p1', 'p2', 'p3'][i % 3], texto: `Meta ${i}` })) });
  const cont = (p: Page) => p.locator('.rm-metas .contador');
  for (const [n, classe] of [[9, 'falta'], [10, 'ok'], [16, 'ok'], [17, 'falta']] as const) {
    test(`com ${n} metas o contador fica ${classe === 'ok' ? 'verde' : 'em aviso'}`, async ({ page }) => {
      await abre(page, [ILHA], { D: d(n) });
      await expect(cont(page)).toHaveClass(new RegExp(classe));
      await expect(cont(page)).toContainText(`${n} metas`);
    });
  }

  test('o aviso não bloqueia: com 17 metas ainda dá para acrescentar uma', async ({ page }) => {
    /* 17 metas, só 3 ligadas a objetivo (o limite de 4 por objetivo não é o que se testa aqui) */
    const metas = Array.from({ length: 17 }, (_, i) => ({ id: `m${i}`, pred: i < 3 ? ['p1', 'p2', 'p3'][i] : '', texto: `Meta ${i}` }));
    await abre(page, [ILHA], { D: { preditores: ['p1', 'p2', 'p3'], metas } });
    await expect(cont(page)).toContainText('o Guia pede de 10 a 16');
    await page.getByRole('button', { name: /^Acrescentar meta a / }).first().click();
    await expect(page.locator('[data-n-metas]')).toHaveAttribute('data-n-metas', '18');
  });

  test('metas antigas (só pred, texto, resp, apoio) abrem sem erro, sem gravar e sem perder texto', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    const antigas = [{ id: 'a', pred: 'p1', texto: '<b>Aprovar</b> 2 projetos<br>de lei', resp: 'Fulano', apoio: 'Beltrano e Ciclano' }, { id: 'b', pred: 'p9', texto: 'Meta de preditor desconhecido' }, { id: 'c' }];
    await abre(page, [ILHA], { campos: EQUIPE, D: { preditores: ['p1'], metas: antigas } });
    await expect(texto(page, 0)).toHaveValue('Aprovar 2 projetos\nde lei');
    await expect(meta(page, 0).getByLabel('Ou outro nome')).toHaveValue('Fulano');
    await expect(meta(page, 0).getByLabel(/^Outros apoios/)).toHaveValue('Beltrano e Ciclano');
    await expect(texto(page, 1)).toHaveValue('Meta de preditor desconhecido');
    await expect(page.locator('[data-objetivo="sem"] .rm-meta')).toHaveCount(2);
    expect(await metasDe(page)).toEqual(antigas);
    expect(erros).toEqual([]);
    await texto(page, 1).fill('Meta de preditor desconhecido, editada');
    const l = await metasDe(page);
    expect(l[0]).toEqual(antigas[0]); // editar outra meta não toca nesta
    expect(l[1].texto).toBe('Meta de preditor desconhecido, editada');
  });
});
