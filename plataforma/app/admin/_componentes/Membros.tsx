'use client';

import { useCallback, useEffect, useState } from 'react';
import { partesBrasilia } from '../../../lib/admin/escala.ts';
import { EMAIL_INVALIDO, emailValido, mensagemDe, SEM_CONTA } from '../../../lib/admin/mensagens.ts';
import Dialogo from './Dialogo.tsx';
import { useAdmin } from './Sessao.tsx';

// Retorno de admin_membros(p_mandato) (migration 20261105140000).
type PapelMembro = 'coordenacao' | 'assessoria'; // os dois que o Guia grava
interface Membro { user_id: string; nome: string | null; email: string | null; papel: PapelMembro; criado_em: string }

const PAPEIS: PapelMembro[] = ['assessoria', 'coordenacao'];

function dataBr(iso: string): string {
  const { ano, mes, dia } = partesBrasilia(iso);
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
}

type Estado = { carga: 'carregando' } | { carga: 'erro'; mensagem: string } | { carga: 'ok'; membros: Membro[] };
type Aberto = null | { tipo: 'adicionar' } | { tipo: 'remover'; membro: Membro };

function AdicionarMembro({ mandatoId, onFechar, onFeito }: { mandatoId: string; onFechar: () => void; onFeito: () => void }) {
  const { api } = useAdmin();
  const [email, setEmail] = useState('');
  const [papel, setPapel] = useState<PapelMembro>('assessoria');
  const [erro, setErro] = useState('');

  async function adicionar() {
    const digitado = email.trim();
    if (!emailValido(digitado)) { setErro(EMAIL_INVALIDO); return; }
    setErro('');
    try {
      const achados = await api.rpc<{ user_id: string }[] | null>('admin_buscar_usuario', { p_email: digitado });
      if (!achados?.length) { setErro(SEM_CONTA); return; } // mesma mensagem da Equipe
      await api.rpc('admin_membro_adicionar', { p_mandato: mandatoId, p_user: achados[0].user_id, p_papel: papel });
      onFeito();
    } catch (e) {
      setErro(mensagemDe(e)); // "já é membro deste mandato" vem pronta do banco
    }
  }

  return (
    <Dialogo titulo="Adicionar membro" onFechar={onFechar} erro={erro} confirmar={{ rotulo: 'Adicionar', executar: adicionar }}>
      <label>E-mail da pessoa
        <input className="in" type="text" inputMode="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>Papel no mandato
        <select className="in" value={papel} onChange={(e) => setPapel(e.target.value as PapelMembro)}>
          {PAPEIS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
    </Dialogo>
  );
}

function RemoverMembro({ mandatoId, membro, onFechar, onFeito, onFalha }: { mandatoId: string; membro: Membro; onFechar: () => void; onFeito: () => void; onFalha: () => void }) {
  const { api } = useAdmin();
  const [erro, setErro] = useState('');

  async function remover() {
    setErro('');
    try {
      await api.rpc('admin_membro_remover', { p_mandato: mandatoId, p_user: membro.user_id });
      onFeito();
    } catch (e) {
      setErro(mensagemDe(e)); // inclui "O mandato precisa de ao menos uma pessoa na coordenação."
      onFalha();
    }
  }

  return (
    <Dialogo titulo="Remover membro" onFechar={onFechar} erro={erro} confirmar={{ rotulo: 'Remover', executar: remover, perigo: true }}>
      <p className="hint"><b>{membro.nome || membro.email}</b> deixa de acessar este mandato. A conta e o que a pessoa escreveu continuam.</p>
    </Dialogo>
  );
}

// Tabela de membros do mandato. Leitura vê a lista; só admin vê os botões e troca o papel.
export default function Membros({ mandatoId, onMudou }: { mandatoId: string; onMudou?: () => void }) {
  const { api, papel } = useAdmin();
  const [estado, setEstado] = useState<Estado>({ carga: 'carregando' });
  const [aviso, setAviso] = useState('');
  const [aberto, setAberto] = useState<Aberto>(null);
  const admin = papel === 'admin';

  const carrega = useCallback(async (silencioso = false) => {
    if (!silencioso) setEstado({ carga: 'carregando' });
    try {
      const membros = await api.rpc<Membro[] | null>('admin_membros', { p_mandato: mandatoId });
      setEstado({ carga: 'ok', membros: [...(membros ?? [])].sort((a, b) => a.criado_em.localeCompare(b.criado_em)) });
    } catch (e) {
      setEstado({ carga: 'erro', mensagem: mensagemDe(e) });
    }
  }, [api, mandatoId]);
  useEffect(() => { carrega(); }, [carrega]);

  // depois de escrever: atualiza a lista e avisa a tela (a contagem de membros do cadastro muda)
  async function atualiza() { await carrega(true); onMudou?.(); }

  async function trocaPapel(m: Membro, novo: PapelMembro) {
    setAviso('');
    try {
      await api.rpc('admin_membro_papel', { p_mandato: mandatoId, p_user: m.user_id, p_papel: novo });
    } catch (e) {
      setAviso(mensagemDe(e));
    }
    await atualiza(); // falha devolve o seletor ao valor real
  }

  if (estado.carga === 'erro') {
    return (
      <div className="card">
        <h3>Membros</h3>
        <div className="aviso" role="alert">{estado.mensagem}</div>
        <div><button type="button" className="btn pri" onClick={() => carrega()}>Tentar de novo</button></div>
      </div>
    );
  }

  const membros = estado.carga === 'ok' ? estado.membros : [];
  return (
    <div className="card">
      <div className="top">
        <h3>Membros{estado.carga === 'ok' ? ` (${membros.length})` : ''}</h3>
        {admin && <button type="button" className="btn sm pri" onClick={() => setAberto({ tipo: 'adicionar' })}>+ Adicionar membro</button>}
      </div>
      {aviso && <div className="aviso" role="alert">{aviso}</div>}
      {estado.carga === 'carregando' ? (
        <p className="carregando" role="status">Carregando…</p>
      ) : membros.length === 0 ? (
        <p className="legend">Este mandato não tem membros.</p>
      ) : (
        <div className="rolagem">
          <table style={{ minWidth: 520 }}>
            <thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Desde</th><th></th></tr></thead>
            <tbody>
              {membros.map((m) => {
                const nome = m.nome || m.email || 'sem nome';
                return (
                  <tr key={m.user_id}>
                    <td>{nome}</td>
                    <td className="mono">{m.email ?? '—'}</td>
                    <td>
                      <select className="in" aria-label={`Papel de ${nome} no mandato`} value={m.papel} disabled={!admin}
                        onChange={(e) => trocaPapel(m, e.target.value as PapelMembro)}>
                        {PAPEIS.map((x) => <option key={x} value={x}>{x}</option>)}
                      </select>
                    </td>
                    <td>{dataBr(m.criado_em)}</td>
                    <td>
                      {admin && <button type="button" className="btn sm bad" aria-label={`Remover ${nome}`} onClick={() => setAberto({ tipo: 'remover', membro: m })}>Remover</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {aberto?.tipo === 'adicionar' && (
        <AdicionarMembro mandatoId={mandatoId} onFechar={() => setAberto(null)} onFeito={() => { setAberto(null); atualiza(); }} />
      )}
      {aberto?.tipo === 'remover' && (
        <RemoverMembro mandatoId={mandatoId} membro={aberto.membro} onFechar={() => setAberto(null)} onFeito={() => { setAberto(null); atualiza(); }} onFalha={() => carrega(true)} />
      )}
    </div>
  );
}
