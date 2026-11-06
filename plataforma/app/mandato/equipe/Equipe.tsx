'use client';

import { useEffect, useState } from 'react';
import { equipeDoMandato, type PessoaEquipe } from '../../../lib/convites/api.ts';
import { useMandato } from '../contexto.ts';
import FormularioConvite from './FormularioConvite.tsx';

// Tela Equipe e convites: formulário, convites pendentes e pessoas, nesta ordem (ACE-04.1).
export default function Equipe() {
  const { api, mandato, usuario } = useMandato();
  const [pessoas, setPessoas] = useState<PessoaEquipe[] | null>(null);

  useEffect(() => {
    let vivo = true;
    equipeDoMandato(api, mandato.id).then(
      (l) => { if (vivo) setPessoas(l); },
      () => { /* sem a lista, a mensagem pronta usa um nome genérico para quem convida */ },
    );
    return () => { vivo = false; };
  }, [api, mandato.id]);

  const meuNome = pessoas?.find((p) => p.user_id === usuario.id)?.nome ?? null;

  return (
    <>
      <div className="md-pilha">
        <h1>Equipe e convites</h1>
        <p className="md-mut">Todas as pessoas da equipe podem convidar outras.</p>
      </div>
      <FormularioConvite meuNome={meuNome} />
    </>
  );
}
