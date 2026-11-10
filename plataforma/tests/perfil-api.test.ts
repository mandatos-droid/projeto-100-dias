import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criaApi, ErroApi } from '../lib/admin/api.ts';
import { perfilSalvar, meuPerfil, ehEquipeLegisla, ERRO_SALVAR } from '../lib/perfil/api.ts';
import type { DadosPerfil } from '../lib/perfil/validacao.ts';

/* Camada de dados do perfil (T6): cada função chama a rpc ou a tabela certa, com os argumentos p_* de
   20261109120000_perfis.sql, e traduz o retorno. O fetch é falso: nada sai da máquina. */

const config = { url: 'https://x.supabase.co', key: 'CHAVE' };
const api = () => criaApi(config, 'TOKEN');
const USER = '00000000-0000-4000-8000-0000000000a4';

type Chamada = { url: string; metodo: string; corpo: unknown };
async function comFetch<T>(resp: () => Response, fn: (chamadas: Chamada[]) => Promise<T>) {
  const antes = globalThis.fetch;
  const chamadas: Chamada[] = [];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    chamadas.push({ url: String(url), metodo: init.method ?? 'GET', corpo: init.body ? JSON.parse(String(init.body)) : undefined });
    return resp();
  }) as typeof fetch;
  try { return await fn(chamadas); } finally { globalThis.fetch = antes; }
}
const json = (corpo: unknown, status = 200) => () => new Response(JSON.stringify(corpo), { status });
const semRede = () => { throw new TypeError('Failed to fetch'); };

const DADOS: DadosPerfil = {
  nome: 'Carlos Lima', nascimento: '1990-05-17', genero: 'homem_cis', raca: 'parda', telefone: '11987654321', atua: true, tempo: '3_5',
};

test('a mensagem de falha ao salvar é o texto literal da spec (PAG-02.13)', () => {
  assert.equal(ERRO_SALVAR, 'Não foi possível salvar. Tente de novo.');
});

// ---------- perfilSalvar ----------

test('perfilSalvar: POST rpc/perfil_salvar com p_nome, p_nascimento, p_genero, p_raca, p_telefone, p_atua e p_tempo e devolve {ok:true} (PAG-02.12)', async () => {
  await comFetch(json({ ok: true }), async (c) => {
    assert.deepEqual(await perfilSalvar(api(), DADOS), { ok: true });
    assert.equal(c.length, 1);
    assert.equal(c[0].url, 'https://x.supabase.co/rest/v1/rpc/perfil_salvar');
    assert.equal(c[0].metodo, 'POST');
    assert.deepEqual(c[0].corpo, {
      p_nome: 'Carlos Lima', p_nascimento: '1990-05-17', p_genero: 'homem_cis', p_raca: 'parda',
      p_telefone: '11987654321', p_atua: true, p_tempo: '3_5',
    });
  });
});

test('perfilSalvar de quem não atua envia p_atua falso e p_tempo nulo: a função do banco exige todos os argumentos (PAG-02.5)', async () => {
  await comFetch(json({ ok: true }), async (c) => {
    await perfilSalvar(api(), { ...DADOS, atua: false, tempo: null });
    assert.deepEqual(c[0].corpo, {
      p_nome: 'Carlos Lima', p_nascimento: '1990-05-17', p_genero: 'homem_cis', p_raca: 'parda',
      p_telefone: '11987654321', p_atua: false, p_tempo: null,
    });
  });
});

test('perfilSalvar traduz a recusa do banco de nome, data e telefone na mensagem da spec, com o campo (PAG-02.9, 02.10, 02.11)', async () => {
  const casos: [string, string][] = [
    ['nome', 'Informe seu nome completo.'],
    ['nascimento', 'Informe uma data de nascimento válida.'],
    ['telefone', 'Informe um telefone com DDD.'],
  ];
  for (const [campo, mensagem] of casos) {
    await comFetch(json({ ok: false, erro: campo }), async () => {
      assert.deepEqual(await perfilSalvar(api(), DADOS), { ok: false, erro: mensagem, campo }, campo);
    });
  }
});

test('perfilSalvar traduz gênero, raça, atuação ou tempo recusados na mensagem de campo vazio, com o campo (PAG-02.8)', async () => {
  for (const campo of ['genero', 'raca', 'atua', 'tempo']) {
    await comFetch(json({ ok: false, erro: campo }), async () => {
      assert.deepEqual(await perfilSalvar(api(), DADOS),
        { ok: false, erro: 'Preencha todos os campos e aceite o tratamento dos dados para continuar.', campo }, campo);
    });
  }
});

test('perfilSalvar: recusa do banco sem campo conhecido vira "Não foi possível salvar. Tente de novo." (PAG-02.13)', async () => {
  for (const corpo of [{ ok: false, erro: 'outro' }, { ok: false }]) {
    await comFetch(json(corpo), async () => {
      assert.deepEqual(await perfilSalvar(api(), DADOS), { ok: false, erro: ERRO_SALVAR }, JSON.stringify(corpo));
    });
  }
});

test('perfilSalvar: falha de rede vira "Não foi possível salvar. Tente de novo." sem lançar (PAG-02.13)', async () => {
  await comFetch(semRede, async () => {
    assert.deepEqual(await perfilSalvar(api(), DADOS), { ok: false, erro: ERRO_SALVAR });
  });
});

test('perfilSalvar: erro 5xx do servidor, inclusive com corpo HTML, vira "Não foi possível salvar. Tente de novo." sem lançar (PAG-02.13)', async () => {
  for (const status of [500, 502, 503]) {
    await comFetch(() => new Response('<html>erro</html>', { status }), async () => {
      assert.deepEqual(await perfilSalvar(api(), DADOS), { ok: false, erro: ERRO_SALVAR }, String(status));
    });
  }
});

test('perfilSalvar: sessão vencida (401) segue como ErroApi 401, para a página renovar a sessão', async () => {
  await comFetch(json({ message: 'JWT expired' }, 401), async () => {
    await assert.rejects(perfilSalvar(api(), DADOS), (e: unknown) => e instanceof ErroApi && e.status === 401);
  });
});

// ---------- meuPerfil ----------

test('meuPerfil: GET perfis?select=user_id&user_id=eq.<id>; uma linha devolve true (PAG-02.15)', async () => {
  await comFetch(json([{ user_id: USER }]), async (c) => {
    assert.equal(await meuPerfil(api(), USER), true);
    assert.equal(c[0].metodo, 'GET');
    assert.equal(c[0].url, `https://x.supabase.co/rest/v1/perfis?select=user_id&user_id=eq.${USER}`);
  });
});

test('meuPerfil: nenhuma linha devolve false (PAG-02.1)', async () => {
  await comFetch(json([]), async () => {
    assert.equal(await meuPerfil(api(), USER), false);
  });
});

test('meuPerfil: erro de consulta (rede, 401, 500) propaga como ErroApi e nunca vira false (PAG-02.15)', async () => {
  for (const [resp, status] of [[semRede, 0], [json({ message: 'JWT expired' }, 401), 401], [json({ message: 'x' }, 500), 500]] as const) {
    await comFetch(resp, async () => {
      await assert.rejects(meuPerfil(api(), USER), (e: unknown) => e instanceof ErroApi && e.status === status, String(status));
    });
  }
});

// ---------- ehEquipeLegisla ----------

test('ehEquipeLegisla: GET equipe_legisla?select=user_id&user_id=eq.<id>; uma linha devolve true e nenhuma devolve false (PAG-02.16)', async () => {
  await comFetch(json([{ user_id: USER }]), async (c) => {
    assert.equal(await ehEquipeLegisla(api(), USER), true);
    assert.equal(c[0].metodo, 'GET');
    assert.equal(c[0].url, `https://x.supabase.co/rest/v1/equipe_legisla?select=user_id&user_id=eq.${USER}`);
  });
  await comFetch(json([]), async () => {
    assert.equal(await ehEquipeLegisla(api(), USER), false);
  });
});

test('ehEquipeLegisla: erro de consulta propaga como ErroApi e nunca vira false (PAG-02.16)', async () => {
  for (const [resp, status] of [[semRede, 0], [json({ message: 'x' }, 500), 500]] as const) {
    await comFetch(resp, async () => {
      await assert.rejects(ehEquipeLegisla(api(), USER), (e: unknown) => e instanceof ErroApi && e.status === status, String(status));
    });
  }
});
