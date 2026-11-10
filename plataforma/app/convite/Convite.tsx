'use client';

import { useEffect, useRef, useState } from 'react';
import { criaApi, ErroApi } from '../../lib/admin/api.ts';
import { carregaConfig, type Config } from '../../lib/admin/config.ts';
import { CHAVE_SESSAO, gravaSessao, lerRetornoGoogle, lerSessao, renova, type Sessao } from '../../lib/admin/sessao.ts';
import { aceitaConvite, previaConvite, type Aceite, type Previa } from '../../lib/convites/api.ts';
import { DESCONHECIDO, mensagemDe } from '../../lib/convites/erros.ts';
import { tokenDoHash } from '../../lib/convites/link.ts';
import { rotuloPapel } from '../../lib/convites/papeis.ts';
import { guardaPendente, lePendente, limpaPendente } from '../../lib/convites/pendente.ts';
import FormularioConta, {
  AvisoConsentimento, CaixaConsentimento, gravaConsentimento, SEM_CONSENTIMENTO,
} from './FormularioConta.tsx';

type DadosPrevia = Extract<Previa, { ok: true }>;

// sessao: aceitar com a conta deste navegador; conta: entrar com Google; consentimento: a conta ainda não consentiu.
type Etapa = 'sessao' | 'conta' | 'consentimento';
type EmPrevia = { tipo: 'previa'; token: string; previa: DadosPrevia; etapa: Etapa; aviso?: string };

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'colar'; aviso?: string }
  | { tipo: 'fim'; mensagem: string } // convite que não vale mais ou limite de tentativas: nada a fazer aqui
  | { tipo: 'erro'; mensagem: string; token: string } // falha de rede ou do servidor na prévia: dá para repetir
  | EmPrevia
  | { tipo: 'jaMembro' };

const ESPERA_GUIA_MS = 1500; // tempo de ler "Você já está neste mandato" antes de abrir o Guia
const SESSAO_VENCIDA = 'Sua sessão venceu. Entre de novo para aceitar o convite.';
const ERRO_GOOGLE = 'Não foi possível entrar com o Google. Tente de novo.'; // PAG-01.4

const armLocal = (): Storage | null => { try { return localStorage; } catch { return null; } };
const armSessao = (): Storage | null => { try { return sessionStorage; } catch { return null; } };

function sessaoAtual(): Sessao | null {
  const l = armLocal();
  return l ? lerSessao(l) : null;
}

// Mesmo lugar e formato do Guia e do /admin (legisla.tok): nenhum dos dois pede login de novo.
function guardaSessao(s: Sessao) {
  try { gravaSessao(localStorage, s); } catch { /* sem storage: a sessão vale só nesta página */ }
}

function apagaSessao() {
  try { localStorage.removeItem(CHAVE_SESSAO); } catch { /* sem storage */ }
}

// Mesmo valor que Store.abrir grava (nucleo.js): o Guia abre direto neste mandato.
function abreGuia(mandatoId: string) {
  try { localStorage.setItem('legisla.mandatoAtual', mandatoId); } catch { /* sem storage: o Guia abre no primeiro mandato */ }
  location.replace('/guia');
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
  const [colado, setColado] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [concordo, setConcordo] = useState(false);

  async function carregaPrevia(token: string, extra: Partial<EmPrevia> = {}): Promise<EmPrevia | null> {
    setEstado({ tipo: 'carregando' });
    try {
      const cfg = config.current ?? (config.current = await carregaConfig());
      // a prévia é pública: vai com a chave anon mesmo havendo sessão, e não consome o convite
      const r = await previaConvite(criaApi(cfg, cfg.key), token);
      if (!r.ok) { setEstado({ tipo: 'fim', mensagem: mensagemDe(r) }); return null; }
      const atual: EmPrevia = { tipo: 'previa', token, previa: r, etapa: sessaoAtual() ? 'sessao' : 'conta', ...extra };
      setEstado(atual);
      return atual;
    } catch (e) {
      setEstado({ tipo: 'erro', mensagem: mensagemDe(e), token });
      return null;
    }
  }

  // Sessão que não renova: volta ao botão do Google com o mesmo convite, guardado também no navegador.
  function sessaoVencida(atual: EmPrevia) {
    apagaSessao();
    guardaPendente(armSessao(), atual.token);
    setEstado({ ...atual, etapa: 'conta', aviso: SESSAO_VENCIDA });
  }

  // Aceita com a sessão; um 401 tenta renovar uma vez com o refresh_token.
  async function aceitaComSessao(atual: EmPrevia, s: Sessao) {
    const cfg = config.current!;
    setEnviando(true);
    let saindo = false;
    try {
      let r: Aceite;
      try {
        r = await aceitaConvite(criaApi(cfg, s.access_token), atual.token);
      } catch (e) {
        if (!(e instanceof ErroApi) || e.status !== 401) throw e;
        const nova = await renova(cfg, s).catch(() => null);
        if (!nova) { sessaoVencida(atual); return; }
        guardaSessao(nova);
        try {
          r = await aceitaConvite(criaApi(cfg, nova.access_token), atual.token);
        } catch (e2) {
          if (e2 instanceof ErroApi && e2.status === 401) { sessaoVencida(atual); return; }
          throw e2;
        }
      }
      if (r.ok) {
        saindo = true;
        limpaPendente(armSessao());
        const mandato = r.mandato_id;
        if (!r.ja_membro) { abreGuia(mandato); return; }
        setEstado({ tipo: 'jaMembro' });
        setTimeout(() => abreGuia(mandato), ESPERA_GUIA_MS);
        return;
      }
      // sem perfil: guarda o convite e manda ao formulário; na volta o aceite conclui sozinho (PAG-02.1, 04.8)
      if (r.erro === 'perfil') {
        saindo = true;
        guardaPendente(armSessao(), atual.token);
        location.replace('/primeiro-acesso?volta=convite');
        return;
      }
      if (r.erro === 'consentimento') { setConcordo(false); setEstado({ ...atual, etapa: 'consentimento', aviso: undefined }); return; }
      if (r.erro === 'invalido') limpaPendente(armSessao());
      // invalido e limite encerram o convite nesta tela; outro e-mail deixa o convite disponível
      if (r.erro === 'invalido' || r.erro === 'limite') { setEstado({ tipo: 'fim', mensagem: mensagemDe(r) }); return; }
      setEstado({ ...atual, etapa: 'sessao', aviso: mensagemDe(r) });
    } catch (e) {
      setEstado({ ...atual, etapa: 'sessao', aviso: mensagemDe(e) });
    } finally {
      if (!saindo) setEnviando(false);
    }
  }

  useEffect(() => {
    (async () => {
      // Volta do Google: a sessão chega no fragmento; o convite foi guardado antes de sair.
      const retorno = lerRetornoGoogle(location.hash);
      if (!retorno) {
        const token = tokenDoHash(location.hash);
        if (!token) { setEstado({ tipo: 'colar' }); return; }
        const atual = await carregaPrevia(token);
        // volta do perfil: o token guardado antes de sair é o mesmo do endereço e a sessão já existe; conclui sem novo clique
        const s = sessaoAtual();
        if (atual && s && lePendente(armSessao()) === token) await aceitaComSessao(atual, s);
        return;
      }
      const token = lePendente(armSessao());
      history.replaceState(null, '', token ? `${location.pathname}#${token}` : location.pathname); // tira a sessão do endereço
      if (retorno.tipo === 'sessao') guardaSessao(retorno.sessao);
      if (!token) { setEstado({ tipo: 'colar' }); return; }
      if (retorno.tipo === 'erro') { carregaPrevia(token, { etapa: 'conta', aviso: ERRO_GOOGLE }); return; }
      const atual = await carregaPrevia(token);
      if (atual) await aceitaComSessao(atual, retorno.sessao);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function abrirColado(ev: React.FormEvent) {
    ev.preventDefault();
    const token = tokenColado(colado);
    if (!token) { setEstado({ tipo: 'colar', aviso: mensagemDe('invalido') }); return; }
    history.replaceState(null, '', `${location.pathname}#${token}`); // recarregar a página não perde o convite
    carregaPrevia(token);
  }

  function aceitar() {
    if (estado.tipo !== 'previa' || enviando || !config.current) return;
    const s = sessaoAtual();
    if (!s) { sessaoVencida(estado); return; }
    aceitaComSessao({ ...estado, aviso: undefined }, s);
  }

  // Conta sem consentimento gravado (ex.: primeiro acesso com Google): mostra o aviso, grava e tenta o aceite de novo.
  async function consentirEAceitar() {
    if (estado.tipo !== 'previa' || enviando || !config.current) return;
    const atual = estado;
    if (!concordo) { setEstado({ ...atual, aviso: SEM_CONSENTIMENTO }); return; }
    const s = sessaoAtual();
    if (!s) { sessaoVencida(atual); return; }
    setEnviando(true);
    try {
      await gravaConsentimento(config.current, s);
    } catch {
      setEnviando(false);
      setEstado({ ...atual, aviso: DESCONHECIDO });
      return;
    }
    await aceitaComSessao({ ...atual, aviso: undefined }, s);
  }

  function trocarConta() {
    if (estado.tipo !== 'previa') return;
    apagaSessao();
    setEstado({ ...estado, etapa: 'conta', aviso: undefined });
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

  const { previa, aviso, etapa, token } = estado;
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

      {etapa === 'sessao' && (
        <section className="cv-card cv-pilha" aria-labelledby="cv-aceite">
          <h2 id="cv-aceite">Entrar no mandato</h2>
          <p className="cv-mut">Você já entrou com uma conta neste navegador.</p>
          {aviso && <div className="cv-aviso" role="alert">{aviso}</div>}
          <button type="button" className="cv-bt cv-bt--pri" onClick={aceitar} disabled={enviando}>Aceitar convite</button>
          <button type="button" className="cv-link" onClick={trocarConta} disabled={enviando}>Entrar com outra conta</button>
        </section>
      )}

      {etapa === 'consentimento' && (
        <section className="cv-card cv-pilha" aria-labelledby="cv-aceite">
          <h2 id="cv-aceite">Entrar no mandato</h2>
          <AvisoConsentimento />
          <CaixaConsentimento marcado={concordo} muda={setConcordo} />
          {aviso && <div className="cv-aviso" role="alert">{aviso}</div>}
          <button type="button" className="cv-bt cv-bt--pri" onClick={consentirEAceitar} disabled={enviando}>Aceitar convite</button>
        </section>
      )}

      {etapa === 'conta' && config.current && (
        <FormularioConta
          key={aviso ?? ''}
          config={config.current}
          token={token}
          aviso={aviso}
        />
      )}
    </div>
  );
}
