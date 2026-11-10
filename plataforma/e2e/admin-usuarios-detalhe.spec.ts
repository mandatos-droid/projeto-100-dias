import { test, expect, type Page } from '@playwright/test';
import {
  chamadas, detalheUsuario, esperaSemRpc, moca, naoMapeadas, seguraRpc, semeiaSessao, servidorUsuarios, usuario, vazou,
  type EstadoMoca, type Papel,
} from './admin-api';
import type { DetalheUsuario } from '../lib/admin/usuarios.ts';

/* Aba Usuários do /admin: detalhe da pessoa (USR-02). O Supabase é todo interceptado (admin-api.ts); a função
   admin_usuario_detalhe responde pela lista `pessoas` (null para id que não está nela). Datas em UTC; a tela mostra Brasília. */

const ID = '11111111-0000-4000-8000-000000000001';
const SEM = '11111111-0000-4000-8000-000000000002';
const INEXISTENTE = '11111111-0000-4000-8000-0000000000ff';
const M1 = 'aaaaaaaa-0000-4000-8000-000000000001';
const M2 = 'aaaaaaaa-0000-4000-8000-000000000002';

const JOANA = detalheUsuario({
  id: ID, nome: 'Joana Perfil Souza', email: 'joana@exemplo.org', criado_em: '2026-01-02T15:04:05Z', ultimo_acesso: '2026-11-09T13:45:00Z',
  perfil: { nome: 'Joana Perfil Souza', nascimento: '1987-03-21', genero: 'mulher_trans', raca: 'preta', telefone: '21912345678', atua: true, tempo: '6_10' },
  consentimento: { versao: '2026-11', aceito_em: '2026-11-09T13:50:00Z' },
  mandatos: [
    { id: M1, nome: 'Parlamentar Um', cargo: 'Deputada Federal', uf: 'SP', papel: 'assessoria', arquivado: false },
    { id: M2, nome: 'Parlamentar Dois', cargo: 'Deputado Estadual', uf: 'MG', papel: 'leitura', arquivado: true },
  ],
});
// sem perfil, sem consentimento e sem mandato
const BRUNO = detalheUsuario({ id: SEM, nome: 'Bruno Conta', email: 'bruno@exemplo.org' });

interface Abre { rota?: string; papel?: Papel; pedidos?: Record<string, unknown>[]; estado?: EstadoMoca }
async function abre(page: Page, pessoas: DetalheUsuario[], o: Abre = {}) {
  await semeiaSessao(page, o.papel ?? 'admin');
  await moca(page, {
    ...o.estado,
    rpc: {
      admin_usuario_detalhe: (args) => {
        o.pedidos?.push(args);
        return { corpo: pessoas.find((p) => p.id === args.p_user) ?? null };
      },
      ...o.estado?.rpc,
    },
  });
  await page.goto(o.rota ?? `/admin/usuarios/${ID}`);
}
// valor de um campo pelo rótulo exato (dt → dd)
const campo = (page: Page, rotulo: string) => page.locator(`dt:text-is("${rotulo}") + dd`);
const voltar = (page: Page) => page.getByRole('link', { name: '← Voltar para Usuários' });
const aviso = (page: Page) => page.locator('.aviso[role=alert]');
const ROTULOS_PERFIL = ['Nome completo', 'Nascimento', 'Gênero', 'Raça', 'Telefone', 'Atua na política', 'Tempo de atuação'];

test.afterEach(() => {
  expect(naoMapeadas()).toEqual([]);
  expect(vazou()).toEqual([]);
});

test.describe('Detalhe da pessoa: conta, perfil e consentimento (USR-02.2 a 02.5)', () => {
  test('mostra nome, e-mail, data de cadastro e último acesso; sem equipe Legisla, sem esse campo (USR-02.2)', async ({ page }) => {
    await abre(page, [JOANA]);
    await expect(page.getByRole('heading', { name: 'Joana Perfil Souza' })).toBeVisible();
    await expect(campo(page, 'Nome')).toHaveText('Joana Perfil Souza');
    await expect(campo(page, 'E-mail')).toHaveText('joana@exemplo.org');
    await expect(campo(page, 'Cadastro')).toHaveText('02/01/2026');
    await expect(campo(page, 'Último acesso')).toHaveText('09/11/2026 10:45');
    await expect(campo(page, 'Equipe Legisla')).toHaveCount(0);
  });

  test('mostra o papel na equipe Legisla quando a pessoa é da equipe; sem login, "Nunca" (USR-02.2)', async ({ page }) => {
    await abre(page, [detalheUsuario({ id: ID, nome: 'Lia Leitura', equipe_papel: 'leitura', ultimo_acesso: null })]);
    await expect(campo(page, 'Equipe Legisla')).toHaveText('leitura');
    await expect(campo(page, 'Último acesso')).toHaveText('Nunca');
  });

  test('com perfil mostra nome completo, nascimento, gênero, raça, telefone, atuação e tempo em texto (USR-02.3)', async ({ page }) => {
    await abre(page, [JOANA]);
    await expect(campo(page, 'Nome completo')).toHaveText('Joana Perfil Souza');
    await expect(campo(page, 'Nascimento')).toHaveText('21/03/1987');
    await expect(campo(page, 'Gênero')).toHaveText('Mulher transgênero');
    await expect(campo(page, 'Raça')).toHaveText('Preta');
    await expect(campo(page, 'Telefone')).toHaveText('(21) 91234-5678');
    await expect(campo(page, 'Atua na política')).toHaveText('Sim');
    await expect(campo(page, 'Tempo de atuação')).toHaveText('6 a 10 anos');
  });

  test('quem não atua na política mostra "Não" e tempo "—" (USR-02.3)', async ({ page }) => {
    await abre(page, [{ ...JOANA, perfil: { ...JOANA.perfil!, atua: false, tempo: null, telefone: '1133334444' } }]);
    await expect(campo(page, 'Atua na política')).toHaveText('Não');
    await expect(campo(page, 'Tempo de atuação')).toHaveText('—');
    await expect(campo(page, 'Telefone')).toHaveText('(11) 3333-4444');
  });

  test('sem perfil mostra "Esta pessoa ainda não preencheu o perfil." no lugar dos campos (USR-02.4)', async ({ page }) => {
    await abre(page, [BRUNO], { rota: `/admin/usuarios/${SEM}` });
    await expect(page.getByText('Esta pessoa ainda não preencheu o perfil.')).toBeVisible();
    for (const r of ROTULOS_PERFIL) await expect(page.locator(`dt:text-is("${r}")`), r).toHaveCount(0);
  });

  test('mostra a versão e a data do consentimento mais recente (USR-02.5)', async ({ page }) => {
    await abre(page, [JOANA]);
    await expect(campo(page, 'Versão')).toHaveText('2026-11');
    await expect(campo(page, 'Data')).toHaveText('09/11/2026');
    await expect(page.getByText('Sem consentimento registrado')).toHaveCount(0);
  });

  test('sem consentimento mostra "Sem consentimento registrado" (USR-02.5)', async ({ page }) => {
    await abre(page, [BRUNO], { rota: `/admin/usuarios/${SEM}` });
    await expect(page.getByText('Sem consentimento registrado')).toBeVisible();
    await expect(campo(page, 'Versão')).toHaveCount(0);
  });
});

test.describe('Detalhe da pessoa: mandatos (USR-02.6, 02.7)', () => {
  test('lista os mandatos com parlamentar, cargo, UF e papel, cada um com link para /admin/mandatos/<id> (USR-02.6)', async ({ page }) => {
    await abre(page, [JOANA]);
    const linhas = page.locator('tbody tr');
    await expect(page.getByRole('columnheader')).toHaveText(['Parlamentar', 'Cargo', 'UF', 'Papel']);
    await expect(linhas.nth(0).locator('td')).toHaveText(['Parlamentar Um', 'Deputada Federal', 'SP', 'Assessoria']);
    await expect(linhas.nth(1).locator('td')).toHaveText(['Parlamentar Dois arquivado', 'Deputado Estadual', 'MG', 'Somente leitura']);
    await expect(page.getByRole('link', { name: 'Parlamentar Um' })).toHaveAttribute('href', `/admin/mandatos/${M1}`);
    await expect(page.getByRole('link', { name: 'Parlamentar Dois' })).toHaveAttribute('href', `/admin/mandatos/${M2}`);
  });

  test('sem mandato mostra "Esta pessoa não está em nenhum mandato." (USR-02.7)', async ({ page }) => {
    await abre(page, [BRUNO], { rota: `/admin/usuarios/${SEM}` });
    await expect(page.getByText('Esta pessoa não está em nenhum mandato.')).toBeVisible();
    await expect(page.locator('table')).toHaveCount(0);
  });
});

test.describe('Detalhe da pessoa: voltar para a lista (USR-02.1, 02.8)', () => {
  test('"← Voltar para Usuários" refaz a lista com a busca, os filtros e a página de de= (USR-02.8)', async ({ page }) => {
    const pedidos: Record<string, unknown>[] = [];
    const de = encodeURIComponent(`q=pessoa&papel=assessoria&mandato=${M1}&sem_perfil=1&pagina=2`);
    const sessenta = Array.from({ length: 60 }, (_, i) => usuario({
      id: `p${i}`, nome: `Pessoa ${i}`, sem_perfil: true, mandatos: [{ id: M1, nome: 'Parlamentar Um', papel: 'assessoria', arquivado: false }],
    }));
    await abre(page, [JOANA], {
      rota: `/admin/usuarios/${ID}?de=${de}`,
      estado: { views: { v_admin_mandatos: [] }, rpc: { admin_usuarios: servidorUsuarios(sessenta, pedidos) } },
    });
    await expect(voltar(page)).toHaveAttribute('href', `/admin/usuarios?q=pessoa&papel=assessoria&mandato=${M1}&sem_perfil=1&pagina=2`);
    await voltar(page).click();
    await expect(page.getByText('26–50 de 60')).toBeVisible();
    await expect(page.getByLabel('Buscar pessoa')).toHaveValue('pessoa');
    expect(pedidos.at(-1)).toEqual({ p_busca: 'pessoa', p_papel: 'assessoria', p_mandato: M1, p_sem_perfil: true, p_limite: 25, p_offset: 25 });
  });

  test('da lista filtrada ao detalhe e de volta: a lista volta igual (USR-02.1, 02.8)', async ({ page }) => {
    const pedidos: Record<string, unknown>[] = [];
    await abre(page, [JOANA], {
      rota: '/admin/usuarios?q=joana',
      estado: { views: { v_admin_mandatos: [] }, rpc: { admin_usuarios: servidorUsuarios([usuario({ id: ID, nome: 'Joana Perfil Souza' }), usuario({ id: SEM, nome: 'Bruno' })], pedidos) } },
    });
    await page.getByRole('link', { name: 'Joana Perfil Souza' }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/usuarios/${ID}\\?de=q%3Djoana$`));
    await expect(campo(page, 'Nome completo')).toHaveText('Joana Perfil Souza');
    await voltar(page).click();
    await expect(page).toHaveURL(/\/admin\/usuarios\?q=joana$/);
    await expect(page.getByLabel('Buscar pessoa')).toHaveValue('joana');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    expect(pedidos.at(-1)).toMatchObject({ p_busca: 'joana' });
  });

  test('sem de= o link volta à lista padrão; de= com valores estranhos só leva busca, filtros e página válidos (USR-02.8)', async ({ page }) => {
    await abre(page, [JOANA]);
    await expect(voltar(page)).toHaveAttribute('href', '/admin/usuarios');
    await page.goto(`/admin/usuarios/${ID}?de=${encodeURIComponent('q=ana&x=javascript:alert(1)&papel=dono&pagina=-3')}`);
    await expect(campo(page, 'Nome')).toHaveText('Joana Perfil Souza');
    await expect(voltar(page)).toHaveAttribute('href', '/admin/usuarios?q=ana');
  });
});

test.describe('Detalhe da pessoa: só leitura, inexistente, erro e rede (USR-02.9 a 02.11)', () => {
  test('nenhum botão altera dado e não há exportação: o único botão é o "Sair" do painel (USR-02.9)', async ({ page }) => {
    await abre(page, [JOANA]);
    await expect(campo(page, 'Nome completo')).toHaveText('Joana Perfil Souza');
    await expect(page.getByRole('button')).toHaveText(['Sair']);
    await expect(page.getByRole('link', { name: /export|baixar|csv|planilha|editar|remover|excluir/i })).toHaveCount(0);
  });

  test('o papel leitura da equipe Legisla vê o mesmo detalhe, também sem botões (USR-02.9)', async ({ page }) => {
    await abre(page, [JOANA], { papel: 'leitura' });
    await expect(campo(page, 'Telefone')).toHaveText('(21) 91234-5678');
    await expect(page.getByRole('button')).toHaveText(['Sair']);
  });

  test('id inexistente mostra "Pessoa não encontrada." e o link para voltar (USR-02.10)', async ({ page }) => {
    await abre(page, [JOANA], { rota: `/admin/usuarios/${INEXISTENTE}` });
    await expect(page.getByText('Pessoa não encontrada.')).toBeVisible();
    await expect(voltar(page)).toHaveAttribute('href', '/admin/usuarios');
    await expect(page.locator('dl')).toHaveCount(0);
  });

  test('id que não é um id válido mostra "Pessoa não encontrada." sem chamar o banco (USR-02.10)', async ({ page }) => {
    await abre(page, [JOANA], { rota: '/admin/usuarios/nao-e-um-id' });
    await expect(page.getByText('Pessoa não encontrada.')).toBeVisible();
    await expect(voltar(page)).toBeVisible();
    expect(await esperaSemRpc(page, 'admin_usuario_detalhe')).toEqual([]);
  });

  test('falha ao carregar mostra a mensagem padrão e "Tentar de novo"; tentar de novo carrega (USR-02.11)', async ({ page }) => {
    let falha = true;
    await abre(page, [], {
      estado: { rpc: { admin_usuario_detalhe: () => (falha ? { status: 500, corpo: { message: 'erro de servidor' } } : { corpo: JOANA }) } },
    });
    await expect(aviso(page)).toHaveText('Não foi possível carregar.');
    await expect(voltar(page)).toBeVisible();
    falha = false;
    await page.getByRole('button', { name: 'Tentar de novo' }).click();
    await expect(campo(page, 'Nome completo')).toHaveText('Joana Perfil Souza');
    await expect(aviso(page)).toHaveCount(0);
  });

  test('enquanto a função não responde, mostra "Carregando…"', async ({ page }) => {
    await semeiaSessao(page, 'admin');
    await moca(page, { rpc: { admin_usuario_detalhe: () => ({ corpo: JOANA }) } });
    const segura = await seguraRpc(page, 'admin_usuario_detalhe');
    await page.goto(`/admin/usuarios/${ID}`);
    await segura.noMeio;
    await expect(page.getByRole('status')).toHaveText('Carregando…');
    segura.libera();
    await expect(campo(page, 'Nome completo')).toHaveText('Joana Perfil Souza');
  });

  test('fora a sessão, a única chamada de rede é admin_usuario_detalhe com o id da pessoa', async ({ page }) => {
    const pedidos: Record<string, unknown>[] = [];
    await abre(page, [JOANA], { pedidos });
    await expect(campo(page, 'Nome completo')).toHaveText('Joana Perfil Souza');
    await esperaSemRpc(page, 'nenhuma');
    const dados = chamadas().filter((c) => !c.caminho.startsWith('auth/') && !c.caminho.startsWith('equipe_legisla'));
    expect(dados.map((c) => `${c.metodo} ${c.caminho}`)).toEqual(['POST rpc/admin_usuario_detalhe']);
    expect(pedidos).toEqual([{ p_user: ID }]);
  });

  test('em 400 px o detalhe é legível, sem rolagem horizontal da página', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await abre(page, [{
      ...JOANA, nome: 'Maria Aparecida de Albuquerque Maranhão Souza',
      email: 'maria.aparecida.de.albuquerque@organizacao-com-dominio-longo.org.br',
    }]);
    await expect(campo(page, 'Nome completo')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(2);
    const l = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, janela: window.innerWidth }));
    expect(l.doc).toBeLessThanOrEqual(l.janela);
  });
});
