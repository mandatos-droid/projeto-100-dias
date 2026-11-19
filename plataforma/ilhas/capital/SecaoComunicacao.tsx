'use client';
/* Missão 4 · uma seção do acompanhamento da comunicação: cabeçalho com a data certa do último registro e um botão "Registrar";
   o formulário tem dois jeitos de registrar ("esta semana ou nos últimos 15 dias" e "este mês"; números ≥ 0, um registro por
   semana e por mês) e, abaixo, um gráfico de linha por número (cada um com o próprio eixo) e uma tabela com todos. */
import { useRef, useState } from 'react';
import { aparicoesDoMes, aparicoesDaSemana, mesesDaSecao, semanaDe, semanasDaSecao, serie, serieMes, ultimoRegistroDatado, validaDataRegistro, validaMesRegistro, DIAS_RECUO, type Comunicacao, type Noticia, type Secao } from '@/lib/comunicacao';
import Grafico, { TabelaSeries, type Periodo, type SerieLinha } from './Grafico';
import './capital.css';

/** Referência do registro: o dia (cai na semana ISO dele) ou o mês ("2026-11"). */
export type RefRegistro = { tipo: 'semana'; data: string } | { tipo: 'mes'; mes: string };

type Props = { secao: Secao; com: Comunicacao; hoje: string; onGrava: (secaoId: string, valores: Record<string, number>, ref: RefRegistro) => string | null;
  /** Imprensa (k5): notícias do clipping; o nº de não ocultas no período é o valor de partida de "Aparições na imprensa". */
  clipping?: Noticia[] };

const somaDias = (iso: string, n: number) => { const [a, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10); };

export default function SecaoComunicacao({ secao, com, hoje, onGrava, clipping = [] }: Props) {
  const [modo, setModo] = useState<'semana' | 'mes' | null>(null);
  const [data, setData] = useState(hoje);
  const [mes, setMes] = useState(hoje.slice(0, 7));
  const [rascunho, setRascunho] = useState<Record<string, string>>({});
  const [aparicoes, setAparicoes] = useState(0); // calculado pelo clipping ao abrir (só k5)
  const [erro, setErro] = useState('');
  const detalhes = useRef<HTMLDetailsElement>(null);
  const ultimo = ultimoRegistroDatado(com, secao.id);
  const nSemanas = semanasDaSecao(com, secao.id).length;
  const nMeses = mesesDaSecao(com, secao.id).length;

  const abre = (m: 'semana' | 'mes') => {
    const periodo = m === 'semana' ? semanaDe(hoje) ?? '' : hoje.slice(0, 7);
    const existente = (m === 'semana' ? com.semanas[periodo] : com.meses?.[periodo])?.[secao.id];
    const calc = secao.id === 'k5' ? (m === 'semana' ? aparicoesDaSemana(clipping, periodo) : aparicoesDoMes(clipping, periodo)) : 0;
    setRascunho(Object.fromEntries(secao.campos.map((c) => [c.id, calc > 0 && c.id === 'aparicoes' ? String(calc) : existente?.[c.id] !== undefined ? String(existente[c.id]) : ''])));
    setAparicoes(calc);
    setData(hoje); setMes(hoje.slice(0, 7)); setErro('');
    setModo(m);
  };
  const salva = () => {
    if (!modo) return;
    const e0 = modo === 'semana' ? validaDataRegistro(data, hoje) : validaMesRegistro(mes, hoje);
    if (e0) { setErro(e0); return; }
    const valores: Record<string, number> = {};
    for (const c of secao.campos) {
      const t = (rascunho[c.id] ?? '').trim();
      if (t !== '') valores[c.id] = Number(t.replace(',', '.'));
    }
    if (!Object.keys(valores).length) { setErro('Preencha ao menos um número.'); return; }
    const e = onGrava(secao.id, valores, modo === 'semana' ? { tipo: 'semana', data } : { tipo: 'mes', mes });
    if (e) { setErro(e); return; }
    setModo(null);
  };

  /* a cor e o marcador seguem a posição do número na seção, mesmo quando um deles ainda não tem registro */
  const series: SerieLinha[] = secao.campos.map((c, i) => ({ id: c.id, rot: c.rot, cor: i, pontos: serie(com, secao.id, c.id).map((p) => ({ x: p.semana, valor: p.valor })) })).filter((s) => s.pontos.length > 0);
  const seriesMes: SerieLinha[] = secao.campos.map((c, i) => ({ id: c.id, rot: c.rot, cor: i, pontos: serieMes(com, secao.id, c.id).map((p) => ({ x: p.mes, valor: p.valor })) })).filter((s) => s.pontos.length > 0);
  const evolucao = (titulo: string, ss: SerieLinha[], periodo: Periodo) => (
    <section className="cp-evol" data-periodo={periodo}>
      <h5>{titulo}</h5>
      <div className="cp-graficos">
        {ss.map((x) => <Grafico key={x.id} tipo="linha" titulo={x.rot} series={[x]} alto={150} periodo={periodo} semTabela />)}
      </div>
      <div className="cp-tabela"><TabelaSeries series={ss} periodo={periodo} /></div>
    </section>
  );
  const abreRegistro = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); // o botão fica dentro do cabeçalho: não deixa o clique só abrir/fechar a seção
    if (detalhes.current) detalhes.current.open = true;
    if (!modo) abre('semana');
  };
  const textoUltimo = ultimo
    ? `Último registro ${ultimo.rotulo.startsWith('em ') ? ultimo.rotulo : `(${ultimo.rotulo})`}: ${secao.campos.filter((c) => ultimo.valores[c.id] !== undefined).map((c) => `${c.rot} ${ultimo.valores[c.id]}`).join(' · ')}`
    : 'Sem registro ainda';

  return (
    <details className="cp-sec" data-secao={secao.id} ref={detalhes}>
      <summary>
        <span className="cp-sec-info">
          <span className="cp-sec-t">{secao.titulo}</span>
          <span className="cp-sec-ult">{textoUltimo}</span>
        </span>
        <button type="button" className="bt pri peq cp-sec-reg" onClick={abreRegistro}>Registrar<span className="sr"> {secao.curto}</span></button>
      </summary>
      <div className="cp-sec-corpo">
        {modo && (
          <form className="cp-form" noValidate onSubmit={(e) => { e.preventDefault(); salva(); }}>
            <div className="cp-seg" role="group" aria-label="O que você vai registrar">
              <button type="button" className="cp-seg-b" data-registro="semana" aria-pressed={modo === 'semana'} onClick={() => abre('semana')}>Esta semana ou últimos 15 dias</button>
              <button type="button" className="cp-seg-b" data-registro="mes" aria-pressed={modo === 'mes'} onClick={() => abre('mes')}>Este mês</button>
            </div>
            {modo === 'semana' ? (
              <label className="campo cp-data"><span className="rot">Data do registro</span>
                <input type="date" value={data} min={somaDias(hoje, -DIAS_RECUO)} max={hoje} onChange={(e) => setData(e.target.value)} />
                <small className="cp-ajuda">Hoje ou até 15 dias atrás. O registro vale para a semana (segunda a domingo) dessa data.</small>
              </label>
            ) : (
              <label className="campo cp-data"><span className="rot">Mês do registro</span>
                <input type="month" value={mes} max={hoje.slice(0, 7)} onChange={(e) => setMes(e.target.value)} />
              </label>
            )}
            <div className="cp-num-grade">
              {secao.campos.map((c) => (
                <div key={c.id} className="cp-num">
                  <label className="campo"><span className="rot">{c.rot}</span>
                    <input type="number" inputMode="numeric" step="any" min={0} aria-describedby={`aj-${secao.id}-${c.id}`} value={rascunho[c.id] ?? ''} onChange={(e) => setRascunho({ ...rascunho, [c.id]: e.target.value })} />
                  </label>
                  <small className="cp-ajuda" id={`aj-${secao.id}-${c.id}`}>{aparicoes > 0 && c.id === 'aparicoes' ? `Calculado pelo clipping: ${aparicoes} ${aparicoes === 1 ? 'notícia não oculta' : 'notícias não ocultas'} ${modo === 'mes' ? 'neste mês' : 'nesta semana'}. Pode ajustar.` : c.ajuda}</small>
                </div>
              ))}
            </div>
            {erro && <p className="cp-erro" role="alert">{erro}</p>}
            <div className="bts">
              <button type="submit" className="bt pri peq">Salvar registro</button>
              <button type="button" className="bt fant peq" onClick={() => setModo(null)}>Cancelar</button>
            </div>
          </form>
        )}
        {nSemanas >= 2 && evolucao('Evolução semanal', series, 'semana')}
        {nMeses >= 2 && evolucao('Evolução mensal', seriesMes, 'mes')}
        {nSemanas < 2 && nMeses < 2 && <p className="cp-vazio">Registre mais uma semana para ver a linha.</p>}
      </div>
    </details>
  );
}
