'use client';
import { useState } from 'react';
import Calor from './Calor';
import CalorV2 from './CalorV2';
import { dadosGuia, salva } from './ponte';

/** Alterna entre a versão 1 (mapa de calor, atual) e a versão 2 (conjuntura partidária) da pergunta. */
export default function CalorSwitch() {
  const [ver, setVer] = useState<1 | 2>(dadosGuia().calorVer ?? 1);
  const troca = (v: 1 | 2) => { setVer(v); dadosGuia().calorVer = v; salva(); };
  return (
    <>
      <div className="abas v2-ver" role="tablist" aria-label="Versão da tela">
        <button type="button" role="tab" aria-selected={ver === 1} onClick={() => troca(1)}>Versão 1 · atual</button>
        <button type="button" role="tab" aria-selected={ver === 2} onClick={() => troca(2)}>Versão 2 · conjuntura partidária</button>
      </div>
      {ver === 1 ? <Calor /> : <CalorV2 />}
    </>
  );
}
