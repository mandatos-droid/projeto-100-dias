import { test, expect, type Page } from '@playwright/test';
import { abre, dadoDe, MANDATO } from './semente-rumo';

/* Missão 4 · clipping de imprensa (CAP-30, CAP-31). A busca é sempre simulada: nenhuma chamada chega ao Google nem ao Supabase. */
const ILHA = 'capital-comunicacao';
const BANDEIRAS = { 'm3.mural': 'Saúde\nEducação', 'm3.b1': 'Saúde', 'm3.b2': 'Educação' };
type Noticia = { id: string; semana: string; titulo: string; veiculo: string; data: string; url: string; bandeiras: string[]; manual?: boolean; oculta?: boolean };
const clipping = async (page: Page) => (((await dadoDe(page, 'comunicacao')) as { clipping: Noticia[] } | undefined)?.clipping ?? []);

const ITENS = [
  { titulo: 'Deputada defende mais verba para escolas', veiculo: 'O Globo', data: '2026-10-26', url: 'https://exemplo.test/a' },
  { titulo: 'Projeto sobre hospitais avança na Casa', veiculo: 'VEJA', data: '2026-10-27', url: 'https://exemplo.test/b' },
  { titulo: 'Outra Ana Souza vence concurso de poesia', veiculo: 'Jornal X', data: '2026-10-25', url: 'https://exemplo.test/c' },
];
/** Simula a rota de busca e devolve o que ela recebeu. */
async function simulaBusca(page: Page, resposta: { status?: number; itens?: unknown[]; corpo?: unknown } = {}) {
  const pedidos: { auth: string | undefined; corpo: Record<string, unknown> }[] = [];
  await page.route('**/api/clipping', async (rota) => {
    pedidos.push({ auth: rota.request().headers()['authorization'], corpo: rota.request().postDataJSON() });
    await rota.fulfill({ status: resposta.status ?? 200, contentType: 'application/json', body: JSON.stringify(resposta.corpo ?? { itens: resposta.itens ?? ITENS }) });
  });
  return pedidos;
}
const clip = (page: Page) => page.locator('.cp-clip');
const busca = (page: Page) => page.getByRole('button', { name: 'Buscar notícias da semana' });
const lista = (page: Page) => page.locator('.cp-clip-lista').first();
const linha = (page: Page, titulo: string) => page.locator('li.cp-not', { hasText: titulo });

test.describe('Buscar notícias da semana (CAP-30.1)', () => {
  test('lista título, veículo, data e link; manda o nome parlamentar à rota e não grava nada além disso', async ({ page }) => {
    const pedidos = await simulaBusca(page);
    await abre(page, [ILHA], { mandato: MANDATO, campos: BANDEIRAS });
    await busca(page).click();
    await expect(page.locator('li.cp-not')).toHaveCount(3);
    const l = linha(page, 'Deputada defende mais verba para escolas');
    await expect(l).toContainText('O Globo · 26/10/2026');
    await expect(l.getByRole('link')).toHaveAttribute('href', 'https://exemplo.test/a');
    await expect(l.getByRole('link')).toHaveAttribute('rel', /noopener/);
    expect(pedidos).toHaveLength(1);
    expect(pedidos[0].corpo).toMatchObject({ nome: 'Ana Souza', dias: 7 });
    const salvo = await clipping(page);
    expect(salvo).toHaveLength(3);
    for (const n of salvo) expect(Object.keys(n).sort()).toEqual(['bandeiras', 'data', 'id', 'semana', 'titulo', 'url', 'veiculo']);
    expect(salvo.map((n) => n.bandeiras)).toEqual([[], [], []]);
  });

  test('buscar de novo não repete as notícias que já estão na lista, nem as ocultas', async ({ page }) => {
    await simulaBusca(page);
    await abre(page, [ILHA], { mandato: MANDATO, campos: BANDEIRAS });
    await busca(page).click();
    await linha(page, 'Outra Ana Souza').getByRole('button', { name: /^Ocultar/ }).click();
    await busca(page).click();
    await expect(clip(page).getByRole('status')).toContainText('Nenhuma notícia nova');
    expect(await clipping(page)).toHaveLength(3);
  });

  test('sem nome parlamentar no mandato não busca e orienta a adicionar manualmente', async ({ page }) => {
    const pedidos = await simulaBusca(page);
    await abre(page, [ILHA], { mandato: { ...MANDATO, nome_parlamentar: '' } });
    await busca(page).click();
    await expect(clip(page).getByRole('alert')).toContainText('Informe o nome parlamentar');
    expect(pedidos).toHaveLength(0);
  });
});

test.describe('Falha da busca (CAP-30.8)', () => {
  for (const [nome, resp] of [['fonte fora do ar (502)', { status: 502, corpo: { erro: 'x' } }], ['sem login (401)', { status: 401, corpo: { erro: 'x' } }], ['resposta sem a lista', { corpo: { qualquer: 1 } }]] as const) {
    test(`${nome}: mostra "Não consegui buscar agora. Adicione manualmente" e o resto da tela segue funcionando`, async ({ page }) => {
      await simulaBusca(page, resp);
      await abre(page, [ILHA], { mandato: MANDATO, campos: BANDEIRAS });
      await busca(page).click();
      await expect(clip(page).getByRole('alert')).toHaveText('Não consegui buscar agora. Adicione manualmente');
      await expect(page.locator('details[data-secao]')).toHaveCount(5);
      await page.getByRole('button', { name: 'Adicionar aparição manual' }).click();
      await page.getByLabel('Título').fill('Entrevista na rádio');
      await page.getByRole('button', { name: 'Adicionar à lista' }).click();
      await expect(page.locator('li.cp-not')).toHaveCount(1);
    });
  }

  test('falha de rede também vira a mensagem amigável, sem erro na página', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await page.route('**/api/clipping', (rota) => rota.abort());
    await abre(page, [ILHA], { mandato: MANDATO, campos: BANDEIRAS });
    await busca(page).click();
    await expect(clip(page).getByRole('alert')).toContainText('Não consegui buscar agora');
    expect(erros).toEqual([]);
  });

  test('limite de 10 buscas por hora (429) mostra a mensagem do limite', async ({ page }) => {
    await simulaBusca(page, { status: 429, corpo: { erro: 'x' } });
    await abre(page, [ILHA], { mandato: MANDATO });
    await busca(page).click();
    await expect(clip(page).getByRole('alert')).toContainText('limite de 10 buscas por hora');
  });

  test('enquanto busca o botão fica desligado, e volta ao normal depois', async ({ page }) => {
    let libera!: () => void;
    const espera = new Promise<void>((r) => { libera = r; });
    await page.route('**/api/clipping', async (rota) => { await espera; await rota.fulfill({ contentType: 'application/json', body: JSON.stringify({ itens: [] }) }); });
    await abre(page, [ILHA], { mandato: MANDATO });
    await busca(page).click();
    await expect(page.getByRole('button', { name: 'Buscando…' })).toBeDisabled();
    libera();
    await expect(busca(page)).toBeEnabled();
    await expect(clip(page).getByRole('status')).toContainText('Nenhuma notícia nova');
  });
});

test.describe('Ocultar (CAP-30.2)', () => {
  test('a notícia oculta sai da lista, vai para "Ocultas", pode ser restaurada e sobrevive a recarregar', async ({ page }) => {
    await simulaBusca(page);
    await abre(page, [ILHA], { mandato: MANDATO, campos: BANDEIRAS });
    await busca(page).click();
    await linha(page, 'Outra Ana Souza').getByRole('button', { name: /^Ocultar/ }).click();
    await expect(lista(page).locator('li.cp-not')).toHaveCount(2);
    await expect(lista(page)).not.toContainText('Outra Ana Souza');
    await page.getByText('Ocultas (1)').click();
    await expect(page.locator('.cp-ocultas')).toContainText('Outra Ana Souza');
    await page.reload();
    await page.locator('#tela[data-pronto="true"]').waitFor();
    await expect(page.locator('li.cp-not')).toHaveCount(3);
    await expect(page.getByText('Ocultas (1)')).toBeVisible();
    await page.getByText('Ocultas (1)').click();
    await page.locator('.cp-ocultas').getByRole('button', { name: /^Restaurar/ }).click();
    await expect(lista(page).locator('li.cp-not')).toHaveCount(3);
    expect((await clipping(page)).every((n) => !n.oculta)).toBe(true);
  });
});

test.describe('Etiquetar com bandeiras (CAP-30.3, CAP-30.4)', () => {
  test('"Sem bandeira" é o padrão; etiquetar e recarregar mantém a etiqueta; clicar de novo tira', async ({ page }) => {
    await simulaBusca(page);
    await abre(page, [ILHA], { mandato: MANDATO, campos: BANDEIRAS });
    await busca(page).click();
    const l = linha(page, 'Projeto sobre hospitais');
    await expect(l.getByText('Sem bandeira')).toBeVisible();
    await l.getByRole('button', { name: 'Saúde', exact: true }).click();
    await expect(l.getByRole('button', { name: 'Saúde', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(l.getByText('Sem bandeira')).toHaveCount(0);
    await page.reload();
    await page.locator('#tela[data-pronto="true"]').waitFor();
    const l2 = linha(page, 'Projeto sobre hospitais');
    await expect(l2.getByRole('button', { name: 'Saúde', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect((await clipping(page)).find((n) => n.titulo.startsWith('Projeto'))!.bandeiras).toEqual(['saude']);
    await l2.getByRole('button', { name: 'Saúde', exact: true }).click();
    await expect(l2.getByText('Sem bandeira')).toBeVisible();
    expect((await clipping(page)).find((n) => n.titulo.startsWith('Projeto'))!.bandeiras).toEqual([]);
  });

  test('uma notícia aceita 2 bandeiras', async ({ page }) => {
    await simulaBusca(page);
    await abre(page, [ILHA], { mandato: MANDATO, campos: BANDEIRAS });
    await busca(page).click();
    const l = linha(page, 'Deputada defende');
    await l.getByRole('button', { name: 'Educação', exact: true }).click();
    await l.getByRole('button', { name: 'Saúde', exact: true }).click();
    expect((await clipping(page)).find((n) => n.titulo.startsWith('Deputada'))!.bandeiras.sort()).toEqual(['educacao', 'saude']);
  });

  test('"Marcar vários" etiqueta as selecionadas de uma vez, e também oculta em lote', async ({ page }) => {
    await simulaBusca(page);
    await abre(page, [ILHA], { mandato: MANDATO, campos: BANDEIRAS });
    await busca(page).click();
    await page.getByRole('button', { name: 'Marcar vários' }).click();
    await expect(page.getByRole('button', { name: 'Etiquetar com Educação' })).toBeDisabled(); // nada selecionado
    await page.getByLabel('Selecionar: Deputada defende mais verba para escolas').check();
    await page.getByLabel('Selecionar: Projeto sobre hospitais avança na Casa').check();
    await expect(page.getByText('2 selecionadas')).toBeVisible();
    await page.getByRole('button', { name: 'Etiquetar com Saúde' }).click();
    const por = (await clipping(page)).map((n) => [n.url.slice(-1), n.bandeiras]);
    expect(por).toEqual([['a', ['saude']], ['b', ['saude']], ['c', []]]);
    await page.getByRole('button', { name: 'Ocultar selecionadas' }).click();
    await expect(lista(page).locator('li.cp-not')).toHaveCount(1);
    expect((await clipping(page)).filter((n) => n.oculta)).toHaveLength(2);
  });

  test('sem bandeiras prioritárias na Missão 3 a lista funciona e orienta a escolher as bandeiras', async ({ page }) => {
    await simulaBusca(page);
    await abre(page, [ILHA], { mandato: MANDATO });
    await busca(page).click();
    await expect(page.locator('li.cp-not')).toHaveCount(3);
    await expect(page.getByText('escolha antes as bandeiras prioritárias na Missão 3')).toBeVisible();
    await expect(page.locator('li.cp-not').first().getByText('Sem bandeira')).toBeVisible();
  });
});

test.describe('Aparição manual (CAP-30.5)', () => {
  test('entra na lista com a marca "(manual)", o link e a data; título e data são obrigatórios; link ruim é recusado', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO, campos: BANDEIRAS });
    await page.getByRole('button', { name: 'Adicionar aparição manual' }).click();
    await page.getByLabel('Data').fill('');
    await page.getByRole('button', { name: 'Adicionar à lista' }).click();
    await expect(clip(page).getByRole('alert')).toContainText('título');
    await page.getByLabel('Título').fill('Entrevista na Rádio Cidade');
    await page.getByRole('button', { name: 'Adicionar à lista' }).click();
    await expect(clip(page).getByRole('alert')).toContainText('data');
    await page.getByLabel('Data').fill('2026-10-28');
    await page.getByLabel('Link (opcional)').fill('www.sem-protocolo.com');
    await page.getByRole('button', { name: 'Adicionar à lista' }).click();
    await expect(clip(page).getByRole('alert')).toContainText('http');
    expect(await clipping(page)).toHaveLength(0);
    await page.getByLabel('Link (opcional)').fill('https://radio.test/ent');
    await page.getByLabel('Veículo').fill('Rádio Cidade');
    await page.getByRole('button', { name: 'Adicionar à lista' }).click();
    const l = linha(page, 'Entrevista na Rádio Cidade');
    await expect(l).toContainText('(manual)');
    await expect(l).toContainText('Rádio Cidade · 28/10/2026');
    await expect(l.getByRole('link')).toHaveAttribute('href', 'https://radio.test/ent');
    expect(await clipping(page)).toMatchObject([{ titulo: 'Entrevista na Rádio Cidade', manual: true, semana: '2026-W44', bandeiras: [] }]);
  });
});

/* ---------- gráfico por bandeira e número da semana (CAP-30.6, CAP-31.6, CAP-31.7) ---------- */
const dia = (atras = 0) => { const d = new Date(); d.setDate(d.getDate() - atras); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const DE_HOJE = ['a', 'b', 'c'].map((x, i) => ({ titulo: `Notícia ${x}`, veiculo: 'Jornal', data: dia(0), url: `https://exemplo.test/${i}` }));
const barras = (page: Page, titulo: RegExp) => page.getByRole('list', { name: titulo });
const valor = (page: Page, titulo: RegExp, rot: string) => barras(page, titulo).locator('li', { hasText: rot }).locator('.cp-g-num');
const SEMANA = /Aparições por bandeira nesta semana/, PERIODO = /Aparições por bandeira no período/;

test.describe('Número da semana a partir do clipping (CAP-31.7)', () => {
  test('aceitar 3 notícias muda "Aparições na imprensa" do registro da semana para 3; ocultar uma muda para 2', async ({ page }) => {
    await simulaBusca(page, { itens: DE_HOJE });
    await abre(page, [ILHA], { mandato: MANDATO, campos: BANDEIRAS });
    await busca(page).click();
    await expect(page.locator('li.cp-not')).toHaveCount(3);
    const imprensa = page.locator('details[data-secao="k5"]');
    await imprensa.locator(':scope > summary').click();
    await imprensa.getByRole('button', { name: 'Registrar esta semana' }).click();
    await expect(imprensa.getByLabel('Aparições na imprensa', { exact: true })).toHaveValue('3');
    await expect(imprensa.getByText('Calculado pelo clipping: 3 notícias não ocultas nesta semana')).toBeVisible();
    await imprensa.getByRole('button', { name: 'Salvar registro' }).click();
    const sem = ((await dadoDe(page, 'comunicacao')) as { semanas: Record<string, { k5: Record<string, number> }> }).semanas;
    expect(Object.values(sem)[0].k5).toEqual({ aparicoes: 3 });

    await linha(page, 'Notícia c').getByRole('button', { name: /^Ocultar/ }).click();
    await imprensa.getByRole('button', { name: 'Editar esta semana' }).click();
    await expect(imprensa.getByLabel('Aparições na imprensa', { exact: true })).toHaveValue('2');
  });

  test('sem notícias no clipping o campo começa vazio, com a explicação de sempre, e o valor digitado vale', async ({ page }) => {
    await abre(page, [ILHA], { mandato: MANDATO, campos: BANDEIRAS });
    const imprensa = page.locator('details[data-secao="k5"]');
    await imprensa.locator(':scope > summary').click();
    await imprensa.getByRole('button', { name: 'Registrar esta semana' }).click();
    await expect(imprensa.getByLabel('Aparições na imprensa', { exact: true })).toHaveValue('');
    await expect(imprensa.getByText('Calculado pelo clipping:')).toHaveCount(0);
    await imprensa.getByLabel('Aparições na imprensa', { exact: true }).fill('7');
    await imprensa.getByRole('button', { name: 'Salvar registro' }).click();
    await expect(imprensa.locator(':scope > summary')).toContainText('Aparições na imprensa 7');
  });

  test('só conta as notícias da semana atual: uma de semanas atrás não entra no número', async ({ page }) => {
    await simulaBusca(page, { itens: [DE_HOJE[0], { titulo: 'Velha', veiculo: 'J', data: dia(21), url: 'https://exemplo.test/velha' }] });
    await abre(page, [ILHA], { mandato: MANDATO, campos: BANDEIRAS });
    await busca(page).click();
    const imprensa = page.locator('details[data-secao="k5"]');
    await imprensa.locator(':scope > summary').click();
    await imprensa.getByRole('button', { name: 'Registrar esta semana' }).click();
    await expect(imprensa.getByLabel('Aparições na imprensa', { exact: true })).toHaveValue('1');
  });
});

test.describe('Gráfico de aparições por bandeira (CAP-31.6)', () => {
  test('mostra as bandeiras do mandato e "Sem bandeira", na semana e no período, com os números escritos', async ({ page }) => {
    await simulaBusca(page, { itens: DE_HOJE });
    await abre(page, [ILHA], { mandato: MANDATO, campos: BANDEIRAS });
    await busca(page).click();
    await linha(page, 'Notícia a').getByRole('button', { name: 'Saúde', exact: true }).click();
    await linha(page, 'Notícia b').getByRole('button', { name: 'Saúde', exact: true }).click();
    await linha(page, 'Notícia b').getByRole('button', { name: 'Educação', exact: true }).click();
    for (const g of [SEMANA, PERIODO]) {
      await expect(barras(page, g).locator('li')).toHaveText([/Saúde\s*2/, /Educação\s*1/, /Sem bandeira\s*1/]);
    }
  });

  test('bandeira do mandato sem notícia aparece com 0; sem "Sem bandeira" quando todas estão etiquetadas', async ({ page }) => {
    await simulaBusca(page, { itens: [DE_HOJE[0]] });
    await abre(page, [ILHA], { mandato: MANDATO, campos: BANDEIRAS });
    await busca(page).click();
    await linha(page, 'Notícia a').getByRole('button', { name: 'Saúde', exact: true }).click();
    await expect(valor(page, SEMANA, 'Saúde')).toHaveText('1');
    await expect(valor(page, SEMANA, 'Educação')).toHaveText('0');
    await expect(barras(page, SEMANA).locator('li', { hasText: 'Sem bandeira' })).toHaveCount(0);
  });

  test('o gráfico não conta as ocultas, e restaurar volta a contar', async ({ page }) => {
    await simulaBusca(page, { itens: DE_HOJE });
    await abre(page, [ILHA], { mandato: MANDATO, campos: BANDEIRAS });
    await busca(page).click();
    await expect(valor(page, PERIODO, 'Sem bandeira')).toHaveText('3');
    await linha(page, 'Notícia a').getByRole('button', { name: /^Ocultar/ }).click();
    await expect(valor(page, PERIODO, 'Sem bandeira')).toHaveText('2');
    await expect(valor(page, SEMANA, 'Sem bandeira')).toHaveText('2');
    await page.getByText('Ocultas (1)').click();
    await page.locator('.cp-ocultas').getByRole('button', { name: /^Restaurar/ }).click();
    await expect(valor(page, PERIODO, 'Sem bandeira')).toHaveText('3');
  });

  test('semana x período: notícia de semanas atrás conta só no período', async ({ page }) => {
    await simulaBusca(page, { itens: [DE_HOJE[0], { titulo: 'Velha', veiculo: 'J', data: dia(21), url: 'https://exemplo.test/velha' }] });
    await abre(page, [ILHA], { mandato: MANDATO, campos: BANDEIRAS });
    await busca(page).click();
    await expect(valor(page, PERIODO, 'Sem bandeira')).toHaveText('2');
    await expect(valor(page, SEMANA, 'Sem bandeira')).toHaveText('1');
  });

  test('sem notícias não há gráfico; com notícias e sem bandeiras da Missão 3 só aparece "Sem bandeira"', async ({ page }) => {
    await simulaBusca(page, { itens: [DE_HOJE[0]] });
    await abre(page, [ILHA], { mandato: MANDATO });
    await expect(page.locator('.cp-clip-graf')).toHaveCount(0);
    await busca(page).click();
    await expect(barras(page, PERIODO).locator('li')).toHaveText([/Sem bandeira\s*1/]);
  });
});
/* ---------- fluxo completo em celular e computador, com a busca simulada ---------- */
const semRolagemLateral = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const LONGOS = [
  { titulo: 'Deputada defende mais verba para escolas rurais e anuncia audiência pública sobre o orçamento da educação básica no estado', veiculo: 'Jornal do Comércio de Pernambuco', data: dia(0), url: 'https://exemplo.test/a/um-endereco-muito-longo-que-nao-pode-estourar-a-tela-do-celular-em-hipotese-alguma' },
  { titulo: 'Projeto sobre hospitais regionais avança na Casa', veiculo: 'VEJA', data: dia(1), url: 'https://exemplo.test/b' },
  { titulo: 'Outra Ana Souza vence concurso de poesia', veiculo: 'Jornal X', data: dia(2), url: 'https://exemplo.test/c' },
];

for (const tela of [{ nome: 'celular 360 px', width: 360, height: 740 }, { nome: 'computador 1280 px', width: 1280, height: 800 }]) {
  test.describe(`Fluxo completo do clipping em ${tela.nome}`, () => {
    test.use({ viewport: { width: tela.width, height: tela.height } });

    test('busca (simulada), oculta a que não é do mandato, etiqueta em lote e uma a uma, vê o gráfico e o número da semana, e tudo sobrevive a recarregar', async ({ page }) => {
      await simulaBusca(page, { itens: LONGOS });
      await abre(page, [ILHA], { mandato: MANDATO, campos: BANDEIRAS });
      await busca(page).click();
      await expect(page.locator('li.cp-not')).toHaveCount(3);
      expect(await semRolagemLateral(page)).toBe(true);

      await linha(page, 'Outra Ana Souza').getByRole('button', { name: /^Ocultar/ }).click();
      await page.getByRole('button', { name: 'Marcar vários' }).click();
      await page.getByLabel(/^Selecionar: Projeto sobre hospitais/).check();
      await page.getByRole('button', { name: 'Etiquetar com Saúde' }).click();
      await linha(page, 'Deputada defende').getByRole('button', { name: 'Educação', exact: true }).click();
      expect(await semRolagemLateral(page)).toBe(true);

      await expect(valor(page, PERIODO, 'Saúde')).toHaveText('1');
      await expect(valor(page, PERIODO, 'Educação')).toHaveText('1');
      await expect(barras(page, PERIODO).locator('li', { hasText: 'Sem bandeira' })).toHaveCount(0); // a sem etiqueta foi ocultada

      const imprensa = page.locator('details[data-secao="k5"]');
      await imprensa.locator(':scope > summary').click();
      await imprensa.getByRole('button', { name: 'Registrar esta semana' }).click();
      const n = await imprensa.getByLabel('Aparições na imprensa', { exact: true }).inputValue();
      expect(Number(n)).toBeGreaterThanOrEqual(1); // as de hoje e de ontem podem cair em semanas ISO diferentes (segunda-feira)
      await imprensa.getByRole('button', { name: 'Salvar registro' }).click();
      expect(await semRolagemLateral(page)).toBe(true);

      await page.reload();
      await page.locator('#tela[data-pronto="true"]').waitFor();
      expect(await clipping(page)).toHaveLength(3);
      await expect(lista(page).locator('li.cp-not')).toHaveCount(2);
      await expect(linha(page, 'Projeto sobre hospitais').getByRole('button', { name: 'Saúde', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByText('Ocultas (1)')).toBeVisible();
      await expect(valor(page, PERIODO, 'Saúde')).toHaveText('1');
      expect(await semRolagemLateral(page)).toBe(true);
    });

    test('falha da busca mostra o aviso, a aparição manual entra na lista e a tela não rola para o lado', async ({ page }) => {
      await simulaBusca(page, { status: 502, corpo: { erro: 'x' } });
      await abre(page, [ILHA], { mandato: MANDATO, campos: BANDEIRAS });
      await busca(page).click();
      await expect(clip(page).getByRole('alert')).toHaveText('Não consegui buscar agora. Adicione manualmente');
      await page.getByRole('button', { name: 'Adicionar aparição manual' }).click();
      await page.getByLabel('Título').fill('Entrevista de longa duração na rádio sobre o orçamento da educação e da saúde');
      await page.getByLabel('Veículo').fill('Rádio Cidade FM Metropolitana');
      await page.getByLabel('Link (opcional)').fill('https://radio.test/uma/url/muito/longa/que/nao/pode/estourar/a/tela/do/celular');
      await page.getByRole('button', { name: 'Adicionar à lista' }).click();
      await expect(page.locator('li.cp-not')).toHaveCount(1);
      expect(await semRolagemLateral(page)).toBe(true);
      await expect(valor(page, PERIODO, 'Sem bandeira')).toHaveText('1');
    });
  });
}