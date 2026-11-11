import { test, expect, type Page } from '@playwright/test';
import { abreGuia, salvoDe } from './guia-real';

/* Missão 1 · Oportunidades e ameaças (ELE-01 a ELE-10, SOC-02 a SOC-06, AGE-01 a AGE-04): 3 colunas sem mapa,
   cartões de indicadores em slides de 4 e as 3 agendas prioritárias. */
const COLUNAS = ['Promessas de Campanha', 'Grupos que Apoiaram', 'Grupos com Potencial'];
const TAGS = ['+ Mulheres', '+ Jovens', '+ Pessoas idosas', '+ Pessoas negras', '+ Povos indígenas', '+ LGBTQIA+', '+ Pessoas com deficiência', '+ Servidores públicos', '+ Professores', '+ Evangélicos', '+ Católicos', '+ Agricultura familiar', '+ Empreendedores e MEI', '+ Estudantes', '+ Moradores da periferia', '+ Trabalhadores de aplicativo'];
type Dados = { eleitorado?: { itens: { id: string; tipo: string; texto: string; muns: string[] }[] }; agendasPrio?: string[] };
const dadosDe = async (page: Page) => (await salvoDe(page)).dados as Dados;
const coluna = (page: Page, nome: string) => page.locator('[data-ilha="eleitorado"]').getByRole('region', { name: nome });
const abre = async (page: Page, dados: Record<string, unknown> = {}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await abreGuia(page, '#/m/1/m1.oportunidades', { dados });
  await expect(page.locator('[data-ilha="eleitorado"]')).toBeVisible({ timeout: 30_000 });
};

test.describe('Eleitorado · 3 colunas sem mapa (ELE-01, ELE-02)', () => {
  test('sem mapa, busca nem seleção de município; 3 colunas na ordem, cada uma com contagem e "+"', async ({ page }) => {
    await abre(page);
    const ilha = page.locator('[data-ilha="eleitorado"]');
    await expect(ilha.locator('svg')).toHaveCount(0);
    await expect(ilha.getByText('Procurar município')).toHaveCount(0);
    await expect(ilha.getByText('município selecionado')).toHaveCount(0);
    await expect(ilha.locator('.el-col h4')).toHaveText(COLUNAS.map((c) => new RegExp(`^${c}\\s*0\\s*\\+$`)));
    for (const c of COLUNAS) await expect(coluna(page, c).getByRole('button', { name: /formulário/ })).toBeVisible();
  });
});

test.describe('Eleitorado · formulário, tags e regras (ELE-03 a ELE-09)', () => {
  test('o "+" abre o formulário com rótulo, exemplo e Adicionar; tags só nos dois grupos', async ({ page }) => {
    await abre(page);
    const esperado = [
      ['Promessas de Campanha', 'Adicionar: promessa', 'Ex.: Ampliar o transporte escolar rural', false],
      ['Grupos que Apoiaram', 'Adicionar: grupo que apoiou', 'Ex.: Professoras da rede municipal', true],
      ['Grupos com Potencial', 'Adicionar: grupo com potencial', 'Ex.: Jovens de 16 a 24 anos', true],
    ] as const;
    for (const [col, rotulo, exemplo, tags] of esperado) {
      const c = coluna(page, col);
      await expect(c.getByRole('textbox')).toHaveCount(0);
      await c.getByRole('button', { name: /formulário/ }).click();
      await expect(c.getByText(rotulo)).toBeVisible();
      await expect(c.getByRole('textbox', { name: rotulo })).toHaveAttribute('placeholder', exemplo);
      await expect(c.getByRole('button', { name: 'Adicionar', exact: true })).toBeVisible();
      if (tags) await expect(c.locator('.el-acoes button')).toHaveText(TAGS);
      else await expect(c.locator('.el-acoes')).toHaveCount(0);
    }
  });

  test('adicionar por texto grava com muns vazio, limpa o campo e mantém o formulário; vazio fica desabilitado', async ({ page }) => {
    await abre(page);
    const c = coluna(page, 'Promessas de Campanha');
    await c.getByRole('button', { name: /formulário/ }).click();
    const campo = c.getByRole('textbox');
    const botao = c.getByRole('button', { name: 'Adicionar', exact: true });
    await expect(botao).toBeDisabled();
    await campo.fill('   ');
    await expect(botao).toBeDisabled();
    await campo.fill('Ampliar o transporte escolar rural');
    await botao.click();
    await expect(c.locator('.el-item')).toHaveText([/Ampliar o transporte escolar rural/]);
    await expect(campo).toHaveValue('');
    await expect(campo).toBeVisible();
    await expect(c.locator('h4')).toContainText('1');
    await expect.poll(async () => (await dadosDe(page)).eleitorado?.itens).toEqual([
      expect.objectContaining({ tipo: 'promessa', texto: 'Ampliar o transporte escolar rural', muns: [] }),
    ]);
  });

  test('a tag adiciona o grupo na coluna do formulário, sem texto', async ({ page }) => {
    await abre(page);
    const c = coluna(page, 'Grupos com Potencial');
    await c.getByRole('button', { name: /formulário/ }).click();
    await c.getByRole('button', { name: '+ Jovens' }).click();
    await expect(c.locator('.el-item')).toHaveText([/Jovens/]);
    await expect(coluna(page, 'Grupos que Apoiaram').locator('.el-item')).toHaveCount(0);
    await expect.poll(async () => (await dadosDe(page)).eleitorado?.itens.map((i) => [i.tipo, i.texto])).toEqual([['potencial', 'Jovens']]);
  });

  test('repetido (sem acento nem maiúscula) é barrado com mensagem; em outra coluna pode', async ({ page }) => {
    await abre(page);
    const c = coluna(page, 'Grupos que Apoiaram');
    await c.getByRole('button', { name: /formulário/ }).click();
    await c.getByRole('button', { name: '+ Pessoas idosas' }).click();
    await c.getByRole('textbox').fill('PESSOAS IDOSAS');
    await c.getByRole('button', { name: 'Adicionar', exact: true }).click();
    await expect(c.getByText('Este item já está na lista.')).toBeVisible();
    await c.getByRole('textbox').fill('Professôras');
    await c.getByRole('button', { name: 'Adicionar', exact: true }).click();
    await c.getByRole('textbox').fill('professoras');
    await c.getByRole('button', { name: 'Adicionar', exact: true }).click();
    await expect(c.getByText('Este item já está na lista.')).toBeVisible();
    await expect(c.locator('.el-item')).toHaveCount(2);
    const o = coluna(page, 'Grupos com Potencial');
    await o.getByRole('button', { name: /formulário/ }).click();
    await o.getByRole('button', { name: '+ Pessoas idosas' }).click();
    await expect(o.locator('.el-item')).toHaveCount(1);
  });

  test('o × remove o item da coluna e do que fica gravado', async ({ page }) => {
    await abre(page);
    const c = coluna(page, 'Grupos que Apoiaram');
    await c.getByRole('button', { name: /formulário/ }).click();
    await c.getByRole('button', { name: '+ Mulheres' }).click();
    await c.getByRole('button', { name: '+ Estudantes' }).click();
    await expect(c.locator('.el-item')).toHaveCount(2);
    await c.getByRole('button', { name: 'Remover “Mulheres”' }).click();
    await expect(c.locator('.el-item')).toHaveText([/Estudantes/]);
    await expect.poll(async () => (await dadosDe(page)).eleitorado?.itens.map((i) => i.texto)).toEqual(['Estudantes']);
  });

  test('item antigo com municípios aparece sem município e segue gravado com muns (ELE-10)', async ({ page }) => {
    await abre(page, { eleitorado: { itens: [{ id: 'a1', tipo: 'apoio', texto: 'Professoras da rede', muns: ['3550308', '3509502'] }, { id: 'a2', tipo: 'promessa', texto: 'Creche em tempo integral', muns: [] }] } });
    const c = coluna(page, 'Grupos que Apoiaram');
    await expect(c.locator('.el-item')).toHaveText([/^Professoras da rede\s*×?$/]);
    await expect(c.locator('.el-chips')).toHaveCount(0);
    await expect(page.locator('[data-ilha="eleitorado"]')).not.toContainText('Estado inteiro');
    await c.getByRole('button', { name: /formulário/ }).click();
    await c.getByRole('button', { name: '+ Jovens' }).click();
    await expect.poll(async () => (await dadosDe(page)).eleitorado?.itens.find((i) => i.id === 'a1')?.muns).toEqual(['3550308', '3509502']);
  });
});

test.describe('Agendas sociais · cartões em slides com filtro (SOC-02 a SOC-06)', () => {
  test('sem mapa; slide 1 de 4 cartões, avança, e o filtro "Baixo" deixa só notas de 40 a 49', async ({ page }) => {
    await abre(page);
    const ilha = page.locator('[data-ilha="agendas-sociais"]');
    await expect(ilha.locator('article')).toHaveCount(4, { timeout: 30_000 });
    await expect(ilha.locator('svg')).toHaveCount(0);
    await expect(ilha.getByText('Slide 1 de 4')).toBeVisible();
    await expect(ilha.locator('article h4').first()).toHaveText('Saúde');
    await expect(ilha.getByRole('button', { name: /Anterior/ })).toBeDisabled();
    const primeiro = ilha.locator('article').first();
    await expect(primeiro.getByRole('columnheader')).toHaveText(['Indicador', 'ODS relacionada', 'Nota']);
    await expect(primeiro.getByRole('combobox', { name: 'Classificação' }).locator('option')).toHaveText(['Todas', 'Muito baixo', 'Baixo', 'Médio', 'Alto', 'Muito alto']);

    const todas = await primeiro.locator('tbody tr').count();
    expect(todas).toBeGreaterThan(0);
    await primeiro.getByRole('combobox', { name: 'Classificação' }).selectOption('Baixo');
    const notas = (await primeiro.locator('tbody tr td:last-child strong').allTextContents()).map((t) => parseFloat(t.replace(',', '.')));
    expect(notas.length).toBeLessThanOrEqual(todas);
    for (const n of notas) { expect(n).toBeGreaterThanOrEqual(40); expect(n).toBeLessThan(50); }

    await ilha.getByRole('button', { name: /Próximo/ }).click();
    await expect(ilha.getByText('Slide 2 de 4')).toBeVisible();
    await expect(ilha.locator('article')).toHaveCount(4);
    await expect(ilha.locator('article h4').first()).not.toHaveText('Saúde');
    await ilha.getByRole('button', { name: /Anterior/ }).click();
    await expect(ilha.getByText('Slide 1 de 4')).toBeVisible();
  });

  test('a caixa m1.q8a continua depois dos cartões', async ({ page }) => {
    await abre(page);
    const d = await page.locator('[data-ilha="agendas-sociais"]').boundingBox();
    const c = await page.locator('.campo:has(textarea[data-k="m1.q8a"]) .rico-area').boundingBox();
    expect(d && c && c.y > d.y).toBeTruthy();
  });

  test('sem os arquivos de indicadores mostra a mensagem e mantém a caixa de análise (SOC-08)', async ({ page }) => {
    await page.route('**/data/social/**', (r) => r.fulfill({ status: 404, body: '' }));
    await abre(page);
    await expect(page.locator('[data-ilha="agendas-sociais"]')).toContainText('Não foi possível carregar os indicadores do seu estado agora.', { timeout: 30_000 });
    await expect(page.locator('textarea[data-k="m1.q8a"]')).toHaveCount(1);
  });
});

test.describe('Agendas prioritárias · 3 escolhas (AGE-01 a AGE-04)', () => {
  test('13 botões; marcar 3, barrar a 4ª com a mensagem, desmarcar libera', async ({ page }) => {
    await abre(page);
    const ilha = page.locator('[data-ilha="prioritarias"]');
    const botoes = ilha.getByRole('group', { name: 'Agendas prioritárias' }).getByRole('button');
    await expect(botoes).toHaveCount(13);
    await expect(ilha).toContainText('faltam 3');
    for (const n of ['Saúde', 'Educação', 'Segurança pública']) await ilha.getByRole('button', { name: n, exact: true }).click();
    await expect(ilha.locator('button[aria-pressed="true"]')).toHaveCount(3);
    await expect(ilha).not.toContainText('faltam');
    await ilha.getByRole('button', { name: 'Cultura e esporte' }).click();
    await expect(ilha).toContainText('Você já escolheu 3 agendas. Desmarque uma para trocar.');
    await expect(ilha.getByRole('button', { name: 'Cultura e esporte' })).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(async () => (await dadosDe(page)).agendasPrio).toEqual(['saude', 'educacao', 'seguranca']);
    await ilha.getByRole('button', { name: 'Educação', exact: true }).click();
    await expect(ilha).toContainText('faltam 1');
    await expect.poll(async () => (await dadosDe(page)).agendasPrio).toEqual(['saude', 'seguranca']);
    await ilha.getByRole('button', { name: 'Cultura e esporte' }).click();
    await expect.poll(async () => (await dadosDe(page)).agendasPrio).toEqual(['saude', 'seguranca', 'cultura']);
  });
});

test.describe('Casos de borda da etapa (SOC-09 e "+" aberto e vazio)', () => {
  const SOCIAL = { itens: [{ id: 's1', nivel: 'UF', tipo: 'problema', agenda: 'saude', texto: 'Fila de espera', uf: 'SP', alvos: ['SP'], nomes: ['São Paulo'] }] };
  const ITEM = { id: 'e1', tipo: 'promessa', texto: 'Transporte escolar', muns: [] };

  test('os registros antigos de D.social seguem gravados, iguais, depois de abrir e editar a etapa (SOC-09)', async ({ page }) => {
    await abre(page, { social: SOCIAL });
    const ilha = page.locator('[data-ilha="prioritarias"]');
    await ilha.getByRole('button', { name: 'Saúde', exact: true }).click(); // edita outra coisa da etapa, que salva o mandato
    await expect.poll(async () => (await dadosDe(page)).agendasPrio).toEqual(['saude']);
    expect(((await salvoDe(page)).dados as { social?: unknown }).social).toEqual(SOCIAL);
    await page.reload();
    await expect(page.locator('[data-ilha="eleitorado"]')).toBeVisible({ timeout: 30_000 });
    expect(((await salvoDe(page)).dados as { social?: unknown }).social).toEqual(SOCIAL);
  });

  test('trocar de etapa com o "+" aberto e vazio abre a etapa seguinte sem gravar item', async ({ page }) => {
    await abre(page, { eleitorado: { itens: [ITEM] } });
    const c = coluna(page, 'Promessas de Campanha');
    await c.getByRole('button', { name: /formulário/ }).click();
    await expect(c.getByRole('textbox')).toBeVisible();
    await expect(c.getByRole('textbox')).toHaveValue('');
    await page.getByRole('button', { name: /Próximo exercício/ }).click();
    await expect(page).toHaveURL(/#\/m\/1\/m1\.frag/);
    await expect(page.locator('[data-ilha="eleitorado"]')).toHaveCount(0);
    expect((await dadosDe(page)).eleitorado?.itens).toEqual([ITEM]); // nada novo, nada alterado
  });
});
