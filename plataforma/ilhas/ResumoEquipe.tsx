'use client';
/* "A escalação do time" no Resumo do preenchimento (RES-09): organograma somente leitura, com a Chefia de gabinete no topo,
   um ramo por área e os cargos em três estados (preenchido, processo seletivo a abrir, ainda sem nome). CSS em ilhas.css. */
import type { CSSProperties } from 'react';
import { arvore, type Cartao } from '@/lib/resumoEquipe';
import { vistaDaTabela } from '@/lib/tabelaEquipe';
import { modeloNome } from './equipe/cargos';
import { useLegado } from './ponte';

const TEXTO = { ok: '', vaga: 'Processo seletivo a abrir', aberto: 'Sem nome' };

function Car({ c, chefe }: { c: Cartao; chefe?: boolean }) {
  return (
    <div className={`car${c.estado === 'ok' ? '' : ` ${c.estado}`}${chefe ? ' chefe' : ''}`}>
      <small>{c.cargo}</small>
      <strong>{c.estado === 'ok' ? c.pessoa : TEXTO[c.estado]}</strong>
    </div>
  );
}

export default function ResumoEquipe() {
  const { D } = useLegado();
  /* mandato do formato antigo: a mesma vista derivada da tabela e do PDF da Missão 2 (RES-09.5) */
  const { chefia, ramos } = arvore(vistaDaTabela(D.campos, modeloNome));
  if (!chefia && !ramos.length) return <span className="sem">não preenchido</span>;
  return (
    <div className="org-bloco">
      <div className="org-leg" aria-label="Legenda do organograma">
        <span><i className="ok" />Preenchido</span>
        <span><i className="vaga" />Processo seletivo a abrir</span>
        <span><i className="aberto" />Ainda sem nome</span>
      </div>
      <div className={`org${chefia && ramos.length ? ' com-raiz' : ''}`} style={{ '--n': Math.max(ramos.length, 1) } as CSSProperties}>
        {chefia && <div className="org-raiz"><Car c={chefia} chefe /></div>}
        {ramos.length > 0 && (
          <div className="org-ram">
            {ramos.map((r) => (
              <div className="ram" key={r.area} style={{ '--c': r.cor ?? 'var(--linha)' } as CSSProperties}>
                <h5>{r.area}</h5>
                {r.cartoes.map((c) => <Car key={c.i} c={c} />)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
