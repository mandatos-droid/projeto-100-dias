'use client';

import { Fragment, useMemo, useState } from 'react';
import type { Config } from '../../lib/admin/config.ts';
import { gravaSessao, lerSessao } from '../../lib/admin/sessao.ts';
import { ERRO_CARREGAR, mandatoDoGuia } from '../../lib/mandato/legado.ts';
import { Contexto, type ContextoMandato } from './contexto.ts';
import { criaAutenticada } from './sessaoApi.ts';

/* Contexto de useMandato() para as ilhas da Área do mandato, montado a partir do Guia (nucleo.js): mandato aberto,
   membros e pessoa vêm do Store; a sessão, de legisla.tok. Não tem seletor de mandato (é o do Guia): `escolhe` não faz
   nada. Ao trocar de mandato, o Guia redesenha a tela e a ilha é montada de novo (Ilhas.ligar), já com o mandato novo. */
interface Guia {
  NUVEM?: boolean;
  CONFIG?: { url?: string; key?: string };
  Nuvem?: { tok: string | null };
  Store?: { usuario?: unknown; mandato?: { id?: unknown } | null; membros?: unknown; abrir?: (id: string) => Promise<unknown> };
}
const guia = () => window as unknown as Guia;

function monta(): ContextoMandato | null {
  const w = guia();
  if (!w.NUVEM || !w.CONFIG?.url || !w.CONFIG.key) return null;
  const sessao = (() => { try { return lerSessao(localStorage); } catch { return null; } })();
  if (!sessao) return null;
  const r = mandatoDoGuia(w.Store?.mandato, w.Store?.membros, w.Store?.usuario);
  if (!r.ok) return null;
  const cfg: Config = { url: w.CONFIG.url, key: w.CONFIG.key };
  const { api } = criaAutenticada(cfg, sessao, {
    // a sessão renovada vale também para o Guia, que grava com Nuvem.tok
    grava: (s) => {
      try { gravaSessao(localStorage, s); } catch { /* sem armazenamento: vale só nesta página */ }
      if (w.Nuvem) w.Nuvem.tok = s.access_token;
    },
    perdeu: () => { /* a aba mostra o erro com "Tentar de novo"; a entrada é do Guia */ },
  });
  return { cfg, api, usuario: r.usuario, mandatos: [r.mandato], mandato: r.mandato, papel: r.mandato.papel, escolhe: () => {} };
}

export default function ProvedorLegado({ children }: { children: React.ReactNode }) {
  const [tentativa, setTentativa] = useState(0);
  const [tentando, setTentando] = useState(false);
  const contexto = useMemo(() => monta(), [tentativa]); // eslint-disable-line react-hooks/exhaustive-deps

  // "Tentar de novo" relê o mandato e os membros do banco (Store.abrir), de onde vem o papel da pessoa
  async function tentaDeNovo() {
    setTentando(true);
    const { Store } = guia();
    const id = Store?.mandato?.id;
    try { if (typeof id === 'string' && Store?.abrir) await Store.abrir(id); } catch { /* segue com o erro na tela */ }
    setTentando(false);
    setTentativa((n) => n + 1);
  }

  if (!contexto) {
    return (
      <div className="md-pilha">
        <div className="md-aviso" role="alert">{ERRO_CARREGAR}</div>
        <div><button type="button" className="md-bt" onClick={tentaDeNovo} disabled={tentando}>Tentar de novo</button></div>
      </div>
    );
  }
  return (
    <Contexto.Provider value={contexto}>
      <Fragment key={contexto.mandato.id}>{children}</Fragment>
    </Contexto.Provider>
  );
}
