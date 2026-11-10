import { test, expect, type Page } from '@playwright/test';
import { chamadas, mandato, moca, naoMapeadas, semeiaSessao, vazou, type EstadoMoca, type Papel } from './admin-api';

/* Seção "Perfil de quem usa a plataforma" do Analytics (PAG-06). Supabase todo interceptado (admin-api.ts).
   Os números esperados vêm da fixture abaixo, contada à mão; nenhuma vem de função do app. */
const NOMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
const ANO = Number(partes.find((p) => p.type === 'year')!.value);
const MES = Number(partes.find((p) => p.type === 'month')!.value);
const mesRel = (k: number) => { const i = ANO * 12 + (MES - 1) + k; return { ano: Math.floor(i / 12), mes: (i % 12) + 1 }; };
const chaveMes = (k: number) => { const { ano, mes } = mesRel(k); return `${ano}-${String(mes).padStart(2, '0')}`; };
const rotuloMes = (k: number) => { const { ano, mes } = mesRel(k); return `${NOMES[mes - 1]}/${String(ano).slice(2)}`; };

// 4 pessoas: gênero 2 mulheres cis, 1 homem cis, 1 prefere não informar; raça 2 parda, 1 preta, 1 prefere não informar;
// faixa 3 em "25 a 34" e 1 em "35 a 44"; atuação 1 não atua, 2 com 1 a 2 anos, 1 com 6 a 10 anos.
const RESUMO = {
  total: 4,
  por_mes: [{ mes: chaveMes(-2), qtd: 1 }, { mes: chaveMes(-1), qtd: 0 }, { mes: chaveMes(0), qtd: 3 }],
  genero: { mulher_cis: 2, homem_cis: 1, nao_informar: 1 },
  raca: { parda: 2, preta: 1, nao_informar: 1 },
  faixa: { '25 a 34': 3, '35 a 44': 1 },
  atuacao: { nao_atua: 1, '1_2': 2, '6_10': 1 },
};
const SEM_PERFIL = { total: 0, por_mes: [], genero: {}, raca: {}, faixa: {}, atuacao: {} };

const estado = (extra: EstadoMoca = {}): EstadoMoca => ({
  views: {
    v_admin_mandatos: [mandato({ id: 'a1', criado_em: new Date().toISOString(), ultima_atividade: new Date().toISOString() })],
    v_admin_exercicios: [], v_admin_eventos_mes: [], v_admin_uso_campos: [], v_admin_uso: [], exercicios_guia: [],
  },
  rpc: { admin_perfil_resumo: () => ({ corpo: RESUMO }) },
  ...extra,
});

async function abre(page: Page, extra: EstadoMoca = {}, papel: Papel = 'admin') {
  await semeiaSessao(page, papel);
  await moca(page, estado(extra));
  await page.goto('/admin/analytics');
  await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
  await expect(page.locator('.kpis').first()).toBeVisible();
}

const secao = (page: Page) => page.getByRole('region', { name: 'Perfil de quem usa a plataforma' });
const grafico = (page: Page, titulo: string) => secao(page).getByRole('group', { name: titulo });
const linha = (page: Page, titulo: string, rotulo: string) => grafico(page, titulo).locator('.fr', { hasText: rotulo });

test.afterEach(() => {
  expect(naoMapeadas()).toEqual([]);
  expect(vazou()).toEqual([]);
});

test('admin vê a seção com o total de pessoas e o gráfico de cadastros por mês, meses vazios em zero (PAG-06.1, 06.2)', async ({ page }) => {
  await abre(page);
  await expect(secao(page)).toBeVisible();
  await expect(secao(page).locator('.kpi b')).toHaveText('4');
  const g = grafico(page, 'Cadastros de perfil por mês');
  await expect(g.locator('.cl')).toHaveCount(3);
  await expect(g.locator('.cl').nth(0)).toHaveAttribute('aria-label', new RegExp(`^${rotuloMes(-2)}: .* 1$`));
  await expect(g.locator('.cl').nth(1)).toHaveAttribute('aria-label', new RegExp(`^${rotuloMes(-1)}: .* 0$`));
  await expect(g.locator('.cl').nth(2)).toHaveAttribute('aria-label', new RegExp(`^${rotuloMes(0)}: .* 3$`));
});

test('leitura da equipe também vê a seção (PAG-06.1)', async ({ page }) => {
  await abre(page, {}, 'leitura');
  await expect(secao(page)).toBeVisible();
  await expect(secao(page).locator('.kpi b')).toHaveText('4');
});

test('gênero, raça, faixa etária e atuação mostram número e porcentagem inteira de cada categoria (PAG-06.3)', async ({ page }) => {
  await abre(page);
  await expect(linha(page, 'Gênero de quem tem perfil', 'Mulher cisgênero')).toContainText('2 · 50%');
  await expect(linha(page, 'Gênero de quem tem perfil', 'Homem cisgênero')).toContainText('1 · 25%');
  await expect(linha(page, 'Raça ou cor de quem tem perfil', 'Parda')).toContainText('2 · 50%');
  await expect(linha(page, 'Raça ou cor de quem tem perfil', 'Preta')).toContainText('1 · 25%');
  await expect(linha(page, 'Faixa etária de quem tem perfil', '25 a 34')).toContainText('3 · 75%');
  await expect(linha(page, 'Faixa etária de quem tem perfil', '35 a 44')).toContainText('1 · 25%');
  await expect(linha(page, 'Atuação política de quem tem perfil', 'Não atuo na política')).toContainText('1 · 25%');
  await expect(linha(page, 'Atuação política de quem tem perfil', '1 a 2 anos')).toContainText('2 · 50%');
  await expect(linha(page, 'Atuação política de quem tem perfil', '6 a 10 anos')).toContainText('1 · 25%');
});

test('toda categoria da spec aparece, na ordem da spec, e a que não tem ninguém mostra "0 · 0%" (PAG-06.3; spec, Assumption "Categorias sem ninguém no Analytics")', async ({ page }) => {
  await abre(page);
  const rotulos = (titulo: string) => grafico(page, titulo).locator('.fr > span');
  await expect(rotulos('Gênero de quem tem perfil')).toHaveText([
    'Mulher cisgênero', 'Homem cisgênero', 'Mulher transgênero', 'Homem transgênero', 'Travesti', 'Pessoa não binária', 'Outra identidade', 'Prefiro não informar',
  ]);
  await expect(rotulos('Raça ou cor de quem tem perfil')).toHaveText(['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Prefiro não informar']);
  await expect(rotulos('Faixa etária de quem tem perfil')).toHaveText(['Até 24', '25 a 34', '35 a 44', '45 a 54', '55 a 64', '65 ou mais']);
  await expect(rotulos('Atuação política de quem tem perfil')).toHaveText([
    'Não atuo na política', 'Menos de 1 ano', '1 a 2 anos', '3 a 5 anos', '6 a 10 anos', 'Mais de 10 anos',
  ]);
  // a fixture não tem ninguém nestas categorias
  await expect(linha(page, 'Gênero de quem tem perfil', 'Mulher transgênero')).toContainText('0 · 0%');
  await expect(linha(page, 'Gênero de quem tem perfil', 'Travesti')).toContainText('0 · 0%');
  await expect(linha(page, 'Raça ou cor de quem tem perfil', 'Branca')).toContainText('0 · 0%');
  await expect(linha(page, 'Raça ou cor de quem tem perfil', 'Indígena')).toContainText('0 · 0%');
  await expect(linha(page, 'Faixa etária de quem tem perfil', 'Até 24')).toContainText('0 · 0%');
  await expect(linha(page, 'Faixa etária de quem tem perfil', '65 ou mais')).toContainText('0 · 0%');
  await expect(linha(page, 'Atuação política de quem tem perfil', 'Menos de 1 ano')).toContainText('0 · 0%');
  await expect(linha(page, 'Atuação política de quem tem perfil', 'Mais de 10 anos')).toContainText('0 · 0%');
});

test('"Prefiro não informar" aparece como categoria própria em gênero e em raça (PAG-06.4)', async ({ page }) => {
  await abre(page);
  await expect(linha(page, 'Gênero de quem tem perfil', 'Prefiro não informar')).toContainText('1 · 25%');
  await expect(linha(page, 'Raça ou cor de quem tem perfil', 'Prefiro não informar')).toContainText('1 · 25%');
});

test('cada gráfico tem título que diz o que mede e a categoria em texto, não só em cor (PAG-06.11)', async ({ page }) => {
  await abre(page);
  const titulos = ['Cadastros de perfil por mês', 'Gênero de quem tem perfil', 'Raça ou cor de quem tem perfil', 'Faixa etária de quem tem perfil', 'Atuação política de quem tem perfil'];
  for (const t of titulos) {
    await expect(grafico(page, t)).toBeVisible();
    await expect(grafico(page, t).locator('.cs')).not.toBeEmpty(); // linha que explica a unidade
  }
  // categoria como texto visível e também no rótulo de leitor de tela
  const meter = linha(page, 'Gênero de quem tem perfil', 'Mulher cisgênero').locator('.meter');
  await expect(meter).toHaveAttribute('aria-label', 'Mulher cisgênero: 2 · 50%');
});

test('a tela e as chamadas não trazem nome, e-mail, telefone nem data de nascimento; só a função de resumo é chamada (PAG-06.6)', async ({ page }) => {
  await abre(page);
  await expect(secao(page).locator('.kpi b')).toHaveText('4');
  const corpo = await secao(page).innerText();
  expect(corpo).not.toMatch(/@|\d{4}-\d{2}-\d{2}|\(\d{2}\)|\d{8,}/);
  const doPerfil = chamadas().filter((c) => /perfis|perfil/.test(c.caminho));
  expect(doPerfil.map((c) => `${c.metodo} ${c.caminho}`)).toEqual(['POST rpc/admin_perfil_resumo']);
});

test('sem perfis mostra "Ainda não há perfis cadastrados." e nenhum gráfico na seção (PAG-06.9)', async ({ page }) => {
  await abre(page, { rpc: { admin_perfil_resumo: () => ({ corpo: SEM_PERFIL }) } });
  await expect(secao(page).getByText('Ainda não há perfis cadastrados.', { exact: true })).toBeVisible();
  await expect(secao(page).locator('.chart')).toHaveCount(0);
});

test('falha da função mostra a mensagem de erro e o resto do Analytics segue (PAG-06.10)', async ({ page }) => {
  await abre(page, { rpc: { admin_perfil_resumo: () => ({ status: 500, corpo: { message: 'boom' } }) } });
  await expect(secao(page).getByText('Não foi possível carregar o perfil. Tente de novo.', { exact: true })).toBeVisible();
  await expect(secao(page).locator('.chart')).toHaveCount(0);
  // o restante do Analytics continua à mostra
  await expect(page.locator('.kpi').first().locator('b')).toHaveText('1');
  await expect(page.getByRole('group', { name: 'Status de atividade dos mandatos por mês' })).toBeVisible();
});

test('em 400 px a seção cabe na tela, sem rolagem horizontal (PAG-06.11)', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await abre(page);
  await expect(grafico(page, 'Atuação política de quem tem perfil')).toBeVisible();
  const larguras = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, janela: window.innerWidth }));
  expect(larguras.doc).toBeLessThanOrEqual(larguras.janela);
});
