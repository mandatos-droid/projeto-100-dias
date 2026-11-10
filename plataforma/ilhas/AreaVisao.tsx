'use client';
import '@/app/mandato/mandato.css';
import { CartaoMandato } from '@/app/mandato/AreaMandato';
import Atividade from '@/app/mandato/Atividade';
import ProvedorLegado from '@/app/mandato/ProvedorLegado';
import ResumoEquipe from '@/app/mandato/ResumoEquipe';
import { useMandato } from '@/app/mandato/contexto';

/* Aba Visão geral da Área do mandato (#/config): cartão do mandato com o papel da pessoa, resumo da equipe e atividade
   recente (AMA-02.1). O andamento dos 100 dias e as missões ficam no Painel do mandato, não aqui. Sem data de posse,
   um aviso leva à aba Dados (AMA-02.2). Os componentes são os de app/mandato/, com o contexto vindo do Guia. */

export const AVISO_POSSE = 'Informe a data de posse para acompanhar os prazos.';

function Visao() {
  const { mandato } = useMandato();
  return (
    <div className="md-tela">
      {!mandato.data_posse && (
        <p className="md-aviso" role="status">{AVISO_POSSE} <a href="#/config/dados">Informar agora</a></p>
      )}
      <CartaoMandato nivel={2} />
      <ResumoEquipe convidar="#/config/equipe" />
      <Atividade />
    </div>
  );
}

export default function AreaVisao() {
  // .md traz as cores e a tipografia de mandato.css; dentro do Guia não ocupa a tela inteira nem pinta o fundo
  return (
    <div className="md" style={{ minHeight: 0, background: 'transparent' }}>
      <ProvedorLegado><Visao /></ProvedorLegado>
    </div>
  );
}
