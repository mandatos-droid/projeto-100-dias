import { test, expect, type Page } from '@playwright/test';
import { abreGuia } from './guia-real';

/* Área do mandato (#/config): a tela única do mandato dentro do Guia, com 4 abas (AMA-01, AMA-04). O Guia abre de verdade
   (todos os scripts do legado) em modo local (guia-real.ts): nada sai da máquina. O mandato semeado tem 1 pessoa. */

const ROTULOS = ['Visão geral', 'Dados do mandato', 'Equipe e convites (1)', 'Minha conta'];
const ABAS: { hash: string; nome: string; painel: string }[] = [
  { hash: '#/config', nome: 'Visão geral', painel: 'areaVisao' },
  { hash: '#/config/dados', nome: 'Dados do mandato', painel: 'areaDados' },
  { hash: '#/config/equipe', nome: 'Equipe e convites (1)', painel: 'areaEquipe' },
  { hash: '#/config/conta', nome: 'Minha conta', painel: 'areaConta' },
];

const lista = (page: Page) => page.getByRole('tablist', { name: 'Área do mandato' });
const aba = (page: Page, nome: string) => lista(page).getByRole('tab', { name: nome, exact: true });
const itemDoMenu = (page: Page) => page.locator('#ladoNav .it[href="#/config"]');
const vaiPara = (page: Page, hash: string) => page.evaluate((h) => { location.hash = h; }, hash);
const fim = (hash: string) => new RegExp(`${hash.replace(/[/#]/g, '\\$&')}$`);

/** A aba `nome` está selecionada e só o painel dela está à mostra. */
async function ativa(page: Page, a: { nome: string; painel: string }) {
  await expect(aba(page, a.nome)).toHaveAttribute('aria-selected', 'true');
  await expect(lista(page).locator('[role="tab"][aria-selected="true"]')).toHaveCount(1);
  const visiveis = page.getByRole('tabpanel');
  await expect(visiveis).toHaveCount(1);
  await expect(visiveis).toHaveAttribute('id', a.painel);
}

test('o grupo Mandato do menu mostra "Área do mandato" no lugar de "Configurações" (AMA-01.1)', async ({ page }) => {
  await abreGuia(page, '#/');
  const nav = page.locator('#ladoNav');
  await expect(nav.getByRole('link', { name: 'Área do mandato' })).toHaveAttribute('href', '#/config');
  await expect(nav).not.toContainText('Configurações');
  // o item fica no grupo "Mandato": entre o título do grupo e o próximo título (ou o fim do menu)
  const grupos = await nav.evaluate((n) => {
    const g: Record<string, string[]> = {};
    let atual = '';
    for (const e of n.children) {
      if (e.matches('.nav-grupo')) { atual = e.textContent?.trim() ?? ''; g[atual] = []; }
      else if (e.matches('.it') && atual) g[atual].push(e.querySelector('.tx')?.textContent?.trim() ?? '');
    }
    return g;
  });
  expect(grupos['Mandato']).toContain('Resumo do preenchimento');
  expect(grupos['Mandato']).toContain('Área do mandato');
  expect(Object.values(grupos).flat()).not.toContain('Configurações');
});

test('#/config abre a Área do mandato com as abas Visão geral, Dados do mandato, Equipe e convites e Minha conta, Visão geral ativa (AMA-01.2, AMA-04.1)', async ({ page }) => {
  await abreGuia(page, '#/config');
  await expect(page.getByRole('heading', { level: 1, name: 'Área do mandato' })).toBeVisible();
  await expect(lista(page).getByRole('tab')).toHaveText(ROTULOS);
  await ativa(page, ABAS[0]);
  await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', await aba(page, 'Visão geral').getAttribute('id') ?? '');
});

for (const a of ABAS.slice(1)) {
  test(`abrir ${a.hash} mostra a aba ${a.nome} ativa (AMA-01.3)`, async ({ page }) => {
    await abreGuia(page, a.hash);
    await ativa(page, a);
    await expect(page).toHaveURL(fim(a.hash));
  });
}

test('aba desconhecida (#/config/xyz) mostra a Visão geral (AMA-01.6)', async ({ page }) => {
  await abreGuia(page, '#/config/xyz');
  await ativa(page, ABAS[0]);
});

test('clicar numa aba troca o conteúdo sem recarregar a página e atualiza o endereço (AMA-01.4)', async ({ page }) => {
  await abreGuia(page, '#/config');
  await page.evaluate(() => { (window as unknown as { __mesmaPagina: boolean }).__mesmaPagina = true; });
  await aba(page, 'Dados do mandato').click();
  await expect(page).toHaveURL(fim('#/config/dados'));
  await ativa(page, ABAS[1]);
  await aba(page, 'Minha conta').click();
  await expect(page).toHaveURL(fim('#/config/conta'));
  await ativa(page, ABAS[3]);
  expect(await page.evaluate(() => (window as unknown as { __mesmaPagina?: boolean }).__mesmaPagina)).toBe(true);
});

test('o Voltar do navegador mostra a aba anterior (AMA-01.5)', async ({ page }) => {
  await abreGuia(page, '#/config');
  await aba(page, 'Dados do mandato').click();
  await ativa(page, ABAS[1]);
  await aba(page, 'Minha conta').click();
  await ativa(page, ABAS[3]);
  await page.goBack();
  await expect(page).toHaveURL(fim('#/config/dados'));
  await ativa(page, ABAS[1]);
  await page.goBack();
  await expect(page).toHaveURL(fim('#/config'));
  await ativa(page, ABAS[0]);
});

test('em todas as abas o menu lateral segue à mostra, com "Área do mandato" como item ativo (AMA-01.7)', async ({ page }) => {
  await abreGuia(page, '#/');
  await expect(itemDoMenu(page)).not.toHaveClass(/\bon\b/);
  for (const a of ABAS) {
    await vaiPara(page, a.hash);
    await ativa(page, a);
    await expect(page.locator('#lado')).toBeVisible();
    await expect(page.locator('#ladoMandato')).toContainText('Ana Souza');
    await expect(itemDoMenu(page)).toHaveClass(/\bon\b/);
    await expect(page.locator('#ladoNav .it.on')).toHaveCount(1);
  }
});

test('com o foco na lista, as setas movem o foco e ativam a aba vizinha; Home e End vão à primeira e à última (AMA-04.2)', async ({ page }) => {
  await abreGuia(page, '#/config');
  await aba(page, 'Visão geral').focus();
  const passo = async (tecla: string, a: (typeof ABAS)[number]) => {
    await page.keyboard.press(tecla);
    await expect(aba(page, a.nome)).toBeFocused();
    await ativa(page, a);
    await expect(page).toHaveURL(fim(a.hash));
  };
  await passo('ArrowRight', ABAS[1]);
  await passo('ArrowRight', ABAS[2]);
  await passo('ArrowLeft', ABAS[1]);
  await passo('End', ABAS[3]);
  await passo('Home', ABAS[0]);
});

test('em 400 px a página não rola para o lado: a lista de abas rola dentro do próprio contêiner (AMA-04.3)', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await abreGuia(page, '#/config');
  for (const a of ABAS) {
    await vaiPara(page, a.hash);
    await ativa(page, a);
    const medida = await page.evaluate(() => {
      const raiz = document.documentElement, l = document.querySelector('#tela [role="tablist"]') as HTMLElement;
      return { pagina: raiz.scrollWidth - raiz.clientWidth, lista: l.scrollWidth - l.clientWidth, rolagem: getComputedStyle(l).overflowX };
    });
    expect(medida.pagina, a.hash).toBe(0);
    expect(medida.lista, a.hash).toBeGreaterThan(0); // as 4 abas não cabem em 400 px: quem rola é a lista
    expect(['auto', 'scroll']).toContain(medida.rolagem);
  }
  // a última aba, fora da largura, é alcançada rolando a lista
  await aba(page, 'Visão geral').focus();
  await page.keyboard.press('End');
  await expect(aba(page, 'Minha conta')).toBeInViewport();
});
