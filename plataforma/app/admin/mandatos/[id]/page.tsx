'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { diasParado, partesBrasilia } from '../../../../lib/admin/escala.ts';
import { funil, type LinhaExercicio } from '../../../../lib/admin/funil.ts';
import type { LinhaMandato } from '../../../../lib/admin/mandatos.ts';
import { mensagemDe } from '../../../../lib/admin/mensagens.ts';
import Casca from '../../_componentes/Casca.tsx';
import Membros from '../../_componentes/Membros.tsx';
import Sessao, { useAdmin } from '../../_componentes/Sessao.tsx';
import ZonaRisco from '../../_componentes/ZonaRisco.tsx';

// Só metadados e contagens: nunca `dados`, `nome_civil`, `resp_telefone` nem texto de evento.
const COLUNAS = 'id,codigo,nome_parlamentar,cargo,casa,uf,partido,data_posse,resp_nome,resp_cargo,criado_em,arquivado_em,membros,ultima_atividade,exercicios_concluidos';
const COLUNAS_EXERCICIO = 'mandato_id,uf,exercicio,missao,ordem,ok';
const TOTAL_MISSOES = 5;
const TOTAL_EXERCICIOS = 16;

type Estado =
  | { carga: 'carregando' }
  | { carga: 'erro'; mensagem: string }
  | { carga: 'inexistente' }
  | { carga: 'ok'; mandato: LinhaMandato; missoes: number | null; agora: Date };

const dataBr = (iso: string) => {
  const { ano, mes, dia } = partesBrasilia(iso);
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
};
// data_posse é uma data sem hora ('YYYY-MM-DD'): formata o texto, sem passar por fuso
const posse = (d: string | null) => (d ? d.slice(0, 10).split('-').reverse().join('/') : '—');

function textoAtividade(dias: number): string {
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'há 1 dia';
  return `há ${dias} dias`;
}

function Detalhe() {
  const { api } = useAdmin();
  const { id } = useParams<{ id: string }>();
  const [estado, setEstado] = useState<Estado>({ carga: 'carregando' });

  const carrega = useCallback(async (silencioso = false) => {
    if (!silencioso) setEstado({ carga: 'carregando' });
    const alvo = encodeURIComponent(id);
    try {
      const [linhas, exercicios] = await Promise.all([
        api.ler<LinhaMandato[]>(`v_admin_mandatos?select=${COLUNAS}&id=eq.${alvo}`),
        api.ler<LinhaExercicio[]>(`v_admin_exercicios?select=${COLUNAS_EXERCICIO}&mandato_id=eq.${alvo}`),
      ]);
      if (!linhas.length) { setEstado({ carga: 'inexistente' }); return; }
      // v_admin_exercicios não traz mandato arquivado: sem linhas, as missões ficam sem valor (e não "0")
      const missoes = exercicios.length ? funil(exercicios).reduce((n, l) => n + l.concluiram, 0) : null;
      setEstado({ carga: 'ok', mandato: linhas[0], missoes, agora: new Date() });
    } catch (e) {
      setEstado({ carga: 'erro', mensagem: mensagemDe(e) });
    }
  }, [api, id]);
  useEffect(() => { carrega(); }, [carrega]);

  const voltar = <Link href="/admin" className="btn sm">‹ Voltar</Link>;

  if (estado.carga !== 'ok') {
    return (
      <Casca tela="mandatos" titulo={<>{voltar} Mandato</>}>
        {estado.carga === 'carregando' && <p className="carregando" role="status">Carregando…</p>}
        {estado.carga === 'inexistente' && (
          <div className="vazio"><p>Mandato não encontrado</p><Link href="/admin" className="btn">Voltar à lista</Link></div>
        )}
        {estado.carga === 'erro' && (
          <div className="vazio">
            <div className="aviso" role="alert">{estado.mensagem}</div>
            <button type="button" className="btn pri" onClick={() => carrega()}>Tentar de novo</button>
          </div>
        )}
      </Casca>
    );
  }

  const { mandato: m, missoes, agora } = estado;
  const feitos = Math.min(m.exercicios_concluidos, TOTAL_EXERCICIOS);
  const pct = (parte: number, todo: number) => `${Math.round((parte * 100) / todo)}%`;
  const responsavel = [m.resp_nome, m.resp_cargo ? `(${m.resp_cargo})` : null].filter(Boolean).join(' ') || '—';

  return (
    <Casca tela="mandatos" titulo={<>{voltar} {m.nome_parlamentar ?? 'Sem nome'} <span className="mono legend">{m.codigo}</span>{m.arquivado_em && <span className="pill mu">arquivado</span>}</>}>
      <div className="grid2">
        <div className="card">
          <h3>Cadastro</h3>
          <dl className="kv">
            <dt>Cargo</dt><dd>{m.cargo ?? '—'}</dd>
            <dt>Casa e UF</dt><dd>{[m.casa, m.uf].filter(Boolean).join(' · ') || '—'}</dd>
            <dt>Partido</dt><dd>{m.partido ?? '—'}</dd>
            <dt>Posse</dt><dd>{posse(m.data_posse)}</dd>
            <dt>Responsável</dt><dd>{responsavel}</dd>
            <dt>Criado em</dt><dd>{dataBr(m.criado_em)}</dd>
          </dl>
        </div>
        <div className="card">
          <h3>Andamento (só contagens)</h3>
          <div>Missões concluídas: {missoes === null ? '—' : `${missoes} de ${TOTAL_MISSOES}`}</div>
          <div className="meter"><i style={{ width: missoes === null ? '0%' : pct(missoes, TOTAL_MISSOES) }} /></div>
          <div>Exercícios feitos: {feitos} de {TOTAL_EXERCICIOS}</div>
          <div className="meter"><i style={{ width: pct(feitos, TOTAL_EXERCICIOS) }} /></div>
          <div className="legend">Última atividade: {textoAtividade(diasParado(m.ultima_atividade, agora))}</div>
          {missoes === null && <div className="legend">Missões não disponíveis para mandato arquivado.</div>}
          <div className="legend">Mostra só metadados e contagens, nunca o texto escrito pelo gabinete.</div>
        </div>
      </div>

      <Membros mandatoId={m.id} />
      <ZonaRisco mandato={{ id: m.id, codigo: m.codigo, arquivado_em: m.arquivado_em }} onArquivoMudou={() => carrega(true)} />
    </Casca>
  );
}

export default function DetalheMandato() {
  return (
    <Sessao>
      <Detalhe />
    </Sessao>
  );
}
