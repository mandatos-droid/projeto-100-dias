import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criaApi, ErroApi } from '../lib/admin/api.ts';

const config = { url: 'https://x.supabase.co', key: 'CHAVE' };

type Chamada = { url: string; init: RequestInit };
async function comFetch<T>(resp: () => Response | Promise<Response>, fn: (chamadas: Chamada[]) => Promise<T>) {
  const antes = globalThis.fetch;
  const chamadas: Chamada[] = [];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    chamadas.push({ url: String(url), init });
    return resp();
  }) as typeof fetch;
  try { return await fn(chamadas); } finally { globalThis.fetch = antes; }
}
const json = (corpo: unknown, status = 200) => () => new Response(JSON.stringify(corpo), { status });

test('ler faz GET em /rest/v1/<caminho> com apikey e Authorization Bearer do usuário (ADM-01)', async () => {
  await comFetch(json([{ id: 1 }]), async (c) => {
    const r = await criaApi(config, 'TOKEN').ler<{ id: number }[]>('v_admin_mandatos?select=id');
    assert.deepEqual(r, [{ id: 1 }]);
    assert.equal(c[0].url, 'https://x.supabase.co/rest/v1/v_admin_mandatos?select=id');
    assert.equal(c[0].init.method ?? 'GET', 'GET');
    const h = c[0].init.headers as Record<string, string>;
    assert.equal(h.apikey, 'CHAVE');
    assert.equal(h.Authorization, 'Bearer TOKEN');
  });
});

test('rpc faz POST em /rest/v1/rpc/<nome> com os argumentos em JSON e os mesmos cabeçalhos (ADM-02)', async () => {
  await comFetch(json({ ok: true }), async (c) => {
    const r = await criaApi(config, 'TOKEN').rpc('admin_equipe_papel', { p_user: 'u1', p_papel: 'leitura' });
    assert.deepEqual(r, { ok: true });
    assert.equal(c[0].url, 'https://x.supabase.co/rest/v1/rpc/admin_equipe_papel');
    assert.equal(c[0].init.method, 'POST');
    assert.deepEqual(JSON.parse(String(c[0].init.body)), { p_user: 'u1', p_papel: 'leitura' });
    const h = c[0].init.headers as Record<string, string>;
    assert.equal(h.apikey, 'CHAVE');
    assert.equal(h.Authorization, 'Bearer TOKEN');
    assert.equal(h['Content-Type'], 'application/json');
  });
});

test('rpc sem argumentos envia objeto vazio', async () => {
  await comFetch(json([]), async (c) => {
    await criaApi(config, 'T').rpc('admin_equipe');
    assert.equal(c[0].init.body, '{}');
  });
});

test('resposta 204 de corpo vazio devolve null, sem quebrar no JSON.parse', async () => {
  await comFetch(() => new Response(null, { status: 204 }), async () => {
    assert.equal(await criaApi(config, 'T').rpc('admin_equipe_remover', { p_user: 'u' }), null);
  });
});

test('401 lança ErroApi com status 401 e a mensagem do corpo', async () => {
  await comFetch(json({ message: 'JWT expired' }, 401), async () => {
    await assert.rejects(criaApi(config, 'T').ler('v_admin_mandatos'), (e: unknown) => {
      assert.ok(e instanceof ErroApi);
      assert.equal(e.status, 401);
      assert.equal(e.mensagem, 'JWT expired');
      return true;
    });
  });
});

test('403 lança ErroApi com o status 403', async () => {
  await comFetch(json({ message: 'Você não tem permissão para esta ação.', code: '42501' }, 403), async () => {
    await assert.rejects(criaApi(config, 'T').rpc('admin_equipe_incluir', {}), (e: unknown) => {
      assert.ok(e instanceof ErroApi);
      assert.equal(e.status, 403);
      assert.equal(e.mensagem, 'Você não tem permissão para esta ação.');
      return true;
    });
  });
});

test('regra do banco (400) traz a mensagem em português exatamente como veio', async () => {
  await comFetch(json({ message: 'A equipe precisa ter ao menos um admin.' }, 400), async () => {
    await assert.rejects(criaApi(config, 'T').rpc('admin_equipe_remover', {}), (e: unknown) => {
      assert.ok(e instanceof ErroApi);
      assert.equal(e.mensagem, 'A equipe precisa ter ao menos um admin.');
      return true;
    });
  });
});

test('500 com corpo que não é JSON lança ErroApi 500 com mensagem vazia', async () => {
  await comFetch(() => new Response('<html>Bad gateway</html>', { status: 502 }), async () => {
    await assert.rejects(criaApi(config, 'T').ler('v_admin_mandatos'), (e: unknown) => {
      assert.ok(e instanceof ErroApi);
      assert.equal(e.status, 502);
      assert.equal(e.mensagem, '');
      return true;
    });
  });
});

test('500 com JSON sem message lança ErroApi 500 com mensagem vazia', async () => {
  await comFetch(json({ foo: 1 }, 500), async () => {
    await assert.rejects(criaApi(config, 'T').ler('x'), (e: unknown) => e instanceof ErroApi && e.status === 500 && e.mensagem === '');
  });
});

test('falha de rede (fetch rejeita) vira ErroApi com status 0', async () => {
  await comFetch(() => { throw new TypeError('Failed to fetch'); }, async () => {
    await assert.rejects(criaApi(config, 'T').ler('x'), (e: unknown) => e instanceof ErroApi && e.status === 0 && e.mensagem === '');
  });
});
