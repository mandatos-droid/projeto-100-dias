'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { carregaConfig, type Config } from '../../lib/admin/config.ts';
import { CHAVE_SESSAO, gravaSessao, lerSessao } from '../../lib/admin/sessao.ts';
import { DESCONHECIDO, mensagemDe } from '../../lib/convites/erros.ts';
import { ehEquipeLegisla, meuPerfil } from '../../lib/perfil/api.ts';
import { rotuloPapel } from '../../lib/convites/papeis.ts';
import { Contexto, nomeDoMandato, type ContextoMandato, type MandatoDaPessoa, type Usuario } from './contexto.ts';
import { criaAutenticada, type Autenticada } from './sessaoApi.ts';

const CHAVE_MANDATO = 'legisla.mandatoAtual'; // a mesma do Guia (Store.abrir em nucleo.js)

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'semSessao' }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'semMandato' }
  | { tipo: 'pronto'; cfg: Config; sessao: Autenticada; usuario: Usuario; mandatos: MandatoDaPessoa[] };

interface LinhaMembro { papel: MandatoDaPessoa['papel']; mandatos: Omit<MandatoDaPessoa, 'papel'> | null }

function lerAtivo(): string | null {
  try { return localStorage.getItem(CHAVE_MANDATO); } catch { return null; }
}

function gravaAtivo(id: string) {
  try { localStorage.setItem(CHAVE_MANDATO, id); } catch { /* sem armazenamento: vale só nesta página */ }
}

function rotuloMandato(m: MandatoDaPessoa): string {
  return [nomeDoMandato(m), m.cargo, m.uf].filter(Boolean).join(' · ');
}

export default function Casca({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [ativoId, setAtivoId] = useState<string | null>(null);
  const iniciou = useRef(false);

  const carrega = useCallback(async () => {
    setEstado({ tipo: 'carregando' });
    let perdida = false;
    try {
      const cfg = await carregaConfig();
      const inicial = (() => { try { return lerSessao(localStorage); } catch { return null; } })();
      if (!inicial) { setEstado({ tipo: 'semSessao' }); return; }
      const sessao = criaAutenticada(cfg, inicial, {
        grava: (s) => { try { gravaSessao(localStorage, s); } catch { /* sem armazenamento */ } },
        perdeu: () => { perdida = true; try { localStorage.removeItem(CHAVE_SESSAO); } catch { /* sem armazenamento */ } },
      });
      const usuario = await sessao.usuario();
      // Sem perfil e fora da equipe Legisla, o formulário vem antes (PAG-02.1, 02.2). Falha na consulta cai no erro abaixo:
      // nunca vira "sem perfil".
      if (!(await ehEquipeLegisla(sessao.api, usuario.id)) && !(await meuPerfil(sessao.api, usuario.id))) {
        location.replace('/primeiro-acesso?volta=mandato');
        return;
      }
      // Mesma consulta de Store.meusMandatos (nucleo.js): o papel vem da linha de membros.
      const linhas = (await sessao.api.ler<LinhaMembro[] | null>(
        `membros?select=papel,mandatos(*)&user_id=eq.${encodeURIComponent(usuario.id)}`,
      )) ?? [];
      const mandatos = linhas.filter((l) => l.mandatos).map((l) => ({ ...l.mandatos!, papel: l.papel }));
      if (mandatos.length === 0) { setEstado({ tipo: 'semMandato' }); return; }
      const guardado = lerAtivo();
      setAtivoId(mandatos.some((m) => m.id === guardado) ? guardado : mandatos[0].id);
      setEstado({ tipo: 'pronto', cfg, sessao, usuario, mandatos });
    } catch (e) {
      if (perdida) setEstado({ tipo: 'semSessao' });
      else setEstado({ tipo: 'erro', mensagem: mensagemDe(e) || DESCONHECIDO });
    }
  }, []);

  useEffect(() => {
    if (iniciou.current) return;
    iniciou.current = true;
    carrega();
  }, [carrega]);

  const escolhe = useCallback((id: string) => { setAtivoId(id); gravaAtivo(id); }, []);

  const mandato = estado.tipo === 'pronto' ? estado.mandatos.find((m) => m.id === ativoId) ?? estado.mandatos[0] : null;
  const contexto = useMemo<ContextoMandato | null>(() => {
    if (estado.tipo !== 'pronto' || !mandato) return null;
    return {
      cfg: estado.cfg, api: estado.sessao.api, usuario: estado.usuario, mandatos: estado.mandatos, mandato, papel: mandato.papel, escolhe,
    };
  }, [estado, mandato, escolhe]);

  // O mandato ativo vale também para o Guia, que lê a mesma chave: grava ao abrir, não só ao trocar.
  useEffect(() => { if (mandato) gravaAtivo(mandato.id); }, [mandato?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  let conteudo: React.ReactNode;
  if (estado.tipo === 'carregando') {
    conteudo = <p className="md-centro md-mut" role="status">Carregando…</p>;
  } else if (estado.tipo === 'semSessao') {
    conteudo = (
      <div className="md-centro">
        <h1>Entre para continuar</h1>
        <p className="md-mut">Para ver o mandato, entre com a sua conta no Guia.</p>
        <a className="md-bt md-bt--pri" href="/guia">Entrar no Guia</a>
      </div>
    );
  } else if (estado.tipo === 'erro') {
    conteudo = (
      <div className="md-centro">
        <div className="md-aviso" role="alert">{estado.mensagem}</div>
        <button type="button" className="md-bt" onClick={carrega}>Tentar de novo</button>
      </div>
    );
  } else if (estado.tipo === 'semMandato') {
    conteudo = (
      <div className="md-centro">
        <h1>Você ainda não está em nenhum mandato</h1>
        <p className="md-mut">Cadastre um mandato ou entre em um que já existe, com o link de convite.</p>
        <a className="md-bt md-bt--pri" href="/guia">Cadastrar um mandato</a>
        <a className="md-bt" href="/convite">Tenho um link de convite</a>
      </div>
    );
  } else if (contexto && mandato) {
    conteudo = (
      <Contexto.Provider value={contexto}>
        <nav className="md-abas" aria-label="Telas do mandato">
          <Link href="/mandato" aria-current={caminho === '/mandato' ? 'page' : undefined}>Área do mandato</Link>
          <Link href="/mandato/equipe" aria-current={caminho === '/mandato/equipe' ? 'page' : undefined}>Equipe e convites</Link>
        </nav>
        {estado.tipo === 'pronto' && estado.mandatos.length >= 2 && (
          <label className="md-seletor">
            <span>Mandato</span>
            <select value={mandato.id} onChange={(e) => escolhe(e.target.value)}>
              {estado.mandatos.map((m) => <option key={m.id} value={m.id}>{rotuloMandato(m)}</option>)}
            </select>
          </label>
        )}
        {/* a chave refaz as telas filhas ao trocar de mandato: nada do mandato anterior sobra na página */}
        <div className="md-tela" key={mandato.id}>{children}</div>
      </Contexto.Provider>
    );
  }

  return (
    <>
      <header className="md-barra">
        <b>100 Dias</b>
        <span>{mandato ? `${nomeDoMandato(mandato)} · ${rotuloPapel(mandato.papel)}` : 'Mandato'}</span>
      </header>
      <main className="md-corpo">{conteudo}</main>
    </>
  );
}
