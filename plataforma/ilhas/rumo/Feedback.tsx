'use client';
/* Missão 5 · feedback estruturado. Nível 1: o mapa do organograma da Missão 2, com cada liderança, quantas pessoas ela
   lidera e quantas conversas já foram feitas. Estado: D.feedbacks (lib/feedback.ts lê o formato novo e o antigo). */
import { coordDe, liderDe } from '@/lib/cadeiras';
import { contagens, migraAntigo, type LiderancaContada } from '@/lib/feedback';
import { COR_COORD } from '@/lib/equipe';
import { cargoNome } from '../equipe/cargos';
import { useLegado } from '../ponte';
import './feedback.css';

export default function Feedback() {
  const { D } = useLegado();
  const c = D.campos;
  const mapa = contagens(c, migraAntigo(D.feedbacks, c));
  const ids = new Set(mapa.map((l) => l.i));
  /* a liderança vem pendurada na liderança dela quando esta também aparece no mapa; senão é raiz */
  const filhos = (i: number | null) => mapa.filter((l) => { const p = liderDe(c, l.i); return (p !== null && ids.has(p) ? p : null) === i; });

  const no = (l: LiderancaContada): React.ReactElement => {
    const sub = filhos(l.i);
    return (
      <li key={l.i} className="fb-no">
        <div className="fb-card" data-lider={l.i} style={{ borderTopColor: COR_COORD[coordDe(c, l.i)] ?? '#5E524C' }}>
          <strong className="fb-nome">{l.nome || 'Vaga em aberto'}</strong>
          <span className="fb-cargo">{cargoNome(c, l.i)}</span>
          <span className="fb-da">dá feedback a {l.n} {l.n === 1 ? 'pessoa' : 'pessoas'}</span>
          <span className={'fb-cont' + (l.feitas === l.n ? ' ok' : '')}>feitas {l.feitas} de {l.n}</span>
        </div>
        {sub.length > 0 && <ul className="fb-filhos">{sub.map(no)}</ul>}
      </li>
    );
  };

  return (
    <div className="ilha-corpo rm-fb">
      <p className="rm-dica">Cada liderança dá feedback às pessoas que lidera no organograma da Missão 2.</p>
      <ul className="fb-arvore" aria-label="Mapa de feedback pelo organograma">{filhos(null).map(no)}</ul>
    </div>
  );
}
