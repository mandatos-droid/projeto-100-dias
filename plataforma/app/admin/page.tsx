'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { diasParado, ESCALA_DIAS } from '../../lib/admin/escala.ts';
import { mensagemDe } from '../../lib/admin/mensagens.ts';
import { filtraMandatos, paginaDe, TAMANHO_PAGINA, type Filtros, type LinhaMandato } from '../../lib/admin/mandatos.ts';
import Casca from './_componentes/Casca.tsx';
import Sessao, { useAdmin } from './_componentes/Sessao.tsx';

// Só colunas de metadados: nunca `dados`, `nome_civil`, `resp_telefone` nem texto de evento.
const COLUNAS = 'id,codigo,nome_parlamentar,cargo,casa,uf,partido,data_posse,resp_nome,resp_cargo,criado_em,arquivado_em,membros,ultima_atividade,exercicios_concluidos';
const PARADO_PADRAO = 45; // corte do destaque quando o filtro "Parado há" está em "qualquer"
const FILTROS_VAZIOS = { busca: '', uf: '', casa: '', situacao: 'ativos', paradoHa: '' } as const;

type Estado = { carga: 'carregando' } | { carga: 'erro'; mensagem: string } | { carga: 'ok'; linhas: LinhaMandato[]; agora: Date };

function textoAtividade(dias: number): string {
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'há 1 dia';
  return `há ${dias} dias`;
}

function ListaMandatos() {
  const { api } = useAdmin();
  const [estado, setEstado] = useState<Estado>({ carga: 'carregando' });
  const [f, setF] = useState<{ busca: string; uf: string; casa: string; situacao: 'ativos' | 'arquivados'; paradoHa: string }>({ ...FILTROS_VAZIOS });
  const [pagina, setPagina] = useState(1);

  const carrega = useCallback(async () => {
    setEstado({ carga: 'carregando' });
    try {
      const linhas = await api.ler<LinhaMandato[]>(`v_admin_mandatos?select=${COLUNAS}&order=ultima_atividade.desc`);
      setEstado({ carga: 'ok', linhas, agora: new Date() });
    } catch (e) {
      setEstado({ carga: 'erro', mensagem: mensagemDe(e) });
    }
  }, [api]);
  useEffect(() => { carrega(); }, [carrega]);

  const linhas = estado.carga === 'ok' ? estado.linhas : [];
  const agora = estado.carga === 'ok' ? estado.agora : new Date();
  const ufs = useMemo(() => [...new Set(linhas.map((l) => l.uf).filter((x): x is string => !!x))].sort(), [linhas]);
  const casas = useMemo(() => [...new Set(linhas.map((l) => l.casa).filter((x): x is string => !!x))].sort(), [linhas]);
  const filtros: Filtros = { busca: f.busca, uf: f.uf, casa: f.casa, situacao: f.situacao, paradoHa: f.paradoHa ? Number(f.paradoHa) : null };
  const filtradas = useMemo(() => filtraMandatos(linhas, filtros, agora), [linhas, f, agora]); // eslint-disable-line react-hooks/exhaustive-deps
  const corte = f.paradoHa ? Number(f.paradoHa) : PARADO_PADRAO;
  const pg = paginaDe(filtradas, pagina, TAMANHO_PAGINA);
  const cadastros = linhas.filter((l) => !l.arquivado_em).length;

  function muda(parcial: Partial<typeof f>) { setF({ ...f, ...parcial }); setPagina(1); }

  if (estado.carga === 'erro') {
    return (
      <div className="vazio">
        <div className="aviso" role="alert">{estado.mensagem}</div>
        <button type="button" className="btn pri" onClick={carrega}>Tentar de novo</button>
      </div>
    );
  }

  const primeiro = pg.total === 0 ? 0 : (Math.min(pagina, pg.paginas) - 1) * TAMANHO_PAGINA + 1;
  const ultimo = primeiro === 0 ? 0 : primeiro + pg.itens.length - 1;

  return (
    <>
      <div><span className="pill mu">{cadastros} cadastros</span></div>
      <div className="bar">
        <input className="in" style={{ flex: 1, minWidth: 160 }} placeholder="Buscar parlamentar ou código" aria-label="Buscar mandato"
          value={f.busca} onChange={(e) => muda({ busca: e.target.value })} />
        <select className="in" aria-label="UF" value={f.uf} onChange={(e) => muda({ uf: e.target.value })}>
          <option value="">UF: todas</option>
          {ufs.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <select className="in" aria-label="Casa" value={f.casa} onChange={(e) => muda({ casa: e.target.value })}>
          <option value="">Casa: todas</option>
          {casas.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="in" aria-label="Situação" value={f.situacao} onChange={(e) => muda({ situacao: e.target.value as 'ativos' | 'arquivados' })}>
          <option value="ativos">Ativos</option>
          <option value="arquivados">Arquivados</option>
        </select>
        <select className="in" aria-label="Parado há" value={f.paradoHa} onChange={(e) => muda({ paradoHa: e.target.value })}>
          <option value="">Parado há: qualquer</option>
          {ESCALA_DIAS.map((d) => <option key={d} value={d}>Parado há: {d} dias</option>)}
        </select>
      </div>

      {estado.carga === 'carregando' ? (
        <p className="carregando" role="status">Carregando…</p>
      ) : pg.total === 0 ? (
        <div className="vazio">
          <p>Nenhum mandato encontrado</p>
          <button type="button" className="btn" onClick={() => { setF({ ...FILTROS_VAZIOS }); setPagina(1); }}>Limpar filtros</button>
        </div>
      ) : (
        <>
          <div className="rolagem">
            <table>
              <thead>
                <tr><th>Código</th><th>Parlamentar</th><th>Cargo</th><th>UF</th><th>Partido</th><th className="num">Membros</th><th>Última atividade</th><th></th></tr>
              </thead>
              <tbody>
                {pg.itens.map((l) => {
                  const dias = diasParado(l.ultima_atividade, agora);
                  return (
                    <tr key={l.id}>
                      <td className="mono">{l.codigo}</td>
                      <td>{l.nome_parlamentar ?? '—'}</td>
                      <td>{l.cargo ?? '—'}</td>
                      <td>{l.uf ?? '—'}</td>
                      <td>{l.partido ?? '—'}</td>
                      <td className="num">{l.membros}</td>
                      <td>{dias > corte ? <span className="pill warn">{dias} dias parado</span> : textoAtividade(dias)}</td>
                      <td><Link href={`/admin/mandatos/${l.id}`} className="btn sm">Ver</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="rodape">
            <span className="legend">Mostra só metadados. Nunca o texto escrito pelo gabinete.</span>
            <span className="bar">
              <span className="legend">{primeiro}–{ultimo} de {pg.total}</span>
              {pg.paginas > 1 && (
                <>
                  <button type="button" className="btn sm" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
                  <button type="button" className="btn sm" disabled={pagina >= pg.paginas} onClick={() => setPagina(pagina + 1)}>Próxima</button>
                </>
              )}
            </span>
          </div>
        </>
      )}
    </>
  );
}

export default function Mandatos() {
  return (
    <Sessao>
      <Casca tela="mandatos" titulo="Mandatos">
        <ListaMandatos />
      </Casca>
    </Sessao>
  );
}
