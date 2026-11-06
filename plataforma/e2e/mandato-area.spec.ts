import { test, expect, type Page } from '@playwright/test';
import { naoMapeadas, rpcs, semeiaSessao } from './convite-api';
import { ANA, BRUNO, MANDATO_A, MANDATO_B, fotosBloqueadas, mocaMandato, pendente, pessoa, type EstadoMandato, type MandatoDaPessoa } from './mandato-api';

/* Área do mandato (ACE-05): cartão, andamento, missões e "Editar dados". Supabase todo interceptado (mandato-api.ts). */

const MARIANA = { access_token: 'tok-mariana', refresh_token: 'ref-mariana' };

const cartao = (page: Page) => page.locator('.md-cartao');
const andamento = (page: Page) => page.locator('.md-andamento');
const missao = (page: Page, n: number) => page.locator(`[data-missao="${n}"]`);

async function abre(page: Page, estado: EstadoMandato, agora = '2027-02-12T10:00:00-03:00') {
  await page.clock.setFixedTime(new Date(agora));
  await semeiaSessao(page, MARIANA);
  await mocaMandato(page, estado);
  await page.goto('/mandato');
}

const feitos = (...ids: string[]) => Object.fromEntries(ids.map((i) => [i, true]));
const comDados = (dados: Record<string, unknown>, extra: Partial<MandatoDaPessoa> = {}): MandatoDaPessoa => ({ ...ANA, dados, ...extra });

test.afterEach(() => {
  expect(naoMapeadas()).toEqual([]);
});

test.describe('Cartão do mandato (ACE-05.1)', () => {
  test('mostra nome parlamentar, cargo, UF, partido e data de posse', async ({ page }) => {
    await abre(page, { mandatos: [ANA] });
    await expect(cartao(page).getByRole('heading', { level: 1 })).toHaveText('Ana Souza');
    await expect(cartao(page).locator('.md-cartao-info')).toHaveText('Deputado(a) Estadual · SP · Partido Exemplo · posse em 01/02/2027');
    await expect(cartao(page).getByTestId('papel-ativo')).toHaveText('Assessoria');
  });

  test('com dados.tse.sq pede a foto do TSE, e a foto bloqueada não gera erro: as iniciais continuam', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await abre(page, { mandatos: [comDados({ tse: { sq: '250001234567', ano: 2026 } })] });
    await expect(cartao(page).locator('.md-foto')).toContainText('AS');
    await expect.poll(() => fotosBloqueadas()).toEqual(['https://resultados.tse.jus.br/oficial/ele2026/6259/fotos/sp/250001234567.jpeg']);
    await expect(cartao(page).locator('.md-foto img')).toHaveCount(0); // a foto que falhou sai da tela
    await expect(cartao(page).locator('.md-foto')).toContainText('AS');
    expect(erros).toEqual([]);
  });

  test('foto de 2024 usa o caminho das eleições municipais e a UF do mandato em minúsculas', async ({ page }) => {
    await abre(page, { mandatos: [{ ...BRUNO, dados: { tse: { sq: '130009999', ano: 2024 } } }] });
    await expect.poll(() => fotosBloqueadas()).toEqual(['https://resultados.tse.jus.br/oficial/ele2024/619/fotos/mg/130009999.jpeg']);
  });

  test('sem dados.tse não pede foto nenhuma e mostra só o círculo com as iniciais', async ({ page }) => {
    await abre(page, { mandatos: [ANA] });
    await expect(cartao(page).locator('.md-foto')).toHaveText('AS');
    await expect(cartao(page).locator('img')).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    expect(fotosBloqueadas()).toEqual([]);
  });
});

test.describe('Dia X de 100 (ACE-05.2)', () => {
  test('na data certa mostra "Dia 12 de 100"', async ({ page }) => {
    await abre(page, { mandatos: [ANA] }, '2027-02-12T10:00:00-03:00');
    await expect(andamento(page).getByRole('heading')).toHaveText('Dia 12 de 100');
    await expect(andamento(page).getByRole('img')).toHaveAttribute('aria-label', '12 por cento');
  });

  test('conta no fuso de Brasília: 22h30 do dia 12 já é dia 13 em UTC, mas segue "Dia 12 de 100"', async ({ page }) => {
    await abre(page, { mandatos: [ANA] }, '2027-02-13T01:30:00Z');
    await expect(andamento(page).getByRole('heading')).toHaveText('Dia 12 de 100');
  });

  test('no dia da posse é o dia 1 e no 100º dia é "Dia 100 de 100"', async ({ page }) => {
    await abre(page, { mandatos: [ANA] }, '2027-02-01T08:00:00-03:00');
    await expect(andamento(page).getByRole('heading')).toHaveText('Dia 1 de 100');
    await page.clock.setFixedTime(new Date('2027-05-11T23:59:00-03:00'));
    await page.reload();
    await expect(andamento(page).getByRole('heading')).toHaveText('Dia 100 de 100');
  });

  test('antes da posse mostra "Posse em DD/MM/AAAA"', async ({ page }) => {
    await abre(page, { mandatos: [ANA] }, '2027-01-31T23:00:00-03:00');
    await expect(andamento(page).getByRole('heading')).toHaveText('Posse em 01/02/2027');
    await expect(andamento(page)).not.toContainText('Dia ');
  });

  test('depois do 100º dia mostra "100 dias concluídos"', async ({ page }) => {
    await abre(page, { mandatos: [ANA] }, '2027-05-12T00:00:00-03:00');
    await expect(andamento(page).getByRole('heading')).toHaveText('100 dias concluídos');
    await expect(andamento(page).getByRole('img')).toHaveAttribute('aria-label', '100 por cento');
  });
});

test.describe('Missões (ACE-05.3)', () => {
  test('mostra as 5 missões com Concluída, Em andamento ou A fazer conforme dados.feitos', async ({ page }) => {
    const dados = { feitos: { ...feitos('m1.persona', 'm1.conjuntura', 'm1.oportunidades', 'm1.frag', 'm2.funcoes'), 'm3.bandeiras': false } };
    await abre(page, { mandatos: [comDados(dados)] });
    await expect(page.locator('[data-missao]')).toHaveCount(5);
    const esperado: [number, string, string][] = [
      [1, 'Prepare sua chegada', 'Concluída'], [2, 'Estruture a equipe', 'Em andamento'], [3, 'Defina o rumo', 'A fazer'],
      [4, 'Construa capital político', 'A fazer'], [5, 'Garanta o avanço', 'A fazer'],
    ];
    for (const [n, nome, status] of esperado) {
      await expect(missao(page, n).locator('.md-missao-n')).toHaveText(`Missão ${n}`);
      await expect(missao(page, n).getByRole('heading')).toHaveText(nome);
      await expect(missao(page, n).locator('.md-status')).toHaveText(status);
    }
    await expect(andamento(page)).toContainText('1 de 5 missões concluídas');
  });

  test('sem nenhum exercício feito, as 5 missões estão "A fazer"', async ({ page }) => {
    await abre(page, { mandatos: [ANA] });
    await expect(page.locator('[data-missao] .md-status')).toHaveText(['A fazer', 'A fazer', 'A fazer', 'A fazer', 'A fazer']);
    await expect(andamento(page)).toContainText('0 de 5 missões concluídas');
  });

  test('lê o catálogo uma vez, pelo nome certo, com a sessão da pessoa', async ({ page }) => {
    await abre(page, { mandatos: [ANA] });
    await expect(page.locator('[data-missao]')).toHaveCount(5);
    expect(rpcs('catalogo_exercicios')).toHaveLength(1);
    expect(rpcs('catalogo_exercicios')[0].token).toBe('tok-mariana');
  });

  test('falha do catálogo mostra a mensagem na área das missões e mantém o cartão', async ({ page }) => {
    await abre(page, { mandatos: [ANA], rpc: { catalogo_exercicios: () => ({ rede: true }) } });
    await expect(page.locator('.md-missoes-bloco').getByRole('alert')).toHaveText('Não foi possível concluir. Tente de novo.');
    await expect(cartao(page).getByRole('heading', { level: 1 })).toHaveText('Ana Souza');
    await expect(page.locator('[data-missao]')).toHaveCount(0);
  });
});

test.describe('Editar dados (ACE-05.6, ACE-05.10)', () => {
  for (const papel of ['coordenacao', 'assessoria']) {
    test(`papel ${papel} vê "Editar dados", que abre a edição do mandato no Guia`, async ({ page }) => {
      await abre(page, { mandatos: [{ ...ANA, papel }] });
      const link = cartao(page).getByRole('link', { name: 'Editar dados' });
      await expect(link).toHaveAttribute('href', '/guia#/config');
      await link.click();
      await page.waitForURL('**/guia#/config');
    });
  }

  test('papel leitura não vê "Editar dados"', async ({ page }) => {
    await abre(page, { mandatos: [{ ...ANA, papel: 'leitura' }] });
    await expect(cartao(page).getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Editar dados' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Editar dados' })).toHaveCount(0);
  });
});

test.describe('Vários mandatos e layout', () => {
  test('trocar o mandato troca cartão, andamento e missões', async ({ page }) => {
    const bruno = { ...BRUNO, data_posse: '2027-01-01', dados: { feitos: feitos('m2.funcoes', 'm2.gestao') } };
    await abre(page, { mandatos: [ANA, bruno] });
    await expect(andamento(page).getByRole('heading')).toHaveText('Dia 12 de 100');
    await page.getByRole('combobox', { name: 'Mandato' }).selectOption(MANDATO_B);
    await expect(cartao(page).getByRole('heading', { level: 1 })).toHaveText('Bruno Alves');
    await expect(andamento(page).getByRole('heading')).toHaveText('Dia 43 de 100');
    await expect(missao(page, 2).locator('.md-status')).toHaveText('Concluída');
    await expect(cartao(page).getByRole('link', { name: 'Editar dados' })).toBeVisible(); // Bruno é coordenação
  });

  test('em 400 px não há rolagem horizontal, com nomes e partido longos e 5 missões', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    const longo = comDados({ tse: { sq: '1' } }, { nome_parlamentar: 'Bartolomeu Nepomuceno de Albuquerque e Vasconcelos Filho', partido: 'Partido Muito Longo da Renovação Democrática Nacional' });
    await abre(page, { mandatos: [longo] });
    await expect(page.locator('[data-missao]')).toHaveCount(5);
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra).toBeLessThanOrEqual(0);
  });
});

test.describe('Resumo da equipe (ACE-05.4)', () => {
  const resumo = (page: Page) => page.locator('.md-resumo');
  const CINCO = [
    pessoa('Ana Souza', 'assessoria', 'ana@x.test'), pessoa('Mariana Rocha', 'coordenacao', 'mariana@x.test'),
    pessoa('João Pereira', 'assessoria', 'joao@x.test'), pessoa('Luiza Ferraz', 'leitura', 'luiza@x.test'),
    pessoa('Carlos', 'assessoria', 'carlos@x.test'),
  ];

  test('com 5 pessoas mostra só 3 avatares com iniciais e o total real', async ({ page }) => {
    await abre(page, { mandatos: [ANA], rpc: { equipe_do_mandato: () => ({ corpo: CINCO }) } });
    await expect(resumo(page).locator('.md-av')).toHaveText(['AS', 'MR', 'JP']);
    await expect(resumo(page)).toContainText('5 pessoas');
  });

  test('com 1 pessoa mostra 1 avatar e "1 pessoa"; sem nome usa a inicial do e-mail', async ({ page }) => {
    await abre(page, { mandatos: [ANA], rpc: { equipe_do_mandato: () => ({ corpo: [pessoa(null, 'coordenacao', 'zeca@x.test')] }) } });
    await expect(resumo(page).locator('.md-av')).toHaveText(['Z']);
    await expect(resumo(page)).toContainText('1 pessoa');
    await expect(resumo(page)).not.toContainText('1 pessoas');
  });

  test('mostra a contagem real de convites pendentes: 2, 1 e zero', async ({ page }) => {
    const dois = [pendente('c1', 'Carlos Lima'), pendente('c2', 'Dora Alves', 'leitura')];
    await abre(page, { mandatos: [ANA], rpc: { convites_pendentes: () => ({ corpo: dois }) } });
    await expect(resumo(page)).toContainText('2 convites pendentes');
    await abre(page, { mandatos: [ANA], rpc: { convites_pendentes: () => ({ corpo: dois.slice(0, 1) }) } });
    await expect(resumo(page)).toContainText('1 convite pendente');
    await expect(resumo(page)).not.toContainText('1 convites');
    await abre(page, { mandatos: [ANA] });
    await expect(resumo(page)).toContainText('0 convites pendentes');
    await expect(resumo(page)).toContainText('0 pessoas');
    await expect(resumo(page).locator('.md-av')).toHaveCount(0);
  });

  test('"Convidar pessoa" abre /mandato/equipe, para qualquer papel', async ({ page }) => {
    for (const papel of ['coordenacao', 'assessoria', 'leitura']) {
      await abre(page, { mandatos: [{ ...ANA, papel }] });
      await expect(resumo(page).getByRole('link', { name: 'Convidar pessoa' })).toHaveAttribute('href', '/mandato/equipe');
    }
  });

  test('lê equipe e convites do mandato ativo, uma vez cada, e troca de mandato pede os do outro', async ({ page }) => {
    await abre(page, { mandatos: [ANA, BRUNO] });
    await expect(resumo(page)).toContainText('0 convites pendentes');
    expect(rpcs('equipe_do_mandato').map((c) => c.corpo)).toEqual([{ p_mandato: MANDATO_A }]);
    expect(rpcs('convites_pendentes').map((c) => c.corpo)).toEqual([{ p_mandato: MANDATO_A }]);
    await page.getByRole('combobox', { name: 'Mandato' }).selectOption(MANDATO_B);
    await expect.poll(() => rpcs('equipe_do_mandato').map((c) => c.corpo)).toEqual([{ p_mandato: MANDATO_A }, { p_mandato: MANDATO_B }]);
    expect(rpcs('convites_pendentes').map((c) => c.corpo)).toEqual([{ p_mandato: MANDATO_A }, { p_mandato: MANDATO_B }]);
  });

  test('falha ao ler a equipe mostra a mensagem e mantém o botão "Convidar pessoa"', async ({ page }) => {
    await abre(page, { mandatos: [ANA], rpc: { equipe_do_mandato: () => ({ rede: true }) } });
    await expect(resumo(page).getByRole('alert')).toHaveText('Não foi possível concluir. Tente de novo.');
    await expect(resumo(page).getByRole('link', { name: 'Convidar pessoa' })).toBeVisible();
  });
});
