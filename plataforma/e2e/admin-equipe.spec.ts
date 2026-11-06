import { test, expect, type Page } from '@playwright/test';
import { chamadas, moca, naoMapeadas, semeiaSessao, vazou, type EstadoMoca, type Papel, type RespostaRpc } from './admin-api';

/* Tela Equipe do /admin (ADM-03, ADM-16) e a cobertura adiada da T21 (403 de escrita e seletores desabilitados para leitura).
   Supabase todo interceptado (admin-api.ts); as funções admin_* respondem com o que o banco responderia. */

interface Pessoa { user_id: string; nome: string; email: string; papel: Papel; criado_em: string }
const SEM_PERMISSAO = 'Você não tem permissão para esta ação.';
const SEM_CONTA = 'Nenhuma conta com este e-mail. A pessoa precisa entrar na plataforma uma vez.';
const erroBanco = (message: string): RespostaRpc => ({ status: 400, corpo: { message } });

// fora de ordem de propósito: a tela ordena da entrada mais antiga para a mais recente
const equipeBase = (): Pessoa[] => [
  { user_id: 'uid-carla', nome: 'Carla Dias', email: 'carla@exemplo.org', papel: 'leitura', criado_em: '2026-11-03T15:00:00Z' },
  { user_id: 'uid-admin', nome: 'Pessoa admin', email: 'admin@legisla.test', papel: 'admin', criado_em: '2026-10-16T15:00:00Z' },
  { user_id: 'uid-bruno', nome: 'Bruno Lima', email: 'bruno@exemplo.org', papel: 'leitura', criado_em: '2026-10-20T15:00:00Z' },
];

interface Banco { equipe: Pessoa[]; rpc: NonNullable<EstadoMoca['rpc']>; contas: Record<string, { user_id: string; nome: string; email: string }> }

// Banco simulado com estado: lista, busca por e-mail e as três escritas, com as mensagens reais das funções.
function criaBanco(equipe = equipeBase()): Banco {
  const b: Banco = {
    equipe,
    contas: { 'diego@exemplo.org': { user_id: 'uid-diego', nome: 'Diego Reis', email: 'diego@exemplo.org' } },
    rpc: {},
  };
  const admins = () => b.equipe.filter((p) => p.papel === 'admin').length;
  b.rpc.admin_equipe = () => ({ corpo: b.equipe });
  b.rpc.admin_buscar_usuario = (a) => {
    const conta = b.contas[String(a.p_email).trim().toLowerCase()];
    return { corpo: conta ? [conta] : [] };
  };
  b.rpc.admin_equipe_incluir = (a) => {
    if (b.equipe.some((p) => p.user_id === a.p_user)) return erroBanco('Esta pessoa já está na equipe.');
    const conta = Object.values(b.contas).find((c) => c.user_id === a.p_user)!;
    b.equipe.push({ ...conta, papel: a.p_papel as Papel, criado_em: '2026-11-05T12:00:00Z' });
    return {};
  };
  b.rpc.admin_equipe_papel = (a) => {
    const p = b.equipe.find((x) => x.user_id === a.p_user);
    if (!p) return erroBanco('Pessoa não encontrada.');
    if (p.papel === 'admin' && a.p_papel !== 'admin' && admins() === 1) return erroBanco('A equipe precisa ter ao menos um admin.');
    p.papel = a.p_papel as Papel;
    return {};
  };
  b.rpc.admin_equipe_remover = (a) => {
    const p = b.equipe.find((x) => x.user_id === a.p_user);
    if (!p) return erroBanco('Pessoa não encontrada.');
    if (p.papel === 'admin' && admins() === 1) return erroBanco('A equipe precisa ter ao menos um admin.');
    b.equipe = b.equipe.filter((x) => x !== p);
    return {};
  };
  return b;
}

async function abre(page: Page, banco: Banco, papel: Papel = 'admin') {
  await semeiaSessao(page, papel);
  await moca(page, { rpc: banco.rpc });
  await page.goto('/admin/equipe');
  await expect(page.getByRole('heading', { name: 'Equipe Legisla' })).toBeVisible();
}

const linhas = (page: Page) => page.locator('tbody tr');
const escritas = () => chamadas().filter((c) => c.metodo === 'POST' && /rpc\/admin_equipe_(incluir|papel|remover)/.test(c.caminho));
const chamou = (nome: string) => chamadas().filter((c) => c.metodo === 'POST' && c.caminho === `rpc/${nome}`).length;

async function preencheEIncluir(page: Page, email: string, papel?: Papel) {
  await page.getByRole('button', { name: 'Incluir pessoa' }).click();
  const dlg = page.getByRole('dialog', { name: 'Incluir pessoa na equipe' });
  await dlg.getByLabel('E-mail da pessoa').fill(email);
  if (papel) await dlg.getByLabel('Papel').selectOption(papel);
  await dlg.getByRole('button', { name: 'Incluir', exact: true }).click();
  return dlg;
}

test.afterEach(() => {
  expect(naoMapeadas()).toEqual([]);
  expect(vazou()).toEqual([]);
});

test.describe('Lista da equipe (ADM-03.1)', () => {
  test('mostra nome, e-mail, papel e entrada, da mais antiga para a mais recente, para admin', async ({ page }) => {
    await abre(page, criaBanco());
    await expect(page.locator('thead th')).toHaveText(['Nome', 'E-mail', 'Papel', 'Desde', '']);
    await expect(linhas(page)).toHaveCount(3);
    await expect(linhas(page).nth(0)).toContainText('Pessoa admin');
    await expect(linhas(page).nth(0)).toContainText('admin@legisla.test');
    await expect(linhas(page).nth(0)).toContainText('(você)');
    await expect(linhas(page).nth(0)).toContainText('16/10/2026');
    await expect(linhas(page).nth(1)).toContainText('Bruno Lima');
    await expect(linhas(page).nth(1)).toContainText('20/10/2026');
    await expect(linhas(page).nth(2)).toContainText('Carla Dias');
    await expect(linhas(page).nth(2)).toContainText('03/11/2026');
    await expect(page.getByLabel('Papel de Bruno Lima')).toHaveValue('leitura');
    await expect(page.getByLabel('Papel de Pessoa admin')).toHaveValue('admin');
  });

  test('a busca da tela filtra por nome ou e-mail, sem acento', async ({ page }) => {
    await abre(page, criaBanco());
    await page.getByLabel('Buscar na equipe').fill('CARLA');
    await expect(linhas(page)).toHaveCount(1);
    await page.getByLabel('Buscar na equipe').fill('bruno@');
    await expect(linhas(page)).toHaveCount(1);
    await expect(linhas(page).first()).toContainText('Bruno Lima');
  });

  test('falha do banco mostra "Tentar de novo" e volta a listar', async ({ page }) => {
    const banco = criaBanco();
    let falha = true;
    const listar = banco.rpc.admin_equipe;
    banco.rpc.admin_equipe = (a) => (falha ? { status: 500, corpo: { message: 'boom' } } : listar(a));
    await abre(page, banco);
    await expect(page.locator('.aviso')).toHaveText('Não foi possível carregar.');
    falha = false;
    await page.getByRole('button', { name: 'Tentar de novo' }).click();
    await expect(linhas(page)).toHaveCount(3);
  });
});

test.describe('Incluir pessoa (ADM-03.2 a 03.5)', () => {
  test('inclui uma conta existente com o papel escolhido e a mostra na lista', async ({ page }) => {
    const banco = criaBanco();
    await abre(page, banco);
    // e-mail com caixa e espaços: a busca do banco é que normaliza; a tela manda o que foi digitado, aparado
    await preencheEIncluir(page, '  Diego@Exemplo.org ', 'admin');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(linhas(page)).toHaveCount(4);
    await expect(linhas(page).nth(3)).toContainText('Diego Reis');
    await expect(page.getByLabel('Papel de Diego Reis')).toHaveValue('admin');
    expect(escritas().map((c) => c.caminho)).toEqual(['rpc/admin_equipe_incluir']);
  });

  test('e-mail sem conta mostra a mensagem e não inclui ninguém', async ({ page }) => {
    await abre(page, criaBanco());
    const dlg = await preencheEIncluir(page, 'ninguem@exemplo.org');
    await expect(dlg.getByRole('alert')).toHaveText(SEM_CONTA);
    expect(chamou('admin_equipe_incluir')).toBe(0);
    await dlg.getByRole('button', { name: 'Cancelar' }).click();
    await expect(linhas(page)).toHaveCount(3);
  });

  test('pessoa já na equipe mostra a mensagem do banco e não duplica', async ({ page }) => {
    const banco = criaBanco();
    banco.contas['bruno@exemplo.org'] = { user_id: 'uid-bruno', nome: 'Bruno Lima', email: 'bruno@exemplo.org' };
    await abre(page, banco);
    const dlg = await preencheEIncluir(page, 'bruno@exemplo.org');
    await expect(dlg.getByRole('alert')).toHaveText('Esta pessoa já está na equipe.');
    await dlg.getByRole('button', { name: 'Cancelar' }).click();
    await expect(linhas(page)).toHaveCount(3);
  });

  test('e-mail inválido mostra "Digite um e-mail válido." sem chamar o banco', async ({ page }) => {
    await abre(page, criaBanco());
    const dlg = await preencheEIncluir(page, 'isto-nao-e-email');
    await expect(dlg.getByRole('alert')).toHaveText('Digite um e-mail válido.');
    expect(chamou('admin_buscar_usuario')).toBe(0);
    expect(chamou('admin_equipe_incluir')).toBe(0);
  });

  test('duplo clique em Incluir envia a ação uma só vez', async ({ page }) => {
    const banco = criaBanco();
    await abre(page, banco);
    await page.getByRole('button', { name: 'Incluir pessoa' }).click();
    const dlg = page.getByRole('dialog', { name: 'Incluir pessoa na equipe' });
    await dlg.getByLabel('E-mail da pessoa').fill('diego@exemplo.org');
    await dlg.getByRole('button', { name: 'Incluir', exact: true }).dblclick();
    await expect(linhas(page)).toHaveCount(4);
    expect(chamou('admin_equipe_incluir')).toBe(1);
    expect(chamou('admin_buscar_usuario')).toBe(1);
  });
});

test.describe('Trocar papel e remover (ADM-03.6 a 03.8)', () => {
  test('trocar o papel grava e mostra o novo papel na lista', async ({ page }) => {
    const banco = criaBanco();
    await abre(page, banco);
    await page.getByLabel('Papel de Bruno Lima').selectOption('admin');
    await expect(page.getByLabel('Papel de Bruno Lima')).toHaveValue('admin');
    expect(escritas().map((c) => c.caminho)).toEqual(['rpc/admin_equipe_papel']);
    expect(banco.equipe.find((p) => p.user_id === 'uid-bruno')!.papel).toBe('admin');
  });

  test('remover pede confirmação: cancelar não chama o banco, confirmar tira a pessoa da lista', async ({ page }) => {
    const banco = criaBanco();
    await abre(page, banco);
    await linhas(page).filter({ hasText: 'Carla Dias' }).getByRole('button', { name: 'Remover' }).click();
    const dlg = page.getByRole('dialog', { name: 'Remover pessoa da equipe' });
    await expect(dlg).toContainText('Carla Dias');
    await dlg.getByRole('button', { name: 'Cancelar' }).click();
    expect(chamou('admin_equipe_remover')).toBe(0);
    await expect(linhas(page)).toHaveCount(3);

    await linhas(page).filter({ hasText: 'Carla Dias' }).getByRole('button', { name: 'Remover' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Remover', exact: true }).click();
    await expect(linhas(page)).toHaveCount(2);
    await expect(page.getByText('Carla Dias')).toHaveCount(0);
    expect(chamou('admin_equipe_remover')).toBe(1);
  });

  test('último admin: rebaixar é recusado com a mensagem do banco e o papel volta ao valor real', async ({ page }) => {
    await abre(page, criaBanco()); // só "Pessoa admin" é admin
    await page.getByLabel('Papel de Pessoa admin').selectOption('leitura');
    await expect(page.locator('.aviso')).toHaveText('A equipe precisa ter ao menos um admin.');
    await expect(page.getByLabel('Papel de Pessoa admin')).toHaveValue('admin');
  });

  test('último admin: remover é recusado com a mensagem do banco e a pessoa continua na lista', async ({ page }) => {
    const banco = criaBanco();
    banco.equipe.find((p) => p.user_id === 'uid-admin')!.papel = 'leitura';
    banco.equipe.find((p) => p.user_id === 'uid-bruno')!.papel = 'admin'; // Bruno é o único admin
    await abre(page, banco);
    await linhas(page).filter({ hasText: 'Bruno Lima' }).getByRole('button', { name: 'Remover' }).click();
    const dlg = page.getByRole('dialog', { name: 'Remover pessoa da equipe' });
    await dlg.getByRole('button', { name: 'Remover', exact: true }).click();
    await expect(dlg.getByRole('alert')).toHaveText('A equipe precisa ter ao menos um admin.');
    await dlg.getByRole('button', { name: 'Cancelar' }).click();
    await expect(linhas(page)).toHaveCount(3);
  });

  test('pessoa já removida por outro admin: mostra "Pessoa não encontrada." e atualiza a lista', async ({ page }) => {
    const banco = criaBanco();
    await abre(page, banco);
    // espera a primeira leitura terminar: mexer no banco antes dela faria a linha sumir e o clique estourar o tempo
    await expect(linhas(page)).toHaveCount(3);
    banco.equipe = banco.equipe.filter((p) => p.user_id !== 'uid-carla'); // outro admin removeu antes
    await linhas(page).filter({ hasText: 'Carla Dias' }).getByRole('button', { name: 'Remover' }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByRole('button', { name: 'Remover', exact: true }).click();
    await expect(dlg.getByRole('alert')).toHaveText('Pessoa não encontrada.');
    await dlg.getByRole('button', { name: 'Cancelar' }).click();
    await expect(linhas(page)).toHaveCount(2);
  });

  test('rebaixar a si mesmo, havendo outro admin, é permitido e recarrega a tela', async ({ page }) => {
    const banco = criaBanco();
    banco.equipe[0].papel = 'admin'; // Carla também é admin
    await abre(page, banco);
    const antes = chamadas().filter((c) => c.caminho.startsWith('equipe_legisla')).length;
    await page.getByLabel('Papel de Pessoa admin').selectOption('leitura');
    await expect.poll(() => chamadas().filter((c) => c.caminho.startsWith('equipe_legisla')).length).toBeGreaterThan(antes);
    expect(chamou('admin_equipe_papel')).toBe(1);
    expect(banco.equipe.find((p) => p.user_id === 'uid-admin')!.papel).toBe('leitura');
  });
});

test.describe('Papel leitura e permissão negada (ADM-02.6, adiado da T21)', () => {
  test('leitura vê a lista, sem Incluir nem Remover, e com os seletores de papel desabilitados', async ({ page }) => {
    await abre(page, criaBanco(), 'leitura');
    await expect(linhas(page)).toHaveCount(3);
    await expect(page.getByRole('button', { name: 'Incluir pessoa' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Remover' })).toHaveCount(0);
    const seletores = page.locator('tbody select');
    await expect(seletores).toHaveCount(3);
    for (let i = 0; i < 3; i++) await expect(seletores.nth(i)).toBeDisabled();
    expect(escritas()).toEqual([]);
  });

  test('escrita recusada com 403 (admin rebaixado no meio da sessão) mostra o aviso e nada muda', async ({ page }) => {
    const banco = criaBanco();
    banco.rpc.admin_equipe_papel = () => ({ status: 403, corpo: { message: 'permission denied for function admin_equipe_papel' } });
    banco.rpc.admin_equipe_remover = () => ({ status: 403, corpo: { message: 'permission denied' } });
    await abre(page, banco);
    await page.getByLabel('Papel de Bruno Lima').selectOption('admin');
    await expect(page.locator('.aviso')).toHaveText(SEM_PERMISSAO);
    await expect(page.getByLabel('Papel de Bruno Lima')).toHaveValue('leitura');

    await linhas(page).filter({ hasText: 'Carla Dias' }).getByRole('button', { name: 'Remover' }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByRole('button', { name: 'Remover', exact: true }).click();
    await expect(dlg.getByRole('alert')).toHaveText(SEM_PERMISSAO);
    await dlg.getByRole('button', { name: 'Cancelar' }).click();
    await expect(linhas(page)).toHaveCount(3);
  });
});

test.describe('Diálogo (T22): foco preso e Esc', () => {
  test('Esc fecha o diálogo e o foco volta ao botão que o abriu; Tab não sai do diálogo', async ({ page }) => {
    await abre(page, criaBanco());
    const abrir = page.getByRole('button', { name: 'Incluir pessoa' });
    await abrir.click();
    const dlg = page.getByRole('dialog', { name: 'Incluir pessoa na equipe' });
    await expect(dlg.getByLabel('E-mail da pessoa')).toBeFocused();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
    }
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dlg).toHaveCount(0);
    await expect(abrir).toBeFocused();
  });
});

test.describe('Celular (ADM-16)', () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test('em 360 px a página não rola na horizontal e os botões têm 40 px', async ({ page }) => {
    await abre(page, criaBanco());
    const larguras = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, janela: window.innerWidth }));
    expect(larguras.doc).toBeLessThanOrEqual(larguras.janela);
    const alturas = await page.getByRole('button', { name: 'Incluir pessoa' }).evaluate((e) => e.getBoundingClientRect().height);
    expect(alturas).toBeGreaterThanOrEqual(40);
  });
});
