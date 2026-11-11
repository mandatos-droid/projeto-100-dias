'use client';
/* Pergunta 3.2 da Missão 1 (conjuntura social do território): um cartão por agenda temática com as notas de ODS e
   os indicadores da UF da liderança, em slides de 4 cartões. Sem mapa. Os registros antigos de D.social não são lidos
   nem alterados (SOC-09). Regras em lib/indicadoresSociais.ts; arquivos em public/data/social (lib/agendas.ts). */
import { useId, useMemo, useState } from 'react';
import { AGENDAS, FAIXAS, carregaCatalogo, carregaIndicador, faixaDe, textoSobre, type Agenda, type Catalogo, type DadosIndicador } from '@/lib/agendas';
import { filtraFaixa, linhasDaAgenda } from '@/lib/indicadoresSociais';
import { nf } from '@/lib/format';
import { useLegado } from './ponte';
import { useCarga } from './pecas';
import Slides from './Slides';

export const MSG_SEM_INDICADORES = 'Não foi possível carregar os indicadores do seu estado agora.';
const FAIXA_OPCOES = [{ v: 'todas', rot: 'Todas' }, ...FAIXAS.map((f) => ({ v: f.rot, rot: f.rot }))];

/** Ids dos arquivos que as 13 agendas usam: nota de cada ODS, indicadores desses ODS e indicadores avulsos. */
function idsNecessarios(cat: Catalogo): string[] {
  const ids = new Set<string>();
  for (const a of AGENDAS) {
    a.ods.forEach((n) => { ids.add(`ods-${n}`); cat.indicadores.filter((i) => i.ods === n).forEach((i) => ids.add(i.id)); });
    (a.extras ?? []).forEach((id) => ids.add(id));
  }
  return [...ids];
}

async function carregaTudo(): Promise<{ cat: Catalogo; dados: Record<string, DadosIndicador | null> }> {
  const cat = await carregaCatalogo();
  if (!cat) throw new Error('sem catálogo'); // vira `erro` em useCarga e mostra a mensagem de SOC-08
  const ids = idsNecessarios(cat);
  const arqs = await Promise.all(ids.map((id) => carregaIndicador(id)));
  return { cat, dados: Object.fromEntries(ids.map((id, k) => [id, arqs[k]])) };
}

export default function AgendasSociais() {
  const { m } = useLegado();
  const uf = (m.uf ?? '').toUpperCase();
  const base = useId();
  const carga = useCarga(uf ? carregaTudo : null, uf);
  const [faixas, setFaixas] = useState<Record<string, string>>({});

  const cartoes = useMemo(() => {
    const c = carga.dados;
    if (!c) return null;
    return AGENDAS.map((a) => ({ a, linhas: linhasDaAgenda(a, c.cat, c.dados, uf) }));
  }, [carga.dados, uf]);

  if (!uf) return <div className="apoio atencao"><span className="tag">Atenção</span>Informe a UF em “Dados do mandato” para ver os indicadores do seu estado.</div>;
  if (carga.carregando) return <p className="sem" role="status">Carregando indicadores de {uf}…</p>;
  if (carga.erro || !cartoes || cartoes.every((c) => !c.linhas.length)) return <div className="erro-cx" role="status">{MSG_SEM_INDICADORES}</div>;

  const cartao = ({ a, linhas }: { a: Agenda; linhas: ReturnType<typeof linhasDaAgenda> }) => {
    const faixa = faixas[a.id] ?? 'todas';
    const vistas = filtraFaixa(linhas, faixa);
    const idSel = `${base}-${a.id}`;
    return (
      <article className="as-cartao" style={{ ['--c' as string]: a.cor }} aria-labelledby={`${idSel}-t`}>
        <header className="as-topo">
          <h4 id={`${idSel}-t`}>{a.rot}</h4>
        <label className="peq-t as-faixa" htmlFor={idSel}>
          <span>Classificação</span>
          <select id={idSel} value={faixa} onChange={(e) => setFaixas((f) => ({ ...f, [a.id]: e.target.value }))}>
            {FAIXA_OPCOES.map((o) => <option key={o.v} value={o.v}>{o.rot}</option>)}
          </select>
        </label>
        </header>
        {vistas.length === 0 ? (
          <p className="sem">{linhas.length ? 'Nenhum indicador nesta classificação.' : `Sem notas de ${uf} para esta agenda.`}</p>
        ) : (
          <div className="as-lista" role="region" tabIndex={0} aria-label={`Lista de indicadores de ${a.rot}`}>
          <table className="as-tab">
            <caption>Indicadores de {a.rot} em {uf}</caption>
            <thead><tr><th scope="col">Indicador</th><th scope="col">ODS relacionada</th><th scope="col">Nota</th></tr></thead>
            <tbody>
              {vistas.map((l) => (
                <tr key={l.indicador}>
                  <td>{l.indicador}</td>
                  <td>ODS {l.ods}{l.odsRot ? ` · ${l.odsRot}` : ''}</td>
                  <td><strong>{nf.format(l.nota)}</strong> <small className="as-fx" style={{ ['--f' as string]: faixaDe(l.nota).cor, ['--ft' as string]: textoSobre(faixaDe(l.nota).cor) }}>{faixaDe(l.nota).rot}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="ilha-corpo">
      <div className="as-slides"><Slides itens={cartoes} tam={4} rotulo="Agendas temáticas" chave={(c) => c.a.id} render={cartao} /></div>
      <p className="peq-t">Notas de 0 a 100 (quanto maior, melhor) do IDSC-BR 2026 para {uf}. Muito baixo: menos de 40 · Baixo: 40 a 49 · Médio: 50 a 59 · Alto: 60 a 79 · Muito alto: 80 ou mais.</p>
    </div>
  );
}
