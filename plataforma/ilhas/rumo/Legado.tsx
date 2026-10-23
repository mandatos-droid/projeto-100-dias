'use client';
/* Missão 3 · esqueleto da ilha `rumo-legado` (T10); a tela real entra numa tarefa seguinte. */
import { useRumo } from './useRumo';
import './rumo.css';

export default function Legado() {
  useRumo();
  return (
    <div className="ilha-corpo rm-esq" data-esqueleto="rumo-legado">
      <p>Legado: em construção.</p>
    </div>
  );
}
