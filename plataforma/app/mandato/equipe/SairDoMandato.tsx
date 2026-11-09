'use client';

import { useState } from 'react';
import { saiDoMandato, type PessoaEquipe } from '../../../lib/convites/api.ts';
import { mensagemDe } from '../../../lib/convites/erros.ts';
import { nomeDoMandato, useMandato } from '../contexto.ts';

const CHAVE_MANDATO = 'legisla.mandatoAtual'; // a mesma do Guia: sem ela, o Guia abre outro mandato ou o primeiro acesso
const UNICA_COORDENACAO = 'Você é a única pessoa na coordenação. Promova outra pessoa para a Coordenação antes de sair.';

interface Props {
  /** Pessoas do mandato como a tela as mostra (nulo enquanto carrega ou se a leitura falhou). */
  pessoas: PessoaEquipe[] | null;
}

// Sair do mandato, em qualquer papel (ACE-03.9, ACE-04.14 a 04.18). Fica fora da lista de pessoas.
export default function SairDoMandato({ pessoas }: Props) {
  const { api, mandato, usuario, papel } = useMandato();
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  // com a lista na tela, a orientação vem antes do banco; sem a lista, quem decide é o banco
  const unica = papel === 'coordenacao' && pessoas !== null
    && !pessoas.some((p) => p.user_id !== usuario.id && p.papel === 'coordenacao');

  function pede() {
    setAviso(null);
    if (unica) { setConfirmando(false); setAviso(UNICA_COORDENACAO); return; }
    setConfirmando(true);
  }

  async function sai() {
    if (ocupado) return;
    setOcupado(true);
    setAviso(null);
    try {
      await saiDoMandato(api, mandato.id);
    } catch (e) {
      setConfirmando(false);
      setAviso(mensagemDe(e));
      setOcupado(false);
      return;
    }
    try { localStorage.removeItem(CHAVE_MANDATO); } catch { /* sem armazenamento: o Guia não acha o mandato e abre outro */ }
    window.location.assign('/guia'); // os botões seguem travados até a página trocar
  }

  return (
    <section className="md-card md-pilha" aria-label="Sair do mandato">
      <div className="md-linha">
        <p className="md-mut md-cresce">Você pode sair deste mandato. A sua conta continua na plataforma.</p>
        <button type="button" className="md-bt md-bt--peq md-bt--perigo" onClick={pede} disabled={ocupado}>Sair do mandato</button>
      </div>
      {confirmando && (
        <div className="md-confirma" role="group" aria-label="Confirmar a saída do mandato">
          <p>Sair de {nomeDoMandato(mandato)}? Você deixa de ver este mandato e, para voltar, precisa de um link de convite.</p>
          <div className="md-linha md-linha--botoes">
            <button type="button" className="md-bt md-bt--peq md-bt--perigo" onClick={sai} disabled={ocupado}>Confirmar saída</button>
            <button type="button" className="md-bt md-bt--peq" onClick={() => setConfirmando(false)} disabled={ocupado}>Não sair</button>
          </div>
        </div>
      )}
      {aviso && <div className="md-aviso" role="alert">{aviso}</div>}
    </section>
  );
}
