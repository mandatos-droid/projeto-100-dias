import { criaApi, ErroApi, type Api } from '../../lib/admin/api.ts';
import type { Config } from '../../lib/admin/config.ts';
import { renova, type Sessao } from '../../lib/admin/sessao.ts';
import type { Usuario } from './contexto.ts';

/* Cliente autenticado de /mandato: um 401 renova a sessão uma vez com o refresh_token e repete a chamada; se não renovar,
   avisa (`perdeu`) e devolve o erro original. A sessão nova é entregue a `grava` (legisla.tok). */
export interface Autenticada { api: Api; usuario: () => Promise<Usuario> }

export function criaAutenticada(
  cfg: Config,
  inicial: Sessao,
  io: { grava: (s: Sessao) => void; perdeu: () => void },
): Autenticada {
  let sessao = inicial;

  async function comRenovacao<T>(chama: (token: string) => Promise<T>): Promise<T> {
    try {
      return await chama(sessao.access_token);
    } catch (e) {
      if (!(e instanceof ErroApi) || e.status !== 401) throw e;
      const nova = await renova(cfg, sessao).catch(() => null);
      if (!nova) { io.perdeu(); throw e; }
      sessao = nova;
      io.grava(nova);
      try {
        return await chama(nova.access_token);
      } catch (e2) {
        if (e2 instanceof ErroApi && e2.status === 401) io.perdeu();
        throw e2;
      }
    }
  }

  return {
    api: {
      ler: <T,>(caminho: string) => comRenovacao((t) => criaApi(cfg, t).ler<T>(caminho)),
      rpc: <T,>(nome: string, args?: object) => comRenovacao((t) => criaApi(cfg, t).rpc<T>(nome, args)),
    },
    // Quem é a pessoa do token: GoTrue (não é REST).
    usuario: () => comRenovacao(async (token) => {
      let r: Response;
      try {
        r = await fetch(`${cfg.url}/auth/v1/user`, { headers: { apikey: cfg.key, Authorization: `Bearer ${token}` } });
      } catch {
        throw new ErroApi(0, '');
      }
      const d = await r.json().catch(() => null);
      if (!r.ok || typeof d?.id !== 'string') throw new ErroApi(r.ok ? 500 : r.status, '');
      return { id: d.id, email: typeof d.email === 'string' ? d.email : null };
    }),
  };
}
