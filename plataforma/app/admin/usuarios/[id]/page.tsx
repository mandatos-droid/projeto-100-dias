'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { mensagemDe } from '../../../../lib/admin/mensagens.ts';
import {
  ehUuid, lerConsulta, montaConsulta, rotuloData, rotuloPapelMandato, rotulosPerfil, rotuloUltimoAcesso, type DetalheUsuario,
} from '../../../../lib/admin/usuarios.ts';
import Casca from '../../_componentes/Casca.tsx';
import Sessao, { useAdmin } from '../../_componentes/Sessao.tsx';

// Só leitura (USR-02): nenhum botão altera dado e não há exportação. Única leitura: admin_usuario_detalhe.
type Estado =
  | { carga: 'carregando' }
  | { carga: 'erro'; mensagem: string }
  | { carga: 'inexistente' }
  | { carga: 'ok'; pessoa: DetalheUsuario };

function Detalhe() {
  const { api } = useAdmin();
  const { id } = useParams<{ id: string }>();
  // "Voltar" refaz a lista pela consulta recebida em de=, relida e remontada (só busca, filtros e página)
  const volta = montaConsulta(lerConsulta(useSearchParams().get('de') ?? ''));
  const hrefVolta = volta ? `/admin/usuarios?${volta}` : '/admin/usuarios';
  const [estado, setEstado] = useState<Estado>({ carga: 'carregando' });

  const carrega = useCallback(async () => {
    if (!ehUuid(id)) { setEstado({ carga: 'inexistente' }); return; } // id que não é uuid não existe
    setEstado({ carga: 'carregando' });
    try {
      const pessoa = await api.rpc<DetalheUsuario | null>('admin_usuario_detalhe', { p_user: id });
      setEstado(pessoa ? { carga: 'ok', pessoa } : { carga: 'inexistente' });
    } catch (e) {
      setEstado({ carga: 'erro', mensagem: mensagemDe(e) });
    }
  }, [api, id]);
  useEffect(() => { carrega(); }, [carrega]);

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
      <div className="grid2">
        <div className="card">
          <h3>Conta</h3>
          <dl className="kv">
            <dt>Nome</dt><dd>{p.nome ?? '—'}</dd>
            <dt>E-mail</dt><dd style={{ overflowWrap: 'anywhere' }}>{p.email ?? '—'}</dd>
            <dt>Cadastro</dt><dd>{rotuloData(p.criado_em)}</dd>
            <dt>Último acesso</dt><dd>{rotuloUltimoAcesso(p.ultimo_acesso)}</dd>
            {p.equipe_papel && <><dt>Equipe Legisla</dt><dd>{p.equipe_papel}</dd></>}
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
        <h3>Perfil</h3>
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
        <h3>Mandatos</h3>
        {p.mandatos.length ? (
          <div className="rolagem">
            <table>
              <thead><tr><th>Parlamentar</th><th>Cargo</th><th>UF</th><th>Papel</th></tr></thead>
              <tbody>
                {p.mandatos.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <Link href={`/admin/mandatos/${encodeURIComponent(m.id)}`}>{m.nome ?? 'Sem nome'}</Link>
                      {m.arquivado && <> <span className="pill mu">arquivado</span></>}
                    </td>
                    <td>{m.cargo ?? '—'}</td>
                    <td>{m.uf ?? '—'}</td>
                    <td>{rotuloPapelMandato(m.papel)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p>Esta pessoa não está em nenhum mandato.</p>}
      </div>
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
