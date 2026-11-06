import { test, expect, type Page } from '@playwright/test';
import { auth, chamadas, localDe, naoMapeadas, rpcs, semeiaSessao } from './convite-api';
import { ANA, BRUNO, MANDATO_A, MANDATO_B, leituras, mocaMandato, type EstadoMandato } from './mandato-api';

/* Casca de /mandato: sessão, mandatos da pessoa, mandato ativo, papel e seletor (ACE-05.7 a 05.9). Supabase todo interceptado. */

const MARIANA = { access_token: 'tok-mariana', refresh_token: 'ref-mariana' };

const seletor = (page: Page) => page.getByRole('combobox', { name: 'Mandato' });
const corpo = (page: Page) => page.locator('.md-corpo');
const papelAtivo = (page: Page) => page.getByTestId('papel-ativo');

async function abre(page: Page, estado: EstadoMandato, url = '/mandato') {
  await semeiaSessao(page, MARIANA);
  await mocaMandato(page, estado);
  await page.goto(url);
}

test.afterEach(() => {
  expect(naoMapeadas()).toEqual([]);
});

test.describe('Sem sessão', () => {
  test('mostra "Entre para continuar" com botão para /guia e não chama o banco', async ({ page }) => {
    await mocaMandato(page, { mandatos: [ANA] });
    await page.goto('/mandato');
    await expect(corpo(page).getByRole('heading', { name: 'Entre para continuar' })).toBeVisible();
    await expect(corpo(page).getByRole('link', { name: 'Entrar no Guia' })).toHaveAttribute('href', '/guia');
    await expect(seletor(page)).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    expect(chamadas()).toEqual([]);
    expect(leituras()).toEqual([]);
  });

  test('sessão vencida sem renovação volta para "Entre para continuar"', async ({ page }) => {
    await semeiaSessao(page, { access_token: 'tok-vencido-mariana', refresh_token: 'ref-mariana' });
    await mocaMandato(page, { mandatos: [ANA], renovacao: 'falha' });
    await page.goto('/mandato');
    await expect(corpo(page).getByRole('heading', { name: 'Entre para continuar' })).toBeVisible();
    expect(auth('token?grant_type=refresh_token')).toHaveLength(1);
    expect(leituras('membros')).toEqual([]);
  });

  test('token vencido com refresh_token válido renova, grava a sessão nova em legisla.tok e segue', async ({ page }) => {
    await semeiaSessao(page, { access_token: 'tok-vencido-mariana', refresh_token: 'ref-mariana' });
    await mocaMandato(page, { mandatos: [ANA] });
    await page.goto('/mandato');
    await expect(papelAtivo(page)).toHaveText('Assessoria');
    expect(leituras('membros')[0].token).toBe('tok-novo-mariana');
    expect(JSON.parse((await localDe(page, 'legisla.tok')) ?? 'null')).toEqual({ access_token: 'tok-novo-mariana', refresh_token: 'ref-mariana' });
  });
});

test.describe('Um mandato (ACE-05.8)', () => {
  test('não mostra o seletor, mostra o mandato e o papel, e lê os mandatos da pessoa pela sessão', async ({ page }) => {
    await abre(page, { mandatos: [ANA] });
    await expect(page.getByRole('heading', { level: 1, name: 'Ana Souza' })).toBeVisible();
    await expect(papelAtivo(page)).toHaveText('Assessoria');
    await expect(seletor(page)).toHaveCount(0);
    // quem é a pessoa vem do GoTrue; os mandatos, de membros (como Store.meusMandatos do Guia)
    expect(auth('user')).toHaveLength(1);
    expect(leituras('membros')).toHaveLength(1);
    expect(leituras('membros')[0].consulta).toBe('?select=papel,mandatos(*)&user_id=eq.uid-mariana');
    expect(leituras('membros')[0].token).toBe('tok-mariana');
  });

  test('o mandato ativo é gravado em legisla.mandatoAtual, a mesma chave do Guia', async ({ page }) => {
    await abre(page, { mandatos: [ANA] });
    await expect(papelAtivo(page)).toBeVisible();
    expect(await localDe(page, 'legisla.mandatoAtual')).toBe(MANDATO_A);
  });

  test('o papel do mandato ativo chega aos filhos nos três papéis', async ({ page }) => {
    for (const [papel, rotulo] of [['coordenacao', 'Coordenação'], ['assessoria', 'Assessoria'], ['leitura', 'Somente leitura']]) {
      await abre(page, { mandatos: [{ ...ANA, papel }] });
      await expect(papelAtivo(page)).toHaveText(rotulo);
      await expect(page.locator('.md-barra')).toContainText(`Ana Souza · ${rotulo}`);
    }
  });
});

test.describe('Dois ou mais mandatos (ACE-05.7)', () => {
  test('mostra o seletor no topo com os dois mandatos e abre no primeiro', async ({ page }) => {
    await abre(page, { mandatos: [ANA, BRUNO] });
    await expect(seletor(page)).toBeVisible();
    await expect(seletor(page).locator('option')).toHaveText(['Ana Souza · Deputado(a) Estadual · SP', 'Bruno Alves · Vereador(a) · MG']);
    await expect(seletor(page)).toHaveValue(MANDATO_A);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ana Souza');
    await expect(papelAtivo(page)).toHaveText('Assessoria');
  });

  test('escolher outro mandato troca a página inteira (nome e papel) e grava o mandato ativo', async ({ page }) => {
    await abre(page, { mandatos: [ANA, BRUNO] });
    await seletor(page).selectOption(MANDATO_B);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bruno Alves');
    await expect(papelAtivo(page)).toHaveText('Coordenação');
    expect(await localDe(page, 'legisla.mandatoAtual')).toBe(MANDATO_B);
    // trocar de mandato não pede os mandatos de novo
    expect(leituras('membros')).toHaveLength(1);
  });

  test('o mandato ativo gravado é o que abre, também nas outras telas, e uma escolha antiga que sumiu cai no primeiro', async ({ page }) => {
    await semeiaSessao(page, MARIANA);
    await page.addInitScript((id) => { if (!sessionStorage.getItem('md-ativo')) { sessionStorage.setItem('md-ativo', '1'); localStorage.setItem('legisla.mandatoAtual', id); } }, MANDATO_B);
    await mocaMandato(page, { mandatos: [ANA, BRUNO] });
    await page.goto('/mandato');
    await expect(seletor(page)).toHaveValue(MANDATO_B);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bruno Alves');

    await page.evaluate(() => localStorage.setItem('legisla.mandatoAtual', 'm-que-nao-existe-mais'));
    await page.reload();
    await expect(seletor(page)).toHaveValue(MANDATO_A);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ana Souza');
  });

  test('sem armazenamento do navegador o seletor continua trocando a página', async ({ page }) => {
    await page.addInitScript(() => {
      const gravar = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k: string, v: string) {
        if (k === 'legisla.mandatoAtual') throw new DOMException('cheio', 'QuotaExceededError');
        return gravar.call(this, k, v);
      };
    });
    await abre(page, { mandatos: [ANA, BRUNO] });
    await seletor(page).selectOption(MANDATO_B);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bruno Alves');
    expect(await localDe(page, 'legisla.mandatoAtual')).toBeNull();
  });
});

test.describe('Nenhum mandato (ACE-05.9)', () => {
  test('mostra a mensagem com "Cadastrar um mandato" (/guia) e "Tenho um link de convite" (/convite)', async ({ page }) => {
    await abre(page, { mandatos: [] });
    await expect(corpo(page).getByRole('heading', { name: 'Você ainda não está em nenhum mandato' })).toBeVisible();
    await expect(corpo(page).getByRole('link', { name: 'Cadastrar um mandato' })).toHaveAttribute('href', '/guia');
    await expect(corpo(page).getByRole('link', { name: 'Tenho um link de convite' })).toHaveAttribute('href', '/convite');
    await expect(seletor(page)).toHaveCount(0);
    expect(await localDe(page, 'legisla.mandatoAtual')).toBeNull();
  });

  test('"Tenho um link de convite" leva à página do convite', async ({ page }) => {
    await abre(page, { mandatos: [] });
    await corpo(page).getByRole('link', { name: 'Tenho um link de convite' }).click();
    await page.waitForURL('**/convite');
  });
});

test.describe('Falhas', () => {
  test('falha de rede ao ler os mandatos mostra a mensagem e "Tentar de novo" refaz a leitura', async ({ page }) => {
    await semeiaSessao(page, MARIANA);
    let vez = 0;
    await mocaMandato(page, {
      mandatos: [ANA],
      ler: { membros: () => (++vez === 1 ? { rede: true } : { corpo: [{ papel: 'assessoria', mandatos: { id: MANDATO_A, nome_parlamentar: 'Ana Souza' } }] }) },
    });
    await page.goto('/mandato');
    await expect(corpo(page).getByRole('alert')).toHaveText('Não foi possível concluir. Tente de novo.');
    await corpo(page).getByRole('button', { name: 'Tentar de novo' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Ana Souza' })).toBeVisible();
    expect(leituras('membros')).toHaveLength(2);
  });

  test('erro do servidor na leitura dos mandatos mostra a mesma mensagem, sem tela em branco', async ({ page }) => {
    await abre(page, { mandatos: [ANA], membrosFalha: 'servidor' });
    await expect(corpo(page).getByRole('alert')).toHaveText('Não foi possível concluir. Tente de novo.');
    expect(rpcs('catalogo_exercicios')).toEqual([]);
  });
});

test.describe('Navegação e layout', () => {
  test('a barra leva à Área do mandato e à Equipe e convites, marcando a tela atual', async ({ page }) => {
    await abre(page, { mandatos: [ANA] });
    const nav = page.getByRole('navigation', { name: 'Telas do mandato' });
    await expect(nav.getByRole('link', { name: 'Área do mandato' })).toHaveAttribute('href', '/mandato');
    await expect(nav.getByRole('link', { name: 'Área do mandato' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Equipe e convites' })).toHaveAttribute('href', '/mandato/equipe');
    await expect(nav.getByRole('link', { name: 'Equipe e convites' })).not.toHaveAttribute('aria-current', 'page');
  });

  test('em 400 px não há rolagem horizontal, com seletor e nomes longos', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    const longo = { ...BRUNO, nome_parlamentar: 'Bartolomeu Nepomuceno de Albuquerque e Vasconcelos Filho', cargo: 'Deputado(a) Federal' };
    await abre(page, { mandatos: [ANA, longo] });
    await seletor(page).selectOption(MANDATO_B);
    await expect(papelAtivo(page)).toHaveText('Coordenação');
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra).toBeLessThanOrEqual(0);
  });

  test('o foco do teclado fica visível no seletor', async ({ page }) => {
    await abre(page, { mandatos: [ANA, BRUNO] });
    await seletor(page).focus();
    const contorno = await seletor(page).evaluate((el) => getComputedStyle(el).outlineStyle + ' ' + getComputedStyle(el).outlineWidth);
    expect(contorno).toBe('solid 3px');
  });
});
