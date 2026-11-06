import { test, expect, type Page } from '@playwright/test';
import { chamadas, esperaSemRpc, mandato, moca, naoMapeadas, semeiaSessao, vazou, type EstadoMoca, type Papel, type RespostaRpc } from './admin-api';

/* Detalhe do mandato no /admin (ADM-06, ADM-07, ADM-08, ADM-16). Supabase todo interceptado (admin-api.ts); as funções
   admin_* respondem com o que o banco responderia, inclusive as mensagens de regra. */

const ID = 'mand-1';
const CODIGO = 'K7QX29';
const erroBanco = (message: string): RespostaRpc => ({ status: 400, corpo: { message } });
const SEM_PERMISSAO = 'Você não tem permissão para esta ação.';

// catálogo do Guia (4, 2, 4, 3 e 3 exercícios por missão), como em exercicios_guia
const CATALOGO: [string, number, number][] = [
  ['m1.persona', 1, 1], ['m1.conjuntura', 1, 2], ['m1.oportunidades', 1, 3], ['m1.frag', 1, 4],
  ['m2.funcoes', 2, 1], ['m2.gestao', 2, 2],
  ['m3.bandeiras', 3, 1], ['m3.legado', 3, 2], ['m3.preditores', 3, 3], ['m3.metas', 3, 4],
  ['m4.comissoes', 4, 1], ['m4.acoes', 4, 2], ['m4.metricas', 4, 3],
  ['m5.monit', 5, 1], ['m5.feedback', 5, 2], ['m5.imersao', 5, 3],
];
// missões 1 e 2 completas + 1 exercício da missão 3 = 7 exercícios, 2 missões
const FEITOS = ['m1.persona', 'm1.conjuntura', 'm1.oportunidades', 'm1.frag', 'm2.funcoes', 'm2.gestao', 'm3.bandeiras'];
const exercicios = () => CATALOGO.map(([exercicio, missao, ordem]) => ({ mandato_id: ID, uf: 'SP', exercicio, missao, ordem, ok: FEITOS.includes(exercicio) }));

interface Membro { user_id: string; nome: string; email: string; papel: 'coordenacao' | 'assessoria'; criado_em: string }
const membrosBase = (): Membro[] => [
  { user_id: 'u-julia', nome: 'Júlia Melo', email: 'julia@exemplo.org', papel: 'assessoria', criado_em: '2026-10-22T15:00:00Z' },
  { user_id: 'u-rafael', nome: 'Rafael Cruz', email: 'rafael@exemplo.org', papel: 'coordenacao', criado_em: '2026-10-21T15:00:00Z' },
];

interface Banco { membros: Membro[]; mandatos: ReturnType<typeof mandato>[]; estado: EstadoMoca; contas: Record<string, { user_id: string; nome: string; email: string }> }

function criaBanco(): Banco {
  const m = mandato({
    id: ID, codigo: CODIGO, nome_parlamentar: 'Marina Alves', cargo: 'Deputada Federal', casa: 'Câmara dos Deputados', uf: 'SP', partido: 'ABC',
    data_posse: '2027-02-01', resp_nome: 'Rafael Cruz', resp_cargo: 'chefe de gabinete', criado_em: '2026-10-21T15:00:00Z',
    membros: 2, exercicios_concluidos: FEITOS.length, ultima_atividade: new Date().toISOString(),
  });
  const b: Banco = {
    membros: membrosBase(),
    mandatos: [m],
    contas: { 'paula@exemplo.org': { user_id: 'u-paula', nome: 'Paula Reis', email: 'paula@exemplo.org' } },
    estado: {},
  };
  const coordenadores = () => b.membros.filter((x) => x.papel === 'coordenacao').length;
  // a view esconde exercícios de mandato arquivado, como v_admin_exercicios
  b.estado.views = {
    v_admin_mandatos: b.mandatos,
    get v_admin_exercicios() { return m.arquivado_em ? [] : exercicios(); },
  };
  b.estado.rpc = {
    admin_membros: () => ({ corpo: b.membros }),
    admin_buscar_usuario: (a) => ({ corpo: b.contas[String(a.p_email).trim().toLowerCase()] ? [b.contas[String(a.p_email).trim().toLowerCase()]] : [] }),
    admin_membro_adicionar: (a) => {
      if (b.membros.some((x) => x.user_id === a.p_user)) return erroBanco('Esta pessoa já é membro deste mandato.');
      const conta = Object.values(b.contas).find((c) => c.user_id === a.p_user)!;
      b.membros.push({ ...conta, papel: a.p_papel as Membro['papel'], criado_em: '2026-11-05T12:00:00Z' });
      return {};
    },
    admin_membro_papel: (a) => {
      const x = b.membros.find((y) => y.user_id === a.p_user);
      if (!x) return erroBanco('Pessoa não encontrada.');
      if (x.papel === 'coordenacao' && a.p_papel !== 'coordenacao' && coordenadores() === 1) return erroBanco('O mandato precisa de ao menos uma pessoa na coordenação.');
      x.papel = a.p_papel as Membro['papel'];
      return {};
    },
    admin_membro_remover: (a) => {
      const x = b.membros.find((y) => y.user_id === a.p_user);
      if (!x) return erroBanco('Pessoa não encontrada.');
      if (x.papel === 'coordenacao' && coordenadores() === 1) return erroBanco('O mandato precisa de ao menos uma pessoa na coordenação.');
      b.membros = b.membros.filter((y) => y !== x);
      return {};
    },
    admin_mandato_arquivar: (a) => { m.arquivado_em = a.p_arquivar ? new Date().toISOString() : null; return {}; },
    admin_mandato_excluir: (a) => {
      if (a.p_codigo !== CODIGO) return erroBanco('O código digitado não confere com o do mandato.');
      b.mandatos.splice(0, b.mandatos.length);
      return {};
    },
  };
  return b;
}

async function abre(page: Page, banco: Banco, papel: Papel = 'admin') {
  await semeiaSessao(page, papel);
  await moca(page, banco.estado);
  await page.goto(`/admin/mandatos/${ID}`);
  await expect(page.getByRole('heading', { name: /Marina Alves/ })).toBeVisible();
}

const linhas = (page: Page) => page.locator('tbody tr');
const chamou = (nome: string) => chamadas().filter((c) => c.metodo === 'POST' && c.caminho === `rpc/${nome}`).length;

test.afterEach(() => {
  expect(naoMapeadas()).toEqual([]);
  expect(vazou()).toEqual([]);
});

test.describe('Cadastro e andamento (ADM-06.1)', () => {
  test('mostra cadastro, missões de 5, exercícios de 16 e última atividade', async ({ page }) => {
    await abre(page, criaBanco());
    const cad = page.locator('.card', { has: page.getByRole('heading', { name: 'Cadastro' }) });
    await expect(cad).toContainText('Deputada Federal');
    await expect(cad).toContainText('Câmara dos Deputados · SP');
    await expect(cad).toContainText('ABC');
    await expect(cad).toContainText('01/02/2027');
    await expect(cad).toContainText('Rafael Cruz (chefe de gabinete)');
    await expect(cad).toContainText('21/10/2026');
    const and = page.locator('.card', { has: page.getByRole('heading', { name: /Andamento/ }) });
    await expect(and).toContainText('Missões concluídas: 2 de 5');
    await expect(and).toContainText('Exercícios feitos: 7 de 16');
    await expect(and).toContainText('Última atividade: hoje');
    await expect(page.getByRole('heading', { name: /Marina Alves/ })).toContainText(CODIGO);
  });

  test('mandato que não existe mostra "Mandato não encontrado"', async ({ page }) => {
    const banco = criaBanco();
    banco.mandatos.splice(0, 1);
    await semeiaSessao(page, 'admin');
    await moca(page, banco.estado);
    await page.goto(`/admin/mandatos/${ID}`);
    await expect(page.getByText('Mandato não encontrado')).toBeVisible();
  });

  test('falha do banco mostra "Tentar de novo" e volta a mostrar o mandato', async ({ page }) => {
    const banco = criaBanco();
    banco.estado.statusErro = 500;
    await semeiaSessao(page, 'admin');
    await moca(page, banco.estado);
    await page.goto(`/admin/mandatos/${ID}`);
    await expect(page.locator('.aviso')).toHaveText('Não foi possível carregar.');
    banco.estado.statusErro = undefined;
    await page.getByRole('button', { name: 'Tentar de novo' }).click();
    await expect(page.getByRole('heading', { name: /Marina Alves/ })).toBeVisible();
  });
});

test.describe('Nenhum texto de gabinete (ADM-06.2)', () => {
  test('só lê views v_admin_* e funções admin_*, com colunas de metadados, e a tela não cita campos de texto', async ({ page }) => {
    await abre(page, criaBanco());
    await expect(linhas(page)).toHaveCount(2);
    const pedidos = chamadas().filter((c) => !c.caminho.startsWith('auth/') && !c.caminho.startsWith('equipe_legisla'));
    expect(pedidos.length).toBeGreaterThan(0);
    for (const p of pedidos) expect(p.caminho).toMatch(/^(v_admin_mandatos\?|v_admin_exercicios\?|rpc\/admin_membros$)/);
    const colunas = decodeURIComponent(pedidos.find((p) => p.caminho.startsWith('v_admin_mandatos'))!.caminho).match(/select=([^&]+)/)![1].split(',');
    for (const proibida of ['dados', 'texto', 'nome_civil', 'resp_telefone']) expect(colunas).not.toContain(proibida);
    const corpo = (await page.locator('body').innerText()).toLowerCase();
    for (const termo of ['nome civil', 'telefone', 'conteúdo indisponível']) expect(corpo).not.toContain(termo);
    expect(vazou()).toEqual([]);
  });
});

test.describe('Membros (ADM-07)', () => {
  test('lista nome, e-mail, papel e entrada, da entrada mais antiga para a mais recente', async ({ page }) => {
    await abre(page, criaBanco());
    await expect(page.getByRole('heading', { name: 'Membros (2)' })).toBeVisible();
    await expect(linhas(page).nth(0)).toContainText('Rafael Cruz');
    await expect(linhas(page).nth(0)).toContainText('rafael@exemplo.org');
    await expect(linhas(page).nth(0)).toContainText('21/10/2026');
    await expect(page.getByLabel('Papel de Rafael Cruz no mandato')).toHaveValue('coordenacao');
    await expect(linhas(page).nth(1)).toContainText('Júlia Melo');
    await expect(page.getByLabel('Papel de Júlia Melo no mandato').locator('option')).toHaveText(['assessoria', 'coordenacao']);
  });

  test('adiciona uma conta existente com o papel escolhido', async ({ page }) => {
    const banco = criaBanco();
    await abre(page, banco);
    await page.getByRole('button', { name: '+ Adicionar membro' }).click();
    const dlg = page.getByRole('dialog', { name: 'Adicionar membro' });
    await dlg.getByLabel('E-mail da pessoa').fill(' Paula@Exemplo.org ');
    await dlg.getByLabel('Papel no mandato').selectOption('coordenacao');
    await dlg.getByRole('button', { name: 'Adicionar', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(linhas(page)).toHaveCount(3);
    await expect(page.getByLabel('Papel de Paula Reis no mandato')).toHaveValue('coordenacao');
    await expect(page.getByRole('heading', { name: 'Membros (3)' })).toBeVisible();
    expect(chamou('admin_membro_adicionar')).toBe(1);
  });

  test('e-mail sem conta e e-mail inválido não chegam à adição', async ({ page }) => {
    await abre(page, criaBanco());
    await page.getByRole('button', { name: '+ Adicionar membro' }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByLabel('E-mail da pessoa').fill('ninguem@exemplo.org');
    await dlg.getByRole('button', { name: 'Adicionar', exact: true }).click();
    await expect(dlg.getByRole('alert')).toHaveText('Nenhuma conta com este e-mail. A pessoa precisa entrar na plataforma uma vez.');
    await dlg.getByLabel('E-mail da pessoa').fill('isto-nao-e-email');
    await dlg.getByRole('button', { name: 'Adicionar', exact: true }).click();
    await expect(dlg.getByRole('alert')).toHaveText('Digite um e-mail válido.');
    expect(await esperaSemRpc(page, 'admin_membro_adicionar')).toEqual([]);
    expect(chamou('admin_buscar_usuario')).toBe(1); // o inválido não consultou o banco
  });

  test('membro duplicado mostra a mensagem do banco e não duplica', async ({ page }) => {
    const banco = criaBanco();
    banco.contas['julia@exemplo.org'] = { user_id: 'u-julia', nome: 'Júlia Melo', email: 'julia@exemplo.org' };
    await abre(page, banco);
    await page.getByRole('button', { name: '+ Adicionar membro' }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByLabel('E-mail da pessoa').fill('julia@exemplo.org');
    await dlg.getByRole('button', { name: 'Adicionar', exact: true }).click();
    await expect(dlg.getByRole('alert')).toHaveText('Esta pessoa já é membro deste mandato.');
    await dlg.getByRole('button', { name: 'Cancelar' }).click();
    await expect(linhas(page)).toHaveCount(2);
  });

  test('edita o papel de um membro', async ({ page }) => {
    const banco = criaBanco();
    await abre(page, banco);
    await page.getByLabel('Papel de Júlia Melo no mandato').selectOption('coordenacao');
    await expect(page.getByLabel('Papel de Júlia Melo no mandato')).toHaveValue('coordenacao');
    expect(chamou('admin_membro_papel')).toBe(1);
    expect(banco.membros.find((x) => x.user_id === 'u-julia')!.papel).toBe('coordenacao');
  });

  test('remove com confirmação: cancelar não chama o banco, confirmar tira o membro', async ({ page }) => {
    await abre(page, criaBanco());
    await linhas(page).filter({ hasText: 'Júlia Melo' }).getByRole('button', { name: 'Remover' }).click();
    const dlg = page.getByRole('dialog', { name: 'Remover membro' });
    await expect(dlg).toContainText('Júlia Melo');
    await dlg.getByRole('button', { name: 'Cancelar' }).click();
    expect(await esperaSemRpc(page, 'admin_membro_remover')).toEqual([]);
    await linhas(page).filter({ hasText: 'Júlia Melo' }).getByRole('button', { name: 'Remover' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Remover', exact: true }).click();
    await expect(linhas(page)).toHaveCount(1);
    await expect(page.getByText('Júlia Melo')).toHaveCount(0);
    expect(chamou('admin_membro_remover')).toBe(1);
  });

  test('última coordenação: rebaixar e remover são recusados com a mensagem do banco', async ({ page }) => {
    await abre(page, criaBanco()); // Rafael é a única coordenação
    await page.getByLabel('Papel de Rafael Cruz no mandato').selectOption('assessoria');
    await expect(page.locator('.aviso')).toHaveText('O mandato precisa de ao menos uma pessoa na coordenação.');
    await expect(page.getByLabel('Papel de Rafael Cruz no mandato')).toHaveValue('coordenacao');

    await linhas(page).filter({ hasText: 'Rafael Cruz' }).getByRole('button', { name: 'Remover' }).click();
    const dlg = page.getByRole('dialog', { name: 'Remover membro' });
    await dlg.getByRole('button', { name: 'Remover', exact: true }).click();
    await expect(dlg.getByRole('alert')).toHaveText('O mandato precisa de ao menos uma pessoa na coordenação.');
    await dlg.getByRole('button', { name: 'Cancelar' }).click();
    await expect(linhas(page)).toHaveCount(2);
  });
});

test.describe('Arquivar e excluir (ADM-08)', () => {
  test('arquiva e desarquiva, chamando admin_mandato_arquivar nos dois sentidos', async ({ page }) => {
    const banco = criaBanco();
    await abre(page, banco);
    await page.getByRole('button', { name: 'Arquivar mandato' }).click();
    await expect(page.getByRole('button', { name: 'Desarquivar mandato' })).toBeVisible();
    await expect(page.locator('h2 .pill')).toHaveText('arquivado');
    await expect(page.locator('.card', { has: page.getByRole('heading', { name: /Andamento/ }) })).toContainText('Missões concluídas: —');
    await expect(page.getByText('Missões não disponíveis para mandato arquivado.')).toBeVisible();
    expect(banco.mandatos[0].arquivado_em).not.toBeNull();
    await page.getByRole('button', { name: 'Desarquivar mandato' }).click();
    await expect(page.getByRole('button', { name: 'Arquivar mandato' })).toBeVisible();
    await expect(page.locator('h2 .pill')).toHaveCount(0);
    await expect(page.getByText('Missões concluídas: 2 de 5')).toBeVisible();
    expect(banco.mandatos[0].arquivado_em).toBeNull();
    expect(chamou('admin_mandato_arquivar')).toBe(2);
  });

  test('excluir só habilita com o código exato, e volta à lista', async ({ page }) => {
    const banco = criaBanco();
    await abre(page, banco);
    await page.getByRole('button', { name: 'Excluir definitivamente…' }).click();
    const dlg = page.getByRole('dialog', { name: 'Excluir mandato definitivamente' });
    const confirma = dlg.getByRole('button', { name: 'Excluir definitivamente', exact: true });
    await expect(confirma).toBeDisabled();
    for (const errado of ['K7QX2', 'k7qx29', 'K7QX29 ', 'XK7QX29']) {
      await dlg.getByLabel(/Digite o código/).fill(errado);
      await expect(confirma).toBeDisabled();
    }
    await dlg.getByLabel(/Digite o código/).fill(CODIGO);
    await expect(confirma).toBeEnabled();
    await confirma.click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: /Mandatos/ })).toBeVisible();
    expect(chamou('admin_mandato_excluir')).toBe(1);
    expect(banco.mandatos).toHaveLength(0);
  });

  test('duplo clique em Excluir envia a ação uma só vez', async ({ page }) => {
    await abre(page, criaBanco());
    await page.getByRole('button', { name: 'Excluir definitivamente…' }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByLabel(/Digite o código/).fill(CODIGO);
    await dlg.getByRole('button', { name: 'Excluir definitivamente', exact: true }).dblclick();
    await expect(page).toHaveURL(/\/admin$/);
    expect(chamou('admin_mandato_excluir')).toBe(1);
  });

  test('escrita recusada com 403 mostra o aviso e nada muda', async ({ page }) => {
    const banco = criaBanco();
    banco.estado.rpc!.admin_mandato_arquivar = () => ({ status: 403, corpo: { message: 'permission denied' } });
    await abre(page, banco);
    await page.getByRole('button', { name: 'Arquivar mandato' }).click();
    await expect(page.locator('.aviso')).toHaveText(SEM_PERMISSAO);
    await expect(page.getByRole('button', { name: 'Arquivar mandato' })).toBeEnabled();
    expect(banco.mandatos[0].arquivado_em).toBeNull();
  });
});

test.describe('Papel leitura (ADM-02.6)', () => {
  test('vê cadastro e membros, sem nenhum botão de alteração e com seletores desabilitados', async ({ page }) => {
    await abre(page, criaBanco(), 'leitura');
    await expect(linhas(page)).toHaveCount(2);
    for (const nome of ['+ Adicionar membro', 'Remover', 'Arquivar mandato', 'Desarquivar mandato', 'Excluir definitivamente…']) {
      await expect(page.getByRole('button', { name: nome })).toHaveCount(0);
    }
    await expect(page.getByText('Zona de risco')).toHaveCount(0);
    const seletores = page.locator('tbody select');
    await expect(seletores).toHaveCount(2);
    for (let i = 0; i < 2; i++) await expect(seletores.nth(i)).toBeDisabled();
    expect(chamadas().filter((c) => c.metodo === 'POST' && /rpc\/admin_(membro_(adicionar|papel|remover)|mandato_)/.test(c.caminho))).toEqual([]);
  });
});

test.describe('Celular (ADM-16)', () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test('em 360 px a página não rola na horizontal', async ({ page }) => {
    await abre(page, criaBanco());
    const l = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, janela: window.innerWidth }));
    expect(l.doc).toBeLessThanOrEqual(l.janela);
  });
});
