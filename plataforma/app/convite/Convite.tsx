'use client';

import { useEffect, useRef, useState } from 'react';
import { criaApi } from '../../lib/admin/api.ts';
import { carregaConfig, type Config } from '../../lib/admin/config.ts';
import { lerSessao } from '../../lib/admin/sessao.ts';
import { aceitaConvite, previaConvite, type Previa } from '../../lib/convites/api.ts';
import { mensagemDe } from '../../lib/convites/erros.ts';
import { tokenDoHash } from '../../lib/convites/link.ts';
import { rotuloPapel } from '../../lib/convites/papeis.ts';

type DadosPrevia = Extract<Previa, { ok: true }>;

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'colar'; aviso?: string }
  | { tipo: 'fim'; mensagem: string } // convite que não vale mais ou limite de tentativas: nada a fazer aqui
  | { tipo: 'erro'; mensagem: string; token: string } // falha de rede ou do servidor na prévia: dá para repetir
  | { tipo: 'previa'; token: string; previa: DadosPrevia; aviso?: string }
  | { tipo: 'jaMembro' };

const ESPERA_GUIA_MS = 1500; // tempo de ler "Você já está neste mandato" antes de abrir o Guia

// Mesmo valor que Store.abrir grava (nucleo.js): o Guia abre direto neste mandato.
function abreGuia(mandatoId: string) {
  try { localStorage.setItem('legisla.mandatoAtual', mandatoId); } catch { /* sem storage: o Guia abre no primeiro mandato */ }
  location.replace('/guia');
}

function temSessao(): boolean {
  try { return lerSessao(localStorage) !== null; } catch { return false; }
}

function iniciais(nome: string | null): string {
  const p = (nome ?? '').trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

// Aceita o link inteiro (com #) ou só o token de 22 caracteres.
function tokenColado(texto: string): string | null {
  const t = texto.trim();
  return tokenDoHash(t.includes('#') ? t : `#${t}`);
}

export default function Convite() {
  const config = useRef<Config | null>(null);
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [comSessao, setComSessao] = useState(false);
  const [colado, setColado] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function carregaPrevia(token: string) {
    setEstado({ tipo: 'carregando' });
    try {
      const cfg = config.current ?? (config.current = await carregaConfig());
      // a prévia é pública: vai com a chave anon mesmo havendo sessão, e não consome o convite
      const r = await previaConvite(criaApi(cfg, cfg.key), token);
      setEstado(r.ok ? { tipo: 'previa', token, previa: r } : { tipo: 'fim', mensagem: mensagemDe(r) });
    } catch (e) {
      setEstado({ tipo: 'erro', mensagem: mensagemDe(e), token });
    }
  }

  useEffect(() => {
    setComSessao(temSessao());
    const token = tokenDoHash(location.hash);
    if (token) carregaPrevia(token);
    else setEstado({ tipo: 'colar' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function abrirColado(ev: React.FormEvent) {
    ev.preventDefault();
    const token = tokenColado(colado);
    if (!token) { setEstado({ tipo: 'colar', aviso: mensagemDe('invalido') }); return; }
    history.replaceState(null, '', `${location.pathname}#${token}`); // recarregar a página não perde o convite
    carregaPrevia(token);
  }

  async function aceitar() {
    if (estado.tipo !== 'previa' || enviando || !config.current) return;
    const atual = estado;
    const s = (() => { try { return lerSessao(localStorage); } catch { return null; } })();
    if (!s) { setComSessao(false); return; }
    setEnviando(true);
    let saindo = false;
    try {
      const r = await aceitaConvite(criaApi(config.current, s.access_token), atual.token);
      if (r.ok) {
        saindo = true;
        if (!r.ja_membro) { abreGuia(r.mandato_id); return; }
        setEstado({ tipo: 'jaMembro' });
        setTimeout(() => abreGuia(r.mandato_id), ESPERA_GUIA_MS);
        return;
      }
      // invalido e limite encerram o convite nesta tela; os demais (ex.: outro e-mail) deixam o convite disponível
      if (r.erro === 'invalido' || r.erro === 'limite') setEstado({ tipo: 'fim', mensagem: mensagemDe(r) });
      else setEstado({ ...atual, aviso: mensagemDe(r) });
    } catch (e) {
      setEstado({ ...atual, aviso: mensagemDe(e) });
    } finally {
      if (!saindo) setEnviando(false);
    }
  }

  if (estado.tipo === 'carregando') return <p className="cv-centro cv-mut" role="status">Carregando…</p>;

  if (estado.tipo === 'fim') {
    return <div className="cv-centro"><div className="cv-aviso" role="alert">{estado.mensagem}</div></div>;
  }

  if (estado.tipo === 'erro') {
    const { token } = estado;
    return (
      <div className="cv-centro">
        <div className="cv-aviso" role="alert">{estado.mensagem}</div>
        <button type="button" className="cv-bt" onClick={() => carregaPrevia(token)}>Tentar de novo</button>
      </div>
    );
  }

  if (estado.tipo === 'jaMembro') {
    return (
      <div className="cv-centro">
        <div className="cv-aviso cv-aviso--ok" role="status">Você já está neste mandato</div>
        <p className="cv-mut">Abrindo o Guia…</p>
      </div>
    );
  }

  if (estado.tipo === 'colar') {
    return (
      <form className="cv-centro" onSubmit={abrirColado}>
        <h1>Tenho um link de convite</h1>
        {estado.aviso && <div className="cv-aviso" role="alert">{estado.aviso}</div>}
        <label className="cv-campo">
          <span>Cole o link do convite</span>
          <input value={colado} onChange={(e) => setColado(e.target.value)} autoComplete="off" spellCheck={false} />
        </label>
        <button type="submit" className="cv-bt cv-bt--pri">Abrir convite</button>
      </form>
    );
  }

  const { previa, aviso } = estado;
  const m = previa.mandato;
  return (
    <div className="cv-centro">
      <p className="cv-rotulo">Você foi convidado(a)</p>
      <h1>{previa.convidado_por ?? 'A equipe do mandato'} convidou você</h1>
      <div className="cv-card cv-mandato">
        <div className="cv-foto" aria-hidden="true">{iniciais(m.nome_parlamentar)}</div>
        <div className="cv-cresce">
          <strong>Mandato de {m.nome_parlamentar ?? '—'}</strong>
          <span className="cv-mut">{[m.cargo, m.uf, `papel: ${rotuloPapel(previa.papel)}`].filter(Boolean).join(' · ')}</span>
        </div>
      </div>

      {comSessao ? (
        <section className="cv-card cv-pilha" aria-labelledby="cv-aceite">
          <h2 id="cv-aceite">Entrar no mandato</h2>
          <p className="cv-mut">Você já entrou com uma conta neste navegador.</p>
          {aviso && <div className="cv-aviso" role="alert">{aviso}</div>}
          <button type="button" className="cv-bt cv-bt--pri" onClick={aceitar} disabled={enviando}>Aceitar convite</button>
        </section>
      ) : (
        <section className="cv-card cv-pilha" aria-labelledby="cv-conta">
          <h2 id="cv-conta">Crie sua conta para entrar</h2>
          {/* criar conta, entrar e entrar com Google: FormularioConta (T25) */}
        </section>
      )}
    </div>
  );
}
