import { test, expect, type Page } from '@playwright/test';
import {
  chamadas, mandato, moca, naoMapeadas, seguraRpc, semeiaSessao, servidorUsuarios, usuario, vazou, type EstadoMoca, type Papel,
} from './admin-api';
import type { LinhaUsuario } from '../lib/admin/usuarios.ts';

/* Aba Usuários do /admin: lista (USR-01). O Supabase é todo interceptado (admin-api.ts); `servidorUsuarios` faz o papel de
   public.admin_usuarios e guarda os argumentos de cada chamada. Datas em UTC; a tela mostra o horário de Brasília. */

const tres = (n: number) => String(n).padStart(3, '0');
const muitas = (n: number) => Array.from({ length: n }, (_, i) => usuario({ id: `u${tres(i + 1)}`, nome: `Pessoa ${tres(i + 1)}` }));

interface Abre { rota?: string; papel?: Papel; pedidos?: Record<string, unknown>[]; estado?: EstadoMoca }
async function abre(page: Page, pessoas: LinhaUsuario[], o: Abre = {}) {
  await semeiaSessao(page, o.papel ?? 'admin');
  await moca(page, { ...o.estado, rpc: { admin_usuarios: servidorUsuarios(pessoas, o.pedidos), ...o.estado?.rpc } });
  await page.goto(o.rota ?? '/admin/usuarios');
  await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible();
}
const linhas = (page: Page) => page.locator('tbody tr');
const nomes = (page: Page) => page.locator('tbody tr td:first-child a');
// o Next tem o próprio role=alert (anúncio de rota): o aviso do painel é o .aviso
const aviso = (page: Page) => page.locator('.aviso[role=alert]');

test.afterEach(() => {
  // nada saiu da máquina e nenhuma resposta trouxe texto de gabinete
  expect(naoMapeadas()).toEqual([]);
  expect(vazou()).toEqual([]);
});

test.describe('Usuários: menu e lista (USR-01.1 a 01.10)', () => {
  test('o menu tem "Usuários" entre "Mandatos" e "Analytics" e abre /admin/usuarios (USR-01.1)', async ({ page }) => {
    await semeiaSessao(page, 'admin');
    await moca(page, { views: { v_admin_mandatos: [mandato({ id: 'a' })] }, rpc: { admin_usuarios: servidorUsuarios(muitas(2)) } });
    await page.goto('/admin');
    const menu = page.getByRole('navigation', { name: 'Menu do painel' });
    await expect(menu.getByRole('link')).toHaveText(['Equipe', 'Mandatos', 'Usuários', 'Analytics', 'Logs', 'Painel de métricas', '← Voltar para a plataforma']);
    await menu.getByRole('link', { name: 'Usuários' }).click();
    await expect(page).toHaveURL(/\/admin\/usuarios$/);
    await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Usuários' })).toHaveAttribute('aria-current', 'page');
    await expect(linhas(page)).toHaveCount(2);
  });

  test('cada linha mostra nome, e-mail, mandatos com o papel, data de cadastro e último acesso em Brasília (USR-01.2, 01.7)', async ({ page }) => {
    await abre(page, [usuario({
      id: 'ana', nome: 'Ana Souza', email: 'ana@exemplo.org', criado_em: '2026-10-01T12:00:00Z', ultimo_acesso: '2026-11-09T13:45:00Z',
      mandatos: [{ id: 'm1', nome: 'Parlamentar Um', papel: 'assessoria', arquivado: false }],
    })]);
    await expect(page.getByRole('columnheader')).toHaveText(['Nome', 'E-mail', 'Mandatos', 'Cadastro', 'Último acesso']);
    await expect(linhas(page).first().locator('td')).toHaveText(['Ana Souza', 'ana@exemplo.org', 'Parlamentar Um · Assessoria', '01/10/2026', '09/11/2026 10:45']);
  });

  test('marca "Sem perfil" e o papel da equipe Legisla; quem tem perfil e não é da equipe fica sem marca (USR-01.4, 01.5)', async ({ page }) => {
    await abre(page, [
      usuario({ id: 'sem', nome: 'Bruno Sem Perfil', sem_perfil: true }),
      usuario({ id: 'adm', nome: 'Ana Admin', equipe_papel: 'admin' }),
      usuario({ id: 'lei', nome: 'Lia Leitura', equipe_papel: 'leitura' }),
      usuario({ id: 'com', nome: 'Carla Com Perfil' }),
    ]);
    await expect(linhas(page).nth(0).locator('.pill')).toHaveText('Sem perfil');
    await expect(linhas(page).nth(1).locator('.pill')).toHaveText('Equipe Legisla · admin');
    await expect(linhas(page).nth(2).locator('.pill')).toHaveText('Equipe Legisla · leitura');
    await expect(linhas(page).nth(3).locator('.pill')).toHaveCount(0);
  });

  test('quem está em dois mandatos aparece com os dois e o papel de cada; o arquivado leva "(arquivado)"; equipe e mandato aparecem juntos (Edge Cases)', async ({ page }) => {
    await abre(page, [
      usuario({ id: 'dois', nome: 'Duda Dois', mandatos: [
        { id: 'm1', nome: 'Parlamentar Um', papel: 'coordenacao', arquivado: false },
        { id: 'm2', nome: 'Parlamentar Dois', papel: 'leitura', arquivado: true },
      ] }),
      usuario({ id: 'eq', nome: 'Edu Equipe', equipe_papel: 'leitura', mandatos: [{ id: 'm1', nome: 'Parlamentar Um', papel: 'assessoria', arquivado: false }] }),
    ]);
    await expect(linhas(page).nth(0).locator('td').nth(2).locator('div')).toHaveText(['Parlamentar Um · Coordenação', 'Parlamentar Dois · Somente leitura (arquivado)']);
    await expect(linhas(page).nth(1).locator('.pill')).toHaveText('Equipe Legisla · leitura');
    await expect(linhas(page).nth(1).locator('td').nth(2)).toHaveText('Parlamentar Um · Assessoria');
  });

  test('sem login registrado mostra "Nunca"; conta sem e-mail mostra "—"; nomes iguais se distinguem pelo e-mail (USR-01.7, Edge Cases)', async ({ page }) => {
    await abre(page, [
      usuario({ id: 'j1', nome: 'José Silva', email: 'jose.um@exemplo.org', ultimo_acesso: null }),
      usuario({ id: 'j2', nome: 'José Silva', email: 'jose.dois@exemplo.org', ultimo_acesso: null }),
      usuario({ id: 'se', nome: 'Sem Email', email: null }),
    ]);
    await expect(linhas(page).nth(0).locator('td').nth(4)).toHaveText('Nunca');
    await expect(linhas(page).nth(0).locator('td').nth(1)).toHaveText('jose.um@exemplo.org');
    await expect(linhas(page).nth(1).locator('td').nth(1)).toHaveText('jose.dois@exemplo.org');
    await expect(linhas(page).nth(2).locator('td').nth(1)).toHaveText('—');
  });

  test('a lista nunca mostra gênero, raça, nascimento nem telefone, mesmo que venham na resposta, e só chama admin_usuarios (USR-01.10)', async ({ page }) => {
    const vazado = { ...usuario({ id: 'x', nome: 'Pessoa Sigilosa' }), telefone: '21912345678', genero: 'travesti', raca: 'indigena', nascimento: '1987-03-21' };
    await abre(page, [vazado as LinhaUsuario]);
    await expect(linhas(page)).toHaveCount(1);
    const texto = await page.locator('main, .main').first().innerText();
    for (const proibido of ['21912345678', '(21) 91234-5678', 'travesti', 'Travesti', 'indigena', 'Indígena', '1987', 'Gênero', 'Raça', 'Nascimento', 'Telefone']) {
      expect(texto, proibido).not.toContain(proibido);
    }
    const dados = chamadas().filter((c) => !c.caminho.startsWith('auth/') && !c.caminho.startsWith('equipe_legisla'));
    expect(dados.map((c) => c.caminho)).toEqual(['rpc/admin_usuarios']);
  });

  test('a tela mantém a ordem que a função devolve (USR-01.8)', async ({ page }) => {
    await abre(page, [
      usuario({ id: 'c', nome: 'Caio Recente', ultimo_acesso: '2026-11-10T08:00:00Z' }),
      usuario({ id: 'a', nome: 'Ana Antes', ultimo_acesso: '2026-11-09T10:00:00Z' }),
      usuario({ id: 'b', nome: 'Bia Nunca', ultimo_acesso: null }),
    ]);
    await expect(nomes(page)).toHaveText(['Caio Recente', 'Ana Antes', 'Bia Nunca']);
  });
});

test.describe('Usuários: paginação e total (USR-01.9)', () => {
  test('25 por página com o total; "Próxima" leva a página na URL e pede a posição certa', async ({ page }) => {
    const pedidos: Record<string, unknown>[] = [];
    await abre(page, muitas(60), { pedidos });
    await expect(page.getByText('60 pessoas')).toBeVisible();
    await expect(linhas(page)).toHaveCount(25);
    await expect(page.getByText('1–25 de 60')).toBeVisible();
    expect(pedidos.at(-1)).toMatchObject({ p_limite: 25, p_offset: 0 });
    await page.getByRole('button', { name: 'Próxima' }).click();
    await expect(page).toHaveURL(/\/admin\/usuarios\?pagina=2$/);
    await expect(page.getByText('26–50 de 60')).toBeVisible();
    await expect(nomes(page).first()).toHaveText('Pessoa 026');
    expect(pedidos.at(-1)).toMatchObject({ p_limite: 25, p_offset: 25 });
    await page.getByRole('button', { name: 'Próxima' }).click();
    await expect(page.getByText('51–60 de 60')).toBeVisible();
    await expect(linhas(page)).toHaveCount(10);
    await expect(page.getByRole('button', { name: 'Próxima' })).toBeDisabled();
    await page.getByRole('button', { name: 'Anterior' }).click();
    await expect(page.getByText('26–50 de 60')).toBeVisible();
  });

  test('a página vem da URL: ?pagina=3 abre direto em 51–60', async ({ page }) => {
    const pedidos: Record<string, unknown>[] = [];
    await abre(page, muitas(60), { pedidos, rota: '/admin/usuarios?pagina=3' });
    await expect(page.getByText('51–60 de 60')).toBeVisible();
    await expect(nomes(page).first()).toHaveText('Pessoa 051');
    expect(pedidos.map((p) => p.p_offset)).toEqual([50]);
  });

  test('com exatamente 25 pessoas não existe página seguinte', async ({ page }) => {
    await abre(page, muitas(25));
    await expect(linhas(page)).toHaveCount(25);
    await expect(page.getByText('25 pessoas')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Próxima' })).toHaveCount(0);
  });

  test('página além da última (URL antiga) vai à última página', async ({ page }) => {
    await abre(page, muitas(30), { rota: '/admin/usuarios?pagina=9' });
    await expect(page).toHaveURL(/\/admin\/usuarios\?pagina=2$/);
    await expect(page.getByText('26–30 de 30')).toBeVisible();
  });
});

test.describe('Usuários: vazio, erro e carregando (USR-01.11, 01.12)', () => {
  test('sem nenhuma conta mostra "Nenhuma pessoa cadastrada." e nenhuma tabela (USR-01.11)', async ({ page }) => {
    await abre(page, []);
    await expect(page.getByText('Nenhuma pessoa cadastrada.')).toBeVisible();
    await expect(page.locator('table')).toHaveCount(0);
  });

  test('falha ao carregar mostra a mensagem padrão e "Tentar de novo", com o menu de pé; tentar de novo carrega (USR-01.12)', async ({ page }) => {
    let falha = true;
    const servidor = servidorUsuarios(muitas(3));
    await abre(page, [], { estado: { rpc: { admin_usuarios: (args) => (falha ? { status: 500, corpo: { message: 'erro de servidor' } } : servidor(args)) } } });
    await expect(aviso(page)).toHaveText('Não foi possível carregar.');
    await expect(page.locator('table')).toHaveCount(0);
    const menu = page.getByRole('navigation', { name: 'Menu do painel' });
    await expect(menu.getByRole('link', { name: 'Mandatos' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Usuários' })).toHaveAttribute('aria-current', 'page');
    falha = false;
    await page.getByRole('button', { name: 'Tentar de novo' }).click();
    await expect(linhas(page)).toHaveCount(3);
    await expect(aviso(page)).toHaveCount(0);
  });

  test('enquanto a função não responde, mostra "Carregando…" (USR-01)', async ({ page }) => {
    await semeiaSessao(page, 'admin');
    await moca(page, { rpc: { admin_usuarios: servidorUsuarios(muitas(2)) } });
    const segura = await seguraRpc(page, 'admin_usuarios');
    await page.goto('/admin/usuarios');
    await segura.noMeio;
    await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('Carregando…');
    segura.libera();
    await expect(linhas(page)).toHaveCount(2);
  });
});

test.describe('Usuários: abrir o detalhe (USR-02.1)', () => {
  test('clicar na linha abre /admin/usuarios/<id>', async ({ page }) => {
    await abre(page, muitas(3));
    await linhas(page).nth(1).locator('td').nth(1).click(); // célula do e-mail: a linha inteira é clicável
    await expect(page).toHaveURL(/\/admin\/usuarios\/u002$/);
  });

  test('o detalhe leva a consulta da lista em de=', async ({ page }) => {
    await abre(page, muitas(30), { rota: '/admin/usuarios?pagina=2' });
    await expect(page.getByText('26–30 de 30')).toBeVisible();
    await nomes(page).first().click();
    await expect(page).toHaveURL(/\/admin\/usuarios\/u026\?de=pagina%3D2$/);
  });
});

test.describe('Usuários: papéis e layout', () => {
  test('o papel leitura da equipe Legisla vê a mesma lista (USR-01.2)', async ({ page }) => {
    await abre(page, muitas(3), { papel: 'leitura' });
    await expect(linhas(page)).toHaveCount(3);
    await expect(page.getByRole('button', { name: /editar|remover|excluir|exportar/i })).toHaveCount(0);
  });

  test('em 400 px a lista é legível, sem rolagem horizontal da página', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await abre(page, [usuario({
      id: 'longo', nome: 'Maria Aparecida de Albuquerque Maranhão Souza', email: 'maria.aparecida.de.albuquerque@organizacao-com-dominio-longo.org.br',
      sem_perfil: true, ultimo_acesso: '2026-11-09T13:45:00Z',
      mandatos: [{ id: 'm1', nome: 'Parlamentar com um nome bastante comprido da Silva', papel: 'coordenacao', arquivado: true }],
    }), ...muitas(30)]);
    await expect(linhas(page)).toHaveCount(25);
    await expect(nomes(page).first()).toBeVisible();
    const l = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, janela: window.innerWidth }));
    expect(l.doc).toBeLessThanOrEqual(l.janela);
  });
});
