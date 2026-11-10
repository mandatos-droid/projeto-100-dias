import { test, expect, type Page } from '@playwright/test';
import * as area from './area-api';

/* Visão geral da Área do mandato (#/config): casos migrados de e2e/mandato-area.spec.ts (cartão, resumo da equipe e atividade
   recente) para a tela dentro do Guia (AMA-02.1, AMA-05.2). O que complementa e2e/area-mandato.spec.ts, que cobre a casca, o
   papel, o aviso de posse, as falhas e a troca de mandato. Guia em modo nuvem com Lia logada (area-api.ts). */

const visao = (page: Page) => page.locator('#areaVisao');
const cartao = (page: Page) => visao(page).locator('.md-cartao');
const resumo = (page: Page) => visao(page).locator('.md-resumo');
const atividade = (page: Page) => visao(page).locator('.md-atividade');
const itens = (page: Page) => atividade(page).locator('li .md-evento-texto');
const membro = (id: string, nome: string | null, papel: area.Papel, email: string | null = null) => area.membro(area.MANDATO_A, id, nome, papel, email);

test.afterEach(() => {
  expect(area.naoMapeadas()).toEqual([]);
});

test.describe('Cartão do mandato', () => {
  test('a foto do TSE que o navegador bloqueia não gera erro de página: as iniciais continuam (AMA-02.1)', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await area.abreArea(page, '#/config', { mandato: { dados: { tse: { sq: '250001234567', ano: 2026 } } } });
    await expect(cartao(page).locator('.md-foto')).toContainText('AS');
    await expect.poll(() => [...new Set(area.fotos())]).toEqual(['https://resultados.tse.jus.br/oficial/ele2026/6259/fotos/sp/250001234567.jpeg']); // o Guia também pede a foto: o endereço é um só
    await expect(cartao(page).locator('.md-foto img')).toHaveCount(0);
    await expect(cartao(page).locator('.md-foto')).toContainText('AS');
    expect(erros).toEqual([]);
  });

  test('foto de 2024 usa o caminho das eleições municipais e a UF do mandato em minúsculas (AMA-02.1)', async ({ page }) => {
    await area.abreArea(page, '#/config', { mandato: { ...area.BRUNO, id: area.MANDATO_A, dados: { tse: { sq: '130009999', ano: 2024 } } } });
    await expect.poll(() => [...new Set(area.fotos())]).toEqual(['https://resultados.tse.jus.br/oficial/ele2024/619/fotos/mg/130009999.jpeg']);
  });

  test('sem dados.tse não pede foto nenhuma e mostra só o círculo com as iniciais (AMA-02.1)', async ({ page }) => {
    await area.abreArea(page, '#/config');
    await expect(cartao(page).locator('.md-foto')).toHaveText('AS');
    await expect(cartao(page).locator('img')).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    expect(area.fotos()).toEqual([]);
  });
});

test.describe('Resumo da equipe', () => {
  const CINCO = [
    membro('uid-mariana', 'Mariana Rocha', 'coordenacao'), membro('uid-joao', 'João Pereira', 'assessoria'),
    membro('uid-luiza', 'Luiza Ferraz', 'leitura'), membro('uid-carlos', 'Carlos', 'assessoria'),
  ];

  test('com 5 pessoas mostra só 3 avatares com iniciais e o total real (AMA-02.1)', async ({ page }) => {
    await area.abreArea(page, '#/config', { equipe: CINCO });
    await expect(resumo(page).locator('.md-av')).toHaveText(['LT', 'MR', 'JP']);
    await expect(resumo(page)).toContainText('5 pessoas');
  });

  test('com 1 pessoa mostra 1 avatar e "1 pessoa", sem plural (AMA-02.1)', async ({ page }) => {
    await area.abreArea(page, '#/config', { equipe: [] });
    await expect(resumo(page).locator('.md-av')).toHaveText(['LT']);
    await expect(resumo(page)).toContainText('1 pessoa ·');
    await expect(resumo(page)).not.toContainText('1 pessoas');
  });

  test('pessoa sem nome usa a inicial do e-mail no avatar (AMA-02.1)', async ({ page }) => {
    await area.abreArea(page, '#/config', { equipe: [membro('uid-zeca', null, 'coordenacao', 'zeca@x.test')] });
    await expect(resumo(page).locator('.md-av')).toHaveText(['LT', 'Z']);
  });

  for (const [n, texto] of [[2, '2 convites pendentes'], [1, '1 convite pendente'], [0, '0 convites pendentes']] as const) {
    test(`mostra a contagem real de convites pendentes: ${n} (AMA-02.1)`, async ({ page }) => {
      const todos = [area.convite('c1', 'Carlos Lima'), area.convite('c2', 'Dora Alves', 'leitura')];
      await area.abreArea(page, '#/config', { convites: todos.slice(0, n) });
      await expect(resumo(page)).toContainText(texto);
      if (n === 1) await expect(resumo(page)).not.toContainText('1 convites');
    });
  }

  for (const papel of ['coordenacao', 'assessoria', 'leitura'] as const) {
    test(`quem é ${papel} também vê "Convidar pessoa", que aponta para a aba Equipe e convites (AMA-02.1)`, async ({ page }) => {
      await area.abreArea(page, '#/config', { papel });
      await expect(resumo(page).getByRole('link', { name: 'Convidar pessoa' })).toHaveAttribute('href', '#/config/equipe');
    });
  }

  test('lê equipe e convites do mandato aberto, uma vez cada, e trocar de mandato pede os do outro (AMA-02.1)', async ({ page }) => {
    await area.abreArea(page, '#/config', { outros: [{ mandato: area.BRUNO, papel: 'assessoria' }] });
    await expect(resumo(page)).toContainText('0 convites pendentes');
    expect(area.rpcs('equipe_do_mandato').map((p) => p.corpo)).toEqual([{ p_mandato: area.MANDATO_A }]);
    expect(area.rpcs('convites_pendentes').map((p) => p.corpo)).toEqual([{ p_mandato: area.MANDATO_A }]);
    await page.locator('#ladoNav .sel-it', { hasText: 'Bruno Alves' }).click();
    await expect.poll(() => area.rpcs('equipe_do_mandato').map((p) => p.corpo)).toEqual([{ p_mandato: area.MANDATO_A }, { p_mandato: area.MANDATO_B }]);
    expect(area.rpcs('convites_pendentes').map((p) => p.corpo)).toEqual([{ p_mandato: area.MANDATO_A }, { p_mandato: area.MANDATO_B }]);
  });

  test('falha ao ler a equipe mantém o botão "Convidar pessoa" (AMA-02.10)', async ({ page }) => {
    await area.abreArea(page, '#/config', { falha: { 'rpc/equipe_do_mandato': 'rede' } });
    await expect(resumo(page).getByRole('alert')).toHaveText('Não foi possível carregar. Tente de novo.');
    await expect(resumo(page).getByRole('link', { name: 'Convidar pessoa' })).toBeVisible();
  });
});

test.describe('Atividade recente', () => {
  test('cada um dos 6 tipos de evento tem texto próprio (AMA-02.1)', async ({ page }) => {
    await area.abreArea(page, '#/config', { eventos: [
      area.evento(6, 'convite_criado', 'Mariana Rocha', 'Carlos Lima', 'assessoria'),
      area.evento(5, 'convite_aceito', 'Carlos Lima', 'Carlos Lima', 'assessoria'),
      area.evento(4, 'convite_cancelado', 'Mariana Rocha', 'Dora Alves', 'leitura'),
      area.evento(3, 'papel_trocado', 'Mariana Rocha', 'João Pereira', 'coordenacao'),
      area.evento(2, 'membro_removido', 'Mariana Rocha', 'Luiza Ferraz', 'leitura'),
      area.evento(1, 'membro_saiu', 'João Pereira', 'João Pereira', 'coordenacao'),
    ] });
    await expect(itens(page)).toHaveText([
      'Mariana convidou Carlos Lima como Assessoria',
      'Carlos Lima entrou na equipe como Assessoria',
      'Mariana cancelou o convite de Dora Alves',
      'Mariana mudou o papel de João Pereira para Coordenação',
      'Mariana removeu Luiza Ferraz da equipe',
      'João saiu da equipe',
    ]);
    await expect(atividade(page).locator('li .md-av')).toHaveText(['MR', 'CL', 'MR', 'MR', 'MR', 'JP']);
  });

  test('lista no máximo 10 eventos, na ordem recebida (do mais recente), mesmo que o banco devolva mais (AMA-02.1)', async ({ page }) => {
    const doze = Array.from({ length: 12 }, (_, i) => {
      const { mandato_id: _m, ...e } = area.evento(12 - i, 'convite_criado', 'Mariana Rocha', `Pessoa ${12 - i}`, 'leitura');
      return e;
    });
    await area.abreArea(page, '#/config', { ler: { eventos_equipe: () => ({ corpo: doze }) } });
    await expect(itens(page)).toHaveCount(10);
    await expect(itens(page).first()).toHaveText('Mariana convidou Pessoa 12 como Somente leitura');
    await expect(itens(page).last()).toHaveText('Mariana convidou Pessoa 3 como Somente leitura');
    expect(area.leituras('eventos_equipe')).toHaveLength(1);
  });

  test('mostra quando no fuso de Brasília: hoje, ontem e data completa (AMA-02.1)', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2027-02-12T15:00:00-03:00'));
    await area.abreArea(page, '#/config', { eventos: [
      area.evento(3, 'membro_saiu', 'João Pereira', null, null, area.MANDATO_A, '2027-02-12T13:42:00Z'), // 10:42 em Brasília, hoje
      area.evento(2, 'membro_saiu', 'João Pereira', null, null, area.MANDATO_A, '2027-02-11T12:05:00Z'), // ontem, 09:05
      area.evento(1, 'membro_saiu', 'João Pereira', null, null, area.MANDATO_A, '2027-02-06T00:15:00Z'), // dia 6 em UTC, mas 21:15 do dia 5 em Brasília
    ] });
    await expect(atividade(page).locator('time')).toHaveText(['hoje, 10:42', 'ontem, 09:05', '05/02/2027, 21:15']);
    await expect(atividade(page).locator('time').first()).toHaveAttribute('datetime', '2027-02-12T13:42:00Z');
  });

  test('nomes ausentes (conta apagada) não quebram o texto (AMA-02.1)', async ({ page }) => {
    await area.abreArea(page, '#/config', { eventos: [area.evento(1, 'papel_trocado', null, null, 'leitura')] });
    await expect(itens(page)).toHaveText(['Alguém mudou o papel de uma pessoa para Somente leitura']);
    await expect(atividade(page).locator('li .md-av')).toHaveText(['?']);
  });

  test('sem eventos mostra "Nenhuma atividade ainda." e nenhum item (AMA-02.1)', async ({ page }) => {
    await area.abreArea(page, '#/config');
    await expect(atividade(page)).toContainText('Nenhuma atividade ainda.');
    await expect(atividade(page).locator('li')).toHaveCount(0);
  });

  test('falha ao ler o histórico não derruba o resto da aba (AMA-02.10)', async ({ page }) => {
    await area.abreArea(page, '#/config', { falha: { eventos_equipe: 'rede' } });
    await expect(atividade(page).getByRole('alert')).toHaveText('Não foi possível carregar. Tente de novo.');
    await expect(cartao(page)).toBeVisible();
    await expect(resumo(page)).toContainText('2 pessoas');
  });
});
