import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page, Route } from '@playwright/test';
import { lerConfig } from '../lib/admin/config.ts';

/* Apoio dos e2e da página do convite (/convite), no padrão de admin-api.ts. A página abre de verdade (nucleo.js real, mesma
   URL do Supabase), mas toda chamada ao Supabase é interceptada aqui: nada sai da máquina. Requisição sem mapa é abortada e
   registrada em `naoMapeadas()`; os specs afirmam que a lista fica vazia. O /guia vira uma página vazia (o Guia legado faria
   chamadas próprias ao banco, fora do escopo destes testes). O registro é do módulo; cada `moca` o zera. */

const CONFIG = lerConfig(readFileSync(join(process.cwd(), 'public/legacy/nucleo.js'), 'utf8'));
const ORIGEM = new URL(CONFIG.url).origin;
/** Chave pública do projeto: é o Bearer de quem ainda não tem sessão. */
export const CHAVE_ANON = CONFIG.key;

/** Token de convite no formato real (22 caracteres base64url). */
export const TOKEN = 'Xk9-2fQa_7LmPq3RsT8uVw';
export const MANDATO_ID = '6f1c2b3a-0000-4000-8000-00000000a001';

export const PREVIA = {
  ok: true, nome: 'Carlos Lima', papel: 'assessoria', convidado_por: 'Mariana Rocha',
  mandato: { nome_parlamentar: 'Ana Souza', cargo: 'Deputada Estadual', uf: 'SP' }, exige_email: false,
};

export interface RespostaRpc { status?: number; corpo?: unknown; rede?: boolean }

export interface EstadoMoca {
  /** Respostas das funções, por nome (POST /rest/v1/rpc/<nome>). `token` é o Bearer recebido. */
  rpc?: Record<string, (args: Record<string, unknown>, token: string) => RespostaRpc>;
}

export interface Chamada { metodo: string; caminho: string; token: string; corpo: unknown }

const registro = { chamadas: [] as Chamada[], naoMapeadas: [] as string[] };

/** Toda chamada que a página fez ao Supabase (REST e auth), na ordem. */
export const chamadas = (): Chamada[] => [...registro.chamadas];
/** Requisições abortadas por não terem mapa (inclui qualquer host externo). Deve ficar vazia. */
export const naoMapeadas = (): string[] => [...registro.naoMapeadas];
/** POSTs a uma função (`rpc/<nome>`). */
export const rpcs = (nome: string): Chamada[] => registro.chamadas.filter((c) => c.metodo === 'POST' && c.caminho === `rpc/${nome}`);

/** Para afirmar AUSÊNCIA de chamada: espera a rede ficar quieta e ao menos `ms`, e só então devolve os POSTs à função. */
export async function esperaSemRpc(page: Page, nome: string, ms = 1200): Promise<Chamada[]> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(ms);
  await page.waitForLoadState('networkidle');
  return rpcs(nome);
}

/** Token de sessão que a mocação aceita: `tok-<quem>` (ou `tok-novo-<quem>`, depois de renovado). */
const tokenDeUsuario = (token: string) => /^tok(-novo)?-[a-z]+$/.test(token);

/** Semeia `legisla.tok` (como o Guia grava) uma vez por aba; recarregar não ressemeia. */
export async function semeiaSessao(page: Page, sessao: { access_token: string; refresh_token?: string } = { access_token: 'tok-carlos', refresh_token: 'ref-carlos' }) {
  await page.addInitScript((s) => {
    if (sessionStorage.getItem('cv-semeado')) return;
    sessionStorage.setItem('cv-semeado', '1');
    localStorage.setItem('legisla.tok', JSON.stringify(s));
  }, sessao);
}

/** Valor guardado no localStorage da página. */
export const localDe = (page: Page, chave: string) => page.evaluate((k) => localStorage.getItem(k), chave);

const PERMITE = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, apikey, content-type, prefer',
  'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

/** Intercepta o Supabase, qualquer host externo e o /guia. Chame antes de `page.goto`. */
export async function moca(page: Page, estado: EstadoMoca = {}) {
  registro.chamadas = []; registro.naoMapeadas = [];

  const responde = (rota: Route, status: number, corpo: unknown) =>
    rota.fulfill({ status, headers: { ...PERMITE, 'content-type': 'application/json' }, body: corpo === undefined ? '' : JSON.stringify(corpo) });

  // host externo qualquer (fontes, analytics...): aborta e registra; o Supabase tem o handler mais específico abaixo
  await page.route((u) => !['localhost', '127.0.0.1'].includes(u.hostname), (rota) => {
    registro.naoMapeadas.push(`${rota.request().method()} ${rota.request().url()}`);
    return rota.abort('blockedbyclient');
  });

  // o Guia: página vazia, só para provar que a navegação chegou lá
  await page.route((u) => ['localhost', '127.0.0.1'].includes(u.hostname) && u.pathname === '/guia', (rota) =>
    rota.fulfill({ status: 200, headers: { 'content-type': 'text/html' }, body: '<!doctype html><title>Guia</title><h1>Guia aberto</h1>' }));

  await page.route((u) => u.origin === ORIGEM, async (rota) => {
    const req = rota.request();
    const u = new URL(req.url());
    if (req.method() === 'OPTIONS') return rota.fulfill({ status: 204, headers: PERMITE });

    const token = (req.headers()['authorization'] ?? '').replace(/^Bearer /, '');
    const caminho = u.pathname.replace(/^\/(rest|auth)\/v1\//, '') + u.search;
    let corpo: unknown = undefined;
    try { corpo = JSON.parse(req.postData() ?? 'null') ?? undefined; } catch { corpo = req.postData(); }
    registro.chamadas.push({ metodo: req.method(), caminho: u.pathname.startsWith('/auth') ? `auth/${caminho}` : caminho, token, corpo });
    const naoMapeada = () => { registro.naoMapeadas.push(`${req.method()} ${u.pathname}${u.search}`); return rota.abort('blockedbyclient'); };

    if (u.pathname.startsWith('/rest/v1/rpc/') && req.method() === 'POST') {
      const nome = u.pathname.replace('/rest/v1/rpc/', '');
      const f = estado.rpc?.[nome];
      if (!f) return naoMapeada();
      // a prévia é a única função liberada a anon; as demais exigem sessão (o PostgREST responde 401 a anon)
      const anonPode = nome === 'convite_previa' && token === CHAVE_ANON;
      if (!anonPode && !tokenDeUsuario(token)) return responde(rota, 401, { message: 'JWT expired' });
      const r = f((corpo ?? {}) as Record<string, unknown>, token);
      if (r.rede) return rota.abort('failed');
      return responde(rota, r.status ?? (r.corpo === undefined ? 204 : 200), r.corpo);
    }
    return naoMapeada();
  });
}
