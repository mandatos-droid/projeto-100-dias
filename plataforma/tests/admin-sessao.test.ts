import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerSessao, gravaSessao, lerRetornoGoogle, renova, entraComSenha, urlGoogle, CHAVE_SESSAO } from '../lib/admin/sessao.ts';

const config = { url: 'https://x.supabase.co', key: 'CHAVE' };

function storageFalso(inicial: Record<string, string> = {}) {
  const m = new Map(Object.entries(inicial));
  return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } };
}

type Chamada = { url: string; init: RequestInit };
async function comFetch<T>(resposta: { status: number; corpo: unknown }, fn: (chamadas: Chamada[]) => Promise<T>) {
  const antes = globalThis.fetch;
  const chamadas: Chamada[] = [];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    chamadas.push({ url: String(url), init });
    return new Response(JSON.stringify(resposta.corpo), { status: resposta.status });
  }) as typeof fetch;
  try { return await fn(chamadas); } finally { globalThis.fetch = antes; }
}

test('a chave de armazenamento é a do Guia: legisla.tok (ADM-01.4)', () => {
  assert.equal(CHAVE_SESSAO, 'legisla.tok');
});

test('lerSessao devolve null sem sessão, com JSON inválido ou sem access_token', () => {
  assert.equal(lerSessao(storageFalso()), null);
  assert.equal(lerSessao(storageFalso({ 'legisla.tok': '{quebrado' })), null);
  assert.equal(lerSessao(storageFalso({ 'legisla.tok': '{"refresh_token":"r"}' })), null);
  assert.equal(lerSessao(storageFalso({ 'legisla.tok': 'null' })), null);
});

test('lerSessao aproveita a sessão gravada pelo Guia, inclusive a resposta completa do login por senha (ADM-01.4)', () => {
  const guia = JSON.stringify({ access_token: 'a', refresh_token: 'r', expires_in: 3600, user: { id: 'u' } });
  assert.deepEqual(lerSessao(storageFalso({ 'legisla.tok': guia })), { access_token: 'a', refresh_token: 'r' });
});

test('gravaSessao e lerSessao fazem o ciclo completo', () => {
  const st = storageFalso();
  gravaSessao(st, { access_token: 'a', refresh_token: 'r' });
  assert.equal(JSON.parse(st.m.get('legisla.tok')!).access_token, 'a');
  assert.deepEqual(lerSessao(st), { access_token: 'a', refresh_token: 'r' });
});

test('lerRetornoGoogle lê access_token e refresh_token do hash', () => {
  assert.deepEqual(lerRetornoGoogle('#access_token=AT&refresh_token=RT&expires_in=3600'),
    { tipo: 'sessao', sessao: { access_token: 'AT', refresh_token: 'RT' } });
});

test('lerRetornoGoogle sem refresh_token devolve só o access_token', () => {
  assert.deepEqual(lerRetornoGoogle('access_token=AT'), { tipo: 'sessao', sessao: { access_token: 'AT' } });
});

test('lerRetornoGoogle devolve o error_description legível quando o Google recusa', () => {
  assert.deepEqual(lerRetornoGoogle('#error=access_denied&error_description=Acesso+negado+pelo+usu%C3%A1rio'),
    { tipo: 'erro', mensagem: 'Acesso negado pelo usuário' });
});

test('lerRetornoGoogle devolve null sem nenhum dos dois', () => {
  assert.equal(lerRetornoGoogle(''), null);
  assert.equal(lerRetornoGoogle('#outra=coisa'), null);
});

test('renova troca o refresh_token por uma sessão nova', async () => {
  await comFetch({ status: 200, corpo: { access_token: 'novo', refresh_token: 'r2', expires_in: 3600 } }, async (chamadas) => {
    const s = await renova(config, { access_token: 'velho', refresh_token: 'r1' });
    assert.deepEqual(s, { access_token: 'novo', refresh_token: 'r2' });
    assert.equal(chamadas[0].url, 'https://x.supabase.co/auth/v1/token?grant_type=refresh_token');
    assert.equal(chamadas[0].init.method, 'POST');
    assert.deepEqual(JSON.parse(String(chamadas[0].init.body)), { refresh_token: 'r1' });
    assert.equal((chamadas[0].init.headers as Record<string, string>).apikey, 'CHAVE');
  });
});

test('renova falha com a mensagem do servidor quando o refresh_token não vale mais', async () => {
  await comFetch({ status: 400, corpo: { error_description: 'Invalid Refresh Token' } }, async () => {
    await assert.rejects(renova(config, { access_token: 'a', refresh_token: 'r' }), /Invalid Refresh Token/);
  });
});

test('renova sem refresh_token falha sem chamar a rede', async () => {
  await comFetch({ status: 200, corpo: {} }, async (chamadas) => {
    await assert.rejects(renova(config, { access_token: 'a' }));
    assert.equal(chamadas.length, 0);
  });
});

test('entraComSenha envia e-mail e senha e devolve a sessão; erro traz a mensagem do servidor', async () => {
  await comFetch({ status: 200, corpo: { access_token: 'a', refresh_token: 'r', user: {} } }, async (chamadas) => {
    assert.deepEqual(await entraComSenha(config, 'p@legisla.org', 'segredo'), { access_token: 'a', refresh_token: 'r' });
    assert.equal(chamadas[0].url, 'https://x.supabase.co/auth/v1/token?grant_type=password');
    assert.deepEqual(JSON.parse(String(chamadas[0].init.body)), { email: 'p@legisla.org', password: 'segredo' });
  });
  await comFetch({ status: 400, corpo: { error_description: 'Invalid login credentials' } }, async () => {
    await assert.rejects(entraComSenha(config, 'p@legisla.org', 'x'), /Invalid login credentials/);
  });
});

test('urlGoogle monta o authorize com o destino codificado', () => {
  assert.equal(urlGoogle(config, 'https://app.org/admin'),
    'https://x.supabase.co/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Fapp.org%2Fadmin');
});
