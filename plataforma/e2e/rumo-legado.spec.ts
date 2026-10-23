import { test, expect, type Page } from '@playwright/test';
import { abre, camposDe, dadoDe, MANDATO } from './semente-rumo';

const ILHA = 'rumo-legado';
const BANDEIRAS = { 'm3.mural': 'Educação; Saúde', 'm3.b1': 'Educação', 'm3.b2': 'Saúde' };
const passo = (page: Page, rot: string) => page.locator('.rm-passo', { hasText: rot });
const protagonista = (page: Page) => page.getByRole('textbox', { name: /^Protagonista( Usar .*)?$/ });
const continuar = (page: Page) => page.getByRole('button', { name: 'Continuar' });
const manchete = (page: Page) => page.getByLabel('Texto final da manchete');
const jornalH2 = (page: Page) => page.locator('.rm-jornal').getByRole('heading', { level: 2 });
type Legado = { fechado: boolean; manual: boolean; manchete: string; el: { cargo: string }; rascunhos: unknown[] };
const legadoDe = async (page: Page) => ((await dadoDe(page, 'rumo')) as { legado: Legado }).legado;

/** Percorre os 4 passos com a Ana Souza, uma entrega, um resultado e a reeleição. */
async function completa(page: Page, cargo = 'Reeleição a Deputado(a) Estadual') {
  await protagonista(page).fill('Ana Souza');
  await continuar(page).click();
  await page.getByLabel('Principal entrega').fill('colocou a Educação no centro do debate');
  await continuar(page).click();
  await page.getByLabel('Resultado verificável').fill('zerou a fila da educação infantil');
  await continuar(page).click();
  await page.getByLabel('Cargo em quatro anos').selectOption(cargo);
}

test.describe('Os 4 passos (RUM-10.1)', () => {
  test('abre no passo 1 com o marcador; os outros ficam bloqueados até completar o anterior', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await expect(page.getByRole('heading', { name: 'Passo 1 de 4 · Protagonista' })).toBeVisible();
    await expect(passo(page, 'Protagonista')).toHaveAttribute('aria-current', 'step');
    for (const r of ['Entrega', 'Resultado', 'Cargo']) await expect(passo(page, r)).toHaveAttribute('aria-disabled', 'true');
    await expect(continuar(page)).toBeDisabled();
    await passo(page, 'Resultado').click({ force: true });
    await expect(page.getByRole('heading', { name: 'Passo 1 de 4 · Protagonista' })).toBeVisible();
  });

  test('completar um passo acende o item e libera o próximo', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await protagonista(page).fill('Ana Souza');
    await expect(passo(page, 'Protagonista')).toHaveClass(/ok/);
    await expect(passo(page, 'Entrega')).toHaveAttribute('aria-disabled', 'false');
    await continuar(page).click();
    await expect(page.getByRole('heading', { name: 'Passo 2 de 4 · Entrega' })).toBeVisible();
    await expect(passo(page, 'Entrega')).toHaveAttribute('aria-current', 'step');
    await page.getByRole('button', { name: 'Voltar' }).click();
    await expect(protagonista(page)).toHaveValue('Ana Souza');
  });

  test('o nome do mandato vira o protagonista com um clique', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await page.getByRole('button', { name: 'Usar Ana Souza' }).click();
    await expect(protagonista(page)).toHaveValue('Ana Souza');
  });
});

test.describe('Cargo e manchete composta (RUM-11.2, RUM-10.3, RUM-10.4)', () => {
  test('escolher o cargo no passo 4 grava m3.cargo e a manchete composta contém o cargo', async ({ page }) => {
    await abre(page, [ILHA], { campos: BANDEIRAS, mandato: MANDATO });
    await completa(page);
    const c = await camposDe(page);
    expect(c['m3.cargo']).toBe('Reeleição a Deputado(a) Estadual');
    expect(c['m3.legado']).toBe('Ana Souza: colocou a Educação no centro do debate, zerou a fila da educação infantil e conquista a reeleição a Deputado(a) Estadual');
    await expect(manchete(page)).toHaveValue(c['m3.legado']);
    await expect(jornalH2(page)).toContainText('conquista a reeleição a Deputado(a) Estadual');
    await expect(page.locator('.rm-jn-fina')).toHaveText('Educação, Saúde · Reeleição a Deputado(a) Estadual');
  });

  test('"Outro" pede o nome do cargo e o usa na manchete', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await completa(page, 'Outro');
    await page.getByLabel('Qual cargo?').fill('Secretária de Estado');
    await expect(jornalH2(page)).toContainText('se candidata a Secretária de Estado');
    expect((await camposDe(page))['m3.cargo']).toBe('Secretária de Estado');
  });

  test('editar um elemento atualiza o jornal em menos de 300 ms', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await completa(page);
    await page.getByRole('button', { name: 'Voltar' }).click(); // do passo 4 para o 3
    await page.getByLabel('Resultado verificável').fill('dobrou o número de vagas em creches');
    await expect(jornalH2(page)).toContainText('dobrou o número de vagas em creches', { timeout: 300 });
  });

  test('os cargos oferecidos vêm do cargo atual: Assembleia não oferece Presidente', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await completa(page, 'Governador(a)');
    const opcoes = await page.getByLabel('Cargo em quatro anos').locator('option').allTextContents();
    expect(opcoes[1]).toBe('Reeleição a Deputado(a) Estadual');
    expect(opcoes).not.toContain('Presidente');
  });

  test('mandato sem cargo cadastrado mostra a lista completa e não bloqueia', async ({ page }) => {
    await abre(page, [ILHA], { mandato: { ...MANDATO, cargo: '' } });
    await completa(page, 'Presidente');
    const opcoes = await page.getByLabel('Cargo em quatro anos').locator('option').allTextContents();
    expect(opcoes).toEqual(expect.arrayContaining(['Presidente', 'Vereador(a)', 'Deputado(a) Estadual', 'Outro']));
    await expect(page.getByText('O cargo atual do mandato não está cadastrado')).toBeVisible();
    expect((await camposDe(page))['m3.cargo']).toBe('Presidente');
  });
});

test.describe('Texto manual e recomposição (RUM-11.6, RUM-11.7)', () => {
  test('editar o texto final à mão passa a usá-lo; os passos não o alteram; Recompor volta à composição', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await completa(page);
    const composta = await manchete(page).inputValue();
    await manchete(page).fill('Texto escrito pela equipe sobre a Reeleição a Deputado(a) Estadual');
    expect((await legadoDe(page)).manual).toBe(true);
    await page.getByRole('button', { name: 'Voltar' }).click(); // do passo 4 para o 3
    await page.getByLabel('Resultado verificável').fill('outro resultado');
    await expect(manchete(page)).toHaveValue('Texto escrito pela equipe sobre a Reeleição a Deputado(a) Estadual');
    expect((await camposDe(page))['m3.legado']).toContain('Texto escrito pela equipe');

    await page.getByRole('button', { name: 'Recompor' }).click();
    await expect(manchete(page)).toHaveValue(composta.replace('zerou a fila da educação infantil', 'outro resultado'));
    expect((await legadoDe(page)).manual).toBe(false);
    await expect(page.getByRole('button', { name: 'Recompor' })).toHaveCount(0);
  });

  test('manchete que não cita o cargo mostra o aviso e grava mesmo assim', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await completa(page, 'Senador(a)');
    await manchete(page).fill('Ana Souza zerou a fila das creches');
    await expect(page.getByText('A manchete ainda não diz o cargo postulado')).toBeVisible();
    expect((await camposDe(page))['m3.legado']).toBe('Ana Souza zerou a fila das creches');
  });

  test('manchete com mais de 280 caracteres avisa que manchetes curtas funcionam melhor', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await manchete(page).fill('x'.repeat(281));
    await expect(page.getByText('Manchetes curtas funcionam melhor')).toBeVisible();
  });
});

test.describe('Fechar a edição (RUM-11.8)', () => {
  test('só habilita com os 4 passos; ao fechar grava m3.legado, mostra o selo e marca o exercício como feito', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    const fechar = page.getByRole('button', { name: 'Fechar a edição' });
    await expect(fechar).toBeDisabled();
    await expect(page.getByText('Edição fechada')).toHaveCount(0);
    await completa(page);
    await expect(fechar).toBeEnabled();
    await fechar.click();
    await expect(page.locator('.rm-jn-carimbo')).toHaveText('Edição fechada');
    expect((await legadoDe(page)).fechado).toBe(true);
    expect((await camposDe(page))['m3.legado']).toContain('Ana Souza');
    expect(await dadoDe(page, 'feitos')).toEqual({ 'm3.legado': true });
    await expect(page.locator('#avisos')).toContainText('Edição fechada');
  });

  test('reabrir a edição tira o selo e desfaz o "feito"', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await completa(page);
    await page.getByRole('button', { name: 'Fechar a edição' }).click();
    await page.getByRole('button', { name: 'Reabrir a edição' }).click();
    await expect(page.locator('.rm-jn-carimbo')).toHaveCount(0);
    expect(await dadoDe(page, 'feitos')).toEqual({ 'm3.legado': false });
  });

  test('o nome do jornal é editável e fica gravado', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await page.getByLabel('Nome do jornal').fill('Diário do Gabinete');
    await expect(page.getByRole('article', { name: 'Primeira página de Diário do Gabinete' })).toBeVisible();
    expect(((await dadoDe(page, 'rumo')) as { legado: { jornal: string } }).legado.jornal).toBe('Diário do Gabinete');
  });
});

test.describe('Mandato antigo (RUM-70)', () => {
  const antigo = { 'm3.legado': 'Joaquim José: conheça a estratégia que colocou a Educação no centro do debate', 'm3.cargo': 'Governador(a)', 'm3.b1': 'Educação' };

  test('abre mostrando a manchete antiga como texto manual, no jornal, sem apagar nada', async ({ page }) => {
    await abre(page, [ILHA], { campos: antigo, mandato: MANDATO });
    await expect(manchete(page)).toHaveValue(antigo['m3.legado']);
    await expect(jornalH2(page)).toHaveText(antigo['m3.legado']);
    await expect(page.getByText('Este texto foi escrito à mão')).toBeVisible();
    expect(await dadoDe(page, 'rumo')).toBeUndefined(); // nada gravado até a primeira edição
    await expect(page.getByRole('button', { name: 'Fechar a edição' })).toBeEnabled(); // manual com texto
  });

  test('o cargo antigo aparece na linha de apoio e a primeira edição preserva o texto e o cargo', async ({ page }) => {
    await abre(page, [ILHA], { campos: antigo, mandato: MANDATO });
    await expect(page.locator('.rm-jn-fina')).toHaveText('Educação · Governador(a)');
    await page.getByLabel('Nome do jornal').fill('Diário do Gabinete');
    const c = await camposDe(page);
    expect(c['m3.legado']).toBe(antigo['m3.legado']);
    expect(c['m3.cargo']).toBe('Governador(a)');
  });
});

test('HTML digitado em qualquer passo aparece como texto no jornal', async ({ page }) => {
  await abre(page, [ILHA], { mandato: MANDATO });
  await protagonista(page).fill('<b>Ana</b><script>window.__xss=1</script>');
  await expect(jornalH2(page)).toContainText('<b>Ana</b><script>window.__xss=1</script>');
  expect(await page.locator('.rm-jornal b, .rm-jornal script').count()).toBe(0);
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
});

/* ---------- modelos e rascunhos dos grupos (T17) ---------- */
const modelo = (page: Page, rot: string) => page.locator('.rm-modelo', { hasText: rot });
type Rasc = { id: string; grupo: string; manchete: string; cargo: string; el?: Record<string, string> };
const rascunhos = async (page: Page) => (await legadoDe(page)).rascunhos as Rasc[];

/** a gaveta começa fechada enquanto não há rascunhos */
async function abreGaveta(page: Page) {
  if (!(await page.locator('.rm-gaveta[open]').count())) await page.locator('.rm-gaveta > summary').click();
}

async function guarda(page: Page, o: { grupo: string; manchete: string; cargo?: string; protagonista?: string; entrega?: string; resultado?: string }) {
  await abreGaveta(page);
  await page.getByLabel('Nome do grupo').fill(o.grupo);
  await page.getByLabel('Manchete do grupo').fill(o.manchete);
  if (o.cargo) await page.getByLabel('Cargo do grupo').selectOption(o.cargo);
  if (o.protagonista || o.entrega || o.resultado) {
    const aberto = await page.locator('.rm-rasc-form details[open]').count();
    if (!aberto) await page.locator('.rm-rasc-form summary').click();
    if (o.protagonista) await page.getByLabel('Protagonista do grupo').fill(o.protagonista);
    if (o.entrega) await page.getByLabel('Entrega do grupo').fill(o.entrega);
    if (o.resultado) await page.getByLabel('Resultado do grupo').fill(o.resultado);
  }
  await page.getByRole('button', { name: 'Guardar rascunho' }).click();
}

test.describe('Modelos de manchete (RUM-52.1, RUM-52.2)', () => {
  test('os 4 cartões mostram o selo "sugestão da plataforma"', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await expect(page.locator('.rm-modelo')).toHaveCount(4);
    for (const rot of ['Reeleição', 'Candidatura a outro cargo', 'Da Câmara ao Senado', 'Entrega legislativa']) {
      await expect(modelo(page, rot)).toContainText('sugestão da plataforma');
    }
  });

  test('escolher "Reeleição" pré-preenche os 4 passos com nome e bandeiras, e cada lacuna segue editável', async ({ page }) => {
    await abre(page, [ILHA], { campos: BANDEIRAS, mandato: MANDATO });
    await page.getByRole('button', { name: 'Usar o modelo Reeleição' }).click();
    for (const r of ['Protagonista', 'Entrega', 'Resultado', 'Cargo']) await expect(passo(page, r)).toHaveClass(/ok/);
    await expect(protagonista(page)).toHaveValue('Ana Souza');
    await continuar(page).click();
    await expect(page.getByLabel('Principal entrega')).toHaveValue('liderou a agenda de educação');
    await page.getByLabel('Principal entrega').fill('liderou a agenda de educação e de saúde');
    await expect(jornalH2(page)).toContainText('liderou a agenda de educação e de saúde');
    const c = await camposDe(page);
    expect(c['m3.cargo']).toBe('Reeleição a Deputado(a) Estadual');
    expect(c['m3.legado']).toContain('conquista a reeleição a Deputado(a) Estadual');
    expect(((await dadoDe(page, 'rumo')) as { legado: { modelo: string } }).legado.modelo).toBe('reeleicao');
  });

  test('modelo sem bandeira prioritária usa a lacuna neutra, sem "undefined"', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await page.getByRole('button', { name: 'Usar o modelo Entrega legislativa' }).click();
    await expect(manchete(page)).toHaveValue(/colocou a pauta prioritária no centro do debate político/);
    await expect(manchete(page)).not.toHaveValue(/undefined/);
  });

  test('com texto já escrito, pede confirmação antes de substituir; recusar mantém tudo', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await protagonista(page).fill('Joaquim José');
    let msg = '';
    page.once('dialog', (d) => { msg = d.message(); d.dismiss(); });
    await page.getByRole('button', { name: 'Usar o modelo Reeleição' }).click();
    expect(msg).toContain('Substituir');
    await expect(protagonista(page)).toHaveValue('Joaquim José');
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Usar o modelo Reeleição' }).click();
    await expect(protagonista(page)).toHaveValue('Ana Souza');
  });
});

test.describe('Rascunhos dos grupos (RUM-52.3, RUM-52.4, RUM-11.9)', () => {
  test('guardar um rascunho grava grupo, manchete e cargo e o lista em cartão', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await guarda(page, { grupo: 'Grupo Azul', manchete: 'Ana Souza, a mais votada, vai ao Senado', cargo: 'Senador(a)' });
    await expect(page.locator('.rm-rascunhos li')).toHaveCount(1);
    await expect(page.locator('[data-rascunho]')).toContainText('Grupo Azul');
    await expect(page.locator('[data-rascunho]')).toContainText('Senador(a)');
    expect(await rascunhos(page)).toEqual([expect.objectContaining({ grupo: 'Grupo Azul', manchete: 'Ana Souza, a mais votada, vai ao Senado', cargo: 'Senador(a)' })]);
    await page.reload();
    await page.locator('#tela[data-pronto="true"]').waitFor();
    await expect(page.locator('.rm-rascunhos li')).toHaveCount(1);
  });

  test('sem nome do grupo ou sem manchete não guarda e avisa', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await abreGaveta(page);
    await page.getByLabel('Manchete do grupo').fill('Só a manchete');
    await page.getByRole('button', { name: 'Guardar rascunho' }).click();
    await expect(page.locator('#avisos')).toContainText('Escreva o nome do grupo e a manchete');
    expect(await dadoDe(page, 'rumo')).toBeUndefined();
  });

  test('"Usar como base" carrega manchete, cargo e elementos do rascunho nos passos', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await guarda(page, { grupo: 'Grupo Azul', manchete: 'Ana Souza: zerou a fila das creches e conquista a reeleição a Deputado(a) Estadual', cargo: 'Reeleição a Deputado(a) Estadual', protagonista: 'Ana Souza', entrega: 'zerou a fila das creches' });
    await page.getByRole('button', { name: 'Usar Grupo Azul como base' }).click();
    await expect(manchete(page)).toHaveValue('Ana Souza: zerou a fila das creches e conquista a reeleição a Deputado(a) Estadual');
    expect((await camposDe(page))['m3.cargo']).toBe('Reeleição a Deputado(a) Estadual');
    await expect(protagonista(page)).toHaveValue('Ana Souza');
    await expect(jornalH2(page)).toContainText('zerou a fila das creches');
    await continuar(page).click();
    await expect(page.getByLabel('Principal entrega')).toHaveValue('zerou a fila das creches');
  });

  test('rascunho só com manchete vira texto manual', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await guarda(page, { grupo: 'Grupo Verde', manchete: 'Manchete livre do grupo verde' });
    await page.getByRole('button', { name: 'Usar Grupo Verde como base' }).click();
    await expect(manchete(page)).toHaveValue('Manchete livre do grupo verde');
    expect((await legadoDe(page)).manual).toBe(true);
  });

  test('unificar elementos de dois rascunhos monta os passos com o elemento escolhido de cada um', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await guarda(page, { grupo: 'Grupo Azul', manchete: 'M azul', cargo: 'Senador(a)', protagonista: 'Ana Souza', entrega: 'zerou a fila das creches', resultado: 'em 4 anos' });
    await guarda(page, { grupo: 'Grupo Verde', manchete: 'M verde', cargo: 'Governador(a)', protagonista: 'A deputada', entrega: 'aprovou o Plano Estadual de Educação', resultado: 'com 90% de aprovação' });
    await expect(page.getByRole('heading', { name: 'Unificar elementos de mais de um rascunho' })).toBeVisible();
    const sel = (rot: string) => page.locator('.rm-unifica .campo', { hasText: `${rot} de` }).locator('select');
    await sel('Protagonista').selectOption({ label: 'Grupo Azul: Ana Souza' });
    await sel('Entrega').selectOption({ label: 'Grupo Verde: aprovou o Plano Estadual de Educação' });
    await sel('Resultado').selectOption({ label: 'Grupo Azul: em 4 anos' });
    await sel('Cargo').selectOption({ label: 'Grupo Verde: Governador(a)' });
    await page.getByRole('button', { name: 'Montar os passos com a escolha' }).click();
    await expect(manchete(page)).toHaveValue('Ana Souza: aprovou o Plano Estadual de Educação, em 4 anos e se candidata a Governador(a)');
    expect((await camposDe(page))['m3.cargo']).toBe('Governador(a)');
    await expect(passo(page, 'Cargo')).toHaveClass(/ok/);
    expect((await legadoDe(page)).manual).toBe(false);
  });

  test('unificar sem escolher nada avisa e não muda a manchete; com um rascunho só, o bloco não aparece', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await guarda(page, { grupo: 'Grupo Azul', manchete: 'M azul' });
    await expect(page.getByRole('heading', { name: 'Unificar elementos de mais de um rascunho' })).toHaveCount(0);
    await guarda(page, { grupo: 'Grupo Verde', manchete: 'M verde' });
    await page.getByRole('button', { name: 'Montar os passos com a escolha' }).click();
    await expect(page.locator('#avisos')).toContainText('Escolha ao menos um elemento');
    await expect(manchete(page)).toHaveValue('');
  });

  test('remover um rascunho o tira da lista e do estado', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await guarda(page, { grupo: 'Grupo Azul', manchete: 'M azul' });
    await page.getByRole('button', { name: 'Remover rascunho de Grupo Azul' }).click();
    await expect(page.locator('.rm-rascunhos li')).toHaveCount(0);
    expect(await rascunhos(page)).toEqual([]);
  });

  test('HTML digitado no rascunho aparece como texto', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO });
    await guarda(page, { grupo: '<b>G</b>', manchete: '<img src=x onerror="window.__xss=1">' });
    await expect(page.locator('[data-rascunho] p')).toHaveText('<img src=x onerror="window.__xss=1">');
    expect(await page.locator('[data-rascunho] img, [data-rascunho] b').count()).toBe(0);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });
});
