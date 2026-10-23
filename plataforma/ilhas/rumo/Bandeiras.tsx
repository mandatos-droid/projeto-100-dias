'use client';
/* Missão 3 · esqueleto da ilha `rumo-bandeiras` (T10); a tela real entra numa tarefa seguinte. */
import { useRumo } from './useRumo';
import './rumo.css';

export default function Bandeiras() {
  const { rumo } = useRumo();
  return (
    <div className="ilha-corpo rm-esq" data-esqueleto="rumo-bandeiras">
      <p data-n-bandeiras={rumo.bandeiras.length}>{rumo.bandeiras.length} bandeiras no mural.</p>
    </div>
  );
}
