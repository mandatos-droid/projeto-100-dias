'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { lerTudo } from '../../../lib/admin/api.ts';
import { mensagemDe } from '../../../lib/admin/mensagens.ts';
import {
  argumentosLista, BUSCA_MAX, FILTROS_PAPEL, lerConsulta, marcaPessoa, montaConsulta, paginas, rotuloData, rotuloMandato,
  rotuloUltimoAcesso, temFiltro, type Consulta, type FiltroPapel, type ListaUsuarios,
} from '../../../lib/admin/usuarios.ts';
import Casca from '../_componentes/Casca.tsx';
import Sessao, { useAdmin } from '../_componentes/Sessao.tsx';

// Só leitura (USR-01): a lista vem de admin_usuarios e nunca traz gênero, raça, nascimento nem telefone.
type Estado = { carga: 'carregando' } | { carga: 'erro'; mensagem: string } | { carga: 'ok'; lista: ListaUsuarios };
interface OpcaoMandato { id: string; nome_parlamentar: string | null; arquivado_em: string | null }

const ESPERA_BUSCA = 300; // ms sem digitar antes de pedir a lista
const nomeMandato = (m: OpcaoMandato) => m.nome_parlamentar ?? 'Sem nome';

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
  const atual = useRef(consulta);
  atual.current = consulta;
  const [estado, setEstado] = useState<Estado>({ carga: 'carregando' });
  const [opcoes, setOpcoes] = useState<OpcaoMandato[]>([]);
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

  // Opções do filtro de mandato: os não arquivados, em ordem alfabética do parlamentar (USR-04.3).
  // Se falhar, o filtro fica só com "Todos os mandatos" e a lista segue.
  useEffect(() => {
    let vivo = true;
    lerTudo<OpcaoMandato>(api, 'v_admin_mandatos?select=id,nome_parlamentar,arquivado_em&order=nome_parlamentar,id')
      .then((l) => {
        if (vivo) setOpcoes(l.filter((m) => !m.arquivado_em).sort((a, b) => nomeMandato(a).localeCompare(nomeMandato(b), 'pt-BR')));
      })
      .catch(() => { /* sem opções */ });
    return () => { vivo = false; };
  }, [api]);

  // Busca: o campo muda na hora; a URL (e a lista) depois de uma pausa, sempre na página 1 (USR-04.1).
  const [busca, setBusca] = useState(consulta.q);
  const enviada = useRef(consulta.q);
  useEffect(() => {
    if (consulta.q !== enviada.current) { enviada.current = consulta.q; setBusca(consulta.q); }
  }, [consulta.q]);
  useEffect(() => {
    if (busca === enviada.current) return;
    const t = setTimeout(() => {
      enviada.current = busca;
      router.replace(enderecoLista({ ...atual.current, q: busca, pagina: 1 }));
    }, ESPERA_BUSCA);
    return () => clearTimeout(t);
  }, [busca]); // eslint-disable-line react-hooks/exhaustive-deps

  // Papel, mandato e "sem perfil" mudam na tela na hora e na URL em seguida (que é a fonte da lista).
  const [filtros, setFiltros] = useState({ papel: consulta.papel, mandato: consulta.mandato, semPerfil: consulta.semPerfil });
  useEffect(() => {
    setFiltros({ papel: consulta.papel, mandato: consulta.mandato, semPerfil: consulta.semPerfil });
  }, [consulta]);

  // filtro novo volta à página 1 e leva junto a busca já digitada
  function muda(parcial: Partial<typeof filtros>) {
    setFiltros({ ...filtros, ...parcial });
    enviada.current = busca;
    router.push(enderecoLista({ ...consulta, q: busca, ...parcial, pagina: 1 }));
  }
  function limpa() {
    enviada.current = '';
    setBusca('');
    router.push('/admin/usuarios');
  }

  // página além da última (URL antiga ou editada): vai à última
  const alem = estado.carga === 'ok' && estado.lista.linhas.length === 0 && estado.lista.total > 0;
  useEffect(() => {
    if (alem && estado.carga === 'ok') router.replace(enderecoLista({ ...consulta, pagina: paginas(estado.lista.total, consulta.pagina).pagina }));
  }, [alem]); // eslint-disable-line react-hooks/exhaustive-deps

  const selecionadoSemOpcao = filtros.mandato && !opcoes.some((m) => m.id === filtros.mandato);
  const barra = (
    // minWidth 0: sem isso o select com nome longo de parlamentar alarga a coluna da página
    <div className="bar" style={{ minWidth: 0 }}>
      <input className="in" style={{ flex: 1, minWidth: 160 }} placeholder="Buscar por nome ou e-mail" aria-label="Buscar pessoa"
        maxLength={BUSCA_MAX} value={busca} onChange={(e) => setBusca(e.target.value.slice(0, BUSCA_MAX))} />
      <select className="in" style={{ maxWidth: '100%' }} aria-label="Papel" value={filtros.papel}
        onChange={(e) => muda({ papel: e.target.value as FiltroPapel })}>
        {FILTROS_PAPEL.map((f) => <option key={f.valor} value={f.valor}>{f.rotulo}</option>)}
      </select>
      <select className="in" style={{ maxWidth: '100%' }} aria-label="Mandato" value={filtros.mandato}
        onChange={(e) => muda({ mandato: e.target.value })}>
        <option value="">Todos os mandatos</option>
        {selecionadoSemOpcao && <option value={filtros.mandato}>Mandato selecionado</option>}
        {opcoes.map((m) => <option key={m.id} value={m.id}>{nomeMandato(m)}</option>)}
      </select>
      <label className="legend" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 40 }}>
        <input type="checkbox" checked={filtros.semPerfil} onChange={(e) => muda({ semPerfil: e.target.checked })} />
        Só quem ainda não preencheu o perfil
      </label>
      {temFiltro(consulta) && <button type="button" className="btn" onClick={limpa}>Limpar filtros</button>}
    </div>
  );

  function conteudo() {
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
      return (
        <div className="vazio">
          <p>{temFiltro(consulta) ? 'Nenhuma pessoa encontrada com esses filtros.' : 'Nenhuma pessoa cadastrada.'}</p>
        </div>
      );
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

  return <>{barra}{conteudo()}</>;
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
