import { test, expect, type Page } from '@playwright/test';
import {
  chamadas, mandato, moca, naoMapeadas, seguraRpc, semeiaSessao, servidorUsuarios, usuario, vazou, type EstadoMoca, type Papel,
} from './admin-api';
import type { LinhaUsuario } from '../lib/admin/usuarios.ts';

/* Aba Usuários do /admin: lista (USR-01), busca e filtros (USR-04). O Supabase é todo interceptado (admin-api.ts);
   `servidorUsuarios` faz o papel de public.admin_usuarios e guarda os argumentos de cada chamada; v_admin_mandatos dá as
   opções do filtro de mandato. Datas em UTC; a tela mostra o horário de Brasília. */

const tres = (n: number) => String(n).padStart(3, '0');
const muitas = (n: number) => Array.from({ length: n }, (_, i) => usuario({ id: `u${tres(i + 1)}`, nome: `Pessoa ${tres(i + 1)}` }));

interface Abre { rota?: string; papel?: Papel; pedidos?: Record<string, unknown>[]; mandatos?: ReturnType<typeof mandato>[]; estado?: EstadoMoca }
async function abre(page: Page, pessoas: LinhaUsuario[], o: Abre = {}) {
  await semeiaSessao(page, o.papel ?? 'admin');
  await moca(page, {
    ...o.estado,
    views: { v_admin_mandatos: o.mandatos ?? [], ...o.estado?.views },
    rpc: { admin_usuarios: servidorUsuarios(pessoas, o.pedidos), ...o.estado?.rpc },
  });
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

  test('a lista nunca mostra gênero, raça, nascimento nem telefone, mesmo que venham na resposta, e só chama admin_usuarios e as opções de mandato (USR-01.10)', async ({ page }) => {
    const vazado = { ...usuario({ id: 'x', nome: 'Pessoa Sigilosa' }), telefone: '21912345678', genero: 'travesti', raca: 'indigena', nascimento: '1987-03-21' };
    await abre(page, [vazado as LinhaUsuario]);
    await expect(linhas(page)).toHaveCount(1);
    const texto = await page.locator('main, .main').first().innerText();
    for (const proibido of ['21912345678', '(21) 91234-5678', 'travesti', 'Travesti', 'indigena', 'Indígena', '1987', 'Gênero', 'Raça', 'Nascimento', 'Telefone']) {
      expect(texto, proibido).not.toContain(proibido);
    }
    // fora a sessão, só a função da lista e as opções do filtro de mandato (id, parlamentar e arquivamento)
    const dados = chamadas().filter((c) => !c.caminho.startsWith('auth/') && !c.caminho.startsWith('equipe_legisla'));
    expect(dados.filter((c) => c.caminho === 'rpc/admin_usuarios')).toHaveLength(1);
    for (const c of dados.filter((x) => x.caminho !== 'rpc/admin_usuarios')) {
      expect(decodeURIComponent(c.caminho)).toMatch(/^v_admin_mandatos\?select=id,nome_parlamentar,arquivado_em&/);
    }
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
    await moca(page, { views: { v_admin_mandatos: [] }, rpc: { admin_usuarios: servidorUsuarios(muitas(2)) } });
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
    }), ...muitas(30)], { mandatos: [mandato({ id: 'aaaaaaaa-0000-4000-8000-000000000009', nome_parlamentar: 'Parlamentar com um nome bastante comprido da Silva Sauro de Albuquerque' })] });
    await expect(linhas(page)).toHaveCount(25);
    await expect(nomes(page).first()).toBeVisible();
    await expect(page.getByLabel('Mandato', { exact: true }).locator('option')).toHaveCount(2);
    const l = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, janela: window.innerWidth }));
    expect(l.doc).toBeLessThanOrEqual(l.janela);
  });
});

test.describe('Usuários: busca e filtros (USR-04)', () => {
  // ids de mandato são uuid: a URL só aceita mandato válido
  const M1 = 'aaaaaaaa-0000-4000-8000-000000000001';
  const M2 = 'aaaaaaaa-0000-4000-8000-000000000002';
  const M3 = 'aaaaaaaa-0000-4000-8000-000000000003';
  const M4 = 'aaaaaaaa-0000-4000-8000-000000000004';
  // a view devolve fora de ordem alfabética (Á depois de Z em ordem de código) e com um arquivado
  const MANDATOS = [
    mandato({ id: M1, nome_parlamentar: 'Zélia Zanon' }),
    mandato({ id: M2, nome_parlamentar: 'Ágata Alves' }),
    mandato({ id: M3, nome_parlamentar: 'Bruno Borges' }),
    mandato({ id: M4, nome_parlamentar: 'Arquivado Antigo', arquivado_em: '2026-10-01T12:00:00Z' }),
  ];
  const PESSOAS = [
    usuario({ id: 'jose', nome: 'José Conceição', email: 'jose@exemplo.org', mandatos: [{ id: M1, nome: 'Zélia Zanon', papel: 'assessoria', arquivado: false }] }),
    usuario({ id: 'ana', nome: 'Ana Admin', email: 'ana@legisla.org', equipe_papel: 'admin', mandatos: [{ id: M2, nome: 'Ágata Alves', papel: 'assessoria', arquivado: false }] }),
    usuario({ id: 'bia', nome: 'Bia Coordena', email: 'bia@exemplo.org', mandatos: [{ id: M1, nome: 'Zélia Zanon', papel: 'coordenacao', arquivado: false }] }),
    usuario({ id: 'caio', nome: 'Caio Sem Perfil', email: 'caio@exemplo.org', sem_perfil: true, mandatos: [{ id: M1, nome: 'Zélia Zanon', papel: 'leitura', arquivado: false }] }),
    usuario({ id: 'dani', nome: 'Dani Sem Perfil', email: 'dani@exemplo.org', sem_perfil: true }),
  ];
  const busca = (page: Page) => page.getByLabel('Buscar pessoa');
  const papel = (page: Page) => page.getByLabel('Papel', { exact: true });
  const filtroMandato = (page: Page) => page.getByLabel('Mandato', { exact: true });
  const semPerfil = (page: Page) => page.getByLabel('Só quem ainda não preencheu o perfil');
  const limpar = (page: Page) => page.getByRole('button', { name: 'Limpar filtros' });

  test('a busca acha por nome sem diferenciar maiúsculas e acentos, volta à página 1 e fica na URL (USR-04.1)', async ({ page }) => {
    const pedidos: Record<string, unknown>[] = [];
    await abre(page, [...muitas(30), ...PESSOAS], { pedidos, mandatos: MANDATOS, rota: '/admin/usuarios?pagina=2' });
    await expect(page.getByText('26–35 de 35')).toBeVisible();
    await busca(page).fill('JOSE CONCEICAO');
    await expect(page).toHaveURL(/\/admin\/usuarios\?q=JOSE\+CONCEICAO$/);
    await expect(nomes(page)).toHaveText(['José Conceição']);
    expect(pedidos.at(-1)).toMatchObject({ p_busca: 'JOSE CONCEICAO', p_offset: 0 });
  });

  test('a busca acha por parte do e-mail (USR-04.1)', async ({ page }) => {
    await abre(page, PESSOAS, { mandatos: MANDATOS });
    await busca(page).fill('legisla.org');
    await expect(nomes(page)).toHaveText(['Ana Admin']);
  });

  test('o filtro de papel tem Todos, Coordenação, Assessoria, Somente leitura e Equipe Legisla, e filtra pelo escolhido (USR-04.2)', async ({ page }) => {
    const pedidos: Record<string, unknown>[] = [];
    await abre(page, PESSOAS, { pedidos, mandatos: MANDATOS });
    await expect(papel(page).locator('option')).toHaveText(['Todos', 'Coordenação', 'Assessoria', 'Somente leitura', 'Equipe Legisla']);
    await papel(page).selectOption({ label: 'Assessoria' });
    await expect(page).toHaveURL(/\?papel=assessoria$/);
    await expect(nomes(page)).toHaveText(['José Conceição', 'Ana Admin']);
    expect(pedidos.at(-1)).toMatchObject({ p_papel: 'assessoria' });
    await papel(page).selectOption({ label: 'Equipe Legisla' });
    await expect(nomes(page)).toHaveText(['Ana Admin']);
    expect(pedidos.at(-1)).toMatchObject({ p_papel: 'legisla' });
    await papel(page).selectOption({ label: 'Somente leitura' });
    await expect(nomes(page)).toHaveText(['Caio Sem Perfil']);
    expect(pedidos.at(-1)).toMatchObject({ p_papel: 'leitura' });
  });

  test('o filtro de mandato lista só os não arquivados, em ordem alfabética do parlamentar, e filtra pelo escolhido (USR-04.3)', async ({ page }) => {
    const pedidos: Record<string, unknown>[] = [];
    await abre(page, PESSOAS, { pedidos, mandatos: MANDATOS });
    await expect(filtroMandato(page).locator('option')).toHaveText(['Todos os mandatos', 'Ágata Alves', 'Bruno Borges', 'Zélia Zanon']);
    await filtroMandato(page).selectOption({ label: 'Zélia Zanon' });
    await expect(page).toHaveURL(new RegExp(`\\?mandato=${M1}$`));
    await expect(nomes(page)).toHaveText(['José Conceição', 'Bia Coordena', 'Caio Sem Perfil']);
    expect(pedidos.at(-1)).toMatchObject({ p_mandato: M1 });
  });

  test('"Só quem ainda não preencheu o perfil" mostra só quem não tem perfil (USR-04.4)', async ({ page }) => {
    const pedidos: Record<string, unknown>[] = [];
    await abre(page, PESSOAS, { pedidos, mandatos: MANDATOS });
    await semPerfil(page).check();
    await expect(page).toHaveURL(/\?sem_perfil=1$/);
    await expect(nomes(page)).toHaveText(['Caio Sem Perfil', 'Dani Sem Perfil']);
    expect(pedidos.at(-1)).toMatchObject({ p_sem_perfil: true });
  });

  test('busca, papel, mandato e "sem perfil" valem juntos (USR-04.5)', async ({ page }) => {
    const pedidos: Record<string, unknown>[] = [];
    await abre(page, PESSOAS, { pedidos, mandatos: MANDATOS });
    await filtroMandato(page).selectOption({ label: 'Zélia Zanon' });
    await expect(nomes(page)).toHaveText(['José Conceição', 'Bia Coordena', 'Caio Sem Perfil']);
    await semPerfil(page).check();
    await expect(nomes(page)).toHaveText(['Caio Sem Perfil']);
    await papel(page).selectOption({ label: 'Coordenação' });
    await expect(page.getByText('Nenhuma pessoa encontrada com esses filtros.')).toBeVisible();
    await semPerfil(page).uncheck();
    await expect(nomes(page)).toHaveText(['Bia Coordena']);
    await busca(page).fill('bia');
    await expect(page).toHaveURL(/q=bia/);
    await expect(nomes(page)).toHaveText(['Bia Coordena']);
    expect(pedidos.at(-1)).toMatchObject({ p_busca: 'bia', p_papel: 'coordenacao', p_mandato: M1, p_sem_perfil: false, p_offset: 0 });
  });

  test('trocar de página mantém a busca e os filtros (USR-04.6)', async ({ page }) => {
    const pedidos: Record<string, unknown>[] = [];
    const sessenta = Array.from({ length: 60 }, (_, i) => usuario({
      id: `p${tres(i + 1)}`, nome: `Pessoa ${tres(i + 1)}`, sem_perfil: true,
      mandatos: [{ id: M1, nome: 'Zélia Zanon', papel: 'assessoria', arquivado: false }],
    }));
    await abre(page, sessenta, { pedidos, mandatos: MANDATOS, rota: `/admin/usuarios?q=pessoa&papel=assessoria&mandato=${M1}&sem_perfil=1` });
    await expect(page.getByText('1–25 de 60')).toBeVisible();
    await page.getByRole('button', { name: 'Próxima' }).click();
    await expect(page.getByText('26–50 de 60')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`\\?q=pessoa&papel=assessoria&mandato=${M1}&sem_perfil=1&pagina=2$`));
    await expect(busca(page)).toHaveValue('pessoa');
    await expect(papel(page)).toHaveValue('assessoria');
    await expect(filtroMandato(page)).toHaveValue(M1);
    await expect(semPerfil(page)).toBeChecked();
    expect(pedidos.at(-1)).toMatchObject({ p_busca: 'pessoa', p_papel: 'assessoria', p_mandato: M1, p_sem_perfil: true, p_offset: 25 });
  });

  test('sem resultado mostra "Nenhuma pessoa encontrada com esses filtros." e nenhuma tabela (USR-04.7)', async ({ page }) => {
    await abre(page, PESSOAS, { mandatos: MANDATOS });
    await busca(page).fill('ninguém com este nome');
    await expect(page.getByText('Nenhuma pessoa encontrada com esses filtros.')).toBeVisible();
    await expect(page.locator('table')).toHaveCount(0);
    await expect(page.getByText('Nenhuma pessoa cadastrada.')).toHaveCount(0);
  });

  test('"Limpar filtros" aparece só com filtro ativo e volta a lista ao padrão (USR-04.8)', async ({ page }) => {
    const pedidos: Record<string, unknown>[] = [];
    await abre(page, [...muitas(30), ...PESSOAS], { pedidos, mandatos: MANDATOS, rota: '/admin/usuarios?pagina=2' });
    await expect(page.getByText('26–35 de 35')).toBeVisible();
    await expect(limpar(page)).toHaveCount(0); // página não é filtro
    await semPerfil(page).check();
    await expect(limpar(page)).toBeVisible();
    await papel(page).selectOption({ label: 'Somente leitura' });
    await busca(page).fill('caio');
    await expect(page).toHaveURL(/q=caio/);
    await expect(nomes(page)).toHaveText(['Caio Sem Perfil']);
    await limpar(page).click();
    await expect(page).toHaveURL(/\/admin\/usuarios$/);
    await expect(page.getByText('1–25 de 35')).toBeVisible();
    await expect(busca(page)).toHaveValue('');
    await expect(papel(page)).toHaveValue('todos');
    await expect(filtroMandato(page)).toHaveValue('');
    await expect(semPerfil(page)).not.toBeChecked();
    await expect(limpar(page)).toHaveCount(0);
    expect(pedidos.at(-1)).toMatchObject({ p_busca: null, p_papel: null, p_mandato: null, p_sem_perfil: false, p_offset: 0 });
  });

  test('"Limpar filtros" aparece também quando a busca não acha ninguém (USR-04.7, 04.8)', async ({ page }) => {
    await abre(page, PESSOAS, { mandatos: MANDATOS });
    await busca(page).fill('zzz');
    await expect(page.getByText('Nenhuma pessoa encontrada com esses filtros.')).toBeVisible();
    await limpar(page).click();
    await expect(linhas(page)).toHaveCount(5);
  });

  test('busca com mais de 100 caracteres é cortada em 100, sem erro, vinda da URL ou digitada (Edge Cases)', async ({ page }) => {
    const pedidos: Record<string, unknown>[] = [];
    await abre(page, PESSOAS, { pedidos, mandatos: MANDATOS, rota: `/admin/usuarios?q=${'a'.repeat(150)}` });
    await expect(page.getByText('Nenhuma pessoa encontrada com esses filtros.')).toBeVisible();
    await expect(busca(page)).toHaveValue('a'.repeat(100));
    expect(pedidos.at(-1)).toMatchObject({ p_busca: 'a'.repeat(100) });
    await busca(page).fill('b'.repeat(150));
    await expect(page).toHaveURL(new RegExp(`q=${'b'.repeat(100)}$`));
    await expect(busca(page)).toHaveValue('b'.repeat(100));
    expect(pedidos.at(-1)).toMatchObject({ p_busca: 'b'.repeat(100) });
    await expect(aviso(page)).toHaveCount(0);
  });

  test('busca e filtros vindos da URL aparecem marcados e vão para a função (USR-04.6)', async ({ page }) => {
    const pedidos: Record<string, unknown>[] = [];
    await abre(page, PESSOAS, { pedidos, mandatos: MANDATOS, rota: `/admin/usuarios?q=caio&papel=leitura&mandato=${M1}&sem_perfil=1` });
    await expect(nomes(page)).toHaveText(['Caio Sem Perfil']);
    await expect(busca(page)).toHaveValue('caio');
    await expect(papel(page)).toHaveValue('leitura');
    await expect(filtroMandato(page)).toHaveValue(M1);
    await expect(semPerfil(page)).toBeChecked();
    expect(pedidos).toEqual([{ p_busca: 'caio', p_papel: 'leitura', p_mandato: M1, p_sem_perfil: true, p_limite: 25, p_offset: 0 }]);
  });

  test('se as opções de mandato não carregam, a lista segue e o filtro fica só com "Todos os mandatos"', async ({ page }) => {
    await abre(page, PESSOAS, { mandatos: MANDATOS, estado: { statusErro: 500 } });
    await expect(linhas(page)).toHaveCount(5);
    await expect(filtroMandato(page).locator('option')).toHaveText(['Todos os mandatos']);
    await expect(aviso(page)).toHaveCount(0);
  });
});
