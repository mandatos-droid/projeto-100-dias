import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criaApi, ErroApi, lerTudo, TAMANHO_BLOCO } from '../lib/admin/api.ts';

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

// ---- lerTudo: paginação além do teto de 1.000 linhas do PostgREST ----

// Banco falso: devolve a fatia pedida por limit/offset e guarda os caminhos chamados.
function bancoFalso(total: number, falhaNaChamada = 0) {
  const caminhos: string[] = [];
  return {
    caminhos,
    api: {
      async ler<T>(caminho: string): Promise<T> {
        caminhos.push(caminho);
        if (falhaNaChamada && caminhos.length === falhaNaChamada) throw new ErroApi(500, 'erro de servidor');
        const q = new URLSearchParams(caminho.split('?')[1]);
        const limit = Number(q.get('limit'));
        const offset = Number(q.get('offset'));
        const linhas = Array.from({ length: total }, (_, i) => ({ n: i })).slice(offset, offset + limit);
        return linhas as T;
      },
    },
  };
}

test('lerTudo: último bloco menor que o tamanho encerra e junta tudo na ordem (2.300 linhas, 3 chamadas)', async () => {
  const { api, caminhos } = bancoFalso(2300);
  const r = await lerTudo<{ n: number }>(api, 'v_admin_exercicios?select=n&order=n');
  assert.equal(TAMANHO_BLOCO, 1000);
  assert.equal(r.length, 2300);
  assert.deepEqual(r.map((x) => x.n), Array.from({ length: 2300 }, (_, i) => i));
  assert.deepEqual(caminhos, [
    'v_admin_exercicios?select=n&order=n&limit=1000&offset=0',
    'v_admin_exercicios?select=n&order=n&limit=1000&offset=1000',
    'v_admin_exercicios?select=n&order=n&limit=1000&offset=2000',
  ]);
});

test('lerTudo: bloco exatamente igual ao tamanho pede mais um, que vem vazio', async () => {
  const { api, caminhos } = bancoFalso(6);
  const r = await lerTudo<{ n: number }>(api, 'v?order=n', 3);
  assert.equal(r.length, 6);
  assert.equal(caminhos.length, 3);
  assert.match(caminhos[2], /limit=3&offset=6$/);
});

test('lerTudo: erro no meio da paginação propaga o ErroApi e não devolve lista parcial', async () => {
  const { api, caminhos } = bancoFalso(2300, 2);
  await assert.rejects(lerTudo(api, 'v?order=n'), (e: unknown) => e instanceof ErroApi && e.status === 500 && e.mensagem === 'erro de servidor');
  assert.equal(caminhos.length, 2); // parou na falha, sem insistir
});

test('lerTudo: lista vazia faz uma só chamada e devolve []', async () => {
  const { api, caminhos } = bancoFalso(0);
  assert.deepEqual(await lerTudo(api, 'v?order=n'), []);
  assert.equal(caminhos.length, 1);
});

test('lerTudo: caminho sem query ganha "?"; corpo nulo (204) conta como bloco vazio; tamanho inválido é recusado', async () => {
  const { api, caminhos } = bancoFalso(1);
  await lerTudo(api, 'exercicios_guia', 5);
  assert.equal(caminhos[0], 'exercicios_guia?limit=5&offset=0');
  assert.deepEqual(await lerTudo({ ler: async <T,>() => null as T }, 'v?order=n'), []);
  await assert.rejects(lerTudo(api, 'v', 0), RangeError);
});

test('lerTudo com criaApi: manda limit e offset na URL do Supabase e mantém ler como era', async () => {
  await comFetch(json([{ id: 1 }]), async (c) => {
    const r = await lerTudo<{ id: number }>(criaApi(config, 'TOKEN'), 'v_admin_mandatos?select=id&order=id');
    assert.deepEqual(r, [{ id: 1 }]);
    assert.equal(c.length, 1);
    assert.equal(c[0].url, 'https://x.supabase.co/rest/v1/v_admin_mandatos?select=id&order=id&limit=1000&offset=0');
    assert.equal((c[0].init.headers as Record<string, string>).Authorization, 'Bearer TOKEN');
  });
});
