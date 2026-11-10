import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { criaAutenticada } from '../app/mandato/sessaoApi.ts';
import type { Sessao } from '../lib/admin/sessao.ts';

/* Cliente autenticado das ilhas da Área do mandato: um 401 renova a sessão uma vez e repete a chamada. Migrado do caso
   "token vencido com refresh_token válido renova, grava a sessão nova em legisla.tok e segue" de e2e/mandato-casca.spec.ts
   (a casca saiu; este cliente é o mesmo que o ProvedorLegado e o primeiro acesso usam). */

const CFG = { url: 'https://x.supabase.test', key: 'anon' };
const INICIAL: Sessao = { access_token: 'tok-vencido', refresh_token: 'ref-1' };
const original = globalThis.fetch;
afterEach(() => { globalThis.fetch = original; });

interface Chamada { url: string; token: string }
/** fetch simulado: `valido` é o único token aceito; a renovação devolve `renovacao` (ou falha com 400 se for null). */
function simula(valido: string, renovacao: Sessao | null) {
  const chamadas: Chamada[] = [];
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    const token = String((init?.headers as Record<string, string> | undefined)?.Authorization ?? '').replace('Bearer ', '');
    chamadas.push({ url: String(url), token });
    const json = (status: number, corpo: unknown) => new Response(JSON.stringify(corpo), { status, headers: { 'content-type': 'application/json' } });
    if (String(url).includes('/auth/v1/token?grant_type=refresh_token')) return renovacao ? json(200, renovacao) : json(400, { error_description: 'refresh inválido' });
    if (token !== valido) return json(401, { message: 'JWT expired' });
    if (String(url).endsWith('/auth/v1/user')) return json(200, { id: 'uid-1', email: 'a@b.test' });
    return json(200, [{ ok: true }]);
  }) as typeof fetch;
  return chamadas;
}

test('token vencido com refresh_token válido renova, entrega a sessão nova para gravar e repete a chamada com ela', async () => {
  const chamadas = simula('tok-novo', { access_token: 'tok-novo', refresh_token: 'ref-2' });
  const gravadas: Sessao[] = [];
  let perdeu = 0;
  const { api } = criaAutenticada(CFG, INICIAL, { grava: (s) => gravadas.push(s), perdeu: () => { perdeu++; } });
  assert.deepEqual(await api.rpc('equipe_do_mandato', { p_mandato: 'm' }), [{ ok: true }]);
  assert.deepEqual(gravadas, [{ access_token: 'tok-novo', refresh_token: 'ref-2' }]);
  assert.equal(perdeu, 0);
  assert.deepEqual(chamadas.map((c) => c.token), ['tok-vencido', '', 'tok-novo']);
});

test('depois de renovar, as chamadas seguintes já usam o token novo, sem renovar de novo', async () => {
  const chamadas = simula('tok-novo', { access_token: 'tok-novo', refresh_token: 'ref-2' });
  const { api } = criaAutenticada(CFG, INICIAL, { grava: () => {}, perdeu: () => {} });
  await api.ler('perfis?select=user_id');
  await api.ler('perfis?select=user_id');
  assert.equal(chamadas.filter((c) => c.url.includes('grant_type=refresh_token')).length, 1);
  assert.equal(chamadas.at(-1)?.token, 'tok-novo');
});

test('sessão vencida sem renovação avisa que perdeu e devolve o 401 original, sem gravar nada', async () => {
  simula('tok-novo', null);
  const gravadas: Sessao[] = [];
  let perdeu = 0;
  const { api } = criaAutenticada(CFG, INICIAL, { grava: (s) => gravadas.push(s), perdeu: () => { perdeu++; } });
  await assert.rejects(api.ler('perfis?select=user_id'), { status: 401 });
  assert.equal(perdeu, 1);
  assert.deepEqual(gravadas, []);
});

test('sem refresh_token não há renovação: perde a sessão e devolve o 401', async () => {
  const chamadas = simula('tok-novo', { access_token: 'tok-novo' });
  let perdeu = 0;
  const { api } = criaAutenticada(CFG, { access_token: 'tok-vencido' }, { grava: () => {}, perdeu: () => { perdeu++; } });
  await assert.rejects(api.ler('perfis?select=user_id'), { status: 401 });
  assert.equal(perdeu, 1);
  assert.equal(chamadas.some((c) => c.url.includes('grant_type=refresh_token')), false);
});

test('se a chamada repetida com o token renovado ainda dá 401, perde a sessão', async () => {
  simula('outro-token', { access_token: 'tok-novo', refresh_token: 'ref-2' });
  let perdeu = 0;
  const { api } = criaAutenticada(CFG, INICIAL, { grava: () => {}, perdeu: () => { perdeu++; } });
  await assert.rejects(api.ler('perfis?select=user_id'), { status: 401 });
  assert.equal(perdeu, 1);
});

test('erro que não é 401 não renova nem perde a sessão', async () => {
  const chamadas: string[] = [];
  globalThis.fetch = (async (url: string) => {
    chamadas.push(String(url));
    return new Response(JSON.stringify({ message: 'boom' }), { status: 500 });
  }) as typeof fetch;
  let perdeu = 0;
  const { api } = criaAutenticada(CFG, INICIAL, { grava: () => {}, perdeu: () => { perdeu++; } });
  await assert.rejects(api.rpc('convites_pendentes', {}), { status: 500 });
  assert.equal(perdeu, 0);
  assert.equal(chamadas.length, 1);
});

test('usuario() lê quem é a pessoa no GoTrue, também renovando no 401', async () => {
  simula('tok-novo', { access_token: 'tok-novo', refresh_token: 'ref-2' });
  const { usuario } = criaAutenticada(CFG, INICIAL, { grava: () => {}, perdeu: () => {} });
  assert.deepEqual(await usuario(), { id: 'uid-1', email: 'a@b.test' });
});
