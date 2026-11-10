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
const VENCIDO = 'tok-lia-vencido';
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
  /** Lia tem linha em `perfis` (padrão: sim); 'falha' = a consulta devolve 500. */
  perfil?: boolean | 'falha';
  /** Lia está em `equipe_legisla` (padrão: não). */
  legisla?: boolean;
  /** Marca legisla.semEquipe no sessionStorage ("Ainda não"). Padrão: presente só para quem não tem mandato, para o cadastro abrir. */
  semEquipe?: boolean;
  /** Não espera a tela do Guia: o teste espera outra coisa (redirecionamento, erro). */
  semEspera?: boolean;
  /** legisla.tok começa com o access_token vencido (o refresh_token vale): o Guia renova pelo refresh_token. */
  vencido?: boolean;
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

    // renovação do Guia (Store.sessao): o access_token vencido é recusado e o refresh_token vale
    if (u.pathname === '/auth/v1/token' && req.method() === 'POST' && u.searchParams.get('grant_type') === 'refresh_token')
      return e.vencido ? responde(200, { access_token: LIA.token, refresh_token: 'ref-lia', user: { id: LIA.id, email: LIA.email } }) : semMapa();
    if (e.vencido && u.pathname === '/auth/v1/user' && (req.headers()['authorization'] ?? '') === `Bearer ${VENCIDO}`) return responde(401, { message: 'invalid JWT' });
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
      if (tabela === 'equipe_legisla' && q('user_id') === `eq.${LIA.id}`) return responde(200, e.legisla ? [{ user_id: LIA.id }] : []);
      if (tabela === 'perfis' && q('user_id') === `eq.${LIA.id}`)
        return e.perfil === 'falha' ? responde(500, { message: 'boom' }) : responde(200, e.perfil === false ? [] : [{ user_id: LIA.id }]);
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

  // /primeiro-acesso é outra página (testada à parte): aqui só prova que o Guia mandou a pessoa para lá
  await page.route((u) => ['localhost', '127.0.0.1'].includes(u.hostname) && u.pathname === '/primeiro-acesso', (rota) =>
    rota.fulfill({ status: 200, headers: { 'content-type': 'text/html' }, body: '<!doctype html><title>perfil</title><h1>Perfil aberto</h1>' }));

  if (!e.semSessao) {
    await page.addInitScript(({ t, semEquipe }) => {
      if (sessionStorage.getItem('ga-semeado')) return;
      sessionStorage.setItem('ga-semeado', '1');
      if (semEquipe) sessionStorage.setItem('legisla.semEquipe', '1');
      localStorage.setItem('legisla.tok', JSON.stringify({ access_token: t, refresh_token: 'ref-lia' }));
    }, { t: e.vencido ? VENCIDO : LIA.token, semEquipe: e.semEquipe ?? papel === null });
  }
  await page.goto(`/guia${hash}`);
  if (e.semEspera) return;
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

/* ---------- T36: aviso de consentimento do Guia (ACE-07.4) e login só com Google (PAG-01, PAG-05) ---------- */
const SO_GOOGLE = async (page: Page) => {
  const entrada = page.locator('#entrada');
  await expect(entrada.getByRole('button', { name: 'Entrar com Google' })).toBeVisible();
  await expect(entrada.locator('input')).toHaveCount(0); // sem e-mail, senha, nome nem a caixa do cadastro
  await expect(entrada.getByRole('tab')).toHaveCount(0);
  await expect(entrada.getByRole('button')).toHaveCount(1); // sem "Entrar", "Usar e-mail e senha" nem abas
  // texto visível (o aviso de LGPD, escondido, diz "Ao criar conta" e não conta como tela de cadastro)
  expect(await entrada.evaluate((el) => (el as HTMLElement).innerText)).not.toMatch(/criar conta|e-mail e senha|senha/i);
};

test.describe('Entrada do Guia só com Google (PAG-01.1, 01.2, 01.4, PAG-05.1, 05.2, 05.3)', () => {
  test('sem sessão, a tela de entrada mostra só "Entrar com Google" e o aviso de LGPD', async ({ page }) => {
    await abre(page, '#/', { semSessao: true });
    await SO_GOOGLE(page);
    await expect(page.locator('#entrada .google-lgpd')).toContainText('tratamento dos dados pessoais (LGPD)');
  });

  test('o link do aviso abre o texto de consentimento com "link de convite" e nenhuma menção a código (ACE-07.2, ACE-07.4)', async ({ page }) => {
    await abre(page, '#/', { semSessao: true });
    await page.locator('#entrada .google-lgpd').getByRole('link', { name: 'tratamento dos dados pessoais (LGPD)' }).click();
    await expect(page.locator('#blocoLgpd')).toBeVisible();
    await expect(page.locator('#blocoLgpd')).toContainText('acessíveis a quem tiver o link de convite dele.');
    await expect(page.locator('#entrada')).not.toContainText(CODIGO_DE_CONVITE);
  });

  test('"Confirme o e-mail enviado e faça login" não aparece na tela de entrada nem no Guia aberto (PAG-05.2)', async ({ page }) => {
    await abre(page, '#/', { semSessao: true });
    await expect(page.locator('body')).not.toContainText(/confirme o e-mail/i);
  });

  test('com sessão, o Guia aberto também não mostra a mensagem de confirmar o e-mail (PAG-05.2)', async ({ page }) => {
    await abre(page, '#/config');
    await expect(page.locator('body')).not.toContainText(/confirme o e-mail/i);
  });

  test('Store.criarConta e Store.entrar recusam com "Entre com o Google." e sem chamada de rede (PAG-05.1)', async ({ page }) => {
    await abre(page, '#/', { semSessao: true });
    const antes = registro.pedidos.length;
    const erros = await page.evaluate(async () => {
      const Store = (window as unknown as { Store: { criarConta(e: string, s: string, n: string): Promise<unknown>; entrar(e: string, s: string): Promise<unknown> } }).Store;
      const pega = (f: () => Promise<unknown>) => f().then(() => null, (e: Error) => e.message);
      return [await pega(() => Store.criarConta('a@b.org', 'segredo123', 'Ana')), await pega(() => Store.entrar('a@b.org', 'segredo123'))];
    });
    expect(erros).toEqual(['Entre com o Google.', 'Entre com o Google.']);
    expect(registro.pedidos.length).toBe(antes);
    expect(registro.pedidos.filter((p) => p.caminho.includes('grant_type=password') || p.caminho.startsWith('signup'))).toEqual([]);
  });

  test('erro do Google na volta mostra "Não foi possível entrar com o Google. Tente de novo." e mantém o botão (PAG-01.4)', async ({ page }) => {
    await abre(page, '#error_description=Acesso+negado+pelo+Google', { semSessao: true });
    await expect(page.locator('#erroEntrada')).toHaveText('Não foi possível entrar com o Google. Tente de novo.');
    await SO_GOOGLE(page);
  });

  test('token vencido: o Guia renova pelo refresh_token, abre sem pedir login e nunca chama senha (PAG-05.3)', async ({ page }) => {
    await abre(page, '#/', { vencido: true });
    const tok = await page.evaluate(() => JSON.parse(localStorage.getItem('legisla.tok') ?? 'null'));
    expect(tok.access_token).toBe(LIA.token);
    const renovacoes = registro.pedidos.filter((p) => p.caminho.startsWith('token?grant_type='));
    expect(renovacoes.map((p) => [p.caminho, p.corpo])).toEqual([['token?grant_type=refresh_token', { refresh_token: 'ref-lia' }]]);
  });
});

/* ---------- primeiro acesso: perfil antes do Guia (PAG-02.1, 02.2, 02.15, 02.16, PAG-04.1, 04.6, 04.7) ---------- */
const lerDe = (tabela: string) => registro.pedidos.findIndex((p) => p.metodo === 'GET' && p.caminho.startsWith(tabela));
const ERRO_PERFIL = 'Não foi possível carregar seus dados. Tente de novo.';

test.describe('Perfil antes do Guia', () => {
  test('sem perfil e fora da equipe Legisla, o Guia abre /primeiro-acesso?volta=guia sem ler os mandatos (PAG-02.1, 02.2)', async ({ page }) => {
    await abre(page, '#/', { perfil: false, semEspera: true });
    await expect(page).toHaveURL(/\/primeiro-acesso\?volta=guia$/);
    expect(lerDe('membros?select=papel')).toBe(-1);
  });

  test('com perfil, o Guia consulta equipe_legisla e perfis antes dos mandatos e abre como hoje (PAG-02.15)', async ({ page }) => {
    await abre(page, '#/');
    expect(new URL(page.url()).pathname).toBe('/guia');
    expect(lerDe('perfis')).toBeGreaterThanOrEqual(0);
    expect(lerDe('perfis')).toBeLessThan(lerDe('membros?select=papel'));
    expect(lerDe('equipe_legisla')).toBeLessThan(lerDe('membros?select=papel'));
  });

  test('quem é da equipe Legisla abre o Guia mesmo sem perfil (PAG-02.16)', async ({ page }) => {
    await abre(page, '#/', { perfil: false, legisla: true });
    expect(new URL(page.url()).pathname).toBe('/guia');
    await expect(page.locator('#ladoNav .it').first()).toBeVisible();
  });

  test('falha na consulta de perfil (500) não manda ao formulário: o Guia fica em /guia com a caixa "Não foi possível carregar seus dados. Tente de novo." e o botão "Tentar de novo"', async ({ page }) => {
    await abre(page, '#/', { perfil: 'falha', semEspera: true });
    await expect(page.locator('#erroPerfil').getByRole('alert')).toHaveText(ERRO_PERFIL);
    await expect(page.getByRole('button', { name: 'Tentar de novo', exact: true })).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(new URL(page.url()).pathname).toBe('/guia');
    expect(lerDe('membros?select=papel')).toBe(-1);
  });

  test('"Tentar de novo" com a consulta de perfil funcionando abre o Guia, sem nenhuma ida a /primeiro-acesso', async ({ page }) => {
    const navegou: string[] = [];
    page.on('framenavigated', (f) => { if (f === page.mainFrame()) navegou.push(new URL(f.url()).pathname); });
    const e: Estado = { perfil: 'falha', semEspera: true };
    await abre(page, '#/', e);
    await expect(page.locator('#erroPerfil').getByRole('alert')).toHaveText(ERRO_PERFIL);
    e.perfil = true; // a próxima consulta responde
    await page.getByRole('button', { name: 'Tentar de novo', exact: true }).click();
    await expect(page.locator('#ladoNav .it').first()).toBeVisible();
    await expect(page.getByText(ERRO_PERFIL)).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe('/guia');
    expect(navegou.filter((p) => p !== '/guia')).toEqual([]);
    expect(registro.pedidos.filter((p) => p.metodo === 'GET' && p.caminho.startsWith('perfis')).length).toBe(2);
  });

  test('com perfil, sem mandato e sem a marca "Ainda não", o Guia abre /primeiro-acesso para a pergunta (PAG-04.1)', async ({ page }) => {
    await abre(page, '#/', { papel: null, semEquipe: false, semEspera: true });
    await expect(page).toHaveURL(/\/primeiro-acesso$/);
  });

  test('com perfil, sem mandato e com a marca "Ainda não", o Guia abre o cadastro do mandato (PAG-04.6)', async ({ page }) => {
    await abre(page, '#/', { papel: null, semEquipe: true });
    await expect(page.getByRole('heading', { name: 'Vamos cadastrar o mandato' })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/guia');
  });
});
