import { test, expect, type Page } from '@playwright/test';
import { chamadas, moca, naoMapeadas, semeiaSessao, vazou, type EstadoMoca, type Papel } from './admin-api';

/* Tela Logs do /admin (ADM-04 parte de tela, ADM-13). Supabase todo interceptado (admin-api.ts).
   As horas esperadas são calculadas à mão: 15:00 UTC = 12:00 em Brasília (UTC-3, sem horário de verão). */

// ---- Atividade dos gabinetes: 127 eventos, um por minuto a partir de 12:00 (Brasília) de 05/11/2026 ----
const BASE = Date.UTC(2026, 10, 5, 15, 0, 0);
const N = 127; // primo: o embaralhamento abaixo é uma permutação
// Linha i acontece em 12:00 + i minutos. Missão nula só na linha 125. A fixture sai embaralhada: a ordem pedida é que ordena.
const atividade = Array.from({ length: N }, (_, k) => {
  const i = (k * 37) % N;
  return { criado_em: new Date(BASE + i * 60000).toISOString(), missao: i === 125 ? null : (i % 5) + 1, exercicio: 'm1.persona', codigo: `C${String(i).padStart(3, '0')}` };
});

// ---- Ações da equipe: 60 linhas, uma por hora para trás a partir de 01:30 UTC de 05/11 (= 22:30 de 04/11 em Brasília) ----
const T0 = Date.UTC(2026, 10, 5, 1, 30, 0);
const acoes = Array.from({ length: 60 }, (_, k) => {
  const i = (k * 7) % 60; // 7 é primo com 60
  return { id: 1000 - i, criado_em: new Date(T0 - i * 3600000).toISOString(), autor: `Autor ${i}`, acao: 'mandato.arquivar', alvo_tipo: 'mandato', alvo_id: `id-${i}`, detalhe: { codigo: `Z${String(i).padStart(2, '0')}` } };
});

const estado = (extra: EstadoMoca['views'] = {}): EstadoMoca => ({ views: { v_admin_atividade: atividade, auditoria_admin: acoes, ...extra } });

async function abre(page: Page, est: EstadoMoca = estado(), papel: Papel = 'admin') {
  await semeiaSessao(page, papel);
  await moca(page, est);
  await page.goto('/admin/logs');
  await expect(page.getByRole('heading', { name: 'Logs' })).toBeVisible();
}

const linhas = (page: Page) => page.locator('[role=tabpanel] tbody tr');
const celulas = (page: Page, i: number) => linhas(page).nth(i).locator('td').allInnerTexts();
const aba = (page: Page, nome: string) => page.getByRole('tab', { name: nome });
const proxima = (page: Page) => page.getByRole('button', { name: 'Próxima' });
const anterior = (page: Page) => page.getByRole('button', { name: 'Anterior' });

test.afterEach(() => {
  expect(naoMapeadas()).toEqual([]);
  expect(vazou()).toEqual([]);
});

test.describe('Logs: atividade dos gabinetes (ADM-13.1 a 13.3)', () => {
  test('abre nesta aba; mais recente primeiro, 50 por página, e a paginação percorre as 127 linhas', async ({ page }) => {
    await abre(page);
    await expect(aba(page, 'Atividade dos gabinetes')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('columnheader')).toHaveText(['Data e hora', 'Missão', 'Mandato', 'Exercício', 'Texto']);

    // página 1: linhas 126 (14:06) até 77 (13:17)
    await expect(linhas(page)).toHaveCount(50);
    expect((await celulas(page, 0))[0]).toBe('05/11/2026 14:06');
    expect((await celulas(page, 0))[2]).toBe('C126');
    expect((await celulas(page, 49))[0]).toBe('05/11/2026 13:17');
    expect((await celulas(page, 49))[2]).toBe('C077');
    await expect(anterior(page)).toBeDisabled();

    await proxima(page).click();
    await expect(linhas(page)).toHaveCount(50);
    expect((await celulas(page, 0))[2]).toBe('C076'); // continua sem repetir nem pular
    expect((await celulas(page, 49))[2]).toBe('C027');
    await expect(page.getByText('Página 2')).toBeVisible();

    await proxima(page).click();
    await expect(linhas(page)).toHaveCount(27); // 127 - 100
    expect((await celulas(page, 0))[2]).toBe('C026');
    expect((await celulas(page, 26))[0]).toBe('05/11/2026 12:00');
    expect((await celulas(page, 26))[2]).toBe('C000');
    await expect(proxima(page)).toBeDisabled(); // última página

    await anterior(page).click();
    expect((await celulas(page, 0))[2]).toBe('C076');

    // lê só a view v_admin_atividade, mais recente primeiro, uma linha a mais que a página para saber se há "Próxima"
    const pedidos = chamadas().filter((c) => c.caminho.startsWith('v_admin_atividade'));
    expect(pedidos.map((c) => c.caminho.match(/limit=\d+&offset=\d+/)![0])).toEqual(['limit=51&offset=0', 'limit=51&offset=50', 'limit=51&offset=100', 'limit=51&offset=50']);
    expect(pedidos[0].caminho).toContain('order=criado_em.desc');
    expect(chamadas().filter((c) => /^eventos|^mandatos/.test(c.caminho))).toEqual([]);
  });

  test('"texto oculto" no lugar do texto, e "—" quando o evento não tem missão', async ({ page }) => {
    await abre(page);
    for (let i = 0; i < 50; i++) expect((await celulas(page, i))[4]).toBe('texto oculto');
    // C126 tem missão 126 % 5 + 1 = 2; C125 não tem missão; C124 tem 124 % 5 + 1 = 5
    expect((await celulas(page, 0))[1]).toBe('M2');
    expect(await celulas(page, 1)).toEqual(['05/11/2026 14:05', '—', 'C125', 'm1.persona', 'texto oculto']);
    expect((await celulas(page, 2))[1]).toBe('M5');
  });

  test('exatamente 50 eventos: uma página só, sem "Próxima" ativa', async ({ page }) => {
    await abre(page, estado({ v_admin_atividade: atividade.slice(0, 50) }));
    await expect(linhas(page)).toHaveCount(50);
    await expect(proxima(page)).toBeDisabled();
    await expect(anterior(page)).toBeDisabled();
  });
});

test.describe('Logs: ações da equipe (ADM-04.5)', () => {
  test('mais recente primeiro, 50 por página, data e hora no fuso de Brasília e quem fez', async ({ page }) => {
    await abre(page);
    await aba(page, 'Ações da equipe').click();
    await expect(aba(page, 'Ações da equipe')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('columnheader')).toHaveText(['Data e hora', 'Quem fez', 'O que fez']);
    await expect(linhas(page)).toHaveCount(50);
    // 01:30 UTC de 05/11 é 22:30 de 04/11 em Brasília (a data também muda, não só a hora)
    expect(await celulas(page, 0)).toEqual(['04/11/2026 22:30', 'Autor 0', 'Arquivou o mandato Z00']);
    // a linha 1 é uma hora antes: 21:30
    expect((await celulas(page, 1))[0]).toBe('04/11/2026 21:30');
    // a linha 49 está 49 horas antes de 22:30 de 04/11: 2 dias e 1 hora, ou seja 21:30 de 02/11
    expect((await celulas(page, 49))[0]).toBe('02/11/2026 21:30');
    await proxima(page).click();
    await expect(linhas(page)).toHaveCount(10);
    expect((await celulas(page, 0))[1]).toBe('Autor 50');
    await expect(proxima(page)).toBeDisabled();
    const pedido = chamadas().filter((c) => c.caminho.startsWith('auditoria_admin'));
    expect(pedido[0].caminho).toContain('order=criado_em.desc');
    expect(pedido.map((c) => c.caminho.match(/limit=\d+&offset=\d+/)![0])).toEqual(['limit=51&offset=0', 'limit=51&offset=50']);
  });

  test('cada ação vira uma frase legível com os nomes do momento da ação', async ({ page }) => {
    const L = (id: number, acao: string, detalhe: Record<string, unknown>, alvo_tipo = 'equipe') =>
      ({ id, criado_em: new Date(T0 - id * 3600000).toISOString(), autor: 'Ana Souza', acao, alvo_tipo, alvo_id: 'x', detalhe });
    const dados = [
      L(1, 'equipe.incluir', { email: 'diego@exemplo.org', nome: 'Diego', papel: 'leitura' }),
      L(2, 'equipe.papel', { nome: 'Carla Dias', de: 'admin', para: 'leitura' }),
      L(3, 'equipe.remover', { nome: 'Beto', papel: 'leitura' }),
      L(4, 'membro.adicionar', { codigo: 'K7QX-29', email: 'paula@exemplo.org', nome: 'Paula', papel: 'assessoria' }, 'mandato'),
      L(5, 'membro.papel', { codigo: 'K7QX-29', nome: 'Paula', de: 'assessoria', para: 'coordenacao' }, 'mandato'),
      L(6, 'membro.remover', { codigo: 'K7QX-29', nome: 'Paula', papel: 'coordenacao' }, 'mandato'),
      L(7, 'mandato.arquivar', { codigo: 'Q9LM-33' }, 'mandato'),
      L(8, 'mandato.desarquivar', { codigo: 'Q9LM-33' }, 'mandato'),
      L(9, 'mandato.excluir', { codigo: 'R2NB-57', nome_parlamentar: 'Fulana de Tal' }, 'mandato'),
      L(10, 'acao.nova', {}, 'coisa'),
    ];
    await abre(page, estado({ auditoria_admin: dados }));
    await aba(page, 'Ações da equipe').click();
    const textos = await linhas(page).evaluateAll((trs) => trs.map((tr) => tr.querySelectorAll('td')[2].textContent));
    expect(textos).toEqual([
      'Incluiu diego@exemplo.org na equipe como leitura',
      'Mudou o papel de Carla Dias na equipe, de admin para leitura',
      'Removeu Beto da equipe',
      'Adicionou paula@exemplo.org como assessoria em K7QX-29',
      'Mudou o papel de Paula em K7QX-29, de assessoria para coordenacao',
      'Removeu Paula de K7QX-29',
      'Arquivou o mandato Q9LM-33',
      'Desarquivou o mandato Q9LM-33',
      'Excluiu o mandato R2NB-57 (Fulana de Tal)',
      'acao.nova · coisa x', // ação desconhecida não quebra a tela
    ]);
    await expect(linhas(page).first().locator('td').nth(1)).toHaveText('Ana Souza');
  });

  test('sem nenhuma ação registrada mostra a mensagem de lista vazia', async ({ page }) => {
    await abre(page, estado({ auditoria_admin: [] }));
    await aba(page, 'Ações da equipe').click();
    await expect(page.getByText('Nenhuma ação da equipe registrada ainda.')).toBeVisible();
  });
});

test.describe('Logs: sistema e erros (ADM-13.4)', () => {
  test('dois links externos abrem em nova aba com rel="noopener noreferrer", sem nenhuma requisição ao serviço', async ({ page }) => {
    await abre(page);
    await aba(page, 'Sistema e erros').click();
    const vercel = page.getByRole('link', { name: 'Abrir logs na Vercel' });
    const supabase = page.getByRole('link', { name: 'Abrir logs no Supabase' });
    await expect(vercel).toHaveAttribute('href', 'https://vercel.com/legisla/projeto-100-dias/logs');
    await expect(supabase).toHaveAttribute('href', 'https://supabase.com/dashboard/project/fldmekrexvzchynnmeuq/logs');
    for (const l of [vercel, supabase]) {
      await expect(l).toHaveAttribute('target', '_blank');
      await expect(l).toHaveAttribute('rel', 'noopener noreferrer');
    }
    // só abre o painel por link: a tela não lê nada para esta aba (as leituras de antes são só da aba inicial)
    expect(chamadas().filter((c) => c.caminho.startsWith('auditoria_admin'))).toEqual([]);
  });
});

test.describe('Logs: papel e erros', () => {
  test('papel leitura enxerga as três abas e nenhum botão de alteração', async ({ page }) => {
    await abre(page, estado(), 'leitura');
    await expect(page.getByRole('tab')).toHaveText(['Atividade dos gabinetes', 'Ações da equipe', 'Sistema e erros']);
    await expect(linhas(page)).toHaveCount(50);
    await aba(page, 'Ações da equipe').click();
    await expect(linhas(page)).toHaveCount(50);
    await aba(page, 'Sistema e erros').click();
    await expect(page.getByRole('link', { name: 'Abrir logs na Vercel' })).toBeVisible();
    // fora as abas, só "Sair" da casca é botão
    await expect(page.locator('.main').getByRole('button')).toHaveCount(1);
  });

  test('erro de servidor mostra "Tentar de novo", sem tela em branco', async ({ page }) => {
    await abre(page, { ...estado(), statusErro: 500 });
    await expect(page.getByText('Não foi possível carregar.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tentar de novo' })).toBeVisible();
  });

  test('trocar de aba volta à página 1 da nova aba', async ({ page }) => {
    await abre(page);
    await proxima(page).click();
    await expect(page.getByText('Página 2')).toBeVisible();
    await aba(page, 'Ações da equipe').click();
    await expect(page.getByText('Página 1')).toBeVisible();
    expect((await celulas(page, 0))[1]).toBe('Autor 0');
  });
});
