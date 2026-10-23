'use client';
/* Missão 3 · esqueleto da ilha `rumo-espacos` (T10); a tela real entra numa tarefa seguinte. */
import { useRumo } from './useRumo';
import './rumo.css';

export default function Espacos() {
  useRumo();
  return (
    <div className="ilha-corpo rm-esq" data-esqueleto="rumo-espacos">
      <p>Espaços: em construção.</p>
    </div>
  );
}
