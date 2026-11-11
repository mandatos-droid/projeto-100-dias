'use client';
import { useState } from 'react';
import { CATEGORIAS, contagem } from '@/lib/relacoes';
import type { Status } from '@/lib/types';
import { marca, useLegado } from './ponte';
import { Chip, Foto, Marca, anoDoCargo } from './pecas';
import Slides from './Slides';

type Filtro = 'todos' | Exclude<Status, 'neutro'>;
const CARTOES_POR_SLIDE = 3;

/** Carrossel dos parlamentares que a pessoa já classificou na pergunta 2.1 (LEG-08 a LEG-10).
 *  Lê `D.relacoes` a cada renderização, então reclassificar ou remover atualiza cartões e contagens na hora. */
export default function Classificados() {
  const { D } = useLegado();
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const todos = Object.entries(D.relacoes ?? {}).filter(([, r]) => CATEGORIAS.some((c) => c.k === r.status));
  const n = contagem(D.relacoes ?? {});
  const lista = filtro === 'todos' ? todos : todos.filter(([, r]) => r.status === filtro);
  if (!todos.length) {
    return <p className="sem" data-testid="classificados-vazio">Nenhum parlamentar classificado ainda. Classifique na tabela e o cartão aparece aqui.</p>;
  }
  return (
    <div className="classificados" data-testid="classificados">
      <h5 className="classificados-t">Parlamentares classificados</h5>
      <div className="classificados-f" role="group" aria-label="Filtrar por categoria">
        <button type="button" className="chip opc" aria-pressed={filtro === 'todos'} onClick={() => setFiltro('todos')}>
          Todas <b>{todos.length}</b>
        </button>
        {CATEGORIAS.map((c) => (
          <button key={c.k} type="button" className="chip opc" aria-pressed={filtro === c.k} onClick={() => setFiltro(c.k)}>
            <Marca tipo={c.k} tam={11} />{c.rot} <b>{n[c.k] ?? 0}</b>
          </button>
        ))}
      </div>
      <Slides key={filtro} itens={lista} tam={CARTOES_POR_SLIDE} rotulo="Parlamentares classificados" chave={([sq]) => sq}
        vazio={<p className="sem">Nenhum parlamentar nesta categoria.</p>}
        render={([sq, r]) => {
          const { status: st, ...rel } = r;
          return (
            <article className="cartao-class" aria-label={r.nome}>
              <div className="cartao-class-topo">
                <Foto sq={sq} uf={r.uf} ano={anoDoCargo(r.cargo)} nome={r.nome} tam={48} />
                <div>
                  <strong>{r.nome}</strong>
                  <div className="peq-t"><Chip p={r.partido} /> {r.cargo} · {r.uf}</div>
                </div>
              </div>
              <p className="cartao-class-cat"><Marca tipo={st as Exclude<Status, 'neutro'>} tam={13} /> {CATEGORIAS.find((c) => c.k === st)?.rot}</p>
              <select className="cartao-class-troca" aria-label={`Trocar a relação de ${r.nome}`} value={st}
                onChange={(ev) => marca(sq, rel, st, ev.target.value as Status)}>
                {CATEGORIAS.map((c) => <option key={c.k} value={c.k}>{c.rot}</option>)}
              </select>
              <button type="button" className="link-bt" onClick={() => marca(sq, rel, st, st)}>
                Remover classificação<span className="so-leitor"> de {r.nome}</span>
              </button>
            </article>
          );
        }} />
    </div>
  );
}
