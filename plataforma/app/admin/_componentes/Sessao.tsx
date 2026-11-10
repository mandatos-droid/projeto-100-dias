'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { criaApi, ErroApi, type Api } from '../../../lib/admin/api.ts';
import { carregaConfig, type Config } from '../../../lib/admin/config.ts';
import { mensagemDe } from '../../../lib/admin/mensagens.ts';
import {
  CHAVE_SESSAO, gravaSessao, lerRetornoGoogle, lerSessao, renova, urlGoogle, type Sessao as DadosSessao,
} from '../../../lib/admin/sessao.ts';

export type Papel = 'admin' | 'leitura';
// usuarioId: quem está logado (as telas marcam "você" e recarregam se a pessoa mudar o próprio papel).
export interface ContextoAdmin { api: Api; papel: Papel; nome: string; usuarioId: string; sair: () => void }

const Contexto = createContext<ContextoAdmin | null>(null);
export function useAdmin(): ContextoAdmin {
  const c = useContext(Contexto);
  if (!c) throw new Error('useAdmin fora do <Sessao>.');
  return c;
}

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'entrada'; aviso?: string }
  | { tipo: 'semAcesso'; email: string }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'ok'; ctx: ContextoAdmin };

const SESSAO_VENCIDA = 'Sua sessão venceu. Entre de novo.';
const ERRO_GOOGLE = 'Não foi possível entrar com o Google. Tente de novo.'; // PAG-01.4

// Quem é a pessoa do token. Fica aqui porque /auth/v1 não é do cliente REST (lib/admin/api.ts).
async function lerUsuario(config: Config, token: string): Promise<{ id: string; email: string }> {
  let r: Response;
  try {
    r = await fetch(`${config.url}/auth/v1/user`, { headers: { apikey: config.key, Authorization: `Bearer ${token}` } });
  } catch { throw new ErroApi(0, ''); }
  const d = await r.json().catch(() => null);
  if (!r.ok || !d?.id) throw new ErroApi(r.ok ? 500 : r.status, '');
  return { id: d.id, email: d.email ?? '' };
}

export default function Sessao({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const config = useRef<Config | null>(null);
  const sessao = useRef<DadosSessao | null>(null);

  function voltaEntrada(aviso?: string) {
    sessao.current = null;
    try { localStorage.removeItem(CHAVE_SESSAO); } catch { /* sem storage: segue só na memória */ }
    setEstado({ tipo: 'entrada', aviso });
  }

  // Todo 401 tenta renovar uma vez com o refresh_token; sem sucesso, volta à entrada.
  function criaApiDaSessao(cfg: Config): Api {
    async function com<T>(fn: (a: Api) => Promise<T>): Promise<T> {
      try {
        return await fn(criaApi(cfg, sessao.current!.access_token));
      } catch (e) {
        if (!(e instanceof ErroApi) || e.status !== 401 || !sessao.current) throw e;
        try {
          const nova = await renova(cfg, sessao.current);
          sessao.current = nova;
          gravaSessao(localStorage, nova);
        } catch { voltaEntrada(SESSAO_VENCIDA); throw e; }
        try {
          return await fn(criaApi(cfg, sessao.current.access_token));
        } catch (e2) {
          if (e2 instanceof ErroApi && e2.status === 401) voltaEntrada(SESSAO_VENCIDA);
          throw e2;
        }
      }
    }
    return { ler: (c) => com((a) => a.ler(c)), rpc: (n, args) => com((a) => a.rpc(n, args)) };
  }

  // Lê quem é a pessoa e o papel dela em equipe_legisla (a cada abertura, não do token).
  async function abre(cfg: Config, s: DadosSessao) {
    sessao.current = s;
    const api = criaApiDaSessao(cfg);
    try {
      let u: { id: string; email: string };
      try {
        u = await lerUsuario(cfg, s.access_token);
      } catch (e) {
        if (!(e instanceof ErroApi) || e.status !== 401) throw e;
        const nova = await renova(cfg, s).catch(() => null);
        if (!nova) return voltaEntrada(SESSAO_VENCIDA);
        sessao.current = nova;
        gravaSessao(localStorage, nova);
        u = await lerUsuario(cfg, nova.access_token);
      }
      const linhas = await api.ler<{ papel: Papel; nome: string | null }[]>(`equipe_legisla?select=papel,nome&user_id=eq.${u.id}`);
      if (!linhas.length) { setEstado({ tipo: 'semAcesso', email: u.email }); return; }
      const sair = () => voltaEntrada();
      setEstado({ tipo: 'ok', ctx: { api, papel: linhas[0].papel, nome: linhas[0].nome || u.email, usuarioId: u.id, sair } });
    } catch (e) {
      // se o 401 já levou à entrada dentro do wrapper, não sobrescreve; aqui sobram rede e 5xx
      if (e instanceof ErroApi && e.status === 401) return voltaEntrada(SESSAO_VENCIDA);
      setEstado({ tipo: 'erro', mensagem: mensagemDe(e) });
    }
  }

  async function inicia() {
    setEstado({ tipo: 'carregando' });
    let cfg: Config;
    try { cfg = config.current ?? (config.current = await carregaConfig()); }
    catch { setEstado({ tipo: 'erro', mensagem: mensagemDe(null) }); return; }

    // Volta do login Google: o token chega em #access_token (ou o erro em #error_description).
    const retorno = lerRetornoGoogle(location.hash);
    if (retorno) history.replaceState(null, '', location.pathname);
    if (retorno?.tipo === 'erro') { setEstado({ tipo: 'entrada', aviso: ERRO_GOOGLE }); return; }
    if (retorno?.tipo === 'sessao') gravaSessao(localStorage, retorno.sessao);

    const s = lerSessao(localStorage);
    if (!s) { setEstado({ tipo: 'entrada' }); return; }
    await abre(cfg, s);
  }

  useEffect(() => { inicia(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (estado.tipo === 'ok') return <Contexto.Provider value={estado.ctx}>{children}</Contexto.Provider>;
  if (estado.tipo === 'carregando') return <p className="carregando" role="status">Carregando…</p>;

  if (estado.tipo === 'erro') {
    return (
      <div className="entrada">
        <div className="aviso" role="alert">{estado.mensagem}</div>
        <button type="button" className="btn pri" onClick={() => inicia()}>Tentar de novo</button>
      </div>
    );
  }

  if (estado.tipo === 'semAcesso') {
    return (
      <div className="entrada">
        <h1>Sem acesso</h1>
        <p>A conta <b>{estado.email}</b> não está na equipe da Legisla. Peça a um admin para incluí-la.</p>
        <button type="button" className="btn" onClick={() => voltaEntrada()}>Entrar com outra conta</button>
      </div>
    );
  }

  // Só o Google (PAG-01.1, 01.2): sem senha, sem e-mail.
  return (
    <div className="entrada">
      <h1>Admin · Legisla Brasil</h1>
      <p>Entre com a conta da equipe Legisla.</p>
      {estado.aviso && <div className="aviso" role="alert">{estado.aviso}</div>}
      <button type="button" className="btn pri" onClick={() => { if (config.current) location.href = urlGoogle(config.current, `${location.origin}/admin`); }}>
        Entrar com Google
      </button>
    </div>
  );
}
