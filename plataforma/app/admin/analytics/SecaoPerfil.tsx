'use client';

import { useCallback, useEffect, useState } from 'react';
import { viewPerfil, type CategoriaPerfil, type Distribuicao, type ResumoPerfil, type ViewPerfil } from '../../../lib/admin/perfil.ts';
import Grafico from '../_componentes/Grafico.tsx';
import { useAdmin } from '../_componentes/Sessao.tsx';

// Só números agregados: a função do banco devolve contagens, nunca linha individual (PAG-06.6, 06.7).
const GRAFICOS: { chave: Distribuicao; titulo: string; unidade: string }[] = [
  { chave: 'genero', titulo: 'Gênero de quem tem perfil', unidade: 'Pessoas por gênero, em número e % do total' },
  { chave: 'raca', titulo: 'Raça ou cor de quem tem perfil', unidade: 'Pessoas por raça ou cor, em número e % do total' },
  { chave: 'faixa', titulo: 'Faixa etária de quem tem perfil', unidade: 'Pessoas por faixa de idade, em número e % do total' },
  { chave: 'atuacao', titulo: 'Atuação política de quem tem perfil', unidade: 'Pessoas por tempo de atuação na política, em número e % do total' },
];

const barras = (cs: CategoriaPerfil[]) => cs.map((c) => ({ rotulo: c.rotulo, valores: [c.pct], texto: `${c.qtd} · ${c.pct}%` }));

type Estado = { carga: 'carregando' } | { carga: 'erro' } | { carga: 'ok'; view: ViewPerfil };

export default function SecaoPerfil() {
  const { api } = useAdmin();
  const [estado, setEstado] = useState<Estado>({ carga: 'carregando' });

  const carrega = useCallback(async () => {
    setEstado({ carga: 'carregando' });
    try {
      setEstado({ carga: 'ok', view: viewPerfil(await api.rpc<ResumoPerfil>('admin_perfil_resumo')) });
    } catch {
      setEstado({ carga: 'erro' });
    }
  }, [api]);
  useEffect(() => { carrega(); }, [carrega]);

  const view = estado.carga === 'ok' ? estado.view : null;

  return (
    <section aria-labelledby="perfil-titulo" style={{ display: 'grid', gap: 12, minWidth: 0 }}>
      <h2 id="perfil-titulo" style={{ margin: 0, fontSize: 18, color: 'var(--vinho)' }}>Perfil de quem usa a plataforma</h2>
      {estado.carga === 'carregando' && <p className="carregando" role="status">Carregando perfil…</p>}
      {estado.carga === 'erro' && (
        <div className="vazio">
          <div className="aviso" role="alert">Não foi possível carregar o perfil. Tente de novo.</div>
          <button type="button" className="btn pri" onClick={carrega}>Tentar de novo</button>
        </div>
      )}
      {view?.vazio && <div className="vazio"><p>{view.mensagem}</p></div>}
      {view && !view.vazio && (
        <>
          <div className="kpis" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
            <div className="kpi"><b>{view.total}</b><span>pessoas com perfil</span></div>
          </div>
          <Grafico
            tipo="colunas"
            titulo="Cadastros de perfil por mês"
            unidade="Pessoas que preencheram o perfil em cada mês, nos últimos 12 meses"
            series={[{ nome: 'Cadastros de perfil' }]}
            categorias={view.meses.map((m) => ({ rotulo: m.rotulo, valores: [m.qtd] }))}
            vazio="Sem meses para mostrar."
          />
          {GRAFICOS.map((g) => (
            <Grafico
              key={g.chave}
              tipo="barras"
              titulo={g.titulo}
              unidade={g.unidade}
              series={[{ nome: g.titulo }]}
              categorias={barras(view.distribuicoes[g.chave])}
              maximo={100}
              vazio="Sem dados."
            />
          ))}
        </>
      )}
    </section>
  );
}
