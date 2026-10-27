'use client';
/* Missão 4 · uma seção do acompanhamento da comunicação: cabeçalho com o último registro, "Registrar/Editar esta semana"
   (números ≥ 0, um registro por semana) e o gráfico de linha com as semanas já registradas. */
import { useState } from 'react';
import { semanasDaSecao, serie, ultimoRegistro, type Comunicacao, type Secao } from '@/lib/comunicacao';
import Grafico from './Grafico';
import './capital.css';

type Props = { secao: Secao; com: Comunicacao; semana: string; onGrava: (secaoId: string, valores: Record<string, number>) => string | null;
  /** Imprensa (k5): nº de notícias não ocultas do clipping na semana atual; é o valor de partida de "Aparições na imprensa". */
  aparicoesClipping?: number };

export default function SecaoComunicacao({ secao, com, semana, onGrava, aparicoesClipping = 0 }: Props) {
  const doClipping = secao.id === 'k5' && aparicoesClipping > 0;
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState<Record<string, string>>({});
  const [erro, setErro] = useState('');
  const daSemana = com.semanas[semana]?.[secao.id];
  const ultimo = ultimoRegistro(com, secao.id);
  const nSemanas = semanasDaSecao(com, secao.id).length;

  const abre = () => {
    setRascunho(Object.fromEntries(secao.campos.map((c) => [c.id, doClipping && c.id === 'aparicoes' ? String(aparicoesClipping) : daSemana?.[c.id] !== undefined ? String(daSemana[c.id]) : ''])));
    setErro('');
    setEditando(true);
  };
  const salva = () => {
    const valores: Record<string, number> = {};
    for (const c of secao.campos) {
      const t = (rascunho[c.id] ?? '').trim();
      if (t !== '') valores[c.id] = Number(t.replace(',', '.'));
    }
    if (!Object.keys(valores).length) { setErro('Preencha ao menos um número.'); return; }
    const e = onGrava(secao.id, valores);
    if (e) { setErro(e); return; }
    setEditando(false);
  };

  const series = secao.campos.map((c) => ({ id: c.id, rot: c.rot, pontos: serie(com, secao.id, c.id).map((p) => ({ x: p.semana, valor: p.valor })) })).filter((s) => s.pontos.length > 0);

  return (
    <details className="cp-sec" data-secao={secao.id}>
      <summary>
        <span className="cp-sec-t">{secao.titulo}</span>
        <span className="cp-sec-ult">
          {ultimo
            ? `Último registro (${ultimo.semana}): ${secao.campos.filter((c) => ultimo.valores[c.id] !== undefined).map((c) => `${c.rot} ${ultimo.valores[c.id]}`).join(' · ')}`
            : 'Sem registro ainda'}
        </span>
      </summary>
      <div className="cp-sec-corpo">
        {!editando && <button type="button" className="bt pri peq" onClick={abre}>{daSemana ? 'Editar esta semana' : 'Registrar esta semana'}</button>}
        {editando && (
          <form className="cp-form" noValidate onSubmit={(e) => { e.preventDefault(); salva(); }}>
            <p className="cp-semana">Semana {semana} (segunda a domingo)</p>
            {secao.campos.map((c) => (
              <div key={c.id} className="cp-num">
                <label className="campo"><span className="rot">{c.rot}</span>
                  <input type="number" inputMode="numeric" step="any" min={0} aria-describedby={`aj-${secao.id}-${c.id}`} value={rascunho[c.id] ?? ''} onChange={(e) => setRascunho({ ...rascunho, [c.id]: e.target.value })} />
                </label>
                <small className="cp-ajuda" id={`aj-${secao.id}-${c.id}`}>{doClipping && c.id === 'aparicoes' ? `Calculado pelo clipping: ${aparicoesClipping} ${aparicoesClipping === 1 ? 'notícia não oculta' : 'notícias não ocultas'} nesta semana. Pode ajustar.` : c.ajuda}</small>
              </div>
            ))}
            {erro && <p className="cp-erro" role="alert">{erro}</p>}
            <div className="bts">
              <button type="submit" className="bt pri peq">Salvar registro</button>
              <button type="button" className="bt fant peq" onClick={() => setEditando(false)}>Cancelar</button>
            </div>
          </form>
        )}
        {nSemanas >= 2
          ? <Grafico tipo="linha" titulo={`Evolução semanal: ${secao.titulo}`} series={series} />
          : <p className="cp-vazio">Registre mais uma semana para ver a linha.</p>}
      </div>
    </details>
  );
}
