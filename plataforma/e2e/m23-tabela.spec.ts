import { test, expect, type Page } from '@playwright/test';
import { abre, camposDe } from './semente';

/* Missão 2 · Mão na massa 1: tabela de equipe em ordem obrigatória (RM2-01 a 11). */
const ILHA = 'equipe-tabela';
const PERGUNTA = 'Quantas pessoas o mandato terá ou espera ter nos primeiros 100 dias?';
const campo = (page: Page, rotulo: string, linha: number) => page.getByLabel(`${rotulo}, linha ${linha}`);
const defineN = async (page: Page, n: string) => {
  await page.getByLabel(/Quantas pessoas o mandato terá/).fill(n);
  await page.getByRole('button', { name: /Criar linhas|Ajustar/ }).click();
};
const preencheLinha = async (page: Page, linha: number, v: { esc: string; comp: string; cargo: string; pessoa: string; cat: string; area: string }) => {
  await campo(page, 'Escopo', linha).fill(v.esc);
  await campo(page, 'Competências comportamentais', linha).fill(v.comp);
  await campo(page, 'Nome do cargo', linha).fill(v.cargo);
  await campo(page, 'Nome da pessoa', linha).fill(v.pessoa);
  await campo(page, 'Categoria', linha).selectOption(v.cat);
  await campo(page, 'Área', linha).selectOption(v.area);
};
const COMPLETA = { esc: 'Coordenar a equipe e a agenda', comp: 'Liderança e organização', cargo: 'Chefe de gabinete', pessoa: 'Ana Souza', cat: 'Chefia', area: 'Chefia de área' };

test.describe('Tabela de equipe: quantidade e linhas (RM2-03, RM2-04)', () => {
  test('tabela vazia pede a quantidade antes de qualquer linha (RM2-03)', async ({ page }) => {
    await abre(page, [ILHA]);
    await expect(page.getByText(PERGUNTA)).toBeVisible();
    await expect(page.locator('table')).toHaveCount(0);
    await expect(page.locator('[data-linha]')).toHaveCount(0);
  });

  test('quantidade fora de 1 a 40 avisa e não cria linhas (RM2-03)', async ({ page }) => {
    await abre(page, [ILHA]);
    await defineN(page, '0');
    await expect(page.locator('#avisos')).toContainText('Informe de 1 a 40 pessoas.');
    await defineN(page, '41');
    await expect(page.locator('[data-linha]')).toHaveCount(0);
    expect((await camposDe(page))['m2.n']).toBeUndefined();
  });

  test('informar 4 cria 4 linhas e mostra "0 de 4 linhas completas" (RM2-04)', async ({ page }) => {
    await abre(page, [ILHA]);
    await defineN(page, '4');
    await expect(page.locator('[data-linha]')).toHaveCount(4);
    await expect(page.locator('[data-contador]')).toHaveText('0 de 4 linhas completas');
    expect((await camposDe(page))['m2.n']).toBe('4');
  });

  test('aumentar cria linhas; diminuir tira as vazias sem perguntar e pede confirmação para as preenchidas (RM2-04)', async ({ page }) => {
    await abre(page, [ILHA]);
    await defineN(page, '3');
    await preencheLinha(page, 1, COMPLETA);
    await campo(page, 'Escopo', 3).fill('Cuidar da comunicação');
    await defineN(page, '5');
    await expect(page.locator('[data-linha]')).toHaveCount(5);
    await defineN(page, '4'); // tira uma vazia, sem confirmação
    await expect(page.locator('[data-linha]')).toHaveCount(4);
    const dialogos: string[] = [];
    page.on('dialog', (d) => { dialogos.push(d.message()); void d.dismiss(); });
    await defineN(page, '1'); // sobrariam linhas preenchidas: pede confirmação, e recusar mantém tudo
    await expect.poll(() => dialogos.length).toBe(1);
    expect(dialogos[0]).toContain('Linha 3');
    await expect(page.locator('[data-linha]')).toHaveCount(4);
    expect((await camposDe(page))['m2.n']).toBe('4');
  });
});

test.describe('Tabela de equipe: ordem obrigatória (RM2-05 a 09)', () => {
  test.beforeEach(async ({ page }) => { await abre(page, [ILHA]); await defineN(page, '4'); });

  test('coluna travada fica desabilitada com a legenda e destrava ao preencher a anterior (RM2-05)', async ({ page }) => {
    await expect(campo(page, 'Escopo', 2)).toBeEnabled();
    await expect(campo(page, 'Competências comportamentais', 2)).toBeDisabled();
    await expect(page.locator('#es-tab-20-comp-leg')).toHaveText('Preencha antes: Escopo');
    await expect(campo(page, 'Nome do cargo', 2)).toBeDisabled();
    await campo(page, 'Escopo', 2).fill('Cuidar da comunicação');
    await expect(campo(page, 'Competências comportamentais', 2)).toBeEnabled();
    await expect(campo(page, 'Nome do cargo', 2)).toBeDisabled();
    await expect(page.locator('#es-tab-20-cargo-leg')).toHaveText('Preencha antes: Competências comportamentais');
  });

  test('esvaziar uma coluna anterior trava as seguintes sem apagar o que estava escrito (RM2-06)', async ({ page }) => {
    await campo(page, 'Escopo', 2).fill('Cuidar da comunicação');
    await campo(page, 'Competências comportamentais', 2).fill('Criatividade');
    await campo(page, 'Nome do cargo', 2).fill('Assessora de imprensa');
    await campo(page, 'Escopo', 2).fill('');
    await expect(campo(page, 'Nome do cargo', 2)).toBeDisabled();
    await expect(campo(page, 'Nome do cargo', 2)).toHaveValue('Assessora de imprensa');
    await expect(page.locator('#es-tab-20-comp-leg')).toHaveText('Preencha antes: Escopo');
    const c = await camposDe(page);
    expect(c['m2.p21.nome_cargo']).toBe('Assessora de imprensa');
    expect(c['m2.p21.comp']).toBe('Criatividade');
  });

  test('asterisco na pessoa vira processo seletivo e mostra o incentivo à diversidade (RM2-07)', async ({ page }) => {
    await expect(page.getByText(/aumentar a diversidade e a representatividade/)).toHaveCount(0);
    await campo(page, 'Escopo', 2).fill('Cuidar da comunicação');
    await campo(page, 'Competências comportamentais', 2).fill('Criatividade');
    await campo(page, 'Nome do cargo', 2).fill('Assessora de imprensa');
    await campo(page, 'Nome da pessoa', 2).fill('*');
    await expect(page.getByText('Processo seletivo a abrir')).toBeVisible();
    await expect(page.getByText('Caso não haja pessoas que se encaixem nos requisitos, encorajamos o mandato a abrir processo seletivo e aumentar a diversidade e a representatividade dentro da equipe!')).toBeVisible();
    await expect(campo(page, 'Categoria', 2)).toBeEnabled(); // o * conta como preenchida
  });

  test('categoria e área só liberam depois da pessoa, e a área depois da categoria (RM2-08)', async ({ page }) => {
    await campo(page, 'Escopo', 2).fill('Cuidar da comunicação');
    await campo(page, 'Competências comportamentais', 2).fill('Criatividade');
    await campo(page, 'Nome do cargo', 2).fill('Assessora de imprensa');
    await expect(campo(page, 'Categoria', 2)).toBeDisabled();
    await expect(page.locator('#es-tab-20-cat-leg')).toHaveText('Preencha antes: Nome da pessoa');
    await campo(page, 'Nome da pessoa', 2).fill('Bia Lima');
    await expect(campo(page, 'Categoria', 2)).toBeEnabled();
    await expect(campo(page, 'Área', 2)).toBeDisabled();
    await campo(page, 'Categoria', 2).selectOption('Executora');
    await expect(campo(page, 'Área', 2)).toBeEnabled();
    expect(await campo(page, 'Categoria', 2).locator('option').allTextContents()).toEqual(['Selecione', 'Chefia', 'Coordenação', 'Especialista', 'Executora']);
  });

  test('preencher a linha 1 inteira mostra "1 de 4 linhas completas" (RM2-09)', async ({ page }) => {
    await preencheLinha(page, 1, COMPLETA);
    await expect(page.locator('[data-contador]')).toHaveText('1 de 4 linhas completas');
    await expect(page.locator('[data-linha="0"]')).toContainText('completa');
    await expect(page.locator('[data-linha="20"]')).not.toContainText('completa');
  });

  test('nomes repetidos avisam sem bloquear (edge case)', async ({ page }) => {
    for (const linha of [1, 2]) {
      await preencheLinha(page, linha, { ...COMPLETA, cat: 'Executora', area: 'Legislativo', pessoa: 'Ana Souza' });
    }
    await expect(page.getByText(/O mesmo nome aparece em mais de uma linha: Ana Souza/)).toBeVisible();
    await expect(page.locator('[data-contador]')).toHaveText('2 de 4 linhas completas');
  });
});

test.describe('Tabela de equipe: autosave e celular (RM2-10, RM2-11)', () => {
  test('grava a cada edição, sem botão salvar, e o que foi escrito volta ao recarregar (RM2-10)', async ({ page }) => {
    await abre(page, [ILHA]);
    await defineN(page, '3');
    await campo(page, 'Escopo', 1).fill('Coordenar a equipe e a agenda');
    await expect(page.getByRole('button', { name: /salvar/i })).toHaveCount(0);
    expect((await camposDe(page))['m2.p1.esc']).toBe('Coordenar a equipe e a agenda');
    await page.reload();
    await page.locator('#tela[data-pronto="true"]').waitFor();
    await expect(campo(page, 'Escopo', 1)).toHaveValue('Coordenar a equipe e a agenda');
    await expect(page.locator('[data-linha]')).toHaveCount(3);
  });

  test('espaço no meio do nome é aceito ao digitar (a lib grava aparado)', async ({ page }) => {
    await abre(page, [ILHA]);
    await defineN(page, '2');
    await campo(page, 'Escopo', 1).pressSequentially('Coordenar a equipe');
    await expect(campo(page, 'Escopo', 1)).toHaveValue('Coordenar a equipe');
  });

  test('em tela de celular cada linha vira um cartão vertical, com as colunas na mesma ordem (RM2-11)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await abre(page, [ILHA]);
    await defineN(page, '2');
    const linha = page.locator('[data-linha="0"]');
    await expect(linha).toHaveCSS('display', 'block');
    const rotulos = await linha.locator('td').evaluateAll((tds) => tds.map((t) => t.getAttribute('data-label')));
    expect(rotulos).toEqual(['Escopo', 'Competências comportamentais', 'Nome do cargo', 'Nome da pessoa', 'Categoria', 'Área']);
    const ys = await linha.locator('td').evaluateAll((tds) => tds.map((t) => t.getBoundingClientRect().top));
    expect([...ys].sort((a, b) => a - b)).toEqual(ys); // empilhadas na ordem
    expect(new Set(ys).size).toBe(6);
    const xs = await linha.locator('td').evaluateAll((tds) => tds.map((t) => Math.round(t.getBoundingClientRect().left)));
    expect(new Set(xs).size).toBe(1); // mesma coluna: nada lado a lado
  });
});

test.describe('Tabela de equipe: mandato do modelo antigo (RMX-02, RMX-03)', () => {
  const CHIP = 'Elaborar propostas legislativas: projetos de lei, emendas, requerimentos e indicações';
  const antigo = {
    'm2.on': '0|1|2', 'm2.f1': 'Ana', 'm2.f2': 'Bia', 'm2.f3': 'Caio',
    'm2.p1.nome_cargo': 'Chefe de gabinete', 'm2.p2.nome_cargo': 'Coordenadora Legislativa', 'm2.p3.nome_cargo': 'Assessor',
    'm2.p2.escopo': CHIP, 'm2.p2.hab_dest': 'Organização|Empatia', 'm2.p3.ritmo': 'Lento', 'm2.p3.fb_falei': 'ok',
  };

  test('mostra pessoas, cargo, escopo, competências antigas, categoria e área derivados, sem gravar nada ao abrir', async ({ page }) => {
    await abre(page, [ILHA], antigo);
    await expect(page.locator('[data-linha]')).toHaveCount(3);
    await expect(campo(page, 'Nome da pessoa', 2)).toHaveValue('Bia');
    await expect(campo(page, 'Nome do cargo', 2)).toHaveValue('Coordenadora Legislativa');
    await expect(campo(page, 'Escopo', 2)).toHaveValue(CHIP);
    await expect(campo(page, 'Competências comportamentais', 2)).toHaveValue('Organização, Empatia');
    await expect(campo(page, 'Categoria', 2)).toHaveValue('Coordenação');
    await expect(campo(page, 'Área', 2)).toHaveValue('Legislativo');
    expect((await camposDe(page))['m2.n']).toBeUndefined();
  });

  test('a primeira edição grava os valores derivados e a liderança, sem apagar nada do formato antigo', async ({ page }) => {
    await abre(page, [ILHA], antigo);
    await campo(page, 'Nome do cargo', 2).fill('Coordenadora Legislativa e de Plenário');
    const c = await camposDe(page);
    expect(c['m2.n']).toBe('3');
    expect(c['m2.p2.nome_cargo']).toBe('Coordenadora Legislativa e de Plenário');
    expect([c['m2.p2.esc'], c['m2.p2.comp'], c['m2.p2.cat'], c['m2.p2.coord']]).toEqual([CHIP, 'Organização, Empatia', 'Coordenação', 'Legislativo']);
    expect([c['m2.p1.cat'], c['m2.p1.lider'], c['m2.p3.lider']]).toEqual(['Chefia', '-', '1']);
    expect([c['m2.p3.ritmo'], c['m2.p3.fb_falei'], c['m2.p2.escopo'], c['m2.p2.hab_dest']]).toEqual(['Lento', 'ok', CHIP, 'Organização|Empatia']);
    await expect(campo(page, 'Escopo', 2)).toHaveValue(CHIP); // continua visível depois da gravação
  });
});
