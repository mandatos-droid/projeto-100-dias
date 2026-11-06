import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page, Route } from '@playwright/test';
import { lerConfig } from '../lib/admin/config.ts';
import type { LinhaMandato } from '../lib/admin/mandatos.ts';

/* Apoio dos e2e do /admin. O app abre de verdade (nucleo.js real, mesma URL do Supabase), mas toda chamada ao Supabase é
   interceptada aqui: nada sai da máquina. Requisição sem mapa é abortada e registrada em `naoMapeadas()`; os specs afirmam
   que a lista fica vazia. O registro é do módulo (o Playwright roda estes specs em série, e cada `moca` o zera). */

export type Papel = 'admin' | 'leitura';
type Corpo = unknown;
export interface RespostaRpc { status?: number; corpo?: Corpo }

export interface EstadoMoca {
  /** Linhas por view ou tabela (nome antes do "?"), ex.: { v_admin_mandatos: [...] }. */
  views?: Record<string, unknown[]>;
  /** Respostas das funções, por nome (POST /rest/v1/rpc/<nome>). */
  rpc?: Record<string, (args: Record<string, unknown>) => RespostaRpc>;
  /** E-mail e senha aceitos em /auth/v1/token?grant_type=password. */
  senha?: { email: string; senha: string };
  /** O que /auth/v1/token?grant_type=refresh_token responde (padrão: ok). */
  renovacao?: 'ok' | 'falha';
  /** Toda leitura de view responde 401, mesmo com token novo. */
  sempre401?: boolean;
  /** Leituras de view falham sem resposta (rede) enquanto for true; os testes mudam depois para simular a volta. */
  rede?: boolean;
  /** Leituras de view respondem este status de erro (ex.: 500) enquanto definido. */
  statusErro?: number;
}

export interface Chamada { metodo: string; caminho: string; token: string }

const CHAVES_PROIBIDAS = ['dados', 'texto', 'nome_civil', 'resp_telefone'];
const registro = { chamadas: [] as Chamada[], naoMapeadas: [] as string[], vazamentos: [] as string[] };

/** Toda chamada que o app fez ao Supabase (REST e auth), na ordem. */
export const chamadas = (): Chamada[] => [...registro.chamadas];
/** Requisições abortadas por não terem mapa (inclui qualquer host externo). Deve ficar vazia. */
export const naoMapeadas = (): string[] => [...registro.naoMapeadas];
/** Ausência de POST a uma função (`rpc/<nome>`), com a espera de `esperaSemChamadas`. */
export const esperaSemRpc = (page: Page, nome: string, ms = 1200): Promise<Chamada[]> =>
  esperaSemChamadas(page, (c) => c.metodo === 'POST' && c.caminho === `rpc/${nome}`, ms);
/** Chamadas ao banco que tocam mandatos ou eventos (views `v_admin_*`, tabelas e funções de mandato). */
const ehDeMandatos = (c: Chamada) => /v_admin_|^mandatos|^eventos|rpc\/admin_mandato|rpc\/admin_membro/.test(c.caminho);
export const chamadasDeMandatos = (): Chamada[] => registro.chamadas.filter(ehDeMandatos);
/** Ausência de qualquer chamada de mandatos, com a espera de `esperaSemChamadas`. */
export const esperaSemMandatos = (page: Page, ms = 1200): Promise<Chamada[]> => esperaSemChamadas(page, ehDeMandatos, ms);

/** Para afirmar AUSÊNCIA de chamada: espera a rede ficar quieta e ao menos `ms` (pedido atrasado em até ~1 s também aparece)
 *  e só então devolve as chamadas que casam com o filtro. Afirmar ausência logo após um `expect` de tela passa cedo demais. */
export async function esperaSemChamadas(page: Page, filtro: (c: Chamada) => boolean, ms = 1200): Promise<Chamada[]> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(ms);
  await page.waitForLoadState('networkidle');
  return registro.chamadas.filter(filtro);
}

/** Ocorrências das chaves `dados`, `texto`, `nome_civil` e `resp_telefone` em toda resposta entregue ao app, e nos pedidos que as citam. */
export function vazou(): string[] {
  return [...registro.vazamentos];
}

/** Chaves proibidas achadas em `corpo`, percorrendo objetos aninhados e arrays, sem diferenciar maiúsculas de minúsculas.
 *  LIMITE CONHECIDO: a varredura é por NOME de chave; o mesmo conteúdo sob outro nome (ex.: `dados` renomeado para `conteudo`)
 *  não é detectável aqui. A proteção real está em `naoMapeadas()`, na regex de pedido (`pedidoCitaChaves`) e no
 *  `information_schema` do SQL (`sql-admin-leitura.test.ts`), que fixam quais colunas existem e quais o app pede. */
export function chavesProibidasEm(corpo: unknown): string[] {
  const achadas: string[] = [];
  const varre = (c: unknown) => {
    if (Array.isArray(c)) { c.forEach(varre); return; }
    if (c && typeof c === 'object') {
      for (const [k, v] of Object.entries(c)) {
        if (CHAVES_PROIBIDAS.includes(k.toLowerCase())) achadas.push(k);
        varre(v);
      }
    }
  };
  varre(corpo);
  return achadas;
}

/** Chaves proibidas citadas na query string de um pedido (palavra inteira, sem diferenciar maiúsculas). */
export const pedidoCitaChaves = (search: string): string[] =>
  CHAVES_PROIBIDAS.filter((k) => new RegExp(`\\b${k}\\b`, 'i').test(decodeURIComponent(search)));

function varre(corpo: unknown, origem: string) {
  chavesProibidasEm(corpo).forEach((k) => registro.vazamentos.push(`resposta ${origem}: chave ${k}`));
}

const ORIGEM = new URL(lerConfig(readFileSync(join(process.cwd(), 'public/legacy/nucleo.js'), 'utf8')).url).origin;
const PERMITE = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, apikey, content-type, prefer',
  'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

/** Linha de `v_admin_mandatos` com valores padrão; só as colunas reais da view (sem dados, nome civil nem telefone). */
export function mandato(p: Partial<LinhaMandato> & { id: string }): LinhaMandato {
  return {
    codigo: `COD${p.id}`, nome_parlamentar: `Parlamentar ${p.id}`, cargo: 'Deputado(a) Estadual', casa: 'Assembleia Legislativa', uf: 'SP',
    partido: 'ABC', data_posse: '2027-02-01', resp_nome: null, resp_cargo: null, criado_em: '2026-10-01T12:00:00Z',
    arquivado_em: null, membros: 1, ultima_atividade: new Date().toISOString(), exercicios_concluidos: 0, ...p,
  };
}

/** Semeia `legisla.tok` (como o Guia grava) uma vez por aba. O token diz quem a pessoa é para a mocação:
 *  `tok-admin`, `tok-leitura` ou `tok-fora` (conta sem linha em equipe_legisla). `vencido` gera um token que o banco recusa
 *  com 401, mas com refresh_token válido. `semRefresh` tira o refresh_token. */
export async function semeiaSessao(page: Page, papel: Papel | 'fora', opcoes: { vencido?: boolean; semRefresh?: boolean } = {}) {
  const sessao: Record<string, string> = { access_token: `${opcoes.vencido ? 'tok-vencido' : 'tok'}-${papel}` };
  if (!opcoes.semRefresh) sessao.refresh_token = `ref-${papel}`;
  await page.addInitScript((s) => {
    if (sessionStorage.getItem('adm-semeado')) return; // recarregar não ressemeia (ex.: depois de Sair)
    sessionStorage.setItem('adm-semeado', '1');
    localStorage.setItem('legisla.tok', JSON.stringify(s));
  }, sessao);
}

const papelDoToken = (token: string) => (/-(admin|leitura|fora)$/.exec(token)?.[1] ?? 'fora') as Papel | 'fora';
const tokenVale = (token: string) => /^tok(-novo)?-(admin|leitura|fora)$/.test(token);

/** Aplica `order=col.desc,col2` do PostgREST (asc por padrão, nulos por último), para os specs provarem a ordem pedida. Sem `order`, mantém a lista. */
function ordena(linhas: unknown[], order: string | null): unknown[] {
  if (!order) return linhas;
  const chaves = order.split(',').map((t) => { const [col, dir] = t.split('.'); return { col, desc: dir === 'desc' }; });
  const valor = (l: unknown, c: string) => (l as Record<string, unknown>)[c];
  return [...linhas].sort((a, b) => {
    for (const { col, desc } of chaves) {
      const x = valor(a, col), y = valor(b, col);
      if (x === y) continue;
      if (x == null) return 1;
      if (y == null) return -1;
      return (x < y ? -1 : 1) * (desc ? -1 : 1);
    }
    return 0;
  });
}

/** Intercepta o Supabase e qualquer host externo. Chame antes de `page.goto`. */
export async function moca(page: Page, estado: EstadoMoca = {}) {
  registro.chamadas = []; registro.naoMapeadas = []; registro.vazamentos = [];

  const responde = (rota: Route, status: number, corpo: Corpo, origem: string) => {
    varre(corpo, origem);
    return rota.fulfill({ status, headers: { ...PERMITE, 'content-type': 'application/json' }, body: corpo === undefined ? '' : JSON.stringify(corpo) });
  };

  // host externo qualquer (fontes, analytics...): aborta e registra; o Supabase tem o handler mais específico abaixo
  await page.route((u) => !['localhost', '127.0.0.1'].includes(u.hostname), (rota) => {
    registro.naoMapeadas.push(`${rota.request().method()} ${rota.request().url()}`);
    return rota.abort('blockedbyclient');
  });

  await page.route((u) => u.origin === ORIGEM, async (rota) => {
    const req = rota.request();
    const u = new URL(req.url());
    if (req.method() === 'OPTIONS') return rota.fulfill({ status: 204, headers: PERMITE });

    const token = (req.headers()['authorization'] ?? '').replace(/^Bearer /, '');
    const caminho = u.pathname.replace(/^\/(rest|auth)\/v1\//, '') + u.search;
    const alvo = `${req.method()} ${u.pathname}${u.search}`;
    registro.chamadas.push({ metodo: req.method(), caminho: u.pathname.startsWith('/auth') ? `auth/${caminho}` : caminho, token });
    const naoMapeada = () => { registro.naoMapeadas.push(alvo); return rota.abort('blockedbyclient'); };

    // pedido que cita coluna de texto de gabinete conta como vazamento, mesmo que a resposta venha limpa
    if (u.pathname.startsWith('/rest/')) {
      pedidoCitaChaves(u.search).forEach((k) => registro.vazamentos.push(`pedido ${alvo}: coluna ${k}`));
    }

    // ---- auth ----
    if (u.pathname === '/auth/v1/user') {
      if (!tokenVale(token)) return responde(rota, 401, { message: 'invalid JWT' }, alvo);
      const papel = papelDoToken(token);
      return responde(rota, 200, { id: `uid-${papel}`, email: `${papel}@legisla.test` }, alvo);
    }
    if (u.pathname === '/auth/v1/authorize') { // ida ao Google: só registra a chamada (com redirect_to) e devolve uma página vazia
      return rota.fulfill({ status: 200, headers: { ...PERMITE, 'content-type': 'text/html' }, body: '<!doctype html><title>google</title>' });
    }
    if (u.pathname === '/auth/v1/token') {
      const tipo = u.searchParams.get('grant_type');
      const corpo = JSON.parse(req.postData() ?? '{}');
      if (tipo === 'refresh_token') {
        if (estado.renovacao === 'falha') return responde(rota, 400, { error_description: 'Invalid Refresh Token' }, alvo);
        const papel = papelDoToken(String(corpo.refresh_token));
        return responde(rota, 200, { access_token: `tok-novo-${papel}`, refresh_token: `ref-${papel}` }, alvo);
      }
      if (tipo === 'password') {
        if (estado.senha && corpo.email === estado.senha.email && corpo.password === estado.senha.senha) {
          return responde(rota, 200, { access_token: 'tok-admin', refresh_token: 'ref-admin' }, alvo);
        }
        return responde(rota, 400, { error_description: 'Invalid login credentials' }, alvo);
      }
      return naoMapeada();
    }

    // ---- REST ----
    if (u.pathname.startsWith('/rest/v1/rpc/')) {
      const nome = u.pathname.replace('/rest/v1/rpc/', '');
      const f = estado.rpc?.[nome];
      if (!f) return naoMapeada();
      if (!tokenVale(token)) return responde(rota, 401, { message: 'JWT expired' }, alvo);
      const r = f(JSON.parse(req.postData() ?? '{}'));
      return responde(rota, r.status ?? (r.corpo === undefined ? 204 : 200), r.corpo, alvo);
    }
    if (u.pathname.startsWith('/rest/v1/')) {
      const nome = u.pathname.replace('/rest/v1/', '');
      if (nome === 'equipe_legisla') {
        if (!tokenVale(token)) return responde(rota, 401, { message: 'JWT expired' }, alvo);
        const papel = papelDoToken(token);
        return responde(rota, 200, papel === 'fora' ? [] : [{ papel, nome: `Pessoa ${papel}` }], alvo);
      }
      const linhas = estado.views?.[nome];
      if (!linhas) return naoMapeada();
      if (estado.rede) return rota.abort('failed');
      if (estado.sempre401 || !tokenVale(token)) return responde(rota, 401, { message: 'JWT expired' }, alvo);
      if (estado.statusErro) return responde(rota, estado.statusErro, { message: 'erro de servidor' }, alvo);
      // paginação do PostgREST (lerTudo e logs): sem limit/offset devolve a lista inteira, como antes
      const limite = u.searchParams.get('limit');
      const inicio = Number(u.searchParams.get('offset') ?? 0);
      const ordenadas = ordena(linhas, u.searchParams.get('order'));
      return responde(rota, 200, limite === null ? ordenadas : ordenadas.slice(inicio, inicio + Number(limite)), alvo);
    }
    return naoMapeada();
  });
}

/** Segura a resposta de uma função (`rpc/<nome>`) até `libera()`, para os specs olharem a tela com a chamada em curso.
 *  Chame DEPOIS de `moca` (a rota mais nova roda primeiro e repassa à da mocação com `fallback`).
 *  `pedidos()` conta os POSTs que chegaram à função, soltos ou não: a mocação só os registra em `chamadas()` ao serem liberados. */
export async function seguraRpc(page: Page, nome: string) {
  let libera!: () => void;
  const porta = new Promise<void>((r) => { libera = r; });
  let chegou = 0;
  let avisa!: () => void;
  const noMeio = new Promise<void>((r) => { avisa = r; });
  await page.route((u) => u.origin === ORIGEM && u.pathname === `/rest/v1/rpc/${nome}`, async (rota) => {
    if (rota.request().method() !== 'POST') return rota.fallback();
    chegou++; avisa();
    await porta;
    return rota.fallback();
  });
  return { libera, noMeio, pedidos: () => chegou };
}
