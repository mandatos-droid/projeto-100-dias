'use client';
import '@/app/mandato/mandato.css';
import ProvedorLegado from '@/app/mandato/ProvedorLegado';
import { useMandato } from '@/app/mandato/contexto';
import Equipe from '@/app/mandato/equipe/Equipe';
import type { PessoaEquipe } from '@/lib/convites/api';

/* Aba Equipe e convites da Área do mandato (#/config/equipe): a tela Equipe de app/mandato/equipe/, com o contexto do
   Guia (AMA-02.6). Cada lista de pessoas que a tela recebe ou altera vai ao Guia (Area.equipe, acesso.js), que acerta
   Store.membros e o rótulo "Equipe e convites (N)" (AMA-02.7). */

type ComArea = { Area?: { equipe?: (mandato: string, pessoas: PessoaEquipe[]) => void } };

function Aba() {
  const { mandato } = useMandato();
  return <Equipe nivel={2} aoMudarPessoas={(l) => (window as unknown as ComArea).Area?.equipe?.(mandato.id, l)} />;
}

export default function AreaEquipe() {
  // .md traz as cores e a tipografia de mandato.css; dentro do Guia não ocupa a tela inteira nem pinta o fundo
  return (
    <div className="md" style={{ minHeight: 0, background: 'transparent' }}>
      <ProvedorLegado><div className="md-tela"><Aba /></div></ProvedorLegado>
    </div>
  );
}
