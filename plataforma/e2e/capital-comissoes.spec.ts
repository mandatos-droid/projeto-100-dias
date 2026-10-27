import { test, expect, type Page } from '@playwright/test';
import { abre, dadoDe, MANDATO } from './semente-rumo';
import { abreGuia } from './guia-real';

/* Missão 4 · comissões (CAP-01 a CAP-04). Ilha montada na rota de teste, com o catálogo real da Câmara (br.json). */
const ILHA = 'capital-comissoes';
const FEDERAL = { ...MANDATO, cargo: 'Deputado(a) Federal', casa: 'Câmara dos Deputados' };
const SAUDE = { 'm3.mural': 'Saúde', 'm3.b1': 'Saúde' };
const AVISO = 'Nomes podem ser diferentes na sua Assembleia. Confira no Regimento Interno';
type Registro = { sigla?: string; esp?: string; prio?: string; pq?: string; papel?: string; mov?: string };
const registros = (page: Page) => dadoDe(page, 'comissoes') as Promise<Registro[]>;
const sugeridas = (page: Page) => page.getByRole('region', { name: 'Sugeridas para você' });
const todas = (page: Page) => page.getByRole('region', { name: 'Todas as comissões' });

test.describe('Deputado(a) Federal com bandeira (CAP-01.1, CAP-01.2, CAP-01.3)', () => {
  test('Saúde prioritária: a Comissão de Saúde aparece em "Sugeridas para você" com o motivo, e não em "Todas"', async ({ page }) => {
    await abre(page, [ILHA], { campos: SAUDE, mandato: FEDERAL });
    const saude = sugeridas(page).locator('li', { hasText: 'Comissão de Saúde' });
    await expect(saude).toBeVisible();
    await expect(saude).toContainText('Combina com sua bandeira Saúde');
    await expect(todas(page).getByText('Comissão de Saúde')).toHaveCount(0);
    await expect(todas(page).locator('li', { hasText: 'Comissão de Educação' })).toBeVisible();
    await expect(page.getByText(AVISO)).toHaveCount(0);
  });

  test('escolher a comissão grava em D.comissoes com sigla, nome e bandeira em texto legível', async ({ page }) => {
    await abre(page, [ILHA], { campos: SAUDE, mandato: FEDERAL });
    await page.getByRole('checkbox', { name: 'Escolher Comissão de Saúde' }).check();
    expect(await registros(page)).toEqual([expect.objectContaining({ sigla: 'CSAUDE', esp: 'Comissão de Saúde', prio: 'Saúde' })]);
  });

  test('a busca acha por nome (sem acento) e por sigla, e avisa quando nada casa', async ({ page }) => {
    await abre(page, [ILHA], { campos: SAUDE, mandato: FEDERAL });
    const busca = page.getByLabel('Buscar por nome ou sigla');
    await busca.fill('educacao');
    await expect(todas(page).locator('li')).toHaveCount(1);
    await expect(todas(page).locator('li')).toContainText('Comissão de Educação');
    await busca.fill('CFT');
    await expect(todas(page).locator('li')).toHaveCount(1);
    await expect(todas(page).locator('li')).toContainText('Comissão de Finanças e Tributação');
    await busca.fill('xyzxyz');
    await expect(todas(page).locator('li')).toHaveCount(0);
    await expect(todas(page).getByText('Nenhuma comissão encontrada')).toBeVisible();
  });
});

test.describe('Deputado(a) Estadual e outros cargos (CAP-02)', () => {
  test('Estadual: sugere pela Câmara, mostra o aviso e o botão "Ajustar o nome"', async ({ page }) => {
    await abre(page, [ILHA], { campos: SAUDE, mandato: MANDATO });
    await expect(page.getByText(AVISO)).toBeVisible();
    await expect(sugeridas(page).locator('li', { hasText: 'Comissão de Saúde' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ajustar o nome' }).first()).toBeVisible();
  });

  test('Senado: lista da Câmara como referência, com o mesmo aviso', async ({ page }) => {
    await abre(page, [ILHA], { campos: SAUDE, mandato: { ...MANDATO, cargo: 'Senador(a)', casa: 'Senado Federal' } });
    await expect(page.getByText(AVISO)).toBeVisible();
    await expect(todas(page).locator('li').first()).toBeVisible();
  });
});

test.describe('Sem bandeiras e cargo vazio (CAP-01.9, CAP-40)', () => {
  test('sem bandeiras: todas as 30 comissões, sem "Sugeridas", e o atalho para a Missão 3', async ({ page }) => {
    await abre(page, [ILHA], { mandato: FEDERAL });
    await expect(sugeridas(page)).toHaveCount(0);
    await expect(todas(page).locator('li')).toHaveCount(30);
    await expect(page.getByRole('link', { name: /Missão 3/ })).toHaveAttribute('href', '#/m/3/m3.bandeiras');
  });

  test('cargo vazio: a lista da Câmara aparece sem sugeridas, mesmo com bandeira', async ({ page }) => {
    await abre(page, [ILHA], { campos: SAUDE, mandato: { ...MANDATO, cargo: '' } });
    await expect(sugeridas(page)).toHaveCount(0);
    await expect(todas(page).locator('li')).toHaveCount(30);
  });
});

/* ---------- cartão com as três perguntas (CAP-03) ---------- */
const MOTIVO1 = 'Pauta da nossa bandeira';
const MOTIVO2 = 'Dá visibilidade ao mandato';
const MOV = 'Procurar a secretaria da comissão';
const pergunta = (page: Page, campo: 'pq' | 'papel' | 'mov') => page.locator(`.cp-perg[data-campo="${campo}"]`);
const botao = (page: Page, campo: 'pq' | 'papel' | 'mov', rot: string) => pergunta(page, campo).getByRole('button', { name: rot, exact: true });
async function escolheSaude(page: Page) {
  await abre(page, [ILHA], { campos: SAUDE, mandato: FEDERAL });
  await page.getByRole('checkbox', { name: 'Escolher Comissão de Saúde' }).check();
}

test.describe('Cartão da comissão (CAP-03.6, CAP-03.7, CAP-03.8)', () => {
  test('escolher a comissão abre o cartão com as 3 perguntas, cada uma com "Outro (escrever)" e os papéis do Guia', async ({ page }) => {
    await escolheSaude(page);
    await expect(page.locator('.cp-perg')).toHaveCount(3);
    for (const c of ['pq', 'papel', 'mov'] as const) await expect(botao(page, c, 'Outro (escrever)')).toBeVisible();
    await expect(pergunta(page, 'papel').locator('.rm-chip')).toHaveText(['Titular', 'Suplente', 'Relatoria', 'Vice-presidência', 'Presidência', 'Outro (escrever)']);
  });

  test('motivo, papel e movimento gravam na hora em texto legível e sobrevivem a recarregar', async ({ page }) => {
    await escolheSaude(page);
    await botao(page, 'pq', MOTIVO1).click();
    await botao(page, 'pq', MOTIVO2).click();
    await botao(page, 'papel', 'Titular').click();
    await botao(page, 'mov', MOV).click();
    expect(await registros(page)).toEqual([expect.objectContaining({ sigla: 'CSAUDE', pq: `${MOTIVO1}; ${MOTIVO2}`, papel: 'Titular', mov: MOV })]);
    await page.reload();
    await page.locator('#tela[data-pronto="true"]').waitFor();
    await expect(botao(page, 'pq', MOTIVO1)).toHaveAttribute('aria-pressed', 'true');
    await expect(botao(page, 'pq', MOTIVO2)).toHaveAttribute('aria-pressed', 'true');
    await expect(botao(page, 'papel', 'Titular')).toHaveAttribute('aria-pressed', 'true');
    await expect(botao(page, 'mov', MOV)).toHaveAttribute('aria-pressed', 'true');
  });

  test('papel e movimento aceitam uma resposta só: escolher outra troca; clicar de novo desmarca', async ({ page }) => {
    await escolheSaude(page);
    await botao(page, 'papel', 'Titular').click();
    await botao(page, 'papel', 'Relatoria').click();
    expect((await registros(page))[0].papel).toBe('Relatoria');
    await botao(page, 'papel', 'Relatoria').click();
    expect((await registros(page))[0].papel).toBe('');
  });

  test('"Outro (escrever)" aceita texto livre, que se soma aos botões marcados no motivo e substitui o botão no papel', async ({ page }) => {
    await escolheSaude(page);
    await botao(page, 'pq', MOTIVO1).click();
    await botao(page, 'pq', 'Outro (escrever)').click();
    await page.getByLabel('Outro motivo').fill('Convite do presidente da comissão');
    expect((await registros(page))[0].pq).toBe(`${MOTIVO1}; Convite do presidente da comissão`);
    await botao(page, 'papel', 'Titular').click();
    await botao(page, 'papel', 'Outro (escrever)').click();
    await expect(botao(page, 'papel', 'Titular')).toHaveAttribute('aria-pressed', 'false');
    await page.getByLabel('Outro papel').fill('Líder da bancada na comissão');
    expect((await registros(page))[0].papel).toBe('Líder da bancada na comissão');
    await page.reload();
    await page.locator('#tela[data-pronto="true"]').waitFor();
    await expect(page.getByLabel('Outro papel')).toHaveValue('Líder da bancada na comissão');
  });

  test('o texto antigo, digitado à mão no Guia, abre como "Outro" sem perda', async ({ page }) => {
    await abre(page, [ILHA], { campos: SAUDE, mandato: FEDERAL, D: { comissoes: [{ id: 'a', esp: 'Comissão de Saúde', prio: 'saúde', pq: 'Porque a saúde é nossa bandeira', papel: 'titular', mov: 'Falar com o líder' }] } });
    await expect(page.getByLabel('Outro motivo')).toHaveValue('Porque a saúde é nossa bandeira');
    await expect(page.getByLabel('Outro papel')).toHaveValue('titular');
    await expect(page.getByLabel('Outro movimento')).toHaveValue('Falar com o líder');
  });

  test('o Resumo mostra o texto legível de pq, papel e mov no Guia de verdade', async ({ page }) => {
    await abreGuia(page, '#/m/4/m4.comissoes/1', { mandato: { nome_parlamentar: 'Ana Souza', cargo: 'Deputado(a) Federal', casa: 'Câmara dos Deputados', uf: 'SP', data_posse: '2027-02-01' }, dados: { campos: SAUDE } });
    await page.getByRole('checkbox', { name: 'Escolher Comissão de Saúde' }).check();
    await botao(page, 'pq', MOTIVO1).click();
    await botao(page, 'papel', 'Suplente').click();
    await botao(page, 'mov', MOV).click();
    await page.evaluate(() => { location.hash = '#/resumo'; });
    const resumo = page.locator('#tela');
    await expect(resumo).toContainText(`${MOTIVO1}`);
    await expect(resumo).toContainText('Suplente');
    await expect(resumo).toContainText(MOV);
    await expect(resumo).toContainText('Comissão de Saúde');
  });
});
