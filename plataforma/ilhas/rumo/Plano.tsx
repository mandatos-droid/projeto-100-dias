'use client';
/* Missão 3 · esqueleto da ilha `plano` (T10); a tela real entra numa tarefa seguinte. */
import { useRumo } from './useRumo';
import './rumo.css';

export default function Plano() {
  const { metas } = useRumo();
  return (
    <div className="ilha-corpo rm-esq" data-esqueleto="plano">
      <p data-n-metas={metas.length}>{metas.length} metas.</p>
    </div>
  );
}
