import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criaApi, ErroApi } from '../lib/admin/api.ts';
import {
  aceitaConvite, cancelaConvite, catalogoExercicios, convitesPendentes, criaConvite, equipeDoMandato, lerEventosEquipe,
  previaConvite, removeMembro, saiDoMandato, trocaPapel,
} from '../lib/convites/api.ts';

/* Camada de dados do convite (T23): cada função chama a rpc certa, com os argumentos p_* da migration
   20261106120000_convites_equipe.sql, e devolve o que o banco respondeu. O fetch é falso: nada sai da máquina. */

const config = { url: 'https://x.supabase.co', key: 'CHAVE' };
const api = () => criaApi(config, 'TOKEN');

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
const vazio = () => new Response(null, { status: 204 });
const RPC = 'https://x.supabase.co/rest/v1/rpc/';

test('criaConvite: POST rpc/convite_criar com p_mandato, p_nome, p_email, p_papel e devolve id, token e validade (ACE-01.1)', async () => {
  const criado = { id: 'c1', token: 'AbCdEfGhIjKlMnOpQrStUv', expira_em: '2026-11-13T12:00:00Z' };
  await comFetch(json(criado), async (c) => {
    const r = await criaConvite(api(), { mandato: 'm1', nome: 'Carlos Lima', email: 'carlos@gabinete.org', papel: 'assessoria' });
    assert.deepEqual(r, criado);
    assert.equal(c[0].url, `${RPC}convite_criar`);
    assert.equal(c[0].metodo, 'POST');
    assert.deepEqual(c[0].corpo, { p_mandato: 'm1', p_nome: 'Carlos Lima', p_email: 'carlos@gabinete.org', p_papel: 'assessoria' });
  });
});

test('criaConvite sem e-mail envia p_email nulo (e-mail opcional, ACE-01.5); a função do banco exige os quatro argumentos', async () => {
  await comFetch(json({ id: 'c2', token: 'x'.repeat(22), expira_em: '2026-11-13T12:00:00Z' }), async (c) => {
    await criaConvite(api(), { mandato: 'm1', nome: 'Bia', email: '', papel: 'leitura' });
    assert.deepEqual(c[0].corpo, { p_mandato: 'm1', p_nome: 'Bia', p_email: null, p_papel: 'leitura' });
  });
});

test('criaConvite: exceção de regra do banco vira ErroApi com a mensagem da spec (ACE-01.6)', async () => {
  await comFetch(json({ message: 'Você só pode convidar com papel igual ou menor que o seu.' }, 400), async () => {
    await assert.rejects(criaConvite(api(), { mandato: 'm1', nome: 'X', email: '', papel: 'coordenacao' }), (e: unknown) => {
      assert.ok(e instanceof ErroApi);
      assert.equal(e.status, 400);
      assert.equal(e.mensagem, 'Você só pode convidar com papel igual ou menor que o seu.');
      return true;
    });
  });
});

test('previaConvite: POST rpc/convite_previa com p_token e devolve quem convidou, mandato e papel (ACE-02.1)', async () => {
  const previa = {
    ok: true, nome: 'Carlos Lima', papel: 'assessoria', convidado_por: 'Mariana Rocha',
    mandato: { nome_parlamentar: 'Ana Souza', cargo: 'Deputada Estadual', uf: 'SP' }, exige_email: false,
  };
  await comFetch(json(previa), async (c) => {
    const r = await previaConvite(api(), 'AbCdEfGhIjKlMnOpQrStUv');
    assert.deepEqual(r, previa);
    assert.equal(c[0].url, `${RPC}convite_previa`);
    assert.equal(c[0].metodo, 'POST');
    assert.deepEqual(c[0].corpo, { p_token: 'AbCdEfGhIjKlMnOpQrStUv' });
  });
});

test('previaConvite devolve {ok:false, erro} sem lançar, para invalido e limite (ACE-02.10, ACE-02.14)', async () => {
  for (const erro of ['invalido', 'limite'] as const) {
    await comFetch(json({ ok: false, erro }), async () => {
      assert.deepEqual(await previaConvite(api(), 'AbCdEfGhIjKlMnOpQrStUv'), { ok: false, erro });
    });
  }
});

test('previaConvite: erro HTTP (500) vira ErroApi com o status', async () => {
  await comFetch(json({ message: 'erro de servidor' }, 500), async () => {
    await assert.rejects(previaConvite(api(), 'AbCdEfGhIjKlMnOpQrStUv'), (e: unknown) => e instanceof ErroApi && e.status === 500);
  });
});

test('aceitaConvite: POST rpc/convite_aceitar com p_token e p_nome e devolve mandato_id e ja_membro (ACE-02.3, ACE-02.4)', async () => {
  await comFetch(json({ ok: true, mandato_id: 'm1', ja_membro: false }), async (c) => {
    const r = await aceitaConvite(api(), 'AbCdEfGhIjKlMnOpQrStUv', 'Carlos Lima');
    assert.deepEqual(r, { ok: true, mandato_id: 'm1', ja_membro: false });
    assert.equal(c[0].url, `${RPC}convite_aceitar`);
    assert.equal(c[0].metodo, 'POST');
    assert.deepEqual(c[0].corpo, { p_token: 'AbCdEfGhIjKlMnOpQrStUv', p_nome: 'Carlos Lima' });
  });
});

test('aceitaConvite sem nome (quem já tem sessão) envia p_nome nulo; já membro chega como ja_membro true (ACE-02.13)', async () => {
  await comFetch(json({ ok: true, mandato_id: 'm1', ja_membro: true }), async (c) => {
    const r = await aceitaConvite(api(), 'AbCdEfGhIjKlMnOpQrStUv');
    assert.deepEqual(r, { ok: true, mandato_id: 'm1', ja_membro: true });
    assert.deepEqual(c[0].corpo, { p_token: 'AbCdEfGhIjKlMnOpQrStUv', p_nome: null });
  });
});

test('aceitaConvite devolve {ok:false, erro} sem lançar para invalido, email, consentimento e limite (ACE-02.9, 02.10, 02.14)', async () => {
  for (const erro of ['invalido', 'email', 'consentimento', 'limite'] as const) {
    await comFetch(json({ ok: false, erro }), async () => {
      assert.deepEqual(await aceitaConvite(api(), 'AbCdEfGhIjKlMnOpQrStUv'), { ok: false, erro });
    });
  }
});

test('aceitaConvite: sessão vencida (401) vira ErroApi 401, para a página renovar ou pedir login', async () => {
  await comFetch(json({ message: 'JWT expired' }, 401), async () => {
    await assert.rejects(aceitaConvite(api(), 'AbCdEfGhIjKlMnOpQrStUv'), (e: unknown) => {
      assert.ok(e instanceof ErroApi);
      assert.equal(e.status, 401);
      assert.equal(e.mensagem, 'JWT expired');
      return true;
    });
  });
});

test('cancelaConvite: POST rpc/convite_cancelar com p_id; resposta 204 conclui sem valor (ACE-04.3)', async () => {
  await comFetch(vazio, async (c) => {
    assert.equal(await cancelaConvite(api(), 'c1'), undefined);
    assert.equal(c[0].url, `${RPC}convite_cancelar`);
    assert.deepEqual(c[0].corpo, { p_id: 'c1' });
  });
});

test('cancelaConvite: recusa de permissão (403) vira ErroApi 403 (ACE-04.5)', async () => {
  await comFetch(json({ message: 'Você não tem permissão para esta ação.', code: '42501' }, 403), async () => {
    await assert.rejects(cancelaConvite(api(), 'c1'), (e: unknown) => e instanceof ErroApi && e.status === 403);
  });
});

test('convitesPendentes: POST rpc/convites_pendentes com p_mandato e devolve nome, papel, quem convidou e validade (ACE-04.2)', async () => {
  const linhas = [{ id: 'c1', nome: 'Carlos Lima', papel: 'assessoria', convidado_por_nome: 'Mariana Rocha', expira_em: '2026-11-13T12:00:00Z' }];
  await comFetch(json(linhas), async (c) => {
    assert.deepEqual(await convitesPendentes(api(), 'm1'), linhas);
    assert.equal(c[0].url, `${RPC}convites_pendentes`);
    assert.deepEqual(c[0].corpo, { p_mandato: 'm1' });
  });
});

test('equipeDoMandato: POST rpc/equipe_do_mandato com p_mandato e devolve nome, e-mail e papel (ACE-04.6)', async () => {
  const linhas = [{ user_id: 'u1', nome: 'Mariana Rocha', email: 'mari@gabinete.org', papel: 'coordenacao', criado_em: '2026-10-01T12:00:00Z' }];
  await comFetch(json(linhas), async (c) => {
    assert.deepEqual(await equipeDoMandato(api(), 'm1'), linhas);
    assert.equal(c[0].url, `${RPC}equipe_do_mandato`);
    assert.deepEqual(c[0].corpo, { p_mandato: 'm1' });
  });
});

test('trocaPapel: POST rpc/membro_trocar_papel com p_mandato, p_user, p_papel (ACE-03.4)', async () => {
  await comFetch(vazio, async (c) => {
    assert.equal(await trocaPapel(api(), 'm1', 'u2', 'leitura'), undefined);
    assert.equal(c[0].url, `${RPC}membro_trocar_papel`);
    assert.deepEqual(c[0].corpo, { p_mandato: 'm1', p_user: 'u2', p_papel: 'leitura' });
  });
});

test('trocaPapel: última coordenação recusada pelo banco chega como ErroApi com a mensagem da spec (ACE-03.7)', async () => {
  await comFetch(json({ message: 'O mandato precisa ter ao menos uma pessoa na coordenação.' }, 400), async () => {
    await assert.rejects(trocaPapel(api(), 'm1', 'u1', 'assessoria'), (e: unknown) =>
      e instanceof ErroApi && e.mensagem === 'O mandato precisa ter ao menos uma pessoa na coordenação.');
  });
});

test('removeMembro: POST rpc/membro_remover com p_mandato e p_user (ACE-03.5)', async () => {
  await comFetch(vazio, async (c) => {
    assert.equal(await removeMembro(api(), 'm1', 'u2'), undefined);
    assert.equal(c[0].url, `${RPC}membro_remover`);
    assert.deepEqual(c[0].corpo, { p_mandato: 'm1', p_user: 'u2' });
  });
});

test('saiDoMandato: POST rpc/membro_sair só com p_mandato (ACE-03.9)', async () => {
  await comFetch(vazio, async (c) => {
    assert.equal(await saiDoMandato(api(), 'm1'), undefined);
    assert.equal(c[0].url, `${RPC}membro_sair`);
    assert.deepEqual(c[0].corpo, { p_mandato: 'm1' });
  });
});

test('catalogoExercicios: POST rpc/catalogo_exercicios sem argumentos e devolve id, missão, ordem e título (ACE-05.3)', async () => {
  const linhas = [{ id: 'm1e1', missao: 1, ordem: 1, titulo: 'Diagnóstico' }];
  await comFetch(json(linhas), async (c) => {
    assert.deepEqual(await catalogoExercicios(api()), linhas);
    assert.equal(c[0].url, `${RPC}catalogo_exercicios`);
    assert.deepEqual(c[0].corpo, {});
  });
});

test('listas com corpo vazio devolvem [] (pendentes, equipe, catálogo e eventos)', async () => {
  await comFetch(vazio, async () => {
    assert.deepEqual(await convitesPendentes(api(), 'm1'), []);
    assert.deepEqual(await equipeDoMandato(api(), 'm1'), []);
    assert.deepEqual(await catalogoExercicios(api()), []);
    assert.deepEqual(await lerEventosEquipe(api(), 'm1'), []);
  });
});

test('lerEventosEquipe: GET eventos_equipe do mandato, do mais recente para o mais antigo, limite 10 (ACE-05.5)', async () => {
  const linhas = [{ id: 9, criado_em: '2026-11-06T12:00:00Z', ator_nome: 'Mariana Rocha', tipo: 'convite_criado', alvo_nome: 'Carlos Lima', papel: 'assessoria' }];
  await comFetch(json(linhas), async (c) => {
    assert.deepEqual(await lerEventosEquipe(api(), 'm1'), linhas);
    assert.equal(c[0].metodo, 'GET');
    const u = new URL(c[0].url);
    assert.equal(u.pathname, '/rest/v1/eventos_equipe');
    assert.equal(u.searchParams.get('mandato_id'), 'eq.m1');
    assert.equal(u.searchParams.get('order'), 'criado_em.desc,id.desc');
    assert.equal(u.searchParams.get('limit'), '10');
    assert.deepEqual(u.searchParams.get('select')?.split(',').sort(), ['alvo_nome', 'ator_nome', 'criado_em', 'id', 'papel', 'tipo']);
  });
});
