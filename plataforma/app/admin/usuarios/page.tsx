'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mensagemDe } from '../../../lib/admin/mensagens.ts';
import {
  argumentosLista, lerConsulta, marcaPessoa, montaConsulta, paginas, rotuloData, rotuloMandato, rotuloUltimoAcesso,
  type Consulta, type ListaUsuarios,
} from '../../../lib/admin/usuarios.ts';
import Casca from '../_componentes/Casca.tsx';
import Sessao, { useAdmin } from '../_componentes/Sessao.tsx';

// Só leitura (USR-01): a lista vem de admin_usuarios e nunca traz gênero, raça, nascimento nem telefone.
type Estado = { carga: 'carregando' } | { carga: 'erro'; mensagem: string } | { carga: 'ok'; lista: ListaUsuarios };

const enderecoLista = (c: Consulta) => {
  const qs = montaConsulta(c);
  return qs ? `/admin/usuarios?${qs}` : '/admin/usuarios';
};
// o detalhe recebe a consulta da lista em `de=`, para o "Voltar" refazer a mesma lista
const enderecoDetalhe = (id: string, c: Consulta) => {
  const de = montaConsulta(c);
  return `/admin/usuarios/${encodeURIComponent(id)}${de ? `?de=${encodeURIComponent(de)}` : ''}`;
};

function Lista() {
  const { api } = useAdmin();
  const router = useRouter();
  const qs = useSearchParams().toString();
  const consulta = useMemo(() => lerConsulta(qs), [qs]);
  const [estado, setEstado] = useState<Estado>({ carga: 'carregando' });
  const pedido = useRef(0); // só a resposta do pedido mais recente vale

  const carrega = useCallback(async () => {
    const n = ++pedido.current;
    setEstado({ carga: 'carregando' });
    try {
      const lista = await api.rpc<ListaUsuarios>('admin_usuarios', argumentosLista(consulta));
      if (n === pedido.current) setEstado({ carga: 'ok', lista });
    } catch (e) {
      if (n === pedido.current) setEstado({ carga: 'erro', mensagem: mensagemDe(e) });
    }
  }, [api, consulta]);
  useEffect(() => { carrega(); }, [carrega]);

  // página além da última (URL antiga ou editada): vai à última
  const alem = estado.carga === 'ok' && estado.lista.linhas.length === 0 && estado.lista.total > 0;
  useEffect(() => {
    if (alem && estado.carga === 'ok') router.replace(enderecoLista({ ...consulta, pagina: paginas(estado.lista.total, consulta.pagina).pagina }));
  }, [alem]); // eslint-disable-line react-hooks/exhaustive-deps

  if (estado.carga === 'erro') {
    return (
      <div className="vazio">
        <div className="aviso" role="alert">{estado.mensagem}</div>
        <button type="button" className="btn pri" onClick={carrega}>Tentar de novo</button>
      </div>
    );
  }
  if (estado.carga === 'carregando' || alem) return <p className="carregando" role="status">Carregando…</p>;

  const { total, linhas } = estado.lista;
  if (total === 0) {
    return <div className="vazio"><p>Nenhuma pessoa cadastrada.</p></div>;
  }

  const pg = paginas(total, consulta.pagina);
  return (
    <>
      <div><span className="pill mu">{total} {total === 1 ? 'pessoa' : 'pessoas'}</span></div>
      <div className="rolagem">
        <table>
          <thead>
            <tr><th>Nome</th><th>E-mail</th><th>Mandatos</th><th>Cadastro</th><th>Último acesso</th></tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const marca = marcaPessoa(l);
              const href = enderecoDetalhe(l.id, consulta);
              return (
                <tr key={l.id} onClick={() => router.push(href)} style={{ cursor: 'pointer' }}>
                  <td>
                    <Link href={href} onClick={(e) => e.stopPropagation()}>{l.nome ?? l.email ?? '—'}</Link>
                    {marca && <> <span className={`pill ${l.equipe_papel ? 'ok' : 'warn'}`}>{marca}</span></>}
                  </td>
                  <td>{l.email ?? '—'}</td>
                  <td>{l.mandatos.length ? l.mandatos.map((m) => <div key={m.id}>{rotuloMandato(m)}</div>) : '—'}</td>
                  <td>{rotuloData(l.criado_em)}</td>
                  <td>{rotuloUltimoAcesso(l.ultimo_acesso)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="rodape">
        <span className="legend">Só leitura. Os dados do perfil ficam no detalhe da pessoa.</span>
        <span className="bar">
          <span className="legend">{pg.primeiro}–{pg.ultimo} de {total}</span>
          {pg.paginas > 1 && (
            <>
              <button type="button" className="btn sm" disabled={pg.pagina <= 1} onClick={() => router.push(enderecoLista({ ...consulta, pagina: pg.pagina - 1 }))}>Anterior</button>
              <button type="button" className="btn sm" disabled={pg.pagina >= pg.paginas} onClick={() => router.push(enderecoLista({ ...consulta, pagina: pg.pagina + 1 }))}>Próxima</button>
            </>
          )}
        </span>
      </div>
    </>
  );
}

export default function Usuarios() {
  return (
    <Sessao>
      <Casca tela="usuarios" titulo="Usuários">
        {/* useSearchParams pede um Suspense acima (exigência do build do Next) */}
        <Suspense fallback={<p className="carregando" role="status">Carregando…</p>}>
          <Lista />
        </Suspense>
      </Casca>
    </Sessao>
  );
}
