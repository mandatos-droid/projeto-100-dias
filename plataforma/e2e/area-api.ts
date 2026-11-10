import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page, Route } from '@playwright/test';
import { lerConfig } from '../lib/admin/config.ts';

/* Apoio dos e2e da Área do mandato (#/config do Guia). O Guia abre de verdade (/guia, todos os scripts, nucleo.js real em
   modo NUVEM) com Lia logada, e toda chamada ao Supabase é respondida aqui, a partir de uma nuvem em memória (mandatos,
   membros, convites, eventos da equipe): nada sai da máquina. Requisição sem mapa é abortada e registrada em
   `naoMapeadas()`; os specs afirmam que a lista fica vazia. As fotos do TSE são abortadas à parte (`fotos()`).
   `estado` é lido a cada requisição: o teste pode trocar uma falha por sucesso no meio do caminho. */

const CONFIG = lerConfig(readFileSync(join(process.cwd(), 'public/legacy/nucleo.js'), 'utf8'));
const ORIGEM = new URL(CONFIG.url).origin;

export type Papel = 'coordenacao' | 'assessoria' | 'leitura';
export const MANDATO_A = '6f1c2b3a-0000-4000-8000-00000000a001';
export const MANDATO_B = '6f1c2b3a-0000-4000-8000-00000000b002';
export const LIA = { id: 'uid-lia', nome: 'Lia Torres', email: 'lia@gabinete.test', token: 'tok-lia', refresh: 'ref-lia' };
export const MARIANA = { id: 'uid-mariana', nome: 'Mariana Rocha', email: 'mariana@gabinete.test' };

export interface LinhaMandato {
  id: string; codigo?: string; nome_parlamentar: string | null; nome_civil?: string | null; cargo: string | null; uf: string | null;
  casa?: string | null; partido: string | null; data_posse: string | null; dados?: Record<string, unknown>;
  resp_nome?: string | null; resp_telefone?: string | null;
}
export const ANA: LinhaMandato = {
  id: MANDATO_A, codigo: 'KJ4TP9', nome_parlamentar: 'Ana Souza', nome_civil: 'Ana Souza Lima', cargo: 'Deputado(a) Estadual', uf: 'SP',
  casa: 'Assembleia Legislativa do Estado de São Paulo', partido: 'Partido Exemplo', data_posse: '2027-02-01', dados: {},
};
export const BRUNO: LinhaMandato = {
  id: MANDATO_B, codigo: 'MN7QR2', nome_parlamentar: 'Bruno Alves', nome_civil: 'Bruno Alves Costa', cargo: 'Vereador(a)', uf: 'MG',
  casa: 'Câmara Municipal', partido: 'Outro Partido', data_posse: '2027-01-01', dados: {},
};

/** Linha de `membros` (o que Store.abrir lê; equipe_do_mandato devolve o mesmo, com e-mail). */
export interface Membro { mandato_id: string; user_id: string; nome: string | null; email: string | null; papel: Papel; criado_em: string }
export const membro = (mandato_id: string, user_id: string, nome: string | null, papel: Papel, email: string | null = null): Membro =>
  ({ mandato_id, user_id, nome, email, papel, criado_em: '2027-02-01T12:00:00Z' });

/** Convite pendente (o que convites_pendentes devolve, mais o mandato). */
export interface Convite { id: string; mandato_id: string; nome: string; papel: Papel; convidado_por_nome: string | null; expira_em: string }
export const convite = (id: string, nome: string, papel: Papel = 'assessoria', mandato_id = MANDATO_A): Convite =>
  ({ id, mandato_id, nome, papel, convidado_por_nome: MARIANA.nome, expira_em: '2027-02-18T12:00:00Z' });

/** Evento do histórico da equipe (colunas de lerEventosEquipe, mais o mandato). */
export interface Evento { id: number; mandato_id: string; criado_em: string; ator_nome: string | null; tipo: string; alvo_nome: string | null; papel: string | null }
export const evento = (id: number, tipo: string, ator_nome: string | null, alvo_nome: string | null, papel: string | null, mandato_id = MANDATO_A, criado_em = '2027-02-12T13:42:00Z'): Evento =>
  ({ id, mandato_id, criado_em, ator_nome, tipo, alvo_nome, papel });

export interface Nuvem { mandatos: LinhaMandato[]; membros: Membro[]; convites: Convite[]; eventos: Evento[] }

/** Token (22 caracteres base64url) e validade do n-ésimo convite criado na nuvem em memória. */
export const tokenDoConvite = (n: number) => `Xk9-2fQa_7LmPq3RsT8u${String(n).padStart(2, '0')}`;
export const EXPIRA_NOVO = '2027-02-19T12:00:00Z';
let criados = 0;

export type Falha = 'rede' | 'servidor';
export interface RespostaRpc { status?: number; corpo?: unknown; rede?: boolean }

export interface EstadoArea {
  /** Papel de Lia no mandato A (padrão: coordenacao). */
  papel?: Papel;
  /** Campos do mandato A que mudam em relação a ANA. */
  mandato?: Partial<LinhaMandato>;
  /** Outros mandatos de Lia, com o papel dela em cada um. */
  outros?: { mandato: LinhaMandato; papel: Papel }[];
  /** Pessoas além de Lia no mandato A (padrão: Mariana, coordenacao). */
  equipe?: Membro[];
  convites?: Convite[];
  eventos?: Evento[];
  /** Falha de leitura por chave: `rpc/<nome>` ou a tabela lida por GET (ex.: 'rpc/equipe_do_mandato', 'eventos_equipe'). */
  falha?: Record<string, Falha | undefined>;
  /** Linhas de membros que Store.abrir lê sem Lia (o papel dela não chega ao Guia). */
  semLiaNosMembros?: boolean;
  /** Funções extras (POST /rest/v1/rpc/<nome>). Recebe os argumentos e a nuvem, que pode alterar. */
  rpc?: Record<string, (args: Record<string, unknown>, nuvem: Nuvem) => RespostaRpc>;
  /** Leituras extras (GET /rest/v1/<tabela>), consultadas depois das que o Guia faz para abrir. */
  ler?: Record<string, (consulta: URL, nuvem: Nuvem) => RespostaRpc>;
}

export interface Pedido { metodo: string; caminho: string; token: string; corpo: unknown }
const registro = { pedidos: [] as Pedido[], naoMapeadas: [] as string[], fotos: [] as string[] };

/** Toda chamada ao Supabase (REST e auth), na ordem; `caminho` sem /rest/v1/ e /auth/v1/ (auth fica como `auth/...`). */
export const pedidos = (): Pedido[] => [...registro.pedidos];
/** POSTs a uma função (`rpc/<nome>`). */
export const rpcs = (nome: string): Pedido[] => registro.pedidos.filter((p) => p.metodo === 'POST' && p.caminho === `rpc/${nome}`);
/** Leituras GET de uma tabela. */
export const leituras = (tabela: string): Pedido[] => registro.pedidos.filter((p) => p.metodo === 'GET' && p.caminho.split('?')[0] === tabela);
/** Requisições abortadas por não terem mapa (inclui qualquer host externo). Deve ficar vazia. */
export const naoMapeadas = (): string[] => [...registro.naoMapeadas];
/** Fotos do TSE pedidas (abortadas: não contam como requisição sem mapa). */
export const fotos = (): string[] => [...registro.fotos];

const PERMITE = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, apikey, content-type, prefer',
  'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};
const local = (u: URL) => ['localhost', '127.0.0.1'].includes(u.hostname);

/** Monta a nuvem em memória a partir do estado. */
export function criaNuvem(e: EstadoArea = {}): Nuvem {
  const a = { ...ANA, ...e.mandato };
  return {
    mandatos: [a, ...(e.outros ?? []).map((o) => o.mandato)],
    membros: [
      membro(a.id, LIA.id, LIA.nome, e.papel ?? 'coordenacao', LIA.email),
      ...(e.equipe ?? [membro(a.id, MARIANA.id, MARIANA.nome, 'coordenacao', MARIANA.email)]),
      ...(e.outros ?? []).map((o) => membro(o.mandato.id, LIA.id, LIA.nome, o.papel, LIA.email)),
    ],
    convites: e.convites ?? [],
    eventos: e.eventos ?? [],
  };
}

/** Abre o Guia real em `hash` com Lia logada e o Supabase simulado. Devolve a nuvem em memória (viva). */
export async function abreArea(page: Page, hash = '#/config', estado: EstadoArea = {}): Promise<Nuvem> {
  registro.pedidos = []; registro.naoMapeadas = []; registro.fotos = []; criados = 0;
  const nuvem = criaNuvem(estado);
  const eq = (u: URL, k: string) => (u.searchParams.get(k) ?? '').replace(/^eq\./, '');

  // fotos do TSE: abortadas, sem entrar em naoMapeadas; qualquer outro host externo é sem mapa
  await page.route((u) => !local(u) && u.origin !== ORIGEM, (rota) => {
    const url = rota.request().url();
    if (url.startsWith('https://resultados.tse.jus.br/')) registro.fotos.push(url);
    else registro.naoMapeadas.push(`${rota.request().method()} ${url}`);
    return rota.abort('blockedbyclient');
  });

  await page.route((u) => u.origin === ORIGEM, async (rota: Route) => {
    const req = rota.request();
    const u = new URL(req.url());
    if (req.method() === 'OPTIONS') return rota.fulfill({ status: 204, headers: PERMITE });
    const token = (req.headers()['authorization'] ?? '').replace(/^Bearer /, '');
    let corpo: unknown;
    try { corpo = JSON.parse(req.postData() ?? 'null') ?? undefined; } catch { corpo = req.postData(); }
    const caminho = u.pathname.replace(/^\/(rest|auth)\/v1\//, '') + u.search;
    registro.pedidos.push({ metodo: req.method(), caminho: u.pathname.startsWith('/auth') ? `auth/${caminho}` : caminho, token, corpo });
    const responde = (status: number, c?: unknown) =>
      rota.fulfill({ status, headers: { ...PERMITE, 'content-type': 'application/json' }, body: c === undefined ? '' : JSON.stringify(c) });
    const semMapa = () => { registro.naoMapeadas.push(`${req.method()} ${u.pathname}${u.search}`); return rota.abort('blockedbyclient'); };
    const resposta = (r: RespostaRpc) => (r.rede ? rota.abort('failed') : responde(r.status ?? (r.corpo === undefined ? 204 : 200), r.corpo));
    const falha = (chave: string) => estado.falha?.[chave];
    const falhou = (f: Falha) => (f === 'rede' ? rota.abort('failed') : responde(500, { message: 'boom' }));

    if (token !== LIA.token) return semMapa();
    if (u.pathname === '/auth/v1/user' && req.method() === 'GET') return responde(200, { id: LIA.id, email: LIA.email, user_metadata: { nome: LIA.nome } });
    if (!u.pathname.startsWith('/rest/v1/')) return semMapa();
    const tabela = u.pathname.replace('/rest/v1/', '');

    if (req.method() === 'GET') {
      const f = falha(tabela);
      if (f) return falhou(f);
      // o que o Guia lê para abrir (nucleo.js, acesso.js, cadastro.js, sugestoes.js)
      if (tabela === 'membros' && u.searchParams.get('select') === 'papel,mandatos(*)' && eq(u, 'user_id') === LIA.id)
        return responde(200, nuvem.membros.filter((m) => m.user_id === LIA.id).map((m) => ({ papel: m.papel, mandatos: nuvem.mandatos.find((x) => x.id === m.mandato_id) ?? null })));
      if (tabela === 'mandatos' && u.searchParams.get('id')) return responde(200, nuvem.mandatos.filter((x) => x.id === eq(u, 'id')));
      if (tabela === 'membros' && u.searchParams.get('mandato_id'))
        return responde(200, nuvem.membros.filter((m) => m.mandato_id === eq(u, 'mandato_id') && !(estado.semLiaNosMembros && m.user_id === LIA.id)));
      if (tabela === 'eventos' && u.searchParams.get('mandato_id')) return responde(200, []);
      if (tabela === 'equipe_legisla' && eq(u, 'user_id') === LIA.id) return responde(200, []);
      if (tabela === 'perfis' && u.searchParams.get('select') === 'user_id' && eq(u, 'user_id') === LIA.id) return responde(200, [{ user_id: LIA.id }]);
      if (tabela === 'sugestoes' && u.searchParams.get('resolvida') === 'eq.false') return responde(200, []);
      const extra = estado.ler?.[tabela];
      if (extra) return resposta(extra(u, nuvem));
      // o que as abas leem (lib/convites/api.ts)
      if (tabela === 'eventos_equipe' && u.searchParams.get('mandato_id'))
        return responde(200, nuvem.eventos.filter((x) => x.mandato_id === eq(u, 'mandato_id')).sort((x, y) => y.id - x.id).slice(0, 10)
          .map(({ mandato_id: _m, ...resto }) => resto));
      return semMapa();
    }

    // a aba Dados grava pelo Store.atualizar do Guia (PATCH na linha do mandato)
    if (req.method() === 'PATCH' && tabela === 'mandatos' && u.searchParams.get('id')) {
      nuvem.mandatos = nuvem.mandatos.map((x) => (x.id === eq(u, 'id') ? { ...x, ...(corpo as Partial<LinhaMandato>) } : x));
      return responde(204);
    }

    if (req.method() === 'POST' && tabela.startsWith('rpc/')) {
      const nome = tabela.slice(4);
      const args = (corpo ?? {}) as Record<string, unknown>;
      const f = falha(tabela);
      if (f) return falhou(f);
      const extra = estado.rpc?.[nome];
      if (extra) return resposta(extra(args, nuvem));
      if (nome === 'equipe_do_mandato')
        return responde(200, nuvem.membros.filter((m) => m.mandato_id === args.p_mandato).map(({ mandato_id: _m, ...p }) => p));
      if (nome === 'convites_pendentes')
        return responde(200, nuvem.convites.filter((c) => c.mandato_id === args.p_mandato).map(({ mandato_id: _m, ...c }) => c));
      // o que a aba Equipe grava: a nuvem muda como o banco mudaria (as recusas do banco entram por `estado.rpc`)
      if (nome === 'convite_criar') {
        const n = ++criados;
        const c = { ...convite(`c-novo-${n}`, String(args.p_nome), args.p_papel as Papel, String(args.p_mandato)), convidado_por_nome: LIA.nome, expira_em: EXPIRA_NOVO };
        nuvem.convites.push(c);
        return responde(200, { id: c.id, token: tokenDoConvite(n), expira_em: c.expira_em });
      }
      if (nome === 'convite_cancelar') { nuvem.convites = nuvem.convites.filter((c) => c.id !== args.p_id); return responde(204); }
      if (nome === 'membro_trocar_papel') {
        nuvem.membros = nuvem.membros.map((m) => (m.mandato_id === args.p_mandato && m.user_id === args.p_user ? { ...m, papel: args.p_papel as Papel } : m));
        return responde(204);
      }
      if (nome === 'membro_remover') {
        nuvem.membros = nuvem.membros.filter((m) => !(m.mandato_id === args.p_mandato && m.user_id === args.p_user));
        return responde(204);
      }
      if (nome === 'excluir_mandato') {
        nuvem.mandatos = nuvem.mandatos.filter((x) => x.id !== args.p_id);
        nuvem.membros = nuvem.membros.filter((m) => m.mandato_id !== args.p_id);
        return responde(204);
      }
      if (nome === 'membro_sair') {
        nuvem.membros = nuvem.membros.filter((m) => !(m.mandato_id === args.p_mandato && m.user_id === LIA.id));
        return responde(204);
      }
      return semMapa();
    }
    return semMapa();
  });

  // /primeiro-acesso é outra página (testada à parte): aqui só prova que o Guia mandou a pessoa para lá
  await page.route((u) => local(u) && u.pathname === '/primeiro-acesso', (rota) =>
    rota.fulfill({ status: 200, headers: { 'content-type': 'text/html' }, body: '<!doctype html><title>perfil</title><h1>Primeiro acesso aberto</h1>' }));

  await page.addInitScript((t) => {
    if (sessionStorage.getItem('area-semeado')) return;
    sessionStorage.setItem('area-semeado', '1');
    localStorage.setItem('legisla.tok', JSON.stringify(t));
  }, { access_token: LIA.token, refresh_token: LIA.refresh });
  await page.goto(`/guia${hash}`);
  await page.locator('#ladoNav .it').first().waitFor();
  return nuvem;
}
