import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { lerConfig } from '../lib/admin/config.ts';

/* Ajustes do Guia legado da feature acesso-equipe-convites (public/legacy/acesso.js). O Guia abre de verdade (/guia, todos
   os scripts, nucleo.js real em modo NUVEM), mas toda chamada ao Supabase é interceptada aqui: nada sai da máquina.
   Requisição sem mapa é abortada e registrada; o afterEach afirma que a lista fica vazia. As fotos do TSE (cartões do
   cadastro) são abortadas à parte. */

const CONFIG = lerConfig(readFileSync(join(process.cwd(), 'public/legacy/nucleo.js'), 'utf8'));
const ORIGEM = new URL(CONFIG.url).origin;
const MANDATO = '6f1c2b3a-0000-4000-8000-00000000a001';
const MANDATO_NOVO = '6f1c2b3a-0000-4000-8000-00000000c003';
/** mandatos.codigo: continua no banco como identificador interno e não pode aparecer em tela (ACE-07.5). */
const CODIGO = 'KJ4TP9';
const CODIGO_DE_CONVITE = /c[oó]digo/i;

type Papel = 'coordenacao' | 'assessoria' | 'leitura';
const LIA = { id: 'uid-lia', nome: 'Lia Torres', email: 'lia@gabinete.test', token: 'tok-lia' };
const LINHA_MANDATO = {
  id: MANDATO, codigo: CODIGO, nome_parlamentar: 'Ana Souza', nome_civil: 'Ana Souza Lima', cargo: 'Deputado(a) Estadual',
  uf: 'SP', casa: 'Assembleia Legislativa do Estado de São Paulo', partido: 'PX', data_posse: '2027-02-01',
};

interface Pedido { metodo: string; caminho: string; corpo: unknown }
const registro = { pedidos: [] as Pedido[], naoMapeadas: [] as string[] };
/** Toda requisição ao banco que não é leitura (POST, PATCH, DELETE), na ordem. */
const gravacoes = () => registro.pedidos.filter((p) => p.metodo !== 'GET');

const PERMITE = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, apikey, content-type, prefer',
  'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

interface Estado {
  /** Papel de Lia no mandato; null = Lia não está em nenhum mandato. */
  papel?: Papel | null;
  /** Sem `legisla.tok`: a tela de entrada (login). */
  semSessao?: boolean;
  dados?: Record<string, unknown>;
}

/** Abre o Guia real em `hash`, com Lia logada (salvo `semSessao`) e o Supabase simulado. */
async function abre(page: Page, hash: string, e: Estado = {}) {
  registro.pedidos = []; registro.naoMapeadas = [];
  const papel = e.papel === undefined ? 'coordenacao' : e.papel;
  const mandatos: Record<string, unknown>[] = papel ? [{ ...LINHA_MANDATO, dados: e.dados ?? {} }] : [];
  const membros: Record<string, unknown>[] = papel
    ? [{ mandato_id: MANDATO, user_id: LIA.id, nome: LIA.nome, papel }, { mandato_id: MANDATO, user_id: 'uid-mariana', nome: 'Mariana Rocha', papel: 'coordenacao' }]
    : [];

  await page.route((u) => !['localhost', '127.0.0.1'].includes(u.hostname) && u.origin !== ORIGEM, (rota) => {
    const url = rota.request().url();
    if (!url.startsWith('https://resultados.tse.jus.br/')) registro.naoMapeadas.push(`${rota.request().method()} ${url}`);
    return rota.abort('blockedbyclient');
  });

  await page.route((u) => u.origin === ORIGEM, async (rota) => {
    const req = rota.request();
    const u = new URL(req.url());
    if (req.method() === 'OPTIONS') return rota.fulfill({ status: 204, headers: PERMITE });
    let corpo: unknown;
    try { corpo = JSON.parse(req.postData() ?? 'null') ?? undefined; } catch { corpo = req.postData(); }
    registro.pedidos.push({ metodo: req.method(), caminho: u.pathname.replace(/^\/(rest|auth)\/v1\//, '') + u.search, corpo });
    const responde = (status: number, c?: unknown) =>
      rota.fulfill({ status, headers: { ...PERMITE, 'content-type': 'application/json' }, body: c === undefined ? '' : JSON.stringify(c) });
    const semMapa = () => { registro.naoMapeadas.push(`${req.method()} ${u.pathname}${u.search}`); return rota.abort('blockedbyclient'); };

    if ((req.headers()['authorization'] ?? '') !== `Bearer ${LIA.token}`) return semMapa();
    if (u.pathname === '/auth/v1/user' && req.method() === 'GET') return responde(200, { id: LIA.id, email: LIA.email, user_metadata: { nome: LIA.nome } });
    if (!u.pathname.startsWith('/rest/v1/')) return semMapa();
    const tabela = u.pathname.replace('/rest/v1/', '');
    const q = (k: string) => u.searchParams.get(k);

    if (req.method() === 'GET') {
      if (tabela === 'membros' && q('select') === 'papel,mandatos(*)' && q('user_id') === `eq.${LIA.id}`)
        return responde(200, membros.filter((m) => m.user_id === LIA.id).map((m) => ({ papel: m.papel, mandatos: mandatos.find((x) => x.id === m.mandato_id) ?? null })));
      if (tabela === 'mandatos' && q('id')) return responde(200, mandatos.filter((x) => q('id') === `eq.${x.id}`));
      if (tabela === 'membros' && q('mandato_id')) return responde(200, membros.filter((m) => q('mandato_id') === `eq.${m.mandato_id}`));
      if (tabela === 'eventos' && q('mandato_id')) return responde(200, []);
      if (tabela === 'equipe_legisla' && q('user_id') === `eq.${LIA.id}`) return responde(200, []);
      if (tabela === 'sugestoes' && q('resolvida') === 'eq.false') return responde(200, []);
      return semMapa();
    }
    // escritas: respondidas como o PostgREST, para os testes afirmarem o que saiu (ou não saiu)
    const dados = (corpo ?? {}) as Record<string, unknown>;
    if (req.method() === 'PATCH' && tabela === 'mandatos' && q('id')) return responde(204);
    if (req.method() === 'POST' && tabela === 'eventos') return responde(201);
    if (req.method() === 'POST' && tabela === 'mandatos') { const novo = { ...dados, id: MANDATO_NOVO }; mandatos.push(novo); return responde(201, [novo]); }
    if (req.method() === 'POST' && tabela === 'membros') { membros.push(dados); return responde(201); }
    return semMapa();
  });

  if (!e.semSessao) {
    await page.addInitScript((t) => {
      if (sessionStorage.getItem('ga-semeado')) return;
      sessionStorage.setItem('ga-semeado', '1');
      localStorage.setItem('legisla.tok', JSON.stringify({ access_token: t, refresh_token: 'ref-lia' }));
    }, LIA.token);
  }
  await page.goto(`/guia${hash}`);
  if (e.semSessao) await page.locator('#entrada').waitFor();
  else if (papel) await page.locator('#ladoNav .it').first().waitFor();
  else await page.getByRole('heading', { name: 'Vamos cadastrar o mandato' }).waitFor();
}

test.afterEach(() => {
  expect(registro.naoMapeadas).toEqual([]);
});

/* ---------- T34: o código de convite sai do Guia (ACE-07) ---------- */
test.describe('Código de convite fora do Guia (ACE-07.2, ACE-07.5)', () => {
  test('a tela de entrada (login) não fala em código de convite', async ({ page }) => {
    await abre(page, '#/', { semSessao: true });
    await expect(page.locator('#avisoModo')).toContainText('Modo nuvem.');
    await expect(page.locator('#avisoModo')).not.toContainText(CODIGO_DE_CONVITE);
  });

  test('quem entra sem mandato vê o cadastro sem o campo, o botão e a mensagem do código', async ({ page }) => {
    await abre(page, '#/', { papel: null });
    await expect(page.locator('.cad-codigo, #inCodigo')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Entrar no mandato' })).toHaveCount(0);
    await expect(page.locator('#tela')).not.toContainText(CODIGO_DE_CONVITE);
    await expect(page.locator('#tela [onclick*="odigo"]')).toHaveCount(0); // Cad.codigo e Telas.usarCodigo
  });

  test('Configurações mostra Equipe e convites como cartão com link para /mandato/equipe, sem o código do mandato', async ({ page }) => {
    await abre(page, '#/config');
    const secao = page.locator('#cadEquipe');
    await expect(secao.getByRole('heading', { name: 'Equipe e convites' })).toBeVisible();
    await expect(secao.getByRole('link', { name: 'Abrir Equipe e convites' })).toHaveAttribute('href', '/mandato/equipe');
    await expect(page.locator('#tela')).not.toContainText(CODIGO_DE_CONVITE);
    await expect(page.locator('#app')).not.toContainText(CODIGO);
    await expect(page.locator('#tela').getByRole('button', { name: /Copiar/ })).toHaveCount(0);
    await expect(page.locator('#tela [onclick*="odigo"]')).toHaveCount(0);
  });

  test('o endereço antigo #/equipe cai em Configurações, no mesmo cartão e sem código', async ({ page }) => {
    await abre(page, '#/equipe');
    await expect(page).toHaveURL(/#\/config$/);
    await expect(page.locator('#cadEquipe').getByRole('link', { name: 'Abrir Equipe e convites' })).toHaveAttribute('href', '/mandato/equipe');
    await expect(page.locator('#tela')).not.toContainText(CODIGO_DE_CONVITE);
  });
});

test('cadastrar um mandato novo pelo Guia inclui a pessoa como coordenacao (ACE-07.3)', async ({ page }) => {
  await abre(page, '#/', { papel: null });
  await page.locator('label.cad-pill', { hasText: 'Deputado(a) Estadual' }).click();
  await page.locator('#cadUf').selectOption('SP');
  await page.getByRole('button', { name: 'Não encontrei na lista: preencher manualmente' }).click();
  await page.locator('#cadNome').fill('Ana Souza');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Criar mandato' }).click();
  await page.locator('#ladoNav .it').first().waitFor();
  const membro = registro.pedidos.filter((p) => p.metodo === 'POST' && p.caminho === 'membros');
  expect(membro).toHaveLength(1);
  expect(membro[0].corpo).toMatchObject({ mandato_id: MANDATO_NOVO, user_id: LIA.id, papel: 'coordenacao' });
});

/* ---------- T35: modo somente leitura (ACE-03.2, ACE-03.3) ---------- */
test.describe('Modo somente leitura no Guia (ACE-03.2, ACE-03.3)', () => {
  const AVISO = 'Você está com acesso somente leitura';
  const editor = (page: Page) => page.locator('#tela .rico-area');

  test('com papel leitura o body ganha so-leitura e aparece o aviso', async ({ page }) => {
    await abre(page, '#/', { papel: 'leitura' });
    await expect(page.locator('body')).toHaveClass(/\bso-leitura\b/);
    await expect(page.getByText(AVISO, { exact: true })).toBeVisible();
  });

  test('no exercício, o campo de resposta e a barra de formatação ficam desabilitados; navegar segue livre', async ({ page }) => {
    await abre(page, '#/m/1/m1.persona', { papel: 'leitura' });
    await page.getByRole('button', { name: 'Avançar' }).click();
    await expect(editor(page)).toHaveAttribute('contenteditable', 'false');
    await expect(page.locator('#tela textarea[data-k="m1.q1"]')).toBeDisabled();
    const barra = page.locator('#tela .rico-barra button');
    expect(await barra.count()).toBeGreaterThan(0);
    for (const b of await barra.all()) await expect(b).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Anterior' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Avançar' })).toBeEnabled();
  });

  test('nas Fragilidades, classificar e "Marcar como concluído" ficam desabilitados; "Próximo exercício" segue livre', async ({ page }) => {
    await abre(page, '#/m/1/m1.frag', { papel: 'leitura' });
    await expect(page.locator('.frag-i').first().getByRole('button', { name: 'Gabinete' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Marcar como concluído' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Próximo exercício ›' })).toBeEnabled();
  });

  test('em Configurações os campos e os botões Salvar alterações, trocar o parlamentar e Excluir cadastro ficam desabilitados', async ({ page }) => {
    await abre(page, '#/config', { papel: 'leitura' });
    await expect(page.locator('#cadNome')).toBeDisabled();
    await expect(page.locator('#cadPosse')).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled();
    // mandato sem dados do TSE abre no preenchimento manual: o botão de trocar o parlamentar (Cad.trocar) é "Voltar para a lista"
    await expect(page.getByRole('button', { name: 'Voltar para a lista' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Excluir cadastro' })).toBeDisabled();
  });

  test('digitar, concluir e salvar como leitura não manda nenhuma gravação nem mostra "Não foi possível salvar"', async ({ page }) => {
    await abre(page, '#/m/1/m1.persona', { papel: 'leitura' });
    await page.getByRole('button', { name: 'Avançar' }).click();
    // o editor fica num <label> cujo controle é o textarea desabilitado: o Playwright segue o label e recusa o clique; a pessoa clica normalmente
    await editor(page).click({ force: true });
    await page.keyboard.type('texto de quem só lê');
    await expect(editor(page)).not.toContainText('texto de quem só lê');
    // mesmo que algum controle escape da trava (ilha, atalho de teclado), o Store não grava
    await page.evaluate(() => {
      const w = window as unknown as { D: { campos: Record<string, string> }; Store: { salvar(): void; atualizar(c: Record<string, string>): Promise<void> }; Guia: { concluir(): void } };
      w.D.campos['m1.q1'] = 'gravado por fora';
      w.Store.salvar();
      void w.Store.atualizar({ partido: 'NOVO' });
      w.Guia.concluir();
    });
    await page.waitForTimeout(1500); // além dos 700 ms de espera do Store.salvar
    expect(gravacoes()).toEqual([]);
    await expect(page.locator('#toast')).not.toContainText('Não foi possível salvar');
  });

  test('com assessoria o campo segue editável, sem aviso, e digitar grava como hoje', async ({ page }) => {
    await abre(page, '#/m/1/m1.persona', { papel: 'assessoria' });
    await expect(page.locator('body')).not.toHaveClass(/\bso-leitura\b/);
    await expect(page.getByText(AVISO)).toHaveCount(0);
    await page.getByRole('button', { name: 'Avançar' }).click();
    await expect(editor(page)).toHaveAttribute('contenteditable', 'true');
    await editor(page).click();
    await page.keyboard.type('resposta da assessoria');
    await expect.poll(() => gravacoes().map((p) => `${p.metodo} ${p.caminho}`)).toContain(`PATCH mandatos?id=eq.${MANDATO}`);
    const patch = gravacoes().find((p) => p.metodo === 'PATCH')!;
    expect((patch.corpo as { dados: { campos: Record<string, string> } }).dados.campos['m1.q1']).toContain('resposta da assessoria');
  });

  test('com coordenacao, Configurações segue editável e sem aviso', async ({ page }) => {
    await abre(page, '#/config', { papel: 'coordenacao' });
    await expect(page.locator('body')).not.toHaveClass(/\bso-leitura\b/);
    await expect(page.getByText(AVISO)).toHaveCount(0);
    await expect(page.locator('#cadNome')).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Salvar alterações' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Excluir cadastro' })).toBeEnabled();
  });

  test('como leitura, "Novo cadastro" segue aberto para cadastrar outro mandato (ACE-07.3)', async ({ page }) => {
    await abre(page, '#/novo', { papel: 'leitura' });
    await expect(page.getByRole('heading', { name: 'Cadastrar outro mandato' })).toBeVisible();
    await expect(page.locator('#cadUf')).toBeEnabled();
    await expect(page.locator('input[name="cadCargo"]').first()).toBeEnabled();
  });
});

/* ---------- T36: aviso de consentimento do Guia (ACE-07.4) ---------- */
test('na tela de entrada, a aba Criar conta mostra o aviso com "link de convite" e nenhuma menção a código (ACE-07.2, ACE-07.4)', async ({ page }) => {
  await abre(page, '#/', { semSessao: true });
  await page.getByRole('button', { name: 'Usar e-mail e senha' }).click();
  await page.getByRole('tab', { name: 'Criar conta' }).click();
  await expect(page.locator('#blocoLgpd')).toBeVisible();
  await expect(page.locator('#blocoLgpd')).toContainText('acessíveis a quem tiver o link de convite dele.');
  await expect(page.locator('#entrada')).not.toContainText(CODIGO_DE_CONVITE);
});
