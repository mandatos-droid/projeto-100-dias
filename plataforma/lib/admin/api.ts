import type { Config } from './config.ts';

// status 0 = sem resposta (rede); mensagem vazia = o corpo não trouxe `message`.
export class ErroApi extends Error {
  status: number;
  mensagem: string;
  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.name = 'ErroApi';
    this.status = status;
    this.mensagem = mensagem;
  }
}

export interface Api {
  // caminho relativo a /rest/v1/, com a query (ex.: 'v_admin_mandatos?select=id')
  ler<T>(caminho: string): Promise<T>;
  rpc<T>(nome: string, args?: object): Promise<T>;
}

export function criaApi(config: Config, token: string): Api {
  const cabecalhos = { apikey: config.key, 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  async function pede<T>(caminho: string, init: RequestInit): Promise<T> {
    let r: Response;
    try {
      r = await fetch(`${config.url}/rest/v1/${caminho}`, { ...init, headers: cabecalhos });
    } catch {
      throw new ErroApi(0, '');
    }
    // 204 e POST sem retorno chegam com corpo vazio; HTML de proxy (502) não é JSON
    const texto = await r.text().catch(() => '');
    let corpo: unknown = null;
    if (texto) { try { corpo = JSON.parse(texto); } catch { corpo = null; } }
    if (!r.ok) {
      const m = (corpo as { message?: unknown } | null)?.message;
      throw new ErroApi(r.status, typeof m === 'string' ? m : '');
    }
    return corpo as T;
  }

  return {
    ler: <T>(caminho: string) => pede<T>(caminho, { method: 'GET' }),
    rpc: <T>(nome: string, args: object = {}) => pede<T>(`rpc/${nome}`, { method: 'POST', body: JSON.stringify(args) }),
  };
}
