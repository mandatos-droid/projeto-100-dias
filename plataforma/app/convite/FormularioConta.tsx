'use client';

import { ErroApi } from '../../lib/admin/api.ts';
import type { Config } from '../../lib/admin/config.ts';
import { urlGoogle, type Sessao } from '../../lib/admin/sessao.ts';
import { guardaPendente } from '../../lib/convites/pendente.ts';

// Mesma versão e mesmos textos do cadastro do Guia (Store.consentimento em nucleo.js; #blocoLgpd em lib/legacyBody.ts).
export const VERSAO_CONSENTIMENTO = '2026-10';
export const SEM_CONSENTIMENTO = 'Para criar a conta é preciso concordar com o tratamento dos dados pessoais.';
const CONCORDO = 'Li e concordo com o tratamento dos meus dados pessoais nos termos acima.';

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
export async function gravaConsentimento(cfg: Config, s: Sessao): Promise<void> {
  const id = await idDoUsuario(cfg, s.access_token);
  const r = await fetch(`${cfg.url}/rest/v1/consentimentos`, {
    method: 'POST',
    headers: { apikey: cfg.key, Authorization: `Bearer ${s.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: id, versao: VERSAO_CONSENTIMENTO, aceito_em: new Date().toISOString() }),
  });
  if (!r.ok) throw new ErroApi(r.status, '');
}

interface Props {
  config: Config;
  /** Token do convite: fica guardado no navegador antes de sair para o Google. */
  token: string;
  /** Mensagem vinda da página (sessão vencida, erro do Google). */
  aviso?: string;
}

// Quem abre o convite sem sessão: o único caminho é "Entrar com Google" (PAG-01.1, 01.2).
export default function FormularioConta({ config, token, aviso }: Props) {
  function google() {
    guardaPendente(armSessao(), token); // na volta, a página conclui este convite sem pedir o link de novo (PAG-01.5)
    location.href = urlGoogle(config, `${location.origin}/convite`);
  }

  return (
    <section className="cv-card cv-pilha" aria-labelledby="cv-conta">
      <h2 id="cv-conta">Entre para aceitar o convite</h2>
      {aviso && <div className="cv-aviso" role="alert">{aviso}</div>}
      <button type="button" className="cv-bt cv-bt--pri" onClick={google}>Entrar com Google</button>
    </section>
  );
}
