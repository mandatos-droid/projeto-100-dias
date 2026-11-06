// Funções security definer do painel admin: search_path fixo e privilégio de execução (migrations 1 a 3), no PGlite.
// Lista as funções reais do catálogo, então uma função nova sem revoke ou sem search_path vazio quebra aqui.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { criaBanco, comoDono } from './sql-ambiente.ts';
import type { Banco } from './sql-ambiente.ts';

let banco: Banco;
before(async () => { banco = await criaBanco(); await comoDono(banco); });
after(async () => { await banco.close(); });

interface Funcao { esquema: string; nome: string; seguranca_definer: boolean; config: string[] | null; anon: boolean; authenticated: boolean; publico: boolean }

// "publico" = PUBLIC tem execute (proacl nulo vale o padrão do Postgres, que dá execute a PUBLIC)
const funcoes = async () => (await banco.query<Funcao>(`
  select n.nspname as esquema, p.proname as nome, p.prosecdef as seguranca_definer, p.proconfig as config,
         has_function_privilege('anon', p.oid, 'execute') as anon,
         has_function_privilege('authenticated', p.oid, 'execute') as authenticated,
         (p.proacl is null or exists (select 1 from aclexplode(p.proacl) a where a.grantee = 0 and a.privilege_type = 'EXECUTE')) as publico
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where (n.nspname = 'public' and p.proname like 'admin\_%') or (n.nspname = 'private' and p.proname = 'audita')
   order by 1, 2`)).rows;

test('o catálogo traz as funções admin_* e private.audita (guarda contra o teste passar vazio)', async () => {
  const f = await funcoes();
  assert.ok(f.some((x) => x.esquema === 'private' && x.nome === 'audita'));
  assert.ok(f.filter((x) => x.esquema === 'public').length >= 10, `só ${f.length} funções`);
});

test('toda função admin_* e private.audita é security definer com search_path vazio (ADM-02)', async () => {
  for (const f of await funcoes()) {
    const nome = `${f.esquema}.${f.nome}`;
    assert.equal(f.seguranca_definer, true, `${nome}: não é security definer`);
    // o PGlite mostra o setting como search_path="" ; aceita as duas grafias
    assert.ok((f.config ?? []).some((c) => /^search_path=("")?$/.test(c)), `${nome}: sem search_path vazio (config=${JSON.stringify(f.config)})`);
  }
});

test('anon e PUBLIC não executam nenhuma delas; authenticated executa as public.admin_* e não executa private.audita (ADM-02.7)', async () => {
  for (const f of await funcoes()) {
    const nome = `${f.esquema}.${f.nome}`;
    assert.equal(f.anon, false, `${nome}: anon executa`);
    assert.equal(f.publico, false, `${nome}: PUBLIC executa`);
    assert.equal(f.authenticated, f.esquema === 'public', `${nome}: authenticated=${f.authenticated}`);
  }
});
