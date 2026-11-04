import { test, expect, type Page } from '@playwright/test';
import { abre } from './semente-rumo';

/* Aba Planejamento: estratégia dos objetivos e justificativas dos preditores (RM3-18). A árvore não muda com a estratégia (RM3-16). */
const ILHA = 'plano';
const TRES = ['p1', 'p2', 'p3'];
const JUST = { 'm3.just.p1': 'Foco no começo do mandato', 'm3.just.p2': 'Tema em alta na Casa', 'm3.just.p3': 'Partido precisa crescer', 'm3.just.p4': 'Ainda é cedo para ocupar espaços', 'm3.just.p5': 'Sem base para entregas agora' };
const METAS = [{ id: 'a', pred: 'p1', texto: 'Aprovar 2 projetos', status: 'nao_concluida' }, { id: 'b', pred: 'p3', texto: 'Visitar 10 escolas', status: 'nao_concluida' }];
const bloco = (page: Page) => page.getByRole('region', { name: 'Estratégia dos objetivos' });
const nos = (page: Page) => page.locator('[role="treeitem"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-no')));

test.describe('Estratégia e justificativas no Planejamento (RM3-18)', () => {
  test('mostra a estratégia escolhida acima da árvore e as 5 justificativas em bloco recolhível', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES, metas: METAS }, campos: { 'm3.est': 'a', ...JUST } });
    await expect(bloco(page)).toContainText('Estratégia dos objetivos: A');
    const just = bloco(page).locator('details');
    await expect(just.locator('li')).toHaveCount(5);
    await expect(just).not.toHaveAttribute('open', '');
    await just.locator('summary').click();
    await expect(just.locator('[data-just="p1"]')).toContainText('Foco no começo do mandato');
    await expect(just.locator('[data-just="p1"]')).toContainText('escolhido');
    await expect(just.locator('[data-just="p4"]')).toContainText('não escolhido');
    await expect(just.locator('[data-just="p4"]')).toContainText('Ainda é cedo para ocupar espaços');
    // a ordem na página: o bloco vem antes da árvore
    const yBloco = (await bloco(page).boundingBox())!.y;
    const yArvore = (await page.getByRole('tree', { name: 'Árvore do planejamento' }).boundingBox())!.y;
    expect(yBloco).toBeLessThan(yArvore);
  });

  test('na B o bloco diz B e a árvore mostra as frases do mandato', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES, metas: METAS }, campos: { 'm3.est': 'b', 'm3.obj.p1': 'Foco em três temas' } });
    await expect(bloco(page)).toContainText('Estratégia dos objetivos: B');
    await expect(page.locator('[data-no="obj-p1"]')).toContainText('Foco em três temas');
  });

  test('na C a nota lista as 3 frases da Legisla e nenhum nó novo aparece (RM3-14)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES, metas: METAS }, campos: { 'm3.est': 'c' } });
    await expect(bloco(page)).toContainText('Estratégia dos objetivos: C');
    await expect(bloco(page).getByRole('note').getByRole('listitem')).toHaveText(['Avanço Legislativo', 'Expansão de Capital Político e Influência', 'Governança Estratégica']);
    expect(await nos(page)).toEqual(['legado', 'obj-p1', 'meta-0', 'obj-p2', 'obj-p3', 'meta-1']);
  });

  test('os nós da árvore são os mesmos nas três estratégias (RM3-16)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES, metas: METAS }, campos: { 'm3.est': 'a' } });
    const emA = await nos(page);
    for (const e of ['b', 'c']) {
      await page.evaluate((x) => { (window as unknown as { D: { campos: Record<string, string> } }).D.campos['m3.est'] = x; window.dispatchEvent(new Event('guia:mudou')); }, e);
      await expect(bloco(page)).toContainText(`Estratégia dos objetivos: ${e.toUpperCase()}`);
      expect(await nos(page)).toEqual(emA);
    }
  });

  test('mandato antigo, sem estratégia nem justificativas, abre sem o bloco e sem erro', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: [], metas: [] } });
    await expect(bloco(page)).toHaveCount(0);
    await expect(page.locator('[data-ilha="plano"] .ilha-corpo')).toBeVisible();
  });

  test('mandato antigo com preditores e m3.obj abre na estratégia B (RMX-01)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES, metas: METAS }, campos: { 'm3.obj.p1': 'Foco em três temas' } });
    await expect(bloco(page)).toContainText('Estratégia dos objetivos: B');
  });

  test('planejamento arquivado segue somente leitura, sem o bloco e sem erro', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    const arq = { n: 1, criadoEm: '2026-05-01T10:00:00.000Z', legado: 'L', bandeiras: [], objetivos: [{ pid: 'p1', nome: 'Priorizar a agenda', pergunta: '', texto: 'Priorizar a agenda' }], metas: [{ id: 'z', pred: 'p1', texto: 'Meta antiga', status: 'concluida' }] };
    await abre(page, [ILHA], { D: { preditores: TRES, metas: METAS, planos: [arq] }, campos: { 'm3.est': 'a', ...JUST } });
    await expect(bloco(page)).toHaveCount(1); // o atual mostra
    await page.locator('.rm-ciclo select').selectOption('1');
    await expect(page.getByText('somente leitura')).toBeVisible();
    await expect(page.getByText('Meta antiga')).toBeVisible();
    await expect(bloco(page)).toHaveCount(0);
    expect(erros).toEqual([]);
  });
});

/* ---------- Rotinas do mandato no fim da aba (RM2-60 a 64) ---------- */
const secao = (page: Page) => page.getByRole('region', { name: 'Rotinas do mandato' });
const RQ = JSON.stringify({ plan: { data: '2030-03-04', hora: '09:00' }, mensal: { on: false }, semanal: { dur: '50 min' } });
const linhaEq = (i: number, v: { pessoa: string; cargo: string; cat: string; coord: string; lider: string }) => ({
  [`m2.p${i + 1}.esc`]: 'Escopo', [`m2.p${i + 1}.comp`]: 'Comp', [`m2.p${i + 1}.nome_cargo`]: v.cargo, [`m2.f${i + 1}`]: v.pessoa,
  [`m2.p${i + 1}.cat`]: v.cat, [`m2.p${i + 1}.coord`]: v.coord, [`m2.p${i + 1}.lider`]: v.lider,
});
const EQ = {
  'm2.n': '2', 'm2.on': '0|20',
  ...linhaEq(0, { pessoa: 'Ana Souza', cargo: 'Chefe de gabinete', cat: 'Chefia', coord: 'Chefia de área', lider: '-' }),
  ...linhaEq(20, { pessoa: 'Bia Lima', cargo: 'Coordenadora Legislativa', cat: 'Coordenação', coord: 'Legislativo', lider: '0' }),
};

test.describe('Rotinas do mandato no Planejamento (RM2-60 a RM2-64)', () => {
  test('a seção fica no fim da aba, depois da árvore, com as rotinas ligadas, frequência, participantes, duração e início (RM2-60)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES, metas: METAS }, campos: { 'm2.rq': RQ } });
    await expect(secao(page)).toBeVisible();
    const yArvore = (await page.getByRole('tree', { name: 'Árvore do planejamento' }).boundingBox())!.y;
    expect((await secao(page).boundingBox())!.y).toBeGreaterThan(yArvore);
    const linhas = secao(page).locator('tbody tr');
    await expect(linhas).toHaveCount(4); // a mensal está desligada
    await expect(linhas.nth(0)).toContainText('Planejamento estratégico');
    await expect(linhas.nth(0)).toContainText('Quadrimestralmente');
    await expect(linhas.nth(0)).toContainText('Todos');
    await expect(linhas.nth(0)).toContainText('2 períodos de 6h');
    await expect(linhas.nth(0)).toContainText('04/03/2030 às 09:00');
    await expect(secao(page)).not.toContainText('Monitoramento de avanços');
    await expect(linhas.nth(1)).toContainText('50 min'); // a edição de duração do mandato vale
    await expect(linhas.nth(1)).toContainText('início ainda não definido');
  });

  test('sem nenhum início definido mostra "início ainda não definido" e o link para a Missão 2 (RM2-62)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES, metas: METAS } });
    await expect(secao(page).locator('tbody tr')).toHaveCount(5);
    await expect(secao(page).locator('[data-sem-inicio]')).toContainText('Início ainda não definido');
    await expect(secao(page).getByRole('link', { name: /Missão 2/ })).toHaveAttribute('href', '#/m/2/m2.gestao');
    await expect(secao(page).locator('tbody td', { hasText: 'início ainda não definido' })).toHaveCount(5);
  });

  test('com ao menos um início definido, o aviso e o link saem (RM2-62)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES, metas: METAS }, campos: { 'm2.rq': RQ } });
    await expect(secao(page).locator('[data-sem-inicio]')).toHaveCount(0);
  });

  test('o botão gera o PDF do organograma e rotinas: chama a impressão com os dois blocos (RM2-61)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES, metas: METAS }, campos: { ...EQ, 'm2.rq': RQ } });
    await page.evaluate(() => {
      const w = window as unknown as { __print: string[][] };
      w.__print = [];
      window.print = () => { w.__print.push([...document.querySelectorAll('.pdf-org section')].map((s) => (s as HTMLElement).dataset.pdf ?? '')); };
    });
    await secao(page).getByRole('button', { name: 'Gerar PDF do organograma e rotinas' }).click();
    expect(await page.evaluate(() => (window as unknown as { __print: string[][] }).__print)).toEqual([['organograma', 'rotinas']]);
    expect(await page.evaluate(() => document.body.classList.contains('imprimindo-org'))).toBe(false);
  });

  test('a seção entra na impressão do planejamento completo, sem os botões (RM2-64)', async ({ page }) => {
    await abre(page, [ILHA], { D: { preditores: TRES, metas: METAS }, campos: { 'm2.rq': RQ } });
    await page.emulateMedia({ media: 'print' });
    const r = await page.evaluate(() => {
      const s = document.querySelector('[data-rotinas-plano]') as HTMLElement;
      const dentro = !!s.closest('.rm-plano[data-imprime]');
      const visivel = (e: Element) => getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility === 'visible';
      return { dentro, tabela: visivel(s.querySelector('table')!), botao: visivel(s.querySelector('button')!.parentElement!), aviso: s.querySelector('[data-sem-inicio]') ? 'tem' : 'nao' };
    });
    expect(r.dentro).toBe(true);
    expect(r.tabela).toBe(true);
    expect(r.botao).toBe(false);
  });

  test('planejamento arquivado segue somente leitura, sem a seção de rotinas (RM2-60)', async ({ page }) => {
    const arq = { n: 1, criadoEm: '2026-05-01T10:00:00.000Z', legado: 'L', bandeiras: [], objetivos: [{ pid: 'p1', nome: 'Priorizar a agenda', pergunta: '', texto: 'Priorizar a agenda' }], metas: [{ id: 'z', pred: 'p1', texto: 'Meta antiga', status: 'concluida' }] };
    await abre(page, [ILHA], { D: { preditores: TRES, metas: METAS, planos: [arq] }, campos: { 'm2.rq': RQ } });
    await expect(secao(page)).toHaveCount(1);
    await page.locator('.rm-ciclo select').selectOption('1');
    await expect(page.getByText('somente leitura')).toBeVisible();
    await expect(secao(page)).toHaveCount(0);
  });
});
