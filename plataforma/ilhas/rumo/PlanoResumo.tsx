'use client';
/* Missão 3 · esqueleto da ilha `plano-resumo` (T10); a tela real entra numa tarefa seguinte. */
import { useRumo } from './useRumo';
import './rumo.css';

export default function PlanoResumo() {
  useRumo();
  return (
    <div className="ilha-corpo rm-esq" data-esqueleto="plano-resumo">
      <p>Resumo do planejamento: em construção.</p>
    </div>
  );
}
