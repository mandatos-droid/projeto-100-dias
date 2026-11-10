'use client';
/* Cabeçalho do Resumo do preenchimento (RES-06): cartão da parlamentar (foto do TSE ou a inicial) ao lado dos números que
   têm fonte. Cada número sem fonte, ou cuja carga falhou, some sem deixar traço; o resto da tela segue. */
import { useState, type CSSProperties } from 'react';
import { carregaFiliadosUF, carregaNacional, carregaUF } from '@/lib/dados';
import { fotoUrl, inicial, numeros, type Numero } from '@/lib/resumoRetrato';
import { linhas, migrada, vistaDaTabela } from '@/lib/tabelaEquipe';
import { modeloNome } from './equipe/cargos';
import { useCarga } from './pecas';
import { useLegado } from './ponte';

/* Casa do mandato: o mesmo nível de cadeiras da Conjuntura (ilhas/cargos.ts, NIVEIS) para o cargo do cadastro.
   SPEC_DEVIATION: deputado federal e senador leem o total da Casa em nacional.json (coluna "Brasil" da Conjuntura), não a
   bancada da UF em carregaUF. Reason: carregaUF só tem as cadeiras eleitas na UF; "na Câmara dos Deputados" com esse número
   seria falso. Vereador fica sem o número: a Câmara Municipal não está nessas fontes. */
const CASA: Record<string, { k: 'estadual' | 'federal' | 'senado'; nome: string }> = {
  'Deputado(a) Estadual': { k: 'estadual', nome: 'Assembleia Legislativa' },
  'Deputado(a) Federal': { k: 'federal', nome: 'Câmara dos Deputados' },
  'Senador(a)': { k: 'senado', nome: 'Senado Federal' },
};
const COR: Record<Numero['id'], string> = { votos: 'var(--turquesa)', cadeiras: 'var(--turquesa)', filiados: 'var(--turquesa)', equipe: 'var(--coral)' };

type Tse = { sq?: string | number; uf?: string; cargo?: string; votos?: number; pos?: number; partido?: string };

export default function ResumoRetrato() {
  const { D, m } = useLegado();
  const t = (D.tse ?? {}) as Tse;
  const uf = (m.uf || t.uf || '').toUpperCase();
  const partido = (m.partido || t.partido || '').toUpperCase();
  const casa = CASA[m.cargo];
  const daUF = useCarga(uf && casa?.k === 'estadual' ? () => carregaUF(uf) : null, `uf:${uf}`);
  const nac = useCarga(casa && casa.k !== 'estadual' ? () => carregaNacional() : null, 'nac');
  const fil = useCarga(uf && partido ? () => carregaFiliadosUF(uf) : null, `fil:${uf}`);
  const [falhou, setFalhou] = useState(false);

  const mapa = casa ? (casa.k === 'estadual' ? daUF.dados?.cadeiras.estadual : nac.dados?.[casa.k]) : undefined;
  const filiados = fil.dados ? fil.dados.uf[partido]?.[0] ?? 0 : undefined;
  /* linhas ativas como a Missão 2 conta: só depois que a tabela começou (m2.n gravado ou mandato do formato antigo) */
  const comecou = D.campos['m2.n'] !== undefined || migrada(D.campos);
  const ls = comecou ? linhas(vistaDaTabela(D.campos, modeloNome)) : [];
  const nums = numeros({
    tse: { votos: t.votos, pos: t.pos, uf: t.uf || uf },
    partido, uf,
    casa: casa ? m.casa || casa.nome : null,
    cadeiras: mapa ? mapa[partido] ?? 0 : undefined,
    filiados,
    equipe: { comNome: ls.filter((l) => l.pessoa !== '' && !l.processoSeletivo).length, ativas: ls.length, vagas: ls.filter((l) => l.processoSeletivo).length },
  });

  const nome = m.nome_parlamentar || m.nome_civil || '';
  const foto = falhou ? null : fotoUrl({ sq: t.sq, uf: t.uf || uf, cargo: t.cargo || m.cargo });
  return (
    <section className="retrato" aria-label="Retrato do mandato">
      <div className="parl">
        <div className="foto">
          {foto
            ? <img src={foto} alt={`Foto de ${nome}`} referrerPolicy="no-referrer" onError={() => setFalhou(true)} />
            : <span aria-hidden="true">{inicial(nome)}</span>}
        </div>
        <div className="id">
          <strong>{nome}</strong>
          <span>{[m.cargo, uf].filter(Boolean).join(' · ')}</span>
          {partido && <span>{partido}</span>}
        </div>
      </div>
      {nums.length > 0 && (
        <div className="retrato-num">
          {nums.map((n) => (
            <div className="stat" key={n.id} data-num={n.id} style={{ '--c': COR[n.id] } as CSSProperties}>
              <b>{n.valor}</b><span>{n.rotulo}</span>{n.legenda && <em>{n.legenda}</em>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
