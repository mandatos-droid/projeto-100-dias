import { test, expect, type Page } from '@playwright/test';
import { abreGuia } from './guia-real';
import * as area from './area-api';

/* Área do mandato (#/config): a tela única do mandato dentro do Guia, com 4 abas (AMA-01, AMA-04). O Guia abre de verdade
   (todos os scripts do legado) em modo local (guia-real.ts): nada sai da máquina. O mandato semeado tem 1 pessoa. */

const ROTULOS = ['Visão geral', 'Dados do mandato', 'Equipe e convites (1)', 'Minha conta'];
const ABAS: { hash: string; nome: string; painel: string }[] = [
  { hash: '#/config', nome: 'Visão geral', painel: 'areaVisao' },
  { hash: '#/config/dados', nome: 'Dados do mandato', painel: 'areaDados' },
  { hash: '#/config/equipe', nome: 'Equipe e convites (1)', painel: 'areaEquipe' },
  { hash: '#/config/conta', nome: 'Minha conta', painel: 'areaConta' },
];
/** As mesmas abas no mandato de area-api.ts (Lia e Mariana: 2 pessoas). */
const ABAS_NUVEM = ABAS.map((a) => (a.painel === 'areaEquipe' ? { ...a, nome: 'Equipe e convites (2)' } : a));

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

/* ---------- Aba Visão geral (AMA-02.1, 02.2, 02.10; Edge Cases de papel e de troca de mandato) ----------
   Aqui o Guia abre em modo nuvem com Lia logada (area-api.ts): o Supabase é todo respondido por uma nuvem em memória. */
test.describe('Visão geral', () => {
  const visao = (page: Page) => page.locator('#areaVisao');
  const cartao = (page: Page) => visao(page).locator('.md-cartao');
  const resumo = (page: Page) => visao(page).locator('.md-resumo');
  const atividade = (page: Page) => visao(page).locator('.md-atividade');
  const AVISO_POSSE = 'Informe a data de posse para acompanhar os prazos.';
  const ERRO_LEITURA = 'Não foi possível concluir. Tente de novo.';
  const marca = (page: Page) => page.evaluate(() => { (window as unknown as { __mesmaPagina: boolean }).__mesmaPagina = true; });
  const mesmaPagina = (page: Page) => page.evaluate(() => (window as unknown as { __mesmaPagina?: boolean }).__mesmaPagina === true);

  test.afterEach(() => {
    expect(area.naoMapeadas()).toEqual([]);
  });

  test('mostra o cartão do mandato com nome, cargo, UF, partido e posse, e o papel da pessoa (AMA-02.1)', async ({ page }) => {
    await area.abreArea(page, '#/config');
    await expect(cartao(page).getByRole('heading', { level: 2 })).toHaveText('Ana Souza');
    await expect(cartao(page).locator('.md-cartao-info')).toHaveText('Deputado(a) Estadual · SP · Partido Exemplo · posse em 01/02/2027');
    await expect(cartao(page).getByTestId('papel-ativo')).toHaveText('Coordenação');
  });

  for (const [papel, rotulo] of [['assessoria', 'Assessoria'], ['leitura', 'Somente leitura']] as const) {
    test(`o papel mostrado é o da própria pessoa no mandato: ${papel} vira "${rotulo}" (AMA-02.1)`, async ({ page }) => {
      await area.abreArea(page, '#/config', { papel });
      await expect(cartao(page).getByTestId('papel-ativo')).toHaveText(rotulo);
    });
  }

  test('com dados.tse.sq pede a foto do TSE; sem a foto ficam as iniciais (AMA-02.1)', async ({ page }) => {
    await area.abreArea(page, '#/config', { mandato: { dados: { tse: { sq: '250001234567', ano: 2026 } } } });
    await expect.poll(() => area.fotos()).toContain('https://resultados.tse.jus.br/oficial/ele2026/6259/fotos/sp/250001234567.jpeg');
    await expect(cartao(page).locator('.md-foto img')).toHaveCount(0); // a foto que falhou sai da tela
    await expect(cartao(page).locator('.md-foto')).toHaveText('AS');
  });

  test('mostra o resumo da equipe: avatares, total de pessoas e convites pendentes do mandato aberto (AMA-02.1)', async ({ page }) => {
    await area.abreArea(page, '#/config', {
      equipe: [area.membro(area.MANDATO_A, area.MARIANA.id, area.MARIANA.nome, 'coordenacao'), area.membro(area.MANDATO_A, 'uid-joao', 'João Pereira', 'assessoria'),
        area.membro(area.MANDATO_A, 'uid-luiza', 'Luiza Ferraz', 'leitura')],
      convites: [area.convite('c1', 'Carlos Lima'), area.convite('c2', 'Dora Alves', 'leitura')],
    });
    await expect(resumo(page).locator('.md-av')).toHaveText(['LT', 'MR', 'JP']);
    await expect(resumo(page)).toContainText('4 pessoas · 2 convites pendentes');
    expect(area.rpcs('equipe_do_mandato').map((p) => [p.corpo, p.token])).toEqual([[{ p_mandato: area.MANDATO_A }, area.LIA.token]]);
    expect(area.rpcs('convites_pendentes').map((p) => [p.corpo, p.token])).toEqual([[{ p_mandato: area.MANDATO_A }, area.LIA.token]]);
  });

  test('mostra a atividade recente do mandato aberto (AMA-02.1)', async ({ page }) => {
    await area.abreArea(page, '#/config', { eventos: [
      area.evento(2, 'convite_criado', 'Mariana Rocha', 'Carlos Lima', 'assessoria'),
      area.evento(1, 'papel_trocado', 'Mariana Rocha', 'Lia Torres', 'coordenacao'),
      area.evento(3, 'membro_saiu', 'Bruno Alves', 'Bruno Alves', null, area.MANDATO_B),
    ] });
    await expect(atividade(page).locator('li .md-evento-texto')).toHaveText([
      'Mariana convidou Carlos Lima como Assessoria',
      'Mariana mudou o papel de Lia Torres para Coordenação',
    ]);
    expect(area.leituras('eventos_equipe').map((p) => p.caminho)).toEqual([
      `eventos_equipe?select=id,criado_em,ator_nome,tipo,alvo_nome,papel&mandato_id=eq.${area.MANDATO_A}&order=criado_em.desc,id.desc&limit=10`,
    ]);
  });

  test('não mostra o andamento dos 100 dias nem as missões (AMA-02.1)', async ({ page }) => {
    await area.abreArea(page, '#/config', { mandato: { dados: { feitos: { 'm1.persona': true } } } });
    await expect(cartao(page)).toBeVisible();
    await expect(atividade(page)).toBeVisible();
    await expect(visao(page).locator('.md-andamento, .md-missoes-bloco, [data-missao]')).toHaveCount(0);
    await expect(visao(page)).not.toContainText(/Miss(ão|ões)/);
    await expect(visao(page)).not.toContainText(/Dia \d+ de 100|100 dias concluídos|Posse em /);
    expect(area.rpcs('catalogo_exercicios')).toEqual([]);
  });

  test('"Convidar pessoa" abre a aba Equipe e convites pelo endereço #/config/equipe, sem recarregar a página', async ({ page }) => {
    await area.abreArea(page, '#/config');
    await marca(page);
    const link = resumo(page).getByRole('link', { name: 'Convidar pessoa' });
    await expect(link).toHaveAttribute('href', '#/config/equipe');
    await link.click();
    await expect(page).toHaveURL(fim('#/config/equipe'));
    await ativa(page, ABAS_NUVEM[2]);
    expect(await mesmaPagina(page)).toBe(true);
  });

  test('sem data de posse aparece o aviso com "Informar agora", que abre a aba Dados do mandato (AMA-02.2)', async ({ page }) => {
    await area.abreArea(page, '#/config', { mandato: { data_posse: null } });
    await marca(page);
    const aviso = visao(page).getByRole('status').filter({ hasText: AVISO_POSSE });
    await expect(aviso).toHaveText(`${AVISO_POSSE} Informar agora`);
    await expect(cartao(page).locator('.md-cartao-info')).toHaveText('Deputado(a) Estadual · SP · Partido Exemplo');
    const link = aviso.getByRole('link', { name: 'Informar agora' });
    await expect(link).toHaveAttribute('href', '#/config/dados');
    await link.click();
    await expect(page).toHaveURL(fim('#/config/dados'));
    await ativa(page, ABAS_NUVEM[1]);
    expect(await mesmaPagina(page)).toBe(true);
  });

  test('com data de posse o aviso não aparece (AMA-02.2)', async ({ page }) => {
    await area.abreArea(page, '#/config');
    await expect(cartao(page)).toBeVisible();
    await expect(page.getByText(AVISO_POSSE)).toHaveCount(0);
    await expect(visao(page).getByRole('link', { name: 'Informar agora' })).toHaveCount(0);
  });

  test('falha ao ler a equipe mostra o erro e "Tentar de novo" na aba, sem derrubar o resto; tentar de novo mostra o resumo (AMA-02.10)', async ({ page }) => {
    const estado: area.EstadoArea = { falha: { 'rpc/equipe_do_mandato': 'servidor' } };
    await area.abreArea(page, '#/config', estado);
    await expect(resumo(page).getByRole('alert')).toHaveText(ERRO_LEITURA);
    await expect(cartao(page).getByRole('heading', { level: 2 })).toHaveText('Ana Souza');
    await expect(atividade(page)).toContainText('Nenhuma atividade ainda.');
    estado.falha = {};
    await resumo(page).getByRole('button', { name: 'Tentar de novo' }).click();
    await expect(resumo(page)).toContainText('2 pessoas · 0 convites pendentes');
    await expect(resumo(page).getByRole('alert')).toHaveCount(0);
    expect(area.rpcs('equipe_do_mandato')).toHaveLength(2);
    // as outras abas seguem funcionando
    await aba(page, 'Minha conta').click();
    await ativa(page, ABAS_NUVEM[3]);
  });

  test('falha ao ler a atividade mostra o erro e "Tentar de novo" na aba; tentar de novo lê de novo (AMA-02.10)', async ({ page }) => {
    const estado: area.EstadoArea = { falha: { eventos_equipe: 'rede' } };
    await area.abreArea(page, '#/config', estado);
    await expect(atividade(page).getByRole('alert')).toHaveText(ERRO_LEITURA);
    await expect(resumo(page)).toContainText('2 pessoas');
    estado.falha = {};
    await atividade(page).getByRole('button', { name: 'Tentar de novo' }).click();
    await expect(atividade(page)).toContainText('Nenhuma atividade ainda.');
    await expect(atividade(page).getByRole('alert')).toHaveCount(0);
    expect(area.leituras('eventos_equipe')).toHaveLength(2);
  });

  test('sem o papel da pessoa no mandato, a aba mostra "Não foi possível carregar. Tente de novo." e nada mais; "Tentar de novo" relê o mandato (Edge Case: papel)', async ({ page }) => {
    const estado: area.EstadoArea = { semLiaNosMembros: true };
    await area.abreArea(page, '#/config', estado);
    await expect(visao(page).getByRole('alert')).toHaveText('Não foi possível carregar. Tente de novo.');
    await expect(visao(page).locator('.md-cartao, .md-resumo, .md-atividade')).toHaveCount(0);
    await expect(visao(page).getByRole('link')).toHaveCount(0);
    expect(area.rpcs('equipe_do_mandato')).toEqual([]);
    const lidos = area.leituras('membros').length;
    estado.semLiaNosMembros = false;
    await visao(page).getByRole('button', { name: 'Tentar de novo' }).click();
    await expect(cartao(page).getByTestId('papel-ativo')).toHaveText('Coordenação');
    expect(area.leituras('membros').length).toBeGreaterThan(lidos);
  });

  test('trocar de mandato na barra lateral estando na Área recarrega a aba aberta com o mandato novo, sem restos do anterior (Edge Case: troca de mandato)', async ({ page }) => {
    await area.abreArea(page, '#/config', { outros: [{ mandato: area.BRUNO, papel: 'leitura' }], eventos: [area.evento(1, 'convite_criado', 'Mariana Rocha', 'Carlos Lima', 'assessoria')] });
    await expect(cartao(page).getByRole('heading', { level: 2 })).toHaveText('Ana Souza');
    await expect(atividade(page).locator('li')).toHaveCount(1);
    await page.locator('#ladoNav .sel-it', { hasText: 'Bruno Alves' }).click();
    await expect(cartao(page).getByRole('heading', { level: 2 })).toHaveText('Bruno Alves');
    await expect(page).toHaveURL(fim('#/config'));
    await expect(cartao(page).locator('.md-cartao-info')).toHaveText('Vereador(a) · MG · Outro Partido · posse em 01/01/2027');
    await expect(cartao(page).getByTestId('papel-ativo')).toHaveText('Somente leitura');
    await expect(atividade(page)).toContainText('Nenhuma atividade ainda.');
    await expect(visao(page)).not.toContainText('Ana Souza');
    await expect.poll(() => area.rpcs('equipe_do_mandato').map((p) => p.corpo)).toEqual([{ p_mandato: area.MANDATO_A }, { p_mandato: area.MANDATO_B }]);
    expect(area.leituras('eventos_equipe').at(-1)?.caminho).toContain(`mandato_id=eq.${area.MANDATO_B}`);
  });

  test('em 400 px a Visão geral não cria rolagem horizontal, mesmo com nome e partido longos (AMA-04.3)', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await area.abreArea(page, '#/config', { mandato: {
      nome_parlamentar: 'Bartolomeu Nepomuceno de Albuquerque e Vasconcelos Filho', partido: 'Partido Muito Longo da Renovação Democrática Nacional',
    }, eventos: [area.evento(1, 'convite_criado', 'Mariana Rocha', 'Maria Aparecida dos Santos Figueiredo Nogueira', 'assessoria')] });
    await expect(atividade(page).locator('li')).toHaveCount(1);
    await expect(resumo(page)).toContainText('2 pessoas');
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra).toBe(0);
  });
});
