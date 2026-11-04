'use client';
/* Missão 2 · sugere marcar os itens do checklist (m2.c1..c3) pelo que o usuário preencheu. Só sugere: quem marca é o usuário. */
import { sugestaoChecklist } from '@/lib/entrega';
import { useEquipe } from './useEquipe';
import './equipe.css';

const ITENS = [
  { k: 'm2.c1', t: 'Escopo de trabalho de cada cargo definido', dica: 'Todas as linhas da tabela de equipe têm escopo.' },
  { k: 'm2.c2', t: 'Organograma do mandato projetado visualmente', dica: 'O organograma gerado tem a Chefia definida.' },
  { k: 'm2.c3', t: 'Fluxos de trabalho e rotinas de comunicação estabelecidos', dica: 'Todas as rotinas ligadas têm data de início.' },
] as const;

export default function SugestaoChecklist() {
  const { c, agir } = useEquipe();
  const sug = sugestaoChecklist(c);
  const pendentes = ITENS.filter((i) => sug[i.k.slice(3) as 'c1' | 'c2' | 'c3'] && !c[i.k]);

  const marca = (k: string) => {
    if (!agir({ patch: { [k]: '1' } })) return;
    /* a lista do checklist é HTML do legado: reabre a tela para mostrar a caixa marcada, mantendo a rolagem */
    const g = (window as unknown as { Guia?: { render(): void } }).Guia, y = window.scrollY;
    if (g) { g.render(); window.scrollTo(0, y); }
  };

  if (pendentes.length === 0) return null;
  return (
    <div className="ilha-corpo es-nao-imprime">
      <div className="apoio" role="status">
        <span className="tag">Sugestão</span>Pelo que você preencheu, estes itens do checklist já podem ser marcados:
        <ul className="es-sugchk">
          {pendentes.map((i) => (
            <li key={i.k}><span>{i.t}<small>{i.dica}</small></span>
              <button type="button" className="bt sec peq es-bt" aria-label={`Marcar como pronto: ${i.t}`} onClick={() => marca(i.k)}>Marcar como pronto</button></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
