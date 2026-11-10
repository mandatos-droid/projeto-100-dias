'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { convitesPendentes, equipeDoMandato, type ConvitePendente, type PessoaEquipe } from '../../../lib/convites/api.ts';
import { ERRO_CARREGAR } from '../../../lib/mandato/legado.ts';
import { useMandato } from '../contexto.ts';
import FormularioConvite from './FormularioConvite.tsx';
import ListaConvites from './ListaConvites.tsx';
import ListaPessoas from './ListaPessoas.tsx';
import SairDoMandato from './SairDoMandato.tsx';

interface Props {
  /** Nível do título "Equipe e convites" (2 dentro do Guia, que já tem o h1 da tela). */
  nivel?: 1 | 2;
  /** Recebe a lista de pessoas a cada mudança (leitura do banco, troca de papel, remoção). */
  aoMudarPessoas?: (pessoas: PessoaEquipe[]) => void;
}

// Tela Equipe e convites: formulário, convites pendentes e pessoas, nesta ordem (ACE-04.1); por último, sair do mandato.
export default function Equipe({ nivel = 1, aoMudarPessoas }: Props) {
  const { api, mandato, usuario } = useMandato();
  const [pessoas, setPessoas] = useState<PessoaEquipe[] | null>(null);
  const [erroPessoas, setErroPessoas] = useState<string | null>(null);
  const [pendentes, setPendentes] = useState<ConvitePendente[] | null>(null);
  const [erroPendentes, setErroPendentes] = useState<string | null>(null);
  const leitura = useRef(0); // só a leitura mais recente vale: um convite gerado durante a carga inicial não some
  const [tentativa, setTentativa] = useState(0); // "Tentar de novo" relê as duas listas

  const carregaPendentes = useCallback(async () => {
    const minha = ++leitura.current;
    try {
      const l = await convitesPendentes(api, mandato.id);
      if (minha === leitura.current) { setPendentes(l); setErroPendentes(null); }
    } catch (e) {
      if (minha === leitura.current) setErroPendentes(ERRO_CARREGAR);
    }
  }, [api, mandato.id]);

  useEffect(() => {
    let vivo = true;
    equipeDoMandato(api, mandato.id).then(
      (l) => { if (vivo) { setPessoas(l); setErroPessoas(null); } },
      (e) => { if (vivo) setErroPessoas(ERRO_CARREGAR); },
    );
    carregaPendentes();
    return () => { vivo = false; leitura.current++; };
  }, [api, mandato.id, carregaPendentes, tentativa]);

  useEffect(() => { if (pessoas) aoMudarPessoas?.(pessoas); }, [pessoas]); // eslint-disable-line react-hooks/exhaustive-deps
  const tentaDeNovo = () => setTentativa((n) => n + 1);
  const Titulo = nivel === 2 ? 'h2' : 'h1';

  const meuNome = pessoas?.find((p) => p.user_id === usuario.id)?.nome ?? null;

  return (
    <>
      <div className="md-pilha">
        <Titulo>Equipe e convites</Titulo>
        <p className="md-mut">Todas as pessoas da equipe podem convidar outras.</p>
      </div>
      <FormularioConvite meuNome={meuNome} aoCriar={carregaPendentes} />
      <ListaConvites
        convites={pendentes}
        erro={erroPendentes}
        aoCancelar={(id) => { leitura.current++; setPendentes((l) => l && l.filter((c) => c.id !== id)); }}
        aoTentarDeNovo={tentaDeNovo}
      />
      <ListaPessoas
        pessoas={pessoas}
        erro={erroPessoas}
        aoTrocar={(id, papel) => setPessoas((l) => l && l.map((p) => (p.user_id === id ? { ...p, papel } : p)))}
        aoRemover={(id) => setPessoas((l) => l && l.filter((p) => p.user_id !== id))}
        aoTentarDeNovo={tentaDeNovo}
      />
      <SairDoMandato pessoas={pessoas} />
    </>
  );
}
