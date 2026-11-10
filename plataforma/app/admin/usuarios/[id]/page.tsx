'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { mensagemDe } from '../../../../lib/admin/mensagens.ts';
import {
  ehUuid, lerConsulta, montaConsulta, rotuloData, rotuloPapelMandato, rotulosPerfil, rotuloUltimoAcesso, type DetalheUsuario,
} from '../../../../lib/admin/usuarios.ts';
import { opcoesPapelMandato } from '../../../../lib/admin/usuariosEdicao.ts';
import Casca from '../../_componentes/Casca.tsx';
import Sessao, { useAdmin } from '../../_componentes/Sessao.tsx';
import {
  AdicionarAoMandato, EditarEmail, EditarPerfil, ExcluirConta, IncluirNaEquipe, RemoverDaEquipe, RemoverDoMandato,
} from '../../_componentes/UsuarioEdicao.tsx';

// Leitura: admin_usuario_detalhe. Escrita (só admin; leitura nem vê os botões): e-mail, perfil, mandatos, equipe
// e exclusão da conta, todas por RPC com auditoria (20261110130000_admin_usuarios_crud.sql). Não há exportação.
type Estado =
  | { carga: 'carregando' }
  | { carga: 'erro'; mensagem: string }
  | { carga: 'inexistente' }
  | { carga: 'ok'; pessoa: DetalheUsuario };

type Aberto =
  | null
  | { tipo: 'email' } | { tipo: 'perfil' } | { tipo: 'adicionarMandato' } | { tipo: 'excluir' }
  | { tipo: 'removerMandato'; mandato: DetalheUsuario['mandatos'][number] }
  | { tipo: 'incluirEquipe' } | { tipo: 'removerEquipe' };

function Detalhe() {
  const { api, papel, usuarioId } = useAdmin();
  const admin = papel === 'admin';
  const [aberto, setAberto] = useState<Aberto>(null);
  const [aviso, setAviso] = useState('');
  const { id } = useParams<{ id: string }>();
  // "Voltar" refaz a lista pela consulta recebida em de=, relida e remontada (só busca, filtros e página)
  const volta = montaConsulta(lerConsulta(useSearchParams().get('de') ?? ''));
  const hrefVolta = volta ? `/admin/usuarios?${volta}` : '/admin/usuarios';
  const [estado, setEstado] = useState<Estado>({ carga: 'carregando' });

  // silencioso: depois de gravar, atualiza os dados sem trocar a tela por "Carregando"; falha vira aviso
  const carrega = useCallback(async (silencioso = false) => {
    if (!ehUuid(id)) { setEstado({ carga: 'inexistente' }); return; } // id que não é uuid não existe
    if (!silencioso) setEstado({ carga: 'carregando' });
    try {
      const pessoa = await api.rpc<DetalheUsuario | null>('admin_usuario_detalhe', { p_user: id });
      setEstado(pessoa ? { carga: 'ok', pessoa } : { carga: 'inexistente' });
    } catch (e) {
      if (silencioso) setAviso(mensagemDe(e));
      else setEstado({ carga: 'erro', mensagem: mensagemDe(e) });
    }
  }, [api, id]);
  useEffect(() => { carrega(); }, [carrega]);

  // depois de uma gravação: fecha o diálogo e atualiza; quem mexe no próprio papel na equipe recarrega a página
  const gravou = (propriaEquipe = false) => {
    setAberto(null);
    setAviso('');
    if (propriaEquipe && id === usuarioId) { window.location.reload(); return; }
    carrega(true);
  };
  async function trocaPapelMandato(mandatoId: string, novo: string) {
    setAviso('');
    try { await api.rpc('admin_membro_papel', { p_mandato: mandatoId, p_user: id, p_papel: novo }); } catch (e) { setAviso(mensagemDe(e)); }
    await carrega(true); // falha devolve o seletor ao valor real
  }
  async function trocaPapelEquipe(novo: string) {
    setAviso('');
    try {
      await api.rpc('admin_equipe_papel', { p_user: id, p_papel: novo });
      if (id === usuarioId) { window.location.reload(); return; }
    } catch (e) { setAviso(mensagemDe(e)); }
    await carrega(true);
  }

  const voltar = <div><Link href={hrefVolta} className="btn sm">← Voltar para Usuários</Link></div>;

  if (estado.carga !== 'ok') {
    return (
      <Casca tela="usuarios" titulo="Pessoa">
        {voltar}
        {estado.carga === 'carregando' && <p className="carregando" role="status">Carregando…</p>}
        {estado.carga === 'inexistente' && <div className="vazio"><p>Pessoa não encontrada.</p></div>}
        {estado.carga === 'erro' && (
          <div className="vazio">
            <div className="aviso" role="alert">{estado.mensagem}</div>
            <button type="button" className="btn pri" onClick={() => carrega()}>Tentar de novo</button>
          </div>
        )}
      </Casca>
    );
  }

  const p = estado.pessoa;
  const perfil = p.perfil ? rotulosPerfil(p.perfil) : null;
  return (
    <Casca tela="usuarios" titulo={p.nome ?? p.email ?? 'Pessoa'}>
      {voltar}
      {aviso && <div className="aviso" role="alert">{aviso}</div>}
      <div className="grid2">
        <div className="card">
          <div className="top">
            <h3>Conta</h3>
            {admin && <button type="button" className="btn sm" onClick={() => setAberto({ tipo: 'email' })}>Alterar e-mail</button>}
          </div>
          <dl className="kv">
            <dt>Nome</dt><dd>{p.nome ?? '—'}</dd>
            <dt>E-mail</dt><dd style={{ overflowWrap: 'anywhere' }}>{p.email ?? '—'}</dd>
            <dt>Cadastro</dt><dd>{rotuloData(p.criado_em)}</dd>
            <dt>Último acesso</dt><dd>{rotuloUltimoAcesso(p.ultimo_acesso)}</dd>
            <dt>Equipe Legisla</dt>
            <dd>
              {p.equipe_papel ? (
                admin ? (
                  <span className="bar">
                    <select className="in" aria-label="Papel na equipe Legisla" value={p.equipe_papel} onChange={(e) => trocaPapelEquipe(e.target.value)}>
                      {['leitura', 'admin'].map((x) => <option key={x} value={x}>{x}</option>)}
                    </select>
                    <button type="button" className="btn sm bad" onClick={() => setAberto({ tipo: 'removerEquipe' })}>Remover da equipe</button>
                  </span>
                ) : p.equipe_papel
              ) : (
                <>
                  Não faz parte
                  {admin && <> <button type="button" className="btn sm" onClick={() => setAberto({ tipo: 'incluirEquipe' })}>Incluir na equipe…</button></>}
                </>
              )}
            </dd>
          </dl>
        </div>
        <div className="card">
          <h3>Consentimento</h3>
          {p.consentimento ? (
            <dl className="kv">
              <dt>Versão</dt><dd>{p.consentimento.versao}</dd>
              <dt>Data</dt><dd>{rotuloData(p.consentimento.aceito_em)}</dd>
            </dl>
          ) : <p>Sem consentimento registrado</p>}
        </div>
      </div>

      <div className="card">
        <div className="top">
          <h3>Perfil</h3>
          {admin && p.perfil && <button type="button" className="btn sm" onClick={() => setAberto({ tipo: 'perfil' })}>Editar perfil</button>}
        </div>
        {perfil ? (
          <dl className="kv">
            <dt>Nome completo</dt><dd>{perfil.nome}</dd>
            <dt>Nascimento</dt><dd>{perfil.nascimento}</dd>
            <dt>Gênero</dt><dd>{perfil.genero}</dd>
            <dt>Raça</dt><dd>{perfil.raca}</dd>
            <dt>Telefone</dt><dd>{perfil.telefone}</dd>
            <dt>Atua na política</dt><dd>{perfil.atua}</dd>
            <dt>Tempo de atuação</dt><dd>{perfil.tempo}</dd>
          </dl>
        ) : <p>Esta pessoa ainda não preencheu o perfil.</p>}
      </div>

      <div className="card">
        <div className="top">
          <h3>Mandatos</h3>
          {admin && <button type="button" className="btn sm pri" onClick={() => setAberto({ tipo: 'adicionarMandato' })}>+ Adicionar a um mandato</button>}
        </div>
        {p.mandatos.length ? (
          <div className="rolagem">
            <table>
              <thead><tr><th>Parlamentar</th><th>Cargo</th><th>UF</th><th>Papel</th>{admin && <th></th>}</tr></thead>
              <tbody>
                {p.mandatos.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <Link href={`/admin/mandatos/${encodeURIComponent(m.id)}`}>{m.nome ?? 'Sem nome'}</Link>
                      {m.arquivado && <> <span className="pill mu">arquivado</span></>}
                    </td>
                    <td>{m.cargo ?? '—'}</td>
                    <td>{m.uf ?? '—'}</td>
                    <td>
                      {admin ? (
                        <select className="in" aria-label={`Papel em ${m.nome ?? 'mandato sem nome'}`} value={m.papel} onChange={(e) => trocaPapelMandato(m.id, e.target.value)}>
                          {opcoesPapelMandato(m.papel).map((x) => <option key={x} value={x}>{x}</option>)}
                        </select>
                      ) : rotuloPapelMandato(m.papel)}
                    </td>
                    {admin && (
                      <td>
                        <button type="button" className="btn sm bad" aria-label={`Remover do mandato ${m.nome ?? 'sem nome'}`} onClick={() => setAberto({ tipo: 'removerMandato', mandato: m })}>Remover</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p>Esta pessoa não está em nenhum mandato.</p>}
      </div>

      {admin && (
        <div className="card danger">
          <h3>Zona de risco</h3>
          {p.id === usuarioId ? (
            <p className="hint">Você não pode excluir a própria conta por aqui.</p>
          ) : (
            <>
              <div className="bar">
                <button type="button" className="btn sm bad" onClick={() => setAberto({ tipo: 'excluir' })}>Excluir conta definitivamente…</button>
              </div>
              <p className="hint">Apaga a conta, o perfil e o acesso a todos os mandatos. Não tem volta.</p>
            </>
          )}
        </div>
      )}

      {aberto?.tipo === 'email' && <EditarEmail pessoa={p} onFechar={() => setAberto(null)} onFeito={() => gravou()} />}
      {aberto?.tipo === 'perfil' && p.perfil && (
        <EditarPerfil pessoa={{ ...p, perfil: p.perfil }} onFechar={() => setAberto(null)} onFeito={() => gravou()} />
      )}
      {aberto?.tipo === 'adicionarMandato' && <AdicionarAoMandato pessoa={p} onFechar={() => setAberto(null)} onFeito={() => gravou()} />}
      {aberto?.tipo === 'removerMandato' && (
        <RemoverDoMandato pessoa={p} mandato={aberto.mandato} onFechar={() => setAberto(null)} onFeito={() => gravou()} />
      )}
      {aberto?.tipo === 'incluirEquipe' && <IncluirNaEquipe pessoa={p} onFechar={() => setAberto(null)} onFeito={() => gravou(true)} />}
      {aberto?.tipo === 'removerEquipe' && <RemoverDaEquipe pessoa={p} onFechar={() => setAberto(null)} onFeito={() => gravou(true)} />}
      {aberto?.tipo === 'excluir' && <ExcluirConta pessoa={p} onFechar={() => setAberto(null)} />}
    </Casca>
  );
}

export default function DetalheUsuarioPagina() {
  return (
    <Sessao>
      {/* useSearchParams pede um Suspense acima (exigência do build do Next) */}
      <Suspense fallback={<p className="carregando" role="status">Carregando…</p>}>
        <Detalhe />
      </Suspense>
    </Sessao>
  );
}
