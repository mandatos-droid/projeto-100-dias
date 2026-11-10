'use client';

import { useEffect, useState } from 'react';
import { convitesPendentes, equipeDoMandato, type PessoaEquipe } from '../../lib/convites/api.ts';
import { mensagemDe } from '../../lib/convites/erros.ts';
import { iniciais, useMandato } from './contexto.ts';

const AVATARES = 3;
const CORES = ['a', 'b', 'c', 'd'];

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

// Resumo da equipe na Área do mandato: até 3 avatares, total de pessoas, convites pendentes e atalho para convidar.
// `convidar`: destino do atalho dentro do Guia (a aba Equipe, por hash, sem recarregar).
export default function ResumoEquipe({ convidar }: { convidar: string }) {
  const { api, mandato } = useMandato();
  const [pessoas, setPessoas] = useState<PessoaEquipe[] | null>(null);
  const [pendentes, setPendentes] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let vivo = true;
    Promise.all([equipeDoMandato(api, mandato.id), convitesPendentes(api, mandato.id)]).then(
      ([p, c]) => { if (vivo) { setPessoas(p); setPendentes(c.length); } },
      (e) => { if (vivo) setErro(mensagemDe(e)); },
    );
    return () => { vivo = false; };
  }, [api, mandato.id, tentativa]);

  return (
    <section className="md-card md-resumo" aria-labelledby="md-resumo-t">
      <div className="md-linha">
        <h2 id="md-resumo-t">Quem trabalha neste mandato</h2>
      </div>
      {erro && <div className="md-aviso" role="alert">{erro}</div>}
      {erro && (
        <div><button type="button" className="md-bt" onClick={() => { setErro(null); setTentativa((n) => n + 1); }}>Tentar de novo</button></div>
      )}
      <div className="md-linha md-resumo-corpo">
        {pessoas && (
          <>
            <span className="md-avatares">
              {pessoas.slice(0, AVATARES).map((p, i) => (
                <span key={p.user_id} className={`md-av md-av--${CORES[i % CORES.length]}`} aria-hidden="true">
                  {iniciais(p.nome || p.email)}
                </span>
              ))}
            </span>
            <span className="md-mut md-cresce">
              {plural(pessoas.length, 'pessoa', 'pessoas')} · {plural(pendentes ?? 0, 'convite pendente', 'convites pendentes')}
            </span>
          </>
        )}
        <a className="md-bt md-bt--pri md-bt--peq" href={convidar}>Convidar pessoa</a>
      </div>
    </section>
  );
}
