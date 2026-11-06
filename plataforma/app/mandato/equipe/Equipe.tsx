'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { convitesPendentes, equipeDoMandato, type ConvitePendente, type PessoaEquipe } from '../../../lib/convites/api.ts';
import { mensagemDe } from '../../../lib/convites/erros.ts';
import { useMandato } from '../contexto.ts';
import FormularioConvite from './FormularioConvite.tsx';
import ListaConvites from './ListaConvites.tsx';

// Tela Equipe e convites: formulário, convites pendentes e pessoas, nesta ordem (ACE-04.1).
export default function Equipe() {
  const { api, mandato, usuario } = useMandato();
  const [pessoas, setPessoas] = useState<PessoaEquipe[] | null>(null);
  const [pendentes, setPendentes] = useState<ConvitePendente[] | null>(null);
  const [erroPendentes, setErroPendentes] = useState<string | null>(null);
  const leitura = useRef(0); // só a leitura mais recente vale: um convite gerado durante a carga inicial não some

  const carregaPendentes = useCallback(async () => {
    const minha = ++leitura.current;
    try {
      const l = await convitesPendentes(api, mandato.id);
      if (minha === leitura.current) { setPendentes(l); setErroPendentes(null); }
    } catch (e) {
      if (minha === leitura.current) setErroPendentes(mensagemDe(e));
    }
  }, [api, mandato.id]);

  useEffect(() => {
    let vivo = true;
    equipeDoMandato(api, mandato.id).then(
      (l) => { if (vivo) setPessoas(l); },
      () => { /* sem a lista, a mensagem pronta usa um nome genérico para quem convida */ },
    );
    carregaPendentes();
    return () => { vivo = false; leitura.current++; };
  }, [api, mandato.id, carregaPendentes]);

  const meuNome = pessoas?.find((p) => p.user_id === usuario.id)?.nome ?? null;

  return (
    <>
      <div className="md-pilha">
        <h1>Equipe e convites</h1>
        <p className="md-mut">Todas as pessoas da equipe podem convidar outras.</p>
      </div>
      <FormularioConvite meuNome={meuNome} aoCriar={carregaPendentes} />
      <ListaConvites
        convites={pendentes}
        erro={erroPendentes}
        aoCancelar={(id) => { leitura.current++; setPendentes((l) => l && l.filter((c) => c.id !== id)); }}
      />
    </>
  );
}
