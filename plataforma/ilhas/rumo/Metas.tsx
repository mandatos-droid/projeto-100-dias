'use client';
/* Missão 3 · esqueleto da ilha `rumo-metas` (T10); a tela real entra numa tarefa seguinte. */
import { useRumo } from './useRumo';
import './rumo.css';

export default function Metas() {
  const { metas } = useRumo();
  return (
    <div className="ilha-corpo rm-esq" data-esqueleto="rumo-metas">
      <p data-n-metas={metas.length}>{metas.length} metas.</p>
    </div>
  );
}
