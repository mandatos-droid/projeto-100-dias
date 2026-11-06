'use client';

import { useState } from 'react';
import { cancelaConvite, type ConvitePendente } from '../../../lib/convites/api.ts';
import { mensagemDe } from '../../../lib/convites/erros.ts';
import { PAPEIS, rotuloPapel, type Papel } from '../../../lib/convites/papeis.ts';
import { iniciais, useMandato } from '../contexto.ts';

const CORES = ['a', 'b', 'c', 'd'];
const DIA_MS = 86_400_000;

// Dias que faltam, arredondados para cima: enquanto o convite está pendente nunca aparece "0 dias".
function expiraEm(expiraIso: string, agora: Date): string {
  const faltam = Math.max(1, Math.ceil((new Date(expiraIso).getTime() - agora.getTime()) / DIA_MS) || 1);
  return `expira em ${faltam} ${faltam === 1 ? 'dia' : 'dias'}`;
}

interface Props {
  convites: ConvitePendente[] | null;
  /** Mensagem da falha ao ler a lista. */
  erro: string | null;
  /** Chamado depois que o banco cancelou: a tela tira o convite da lista sem recarregar. */
  aoCancelar: (id: string) => void;
}

export default function ListaConvites({ convites, erro, aoCancelar }: Props) {
  const { api } = useMandato();
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [recusa, setRecusa] = useState<{ id: string; mensagem: string } | null>(null);

  async function cancela(id: string) {
    if (cancelando) return;
    setCancelando(id);
    setRecusa(null);
    try {
      await cancelaConvite(api, id);
      aoCancelar(id);
    } catch (e) {
      setRecusa({ id, mensagem: mensagemDe(e) });
    } finally {
      setCancelando(null);
    }
  }

  const agora = new Date();
  return (
    <section className="md-card md-pendentes" aria-labelledby="md-pendentes-t">
      <div className="md-linha">
        <h2 id="md-pendentes-t">Convites pendentes</h2>
        {convites && <span className="md-pilula" aria-label={`${convites.length} pendentes`}>{convites.length}</span>}
      </div>
      {erro && <div className="md-aviso" role="alert">{erro}</div>}
      {convites && convites.length === 0 && <p className="md-mut">Nenhum convite pendente.</p>}
      {convites && convites.length > 0 && (
        <ul className="md-lista">
          {convites.map((c, i) => (
            <li key={c.id}>
              <span className={`md-av md-av--${CORES[i % CORES.length]}`} aria-hidden="true">{iniciais(c.nome)}</span>
              <span className="md-cresce">
                <strong>{c.nome}</strong>
                <span className="md-mut">
                  {PAPEIS.includes(c.papel as Papel) ? rotuloPapel(c.papel) : c.papel}
                  {' · '}enviado por {c.convidado_por_nome || 'alguém da equipe'}
                  {' · '}{expiraEm(c.expira_em, agora)}
                </span>
              </span>
              <button
                type="button"
                className="md-bt md-bt--peq md-bt--perigo"
                onClick={() => cancela(c.id)}
                disabled={cancelando !== null}
                aria-label={`Cancelar convite de ${c.nome}`}
              >
                Cancelar
              </button>
              {recusa?.id === c.id && <div className="md-aviso md-linha-cheia" role="alert">{recusa.mensagem}</div>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
