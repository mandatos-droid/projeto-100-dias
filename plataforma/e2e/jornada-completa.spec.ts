import { test, expect, type Browser, type BrowserContext, type Page, type Route } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { lerConfig } from '../lib/admin/config.ts';

/* Qualidade do preenchimento · Grupo E: a jornada inteira, como uma pessoa nova.
   Carlos entra com o Google, preenche o perfil, cadastra o mandato e convida Dora; Dora aceita (passando pelo próprio
   perfil); Carlos preenche as Missões 1 a 5 e, a cada missão concluída, o Resumo mostra o que foi respondido e o avanço.
   As páginas são as de verdade (/primeiro-acesso, /convite, /guia). O que muda é só o Supabase: um banco em memória,
   com estado, que faz o que o banco faria (versão do mandato, convite, perfil, membros). Dois navegadores (contextos). */

const CONFIG = lerConfig(readFileSync(join(process.cwd(), 'public/legacy/nucleo.js'), 'utf8'));
const ORIGEM = new URL(CONFIG.url).origin;
const PERMITE = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, apikey, content-type, prefer, accept, x-client-info',
  'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};
const local = (u: URL) => ['localhost', '127.0.0.1'].includes(u.hostname);

/* ---------- o banco em memória ---------- */
type Json = Record<string, any>;
interface Usuario { id: string; email: string; nome: string }
const USUARIOS: Record<string, Usuario> = {
  'tok-carlos': { id: 'uid-carlos', email: 'carlos@gabinete.test', nome: 'Carlos Lima' },
  'tok-dora': { id: 'uid-dora', email: 'dora@gabinete.test', nome: 'Dora Menezes' },
};
const tokenDe = (id: string) => Object.entries(USUARIOS).find(([, u]) => u.id === id)![0];
interface Membro { mandato_id: string; user_id: string; nome: string | null; email: string | null; papel: string; criado_em: string }
interface Convite { id: string; token: string; mandato_id: string; nome: string; papel: string; convidado_por: string; usado: boolean; expira_em: string }

const bd = {
  perfis: new Map<string, Json>(),
  consentimentos: new Set<string>(),
  mandatos: [] as Json[],
  membros: [] as Membro[],
  convites: [] as Convite[],
  versao: 0,
  chamadas: [] as { metodo: string; caminho: string; corpo: unknown }[],
  semMapa: [] as string[],
  /** Quem o Google devolve na próxima "Entrar com Google". */
  googleDevolve: 'tok-carlos',
};
const novaVersao = () => new Date(Date.UTC(2027, 0, 1, 0, 0, ++bd.versao)).toISOString();
const tokenDoConvite = (n: number) => `Jk9-2fQa_7LmPq3RsT8u${String(n).padStart(2, '0')}`;
const eq = (u: URL, k: string) => (u.searchParams.get(k) ?? '').replace(/^eq\./, '');
const rpcsFeitas = (nome: string) => bd.chamadas.filter((c) => c.caminho === `/rest/v1/rpc/${nome}`);

/** O que o Guia lê do mandato (e o que ele gravou): o `dados` guardado no banco. */
const dadosDoBanco = () => (bd.mandatos[0]?.dados ?? {}) as Json;
const camposDoBanco = () => (dadosDoBanco().campos ?? {}) as Record<string, string>;

async function atende(rota: Route) {
  const req = rota.request();
  const u = new URL(req.url());
  const metodo = req.method();
  const responde = (status: number, corpo?: unknown) => rota.fulfill({
    status, headers: { ...PERMITE, 'content-type': 'application/json' }, body: corpo === undefined ? '' : JSON.stringify(corpo),
  });
  const semMapa = () => { bd.semMapa.push(`${metodo} ${u.pathname}${u.search}`); return rota.abort('blockedbyclient'); };
  if (metodo === 'OPTIONS') return rota.fulfill({ status: 204, headers: PERMITE });

  let corpo: any;
  try { corpo = JSON.parse(req.postData() ?? 'null') ?? undefined; } catch { corpo = req.postData(); }

  // login com o Google: volta para a página com a sessão no fragmento, como o Supabase faz
  if (u.pathname === '/auth/v1/authorize') {
    const volta = u.searchParams.get('redirect_to') ?? `${new URL(req.frame().url()).origin}/primeiro-acesso`;
    const tok = bd.googleDevolve;
    return rota.fulfill({ status: 302, headers: { location: `${volta}#access_token=${tok}&refresh_token=${tok.replace('tok-', 'ref-')}&token_type=bearer&expires_in=3600` } });
  }
  if (u.pathname === '/auth/v1/token') {
    const ref = String(corpo?.refresh_token ?? '');
    const tok = ref.replace('ref-', 'tok-');
    if (!USUARIOS[tok]) return responde(400, { error: 'invalid_grant' });
    return responde(200, { access_token: tok, refresh_token: ref, token_type: 'bearer', expires_in: 3600 });
  }

  const bearer = (req.headers()['authorization'] ?? '').replace(/^Bearer /, '');
  const eu = USUARIOS[bearer];
  const nome = u.pathname.replace('/rest/v1/', '').replace('rpc/', '');
  if (!eu && !(u.pathname.startsWith('/rest/v1/rpc/') && nome === 'convite_previa')) return semMapa();
  if (u.pathname === '/auth/v1/user') return responde(200, { id: eu!.id, email: eu!.email, user_metadata: { full_name: eu!.nome } });
  if (u.pathname.startsWith('/rest/v1/')) bd.chamadas.push({ metodo, caminho: u.pathname, corpo });

  const unico = (req.headers()['accept'] ?? '').includes('vnd.pgrst.object');
  const lista = (linhas: unknown[]) => (unico ? responde(200, linhas[0] ?? null) : responde(200, linhas));
  const prefere = (req.headers()['prefer'] ?? '');
  const select = u.searchParams.get('select') ?? '*';

  if (metodo === 'GET') {
    if (nome === 'equipe_legisla') return responde(200, []);
    if (nome === 'perfis') {
      const p = bd.perfis.get(eq(u, 'user_id'));
      if (select === 'user_id') return responde(200, p ? [{ user_id: eq(u, 'user_id') }] : []);
      return responde(200, p ? [p] : []);
    }
    if (nome === 'consentimentos') return responde(200, bd.consentimentos.has(eq(u, 'user_id')) ? [{ id: 'cons-1' }] : []);
    if (nome === 'membros') {
      let m = bd.membros;
      if (u.searchParams.has('user_id')) m = m.filter((x) => x.user_id === eq(u, 'user_id'));
      if (u.searchParams.has('mandato_id')) m = m.filter((x) => x.mandato_id === eq(u, 'mandato_id'));
      if (select === 'papel') return responde(200, m.map((x) => ({ papel: x.papel })));
      if (select.startsWith('papel,mandatos')) return responde(200, m.map((x) => ({ papel: x.papel, mandatos: bd.mandatos.find((d) => d.id === x.mandato_id) ?? null })));
      return responde(200, m);
    }
    if (nome === 'mandatos') return lista(bd.mandatos.filter((d) => !u.searchParams.has('id') || d.id === eq(u, 'id')));
    if (nome === 'eventos' || nome === 'eventos_equipe' || nome === 'sugestoes') return responde(200, []);
    return semMapa();
  }

  if (metodo === 'PATCH' && nome === 'mandatos') {
    const d = bd.mandatos.find((x) => x.id === eq(u, 'id'));
    const versao = u.searchParams.get('atualizado_em');
    if (!d || (versao && eq(u, 'atualizado_em') !== d.atualizado_em)) return responde(200, []); // versão velha: nada muda
    Object.assign(d, corpo, { atualizado_em: novaVersao() });
    return prefere.includes('return=representation') ? responde(200, [{ atualizado_em: d.atualizado_em }]) : responde(204);
  }

  if (metodo === 'POST' && nome === 'mandatos') {
    const d = { codigo: 'ABC234', dados: {}, ...corpo, id: `mandato-${bd.mandatos.length + 1}`, atualizado_em: novaVersao() };
    bd.mandatos.push(d);
    return responde(201, [d]);
  }
  if (metodo === 'POST' && nome === 'membros') {
    bd.membros.push({ email: eu!.email, nome: null, criado_em: new Date().toISOString(), ...corpo });
    return responde(201);
  }
  if (metodo === 'POST' && nome === 'consentimentos') { bd.consentimentos.add(eu!.id); return responde(201); }
  if (metodo === 'POST' && ['eventos', 'uso_funcionalidades'].includes(nome)) return responde(201);

  if (metodo === 'POST' && u.pathname.startsWith('/rest/v1/rpc/')) {
    const args = corpo ?? {};
    if (nome === 'perfil_salvar') {
      bd.perfis.set(eu!.id, { nome: args.p_nome, nascimento: args.p_nascimento, genero: args.p_genero, raca: args.p_raca, telefone: args.p_telefone, atua: args.p_atua, tempo: args.p_tempo });
      bd.consentimentos.add(eu!.id);
      return responde(200, { ok: true });
    }
    if (nome === 'mandato_criar') {
      if (!bd.perfis.has(eu!.id)) return responde(400, { message: 'Complete seu perfil antes de criar o mandato.' });
      const d = { codigo: 'ABC234', ...args.p_dados, dados: args.p_dados?.dados ?? {}, id: `mandato-${bd.mandatos.length + 1}`, atualizado_em: novaVersao() };
      bd.mandatos.push(d);
      bd.membros.push({ mandato_id: d.id, user_id: eu!.id, nome: args.p_nome ?? null, email: eu!.email, papel: args.p_papel, criado_em: new Date().toISOString() });
      return responde(200, d);
    }
    if (nome === 'equipe_do_mandato') return responde(200, bd.membros.filter((m) => m.mandato_id === args.p_mandato).map(({ mandato_id: _m, ...p }) => p));
    if (nome === 'convites_pendentes') {
      return responde(200, bd.convites.filter((c) => c.mandato_id === args.p_mandato && !c.usado)
        .map((c) => ({ id: c.id, nome: c.nome, papel: c.papel, convidado_por_nome: c.convidado_por, expira_em: c.expira_em })));
    }
    if (nome === 'convite_criar') {
      const quem = bd.membros.find((m) => m.mandato_id === args.p_mandato && m.user_id === eu!.id);
      if (quem?.papel !== 'coordenacao') return responde(200, { ok: false, erro: 'permissao' });
      const n = bd.convites.length + 1;
      const c: Convite = {
        id: `convite-${n}`, token: tokenDoConvite(n), mandato_id: args.p_mandato, nome: args.p_nome, papel: args.p_papel,
        convidado_por: quem.nome ?? eu!.nome, usado: false, expira_em: '2027-02-18T12:00:00Z',
      };
      bd.convites.push(c);
      return responde(200, { id: c.id, token: c.token, expira_em: c.expira_em });
    }
    if (nome === 'convite_previa') {
      const c = bd.convites.find((x) => x.token === args.p_token && !x.usado);
      if (!c) return responde(200, { ok: false, erro: 'invalido' });
      const d = bd.mandatos.find((x) => x.id === c.mandato_id)!;
      return responde(200, { ok: true, nome: c.nome, papel: c.papel, convidado_por: c.convidado_por, mandato: { nome_parlamentar: d.nome_parlamentar, cargo: d.cargo, uf: d.uf }, exige_email: false });
    }
    if (nome === 'convite_aceitar') {
      const c = bd.convites.find((x) => x.token === args.p_token);
      if (!c) return responde(200, { ok: false, erro: 'invalido' });
      if (!bd.perfis.has(eu!.id)) return responde(200, { ok: false, erro: 'perfil' });
      const ja = bd.membros.some((m) => m.mandato_id === c.mandato_id && m.user_id === eu!.id);
      if (!ja) bd.membros.push({ mandato_id: c.mandato_id, user_id: eu!.id, nome: args.p_nome ?? eu!.nome, email: eu!.email, papel: c.papel, criado_em: new Date().toISOString() });
      c.usado = true;
      return responde(200, { ok: true, mandato_id: c.mandato_id, ja_membro: ja });
    }
  }
  return semMapa();
}

/** Liga o banco em memória a um navegador (contexto). Tudo que não é local nem do Supabase fica bloqueado. */
async function instala(ctx: BrowserContext) {
  await ctx.route((u) => !local(u) && u.origin !== ORIGEM, (rota) => rota.abort('blockedbyclient'));
  await ctx.route((u) => u.origin === ORIGEM, atende);
}

/* ---------- a jornada ---------- */
test.describe.configure({ mode: 'serial', timeout: 180_000 });

let ctxCarlos: BrowserContext;
let ctxDora: BrowserContext;
let carlos: Page;
let linkConvite = '';

test.beforeAll(async ({ browser }: { browser: Browser }) => {
  ctxCarlos = await browser.newContext({ baseURL: 'http://localhost:3000' });
  ctxDora = await browser.newContext({ baseURL: 'http://localhost:3000' });
  await instala(ctxCarlos);
  await instala(ctxDora);
  carlos = await ctxCarlos.newPage();
});
test.afterAll(async () => { await ctxCarlos?.close(); await ctxDora?.close(); });
test.afterEach(() => { expect(bd.semMapa).toEqual([]); });

const CONCORDO = 'Li e concordo com o tratamento dos meus dados pessoais nos termos acima.';
const CONCORDO_SENSIVEIS = 'Concordo, de forma específica, com o tratamento dos meus dados de gênero, raça e data de nascimento para essa finalidade.';

async function preenchePerfil(page: Page, nome: string) {
  await expect(page.getByRole('heading', { name: 'Conte um pouco sobre você' })).toBeVisible();
  await page.getByLabel('Nome completo', { exact: true }).fill(nome);
  await page.getByLabel('Data de nascimento', { exact: true }).fill('1990-05-17');
  await page.getByLabel('Gênero', { exact: true }).selectOption({ label: 'Homem cisgênero' });
  await page.getByLabel('Raça', { exact: true }).selectOption({ label: 'Parda' });
  await page.getByLabel('Telefone com DDD', { exact: true }).fill('(11) 98765-4321');
  await page.getByLabel('Sim', { exact: true }).check();
  await page.getByLabel('Há quanto tempo?', { exact: true }).selectOption({ label: '3 a 5 anos' });
  await page.getByLabel(CONCORDO).check();
  await page.getByLabel(CONCORDO_SENSIVEIS).check();
  await page.getByRole('button', { name: 'Salvar e continuar' }).click();
}

test('1 · Carlos entra com o Google, preenche o perfil e cadastra o mandato', async () => {
  bd.googleDevolve = 'tok-carlos';
  await carlos.goto('/primeiro-acesso');
  await carlos.getByRole('button', { name: 'Entrar com Google', exact: true }).click();
  await preenchePerfil(carlos, 'Carlos Lima');

  // o perfil chegou ao banco, e a pergunta seguinte é a da equipe
  await expect(carlos.getByText('A equipe do seu mandato já criou uma conta?')).toBeVisible();
  expect(rpcsFeitas('perfil_salvar')).toHaveLength(1);
  expect(rpcsFeitas('perfil_salvar')[0].corpo).toMatchObject({
    p_nome: 'Carlos Lima', p_nascimento: '1990-05-17', p_genero: 'homem_cis', p_raca: 'parda', p_telefone: '11987654321', p_atua: true, p_tempo: '3_5',
  });
  await carlos.getByRole('button', { name: 'Ainda não', exact: true }).click();

  // sem equipe: o Guia pede o cadastro do mandato (deputado federal, para a Missão 4 ter as comissões)
  await carlos.waitForURL('**/guia**');
  await expect(carlos.getByText('Vamos cadastrar o mandato')).toBeVisible();
  await carlos.locator('label.cad-pill', { hasText: 'Deputado(a) Federal' }).click();
  await carlos.locator('#cadUf').selectOption('SP');
  await carlos.getByRole('button', { name: 'Não encontrei na lista: preencher manualmente' }).click();
  await carlos.locator('#cadNome').fill('Ana Souza');
  await carlos.getByRole('button', { name: 'Continuar' }).click();
  await carlos.getByLabel('Seu papel no mandato').selectOption({ label: 'Coordenação' });
  await carlos.getByRole('button', { name: 'Criar mandato' }).click();
  await carlos.locator('#ladoNav .it').first().waitFor();

  expect(bd.mandatos).toHaveLength(1);
  expect(bd.mandatos[0]).toMatchObject({ nome_parlamentar: 'Ana Souza', cargo: 'Deputado(a) Federal', uf: 'SP' });
  expect(bd.membros).toMatchObject([{ mandato_id: bd.mandatos[0].id, user_id: 'uid-carlos', papel: 'coordenacao' }]);
});

test('2 · Carlos convida Dora; Dora entra com o Google, completa o perfil e aceita o convite', async () => {
  // Carlos gera o link na aba Equipe
  await carlos.goto('/guia#/config/equipe');
  const painel = carlos.locator('#areaEquipe');
  const formulario = painel.getByRole('form', { name: 'Convidar uma pessoa' });
  await formulario.getByLabel('Nome', { exact: true }).fill('Dora Menezes');
  await formulario.getByLabel('Papel').selectOption({ label: 'Assessoria' });
  await formulario.getByRole('button', { name: 'Gerar link de convite' }).click();
  const link = painel.getByTestId('link-convite');
  await expect(link).toContainText('/convite#');
  linkConvite = ((await link.textContent()) ?? '').trim();
  expect(bd.convites).toHaveLength(1);
  expect(bd.convites[0]).toMatchObject({ nome: 'Dora Menezes', papel: 'assessoria', usado: false });

  // Dora abre o link, sem sessão, e vê o convite
  bd.googleDevolve = 'tok-dora';
  const dora = await ctxDora.newPage();
  await dora.goto(new URL(linkConvite).pathname + new URL(linkConvite).hash);
  await expect(dora.getByRole('heading', { name: /Carlos Lima convidou você/ })).toBeVisible();
  await expect(dora.getByText('Mandato de Ana Souza')).toBeVisible();
  await dora.getByRole('button', { name: 'Entrar com Google', exact: true }).click();

  // sem perfil, o convite manda para o perfil e, ao salvar, volta ao convite e entra no mandato
  await dora.waitForURL('**/primeiro-acesso**');
  await preenchePerfil(dora, 'Dora Menezes');
  await dora.waitForURL('**/guia**');
  await dora.locator('#ladoNav .it').first().waitFor();

  expect(bd.membros.map((m) => [m.user_id, m.papel])).toEqual([['uid-carlos', 'coordenacao'], ['uid-dora', 'assessoria']]);
  expect(bd.convites[0].usado).toBe(true);
  await dora.close();
});

/* ───────── Missões 1 a 5: o preenchimento, com o Resumo conferido a cada missão concluída ───────── */

const FRASE = (k: string) => `Resposta de teste para ${k} com acentuação: ação, coração.`;
const dados = () => dadosDoBanco() as Record<string, unknown> & { campos?: Record<string, string>; feitos?: Record<string, unknown> };
const campos = () => camposDoBanco();

async function entraNoGuia(page: Page, hash: string) {
  await page.goto(`/guia${hash}`);
  await page.locator('#ladoNav .it').first().waitFor();
}

async function escreve(page: Page, k: string, texto: string) {
  const rico = page.locator(`.campo:has(textarea[data-k="${k}"]) .rico-area`);
  if (await rico.count()) {
    await rico.first().click();
    await page.keyboard.type(texto);
  } else {
    await page.locator(`textarea[data-k="${k}"], input[data-k="${k}"]`).first().fill(texto);
  }
  await expect.poll(() => campos()[k] ?? '').toContain(texto);
}

async function recarrega(page: Page) {
  await page.reload();
  await page.locator('#ladoNav .it').first().waitFor();
}

/** Marca o exercício atual como concluído e espera o registro chegar ao banco. */
async function conclui(page: Page, id: string) {
  await page.getByRole('button', { name: /Marcar como concluído/ }).first().click();
  await expect.poll(() => Object.keys(dados().feitos ?? {})).toContain(id);
}

/** Abre o Resumo e devolve o bloco do exercício (já aberto). */
async function noResumo(page: Page, missao: number, titulo: string) {
  await page.goto('/guia#/resumo');
  await page.locator(`#res-m${missao}`).waitFor();
  const m = page.locator(`#res-m${missao}`);
  if (!(await m.evaluate((d) => (d as HTMLDetailsElement).open))) await m.locator('summary').first().click();
  const ex = m.locator('details.ex', { has: page.locator('.ex-link', { hasText: titulo }) });
  if (!(await ex.evaluate((d) => (d as HTMLDetailsElement).open))) await ex.locator('summary').click();
  return ex;
}

/** O Resumo depois de uma missão: o contador da missão e o progresso geral. */
async function confereProgresso(page: Page, missao: number, feitosNaMissao: number, feitosNoTotal: number) {
  await page.goto('/guia#/resumo');
  await page.locator(`#res-m${missao}`).waitFor();
  await expect(page.locator(`#res-m${missao} .m-cont b`).first()).toHaveText(new RegExp(`^${feitosNaMissao}/[0-9]+$`));
  await expect(page.locator('.barra .geral span').first()).toContainText(new RegExp(`^${feitosNoTotal} de [0-9]+ exercícios concluídos`));
}

const EQUIPE_JORNADA = ['Bruno Lima', 'Carla Dias', 'Davi Rocha'];

test('3 · Missão 1: persona, conjuntura, oportunidades e fragilidades gravam, sobrevivem ao recarregar e fecham o Resumo', async () => {
  await entraNoGuia(carlos, '#/m/1/m1.persona');
  await escreve(carlos, 'm1.q1', FRASE('m1.q1'));
  await escreve(carlos, 'm1.q2', FRASE('m1.q2'));
  await conclui(carlos, 'm1.persona');

  await entraNoGuia(carlos, '#/m/1/m1.conjuntura');
  await escreve(carlos, 'm1.q4c', FRASE('m1.q4c'));
  await escreve(carlos, 'm1.q5', FRASE('m1.q5'));
  await conclui(carlos, 'm1.conjuntura');

  await entraNoGuia(carlos, '#/m/1/m1.oportunidades');
  await escreve(carlos, 'm1.q8a', FRASE('m1.q8a'));
  // as 3 agendas prioritárias que a Missão 3 vai usar como bandeiras
  const bts = carlos.locator('.np-prio-bt');
  for (const i of [0, 1, 2]) await bts.nth(i).click();
  await expect.poll(() => ((dados().agendasPrio as string[] | undefined) ?? []).length).toBe(3);
  await conclui(carlos, 'm1.oportunidades');

  await entraNoGuia(carlos, '#/m/1/m1.frag');
  await carlos.locator('.frag-i').nth(0).getByRole('button', { name: 'Gabinete' }).click();
  await carlos.locator('.frag-i').nth(1).getByRole('button', { name: 'Parlamentar' }).click();
  await expect.poll(() => ((dados().frags as { mp?: string }[] | undefined) ?? []).filter((f) => f.mp).length).toBe(2);
  await conclui(carlos, 'm1.frag');

  // tudo sobrevive ao recarregar e o Resumo conta as 4 atividades da Missão 1
  await recarrega(carlos);
  expect(Object.keys(dados().feitos ?? {})).toEqual(expect.arrayContaining(['m1.persona', 'm1.conjuntura', 'm1.oportunidades', 'm1.frag']));
  for (const k of ['m1.q1', 'm1.q2', 'm1.q4c', 'm1.q5', 'm1.q8a']) expect(campos()[k]).toContain(FRASE(k));
  const ex = await noResumo(carlos, 1, 'A persona');
  await expect(ex).toContainText(FRASE('m1.q1'));
  await expect(ex).toHaveAttribute('data-estado', 'ok');
  await confereProgresso(carlos, 1, 4, 4);
});

test('4 · Missão 2: a equipe e o organograma gravam e o Resumo soma 6 exercícios concluídos', async () => {
  await entraNoGuia(carlos, '#/m/2/m2.funcoes');
  await carlos.getByLabel('Registre aqui quantas pessoas o mandato irá contratar').fill('3');
  await carlos.getByRole('button', { name: /Criar tabela|Ajustar/ }).click();
  const celula = (rotulo: string, linha: number) => carlos.getByLabel(`${rotulo}, assessor/a ${linha}`);
  for (const [i, nome] of EQUIPE_JORNADA.entries()) {
    const n = i + 1;
    await celula('Escopo', n).fill(`Escopo da pessoa ${n}`);
    await celula('Competências comportamentais', n).fill(`Competências da pessoa ${n}`);
    await celula('Nome do cargo', n).fill(`Cargo ${n}`);
    await celula('Nome da pessoa', n).fill(nome);
    await celula('Categoria', n).selectOption('Chefia');
    await celula('Área', n).selectOption('Chefia de área');
  }
  await expect.poll(() => campos()['m2.f22']).toBe('Davi Rocha');
  await conclui(carlos, 'm2.funcoes');

  await entraNoGuia(carlos, '#/m/2/m2.gestao');
  const datas = carlos.locator('input[type="date"]');
  for (let i = 0; i < 5; i++) await datas.nth(i).fill(`2030-03-0${i + 1}`);
  for (const k of ['m2.c1', 'm2.c2', 'm2.c3']) await carlos.locator(`input[type="checkbox"][data-k="${k}"]`).check();
  await expect.poll(() => Object.keys(JSON.parse(campos()['m2.rq'] ?? '{}')).length).toBe(5);
  await expect.poll(() => campos()['m2.c3']).toBeTruthy();
  await conclui(carlos, 'm2.gestao');

  await recarrega(carlos);
  expect(campos()['m2.f1']).toBe('Bruno Lima');
  expect(Object.keys(dados().feitos ?? {})).toEqual(expect.arrayContaining(['m2.funcoes', 'm2.gestao']));
  const ex = await noResumo(carlos, 2, 'A equipe de sucesso');
  for (const nome of EQUIPE_JORNADA) await expect(ex).toContainText(nome);
  await expect(ex).toHaveAttribute('data-estado', 'ok');
  await confereProgresso(carlos, 2, 2, 6);
});

test('5 · Missão 3: bandeiras, legado, preditores e metas gravam e o Resumo soma 10 exercícios concluídos', async () => {
  // bandeiras: as agendas prioritárias da Missão 1 viram as opções
  await entraNoGuia(carlos, '#/m/3/m3.bandeiras/1');
  const chips = carlos.locator('.rm-chip');
  await expect(chips.first()).toBeVisible();
  const nome = ((await chips.first().textContent()) ?? '').trim();
  await carlos.getByRole('button', { name: nome, exact: true }).click();
  await carlos.getByLabel(`Argumentos de ${nome}`).fill('Muita demanda nas escolas do território');
  await carlos.getByRole('button', { name: /^Nota 5 em / }).first().click();
  await expect.poll(() => campos()['m3.argumentos'] ?? '').toContain('Muita demanda nas escolas do território');
  await carlos.getByRole('button', { name: new RegExp(`Marcar ${nome} como prioritárias?`) }).click();
  await expect.poll(() => ((dados().rumo as { bandeiras: { rot: string; prioridade: number | null }[] } | undefined)?.bandeiras ?? []).find((b) => b.rot === nome)?.prioridade ?? null).not.toBeNull();
  await entraNoGuia(carlos, '#/m/3/m3.bandeiras/2');
  await conclui(carlos, 'm3.bandeiras');

  // legado
  await entraNoGuia(carlos, '#/m/3/m3.legado/1');
  await carlos.getByRole('textbox', { name: /^Protagonista( Usar .*)?$/ }).fill('Ana Souza');
  await carlos.getByRole('button', { name: 'Continuar' }).click();
  await carlos.getByLabel('Principal entrega').fill('colocou a Educação no centro do debate');
  await carlos.getByRole('button', { name: 'Continuar' }).click();
  await carlos.getByLabel('Resultado verificável').fill('zerou a fila da educação infantil');
  await carlos.getByRole('button', { name: 'Continuar' }).click();
  await carlos.getByRole('radiogroup', { name: 'Cargo em quatro anos' }).getByRole('radio', { name: 'Reeleição a Deputado(a) Federal', exact: true }).click();
  await expect.poll(() => campos()['m3.legado'] ?? '').toContain('zerou a fila da educação infantil');
  await entraNoGuia(carlos, '#/m/3/m3.legado/2');
  await conclui(carlos, 'm3.legado');

  // preditores
  await entraNoGuia(carlos, '#/m/3/m3.preditores/1');
  const card = (pid: string) => carlos.locator(`[data-preditor="${pid}"]`);
  carlos.on('dialog', (dl) => dl.accept());
  for (const pid of ['p1', 'p2', 'p3']) await card(pid).locator('.rm-pred-bt').click();
  for (const pid of ['p1', 'p2', 'p3', 'p4', 'p5']) await card(pid).getByRole('textbox').fill(`Justificativa do ${pid} com acentuação: ação`);
  await carlos.locator('[data-estrategia="b"]').getByRole('radio').check();
  for (const pid of ['p1', 'p2', 'p3']) await carlos.locator(`[data-frase="${pid}"] input`).fill(`Objetivo do ${pid} em outras palavras`);
  await expect.poll(() => campos()['m3.obj.p3'] ?? '').toContain('Objetivo do p3');
  await entraNoGuia(carlos, '#/m/3/m3.preditores/2');
  await conclui(carlos, 'm3.preditores');

  // metas: a equipe da Missão 2 aparece como responsável e apoio
  await entraNoGuia(carlos, '#/m/3/m3.metas/1');
  await carlos.getByRole('button', { name: /^Acrescentar meta a / }).first().click();
  const meta = carlos.locator('[data-meta="0"]');
  await meta.getByRole('textbox', { name: /no formato SMART/ }).fill('Aprovar 2 projetos de lei de educação até dezembro de 2027');
  await meta.getByRole('group', { name: /^Responsável direto/ }).getByRole('button', { name: /Bruno Lima/ }).click();
  await meta.getByRole('group', { name: /^Apoios/ }).getByRole('button', { name: 'Carla Dias' }).click();
  await meta.getByRole('button', { name: 'Adicionar sucesso à meta 01' }).click();
  await meta.getByLabel('Texto do sucesso 1 da meta 01').fill('Protocolar o primeiro projeto');
  await meta.getByLabel('Status do sucesso 1 da meta 01').selectOption('concluida');
  type M = { sucessos?: { status: string }[] };
  await expect.poll(() => ((dados().metas as M[] | undefined) ?? [])[0]?.sucessos?.[0]?.status).toBe('concluida');
  await entraNoGuia(carlos, '#/m/3/m3.metas/2');
  await conclui(carlos, 'm3.metas');

  await recarrega(carlos);
  expect(Object.keys(dados().feitos ?? {})).toEqual(expect.arrayContaining(['m3.bandeiras', 'm3.legado', 'm3.preditores', 'm3.metas']));
  const ex = await noResumo(carlos, 3, 'As metas dos primeiros 100 dias');
  await expect(ex).toContainText('Aprovar 2 projetos de lei de educação até dezembro de 2027');
  await expect(ex).toContainText('Bruno Lima');
  await expect(ex).toHaveAttribute('data-estado', 'ok');
  await confereProgresso(carlos, 3, 4, 10);
});

test('6 · Missão 4: comissões, ações e métricas gravam e o Resumo soma 13 exercícios concluídos', async () => {
  await entraNoGuia(carlos, '#/m/4/m4.comissoes/1');
  await carlos.getByRole('checkbox', { name: 'Escolher Comissão de Saúde' }).check();
  const perg = (campo: 'pq' | 'papel' | 'mov', rot: string) => carlos.locator(`.cp-perg[data-campo="${campo}"]`).getByRole('button', { name: rot, exact: true });
  await perg('pq', 'Pauta da nossa bandeira').click();
  await perg('papel', 'Titular').click();
  await perg('mov', 'Procurar a secretaria da comissão').click();
  await expect.poll(() => ((dados().comissoes as { mov?: string }[] | undefined) ?? [])[0]?.mov).toBe('Procurar a secretaria da comissão');
  await entraNoGuia(carlos, '#/m/4/m4.comissoes/2');
  await conclui(carlos, 'm4.comissoes');

  await entraNoGuia(carlos, '#/m/4/m4.acoes/1');
  await carlos.locator('.cp-acoes > li[data-bingo="articulacao"][data-i="0"]').getByRole('checkbox').check();
  const l = carlos.getByRole('dialog').locator('li[data-bingo="articulacao"][data-i="0"]');
  await l.getByRole('button', { name: 'Detalhar em formato de registro completo' }).click();
  await l.getByLabel('O que queremos alcançar').fill('Ser ouvido nas decisões da Mesa');
  await l.getByLabel('Responsável').fill('Bruno');
  await l.getByLabel('Próximo passo').fill('Ligar para a secretaria');
  await expect.poll(() => ((dados().acoes as { prox?: string }[] | undefined) ?? [])[0]?.prox).toBe('Ligar para a secretaria');
  await carlos.keyboard.press('Escape');
  await entraNoGuia(carlos, '#/m/4/m4.acoes/2');
  await conclui(carlos, 'm4.acoes');

  await entraNoGuia(carlos, '#/m/4/m4.metricas/1');
  const secao = carlos.locator('details[data-secao="k1"]');
  await secao.locator(':scope > summary').click();
  await secao.getByRole('button', { name: /^Registrar/ }).click();
  await secao.getByLabel('Seguidores (total)', { exact: true }).fill('1200');
  await secao.getByLabel('Alcance ou visualizações', { exact: true }).fill('30');
  await secao.getByRole('button', { name: 'Salvar registro' }).click();
  await expect.poll(() => JSON.stringify(dados().comunicacao ?? {})).toContain('1200');
  await entraNoGuia(carlos, '#/m/4/m4.metricas/2');
  await conclui(carlos, 'm4.metricas');

  await recarrega(carlos);
  expect(Object.keys(dados().feitos ?? {})).toEqual(expect.arrayContaining(['m4.comissoes', 'm4.acoes', 'm4.metricas']));
  const ex = await noResumo(carlos, 4, 'A escolha das Comissões Permanentes');
  await expect(ex).toContainText('Comissão de Saúde');
  await expect(ex).toHaveAttribute('data-estado', 'ok');
  await confereProgresso(carlos, 4, 3, 13);
});

test('7 · Missão 5: monitoramento e imersão gravam, o feedback respeita o acesso; o Resumo fecha em 16 exercícios e Dora vê o mesmo progresso', async () => {
  // monitoramento: a meta da Missão 3 aparece e cada mês grava o próprio detalhe
  await entraNoGuia(carlos, '#/m/5/m5.monit/1');
  const mes = (n: number) => carlos.locator(`details[data-mes="${n}"]`);
  for (const [n, texto] of [[1, 'Protocolamos o projeto e ouvimos três escolas'], [3, 'Votação adiada para o mês seguinte']] as const) {
    await mes(n).locator(':scope > summary').click();
    await mes(n).locator('.rico-area').click();
    await carlos.keyboard.type(texto);
    await expect.poll(() => Object.entries(campos()).filter(([k]) => new RegExp(`^mon\..+\.${n}\.det$`).test(k)).map(([, v]) => v).join(' ')).toContain(texto);
  }
  await conclui(carlos, 'm5.monit');

  // feedback: é restrito a parlamentar e chefe de gabinete; a coordenação (Carlos) vê o aviso, não o formulário, e conclui a etapa
  await entraNoGuia(carlos, '#/m/5/m5.feedback/1');
  await expect(carlos.locator('[data-sem-acesso]')).toContainText('Você não tem acesso ao feedback');
  await expect(carlos.locator('[data-lider]')).toHaveCount(0);
  await conclui(carlos, 'm5.feedback');

  // imersão
  await entraNoGuia(carlos, '#/m/5/m5.imersao/1');
  await carlos.getByLabel('Data da imersão de planejamento do quadrimestre').fill('12 e 13 de maio');
  await carlos.getByLabel('Quem deve participar').fill('toda a equipe');
  const itens = carlos.locator('input[type="checkbox"][data-k^="m5.i"]');
  await itens.nth(0).check();
  await itens.nth(2).check();
  await expect.poll(() => campos()['m5.i3']).toBeTruthy();
  await entraNoGuia(carlos, '#/m/5/m5.imersao/2');
  await conclui(carlos, 'm5.imersao');

  await recarrega(carlos);
  expect(Object.keys(dados().feitos ?? {})).toEqual(expect.arrayContaining(['m5.monit', 'm5.feedback', 'm5.imersao']));
  const fb = await noResumo(carlos, 5, 'O primeiro ciclo de feedback estruturado');
  await expect(fb).toHaveAttribute('data-estado', 'ok');
  const im = await noResumo(carlos, 5, 'Calibragem e replanejamento');
  await expect(im).toContainText('12 e 13 de maio');
  await expect(im).toContainText('Itens marcados (2 de 9)');
  await expect(im).toHaveAttribute('data-estado', 'ok');
  const mo = await noResumo(carlos, 5, 'O monitoramento do avanço das metas');
  await expect(mo).toContainText('Protocolamos o projeto e ouvimos três escolas');
  await expect(mo).toContainText('Votação adiada para o mês seguinte');
  await expect(mo).toHaveAttribute('data-estado', 'ok');
  await confereProgresso(carlos, 5, 3, 16);

  // Dora, no navegador dela, lê o mesmo mandato: nada fica preso no aparelho de quem preencheu
  const dora = await ctxDora.newPage();
  await confereProgresso(dora, 5, 3, 16);
  await confereProgresso(dora, 1, 4, 16);
  const tudo = await noResumo(dora, 3, 'As metas dos primeiros 100 dias');
  await expect(tudo).toContainText('Aprovar 2 projetos de lei de educação até dezembro de 2027');
  await dora.close();
});
