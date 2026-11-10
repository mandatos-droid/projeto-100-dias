import type { Config } from './config.ts';

export interface Sessao { access_token: string; refresh_token?: string }
export type Armazem = Pick<Storage, 'getItem' | 'setItem'>;
export type RetornoGoogle = { tipo: 'sessao'; sessao: Sessao } | { tipo: 'erro'; mensagem: string };

// Mesma chave do Guia e do /painel: quem já entrou lá não faz login de novo.
export const CHAVE_SESSAO = 'legisla.tok';

export function lerSessao(storage: Armazem): Sessao | null {
  try {
    const s = JSON.parse(storage.getItem(CHAVE_SESSAO) || 'null');
    if (!s || typeof s.access_token !== 'string' || !s.access_token) return null;
    return s.refresh_token ? { access_token: s.access_token, refresh_token: s.refresh_token } : { access_token: s.access_token };
  } catch { return null; }
}

export function gravaSessao(storage: Armazem, s: Sessao): void {
  storage.setItem(CHAVE_SESSAO, JSON.stringify(s));
}

// Hash da volta do Google (location.hash). O token tem prioridade sobre o erro, como no /painel.
export function lerRetornoGoogle(hash: string): RetornoGoogle | null {
  const h = new URLSearchParams(hash.replace(/^#/, ''));
  const at = h.get('access_token');
  if (at) {
    const rt = h.get('refresh_token');
    return { tipo: 'sessao', sessao: rt ? { access_token: at, refresh_token: rt } : { access_token: at } };
  }
  const erro = h.get('error_description');
  return erro ? { tipo: 'erro', mensagem: erro } : null;
}

async function pedeToken(config: Config, grant: string, corpo: object): Promise<Sessao> {
  const r = await fetch(`${config.url}/auth/v1/token?grant_type=${grant}`, {
    method: 'POST',
    headers: { apikey: config.key, 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });
  const d = await r.json().catch(() => null);
  if (!r.ok || !d?.access_token) throw new Error(d?.error_description || d?.msg || d?.message || 'Falha na autenticação');
  return d.refresh_token ? { access_token: d.access_token, refresh_token: d.refresh_token } : { access_token: d.access_token };
}

// Token vencido: troca o refresh_token por uma sessão nova.
export function renova(config: Config, s: Sessao): Promise<Sessao> {
  if (!s.refresh_token) return Promise.reject(new Error('Sessão vencida.'));
  return pedeToken(config, 'refresh_token', { refresh_token: s.refresh_token });
}

export function urlGoogle(config: Config, destino: string): string {
  return `${config.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(destino)}`;
}
