'use client';

import { useState } from 'react';
import { ErroApi } from '../../lib/admin/api.ts';
import type { Config } from '../../lib/admin/config.ts';
import { entraComSenha, urlGoogle, type Sessao } from '../../lib/admin/sessao.ts';
import { mensagemDoLogin } from '../../lib/convites/erros.ts';
import { guardaPendente } from '../../lib/convites/pendente.ts';

// Mesma versão e mesmos textos do cadastro do Guia (Store.consentimento em nucleo.js; #blocoLgpd em lib/legacyBody.ts).
export const VERSAO_CONSENTIMENTO = '2026-10';
export const SEM_CONSENTIMENTO = 'Para criar a conta é preciso concordar com o tratamento dos dados pessoais.';
const CONCORDO = 'Li e concordo com o tratamento dos meus dados pessoais nos termos acima.';
const CONFIRME_EMAIL = 'Conta criada. Confirme o e-mail enviado e faça login.';

const armSessao = (): Storage | null => { try { return sessionStorage; } catch { return null; } };

// Aviso do cadastro, com "link de convite" no lugar de "código de convite" (ACE-07.4); o restante é o mesmo texto.
export function AvisoConsentimento() {
  return (
    <div className="cv-lgpd">
      <strong>Proteção de dados pessoais (LGPD, Lei nº 13.709/2018).</strong>{' '}
      Ao criar conta, a Legisla Brasil trata seu nome e e-mail para autenticação e para identificar quem preencheu
      cada registro do mandato. Se você se indicar como responsável pelo preenchimento, também tratamos o cargo e,
      caso informe, o telefone de contato. Os conteúdos registrados ficam vinculados ao mandato cadastrado e são
      acessíveis a quem tiver o link de convite dele. A base legal é o seu consentimento, que pode ser revogado a
      qualquer momento pela exclusão da conta. Você pode solicitar acesso, correção, portabilidade ou eliminação dos
      seus dados pelo endereço <a href="mailto:contato@legislabrasil.org">contato@legislabrasil.org</a>.
    </div>
  );
}

export function CaixaConsentimento({ marcado, muda }: { marcado: boolean; muda: (v: boolean) => void }) {
  return (
    <label className="cv-chk">
      <input type="checkbox" checked={marcado} onChange={(e) => muda(e.target.checked)} />
      <span>{CONCORDO}</span>
    </label>
  );
}

// Quem é a pessoa do token (o registro de consentimento leva o user_id; a RLS exige que seja o da sessão).
async function idDoUsuario(cfg: Config, token: string): Promise<string> {
  const r = await fetch(`${cfg.url}/auth/v1/user`, { headers: { apikey: cfg.key, Authorization: `Bearer ${token}` } });
  const d = await r.json().catch(() => null);
  if (!r.ok || typeof d?.id !== 'string') throw new ErroApi(r.ok ? 500 : r.status, '');
  return d.id;
}

// Mesmo registro de Store.consentimento (nucleo.js), gravado com a sessão da pessoa.
export async function gravaConsentimento(cfg: Config, s: Sessao, userId?: string | null): Promise<void> {
  const id = userId || (await idDoUsuario(cfg, s.access_token));
  const r = await fetch(`${cfg.url}/rest/v1/consentimentos`, {
    method: 'POST',
    headers: { apikey: cfg.key, Authorization: `Bearer ${s.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: id, versao: VERSAO_CONSENTIMENTO, aceito_em: new Date().toISOString() }),
  });
  if (!r.ok) throw new ErroApi(r.status, '');
}

// Cadastro no Supabase Auth, como Store.criarConta (nucleo.js). Com a confirmação de e-mail ligada não volta sessão (null).
async function criaConta(cfg: Config, email: string, senha: string, nome: string): Promise<{ sessao: Sessao; userId: string | null } | null> {
  const r = await fetch(`${cfg.url}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: cfg.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: senha, data: { nome } }),
  });
  const d = await r.json().catch(() => null);
  if (!r.ok) throw d ?? new Error(''); // corpo do GoTrue ({error_code, msg}); mensagemDoLogin traduz
  if (!d?.access_token) return null;
  const sessao: Sessao = d.refresh_token ? { access_token: d.access_token, refresh_token: d.refresh_token } : { access_token: d.access_token };
  return { sessao, userId: typeof d.user?.id === 'string' ? d.user.id : null };
}

export interface DadosEntrada { nome?: string; userId?: string | null; consentiu: boolean }

interface Props {
  config: Config;
  /** Token do convite: fica guardado no navegador antes de sair para o Google ou à espera da confirmação de e-mail. */
  token: string;
  nomeInicial: string;
  abaInicial?: 'criar' | 'entrar';
  /** Mensagem vinda da página (sessão vencida, erro do Google). */
  aviso?: string;
  /** Recebe a sessão nova; a página grava, registra o consentimento (se houve) e conclui o aceite. Não lança. */
  onEntrou: (s: Sessao, dados: DadosEntrada) => Promise<void>;
}

// Quem abre o convite sem sessão: cria conta (nome, e-mail, senha), entra com conta existente ou entra com Google.
export default function FormularioConta({ config, token, nomeInicial, abaInicial = 'criar', aviso, onEntrou }: Props) {
  const [aba, setAba] = useState(abaInicial);
  const [nome, setNome] = useState(nomeInicial);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [concordo, setConcordo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ texto: string; ok?: boolean } | null>(aviso ? { texto: aviso } : null);

  function troca(nova: 'criar' | 'entrar') { setAba(nova); setMsg(null); }

  async function criar(ev: React.FormEvent) {
    ev.preventDefault();
    if (enviando) return;
    if (!nome.trim() || !email.trim() || !senha) { setMsg({ texto: 'Preencha nome, e-mail e senha.' }); return; }
    if (!concordo) { setMsg({ texto: SEM_CONSENTIMENTO }); return; }
    setEnviando(true); setMsg(null);
    try {
      const r = await criaConta(config, email.trim(), senha, nome.trim());
      if (!r) {
        // confirmação de e-mail ligada: o convite fica guardado para quando a pessoa voltar e entrar
        guardaPendente(armSessao(), token);
        setSenha(''); setAba('entrar');
        setMsg({ texto: CONFIRME_EMAIL, ok: true });
        return;
      }
      await onEntrou(r.sessao, { nome: nome.trim(), userId: r.userId, consentiu: true });
    } catch (e) {
      setMsg({ texto: mensagemDoLogin(e) });
    } finally {
      setEnviando(false);
    }
  }

  async function entrar(ev: React.FormEvent) {
    ev.preventDefault();
    if (enviando) return;
    if (!email.trim() || !senha) { setMsg({ texto: 'Preencha e-mail e senha.' }); return; }
    setEnviando(true); setMsg(null);
    try {
      const s = await entraComSenha(config, email.trim(), senha);
      await onEntrou(s, { consentiu: false });
    } catch (e) {
      setMsg({ texto: mensagemDoLogin(e) });
    } finally {
      setEnviando(false);
    }
  }

  function google() {
    guardaPendente(armSessao(), token); // na volta, a página conclui este convite sem pedir o link de novo
    location.href = urlGoogle(config, `${location.origin}/convite`);
  }

  const caixaAviso = msg && (
    <div className={`cv-aviso${msg.ok ? ' cv-aviso--ok' : ''}`} role={msg.ok ? 'status' : 'alert'}>{msg.texto}</div>
  );

  return (
    <section className="cv-card cv-pilha" aria-labelledby="cv-conta">
      {aba === 'criar' ? (
        <form className="cv-pilha" onSubmit={criar} noValidate>
          <h2 id="cv-conta">Crie sua conta para entrar</h2>
          {caixaAviso}
          <label className="cv-campo"><span>Nome</span>
            <input autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} /></label>
          <label className="cv-campo"><span>E-mail</span>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="cv-campo"><span>Senha</span>
            <input type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} /></label>
          <AvisoConsentimento />
          <CaixaConsentimento marcado={concordo} muda={setConcordo} />
          <button type="submit" className="cv-bt cv-bt--pri" disabled={enviando}>Criar conta e entrar no mandato</button>
          <p className="cv-mut">Já tem conta? <button type="button" className="cv-link" onClick={() => troca('entrar')}>Entrar e aceitar</button></p>
        </form>
      ) : (
        <form className="cv-pilha" onSubmit={entrar} noValidate>
          <h2 id="cv-conta">Entre para aceitar o convite</h2>
          {caixaAviso}
          <label className="cv-campo"><span>E-mail</span>
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="cv-campo"><span>Senha</span>
            <input type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} /></label>
          <button type="submit" className="cv-bt cv-bt--pri" disabled={enviando}>Entrar e aceitar</button>
          <p className="cv-mut">Ainda não tem conta? <button type="button" className="cv-link" onClick={() => troca('criar')}>Criar conta</button></p>
        </form>
      )}
      <p className="cv-ou" aria-hidden="true">ou</p>
      <button type="button" className="cv-bt" onClick={google} disabled={enviando}>Entrar com Google</button>
    </section>
  );
}
