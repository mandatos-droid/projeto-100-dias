'use client';

import { useState } from 'react';
import { removeMembro, trocaPapel, type PessoaEquipe } from '../../../lib/convites/api.ts';
import { mensagemDe } from '../../../lib/convites/erros.ts';
import { PAPEIS, podeGerirEquipe, rotuloPapel, type Papel } from '../../../lib/convites/papeis.ts';
import { iniciais, useMandato } from '../contexto.ts';

const CORES = ['a', 'b', 'c', 'd'];

const papelTxt = (p: string) => (PAPEIS.includes(p as Papel) ? rotuloPapel(p as Papel) : p);
const nomeDe = (p: PessoaEquipe) => p.nome?.trim() || p.email || 'Pessoa sem nome';

interface Props {
  pessoas: PessoaEquipe[] | null;
  /** Mensagem da falha ao ler a lista. */
  erro: string | null;
  /** O banco trocou o papel: a tela atualiza a lista sem recarregar. */
  aoTrocar: (userId: string, papel: Papel) => void;
  /** O banco removeu a pessoa do mandato (a conta dela continua na plataforma). */
  aoRemover: (userId: string) => void;
  /** Lê a lista de novo depois de uma falha ("Tentar de novo"). */
  aoTentarDeNovo?: () => void;
}

export default function ListaPessoas({ pessoas, erro, aoTrocar, aoRemover, aoTentarDeNovo }: Props) {
  const { api, mandato, usuario, papel } = useMandato();
  const gere = podeGerirEquipe(papel);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [recusa, setRecusa] = useState<{ id: string; mensagem: string } | null>(null);

  async function troca(p: PessoaEquipe, novo: Papel) {
    if (ocupado || novo === p.papel) return;
    setOcupado(p.user_id);
    setRecusa(null);
    try {
      await trocaPapel(api, mandato.id, p.user_id, novo);
      aoTrocar(p.user_id, novo);
    } catch (e) {
      setRecusa({ id: p.user_id, mensagem: mensagemDe(e) }); // a lista não muda: o seletor volta ao papel de antes
    } finally {
      setOcupado(null);
    }
  }

  async function remove(p: PessoaEquipe) {
    if (ocupado) return;
    setOcupado(p.user_id);
    setRecusa(null);
    try {
      await removeMembro(api, mandato.id, p.user_id);
      setConfirmando(null);
      aoRemover(p.user_id);
    } catch (e) {
      setConfirmando(null);
      setRecusa({ id: p.user_id, mensagem: mensagemDe(e) });
    } finally {
      setOcupado(null);
    }
  }

  return (
    <section className="md-card md-pessoas" aria-labelledby="md-pessoas-t">
      <div className="md-linha">
        <h2 id="md-pessoas-t">Pessoas neste mandato</h2>
        {pessoas && <span className="md-pilula md-pilula--neutra" aria-label={`${pessoas.length} pessoas`}>{pessoas.length}</span>}
      </div>
      {erro && <div className="md-aviso" role="alert">{erro}</div>}
      {erro && aoTentarDeNovo && (
        <div><button type="button" className="md-bt md-bt--peq" onClick={aoTentarDeNovo}>Tentar de novo</button></div>
      )}
      {pessoas && (
        <ul className="md-lista">
          {pessoas.map((p, i) => {
            const eu = p.user_id === usuario.id;
            const nome = nomeDe(p);
            return (
              <li key={p.user_id}>
                <span className={`md-av md-av--${CORES[i % CORES.length]}`} aria-hidden="true">{iniciais(p.nome || p.email)}</span>
                <span className="md-cresce">
                  <span>
                    <strong>{nome}</strong>
                    {eu && <> <span className="md-voce">você</span></>}
                  </span>
                  {p.email && <span className="md-mut">{p.email}</span>}
                </span>
                {gere && !eu ? (
                  <>
                    <select
                      value={p.papel}
                      onChange={(e) => troca(p, e.target.value as Papel)}
                      disabled={ocupado !== null}
                      aria-label={`Papel de ${nome}`}
                    >
                      {PAPEIS.map((x) => <option key={x} value={x}>{rotuloPapel(x)}</option>)}
                    </select>
                    <button
                      type="button"
                      className="md-bt md-bt--peq md-bt--perigo"
                      onClick={() => { setRecusa(null); setConfirmando(p.user_id); }}
                      disabled={ocupado !== null}
                      aria-label={`Remover ${nome}`}
                    >
                      Remover
                    </button>
                  </>
                ) : (
                  <span className="md-papel-txt">{papelTxt(p.papel)}</span>
                )}
                {confirmando === p.user_id && (
                  <div className="md-confirma md-linha-cheia" role="group" aria-label={`Confirmar a remoção de ${nome}`}>
                    <p>Remover {nome} do mandato? A conta dela continua na plataforma, só sai deste mandato.</p>
                    <div className="md-linha md-linha--botoes">
                      <button type="button" className="md-bt md-bt--peq md-bt--perigo" onClick={() => remove(p)} disabled={ocupado !== null}>Confirmar remoção</button>
                      <button type="button" className="md-bt md-bt--peq" onClick={() => setConfirmando(null)} disabled={ocupado !== null}>Não remover</button>
                    </div>
                  </div>
                )}
                {recusa?.id === p.user_id && <div className="md-aviso md-linha-cheia" role="alert">{recusa.mensagem}</div>}
              </li>
            );
          })}
        </ul>
      )}
      <p className="md-mut">A equipe da Legisla acompanha este mandato, conforme o cadastro.</p>
    </section>
  );
}
