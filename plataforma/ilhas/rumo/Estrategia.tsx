'use client';
/* Missão 3 · estratégia dos Objetivos Estratégicos (A, B ou C). Só decide o TEXTO do nó de cada preditor na árvore:
   a estrutura e as metas não mudam em nenhuma opção (RM3-16). Estado: D.campos['m3.est'] e 'm3.obj.{pid}' (frase da opção B). */
import { OBJ_ESPECIFICOS, PREDITORES } from '@/lib/plano';
import { OBJETIVOS_LEGISLA, defineEstrategia, lerEstrategia, type Estrategia as Opcao } from '@/lib/estrategia';
import ArvorePlano from './ArvorePlano';
import { useRumo } from './useRumo';
import './rumo.css';

/* OBJ_ESPECIFICOS segue a ordem do Guia, que troca o 3º e o 4º preditor de lugar em relação a PREDITORES */
const EXEMPLO: Record<string, number> = { p1: 0, p2: 1, p3: 3, p4: 2, p5: 4 };

const OPCOES: { id: Opcao; rot: string; texto: string }[] = [
  { id: 'a', rot: 'A', texto: 'Os preditores selecionados se tornarão os Objetivos Estratégicos do mandato.' },
  { id: 'b', rot: 'B', texto: 'Os preditores serão traduzidos em outra frase, que serão os Objetivos Estratégicos.' },
  { id: 'c', rot: 'C', texto: 'Os preditores apenas nortearão as Metas; os Objetivos Estratégicos serão os 3 sugeridos pela Legisla: 1. Avanço Legislativo; 2. Expansão de Capital Político e Influência; 3. Governança Estratégica.' },
];

export default function Estrategia() {
  const { c, arv, setCampos } = useRumo();
  const escolhidos = arv.objetivos.map((o) => o.pid);
  const atual = lerEstrategia(c, escolhidos);

  const escolhe = (e: Opcao) => {
    if (e === atual) return;
    if (atual && !window.confirm('Trocar a estratégia muda só o texto dos objetivos na árvore. As metas ficam onde estão e o texto da opção anterior fica guardado. Trocar mesmo?')) return;
    setCampos(defineEstrategia(c, e));
  };

  return (
    <div className="ilha-corpo rm-pred rm-est">
      <div className="rm-grade">
        <section>
          <h4 id="rm-est-op">Escolha uma estratégia</h4>
          <div role="radiogroup" aria-labelledby="rm-est-op" className="rm-est-ops">
            {OPCOES.map((o) => (
              <label key={o.id} className={`rm-est-op${atual === o.id ? ' on' : ''}`} data-estrategia={o.id}>
                <input type="radio" name="rm-estrategia" checked={atual === o.id} onChange={() => escolhe(o.id)} />
                <span><b>{o.rot}.</b> {o.texto}</span>
              </label>
            ))}
          </div>

          {atual === 'b' && (
            <div className="rm-est-frases">
              <h4>A frase de cada preditor</h4>
              {escolhidos.length === 0 && <p className="rm-dica">Escolha os preditores no exercício acima para escrever uma frase para cada um.</p>}
              {escolhidos.map((pid) => {
                const p = PREDITORES.find((x) => x.id === pid)!;
                const chave = `m3.obj.${pid}`;
                return (
                  <label key={pid} className="campo" data-frase={pid}><span className="rot">Objetivo Estratégico de {p.n}</span>
                    <input type="text" value={c[chave] ?? ''} onChange={(e) => setCampos({ [chave]: e.target.value })}
                      placeholder={`Ex.: ${OBJ_ESPECIFICOS[EXEMPLO[pid]][1]}`} />
                    <span className="rm-dica">Se ficar vazio, a árvore usa o nome do preditor.</span>
                  </label>
                );
              })}
            </div>
          )}

          {atual === 'c' && (
            <div className="rm-est-ref" role="note">
              <h4>Objetivos Estratégicos sugeridos pela Legisla</h4>
              <ol>{OBJETIVOS_LEGISLA.map((t) => <li key={t}>{t}</li>)}</ol>
              <p className="rm-dica">Ficam registrados como referência do mandato. Na árvore, cada preditor segue com o seu nome e as metas não mudam.</p>
            </div>
          )}
        </section>
        <aside className="rm-direita" aria-labelledby="rm-arv-t">
          <h4 id="rm-arv-t">Árvore do planejamento</h4>
          <ArvorePlano modo="previa" arv={arv} />
        </aside>
      </div>
    </div>
  );
}
