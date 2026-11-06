'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { lerTudo } from '../../../lib/admin/api.ts';
import { indicadores, statusMensal, type LinhaEventoMes } from '../../../lib/admin/analytics.ts';
import { ESCALA_DIAS, partesBrasilia } from '../../../lib/admin/escala.ts';
import { funil, travas, type LinhaExercicio } from '../../../lib/admin/funil.ts';
import type { LinhaMandato } from '../../../lib/admin/mandatos.ts';
import { mensagemDe } from '../../../lib/admin/mensagens.ts';
import { usoPorDia, usoPorFuncionalidade, type LinhaUsoCampos, type LinhaUsoDia } from '../../../lib/admin/usoFuncionalidades.ts';
import Casca from '../_componentes/Casca.tsx';
import Grafico from '../_componentes/Grafico.tsx';
import Sessao, { useAdmin } from '../_componentes/Sessao.tsx';

// Só metadados e números, nunca `dados`, `nome_civil`, `resp_telefone` nem texto de evento.
// Cada consulta traz `order` com a chave única: lerTudo pagina por limit/offset e precisa de ordem estável.
const COLUNAS_MANDATOS = 'id,codigo,nome_parlamentar,cargo,casa,uf,partido,data_posse,resp_nome,resp_cargo,criado_em,arquivado_em,membros,ultima_atividade,exercicios_concluidos';
const CONSULTAS = {
  mandatos: `v_admin_mandatos?select=${COLUNAS_MANDATOS}&order=id`,
  exercicios: 'v_admin_exercicios?select=mandato_id,uf,exercicio,missao,ordem,ok&order=mandato_id,exercicio',
  eventosMes: 'v_admin_eventos_mes?select=mandato_id,mes,qtd&order=mandato_id,mes',
  campos: 'v_admin_uso_campos?select=mandato_id,uf,persona,conjuntura,municipio,eleitorado,social,cadeiras&order=mandato_id',
  guia: 'exercicios_guia?select=id,missao,ordem,titulo&order=missao,ordem',
};
// v_admin_uso (aberturas por dia) vem da migration de uso (P3) e pode ainda não existir no banco: sem ela, ou sem nenhuma
// linha, Aberturas e Tendência ficam "—". O filtro de `dia` limita as linhas ao maior período (45 dias) e a ordem usa a chave única.
const consultaUso = (agora: Date) => {
  const p = partesBrasilia(agora);
  const desde = new Date(Date.UTC(p.ano, p.mes - 1, p.dia) - ESCALA_DIAS[ESCALA_DIAS.length - 1] * 86400000).toISOString().slice(0, 10);
  return `v_admin_uso?select=dia,mandato_id,uf,funcionalidade,qtd&dia=gte.${desde}&order=dia,mandato_id,funcionalidade`;
};

const PERIODO_PADRAO = 30;
const PARADO_PADRAO = 45;
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const rotuloMes = (m: string) => `${MESES[Number(m.slice(5, 7)) - 1]}/${m.slice(2, 4)}`; // '2026-11' -> 'Nov/26'

interface Dados {
  mandatos: LinhaMandato[]; exercicios: LinhaExercicio[]; eventosMes: LinhaEventoMes[]; campos: LinhaUsoCampos[]; uso: LinhaUsoDia[] | null
  guia: { id: string; missao: number; ordem: number; titulo: string }[]
  agora: Date
}
type Estado = { carga: 'carregando' } | { carga: 'erro'; mensagem: string } | { carga: 'ok'; dados: Dados };

function Analytics() {
  const { api } = useAdmin();
  const [estado, setEstado] = useState<Estado>({ carga: 'carregando' });
  const [periodo, setPeriodo] = useState(PERIODO_PADRAO);
  const [parado, setParado] = useState(PARADO_PADRAO);
  const [uf, setUf] = useState('');

  const carrega = useCallback(async () => {
    setEstado({ carga: 'carregando' });
    try {
      const agora = new Date();
      const [mandatos, exercicios, eventosMes, campos, guia, uso] = await Promise.all([
        lerTudo<LinhaMandato>(api, CONSULTAS.mandatos),
        lerTudo<LinhaExercicio>(api, CONSULTAS.exercicios),
        lerTudo<LinhaEventoMes>(api, CONSULTAS.eventosMes),
        lerTudo<LinhaUsoCampos>(api, CONSULTAS.campos),
        lerTudo<Dados['guia'][number]>(api, CONSULTAS.guia),
        // falha do registro de uso (view ausente, por exemplo) não derruba a tela: vira "sem registro"
        lerTudo<LinhaUsoDia>(api, consultaUso(agora)).catch(() => []),
      ]);
      // sem nenhuma linha = registro de uso ainda não ativo (null)
      setEstado({ carga: 'ok', dados: { mandatos, exercicios, eventosMes, campos, guia, uso: uso.length ? uso : null, agora } });
    } catch (e) {
      setEstado({ carga: 'erro', mensagem: mensagemDe(e) });
    }
  }, [api]);
  useEffect(() => { carrega(); }, [carrega]);

  const dados = estado.carga === 'ok' ? estado.dados : null;
  const ufs = useMemo(
    () => dados ? [...new Set(dados.mandatos.filter((m) => !m.arquivado_em).map((m) => m.uf).filter((x): x is string => !!x))].sort() : [],
    [dados],
  );

  // Tudo abaixo recalcula só no navegador: trocar filtro não faz nova consulta.
  const calc = useMemo(() => {
    if (!dados) return null;
    const ufSel = uf || null;
    const exercicios = ufSel ? dados.exercicios.filter((l) => l.uf === ufSel) : dados.exercicios;
    const campos = ufSel ? dados.campos.filter((c) => c.uf === ufSel) : dados.campos;
    const usoUf = dados.uso && (ufSel ? dados.uso.filter((l) => l.uf === ufSel) : dados.uso);
    const titulos = new Map(dados.guia.map((g) => [g.id, g]));
    return {
      ind: indicadores(dados.mandatos, dados.agora, periodo, parado, ufSel),
      meses: statusMensal(dados.mandatos, dados.eventosMes, dados.agora, ufSel),
      // funil e travas mostram o estado atual: não dependem do período nem de "Parado há"
      funil: funil(exercicios),
      travas: travas(exercicios).map((t) => ({ ...t, titulo: titulos.get(t.exercicio)?.titulo ?? t.exercicio, missao: titulos.get(t.exercicio)?.missao ?? null })),
      uso: usoPorFuncionalidade(campos, usoUf ?? undefined, dados.agora, periodo),
      // 14 dias: só com registro ativo; sem ele o gráfico mostra o texto de vazio
      usoDia: usoUf ? usoPorDia(usoUf, dados.agora).map((d) => ({ rotulo: `${d.dia.slice(8, 10)}/${d.dia.slice(5, 7)}`, valores: [d.total] })) : [],
    };
  }, [dados, uf, periodo, parado]);

  if (estado.carga === 'erro') {
    return (
      <div className="vazio">
        <div className="aviso" role="alert">{estado.mensagem}</div>
        <button type="button" className="btn pri" onClick={carrega}>Tentar de novo</button>
      </div>
    );
  }
  if (!dados || !calc) return <p className="carregando" role="status">Carregando…</p>;

  const { ind } = calc;
  const totalExercicios = dados.guia.length;

  return (
    <>
      <div className="bar">
        <select className="in" aria-label="Período" value={periodo} onChange={(e) => setPeriodo(Number(e.target.value))}>
          {ESCALA_DIAS.map((d) => <option key={d} value={d}>Últimos {d} dias</option>)}
        </select>
        <select className="in" aria-label="Parado há" value={parado} onChange={(e) => setParado(Number(e.target.value))}>
          {ESCALA_DIAS.map((d) => <option key={d} value={d}>Parado há: {d} dias</option>)}
        </select>
        <select className="in" aria-label="UF" value={uf} onChange={(e) => setUf(e.target.value)}>
          <option value="">UF: todas</option>
          {ufs.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      <div className="kpis">
        <div className="kpi"><b>{ind.cadastrados}</b><span>mandatos cadastrados</span></div>
        <div className="kpi"><b>{ind.ativos}</b><span>ativos nos últimos {periodo} dias</span></div>
        {/* mediaConcluidos é bruto (pode ter casas); a tela arredonda */}
        <div className="kpi"><b>{Math.round(ind.mediaConcluidos)}</b><span>exercícios concluídos (média por mandato{totalExercicios ? `, de ${totalExercicios}` : ''})</span></div>
        <div className="kpi"><b>{ind.parados}</b><span>parados há mais de {parado} dias</span></div>
      </div>

      {ind.cadastrados === 0 ? (
        <div className="vazio"><p>Ainda não há mandatos cadastrados.</p></div>
      ) : (
        <>
          <Grafico
            tipo="empilhadas"
            titulo="Status de atividade dos mandatos por mês"
            unidade="Quantidade de mandatos em cada mês, por status"
            series={[
              { nome: 'Ativo: ao menos 1 registro no mês', curto: 'Ativo' },
              { nome: 'Parado: cadastrado, sem registro no mês', curto: 'Parado' },
            ]}
            categorias={calc.meses.map((m) => ({ rotulo: rotuloMes(m.mes), valores: [m.ativos, m.parados] }))}
            vazio="Sem meses para mostrar."
          />
          <Grafico
            tipo="barras"
            titulo="Funil das missões"
            unidade={`Mandatos que concluíram cada missão, em número e % dos ${ind.cadastrados} cadastrados`}
            series={[{ nome: 'Mandatos que concluíram a missão' }]}
            categorias={calc.funil.map((f) => ({ rotulo: `Missão ${f.missao}`, valores: [f.pct], texto: `${f.concluiram} · ${f.pct}%` }))}
            maximo={100}
            vazio="Sem dados de exercícios ainda."
          />
          <Grafico
            tipo="colunas"
            titulo="Uso das funcionalidades por dia"
            unidade="Total de aberturas de todas as funcionalidades, nos últimos 14 dias"
            series={[{ nome: 'Aberturas' }]}
            categorias={calc.usoDia}
            vazio="Sem registro de uso ainda"
          />

          <div className="card">
            <h3>Onde os mandatos travam</h3>
            {calc.travas.length === 0 ? (
              <p className="hint">Nenhum exercício foi alcançado ainda.</p>
            ) : (
              <div className="rolagem">
                <table style={{ minWidth: 520 }}>
                  <thead><tr><th>Exercício</th><th>Missão</th><th className="num">Alcançaram</th><th className="num">Concluíram</th><th className="num">Abandono</th></tr></thead>
                  <tbody>
                    {calc.travas.map((t) => (
                      <tr key={t.exercicio}>
                        <td>{t.titulo}</td>
                        <td>{t.missao ?? '—'}</td>
                        <td className="num">{t.alcancaram}</td>
                        <td className="num">{t.concluiram}</td>
                        <td className="num"><span className={`pill ${t.abandono > 0 ? 'warn' : 'mu'}`}>{t.abandono}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h3>Uso por funcionalidade</h3>
            <div className="rolagem">
              <table>
                <thead><tr><th>Funcionalidade</th><th className="num">Mandatos que usaram</th><th className="num">Aberturas ({periodo}d)</th><th>Tendência</th></tr></thead>
                <tbody>
                  {calc.uso.map((u) => (
                    <tr key={u.id}>
                      <td>{u.nome}</td>
                      <td className="num">{u.mandatos}</td>
                      <td className="num">{u.aberturas ?? '—'}</td>
                      <td className="mono">{u.tendencia ? u.tendencia.join(' ') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="legend">Mandatos que usaram: pelos campos já preenchidos no Guia. Aberturas: soma do período escolhido. Tendência: aberturas por semana nas últimas 5 semanas, da mais antiga para a atual. Sem registro de uso, ficam "—".</p>
          </div>
        </>
      )}
    </>
  );
}

export default function AnalyticsPagina() {
  return (
    <Sessao>
      <Casca tela="analytics" titulo="Analytics">
        <Analytics />
      </Casca>
    </Sessao>
  );
}
