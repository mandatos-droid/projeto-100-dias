'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { partesBrasilia } from '../../../lib/admin/escala.ts';
import { semAcento } from '../../../lib/admin/mandatos.ts';
import { EMAIL_INVALIDO, emailValido, mensagemDe, SEM_CONTA } from '../../../lib/admin/mensagens.ts';
import Casca from '../_componentes/Casca.tsx';
import Dialogo from '../_componentes/Dialogo.tsx';
import Sessao, { useAdmin, type Papel } from '../_componentes/Sessao.tsx';

// Retorno de admin_equipe() (migration 20261105120000).
interface Pessoa { user_id: string; nome: string | null; email: string | null; papel: Papel; criado_em: string }

const PAPEIS: Papel[] = ['leitura', 'admin'];

function dataBr(iso: string): string {
  const { ano, mes, dia } = partesBrasilia(iso);
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
}

type Estado = { carga: 'carregando' } | { carga: 'erro'; mensagem: string } | { carga: 'ok'; pessoas: Pessoa[] };
type Aberto = null | { tipo: 'incluir' } | { tipo: 'remover'; pessoa: Pessoa };

function IncluirPessoa({ onFechar, onFeito }: { onFechar: () => void; onFeito: () => void }) {
  const { api } = useAdmin();
  const [email, setEmail] = useState('');
  const [papel, setPapel] = useState<Papel>('leitura');
  const [erro, setErro] = useState('');

  async function incluir() {
    const digitado = email.trim();
    if (!emailValido(digitado)) { setErro(EMAIL_INVALIDO); return; } // formato inválido nem chega ao banco
    setErro('');
    try {
      const achados = await api.rpc<{ user_id: string }[] | null>('admin_buscar_usuario', { p_email: digitado });
      if (!achados?.length) { setErro(SEM_CONTA); return; }
      await api.rpc('admin_equipe_incluir', { p_user: achados[0].user_id, p_papel: papel });
      onFeito();
    } catch (e) {
      setErro(mensagemDe(e)); // "já está na equipe" e "papel inválido" vêm prontas do banco
    }
  }

  return (
    <Dialogo titulo="Incluir pessoa na equipe" onFechar={onFechar} erro={erro} confirmar={{ rotulo: 'Incluir', executar: incluir }}>
      <label>E-mail da pessoa
        <input className="in" type="text" inputMode="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <p className="hint">A pessoa precisa ter entrado na plataforma uma vez.</p>
      <label>Papel
        <select className="in" value={papel} onChange={(e) => setPapel(e.target.value as Papel)}>
          {PAPEIS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
    </Dialogo>
  );
}

function RemoverPessoa({ pessoa, onFechar, onFeito, onFalha }: { pessoa: Pessoa; onFechar: () => void; onFeito: () => void; onFalha: () => void }) {
  const { api } = useAdmin();
  const [erro, setErro] = useState('');

  async function remover() {
    setErro('');
    try {
      await api.rpc('admin_equipe_remover', { p_user: pessoa.user_id });
      onFeito();
    } catch (e) {
      setErro(mensagemDe(e));
      onFalha(); // a lista pode ter mudado por outro admin: atualiza ao fundo
    }
  }

  return (
    <Dialogo titulo="Remover pessoa da equipe" onFechar={onFechar} erro={erro} confirmar={{ rotulo: 'Remover', executar: remover, perigo: true }}>
      <p className="hint"><b>{pessoa.nome || pessoa.email}</b> perde o acesso ao painel. A conta dela na plataforma continua.</p>
    </Dialogo>
  );
}

function ListaEquipe() {
  const { api, papel, usuarioId } = useAdmin();
  const [estado, setEstado] = useState<Estado>({ carga: 'carregando' });
  const [busca, setBusca] = useState('');
  const [aviso, setAviso] = useState('');
  const [aberto, setAberto] = useState<Aberto>(null);
  const admin = papel === 'admin';

  // `silencioso` atualiza a lista depois de uma escrita sem piscar "Carregando…".
  const carrega = useCallback(async (silencioso = false) => {
    if (!silencioso) setEstado({ carga: 'carregando' });
    try {
      const pessoas = await api.rpc<Pessoa[] | null>('admin_equipe');
      // o banco já ordena; reordenar aqui garante a regra mesmo se a ordem mudar
      const ordenadas = [...(pessoas ?? [])].sort((a, b) => a.criado_em.localeCompare(b.criado_em));
      setEstado({ carga: 'ok', pessoas: ordenadas });
    } catch (e) {
      setEstado({ carga: 'erro', mensagem: mensagemDe(e) });
    }
  }, [api]);
  useEffect(() => { carrega(); }, [carrega]);

  const pessoas = estado.carga === 'ok' ? estado.pessoas : [];
  const visiveis = useMemo(() => {
    const termo = semAcento(busca).toLowerCase().trim();
    if (!termo) return pessoas;
    return pessoas.filter((p) => semAcento(`${p.nome ?? ''} ${p.email ?? ''}`).toLowerCase().includes(termo));
  }, [pessoas, busca]);

  async function trocaPapel(p: Pessoa, novo: Papel) {
    setAviso('');
    try {
      await api.rpc('admin_equipe_papel', { p_user: p.user_id, p_papel: novo });
      // quem muda o próprio papel precisa ver a tela já no papel novo (menus e botões vêm do papel da sessão)
      if (p.user_id === usuarioId) { location.reload(); return; }
    } catch (e) {
      setAviso(mensagemDe(e));
    }
    await carrega(true); // sucesso mostra o novo papel; falha devolve o seletor ao valor real
  }

  if (estado.carga === 'erro') {
    return (
      <div className="vazio">
        <div className="aviso" role="alert">{estado.mensagem}</div>
        <button type="button" className="btn pri" onClick={() => carrega()}>Tentar de novo</button>
      </div>
    );
  }

  return (
    <>
      <div className="bar">
        <input className="in" style={{ flex: 1, minWidth: 160 }} placeholder="Buscar por nome ou e-mail" aria-label="Buscar na equipe"
          value={busca} onChange={(e) => setBusca(e.target.value)} />
        {admin && <button type="button" className="btn pri" onClick={() => setAberto({ tipo: 'incluir' })}>+ Incluir pessoa</button>}
      </div>
      {aviso && <div className="aviso" role="alert">{aviso}</div>}

      {estado.carga === 'carregando' ? (
        <p className="carregando" role="status">Carregando…</p>
      ) : visiveis.length === 0 ? (
        <div className="vazio"><p>Nenhuma pessoa encontrada</p></div>
      ) : (
        <div className="rolagem">
          <table>
            <thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Desde</th><th></th></tr></thead>
            <tbody>
              {visiveis.map((p) => {
                const nome = p.nome || p.email || 'sem nome';
                const euMesmo = p.user_id === usuarioId;
                return (
                  <tr key={p.user_id}>
                    <td>{nome}{euMesmo && <> <span className="legend">(você)</span></>}</td>
                    <td className="mono">{p.email ?? '—'}</td>
                    <td>
                      <select className="in" aria-label={`Papel de ${nome}`} value={p.papel} disabled={!admin}
                        onChange={(e) => trocaPapel(p, e.target.value as Papel)}>
                        {PAPEIS.map((x) => <option key={x} value={x}>{x}</option>)}
                      </select>
                    </td>
                    <td>{dataBr(p.criado_em)}</td>
                    <td>
                      {admin && !euMesmo && (
                        <button type="button" className="btn sm bad" aria-label={`Remover ${nome}`} onClick={() => setAberto({ tipo: 'remover', pessoa: p })}>Remover</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="legend"><b>admin</b>: vê tudo e gerencia a equipe e os mandatos. <b>leitura</b>: vê tudo, não altera nada.</p>

      {aberto?.tipo === 'incluir' && (
        <IncluirPessoa onFechar={() => setAberto(null)} onFeito={() => { setAberto(null); carrega(true); }} />
      )}
      {aberto?.tipo === 'remover' && (
        <RemoverPessoa pessoa={aberto.pessoa} onFechar={() => setAberto(null)} onFeito={() => { setAberto(null); carrega(true); }} onFalha={() => carrega(true)} />
      )}
    </>
  );
}

export default function Equipe() {
  return (
    <Sessao>
      <Casca tela="equipe" titulo="Equipe Legisla">
        <ListaEquipe />
      </Casca>
    </Sessao>
  );
}
