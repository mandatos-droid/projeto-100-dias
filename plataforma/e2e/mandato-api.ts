import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { lerConfig } from '../lib/admin/config.ts';
import { moca, type EstadoMoca, type RespostaRpc } from './convite-api';

/* Apoio dos e2e de /mandato (Área do mandato e Equipe). Estende convite-api.ts sem alterá-lo: `moca` continua cuidando de auth,
   rpc, consentimentos, hosts externos e do /guia; aqui entra uma rota mais nova (o Playwright dá prioridade à última registrada)
   que responde as LEITURAS do REST (GET /rest/v1/<tabela>) e repassa o resto com `fallback()`. Leitura sem mapa cai no `moca`,
   que aborta e registra em `naoMapeadas()`. As leituras ficam no registro deste módulo (`leituras()`); as demais chamadas
   (rpc, auth) continuam em `chamadas()` de convite-api.ts. */

const CONFIG = lerConfig(readFileSync(join(process.cwd(), 'public/legacy/nucleo.js'), 'utf8'));
const ORIGEM = new URL(CONFIG.url).origin;

export const MANDATO_A = '6f1c2b3a-0000-4000-8000-00000000a001';
export const MANDATO_B = '6f1c2b3a-0000-4000-8000-00000000b002';

/** Linha de `membros` com o mandato embutido, como `membros?select=papel,mandatos(*)` devolve. */
export interface MandatoDaPessoa {
  id: string; papel: string;
  nome_parlamentar?: string | null; cargo?: string | null; uf?: string | null; partido?: string | null;
  data_posse?: string | null; dados?: Record<string, unknown> | null;
}

export const ANA: MandatoDaPessoa = {
  id: MANDATO_A, papel: 'assessoria', nome_parlamentar: 'Ana Souza', cargo: 'Deputado(a) Estadual', uf: 'SP',
  partido: 'Partido Exemplo', data_posse: '2027-02-01', dados: {},
};
export const BRUNO: MandatoDaPessoa = {
  id: MANDATO_B, papel: 'coordenacao', nome_parlamentar: 'Bruno Alves', cargo: 'Vereador(a)', uf: 'MG',
  partido: 'Outro Partido', data_posse: '2027-02-01', dados: {},
};

export interface EstadoMandato extends EstadoMoca {
  /** Mandatos da pessoa logada (padrão: nenhum). */
  mandatos?: MandatoDaPessoa[];
  /** Respostas das leituras do REST, por tabela (GET /rest/v1/<tabela>?...). `membros` já vem pronto a partir de `mandatos`. */
  ler?: Record<string, (consulta: URL, token: string) => RespostaRpc>;
  /** Falha de rede na leitura de `membros` (para provar a tela de erro). */
  membrosFalha?: 'rede' | 'servidor';
}

export interface Leitura { tabela: string; consulta: string; token: string }
let leiturasFeitas: Leitura[] = [];
let fotosAbortadas: string[] = [];

/** Toda leitura GET ao REST que a página fez, na ordem. */
export const leituras = (tabela?: string): Leitura[] => leiturasFeitas.filter((l) => !tabela || l.tabela === tabela);
/** Fotos externas (TSE ou qualquer .jpg/.jpeg de fora) abortadas: não contam como requisição sem mapa. */
export const fotosBloqueadas = (): string[] => [...fotosAbortadas];

const tokenValido = (t: string) => /^tok(-novo)?-[a-z]+$/.test(t);
const PERMITE = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, apikey, content-type, prefer',
  'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

/** Intercepta o Supabase como `moca` e, além disso, as leituras de `/mandato`. Chame antes de `page.goto`. */
export async function mocaMandato(page: Page, estado: EstadoMandato = {}) {
  leiturasFeitas = []; fotosAbortadas = [];
  await moca(page, estado);

  // fotos do TSE: abortadas aqui (rota mais nova que a de hosts externos do `moca`), sem entrar em naoMapeadas
  await page.route((u) => u.hostname === 'resultados.tse.jus.br' || (!['localhost', '127.0.0.1'].includes(u.hostname) && /\.jpe?g$/i.test(u.pathname)), (rota) => {
    fotosAbortadas.push(rota.request().url());
    return rota.abort('blockedbyclient');
  });

  await page.route((u) => u.origin === ORIGEM && u.pathname.startsWith('/rest/v1/') && !u.pathname.startsWith('/rest/v1/rpc/'), async (rota) => {
    const req = rota.request();
    if (req.method() !== 'GET') return rota.fallback();
    const u = new URL(req.url());
    const tabela = u.pathname.replace('/rest/v1/', '');
    const token = (req.headers()['authorization'] ?? '').replace(/^Bearer /, '');
    const mapa = estado.ler?.[tabela];
    const ehMembros = tabela === 'membros';
    if (!mapa && !ehMembros) return rota.fallback();

    leiturasFeitas.push({ tabela, consulta: u.search, token });
    const responde = (status: number, corpo: unknown) =>
      rota.fulfill({ status, headers: { ...PERMITE, 'content-type': 'application/json' }, body: corpo === undefined ? '' : JSON.stringify(corpo) });
    if (!tokenValido(token)) return responde(401, { message: 'JWT expired' });

    if (mapa) {
      const r = mapa(u, token);
      if (r.rede) return rota.abort('failed');
      return responde(r.status ?? 200, r.corpo);
    }
    if (estado.membrosFalha === 'rede') return rota.abort('failed');
    if (estado.membrosFalha === 'servidor') return responde(500, { message: 'boom' });
    return responde(200, (estado.mandatos ?? []).map(({ papel, ...mandato }) => ({ papel, mandatos: mandato })));
  });
}
