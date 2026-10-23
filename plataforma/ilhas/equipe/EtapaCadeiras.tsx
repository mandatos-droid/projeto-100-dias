'use client';
/* Etapa 2: ajustar as cadeiras do gabinete (de 1 a 40), agrupadas por área. */
import { useState } from 'react';
import { AREAS, CHEFIA, MAX_CADEIRAS, N_BASE, SEM_AREA, acrescenta, ativas, coordDe, remove } from '@/lib/cadeiras';
import { COR_COORD } from '@/lib/equipe';
import { TEMATICOS, cargoNome, modeloNome } from './cargos';
import { useEquipe } from './useEquipe';

const EM_BRANCO = 'branco';

export default function EtapaCadeiras() {
  const { c, agir } = useEquipe();
  const on = ativas(c);
  const cheio = on.length >= MAX_CADEIRAS;
  const [qual, setQual] = useState(EM_BRANCO);
  const [area, setArea] = useState(SEM_AREA);
  const foraDoModelo = Array.from({ length: N_BASE }, (_, i) => i).filter((i) => !on.includes(i));
  const grupos = ['Chefia de área', ...AREAS, SEM_AREA].map((a) => ({ a, ids: on.filter((i) => coordDe(c, i) === a) })).filter((g) => g.ids.length);

  const tira = (i: number) => {
    const r = remove(c, i);
    if (r.confirma && !window.confirm(`${r.confirma.join(', ')} está nesta cadeira. Remover guarda uma cópia, mas tira a pessoa do gabinete. Remover mesmo assim?`)) return;
    agir(r);
  };
  const escolhe = (v: string) => { setQual(v); if (v !== EM_BRANCO) setArea(coordDe({}, Number(v))); };
  const poe = () => {
    const modelo = qual === EM_BRANCO ? undefined : Number(qual);
    if (agir(acrescenta(c, { modelo, area }))) setQual(EM_BRANCO);
  };

  return (
    <div>
      <p className="rc-ajuda">Tire as cadeiras que o mandato não terá e acrescente as que faltam. O gabinete pode ter de 1 a {MAX_CADEIRAS} cadeiras; a Chefia de gabinete é obrigatória.</p>
      <p className="rc-cont" role="status" aria-live="polite"><strong>{on.length}</strong> de {MAX_CADEIRAS} cadeiras</p>
      {grupos.map(({ a, ids }) => (
        <section key={a} className="es-grupo" style={{ borderTopColor: COR_COORD[a] ?? '#5E524C' }}>
          <header><strong>{a === 'Chefia de área' ? 'Chefia de gabinete' : a}</strong><span>{ids.length} {ids.length === 1 ? 'cadeira' : 'cadeiras'}</span></header>
          <ul>
            {ids.map((i) => (
              <li key={i} className="es-cad">
                <span>
                  {cargoNome(c, i)}
                  {TEMATICOS.includes(i) && <em className="es-tag">Temático</em>}
                </span>
                {i !== CHEFIA && <button type="button" className="bt sec peq es-bt" aria-label={`Remover ${cargoNome(c, i)}`} onClick={() => tira(i)}>Remover</button>}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div className="es-add">
        <label className="eq-campo"><span className="rot">Acrescentar cadeira</span>
          <select value={qual} onChange={(e) => escolhe(e.target.value)}>
            <option value={EM_BRANCO}>Cadeira em branco</option>
            {foraDoModelo.map((i) => <option key={i} value={i}>Do modelo: {modeloNome(i)}</option>)}
          </select></label>
        <label className="eq-campo"><span className="rot">Área</span>
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            {[...AREAS, SEM_AREA].map((a) => <option key={a}>{a}</option>)}
          </select></label>
        <button type="button" className="bt pri peq es-bt" disabled={cheio} onClick={poe}>Acrescentar</button>
      </div>
      {cheio && <p className="es-motivo" role="status">O gabinete já tem as {MAX_CADEIRAS} cadeiras permitidas. Remova uma para acrescentar outra.</p>}
    </div>
  );
}
